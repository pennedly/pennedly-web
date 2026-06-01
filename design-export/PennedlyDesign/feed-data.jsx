// feed-data.jsx — seed content for the My Feed (performance) screen.
// Mara Lin's published Threads posts with realistic metrics + cumulative
// views-over-time trends. The baseline is the account's 30-day average — every
// post's badge and trend chart compare back to it.

const FEED_USER = { name: "Mara Lin", handle: "@mara.lin", initials: "ML" };

// 30-day rolling average — the reference baseline everything compares to.
const BASELINE = {
  views: 14800,
  likes: 286,
  comments: 21,
  reposts: 12,
  posts: 18,
  deltaViews: 12, // % vs previous 30 days
};

// trend = cumulative views over the time since posting (one point per interval).
const FEED_POSTS = [
  {
    id: "f1",
    kind: "post",
    text: "Wrote 1,000 words this morning before I opened email. Cut 600 of them. The 400 that survived are the only ones that were ever going to matter.",
    time: "2d ago",
    span: "7 days",
    settling: false,
    autoReplies: true,
    metrics: { views: 48200, likes: 1205, comments: 84, reposts: 63 },
    peak: "Peaked Tue 2pm",
    trend: [3200, 14800, 28000, 36500, 41200, 44800, 46500, 47600, 48200],
  },
  {
    id: "f2",
    kind: "post",
    text: "The best feedback I ever got on my writing was four words: \u201CI can hear you.\u201D Three years later it's still the only metric I actually trust.",
    time: "3h ago",
    span: "3 hours",
    settling: true,
    autoReplies: true,
    metrics: { views: 2140, likes: 71, comments: 5, reposts: 2 },
    peak: "Still climbing",
    trend: [180, 520, 980, 1450, 1860, 2140],
  },
  {
    id: "f3",
    kind: "reply",
    replyTo: { who: "@devon", text: "honestly how do you even start writing when your brain is blank" },
    text: "Start before you feel ready. I open a doc and write the worst possible first line on purpose \u2014 it kills the pressure to be good, and the real sentence usually shows up by line three.",
    time: "4d ago",
    span: "7 days",
    settling: false,
    autoReplies: false,
    metrics: { views: 31800, likes: 902, comments: 47, reposts: 28 },
    peak: "Peaked Sat 9am",
    trend: [4200, 13500, 21000, 26000, 28800, 30200, 31000, 31500, 31800],
  },
  {
    id: "f4",
    kind: "post",
    text: "Stop optimizing your first sentence. Optimize the reason someone should still care by the third. Hooks fade in a scroll; substance is what compounds.",
    time: "6d ago",
    span: "7 days",
    settling: false,
    autoReplies: true,
    metrics: { views: 22400, likes: 489, comments: 31, reposts: 17 },
    peak: "Peaked Thu 7pm",
    trend: [2600, 8800, 14200, 17800, 19900, 21100, 21800, 22150, 22400],
  },
  {
    id: "f5",
    kind: "post",
    text: "Underrated creative skill: being willing to be a little boring on purpose. Not every post needs a twist \u2014 some just need to be true and land on time.",
    time: "5d ago",
    span: "7 days",
    settling: false,
    autoReplies: false,
    metrics: { views: 15600, likes: 304, comments: 19, reposts: 11 },
    peak: "Peaked Wed 8am",
    trend: [1800, 5200, 8600, 11000, 12800, 14000, 14900, 15300, 15600],
  },
  {
    id: "f6",
    kind: "post",
    text: "A reminder I needed today: the algorithm rewards consistency, but your readers reward honesty. When they disagree, write for the second one.",
    time: "1w ago",
    span: "7 days",
    settling: false,
    autoReplies: false,
    metrics: { views: 8400, likes: 142, comments: 9, reposts: 4 },
    peak: "Peaked Mon 6pm",
    trend: [1500, 3400, 5000, 6200, 7000, 7600, 8000, 8250, 8400],
  },
];

Object.assign(window, { FEED_USER, BASELINE, FEED_POSTS });
