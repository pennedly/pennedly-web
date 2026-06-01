"use client";

import { useEffect, type HTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/cn";

// Dialog — modal overlay + card per the design system (rounded-2xl, shadow-lg,
// ink-tinted backdrop blur). Escape and backdrop-click close it. Controlled via
// `open` / `onClose`.

export function Dialog({
  open,
  onClose,
  children,
  className,
  labelledBy,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  labelledBy?: string;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-30 grid place-items-center bg-ink-950/55 p-6 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={cn(
          "w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-lg",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function DialogTitle({ className, ...rest }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-h3 font-semibold", className)} {...rest} />;
}

export function DialogDescription({ className, ...rest }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("mt-1 text-small leading-relaxed text-text-muted", className)} {...rest} />
  );
}

export function DialogActions({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-5 flex justify-end gap-2.5", className)} {...rest} />;
}
