"use client";

// Shared MCP personal-token logic (§7.17) — fetch / create / revoke / copy —
// the ONE source of truth used by BOTH the per-profile Settings screen
// (/app/settings, src/app/app/settings/page.tsx) and the account-dashboard
// Settings screen (/app/account/settings, components/account/AccountSettings)
// so the create/revoke calls + analytics events never drift into two
// independently-maintained copies. Each screen owns only its own presentation
// (which card/section shape) and its own demo-mode wiring (which tokens to
// show offline).

import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import { createMcpToken, fetchMcpTokens, getTokens, revokeMcpToken } from "@/lib/api";
import { friendlyErrorText } from "@/lib/errors";
import { captureEvent } from "@/lib/analytics";
import type { CreateMcpTokenResponse, McpTokenScope, McpTokenSummary } from "@/lib/types";

// The fixed prod MCP endpoint + the Claude Desktop config shape. Claude
// Desktop's own config only speaks stdio, so the config routes through
// `mcp-remote` to bridge to our HTTP+header MCP server. This is the verified
// shape (already shipped in the old Settings screen) — NOT the design mock's
// more literal `url`/`headers` shape, which its own SPEC flags as
// "ориентировочный" (approximate, to be checked against the backend).
export const MCP_ENDPOINT = "https://api.pennedly.com/mcp";
export const MCP_CONFIG_SNIPPET = JSON.stringify(
  {
    mcpServers: {
      pennedly: {
        command: "npx",
        args: ["-y", "mcp-remote", MCP_ENDPOINT, "--header", "Authorization: Bearer <YOUR_TOKEN>"],
      },
    },
  },
  null,
  2,
);

export function formatMcpDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
}

export type UseMcpTokensOptions = {
  // Non-null (even []) puts the hook in offline demo mode: no fetch, and
  // create/revoke mutate local state only — no network call. Must be a
  // referentially stable value (a module-level constant, or memoized by the
  // caller) since it drives an effect dependency.
  demoTokens?: McpTokenSummary[] | null;
};

export function useMcpTokens(opts: UseMcpTokensOptions = {}) {
  const demoTokens = opts.demoTokens ?? null;
  const demoOn = demoTokens !== null;

  const [tokens, setTokens] = useState<McpTokenSummary[]>(demoTokens ?? []);
  const [loaded, setLoaded] = useState(demoOn);
  const [name, setName] = useState("");
  const [scope, setScope] = useState<McpTokenScope>("read");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  // The plaintext token exists here ONLY between creation and the user
  // dismissing the panel — never persisted, never logged, never re-fetched.
  const [reveal, setReveal] = useState<CreateMcpTokenResponse | null>(null);
  const [revokeConfirmId, setRevokeConfirmId] = useState<number | null>(null);
  const [revokingId, setRevokingId] = useState<number | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (demoTokens !== null) {
      setTokens(demoTokens);
      setLoaded(true);
      return;
    }
    if (!getTokens()) return;
    let alive = true;
    fetchMcpTokens()
      .then((r) => {
        if (alive) setTokens(r.tokens);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoaded(true);
      });
    return () => {
      alive = false;
    };
    // `demoTokens` is the real dependency (not a derived `demoOn` boolean) —
    // callers must pass a stable reference (a module constant or a memoized
    // value) or this refetches/resets every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demoTokens]);

  function copy(text: string, which: string) {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(which);
    setTimeout(() => setCopied((v) => (v === which ? null : v)), 1800);
  }

  function resetForm() {
    setName("");
    setScope("read");
    setCreateError(null);
  }

  async function create(e?: FormEvent) {
    e?.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || creating) return;
    setCreating(true);
    setCreateError(null);
    captureEvent("ui.mcp_token_create", { scope });
    if (demoOn) {
      const id = Math.max(0, ...tokens.map((x) => x.id)) + 1;
      const created_at = new Date().toISOString();
      setTokens((list) => [{ id, name: trimmed, scope, created_at, last_used_at: null, revoked_at: null }, ...list]);
      setReveal({ id, name: trimmed, scope, created_at, token: `pnd_mcp_demo_${Math.random().toString(36).slice(2, 18)}` });
      resetForm();
      setCreating(false);
      return;
    }
    try {
      const created = await createMcpToken(trimmed, scope);
      setTokens((list) => [
        { id: created.id, name: created.name, scope: created.scope, created_at: created.created_at, last_used_at: null, revoked_at: null },
        ...list,
      ]);
      setReveal(created);
      resetForm();
    } catch (err) {
      setCreateError(friendlyErrorText(err));
    } finally {
      setCreating(false);
    }
  }

  async function revoke(tok: McpTokenSummary, cb?: { onDone?: () => void; onError?: (msg: string) => void }) {
    if (demoOn) {
      setTokens((list) => list.map((x) => (x.id === tok.id ? { ...x, revoked_at: new Date().toISOString() } : x)));
      setRevokeConfirmId(null);
      cb?.onDone?.();
      return;
    }
    setRevokingId(tok.id);
    captureEvent("ui.mcp_token_revoke", { token_id: tok.id });
    try {
      await revokeMcpToken(tok.id);
      setTokens((list) => list.map((x) => (x.id === tok.id ? { ...x, revoked_at: new Date().toISOString() } : x)));
      setRevokeConfirmId(null);
      cb?.onDone?.();
    } catch (err) {
      cb?.onError?.(friendlyErrorText(err));
    } finally {
      setRevokingId(null);
    }
  }

  function dismissReveal() {
    setReveal(null);
  }

  return {
    tokens,
    loaded,
    name,
    setName,
    scope,
    setScope,
    creating,
    createError,
    reveal,
    revokeConfirmId,
    setRevokeConfirmId,
    revokingId,
    copied,
    copy,
    create,
    revoke,
    dismissReveal,
    resetForm,
  };
}
