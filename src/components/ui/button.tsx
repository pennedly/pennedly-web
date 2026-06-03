import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

import { Spinner } from "./feedback";

// Button — per the design system recipe. Primary is ink (flips to paper in
// dark) — the calmest emphasis; at most ONE primary per surface. Secondary,
// ghost and danger round it out. Sizes md (40px) and sm (32px).

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "md" | "sm" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50 disabled:pointer-events-none";

// md (40px) / sm (32px) / lg (46px, hero & auth CTA — design .btn--lg). Font size
// rides with the size: small for md/sm, body for lg.
const SIZES: Record<ButtonSize, string> = {
  md: "h-10 px-4 rounded-md text-small",
  sm: "h-8 px-3 rounded-sm text-small",
  lg: "h-[46px] px-[22px] rounded-lg text-body",
};

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90",
  secondary: "bg-surface text-text border border-border hover:bg-surface-2",
  ghost: "bg-transparent text-text-muted hover:bg-surface-2 hover:text-text",
  danger: "bg-danger text-danger-foreground hover:bg-danger/90",
};

/** Class string for the button recipe — reuse on `<a>` / `<Link>` that should
 *  look like a button. */
export function buttonClasses(opts?: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}): string {
  const { variant = "secondary", size = "md", className } = opts ?? {};
  return cn(BASE, SIZES[size], VARIANTS[variant], className);
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  /** Leading icon (replaced by a spinner while `loading`). */
  icon?: ReactNode;
};

export function Button({
  variant,
  size,
  loading = false,
  icon,
  className,
  children,
  disabled,
  ...rest
}: Props) {
  return (
    <button
      className={buttonClasses({ variant, size, className })}
      disabled={disabled || loading}
      aria-disabled={loading || undefined}
      {...rest}
    >
      {loading ? <Spinner /> : icon}
      {children}
    </button>
  );
}
