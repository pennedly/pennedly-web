"use client";

// Stats (/app/stats) — aggregate analytics dashboard, rebuilt 1:1 to
// Stats-SPEC.html. Period segment (6 options) → 4 summary cards with deltas vs
// the prior equal period → one column chart (avg views/post vs a dashed average
// line) → tier distribution. Real fetchStats wiring preserved; a tester ?demo=1
// panel (dark/state/period) drives every state. No error state (per spec).

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { ApiError, clearTokens, fetchEngagement, fetchFollowers, fetchMe, fetchStats, getTokens, refreshStats } from "@/lib/api";
import { useSelectedAccountId } from "@/lib/account";
import { useTranslation, type MessageKey } from "@/lib/i18n";
import { AppTopbar, TopbarPill } from "@/components/AppTopbar";
import { BetaNotice } from "@/components/ui/beta-notice";
import { ErrorBanner } from "@/components/ui/error-banner";
import { Button } from "@/components/ui/button";
import { IcChart, IcReload } from "@/components/icons";
import { TweaksPanel, TweakSection, TweakToggle, TweakRadio, useTweaks } from "@/components/tweaks/TweaksPanel";
import { fmt } from "@/components/studio/FeedParts";
import {
  ColumnChart,
  DistributionBars,
  FollowerChart,
  HeatmapPanel,
  PERIODS,
  RangeSeg,
  SkeletonDash,
  STAT_CARDS,
  StatsNudge,
  SummaryCard,
  type TopPostRow,
  TopPostsPanel,
} from "@/components/studio/StatsParts";
import { ImportBanner, useActiveSyncStatus } from "@/components/studio/ImportBanner";
import { EngagementPanel, type EngagementState } from "@/components/studio/EngagementPanel";
import { ENGAGEMENT_DEMO, engagementThinHistory } from "@/components/studio/engagement-demo";
import { STATS_DEMO, STATS_TWEAK_DEFAULTS, type Gran, type StatBucket, type StatPeriodKey } from "@/components/studio/stats-demo";
import type { EngagementHistory, FollowerHistory, StatsResponse } from "@/lib/types";

const IS_DEV = process.env.NODE_ENV === "development";

// Demo follower-growth series (ascending) for the ?demo=1 review.
const DEMO_FOLLOWER_POINTS = Array.from({ length: 14 }, (_, i) => ({
  day: `2026-06-${String(i + 1).padStart(2, "0")}`,
  count: 1820 + i * 24 + (i % 3) * 9,
}));

// Demo best-time heatmap (?demo=1): evenings + weekends hottest, nights coolest —
// fills the whole grid so the colour range reads clearly.
const DEMO_HEATMAP = (() => {
  const blockBase = [4200, 9000, 16500, 2400]; // morning, day, evening, night
  const out: { weekday: number; block: number; posts: number; avg_views: number }[] = [];
  for (let block = 0; block < 4; block++)
    for (let wd = 1; wd <= 7; wd++) {
      const weekend = wd >= 6 ? 1.45 : 1;
      const wobble = 0.8 + (((wd * 7 + block * 3) % 5) * 0.1);
      out.push({ weekday: wd, block, posts: 2, avg_views: Math.round(blockBase[block] * weekend * wobble) });
    }
  return out;
})();

function pct(cur: number, prev: number | null | undefined): number | null {
  if (prev === null || prev === undefined || prev === 0) return null;
  return ((cur - prev) / prev) * 100;
}

function fmtBucket(iso: string, gran: Gran, locale: string, dense: boolean): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  if (gran === "hour") return d.toLocaleTimeString(locale, { hour: "numeric" });
  // 7d (≤8 bars) reads best as weekday names; 30d (dense) needs dates so the
  // repeating Mon…Sun pattern isn't ambiguous across weeks.
  if (gran === "day")
    return d.toLocaleDateString(locale, dense ? { month: "short", day: "numeric" } : { weekday: "short" });
  return d.toLocaleDateString(locale, { month: "short", day: "numeric" }); // week
}

// "Updated 5 minutes ago" — localized via Intl.RelativeTimeFormat; null →
// "not synced yet". Recomputed each render from refreshed_at (no live ticking).
function relTime(iso: string | null, locale: string, t: (k: MessageKey) => string): string {
  if (!iso) return t("stats.never_synced");
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return t("stats.never_synced");
  const diffSec = Math.round((then - Date.now()) / 1000); // negative = in the past
  const abs = Math.abs(diffSec);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const rel =
    abs < 60
      ? rtf.format(diffSec, "second")
      : abs < 3600
        ? rtf.format(Math.round(diffSec / 60), "minute")
        : abs < 86400
          ? rtf.format(Math.round(diffSec / 3600), "hour")
          : rtf.format(Math.round(diffSec / 86400), "day");
  return `${t("stats.updated_prefix")} ${rel}`;
}

export default function StatsPage() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const [demoParam] = useState(() => (typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("demo") === "1" : false));
  const [isTester, setIsTester] = useState(false);
  const allow = demoParam && (IS_DEV || isTester);
  const demoOn = allow;
  const accountId = useSelectedAccountId();

  // Backfill state for the active account (drives the import banner + the
  // first-run nudge wording). Disabled in demo — that path is prop-driven.
  const sync = useActiveSyncStatus(!demoOn);

  const [period, setPeriod] = useState<StatPeriodKey>("7d");
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [followers, setFollowers] = useState<FollowerHistory | null>(null);
  // Engagement panel: its own fetch (days=365 ONCE — the panel derives 30/90/1y
  // client-side) with its own loading/error lifecycle, independent of the
  // period selector and fail-soft so it never blocks the dashboard.
  const [engagement, setEngagement] = useState<EngagementHistory | null>(null);
  const [engStatus, setEngStatus] = useState<"loading" | "ready" | "error">("loading");
  const [loading, setLoading] = useState(true);
  const [bootError, setBootError] = useState<string | null>(null);
  // Bumped by the ErrorBanner's «Повторить» — re-runs the stats load after a
  // real fetch failure (B5: the raw String(e) box had no way back, and the
  // screen stuck on account/period switch).
  const [reloadKey, setReloadKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const autoDone = useRef<number | null>(null);

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
    setBootError(null);
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
  }, [accountId, period, router, demoParam, reloadKey]);

  // Follower-growth line — independent of `period` (the endpoint returns the
  // full series), fetched once per account, fail-soft so it never blocks the
  // dashboard if the insight is unavailable.
  useEffect(() => {
    if (demoParam || accountId === null) return;
    fetchFollowers(accountId)
      .then(setFollowers)
      .catch(() => setFollowers(null));
  }, [accountId, demoParam]);

  // Engagement series — fetched once per account at the full window (days=365);
  // the panel slices 30/90/1y locally. Tracks its own error state so the panel
  // can show its Retry tile without affecting the rest of the dashboard.
  const loadEngagement = useCallback(async () => {
    if (accountId === null) return;
    setEngStatus("loading");
    try {
      setEngagement(await fetchEngagement(accountId));
      setEngStatus("ready");
    } catch {
      setEngStatus("error");
    }
  }, [accountId]);

  useEffect(() => {
    if (demoParam || accountId === null) return;
    void loadEngagement();
  }, [accountId, demoParam, loadEngagement]);

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

  // ── on-demand refresh of ALL metrics (post views/likes/reposts/comments +
  // follower count) — the Refresh button + an auto-pull when the screen opens.
  const reload = useCallback(async () => {
    if (accountId === null) return;
    const [s, f, e] = await Promise.allSettled([
      fetchStats(accountId, { period }),
      fetchFollowers(accountId),
      fetchEngagement(accountId),
    ]);
    if (s.status === "fulfilled") setStats(s.value);
    if (f.status === "fulfilled") setFollowers(f.value);
    if (e.status === "fulfilled") {
      setEngagement(e.value);
      setEngStatus("ready");
    }
  }, [accountId, period]);

  const doRefresh = useCallback(
    async (force: boolean) => {
      if (demoParam || accountId === null) return;
      setRefreshing(true);
      try {
        const r = await refreshStats(accountId, force);
        if (r.refreshed) await reload(); // pulled fresh data → re-read it
      } catch {
        /* fail-soft — keep showing the data we already have */
      } finally {
        setRefreshing(false);
      }
    },
    [accountId, demoParam, reload],
  );

  // Auto-refresh once when the screen opens for an account. The server throttles
  // (a recently-synced account is a no-op), and the ref guards against re-pulling
  // on every period change / re-render; re-opening the same account won't re-pull.
  useEffect(() => {
    if (demoParam || accountId === null) return;
    if (autoDone.current === accountId) return;
    autoDone.current = accountId;
    void doRefresh(false);
  }, [accountId, demoParam, doRefresh]);

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
        top: d.top.map<TopPostRow>((p) => ({ text: p.text, dateISO: p.dateISO, views: p.views, likes: p.likes, comments: p.comments, vs: p.vs, url: p.url })),
        heatmap: DEMO_HEATMAP,
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
      series: stats.series.map<StatBucket>((b) => ({ label: fmtBucket(b.bucket_start, gran, locale, stats.series.length > 8), value: b.avg_views })),
      tiers: { viral: c.tier_counts.viral, good: c.tier_counts.good, average: c.tier_counts.mid, weak: c.tier_counts.flop },
      top: (stats.top_posts ?? []).map<TopPostRow>((p) => ({ text: p.text, dateISO: p.published_at, views: p.views, likes: p.likes, comments: p.comments, vs: p.vs_avg, url: p.threads_url })),
      heatmap: stats.heatmap ?? [],
    };
  }, [demoOn, period, stats, gran, locale]);

  // No more all-or-nothing "come back in two weeks" wall (First-Run-SPEC §3):
  // once a model exists we always render the four real summary cards (even at
  // zero) + a warm nudge. The only non-ready phase is `loading` (skeleton). The
  // demo "Empty" tweak now previews the progressive zero / first-run state.
  const phase: "loading" | "ready" =
    demoOn ? (feedState === "Loading" ? "loading" : loading ? "loading" : "ready") : loading ? "loading" : !model ? "loading" : "ready";

  // First-run = a freshly-connected account with no posts in the window yet, OR
  // the demo "Empty" state. Drives the warm nudge (vs the normal full page).
  const isFirstRun = demoOn ? feedState === "Empty" : !!model && model.current.posts === 0;
  // While the active account's history is still importing, the nudge says so;
  // otherwise it's the "you're all set up" first-step prompt.
  const importing = !demoOn && sync.status === "importing";

  function onPeriod(p: StatPeriodKey) {
    setPeriod(p);
    if (demoOn) setTw("period", p);
    else {
      setLoading(true);
    }
  }

  if (bootError) {
    // Friendly §3.8 error state with a real Retry — never the raw String(e)
    // («ApiError: 500 …») transport dump (B5).
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <ErrorBanner onRetry={() => setReloadKey((k) => k + 1)} />
      </main>
    );
  }

  const cardSub = (metric: string): string => {
    if (!model) return "";
    const { posts, views, likes, comments } = model.current;
    // First-run with zero posts: the cards are still real (all 0), so we say so
    // plainly ("no posts yet" / "since you connected") instead of a fake avg or
    // the deleted wall — First-Run-SPEC §3.3.
    if (isFirstRun && posts === 0) {
      return metric === "posts" ? t("backfill.card_since_connect") : t("backfill.card_no_posts");
    }
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
  const GRAN_KEY: Record<Gran, MessageKey> = { hour: "stats.g_hour", day: "stats.g_day", week: "stats.g_week" };
  const granWord = t(GRAN_KEY[gran]);
  const chartCap = `${t("stats.cap_per")} ${granWord} · ${periodLabel}`;
  const tierCap = `${model?.current.posts ?? 0} ${t("stats.posts_word")} ${t("stats.spread_cap")} · ${periodLabel}`;

  // ── honest empty-states (First-Run-SPEC §4) ──
  // Viral tiers: "Calculating…" until a baseline exists — first-run, or a real
  // account whose posts haven't formed a tier spread yet.
  const tiersTotal = model ? model.tiers.viral + model.tiers.good + model.tiers.average + model.tiers.weak : 0;
  const tiersCalculating = !demoOn && (isFirstRun || tiersTotal === 0);
  // Follower count locked: the endpoint answered but has no count for us (below
  // the ~100-follower threshold Threads gates analytics behind). `followers ===
  // null` is a fetch failure, not a lock, so it falls through to "collecting".
  const followerLocked = !demoOn && followers !== null && followers.latest === null && followers.points.length === 0;

  // ── Engagement panel state ──
  // Demo: driven by the Tweaks "Engagement" radio. Live: loading → error → (thin
  // when the series is still building, ≤8 real days) → populated. "Thin" mirrors
  // the follower "collecting" idea: a fresh account whose daily series hasn't
  // accrued enough points for an honest line yet.
  const engReal = engagement?.points.filter((p) => p.views > 0 || p.likes > 0 || p.replies > 0 || p.reposts > 0 || p.quotes > 0).length ?? 0;
  let engState: EngagementState;
  let engData: EngagementHistory | null;
  if (demoOn) {
    const e = tw.engagement as "Loading" | "Populated" | "Thin" | "Error";
    engState = e === "Populated" ? "ready" : (e.toLowerCase() as EngagementState);
    engData = e === "Thin" ? engagementThinHistory(5) : ENGAGEMENT_DEMO;
  } else {
    engState = engStatus === "loading" ? "loading" : engStatus === "error" ? "error" : engReal > 0 && engReal <= 8 ? "thin" : "ready";
    engData = engagement;
  }
  const engagementPanel = (
    <EngagementPanel data={engData} state={engState} onRetry={demoOn ? undefined : loadEngagement} />
  );

  return (
    <div className="min-h-screen bg-bg text-text">
      <AppTopbar
        maxW="960px"
        title={t("stats.title")}
        pill={
          <TopbarPill tone="accent" icon={<IcChart size={13} />}>
            {refreshing
              ? t("stats.refreshing")
              : relTime(demoOn ? new Date().toISOString() : (stats?.refreshed_at ?? null), locale, t)}
          </TopbarPill>
        }
        actions={
          <Button
            size="sm"
            variant="secondary"
            icon={<IcReload size={14} />}
            loading={refreshing}
            onClick={() => doRefresh(true)}
            aria-label={t("stats.refresh")}
          >
            <span className="max-sm:hidden">{t("stats.refresh")}</span>
          </Button>
        }
      />
      <main className="mx-auto flex max-w-[960px] flex-col gap-4 px-3.5 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-4 md:gap-5 md:px-6 md:pb-24 md:pt-7">
        {/* Import banner — top of the content column while the active account is
            still backfilling its history. Removed (renders null) once resolved. */}
        {!demoOn && <ImportBanner status={sync.status} summary={sync.summary} />}
        <div className="flex flex-wrap items-end justify-between gap-4 max-md:gap-3">
          <div className="flex flex-col gap-1">
            <h1 className="text-h1 font-semibold tracking-[-0.015em]">{t("stats.title")}</h1>
            <p className="text-body text-text-muted">{t("stats.subtitle")}</p>
          </div>
          {/* Hidden during loading and the first-run progressive state — First-
              Run-SPEC.html §3.2's progressivePage() has no period row (banner →
              cards → nudge → follower panel → spread, nothing else), since a
              fresh account has no trend to slice by period yet. Shown once the
              normal ready page (real trending data) renders. */}
          {phase === "ready" && model && !isFirstRun && <RangeSeg active={period} onChange={onPeriod} />}
        </div>

        {/* Beta disclaimer — same Threads-API likes limitation as the Feed (SPEC §14);
            the summary tiles include likes, so warn here too. Remove post Meta review. */}
        <BetaNotice />

        {phase === "loading" ? (
          <SkeletonDash />
        ) : model && isFirstRun ? (
          // ── Progressive first-run (First-Run-SPEC §3): the four REAL summary
          // cards (even at zero) + a warm nudge + the honest follower / viral
          // states. No "come back in two weeks" wall, no heavy trend/top/best
          // panels until there's data to trend.
          <>
            <div className="grid gap-3.5 max-md:grid-cols-3 md:grid-cols-4">
              {STAT_CARDS.map((c) => (
                <SummaryCard key={c.metric} Icon={c.Icon} labelKey={c.labelKey} value={cardValue(c.metric)} sub={cardSub(c.metric)} pct={cardPct(c.metric)} hero={c.metric === "views"} />
              ))}
            </div>
            <StatsNudge importing={importing} onOpenStudio={importing ? undefined : () => router.push("/app")} />
            <div className="flex flex-col gap-1.5">
              <FollowerChart
                cap={t("stats.followers_title")}
                points={followers?.points ?? []}
                locked={followerLocked}
                currentCount={followers?.latest ?? null}
              />
              <p className="px-1 text-caption leading-relaxed text-text-subtle">{t("stats.since_connect_note")}</p>
            </div>
            {engagementPanel}
            <DistributionBars cap={tierCap} tiers={model.tiers} calculating={tiersCalculating} />
          </>
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
            <div className="flex flex-col gap-1.5">
              <FollowerChart
                cap={t("stats.followers_title")}
                points={demoOn ? DEMO_FOLLOWER_POINTS : (followers?.points ?? [])}
                locked={followerLocked}
                currentCount={followers?.latest ?? null}
              />
              <p className="px-1 text-caption leading-relaxed text-text-subtle">{t("stats.since_connect_note")}</p>
            </div>
            {engagementPanel}
            {model.top.length > 0 && <TopPostsPanel cap={`${t("stats.top_cap")} · ${periodLabel}`} rows={model.top} />}
            {period !== "today" && period !== "yesterday" && model.heatmap.length > 0 && (
              <HeatmapPanel cap={`${t("stats.heat_sub")} · ${periodLabel}`} cells={model.heatmap} />
            )}
            <DistributionBars cap={tierCap} tiers={model.tiers} calculating={tiersCalculating} />
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
          <TweakRadio label="Engagement" value={tw.engagement} options={["Loading", "Populated", "Thin", "Error"]} onChange={(v) => setTw("engagement", v)} />
        </TweaksPanel>
      )}
    </div>
  );
}
