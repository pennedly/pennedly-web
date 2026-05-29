"use client";

// Statistics — the analytics dashboard. Summary cards (totals + averages
// + week-over-week), a viral-tier breakdown, and weekly trend bar charts.
// Charts are hand-rolled (CSS) to avoid a charting dependency. Reads
// GET /accounts/{id}/stats. Main tab.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ApiError, clearTokens, fetchStats, getTokens } from "@/lib/api";
import { useSelectedAccountId } from "@/lib/account";
import { useTranslation } from "@/lib/i18n";
import type { StatsResponse } from "@/lib/types";

function fmt(n: number): string {
  return Math.round(n).toLocaleString();
}

function weekLabel(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()}.${d.getMonth() + 1}`;
}

function StatCard({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="text-2xl font-semibold tracking-tight mt-1">{value}</p>
      {children}
    </div>
  );
}

function BarChart({ bars }: { bars: { label: string; value: number }[] }) {
  const max = Math.max(1, ...bars.map((b) => b.value));
  return (
    <div className="flex items-end gap-1.5 h-36">
      {bars.map((b, i) => (
        <div
          key={i}
          className="flex-1 flex flex-col items-center justify-end gap-1 group"
          title={`${b.label}: ${fmt(b.value)}`}
        >
          <span className="text-[9px] text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity">
            {fmt(b.value)}
          </span>
          <div
            className="w-full rounded-t bg-zinc-800 dark:bg-zinc-200"
            style={{
              height: `${(b.value / max) * 100}%`,
              minHeight: b.value > 0 ? "2px" : "0",
            }}
          />
          <span className="text-[9px] text-zinc-400">{b.label}</span>
        </div>
      ))}
    </div>
  );
}

const TIERS = [
  { key: "viral", color: "bg-green-500", text: "text-green-600 dark:text-green-400" },
  { key: "good", color: "bg-blue-500", text: "text-blue-600 dark:text-blue-400" },
  { key: "mid", color: "bg-amber-400", text: "text-amber-600 dark:text-amber-400" },
  { key: "flop", color: "bg-zinc-400", text: "text-zinc-500" },
] as const;

export default function StatsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const accountId = useSelectedAccountId();
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
        setStats(await fetchStats(accountId, 12));
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
  }, [accountId, router]);

  if (bootError) {
    return (
      <main className="max-w-2xl mx-auto px-6 py-16">
        <div className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-950 p-4 text-sm text-red-800 dark:text-red-200">
          {bootError}
        </div>
      </main>
    );
  }

  const summary = stats?.summary;
  const tierTotal = summary
    ? summary.tier_counts.viral +
      summary.tier_counts.good +
      summary.tier_counts.mid +
      summary.tier_counts.flop
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

        {!loaded && <p className="text-sm text-zinc-500">{t("common.loading")}</p>}

        {loaded && summary && summary.posts === 0 && (
          <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 p-8 text-center">
            <p className="text-sm text-zinc-500">{t("stats.empty")}</p>
          </div>
        )}

        {loaded && summary && summary.posts > 0 && stats && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <StatCard label={t("stats.card_posts")} value={fmt(summary.posts)} />
              <StatCard
                label={t("stats.card_views")}
                value={fmt(summary.total_views)}
              />
              <StatCard
                label={t("stats.card_avg_views")}
                value={fmt(summary.avg_views)}
              >
                {summary.wow_views_pct !== null && (
                  <p
                    className={`text-xs mt-1 ${
                      summary.wow_views_pct >= 0
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {summary.wow_views_pct >= 0 ? "↑" : "↓"}{" "}
                    {Math.abs(summary.wow_views_pct)}% {t("stats.vs_last_week")}
                  </p>
                )}
              </StatCard>
              <StatCard
                label={t("stats.card_avg_likes")}
                value={fmt(summary.avg_likes)}
              />
              <StatCard
                label={t("stats.card_avg_comments")}
                value={fmt(summary.avg_comments)}
              />
            </div>

            {/* Viral-tier distribution */}
            {tierTotal > 0 && (
              <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
                <h2 className="text-sm font-semibold mb-3">
                  {t("stats.tiers_title")}
                </h2>
                <div className="flex h-3 rounded-full overflow-hidden">
                  {TIERS.map((tier) => {
                    const n = summary.tier_counts[tier.key];
                    if (n === 0) return null;
                    return (
                      <div
                        key={tier.key}
                        className={tier.color}
                        style={{ width: `${(n / tierTotal) * 100}%` }}
                        title={`${t(`stats.tier_${tier.key}` as never)}: ${n}`}
                      />
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-4 mt-3 text-xs">
                  {TIERS.map((tier) => (
                    <span key={tier.key} className="inline-flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${tier.color}`} />
                      <span className="text-zinc-600 dark:text-zinc-400">
                        {t(`stats.tier_${tier.key}` as never)}
                      </span>
                      <span className="font-medium">
                        {summary.tier_counts[tier.key]}
                      </span>
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Weekly avg views */}
            <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
              <h2 className="text-sm font-semibold mb-4">
                {t("stats.weekly_views_title")}
              </h2>
              <BarChart
                bars={stats.weekly.map((w) => ({
                  label: weekLabel(w.week_start),
                  value: w.avg_views,
                }))}
              />
            </section>

            {/* Weekly post count */}
            <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
              <h2 className="text-sm font-semibold mb-4">
                {t("stats.weekly_posts_title")}
              </h2>
              <BarChart
                bars={stats.weekly.map((w) => ({
                  label: weekLabel(w.week_start),
                  value: w.posts,
                }))}
              />
            </section>
          </>
        )}
      </main>
    </div>
  );
}
