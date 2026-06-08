"use client";

// Left navigation for the whole /app area. Desktop (≥ md): a fixed left column —
// brand (pen mark + "Drafting partner") over icon-nav groups, with the account
// switcher + profile menu pinned at the bottom. Phone (≤ md): no sidebar — a
// bottom tab bar (the four Workspace destinations + More) plus a "More" drawer
// (the remaining nav groups + appearance + Settings + Log out); the per-screen
// AppTopbar is the single top bar, and its avatar opens the account sheet.
// Rendered once by src/app/app/layout.tsx; individual pages no longer carry
// their own header/nav. Tester-only sections are hidden unless me.is_tester.

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { clearTokens, fetchComments, fetchMe, getTokens, listAudits, listDrafts, setMyLocale } from "@/lib/api";
import { captureEvent, resetIdentity } from "@/lib/analytics";
import { useSelectedAccountId } from "@/lib/account";
import { getLocale, useTranslation, type MessageKey } from "@/lib/i18n";
import { AccountSwitcher } from "@/components/AccountSwitcher";
import { MobileSheet } from "@/components/MobileSheet";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  BrandMark,
  IcAt,
  IcAudit,
  IcChart,
  IcBolt,
  IcCompass,
  IcFeed,
  IcLogout,
  IcMore,
  IcMoon,
  IcReplies,
  IcSettings,
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
  // Which live count to show as a nav badge (§4), if any.
  badgeKey?: "studio" | "replies" | "audits";
};

const GROUPS: { title: MessageKey; items: NavItem[] }[] = [
  {
    title: "nav.group.workspace",
    items: [
      { href: "/app", label: "nav.studio", icon: IcStudio, exact: true, badgeKey: "studio" },
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
  const [moreOpen, setMoreOpen] = useState(false);
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

  // Close the "More" drawer whenever the route changes.
  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  // Demo review (?demo=1) shows the full tester nav so every tab/state is
  // reviewable; the real app gates Replies/Mentions/Autopilot on me.is_tester.
  const isTester = demoParam ? true : (me?.is_tester ?? false);
  // Bottom tab bar = the four Workspace destinations (tester-gated ones drop out
  // for non-testers, collapsing the bar) + a More tab; the "More" drawer carries
  // the remaining nav groups. "More" is active whenever no Workspace tab is.
  const tabItems = GROUPS[0].items.filter((it) => !it.tester || isTester);
  const moreGroups = GROUPS.slice(1);
  const moreActive = !tabItems.some((it) => isActive(pathname, it.href, it.exact));

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
      {/* Desktop: fixed left column */}
      <aside className="z-30 hidden border-r border-border bg-bg md:fixed md:inset-y-0 md:left-0 md:flex md:w-62 md:flex-col md:px-3.5 md:py-4">
        {brand}
        {nav}
        {bottom}
      </aside>

      {/* Phone (≤ md): bottom tab bar — Workspace destinations + More. Active tab
          is ink (matching the sidebar); unread/queue counts ride the icon. */}
      <nav
        aria-label={t("nav.group.workspace")}
        className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-bg/90 backdrop-blur-md md:hidden"
        style={{ height: "calc(58px + env(safe-area-inset-bottom))", paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {tabItems.map((it) => {
          const active = isActive(pathname, it.href, it.exact);
          const Icon = it.icon;
          const badge = it.badgeKey ? (counts[it.badgeKey] ?? 0) : 0;
          return (
            <Link
              key={it.href}
              href={it.href}
              aria-current={active ? "page" : undefined}
              className={`relative flex flex-1 flex-col items-center justify-center gap-1 ${
                active ? "text-text" : "text-text-subtle"
              }`}
            >
              <span className="relative">
                <Icon size={24} />
                {badge > 0 && (
                  <span className="absolute -right-2.5 -top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full border-[1.5px] border-bg bg-accent px-1 text-[10px] font-semibold leading-none text-accent-foreground tabular-nums">
                    {badge}
                  </span>
                )}
              </span>
              <span className={`text-[11px] capitalize leading-none ${active ? "font-semibold" : "font-medium"}`}>
                {t(it.label)}
              </span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          aria-label={t("nav.more")}
          aria-current={moreActive ? "page" : undefined}
          className={`relative flex flex-1 flex-col items-center justify-center gap-1 ${
            moreActive ? "text-text" : "text-text-subtle"
          }`}
        >
          <IcMore size={24} />
          <span className={`text-[11px] capitalize leading-none ${moreActive ? "font-semibold" : "font-medium"}`}>
            {t("nav.more")}
          </span>
        </button>
      </nav>

      {/* Phone: "More" drawer — remaining nav groups + appearance + Settings + Log out. */}
      {moreOpen && (
        <MobileSheet title={t("nav.more")} onClose={() => setMoreOpen(false)}>
          {moreGroups.map((group) => {
            const items = group.items.filter((it) => !it.tester || isTester);
            if (items.length === 0) return null;
            return (
              <div key={group.title} className="mb-1">
                <p className="px-2.5 pb-1 pt-3 text-caption font-semibold uppercase tracking-[0.06em] text-text-subtle">
                  {t(group.title)}
                </p>
                {items.map((it) => {
                  const active = isActive(pathname, it.href, it.exact);
                  const Icon = it.icon;
                  const badge = it.badgeKey ? (counts[it.badgeKey] ?? 0) : 0;
                  return (
                    <Link
                      key={it.href}
                      href={it.href}
                      onClick={() => setMoreOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center gap-3 rounded-md px-2.5 py-2.5 text-body capitalize transition-colors ${
                        active ? "bg-surface-2 font-semibold text-text" : "font-medium text-text active:bg-surface-2"
                      }`}
                    >
                      <Icon size={20} className="shrink-0 text-text-muted" />
                      <span className="flex-1 truncate">{t(it.label)}</span>
                      {badge > 0 && (
                        <span className="inline-flex h-[18px] min-w-[20px] items-center justify-center rounded-full border border-border bg-surface-2 px-1.5 text-caption font-semibold tabular-nums text-text-subtle">
                          {badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            );
          })}

          <div className="my-2 h-px bg-border" />

          {/* Appearance (light / dark) */}
          <div className="flex items-center gap-3 px-2.5 py-1.5">
            <IcMoon size={20} className="shrink-0 text-text-muted" />
            <span className="flex-1 text-body">{t("shell.toggle_theme")}</span>
            <ThemeToggle />
          </div>
          <Link
            href="/app/settings"
            onClick={() => setMoreOpen(false)}
            className="flex items-center gap-3 rounded-md px-2.5 py-2.5 text-small text-text transition-colors active:bg-surface-2"
          >
            <IcSettings size={18} className="shrink-0 text-text-subtle" /> {t("nav.settings")}
          </Link>
          <button
            type="button"
            onClick={() => {
              setMoreOpen(false);
              onLogout();
            }}
            className="flex w-full items-center gap-3 rounded-md px-2.5 py-2.5 text-left text-small text-danger transition-colors active:bg-danger/10"
          >
            <IcLogout size={18} className="shrink-0" /> {t("dashboard.nav.logout")}
          </button>
        </MobileSheet>
      )}
    </>
  );
}
