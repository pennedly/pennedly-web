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

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { Sidebar } from "@/components/Sidebar";
import { Spinner } from "@/components/ui/feedback";
import { fetchMe, getTokens } from "@/lib/api";
import { adoptServerLocale } from "@/lib/i18n";
import {
  refreshAccountsPresence,
  useHasConnectedAccounts,
} from "@/lib/accounts";

const SHELL_EXEMPT = new Set(["/app/login", "/app/onboarding"]);

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const exempt = SHELL_EXEMPT.has(pathname);
  const hasAccounts = useHasConnectedAccounts();
  // Tester `?demo=1` review mode: render the shell standalone (mock content lives
  // in the page) without waiting on auth / a connected account — so the demo opens
  // even logged-out and with no backend, like the landing/onboarding demos.
  const [demo] = useState(
    () => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("demo") === "1",
  );

  // Check connected-account presence once we enter the shell area. The store
  // persists across SPA navigations, so this only fetches on first entry;
  // connect/disconnect call refreshAccountsPresence() to flip it live.
  useEffect(() => {
    if (!exempt && getTokens()) {
      refreshAccountsPresence();
    }
  }, [exempt]);

  // Server→client locale: adopt the user's saved language (me.locale) on load
  // when they haven't explicitly picked one locally — so a returning user's
  // preference applies on a fresh browser and on the first-run onboarding
  // (which renders shell-exempt, without the sidebar's own me-fetch). Runs for
  // every /app page, including onboarding, because hooks run before the
  // shell-exempt early return below.
  useEffect(() => {
    if (!getTokens()) return;
    fetchMe()
      .then((m) => adoptServerLocale(m.locale))
      .catch(() => {});
  }, []);

  // Zero connected accounts → the dedicated full-screen connect flow.
  useEffect(() => {
    if (!demo && !exempt && hasAccounts === false) {
      router.replace("/app/onboarding");
    }
  }, [demo, exempt, hasAccounts, router]);

  // Pre-app focused flows (login, onboarding) render bare — no sidebar.
  if (exempt) {
    return <>{children}</>;
  }

  // Demo review: render the shell immediately, skipping the account gate.
  if (demo) {
    return (
      <div className="md:pl-62">
        <Sidebar />
        {children}
      </div>
    );
  }

  // Still checking, or zero accounts (about to redirect) → render bare with a
  // quiet loader, so the sidebar never flashes before the connect screen.
  if (hasAccounts !== true) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <Spinner size={20} className="text-text-subtle" />
      </div>
    );
  }

  return (
    <div className="md:pl-62">
      <Sidebar />
      {children}
    </div>
  );
}
