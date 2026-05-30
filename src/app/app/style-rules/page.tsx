"use client";

// Style-rules screen — toggles for the built-in anti-AI-tell default
// rules. The catalog is code-level on the backend; this screen reads it
// per-account (with each rule's on/off state) from GET /style-rules and
// flips a rule via PUT /style-rules/{key}. Every rule is ON by default;
// turning one off writes a per-account opt-out row.
//
// Each toggle is optimistic: we flip the local state immediately, fire
// the PUT, and roll back if it fails. The `human_punctuation` rule gets
// an extra note because its toggle also controls the deterministic
// typographic cleanup (em dash / guillemets → ASCII), not just the
// prompt instruction.

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  ApiError,
  clearTokens,
  createUserRule,
  deleteUserRule,
  fetchStyleRules,
  fetchUserRules,
  getTokens,
  updateStyleRule,
  updateUserRule,
} from "@/lib/api";
import { captureEvent } from "@/lib/analytics";
import { useSelectedAccountId } from "@/lib/account";
import { useTranslation } from "@/lib/i18n";
import type { StyleRule, UserRule } from "@/lib/types";

// Mirrors generation/default_rules.PUNCTUATION_RULE_KEY — the one rule
// whose toggle also gates output_guard's typographic stripper.
const PUNCTUATION_RULE_KEY = "human_punctuation";

const SELECT_CLS =
  "rounded-md border border-border bg-surface px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-700";

type Toast = { id: number; message: string; tone: "success" | "error" };

export default function StyleRulesEditor() {
  const router = useRouter();
  const { t } = useTranslation();
  const accountId = useSelectedAccountId();
  const [rules, setRules] = useState<StyleRule[] | null>(null);
  const [userRules, setUserRules] = useState<UserRule[] | null>(null);
  const [newBody, setNewBody] = useState("");
  const [newKind, setNewKind] = useState("post");
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [bootError, setBootError] = useState<string | null>(null);
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [toasts, setToasts] = useState<Toast[]>([]);

  function toast(message: string, tone: Toast["tone"] = "success") {
    const id = Date.now() + Math.random();
    setToasts((ts) => [...ts, { id, message, tone }]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), 3500);
  }

  useEffect(() => {
    if (!getTokens()) {
      router.push("/app/login");
    }
  }, [router]);

  // Reload the catalog + per-account state whenever the selected account
  // changes (mount, switch).
  useEffect(() => {
    if (accountId === null) return;
    setRules(null);
    fetchUserRules(accountId)
      .then((r) => setUserRules(r.rules))
      .catch(() => setUserRules([]));
    (async () => {
      try {
        const list = await fetchStyleRules(accountId);
        setRules(list.rules);
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          clearTokens();
          router.push("/app/login");
          return;
        }
        setBootError(String(e));
      }
    })();
  }, [accountId, router]);

  async function onToggle(rule: StyleRule) {
    if (accountId === null) return;
    const next = !rule.enabled;

    // Optimistic flip — the switch should feel instant.
    setRules((rs) =>
      rs ? rs.map((r) => (r.key === rule.key ? { ...r, enabled: next } : r)) : rs,
    );
    setPending((p) => new Set(p).add(rule.key));
    captureEvent("ui.style_rule_toggled", {
      account_id: accountId,
      rule_key: rule.key,
      enabled: next,
    });

    try {
      const updated = await updateStyleRule(accountId, rule.key, next);
      // Trust the server's returned state (authoritative).
      setRules((rs) =>
        rs ? rs.map((r) => (r.key === rule.key ? updated : r)) : rs,
      );
      toast(
        updated.enabled
          ? t("style_rules.toast.enabled")
          : t("style_rules.toast.disabled"),
      );
    } catch (e) {
      // Roll back to the pre-toggle value.
      setRules((rs) =>
        rs
          ? rs.map((r) =>
              r.key === rule.key ? { ...r, enabled: rule.enabled } : r,
            )
          : rs,
      );
      if (e instanceof ApiError && e.status === 401) {
        clearTokens();
        router.push("/app/login");
        return;
      }
      toast(String(e), "error");
    } finally {
      setPending((p) => {
        const n = new Set(p);
        n.delete(rule.key);
        return n;
      });
    }
  }

  async function onAddRule() {
    if (accountId === null || !newBody.trim()) return;
    try {
      const r = await createUserRule(accountId, {
        kind: newKind,
        body: newBody.trim(),
      });
      setUserRules((rs) => [...(rs ?? []), r]);
      setNewBody("");
    } catch (e) {
      toast(String(e), "error");
    }
  }

  function editUserRuleLocal(id: number, patch: Partial<UserRule>) {
    setUserRules((rs) =>
      rs ? rs.map((r) => (r.id === id ? { ...r, ...patch } : r)) : rs,
    );
  }

  async function saveUserRule(id: number, patch: Partial<UserRule>) {
    editUserRuleLocal(id, patch);
    try {
      await updateUserRule(id, patch);
    } catch (e) {
      toast(String(e), "error");
    }
  }

  async function onDeleteRule(id: number) {
    try {
      await deleteUserRule(id);
      setUserRules((rs) => (rs ? rs.filter((r) => r.id !== id) : rs));
      setConfirmDelete(null);
    } catch (e) {
      toast(String(e), "error");
    }
  }

  if (bootError) {
    return (
      <main className="max-w-2xl mx-auto px-6 py-16">
        <div className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-950 p-4 text-sm text-red-800 dark:text-red-200">
          {bootError}
        </div>
      </main>
    );
  }

  if (!rules) {
    return (
      <main className="max-w-2xl mx-auto px-6 py-16 text-sm text-zinc-500">
        {t("common.loading")}
      </main>
    );
  }

  const onCount = rules.filter((r) => r.enabled).length;

  return (
    <div className="min-h-screen bg-bg text-text">
      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("style_rules.title")}
          </h1>
          <p className="text-sm text-zinc-500 mt-1 max-w-2xl">
            {t("style_rules.subtitle")}
          </p>
        </div>

        {/* Your own rules — freeform, layered on top of the defaults below */}
        <section className="space-y-3">
          <div>
            <h2 className="text-base font-semibold">{t("user_rules.title")}</h2>
            <p className="text-xs text-zinc-500 mt-0.5 max-w-2xl">
              {t("user_rules.subtitle")}
            </p>
          </div>

          {userRules?.map((r) => (
            <div
              key={r.id}
              className="rounded-xl border border-border bg-surface p-3 shadow-sm space-y-2"
            >
              <textarea
                value={r.body}
                onChange={(e) =>
                  editUserRuleLocal(r.id, { body: e.target.value })
                }
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v) updateUserRule(r.id, { body: v }).catch(() => {});
                }}
                rows={2}
                className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-700 resize-y"
              />
              <div className="flex items-center gap-3 flex-wrap text-sm">
                <select
                  value={r.kind}
                  onChange={(e) => saveUserRule(r.id, { kind: e.target.value })}
                  className={SELECT_CLS}
                >
                  <option value="post">{t("user_rules.kind_post")}</option>
                  <option value="reply">{t("user_rules.kind_reply")}</option>
                </select>
                <label className="inline-flex items-center gap-1.5 text-xs text-zinc-500">
                  <input
                    type="checkbox"
                    checked={r.enabled}
                    onChange={(e) =>
                      saveUserRule(r.id, { enabled: e.target.checked })
                    }
                  />
                  {r.enabled ? t("style_rules.on") : t("style_rules.off")}
                </label>
                <div className="ml-auto">
                  {confirmDelete === r.id ? (
                    <span className="inline-flex items-center gap-2 text-xs">
                      <span className="text-zinc-500">
                        {t("user_rules.confirm_delete")}
                      </span>
                      <button
                        onClick={() => onDeleteRule(r.id)}
                        className="text-red-600 dark:text-red-400 font-medium"
                      >
                        {t("user_rules.delete")}
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
                      {t("user_rules.delete")}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {userRules && userRules.length === 0 && (
            <p className="text-xs text-zinc-500">{t("user_rules.empty")}</p>
          )}

          <div className="rounded-xl border border-dashed border-border p-3 space-y-2">
            <textarea
              value={newBody}
              onChange={(e) => setNewBody(e.target.value)}
              rows={2}
              placeholder={t("user_rules.placeholder")}
              className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-700 resize-y"
            />
            <div className="flex items-center gap-3">
              <select
                value={newKind}
                onChange={(e) => setNewKind(e.target.value)}
                className={SELECT_CLS}
              >
                <option value="post">{t("user_rules.kind_post")}</option>
                <option value="reply">{t("user_rules.kind_reply")}</option>
              </select>
              <button
                onClick={onAddRule}
                disabled={!newBody.trim()}
                className="inline-flex items-center px-3 py-1.5 rounded-md border border-border text-sm font-medium text-text hover:bg-surface-2 disabled:opacity-50 transition-colors"
              >
                {t("user_rules.add")}
              </button>
            </div>
          </div>
        </section>

        <h2 className="text-base font-semibold pt-2">
          {t("style_rules.defaults_title")}
        </h2>

        <ul className="space-y-3">
          {rules.map((rule) => {
            const busy = pending.has(rule.key);
            return (
              <li
                key={rule.key}
                className="rounded-xl border border-border bg-surface p-4 shadow-sm flex items-start justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold">{rule.title}</span>
                    {rule.kind !== "both" && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                        {rule.kind === "post"
                          ? t("style_rules.kind.post")
                          : t("style_rules.kind.reply")}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 mt-1 leading-relaxed whitespace-pre-wrap">
                    {rule.body}
                  </p>
                  {rule.key === PUNCTUATION_RULE_KEY && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5 leading-relaxed">
                      {t("style_rules.punctuation_note")}
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-center gap-1 shrink-0">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={rule.enabled}
                    aria-label={rule.title}
                    onClick={() => onToggle(rule)}
                    disabled={busy}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-400 dark:focus:ring-offset-zinc-900 ${
                      rule.enabled
                        ? "bg-green-600"
                        : "bg-zinc-300 dark:bg-zinc-700"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        rule.enabled ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                  <span className="text-[10px] uppercase tracking-wide text-zinc-400">
                    {rule.enabled ? t("style_rules.on") : t("style_rules.off")}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </main>

      {/* Toasts */}
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
