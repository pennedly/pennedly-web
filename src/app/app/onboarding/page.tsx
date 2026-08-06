"use client";

// First-run onboarding — a focused full-screen wizard (NO app shell), restyled
// 1:1 to design-export/PennedlyDesign/onboarding-* (per Onboarding-SPEC.html):
// top bar (brand · back/preview · skip · theme), a 3-step stepper
// (Connect · Voice · Done) and a centred stage card per stage.
//
// Stages: connect (idle → connecting → connected) → choose (analyze | scratch,
// analyze locked when too few posts) → analyze (nib + 3 steps) | scratch (voice
// description + starters + topic chips) → done (recap, or read-only preview).
// Entry: first-run (forced, "Skip for now") vs revisit (from Settings, "Back to
// Settings"); tester preview (?preview=1) renders the would-be voice, saves
// nothing. The real accounts / onboarding-status / analyze / from-scratch APIs
// back the live flow; the tester ?demo=1 panel drives every state on mock data.

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import {
  ApiError,
  clearTokens,
  fetchMe,
  fetchMyAccounts,
  fetchOnboardingStatus,
  fetchRoleBook,
  getTokens,
  onboardingAnalyze,
  onboardingAnalyzePreview,
  onboardingFromScratch,
  onboardingFromScratchPreview,
  setMyFocus,
  skipOnboarding,
  startThreadsConnect,
} from "@/lib/api";
import { errorCodeText, friendlyErrorText } from "@/lib/errors";
import { captureEvent } from "@/lib/analytics";
import { getSelectedAccountId, setSelectedAccountId } from "@/lib/account";
import { useTranslation, pluralKey, pluralUnit, type MessageKey } from "@/lib/i18n";
import {
  TweaksPanel,
  TweakSection,
  TweakToggle,
  TweakRadio,
  TweakButton,
  useTweaks,
} from "@/components/tweaks/TweaksPanel";
import {
  BrandMark,
  IcArrowLeft,
  IcArrowRight,
  IcAt,
  IcAudit,
  IcBolt,
  IcCheck,
  IcChevRight,
  IcClock,
  IcEye,
  IcLock,
  IcMoon,
  IcNib,
  IcPenLine,
  IcPlus,
  IcReplies,
  IcScan,
  IcStudio,
  IcStudy,
  IcSun,
  IcVoice,
  IcX,
  type IconProps,
} from "@/components/icons";
import { Avatar, nameOf } from "@/components/ui/avatar";
import { Button, buttonClasses } from "@/components/ui/button";
import { Spinner } from "@/components/ui/feedback";
import { fmt } from "@/components/studio/FeedParts";
import { cn } from "@/lib/cn";
import type { ConnectedAccount, OnboardingPreview, OnboardingStatus, RoleBookSections } from "@/lib/types";

type Stage = "loading" | "connect" | "goals" | "choose" | "analyze" | "scratch" | "done";
type Mode = "analyze" | "scratch" | null;
type ConnectStatus = "idle" | "connecting" | "connected";

// 4 nodes since the goals step landed: Connect · Personalize · Voice · Done.
const STAGE_INDEX: Record<Stage, number> = {
  loading: 0,
  connect: 0,
  goals: 1,
  choose: 2,
  analyze: 2,
  scratch: 2,
  done: 3,
};
const ANALYZE_STEPS: MessageKey[] = [
  "onboarding.analyze_step1",
  "onboarding.analyze_step2",
  "onboarding.analyze_step3",
];
// Voice extraction is a server-side LLM call with no progress signal. Bound it
// so a slow/hung analyze can never trap the very first user on the analyze
// stage (where Back/Skip are intentionally hidden): reveal an escape link after
// ANALYZE_SLOW_MS, and hard-fail back to the choice after ANALYZE_TIMEOUT_MS.
const ANALYZE_SLOW_MS = 12_000;
const ANALYZE_TIMEOUT_MS = 60_000;
class AnalyzeTimeout extends Error {}

// .ob radial-paper background (onboarding.css .ob).
const OB_BG =
  "radial-gradient(120% 80% at 50% -10%, color-mix(in srgb, var(--color-surface) 60%, transparent) 0%, transparent 60%), var(--color-bg)";
const RISE = { animation: "step-in var(--duration-slow) var(--ease-entrance) both" } as const;
const EASE = "cubic-bezier(0.2,0.7,0.3,1)";

// Sample seed content (not user data) — mirrors onboarding-data.jsx. Per the
// design handoff, starter lines + topic suggestions are sample content.
const STARTERS = [
  "Warm but direct. Short sentences, plain words, the occasional dry joke. I write like I'm talking to one smart friend.",
  "Curious and a little contrarian. I ask questions more than I give answers, and I'd rather be honest than polished.",
];
const TOPICS_WRITE = ["Writing craft", "Building in public", "Productivity", "Design", "Books & reading", "Startups", "Creativity"];
const TOPICS_AVOID = ["Politics", "Crypto", "Hustle culture", "Personal drama", "Engagement bait"];
const MIN_POSTS = 15;

function errMsg(e: unknown, t: (k: MessageKey) => string): string {
  // Friendly copy, not transport internals (B7): the old form surfaced
  // «502: <!DOCTYPE html>…» (a proxy error page) and «TypeError: Failed to
  // fetch» verbatim in the onboarding banner.
  //
  // The backend now names the failure (`code`), so the specific 4xx reasons
  // this used to echo in English — quota, "tell us how you write", "not enough
  // posts to learn from" — come back translated. What's left without a code
  // collapses to this screen's own copy rather than to a raw detail string.
  const coded = errorCodeText(e);
  if (coded !== null) return coded;
  if (e instanceof ApiError) {
    if (e.status >= 500) return t("onboarding.err_server");
    return friendlyErrorText(e);
  }
  // Non-ApiError on a fetch path = the request never got an answer
  // (offline, DNS, CORS, timeout).
  return t("onboarding.err_network");
}

// ────────────────────────────── Theme toggle ────────────────────────────────
function ThemeToggle() {
  const { t } = useTranslation();
  const [dark, setDark] = useState(false);
  useEffect(() => setDark(document.documentElement.classList.contains("dark")), []);
  return (
    <button
      type="button"
      aria-label={t("a11y.toggle_theme")}
      className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-border bg-surface text-text-muted transition-colors duration-[120ms] ease-[cubic-bezier(0.2,0.7,0.3,1)] hover:bg-surface-2 hover:text-text"
      onClick={() => {
        const next = !document.documentElement.classList.contains("dark");
        document.documentElement.classList.toggle("dark", next);
        try {
          localStorage.setItem("theme", next ? "dark" : "light");
        } catch {
          /* ignore */
        }
        setDark(next);
      }}
    >
      {dark ? <IcSun size={17} /> : <IcMoon size={16} />}
    </button>
  );
}

// ────────────────────────────────── Stepper ─────────────────────────────────
function Stepper({ current }: { current: number }) {
  const { t } = useTranslation();
  const steps: MessageKey[] = [
    "onboarding.step_connect",
    "onboarding.step_personalize",
    "onboarding.step_voice",
    "onboarding.step_done",
  ];
  return (
    <div className="mb-[26px] flex items-center gap-2" aria-label={t("a11y.onboarding_progress")}>
      {steps.map((s, i) => {
        const state = i === current ? "current" : i < current ? "done" : "todo";
        return (
          <div key={s} className="flex items-center gap-2">
            {i > 0 && (
              <span className={cn("h-px w-7 shrink-0 max-[560px]:w-4", i <= current ? "bg-success" : "bg-border")} />
            )}
            <div className="flex items-center gap-[9px]">
              <span
                className={cn(
                  "grid h-[26px] w-[26px] shrink-0 place-items-center rounded-full border text-caption font-semibold tabular-nums transition-colors duration-[180ms] ease-[cubic-bezier(0.2,0.7,0.3,1)]",
                  state === "current"
                    ? "border-text bg-text text-bg"
                    : state === "done"
                      ? "border-success bg-success text-success-foreground"
                      : "border-border bg-surface text-text-subtle",
                )}
              >
                {state === "done" ? <IcCheck size={14} /> : i + 1}
              </span>
              <span
                className={cn(
                  "whitespace-nowrap text-small transition-colors duration-[180ms] max-[560px]:hidden",
                  state === "current" ? "font-semibold text-text" : state === "done" ? "text-text-muted" : "font-medium text-text-subtle",
                )}
              >
                {t(s)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────── Frame (chrome) ─────────────────────────────
// Top bar + centred stage. Both the live flow and the demo render through this.
function Frame({
  stepIndex,
  showStepper = true,
  showSkip,
  showBack,
  preview,
  onSkip,
  wide,
  children,
}: {
  stepIndex: number;
  showStepper?: boolean;
  showSkip: boolean;
  showBack: boolean;
  preview: boolean;
  onSkip?: () => void;
  wide?: boolean;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen flex-col text-text" style={{ background: OB_BG }}>
      {/* Top bar */}
      <header className="flex shrink-0 items-center gap-3 px-6 py-5">
        <div className="flex items-center gap-2.5">
          <BrandMark size={30} radius={9} className="shadow-sm" />
          <span className="text-h3 font-semibold tracking-[-0.01em]">Pennedly</span>
        </div>
        {showBack && (
          <Link
            href="/app/settings"
            className="ml-1.5 inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-small font-medium text-text-muted transition-colors duration-[120ms] ease-[cubic-bezier(0.2,0.7,0.3,1)] hover:bg-surface-2 hover:text-text"
          >
            <IcArrowLeft size={15} /> {t("onboarding.back_to_settings")}
          </Link>
        )}
        {preview && (
          <span className="ml-2.5 inline-flex items-center gap-[7px] whitespace-nowrap rounded-full border bg-surface px-[11px] py-[5px] pl-[9px] text-small text-accent" style={{ borderColor: "color-mix(in srgb, var(--color-accent) 30%, var(--color-border))" }}>
            <span className="h-[7px] w-[7px] rounded-full bg-accent" /> {t("onboarding.preview_pill")}
          </span>
        )}
        <span className="flex-1" />
        <div className="flex items-center gap-2">
          {showSkip && (
            <button
              onClick={onSkip}
              className="h-9 rounded-md px-3 text-small font-medium text-text-muted transition-colors duration-[120ms] ease-[cubic-bezier(0.2,0.7,0.3,1)] hover:bg-surface-2 hover:text-text"
            >
              {t("onboarding.skip_for_now")}
            </button>
          )}
          <ThemeToggle />
        </div>
      </header>

      {/* Stage */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-14 pt-2">
        {showStepper && <Stepper current={stepIndex} />}
        <div
          className={cn(
            "w-full rounded-2xl border border-border bg-surface p-9 pb-[30px] shadow-lg max-[560px]:rounded-xl max-[560px]:px-5 max-[560px]:pb-[22px] max-[560px]:pt-[26px]",
            wide ? "max-w-[600px]" : "max-w-[540px]",
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────── Shared stage header bits ───────────────────────
function StepTitle({ children, center }: { children: ReactNode; center?: boolean }) {
  return (
    <h1 className={cn("mt-2.5 text-balance text-h1 font-semibold leading-[1.6] tracking-[-0.015em] max-[560px]:text-h2", center && "text-center")}>
      {children}
    </h1>
  );
}
function StepSub({ children, center }: { children: ReactNode; center?: boolean }) {
  return (
    <p className={cn("mt-3 max-w-[46ch] text-pretty text-body leading-relaxed text-text-muted", center && "mx-auto max-w-[42ch] text-center")}>
      {children}
    </p>
  );
}
const PRIMARY_LG = buttonClasses({ variant: "primary", size: "lg", className: "active:translate-y-[0.5px] max-[560px]:w-full" });
function BackLink({ onClick, href, children }: { onClick?: () => void; href?: string; children: ReactNode }) {
  const cls =
    "inline-flex items-center gap-1.5 px-1 py-1.5 text-small font-medium text-text-muted transition-colors duration-[120ms] ease-[cubic-bezier(0.2,0.7,0.3,1)] hover:text-text";
  return href ? (
    <Link href={href} className={cls}>
      {children}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={cls}>
      {children}
    </button>
  );
}

// ───────────────────────────────── Connect ──────────────────────────────────
function ConnectStep({
  status,
  account,
  onConnect,
  onContinue,
}: {
  status: ConnectStatus;
  account: ConnectedAccount | null;
  onConnect: () => void;
  onContinue: () => void;
}) {
  const { t, locale } = useTranslation();
  const trust: { Icon: (p: IconProps) => ReactNode; key: MessageKey }[] = [
    { Icon: IcEye, key: "onboarding.trust1" },
    { Icon: IcCheck, key: "onboarding.trust2" },
    { Icon: IcLock, key: "onboarding.trust3" },
  ];
  const connected = status === "connected" && account;
  return (
    <div style={RISE}>
      <span className="mb-5 block">
        <BrandMark size={56} radius={16} />
      </span>
      <div className="text-caption font-semibold uppercase tracking-[0.06em] text-accent">{t("onboarding.welcome_eyebrow")}</div>
      <StepTitle>{t("onboarding.connect_hero_title")}</StepTitle>
      <StepSub>{t("onboarding.connect_hero_sub")}</StepSub>

      {connected ? (
        <div
          className="mt-[22px] flex items-center gap-3 rounded-lg border border-border bg-surface-2 px-3.5 py-[13px]"
          style={{ animation: "step-in var(--duration-base) var(--ease-entrance) both" }}
        >
          <Avatar account={account} size={42} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-small font-semibold leading-tight">{nameOf(account)}</div>
            {account.username && (
              <div className="mt-0.5 truncate text-caption text-text-subtle">
                @{account.username}
                {account.followers_count != null &&
                  ` · ${t("onboarding.followers_count")
                    .replace("{n}", fmt(account.followers_count))
                    .replace("{u}", pluralUnit(locale, "followers", account.followers_count))}`}
              </div>
            )}
          </div>
          <span className="ml-2.5 inline-flex shrink-0 items-center gap-[7px] whitespace-nowrap rounded-full border bg-surface px-[11px] py-[5px] pl-[9px] text-small text-success" style={{ borderColor: "color-mix(in srgb, var(--color-success) 30%, var(--color-border))" }}>
            <span className="h-[7px] w-[7px] rounded-full bg-success" /> {t("onboarding.connected")}
          </span>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-[11px]">
          {trust.map(({ Icon, key }) => (
            <div key={key} className="flex items-start gap-[11px] text-small leading-snug text-text-muted">
              <span className="-mt-px grid h-[26px] w-[26px] shrink-0 place-items-center rounded-sm border border-border bg-surface-2 text-text-subtle">
                <Icon size={15} />
              </span>
              {t(key)}
            </div>
          ))}
        </div>
      )}

      <div className="mt-[26px] flex flex-wrap items-center gap-3">
        {connected ? (
          <Button variant="primary" size="lg" className="active:translate-y-[0.5px] max-[560px]:w-full" onClick={onContinue}>
            {t("onboarding.continue")} <IcArrowRight size={17} />
          </Button>
        ) : (
          <Button
            variant="primary"
            size="lg"
            className="active:translate-y-[0.5px] max-[560px]:w-full"
            disabled={status === "connecting"}
            onClick={onConnect}
          >
            {status === "connecting" ? (
              <>
                <Spinner size={16} /> {t("onboarding.connecting")}
              </>
            ) : (
              <>
                <IcAt size={17} /> {t("onboarding.connect_cta")}
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

// ───────────────────────────────── Choose ───────────────────────────────────
// ─────────────────────────── Goals (stage 2 of 4) ───────────────────────────
// «Что тебе важнее всего?» — per Onboarding-Goals-SPEC.html. Multi-select, so
// checkboxes (squares, radius-sm) rather than the round indicators the choose
// step uses for its either/or.
//
// This PRIORITIZES what the sidebar points at. It gates nothing: every screen
// stays reachable whatever is ticked, which is also why picking nothing is a
// real answer (variant B, decided 2026-07-31) — Continue stays armed and the
// sidebar falls back to highlighting Studio + Replies.
export const GOALS: {
  id: string;
  Icon: (p: IconProps) => ReactNode;
  title: MessageKey;
  desc: MessageKey;
}[] = [
  { id: "write", Icon: IcStudio, title: "onboarding.goal_write_t", desc: "onboarding.goal_write_d" },
  { id: "replies", Icon: IcReplies, title: "onboarding.goal_replies_t", desc: "onboarding.goal_replies_d" },
  { id: "mentions", Icon: IcAt, title: "onboarding.goal_mentions_t", desc: "onboarding.goal_mentions_d" },
  { id: "autopilot", Icon: IcBolt, title: "onboarding.goal_autopilot_t", desc: "onboarding.goal_autopilot_d" },
  { id: "audits", Icon: IcAudit, title: "onboarding.goal_audits_t", desc: "onboarding.goal_audits_d" },
  { id: "patterns", Icon: IcStudy, title: "onboarding.goal_patterns_t", desc: "onboarding.goal_patterns_d" },
];

function GoalsStep({
  picked,
  onToggle,
  onContinue,
  onBack,
  saving = false,
}: {
  picked: string[];
  onToggle: (id: string) => void;
  onContinue: () => void;
  onBack: (() => void) | null;
  saving?: boolean;
}) {
  const { t } = useTranslation();
  const all = picked.length === GOALS.length;
  // The hint speaks only at the two ends: nothing ticked (what we'll do
  // instead) and everything ticked (why highlighting all of it says nothing).
  const hint: MessageKey | null =
    picked.length === 0 ? "onboarding.goal_hint_none" : all ? "onboarding.goal_hint_all" : null;

  return (
    <div style={RISE}>
      <div className="text-caption font-semibold uppercase tracking-[0.06em] text-accent">
        {t("onboarding.goals_eyebrow")}
      </div>
      <StepTitle>{t("onboarding.goals_title")}</StepTitle>
      <StepSub>{t("onboarding.goals_sub")}</StepSub>

      <div role="group" aria-label={t("onboarding.goals_title")} className="mt-[22px] flex flex-col gap-2.5">
        {GOALS.map((g) => {
          const on = picked.includes(g.id);
          return (
            <button
              key={g.id}
              type="button"
              role="checkbox"
              aria-checked={on}
              onClick={() => onToggle(g.id)}
              className={cn(
                "flex w-full items-start gap-3.5 rounded-lg border bg-surface px-4 py-[15px] text-left transition-[border-color,background,box-shadow] duration-[120ms] ease-[cubic-bezier(0.2,0.7,0.3,1)]",
                on
                  ? "border-text shadow-[0_0_0_1px_var(--color-text)]"
                  : "border-border hover:border-[color-mix(in_srgb,var(--color-text)_18%,var(--color-border))] hover:bg-surface-2",
              )}
            >
              {/* A real checkbox: square, not the round indicator the choose
                  step uses — several of these can be on at once. */}
              <span
                className={cn(
                  "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-sm border-[1.5px] transition-all duration-[120ms]",
                  on ? "border-text bg-text" : "border-border bg-surface",
                )}
              >
                <IcCheck
                  size={13}
                  className={cn(
                    "text-surface transition-all duration-[120ms]",
                    on ? "scale-100 opacity-100" : "scale-50 opacity-0",
                  )}
                />
              </span>
              {/* The tile never inverts on select — only the checkbox carries
                  state, so a row of six doesn't turn into a wall of blocks. */}
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-border bg-surface-2 text-text">
                <g.Icon size={19} />
              </span>
              <span className="min-w-0">
                <span className="mb-[3px] block text-body font-semibold tracking-[-0.003em] text-text">{t(g.title)}</span>
                <span className="block text-small leading-[1.5] text-text-muted">{t(g.desc)}</span>
              </span>
            </button>
          );
        })}
      </div>

      {hint && <p className="mt-3.5 text-center text-small text-text-subtle">{t(hint)}</p>}

      <div className="mt-[26px] flex items-center gap-3">
        {onBack && <BackLink onClick={onBack}>{t("onboarding.back")}</BackLink>}
        <span className="flex-1" />
        <button
          type="button"
          onClick={onContinue}
          disabled={saving}
          className="inline-flex h-[46px] items-center justify-center gap-2 rounded-md bg-primary px-[22px] text-body font-medium text-primary-foreground transition-[background-color,transform] duration-[180ms] ease-[cubic-bezier(0.2,0.7,0.3,1)] hover:bg-[color-mix(in_srgb,var(--color-primary)_88%,var(--color-bg))] active:translate-y-[0.5px] disabled:opacity-50"
        >
          {saving ? t("onboarding.goals_saving") : t("onboarding.continue")}
          {!saving && <IcChevRight size={17} />}
        </button>
      </div>
    </div>
  );
}

function ChooseStep({
  account,
  selected,
  onSelect,
  onContinue,
  onBack,
  enoughPosts,
  postCount,
  importing = false,
}: {
  account: ConnectedAccount | null;
  selected: Mode;
  onSelect: (m: "analyze" | "scratch") => void;
  onContinue: () => void;
  onBack: (() => void) | null;
  enoughPosts: boolean;
  postCount: number;
  // The on-connect backfill is still running: the analyze card shows a live
  // "importing your posts…" state instead of the terminal locked verdict —
  // the page polls the status and the card unlocks by itself.
  importing?: boolean;
}) {
  const { t, locale } = useTranslation();
  const handle = account?.username ? `@${account.username}` : "your account";
  const modes: {
    id: "analyze" | "scratch";
    Icon: (p: IconProps) => ReactNode;
    title: MessageKey;
    desc: string;
    meta: MessageKey;
    recommended?: boolean;
  }[] = [
    {
      id: "analyze",
      Icon: IcScan,
      title: "onboarding.mode_analyze_title",
      desc: t("onboarding.mode_analyze_desc").replace("{handle}", handle),
      meta: "onboarding.mode_analyze_meta",
      recommended: true,
    },
    {
      id: "scratch",
      Icon: IcPenLine,
      title: "onboarding.mode_scratch_title",
      desc: t("onboarding.mode_scratch_desc"),
      meta: "onboarding.mode_scratch_meta",
    },
  ];
  return (
    <div style={RISE}>
      <div className="text-caption font-semibold uppercase tracking-[0.06em] text-accent">{t("onboarding.choose_eyebrow")}</div>
      <StepTitle>{t("onboarding.choose_title")}</StepTitle>
      <StepSub>{t("onboarding.choose_sub")}</StepSub>

      <div role="radiogroup" aria-label={t("a11y.voice_setup_method")} className="mt-6 flex flex-col gap-3">
        {modes.map((m) => {
          // While the history import is still running the analyze branch stays
          // SELECTABLE (the wait happens inside the analyze stage); it locks
          // only on the TERMINAL too-few verdict (import done, < the floor).
          const disabled = m.id === "analyze" && !enoughPosts && !importing;
          const active = selected === m.id && !disabled;
          return (
            <button
              key={m.id}
              role="radio"
              aria-checked={active}
              aria-disabled={disabled}
              onClick={() => {
                if (!disabled) onSelect(m.id);
              }}
              className={cn(
                "relative flex w-full items-start gap-3.5 rounded-lg border p-[18px] text-left transition-[border-color,background,box-shadow] duration-[120ms] ease-[cubic-bezier(0.2,0.7,0.3,1)]",
                disabled
                  ? "cursor-default border-border bg-surface-2 opacity-[0.72]"
                  : active
                    ? "border-text bg-surface shadow-[0_0_0_1px_var(--color-text)]"
                    : "border-border bg-surface hover:border-[color-mix(in_srgb,var(--color-text)_18%,var(--color-border))] hover:bg-surface-2",
              )}
            >
              <span
                className={cn(
                  "grid h-[42px] w-[42px] shrink-0 place-items-center rounded-md border",
                  active
                    ? "border-text bg-text text-bg"
                    : disabled
                      ? "border-border bg-surface text-text-subtle"
                      : "border-border bg-surface-2 text-text",
                )}
              >
                <m.Icon size={20} />
              </span>
              <span className="min-w-0 flex-1">
                {/* pr-7 keeps the title row (esp. the badge) clear of the
                    absolute top-right check (right-4) on the selected card. */}
                <span className="flex items-center gap-[9px] pr-7 max-[560px]:flex-wrap">
                  <span className="text-h3 font-semibold tracking-[-0.006em]">{t(m.title)}</span>
                  {m.recommended && !disabled && !(importing && !enoughPosts) && (
                    <span
                      className="shrink-0 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.03em] text-accent"
                      style={{
                        background: "color-mix(in srgb, var(--color-accent) 12%, var(--color-surface))",
                        borderColor: "color-mix(in srgb, var(--color-accent) 28%, transparent)",
                      }}
                    >
                      {t("onboarding.recommended")}
                    </span>
                  )}
                  {disabled && (
                    <span className="inline-flex shrink-0 items-center gap-[5px] whitespace-nowrap rounded-full border border-border bg-surface px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.03em] text-text-muted">
                      <IcLock size={12} /> {t("onboarding.choice_locked").replace("{need}", String(MIN_POSTS)).replace("{u}", pluralUnit(locale, "posts", MIN_POSTS))}
                    </span>
                  )}
                </span>
                <span className="mt-[5px] block text-pretty text-small leading-normal text-text-muted">
                  {disabled
                    ? t("onboarding.choice_locked_reason")
                        .replace("{need}", String(MIN_POSTS))
                        .replace("{handle}", handle)
                        .replace("{have}", String(postCount))
                    : m.desc}
                </span>
                {m.id === "analyze" && importing && !enoughPosts && (
                  <span className="mt-[7px] block text-pretty text-caption leading-normal text-text-subtle">
                    {t("onboarding.analyze_new_hint")}
                  </span>
                )}
                {!disabled && (
                  <span className="mt-[9px] inline-flex items-center gap-1.5 text-caption text-text-subtle">
                    <IcClock size={13} /> {t(m.meta)}
                  </span>
                )}
              </span>
              {!disabled && (
                <IcCheck
                  size={18}
                  className={cn("absolute right-4 top-4 shrink-0 text-text transition-opacity duration-[120ms]", active ? "opacity-100" : "opacity-0")}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-[26px] flex items-center gap-3">
        {onBack && (
          <BackLink onClick={onBack}>
            <IcArrowLeft size={15} /> {t("onboarding.back")}
          </BackLink>
        )}
        <span className="flex-1" />
        <Button variant="primary" size="lg" className="active:translate-y-[0.5px] max-[560px]:w-full" disabled={!selected} onClick={onContinue}>
          {t("onboarding.continue")} <IcArrowRight size={17} />
        </Button>
      </div>
    </div>
  );
}

// ───────────────────────────────── Analyze ──────────────────────────────────
function AnalyzeStep({
  account,
  stepIndex,
  slow,
  onCancel,
  importingNote,
}: {
  account: ConnectedAccount | null;
  stepIndex: number;
  slow?: boolean;
  onCancel?: () => void;
  // Pre-analysis wait: the history import is still landing posts — shown as a
  // live first row (spinner + counting copy) above the analysis steps.
  importingNote?: string;
}) {
  const { t } = useTranslation();
  return (
    <div style={RISE}>
      <div className="flex flex-col items-center px-0 pb-1 pt-2 text-center">
        <span className="h-10 w-10 text-text" style={{ animation: "nib-write 1.5s var(--ease-standard) infinite" }}>
          <IcNib size={40} />
        </span>
        <StepTitle center>{t("onboarding.analyze_learning")}</StepTitle>
        {account?.username && (
          <span className="mt-4 inline-flex items-center gap-2 text-small text-text-muted">
            <Avatar account={account} size={22} /> @{account.username}
          </span>
        )}
        <div className="mt-[22px] flex w-full max-w-[340px] flex-col gap-0.5 text-left">
          {importingNote && (
            <div className="flex items-center gap-3 px-1 py-[11px]">
              <span className="grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full border border-accent text-accent">
                <span className="h-[11px] w-[11px] animate-spin rounded-full border-2 border-current border-t-transparent" />
              </span>
              <span className="text-small font-medium text-text">{importingNote}</span>
            </div>
          )}
          {ANALYZE_STEPS.map((k, i) => {
            const state = i < stepIndex ? "done" : i === stepIndex ? "active" : "todo";
            return (
              <div key={k} className="flex items-center gap-3 border-t border-border px-1 py-[11px] first:border-t-0">
                <span
                  className={cn(
                    "grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full border transition-all duration-[180ms]",
                    state === "done"
                      ? "border-success bg-success text-success-foreground"
                      : state === "active"
                        ? "border-accent text-accent"
                        : "border-border bg-surface text-text-subtle",
                  )}
                >
                  {state === "done" ? (
                    <IcCheck size={13} />
                  ) : state === "active" ? (
                    <span className="h-[11px] w-[11px] animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <span className="h-[5px] w-[5px] rounded-full bg-current opacity-50" />
                  )}
                </span>
                <span className={cn("text-small transition-colors duration-[180ms]", state === "active" ? "font-medium text-text" : state === "done" ? "text-text" : "text-text-muted")}>
                  {t(k)}
                </span>
              </div>
            );
          })}
        </div>
        {slow && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="mt-5 text-small text-text-muted underline underline-offset-2 transition-colors hover:text-text"
          >
            {t("onboarding.analyze_slow")}
          </button>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────── Chip input ────────────────────────────────
function ChipInput({
  value,
  onChange,
  placeholder,
  suggestions,
  tone,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
  suggestions: string[];
  tone?: "avoid";
}) {
  const { t } = useTranslation();
  const [text, setText] = useState("");
  function add(v?: string) {
    const tt = (v ?? text).trim();
    if (!tt || value.some((x) => x.toLowerCase() === tt.toLowerCase())) {
      setText("");
      return;
    }
    onChange([...value, tt]);
    setText("");
  }
  const remove = (v: string) => onChange(value.filter((x) => x !== v));
  const remaining = suggestions.filter((s) => !value.some((v) => v.toLowerCase() === s.toLowerCase()));
  return (
    <>
      <div className="flex flex-wrap items-center gap-[7px] rounded-md border border-border bg-surface p-2 transition-[border-color,box-shadow] duration-[120ms] focus-within:border-accent focus-within:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-accent)_18%,transparent)]">
        {value.map((v) => (
          <span
            key={v}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border py-1 pl-2.5 pr-1 text-caption font-medium",
              tone === "avoid"
                ? "border-[color-mix(in_srgb,var(--color-danger)_26%,var(--color-border))] bg-[color-mix(in_srgb,var(--color-danger)_9%,var(--color-surface))] text-[color-mix(in_srgb,var(--color-danger)_75%,var(--color-text))]"
                : "border-border bg-surface-2 text-text",
            )}
          >
            {v}
            <button
              type="button"
              aria-label={t("onboarding.chip_remove_aria").replace("{item}", v)}
              onClick={() => remove(v)}
              className="grid h-4 w-4 place-items-center rounded-full text-text-subtle transition-colors hover:bg-[color-mix(in_srgb,var(--color-text)_10%,transparent)] hover:text-text"
            >
              <IcX size={11} />
            </button>
          </span>
        ))}
        <input
          value={text}
          placeholder={value.length === 0 ? placeholder : ""}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
            if (e.key === "Backspace" && !text && value.length) remove(value[value.length - 1]);
          }}
          className="min-w-[90px] flex-1 bg-transparent px-1 py-[5px] text-small text-text outline-none placeholder:text-text-subtle max-md:text-[16px]"
        />
      </div>
      {remaining.length > 0 && (
        <div className="mt-[9px] flex flex-wrap gap-[7px]">
          {remaining.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-[11px] py-[5px] text-caption text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
            >
              <IcPlus size={12} /> {s}
            </button>
          ))}
        </div>
      )}
    </>
  );
}

// ───────────────────────────────── Scratch ──────────────────────────────────
function ScratchStep({
  desc,
  setDesc,
  write,
  setWrite,
  avoid,
  setAvoid,
  busy,
  onCreate,
  onBack,
}: {
  desc: string;
  setDesc: (v: string) => void;
  write: string[];
  setWrite: (v: string[]) => void;
  avoid: string[];
  setAvoid: (v: string[]) => void;
  busy: boolean;
  onCreate: () => void;
  onBack: () => void;
}) {
  const { t } = useTranslation();
  const taRef = useRef<HTMLTextAreaElement>(null);
  const ready = desc.trim().length > 0 && write.length > 0;
  return (
    <div style={RISE}>
      <div className="text-caption font-semibold uppercase tracking-[0.06em] text-accent">{t("onboarding.scratch_eyebrow")}</div>
      <StepTitle>{t("onboarding.scratch_title")}</StepTitle>
      <StepSub>{t("onboarding.scratch_body")}</StepSub>

      <div className="mt-6">
        <label htmlFor="ob-desc" className="mb-2 block text-small font-semibold">
          {t("onboarding.form_intro_label")}
        </label>
        <textarea
          id="ob-desc"
          ref={taRef}
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder={t("onboarding.form_intro_ph")}
          className="min-h-[92px] w-full resize-y rounded-md border border-border bg-surface px-3 py-[11px] text-small leading-relaxed text-text outline-none transition-[border-color,box-shadow] duration-[120ms] placeholder:text-text-subtle focus:border-accent focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-accent)_18%,transparent)] max-md:text-[16px]"
        />
        <div className="mt-[9px] flex flex-wrap gap-[7px]">
          {STARTERS.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setDesc(s);
                taRef.current?.focus();
              }}
              className="max-w-full rounded-full border border-dashed border-border bg-surface px-3 py-1.5 text-left text-caption text-text-muted transition-colors duration-[120ms] hover:border-[color-mix(in_srgb,var(--color-text)_20%,var(--color-border))] hover:bg-surface-2 hover:text-text"
            >
              “{s.slice(0, 42)}…”
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <label className="mb-2 block text-small font-semibold">{t("onboarding.form_themes_label")}</label>
        <ChipInput value={write} onChange={setWrite} placeholder={t("onboarding.form_themes_ph")} suggestions={TOPICS_WRITE} />
      </div>

      <div className="mt-5">
        <label className="mb-2 block text-small font-semibold">
          {t("onboarding.form_exclude_label")}
          <span className="ml-1.5 font-normal text-text-subtle">{t("onboarding.optional")}</span>
        </label>
        <ChipInput value={avoid} onChange={setAvoid} placeholder={t("onboarding.form_exclude_ph")} suggestions={TOPICS_AVOID} tone="avoid" />
      </div>

      <div className="mt-6 flex items-center gap-3">
        <BackLink onClick={onBack}>
          <IcArrowLeft size={15} /> {t("onboarding.back")}
        </BackLink>
        <span className="flex-1" />
        <Button variant="primary" size="lg" className="active:translate-y-[0.5px] max-[560px]:w-full" loading={busy} disabled={busy || !ready} onClick={onCreate}>
          {t("onboarding.create_cta")} <IcArrowRight size={17} />
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────── Preview result (tester) ────────────────────────
const PREVIEW_VOICE = {
  summary:
    "Warm but never gushing — like a voice note to one friend who also makes things. Earns every claim with a small, specific moment, then gets out of the way.",
  themes: ["The craft of writing", "Building in public", "Creative courage", "Writing for the right hundred people"],
  traits: ["Plain words over clever ones", "Opens on a concrete moment", "Short paragraphs, one idea each", "Dry humour, usually self-directed"],
};
// Same sample voice, shaped as RoleBookSections — feeds the demo's REAL (non-preview)
// done step so ?demo=1 / /gallery reviewers can see the voice-summary cards there too.
const DEMO_VOICE_SECTIONS: RoleBookSections = {
  intro: PREVIEW_VOICE.summary,
  themes_include: PREVIEW_VOICE.themes.map((label) => ({ label })),
  voice_characteristics: PREVIEW_VOICE.traits.map((text) => ({ text })),
};

// Voice summary / themes / "how you sound" cards — shared by the tester-only
// preview result and the real done step (below), so a real user gets the
// same rich recap of the voice that was just built, not just a checkmark.
function VoiceCards({ summary, themes, traits }: { summary: string; themes: string[]; traits: string[] }) {
  const { t } = useTranslation();
  return (
    <div className="mt-[22px] flex flex-col gap-[18px]">
      <div>
        <div className="mb-2 text-caption font-semibold uppercase tracking-[0.05em] text-text-subtle">{t("onboarding.pv_summary_cap")}</div>
        <p className="rounded-md border border-border bg-surface-2 px-4 py-3.5 text-pretty text-body leading-relaxed text-text">{summary}</p>
      </div>
      <div>
        <div className="mb-2 text-caption font-semibold uppercase tracking-[0.05em] text-text-subtle">{t("onboarding.pv_themes_cap")}</div>
        <div className="flex flex-wrap gap-2">
          {themes.map((x) => (
            <span key={x} className="whitespace-nowrap rounded-full border border-border bg-surface-2 px-3 py-[5px] text-small font-medium text-text">
              {x}
            </span>
          ))}
        </div>
      </div>
      <div>
        <div className="mb-2 text-caption font-semibold uppercase tracking-[0.05em] text-text-subtle">{t("onboarding.pv_sound_cap")}</div>
        <ul className="flex flex-col gap-2">
          {traits.map((x) => (
            <li key={x} className="flex items-start gap-[9px] text-small leading-snug text-text">
              <IcCheck size={14} className="mt-0.5 shrink-0 text-success" /> {x}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function PreviewResult({
  account,
  mode,
  result,
}: {
  account: ConnectedAccount | null;
  mode: Mode;
  result?: OnboardingPreview | null;
}) {
  const { t } = useTranslation();
  const handle = account?.username ? `@${account.username}` : "your account";
  const src = mode === "scratch" ? t("onboarding.preview_src_scratch") : t("onboarding.preview_src_posts").replace("{handle}", handle);
  // Live preview result → flatten to the design's summary/themes/traits shape;
  // demo falls back to the sample voice.
  const summary = result?.sections?.intro || PREVIEW_VOICE.summary;
  const themes = result?.sections?.themes_include?.map((x) => x.label) ?? PREVIEW_VOICE.themes;
  const traits = result?.sections?.voice_characteristics?.map((x) => (x.label ? `${x.label}: ${x.text}` : x.text)) ?? PREVIEW_VOICE.traits;
  return (
    <div style={RISE}>
      <div className="flex flex-col items-center text-center">
        <span className="inline-flex items-center gap-[7px] rounded-full border bg-surface px-[11px] py-[5px] pl-[9px] text-small text-accent" style={{ borderColor: "color-mix(in srgb, var(--color-accent) 30%, var(--color-border))" }}>
          <span className="h-[7px] w-[7px] rounded-full bg-accent" /> {t("onboarding.preview_pill_done")}
        </span>
        <h1 className="mt-4 text-balance text-h1 font-semibold leading-[1.6] tracking-[-0.015em] max-[560px]:text-h2">{t("onboarding.preview_would_title")}</h1>
        <StepSub center>{t("onboarding.preview_would_sub").replace("{src}", src)}</StepSub>
      </div>
      <VoiceCards summary={summary} themes={themes} traits={traits} />
      <div className="mt-[26px] flex items-center gap-3">
        <BackLink href="/app/settings">
          <IcArrowLeft size={15} /> {t("onboarding.back_to_settings")}
        </BackLink>
        <span className="flex-1" />
        <Link href="/app/onboarding" className={PRIMARY_LG}>
          {t("onboarding.preview_run")} <IcArrowRight size={17} />
        </Link>
      </div>
    </div>
  );
}

// ────────────────────────────────── Done ────────────────────────────────────
function DoneStep({
  account,
  connected,
  mode,
  preview,
  previewResult,
  voiceSections,
  onGo,
}: {
  account: ConnectedAccount | null;
  connected: boolean;
  mode: Mode;
  preview: boolean;
  previewResult?: OnboardingPreview | null;
  voiceSections?: RoleBookSections | null;
  onGo: () => void;
}) {
  const { t } = useTranslation();
  if (preview) return <PreviewResult account={account} mode={mode} result={previewResult} />;
  const handle = account?.username ? `@${account.username}` : "";
  const first = account ? nameOf(account).split(" ")[0] : "";
  const voiceLabel = mode === "scratch" ? t("onboarding.voice_scratch") : mode === "analyze" ? t("onboarding.voice_analyzed") : t("onboarding.voice_later");
  return (
    <div style={RISE}>
      <div className="flex flex-col items-center text-center">
        <span
          className="mb-[18px] grid h-16 w-16 place-items-center rounded-full text-success"
          style={{
            background: "color-mix(in srgb, var(--color-success) 15%, var(--color-surface))",
            border: "1px solid color-mix(in srgb, var(--color-success) 32%, transparent)",
            animation: "pop-in var(--duration-slow) var(--ease-entrance) both",
          }}
        >
          <IcCheck size={30} />
        </span>
        <h1 className="mx-auto max-w-[42ch] text-balance text-h1 font-semibold leading-[1.6] tracking-[-0.015em] max-[560px]:text-h2">
          {connected ? t("onboarding.done_title_set").replace("{name}", first) : t("onboarding.done_title_skip")}
        </h1>
        <StepSub center>{connected ? t("onboarding.done_sub_set").replace("{handle}", handle) : t("onboarding.done_sub_skip")}</StepSub>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-border">
        <div className="flex items-center gap-3 px-[15px] py-[13px]">
          <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-sm border border-border bg-surface-2 text-text-muted">
            <IcAt size={16} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-caption text-text-subtle">{t("onboarding.recap_account")}</div>
            <div className="mt-px text-small font-semibold">{connected ? handle : t("onboarding.recap_account_later")}</div>
          </div>
          {connected && <IcCheck size={17} className="ml-auto shrink-0 text-success" />}
        </div>
        <div className="flex items-center gap-3 border-t border-border px-[15px] py-[13px]">
          <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-sm border border-border bg-surface-2 text-text-muted">
            <IcVoice size={16} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-caption text-text-subtle">{t("onboarding.recap_voice")}</div>
            <div className="mt-px text-small font-semibold">{voiceLabel}</div>
          </div>
          {mode && <IcCheck size={17} className="ml-auto shrink-0 text-success" />}
        </div>
      </div>

      {mode && voiceSections && (
        <VoiceCards
          summary={voiceSections.intro || ""}
          themes={voiceSections.themes_include?.map((x) => x.label) ?? []}
          traits={voiceSections.voice_characteristics?.map((x) => (x.label ? `${x.label}: ${x.text}` : x.text)) ?? []}
        />
      )}

      <div className="mt-6 flex items-center gap-3">
        <BackLink href="/app/role-book">{t("onboarding.refine_voice")}</BackLink>
        <span className="flex-1" />
        <button onClick={onGo} className={PRIMARY_LG}>
          {t("onboarding.go_studio")} <IcArrowRight size={17} />
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════ Demo (tester) ═════════════════════════════
type ObTweaks = { demo: boolean; entry: string; posts: string; preview: boolean; jump: string; dark: boolean };
const OB_TWEAKS: ObTweaks = { demo: false, entry: "First run", posts: "Enough", preview: false, jump: "Connect", dark: false };
const JUMP_TO_STAGE: Record<string, Stage> = { Connect: "connect", Goals: "goals", Choose: "choose", Analyze: "analyze", Scratch: "scratch", Done: "done" };
const IS_DEV = process.env.NODE_ENV === "development";
function isDemoUrl(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return new URLSearchParams(window.location.search).get("demo") === "1";
  } catch {
    return false;
  }
}

// A fully simulated flow on mock data, so every onboarding state can be checked
// 1:1 with the design without a backend. Reuses the same step components.
const DEMO_ACCOUNT = {
  id: 1,
  tenant_id: 1,
  threads_user_id: "t_demo",
  username: "mara.lin",
  display_name: "Mara Lin",
  profile_picture_url: null,
  followers_count: 8420,
  connected_at: "2026-05-01T00:00:00Z",
  disconnected_at: null,
} as unknown as ConnectedAccount;

function OnboardingDemo({ tw }: { tw: ObTweaks }) {
  const router = useRouter();
  const firstRun = tw.entry !== "Revisit";
  const enoughPosts = tw.posts !== "Too few";
  const postCount = enoughPosts ? 214 : 6;

  const [stage, setStage] = useState<Stage>(firstRun ? "connect" : "choose");
  const [connectStatus, setConnectStatus] = useState<ConnectStatus>(firstRun ? "idle" : "connected");
  const [connected, setConnected] = useState(!firstRun);
  const [mode, setMode] = useState<Mode>(null);
  const [chosen, setChosen] = useState<Mode>(firstRun ? null : enoughPosts ? null : "scratch");
  const [anIndex, setAnIndex] = useState(0);
  const [demoGoals, setDemoGoals] = useState<string[]>([]);
  const [desc, setDesc] = useState("");
  const [write, setWrite] = useState<string[]>([]);
  const [avoid, setAvoid] = useState<string[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function resetAll() {
    if (timer.current) clearTimeout(timer.current);
    setStage("connect");
    setConnectStatus("idle");
    setConnected(false);
    setMode(null);
    setChosen(null);
    setAnIndex(0);
    setDesc("");
    setWrite([]);
    setAvoid([]);
  }

  // Entry tweak → reset to the natural start for that entry.
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (firstRun) resetAll();
    else {
      setConnected(true);
      setConnectStatus("connected");
      setMode(null);
      setAnIndex(0);
      setStage("choose");
      setChosen(enoughPosts ? null : "scratch");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tw.entry]);

  // Jump-to-stage walkthrough.
  useEffect(() => {
    const target = JUMP_TO_STAGE[tw.jump];
    if (!target || target === stage) return;
    if (timer.current) clearTimeout(timer.current);
    if (target === "connect") {
      resetAll();
      return;
    }
    setConnectStatus("connected");
    setConnected(true);
    if (target === "goals") {
      setStage("goals");
    } else if (target === "choose") {
      setChosen(enoughPosts ? "analyze" : "scratch");
      setStage("choose");
    } else if (target === "analyze") {
      setChosen("analyze");
      runAnalyze();
    } else if (target === "scratch") {
      setChosen("scratch");
      setStage("scratch");
    } else if (target === "done") {
      setMode("analyze");
      setStage("done");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tw.jump]);

  // Pre-select the recommended option on the choose step (analyze when there
  // are enough posts, else scratch) — and keep a valid selection when locked.
  useEffect(() => {
    if (stage !== "choose") return;
    if (!enoughPosts) {
      if (chosen !== "scratch") setChosen("scratch");
    } else if (chosen === null) {
      setChosen("analyze");
    }
  }, [stage, enoughPosts, chosen]);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  function connect() {
    setConnectStatus("connecting");
    timer.current = setTimeout(() => {
      setConnectStatus("connected");
      setConnected(true);
    }, 1500);
  }
  function runAnalyze() {
    setStage("analyze");
    setAnIndex(0);
    let i = 0;
    const tick = () => {
      i += 1;
      if (i < ANALYZE_STEPS.length) {
        setAnIndex(i);
        timer.current = setTimeout(tick, 1100);
      } else {
        setAnIndex(ANALYZE_STEPS.length);
        timer.current = setTimeout(() => {
          setMode("analyze");
          setStage("done");
        }, 800);
      }
    };
    timer.current = setTimeout(tick, 1100);
  }

  const showSkip = firstRun && !tw.preview && stage !== "done" && stage !== "analyze";
  const showBack = (!firstRun || tw.preview) && stage !== "analyze";
  const wide = stage === "scratch" || (stage === "done" && tw.preview);

  return (
    <Frame
      stepIndex={STAGE_INDEX[stage]}
      showSkip={showSkip}
      showBack={showBack}
      preview={tw.preview}
      onSkip={() => setStage("done")}
      wide={wide}
    >
      {stage === "connect" ? (
        <ConnectStep
          status={connectStatus}
          account={connected ? DEMO_ACCOUNT : null}
          onConnect={connect}
          onContinue={() => setStage(firstRun ? "goals" : "choose")}
        />
      ) : stage === "goals" ? (
        <GoalsStep
          picked={demoGoals}
          onToggle={(id) =>
            setDemoGoals((g) => (g.includes(id) ? g.filter((x) => x !== id) : [...g, id]))
          }
          onContinue={() => setStage("choose")}
          onBack={() => setStage("connect")}
        />
      ) : stage === "choose" ? (
        <ChooseStep
          account={DEMO_ACCOUNT}
          selected={chosen}
          onSelect={setChosen}
          onContinue={() => (chosen === "analyze" ? runAnalyze() : setStage("scratch"))}
          onBack={firstRun ? () => setStage("connect") : null}
          enoughPosts={enoughPosts}
          postCount={postCount}
        />
      ) : stage === "analyze" ? (
        <AnalyzeStep account={DEMO_ACCOUNT} stepIndex={anIndex} />
      ) : stage === "scratch" ? (
        <ScratchStep
          desc={desc}
          setDesc={setDesc}
          write={write}
          setWrite={setWrite}
          avoid={avoid}
          setAvoid={setAvoid}
          busy={false}
          onCreate={() => {
            setMode("scratch");
            setStage("done");
          }}
          onBack={() => setStage("choose")}
        />
      ) : (
        <DoneStep
          account={DEMO_ACCOUNT}
          connected={connected}
          mode={mode}
          preview={tw.preview}
          voiceSections={DEMO_VOICE_SECTIONS}
          onGo={() => router.replace("/app")}
        />
      )}
    </Frame>
  );
}

// ════════════════════════════════ Live flow ═════════════════════════════════
export default function OnboardingPage() {
  const router = useRouter();
  const [tw, setTw] = useTweaks(OB_TWEAKS);
  const [tester, setTester] = useState(false);

  const [stage, setStage] = useState<Stage>("loading");
  const [accountId, setAccountId] = useState<number | null>(null);
  const [connectedAccount, setConnectedAccount] = useState<ConnectedAccount | null>(null);
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [connectStatus, setConnectStatus] = useState<ConnectStatus>("idle");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alreadySetUp, setAlreadySetUp] = useState(false);
  const [preview, setPreview] = useState(false);
  const [previewResult, setPreviewResult] = useState<OnboardingPreview | null>(null);
  // Real (non-preview) done step recap: fetched once the real analyze/from-scratch
  // call lands, so the done screen can show the same voice-summary/themes/traits
  // cards as the tester preview instead of a bare two-line recap. Fire-and-forget
  // (the done screen must never block on it) — null just omits the cards.
  const [voiceSections, setVoiceSections] = useState<RoleBookSections | null>(null);
  const [mode, setMode] = useState<Mode>(null);
  const [anIndex, setAnIndex] = useState(0);
  const [analyzeSlow, setAnalyzeSlow] = useState(false);
  const [awaitingImport, setAwaitingImport] = useState(false);

  const [desc, setDesc] = useState("");
  const [write, setWrite] = useState<string[]>([]);
  const [avoid, setAvoid] = useState<string[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const { t, locale } = useTranslation();

  useEffect(() => {
    if (!getTokens()) return;
    fetchMe()
      .then((m) => {
        setTester(m.is_tester);
        // C8: a non-tester who lands with ?demo=1 used to hang on the loader
        // forever — the boot effect skipped the real load while the demo
        // render itself is tester-gated. The boot guard checks BOTH the tweak
        // flag AND the raw URL (isDemoUrl), so dropping the flag alone is not
        // enough: strip the param from the URL too, then flip the flag — the
        // boot effect (deps: tw.demo) re-runs and finally loads live data.
        if (m.is_tester !== true && !IS_DEV) {
          try {
            const url = new URL(window.location.href);
            if (url.searchParams.has("demo")) {
              url.searchParams.delete("demo");
              window.history.replaceState({}, "", url.toString());
            }
          } catch {
            /* no-op */
          }
          setTw("demo", false);
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (tw.demo) document.documentElement.classList.toggle("dark", !!tw.dark);
  }, [tw.demo, tw.dark]);
  useEffect(() => {
    try {
      if (new URLSearchParams(window.location.search).get("demo") === "1") setTw("demo", true);
    } catch {
      /* no-op */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (tw.demo || isDemoUrl()) return; // demo renders mock data; don't hit the backend
    if (!getTokens()) {
      router.replace("/app/login");
      return;
    }
    const params = new URLSearchParams(window.location.search);
    setPreview(params.get("preview") === "1");
    const justConnected = params.get("threads_connected") === "1";
    const connectErr = params.get("threads_error");
    if (justConnected || connectErr) {
      const url = new URL(window.location.href);
      url.searchParams.delete("threads_connected");
      url.searchParams.delete("threads_error");
      window.history.replaceState({}, "", url.toString());
    }
    (async () => {
      try {
        const list = await fetchMyAccounts();
        const active = list.accounts.filter((a) => a.disconnected_at === null);
        if (active.length === 0) {
          if (connectErr) setError(t("onboarding.connect_failed"));
          setStage("connect");
          return;
        }
        const target = justConnected
          ? active.reduce((a, b) => (b.connected_at > a.connected_at ? b : a))
          : active.find((a) => a.id === getSelectedAccountId()) ?? active[0];
        setSelectedAccountId(target.id);
        setAccountId(target.id);
        const st = await fetchOnboardingStatus(target.id);
        setStatus(st);
        setAlreadySetUp(!st.needs_onboarding);
        if (justConnected) {
          setConnectedAccount(target);
          setConnectStatus("connected");
          setStage("connect");
        } else {
          setConnectedAccount(target);
          setConnectStatus("connected");
          setStage("choose");
        }
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          clearTokens();
          router.replace("/app/login");
          return;
        }
        setError(errMsg(e, t));
        setStage("choose");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tw.demo]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const enoughPosts = status?.can_analyze ?? false;
  const postCount = status?.post_count ?? 0;
  const importing = status?.importing ?? false;

  // The just-connected account races the ~1-min history backfill: while it
  // runs, poll the status so the analyze card counts up and unlocks by itself
  // (before this, the wizard froze on the first-seconds snapshot — «их 3»).
  const userPicked = useRef(false);
  useEffect(() => {
    if (!importing || accountId == null) return;
    let inFlight = false;
    let polls = 0;
    const id = window.setInterval(async () => {
      if (inFlight) return;
      polls += 1;
      if (polls > 60) {
        window.clearInterval(id);
        return;
      }
      inFlight = true;
      try {
        const st = await fetchOnboardingStatus(accountId);
        setStatus(st);
        // The recommended branch just unlocked and the user hasn't chosen
        // anything themselves — move the preselection onto it.
        if (st.can_analyze && !userPicked.current) setMode("analyze");
        // Terminal short verdict while idling on choose: the analyze card just
        // locked — a lingering mode="analyze" would keep Continue armed on a
        // disabled card (the hard guard above also covers it; this fixes the UI).
        if (!st.can_analyze && !(st.importing ?? false)) {
          setMode((m) => (m === "analyze" ? null : m));
        }
      } catch {
        /* transient poll failure — try again next tick */
      } finally {
        inFlight = false;
      }
    }, 5000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [importing, accountId]);
  // Revisit = arrived already set up (came from Settings): Connect is done,
  // show "Back to Settings". First-run shows "Skip for now".
  const firstRun = !alreadySetUp;

  // Goals step. Picking nothing is allowed (variant B), so nothing here blocks
  // Continue — and a failed save doesn't either: the answer decides which
  // sidebar entries get a badge, and holding someone at a hint over a network
  // blip would be the wrong trade. We log it and move on.
  const [goals, setGoals] = useState<string[]>([]);
  const [savingGoals, setSavingGoals] = useState(false);
  function toggleGoal(id: string) {
    setGoals((g) => (g.includes(id) ? g.filter((x) => x !== id) : [...g, id]));
  }
  async function saveGoals() {
    if (savingGoals) return;
    setSavingGoals(true);
    try {
      await setMyFocus(goals);
      captureEvent("onboarding.goals_picked", { count: goals.length, areas: goals.join(",") });
    } catch {
      /* cosmetic — the voice setup matters more than the badges */
    } finally {
      setSavingGoals(false);
      setStage("choose");
    }
  }

  // Pre-select the recommended option once the choose step opens: analyze when
  // there are enough posts (the recommended branch), else scratch. So the user
  // lands on a valid default and "Continue" isn't dead on arrival — they just
  // confirm or switch. Only fills an empty selection; never overrides a choice.
  useEffect(() => {
    if (stage === "choose" && status && mode === null) {
      // While the import is still landing posts the analyze branch is the
      // optimistic default — the wait happens inside the analyze stage.
      setMode(enoughPosts || importing ? "analyze" : "scratch");
    }
  }, [stage, status, mode, enoughPosts, importing]);

  async function onConnect() {
    setConnectStatus("connecting");
    setError(null);
    captureEvent("ui.threads_connect_clicked", { variant: "onboarding" });
    try {
      const returnUrl = `${window.location.origin}/app/onboarding`;
      const { authorize_url } = await startThreadsConnect(returnUrl);
      window.location.href = authorize_url;
    } catch {
      setConnectStatus("idle");
      setError(t("onboarding.connect_failed"));
    }
  }

  async function runAnalyze() {
    if (accountId === null) return;
    setError(null);
    // HARD floor guard: below the post floor with the import finished, analyze
    // must never fire (the backend only rejects at ZERO posts, so a stale
    // mode="analyze" clicking Continue would run a real low-quality extraction).
    if (!enoughPosts && !importing) {
      setMode(null); // the preset effect re-fills with "scratch"
      setError(
        t(
          pluralKey(locale, postCount, {
            one: "onboarding.import_too_few_one",
            few: "onboarding.import_too_few_few",
            many: "onboarding.import_too_few_many",
          }),
        )
          .replace("{need}", String(MIN_POSTS))
          .replace("{have}", String(postCount)),
      );
      setStage("choose");
      return;
    }
    // The import is still landing posts and the floor isn't met yet: enter the
    // analyze stage in a WAITING phase — the status poll keeps running, and the
    // effect below fires the real analysis the moment enough posts land (or
    // bails to the terminal locked verdict if the import ends short). Preview
    // testers wait the same way (a below-floor preview is as misleading).
    if (!enoughPosts && importing) {
      captureEvent("ui.onboarding_analyze_wait_import", { account_id: accountId });
      setAwaitingImport(true);
      setStage("analyze");
      setAnIndex(0);
      setAnalyzeSlow(false);
      return;
    }
    captureEvent("ui.onboarding_analyze", { account_id: accountId, preview });
    if (preview) {
      setBusy(true);
      try {
        setPreviewResult(await onboardingAnalyzePreview(accountId));
        setMode("analyze");
        setStage("done");
      } catch (e) {
        setError(errMsg(e, t));
      } finally {
        setBusy(false);
      }
      return;
    }
    setStage("analyze");
    setAnIndex(0);
    setAnalyzeSlow(false);
    timers.current.forEach(clearTimeout);
    timers.current = [];
    const n = ANALYZE_STEPS.length;
    for (let i = 1; i < n; i++) timers.current.push(setTimeout(() => setAnIndex(i), i * 1100));
    const minDelay = new Promise<void>((r) => timers.current.push(setTimeout(r, n * 1100)));
    // Reveal an escape link if it drags, and hard-stop an infinite hang so the
    // analyze stage (Back/Skip hidden) can never trap the user.
    timers.current.push(setTimeout(() => setAnalyzeSlow(true), ANALYZE_SLOW_MS));
    const call = onboardingAnalyze(accountId);
    call.catch(() => {}); // swallow a late rejection if the timeout already fired
    const timeout = new Promise<never>((_, reject) => {
      timers.current.push(setTimeout(() => reject(new AnalyzeTimeout()), ANALYZE_TIMEOUT_MS));
    });
    try {
      await Promise.all([Promise.race([call, timeout]), minDelay]);
      setAnIndex(n);
      setMode("analyze");
      setStage("done");
      void fetchRoleBook(accountId)
        .then((rb) => setVoiceSections(rb.sections))
        .catch(() => {});
    } catch (e) {
      if (e instanceof AnalyzeTimeout) {
        setError(t("onboarding.analyze_timeout"));
        setStage("choose");
      } else if (e instanceof ApiError && e.status === 422) {
        setError(t("onboarding.analyze_none"));
        setStage("scratch");
      } else {
        setError(errMsg(e, t));
        setStage("choose");
      }
    } finally {
      setAnalyzeSlow(false);
    }
  }

  // Free the UI if the user bails during a slow analyze (the server call keeps
  // running; if it succeeds the voice is created and shows on next load).
  function cancelAnalyze() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setAwaitingImport(false);
    setAnalyzeSlow(false);
    setError(null);
    setStage("choose");
  }

  // The wait stage must not outlive the status poll (it hard-caps at 60 ticks
  // with no state change): a bounded timeout bails back to choose with the
  // standard slow-analyze message.
  useEffect(() => {
    if (!awaitingImport || stage !== "analyze") return;
    const id = window.setTimeout(() => {
      setAwaitingImport(false);
      setError(t("onboarding.analyze_timeout"));
      setStage("choose");
    }, 120_000);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [awaitingImport, stage]);

  // The analyze-stage WAIT resolves off the live status poll: enough posts →
  // run the real analysis; import finished short → back to choose with the
  // terminal locked verdict spelled out.
  useEffect(() => {
    if (!awaitingImport || stage !== "analyze") return;
    if (enoughPosts) {
      setAwaitingImport(false);
      void runAnalyze();
      return;
    }
    if (!importing) {
      setAwaitingImport(false);
      setMode(null); // never leave a locked card "selected" — preset → scratch
      setError(
        t(
          pluralKey(locale, postCount, {
            one: "onboarding.import_too_few_one",
            few: "onboarding.import_too_few_few",
            many: "onboarding.import_too_few_many",
          }),
        )
          .replace("{need}", String(MIN_POSTS))
          .replace("{have}", String(postCount)),
      );
      setStage("choose");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [awaitingImport, stage, enoughPosts, importing, postCount]);

  async function onCreate() {
    if (accountId === null) return;
    if (!desc.trim() && write.length === 0) {
      setError(t("onboarding.error_empty"));
      return;
    }
    setBusy(true);
    setError(null);
    captureEvent("ui.onboarding_from_scratch", { account_id: accountId, preview });
    const payload = { intro: desc.trim(), themes_include: write, themes_exclude: avoid };
    try {
      if (preview) {
        setPreviewResult(await onboardingFromScratchPreview(accountId, payload));
        setMode("scratch");
        setStage("done");
        setBusy(false);
        return;
      }
      await onboardingFromScratch(accountId, payload);
      setMode("scratch");
      setStage("done");
      void fetchRoleBook(accountId)
        .then((rb) => setVoiceSections(rb.sections))
        .catch(() => {});
    } catch (e) {
      setError(errMsg(e, t));
    } finally {
      setBusy(false);
    }
  }

  function onSkip() {
    // Pre-connect there is nothing to skip TO: without an account the skip
    // can't be recorded and /app would bounce right back here. The button is
    // hidden in that state (showSkip); this guard keeps the invariant even if
    // some future path calls onSkip directly.
    if (accountId === null) return;
    // Fire-and-forget: the done screen's "Go to studio" button is the earliest
    // the user can navigate away, giving this ample time to land server-side
    // before /app re-checks onboarding_skipped. A failure here just means a
    // later visit may bounce back into the wizard once more — no worse than
    // the old localStorage-only behavior.
    void skipOnboarding(accountId).catch(() => {});
    captureEvent("ui.onboarding_skipped", { account_id: accountId });
    setMode(null);
    setStage("done");
  }

  const allow = tester || IS_DEV;
  if (allow && tw.demo) {
    return (
      <>
        <OnboardingDemo tw={tw} />
        <ObTweaksPanel tw={tw} setTw={setTw} />
      </>
    );
  }

  // accountId !== null: skipping is only meaningful once Threads is connected —
  // pre-connect, onSkip couldn't record the skip (no account), showed the false
  // «You're good to go», and /app bounced straight back here (B6).
  const showSkip = accountId !== null && firstRun && !preview && !alreadySetUp && stage !== "done" && stage !== "analyze" && stage !== "loading";
  const showBack = (alreadySetUp || preview) && stage !== "analyze" && stage !== "loading";
  const wide = stage === "scratch" || (stage === "done" && preview);
  const acct = connectedAccount;

  return (
    <>
      {stage === "loading" ? (
        <div className="flex min-h-screen items-center justify-center text-text" style={{ background: OB_BG }}>
          <Spinner size={20} label={t("a11y.loading")} />
        </div>
      ) : (
        <Frame stepIndex={STAGE_INDEX[stage]} showSkip={showSkip} showBack={showBack} preview={preview} onSkip={onSkip} wide={wide}>
          {error && (
            <div className="mb-5 rounded-md border border-danger/40 bg-danger/10 p-3 text-small text-danger">{error}</div>
          )}
          {stage === "connect" ? (
            <ConnectStep
              status={connectStatus}
              account={acct}
              onConnect={onConnect}
              // First run meets the goals step; a revisit from Settings goes
              // straight to the voice choice — this is a one-time introduction,
              // not a question to re-ask every time someone edits their voice.
              onContinue={() => setStage(firstRun ? "goals" : "choose")}
            />
          ) : stage === "goals" ? (
            <GoalsStep
              picked={goals}
              onToggle={toggleGoal}
              onContinue={saveGoals}
              onBack={() => setStage("connect")}
              saving={savingGoals}
            />
          ) : stage === "choose" ? (
            <ChooseStep
              account={acct}
              selected={mode}
              onSelect={(m) => {
                userPicked.current = true;
                setMode(m);
              }}
              onContinue={() => (mode === "analyze" ? runAnalyze() : setStage("scratch"))}
              onBack={null}
              enoughPosts={enoughPosts}
              postCount={postCount}
              importing={importing}
            />
          ) : stage === "analyze" ? (
            <AnalyzeStep
              account={acct}
              stepIndex={awaitingImport ? -1 : anIndex}
              slow={analyzeSlow || awaitingImport}
              onCancel={cancelAnalyze}
              importingNote={
                awaitingImport
                  ? t("onboarding.import_wait_note").replace("{have}", String(postCount))
                  : undefined
              }
            />
          ) : stage === "scratch" ? (
            <ScratchStep
              desc={desc}
              setDesc={setDesc}
              write={write}
              setWrite={setWrite}
              avoid={avoid}
              setAvoid={setAvoid}
              busy={busy}
              onCreate={onCreate}
              onBack={() => setStage("choose")}
            />
          ) : (
            <DoneStep
              account={acct}
              connected={!!acct}
              mode={mode}
              preview={preview}
              previewResult={previewResult}
              voiceSections={voiceSections}
              onGo={() => router.replace("/app")}
            />
          )}
        </Frame>
      )}
      {allow && <ObTweaksPanel tw={tw} setTw={setTw} />}
    </>
  );
}

// ───────────────────────────────── Tweaks ───────────────────────────────────
function ObTweaksPanel({ tw, setTw }: { tw: ObTweaks; setTw: (k: keyof ObTweaks, v: ObTweaks[keyof ObTweaks]) => void }) {
  return (
    <TweaksPanel title="Onboarding">
      <TweakSection label="Demo" />
      <TweakToggle label="Mock data" value={tw.demo} onChange={(v) => setTw("demo", v)} />
      <TweakSection label="Entry" />
      <TweakRadio label="Started from" value={tw.entry} options={["First run", "Revisit"]} onChange={(v) => setTw("entry", v)} />
      <TweakRadio label="Account posts" value={tw.posts} options={["Enough", "Too few"]} onChange={(v) => setTw("posts", v)} />
      <TweakToggle label="Preview mode" value={tw.preview} onChange={(v) => setTw("preview", v)} />
      <TweakSection label="Walkthrough" />
      <TweakRadio label="Jump to" value={tw.jump} options={["Connect", "Goals", "Choose", "Analyze", "Scratch", "Done"]} onChange={(v) => setTw("jump", v)} />
      <TweakButton label="Restart flow" onClick={() => setTw("jump", "Connect")} />
      <TweakSection label="Appearance" />
      <TweakToggle label="Dark mode" value={tw.dark} onChange={(v) => setTw("dark", v)} />
    </TweaksPanel>
  );
}
