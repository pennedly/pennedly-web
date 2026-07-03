"use client";

// Global legal/support footer for the authenticated /app/* shell (design:
// Footer-SPEC.html / app-foot.css). A quiet secondary band at the end of the
// scroll region; the AppLayout makes the content column grow so this pins to
// the viewport bottom on short pages and flows after content on long ones.
//
// Inner row aligns to the page's content column — reading (720) by default,
// wide (960) on data screens — mirroring the topbar/content (.app-foot--wide).
// Links are internal (same tab, Next <Link>); support is a mailto. Focus rings
// come from the app-wide :focus-visible rule (globals.css). Copy localizes via
// footer.* across the 8 locales; the year is appended at runtime.

import Link from "next/link";
import { usePathname } from "next/navigation";

import { IcMail } from "@/components/icons";
import { useTranslation } from "@/lib/i18n";

// Routes whose content renders at the wide (960) column (data screens) — the
// footer matches so its row lines up with the topbar + content.
const WIDE_PATHS = new Set([
  "/app",
  "/app/feed",
  "/app/replies",
  "/app/mentions",
  "/app/stats",
  "/app/scenarios",
  "/app/overview",
  "/app/calendar",
  "/app/account",
]);

const SUPPORT_EMAIL = "support@pennedly.com";

export function AppFooter() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const wide = WIDE_PATHS.has(pathname);
  const year = new Date().getFullYear();

  const links = [
    { href: "/privacy", label: t("footer.privacy") },
    { href: "/terms", label: t("footer.terms") },
    { href: "/data-deletion", label: t("footer.data_deletion") },
  ];

  return (
    <footer className="shrink-0 border-t border-border bg-bg">
      <div
        className={
          "mx-auto flex w-full flex-col items-start gap-0.5 px-5 pb-5 pt-3 text-small leading-snug text-text-subtle " +
          "sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-[18px] sm:gap-y-2 sm:px-6 sm:py-4 " +
          (wide ? "max-w-[960px]" : "max-w-[720px]")
        }
      >
        <span className="inline-flex min-h-9 items-center whitespace-nowrap text-text-subtle sm:min-h-0">
          {t("footer.copyright").replace("{year}", String(year))}
        </span>

        {/* divider dot — desktop only */}
        <span
          aria-hidden
          className="hidden h-[3px] w-[3px] shrink-0 rounded-full bg-ink-400 opacity-70 sm:block"
        />

        <nav
          aria-label="Legal"
          className="flex w-full flex-wrap items-center gap-x-3 gap-y-0 sm:w-auto sm:gap-x-4 sm:gap-y-1"
        >
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="inline-flex min-h-11 items-center rounded-sm py-1 text-text-muted transition-colors hover:text-text hover:underline hover:underline-offset-2 sm:min-h-0"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* spacer pushes support to the trailing edge — desktop only */}
        <span aria-hidden className="hidden flex-1 sm:block" />

        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="inline-flex min-h-11 items-center gap-[7px] whitespace-nowrap rounded-sm py-1 text-text-muted transition-colors hover:text-text sm:min-h-0"
        >
          <span className="sr-only">{t("footer.support")}</span>
          <IcMail size={14} aria-hidden className="shrink-0 text-text-subtle" />
          {SUPPORT_EMAIL}
        </a>
      </div>
    </footer>
  );
}
