// Settings + account-control demo dataset — powers the tester ?demo=1 review
// (Settings screen + the sidebar account switcher) with no auth or backend.
// Shaped like the real Me / ConnectedAccount types. Mara Lin identity, the same
// three connected accounts the switcher and Settings both show.

import type { ConnectedAccount, McpTokenSummary, Me } from "@/lib/types";

// NOT `as const` — tweak values must widen to {boolean, string}.
export const SET_TWEAK_DEFAULTS = { dark: false, state: "Default", mcp: "Tokens" };

export const DEMO_ME: Me = {
  user_id: 1,
  email: "mara@pennedly.com",
  display_name: "Mara Lin",
  tenant: { id: 1, name: "Mara Lin", slug: "mara", plan_tier: "creator", accounts_limit: 5 },
  is_tester: true,
  locale: "en",
  avatar_url: null,
};

// All three are settled, fully-imported accounts (sync_status 'complete') — the
// import banner never shows for them in the Settings/switcher review.
const SYNCED = { sync_status: "complete" as const, sync_summary: null, sync_started_at: null, sync_completed_at: null };
export const DEMO_ACCOUNTS: ConnectedAccount[] = [
  { id: 1, tenant_id: 1, network: "threads", threads_user_id: "t1", username: "mara.lin", display_name: "Mara Lin", profile_picture_url: null, followers_count: 12480, connected_at: "2026-01-04T00:00:00Z", disconnected_at: null, ...SYNCED },
  { id: 2, tenant_id: 1, network: "threads", threads_user_id: "t2", username: "field.notes", display_name: "Field Notes", profile_picture_url: null, followers_count: 3204, connected_at: "2026-02-10T00:00:00Z", disconnected_at: null, ...SYNCED },
  { id: 3, tenant_id: 1, network: "threads", threads_user_id: "t3", username: "studio.mara", display_name: "Studio Mara", profile_picture_url: null, followers_count: 890, connected_at: "2026-03-12T00:00:00Z", disconnected_at: null, ...SYNCED },
];

// MCP personal tokens (§7.17) — one active read-write, one active read-only
// never used, one revoked (so the revoked visual state is always in view
// without a dedicated tweak). Timestamps relative to "now" at import time.
function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86_400_000).toISOString();
}
export const DEMO_MCP_TOKENS: McpTokenSummary[] = [
  { id: 1, name: "Claude Desktop", scope: "read_write", created_at: daysAgo(30), last_used_at: daysAgo(0.1), revoked_at: null },
  { id: 2, name: "Cursor", scope: "read", created_at: daysAgo(10), last_used_at: null, revoked_at: null },
  { id: 3, name: "Old test token", scope: "read", created_at: daysAgo(60), last_used_at: daysAgo(40), revoked_at: daysAgo(5) },
];
