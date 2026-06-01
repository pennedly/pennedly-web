"use client";

// Explore patterns — paste the TEXT of posts you admire; Pennedly names the
// reusable move and rewrites an example in your voice, then offers to fold the
// do-rule into your role-book. Restyled 1:1 to design-export/PennedlyDesign
// explore-* : input → analyzing → results / empty. Pennedly never opens links
// or reads other accounts — you bring the words (the live caution + the backend
// 422 both enforce "paste text, not a link"). Backend: POST …/patterns/analyze
// (now returns kind + the spotted source line + a voice-matched example).

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { ApiError, analyzePatterns, applyLintFix, getTokens } from "@/lib/api";
import { captureEvent } from "@/lib/analytics";
import { useSelectedAccountId } from "@/lib/account";
import { useTranslation, type MessageKey } from "@/lib/i18n";
import { AppTopbar, TopbarPill } from "@/components/AppTopbar";
import { Button } from "@/components/ui/button";
import { Toast, ToastHost } from "@/components/ui/toast";
import {
  IcArrowLeft,
  IcCheck,
  IcCompass,
  IcLink,
  IcNib,
  IcPlus,
  IcQuote,
  IcSparkle,
} from "@/components/icons";
import { cn } from "@/lib/cn";
import type { Pattern, PatternStudyResult } from "@/lib/types";

const MAXW = "760px";

type ToastItem = { id: number; message: string; tone: "success" | "error" };
type Phase = "idle" | "analyzing" | "results" | "empty";

const STEP_KEYS: MessageKey[] = [
  "explore.step1",
  "explore.step2",
  "explore.step3",
  "explore.step4",
];
const SEED_KEYS: MessageKey[] = ["explore.seed1", "explore.seed2", "explore.seed3"];

// Blank line separates posts; count non-empty blocks.
function splitSamples(raw: string): string[] {
  return raw
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function ExplorePage() {
  const router = useRouter();
  const { t } = useTranslation();
  const accountId = useSelectedAccountId();

  const [raw, setRaw] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<PatternStudyResult | null>(null);
  const [addedRules, setAddedRules] = useState<Set<string>>(new Set());
  const [addingRule, setAddingRule] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  function toast(message: string, tone: ToastItem["tone"] = "success") {
    const id = Date.now() + Math.random();
    setToasts((s) => [...s, { id, message, tone }]);
    setTimeout(() => setToasts((s) => s.filter((x) => x.id !== id)), 4000);
  }

  useEffect(() => {
    if (!getTokens()) router.push("/app/login");
  }, [router]);

  // Decorative progress while the (real) analyze request is in flight.
  useEffect(() => {
    if (phase !== "analyzing") return;
    setStep(0);
    const iv = setInterval(
      () => setStep((s) => Math.min(s + 1, STEP_KEYS.length - 1)),
      650,
    );
    return () => clearInterval(iv);
  }, [phase]);

  const samples = useMemo(() => splitSamples(raw), [raw]);
  // Mirror the backend's reject rules so we caution before a round-trip.
  const issue = useMemo<MessageKey | null>(() => {
    const text = raw;
    if (/\bhttps?:\/\//i.test(text) || /\bwww\.[a-z0-9-]/i.test(text)) return "explore.warn_link";
    if (/[a-z0-9-]{2,}\.(com|net|org|io|co|app|me|so|xyz|gg|tv|ly)\b/i.test(text)) return "explore.warn_url";
    if (/(^|\s)@[a-z0-9._]{3,}/i.test(text)) return "explore.warn_handle";
    return null;
  }, [raw]);
  const ready = samples.length > 0 && !issue;

  async function onAnalyze() {
    if (accountId === null || !ready) {
      if (samples.length === 0) toast(t("explore.empty_warning"), "error");
      return;
    }
    setPhase("analyzing");
    setResult(null);
    setAddedRules(new Set());
    captureEvent("ui.patterns_analyze_clicked", {
      account_id: accountId,
      sample_count: samples.length,
    });
    try {
      const res = await analyzePatterns(accountId, samples);
      setResult(res);
      setPhase(res.patterns.length > 0 ? "results" : "empty");
    } catch (e) {
      let msg = String(e);
      if (e instanceof ApiError) {
        const d = e.detail as { message?: string; detail?: { message?: string } } | undefined;
        msg = d?.message ?? d?.detail?.message ?? `${e.status}`;
      }
      toast(msg, "error");
      setPhase("idle");
    }
  }

  async function onAddToVoice(p: Pattern) {
    if (accountId === null || !p.suggested_do_rule) return;
    setAddingRule(p.suggested_do_rule);
    captureEvent("ui.pattern_added_to_voice", { account_id: accountId });
    try {
      await applyLintFix(accountId, {
        kind: "add_item",
        section: "do_list",
        text: p.suggested_do_rule,
      });
      setAddedRules((s) => new Set(s).add(p.suggested_do_rule));
      toast(t("explore.added"));
    } catch (e) {
      toast(String(e), "error");
    } finally {
      setAddingRule(null);
    }
  }

  const countLabel =
    samples.length === 0
      ? t("explore.count_empty")
      : samples.length === 1
        ? t("explore.count_one")
        : t("explore.count_other").replace("{n}", String(samples.length));

  return (
    <div className="min-h-screen bg-bg text-text">
      <AppTopbar
        maxW={MAXW}
        title={t("explore.title")}
        pill={
          phase === "results" && result ? (
            <TopbarPill tone="accent">
              {t("explore.pill").replace("{n}", String(result.patterns.length))}
            </TopbarPill>
          ) : undefined
        }
      />
      <main className="mx-auto w-full max-w-[760px] space-y-5 px-5 py-7 md:px-6">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-h1 font-semibold tracking-tight">{t("explore.title")}</h1>
          <p className="max-w-[60ch] text-pretty text-body text-text-muted">{t("explore.subtitle")}</p>
        </div>

        {phase === "idle" && (
          <>
            {/* "Paste the text, not links" notice */}
            <div className="flex items-start gap-3 rounded-md border border-border bg-surface-2 px-3.5 py-3">
              <IcQuote size={18} className="mt-px shrink-0 text-text-subtle" />
              <div className="min-w-0">
                <div className="text-small font-semibold text-text">{t("explore.notice_title")}</div>
                <div className="mt-0.5 text-small leading-snug text-text-muted">{t("explore.notice_body")}</div>
              </div>
            </div>

            {/* Paste box */}
            <div
              className={cn(
                "rounded-2xl border bg-surface px-4 pb-3 pt-4 shadow-sm transition-all focus-within:shadow-md",
                issue ? "border-warning/55" : "border-border focus-within:border-accent/55",
              )}
            >
              <textarea
                value={raw}
                onChange={(e) => setRaw(e.target.value)}
                placeholder={t("explore.placeholder")}
                spellCheck={false}
                className="block min-h-[168px] w-full resize-y border-0 bg-transparent p-0.5 text-body leading-relaxed text-text outline-none placeholder:text-text-subtle"
              />
              <div className="mt-2.5 flex flex-wrap items-center gap-3 border-t border-border pt-3">
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2.5">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 whitespace-nowrap text-caption tabular-nums",
                      ready ? "text-text-muted" : "text-text-subtle",
                    )}
                  >
                    <span className={cn("h-1.5 w-1.5 rounded-full", ready ? "bg-success" : "bg-text-subtle")} />
                    {countLabel}
                  </span>
                  {issue && (
                    <span className="inline-flex min-w-0 items-center gap-1.5 text-caption font-medium text-warning">
                      <IcLink size={15} className="shrink-0" />
                      <span className="truncate">{t(issue)}</span>
                    </span>
                  )}
                </div>
                <Button variant="primary" disabled={!ready} onClick={onAnalyze} icon={<IcCompass size={16} />}>
                  {t("explore.analyze")}
                </Button>
              </div>
            </div>

            {/* Quiet seed chips */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-caption text-text-subtle">{t("explore.seed_cap")}</span>
              <button
                type="button"
                onClick={() => setRaw(SAMPLE_POSTS)}
                className="whitespace-nowrap rounded-full border border-border bg-surface-2 px-2.5 py-[5px] text-caption text-text-muted transition-colors hover:border-text/20 hover:bg-surface hover:text-text"
              >
                {t("explore.seed_sample")}
              </button>
              {SEED_KEYS.map((k) => (
                <span
                  key={k}
                  className="whitespace-nowrap rounded-full border border-border bg-surface-2 px-2.5 py-[5px] text-caption text-text-subtle"
                >
                  {t(k)}
                </span>
              ))}
            </div>
          </>
        )}

        {phase === "analyzing" && (
          <div className="flex flex-col items-center rounded-2xl border border-border bg-surface px-10 py-11 shadow-sm">
            <span className="text-text" style={{ animation: "nib-write 1.5s var(--ease-standard) infinite" }}>
              <IcNib size={40} />
            </span>
            <div className="mt-[18px] text-h2 font-semibold tracking-tight">{t("explore.reading_title")}</div>
            <div className="mt-1.5 text-small text-text-muted">{t("explore.reading_sub")}</div>
            <div className="mt-7 flex w-full max-w-[340px] flex-col gap-3">
              {STEP_KEYS.map((k, i) => {
                const state = i < step ? "done" : i === step ? "active" : "idle";
                return (
                  <div
                    key={k}
                    className={cn(
                      "flex items-center gap-3 text-small transition-colors",
                      state === "active"
                        ? "font-medium text-text"
                        : state === "done"
                          ? "text-text-muted"
                          : "text-text-subtle",
                    )}
                  >
                    <span
                      className={cn(
                        "grid h-5 w-5 shrink-0 place-items-center rounded-full border-[1.5px]",
                        state === "done"
                          ? "border-success bg-success text-success-foreground"
                          : state === "active"
                            ? "border-accent text-accent"
                            : "border-border text-text-subtle",
                      )}
                    >
                      {state === "done" ? (
                        <IcCheck size={12} />
                      ) : state === "active" ? (
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
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

        {phase === "results" && result && (
          <>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="text-h2 font-semibold tracking-tight">
                  {t("explore.results_title").replace("{n}", String(result.patterns.length))}
                </div>
                <div className="mt-1 text-small text-text-subtle">{t("explore.results_cap")}</div>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setPhase("idle")} icon={<IcArrowLeft size={15} />}>
                {t("explore.paste_more")}
              </Button>
            </div>

            {result.summary && (
              <div className="flex items-start gap-3 text-pretty text-h3 font-medium leading-snug tracking-tight text-text">
                <IcSparkle size={20} className="mt-[3px] shrink-0 text-accent" />
                <span>{result.summary}</span>
              </div>
            )}

            <div className="space-y-4">
              {result.patterns.map((p, i) => (
                <PatternCard
                  key={`${p.name}-${i}`}
                  p={p}
                  idx={i}
                  added={addedRules.has(p.suggested_do_rule)}
                  busy={addingRule === p.suggested_do_rule}
                  onAdd={() => onAddToVoice(p)}
                  t={t}
                />
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2.5 px-0.5 pt-1 text-caption tabular-nums text-text-subtle">
              <span>{t("explore.samples_analyzed").replace("{n}", String(result.samples_analyzed))}</span>
              <span className="h-1 w-1 rounded-full bg-text-subtle" />
              <span>{result.latency_ms}ms</span>
              <span className="h-1 w-1 rounded-full bg-text-subtle" />
              <span>{result.llm_model}</span>
            </div>
          </>
        )}

        {phase === "empty" && (
          <div className="flex flex-col items-center rounded-lg border border-dashed border-border bg-surface/50 px-7 py-14 text-center">
            <div className="mb-[18px] grid h-[54px] w-[54px] place-items-center rounded-lg border border-border bg-surface-2 text-text-subtle">
              <IcCompass size={26} />
            </div>
            <div className="text-h2 font-semibold tracking-tight">{t("explore.empty_title")}</div>
            <div className="mt-2 max-w-[44ch] text-body leading-snug text-text-muted">{t("explore.empty_sub")}</div>
            <Button variant="secondary" className="mt-5" onClick={() => setPhase("idle")} icon={<IcArrowLeft size={15} />}>
              {t("explore.empty_back")}
            </Button>
          </div>
        )}
      </main>

      <ToastHost>
        {toasts.map((x) => (
          <Toast key={x.id} tone={x.tone} title={x.message} />
        ))}
      </ToastHost>
    </div>
  );
}

function PatternCard({
  p,
  idx,
  added,
  busy,
  onAdd,
  t,
}: {
  p: Pattern;
  idx: number;
  added: boolean;
  busy: boolean;
  onAdd: () => void;
  t: (k: MessageKey) => string;
}) {
  return (
    <article className="rounded-lg border border-border bg-surface px-[22px] pb-[18px] pt-[22px] shadow-sm transition-colors hover:border-text/10">
      <div className="flex items-center gap-2.5">
        {p.kind && (
          <span className="inline-flex shrink-0 items-center rounded-full border border-border bg-surface-2 px-2.5 py-[3px] text-caption font-semibold tracking-wide text-text-muted">
            {p.kind}
          </span>
        )}
        <span className="ml-auto text-caption font-semibold tabular-nums tracking-wide text-text-subtle">
          {String(idx + 1).padStart(2, "0")}
        </span>
      </div>

      <div className="mt-3 text-h2 font-semibold leading-tight tracking-tight">{p.name}</div>
      <div className="mt-2 max-w-[60ch] text-pretty text-body leading-relaxed text-text-muted">{p.technique}</div>

      {p.why_it_works && (
        <div className="mt-3.5 flex items-start gap-2.5">
          <IcQuote size={16} className="mt-px shrink-0 text-text-subtle" />
          <span className="text-pretty text-small italic leading-snug text-text-subtle">{p.why_it_works}</span>
        </div>
      )}

      <div className="mt-[18px] flex flex-col gap-3 border-t border-border pt-4">
        {p.spotted && (
          <div>
            <div className="mb-2 text-caption font-semibold uppercase tracking-wide text-text-subtle">
              {t("explore.cap_source")}
            </div>
            <div className="flex gap-3 rounded-md border border-border bg-surface-2 px-3.5 py-[11px]">
              <span className="w-0.5 shrink-0 self-stretch rounded-[2px] bg-border" />
              <span className="text-pretty text-small leading-snug text-text-muted">{p.spotted}</span>
            </div>
          </div>
        )}
        {p.example && (
          <div>
            <div className="mb-2 text-caption font-semibold uppercase tracking-wide text-text-subtle">
              {t("explore.cap_voice")}
            </div>
            <div className="flex gap-3 rounded-md border border-border bg-bg px-[15px] py-[13px]">
              <span className="w-0.5 shrink-0 self-stretch rounded-[2px] bg-accent" />
              <span className="text-pretty text-body italic leading-snug text-text">{p.example}</span>
            </div>
          </div>
        )}
      </div>

      {p.suggested_do_rule && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="inline-flex min-w-0 flex-1 basis-60 items-center gap-2.5 rounded-md border border-dashed border-border bg-surface-2 px-3 py-2.5 font-mono text-small leading-snug text-text">
            <span className="shrink-0 font-medium text-success">{t("explore.do_label")}</span>
            <span className="min-w-0 text-pretty">{p.suggested_do_rule}</span>
          </span>
          {added ? (
            <span className="inline-flex shrink-0 items-center gap-1.5 px-1.5 text-small font-semibold text-success">
              <IcCheck size={15} /> {t("explore.added")}
            </span>
          ) : (
            <Button variant="secondary" size="sm" loading={busy} disabled={busy} onClick={onAdd} icon={<IcPlus size={15} />}>
              {t("explore.add_to_voice")}
            </Button>
          )}
        </div>
      )}
    </article>
  );
}

// A neutral sample set for the "Try a sample set" chip (mirrors the design's
// SAMPLE_POSTS — illustrative admired posts the user can analyze immediately).
const SAMPLE_POSTS = `I deleted 40,000 followers worth of old posts last night. Not because they were bad. Because they weren't me anymore. The account felt lighter by morning.

Most advice is autobiography in disguise. When someone tells you how to succeed, they're really telling you how they survived. Take the data point, leave the certainty.

Here's what nobody tells you about going viral: the post you worked hardest on is never the one that lands. It's the one you almost didn't publish.`;
