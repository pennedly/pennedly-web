import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

// Card — resting surface (white-on-paper). Panel — inset surface-2 variant.

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-surface p-5 shadow-sm",
        className,
      )}
      {...rest}
    />
  );
}

export function Panel({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-lg border border-border bg-surface-2 p-5", className)}
      {...rest}
    />
  );
}
