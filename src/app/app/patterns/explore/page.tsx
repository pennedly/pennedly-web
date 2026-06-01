"use client";

// Pattern Explorer (the "paste admired text" flow) — paste the TEXT of posts
// you admire, get back the reusable techniques. Hard stance, surfaced in the
// UI: paste text, not links/profiles. Pennedly never opens links or reads
// other accounts. The backend rejects URLs/handles too (defense in depth).
//
// Each returned pattern has a "suggested_do_rule" the user can fold into their
// own role_book do_list in one click (reuses the apply-fix add_item path).
//
// NOTE: this is the original Patterns flow, parked here while the main
// /app/patterns screen hosts the redesigned "study your own posts" feature.
// Its own redesign is a later pass — kept as-is for now (not deleted).

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  ApiError,
  analyzePatterns,
  applyLintFix,
  clearTokens,
  getTokens,
} from "@/lib/api";
import { captureEvent } from "@/lib/analytics";
import { useSelectedAccountId } from "@/lib/account";
import { useTranslation } from "@/lib/i18n";
import type { Pattern, PatternStudyResult } from "@/lib/types";

type Toast = { id: number; message: string; tone: "success" | "error" };

// Mirror the backend's reject rules so we warn before a round-trip.
const URL_OR_HANDLE =
  /^\s*(https?:\/\/\S+|@[\w.]+)\s*$|https?:\/\/(www\.)?(threads\.net|instagram\.com|x\.com|twitter\.com)\//i;

function splitSamples(raw: string): string[] {
  // Blank line separates posts. Trim + drop empties.
  return raw
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function PatternsExplorePage() {
  const router = useRouter();
  const { t } = useTranslation();
  const accountId = useSelectedAccountId();

  const [raw, setRaw] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<PatternStudyResult | null>(null);
  const [addedRules, setAddedRules] = useState<Set<string>>(new Set());
  const [addingRule, setAddingRule] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  function toast(message: string, tone: Toast["tone"] = "success") {
    const id = Date.now() + Math.random();
    setToasts((s) => [...s, { id, message, tone }]);
    setTimeout(() => setToasts((s) => s.filter((x) => x.id !== id)), 4000);
  }

  useEffect(() => {
    if (!getTokens()) router.push("/app/login");
  }, [router]);

  const samples = useMemo(() => splitSamples(raw), [raw]);
  const looksLikeLink = useMemo(
    () => samples.some((s) => URL_OR_HANDLE.test(s)),
    [samples],
  );

  async function onAnalyze() {
    if (accountId === null) return;
    if (samples.length === 0) {
      toast(t("patterns.empty_warning"), "error");
      return;
    }
    if (looksLikeLink) {
      toast(t("patterns.link_warning"), "error");
      return;
    }
    setAnalyzing(true);
    setResult(null);
    setAddedRules(new Set());
    captureEvent("ui.patterns_analyze_clicked", {
      account_id: accountId,
      sample_count: samples.length,
    });
    try {
      const res = await analyzePatterns(accountId, samples);
      setResult(res);
    } catch (e) {
      let msg = String(e);
      if (e instanceof ApiError) {
        const d = e.detail as { detail?: { message?: string } } | undefined;
        const inner =
          d?.detail && typeof d.detail === "object"
            ? d.detail.message
            : undefined;
        msg = inner ?? `${e.status}`;
      }
      toast(msg, "error");
    } finally {
      setAnalyzing(false);
    }
  }

  async function onAddToVoice(p: Pattern) {
    if (accountId === null || !p.suggested_do_rule) return;
    setAddingRule(p.suggested_do_rule);
    captureEvent("ui.pattern_added_to_voice", { account_id: accountId });
    try {
      await applyLintFix(accountId, {
        kind: "add_item",
        section: "do_list",
        text: p.suggested_do_rule,
      });
      setAddedRules((s) => new Set(s).add(p.suggested_do_rule));
      toast(t("patterns.added"));
    } catch (e) {
      toast(String(e), "error");
    } finally {
      setAddingRule(null);
    }
  }

  return (
    <div className="min-h-screen bg-bg text-text">
      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("patterns.title")}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">{t("patterns.subtitle")}</p>
        </div>

        {/* The hard "text not links" disclaimer — deliberately prominent. */}
        <div className="rounded-xl border border-amber-300 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/30 p-4">
          <div className="text-sm font-semibold text-amber-900 dark:text-amber-200">
            {t("patterns.disclaimer_title")}
          </div>
          <p className="text-xs text-amber-800 dark:text-amber-300 mt-1 leading-relaxed">
            {t("patterns.disclaimer_body")}
          </p>
        </div>

        <section className="rounded-xl border border-border bg-surface p-5 shadow-sm space-y-3">
          <textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            rows={10}
            placeholder={t("patterns.input_placeholder")}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-700"
          />
          {looksLikeLink && (
            <p className="text-xs text-red-600 dark:text-red-400">
              {t("patterns.link_warning")}
            </p>
          )}
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-zinc-500">
              {samples.length}{" "}
              {samples.length === 1
                ? t("dashboard.feed.draft_singular")
                : t("dashboard.feed.draft_plural")}
            </span>
            <button
              onClick={onAnalyze}
              disabled={analyzing || samples.length === 0 || looksLikeLink}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {analyzing && (
                <span
                  className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"
                  aria-hidden
                />
              )}
              {analyzing ? t("patterns.analyzing") : t("patterns.analyze")}
            </button>
          </div>
        </section>

        {result && (
          <section className="space-y-3">
            {result.summary && (
              <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
                <div className="text-[10px] uppercase tracking-wide text-zinc-500 mb-1">
                  {t("patterns.summary_label")}
                </div>
                <p className="text-sm leading-relaxed text-text">
                  {result.summary}
                </p>
              </div>
            )}

            {result.patterns.map((p, i) => {
              const added = addedRules.has(p.suggested_do_rule);
              return (
                <article
                  key={i}
                  className="rounded-xl border border-border bg-surface p-5 shadow-sm space-y-3"
                >
                  <h3 className="text-base font-semibold leading-tight">
                    {p.name}
                  </h3>
                  <p className="text-sm leading-relaxed text-text">
                    {p.technique}
                  </p>
                  {p.why_it_works && (
                    <p className="text-xs text-zinc-500">
                      <span className="uppercase tracking-wide">
                        {t("patterns.why_label")}
                      </span>
                      {" · "}
                      {p.why_it_works}
                    </p>
                  )}
                  {p.example && (
                    <div className="rounded-md border border-border bg-bg px-3 py-2">
                      <div className="text-[10px] uppercase tracking-wide text-zinc-500 mb-0.5">
                        {t("patterns.example_label")}
                      </div>
                      <div className="text-sm text-text italic">
                        {p.example}
                      </div>
                    </div>
                  )}
                  {p.suggested_do_rule && (
                    <div className="flex items-center gap-3 flex-wrap pt-1">
                      <button
                        onClick={() => onAddToVoice(p)}
                        disabled={added || addingRule === p.suggested_do_rule}
                        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-border text-text hover:bg-surface-2 disabled:opacity-50 transition-colors"
                      >
                        {addingRule === p.suggested_do_rule && (
                          <span
                            className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"
                            aria-hidden
                          />
                        )}
                        {added ? `✓ ${t("patterns.added")}` : t("patterns.add_to_voice")}
                      </button>
                      <span className="text-xs text-zinc-500 font-mono">
                        {p.suggested_do_rule}
                      </span>
                    </div>
                  )}
                </article>
              );
            })}

            <p className="text-xs text-zinc-400 text-right">
              {result.samples_analyzed} analyzed · {result.latency_ms}ms ·{" "}
              {result.llm_model}
            </p>
          </section>
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
