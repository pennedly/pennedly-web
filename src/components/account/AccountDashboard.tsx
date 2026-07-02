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

// ── icons (inline, mirrors account-desktop.js P/ic) ──────────────────────────
const PATHS: Record<string, string> = {
  grid: "<rect x='4' y='4' width='7' height='7' rx='1.5'/><rect x='13' y='4' width='7' height='7' rx='1.5'/><rect x='4' y='13' width='7' height='7' rx='1.5'/><rect x='13' y='13' width='7' height='7' rx='1.5'/>",
  layers: "<path d='M12 4 3 9l9 5 9-5-9-5Z'/><path d='M3 14l9 5 9-5'/>",
  advisor:
    "<path d='M4 16V7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H9l-4 4v-4Z'/><path d='M8 13l2.6-2.6 1.8 1.8L16 9'/><path d='M13.4 9H16v2.6'/>",
  settings:
    "<circle cx='12' cy='12' r='3'/><path d='M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2'/>",
  users: "<circle cx='9' cy='9' r='3.2'/><path d='M3.5 19a5.5 5.5 0 0 1 11 0'/><path d='M16 6.3a3 3 0 0 1 0 5.4M17.5 19a5.5 5.5 0 0 0-3-4.9'/>",
  eye: "<path d='M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z'/><circle cx='12' cy='12' r='2.6'/>",
  nib: "<path d='M4 20 13 11'/><path d='M12 4 20 12 13 11 13 4Z'/><circle cx='6' cy='18' r='0.6'/>",
  bubble: "<path d='M5 17l-1.5 3.5L8 19h8a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3H7a3 3 0 0 0-3 3v6a3 3 0 0 0 1 2.7Z'/>",
  reply: "<path d='M9 7 4 12l5 5M4 12h9a6 6 0 0 1 6 6v1'/>",
  audit: "<rect x='5' y='4' width='14' height='17' rx='2'/><path d='M9 4.5h6V7H9Z'/><path d='M8.5 12.5l2 2 4-4.5'/>",
  up: "<path d='M12 19V6M6 11l6-6 6 6'/>",
  down: "<path d='M12 5v13M6 13l6 6 6-6'/>",
  "arrow-right": "<path d='M5 12h14M13 6l6 6-6 6'/>",
  plus: "<path d='M12 5v14M5 12h14'/>",
  undo: "<path d='M9 7 5 11l4 4'/><path d='M5 11h9a5 5 0 0 1 0 10h-3'/>",
  check: "<path d='M4.5 12.5 9.5 17.5 19.5 6.5'/>",
  "chev-right": "<path d='M9 6l6 6-6 6'/>",
  "chev-down": "<path d='M6 9l6 6 6-6'/>",
  "chev-up": "<path d='M6 15l6-6 6 6'/>",
  logout: "<path d='M14 7V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2'/><path d='M10 12h10M17 9l3 3-3 3'/>",
  alert: "<path d='M12 4 2.5 20.5h19L12 4Z'/><path d='M12 10v4'/><circle cx='12' cy='17.4' r='0.5'/>",
  send: "<path d='M5 12h13M12 5l7 7-7 7'/>",
  sparkle: "<path d='M12 4l1.6 4.8L18 10l-4.4 1.2L12 16l-1.6-4.8L6 10l4.4-1.2L12 4Z'/>",
  moon: "<path d='M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z'/>",
  sun: "<circle cx='12' cy='12' r='4'/><path d='M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19'/>",
};

function Ic({ n, s = 14 }: { n: string; s?: number }) {
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: PATHS[n] || "" }}
    />
  );
}

// ── translator + helpers ─────────────────────────────────────────────────────
export type T = (key: string) => string;
// Grammatical plural for a count — the caller wires it to the app's pluralUnit
// (locale-aware: «1 профиль» · «3 профиля» · «5 профилей»). Covers every unit
// this screen inflects: card counts (profiles/brands) + tasks-strip chips
// (drafts/audits), so «1 черновик» · «2 черновика» · «5 черновиков» stays correct.
export type Plural = (unit: "profiles" | "brands" | "drafts" | "audits", n: number) => string;

const NET_LABEL: Record<string, string> = { threads: "Threads", linkedin: "LinkedIn" };
const NET_GLYPH: Record<string, string> = { threads: "@", linkedin: "in" };

function nfmt(n: number): string {
  // Compact thousands like the эталон numbers (12,4k). Keep small numbers plain.
  if (n >= 10000) return (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1).replace(".", ",") + "k";
  return n.toLocaleString("ru-RU");
}

function initials(name: string | null, handle: string | null): string {
  const s = (name || handle || "?").trim();
  return s.slice(0, 2).toUpperCase();
}

function Delta({ v }: { v: number | null }) {
  if (v == null) return <span className="acc-delta acc-delta--flat">—</span>;
  const down = v < 0;
  return (
    <span className={`acc-delta acc-delta--${down ? "down" : "up"}`}>
      <Ic n={down ? "down" : "up"} s={12} />
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
      {NET_GLYPH[network] || "•"}
    </span>
  );
}
function Avatar({ p, cls = "acc-av" }: { p: AccountProfile; cls?: string }) {
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
        <Ic n={icon} s={11} />
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
        <Ic n="arrow-right" s={16} />
      </span>
    </div>
  );
}

export function ProfileCard({ p, t }: { p: AccountProfile; t: T }) {
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
      <div className="acc-card">
        <ProfileHead p={p} />
        <Metrics4 t={t} d={p} muted />
        <div className="acc-cardfoot">
          <span className="acc-sync acc-sync--error">
            <span className="acc-sync-dot" />
            {t("acc.sync_failed")}
          </span>
          <button className="acc-retry" type="button">
            <Ic n="undo" s={12} />
            {t("acc.retry")}
          </button>
        </div>
      </div>
    );
  }
  const attn = p.replies_to_answer > 0;
  return (
    <div className="acc-card">
      <ProfileHead p={p} />
      <Metrics4 t={t} d={p} />
      <div className="acc-cardfoot">
        <span className="acc-sync">
          <span className="acc-sync-dot" />
          {t("acc.synced")}
        </span>
        <div className="acc-quick">
          <a className="acc-quicklink">
            <Ic n="nib" s={12} />
            {t("acc.stats")}
          </a>
          <a className={`acc-quicklink${attn ? " acc-quicklink--attention" : ""}`}>
            <Ic n="reply" s={12} />
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

export function BrandCard({ b, t, plural }: { b: AccountBrand; t: T; plural: Plural }) {
  const pc = b.profiles.length;
  const errors = b.profiles.filter((p) => p.sync_status === "error").length;
  const importing = b.profiles.filter((p) => p.sync_status === "importing").length;
  const brandMono = initials(b.name, null);
  const agg = {
    followers: b.stats.followers,
    followers_delta: b.stats.followers_delta,
    views_7d: b.stats.views_7d,
    posts_week: b.stats.posts_week,
    replies_to_answer: b.stats.replies_to_answer,
  };
  return (
    <div className="acc-card acc-card--brand">
      <div className="acc-card-head">
        <span style={{ position: "relative", flex: "0 0 auto" }}>
          <BrandMark mono={brandMono} />
          <span className="acc-brand-net">
            {b.networks.map((nid) => (
              <span key={nid} className="acc-brand-netbadge">
                {NET_GLYPH[nid] || "•"}
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
          <Ic n="arrow-right" s={16} />
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14, minWidth: 0 }}>
        <BrandStack b={b} />
      </div>
      <Metrics4 t={t} d={agg} />
      <div className="acc-cardfoot">
        <span className="acc-brand-statline">
          <span className={`acc-brand-statdot${errors || importing ? " acc-brand-statdot--warn" : ""}`} />
          {errors ? `${errors} ${t("acc.error_n")}` : importing ? `${importing} ${t("acc.importing_n")}` : t("acc.synced_all")}
        </span>
      </div>
    </div>
  );
}

// ── add-brand CTA ────────────────────────────────────────────────────────────
export function AddBrand({ t }: { t: T }) {
  return (
    <a className="acc-add">
      <span className="acc-add-ico">
        <Ic n="plus" s={20} />
      </span>
      <span className="acc-add-t">{t("acc.add_brand_t")}</span>
      <span className="acc-add-s">{t("acc.add_brand_s")}</span>
    </a>
  );
}

// ── cards section (adaptive on scope.show_brand_level) ───────────────────────
export function CardsSection({ data, t, plural }: { data: MeAccountResponse; t: T; plural: Plural }) {
  const multi = data.scope.show_brand_level;
  const count = multi ? data.brands.length : data.scope.profiles_count;
  return (
    <>
      <div className="acc-sec">
        <span className="acc-sec-t">{multi ? t("acc.sec_brands") : t("acc.sec_profiles")}</span>
        <span className="acc-sec-n">{count}</span>
        <span className="acc-sec-note">{multi ? t("acc.note_brand") : t("acc.note_profile")}</span>
      </div>
      <div className="acc-grid">
        {multi
          ? data.brands.map((b) => <BrandCard key={b.id} b={b} t={t} plural={plural} />)
          : data.brands.flatMap((b) => b.profiles).map((p) => <ProfileCard key={p.id} p={p} t={t} />)}
        <AddBrand t={t} />
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
        <Ic n={icon} s={12} />
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
  const acctMono = initials(data.tenant.name, null);
  return (
    <div className="acc-head">
      <div className="acc-head-id">
        <AcctMark mono={acctMono} />
        <div className="acc-head-txt">
          <div className="acc-head-name">{data.tenant.name}</div>
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

export function TasksStrip({ tasks, t, plural }: { tasks: AccountTasks; t: T; plural: Plural }) {
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
        <Ic n="alert" s={15} />
        {t("acc.tasks_title")}
      </span>
      <div className="acc-tasks-chips">
        {chips.map((c) => (
          <span key={c.type} className={`acc-taskchip${c.type === "sync" ? " acc-taskchip--sync" : ""}`}>
            <Ic n={TASK_IC[c.type]} s={12} />
            <b>{c.n}</b> {c.label}
          </span>
        ))}
      </div>
      <a className="acc-tasks-all">
        {t("acc.tasks_all")}
        <Ic n="arrow-right" s={13} />
      </a>
    </div>
  );
}

// ── sidebar (account level) ──────────────────────────────────────────────────
export function Sidebar({ data, t }: { data: MeAccountResponse; t: T }) {
  const multi = data.scope.brands_count >= 2;
  return (
    <div className="acc-sb">
      <div className="acc-sb-brand">
        <span className="acc-sb-mark">
          <Ic n="nib" s={16} />
        </span>
        <span className="acc-sb-name">Pennedly</span>
      </div>
      <div className="acc-sb-cap">{t("acc.account_word")}</div>
      <div className="acc-sb-nav">
        <a className="acc-sb-row acc-sb-row--active">
          <Ic n="grid" s={17} />
          <span className="acc-sb-rowtxt">{t("acc.nav_dashboard")}</span>
        </a>
        {multi ? (
          <a className="acc-sb-row">
            <Ic n="layers" s={17} />
            <span className="acc-sb-rowtxt">{t("acc.nav_brands")}</span>
            <span className="acc-sb-badge">{data.scope.brands_count}</span>
          </a>
        ) : null}
        <a className="acc-sb-row">
          <Ic n="advisor" s={17} />
          <span className="acc-sb-rowtxt">{t("acc.nav_advisor")}</span>
        </a>
        <a className="acc-sb-row">
          <Ic n="settings" s={17} />
          <span className="acc-sb-rowtxt">{t("acc.nav_settings")}</span>
        </a>
      </div>
      <div className="acc-sb-foot">
        <button className="acc-login" type="button">
          <AcctMark mono={initials(data.tenant.name, null)} />
          <span className="acc-login-who">
            <span className="acc-login-email">{data.tenant.name}</span>
            <span className="acc-login-plan">{data.tenant.plan_tier}</span>
          </span>
          <Ic n="chev-up" s={15} />
        </button>
      </div>
    </div>
  );
}

// ── topbar (breadcrumb + flat profile switcher) ──────────────────────────────
export function Topbar({ data, t, plural, dark }: { data: MeAccountResponse; t: T; plural: Plural; dark?: boolean }) {
  const acctMono = initials(data.tenant.name, null);
  const allProfiles = data.brands.flatMap((b) => b.profiles);
  const stack = allProfiles.slice(0, 3);
  return (
    <div className="acc-top">
      <nav className="acc-crumb">
        <a className="acc-crumb-seg acc-crumb-seg--current">
          <AcctMark mono={acctMono} />
          <span className="acc-crumb-txt">{t("acc.crumb_account")}</span>
        </a>
      </nav>
      <div className="acc-top-actions">
        <button className="acc-sw" type="button">
          <span className="acc-sw-stack">
            {stack.map((p) => (
              <Avatar key={p.id} p={p} />
            ))}
          </span>
          <span className="acc-sw-lab">
            <span className="acc-sw-t">{t("acc.sw_all")}</span>
            <span className="acc-sw-s">
              {allProfiles.length} {plural("profiles", allProfiles.length)}
            </span>
          </span>
          <Ic n="chev-down" s={15} />
        </button>
        <span className="acc-ib">
          <Ic n={dark ? "sun" : "moon"} s={16} />
        </span>
        <span className="acc-ib">
          <Ic n="settings" s={16} />
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
          <Ic n="advisor" s={20} />
        </span>
        <div className="acc-adv-headtext">
          <div className="acc-adv-title">{t("acc.adv_title")}</div>
          <div className="acc-adv-scope">{t("acc.adv_scope")}</div>
        </div>
        <button className="btn btn--secondary btn--sm acc-adv-open" type="button" onClick={onOpen}>
          <Ic n="advisor" s={15} />
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
                <Ic n={c.icon} s={13} />
                <span className="t">{c.text}</span>
              </span>
            ))}
          </div>
          <div className="acc-adv-grounded">
            <span className="lab">
              <Ic n="sparkle" s={12} />
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
              <Ic n="send" s={17} />
            </button>
          </div>
        </div>
        <div className="acc-adv-side">
          <div className="acc-adv-sidecap">{t("acc.adv_reco")}</div>
          {adv.recos.map((r, i) => (
            <a key={i} className={`acc-rec${r.tone === "danger" ? " acc-rec--danger" : r.tone === "accent" ? " acc-rec--accent" : ""}`}>
              <span className="acc-rec-ic">
                <Ic n={r.icon} s={15} />
              </span>
              <span className="acc-rec-body">
                <span className="acc-rec-t">{r.t}</span>
                <span className="acc-rec-s">{r.s}</span>
              </span>
              <span className="acc-rec-go">
                <Ic n="chev-right" s={16} />
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
          <Ic n="advisor" s={20} />
        </span>
        <div className="acc-adv-headtext">
          <div className="acc-adv-title">{t("acc.adv_title")}</div>
          <div className="acc-adv-scope">{t("acc.adv_scope")}</div>
        </div>
        <button className="btn btn--secondary btn--sm acc-adv-open" type="button" onClick={onOpen}>
          <Ic n="advisor" s={15} />
          {t("acc.adv_open")}
        </button>
      </div>
      <div className="acc-adv-body" style={{ gridTemplateColumns: "1fr" }}>
        <div className="acc-adv-main">
          <div className="acc-adv-detail">{t("acc.adv_invite")}</div>
          <div className="acc-adv-composer" onClick={onOpen} style={{ cursor: "pointer" }}>
            <span className="ph">{t("acc.adv_ask")}</span>
            <button className="acc-adv-send" type="button" onClick={onOpen}>
              <Ic n="send" s={17} />
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
}: {
  data: MeAccountResponse;
  // Rich advisor content (gallery/demo). Omit on the live screen → the honest
  // AdvisorInvite shell renders instead (no fabricated numbers).
  adv?: AdvisorData;
  t: T;
  plural: Plural;
  dark?: boolean;
  onOpenAdvisor?: () => void;
}) {
  return (
    <div className="acc-shell">
      <Sidebar data={data} t={t} />
      <div className="acc-mainwrap" style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 18 }}>
        <Topbar data={data} t={t} plural={plural} dark={dark} />
        <div className="acc">
          <Header data={data} t={t} plural={plural} />
          <TasksStrip tasks={data.tasks} t={t} plural={plural} />
          {adv ? (
            <Advisor adv={adv} t={t} onOpen={onOpenAdvisor} />
          ) : (
            <AdvisorInvite t={t} onOpen={onOpenAdvisor} />
          )}
          <CardsSection data={data} t={t} plural={plural} />
        </div>
      </div>
    </div>
  );
}
