import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";
import { IcX } from "@/components/icons";

// Badge — graded status pill (quiet, desaturated). Tag — removable chip.
// Status = quiet colored dots/badges, never loud fills.

export type BadgeTone = "good" | "neutral" | "bad" | "accent";

const TONES: Record<BadgeTone, string> = {
  good: "border-success/30 bg-success/12 text-success",
  neutral: "border-border bg-text/[0.06] text-text-muted",
  bad: "border-danger/30 bg-danger/12 text-danger",
  accent: "border-accent/30 bg-accent/12 text-accent",
};

export function Badge({
  tone = "neutral",
  dot = false,
  className,
  children,
  ...rest
}: { tone?: BadgeTone; dot?: boolean } & HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-caption font-medium",
        TONES[tone],
        className,
      )}
      {...rest}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

/** Bare status dot — color it with a text-color utility (e.g. `text-success`)
 *  via `bg-current`, or pass a `bg-*` class. */
export function StatusDot({ className }: { className?: string }) {
  return <span className={cn("h-[7px] w-[7px] shrink-0 rounded-full", className)} />;
}

export function Tag({
  onRemove,
  className,
  children,
  ...rest
}: { onRemove?: () => void } & HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2 py-1 text-caption font-medium text-text",
        onRemove ? "pl-2.5 pr-1.5" : "px-2.5",
        className,
      )}
      {...rest}
    >
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove"
          className="grid h-4 w-4 place-items-center rounded-full text-text-subtle transition-colors hover:bg-text/10 hover:text-text"
        >
          <IcX size={11} />
        </button>
      )}
    </span>
  );
}
