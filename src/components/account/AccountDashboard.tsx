"use client";

// Account dashboard components — a 1:1 React port of the CD эталон
// (design-export/PennedlyDesign/account-desktop.js + account.css). Data-driven
// from the `MeAccountResponse` (GET /api/me/account). ONE component set,
// parameterized by brand count (scope.show_brand_level): at one brand the cards
// ARE profiles; at 2+ they are brands that expand into profiles. Level shape
// language — Account = filled square, Brand = outlined square, Profile = round.
//
// Copy is passed in via a `t()` translator so the same components serve the
// gallery (demo strings) and the live screen (i18n). Marks/metrics/cards mirror
// the эталон markup + class names exactly, so account.css themes them (light +
// dark) with zero per-element work.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { setSelectedAccountId, useSelectedAccountId } from "@/lib/account";
import { useMe } from "@/lib/use-account-data";
import { logout, startThreadsConnect } from "@/lib/api";
import { useTranslation } from "@/lib/i18n";
import {
  BrandMark as BrandLogo,
  IcAlert,
  IcArrowDown,
  IcArrowRight,
  IcArrowUp,
  IcAudit,
  IcAdvisor,
  IcBubble,
  IcCheck,
  IcChevDown,
  IcChevRight,
  IcEye,
  IcLayers,
  IcLogout,
  IcMoon,
  IcNib,
  IcOverview,
  IcPlus,
  IcReply,
  IcSend,
  IcSettings,
  IcSparkle,
  IcSun,
  IcUndo,
  IcUsers,
  type IconProps,
} from "@/components/icons";
// Real network logos + the add-flow dialog (shared with the empty states).
// Type-only in the other direction (networks.tsx imports `type {Nav, T}` from
// here), so there is no runtime cycle.
import { ConnectNetworkDialog, NetLogo } from "./networks";
import type {
  AccountBrand,
  AccountProfile,
  AccountTasks,
  AdvisorData,
  MeAccountResponse,
  OverviewTotals,
} from "@/lib/types";

// Re-exported so account-demo.ts + consumers can keep importing it from here.
export type { AdvisorData };

// ── dynamic-icon map ─────────────────────────────────────────────────────────
// The dashboard's data (chips / recos / tasks) carries icon names as strings
// from the design-token vocab (the backend/demo emit these — do NOT change the
// contract). This maps those token names to the app's design-system icons so
// `<DynIcon n={someField} />` resolves at runtime. Exported so the mobile
// dashboard shares one source of truth for both breakpoints.
export const DYN_ICONS: Record<string, (p: IconProps) => React.JSX.Element> = {
  users: IcUsers,
  eye: IcEye,
  nib: IcNib,
  bubble: IcBubble,
  reply: IcReply,
  audit: IcAudit,
  up: IcArrowUp,
  down: IcArrowDown,
  sparkle: IcSparkle,
  alert: IcAlert,
};

// Resolves a design-token icon name (chip/reco/task) to an app icon at render
// time, falling back to the sparkle glyph for any unknown name.
export function DynIcon({ n, s = 14 }: { n: string; s?: number }) {
  const C = DYN_ICONS[n] ?? IcSparkle;
  return <C size={s} />;
}

// ── translator + helpers ─────────────────────────────────────────────────────
export type T = (key: string) => string;
// Grammatical plural for a count — the caller wires it to the app's pluralUnit
// (locale-aware: «1 профиль» · «3 профиля» · «5 профилей»). Covers every unit
// this screen inflects: card counts (profiles/brands) + tasks-strip chips
// (drafts/audits), so «1 черновик» · «2 черновика» · «5 черновиков» stays correct.
export type Plural = (unit: "profiles" | "brands" | "drafts" | "audits", n: number) => string;

// Navigation the dashboard's controls drive. Built once from next/navigation +
// the selected-account store, threaded to every interactive part so the same
// components stay presentational (the gallery gets a live router too, harmless).
export type ProfileView = "studio" | "stats" | "replies";
export type Nav = {
  openProfile: (id: number, view?: ProfileView) => void; // switch profile → its screen
  go: (route: string) => void; // plain push (nav rows, settings, triage)
  // The ADD flow (add-brand tile / switcher-drawer «подключить»): opens the
  // network picker (Threads live · LinkedIn soon) — the dashboard roots
  // override the hook default with their dialog/sheet opener, so the user
  // always gets the network CHOICE first.
  addProfile: () => void;
  // Direct Threads OAuth — the picker's Threads row + the per-profile
  // Reconnect buttons (a disconnected THREADS profile has a known network, no
  // choice to make).
  connectThreads: () => void;
  logout: () => void;
  retry: () => void; // re-fetch after a sync error
  toggleTheme: () => void;
  locale: string; // active app locale — for date/relative-time formatting (relSince)
};

export function useAccountNav(): Nav {
  const router = useRouter();
  const { locale } = useTranslation();
  const connectThreads = () => {
    const returnUrl =
      typeof window !== "undefined" ? `${window.location.origin}/app/account` : "/app/account";
    startThreadsConnect(returnUrl)
      .then(({ authorize_url }) => {
        window.location.href = authorize_url;
      })
      .catch(() => router.push("/app/onboarding"));
  };
  return {
    locale,
    openProfile: (id, view = "studio") => {
      setSelectedAccountId(id);
      router.push(
        view === "stats"
          ? "/app/stats"
          : view === "replies"
            ? "/app/replies?filter=needs"
            : "/app",
      );
    },
    go: (route) => router.push(route),
    // Direct Threads OAuth (same as ConnectThreadsButton), returning to the
    // dashboard; falls back to onboarding if the start call fails. Reached from
    // the network picker's Threads row and the per-profile Reconnect buttons.
    connectThreads,
    // Hook default for the ADD flow = direct connect; the dashboard roots
    // (desktop + mobile + all-disconnected) override it with their
    // network-picker opener, so every «Добавить бренд» / «Подключить профиль»
    // shows the choice (Threads live · LinkedIn soon) instead of bouncing
    // straight into OAuth.
    addProfile: connectThreads,
    logout: () => {
      void logout();
      router.push("/app/login");
    },
    retry: () => window.location.reload(),
    toggleTheme: () => {
      const next = !document.documentElement.classList.contains("dark");
      document.documentElement.classList.toggle("dark", next);
      try {
        localStorage.setItem("theme", next ? "dark" : "light");
      } catch {
        /* storage disabled — the toggle still applies for the session */
      }
    },
  };
}

export const NET_LABEL: Record<string, string> = { threads: "Threads", linkedin: "LinkedIn" };
// Known networks render their REAL logo via NetLogo (networks.tsx — never an
// invented glyph); this text map is only the fallback for a FUTURE network id
// the FE doesn't know yet.
const NET_GLYPH: Record<string, string> = {};

function nfmt(n: number): string {
  // Compact thousands like the эталон numbers (12,4k). Keep small numbers plain.
  if (n >= 10000) return (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1).replace(".", ",") + "k";
  return n.toLocaleString("ru-RU");
}

function initials(name: string | null, handle: string | null): string {
  const s = (name || handle || "?").trim();
  return s.slice(0, 2).toUpperCase();
}

// Identity for the account chrome (head, sidebar login, breadcrumb, drawers).
// The эталон shows the signed-in USER — name in the head, email in the login
// controls — while the live code had substituted `tenant.name` («X's
// workspace») everywhere, which also froze renames (audit B8: a Settings
// name-edit never reached the chrome). Reads the LIVE cached /me (re-renders
// on a rename via subscribeMe); falls back to the tenant name until /me lands.
export function useChromeIdentity(tenantName: string): { name: string; email: string; mono: string } {
  const me = useMe();
  const name = (me?.display_name || "").trim() || tenantName;
  return { name, email: me?.email ?? tenantName, mono: initials(name, null) };
}

function Delta({ v }: { v: number | null }) {
  if (v == null) return <span className="acc-delta acc-delta--flat">—</span>;
  const down = v < 0;
  return (
    <span className={`acc-delta acc-delta--${down ? "down" : "up"}`}>
      {down ? <IcArrowDown size={12} /> : <IcArrowUp size={12} />}
      {nfmt(Math.abs(v))}
    </span>
  );
}

// ── marks: account (filled square) · brand (outlined square) · profile (round) ──
export function AcctMark({ mono, cls = "" }: { mono: string; cls?: string }) {
  return <span className={`acc-acctmark ${cls}`.trim()}>{mono}</span>;
}
function BrandMark({ mono, cls = "" }: { mono: string; cls?: string }) {
  return <span className={`acc-brandmark ${cls}`.trim()}>{mono}</span>;
}
function NetBadge({ network }: { network: string }) {
  return (
    <span className={`acc-net acc-net--${network}`} title={NET_LABEL[network] || network}>
      {NetLogo({ network, s: 12, bold: true }) ?? NET_GLYPH[network] ?? "•"}
    </span>
  );
}
export function Avatar({ p, cls = "acc-av" }: { p: AccountProfile; cls?: string }) {
  return (
    <span className={cls}>
      {p.avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.avatar} alt="" />
      ) : (
        <span className="mono">{initials(p.name, p.handle)}</span>
      )}
      <NetBadge network={p.network} />
    </span>
  );
}

// ── metrics (shared by profile + brand aggregate) ────────────────────────────
function Metric({
  lab,
  icon,
  val,
  unit,
  extra,
  attention,
}: {
  lab: string;
  icon: string;
  val: string;
  unit?: string;
  extra?: React.ReactNode;
  attention?: boolean;
}) {
  const noData = val === "—";
  return (
    <div className={`acc-m${attention ? " acc-m--attention" : ""}`}>
      <span className="acc-m-lab">
        <DynIcon n={icon} s={11} />
        <span className="acc-m-labtxt">{lab}</span>
      </span>
      <span className="acc-m-row">
        <span className="acc-m-val">
          {val}
          {unit && !noData ? <span className="u"> {unit}</span> : null}
        </span>
        {extra && !noData ? extra : null}
      </span>
    </div>
  );
}

function Metrics4({
  t,
  d,
  muted,
}: {
  t: T;
  d: { followers: number | null; followers_delta: number | null; views_7d: number; posts_week: number; replies_to_answer: number };
  muted?: boolean;
}) {
  const followers = d.followers == null ? "—" : nfmt(d.followers);
  return (
    <div className="acc-metrics">
      <Metric lab={t("acc.followers")} icon="users" val={followers} extra={<Delta v={d.followers_delta} />} />
      <Metric lab={t("acc.views")} icon="eye" val={muted ? "—" : nfmt(d.views_7d)} />
      <Metric lab={t("acc.posts")} icon="nib" val={muted ? "—" : String(d.posts_week)} unit={t("acc.posts_unit")} />
      <Metric
        lab={t("acc.replies")}
        icon="bubble"
        val={muted ? "—" : String(d.replies_to_answer)}
        attention={!muted && d.replies_to_answer > 0}
      />
    </div>
  );
}

// ── disconnected profile card ────────────────────────────────────────────────
// A profile whose OAuth was revoked/expired (p.disconnected). It keeps its row +
// all config; we render a reassuring, recoverable card (no metrics) with a
// "Disconnected" pill + Reconnect, so a dead profile is visible and restorable
// rather than hidden. Shown both in the all-disconnected dashboard and inline in
// the mixed grid. Reconnect re-runs the same Threads OAuth (same app reactivates
// the existing row).
export const IcCheckSm = ({ s = 12 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12l4.5 4.5L19 7" />
  </svg>
);
const IcLinkSm = ({ s = 13 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 15 15 9" />
    <path d="M11 6.6 12.5 5.1a4 4 0 0 1 5.6 5.6L16.6 12.2" />
    <path d="M13 17.4 11.5 18.9a4 4 0 0 1-5.6-5.6L7.4 11.8" />
  </svg>
);

// "N days/weeks/months ago", localized to the ACTIVE app locale (pass nav.locale,
// NOT the browser's) — so a ru/de/es UI on an English browser still reads
// «2 дня назад», per [[feedback_localize_to_user_locale]]. A malformed ISO stamp
// yields "" instead of throwing.
export function relSince(iso: string | null, locale: string): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const day = Math.max(0, Math.round((Date.now() - then) / 86_400_000));
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (day < 7) return rtf.format(-day, "day");
  if (day < 30) return rtf.format(-Math.round(day / 7), "week");
  return rtf.format(-Math.round(day / 30), "month");
}

export function DisconnectedCard({ p, t, nav }: { p: AccountProfile; t: T; nav: Nav }) {
  return (
    <div className="acc-card acc-card--disc">
      <div className="acc-card-head">
        <Avatar p={p} cls="acc-av acc-av--disc" />
        <div className="acc-card-id">
          <div className="acc-card-name">{p.name || p.handle}</div>
          <div className="acc-card-sub">
            {p.handle} · {NET_LABEL[p.network] || p.network}
          </div>
        </div>
      </div>
      <div className="acc-disc-status">
        <span className="status-pill status-pill--warning">
          <i className="pill-dot" />
          {t("acc.disc_pill")}
        </span>
        <span className="acc-disc-safe">
          <IcCheckSm s={12} />
          {t("acc.disc_safe")}
        </span>
      </div>
      <div className="acc-cardfoot acc-cardfoot--disc">
        <span className="acc-disc-since">
          {t("acc.disc_prefix")} {relSince(p.disconnected_at, nav.locale)}
        </span>
        <button className="btn btn--primary btn--sm acc-reconnect" type="button" onClick={() => nav.connectThreads()}>
          <IcLinkSm s={13} />
          {t("acc.reconnect")}
        </button>
      </div>
    </div>
  );
}

// ── profile card (single-brand mode) ─────────────────────────────────────────
function ProfileHead({ p }: { p: AccountProfile }) {
  return (
    <div className="acc-card-head">
      <Avatar p={p} />
      <div className="acc-card-id">
        <div className="acc-card-name">{p.handle || p.name}</div>
        <div className="acc-card-sub">{NET_LABEL[p.network] || p.network}</div>
      </div>
      <span className="acc-go">
        <IcArrowRight size={16} />
      </span>
    </div>
  );
}

export function ProfileCard({ p, t, nav }: { p: AccountProfile; t: T; nav: Nav }) {
  const open = () => nav.openProfile(p.id, "studio");
  // A disconnected profile renders as a recoverable card (pill + Reconnect),
  // not a clickable live card — so the mixed grid shows dead profiles inline.
  if (p.disconnected) return <DisconnectedCard p={p} t={t} nav={nav} />;
  if (p.sync_status === "importing") {
    const im = p.sync_summary || {};
    const posts = im.posts ?? 0;
    const comments = im.new_comments ?? 0;
    const total = im.history_posts ?? 0;
    const pct = total > 0 ? Math.min(99, Math.round((posts / total) * 100)) : 40;
    return (
      <div className="acc-card acc-card--importing">
        <ProfileHead p={p} />
        <div className="import-banner import-banner--syncing">
          <span className="ib-mark">
            <span className="ib-spinner" />
          </span>
          <div className="ib-body">
            <div className="ib-title">{t("acc.importing")}</div>
            <div className="ib-sub">
              <b>{posts}</b> {t("acc.imp_posts")} · <b>{comments}</b> {t("acc.imp_comments")}
            </div>
            <div className="ib-bar">
              <div className="ib-bar-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>
          <span className="ib-since">{t("acc.imp_eta")}</span>
        </div>
      </div>
    );
  }
  if (p.sync_status === "error") {
    return (
      <div className="acc-card" style={{ cursor: "pointer" }} role="button" tabIndex={0} onClick={open} onKeyDown={(e) => e.key === "Enter" && open()}>
        <ProfileHead p={p} />
        <Metrics4 t={t} d={p} muted />
        <div className="acc-cardfoot">
          <span className="acc-sync acc-sync--error">
            <span className="acc-sync-dot" />
            {t("acc.sync_failed")}
          </span>
          <button className="acc-retry" type="button" onClick={(e) => { e.stopPropagation(); nav.retry(); }}>
            <IcUndo size={12} />
            {t("acc.retry")}
          </button>
        </div>
      </div>
    );
  }
  const attn = p.replies_to_answer > 0;
  return (
    <div className="acc-card" style={{ cursor: "pointer" }} role="button" tabIndex={0} onClick={open} onKeyDown={(e) => e.key === "Enter" && open()}>
      <ProfileHead p={p} />
      <Metrics4 t={t} d={p} />
      <div className="acc-cardfoot">
        <span className="acc-sync">
          <span className="acc-sync-dot" />
          {t("acc.synced")}
        </span>
        <div className="acc-quick">
          <a className="acc-quicklink" style={{ cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); nav.openProfile(p.id, "stats"); }}>
            <IcNib size={12} />
            {t("acc.stats")}
          </a>
          <a
            className={`acc-quicklink${attn ? " acc-quicklink--attention" : ""}`}
            style={{ cursor: "pointer" }}
            onClick={(e) => { e.stopPropagation(); nav.openProfile(p.id, "replies"); }}
          >
            <IcReply size={12} />
            {t("acc.replies_short")}
            {attn ? ` ${p.replies_to_answer}` : ""}
          </a>
        </div>
      </div>
    </div>
  );
}

// ── brand card (multi-brand mode) ────────────────────────────────────────────
function BrandStack({ b }: { b: AccountBrand }) {
  const shown = b.profiles.slice(0, 3);
  const more = b.profiles.length - shown.length;
  return (
    <span className="acc-stack">
      {shown.map((p) => (
        <Avatar key={p.id} p={p} />
      ))}
      {more > 0 ? <span className="acc-stack-more">+{more}</span> : null}
    </span>
  );
}

// One profile row inside an expanded brand card (эталон brandProfileRow).
function BrandProfileRow({ p, t, nav }: { p: AccountProfile; t: T; nav: Nav }) {
  // A disconnected profile inside an expanded brand is non-navigable — there is
  // no live studio to open. Render a recoverable row (pill + Reconnect) instead
  // of a clickable "0 followers" link into a dead screen.
  if (p.disconnected) {
    return (
      <div className="acc-bp acc-bp--disc">
        <Avatar p={p} cls="acc-bp-av" />
        <span className="acc-bp-id">
          <span className="acc-bp-hd">{p.handle || p.name}</span>
          <span className="acc-bp-sub">{t("acc.disc_pill")}</span>
        </span>
        <button className="acc-bp-reconnect" type="button" onClick={(e) => { e.stopPropagation(); nav.connectThreads(); }}>
          <IcLinkSm s={12} />
          {t("acc.reconnect")}
        </button>
      </div>
    );
  }
  let right: React.ReactNode;
  if (p.sync_status === "importing") {
    right = (
      <span className="acc-bp-state acc-bp-state--sync">
        <span className="ib-spinner" style={{ width: 13, height: 13 }} />
        {t("acc.importing_n")}
      </span>
    );
  } else if (p.sync_status === "error") {
    right = (
      <button className="acc-bp-retry" type="button" onClick={(e) => { e.stopPropagation(); nav.retry(); }}>
        <IcUndo size={12} />
        {t("acc.retry")}
      </button>
    );
  } else {
    right = (
      <span className="acc-bp-mini">
        <span className="acc-bp-stat">
          <span className="acc-bp-statnum">{nfmt(p.followers ?? 0)}</span>
          <span className="acc-bp-statlab">{t("acc.followers")}</span>
        </span>
        <span className="acc-bp-stat">
          <span className="acc-bp-statnum">{nfmt(p.views_7d)}</span>
          <span className="acc-bp-statlab">{t("acc.views")}</span>
        </span>
      </span>
    );
  }
  return (
    <a className="acc-bp" style={{ cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); nav.openProfile(p.id, "studio"); }}>
      <Avatar p={p} cls="acc-bp-av" />
      <span className="acc-bp-id">
        <span className="acc-bp-hd">{p.handle || p.name}</span>
        <span className="acc-bp-sub">{NET_LABEL[p.network] || p.network}</span>
      </span>
      {right}
    </a>
  );
}

export function BrandCard({ b, t, plural, nav }: { b: AccountBrand; t: T; plural: Plural; nav: Nav }) {
  const [expanded, setExpanded] = useState(false);
  const pc = b.profiles.length;
  const errors = b.profiles.filter((p) => p.sync_status === "error").length;
  const importing = b.profiles.filter((p) => p.sync_status === "importing").length;
  const disc = b.profiles.filter((p) => p.disconnected).length;
  const brandMono = initials(b.name, null);
  const agg = {
    followers: b.stats.followers,
    followers_delta: b.stats.followers_delta,
    views_7d: b.stats.views_7d,
    posts_week: b.stats.posts_week,
    replies_to_answer: b.stats.replies_to_answer,
  };
  // Клик по бренду → раскрывает его профили (SPEC: «дашборд бренда, который
  // раскрывает профили»). The expand button + the head both toggle.
  const toggle = () => pc > 0 && setExpanded((x) => !x);
  return (
    <div className="acc-card acc-card--brand">
      <div className="acc-card-head" style={pc > 0 ? { cursor: "pointer" } : undefined} role={pc > 0 ? "button" : undefined} tabIndex={pc > 0 ? 0 : undefined} onClick={toggle} onKeyDown={(e) => e.key === "Enter" && toggle()}>
        <span style={{ position: "relative", flex: "0 0 auto" }}>
          <BrandMark mono={brandMono} />
          <span className="acc-brand-net">
            {b.networks.map((nid) => (
              <span key={nid} className="acc-brand-netbadge">
                {NetLogo({ network: nid, s: 11, bold: true }) ?? NET_GLYPH[nid] ?? "•"}
              </span>
            ))}
          </span>
        </span>
        <div className="acc-card-id">
          <div className="acc-card-name">{b.name}</div>
          <div className="acc-card-sub">
            {pc} {plural("profiles", pc)}
          </div>
        </div>
        <span className="acc-go">
          <IcArrowRight size={16} />
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14, minWidth: 0 }}>
        <BrandStack b={b} />
      </div>
      <Metrics4 t={t} d={agg} />
      <div className="acc-cardfoot">
        <span className="acc-brand-statline">
          <span className={`acc-brand-statdot${errors || importing || disc ? " acc-brand-statdot--warn" : ""}`} />
          {errors
            ? `${errors} ${t("acc.error_n")}`
            : disc
              ? `${disc} ${t("acc.disconnected_n")}`
              : importing
                ? `${importing} ${t("acc.importing_n")}`
                : t("acc.synced_all")}
        </span>
        {pc > 0 ? (
          <button className="acc-brand-expand" type="button" aria-expanded={expanded} onClick={(e) => { e.stopPropagation(); toggle(); }}>
            {t("acc.expand")}
            <IcChevDown size={13} className={expanded ? "rotate-180" : undefined} />
          </button>
        ) : null}
      </div>
      {expanded ? (
        <div className="acc-brand-profiles">
          {b.profiles.map((p) => (
            <BrandProfileRow key={p.id} p={p} t={t} nav={nav} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

// ── add-brand CTA ────────────────────────────────────────────────────────────
export function AddBrand({ t, nav }: { t: T; nav: Nav }) {
  return (
    <a className="acc-add" style={{ cursor: "pointer" }} onClick={nav.addProfile}>
      <span className="acc-add-ico">
        <IcPlus size={20} />
      </span>
      <span className="acc-add-t">{t("acc.add_brand_t")}</span>
      <span className="acc-add-s">{t("acc.add_brand_s")}</span>
    </a>
  );
}

// ── cards section (adaptive on scope.show_brand_level) ───────────────────────
export function CardsSection({ data, t, plural, nav }: { data: MeAccountResponse; t: T; plural: Plural; nav: Nav }) {
  const multi = data.scope.show_brand_level;
  // Single-brand grid renders every profile card (live + disconnected), so the
  // section count matches the visible cards — not profiles_count (LIVE-only),
  // which would read "3 profiles" over 4 cards in a mixed state.
  const count = multi ? data.brands.length : data.brands.flatMap((b) => b.profiles).length;
  return (
    <>
      <div className="acc-sec">
        <span className="acc-sec-t">{multi ? t("acc.sec_brands") : t("acc.sec_profiles")}</span>
        <span className="acc-sec-n">{count}</span>
        <span className="acc-sec-note">{multi ? t("acc.note_brand") : t("acc.note_profile")}</span>
      </div>
      <div className="acc-grid">
        {multi
          ? data.brands.map((b) => <BrandCard key={b.id} b={b} t={t} plural={plural} nav={nav} />)
          : data.brands.flatMap((b) => b.profiles).map((p) => <ProfileCard key={p.id} p={p} t={t} nav={nav} />)}
        <AddBrand t={t} nav={nav} />
      </div>
    </>
  );
}

// ── header band (identity + portfolio totals) ────────────────────────────────
function HeaderTotal({
  lab,
  icon,
  num,
  sub,
  extra,
  attention,
}: {
  lab: string;
  icon: string;
  num: string;
  sub: string;
  extra?: React.ReactNode;
  attention?: boolean;
}) {
  return (
    <div className={`acc-ht${attention ? " acc-ht--attention" : ""}`}>
      <div className="acc-ht-lab">
        <DynIcon n={icon} s={12} />
        <span className="acc-ht-labtxt">{lab}</span>
      </div>
      <div className="acc-ht-row">
        <span className="acc-ht-num">{num}</span>
        {extra}
      </div>
      <div className="acc-ht-sub">{sub}</div>
    </div>
  );
}

export function Header({
  data,
  t,
  plural,
}: {
  data: MeAccountResponse;
  t: T;
  plural: Plural;
}) {
  const totals: OverviewTotals = data.totals;
  const brandsN = data.scope.brands_count;
  const profilesN = data.scope.profiles_count;
  const nets = data.brands.flatMap((b) => b.networks);
  const netLabel = [...new Set(nets)].map((n) => NET_LABEL[n] || n).join(" · ") || "Threads";
  const scale =
    brandsN >= 2
      ? `${profilesN} ${plural("profiles", profilesN)} · ${brandsN} ${plural("brands", brandsN)} · ${netLabel}`
      : `${profilesN} ${plural("profiles", profilesN)} · ${netLabel}`;
  const id = useChromeIdentity(data.tenant.name);
  return (
    <div className="acc-head">
      <div className="acc-head-id">
        <AcctMark mono={id.mono} />
        <div className="acc-head-txt">
          <div className="acc-head-name">{id.name}</div>
          <div className="acc-head-meta">
            <span className="acc-head-plan">{data.tenant.plan_tier}</span>
            <span className="acc-head-scale">{scale}</span>
          </div>
        </div>
      </div>
      <div className="acc-head-spacer" />
      <div className="acc-head-totals">
        <HeaderTotal lab={t("acc.followers")} icon="users" num={nfmt(totals.followers)} sub={t("acc.sub_all")} extra={<Delta v={totals.followers_delta} />} />
        <HeaderTotal lab={t("acc.views")} icon="eye" num={nfmt(totals.views_7d)} sub={t("acc.sub_7d")} />
        <HeaderTotal lab={t("acc.posts")} icon="nib" num={String(totals.posts_week)} sub={t("acc.sub_week")} />
        <HeaderTotal lab={t("acc.replies")} icon="bubble" num={String(totals.replies_to_answer)} sub={t("acc.sub_wait")} attention />
      </div>
    </div>
  );
}

// ── tasks strip ──────────────────────────────────────────────────────────────
const TASK_IC: Record<string, string> = { sync: "alert", reply: "reply", draft: "nib", audit: "audit" };

export function TasksStrip({ tasks, t, plural, nav }: { tasks: AccountTasks; t: T; plural: Plural; nav: Nav }) {
  const chips: { type: string; n: number; label: string }[] = [];
  // sync + reply labels are invariant phrases («сбой синка» · «к ответу»); the
  // count-noun chips (drafts/audits) inflect per-locale so «1 черновик» is right.
  if (tasks.sync_errors) chips.push({ type: "sync", n: tasks.sync_errors, label: t("acc.task_sync") });
  if (tasks.replies_attention) chips.push({ type: "reply", n: tasks.replies_attention, label: t("acc.task_replies") });
  if (tasks.pending_drafts) chips.push({ type: "draft", n: tasks.pending_drafts, label: plural("drafts", tasks.pending_drafts) });
  if (tasks.pending_audits) chips.push({ type: "audit", n: tasks.pending_audits, label: plural("audits", tasks.pending_audits) });
  if (!chips.length) return null;
  return (
    <div className="acc-tasks">
      <span className="acc-tasks-lab">
        <IcAlert size={15} />
        {t("acc.tasks_title")}
      </span>
      <div className="acc-tasks-chips">
        {chips.map((c) => (
          <span key={c.type} className={`acc-taskchip${c.type === "sync" ? " acc-taskchip--sync" : ""}`}>
            <DynIcon n={TASK_IC[c.type]} s={12} />
            <b>{c.n}</b> {c.label}
          </span>
        ))}
      </div>
      <a className="acc-tasks-all" style={{ cursor: "pointer" }} onClick={() => nav.go("/app/overview")}>
        {t("acc.tasks_all")}
        <IcArrowRight size={13} />
      </a>
    </div>
  );
}

// Which account-level screen a chrome instance sits on (drives the active nav
// row + the breadcrumb). The dashboard, the portfolio advisor chat, and account
// settings share ONE sidebar/topbar set, parameterized by this.
export type AccountPage = "dashboard" | "advisor" | "settings";

// ── sidebar (account level) ──────────────────────────────────────────────────
export function Sidebar({ data, t, nav, active = "dashboard" }: { data: MeAccountResponse; t: T; nav: Nav; active?: AccountPage }) {
  const multi = data.scope.brands_count >= 2;
  const [loginOpen, setLoginOpen] = useState(false);
  const id = useChromeIdentity(data.tenant.name);
  const mono = id.mono;
  // Active row = current page (no navigation); inactive rows go to their route.
  const row = (page: AccountPage, route: string) =>
    active === page ? { className: "acc-sb-row acc-sb-row--active" } : { className: "acc-sb-row", onClick: () => nav.go(route) };
  return (
    <div className="acc-sb">
      <div className="acc-sb-brand">
        <span className="acc-sb-mark">
          <BrandLogo size={30} radius={9} />
        </span>
        <span className="acc-sb-name">Pennedly</span>
      </div>
      <div className="acc-sb-cap">{t("acc.account_word")}</div>
      <div className="acc-sb-nav">
        <a {...row("dashboard", "/app/account")} style={{ cursor: "pointer" }}>
          <IcOverview size={17} />
          <span className="acc-sb-rowtxt">{t("acc.nav_dashboard")}</span>
        </a>
        {multi ? (
          <a
            className="acc-sb-row"
            style={{ cursor: "pointer" }}
            onClick={() =>
              active === "dashboard"
                ? document.querySelector(".acc-sec")?.scrollIntoView({ behavior: "smooth", block: "start" })
                : nav.go("/app/account")
            }
          >
            <IcLayers size={17} />
            <span className="acc-sb-rowtxt">{t("acc.nav_brands")}</span>
            <span className="acc-sb-badge">{data.scope.brands_count}</span>
          </a>
        ) : null}
        <a {...row("advisor", "/app/account/advisor")} style={{ cursor: "pointer" }}>
          <IcAdvisor size={17} />
          <span className="acc-sb-rowtxt">{t("acc.nav_advisor")}</span>
        </a>
        <a {...row("settings", "/app/account/settings")} style={{ cursor: "pointer" }}>
          <IcSettings size={17} />
          <span className="acc-sb-rowtxt">{t("acc.nav_settings")}</span>
        </a>
      </div>
      <div className="acc-sb-foot" style={{ position: "relative" }}>
        <button className="acc-login" type="button" aria-expanded={loginOpen} onClick={() => setLoginOpen((o) => !o)}>
          <AcctMark mono={mono} />
          <span className="acc-login-who">
            <span className="acc-login-email">{id.email}</span>
            <span className="acc-login-plan">{data.tenant.plan_tier}</span>
          </span>
          <IcChevDown size={15} className="rotate-180" />
        </button>
        {loginOpen ? (
          <>
            <div style={{ position: "fixed", inset: 0, zIndex: 30 }} onClick={() => setLoginOpen(false)} aria-hidden />
            <div className="acc-loginmenu" style={{ position: "absolute", left: 0, right: 0, bottom: "100%", marginBottom: 8, zIndex: 40 }}>
              <div className="acc-lm-cap">{t("acc.account_word")}</div>
              <div className="acc-lm-row">
                <span className="acc-acctmark">{mono}</span>
                <span className="acc-lm-who">
                  <span className="acc-lm-email">{id.email}</span>
                  <span className="acc-lm-plan">{data.tenant.plan_tier}</span>
                </span>
                <span className="acc-lm-check">
                  <IcCheck size={16} />
                </span>
              </div>
              <div className="acc-lm-sep" />
              <button className="acc-lm-row acc-lm-row--min" type="button" onClick={() => { setLoginOpen(false); nav.go("/app/account/settings"); }}>
                <span className="acc-lm-mini">
                  <IcSettings size={15} />
                </span>
                {t("acc.nav_settings")}
              </button>
              <button className="acc-lm-row acc-lm-row--min" type="button" onClick={() => { setLoginOpen(false); nav.logout(); }}>
                <span className="acc-lm-mini">
                  <IcLogout size={15} />
                </span>
                {t("settings.logout")}
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

// ── topbar (breadcrumb + flat profile switcher) ──────────────────────────────
function SwitcherRow({ p, active, t, nav, onDone }: { p: AccountProfile; active: boolean; t: T; nav: Nav; onDone: () => void }) {
  // A disconnected profile has no live studio to open — the row reconnects
  // (re-runs Threads OAuth) instead of navigating to a dead screen.
  if (p.disconnected) {
    return (
      <button className="acc-swrow acc-swrow--disc" type="button" onClick={() => { onDone(); nav.connectThreads(); }}>
        <Avatar p={p} cls="acc-sw-av" />
        <span className="acc-swrow-who">
          <span className="acc-swrow-nm">{p.handle || p.name}</span>
          <span className="acc-swrow-hd">{t("acc.disc_pill")}</span>
        </span>
        <span className="acc-swrow-reconnect">{t("acc.reconnect")}</span>
      </button>
    );
  }
  const dotCls =
    p.sync_status === "error"
      ? " acc-swrow-stat--error"
      : p.sync_status === "importing"
        ? " acc-swrow-stat--importing"
        : "";
  return (
    <button
      className="acc-swrow"
      type="button"
      onClick={() => { onDone(); nav.openProfile(p.id, "studio"); }}
    >
      <Avatar p={p} cls="acc-sw-av" />
      <span className="acc-swrow-who">
        <span className="acc-swrow-nm">{p.handle || p.name}</span>
        <span className="acc-swrow-hd">{NET_LABEL[p.network] || p.network}</span>
      </span>
      {active ? (
        <span className="acc-swrow-check">
          <IcCheck size={16} />
        </span>
      ) : (
        <span className={`acc-swrow-stat${dotCls}`} />
      )}
    </button>
  );
}

export function Topbar({ data, t, plural, dark, nav }: { data: MeAccountResponse; t: T; plural: Plural; dark?: boolean; nav: Nav }) {
  const acctMono = useChromeIdentity(data.tenant.name).mono;
  const allProfiles = data.brands.flatMap((b) => b.profiles);
  // The "N profiles" claim + the avatar stack count LIVE profiles only — a
  // disconnected profile is a reconnect target, not an active profile, so an
  // all-disconnected tenant honestly reads "0 profiles" (not "3").
  const liveProfiles = allProfiles.filter((p) => !p.disconnected);
  const stack = liveProfiles.slice(0, 3);
  const multi = data.scope.show_brand_level;
  const selected = useSelectedAccountId();
  const [swOpen, setSwOpen] = useState(false);
  const close = () => setSwOpen(false);

  // Theme icon reflects the live theme: the gallery passes `dark`; the real
  // screen reads the ambient `.dark` class (and flips it on toggle).
  const [themeDark, setThemeDark] = useState(!!dark);
  useEffect(() => {
    if (dark === undefined && typeof document !== "undefined") {
      setThemeDark(document.documentElement.classList.contains("dark"));
    }
  }, [dark]);
  const isDark = dark ?? themeDark;

  return (
    <div className="acc-top">
      <nav className="acc-crumb">
        <a className="acc-crumb-seg acc-crumb-seg--current">
          <AcctMark mono={acctMono} />
          <span className="acc-crumb-txt">{t("acc.crumb_account")}</span>
        </a>
      </nav>
      <div className="acc-top-actions">
        <div style={{ position: "relative" }}>
          <button className="acc-sw" type="button" aria-expanded={swOpen} onClick={() => setSwOpen((o) => !o)}>
            <span className="acc-sw-stack">
              {stack.map((p) => (
                <Avatar key={p.id} p={p} />
              ))}
            </span>
            <span className="acc-sw-lab">
              <span className="acc-sw-t">{t("acc.sw_all")}</span>
              <span className="acc-sw-s">
                {liveProfiles.length} {plural("profiles", liveProfiles.length)}
              </span>
            </span>
            <IcChevDown size={15} />
          </button>
          {swOpen ? (
            <>
              <div style={{ position: "fixed", inset: 0, zIndex: 30 }} onClick={close} aria-hidden />
              <div className="acc-swmenu" style={{ position: "absolute", right: 0, top: "100%", marginTop: 8, zIndex: 40 }}>
                {multi ? (
                  data.brands.map((b) => (
                    <div key={b.id}>
                      <div className="acc-swmenu-cap">
                        <span className="acc-brandmark">{initials(b.name, null)}</span>
                        <span className="t">{b.name}</span>
                      </div>
                      {b.profiles.map((p) => (
                        <SwitcherRow key={p.id} p={p} active={p.id === selected} t={t} nav={nav} onDone={close} />
                      ))}
                    </div>
                  ))
                ) : (
                  <>
                    <div className="acc-swmenu-cap">
                      <span className="t">{t("acc.sw_jump")}</span>
                    </div>
                    {allProfiles.map((p) => (
                      <SwitcherRow key={p.id} p={p} active={p.id === selected} t={t} nav={nav} onDone={close} />
                    ))}
                  </>
                )}
                <div className="acc-sw-sep" />
                <button className="acc-swrow acc-swrow--add" type="button" onClick={() => { close(); nav.addProfile(); }}>
                  <span className="acc-sw-av">
                    <IcPlus size={15} />
                  </span>
                  <span className="acc-swrow-who">
                    <span className="acc-swrow-nm">{t("acc.sw_connect")}</span>
                  </span>
                </button>
              </div>
            </>
          ) : null}
        </div>
        <span className="acc-ib" style={{ cursor: "pointer" }} onClick={() => { nav.toggleTheme(); setThemeDark((d) => !d); }}>
          {isDark ? <IcSun size={16} /> : <IcMoon size={16} />}
        </span>
        <span className="acc-ib" style={{ cursor: "pointer" }} onClick={() => nav.go("/app/account/settings")}>
          <IcSettings size={16} />
        </span>
      </div>
    </div>
  );
}

// ── breadcrumb + sub-screen topbar (settings / advisor) ──────────────────────
// The dashboard's own topbar (above) carries the profile switcher; the
// sub-screens (settings, advisor) use this simpler bar — a multi-segment
// breadcrumb «Аккаунт › [page]» (the «Аккаунт» segment links home) + an optional
// status pill + the theme toggle. Mirrors the эталон account-screens.js topbar.
export function ScreenTopbar({
  page,
  tenantName,
  t,
  nav,
  dark,
  pill,
}: {
  page: AccountPage;
  tenantName: string;
  t: T;
  nav: Nav;
  dark?: boolean;
  pill?: string;
}) {
  const acctMono = useChromeIdentity(tenantName).mono;
  const pageLabel = page === "settings" ? t("acc.crumb_settings") : t("acc.crumb_advisor");
  const [themeDark, setThemeDark] = useState(!!dark);
  useEffect(() => {
    if (dark === undefined && typeof document !== "undefined") {
      setThemeDark(document.documentElement.classList.contains("dark"));
    }
  }, [dark]);
  const isDark = dark ?? themeDark;
  return (
    <div className="acc-top">
      <nav className="acc-crumb">
        <a className="acc-crumb-seg" style={{ cursor: "pointer" }} onClick={() => nav.go("/app/account")}>
          <AcctMark mono={acctMono} />
          <span className="acc-crumb-txt">{t("acc.crumb_account")}</span>
        </a>
        <span className="acc-crumb-sep">
          <IcChevRight size={14} />
        </span>
        <a className="acc-crumb-seg acc-crumb-seg--current">
          <span className="acc-crumb-txt">{pageLabel}</span>
        </a>
      </nav>
      <div className="acc-top-actions">
        {pill ? (
          <span className="acc-toppill">
            <IcSparkle size={13} />
            {pill}
          </span>
        ) : null}
        <span className="acc-ib" style={{ cursor: "pointer" }} onClick={() => { nav.toggleTheme(); setThemeDark((d) => !d); }}>
          {isDark ? <IcSun size={16} /> : <IcMoon size={16} />}
        </span>
      </div>
    </div>
  );
}

// ── advisor (account scope, hero) — verdict/detail/chips + reco side rail ─────
// AdvisorData now lives in @/lib/types (imported + re-exported at the top).

export function Advisor({ adv, t, onOpen }: { adv: AdvisorData; t: T; onOpen?: () => void }) {
  return (
    <section className="acc-adv">
      <div className="acc-adv-rail">
        <span className="acc-adv-mark">
          <IcAdvisor size={20} />
        </span>
        <div className="acc-adv-headtext">
          <div className="acc-adv-title">{t("acc.adv_title")}</div>
          <div className="acc-adv-scope">{t("acc.adv_scope")}</div>
        </div>
        <button className="btn btn--secondary btn--sm acc-adv-open" type="button" onClick={onOpen}>
          <IcAdvisor size={15} />
          {t("acc.adv_open")}
        </button>
      </div>
      <div className="acc-adv-body">
        <div className="acc-adv-main">
          <div className="acc-adv-verdict">{adv.verdict}</div>
          <div className="acc-adv-detail">{adv.detail}</div>
          <div className="acc-adv-chips">
            {adv.chips.map((c, i) => (
              <span key={i} className={`acc-chip acc-chip--${c.tone}`}>
                <DynIcon n={c.icon} s={13} />
                <span className="t">{c.text}</span>
              </span>
            ))}
          </div>
          <div className="acc-adv-grounded">
            <span className="lab">
              <IcSparkle size={12} />
              {t("acc.adv_grounded")}
            </span>
            <span className="src">{adv.grounded}</span>
          </div>
          <div
            className="acc-adv-composer"
            onClick={onOpen}
            style={onOpen ? { cursor: "pointer" } : undefined}
          >
            <span className="ph">{t("acc.adv_ask")}</span>
            <button className="acc-adv-send" type="button" onClick={onOpen}>
              <IcSend size={17} />
            </button>
          </div>
        </div>
        <div className="acc-adv-side">
          <div className="acc-adv-sidecap">{t("acc.adv_reco")}</div>
          {adv.recos.map((r, i) => (
            <a key={i} className={`acc-rec${r.tone === "danger" ? " acc-rec--danger" : r.tone === "accent" ? " acc-rec--accent" : ""}`}>
              <span className="acc-rec-ic">
                <DynIcon n={r.icon} s={15} />
              </span>
              <span className="acc-rec-body">
                <span className="acc-rec-t">{r.t}</span>
                <span className="acc-rec-s">{r.s}</span>
              </span>
              <span className="acc-rec-go">
                <IcChevRight size={16} />
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── skeleton (loading) ───────────────────────────────────────────────────────
export function AccountSkeleton() {
  const line = (w: string, h: number, mt = 0, r = 6) => (
    <div className="skel-line" style={{ width: w, height: h, marginTop: mt, borderRadius: r }} />
  );
  const card = (
    <div className="acc-card">
      <div className="acc-card-head">
        <span className="acc-av" />
        <div className="acc-card-id">
          {line("92px", 13)}
          {line("60px", 11, 6)}
        </div>
        <span className="acc-go" />
      </div>
      <div className="acc-metrics">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skel-line" style={{ height: 16, margin: "9px 0" }} />
        ))}
      </div>
      <div className="acc-cardfoot">
        {line("110px", 12)}
        {line("120px", 22, 0, 999)}
      </div>
    </div>
  );
  return (
    <div className="acc">
      <div className="acc-head">
        <span className="acc-acctmark" style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }} />
        <div style={{ flex: "1 1 auto", minWidth: 0 }}>
          {line("140px", 18)}
          {line("200px", 12, 8)}
        </div>
      </div>
      <div className="acc-grid">
        {card}
        {card}
      </div>
    </div>
  );
}

// ── advisor invite (honest, until an account-scope advisor endpoint exists) ───
// The эталон advisor hero shows a rich verdict + recos; those need a portfolio-
// scope advisor call the backend doesn't expose yet. Per the "no invented
// features" rule we ship the real advisor SHELL (rail + scope + open-chat entry)
// with an honest invite body instead of fabricated numbers — swap to <Advisor>
// once GET /api/account-advisor lands.
export function AdvisorInvite({ t, onOpen }: { t: T; onOpen?: () => void }) {
  return (
    <section className="acc-adv">
      <div className="acc-adv-rail">
        <span className="acc-adv-mark">
          <IcAdvisor size={20} />
        </span>
        <div className="acc-adv-headtext">
          <div className="acc-adv-title">{t("acc.adv_title")}</div>
          <div className="acc-adv-scope">{t("acc.adv_scope")}</div>
        </div>
        <button className="btn btn--secondary btn--sm acc-adv-open" type="button" onClick={onOpen}>
          <IcAdvisor size={15} />
          {t("acc.adv_open")}
        </button>
      </div>
      <div className="acc-adv-body" style={{ gridTemplateColumns: "1fr" }}>
        <div className="acc-adv-main">
          <div className="acc-adv-detail">{t("acc.adv_invite")}</div>
          <div className="acc-adv-composer" onClick={onOpen} style={{ cursor: "pointer" }}>
            <span className="ph">{t("acc.adv_ask")}</span>
            <button className="acc-adv-send" type="button" onClick={onOpen}>
              <IcSend size={17} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── full dashboard composition ───────────────────────────────────────────────
export function AccountDashboard({
  data,
  adv,
  t,
  plural,
  dark,
  onOpenAdvisor,
  onRetry,
}: {
  data: MeAccountResponse;
  // Rich advisor content (gallery/demo). Omit on the live screen → the honest
  // AdvisorInvite shell renders instead (no fabricated numbers).
  adv?: AdvisorData;
  t: T;
  plural: Plural;
  dark?: boolean;
  onOpenAdvisor?: () => void;
  // In-place refetch for the sync-error «Повторить» (C9). Omitted (gallery/demo)
  // → the nav default (full page reload) stays.
  onRetry?: () => void;
}) {
  const baseNav = useAccountNav();
  const [pickOpen, setPickOpen] = useState(false);
  // Every add-affordance below (add-brand tile, switcher «Подключить профиль»)
  // opens the network picker; only its Threads row (nav.connectThreads) starts
  // the OAuth. Per-profile Reconnect buttons bypass the picker — their network
  // is already known.
  const nav = { ...baseNav, addProfile: () => setPickOpen(true), ...(onRetry ? { retry: onRetry } : {}) };
  return (
    <div className="acc-shell">
      <Sidebar data={data} t={t} nav={nav} />
      <div className="acc-mainwrap" style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 18 }}>
        <Topbar data={data} t={t} plural={plural} dark={dark} nav={nav} />
        <div className="acc">
          <Header data={data} t={t} plural={plural} />
          <TasksStrip tasks={data.tasks} t={t} plural={plural} nav={nav} />
          {adv ? (
            <Advisor adv={adv} t={t} onOpen={onOpenAdvisor} />
          ) : (
            <AdvisorInvite t={t} onOpen={onOpenAdvisor} />
          )}
          <CardsSection data={data} t={t} plural={plural} nav={nav} />
        </div>
      </div>
      <ConnectNetworkDialog open={pickOpen} onClose={() => setPickOpen(false)} t={t} nav={baseNav} />
    </div>
  );
}
