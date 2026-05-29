"use client";

// First-run onboarding wizard. Branches on whether the account already
// has posts: "analyze my posts" (voice from existing content) vs "build
// from scratch" (voice from a short form — the only path for a brand-new
// account). Either way the account ends up generation-ready and we send
// the user to the dashboard. Opts out of the sidebar shell (focused flow).

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  ApiError,
  clearTokens,
  fetchMyAccounts,
  fetchOnboardingStatus,
  getTokens,
  onboardingAnalyze,
  onboardingFromScratch,
} from "@/lib/api";
import { captureEvent } from "@/lib/analytics";
import { getSelectedAccountId, setSelectedAccountId } from "@/lib/account";
import { useTranslation } from "@/lib/i18n";
import { ConnectThreadsButton } from "@/components/ConnectThreadsButton";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { TagInput } from "@/components/TagInput";
import type { OnboardingStatus } from "@/lib/types";

type Step = "loading" | "connect" | "choose" | "form";

function errMsg(e: unknown): string {
  if (e instanceof ApiError) {
    const detail =
      typeof e.detail === "object" &&
      e.detail !== null &&
      "detail" in (e.detail as Record<string, unknown>)
        ? (e.detail as { detail: unknown }).detail
        : e.detail;
    return `${e.status}: ${String(detail)}`;
  }
  return String(e);
}

export default function OnboardingPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [step, setStep] = useState<Step>("loading");
  const [accountId, setAccountId] = useState<number | null>(null);
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [busy, setBusy] = useState<null | "analyze" | "create">(null);
  const [error, setError] = useState<string | null>(null);
  // Already-onboarded users can still open this page to re-run / test the
  // flow; we show a heads-up that submitting replaces their current voice.
  const [alreadySetUp, setAlreadySetUp] = useState(false);

  // From-scratch form
  const [intro, setIntro] = useState("");
  const [themes, setThemes] = useState<string[]>([]);
  const [excludes, setExcludes] = useState<string[]>([]);

  useEffect(() => {
    if (!getTokens()) {
      router.replace("/app/login");
      return;
    }
    (async () => {
      try {
        const list = await fetchMyAccounts();
        const active = list.accounts.filter((a) => a.disconnected_at === null);
        if (active.length === 0) {
          setStep("connect");
          return;
        }
        let acc = getSelectedAccountId();
        if (acc === null || !active.some((a) => a.id === acc)) {
          acc = active[0].id;
          setSelectedAccountId(acc);
        }
        setAccountId(acc);
        const st = await fetchOnboardingStatus(acc);
        setStatus(st);
        // Don't bounce already-set-up users away — let them re-run / test
        // the flow (with a heads-up). New accounts have needs_onboarding.
        setAlreadySetUp(!st.needs_onboarding);
        setStep("choose");
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          clearTokens();
          router.replace("/app/login");
          return;
        }
        setError(errMsg(e));
        setStep("choose");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onAnalyze() {
    if (accountId === null) return;
    setBusy("analyze");
    setError(null);
    captureEvent("ui.onboarding_analyze", { account_id: accountId });
    try {
      await onboardingAnalyze(accountId);
      router.replace("/app");
    } catch (e) {
      // No posts after all → steer to the from-scratch form.
      if (e instanceof ApiError && e.status === 422) {
        setStep("form");
        setError(t("onboarding.analyze_none"));
      } else {
        setError(errMsg(e));
      }
      setBusy(null);
    }
  }

  async function onCreate() {
    if (accountId === null) return;
    if (!intro.trim() && themes.length === 0) {
      setError(t("onboarding.error_empty"));
      return;
    }
    setBusy("create");
    setError(null);
    captureEvent("ui.onboarding_from_scratch", { account_id: accountId });
    try {
      await onboardingFromScratch(accountId, {
        intro: intro.trim(),
        themes_include: themes,
        themes_exclude: excludes,
      });
      router.replace("/app");
    } catch (e) {
      setError(errMsg(e));
      setBusy(null);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <header className="max-w-xl mx-auto px-6 pt-6 flex items-center justify-between">
        <span className="text-lg font-semibold tracking-tight">Pennedly</span>
        <LanguageSwitcher />
      </header>

      <main className="max-w-xl mx-auto px-6 py-10 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("onboarding.title")}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">{t("onboarding.subtitle")}</p>
        </div>

        {alreadySetUp && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/40 p-3 text-sm text-amber-800 dark:text-amber-200">
            {t("onboarding.already_setup")}
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-950 p-3 text-sm text-red-800 dark:text-red-200">
            {error}
          </div>
        )}

        {step === "loading" && (
          <p className="text-sm text-zinc-500">{t("common.loading")}</p>
        )}

        {step === "connect" && (
          <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 text-center shadow-sm">
            <h2 className="text-base font-semibold">
              {t("onboarding.connect_title")}
            </h2>
            <p className="text-sm text-zinc-500 mt-1 mb-4">
              {t("onboarding.connect_body")}
            </p>
            <div className="flex justify-center">
              <ConnectThreadsButton variant="primary" />
            </div>
          </section>
        )}

        {step === "choose" && (
          <div className="space-y-4">
            {/* Analyze existing posts */}
            <section
              className={`rounded-xl border p-5 shadow-sm ${
                status?.can_analyze
                  ? "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                  : "border-zinc-200 dark:border-zinc-800 bg-zinc-100/60 dark:bg-zinc-900/40"
              }`}
            >
              <h2 className="text-base font-semibold">
                {t("onboarding.analyze_title")}
              </h2>
              <p className="text-sm text-zinc-500 mt-1">
                {t("onboarding.analyze_body")}
              </p>
              {status?.can_analyze ? (
                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={onAnalyze}
                    disabled={busy !== null}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-sm font-medium hover:bg-zinc-700 dark:hover:bg-white disabled:opacity-50 transition-colors"
                  >
                    {busy === "analyze" && (
                      <span
                        className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"
                        aria-hidden
                      />
                    )}
                    {busy === "analyze"
                      ? t("onboarding.analyzing")
                      : t("onboarding.analyze_cta")}
                  </button>
                  <span className="text-xs text-zinc-500">
                    {status.post_count} {t("onboarding.analyze_count")}
                  </span>
                </div>
              ) : (
                <p className="mt-3 text-xs text-zinc-500">
                  {t("onboarding.analyze_none")}
                </p>
              )}
            </section>

            {/* Build from scratch */}
            <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
              <h2 className="text-base font-semibold">
                {t("onboarding.scratch_title")}
              </h2>
              <p className="text-sm text-zinc-500 mt-1">
                {t("onboarding.scratch_body")}
              </p>
              <button
                onClick={() => {
                  setError(null);
                  setStep("form");
                }}
                disabled={busy !== null}
                className="mt-4 inline-flex items-center px-4 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 text-sm font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 transition-colors"
              >
                {t("onboarding.scratch_cta")}
              </button>
            </section>
          </div>
        )}

        {step === "form" && (
          <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm space-y-5">
            <button
              onClick={() => {
                setError(null);
                setStep("choose");
              }}
              className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
            >
              {t("onboarding.back")}
            </button>

            <div>
              <label className="block text-sm font-medium mb-1">
                {t("onboarding.form_intro_label")}
              </label>
              <textarea
                value={intro}
                onChange={(e) => setIntro(e.target.value)}
                rows={5}
                placeholder={t("onboarding.form_intro_ph")}
                className="w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-700 resize-y"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                {t("onboarding.form_themes_label")}
              </label>
              <TagInput
                items={themes}
                onChange={setThemes}
                placeholder={t("onboarding.form_themes_ph")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                {t("onboarding.form_exclude_label")}
              </label>
              <TagInput
                items={excludes}
                onChange={setExcludes}
                placeholder={t("onboarding.form_exclude_ph")}
              />
            </div>

            <button
              onClick={onCreate}
              disabled={busy !== null}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-sm font-medium hover:bg-zinc-700 dark:hover:bg-white disabled:opacity-50 transition-colors"
            >
              {busy === "create" && (
                <span
                  className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"
                  aria-hidden
                />
              )}
              {busy === "create"
                ? t("onboarding.creating")
                : t("onboarding.create_cta")}
            </button>
          </section>
        )}
      </main>
    </div>
  );
}
