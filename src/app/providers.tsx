"use client";

// Root-mounted client wrapper (rendered once, in app/layout.tsx, around every
// page on both hosts). Two jobs that both need exactly this kind of single
// always-mounted spot rather than a per-page effect:
//  1. Kicks off PostHog's `initAnalytics()` on first mount.
//  2. Keeps `<html lang>` synced to the active i18n locale (see
//     useSyncHtmlLang in lib/i18n) — the SSR shell always ships "en", this is
//     what corrects it after hydration and on every locale switch.

import { useEffect } from "react";

import { initAnalytics } from "@/lib/analytics";
import { useSyncHtmlLang } from "@/lib/i18n";

export function AnalyticsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    initAnalytics();
  }, []);
  useSyncHtmlLang();
  return <>{children}</>;
}
