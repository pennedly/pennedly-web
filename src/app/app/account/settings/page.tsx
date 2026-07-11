"use client";

// Account Settings (/app/account/settings) — account-LEVEL settings in the
// account-dashboard chrome (its own sidebar, breadcrumb «Аккаунт › Настройки»),
// NOT the per-profile settings. Tester-gated for now (like the account dashboard
// — the whole /app/account area is a review deploy); non-testers keep the
// current /app/settings. Maps to real endpoints: name → PATCH /api/me, language
// → PUT /api/me/locale, export → GET /api/me/export, delete → DELETE /api/me.

import "@/components/account/account.css";
import "@/components/account/account-mobile-shell.css";
import "@/components/account/account-mobile.css";
import "@/components/account/account-screens.css";
import "@/components/account/account-screens-mobile.css";

import {
  AccountSettings,
  AccountSettingsSkeleton,
  AccountMobileSettings,
  AccountMobileSettingsSkeleton,
} from "@/components/account/AccountSettings";
import type { Plural, T } from "@/components/account/AccountDashboard";
import { AppFooter } from "@/components/AppFooter";
import { useAccountData } from "@/lib/use-account-data";
import { pluralUnit, useTranslation } from "@/lib/i18n";
import { ErrorBanner } from "@/components/ui/error-banner";

export default function AccountSettingsPage() {
  const { t, locale } = useTranslation();
  // Shared cache: re-visiting from the dashboard/advisor renders instantly.
  const { me, data, phase } = useAccountData();

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

  if (phase === "loading" || !data || !me) {
    return (
      <div className="min-h-screen bg-bg text-text">
        <div className={wrap}>
          <div className="hidden md:block">
            <div className="acc-shell">
              <div />
              <AccountSettingsSkeleton />
            </div>
          </div>
          <div className="md:hidden">
            <AccountMobileSettingsSkeleton />
          </div>
        </div>
      </div>
    );
  }

  const tt: T = (k) => t(k as Parameters<typeof t>[0]);
  const plural: Plural = (unit, n) => pluralUnit(locale, unit, n);

  return (
    <div className="flex min-h-screen flex-col bg-bg text-text">
      <div className="flex-1">
        <div className={wrap}>
          <div className="hidden md:block">
            <AccountSettings data={data} me={me} t={tt} />
          </div>
          <div className="md:hidden">
            <AccountMobileSettings data={data} me={me} t={tt} plural={plural} />
          </div>
        </div>
      </div>
      <div className="hidden md:block">
        <AppFooter />
      </div>
    </div>
  );
}
