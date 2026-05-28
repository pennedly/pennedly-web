import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel injects VERCEL_GIT_COMMIT_SHA at build but doesn't expose
  // it to the browser. We re-publish it as a NEXT_PUBLIC_* env var so
  // sentry.client.config.ts can tag releases with the same SHA the
  // server-side init uses. Outside Vercel, this resolves to undefined
  // and Sentry falls back to a 'dev' tag.
  env: {
    NEXT_PUBLIC_GIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA ?? "",
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
