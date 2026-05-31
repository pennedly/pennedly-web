"use client";

// Shared selected-account state. Persisted in localStorage under
// `pennedly.selectedAccountId` so flipping between dashboard /
// role-book / audits doesn't reset, and reloads stay sticky.
//
// React 19's useSyncExternalStore lets multiple components on the
// same page reactively share the value without a context.

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "pennedly.selectedAccountId";

const listeners = new Set<() => void>();

function readFromStorage(): number | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

let current: number | null = readFromStorage();

function emit() {
  for (const fn of listeners) fn();
}

export function getSelectedAccountId(): number | null {
  return current;
}

export function setSelectedAccountId(id: number | null): void {
  current = id;
  if (typeof window !== "undefined") {
    if (id === null) {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(STORAGE_KEY, String(id));
    }
  }
  emit();
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Reactively read the currently-selected account id. SSR returns null. */
export function useSelectedAccountId(): number | null {
  return useSyncExternalStore(
    subscribe,
    () => current,
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
