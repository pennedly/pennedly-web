"use client";

// State gallery for the Account Dashboard — renders the REAL components
// (components/account/AccountDashboard) in every mode + state on demo data, NO
// auth / NO backend, for self-verification against Account-Dashboard-SPEC.html.
// Lives under /gallery (404 in prod). A dark toggle flips the ambient .dark so
// both themes are checked. The screen's CSS is the CD эталон (account.css +
// account-mobile.css), imported here.

import { useState } from "react";

import { pluralUnit } from "@/lib/i18n";

import "@/components/account/account.css";
import "@/components/account/account-mobile.css";
import "@/components/account/import-banner.css";

import { AccountDashboard, AccountSkeleton } from "@/components/account/AccountDashboard";
import {
  DEMO_ADVISOR,
  DEMO_MULTI_BRAND,
  DEMO_ONE_PROFILE,
  DEMO_SINGLE_BRAND,
  demoT,
} from "@/components/account/account-demo";

const demoPlural = (u: "profiles" | "brands" | "drafts" | "audits", n: number) => pluralUnit("ru", u, n);

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <div className="mb-3 flex items-baseline gap-3">
        <h3 className="font-mono text-caption uppercase tracking-wide text-text-subtle">{title}</h3>
        {note ? <span className="text-caption text-text-subtle">{note}</span> : null}
      </div>
      {children}
    </section>
  );
}

export default function AccountGallery() {
  const [dark, setDark] = useState(false);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
  }

  return (
    <div className="min-h-screen bg-bg px-6 py-8 text-text">
      <div className="mx-auto max-w-[1040px]">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-h2 font-semibold">Account Dashboard — gallery</h1>
          <button
            onClick={toggle}
            className="rounded-md border border-border bg-surface px-3 py-1.5 text-small font-medium hover:bg-surface-2"
          >
            {dark ? "☀ Light" : "☾ Dark"}
          </button>
        </div>

        <Section title="1 бренд · 1 профиль (новый пользователь)" note="show_brand_level=false → карточки = профили">
          <AccountDashboard data={DEMO_ONE_PROFILE} adv={DEMO_ADVISOR} t={demoT} plural={demoPlural} dark={dark} />
        </Section>

        <Section title="1 бренд · несколько профилей" note="карточки = профили напрямую (incl. importing)">
          <AccountDashboard data={DEMO_SINGLE_BRAND} adv={DEMO_ADVISOR} t={demoT} plural={demoPlural} dark={dark} />
        </Section>

        <Section title="2+ брендов" note="show_brand_level=true → карточки = бренды (incl. sync-error внутри)">
          <AccountDashboard data={DEMO_MULTI_BRAND} adv={DEMO_ADVISOR} t={demoT} plural={demoPlural} dark={dark} />
        </Section>

        <Section title="Загрузка (скелет)">
          <div className="acc-shell">
            <div />
            <AccountSkeleton />
          </div>
        </Section>
      </div>
    </div>
  );
}
