"use client";

// Voice (role-book) editor — the surface where the user controls how Pennedly
// sounds. Layout per design-export/PennedlyDesign/voice-* : a voice hero
// (check / re-extract), a voice-check panel (LLM conflict lint with one-click
// fixes), then per-section cards with inline Edit/Save, and a re-extract
// progress panel + confirm dialog.
//
// Per founder call the design's 4 structured sections are rendered as the
// backend's real 7 flat sections (intro + themes_include/exclude +
// voice_characteristics + do_list/dont_list + examples) so nothing is hidden
// and the backend is untouched. "Match %" isn't a backend metric — omitted.

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  ApiError,
  applyLintFix,
  clearTokens,
  extractVoice,
  fetchMe,
  fetchRoleBook,
  getTokens,
  lintRoleBook,
  patchRoleBook,
  translateText,
} from "@/lib/api";
import { friendlyErrorText } from "@/lib/errors";
import { captureEvent } from "@/lib/analytics";
import { useSelectedAccountId } from "@/lib/account";
import { useTranslation, type MessageKey } from "@/lib/i18n";
import { TranslateButton } from "@/components/TranslateButton";
import { AppTopbar, TopbarPill } from "@/components/AppTopbar";
import { ErrorBanner } from "@/components/ui/error-banner";
import { Button, buttonClasses } from "@/components/ui/button";
import { Skeleton, Spinner } from "@/components/ui/feedback";
import { Toast, ToastHost } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import {
  IcAlert,
  IcChevDown,
  IcCheck,
  IcGlobe,
  IcList,
  IcNib,
  IcPencil,
  IcPlus,
  IcQuote,
  IcRefresh,
  IcRobot,
  IcScan,
  IcShield,
  IcTags,
  IcTrash,
  IcVoice,
  IcX,
} from "@/components/icons";
import { AntiRobotPanel } from "@/components/studio/AntiRobotPanel";
import { SUPPORTED_LANGUAGES } from "@/lib/types";
import { useDemoParam } from "@/lib/query";
import type {
  LanguageCode,
  LintConflict,
  LintFix,
  LintResult,
  RoleBook,
  RoleBookExample,
  RoleBookRuleItem,
  RoleBookSections,
  RoleBookThemeItem,
  RoleBookTraitItem,
} from "@/lib/types";
import { TweaksPanel, TweakSection, TweakToggle, TweakRadio, useTweaks } from "@/components/tweaks/TweaksPanel";
import {
  DEMO_BOOK,
  DEMO_LINT,
  DEMO_POSTS_ANALYZED,
  DEMO_SECTIONS,
  DEMO_SECTIONS_DE,
  VC_TWEAK_DEFAULTS,
} from "@/components/studio/voice-demo";

type Toast = { id: number; message: string; tone: "success" | "error" };

// Q60: the backend stores each list-section item as a typed object with a
// stable id (themes → {id,label,note}, characteristics → {id,label?,text},
// do/dont → {id,text}, examples → {id,context,text}). normalizeSections
// coerces the GET payload — and any legacy bare string — into those shapes so
// the editor can edit the secondary fields and round-trip ids; the backend
// re-normalizes on save (preserves a non-blank id, drops a blank primary).
function coerceTheme(it: unknown): RoleBookThemeItem | null {
  if (typeof it === "string") {
    const s = it.trim();
    return s ? { label: s, note: "" } : null;
  }
  const o = (it ?? {}) as { id?: string; label?: string; note?: string };
  const label = (o.label ?? "").trim();
  return label ? { id: o.id, label, note: (o.note ?? "").trim() } : null;
}
function coerceTrait(it: unknown): RoleBookTraitItem | null {
  if (typeof it === "string") {
    const s = it.trim();
    return s ? { label: "", text: s } : null;
  }
  const o = (it ?? {}) as { id?: string; label?: string; text?: string };
  const text = (o.text ?? "").trim();
  return text ? { id: o.id, label: (o.label ?? "").trim(), text } : null;
}
function coerceRule(it: unknown): RoleBookRuleItem | null {
  if (typeof it === "string") {
    const s = it.trim();
    return s ? { text: s } : null;
  }
  const o = (it ?? {}) as { id?: string; text?: string };
  const text = (o.text ?? "").trim();
  return text ? { id: o.id, text } : null;
}
function coerceExample(it: unknown): RoleBookExample | null {
  if (typeof it === "string") {
    const s = it.trim();
    return s ? { context: "post", text: s } : null;
  }
  const o = (it ?? {}) as { id?: string; context?: string; text?: string };
  const text = (o.text ?? "").trim();
  if (!text) return null;
  return {
    id: o.id,
    context: (o.context ?? "post").toLowerCase() === "reply" ? "reply" : "post",
    text,
  };
}
function mapCoerce<T>(arr: unknown, fn: (it: unknown) => T | null): T[] {
  return Array.isArray(arr) ? arr.map(fn).filter((x): x is T => x !== null) : [];
}
function normalizeSections(
  raw: RoleBookSections | null | undefined,
): RoleBookSections {
  const out: RoleBookSections = {};
  if (!raw) return out;
  if (typeof raw.intro === "string") out.intro = raw.intro;
  if (raw.themes_include !== undefined)
    out.themes_include = mapCoerce(raw.themes_include, coerceTheme);
  if (raw.themes_exclude !== undefined)
    out.themes_exclude = mapCoerce(raw.themes_exclude, coerceTheme);
  if (raw.voice_characteristics !== undefined)
    out.voice_characteristics = mapCoerce(raw.voice_characteristics, coerceTrait);
  if (raw.do_list !== undefined) out.do_list = mapCoerce(raw.do_list, coerceRule);
  if (raw.dont_list !== undefined)
    out.dont_list = mapCoerce(raw.dont_list, coerceRule);
  if (raw.examples !== undefined)
    out.examples = mapCoerce(raw.examples, coerceExample);
  return out;
}

// Q8 (translate mode): translate every section field into `lang` for a
// read-only view. Run a small worker pool so switching locale doesn't fan
// out dozens of simultaneous requests at once.
async function runPool<T>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<void>,
): Promise<void> {
  let i = 0;
  const worker = async () => {
    while (i < items.length) {
      const idx = i++;
      await fn(items[idx]);
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker),
  );
}

// Translate the intro + every item field into `lang`. Identical strings are
// deduped (one request each); the backend caches per tenant on top. A failed
// item falls back to its original text. Pure — returns a translated copy and
// never mutates the source (the stored original stays canonical).
async function translateSections(
  src: RoleBookSections,
  lang: LanguageCode,
): Promise<RoleBookSections> {
  const texts = new Set<string>();
  const add = (s?: string) => {
    if (s && s.trim()) texts.add(s);
  };
  add(src.intro);
  src.themes_include?.forEach((x) => {
    add(x.label);
    add(x.note);
  });
  src.themes_exclude?.forEach((x) => {
    add(x.label);
    add(x.note);
  });
  src.voice_characteristics?.forEach((x) => {
    add(x.label);
    add(x.text);
  });
  src.do_list?.forEach((x) => add(x.text));
  src.dont_list?.forEach((x) => add(x.text));
  src.examples?.forEach((x) => add(x.text));

  const map = new Map<string, string>();
  await runPool([...texts], 6, async (txt) => {
    try {
      const r = await translateText(txt, lang);
      map.set(txt, r.translated_text || txt);
    } catch {
      map.set(txt, txt);
    }
  });
  const tr = (s?: string) => (s && map.has(s) ? (map.get(s) as string) : (s ?? ""));

  const out: RoleBookSections = {};
  if (src.intro !== undefined) out.intro = tr(src.intro);
  if (src.themes_include)
    out.themes_include = src.themes_include.map((x) => ({ ...x, label: tr(x.label), note: tr(x.note) }));
  if (src.themes_exclude)
    out.themes_exclude = src.themes_exclude.map((x) => ({ ...x, label: tr(x.label), note: tr(x.note) }));
  if (src.voice_characteristics)
    out.voice_characteristics = src.voice_characteristics.map((x) => ({ ...x, label: tr(x.label), text: tr(x.text) }));
  if (src.do_list) out.do_list = src.do_list.map((x) => ({ ...x, text: tr(x.text) }));
  if (src.dont_list) out.dont_list = src.dont_list.map((x) => ({ ...x, text: tr(x.text) }));
  if (src.examples) out.examples = src.examples.map((x) => ({ ...x, text: tr(x.text) }));
  return out;
}

const REEXTRACT_STEPS: MessageKey[] = [
  "voice.rx_step1",
  "voice.rx_step2",
  "voice.rx_step3",
  "voice.rx_step4",
];

const IS_DEV = process.env.NODE_ENV === "development";
const VC_STATES = ["Populated", "Edit", "Check", "Re-extract", "Translated", "Prompt", "Empty"];

export default function VoiceEditor() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const accountId = useSelectedAccountId();
  const [book, setBook] = useState<RoleBook | null>(null);
  // Q23: GET /role-book 404s when the account has no voice yet → empty state.
  const [emptyVoice, setEmptyVoice] = useState(false);
  const [sections, setSections] = useState<RoleBookSections>({});
  const [bootError, setBootError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [lintResult, setLintResult] = useState<LintResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [lastRun, setLastRun] = useState<string | null>(null);
  const [applyingIdx, setApplyingIdx] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());
  const [reDialog, setReDialog] = useState(false);
  const [busy, setBusy] = useState(false); // re-extracting
  const [stepIndex, setStepIndex] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  // Q8: translate mode. transLang = null → original (editable); a locale →
  // read-only translated view. transToken guards against a stale in-flight
  // translation overwriting a newer locale pick.
  const [transLang, setTransLang] = useState<LanguageCode | null>(null);
  const [translated, setTranslated] = useState<RoleBookSections | null>(null);
  const [translating, setTranslating] = useState(false);
  const transToken = useRef(0);

  // Voice / Anti-robot tabs. The Anti-robot tab hosts the former Style screen.
  // Initial tab honors ?tab=anti so the old /app/style-rules bookmark (which
  // now redirects here) lands on the right tab.
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<"voice" | "anti">(() => (searchParams.get("tab") === "anti" ? "anti" : "voice"));
  // A client-side redirect (from the retired /app/style-rules route) lands here
  // via the App Router; sync the tab once the ?tab= param resolves so it opens
  // on Anti-robot even when the initial render predated the URL commit.
  const tabParam = searchParams.get("tab");
  useEffect(() => {
    if (tabParam === "anti") setTab("anti");
  }, [tabParam]);
  // Live on/total counts from the Anti-robot panel — drives the tab chip and
  // the per-tab topbar pill.
  const [antiCounts, setAntiCounts] = useState<{ on: number; total: number }>({ on: 0, total: 0 });

  // Tester ?demo=1: a tweak panel drives every state on mock content.
  const demoParam = useDemoParam();
  const [isTester, setIsTester] = useState(false);
  const allow = demoParam && (IS_DEV || isTester);
  const demoOn = allow;
  const [tw, setTw] = useTweaks(VC_TWEAK_DEFAULTS);
  const demoEdit = demoOn && tw.state === "Edit";
  const promptOpen = demoOn && tw.state === "Prompt";

  function toast(message: string, tone: Toast["tone"] = "success") {
    const id = Date.now() + Math.random();
    setToasts((s) => [...s, { id, message, tone }]);
    setTimeout(() => setToasts((s) => s.filter((x) => x.id !== id)), 3500);
  }

  useEffect(() => {
    if (demoParam) return;
    if (!getTokens()) router.push("/app/login");
  }, [router, demoParam]);

  useEffect(() => {
    if (!getTokens()) return;
    fetchMe().then((m) => setIsTester(m.is_tester === true)).catch(() => {});
  }, []);

  useEffect(() => {
    if (demoParam) return;
    if (accountId === null) return;
    setBook(null);
    setLintResult(null);
    setEmptyVoice(false);
    setBootError(null);
    transToken.current++;
    setTransLang(null);
    setTranslated(null);
    setTranslating(false);
    (async () => {
      try {
        const rb = await fetchRoleBook(accountId);
        setBook(rb);
        setSections(normalizeSections(rb.sections));
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          clearTokens();
          router.push("/app/login");
          return;
        }
        if (e instanceof ApiError && e.status === 404) {
          setEmptyVoice(true); // Q23: no voice extracted yet
          return;
        }
        setBootError(String(e));
      }
    })();
  }, [accountId, router, reloadKey]);

  // Demo: seed the real state vars from the tweak so the existing render paths
  // light up each phase with no backend.
  useEffect(() => {
    if (!demoOn) return;
    document.documentElement.classList.toggle("dark", !!tw.dark);
  }, [demoOn, tw.dark]);

  useEffect(() => {
    if (!demoOn) return;
    const st = tw.state;
    setBootError(null);
    setApplyingIdx(null);
    setDismissed(new Set());
    setTranslating(false);
    if (st === "Empty") {
      setBook(null);
      setEmptyVoice(true);
      setBusy(false);
      setLintResult(null);
      setTransLang(null);
      setTranslated(null);
      return;
    }
    setEmptyVoice(false);
    setBook(DEMO_BOOK);
    setSections(DEMO_SECTIONS);
    setBusy(st === "Re-extract");
    setStepIndex(2);
    setLintResult(st === "Check" ? DEMO_LINT : null);
    setLastRun(st === "Check" ? t("voice.just_now") : null);
    if (st === "Translated") {
      setTransLang("de");
      setTranslated(DEMO_SECTIONS_DE);
    } else {
      setTransLang(null);
      setTranslated(null);
    }
  }, [demoOn, tw.state, t]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // Visible conflicts (after local dismissals). Keep the original index from
  // the lint result; filtered array indexes shift after dismiss/apply.
  const visibleConflicts = lintResult
    ? lintResult.conflicts
        .map((conflict, index) => ({ conflict, index }))
        .filter((it) => !dismissed.has(it.index))
    : [];
  const conflicts: LintConflict[] = visibleConflicts.map((it) => it.conflict);

  // Q60: flag the exact pill by its stable id (the lint response carries an
  // item id per conflict) instead of a fragile text-match. A "" id — the LLM
  // referenced an item that no longer matches the document — flags nothing.
  const flaggedIds: Record<string, Set<string>> = {};
  for (const c of conflicts) {
    for (const item of c.items) {
      if (!item.id) continue;
      (flaggedIds[item.section] ??= new Set()).add(item.id);
    }
  }

  async function saveSection(patch: Partial<RoleBookSections>) {
    if (demoOn) {
      setSections((s) => ({ ...s, ...patch }));
      toast(t("voice.toast_saved"));
      return;
    }
    if (accountId === null) return;
    const next = { ...sections, ...patch };
    try {
      const rb = await patchRoleBook(accountId, next);
      setBook(rb);
      setSections(normalizeSections(rb.sections));
      setLintResult(null);
      setDismissed(new Set());
      toast(t("voice.toast_saved"));
    } catch (e) {
      toast(friendlyErrorText(e), "error");
      throw e;
    }
  }

  // Q8: switch the read-only translation. null → back to the editable original.
  function onTranslate(lang: LanguageCode | null) {
    if (demoOn) {
      setTw("state", lang === null ? "Populated" : "Translated");
      return;
    }
    const token = ++transToken.current;
    if (lang === null) {
      setTransLang(null);
      setTranslated(null);
      setTranslating(false);
      return;
    }
    setTransLang(lang);
    setTranslated(null);
    setTranslating(true);
    if (accountId !== null)
      captureEvent("ui.voice_translated", { account_id: accountId, target_lang: lang });
    void (async () => {
      const result = await translateSections(sections, lang);
      if (transToken.current !== token) return; // a newer pick superseded this
      setTranslated(result);
      setTranslating(false);
    })();
  }

  async function onCheck() {
    if (demoOn) {
      setTw("state", "Check");
      return;
    }
    if (accountId === null) return;
    setChecking(true);
    setDismissed(new Set());
    setApplyingIdx(null);
    captureEvent("ui.role_book_lint_clicked", { account_id: accountId });
    try {
      const result = await lintRoleBook(accountId, sections);
      setLintResult(result);
      setLastRun(t("voice.just_now"));
    } catch (e) {
      toast(friendlyErrorText(e), "error");
    } finally {
      setChecking(false);
    }
  }

  async function onApply(fix: LintFix, idx: number) {
    // One apply at a time: a second Apply while the first is in flight would
    // race the role-book version flip server-side (the loser 404s/409s).
    if (applyingIdx !== null) return;
    if (demoOn) {
      setDismissed((s) => new Set(s).add(idx));
      toast(t("rolebook.lint.toast_fix_applied"));
      return;
    }
    if (accountId === null) return;
    setApplyingIdx(idx);
    captureEvent("ui.lint_fix_applied", { account_id: accountId, fix_kind: fix.kind });
    try {
      const rb = await applyLintFix(accountId, fix);
      setBook(rb);
      setSections(normalizeSections(rb.sections));
      setDismissed((s) => new Set(s).add(idx));
      setChecking(true);
      setLintResult(null);
      // Re-lint on the new version so the panel reflects reality.
      try {
        const fresh = await lintRoleBook(accountId);
        setLintResult(fresh);
        setDismissed(new Set());
        setLastRun(t("voice.just_now"));
      } catch {
        setLintResult(null);
      }
      toast(t("rolebook.lint.toast_fix_applied"));
    } catch (e) {
      setDismissed((s) => {
        const next = new Set(s);
        next.delete(idx);
        return next;
      });
      toast(friendlyErrorText(e), "error");
    } finally {
      setApplyingIdx(null);
      setChecking(false);
    }
  }

  function startReExtract() {
    if (demoOn) {
      setReDialog(false);
      setTw("state", "Re-extract");
      return;
    }
    if (accountId === null) return;
    setReDialog(false);
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setBusy(true);
    setStepIndex(0);
    captureEvent("ui.voice_reextract_confirmed", { account_id: accountId });
    const n = REEXTRACT_STEPS.length;
    for (let i = 1; i < n; i++) {
      timers.current.push(setTimeout(() => setStepIndex(i), i * 800));
    }
    const minDelay = new Promise<void>((resolve) => {
      timers.current.push(setTimeout(resolve, n * 800));
    });
    (async () => {
      try {
        const [rb] = await Promise.all([extractVoice(accountId), minDelay]);
        setStepIndex(n);
        setBook(rb);
        setSections(normalizeSections(rb.sections));
        setLintResult(null);
        setDismissed(new Set());
        setLastRun(t("voice.just_now"));
        toast(t("rolebook.extract.toast_done"));
      } catch (e) {
        toast(friendlyErrorText(e), "error");
      } finally {
        setBusy(false);
      }
    })();
  }

  if (bootError) {
    return (
      <div className="min-h-screen bg-bg text-text">
        <AppTopbar title={t("rolebook.title")} />
        <main className="mx-auto max-w-[720px] px-5 pb-24 pt-7 md:px-6">
          <ErrorBanner onRetry={() => setReloadKey((k) => k + 1)} />
        </main>
      </div>
    );
  }

  const issues = conflicts.length;
  // Q8: in translate mode the whole editor is a read-only translated view.
  const readOnly = transLang !== null;
  const displaySections = readOnly ? (translated ?? sections) : sections;
  const transName = transLang
    ? (SUPPORTED_LANGUAGES.find((l) => l.code === transLang)?.name ?? transLang)
    : "";
  const voicePill = readOnly ? (
    <TopbarPill tone="accent">{fill(t("voice.translated_pill"), { lang: transName })}</TopbarPill>
  ) : busy ? (
    <TopbarPill tone="accent">{t("voice.busy")}</TopbarPill>
  ) : lintResult && issues > 0 ? (
    <TopbarPill tone="warning">{fill(t("voice.conflicts_pill"), { n: issues })}</TopbarPill>
  ) : book ? (
    <TopbarPill tone="success">{t("voice.in_sync")}</TopbarPill>
  ) : undefined;
  // Anti-robot tab: a per-tab "N of M on" pill from the panel's live counts.
  const antiPill = (
    <TopbarPill>{fill(t("voice.tabs.antiRobot.pill"), antiCounts)}</TopbarPill>
  );
  const pill = tab === "anti" ? antiPill : voicePill;

  // The tab switcher (underline style) sits at the top of the content column.
  const tabBar = (
    <div className="border-b border-border">
      <div className="flex gap-1.5">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "voice"}
          onClick={() => setTab("voice")}
          className={cn(
            "-mb-px inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 whitespace-nowrap border-b-2 px-1.5 py-3 text-small font-semibold transition-colors md:flex-none md:min-h-0",
            tab === "voice"
              ? "border-primary text-text"
              : "border-transparent text-text-subtle hover:text-text",
          )}
        >
          <IcVoice size={15} />
          {t("voice.tabs.voice")}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "anti"}
          onClick={() => setTab("anti")}
          className={cn(
            "-mb-px inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 whitespace-nowrap border-b-2 px-1.5 py-3 text-small font-semibold transition-colors md:flex-none md:min-h-0",
            tab === "anti"
              ? "border-primary text-text"
              : "border-transparent text-text-subtle hover:text-text",
          )}
        >
          <IcRobot size={16} />
          {t("voice.tabs.antiRobot")}
          <span
            className={cn(
              "inline-flex h-[18px] min-w-[20px] items-center justify-center rounded-full border border-border bg-surface-2 px-1.5 text-caption font-semibold tabular-nums",
              tab === "anti" ? "text-text" : "text-text-subtle",
            )}
          >
            {antiCounts.on}/{antiCounts.total}
          </span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg text-text">
      <AppTopbar title={t("rolebook.title")} pill={pill} />
      <main className="mx-auto max-w-[720px] space-y-[18px] px-5 pb-24 pt-7 md:px-6">
        {tabBar}
        {/* Voice DNA editor — rendered only on the Voice tab. */}
        {tab === "voice" && (!book ? (
          emptyVoice ? (
            busy ? (
              <ReExtractPanel stepIndex={stepIndex} steps={REEXTRACT_STEPS} postCount={undefined} t={t} />
            ) : (
              <EmptyVoice onExtract={startReExtract} t={t} />
            )
          ) : (
            <div className="space-y-[18px]">
              <Skeleton className="h-44 w-full rounded-xl" />
              <Skeleton className="h-40 w-full rounded-lg" />
              <Skeleton className="h-40 w-full rounded-lg" />
            </div>
          )
        ) : (
          <>
            {/* Voice hero */}
            <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
              <span className="inline-flex items-center gap-1.5 text-caption font-semibold uppercase tracking-wide text-text-subtle">
                <IcVoice size={14} className="text-text-muted" />
                {t("voice.eyebrow")}
              </span>
              <div className="mt-3 flex items-start justify-between gap-3">
                <h1 className="text-h1 font-semibold tracking-tight">{t("voice.title")}</h1>
                {/* Q8: globe toggle → read-only translated view of the voice */}
                <LangMenu
                  value={transLang}
                  onChange={onTranslate}
                  disabled={busy || checking || translating}
                  t={t}
                />
              </div>
              {/* Q67: real provenance — "Analyzed N posts · Updated <date>"
                  (the v<id>/parent line is gone from the hero). */}
              {book && (!!book.posts_analyzed || book.activated_at) && (
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-small text-text-muted">
                  {!!book.posts_analyzed && book.posts_analyzed > 0 && (
                    <span className="tabular-nums">
                      {fill(t("voice.analyzed_posts"), { n: book.posts_analyzed })}
                    </span>
                  )}
                  {!!book.posts_analyzed && book.posts_analyzed > 0 && book.activated_at && (
                    <span className="h-[3px] w-[3px] rounded-full bg-text-subtle" />
                  )}
                  {book.activated_at && (
                    <span>
                      {fill(t("voice.updated_on"), { date: fmtVoiceDate(book.activated_at, locale) })}
                    </span>
                  )}
                </div>
              )}
              <div className="mt-5 flex flex-wrap items-center gap-2.5">
                <Button
                  variant="secondary"
                  onClick={onCheck}
                  disabled={busy || checking || readOnly}
                  loading={checking}
                  icon={<IcScan size={16} />}
                >
                  {checking ? t("voice.checking") : t("voice.check_voice")}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setReDialog(true)}
                  disabled={busy || checking || readOnly}
                  icon={<IcRefresh size={16} />}
                >
                  {t("rolebook.extract.button")}
                </Button>
              </div>
            </section>

            {/* Q8: read-only translation banner + "view original" */}
            {readOnly && transLang && (
              <TranslatedBanner
                lang={transLang}
                translating={translating}
                onViewOriginal={() => onTranslate(null)}
                t={t}
              />
            )}

            {busy ? (
              <ReExtractPanel stepIndex={stepIndex} steps={REEXTRACT_STEPS} postCount={book?.posts_analyzed ?? undefined} t={t} />
            ) : (
              <>
                {/* Voice check — hidden in the read-only translated view */}
                {!readOnly && (checking || lintResult) && (
                  <VoiceCheck
                    conflicts={visibleConflicts}
                    checking={checking}
                    lastRun={lastRun}
                    applyingIdx={applyingIdx}
                    onApply={onApply}
                    onDismiss={(i) => setDismissed((s) => new Set(s).add(i))}
                    onRecheck={onCheck}
                    t={t}
                  />
                )}

                {/* Intro */}
                <IntroSection
                  key={demoOn ? `intro-${tw.state}` : "intro"}
                  value={displaySections.intro ?? ""}
                  readOnly={readOnly}
                  initialEditing={demoEdit}
                  onSave={(text) => saveSection({ intro: text })}
                  t={t}
                />

                {/* Themes ± — Q60 typed {id, label, note} */}
                <ThemesSection
                  key={demoOn ? `ti-${tw.state}` : "ti"}
                  items={displaySections.themes_include ?? []}
                  readOnly={readOnly}
                  initialEditing={demoEdit}
                  Icon={IcTags}
                  labelKey="rolebook.themes_include.label"
                  helperKey="rolebook.themes_include.helper"
                  placeholderKey="rolebook.themes_include.placeholder"
                  notePlaceholderKey="rolebook.themes_include.note_placeholder"
                  flagged={flaggedIds.themes_include}
                  onSave={(items) => saveSection({ themes_include: items })}
                  t={t}
                />
                <ThemesSection
                  items={displaySections.themes_exclude ?? []}
                  readOnly={readOnly}
                  danger
                  Icon={IcAlert}
                  labelKey="rolebook.themes_exclude.label"
                  helperKey="rolebook.themes_exclude.helper"
                  placeholderKey="rolebook.themes_exclude.placeholder"
                  notePlaceholderKey="rolebook.themes_exclude.note_placeholder"
                  flagged={flaggedIds.themes_exclude}
                  onSave={(items) => saveSection({ themes_exclude: items })}
                  t={t}
                />

                {/* Voice characteristics — Q60 typed {id, label?, text} */}
                <TraitsSection
                  items={displaySections.voice_characteristics ?? []}
                  readOnly={readOnly}
                  flagged={flaggedIds.voice_characteristics}
                  onSave={(items) => saveSection({ voice_characteristics: items })}
                  t={t}
                />

                {/* Do / Don't — Q60 typed {id, text} */}
                <RulesSection
                  items={displaySections.do_list ?? []}
                  readOnly={readOnly}
                  Icon={IcCheck}
                  labelKey="rolebook.do_list.label"
                  helperKey="rolebook.do_list.helper"
                  placeholderKey="rolebook.do_list.placeholder"
                  flagged={flaggedIds.do_list}
                  onSave={(items) => saveSection({ do_list: items })}
                  t={t}
                />
                <RulesSection
                  items={displaySections.dont_list ?? []}
                  readOnly={readOnly}
                  danger
                  Icon={IcX}
                  labelKey="rolebook.dont_list.label"
                  helperKey="rolebook.dont_list.helper"
                  placeholderKey="rolebook.dont_list.placeholder"
                  flagged={flaggedIds.dont_list}
                  onSave={(items) => saveSection({ dont_list: items })}
                  t={t}
                />

                {/* Examples — typed {id, context, text} (Q16) */}
                <ExamplesSection
                  items={displaySections.examples ?? []}
                  readOnly={readOnly}
                  flagged={flaggedIds.examples}
                  onSave={(examples) => saveSection({ examples })}
                  t={t}
                />

                {/* Transparency */}
                <details open={promptOpen} className="rounded-lg border border-border bg-surface p-5 shadow-sm">
                  <summary className="cursor-pointer text-small font-semibold">
                    {t("rolebook.transparency.title")}
                    <span className="ml-2 font-normal text-caption text-text-subtle">
                      {t("rolebook.transparency.subtitle")}
                    </span>
                  </summary>
                  <pre className="mt-3 whitespace-pre-wrap font-mono text-caption leading-relaxed text-text">
                    {book.prompt_text}
                  </pre>
                  <div className="mt-3">
                    <TranslateButton text={book.prompt_text} source="role_book_assembled" />
                  </div>
                </details>
              </>
            )}
          </>
        ))}
        {/* Anti-robot panel — ALWAYS mounted (hidden when inactive) so its on/total
            count is known for the tab chip + topbar pill without first visiting the
            tab, and switching tabs is instant with state preserved. */}
        <div className={tab === "anti" ? "" : "hidden"}>
          <AntiRobotPanel accountId={accountId} demoOn={demoOn} onCounts={setAntiCounts} />
        </div>
      </main>

      {reDialog && (
        <div
          className="fixed inset-0 z-40 grid place-items-center bg-ink-950/55 p-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setReDialog(false);
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-lg">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-border bg-surface-2 text-text">
                <IcRefresh size={18} />
              </span>
              <div>
                <h2 className="text-h3 font-semibold">{t("rolebook.extract.confirm_title")}</h2>
                <p className="mt-1 text-small leading-relaxed text-text-muted">
                  {t("rolebook.extract.confirm_body")}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-start gap-2.5 rounded-md border border-warning/30 bg-warning/[0.09] px-3 py-2.5 text-small leading-relaxed text-text-muted">
              <IcAlert size={16} className="mt-0.5 shrink-0 text-warning" />
              <div>{t("voice.rx_warn")}</div>
            </div>
            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button onClick={() => setReDialog(false)} className={buttonClasses({ variant: "ghost" })}>
                {t("common.cancel")}
              </button>
              <Button variant="primary" icon={<IcRefresh size={15} />} onClick={startReExtract}>
                {t("rolebook.extract.confirm_cta")}
              </Button>
            </div>
          </div>
        </div>
      )}

      <ToastHost>
        {toasts.map((tt) => (
          <Toast key={tt.id} tone={tt.tone} title={tt.message} />
        ))}
      </ToastHost>

      {allow && (
        <TweaksPanel title="Voice">
          <TweakSection label="Appearance" />
          <TweakToggle label="Dark mode" value={tw.dark} onChange={(v) => setTw("dark", v)} />
          <TweakSection label="State" />
          <TweakRadio
            label="State"
            value={tw.state}
            options={VC_STATES}
            onChange={(v) => setTw("state", v)}
          />
        </TweaksPanel>
      )}
    </div>
  );
}

function fill(s: string, vars: Record<string, string | number>): string {
  return s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
}

// Q67: a localized "Mar 16, 2026" date for the voice hero.
function fmtVoiceDate(iso: string, locale: string): string {
  const loc = locale === "ru" ? "ru-RU" : locale === "en" ? "en-US" : locale;
  try {
    return new Date(iso).toLocaleDateString(loc, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
}

// Q23: shown when GET /role-book 404s (no voice yet) — extract one to begin.
function EmptyVoice({
  onExtract,
  t,
}: {
  onExtract: () => void;
  t: (k: MessageKey) => string;
}) {
  return (
    <section className="flex flex-col items-center rounded-xl border border-dashed border-border bg-surface px-7 py-16 text-center shadow-sm">
      <span className="mb-4 grid h-14 w-14 place-items-center rounded-xl border border-border bg-surface-2 text-accent">
        <IcVoice size={28} />
      </span>
      <h1 className="text-h1 font-semibold tracking-tight">{t("voice.empty_title")}</h1>
      <p className="mx-auto mt-2.5 max-w-[46ch] text-body leading-relaxed text-text-muted">
        {t("voice.empty_sub")}
      </p>
      <Button className="mt-6" variant="primary" onClick={onExtract} icon={<IcScan size={18} />}>
        {t("voice.empty_cta")}
      </Button>
      <p className="mt-3.5 text-caption text-text-subtle">{t("voice.empty_note")}</p>
    </section>
  );
}

// ── Q8: translate mode ──────────────────────────────────────────────────────
// A compact globe dropdown over the 8 UI locales. value=null → the editable
// original; a locale → a read-only translated view.
function LangMenu({
  value,
  onChange,
  disabled,
  t,
}: {
  value: LanguageCode | null;
  onChange: (v: LanguageCode | null) => void;
  disabled?: boolean;
  t: (k: MessageKey) => string;
}) {
  const [open, setOpen] = useState(false);
  const cur = value ? SUPPORTED_LANGUAGES.find((l) => l.code === value) : null;
  return (
    <div className="relative shrink-0">
      {open && <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden />}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="relative z-40 inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 text-small font-medium text-text-muted transition-colors hover:bg-surface-2 hover:text-text disabled:cursor-not-allowed disabled:opacity-50"
      >
        <IcGlobe size={16} />
        <span>{cur ? cur.name : t("voice.original")}</span>
        <IcChevDown size={14} className="text-text-subtle" />
      </button>
      {open && (
        <div
          className="absolute right-0 z-40 mt-1.5 max-h-[330px] w-60 overflow-auto rounded-lg border border-border bg-surface p-1 shadow-lg"
          role="menu"
        >
          <button
            role="menuitemradio"
            aria-checked={value === null}
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
            className="flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-2 text-left hover:bg-surface-2"
          >
            <span className="flex flex-col">
              <span className="text-small font-medium text-text">{t("voice.original")}</span>
              <span className="text-caption text-text-subtle">{t("voice.original_editable")}</span>
            </span>
            {value === null && <IcCheck size={15} className="shrink-0 text-accent" />}
          </button>
          <div className="my-1 h-px bg-border" />
          {SUPPORTED_LANGUAGES.map((l) => (
            <button
              key={l.code}
              role="menuitemradio"
              aria-checked={value === l.code}
              onClick={() => {
                onChange(l.code);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-2 text-left text-small text-text hover:bg-surface-2"
            >
              <span className="flex items-center gap-2.5">
                <span className="w-[22px] shrink-0 font-mono text-caption uppercase text-text-subtle">
                  {l.code}
                </span>
                {l.name}
              </span>
              {value === l.code && <IcCheck size={15} className="shrink-0 text-accent" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Read-only translation banner with a "view original" escape hatch.
function TranslatedBanner({
  lang,
  translating,
  onViewOriginal,
  t,
}: {
  lang: LanguageCode;
  translating: boolean;
  onViewOriginal: () => void;
  t: (k: MessageKey) => string;
}) {
  const l = SUPPORTED_LANGUAGES.find((x) => x.code === lang);
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-accent/30 bg-accent/[0.06] px-4 py-3">
      {translating ? <Spinner /> : <IcGlobe size={17} className="shrink-0 text-accent" />}
      <div className="min-w-0 flex-1 text-small leading-snug text-text">
        {translating ? (
          <>
            <b className="font-semibold">{l ? l.name : lang}</b>{" "}
            <span className="text-text-muted">{t("voice.translating")}</span>
          </>
        ) : (
          <>
            <b className="font-semibold">
              {fill(t("voice.translated_banner_lead"), { lang: l ? l.name : lang })}
            </b>{" "}
            <span className="text-text-muted">{t("voice.translated_banner")}</span>
          </>
        )}
      </div>
      <button onClick={onViewOriginal} className={buttonClasses({ variant: "secondary", size: "sm" })}>
        <IcPencil size={14} /> {t("voice.view_original")}
      </button>
    </div>
  );
}

// ── Section shell ───────────────────────────────────────────────────────────
function SectionShell({
  Icon,
  title,
  desc,
  count,
  editing,
  readOnly,
  onEdit,
  onSave,
  onCancel,
  footNote,
  children,
  t,
}: {
  Icon: (p: { size?: number }) => ReactNode;
  title: string;
  desc: string;
  count?: number;
  editing: boolean;
  readOnly?: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  footNote?: string;
  children: ReactNode;
  t: (k: MessageKey) => string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-lg border bg-surface shadow-sm transition-colors",
        editing ? "border-accent/45 shadow-md" : "border-border",
      )}
    >
      <div className="flex items-center gap-3 p-4">
        <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-md border border-border bg-surface-2 text-text-muted">
          <Icon size={17} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-h3 font-semibold leading-tight">
            {title}
            {count != null && (
              <span className="inline-flex h-[18px] min-w-[20px] items-center justify-center rounded-full border border-border bg-surface-2 px-1.5 text-caption font-semibold text-text-subtle">
                {count}
              </span>
            )}
          </div>
          <div className="mt-0.5 text-caption text-text-subtle">{desc}</div>
        </div>
        {!editing && !readOnly && (
          <button
            onClick={onEdit}
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-small font-medium text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
          >
            <IcPencil size={15} /> {t("voice.edit")}
          </button>
        )}
      </div>
      <div className="px-4 pb-4">{children}</div>
      {editing && (
        <div className="flex items-center justify-end gap-2.5 border-t border-border bg-surface-2 px-4 py-3">
          {footNote && <span className="mr-auto text-caption text-text-subtle">{footNote}</span>}
          <button onClick={onCancel} className={buttonClasses({ variant: "ghost", size: "sm" })}>
            {t("common.cancel")}
          </button>
          <Button size="sm" variant="primary" onClick={onSave} icon={<IcCheck size={15} />}>
            {t("voice.save_changes")}
          </Button>
        </div>
      )}
    </section>
  );
}

function IntroSection({
  value,
  readOnly,
  onSave,
  initialEditing,
  t,
}: {
  value: string;
  readOnly?: boolean;
  onSave: (text: string) => Promise<void>;
  initialEditing?: boolean;
  t: (k: MessageKey) => string;
}) {
  const [editing, setEditing] = useState(!!initialEditing);
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  useEffect(() => {
    if (readOnly) setEditing(false);
  }, [readOnly]);
  return (
    <SectionShell
      Icon={IcVoice}
      title={t("rolebook.intro.label")}
      desc={t("rolebook.intro.helper")}
      editing={editing}
      readOnly={readOnly}
      onEdit={() => {
        if (readOnly) return;
        setDraft(value);
        setEditing(true);
      }}
      onCancel={() => setEditing(false)}
      onSave={async () => {
        await onSave(draft.trim());
        setEditing(false);
      }}
      t={t}
    >
      {editing ? (
        <textarea
          value={draft}
          autoFocus
          onChange={(e) => setDraft(e.target.value)}
          rows={5}
          placeholder={t("rolebook.intro.placeholder")}
          className="min-h-[120px] w-full resize-y rounded-md border border-accent bg-surface px-3 py-2.5 text-body leading-relaxed text-text shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-accent)_16%,transparent)] outline-none max-md:text-[16px]"
        />
      ) : value ? (
        <p className="whitespace-pre-wrap text-body leading-relaxed text-text">{value}</p>
      ) : (
        <p className="text-small italic text-text-subtle">{t("rolebook.intro.placeholder")}</p>
      )}
    </SectionShell>
  );
}

// Q60: themes (include / exclude) are typed {id, label, note}. Edit both
// fields; the stable id round-trips so lint can flag the exact pill by id.
function ThemesSection({
  items,
  danger,
  readOnly,
  Icon,
  labelKey,
  helperKey,
  placeholderKey,
  notePlaceholderKey,
  flagged,
  onSave,
  initialEditing,
  t,
}: {
  items: RoleBookThemeItem[];
  danger?: boolean;
  readOnly?: boolean;
  Icon: (p: { size?: number }) => ReactNode;
  labelKey: MessageKey;
  helperKey: MessageKey;
  placeholderKey: MessageKey;
  notePlaceholderKey: MessageKey;
  flagged?: Set<string>;
  onSave: (items: RoleBookThemeItem[]) => Promise<void>;
  initialEditing?: boolean;
  t: (k: MessageKey) => string;
}) {
  const [editing, setEditing] = useState(!!initialEditing);
  const [draft, setDraft] = useState<RoleBookThemeItem[]>(items);
  useEffect(() => setDraft(items), [items]);
  useEffect(() => {
    if (readOnly) setEditing(false);
  }, [readOnly]);
  const set = (i: number, k: "label" | "note", v: string) =>
    setDraft((d) => d.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  return (
    <SectionShell
      Icon={Icon}
      title={t(labelKey)}
      desc={t(helperKey)}
      count={items.length}
      editing={editing}
      readOnly={readOnly}
      onEdit={() => {
        if (readOnly) return;
        setDraft(items.length ? items.map((x) => ({ ...x })) : [{ label: "", note: "" }]);
        setEditing(true);
      }}
      onCancel={() => setEditing(false)}
      onSave={async () => {
        await onSave(
          draft
            .map((x) => ({ ...x, label: x.label.trim(), note: (x.note ?? "").trim() }))
            .filter((x) => x.label),
        );
        setEditing(false);
      }}
      t={t}
    >
      {editing ? (
        <div className="flex flex-col gap-2.5">
          {draft.map((x, i) => (
            <div key={i} className="flex items-start gap-2.5 rounded-md border border-border bg-surface-2 p-2.5">
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <input
                  value={x.label}
                  onChange={(e) => set(i, "label", e.target.value)}
                  placeholder={t(placeholderKey)}
                  className="h-9 w-full rounded-sm border border-border bg-surface px-2.5 text-small font-medium text-text outline-none focus:border-accent max-md:text-[16px]"
                />
                <input
                  value={x.note ?? ""}
                  onChange={(e) => set(i, "note", e.target.value)}
                  placeholder={t(notePlaceholderKey)}
                  className="h-8 w-full rounded-sm border border-border bg-surface px-2.5 text-small text-text-muted outline-none focus:border-accent max-md:text-[16px]"
                />
              </div>
              <button
                onClick={() => setDraft((d) => d.filter((_, j) => j !== i))}
                aria-label={t("common.cancel")}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-sm text-text-subtle transition-colors hover:bg-danger/12 hover:text-danger"
              >
                <IcTrash size={16} />
              </button>
            </div>
          ))}
          <button
            onClick={() => setDraft((d) => [...d, { label: "", note: "" }])}
            className="inline-flex items-center gap-1.5 self-start rounded-md border border-dashed border-border bg-surface px-3 py-2 text-small font-medium text-text-muted transition-colors hover:border-text/20 hover:bg-surface-2 hover:text-text"
          >
            <IcPlus size={15} /> {t("voice.add_item")}
          </button>
        </div>
      ) : items.length === 0 ? (
        <p className="text-small italic text-text-subtle">{t(placeholderKey)}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((x, i) => {
            const isFlagged = !!x.id && flagged?.has(x.id);
            return (
              <div
                key={x.id ?? i}
                className={cn(
                  "rounded-md border px-3 py-2.5 leading-relaxed",
                  isFlagged
                    ? "border-warning/45 bg-warning/[0.07]"
                    : danger
                      ? "border-danger/25 bg-danger/[0.05]"
                      : "border-border bg-surface-2",
                )}
              >
                <span className="text-small font-medium text-text">{x.label}</span>
                {x.note && (
                  <span className="mt-0.5 block text-caption text-text-subtle">{x.note}</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </SectionShell>
  );
}

// Q60: voice characteristics are typed {id, label?, text} — an optional short
// name + the observation. Flagged by id.
function TraitsSection({
  items,
  readOnly,
  flagged,
  onSave,
  t,
}: {
  items: RoleBookTraitItem[];
  readOnly?: boolean;
  flagged?: Set<string>;
  onSave: (items: RoleBookTraitItem[]) => Promise<void>;
  t: (k: MessageKey) => string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<RoleBookTraitItem[]>(items);
  useEffect(() => setDraft(items), [items]);
  useEffect(() => {
    if (readOnly) setEditing(false);
  }, [readOnly]);
  const set = (i: number, k: "label" | "text", v: string) =>
    setDraft((d) => d.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  return (
    <SectionShell
      Icon={IcList}
      title={t("rolebook.voice_characteristics.label")}
      desc={t("rolebook.voice_characteristics.helper")}
      count={items.length}
      editing={editing}
      readOnly={readOnly}
      onEdit={() => {
        if (readOnly) return;
        setDraft(items.length ? items.map((x) => ({ ...x })) : [{ label: "", text: "" }]);
        setEditing(true);
      }}
      onCancel={() => setEditing(false)}
      onSave={async () => {
        await onSave(
          draft
            .map((x) => ({ ...x, label: (x.label ?? "").trim(), text: x.text.trim() }))
            .filter((x) => x.text),
        );
        setEditing(false);
      }}
      t={t}
    >
      {editing ? (
        <div className="flex flex-col gap-2.5">
          {draft.map((x, i) => (
            <div key={i} className="flex items-start gap-2.5 rounded-md border border-border bg-surface-2 p-2.5">
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <input
                  value={x.label ?? ""}
                  onChange={(e) => set(i, "label", e.target.value)}
                  placeholder={t("rolebook.voice_characteristics.label_placeholder")}
                  className="h-9 w-full rounded-sm border border-border bg-surface px-2.5 text-small font-medium text-text outline-none focus:border-accent max-md:text-[16px]"
                />
                <textarea
                  value={x.text}
                  rows={2}
                  onChange={(e) => set(i, "text", e.target.value)}
                  placeholder={t("rolebook.voice_characteristics.placeholder")}
                  className="min-h-[60px] w-full resize-y rounded-sm border border-border bg-surface px-2.5 py-2 text-small leading-relaxed text-text outline-none focus:border-accent max-md:text-[16px]"
                />
              </div>
              <button
                onClick={() => setDraft((d) => d.filter((_, j) => j !== i))}
                aria-label={t("common.cancel")}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-sm text-text-subtle transition-colors hover:bg-danger/12 hover:text-danger"
              >
                <IcTrash size={16} />
              </button>
            </div>
          ))}
          <button
            onClick={() => setDraft((d) => [...d, { label: "", text: "" }])}
            className="inline-flex items-center gap-1.5 self-start rounded-md border border-dashed border-border bg-surface px-3 py-2 text-small font-medium text-text-muted transition-colors hover:border-text/20 hover:bg-surface-2 hover:text-text"
          >
            <IcPlus size={15} /> {t("voice.add_item")}
          </button>
        </div>
      ) : items.length === 0 ? (
        <p className="text-small italic text-text-subtle">
          {t("rolebook.voice_characteristics.placeholder")}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((x, i) => {
            const isFlagged = !!x.id && flagged?.has(x.id);
            return (
              <div
                key={x.id ?? i}
                className={cn(
                  "rounded-md border px-3 py-2.5 leading-relaxed",
                  isFlagged
                    ? "border-warning/45 bg-warning/[0.07]"
                    : "border-border bg-surface-2",
                )}
              >
                {x.label && (
                  <span className="mb-1 inline-flex items-center rounded-full border border-border bg-surface px-2 py-px text-caption font-semibold uppercase tracking-wide text-text-subtle">
                    {x.label}
                  </span>
                )}
                <p className="whitespace-pre-wrap text-small leading-relaxed text-text">{x.text}</p>
              </div>
            );
          })}
        </div>
      )}
    </SectionShell>
  );
}

// Q60: do / don't rules are typed {id, text} — single-field, flagged by id.
function RulesSection({
  items,
  danger,
  readOnly,
  Icon,
  labelKey,
  helperKey,
  placeholderKey,
  flagged,
  onSave,
  t,
}: {
  items: RoleBookRuleItem[];
  danger?: boolean;
  readOnly?: boolean;
  Icon: (p: { size?: number }) => ReactNode;
  labelKey: MessageKey;
  helperKey: MessageKey;
  placeholderKey: MessageKey;
  flagged?: Set<string>;
  onSave: (items: RoleBookRuleItem[]) => Promise<void>;
  t: (k: MessageKey) => string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<RoleBookRuleItem[]>(items);
  useEffect(() => setDraft(items), [items]);
  useEffect(() => {
    if (readOnly) setEditing(false);
  }, [readOnly]);
  const set = (i: number, v: string) =>
    setDraft((d) => d.map((x, j) => (j === i ? { ...x, text: v } : x)));
  return (
    <SectionShell
      Icon={Icon}
      title={t(labelKey)}
      desc={t(helperKey)}
      count={items.length}
      editing={editing}
      readOnly={readOnly}
      onEdit={() => {
        if (readOnly) return;
        setDraft(items.length ? items.map((x) => ({ ...x })) : [{ text: "" }]);
        setEditing(true);
      }}
      onCancel={() => setEditing(false)}
      onSave={async () => {
        await onSave(
          draft.map((x) => ({ ...x, text: x.text.trim() })).filter((x) => x.text),
        );
        setEditing(false);
      }}
      t={t}
    >
      {editing ? (
        <div className="flex flex-col gap-2.5">
          {draft.map((x, i) => (
            <div key={i} className="flex items-start gap-2.5 rounded-md border border-border bg-surface-2 p-2.5">
              <textarea
                value={x.text}
                rows={2}
                onChange={(e) => set(i, e.target.value)}
                placeholder={t(placeholderKey)}
                className="min-h-[60px] w-full resize-y rounded-sm border border-border bg-surface px-2.5 py-2 text-small leading-relaxed text-text outline-none focus:border-accent max-md:text-[16px]"
              />
              <button
                onClick={() => setDraft((d) => d.filter((_, j) => j !== i))}
                aria-label={t("common.cancel")}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-sm text-text-subtle transition-colors hover:bg-danger/12 hover:text-danger"
              >
                <IcTrash size={16} />
              </button>
            </div>
          ))}
          <button
            onClick={() => setDraft((d) => [...d, { text: "" }])}
            className="inline-flex items-center gap-1.5 self-start rounded-md border border-dashed border-border bg-surface px-3 py-2 text-small font-medium text-text-muted transition-colors hover:border-text/20 hover:bg-surface-2 hover:text-text"
          >
            <IcPlus size={15} /> {t("voice.add_item")}
          </button>
        </div>
      ) : items.length === 0 ? (
        <p className="text-small italic text-text-subtle">{t(placeholderKey)}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((x, i) => {
            const isFlagged = !!x.id && flagged?.has(x.id);
            return (
              <li
                key={x.id ?? i}
                className={cn(
                  "flex items-start gap-2.5 rounded-md border px-3 py-2.5 text-small leading-relaxed",
                  isFlagged
                    ? "border-warning/45 bg-warning/[0.07] text-text"
                    : danger
                      ? "border-danger/25 bg-danger/[0.05] text-text"
                      : "border-border bg-surface-2 text-text",
                )}
              >
                <span className="mt-0.5 shrink-0 text-text-muted">
                  {danger ? <IcX size={13} /> : <IcCheck size={13} />}
                </span>
                <span className="whitespace-pre-wrap">{x.text}</span>
              </li>
            );
          })}
        </ul>
      )}
    </SectionShell>
  );
}

// Q16: examples are typed ({id,context,text}) — show + edit the Post/Reply
// context per example, and preserve it (plus the stable id) through an edit.
function ExamplesSection({
  items,
  readOnly,
  flagged,
  onSave,
  t,
}: {
  items: RoleBookExample[];
  readOnly?: boolean;
  flagged?: Set<string>;
  onSave: (examples: RoleBookExample[]) => Promise<void>;
  t: (k: MessageKey) => string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<RoleBookExample[]>(items);
  useEffect(() => setDraft(items), [items]);
  useEffect(() => {
    if (readOnly) setEditing(false);
  }, [readOnly]);
  const set = (i: number, k: keyof RoleBookExample, v: string) =>
    setDraft((d) => d.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  return (
    <SectionShell
      Icon={IcQuote}
      title={t("rolebook.examples.label")}
      desc={t("rolebook.examples.helper")}
      count={items.length}
      editing={editing}
      readOnly={readOnly}
      onEdit={() => {
        if (readOnly) return;
        setDraft(items.length ? items.map((x) => ({ ...x })) : [{ context: "post", text: "" }]);
        setEditing(true);
      }}
      onCancel={() => setEditing(false)}
      onSave={async () => {
        await onSave(
          draft.map((x) => ({ ...x, text: x.text.trim() })).filter((x) => x.text),
        );
        setEditing(false);
      }}
      t={t}
    >
      {editing ? (
        <div className="flex flex-col gap-2.5">
          {draft.map((x, i) => (
            <div
              key={i}
              className="flex items-start gap-2.5 rounded-md border border-border bg-surface-2 p-2.5"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <select
                  value={x.context}
                  onChange={(e) => set(i, "context", e.target.value)}
                  aria-label={t("voice.example_kind")}
                  className="h-8 w-[130px] rounded-sm border border-border bg-surface px-2 text-small text-text outline-none focus:border-accent"
                >
                  <option value="post">{t("voice.example_post")}</option>
                  <option value="reply">{t("voice.example_reply")}</option>
                </select>
                <textarea
                  value={x.text}
                  rows={2}
                  onChange={(e) => set(i, "text", e.target.value)}
                  placeholder={t("rolebook.examples.placeholder")}
                  className="min-h-[60px] w-full resize-y rounded-sm border border-border bg-surface px-2.5 py-2 text-small leading-relaxed text-text outline-none focus:border-accent max-md:text-[16px]"
                />
              </div>
              <button
                onClick={() => setDraft((d) => d.filter((_, j) => j !== i))}
                aria-label={t("common.cancel")}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-sm text-text-subtle transition-colors hover:bg-danger/12 hover:text-danger"
              >
                <IcTrash size={16} />
              </button>
            </div>
          ))}
          <button
            onClick={() => setDraft((d) => [...d, { context: "post", text: "" }])}
            className="inline-flex items-center gap-1.5 self-start rounded-md border border-dashed border-border bg-surface px-3 py-2 text-small font-medium text-text-muted transition-colors hover:border-text/20 hover:bg-surface-2 hover:text-text"
          >
            <IcPlus size={15} /> {t("voice.add_item")}
          </button>
        </div>
      ) : items.length === 0 ? (
        <p className="text-small italic text-text-subtle">{t("rolebook.examples.placeholder")}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((x, i) => (
            <div
              key={x.id ?? i}
              className={cn(
                "rounded-md border px-3 py-2.5 text-small leading-relaxed",
                !!x.id && flagged?.has(x.id)
                  ? "border-warning/45 bg-warning/[0.07] text-text"
                  : "border-border bg-surface-2 text-text",
              )}
            >
              <span className="mb-1.5 inline-flex items-center rounded-full border border-border bg-surface px-2 py-px text-caption font-semibold uppercase tracking-wide text-text-subtle">
                {x.context === "reply" ? t("voice.example_reply") : t("voice.example_post")}
              </span>
              <p className="whitespace-pre-wrap">{x.text}</p>
            </div>
          ))}
        </div>
      )}
    </SectionShell>
  );
}

// ── Voice check (lint) ────────────────────────────────────────────────────
function VoiceCheck({
  conflicts,
  checking,
  lastRun,
  applyingIdx,
  onApply,
  onDismiss,
  onRecheck,
  t,
}: {
  conflicts: { conflict: LintConflict; index: number }[];
  checking: boolean;
  lastRun: string | null;
  applyingIdx: number | null;
  onApply: (fix: LintFix, idx: number) => void;
  onDismiss: (idx: number) => void;
  onRecheck: () => void;
  t: (k: MessageKey) => string;
}) {
  const clear = !checking && conflicts.length === 0;
  return (
    <section className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
      <div className="flex items-center gap-3 border-b border-border p-4">
        <span
          className={cn(
            "grid h-9 w-9 shrink-0 place-items-center rounded-md border",
            clear
              ? "border-success/30 bg-success/12 text-success"
              : "border-warning/30 bg-warning/12 text-warning",
          )}
        >
          {clear ? <IcShield size={18} /> : <IcScan size={18} />}
        </span>
        <div className="min-w-0 flex-1">
          {checking ? (
            <>
              <div className="text-h3 font-semibold leading-tight">{t("voice.check_running_t")}</div>
              <div className="mt-0.5 text-small text-text-muted">{t("voice.check_running_s")}</div>
            </>
          ) : clear ? (
            <>
              <div className="text-h3 font-semibold leading-tight">{t("voice.check_clear_t")}</div>
              <div className="mt-0.5 text-small text-text-muted">{t("voice.check_clear_s")}</div>
            </>
          ) : (
            <>
              <div className="text-h3 font-semibold leading-tight">
                {fill(t("voice.to_resolve"), { n: conflicts.length })}
              </div>
              <div className="mt-0.5 text-small text-text-muted">{t("voice.check_issues_s")}</div>
            </>
          )}
        </div>
      </div>

      {checking ? (
        <div className="flex flex-col gap-2.5 p-[18px]">
          <Skeleton className="h-3 w-[70%]" />
          <Skeleton className="h-14 w-full rounded-md" />
          <Skeleton className="h-3 w-[52%]" />
        </div>
      ) : !clear ? (
        <div className="flex flex-col">
          {conflicts.map(({ conflict: c, index }) => (
            <ConflictCard
              key={index}
              conflict={c}
              applying={applyingIdx === index}
              onApply={() => c.fix && onApply(c.fix, index)}
              onDismiss={() => onDismiss(index)}
              t={t}
            />
          ))}
        </div>
      ) : null}

      <div className="flex items-center gap-2.5 border-t border-border p-3.5">
        <span className="text-caption text-text-subtle">
          {checking ? t("voice.checking_now") : lastRun ? fill(t("voice.last_checked"), { when: lastRun }) : ""}
        </span>
        <span className="flex-1" />
        <Button size="sm" variant="ghost" onClick={onRecheck} disabled={checking} icon={<IcRefresh size={15} />}>
          {t("voice.recheck")}
        </Button>
      </div>
    </section>
  );
}

function ConflictCard({
  conflict,
  applying,
  onApply,
  onDismiss,
  t,
}: {
  conflict: LintConflict;
  applying: boolean;
  onApply: () => void;
  onDismiss: () => void;
  t: (k: MessageKey) => string;
}) {
  const high = conflict.severity === "high";
  return (
    <div className="border-b border-border p-[18px] last:border-b-0">
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 text-caption font-semibold uppercase tracking-wide",
            high ? "text-danger" : "text-warning",
          )}
        >
          <span className={cn("h-2 w-2 rounded-full", high ? "bg-danger" : "bg-warning")} />
          {high ? t("voice.sev_conflict") : t("voice.sev_caution")}
        </span>
        <span className="flex-1" />
        <button
          onClick={onDismiss}
          className="rounded-sm px-1.5 py-1 text-caption text-text-subtle transition-colors hover:bg-surface-2 hover:text-text"
        >
          {t("voice.ignore")}
        </button>
      </div>
      <div className="mt-2.5 text-h3 font-semibold leading-tight">{conflict.title}</div>
      {conflict.items.length > 0 && (
        <div className="mt-3 flex flex-col gap-2">
          {conflict.items.map((it, i) => (
            <div
              key={i}
              className="grid grid-cols-[auto_1fr] items-start gap-2.5 rounded-md border border-border bg-surface-2 px-3 py-2.5"
            >
              <span className="whitespace-nowrap pt-px text-caption font-semibold text-text-subtle">
                {it.section.replace(/_/g, " ")}
              </span>
              <span className="text-small leading-snug text-text">{it.text}</span>
            </div>
          ))}
        </div>
      )}
      {conflict.description && (
        <p className="mt-3 text-small leading-relaxed text-text-muted">{conflict.description}</p>
      )}
      <div className="mt-3.5 flex flex-wrap items-center gap-3.5 rounded-md border border-accent/26 bg-accent/[0.06] px-3.5 py-3">
        <div className="min-w-[230px] flex-1">
          <div className="text-caption font-semibold uppercase tracking-wide text-accent">
            {t("rolebook.lint.suggested_fix")}
          </div>
          <div className="mt-0.5 text-small leading-snug text-text">{conflict.suggestion}</div>
        </div>
        {conflict.fix && (
          <Button
            size="sm"
            variant="primary"
            onClick={onApply}
            loading={applying}
            disabled={applying}
            icon={<IcCheck size={15} />}
          >
            {t("voice.apply_fix")}
          </Button>
        )}
      </div>
    </div>
  );
}

function ReExtractPanel({
  stepIndex,
  steps,
  postCount,
  t,
}: {
  stepIndex: number;
  steps: MessageKey[];
  postCount?: number;
  t: (k: MessageKey) => string;
}) {
  return (
    <section className="flex flex-col items-center rounded-xl border border-accent/40 bg-surface p-8 text-center shadow-md">
      <span className="text-text" style={{ animation: "nib-write 1.5s var(--ease-standard) infinite" }}>
        <IcNib size={40} />
      </span>
      <div className="mt-4 text-h2 font-semibold tracking-tight">{t("voice.rx_title")}</div>
      <div className="mt-2 max-w-[42ch] text-small leading-relaxed text-text-muted">
        {t("voice.rx_sub")}
      </div>
      <div className="mt-6 flex w-full max-w-[380px] flex-col text-left">
        {steps.map((k, i) => {
          const state = i < stepIndex ? "done" : i === stepIndex ? "active" : "todo";
          return (
            <div
              key={k}
              className={cn(
                "flex items-center gap-3 border-t border-border py-3 first:border-t-0",
                state === "todo" && "text-text-subtle",
              )}
            >
              <span
                className={cn(
                  "grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full border",
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
                  <Spinner size={11} />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-current opacity-50" />
                )}
              </span>
              <span
                className={cn(
                  "text-small",
                  state === "active" ? "font-medium text-text" : state === "done" ? "text-text" : "text-text-muted",
                )}
              >
                {postCount && postCount > 0 ? fill(t(k), { n: postCount }) : t(k).replace(/\s*\{n\}/g, "")}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
