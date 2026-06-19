"use client";

// State gallery for the Overview (/app/overview) multi-account rollup — renders
// the REAL components in every state with NO auth / NO backend, for
// self-verification against Overview-SPEC.html / Overview-Mobile-SPEC.html.
// Lives under /gallery (404 in prod). Each part takes props exactly the way the
// live page passes them, driven here by the OVERVIEW_DEMO fixtures (same numbers
// as the spec). `demo` on the nudge/empty swaps the live ConnectThreadsButton
// for an inert look-alike so nothing fires a real OAuth connect.

import { useState, type ReactNode } from "react";

import {
  AccountCard,
  OverviewEmpty,
  OverviewError,
  OverviewNudge,
  OverviewSkeleton,
  PortfolioTotals,
} from "@/components/studio/OverviewParts";
import {
  OVERVIEW_DEMO,
  OVERVIEW_DEMO_ACCOUNTS,
  OVERVIEW_DEMO_ERROR_ACCOUNT,
} from "@/components/studio/overview-demo";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-6">
      <h3 className="mb-2 font-mono text-caption uppercase tracking-wide text-text-subtle">{title}</h3>
      <div className="rounded-lg border border-border bg-surface p-4">{children}</div>
    </section>
  );
}

const { MARA, LATE } = OVERVIEW_DEMO_ACCOUNTS;

export default function OverviewGallery() {
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
            <h1 className="text-h2 font-semibold">Overview — state gallery</h1>
            <p className="text-caption text-text-subtle">
              dev-only · real components, no backend · compare to Overview-SPEC.html
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

        <h2 className="mb-3 text-h3 font-semibold">Combined top strip (PortfolioTotals)</h2>
        <Section title="many · totals across synced accounts + '+1 still importing'">
          <PortfolioTotals totals={OVERVIEW_DEMO.many.totals} />
        </Section>
        <Section title="single · one account, no importing caption">
          <PortfolioTotals totals={OVERVIEW_DEMO.single.totals} />
        </Section>

        <h2 className="mb-3 mt-8 text-h3 font-semibold">Account card (AccountCard)</h2>
        <Section title="synced · metrics + 'Updated Nh ago' + quick-links (Replies has a count when > 0)">
          <div className="grid grid-cols-1 gap-[14px] md:grid-cols-2">
            <AccountCard account={MARA} />
          </div>
        </Section>
        <Section title="importing · the Phase-0 import banner replaces the metric block">
          <div className="grid grid-cols-1 gap-[14px] md:grid-cols-2">
            <AccountCard account={LATE} />
          </div>
        </Section>
        <Section title="sync-error · danger 'Sync failed' + Retry (card-local)">
          <div className="grid grid-cols-1 gap-[14px] md:grid-cols-2">
            <AccountCard account={OVERVIEW_DEMO_ERROR_ACCOUNT} onRetry={() => {}} />
          </div>
        </Section>

        <h2 className="mb-3 mt-8 text-h3 font-semibold">Full grid (top strip + cards)</h2>
        <Section title="many · the whole rollup (4 accounts, one importing)">
          <div className="flex flex-col gap-[18px]">
            <PortfolioTotals totals={OVERVIEW_DEMO.many.totals} />
            <div className="grid grid-cols-1 gap-[14px] md:grid-cols-2">
              {OVERVIEW_DEMO.many.accounts.map((a) => (
                <AccountCard key={a.id} account={a} />
              ))}
            </div>
          </div>
        </Section>
        <Section title="single · one card + the 'connect another' nudge (graceful degradation)">
          <div className="flex flex-col gap-[18px]">
            <PortfolioTotals totals={OVERVIEW_DEMO.single.totals} />
            <div className="grid grid-cols-1 gap-[14px]">
              {OVERVIEW_DEMO.single.accounts.map((a) => (
                <AccountCard key={a.id} account={a} />
              ))}
            </div>
            <OverviewNudge demo />
          </div>
        </Section>

        <h2 className="mb-3 mt-8 text-h3 font-semibold">Loading / empty / error</h2>
        <Section title="loading · skeleton mirrors the layout (4 tiles + 2 card shells, no reflow)">
          <OverviewSkeleton />
        </Section>
        <Section title="empty · no accounts connected yet + Connect CTA">
          <OverviewEmpty demo />
        </Section>
        <Section title="error · couldn't load the account list + Retry">
          <OverviewError onRetry={() => {}} />
        </Section>
      </div>
    </div>
  );
}
