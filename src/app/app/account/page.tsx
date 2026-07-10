"use client";

// Account dashboard (/app/account) — the portfolio home, Account → Brands →
// Profiles. Renders its OWN account-level sidebar (shell-exempt in layout.tsx),
// NOT the profile shell. Data from GET /api/me/account. TESTER-GATED for now
// (a review deploy): non-testers are sent to the current /app/overview until the
// screen is finished + promoted. Adaptive: at one brand the cards are profiles;
// at 2+ they are brands (scope.show_brand_level).

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import "@/components/account/account.css";
import "@/components/account/account-mobile-shell.css";
import "@/components/account/account-mobile.css";
import "@/components/account/account-empty.css";
import "@/components/account/account-empty-mobile.css";
import "@/components/account/import-banner.css";

import { AccountDashboard, AccountSkeleton } from "@/components/account/AccountDashboard";
import type { Plural, T } from "@/components/account/AccountDashboard";
import { AllDisconnected, FirstConnect } from "@/components/account/AccountEmpty";
import {
  AccountMobileAllDisconnected,
  AccountMobileDashboard,
  AccountMobileSkeleton,
} from "@/components/account/AccountMobileDashboard";
import { AppFooter } from "@/components/AppFooter";
import {
  ApiError,
  clearTokens,
  fetchMe,
  fetchMeAccount,
  fetchMeAccountAdvisor,
  fetchMyAccounts,
  fetchOnboardingStatus,
  getTokens,
  setAccountTimezone,
} from "@/lib/api";
import { captureEvent } from "@/lib/analytics";
import { isOnboardingSkipped, setSelectedAccountId } from "@/lib/account";
import { pluralUnit, useTranslation } from "@/lib/i18n";
import { ErrorBanner } from "@/components/ui/error-banner";
import { Toast, ToastHost } from "@/components/ui/toast";
import type { AdvisorData, MeAccountResponse } from "@/lib/types";

type Phase = "loading" | "ready" | "error";

// While any profile is mid-backfill the dashboard re-fetches itself so the
// «Импортируем историю» card shows LIVE counts and flips to synced the moment
// `initial_sync` finishes — without this the card sat on «0 постов · 0
// комментариев» forever until a manual reload (the 2026-07-10 report).
const IMPORT_POLL_MS = 7000;
const IMPORT_POLL_MAX = 60; // ~7 min — past any realistic backfill

function anyImporting(acc: MeAccountResponse): boolean {
  return acc.brands.some((b) => b.profiles.some((p) => p.sync_status === "importing"));
}

export default function AccountDashboardPage() {
  const router = useRouter();
  const { t, locale } = useTranslation();

  const [phase, setPhase] = useState<Phase>("loading");
  const [data, setData] = useState<MeAccountResponse | null>(null);
  // The advisor hero loads SEPARATELY (a cached, sometimes-LLM call) so it never
  // blocks the dashboard. Null until it arrives / on 204 (thin data) / on error
  // → the honest AdvisorInvite renders instead of a fabricated verdict.
  const [adv, setAdv] = useState<AdvisorData | null>(null);
  const [toastMsg, setToastMsg] = useState<{ text: string; tone: "success" | "error" } | null>(null);
  // Auto-dismiss the landing toast (the Toast component itself is inert).
  useEffect(() => {
    if (!toastMsg) return;
    const id = window.setTimeout(() => setToastMsg(null), 4800);
    return () => window.clearTimeout(id);
  }, [toastMsg]);

  // ── post-OAuth landing (threads_connected=1 → this page is the return_to of
  // the add-flow). Mirrors the Studio handler: toast + switch the selected
  // account to the just-connected one + seed its timezone — and, the missing
  // piece Zakhar hit on the reganomika1 re-onboarding test: a brand-new account
  // NEEDS ITS VOICE ONBOARDING, so when the fresh profile has no role_book yet
  // (needs_onboarding && not skipped) we route straight into the wizard instead
  // of leaving the user staring at the import card with no path forward.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const connected = params.get("threads_connected");
    const err = params.get("threads_error");
    if (!connected && !err) return;
    const strip = () => {
      const url = new URL(window.location.href);
      url.searchParams.delete("threads_connected");
      url.searchParams.delete("threads_error");
      url.searchParams.delete("username");
      window.history.replaceState({}, "", url.pathname + url.search + url.hash);
    };
    if (connected !== "1") {
      if (err) {
        setToastMsg({
          text: err === "account_limit" ? t("accounts.connect_limit") : t("accounts.connect_error"),
          tone: "error",
        });
        captureEvent("threads.connect_failed", { reason: err });
      }
      strip();
      return;
    }
    const u = params.get("username");
    captureEvent("threads.connect_succeeded");
    strip();
    let alive = true;
    void (async () => {
      try {
        const list = await fetchMyAccounts();
        const active = list.accounts.filter((a) => a.disconnected_at === null);
        if (active.length === 0) return;
        const justConnected =
          (u ? active.find((a) => a.username === u) : undefined) ??
          active.reduce((a, b) => (b.connected_at > a.connected_at ? b : a));
        setSelectedAccountId(justConnected.id);
        try {
          const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
          if (tz) await setAccountTimezone(justConnected.id, tz);
        } catch {
          /* tz is cosmetic to the connect flow */
        }
        const ob = await fetchOnboardingStatus(justConnected.id);
        if (!alive) return;
        if (ob.needs_onboarding && !isOnboardingSkipped(justConnected.id)) {
          router.replace("/app/onboarding");
          return;
        }
        if (!alive) return;
        setToastMsg({ text: u ? `@${u} · ${t("accounts.connected")}` : t("accounts.connected"), tone: "success" });
      } catch {
        /* fail-soft: the dashboard itself still renders the new profile */
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        // The dashboard is DURABLE above profiles: with no LIVE profile we no
        // longer bounce to the full-screen wizard (that read as a logout). The
        // render picks an in-dashboard empty state (never-connected → picker,
        // all-disconnected → reconnect) from scope, keeping the workspace.
        setData(acc);
        setPhase("ready");
        // The advisor hero only makes sense with a live portfolio; skip it in the
        // empty states. Fire-and-forget otherwise.
        if (acc.scope.profiles_count > 0) {
          fetchMeAccountAdvisor()
            .then((a) => {
              if (alive) setAdv(a);
            })
            .catch(() => {});
        }
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

  // Live-refresh while any profile is importing: the backfill takes ~a minute
  // and now writes progressive counts (initial_sync._update_sync_progress), so
  // polling turns the import card into a real progress readout and flips it to
  // synced when done. Keyed on the BOOLEAN (not the data object) so the
  // interval survives each setData instead of being re-created per poll, and
  // the poll counter accumulates toward its cap in a ref.
  const importing = phase === "ready" && data !== null && anyImporting(data);
  const pollCount = useRef(0);
  useEffect(() => {
    if (!importing) {
      pollCount.current = 0;
      return;
    }
    let inFlight = false;
    const id = window.setInterval(async () => {
      if (inFlight) return; // a slow poll must not overlap/re-order the next one
      pollCount.current += 1;
      if (pollCount.current > IMPORT_POLL_MAX) {
        window.clearInterval(id);
        return;
      }
      inFlight = true;
      try {
        const acc = await fetchMeAccount();
        setData(acc); // `importing` recomputes off the fresh data and stops us
      } catch {
        /* transient poll failure — keep the current view, try again next tick */
      } finally {
        inFlight = false;
      }
    }, IMPORT_POLL_MS);
    return () => window.clearInterval(id);
  }, [importing]);

  // The account.css layer is width-tokened (--content-wide); center it like the
  // other data screens.
  const wrap = "mx-auto w-full max-w-[1180px] px-4 py-5 md:px-6 md:py-6";

  const toastHost = toastMsg ? (
    <ToastHost>
      <Toast title={toastMsg.text} tone={toastMsg.tone} />
    </ToastHost>
  ) : null;

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
        {toastHost}
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
        {toastHost}
      </div>
    );
  }

  const tt: T = (k) => t(k as Parameters<typeof t>[0]);
  const plural: Plural = (unit, n) => pluralUnit(locale, unit, n);

  const liveCount = data.scope.profiles_count;
  const discCount = data.scope.disconnected_count;

  // Brand-new user (never connected) → full-screen "choose a network" picker.
  if (liveCount === 0 && discCount === 0) {
    return (
      <div className="min-h-screen bg-bg text-text">
        <FirstConnect t={tt} />
        {toastHost}
      </div>
    );
  }

  // Every profile disconnected → the in-dashboard reconnect state (keep the full
  // chrome; do NOT bounce to the wizard). Mobile reuses its dashboard, which
  // renders the disconnected profiles inline.
  if (liveCount === 0) {
    return (
      <div className="flex min-h-screen flex-col bg-bg text-text">
        <div className="flex-1">
          <div className={wrap}>
            <div className="hidden md:block">
              <AllDisconnected data={data} t={tt} plural={plural} />
            </div>
            <div className="md:hidden">
              <AccountMobileAllDisconnected data={data} t={tt} plural={plural} />
            </div>
          </div>
        </div>
        <div className="hidden md:block">
          <AppFooter />
        </div>
        {toastHost}
      </div>
    );
  }

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
      {toastHost}
    </div>
  );
}
