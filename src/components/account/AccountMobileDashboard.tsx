"use client";

// Account dashboard V3 «Советник» — MOBILE (phone, below the `md` breakpoint).
// The phone sibling of AccountDashboard.tsx: it renders the SAME shared V3 body
// (<V3Body/>, width-adaptive via container queries) under the mobile chrome — a
// top bar (hamburger · title · profiles pill · theme) + a bottom-docked flat
// profile switcher + a left nav drawer + a login sheet. Same data contract
// (MeAccountResponse) + the same nav actions (useAccountNav), so the two
// breakpoints stay in lock-step; only the chrome differs.
//
// Decision C (advisor routing): the drawer has NO «Советник» row — the dashboard
// is the advisor's home; the ask line / starters / recos route into the chat.
//
// The .ma-* / .m-* chrome classes are themed by account-mobile.css +
// account-mobile-shell.css; the V3 body by account-v3.css.

import { useEffect, useState } from "react";

import {
  BrandMark as BrandLogo,
  IcCheck,
  IcChevDown,
  IcLayers,
  IcLogout,
  IcMoon,
  IcOverview,
  IcPlus,
  IcSettings,
  IcSun,
  IcX,
} from "@/components/icons";
import { useSelectedAccountId } from "@/lib/account";
import type { AccountProfile, AdvisorData, MeAccountResponse } from "@/lib/types";

import { useAccountNav, useChromeIdentity, V3Body } from "./AccountDashboard";
import type { AccountPage, Nav, Plural, T } from "./AccountDashboard";
// Real network logos + the add-flow bottom sheet (shared with desktop/empty).
import { ConnectNetworkSheet, NetLogo } from "./networks";

// ── shared helpers (mirror AccountDashboard.tsx) ─────────────────────────────
const NET_LABEL: Record<string, string> = { threads: "Threads", linkedin: "LinkedIn" };

function initials(name: string | null, handle: string | null): string {
  // Word-initials like the эталон monograms, stripping a leading '@' so a
  // name-less handle never leaks «@F» (mirrors AccountDashboard.initials).
  const s = (name || handle || "?").replace(/^@/, "").trim();
  const parts = s.split(/\s+/).filter(Boolean);
  const out = parts.length >= 2 ? parts[0][0] + parts[1][0] : s.slice(0, 2);
  return out.toUpperCase() || "?";
}

// ── marks: account (filled square) · brand (outlined square) · profile (round) ──
function AcctMark({ mono, cls = "" }: { mono: string; cls?: string }) {
  return <span className={`ma-acctmark ${cls}`.trim()}>{mono}</span>;
}
function BrandMark({ mono, cls = "" }: { mono: string; cls?: string }) {
  return <span className={`ma-brandmark ${cls}`.trim()}>{mono}</span>;
}
function NetBadge({ network }: { network: string }) {
  return (
    <span className={`ma-net ma-net--${network}`} title={NET_LABEL[network] || network}>
      {NetLogo({ network, s: 11, bold: true }) ?? "•"}
    </span>
  );
}
function Avatar({ p, cls = "ma-av" }: { p: AccountProfile; cls?: string }) {
  return (
    <span className={cls}>
      {p.avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.avatar} alt="" />
      ) : (
        <span className="mono">{initials(p.name, p.handle)}</span>
      )}
      <NetBadge network={p.network} />
    </span>
  );
}

// ── flat profile switcher: bottom-docked button + sheet ──────────────────────
function SwitcherButton({ data, t, plural, onOpen }: { data: MeAccountResponse; t: T; plural: Plural; onOpen: () => void }) {
  const allProfiles = data.brands.flatMap((b) => b.profiles);
  // The count + avatar stack reflect LIVE profiles only — a disconnected profile
  // is a reconnect target, not an active profile.
  const live = allProfiles.filter((p) => !p.disconnected);
  const stack = live.slice(0, 3);
  return (
    <button className="ma-swbtn" type="button" onClick={onOpen}>
      <span className="ma-swbtn-stack">
        {stack.map((p) => (
          <Avatar key={p.id} p={p} />
        ))}
      </span>
      <span className="ma-swbtn-who">
        <span className="ma-swbtn-t">{t("acc.sw_all")}</span>
        <span className="ma-swbtn-s">
          {live.length} {plural("profiles", live.length)}
        </span>
      </span>
      <span className="ma-swbtn-chev">
        <IcChevDown size={16} className="rotate-180" />
      </span>
    </button>
  );
}

function SwitcherRow({ p, active, t, nav, onDone }: { p: AccountProfile; active: boolean; t: T; nav: Nav; onDone: () => void }) {
  // Disconnected → non-navigable, reconnects instead of opening a dead studio.
  if (p.disconnected) {
    return (
      <button className="ma-sw-row ma-sw-row--disc" type="button" onClick={() => { onDone(); nav.connectThreads(); }}>
        <Avatar p={p} cls="ma-sw-av" />
        <span className="ma-sw-who">
          <span className="ma-sw-nm">{p.handle || p.name}</span>
          <span className="ma-sw-hd">{t("acc.disc_pill")}</span>
        </span>
        <span className="ma-sw-reconnect">{t("acc.reconnect")}</span>
      </button>
    );
  }
  const dotCls =
    p.sync_status === "error" ? " ma-sw-stat--error" : p.sync_status === "importing" ? " ma-sw-stat--importing" : "";
  return (
    <button className="ma-sw-row" type="button" onClick={() => { onDone(); nav.openProfile(p.id, "studio"); }}>
      <Avatar p={p} cls="ma-sw-av" />
      <span className="ma-sw-who">
        <span className="ma-sw-nm">{p.handle || p.name}</span>
        <span className="ma-sw-hd">{NET_LABEL[p.network] || p.network}</span>
      </span>
      {active ? (
        <span className="ma-sw-check">
          <IcCheck size={17} />
        </span>
      ) : (
        <span className={`ma-sw-stat${dotCls}`} />
      )}
    </button>
  );
}

function SwitcherSheet({ data, t, nav, onClose }: { data: MeAccountResponse; t: T; nav: Nav; onClose: () => void }) {
  const multi = data.scope.show_brand_level;
  const selected = useSelectedAccountId();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <>
      <button className="m-scrim" type="button" tabIndex={-1} aria-hidden onClick={onClose} />
      <div className="m-sheet" role="dialog" aria-modal="true" aria-label={t("acc.sw_all")}>
        <div className="m-sheet-body">
          <div className="m-sheet-grip" />
          <div className="m-sheet-head">
            <div className="m-sheet-title">{t("acc.sw_all")}</div>
            <button className="m-sheet-close" type="button" aria-label={t("a11y.close")} onClick={onClose}>
              <IcX size={16} />
            </button>
          </div>
          {multi ? (
            data.brands.map((b) => (
              <div key={b.id}>
                <div className="ma-sw-brandcap">
                  <BrandMark mono={initials(b.name, null)} />
                  <span className="t">{b.name}</span>
                </div>
                {b.profiles.map((p) => (
                  <SwitcherRow key={p.id} p={p} active={p.id === selected} t={t} nav={nav} onDone={onClose} />
                ))}
              </div>
            ))
          ) : (
            <>
              <div className="ma-sw-cap">{t("acc.sw_jump")}</div>
              {data.brands.flatMap((b) => b.profiles).map((p) => (
                <SwitcherRow key={p.id} p={p} active={p.id === selected} t={t} nav={nav} onDone={onClose} />
              ))}
            </>
          )}
          <button className="ma-sw-row" type="button" onClick={() => { onClose(); nav.addProfile(); }}>
            <span className="ma-sw-av ma-sw-av--add">
              <IcPlus size={16} />
            </span>
            <span className="ma-sw-who">
              <span className="ma-sw-nm">{t("acc.sw_connect")}</span>
            </span>
          </button>
        </div>
      </div>
    </>
  );
}

// ── nav drawer (hamburger) + login foot — decision C: no «Советник» row ──────
const NAV_ICONS: Record<string, (p: { size?: number }) => React.JSX.Element> = {
  grid: IcOverview,
  layers: IcLayers,
  settings: IcSettings,
  plus: IcPlus,
};

function NavRow({ icon, label, active, badge, extraCls, onClick }: { icon: string; label: string; active?: boolean; badge?: number; extraCls?: string; onClick?: () => void }) {
  const NavIc = NAV_ICONS[icon] ?? IcOverview;
  return (
    // A plain <a> with no href is invisible to keyboard/AT nav (not in the tab
    // order, no Enter/Space activation) — a real <button> gets both for free.
    <button type="button" className={`m-navrow${active ? " m-navrow--active" : ""}${extraCls ? ` ${extraCls}` : ""}`} aria-current={active ? "page" : undefined} onClick={onClick}>
      <span className="m-navrow-ic">
        <NavIc size={20} />
      </span>
      <span className="m-navrow-lbl">{label}</span>
      {badge ? <span className="m-navrow-badge">{badge}</span> : null}
    </button>
  );
}

function NavDrawer({ data, t, nav, onClose, onOpenLogin, active = "dashboard" }: { data: MeAccountResponse; t: T; nav: Nav; onClose: () => void; onOpenLogin: () => void; active?: AccountPage }) {
  const multi = data.scope.brands_count >= 2;
  const go = (route: string) => { onClose(); nav.go(route); };
  const id = useChromeIdentity(data.tenant.name);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <>
      <button className="m-scrim" type="button" tabIndex={-1} aria-hidden onClick={onClose} />
      <aside className="m-drawer" role="dialog" aria-modal="true" aria-label={t("a11y.account_menu")}>
        <div className="m-drawer-head">
          <div className="m-drawer-brand">
            <span className="m-brand-mark">
              <BrandLogo size={28} radius={8} />
            </span>
            <div className="db-id">
              <div className="bn">Pennedly</div>
              <div className="bs">{t("acc.account_word")}</div>
            </div>
          </div>
          <button className="m-drawer-close" type="button" aria-label={t("a11y.close")} onClick={onClose}>
            <IcX size={16} />
          </button>
        </div>
        <div className="m-drawer-scroll">
          <div className="m-navgroup">
            <div className="m-navcap">{t("acc.account_word")}</div>
            <NavRow
              icon="grid"
              label={t("acc.nav_dashboard")}
              active={active === "dashboard"}
              onClick={active === "dashboard" ? onClose : () => go("/app/account")}
            />
            {multi ? (
              <NavRow
                icon="layers"
                label={t("acc.nav_brands")}
                badge={data.scope.brands_count}
                onClick={active === "dashboard" ? onClose : () => go("/app/account")}
              />
            ) : null}
            <NavRow icon="settings" label={t("acc.nav_settings")} active={active === "settings"} onClick={() => go("/app/account/settings")} />
          </div>
          <div className="m-navgroup">
            <NavRow icon="plus" label={t("acc.add_brand_t")} extraCls="ma-navrow-add" onClick={() => { onClose(); nav.addProfile(); }} />
          </div>
        </div>
        <div className="m-drawer-foot">
          <button className="ma-loginctl" type="button" onClick={onOpenLogin}>
            <AcctMark mono={id.mono} />
            <span className="ma-loginctl-who">
              <span className="ma-loginctl-email">{id.email}</span>
              <span className="ma-loginctl-plan">{data.tenant.plan_tier}</span>
            </span>
            <span className="ma-loginctl-chev">
              <IcChevDown size={16} className="rotate-180" />
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}

// ── login sheet (tenant — opened from the drawer foot) ───────────────────────
function LoginSheet({ data, t, nav, onClose }: { data: MeAccountResponse; t: T; nav: Nav; onClose: () => void }) {
  const done = (fn: () => void) => { onClose(); fn(); };
  const id = useChromeIdentity(data.tenant.name);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <>
      <button className="m-scrim" type="button" tabIndex={-1} aria-hidden onClick={onClose} />
      <div className="m-sheet" role="dialog" aria-modal="true" aria-label={t("acc.account_word")}>
        <div className="m-sheet-body">
          <div className="m-sheet-grip" />
          <div className="ma-login-head">
            <div className="ma-login-head-id">
              <div className="ma-login-email">{id.email}</div>
              <span className="ma-login-plan">{data.tenant.plan_tier}</span>
            </div>
            <button className="m-sheet-close" type="button" aria-label={t("a11y.close")} onClick={onClose}>
              <IcX size={16} />
            </button>
          </div>
          <div className="ma-sw-cap">{t("acc.account_word")}</div>
          <button className="ma-login-row" type="button">
            <AcctMark mono={id.mono} />
            <span className="ma-login-who">
              <span className="ma-login-nm">{id.email}</span>
              <span className="ma-login-hd">{data.tenant.plan_tier}</span>
            </span>
            <span className="ma-login-check">
              <IcCheck size={17} />
            </span>
          </button>
          <div className="m-sheet-sep" />
          <button className="ma-login-row ma-login-row--min" type="button" onClick={() => done(() => nav.go("/app/account/settings"))}>
            <span className="ma-login-mini">
              <IcSettings size={16} />
            </span>
            {t("acc.nav_settings")}
          </button>
          <button className="ma-login-row ma-login-row--min" type="button" onClick={() => done(nav.logout)}>
            <span className="ma-login-mini">
              <IcLogout size={16} />
            </span>
            {t("settings.logout")}
          </button>
        </div>
      </div>
    </>
  );
}

// ── mobile top bar (hamburger · title · [profiles pill] · theme) ─────────────
// The dashboard shows the profiles-count pill; the sub-screens (settings,
// advisor) pass their own `title` and drop the pill.
function Topbar({
  data,
  t,
  plural,
  dark,
  onMenu,
  title,
  showPill = true,
  titleAsHeading = true,
}: {
  data: MeAccountResponse;
  t: T;
  plural: Plural;
  dark?: boolean;
  onMenu: () => void;
  title?: string;
  showPill?: boolean;
  // The dashboard's page heading is the advisor VERDICT (v3-verdict h1), so the
  // top-bar title there must NOT be a second h1. Sub-screens (settings/advisor)
  // have no verdict, so they keep the top-bar title as the page h1 (default).
  titleAsHeading?: boolean;
}) {
  const nav = useAccountNav();
  const [themeDark, setThemeDark] = useState(!!dark);
  useEffect(() => {
    if (dark === undefined && typeof document !== "undefined") {
      setThemeDark(document.documentElement.classList.contains("dark"));
    }
  }, [dark]);
  const isDark = dark ?? themeDark;
  const pill = `${data.scope.profiles_count} ${plural("profiles", data.scope.profiles_count)}`;
  return (
    <div className="ma-top">
      <button className="ma-top-menu" type="button" aria-label={t("acc.nav_dashboard")} onClick={onMenu}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
      {titleAsHeading ? (
        <h1 className="ma-top-title">{title ?? t("acc.nav_dashboard")}</h1>
      ) : (
        <div className="ma-top-title">{title ?? t("acc.nav_dashboard")}</div>
      )}
      {showPill ? (
        <span className="ma-top-pill">
          <IcOverview size={12} />
          {pill}
        </span>
      ) : null}
      <div className="ma-top-spacer" />
      <button className="ma-top-ic" type="button" aria-label={t("a11y.toggle_theme")} onClick={() => { nav.toggleTheme(); setThemeDark((d) => !d); }}>
        {isDark ? <IcSun size={16} /> : <IcMoon size={16} />}
      </button>
    </div>
  );
}

// ── shared mobile shell for the sub-screens (settings / advisor) ─────────────
// The account mobile chrome without the dashboard body: top bar (title +
// hamburger + theme, no pill) + the account nav drawer (active row) + the login
// sheet from its foot. `dock` is an optional fixed element (the advisor's docked
// composer). Content goes in `children`; `bare` skips the .ma padding wrapper.
export function AccountMobileShell({
  data,
  t,
  plural,
  title,
  active,
  dark,
  children,
  dock,
  bare,
}: {
  data: MeAccountResponse;
  t: T;
  plural: Plural;
  title: string;
  active: AccountPage;
  dark?: boolean;
  children: React.ReactNode;
  dock?: React.ReactNode;
  bare?: boolean;
}) {
  const baseNav = useAccountNav();
  const [overlay, setOverlay] = useState<null | "drawer" | "login" | "connect">(null);
  const close = () => setOverlay(null);
  const nav = { ...baseNav, addProfile: () => setOverlay("connect") };
  return (
    <div className="acc-mob">
      <Topbar data={data} t={t} plural={plural} dark={dark} title={title} showPill={false} onMenu={() => setOverlay("drawer")} />
      {bare ? children : <div className="ma">{children}</div>}
      {dock}
      {overlay === "drawer" ? (
        <NavDrawer data={data} t={t} nav={nav} active={active} onClose={close} onOpenLogin={() => setOverlay("login")} />
      ) : null}
      {overlay === "login" ? <LoginSheet data={data} t={t} nav={nav} onClose={close} /> : null}
      {overlay === "connect" ? <ConnectNetworkSheet t={t} nav={baseNav} onClose={close} /> : null}
    </div>
  );
}

// ── skeleton (loading) — V3 shape ────────────────────────────────────────────
export function AccountMobileSkeleton() {
  const s = (w: string, h: number, mt = 0) => <div className="v-skel" style={{ width: w, height: h, marginTop: mt }} />;
  return (
    <div className="acc-mob">
      <div className="ma">
        <div className="v3">
          <div className="v3-id">
            {s("34px", 34)}
            {s("150px", 15)}
          </div>
          <section className="v3-hero">
            {s("170px", 14)}
            {s("90%", 26, 16)}
            {s("70%", 26, 8)}
            {s("100%", 44, 16)}
            <div className="v3-recos" style={{ marginTop: 16 }}>
              {s("100%", 60)}
              {s("100%", 60)}
            </div>
          </section>
          <section className="v3-evidence">
            {s("150px", 13)}
            {s("100%", 72, 12)}
          </section>
        </div>
        <div style={{ height: 78 }} />
      </div>
    </div>
  );
}

// ── full mobile dashboard composition (mobile chrome + shared V3 body) ───────
export function AccountMobileDashboard({
  data,
  adv,
  t,
  plural,
  dark,
  onOpenAdvisor,
  onRetry,
}: {
  data: MeAccountResponse;
  adv?: AdvisorData;
  t: T;
  plural: Plural;
  dark?: boolean;
  onOpenAdvisor?: (seed?: string) => void;
  // In-place refetch for the sync-error «Повторить» (C9). Omitted (gallery/demo)
  // → the nav default (full page reload) stays.
  onRetry?: () => void;
}) {
  const baseNav = useAccountNav();
  // One overlay open at a time (sheet | drawer | login | connect), the .m-scrim
  // closes it.
  const [overlay, setOverlay] = useState<null | "switcher" | "drawer" | "login" | "connect">(null);
  const close = () => setOverlay(null);
  // Add-affordances open the network-picker sheet; only its Threads row starts
  // the OAuth (baseNav.connectThreads). Reconnect buttons stay direct.
  const nav = { ...baseNav, addProfile: () => setOverlay("connect"), ...(onRetry ? { retry: onRetry } : {}) };
  return (
    <div className="acc-mob">
      <Topbar data={data} t={t} plural={plural} dark={dark} onMenu={() => setOverlay("drawer")} titleAsHeading={false} />
      <div className="ma">
        <V3Body data={data} adv={adv} t={t} plural={plural} nav={nav} onOpenAdvisor={onOpenAdvisor} />
        <div style={{ height: 78 }} />
      </div>

      <SwitcherButton data={data} t={t} plural={plural} onOpen={() => setOverlay("switcher")} />

      {overlay === "switcher" ? <SwitcherSheet data={data} t={t} nav={nav} onClose={close} /> : null}
      {overlay === "drawer" ? <NavDrawer data={data} t={t} nav={nav} onClose={close} onOpenLogin={() => setOverlay("login")} /> : null}
      {overlay === "login" ? <LoginSheet data={data} t={t} nav={nav} onClose={close} /> : null}
      {overlay === "connect" ? <ConnectNetworkSheet t={t} nav={baseNav} onClose={close} /> : null}
    </div>
  );
}

// ── all-disconnected (had profiles, all now disconnected) — MOBILE ────────────
// Decision C + the unified V3 body: the same dashboard, with no rich advisor
// data → the thin hero detects the all-off portfolio and renders the honest
// «Все профили отключены» reassurance + a reconnect CTA, while the evidence grid
// shows each former profile as a reconnect card + «Подключить ещё аккаунт». No
// separate zeroed screen (that read as "everything's gone").
export function AccountMobileAllDisconnected({
  data,
  t,
  plural,
  dark,
  onOpenAdvisor,
}: {
  data: MeAccountResponse;
  t: T;
  plural: Plural;
  dark?: boolean;
  // Threaded through so the all-off thin hero's «Открыть советника» + ask line
  // route to the chat (not dead controls) — the advisor still answers «how do I
  // reconnect?» with the portfolio disconnected.
  onOpenAdvisor?: (seed?: string) => void;
}) {
  return <AccountMobileDashboard data={data} t={t} plural={plural} dark={dark} onOpenAdvisor={onOpenAdvisor} />;
}
