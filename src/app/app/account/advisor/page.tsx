"use client";

// Portfolio Advisor chat (/app/account/advisor) — account-scope advisor chat in
// the account-dashboard chrome. Tester-gated (like the dashboard — this whole
// /app/account area is a review deploy). The dashboard advisor verdict is pinned
// at the top (GET /api/me/account/advisor, fetched separately so it never blocks
// the chat); the conversation runs against POST /api/me/account/advisor/chat.

import { useEffect, useState } from "react";

import "@/components/account/account.css";
import "@/components/account/account-mobile-shell.css";
import "@/components/account/account-mobile.css";
import "@/components/account/account-screens.css";
import "@/components/account/account-screens-mobile.css";

import { AccountAdvisorChat, AccountMobileAdvisorChat } from "@/components/account/AccountAdvisorChat";
import type { Plural, T } from "@/components/account/AccountDashboard";
import { loadAdvisor, peekAdvisor } from "@/lib/account-data";
import { useAccountData } from "@/lib/use-account-data";
import { pluralUnit, useTranslation } from "@/lib/i18n";
import { ErrorBanner } from "@/components/ui/error-banner";
import type { AdvisorData } from "@/lib/types";

export default function AccountAdvisorPage() {
  const { t, locale } = useTranslation();
  // Shared cache: re-visiting from the dashboard/settings renders instantly.
  const { data, phase } = useAccountData();
  // The pinned verdict is cached too (seeded from memory on the first paint),
  // and never blocks the chat — a miss/204 shows the honest thin-data cap.
  const [adv, setAdv] = useState<AdvisorData | null>(peekAdvisor());

  useEffect(() => {
    if (phase !== "ready") return;
    let alive = true;
    loadAdvisor()
      .then((a) => {
        if (alive) setAdv(a);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [phase]);

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
