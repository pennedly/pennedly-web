"use client";

// Shared view-SCOPE state — the multi-network portfolio IA spine.
//
// The scope is one of three levels: Portfolio (the whole Pennedly account) →
// Brand → Profile, with an orthogonal optional `network` filter ("all my
// LinkedIn"). Persisted in localStorage so flipping between screens / reloads
// stays sticky. React's useSyncExternalStore shares it reactively without a
// context.
//
// BACK-COMPAT: today every screen is implicitly a single Profile. The ~15
// existing readers keep calling `useSelectedAccountId()` / `setSelectedAccountId`
// unchanged — they read/write the PROFILE scope, returning the profile id at
// profile scope and null at portfolio/brand scope (the same "no single account"
// state those screens already handle). Scope-aware screens (home, advisor, stats)
// use `useScope` / `setScope`.

import { useSyncExternalStore } from "react";

export type ScopeLevel = "portfolio" | "brand" | "profile";

export type Scope = {
  level: ScopeLevel;
  // The brand/profile id; null at portfolio scope.
  id: number | null;
  // Orthogonal network filter (NOT a scope level): null = all networks.
  network?: string | null;
};

const SCOPE_KEY = "pennedly.scope";
const LEGACY_KEY = "pennedly.selectedAccountId"; // pre-scope single account id

// Stable references for useSyncExternalStore — returning a fresh object each
// call would loop. The server snapshot is the default profile scope.
const SERVER_SCOPE: Scope = { level: "profile", id: null, network: null };

const listeners = new Set<() => void>();

function readScope(): Scope {
  if (typeof window === "undefined") return SERVER_SCOPE;
  const raw = window.localStorage.getItem(SCOPE_KEY);
  if (raw) {
    try {
      const p = JSON.parse(raw) as Partial<Scope>;
      const level: ScopeLevel =
        p.level === "portfolio" || p.level === "brand" ? p.level : "profile";
      const id = typeof p.id === "number" && p.id > 0 ? p.id : null;
      const network = typeof p.network === "string" ? p.network : null;
      return { level, id, network };
    } catch {
      /* corrupt JSON → fall through to the legacy key */
    }
  }
  // Migrate the pre-scope single-account selection → a profile scope.
  const legacy = window.localStorage.getItem(LEGACY_KEY);
  const n = legacy ? Number(legacy) : NaN;
  return Number.isFinite(n) && n > 0
    ? { level: "profile", id: n, network: null }
    : { level: "profile", id: null, network: null };
}

let current: Scope = readScope();

function emit() {
  for (const fn of listeners) fn();
}

function persist() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SCOPE_KEY, JSON.stringify(current));
  // Keep the legacy key in sync so anything still reading it directly (or an
  // older tab) sees the profile id; cleared at portfolio/brand scope.
  if (current.level === "profile" && current.id !== null) {
    window.localStorage.setItem(LEGACY_KEY, String(current.id));
  } else {
    window.localStorage.removeItem(LEGACY_KEY);
  }
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

// ── Scope (the new IA spine) ─────────────────────────────────────────
export function getScope(): Scope {
  return current;
}

export function setScope(scope: Scope): void {
  current = { network: null, ...scope };
  persist();
  emit();
}

/** Reactively read the global view scope. SSR returns the default profile scope. */
export function useScope(): Scope {
  return useSyncExternalStore(subscribe, () => current, () => SERVER_SCOPE);
}

// ── Back-compat single-account API (the ~15 existing profile-bound readers) ──
// The profile scope's id, or null at portfolio/brand scope.
export function getSelectedAccountId(): number | null {
  return current.level === "profile" ? current.id : null;
}

export function setSelectedAccountId(id: number | null): void {
  setScope(
    id === null
      ? { level: "profile", id: null, network: null }
      : { level: "profile", id, network: null },
  );
}

/** Reactively read the currently-selected account id (profile scope). SSR → null. */
export function useSelectedAccountId(): number | null {
  return useSyncExternalStore(
    subscribe,
    () => (current.level === "profile" ? current.id : null),
    () => null,
  );
}

// ── Onboarding "skip for now" ────────────────────────────────────────
// A per-account flag set when the user skips voice setup in onboarding,
// so the dashboard doesn't bounce them straight back into the wizard.
// Cleared implicitly once the account has a role_book (needs_onboarding
// goes false), so this only matters for the skipped-but-not-yet-set-up gap.

function skipKey(accountId: number): string {
  return `pennedly.onboardingSkipped.${accountId}`;
}

export function isOnboardingSkipped(accountId: number): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(skipKey(accountId)) === "1";
}

export function setOnboardingSkipped(accountId: number): void {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(skipKey(accountId), "1");
  }
}
