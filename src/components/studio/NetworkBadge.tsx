import { cn } from "@/lib/cn";

// A small network-label chip for account chrome (the multi-network filter axis).
// Threads-only today, so callers gate it on a multi-network portfolio — it
// surfaces the moment a 2nd network connects, with no retrofit. A text label
// until per-network brand glyphs land (LinkedIn-time); the slot is what matters.
const LABELS: Record<string, string> = {
  threads: "Threads",
  linkedin: "LinkedIn",
};

export function NetworkBadge({ network, className }: { network: string; className?: string }) {
  const label = LABELS[network] ?? network.charAt(0).toUpperCase() + network.slice(1);
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded border border-border bg-surface-2 px-1.5 py-px text-[10px] font-medium uppercase tracking-[0.04em] text-text-subtle",
        className,
      )}
    >
      {label}
    </span>
  );
}
