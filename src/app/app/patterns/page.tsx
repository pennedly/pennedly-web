"use client";

// Pattern study — what actually moves engagement in YOUR OWN posts, found
// deterministically from your history (POST /patterns/study, no LLM). Flow per
// design-export/PennedlyDesign/patterns-* : empty (too few posts) → idle ("run
// a study") → running (progress steps) → results (evidence-backed cards).
//
// The "paste admired text" flow still lives at /app/patterns/explore (its own
// redesign is a later pass).

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  ApiError,
  clearTokens,
  fetchOnboardingStatus,
  getTokens,
  runPatternStudy,
} from "@/lib/api";
import { captureEvent } from "@/lib/analytics";
import { useSelectedAccountId } from "@/lib/account";
import { useTranslation, type MessageKey } from "@/lib/i18n";
import { AppTopbar, TopbarPill } from "@/components/AppTopbar";
import { Button } from "@/components/ui/button";
import { Skeleton, Spinner } from "@/components/ui/feedback";
import { Toast, ToastHost } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { IcCheck, IcNib, IcStudy, IcTweak } from "@/components/icons";
import type { SelfStudyPattern, SelfStudyResult } from "@/lib/types";

type Toast = { id: number; message: string; tone: "success" | "error" };
type Phase = "loading" | "empty" | "idle" | "running" | "results";

const MIN_POSTS = 15;
const RUN_STEPS: MessageKey[] = [
  "patterns.step_read",
  "patterns.step_group",
  "patterns.step_test",
  "patterns.step_rank",
];
const LOOKS_FOR: MessageKey[] = [
  "patterns.looks_hooks",
  "patterns.looks_length",
  "patterns.looks_topics",
  "patterns.looks_timing",
  "patterns.looks_format",
  "patterns.looks_questions",
];
const KIND_LABEL: Record<string, MessageKey> = {
  length: "patterns.kind_length",
  question: "patterns.kind_question",
  emoji: "patterns.kind_emoji",
  structure: "patterns.kind_structure",
};
const SIDE_LABEL: Record<string, MessageKey> = {
  length_short: "patterns.side_length_short",
  length_long: "patterns.side_length_long",
  question_with: "patterns.side_question_with",
  question_without: "patterns.side_question_without",
  emoji_with: "patterns.side_emoji_with",
  emoji_without: "patterns.side_emoji_without",
  structure_multiline: "patterns.side_structure_multiline",
  structure_single: "patterns.side_structure_single",
};
// The two sides per pattern key, so we can name the base (losing) group.
const SIDES: Record<string, [string, string]> = {
  length: ["short", "long"],
  question: ["with", "without"],
  emoji: ["with", "without"],
  structure: ["multiline", "single"],
};

function fill(s: string, vars: Record<string, string | number>): string {
  return s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
}

export default function PatternsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const accountId = useSelectedAccountId();

  const [phase, setPhase] = useState<Phase>("loading");
  const [postCount, setPostCount] = useState(0);
  const [result, setResult] = useState<SelfStudyResult | null>(null);
  const [step, setStep] = useState(0);
  const [studied, setStudied] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  function toast(message: string, tone: Toast["tone"] = "error") {
    const id = Date.now() + Math.random();
    setToasts((s) => [...s, { id, message, tone }]);
    setTimeout(() => setToasts((s) => s.filter((x) => x.id !== id)), 4000);
  }

  useEffect(() => {
    if (!getTokens()) router.push("/app/login");
  }, [router]);

  useEffect(() => {
    if (accountId === null) return;
    setPhase("loading");
    (async () => {
      try {
        const ob = await fetchOnboardingStatus(accountId);
        setPostCount(ob.post_count);
        setPhase(ob.post_count >= MIN_POSTS ? "idle" : "empty");
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          clearTokens();
          router.push("/app/login");
          return;
        }
        setPhase("idle"); // let them try; the study endpoint re-checks
      }
    })();
  }, [accountId, router]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  async function runStudy() {
    if (accountId === null) return;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setResult(null);
    setStep(0);
    setPhase("running");
    captureEvent("ui.pattern_study_run", { account_id: accountId });

    const n = RUN_STEPS.length;
    for (let i = 1; i <= n; i++) {
      timers.current.push(setTimeout(() => setStep(i), i * 600));
    }
    const minDelay = new Promise<void>((resolve) => {
      timers.current.push(setTimeout(resolve, n * 600 + 300));
    });

    try {
      const [res] = await Promise.all([runPatternStudy(accountId), minDelay]);
      setResult(res);
      setPostCount(res.posts_analyzed);
      setStudied(true);
      setPhase("results");
    } catch (e) {
      if (e instanceof ApiError && e.status === 422) {
        const d = e.detail as
          | { detail?: { posts_available?: number } }
          | undefined;
        if (typeof d?.detail?.posts_available === "number") {
          setPostCount(d.detail.posts_available);
        }
        setPhase("empty");
        return;
      }
      toast(String(e));
      setPhase("idle");
    }
  }

  const patterns = result?.patterns ?? [];

  return (
    <div className="min-h-screen bg-bg text-text">
      <AppTopbar
        title={t("patterns.title")}
        pill={
          phase === "results" && studied ? (
            <TopbarPill tone="accent">
              {t("patterns.studied")} {t("patterns.just_now")}
            </TopbarPill>
          ) : undefined
        }
      />
      <main className="mx-auto max-w-[760px] space-y-5 px-5 py-7 md:px-6">
        <p className="max-w-[64ch] text-small text-text-muted">
          {t("patterns.study_subtitle")}
        </p>

        {phase === "loading" && (
          <div className="space-y-3">
            <Skeleton className="h-40 w-full rounded-lg" />
          </div>
        )}

        {phase === "empty" && (
          <div className="flex flex-col items-center rounded-lg border border-dashed border-border px-7 py-16 text-center">
            <span className="mb-4 grid h-[54px] w-[54px] place-items-center rounded-lg border border-border bg-surface-2 text-text-subtle">
              <IcStudy size={26} />
            </span>
            <p className="text-h2 font-semibold tracking-tight">
              {t("patterns.empty_title")}
            </p>
            <p className="mt-2 max-w-[46ch] text-body leading-relaxed text-text-muted">
              {fill(t("patterns.empty_body"), { need: MIN_POSTS })}
            </p>
            <div className="mt-6 w-full max-w-[280px]">
              <div className="h-2 overflow-hidden rounded-full border border-border bg-surface-2">
                <div
                  className="h-full rounded-full bg-accent transition-[width]"
                  style={{ width: `${Math.min(100, Math.round((postCount / MIN_POSTS) * 100))}%` }}
                />
              </div>
              <div className="mt-2 text-caption text-text-subtle">
                {fill(t("patterns.of_posts"), { have: postCount, need: MIN_POSTS })}
              </div>
            </div>
          </div>
        )}

        {phase === "idle" && (
          <div className="flex flex-col items-center rounded-lg border border-border bg-surface px-7 py-14 text-center shadow-sm">
            <span className="mb-4 grid h-14 w-14 place-items-center rounded-xl border border-border bg-surface-2 text-accent">
              <IcStudy size={28} />
            </span>
            <h2 className="text-h2 font-semibold tracking-tight">
              {t("patterns.idle_title")}
            </h2>
            <p className="mt-2 max-w-[48ch] text-body leading-relaxed text-text-muted">
              {t("patterns.idle_body")}
            </p>
            <Button
              className="mt-6"
              variant="primary"
              onClick={runStudy}
              icon={<IcStudy size={18} />}
            >
              {t("patterns.run_study")}
            </Button>
            <div className="mt-4 flex items-center gap-2 text-caption text-text-subtle">
              <span>{fill(t("patterns.idle_scope"), { n: postCount })}</span>
              <span className="h-1 w-1 rounded-full bg-text-subtle" />
              <span>{t("patterns.idle_time")}</span>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {LOOKS_FOR.map((k) => (
                <span
                  key={k}
                  className="rounded-full border border-border bg-surface-2 px-3 py-1 text-caption text-text-muted"
                >
                  {t(k)}
                </span>
              ))}
            </div>
          </div>
        )}

        {phase === "running" && (
          <div className="flex flex-col items-center rounded-lg border border-border bg-surface px-7 py-14 text-center shadow-sm">
            <span className="mb-3 text-accent" style={{ animation: "nibwrite 1.5s ease infinite" }}>
              <IcNib size={40} />
            </span>
            <div className="text-h3 font-semibold tracking-tight">
              {t("patterns.running_title")}
            </div>
            <div className="mt-1 text-small text-text-muted">
              {t("patterns.running_body")}
            </div>
            <div className="mt-6 flex flex-col gap-2.5 text-left">
              {RUN_STEPS.map((k, i) => {
                const state = i < step ? "done" : i === step ? "active" : "todo";
                return (
                  <div
                    key={k}
                    className={cn(
                      "flex items-center gap-2.5 text-small transition-colors",
                      state === "done" && "text-text",
                      state === "active" && "text-text font-medium",
                      state === "todo" && "text-text-subtle",
                    )}
                  >
                    <span className="grid h-4 w-4 shrink-0 place-items-center">
                      {state === "done" ? (
                        <IcCheck size={13} className="text-success" />
                      ) : state === "active" ? (
                        <Spinner size={12} />
                      ) : (
                        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-50" />
                      )}
                    </span>
                    {t(k)}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {phase === "results" && (
          <>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="text-h3 font-semibold tracking-tight">
                  {fill(t("patterns.found"), { n: patterns.length })}
                </div>
                <div className="mt-0.5 text-caption text-text-subtle">
                  {fill(t("patterns.found_cap"), { n: result?.posts_analyzed ?? 0 })}
                </div>
              </div>
              <Button variant="secondary" onClick={runStudy} icon={<IcTweak size={15} />}>
                {t("patterns.rerun")}
              </Button>
            </div>

            <div className="space-y-3.5">
              {patterns.map((p) => (
                <PatternCard key={p.key} p={p} t={t} />
              ))}
            </div>
          </>
        )}
      </main>

      <ToastHost>
        {toasts.map((tt) => (
          <Toast key={tt.id} tone={tt.tone} title={tt.message} />
        ))}
      </ToastHost>
    </div>
  );
}

function PatternCard({
  p,
  t,
}: {
  p: SelfStudyPattern;
  t: (k: MessageKey) => string;
}) {
  const kindKey = KIND_LABEL[p.key];
  const baseGroup = (SIDES[p.key] ?? []).find((g) => g !== p.lead_group) ?? "";
  const leadKey = SIDE_LABEL[`${p.key}_${p.lead_group}`];
  const baseKey = SIDE_LABEL[`${p.key}_${baseGroup}`];
  const leadLabel = leadKey ? t(leadKey) : p.lead_group;
  const baseLabel = baseKey ? t(baseKey) : baseGroup;
  const strengthKey: MessageKey =
    p.strength === "strong" ? "patterns.strength_strong" : "patterns.strength_worth";
  const max = Math.max(1, p.lead.value, p.base.value);

  return (
    <article className="space-y-4 rounded-lg border border-border bg-surface p-5 shadow-sm">
      <div className="flex items-center gap-2.5">
        <span className="rounded-full border border-border bg-surface-2 px-2.5 py-0.5 text-caption font-semibold text-text-muted">
          {kindKey ? t(kindKey) : p.key}
        </span>
        <span className="flex-1" />
        <span
          className={cn(
            "inline-flex items-center gap-1.5 text-caption font-medium",
            p.strength === "strong" ? "text-accent" : "text-text-subtle",
          )}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              p.strength === "strong" ? "bg-accent" : "bg-text-subtle",
            )}
          />
          {t(strengthKey)} · {p.sample} {t("patterns.posts_word")}
        </span>
      </div>

      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-h1 font-semibold tracking-tight tabular-nums text-accent">
          +{p.delta_pct}%
        </span>
        <span className="text-body text-text-muted">
          {fill(t("patterns.headline"), { lead: leadLabel, base: baseLabel })}
        </span>
      </div>

      <div className="rounded-md border border-border bg-surface-2 p-3.5">
        <div className="mb-2.5 text-caption font-semibold uppercase tracking-wide text-text-subtle">
          {t("patterns.evidence_cap")}
        </div>
        <div className="space-y-2">
          {[
            { label: leadLabel, side: p.lead, lead: true },
            { label: baseLabel, side: p.base, lead: false },
          ].map((row) => (
            <div key={row.label} className="flex items-center gap-3">
              <span className="w-[40%] shrink-0 truncate text-caption text-text-muted">
                {row.label}
              </span>
              <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-bg">
                <span
                  className="block h-full rounded-full transition-[width]"
                  style={{
                    width: `${(row.side.value / max) * 100}%`,
                    background: row.lead
                      ? "var(--color-accent)"
                      : "color-mix(in srgb, var(--color-text) 28%, var(--color-surface))",
                  }}
                />
              </span>
              <span className="shrink-0 text-caption font-semibold tabular-nums">
                {row.side.display}
              </span>
            </div>
          ))}
        </div>
      </div>

      {p.examples.length > 0 && (
        <div>
          <div className="mb-2 text-caption font-semibold uppercase tracking-wide text-text-subtle">
            {t("patterns.examples_cap")}
          </div>
          <div className="space-y-2">
            {p.examples.map((ex, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-md border border-border bg-surface-2 px-3 py-2"
              >
                <span className="h-8 w-0.5 shrink-0 rounded bg-border" />
                <span className="min-w-0 flex-1 truncate text-small text-text-muted">
                  {ex.text}
                </span>
                <span className="shrink-0 text-caption tabular-nums text-text-subtle">
                  {ex.display} {t("patterns.views_word")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
