// Stats demo data — drives the `?demo=1` Tweaks review (tester-only) so every
// period / delta / chart / tier state can be exercised without the API. The
// live screen maps StatsResponse into the same shapes.

export type StatPeriodKey = "today" | "yesterday" | "7d" | "30d" | "90d" | "all";
export type Gran = "hour" | "day" | "week" | "month";

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
export type DemoSlot = { slot: number; posts: number; avg: number };
export type StatPeriodData = {
  gran: Gran;
  current: StatTotals;
  prev: StatTotals | null; // null → "no prior period" (All time)
  series: StatBucket[];
  tiers: { viral: number; good: number; average: number; weak: number };
  top: DemoTopPost[];
  byHour: DemoSlot[]; // empty for today/yesterday — the panel is hidden there
  byWeekday: DemoSlot[];
};

// Shared sample posts (Mara's voice) reused across periods at different scales.
const P1 = "Publish the thing you're slightly embarrassed by. The polished version is everyone's — the embarrassing one is yours.";
const P2 = "Nobody quits writing because it's hard. They quit because it's hard and nobody noticed.";
const P3 = "Your first hundred posts are the tuition. Stop grading them like they're the exam.";
const P4 = "Write the way you talk to one friend, not the way you present to a room.";
const P5 = "A draft a day isn't discipline. It's just lowering the price of starting.";

// Three tweaks (no account/density — see spec §6).
export const STATS_TWEAK_DEFAULTS = {
  dark: false,
  state: "Live", // Live | Loading | Empty
  period: "7d", // today | yesterday | 7d | 30d | 90d | all
};

export const STATS_DEMO: Record<StatPeriodKey, StatPeriodData> = {
  today: {
    gran: "hour",
    current: { posts: 3, views: 42600, likes: 300, comments: 22 },
    prev: { posts: 3, views: 31000, likes: 230, comments: 18 },
    series: [
      { label: "6 AM", value: 8200 },
      { label: "9 AM", value: 16400 },
      { label: "12 PM", value: 11200 },
      { label: "3 PM", value: 21800 },
      { label: "6 PM", value: 13600 },
      { label: "9 PM", value: 9400 },
    ],
    tiers: { viral: 1, good: 1, average: 1, weak: 0 },
    top: [
      { text: P1, dateISO: "2026-06-10T15:00:00Z", views: 21800, likes: 156, comments: 12, vs: 1.5, url: null },
      { text: P4, dateISO: "2026-06-10T09:00:00Z", views: 12600, likes: 98, comments: 7, vs: 0.9, url: null },
      { text: P5, dateISO: "2026-06-10T06:00:00Z", views: 8200, likes: 46, comments: 3, vs: 0.6, url: null },
    ],
    byHour: [],
    byWeekday: [],
  },
  yesterday: {
    gran: "hour",
    current: { posts: 2, views: 31000, likes: 240, comments: 17 },
    prev: { posts: 1, views: 12000, likes: 90, comments: 6 },
    series: [
      { label: "7 AM", value: 6400 },
      { label: "10 AM", value: 12800 },
      { label: "1 PM", value: 18200 },
      { label: "4 PM", value: 9600 },
      { label: "7 PM", value: 14400 },
      { label: "10 PM", value: 7200 },
    ],
    tiers: { viral: 0, good: 1, average: 1, weak: 0 },
    top: [
      { text: P2, dateISO: "2026-06-09T13:00:00Z", views: 18200, likes: 142, comments: 11, vs: 1.2, url: null },
      { text: P3, dateISO: "2026-06-09T10:00:00Z", views: 12800, likes: 88, comments: 6, vs: 0.8, url: null },
    ],
    byHour: [],
    byWeekday: [],
  },
  "7d": {
    gran: "day",
    current: { posts: 7, views: 98000, likes: 980, comments: 56 },
    prev: { posts: 6, views: 78000, likes: 720, comments: 44 },
    series: [
      { label: "Mon", value: 9200 },
      { label: "Tue", value: 16400 },
      { label: "Wed", value: 11000 },
      { label: "Thu", value: 22600 },
      { label: "Fri", value: 13200 },
      { label: "Sat", value: 18000 },
      { label: "Sun", value: 7600 },
    ],
    tiers: { viral: 1, good: 2, average: 3, weak: 1 },
    top: [
      { text: P1, dateISO: "2026-06-08T15:00:00Z", views: 38200, likes: 312, comments: 24, vs: 2.7, url: null },
      { text: P2, dateISO: "2026-06-06T09:00:00Z", views: 22600, likes: 178, comments: 14, vs: 1.6, url: null },
      { text: P3, dateISO: "2026-06-09T19:00:00Z", views: 18000, likes: 120, comments: 9, vs: 1.3, url: null },
      { text: P4, dateISO: "2026-06-05T13:00:00Z", views: 11000, likes: 74, comments: 5, vs: 0.8, url: null },
      { text: P5, dateISO: "2026-06-04T08:00:00Z", views: 7600, likes: 41, comments: 2, vs: 0.5, url: null },
    ],
    byHour: [
      { slot: 8, posts: 2, avg: 16800 },
      { slot: 9, posts: 1, avg: 22600 },
      { slot: 13, posts: 2, avg: 11200 },
      { slot: 19, posts: 2, avg: 9400 },
    ],
    byWeekday: [
      { slot: 1, posts: 1, avg: 9200 },
      { slot: 2, posts: 1, avg: 16400 },
      { slot: 3, posts: 1, avg: 11000 },
      { slot: 4, posts: 1, avg: 22600 },
      { slot: 5, posts: 1, avg: 13200 },
      { slot: 6, posts: 1, avg: 18000 },
      { slot: 7, posts: 1, avg: 7600 },
    ],
  },
  "30d": {
    gran: "week",
    current: { posts: 21, views: 318000, likes: 3100, comments: 235 },
    prev: { posts: 16, views: 232000, likes: 2300, comments: 180 },
    series: [
      { label: "May 4", value: 12400 },
      { label: "May 11", value: 17800 },
      { label: "May 18", value: 14200 },
      { label: "May 25", value: 21000 },
    ],
    tiers: { viral: 3, good: 6, average: 9, weak: 3 },
    top: [
      { text: P2, dateISO: "2026-05-28T09:00:00Z", views: 64000, likes: 520, comments: 41, vs: 4.2, url: null },
      { text: P1, dateISO: "2026-06-08T15:00:00Z", views: 38200, likes: 312, comments: 24, vs: 2.5, url: null },
      { text: P5, dateISO: "2026-05-21T08:00:00Z", views: 29400, likes: 226, comments: 18, vs: 1.9, url: null },
      { text: P3, dateISO: "2026-06-02T19:00:00Z", views: 22600, likes: 178, comments: 14, vs: 1.5, url: null },
      { text: P4, dateISO: "2026-05-16T13:00:00Z", views: 18000, likes: 120, comments: 9, vs: 1.2, url: null },
    ],
    byHour: [
      { slot: 8, posts: 6, avg: 14800 },
      { slot: 9, posts: 4, avg: 21000 },
      { slot: 13, posts: 5, avg: 12600 },
      { slot: 19, posts: 4, avg: 16400 },
      { slot: 22, posts: 2, avg: 9800 },
    ],
    byWeekday: [
      { slot: 1, posts: 3, avg: 12400 },
      { slot: 2, posts: 3, avg: 17800 },
      { slot: 3, posts: 3, avg: 12000 },
      { slot: 4, posts: 3, avg: 21000 },
      { slot: 5, posts: 3, avg: 15400 },
      { slot: 6, posts: 4, avg: 18800 },
      { slot: 7, posts: 2, avg: 8600 },
    ],
  },
  "90d": {
    gran: "week",
    current: { posts: 48, views: 642000, likes: 5800, comments: 430 },
    prev: { posts: 32, views: 392000, likes: 3600, comments: 270 },
    series: [
      { label: "Mar", value: 9800 },
      { label: "", value: 11200 },
      { label: "Apr", value: 12600 },
      { label: "", value: 15400 },
      { label: "May", value: 13800 },
      { label: "", value: 17200 },
      { label: "Jun", value: 14600 },
      { label: "", value: 12000 },
    ],
    tiers: { viral: 6, good: 14, average: 20, weak: 8 },
    top: [
      { text: P3, dateISO: "2026-04-14T09:00:00Z", views: 86000, likes: 710, comments: 58, vs: 6.4, url: null },
      { text: P2, dateISO: "2026-05-28T09:00:00Z", views: 64000, likes: 520, comments: 41, vs: 4.8, url: null },
      { text: P1, dateISO: "2026-06-08T15:00:00Z", views: 38200, likes: 312, comments: 24, vs: 2.9, url: null },
      { text: P4, dateISO: "2026-04-30T19:00:00Z", views: 30000, likes: 240, comments: 17, vs: 2.2, url: null },
      { text: P5, dateISO: "2026-03-22T08:00:00Z", views: 24000, likes: 188, comments: 12, vs: 1.8, url: null },
    ],
    byHour: [
      { slot: 7, posts: 4, avg: 9800 },
      { slot: 8, posts: 10, avg: 14200 },
      { slot: 9, posts: 8, avg: 18600 },
      { slot: 13, posts: 9, avg: 12400 },
      { slot: 19, posts: 10, avg: 15800 },
      { slot: 22, posts: 7, avg: 10200 },
    ],
    byWeekday: [
      { slot: 1, posts: 7, avg: 11200 },
      { slot: 2, posts: 7, avg: 14800 },
      { slot: 3, posts: 7, avg: 12600 },
      { slot: 4, posts: 7, avg: 17400 },
      { slot: 5, posts: 7, avg: 13800 },
      { slot: 6, posts: 8, avg: 16200 },
      { slot: 7, posts: 5, avg: 9400 },
    ],
  },
  all: {
    gran: "month",
    current: { posts: 168, views: 1600000, likes: 14200, comments: 1060 },
    prev: null,
    series: [
      { label: "Jan", value: 7400 },
      { label: "Feb", value: 8600 },
      { label: "Mar", value: 9200 },
      { label: "Apr", value: 11400 },
      { label: "May", value: 12800 },
      { label: "Jun", value: 14200 },
    ],
    tiers: { viral: 18, good: 50, average: 70, weak: 30 },
    top: [
      { text: P3, dateISO: "2026-04-14T09:00:00Z", views: 86000, likes: 710, comments: 58, vs: 9.0, url: null },
      { text: P2, dateISO: "2026-05-28T09:00:00Z", views: 64000, likes: 520, comments: 41, vs: 6.7, url: null },
      { text: P5, dateISO: "2026-02-11T08:00:00Z", views: 52000, likes: 430, comments: 33, vs: 5.5, url: null },
      { text: P1, dateISO: "2026-06-08T15:00:00Z", views: 38200, likes: 312, comments: 24, vs: 4.0, url: null },
      { text: P4, dateISO: "2026-04-30T19:00:00Z", views: 30000, likes: 240, comments: 17, vs: 3.2, url: null },
    ],
    byHour: [
      { slot: 7, posts: 12, avg: 8200 },
      { slot: 8, posts: 30, avg: 11800 },
      { slot: 9, posts: 26, avg: 14600 },
      { slot: 13, posts: 32, avg: 10400 },
      { slot: 19, posts: 38, avg: 12800 },
      { slot: 22, posts: 30, avg: 9000 },
    ],
    byWeekday: [
      { slot: 1, posts: 24, avg: 9800 },
      { slot: 2, posts: 24, avg: 12200 },
      { slot: 3, posts: 24, avg: 10600 },
      { slot: 4, posts: 24, avg: 13400 },
      { slot: 5, posts: 24, avg: 11000 },
      { slot: 6, posts: 26, avg: 12600 },
      { slot: 7, posts: 22, avg: 8200 },
    ],
  },
};
