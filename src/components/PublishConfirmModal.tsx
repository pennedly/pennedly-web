"use client";

// Final confirmation before pushing an approved draft to Threads.
//
// This is the last chance the user has to bail. Once the user clicks
// "publish to Threads", the post is public on their real account —
// embarrassing typos, wrong tone, mis-published drafts, all become
// visible to real followers. So the modal:
//
//   • shows the *exact* text that will go up, in the same font/wrap
//     style Threads uses, so there are no surprises
//   • shows the character count + a 500-char limit indicator (Threads'
//     actual cap is 500 chars for text-only)
//   • requires a second deliberate click (default focus is on Cancel)
//   • renders a loading state with no way to double-click during publish
//   • surfaces error toasts from the parent via `error` prop
//
// Wired in by the dashboard's draft cards on the "publish" button for
// approved-status drafts.

import { useEffect, useRef } from "react";

const THREADS_TEXT_LIMIT = 500;

type Props = {
  open: boolean;
  text: string;
  isPublishing: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function PublishConfirmModal({
  open,
  text,
  isPublishing,
  onClose,
  onConfirm,
}: Props) {
  const cancelRef = useRef<HTMLButtonElement | null>(null);

  // When the modal opens, default focus to Cancel — so an accidental
  // Enter key doesn't ship.
  useEffect(() => {
    if (open && cancelRef.current && !isPublishing) {
      cancelRef.current.focus();
    }
  }, [open, isPublishing]);

  // Escape closes the modal (unless publishing — don't interrupt).
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !isPublishing) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, isPublishing, onClose]);

  if (!open) return null;

  const len = text.length;
  const overLimit = len > THREADS_TEXT_LIMIT;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="publish-modal-title"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden">
        <div className="px-6 pt-6 pb-3">
          <h2
            id="publish-modal-title"
            className="text-lg font-semibold tracking-tight"
          >
            Publish to Threads
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            This is the exact text that will appear on your Threads account.
            It cannot be edited or unpublished from here.
          </p>
        </div>

        <div className="mx-6 mb-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-4">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-800 dark:text-zinc-100">
            {text}
          </p>
        </div>

        <div className="px-6 pb-3 flex items-center text-xs">
          <span
            className={
              overLimit
                ? "text-red-600 dark:text-red-400 font-medium"
                : "text-zinc-500"
            }
          >
            {len} / {THREADS_TEXT_LIMIT} chars
          </span>
          {overLimit && (
            <span className="ml-2 text-red-600 dark:text-red-400">
              · Threads will reject text-only posts over {THREADS_TEXT_LIMIT}
            </span>
          )}
        </div>

        <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-950/60 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-3">
          <button
            ref={cancelRef}
            onClick={onClose}
            disabled={isPublishing}
            className="text-sm px-4 py-2 rounded-md text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 transition-colors"
          >
            cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isPublishing || overLimit || len === 0}
            className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPublishing && (
              <span
                className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"
                aria-hidden
              />
            )}
            {isPublishing ? "publishing…" : "publish to Threads"}
          </button>
        </div>
      </div>
    </div>
  );
}
