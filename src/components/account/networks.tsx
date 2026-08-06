"use client";

// Shared network identity + the connect affordance (Connect-Network-Picker from
// the Point-2 durable-dashboard design). ONE source of truth for:
//   • the REAL brand logos (per Zakhar: never a literal "@" or an invented
//     glyph) — used by the picker AND by every network badge on the dashboards;
//   • NETS — the network catalog (Threads live · LinkedIn soon);
//   • NetworkPicker — the designed picker rows (Threads → OAuth, LinkedIn stub);
//   • ConnectNetworkDialog / ConnectNetworkSheet — the add-brand/add-profile
//     entry points on a POPULATED dashboard host the same picker in a desktop
//     modal / mobile bottom sheet, so the user always gets the network CHOICE
//     instead of being bounced straight into Threads OAuth.

import { useEffect } from "react";

import { IcChevRight, IcX } from "@/components/icons";

import type { Nav, T } from "./AccountDashboard";

// ── real brand marks ──────────────────────────────────────────────────────────
// The CANONICAL simple-icons Threads glyph (byte-verified against
// simple-icons/icons/threads.svg master — the previous path was a near-miss
// third-party variant with a distorted inner hook, which read as an invented
// mark at badge sizes). `bold` adds a hairline same-color stroke on top of the
// fill — the standard trick to keep the thin @-like strokes legible at the
// 10-14px badge sizes (the official geometry stays untouched).
export function ThreadsLogo({ s = 22, bold = false }: { s?: number; bold?: boolean }) {
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke={bold ? "currentColor" : "none"}
      strokeWidth={bold ? 0.45 : 0}
      aria-hidden="true"
    >
      <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 0 1 3.02.142c-.126-.742-.375-1.332-.75-1.757-.513-.586-1.308-.883-2.359-.89h-.029c-.844 0-1.992.232-2.721 1.32L7.734 7.847c.98-1.454 2.568-2.256 4.478-2.256h.044c3.194.02 5.097 1.975 5.287 5.388.108.046.216.094.321.142 1.49.7 2.58 1.761 3.154 3.07.797 1.82.871 4.79-1.548 7.158-1.85 1.81-4.094 2.628-7.277 2.65Zm1.003-11.69c-.242 0-.487.007-.739.021-1.836.103-2.98.946-2.916 2.143.067 1.256 1.452 1.839 2.784 1.767 1.224-.065 2.818-.543 3.086-3.71a10.5 10.5 0 0 0-2.215-.221z" />
    </svg>
  );
}
export function LinkedInLogo({ s = 22, bold = false }: { s?: number; bold?: boolean }) {
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke={bold ? "currentColor" : "none"}
      strokeWidth={bold ? 0.45 : 0}
      aria-hidden="true"
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

// The real logo for a network id, or null for an unknown network (the caller
// falls back to its generic dot). Every badge/tile MUST render through this —
// never an invented glyph. Badges pass `bold` (hairline stroke) so the thin
// official strokes stay legible at 10-14px.
export function NetLogo({ network, s = 10, bold = false }: { network: string; s?: number; bold?: boolean }) {
  if (network === "threads") return <ThreadsLogo s={s} bold={bold} />;
  if (network === "linkedin") return <LinkedInLogo s={s} bold={bold} />;
  return null;
}

// ── the network catalog ───────────────────────────────────────────────────────
export type NetDef = {
  id: string;
  name: string;
  status: "live" | "soon";
  tone: string;
  Logo: (p: { s?: number }) => React.JSX.Element;
};
export const NETS: NetDef[] = [
  { id: "threads", name: "Threads", status: "live", tone: "ink", Logo: ThreadsLogo },
  { id: "linkedin", name: "LinkedIn", status: "soon", tone: "accent", Logo: LinkedInLogo },
];

// ── the shared NETWORK PICKER (Threads live · LinkedIn soon) ──────────────────
// `pfx` picks the class family: "acc" (desktop/empty-state styling,
// account-empty.css) or "ma" (the mobile sheet styling from the эталон,
// account-empty-mobile.css). Markup is identical, only the prefix differs.
type Pfx = "acc" | "ma";

function NetMark({ pfx, tone, Logo }: { pfx: Pfx; tone: string; Logo: NetDef["Logo"] }) {
  return (
    <span className={`${pfx}-net-tile ${pfx}-net-tile--${tone}`}>
      <Logo s={22} />
    </span>
  );
}

function NetworkRow({ net, t, nav, pfx }: { net: NetDef; t: T; nav: Nav; pfx: Pfx }) {
  if (net.status === "soon") {
    return (
      <div className={`${pfx}-netrow ${pfx}-netrow--soon`} role="listitem" aria-disabled="true">
        <NetMark pfx={pfx} tone={net.tone} Logo={net.Logo} />
        <span className={`${pfx}-netrow-body`}>
          <span className={`${pfx}-netrow-nm`}>{net.name}</span>
          <span className={`${pfx}-netrow-sub`}>{t("acc.net_soon_sub")}</span>
        </span>
        <span className={`${pfx}-netrow-badge`}>{t("acc.net_soon")}</span>
      </div>
    );
  }
  // The one LIVE network — this row is the ONLY place the add-flow actually
  // starts the Threads OAuth (nav.connectThreads); everything upstream of it
  // only ever opens the picker.
  return (
    <button
      className={`${pfx}-netrow ${pfx}-netrow--live ${pfx}-netrow--primary`}
      type="button"
      onClick={() => nav.connectThreads()}
    >
      <NetMark pfx={pfx} tone={net.tone} Logo={net.Logo} />
      <span className={`${pfx}-netrow-body`}>
        <span className={`${pfx}-netrow-nm`}>{net.name}</span>
        <span className={`${pfx}-netrow-sub`}>{t("acc.net_live")}</span>
      </span>
      <span className={`${pfx}-netrow-go`}>
        {t("acc.connect_verb")}
        <IcChevRight size={15} />
      </span>
    </button>
  );
}

export function NetworkPicker({ t, nav, cap = true, pfx = "acc" }: { t: T; nav: Nav; cap?: boolean; pfx?: Pfx }) {
  return (
    <div className={`${pfx}-netpick`} role="list">
      {cap ? <div className={`${pfx}-netpick-cap`}>{t("acc.picker_choose")}</div> : null}
      {NETS.map((net) => (
        <NetworkRow key={net.id} net={net} t={t} nav={nav} pfx={pfx} />
      ))}
    </div>
  );
}

// ── desktop add-flow dialog (populated dashboard «Добавить бренд» etc.) ───────
export function ConnectNetworkDialog({
  open,
  onClose,
  t,
  nav,
}: {
  open: boolean;
  onClose: () => void;
  t: T;
  nav: Nav;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div
      className="acc-connect-overlay"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="acc-connect-panel">
        <div className="acc-connect-head">
          <span className="acc-connect-title">{t("acc.picker_choose")}</span>
          <button className="acc-connect-close" type="button" aria-label={t("a11y.close")} onClick={onClose}>
            <IcX size={16} />
          </button>
        </div>
        <NetworkPicker t={t} nav={nav} cap={false} />
      </div>
    </div>
  );
}

// ── mobile add-flow bottom sheet — 1:1 the эталон pickerSheet ─────────────────
// (design-export/PennedlyDesign/components/account-empty-mobile.js: grip →
// ma-pick-head title + close → ma-pick-s subtitle → the ma-prefixed picker
// rows, inside the shared m-scrim/m-sheet chrome.)
export function ConnectNetworkSheet({ t, nav, onClose }: { t: T; nav: Nav; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <>
      <button className="m-scrim" type="button" tabIndex={-1} aria-hidden onClick={onClose} />
      <div className="m-sheet" role="dialog" aria-modal="true" aria-label={t("acc.pick_sheet_t")}>
        <div style={{ padding: "8px 14px 22px" }}>
          <div className="m-sheet-grip" />
          <div className="ma-pick-head">
            <div className="ma-pick-t">{t("acc.pick_sheet_t")}</div>
            <button className="m-sheet-close" type="button" aria-label={t("a11y.close")} onClick={onClose}>
              <IcX size={16} />
            </button>
          </div>
          <div className="ma-pick-s">{t("acc.pick_sheet_s")}</div>
          <NetworkPicker t={t} nav={nav} cap={false} pfx="ma" />
        </div>
      </div>
    </>
  );
}
