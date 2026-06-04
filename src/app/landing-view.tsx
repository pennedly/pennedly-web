"use client";

// Pennedly public landing — the client view rendered by the server wrapper in
// ./page.tsx (which carries this route's metadata + Open Graph card, see
// ./opengraph-image.tsx). Lives in its own file because the theme toggle needs
// client hooks, and `metadata` can only be exported from a Server Component.
//
// Restyled 1:1 to design-export/PennedlyDesign/landing-* (per Landing-SPEC.html):
// a calm marketing page at the root of app.pennedly.com — top bar (brand ·
// language · theme toggle · Sign in), a hero with a tilted "draft specimen" card,
// a four-up feature row, and a legal footer. No app shell. Copy LOCALIZES to the
// visitor's browser language (the i18n store auto-detects navigator.language →
// one of the 8 locales, EN fallback) and a top-bar LanguageSwitcher overrides it
// — a deviation from the design's EN-only landing, by request. The sample draft
// in the specimen stays illustrative; only the chrome localizes.
// Built on the same ink-on-paper tokens as the app. Breakpoints follow the
// design's exact widths (900 / 560 / 520), NOT Tailwind's sm/md/lg defaults.
//
// Tester demo: `?demo=1` (dev: anyone; prod: testers via me.is_tester) opens a
// Tweaks panel that drives every state on mock content — dark · sample on/off ·
// viewport web/mobile (rendered in a sized iframe so real media queries fire) ·
// forced hover/focus/active/disabled · freeze animations.

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
  IcChart,
  IcCheck,
  IcClock,
  IcMail,
  IcMoon,
  IcPencil,
  IcReply,
  IcScan,
  IcSparkle,
  IcSun,
  IcUsers,
  type IconProps,
} from "@/components/icons";
import { useTranslation, type MessageKey } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const CONTACT_EMAIL = "hello@pennedly.com";

// Public-route copy localizes to the visitor's browser language (auto-detected
// via navigator.language → one of the 8 locales, EN fallback) + the top-bar
// LanguageSwitcher. The sample draft in the specimen stays as illustrative
// content; only the chrome localizes.
const FEATURES: { Ico: (p: IconProps) => ReactNode; titleKey: MessageKey; descKey: MessageKey }[] = [
  { Ico: IcSparkle, titleKey: "landing.feat_viral_title", descKey: "landing.feat_viral_desc" },
  { Ico: IcReply, titleKey: "landing.feat_replies_title", descKey: "landing.feat_replies_desc" },
  { Ico: IcScan, titleKey: "landing.feat_audits_title", descKey: "landing.feat_audits_desc" },
  { Ico: IcChart, titleKey: "landing.feat_analytics_title", descKey: "landing.feat_analytics_desc" },
  { Ico: IcClock, titleKey: "landing.feat_autopilot_title", descKey: "landing.feat_autopilot_desc" },
  { Ico: IcUsers, titleKey: "landing.feat_accounts_title", descKey: "landing.feat_accounts_desc" },
];

const FOOTER_LINKS: { labelKey: MessageKey; href: string }[] = [
  { labelKey: "landing.footer_privacy", href: "/privacy" },
  { labelKey: "landing.footer_terms", href: "/terms" },
  { labelKey: "landing.footer_data", href: "/data-deletion" },
];

const SAMPLE = {
  name: "Mara Lin",
  handle: "@mara.lin",
  initials: "ML",
};

const RADIAL =
  "radial-gradient(110% 70% at 80% -10%, color-mix(in srgb, var(--color-surface) 55%, transparent) 0%, transparent 55%), var(--color-bg)";

// .land-rise — entrance. transform-only (canonical card-in), so the resting
// state never sticks invisible if interrupted.
const RISE = { animation: "card-in var(--duration-slow) var(--ease-entrance) both" } as const;

// ── Tester-debug styles (injected only in demo / frame mode) ─────────────────
// Forced interactive states mirror §4.2 of the SPEC exactly (token values), keyed
// off a root `fx-*` class + per-element `data-fx` hooks. `Freeze` emulates
// prefers-reduced-motion within the landing subtree.
const FX_STYLE = `
.fx-hover [data-fx="iconbtn"]{background:var(--color-surface-2);color:var(--color-text)}
.fx-hover [data-fx="btnsecondary"]{background:var(--color-surface-2)}
.fx-hover [data-fx="btnprimary"]{background:color-mix(in srgb,var(--color-primary) 88%,var(--color-bg))}
.fx-hover [data-fx="link"]{color:var(--color-text)}
.fx-hover [data-fx="specimen"]{transform:rotate(0deg)}
.fx-focus [data-fx="iconbtn"],.fx-focus [data-fx="btnsecondary"],.fx-focus [data-fx="btnprimary"],.fx-focus [data-fx="link"]{outline:2px solid var(--color-accent);outline-offset:2px;border-radius:var(--radius-sm)}
.fx-active [data-fx="btnsecondary"],.fx-active [data-fx="btnprimary"]{transform:translateY(0.5px)}
.fx-disabled [data-fx="btnsecondary"],.fx-disabled [data-fx="btnprimary"]{opacity:.5;cursor:not-allowed}
.land-freeze *,.land-freeze *::before,.land-freeze *::after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important}
`;

function DebugStyles() {
  return <style>{FX_STYLE}</style>;
}

// ───────────────────────────── Sections ─────────────────────────────────────

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

function Specimen() {
  const { t } = useTranslation();
  return (
    <div className="group relative" style={RISE} aria-hidden>
      {/* a soft second card peeking behind, for depth — hidden when stacked (≤900) */}
      <div className="absolute right-[-10px] top-[18px] hidden h-[88%] w-[min(420px,100%)] origin-top-right rounded-xl border border-border bg-surface opacity-60 shadow-md [transform:rotate(2.4deg)] min-[901px]:block" />
      {/* the draft specimen — tilted at rest (-2.5deg), straightens on hover; the
          rotate lives here, NOT on the entrance-animated wrapper above, so the
          card-in transform doesn't wipe it. Tilt + hover only apply >900. */}
      <div
        data-fx="specimen"
        className="relative z-[1] mx-auto max-w-[420px] origin-center rounded-xl border border-border bg-surface px-5 pb-4 pt-5 shadow-lg transition-transform duration-[240ms] ease-[cubic-bezier(0.2,0.7,0.3,1)] min-[901px]:ml-auto min-[901px]:mr-0 min-[901px]:[transform:rotate(-2.5deg)] min-[901px]:group-hover:[transform:rotate(0deg)]"
      >
        <div className="flex items-center gap-[11px]">
          <span className="grid h-9 w-9 shrink-0 select-none place-items-center rounded-full bg-text font-mono text-[13px] font-semibold text-bg">
            {SAMPLE.initials}
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-small font-semibold leading-[1.2]">{SAMPLE.name}</div>
            <div className="mt-px text-caption text-text-subtle">{SAMPLE.handle}</div>
          </div>
          <span className="inline-flex shrink-0 items-center gap-[5px] rounded-full border border-border bg-surface-2 px-[9px] py-[3px] text-caption font-medium text-text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-ink-400" /> {t("landing.spec_draft")}
          </span>
        </div>
        <p className="mt-3.5 text-body leading-[1.6] text-text [text-wrap:pretty]">{t("landing.spec_text")}</p>
        <div className="mt-4 flex items-center gap-2.5 border-t border-border pt-[13px]">
          <span className="inline-flex flex-1 items-center gap-[5px] whitespace-nowrap text-caption text-text-subtle">
            <IcSparkle size={13} /> {t("landing.spec_voice")}
          </span>
          <div className="flex shrink-0 items-center gap-[7px]">
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
// specimen. Used both for the live page and inside the viewport-preview iframe.
function LandingContent({ showSample }: { showSample: boolean }) {
  const { t } = useTranslation();
  return (
    <>
      {/* Top bar */}
      <header className="shrink-0 py-[22px]">
        <div className="mx-auto flex w-full max-w-[1080px] items-center gap-3.5 px-5 min-[561px]:px-8">
          <div className="flex items-center gap-[11px]">
            <BrandMark size={34} radius={10} className="shadow-sm" />
            <span className="text-h3 font-semibold tracking-[-0.01em]">Pennedly</span>
          </div>
          <span className="flex-1" />
          <div className="flex items-center gap-[9px]">
            <LanguageSwitcher />
            <ThemeToggle />
            <Link
              href="/app/login"
              data-fx="btnsecondary"
              className="inline-flex h-10 items-center rounded-md border border-border bg-surface px-4 text-small font-medium text-text transition-[background-color,color,transform] duration-[180ms] ease-[cubic-bezier(0.2,0.7,0.3,1)] hover:bg-surface-2 active:translate-y-[0.5px]"
            >
              {t("landing.sign_in")}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="flex flex-1 items-center pb-12 pt-7 min-[901px]:pb-16 min-[901px]:pt-10">
        <div className="mx-auto grid w-full max-w-[1080px] grid-cols-1 items-center gap-11 px-5 min-[561px]:px-8 min-[901px]:grid-cols-[1.05fr_0.95fr] min-[901px]:gap-16">
          <div style={RISE}>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface py-1.5 pl-[11px] pr-[13px] text-small font-medium text-text-muted">
              <span className="relative h-[7px] w-[7px] rounded-full bg-warning">
                <span
                  className="absolute -inset-1 rounded-full border border-warning opacity-40"
                  style={{ animation: "ping 2.4s var(--ease-standard) infinite" }}
                />
              </span>
              {t("landing.status")}
            </span>
            {/* 14ch + text-wrap:balance, matching the design 1:1. Verified the
                design's own files render this identically in the current engine
                (same Geist metrics, same balanced break) — the 2-line static
                screenshot was captured on an older Chromium whose balance differed. */}
            <h1 className="mt-[22px] max-w-[14ch] text-balance text-[clamp(2.5rem,5.4vw,3.5rem)] font-semibold leading-[1.04] tracking-[-0.025em]">
              {t("landing.tagline")}
            </h1>
            <div className="mt-[22px] max-w-[46ch]">
              <p className="text-h3 font-medium leading-normal tracking-[-0.004em] text-text">
                {t("landing.lead_head")}
              </p>
              <p className="mt-3 text-body leading-[1.62] text-text-muted [text-wrap:pretty]">
                {t("landing.lead_body")}{" "}
                <span className="font-medium text-accent">{t("landing.lead_emph")}</span>
              </p>
            </div>
            <div className="mt-[30px] flex flex-wrap items-center gap-3.5">
              <Link
                href="/app/login"
                data-fx="btnprimary"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-primary px-[22px] text-body font-medium text-primary-foreground transition-[background-color,color,transform] duration-[180ms] ease-[cubic-bezier(0.2,0.7,0.3,1)] hover:bg-[color-mix(in_srgb,var(--color-primary)_88%,var(--color-bg))] active:translate-y-[0.5px]"
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
          {showSample && <Specimen />}
        </div>
      </section>

      {/* Features */}
      <section className="shrink-0 border-t border-border py-9">
        <div className="mx-auto grid w-full max-w-[1080px] grid-cols-1 gap-5 px-5 min-[521px]:grid-cols-2 min-[521px]:gap-6 min-[561px]:px-8 min-[901px]:grid-cols-3 min-[901px]:gap-7">
          {FEATURES.map(({ Ico, titleKey, descKey }) => (
            <div key={titleKey} className="flex flex-col gap-[9px]">
              <span className="grid h-[34px] w-[34px] place-items-center rounded-md border border-border bg-surface text-text">
                <Ico size={17} />
              </span>
              <div className="text-small font-semibold">{t(titleKey)}</div>
              <div className="text-small leading-[1.5] text-text-muted [text-wrap:pretty]">{t(descKey)}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="shrink-0 border-t border-border pb-7 pt-[22px]">
        <div className="mx-auto flex w-full max-w-[1080px] flex-wrap items-center gap-x-5 gap-y-3.5 px-5 min-[561px]:px-8">
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
// sized by the iframe so the real 900/560/520 media queries fire. No panel.
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
          <TweakSection label="Layout" />
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
            options={["none", "hover", "focus", "active", "disabled"]}
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
