"use client";

// First-run onboarding — a focused full-screen wizard (no app shell). Layout
// per design-export/PennedlyDesign/onboarding-* : a top bar (brand · skip ·
// theme · language), a 3-dot stepper (Connect · Voice · Done), and the stages
// connect → choose → analyze | scratch → done.
//
// Frontend restyle of the existing flow — the accounts / onboarding-status /
// analyze / from-scratch APIs back it. The tester ?preview=1 mode (run for
// real, persist nothing, show the would-be voice) is preserved.

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import {
  ApiError,
  clearTokens,
  fetchMyAccounts,
  fetchOnboardingStatus,
  getTokens,
  onboardingAnalyze,
  onboardingAnalyzePreview,
  onboardingFromScratch,
  onboardingFromScratchPreview,
} from "@/lib/api";
import { captureEvent } from "@/lib/analytics";
import {
  getSelectedAccountId,
  setOnboardingSkipped,
  setSelectedAccountId,
} from "@/lib/account";
import { useTranslation, type MessageKey } from "@/lib/i18n";
import { ConnectThreadsButton } from "@/components/ConnectThreadsButton";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { TagInput } from "@/components/TagInput";
import {
  BrandMark,
  IcArrowLeft,
  IcArrowRight,
  IcCheck,
  IcClock,
  IcEye,
  IcLock,
  IcMoon,
  IcNib,
  IcPenLine,
  IcScan,
  IcSun,
  IcVoice,
} from "@/components/icons";
import { Button, buttonClasses } from "@/components/ui/button";
import { Spinner } from "@/components/ui/feedback";
import { cn } from "@/lib/cn";
import type { OnboardingPreview, OnboardingStatus } from "@/lib/types";

type Stage = "loading" | "connect" | "choose" | "analyze" | "scratch" | "done";
const STAGE_STEP: Record<Stage, number> = {
  loading: 0,
  connect: 0,
  choose: 1,
  analyze: 1,
  scratch: 1,
  done: 2,
};
const ANALYZE_STEPS: MessageKey[] = [
  "onboarding.analyze_step1",
  "onboarding.analyze_step2",
  "onboarding.analyze_step3",
];

function errMsg(e: unknown): string {
  if (e instanceof ApiError) {
    const d =
      typeof e.detail === "object" && e.detail !== null && "detail" in (e.detail as Record<string, unknown>)
        ? (e.detail as { detail: unknown }).detail
        : e.detail;
    return `${e.status}: ${String(d)}`;
  }
  return String(e);
}

const ICON_BTN =
  "grid h-9 w-9 place-items-center rounded-md border border-border bg-surface text-text-muted transition-colors hover:bg-surface-2 hover:text-text";

function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => setDark(document.documentElement.classList.contains("dark")), []);
  return (
    <button
      type="button"
      aria-label="Toggle theme"
      className={ICON_BTN}
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

function Stepper({ current }: { current: number }) {
  const steps: MessageKey[] = ["onboarding.step_connect", "onboarding.step_voice", "onboarding.step_done"];
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center gap-2">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          {i > 0 && <span className={cn("h-px w-8", i <= current ? "bg-accent" : "bg-border")} />}
          <span
            className={cn(
              "inline-flex items-center gap-1.5 text-caption font-medium",
              i === current ? "text-text" : "text-text-subtle",
            )}
          >
            <span
              className={cn(
                "grid h-[22px] w-[22px] place-items-center rounded-full border text-caption font-semibold tabular-nums",
                i < current
                  ? "border-success bg-success text-success-foreground"
                  : i === current
                    ? "border-accent text-accent"
                    : "border-border text-text-subtle",
              )}
            >
              {i < current ? <IcCheck size={13} /> : i + 1}
            </span>
            {t(s)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [stage, setStage] = useState<Stage>("loading");
  const [accountId, setAccountId] = useState<number | null>(null);
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alreadySetUp, setAlreadySetUp] = useState(false);
  const [preview, setPreview] = useState(false);
  const [previewResult, setPreviewResult] = useState<OnboardingPreview | null>(null);
  const [mode, setMode] = useState<"analyze" | "scratch" | null>(null);
  const [anIndex, setAnIndex] = useState(0);

  const [intro, setIntro] = useState("");
  const [themes, setThemes] = useState<string[]>([]);
  const [excludes, setExcludes] = useState<string[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (!getTokens()) {
      router.replace("/app/login");
      return;
    }
    setPreview(new URLSearchParams(window.location.search).get("preview") === "1");
    (async () => {
      try {
        const list = await fetchMyAccounts();
        const active = list.accounts.filter((a) => a.disconnected_at === null);
        if (active.length === 0) {
          setStage("connect");
          return;
        }
        let acc = getSelectedAccountId();
        if (acc === null || !active.some((a) => a.id === acc)) {
          acc = active[0].id;
          setSelectedAccountId(acc);
        }
        setAccountId(acc);
        const st = await fetchOnboardingStatus(acc);
        setStatus(st);
        setAlreadySetUp(!st.needs_onboarding);
        setStage("choose");
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          clearTokens();
          router.replace("/app/login");
          return;
        }
        setError(errMsg(e));
        setStage("choose");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  async function runAnalyze() {
    if (accountId === null) return;
    setError(null);
    captureEvent("ui.onboarding_analyze", { account_id: accountId, preview });
    if (preview) {
      setBusy(true);
      try {
        setPreviewResult(await onboardingAnalyzePreview(accountId));
      } catch (e) {
        setError(errMsg(e));
      } finally {
        setBusy(false);
      }
      return;
    }
    // Live: show the progress animation while the analyze call runs.
    setStage("analyze");
    setAnIndex(0);
    timers.current.forEach(clearTimeout);
    timers.current = [];
    const n = ANALYZE_STEPS.length;
    for (let i = 1; i < n; i++) timers.current.push(setTimeout(() => setAnIndex(i), i * 900));
    const minDelay = new Promise<void>((r) => timers.current.push(setTimeout(r, n * 900)));
    try {
      await Promise.all([onboardingAnalyze(accountId), minDelay]);
      setAnIndex(n);
      setMode("analyze");
      setStage("done");
    } catch (e) {
      if (e instanceof ApiError && e.status === 422) {
        // No usable posts after all → steer to the from-scratch form.
        setError(t("onboarding.analyze_none"));
        setStage("scratch");
      } else {
        setError(errMsg(e));
        setStage("choose");
      }
    }
  }

  async function onCreate() {
    if (accountId === null) return;
    if (!intro.trim() && themes.length === 0) {
      setError(t("onboarding.error_empty"));
      return;
    }
    setBusy(true);
    setError(null);
    captureEvent("ui.onboarding_from_scratch", { account_id: accountId, preview });
    const payload = { intro: intro.trim(), themes_include: themes, themes_exclude: excludes };
    try {
      if (preview) {
        setPreviewResult(await onboardingFromScratchPreview(accountId, payload));
        setBusy(false);
        return;
      }
      await onboardingFromScratch(accountId, payload);
      setMode("scratch");
      setStage("done");
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  }

  function onSkip() {
    if (accountId !== null) setOnboardingSkipped(accountId);
    captureEvent("ui.onboarding_skipped", { account_id: accountId });
    setMode(null);
    setStage("done");
  }

  const showSkip = !preview && !alreadySetUp && stage !== "done" && stage !== "analyze" && stage !== "loading";

  return (
    <div className="flex min-h-screen flex-col bg-bg text-text">
      {/* Top bar */}
      <header className="flex items-center gap-3 px-5 py-4 md:px-8">
        <div className="flex items-center gap-2.5">
          <BrandMark size={30} radius={9} />
          <span className="text-h3 font-semibold tracking-tight">Pennedly</span>
        </div>
        {(alreadySetUp || preview) && (
          <Link
            href="/app/settings"
            className="ml-3 text-small text-text-muted transition-colors hover:text-text"
          >
            ← {t("onboarding.exit")}
          </Link>
        )}
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          {showSkip && (
            <button
              onClick={onSkip}
              className="rounded-md px-3 py-1.5 text-small font-medium text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
            >
              {t("onboarding.skip_for_now")}
            </button>
          )}
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </header>

      <div className="flex flex-1 flex-col items-center px-5 py-8 md:py-12">
        {stage !== "loading" && !previewResult && (
          <div className="mb-8">
            <Stepper current={STAGE_STEP[stage]} />
          </div>
        )}

        <div className={cn("w-full", stage === "scratch" || previewResult ? "max-w-[640px]" : "max-w-[560px]")}>
          {(preview || alreadySetUp) && !previewResult && (
            <div
              className={cn(
                "mb-5 rounded-md border p-3 text-small leading-relaxed",
                preview
                  ? "border-accent/30 bg-accent/[0.08] text-text-muted"
                  : "border-warning/30 bg-warning/[0.08] text-text-muted",
              )}
            >
              {preview ? t("onboarding.preview_banner") : t("onboarding.already_setup")}
            </div>
          )}
          {error && (
            <div className="mb-5 rounded-md border border-danger/40 bg-danger/10 p-3 text-small text-danger">
              {error}
            </div>
          )}

          {previewResult ? (
            <PreviewResultPanel result={previewResult} t={t} onBack={() => { setPreviewResult(null); setError(null); }} />
          ) : stage === "loading" ? (
            <div className="flex justify-center py-10">
              <Spinner size={20} />
            </div>
          ) : stage === "connect" ? (
            <ConnectStep t={t} />
          ) : stage === "choose" ? (
            <ChooseStep
              status={status}
              busy={busy}
              onAnalyze={runAnalyze}
              onScratch={() => { setError(null); setStage("scratch"); }}
              t={t}
            />
          ) : stage === "analyze" ? (
            <AnalyzeStep index={anIndex} t={t} />
          ) : stage === "scratch" ? (
            <ScratchStep
              intro={intro}
              setIntro={setIntro}
              themes={themes}
              setThemes={setThemes}
              excludes={excludes}
              setExcludes={setExcludes}
              busy={busy}
              preview={preview}
              onCreate={onCreate}
              onBack={() => { setError(null); setStage("choose"); }}
              t={t}
            />
          ) : (
            <DoneStep mode={mode} onGo={() => router.replace("/app")} t={t} />
          )}
        </div>
      </div>
    </div>
  );
}

function ConnectStep({ t }: { t: (k: MessageKey) => string }) {
  const trust: { Icon: (p: { size?: number }) => ReactNode; key: MessageKey }[] = [
    { Icon: IcEye, key: "onboarding.trust1" },
    { Icon: IcCheck, key: "onboarding.trust2" },
    { Icon: IcLock, key: "onboarding.trust3" },
  ];
  return (
    <section className="rounded-2xl border border-border bg-surface p-7 text-center shadow-sm">
      <span className="mx-auto mb-4 grid h-14 w-14 place-items-center">
        <BrandMark size={56} radius={16} />
      </span>
      <div className="text-caption font-semibold uppercase tracking-wide text-text-subtle">
        {t("onboarding.welcome_eyebrow")}
      </div>
      <h1 className="mt-2 text-h1 font-semibold tracking-tight">{t("onboarding.connect_hero_title")}</h1>
      <p className="mx-auto mt-2.5 max-w-[46ch] text-body leading-relaxed text-text-muted">
        {t("onboarding.connect_hero_sub")}
      </p>
      <div className="mx-auto mt-5 flex max-w-[34ch] flex-col gap-2.5 text-left">
        {trust.map(({ Icon, key }) => (
          <div key={key} className="flex items-center gap-2.5 text-small text-text-muted">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-border bg-surface-2 text-text-subtle">
              <Icon size={15} />
            </span>
            {t(key)}
          </div>
        ))}
      </div>
      <div className="mt-6 flex justify-center">
        <ConnectThreadsButton variant="primary" />
      </div>
    </section>
  );
}

function ChooseStep({
  status,
  busy,
  onAnalyze,
  onScratch,
  t,
}: {
  status: OnboardingStatus | null;
  busy: boolean;
  onAnalyze: () => void;
  onScratch: () => void;
  t: (k: MessageKey) => string;
}) {
  const canAnalyze = status?.can_analyze ?? false;
  const [selected, setSelected] = useState<"analyze" | "scratch">(canAnalyze ? "analyze" : "scratch");
  const cards: {
    id: "analyze" | "scratch";
    Icon: (p: { size?: number }) => ReactNode;
    title: MessageKey;
    desc: MessageKey;
    meta: string;
    recommended?: boolean;
    disabled?: boolean;
  }[] = [
    {
      id: "analyze",
      Icon: IcScan,
      title: "onboarding.mode_analyze_title",
      desc: "onboarding.mode_analyze_desc",
      meta: canAnalyze
        ? `${status?.post_count ?? 0} ${t("onboarding.analyze_count")}`
        : (status?.post_count ?? 0) > 0
          ? t("onboarding.analyze_locked")
              .replace("{need}", String(status?.min_posts_to_analyze ?? 15))
              .replace("{have}", String(status?.post_count ?? 0))
          : t("onboarding.analyze_none"),
      recommended: canAnalyze,
      disabled: !canAnalyze,
    },
    {
      id: "scratch",
      Icon: IcPenLine,
      title: "onboarding.mode_scratch_title",
      desc: "onboarding.mode_scratch_desc",
      meta: t("onboarding.mode_scratch_meta"),
    },
  ];
  return (
    <section className="rounded-2xl border border-border bg-surface p-7 shadow-sm">
      <div className="text-caption font-semibold uppercase tracking-wide text-text-subtle">
        {t("onboarding.choose_eyebrow")}
      </div>
      <h1 className="mt-2 text-h1 font-semibold tracking-tight">{t("onboarding.choose_title")}</h1>
      <p className="mt-2.5 text-body leading-relaxed text-text-muted">{t("onboarding.choose_sub")}</p>

      <div role="radiogroup" className="mt-5 flex flex-col gap-3">
        {cards.map((c) => {
          const active = selected === c.id;
          return (
            <button
              key={c.id}
              role="radio"
              aria-checked={active}
              disabled={c.disabled}
              onClick={() => setSelected(c.id)}
              className={cn(
                "flex items-start gap-3.5 rounded-lg border p-4 text-left transition-colors",
                c.disabled && "cursor-not-allowed opacity-60",
                active ? "border-accent/55 bg-surface-2" : "border-border hover:bg-surface-2",
              )}
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-border bg-surface text-text-muted">
                <c.Icon size={20} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="text-body font-semibold">{t(c.title)}</span>
                  {c.recommended && (
                    <span className="rounded-full border border-accent/30 bg-accent/12 px-2 py-px text-caption font-semibold text-accent">
                      {t("onboarding.recommended")}
                    </span>
                  )}
                </span>
                <span className="mt-1 block text-small leading-relaxed text-text-muted">{t(c.desc)}</span>
                <span className="mt-2 inline-flex items-center gap-1.5 text-caption text-text-subtle">
                  <IcClock size={13} />
                  {c.meta}
                </span>
              </span>
              {active && <IcCheck size={18} className="shrink-0 text-accent" />}
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-end">
        <Button
          variant="primary"
          loading={busy}
          disabled={busy}
          onClick={() => (selected === "analyze" ? onAnalyze() : onScratch())}
        >
          {t("onboarding.continue")}
          <IcArrowRight size={17} />
        </Button>
      </div>
    </section>
  );
}

function AnalyzeStep({ index, t }: { index: number; t: (k: MessageKey) => string }) {
  return (
    <section className="flex flex-col items-center rounded-2xl border border-accent/40 bg-surface p-8 text-center shadow-md">
      <span className="text-text" style={{ animation: "nibwrite 1.5s ease infinite" }}>
        <IcNib size={40} />
      </span>
      <h1 className="mt-4 text-h2 font-semibold tracking-tight">{t("onboarding.analyze_learning")}</h1>
      <div className="mt-6 flex w-full max-w-[360px] flex-col text-left">
        {ANALYZE_STEPS.map((k, i) => {
          const state = i < index ? "done" : i === index ? "active" : "todo";
          return (
            <div key={k} className="flex items-center gap-3 border-t border-border py-3 first:border-t-0">
              <span
                className={cn(
                  "grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full border",
                  state === "done"
                    ? "border-success bg-success text-success-foreground"
                    : state === "active"
                      ? "border-accent text-accent"
                      : "border-border text-text-subtle",
                )}
              >
                {state === "done" ? <IcCheck size={13} /> : state === "active" ? <Spinner size={11} /> : <span className="h-1.5 w-1.5 rounded-full bg-current opacity-50" />}
              </span>
              <span className={cn("text-small", state === "todo" ? "text-text-muted" : "font-medium text-text")}>{t(k)}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ScratchStep({
  intro,
  setIntro,
  themes,
  setThemes,
  excludes,
  setExcludes,
  busy,
  preview,
  onCreate,
  onBack,
  t,
}: {
  intro: string;
  setIntro: (v: string) => void;
  themes: string[];
  setThemes: (v: string[]) => void;
  excludes: string[];
  setExcludes: (v: string[]) => void;
  busy: boolean;
  preview: boolean;
  onCreate: () => void;
  onBack: () => void;
  t: (k: MessageKey) => string;
}) {
  const ready = intro.trim().length > 0 && themes.length > 0;
  return (
    <section className="rounded-2xl border border-border bg-surface p-7 shadow-sm">
      <div className="text-caption font-semibold uppercase tracking-wide text-text-subtle">
        {t("onboarding.scratch_eyebrow")}
      </div>
      <h1 className="mt-2 text-h1 font-semibold tracking-tight">{t("onboarding.scratch_title")}</h1>
      <p className="mt-2.5 text-body leading-relaxed text-text-muted">{t("onboarding.scratch_body")}</p>

      <div className="mt-5 space-y-5">
        <div>
          <label className="mb-1.5 block text-small font-medium">{t("onboarding.form_intro_label")}</label>
          <textarea
            value={intro}
            onChange={(e) => setIntro(e.target.value)}
            rows={5}
            placeholder={t("onboarding.form_intro_ph")}
            className="w-full resize-y rounded-md border border-border bg-surface px-3 py-2.5 text-small leading-relaxed text-text outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-small font-medium">{t("onboarding.form_themes_label")}</label>
          <TagInput items={themes} onChange={setThemes} placeholder={t("onboarding.form_themes_ph")} />
        </div>
        <div>
          <label className="mb-1.5 block text-small font-medium">
            {t("onboarding.form_exclude_label")}
            <span className="ml-1.5 font-normal text-text-subtle">{t("onboarding.optional")}</span>
          </label>
          <TagInput items={excludes} onChange={setExcludes} placeholder={t("onboarding.form_exclude_ph")} variant="danger" />
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack} icon={<IcArrowLeft size={15} />}>
          {t("onboarding.back")}
        </Button>
        <Button variant="primary" loading={busy} disabled={busy || !ready} onClick={onCreate}>
          {preview ? t("onboarding.preview_run") : t("onboarding.create_cta")}
          <IcArrowRight size={17} />
        </Button>
      </div>
    </section>
  );
}

function DoneStep({
  mode,
  onGo,
  t,
}: {
  mode: "analyze" | "scratch" | null;
  onGo: () => void;
  t: (k: MessageKey) => string;
}) {
  const voiceLabel =
    mode === "scratch"
      ? t("onboarding.voice_scratch")
      : mode === "analyze"
        ? t("onboarding.voice_analyzed")
        : t("onboarding.voice_later");
  return (
    <section className="rounded-2xl border border-border bg-surface p-7 text-center shadow-sm">
      <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full border border-success/30 bg-success/12 text-success">
        <IcCheck size={30} />
      </span>
      <h1 className="text-h1 font-semibold tracking-tight">
        {mode ? t("onboarding.done_title_set") : t("onboarding.done_title_skip")}
      </h1>
      <p className="mx-auto mt-2.5 max-w-[46ch] text-body leading-relaxed text-text-muted">
        {mode ? t("onboarding.done_sub_set") : t("onboarding.done_sub_skip")}
      </p>

      <div className="mt-6 flex flex-col gap-2 text-left">
        <div className="flex items-center gap-3 rounded-md border border-border bg-surface-2 p-3.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-border bg-surface text-text-muted">
            <IcVoice size={16} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-caption text-text-subtle">{t("onboarding.recap_voice")}</div>
            <div className="text-small font-medium">{voiceLabel}</div>
          </div>
          {mode && <IcCheck size={17} className="shrink-0 text-success" />}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <Link href="/app/role-book" className={buttonClasses({ variant: "ghost", size: "sm" })}>
          {t("onboarding.refine_voice")}
        </Link>
        <button onClick={onGo} className={buttonClasses({ variant: "primary" })}>
          {t("onboarding.go_studio")}
          <IcArrowRight size={17} />
        </button>
      </div>
    </section>
  );
}

// The voice a preview run produced — shown but never saved.
function PreviewResultPanel({
  result,
  t,
  onBack,
}: {
  result: OnboardingPreview;
  t: (k: MessageKey) => string;
  onBack: () => void;
}) {
  const s = result.sections;
  const lists: { key: MessageKey; items?: string[] }[] = [
    { key: "onboarding.sec_themes", items: s.themes_include },
    { key: "onboarding.sec_exclude", items: s.themes_exclude },
    { key: "onboarding.sec_voice", items: s.voice_characteristics },
    { key: "onboarding.sec_do", items: s.do_list },
    { key: "onboarding.sec_dont", items: s.dont_list },
    { key: "onboarding.sec_examples", items: s.examples },
  ];
  return (
    <section className="space-y-5 rounded-2xl border border-accent/30 bg-surface p-6 shadow-sm">
      <div>
        <h2 className="text-h2 font-semibold tracking-tight">{t("onboarding.preview_result_title")}</h2>
        <p className="mt-1 text-caption text-text-subtle">{t("onboarding.preview_not_saved")}</p>
        {result.posts_analyzed !== null && (
          <p className="mt-1 text-caption text-text-subtle">
            {t("onboarding.preview_posts_analyzed")} {result.posts_analyzed}
          </p>
        )}
      </div>
      {s.intro && (
        <div>
          <h3 className="mb-1 text-caption font-semibold uppercase tracking-wide text-text-subtle">
            {t("onboarding.sec_intro")}
          </h3>
          <p className="whitespace-pre-wrap text-small leading-relaxed text-text">{s.intro}</p>
        </div>
      )}
      {lists.map(({ key, items }) =>
        items && items.length > 0 ? (
          <div key={key}>
            <h3 className="mb-1.5 text-caption font-semibold uppercase tracking-wide text-text-subtle">{t(key)}</h3>
            <ul className="list-inside list-disc space-y-0.5 text-small text-text">
              {items.map((it, i) => (
                <li key={i}>{it}</li>
              ))}
            </ul>
          </div>
        ) : null,
      )}
      {result.would_seed_topics.length > 0 && (
        <div>
          <h3 className="mb-1.5 text-caption font-semibold uppercase tracking-wide text-text-subtle">
            {t("onboarding.preview_would_topics")}
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {result.would_seed_topics.map((tp, i) => (
              <span key={i} className="rounded-full bg-surface-2 px-2.5 py-0.5 text-caption text-text">
                {tp}
              </span>
            ))}
          </div>
        </div>
      )}
      <details className="rounded-md border border-border p-3">
        <summary className="cursor-pointer text-caption font-medium text-text-subtle">
          {t("onboarding.preview_full_rolebook")}
        </summary>
        <pre className="mt-2 whitespace-pre-wrap font-mono text-caption leading-relaxed text-text-muted">
          {result.prompt_text}
        </pre>
      </details>
      <Button variant="secondary" size="sm" onClick={onBack}>
        {t("onboarding.preview_back")}
      </Button>
    </section>
  );
}
