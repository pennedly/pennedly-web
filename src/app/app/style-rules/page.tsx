"use client";

// The standalone «Style» screen was merged into «Voice» as its second
// «Anti-robot» tab (see src/components/studio/AntiRobotPanel.tsx). This route is
// kept only so old links/bookmarks still resolve — it redirects to the Voice
// screen with the Anti-robot tab pre-selected. The ?demo=1 flag is preserved so
// the tester preview link keeps working.

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function StyleRulesRedirect() {
  const router = useRouter();
  useEffect(() => {
    const demo =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("demo") === "1";
    router.replace(`/app/role-book?tab=anti${demo ? "&demo=1" : ""}`);
  }, [router]);
  return null;
}
