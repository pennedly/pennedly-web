"use client";

// Autopilot settings — opt-in, OFF by default. A few clear controls to
// assemble your own autopilot: auto-post cadence + quiet hours, and
// auto-reply audience + daily cap. Tester-gated. The autopilot worker
// reads this config; this screen only edits it. Voice/style come from
// the existing Voice + Style screens (linked, not duplicated here).

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  ApiError,
  clearTokens,
  fetchAutopilot,
  getTokens,
  updateAutopilot,
} from "@/lib/api";
import { captureEvent } from "@/lib/analytics";
import { useSelectedAccountId } from "@/lib/account";
import { useTranslation } from "@/lib/i18n";
import { AccountSwitcher } from "@/components/AccountSwitcher";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTesterGuard } from "@/lib/tester";
import type { AutopilotConfig } from "@/lib/types";

type Toast = { id: number; message: string; tone: "success" | "error" };

const HOURS = Array.from({ length: 24 }, (_, i) => i);

function Toggle({
  on,
  onChange,
  label,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className="flex items-center gap-3 text-left"
    >
      <span
        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${
          on ? "bg-green-600" : "bg-zinc-300 dark:bg-zinc-700"
        }`}
        aria-hidden
      >
        <span
          className={`inline-block h-4 w-4 mt-0.5 rounded-full bg-white shadow transition-transform ${
            on ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </span>
      <span className="text-sm">{label}</span>
    </button>
  );
}

export default function AutopilotPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { checking } = useTesterGuard();
  const accountId = useSelectedAccountId();
  const [config, setConfig] = useState<AutopilotConfig | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  function toast(message: string, tone: Toast["tone"] = "success") {
    const id = Date.now() + Math.random();
    setToasts((s) => [...s, { id, message, tone }]);
    setTimeout(() => setToasts((s) => s.filter((x) => x.id !== id)), 3500);
  }

  useEffect(() => {
    if (!getTokens()) router.push("/app/login");
  }, [router]);

  useEffect(() => {
    if (accountId === null) return;
    setLoaded(false);
    (async () => {
      try {
        setConfig(await fetchAutopilot(accountId));
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          clearTokens();
          router.push("/app/login");
          return;
        }
        setBootError(String(e));
      } finally {
        setLoaded(true);
      }
    })();
  }, [accountId, router]);

  function update<K extends keyof AutopilotConfig>(
    key: K,
    value: AutopilotConfig[K],
  ) {
    setConfig((c) => (c ? { ...c, [key]: value } : c));
  }

  async function onSave() {
    if (config === null || accountId === null) return;
    setSaving(true);
    captureEvent("ui.autopilot_save", {
      account_id: accountId,
      enabled: config.enabled,
    });
    try {
      setConfig(await updateAutopilot(accountId, config));
      toast(t("autopilot.saved"));
    } catch (e) {
      toast(String(e), "error");
    } finally {
      setSaving(false);
    }
  }

  if (checking) return null;

  if (bootError) {
    return (
      <main className="max-w-2xl mx-auto px-6 py-16">
        <div className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-950 p-4 text-sm text-red-800 dark:text-red-200">
          {bootError}
        </div>
      </main>
    );
  }

  const selectCls =
    "rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-700";

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <header className="sticky top-0 z-20 bg-white/90 dark:bg-zinc-950/90 backdrop-blur border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between gap-3">
          <Link
            href="/app"
            className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            {t("autopilot.back")}
          </Link>
          <div className="flex items-center gap-3">
            <AccountSwitcher />
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("autopilot.title")}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">{t("autopilot.subtitle")}</p>
        </div>

        {!loaded || config === null ? (
          <p className="text-sm text-zinc-500">{t("common.loading")}</p>
        ) : (
          <>
            {/* Master switch */}
            <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
              <Toggle
                on={config.enabled}
                onChange={(v) => update("enabled", v)}
                label={t("autopilot.master")}
              />
            </section>

            {/* Auto-post */}
            <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm space-y-4">
              <h2 className="text-sm font-semibold">
                {t("autopilot.posts_title")}
              </h2>
              <Toggle
                on={config.post_enabled}
                onChange={(v) => update("post_enabled", v)}
                label={t("autopilot.post_enabled")}
              />
              <div className="flex items-center justify-between gap-3 text-sm">
                <span>{t("autopilot.posts_per_day")}</span>
                <select
                  value={config.posts_per_day}
                  onChange={(e) =>
                    update("posts_per_day", Number(e.target.value))
                  }
                  className={selectCls}
                >
                  {[1, 2, 3, 5].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span>{t("autopilot.quiet_hours")}</span>
                <div className="flex items-center gap-2">
                  <select
                    value={config.quiet_start_hour ?? ""}
                    onChange={(e) =>
                      update(
                        "quiet_start_hour",
                        e.target.value === "" ? null : Number(e.target.value),
                      )
                    }
                    className={selectCls}
                  >
                    <option value="">{t("autopilot.quiet_off")}</option>
                    {HOURS.map((h) => (
                      <option key={h} value={h}>
                        {String(h).padStart(2, "0")}:00
                      </option>
                    ))}
                  </select>
                  <span className="text-zinc-400">→</span>
                  <select
                    value={config.quiet_end_hour ?? ""}
                    onChange={(e) =>
                      update(
                        "quiet_end_hour",
                        e.target.value === "" ? null : Number(e.target.value),
                      )
                    }
                    className={selectCls}
                  >
                    <option value="">{t("autopilot.quiet_off")}</option>
                    {HOURS.map((h) => (
                      <option key={h} value={h}>
                        {String(h).padStart(2, "0")}:00
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            {/* Auto-reply */}
            <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm space-y-4">
              <h2 className="text-sm font-semibold">
                {t("autopilot.replies_title")}
              </h2>
              <Toggle
                on={config.reply_enabled}
                onChange={(v) => update("reply_enabled", v)}
                label={t("autopilot.reply_enabled")}
              />
              <div className="flex items-center justify-between gap-3 text-sm">
                <span>{t("autopilot.reply_audience")}</span>
                <select
                  value={config.reply_audience}
                  onChange={(e) => update("reply_audience", e.target.value)}
                  className={selectCls}
                >
                  <option value="fans">{t("autopilot.audience_fans")}</option>
                  <option value="all_except_trolls">
                    {t("autopilot.audience_all_except_trolls")}
                  </option>
                  <option value="questions">
                    {t("autopilot.audience_questions")}
                  </option>
                </select>
              </div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span>{t("autopilot.replies_per_day")}</span>
                <select
                  value={config.replies_per_day}
                  onChange={(e) =>
                    update("replies_per_day", Number(e.target.value))
                  }
                  className={selectCls}
                >
                  {[1, 3, 5, 10].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            </section>

            {/* Notes */}
            <div className="text-xs text-zinc-500 space-y-1">
              <p>
                {t("autopilot.uses_voice")}{" "}
                <Link href="/app/role-book" className="underline">
                  {t("dashboard.nav.voice")}
                </Link>{" "}
                ·{" "}
                <Link href="/app/style-rules" className="underline">
                  {t("dashboard.nav.style_rules")}
                </Link>
              </p>
              <p>{t("autopilot.safety")}</p>
            </div>

            {/* Save bar */}
            <div className="sticky bottom-4 flex items-center justify-end gap-3 bg-white/95 dark:bg-zinc-950/95 backdrop-blur border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 shadow-md">
              <button
                onClick={onSave}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-sm font-medium hover:bg-zinc-700 dark:hover:bg-white disabled:opacity-50 transition-colors"
              >
                {saving && (
                  <span
                    className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"
                    aria-hidden
                  />
                )}
                {saving ? t("common.saving") : t("common.save")}
              </button>
            </div>
          </>
        )}
      </main>

      <div className="fixed bottom-6 right-6 z-30 space-y-2 pointer-events-none">
        {toasts.map((tt) => (
          <div
            key={tt.id}
            className={`px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium pointer-events-auto ${
              tt.tone === "error"
                ? "bg-red-600 text-white"
                : "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
            }`}
          >
            {tt.message}
          </div>
        ))}
      </div>
    </div>
  );
}
