"use client";

// Stats (/app/stats) — aggregate analytics dashboard, rebuilt 1:1 to
// Stats-SPEC.html. Period segment (6 options) → 4 summary cards with deltas vs
// the prior equal period → one column chart (avg views/post vs a dashed average
// line) → tier distribution. Real fetchStats wiring preserved; a tester ?demo=1
// panel (dark/state/period) drives every state. No error state (per spec).

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { ApiError, clearTokens, fetchMe, fetchStats, getTokens } from "@/lib/api";
import { useSelectedAccountId } from "@/lib/account";
import { useTranslation, type MessageKey } from "@/lib/i18n";
import { AppTopbar, TopbarPill } from "@/components/AppTopbar";
import { IcChart } from "@/components/icons";
import { TweaksPanel, TweakSection, TweakToggle, TweakRadio, useTweaks } from "@/components/tweaks/TweaksPanel";
import { fmt } from "@/components/studio/FeedParts";
import {
  ColumnChart,
  DistributionBars,
  PERIODS,
  RangeSeg,
  SkeletonDash,
  STAT_CARDS,
  StatsEmpty,
  SummaryCard,
} from "@/components/studio/StatsParts";
import { STATS_DEMO, STATS_TWEAK_DEFAULTS, type Gran, type StatBucket, type StatPeriodKey } from "@/components/studio/stats-demo";
import type { StatsResponse } from "@/lib/types";

const IS_DEV = process.env.NODE_ENV === "development";

function pct(cur: number, prev: number | null | undefined): number | null {
  if (prev === null || prev === undefined || prev === 0) return null;
  return ((cur - prev) / prev) * 100;
}

function fmtBucket(iso: string, gran: Gran, locale: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  if (gran === "hour") return d.toLocaleTimeString(locale, { hour: "numeric" });
  if (gran === "day") return d.toLocaleDateString(locale, { weekday: "short" });
  if (gran === "week") return d.toLocaleDateString(locale, { month: "short", day: "numeric" });
  return d.toLocaleDateString(locale, { month: "short" });
}

export default function StatsPage() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const [demoParam] = useState(() => (typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("demo") === "1" : false));
  const [isTester, setIsTester] = useState(false);
  const allow = demoParam && (IS_DEV || isTester);
  const demoOn = allow;
  const accountId = useSelectedAccountId();

  const [period, setPeriod] = useState<StatPeriodKey>("7d");
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [bootError, setBootError] = useState<string | null>(null);

  const [tw, setTw] = useTweaks(STATS_TWEAK_DEFAULTS);

  useEffect(() => {
    if (!getTokens()) return;
    fetchMe().then((m) => setIsTester(m.is_tester === true)).catch(() => {});
  }, []);

  // real load on period / account change
  useEffect(() => {
    if (demoParam) return;
    if (!getTokens()) {
      router.push("/app/login");
      return;
    }
    if (accountId === null) return;
    setLoading(true);
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
        setLoading(false);
      }
    })();
  }, [accountId, period, router, demoParam]);

  // demo: dark + sync period from tweak + brief loading on period change
  useEffect(() => {
    if (!demoOn) return;
    document.documentElement.classList.toggle("dark", !!tw.dark);
  }, [demoOn, tw.dark]);

  useEffect(() => {
    if (!demoOn) return;
    const p = tw.period as StatPeriodKey;
    setPeriod(p);
    setLoading(true);
    const id = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(id);
  }, [demoOn, tw.period]);

  const periodLabel = t(PERIODS.find((p) => p.key === period)?.label ?? "stats.period.7d");
  const gran: Gran = PERIODS.find((p) => p.key === period)?.gran ?? "day";

  const feedState = demoOn ? (tw.state as "Live" | "Loading" | "Empty") : "Live";

  // ── unified model (real or demo) ──
  const model = useMemo(() => {
    if (demoOn) {
      const d = STATS_DEMO[period];
      return {
        current: d.current,
        deltas: {
          posts_pct: pct(d.current.posts, d.prev?.posts),
          views_pct: pct(d.current.views, d.prev?.views),
          likes_pct: pct(d.current.likes, d.prev?.likes),
          comments_pct: pct(d.current.comments, d.prev?.comments),
        },
        series: d.series,
        tiers: d.tiers,
      };
    }
    if (!stats) return null;
    const c = stats.current;
    return {
      current: { posts: c.posts, views: c.views, likes: c.likes, comments: c.comments },
      deltas: {
        posts_pct: stats.deltas?.posts_pct ?? null,
        views_pct: stats.deltas?.views_pct ?? null,
        likes_pct: stats.deltas?.likes_pct ?? null,
        comments_pct: stats.deltas?.comments_pct ?? null,
      },
      series: stats.series.map<StatBucket>((b) => ({ label: fmtBucket(b.bucket_start, gran, locale), value: b.avg_views })),
      tiers: { viral: c.tier_counts.viral, good: c.tier_counts.good, average: c.tier_counts.mid, weak: c.tier_counts.flop },
    };
  }, [demoOn, period, stats, gran, locale]);

  const phase: "loading" | "ready" | "empty" =
    demoOn ? (feedState === "Loading" ? "loading" : feedState === "Empty" ? "empty" : loading ? "loading" : "ready") : loading ? "loading" : !model || model.current.posts === 0 ? "empty" : "ready";

  function onPeriod(p: StatPeriodKey) {
    setPeriod(p);
    if (demoOn) setTw("period", p);
    else {
      setLoading(true);
    }
  }

  if (bootError) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <div className="rounded-lg border border-danger/40 bg-danger/10 p-4 text-small text-danger">{bootError}</div>
      </main>
    );
  }

  const cardSub = (metric: string): string => {
    if (!model) return "";
    const { posts, views, likes, comments } = model.current;
    if (metric === "posts") return `${t("stats.in_word")} ${periodLabel}`;
    if (metric === "views") return `${fmt(posts ? Math.round(views / posts) : 0)} ${t("stats.sub_per_post")}`;
    if (metric === "likes") return `${posts ? Math.round(likes / posts) : 0} ${t("stats.sub_per_post")}`;
    return `${posts ? (comments / posts).toFixed(1) : "0"} ${t("stats.sub_per_post")}`;
  };
  const cardValue = (metric: string): string => {
    if (!model) return "0";
    const c = model.current;
    if (metric === "posts") return String(c.posts);
    if (metric === "views") return fmt(c.views);
    if (metric === "likes") return fmt(c.likes);
    return String(c.comments);
  };
  const cardPct = (metric: string): number | null => {
    if (!model) return null;
    return model.deltas[`${metric}_pct` as keyof typeof model.deltas];
  };

  const avgViewsPerPost = model && model.current.posts ? Math.round(model.current.views / model.current.posts) : 0;
  const GRAN_KEY: Record<Gran, MessageKey> = { hour: "stats.g_hour", day: "stats.g_day", week: "stats.g_week", month: "stats.g_month" };
  const granWord = t(GRAN_KEY[gran]);
  const chartCap = `${t("stats.cap_per")} ${granWord} · ${periodLabel}`;
  const tierCap = `${model?.current.posts ?? 0} ${t("stats.posts_word")} ${t("stats.spread_cap")} · ${periodLabel}`;

  return (
    <div className="min-h-screen bg-bg text-text">
      <AppTopbar maxW="960px" title={t("stats.title")} pill={<TopbarPill tone="accent" icon={<IcChart size={13} />}>{t("stats.updated_daily")}</TopbarPill>} />
      <main className="mx-auto flex max-w-[960px] flex-col gap-4 px-3.5 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-4 md:gap-5 md:px-6 md:pb-24 md:pt-7">
        <div className="flex flex-wrap items-end justify-between gap-4 max-md:gap-3">
          <div className="flex flex-col gap-1">
            <h1 className="text-h1 font-semibold tracking-[-0.015em]">{t("stats.title")}</h1>
            <p className="text-body text-text-muted">{t("stats.subtitle")}</p>
          </div>
          {phase !== "empty" && <RangeSeg active={period} onChange={onPeriod} />}
        </div>

        {phase === "loading" ? (
          <SkeletonDash />
        ) : phase === "empty" ? (
          <StatsEmpty />
        ) : model ? (
          <>
            {/* Desktop: flat 4-up card grid (unchanged). Mobile: a 3-col grid
                where the Views card becomes a full-width hero on its own row
                (col-span-3 + order-first) and Posts/Likes/Replies form the 3-up
                row beneath it. */}
            <div className="grid gap-3.5 max-md:grid-cols-3 md:grid-cols-4">
              {STAT_CARDS.map((c) => (
                <SummaryCard key={c.metric} Icon={c.Icon} labelKey={c.labelKey} value={cardValue(c.metric)} sub={cardSub(c.metric)} pct={cardPct(c.metric)} hero={c.metric === "views"} />
              ))}
            </div>
            <ColumnChart cap={chartCap} headline={fmt(avgViewsPerPost)} headlinePct={model.deltas.views_pct} series={model.series} />
            <DistributionBars cap={tierCap} tiers={model.tiers} />
          </>
        ) : null}
      </main>

      {allow && (
        <TweaksPanel title="Stats">
          <TweakSection label="Appearance" />
          <TweakToggle label="Dark mode" value={tw.dark} onChange={(v) => setTw("dark", v)} />
          <TweakSection label="Data" />
          <TweakRadio label="Period" value={tw.period} options={["today", "yesterday", "7d", "30d", "90d", "all"]} onChange={(v) => setTw("period", v)} />
          <TweakRadio label="State" value={tw.state} options={["Live", "Loading", "Empty"]} onChange={(v) => setTw("state", v)} />
        </TweaksPanel>
      )}
    </div>
  );
}
