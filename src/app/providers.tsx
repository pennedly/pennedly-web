"use client";

// Wraps the app with PostHog init. Renders nothing visible; just kicks
// off `initAnalytics()` on first mount. Used by app/layout.tsx.

import { useEffect } from "react";

import { initAnalytics } from "@/lib/analytics";

export function AnalyticsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    initAnalytics();
  }, []);
  return <>{children}</>;
}
