import type { MetadataRoute } from "next";

// The public URL surface only — matches the routes that actually canonicalize
// to pennedly.com (see robots.ts for why /app and /gallery are excluded).
// Keep this list real: add an entry only when a new public, indexable route
// ships, don't pad it with pages that don't exist yet.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://pennedly.com";
  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/data-deletion`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
