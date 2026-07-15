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

import { logout, fetchComments, fetchMe, getTokens, listAudits, listDrafts, setMyLocale } from "@/lib/api";
import { captureEvent, resetIdentity } from "@/lib/analytics";
import { useSelectedAccountId } from "@/lib/account";
import { resetAccountsPresenceForSignedOutUser } from "@/lib/accounts";
import { setMobileNavOpen, useMobileNavOpen } from "@/lib/mobileNav";
import { getLocale, useTranslation, type MessageKey } from "@/lib/i18n";
import { AccountSwitcher } from "@/components/AccountSwitcher";
import {
  BrandMark,
  IcAdvisor,
  IcArrowLeft,
  IcAt,
  IcAudit,
  IcCalendar,
  IcChart,
  IcBolt,
  IcCompass,
  IcFeed,
  IcReplies,
  IcStudio,
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
      // «Агент» (was «Советник», moved here from Insight 2026-07-15): the advisor is
      // now an ACTION layer — you tell it what you want and it applies it in one click
      // (routines, automation, scheduling…), so it belongs in the do-work group, not
      // analytics. First = the "tell the agent what you need" entry point.
      { href: "/app/advisor", label: "dashboard.nav.advisor", icon: IcAdvisor, tester: true },
      // «Автопилот» sits directly under Agent: it is the main automation action
      // surface. `/app` keeps the Studio route but is labeled «Черновики» in nav,
      // matching what the user mostly finds there after generation/scheduling.
      { href: "/app/scenarios", label: "dashboard.nav.autopilot", icon: IcBolt, tester: true },
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
      { href: "/app/patterns/explore", label: "dashboard.nav.explore", icon: IcCompass },
    ],
  },
  {
    // «Бренд» — its own section for the account-bound «Voice» (DNA + the
    // «Anti-robot» tab). Can't live in global Settings (voice is per-account);
    // Autopilot moved up to Workspace, so the old «Voice & automation» group is
    // now just this. «Style» is the «Anti-robot» tab inside Voice (retired route).
    title: "nav.group.brand",
    items: [{ href: "/app/role-book", label: "dashboard.nav.voice", icon: IcVoice }],
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
  // pending POST drafts (Studio), comments needing a reply (Replies), un-reviewed
  // audits (Audits). Best-effort; a failed or zero count just hides the badge.
  // Kept fresh — refetch on account switch, on route change, on tab refocus,
  // and on a slow interval — so a cleared item (e.g. a published draft) doesn't
  // leave its badge stuck forever (it previously loaded once per account).
  // NB: the Studio badge counts ONLY `threads_post` drafts (real count, up to 50)
  // — never the account-level auto-reply sweep's `comment_reply` byproducts (SKIP
  // / gated / failed), which aren't a Studio to-do and used to leave a permanent
  // phantom "1". (`count` is the row count for the page, so the limit caps it.)
  const [counts, setCounts] = useState<Record<string, number>>({});
  useEffect(() => {
    if (!accountId || !getTokens()) return;
    let cancelled = false;
    const refresh = async () => {
      const [d, c, a] = await Promise.allSettled([
        listDrafts(accountId, { status: "pending", contentType: "threads_post", limit: 50 }),
        fetchComments(accountId, { limit: 1 }),
        listAudits({ accountId, status: "pending", limit: 1 }),
      ]);
      if (cancelled) return;
      setCounts({
        studio: d.status === "fulfilled" ? (d.value.count ?? 0) : 0,
        replies: c.status === "fulfilled" ? (c.value.needs_attention ?? 0) : 0,
        audits: a.status === "fulfilled" ? (a.value.count ?? 0) : 0,
      });
    };
    void refresh();
    const onFocus = () => {
      if (document.visibilityState !== "hidden") void refresh();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    const timer = setInterval(() => void refresh(), 60_000);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
      clearInterval(timer);
    };
  }, [accountId, pathname]);

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
    resetAccountsPresenceForSignedOutUser();
    // Fire-and-forget: logout() clears the local tokens synchronously first,
    // then best-effort revokes the server session (keepalive survives the
    // redirect). Don't await it, so a slow/offline network can't stall the
    // sign-out — matches AccountDashboard's logout.
    void logout();
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

  // Nav #7 — "back to the account dashboard" from any profile screen: an explicit
  // «← Аккаунт · Дашборд аккаунта» row above the nav groups (the эталон's
  // sidebar-first-row placement, consistent on desktop + the mobile drawer). The
  // account level is tester-only for now, so it shows only for testers; the mark
  // is the filled account square (level-shape language).
  const acctMono = (me?.tenant.name ?? "?").trim().slice(0, 2).toUpperCase();
  const backToAccount = isTester ? (
    <Link
      href="/app/account"
      className="mx-3 mb-2 flex items-center gap-2.5 rounded-md border border-border bg-surface-2 px-2.5 py-2 transition-colors hover:border-text/20 hover:bg-surface"
    >
      <IcArrowLeft size={16} className="shrink-0 text-text-subtle" />
      <span className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-sm bg-primary text-[12px] font-semibold text-primary-foreground">
        {acctMono}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-small font-semibold leading-tight text-text">{t("acc.crumb_account")}</span>
        <span className="block truncate text-caption leading-tight text-text-subtle">{t("acc.nav_back_dash")}</span>
      </span>
    </Link>
  ) : null;

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
        {backToAccount}
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
              aria-label={t("a11y.close")}
              className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-md text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
            >
              <IcX size={18} />
            </button>
            {brand}
            {backToAccount}
            {nav}
            {bottom}
          </aside>
        </div>
      )}
    </>
  );
}
