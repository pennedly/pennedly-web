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
  fetchStyleRules,
  getTokens,
  updateStyleRule,
} from "@/lib/api";
import { captureEvent } from "@/lib/analytics";
import { useSelectedAccountId } from "@/lib/account";
import { useTranslation } from "@/lib/i18n";
import type { StyleRule } from "@/lib/types";

// Mirrors generation/default_rules.PUNCTUATION_RULE_KEY — the one rule
// whose toggle also gates output_guard's typographic stripper.
const PUNCTUATION_RULE_KEY = "human_punctuation";

type Toast = { id: number; message: string; tone: "success" | "error" };

export default function StyleRulesEditor() {
  const router = useRouter();
  const { t } = useTranslation();
  const accountId = useSelectedAccountId();
  const [rules, setRules] = useState<StyleRule[] | null>(null);
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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("style_rules.title")}
          </h1>
          <p className="text-sm text-zinc-500 mt-1 max-w-2xl">
            {t("style_rules.subtitle")}
          </p>
        </div>

        <ul className="space-y-3">
          {rules.map((rule) => {
            const busy = pending.has(rule.key);
            return (
              <li
                key={rule.key}
                className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm flex items-start justify-between gap-4"
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
