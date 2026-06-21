// Engagement demo data — drives the `?demo=1` Tweaks review and the dev-only
// /gallery/engagement page so every state / metric / range can be exercised with
// NO API. Shapes match lib/types `EngagementHistory`, so the demo and the live
// screen render the same pixels.
//
// Honesty model (matches Engagement-SPEC §1/§4): `views` is a full, real,
// backfilled day-series; per-day likes/replies/reposts/quotes are recent-only
// (older days truly 0) because the backend only stamps the lifetime totals onto
// today's row — see lib/types EngagementHistory. So a sparse-then-real series is
// the expected shape, not a bug.

import type { EngagementHistory, EngagementPoint } from "@/lib/types";

const DAY_MS = 86_400_000;

// ISO date N days back from a fixed "today" so the demo is deterministic.
const DEMO_TODAY = new Date(Date.UTC(2026, 5, 18)); // 2026-06-18
function isoDaysAgo(back: number): string {
  return new Date(DEMO_TODAY.getTime() - back * DAY_MS).toISOString().slice(0, 10);
}

// Smooth-ish pseudo-random walk so the Views line reads like real data (a base
// trend + bounded daily wobble), seeded per-metric for stable frames.
function seeded(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

// A full `count`-day Views series: gentle upward trend with day-to-day variance.
function viewsSeries(count: number, base: number, growth: number, seed: number): number[] {
  const rnd = seeded(seed);
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    const trend = base + growth * i;
    const wobble = 0.72 + rnd() * 0.56; // 0.72–1.28
    out.push(Math.max(0, Math.round(trend * wobble)));
  }
  return out;
}

// A recent-only series: the last `recent` days carry values, everything older is
// genuinely 0 — the "mostly-zero-then-real" honest case for likes/replies/etc.
function recentSeries(count: number, recent: number, peak: number, seed: number): number[] {
  const rnd = seeded(seed);
  const out: number[] = new Array(count).fill(0);
  const start = Math.max(0, count - recent);
  for (let i = start; i < count; i++) {
    const ramp = (i - start) / Math.max(1, recent - 1); // 0→1 over the recent stretch
    const wobble = 0.6 + rnd() * 0.8;
    out[i] = Math.max(0, Math.round(peak * (0.35 + 0.65 * ramp) * wobble));
  }
  return out;
}

// Build a full 365-day EngagementHistory the way the endpoint returns it: one
// point per day (oldest→newest), Views real across the whole window and the
// other four recent-only. `lifetime` carries the account-wide totals (or null).
function buildHistory(opts: { recentDays?: number; lifetimeNull?: boolean } = {}): EngagementHistory {
  const N = 365;
  const recent = opts.recentDays ?? 26;
  const views = viewsSeries(N, 14_000, 26, 101);
  const likes = recentSeries(N, recent, 540, 202);
  const replies = recentSeries(N, recent, 46, 303);
  const reposts = recentSeries(N, recent, 84, 404);
  const quotes = recentSeries(N, recent, 30, 505);
  const points: EngagementPoint[] = [];
  for (let i = 0; i < N; i++) {
    points.push({
      day: isoDaysAgo(N - 1 - i),
      views: views[i],
      likes: likes[i],
      replies: replies[i],
      reposts: reposts[i],
      quotes: quotes[i],
    });
  }
  return {
    points,
    likes: opts.lifetimeNull ? null : 142_000,
    replies: opts.lifetimeNull ? null : 8_400,
    reposts: opts.lifetimeNull ? null : 3_100,
    quotes: opts.lifetimeNull ? null : 1_200,
  };
}

// Populated history (the default review): full Views, recent-only others,
// real lifetime totals.
export const ENGAGEMENT_DEMO: EngagementHistory = buildHistory();

// Fresh-account history: only a handful of real days exist, lifetime totals are
// still null (no snapshot yet). The panel detects "thin" from the real-point
// count and renders the honest "building daily" treatment.
export function engagementThinHistory(realDays = 5): EngagementHistory {
  const points: EngagementPoint[] = [];
  const rnd = seeded(909);
  for (let i = 0; i < realDays; i++) {
    points.push({
      day: isoDaysAgo(realDays - 1 - i),
      views: Math.max(0, Math.round(2_400 + i * 380 * (0.7 + rnd() * 0.6))),
      likes: i >= realDays - 2 ? Math.round(40 + rnd() * 30) : 0,
      replies: i >= realDays - 1 ? Math.round(4 + rnd() * 5) : 0,
      reposts: 0,
      quotes: 0,
    });
  }
  return { points, likes: null, replies: null, reposts: null, quotes: null };
}
