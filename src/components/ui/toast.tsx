import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

// Toast + host. Bottom-center stack (matches the approved Studio reference).
// Screens own their toast list in state and render <ToastHost><Toast/>…</…>.

export type ToastTone = "success" | "error";

export function ToastHost({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 flex-col gap-2.5",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Toast({
  tone = "success",
  title,
  description,
  onUndo,
  undoLabel = "Undo",
  className,
}: {
  tone?: ToastTone;
  title: ReactNode;
  description?: ReactNode;
  onUndo?: () => void;
  undoLabel?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      className={cn(
        "flex items-start gap-3 rounded-lg border border-border bg-surface px-4 py-3.5 shadow-lg",
        className,
      )}
    >
      <span
        className={cn(
          "mt-1.5 h-2 w-2 shrink-0 rounded-full",
          tone === "error" ? "bg-danger" : "bg-success",
        )}
      />
      <div className="min-w-0">
        <div className="text-small font-semibold">{title}</div>
        {description && <div className="mt-0.5 text-caption text-text-muted">{description}</div>}
      </div>
      {onUndo && (
        <button
          type="button"
          onClick={onUndo}
          className="ml-2 shrink-0 text-small font-semibold text-accent"
        >
          {undoLabel}
        </button>
      )}
    </div>
  );
}
