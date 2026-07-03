"use client";

// State gallery for Account Settings — renders the REAL components
// (components/account/AccountSettings) on demo data, NO auth / NO backend, for
// self-verification against Account-Settings-SPEC.html + the mobile spec. Lives
// under /gallery (404 in prod). Interactive: click the Name field to edit, the
// Export/Delete buttons to walk their states. A dark toggle flips the ambient
// .dark so both themes are checked.

import { useState } from "react";

import { pluralUnit } from "@/lib/i18n";

import "@/components/account/account.css";
import "@/components/account/account-mobile-shell.css";
import "@/components/account/account-mobile.css";
import "@/components/account/account-screens.css";
import "@/components/account/account-screens-mobile.css";

import { AccountSettings, AccountMobileSettings, AccountSettingsSkeleton } from "@/components/account/AccountSettings";
import { DEMO_ME, DEMO_MULTI_BRAND, DEMO_SINGLE_BRAND, demoT } from "@/components/account/account-demo";

const demoPlural = (u: "profiles" | "brands" | "drafts" | "audits", n: number) => pluralUnit("ru", u, n);

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h3 className="mb-3 font-mono text-caption uppercase tracking-wide text-text-subtle">{title}</h3>
      {children}
    </section>
  );
}

export default function AccountSettingsGallery() {
  const [dark, setDark] = useState(false);
  return (
    <div className="min-h-screen bg-bg px-4 py-8 text-text md:px-6">
      <div className="mx-auto max-w-[1180px]">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-h2 font-semibold">Account Settings — gallery</h1>
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

        <Section title="Desktop · single brand">
          <div className="hidden md:block">
            <AccountSettings data={DEMO_SINGLE_BRAND} me={DEMO_ME} t={demoT} dark={dark} />
          </div>
          <p className="text-caption text-text-subtle md:hidden">Resize ≥ 768px to see the desktop shell.</p>
        </Section>

        <Section title="Desktop · 2+ brands (Brands nav row)">
          <div className="hidden md:block">
            <AccountSettings data={DEMO_MULTI_BRAND} me={DEMO_ME} t={demoT} dark={dark} />
          </div>
        </Section>

        <Section title="Mobile (≤ 600px)">
          <div className="mx-auto max-w-[420px]">
            <AccountMobileSettings data={DEMO_MULTI_BRAND} me={DEMO_ME} t={demoT} plural={demoPlural} dark={dark} />
          </div>
        </Section>

        <Section title="Loading skeleton (desktop)">
          <div className="hidden md:block">
            <div className="acc-shell">
              <div />
              <AccountSettingsSkeleton />
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}
