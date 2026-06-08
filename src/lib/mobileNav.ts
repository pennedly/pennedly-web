"use client";

// Shared open-state for the mobile nav drawer. The hamburger trigger lives in
// the per-screen AppTopbar (the single mobile top bar), while the drawer itself
// is rendered by the shell Sidebar — they coordinate through this tiny store
// (same useSyncExternalStore pattern as account.ts) instead of prop-drilling
// across the app layout. SSR reads closed.

import { useSyncExternalStore } from "react";

let open = false;
const listeners = new Set<() => void>();

function emit(): void {
  for (const fn of listeners) fn();
}

export function setMobileNavOpen(value: boolean): void {
  if (open === value) return;
  open = value;
  emit();
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function useMobileNavOpen(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => open,
    () => false,
  );
}
