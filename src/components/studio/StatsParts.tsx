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

// Granularity matches the backend's gap-filled series: today/yesterday hourly,
// 7d/30d daily, 90d/all weekly. The chart axis is continuous (empty buckets are
// zero bars), so a quiet week still reads as a quiet week, not "two bars".
export const PERIODS: { key: StatPeriodKey; label: MessageKey; gran: Gran }[] = [
  { key: "today", label: "stats.period.today", gran: "hour" },
  { key: "yesterday", label: "stats.period.yesterday", gran: "hour" },
  { key: "7d", label: "stats.period.7d", gran: "day" },
  { key: "30d", label: "stats.period.30d", gran: "day" },
  { key: "90d", label: "stats.period.90d", gran: "week" },
  { key: "all", label: "stats.period.all", gran: "week" },
];

// ─────────────────────────────── RangeSeg ───────────────────────────────────
// Desktop (≥ md): a tight inline segmented row. Mobile (< md): full-width
// horizontally scrollable segmented row so all 6 fixed periods stay reachable
// with readable labels (the house scroll idiom + a right-edge mask fade).
export function RangeSeg({ active, onChange }: { active: StatPeriodKey; onChange: (p: StatPeriodKey) => void }) {
  const { t } = useTranslation();
  return (
    <div
      role="tablist"
      aria-label="Time period"
      className="inline-flex max-w-full gap-[3px] rounded-md border border-border bg-surface-2 p-[3px] [scrollbar-width:none] max-md:flex max-md:w-full max-md:flex-nowrap max-md:overflow-x-auto max-md:[mask-image:linear-gradient(90deg,#000_calc(100%-20px),transparent)] md:overflow-x-auto"
    >
      {PERIODS.map((p) => {
        const on = active === p.key;
        return (
          <button
            key={p.key}
            role="tab"
            aria-selected={on}
            onClick={() => onChange(p.key)}
            className={cn(
              "whitespace-nowrap rounded-sm border px-3.5 text-small font-medium transition-colors max-md:h-9 max-md:shrink-0 md:h-8",
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
// `hero` is the mobile-only Views card: it spans the full row at text-h1. The
// other three stack into a 3-up row and step their number down to text-h3 (never
// smaller) so they stay readable at 360px. Desktop (≥ md) is a flat 4-up grid —
// every card stays text-h1 there, so the desktop layout is unchanged.
export function SummaryCard({
  Icon,
  labelKey,
  value,
  sub,
  pct,
  hero = false,
}: {
  Icon: (p: { size?: number }) => ReactNode;
  labelKey: MessageKey;
  value: string;
  sub: string;
  pct: number | null;
  hero?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className={cn("rounded-lg border border-border bg-surface py-4 shadow-sm", hero ? "px-[18px] max-md:order-first max-md:col-span-3" : "px-[18px] max-md:px-3.5")}>
      <div className="flex items-center gap-2 max-md:gap-1.5">
        <span className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-sm border border-border bg-surface-2 text-text-muted">
          <Icon size={14} />
        </span>
        <span className="truncate text-caption font-semibold uppercase tracking-[0.04em] text-text-subtle">{t(labelKey)}</span>
      </div>
      <div className={cn("mt-3 font-semibold tabular-nums leading-[1.1] tracking-[-0.015em]", hero ? "text-h1" : "text-h3 md:text-h1")}>{value}</div>
      <div className="mt-2 flex items-center justify-between gap-2 max-md:flex-wrap md:gap-2.5">
        <span className="text-caption text-text-subtle">{sub}</span>
        <Delta pct={pct} />
      </div>
    </div>
  );
}

// ─────────────────────────────── ColumnChart ────────────────────────────────
// Average views per bucket. ≤ 8 buckets fill the panel width (bars flex:1 — the
// desktop behaviour, unchanged). > 8 buckets (e.g. 3 months = ~12 weeks) would
// crush into a smear on a phone, so the inner plot becomes width:max-content
// with fixed ~40px bars inside an overflow-x-auto wrapper and scrolls sideways;
// the dashed average line + above/below tinting + live (localized) bucket labels
// all travel with the bars. The switch is driven by the actual bucket count, not
// a CSS breakpoint, so desktop and mobile pick the same path for a given period.
export function ColumnChart({ cap, headline, headlinePct, series }: { cap: string; headline: string; headlinePct: number | null; series: StatBucket[] }) {
  const { t } = useTranslation();
  const max = Math.max(1, ...series.map((b) => b.value));
  // Average over the buckets that actually have posts — a gap-filled axis is
  // mostly zeros on a quiet account, and averaging those in would drag the
  // dashed "typical post" line down to near zero.
  const posted = series.filter((b) => b.value > 0);
  const avg = posted.length ? posted.reduce((a, b) => a + b.value, 0) / posted.length : 0;
  const wide = series.length > 8; // many buckets → fixed-width bars + horizontal scroll (mobile only)
  // With a dense axis (24 hours, 30 days) per-bar labels collide — show every
  // Nth so ~8 land; the rest keep an empty cell so the bars stay aligned, and
  // every bar's full label still shows on hover (the title attribute).
  const labelStride = Math.max(1, Math.ceil(series.length / 8));

  // Per-cell sizing. Default: bars fill (flex:1). When `wide`, the fill stays on
  // desktop (the 960px panel fits 12+ bars cleanly — byte-identical) but mobile
  // drops to fixed 40px bars so they scroll instead of crushing into a smear.
  const cellW = wide ? "max-md:w-10 max-md:shrink-0 md:min-w-0 md:flex-1" : "min-w-0 flex-1";

  const bars = (
    <div className="relative flex h-[150px] items-end gap-[7px]">
      {series.map((b, i) => {
        const above = b.value >= avg;
        return (
          <div key={i} className={cn("flex h-full items-end", cellW)} title={`${b.label}: ${fmt(b.value)}`}>
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
      {/* average line — absolute inside the plot, so in the mobile scroll case it
          spans the full max-content width and travels with the bars */}
      <div className="pointer-events-none absolute inset-x-0 flex items-center" style={{ bottom: `${(avg / max) * 100}%` }}>
        <div className="h-0 flex-1 border-t-[1.5px] border-dashed" style={{ borderColor: "color-mix(in srgb, var(--color-text) 42%, transparent)" }} />
        <span className="bg-surface px-[5px] text-caption text-text-subtle">
          {t("stats.avg_line")} {fmt(Math.round(avg))}
        </span>
      </div>
    </div>
  );

  const labels = (
    <div className="flex gap-[7px]">
      {series.map((b, i) => (
        // Live, localized text (never an image). Sparse on a dense axis so
        // labels don't collide; the empty cells keep the bars aligned, and the
        // shown label may overflow into its (blank) neighbours so a date like
        // "Jun 3" isn't truncated to "Ju…" in a 30px-wide daily cell.
        <span key={i} className={cn("overflow-visible whitespace-nowrap text-center text-[0.6875rem] tabular-nums text-text-subtle", cellW)}>
          {i % labelStride === 0 ? b.label : ""}
        </span>
      ))}
    </div>
  );

  // Non-wide periods keep the original markup exactly (no wrapper). Wide periods
  // get an overflow-x-auto wrapper whose inner plot is w-max on mobile (scrolls)
  // but full-width on desktop (fills, no scrollbar) — so desktop is unchanged.
  const plot =
    wide ? (
      <div className="[scrollbar-width:thin] max-md:overflow-x-auto">
        <div className="flex flex-col gap-[9px] max-md:w-max md:w-full">
          {bars}
          {labels}
        </div>
      </div>
    ) : (
      <div className="flex flex-col gap-[9px]">
        {bars}
        {labels}
      </div>
    );

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
      {plot}
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

// ─────────────────────────────── TopPostsPanel ──────────────────────────────
// "What worked" — the window's top posts by views, each with its metrics and
// the same "N× your average" verdict the feed uses. Rows link out to Threads
// when the post still has a URL.
export type TopPostRow = {
  text: string;
  dateISO: string;
  views: number;
  likes: number;
  comments: number;
  vs: number | null; // views ÷ window average; null when the average is 0
  url: string | null;
};

function vsLabel(vs: number): string {
  const v = Math.round(vs * 10) / 10;
  return `${v}×`;
}

export function TopPostsPanel({ cap, rows }: { cap: string; rows: TopPostRow[] }) {
  const { t, locale } = useTranslation();
  return (
    <section className="rounded-lg border border-border bg-surface px-5 pb-4 pt-[18px] shadow-sm">
      <div className="mb-2">
        <div className="text-h3 font-semibold tracking-[-0.006em]">{t("stats.top_title")}</div>
        <div className="mt-[3px] text-caption text-text-subtle">{cap}</div>
      </div>
      <div className="flex flex-col">
        {rows.map((r, i) => {
          const date = new Date(r.dateISO).toLocaleDateString(locale, { month: "short", day: "numeric" });
          const vsTone = r.vs === null ? "" : r.vs >= 1.5 ? "text-success" : r.vs >= 0.7 ? "text-text" : "text-text-subtle";
          const inner = (
            <>
              <span className="w-5 shrink-0 pt-px text-caption font-semibold tabular-nums text-text-subtle">{i + 1}</span>
              <span className="min-w-0 flex-1">
                <span className="line-clamp-2 text-small leading-snug text-text">{r.text}</span>
                <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-caption tabular-nums text-text-subtle">
                  <span>{date}</span>
                  <span className="inline-flex items-center gap-1"><IcEye size={12} /> {fmt(r.views)}</span>
                  <span className="inline-flex items-center gap-1"><IcHeart size={12} /> {fmt(r.likes)}</span>
                  <span className="inline-flex items-center gap-1"><IcBubble size={12} /> {fmt(r.comments)}</span>
                </span>
              </span>
              {r.vs !== null && (
                <span className="shrink-0 text-right">
                  <span className={cn("block text-h3 font-semibold tabular-nums leading-none", vsTone)}>{vsLabel(r.vs)}</span>
                  <span className="mt-1 block text-caption text-text-subtle">{t("feed.your_average")}</span>
                </span>
              )}
            </>
          );
          const rowCls = "flex items-start gap-3 border-t border-border py-3 first:border-t-0";
          return r.url ? (
            <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" className={cn(rowCls, "-mx-2 rounded-md px-2 transition-colors hover:bg-surface-2")}>
              {inner}
            </a>
          ) : (
            <div key={i} className={rowCls}>
              {inner}
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─────────────────────────────── BestTimesPanel ─────────────────────────────
// "When your posts land" — average views per post grouped by local publish
// hour and by weekday. The best slot (preferring slots with ≥2 posts, so one
// lucky post doesn't crown an hour) is tinted accent and named in a chip.
export type TimeSlotRow = { slot: number; posts: number; avg: number };

function bestOf(slots: TimeSlotRow[]): TimeSlotRow | null {
  const candidates = slots.filter((s) => s.posts >= 2);
  const pool = candidates.length ? candidates : slots.filter((s) => s.posts >= 1);
  if (!pool.length) return null;
  return pool.reduce((a, b) => (b.avg > a.avg ? b : a));
}

function TimeBars({
  heading,
  slots,
  labelFor,
  postsWord,
  bestWord,
}: {
  heading: string;
  slots: TimeSlotRow[];
  labelFor: (slot: number) => string;
  postsWord: string;
  bestWord: string;
}) {
  const max = Math.max(1, ...slots.map((s) => s.avg));
  const best = bestOf(slots);
  const many = slots.length > 8; // many bars → fixed width + horizontal scroll on mobile
  const cellW = many ? "max-md:w-9 max-md:shrink-0 md:min-w-0 md:flex-1" : "min-w-0 flex-1";
  const bars = (
    <div className={cn("flex gap-[7px]", many && "max-md:w-max")}>
      {slots.map((s) => {
        const isBest = best !== null && s.slot === best.slot && s.posts > 0;
        return (
          <div
            key={s.slot}
            className={cn("flex min-w-0 flex-col items-center gap-1.5", cellW)}
            title={`${labelFor(s.slot)}: ${fmt(Math.round(s.avg))} · ${s.posts} ${postsWord}`}
          >
            <div className="flex h-[96px] w-full items-end">
              <div
                className="w-full rounded-t-sm transition-[height]"
                style={{
                  height: s.posts ? `${Math.max(4, (s.avg / max) * 100)}%` : "2px",
                  backgroundColor: isBest
                    ? "var(--color-accent)"
                    : s.posts
                      ? "color-mix(in srgb, var(--color-text) 18%, var(--color-surface-2))"
                      : "color-mix(in srgb, var(--color-text) 7%, var(--color-surface-2))",
                }}
              />
            </div>
            <span className="w-full truncate text-center text-[0.6875rem] tabular-nums text-text-subtle">{labelFor(s.slot)}</span>
          </div>
        );
      })}
    </div>
  );
  return (
    <div className="min-w-0">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <span className="text-caption font-semibold uppercase tracking-[0.04em] text-text-subtle">{heading}</span>
        {best && (
          <span
            className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-caption font-semibold text-accent"
            style={{
              background: "color-mix(in srgb, var(--color-accent) 10%, var(--color-surface))",
              borderColor: "color-mix(in srgb, var(--color-accent) 26%, transparent)",
            }}
          >
            {bestWord} · {labelFor(best.slot)}
          </span>
        )}
      </div>
      {many ? <div className="[scrollbar-width:thin] max-md:overflow-x-auto">{bars}</div> : bars}
    </div>
  );
}

export function BestTimesPanel({ cap, byHour, byWeekday }: { cap: string; byHour: TimeSlotRow[]; byWeekday: TimeSlotRow[] }) {
  const { t, locale } = useTranslation();
  const hourLabel = (h: number) => new Date(2026, 0, 1, h).toLocaleTimeString(locale, { hour: "numeric" });
  // Jan 2024 starts on a Monday, so day-of-month = ISO weekday 1..7.
  const dayLabel = (d: number) => new Date(Date.UTC(2024, 0, d)).toLocaleDateString(locale, { weekday: "short", timeZone: "UTC" });
  // Weekdays always render the full Mon..Sun shape; empty days show a stub.
  const week: TimeSlotRow[] = Array.from({ length: 7 }, (_, i) => byWeekday.find((s) => s.slot === i + 1) ?? { slot: i + 1, posts: 0, avg: 0 });
  return (
    <section className="rounded-lg border border-border bg-surface px-5 pb-4 pt-[18px] shadow-sm">
      <div className="mb-[18px]">
        <div className="text-h3 font-semibold tracking-[-0.006em]">{t("stats.times_title")}</div>
        <div className="mt-[3px] text-caption text-text-subtle">{cap}</div>
      </div>
      <div className="grid gap-6 md:grid-cols-2 md:gap-8">
        <TimeBars heading={t("stats.by_hour")} slots={byHour} labelFor={hourLabel} postsWord={t("stats.posts_word")} bestWord={t("stats.best_chip")} />
        <TimeBars heading={t("stats.by_weekday")} slots={week} labelFor={dayLabel} postsWord={t("stats.posts_word")} bestWord={t("stats.best_chip")} />
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

function SkelCard({ hero = false }: { hero?: boolean }) {
  return (
    <div className={cn("rounded-lg border border-border bg-surface py-4 shadow-sm", hero ? "px-[18px] max-md:col-span-3 max-md:order-first" : "px-[18px] max-md:px-3.5")}>
      <div className="skel h-3 w-20 rounded max-md:w-12" />
      <div className={cn("skel mt-3.5 h-7 w-[110px] rounded", !hero && "max-md:h-6 max-md:w-16")} />
      <div className="skel mt-3 h-2.5 w-full rounded" />
    </div>
  );
}

export function SkeletonDash() {
  return (
    // Mirrors the ready layout so nothing reflows on load: mobile = a 3-col grid
    // with a full-width hero skel card + a 3-up row; desktop = a flat 4-up grid.
    <div className="flex flex-col gap-4 md:gap-5" aria-hidden>
      <div className="grid gap-3.5 max-md:grid-cols-3 md:grid-cols-4">
        <SkelCard />
        <SkelCard hero />
        <SkelCard />
        <SkelCard />
      </div>
      <div className="rounded-lg border border-border bg-surface p-5 shadow-sm">
        <div className="skel mb-5 h-4 w-44 rounded" />
        <div className="skel h-[132px] w-full rounded-lg" />
      </div>
      <div className="grid grid-cols-2 gap-3.5 max-md:grid-cols-1">
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
