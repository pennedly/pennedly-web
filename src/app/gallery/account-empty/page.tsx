"use client";

// State gallery for the durable-dashboard empty states — renders the REAL
// components (FirstConnect / AllDisconnected / mixed dashboard / NetworkPicker)
// on demo data, NO auth / NO backend, for self-verification against
// Account-Dashboard-Empty-SPEC + Connect-Network-Picker-SPEC. Lives under
// /gallery (404 in prod). The picker uses the REAL Threads / LinkedIn brand
// marks + the real Pennedly BrandMark (not DS letterform placeholders). Resize
// the preview to review each breakpoint; the dark toggle flips both themes.

import { useState } from "react";

import { pluralUnit } from "@/lib/i18n";

import "@/components/account/account.css";
import "@/components/account/account-mobile-shell.css";
import "@/components/account/account-mobile.css";
import "@/components/account/account-empty.css";
import "@/components/account/account-empty-mobile.css";
import "@/components/account/import-banner.css";

import { AccountDashboard, useAccountNav } from "@/components/account/AccountDashboard";
import { AccountMobileAllDisconnected, AccountMobileDashboard } from "@/components/account/AccountMobileDashboard";
import { AllDisconnected, FirstConnect } from "@/components/account/AccountEmpty";
import { NetworkPicker } from "@/components/account/networks";
import { DEMO_ALL_DISCONNECTED, DEMO_MIXED, DEMO_MULTI_BRAND_DISC, demoT } from "@/components/account/account-demo";

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

export default function AccountEmptyGallery() {
  const [dark, setDark] = useState(false);
  const nav = useAccountNav();

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
  }

  return (
    <div className="min-h-screen bg-bg px-6 py-8 text-text">
      <div className="mx-auto max-w-[1040px]">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-h2 font-semibold">Account: durable empty states</h1>
          <button
            onClick={toggle}
            className="rounded-md border border-border bg-surface px-3 py-1.5 text-small font-medium hover:bg-surface-2"
          >
            {dark ? "☀ Light" : "☾ Dark"}
          </button>
        </div>

        <Section title="Первое подключение (0 профилей)" note="full-screen пикер · Threads live · LinkedIn скоро · настоящие логотипы">
          <div className="overflow-hidden rounded-xl border border-border">
            <FirstConnect t={demoT} />
          </div>
        </Section>

        <Section title="Все профили отключены" note="in-dashboard, полный хром · «данные сохранены» · Переподключить">
          <div className="hidden md:block">
            <AllDisconnected data={DEMO_ALL_DISCONNECTED} t={demoT} plural={demoPlural} dark={dark} />
          </div>
          <div className="md:hidden">
            <AccountMobileAllDisconnected data={DEMO_ALL_DISCONNECTED} t={demoT} plural={demoPlural} dark={dark} />
          </div>
        </Section>

        <Section title="Смешанное (живые + отключённые)" note="отключённые рендерятся карточкой inline, не спрятаны">
          <div className="hidden md:block">
            <AccountDashboard data={DEMO_MIXED} t={demoT} plural={demoPlural} dark={dark} />
          </div>
          <div className="md:hidden">
            <AccountMobileDashboard data={DEMO_MIXED} t={demoT} plural={demoPlural} dark={dark} />
          </div>
        </Section>

        <Section title="Мульти-бренд + отключённый профиль" note="раскрыть бренд «Studio» → строка «Переподключить» · статус бренда «1 отключён» · счётчик свитчера считает только живых">
          <div className="hidden md:block">
            <AccountDashboard data={DEMO_MULTI_BRAND_DISC} t={demoT} plural={demoPlural} dark={dark} />
          </div>
          <div className="md:hidden">
            <AccountMobileDashboard data={DEMO_MULTI_BRAND_DISC} t={demoT} plural={demoPlural} dark={dark} />
          </div>
        </Section>

        <Section title="Пикер сети (компонент)" note="Threads = настоящий логотип · LinkedIn = приглушён + «Скоро»">
          <div style={{ maxWidth: 460 }}>
            <NetworkPicker t={demoT} nav={nav} />
          </div>
        </Section>
      </div>
    </div>
  );
}
