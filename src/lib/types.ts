// API response types — mirror pydantic models from pennedly-backend.

export type TokenPair = {
  access_token: string;
  refresh_token: string;
  refresh_expires_at: string;
};

export type Tenant = {
  id: number;
  name: string;
  slug: string | null;
  plan_tier: string;
  accounts_limit: number;
};

export type Me = {
  user_id: number;
  email: string;
  display_name: string | null;
  tenant: Tenant;
  // Allowlisted tester accounts see the round-2 UIs (replies / mentions /
  // posts) and get the full Threads scope set. Everyone else sees round-1.
  is_tester: boolean;
  // Persisted UI language (one of the 8 codes), or null if never set.
  // Server-generated copy (weekly audit) is written in it.
  locale: string | null;
  // The signed-in user's Google profile photo URL, or null (magic-link /
  // dev-login, or a Google account without a picture).
  avatar_url: string | null;
};

export type ConnectedAccount = {
  id: number;
  tenant_id: number;
  threads_user_id: string;
  username: string | null;
  display_name: string | null;
  profile_picture_url: string | null;
  connected_at: string;
  disconnected_at: string | null;
};

export type AccountsList = {
  accounts: ConnectedAccount[];
};

// Response from GET /api/threads/oauth/start — the Meta authorize URL the
// browser should navigate to, plus the CSRF state (already persisted
// server-side; returned for debugging/telemetry only).
export type ThreadsConnectStart = {
  authorize_url: string;
  state: string;
};

// Q16: an example post carries its context ("post" | "reply") + text. The
// editor keeps it typed so the context survives an edit (the other sections
// are still display-flattened to strings by the interim flattenSections).
// Q60: role-book section items are typed objects with a stable `id`, not bare
// strings. Each section has a primary text field + an optional secondary:
//   themes_include / themes_exclude → { id, label, note }  (note is editor-only
//     for exclude — only `label` reaches the prompt; primary field = label)
//   voice_characteristics           → { id, label?, text } (primary = text)
//   do_list / dont_list             → { id, text }
//   examples                        → { id, context, text } (context editor-only)
// The backend normalizes on save (preserves a non-blank id, generates one
// otherwise, drops an item whose primary field is blank). A legacy bare string
// is coerced to its section's primary field on read.
export type RoleBookThemeItem = {
  id?: string;
  label: string;
  note?: string;
};

export type RoleBookTraitItem = {
  id?: string;
  label?: string;
  text: string;
};

export type RoleBookRuleItem = {
  id?: string;
  text: string;
};

export type RoleBookExample = {
  id?: string;
  context: string;
  text: string;
};

export type RoleBookSections = {
  intro?: string;
  themes_include?: RoleBookThemeItem[];
  themes_exclude?: RoleBookThemeItem[];
  voice_characteristics?: RoleBookTraitItem[];
  do_list?: RoleBookRuleItem[];
  dont_list?: RoleBookRuleItem[];
  examples?: RoleBookExample[];
};

export type RoleBook = {
  role_book_id: number;
  name: string;
  sections: RoleBookSections | null;
  prompt_text: string;
  created_by: string;
  parent_id: number | null;
  activated_at: string | null;
  // Q67: how many posts this voice was extracted from (null for a from-scratch
  // or pre-column voice) — drives the "Analyzed N posts · Updated <date>" hero.
  posts_analyzed: number | null;
};

// ── Onboarding ───────────────────────────────────────────────────────
// Mirrors api/onboarding.py. First-run setup: an account with no active
// role_book needs_onboarding; can_analyze gates the "analyze my posts"
// branch (needs ≥5 usable posts).

export type OnboardingStatus = {
  needs_onboarding: boolean;
  has_role_book: boolean;
  post_count: number;
  can_analyze: boolean;
  min_posts_to_analyze: number; // Q53 — the post_count gate `can_analyze` checks
};

export type FromScratchInput = {
  intro: string;
  themes_include: string[];
  themes_exclude: string[];
  voice_characteristics?: string[];
  do_list?: string[];
  dont_list?: string[];
  examples?: string[];
};

export type OnboardingResult = {
  role_book_id: number;
  needs_onboarding: boolean;
  posts_analyzed: number | null;
};

// Tester-only "preview": the voice an onboarding run would produce,
// computed but NOT saved (saved === false always).
export type OnboardingPreview = {
  saved: boolean;
  sections: RoleBookSections;
  prompt_text: string;
  posts_analyzed: number | null;
  would_seed_topics: string[];
};

// ── Stats (analytics dashboard) ──────────────────────────────────────
// Mirrors api/stats.py.

export type StatsPeriod = "today" | "yesterday" | "7d" | "30d" | "90d" | "all";

export type TierCounts = {
  viral: number;
  good: number;
  mid: number;
  flop: number;
};

export type PeriodSummary = {
  posts: number;
  views: number;
  likes: number;
  comments: number;
  avg_views: number;
  avg_likes: number;
  avg_comments: number;
  tier_counts: TierCounts;
};

export type StatsDeltas = {
  views_pct: number | null;
  posts_pct: number | null;
  likes_pct: number | null;
  comments_pct: number | null;
};

export type StatsBucket = {
  // Local-time bucket start, naive ISO (the client formats it per locale).
  // Gap-filled: every bucket in the window is present, empty ones zero.
  bucket_start: string;
  posts: number;
  avg_views: number;
  sum_views: number;
};

export type StatsTopPost = {
  post_id: number;
  text: string; // snippet (≤160 chars)
  published_at: string;
  views: number;
  likes: number;
  comments: number;
  viral_tier: string | null;
  threads_url: string | null;
  // views ÷ the window's avg views/post ("N× your average"); null when the
  // window average is 0.
  vs_avg: number | null;
};

export type StatsTimeSlot = {
  slot: number; // local publish hour 0-23 (by_hour) / ISO weekday 1=Mon..7=Sun (by_weekday)
  posts: number;
  avg_views: number;
};

// Best-time-to-post heatmap cell. weekday: ISO 1=Mon..7=Sun. block: 0=morning
// (06–11) · 1=day (12–17) · 2=evening (18–23) · 3=night (00–05), viewer-local.
export type HeatCell = {
  weekday: number;
  block: number;
  posts: number;
  avg_views: number;
};

export type StatsResponse = {
  period: string;
  current: PeriodSummary;
  previous: PeriodSummary | null;
  deltas: StatsDeltas | null;
  series: StatsBucket[];
  top_posts: StatsTopPost[];
  by_hour: StatsTimeSlot[];
  by_weekday: StatsTimeSlot[];
  // Best-time-to-post heatmap: avg views per weekday × time-of-day block.
  heatmap: HeatCell[];
  // ISO timestamp of the last metrics pull from Threads (hourly cron or a
  // manual refresh), or null if never synced — drives the "updated N ago" label.
  refreshed_at: string | null;
};

// POST /accounts/{id}/stats/refresh — pulls fresh metrics on demand (all recent
// post insights + the follower count). `refreshed` is false when the throttle
// short-circuited because the data is already recent.
export type RefreshStatsResponse = {
  refreshed: boolean;
  refreshed_at: string | null;
  posts: number;
  followers: number;
};

export type GeneratedDraft = {
  draft_id: number;
  text: string;
  model: string;
  topic_id: number | null;
  topic_label: string | null;
  examples_used: number;
  prompt_tokens: number;
  completion_tokens: number;
  latency_ms: number;
};

export type Idea = {
  hook: string;
  angle: string;
};

export type IdeasResult = {
  ideas: Idea[];
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  latency_ms: number;
};

export type BatchGenerateError = {
  error_kind: "quota" | "generation" | "unknown";
  detail: string;
};

export type BatchGenerateResult = {
  drafts: GeneratedDraft[];
  errors: BatchGenerateError[];
  requested: number;
  succeeded: number;
};

// One image attached to a post draft. `url` is a relative `/media/...` path
// the backend serves — wrap it in `api.mediaUrl()` before putting it in <img>.
export type MediaItem = { url: string };

// The single video attached to a post draft (mutually exclusive with images).
// `url` is a relative `/media/...` path — wrap in `api.mediaUrl()`.
export type DraftVideo = { url: string };

export type MediaUploadResponse = {
  url: string;
  content_type: string;
  bytes: number;
};

// An OpenGraph link-preview card, built server-side from a URL in a post body
// (Threads' API returns only the raw URL, so Pennedly generates the card).
export type LinkPreview = {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  site_name: string | null;
};

export type DraftSummary = {
  id: number;
  account_id: number;
  content_type: string;
  status: string;
  generated_text: string;
  llm_model: string | null;
  topic_label: string | null;
  is_skip: boolean | null;
  created_at: string;
  // Publish state — a published draft (manual or autopilot) has a posts
  // row behind it. Lets the dashboard hide "Publish" + link out instead.
  published: boolean;
  threads_url: string | null;
  // Manual scheduling (Calendar) — the future UTC time this approved post is
  // queued for (null = not scheduled) + whether its last scheduled publish
  // failed. Drives the Studio "Scheduled · date" badge + the Scheduled filter.
  scheduled_at: string | null;
  schedule_failed: boolean;
  // Q62: for a reply draft (content_type === "comment_reply"), the comment it
  // answers — who wrote it + their text. null for posts. Studio renders these
  // read-only (generation/approval happen on /app/replies).
  reply_to: { who: string | null; text: string } | null;
  // Images attached to a post draft (empty for text-only posts or replies).
  media: MediaItem[];
  // The one video attached to a post draft (null for text-only/image posts or
  // replies). Mutually exclusive with `media`.
  video: DraftVideo | null;
};

export type DraftsList = {
  drafts: DraftSummary[];
  count: number;
};

export type ApprovalResult = {
  draft_id: number;
  status: string;
  approved_content_id: number | null;
  edited?: boolean;
};

export type ScheduleResult = {
  draft_id: number;
  scheduled_at: string | null;
};

// Content Calendar — one upcoming entry, manual (a scheduled draft) or a
// projected autopilot occurrence. Times are ISO-8601 UTC.
export type CalendarEntry = {
  id: string; // "draft-<id>" (manual) | "rule-<id>-<date>" (projection)
  source: "manual" | "autopilot";
  status: "scheduled" | "failed" | "projected";
  scheduled_at: string;
  text: string | null; // null for projections — written at post time
  rule_name?: string | null;
  error?: string | null;
};

export type CalendarFeed = { entries: CalendarEntry[] };

export type PublishResult = {
  draft_id: number;
  status: string;
  threads_post_id: string;
  published_at: string;
};

// A comment under one of the user's posts (the reply queue), with its
// linked AI reply draft joined in (present once a reply is generated).
export type CommentSummary = {
  id: number;
  account_id: number;
  post_id: number;
  threads_comment_id: string;
  author_username: string | null;
  text: string | null;
  comment_url: string | null;
  status: string; // "new" | "drafted" | "replied"
  published_at: string | null;
  created_at: string;
  // The post this comment is under (context for the reply UI).
  post_text: string | null;
  post_published_at: string | null;
  post_threads_url: string | null;
  ai_draft_id: number | null;
  draft_text: string | null;
  draft_status: string | null; // "pending" | "approved" | "rejected"
  draft_is_skip: boolean | null;
  draft_media: { url: string; alt: string | null }[]; // images on the reply draft
  replied_at: string | null;
  reply_threads_post_id: string | null;
  // Q3: the reply went out via the Autopilot auto-reply sweep, not a manual
  // approval — surfaced as an "Auto-replied by Pennedly" badge.
  auto_replied: boolean;
};

export type CommentsList = {
  comments: CommentSummary[];
  count: number;
  // Account-wide totals per comment status (new / drafted / replied /
  // skipped), for the reply-queue filter tabs.
  status_counts: Record<string, number>;
};

// One row per post that HAS comments — drives the Replies post rail. Paginated
// by POST (newest post first), so the rail and the per-post comment-count
// badges stay correct regardless of how many comments each post has.
export type CommentPost = {
  post_id: number;
  post_text: string | null;
  post_published_at: string | null;
  post_threads_url: string | null;
  total: number; // all comments under this post
  unanswered: number; // comments not yet replied/skipped
};

export type CommentPostsList = {
  posts: CommentPost[];
  count: number;
  // Account-wide totals per comment status (same shape as CommentsList).
  status_counts: Record<string, number>;
};

export type GeneratedReply = {
  draft_id: number;
  text: string;
  model: string;
  // The reply generator may decide a comment isn't worth replying to
  // (spam, trolling, nothing to add) — then is_skip is true and no real
  // reply is produced.
  is_skip: boolean;
  examples_used: number;
  prompt_tokens: number;
  completion_tokens: number;
  latency_ms: number;
};

// A standalone Threads post elsewhere that @-mentions the account
// (filled by the ingest_mentions worker). Read-only for now.
export type MentionSummary = {
  id: number;
  account_id: number;
  threads_mention_id: string;
  author_username: string | null;
  text: string | null;
  permalink: string | null;
  status: string;
  published_at: string | null;
  created_at: string;
};

export type MentionsList = {
  mentions: MentionSummary[];
  count: number;
};

// A live published post on the account (for the published-posts list +
// delete action).
export type PostSummary = {
  id: number;
  account_id: number;
  threads_post_id: string;
  threads_url: string | null;
  text: string | null;
  published_at: string | null;
  views: number;
  likes: number;
  replies_count: number;
  viral_tier: string | null;
};

export type PostsList = {
  posts: PostSummary[];
  count: number;
};

export type DeletePostResult = {
  post_id: number;
  status: string;
  threads_post_id: string;
  deleted_at: string;
};

export type DeleteDraftResult = {
  draft_id: number;
  status: string;
};

// ── My Feed (posts + inline analytics) ───────────────────────────────
// Mirrors api/feed.py. The account's own posts, each with how it did
// relative to the account's recent average (vs_avg_views = "N× your
// usual"), plus a reference baseline block for the header.

export type FeedPost = {
  id: number;
  threads_post_id: string;
  threads_url: string | null;
  text: string | null;
  published_at: string | null;
  views: number;
  likes: number;
  reposts: number;
  comments_count: number;
  viral_tier: string | null; // viral / good / mid / flop
  viral_score: number | null;
  vs_avg_views: number | null; // views ÷ recent-average views
  is_fresh: boolean; // published < 24h ago — still settling
  auto_reply: boolean | null; // per-post override; null = inherit the account reply_mode
  // Media carried by the post: relative /media/... URLs (Pennedly posts) or
  // absolute Threads CDN URLs (synced from posts authored elsewhere).
  // `type:"video"` carries a `poster` thumbnail; absent type = image. Wrap in
  // api.mediaUrl(). Empty for text-only.
  media: { url: string; alt: string | null; type?: string | null; poster?: string | null }[];
};

export type FeedReference = {
  window_days: number; // 7, or 30 if the week was too sparse
  posts_counted: number;
  avg_views: number;
  avg_likes: number;
  avg_comments: number;
  avg_reposts: number; // Q64
  median_views: number;
};

export type FeedResponse = {
  reference: FeedReference;
  posts: FeedPost[];
  count: number;
};

// Follower-growth line on Stats. Daily snapshots (Threads has no history, so it
// accrues from connect-time); `latest` is the most recent count or null if none.
export type FollowerPoint = { day: string; count: number };
export type FollowerHistory = { points: FollowerPoint[]; latest: number | null };

// Public Voice Test (landing demo): paste posts → sample replies in your voice.
export type VoiceSample = { comment: string; reply: string };
export type VoiceTestResponse = { samples: VoiceSample[] };

// Per-account autopilot config. Default off; the user assembles their own
// from a few clear controls. The autopilot worker reads this to decide
// what to post / reply automatically.
export type AutopilotConfig = {
  enabled: boolean;
  post_enabled: boolean;
  posts_per_day: number;
  quiet_start_hour: number | null;
  quiet_end_hour: number | null;
  reply_enabled: boolean; // legacy mirror of (reply_mode !== "off"), kept for back-compat
  reply_mode: "off" | "all" | "selected"; // off | every post | only flagged posts
  reply_audience: string; // "fans" | "all_except_trolls" | "questions"
  replies_per_day: number;
  reply_frequency: string; // "asap" | "hourly" | "few_daily" | "daily"
  // Optional auto-reply quiet window, stored as whole UTC hours (the UI
  // converts to/from local time, like the post hours). Both null = no window.
  reply_quiet_start_hour: number | null;
  reply_quiet_end_hour: number | null;
  reply_skip_low_value: boolean; // skip pure-reaction junk + concluded threads
  // Optional: only auto-reply to comments on posts younger than N days (null =
  // no limit). Stops the bot chasing comments on stale posts.
  reply_post_max_age_days: number | null;
};

// ── Autopost objects (autopilot redesign) ────────────────────────────
// Mirrors api/autopost_rules.py. Each object = one daily auto-post at
// post_hour, optional topic, with its own auto-reply toggle.

export type AutopostRule = {
  id: number;
  name: string | null;
  topic_id: number | null;
  post_hour: number;
  jitter_minutes: number;
  enabled: boolean;
  auto_reply: boolean;
  reply_audience: string;
  replies_per_day: number;
};

export type TopicOption = { id: number; label: string };

export type AutopostRulesResponse = {
  master_enabled: boolean;
  rules: AutopostRule[];
  topics: TopicOption[];
};

// What autopilot actually did (read-only activity log).
export type AutopostActivityRule = {
  id: number;
  name: string | null;
  enabled: boolean;
  last_post_at: string | null;
  // All-time posts this object published (auto-replies are account-level, not
  // per-object — the account totals live on AutopostActivity).
  posts_total: number;
};

export type AutopostActivityPost = {
  post_id: number;
  rule_id: number | null;
  rule_name: string | null;
  text: string | null;
  published_at: string | null;
  views: number | null;
  likes: number | null;
  comments: number | null;
  threads_url: string | null;
};

export type AutopostActivityReply = {
  comment_id: number;
  author_username: string | null;
  comment_text: string | null;
  reply_text: string | null;
  replied_at: string | null;
  post_threads_url: string | null;
};

export type AutopostActivity = {
  rules: AutopostActivityRule[];
  // Account-wide all-time tallies for the header.
  posts_total: number;
  replies_total: number;
  posts: AutopostActivityPost[];
  replies: AutopostActivityReply[];
};

// ── Scenarios — recurring/conditional content; «Акция» (promo) is the first
// template. Mirrors api/scenarios.py ScenarioOut + PromoFields. ──────────────
export type ScenarioTemplate = "promo" | "custom" | "rubric" | "seasonal";

export type ScenarioPromoFields = {
  ask: string;
  reward: string;
  require_follow: boolean;
  require_like: boolean;
  reply_instruction: string;
  schedule: "daily" | "every_n_days";
  n_days: number;
};

export type Scenario = {
  id: number;
  name: string;
  template: ScenarioTemplate;
  enabled: boolean;
  trigger_cfg: Record<string, unknown>;
  condition_cfg: Record<string, unknown> | null;
  action_cfg: Record<string, unknown>;
  structured: ScenarioPromoFields | null;
  instruction: string;
  reply_instruction: string;
  next_run_at: string | null;
  last_run_at: string | null;
};

export type ScenariosResponse = { scenarios: Scenario[] };

export type ScenarioCreate = {
  name: string;
  template: ScenarioTemplate;
  enabled?: boolean;
  promo?: ScenarioPromoFields;
  trigger?: Record<string, unknown>;
  condition?: Record<string, unknown> | null;
  action?: Record<string, unknown>;
  instruction?: string;
};

export type ScenarioUpdate = {
  name?: string;
  enabled?: boolean;
  promo?: ScenarioPromoFields;
  trigger?: Record<string, unknown>;
  condition?: Record<string, unknown> | null;
  action?: Record<string, unknown>;
  instruction?: string;
};

export type ScenarioPreview = {
  cta: string;
  instruction: string;
  reply_instruction: string;
};

// The account's own manual generation rules (layered over the role_book +
// the built-in default rules). kind ∈ {"post","reply"}.
export type UserRule = {
  id: number;
  kind: string;
  body: string;
  enabled: boolean;
  sort_order: number;
};

export type UserRulesResponse = { rules: UserRule[] };

// A single post's metrics over time (growth curve).
export type MetricsSnapshot = {
  snapshot_at: string;
  views: number | null;
  likes: number | null;
  comments: number | null;
  reposts: number | null;
};

export type PostGrowth = {
  post_id: number;
  series: MetricsSnapshot[];
};

export type RefineResult = {
  draft_id: number;
  text: string;
  instruction: string;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  latency_ms: number;
};

// ── Pattern Study ────────────────────────────────────────────────────

export type Pattern = {
  name: string;
  /** One-word category (Hook / Structure / Cadence / …). "" on older data. */
  kind: string;
  technique: string;
  why_it_works: string;
  /** The single verbatim source line where the move is clearest. "" on older data. */
  spotted: string;
  example: string;
  suggested_do_rule: string;
};

export type PatternStudyResult = {
  patterns: Pattern[];
  summary: string;
  samples_analyzed: number;
  llm_model: string;
  prompt_tokens: number;
  completion_tokens: number;
  latency_ms: number;
};

// Self pattern-study (the redesigned /app/patterns) — deterministic patterns
// in the account's OWN posts. Prose is rendered client-side from i18n keyed
// by `key`; the backend ships pure data.
export type SelfStudyEvidence = {
  value: number;
  display: string;
  sample: number;
};

export type SelfStudyExample = {
  text: string;
  // Q56: the metric that fits this pattern — "views" | "likes" | "comments".
  metric: string;
  value: number;
  display: string;
};

export type SelfStudyPattern = {
  key: string; // "length" | "question" | "emoji" | "structure"
  lead_group: string; // which side won, e.g. "short" / "with"
  strength: "strong" | "worth_testing";
  sample: number;
  delta_pct: number;
  lead: SelfStudyEvidence;
  base: SelfStudyEvidence;
  examples: SelfStudyExample[];
};

export type SelfStudyResult = {
  posts_analyzed: number;
  patterns: SelfStudyPattern[];
};

// Q54: the last persisted self-study (GET /patterns/study/latest). Both null
// when the account has never run one.
export type LatestSelfStudy = {
  computed_at: string | null;
  study: SelfStudyResult | null;
};

// ── Audits ───────────────────────────────────────────────────────────

export type AuditSummary = {
  id: number;
  account_id: number;
  period_start: string;
  period_end: string;
  posts_analyzed: number;
  proposed_change_count: number;
  decided_change_count: number;
  status: string; // 'pending' | 'partial_approved' | 'fully_approved' | 'rejected'
  week_over_week_delta_pct: number | null;
  created_at: string;
  applied_at: string | null;
};

export type AuditsList = {
  audits: AuditSummary[];
  count: number;
};

// proposed_changes are LLM-shaped JSON — we only rely on a few fields,
// the rest passes through.
export type ProposedChange = {
  id: string;
  kind: string; // 'role_book_edit' | 'post_prompt_edit' | 'autopilot_config' | ...
  // Editorial display label from the coach (Q75): Voice / Cadence / Topic /
  // Format. Falls back to `kind` when absent (pre-Q75 audits).
  category?: string;
  title: string;
  detail?: string;
  // For prompt edits the diff is { type, where, old_text, new_text } (Q51).
  diff?: { type?: string; where?: string; old_text?: string; new_text?: string } | null;
  // autopilot_config changes carry post_hours (UTC) instead of a diff.
  payload?: { post_hours?: number[] } | null;
  target_section?: string;
};

export type AuditDecisionRow = {
  id: number;
  change_id: string;
  kind: string;
  approved: boolean;
  user_comment: string | null;
  decided_at: string;
  applied_change: Record<string, unknown> | null;
  rolled_back: boolean;
  effect_pct: number | null;
  engagement_before_pct: number | null;
  engagement_after_pct: number | null;
};

export type AuditDetail = {
  id: number;
  account_id: number;
  period_start: string;
  period_end: string;
  posts_analyzed: number;
  metrics_summary: Record<string, unknown>;
  week_over_week: Record<string, unknown> | null;
  proposed_changes: ProposedChange[];
  llm_reasoning: string | null;
  llm_model: string | null;
  status: string;
  user_comments: Record<string, string>;
  applied_at: string | null;
  created_at: string;
  decisions: AuditDecisionRow[];
};

export type DecisionInput = {
  change_id: string;
  approved: boolean;
  user_comment?: string;
};

export type DecisionResult = {
  change_id: string;
  decision_id: number;
  approved: boolean;
  applied: boolean;
  new_version_id: number | null;
  error: string | null;
};

export type DecisionsResponse = {
  audit_id: number;
  final_status: string;
  results: DecisionResult[];
};

export type Translation = {
  translated_text: string;
  target_lang: string;
  cached: boolean;
};

// ── Style rules (built-in anti-AI-tell defaults) ─────────────────────
// Mirrors api/style_rules.py. The catalog is code-level on the backend;
// every rule is ON by default, the per-account opt-outs are persisted in
// account_disabled_default_rules. `enabled` reflects that account's state.

export type StyleRuleKind = "post" | "reply" | "both";

// Display-only grouping for the /app/style-rules filter chips.
export type StyleRuleCategory =
  | "punctuation"
  | "diction"
  | "structure"
  | "cadence"
  | "formatting"
  | "tone";

export type StyleRule = {
  key: string;
  kind: StyleRuleKind;
  category: StyleRuleCategory;
  title: string;
  body: string;
  enabled: boolean;
};

export type StyleRulesList = {
  rules: StyleRule[];
};

// ── Voice lint ───────────────────────────────────────────────────────

export type LintConflictItem = {
  section: string;
  text: string;
  // The flagged item's stable id — the backend exposes it so the editor can
  // highlight the exact pill by id instead of a fragile text-match. "" /
  // absent when the LLM referenced an item that no longer matches.
  id?: string;
};

export type LintSeverity = "high" | "medium" | "low";

// The structured fix descriptor mirrors role_book_lint.FIX_KINDS on
// the backend. Exhaustive union so the UI can branch on `kind` with
// full TypeScript checking.
// Mirrors backend role_book_lint.FIX_KINDS exactly. Conflict-resolution
// fixes target a stable item `id` (not text — which goes stale on edit);
// `add_item` is the one non-resolution kind, powering Explore's "Add to
// Voice" (append a discovered rule to a list section).
export type LintFix =
  | {
      kind: "set_field";
      section: string;
      id: string;
      field: string;
      value: string;
    }
  | {
      kind: "remove_item";
      section: string;
      id: string;
    }
  | {
      kind: "set_intro";
      text: string;
    }
  | {
      kind: "add_item";
      section: string;
      text: string;
    };

export type LintConflict = {
  severity: LintSeverity;
  title: string;
  description: string;
  items: LintConflictItem[];
  suggestion: string;
  // Optional — present when the LLM produced a structured fix the UI
  // can apply in one click. Absent when the suggestion is too complex
  // and the user must edit manually.
  fix?: LintFix | null;
};

export type LintResult = {
  conflicts: LintConflict[];
  linted_sections: RoleBookSections;
  llm_model: string;
  prompt_tokens: number;
  completion_tokens: number;
  latency_ms: number;
};

export const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "ru", name: "Русский", flag: "🇷🇺" },
  { code: "uk", name: "Українська", flag: "🇺🇦" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "it", name: "Italiano", flag: "🇮🇹" },
  { code: "pt", name: "Português", flag: "🇵🇹" },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]["code"];
