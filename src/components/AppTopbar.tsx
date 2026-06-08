"use client";

// Shared top bar for /app screens: short screen title (left), an optional status
// pill, and ghost icon buttons on the right. Desktop (≥ md): theme toggle +
// Settings. Phone (≤ md): a hamburger (far left) that opens the nav drawer (the
// `Sidebar` renders the drawer; they coordinate via the `mobileNav` store) +
// theme toggle; Settings lives in the drawer foot on a phone. Sticky, full-width
// of the content area, with a frosted backdrop; its inner row centers to the
// content column.

import Link from "next/link";
import { type ReactNode } from "react";

import { cn } from "@/lib/cn";
import { useTranslation } from "@/lib/i18n";
import { setMobileNavOpen } from "@/lib/mobileNav";
import { IcSettings } from "@/components/icons";
import { ThemeToggle } from "@/components/ThemeToggle";

const ICON_BTN =
  "grid h-9 w-9 place-items-center rounded-md border border-border bg-surface text-text-muted transition-colors hover:bg-surface-2 hover:text-text";

export function TopbarPill({
  tone = "success",
  icon,
  children,
}: {
  tone?: "success" | "warning" | "accent";
  // Render this leading glyph instead of the status dot — e.g. a clock for a
  // freshness pill ("Updated hourly") rather than a state pill.
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-surface px-3 py-1 text-small text-text-muted">
      {icon ?? (
        <span
          className={cn(
            "h-[7px] w-[7px] rounded-full",
            tone === "warning" ? "bg-warning" : tone === "accent" ? "bg-accent" : "bg-success",
          )}
        />
      )}
      {children}
    </span>
  );
}

export function AppTopbar({
  title,
  pill,
  actions,
  maxW = "720px",
}: {
  title: ReactNode;
  pill?: ReactNode;
  actions?: ReactNode;
  /**
   * Width of the screen's content column. The bar spans full width (border +
   * frosted bg), but its inner row is centered to this same width so the title
   * sits directly above the content's left edge and the actions above its
   * right edge — instead of the title floating at the far left.
   */
  maxW?: string;
}) {
  const { t } = useTranslation();
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-bg/85 backdrop-blur-md">
      <div
        className="mx-auto flex h-13 w-full items-center gap-3 px-5 md:h-15 md:px-6"
        style={{ maxWidth: maxW }}
      >
        {/* Phone: hamburger → nav drawer (Sidebar renders the drawer). */}
        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          aria-label={t("nav.more")}
          className="-ml-1.5 grid h-9 w-9 shrink-0 place-items-center rounded-md text-text-muted transition-colors hover:bg-surface-2 hover:text-text md:hidden"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <h1 className="truncate text-h3 font-semibold">{title}</h1>
        {pill}
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          {actions}
          <ThemeToggle />
          <Link href="/app/settings" aria-label={t("nav.settings")} className={cn(ICON_BTN, "hidden md:grid")}>
            <IcSettings size={17} />
          </Link>
        </div>
      </div>
    </header>
  );
}
