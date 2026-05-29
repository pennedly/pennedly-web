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

export type RoleBookSections = {
  intro?: string;
  themes_include?: string[];
  themes_exclude?: string[];
  voice_characteristics?: string[];
  do_list?: string[];
  dont_list?: string[];
  examples?: string[];
};

export type RoleBook = {
  role_book_id: number;
  name: string;
  sections: RoleBookSections | null;
  prompt_text: string;
  created_by: string;
  parent_id: number | null;
  activated_at: string | null;
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
  ai_draft_id: number | null;
  draft_text: string | null;
  draft_status: string | null; // "pending" | "approved" | "rejected"
  draft_is_skip: boolean | null;
  replied_at: string | null;
  reply_threads_post_id: string | null;
};

export type CommentsList = {
  comments: CommentSummary[];
  count: number;
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
};

export type FeedReference = {
  window_days: number; // 7, or 30 if the week was too sparse
  posts_counted: number;
  avg_views: number;
  avg_likes: number;
  avg_comments: number;
  median_views: number;
};

export type FeedResponse = {
  reference: FeedReference;
  posts: FeedPost[];
  count: number;
};

// Per-account autopilot config. Default off; the user assembles their own
// from a few clear controls. The autopilot worker reads this to decide
// what to post / reply automatically.
export type AutopilotConfig = {
  enabled: boolean;
  post_enabled: boolean;
  posts_per_day: number;
  quiet_start_hour: number | null;
  quiet_end_hour: number | null;
  reply_enabled: boolean;
  reply_audience: string; // "fans" | "all_except_trolls" | "questions"
  replies_per_day: number;
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
  technique: string;
  why_it_works: string;
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
  kind: string; // 'role_book_edit' | 'post_prompt_edit' | ...
  title: string;
  detail?: string;
  diff?: unknown;
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

export type StyleRule = {
  key: string;
  kind: StyleRuleKind;
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
};

export type LintSeverity = "high" | "medium" | "low";

// The structured fix descriptor mirrors role_book_lint.FIX_KINDS on
// the backend. Exhaustive union so the UI can branch on `kind` with
// full TypeScript checking.
export type LintFix =
  | {
      kind: "remove_item";
      section: string;
      text: string;
    }
  | {
      kind: "replace_item";
      section: string;
      from: string;
      to: string;
    }
  | {
      kind: "add_item";
      section: string;
      text: string;
    }
  | {
      kind: "set_intro";
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
