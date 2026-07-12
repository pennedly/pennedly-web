"use client";

// Shared, cached loaders for the account-area screens (dashboard / advisor /
// settings). All three block on the SAME two fetches — the light `/me` (tester
// gate) and the HEAVY `/me/account` (portfolio aggregation) — and used to redo
// both, behind a skeleton, on every navigation. Since the account nav is
// client-side (`router.push`), module state survives, so we cache at module
// scope: a re-visit renders INSTANTLY from cache and refreshes only when stale.
// Only the first visit of a session shows a skeleton.
//
// Isolation: the caches hold ONE user's data + PII, so they are wiped whenever
// identity changes — on logout/401 (via `onTokensCleared`), on a fresh login
// (`invalidateAccountData` from the login page), on a portfolio mutation
// elsewhere (disconnect), and cross-tab via a `storage` listener. A `generation`
// counter makes the wipe race-proof: an in-flight fetch started before a wipe
// can never write the OLD user's data back into the cache.

import {
  TOKEN_KEY,
  fetchMe,
  fetchMeAccount,
  fetchMeAccountAdvisor,
  onTokensCleared,
} from "@/lib/api";
import type { AdvisorData, Me, MeAccountResponse } from "@/lib/types";

// `/me` barely changes within a session (tester flag + name/locale); cache once,
// patched in place by Settings edits. `/me/account` is refetched when older than
// the TTL, so rapid back-and-forth is instant while a lingering tab stays fresh.
const ACCOUNT_TTL_MS = 30_000;
// The pinned advisor verdict (dashboard hero + advisor page). The backend caches
// it ~12h, so a generous client TTL keeps switching to the advisor instant. `204`
// (thin data) resolves to null — cached too, so the honest invite renders
// immediately on a re-visit instead of flashing empty.
const ADVISOR_TTL_MS = 5 * 60_000;

// Bumped by every wipe. A loader captures it before its fetch and only writes
// the result if it hasn't changed since — so a fetch in flight across a
// logout/login can't repopulate the cache with the previous user's data.
let generation = 0;

let meCache: Me | null = null;
let mePromise: Promise<Me> | null = null;

let accountCache: MeAccountResponse | null = null;
let accountAt = 0;
let accountPromise: Promise<MeAccountResponse> | null = null;

let advisorCache: AdvisorData | null = null;
let advisorAt = 0;
let advisorLoaded = false;
let advisorPromise: Promise<AdvisorData | null> | null = null;

// Synchronous cache reads — a page seeds its initial state from these so it can
// render on the first paint (no skeleton) when the data is already in memory.
export const peekMe = (): Me | null => meCache;
export const peekMeAccount = (): MeAccountResponse | null => accountCache;
export const peekAdvisor = (): AdvisorData | null => advisorCache;

// `/me`, fetched at most once per session (dedup'd in-flight). Resolves
// instantly from cache on every call after the first.
export function loadMe(): Promise<Me> {
  if (meCache) return Promise.resolve(meCache);
  if (!mePromise) {
    const gen = generation;
    mePromise = fetchMe()
      .then((m) => {
        if (gen === generation) {
          meCache = m; // dropped if wiped mid-flight
          notifyMe(); // chrome mounted before this resolve picks it up
        }
        return m;
      })
      .finally(() => {
        if (gen === generation) mePromise = null;
      });
  }
  return mePromise;
}

// `/me/account` with a TTL: returns the cache untouched while fresh, otherwise
// (re)fetches — dedup'd so concurrent callers share one request. The caller
// still renders the stale cache immediately (via `peekMeAccount`) and swaps in
// this promise's result when it lands.
export function loadMeAccount(force = false): Promise<MeAccountResponse> {
  const fresh = accountCache !== null && Date.now() - accountAt < ACCOUNT_TTL_MS;
  if (fresh && !force) return Promise.resolve(accountCache!);
  if (!accountPromise) {
    const gen = generation;
    accountPromise = fetchMeAccount()
      .then((a) => {
        if (gen === generation) {
          accountCache = a;
          accountAt = Date.now();
        }
        return a;
      })
      .finally(() => {
        if (gen === generation) accountPromise = null;
      });
  }
  return accountPromise;
}

// The advisor verdict, TTL-cached. `advisorLoaded` lets a caller tell "not
// fetched yet" (show the loading hero) from "fetched, thin data → null" (show
// the honest invite) after the first resolve.
export function loadAdvisor(): Promise<AdvisorData | null> {
  const fresh = advisorLoaded && Date.now() - advisorAt < ADVISOR_TTL_MS;
  if (fresh) return Promise.resolve(advisorCache);
  if (!advisorPromise) {
    const gen = generation;
    advisorPromise = fetchMeAccountAdvisor()
      .then((a) => {
        if (gen === generation) {
          advisorCache = a;
          advisorAt = Date.now();
          advisorLoaded = true;
        }
        return a;
      })
      .finally(() => {
        if (gen === generation) advisorPromise = null;
      });
  }
  return advisorPromise;
}

// Subscribers notified whenever the cached `/me` identity changes (loaded,
// patched by a Settings edit, or wiped). Lets mounted chrome (sidebar login
// menu, monogram, settings identity row) re-render LIVE after a rename instead
// of showing the stale copy until the next navigation (audit B8).
type MeListener = () => void;
const meListeners = new Set<MeListener>();

export function subscribeMe(fn: MeListener): () => void {
  meListeners.add(fn);
  return () => meListeners.delete(fn);
}

function notifyMe(): void {
  for (const fn of meListeners) fn();
}

// Optimistic patch after a Settings edit (name / locale) so the cached copy the
// other screens read stays current without a refetch.
export function patchMeCache(fn: (m: Me) => Me): void {
  if (meCache) {
    meCache = fn(meCache);
    notifyMe();
  }
}

// Drop everything and bump the generation so any in-flight fetch is disowned.
// Called on every identity change or portfolio mutation (see the header note).
export function invalidateAccountData(): void {
  generation++;
  meCache = null;
  mePromise = null;
  accountCache = null;
  accountAt = 0;
  accountPromise = null;
  advisorCache = null;
  advisorAt = 0;
  advisorLoaded = false;
  advisorPromise = null;
  notifyMe(); // identity changed → live chrome must drop the old user's name
}

// Wipe on logout/401 (this tab) so the next user in the same tab never sees
// stale data.
onTokensCleared(invalidateAccountData);

// Wipe cross-tab: when another tab clears the auth token (logout there), our
// module cache would otherwise keep serving the signed-out user's data.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    // A removal/change of the auth token in another tab is a logout or an
    // identity switch — drop our per-user caches.
    if (e.key === TOKEN_KEY) invalidateAccountData();
  });
}
