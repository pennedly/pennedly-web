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
  clearTokens,
  fetchRoleBook,
  getTokens,
  lintRoleBook,
  patchRoleBook,
} from "@/lib/api";
import { captureEvent } from "@/lib/analytics";
import { useSelectedAccountId } from "@/lib/account";
import { useTranslation, type MessageKey } from "@/lib/i18n";
import { AccountSwitcher } from "@/components/AccountSwitcher";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { LintResults } from "@/components/LintResults";
import { TagInput } from "@/components/TagInput";
import { TranslateButton } from "@/components/TranslateButton";
import type { LintResult, RoleBook, RoleBookSections } from "@/lib/types";

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

export default function RoleBookEditor() {
  const router = useRouter();
  const { t } = useTranslation();
  const accountId = useSelectedAccountId();
  const [book, setBook] = useState<RoleBook | null>(null);
  const [draft, setDraft] = useState<RoleBookSections>({});
  const [bootError, setBootError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [linting, setLinting] = useState(false);
  const [lintResult, setLintResult] = useState<LintResult | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

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
          `${result.conflicts.length} · ${high} high`,
          "error",
        );
      } else {
        toast(`${result.conflicts.length} conflict(s) — review below`);
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

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <header className="sticky top-0 z-20 bg-white/90 dark:bg-zinc-950/90 backdrop-blur border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between gap-3">
          <Link href="/app" className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
            {t("rolebook.back_to_dashboard")}
          </Link>
          <div className="flex items-center gap-3">
            <AccountSwitcher />
            <LanguageSwitcher />
            <div className="text-xs text-zinc-500">
              {t("rolebook.version_label")}{book.role_book_id}
              {book.parent_id !== null && (
                <span> · {t("rolebook.parent_label")}{book.parent_id}</span>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("rolebook.title")}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">{t("rolebook.subtitle")}</p>
        </div>

        {/* Intro */}
        <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
          <div className="flex items-baseline justify-between mb-2">
            <label className="text-sm font-semibold">
              {t("rolebook.intro.label")}
            </label>
            <span className="text-xs text-zinc-500">
              {t("rolebook.intro.helper")}
            </span>
          </div>
          <textarea
            value={draft.intro ?? ""}
            onChange={(e) => updateIntro(e.target.value)}
            rows={5}
            placeholder={t("rolebook.intro.placeholder")}
            className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-700"
          />
          {draft.intro && (
            <div className="mt-3">
              <TranslateButton text={draft.intro} source="role_book_intro" />
            </div>
          )}
        </section>

        {/* List sections */}
        {LIST_SECTIONS.map((section) => {
          const items = (draft[section.key] as string[] | undefined) ?? [];
          const sampleForTranslate = items.length > 0 ? items.join("\n") : "";
          const isDanger = section.variant === "danger";
          return (
            <section
              key={section.key}
              className={`rounded-xl border bg-white dark:bg-zinc-900 p-5 shadow-sm ${
                isDanger
                  ? "border-red-200 dark:border-red-900/50"
                  : "border-zinc-200 dark:border-zinc-800"
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
                flagged={flaggedBySection[section.key]}
                onFlaggedClick={onFlaggedPillClick}
              />
              {sampleForTranslate && (
                <div className="mt-3">
                  <TranslateButton
                    text={sampleForTranslate}
                    source={`role_book_${section.key}`}
                  />
                </div>
              )}
            </section>
          );
        })}

        {/* Lint results — appears when the user has run the check OR
            after every save (auto-lint). Pills with conflicts also get
            a ⚠ marker inline above — clicking it scrolls to this card. */}
        {lintResult && (
          <section
            id="lint-results-card"
            className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm scroll-mt-24"
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
            <LintResults result={lintResult} />
          </section>
        )}

        {/* Save action bar */}
        <div className="sticky bottom-4 flex items-center justify-end gap-3 bg-white/95 dark:bg-zinc-950/95 backdrop-blur border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 shadow-md">
          <span className="mr-auto text-xs text-zinc-500">
            {t("rolebook.save.helper")}
          </span>
          <button
            onClick={onLint}
            disabled={linting || saving}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-zinc-300 dark:border-zinc-700 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 transition-colors"
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
            className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors px-3 py-1.5"
          >
            {t("common.cancel")}
          </Link>
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

        {/* Transparency: what the LLM actually sees */}
        <details className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
          <summary className="cursor-pointer text-sm font-semibold">
            {t("rolebook.transparency.title")}
            <span className="ml-2 font-normal text-xs text-zinc-500">
              {t("rolebook.transparency.subtitle")}
            </span>
          </summary>
          <pre className="mt-3 whitespace-pre-wrap text-xs leading-relaxed text-zinc-700 dark:text-zinc-300 font-mono">
            {book.prompt_text}
          </pre>
          <div className="mt-3">
            <TranslateButton text={book.prompt_text} source="role_book_assembled" />
          </div>
        </details>
      </main>

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
