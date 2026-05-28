// Sentry init for browser code. Lives outside src/ per @sentry/nextjs
// convention — Next.js compiler picks it up automatically. Empty DSN
// = no-op (local dev or builds without analytics keys set).

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_ENVIRONMENT ?? "production",
    // Sample 10% of regular traces, keep error traces always.
    tracesSampleRate: 0.1,
    // Don't capture user IPs or anything in localStorage by default.
    sendDefaultPii: false,
    // Drop noisy fetch/XHR breadcrumbs from health checks.
    beforeBreadcrumb(breadcrumb) {
      if (
        breadcrumb.category === "fetch" &&
        breadcrumb.data?.url &&
        String(breadcrumb.data.url).includes("/api/health")
      ) {
        return null;
      }
      return breadcrumb;
    },
  });
}
