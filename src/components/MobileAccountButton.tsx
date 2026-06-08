"use client";

// Mobile top-bar account control: the active account's avatar (≤ md) that opens
// the ACCOUNT SHEET — the phone form of the desktop sidebar-foot account
// popover. Switch between connected accounts, connect another, see the signed-in
// identity, jump to Settings, and log out. Lives in the top bar (right side) so
// the account is always one thumb-tap away; the bottom tab bar carries nav.

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { clearTokens, fetchMe, getTokens } from "@/lib/api";
import { captureEvent, resetIdentity } from "@/lib/analytics";
import { setSelectedAccountId } from "@/lib/account";
import { useTranslation } from "@/lib/i18n";
import { useConnectedAccounts } from "@/components/useConnectedAccounts";
import { MobileSheet } from "@/components/MobileSheet";
import { ConnectThreadsButton } from "@/components/ConnectThreadsButton";
import { Avatar, nameOf } from "@/components/ui/avatar";
import { IcCheck, IcLogout, IcSettings } from "@/components/icons";
import type { Me } from "@/lib/types";

export function MobileAccountButton() {
  const { t } = useTranslation();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [me, setMe] = useState<Me | null>(null);
  const { accounts, loaded, selectedAccount, effMe } = useConnectedAccounts(me);

  useEffect(() => {
    if (!getTokens()) return;
    fetchMe()
      .then(setMe)
      .catch(() => {});
  }, []);

  // No account to represent (still loading, or zero connected — the shell
  // redirects those to the connect flow). Render nothing rather than an empty
  // avatar.
  if (!loaded || !selectedAccount) return null;

  const identity = effMe ?? me;

  function logout() {
    setOpen(false);
    captureEvent("ui.logout_clicked");
    resetIdentity();
    clearTokens();
    router.push("/app/login");
  }

  return (
    <>
      <button
        type="button"
        aria-label={t("nav.switch_account")}
        onClick={() => setOpen(true)}
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full md:hidden"
      >
        <Avatar account={selectedAccount} size={30} />
      </button>

      {open && (
        <MobileSheet onClose={() => setOpen(false)}>
          {identity && (
            <div className="px-2.5 pb-1 pt-1.5">
              <div className="truncate text-small font-semibold leading-tight text-text">{identity.email}</div>
              <div className="mt-0.5 inline-flex items-center gap-1.5 text-caption capitalize text-text-subtle">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                {identity.tenant.plan_tier} plan
              </div>
            </div>
          )}

          <div className="px-2.5 pb-1 pt-3 text-caption font-semibold uppercase tracking-wide text-text-subtle">
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
                className="flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left transition-colors active:bg-surface-2"
              >
                <Avatar account={a} size={36} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-small font-semibold leading-tight">{nameOf(a)}</span>
                  {a.username && <span className="block truncate text-caption text-text-subtle">@{a.username}</span>}
                </span>
                {isSel ? <IcCheck size={18} className="shrink-0 text-success" /> : <span className="w-[18px] shrink-0" />}
              </button>
            );
          })}
          <ConnectThreadsButton variant="menu" />

          <div className="my-2 h-px bg-border" />

          <Link
            href="/app/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-md px-2.5 py-2.5 text-small text-text transition-colors active:bg-surface-2"
          >
            <IcSettings size={18} className="text-text-subtle" /> {t("nav.settings")}
          </Link>
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-md px-2.5 py-2.5 text-left text-small text-danger transition-colors active:bg-danger/10"
          >
            <IcLogout size={18} /> {t("dashboard.nav.logout")}
          </button>
        </MobileSheet>
      )}
    </>
  );
}
