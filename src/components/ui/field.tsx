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
  ...rest
}: { error?: boolean } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn("h-10 appearance-none pr-8", BASE, tone(error), className)}
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
