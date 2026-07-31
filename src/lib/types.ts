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

// First-connect backfill status. On connect the backend pulls the account's
// posts, per-post metrics and comments from Threads in the background (seconds
// to a few minutes); these fields let the UI show an honest "importing your
// history" story instead of an empty/broken-looking screen.
//   'importing' — backfill running (show the banner + live counts)
//   'partial'   — most history landed, a tail still trickling in (quiet note)
//   'complete'  — done (banner hidden)
//   'failed'    — backfill errored (still non-blocking; banner hidden)
//   null        — no backfill applies (legacy / already-synced account)
export type SyncStatus = "importing" | "complete" | "partial" | "failed" | null;

// Live counts streamed by the backfill job. Any field may be absent early in
// the import; `errors` lists non-fatal problems (kept for diagnostics).
export type SyncSummary = {
  posts?: number;
  history_posts?: number;
  followers_snapshot?: number;
  new_comments?: number;
  new_mentions?: number;
  errors?: string[];
};

export type ConnectedAccount = {
  id: number;
  tenant_id: number;
  // The social network this profile belongs to ('threads' today) — the
  // multi-network filter axis, never a scope level.
  network: string;
  threads_user_id: string;
  username: string | null;
  display_name: string | null;
  profile_picture_url: string | null;
  // Current follower count, or null until the metrics worker has snapshotted
  // this account (not zero — see api/me.py's _overview_metrics_bulk comment).
  followers_count: number | null;
  connected_at: string;
  disconnected_at: string | null;
  // First-connect backfill (see SyncStatus / SyncSummary above). ISO strings or null.
  sync_status: SyncStatus;
  sync_summary: SyncSummary | null;
  sync_started_at: string | null;
  sync_completed_at: string | null;
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
  // True while the on-connect backfill is still running: post_count/can_analyze
  // are a moving snapshot then — the wizard polls and shows an importing state
  // instead of a terminal "you only have N" verdict. Optional for the one
  // mixed-version deploy window (old API → treat as false).
  importing?: boolean;
  // Server-side "skip for now" (replaces the old per-browser localStorage
  // flag) — true once the user has skipped voice setup on ANY device.
  // Optional for the one mixed-version deploy window (old API → treat as false).
  onboarding_skipped?: boolean;
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

// Growth Advisor chat (tester-gated). One turn in the conversation; role is
// "user" (the author) or "assistant" (a prior advisor reply).
export type AdvisorMessage = {
  role: "user" | "assistant";
  content: string;
};

// A data badge under the reply (the backend's structured output). `icon` may be
// null. Mirrors the AdvisorChip component shape (minus its callbacks).
export type AdvisorChipData = {
  tone: "up" | "down" | "accent" | "neutral";
  icon?: "eye" | "reply" | "clock" | "chart" | "up" | "down" | null;
  label: string;
};

// An actionable suggestion card. `brief` seeds the Studio composer via the
// "Open in Studio" handoff.
export type AdvisorSuggestionData = {
  icon: "nib" | "clock";
  title: string;
  why: string;
  brief: string;
  // Portfolio-advisor chat only: bare @handle (no '@') of the profile the
  // action targets. The FE switches the Studio to that profile before seeding
  // the brief (B9); null/absent = keep the currently selected profile.
  account?: string | null;
};

// A one-click advisor ACTION (the "apply-in-one-click" layer). `type` is a CLOSED
// catalog. Each variant maps to an existing per-account operation the FE renders
// as a typed card; Apply → POST /accounts/{id}/advisor/apply. Portfolio chat sets
// `account` (bare @handle of the target profile; null = current/only).
export type AdvisorRoutineAction = {
  type: "routine";
  title: string;
  topic: string;
  times_per_day: number;
  // The deterministic schedule the backend will create (so the card's schedule
  // line matches exactly what fires).
  hours_preview: number[];
  account?: string | null;
};

// Turn ON the account's auto-reply policy (audience / daily cap / low-value skip).
// Applies immediately — the separate POST automation is untouched.
export type AdvisorAutoRepliesAction = {
  type: "auto_replies";
  title: string;
  audience: "questions" | "fans" | "all_except_trolls";
  replies_per_day: number;
  skip_low_value: boolean;
  account?: string | null;
};

// Add one standing freeform rule to the account's voice (a user_rules row).
// Strictly additive — never edits/removes an existing rule. `rule_kind` = which
// surface it steers (field name matches the backend AdvisorActionOut wire key).
export type AdvisorVoiceRuleAction = {
  type: "voice_rule";
  title: string;
  rule_text: string;
  rule_kind: "post" | "reply" | "both";
  account?: string | null;
};

// Generate ONE post in the account's voice and schedule it to AUTO-PUBLISH at a
// target day/hour. The model emits weekday (1=Mon..7=Sun) + local hour; the FE
// resolves that to the next future occurrence → an absolute scheduled_at.
export type AdvisorSchedulePostAction = {
  type: "schedule_post";
  title: string;
  brief: string;
  weekday: number;
  hour: number;
  account?: string | null;
};

// Enable ONE reactive scenario preset in one click. amplify = draft a follow-up
// when a post takes off; milestone = draft a thank-you at a follower milestone;
// booster = append a comment when a post grows (comment_text). All land as drafts.
export type AdvisorReactiveAction = {
  type: "reactive";
  reactive_kind: "amplify" | "milestone" | "booster";
  title: string;
  comment_text?: string;
  account?: string | null;
};

// Enable ONE recurring posting-format scenario preset in one click. daily_question
// = a daily question post (needs a topic); rubric = a named weekly column (needs a
// name + a one-line idea). All land as drafts for review.
export type AdvisorFormatAction = {
  type: "format";
  format_kind: "daily_question" | "rubric" | "poll";
  title: string;
  topic?: string;
  rubric_name?: string;
  rubric_idea?: string;
  question?: string;
  options?: string[];
  account?: string | null;
};

// CONTROL the account's automation (unlike the actions above, which ARM it).
// pause = stop ALL automation (posts + reactions + auto-replies) via the master;
// resume = turn it back on; quiet_hours = a nightly window (account-local hours,
// wrap-aware past midnight) when it neither posts nor auto-replies. quiet_start/
// quiet_end are present only for quiet_hours.
export type AdvisorAutomationAction = {
  type: "automation";
  control_kind: "pause" | "quiet_hours" | "resume";
  title: string;
  quiet_start?: number | null;
  quiet_end?: number | null;
  account?: string | null;
};

// Like a routine, but the posting hours come from the account's strongest time
// BLOCKS (morning/daytime/evening/night, chosen from the best-time heatmap). The
// backend resolves the blocks → account-local hours; hours_preview echoes them.
export type AdvisorBestTimeRoutineAction = {
  type: "best_time_routine";
  title: string;
  topic?: string;
  blocks: string[];
  hours_preview: number[];
  times_per_day: number;
  account?: string | null;
};

export type AdvisorTopicsListAction = {
  type: "topics_list";
  title: string;
  topics: string[];
  account?: string | null;
};

export type AdvisorActionData =
  | AdvisorRoutineAction
  | AdvisorAutoRepliesAction
  | AdvisorVoiceRuleAction
  | AdvisorSchedulePostAction
  | AdvisorReactiveAction
  | AdvisorFormatAction
  | AdvisorAutomationAction
  | AdvisorBestTimeRoutineAction
  | AdvisorTopicsListAction;

export type AdvisorResponse = {
  reply: string;
  model: string;
  // Which real account signals the reply was grounded in — drives the
  // "Grounded in: …" line in the UI.
  grounded_in: string[];
  // Structured extras rendered under the prose. Any may be empty.
  chips: AdvisorChipData[];
  suggestions: AdvisorSuggestionData[];
  actions: AdvisorActionData[];
  prompt_tokens: number;
  completion_tokens: number;
};

// One persisted question + reply from the advisor's history (GET
// .../advisor/history) — hydrates a chat screen on load so the conversation
// survives a navigation/new session. `reply` is the exact same shape
// `chatAdvisor`/`chatAccountAdvisor` return, so hydration reuses the live
// turn-building logic verbatim. v1: one ever-growing conversation per
// account/portfolio, no conversation id / multiple threads.
export type AdvisorHistoryEntry = {
  question: string;
  reply: AdvisorResponse;
  created_at: string;
};

export type AdvisorHistoryResponse = {
  entries: AdvisorHistoryEntry[];
};

// What POST /accounts/{id}/advisor/apply returns after applying an action.
export type ApplyActionResponse = {
  kind: string; // routine | auto_replies | voice_rule | schedule_post | topics_list
  // Present only for actions that create a scenario (routine); null otherwise.
  scenario_id: number | null;
  name: string;
  // Present only for "schedule_post" (the generated+scheduled draft); null otherwise.
  draft_id?: number | null;
  scheduled_at?: string | null;
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
  // Public Threads permalink Meta returned for the just-published post (null if
  // none). Lets the composer wire a live «Open in Threads» right away instead of
  // holding the draft's stale pre-publish null.
  threads_url: string | null;
  // The id of the boost scenario created when a boost was attached to this
  // publish (entry-point B), or null when none was attached. Lets the composer
  // confirm/link the new routine.
  boost_scenario_id?: number | null;
};

// A boost attached to a Studio-composer publish/schedule (boost entry-point B).
// The target is IMPLICIT (the post being published), so only these three fields
// are sent — never a `target`. Field constraints mirror the backend's
// `ComposerBoost`: metric ∈ {comments, likes, views}; threshold a positive int;
// comment_text non-empty, ≤500 chars (after trim).
export type ComposerBoost = {
  metric: "comments" | "likes" | "views";
  threshold: number;
  comment_text: string;
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
  // Media attached to the incoming Threads comment, if Meta returned it.
  media_url: string | null;
  media_type: string | null;
  thumbnail_url: string | null;
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
  // Comments genuinely waiting on the user (bounded + autopilot-aware) — the
  // nav badge + "needs reply" pill, NOT the raw lifetime `new` total.
  needs_attention: number;
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
  // Comments genuinely waiting on the user (bounded + autopilot-aware).
  needs_attention: number;
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
  // Phase-1/2 triage the backend now returns: the classifier intent
  // (question/lead/spam/…, `general`/`irrelevant` alias to the UI's
  // neutral/notforus), the hard-gate/spam skip reason, and the attachment.
  intent?: string | null;
  skip_reason?: string | null;
  media_type?: string | null;
  media_url?: string | null;
  thumbnail_url?: string | null;
  published_at: string | null;
  created_at: string;
  // Phase 4: the ask-mode reply draft awaiting the owner (present for a `drafted`
  // mention) — id + text, whether its routine generates a photo, and the generated
  // image URL once produced. `draft_id` null when there's no actionable draft.
  draft_id?: number | null;
  draft_text?: string | null;
  draft_media_url?: string | null;
  generate_image?: boolean;
};

export type MentionsList = {
  mentions: MentionSummary[];
  count: number;
  missing_mentions_scope?: boolean;
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
  // Older posts remain beyond this page (offset pagination — the feed's
  // «Показать ещё»). Optional for the one mixed-version deploy window.
  has_more?: boolean;
};

// Follower-growth line on Stats. Daily snapshots (Threads has no history, so it
// accrues from connect-time); `latest` is the most recent count or null if none.
export type FollowerPoint = { day: string; count: number };
export type FollowerHistory = { points: FollowerPoint[]; latest: number | null };

// Account-level engagement series for the Stats "Engagement" panel. Mirrors
// api/stats.py EngagementHistory. `points[]` is gap-filled / continuous (one per
// day, empty days zeroed). `views` is a real day-series; the lifetime totals
// (likes/replies/reposts/quotes) are account-wide figures carried ONCE on the
// envelope (the latest snapshot), null when the account has no data yet — they
// are NOT per-day deltas, so the per-day likes/replies/reposts/quotes inside
// points[] are recent-only (older days truly 0).
export type EngagementPoint = {
  day: string; // ISO date (YYYY-MM-DD)
  views: number;
  likes: number;
  replies: number;
  reposts: number;
  quotes: number;
};
export type EngagementMetric = "views" | "likes" | "replies" | "reposts" | "quotes";
export type EngagementHistory = {
  points: EngagementPoint[];
  // Account-wide lifetime totals (latest snapshot); null when no data yet.
  likes: number | null;
  replies: number | null;
  reposts: number | null;
  quotes: number | null;
};

// ── Overview (multi-account portfolio rollup) ────────────────────────
// Mirrors api/me.py OverviewResponse. One request → per-account headline
// numbers + sync state (the cards) + pre-computed totals across SYNCED accounts
// (the top strip). `sync_status` here is collapsed to the card's three states:
//   'synced'    — show metrics + "Updated N ago"
//   'importing' — Phase-0 backfill running; show the ImportBanner (no metrics)
//   'error'     — backfill failed; show a card-local Retry (out of the totals)
export type OverviewSyncStatus = "synced" | "importing" | "error";

export type OverviewAccount = {
  id: number;
  tenant_id: number;
  // The social network this profile belongs to ('threads' today) — drives the
  // network-badge slot on the card + the portfolio's network filter.
  network: string;
  name: string | null;
  handle: string | null;
  avatar: string | null;
  // null until the metrics worker snapshots a count / a 2nd follower snapshot
  // exists to diff against.
  followers: number | null;
  followers_delta: number | null;
  views_7d: number;
  posts_week: number;
  replies_to_answer: number;
  // Triage signals for the cockpit «Требует тебя» queue (per profile): post
  // drafts awaiting approval + un-reviewed weekly growth audits.
  pending_drafts: number;
  pending_audits: number;
  sync_status: OverviewSyncStatus;
  // ISO of the last metrics pull, or null — drives "Updated N ago".
  synced_at: string | null;
  // Import progress, for an importing card's ImportBanner (same shape as
  // ConnectedAccount.sync_summary).
  sync_summary: SyncSummary | null;
  sync_started_at: string | null;
};

export type OverviewTotals = {
  followers: number;
  followers_delta: number;
  views_7d: number;
  posts_week: number;
  replies_to_answer: number;
  accounts_count: number;
  importing_count: number;
};

export type OverviewResponse = {
  totals: OverviewTotals;
  accounts: OverviewAccount[];
};

// ── Account dashboard (Account → Brands → Profiles) ──────────────────
// Mirrors api/me.py MeAccountResponse — the portfolio home. It's the overview
// GROUPED BY BRAND + an account-wide tasks block + the adaptive-IA scope hint.
// A profile carries the same headline numbers as an OverviewAccount, plus its
// brand link.
export type AccountProfile = Omit<OverviewAccount, "sync_status"> & {
  brand_id: number | null;
  // The profile has an ACTIVE role_book (voice). The advisor's open-in-Studio
  // handoff refuses to switch to a voiceless profile (it would bounce into the
  // onboarding wizard and lose the seeded brief — B9 review follow-up).
  has_voice?: boolean;
  // A profile whose OAuth was revoked/expired — its row + all config (drafts /
  // voice / scenarios / history) are kept, it is held OUT of every metric/total,
  // and the dashboard renders it with a "Disconnected" pill + Reconnect.
  // `sync_status` carries the "disconnected" sentinel beside the live states.
  disconnected: boolean;
  disconnected_at: string | null;
  sync_status: OverviewSyncStatus | "disconnected";
};

export type AccountBrand = {
  id: number;
  name: string;
  // distinct networks present across the brand's profiles (badge row)
  networks: string[];
  // synced-only roll-up of THIS brand's profiles (same rule as the portfolio totals)
  stats: OverviewTotals;
  // empty for a just-added brand with no connected profile yet
  profiles: AccountProfile[];
};

// The account-wide «Требует тебя» roll-up — the four triage signals summed
// across every profile.
export type AccountTasks = {
  pending_drafts: number;
  replies_attention: number;
  sync_errors: number;
  pending_audits: number;
};

// Adaptive-IA hint. `show_brand_level` is the switch: false → the dashboard
// shows profile cards directly (one brand, no pass-through level); true → it
// shows brand cards that expand into profiles (2+ brands).
export type AccountScope = {
  brands_count: number;
  profiles_count: number; // LIVE (connected) profiles only
  disconnected_count: number;
  show_brand_level: boolean;
};

export type MeAccountResponse = {
  tenant: Tenant;
  brands: AccountBrand[];
  totals: OverviewTotals;
  tasks: AccountTasks;
  scope: AccountScope;
};

// The account-dashboard advisor HERO — a one-shot, portfolio-wide growth verdict
// (GET /api/me/account/advisor, tester-gated + cached). Mirrors the backend
// AccountAdvisorResponse verbatim, so the <Advisor> renders it with no mapping.
// `tone`/`icon` are constrained server-side to the vocab the UI can render.
export type AdvisorData = {
  verdict: string;
  detail: string;
  chips: { tone: string; icon: string; text: string }[];
  grounded: string;
  recos: { tone?: string; icon: string; t: string; s: string }[];
};

// Public Voice Test (landing demo): paste posts → sample replies in your voice.
export type VoiceSample = { comment: string; reply: string };
export type VoiceTestResponse = { samples: VoiceSample[] };

// Landing waitlist capture. The server answers `ok` whether the address was
// new or already on the list, so there is nothing here to branch on — the
// shape exists to keep the call typed like every other one.
export type WaitlistResponse = { status: string };

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
  reply_audience: string; // "fans" | "all_except_trolls" | "questions" | "custom"
  // When reply_audience === "custom", the user's free-text description of WHO to
  // answer (a TEXT preset sends "custom" + its ready prompt; «Свой вариант» sends
  // "custom" + the user's words). Empty for the three built-in filters. Optional
  // until the backend ships the field — the FE wires it optimistically and the
  // demo path drives it from local state.
  audience_prompt?: string;
  replies_per_day: number;
  // Separate daily cap for @mention replies (mentions have their own budget). The
  // mention-routine Layer-3 «Дневной лимит» override is bounded by this account
  // ceiling. Optional for older reads; defaults to the backend's 5.
  mention_replies_per_day?: number;
  reply_frequency: string; // "asap" | "hourly" | "few_daily" | "daily"
  // Optional auto-reply quiet window, stored as whole UTC hours (the UI
  // converts to/from local time, like the post hours). Both null = no window.
  reply_quiet_start_hour: number | null;
  reply_quiet_end_hour: number | null;
  reply_skip_low_value: boolean; // skip pure-reaction junk + concluded threads
  // Optional: only auto-reply to comments on posts younger than N days (null =
  // no limit). Stops the bot chasing comments on stale posts.
  reply_post_max_age_days: number | null;
  // Per-day cap on how many POST-scenarios may fire on this account (the
  // Scenarios control-center stepper). The worker reads it from
  // `account_autopilot.max_post_scenarios_per_day` (default 1); the GET/PUT
  // autopilot endpoint does not yet surface it, so it may be absent on read —
  // the Scenarios screen treats `undefined` as the default 1. Optional here so
  // existing callers (the Autopilot screen) need no change.
  max_post_scenarios_per_day?: number;
  // Read-only mirror of the account's IANA timezone (`threads_accounts.timezone`,
  // e.g. "Europe/Warsaw"; default "UTC"). GET-only — the quiet-hours control
  // labels itself with this real tz instead of a hardcoded "UTC". PUT ignores it.
  // Optional for back-compat with any caller that predates the field.
  timezone?: string;
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

// ── Scenarios — recurring/conditional content. Redesign: there are NO rigid
// scenario "types" anymore. A scenario is built EITHER from the promo helper
// («Акция») OR from raw fields (a "free" scenario). `template` survives only as
// a NULLABLE soft PROVENANCE tag — 'promo' (built via the helper) or null
// (free) — used for the list badge + to know whether to reopen the promo
// helper. Mirrors api/scenarios.py ScenarioOut + PromoFields. ────────────────
export type ScenarioProvenance = "promo" | null;

export type ScenarioPromoFields = {
  ask: string;
  reward: string;
  require_follow: boolean;
  require_like: boolean;
  reply_instruction: string;
  schedule: "daily" | "every_n_days";
  n_days: number;
};

// One durable skip-audit row — why a DUE fire was declined (the «почему не
// сработало» line on a control-center card). reason ∈ cap | condition | gated |
// quota. Mirrors api/scenarios.py ScenarioSkipOut.
export type ScenarioSkip = {
  local_date: string;
  reason: string;
  detail: string | null;
  created_at: string;
};

export type Scenario = {
  id: number;
  name: string;
  /** Soft provenance tag, NOT a type: 'promo' (promo-seeded) | null (free). */
  template: ScenarioProvenance;
  enabled: boolean;
  trigger_cfg: Record<string, unknown>;
  condition_cfg: Record<string, unknown> | null;
  action_cfg: Record<string, unknown>;
  /** Promo fields, present iff the scenario was built via the promo helper —
   *  reload them into the helper when editing. null → open the free form. */
  structured: ScenarioPromoFields | null;
  instruction: string;
  reply_instruction: string;
  next_run_at: string | null;
  last_run_at: string | null;
  fire_count: number;
  /** The most recent skip-audit rows (newest first) — the control-center's
   *  «почему не сработало». Empty for a scenario that never declined a fire. */
  recent_skips: ScenarioSkip[];
  /** Pennedly-3: who confirms before it publishes — 'ask' (Pennedly drafts, you
   *  approve in Activity) or 'auto' (publishes itself). Optional until the backend
   *  ships the field; absent → treat as 'auto' (current behaviour). */
  publish_mode?: PublishMode;
  /** Pennedly-3: origin preset id, if known — lets the living sentence read in the
   *  preset's exact words. Optional; absent → derive the sentence from the shape. */
  preset_id?: string | null;
  /** Schedule «Время» (account-local hour 0–23) for a cadence POST scenario,
   *  lifted from `trigger_cfg.hour` for the editor. null/absent → no explicit
   *  hour (the worker fires on its first due tick). */
  hour?: number | null;
  /** Schedule «Разброс минут» (0–120), lifted from `trigger_cfg.jitter_minutes`.
   *  null/absent → no jitter. */
  jitter_minutes?: number | null;
  /** Weekly «Разное время в разные дни» — the per-weekday post-times map, lifted
   *  from `trigger_cfg.per_day_times`. Keyed by weekday string "0".."6" (0=Mon),
   *  each value a list of hours 0–23 (may be empty = no post that day). null/absent
   *  → no per-day schedule (the flat weekdays/hours apply). */
  per_day_times?: Record<string, number[]> | null;
};

/** Who confirms before a scenario publishes. */
export type PublishMode = "ask" | "auto";

export type ScenariosResponse = { scenarios: Scenario[] };

// What a scenario actually DID — its published posts (kind 'post') for the
// Activity screen. A reply scenario (kind 'reply') answers in comment threads,
// so `items` is empty and the UI points at the Replies screen.
export type ScenarioActivityItem = {
  post_id: number;
  text: string | null;
  published_at: string | null;
  threads_url: string | null;
  views: number;
  likes: number;
  comments_count: number;
};
// A draft an Ask-me scenario (publish_mode='ask') prepared and is holding for the
// user's approval — the Activity screen's «Ждут твоего подтверждения».
export type ScenarioPendingDraft = {
  id: number;
  kind: "post" | "reply";
  text: string;
  context: string;
  created_at: string | null;
};
export type ScenarioActivity = {
  scenario_name: string;
  kind: "post" | "reply";
  items: ScenarioActivityItem[];
  pending: ScenarioPendingDraft[];
};

// Create/update send ONE of: `promo` (the «Акция» helper) · `reply_policy`
// («Дежурство» — a standalone reply policy) · the raw free fields (`trigger` +
// `instruction` + optional `reply_instruction` + optional `condition`). They
// NEVER send `template` — it is resolved server-side as the provenance tag.
export type ScenarioReplyPolicy = {
  audience: string; // all_except_trolls | questions | fans | custom
  audience_prompt?: string; // free-text filter, required when audience === "custom"
  max_per_day: number;
  skip_low_value: boolean;
  // ── Layer 3 «Только для этого сценария» — per-scenario reply OVERRIDES ──
  // OPTIONAL: a present field overrides the account «Правила дома» value for THIS
  // scenario; an ABSENT field inherits it. Mirrors backend `ReplyPolicyFields`
  // (api/scenarios.py): `frequency` ∈ the account reply-frequency set; the quiet
  // hours are 0..23 and only valid as a PAIR (both, or neither).
  frequency?: "asap" | "half_hourly" | "hourly" | "few_daily" | "daily";
  quiet_start_hour?: number; // 0..23
  quiet_end_hour?: number; // 0..23
};

// Boost («Комментарий-добавка при росте поста») create/update field — mirrors the
// backend's BoostFields (api/scenarios.py). Present ⇒ the scenario is a reactive
// boost (on_post_metric → boost_comment): when a watched post's `metric` crosses
// `threshold`, Pennedly appends `comment_text` as a reply to that post. Mutually
// exclusive with `promo` / `reply_policy` (the backend resolves promo > boost >
// reply_policy > free). The server stores it as
//   trigger_cfg = {kind:"on_post_metric", metric, threshold, target}
//   action_cfg  = {kind:"boost_comment", comment_text}
// `target` picks which posts the boost watches; only these three shapes are valid
// (backend BOOST_TARGET_TYPES = {all, scenario, post}).
export type ScenarioBoostTarget =
  | { type: "all" }
  | { type: "scenario"; scenario_id: number }
  | { type: "post"; post_id: number };

export type ScenarioBoost = {
  metric: "comments" | "likes" | "views"; // backend BOOST_METRICS
  threshold: number; // absolute positive int (1..1e9)
  comment_text: string; // pre-written, non-empty, ≤500 chars
  target: ScenarioBoostTarget; // default {type:"all"}
};

// Layer-3 per-ROUTINE reply overrides for an on_mention routine (the mention
// constructor's «Только для этой рутины» panel). EVERY field is optional — an
// omitted field inherits «Правила дома» (the backend writes only the present keys to
// action_cfg, so inheritance stays live). Distinct from ScenarioReplyPolicy, which
// always writes audience + max_per_day.
export type ScenarioReplyOverrides = {
  audience?: string; // "fans" | "all_except_trolls" | "questions" | "custom"
  audience_prompt?: string; // required when audience === "custom"
  max_per_day?: number; // 1..500, bounded by the account mention ceiling
  frequency?: string; // "asap" | "half_hourly" | "hourly" | "few_daily" | "daily"
  quiet_start_hour?: number; // 0..23 — sent as a PAIR with quiet_end_hour
  quiet_end_hour?: number; // 0..23
};

// Per-POST/PROMO-scenario reply-audience override (Layer 3, audience-ONLY —
// «Аудитория ответов» card). Present on a POST / «Акция» create/update body ⇒
// comments UNDER that scenario's posts are answered with THIS audience instead of
// the account «Правила дома» audience; ABSENT ⇒ inherit the account (the key is
// simply not sent). Mirrors backend `ReplyAudienceOverride` (api/scenarios.py):
// only the audience is per-post — cadence / daily cap / quiet hours stay on the
// ONE account reply sweep. Mutually exclusive with `reply_policy` / `boost` (422).
export type ScenarioReplyAudienceOverride = {
  audience: string; // "fans" | "all_except_trolls" | "questions" | "custom"
  audience_prompt?: string; // REQUIRED (non-empty) when audience === "custom"
  // TRI-STATE via presence: absent ⇒ inherit the account `reply_skip_low_value`;
  // a bool ⇒ force it for this scenario's comments (the «отвечать всем, кто
  // откликнулся» promo preset sends `false`).
  skip_low_value?: boolean;
};

export type ScenarioCreate = {
  name: string;
  enabled?: boolean;
  publish_mode?: PublishMode;
  promo?: ScenarioPromoFields;
  trigger?: Record<string, unknown>;
  instruction?: string;
  reply_instruction?: string;
  reply_policy?: ScenarioReplyPolicy;
  reply_overrides?: ScenarioReplyOverrides;
  reply_audience_override?: ScenarioReplyAudienceOverride;
  boost?: ScenarioBoost;
  condition?: Record<string, unknown> | null;
};

export type ScenarioUpdate = {
  name?: string;
  enabled?: boolean;
  publish_mode?: PublishMode;
  promo?: ScenarioPromoFields;
  trigger?: Record<string, unknown>;
  instruction?: string;
  reply_instruction?: string;
  reply_policy?: ScenarioReplyPolicy;
  reply_overrides?: ScenarioReplyOverrides;
  reply_audience_override?: ScenarioReplyAudienceOverride;
  boost?: ScenarioBoost;
  condition?: Record<string, unknown> | null;
};

// Preview EITHER a promo scenario (`promo`) OR a free one (`instruction`).
export type ScenarioPreviewRequest = {
  promo?: ScenarioPromoFields;
  instruction?: string;
};

export type ScenarioPreview = {
  cta: string;
  instruction: string;
  reply_instruction: string;
  /** A short mock post, returned for the free-scenario preview. */
  sample_post: string;
};

// «Прогнать сейчас» — the pending draft run-now created (draft only, never
// published). `kind` distinguishes a post draft from a sample reply (drafted
// against a recent eligible comment, whose text rides in `replied_to`).
// Mirrors api/scenarios.py RunNowResponse.
export type ScenarioRunNow = {
  draft_id: number;
  text: string;
  kind: "post" | "reply";
  replied_to: string | null;
};

// ── Scenario PRESET catalog (the discovery gallery + the form pre-fill) ──────
// Mirrors api/scenarios.py PresetsResponse / PresetOut / PresetFieldOut. The
// baked `instruction` + `reply_instruction` arrive ALREADY localized to the
// account owner's locale (EN fallback) — do NOT re-localize in i18n.
export type PresetFieldKind =
  | "text"
  | "textarea"
  | "date"
  | "weekday"
  | "cadence"
  | "options"
  | "number";

export type PresetField = {
  key: string;
  name_key: string; // i18n label key, e.g. "scenarios.field.topic"
  kind: PresetFieldKind;
  required: boolean;
  default: unknown;
  /** Where the edited value lands when compiling the scenario: "instruction",
   *  "condition_cfg.<key>", "trigger_cfg.<key>", or "action_cfg.<key>". */
  maps_to: string;
  min_count: number | null;
  max_count: number | null;
};

// gallery group: core (Каждый день) | periodic | reactive | campaign. The
// backend ships "daily" | "periodic" | "reactive" for catalog presets; «Акция»
// is a synthetic FE-only "campaign" preset (the promo helper).
export type PresetGroup = "daily" | "periodic" | "reactive" | "campaign";

export type ScenarioPreset = {
  id: string;
  name_key: string;
  icon: string; // icon key (IcChat / IcBookmark / IcShield / …)
  group: string;
  instruction: string;
  reply_instruction: string;
  trigger_cfg: Record<string, unknown>;
  condition_cfg: Record<string, unknown> | null;
  action_cfg: Record<string, unknown>;
  fields: PresetField[];
  /** Reply-card defaults the FE pre-fills for a reply-bearing post preset
   *  ({} ⇒ replies off by default). */
  reply_defaults: { audience?: string; max_per_day?: number; skip_low_value?: boolean };
};

export type PresetsResponse = {
  locale: string;
  presets: ScenarioPreset[];
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
  // Redesign: which of the 7 dimensions this audit touched (canonical order).
  dims: string[];
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
  // autopilot_config carries post_hours (UTC); the action kinds carry their own
  // payload (scenario id + new state, or a new rule's text).
  payload?: {
    post_hours?: number[];
    scenario_id?: number;
    enabled?: boolean;
    max_per_day?: number;
    rule_kind?: string;
    body?: string;
  } | null;
  target_section?: string;
  // Redesign (7-dimension contract): the dimension + display shape + the
  // evidence/expectation/confidence the «Аудит роста» detail renders.
  dim?: string; // topics | scenarios | timing | voice | rules | replies | format
  shape?: string; // diff | hours | action
  high?: boolean;
  evidence?: string;
  expect_dir?: string; // up | flat
  expect_label?: string;
  confidence?: string; // high | med | low
  action_label?: string; // shape=action: the human label (may contain <b>)
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
  // Redesign: the self-learning «петля» — {up_pct, rolled} from measured past
  // edits, or null when nothing's been measured (FE hides the strip).
  loop: { up_pct: number | null; rolled: number } | null;
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
    }
  | {
      kind: "batch";
      steps: LintFix[];
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

// ── Applied-changes history («Что Pennedly изменил за меня») ─────────────────
// The unified trail of every suggestion a Pennedly surface applied for the
// account, newest first. Mirrors api/applied_changes.py AppliedChangeEntry.
// `payload` is the structured truth (raw applied input + result refs) — the UI
// translates it into human facts, never shows raw JSON. `actor`: 'user' = a
// person clicked «Применить» (→ «вы»); 'auto' = Pennedly applied it (→ «Pennedly»).
// `rollbackable` is always false in the read-only first release.
export type AppliedChangeSource = "advisor_action" | "voice_lint" | "audit";
export type AppliedChangeActor = "user" | "auto";

// Why a rollback is unavailable (when rollbackable is false and not yet rolled
// back): "superseded" = replaced by a newer change; "irreversible" = no safe
// inverse (e.g. an already-published post); "later" = this kind's inverse isn't
// built yet. Drives the history card's honest rollback-zone reason.
export type AppliedChangeRollbackReason = "superseded" | "irreversible" | "later";

export type AppliedChangeEntry = {
  id: number;
  source: AppliedChangeSource;
  kind: string;
  summary: string;
  payload: Record<string, unknown>;
  actor: AppliedChangeActor;
  rollbackable: boolean; // can it be undone right now (a safe, guarded inverse exists)
  rollback_reason: AppliedChangeRollbackReason | null; // why not, when rollbackable is false
  rolled_back_at: string | null; // ISO; set once the change has been rolled back
  created_at: string; // ISO
};

export type AppliedChangesResponse = {
  entries: AppliedChangeEntry[];
};

export type RollbackAppliedChangeResponse = {
  entry: AppliedChangeEntry;
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
