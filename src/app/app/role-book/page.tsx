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
import { LintResults } from "@/components/LintResults";
import { TagInput } from "@/components/TagInput";
import { TranslateButton } from "@/components/TranslateButton";
import type { LintResult, RoleBook, RoleBookSections } from "@/lib/types";

const ACCOUNT_ID = 2; // hardcoded dogfooding account; lift to URL param later

type SectionKey = keyof Omit<RoleBookSections, "intro">;

const LIST_SECTIONS: {
  key: SectionKey;
  label: string;
  helper: string;
  variant?: "default" | "danger";
  placeholder?: string;
}[] = [
  {
    key: "themes_exclude",
    label: "Topics the AI must NEVER write about",
    helper:
      "If a requested topic falls here, the AI silently pivots to an allowed topic.",
    variant: "danger",
    placeholder: "e.g. app development",
  },
  {
    key: "themes_include",
    label: "Topics the AI writes about",
    helper: "Be specific — 'kitchen failures' beats 'lifestyle'.",
    placeholder: "e.g. kitchen failures and shortcuts",
  },
  {
    key: "voice_characteristics",
    label: "Voice characteristics",
    helper: "Concrete observations: 'lowercase i', 'short sentences'.",
    placeholder: "e.g. uses lowercase throughout",
  },
  {
    key: "do_list",
    label: "Do",
    helper: "Specific moves to lean into.",
    placeholder: "e.g. open with 'what's a...' questions",
  },
  {
    key: "dont_list",
    label: "Don't",
    helper: "Specific moves to avoid.",
    placeholder: "e.g. no hashtags or emojis",
  },
  {
    key: "examples",
    label: "Voice examples",
    helper: "Representative phrases in your actual voice.",
    placeholder: "e.g. i have burned water before. not metaphorically",
  },
];

type Toast = { id: number; message: string; tone: "success" | "error" };

export default function RoleBookEditor() {
  const router = useRouter();
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
    (async () => {
      try {
        const rb = await fetchRoleBook(ACCOUNT_ID);
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
  }, [router]);

  function updateList(key: SectionKey, items: string[]) {
    setDraft((d) => ({ ...d, [key]: items }));
  }

  function updateIntro(text: string) {
    setDraft((d) => ({ ...d, intro: text }));
  }

  async function onSave() {
    setSaving(true);
    captureEvent("ui.role_book_save_clicked", {
      account_id: ACCOUNT_ID,
      fields_changed: Object.keys(draft),
      themes_exclude_count: draft.themes_exclude?.length ?? 0,
      themes_include_count: draft.themes_include?.length ?? 0,
    });
    try {
      const rb = await patchRoleBook(ACCOUNT_ID, draft);
      setBook(rb);
      setDraft({ ...(rb.sections ?? {}) });
      // Conflicts shown referred to the previous sections; clear them so
      // the user knows they need to re-lint the new saved version.
      setLintResult(null);
      toast("saved · next generation uses the new voice");
    } catch (e) {
      toast(String(e), "error");
    } finally {
      setSaving(false);
    }
  }

  async function onLint() {
    setLinting(true);
    captureEvent("ui.role_book_lint_clicked", { account_id: ACCOUNT_ID });
    try {
      const result = await lintRoleBook(ACCOUNT_ID, draft);
      setLintResult(result);
      const high = result.conflicts.filter((c) => c.severity === "high").length;
      if (result.conflicts.length === 0) {
        toast("no conflicts found");
      } else if (high > 0) {
        toast(
          `${result.conflicts.length} conflict(s) · ${high} high — review below`,
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
        loading…
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <header className="sticky top-0 z-20 bg-white/90 dark:bg-zinc-950/90 backdrop-blur border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/app" className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
            ← dashboard
          </Link>
          <div className="text-xs text-zinc-500">
            voice v{book.role_book_id}
            {book.parent_id !== null && (
              <span> · parent v{book.parent_id}</span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Voice</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Edit what the AI writes and how. Changes apply to the next generation.
          </p>
        </div>

        {/* Intro */}
        <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
          <div className="flex items-baseline justify-between mb-2">
            <label className="text-sm font-semibold">Intro</label>
            <span className="text-xs text-zinc-500">who&apos;s writing</span>
          </div>
          <textarea
            value={draft.intro ?? ""}
            onChange={(e) => updateIntro(e.target.value)}
            rows={5}
            placeholder="One paragraph in your own register: who you are, what you write about."
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
                  {section.label}
                </label>
                <span className="text-xs text-zinc-500">
                  {items.length} {items.length === 1 ? "item" : "items"}
                </span>
              </div>
              <p className="text-xs text-zinc-500 mb-3">{section.helper}</p>
              <TagInput
                items={items}
                onChange={(next) => updateList(section.key, next)}
                placeholder={section.placeholder}
                variant={section.variant}
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

        {/* Lint results — appears when the user has run the check */}
        {lintResult && (
          <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="text-sm font-semibold">Conflict check</h2>
              <button
                onClick={() => setLintResult(null)}
                className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              >
                hide
              </button>
            </div>
            <LintResults result={lintResult} />
          </section>
        )}

        {/* Save action bar */}
        <div className="sticky bottom-4 flex items-center justify-end gap-3 bg-white/95 dark:bg-zinc-950/95 backdrop-blur border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 shadow-md">
          <span className="mr-auto text-xs text-zinc-500">
            New active version on save · old becomes parent
          </span>
          <button
            onClick={onLint}
            disabled={linting || saving}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-zinc-300 dark:border-zinc-700 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 transition-colors"
            title="Ask the AI to flag any pairs of rules / examples / characteristics that contradict each other"
          >
            {linting && (
              <span
                className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"
                aria-hidden
              />
            )}
            {linting ? "checking…" : "check for conflicts"}
          </button>
          <Link
            href="/app"
            className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors px-3 py-1.5"
          >
            cancel
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
            {saving ? "saving…" : "save"}
          </button>
        </div>

        {/* Transparency: what the LLM actually sees */}
        <details className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
          <summary className="cursor-pointer text-sm font-semibold">
            What the AI actually sees
            <span className="ml-2 font-normal text-xs text-zinc-500">
              · assembled from sections above
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
