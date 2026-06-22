import type { NextConfig } from "next";

// Baseline HTTP security headers (audit). The strict script-src/connect-src CSP
// needs a per-request nonce via middleware — deferred so it can't break Next's
// inline runtime; the directives below are safe today and add the highest-value
// boundaries (clickjacking, MIME-sniffing, referer leak, <base>/object/plugin
// injection).
const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'",
  },
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
