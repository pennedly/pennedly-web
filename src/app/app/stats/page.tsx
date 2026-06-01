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
import { useLocale, useTranslation } from "@/lib/i18n";
import { AppTopbar } from "@/components/AppTopbar";
import { Skeleton } from "@/components/ui/feedback";
import { cn } from "@/lib/cn";
import {
  IcArrowDown,
  IcArrowUp,
  IcBubble,
  IcChart,
  IcEye,
  IcHeart,
  IcNib,
} from "@/components/icons";
import type { StatsBucket, StatsResponse } from "@/lib/types";

const RANGES = [4, 8, 12] as const;

// 22400 -> "22.4K", 1205 -> "1,205" (we keep <10k exact).
function sfmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 10_000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return Math.round(n).toLocaleString();
}

// % change, null when the base is non-positive (matches the backend's _pct).
function pct(cur: number, prev: number): number | null {
  if (prev <= 0) return null;
  return Math.round(((cur - prev) / prev) * 100 * 10) / 10;
}

// A week-bucket's start date as a short "16 Mar" / "Mar 16" label.
function weekLabel(iso: string, locale: string): string {
  const loc = locale === "ru" ? "ru-RU" : locale === "en" ? "en-US" : locale;
  return new Date(iso).toLocaleDateString(loc, { day: "numeric", month: "short" });
}

export default function StatsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const locale = useLocale();
  const accountId = useSelectedAccountId();
  const [range, setRange] = useState<(typeof RANGES)[number]>(8);
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
        setStats(await fetchStats(accountId, { weeks: range }));
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
  }, [accountId, range, router]);

  const cur = stats?.current ?? null;
  const deltas = stats?.deltas ?? null;
  const series = stats?.series ?? [];
  const last = series[series.length - 1];
  const prev = series[series.length - 2];
  const weeksUnit = t("stats.weeks_unit");

  const cards = cur
    ? [
        {
          icon: <IcNib size={14} />,
          label: t("stats.card_posts"),
          num: sfmt(cur.posts),
          sub: `${(cur.posts / range).toFixed(1)} ${t("stats.sub_per_week")}`,
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
  const lastRange = `${t("stats.cap_last")} ${range} ${weeksUnit}`;

  return (
    <div className="min-h-screen bg-bg text-text">
      <AppTopbar title={t("stats.title")} />
      <main className="mx-auto max-w-[928px] space-y-4 px-5 py-7 md:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <p className="text-small text-text-muted">{t("stats.subtitle")}</p>
          {loaded && cur && cur.posts > 0 && (
            <div
              role="tablist"
              aria-label={t("stats.title")}
              className="inline-flex shrink-0 gap-[3px] rounded-md border border-border bg-surface-2 p-[3px]"
            >
              {RANGES.map((r) => (
                <button
                  key={r}
                  role="tab"
                  aria-selected={range === r}
                  onClick={() => setRange(r)}
                  className={cn(
                    "h-8 rounded-sm border px-3.5 text-small font-medium whitespace-nowrap transition-colors",
                    range === r
                      ? "border-border bg-surface font-semibold text-text shadow-sm"
                      : "border-transparent text-text-muted hover:text-text",
                  )}
                >
                  {r} {weeksUnit}
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

            {/* average views per week — hero panel */}
            <Panel
              title={t("stats.weekly_views_title")}
              cap={`${t("stats.cap_avg_views")} · ${lastRange}`}
              headlineNum={last ? sfmt(last.avg_views) : undefined}
              headlineDelta={last && prev ? pct(last.avg_views, prev.avg_views) : null}
              flat={t("stats.delta_flat")}
            >
              <ColumnChart
                series={series}
                field="avg_views"
                locale={locale}
                fmtVal={sfmt}
              />
            </Panel>

            {/* posts per week + performance spread */}
            <div className="grid gap-3.5 md:grid-cols-2">
              <Panel
                title={t("stats.weekly_posts_title")}
                cap={`${t("stats.cap_cadence")} · ${lastRange}`}
                headlineNum={last ? String(last.posts) : undefined}
                headlineDelta={last && prev ? pct(last.posts, prev.posts) : null}
                flat={t("stats.delta_flat")}
              >
                <ColumnChart
                  series={series}
                  field="posts"
                  locale={locale}
                  fmtVal={(n) => `${n} ${t("stats.posts_word")}`}
                />
              </Panel>

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
            </div>
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

// Weekly column chart — one bar per bucket, last bar accented.
function ColumnChart({
  series,
  field,
  locale,
  fmtVal,
}: {
  series: StatsBucket[];
  field: "avg_views" | "posts";
  locale: string;
  fmtVal: (n: number) => string;
}) {
  const vals = series.map((b) => b[field]);
  const max = Math.max(1, ...vals);
  return (
    <div className="flex items-end gap-[7px]">
      {series.map((b, i) => {
        const v = b[field];
        const last = i === series.length - 1;
        return (
          <div
            key={b.bucket_start}
            className="flex min-w-0 flex-1 flex-col items-center gap-2"
            title={`${weekLabel(b.bucket_start, locale)}: ${fmtVal(v)}`}
          >
            <div className="flex h-[132px] w-full items-end">
              <div
                className="w-full rounded-t-sm transition-[height]"
                style={{
                  height: `${Math.max(4, (v / max) * 100)}%`,
                  // Opaque mix (not a low-alpha text colour) so the bar stays
                  // visible on the dark card too — matches the design's .colbar.
                  background: last
                    ? "var(--color-accent)"
                    : "color-mix(in srgb, var(--color-text) 16%, var(--color-surface-2))",
                }}
              />
            </div>
            <span
              className={cn(
                "whitespace-nowrap text-[0.6875rem] tabular-nums text-text-subtle",
                last && "font-semibold text-text-muted",
              )}
            >
              {weekLabel(b.bucket_start, locale)}
            </span>
          </div>
        );
      })}
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
