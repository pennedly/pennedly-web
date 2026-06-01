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
import { Mono } from "@/components/ui/mono";
import { IcCheck, IcChevDown } from "@/components/icons";
import type { ConnectedAccount } from "@/lib/types";

function nameOf(a: ConnectedAccount): string {
  return a.display_name ?? a.username ?? `acct ${a.id}`;
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.trim().slice(0, 2).toUpperCase() || "?";
}

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
        className="flex w-full items-center gap-2.5 rounded-md border border-transparent p-2 text-left transition-colors hover:bg-surface-2"
      >
        <Mono text={initialsOf(nameOf(selectedAccount))} size={32} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-small font-semibold leading-tight">
            {nameOf(selectedAccount)}
          </span>
          {selectedAccount.username && (
            <span className="block truncate text-caption text-text-subtle">
              @{selectedAccount.username}
            </span>
          )}
        </span>
        <IcChevDown size={15} className="shrink-0 text-text-subtle" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute bottom-full left-0 right-0 z-40 mb-1.5 rounded-lg border border-border bg-surface py-1 shadow-lg">
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
                  className={`flex w-full items-center gap-2.5 px-2.5 py-2 text-left transition-colors ${
                    isSel ? "bg-surface-2" : "hover:bg-surface-2"
                  }`}
                >
                  <Mono text={initialsOf(nameOf(a))} size={28} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-small font-medium leading-tight">
                      {nameOf(a)}
                    </span>
                    {a.username && (
                      <span className="block truncate text-caption text-text-subtle">
                        @{a.username}
                      </span>
                    )}
                  </span>
                  {isSel && <IcCheck size={15} className="shrink-0 text-text-subtle" />}
                </button>
              );
            })}
            <div className="my-1 border-t border-border" />
            <ConnectThreadsButton variant="menu" />
          </div>
        </>
      )}
    </div>
  );
}
