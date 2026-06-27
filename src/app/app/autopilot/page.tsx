"use client";

// The standalone Autopilot screen is retired — its settings now live in
// «Правила дома» on the merged hub at /app/scenarios (the sidebar entry was
// renamed to «Автопилот»). This route stays so old links/bookmarks keep
// working: it client-redirects to the hub on mount. We use useRouter().replace
// (not a server `redirect()`) to match the rest of this app-router shell, whose
// auth/account gates all live client-side — a hard server redirect would race
// them and leave the URL on /app/autopilot.

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AutopilotPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/app/scenarios");
  }, [router]);
  return null;
}
