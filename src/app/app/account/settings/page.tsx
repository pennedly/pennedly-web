"use client";

// Account Settings (/app/account/settings) — account-LEVEL settings in the
// account-dashboard chrome (its own sidebar, breadcrumb «Аккаунт › Настройки»),
// NOT the per-profile settings. Tester-gated for now (like the account dashboard
// — the whole /app/account area is a review deploy); non-testers keep the
// current /app/settings. Maps to real endpoints: name → PATCH /api/me, language
// → PUT /api/me/locale, export → GET /api/me/export, delete → DELETE /api/me.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
import { ApiError, clearTokens, fetchMe, fetchMeAccount, getTokens } from "@/lib/api";
import { pluralUnit, useTranslation } from "@/lib/i18n";
import { ErrorBanner } from "@/components/ui/error-banner";
import type { Me, MeAccountResponse } from "@/lib/types";

type Phase = "loading" | "ready" | "error";

export default function AccountSettingsPage() {
  const router = useRouter();
  const { t, locale } = useTranslation();

  const [phase, setPhase] = useState<Phase>("loading");
  const [me, setMe] = useState<Me | null>(null);
  const [data, setData] = useState<MeAccountResponse | null>(null);

  useEffect(() => {
    if (!getTokens()) {
      router.push("/app/login");
      return;
    }
    let alive = true;
    (async () => {
      try {
        const m = await fetchMe();
        if (!alive) return;
        if (m.is_tester !== true) {
          router.replace("/app/overview");
          return;
        }
        const acc = await fetchMeAccount();
        if (!alive) return;
        // Durable dashboard: only a truly-empty tenant (never connected) goes to
        // the wizard. An all-disconnected tenant (0 live, ≥1 disconnected) stays
        // in the account chrome — the AllDisconnected sidebar links here, so
        // bouncing mid-reconnect would read as a logout. Mirrors account/page.tsx.
        if (acc.scope.profiles_count === 0 && acc.scope.disconnected_count === 0) {
          router.replace("/app/onboarding");
          return;
        }
        setMe(m);
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
