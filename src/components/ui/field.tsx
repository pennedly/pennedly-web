import type {
  HTMLAttributes,
  InputHTMLAttributes,
  LabelHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

import { cn } from "@/lib/cn";

// Inputs / select / textarea — 40px tall, md radius, hairline border that turns
// ink-blue with a soft ring on focus. Error state swaps border + ring to danger.

const BASE =
  "w-full rounded-md border bg-surface px-3 text-body text-text placeholder:text-text-subtle transition-colors focus:outline-none focus:ring-[3px]";
const OK = "border-border focus:border-accent focus:ring-accent/25";
const ERR = "border-danger focus:border-danger focus:ring-danger/25";

// Native-select chevron (design `select.field`): an ink-500 caret SVG pinned
// right. Mid-gray so it reads on both light + dark surfaces.
const SELECT_CHEVRON =
  "url('data:image/svg+xml,%3Csvg width=%2712%27 height=%2712%27 viewBox=%270 0 12 12%27 fill=%27none%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cpath d=%27M3 4.5L6 7.5L9 4.5%27 stroke=%27%237b7a74%27 stroke-width=%271.4%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27/%3E%3C/svg%3E')";

function tone(error?: boolean): string {
  return error ? ERR : OK;
}

export function Input({
  error,
  className,
  ...rest
}: { error?: boolean } & InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("h-10", BASE, tone(error), className)} {...rest} />;
}

export function Textarea({
  error,
  className,
  ...rest
}: { error?: boolean } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn("h-auto py-2.5 leading-relaxed resize-y", BASE, tone(error), className)}
      {...rest}
    />
  );
}

export function Select({
  error,
  className,
  children,
  style,
  ...rest
}: { error?: boolean } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-10 appearance-none bg-no-repeat pr-8 [background-position:right_12px_center]",
        BASE,
        tone(error),
        className,
      )}
      style={{ backgroundImage: SELECT_CHEVRON, ...style }}
      {...rest}
    >
      {children}
    </select>
  );
}

export function FieldLabel({ className, ...rest }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("block text-small font-medium text-text mb-1.5", className)} {...rest} />;
}

export function FieldHint({
  error,
  className,
  ...rest
}: { error?: boolean } & HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("mt-1.5 text-caption", error ? "text-danger" : "text-text-subtle", className)}
      {...rest}
    />
  );
}
