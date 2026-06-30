// Demo fixtures for the Overview (/app/overview?demo=1) tester review + the
// /gallery/overview state page — the same numbers as Overview-SPEC.html so the
// live screen can be diffed against the mockup with no auth/backend. The "many"
// state is 4 accounts (one still importing); "single" degrades to one card +
// the connect nudge. Numbers are raw (the components format per-locale), so the
// compact tiles render "18.5K" etc. exactly like the spec.

import type { OverviewAccount, OverviewResponse } from "@/lib/types";

export type OverviewDemoState = "many" | "single" | "importing" | "loading" | "empty" | "error";

// Plain literal (no `as const`) so the tweak values widen to { dark: boolean;
// state: string } — matching every other screen's *_TWEAK_DEFAULTS. With
// `as const` the setters would only accept `false` / "many" and reject any
// real toggle/state change. The page re-narrows tw.state via OverviewDemoState.
export const OVERVIEW_TWEAK_DEFAULTS = { dark: false, state: "many" };

// Helper for a settled (synced) demo account row.
function acc(
  id: number,
  name: string,
  handle: string,
  followers: number,
  delta: number,
  views7d: number,
  postsWeek: number,
  replies: number,
  syncedAtHoursAgo: number,
): OverviewAccount {
  return {
    id,
    tenant_id: 1,
    network: "threads",
    name,
    handle,
    avatar: null, // monogram fallback (no demo photo URLs)
    followers,
    followers_delta: delta,
    views_7d: views7d,
    posts_week: postsWeek,
    replies_to_answer: replies,
    sync_status: "synced",
    synced_at: new Date(Date.now() - syncedAtHoursAgo * 3600_000).toISOString(),
    sync_summary: null,
    sync_started_at: null,
  };
}

const MARA = acc(1, "Mara Lin", "mara.lin", 12438, 312, 98_000, 5, 3, 2);
const FIELD = acc(2, "Field Notes", "field.notes", 4210, 86, 41_000, 3, 7, 1);
const STUDIO = acc(3, "Studio Mara", "studio.mara", 1890, -12, 12_000, 2, 0, 3);
const LATE: OverviewAccount = {
  id: 4,
  tenant_id: 1,
  network: "threads",
  name: "Late Drafts",
  handle: "late.drafts",
  avatar: null,
  followers: null,
  followers_delta: null,
  views_7d: 0,
  posts_week: 0,
  replies_to_answer: 0,
  sync_status: "importing",
  synced_at: null,
  sync_summary: { posts: 42, new_comments: 310, history_posts: 96 },
  sync_started_at: new Date(Date.now() - 60_000).toISOString(),
};

const MANY: OverviewResponse = {
  totals: {
    // Totals sum only the synced accounts (Mara + Field + Studio), per the spec.
    followers: 12438 + 4210 + 1890,
    followers_delta: 312 + 86 - 12,
    views_7d: 98_000 + 41_000 + 12_000,
    posts_week: 5 + 3 + 2,
    replies_to_answer: 3 + 7 + 0,
    accounts_count: 4,
    importing_count: 1,
  },
  accounts: [MARA, FIELD, STUDIO, LATE],
};

const SINGLE: OverviewResponse = {
  totals: {
    followers: 12438,
    followers_delta: 312,
    views_7d: 98_000,
    posts_week: 5,
    replies_to_answer: 3,
    accounts_count: 1,
    importing_count: 0,
  },
  accounts: [MARA],
};

// "importing" demo state = the many view (it already carries an importing card);
// the standalone importing card is shown in the gallery via LATE directly.
export const OVERVIEW_DEMO: Record<"many" | "single" | "importing", OverviewResponse> = {
  many: MANY,
  single: SINGLE,
  importing: MANY,
};

// Individual rows exported for the /gallery/overview per-card sections.
export const OVERVIEW_DEMO_ACCOUNTS = { MARA, FIELD, STUDIO, LATE };

// A synced account whose sync then failed — the card-local error state.
export const OVERVIEW_DEMO_ERROR_ACCOUNT: OverviewAccount = {
  ...FIELD,
  sync_status: "error",
  synced_at: null,
};
