"use client";

// Bottom sheet — the phone form of a popover/dialog (mobile shell, ≤ md).
// Full-width, top-rounded, slides up over a scrim; safe-area aware; dismisses
// on the scrim, the grip, Esc, or the optional close button. Locks body scroll
// while open. Per the mobile design system: dialogs/menus become bottom sheets
// on a phone. Render it conditionally (the parent owns the open state).

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { IcX } from "@/components/icons";

export function MobileSheet({
  title,
  onClose,
  children,
}: {
  title?: ReactNode;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  // Portal to <body>: a backdrop-filter ancestor (e.g. the frosted top bar that
  // hosts the account avatar) would otherwise become the containing block for
  // our position:fixed root, pinning the sheet to that ancestor's box instead of
  // the viewport. Rendering at the body escapes any such trap.
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-50 md:hidden">
      <div
        className="absolute inset-0 bg-ink-950/50 backdrop-blur-[2px]"
        style={{ animation: "scrim-in 0.18s var(--ease-standard)" }}
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        className="absolute inset-x-0 bottom-0 flex max-h-[88%] flex-col rounded-t-2xl border-t border-border bg-surface shadow-lg"
        style={{
          paddingBottom: "calc(16px + env(safe-area-inset-bottom))",
          animation: "sheet-up 0.24s var(--ease-entrance)",
        }}
      >
        <div className="mx-auto mb-2 mt-2 h-1 w-9 shrink-0 rounded-full bg-border" />
        {title !== undefined && (
          <div className="flex shrink-0 items-center gap-2.5 px-4 pb-3 pt-1">
            <span className="text-h3 font-semibold">{title}</span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="ml-auto grid h-8 w-8 place-items-center rounded-md border border-border bg-surface text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
            >
              <IcX size={16} />
            </button>
          </div>
        )}
        <div className="min-h-0 overflow-y-auto px-2.5 pb-1">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
