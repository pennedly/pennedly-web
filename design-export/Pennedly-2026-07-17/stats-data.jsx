// stats-data.jsx — aggregate Threads performance, precomputed per backend period.
// The period options MATCH the backend exactly: today / yesterday / 7 days /
// month / 3 months / all time. Each carries its own summary, the PREVIOUS-period
// summary for deltas (null for all-time — the backend has no prior period), the
// trend buckets (avg views per bucket, with an ISO `at` so labels localize), and
// the viral-tier distribution. Nothing here is a range the backend can't compute.

const STATS_USER = { name: "Mara Lin", handle: "@mara.lin", initials: "ML", avatar: "assets/avatars/mara.png" };

// the order + labels of the period selector (1:1 with the backend enum)
const PERIODS = [
  { key: "today",     label: "Today",     gran: "hour" },
  { key: "yesterday", label: "Yesterday", gran: "hour" },
  { key: "7d",        label: "7 days",    gran: "day" },
  { key: "month",     label: "Month",     gran: "week" },
  { key: "3mo",       label: "3 months",  gran: "week" },
  { key: "all",       label: "All time",  gran: "month" },
];

// tier metadata shared across periods (share-of-posts vs the account's baseline)
const TIER_META = [
  { key: "viral",   name: "Viral",   sub: "3×+ your average",  cls: "tier-viral" },
  { key: "good",    name: "Good",    sub: "1.5–3× average",    cls: "tier-good" },
  { key: "average", name: "Average", sub: "0.7–1.5× average",  cls: "tier-average" },
  { key: "weak",    name: "Weak",    sub: "below 0.7×",        cls: "tier-weak" },
];

const STATS = {
  today: {
    posts: 3, views: 42600, likes: 300, comments: 22,
    prev: { posts: 2, views: 31000, likes: 240, comments: 17 },
    dist: { viral: 0.34, good: 0.33, average: 0.33, weak: 0 },
    buckets: [
      { at: "2026-06-02T09:00:00", v: 14200 },
      { at: "2026-06-02T12:30:00", v: 8600 },
      { at: "2026-06-02T17:45:00", v: 19800 },
    ],
  },
  yesterday: {
    posts: 2, views: 31000, likes: 240, comments: 17,
    prev: { posts: 1, views: 12000, likes: 95, comments: 6 },
    dist: { viral: 0.5, good: 0, average: 0.5, weak: 0 },
    buckets: [
      { at: "2026-06-01T08:40:00", v: 21400 },
      { at: "2026-06-01T16:10:00", v: 9600 },
    ],
  },
  "7d": {
    posts: 7, views: 98000, likes: 980, comments: 56,
    prev: { posts: 6, views: 78000, likes: 720, comments: 44 },
    dist: { viral: 0.14, good: 0.29, average: 0.43, weak: 0.14 },
    buckets: [
      { at: "2026-05-27T12:00:00", v: 11000 },
      { at: "2026-05-28T12:00:00", v: 13500 },
      { at: "2026-05-29T12:00:00", v: 9800 },
      { at: "2026-05-30T12:00:00", v: 22000 },
      { at: "2026-05-31T12:00:00", v: 12000 },
      { at: "2026-06-01T12:00:00", v: 15500 },
      { at: "2026-06-02T12:00:00", v: 14200 },
    ],
  },
  month: {
    posts: 21, views: 318000, likes: 3100, comments: 235,
    prev: { posts: 17, views: 232000, likes: 2480, comments: 182 },
    dist: { viral: 0.10, good: 0.24, average: 0.43, weak: 0.23 },
    buckets: [
      { at: "2026-05-04T12:00:00", v: 14800 },
      { at: "2026-05-11T12:00:00", v: 17300 },
      { at: "2026-05-18T12:00:00", v: 16200 },
      { at: "2026-05-25T12:00:00", v: 19800 },
      { at: "2026-06-01T12:00:00", v: 17900 },
    ],
  },
  "3mo": {
    posts: 48, views: 642000, likes: 5800, comments: 430,
    prev: { posts: 39, views: 392000, likes: 3900, comments: 290 },
    dist: { viral: 0.08, good: 0.21, average: 0.46, weak: 0.25 },
    buckets: [
      { at: "2026-03-16T12:00:00", v: 9200 },
      { at: "2026-03-23T12:00:00", v: 10100 },
      { at: "2026-03-30T12:00:00", v: 8800 },
      { at: "2026-04-06T12:00:00", v: 11200 },
      { at: "2026-04-13T12:00:00", v: 13400 },
      { at: "2026-04-20T12:00:00", v: 12100 },
      { at: "2026-04-27T12:00:00", v: 15600 },
      { at: "2026-05-04T12:00:00", v: 14800 },
      { at: "2026-05-11T12:00:00", v: 17300 },
      { at: "2026-05-18T12:00:00", v: 16200 },
      { at: "2026-05-25T12:00:00", v: 19800 },
      { at: "2026-06-01T12:00:00", v: 22400 },
    ],
  },
  all: {
    posts: 168, views: 1640000, likes: 14200, comments: 1060,
    prev: null,
    dist: { viral: 0.06, good: 0.18, average: 0.47, weak: 0.29 },
    buckets: [
      { at: "2025-11-15T12:00:00", v: 4200 },
      { at: "2025-12-15T12:00:00", v: 5100 },
      { at: "2026-01-15T12:00:00", v: 6800 },
      { at: "2026-02-15T12:00:00", v: 7500 },
      { at: "2026-03-15T12:00:00", v: 9400 },
      { at: "2026-04-15T12:00:00", v: 12800 },
      { at: "2026-05-15T12:00:00", v: 17000 },
      { at: "2026-06-02T12:00:00", v: 22400 },
    ],
  },
};

Object.assign(window, { STATS_USER, PERIODS, TIER_META, STATS });
