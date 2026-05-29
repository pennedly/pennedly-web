"use client";

// Autopilot — opt-in, OFF by default. A global master switch + a list of
// "autopost objects": each posts once a day at its hour (optionally on a
// topic) and carries its own auto-reply toggle (replies to comments under
// THAT object's posts). Add / edit / delete objects freely. Tester-gated.
// The autopilot_tick worker reads these; this screen only edits them.

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  ApiError,
  clearTokens,
  createAutopostRule,
  deleteAutopostRule,
  fetchAutopostRules,
  getTokens,
  setAutopilotMaster,
  updateAutopostRule,
} from "@/lib/api";
import { captureEvent } from "@/lib/analytics";
import { useSelectedAccountId } from "@/lib/account";
import { useTranslation } from "@/lib/i18n";
import { useTesterGuard } from "@/lib/tester";
import type { AutopostRule, TopicOption } from "@/lib/types";

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
      className="flex items-center gap-2.5 text-left"
      aria-label={label || "toggle"}
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
      {label && <span className="text-sm">{label}</span>}
    </button>
  );
}

const SELECT =
  "rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-700";

export default function AutopilotPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { checking } = useTesterGuard();
  const accountId = useSelectedAccountId();
  const [master, setMaster] = useState(false);
  const [rules, setRules] = useState<AutopostRule[]>([]);
  const [topics, setTopics] = useState<TopicOption[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
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
        const data = await fetchAutopostRules(accountId);
        setMaster(data.master_enabled);
        setRules(data.rules);
        setTopics(data.topics);
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

  async function onMaster(v: boolean) {
    if (accountId === null) return;
    setMaster(v);
    captureEvent("ui.autopilot_master", { account_id: accountId, enabled: v });
    try {
      await setAutopilotMaster(accountId, v);
    } catch (e) {
      setMaster(!v);
      toast(String(e), "error");
    }
  }

  async function onAdd() {
    if (accountId === null) return;
    captureEvent("ui.autopilot_add_object", { account_id: accountId });
    try {
      const rule = await createAutopostRule(accountId, { post_hour: 9 });
      setRules((rs) => [...rs, rule]);
    } catch (e) {
      toast(String(e), "error");
    }
  }

  async function patchRule(id: number, patch: Partial<AutopostRule>) {
    setRules((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    try {
      await updateAutopostRule(id, patch);
    } catch (e) {
      toast(String(e), "error");
    }
  }

  async function onDelete(id: number) {
    try {
      await deleteAutopostRule(id);
      setRules((rs) => rs.filter((r) => r.id !== id));
      setConfirmDelete(null);
    } catch (e) {
      toast(String(e), "error");
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

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("autopilot.title")}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">{t("autopilot.subtitle")}</p>
        </div>

        {!loaded ? (
          <p className="text-sm text-zinc-500">{t("common.loading")}</p>
        ) : (
          <>
            {/* Master switch */}
            <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
              <Toggle on={master} onChange={onMaster} label={t("autopilot.master")} />
            </section>

            {/* Autopost objects */}
            <section className="space-y-3">
              <div>
                <h2 className="text-base font-semibold">
                  {t("autopilot.objects_title")}
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {t("autopilot.objects_subtitle")}
                </p>
              </div>

              {rules.length === 0 && (
                <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 p-6 text-center">
                  <p className="text-sm text-zinc-500">
                    {t("autopilot.no_objects")}
                  </p>
                </div>
              )}

              {rules.map((r) => (
                <div
                  key={r.id}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={r.name ?? ""}
                      onChange={(e) =>
                        setRules((rs) =>
                          rs.map((x) =>
                            x.id === r.id ? { ...x, name: e.target.value } : x,
                          ),
                        )
                      }
                      onBlur={(e) =>
                        patchRule(r.id, { name: e.target.value.trim() || null })
                      }
                      placeholder={t("autopilot.object_name_ph")}
                      className="flex-1 bg-transparent text-sm font-medium focus:outline-none border-b border-transparent focus:border-zinc-300 dark:focus:border-zinc-700"
                    />
                    <Toggle
                      on={r.enabled}
                      onChange={(v) => patchRule(r.id, { enabled: v })}
                      label=""
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                    <label className="inline-flex items-center gap-2">
                      <span className="text-zinc-500">
                        {t("autopilot.object_time")}
                      </span>
                      <select
                        value={r.post_hour}
                        onChange={(e) =>
                          patchRule(r.id, { post_hour: Number(e.target.value) })
                        }
                        className={SELECT}
                      >
                        {HOURS.map((h) => (
                          <option key={h} value={h}>
                            {String(h).padStart(2, "0")}:00
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <span className="text-zinc-500">
                        {t("autopilot.object_topic")}
                      </span>
                      <select
                        value={r.topic_id ?? ""}
                        onChange={(e) =>
                          patchRule(r.id, {
                            topic_id:
                              e.target.value === ""
                                ? null
                                : Number(e.target.value),
                          })
                        }
                        className={SELECT}
                      >
                        <option value="">{t("autopilot.any_topic")}</option>
                        {topics.map((tp) => (
                          <option key={tp.id} value={tp.id}>
                            {tp.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
                    <Toggle
                      on={r.auto_reply}
                      onChange={(v) => patchRule(r.id, { auto_reply: v })}
                      label={t("autopilot.object_autoreply")}
                    />
                    {r.auto_reply && (
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm pl-11">
                        <label className="inline-flex items-center gap-2">
                          <span className="text-zinc-500">
                            {t("autopilot.reply_audience")}
                          </span>
                          <select
                            value={r.reply_audience}
                            onChange={(e) =>
                              patchRule(r.id, { reply_audience: e.target.value })
                            }
                            className={SELECT}
                          >
                            <option value="fans">
                              {t("autopilot.audience_fans")}
                            </option>
                            <option value="all_except_trolls">
                              {t("autopilot.audience_all_except_trolls")}
                            </option>
                            <option value="questions">
                              {t("autopilot.audience_questions")}
                            </option>
                          </select>
                        </label>
                        <label className="inline-flex items-center gap-2">
                          <span className="text-zinc-500">
                            {t("autopilot.replies_per_day")}
                          </span>
                          <select
                            value={r.replies_per_day}
                            onChange={(e) =>
                              patchRule(r.id, {
                                replies_per_day: Number(e.target.value),
                              })
                            }
                            className={SELECT}
                          >
                            {[1, 3, 5, 10].map((n) => (
                              <option key={n} value={n}>
                                {n}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end pt-1">
                    {confirmDelete === r.id ? (
                      <span className="inline-flex items-center gap-2 text-xs">
                        <span className="text-zinc-500">
                          {t("autopilot.confirm_delete_object")}
                        </span>
                        <button
                          onClick={() => onDelete(r.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-700 font-medium"
                        >
                          {t("autopilot.delete_object")}
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                        >
                          {t("common.cancel")}
                        </button>
                      </span>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(r.id)}
                        className="text-xs text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      >
                        {t("autopilot.delete_object")}
                      </button>
                    )}
                  </div>
                </div>
              ))}

              <button
                onClick={onAdd}
                className="inline-flex items-center px-4 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 text-sm font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                {t("autopilot.add_object")}
              </button>
            </section>

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
