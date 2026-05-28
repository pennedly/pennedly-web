// Sentry init for server-side rendering / API routes. Mirrors the
// client config but uses the same DSN — Sentry separates client vs
// server events automatically. Empty DSN = no-op.

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_ENVIRONMENT ?? "production",
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
  });
}
