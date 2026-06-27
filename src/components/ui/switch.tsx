import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

// Switch — headless checkbox peer. Off track is a neutral ink step (the one
// place we use a `dark:` override, since the off state has no semantic token);
// on track is ink (primary). Controlled via `checked` / `onCheckedChange`.

type Props = {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
  /** `lg` (≈56×30) is the master-switch size used by the Autopilot House Rules. */
  size?: "md" | "lg";
  className?: string;
} & Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "checked" | "onChange" | "className" | "size"
>;

export function Switch({
  checked,
  onCheckedChange,
  size = "md",
  className,
  disabled,
  ...rest
}: Props) {
  const lg = size === "lg";
  return (
    <label
      className={cn(
        "relative inline-flex shrink-0 cursor-pointer items-center",
        lg ? "h-[30px] w-[56px]" : "h-6 w-11",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      <input
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        {...rest}
      />
      <span className="absolute inset-0 rounded-full bg-ink-300 transition-colors peer-checked:bg-primary dark:bg-ink-700" />
      <span
        className={cn(
          "absolute rounded-full bg-white shadow-sm transition-transform peer-checked:bg-primary-foreground",
          lg
            ? "left-[3px] top-[3px] h-6 w-6 peer-checked:translate-x-[26px]"
            : "left-0.5 top-[3px] h-[18px] w-[18px] peer-checked:translate-x-5",
        )}
      />
    </label>
  );
}
