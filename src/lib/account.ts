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
