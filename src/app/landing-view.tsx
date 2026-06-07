"use client";

// Pennedly public landing — the client view rendered by the server wrapper in
// ./page.tsx (which carries this route's metadata + Open Graph card, see
// ./opengraph-image.tsx). Lives in its own file because the theme toggle needs
// client hooks, and `metadata` can only be exported from a Server Component.
//
// Restyled 1:1 to design-export/PennedlyDesign/landing-* (the "product-forward"
// direction, per Landing-SPEC.html): a calm marketing page at the root of
// app.pennedly.com — top bar (brand · language · theme · Sign in), a hero with a
// "Studio" product-peek window (browser chrome + account rail + a composer
// drafting in voice), a bento feature grid, and a legal footer. No app shell.
// Copy LOCALIZES to the visitor's browser language (the i18n store auto-detects
// navigator.language → one of the 8 locales, EN fallback) and a top-bar
// LanguageSwitcher overrides it. The window peek + sample draft are ILLUSTRATIVE
// (not a live feed) and intentionally stay English. Built on the ink-on-paper
// tokens; breakpoints follow the design (881 / 561).
//
// Tester demo: `?demo=1` (dev: anyone; prod: testers via me.is_tester) opens a
// Tweaks panel that drives every state on mock content — dark · sample on/off ·
// viewport web/mobile (rendered in a sized iframe so real media queries fire) ·
// forced interactive states · freeze animations.

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

import { fetchMe, getTokens } from "@/lib/api";
import { cn } from "@/lib/cn";
import {
  TweaksPanel,
  TweakSection,
  TweakToggle,
  TweakRadio,
  useTweaks,
} from "@/components/tweaks/TweaksPanel";
import {
  BrandMark,
  IcArrowRight,
  IcAudit,
  IcBolt,
  IcChart,
  IcCheck,
  IcMail,
  IcMoon,
  IcPencil,
  IcPlus,
  IcReplies,
  IcSparkle,
  IcSun,
  IcUsers,
  IcVoice,
  type IconProps,
} from "@/components/icons";
import { useTranslation, type MessageKey } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { AccountFace } from "@/components/ui/avatar";

const CONTACT_EMAIL = "hello@pennedly.com";

// The hero "Studio" peek is illustrative sample content (NOT a live feed and NOT
// localized chrome) — it shows the product drafting in a sample creator's voice.
const SAMPLE = {
  name: "Zakhar S.",
  handle: "@reganomika1",
  initials: "ZS",
  avatar: "/avatars/zakhar.jpg",
  text: "The fastest way to find your voice online: publish the thing you're slightly embarrassed by. The polished version is everyone's. The embarrassing one is yours.",
  toneTag: "Warm, direct",
  composeNote: "Drafting in Zakhar's voice",
};
// Account-switcher rail: the active account shows the real photo; the others
// stay illustrative monograms (other accounts the creator runs).
const RAIL: { url?: string; initials: string }[] = [
  { url: "/avatars/zakhar.jpg", initials: "ZS" },
  { initials: "TP" },
  { initials: "AR" },
  { initials: "LM" },
];
const WIN_URL = "app.pennedly.com";
const WIN_PATH = "/studio";

// Six capabilities in a bento grid. `span` drives the layout: "wide" = 2 cols,
// "full" = full-width banner row, "" = 1 col. Copy reuses the existing localized
// landing keys (translated across all 8 locales).
const FEATURES: {
  Ico: (p: IconProps) => ReactNode;
  titleKey: MessageKey;
  descKey: MessageKey;
  span: "wide" | "full" | "";
}[] = [
  { Ico: IcVoice, titleKey: "landing.feat_viral_title", descKey: "landing.feat_viral_desc", span: "wide" },
  { Ico: IcReplies, titleKey: "landing.feat_replies_title", descKey: "landing.feat_replies_desc", span: "" },
  { Ico: IcAudit, titleKey: "landing.feat_audits_title", descKey: "landing.feat_audits_desc", span: "" },
  { Ico: IcChart, titleKey: "landing.feat_analytics_title", descKey: "landing.feat_analytics_desc", span: "" },
  { Ico: IcBolt, titleKey: "landing.feat_autopilot_title", descKey: "landing.feat_autopilot_desc", span: "" },
  { Ico: IcUsers, titleKey: "landing.feat_accounts_title", descKey: "landing.feat_accounts_desc", span: "full" },
];

const FOOTER_LINKS: { labelKey: MessageKey; href: string }[] = [
  { labelKey: "landing.footer_privacy", href: "/privacy" },
  { labelKey: "landing.footer_terms", href: "/terms" },
  { labelKey: "landing.footer_data", href: "/data-deletion" },
];

const WRAP = "mx-auto w-full max-w-[1120px] px-5 min-[561px]:px-10";

const RADIAL =
  "radial-gradient(100% 60% at 88% -8%, color-mix(in srgb, var(--color-surface) 60%, transparent) 0%, transparent 52%), var(--color-bg)";

// transform-only entrance (canonical card-in), so the resting state never sticks
// invisible if the animation is interrupted (hidden tab / iframe).
const RISE = { animation: "card-in var(--duration-slow) var(--ease-entrance) both" } as const;

// ── Tester-debug styles (injected only in demo / frame mode) ─────────────────
const FX_STYLE = `
.fx-hover [data-fx="btnprimary"]{background:color-mix(in srgb,var(--color-primary) 88%,var(--color-bg))}
.fx-hover [data-fx="iconbtn"]{background:var(--color-surface-2);color:var(--color-text)}
.fx-hover [data-fx="link"]{color:var(--color-text)}
.fx-hover [data-fx="feat"]{border-color:color-mix(in srgb,var(--color-text) 16%,var(--color-border));box-shadow:var(--shadow-md)}
.fx-active [data-fx="btnprimary"]{transform:translateY(0.5px);background:color-mix(in srgb,var(--color-primary) 80%,var(--color-bg))}
.fx-disabled [data-fx="btnprimary"]{opacity:.5;cursor:not-allowed}
.land-freeze *,.land-freeze *::before,.land-freeze *::after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important}
`;

function DebugStyles() {
  return <style>{FX_STYLE}</style>;
}

// ───────────────────────────── Pieces ───────────────────────────────────────

function ThemeToggle() {
  const [dark, setDark] = useState(false);
  // The no-FOUC script in the root layout sets `.dark` before paint; read it
  // on mount so the icon matches.
  useEffect(() => setDark(document.documentElement.classList.contains("dark")), []);
  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      /* storage disabled — toggle still applies this session */
    }
    setDark(next);
  }
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle theme"
      data-fx="iconbtn"
      className="grid h-[38px] w-[38px] place-items-center rounded-md border border-border bg-surface text-text-muted transition-colors duration-[120ms] ease-[cubic-bezier(0.2,0.7,0.3,1)] hover:bg-surface-2 hover:text-text"
    >
      {dark ? <IcSun size={17} /> : <IcMoon size={16} />}
    </button>
  );
}

// A crisp peek of the product: a browser frame, an account rail, and a composer
// drafting in the sample creator's voice. Illustrative — not a live feed.
function StudioWindow() {
  const { t } = useTranslation();
  return (
    <div
      className="relative overflow-hidden rounded-xl border border-border bg-surface shadow-lg"
      style={RISE}
      aria-hidden
    >
      {/* browser chrome */}
      <div className="flex items-center gap-3 border-b border-border bg-surface-2 px-3.5 py-[11px]">
        <span className="inline-flex gap-1.5">
          <i className="h-2.5 w-2.5 rounded-full bg-border" />
          <i className="h-2.5 w-2.5 rounded-full bg-border" />
          <i className="h-2.5 w-2.5 rounded-full bg-border" />
        </span>
        <span className="mx-auto font-mono text-caption text-text-subtle">
          {WIN_URL}
          <span className="text-text">{WIN_PATH}</span>
        </span>
      </div>
      {/* app: account rail + composer */}
      <div className="flex min-h-[280px]">
        <aside className="flex w-[58px] shrink-0 flex-col items-center gap-2.5 border-r border-border bg-surface-2 py-4">
          {RAIL.map((a, i) => (
            <span
              key={a.initials}
              className={cn(
                "rounded-full border-2 border-transparent p-0.5",
                i === 0 && "border-text",
              )}
            >
              <AccountFace url={a.url} initials={a.initials} size={28} />
            </span>
          ))}
          <span className="grid h-7 w-7 place-items-center rounded-full border border-dashed border-border text-text-subtle">
            <IcPlus size={15} />
          </span>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col px-5 pb-4 pt-[18px]">
          <div className="flex items-center gap-[11px]">
            <AccountFace url={SAMPLE.avatar} initials={SAMPLE.initials} size={34} />
            <div className="min-w-0 flex-1">
              <div className="text-small font-semibold leading-[1.2]">{SAMPLE.name}</div>
              <div className="mt-px text-caption text-text-subtle">{SAMPLE.handle}</div>
            </div>
            <span className="inline-flex shrink-0 items-center gap-[5px] rounded-full border border-border bg-surface px-[9px] py-[3px] text-caption font-medium text-text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-warning" /> {t("landing.spec_draft")}
            </span>
          </div>
          <p className="mt-3.5 text-body leading-[1.55] text-text [text-wrap:pretty]">
            {SAMPLE.text}
            <span className="ml-0.5 inline-block h-[1.05em] w-0.5 translate-y-0.5 bg-accent align-text-bottom [animation:caret-blink_1.1s_steps(1)_infinite]" />
          </p>
          <div className="mt-3.5 flex flex-wrap gap-[7px]">
            <span className="inline-flex items-center gap-[5px] rounded-full border border-[color-mix(in_srgb,var(--color-accent)_26%,transparent)] bg-[color-mix(in_srgb,var(--color-accent)_10%,var(--color-surface))] px-2.5 py-1 text-caption font-medium text-accent">
              <IcSparkle size={12} /> {t("landing.spec_voice")}
            </span>
            <span className="inline-flex items-center gap-[5px] rounded-full border border-border bg-surface-2 px-2.5 py-1 text-caption font-medium text-text-muted">
              <IcVoice size={12} /> {SAMPLE.toneTag}
            </span>
          </div>
          <div className="mt-auto flex items-center gap-2 pt-4">
            <span className="text-caption text-text-subtle">{SAMPLE.composeNote}</span>
            <span className="flex-1" />
            <span className="inline-flex h-[30px] items-center gap-1.5 rounded-sm border border-border bg-surface px-[11px] text-caption font-medium text-text-muted">
              <IcPencil size={13} /> {t("landing.spec_edit")}
            </span>
            <span className="inline-flex h-[30px] items-center gap-1.5 rounded-sm border border-primary bg-primary px-3 text-caption font-semibold text-primary-foreground">
              <IcCheck size={13} /> {t("landing.spec_approve")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// The full marketing page (no shell wrapper). `showSample` toggles the hero
// product peek. Used both for the live page and inside the viewport-preview iframe.
function LandingContent({ showSample }: { showSample: boolean }) {
  const { t } = useTranslation();
  return (
    <>
      {/* Top bar */}
      <header className="shrink-0 border-b border-border py-5">
        <div className={cn(WRAP, "flex items-center gap-3")}>
          <div className="flex items-center gap-2.5">
            <BrandMark size={30} radius={9} className="shadow-sm" />
            <span className="text-h3 font-semibold tracking-[-0.01em]">Pennedly</span>
          </div>
          <span className="flex-1" />
          <div className="flex items-center gap-[9px]">
            <LanguageSwitcher />
            <ThemeToggle />
            <Link
              href="/app/login"
              data-fx="btnprimary"
              className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-small font-medium text-primary-foreground transition-[background-color,transform] duration-[120ms] ease-[cubic-bezier(0.2,0.7,0.3,1)] hover:bg-[color-mix(in_srgb,var(--color-primary)_88%,var(--color-bg))] active:translate-y-[0.5px]"
            >
              {t("landing.sign_in")}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="flex flex-1 items-center py-8 pb-[52px] min-[881px]:py-[52px] min-[881px]:pb-[72px]">
        <div
          className={cn(
            WRAP,
            "grid grid-cols-1 items-center gap-11",
            showSample
              ? "min-[881px]:grid-cols-[1fr_1.02fr] min-[881px]:gap-14"
              : "min-[881px]:grid-cols-[minmax(0,760px)] min-[881px]:justify-center min-[881px]:text-center",
          )}
        >
          <div style={RISE}>
            <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-border bg-surface py-1.5 pl-[11px] pr-[13px] text-small font-medium text-text-muted">
              <span className="relative h-[7px] w-[7px] rounded-full bg-warning">
                <span
                  className="absolute -inset-1 rounded-full border border-warning opacity-40"
                  style={{ animation: "ping 2.4s var(--ease-standard) infinite" }}
                />
              </span>
              {t("landing.status")}
            </span>
            <h1
              className={cn(
                "mt-5 max-w-[15ch] text-balance text-[clamp(2.3rem,5.6vw,3.3rem)] font-semibold leading-[1.05] tracking-[-0.024em]",
                !showSample && "min-[881px]:mx-auto",
              )}
            >
              {t("landing.tagline")}
            </h1>
            <p
              className={cn(
                "mt-5 max-w-[46ch] text-h3 font-[450] leading-[1.5] text-text-muted [text-wrap:pretty]",
                !showSample && "min-[881px]:mx-auto",
              )}
            >
              {t("landing.lead_head")}
            </p>
            <p
              className={cn(
                "mt-3.5 max-w-[46ch] text-h3 font-medium text-text",
                !showSample && "min-[881px]:mx-auto",
              )}
            >
              {t("landing.lead_body")} <span className="text-accent">{t("landing.lead_emph")}</span>
            </p>
            <div
              className={cn(
                "mt-7 flex flex-wrap items-center gap-4",
                !showSample && "min-[881px]:justify-center",
              )}
            >
              <Link
                href="/app/login"
                data-fx="btnprimary"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-primary px-[22px] text-body font-medium text-primary-foreground transition-[background-color,transform] duration-[180ms] ease-[cubic-bezier(0.2,0.7,0.3,1)] hover:bg-[color-mix(in_srgb,var(--color-primary)_88%,var(--color-bg))] active:translate-y-[0.5px]"
              >
                {t("landing.sign_in")} <IcArrowRight size={17} />
              </Link>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                data-fx="link"
                className="inline-flex items-center gap-[7px] text-small text-text-muted transition-colors duration-[120ms] ease-[cubic-bezier(0.2,0.7,0.3,1)] hover:text-text"
              >
                <IcMail size={15} className="text-text-subtle" /> {CONTACT_EMAIL}
              </a>
            </div>
          </div>
          {showSample && <StudioWindow />}
        </div>
      </section>

      {/* Features (bento) */}
      <section className="shrink-0 border-t border-border py-[52px] pb-[60px]">
        <div className={WRAP}>
          <div className="mb-7">
            <span className="text-caption font-semibold uppercase tracking-[0.07em] text-accent">
              {t("landing.feat_eyebrow")}
            </span>
            <h2 className="mt-3 text-balance text-[clamp(1.7rem,3.4vw,2.1rem)] font-semibold leading-[1.16] tracking-[-0.016em]">
              {t("landing.feat_title")}
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 min-[561px]:grid-cols-2 min-[881px]:grid-cols-3">
            {FEATURES.map(({ Ico, titleKey, descKey, span }) => {
              const full = span === "full";
              return (
                <article
                  key={titleKey}
                  data-fx="feat"
                  className={cn(
                    "flex rounded-lg border border-border p-[22px] shadow-sm transition-[border-color,box-shadow] duration-[120ms] ease-[cubic-bezier(0.2,0.7,0.3,1)] hover:border-[color-mix(in_srgb,var(--color-text)_16%,var(--color-border))] hover:shadow-md",
                    full ? "flex-col bg-surface-2" : "flex-col bg-surface",
                    span === "wide" && "min-[561px]:col-span-2",
                    full &&
                      "min-[561px]:col-span-2 min-[561px]:flex-row min-[561px]:items-center min-[561px]:gap-[18px] min-[881px]:col-span-3",
                  )}
                >
                  <span
                    className={cn(
                      "grid h-10 w-10 shrink-0 place-items-center rounded-md border border-border bg-surface-2 text-text",
                      full ? "mb-4 min-[561px]:mb-0" : "mb-4",
                    )}
                  >
                    <Ico size={18} />
                  </span>
                  <div className={cn(full && "min-[561px]:flex-1")}>
                    <h3 className={cn("font-semibold tracking-[-0.006em]", span === "wide" ? "text-h2" : "text-h3")}>
                      {t(titleKey)}
                    </h3>
                    <p
                      className={cn(
                        "mt-2 text-small leading-[1.55] text-text-muted [text-wrap:pretty]",
                        full ? "max-w-[64ch]" : "max-w-[42ch]",
                      )}
                    >
                      {t(descKey)}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="shrink-0 border-t border-border pb-[30px] pt-6">
        <div className={cn(WRAP, "flex flex-wrap items-center gap-x-5 gap-y-3.5")}>
          <span className="inline-flex items-center gap-2 text-small text-text-muted">
            <BrandMark size={20} radius={6} /> © {new Date().getFullYear()} Pennedly
          </span>
          <span className="flex-1" />
          <nav aria-label="Legal" className="flex flex-wrap items-center gap-x-[18px] gap-y-1.5">
            {FOOTER_LINKS.map((l) => (
              <Link
                key={l.labelKey}
                href={l.href}
                data-fx="link"
                className="text-small text-text-muted transition-colors duration-[120ms] ease-[cubic-bezier(0.2,0.7,0.3,1)] hover:text-text"
              >
                {t(l.labelKey)}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </>
  );
}

// The page frame: the radial-paper background + flex column + (in demo) the
// forced-state / freeze hooks.
function LandingShell({
  force,
  freeze,
  children,
}: {
  force?: string;
  freeze?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex min-h-screen flex-col text-text",
        force && force !== "none" && `fx-${force}`,
        freeze && "land-freeze",
      )}
      style={{ background: RADIAL }}
    >
      {children}
    </div>
  );
}

type LandTweaks = {
  demo: boolean;
  dark: boolean;
  sample: boolean;
  vp: string;
  force: string;
  freeze: boolean;
};
const LAND_TWEAKS: LandTweaks = {
  demo: false,
  dark: false,
  sample: true,
  vp: "Off",
  force: "none",
  freeze: false,
};

const IS_DEV = process.env.NODE_ENV === "development";

// Rendered INSIDE the viewport-preview iframe (`?frame=1`): just the content,
// sized by the iframe so the real 881/561 media queries fire. No panel.
function FramedLanding({ params }: { params: URLSearchParams }) {
  const sample = params.get("sample") !== "0";
  const force = params.get("force") ?? "none";
  const freeze = params.get("freeze") === "1";
  const dark = params.get("dark") === "1";
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);
  return (
    <>
      <DebugStyles />
      <LandingShell force={force} freeze={freeze}>
        <LandingContent showSample={sample} />
      </LandingShell>
    </>
  );
}

// The viewport-preview frame: a sized iframe of the same route, so breakpoints
// respond to its width (a wrapper alone can't drive viewport media queries).
function ViewportFrame({ tw }: { tw: LandTweaks }) {
  const width = tw.vp === "Mobile" ? 390 : 1280;
  const q = new URLSearchParams({
    frame: "1",
    sample: tw.sample ? "1" : "0",
    force: tw.force,
    freeze: tw.freeze ? "1" : "0",
    dark: tw.dark ? "1" : "0",
  });
  return (
    <div className="flex min-h-screen w-full justify-center overflow-auto bg-[#33312e] p-6">
      <iframe
        key={width}
        src={`/?${q.toString()}`}
        title="Viewport preview"
        style={{
          width,
          height: "calc(100vh - 48px)",
          flex: "0 0 auto",
          border: "1px solid rgba(255,255,255,.18)",
          borderRadius: 12,
          background: "var(--color-bg)",
          boxShadow: "0 20px 60px rgba(0,0,0,.4)",
        }}
      />
    </div>
  );
}

// Live page + tester demo. In demo mode the Tweaks panel drives every state;
// otherwise this is the plain public marketing page.
function DemoableLanding({ initialDemo }: { initialDemo: boolean }) {
  const [tw, setTw] = useTweaks(LAND_TWEAKS);
  const [tester, setTester] = useState(false);

  // Tester gate: only logged-in testers see the panel in prod (dev: always).
  useEffect(() => {
    if (!getTokens()) return;
    fetchMe()
      .then((m) => setTester(m.is_tester))
      .catch(() => {});
  }, []);
  // A ?demo=1 deep-link opens straight into demo mode.
  useEffect(() => {
    if (initialDemo) setTw("demo", true);
  }, [initialDemo, setTw]);
  // The panel's dark toggle, while in demo mode (real theme otherwise).
  useEffect(() => {
    if (tw.demo) document.documentElement.classList.toggle("dark", !!tw.dark);
  }, [tw.demo, tw.dark]);

  const allow = tester || IS_DEV;
  const demo = allow && tw.demo;

  return (
    <>
      {demo && tw.vp !== "Off" ? (
        <ViewportFrame tw={tw} />
      ) : (
        <>
          {demo && <DebugStyles />}
          <LandingShell force={demo ? tw.force : "none"} freeze={demo && tw.freeze}>
            <LandingContent showSample={demo ? tw.sample : true} />
          </LandingShell>
        </>
      )}

      {allow && (
        <TweaksPanel title="Landing">
          <TweakSection label="Demo" />
          <TweakToggle label="Mock data" value={tw.demo} onChange={(v) => setTw("demo", v)} />
          <TweakSection label="Appearance" />
          <TweakToggle label="Dark mode" value={tw.dark} onChange={(v) => setTw("dark", v)} />
          <TweakSection label="Hero" />
          <TweakToggle label="Sample draft" value={tw.sample} onChange={(v) => setTw("sample", v)} />
          <TweakSection label="Preview" />
          <TweakRadio
            label="Viewport"
            value={tw.vp}
            options={["Off", "Web", "Mobile"]}
            onChange={(v) => setTw("vp", v)}
          />
          <TweakSection label="States" />
          <TweakRadio
            label="Force state"
            value={tw.force}
            options={["none", "hover", "active", "disabled"]}
            onChange={(v) => setTw("force", v)}
          />
          <TweakToggle label="Freeze animations" value={tw.freeze} onChange={(v) => setTw("freeze", v)} />
        </TweaksPanel>
      )}
    </>
  );
}

export default function LandingView() {
  // Search params are read client-side (this is a static public route); until
  // mount we render the plain page, which is also the correct SSR output.
  const [params, setParams] = useState<URLSearchParams | null>(null);
  useEffect(() => {
    try {
      setParams(new URLSearchParams(window.location.search));
    } catch {
      /* no-op */
    }
  }, []);

  if (params?.get("frame") === "1") return <FramedLanding params={params} />;
  return <DemoableLanding initialDemo={params?.get("demo") === "1"} />;
}
