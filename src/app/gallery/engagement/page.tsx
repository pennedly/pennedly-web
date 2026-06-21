"use client";

// State gallery for the Stats Engagement panel — renders the REAL
// EngagementPanel in every state, for all 5 metrics, with NO auth / NO backend.
// Compare to Engagement-SPEC.html / Engagement-Mobile-SPEC.html. Lives under
// /gallery (404 in prod). The populated frames use the demo history (Views =
// full real series, others = recent-only sparse-then-real) so the 0-based floor
// rule reads correctly; thin uses a 5-day fresh-account history.

import { useState, type ReactNode } from "react";

import { EngagementPanel } from "@/components/studio/EngagementPanel";
import { ENGAGEMENT_DEMO, engagementThinHistory } from "@/components/studio/engagement-demo";
import type { EngagementMetric } from "@/lib/types";

const METRICS: { key: EngagementMetric; label: string }[] = [
  { key: "views", label: "Views · full real series" },
  { key: "likes", label: "Likes · recent-only (sparse → real)" },
  { key: "replies", label: "Replies · recent-only" },
  { key: "reposts", label: "Reposts · recent-only" },
  { key: "quotes", label: "Quotes · recent-only" },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-6">
      <h3 className="mb-2 font-mono text-caption uppercase tracking-wide text-text-subtle">{title}</h3>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

export default function EngagementGallery() {
  const [dark, setDark] = useState(false);
  function toggleDark() {
    document.documentElement.classList.toggle("dark");
    setDark((d) => !d);
  }

  return (
    <div className="min-h-screen bg-bg p-6 text-text">
      <div className="mx-auto max-w-[960px]">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-h2 font-semibold">Engagement — state gallery</h1>
            <p className="text-caption text-text-subtle">
              dev-only · real EngagementPanel, no backend · compare to Engagement-SPEC.html
            </p>
          </div>
          <button
            type="button"
            onClick={toggleDark}
            className="shrink-0 rounded-md border border-border px-3 py-1.5 text-small transition-colors hover:bg-surface-2"
          >
            {dark ? "Light" : "Dark"}
          </button>
        </header>

        <h2 className="mb-3 text-h3 font-semibold">Populated · the five metrics (90d)</h2>
        <p className="mb-4 max-w-[70ch] text-caption text-text-subtle">
          Each panel defaults to one metric so the series reads on load. Views is a full real series; the
          others rest on the 0 floor for the older window and climb out of it — empty-then-real, never a fake
          plateau. Switch metric/range tabs to exercise the rest.
        </p>
        {METRICS.map((m) => (
          <Section key={m.key} title={m.label}>
            <EngagementPanel data={ENGAGEMENT_DEMO} state="ready" initialMetric={m.key} initialRange={90} />
          </Section>
        ))}

        <h2 className="mb-3 mt-8 text-h3 font-semibold">Ranges (Views)</h2>
        <Section title="30d · 90d (default) · 1y — 1y omits the trend delta (no full prior year)">
          <EngagementPanel data={ENGAGEMENT_DEMO} state="ready" initialMetric="views" initialRange={30} />
          <EngagementPanel data={ENGAGEMENT_DEMO} state="ready" initialMetric="views" initialRange={365} />
        </Section>

        <h2 className="mb-3 mt-8 text-h3 font-semibold">Loading / thin-data / error</h2>
        <Section title="loading · skeleton mirrors the layout (no reflow)">
          <EngagementPanel data={null} state="loading" />
        </Section>
        <Section title="thin-data · fresh account, ~5 days — honest 'building daily', not a flat line; tiles show —">
          <EngagementPanel data={engagementThinHistory(5)} state="thin" initialMetric="views" />
        </Section>
        <Section title="error · couldn't load engagement + Retry (header + tabs stay)">
          <EngagementPanel data={null} state="error" onRetry={() => {}} />
        </Section>
      </div>
    </div>
  );
}
