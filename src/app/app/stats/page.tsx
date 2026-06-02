"use client";

// Statistics — the aggregate-performance dashboard. Pick a range (4 / 8 / 12
// weeks); see weekly summary cards (totals + per-post / per-week averages, each
// vs the previous equal span), two weekly column charts (avg views/week, posts/
// week), and the viral-tier distribution. Charts are hand-rolled CSS (no chart
// dependency). Reads GET /accounts/{id}/stats?weeks=N. Layout per
// design-export/PennedlyDesign/stats-*.

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { ApiError, clearTokens, fetchStats, getTokens } from "@/lib/api";
import { useSelectedAccountId } from "@/lib/account";
import { useLocale, useTranslation, type MessageKey } from "@/lib/i18n";
import { AppTopbar, TopbarPill } from "@/components/AppTopbar";
import { Skeleton } from "@/components/ui/feedback";
import { cn } from "@/lib/cn";
import {
  IcArrowDown,
  IcArrowUp,
  IcBubble,
  IcChart,
  IcClock,
  IcEye,
  IcHeart,
  IcNib,
} from "@/components/icons";
import type { StatsBucket, StatsPeriod, StatsResponse } from "@/lib/types";

// Q19: six backend periods instead of the 4/8/12-week ranges. Each carries its
// trend-chart bucket granularity (today/yesterday show a per-POST breakdown).
const PERIODS: { key: StatsPeriod; labelKey: MessageKey; gran: Gran }[] = [
  { key: "today", labelKey: "stats.period.today", gran: "post" },
  { key: "yesterday", labelKey: "stats.period.yesterday", gran: "post" },
  { key: "7d", labelKey: "stats.period.7d", gran: "day" },
  { key: "30d", labelKey: "stats.period.30d", gran: "week" },
  { key: "90d", labelKey: "stats.period.90d", gran: "week" },
  { key: "all", labelKey: "stats.period.all", gran: "month" },
];
type Gran = "post" | "day" | "week" | "month";

// 22400 -> "22.4K", 1205 -> "1,205" (we keep <10k exact).
function sfmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 10_000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return Math.round(n).toLocaleString();
}

// A bucket's label, by granularity: per-post snippet (today/yesterday), weekday
// (day), "16 Mar" (week), month (month). Localized.
function fmtBucket(b: StatsBucket, gran: Gran, locale: string): string {
  if (gran === "post") return b.label ?? "";
  const loc = locale === "ru" ? "ru-RU" : locale === "en" ? "en-US" : locale;
  const d = new Date(b.bucket_start);
  if (gran === "day") return d.toLocaleDateString(loc, { weekday: "short" });
  if (gran === "week") return d.toLocaleDateString(loc, { day: "numeric", month: "short" });
  return d.toLocaleDateString(loc, { month: "short" });
}

export default function StatsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const locale = useLocale();
  const accountId = useSelectedAccountId();
  const [period, setPeriod] = useState<StatsPeriod>("7d");
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);

  useEffect(() => {
    if (!getTokens()) router.push("/app/login");
  }, [router]);

  useEffect(() => {
    if (accountId === null) return;
    setLoaded(false);
    (async () => {
      try {
        setStats(await fetchStats(accountId, { period }));
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          clearTokens();
          router.push("/app/login");
          return;
        }
        setBootError(String(e));
      } finally {
        setLoaded(true);
      }
    })();
  }, [accountId, period, router]);

  const cur = stats?.current ?? null;
  const deltas = stats?.deltas ?? null;
  const series = stats?.series ?? [];
  const activePeriod = PERIODS.find((p) => p.key === period) ?? PERIODS[2];
  const periodLabel = t(activePeriod.labelKey);

  const cards = cur
    ? [
        {
          icon: <IcNib size={14} />,
          label: t("stats.card_posts"),
          num: sfmt(cur.posts),
          sub: t("stats.sub_this_period"),
          delta: deltas?.posts_pct,
        },
        {
          icon: <IcEye size={14} />,
          label: t("stats.card_views"),
          num: sfmt(cur.views),
          sub: `${sfmt(cur.posts ? cur.views / cur.posts : 0)} ${t("stats.sub_per_post")}`,
          delta: deltas?.views_pct,
        },
        {
          icon: <IcHeart size={14} />,
          label: t("stats.card_likes"),
          num: sfmt(cur.likes),
          sub: `${Math.round(cur.posts ? cur.likes / cur.posts : 0)} ${t("stats.sub_per_post")}`,
          delta: deltas?.likes_pct,
        },
        {
          icon: <IcBubble size={14} />,
          label: t("stats.card_comments"),
          num: sfmt(cur.comments),
          sub: `${(cur.posts ? cur.comments / cur.posts : 0).toFixed(1)} ${t("stats.sub_per_post")}`,
          delta: deltas?.comments_pct,
        },
      ]
    : [];

  const tierRows = cur
    ? [
        { name: t("stats.tier_viral"), sub: t("stats.tier_viral_sub"), n: cur.tier_counts.viral, ramp: "var(--color-accent)" },
        { name: t("stats.tier_good"), sub: t("stats.tier_good_sub"), n: cur.tier_counts.good, ramp: "color-mix(in srgb, var(--color-text) 52%, var(--color-surface))" },
        { name: t("stats.tier_mid"), sub: t("stats.tier_mid_sub"), n: cur.tier_counts.mid, ramp: "color-mix(in srgb, var(--color-text) 32%, var(--color-surface))" },
        { name: t("stats.tier_flop"), sub: t("stats.tier_flop_sub"), n: cur.tier_counts.flop, ramp: "color-mix(in srgb, var(--color-text) 16%, var(--color-surface))" },
      ]
    : [];
  const tierTotal = tierRows.reduce((a, r) => a + r.n, 0);
  const tierMax = Math.max(1, ...tierRows.map((r) => r.n));

  return (
    <div className="min-h-screen bg-bg text-text">
      <AppTopbar
        maxW="928px"
        title={t("stats.title")}
        pill={
          <TopbarPill icon={<IcClock size={13} className="text-text-subtle" />}>
            {t("stats.updated_hourly")}
          </TopbarPill>
        }
      />
      <main className="mx-auto max-w-[928px] space-y-4 px-5 py-7 md:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <p className="text-small text-text-muted">{t("stats.subtitle")}</p>
          {loaded && cur && cur.posts > 0 && (
            <div
              role="tablist"
              aria-label={t("stats.title")}
              className="flex max-w-full shrink-0 gap-[3px] overflow-x-auto rounded-md border border-border bg-surface-2 p-[3px]"
            >
              {PERIODS.map((p) => (
                <button
                  key={p.key}
                  role="tab"
                  aria-selected={period === p.key}
                  onClick={() => setPeriod(p.key)}
                  className={cn(
                    "h-8 shrink-0 rounded-sm border px-3 text-small font-medium whitespace-nowrap transition-colors",
                    period === p.key
                      ? "border-border bg-surface font-semibold text-text shadow-sm"
                      : "border-transparent text-text-muted hover:text-text",
                  )}
                >
                  {t(p.labelKey)}
                </button>
              ))}
            </div>
          )}
        </div>

        {bootError && (
          <div className="rounded-lg border border-danger/40 bg-danger/10 p-4 text-small text-danger">
            {bootError}
          </div>
        )}

        {!loaded && !bootError && <SkeletonDash />}

        {loaded && !bootError && cur && cur.posts === 0 && (
          <div className="flex flex-col items-center rounded-lg border border-dashed border-border px-7 py-16 text-center">
            <span className="mb-4 grid h-[54px] w-[54px] place-items-center rounded-lg border border-border bg-surface-2 text-text-subtle">
              <IcChart size={26} />
            </span>
            <p className="text-h2 font-semibold tracking-tight">{t("stats.empty_title")}</p>
            <p className="mt-2 max-w-[44ch] text-body leading-relaxed text-text-muted">
              {t("stats.empty")}
            </p>
          </div>
        )}

        {loaded && !bootError && cur && cur.posts > 0 && (
          <>
            {/* summary cards */}
            <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
              {cards.map((c) => (
                <div key={c.label} className="rounded-lg border border-border bg-surface p-4 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-sm border border-border bg-surface-2 text-text-muted">
                      {c.icon}
                    </span>
                    <span className="truncate text-caption font-semibold uppercase tracking-wide text-text-subtle">
                      {c.label}
                    </span>
                  </div>
                  <div className="mt-3 text-h1 font-semibold leading-[1.1] tracking-tight tabular-nums">
                    {c.num}
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2.5">
                    <span className="truncate text-caption text-text-subtle">{c.sub}</span>
                    <Delta pct={c.delta} flat={t("stats.delta_flat")} />
                  </div>
                </div>
              ))}
            </div>

            {/* Q12: one chart — average views per post, with a dashed period-
                average line + above/below bar coloring (Q39). The posts/week
                chart is gone; cadence lives in the cards' delta. */}
            <Panel
              title={t("stats.weekly_views_title")}
              cap={periodLabel}
              headlineNum={sfmt(cur.avg_views)}
              headlineDelta={deltas?.views_pct ?? null}
              flat={t("stats.delta_flat")}
            >
              <ColumnChart series={series} gran={activePeriod.gran} locale={locale} fmtVal={sfmt} />
            </Panel>

            {/* performance spread (full width) */}
            <Panel
                title={t("stats.spread_title")}
                cap={`${cur.posts} ${t("stats.posts_word")} ${t("stats.spread_cap")}`}
              >
                <div className="flex flex-col gap-3.5">
                  {tierRows.map((row) => {
                    const share = Math.round((row.n / (tierTotal || 1)) * 100);
                    return (
                      <div key={row.name} className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between gap-2.5">
                          <span className="flex min-w-0 items-center gap-2 whitespace-nowrap text-small text-text">
                            <span
                              className="h-[9px] w-[9px] shrink-0 rounded-[3px]"
                              style={{ background: row.ramp }}
                            />
                            {row.name}
                            <span className="truncate text-caption text-text-subtle">· {row.sub}</span>
                          </span>
                          <span className="whitespace-nowrap text-small font-semibold tabular-nums">
                            {row.n} {t("stats.posts_word")}
                            <span className="ml-1.5 font-normal text-text-subtle">{share}%</span>
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full border border-border bg-surface-2">
                          <div
                            className="h-full rounded-full transition-[width]"
                            style={{ width: `${(row.n / tierMax) * 100}%`, background: row.ramp }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Panel>
          </>
        )}
      </main>
    </div>
  );
}

// Delta chip — ↑green / ↓red / "no change". Renders nothing when pct is null
// (no prior data to compare).
function Delta({ pct, flat }: { pct: number | null | undefined; flat: string }) {
  if (pct === null || pct === undefined) return null;
  const r = Math.round(pct * 10) / 10;
  if (Math.abs(r) < 0.1)
    return <span className="text-caption font-semibold text-text-subtle">{flat}</span>;
  const up = r > 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-caption font-semibold tabular-nums",
        up ? "text-success" : "text-danger",
      )}
    >
      {up ? <IcArrowUp size={12} /> : <IcArrowDown size={12} />}
      {Math.abs(r)}%
    </span>
  );
}

// A titled card panel with an optional right-aligned headline (num + delta).
function Panel({
  title,
  cap,
  headlineNum,
  headlineDelta,
  flat,
  children,
}: {
  title: string;
  cap: string;
  headlineNum?: string;
  headlineDelta?: number | null;
  flat?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-surface p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-h3 font-semibold tracking-tight">{title}</h2>
          <p className="mt-0.5 text-caption text-text-subtle">{cap}</p>
        </div>
        {headlineNum !== undefined && (
          <div className="shrink-0 text-right">
            <div className="text-h2 font-semibold leading-[1.1] tracking-tight tabular-nums">
              {headlineNum}
            </div>
            {headlineDelta !== undefined && (
              <div className="mt-1 flex justify-end">
                <Delta pct={headlineDelta} flat={flat ?? ""} />
              </div>
            )}
          </div>
        )}
      </div>
      {children}
    </section>
  );
}

// Q39: average views per bucket — a dashed period-average line, bars colored
// above (success) / below (neutral) that average, localized labels by gran.
function ColumnChart({
  series,
  gran,
  locale,
  fmtVal,
}: {
  series: StatsBucket[];
  gran: Gran;
  locale: string;
  fmtVal: (n: number) => string;
}) {
  const { t } = useTranslation();
  const vals = series.map((b) => b.avg_views);
  const max = Math.max(1, ...vals);
  const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  const avgPct = (avg / max) * 100;
  return (
    <div>
      <div className="relative flex h-[140px] items-end gap-[7px]">
        {vals.length > 0 && (
          <div
            className="pointer-events-none absolute inset-x-0 z-[1] flex justify-end border-t border-dashed border-text-subtle/55"
            style={{ bottom: `${avgPct}%` }}
          >
            <span className="-translate-y-1/2 rounded-sm bg-bg px-1 text-caption tabular-nums text-text-subtle">
              {t("stats.avg_line")} {fmtVal(avg)}
            </span>
          </div>
        )}
        {series.map((b, i) => {
          const v = b.avg_views;
          const above = v >= avg;
          return (
            <div
              key={i}
              className="flex h-full min-w-0 flex-1 items-end"
              title={`${fmtBucket(b, gran, locale)}: ${fmtVal(v)}`}
            >
              <div
                className="w-full rounded-t-sm transition-[height]"
                style={{
                  height: `${Math.max(3, (v / max) * 100)}%`,
                  background: above
                    ? "var(--color-success)"
                    : "color-mix(in srgb, var(--color-text) 16%, var(--color-surface-2))",
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-[7px]">
        {series.map((b, i) => (
          <span
            key={i}
            className="min-w-0 flex-1 truncate text-center text-[0.6875rem] tabular-nums text-text-subtle"
          >
            {fmtBucket(b, gran, locale)}
          </span>
        ))}
      </div>
    </div>
  );
}

function SkeletonDash() {
  return (
    <>
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-surface p-4 shadow-sm">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-3.5 h-7 w-28 rounded-md" />
            <Skeleton className="mt-3 h-2.5 w-full" />
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-border bg-surface p-5 shadow-sm">
        <Skeleton className="mb-5 h-4 w-44" />
        <Skeleton className="h-[132px] w-full rounded-md" />
      </div>
      <div className="grid gap-3.5 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-surface p-5 shadow-sm">
            <Skeleton className="mb-4 h-4 w-36" />
            <Skeleton className="h-[110px] w-full rounded-md" />
          </div>
        ))}
      </div>
    </>
  );
}
