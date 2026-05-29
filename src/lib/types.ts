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
