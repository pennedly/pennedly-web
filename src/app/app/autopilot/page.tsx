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
  fetchAutopilot,
  fetchAutopostActivity,
  fetchAutopostRules,
  getTokens,
  setAutopilotMaster,
  updateAutopilot,
  updateAutopostRule,
} from "@/lib/api";
import { captureEvent } from "@/lib/analytics";
import { useSelectedAccountId } from "@/lib/account";
import { useTranslation } from "@/lib/i18n";
import { useTesterGuard } from "@/lib/tester";
import {
  localHourToUtc,
  localUtcOffsetLabel,
  utcHourToLocal,
} from "@/lib/timezone";
import type {
  AutopilotConfig,
  AutopostActivity,
  AutopostRule,
  TopicOption,
} from "@/lib/types";

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
  "rounded-md border border-border bg-surface px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-700";

export default function AutopilotPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { checking } = useTesterGuard();
  const accountId = useSelectedAccountId();
  const [master, setMaster] = useState(false);
  // Account-level autopilot config — drives the auto-reply policy
  // (reply_enabled / reply_audience / replies_per_day) the worker's sweep
  // actually reads. Posting cadence lives in the per-object rules below.
  const [config, setConfig] = useState<AutopilotConfig | null>(null);
  const [rules, setRules] = useState<AutopostRule[]>([]);
  const [topics, setTopics] = useState<TopicOption[]>([]);
  const [activity, setActivity] = useState<AutopostActivity | null>(null);
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
        const [data, cfg] = await Promise.all([
          fetchAutopostRules(accountId),
          fetchAutopilot(accountId),
        ]);
        setMaster(data.master_enabled);
        setConfig(cfg);
        setRules(data.rules);
        setTopics(data.topics);
        // Activity is secondary — never let it block the editor.
        fetchAutopostActivity(accountId).then(setActivity).catch(() => {});
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
    // Keep the local config's `enabled` in sync so a later reply-policy PUT
    // (which sends the whole config) can't revert the master.
    setConfig((c) => (c ? { ...c, enabled: v } : c));
    captureEvent("ui.autopilot_master", { account_id: accountId, enabled: v });
    try {
      await setAutopilotMaster(accountId, v);
    } catch (e) {
      setMaster(!v);
      setConfig((c) => (c ? { ...c, enabled: !v } : c));
      toast(String(e), "error");
    }
  }

  // Account-level auto-reply policy. PUT sends the whole AutopilotConfig, so
  // we merge the patch onto the current config and round-trip the rest
  // (posting fields) unchanged.
  async function onReply(patch: Partial<AutopilotConfig>) {
    if (accountId === null || config === null) return;
    const prev = config;
    const next = { ...config, ...patch };
    setConfig(next);
    captureEvent("ui.autopilot_reply_policy", {
      account_id: accountId,
      ...patch,
    });
    try {
      await updateAutopilot(accountId, next);
    } catch (e) {
      setConfig(prev);
      toast(String(e), "error");
    }
  }

  async function onAdd() {
    if (accountId === null) return;
    captureEvent("ui.autopilot_add_object", { account_id: accountId });
    try {
      const rule = await createAutopostRule(accountId, {
        post_hour: localHourToUtc(9),
      });
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
    <div className="min-h-screen bg-bg text-text">
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
            <section className="rounded-xl border border-border bg-surface p-5 shadow-sm">
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
                <div className="rounded-xl border border-dashed border-border p-6 text-center">
                  <p className="text-sm text-zinc-500">
                    {t("autopilot.no_objects")}
                  </p>
                </div>
              )}

              {rules.map((r) => (
                <div
                  key={r.id}
                  className="rounded-xl border border-border bg-surface p-4 shadow-sm space-y-3"
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
                        {t("autopilot.object_time")} ({localUtcOffsetLabel()})
                      </span>
                      <select
                        value={utcHourToLocal(r.post_hour)}
                        onChange={(e) =>
                          patchRule(r.id, {
                            post_hour: localHourToUtc(Number(e.target.value)),
                          })
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
                    <label
                      className="inline-flex items-center gap-2"
                      title="random spread around the post time (0 = exact)"
                    >
                      <span className="text-zinc-500">±</span>
                      <select
                        value={r.jitter_minutes}
                        onChange={(e) =>
                          patchRule(r.id, {
                            jitter_minutes: Number(e.target.value),
                          })
                        }
                        className={SELECT}
                      >
                        {[0, 5, 10, 15, 30, 45, 60].map((m) => (
                          <option key={m} value={m}>
                            {m === 0 ? "0" : `${m} min`}
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

                  <div className="pt-3 border-t border-border space-y-1.5">
                    <Toggle
                      on={r.auto_reply}
                      onChange={(v) => patchRule(r.id, { auto_reply: v })}
                      label={t("autopilot.object_autoreply")}
                    />
                    <p className="pl-11 text-xs text-zinc-500">
                      {t("autopilot.object_autoreply_hint")}
                    </p>
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
                className="inline-flex items-center px-4 py-2 rounded-md border border-border text-sm font-medium text-text hover:bg-surface-2 transition-colors"
              >
                {t("autopilot.add_object")}
              </button>
            </section>

            {/* Auto-reply policy (account-level) — what the worker's reply
                sweep actually reads: on/off + audience + daily cap. */}
            {config && (
              <section className="space-y-3">
                <div>
                  <h2 className="text-base font-semibold">
                    {t("autopilot.replies_title")}
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {t("autopilot.replies_subtitle")}
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-surface p-4 shadow-sm space-y-3">
                  <Toggle
                    on={config.reply_enabled}
                    onChange={(v) => onReply({ reply_enabled: v })}
                    label={t("autopilot.reply_enabled")}
                  />
                  {config.reply_enabled && (
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm pl-11">
                      <label className="inline-flex items-center gap-2">
                        <span className="text-zinc-500">
                          {t("autopilot.reply_audience")}
                        </span>
                        <select
                          value={config.reply_audience}
                          onChange={(e) =>
                            onReply({ reply_audience: e.target.value })
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
                          value={config.replies_per_day}
                          onChange={(e) =>
                            onReply({ replies_per_day: Number(e.target.value) })
                          }
                          className={SELECT}
                        >
                          {[1, 3, 5, 10, 20].map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  )}
                  <p className="text-xs text-zinc-500">
                    {t("autopilot.replies_policy_hint")}
                  </p>
                </div>
              </section>
            )}

            {/* Activity — what autopilot actually did (read-only) */}
            {activity && (rules.length > 0 || activity.replies.length > 0) && (
              <section className="space-y-3">
                <h2 className="text-base font-semibold">
                  {t("autopilot.activity_title")}
                </h2>
                {activity.posts.length === 0 &&
                activity.replies.length === 0 &&
                !activity.rules.some(
                  (r) => r.last_post_at || r.last_reply_at,
                ) ? (
                  <div className="rounded-xl border border-dashed border-border p-6 text-center">
                    <p className="text-sm text-zinc-500">
                      {t("autopilot.activity_empty")}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="rounded-xl border border-border bg-surface p-4 shadow-sm space-y-1.5">
                      {activity.rules.map((r) => (
                        <div
                          key={r.id}
                          className="flex flex-wrap items-center gap-x-3 text-sm"
                        >
                          <span className="font-medium">
                            {r.name || `#${r.id}`}
                          </span>
                          <span className="text-xs text-zinc-500">
                            {t("autopilot.activity_today")}: {r.posts_today}{" "}
                            {t("autopilot.activity_posts")} · {r.replies_today}{" "}
                            {t("autopilot.activity_replies")}
                          </span>
                          {r.last_post_at && (
                            <span className="text-xs text-zinc-400">
                              · {t("autopilot.activity_last_post")}{" "}
                              {fmtDate(r.last_post_at)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                    {activity.posts.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs text-zinc-500">
                          {t("autopilot.activity_recent")}
                        </p>
                        {activity.posts.map((p) => (
                          <div
                            key={p.post_id}
                            className="rounded-lg border border-border bg-surface p-3"
                          >
                            <div className="flex items-center justify-between gap-2 text-xs text-zinc-500 mb-1">
                              <span className="truncate">
                                {p.rule_name ? `${p.rule_name} · ` : ""}
                                {fmtDate(p.published_at)}
                              </span>
                              {p.threads_url && (
                                <a
                                  href={p.threads_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="shrink-0 hover:underline"
                                >
                                  ↗
                                </a>
                              )}
                            </div>
                            <p className="text-sm text-text line-clamp-2 whitespace-pre-wrap">
                              {p.text}
                            </p>
                            <p className="text-xs text-zinc-400 mt-1">
                              {p.views ?? 0} · {p.likes ?? 0} ♥ ·{" "}
                              {p.comments ?? 0} 💬
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                    {activity.replies.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs text-zinc-500">
                          {t("autopilot.activity_replies_recent")}
                        </p>
                        {activity.replies.map((rep) => (
                          <div
                            key={rep.comment_id}
                            className="rounded-lg border border-border bg-surface p-3"
                          >
                            <div className="flex items-center justify-between gap-2 text-xs text-zinc-500 mb-1">
                              <span className="truncate">
                                {t("autopilot.activity_reply_to")} @
                                {rep.author_username ?? "—"}
                                {rep.replied_at
                                  ? ` · ${fmtDate(rep.replied_at)}`
                                  : ""}
                              </span>
                              {rep.post_threads_url && (
                                <a
                                  href={rep.post_threads_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="shrink-0 hover:underline"
                                >
                                  ↗
                                </a>
                              )}
                            </div>
                            {rep.comment_text && (
                              <p className="mb-1 line-clamp-1 text-xs italic text-zinc-500">
                                {rep.comment_text}
                              </p>
                            )}
                            <p className="text-sm text-text line-clamp-2 whitespace-pre-wrap">
                              {rep.reply_text}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </section>
            )}

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

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString();
}
