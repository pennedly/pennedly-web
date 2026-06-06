"use client";

// Pattern study (/app/patterns) — deterministic self-analysis (no LLM), rebuilt
// 1:1 to Patterns-SPEC.html (reading-width 720). Phases: empty (too few posts) →
// idle (run a study) → running (nib-write + 4 steps) → results (evidence-backed
// pattern cards). Real wiring (fetchOnboardingStatus / fetchPatternStudyLatest /
// runPatternStudy) preserved; a tester ?demo=1 panel (dark/state) drives phases.

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { ApiError, clearTokens, fetchMe, fetchOnboardingStatus, fetchPatternStudyLatest, getTokens, runPatternStudy } from "@/lib/api";
import { captureEvent } from "@/lib/analytics";
import { useSelectedAccountId } from "@/lib/account";
import { useTranslation, type MessageKey } from "@/lib/i18n";
import { AppTopbar, TopbarPill } from "@/components/AppTopbar";
import { Spinner } from "@/components/ui/feedback";
import { TweaksPanel, TweakSection, TweakToggle, TweakRadio, useTweaks } from "@/components/tweaks/TweaksPanel";
import { EmptyView, IdleView, PatternCard, ResultsHead, RUN_STEPS, RunningView } from "@/components/studio/PatternsParts";
import { DEMO_PATTERNS, PT_TWEAK_DEFAULTS, STUDY_META, type PatternCardModel } from "@/components/studio/patterns-demo";
import type { SelfStudyPattern, SelfStudyResult } from "@/lib/types";

const IS_DEV = process.env.NODE_ENV === "development";
const NEED = 15;
const SIDES: Record<string, [string, string]> = {
  length: ["short", "long"],
  question: ["with", "without"],
  emoji: ["with", "without"],
  structure: ["multiline", "single"],
};

type Phase = "loading" | "empty" | "idle" | "running" | "results";

export default function PatternsPage() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const [demoParam] = useState(() => (typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("demo") === "1" : false));
  const [isTester, setIsTester] = useState(false);
  const allow = demoParam && (IS_DEV || isTester);
  const demoOn = allow;
  const accountId = useSelectedAccountId();

  const [realPhase, setRealPhase] = useState<Phase>("loading");
  const [study, setStudy] = useState<SelfStudyResult | null>(null);
  const [have, setHave] = useState(0);
  const [lastRunLabel, setLastRunLabel] = useState<string | null>(null);
  const [transientRunning, setTransientRunning] = useState(false);
  const [runStep, setRunStep] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const [tw, setTw] = useTweaks(PT_TWEAK_DEFAULTS);

  useEffect(() => {
    if (!getTokens()) return;
    fetchMe().then((m) => setIsTester(m.is_tester === true)).catch(() => {});
  }, []);

  useEffect(() => {
    if (demoParam) return;
    if (!getTokens()) {
      router.push("/app/login");
      return;
    }
    if (accountId === null) return;
    setRealPhase("loading");
    (async () => {
      try {
        const ob = await fetchOnboardingStatus(accountId);
        const count = ob.post_count ?? 0;
        if (count < NEED) {
          setHave(count);
          setRealPhase("empty");
          return;
        }
        const latest = await fetchPatternStudyLatest(accountId);
        if (latest.study) {
          setStudy(latest.study);
          setLastRunLabel(latest.computed_at ? relTime(latest.computed_at, locale) : t("patterns.just_now"));
          setRealPhase("results");
        } else {
          setRealPhase("idle");
        }
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          clearTokens();
          router.push("/app/login");
        } else {
          setRealPhase("idle");
        }
      }
    })();
  }, [accountId, router, demoParam, locale, t]);

  useEffect(() => {
    if (!demoOn) return;
    document.documentElement.classList.toggle("dark", !!tw.dark);
  }, [demoOn, tw.dark]);

  const phase: Phase = transientRunning ? "running" : demoOn ? (tw.state as string).toLowerCase() as Phase : realPhase;

  // loop the running steps while the running view is shown via the tweak (not a real run)
  useEffect(() => {
    if (phase !== "running" || transientRunning) return;
    const id = setInterval(() => setRunStep((s) => (s + 1) % RUN_STEPS.length), 700);
    return () => clearInterval(id);
  }, [phase, transientRunning]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  function runStudy() {
    captureEvent("ui.pattern_study_run", { demo: demoOn });
    setTransientRunning(true);
    setRunStep(0);
    timers.current.forEach(clearTimeout);
    timers.current = [];
    for (let i = 1; i < RUN_STEPS.length; i++) timers.current.push(setTimeout(() => setRunStep(i), i * 700));
    // fire the real study in parallel
    if (!demoOn && accountId !== null) {
      runPatternStudy(accountId).then((r) => { setStudy(r); setLastRunLabel(t("patterns.just_now")); }).catch(() => {});
    }
    timers.current.push(
      setTimeout(() => {
        setTransientRunning(false);
        setRunStep(0);
        if (demoOn) setTw("state", "Results");
        else setRealPhase("results");
      }, RUN_STEPS.length * 700 + 500),
    );
  }

  // ── card model (real or demo) ──
  function toCard(p: SelfStudyPattern): PatternCardModel {
    const sides = SIDES[p.key] ?? [p.lead_group, p.lead_group];
    const other = sides.find((s) => s !== p.lead_group) ?? sides[1];
    const leadLabel = t(`patterns.side_${p.key}_${p.lead_group}` as MessageKey);
    const baseLabel = t(`patterns.side_${p.key}_${other}` as MessageKey);
    const ratio = p.base.value ? p.lead.value / p.base.value : 0;
    return {
      kind: t(`patterns.kind_${p.key}` as MessageKey),
      strength: p.strength === "strong" ? "strong" : "emerging",
      sample: p.sample,
      stat: `${ratio.toFixed(1)}×`,
      headline: t("patterns.headline").replace("{lead}", leadLabel).replace("{base}", baseLabel),
      lead: { label: leadLabel, display: p.lead.display, value: p.lead.value, n: p.lead.sample },
      base: { label: baseLabel, display: p.base.display, value: p.base.value, n: p.base.sample },
      examples: p.examples.map((e) => ({ text: e.text, metric: e.display })),
    };
  }

  const patterns: PatternCardModel[] = demoOn ? DEMO_PATTERNS : (study?.patterns ?? []).map(toCard);
  const postsAnalyzed = demoOn ? STUDY_META.postsAnalyzed : study?.posts_analyzed ?? 0;
  const studiedLabel = demoOn ? STUDY_META.lastRun : lastRunLabel;

  const pill = phase === "results" && studiedLabel ? <TopbarPill tone="success">{t("patterns.studied")} {studiedLabel}</TopbarPill> : undefined;

  return (
    <div className="min-h-screen bg-bg text-text">
      <AppTopbar maxW="720px" title={t("patterns.title")} pill={pill} />
      <main className="mx-auto flex max-w-[720px] flex-col gap-5 px-5 pb-24 pt-7 md:px-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-h1 font-semibold tracking-[-0.015em]">{t("patterns.title")}</h1>
          <p className="max-w-[62ch] text-body text-text-muted">{t("patterns.intro_sub")}</p>
        </div>

        {phase === "loading" ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size={20} className="text-text-subtle" />
          </div>
        ) : phase === "empty" ? (
          <EmptyView have={demoOn ? STUDY_META.emptyHave : have} need={NEED} />
        ) : phase === "idle" ? (
          <IdleView postsAnalyzed={postsAnalyzed || STUDY_META.postsAnalyzed} onRun={runStudy} />
        ) : phase === "running" ? (
          <RunningView step={runStep} />
        ) : (
          <>
            <ResultsHead count={patterns.length} postsAnalyzed={postsAnalyzed} onRerun={runStudy} />
            <div className="flex flex-col gap-3.5">
              {patterns.map((p, i) => (
                <PatternCard key={i} p={p} />
              ))}
            </div>
          </>
        )}
      </main>

      {allow && (
        <TweaksPanel title="Pattern study">
          <TweakSection label="Appearance" />
          <TweakToggle label="Dark mode" value={tw.dark} onChange={(v) => setTw("dark", v)} />
          <TweakSection label="Phase" />
          <TweakRadio label="State" value={tw.state} options={["Idle", "Running", "Results", "Empty"]} onChange={(v) => setTw("state", v)} />
        </TweaksPanel>
      )}
    </div>
  );
}

function relTime(iso: string, locale: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (days < 1) {
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return rtf.format(0, "hour");
    return rtf.format(-hours, "hour");
  }
  if (days < 7) return rtf.format(-days, "day");
  return new Date(iso).toLocaleDateString(locale);
}
