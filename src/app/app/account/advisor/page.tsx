"use client";

// Portfolio Advisor chat (/app/account/advisor) — account-scope advisor chat in
// the account-dashboard chrome. Tester-gated (like the dashboard — this whole
// /app/account area is a review deploy). The dashboard advisor verdict is pinned
// at the top (GET /api/me/account/advisor, fetched separately so it never blocks
// the chat); the conversation runs against POST /api/me/account/advisor/chat.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import "@/components/account/account.css";
import "@/components/account/account-mobile-shell.css";
import "@/components/account/account-mobile.css";
import "@/components/account/account-screens.css";
import "@/components/account/account-screens-mobile.css";

import { AccountAdvisorChat, AccountMobileAdvisorChat } from "@/components/account/AccountAdvisorChat";
import type { Plural, T } from "@/components/account/AccountDashboard";
import {
  ApiError,
  clearTokens,
  fetchMe,
  fetchMeAccount,
  fetchMeAccountAdvisor,
  getTokens,
} from "@/lib/api";
import { pluralUnit, useTranslation } from "@/lib/i18n";
import { ErrorBanner } from "@/components/ui/error-banner";
import type { AdvisorData, MeAccountResponse } from "@/lib/types";

type Phase = "loading" | "ready" | "error";

export default function AccountAdvisorPage() {
  const router = useRouter();
  const { t, locale } = useTranslation();

  const [phase, setPhase] = useState<Phase>("loading");
  const [data, setData] = useState<MeAccountResponse | null>(null);
  const [adv, setAdv] = useState<AdvisorData | null>(null);

  useEffect(() => {
    if (!getTokens()) {
      router.push("/app/login");
      return;
    }
    let alive = true;
    (async () => {
      try {
        const me = await fetchMe();
        if (!alive) return;
        if (me.is_tester !== true) {
          router.replace("/app/overview");
          return;
        }
        const acc = await fetchMeAccount();
        if (!alive) return;
        if (acc.scope.profiles_count === 0) {
          router.replace("/app/onboarding");
          return;
        }
        setData(acc);
        setPhase("ready");
        // The pinned verdict loads separately (cached, sometimes an LLM call) so a
        // miss/204 never blocks the chat — it just shows the honest thin-data cap.
        fetchMeAccountAdvisor()
          .then((a) => {
            if (alive) setAdv(a);
          })
          .catch(() => {});
      } catch (e) {
        if (!alive) return;
        if (e instanceof ApiError && e.status === 401) {
          clearTokens();
          router.push("/app/login");
          return;
        }
        setPhase("error");
      }
    })();
    return () => {
      alive = false;
    };
  }, [router]);

  const wrap = "mx-auto w-full max-w-[1180px] px-4 py-5 md:px-6 md:py-6";

  if (phase === "error") {
    return (
      <div className="min-h-screen bg-bg text-text">
        <div className={wrap}>
          <ErrorBanner
            title={t("acc.error_title")}
            subtitle={t("acc.error_sub")}
            onRetry={() => window.location.reload()}
          />
        </div>
      </div>
    );
  }

  if (phase === "loading" || !data) {
    return (
      <div className="min-h-screen bg-bg text-text">
        <div className={wrap}>
          <div className="acc-set-skel" style={{ height: 480, borderRadius: 14 }} />
        </div>
      </div>
    );
  }

  const tt: T = (k) => t(k as Parameters<typeof t>[0]);
  const plural: Plural = (unit, n) => pluralUnit(locale, unit, n);

  return (
    <div className="min-h-screen bg-bg text-text">
      <div className={wrap}>
        <div className="hidden md:block">
          <AccountAdvisorChat data={data} adv={adv} t={tt} />
        </div>
        <div className="md:hidden">
          <AccountMobileAdvisorChat data={data} adv={adv} t={tt} plural={plural} />
        </div>
      </div>
    </div>
  );
}
