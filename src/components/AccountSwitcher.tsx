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
import { Avatar, nameOf } from "@/components/ui/avatar";
import { IcCheck, IcChevDown, IcLogout, IcSettings } from "@/components/icons";
import { DEMO_ACCOUNTS, DEMO_ME } from "@/components/studio/settings-demo";
import type { ConnectedAccount, Me } from "@/lib/types";

export function AccountSwitcher({ me, onLogout }: { me?: Me | null; onLogout?: () => void }) {
  const selected = useSelectedAccountId();
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
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
  const effMe = demoParam ? DEMO_ME : me;

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
        <IcChevDown size={15} className={`shrink-0 text-text-subtle transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute bottom-full left-0 right-0 z-40 mb-2 rounded-lg border border-border bg-surface p-1.5 shadow-lg">
            {/* Switch account */}
            <div className="px-2.5 pb-1 pt-1.5 text-caption font-semibold uppercase tracking-wide text-text-subtle">
              {t("nav.switch_account")}
            </div>
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
                  className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-surface-2"
                >
                  <Avatar account={a} size={28} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-small font-semibold leading-tight">{nameOf(a)}</span>
                    {a.username && <span className="block truncate text-caption text-text-subtle">@{a.username}</span>}
                  </span>
                  {isSel ? (
                    <IcCheck size={16} className="shrink-0 text-success" />
                  ) : (
                    <span className="w-4 shrink-0" />
                  )}
                </button>
              );
            })}
            <ConnectThreadsButton variant="menu" />

            <div className="my-1.5 h-px bg-border" />

            {/* Signed-in identity */}
            {effMe && (
              <div className="px-2.5 py-1">
                <div className="truncate text-small font-semibold leading-tight text-text">{effMe.email}</div>
                <div className="mt-0.5 inline-flex items-center gap-1.5 text-caption capitalize text-text-subtle">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  {effMe.tenant.plan_tier} plan
                </div>
              </div>
            )}
            <Link
              href="/app/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-small text-text transition-colors hover:bg-surface-2"
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
                className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-small text-danger transition-colors hover:bg-danger/10"
              >
                <IcLogout size={16} /> {t("dashboard.nav.logout")}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
