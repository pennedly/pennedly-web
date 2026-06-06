"use client";

// Stats presentational layer — pure components driven by props, so the live
// dashboard (real API) and the ?demo=1 review (mock data) render the same pixels.
// Built 1:1 to Stats-SPEC.html: range segment, 4 summary cards with delta chips,
// one column chart (avg views/post vs a dashed average line), tier distribution
// bars, empty + skeleton. No error state (per spec).

import { type ReactNode } from "react";

import { cn } from "@/lib/cn";
import { useTranslation, type MessageKey } from "@/lib/i18n";
import { IcArrowDown, IcArrowUp, IcBubble, IcChart, IcEye, IcHeart, IcNib } from "@/components/icons";
import { fmt } from "@/components/studio/FeedParts";
import type { Gran, StatBucket, StatPeriodKey } from "@/components/studio/stats-demo";

export const PERIODS: { key: StatPeriodKey; label: MessageKey; gran: Gran }[] = [
  { key: "today", label: "stats.period.today", gran: "hour" },
  { key: "yesterday", label: "stats.period.yesterday", gran: "hour" },
  { key: "7d", label: "stats.period.7d", gran: "day" },
  { key: "30d", label: "stats.period.30d", gran: "week" },
  { key: "90d", label: "stats.period.90d", gran: "week" },
  { key: "all", label: "stats.period.all", gran: "month" },
];

// ─────────────────────────────── RangeSeg ───────────────────────────────────
export function RangeSeg({ active, onChange }: { active: StatPeriodKey; onChange: (p: StatPeriodKey) => void }) {
  const { t } = useTranslation();
  return (
    <div role="tablist" aria-label="Time period" className="inline-flex max-w-full gap-[3px] overflow-x-auto rounded-md border border-border bg-surface-2 p-[3px]">
      {PERIODS.map((p) => {
        const on = active === p.key;
        return (
          <button
            key={p.key}
            role="tab"
            aria-selected={on}
            onClick={() => onChange(p.key)}
            className={cn(
              "h-8 whitespace-nowrap rounded-sm border px-3.5 text-small font-medium transition-colors",
              on ? "border-border bg-surface font-semibold text-text shadow-sm" : "border-transparent text-text-muted hover:text-text",
            )}
          >
            {t(p.label)}
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────── Delta chip ─────────────────────────────────
export function Delta({ pct }: { pct: number | null }) {
  const { t } = useTranslation();
  const r = pct === null ? null : Math.round(pct * 10) / 10;
  if (r === null) return <span className="inline-flex items-center gap-[3px] text-caption font-semibold text-text-subtle">{t("stats.delta_none")}</span>;
  if (Math.abs(r) < 0.1) return <span className="inline-flex items-center gap-[3px] text-caption font-semibold text-text-subtle">{t("stats.delta_flat")}</span>;
  const up = r > 0;
  return (
    <span className={cn("inline-flex items-center gap-[3px] whitespace-nowrap text-caption font-semibold tabular-nums", up ? "text-success" : "text-danger")}>
      {up ? <IcArrowUp size={12} /> : <IcArrowDown size={12} />}
      {Math.abs(r)}%
    </span>
  );
}

// ─────────────────────────────── SummaryCard ────────────────────────────────
export function SummaryCard({ Icon, labelKey, value, sub, pct }: { Icon: (p: { size?: number }) => ReactNode; labelKey: MessageKey; value: string; sub: string; pct: number | null }) {
  const { t } = useTranslation();
  return (
    <div className="rounded-lg border border-border bg-surface px-[18px] py-4 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="grid h-[26px] w-[26px] place-items-center rounded-sm border border-border bg-surface-2 text-text-muted">
          <Icon size={14} />
        </span>
        <span className="text-caption font-semibold uppercase tracking-[0.04em] text-text-subtle">{t(labelKey)}</span>
      </div>
      <div className="mt-3 text-h1 font-semibold tabular-nums leading-[1.1] tracking-[-0.015em]">{value}</div>
      <div className="mt-2 flex items-center justify-between gap-2.5">
        <span className="text-caption text-text-subtle">{sub}</span>
        <Delta pct={pct} />
      </div>
    </div>
  );
}

// ─────────────────────────────── ColumnChart ────────────────────────────────
export function ColumnChart({ cap, headline, headlinePct, series }: { cap: string; headline: string; headlinePct: number | null; series: StatBucket[] }) {
  const { t } = useTranslation();
  const max = Math.max(1, ...series.map((b) => b.value));
  const avg = series.length ? series.reduce((a, b) => a + b.value, 0) / series.length : 0;
  return (
    <section className="rounded-lg border border-border bg-surface px-5 pb-4 pt-[18px] shadow-sm">
      <div className="mb-[18px] flex items-start justify-between gap-4">
        <div>
          <div className="text-h3 font-semibold tracking-[-0.006em]">{t("stats.weekly_views_title")}</div>
          <div className="mt-[3px] text-caption text-text-subtle">{cap}</div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-h2 font-semibold tabular-nums tracking-[-0.01em]">{headline}</div>
          <div className="mt-1 flex justify-end">
            <Delta pct={headlinePct} />
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-[9px]">
        <div className="relative flex h-[150px] items-end gap-[7px]">
          {series.map((b, i) => {
            const above = b.value >= avg;
            return (
              <div key={i} className="flex h-full min-w-0 flex-1 items-end" title={`${b.label}: ${fmt(b.value)}`}>
                <div
                  className="w-full rounded-t-sm transition-[height]"
                  style={{
                    height: `${Math.max(3, (b.value / max) * 100)}%`,
                    backgroundColor: above ? "var(--color-accent)" : "color-mix(in srgb, var(--color-text) 18%, var(--color-surface-2))",
                  }}
                />
              </div>
            );
          })}
          {/* average line */}
          <div className="pointer-events-none absolute inset-x-0 flex items-center" style={{ bottom: `${(avg / max) * 100}%` }}>
            <div className="h-0 flex-1 border-t-[1.5px] border-dashed" style={{ borderColor: "color-mix(in srgb, var(--color-text) 42%, transparent)" }} />
            <span className="bg-surface px-[5px] text-caption text-text-subtle">
              {t("stats.avg_line")} {fmt(Math.round(avg))}
            </span>
          </div>
        </div>
        <div className="flex gap-[7px]">
          {series.map((b, i) => (
            <span key={i} className="min-w-0 flex-1 truncate text-center text-[0.6875rem] tabular-nums text-text-subtle max-[460px]:hidden">
              {b.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────── DistributionBars ───────────────────────────────
const TIER_META: { key: "viral" | "good" | "average" | "weak"; nameKey: MessageKey; subKey: MessageKey; color: string }[] = [
  { key: "viral", nameKey: "stats.tier_viral", subKey: "stats.tier_viral_sub", color: "var(--color-success)" },
  { key: "good", nameKey: "stats.tier_good", subKey: "stats.tier_good_sub", color: "var(--color-accent)" },
  { key: "average", nameKey: "stats.tier_mid", subKey: "stats.tier_mid_sub", color: "color-mix(in srgb, var(--color-text) 30%, var(--color-surface))" },
  { key: "weak", nameKey: "stats.tier_flop", subKey: "stats.tier_flop_sub", color: "color-mix(in srgb, var(--color-text) 15%, var(--color-surface))" },
];

export function DistributionBars({ cap, tiers }: { cap: string; tiers: { viral: number; good: number; average: number; weak: number } }) {
  const { t } = useTranslation();
  const total = tiers.viral + tiers.good + tiers.average + tiers.weak;
  const maxCount = Math.max(1, tiers.viral, tiers.good, tiers.average, tiers.weak);
  return (
    <section className="rounded-lg border border-border bg-surface px-5 pb-4 pt-[18px] shadow-sm">
      <div className="mb-[18px]">
        <div className="text-h3 font-semibold tracking-[-0.006em]">{t("stats.spread_title")}</div>
        <div className="mt-[3px] text-caption text-text-subtle">{cap}</div>
      </div>
      <div className="flex flex-col gap-3.5">
        {TIER_META.map((tm) => {
          const n = tiers[tm.key];
          const pct = total > 0 ? Math.round((n / total) * 100) : 0;
          return (
            <div key={tm.key} className="grid gap-[7px]">
              <div className="flex items-center justify-between gap-2.5">
                <span className="flex min-w-0 items-center gap-2 text-small text-text">
                  <span className="h-[9px] w-[9px] shrink-0 rounded-[3px]" style={{ backgroundColor: tm.color }} />
                  {t(tm.nameKey)}
                  <span className="truncate text-caption text-text-subtle">· {t(tm.subKey)}</span>
                </span>
                <span className="shrink-0 text-small font-semibold tabular-nums">
                  {n} {t("stats.posts_word")}
                  <span className="ml-1.5 font-normal text-text-subtle">{pct}%</span>
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full border border-border bg-surface-2">
                <div className="h-full rounded-full transition-[width]" style={{ width: `${(n / maxCount) * 100}%`, backgroundColor: tm.color }} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ───────────────────────────── empty / skeleton ─────────────────────────────
export function StatsEmpty() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center rounded-lg border border-dashed border-border bg-surface/50 px-7 py-16 text-center">
      <span className="mb-[18px] grid h-[54px] w-[54px] place-items-center rounded-lg border border-border bg-surface-2 text-text-subtle">
        <IcChart size={26} />
      </span>
      <h2 className="text-h2 font-semibold tracking-[-0.01em]">{t("stats.empty_title")}</h2>
      <p className="mt-2 max-w-[44ch] text-body leading-[1.55] text-text-muted">{t("stats.empty_sub")}</p>
      <div className="mt-[22px] flex gap-[22px] text-small text-text-subtle">
        <span>
          <b className="font-semibold text-text">1</b> {t("stats.empty_meta1")}
        </span>
        <span>
          <b className="font-semibold text-text">3</b> {t("stats.empty_meta2")}
        </span>
      </div>
    </div>
  );
}

function SkelCard() {
  return (
    <div className="rounded-lg border border-border bg-surface px-[18px] py-4 shadow-sm">
      <div className="skel h-3 w-20 rounded" />
      <div className="skel mt-3.5 h-7 w-[110px] rounded" />
      <div className="skel mt-3 h-2.5 w-full rounded" />
    </div>
  );
}

export function SkeletonDash() {
  return (
    <div className="flex flex-col gap-5" aria-hidden>
      <div className="grid grid-cols-4 gap-3.5 max-[760px]:grid-cols-2 max-[460px]:grid-cols-1">
        <SkelCard />
        <SkelCard />
        <SkelCard />
        <SkelCard />
      </div>
      <div className="rounded-lg border border-border bg-surface p-5 shadow-sm">
        <div className="skel mb-5 h-4 w-44 rounded" />
        <div className="skel h-[132px] w-full rounded-lg" />
      </div>
      <div className="grid grid-cols-2 gap-3.5 max-[760px]:grid-cols-1">
        <div className="rounded-lg border border-border bg-surface p-5 shadow-sm">
          <div className="skel mb-[18px] h-4 w-36 rounded" />
          <div className="skel h-[110px] w-full rounded-lg" />
        </div>
        <div className="rounded-lg border border-border bg-surface p-5 shadow-sm">
          <div className="skel mb-[18px] h-4 w-36 rounded" />
          <div className="skel h-[110px] w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// Card metadata for the page (icon + label + which metric).
export const STAT_CARDS: { Icon: (p: { size?: number }) => ReactNode; labelKey: MessageKey; metric: "posts" | "views" | "likes" | "comments" }[] = [
  { Icon: IcNib, labelKey: "stats.card_posts", metric: "posts" },
  { Icon: IcEye, labelKey: "stats.card_views", metric: "views" },
  { Icon: IcHeart, labelKey: "stats.card_likes", metric: "likes" },
  { Icon: IcBubble, labelKey: "stats.card_comments", metric: "comments" },
];
