// Stats demo data — drives the `?demo=1` Tweaks review (tester-only) so every
// period / delta / chart / tier state can be exercised without the API. The
// live screen maps StatsResponse into the same shapes.

export type StatPeriodKey = "today" | "yesterday" | "7d" | "30d" | "90d" | "all";
export type Gran = "hour" | "day" | "week" | "month";

export type StatTotals = { posts: number; views: number; likes: number; comments: number };
export type StatBucket = { label: string; value: number }; // avg views per post in the bucket
export type StatPeriodData = {
  gran: Gran;
  current: StatTotals;
  prev: StatTotals | null; // null → "no prior period" (All time)
  series: StatBucket[];
  tiers: { viral: number; good: number; average: number; weak: number };
};

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
  },
};
