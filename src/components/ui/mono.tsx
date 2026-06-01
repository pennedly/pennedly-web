import { cn } from "@/lib/cn";

// Monogram avatar — initials on an ink disc (flips to paper-on-ink in dark).

export function Mono({
  text,
  size = 34,
  className,
}: {
  text: string;
  size?: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid shrink-0 select-none place-items-center rounded-full bg-text font-semibold text-bg",
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
    >
      {text}
    </span>
  );
}
