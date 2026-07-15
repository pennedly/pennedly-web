"use client";

// Account dashboard V3 «Советник» — a 1:1 React port of the CD эталон
// (design-export/PennedlyDesign/account/v3.js + v3.css/atoms.css). The
// advisor-led briefing concept: a large editorial VERDICT leads (its grounded
// chips + recommendations are the primary actions), then the four totals + the
// channels sit BELOW as «Доказательства». Data-driven from `MeAccountResponse`
// (GET /api/me/account) + the separate advisor hero (GET /api/me/account/advisor).
//
// ONE V3 body (<V3Body/>) serves BOTH breakpoints — width-adaptive via container
// queries — under two different chromes: the desktop sidebar+topbar here, the
// mobile top-bar+drawer+switcher in AccountMobileDashboard. Copy comes in via a
// `t()` translator so the same components serve the gallery (demo strings) and
// the live screen (i18n).
//
// Product decision C (advisor routing): the dashboard IS the advisor's home, so
// there is NO «Советник» nav item. The ask line + «Открыть советника» don't
// expand a chat inline — they route to /app/account/advisor, seeding the first
// question via sessionStorage (ADVISOR_SEED_KEY). The chat screen stays as the
// deep multi-turn view, reached only from here.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { setSelectedAccountId, useSelectedAccountId } from "@/lib/account";
import { useMe } from "@/lib/use-account-data";
import { logout, startThreadsConnect } from "@/lib/api";
import { resetAccountsPresenceForSignedOutUser } from "@/lib/accounts";
import { useTranslation } from "@/lib/i18n";
import {
  BrandMark as BrandLogo,
  IcAdvisor,
  IcAlert,
  IcArrowDown,
  IcArrowUp,
  IcAudit,
  IcBubble,
  IcCheck,
  IcChevDown,
  IcChevRight,
  IcEye,
  IcLayers,
  IcLink,
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
  IcUnlink,
  IcUsers,
  IcVoice,
  type IconProps,
} from "@/components/icons";
// Real network logos + the add-flow dialog (shared with the empty states).
// Type-only in the other direction (networks.tsx imports `type {Nav, T}` from
// here), so there is no runtime cycle.
import { ConnectNetworkDialog, NetLogo } from "./networks";
import type {
  AccountBrand,
  AccountProfile,
  AdvisorData,
  MeAccountResponse,
  OverviewTotals,
} from "@/lib/types";

// Re-exported so account-demo.ts + consumers can keep importing it from here.
export type { AdvisorData };

// sessionStorage key the dashboard writes a seeded first question to before
// routing into the advisor chat; the chat reads + clears it on mount (decision
// C — the ask line / starters / recos «задают один вопрос» and hand off).
export const ADVISOR_SEED_KEY = "pennedly.advisor_seed";

// ── dynamic-icon map ─────────────────────────────────────────────────────────
// The dashboard's data (chips / recos) carries icon names as strings from the
// design-token vocab (the backend/demo emit these — do NOT change the contract).
// This maps those token names to the app's design-system icons so
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

// Resolves a design-token icon name (chip/reco) to an app icon at render time,
// falling back to the sparkle glyph for any unknown name.
export function DynIcon({ n, s = 14 }: { n: string; s?: number }) {
  const C = DYN_ICONS[n] ?? IcSparkle;
  return <C size={s} />;
}

// ── translator + helpers ─────────────────────────────────────────────────────
export type T = (key: string) => string;
// Grammatical plural for a count — the caller wires it to the app's pluralUnit
// (locale-aware: «1 профиль» · «3 профиля» · «5 профилей»).
export type Plural = (unit: "profiles" | "brands" | "drafts" | "audits", n: number) => string;

// Navigation the dashboard's controls drive. Built once from next/navigation +
// the selected-account store, threaded to every interactive part so the same
// components stay presentational (the gallery gets a live router too, harmless).
export type ProfileView = "studio" | "stats" | "replies";
export type Nav = {
  openProfile: (id: number, view?: ProfileView) => void; // switch profile → its screen
  go: (route: string) => void; // plain push (nav rows, settings, triage)
  // The ADD flow (add tile / switcher-drawer «подключить»): opens the network
  // picker (Threads live · LinkedIn soon) — the dashboard roots override the
  // hook default with their dialog/sheet opener, so the user always gets the
  // network CHOICE first.
  addProfile: () => void;
  // Direct Threads OAuth — the picker's Threads row + the per-profile Reconnect
  // buttons (a disconnected THREADS profile has a known network, no choice).
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
    connectThreads,
    addProfile: connectThreads,
    logout: () => {
      resetAccountsPresenceForSignedOutUser();
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

// Compact-K formatter, a faithful port of the эталон `fmtK` (vk.js): «22K» /
// «262K» uppercase, compacts at ≥1000, comma decimal, and — critically —
// null → «—» (a synced profile whose follower count the metrics worker has not
// snapshotted yet reads honest «—», never a fake «0»).
function fmtK(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n < 1000) return String(n);
  const v = n / 1000;
  const s = v >= 100 ? String(Math.round(v)) : String(Math.round(v * 10) / 10).replace(".", ",");
  return s + "K";
}

// Signed delta text — the эталон `fmtDelta` keeps the full grouped number below
// 10k («+438», «+1 240») and only compacts past it («+12K»); the caller renders
// the sign + arrow, so this is the magnitude only.
function fmtDeltaAbs(a: number): string {
  return a >= 10000 ? fmtK(a) : a.toLocaleString("ru-RU");
}

function initials(name: string | null, handle: string | null): string {
  // Word-initials like the эталон monograms («Alex Rivera» → AR, «Mara Lin» →
  // ML), stripping a leading '@' so a name-less handle never leaks «@F».
  const s = (name || handle || "?").replace(/^@/, "").trim();
  const parts = s.split(/\s+/).filter(Boolean);
  const out = parts.length >= 2 ? parts[0][0] + parts[1][0] : s.slice(0, 2);
  return out.toUpperCase() || "?";
}

// Identity for the account chrome (head, sidebar login, breadcrumb, drawers).
// Reads the LIVE cached /me (re-renders on a rename via subscribeMe); falls back
// to the tenant name until /me lands.
export function useChromeIdentity(tenantName: string): { name: string; email: string; mono: string } {
  const me = useMe();
  const name = (me?.display_name || "").trim() || tenantName;
  return { name, email: me?.email ?? tenantName, mono: initials(name, null) };
}

// ── chrome marks: account (filled square) · profile avatar (round) ───────────
export function AcctMark({ mono, cls = "" }: { mono: string; cls?: string }) {
  return <span className={`acc-acctmark ${cls}`.trim()}>{mono}</span>;
}
function NetBadge({ network }: { network: string }) {
  return (
    <span className={`acc-net acc-net--${network}`} title={NET_LABEL[network] || network}>
      {NetLogo({ network, s: 12, bold: true }) ?? "•"}
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

// ── small inline glyphs (reconnect link + the ask-hint arrow) ────────────────
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
const IcArrowUpRight = ({ size = 11 }: { size?: number }) => (
  <svg className="v-ic" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M7 17 17 7M8 7h9v9" />
  </svg>
);

// "N days/weeks/months ago", localized to the ACTIVE app locale (pass nav.locale,
// NOT the browser's) — per [[feedback_localize_to_user_locale]]. A malformed ISO
// stamp yields "" instead of throwing.
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

// ── recoverable disconnected profile card (kept for the settings/empty chrome
// that still reference the pre-V3 acc-card treatment) ─────────────────────────
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

// ═══════════════ V3 atoms ═══════════════

// V3 round avatar (photo + monogram fallback + network badge), size via --av.
export function VAvatar({
  p,
  size = 40,
  dim = false,
  noBadge = false,
  cls,
}: {
  p: AccountProfile;
  size?: number;
  dim?: boolean;
  noBadge?: boolean;
  cls?: string;
}) {
  return (
    <span className={`v-av${dim ? " v-av--dim" : ""}${cls ? ` ${cls}` : ""}`} style={{ "--av": `${size}px` } as React.CSSProperties}>
      {p.avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.avatar} alt="" loading="lazy" />
      ) : (
        <span className="v-av-mono">{initials(p.name, p.handle)}</span>
      )}
      {noBadge ? null : (
        <span className={`v-av-net v-av-net--${p.network}`}>
          {NetLogo({ network: p.network, s: Math.max(10, Math.round(size * 0.28)) }) ?? null}
        </span>
      )}
    </span>
  );
}

// Delta chip (▲/▼ + number). Null or zero → nothing (no meaningless «+0»).
function VDelta({ v }: { v: number | null }) {
  if (v == null || v === 0) return null;
  const down = v < 0;
  return (
    <span className={`v-delta v-delta--${down ? "down" : "up"}`}>
      {down ? <IcArrowDown size={11} /> : <IcArrowUp size={11} />}
      <span>{fmtDeltaAbs(Math.abs(v))}</span>
    </span>
  );
}

// Grounded data chip (advisor tone: up / down / accent / ink).
function VChip({ tone, icon, text }: { tone: string; icon?: string; text: string }) {
  return (
    <span className={`v-chip v-chip--${tone}`}>
      {icon ? <DynIcon n={icon} s={12} /> : null}
      <span className="v-chip-t">{text}</span>
    </span>
  );
}

// ═══════════════ V3 hero (advisor briefing) ═══════════════

// A seeded question is handed to the chat; undefined = just open it.
type OpenAdvisor = (seed?: string) => void;

function HeroHead({ t, onOpenAdvisor }: { t: T; onOpenAdvisor?: OpenAdvisor }) {
  return (
    <div className="v3-hero-head">
      <span className="v3-adv-mark">
        <IcAdvisor size={19} />
      </span>
      <div className="v3-hero-htxt">
        <span className="v3-hero-t">{t("acc.adv_title")}</span>
        <span className="v3-hero-scope">{t("acc.adv_scope")}</span>
      </div>
      <button className="v-btn v-btn--sm v3-hero-open" type="button" onClick={() => onOpenAdvisor?.()}>
        <IcAdvisor size={14} />
        <span>{t("acc.adv_open")}</span>
      </button>
    </div>
  );
}

// Ask composer — a real one-line input that routes to the chat, seeding the
// typed question (empty → just opens the chat). NOT an inline conversation.
function AskComposer({ t, onOpenAdvisor }: { t: T; onOpenAdvisor?: OpenAdvisor }) {
  const [q, setQ] = useState("");
  const send = () => onOpenAdvisor?.(q.trim() || undefined);
  return (
    <>
      <div className="v3-ask">
        <input
          className="v3-ask-in"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("acc.adv_ask")}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              send();
            }
          }}
        />
        <button className="v3-ask-send" type="button" aria-label={t("acc.adv_ask")} onClick={send}>
          <IcSend size={16} />
        </button>
      </div>
      <div className="v3-ask-hint">
        <IcArrowUpRight size={11} />
        {t("acc.adv_ask_hint")}
      </div>
    </>
  );
}

// One recommendation (primary action). No deep-link target from the backend, so
// clicking hands the reco title to the chat as the seeded question.
function Reco({ r, onOpenAdvisor }: { r: AdvisorData["recos"][number]; onOpenAdvisor?: OpenAdvisor }) {
  const tone = r.tone === "danger" ? " v3-reco--danger" : r.tone === "accent" ? " v3-reco--accent" : "";
  return (
    <button type="button" className={`v3-reco${tone}`} onClick={() => onOpenAdvisor?.(r.t)}>
      <span className="v3-reco-ic">
        <DynIcon n={r.icon} s={15} />
      </span>
      <span className="v3-reco-txt">
        <span className="v3-reco-t">{r.t}</span>
        <span className="v3-reco-s">{r.s}</span>
      </span>
      <span className="v3-reco-go">
        <IcChevRight size={16} />
      </span>
    </button>
  );
}

// Verdict hero — the advisor returned a portfolio-wide verdict.
function VerdictHero({ adv, t, onOpenAdvisor }: { adv: AdvisorData; t: T; onOpenAdvisor?: OpenAdvisor }) {
  return (
    <section className="v3-hero">
      <HeroHead t={t} onOpenAdvisor={onOpenAdvisor} />
      <h1 className="v3-verdict">{adv.verdict}</h1>
      <p className="v3-detail">{adv.detail}</p>
      <div className="v3-chips">
        {adv.chips.map((c, i) => (
          <VChip key={i} tone={c.tone} icon={c.icon} text={c.text} />
        ))}
      </div>
      <div className="v3-grounded">
        <IcSparkle size={12} />
        <span className="v3-grounded-lab">{t("acc.adv_grounded")}</span> {adv.grounded}
      </div>
      <div className="v3-recos-cap">{t("acc.adv_reco")}</div>
      <div className="v3-recos">
        {adv.recos.map((r, i) => (
          <Reco key={i} r={r} onOpenAdvisor={onOpenAdvisor} />
        ))}
      </div>
      <AskComposer t={t} onOpenAdvisor={onOpenAdvisor} />
    </section>
  );
}

// Thin hero — the advisor returned 204 (not enough data). Honest invitation +
// starters, no fabricated verdict. When every profile is disconnected the
// starters would mislead → a single reconnect CTA instead.
function ThinHero({
  data,
  t,
  nav,
  onOpenAdvisor,
}: {
  data: MeAccountResponse;
  t: T;
  nav: Nav;
  onOpenAdvisor?: OpenAdvisor;
}) {
  const allOff = data.scope.profiles_count === 0 && data.scope.disconnected_count > 0;
  const starters = [t("acc.adv_starter_fix"), t("acc.adv_starter_pace"), t("acc.adv_starter_grow")];
  return (
    <section className="v3-hero v3-hero--thin">
      <HeroHead t={t} onOpenAdvisor={onOpenAdvisor} />
      <h1 className="v3-verdict v3-verdict--thin">{allOff ? t("acc.adv_off_title") : t("acc.adv_thin_title")}</h1>
      <p className="v3-detail">{allOff ? t("acc.adv_off_body") : t("acc.adv_thin_body")}</p>
      {allOff ? (
        <div className="v3-starters" style={{ marginTop: 16 }}>
          <button className="v3-starter" type="button" onClick={() => nav.addProfile()}>
            <IcLink size={12} />
            {t("acc.reconnect")}
          </button>
        </div>
      ) : (
        <>
          <div className="v3-starters-cap">{t("acc.adv_try_ask")}</div>
          <div className="v3-starters">
            {starters.map((q, i) => (
              <button key={i} className="v3-starter" type="button" onClick={() => onOpenAdvisor?.(q)}>
                <IcSparkle size={12} />
                {q}
              </button>
            ))}
          </div>
        </>
      )}
      <AskComposer t={t} onOpenAdvisor={onOpenAdvisor} />
    </section>
  );
}

function AdvisorHero({
  data,
  adv,
  t,
  nav,
  onOpenAdvisor,
}: {
  data: MeAccountResponse;
  adv?: AdvisorData;
  t: T;
  nav: Nav;
  onOpenAdvisor?: OpenAdvisor;
}) {
  if (adv) return <VerdictHero adv={adv} t={t} onOpenAdvisor={onOpenAdvisor} />;
  return <ThinHero data={data} t={t} nav={nav} onOpenAdvisor={onOpenAdvisor} />;
}

// ═══════════════ V3 identity (quiet — the verdict is the star) ═══════════════
function Identity({ data, t, plural }: { data: MeAccountResponse; t: T; plural: Plural }) {
  const id = useChromeIdentity(data.tenant.name);
  const brandsN = data.scope.brands_count;
  const liveN = data.scope.profiles_count;
  const discN = data.scope.disconnected_count;
  // All-disconnected reads its disconnected count, never a fake «0 профилей».
  const shownN = liveN > 0 ? liveN : discN;
  const nets =
    [...new Set(data.brands.flatMap((b) => b.networks))].map((n) => NET_LABEL[n] || n).join(" · ") || "Threads";
  const scale =
    brandsN >= 2
      ? `${shownN} ${plural("profiles", shownN)} · ${brandsN} ${plural("brands", brandsN)} · ${nets}`
      : `${shownN} ${plural("profiles", shownN)} · ${nets}`;
  return (
    <div className="v3-id">
      <span className="v3-id-mono">{id.mono}</span>
      <span className="v3-id-name">{id.name}</span>
      <span className="v-plan">{data.tenant.plan_tier}</span>
      <span className="v3-id-scale">{scale}</span>
    </div>
  );
}

// ═══════════════ V3 evidence (totals + channels) ═══════════════
function EvTotals({ totals, t }: { totals: OverviewTotals; t: T }) {
  const cell = (
    lab: string,
    icon: string,
    val: string,
    sub: string,
    extra: React.ReactNode,
    attn: boolean,
  ) => (
    <div className={`v3-ev-t${attn ? " v3-ev-t--attn" : ""}`}>
      <span className="v3-ev-lab">
        <DynIcon n={icon} s={12} />
        {lab}
      </span>
      <span className="v3-ev-val">
        {val}
        {extra ? <span className="v3-ev-delta">{extra}</span> : null}
      </span>
      <span className="v3-ev-sub">{sub}</span>
    </div>
  );
  const rep = totals.replies_to_answer;
  return (
    <div className="v3-ev-totals">
      {cell(t("acc.followers"), "users", fmtK(totals.followers), t("acc.sub_all"), <VDelta v={totals.followers_delta} />, false)}
      {cell(t("acc.views"), "eye", fmtK(totals.views_7d), t("acc.sub_7d"), null, false)}
      {cell(t("acc.posts"), "nib", String(totals.posts_week), t("acc.sub_week"), null, false)}
      {cell(t("acc.replies"), "bubble", String(rep), t("acc.sub_wait"), null, rep > 0)}
    </div>
  );
}

// Sync-state block, shared by the profile card + the expanded brand row.
function StateBlock({ p, t, nav }: { p: AccountProfile; t: T; nav: Nav }) {
  if (p.sync_status === "importing") {
    const im = p.sync_summary || {};
    const total = im.history_posts ?? 0;
    const posts = im.posts ?? 0;
    const pct = total > 0 ? Math.min(99, Math.round((posts / total) * 100)) : 40;
    return (
      <div className="v3-ev-state v3-ev-state--imp">
        <span className="v3-spin" />
        <b className="v3-ev-pct">{pct}%</b>
        <span className="v3-ev-imptxt">{t("acc.importing")}</span>
        <span className="v3-ev-eta">{t("acc.imp_eta")}</span>
      </div>
    );
  }
  if (p.sync_status === "error") {
    return (
      <div className="v3-ev-state v3-ev-state--err">
        <IcAlert size={13} />
        <span className="v3-ev-imptxt">{t("acc.sync_failed")}</span>
        <button className="v-btn v-btn--sm v-btn--danger" type="button" onClick={(e) => { e.stopPropagation(); nav.retry(); }}>
          <IcUndo size={11} />
          {t("acc.retry")}
        </button>
      </div>
    );
  }
  if (p.disconnected || p.sync_status === "disconnected") {
    return (
      <div className="v3-ev-state v3-ev-state--off">
        <IcUnlink size={13} />
        <span className="v3-ev-imptxt">{t("acc.disc_pill")}</span>
        <button className="v-btn v-btn--sm" type="button" onClick={(e) => { e.stopPropagation(); nav.connectThreads(); }}>
          {t("acc.reconnect")}
        </button>
      </div>
    );
  }
  return (
    <div className="v3-ev-metrics">
      <span>
        <b>{fmtK(p.followers)}</b> {t("acc.followers").toLowerCase()}
      </span>
      <span>
        <b>{fmtK(p.views_7d)}</b> {t("acc.views").toLowerCase()}
      </span>
    </div>
  );
}

// Profile evidence card (single-brand mode, or standalone).
function EvCardProfile({ p, t, nav }: { p: AccountProfile; t: T; nav: Nav }) {
  const disc = p.disconnected || p.sync_status === "disconnected";
  const navigable = p.sync_status === "synced" || p.sync_status === "error";
  const open = () => navigable && nav.openProfile(p.id, "studio");
  const voice =
    !p.has_voice && p.sync_status === "synced" && !disc ? (
      <button className="v-voice v-voice--off" type="button" onClick={(e) => { e.stopPropagation(); nav.openProfile(p.id, "studio"); }}>
        <IcVoice size={12} />
        {t("acc.no_voice")}
      </button>
    ) : null;
  return (
    <div
      className={`v3-ev-card${disc ? " v3-ev-card--off" : ""}`}
      role={navigable ? "button" : undefined}
      tabIndex={navigable ? 0 : undefined}
      style={navigable ? { cursor: "pointer" } : undefined}
      onClick={navigable ? open : undefined}
      onKeyDown={navigable ? (e) => e.key === "Enter" && open() : undefined}
    >
      <div className="v3-ev-head">
        <VAvatar p={p} size={32} dim={disc} />
        <span className="v3-ev-id">
          <span className="v3-ev-nm">{p.handle || p.name}</span>
          <span className="v3-ev-hd">{NET_LABEL[p.network] || p.network}</span>
        </span>
        {voice}
        <IcChevRight size={15} />
      </div>
      <StateBlock p={p} t={t} nav={nav} />
    </div>
  );
}

// Profile row inside an expanded brand card.
function BpRow({ p, t, nav }: { p: AccountProfile; t: T; nav: Nav }) {
  const disc = p.disconnected || p.sync_status === "disconnected";
  const navigable = p.sync_status === "synced" || p.sync_status === "error";
  const go = (e: React.SyntheticEvent) => { e.stopPropagation(); if (navigable) nav.openProfile(p.id, "studio"); };
  return (
    <div
      className={`v3-bp${disc ? " v3-bp--off" : ""}`}
      role={navigable ? "button" : undefined}
      tabIndex={navigable ? 0 : undefined}
      style={navigable ? { cursor: "pointer" } : undefined}
      onClick={navigable ? go : undefined}
      onKeyDown={navigable ? (e) => e.key === "Enter" && go(e) : undefined}
    >
      <VAvatar p={p} size={26} dim={disc} />
      <span className="v3-bp-id">
        <span className="v3-ev-nm">{p.handle || p.name}</span>
        <span className="v3-ev-hd">{NET_LABEL[p.network] || p.network}</span>
      </span>
      <span className="v3-bp-state">
        <StateBlock p={p} t={t} nav={nav} />
      </span>
    </div>
  );
}

// Brand evidence card (2+-brand mode) — expands inline into profile rows.
function EvCardBrand({ b, t, plural, nav }: { b: AccountBrand; t: T; plural: Plural; nav: Nav }) {
  const [expanded, setExpanded] = useState(false);
  const pc = b.profiles.length;
  const errors = b.profiles.filter((p) => p.sync_status === "error").length;
  const importing = b.profiles.filter((p) => p.sync_status === "importing").length;
  const disc = b.profiles.filter((p) => p.disconnected).length;
  const brandMono = initials(b.name, null);
  const stack = b.profiles.slice(0, 3);
  const stat = errors ? (
    <span className="v-sync v-sync--error">
      <span className="v-sync-dot" />
      {errors} {t("acc.error_n")}
    </span>
  ) : disc ? (
    <span className="v-sync v-sync--off">
      <span className="v-sync-dot" />
      {disc} {t("acc.disconnected_n")}
    </span>
  ) : importing ? (
    <span className="v-sync v-sync--imp">
      <span className="v-sync-dot" />
      {importing} {t("acc.importing_n")}
    </span>
  ) : (
    <span className="v-sync">
      <span className="v-sync-dot" />
      {t("acc.synced_all")}
    </span>
  );
  const toggle = () => pc > 0 && setExpanded((x) => !x);
  return (
    <div className={`v3-ev-card v3-ev-card--brand${expanded ? " is-open" : ""}`}>
      <button type="button" className="v3-ev-brandmain" onClick={toggle} aria-expanded={expanded}>
        <div className="v3-ev-head">
          <span className="v3-brandmark">{brandMono}</span>
          <span className="v3-ev-id">
            <span className="v3-ev-nm">{b.name}</span>
            <span className="v3-ev-hd">
              {pc}&nbsp;{plural("profiles", pc)}
            </span>
          </span>
          <IcChevRight size={15} />
        </div>
        <div className="v3-ev-metrics">
          <span>
            <b>{fmtK(b.stats.followers)}</b> {t("acc.followers").toLowerCase()}
          </span>
          <span>
            <b>{fmtK(b.stats.views_7d)}</b> {t("acc.views").toLowerCase()}
          </span>
        </div>
        <div className="v3-ev-brandfoot">
          <span className="v3-stack">
            {stack.map((p) => (
              <VAvatar key={p.id} p={p} size={22} noBadge cls="v3-stackav" />
            ))}
          </span>
          {stat}
        </div>
      </button>
      {pc > 0 ? (
        <button className="v3-bp-toggle" type="button" aria-expanded={expanded} onClick={toggle}>
          {expanded ? t("acc.collapse") : t("acc.expand")}
          <IcChevDown size={14} className={expanded ? "rotate-180" : undefined} />
        </button>
      ) : null}
      {expanded ? (
        <div className="v3-bexpand">
          {b.profiles.map((p) => (
            <BpRow key={p.id} p={p} t={t} nav={nav} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

// Add tile — add brand / add profile / connect-more when everything is off.
function AddTile({ data, t, nav }: { data: MeAccountResponse; t: T; nav: Nav }) {
  const allOff = data.scope.profiles_count === 0 && data.scope.disconnected_count > 0;
  const label = allOff ? t("acc.connect_another") : data.scope.show_brand_level ? t("acc.add_brand_t") : t("acc.add_profile_t");
  return (
    <button className="v3-ev-card v3-ev-add" type="button" onClick={() => nav.addProfile()}>
      <IcPlus size={16} />
      <span>{label}</span>
    </button>
  );
}

function Evidence({ data, t, plural, nav }: { data: MeAccountResponse; t: T; plural: Plural; nav: Nav }) {
  const brandMode = data.scope.show_brand_level;
  return (
    <section className="v3-evidence">
      <header className="v3-ev-header">
        <span className="v3-ev-title">
          {t("acc.stats")} · {brandMode ? t("acc.sec_brands") : t("acc.sec_profiles")}
        </span>
        <span className="v3-ev-note">{t("acc.ev_note")}</span>
      </header>
      <EvTotals totals={data.totals} t={t} />
      <div className="v3-ev-grid">
        {brandMode
          ? data.brands.map((b) => <EvCardBrand key={b.id} b={b} t={t} plural={plural} nav={nav} />)
          : data.brands.flatMap((b) => b.profiles).map((p) => <EvCardProfile key={p.id} p={p} t={t} nav={nav} />)}
        <AddTile data={data} t={t} nav={nav} />
      </div>
    </section>
  );
}

// ═══════════════ shared V3 body (both breakpoints) ═══════════════
// identity → advisor hero (verdict / thin) → evidence (totals + channels). The
// `.v3` root is a width container, so the same body adapts from the desktop
// column down to the phone via container queries — the two chromes just wrap it.
export function V3Body({
  data,
  adv,
  t,
  plural,
  nav,
  onOpenAdvisor,
}: {
  data: MeAccountResponse;
  adv?: AdvisorData;
  t: T;
  plural: Plural;
  nav: Nav;
  onOpenAdvisor?: OpenAdvisor;
}) {
  return (
    <div className="v3">
      <Identity data={data} t={t} plural={plural} />
      <AdvisorHero data={data} adv={adv} t={t} nav={nav} onOpenAdvisor={onOpenAdvisor} />
      <Evidence data={data} t={t} plural={plural} nav={nav} />
    </div>
  );
}

// Which account-level screen a chrome instance sits on (drives the active nav
// row + the breadcrumb). The dashboard, the portfolio advisor chat, and account
// settings share ONE sidebar/topbar set, parameterized by this.
export type AccountPage = "dashboard" | "advisor" | "settings";

// ── sidebar (account level) — decision C: no «Советник» nav item ─────────────
export function Sidebar({ data, t, nav, active = "dashboard" }: { data: MeAccountResponse; t: T; nav: Nav; active?: AccountPage }) {
  const multi = data.scope.brands_count >= 2;
  const [loginOpen, setLoginOpen] = useState(false);
  const id = useChromeIdentity(data.tenant.name);
  const mono = id.mono;
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
                ? document.querySelector(".v3-evidence")?.scrollIntoView({ behavior: "smooth", block: "start" })
                : nav.go("/app/account")
            }
          >
            <IcLayers size={17} />
            <span className="acc-sb-rowtxt">{t("acc.nav_brands")}</span>
            <span className="acc-sb-badge">{data.scope.brands_count}</span>
          </a>
        ) : null}
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
    <button className="acc-swrow" type="button" onClick={() => { onDone(); nav.openProfile(p.id, "studio"); }}>
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
  const liveProfiles = allProfiles.filter((p) => !p.disconnected);
  const stack = liveProfiles.slice(0, 3);
  const multi = data.scope.show_brand_level;
  const selected = useSelectedAccountId();
  const [swOpen, setSwOpen] = useState(false);
  const close = () => setSwOpen(false);

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
// The dashboard's own topbar carries the profile switcher; the sub-screens
// (settings, advisor) use this simpler bar — a multi-segment breadcrumb
// «Аккаунт › [page]» (the «Аккаунт» segment links home, the decision-C «← к
// дашборду») + an optional status pill + the theme toggle.
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

// ── skeleton (loading) — V3 shape ────────────────────────────────────────────
export function AccountSkeleton() {
  const s = (w: string, h: number, mt = 0) => <div className="v-skel" style={{ width: w, height: h, marginTop: mt }} />;
  return (
    <div className="v3">
      <div className="v3-id">
        {s("34px", 34)}
        {s("160px", 15)}
      </div>
      <section className="v3-hero">
        {s("180px", 14)}
        {s("90%", 30, 16)}
        {s("70%", 30, 8)}
        {s("100%", 44, 16)}
        <div className="v3-recos" style={{ marginTop: 16 }}>
          {s("100%", 60)}
          {s("100%", 60)}
          {s("100%", 60)}
        </div>
      </section>
      <section className="v3-evidence">
        {s("160px", 13)}
        {s("100%", 70, 12)}
      </section>
    </div>
  );
}

// ── full dashboard composition (desktop chrome + shared V3 body) ─────────────
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
  // Rich advisor verdict (GET /api/me/account/advisor). Omit / null → the honest
  // thin-data hero renders (no fabricated verdict).
  adv?: AdvisorData;
  t: T;
  plural: Plural;
  dark?: boolean;
  onOpenAdvisor?: OpenAdvisor;
  // In-place refetch for the sync-error «Повторить» (C9). Omitted (gallery/demo)
  // → the nav default (full page reload) stays.
  onRetry?: () => void;
}) {
  const baseNav = useAccountNav();
  const [pickOpen, setPickOpen] = useState(false);
  // Every add-affordance (add tile, switcher «Подключить профиль») opens the
  // network picker; only its Threads row (nav.connectThreads) starts the OAuth.
  // Per-profile Reconnect buttons bypass the picker — their network is known.
  const nav = { ...baseNav, addProfile: () => setPickOpen(true), ...(onRetry ? { retry: onRetry } : {}) };
  return (
    <div className="acc-shell">
      <Sidebar data={data} t={t} nav={nav} />
      <div className="acc-mainwrap" style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 18 }}>
        <Topbar data={data} t={t} plural={plural} dark={dark} nav={nav} />
        <V3Body data={data} adv={adv} t={t} plural={plural} nav={nav} onOpenAdvisor={onOpenAdvisor} />
      </div>
      <ConnectNetworkDialog open={pickOpen} onClose={() => setPickOpen(false)} t={t} nav={baseNav} />
    </div>
  );
}
