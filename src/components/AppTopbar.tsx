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
  const crumb = useProfileCrumb();
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-bg/85 backdrop-blur-md">
      <div className="mx-auto w-full px-5 md:px-6" style={{ maxWidth: maxW }}>
        {/* Nav #7 — desktop: the crumb is an eyebrow line ABOVE the title row
            (Navigation-Topbar-SPEC §2, variant B). Hidden on the phone, which
            gets its own strip under the bar. */}
        {crumb ? (
          <div className="hidden items-center pt-2.5 md:flex">
            <CrumbInner {...crumb} />
          </div>
        ) : null}

        <div className="flex h-13 w-full items-center gap-3 max-md:h-auto max-md:min-h-13 max-md:py-1.5 md:h-15">
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

          {/* Title + pill share one flexible group so a long pill drops to a
              second line instead of shoving the title to zero width and the
              theme toggle off the screen (cockpit spec: «на длинных локалях
              падает ниже»; the actions block is `flex: 0 0 auto` in the эталон). */}
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="truncate text-h3 font-semibold">{title}</h1>
            {pill}
          </div>
          <div className="flex shrink-0 items-center gap-2">
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
