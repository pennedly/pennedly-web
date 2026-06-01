"use client";

// Pennedly public landing (pennedly.com root). Restyled 1:1 to
// design-export/PennedlyDesign/landing-* : a calm marketing page — top bar
// (brand · theme toggle · Sign in), a hero with a tilted "draft specimen"
// card, a four-up feature row, and a legal footer. No app shell, no i18n
// provider on this public route — copy is the EN baseline (the design ships
// no language switcher here). Built on the same ink-on-paper tokens as the app.

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

import { cn } from "@/lib/cn";
import {
  BrandMark,
  IcArrowRight,
  IcChart,
  IcCheck,
  IcMail,
  IcMoon,
  IcPencil,
  IcSparkle,
  IcSun,
  IcUsers,
  IcVoice,
  type IconProps,
} from "@/components/icons";

const CONTACT_EMAIL = "hi@pennedly.com";

const FEATURES: { Ico: (p: IconProps) => ReactNode; title: string; desc: string }[] = [
  { Ico: IcVoice, title: "Drafts in your voice", desc: "It studies how you write, so drafts sound like you — never generic." },
  { Ico: IcCheck, title: "You approve every word", desc: "Read, tweak, and publish on your terms. Nothing posts on its own." },
  { Ico: IcUsers, title: "Every account, one place", desc: "Switch between the handles you run without losing the thread." },
  { Ico: IcChart, title: "See what's landing", desc: "Quiet analytics that show which posts earned their place." },
];

const FOOTER_LINKS = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Data Deletion", href: "/data-deletion" },
];

const SAMPLE = {
  name: "Mara Lin",
  handle: "@mara.lin",
  initials: "ML",
  text: "The fastest way to find your voice online: publish the thing you're slightly embarrassed by. The polished version is everyone's. The embarrassing one is yours.",
};

const RADIAL =
  "radial-gradient(110% 70% at 80% -10%, color-mix(in srgb, var(--color-surface) 55%, transparent) 0%, transparent 55%), var(--color-bg)";

const RISE = { animation: "card-in var(--duration-slow) var(--ease-entrance) both" } as const;

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
      className="grid h-[38px] w-[38px] place-items-center rounded-md border border-border bg-surface text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
    >
      {dark ? <IcSun size={17} /> : <IcMoon size={16} />}
    </button>
  );
}

function Specimen() {
  return (
    <div className="relative" aria-hidden>
      {/* a soft second card peeking behind, for depth */}
      <div className="absolute right-[-10px] top-[18px] hidden h-[88%] w-[min(420px,100%)] rotate-[2.4deg] rounded-2xl border border-border bg-surface opacity-60 shadow-md md:block" />
      <div className="relative z-[1] ml-auto max-w-[420px] rounded-2xl border border-border bg-surface px-5 pb-4 pt-5 shadow-lg max-md:mx-auto" style={RISE}>
        <div className="flex items-center gap-[11px]">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-text font-mono text-[13px] font-semibold text-bg">
            {SAMPLE.initials}
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-small font-semibold leading-tight">{SAMPLE.name}</div>
            <div className="mt-px text-caption text-text-subtle">{SAMPLE.handle}</div>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-surface-2 px-2.5 py-[3px] text-caption font-medium text-text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-ink-400" /> Draft
          </span>
        </div>
        <p className="mt-3.5 text-body leading-relaxed text-text">{SAMPLE.text}</p>
        <div className="mt-4 flex items-center gap-2.5 border-t border-border pt-[13px]">
          <span className="inline-flex flex-1 items-center gap-1.5 whitespace-nowrap text-caption text-text-subtle">
            <IcSparkle size={13} /> In your voice
          </span>
          <div className="flex shrink-0 items-center gap-[7px]">
            <span className="inline-flex h-[30px] items-center gap-1.5 rounded-sm border border-border bg-surface px-[11px] text-caption font-medium text-text-muted">
              <IcPencil size={13} /> Edit
            </span>
            <span className="inline-flex h-[30px] items-center gap-1.5 rounded-sm border border-primary bg-primary px-3 text-caption font-semibold text-primary-foreground">
              <IcCheck size={13} /> Approve
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  return (
    <div className="flex min-h-screen flex-col text-text" style={{ background: RADIAL }}>
      {/* Top bar */}
      <header className="shrink-0 py-[22px]">
        <div className="mx-auto flex w-full max-w-[1080px] items-center gap-3.5 px-5 sm:px-8">
          <div className="flex items-center gap-[11px]">
            <BrandMark size={34} radius={10} className="shadow-sm" />
            <span className="text-h3 font-semibold tracking-tight">Pennedly</span>
          </div>
          <span className="flex-1" />
          <div className="flex items-center gap-[9px]">
            <ThemeToggle />
            <Link
              href="/app/login"
              className="inline-flex h-10 items-center rounded-md border border-border bg-surface px-4 text-small font-medium text-text transition-colors hover:bg-surface-2"
            >
              Sign in
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="flex flex-1 items-center py-10 pb-16">
        <div className="mx-auto grid w-full max-w-[1080px] items-center gap-11 px-5 sm:px-8 md:grid-cols-[1.05fr_0.95fr] md:gap-16">
          <div style={RISE}>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface py-1.5 pl-[11px] pr-[13px] text-small font-medium text-text-muted">
              <span className="relative h-[7px] w-[7px] rounded-full bg-warning">
                <span
                  className="absolute -inset-1 rounded-full border border-warning opacity-40"
                  style={{ animation: "ripple 2.4s var(--ease-standard) infinite" }}
                />
              </span>
              In development · invite-only beta
            </span>
            <h1 className="mt-[22px] max-w-[14ch] text-balance text-[clamp(2.5rem,5.4vw,3.5rem)] font-semibold leading-[1.04] tracking-[-0.025em]">
              Your drafting partner for Threads.
            </h1>
            <div className="mt-[22px] max-w-[46ch]">
              <p className="text-h3 font-medium leading-normal text-text">
                Pennedly drafts posts and replies in your voice, then waits for you.
              </p>
              <p className="mt-3 text-body leading-relaxed text-text-muted">
                Nothing publishes until you approve it. Manage every account from one place, see
                what&apos;s landing, and keep your tone consistent across all of it.{" "}
                <span className="font-medium text-accent">
                  A partner that does the legwork — not an autopilot. You stay in control.
                </span>
              </p>
            </div>
            <div className="mt-[30px] flex flex-wrap items-center gap-3.5">
              <Link
                href="/app/login"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-primary px-[22px] text-body font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Sign in <IcArrowRight size={17} />
              </Link>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="inline-flex items-center gap-[7px] text-small text-text-muted transition-colors hover:text-text"
              >
                <IcMail size={15} className="text-text-subtle" /> {CONTACT_EMAIL}
              </a>
            </div>
          </div>
          <Specimen />
        </div>
      </section>

      {/* Features */}
      <section className="shrink-0 border-t border-border py-9">
        <div className="mx-auto grid w-full max-w-[1080px] grid-cols-1 gap-5 px-5 sm:grid-cols-2 sm:gap-6 sm:px-8 lg:grid-cols-4 lg:gap-7">
          {FEATURES.map(({ Ico, title, desc }) => (
            <div key={title} className="flex flex-col gap-[9px]">
              <span className="grid h-[34px] w-[34px] place-items-center rounded-md border border-border bg-surface text-text">
                <Ico size={17} />
              </span>
              <div className="text-small font-semibold">{title}</div>
              <div className="text-small leading-snug text-text-muted">{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="shrink-0 border-t border-border pb-7 pt-[22px]">
        <div className="mx-auto flex w-full max-w-[1080px] flex-wrap items-center gap-x-5 gap-y-3.5 px-5 sm:px-8">
          <span className="inline-flex items-center gap-2 text-small text-text-muted">
            <BrandMark size={20} radius={6} /> © {new Date().getFullYear()} Pennedly
          </span>
          <span className="flex-1" />
          <nav aria-label="Legal" className="flex flex-wrap items-center gap-x-[18px] gap-y-1.5">
            {FOOTER_LINKS.map((l) => (
              <Link key={l.label} href={l.href} className={cn("text-small text-text-muted transition-colors hover:text-text")}>
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
