"use client";

// State gallery for the Portfolio Advisor chat — renders the REAL component
// (components/account/AccountAdvisorChat) in every state on demo data, NO auth /
// NO backend, for self-verification against Account-Advisor-SPEC.html + the
// mobile spec. Lives under /gallery (404 in prod). A dark toggle flips .dark.

import { useState } from "react";

import { pluralUnit } from "@/lib/i18n";

import "@/components/account/account.css";
import "@/components/account/account-mobile-shell.css";
import "@/components/account/account-mobile.css";
import "@/components/account/account-screens.css";
import "@/components/account/account-screens-mobile.css";

import { AccountAdvisorChat, AccountMobileAdvisorChat, type ChatDemoState } from "@/components/account/AccountAdvisorChat";
import { DEMO_ADVISOR, DEMO_MULTI_BRAND, DEMO_SINGLE_BRAND, demoT } from "@/components/account/account-demo";

const demoPlural = (u: "profiles" | "brands" | "drafts" | "audits", n: number) => pluralUnit("ru", u, n);
const STATES: ChatDemoState[] = ["empty", "ready", "thinking", "thin", "error"];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h3 className="mb-3 font-mono text-caption uppercase tracking-wide text-text-subtle">{title}</h3>
      {children}
    </section>
  );
}

export default function AccountAdvisorGallery() {
  const [dark, setDark] = useState(false);
  return (
    <div className="min-h-screen bg-bg px-4 py-8 text-text md:px-6">
      <div className="mx-auto max-w-[1180px]">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-h2 font-semibold">Portfolio Advisor chat — gallery</h1>
          <button
            type="button"
            className="rounded-md border border-border bg-surface px-3 py-1.5 text-small"
            onClick={() => {
              const next = !dark;
              setDark(next);
              document.documentElement.classList.toggle("dark", next);
            }}
          >
            {dark ? "☀ Light" : "☾ Dark"}
          </button>
        </div>

        {STATES.map((s) => (
          <Section key={s} title={`Desktop · ${s}`}>
            <div className="hidden md:block">
              <AccountAdvisorChat data={DEMO_SINGLE_BRAND} adv={s === "thin" ? null : DEMO_ADVISOR} t={demoT} dark={dark} demoState={s} />
            </div>
          </Section>
        ))}

        <Section title="Mobile · ready (2+ brands)">
          <div className="mx-auto max-w-[420px]">
            <AccountMobileAdvisorChat data={DEMO_MULTI_BRAND} adv={DEMO_ADVISOR} t={demoT} plural={demoPlural} dark={dark} demoState="ready" />
          </div>
        </Section>

        <Section title="Mobile · empty (first-run)">
          <div className="mx-auto max-w-[420px]">
            <AccountMobileAdvisorChat data={DEMO_SINGLE_BRAND} adv={DEMO_ADVISOR} t={demoT} plural={demoPlural} dark={dark} demoState="empty" />
          </div>
        </Section>
      </div>
    </div>
  );
}
