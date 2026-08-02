"use client";

// Settings — account identity + plan, the interface language, the connected
// Threads accounts (disconnect / connect another), and quick shortcuts.
// Layout per design-export/PennedlyDesign/settings-* . Frontend restyle — the
// me / accounts / locale / disconnect APIs already back it. Design bits with no
// backend (change-email, billing "manage plan", follower counts, a version
// number) are omitted rather than faked.

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  ApiError,
  clearTokens,
  deleteAccount,
  disconnectAccount,
  exportAccountData,
  fetchMe,
  fetchMyAccounts,
  getTokens,
  setMyLocale,
} from "@/lib/api";
import { friendlyErrorText } from "@/lib/errors";
import { invalidateAccountData } from "@/lib/account-data";
import {
  getSelectedAccountId,
  setSelectedAccountId,
} from "@/lib/account";
import { refreshAccountsPresence, resetAccountsPresenceForSignedOutUser } from "@/lib/accounts";
import {
  LOCALES,
  setLocale,
  useLocale,
  useTranslation,
  type LocaleCode,
} from "@/lib/i18n";
import { captureEvent, resetIdentity } from "@/lib/analytics";
import { AppTopbar } from "@/components/AppTopbar";
import { Avatar, AccountFace } from "@/components/ui/avatar";
import { Button, buttonClasses } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/feedback";
import { Toast, ToastHost } from "@/components/ui/toast";
import { ConnectThreadsButton } from "@/components/ConnectThreadsButton";
import { cn } from "@/lib/cn";
import { IcCheck, IcEye, IcFlask, IcScan, IcStar, IcUnlink, IcVoice } from "@/components/icons";
import { TweaksPanel, TweakSection, TweakToggle, TweakRadio, useTweaks } from "@/components/tweaks/TweaksPanel";
import { DEMO_ACCOUNTS, DEMO_ME, SET_TWEAK_DEFAULTS } from "@/components/studio/settings-demo";
import type { ConnectedAccount, Me } from "@/lib/types";
import { useDemoParam } from "@/lib/query";
import { HERO_FADE_STYLE } from "@/lib/useHeaderReveal";

const IS_DEV = process.env.NODE_ENV === "development";
const SET_STATES = ["Default", "Disconnect", "Loading"];

type Toast = { id: number; message: string; tone: "success" | "error" };

function initial(s: string | null | undefined): string {
  return (s?.trim()?.[0] ?? "@").toUpperCase();
}

export default function SettingsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const locale = useLocale();
  const [me, setMe] = useState<Me | null>(null);
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const demoParam = useDemoParam();
  const [isTester, setIsTester] = useState(false);
  const allow = demoParam && (IS_DEV || isTester);
  const demoOn = allow;
  const [tw, setTw] = useTweaks(SET_TWEAK_DEFAULTS);

  function toast(message: string, tone: Toast["tone"] = "success") {
    const id = Date.now() + Math.random();
    setToasts((s) => [...s, { id, message, tone }]);
    setTimeout(() => setToasts((s) => s.filter((x) => x.id !== id)), 3500);
  }

  async function onExportData() {
    setExporting(true);
    captureEvent("ui.account_exported");
    try {
      const data = await exportAccountData();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pennedly-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast(t("settings.export_failed"), "error");
    } finally {
      setExporting(false);
    }
  }

  async function onDeleteAccount() {
    setDeleting(true);
    captureEvent("ui.account_deleted");
    try {
      await deleteAccount();
      resetIdentity();
      resetAccountsPresenceForSignedOutUser();
      clearTokens();
      router.push("/app/login");
    } catch {
      setDeleting(false);
      toast(t("settings.delete_failed"), "error");
    }
  }

  useEffect(() => {
    if (!getTokens()) return;
    fetchMe().then((m) => setIsTester(m.is_tester === true)).catch(() => {});
  }, []);

  useEffect(() => {
    if (demoParam) return;
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
  }, [router, demoParam]);

  useEffect(() => {
    if (!demoOn) return;
    document.documentElement.classList.toggle("dark", !!tw.dark);
  }, [demoOn, tw.dark]);

  useEffect(() => {
    if (!demoOn) return;
    if (tw.state === "Loading") {
      setLoaded(false);
      return;
    }
    setMe(DEMO_ME);
    setAccounts(DEMO_ACCOUNTS);
    setConfirmId(tw.state === "Disconnect" ? DEMO_ACCOUNTS[1].id : null);
    setLoaded(true);
  }, [demoOn, tw.state]);

  function pickLocale(code: LocaleCode, name: string) {
    setLocale(code);
    captureEvent("ui.locale_switched", { locale: code });
    setMyLocale(code).catch(() => {});
    toast(`${t("settings.lang_toast")} · ${name}`);
  }

  async function onDisconnect(a: ConnectedAccount) {
    if (demoOn) {
      setAccounts((list) => list.filter((x) => x.id !== a.id));
      setConfirmId(null);
      toast(`${t("settings.disconnect_toast")} · @${a.username ?? a.id}`);
      return;
    }
    setBusyId(a.id);
    captureEvent("ui.account_disconnect", { account_id: a.id });
    try {
      await disconnectAccount(a.id);
      setAccounts((list) => list.filter((x) => x.id !== a.id));
      if (getSelectedAccountId() === a.id) setSelectedAccountId(null);
      // The portfolio changed — drop the account-dashboard cache so it doesn't
      // show the just-disconnected profile as live for up to the TTL.
      invalidateAccountData();
      refreshAccountsPresence();
      setConfirmId(null);
      toast(`${t("settings.disconnect_toast")} · @${a.username ?? a.id}`);
    } catch (e) {
      toast(friendlyErrorText(e), "error");
    } finally {
      setBusyId(null);
    }
  }

  const selectedId = getSelectedAccountId();

  return (
    <div className="min-h-screen bg-bg text-text">
      <AppTopbar maxW="720px" title={t("settings.title")} hasHero={loaded && !!me} />
      <main className="mx-auto max-w-[720px] space-y-4 px-3.5 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-4 md:space-y-5 md:px-6 md:pb-24 md:pt-7">
        {!loaded || !me ? (
          <div className="space-y-5">
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-40 w-full rounded-lg" />
            <Skeleton className="h-40 w-full rounded-lg" />
          </div>
        ) : (
          <>
            {/* Intro */}
            <div>
              <span className="text-caption font-semibold uppercase tracking-wide text-text-subtle">
                {t("settings.eyebrow")}
              </span>
              <h1 style={HERO_FADE_STYLE} className="mt-2 text-h1 font-semibold tracking-tight">{t("settings.title")}</h1>
              <p className="mt-2 max-w-[60ch] text-body leading-relaxed text-text-muted">
                {t("settings.intro_lead")}
              </p>
            </div>

            {/* Account */}
            <section className="rounded-lg border border-border bg-surface p-5 shadow-sm">
              <h2 className="text-small font-semibold">{t("settings.account")}</h2>
              <div className="mt-4 flex items-center gap-3.5">
                <AccountFace url={me.avatar_url} initials={initial(me.display_name ?? me.email)} size={52} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-body font-semibold">
                    {me.display_name ?? me.tenant.name}
                  </div>
                  <div className="truncate text-small text-text-subtle">{me.email}</div>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-accent/30 bg-accent/12 px-2.5 py-1 text-caption font-semibold capitalize text-accent">
                  <IcStar size={13} />
                  {me.tenant.plan_tier}
                </span>
              </div>
              <div className="mt-4 flex flex-col divide-y divide-border border-t border-border">
                <div className="flex items-center justify-between gap-3 py-2.5 text-small">
                  <span className="text-text-subtle">{t("settings.email")}</span>
                  <span className="truncate">{me.email}</span>
                </div>
                <div className="flex items-center justify-between gap-3 py-2.5 text-small">
                  <span className="text-text-subtle">{t("settings.plan")}</span>
                  <span className="capitalize">{me.tenant.plan_tier}</span>
                </div>
              </div>
            </section>

            {/* Language */}
            <section className="rounded-lg border border-border bg-surface p-5 shadow-sm">
              <h2 className="text-small font-semibold">{t("settings.language")}</h2>
              <p className="mt-0.5 text-caption text-text-subtle">{t("settings.language_desc")}</p>
              <div role="radiogroup" className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
                {LOCALES.map((l) => {
                  const active = l.code === locale;
                  return (
                    <button
                      key={l.code}
                      role="radio"
                      aria-checked={active}
                      onClick={() => pickLocale(l.code as LocaleCode, l.name)}
                      className={cn(
                        "flex items-center gap-2.5 rounded-md border px-3 py-2.5 text-left transition-colors",
                        active
                          ? "border-text bg-surface-2 shadow-[0_0_0_1px_var(--color-text)]"
                          : "border-border hover:bg-surface-2",
                      )}
                    >
                      {/* Q46: locale-code badge + native name + English name
                          (monochrome, one globe/code pattern across all switchers — no flags). */}
                      <span
                        className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-md border border-border bg-surface-2 font-mono text-caption font-medium uppercase text-text-muted"
                        aria-hidden="true"
                      >
                        {l.code}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-small font-medium">{l.name}</span>
                        {l.en !== l.name && (
                          <span className="block truncate text-caption text-text-subtle">{l.en}</span>
                        )}
                      </span>
                      {active && <IcCheck size={16} className="shrink-0 text-text" />}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Connected accounts */}
            <section className="rounded-lg border border-border bg-surface p-5 shadow-sm">
              <h2 className="text-small font-semibold">{t("settings.accounts")}</h2>
              <p className="mt-0.5 text-caption text-text-subtle">{t("settings.accounts_desc")}</p>
              <div className="mt-4 flex flex-col gap-2.5">
                {accounts.map((a) => (
                  <div
                    key={a.id}
                    className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-surface-2 p-3"
                  >
                    {/* Q38: real Threads profile photo, monogram fallback. */}
                    <Avatar account={a} size={40} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-small font-semibold">
                        <span className="truncate">{a.display_name || `@${a.username ?? a.id}`}</span>
                        {a.id === selectedId && (
                          <span className="shrink-0 rounded-full border border-border bg-surface px-2 py-px text-caption font-medium text-text-muted">
                            {t("settings.primary_tag")}
                          </span>
                        )}
                      </div>
                      <div className="truncate text-caption text-text-subtle">@{a.username ?? a.id}</div>
                    </div>
                    {confirmId === a.id ? (
                      <div className="flex shrink-0 items-center gap-2 max-md:w-full max-md:flex-wrap max-md:justify-end">
                        <span className="text-caption text-text-subtle max-md:basis-full">
                          {t("settings.disconnect_q").replace("{handle}", `@${a.username ?? a.id}`)}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setConfirmId(null)}
                          disabled={busyId === a.id}
                        >
                          {t("common.cancel")}
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => onDisconnect(a)}
                          loading={busyId === a.id}
                          disabled={busyId === a.id}
                          icon={<IcUnlink size={15} />}
                        >
                          {t("settings.disconnect_do")}
                        </Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => setConfirmId(a.id)}>
                        {t("settings.disconnect")}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <ConnectThreadsButton variant="primary" />
              </div>
            </section>

            {/* Shortcuts */}
            <section className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
              <div className="flex items-center gap-3.5 p-4 max-md:flex-wrap">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-border bg-surface-2 text-text-muted">
                  <IcVoice size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-small font-semibold">{t("settings.shortcut_voice_t")}</div>
                  <div className="mt-0.5 text-caption text-text-subtle">{t("settings.shortcut_voice_d")}</div>
                </div>
                <Link
                  href="/app/role-book"
                  className={`${buttonClasses({ variant: "primary", size: "sm" })} max-md:min-h-[44px] max-md:w-full max-md:basis-full`}
                >
                  {t("settings.open_voice")}
                </Link>
              </div>
              {/* Q33: a second row — restart the whole setup (re-runs onboarding,
                  replaces the current voice) vs the everyday edit above. */}
              <div className="flex items-center gap-3.5 border-t border-border p-4 max-md:flex-wrap">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-border bg-surface-2 text-text-muted">
                  <IcScan size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-small font-semibold">{t("settings.restart_t")}</div>
                  <div className="mt-0.5 text-caption text-warning">{t("settings.restart_d")}</div>
                </div>
                <Link
                  href="/app/onboarding"
                  className={`${buttonClasses({ variant: "secondary", size: "sm" })} max-md:min-h-[44px] max-md:w-full max-md:basis-full`}
                >
                  {t("settings.restart_cta")}
                </Link>
              </div>
              {me.is_tester && (
                <div className="flex items-center gap-3.5 border-t border-border p-4 max-md:flex-wrap">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-border bg-surface-2 text-text-muted">
                    <IcFlask size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-small font-semibold">
                      {t("settings.shortcut_preview_t")}
                      <span className="rounded-full border border-border bg-surface-2 px-2 py-px text-caption font-medium text-text-muted">
                        {t("settings.tester_tag")}
                      </span>
                    </div>
                    <div className="mt-0.5 text-caption text-text-subtle">{t("settings.shortcut_preview_d")}</div>
                  </div>
                  <Link
                    href="/app/onboarding?preview=1"
                    className={`${buttonClasses({ variant: "secondary", size: "sm" })} max-md:min-h-[44px] max-md:w-full max-md:basis-full`}
                  >
                    <IcEye size={15} />
                    {t("settings.enter_preview")}
                  </Link>
                </div>
              )}
            </section>

            <section className="mt-8">
              <h2 className="mb-3 text-caption font-semibold uppercase tracking-[0.06em] text-text-subtle">
                {t("settings.data_title")}
              </h2>
              <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="text-small font-medium text-text">{t("settings.export_data")}</div>
                  <div className="mt-0.5 text-caption text-text-subtle">{t("settings.export_data_sub")}</div>
                </div>
                <Button variant="secondary" size="sm" onClick={onExportData} disabled={exporting} className="shrink-0 max-md:w-full">
                  {exporting ? t("settings.exporting") : t("settings.export_data")}
                </Button>
              </div>
            </section>

            <section className="mt-8">
              <h2 className="mb-3 text-caption font-semibold uppercase tracking-[0.06em] text-danger">
                {t("settings.danger_title")}
              </h2>
              <div className="flex flex-col gap-3 rounded-lg border border-danger/40 bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="text-small font-medium text-text">{t("settings.delete_account")}</div>
                  <div className="mt-0.5 text-caption text-text-subtle">{t("settings.delete_account_sub")}</div>
                </div>
                {deleteConfirm ? (
                  <div className="flex shrink-0 gap-2 max-md:w-full">
                    <Button variant="secondary" size="sm" onClick={() => setDeleteConfirm(false)} disabled={deleting} className="max-md:flex-1">
                      {t("common.cancel")}
                    </Button>
                    <Button variant="danger" size="sm" onClick={onDeleteAccount} disabled={deleting} className="max-md:flex-1">
                      {deleting ? t("settings.deleting") : t("settings.delete_confirm")}
                    </Button>
                  </div>
                ) : (
                  <Button variant="danger" size="sm" onClick={() => setDeleteConfirm(true)} className="shrink-0 max-md:w-full">
                    {t("settings.delete_account")}
                  </Button>
                )}
              </div>
            </section>
          </>
        )}
      </main>

      <ToastHost>
        {toasts.map((tt) => (
          <Toast key={tt.id} tone={tt.tone} title={tt.message} />
        ))}
      </ToastHost>

      {allow && (
        <TweaksPanel title="Settings">
          <TweakSection label="Appearance" />
          <TweakToggle label="Dark mode" value={tw.dark} onChange={(v) => setTw("dark", v)} />
          <TweakSection label="State" />
          <TweakRadio label="State" value={tw.state} options={SET_STATES} onChange={(v) => setTw("state", v)} />
        </TweaksPanel>
      )}
    </div>
  );
}
