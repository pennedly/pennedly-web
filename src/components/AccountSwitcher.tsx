"use client";

// Bottom-of-sidebar account + profile control: ONE tidy button showing the
// active Threads account (real avatar + display name + @handle) that opens an
// upward menu — switch between connected accounts, connect another, jump to
// Settings, and log out, with the signed-in user (email + plan) as a quiet
// header. Replaces the old two-stacked-buttons (separate switcher + profile
// menu), matching the design's single sidebar-foot account control.
//
// Bootstraps from /api/me/accounts; if the persisted selection isn't in the
// response (disconnected / switched user) it auto-selects the first active one.

import Link from "next/link";
import { useEffect, useState } from "react";

import { fetchMyAccounts } from "@/lib/api";
import { setSelectedAccountId, useSelectedAccountId } from "@/lib/account";
import { captureEvent } from "@/lib/analytics";
import { useTranslation } from "@/lib/i18n";
import { ConnectThreadsButton } from "@/components/ConnectThreadsButton";
import { Mono } from "@/components/ui/mono";
import { IcCheck, IcChevDown, IcSettings } from "@/components/icons";
import type { ConnectedAccount, Me } from "@/lib/types";

function nameOf(a: ConnectedAccount): string {
  return a.display_name ?? a.username ?? `acct ${a.id}`;
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.trim().slice(0, 2).toUpperCase() || "?";
}

// Real Threads profile picture when we have one; initials monogram otherwise.
function Avatar({ account, size }: { account: ConnectedAccount; size: number }) {
  if (account.profile_picture_url) {
    return (
      // Threads CDN host varies — a plain <img> avoids next/image remote config.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={account.profile_picture_url}
        alt=""
        width={size}
        height={size}
        className="shrink-0 rounded-full bg-surface-2 object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return <Mono text={initialsOf(nameOf(account))} size={size} />;
}

export function AccountSwitcher({ me, onLogout }: { me?: Me | null; onLogout?: () => void }) {
  const selected = useSelectedAccountId();
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    (async () => {
      try {
        const list = await fetchMyAccounts();
        const active = list.accounts.filter((a) => a.disconnected_at === null);
        setAccounts(active);
        if (active.length > 0 && (selected === null || !active.some((a) => a.id === selected))) {
          setSelectedAccountId(active[0].id);
        }
      } catch {
        /* silent — the switcher is a nice-to-have; pages handle their own auth */
      } finally {
        setLoaded(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!loaded) return null;
  // Brand-new user / fresh Meta reviewer with nothing connected yet.
  if (accounts.length === 0) return <ConnectThreadsButton variant="primary" />;

  const selectedAccount = accounts.find((a) => a.id === selected) ?? accounts[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-2.5 rounded-md p-2 text-left transition-colors hover:bg-surface-2"
      >
        <Avatar account={selectedAccount} size={32} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-small font-semibold leading-tight">{nameOf(selectedAccount)}</span>
          {selectedAccount.username && (
            <span className="block truncate text-caption text-text-subtle">@{selectedAccount.username}</span>
          )}
        </span>
        <IcChevDown size={15} className="shrink-0 text-text-subtle" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute bottom-full left-0 right-0 z-40 mb-1.5 overflow-hidden rounded-lg border border-border bg-surface shadow-lg">
            {/* Signed-in user */}
            {me && (
              <div className="border-b border-border px-3 py-2.5">
                <div className="truncate text-small font-medium leading-tight text-text">{me.email}</div>
                <div className="mt-0.5 text-caption capitalize text-text-subtle">{me.tenant.plan_tier} plan</div>
              </div>
            )}

            {/* Connected accounts (switch) + connect another */}
            <div className="py-1">
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
                    className={`flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                      isSel ? "bg-surface-2" : "hover:bg-surface-2"
                    }`}
                  >
                    <Avatar account={a} size={26} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-small font-medium leading-tight">{nameOf(a)}</span>
                      {a.username && <span className="block truncate text-caption text-text-subtle">@{a.username}</span>}
                    </span>
                    {isSel && <IcCheck size={15} className="shrink-0 text-text-subtle" />}
                  </button>
                );
              })}
              <ConnectThreadsButton variant="menu" />
            </div>

            {/* Settings + log out */}
            <div className="border-t border-border py-1">
              <Link
                href="/app/settings"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-small text-text transition-colors hover:bg-surface-2"
              >
                <IcSettings size={16} className="text-text-subtle" /> {t("nav.settings")}
              </Link>
              {onLogout && (
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onLogout();
                  }}
                  className="w-full px-3 py-2 text-left text-small text-danger transition-colors hover:bg-surface-2"
                >
                  {t("dashboard.nav.logout")}
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
