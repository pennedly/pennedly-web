"use client";

// Shared connected-accounts loader for the account controls (desktop sidebar
// foot + mobile top-bar account sheet). Bootstraps from /api/me/accounts;
// honors the `?demo=1[&acct=none|single]` review mode (mock accounts, no
// backend). If the persisted selection isn't in the response it auto-selects
// the first active account. Both controls render from this one source.

import { useEffect, useState } from "react";

import { fetchMyAccounts } from "@/lib/api";
import { setSelectedAccountId, useSelectedAccountId } from "@/lib/account";
import { DEMO_ACCOUNTS, DEMO_ME } from "@/components/studio/settings-demo";
import type { ConnectedAccount, Me } from "@/lib/types";

export type ConnectedAccountsState = {
  accounts: ConnectedAccount[];
  loaded: boolean;
  selectedAccount: ConnectedAccount | null;
  /** The identity to show (email + plan): demo identity under ?demo=1, else `me`. */
  effMe: Me | null | undefined;
};

export function useConnectedAccounts(me?: Me | null): ConnectedAccountsState {
  const selected = useSelectedAccountId();
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [demoParam] = useState(() =>
    typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("demo") === "1" : false,
  );

  useEffect(() => {
    if (demoParam) {
      const acct = new URLSearchParams(window.location.search).get("acct");
      const list = acct === "none" ? [] : acct === "single" ? DEMO_ACCOUNTS.slice(0, 1) : DEMO_ACCOUNTS;
      setAccounts(list);
      if (list.length > 0 && (selected === null || !list.some((a) => a.id === selected))) {
        setSelectedAccountId(list[0].id);
      }
      setLoaded(true);
      return;
    }
    (async () => {
      try {
        const list = await fetchMyAccounts();
        const active = list.accounts.filter((a) => a.disconnected_at === null);
        setAccounts(active);
        if (active.length > 0 && (selected === null || !active.some((a) => a.id === selected))) {
          setSelectedAccountId(active[0].id);
        }
      } catch {
        /* silent — the control is a nice-to-have; pages handle their own auth */
      } finally {
        setLoaded(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedAccount = accounts.find((a) => a.id === selected) ?? accounts[0] ?? null;
  const effMe = demoParam ? DEMO_ME : me;

  return { accounts, loaded, selectedAccount, effMe };
}
