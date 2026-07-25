// Stats demo data — drives the `?demo=1` Tweaks review (tester-only) so every
// period / delta / chart / tier state can be exercised without the API. The
// live screen maps StatsResponse into the same shapes.

export type StatPeriodKey = "today" | "yesterday" | "7d" | "30d" | "90d" | "all";
export type Gran = "hour" | "day" | "week";

export type StatTotals = { posts: number; views: number; likes: number; comments: number };
export type StatBucket = { label: string; value: number }; // avg views per post in the bucket
// Stats-v2 panels: sample top posts (EN sample content, like the feed demo)
// and publish-time slots (hour 0-23 / ISO weekday 1-7).
export type DemoTopPost = {
  text: string;
  dateISO: string;
  views: number;
  likes: number;
  comments: number;
  vs: number | null; // views ÷ the window average
  url: string | null;
};
export type StatPeriodData = {
  gran: Gran;
  current: StatTotals;
  prev: StatTotals | null; // null → "no prior period" (All time)
  series: StatBucket[];
  tiers: { viral: number; good: number; average: number; weak: number };
  top: DemoTopPost[];
};

// Shared sample posts (Mara's voice) reused across periods at different scales.
const P1 = "Publish the thing you're slightly embarrassed by. The polished version is everyone's — the embarrassing one is yours.";
const P2 = "Nobody quits writing because it's hard. They quit because it's hard and nobody noticed.";
const P3 = "Your first hundred posts are the tuition. Stop grading them like they're the exam.";
const P4 = "Write the way you talk to one friend, not the way you present to a room.";
const P5 = "A draft a day isn't discipline. It's just lowering the price of starting.";

// ── gap-filled trend-series builders (demo only) ──────────────────────────
// The live screen formats labels from the backend's bucket_start; these bake
// equivalent EN labels + zero-filled gaps so the ?demo=1 review shows the same
// continuous axis (hourly / daily / weekly) the real data produces.
const hourLabel = (h: number) => new Date(2026, 0, 1, h).toLocaleTimeString("en-US", { hour: "numeric" });
const dateLabel = (m: number, d: number) => new Date(2026, m, d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
const hourly = (spikes: Record<number, number>, upto = 24): StatBucket[] =>
  Array.from({ length: upto }, (_, h) => ({ label: hourLabel(h), value: spikes[h] ?? 0 }));
const weekday = (values: number[]): StatBucket[] => {
  const W = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return values.map((v, i) => ({ label: W[i], value: v }));
};
const daily = (values: number[], m: number, d: number): StatBucket[] =>
  values.map((v, i) => { const dt = new Date(2026, m, d + i); return { label: dateLabel(dt.getMonth(), dt.getDate()), value: v }; });
const weekly = (values: number[], m: number, d: number): StatBucket[] =>
  values.map((v, i) => { const dt = new Date(2026, m, d + i * 7); return { label: dateLabel(dt.getMonth(), dt.getDate()), value: v }; });

// 30 daily values (May 12 → Jun 10), ~8 quiet days zero-filled.
const D30 = [12400, 0, 15200, 9800, 0, 17800, 11200, 14200, 0, 21000, 8600, 0, 16400, 12800, 19200, 0, 10400, 13600, 22600, 0, 9200, 15800, 0, 11000, 18400, 13200, 0, 16800, 20400, 14600];
// 13 weekly values (Mar 9 → Jun 1).
const W90 = [9800, 11200, 12600, 15400, 13800, 17200, 14600, 12000, 16800, 13200, 18400, 15600, 14200];
// 24 weekly values (Jan 6 → mid-Jun) — the account's whole life, two quiet opening weeks.
const WALL = [0, 4200, 6800, 7400, 8600, 9200, 0, 11400, 10800, 12800, 13600, 11200, 14200, 15800, 13200, 16400, 17800, 14600, 18200, 15400, 19600, 16800, 21000, 17400];

// Three tweaks (no account/density — see spec §6).
export const STATS_TWEAK_DEFAULTS = {
  dark: false,
  state: "Live", // Live | Loading | Empty
  period: "7d", // today | yesterday | 7d | 30d | 90d | all
  engagement: "Populated", // Loading | Populated | Thin | Error — the Engagement panel state
};

export const STATS_DEMO: Record<StatPeriodKey, StatPeriodData> = {
  today: {
    gran: "hour",
    current: { posts: 3, views: 42600, likes: 300, comments: 22 },
    prev: { posts: 3, views: 31000, likes: 230, comments: 18 },
    // 22 hours, not 24 — "today" is a partial day (live ends at the current hour).
    series: hourly({ 6: 8200, 9: 16400, 12: 11200, 15: 21800, 18: 13600, 21: 9400 }, 22),
    tiers: { viral: 1, good: 1, average: 1, weak: 0 },
    top: [
      { text: P1, dateISO: "2026-06-10T15:00:00Z", views: 21800, likes: 156, comments: 12, vs: 1.5, url: null },
      { text: P4, dateISO: "2026-06-10T09:00:00Z", views: 12600, likes: 98, comments: 7, vs: 0.9, url: null },
      { text: P5, dateISO: "2026-06-10T06:00:00Z", views: 8200, likes: 46, comments: 3, vs: 0.6, url: null },
    ],
  },
  yesterday: {
    gran: "hour",
    current: { posts: 2, views: 31000, likes: 240, comments: 17 },
    prev: { posts: 1, views: 12000, likes: 90, comments: 6 },
    series: hourly({ 7: 6400, 10: 12800, 13: 18200, 16: 9600, 19: 14400, 22: 7200 }),
    tiers: { viral: 0, good: 1, average: 1, weak: 0 },
    top: [
      { text: P2, dateISO: "2026-06-09T13:00:00Z", views: 18200, likes: 142, comments: 11, vs: 1.2, url: null },
      { text: P3, dateISO: "2026-06-09T10:00:00Z", views: 12800, likes: 88, comments: 6, vs: 0.8, url: null },
    ],
  },
  "7d": {
    gran: "day",
    current: { posts: 7, views: 98000, likes: 980, comments: 56 },
    prev: { posts: 6, views: 78000, likes: 720, comments: 44 },
    series: weekday([9200, 16400, 11000, 22600, 13200, 18000, 7600]),
    tiers: { viral: 1, good: 2, average: 3, weak: 1 },
    top: [
      { text: P1, dateISO: "2026-06-08T15:00:00Z", views: 38200, likes: 312, comments: 24, vs: 2.7, url: null },
      { text: P2, dateISO: "2026-06-06T09:00:00Z", views: 22600, likes: 178, comments: 14, vs: 1.6, url: null },
      { text: P3, dateISO: "2026-06-09T19:00:00Z", views: 18000, likes: 120, comments: 9, vs: 1.3, url: null },
      { text: P4, dateISO: "2026-06-05T13:00:00Z", views: 11000, likes: 74, comments: 5, vs: 0.8, url: null },
      { text: P5, dateISO: "2026-06-04T08:00:00Z", views: 7600, likes: 41, comments: 2, vs: 0.5, url: null },
    ],
  },
  "30d": {
    gran: "day",
    current: { posts: 21, views: 318000, likes: 3100, comments: 235 },
    prev: { posts: 16, views: 232000, likes: 2300, comments: 180 },
    series: daily(D30, 4, 12),
    tiers: { viral: 3, good: 6, average: 9, weak: 3 },
    top: [
      { text: P2, dateISO: "2026-05-28T09:00:00Z", views: 64000, likes: 520, comments: 41, vs: 4.2, url: null },
      { text: P1, dateISO: "2026-06-08T15:00:00Z", views: 38200, likes: 312, comments: 24, vs: 2.5, url: null },
      { text: P5, dateISO: "2026-05-21T08:00:00Z", views: 29400, likes: 226, comments: 18, vs: 1.9, url: null },
      { text: P3, dateISO: "2026-06-02T19:00:00Z", views: 22600, likes: 178, comments: 14, vs: 1.5, url: null },
      { text: P4, dateISO: "2026-05-16T13:00:00Z", views: 18000, likes: 120, comments: 9, vs: 1.2, url: null },
    ],
  },
  "90d": {
    gran: "week",
    current: { posts: 48, views: 642000, likes: 5800, comments: 430 },
    prev: { posts: 32, views: 392000, likes: 3600, comments: 270 },
    series: weekly(W90, 2, 9),
    tiers: { viral: 6, good: 14, average: 20, weak: 8 },
    top: [
      { text: P3, dateISO: "2026-04-14T09:00:00Z", views: 86000, likes: 710, comments: 58, vs: 6.4, url: null },
      { text: P2, dateISO: "2026-05-28T09:00:00Z", views: 64000, likes: 520, comments: 41, vs: 4.8, url: null },
      { text: P1, dateISO: "2026-06-08T15:00:00Z", views: 38200, likes: 312, comments: 24, vs: 2.9, url: null },
      { text: P4, dateISO: "2026-04-30T19:00:00Z", views: 30000, likes: 240, comments: 17, vs: 2.2, url: null },
      { text: P5, dateISO: "2026-03-22T08:00:00Z", views: 24000, likes: 188, comments: 12, vs: 1.8, url: null },
    ],
  },
  all: {
    gran: "week",
    current: { posts: 168, views: 1600000, likes: 14200, comments: 1060 },
    prev: null,
    series: weekly(WALL, 0, 6),
    tiers: { viral: 18, good: 50, average: 70, weak: 30 },
    top: [
      { text: P3, dateISO: "2026-04-14T09:00:00Z", views: 86000, likes: 710, comments: 58, vs: 9.0, url: null },
      { text: P2, dateISO: "2026-05-28T09:00:00Z", views: 64000, likes: 520, comments: 41, vs: 6.7, url: null },
      { text: P5, dateISO: "2026-02-11T08:00:00Z", views: 52000, likes: 430, comments: 33, vs: 5.5, url: null },
      { text: P1, dateISO: "2026-06-08T15:00:00Z", views: 38200, likes: 312, comments: 24, vs: 4.0, url: null },
      { text: P4, dateISO: "2026-04-30T19:00:00Z", views: 30000, likes: 240, comments: 17, vs: 3.2, url: null },
    ],
  },
};
