"use client";

// Shared, fetch-once `me` for chrome that renders on every /app screen (the
// AppTopbar profile breadcrumb). Caches at module scope so navigating between
// profile screens doesn't re-hit /api/me each time — the first caller fetches,
// everyone else reuses the resolved value. Best-effort (auth is handled by the
// pages); returns null until it resolves or when logged out.

import { useEffect, useState } from "react";

import { fetchMe, getTokens } from "@/lib/api";
import type { Me } from "@/lib/types";

let cachedMe: Me | null = null;
let inFlight: Promise<Me> | null = null;

export function useMe(): Me | null {
  const [me, setMe] = useState<Me | null>(cachedMe);
  useEffect(() => {
    if (cachedMe) {
      setMe(cachedMe);
      return;
    }
    if (!getTokens()) return;
    let alive = true;
    if (!inFlight) inFlight = fetchMe();
    inFlight
      .then((m) => {
        cachedMe = m;
        if (alive) setMe(m);
      })
      .catch(() => {
        inFlight = null; // allow a later retry
      });
    return () => {
      alive = false;
    };
  }, []);
  return me;
}
