"use client";

// Guard for round-2 (tester-only) screens. Fetches /me and redirects
// non-testers to /app, so the round-2 surfaces (replies / mentions /
// posts) are invisible to the public — including the Meta App Review
// reviewer. The dashboard nav also hides their links via me.is_tester;
// this guards direct URL access.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { fetchMe, getTokens } from "@/lib/api";

export function useTesterGuard(): { checking: boolean } {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!getTokens()) {
      router.replace("/app/login");
      return;
    }
    (async () => {
      try {
        const me = await fetchMe();
        if (!me.is_tester) {
          router.replace("/app");
          return;
        }
        setChecking(false);
      } catch {
        router.replace("/app");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { checking };
}
