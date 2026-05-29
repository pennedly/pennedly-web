// Thin fetch wrapper that reads/writes the JWT from localStorage and
// always sends Bearer auth on subsequent calls.
//
// Silent refresh: when an authenticated request gets 401, we transparently
// call /api/auth/refresh with the stored refresh token, persist the new
// token pair, and retry the original request ONCE. Only if the refresh
// itself also fails do we clear tokens and let the caller redirect to
// /login. This means access tokens can expire mid-session (60-min TTL)
// without bouncing the user.
//
// We share a single in-flight refresh promise so multiple concurrent
// failed requests don't trigger N parallel /refresh calls.

import type {
  AccountsList,
  ApprovalResult,
  AutopilotConfig,
  AutopostRule,
  AutopostRulesResponse,
  AuditDetail,
  AuditsList,
  BatchGenerateResult,
  CommentsList,
  DecisionInput,
  DecisionsResponse,
  DeleteDraftResult,
  DeletePostResult,
  DraftsList,
  FeedResponse,
  FromScratchInput,
  GeneratedDraft,
  OnboardingResult,
  OnboardingStatus,
  StatsPeriod,
  StatsResponse,
  GeneratedReply,
  LanguageCode,
  LintFix,
  LintResult,
  Me,
  MentionsList,
  PatternStudyResult,
  PostsList,
  PublishResult,
  RefineResult,
  RoleBook,
  RoleBookSections,
  StyleRule,
  StyleRulesList,
  ThreadsConnectStart,
  TokenPair,
  Translation,
} from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

const TOKEN_KEY = "pennedly.tokens";

export function setTokens(pair: TokenPair): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, JSON.stringify(pair));
}

export function clearTokens(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
}

export function getTokens(): TokenPair | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(TOKEN_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as TokenPair;
  } catch {
    return null;
  }
}

export class ApiError extends Error {
  status: number;
  detail: unknown;
  constructor(status: number, detail: unknown) {
    super(`API ${status}`);
    this.status = status;
    this.detail = detail;
  }
}

// Shared in-flight refresh promise — coalesces concurrent 401s.
let refreshPromise: Promise<TokenPair | null> | null = null;

async function refreshTokensOnce(): Promise<TokenPair | null> {
  if (refreshPromise) return refreshPromise;
  const current = getTokens();
  if (!current?.refresh_token) return null;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: current.refresh_token }),
      });
      if (!res.ok) {
        // Refresh token expired / revoked → caller will redirect.
        clearTokens();
        return null;
      }
      const pair = (await res.json()) as TokenPair;
      setTokens(pair);
      return pair;
    } catch {
      return null;
    } finally {
      // Release the lock on the next microtask so a follow-up call gets
      // a fresh promise instead of the resolved one.
      queueMicrotask(() => {
        refreshPromise = null;
      });
    }
  })();
  return refreshPromise;
}

async function rawFetch(
  path: string,
  init: RequestInit | undefined,
  accessToken: string | undefined,
): Promise<Response> {
  const headers = new Headers(init?.headers);
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(`${BASE_URL}${path}`, { ...init, headers });
}

async function fetchApi<T>(path: string, init?: RequestInit): Promise<T> {
  if (!BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }

  // First attempt with current access token.
  let res = await rawFetch(path, init, getTokens()?.access_token);

  // If unauthorized and we have a refresh token, try to refresh once.
  // Skip the refresh dance for the /refresh endpoint itself.
  if (res.status === 401 && !path.startsWith("/api/auth/refresh")) {
    const refreshed = await refreshTokensOnce();
    if (refreshed) {
      res = await rawFetch(path, init, refreshed.access_token);
    }
  }

  if (!res.ok) {
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      body = await res.text();
    }
    throw new ApiError(res.status, body);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return (await res.json()) as T;
}

// ── Auth ─────────────────────────────────────────────────────────

export async function devLogin(
  email: string,
  displayName?: string
): Promise<TokenPair> {
  return fetchApi<TokenPair>("/api/auth/dev-login", {
    method: "POST",
    body: JSON.stringify({ email, display_name: displayName }),
  });
}

export async function requestMagicLink(email: string): Promise<void> {
  await fetchApi<void>("/api/auth/magic-link/request", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function consumeMagicLink(token: string): Promise<TokenPair> {
  return fetchApi<TokenPair>("/api/auth/magic-link/consume", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

// ── Me ───────────────────────────────────────────────────────────

export async function fetchMe(): Promise<Me> {
  return fetchApi<Me>("/api/me");
}

export async function fetchMyAccounts(): Promise<AccountsList> {
  return fetchApi<AccountsList>("/api/me/accounts");
}

// Kick off the Threads OAuth connect. Returns the Meta authorize URL the
// caller should navigate the browser to. `returnTo` is where Meta's
// callback will 302 us back (must be an allowlisted web origin).
export async function startThreadsConnect(
  returnTo: string,
): Promise<ThreadsConnectStart> {
  const qs = new URLSearchParams({ return_to: returnTo });
  return fetchApi<ThreadsConnectStart>(
    `/api/threads/oauth/start?${qs.toString()}`,
  );
}

// ── Role book ────────────────────────────────────────────────────

export async function fetchRoleBook(accountId: number): Promise<RoleBook> {
  return fetchApi<RoleBook>(`/api/accounts/${accountId}/role-book`);
}

export async function patchRoleBook(
  accountId: number,
  patch: Partial<RoleBookSections>
): Promise<RoleBook> {
  return fetchApi<RoleBook>(`/api/accounts/${accountId}/role-book`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

// Lint the draft sections the user is currently editing (default), or
// the saved active sections when `sections` is omitted.
export async function lintRoleBook(
  accountId: number,
  sections?: Partial<RoleBookSections>
): Promise<LintResult> {
  return fetchApi<LintResult>(`/api/accounts/${accountId}/role-book/lint`, {
    method: "POST",
    body: JSON.stringify(sections ? { sections } : {}),
  });
}

// One-click apply a structured fix descriptor (returned by lint as
// conflict.fix). Creates a new active role_book version, same as PATCH.
export async function applyLintFix(
  accountId: number,
  fix: LintFix,
): Promise<RoleBook> {
  return fetchApi<RoleBook>(
    `/api/accounts/${accountId}/role-book/apply-fix`,
    {
      method: "POST",
      body: JSON.stringify({ fix }),
    },
  );
}

// Re-derive the role_book from the account's recent posts. Replaces
// the active version (old becomes parent — revertible).
export async function extractVoice(
  accountId: number,
  postLimit = 25,
): Promise<RoleBook> {
  return fetchApi<RoleBook>(
    `/api/accounts/${accountId}/role-book/extract`,
    {
      method: "POST",
      body: JSON.stringify({ post_limit: postLimit }),
    },
  );
}

// ── Pattern Study ────────────────────────────────────────────────

// Analyze pasted post TEXTS (not links/handles — backend rejects those)
// for reusable techniques.
export async function analyzePatterns(
  accountId: number,
  samples: string[],
): Promise<PatternStudyResult> {
  return fetchApi<PatternStudyResult>(
    `/api/accounts/${accountId}/patterns/analyze`,
    {
      method: "POST",
      body: JSON.stringify({ samples }),
    },
  );
}

// ── Generation ───────────────────────────────────────────────────

export async function generatePost(
  accountId: number,
  topicId?: number
): Promise<GeneratedDraft> {
  return fetchApi<GeneratedDraft>("/api/generation/posts", {
    method: "POST",
    body: JSON.stringify({
      account_id: accountId,
      topic_id: topicId ?? null,
    }),
  });
}

export async function generatePostBatch(
  accountId: number,
  count: number,
  topicId?: number,
): Promise<BatchGenerateResult> {
  return fetchApi<BatchGenerateResult>("/api/generation/posts/batch", {
    method: "POST",
    body: JSON.stringify({
      account_id: accountId,
      count,
      topic_id: topicId ?? null,
    }),
  });
}

// ── Drafts ───────────────────────────────────────────────────────

export async function listDrafts(
  accountId: number,
  params?: { limit?: number; status?: string; contentType?: string }
): Promise<DraftsList> {
  const qs = new URLSearchParams();
  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.status) qs.set("status", params.status);
  if (params?.contentType) qs.set("content_type", params.contentType);
  const tail = qs.toString() ? `?${qs.toString()}` : "";
  return fetchApi<DraftsList>(`/api/accounts/${accountId}/drafts${tail}`);
}

export async function approveDraft(
  draftId: number,
  opts: { categoryTags?: string[]; editedText?: string } = {}
): Promise<ApprovalResult> {
  const body: Record<string, unknown> = {
    category_tags: opts.categoryTags ?? [],
  };
  if (opts.editedText !== undefined) {
    body.edited_text = opts.editedText;
  }
  return fetchApi<ApprovalResult>(`/api/drafts/${draftId}/approve`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function rejectDraft(draftId: number): Promise<ApprovalResult> {
  return fetchApi<ApprovalResult>(`/api/drafts/${draftId}/reject`, {
    method: "POST",
  });
}

// Permanently remove a draft (queue cleanup). 409 if it's already
// published — manage live posts from the feed.
export async function deleteDraft(
  draftId: number,
): Promise<DeleteDraftResult> {
  return fetchApi<DeleteDraftResult>(`/api/drafts/${draftId}`, {
    method: "DELETE",
  });
}

export async function publishDraft(draftId: number): Promise<PublishResult> {
  return fetchApi<PublishResult>(`/api/drafts/${draftId}/publish`, {
    method: "POST",
  });
}

// ── Comments / replies ───────────────────────────────────────────

export async function fetchComments(
  accountId: number,
  params?: { limit?: number; status?: string },
): Promise<CommentsList> {
  const qs = new URLSearchParams();
  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.status) qs.set("status", params.status);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return fetchApi<CommentsList>(
    `/api/accounts/${accountId}/comments${suffix}`,
  );
}

// Remove a comment from the reply queue (won't-reply / stale / test data).
// Only clears it from our queue — does not touch the comment on Threads.
export async function dismissComment(
  commentId: number,
): Promise<{ comment_id: number; status: string }> {
  return fetchApi(`/api/comments/${commentId}`, { method: "DELETE" });
}

// Generate an AI reply draft for a comment. The backend may decline
// (is_skip) if the comment isn't worth replying to.
export async function generateReply(
  commentId: number,
): Promise<GeneratedReply> {
  return fetchApi<GeneratedReply>("/api/generation/replies", {
    method: "POST",
    body: JSON.stringify({ comment_id: commentId }),
  });
}

// ── Mentions ─────────────────────────────────────────────────────

export async function fetchMentions(
  accountId: number,
  params?: { limit?: number; status?: string },
): Promise<MentionsList> {
  const qs = new URLSearchParams();
  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.status) qs.set("status", params.status);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return fetchApi<MentionsList>(
    `/api/accounts/${accountId}/mentions${suffix}`,
  );
}

// ── Posts ────────────────────────────────────────────────────────

export async function fetchPosts(
  accountId: number,
  params?: { limit?: number },
): Promise<PostsList> {
  const qs = new URLSearchParams();
  if (params?.limit) qs.set("limit", String(params.limit));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return fetchApi<PostsList>(`/api/accounts/${accountId}/posts${suffix}`);
}

// Delete a published post from Threads (irreversible). Soft-deletes our
// row server-side so metrics history survives.
export async function deletePost(postId: number): Promise<DeletePostResult> {
  return fetchApi<DeletePostResult>(`/api/posts/${postId}`, {
    method: "DELETE",
  });
}

// ── My Feed (posts + inline analytics) ───────────────────────────
export async function fetchFeed(
  accountId: number,
  params?: { limit?: number },
): Promise<FeedResponse> {
  const qs = new URLSearchParams();
  if (params?.limit) qs.set("limit", String(params.limit));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return fetchApi<FeedResponse>(`/api/accounts/${accountId}/feed${suffix}`);
}

// ── Onboarding ───────────────────────────────────────────────────
export async function fetchOnboardingStatus(
  accountId: number,
): Promise<OnboardingStatus> {
  return fetchApi<OnboardingStatus>(`/api/accounts/${accountId}/onboarding`);
}

export async function onboardingAnalyze(
  accountId: number,
  postLimit = 25,
): Promise<OnboardingResult> {
  return fetchApi<OnboardingResult>(
    `/api/accounts/${accountId}/onboarding/analyze`,
    { method: "POST", body: JSON.stringify({ post_limit: postLimit }) },
  );
}

export async function onboardingFromScratch(
  accountId: number,
  input: FromScratchInput,
): Promise<OnboardingResult> {
  return fetchApi<OnboardingResult>(
    `/api/accounts/${accountId}/onboarding/from-scratch`,
    { method: "POST", body: JSON.stringify(input) },
  );
}

// ── Stats ─────────────────────────────────────────────────────────
export async function fetchStats(
  accountId: number,
  period: StatsPeriod = "7d",
): Promise<StatsResponse> {
  return fetchApi<StatsResponse>(
    `/api/accounts/${accountId}/stats?period=${period}`,
  );
}

// ── Autopilot ────────────────────────────────────────────────────

export async function fetchAutopilot(
  accountId: number,
): Promise<AutopilotConfig> {
  return fetchApi<AutopilotConfig>(`/api/accounts/${accountId}/autopilot`);
}

export async function updateAutopilot(
  accountId: number,
  config: AutopilotConfig,
): Promise<AutopilotConfig> {
  return fetchApi<AutopilotConfig>(`/api/accounts/${accountId}/autopilot`, {
    method: "PUT",
    body: JSON.stringify(config),
  });
}

// ── Autopost objects (autopilot redesign) ─────────────────────────
export async function fetchAutopostRules(
  accountId: number,
): Promise<AutopostRulesResponse> {
  return fetchApi<AutopostRulesResponse>(
    `/api/accounts/${accountId}/autopost-rules`,
  );
}

export async function setAutopilotMaster(
  accountId: number,
  enabled: boolean,
): Promise<{ master_enabled: boolean }> {
  return fetchApi(`/api/accounts/${accountId}/autopost-rules/master`, {
    method: "PUT",
    body: JSON.stringify({ enabled }),
  });
}

export async function createAutopostRule(
  accountId: number,
  body: Partial<Omit<AutopostRule, "id" | "enabled">>,
): Promise<AutopostRule> {
  return fetchApi<AutopostRule>(`/api/accounts/${accountId}/autopost-rules`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateAutopostRule(
  ruleId: number,
  patch: Partial<Omit<AutopostRule, "id">>,
): Promise<AutopostRule> {
  return fetchApi<AutopostRule>(`/api/autopost-rules/${ruleId}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function deleteAutopostRule(
  ruleId: number,
): Promise<{ id: number; status: string }> {
  return fetchApi(`/api/autopost-rules/${ruleId}`, { method: "DELETE" });
}

export async function refineDraft(
  draftId: number,
  instruction: string,
): Promise<RefineResult> {
  return fetchApi<RefineResult>(`/api/drafts/${draftId}/refine`, {
    method: "POST",
    body: JSON.stringify({ instruction }),
  });
}

// ── Audits ───────────────────────────────────────────────────────

export async function listAudits(opts?: {
  accountId?: number;
  status?: string;
  limit?: number;
}): Promise<AuditsList> {
  const qs = new URLSearchParams();
  if (opts?.accountId) qs.set("account_id", String(opts.accountId));
  if (opts?.status) qs.set("status", opts.status);
  if (opts?.limit) qs.set("limit", String(opts.limit));
  const tail = qs.toString() ? `?${qs.toString()}` : "";
  return fetchApi<AuditsList>(`/api/audits${tail}`);
}

export async function fetchAudit(auditId: number): Promise<AuditDetail> {
  return fetchApi<AuditDetail>(`/api/audits/${auditId}`);
}

export async function submitAuditDecisions(
  auditId: number,
  decisions: DecisionInput[],
): Promise<DecisionsResponse> {
  return fetchApi<DecisionsResponse>(`/api/audits/${auditId}/decisions`, {
    method: "POST",
    body: JSON.stringify({ decisions }),
  });
}

// ── Style rules (built-in anti-AI-tell defaults) ─────────────────

// Read the full catalog of built-in default rules with this account's
// on/off state. Every rule is ON unless the account opted out.
export async function fetchStyleRules(
  accountId: number,
): Promise<StyleRulesList> {
  return fetchApi<StyleRulesList>(`/api/accounts/${accountId}/style-rules`);
}

// Flip one rule on/off for this account. enabled=true removes the
// opt-out row, enabled=false inserts it. Returns the rule's new state.
export async function updateStyleRule(
  accountId: number,
  ruleKey: string,
  enabled: boolean,
): Promise<StyleRule> {
  return fetchApi<StyleRule>(
    `/api/accounts/${accountId}/style-rules/${ruleKey}`,
    {
      method: "PUT",
      body: JSON.stringify({ enabled }),
    },
  );
}

// ── Translation ──────────────────────────────────────────────────

export async function translateText(
  text: string,
  targetLang: LanguageCode
): Promise<Translation> {
  return fetchApi<Translation>("/api/translate", {
    method: "POST",
    body: JSON.stringify({ text, target_lang: targetLang }),
  });
}
