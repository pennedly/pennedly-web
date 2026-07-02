"use client";

// Account dashboard (/app/account) — the portfolio home, Account → Brands →
// Profiles. Renders its OWN account-level sidebar (shell-exempt in layout.tsx),
// NOT the profile shell. Data from GET /api/me/account. TESTER-GATED for now
// (a review deploy): non-testers are sent to the current /app/overview until the
// screen is finished + promoted. Adaptive: at one brand the cards are profiles;
// at 2+ they are brands (scope.show_brand_level).

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import "@/components/account/account.css";
import "@/components/account/account-mobile.css";
import "@/components/account/import-banner.css";

import { AccountDashboard, AccountSkeleton } from "@/components/account/AccountDashboard";
import type { Plural, T } from "@/components/account/AccountDashboard";
import { ApiError, clearTokens, fetchMe, fetchMeAccount, getTokens } from "@/lib/api";
import { pluralUnit, useTranslation } from "@/lib/i18n";
import { ErrorBanner } from "@/components/ui/error-banner";
import type { MeAccountResponse } from "@/lib/types";

type Phase = "loading" | "ready" | "error";

export default function AccountDashboardPage() {
  const router = useRouter();
  const { t, locale } = useTranslation();

  const [phase, setPhase] = useState<Phase>("loading");
  const [data, setData] = useState<MeAccountResponse | null>(null);

  useEffect(() => {
    if (!getTokens()) {
      router.push("/app/login");
      return;
    }
    let alive = true;
    (async () => {
      try {
        // Tester gate: this screen is round-2 (in-progress). Non-testers keep the
        // current portfolio Overview until it's promoted.
        const me = await fetchMe();
        if (!alive) return;
        if (me.is_tester !== true) {
          router.replace("/app/overview");
          return;
        }
        const acc = await fetchMeAccount();
        if (!alive) return;
        // No profile connected yet → the account isn't set up; send to onboarding
        // (the dashboard has nothing to show and the design routes empty here).
        if (acc.scope.profiles_count === 0) {
          router.replace("/app/onboarding");
          return;
        }
        setData(acc);
        setPhase("ready");
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

  // The account.css layer is width-tokened (--content-wide); center it like the
  // other data screens.
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
          <div className="acc-shell">
            <div />
            <AccountSkeleton />
          </div>
        </div>
      </div>
    );
  }

  const tt: T = (k) => t(k as Parameters<typeof t>[0]);
  const plural: Plural = (unit, n) => pluralUnit(locale, unit, n);

  return (
    <div className="min-h-screen bg-bg text-text">
      <div className={wrap}>
        <AccountDashboard
          data={data}
          t={tt}
          plural={plural}
          onOpenAdvisor={() => router.push("/app/advisor")}
        />
      </div>
    </div>
  );
}
