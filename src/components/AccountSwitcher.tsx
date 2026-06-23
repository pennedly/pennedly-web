"use client";

// Bottom-of-sidebar account + profile control (desktop): ONE tidy button showing
// the active Threads account (real avatar + display name + @handle) that opens an
// upward menu — switch between connected accounts, connect another, jump to
// Settings, and log out, with the signed-in user (email + plan) as a quiet
// header. The phone form of this control is the account SHEET (MobileAccountButton).
//
// Account loading (incl. the ?demo=1 review mode) lives in useConnectedAccounts,
// shared with the mobile sheet so both render from one source.

import Link from "next/link";
import { useState } from "react";

import { setSelectedAccountId } from "@/lib/account";
import { captureEvent } from "@/lib/analytics";
import { useTranslation } from "@/lib/i18n";
import { useConnectedAccounts } from "@/components/useConnectedAccounts";
import { ConnectThreadsButton } from "@/components/ConnectThreadsButton";
import { Avatar, nameOf } from "@/components/ui/avatar";
import { IcCheck, IcChevDown, IcChevRight, IcLogout, IcOverview, IcSettings } from "@/components/icons";
import type { Me } from "@/lib/types";

export function AccountSwitcher({ me, onLogout }: { me?: Me | null; onLogout?: () => void }) {
  const { accounts, loaded, selectedAccount, effMe } = useConnectedAccounts(me);
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();

  if (!loaded) return null;
  // Brand-new user / fresh Meta reviewer with nothing connected yet.
  if (accounts.length === 0) return <ConnectThreadsButton variant="primary" />;
  if (!selectedAccount) return null;

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
          <div className="absolute bottom-full left-0 right-0 z-40 mb-2 rounded-lg border border-border bg-surface p-1.5 shadow-lg md:right-auto md:w-[340px]">
            {/* "All accounts" → the multi-account Overview rollup. Pinned on top
                of the switcher (the screen's only entry point); shows the
                connected count. Only meaningful with ≥1 account (always true
                here — the 0-account case returns the connect CTA above). */}
            <Link
              href="/app/overview"
              onClick={() => setOpen(false)}
              className="mb-1.5 flex items-center gap-2.5 rounded-md border border-accent/20 bg-accent/[0.08] p-2 transition-colors hover:bg-accent/[0.12]"
            >
              <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-md border border-accent/25 bg-accent/[0.14] text-accent">
                <IcOverview size={17} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-small font-semibold leading-tight text-text">
                  {t("overview.switcher.all_accounts")}
                </span>
                <span className="block truncate text-caption text-text-subtle">
                  {t("overview.switcher.connected").replace("{n}", String(accounts.length))}
                </span>
              </span>
              <IcChevRight size={15} className="shrink-0 text-text-subtle" />
            </Link>

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
