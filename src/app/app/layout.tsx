import type { Metadata } from "next";

import AppShell from "./AppShell";

// Server wrapper so the whole /app tree can carry `metadata` — a Server
// Component-only export, which AppShell (its client-side sidebar/gating
// logic) can't provide itself. The auth-gated app has nothing for a crawler:
// every route here sits behind login, so it opts out of indexing entirely
// rather than emitting a pennedly.com canonical it has no page to back up.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
