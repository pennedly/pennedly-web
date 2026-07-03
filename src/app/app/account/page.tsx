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
import "@/components/account/account-mobile-shell.css";
import "@/components/account/account-mobile.css";
import "@/components/account/import-banner.css";

import { AccountDashboard, AccountSkeleton } from "@/components/account/AccountDashboard";
import type { Plural, T } from "@/components/account/AccountDashboard";
import { AccountMobileDashboard, AccountMobileSkeleton } from "@/components/account/AccountMobileDashboard";
import { AppFooter } from "@/components/AppFooter";
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

export default function AccountDashboardPage() {
  const router = useRouter();
  const { t, locale } = useTranslation();

  const [phase, setPhase] = useState<Phase>("loading");
  const [data, setData] = useState<MeAccountResponse | null>(null);
  // The advisor hero loads SEPARATELY (a cached, sometimes-LLM call) so it never
  // blocks the dashboard. Null until it arrives / on 204 (thin data) / on error
  // → the honest AdvisorInvite renders instead of a fabricated verdict.
  const [adv, setAdv] = useState<AdvisorData | null>(null);

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
        // Fire-and-forget: the hero verdict fills in when ready; a failure or a
        // 204 (thin data) just leaves the honest invite in place.
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
          <div className="hidden md:block">
            <div className="acc-shell">
              <div />
              <AccountSkeleton />
            </div>
          </div>
          <div className="md:hidden">
            <AccountMobileSkeleton />
          </div>
        </div>
      </div>
    );
  }

  const tt: T = (k) => t(k as Parameters<typeof t>[0]);
  const plural: Plural = (unit, n) => pluralUnit(locale, unit, n);

  return (
    // Sticky-footer column: content grows, the footer pins to the bottom on
    // short pages. The footer is DESKTOP-only — the mobile dashboard has its own
    // bottom chrome (the fixed profile switcher), so a footer there would clash.
    <div className="flex min-h-screen flex-col bg-bg text-text">
      <div className="flex-1">
        <div className={wrap}>
          {/* Desktop (≥ md) and mobile (< md) render together; a CSS breakpoint
              picks one, so there's no JS-breakpoint hydration flicker. */}
          <div className="hidden md:block">
            <AccountDashboard
              data={data}
              adv={adv ?? undefined}
              t={tt}
              plural={plural}
              onOpenAdvisor={() => router.push("/app/account/advisor")}
            />
          </div>
          <div className="md:hidden">
            <AccountMobileDashboard
              data={data}
              adv={adv ?? undefined}
              t={tt}
              plural={plural}
              onOpenAdvisor={() => router.push("/app/account/advisor")}
            />
          </div>
        </div>
      </div>
      <div className="hidden md:block">
        <AppFooter />
      </div>
    </div>
  );
}
