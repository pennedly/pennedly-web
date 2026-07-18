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
  AdvisorData,
  AdvisorMessage,
  AdvisorResponse,
  ApplyActionResponse,
  ApprovalResult,
  AutopilotConfig,
  AutopostActivity,
  AutopostRule,
  CalendarFeed,
  AutopostRulesResponse,
  AuditDetail,
  AuditsList,
  BatchGenerateResult,
  CommentPostsList,
  CommentsList,
  ComposerBoost,
  DecisionInput,
  DecisionsResponse,
  DeleteDraftResult,
  DeletePostResult,
  DraftsList,
  DraftVideo,
  EngagementHistory,
  MediaItem,
  MediaUploadResponse,
  FeedResponse,
  FollowerHistory,
  FromScratchInput,
  VoiceTestResponse,
  GeneratedDraft,
  IdeasResult,
  LinkPreview,
  OnboardingPreview,
  OnboardingResult,
  OnboardingStatus,
  PostGrowth,
  RefreshStatsResponse,
  StatsPeriod,
  StatsResponse,
  GeneratedReply,
  LanguageCode,
  LintFix,
  LintResult,
  Me,
  MeAccountResponse,
  MentionsList,
  OverviewResponse,
  PatternStudyResult,
  LatestSelfStudy,
  SelfStudyResult,
  PostsList,
  PublishResult,
  RefineResult,
  RoleBook,
  ScheduleResult,
  RoleBookSections,
  StyleRule,
  StyleRulesList,
  ThreadsConnectStart,
  TokenPair,
  Translation,
  UserRule,
  UserRulesResponse,
  Scenario,
  ScenarioActivity,
  ScenariosResponse,
  ScenarioCreate,
  ScenarioUpdate,
  ScenarioPreview,
  ScenarioPreviewRequest,
  ScenarioRunNow,
  PresetsResponse,
} from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export const TOKEN_KEY = "pennedly.tokens";

// Bounded so a stalled /refresh can't hold the cross-tab Web Lock (and every
// other tab's refresh) hostage until the OS socket timeout fires; and so a
// hung /logout can't stall the sign-out redirect.
const REFRESH_TIMEOUT_MS = 10_000;
const LOGOUT_TIMEOUT_MS = 3_000;

// AbortSignal.timeout is widely available; guard so an older engine simply gets
// no timeout (undefined signal = fetch ignores it) rather than a throw.
function timeoutSignal(ms: number): AbortSignal | undefined {
  return typeof AbortSignal !== "undefined" && "timeout" in AbortSignal
    ? AbortSignal.timeout(ms)
    : undefined;
}

export function setTokens(pair: TokenPair): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, JSON.stringify(pair));
  _emitTokensChanged();
}

// Reactive token-PRESENCE signal (for `useSyncExternalStore`): components
// subscribe so they react the moment a login writes the token or a logout clears
// it, WITHOUT waiting for a remount. This is the missing primitive that left an
// already-mounted authenticated shell unable to bootstrap after an in-SPA login
// (its mount-only effect never re-ran, so it only recovered on a full refresh).
// A boolean snapshot (`getTokens() !== null`) means a token-refresh rotation
// (which also calls setTokens) is a no-op re-render, only login/logout flip it.
const _tokensChangedListeners = new Set<() => void>();
function _emitTokensChanged(): void {
  for (const fn of _tokensChangedListeners) fn();
}
export function subscribeTokens(fn: () => void): () => void {
  _tokensChangedListeners.add(fn);
  return () => {
    _tokensChangedListeners.delete(fn);
  };
}

// Modules that cache per-user data (account-data, use-me) register here so a
// logout/401 wipes their module-scope caches — otherwise a logout→login in the
// SAME tab (client nav, no reload) would leak the previous user's data.
const _tokensClearedListeners: (() => void)[] = [];
export function onTokensCleared(fn: () => void): void {
  _tokensClearedListeners.push(fn);
}

export function clearTokens(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  for (const fn of _tokensClearedListeners) fn();
  _emitTokensChanged();
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

/**
 * Sign out. Clears the local tokens IMMEDIATELY (so the user is signed out
 * on this device the moment they click), then best-effort revokes the server
 * session so a leaked refresh token can't be redeemed for up to 30 days.
 * Never throws — a failed/blocked revoke still leaves the client signed out.
 * `keepalive` lets the revoke survive the redirect that usually follows.
 */
export async function logout(): Promise<void> {
  const refresh = getTokens()?.refresh_token;
  clearTokens();
  if (refresh && BASE_URL) {
    try {
      await fetch(`${BASE_URL}/api/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refresh }),
        keepalive: true,
        signal: timeoutSignal(LOGOUT_TIMEOUT_MS),
      });
    } catch {
      // Already signed out locally; a network failure here is non-fatal.
    }
  }
}

export class ApiError extends Error {
  status: number;
  detail: unknown;
  constructor(status: number, detail: unknown) {
    // Surface the backend's reason (FastAPI returns `{detail: "..."}`) in the
    // message so a toast says *why* — e.g. "monthly reply limit reached (429)"
    // instead of a bare "API 429".
    const reason =
      typeof detail === "string"
        ? detail
        : detail && typeof detail === "object" && typeof (detail as { detail?: unknown }).detail === "string"
          ? (detail as { detail: string }).detail
          : "";
    super(reason ? `${reason} (${status})` : `API ${status}`);
    this.status = status;
    this.detail = detail;
  }
}

// Shared in-flight refresh promise — coalesces concurrent 401s in THIS tab.
let refreshPromise: Promise<TokenPair | null> | null = null;

// The actual rotate call, run INSIDE a cross-tab lock (see refreshTokensOnce).
// `triggeringToken` is the refresh token that was current when our 401 fired.
// If a sibling tab already rotated it while we waited for the lock, we adopt
// the fresh pair instead of spending — and losing — another rotation.
async function rotateRefresh(triggeringToken: string): Promise<TokenPair | null> {
  const latest = getTokens();
  // A sibling tab already rotated → adopt its fresh pair, no server round-trip.
  if (latest?.refresh_token && latest.refresh_token !== triggeringToken) {
    return latest;
  }
  if (!latest?.refresh_token) return null;
  try {
    const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: latest.refresh_token }),
      signal: timeoutSignal(REFRESH_TIMEOUT_MS),
    });
    if (!res.ok) {
      // Before wiping the whole login, re-read once: a sibling may have rotated
      // between our read and this response — adopt the live pair if so.
      const after = getTokens();
      if (after?.refresh_token && after.refresh_token !== latest.refresh_token) {
        return after;
      }
      // Sign out ONLY on a genuine auth rejection. A 5xx / 429 (proxy blip,
      // cold start, rate-limit, brief restart) leaves a perfectly valid refresh
      // token — treat it as transient: keep the session, let the caller surface
      // a retryable error instead of a logout.
      if (res.status === 401 || res.status === 403) {
        clearTokens();
      }
      return null;
    }
    const pair = (await res.json()) as TokenPair;
    setTokens(pair);
    return pair;
  } catch {
    // Network reject / timeout abort — keep tokens; a blip is survivable.
    return null;
  }
}

async function refreshTokensOnce(): Promise<TokenPair | null> {
  if (refreshPromise) return refreshPromise;
  const triggering = getTokens()?.refresh_token;
  if (!triggering) return null;

  refreshPromise = (async () => {
    try {
      // Serialize refresh ACROSS TABS. Without this, two tabs whose access
      // token expired both POST /refresh with the same token; rotation lets one
      // win and revokes the other's, whose failure used to clearTokens() and
      // take the whole shared-origin login down (the top cause of "logged out
      // for no reason"). The Web Lock makes the second tab read and reuse the
      // freshly-rotated token instead of racing. Prod is HTTPS (a secure
      // context), so Web Locks is available; the no-locks fallback below is
      // best-effort only (a narrow cross-tab wipe window remains) for legacy
      // engines.
      const locks = typeof navigator !== "undefined" ? navigator.locks : undefined;
      if (locks?.request) {
        return await locks.request("pennedly.token-refresh", () =>
          rotateRefresh(triggering),
        );
      }
      return await rotateRefresh(triggering);
    } finally {
      // Release the per-tab lock on the next microtask so a follow-up call gets
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
  // FormData must keep the browser-generated multipart boundary — never force
  // a JSON content type on it (that's how file uploads go out).
  if (init?.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
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
    } else if (getTokens() !== null) {
      // Refresh failed but the session is still valid — rotateRefresh clears the
      // tokens ONLY on a genuine 401/403, so a surviving token means this was a
      // transient 5xx / rate-limit / network blip. Do NOT let the original 401
      // reach the page handlers (they sign the user out on any 401). Surface a
      // retryable error instead, so a proxy hiccup can't log the user out.
      throw new ApiError(503, {
        detail: "Authentication temporarily unavailable, please retry.",
      });
    }
    // else: refresh cleared the tokens (genuine expiry/revoke) → fall through so
    // the original 401 propagates and the page handlers sign out correctly.
  }

  if (!res.ok) {
    // Read the body ONCE as text, then try JSON. The old json()-then-text()
    // fallback double-consumed the stream: on a non-JSON body (a proxy's HTML
    // 502 page) res.json() marked the body used, the fallback res.text() threw
    // "body already read", and the caller saw a bare TypeError instead of
    // ApiError(502, html) — which error UIs then misread as a network failure.
    let body: unknown = null;
    try {
      const raw = await res.text();
      try {
        body = JSON.parse(raw);
      } catch {
        body = raw;
      }
    } catch {
      body = null;
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

export async function requestMagicLink(
  email: string,
  locale?: string,
): Promise<void> {
  await fetchApi<void>("/api/auth/magic-link/request", {
    method: "POST",
    body: JSON.stringify({ email, locale }),
  });
}

export async function consumeMagicLink(token: string): Promise<TokenPair> {
  return fetchApi<TokenPair>("/api/auth/magic-link/consume", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export async function requestEmailCode(
  email: string,
  locale?: string,
): Promise<void> {
  await fetchApi<void>("/api/auth/email-code/request", {
    method: "POST",
    body: JSON.stringify({ email, locale }),
  });
}

export async function verifyEmailCode(
  email: string,
  code: string,
): Promise<TokenPair> {
  return fetchApi<TokenPair>("/api/auth/email-code/verify", {
    method: "POST",
    body: JSON.stringify({ email, code }),
  });
}

/** Absolute backend URL to begin Google sign-in (a full-page navigation). */
export function googleSignInUrl(): string {
  return `${BASE_URL}/api/auth/google/start`;
}

/** Swap the one-time handoff token (from the Google callback redirect) for a
 * session pair. */
export async function exchangeGoogleHandoff(handoff: string): Promise<TokenPair> {
  return fetchApi<TokenPair>("/api/auth/google/exchange", {
    method: "POST",
    body: JSON.stringify({ handoff }),
  });
}

// ── Me ───────────────────────────────────────────────────────────

export async function fetchMe(): Promise<Me> {
  return fetchApi<Me>("/api/me");
}

export async function fetchMyAccounts(): Promise<AccountsList> {
  return fetchApi<AccountsList>("/api/me/accounts");
}

// Portfolio rollup for the Overview / "All accounts" screen: per-account
// headline numbers + sync state + pre-computed totals across the user's synced
// accounts. Owner-only, all of the user's accounts in one request.
export async function fetchOverview(): Promise<OverviewResponse> {
  return fetchApi<OverviewResponse>("/api/me/overview");
}

// The account dashboard (the portfolio home, Account → Brands → Profiles): the
// user's brands each with their profiles + metric roll-ups, portfolio totals, an
// account-wide triage-tasks block, and the adaptive-IA `scope` hint (whether the
// brand level is shown). Owner-only, one request.
export async function fetchMeAccount(): Promise<MeAccountResponse> {
  return fetchApi<MeAccountResponse>("/api/me/account");
}

// The account-dashboard advisor HERO: a cached, portfolio-wide growth verdict.
// Tester-gated + fetched SEPARATELY from the dashboard so an LLM cache-miss never
// blocks the screen. Returns null on 204 (not enough portfolio data yet → the UI
// keeps its honest invite). `?refresh=1` forces a fresh generation (tester QA).
export async function fetchMeAccountAdvisor(
  opts?: { refresh?: boolean },
): Promise<AdvisorData | null> {
  const q = opts?.refresh ? "?refresh=1" : "";
  const data = await fetchApi<AdvisorData | undefined>(
    `/api/me/account/advisor${q}`,
  );
  return data ?? null;
}

// The account-scope advisor CHAT (tester-gated): the conversational sibling of
// the dashboard hero. Sends the whole conversation and returns the advisor's
// next reply, grounded in the WHOLE portfolio's data. Same response shape as the
// per-account chat, so it renders with the identical chat components.
export async function chatAccountAdvisor(
  messages: AdvisorMessage[],
): Promise<AdvisorResponse> {
  return fetchApi<AdvisorResponse>(`/api/me/account/advisor/chat`, {
    method: "POST",
    body: JSON.stringify({
      messages,
      tz_offset: -new Date().getTimezoneOffset(),
    }),
  });
}

// Apply a one-click advisor action against a target profile (owner-scoped,
// tester-gated). CLOSED catalog:
//   • "routine"      → ask-mode posting scenario + arms post automation;
//                      response carries the created scenario_id for the deep-link.
//   • "auto_replies" → turns ON the auto-reply policy (audience / cap / skip);
//                      no scenario created (scenario_id is null).
//   • "voice_rule"   → ADDS one standing rule to the account's voice (additive);
//                      no scenario created (scenario_id is null).
//   • "schedule_post"→ generates one post + schedules it to auto-publish at
//                      scheduled_at; response carries draft_id + scheduled_at.
//   • "reactive"     → enables one ask-mode reactive scenario (amplify / milestone
//                      / booster); response carries the created scenario_id.
//   • "format"       → enables one ask-mode posting-format scenario (daily_question
//                      / rubric); response carries the created scenario_id.
type ApplyActionInput =
  | { type: "routine"; title: string; topic: string; times_per_day: number }
  | {
      type: "auto_replies";
      title: string;
      audience: "questions" | "fans" | "all_except_trolls";
      replies_per_day: number;
      skip_low_value: boolean;
    }
  | {
      type: "voice_rule";
      title: string;
      rule_text: string;
      kind: "post" | "reply" | "both";
    }
  | {
      type: "schedule_post";
      title: string;
      brief: string;
      // Absolute UTC instant the FE resolved from the model's weekday+hour.
      scheduled_at: string;
    }
  | {
      type: "reactive";
      title: string;
      kind: "amplify" | "milestone" | "booster";
      comment_text?: string;
    }
  | {
      type: "format";
      title: string;
      kind: "daily_question" | "rubric" | "poll";
      topic?: string;
      rubric_name?: string;
      rubric_idea?: string;
      question?: string;
      options?: string[];
    }
  | {
      type: "automation";
      title: string;
      kind: "pause" | "quiet_hours" | "resume";
      // Account-local nightly hours (0..23); sent only for quiet_hours.
      quiet_start?: number;
      quiet_end?: number;
    }
  | {
      type: "best_time_routine";
      title: string;
      topic?: string;
      // The chosen best-time blocks; the server re-resolves them → hours.
      blocks: string[];
    }
  | {
      type: "topics_list";
      title: string;
      topics: string[];
    };

export async function applyAdvisorAction(
  accountId: number,
  action: ApplyActionInput,
): Promise<ApplyActionResponse> {
  return fetchApi<ApplyActionResponse>(`/api/accounts/${accountId}/advisor/apply`, {
    method: "POST",
    body: JSON.stringify(action),
  });
}

// Disconnect a connected Threads account: drops the stored token + marks it
// disconnected server-side, but keeps the account's content. Reconnect via
// OAuth restores it.
export async function disconnectAccount(
  accountId: number,
): Promise<{ account_id: number; status: string; disconnected_at: string }> {
  return fetchApi(`/api/accounts/${accountId}/disconnect`, { method: "POST" });
}

// Permanently delete the signed-in user's account and ALL their data (GDPR
// right-to-erasure). Irreversible — the caller must drop tokens + redirect.
export async function deleteAccount(): Promise<{
  status: string;
  deleted_tenant_ids: number[];
}> {
  return fetchApi("/api/me", { method: "DELETE" });
}

// GDPR data export (Art. 20): the full account dump as a JSON object. The
// caller turns it into a downloadable file.
export async function exportAccountData(): Promise<unknown> {
  return fetchApi("/api/me/export");
}

// Kick off the Threads OAuth connect. Returns the Meta authorize URL the
// caller should navigate the browser to. `returnTo` is where Meta's
// callback will 302 us back (must be an allowlisted web origin).
//
// `credentials: "include"` is REQUIRED: /start sets an httpOnly nonce cookie the
// callback matches to block the account-linking CSRF (S1), and the browser only
// stores a cross-origin Set-Cookie (app.pennedly.com → api.pennedly.com) when
// the request is credentialed. CORS already allows credentials with an explicit
// (non-wildcard) origin list.
export async function startThreadsConnect(
  returnTo: string,
): Promise<ThreadsConnectStart> {
  const qs = new URLSearchParams({ return_to: returnTo });
  return fetchApi<ThreadsConnectStart>(
    `/api/threads/oauth/start?${qs.toString()}`,
    { credentials: "include" },
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

// Self pattern-study — deterministic patterns in the account's OWN posts.
// 422 { reason: "insufficient_posts", posts_available, posts_needed } below
// the post floor (the screen shows progress toward it).
export async function runPatternStudy(
  accountId: number,
): Promise<SelfStudyResult> {
  return fetchApi<SelfStudyResult>(
    `/api/accounts/${accountId}/patterns/study`,
    { method: "POST" },
  );
}

// Q54: the last persisted self-study, so revisits show it without recomputing.
export async function fetchPatternStudyLatest(
  accountId: number,
): Promise<LatestSelfStudy> {
  return fetchApi<LatestSelfStudy>(
    `/api/accounts/${accountId}/patterns/study/latest`,
  );
}

// ── Generation ───────────────────────────────────────────────────

export async function generatePost(
  accountId: number,
  topicId?: number,
  prompt?: string,
): Promise<GeneratedDraft> {
  return fetchApi<GeneratedDraft>("/api/generation/posts", {
    method: "POST",
    body: JSON.stringify({
      account_id: accountId,
      topic_id: topicId ?? null,
      prompt: prompt?.trim() || null,
    }),
  });
}

export async function generateIdeas(
  accountId: number,
  count = 8,
): Promise<IdeasResult> {
  return fetchApi<IdeasResult>("/api/generation/ideas", {
    method: "POST",
    body: JSON.stringify({ account_id: accountId, count }),
  });
}

// Growth Advisor chat (tester-gated). Sends the whole conversation (prior
// messages + the new user message as the last item) and returns the advisor's
// next reply, grounded in this account's own data. Non-streaming.
export async function chatAdvisor(
  accountId: number,
  messages: AdvisorMessage[],
): Promise<AdvisorResponse> {
  return fetchApi<AdvisorResponse>(`/api/accounts/${accountId}/advisor`, {
    method: "POST",
    body: JSON.stringify({
      messages,
      // Minutes to ADD to UTC for the viewer's local time, so "best times"
      // land in the author's own clock (matches the /stats convention).
      tz_offset: -new Date().getTimezoneOffset(),
    }),
  });
}

export async function generatePostBatch(
  accountId: number,
  count: number,
  topicId?: number,
  prompt?: string,
): Promise<BatchGenerateResult> {
  return fetchApi<BatchGenerateResult>("/api/generation/posts/batch", {
    method: "POST",
    body: JSON.stringify({
      account_id: accountId,
      count,
      topic_id: topicId ?? null,
      prompt: prompt?.trim() || null,
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

// Phase 4: generate an image for an ask-mode generate_image mention draft and
// attach it (owner-triggered from the mentions queue). Returns the attached image
// + the account's daily image count. 422 on a safety refusal / photo-less mention,
// 429 at the daily cap.
export type GenerateImageResult = {
  draft_id: number;
  media: { url: string; alt: string | null }[];
  images_generated_today: number;
};
export async function generateDraftImage(draftId: number): Promise<GenerateImageResult> {
  return fetchApi<GenerateImageResult>(`/api/drafts/${draftId}/generate-image`, {
    method: "POST",
  });
}

// Persist an in-progress edit of a PENDING draft (Studio «Save») so it survives a
// reload and re-renders instead of reverting to the LLM text. The server stores it
// in content_drafts.edited_text (separate from the immutable LLM generated_text);
// the list then shows the edit and a later approve ships it. 409 once the draft is
// approved/published — send it back to draft first.
export async function updateDraftText(
  draftId: number,
  text: string,
): Promise<{ id: number; text: string }> {
  return fetchApi<{ id: number; text: string }>(`/api/drafts/${draftId}`, {
    method: "PATCH",
    body: JSON.stringify({ text }),
  });
}

// Send an approved-but-unpublished draft back to `pending` so it can be edited
// again (the «ready» card's «На доработку»). Drops the few-shot corpus row the
// approval created + detaches any schedule; 409 once the post is live.
export async function unapproveDraft(
  draftId: number,
): Promise<{ draft_id: number; status: string }> {
  return fetchApi<{ draft_id: number; status: string }>(
    `/api/drafts/${draftId}/unapprove`,
    { method: "POST" },
  );
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

// Publish an approved draft to Threads. With `boost` (entry-point B), the
// backend also creates a boost scenario watching the post just published and
// returns its id in `boost_scenario_id`. Omitting `boost` sends a bodyless POST
// — byte-for-byte the same request as before, so a plain publish is unchanged.
export async function publishDraft(
  draftId: number,
  boost?: ComposerBoost,
): Promise<PublishResult> {
  return fetchApi<PublishResult>(`/api/drafts/${draftId}/publish`, {
    method: "POST",
    ...(boost ? { body: JSON.stringify({ boost }) } : {}),
  });
}

// Pin an approved post draft to a future UTC time (the worker publishes it
// then). Re-call to reschedule. `scheduledAtIso` is a full ISO-8601 instant.
// With `boost` (entry-point B), the intent is parked on the draft and the
// worker creates the post-targeted boost scenario once it publishes. Omitting
// `boost` sends only `scheduled_at` — the original request, unchanged.
export async function scheduleDraft(
  draftId: number,
  scheduledAtIso: string,
  boost?: ComposerBoost,
): Promise<ScheduleResult> {
  return fetchApi<ScheduleResult>(`/api/drafts/${draftId}/schedule`, {
    method: "POST",
    body: JSON.stringify({
      scheduled_at: scheduledAtIso,
      ...(boost ? { boost } : {}),
    }),
  });
}

// Drop a draft's schedule — back to a plain approved draft.
export async function unscheduleDraft(
  draftId: number,
): Promise<ScheduleResult> {
  return fetchApi<ScheduleResult>(`/api/drafts/${draftId}/unschedule`, {
    method: "POST",
  });
}

// Re-arm a draft whose scheduled publish failed (worker retries next tick).
export async function retryScheduledDraft(
  draftId: number,
): Promise<ScheduleResult> {
  return fetchApi<ScheduleResult>(`/api/drafts/${draftId}/retry`, {
    method: "POST",
  });
}

// ── Media (images on posts) ──────────────────────────────────────

// Upload one image for an account. Multipart — the browser sets the
// boundary. Returns a relative `/media/...` URL to attach to a draft.
export async function uploadMedia(
  accountId: number,
  file: File,
): Promise<MediaUploadResponse> {
  const form = new FormData();
  form.append("file", file);
  return fetchApi<MediaUploadResponse>(`/api/accounts/${accountId}/media`, {
    method: "POST",
    body: form,
  });
}

// Attach (or clear, with []) the images on a post draft. URLs must be ones
// uploadMedia returned; capped at 10 (the Threads carousel max).
export async function setDraftMedia(
  draftId: number,
  media: MediaItem[],
): Promise<{ draft_id: number; media: MediaItem[] }> {
  return fetchApi(`/api/drafts/${draftId}/media`, {
    method: "PUT",
    body: JSON.stringify({ media }),
  });
}

// Attach (or clear, with null) the single video on a post draft. The URL must
// be one uploadMedia returned (same endpoint as images). Attaching a video
// clears any attached images (mutual exclusion).
export async function setDraftVideo(
  draftId: number,
  video: DraftVideo | null,
): Promise<{ draft_id: number; video: DraftVideo | null }> {
  return fetchApi(`/api/drafts/${draftId}/video`, {
    method: "PUT",
    body: JSON.stringify({ video }),
  });
}

// Absolute URL for a stored media path so the <img> resolves against the
// backend host (the web app and the media live on different origins).
export function mediaUrl(url: string): string {
  // No scheme → a stored media path; resolve it against the backend host.
  if (!/^[a-z][a-z0-9+.-]*:/i.test(url)) return `${BASE_URL}${url}`;
  // Has a scheme: only let safe ones reach an <img src>. An upstream value
  // (e.g. a page's og:image) could be javascript:/data:text — never pass those
  // through. http(s) for remote, blob: for local previews, data:image/* inline.
  return /^(https?:|blob:|data:image\/)/i.test(url) ? url : "";
}

// Fetch an OpenGraph preview card for a URL found in a post body. Resolves to
// null when the backend can't build one (blocked/unfetchable/no-OG/rate-limited)
// — callers simply render nothing in that case.
export async function fetchLinkPreview(url: string): Promise<LinkPreview | null> {
  try {
    return await fetchApi<LinkPreview>(`/api/link-preview?url=${encodeURIComponent(url)}`);
  } catch {
    return null;
  }
}

// The content Calendar window — scheduled/failed drafts + autopilot projection.
export async function fetchCalendar(
  accountId: number,
  fromIso: string,
  toIso: string,
): Promise<CalendarFeed> {
  const qs = new URLSearchParams({ from: fromIso, to: toIso });
  return fetchApi<CalendarFeed>(
    `/api/accounts/${accountId}/calendar?${qs.toString()}`,
  );
}

// ── Comments / replies ───────────────────────────────────────────

export async function fetchComments(
  accountId: number,
  params?: { limit?: number; offset?: number; status?: string; postId?: number },
): Promise<CommentsList> {
  const qs = new URLSearchParams();
  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.offset) qs.set("offset", String(params.offset));
  if (params?.status) qs.set("status", params.status);
  // Scope to a single post's thread (the Replies screen loads one post at a
  // time); status_counts stays account-wide regardless.
  if (params?.postId != null) qs.set("post_id", String(params.postId));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return fetchApi<CommentsList>(
    `/api/accounts/${accountId}/comments${suffix}`,
  );
}

// One row per post that HAS comments (newest post first), paginated by POST.
// Drives the Replies post rail + its per-post comment-count badges, so the rail
// no longer derives from a flat, globally-paginated comment list.
export async function fetchCommentPosts(
  accountId: number,
  params?: { limit?: number; offset?: number },
): Promise<CommentPostsList> {
  const qs = new URLSearchParams();
  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.offset) qs.set("offset", String(params.offset));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return fetchApi<CommentPostsList>(
    `/api/accounts/${accountId}/comment-posts${suffix}`,
  );
}

// Remove a comment from the reply queue (won't-reply / stale / test data).
// Only clears it from our queue — does not touch the comment on Threads.
export async function dismissComment(
  commentId: number,
): Promise<{ comment_id: number; status: string }> {
  return fetchApi(`/api/comments/${commentId}`, { method: "DELETE" });
}

// Skip a comment without replying — moves it to the "skipped" tab.
// Reversible (unlike dismiss); never touches Threads.
export async function skipComment(
  commentId: number,
): Promise<{ comment_id: number; status: string }> {
  return fetchApi(`/api/comments/${commentId}/skip`, { method: "POST" });
}

// Restore a skipped comment back into the queue as "new" (clears any draft).
export async function restoreComment(
  commentId: number,
): Promise<{ comment_id: number; status: string }> {
  return fetchApi(`/api/comments/${commentId}/restore`, { method: "POST" });
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

// Owner-triggered draft of a reply to a QUEUE-only / feed @mention (the bot never
// auto-answers those). Stamps the mention `drafted`; `is_skip` when the model
// declined. 409 if the mention isn't awaiting a draft, 429 at the monthly quota.
export async function generateMentionReply(
  mentionId: number,
): Promise<GeneratedReply> {
  return fetchApi<GeneratedReply>("/api/generation/mention-replies", {
    method: "POST",
    body: JSON.stringify({ mention_id: mentionId }),
  });
}

// Skip a mention without replying (moves it to `skipped`, rejects any pending
// draft). Backs «Пропустить» and «Отклонить». 409 if already replied.
export async function skipMention(
  mentionId: number,
): Promise<{ mention_id: number; status: string }> {
  return fetchApi(`/api/mentions/${mentionId}/skip`, { method: "POST" });
}

// Restore a skipped mention back to `new` (clears any draft). 409 if not skipped.
export async function restoreMention(
  mentionId: number,
): Promise<{ mention_id: number; status: string }> {
  return fetchApi(`/api/mentions/${mentionId}/restore`, { method: "POST" });
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

// Toggle whether the auto-reply sweep answers new comments under this post.
export async function setPostAutoReply(
  postId: number,
  autoReply: boolean,
): Promise<{ post_id: number; auto_reply: boolean }> {
  return fetchApi(`/api/posts/${postId}`, {
    method: "PATCH",
    body: JSON.stringify({ auto_reply: autoReply }),
  });
}

// ── My Feed (posts + inline analytics) ───────────────────────────
export async function fetchFeed(
  accountId: number,
  params?: { limit?: number; offset?: number; sort?: "recent" | "top" },
): Promise<FeedResponse> {
  const qs = new URLSearchParams();
  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.offset) qs.set("offset", String(params.offset));
  // Server-side order (C6): 'top' ranks by lifetime views across the WHOLE
  // history — a client-side sort of the loaded page can't surface old hits.
  if (params?.sort && params.sort !== "recent") qs.set("sort", params.sort);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return fetchApi<FeedResponse>(`/api/accounts/${accountId}/feed${suffix}`);
}

// Persist the user's UI language server-side so server-generated copy
// (the weekly audit) is written in it. Fire-and-forget from the UI.
export async function setMyLocale(
  locale: string,
): Promise<{ locale: string }> {
  return fetchApi(`/api/me/locale`, {
    method: "PUT",
    body: JSON.stringify({ locale }),
  });
}

// Update the signed-in user's display name (the Account Settings Name field).
// Trimmed + length-bounded server-side; email stays immutable.
export async function updateMyDisplayName(
  displayName: string,
): Promise<{ display_name: string }> {
  return fetchApi(`/api/me`, {
    method: "PATCH",
    body: JSON.stringify({ display_name: displayName }),
  });
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

// Tester-only preview variants — run for real, return the result, save
// nothing (the account's voice/topics/prompts are untouched).
export async function onboardingAnalyzePreview(
  accountId: number,
  postLimit = 25,
): Promise<OnboardingPreview> {
  return fetchApi<OnboardingPreview>(
    `/api/accounts/${accountId}/onboarding/analyze/preview`,
    { method: "POST", body: JSON.stringify({ post_limit: postLimit }) },
  );
}

export async function onboardingFromScratchPreview(
  accountId: number,
  input: FromScratchInput,
): Promise<OnboardingPreview> {
  return fetchApi<OnboardingPreview>(
    `/api/accounts/${accountId}/onboarding/from-scratch/preview`,
    { method: "POST", body: JSON.stringify(input) },
  );
}

// ── Stats ─────────────────────────────────────────────────────────
// Stats by period (today/7d/…) OR by `weeks=N` (last N whole weeks, weekly
// buckets — what the /app/stats range control uses). `weeks` wins if given.
export async function fetchStats(
  accountId: number,
  opts?: { period?: StatsPeriod; weeks?: number },
): Promise<StatsResponse> {
  const qs = new URLSearchParams();
  if (opts?.weeks != null) qs.set("weeks", String(opts.weeks));
  else qs.set("period", opts?.period ?? "7d");
  // Viewer's local-time offset for the by_hour/by_weekday publish-time
  // panels (minutes to ADD to UTC — the inverse of getTimezoneOffset).
  qs.set("tz_offset", String(-new Date().getTimezoneOffset()));
  return fetchApi<StatsResponse>(`/api/accounts/${accountId}/stats?${qs}`);
}

export async function fetchFollowers(
  accountId: number,
  days = 120,
): Promise<FollowerHistory> {
  return fetchApi<FollowerHistory>(
    `/api/accounts/${accountId}/followers?days=${days}`,
  );
}

// Account-level engagement series for the /app/stats Engagement panel. We pull
// the full window (days=365, the contract max) ONCE and derive the 30d/90d/1y
// views client-side, so switching range/metric never refetches. `days` is
// clamped server-side to [1, 365].
export async function fetchEngagement(
  accountId: number,
  days = 365,
): Promise<EngagementHistory> {
  return fetchApi<EngagementHistory>(
    `/api/accounts/${accountId}/engagement?days=${days}`,
  );
}

// Pull fresh metrics for ALL analytics numbers on demand (post views/likes/
// reposts/comments + follower count). `force=true` is the explicit Refresh
// button (short anti-double-click guard); `force=false` is the screen's
// open-auto-refresh (gentler 2-min guard). Server-throttled either way.
export async function refreshStats(
  accountId: number,
  force = false,
): Promise<RefreshStatsResponse> {
  return fetchApi<RefreshStatsResponse>(
    `/api/accounts/${accountId}/stats/refresh?force=${force}`,
    { method: "POST" },
  );
}

export async function voiceTest(posts: string[]): Promise<VoiceTestResponse> {
  return fetchApi<VoiceTestResponse>("/api/voice-test", {
    method: "POST",
    body: JSON.stringify({ posts }),
  });
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

export async function fetchAutopostActivity(
  accountId: number,
): Promise<AutopostActivity> {
  return fetchApi<AutopostActivity>(
    `/api/accounts/${accountId}/autopost-activity`,
  );
}

// A single post's metrics over time (for the growth curve on the feed).
export async function fetchPostMetricsHistory(
  postId: number,
): Promise<PostGrowth> {
  return fetchApi<PostGrowth>(`/api/posts/${postId}/metrics-history`);
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

// ── Scenarios (recurring/conditional content — the «рутинный автопилот») ─────
// The preset catalog the discovery gallery + the editor pre-fill read. Baked
// instructions arrive already localized to the owner's locale (EN fallback).
export async function fetchScenarioPresets(): Promise<PresetsResponse> {
  return fetchApi<PresetsResponse>(`/api/scenarios/presets`);
}

export async function fetchScenarios(accountId: number): Promise<ScenariosResponse> {
  return fetchApi<ScenariosResponse>(`/api/accounts/${accountId}/scenarios`);
}

export async function getScenario(scenarioId: number): Promise<Scenario> {
  return fetchApi<Scenario>(`/api/scenarios/${scenarioId}`);
}

export async function createScenario(
  accountId: number,
  body: ScenarioCreate,
): Promise<Scenario> {
  return fetchApi<Scenario>(`/api/accounts/${accountId}/scenarios`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateScenario(
  scenarioId: number,
  patch: ScenarioUpdate,
): Promise<Scenario> {
  return fetchApi<Scenario>(`/api/scenarios/${scenarioId}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function setScenarioEnabled(
  scenarioId: number,
  enabled: boolean,
): Promise<Scenario> {
  return fetchApi<Scenario>(`/api/scenarios/${scenarioId}/enabled`, {
    method: "PATCH",
    body: JSON.stringify({ enabled }),
  });
}

export async function deleteScenario(scenarioId: number): Promise<{ ok: boolean }> {
  return fetchApi(`/api/scenarios/${scenarioId}`, { method: "DELETE" });
}

export async function fetchScenarioActivity(scenarioId: number): Promise<ScenarioActivity> {
  return fetchApi<ScenarioActivity>(`/api/scenarios/${scenarioId}/activity`);
}

// Approve («Спроси меня» drafts) → publishes the pending draft; skip → discards it.
export async function confirmScenarioDraft(scenarioId: number, draftId: number): Promise<{ ok: boolean }> {
  return fetchApi(`/api/scenarios/${scenarioId}/drafts/${draftId}/confirm`, { method: "POST" });
}
export async function skipScenarioDraft(scenarioId: number, draftId: number): Promise<{ ok: boolean }> {
  return fetchApi(`/api/scenarios/${scenarioId}/drafts/${draftId}/skip`, { method: "POST" });
}

export async function previewScenario(
  accountId: number,
  // Promo helper: `{ promo }`. Free scenario: `{ instruction }`. The server
  // exercises exactly one fork (promo wins if both are sent).
  body: ScenarioPreviewRequest,
): Promise<ScenarioPreview> {
  return fetchApi<ScenarioPreview>(
    `/api/accounts/${accountId}/scenarios/preview`,
    { method: "POST", body: JSON.stringify(body) },
  );
}

// «Прогнать сейчас» — generates a DRAFT only (never publishes). For a post
// scenario → a post draft; for a reply_policy scenario → a sample reply drafted
// against a recent eligible comment. Tester-gated server-side.
export async function runScenarioNow(scenarioId: number): Promise<ScenarioRunNow> {
  return fetchApi<ScenarioRunNow>(`/api/scenarios/${scenarioId}/run-now`, {
    method: "POST",
  });
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

// Whether the weekly audit is enabled for this account (it's OFF / opt-in by
// default). The «Аудит» screen reads this to show the explainer + «Включить»
// CTA vs the audit list.
export async function getAuditSettings(accountId: number): Promise<{ enabled: boolean }> {
  return fetchApi<{ enabled: boolean }>(`/api/audits/settings?account_id=${accountId}`);
}

export async function setAuditSettings(
  accountId: number,
  enabled: boolean,
): Promise<{ enabled: boolean }> {
  return fetchApi<{ enabled: boolean }>(`/api/audits/settings`, {
    method: "PATCH",
    body: JSON.stringify({ account_id: accountId, enabled }),
  });
}

// Set the account's IANA timezone (the cadence + quiet-hours clock). Used to
// auto-detect the browser timezone on a fresh connect (the per-account tz had no
// writer before, so non-UTC schedules silently ran in UTC).
export async function setAccountTimezone(
  accountId: number,
  timezone: string,
): Promise<{ timezone: string }> {
  return fetchApi<{ timezone: string }>(`/api/accounts/${accountId}`, {
    method: "PATCH",
    body: JSON.stringify({ timezone }),
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

// ── User rules (the account's own manual rules) ──────────────────
export async function fetchUserRules(
  accountId: number,
): Promise<UserRulesResponse> {
  return fetchApi<UserRulesResponse>(`/api/accounts/${accountId}/user-rules`);
}

export async function createUserRule(
  accountId: number,
  input: { kind: string; body: string; enabled?: boolean },
): Promise<UserRule> {
  return fetchApi<UserRule>(`/api/accounts/${accountId}/user-rules`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateUserRule(
  ruleId: number,
  patch: Partial<Pick<UserRule, "body" | "enabled" | "kind" | "sort_order">>,
): Promise<UserRule> {
  return fetchApi<UserRule>(`/api/user-rules/${ruleId}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function deleteUserRule(
  ruleId: number,
): Promise<{ id: number; status: string }> {
  return fetchApi(`/api/user-rules/${ruleId}`, { method: "DELETE" });
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
