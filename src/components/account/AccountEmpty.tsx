"use client";

// Durable-dashboard empty states (Account-Dashboard-Empty-SPEC + the shared
// Connect-Network-Picker). Ported 1:1 from the CD эталон, but with REAL brand
// marks in the picker (Threads / LinkedIn) and the real Pennedly BrandMark on
// the first-connect, not the DS letterform placeholders.
//   • FirstConnect   — brand-new user (0 profiles ever) → full-screen picker.
//   • AllDisconnected— had profiles, all disconnected → in-dashboard (full chrome).
//   • NetworkPicker  — the shared connect affordance (Threads live · LinkedIn soon).
// The mixed state (≥1 live + ≥1 disconnected) is handled by AccountDashboard —
// its ProfileCard renders a disconnected profile as <DisconnectedCard/> inline.

import { useState } from "react";

import { BrandMark } from "@/components/icons";
import type { MeAccountResponse } from "@/lib/types";

import {
  AcctMark,
  DisconnectedCard,
  Sidebar,
  Topbar,
  useAccountNav,
  type Plural,
  type T,
} from "./AccountDashboard";
// The real brand logos + the shared NetworkPicker/dialogs live in networks.tsx
// (one source of truth for the picker AND every network badge).
import { ConnectNetworkDialog, NetworkPicker } from "./networks";

// small inline glyphs (CD EIC style: 1.8 stroke, round)
function Ic({ d, s = 15 }: { d: React.ReactNode; s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      {d}
    </svg>
  );
}
const IC = {
  shield: <path d="M12 3 5 6v5.5c0 4.3 3 7.4 7 8.8 4-1.4 7-4.5 7-8.8V6l-7-3Z" />,
  plus: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
  logout: (
    <>
      <path d="M15 4h4v16h-4" />
      <path d="M11 8l4 4-4 4" />
      <path d="M15 12H3" />
    </>
  ),
  chev: <path d="M9 6l6 6-6 6" />,
  eye: (
    <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  check: <path d="M5 12l4.5 4.5L19 7" />,
  power: (
    <>
      <path d="M12 4v8" />
      <path d="M7.5 7a7 7 0 1 0 9 0" />
    </>
  ),
};

// ── full-screen first connect (brand-new user, 0 profiles ever) ───────────────
export function FirstConnect({ t }: { t: T }) {
  const nav = useAccountNav();
  const next = [
    { d: IC.eye, tx: t("acc.next_read") },
    { d: IC.check, tx: t("acc.next_approve") },
    { d: IC.power, tx: t("acc.next_disconnect") },
  ];
  return (
    <div className="acc-first">
      <div className="acc-first-top">
        <div className="acc-first-brand">
          <span className="acc-first-logo">
            <BrandMark size={22} radius={7} />
          </span>
          Pennedly
        </div>
        <button className="acc-first-logout" type="button" onClick={() => nav.logout()}>
          <Ic d={IC.logout} s={15} />
          {t("settings.logout")}
        </button>
      </div>
      <div className="acc-first-inner">
        <div className="acc-first-eyebrow">{t("acc.first_eyebrow")}</div>
        <h1 className="acc-first-t">{t("acc.first_title")}</h1>
        <p className="acc-first-s">{t("acc.first_sub")}</p>
        <NetworkPicker t={t} nav={nav} />
        <div className="acc-next acc-first-next">
          <div className="acc-next-cap">{t("acc.next_cap")}</div>
          {next.map((r, i) => (
            <div key={i} className="acc-next-row">
              <span className="acc-next-ic">
                <Ic d={r.d} s={15} />
              </span>
              <span className="acc-next-t">{r.tx}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── all-disconnected (had profiles, all now disconnected) — full chrome ───────
export function AllDisconnected({
  data,
  t,
  plural,
  dark,
}: {
  data: MeAccountResponse;
  t: T;
  plural: Plural;
  dark?: boolean;
}) {
  const baseNav = useAccountNav();
  const [pickOpen, setPickOpen] = useState(false);
  // «Подключить ещё один» (and every add-affordance in the chrome) opens the
  // network CHOICE; only the picker's Threads row starts the OAuth. The
  // per-card Reconnect buttons keep going straight to Threads — the network of
  // a disconnected Threads profile is already known.
  const nav = { ...baseNav, addProfile: () => setPickOpen(true) };
  const disc = data.brands.flatMap((b) => b.profiles).filter((p) => p.disconnected);
  const acctMono = (data.tenant.name || "PL").slice(0, 2).toUpperCase();
  return (
    <div className="acc-shell">
      <Sidebar data={data} t={t} nav={nav} />
      <div className="acc-mainwrap" style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 18 }}>
        <Topbar data={data} t={t} plural={plural} dark={dark} nav={nav} />
        <div className="acc">
          <div className="acc-head acc-head--idonly">
            <AcctMark mono={acctMono} />
            <div className="acc-head-txt">
              <div className="acc-head-name">{data.tenant.name}</div>
              <div className="acc-head-meta">
                <span className="acc-head-scale">
                  {disc.length} {plural("profiles", disc.length)}
                </span>
              </div>
            </div>
          </div>
          <div className="acc-reassure">
            <span className="acc-reassure-mark">
              <Ic d={IC.shield} s={20} />
            </span>
            <div className="acc-reassure-body">
              <div className="acc-reassure-t">{t("acc.reassure_title")}</div>
              <div className="acc-reassure-s">{t("acc.reassure_sub")}</div>
            </div>
          </div>
          <div className="acc-sec">
            <span className="acc-sec-t">{t("acc.disc_section")}</span>
            <span className="acc-sec-n">{disc.length}</span>
            <span className="acc-sec-note">{t("acc.disc_section_note")}</span>
          </div>
          <div className="acc-grid">
            {disc.map((p) => (
              <DisconnectedCard key={p.id} p={p} t={t} nav={nav} />
            ))}
          </div>
          <div className="acc-connect-row">
            <button className="btn btn--secondary acc-connect-another" type="button" onClick={() => nav.addProfile()}>
              <Ic d={IC.plus} s={15} />
              {t("acc.connect_another")}
            </button>
          </div>
        </div>
      </div>
      <ConnectNetworkDialog open={pickOpen} onClose={() => setPickOpen(false)} t={t} nav={baseNav} />
    </div>
  );
}
