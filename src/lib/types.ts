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
};

export type Translation = {
  translated_text: string;
  target_lang: string;
  cached: boolean;
};

// ── Voice lint ───────────────────────────────────────────────────────

export type LintConflictItem = {
  section: string;
  text: string;
};

export type LintSeverity = "high" | "medium" | "low";

export type LintConflict = {
  severity: LintSeverity;
  title: string;
  description: string;
  items: LintConflictItem[];
  suggestion: string;
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
