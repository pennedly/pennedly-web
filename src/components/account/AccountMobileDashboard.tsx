"use client";

// Account dashboard — MOBILE (phone, below the `md` breakpoint). A 1:1 React
// port of the CD эталон (design-export/PennedlyDesign/account-mobile.js), the
// phone sibling of AccountDashboard.tsx (desktop). Same data contract
// (MeAccountResponse) + the same nav actions (useAccountNav), so the two
// breakpoints stay in lock-step; only the layout + chrome differ.
//
// Structure (эталон order): a mobile top bar (hamburger · Дашборд · profiles
// pill · theme) → header band → 2×2 portfolio totals → tasks strip → advisor
// hero → adaptive cards (profiles or brands). Plus three overlays, each opened
// via useState + closed by tapping the shared .m-scrim (mirroring the desktop
// menu pattern):
//   • a bottom-docked flat profile switcher (.ma-swbtn → swSheet)
//   • a left nav drawer (hamburger → navDrawer, login control pinned to its foot)
//   • a login sheet (drawer foot → current account · Настройки · Выйти)
//
// Copy comes in via the same t()/plural() translators as the desktop, so this
// serves both the gallery (demo strings) and the live screen (i18n). The .ma-*
// classes are themed by account-mobile.css (scoped under .acc-mob); the .m-*
// shell primitives by account-mobile-shell.css.

import { useEffect, useState } from "react";

import {
  BrandMark as BrandLogo,
  IcAdvisor,
  IcArrowDown,
  IcArrowRight,
  IcArrowUp,
  IcChevDown,
  IcChevRight,
  IcCheck,
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
  IcThread,
  IcUndo,
  IcX,
} from "@/components/icons";
import { useSelectedAccountId } from "@/lib/account";
import type {
  AccountBrand,
  AccountProfile,
  AccountTasks,
  AdvisorData,
  MeAccountResponse,
  OverviewTotals,
} from "@/lib/types";

import { DynIcon, useAccountNav } from "./AccountDashboard";
import type { AccountPage, Nav, Plural, T } from "./AccountDashboard";

// ── shared helpers (mirror AccountDashboard.tsx) ─────────────────────────────
const NET_LABEL: Record<string, string> = { threads: "Threads", linkedin: "LinkedIn" };
// LinkedIn keeps its text glyph; Threads renders the app's IcThread (mirrors the
// desktop NetBadge / brand-net handling).
const NET_GLYPH: Record<string, string> = { linkedin: "in" };

function nfmt(n: number): string {
  if (n >= 10000) return (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1).replace(".", ",") + "k";
  return n.toLocaleString("ru-RU");
}

function initials(name: string | null, handle: string | null): string {
  const s = (name || handle || "?").trim();
  return s.slice(0, 2).toUpperCase();
}

function Delta({ v }: { v: number | null }) {
  if (v == null) return <span className="ma-delta ma-delta--flat">—</span>;
  const down = v < 0;
  return (
    <span className={`ma-delta ma-delta--${down ? "down" : "up"}`}>
      {down ? <IcArrowDown size={11} /> : <IcArrowUp size={11} />}
      {nfmt(Math.abs(v))}
    </span>
  );
}

// ── marks: account (filled square) · brand (outlined square) · profile (round) ──
function AcctMark({ mono, cls = "" }: { mono: string; cls?: string }) {
  return <span className={`ma-acctmark ${cls}`.trim()}>{mono}</span>;
}
function BrandMark({ mono, cls = "" }: { mono: string; cls?: string }) {
  return <span className={`ma-brandmark ${cls}`.trim()}>{mono}</span>;
}
function NetBadge({ network }: { network: string }) {
  return (
    <span className={`ma-net ma-net--${network}`} title={NET_LABEL[network] || network}>
      {network === "threads" ? <IcThread size={9} /> : NET_GLYPH[network] || "•"}
    </span>
  );
}
function Avatar({ p, cls = "ma-av" }: { p: AccountProfile; cls?: string }) {
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

// ── portfolio totals (2×2) ───────────────────────────────────────────────────
function Total({
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
    <div className={`ma-total${attention ? " ma-total--attention" : ""}`}>
      <div className="ma-total-lab">
        <DynIcon n={icon} s={12} />
        <span className="ma-total-labtxt">{lab}</span>
      </div>
      <div className="ma-total-row">
        <span className="ma-total-num">{num}</span>
        {extra}
      </div>
      <div className="ma-total-sub">{sub}</div>
    </div>
  );
}

function TotalsGrid({ totals, t }: { totals: OverviewTotals; t: T }) {
  return (
    <div className="ma-totals">
      <Total lab={t("acc.followers")} icon="users" num={nfmt(totals.followers)} sub={t("acc.sub_all")} extra={<Delta v={totals.followers_delta} />} />
      <Total lab={t("acc.views")} icon="eye" num={nfmt(totals.views_7d)} sub={t("acc.sub_7d")} />
      <Total lab={t("acc.posts")} icon="nib" num={String(totals.posts_week)} sub={t("acc.sub_week")} />
      <Total lab={t("acc.replies")} icon="bubble" num={String(totals.replies_to_answer)} sub={t("acc.sub_wait")} attention />
    </div>
  );
}

// ── header band (identity + scale line) ──────────────────────────────────────
function Header({ data, t, plural }: { data: MeAccountResponse; t: T; plural: Plural }) {
  const brandsN = data.scope.brands_count;
  const profilesN = data.scope.profiles_count;
  const nets = [...new Set(data.brands.flatMap((b) => b.networks))].map((n) => NET_LABEL[n] || n).join(" · ") || "Threads";
  const scale =
    brandsN >= 2
      ? `${profilesN} ${plural("profiles", profilesN)} · ${brandsN} ${plural("brands", brandsN)} · ${nets}`
      : `${profilesN} ${plural("profiles", profilesN)} · ${nets}`;
  return (
    <div className="ma-head">
      <AcctMark mono={initials(data.tenant.name, null)} />
      <div className="ma-head-txt">
        <div className="ma-head-name">{data.tenant.name}</div>
        <div className="ma-head-meta">
          <span className="ma-head-plan">{data.tenant.plan_tier}</span>
          <span className="ma-head-scale">{scale}</span>
        </div>
      </div>
    </div>
  );
}

// ── tasks strip ("Требует тебя") ─────────────────────────────────────────────
const TASK_IC: Record<string, string> = { sync: "alert", reply: "reply", draft: "nib", audit: "audit" };

function TasksStrip({ tasks, t, plural, nav }: { tasks: AccountTasks; t: T; plural: Plural; nav: Nav }) {
  const chips: { type: string; n: number; label: string }[] = [];
  if (tasks.sync_errors) chips.push({ type: "sync", n: tasks.sync_errors, label: t("acc.task_sync") });
  if (tasks.replies_attention) chips.push({ type: "reply", n: tasks.replies_attention, label: t("acc.task_replies") });
  if (tasks.pending_drafts) chips.push({ type: "draft", n: tasks.pending_drafts, label: plural("drafts", tasks.pending_drafts) });
  if (tasks.pending_audits) chips.push({ type: "audit", n: tasks.pending_audits, label: plural("audits", tasks.pending_audits) });
  if (!chips.length) return null;
  return (
    <section className="ma-tasks">
      <div className="ma-tasks-head">
        <span className="ma-tasks-lab">
          <DynIcon n="alert" s={15} />
          {t("acc.tasks_title")}
        </span>
        <a className="ma-tasks-all" style={{ cursor: "pointer" }} onClick={() => nav.go("/app/overview")}>
          {t("acc.tasks_all")}
          <IcArrowRight size={13} />
        </a>
      </div>
      <div className="ma-tasks-chips">
        {chips.map((c) => (
          <span key={c.type} className={`ma-taskchip${c.type === "sync" ? " ma-taskchip--sync" : ""}`}>
            <DynIcon n={TASK_IC[c.type]} s={12} />
            <b>{c.n}</b> {c.label}
          </span>
        ))}
      </div>
    </section>
  );
}

// ── advisor hero (verdict/detail/chips/grounded/recos + composer) ────────────
function Advisor({ adv, t, onOpen }: { adv: AdvisorData; t: T; onOpen?: () => void }) {
  return (
    <section className="ma-adv">
      <div className="ma-adv-rail">
        <span className="ma-adv-mark">
          <IcAdvisor size={18} />
        </span>
        <div className="ma-adv-headtext">
          <div className="ma-adv-title">{t("acc.adv_title")}</div>
          <div className="ma-adv-scope">{t("acc.adv_scope")}</div>
        </div>
      </div>
      <div className="ma-adv-body">
        <div className="ma-adv-verdict">{adv.verdict}</div>
        <div className="ma-adv-detail">{adv.detail}</div>
        <div className="ma-adv-chips">
          {adv.chips.map((c, i) => (
            <span key={i} className={`ma-chip ma-chip--${c.tone}`}>
              <DynIcon n={c.icon} s={13} />
              <span className="t">{c.text}</span>
            </span>
          ))}
        </div>
        <div className="ma-adv-grounded">
          <span className="lab">
            <IcSparkle size={12} />
            {t("acc.adv_grounded")}
          </span>
          <span className="src">{adv.grounded}</span>
        </div>
        <div className="ma-adv-recos">
          {adv.recos.map((r, i) => (
            <a key={i} className={`ma-rec${r.tone === "danger" ? " ma-rec--danger" : r.tone === "accent" ? " ma-rec--accent" : ""}`}>
              <span className="ma-rec-ic">
                <DynIcon n={r.icon} s={15} />
              </span>
              <span className="ma-rec-body">
                <span className="ma-rec-t">{r.t}</span>
                <span className="ma-rec-s">{r.s}</span>
              </span>
              <span className="ma-rec-go">
                <IcChevRight size={16} />
              </span>
            </a>
          ))}
        </div>
        <div className="ma-adv-composer" onClick={onOpen} style={onOpen ? { cursor: "pointer" } : undefined}>
          <span className="ph">{t("acc.adv_ask")}</span>
          <button className="ma-adv-send" type="button" onClick={onOpen}>
            <IcSend size={16} />
          </button>
        </div>
        <button className="btn btn--secondary ma-adv-open" type="button" onClick={onOpen}>
          <IcAdvisor size={15} />
          {t("acc.adv_open")}
        </button>
      </div>
    </section>
  );
}

// Honest invite shell (no fabricated numbers) when no rich advisor data exists —
// mirrors the desktop AdvisorInvite.
function AdvisorInvite({ t, onOpen }: { t: T; onOpen?: () => void }) {
  return (
    <section className="ma-adv">
      <div className="ma-adv-rail">
        <span className="ma-adv-mark">
          <IcAdvisor size={18} />
        </span>
        <div className="ma-adv-headtext">
          <div className="ma-adv-title">{t("acc.adv_title")}</div>
          <div className="ma-adv-scope">{t("acc.adv_scope")}</div>
        </div>
      </div>
      <div className="ma-adv-body">
        <div className="ma-adv-detail">{t("acc.adv_invite")}</div>
        <div className="ma-adv-composer" onClick={onOpen} style={{ cursor: "pointer" }}>
          <span className="ph">{t("acc.adv_ask")}</span>
          <button className="ma-adv-send" type="button" onClick={onOpen}>
            <IcSend size={16} />
          </button>
        </div>
        <button className="btn btn--secondary ma-adv-open" type="button" onClick={onOpen}>
          <IcAdvisor size={15} />
          {t("acc.adv_open")}
        </button>
      </div>
    </section>
  );
}

// ── metrics (shared by profile + brand aggregate; vertical table) ────────────
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
    <div className={`ma-m${attention ? " ma-m--attention" : ""}`}>
      <span className="ma-m-lab">
        <DynIcon n={icon} s={11} />
        <span className="ma-m-labtxt">{lab}</span>
      </span>
      <span className="ma-m-row">
        <span className="ma-m-val">
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
    <div className="ma-metrics">
      <Metric lab={t("acc.followers")} icon="users" val={followers} extra={<Delta v={d.followers_delta} />} />
      <Metric lab={t("acc.views")} icon="eye" val={muted ? "—" : nfmt(d.views_7d)} />
      <Metric lab={t("acc.posts")} icon="nib" val={muted ? "—" : String(d.posts_week)} unit={t("acc.posts_unit")} />
      <Metric lab={t("acc.replies")} icon="bubble" val={muted ? "—" : String(d.replies_to_answer)} attention={!muted && d.replies_to_answer > 0} />
    </div>
  );
}

// ── profile card (single-brand mode) ─────────────────────────────────────────
function ProfileHead({ p }: { p: AccountProfile }) {
  return (
    <div className="ma-card-head">
      <Avatar p={p} />
      <div className="ma-card-id">
        <div className="ma-card-name">{p.handle || p.name}</div>
        <div className="ma-card-sub">{NET_LABEL[p.network] || p.network}</div>
      </div>
      <span className="ma-go">
        <IcChevRight size={15} />
      </span>
    </div>
  );
}

function ProfileCard({ p, t, nav }: { p: AccountProfile; t: T; nav: Nav }) {
  const open = () => nav.openProfile(p.id, "studio");
  if (p.sync_status === "importing") {
    const im = p.sync_summary || {};
    const posts = im.posts ?? 0;
    const comments = im.new_comments ?? 0;
    const total = im.history_posts ?? 0;
    const pct = total > 0 ? Math.min(99, Math.round((posts / total) * 100)) : 40;
    return (
      <div className="ma-card ma-card--importing">
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
        </div>
      </div>
    );
  }
  if (p.sync_status === "error") {
    return (
      <div className="ma-card" style={{ cursor: "pointer" }} role="button" tabIndex={0} onClick={open} onKeyDown={(e) => e.key === "Enter" && open()}>
        <ProfileHead p={p} />
        <Metrics4 t={t} d={p} muted />
        <div className="ma-cardfoot">
          <span className="ma-sync ma-sync--error">
            <span className="ma-sync-dot" />
            {t("acc.sync_failed")}
          </span>
          <button className="ma-retry" type="button" onClick={(e) => { e.stopPropagation(); nav.retry(); }}>
            <IcUndo size={12} />
            {t("acc.retry")}
          </button>
        </div>
      </div>
    );
  }
  const attn = p.replies_to_answer > 0;
  return (
    <div className="ma-card" style={{ cursor: "pointer" }} role="button" tabIndex={0} onClick={open} onKeyDown={(e) => e.key === "Enter" && open()}>
      <ProfileHead p={p} />
      <Metrics4 t={t} d={p} />
      <div className="ma-cardfoot">
        <span className="ma-sync">
          <span className="ma-sync-dot" />
          {t("acc.synced")}
        </span>
        <div className="ma-quick">
          <a className="ma-quicklink" style={{ cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); nav.openProfile(p.id, "stats"); }}>
            <IcNib size={11} />
            {t("acc.stats")}
          </a>
          <a
            className={`ma-quicklink${attn ? " ma-quicklink--attention" : ""}`}
            style={{ cursor: "pointer" }}
            onClick={(e) => { e.stopPropagation(); nav.openProfile(p.id, "replies"); }}
          >
            <IcReply size={11} />
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
    <span className="ma-stack">
      {shown.map((p) => (
        <Avatar key={p.id} p={p} />
      ))}
      {more > 0 ? <span className="ma-stack-more">+{more}</span> : null}
    </span>
  );
}

function BrandProfileRow({ p, t, nav }: { p: AccountProfile; t: T; nav: Nav }) {
  let right: React.ReactNode;
  if (p.sync_status === "importing") {
    right = (
      <span className="ma-bp-state ma-bp-state--sync">
        <span className="ib-spinner" style={{ width: 13, height: 13 }} />
        {t("acc.importing_n")}
      </span>
    );
  } else if (p.sync_status === "error") {
    right = (
      <button className="ma-bp-retry" type="button" onClick={(e) => { e.stopPropagation(); nav.retry(); }}>
        <IcUndo size={12} />
        {t("acc.retry")}
      </button>
    );
  } else {
    right = (
      <span className="ma-bp-mini">
        <span className="ma-bp-stat">
          <span className="ma-bp-statnum">{nfmt(p.followers ?? 0)}</span>
          <span className="ma-bp-statlab">{t("acc.followers")}</span>
        </span>
      </span>
    );
  }
  return (
    <a className="ma-bp" style={{ cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); nav.openProfile(p.id, "studio"); }}>
      <Avatar p={p} cls="ma-bp-av" />
      <span className="ma-bp-id">
        <span className="ma-bp-hd">{p.handle || p.name}</span>
        <span className="ma-bp-sub">{NET_LABEL[p.network] || p.network}</span>
      </span>
      {right}
    </a>
  );
}

function BrandCard({ b, t, plural, nav }: { b: AccountBrand; t: T; plural: Plural; nav: Nav }) {
  const [expanded, setExpanded] = useState(false);
  const pc = b.profiles.length;
  const errors = b.profiles.filter((p) => p.sync_status === "error").length;
  const importing = b.profiles.filter((p) => p.sync_status === "importing").length;
  const agg = {
    followers: b.stats.followers,
    followers_delta: b.stats.followers_delta,
    views_7d: b.stats.views_7d,
    posts_week: b.stats.posts_week,
    replies_to_answer: b.stats.replies_to_answer,
  };
  const toggle = () => pc > 0 && setExpanded((x) => !x);
  const sub = `${pc} ${plural("profiles", pc)}`;
  return (
    <div className="ma-card ma-card--brand">
      <div className="ma-card-head" style={pc > 0 ? { cursor: "pointer" } : undefined} role={pc > 0 ? "button" : undefined} tabIndex={pc > 0 ? 0 : undefined} onClick={toggle} onKeyDown={(e) => e.key === "Enter" && toggle()}>
        <span style={{ position: "relative", flex: "0 0 auto" }}>
          <BrandMark mono={initials(b.name, null)} />
          <span className="ma-brand-net">
            {b.networks.map((nid) => (
              <span key={nid} className="ma-brand-netbadge">
                {nid === "threads" ? <IcThread size={9} /> : NET_GLYPH[nid] || "•"}
              </span>
            ))}
          </span>
        </span>
        <div className="ma-card-id">
          <div className="ma-card-name">{b.name}</div>
          <div className="ma-card-sub">{sub}</div>
        </div>
        <span className="ma-go">
          <IcChevRight size={15} />
        </span>
      </div>
      <BrandStack b={b} />
      <Metrics4 t={t} d={agg} />
      <div className="ma-cardfoot">
        <span className="ma-brand-statline">
          <span className={`ma-brand-statdot${errors ? " ma-brand-statdot--warn" : importing ? " ma-brand-statdot--imp" : ""}`} />
          {errors ? `${errors} ${t("acc.error_n")}` : importing ? `${importing} ${t("acc.importing_n")}` : t("acc.synced_all")}
        </span>
        {pc > 0 ? (
          <button className="ma-brand-expand" type="button" aria-expanded={expanded} onClick={(e) => { e.stopPropagation(); toggle(); }}>
            {t("acc.expand")}
            <IcChevDown size={13} className={expanded ? "rotate-180" : undefined} />
          </button>
        ) : null}
      </div>
      {expanded ? (
        <div className="ma-brand-profiles">
          {b.profiles.map((p) => (
            <BrandProfileRow key={p.id} p={p} t={t} nav={nav} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

// ── add-brand CTA ─────────────────────────────────────────────────────────────
function AddBrand({ t, nav }: { t: T; nav: Nav }) {
  return (
    <a className="ma-add" style={{ cursor: "pointer" }} onClick={nav.addProfile}>
      <span className="ma-add-ico">
        <IcPlus size={20} />
      </span>
      <span className="ma-add-body">
        <span className="ma-add-t">{t("acc.add_brand_t")}</span>
        <span className="ma-add-s">{t("acc.add_brand_s")}</span>
      </span>
      <span className="ma-add-go">
        <IcChevRight size={16} />
      </span>
    </a>
  );
}

// ── cards section (adaptive on scope.show_brand_level) ───────────────────────
function CardsSection({ data, t, plural, nav }: { data: MeAccountResponse; t: T; plural: Plural; nav: Nav }) {
  const multi = data.scope.show_brand_level;
  const count = multi ? data.brands.length : data.scope.profiles_count;
  return (
    <>
      <div className="ma-sec">
        <span className="ma-sec-t">{multi ? t("acc.sec_brands") : t("acc.sec_profiles")}</span>
        <span className="ma-sec-n">{count}</span>
        <span className="ma-sec-note">{multi ? t("acc.note_brand") : t("acc.note_profile")}</span>
      </div>
      <div className="ma-grid">
        {multi
          ? data.brands.map((b) => <BrandCard key={b.id} b={b} t={t} plural={plural} nav={nav} />)
          : data.brands.flatMap((b) => b.profiles).map((p) => <ProfileCard key={p.id} p={p} t={t} nav={nav} />)}
        <AddBrand t={t} nav={nav} />
      </div>
    </>
  );
}

// ── flat profile switcher: bottom-docked button + sheet ──────────────────────
function SwitcherButton({ data, t, plural, onOpen }: { data: MeAccountResponse; t: T; plural: Plural; onOpen: () => void }) {
  const allProfiles = data.brands.flatMap((b) => b.profiles);
  const stack = allProfiles.slice(0, 3);
  return (
    <button className="ma-swbtn" type="button" onClick={onOpen}>
      <span className="ma-swbtn-stack">
        {stack.map((p) => (
          <Avatar key={p.id} p={p} />
        ))}
      </span>
      <span className="ma-swbtn-who">
        <span className="ma-swbtn-t">{t("acc.sw_all")}</span>
        <span className="ma-swbtn-s">
          {allProfiles.length} {plural("profiles", allProfiles.length)}
        </span>
      </span>
      <span className="ma-swbtn-chev">
        <IcChevDown size={16} className="rotate-180" />
      </span>
    </button>
  );
}

function SwitcherRow({ p, active, nav, onDone }: { p: AccountProfile; active: boolean; nav: Nav; onDone: () => void }) {
  const dotCls =
    p.sync_status === "error" ? " ma-sw-stat--error" : p.sync_status === "importing" ? " ma-sw-stat--importing" : "";
  return (
    <button className="ma-sw-row" type="button" onClick={() => { onDone(); nav.openProfile(p.id, "studio"); }}>
      <Avatar p={p} cls="ma-sw-av" />
      <span className="ma-sw-who">
        <span className="ma-sw-nm">{p.handle || p.name}</span>
        <span className="ma-sw-hd">{NET_LABEL[p.network] || p.network}</span>
      </span>
      {active ? (
        <span className="ma-sw-check">
          <IcCheck size={17} />
        </span>
      ) : (
        <span className={`ma-sw-stat${dotCls}`} />
      )}
    </button>
  );
}

function SwitcherSheet({ data, t, nav, onClose }: { data: MeAccountResponse; t: T; nav: Nav; onClose: () => void }) {
  const multi = data.scope.show_brand_level;
  const selected = useSelectedAccountId();
  return (
    <>
      <button className="m-scrim" type="button" aria-label="" onClick={onClose} />
      <div className="m-sheet" role="dialog" aria-modal="true">
        <div className="m-sheet-body">
          <div className="m-sheet-grip" />
          <div className="m-sheet-head">
            <div className="m-sheet-title">{t("acc.sw_all")}</div>
            <button className="m-sheet-close" type="button" onClick={onClose}>
              <IcX size={16} />
            </button>
          </div>
          {multi ? (
            data.brands.map((b) => (
              <div key={b.id}>
                <div className="ma-sw-brandcap">
                  <BrandMark mono={initials(b.name, null)} />
                  <span className="t">{b.name}</span>
                </div>
                {b.profiles.map((p) => (
                  <SwitcherRow key={p.id} p={p} active={p.id === selected} nav={nav} onDone={onClose} />
                ))}
              </div>
            ))
          ) : (
            <>
              <div className="ma-sw-cap">{t("acc.sw_jump")}</div>
              {data.brands.flatMap((b) => b.profiles).map((p) => (
                <SwitcherRow key={p.id} p={p} active={p.id === selected} nav={nav} onDone={onClose} />
              ))}
            </>
          )}
          <button className="ma-sw-row" type="button" onClick={() => { onClose(); nav.addProfile(); }}>
            <span className="ma-sw-av ma-sw-av--add">
              <IcPlus size={16} />
            </span>
            <span className="ma-sw-who">
              <span className="ma-sw-nm">{t("acc.sw_connect")}</span>
            </span>
          </button>
        </div>
      </div>
    </>
  );
}

// ── nav drawer (hamburger) + login foot ──────────────────────────────────────
// Drawer nav rows carry a design-token icon name; map it to the app icon set.
const NAV_ICONS: Record<string, (p: { size?: number }) => React.JSX.Element> = {
  grid: IcOverview,
  layers: IcLayers,
  advisor: IcAdvisor,
  settings: IcSettings,
  plus: IcPlus,
};

function NavRow({ icon, label, active, badge, extraCls, onClick }: { icon: string; label: string; active?: boolean; badge?: number; extraCls?: string; onClick?: () => void }) {
  const NavIc = NAV_ICONS[icon] ?? IcOverview;
  return (
    <a className={`m-navrow${active ? " m-navrow--active" : ""}${extraCls ? ` ${extraCls}` : ""}`} style={{ cursor: "pointer" }} aria-current={active ? "page" : undefined} onClick={onClick}>
      <span className="m-navrow-ic">
        <NavIc size={20} />
      </span>
      <span className="m-navrow-lbl">{label}</span>
      {badge ? <span className="m-navrow-badge">{badge}</span> : null}
    </a>
  );
}

function NavDrawer({ data, t, nav, onClose, onOpenLogin, active = "dashboard" }: { data: MeAccountResponse; t: T; nav: Nav; onClose: () => void; onOpenLogin: () => void; active?: AccountPage }) {
  const multi = data.scope.brands_count >= 2;
  const go = (route: string) => { onClose(); nav.go(route); };
  return (
    <>
      <button className="m-scrim" type="button" aria-label="" onClick={onClose} />
      <aside className="m-drawer" role="dialog" aria-label="Account menu">
        <div className="m-drawer-head">
          <div className="m-drawer-brand">
            <span className="m-brand-mark">
              <BrandLogo size={28} radius={8} />
            </span>
            <div className="db-id">
              <div className="bn">Pennedly</div>
              <div className="bs">{t("acc.account_word")}</div>
            </div>
          </div>
          <button className="m-drawer-close" type="button" onClick={onClose}>
            <IcX size={16} />
          </button>
        </div>
        <div className="m-drawer-scroll">
          <div className="m-navgroup">
            <div className="m-navcap">{t("acc.account_word")}</div>
            <NavRow
              icon="grid"
              label={t("acc.nav_dashboard")}
              active={active === "dashboard"}
              onClick={active === "dashboard" ? onClose : () => go("/app/account")}
            />
            {multi ? (
              <NavRow
                icon="layers"
                label={t("acc.nav_brands")}
                badge={data.scope.brands_count}
                onClick={active === "dashboard" ? onClose : () => go("/app/account")}
              />
            ) : null}
            <NavRow icon="advisor" label={t("acc.nav_advisor")} active={active === "advisor"} onClick={() => go("/app/account/advisor")} />
            <NavRow icon="settings" label={t("acc.nav_settings")} active={active === "settings"} onClick={() => go("/app/account/settings")} />
          </div>
          <div className="m-navgroup">
            <NavRow icon="plus" label={t("acc.add_brand_t")} extraCls="ma-navrow-add" onClick={() => { onClose(); nav.addProfile(); }} />
          </div>
        </div>
        <div className="m-drawer-foot">
          <button className="ma-loginctl" type="button" onClick={onOpenLogin}>
            <AcctMark mono={initials(data.tenant.name, null)} />
            <span className="ma-loginctl-who">
              <span className="ma-loginctl-email">{data.tenant.name}</span>
              <span className="ma-loginctl-plan">{data.tenant.plan_tier}</span>
            </span>
            <span className="ma-loginctl-chev">
              <IcChevDown size={16} className="rotate-180" />
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}

// ── login sheet (tenant — opened from the drawer foot) ───────────────────────
// The эталон shows a demo multi-login list; reality has ONE account, so this
// maps to the desktop login menu: current-account header + Настройки + Выйти.
function LoginSheet({ data, t, nav, onClose }: { data: MeAccountResponse; t: T; nav: Nav; onClose: () => void }) {
  const done = (fn: () => void) => { onClose(); fn(); };
  return (
    <>
      <button className="m-scrim" type="button" aria-label="" onClick={onClose} />
      <div className="m-sheet" role="dialog" aria-modal="true">
        <div className="m-sheet-body">
          <div className="m-sheet-grip" />
          <div className="ma-login-head">
            <div className="ma-login-head-id">
              <div className="ma-login-email">{data.tenant.name}</div>
              <span className="ma-login-plan">{data.tenant.plan_tier}</span>
            </div>
            <button className="m-sheet-close" type="button" onClick={onClose}>
              <IcX size={16} />
            </button>
          </div>
          <div className="ma-sw-cap">{t("acc.account_word")}</div>
          <button className="ma-login-row" type="button">
            <AcctMark mono={initials(data.tenant.name, null)} />
            <span className="ma-login-who">
              <span className="ma-login-nm">{data.tenant.name}</span>
              <span className="ma-login-hd">{data.tenant.plan_tier}</span>
            </span>
            <span className="ma-login-check">
              <IcCheck size={17} />
            </span>
          </button>
          <div className="m-sheet-sep" />
          <button className="ma-login-row ma-login-row--min" type="button" onClick={() => done(() => nav.go("/app/account/settings"))}>
            <span className="ma-login-mini">
              <IcSettings size={16} />
            </span>
            {t("acc.nav_settings")}
          </button>
          <button className="ma-login-row ma-login-row--min" type="button" onClick={() => done(nav.logout)}>
            <span className="ma-login-mini">
              <IcLogout size={16} />
            </span>
            {t("settings.logout")}
          </button>
        </div>
      </div>
    </>
  );
}

// ── mobile top bar (hamburger · title · [profiles pill] · theme) ─────────────
// The dashboard shows the profiles-count pill; the sub-screens (settings,
// advisor) pass their own `title` and drop the pill.
function Topbar({
  data,
  t,
  plural,
  dark,
  onMenu,
  title,
  showPill = true,
}: {
  data: MeAccountResponse;
  t: T;
  plural: Plural;
  dark?: boolean;
  onMenu: () => void;
  title?: string;
  showPill?: boolean;
}) {
  const nav = useAccountNav();
  const [themeDark, setThemeDark] = useState(!!dark);
  useEffect(() => {
    if (dark === undefined && typeof document !== "undefined") {
      setThemeDark(document.documentElement.classList.contains("dark"));
    }
  }, [dark]);
  const isDark = dark ?? themeDark;
  const pill = `${data.scope.profiles_count} ${plural("profiles", data.scope.profiles_count)}`;
  return (
    <div className="ma-top">
      <button className="ma-top-menu" type="button" aria-label={t("acc.nav_dashboard")} onClick={onMenu}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
      <h1 className="ma-top-title">{title ?? t("acc.nav_dashboard")}</h1>
      {showPill ? (
        <span className="ma-top-pill">
          <IcOverview size={12} />
          {pill}
        </span>
      ) : null}
      <div className="ma-top-spacer" />
      <button className="ma-top-ic" type="button" aria-label="theme" onClick={() => { nav.toggleTheme(); setThemeDark((d) => !d); }}>
        {isDark ? <IcSun size={16} /> : <IcMoon size={16} />}
      </button>
    </div>
  );
}

// ── shared mobile shell for the sub-screens (settings / advisor) ─────────────
// The account mobile chrome without the dashboard body: top bar (title +
// hamburger + theme, no pill) + the account nav drawer (active row) + the login
// sheet from its foot. `dock` is an optional fixed element (the advisor's docked
// composer). Content goes in `children`; `bare` skips the .ma padding wrapper
// (the chat manages its own full-height layout).
export function AccountMobileShell({
  data,
  t,
  plural,
  title,
  active,
  dark,
  children,
  dock,
  bare,
}: {
  data: MeAccountResponse;
  t: T;
  plural: Plural;
  title: string;
  active: AccountPage;
  dark?: boolean;
  children: React.ReactNode;
  dock?: React.ReactNode;
  bare?: boolean;
}) {
  const nav = useAccountNav();
  const [overlay, setOverlay] = useState<null | "drawer" | "login">(null);
  const close = () => setOverlay(null);
  return (
    <div className="acc-mob">
      <Topbar data={data} t={t} plural={plural} dark={dark} title={title} showPill={false} onMenu={() => setOverlay("drawer")} />
      {bare ? children : <div className="ma">{children}</div>}
      {dock}
      {overlay === "drawer" ? (
        <NavDrawer data={data} t={t} nav={nav} active={active} onClose={close} onOpenLogin={() => setOverlay("login")} />
      ) : null}
      {overlay === "login" ? <LoginSheet data={data} t={t} nav={nav} onClose={close} /> : null}
    </div>
  );
}

// ── skeleton (loading) ───────────────────────────────────────────────────────
export function AccountMobileSkeleton() {
  const line = (w: string, h: number, mt = 0, r = 6) => (
    <div className="skel-line" style={{ width: w, height: h, marginTop: mt, borderRadius: r }} />
  );
  const card = (
    <div className="ma-card">
      <div className="ma-card-head">
        <span className="ma-av" />
        <div className="ma-card-id">
          {line("96px", 13)}
          {line("60px", 11, 6)}
        </div>
      </div>
      <div className="ma-metrics">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skel-line" style={{ height: 16, margin: "9px 0" }} />
        ))}
      </div>
    </div>
  );
  return (
    <div className="acc-mob">
      <div className="ma">
        <div className="ma-head">
          <span className="ma-acctmark" style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }} />
          <div style={{ flex: "1 1 auto", minWidth: 0 }}>
            {line("130px", 16)}
            {line("180px", 11, 8)}
          </div>
        </div>
        <div className="ma-totals">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skel-line" style={{ height: 74, borderRadius: 14 }} />
          ))}
        </div>
        {card}
        {card}
        <div style={{ height: 78 }} />
      </div>
    </div>
  );
}

// ── full mobile dashboard composition ────────────────────────────────────────
export function AccountMobileDashboard({
  data,
  adv,
  t,
  plural,
  dark,
  onOpenAdvisor,
}: {
  data: MeAccountResponse;
  adv?: AdvisorData;
  t: T;
  plural: Plural;
  dark?: boolean;
  onOpenAdvisor?: () => void;
}) {
  const nav = useAccountNav();
  // One overlay open at a time (sheet | drawer | login), the .m-scrim closes it —
  // mirroring the desktop menu open/close pattern.
  const [overlay, setOverlay] = useState<null | "switcher" | "drawer" | "login">(null);
  const close = () => setOverlay(null);
  return (
    <div className="acc-mob">
      <Topbar data={data} t={t} plural={plural} dark={dark} onMenu={() => setOverlay("drawer")} />
      <div className="ma">
        <Header data={data} t={t} plural={plural} />
        <TotalsGrid totals={data.totals} t={t} />
        <TasksStrip tasks={data.tasks} t={t} plural={plural} nav={nav} />
        {adv ? <Advisor adv={adv} t={t} onOpen={onOpenAdvisor} /> : <AdvisorInvite t={t} onOpen={onOpenAdvisor} />}
        <CardsSection data={data} t={t} plural={plural} nav={nav} />
        <div style={{ height: 78 }} />
      </div>

      <SwitcherButton data={data} t={t} plural={plural} onOpen={() => setOverlay("switcher")} />

      {overlay === "switcher" ? <SwitcherSheet data={data} t={t} nav={nav} onClose={close} /> : null}
      {overlay === "drawer" ? <NavDrawer data={data} t={t} nav={nav} onClose={close} onOpenLogin={() => setOverlay("login")} /> : null}
      {overlay === "login" ? <LoginSheet data={data} t={t} nav={nav} onClose={close} /> : null}
    </div>
  );
}
