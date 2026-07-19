"use client";

// State gallery for «История изменений» (Applied-Changes-History) — renders the
// REAL AppliedChangesHistory component on sample data, NO auth / NO backend, for
// self-verification against Applied-Changes-History-SPEC. Lives under /gallery
// (404 in prod). The source-filter chips + row expand are interactive; the dark
// toggle in the gallery chrome flips both themes.

import { AppliedChangesHistory, sampleAppliedChanges } from "@/components/account/AppliedChangesHistory";

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <div className="mb-3 flex items-baseline gap-3">
        <h3 className="font-mono text-caption uppercase tracking-wide text-text-subtle">{title}</h3>
        {note ? <span className="text-caption text-text-subtle">{note}</span> : null}
      </div>
      <div className="rounded-2xl border border-border bg-bg p-6 md:p-8">{children}</div>
    </section>
  );
}

export default function AccountHistoryGallery() {
  const sample = sampleAppliedChanges();
  return (
    <div className="mx-auto max-w-[900px]">
      <Section title="feed · populated" note="mixed sources · day groups · filter chips · click a row to expand">
        <AppliedChangesHistory entries={sample} hasMore onLoadMore={() => {}} />
      </Section>
      <Section title="empty · nothing applied yet">
        <AppliedChangesHistory entries={[]} />
      </Section>
      <Section title="loading · skeleton">
        <AppliedChangesHistory entries={[]} loading />
      </Section>
      <Section title="error · inline banner + retry">
        <AppliedChangesHistory entries={[]} error onRetry={() => {}} />
      </Section>
      <Section title="settings entry row (the quiet link into the journal)">
        <div className="max-w-[560px]">
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="group flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3.5 shadow-sm transition-colors hover:border-accent/40"
          >
            <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-md border border-border bg-surface-2 text-text-muted transition-colors group-hover:border-accent/30 group-hover:text-accent">
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="4" width="14" height="17" rx="2" />
                <path d="M9 4.5h6V7H9Z" />
                <path d="M8.5 12.5l2 2 4-4.5" />
              </svg>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-small font-semibold text-text">История изменений</span>
              <span className="mt-0.5 block text-caption leading-[1.45] text-text-subtle">Что Pennedly применил за тебя одним кликом.</span>
            </span>
          </a>
        </div>
      </Section>
    </div>
  );
}
