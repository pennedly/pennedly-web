"use client";

// State gallery for the Advisor (/app/advisor) AI growth-advisor chat — renders
// the REAL components in every state with NO auth / NO backend, for
// self-verification against Advisor-SPEC.html / Advisor-Mobile-SPEC.html. Lives
// under /gallery (404 in prod). Each part takes props exactly the way the live
// page passes them, driven here by ADVISOR_DEMO_TURNS (same sample conversation
// as the spec). The suggestion cards' "Open in Studio" is wired to an inert
// handler so nothing navigates.

import { useState, type ReactNode } from "react";

import {
  AssistantReply,
  Composer,
  ErrorRow,
  Hero,
  Starters,
  ThinkingRow,
  UserBubble,
  type Starter,
} from "@/components/advisor/AdvisorParts";
import { ADVISOR_DEMO_TURNS } from "@/components/advisor/advisor-demo";
import { useTranslation } from "@/lib/i18n";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-6">
      <h3 className="mb-2 font-mono text-caption uppercase tracking-wide text-text-subtle">{title}</h3>
      <div className="rounded-lg border border-border bg-surface p-4">{children}</div>
    </section>
  );
}

export default function AdvisorGallery() {
  const { t } = useTranslation();
  const [dark, setDark] = useState(false);
  function toggleDark() {
    document.documentElement.classList.toggle("dark");
    setDark((d) => !d);
  }

  const starters: Starter[] = [
    { icon: "nib", label: t("advisor.starter_post") },
    { icon: "chart", label: t("advisor.starter_drop") },
    { icon: "clock", label: t("advisor.starter_time") },
  ];
  // The two-turn sample conversation (chips · source lines · suggestion cards).
  const turns = ADVISOR_DEMO_TURNS(t, () => {});

  return (
    <div className="min-h-screen bg-bg p-6 text-text">
      <div className="mx-auto max-w-[720px]">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-h2 font-semibold">Advisor — state gallery</h1>
            <p className="text-caption text-text-subtle">
              dev-only · real components, no backend · compare to Advisor-SPEC.html
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

        <h2 className="mb-3 text-h3 font-semibold">First-run (empty)</h2>
        <Section title="hero + 'try asking' + starter chips (no conversation yet)">
          <Hero />
          <p className="mx-auto mb-2.5 max-w-[640px] text-center text-caption font-semibold uppercase tracking-[0.04em] text-text-subtle">
            {t("advisor.try_asking")}
          </p>
          <Starters starters={starters} onPick={() => {}} />
        </Section>

        <h2 className="mb-3 mt-8 text-h3 font-semibold">Conversation (ready)</h2>
        <Section title="two-turn thread · prose + data chips + 'Grounded in' + suggestion cards">
          <div className="flex flex-col gap-6">
            {turns.map((turn, i) => (
              <div key={i} className="flex flex-col gap-6">
                <UserBubble text={turn.user} />
                <AssistantReply content={turn.reply} />
              </div>
            ))}
          </div>
        </Section>

        <h2 className="mb-3 mt-8 text-h3 font-semibold">Thinking / error</h2>
        <Section title="thinking · pulse dots + the honest 'reading your stats…' label">
          <UserBubble text={t("advisor.starter_drop")} />
          <div className="mt-6">
            <ThinkingRow label={t("advisor.thinking_stats")} />
          </div>
        </Section>
        <Section title="error · inline per-reply row + Retry (never a whole-screen banner)">
          <UserBubble text={t("advisor.starter_post")} />
          <div className="mt-6">
            <ErrorRow onRetry={() => {}} />
          </div>
        </Section>

        <h2 className="mb-3 mt-8 text-h3 font-semibold">Composer</h2>
        <Section title="idle · auto-growing textarea + Send (disabled while empty) + hint">
          <Composer value="" onChange={() => {}} onSend={() => {}} />
        </Section>
        <Section title="busy · a reply is generating (Send disabled)">
          <Composer value="Best time to post this week?" onChange={() => {}} onSend={() => {}} busy hint={false} />
        </Section>
      </div>
    </div>
  );
}
