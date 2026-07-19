"use client";

// «Что Pennedly изменил за меня» — the unified applied-changes history for one
// account. Every suggestion a Pennedly surface applied (Agent one-click actions,
// Voice-check auto-fixes, weekly-Audit decisions) lands in ONE trust journal:
// what changed, when, who applied it (вы / Pennedly), with a read-only rollback
// zone. Ported from the design export (Applied-Changes-History-SPEC.html +
// applied-changes-build.js|css) into Tailwind over the ds tokens.
//
// HONEST v1 (read-only): the backend records raw payloads + technical summaries,
// so we DON'T fabricate «было → стало» diffs. Each row shows what we truly know —
// a human title (technical voice-lint summaries are cleaned to a plain title by
// kind), the source, the actor, the time, an «Открыть» link to the relevant
// surface, and the read-only rollback state («Откат появится позже»). Rich
// before→after pairs land once the record sites store human before/after (a
// follow-up backend PR). `rollbackable` is always false in this release.

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  IcAdvisor,
  IcAlert,
  IcAudit,
  IcCheck,
  IcChevRight,
  IcFilter,
  IcNib,
  IcReload,
  IcUndo,
} from "@/components/icons";
import { Button, buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { type MessageKey, useTranslation } from "@/lib/i18n";
import { pluralUnit } from "@/lib/i18n/plurals";
import type { LocaleCode } from "@/lib/i18n/locales";
import type { AppliedChangeEntry, AppliedChangeSource } from "@/lib/types";

type Filter = "all" | AppliedChangeSource;

// Sample entries for the demo route (?demo=1) + the state gallery — real
// component, no backend. Timestamps are relative to now so the day grouping
// shows «Сегодня / Вчера / <дата>». Mirrors the design's REC fixtures.
export function sampleAppliedChanges(): AppliedChangeEntry[] {
  const now = Date.now();
  const H = 3600_000;
  const mk = (
    id: number,
    source: AppliedChangeSource,
    kind: string,
    summary: string,
    actor: "user" | "auto",
    agoMs: number,
  ): AppliedChangeEntry => ({
    id,
    source,
    kind,
    summary,
    payload: {},
    actor,
    rollbackable: false,
    rolled_back_at: null,
    created_at: new Date(now - agoMs).toISOString(),
  });
  return [
    mk(10, "advisor_action", "routine", "Посты про рыбалку", "user", 2 * H),
    mk(9, "voice_lint", "set_intro", "Voice fix: set_intro → intro", "auto", 5 * H),
    mk(8, "advisor_action", "auto_replies", "Включены автоответы: всем, кроме троллей", "user", 7 * H),
    mk(7, "audit", "post_ending", "Заканчивать пост на мысли", "user", 26 * H),
    mk(6, "advisor_action", "best_time_routine", "Вечерние посты перенёс на утро", "user", 30 * H),
    mk(5, "voice_lint", "remove_item", "Voice fix: remove_item → hashtags", "auto", 34 * H),
    mk(4, "advisor_action", "schedule_post", "Пост про запуск рубрики", "user", 74 * H),
    mk(3, "audit", "posting_window", "Длинные посты на утро вторника", "auto", 78 * H),
    mk(2, "voice_lint", "set_intro", "Voice fix: set_intro → intro", "auto", 80 * H),
    mk(1, "advisor_action", "topics", "Темы недели: письмо и ремесло", "user", 82 * H),
  ];
}

// One calm neutral tone for all three sources — only the glyph differs.
const SOURCE_META: Record<AppliedChangeSource, { icon: typeof IcAdvisor; nameKey: MessageKey }> = {
  advisor_action: { icon: IcAdvisor, nameKey: "appliedChanges.source.agent" },
  voice_lint: { icon: IcNib, nameKey: "appliedChanges.source.voice" },
  audit: { icon: IcAudit, nameKey: "appliedChanges.source.audit" },
};

const FILTERS: Filter[] = ["all", "advisor_action", "voice_lint", "audit"];

// A human short «type» label per kind (falls back to a source-generic label so a
// new/unknown kind never leaks a raw technical string to the reader).
const KIND_TYPE_KEY: Record<string, MessageKey> = {
  routine: "appliedChanges.type.routine",
  auto_replies: "appliedChanges.type.auto_replies",
  voice_rule: "appliedChanges.type.voice_rule",
  schedule_post: "appliedChanges.type.post",
  topics: "appliedChanges.type.topics",
  reactive: "appliedChanges.type.reactive",
  format: "appliedChanges.type.format",
  best_time_routine: "appliedChanges.type.schedule",
  set_intro: "appliedChanges.type.intro",
  remove_item: "appliedChanges.type.remove_item",
  set_field: "appliedChanges.type.voice_rule",
  edit_field: "appliedChanges.type.voice_rule",
};
const SOURCE_TYPE_KEY: Record<AppliedChangeSource, MessageKey> = {
  advisor_action: "appliedChanges.type.agent_generic",
  voice_lint: "appliedChanges.type.voice_generic",
  audit: "appliedChanges.type.audit_generic",
};

// The «Открыть» target: the surface the change lives on. Best-effort by source
// (+ voice-shaped advisor actions go to the role-book).
function openHref(e: AppliedChangeEntry): string {
  if (e.source === "voice_lint") return "/app/role-book";
  if (e.source === "audit") return "/app/audits";
  if (e.kind === "voice_rule" || e.kind === "format") return "/app/role-book";
  return "/app/scenarios";
}

function localeTag(locale: string): string {
  return locale === "ru" ? "ru-RU" : locale === "en" ? "en-US" : locale;
}
function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}
function dayLabel(iso: string, locale: string, t: (k: MessageKey) => string): string {
  const d = new Date(iso);
  const now = new Date();
  if (sameDay(d, now)) return t("appliedChanges.today");
  const yest = new Date(now);
  yest.setDate(now.getDate() - 1);
  if (sameDay(d, yest)) return t("appliedChanges.yesterday");
  return d.toLocaleDateString(localeTag(locale), { day: "numeric", month: "long" });
}
// Is `iso` yesterday (local)?
function isYesterday(d: Date): boolean {
  const y = new Date();
  y.setDate(y.getDate() - 1);
  return sameDay(d, y);
}
// Compact time for the collapsed row (эталон's 3 tiers): HH:MM today, «вчера»
// yesterday, short date otherwise.
function rowTime(iso: string, locale: string, t: (k: MessageKey) => string): string {
  const d = new Date(iso);
  if (sameDay(d, new Date())) return d.toLocaleTimeString(localeTag(locale), { hour: "2-digit", minute: "2-digit" });
  if (isYesterday(d)) return t("appliedChanges.yesterdayLower");
  return d.toLocaleDateString(localeTag(locale), { day: "numeric", month: "short" });
}
// Full «когда» for the expanded meta line — relative day + time, matching the
// эталон («сегодня, 14:02» / «вчера, 09:15» / «3 июля, 18:22»), consistent with
// the day-group header on the same row.
function fullWhen(iso: string, locale: string, t: (k: MessageKey) => string): string {
  const d = new Date(iso);
  const time = d.toLocaleTimeString(localeTag(locale), { hour: "2-digit", minute: "2-digit" });
  if (sameDay(d, new Date())) return `${t("appliedChanges.todayLower")}, ${time}`;
  if (isYesterday(d)) return `${t("appliedChanges.yesterdayLower")}, ${time}`;
  return `${d.toLocaleDateString(localeTag(locale), { day: "numeric", month: "long" })}, ${time}`;
}

// A human row title. Voice-lint summaries are stored technical
// ("Voice fix: set_intro → intro") — clean them to a plain title by kind. Every
// other source already stores a human summary.
function displayTitle(e: AppliedChangeEntry, t: (k: MessageKey) => string): string {
  if (e.source === "voice_lint" && /^voice fix:/i.test(e.summary)) {
    if (e.kind === "set_intro") return t("appliedChanges.voiceTitle.intro");
    if (e.kind === "remove_item") return t("appliedChanges.voiceTitle.remove");
    return t("appliedChanges.voiceTitle.generic");
  }
  if (e.source === "audit" && /^audit:/i.test(e.summary)) return t("appliedChanges.auditTitle.generic");
  return e.summary;
}
function typeLabel(e: AppliedChangeEntry, t: (k: MessageKey) => string): string {
  const key = KIND_TYPE_KEY[e.kind] ?? SOURCE_TYPE_KEY[e.source];
  return t(key);
}

function SourceChip({ source, t }: { source: AppliedChangeSource; t: (k: MessageKey) => string }) {
  const { icon: Icon, nameKey } = SOURCE_META[source];
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-surface-2 py-[5px] pl-2 pr-2.5 text-caption font-semibold leading-none text-text-muted">
      <Icon size={13} className="shrink-0 text-accent opacity-90" />
      {t(nameKey)}
    </span>
  );
}

// Read-only rollback zone. v1: rollbackable is always false → the honest «откат
// появится позже» state; a rolled-back row (future) shows the «откачено» state.
function RollbackZone({ e, t, locale }: { e: AppliedChangeEntry; t: (k: MessageKey) => string; locale: string }) {
  const done = e.rolled_back_at;
  return (
    <div className="mt-0.5 flex flex-wrap items-center gap-2.5 border-t border-border pt-3">
      <span
        className={cn(
          "grid h-[26px] w-[26px] shrink-0 place-items-center rounded-sm border",
          done ? "border-warning/26 bg-warning/12 text-warning" : "border-border bg-surface-2 text-text-subtle opacity-60",
        )}
      >
        <IcUndo size={14} />
      </span>
      <span className="min-w-0 flex-1 text-caption leading-[1.45] text-text-muted [&_b]:font-semibold [&_b]:text-text">
        {done ? (
          <>
            <b>{t("appliedChanges.rollback.doneLabel").replace("{when}", new Date(done).toLocaleDateString(localeTag(locale), { day: "numeric", month: "long" }))}</b>{" "}
            {t("appliedChanges.rollback.doneSub")}
          </>
        ) : (
          <>
            <b>{t("appliedChanges.rollback.laterLabel")}</b> {t("appliedChanges.rollback.laterSub")}
          </>
        )}
      </span>
    </div>
  );
}

function Row({ e, open, onToggle, t, locale }: { e: AppliedChangeEntry; open: boolean; onToggle: () => void; t: (k: MessageKey) => string; locale: string }) {
  const reverted = !!e.rolled_back_at;
  const actorMeta = e.actor === "auto" ? t("appliedChanges.appliedByAuto") : t("appliedChanges.appliedByYou");
  return (
    <div className={cn("border-t border-border first:border-t-0")}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={cn("flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-surface-2 max-[640px]:flex-wrap max-[640px]:gap-x-2.5 max-[640px]:gap-y-2", reverted && "opacity-[0.68]")}
      >
        <SourceChip source={e.source} t={t} />
        <span className="min-w-0 flex-1 max-[640px]:order-4 max-[640px]:basis-full">
          <span className="text-small font-semibold leading-[1.35] text-text">{displayTitle(e, t)}</span>
          <span className="text-caption font-normal text-text-subtle"> · {typeLabel(e, t)}</span>
        </span>
        {reverted ? (
          <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-warning/28 bg-warning/12 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.03em] text-warning">
            {t("appliedChanges.rolledBackBadge")}
          </span>
        ) : (
          <span className="shrink-0 whitespace-nowrap rounded-full border border-border bg-surface px-2 py-0.5 font-mono text-[10px] tracking-[0.02em] text-text-subtle max-[640px]:hidden">
            {e.actor === "auto" ? t("appliedChanges.actor.auto") : t("appliedChanges.actor.you")}
          </span>
        )}
        <span className="shrink-0 whitespace-nowrap text-caption tabular-nums text-text-subtle max-[640px]:order-2 max-[640px]:ml-auto">{rowTime(e.created_at, locale, t)}</span>
        <span className={cn("inline-flex shrink-0 text-text-subtle transition-transform max-[640px]:order-3", open && "rotate-90")}>
          <IcChevRight size={16} />
        </span>
      </button>

      {open && (
        <div className="flex flex-col gap-0 px-4 pb-4 pl-[55px] max-[640px]:pl-4">
          <div className="flex flex-col gap-3 border-t border-dashed border-border pt-3">
            <div className="flex flex-wrap items-center gap-2 text-caption text-text-subtle [&_b]:font-medium [&_b]:text-text-muted">
              <IcCheck size={13} className="shrink-0 text-text-subtle" />
              <span>
                <b>{actorMeta}</b> · {fullWhen(e.created_at, locale, t)}
              </span>
              <Link
                href={openHref(e)}
                className="ml-auto inline-flex items-center gap-1.5 whitespace-nowrap text-small font-medium text-accent hover:underline max-[640px]:ml-0 max-[640px]:mt-1 max-[640px]:w-full"
              >
                {t("appliedChanges.open")}
                <IcChevRight size={13} />
              </Link>
            </div>
            <RollbackZone e={e} t={t} locale={locale} />
          </div>
        </div>
      )}
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 border-t border-border px-4 py-[15px] first:border-t-0">
      <span className="h-[22px] w-[74px] shrink-0 [animation:dot-pulse_1.3s_var(--ease-standard)_infinite] rounded-full bg-surface-2" />
      <span className="flex flex-1 flex-col gap-[7px]">
        <span className="h-[11px] w-[62%] [animation:dot-pulse_1.3s_var(--ease-standard)_infinite] rounded-full bg-surface-2" />
        <span className="h-[9px] w-[34%] [animation:dot-pulse_1.3s_var(--ease-standard)_infinite] rounded-full bg-surface-2" />
      </span>
      <span className="h-[11px] w-[38px] shrink-0 [animation:dot-pulse_1.3s_var(--ease-standard)_infinite] rounded-full bg-surface-2" />
    </div>
  );
}

export function AppliedChangesHistory({
  entries,
  loading,
  error,
  onRetry,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
  advisorHref = "/app/account/advisor",
  bare = false,
}: {
  entries: AppliedChangeEntry[];
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
  advisorHref?: string;
  bare?: boolean;
}) {
  const { t, locale } = useTranslation();
  const [filter, setFilter] = useState<Filter>("all");
  const [openId, setOpenId] = useState<number | null>(null);

  const filtered = useMemo(() => (filter === "all" ? entries : entries.filter((e) => e.source === filter)), [entries, filter]);
  const count = filtered.length;

  // Group the filtered entries by local day, preserving the server order
  // (newest first) across groups.
  const groups = useMemo(() => {
    const out: { key: string; label: string; items: AppliedChangeEntry[] }[] = [];
    for (const e of filtered) {
      const k = dayKey(e.created_at);
      const last = out[out.length - 1];
      if (last && last.key === k) last.items.push(e);
      else out.push({ key: k, label: dayLabel(e.created_at, locale, t), items: [e] });
    }
    return out;
  }, [filtered, locale, t]);

  const head = !bare && (
    <>
      <div className="inline-flex items-center gap-[7px] text-small text-text-subtle">
        <Link href="/app/account" className="text-text-muted no-underline hover:text-text">
          {t("appliedChanges.crumbAccount")}
        </Link>
        <IcChevRight size={13} className="shrink-0 opacity-60" />
        <span>{t("appliedChanges.title")}</span>
      </div>
      <div>
        <h1 className="text-h1 font-semibold leading-[1.1] tracking-[-0.015em] text-text">{t("appliedChanges.title")}</h1>
        <p className="mt-1.5 max-w-[62ch] text-body leading-[1.55] text-text-muted [text-wrap:pretty]">{t("appliedChanges.pageheadDesc")}</p>
      </div>
    </>
  );

  const filterChips = (
    <div className="flex flex-wrap gap-1.5" role="tablist" aria-label={t("appliedChanges.filterAria")}>
      {FILTERS.map((f) => {
        const on = f === filter;
        const Icon = f === "all" ? IcFilter : SOURCE_META[f].icon;
        const label = f === "all" ? t("appliedChanges.filterAll") : t(SOURCE_META[f].nameKey);
        return (
          <button
            key={f}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => setFilter(f)}
            className={cn(
              "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-[11px] py-[5px] text-caption font-medium transition-colors",
              on ? "border-accent/40 bg-accent/[0.08] font-semibold text-accent" : "border-border bg-surface text-text-muted hover:bg-surface-2 hover:text-text",
            )}
          >
            <Icon size={12} className={cn("shrink-0", on ? "text-accent opacity-100" : "opacity-70")} />
            {label}
          </button>
        );
      })}
    </div>
  );

  let body: React.ReactNode;
  if (loading) {
    body = (
      <>
        <div className="flex items-center gap-3">
          <span className="inline-block h-[13px] w-24 [animation:dot-pulse_1.3s_var(--ease-standard)_infinite] rounded-full bg-surface-2" />
        </div>
        <div className="flex flex-col gap-[22px]" aria-busy="true">
          <div className="flex flex-col gap-[9px]">
            <span className="h-3 w-[88px] [animation:dot-pulse_1.3s_var(--ease-standard)_infinite] rounded-full bg-surface-2" />
            <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </div>
          </div>
        </div>
      </>
    );
  } else if (error) {
    body = (
      <>
        <div className="flex items-center gap-3">
          <span className="text-small text-text-subtle">
            <b className="font-semibold tabular-nums text-text-muted">{count}</b> {pluralUnit(locale as LocaleCode, "changes", count)}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-danger/30 bg-danger/[0.06] px-[18px] py-4" role="alert">
          <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-md border border-danger/26 bg-danger/12 text-danger">
            <IcAlert size={20} />
          </span>
          <div className="min-w-0 flex-1 basis-[220px]">
            <div className="text-small font-semibold text-text">{t("appliedChanges.error.title")}</div>
            <div className="mt-0.5 text-caption leading-[1.45] text-text-muted">{t("appliedChanges.error.sub")}</div>
          </div>
          {onRetry && (
            <Button size="sm" variant="secondary" icon={<IcReload size={14} />} onClick={onRetry} className="shrink-0">
              {t("appliedChanges.error.retry")}
            </Button>
          )}
        </div>
      </>
    );
  } else if (count === 0) {
    body = (
      <div className="flex flex-col items-center rounded-lg border border-dashed border-border bg-surface/50 px-[26px] py-11 text-center">
        <span className="mb-[15px] grid h-[50px] w-[50px] place-items-center rounded-lg border border-accent/24 bg-accent/[0.11] text-accent">
          <IcAudit size={24} />
        </span>
        <div className="text-h3 font-semibold tracking-[-0.006em] text-text">{filter === "all" ? t("appliedChanges.empty.title") : t("appliedChanges.emptyFiltered.title")}</div>
        <div className="mt-[7px] max-w-[42ch] text-small leading-[1.55] text-text-muted [text-wrap:pretty]">
          {filter === "all" ? t("appliedChanges.empty.sub") : t("appliedChanges.emptyFiltered.sub")}
        </div>
        {filter === "all" ? (
          <Link href={advisorHref} className={buttonClasses({ variant: "primary", className: "mt-[18px]" })}>
            <IcAdvisor size={16} />
            {t("appliedChanges.empty.cta")}
          </Link>
        ) : (
          <Button variant="secondary" className="mt-[18px]" onClick={() => setFilter("all")}>
            {t("appliedChanges.emptyFiltered.cta")}
          </Button>
        )}
      </div>
    );
  } else {
    body = (
      <>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-small text-text-subtle">
            <b className="font-semibold tabular-nums text-text-muted">{count}</b> {pluralUnit(locale as LocaleCode, "changes", count)}
          </span>
          <span className="ml-auto">{filterChips}</span>
        </div>
        <div className="flex flex-col gap-[22px]">
          {groups.map((g) => (
            <div key={g.key} className="flex flex-col gap-[9px]">
              <div className="pl-0.5 font-mono text-caption font-semibold uppercase tracking-[0.06em] text-text-subtle">{g.label}</div>
              <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
                {g.items.map((e) => (
                  <Row key={e.id} e={e} open={openId === e.id} onToggle={() => setOpenId((v) => (v === e.id ? null : e.id))} t={t} locale={locale} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </>
    );
  }

  // «Показать ещё» lives in a shared footer, shown whenever the server has more
  // pages — for the populated feed AND the filtered-empty state. (Client-side
  // filtering over server pagination: a source's older entries can sit past the
  // loaded window, so hiding load-more under a filter would strand them.)
  const showMore = !loading && !error && hasMore && !!onLoadMore;

  return (
    <div className="flex max-w-[var(--content-reading)] flex-col gap-5">
      {head}
      {body}
      {showMore && (
        <div className="flex justify-center pt-1">
          <Button size="sm" variant="secondary" loading={loadingMore} onClick={onLoadMore}>
            {t("appliedChanges.loadMore")}
          </Button>
        </div>
      )}
    </div>
  );
}
