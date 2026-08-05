"use client";

// Pattern study presentational layer — pure components driven by props, so the
// live screen (real API) and the ?demo=1 review (mock data) render the same
// pixels. Built 1:1 to Patterns-SPEC.html: empty / idle / running / results
// phases + the evidence-backed PatternCard. No skeletons (running = nib-write +
// stepped progress). Reading-width 720.

import { type ReactNode } from "react";

import { cn } from "@/lib/cn";
import { useTranslation, pluralKey, pluralUnit, type MessageKey } from "@/lib/i18n";
import { buttonClasses } from "@/components/ui/button";
import { IcCheck, IcNib, IcStudy, IcTweak } from "@/components/icons";
import type { PatternCardModel } from "@/components/studio/patterns-demo";

const LOOKS_FOR: MessageKey[] = ["patterns.looks_hooks", "patterns.looks_length", "patterns.looks_topics", "patterns.looks_timing", "patterns.looks_format", "patterns.looks_questions"];
export const RUN_STEPS: MessageKey[] = ["patterns.step_read", "patterns.step_group", "patterns.step_test", "patterns.step_rank"];

function withVar(s: string, vars: Record<string, string | number>): string {
  return Object.entries(vars).reduce((acc, [k, v]) => acc.replace(`{${k}}`, String(v)), s);
}

// ─────────────────────────────── EmptyView ──────────────────────────────────
export function EmptyView({ have, need }: { have: number; need: number }) {
  const { t, locale } = useTranslation();
  return (
    <div className="flex flex-col items-center rounded-lg border border-dashed border-border bg-surface/50 px-7 py-[60px] text-center">
      <span className="mb-[18px] grid h-[54px] w-[54px] place-items-center rounded-lg border border-border bg-surface-2 text-text-subtle">
        <IcStudy size={26} />
      </span>
      <h2 className="text-h2 font-semibold tracking-[-0.01em]">{t("patterns.empty_title")}</h2>
      <p className="mt-2 max-w-[44ch] text-body leading-[1.55] text-text-muted">{withVar(t("patterns.empty_sub"), { need })}</p>
      <div className="mt-[22px] w-full max-w-[280px]">
        <div className="h-2 overflow-hidden rounded-full border border-border bg-surface-2">
          <span className="block h-full rounded-full bg-accent" style={{ width: `${Math.min(100, (have / need) * 100)}%` }} />
        </div>
        <div className="mt-[9px] text-caption text-text-subtle">{withVar(t("patterns.of_posts"), { have, need }).replace("{u}", pluralUnit(locale, "posts", need))}</div>
      </div>
    </div>
  );
}

// ─────────────────────────────── IdleView ───────────────────────────────────
export function IdleView({ postsAnalyzed, onRun }: { postsAnalyzed: number; onRun: () => void }) {
  const { t, locale } = useTranslation();
  return (
    <div className="flex flex-col items-center rounded-2xl border border-border bg-surface px-10 pb-9 pt-10 text-center shadow-sm max-md:px-6">
      <span className="mb-5 grid h-14 w-14 place-items-center rounded-lg border border-border bg-surface-2 text-text">
        <IcStudy size={28} />
      </span>
      <h2 className="text-h1 font-semibold tracking-[-0.015em]">{t("patterns.idle_title")}</h2>
      <p className="mt-3 max-w-[46ch] text-body leading-[1.6] text-text-muted">{t("patterns.idle_body")}</p>
      <button onClick={onRun} className={cn("mt-[26px]", buttonClasses({ variant: "primary", size: "lg" }))}>
        <IcStudy size={18} /> {t("patterns.run_study")}
      </button>
      <div className="mt-[18px] flex items-center gap-2.5 text-caption text-text-subtle max-md:flex-wrap max-md:justify-center">
        {withVar(
          t(pluralKey(locale, postsAnalyzed, { one: "patterns.idle_scope_one", few: "patterns.idle_scope_few", many: "patterns.idle_scope_many" })),
          { n: postsAnalyzed },
        )}
        <span className="h-1 w-1 rounded-full bg-text-subtle" />
        {t("patterns.idle_time")}
      </div>
      <div className="mt-7 flex max-w-[460px] flex-wrap justify-center gap-2">
        {LOOKS_FOR.map((k) => (
          <span key={k} className="whitespace-nowrap rounded-full border border-border bg-surface-2 px-[11px] py-[5px] text-caption text-text-muted">
            {t(k)}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────── RunningView ────────────────────────────────
export function RunningView({ step }: { step: number }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center rounded-2xl border border-border bg-surface px-10 py-11 shadow-sm max-md:px-6">
      <span className="text-text" style={{ animation: "nib-write 1.5s var(--ease-standard) infinite" }}>
        <IcNib size={40} />
      </span>
      <h2 className="mt-[18px] text-h2 font-semibold tracking-[-0.01em]">{t("patterns.running_title")}</h2>
      <p className="mt-1.5 text-small text-text-muted">{t("patterns.running_body")}</p>
      <div className="mt-7 flex w-full max-w-[320px] flex-col gap-3">
        {RUN_STEPS.map((k, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <div key={k} className={cn("flex items-center gap-[11px] text-small transition-colors", done ? "text-text-muted" : active ? "font-medium text-text" : "text-text-subtle")}>
              <span className={cn("grid h-5 w-5 shrink-0 place-items-center rounded-full border-[1.5px]", done ? "border-success bg-success text-success-foreground" : active ? "border-accent text-accent" : "border-border text-text-subtle")}>
                {done ? <IcCheck size={12} /> : active ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <span className="h-1.5 w-1.5 rounded-full bg-current opacity-50" />}
              </span>
              {t(k)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────── ResultsHead ────────────────────────────────
export function ResultsHead({ count, postsAnalyzed, onRerun }: { count: number; postsAnalyzed: number; onRerun: () => void }) {
  const { t, locale } = useTranslation();
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="text-h2 font-semibold tracking-[-0.01em]">{withVar(t("patterns.found"), { n: count })}</div>
        <div className="mt-1 text-small text-text-subtle">
          {withVar(t(pluralKey(locale, postsAnalyzed, { one: "patterns.study_cap_one", many: "patterns.study_cap_many" })), { n: postsAnalyzed })}
        </div>
      </div>
      <button onClick={onRerun} className={buttonClasses({ variant: "secondary", size: "sm" })}>
        <IcTweak size={15} /> {t("patterns.rerun")}
      </button>
    </div>
  );
}

// ─────────────────────────────── PatternCard ────────────────────────────────
export function PatternCard({ p }: { p: PatternCardModel }) {
  const { t } = useTranslation();
  const max = Math.max(p.lead.value, p.base.value, 1);
  return (
    <article className="rounded-lg border border-border bg-surface px-[22px] pb-[18px] pt-5 shadow-sm transition-colors hover:border-text/12" style={{ animation: "card-in var(--duration-slow) var(--ease-entrance) both" }}>
      <div className="mb-3.5 flex items-center gap-2.5 max-md:flex-wrap">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-[9px] py-[3px] text-caption font-semibold text-text-muted">{p.kind}</span>
        <span className="flex-1" />
        <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-caption font-medium", p.strength === "strong" ? "border-success/28 bg-success/12 text-success" : "border-border bg-surface-2 text-text-muted")}>
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {p.strength === "strong" ? t("patterns.strength_strong") : t("patterns.strength_worth")} · {p.sample} {t("patterns.posts_word")}
        </span>
      </div>

      <div className="flex items-center gap-[18px] max-md:items-start max-md:gap-3.5">
        <span className="shrink-0 text-display font-semibold tabular-nums leading-[0.9] tracking-[-0.02em] text-accent">{p.stat}</span>
        <span className="text-h3 font-semibold leading-[1.32] tracking-[-0.006em] max-md:min-w-0">{p.headline}</span>
      </div>

      {/* evidence */}
      <div className="mt-[18px] border-t border-border pt-4">
        <div className="mb-3 text-caption font-semibold uppercase tracking-[0.05em] text-text-subtle">{t("patterns.evidence_cap")}</div>
        <div className="flex flex-col gap-[11px]">
          <EvRow ev={p.lead} max={max} lead />
          <EvRow ev={p.base} max={max} />
        </div>
        {p.note && <div className="mt-3 text-caption text-text-subtle">{p.note}</div>}
      </div>

      {/* examples */}
      <div className="mt-4 flex flex-col gap-[9px]">
        <div className="mb-0.5 text-caption font-semibold uppercase tracking-[0.05em] text-text-subtle">{t("patterns.examples_cap")}</div>
        {p.examples.map((ex, i) => (
          <div key={i} className="flex items-start gap-3 rounded-md border border-border bg-surface-2 px-[14px] py-[11px]">
            <span className="w-0.5 shrink-0 self-stretch rounded bg-border" />
            <span className="min-w-0 flex-1 text-small leading-[1.55] text-text-muted">{ex.text}</span>
            <span className="shrink-0 whitespace-nowrap text-caption font-semibold text-text">{ex.metric}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

function EvRow({ ev, max, lead }: { ev: { label: string; display: string; value: number; n: number }; max: number; lead?: boolean }) {
  return (
    <div className="grid grid-cols-[168px_1fr_auto] items-center gap-3.5 max-md:grid-cols-[1fr_auto] max-md:items-baseline max-md:gap-x-3 max-md:gap-y-1.5">
      <span className={cn("text-small md:truncate max-md:order-1 max-md:min-w-0", lead ? "text-text" : "text-text-muted")}>{ev.label}</span>
      <div className="h-[22px] overflow-hidden rounded-sm border border-border bg-surface-2 max-md:order-3 max-md:col-span-2 max-md:w-full">
        <span className={cn("block h-full rounded-l-sm", lead ? "bg-accent" : "")} style={{ width: `${(ev.value / max) * 100}%`, backgroundColor: lead ? undefined : "color-mix(in srgb, var(--color-text) 22%, var(--color-surface-2))" }} />
      </div>
      <span className={cn("whitespace-nowrap text-small font-semibold tabular-nums max-md:order-2 max-md:shrink-0 max-md:justify-self-end", lead ? "text-text" : "text-text-muted")}>
        {ev.display} <span className="font-normal text-text-subtle">n={ev.n}</span>
      </span>
    </div>
  );
}
