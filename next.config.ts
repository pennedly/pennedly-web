import type { NextConfig } from "next";

// Baseline HTTP security headers (audit). The Content-Security-Policy is now
// minted per request in `src/proxy.ts` (strict, nonce-based script-src) — it
// lives there, not here, so there is exactly one CSP source of truth. These
// remaining headers are static and apply to every route.
const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
];

const nextConfig: NextConfig = {
  // Re-publish the deploy commit SHA as a NEXT_PUBLIC_* var so
  // sentry.client.config.ts can tag releases with the same SHA the server-side
  // init uses. Railway injects RAILWAY_GIT_COMMIT_SHA (the new host); Vercel
  // injects VERCEL_GIT_COMMIT_SHA (during the transition). Falls back to "" →
  // Sentry uses a 'dev' tag.
  env: {
    NEXT_PUBLIC_GIT_SHA:
      process.env.RAILWAY_GIT_COMMIT_SHA ?? process.env.VERCEL_GIT_COMMIT_SHA ?? "",
  },

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },

  // Legal pages stayed as static HTML in public/ to preserve byte-exact
  // language from the original landing (Meta App Review has these URLs
  // bookmarked). Internal rewrites keep the canonical /privacy, /terms,
  // /data-deletion URLs working — Next.js serves the static file but
  // the browser bar never shows .html.
  async rewrites() {
    return [
      { source: "/privacy", destination: "/privacy.html" },
      { source: "/terms", destination: "/terms.html" },
      { source: "/data-deletion", destination: "/data-deletion.html" },
    ];
  },
};

export default nextConfig;
