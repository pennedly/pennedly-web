"use client";

// Reactive "does the user have any connected Threads account?" presence,
// shared across the app shell. The shell uses it to gate the whole /app
// area: with zero connected accounts there is nothing to do but connect,
// so we show the dedicated full-screen connect flow (no sidebar) instead
// of the normal shell.
//
// Kept separate from `account.ts` (which tracks the *selected* account id):
// this is an async, fetch-backed boolean, not a localStorage scalar.
// `refreshAccountsPresence()` is called after connect/disconnect so the
// shell flips immediately (e.g. the sidebar vanishes the moment the last
// account is disconnected).

import { useSyncExternalStore } from "react";

import { fetchMyAccounts } from "./api";

// null = not yet known (still loading the first check).
let hasConnected: boolean | null = null;
let inFlight: Promise<void> | null = null;

const listeners = new Set<() => void>();

function emit() {
  for (const fn of listeners) fn();
}

/** Re-check the connected-account presence and notify subscribers. Coalesces
 *  concurrent callers onto a single in-flight request. Fails OPEN (assumes an
 *  account exists) so a transient API error never traps the user on the
 *  connect screen. */
export function refreshAccountsPresence(): Promise<void> {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    try {
      const list = await fetchMyAccounts();
      hasConnected = list.accounts.some((a) => a.disconnected_at === null);
    } catch {
      hasConnected = true; // fail-open
    } finally {
      inFlight = null;
      emit();
    }
  })();
  return inFlight;
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Reactively read whether the user has ≥1 connected account.
 *  Returns null until the first check resolves. SSR returns null. */
export function useHasConnectedAccounts(): boolean | null {
  return useSyncExternalStore(
    subscribe,
    () => hasConnected,
    () => null,
  );
}
