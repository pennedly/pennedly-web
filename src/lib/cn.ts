// Tiny class-name joiner. No deps — we don't pull in clsx/tailwind-merge.
// Filters out falsy values and joins with a space. For our component layer we
// compose classes through props (variant/size) rather than overriding base
// utilities, so we don't need tailwind-merge's conflict resolution.

export type ClassValue = string | number | false | null | undefined;

export function cn(...parts: ClassValue[]): string {
  return parts.filter(Boolean).join(" ");
}
