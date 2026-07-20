"use client";

// Overview (/app/overview) building blocks — the multi-account portfolio rollup,
// built 1:1 to Overview-SPEC.html / Overview-Mobile-SPEC.html. A combined top
// strip (PortfolioTotals) sits over a grid of per-account AccountCards; each
// card carries that account's headline numbers + sync state and opens the
// account. Tokens only (light/dark follow the ambient theme); no hardcoded
// colour. The importing card reuses the shared Phase-0 ImportBanner.
//
// These pieces take props the same way the real page passes them, so the
// /gallery/overview state page renders them with no auth/backend.

import Link from "next/link";
import { type ReactNode } from "react";

import { cn } from "@/lib/cn";
import { useTranslation, type MessageKey } from "@/lib/i18n";
import { pluralUnit } from "@/lib/i18n/plurals";
import type { LocaleCode } from "@/lib/i18n/locales";
import { Avatar } from "@/components/ui/avatar";
import { ConnectThreadsButton } from "@/components/ConnectThreadsButton";
import { ImportBanner } from "@/components/studio/ImportBanner";
import { NetworkBadge } from "@/components/studio/NetworkBadge";
import {
  IcAlert,
  IcArrowRight,
  IcArrowUp,
  IcArrowDown,
  IcAudit,
  IcBubble,
  IcChart,
  IcCheck,
  IcClock,
  IcEye,
  IcNib,
  IcOverview,
  IcPlus,
  IcReply,
  IcUndo,
  IcUsers,
  IcX,
} from "@/components/icons";
import type { ConnectedAccount, OverviewAccount, OverviewTotals } from "@/lib/types";

// ── formatting ───────────────────────────────────────────────────────
// Compact number for the headline tiles ("18.5K", "151K"), locale-aware.
function fmtCompact(n: number, locale: string): string {
  return new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 }).format(n);
}
// Full grouped number for per-account follower counts ("12,438").
function fmtFull(n: number, locale: string): string {
  return n.toLocaleString(locale);
}

// "Updated 2h ago" — Intl.RelativeTimeFormat in the viewer's tz; null →
// "Not synced yet". Recomputed each render from synced_at (no live ticking).
function relSynced(iso: string | null, locale: string, t: (k: MessageKey) => string): string {
  if (!iso) return t("overview.sync.never");
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return t("overview.sync.never");
  const diffSec = Math.round((then - Date.now()) / 1000);
  const abs = Math.abs(diffSec);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const rel =
    abs < 60
      ? rtf.format(diffSec, "second")
      : abs < 3600
        ? rtf.format(Math.round(diffSec / 60), "minute")
        : abs < 86400
          ? rtf.format(Math.round(diffSec / 3600), "hour")
          : rtf.format(Math.round(diffSec / 86400), "day");
  return `${t("overview.sync.updated_prefix")} ${rel}`;
}

// ── delta chip (followers Δ) ─────────────────────────────────────────
function Delta({ value, locale }: { value: number | null; locale: string }) {
  if (value === null || value === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 whitespace-nowrap text-caption font-semibold tabular-nums text-text-subtle">
        —
      </span>
    );
  }
  const up = value > 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 whitespace-nowrap text-caption font-semibold tabular-nums",
        up ? "text-success" : "text-danger",
      )}
    >
      {up ? <IcArrowUp size={12} /> : <IcArrowDown size={12} />}
      {fmtFull(Math.abs(value), locale)}
    </span>
  );
}

// ── combined top strip ───────────────────────────────────────────────
function Total({
  label,
  icon,
  value,
  sub,
  delta,
  attention,
}: {
  label: string;
  icon: ReactNode;
  value: string;
  sub: string;
  delta?: ReactNode;
  attention?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface px-[17px] py-[15px] shadow-sm">
      <div className="flex min-w-0 items-center gap-[7px] text-caption font-semibold uppercase tracking-[0.03em] text-text-subtle">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-sm border border-border bg-surface-2 text-text-muted">
          {icon}
        </span>
        <span className="truncate">{label}</span>
      </div>
      <div
        className={cn(
          "mt-[11px] text-h1 font-semibold leading-[1.1] tracking-[-0.015em] tabular-nums",
          attention ? "text-accent" : "text-text",
        )}
      >
        {value}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-caption text-text-subtle">{sub}</span>
        {delta}
      </div>
    </div>
  );
}

export function PortfolioTotals({ totals }: { totals: OverviewTotals }) {
  const { t, locale } = useTranslation();
  const acrossN = t(
    totals.accounts_count === 1 ? "overview.strip.across_one" : "overview.strip.across",
  ).replace("{n}", String(totals.accounts_count));
  return (
    <div className="flex flex-col gap-[14px]">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-caption font-semibold uppercase tracking-[0.04em] text-text-subtle">{acrossN}</span>
        {totals.importing_count > 0 && (
          <span className="text-caption font-semibold text-accent">
            {t("overview.strip.importing").replace("{n}", String(totals.importing_count))}
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-[14px] md:grid-cols-4">
        <Total
          label={t("overview.total.followers")}
          icon={<IcUsers size={13} />}
          value={fmtCompact(totals.followers, locale)}
          sub={t("overview.total.followers_sub")}
          delta={<Delta value={totals.followers_delta} locale={locale} />}
        />
        <Total
          label={t("overview.total.views")}
          icon={<IcEye size={13} />}
          value={fmtCompact(totals.views_7d, locale)}
          sub={t("overview.total.views_sub")}
        />
        <Total
          label={t("overview.total.posts")}
          icon={<IcNib size={13} />}
          value={fmtFull(totals.posts_week, locale)}
          sub={t("overview.total.posts_sub")}
        />
        <Total
          label={t("overview.total.replies")}
          icon={<IcBubble size={13} />}
          value={fmtFull(totals.replies_to_answer, locale)}
          sub={t("overview.total.replies_sub")}
          attention
        />
      </div>
    </div>
  );
}

// ── per-account metric cell ──────────────────────────────────────────
function Metric({
  label,
  icon,
  value,
  unit,
  delta,
  attention,
}: {
  label: string;
  icon: ReactNode;
  value: string;
  unit?: string;
  delta?: ReactNode;
  attention?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-[3px]">
      {/* Label stays on ONE line (truncate, icon shrink-0) so a long locale can't
          wrap it and make this tile taller than its siblings — keeping the metric
          row's baselines aligned (layout rule 1). */}
      <span className="flex min-w-0 items-center gap-1 text-[10.5px] font-semibold uppercase tracking-[0.03em] text-text-subtle">
        <span className="shrink-0">{icon}</span>
        <span className="truncate">{label}</span>
      </span>
      <span className="flex items-baseline gap-[7px] whitespace-nowrap">
        <span
          className={cn(
            "text-h3 font-semibold leading-[1.1] tracking-[-0.006em] tabular-nums",
            attention ? "text-accent" : "text-text",
          )}
        >
          {value}
          {unit && <span className="ml-1 text-caption font-medium text-text-subtle">{unit}</span>}
        </span>
        {delta}
      </span>
    </div>
  );
}

// ── triage queue («Требует тебя») — the cockpit hero ─────────────────────────
// A prioritized, scannable list of what needs the user across the WHOLE
// portfolio, above the totals + cards. Each row deep-links into the right
// screen/profile. Priority is by SIGNAL across profiles: failed syncs + replies
// (most urgent), then drafts, then audits. Layout rule 1 holds: every value/
// count/badge/chip/meta is single-line (truncate or whitespace-nowrap) and never
// pushes a neighbour down, even at 320px or in a long locale (German).
type TriageType = "sync" | "reply" | "draft" | "audit";

const TRIAGE_ICON: Record<TriageType, ReactNode> = {
  sync: <IcAlert size={13} />,
  reply: <IcReply size={13} />,
  draft: <IcNib size={13} />,
  audit: <IcAudit size={13} />,
};

type TriageItem = {
  key: string;
  type: TriageType;
  account: OverviewAccount;
  title: string;
  meta: string;
  // Deep-link for a "go" row (a "retry" row calls onRetry instead).
  path: string;
  action: "retry" | "go";
};

function netLabel(network: string): string {
  return network.charAt(0).toUpperCase() + network.slice(1);
}

// Build the prioritized triage items from the portfolio's per-profile signals.
function buildTriageItems(
  accounts: OverviewAccount[],
  locale: LocaleCode,
  t: (k: MessageKey) => string,
): TriageItem[] {
  const sync: TriageItem[] = [];
  const reply: TriageItem[] = [];
  const draft: TriageItem[] = [];
  const audit: TriageItem[] = [];
  for (const a of accounts) {
    if (a.sync_status === "error") {
      sync.push({
        key: `sync-${a.id}`, type: "sync", account: a, action: "retry", path: "",
        title: t("overview.triage.sync_failed").replace("{net}", netLabel(a.network)),
        meta: t("overview.triage.meta.sync"),
      });
    }
    if (a.replies_to_answer > 0) {
      reply.push({
        key: `reply-${a.id}`, type: "reply", account: a, action: "go",
        path: "/app/replies?filter=needs-reply",
        title: `${a.replies_to_answer} ${pluralUnit(locale, "comments", a.replies_to_answer)} ${t("overview.triage.replies_suffix")}`,
        meta: t("overview.triage.meta.replies"),
      });
    }
    if (a.pending_drafts > 0) {
      draft.push({
        key: `draft-${a.id}`, type: "draft", account: a, action: "go", path: "/app",
        title: `${a.pending_drafts} ${pluralUnit(locale, "drafts", a.pending_drafts)} ${t("overview.triage.drafts_suffix")}`,
        meta: t("overview.triage.meta.drafts"),
      });
    }
    if (a.pending_audits > 0) {
      audit.push({
        key: `audit-${a.id}`, type: "audit", account: a, action: "go", path: "/app/audits",
        title: `${a.pending_audits} ${pluralUnit(locale, "audits", a.pending_audits)} ${t("overview.triage.audits_suffix")}`,
        meta: t("overview.triage.meta.audits"),
      });
    }
  }
  return [...sync, ...reply, ...draft, ...audit];
}

// `onOpen(account, path)` switches the active account + routes (the real page
// passes it; the gallery omits it). `onRetry` re-attempts a failed sync.
export function TriageQueue({
  accounts,
  onOpen,
  onRetry,
}: {
  accounts: OverviewAccount[];
  onOpen?: (a: OverviewAccount, path: string) => void;
  onRetry?: (a: OverviewAccount) => void;
}) {
  const { t, locale } = useTranslation();
  const items = buildTriageItems(accounts, locale, t);

  if (items.length === 0) return <TriageZero profiles={accounts.length} />;

  const profileCount = new Set(items.map((i) => i.account.id)).size;
  const count = `${items.length} ${pluralUnit(locale, "items", items.length)} · ${profileCount} ${pluralUnit(locale, "profiles", profileCount)}`;

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
      <div className="flex items-baseline justify-between gap-3 px-[18px] pb-3 pt-[15px]">
        <span className="text-small font-semibold text-text">{t("overview.triage.heading")}</span>
        <span className="shrink-0 whitespace-nowrap text-caption font-medium tabular-nums text-text-subtle">{count}</span>
      </div>
      <div className="divide-y divide-border border-t border-border">
        {items.map((it) => (
          <TriageRow key={it.key} item={it} onOpen={onOpen} onRetry={onRetry} />
        ))}
      </div>
    </section>
  );
}

function TriageRow({
  item,
  onOpen,
  onRetry,
}: {
  item: TriageItem;
  onOpen?: (a: OverviewAccount, path: string) => void;
  onRetry?: (a: OverviewAccount) => void;
}) {
  const { t } = useTranslation();
  const a = item.account;
  const body = (
    <>
      <Avatar account={asAccountFace(a)} size={36} className="shrink-0 border border-border" />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="flex items-center gap-1.5">
          <span className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded border border-border bg-surface-2 text-text-muted">
            {TRIAGE_ICON[item.type]}
          </span>
          <span className="truncate text-small font-semibold text-text">{item.title}</span>
        </span>
        <span className="mt-[3px] flex items-center gap-1.5 text-caption text-text-subtle">
          <span className="truncate">{a.handle ? `@${a.handle}` : (a.name ?? "")}</span>
          <span className="shrink-0">·</span>
          <span className="shrink-0 whitespace-nowrap">{item.meta}</span>
        </span>
      </span>
      {item.action === "retry" ? (
        <span className="ml-auto inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md border border-border bg-surface px-2.5 py-1.5 text-caption font-semibold text-text transition-colors group-hover:bg-surface-2">
          <IcUndo size={13} />
          {t("overview.triage.retry")}
        </span>
      ) : (
        <span className="ml-auto grid h-[30px] w-[30px] shrink-0 place-items-center rounded-md border border-border bg-surface text-text-muted transition-colors group-hover:bg-surface-2 group-hover:text-text">
          <IcArrowRight size={16} />
        </span>
      )}
    </>
  );
  const cls =
    "group flex w-full items-center gap-3 px-[18px] py-3 text-left transition-colors hover:bg-surface-2";
  return item.action === "retry" ? (
    <button type="button" className={cls} onClick={() => onRetry?.(a)}>
      {body}
    </button>
  ) : (
    <button type="button" className={cls} onClick={() => onOpen?.(a, item.path)}>
      {body}
    </button>
  );
}

function TriageZero({ profiles }: { profiles: number }) {
  const { t } = useTranslation();
  return (
    <section className="flex flex-col items-center rounded-lg border border-border bg-surface px-6 py-8 text-center shadow-sm">
      <span className="grid h-12 w-12 place-items-center rounded-full border border-border bg-surface-2 text-text-muted">
        <IcCheck size={24} />
      </span>
      <div className="mt-3.5 text-small font-semibold text-text">{t("overview.triage.zero.title")}</div>
      <div className="mt-1 max-w-md text-caption text-text-subtle">
        {t("overview.triage.zero.body").replace("{n}", String(profiles))}
      </div>
      <div className="mt-3 inline-flex items-center gap-1 whitespace-nowrap text-caption text-text-subtle">
        <IcClock size={12} />
        {t("overview.triage.zero.foot")}
      </div>
    </section>
  );
}

// `OverviewAccount` → the flat `ConnectedAccount` shape <Avatar> consumes (it
// only reads profile_picture_url / display_name / username / id).
function asAccountFace(a: OverviewAccount): ConnectedAccount {
  return {
    id: a.id,
    tenant_id: a.tenant_id,
    network: a.network,
    threads_user_id: "",
    username: a.handle,
    display_name: a.name,
    profile_picture_url: a.avatar,
    followers_count: a.followers,
    connected_at: "",
    disconnected_at: null,
    sync_status: null,
    sync_summary: null,
    sync_started_at: null,
    sync_completed_at: null,
  };
}

// ── account card ─────────────────────────────────────────────────────
// `onOpen` switches the active account + routes into its Stats (the real page
// passes it; the gallery omits it). `onRetry` re-attempts a failed sync.
export function AccountCard({
  account,
  onOpen,
  onOpenStats,
  onOpenReplies,
  onRetry,
  showNetwork,
}: {
  account: OverviewAccount;
  onOpen?: (a: OverviewAccount) => void;
  onOpenStats?: (a: OverviewAccount) => void;
  onOpenReplies?: (a: OverviewAccount) => void;
  onRetry?: (a: OverviewAccount) => void;
  // Show the network badge — only when the portfolio spans >1 network (the
  // overview computes this), so it stays invisible on Threads-only today.
  showNetwork?: boolean;
}) {
  const { t, locale } = useTranslation();
  const rep = account.replies_to_answer;
  const importing = account.sync_status === "importing";
  const error = account.sync_status === "error";

  const head = (
    <div className="flex items-center gap-3">
      <Avatar account={asAccountFace(account)} size={42} className="border border-border" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-small font-semibold leading-[1.25] text-text">
          {account.name ?? account.handle ?? t("overview.account_fallback")}
        </div>
        {(account.handle || showNetwork) && (
          <div className="flex items-center gap-1.5 text-caption text-text-subtle">
            {account.handle && <span className="truncate">@{account.handle}</span>}
            {showNetwork && <NetworkBadge network={account.network} />}
          </div>
        )}
      </div>
      <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-md border border-border bg-surface text-text-muted transition-colors group-hover:bg-surface-2 group-hover:text-text">
        <IcArrowRight size={16} />
      </span>
    </div>
  );

  // Importing: the Phase-0 banner replaces the metric block (no settled numbers).
  if (importing) {
    return (
      <div className="rounded-lg border border-border bg-surface px-[18px] py-4 shadow-sm">
        {head}
        <div className="mt-3.5 [&_.shadow-sm]:shadow-none">
          <ImportBanner status="importing" summary={account.sync_summary} />
        </div>
      </div>
    );
  }

  const metrics = (
    <div className="mt-4 grid grid-cols-2 gap-[14px] min-[420px]:grid-cols-4 min-[420px]:gap-3">
      <Metric
        label={t("overview.metric.followers")}
        icon={<IcUsers size={11} />}
        value={account.followers !== null ? fmtFull(account.followers, locale) : "—"}
        delta={account.followers !== null ? <Delta value={account.followers_delta} locale={locale} /> : undefined}
      />
      <Metric
        label={t("overview.metric.views")}
        icon={<IcEye size={11} />}
        value={error ? "—" : fmtCompact(account.views_7d, locale)}
      />
      <Metric
        label={t("overview.metric.posts")}
        icon={<IcNib size={11} />}
        value={error ? "—" : fmtFull(account.posts_week, locale)}
        unit={t("overview.metric.posts_unit")}
      />
      <Metric
        label={t("overview.metric.replies")}
        icon={<IcBubble size={11} />}
        value={error ? "—" : fmtFull(rep, locale)}
        attention={!error && rep > 0}
      />
    </div>
  );

  const status = error ? (
    <div className="mt-[15px] flex items-center justify-between gap-2.5 border-t border-border pt-[13px]">
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-caption text-danger">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-danger" />
        {t("overview.sync.failed")}
      </span>
      <button
        type="button"
        onClick={() => onRetry?.(account)}
        className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-surface-2 px-[9px] py-1 text-caption font-semibold text-text-muted transition-colors hover:border-text/20 hover:bg-surface"
      >
        <IcUndo size={12} />
        {t("overview.action.retry")}
      </button>
    </div>
  ) : (
    <div className="mt-[15px] flex flex-wrap items-center justify-between gap-2.5 border-t border-border pt-[13px]">
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-caption text-text-subtle">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-success" />
        {relSynced(account.synced_at, locale, t)}
      </span>
      <div className="flex flex-wrap justify-end gap-[7px]">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenStats?.(account);
          }}
          className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-surface-2 px-[9px] py-1 text-caption font-semibold text-text-muted transition-colors hover:border-text/20 hover:bg-surface"
        >
          <IcChart size={12} />
          {t("overview.quick.stats")}
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenReplies?.(account);
          }}
          className={cn(
            "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-[9px] py-1 text-caption font-semibold transition-colors",
            rep > 0
              ? "border-accent/30 bg-accent/10 text-accent hover:bg-accent/15"
              : "border-border bg-surface-2 text-text-muted hover:border-text/20 hover:bg-surface",
          )}
        >
          <IcReply size={12} />
          {t("overview.quick.replies")}
          {rep > 0 && <span className="tabular-nums">{rep}</span>}
        </button>
      </div>
    </div>
  );

  // The whole card opens the account (a button wrapper for the tap target); the
  // quick-links stopPropagation to deep-link instead.
  return (
    <div
      role={onOpen ? "button" : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onClick={onOpen ? () => onOpen(account) : undefined}
      onKeyDown={
        onOpen
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onOpen(account);
              }
            }
          : undefined
      }
      className={cn(
        "group rounded-lg border border-border bg-surface px-[18px] py-4 shadow-sm transition-[border-color,box-shadow] duration-[120ms]",
        onOpen && "cursor-pointer hover:border-text/20 hover:shadow-md",
      )}
    >
      {head}
      {metrics}
      {status}
    </div>
  );
}

// ── single-account nudge ─────────────────────────────────────────────
// `demo` swaps the live ConnectThreadsButton (which hits the backend) for an
// inert look-alike, so the gallery / ?demo=1 review never fires a real connect.
export function OverviewNudge({ demo = false }: { demo?: boolean }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-[15px] rounded-lg border border-dashed border-accent/35 bg-accent/[0.06] px-[18px] py-4">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-accent/25 bg-accent/10 text-accent">
        <IcPlus size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-small font-semibold text-text">{t("overview.nudge.title")}</div>
        <div className="mt-0.5 text-caption leading-[1.5] text-text-muted">{t("overview.nudge.sub")}</div>
      </div>
      <div className="shrink-0">
        {demo ? (
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-border bg-surface px-3 py-1.5 text-small font-semibold text-text">
            <IcPlus size={15} />
            {t("accounts.connect")}
          </span>
        ) : (
          <ConnectThreadsButton variant="primary" returnTo="/app/overview" />
        )}
      </div>
    </div>
  );
}

// ── empty / error / loading ──────────────────────────────────────────
export function OverviewEmpty({ demo = false }: { demo?: boolean }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center rounded-lg border border-dashed border-border bg-surface/50 px-6 py-14 text-center">
      <span className="mb-[15px] grid h-[54px] w-[54px] place-items-center rounded-xl border border-accent/25 bg-accent/10 text-accent">
        <IcOverview size={26} />
      </span>
      <div className="mb-[7px] text-h2 font-semibold tracking-[-0.01em] text-text">{t("overview.empty.title")}</div>
      <div className="mb-[18px] max-w-[44ch] text-body leading-[1.55] text-text-muted">{t("overview.empty.sub")}</div>
      {demo ? (
        <span className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-small font-semibold text-primary-foreground">
          <IcPlus size={16} />
          {t("accounts.connect")}
        </span>
      ) : (
        <ConnectThreadsButton variant="primary" returnTo="/app/overview" />
      )}
    </div>
  );
}

export function OverviewError({ onRetry }: { onRetry?: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border border-l-[3px] border-l-danger bg-surface px-4 py-3.5 shadow-sm">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-danger/30 bg-danger/10 text-danger">
        <IcX size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-small font-semibold text-text">{t("overview.error.title")}</div>
        <div className="mt-0.5 text-caption text-text-muted">{t("overview.error.sub")}</div>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border border-border bg-surface-2 px-3 py-1.5 text-small font-semibold text-text-muted transition-colors hover:bg-surface"
      >
        <IcUndo size={15} />
        {t("overview.action.retry")}
      </button>
    </div>
  );
}

// Skeleton mirrors the final layout (4 total tiles + 2 card shells) so there's
// no reflow when data lands. `skel` (globals.css §3.7) is the shared shimmer.
function SkelLine({ className }: { className?: string }) {
  return <div className={cn("skel rounded-md", className)} />;
}

function SkelCard() {
  return (
    <div className="rounded-lg border border-border bg-surface px-[18px] py-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="h-[42px] w-[42px] shrink-0 rounded-full bg-surface-2" />
        <div className="min-w-0 flex-1">
          <SkelLine className="h-[13px] w-[90px]" />
          <SkelLine className="mt-1.5 h-[11px] w-[70px]" />
        </div>
        <span className="h-[30px] w-[30px] shrink-0 rounded-md bg-surface-2" />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-[14px] min-[420px]:grid-cols-4">
        <SkelLine className="h-[34px]" />
        <SkelLine className="h-[34px]" />
        <SkelLine className="h-[34px]" />
        <SkelLine className="h-[34px]" />
      </div>
    </div>
  );
}

export function OverviewSkeleton() {
  return (
    <div className="flex flex-col gap-[18px]">
      <div className="grid grid-cols-2 gap-[14px] md:grid-cols-4">
        <SkelLine className="h-[96px] rounded-lg" />
        <SkelLine className="h-[96px] rounded-lg" />
        <SkelLine className="h-[96px] rounded-lg" />
        <SkelLine className="h-[96px] rounded-lg" />
      </div>
      <div className="grid grid-cols-1 gap-[14px] md:grid-cols-2">
        <SkelCard />
        <SkelCard />
      </div>
    </div>
  );
}
