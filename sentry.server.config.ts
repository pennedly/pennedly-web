// Sentry init for server-side rendering / API routes. Mirrors the
// client config but uses the same DSN — Sentry separates client vs
// server events automatically. Empty DSN = no-op.

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

// Vercel sets VERCEL_GIT_COMMIT_SHA in the server runtime. Use it for
// the release tag so errors correlate with the exact deploy.
const sha = process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.NEXT_PUBLIC_GIT_SHA;
const release = sha ? `pennedly-web@${sha.slice(0, 12)}` : "pennedly-web@dev";

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_ENVIRONMENT ?? "production",
    release,
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
  });
}
