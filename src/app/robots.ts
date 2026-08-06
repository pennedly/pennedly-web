import type { MetadataRoute } from "next";

// Same Next app serves both hosts (host-based, not path-based — pennedly.com
// is marketing, app.pennedly.com is the auth-gated app), so this file's
// output is identical on both. That's fine: the rules below hold regardless
// of which host a crawler hit — disallow the auth-gated /app tree and the
// dev-only /gallery tree (both also carry their own noindex meta, see their
// layouts), allow everything public. No host-specific branching needed.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/app", "/gallery"],
    },
    sitemap: "https://pennedly.com/sitemap.xml",
  };
}
