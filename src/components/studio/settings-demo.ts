// Settings + account-control demo dataset — powers the tester ?demo=1 review
// (Settings screen + the sidebar account switcher) with no auth or backend.
// Shaped like the real Me / ConnectedAccount types. Mara Lin identity, the same
// three connected accounts the switcher and Settings both show.

import type { ConnectedAccount, Me } from "@/lib/types";

// NOT `as const` — tweak values must widen to {boolean, string}.
export const SET_TWEAK_DEFAULTS = { dark: false, state: "Default" };

export const DEMO_ME: Me = {
  user_id: 1,
  email: "mara@pennedly.com",
  display_name: "Mara Lin",
  tenant: { id: 1, name: "Mara Lin", slug: "mara", plan_tier: "creator", accounts_limit: 5 },
  is_tester: true,
  locale: "en",
  avatar_url: null,
};

export const DEMO_ACCOUNTS: ConnectedAccount[] = [
  { id: 1, tenant_id: 1, threads_user_id: "t1", username: "mara.lin", display_name: "Mara Lin", profile_picture_url: null, connected_at: "2026-01-04T00:00:00Z", disconnected_at: null },
  { id: 2, tenant_id: 1, threads_user_id: "t2", username: "field.notes", display_name: "Field Notes", profile_picture_url: null, connected_at: "2026-02-10T00:00:00Z", disconnected_at: null },
  { id: 3, tenant_id: 1, threads_user_id: "t3", username: "studio.mara", display_name: "Studio Mara", profile_picture_url: null, connected_at: "2026-03-12T00:00:00Z", disconnected_at: null },
];
