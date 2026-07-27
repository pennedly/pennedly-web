"use client";

// Shared top bar for /app screens: short screen title (left), an optional status
// pill, and ghost icon buttons on the right. Desktop (≥ md): theme toggle +
// Settings. Phone (≤ md): a hamburger (far left) that opens the nav drawer (the
// `Sidebar` renders the drawer; they coordinate via the `mobileNav` store) +
// theme toggle; Settings lives in the drawer foot on a phone. Sticky, full-width
// of the content area, with a frosted backdrop; its inner row centers to the
// content column.

import Link from "next/link";
import { useRef, type ReactNode } from "react";

import { cn } from "@/lib/cn";
import { useHeaderReveal } from "@/lib/useHeaderReveal";
import { useTranslation } from "@/lib/i18n";
import { setMobileNavOpen } from "@/lib/mobileNav";
import { useMe } from "@/lib/use-me";
import { useConnectedAccounts } from "@/components/useConnectedAccounts";
import { Avatar, nameOf } from "@/components/ui/avatar";
import { IcChevRight, IcSettings } from "@/components/icons";
import { ThemeToggle } from "@/components/ThemeToggle";

// 36×36 is the desktop `.icon-btn`; the phone эталон (`.m-iconbtn`) is 40×40.
const ICON_BTN =
  "grid h-9 w-9 place-items-center rounded-md border border-border bg-surface text-text-muted transition-colors hover:bg-surface-2 hover:text-text max-md:h-10 max-md:w-10";

// Nav #7 — the profile breadcrumb «Аккаунт › [Бренд ›] Профиль» (Navigation-SPEC
// + the Navigation-Topbar addendum). Passive orientation: the «Аккаунт» segment
// (filled account square → /app/account) is a link; the current profile segment
// (round avatar + @handle) is not. The account level is tester-only for now, so
// the crumb shows only for testers with a selected profile. Every current user
// has one brand, so the common shape is the two-segment «Аккаунт › @профиль»
// (the brand segment appears only at 2+ brands, which needs brand data the
// lightweight accounts list doesn't carry yet). The «back to account» button is
// the profile sidebar's first row (§3.2), so the crumb here carries no back CTA.
function useProfileCrumb() {
  const me = useMe();
  const { selectedAccount, effMe } = useConnectedAccounts();
  // effMe is DEMO_ME under ?demo=1 (a tester); else undefined → the real me.
  const identity = effMe ?? me;
  if (identity?.is_tester !== true || !selectedAccount) return null;
  return {
    // Same identity rule as the account chrome (useChromeIdentity): the USER's
    // display name first, tenant name as fallback — so this monogram matches
    // the account zone and follows a Settings rename live (B8 follow-up).
    mono: (((identity.display_name || "").trim() || identity.tenant.name || "?")).trim().slice(0, 2).toUpperCase(),
    handle: selectedAccount.username ? `@${selectedAccount.username}` : nameOf(selectedAccount),
    account: selectedAccount,
  };
}

function CrumbInner({ mono, handle, account }: NonNullable<ReturnType<typeof useProfileCrumb>>) {
  const { t } = useTranslation();
  return (
    <nav aria-label={t("acc.crumb_account")} className="flex min-w-0 items-center gap-1.5">
      <Link
        href="/app/account"
        className="flex shrink-0 items-center gap-1.5 text-text-muted transition-colors hover:text-text"
      >
        <span className="grid h-[19px] w-[19px] shrink-0 place-items-center rounded-[5px] bg-primary text-[10px] font-semibold text-primary-foreground">
          {mono}
        </span>
        <span className="text-caption">{t("acc.crumb_account")}</span>
      </Link>
      <IcChevRight size={12} className="shrink-0 text-text-subtle opacity-70" />
      <span className="flex min-w-0 items-center gap-1.5">
        <Avatar account={account} size={19} />
        <span className="truncate text-caption font-semibold text-text">{handle}</span>
      </span>
    </nav>
  );
}

export function TopbarPill({
  tone = "success",
  icon,
  children,
}: {
  tone?: "success" | "warning" | "accent" | "neutral";
  // Render this leading glyph instead of the status dot — e.g. a clock for a
  // freshness pill ("Updated hourly") rather than a state pill.
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    // `min-w-0` + the truncating label: on a phone a long pill (the cockpit's
    // «Аккаунтов: N · обновляется ежедневно») is wider than the row it drops
    // onto, and without this it was cut off mid-word by the screen edge.
    <span className="inline-flex min-w-0 max-w-full items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-surface px-3 py-1 text-small text-text-muted">
      {icon ?? (
        <span
          className={cn(
            "h-[7px] w-[7px] rounded-full",
            tone === "warning"
              ? "bg-warning"
              : tone === "accent"
                ? "bg-accent"
                : tone === "neutral"
                  ? "bg-text-subtle/60"
                  : "bg-success",
          )}
        />
      )}
      <span className="min-w-0 truncate">{children}</span>
    </span>
  );
}

export function AppTopbar({
  title,
  pill,
  actions,
  hasHero = false,
  maxW = "720px",
}: {
  title: ReactNode;
  pill?: ReactNode;
  actions?: ReactNode;
  /**
   * App-Header-SPEC §1 — pass this when, and only when, the screen renders an
   * in-flow hero `<h1>` carrying THIS SAME title and styled with
   * `HERO_FADE_STYLE`. The bar then hides its own title at rest and docks it as
   * the hero fades out, so exactly one copy of the title is ever on screen.
   *
   * Default `false` keeps the bar title always visible, which is the only safe
   * behaviour for a screen with no hero: /app (Drafts), /app/scenarios and
   * /app/advisor would otherwise sit at rest with no page title anywhere. It is
   * also required for /app/advisor, which scrolls an INNER container — the
   * document never scrolls there, so the reveal would be pinned at 0 forever.
   *
   * Pass a boolean expression, not a constant, on screens whose hero only
   * renders in some states (see /app/settings and /app/audits).
   */
  hasHero?: boolean;
  /**
   * Width of the screen's content column. The bar spans full width (border +
   * frosted bg), but its inner row is centered to this same width so the title
   * sits directly above the content's left edge and the actions above its
   * right edge — instead of the title floating at the far left.
   */
  maxW?: string;
}) {
  const { t } = useTranslation();
  const crumb = useProfileCrumb();
  // App-Header-SPEC §4 — publishes `--hdr-reveal` on <html>. Lives here (not in
  // each page) because every affected screen already renders this bar, so the
  // per-screen change stays a one-line opacity binding on the hero.
  const headerRef = useRef<HTMLElement>(null);
  useHeaderReveal(headerRef);
  return (
    <header ref={headerRef} className="sticky top-0 z-10 border-b border-border bg-bg/85 backdrop-blur-md">
      <div className="mx-auto w-full px-5 md:px-6" style={{ maxWidth: maxW }}>
        {/* Nav #7 — desktop: the crumb is an eyebrow line ABOVE the title row
            (Navigation-Topbar-SPEC §2, variant B). Hidden on the phone, which
            gets its own strip under the bar. */}
        {crumb ? (
          <div className="hidden items-center pt-2.5 md:flex">
            <CrumbInner {...crumb} />
          </div>
        ) : null}

        {/* App-Header-Pill-Placement-SPEC §3/§9.1 — fixed-height, non-wrapping
            row. `flex-nowrap` + column-only `gap-x-2.5` (10px) is what makes the
            old 106px wrap structurally impossible: the pill has a hard 132px
            budget, the title collapses to whatever is left, nothing ever drops
            to a second line. */}
        <div className="flex h-13 w-full flex-nowrap items-center gap-x-2.5 md:h-15">
          {/* Phone: hamburger → nav drawer (Sidebar renders the drawer). */}
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            aria-label={t("nav.more")}
            className="-ml-1.5 grid h-10 w-10 shrink-0 place-items-center rounded-md text-text-muted transition-colors hover:bg-surface-2 hover:text-text md:hidden"
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

          {/* App-Header-Pill-Placement-SPEC §2/§3 — the pill owns the leading
              slot PERMANENTLY (moved from after the title). It never reads
              `--hdr-reveal` and never resizes with it, so its left edge sits at
              the exact same x at rest, mid-dock and docked. `max-w-[132px]` is
              the hard budget from §9.1 — any string that needs more than that
              is not a bar pill (see App-Header-Pill-Placement-SPEC §6). Omitted
              entirely when there is no pill, so the title starts right at the
              pill's x instead of leaving a gap. */}
          {pill ? <div className="max-w-[132px] shrink-0">{pill}</div> : null}

          {/* App-Header-SPEC §4 — with a hero on screen this is invisible at
              rest and docks as the hero fades out. `opacity` never touches
              layout, so the slot keeps its width and neither the pill nor the
              action icons shift. Now AFTER the pill (Pill-Placement-SPEC §3):
              its box is `flex: 1 1 auto; min-width: 0` and already spans the
              leftover space at every reveal value, so revealing it reflows
              nothing — only its ink appears.

              Reduced motion: the hook snaps the reveal 0→1 at 16px, so the
              6px offset only ever exists while the title is fully transparent
              — the translate is never seen, which is what the spec asks for
              ("opacity swap only"). */}
          <h1
            className="min-w-0 flex-1 truncate text-h3 font-semibold"
            style={
              hasHero
                ? {
                    opacity: "var(--hdr-reveal, 0)",
                    transform: "translateY(calc(6px * (1 - var(--hdr-reveal, 0))))",
                  }
                : undefined
            }
          >
            {title}
          </h1>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            {actions}
            <ThemeToggle />
            <Link href="/app/settings" aria-label={t("nav.settings")} className={cn(ICON_BTN, "hidden md:grid")}>
              <IcSettings size={17} />
            </Link>
          </div>
        </div>
      </div>

      {/* Nav #7 — phone: the crumb is a thin strip attached UNDER the bar
          (Navigation-Topbar-SPEC §4), not inline in the tight bar. */}
      {crumb ? (
        <div className="border-t border-border bg-bg/70 md:hidden">
          <div className="mx-auto flex min-h-[34px] w-full items-center px-5" style={{ maxWidth: maxW }}>
            <CrumbInner {...crumb} />
          </div>
        </div>
      ) : null}
    </header>
  );
}
