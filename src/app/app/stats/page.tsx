"use client";

// Statistics — the analytics dashboard. Pick a period (today / yesterday /
// 7d / month / 3 months / all time); see totals + per-post averages + the
// viral-tier breakdown, each compared to the previous equal-length period
// (↑/↓ %), plus a trend bar chart over the period. Charts hand-rolled (CSS,
// no charting dependency). Reads GET /accounts/{id}/stats?period=.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ApiError, clearTokens, fetchStats, getTokens } from "@/lib/api";
import { useSelectedAccountId } from "@/lib/account";
import { useLocale, useTranslation, type MessageKey } from "@/lib/i18n";
import type { StatsBucket, StatsPeriod, StatsResponse } from "@/lib/types";

const PERIODS: StatsPeriod[] = ["today", "yesterday", "7d", "30d", "90d", "all"];

const PERIOD_LABEL: Record<StatsPeriod, MessageKey> = {
  today: "stats.period.today",
  yesterday: "stats.period.yesterday",
  "7d": "stats.period.7d",
  "30d": "stats.period.30d",
  "90d": "stats.period.90d",
  all: "stats.period.all",
};

function fmt(n: number): string {
  return Math.round(n).toLocaleString();
}

type Granularity = "day" | "week" | "month";

const GRANULARITY: Record<StatsPeriod, Granularity> = {
  today: "day",
  yesterday: "day",
  "7d": "day",
  "30d": "week",
  "90d": "week",
  all: "month",
};

// A human, localized label for a bucket's start date — month+year for
// monthly buckets, day+month otherwise.
function bucketLabel(iso: string, locale: string, gran: Granularity): string {
  const d = new Date(iso);
  const loc = locale === "ru" ? "ru-RU" : "en-US";
  if (gran === "month") {
    return d.toLocaleDateString(loc, { month: "short", year: "2-digit" });
  }
  return d.toLocaleDateString(loc, { day: "numeric", month: "short" });
}

// Trend chart: one bar per time bucket (avg views per post). A dashed line
// marks the period average; bars at/above it are highlighted (green) so
// you can see at a glance which periods beat your norm. Y-axis shows the
// scale; hover a bar for exact numbers. Hand-rolled (no chart library).
function TrendChart({
  series,
  locale,
  gran,
  t,
}: {
  series: StatsBucket[];
  locale: string;
  gran: Granularity;
  t: (k: MessageKey) => string;
}) {
  const values = series.map((b) => b.avg_views);
  const max = Math.max(1, ...values);
  const avg = values.reduce((a, b) => a + b, 0) / (values.length || 1);
  // Thin out x-labels when there are many buckets, so they don't overlap.
  const step = Math.ceil(series.length / 8);

  return (
    <div>
      <div className="flex gap-2">
        {/* Y-axis scale */}
        <div className="flex flex-col justify-between items-end h-32 w-9 shrink-0 text-[9px] text-zinc-400 tabular-nums">
          <span>{fmt(max)}</span>
          <span>0</span>
        </div>
        {/* Plot area: bars + average line overlay (same h-32 base) */}
        <div className="relative flex-1 h-32">
          <div
            className="absolute left-0 right-0 border-t border-dashed border-zinc-400/70 dark:border-zinc-500/70 z-10 pointer-events-none"
            style={{ bottom: `${(avg / max) * 100}%` }}
          >
            <span className="absolute right-0 -top-2.5 text-[9px] px-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 tabular-nums">
              {t("stats.chart_avg_line")} {fmt(avg)}
            </span>
          </div>
          <div className="absolute inset-0 flex items-end gap-1.5">
            {series.map((b, i) => {
              const aboveAvg = b.avg_views >= avg && b.avg_views > 0;
              return (
                <div
                  key={i}
                  className="flex-1 h-full flex items-end min-w-[6px]"
                  title={`${bucketLabel(b.bucket_start, locale, gran)} · ${fmt(
                    b.avg_views,
                  )} ${t("stats.card_avg_views")} · ${b.posts} ${t(
                    "stats.card_posts",
                  )}`}
                >
                  <div
                    className={`w-full rounded-t transition-all ${
                      aboveAvg
                        ? "bg-green-500 dark:bg-green-400"
                        : "bg-zinc-300 dark:bg-zinc-600"
                    }`}
                    style={{
                      height: `${(b.avg_views / max) * 100}%`,
                      minHeight: b.avg_views > 0 ? "3px" : "0",
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {/* X-axis date labels, aligned under the plot */}
      <div className="flex gap-2 mt-1">
        <div className="w-9 shrink-0" />
        <div className="flex-1 flex gap-1.5">
          {series.map((b, i) => (
            <div
              key={i}
              className="flex-1 min-w-[6px] text-center text-[9px] text-zinc-400 leading-tight overflow-hidden"
            >
              {i % step === 0 ? bucketLabel(b.bucket_start, locale, gran) : ""}
            </div>
          ))}
        </div>
      </div>
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-[10px] text-zinc-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-green-500 dark:bg-green-400" />
          {t("stats.chart_above_avg")}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-zinc-300 dark:bg-zinc-600" />
          {t("stats.chart_below_avg")}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block w-3.5 border-t border-dashed border-zinc-400" />
          {t("stats.chart_avg_line")}
        </span>
      </div>
    </div>
  );
}

const TIERS = [
  { key: "viral", color: "bg-green-500" },
  { key: "good", color: "bg-blue-500" },
  { key: "mid", color: "bg-amber-400" },
  { key: "flop", color: "bg-zinc-400" },
] as const;

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
        setStats(await fetchStats(accountId, period));
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

  function Delta({ pct }: { pct: number | null | undefined }) {
    if (pct === null || pct === undefined) return null;
    const up = pct >= 0;
    return (
      <p
        className={`text-xs mt-1 ${
          up
            ? "text-green-600 dark:text-green-400"
            : "text-red-600 dark:text-red-400"
        }`}
      >
        {up ? "↑" : "↓"} {Math.abs(pct)}% {t("stats.vs_prev")}
      </p>
    );
  }

  if (bootError) {
    return (
      <main className="max-w-2xl mx-auto px-6 py-16">
        <div className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-950 p-4 text-sm text-red-800 dark:text-red-200">
          {bootError}
        </div>
      </main>
    );
  }

  const cur = stats?.current;
  const deltas = stats?.deltas;
  const tierTotal = cur
    ? cur.tier_counts.viral +
      cur.tier_counts.good +
      cur.tier_counts.mid +
      cur.tier_counts.flop
    : 0;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("stats.title")}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">{t("stats.subtitle")}</p>
        </div>

        {/* Period selector */}
        <div className="flex flex-wrap gap-1 border-b border-zinc-200 dark:border-zinc-800 pb-px">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`relative px-3 py-1.5 text-sm whitespace-nowrap transition-colors ${
                period === p
                  ? "text-zinc-900 dark:text-zinc-100 font-medium"
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
            >
              {t(PERIOD_LABEL[p])}
              {period === p && (
                <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-zinc-900 dark:bg-zinc-100" />
              )}
            </button>
          ))}
        </div>

        {!loaded && <p className="text-sm text-zinc-500">{t("common.loading")}</p>}

        {loaded && cur && cur.posts === 0 && (
          <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 p-8 text-center">
            <p className="text-sm text-zinc-500">{t("stats.empty")}</p>
          </div>
        )}

        {loaded && cur && cur.posts > 0 && stats && (
          <>
            {/* Summary cards with vs-previous deltas */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm">
                <p className="text-xs text-zinc-500">{t("stats.card_posts")}</p>
                <p className="text-2xl font-semibold tracking-tight mt-1">
                  {fmt(cur.posts)}
                </p>
                <Delta pct={deltas?.posts_pct} />
              </div>
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm">
                <p className="text-xs text-zinc-500">{t("stats.card_views")}</p>
                <p className="text-2xl font-semibold tracking-tight mt-1">
                  {fmt(cur.views)}
                </p>
                <Delta pct={deltas?.views_pct} />
              </div>
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm">
                <p className="text-xs text-zinc-500">
                  {t("stats.card_avg_views")}
                </p>
                <p className="text-2xl font-semibold tracking-tight mt-1">
                  {fmt(cur.avg_views)}
                </p>
              </div>
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm">
                <p className="text-xs text-zinc-500">{t("stats.card_avg_likes")}</p>
                <p className="text-2xl font-semibold tracking-tight mt-1">
                  {fmt(cur.likes)}
                </p>
                <Delta pct={deltas?.likes_pct} />
              </div>
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm">
                <p className="text-xs text-zinc-500">
                  {t("stats.card_avg_comments")}
                </p>
                <p className="text-2xl font-semibold tracking-tight mt-1">
                  {fmt(cur.comments)}
                </p>
                <Delta pct={deltas?.comments_pct} />
              </div>
            </div>

            {/* Viral-tier distribution */}
            {tierTotal > 0 && (
              <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
                <h2 className="text-sm font-semibold mb-3">
                  {t("stats.tiers_title")}
                </h2>
                <div className="flex h-3 rounded-full overflow-hidden">
                  {TIERS.map((tier) => {
                    const n = cur.tier_counts[tier.key];
                    if (n === 0) return null;
                    return (
                      <div
                        key={tier.key}
                        className={tier.color}
                        style={{ width: `${(n / tierTotal) * 100}%` }}
                      />
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-4 mt-3 text-xs">
                  {TIERS.map((tier) => (
                    <span
                      key={tier.key}
                      className="inline-flex items-center gap-1.5"
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${tier.color}`} />
                      <span className="text-zinc-600 dark:text-zinc-400">
                        {t(`stats.tier_${tier.key}` as MessageKey)}
                      </span>
                      <span className="font-medium">
                        {cur.tier_counts[tier.key]}
                      </span>
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Trend chart */}
            {stats.series.length >= 2 && (
              <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
                <div className="flex items-baseline justify-between gap-2 mb-4">
                  <h2 className="text-sm font-semibold">
                    {t("stats.chart_avg_views")}
                  </h2>
                  <span className="text-xs text-zinc-400">
                    {t(`stats.gran_${GRANULARITY[period]}` as MessageKey)}
                  </span>
                </div>
                <TrendChart
                  series={stats.series}
                  locale={locale}
                  gran={GRANULARITY[period]}
                  t={t}
                />
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
