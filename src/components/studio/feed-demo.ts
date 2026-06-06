// Feed demo data — drives the `?demo=1` Tweaks review (tester-only) so every
// baseline / verdict / growth / auto-reply / translate state can be exercised on
// mock content without the API. The live screen maps FeedPost/FeedReference into
// the same shapes.

export type FeedDemoPost = {
  id: number;
  kind: "post" | "reply";
  replyTo?: { who: string; text: string } | null;
  text: string;
  // Demo translations by locale code (inline translate); `lang` = original lang.
  tr?: Record<string, string>;
  lang?: string | null;
  time: string;
  views: number;
  likes: number;
  comments: number;
  reposts: number;
  settling?: boolean; // is_fresh — still settling
  autoReply: boolean;
  growth: number[]; // cumulative views series for the trend chart
};

export type FeedDemoBaseline = {
  posts: number;
  views: number;
  likes: number;
  comments: number;
  reposts: number;
  deltaViews: number; // % vs prior window
  sparkline: number[];
};

// Three tweaks (no account/density — see spec §6).
export const FEED_TWEAK_DEFAULTS = {
  dark: false,
  state: "Live", // Live | Loading | Empty | Error
  sort: "Recent", // Recent | Top
};

export const FEED_DEMO_BASELINE: FeedDemoBaseline = {
  posts: 18,
  views: 14800,
  likes: 286,
  comments: 21,
  reposts: 12,
  deltaViews: 12,
  sparkline: [9, 11, 10, 13, 12, 15, 14, 18],
};

export const FEED_DEMO_POSTS: FeedDemoPost[] = [
  {
    id: 1,
    kind: "post",
    text: "Consistency beats talent. Show up every day, keep the bar low enough to clear when you're tired, and let compounding do the rest.",
    time: "2d",
    views: 48200,
    likes: 1240,
    comments: 86,
    reposts: 73,
    autoReply: true,
    growth: [0, 9000, 21000, 32000, 41000, 48200],
  },
  {
    id: 2,
    kind: "post",
    text: "Empieza antes de sentirte listo. La versión de ti que espera nunca publica.",
    lang: "es",
    tr: { en: "Start before you feel ready. The version of you that waits never ships." },
    time: "5h",
    views: 2100,
    likes: 64,
    comments: 7,
    reposts: 3,
    settling: true,
    autoReply: true,
    growth: [0, 400, 900, 1400, 1800, 2100],
  },
  {
    id: 3,
    kind: "reply",
    replyTo: { who: "devon", text: "how do you even start writing when your brain is completely blank?" },
    text: "I open a doc and write the worst possible first line on purpose. It kills the pressure, and the real sentence usually shows up by line three.",
    time: "1d",
    views: 31800,
    likes: 540,
    comments: 31,
    reposts: 19,
    autoReply: false,
    growth: [0, 6000, 14000, 22000, 28000, 31800],
  },
  {
    id: 4,
    kind: "post",
    text: "You don't need a niche. You need a point of view you'll still hold in a year.",
    time: "3d",
    views: 22400,
    likes: 410,
    comments: 28,
    reposts: 16,
    autoReply: true,
    growth: [0, 5000, 11000, 16000, 20000, 22400],
  },
  {
    id: 5,
    kind: "post",
    text: "The fastest way to find your voice online: write the way you text your smartest friend.",
    time: "4d",
    views: 15600,
    likes: 298,
    comments: 19,
    reposts: 11,
    autoReply: false,
    growth: [0, 4000, 8000, 11500, 14000, 15600],
  },
  {
    id: 6,
    kind: "post",
    text: "Boring consistency is a competitive advantage precisely because almost nobody can stomach it.",
    time: "6d",
    views: 8400,
    likes: 132,
    comments: 9,
    reposts: 5,
    autoReply: false,
    growth: [0, 2200, 4300, 6000, 7400, 8400],
  },
];
