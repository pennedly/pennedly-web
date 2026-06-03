import { test, type Page } from "@playwright/test";

// ── Mock-auth visual harness ─────────────────────────────────────────────────
// Renders auth-gated /app screens with mocked backend data so the redesign can
// be verified visually (and, later, as Phase 6 visual-regression). Every
// backend call is intercepted (the real API is never hit); a fake token is
// seeded so the app doesn't bounce to /app/login.
//
// Run just this file:  npx playwright test tests/visual/screens.spec.ts
// Output:              test-results/visual/<name>-{light,dark}.png
//
// Add per-screen fixtures to `route()` below as each screen is restyled.

const ME = {
  user_id: 1,
  email: "mara@pennedly.app",
  display_name: "Mara Lin",
  tenant: { id: 1, name: "Mara Lin", slug: "mara", plan_tier: "free", accounts_limit: 3 },
  is_tester: true,
  locale: "en",
};

const ACCOUNTS = [
  {
    id: 1,
    tenant_id: 1,
    threads_user_id: "t_1",
    username: "mara.lin",
    display_name: "Mara Lin",
    // Inline data-URI so the harness can verify the real-avatar <img> path
    // (external Threads CDN images don't load under test).
    profile_picture_url:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Crect width='64' height='64' fill='%234f46e5'/%3E%3Ccircle cx='32' cy='25' r='11' fill='%23fff'/%3E%3Crect x='12' y='40' width='40' height='22' rx='11' fill='%23fff'/%3E%3C/svg%3E",
    connected_at: "2026-05-01T00:00:00Z",
    disconnected_at: null,
  },
  {
    id: 2,
    tenant_id: 1,
    threads_user_id: "t_2",
    username: "mara.writes",
    display_name: "Mara — side account",
    profile_picture_url: null,
    connected_at: "2026-05-10T00:00:00Z",
    disconnected_at: null,
  },
];

const DRAFTS = [
  {
    id: 142,
    account_id: 1,
    content_type: "post",
    status: "approved",
    generated_text:
      "The fastest way to find your voice online: publish the thing you're slightly embarrassed by. The polished version is everyone's. The embarrassing one is yours.",
    llm_model: "claude",
    topic_label: "Writing",
    is_skip: false,
    created_at: "2026-05-31T19:30:00Z",
    published: false,
    threads_url: null,
  },
  {
    id: 141,
    account_id: 1,
    content_type: "post",
    status: "approved",
    generated_text:
      "Nobody tells you that consistency beats intensity until you've burned out twice trying to prove otherwise. Three small posts a week out-compound one viral month.",
    llm_model: "claude",
    topic_label: "Habits",
    is_skip: false,
    created_at: "2026-05-31T16:10:00Z",
    published: false,
    threads_url: null,
  },
  {
    id: 143,
    account_id: 1,
    content_type: "post",
    status: "pending",
    generated_text:
      "I used to think discipline was the hard part. Turns out the hard part is deciding what's actually worth being disciplined about.",
    llm_model: "claude",
    topic_label: "Discipline",
    is_skip: false,
    created_at: "2026-06-01T08:00:00Z",
    published: false,
    threads_url: null,
  },
  // Q62: a reply draft — Studio shows it read-only (context + text + link out).
  {
    id: 144,
    account_id: 1,
    content_type: "comment_reply",
    status: "pending",
    generated_text:
      "Start before you feel ready. I open a doc and write the worst possible first line on purpose — it kills the pressure, and the real sentence usually shows up by line three.",
    llm_model: "claude",
    topic_label: null,
    is_skip: false,
    created_at: "2026-06-01T09:20:00Z",
    published: false,
    threads_url: null,
    reply_to: {
      who: "devon",
      text: "honestly how do you even start writing when your brain is completely blank",
    },
  },
];

const FEED = {
  count: 3,
  reference: {
    window_days: 7,
    posts_counted: 24,
    avg_views: 1850,
    avg_likes: 95,
    avg_comments: 12,
    avg_reposts: 8,
    median_views: 1600,
  },
  posts: [
    {
      id: 9001,
      threads_post_id: "t_9001",
      threads_url: "https://www.threads.net/@mara.lin/post/9001",
      text: "The fastest way to find your voice online: publish the thing you're slightly embarrassed by. The polished version is everyone's.",
      published_at: "2026-05-30T14:00:00Z",
      views: 8420,
      likes: 540,
      reposts: 38,
      comments_count: 47,
      viral_tier: "viral",
      viral_score: 0.92,
      vs_avg_views: 4.5,
      is_fresh: false,
      auto_reply: true,
    },
    {
      id: 9002,
      threads_post_id: "t_9002",
      threads_url: "https://www.threads.net/@mara.lin/post/9002",
      text: "Just shipped something I've been sitting on for two weeks. Posting before I talk myself out of it.",
      published_at: "2026-05-31T20:30:00Z",
      views: 410,
      likes: 22,
      reposts: 1,
      comments_count: 3,
      viral_tier: null,
      viral_score: null,
      vs_avg_views: null,
      is_fresh: true,
      auto_reply: false,
    },
    {
      id: 9003,
      threads_post_id: "t_9003",
      threads_url: "https://www.threads.net/@mara.lin/post/9003",
      text: "Consistency beats intensity. Three small posts a week out-compound one viral month — every single time.",
      published_at: "2026-05-29T09:15:00Z",
      views: 1620,
      likes: 88,
      reposts: 9,
      comments_count: 11,
      viral_tier: "good",
      viral_score: 0.6,
      vs_avg_views: 0.9,
      is_fresh: false,
      auto_reply: false,
    },
  ],
};

const MENTIONS = {
  count: 3,
  mentions: [
    {
      id: 501,
      account_id: 1,
      threads_mention_id: "m1",
      author_username: "devon.writes",
      text: "Just read @mara.lin's thread on finding your voice — required reading for anyone starting out.",
      permalink: "https://www.threads.net/@devon.writes/post/1",
      status: "new",
      published_at: "2026-06-01T09:30:00Z",
      created_at: "2026-06-01T09:30:00Z",
    },
    {
      id: 502,
      account_id: 1,
      threads_mention_id: "m2",
      author_username: "ana.k",
      text: "honestly @mara.lin nailed it here. consistency > intensity, every time.",
      permalink: "https://www.threads.net/@ana.k/post/2",
      status: "new",
      published_at: "2026-05-31T18:00:00Z",
      created_at: "2026-05-31T18:00:00Z",
    },
    {
      id: 503,
      account_id: 1,
      threads_mention_id: "m3",
      author_username: "buildinpublic",
      text: "shoutout to @mara.lin for the nudge to ship before you're ready. did it. terrifying. worth it.",
      permalink: "https://www.threads.net/@buildinpublic/post/3",
      status: "seen",
      published_at: "2026-05-30T12:00:00Z",
      created_at: "2026-05-30T12:00:00Z",
    },
  ],
};

// Reply queue — comments across two posts in every card state (new / pending
// draft / approved / replied / skipped), so the redesign's status filter,
// post-rail and per-state cards all render. `status_counts` drives the tabs.
const COMMENTS = {
  count: 6,
  status_counts: { new: 2, drafted: 2, replied: 1, skipped: 1 },
  comments: [
    {
      id: 701,
      account_id: 1,
      post_id: 9001,
      threads_comment_id: "tc_701",
      author_username: "devon.makes",
      text: "this hit me at exactly the right time. how do you actually decide what to cut?",
      comment_url: "https://www.threads.net/@devon.makes/post/701",
      status: "new",
      published_at: "2026-06-01T07:30:00Z",
      created_at: "2026-06-01T07:30:00Z",
      post_text:
        "The fastest way to find your voice online: publish the thing you're slightly embarrassed by.",
      post_published_at: "2026-05-30T14:00:00Z",
      post_threads_url: "https://www.threads.net/@mara.lin/post/9001",
      ai_draft_id: null,
      draft_text: null,
      draft_status: null,
      draft_is_skip: null,
      replied_at: null,
      reply_threads_post_id: null,
    },
    {
      id: 702,
      account_id: 1,
      post_id: 9001,
      threads_comment_id: "tc_702",
      author_username: "theo.writes",
      text: "“the 400 that survived” ok this is calling me OUT",
      comment_url: "https://www.threads.net/@theo.writes/post/702",
      status: "drafted",
      published_at: "2026-06-01T05:00:00Z",
      created_at: "2026-06-01T05:00:00Z",
      post_text:
        "The fastest way to find your voice online: publish the thing you're slightly embarrassed by.",
      post_published_at: "2026-05-30T14:00:00Z",
      post_threads_url: "https://www.threads.net/@mara.lin/post/9001",
      ai_draft_id: 8021,
      draft_text:
        "ha — the survivors are always the ones that scared me a little. those are usually the keepers.",
      draft_status: "pending",
      draft_is_skip: false,
      replied_at: null,
      reply_threads_post_id: null,
    },
    {
      id: 703,
      account_id: 1,
      post_id: 9001,
      threads_comment_id: "tc_703",
      author_username: "marina.k",
      text: "do you write longhand first or go straight to a doc?",
      comment_url: "https://www.threads.net/@marina.k/post/703",
      status: "drafted",
      published_at: "2026-05-31T22:00:00Z",
      created_at: "2026-05-31T22:00:00Z",
      post_text:
        "The fastest way to find your voice online: publish the thing you're slightly embarrassed by.",
      post_published_at: "2026-05-30T14:00:00Z",
      post_threads_url: "https://www.threads.net/@mara.lin/post/9001",
      ai_draft_id: 8022,
      draft_text:
        "straight to a doc, always — I type faster than I can second-guess. longhand is only for when I'm truly stuck.",
      draft_status: "approved",
      draft_is_skip: false,
      replied_at: null,
      reply_threads_post_id: null,
    },
    {
      id: 704,
      account_id: 1,
      post_id: 9001,
      threads_comment_id: "tc_704",
      author_username: "paul.writes",
      text: "saving this. genuinely needed the permission to cut today.",
      comment_url: "https://www.threads.net/@paul.writes/post/704",
      status: "replied",
      published_at: "2026-05-31T12:00:00Z",
      created_at: "2026-05-31T12:00:00Z",
      post_text:
        "The fastest way to find your voice online: publish the thing you're slightly embarrassed by.",
      post_published_at: "2026-05-30T14:00:00Z",
      post_threads_url: "https://www.threads.net/@mara.lin/post/9001",
      ai_draft_id: 8023,
      draft_text:
        "cut freely — you can always paste it back later, but you almost never want to.",
      draft_status: "approved",
      draft_is_skip: false,
      replied_at: "2026-05-31T13:00:00Z",
      reply_threads_post_id: "t_reply_704",
      auto_replied: true,
    },
    {
      id: 705,
      account_id: 1,
      post_id: 9003,
      threads_comment_id: "tc_705",
      author_username: "lucia.r",
      text: "Esto es justo lo que necesitaba leer hoy. ¡Mil gracias por compartirlo! 🙏",
      comment_url: "https://www.threads.net/@lucia.r/post/705",
      status: "new",
      published_at: "2026-06-01T06:15:00Z",
      created_at: "2026-06-01T06:15:00Z",
      post_text:
        "Consistency beats intensity. Three small posts a week out-compound one viral month.",
      post_published_at: "2026-05-29T09:15:00Z",
      post_threads_url: "https://www.threads.net/@mara.lin/post/9003",
      ai_draft_id: null,
      draft_text: null,
      draft_status: null,
      draft_is_skip: null,
      replied_at: null,
      reply_threads_post_id: null,
    },
    {
      id: 706,
      account_id: 1,
      post_id: 9003,
      threads_comment_id: "tc_706",
      author_username: "growthhacks.io",
      text: "🚀 amazing post!! check out my page for DAILY writing hacks and follow back 🔥🔥 link in bio",
      comment_url: "https://www.threads.net/@growthhacks.io/post/706",
      status: "skipped",
      published_at: "2026-05-31T20:00:00Z",
      created_at: "2026-05-31T20:00:00Z",
      post_text:
        "Consistency beats intensity. Three small posts a week out-compound one viral month.",
      post_published_at: "2026-05-29T09:15:00Z",
      post_threads_url: "https://www.threads.net/@mara.lin/post/9003",
      ai_draft_id: 8024,
      draft_text: null,
      draft_status: "pending",
      draft_is_skip: true,
      replied_at: null,
      reply_threads_post_id: null,
    },
  ],
};

// Stats — 8 weekly buckets (the default 8-week range) + a current summary,
// prior-span deltas and the viral-tier distribution. Drives the cards, the
// two column charts and the distribution bars.
// Day-buckets for the default 7d period (the chart colors bars above/below the
// period average — Q39 — so the values straddle the mean on purpose).
const STATS_WEEKS = [
  { bucket_start: "2026-05-27", posts: 1, avg_views: 11000 },
  { bucket_start: "2026-05-28", posts: 1, avg_views: 13500 },
  { bucket_start: "2026-05-29", posts: 1, avg_views: 18200 },
  { bucket_start: "2026-05-30", posts: 1, avg_views: 9800 },
  { bucket_start: "2026-05-31", posts: 1, avg_views: 22400 },
  { bucket_start: "2026-06-01", posts: 1, avg_views: 16800 },
  { bucket_start: "2026-06-02", posts: 1, avg_views: 14200 },
];
const STATS = {
  period: "8w",
  current: {
    posts: 32,
    views: 523700,
    likes: 2180,
    comments: 178,
    avg_views: 16365.6,
    avg_likes: 68.1,
    avg_comments: 5.6,
    tier_counts: { viral: 3, good: 8, mid: 15, flop: 6 },
  },
  previous: {
    posts: 35,
    views: 465000,
    likes: 2010,
    comments: 168,
    avg_views: 13285.7,
    avg_likes: 57.4,
    avg_comments: 4.8,
    tier_counts: { viral: 2, good: 7, mid: 18, flop: 8 },
  },
  deltas: { views_pct: 12.6, posts_pct: -8.6, likes_pct: 8.5, comments_pct: 6 },
  series: STATS_WEEKS.map((w) => ({
    ...w,
    sum_views: w.posts * w.avg_views,
  })),
};

// Audits — list (mixed reviewed / needs-review) + one detail with a coach
// narrative and every change state: undecided (with diff + autopilot hours),
// approved/applied (measuring effect), and rejected (with a note).
const AUDITS_LIST = {
  count: 3,
  audits: [
    {
      id: 4101,
      account_id: 1,
      period_start: "2026-05-25",
      period_end: "2026-05-31",
      posts_analyzed: 18,
      proposed_change_count: 4,
      decided_change_count: 2,
      status: "partial_approved",
      week_over_week_delta_pct: 8.2,
      created_at: "2026-06-01T09:00:00Z",
      applied_at: null,
    },
    {
      id: 4100,
      account_id: 1,
      period_start: "2026-05-18",
      period_end: "2026-05-24",
      posts_analyzed: 21,
      proposed_change_count: 3,
      decided_change_count: 3,
      status: "fully_approved",
      week_over_week_delta_pct: -4.1,
      created_at: "2026-05-25T09:00:00Z",
      applied_at: "2026-05-25T12:00:00Z",
    },
    {
      id: 4099,
      account_id: 1,
      period_start: "2026-05-11",
      period_end: "2026-05-17",
      posts_analyzed: 16,
      proposed_change_count: 2,
      decided_change_count: 0,
      status: "pending",
      week_over_week_delta_pct: 2.5,
      created_at: "2026-05-18T09:00:00Z",
      applied_at: null,
    },
  ],
};
const AUDIT_DETAIL = {
  id: 4101,
  account_id: 1,
  period_start: "2026-05-25",
  period_end: "2026-05-31",
  posts_analyzed: 18,
  metrics_summary: {},
  week_over_week: { delta_pct: 8.2 },
  llm_reasoning:
    "Your shortest posts pulled the most engagement this week — the three under 120 characters out-performed your average by a wide margin.\n\nI'd lean further into that: tighten the opening line and cut the wind-up. I've drafted two small voice edits and a posting-time tweak below.",
  llm_model: "claude",
  status: "partial_approved",
  user_comments: {},
  applied_at: null,
  created_at: "2026-06-01T09:00:00Z",
  proposed_changes: [
    {
      id: "c-a",
      kind: "prompt_edit",
      title: "Open with the claim, not the wind-up",
      detail:
        "Several posts buried the point under a throat-clearing first line. Lead with the strongest sentence.",
      target_section: "voice_characteristics",
      diff: {
        before: "Ease readers in with a gentle, relatable opening.",
        after: "Open on the sharpest line — the claim, not the warm-up.",
      },
    },
    {
      id: "c-b",
      kind: "prompt_edit",
      title: "Trim hedging language",
      detail: "Words like “maybe” and “kind of” softened otherwise strong takes.",
      target_section: "dont_list",
      diff: { before: "(none)", after: "Avoid hedges: maybe, sort of, I think, kind of." },
    },
    {
      id: "c-c",
      kind: "autopilot_config",
      title: "Shift the daily post earlier",
      detail: "Your 9:00 posts settled lower than the 18:00 ones. Try both windows.",
      payload: { post_hours: [9, 18] },
    },
    {
      id: "c-d",
      kind: "prompt_edit",
      title: "Add more rhetorical questions",
      detail: "Questions can invite replies — but they don't fit every voice.",
      target_section: "voice_characteristics",
      diff: { before: "(none)", after: "Open ~1 in 4 posts with a question." },
    },
  ],
  decisions: [
    {
      id: 9001,
      change_id: "c-b",
      kind: "prompt_edit",
      approved: true,
      user_comment: null,
      decided_at: "2026-06-01T10:00:00Z",
      applied_change: { version_id: 77 },
      rolled_back: false,
      effect_pct: null,
      engagement_before_pct: null,
      engagement_after_pct: null,
    },
    {
      id: 9002,
      change_id: "c-d",
      kind: "prompt_edit",
      approved: false,
      user_comment: "Not my style — I rarely ask questions.",
      decided_at: "2026-06-01T10:01:00Z",
      applied_change: null,
      rolled_back: false,
      effect_pct: null,
      engagement_before_pct: null,
      engagement_after_pct: null,
    },
  ],
};

// Self pattern-study — 3 patterns over the account's own posts (strong length
// signal + two worth-testing), each with evidence sides and example posts.
const STUDY = {
  posts_analyzed: 47,
  patterns: [
    {
      key: "length",
      lead_group: "short",
      strength: "strong",
      sample: 24,
      delta_pct: 38.0,
      lead: { value: 14200, display: "14.2K", sample: 24 },
      base: { value: 10300, display: "10.3K", sample: 23 },
      examples: [
        { text: "Cut 600 words this morning. The 400 that survived are the only ones that mattered.", views: 22400, display: "22.4K" },
        { text: "Start before you feel ready.", views: 18800, display: "18.8K" },
      ],
    },
    {
      key: "question",
      lead_group: "with",
      strength: "worth_testing",
      sample: 11,
      delta_pct: 12.5,
      lead: { value: 12900, display: "12.9K", sample: 11 },
      base: { value: 11500, display: "11.5K", sample: 36 },
      examples: [
        { text: "What's the one line you'd keep if you could keep only one?", views: 16100, display: "16.1K" },
      ],
    },
    {
      key: "emoji",
      lead_group: "without",
      strength: "worth_testing",
      sample: 31,
      delta_pct: 9.2,
      lead: { value: 12400, display: "12.4K", sample: 31 },
      base: { value: 11400, display: "11.4K", sample: 16 },
      examples: [
        { text: "Stop optimizing your first sentence. Optimize the reason to care by the third.", views: 15600, display: "15.6K" },
      ],
    },
  ],
};

// Autopilot — master ON (green card + Active pill), two scheduled posts (one
// enabled, one paused), an active reply policy, and a populated activity log.
const AUTOPILOT_CONFIG = {
  enabled: true,
  post_enabled: false,
  posts_per_day: 1,
  quiet_start_hour: null,
  quiet_end_hour: null,
  reply_enabled: true,
  reply_audience: "all_except_trolls",
  replies_per_day: 25,
};
const AUTOPOST_RULES = {
  master_enabled: true,
  topics: [
    { id: 1, label: "Writing craft" },
    { id: 2, label: "Habits" },
  ],
  rules: [
    {
      id: 1,
      name: "Morning thought",
      topic_id: 1,
      post_hour: 6,
      jitter_minutes: 15,
      enabled: true,
      auto_reply: true,
      reply_audience: "all_except_trolls",
      replies_per_day: 5,
    },
    {
      id: 2,
      name: "Evening reflection",
      topic_id: null,
      post_hour: 15,
      jitter_minutes: 0,
      enabled: false,
      auto_reply: false,
      reply_audience: "fans",
      replies_per_day: 3,
    },
  ],
};
const AUTOPOST_ACTIVITY = {
  rules: [
    { id: 1, name: "Morning thought", enabled: true, last_post_at: "2026-06-01T06:00:00Z", posts_today: 1, last_reply_at: "2026-06-01T07:00:00Z", replies_today: 2 },
    { id: 2, name: "Evening reflection", enabled: false, last_post_at: null, posts_today: 0, last_reply_at: null, replies_today: 0 },
  ],
  posts: [
    {
      post_id: 8801,
      rule_id: 1,
      rule_name: "Morning thought",
      text: "The fastest way to find your voice online: publish the thing you're slightly embarrassed by.",
      published_at: "2026-06-01T06:05:00Z",
      views: 3200,
      likes: 140,
      comments: 9,
      threads_url: "https://www.threads.net/@mara.lin/post/8801",
    },
  ],
  replies: [
    {
      comment_id: 701,
      author_username: "devon.makes",
      comment_text: "how do you actually decide what to cut?",
      reply_text: "honestly? if a line is only there to sound smart, it goes. I keep the ones that would still be true even if no one read them.",
      replied_at: "2026-06-01T07:02:00Z",
      post_threads_url: "https://www.threads.net/@mara.lin/post/8801",
    },
  ],
};

// Voice (role-book) — a populated book + a lint result with one high
// conflict (one-click fix) and one medium caution (manual).
const ROLE_BOOK = {
  role_book_id: 12,
  name: "Mara Lin",
  created_by: "extract",
  parent_id: 11,
  activated_at: "2026-05-30T14:00:00Z",
  posts_analyzed: 47,
  sections: {
    intro: "A working writer sharing the craft in plain, lived-in language — never lecturing, always mid-thought.",
    themes_include: ["Writing craft", "Habits & consistency"],
    themes_exclude: ["Crypto / NFTs"],
    voice_characteristics: ["Short, declarative sentences", "Lead with the claim, not the wind-up"],
    do_list: ["Open with a concrete moment", "End on a line that resonates"],
    dont_list: ["No hashtags", "No corporate buzzwords"],
    examples: [
      { id: "ex1", context: "post", text: "Cut 600 words this morning. The 400 that survived are the only ones that ever mattered." },
      { id: "ex2", context: "reply", text: "Start before you feel ready — the deciding never ends, the publishing is the only part that teaches you anything." },
    ],
  },
  prompt_text:
    "You are Mara Lin, a working writer. Write in short, declarative sentences. Lead with the claim. Topics: writing craft, habits. Never: crypto. Avoid hashtags and corporate buzzwords.",
};
const VOICE_LINT = {
  conflicts: [
    {
      severity: "high",
      title: "Two rules disagree on length",
      description:
        "One trait asks for short, declarative lines, but an example runs long and discursive — drafts get mixed signals about how tight to be.",
      items: [
        { section: "voice_characteristics", text: "Short, declarative sentences" },
        { section: "examples", text: "Cut 600 words this morning. The 400 that survived are the only ones that ever mattered." },
      ],
      suggestion: "Drop the long example, or soften the 'short sentences' rule to allow the occasional longer line.",
      fix: { kind: "remove_item", section: "examples", text: "Cut 600 words this morning. The 400 that survived are the only ones that ever mattered." },
    },
    {
      severity: "medium",
      title: "Possible tension around discoverability",
      description: "The don't-list bans hashtags, which is fine — just confirm you're not relying on them for reach.",
      items: [{ section: "dont_list", text: "No hashtags" }],
      suggestion: "Keep as-is if hashtags aren't your style.",
      fix: null,
    },
  ],
  linted_sections: {},
  llm_model: "claude",
  prompt_tokens: 0,
  completion_tokens: 0,
  latency_ms: 0,
};

// Style rules — built-in anti-AI catalog across categories (one off) + a
// couple of the account's own freeform rules.
const STYLE_RULES = {
  rules: [
    { key: "human_punctuation", kind: "both", category: "punctuation", title: "Simple punctuation (no em-dashes or guillemets)", body: "Use plain hyphens and straight quotes — typographic dashes are the loudest AI tell.", enabled: true },
    { key: "no_antithesis", kind: "both", category: "structure", title: "No “not just X, it’s Y”", body: "Kill the not-just-but reversal and other templated contrasts that read as filler.", enabled: true },
    { key: "no_ai_buzzwords", kind: "both", category: "diction", title: "Ban AI buzzwords", body: "No “delve”, “leverage”, “seamless”, “robust”. Name the concrete thing instead.", enabled: true },
    { key: "be_concrete", kind: "both", category: "diction", title: "Concrete over abstract", body: "Examples, numbers, names — vagueness is what gives generated text away.", enabled: true },
    { key: "vary_rhythm", kind: "post", category: "cadence", title: "Vary sentence rhythm", body: "Mix short lines with long ones. Uniform medium sentences are the rhythm of a machine.", enabled: true },
    { key: "plain_formatting", kind: "both", category: "formatting", title: "Plain formatting", body: "Solid prose — no headers, bullet lists, or emoji bullets.", enabled: false },
    { key: "no_hedging", kind: "both", category: "tone", title: "No hedging filler", body: "Cut “I think”, “arguably”, “it could be said”. Commit to the sentence.", enabled: true },
  ],
};
const USER_RULES = {
  rules: [
    { id: 1, kind: "reply", body: "Never open a reply with “Great question!” or “Love this.”", enabled: true, sort_order: 0 },
    { id: 2, kind: "post", body: "Quote a specific detail from their post — never a generic platitude.", enabled: true, sort_order: 1 },
  ],
};

// Explore patterns — analysis of pasted admired posts. Each pattern carries the
// reworked fields: a `kind` tag, the `spotted` source line, and a voice-matched
// `example` (drives the redesigned Explore card).
const EXPLORE_RESULT = {
  patterns: [
    {
      name: "The concrete number",
      kind: "Hook",
      technique:
        "Opens on one exact, slightly surprising figure instead of a vague claim — so the reader has something specific to picture before any point is made.",
      why_it_works: "A precise number reads as reported, not performed. It feels true before you've argued anything.",
      spotted: "I deleted 40,000 followers worth of old posts last night.",
      example: "I cut 600 words out of this post before you ever saw it. What's left is the only part that was working.",
      suggested_do_rule: "open on a specific number, not a vague claim",
    },
    {
      name: "The quarter-turn reframe",
      kind: "Structure",
      technique:
        "States a belief the reader already holds, then rotates it one notch so the same idea is suddenly seen from a sharper angle.",
      why_it_works: "People rarely share what they agree with — they share what quietly reorganizes something they already knew.",
      spotted: "Most advice is autobiography in disguise.",
      example: "You don't find your voice by writing more. You find it by deleting every line that sounds like someone else.",
      suggested_do_rule: "take a familiar idea, turn it one notch",
    },
    {
      name: "The withheld turn",
      kind: "Cadence",
      technique: "Sets up an expectation in the opener, then holds the payoff back until a short final line that lands on its own.",
      why_it_works: "The gap between setup and payoff is where attention lives. A hard last line gives the reader a place to stop.",
      spotted: "It's the one you almost didn't publish.",
      example: "I rewrote this opening nine times. The version you're reading is the one I almost deleted.",
      suggested_do_rule: "end on a short line, let it land alone",
    },
  ],
  summary: "Three moves worth stealing — and every one of them is about restraint, not volume.",
  samples_analyzed: 3,
  llm_model: "claude",
  prompt_tokens: 0,
  completion_tokens: 0,
  latency_ms: 1840,
};

async function setup(page: Page): Promise<void> {
  // Seed a token + selected account + locale before any app code runs.
  await page.addInitScript(() => {
    localStorage.setItem(
      "pennedly.tokens",
      JSON.stringify({
        access_token: "mock",
        refresh_token: "mock",
        refresh_expires_at: "2099-01-01T00:00:00Z",
      }),
    );
    localStorage.setItem("pennedly.selectedAccountId", "1");
    localStorage.setItem("pennedly.locale", "en");
  });

  // Intercept every backend call with a fixture; real API is never reached.
  await page.route("**/api/**", async (route) => {
    const p = new URL(route.request().url()).pathname;
    const json = (body: unknown) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });

    if (p.endsWith("/api/me")) return json(ME);
    if (p.endsWith("/api/me/accounts")) return json({ accounts: ACCOUNTS });
    if (p.includes("/onboarding"))
      return json({ needs_onboarding: false, has_role_book: true, post_count: 47, can_analyze: true });
    if (p.includes("/patterns/analyze")) return json(EXPLORE_RESULT);
    if (p.includes("/patterns/study")) return json(STUDY);
    if (p.includes("/feed")) return json(FEED);
    if (p.includes("/mentions")) return json(MENTIONS);
    if (p.includes("/comments")) return json(COMMENTS);
    if (p.includes("/stats")) return json(STATS);
    if (/\/audits\/\d+$/.test(p)) return json(AUDIT_DETAIL);
    if (p.includes("/audits")) return json(AUDITS_LIST);
    if (p.endsWith("/autopost-rules")) return json(AUTOPOST_RULES);
    if (p.includes("/autopost-activity")) return json(AUTOPOST_ACTIVITY);
    if (p.endsWith("/autopilot")) return json(AUTOPILOT_CONFIG);
    if (p.includes("/role-book/lint")) return json(VOICE_LINT);
    if (p.includes("/role-book/apply-fix") || p.includes("/role-book/extract"))
      return json(ROLE_BOOK);
    if (p.includes("/role-book")) return json(ROLE_BOOK);
    if (p.includes("/style-rules")) return json(STYLE_RULES);
    if (p.includes("/user-rules")) return json(USER_RULES);
    if (p.includes("/generation/posts/batch"))
      return json({
        drafts: [{ text: "Start before you feel ready. The version of you that waits never ships.", latency_ms: 720, topic_label: "Shipping", prompt_tokens: 0, completion_tokens: 0 }],
        errors: [],
        succeeded: 2,
        requested: 2,
      });
    if (p.includes("/generation/posts"))
      return json({ text: "Start before you feel ready. The version of you that waits never ships.", latency_ms: 720, topic_label: "Shipping", prompt_tokens: 0, completion_tokens: 0 });
    if (p.includes("/drafts")) return json({ drafts: DRAFTS, count: DRAFTS.length });
    // Safe default — most list endpoints tolerate an empty array.
    return json([]);
  });
}

async function shoot(page: Page, name: string): Promise<void> {
  // Hide Next.js dev overlays so they don't sit on top of the UI in shots.
  await page
    .addStyleTag({ content: "nextjs-portal,[data-nextjs-toast]{display:none!important}" })
    .catch(() => {});
  // Settle after each theme toggle: elements with `transition-colors` animate
  // bg/border from the old theme, and a screenshot fired immediately catches
  // them mid-transition (looking light in the dark shot). On prod the theme is
  // set before paint, so there's no transition — this only matters here.
  await page.evaluate(() => document.documentElement.classList.remove("dark"));
  await page.waitForTimeout(260);
  await page.screenshot({ path: `test-results/visual/${name}-light.png` });
  await page.evaluate(() => document.documentElement.classList.add("dark"));
  await page.waitForTimeout(260);
  await page.screenshot({ path: `test-results/visual/${name}-dark.png` });
  await page.evaluate(() => document.documentElement.classList.remove("dark"));
}

test("shell — Studio", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await setup(page);
  await page.goto("/app");
  // Shell renders once the (mocked) account-presence check resolves.
  await page.waitForSelector("aside", { state: "visible", timeout: 15_000 });
  await page.waitForTimeout(700);
  await shoot(page, "shell-studio");
  // Pending-tab card (Q25: one primary "approve" + a ⋯-overflow for the rest).
  await page.getByRole("button", { name: /drafts/i }).first().click();
  await page.waitForTimeout(400);
  await shoot(page, "shell-studio-drafts");
  // Q25: open the ⋯ menu (tweak / edit / reject / delete, the last two danger).
  await page.getByRole("button", { name: /more actions/i }).first().click();
  await page.waitForTimeout(250);
  await shoot(page, "shell-studio-menu");
  await page.mouse.click(6, 6); // outside-click closes the menu
  await page.waitForTimeout(200);
  // Consolidated account/profile menu (switch account · connect · settings · log out).
  await page.locator("aside").getByRole("button", { name: /mara\.lin/i }).first().click();
  await page.waitForTimeout(300);
  await shoot(page, "shell-studio-account");
});

test("Studio — generate", async ({ page }) => {
  // After generating, the new drafts must show in the feed under the "drafts"
  // (pending) tab — with NO duplicate "last generated" preview card above it.
  // Regression for the reported dup (2 drafts shown below + 1 echoed on top).
  await page.setViewportSize({ width: 1280, height: 900 });
  await setup(page);
  await page.goto("/app");
  await page.waitForSelector("aside", { state: "visible", timeout: 15_000 });
  await page.waitForTimeout(700);
  await page.locator("textarea").first().fill("shipping before you're ready");
  await page.getByRole("button", { name: /generate/i }).click();
  await page.waitForTimeout(900);
  await shoot(page, "studio-generated");
});

test("Feed", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  await setup(page);
  await page.goto("/app/feed");
  await page.waitForSelector("aside", { state: "visible", timeout: 15_000 });
  await page.waitForTimeout(700);
  await shoot(page, "feed");
});

test("Mentions", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await setup(page);
  await page.goto("/app/mentions");
  await page.waitForSelector("aside", { state: "visible", timeout: 15_000 });
  await page.waitForTimeout(700);
  await shoot(page, "mentions");
});

test("Replies", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1200 });
  await setup(page);
  await page.goto("/app/replies");
  await page.waitForSelector("aside", { state: "visible", timeout: 15_000 });
  await page.waitForTimeout(700);
  await shoot(page, "replies");
});

test("Stats", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  await setup(page);
  await page.goto("/app/stats");
  await page.waitForSelector("aside", { state: "visible", timeout: 15_000 });
  await page.waitForTimeout(700);
  await shoot(page, "stats");
});

test("Audits — list", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await setup(page);
  await page.goto("/app/audits");
  await page.waitForSelector("aside", { state: "visible", timeout: 15_000 });
  await page.waitForTimeout(700);
  await shoot(page, "audits-list");
});

test("Audits — detail", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1300 });
  await setup(page);
  await page.goto("/app/audits/4101");
  await page.waitForSelector("aside", { state: "visible", timeout: 15_000 });
  await page.waitForTimeout(700);
  await shoot(page, "audits-detail");
});

test("Patterns", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1100 });
  await setup(page);
  await page.goto("/app/patterns");
  await page.waitForSelector("aside", { state: "visible", timeout: 15_000 });
  await page.waitForTimeout(700);
  await shoot(page, "patterns-idle");
  // Run a study → the deterministic results view.
  await page.getByRole("button", { name: /run a study/i }).click();
  await page.waitForTimeout(3400);
  await shoot(page, "patterns");
});

test("Explore patterns", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1300 });
  await setup(page);
  await page.goto("/app/patterns/explore");
  await page.waitForSelector("aside", { state: "visible", timeout: 15_000 });
  await page.waitForTimeout(700);
  await shoot(page, "explore-input");
  // Seed a sample set → analyze → results (kind tag · spotted line · voice example).
  await page.getByRole("button", { name: /try a sample set/i }).click();
  await page.waitForTimeout(150);
  await page.getByRole("button", { name: /analyze the craft/i }).click();
  await page.waitForTimeout(1300);
  await shoot(page, "explore-results");
});

test("Autopilot", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1400 });
  await setup(page);
  await page.goto("/app/autopilot");
  await page.waitForSelector("aside", { state: "visible", timeout: 15_000 });
  await page.waitForTimeout(700);
  await shoot(page, "autopilot");
});

test("Voice", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1500 });
  await setup(page);
  await page.goto("/app/role-book");
  await page.waitForSelector("aside", { state: "visible", timeout: 15_000 });
  await page.waitForTimeout(700);
  await shoot(page, "voice");
  // Run the conflict check → the voice-check panel.
  await page.getByRole("button", { name: /check voice/i }).click();
  await page.waitForTimeout(900);
  await shoot(page, "voice-check");
});

test("Style rules", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1300 });
  await setup(page);
  await page.goto("/app/style-rules");
  await page.waitForSelector("aside", { state: "visible", timeout: 15_000 });
  await page.waitForTimeout(700);
  await shoot(page, "style-rules");
});

test("Settings", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1100 });
  await setup(page);
  await page.goto("/app/settings");
  await page.waitForSelector("aside", { state: "visible", timeout: 15_000 });
  await page.waitForTimeout(700);
  await shoot(page, "settings");
});

test("Onboarding", async ({ page }) => {
  // Full-screen flow — no sidebar; wait on its own header instead of `aside`.
  await page.setViewportSize({ width: 1280, height: 1000 });
  await setup(page);
  await page.goto("/app/onboarding");
  await page.waitForSelector("header", { state: "visible", timeout: 15_000 });
  await page.waitForTimeout(1000);
  await shoot(page, "onboarding");
  // Continue (analyze) → the progress + done step.
  await page.getByRole("button", { name: /continue/i }).click();
  await page.waitForTimeout(3400);
  await shoot(page, "onboarding-done");
  // Q32: returning from OAuth (?threads_connected=1) shows the connected-account
  // confirmation card (avatar + handle + Connected pill + Continue), not a redirect.
  await page.goto("/app/onboarding?threads_connected=1");
  await page.waitForSelector("header", { state: "visible", timeout: 15_000 });
  await page.waitForTimeout(1000);
  await shoot(page, "onboarding-connected");
});

test("Login", async ({ page }) => {
  // Full-screen, shell-exempt — no sidebar; wait on the card's <h1>.
  await page.setViewportSize({ width: 1280, height: 900 });
  await setup(page);
  await page.goto("/app/login");
  await page.waitForSelector("h1", { state: "visible", timeout: 15_000 });
  await page.waitForTimeout(500);
  await shoot(page, "login");
  // Request a code → the 6-cell OTP view.
  await page.getByPlaceholder("you@example.com").fill("mara@pennedly.app");
  await page.getByRole("button", { name: /email me a code/i }).click();
  await page.waitForTimeout(600);
  await shoot(page, "login-code");
});

test("Landing", async ({ page }) => {
  // Public marketing page at / — no app shell, no API calls; wait on the top bar.
  await page.setViewportSize({ width: 1280, height: 900 });
  await setup(page);
  await page.goto("/");
  await page.waitForSelector("header", { state: "visible", timeout: 15_000 });
  await page.waitForTimeout(700);
  await shoot(page, "landing");
});

test("Legal", async ({ page }) => {
  // Public legal template (/privacy, /terms, /data-deletion) — no app shell;
  // wait on the sticky top bar.
  await page.setViewportSize({ width: 1280, height: 1400 });
  await setup(page);
  for (const [route, name] of [
    ["/privacy", "legal-privacy"],
    ["/terms", "legal-terms"],
    ["/data-deletion", "legal-data-deletion"],
  ] as const) {
    await page.goto(route);
    await page.waitForSelector("header", { state: "visible", timeout: 15_000 });
    await page.waitForTimeout(500);
    await shoot(page, name);
  }
});
