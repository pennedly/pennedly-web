"use client";

// The shared prelude every account-area screen runs: auth gate → tester gate →
// load `/me/account` → empty-tenant redirect. Backed by the module cache
// (account-data.ts) so a re-visit renders from cache on the FIRST paint (no
// skeleton) and revalidates silently in the background. Each page keeps its own
// screen-specific work (advisor, polling, mutations) around this.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ApiError, clearTokens, getTokens } from "@/lib/api";
import { loadMe, loadMeAccount, peekMe, peekMeAccount, subscribeMe } from "@/lib/account-data";
import type { Me, MeAccountResponse } from "@/lib/types";

export type AccountPhase = "loading" | "ready" | "error";

// Live view of the cached `/me` identity. Re-renders when the cache is loaded,
// patched (Settings rename) or wiped — so chrome that shows the user's
// name/email (sidebar login menu, monogram, breadcrumb) stays current without
// prop-drilling a callback through every screen (audit B8).
export function useMe(): Me | null {
  const [me, setMe] = useState<Me | null>(peekMe());
  useEffect(() => subscribeMe(() => setMe(peekMe())), []);
  // /gallery renders the real components with DEMO data, hermetically (no
  // auth) — never inject the signed-in dev's real identity into a gallery
  // state when the module cache happens to be warm in the same tab.
  if (typeof window !== "undefined" && window.location.pathname.startsWith("/gallery")) return null;
  return me;
}

export function useAccountData(): {
  me: Me | null;
  data: MeAccountResponse | null;
  phase: AccountPhase;
  // Lets a page push fresher data into the shared state (e.g. the dashboard's
  // import poll, or a Settings edit) without a remount.
  setData: (d: MeAccountResponse) => void;
} {
  const router = useRouter();
  const cachedAccount = peekMeAccount();
  const [me, setMe] = useState<Me | null>(peekMe());
  // Track later cache changes (a Settings rename patches the cache) so the
  // already-mounted screen re-renders with the new identity.
  useEffect(() => subscribeMe(() => setMe(peekMe())), []);
  const [data, setData] = useState<MeAccountResponse | null>(cachedAccount);
  // Cache present → render immediately; else the usual first-load skeleton.
  const [phase, setPhase] = useState<AccountPhase>(cachedAccount ? "ready" : "loading");

  useEffect(() => {
    if (!getTokens()) {
      router.push("/app/login");
      return;
    }
    let alive = true;
    (async () => {
      try {
        const m = await loadMe();
        if (!alive) return;
        if (m.is_tester !== true) {
          router.replace("/app/overview");
          return;
        }
        setMe(m);
        const acc = await loadMeAccount();
        if (!alive) return;
        // Durable dashboard: only a truly-empty tenant (never connected) goes to
        // the wizard; an all-disconnected tenant stays in the account chrome.
        if (acc.scope.profiles_count === 0 && acc.scope.disconnected_count === 0) {
          router.replace("/app/onboarding");
          return;
        }
        setData(acc);
        setPhase("ready");
      } catch (e) {
        if (!alive) return;
        if (e instanceof ApiError && e.status === 401) {
          clearTokens();
          router.push("/app/login");
          return;
        }
        // A background-revalidate failure must NOT blank a screen that already
        // has cached data — only surface an error when we have nothing to show.
        if (!peekMeAccount()) setPhase("error");
      }
    })();
    return () => {
      alive = false;
    };
  }, [router]);

  return { me, data, phase, setData };
}
