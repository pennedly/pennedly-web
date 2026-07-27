"use client";

// Reading the URL's query the hydration-safe way.
//
// The idiom this replaces was `useState(() => typeof window !== "undefined" &&
// new URLSearchParams(window.location.search).get("demo") === "1")`. On the
// server `window` is absent, so the initializer returned false and the markup
// took the "no demo" branch; on the client React re-runs that same initializer
// during hydration, it sees `?demo=1`, and the tree it produces no longer
// matches the server's. React then throws away the server HTML and re-renders —
// the "Hydration failed" error every `?demo=1` page logged.
//
// `useSearchParams` reads the same value on both sides. Every /app route is
// server-rendered on demand, so no Suspense boundary is required (that rule is
// for prerendered routes — see Next's use-search-params docs).

import { useSearchParams } from "next/navigation";

/** One query param as a string, or null. */
export function useQueryParam(name: string): string | null {
  return useSearchParams().get(name);
}

/** `?demo=1` — the tester review mode that drives screens from mock content. */
export function useDemoParam(): boolean {
  return useSearchParams().get("demo") === "1";
}
