"use client";

// State gallery for the "backfill Phase 0" first-run pieces — renders the real
// components in every state with NO auth / NO backend, for self-verification
// against First-Run-SPEC.html / import-banner.css / stats-firstrun.css /
// stats-followers.css. Lives under /gallery (404 in prod). The ImportBanner is
// shown with explicit props here (the in-product banner reads sync_status from
// GET /api/me/accounts); the Stats first-run parts take props the same way the
// real Stats page passes them.

import { useState, type ReactNode } from "react";

import { ImportBanner } from "@/components/studio/ImportBanner";
import { DistributionBars, FollowerChart, StatsNudge } from "@/components/studio/StatsParts";

// A realistic noisy follower rise so the line shows shape, not a flat edge.
const FOLLOWER_POINTS = Array.from({ length: 14 }, (_, i) => ({
  day: `2026-06-${String(i + 1).padStart(2, "0")}`,
  count: 1820 + i * 24 + (i % 3) * 9,
}));

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-6">
      <h3 className="mb-2 font-mono text-caption uppercase tracking-wide text-text-subtle">{title}</h3>
      <div className="rounded-lg border border-border bg-surface p-4">{children}</div>
    </section>
  );
}

export default function FirstRunGallery() {
  const [dark, setDark] = useState(false);
  function toggleDark() {
    document.documentElement.classList.toggle("dark");
    setDark((d) => !d);
  }

  return (
    <div className="min-h-screen bg-bg p-6 text-text">
      <div className="mx-auto max-w-[680px]">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-h2 font-semibold">First-run &amp; import — state gallery</h1>
            <p className="text-caption text-text-subtle">dev-only · real components, no backend · compare to First-Run-SPEC.html</p>
          </div>
          <button
            type="button"
            onClick={toggleDark}
            className="shrink-0 rounded-md border border-border px-3 py-1.5 text-small transition-colors hover:bg-surface-2"
          >
            {dark ? "Light" : "Dark"}
          </button>
        </header>

        <h2 className="mb-3 text-h3 font-semibold">Import banner</h2>
        <Section title="just started · indeterminate sweep (no counts yet)">
          <ImportBanner status="importing" summary={null} />
        </Section>
        <Section title="importing · live counts (no total → still indeterminate)">
          <ImportBanner status="importing" summary={{ posts: 42, new_comments: 310 }} />
        </Section>
        <Section title="importing · determinate bar (posts ÷ history_posts total)">
          <ImportBanner status="importing" summary={{ posts: 42, history_posts: 96, new_comments: 310 }} />
        </Section>
        <Section title="partial · success rail + check, no bar">
          <ImportBanner status="partial" summary={{ posts: 168, new_comments: 1240 }} />
        </Section>
        <Section title="complete / failed / null → renders nothing (banner removed)">
          <div className="text-caption text-text-subtle">
            <ImportBanner status="complete" summary={null} />
            <ImportBanner status="failed" summary={null} />
            <ImportBanner status={null} summary={null} />
            (no banner — correct)
          </div>
        </Section>

        <h2 className="mb-3 mt-8 text-h3 font-semibold">Stats first-run nudge</h2>
        <Section title="importing — 'Your history is importing'">
          <StatsNudge importing />
        </Section>
        <Section title="ready · small account — 'You're all set up' + Open the Studio">
          <StatsNudge importing={false} onOpenStudio={() => {}} />
        </Section>

        <h2 className="mb-3 mt-8 text-h3 font-semibold">Follower growth — honest states</h2>
        <Section title="collecting (<2 days) — 'Growth starts tracking today'; header shows the real count">
          <FollowerChart cap="Followers" points={[{ day: "2026-06-19", count: 1842 }]} currentCount={1842} />
        </Section>
        <Section title="locked (count unavailable, <~100) — header '—' + lock glyph">
          <FollowerChart cap="Followers" points={[]} locked currentCount={64} />
        </Section>
        <Section title="tracking (≥2 days) — the min–max growth line">
          <FollowerChart cap="Followers" points={FOLLOWER_POINTS} />
        </Section>

        <h2 className="mb-3 mt-8 text-h3 font-semibold">Performance spread — viral tiers</h2>
        <Section title="calculating — pill + per-row shimmer (no baseline yet)">
          <DistributionBars cap="0 posts vs your baseline · 7 days" tiers={{ viral: 0, good: 0, average: 0, weak: 0 }} calculating />
        </Section>
        <Section title="resolved — real counts + bars">
          <DistributionBars cap="32 posts vs your baseline · 7 days" tiers={{ viral: 3, good: 9, average: 14, weak: 6 }} />
        </Section>
      </div>
    </div>
  );
}
