"use client";

// Role-book editor placeholder. SKELETON ONLY — sections are rendered
// as monospace JSON-style textareas, NOT as proper tag inputs / forms.
// The real editor with friendly per-section UX (tag pills, drag-and-drop
// ordering, validation feedback) lives in the live UI session.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  ApiError,
  clearTokens,
  fetchRoleBook,
  getTokens,
  patchRoleBook,
} from "@/lib/api";
import { captureEvent } from "@/lib/analytics";
import type { RoleBook, RoleBookSections } from "@/lib/types";

const ACCOUNT_ID = 2; // hardcoded dogfooding account; lift to URL param later

const LIST_FIELDS: (keyof RoleBookSections)[] = [
  "themes_include",
  "themes_exclude",
  "voice_characteristics",
  "do_list",
  "dont_list",
  "examples",
];

export default function RoleBookEditor() {
  const router = useRouter();
  const [book, setBook] = useState<RoleBook | null>(null);
  const [draft, setDraft] = useState<RoleBookSections>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

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
        setError(String(e));
      }
    })();
  }, [router]);

  function updateList(field: keyof RoleBookSections, text: string) {
    const items = text
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    setDraft((d) => ({ ...d, [field]: items }));
  }

  function updateIntro(text: string) {
    setDraft((d) => ({ ...d, intro: text }));
  }

  async function onSave() {
    setSaving(true);
    setError(null);
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
      setSavedAt(new Date().toISOString());
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  }

  if (!book) {
    return (
      <main className="max-w-3xl mx-auto p-8 font-sans">
        {error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : (
          <p className="text-sm text-zinc-500">loading…</p>
        )}
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto p-8 font-sans text-zinc-900 dark:text-zinc-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">role book</h1>
          <p className="text-sm text-zinc-500">
            v{book.role_book_id}{" "}
            {book.parent_id !== null && (
              <span>(parent #{book.parent_id})</span>
            )}{" "}
            · {book.created_by}
          </p>
        </div>
        <a
          href="/app"
          className="text-sm underline text-zinc-600 dark:text-zinc-400"
        >
          ← dashboard
        </a>
      </div>

      <div className="space-y-5">
        <label className="block">
          <span className="text-sm font-medium">intro</span>
          <textarea
            value={draft.intro ?? ""}
            onChange={(e) => updateIntro(e.target.value)}
            rows={4}
            className="mt-1 w-full px-3 py-2 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 font-sans"
          />
        </label>

        {LIST_FIELDS.map((field) => {
          const items = (draft[field] as string[] | undefined) ?? [];
          const isExclude = field === "themes_exclude";
          return (
            <label key={field} className="block">
              <span
                className={`text-sm font-medium ${
                  isExclude ? "text-red-700 dark:text-red-400" : ""
                }`}
              >
                {field.replace(/_/g, " ")}
                {isExclude && " (topics the AI must never write about)"}
              </span>
              <textarea
                value={items.join("\n")}
                onChange={(e) => updateList(field, e.target.value)}
                rows={Math.max(3, items.length + 1)}
                placeholder="one item per line"
                className={`mt-1 w-full px-3 py-2 rounded border bg-white dark:bg-zinc-950 font-sans ${
                  isExclude
                    ? "border-red-300 dark:border-red-800"
                    : "border-zinc-300 dark:border-zinc-700"
                }`}
              />
            </label>
          );
        })}
      </div>

      {error && (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      {savedAt && (
        <p className="mt-4 text-sm text-green-700 dark:text-green-400">
          saved at {new Date(savedAt).toLocaleTimeString()}
        </p>
      )}

      <div className="mt-6 flex gap-3">
        <button
          onClick={onSave}
          disabled={saving}
          className="px-4 py-2 rounded bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black disabled:opacity-50"
        >
          {saving ? "saving…" : "save"}
        </button>
        <a
          href="/app"
          className="px-4 py-2 rounded border border-zinc-300 dark:border-zinc-700"
        >
          back
        </a>
      </div>

      <details className="mt-8 text-xs">
        <summary className="cursor-pointer text-zinc-500">
          assembled prompt_text (read-only — what the LLM actually sees)
        </summary>
        <pre className="mt-2 p-3 rounded border border-zinc-200 dark:border-zinc-800 whitespace-pre-wrap text-xs">
          {book.prompt_text}
        </pre>
      </details>
    </main>
  );
}
