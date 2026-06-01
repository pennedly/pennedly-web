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

import { useTranslation } from "@/lib/i18n";
import { Button, buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/cn";

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
  const { t } = useTranslation();
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
      className="fixed inset-0 z-40 grid place-items-center bg-ink-950/55 p-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="publish-modal-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !isPublishing) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-lg">
        <h2 id="publish-modal-title" className="text-h3 font-semibold">
          {t("publish.title")}
        </h2>
        <p className="mt-1 text-small leading-relaxed text-text-muted">
          {t("publish.subtitle")}
        </p>

        <div className="mt-4 max-h-[220px] overflow-y-auto whitespace-pre-wrap rounded-md border border-border bg-surface-2 p-3.5 text-body leading-relaxed text-text">
          {text}
        </div>

        <div className="mt-2.5 flex items-center gap-2">
          <span
            className={cn(
              "text-caption tabular-nums",
              overLimit ? "font-semibold text-danger" : "text-text-subtle",
            )}
          >
            {len} / {THREADS_TEXT_LIMIT} {t("publish.char_count")}
          </span>
          {overLimit && (
            <span className="text-caption text-danger">· {t("publish.over_limit")}</span>
          )}
        </div>

        <div className="mt-5 flex items-center justify-end gap-2.5">
          <button
            ref={cancelRef}
            onClick={onClose}
            disabled={isPublishing}
            className={buttonClasses({ variant: "ghost" })}
          >
            {t("publish.cancel")}
          </button>
          <Button
            variant="primary"
            onClick={onConfirm}
            loading={isPublishing}
            disabled={isPublishing || overLimit || len === 0}
          >
            {isPublishing ? t("publish.publishing") : t("publish.confirm")}
          </Button>
        </div>
      </div>
    </div>
  );
}
