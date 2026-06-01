import Link from "next/link";
import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

// Inline text link — the one place the ink-blue accent shows up in prose.

export const linkClasses =
  "text-accent underline underline-offset-2 decoration-accent/40 transition-colors hover:decoration-accent";

export function TextLink({ className, ...rest }: ComponentProps<typeof Link>) {
  return <Link className={cn(linkClasses, className)} {...rest} />;
}
