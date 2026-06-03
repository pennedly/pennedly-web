"use client";

// Left navigation for the whole /app area. Desktop: a fixed left column —
// brand (pen mark + "Drafting partner") over icon-nav groups, with the account
// switcher + profile menu pinned at the bottom. Mobile: a slim top bar with a
// hamburger that opens the same nav as a drawer. Rendered once by
// src/app/app/layout.tsx; individual pages no longer carry their own
// header/nav. Tester-only sections are hidden unless me.is_tester.

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { clearTokens, fetchMe, getTokens, setMyLocale } from "@/lib/api";
import { captureEvent, resetIdentity } from "@/lib/analytics";
import { getLocale, useTranslation, type MessageKey } from "@/lib/i18n";
import { AccountSwitcher } from "@/components/AccountSwitcher";
import {
  BrandMark,
  IcAt,
  IcAudit,
  IcChart,
  IcBolt,
  IcCompass,
  IcFeed,
  IcReplies,
  IcStudio,
  IcStudy,
  IcPencil,
  IcVoice,
  type IconProps,
} from "@/components/icons";
import type { Me } from "@/lib/types";

type IconCmp = (p: IconProps) => React.ReactElement;

type NavItem = {
  href: string;
  label: MessageKey;
  icon: IconCmp;
  exact?: boolean;
  tester?: boolean;
};

const GROUPS: { title: MessageKey; items: NavItem[] }[] = [
  {
    title: "nav.group.workspace",
    items: [
      { href: "/app", label: "nav.studio", icon: IcStudio, exact: true },
      { href: "/app/feed", label: "dashboard.nav.feed", icon: IcFeed },
      { href: "/app/replies", label: "dashboard.nav.replies", icon: IcReplies, tester: true },
      { href: "/app/mentions", label: "dashboard.nav.mentions", icon: IcAt, tester: true },
    ],
  },
  {
    title: "nav.group.insight",
    items: [
      { href: "/app/stats", label: "dashboard.nav.stats", icon: IcChart },
      { href: "/app/audits", label: "dashboard.nav.audits", icon: IcAudit },
      // `exact` so Pattern study doesn't also light up on the /explore child.
      { href: "/app/patterns", label: "dashboard.nav.patterns", icon: IcStudy, exact: true },
      { href: "/app/patterns/explore", label: "dashboard.nav.explore", icon: IcCompass },
    ],
  },
  {
    title: "nav.group.voice_automation",
    items: [
      { href: "/app/role-book", label: "dashboard.nav.voice", icon: IcVoice },
      { href: "/app/style-rules", label: "dashboard.nav.style_rules", icon: IcPencil },
      { href: "/app/autopilot", label: "dashboard.nav.autopilot", icon: IcBolt, tester: true },
    ],
  },
];

function isActive(pathname: string, href: string, exact?: boolean): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const [me, setMe] = useState<Me | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!getTokens()) return;
    fetchMe()
      .then((m) => {
        setMe(m);
        // One-way sync: the browser's UI language is the source of truth;
        // mirror it to the server so cron-time copy (the weekly audit)
        // is written in the same language without the user re-picking it.
        const active = getLocale();
        if (m.locale !== active) setMyLocale(active).catch(() => {});
      })
      .catch(() => {});
  }, []);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const isTester = me?.is_tester ?? false;

  function onLogout() {
    captureEvent("ui.logout_clicked");
    resetIdentity();
    clearTokens();
    router.push("/app/login");
  }

  const brand = (
    <Link href="/app" className="flex items-center gap-2.5 px-2 pb-4 pt-1">
      <BrandMark size={34} radius={9} className="shadow-sm" />
      <span className="min-w-0">
        <span className="block text-h3 font-semibold leading-none">
          {t("app.brand")}
        </span>
        <span className="mt-1 block text-caption text-text-subtle">
          {t("nav.brand_tagline")}
        </span>
      </span>
    </Link>
  );

  const nav = (
    <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-2">
      {GROUPS.map((group) => {
        const items = group.items.filter((it) => !it.tester || isTester);
        if (items.length === 0) return null;
        return (
          <div key={group.title}>
            <p className="mb-1.5 px-3 text-caption font-semibold uppercase tracking-[0.06em] text-text-subtle">
              {t(group.title)}
            </p>
            <ul className="space-y-0.5">
              {items.map((it) => {
                const active = isActive(pathname, it.href, it.exact);
                const Icon = it.icon;
                return (
                  <li key={it.href}>
                    <Link
                      href={it.href}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-small capitalize transition-colors ${
                        active
                          ? "bg-surface-2 font-semibold text-text"
                          : "font-medium text-text-muted hover:bg-surface-2 hover:text-text"
                      }`}
                    >
                      <Icon size={16} className="shrink-0" />
                      <span className="truncate">{t(it.label)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );

  const bottom = (
    <div className="shrink-0 border-t border-border px-2 py-2">
      {/* Active account + profile in one control (switch / connect / settings /
          log out) — opens upward, it sits at the very bottom. */}
      <AccountSwitcher me={me} onLogout={onLogout} />
    </div>
  );

  return (
    <>
      {/* Desktop: fixed left column */}
      <aside className="z-30 hidden border-r border-border bg-bg md:fixed md:inset-y-0 md:left-0 md:flex md:w-62 md:flex-col md:px-3.5 md:py-4">
        {brand}
        {nav}
        {bottom}
      </aside>

      {/* Mobile: top bar */}
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-bg/90 px-4 backdrop-blur md:hidden">
        <Link href="/app" className="flex items-center gap-2">
          <BrandMark size={26} radius={7} />
          <span className="text-h3 font-semibold">{t("app.brand")}</span>
        </Link>
        <button
          onClick={() => setMobileOpen((o) => !o)}
          aria-label="menu"
          className="-mr-2 p-2 text-text-muted"
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
            {mobileOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile: drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div
            className="absolute inset-0 bg-ink-950/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <aside className="relative flex w-64 max-w-[80%] flex-col border-r border-border bg-bg px-3.5 py-4 shadow-lg">
            {brand}
            {nav}
            {bottom}
          </aside>
        </div>
      )}
    </>
  );
}
