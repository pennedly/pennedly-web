"use client";

// The unified Autopilot badge system (Badge-System-SPEC). Replaces the old
// inconsistent badges (mono-caps «ВСТРОЕННАЯ», mismatched sizes/colors) with ONE
// capsule silhouette per family, NORMAL-case sans, differentiated only by color.
//
// Three families, one question each:
//   <Badge>        — «what is it / what does it do?» — properties. h-6 pill,
//                    13px icon = text in size/weight/color. Quiet by default
//                    (neutral/grey); accent («link») only for a RELATION badge;
//                    amber («note») only for a rare attention exception.
//   <StatusBadge>  — «does it run right now?» — the ONLY family with a dot.
//                    h-7 pill: on (green) / off (grey) / paused (amber).
//   <InheritChip>  — «where does this value come from?» — a ghost dashed chip
//                    that lives next to a value (a footer), never in the title.
//
// Rules baked in (SPEC §3): fixed heights (24/28px), icon === text typography,
// max 1 status + 3 properties per card. Colors are semantic tokens only.

import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

// ── Properties — «.bdg». Grey by default; accent for a relation; amber for a
//    rare attention note. The icon is sized/weighted/colored exactly like the
//    text (currentColor, 13px) so nothing inside the pill stands out. ──
export type BadgeTone = "neutral" | "link" | "note";

const BADGE_TONE: Record<BadgeTone, string> = {
  neutral: "border-border bg-surface-2 text-text-subtle",
  link: "border-accent/30 bg-accent/[0.09] text-accent",
  note: "border-warning/[0.32] bg-warning/12 text-warning",
};

export function Badge({
  tone = "neutral",
  icon,
  children,
  className,
}: {
  tone?: BadgeTone;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full border px-[11px] align-middle text-[12px] font-semibold leading-none tracking-normal",
        BADGE_TONE[tone],
        className,
      )}
    >
      {icon && <span className="grid shrink-0 place-items-center [&>svg]:h-[13px] [&>svg]:w-[13px]">{icon}</span>}
      {children}
    </span>
  );
}

// ── Status — «.st». The only family carrying a dot. on=green, off=grey,
//    paused=amber. h-7, slightly larger text than a property badge. ──
export type StatusTone = "on" | "off" | "paused";

const STATUS_TONE: Record<StatusTone, { pill: string; dot: string }> = {
  on: { pill: "border-success/28 bg-success/12 text-success", dot: "bg-success ring-[3px] ring-success/[0.22]" },
  off: { pill: "border-border bg-surface-2 text-text-subtle", dot: "bg-current" },
  paused: { pill: "border-warning/30 bg-warning/12 text-warning", dot: "bg-current" },
};

export function StatusBadge({
  tone,
  children,
  className,
}: {
  tone: StatusTone;
  children: ReactNode;
  className?: string;
}) {
  const s = STATUS_TONE[tone];
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center gap-2 whitespace-nowrap rounded-full border pl-[11px] pr-[13px] align-middle text-[13px] font-semibold leading-none",
        s.pill,
        className,
      )}
    >
      <span className={cn("h-2 w-2 shrink-0 rounded-full", s.dot)} />
      {children}
    </span>
  );
}

// ── Inheritance — «.inh». A ghost dashed chip that sits next to the value it
//    qualifies (in a footer), never in the card title. Smaller + lighter. ──
export function InheritChip({
  icon,
  children,
  className,
}: {
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-[22px] items-center gap-[5px] whitespace-nowrap rounded-full border border-dashed border-border bg-transparent px-[9px] align-middle text-[11px] font-medium leading-none text-text-subtle",
        className,
      )}
    >
      {icon && <span className="grid shrink-0 place-items-center opacity-90 [&>svg]:h-[11px] [&>svg]:w-[11px]">{icon}</span>}
      {children}
    </span>
  );
}
