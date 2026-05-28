// Thin fetch wrapper that reads/writes the JWT from localStorage and
// always sends Bearer auth on subsequent calls. No refresh-token rotation
// yet; access tokens are 60-minute-lived so re-login is fine for Phase 1.

import type {
  ApprovalResult,
  DraftsList,
  GeneratedDraft,
  LanguageCode,
  LintResult,
  Me,
  RoleBook,
  RoleBookSections,
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

async function fetchApi<T>(path: string, init?: RequestInit): Promise<T> {
  if (!BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }
  const tokens = getTokens();
  const headers = new Headers(init?.headers);
  if (tokens?.access_token) {
    headers.set("Authorization", `Bearer ${tokens.access_token}`);
  }
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers });
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

// ── Me ───────────────────────────────────────────────────────────

export async function fetchMe(): Promise<Me> {
  return fetchApi<Me>("/api/me");
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
  categoryTags: string[] = []
): Promise<ApprovalResult> {
  return fetchApi<ApprovalResult>(`/api/drafts/${draftId}/approve`, {
    method: "POST",
    body: JSON.stringify({ category_tags: categoryTags }),
  });
}

export async function rejectDraft(draftId: number): Promise<ApprovalResult> {
  return fetchApi<ApprovalResult>(`/api/drafts/${draftId}/reject`, {
    method: "POST",
  });
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
