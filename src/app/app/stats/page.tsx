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
import { useTranslation, type MessageKey } from "@/lib/i18n";
import type { StatsPeriod, StatsResponse } from "@/lib/types";

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

function bucketLabel(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()}.${d.getMonth() + 1}`;
}

function BarChart({ bars }: { bars: { label: string; value: number }[] }) {
  const max = Math.max(1, ...bars.map((b) => b.value));
  return (
    <div className="flex items-end gap-1.5">
      {bars.map((b, i) => (
        <div
          key={i}
          className="flex-1 flex flex-col items-center gap-1 group min-w-[8px]"
        >
          {/* Fixed-height track so the bar's % height has a definite base */}
          <div
            className="w-full h-32 flex items-end"
            title={`${b.label}: ${fmt(b.value)}`}
          >
            <div
              className="w-full rounded-t bg-zinc-800 dark:bg-zinc-200 transition-all"
              style={{
                height: `${(b.value / max) * 100}%`,
                minHeight: b.value > 0 ? "3px" : "0",
              }}
            />
          </div>
          <span className="text-[9px] text-zinc-400">{b.label}</span>
        </div>
      ))}
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
                <h2 className="text-sm font-semibold mb-4">
                  {t("stats.chart_avg_views")}
                </h2>
                <BarChart
                  bars={stats.series.map((b) => ({
                    label: bucketLabel(b.bucket_start),
                    value: b.avg_views,
                  }))}
                />
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
