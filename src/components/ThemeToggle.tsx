"use client";

// Light/dark toggle — an icon button that flips `.dark` on <html> and persists
// the choice to localStorage (read before paint by the no-FOUC script in the
// root layout). Extracted from AppTopbar so the mobile "More" sheet can reuse
// the exact same control.

import { useEffect, useState } from "react";

import { useTranslation } from "@/lib/i18n";
import { IcMoon, IcSun } from "@/components/icons";

const ICON_BTN =
  "grid h-9 w-9 place-items-center rounded-md border border-border bg-surface text-text-muted transition-colors hover:bg-surface-2 hover:text-text";

export function ThemeToggle({ className }: { className?: string }) {
  const { t } = useTranslation();
  const [dark, setDark] = useState(false);

  // The no-FOUC script sets `.dark` before paint; read it on mount so the icon
  // matches the actual theme.
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
    <button type="button" onClick={toggle} aria-label={t("shell.toggle_theme")} className={className ?? ICON_BTN}>
      {dark ? <IcSun size={17} /> : <IcMoon size={16} />}
    </button>
  );
}
