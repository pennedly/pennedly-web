"use client";

// Header-level picker for which connected Threads account the user
// is operating on. Shown across dashboard / role-book / audits.
//
// When the user has only one connected account, renders as a static
// pill (no dropdown needed). When 2+, becomes a dropdown of
// @username choices.
//
// Bootstraps from /api/me/accounts. If the persisted selection isn't
// in the response (account disconnected, switched user, etc.) we
// auto-select the first active one and persist that.

import { useEffect, useState } from "react";

import { fetchMyAccounts } from "@/lib/api";
import {
  setSelectedAccountId,
  useSelectedAccountId,
} from "@/lib/account";
import { captureEvent } from "@/lib/analytics";
import { ConnectThreadsButton } from "@/components/ConnectThreadsButton";
import type { ConnectedAccount } from "@/lib/types";

export function AccountSwitcher() {
  const selected = useSelectedAccountId();
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const list = await fetchMyAccounts();
        const active = list.accounts.filter((a) => a.disconnected_at === null);
        setAccounts(active);
        // If the persisted id isn't in the active set, default to the
        // first one. This handles fresh users, disconnected accounts,
        // and switched logins gracefully.
        if (
          active.length > 0 &&
          (selected === null || !active.some((a) => a.id === selected))
        ) {
          setSelectedAccountId(active[0].id);
        }
      } catch {
        // Silent — switcher is a nice-to-have, dashboard handles its
        // own auth errors.
      } finally {
        setLoaded(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!loaded) {
    return null;
  }

  // No connected account yet (brand-new user, or a fresh Meta reviewer).
  // This is the entry point to the whole product — surface the connect
  // button right in the header so there's always a way in.
  if (accounts.length === 0) {
    return <ConnectThreadsButton variant="primary" />;
  }

  const selectedAccount =
    accounts.find((a) => a.id === selected) ?? accounts[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full inline-flex items-center gap-1.5 text-xs text-text px-2 py-1.5 rounded-md hover:bg-surface-2 transition-colors"
      >
        <span aria-hidden>@</span>
        <span className="font-medium truncate flex-1 text-left">
          {selectedAccount.username ?? `acct ${selectedAccount.id}`}
        </span>
        <span aria-hidden className="text-zinc-400 shrink-0">
          ▾
        </span>
      </button>
      {open && (
        <div className="absolute bottom-full mb-1 left-0 right-0 z-40 rounded-lg border border-border bg-surface shadow-lg py-1">
          {accounts.map((a) => {
            const isSel = a.id === selectedAccount.id;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => {
                  setSelectedAccountId(a.id);
                  setOpen(false);
                  captureEvent("ui.account_switched", { account_id: a.id });
                }}
                className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${
                  isSel
                    ? "bg-surface-2 text-text"
                    : "text-text hover:bg-surface-2/60"
                }`}
              >
                <span aria-hidden>@</span>
                <span className="font-medium">
                  {a.username ?? `acct ${a.id}`}
                </span>
                {a.display_name && (
                  <span className="text-xs text-zinc-500 truncate">
                    · {a.display_name}
                  </span>
                )}
                {isSel && (
                  <span className="ml-auto text-xs text-zinc-500">✓</span>
                )}
              </button>
            );
          })}
          <div className="my-1 border-t border-border" />
          <ConnectThreadsButton variant="menu" />
        </div>
      )}
    </div>
  );
}
