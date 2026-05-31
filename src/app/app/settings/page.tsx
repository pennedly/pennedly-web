"use client";

// Settings — account-level info: who you're signed in as, your plan, and
// the connected Threads accounts (with a "connect another"). Language +
// log out live in the sidebar profile menu. In the shell (has the sidebar).

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  ApiError,
  clearTokens,
  disconnectAccount,
  fetchMe,
  fetchMyAccounts,
  getTokens,
  setMyLocale,
} from "@/lib/api";
import { getSelectedAccountId, setSelectedAccountId } from "@/lib/account";
import { refreshAccountsPresence } from "@/lib/accounts";
import {
  LOCALES,
  setLocale,
  useLocale,
  useTranslation,
  type LocaleCode,
} from "@/lib/i18n";
import { captureEvent } from "@/lib/analytics";
import { ConnectThreadsButton } from "@/components/ConnectThreadsButton";
import type { ConnectedAccount, Me } from "@/lib/types";

export default function SettingsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const locale = useLocale();
  const [me, setMe] = useState<Me | null>(null);
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onDisconnect(id: number) {
    setBusyId(id);
    setErr(null);
    captureEvent("ui.account_disconnect", { account_id: id });
    try {
      await disconnectAccount(id);
      setAccounts((list) => list.filter((a) => a.id !== id));
      // If the disconnected account was the active one, clear the selection
      // so the rest of the app falls back to connect / another account.
      if (getSelectedAccountId() === id) setSelectedAccountId(null);
      // Tell the shell to re-check presence — if that was the last account,
      // it flips to the full-screen connect flow (sidebar vanishes).
      refreshAccountsPresence();
      setConfirmId(null);
    } catch (e) {
      setErr(
        e instanceof ApiError ? `${e.status}: ${String(e.detail)}` : String(e),
      );
    } finally {
      setBusyId(null);
    }
  }

  useEffect(() => {
    if (!getTokens()) {
      router.push("/app/login");
      return;
    }
    (async () => {
      try {
        const [m, a] = await Promise.all([fetchMe(), fetchMyAccounts()]);
        setMe(m);
        setAccounts(a.accounts.filter((x) => x.disconnected_at === null));
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          clearTokens();
          router.push("/app/login");
          return;
        }
      } finally {
        setLoaded(true);
      }
    })();
  }, [router]);

  return (
    <div className="min-h-screen bg-bg text-text">
      <main className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("settings.title")}
        </h1>

        {!loaded && <p className="text-sm text-zinc-500">{t("common.loading")}</p>}

        {loaded && me && (
          <>
            <section className="rounded-xl border border-border bg-surface p-5 shadow-sm">
              <h2 className="text-sm font-semibold mb-3">
                {t("settings.account")}
              </h2>
              <dl className="text-sm space-y-2">
                <div className="flex justify-between gap-3">
                  <dt className="text-zinc-500">{t("settings.email")}</dt>
                  <dd className="truncate">{me.email}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-zinc-500">{t("settings.plan")}</dt>
                  <dd className="capitalize">{me.tenant.plan_tier}</dd>
                </div>
              </dl>
            </section>

            <section className="rounded-xl border border-border bg-surface p-5 shadow-sm">
              <h2 className="text-sm font-semibold mb-3">
                {t("settings.language")}
              </h2>
              <div className="flex flex-wrap gap-2">
                {LOCALES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      setLocale(l.code as LocaleCode);
                      captureEvent("ui.locale_switched", { locale: l.code });
                      setMyLocale(l.code).catch(() => {});
                    }}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm transition-colors ${
                      l.code === locale
                        ? "border-zinc-400 dark:border-zinc-500 bg-surface-2"
                        : "border-border hover:bg-surface-2"
                    }`}
                  >
                    <span aria-hidden>{l.flag}</span>
                    <span>{l.name}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-border bg-surface p-5 shadow-sm">
              <h2 className="text-sm font-semibold mb-3">
                {t("settings.accounts")}
              </h2>
              <ul className="space-y-2 mb-3">
                {accounts.length === 0 && (
                  <li className="text-sm text-zinc-500">—</li>
                )}
                {accounts.map((a) => (
                  <li key={a.id} className="flex items-center gap-2 text-sm">
                    <span className="font-medium">
                      @{a.username ?? `acct ${a.id}`}
                    </span>
                    {a.display_name && (
                      <span className="text-zinc-500 truncate">
                        · {a.display_name}
                      </span>
                    )}
                    {confirmId === a.id ? (
                      <span className="ml-auto flex items-center gap-3 shrink-0">
                        <span className="text-text-muted">
                          {t("settings.disconnect_confirm")}
                        </span>
                        <button
                          onClick={() => onDisconnect(a.id)}
                          disabled={busyId === a.id}
                          className="font-medium text-red-600 dark:text-red-400 hover:underline disabled:opacity-50"
                        >
                          {busyId === a.id
                            ? t("settings.disconnecting")
                            : t("settings.disconnect_yes")}
                        </button>
                        <button
                          onClick={() => setConfirmId(null)}
                          disabled={busyId === a.id}
                          className="text-text-muted hover:underline disabled:opacity-50"
                        >
                          {t("common.cancel")}
                        </button>
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          setErr(null);
                          setConfirmId(a.id);
                        }}
                        className="ml-auto shrink-0 text-text-muted hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      >
                        {t("settings.disconnect")}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
              {err && <p className="text-sm text-red-600 dark:text-red-400 mb-2">{err}</p>}
              <p className="text-xs text-text-subtle mb-4">
                {t("settings.disconnect_hint")}
              </p>
              <ConnectThreadsButton variant="primary" />
            </section>

            <section className="rounded-xl border border-border bg-surface p-5 shadow-sm">
              <h2 className="text-sm font-semibold mb-1">
                {t("settings.voice_setup")}
              </h2>
              <p className="text-xs text-zinc-500 mb-3">
                {t("onboarding.subtitle")}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/app/onboarding"
                  className="inline-flex items-center px-4 py-2 rounded-md border border-border text-sm font-medium text-text hover:bg-surface-2 transition-colors"
                >
                  {t("settings.voice_setup_cta")}
                </Link>
                {me.is_tester && (
                  <Link
                    href="/app/onboarding?preview=1"
                    className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-blue-700 dark:text-blue-400 hover:underline"
                  >
                    {t("settings.voice_preview_cta")}
                  </Link>
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
