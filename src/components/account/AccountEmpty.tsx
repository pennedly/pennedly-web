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

import { BrandMark } from "@/components/icons";
import type { MeAccountResponse } from "@/lib/types";

import {
  AcctMark,
  DisconnectedCard,
  Sidebar,
  Topbar,
  useAccountNav,
  type Nav,
  type Plural,
  type T,
} from "./AccountDashboard";

// ── real brand marks (per Zakhar: never a literal "@" or an invented logo) ────
function ThreadsLogo({ s = 22 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.322-3.082.87-.759 2.087-1.216 3.518-1.335a13.35 13.35 0 013.02.142c-.126-.742-.375-1.332-.745-1.757-.513-.586-1.309-.883-2.371-.89h-.031c-.85 0-2.005.234-2.741 1.327L7.933 8.464c.988-1.466 2.594-2.271 4.65-2.271h.052c3.436.021 5.482 2.137 5.674 5.822.11.045.219.093.327.141 1.52.716 2.631 1.8 3.213 3.134.811 1.855.886 4.881-1.579 7.302-1.882 1.842-4.161 2.67-7.199 2.677Zm1.86-9.463c-.315 0-.632.01-.958.028-1.795.101-2.914.925-2.846 2.117.07 1.244 1.435 1.813 2.735 1.744.914-.05 1.966-.293 2.622-1.103.43-.532.73-1.267.85-2.202-.62-.145-1.29-.226-2.005-.226z" />
    </svg>
  );
}
function LinkedInLogo({ s = 22 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

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

// ── the shared NETWORK PICKER ─────────────────────────────────────────────────
type NetDef = { id: string; name: string; status: "live" | "soon"; tone: string; Logo: (p: { s?: number }) => React.JSX.Element };
const NETS: NetDef[] = [
  { id: "threads", name: "Threads", status: "live", tone: "ink", Logo: ThreadsLogo },
  { id: "linkedin", name: "LinkedIn", status: "soon", tone: "accent", Logo: LinkedInLogo },
];

function NetMark({ tone, Logo }: { tone: string; Logo: (p: { s?: number }) => React.JSX.Element }) {
  return (
    <span className={`acc-net-tile acc-net-tile--${tone}`}>
      <Logo s={22} />
    </span>
  );
}

function NetworkRow({ net, t, nav }: { net: NetDef; t: T; nav: Nav }) {
  if (net.status === "soon") {
    return (
      <div className="acc-netrow acc-netrow--soon" role="listitem" aria-disabled="true">
        <NetMark tone={net.tone} Logo={net.Logo} />
        <span className="acc-netrow-body">
          <span className="acc-netrow-nm">{net.name}</span>
          <span className="acc-netrow-sub">{t("acc.net_soon_sub")}</span>
        </span>
        <span className="acc-netrow-badge">{t("acc.net_soon")}</span>
      </div>
    );
  }
  return (
    <button className="acc-netrow acc-netrow--live acc-netrow--primary" type="button" onClick={() => nav.addProfile()}>
      <NetMark tone={net.tone} Logo={net.Logo} />
      <span className="acc-netrow-body">
        <span className="acc-netrow-nm">{net.name}</span>
        <span className="acc-netrow-sub">{t("acc.net_live")}</span>
      </span>
      <span className="acc-netrow-go">
        {t("acc.connect_verb")}
        <Ic d={IC.chev} s={15} />
      </span>
    </button>
  );
}

export function NetworkPicker({ t, nav, cap = true }: { t: T; nav: Nav; cap?: boolean }) {
  return (
    <div className="acc-netpick" role="list">
      {cap ? <div className="acc-netpick-cap">{t("acc.picker_choose")}</div> : null}
      {NETS.map((net) => (
        <NetworkRow key={net.id} net={net} t={t} nav={nav} />
      ))}
    </div>
  );
}

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
  const nav = useAccountNav();
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
    </div>
  );
}
