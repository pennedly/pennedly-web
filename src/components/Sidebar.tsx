"use client";

// Left navigation for the whole /app area. Desktop (≥ md): a fixed left column —
// brand (pen mark + "Drafting partner") over icon-nav groups, with the account
// switcher + profile menu pinned at the bottom. Phone (≤ md): no persistent
// sidebar — the single per-screen AppTopbar carries a hamburger that opens this
// same nav as a slide-in drawer (brand + nav + account foot). Hamburger ↔ drawer
// coordinate through the shared `mobileNav` store. Rendered once by
// src/app/app/layout.tsx; individual pages no longer carry their own header/nav.
// Tester-only sections are hidden unless me.is_tester.

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { clearTokens, fetchComments, fetchMe, getTokens, listAudits, listDrafts, setMyLocale } from "@/lib/api";
import { captureEvent, resetIdentity } from "@/lib/analytics";
import { useSelectedAccountId } from "@/lib/account";
import { setMobileNavOpen, useMobileNavOpen } from "@/lib/mobileNav";
import { getLocale, useTranslation, type MessageKey } from "@/lib/i18n";
import { AccountSwitcher } from "@/components/AccountSwitcher";
import {
  BrandMark,
  IcAt,
  IcAudit,
  IcCalendar,
  IcChart,
  IcBolt,
  IcCompass,
  IcFeed,
  IcReplies,
  IcStudio,
  IcStudy,
  IcPencil,
  IcVoice,
  IcX,
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
  // Which live count to show as a nav badge (§4), if any.
  badgeKey?: "studio" | "replies" | "audits";
};

const GROUPS: { title: MessageKey; items: NavItem[] }[] = [
  {
    title: "nav.group.workspace",
    items: [
      { href: "/app", label: "nav.studio", icon: IcStudio, exact: true, badgeKey: "studio" },
      { href: "/app/calendar", label: "nav.calendar", icon: IcCalendar },
      { href: "/app/feed", label: "dashboard.nav.feed", icon: IcFeed },
      { href: "/app/replies", label: "dashboard.nav.replies", icon: IcReplies, tester: true, badgeKey: "replies" },
      { href: "/app/mentions", label: "dashboard.nav.mentions", icon: IcAt, tester: true },
    ],
  },
  {
    title: "nav.group.insight",
    items: [
      { href: "/app/stats", label: "dashboard.nav.stats", icon: IcChart },
      { href: "/app/audits", label: "dashboard.nav.audits", icon: IcAudit, badgeKey: "audits" },
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
  const navOpen = useMobileNavOpen();
  const [demoParam] = useState(
    () => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("demo") === "1",
  );
  const accountId = useSelectedAccountId();
  // Nav count badges (§4): items waiting on the user for the active account —
  // pending drafts (Studio), comments needing a reply (Replies), un-reviewed
  // audits (Audits). Best-effort; a failed or zero count just hides the badge.
  const [counts, setCounts] = useState<Record<string, number>>({});
  useEffect(() => {
    if (!accountId || !getTokens()) return;
    let cancelled = false;
    (async () => {
      const [d, c, a] = await Promise.allSettled([
        listDrafts(accountId, { status: "pending", limit: 1 }),
        fetchComments(accountId, { limit: 1 }),
        listAudits({ accountId, status: "pending", limit: 1 }),
      ]);
      if (cancelled) return;
      setCounts({
        studio: d.status === "fulfilled" ? (d.value.count ?? 0) : 0,
        replies: c.status === "fulfilled" ? (c.value.status_counts?.new ?? 0) : 0,
        audits: a.status === "fulfilled" ? (a.value.count ?? 0) : 0,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [accountId]);

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
    setMobileNavOpen(false);
  }, [pathname]);

  // Demo review (?demo=1) shows the full tester nav so every item is reviewable;
  // the real app gates Replies/Mentions/Autopilot on me.is_tester.
  const isTester = demoParam ? true : (me?.is_tester ?? false);

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
        <span className="block text-h3 font-semibold leading-none">{t("app.brand")}</span>
        <span className="mt-1 block text-caption text-text-subtle">{t("nav.brand_tagline")}</span>
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
                      {it.badgeKey && (counts[it.badgeKey] ?? 0) > 0 && (
                        <span
                          className={`ml-auto inline-flex h-[18px] min-w-[20px] items-center justify-center rounded-full border border-border bg-surface-2 px-1.5 text-caption font-semibold tabular-nums ${
                            active ? "text-text" : "text-text-subtle"
                          }`}
                        >
                          {counts[it.badgeKey]}
                        </span>
                      )}
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
      {/* Desktop (≥ md): fixed left column. */}
      <aside className="z-30 hidden border-r border-border bg-bg md:fixed md:inset-y-0 md:left-0 md:flex md:w-62 md:flex-col md:px-3.5 md:py-4">
        {brand}
        {nav}
        {bottom}
      </aside>

      {/* Phone (≤ md): slide-in drawer with the same nav, opened by the AppTopbar
          hamburger (via the shared mobileNav store). Same brand + nav + account foot. */}
      {navOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div
            className="absolute inset-0 bg-ink-950/45 backdrop-blur-[1px]"
            style={{ animation: "scrim-in 0.18s var(--ease-standard)" }}
            onClick={() => setMobileNavOpen(false)}
            aria-hidden
          />
          <aside
            className="relative flex w-72 max-w-[82%] flex-col border-r border-border bg-bg px-3.5 py-4 shadow-lg"
            style={{ animation: "drawer-in 0.22s var(--ease-entrance)" }}
          >
            <button
              type="button"
              onClick={() => setMobileNavOpen(false)}
              aria-label="Close"
              className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-md text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
            >
              <IcX size={18} />
            </button>
            {brand}
            {nav}
            {bottom}
          </aside>
        </div>
      )}
    </>
  );
}
