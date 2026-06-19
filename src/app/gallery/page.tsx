import Link from "next/link";

// Index of dev-only state galleries. Add a link here when you add a new
// `/gallery/<screen>` page. Each renders the real components in every state for
// self-verification against the design `*-SPEC.html` mockups.
const GALLERIES = [
  { href: "/gallery/media", label: "Media (feed images · reply image)" },
  { href: "/gallery/firstrun", label: "First-run & import (banner · Stats nudge · honest empty-states)" },
];

export default function GalleryIndex() {
  return (
    <div className="min-h-screen bg-bg p-6 text-text">
      <div className="mx-auto max-w-[680px]">
        <h1 className="text-h2 font-semibold">State galleries</h1>
        <p className="mb-6 text-caption text-text-subtle">
          dev-only · real components in every state · no auth/backend needed
        </p>
        <ul className="flex flex-col gap-2">
          {GALLERIES.map((g) => (
            <li key={g.href}>
              <Link
                href={g.href}
                className="block rounded-lg border border-border bg-surface px-4 py-3 text-body transition-colors hover:border-text/15 hover:bg-surface-2"
              >
                {g.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
