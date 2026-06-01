// stats-data.jsx — 12 weeks of Mara Lin's aggregate Threads performance.
// avgViews = average views per post that week; likes/comments = weekly totals.
// The app slices the last N weeks for the selected range and derives totals,
// averages, week-over-week deltas, and the performance-tier distribution.

const STATS_USER = { name: "Mara Lin", handle: "@mara.lin", initials: "ML" };

const WEEKS = [
  { label: "Mar 16", posts: 4, avgViews: 9200,  likes: 198, comments: 14 },
  { label: "Mar 23", posts: 3, avgViews: 10100, likes: 214, comments: 16 },
  { label: "Mar 30", posts: 5, avgViews: 8800,  likes: 176, comments: 12 },
  { label: "Apr 6",  posts: 4, avgViews: 11200, likes: 243, comments: 18 },
  { label: "Apr 13", posts: 4, avgViews: 13400, likes: 281, comments: 21 },
  { label: "Apr 20", posts: 3, avgViews: 12100, likes: 256, comments: 19 },
  { label: "Apr 27", posts: 5, avgViews: 15600, likes: 322, comments: 24 },
  { label: "May 4",  posts: 4, avgViews: 14800, likes: 304, comments: 22 },
  { label: "May 11", posts: 4, avgViews: 17300, likes: 360, comments: 27 },
  { label: "May 18", posts: 5, avgViews: 16200, likes: 338, comments: 25 },
  { label: "May 25", posts: 4, avgViews: 19800, likes: 412, comments: 31 },
  { label: "Jun 1",  posts: 3, avgViews: 22400, likes: 468, comments: 35 },
];

// performance tiers as a share of posts (vs the account's own baseline views).
// Counts are derived from the posts total in the selected range.
const TIERS = [
  { key: "breakout", name: "Breakout", sub: "3×+ your average", cls: "tier-breakout", pct: 0.08 },
  { key: "strong",   name: "Strong",   sub: "1.5–3× average",  cls: "tier-strong",   pct: 0.22 },
  { key: "onpar",    name: "On par",   sub: "0.7–1.5× average", cls: "tier-onpar",    pct: 0.47 },
  { key: "quiet",    name: "Quiet",    sub: "below 0.7×",       cls: "tier-quiet",    pct: 0.23 },
];

Object.assign(window, { STATS_USER, WEEKS, TIERS });
