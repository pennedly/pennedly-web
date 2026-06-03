import { useEffect, useRef } from "react";

// Q24 — "optimistic + Undo" without a backend restore endpoint.
//
// The Gmail "Undo Send" pattern: a destructive action (reject / delete /
// skip) is applied to the UI immediately, but the real API call is DEFERRED
// for a short window. While it's pending, an Undo toast can `cancel()` it —
// so nothing ever reaches the server. If the window elapses, the commit
// fires for real. This makes every removal undoable with zero backend
// changes (matches decision Q24=A: optimistic + undo toast, no new endpoint).
//
// Each pending commit is keyed (e.g. `reject-42`); scheduling the same key
// again replaces the prior pending commit. Still-pending commits are flushed
// when the component unmounts, so a deferred reject/delete is never silently
// dropped on client-side navigation.

const DEFAULT_WINDOW_MS = 5000;

type Pending = {
  timer: ReturnType<typeof setTimeout>;
  commit: () => void | Promise<void>;
};

export type DeferredCommit = {
  // Schedule `commit` to run after `ms` (default 5s) unless cancelled first.
  // Re-scheduling an existing key cancels and replaces the prior one.
  schedule: (key: string, commit: () => void | Promise<void>, ms?: number) => void;
  // Cancel a pending commit. Returns true if one was actually pending.
  cancel: (key: string) => boolean;
  // True if a commit is currently pending for this key.
  isPending: (key: string) => boolean;
};

export function useDeferredCommit(): DeferredCommit {
  const pending = useRef<Map<string, Pending>>(new Map());

  function clearKey(key: string): void {
    const p = pending.current.get(key);
    if (p) {
      clearTimeout(p.timer);
      pending.current.delete(key);
    }
  }

  function schedule(
    key: string,
    commit: () => void | Promise<void>,
    ms: number = DEFAULT_WINDOW_MS,
  ): void {
    clearKey(key);
    const timer = setTimeout(() => {
      // Drop from the map before awaiting so an unmount-flush mid-commit
      // can't fire the same commit twice.
      pending.current.delete(key);
      void commit();
    }, ms);
    pending.current.set(key, { timer, commit });
  }

  function cancel(key: string): boolean {
    const had = pending.current.has(key);
    clearKey(key);
    return had;
  }

  function isPending(key: string): boolean {
    return pending.current.has(key);
  }

  // Flush any still-pending commits on unmount (client-side nav keeps the JS
  // runtime alive, so the fetch completes). A genuinely lost commit on a hard
  // tab close just leaves the item un-removed — safe, never destructive.
  useEffect(() => {
    const map = pending.current;
    return () => {
      map.forEach(({ timer, commit }) => {
        clearTimeout(timer);
        void commit();
      });
      map.clear();
    };
  }, []);

  return { schedule, cancel, isPending };
}
