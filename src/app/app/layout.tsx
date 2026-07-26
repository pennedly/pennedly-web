"use client";

// Shell for the whole authenticated /app area: a fixed left Sidebar
// (desktop) / top bar (mobile) + the page content to its right.
//
// Two opt-outs from the shell:
//  1. Pre-app focused flows (login, onboarding) render bare.
//  2. ZERO connected Threads accounts → there is nothing to do but connect,
//     so we send the user to the dedicated full-screen connect flow
//     (/app/onboarding's connect step) and never render the sidebar. This is
//     shell-level (not per-page) so it holds on settings/feed/etc. too — a
//     user who disconnects their last account anywhere lands on the connect
//     screen, not a half-empty app with a dead sidebar.

import { useEffect, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";

import { AppFooter } from "@/components/AppFooter";
import { Sidebar } from "@/components/Sidebar";
import { Spinner } from "@/components/ui/feedback";
import { fetchMe, getTokens, subscribeTokens } from "@/lib/api";
import { adoptServerLocale, useTranslation } from "@/lib/i18n";
import {
  refreshAccountsPresence,
  useHasConnectedAccounts,
} from "@/lib/accounts";

// The /app/account/* screens (dashboard + settings + portfolio advisor) are
// ACCOUNT-level — each renders its OWN account sidebar (not the profile shell),
// so they opt out like login/onboarding.
const SHELL_EXEMPT = new Set(["/app/login", "/app/onboarding"]);
const isAccountScreen = (path: string) => path === "/app/account" || path.startsWith("/app/account/");

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const exempt = SHELL_EXEMPT.has(pathname) || isAccountScreen(pathname);
  const hasAccounts = useHasConnectedAccounts();
  // Tester `?demo=1` review mode: render the shell standalone (mock content lives
  // in the page) without waiting on auth / a connected account — so the demo opens
  // even logged-out and with no backend, like the landing/onboarding demos.
  const [demo] = useState(
    () => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("demo") === "1",
  );
  // Tester gate for the durable account dashboard: a tester with zero connected
  // accounts lands on /app/account (the in-dashboard empty state) instead of the
  // full-screen wizard; non-testers keep the current onboarding flow until it is
  // promoted. Null until /me resolves, so we never redirect on a stale guess.
  const [isTester, setIsTester] = useState<boolean | null>(null);
  // Reactive token presence: flips the moment login writes the token (or logout
  // clears it), so the two bootstrap effects below re-run WITHOUT a remount. This
  // shared layout wraps both /app/login and /app, so an in-SPA login does NOT
  // remount it — a mount-only ([]) effect would never re-run and the shell would
  // hang on the loader until a manual refresh (fixed here).
  const hasTokens = useSyncExternalStore(
    subscribeTokens,
    () => getTokens() !== null,
    () => false,
  );

  // Check connected-account presence once we enter the shell area. The store
  // persists across SPA navigations, so this only fetches on first entry;
  // connect/disconnect call refreshAccountsPresence() to flip it live.
  useEffect(() => {
    if (!exempt && hasTokens) {
      refreshAccountsPresence();
    }
  }, [exempt, hasTokens]);

  // Server→client locale: adopt the user's saved language (me.locale) on load
  // when they haven't explicitly picked one locally — so a returning user's
  // preference applies on a fresh browser and on the first-run onboarding
  // (which renders shell-exempt, without the sidebar's own me-fetch). Runs for
  // every /app page, including onboarding, because hooks run before the
  // shell-exempt early return below.
  useEffect(() => {
    // Logout (or a same-tab user switch): drop the prior user's tester flag back to
    // null so the zero-account redirect below (gated on isTester !== null) can't fire
    // with a stale value before the next user's /me resolves.
    if (!hasTokens) {
      setIsTester(null);
      return;
    }
    fetchMe()
      .then((m) => {
        adoptServerLocale(m.locale);
        setIsTester(m.is_tester === true);
      })
      // A failed /me must still resolve the flag, or a zero-account user hangs on
      // the loader forever (the redirect below waits on isTester !== null). Fall
      // back to the safe prior default: non-tester → the /app/onboarding wizard.
      .catch(() => setIsTester(false));
    // Re-runs when the token lands (login) — NOT on token-refresh rotations, since
    // the boolean `hasTokens` snapshot stays true across those.
  }, [hasTokens]);

  // Zero connected accounts → route by tester status (wait for the flag so we
  // don't redirect on a stale guess): testers to the durable account dashboard's
  // in-dashboard empty state, others to the full-screen onboarding wizard.
  useEffect(() => {
    if (demo || exempt || hasAccounts !== false || isTester === null) return;
    router.replace(isTester ? "/app/account" : "/app/onboarding");
  }, [demo, exempt, hasAccounts, isTester, router]);

  // Pre-app focused flows (login, onboarding) render bare — no sidebar.
  if (exempt) {
    return <>{children}</>;
  }

  // Demo review: render the shell immediately, skipping the account gate.
  if (demo) {
    return (
      <div className="md:pl-62">
        <Sidebar />
        {/* sticky-footer column: content grows, footer pins to the bottom on
            short pages and flows after content on long ones (Footer-SPEC). */}
        <div className="flex min-h-screen flex-col">
          <div className="flex-1">{children}</div>
          <AppFooter />
        </div>
      </div>
    );
  }

  // Still checking, or zero accounts (about to redirect) → render bare with a
  // quiet loader, so the sidebar never flashes before the connect screen.
  if (hasAccounts !== true) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <Spinner size={20} className="text-text-subtle" label={t("a11y.loading")} />
      </div>
    );
  }

  return (
    <div className="md:pl-62">
      <Sidebar />
      <div className="flex min-h-screen flex-col">
        <div className="flex-1">{children}</div>
        <AppFooter />
      </div>
    </div>
  );
}
