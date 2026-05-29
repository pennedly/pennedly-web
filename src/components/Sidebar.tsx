"use client";

// Cloudflare-style left navigation for the whole /app area. Desktop: a
// fixed left column — sections grouped top→down, with the account
// switcher + language + logout pinned at the bottom. Mobile: a slim top
// bar with a hamburger that opens the same nav as a drawer. Rendered once
// by src/app/app/layout.tsx; individual pages no longer carry their own
// header/nav. Tester-only sections are hidden unless me.is_tester.

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { clearTokens, fetchMe, getTokens, setMyLocale } from "@/lib/api";
import { captureEvent, resetIdentity } from "@/lib/analytics";
import { getLocale, useTranslation, type MessageKey } from "@/lib/i18n";
import { AccountSwitcher } from "@/components/AccountSwitcher";
import type { Me } from "@/lib/types";

type NavItem = {
  href: string;
  label: MessageKey;
  exact?: boolean;
  tester?: boolean;
};

const GROUPS: { title: MessageKey; items: NavItem[] }[] = [
  {
    title: "nav.group.content",
    items: [
      { href: "/app", label: "nav.studio", exact: true },
      { href: "/app/feed", label: "dashboard.nav.feed" },
      { href: "/app/replies", label: "dashboard.nav.replies", tester: true },
      { href: "/app/mentions", label: "dashboard.nav.mentions", tester: true },
    ],
  },
  {
    title: "nav.group.growth",
    items: [
      { href: "/app/stats", label: "dashboard.nav.stats" },
      { href: "/app/audits", label: "dashboard.nav.audits" },
      { href: "/app/patterns", label: "dashboard.nav.patterns" },
      {
        href: "/app/autopilot",
        label: "dashboard.nav.autopilot",
        tester: true,
      },
    ],
  },
  {
    title: "nav.group.voice",
    items: [
      { href: "/app/role-book", label: "dashboard.nav.voice" },
      { href: "/app/style-rules", label: "dashboard.nav.style_rules" },
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
    <Link
      href="/app"
      className="flex items-center gap-2 px-4 h-14 shrink-0 border-b border-zinc-200 dark:border-zinc-800"
    >
      <span className="text-lg font-semibold tracking-tight">Pennedly</span>
    </Link>
  );

  const nav = (
    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
      {GROUPS.map((group) => {
        const items = group.items.filter((it) => !it.tester || isTester);
        if (items.length === 0) return null;
        return (
          <div key={group.title}>
            <p className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-600">
              {t(group.title)}
            </p>
            <ul className="space-y-0.5">
              {items.map((it) => {
                const active = isActive(pathname, it.href, it.exact);
                return (
                  <li key={it.href}>
                    <Link
                      href={it.href}
                      className={`block rounded-md px-2.5 py-1.5 text-sm capitalize transition-colors ${
                        active
                          ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-medium"
                          : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
                      }`}
                    >
                      {t(it.label)}
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
    <div className="border-t border-zinc-200 dark:border-zinc-800 px-2 py-2 space-y-1 shrink-0">
      {/* Account switcher — opens upward (it sits at the very bottom) */}
      <AccountSwitcher />
      {/* Profile / settings / language / logout */}
      <ProfileMenu me={me} onLogout={onLogout} />
    </div>
  );

  return (
    <>
      {/* Desktop: fixed left column */}
      <aside className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:w-56 z-30 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800">
        {brand}
        {nav}
        {bottom}
      </aside>

      {/* Mobile: top bar */}
      <div className="md:hidden sticky top-0 z-30 flex items-center justify-between h-14 px-4 bg-white/90 dark:bg-zinc-950/90 backdrop-blur border-b border-zinc-200 dark:border-zinc-800">
        <Link href="/app" className="text-lg font-semibold tracking-tight">
          Pennedly
        </Link>
        <button
          onClick={() => setMobileOpen((o) => !o)}
          aria-label="menu"
          className="p-2 -mr-2 text-zinc-600 dark:text-zinc-300"
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
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <aside className="relative flex flex-col w-64 max-w-[80%] bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 shadow-xl">
            {brand}
            {nav}
            {bottom}
          </aside>
        </div>
      )}
    </>
  );
}

// The bottom-left user area: profile (who's logged in), language, settings,
// and log out — in one menu that opens UPWARD (it sits at the very bottom).
function ProfileMenu({
  me,
  onLogout,
}: {
  me: Me | null;
  onLogout: () => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const initial = (me?.email?.[0] ?? "?").toUpperCase();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
      >
        <span className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-xs font-semibold shrink-0">
          {initial}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-xs font-medium truncate">
            {me?.email ?? "…"}
          </span>
          {me && (
            <span className="block text-[10px] text-zinc-500 truncate">
              {me.tenant.plan_tier}
            </span>
          )}
        </span>
        <span className="text-zinc-400 text-xs" aria-hidden>
          ⋯
        </span>
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute bottom-full mb-1 left-0 right-0 z-40 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg py-1">
            <Link
              href="/app/settings"
              onClick={() => setOpen(false)}
              className="block px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              {t("nav.settings")}
            </Link>
            <div className="my-1 border-t border-zinc-200 dark:border-zinc-800" />
            <button
              type="button"
              onClick={onLogout}
              className="w-full text-left px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              {t("dashboard.nav.logout")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
