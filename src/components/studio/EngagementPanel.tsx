"use client";

// Engagement panel (/app/stats) — the sibling of FollowerChart, built 1:1 to
// Engagement-SPEC.html / Engagement-Mobile-SPEC.html. A per-day time series of
// one selected metric (Views · Likes · Replies · Reposts · Quotes) over a chosen
// window (30d / 90d / 1y, default 90d), plus the account-wide lifetime totals.
//
// Pure presentational component: the live page and the ?demo=1 / gallery reviews
// feed it the same `EngagementHistory`, so they render identical pixels. The
// parent fetches days=365 ONCE and passes it in; range + metric are derived here
// client-side, so switching either is instant (no refetch).
//
// Two deliberate differences from FollowerChart's line:
//   • 0-based Y with a faint floor rule (NOT min–max) — a per-day metric belongs
//     on the floor, so a sparse-then-real series reads "empty then real", never a
//     fake plateau (SPEC §2.3 honesty rule).
//   • a per-point hover tooltip (weekday + date / value) via invisible hover
//     bands + a cursor line + hover dot, with sparse x-axis labels.

import { smoothAreaPath, smoothLinePath } from "@/lib/chart";
import { useMemo, useState, type ReactNode } from "react";

import { cn } from "@/lib/cn";
import { pluralUnit, useTranslation, type LocaleCode, type MessageKey } from "@/lib/i18n";
import { IcAlert, IcChart, IcEye, IcHeart, IcQuote, IcRefresh, IcReply, IcRepeat } from "@/components/icons";
import { fmt } from "@/components/studio/FeedParts";
import type { EngagementHistory, EngagementMetric, EngagementPoint } from "@/lib/types";

export type EngagementState = "loading" | "ready" | "thin" | "error";

// ── metric + range metadata ──────────────────────────────────────────────────
const METRICS: { key: EngagementMetric; labelKey: MessageKey; Icon: (p: { size?: number }) => ReactNode }[] = [
  { key: "views", labelKey: "stats.eng_views", Icon: IcEye },
  { key: "likes", labelKey: "stats.eng_likes", Icon: IcHeart },
  { key: "replies", labelKey: "stats.eng_replies", Icon: IcReply },
  { key: "reposts", labelKey: "stats.eng_reposts", Icon: IcRepeat },
  { key: "quotes", labelKey: "stats.eng_quotes", Icon: IcQuote },
];

export type EngagementRange = 30 | 90 | 365;
const RANGES: { days: EngagementRange; labelKey: MessageKey; windowKey: MessageKey }[] = [
  { days: 30, labelKey: "stats.eng_range_30", windowKey: "stats.eng_window_30" },
  { days: 90, labelKey: "stats.eng_range_90", windowKey: "stats.eng_window_90" },
  { days: 365, labelKey: "stats.eng_range_1y", windowKey: "stats.eng_window_1y" },
];

function metricValue(p: EngagementPoint, m: EngagementMetric): number {
  return p[m];
}

// "Thin data" = a fresh account whose history is still building. We treat ≤ this
// many real points as thin (the SPEC's honest "building daily" case).
const THIN_MAX_DAYS = 8;

// ── public panel ─────────────────────────────────────────────────────────────
export function EngagementPanel({
  data,
  state = "ready",
  initialMetric = "views",
  initialRange = 90,
  onRetry,
}: {
  data: EngagementHistory | null;
  state?: EngagementState;
  initialMetric?: EngagementMetric;
  initialRange?: EngagementRange;
  onRetry?: () => void;
}) {
  const { t, locale } = useTranslation();
  const [metric, setMetric] = useState<EngagementMetric>(initialMetric);
  const [range, setRange] = useState<EngagementRange>(initialRange);

  if (state === "loading") return <EngagementSkeleton />;

  const rangeMeta = RANGES.find((r) => r.days === range) ?? RANGES[1];
  const metricLabel = t(METRICS.find((m) => m.key === metric)!.labelKey);
  // Subtitle: "<Metric> · per day · <window>".
  const sub = `${metricLabel} · ${t("stats.eng_per_day")} · ${t(rangeMeta.windowKey)}`;

  return (
    <section className="rounded-lg border border-border bg-surface px-5 pb-4 pt-[18px] shadow-sm">
      {/* Header — caption + subtitle left, range control right (wraps under on a
          tight phone, per the mobile spec). */}
      <div className="mb-3.5 flex flex-wrap items-start justify-between gap-x-4 gap-y-2.5">
        <div className="min-w-0">
          <div className="text-h3 font-semibold tracking-[-0.006em]">{t("stats.eng_title")}</div>
          <div className="mt-[3px] text-caption text-text-subtle">{sub}</div>
        </div>
        <RangeControl active={range} onChange={setRange} />
      </div>

      {/* Metric selector — always present (even in error) so the panel keeps its
          shape and place in the stack. */}
      <MetricSelector active={metric} onChange={setMetric} />

      {state === "error" ? (
        <EngagementError onRetry={onRetry} />
      ) : state === "thin" ? (
        <ThinData data={data} metric={metric} locale={locale} />
      ) : (
        <ChartArea data={data} metric={metric} metricLabel={metricLabel} range={range} rangeMeta={rangeMeta} locale={locale} />
      )}

      <LifetimeTiles data={data} />
    </section>
  );
}

// ── metric selector (.emetric) ───────────────────────────────────────────────
function MetricSelector({ active, onChange }: { active: EngagementMetric; onChange: (m: EngagementMetric) => void }) {
  const { t } = useTranslation();
  return (
    <div
      role="tablist"
      aria-label={t("stats.eng_title")}
      className="flex gap-1 overflow-x-auto rounded-md border border-border bg-surface-2 p-1 [scrollbar-width:none]"
    >
      {METRICS.map((m) => {
        const on = active === m.key;
        const { Icon } = m;
        return (
          <button
            key={m.key}
            role="tab"
            aria-selected={on}
            onClick={() => onChange(m.key)}
            className={cn(
              "inline-flex h-[34px] min-w-max flex-1 items-center justify-center gap-[7px] whitespace-nowrap rounded-sm border px-3 text-small transition-colors",
              on ? "border-border bg-surface font-semibold text-text shadow-sm" : "border-transparent font-medium text-text-muted hover:text-text",
            )}
          >
            <Icon size={15} />
            <span className={on ? "text-accent" : undefined}>{t(m.labelKey)}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── range control (.erange) — same shell as RangeSeg, smaller, 3 options ──────
function RangeControl({ active, onChange }: { active: EngagementRange; onChange: (r: EngagementRange) => void }) {
  const { t } = useTranslation();
  return (
    <div role="tablist" aria-label={t("stats.eng_range_label")} className="inline-flex shrink-0 gap-[3px] rounded-md border border-border bg-surface-2 p-[3px]">
      {RANGES.map((r) => {
        const on = active === r.days;
        return (
          <button
            key={r.days}
            role="tab"
            aria-selected={on}
            onClick={() => onChange(r.days)}
            className={cn(
              "h-7 whitespace-nowrap rounded-sm border px-[11px] text-caption font-medium tabular-nums transition-colors",
              on ? "border-border bg-surface font-semibold text-text shadow-sm" : "border-transparent text-text-muted hover:text-text",
            )}
          >
            {t(r.labelKey)}
          </button>
        );
      })}
    </div>
  );
}

// ── chart area: headline + 0-based plot + tooltip + x-axis ────────────────────
function ChartArea({
  data,
  metric,
  metricLabel,
  range,
  rangeMeta,
  locale,
}: {
  data: EngagementHistory | null;
  metric: EngagementMetric;
  metricLabel: string;
  range: EngagementRange;
  rangeMeta: (typeof RANGES)[number];
  locale: string;
}) {
  const { t } = useTranslation();
  const points = data?.points ?? [];

  // The visible window = the last `range` days of the (continuous) series.
  const window = points.slice(-range);
  const prior = points.slice(-range * 2, -range); // the equal window immediately before

  const total = window.reduce((a, p) => a + metricValue(p, metric), 0);
  // Trend vs the previous equal window — only when a FULL prior window exists
  // within the 365-day series (30d→needs 60, 90d→needs 180; 1y has no full prior
  // year, so we gracefully omit the delta). A prior window that is all-zero
  // (sparse metric) reads as "no prior window" rather than a fake +∞.
  const haveFullPrior = prior.length >= range;
  const priorTotal = prior.reduce((a, p) => a + metricValue(p, metric), 0);
  const trendPct = haveFullPrior && priorTotal > 0 ? ((total - priorTotal) / priorTotal) * 100 : null;
  const noPrior = !haveFullPrior || priorTotal === 0;

  return (
    <div className="mt-3.5">
      {/* headline (.echart-hl) */}
      <div className="mb-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="text-caption font-medium uppercase tracking-[0.04em] text-text-subtle">{metricLabel}</div>
          <div className="mt-0.5 text-h1 font-semibold tabular-nums leading-[1.05] tracking-[-0.02em]">{fmt(total)}</div>
        </div>
        <div className="shrink-0 text-right">
          <EngTrend pct={trendPct} noPrior={noPrior} />
          <div className="mt-0.5 text-caption text-text-subtle">
            {range === 365 ? t("stats.eng_in_window").replace("{window}", t(rangeMeta.windowKey)) : t("stats.eng_vs_prev").replace("{window}", t(rangeMeta.windowKey))}
          </div>
        </div>
      </div>

      <EngChart window={window} metric={metric} metricLabel={metricLabel} locale={locale} />
    </div>
  );
}

// Headline trend chip: up = success, down = danger, flat = subtle, no prior
// window = subtle "no prior window".
function EngTrend({ pct, noPrior }: { pct: number | null; noPrior: boolean }) {
  const { t } = useTranslation();
  if (noPrior || pct === null) return <span className="text-caption font-semibold text-text-subtle">{t("stats.eng_no_prior")}</span>;
  const r = Math.round(pct * 10) / 10;
  if (Math.abs(r) < 0.1) return <span className="text-caption font-semibold text-text-subtle">{t("stats.delta_flat")}</span>;
  const up = r > 0;
  return (
    <span className={cn("inline-flex items-center gap-[3px] whitespace-nowrap text-small font-semibold tabular-nums", up ? "text-success" : "text-danger")}>
      {up ? "+" : ""}
      {r}%
    </span>
  );
}

// The 0-based line + soft area + latest dot + floor rule + hover bands/tooltip +
// sparse x-axis. SVG viewBox 0..100 with preserveAspectRatio:none + non-scaling
// stroke (the FollowerChart idiom); the floor/cursor/labels are HTML overlays so
// text never distorts with the horizontal stretch.
function EngChart({ window, metric, metricLabel, locale }: { window: EngagementPoint[]; metric: EngagementMetric; metricLabel: string; locale: string }) {
  const { t } = useTranslation();
  const [hover, setHover] = useState<number | null>(null);

  const n = window.length;
  const vals = window.map((p) => metricValue(p, metric));
  const max = Math.max(1, ...vals); // 0-based: floor is 0, ceiling is the window max
  const PADT = 8;
  const PADB = 4;
  const xAt = (i: number) => (n <= 1 ? 50 : (i / (n - 1)) * 100);
  const yAt = (v: number) => PADT + (1 - v / max) * (100 - PADT - PADB);
  const pts = window.map((p, i) => ({ x: xAt(i), y: yAt(metricValue(p, metric)) }));
  const line = smoothLinePath(pts);
  const area = line ? smoothAreaPath(pts, 100) : "";
  const floorY = yAt(0); // = 100 - PADB

  // Sparse x-axis: ~5 evenly-spaced labels incl. first + last, clamped to the
  // plot edges so the end dates never clip.
  const want = Math.min(5, n);
  const labelIdx: number[] = [];
  for (let i = 0; i < want; i++) labelIdx.push(Math.round((i * (n - 1)) / (want - 1 || 1)));

  const fmtDay = (iso: string, withWeekday: boolean) => {
    const d = new Date(`${iso}T00:00:00`);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(locale, withWeekday ? { weekday: "short", month: "short", day: "numeric" } : { month: "short", day: "numeric" });
  };

  const hp = hover !== null ? window[hover] : null;
  // Clamp the tooltip horizontally so it can't overflow the plot edges.
  const hoverX = hover !== null ? xAt(hover) : 0;
  const tipLeft = Math.min(88, Math.max(12, hoverX));

  return (
    <div className="flex flex-col gap-[11px]">
      <div className="relative h-[132px] md:h-[150px]" onMouseLeave={() => setHover(null)}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" width="100%" height="100%" role="img" aria-label={metricLabel} className="block overflow-visible">
          {/* faint floor rule on the 0 baseline (.echart-floor) */}
          <line
            x1="0"
            x2="100"
            y1={floorY}
            y2={floorY}
            stroke="color-mix(in srgb, var(--color-text) 14%, transparent)"
            strokeWidth="1"
            strokeDasharray="3 3"
            vectorEffect="non-scaling-stroke"
          />
          <path d={area} fill="var(--color-accent)" fillOpacity="0.12" />
          <path d={line} fill="none" stroke="var(--color-accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          {/* cursor line on hover */}
          {hp && (
            <line x1={hoverX} x2={hoverX} y1={PADT} y2={floorY} stroke="color-mix(in srgb, var(--color-text) 26%, transparent)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          )}
          {/* latest-point dot (.echart-dot) — drawn in a non-stretching overlay
              below so it stays a circle; here we only paint the line/area. */}
        </svg>

        {/* Latest-point dot + hover dot as HTML so they're perfect circles
            regardless of the SVG's horizontal stretch. */}
        {n > 0 && (
          <span
            className="pointer-events-none absolute h-[9px] w-[9px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent ring-[3px]"
            style={{ left: `${xAt(n - 1)}%`, top: `${yAt(vals[n - 1])}%`, ["--tw-ring-color" as string]: "color-mix(in srgb, var(--color-accent) 18%, transparent)" }}
            aria-hidden
          />
        )}
        {hp && (
          <span
            className="pointer-events-none absolute h-[8px] w-[8px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent ring-2 ring-surface"
            style={{ left: `${hoverX}%`, top: `${yAt(metricValue(hp, metric))}%` }}
            aria-hidden
          />
        )}

        {/* equal-width invisible hover bands (.echart-bands) */}
        <div className="absolute inset-0 flex">
          {window.map((_, i) => (
            <button
              key={i}
              type="button"
              tabIndex={-1}
              aria-hidden
              className="h-full flex-1 cursor-default focus:outline-none"
              onMouseEnter={() => setHover(i)}
              onMouseDown={() => setHover(i)}
            />
          ))}
        </div>

        {/* tooltip (.echart-tip) — bg text / color bg, clamped so it never clips */}
        {hp && (
          <div
            className="pointer-events-none absolute -translate-x-1/2 whitespace-nowrap rounded-md bg-text px-2.5 py-1.5 text-center shadow-md"
            style={{ left: `${tipLeft}%`, top: yAt(metricValue(hp, metric)) > 40 ? "4px" : undefined, bottom: yAt(metricValue(hp, metric)) <= 40 ? "8px" : undefined }}
          >
            <div className="text-[0.6875rem] font-medium leading-tight text-bg/70">{fmtDay(hp.day, true)}</div>
            <div className="text-small font-semibold tabular-nums leading-tight text-bg">{fmt(metricValue(hp, metric))}</div>
          </div>
        )}
      </div>

      {/* sparse x-axis labels (.echart-xaxis) — first/last clamp to the edges */}
      <div className="relative block h-[14px]">
        {labelIdx.map((i) => {
          const at = xAt(i);
          const isFirst = i === 0;
          const isLast = i === n - 1;
          return (
            <span
              key={i}
              className={cn("absolute whitespace-nowrap text-[0.6875rem] tabular-nums text-text-subtle", isFirst ? "left-0" : isLast ? "right-0" : "-translate-x-1/2")}
              style={isFirst || isLast ? undefined : { left: `${at}%` }}
            >
              {fmtDay(window[i]?.day ?? "", false)}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ── thin-data: honest "building daily" (.echart-thin) ─────────────────────────
function ThinData({ data, metric, locale }: { data: EngagementHistory | null; metric: EngagementMetric; locale: string }) {
  const { t } = useTranslation();
  const points = data?.points ?? [];
  const realDays = points.length;
  const vals = points.map((p) => metricValue(p, metric));
  const max = Math.max(1, ...vals);

  // The few real points anchored LEFT over the real days only; the rest of the
  // plot is a hatched "still building" texture — never a fake flat line.
  const realFrac = 0.34; // the real days occupy the left ~third of the plot
  const xAt = (i: number) => (realDays <= 1 ? 4 : (i / (realDays - 1)) * realFrac * 100);
  const PADT = 8;
  const PADB = 4;
  const yAt = (v: number) => PADT + (1 - v / max) * (100 - PADT - PADB);
  const line = smoothLinePath(points.map((p, i) => ({ x: xAt(i), y: yAt(metricValue(p, metric)) })));

  const daysWord = pluralUnit(locale as LocaleCode, "days", realDays);
  const note = t("stats.eng_thin_note").replace("{days}", `${realDays} ${daysWord}`);

  return (
    <div className="mt-3.5">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="text-caption font-medium uppercase tracking-[0.04em] text-text-subtle">{t(METRICS.find((m) => m.key === metric)!.labelKey)}</div>
          <div className="mt-0.5 text-h1 font-semibold tabular-nums leading-[1.05] tracking-[-0.02em]">{fmt(vals.reduce((a, b) => a + b, 0))}</div>
        </div>
        <span className="shrink-0 text-caption font-semibold text-text-subtle">{t("stats.eng_no_prior")}</span>
      </div>

      <div className="relative h-[132px] overflow-hidden rounded-md border border-dashed border-border md:h-[150px]" style={{ background: "color-mix(in srgb, var(--color-surface-2) 45%, transparent)" }}>
        {/* hatched "history still building" texture (.echart-thin-grid) */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "repeating-linear-gradient(135deg, color-mix(in srgb, var(--color-text) 6%, transparent) 0 1px, transparent 1px 9px)",
          }}
          aria-hidden
        />
        {/* the few real points as a short accent line + dots, anchored left */}
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" width="100%" height="100%" className="absolute inset-0 block" aria-hidden>
          <path d={line} fill="none" stroke="var(--color-accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>
        {points.map((p, i) => (
          <span key={i} className="absolute h-[7px] w-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent" style={{ left: `${xAt(i)}%`, top: `${yAt(metricValue(p, metric))}%` }} aria-hidden />
        ))}
      </div>

      {/* footnote strip (.echart-thin-note) */}
      <div className="mt-2.5 inline-flex items-center gap-2 text-caption text-text-subtle">
        <IcChart size={14} className="opacity-70" />
        <span>{note}</span>
      </div>
    </div>
  );
}

// ── error + retry (.echart-error) ─────────────────────────────────────────────
function EngagementError({ onRetry }: { onRetry?: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="mt-3.5 flex h-[150px] flex-col items-center justify-center gap-2.5 rounded-md border border-dashed border-border px-5 text-center">
      <span
        className="grid h-[42px] w-[42px] place-items-center rounded-md"
        style={{
          background: "color-mix(in srgb, var(--color-danger) 12%, transparent)",
          border: "1px solid color-mix(in srgb, var(--color-danger) 28%, transparent)",
          color: "var(--color-danger)",
        }}
      >
        <IcAlert size={20} />
      </span>
      <span className="text-small font-medium text-text">{t("stats.eng_err_title")}</span>
      <span className="max-w-[40ch] text-caption leading-[1.5] text-text-subtle">{t("stats.eng_err_sub")}</span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-1 inline-flex items-center gap-[7px] rounded-md border border-border bg-surface px-3 py-1.5 text-small font-medium text-text transition-colors hover:bg-surface-2"
        >
          <IcRefresh size={14} /> {t("stats.eng_retry")}
        </button>
      )}
    </div>
  );
}

// ── lifetime tiles (.elife) ───────────────────────────────────────────────────
const LIFE: { key: "likes" | "replies" | "reposts" | "quotes"; labelKey: MessageKey; Icon: (p: { size?: number }) => ReactNode }[] = [
  { key: "likes", labelKey: "stats.eng_likes", Icon: IcHeart },
  { key: "replies", labelKey: "stats.eng_replies", Icon: IcReply },
  { key: "reposts", labelKey: "stats.eng_reposts", Icon: IcRepeat },
  { key: "quotes", labelKey: "stats.eng_quotes", Icon: IcQuote },
];

function LifetimeTiles({ data }: { data: EngagementHistory | null }) {
  const { t } = useTranslation();
  return (
    <div className="mt-[18px] border-t border-border pt-4">
      <div className="mb-2.5 text-caption font-semibold uppercase tracking-[0.06em] text-text-subtle">{t("stats.eng_lifetime")}</div>
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
        {LIFE.map((l) => {
          const v = data ? data[l.key] : null;
          const { Icon } = l;
          return (
            <div key={l.key} className="rounded-md border border-border bg-surface-2 px-[13px] py-3">
              <div className="flex items-center gap-1.5 text-text-muted">
                <Icon size={14} />
                <span className="truncate text-caption font-medium uppercase tracking-[0.03em] text-text-subtle">{t(l.labelKey)}</span>
              </div>
              <div className={cn("mt-1.5 text-h3 font-semibold tabular-nums tracking-[-0.006em]", v === null && "text-text-subtle")}>
                {v === null ? "—" : fmt(v)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── loading skeleton — mirrors the ready layout so nothing reflows ────────────
function EngagementSkeleton() {
  return (
    <section className="rounded-lg border border-border bg-surface px-5 pb-4 pt-[18px] shadow-sm" aria-hidden>
      <div className="mb-3.5 flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="skel h-4 w-28 rounded" />
          <span className="skel h-3 w-40 rounded" />
        </div>
        <span className="skel h-7 w-[132px] rounded-md" />
      </div>
      <span className="skel block h-[34px] w-full rounded-md" />
      <div className="mt-3.5 mb-3 flex items-end justify-between">
        <div className="flex flex-col gap-1.5">
          <span className="skel h-3 w-12 rounded" />
          <span className="skel h-8 w-24 rounded" />
        </div>
        <span className="skel h-4 w-16 rounded" />
      </div>
      <span className="skel block h-[132px] w-full rounded-md md:h-[150px]" />
      <div className="mt-[18px] border-t border-border pt-4">
        <span className="skel mb-2.5 block h-3 w-24 rounded" />
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="skel block h-[58px] rounded-md" />
          ))}
        </div>
      </div>
    </section>
  );
}
