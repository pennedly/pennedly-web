import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
