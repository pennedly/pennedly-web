"use client";

// Role-book editor — the surface where the user controls voice + topic
// filters. Each section gets a proper tag-pill input (themes_exclude
// in red so it visually communicates "the AI will not write about this"),
// a TranslateButton for users running accounts in a non-native language,
// and the assembled prompt is shown collapsed at the bottom for
// transparency about what the LLM actually sees.

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  ApiError,
  applyLintFix,
  clearTokens,
  extractVoice,
  fetchRoleBook,
  getTokens,
  lintRoleBook,
  patchRoleBook,
  translateText,
} from "@/lib/api";
import { captureEvent } from "@/lib/analytics";
import { useSelectedAccountId } from "@/lib/account";
import { useTranslation, type MessageKey } from "@/lib/i18n";
import { LintResults } from "@/components/LintResults";
import { TagInput } from "@/components/TagInput";
import { TranslateButton } from "@/components/TranslateButton";
import type {
  LintFix,
  LintResult,
  RoleBook,
  RoleBookSections,
} from "@/lib/types";

type SectionKey = keyof Omit<RoleBookSections, "intro">;

// Per-section i18n keys + visual variant. Resolved to actual strings
// at render time via the t() hook so locale switches re-render the
// labels without rebuilding this table.
const LIST_SECTIONS: {
  key: SectionKey;
  labelKey: MessageKey;
  helperKey: MessageKey;
  placeholderKey: MessageKey;
  variant?: "default" | "danger";
}[] = [
  {
    key: "themes_exclude",
    labelKey: "rolebook.themes_exclude.label",
    helperKey: "rolebook.themes_exclude.helper",
    placeholderKey: "rolebook.themes_exclude.placeholder",
    variant: "danger",
  },
  {
    key: "themes_include",
    labelKey: "rolebook.themes_include.label",
    helperKey: "rolebook.themes_include.helper",
    placeholderKey: "rolebook.themes_include.placeholder",
  },
  {
    key: "voice_characteristics",
    labelKey: "rolebook.voice_characteristics.label",
    helperKey: "rolebook.voice_characteristics.helper",
    placeholderKey: "rolebook.voice_characteristics.placeholder",
  },
  {
    key: "do_list",
    labelKey: "rolebook.do_list.label",
    helperKey: "rolebook.do_list.helper",
    placeholderKey: "rolebook.do_list.placeholder",
  },
  {
    key: "dont_list",
    labelKey: "rolebook.dont_list.label",
    helperKey: "rolebook.dont_list.helper",
    placeholderKey: "rolebook.dont_list.placeholder",
  },
  {
    key: "examples",
    labelKey: "rolebook.examples.label",
    helperKey: "rolebook.examples.helper",
    placeholderKey: "rolebook.examples.placeholder",
  },
];

type Toast = { id: number; message: string; tone: "success" | "error" };

// Run an async fn over items with at most `limit` in flight at once. A
// voice book can hold a couple dozen items; each is its own translate
// request, and we don't want to fire all of them at the API at once on
// first open.
async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => worker()),
  );
  return results;
}

export default function RoleBookEditor() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const accountId = useSelectedAccountId();
  const [book, setBook] = useState<RoleBook | null>(null);
  const [draft, setDraft] = useState<RoleBookSections>({});
  const [bootError, setBootError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [linting, setLinting] = useState(false);
  const [lintResult, setLintResult] = useState<LintResult | null>(null);
  const [applyingFixIdx, setApplyingFixIdx] = useState<number | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [extractOpen, setExtractOpen] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  // Two-mode voice view. By default we show everything translated into
  // the user's UI language (read-only); "view original" flips to the
  // editable source. Translation is a disposable reading layer — the
  // stored original is always what generation uses, so untranslatable
  // words in the source are never a problem.
  const [view, setView] = useState<"translated" | "original">("translated");
  const [translating, setTranslating] = useState(false);
  // Map of original source text → its translation. We translate each
  // item (and the intro) individually, so the translated view maps 1:1
  // back onto the same pills — no fragile newline-splitting of a joined
  // block (an LLM reflows lists, inserts blank lines, etc.). An item the
  // model leaves untranslated simply falls back to its original.
  const [translations, setTranslations] = useState<Record<
    string,
    string
  > | null>(null);
  const [translateError, setTranslateError] = useState<string | null>(null);

  function toast(message: string, tone: Toast["tone"] = "success") {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }

  useEffect(() => {
    if (!getTokens()) {
      router.push("/app/login");
      return;
    }
  }, [router]);

  // Reload role_book whenever selected account changes (mount, switch).
  useEffect(() => {
    if (accountId === null) return;
    setBook(null);
    setLintResult(null);
    (async () => {
      try {
        const rb = await fetchRoleBook(accountId);
        setBook(rb);
        setDraft({ ...(rb.sections ?? {}) });
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

  // Translate the voice into the UI language whenever we're in the
  // translated view, the locale changes, or the draft changes. Same-
  // language text comes back verbatim, so users whose content matches
  // their UI see no change. The `cancelled` flag drops stale responses
  // on fast toggles.
  const draftKey = JSON.stringify(draft);
  useEffect(() => {
    if (view !== "translated") return;
    // Collect every distinct text to translate — the intro plus each
    // individual item across all sections. Per-item (not per-section)
    // so each result maps straight back onto its own pill.
    const texts = new Set<string>();
    if ((draft.intro ?? "").trim()) texts.add(draft.intro!);
    for (const section of LIST_SECTIONS) {
      for (const item of (draft[section.key] as string[] | undefined) ?? []) {
        if (item.trim()) texts.add(item);
      }
    }
    const list = [...texts];
    if (list.length === 0) {
      setTranslations({});
      setTranslateError(null);
      return;
    }
    let cancelled = false;
    setTranslating(true);
    setTranslateError(null);
    (async () => {
      try {
        const entries = await mapLimit(list, 6, async (text) => {
          const r = await translateText(text, locale);
          return [text, r.translated_text] as const;
        });
        if (cancelled) return;
        setTranslations(Object.fromEntries(entries));
      } catch (e) {
        if (!cancelled) setTranslateError(String(e));
      } finally {
        if (!cancelled) setTranslating(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, locale, draftKey]);

  // Any edit invalidates the previous lint — the flagged items might
  // already be fixed or replaced by new conflicts. Clear so the
  // inline pill markers don't lie about a stale snapshot.
  function updateList(key: SectionKey, items: string[]) {
    setDraft((d) => ({ ...d, [key]: items }));
    setLintResult(null);
  }

  function updateIntro(text: string) {
    setDraft((d) => ({ ...d, intro: text }));
    setLintResult(null);
  }

  // Build a per-section set of pill texts that the lint flagged, for
  // inline ⚠ markers inside each TagInput.
  const flaggedBySection: Partial<Record<SectionKey, Set<string>>> = {};
  if (lintResult) {
    for (const conflict of lintResult.conflicts) {
      for (const item of conflict.items) {
        const sec = item.section as SectionKey;
        if (!flaggedBySection[sec]) flaggedBySection[sec] = new Set();
        flaggedBySection[sec]!.add(item.text);
      }
    }
  }

  // Scroll to the lint results card and (briefly) highlight any
  // conflict that mentions the clicked pill text. Cheap and effective:
  // we don't need a tooltip system, just bring the relevant card into
  // view.
  function onFlaggedPillClick(text: string) {
    const card = document.getElementById("lint-results-card");
    if (card) card.scrollIntoView({ behavior: "smooth", block: "center" });
    captureEvent("ui.flagged_pill_clicked", { text });
  }

  async function onExtractConfirm() {
    if (accountId === null) return;
    setExtracting(true);
    captureEvent("ui.voice_reextract_confirmed", { account_id: accountId });
    try {
      const rb = await extractVoice(accountId);
      setBook(rb);
      setDraft({ ...(rb.sections ?? {}) });
      setLintResult(null);
      setExtractOpen(false);
      toast(t("rolebook.extract.toast_done"));
    } catch (e) {
      let msg = String(e);
      if (e instanceof ApiError) {
        const detail =
          typeof e.detail === "object" &&
          e.detail !== null &&
          "detail" in (e.detail as Record<string, unknown>)
            ? (e.detail as { detail: unknown }).detail
            : e.detail;
        msg = `${e.status}: ${String(detail)}`;
      }
      toast(msg, "error");
    } finally {
      setExtracting(false);
    }
  }

  async function onApplyLintFix(fix: LintFix, conflictIdx: number) {
    if (accountId === null) return;
    setApplyingFixIdx(conflictIdx);
    setApplyError(null);
    captureEvent("ui.lint_fix_applied", {
      account_id: accountId,
      fix_kind: fix.kind,
    });
    try {
      const rb = await applyLintFix(accountId, fix);
      setBook(rb);
      setDraft({ ...(rb.sections ?? {}) });
      // Re-lint immediately on the newly-saved version so the user
      // can see whether the fix actually resolved everything (or
      // introduced a new conflict).
      setLintResult(null);
      try {
        const fresh = await lintRoleBook(accountId);
        setLintResult(fresh);
      } catch {
        // Don't fail the apply UX if re-lint hiccups.
      }
      toast(
        `${t("rolebook.lint.toast_fix_applied")} · ${fix.kind.replace(/_/g, " ")}`,
      );
    } catch (e) {
      let msg = String(e);
      if (e instanceof ApiError) {
        const detail =
          typeof e.detail === "object" &&
          e.detail !== null &&
          "detail" in (e.detail as Record<string, unknown>)
            ? (e.detail as { detail: unknown }).detail
            : e.detail;
        msg = `${e.status}: ${String(detail)}`;
      }
      setApplyError(msg);
      toast(msg, "error");
    } finally {
      setApplyingFixIdx(null);
    }
  }

  async function onSave() {
    if (accountId === null) return;
    setSaving(true);
    captureEvent("ui.role_book_save_clicked", {
      account_id: accountId,
      fields_changed: Object.keys(draft),
      themes_exclude_count: draft.themes_exclude?.length ?? 0,
      themes_include_count: draft.themes_include?.length ?? 0,
    });

    // Fire PATCH and lint in parallel — saving shouldn't be blocked
    // by lint latency, but the user always wants to know if the
    // version they just saved has internal contradictions.
    const savePromise = patchRoleBook(accountId, draft);
    const lintPromise = lintRoleBook(accountId, draft).catch(
      (e: unknown) => {
        // Lint failure shouldn't fail save UX. Log + continue.
        console.warn("lint failed during save", e);
        return null;
      },
    );

    try {
      const rb = await savePromise;
      setBook(rb);
      setDraft({ ...(rb.sections ?? {}) });

      // Await lint after save so the toast can describe the lint state.
      const result = await lintPromise;
      if (result === null) {
        // Lint network error — save still succeeded.
        setLintResult(null);
        toast(t("rolebook.save.toast_saved_check_unavailable"));
      } else {
        setLintResult(result);
        const high = result.conflicts.filter(
          (c) => c.severity === "high",
        ).length;
        if (result.conflicts.length === 0) {
          toast(t("rolebook.save.toast_saved_clean"));
        } else if (high > 0) {
          toast(`⚠ ${high}`, "error");
        } else {
          toast(`${result.conflicts.length}`);
        }
      }
    } catch (e) {
      toast(String(e), "error");
    } finally {
      setSaving(false);
    }
  }

  async function onLint() {
    if (accountId === null) return;
    setLinting(true);
    captureEvent("ui.role_book_lint_clicked", { account_id: accountId });
    try {
      const result = await lintRoleBook(accountId, draft);
      setLintResult(result);
      const high = result.conflicts.filter((c) => c.severity === "high").length;
      if (result.conflicts.length === 0) {
        toast(t("rolebook.lint.no_conflicts"));
      } else if (high > 0) {
        toast(
          `${result.conflicts.length} · ${high} ${t("rolebook.lint.severity_high")}`,
          "error",
        );
      } else {
        toast(
          `${result.conflicts.length} · ${t("rolebook.lint.toast_review_below")}`,
        );
      }
    } catch (e) {
      toast(String(e), "error");
    } finally {
      setLinting(false);
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

  if (!book) {
    return (
      <main className="max-w-2xl mx-auto px-6 py-16 text-sm text-zinc-500">
        {t("common.loading")}
      </main>
    );
  }

  // Translated mode shows the exact same editor UI, but fed translated
  // values and read-only. Sections are translated as one newline-joined
  // block; we split it back into pills. If a translation isn't ready yet
  // — or the line count doesn't match (rare LLM hiccup) — fall back to
  // the original items so the UI never breaks or shows a wrong count.
  const isTranslated = view === "translated";
  const transMap = translations ?? {};
  const displayIntro = isTranslated
    ? draft.intro
      ? transMap[draft.intro] ?? draft.intro
      : ""
    : draft.intro ?? "";
  function displayItems(key: SectionKey): string[] {
    const original = (draft[key] as string[] | undefined) ?? [];
    if (!isTranslated) return original;
    // Each item shows its own translation, or itself if the model left
    // it untranslated / it hasn't loaded yet. 1:1, so counts never drift.
    return original.map((item) => transMap[item] ?? item);
  }

  return (
    <div className="min-h-screen bg-bg text-text">
      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("rolebook.title")}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">{t("rolebook.subtitle")}</p>
          {book && (
            <p className="text-xs text-zinc-400 mt-1 tabular-nums">
              {t("rolebook.version_label")}
              {book.role_book_id}
              {book.parent_id !== null && (
                <span className="ml-2">
                  · {t("rolebook.parent_label")}
                  {book.parent_id}
                </span>
              )}
            </p>
          )}
          <div className="mt-3">
            <button
              onClick={() =>
                setView((v) => (v === "translated" ? "original" : "translated"))
              }
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-border text-sm text-text hover:bg-surface-2 transition-colors"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              {view === "translated"
                ? t("common.view_original")
                : t("common.view_translation")}
            </button>
          </div>
          {isTranslated && translating && (
            <p className="mt-2 flex items-center gap-2 text-xs text-zinc-500">
              <span
                className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"
                aria-hidden
              />
              {t("common.translating")}
            </p>
          )}
          {isTranslated && translateError && (
            <p className="mt-2 text-xs text-red-600 dark:text-red-400">
              {translateError}
            </p>
          )}
        </div>

        {/* Intro */}
        <section className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <div className="flex items-baseline justify-between mb-2">
            <label className="text-sm font-semibold">
              {t("rolebook.intro.label")}
            </label>
            <span className="text-xs text-zinc-500">
              {t("rolebook.intro.helper")}
            </span>
          </div>
          <textarea
            value={displayIntro}
            onChange={(e) => updateIntro(e.target.value)}
            readOnly={isTranslated}
            rows={5}
            placeholder={t("rolebook.intro.placeholder")}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-700"
          />
        </section>

        {/* List sections */}
        {LIST_SECTIONS.map((section) => {
          const items = displayItems(section.key);
          const isDanger = section.variant === "danger";
          return (
            <section
              key={section.key}
              className={`rounded-xl border bg-surface p-5 shadow-sm ${
                isDanger
                  ? "border-red-200 dark:border-red-900/50"
                  : "border-border"
              }`}
            >
              <div className="flex items-baseline justify-between mb-1">
                <label
                  className={`text-sm font-semibold ${
                    isDanger ? "text-red-700 dark:text-red-400" : ""
                  }`}
                >
                  {t(section.labelKey)}
                </label>
                <span className="text-xs text-zinc-500">
                  {items.length}{" "}
                  {items.length === 1
                    ? t("rolebook.items_count_singular")
                    : t("rolebook.items_count_plural")}
                </span>
              </div>
              <p className="text-xs text-zinc-500 mb-3">{t(section.helperKey)}</p>
              <TagInput
                items={items}
                onChange={(next) => updateList(section.key, next)}
                placeholder={t(section.placeholderKey)}
                variant={section.variant}
                readOnly={isTranslated}
                flagged={
                  isTranslated ? undefined : flaggedBySection[section.key]
                }
                onFlaggedClick={onFlaggedPillClick}
              />
            </section>
          );
        })}

        {/* Lint results — appears when the user has run the check OR
            after every save (auto-lint). Pills with conflicts also get
            a ⚠ marker inline above — clicking it scrolls to this card. */}
        {!isTranslated && lintResult && (
          <section
            id="lint-results-card"
            className="rounded-xl border border-border bg-surface p-5 shadow-sm scroll-mt-24"
          >
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="text-sm font-semibold">
                {t("rolebook.lint.section_title")}
              </h2>
              <button
                onClick={() => setLintResult(null)}
                className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              >
                {t("common.hide")}
              </button>
            </div>
            <LintResults
              result={lintResult}
              onApplyFix={onApplyLintFix}
              applyingFixIdx={applyingFixIdx}
              applyError={applyError}
            />
          </section>
        )}

        {/* Save action bar */}
        <div className="sticky bottom-4 flex items-center justify-end gap-3 bg-white/95 dark:bg-zinc-950/95 backdrop-blur border border-border rounded-xl px-4 py-3 shadow-md">
          <span className="mr-auto text-xs text-zinc-500">
            {t("rolebook.save.helper")}
          </span>
          <button
            onClick={() => setExtractOpen(true)}
            disabled={extracting || saving || linting || isTranslated}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-border text-sm text-text hover:bg-surface-2 disabled:opacity-50 transition-colors"
          >
            {t("rolebook.extract.button")}
          </button>
          <button
            onClick={onLint}
            disabled={linting || saving || isTranslated}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-border text-sm text-text hover:bg-surface-2 disabled:opacity-50 transition-colors"
          >
            {linting && (
              <span
                className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"
                aria-hidden
              />
            )}
            {linting ? t("rolebook.lint.checking") : t("rolebook.lint.button")}
          </button>
          <Link
            href="/app"
            className="text-sm text-text-muted hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors px-3 py-1.5"
          >
            {t("common.cancel")}
          </Link>
          <button
            onClick={onSave}
            disabled={saving || isTranslated}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
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

        {/* Transparency: what the LLM actually sees */}
        <details className="rounded-xl border border-border bg-surface p-5">
          <summary className="cursor-pointer text-sm font-semibold">
            {t("rolebook.transparency.title")}
            <span className="ml-2 font-normal text-xs text-zinc-500">
              {t("rolebook.transparency.subtitle")}
            </span>
          </summary>
          <pre className="mt-3 whitespace-pre-wrap text-xs leading-relaxed text-text font-mono">
            {book.prompt_text}
          </pre>
          <div className="mt-3">
            <TranslateButton text={book.prompt_text} source="role_book_assembled" />
          </div>
        </details>
      </main>

      {/* Re-extract confirmation modal */}
      {extractOpen && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-2xl bg-surface border border-border shadow-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold tracking-tight">
              {t("rolebook.extract.confirm_title")}
            </h2>
            <p className="text-sm text-text-muted leading-relaxed">
              {t("rolebook.extract.confirm_body")}
            </p>
            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                onClick={() => setExtractOpen(false)}
                disabled={extracting}
                className="text-sm px-4 py-2 rounded-md text-text hover:bg-surface-2 disabled:opacity-50 transition-colors"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={onExtractConfirm}
                disabled={extracting}
                className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {extracting && (
                  <span
                    className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"
                    aria-hidden
                  />
                )}
                {extracting
                  ? t("rolebook.extract.extracting")
                  : t("rolebook.extract.confirm_cta")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div className="fixed bottom-6 right-6 z-30 space-y-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium pointer-events-auto ${
              t.tone === "error"
                ? "bg-red-600 text-white"
                : "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}
