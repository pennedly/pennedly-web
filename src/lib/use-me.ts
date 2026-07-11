"use client";

// Shared, fetch-once `me` for chrome that renders on every /app screen (the
// AppTopbar profile breadcrumb). Delegates to the single guarded module cache
// in account-data.ts — so there is ONE `me` cache with ONE invalidation path
// (logout/401/login/cross-tab), not two that could drift. Best-effort (auth is
// handled by the pages); returns null until it resolves or when logged out.

import { useEffect, useState } from "react";

import { getTokens } from "@/lib/api";
import { loadMe, peekMe } from "@/lib/account-data";
import type { Me } from "@/lib/types";

export function useMe(): Me | null {
  const [me, setMe] = useState<Me | null>(peekMe());
  useEffect(() => {
    const cached = peekMe();
    if (cached) {
      setMe(cached);
      return;
    }
    if (!getTokens()) return;
    let alive = true;
    loadMe()
      .then((m) => {
        if (alive) setMe(m);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  return me;
}
