// Sentry init for browser code. Lives outside src/ per @sentry/nextjs
// convention — Next.js compiler picks it up automatically. Empty DSN
// = no-op (local dev or builds without analytics keys set).

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

// Vercel injects VERCEL_GIT_COMMIT_SHA at build; Next.js exposes
// NEXT_PUBLIC_* to the browser bundle. We mirror it manually in
// next.config.ts so this constant is defined at build time. When
// running outside Vercel, fall back to a short label so the SDK
// still tags releases.
const release =
  process.env.NEXT_PUBLIC_GIT_SHA &&
  `pennedly-web@${process.env.NEXT_PUBLIC_GIT_SHA.slice(0, 12)}`;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_ENVIRONMENT ?? "production",
    release: release || "pennedly-web@dev",
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
