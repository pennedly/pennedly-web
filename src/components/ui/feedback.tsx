import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

// Loading + empty primitives: Spinner, Skeleton(+Text), EmptyState.

// `label` is what a screen reader announces. Pass a localized string wherever
// the spinner IS the loading state (a whole screen or panel). Left out, the
// spinner goes decorative — that is the case inside buttons and rows, where a
// localized label ("Saving…", "Connecting…") already sits right next to it and
// a second announcement would only repeat it in English.
export function Spinner({ size = 16, className, label }: { size?: number; className?: string; label?: string }) {
  return (
    <span
      {...(label ? { role: "status", "aria-label": label } : { "aria-hidden": true })}
      className={cn(
        "inline-block animate-spin rounded-full border-2 border-current border-t-transparent",
        className,
      )}
      style={{ width: size, height: size }}
    />
  );
}

export function Skeleton({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("skel rounded-md", className)} {...rest} />;
}

const SKELETON_WIDTHS = ["92%", "100%", "48%", "85%", "70%"];

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-2.5", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3 skel rounded-full"
          style={{ width: SKELETON_WIDTHS[i % SKELETON_WIDTHS.length] }}
        />
      ))}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-lg border border-dashed border-border px-6 py-14 text-center",
        className,
      )}
    >
      {icon && (
        <div className="mb-4 grid h-13 w-13 place-items-center rounded-lg border border-border bg-surface-2 text-text-subtle">
          {icon}
        </div>
      )}
      <h3 className="text-h3 font-semibold">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-[38ch] text-small leading-relaxed text-text-muted">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
