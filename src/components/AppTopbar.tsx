"use client";

// Shared top bar for /app screens: short screen title (left), an optional
// status pill, and ghost icon buttons (theme toggle + settings) on the right.
// Sticky, full-width of the content area, with a frosted backdrop. Each screen
// renders it at the top of its content (the screen's own eyebrow/title/intro
// lives below, in the centered content column).

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

import { cn } from "@/lib/cn";
import { useTranslation } from "@/lib/i18n";
import { IcMoon, IcSettings, IcSun } from "@/components/icons";

const ICON_BTN =
  "grid h-9 w-9 place-items-center rounded-md border border-border bg-surface text-text-muted transition-colors hover:bg-surface-2 hover:text-text";

function ThemeToggle() {
  const { t } = useTranslation();
  const [dark, setDark] = useState(false);

  // The no-FOUC script in the root layout sets `.dark` on <html> before paint;
  // read it on mount so the icon matches the actual theme.
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      /* private mode / storage disabled — toggle still applies for the session */
    }
    setDark(next);
  }

  return (
    <button type="button" onClick={toggle} aria-label={t("shell.toggle_theme")} className={ICON_BTN}>
      {dark ? <IcSun size={17} /> : <IcMoon size={16} />}
    </button>
  );
}

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
  maxW = "760px",
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
        className="mx-auto flex h-15 w-full items-center gap-3 px-5 md:px-6"
        style={{ maxWidth: maxW }}
      >
        <h1 className="truncate text-h3 font-semibold tracking-tight">{title}</h1>
        {pill}
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          {actions}
          <ThemeToggle />
          <Link href="/app/settings" aria-label={t("nav.settings")} className={ICON_BTN}>
            <IcSettings size={17} />
          </Link>
        </div>
      </div>
    </header>
  );
}
