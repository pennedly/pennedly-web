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
import { useRouter } from "next/navigation";

import {
  ApiError,
  applyLintFix,
  clearTokens,
  extractVoice,
  fetchRoleBook,
  getTokens,
  lintRoleBook,
  patchRoleBook,
} from "@/lib/api";
import { captureEvent } from "@/lib/analytics";
import { useSelectedAccountId } from "@/lib/account";
import { useTranslation, type MessageKey } from "@/lib/i18n";
import { TranslateButton } from "@/components/TranslateButton";
import { AppTopbar, TopbarPill } from "@/components/AppTopbar";
import { Button, buttonClasses } from "@/components/ui/button";
import { Skeleton, Spinner } from "@/components/ui/feedback";
import { Toast, ToastHost } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import {
  IcAlert,
  IcCheck,
  IcList,
  IcNib,
  IcPencil,
  IcPlus,
  IcQuote,
  IcRefresh,
  IcScan,
  IcShield,
  IcTags,
  IcTrash,
  IcVoice,
  IcX,
} from "@/components/icons";
import type {
  LintConflict,
  LintFix,
  LintResult,
  RoleBook,
  RoleBookExample,
  RoleBookSections,
} from "@/lib/types";

type ListKey = keyof Omit<RoleBookSections, "intro" | "examples">;
type Toast = { id: number; message: string; tone: "success" | "error" };

// Q60 interim (the 5 flat list sections): the backend returns each item as a
// typed object ({id,label,note} / {id,label,text} / {id,text}); this editor
// still edits them as flat display strings, so coerce on read. Saving strings
// re-wraps them server-side. Q16: `examples` are kept TYPED ({id,context,text})
// so their Post/Reply context survives an edit. The full typed editor for the
// other sections + the translate mode (Q8) is the remaining Voice task.
function flattenSections(
  raw: RoleBookSections | null | undefined,
): RoleBookSections {
  const out: RoleBookSections = {};
  if (!raw) return out;
  if (typeof raw.intro === "string") out.intro = raw.intro;
  const keys: ListKey[] = [
    "themes_include",
    "themes_exclude",
    "voice_characteristics",
    "do_list",
    "dont_list",
  ];
  for (const k of keys) {
    const arr = raw[k] as unknown[] | undefined;
    if (Array.isArray(arr)) {
      out[k] = arr
        .map((it) => {
          if (typeof it === "string") return it;
          const o = it as { label?: string; text?: string };
          return (o?.label || o?.text || "").trim();
        })
        .filter(Boolean);
    }
  }
  // Q16: keep examples typed — preserve id + context, normalize context to the
  // backend's lowercase "post"/"reply".
  const ex = raw.examples as unknown[] | undefined;
  if (Array.isArray(ex)) {
    out.examples = ex
      .map((it): RoleBookExample => {
        if (typeof it === "string") return { context: "post", text: it.trim() };
        const o = it as { id?: string; context?: string; text?: string };
        return {
          id: o.id,
          context: (o.context || "post").toLowerCase() === "reply" ? "reply" : "post",
          text: (o.text || "").trim(),
        };
      })
      .filter((e) => e.text);
  }
  return out;
}

const LIST_SECTIONS: {
  key: ListKey;
  Icon: (p: { size?: number }) => ReactNode;
  labelKey: MessageKey;
  helperKey: MessageKey;
  placeholderKey: MessageKey;
  multiline: boolean;
  danger?: boolean;
}[] = [
  { key: "themes_include", Icon: IcTags, labelKey: "rolebook.themes_include.label", helperKey: "rolebook.themes_include.helper", placeholderKey: "rolebook.themes_include.placeholder", multiline: false },
  { key: "themes_exclude", Icon: IcAlert, labelKey: "rolebook.themes_exclude.label", helperKey: "rolebook.themes_exclude.helper", placeholderKey: "rolebook.themes_exclude.placeholder", multiline: false, danger: true },
  { key: "voice_characteristics", Icon: IcList, labelKey: "rolebook.voice_characteristics.label", helperKey: "rolebook.voice_characteristics.helper", placeholderKey: "rolebook.voice_characteristics.placeholder", multiline: true },
  { key: "do_list", Icon: IcCheck, labelKey: "rolebook.do_list.label", helperKey: "rolebook.do_list.helper", placeholderKey: "rolebook.do_list.placeholder", multiline: true },
  { key: "dont_list", Icon: IcX, labelKey: "rolebook.dont_list.label", helperKey: "rolebook.dont_list.helper", placeholderKey: "rolebook.dont_list.placeholder", multiline: true, danger: true },
  // examples are rendered by the typed <ExamplesSection> (Q16), not here.
];

const REEXTRACT_STEPS: MessageKey[] = [
  "voice.rx_step1",
  "voice.rx_step2",
  "voice.rx_step3",
  "voice.rx_step4",
];

export default function VoiceEditor() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const accountId = useSelectedAccountId();
  const [book, setBook] = useState<RoleBook | null>(null);
  // Q23: GET /role-book 404s when the account has no voice yet → empty state.
  const [emptyVoice, setEmptyVoice] = useState(false);
  const [sections, setSections] = useState<RoleBookSections>({});
  const [bootError, setBootError] = useState<string | null>(null);
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

  function toast(message: string, tone: Toast["tone"] = "success") {
    const id = Date.now() + Math.random();
    setToasts((s) => [...s, { id, message, tone }]);
    setTimeout(() => setToasts((s) => s.filter((x) => x.id !== id)), 3500);
  }

  useEffect(() => {
    if (!getTokens()) router.push("/app/login");
  }, [router]);

  useEffect(() => {
    if (accountId === null) return;
    setBook(null);
    setLintResult(null);
    setEmptyVoice(false);
    (async () => {
      try {
        const rb = await fetchRoleBook(accountId);
        setBook(rb);
        setSections(flattenSections(rb.sections));
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
  }, [accountId, router]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // Visible conflicts (after local dismissals).
  const conflicts: LintConflict[] = lintResult
    ? lintResult.conflicts.filter((_, i) => !dismissed.has(i))
    : [];

  // Per-section flagged item texts, for the inline highlight.
  const flaggedBySection: Partial<Record<ListKey, Set<string>>> = {};
  const flaggedExamples = new Set<string>();
  for (const c of conflicts) {
    for (const item of c.items) {
      if (item.section === "examples") {
        flaggedExamples.add(item.text);
      } else {
        const sec = item.section as ListKey;
        (flaggedBySection[sec] ??= new Set()).add(item.text);
      }
    }
  }

  async function saveSection(patch: Partial<RoleBookSections>) {
    if (accountId === null) return;
    const next = { ...sections, ...patch };
    try {
      const rb = await patchRoleBook(accountId, next);
      setBook(rb);
      setSections(flattenSections(rb.sections));
      setLintResult(null);
      setDismissed(new Set());
      toast(t("voice.toast_saved"));
    } catch (e) {
      toast(String(e), "error");
      throw e;
    }
  }

  async function onCheck() {
    if (accountId === null) return;
    setChecking(true);
    setDismissed(new Set());
    captureEvent("ui.role_book_lint_clicked", { account_id: accountId });
    try {
      const result = await lintRoleBook(accountId, sections);
      setLintResult(result);
      setLastRun(t("voice.just_now"));
    } catch (e) {
      toast(String(e), "error");
    } finally {
      setChecking(false);
    }
  }

  async function onApply(fix: LintFix, idx: number) {
    if (accountId === null) return;
    setApplyingIdx(idx);
    captureEvent("ui.lint_fix_applied", { account_id: accountId, fix_kind: fix.kind });
    try {
      const rb = await applyLintFix(accountId, fix);
      setBook(rb);
      setSections(flattenSections(rb.sections));
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
      toast(String(e), "error");
    } finally {
      setApplyingIdx(null);
    }
  }

  function startReExtract() {
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
        setSections(flattenSections(rb.sections));
        setLintResult(null);
        setDismissed(new Set());
        setLastRun(t("voice.just_now"));
        toast(t("rolebook.extract.toast_done"));
      } catch (e) {
        toast(String(e), "error");
      } finally {
        setBusy(false);
      }
    })();
  }

  if (bootError) {
    return (
      <div className="min-h-screen bg-bg text-text">
        <AppTopbar title={t("rolebook.title")} />
        <main className="mx-auto max-w-[760px] px-5 py-7 md:px-6">
          <div className="rounded-lg border border-danger/40 bg-danger/10 p-4 text-small text-danger">
            {bootError}
          </div>
        </main>
      </div>
    );
  }

  const issues = conflicts.length;
  const pill = busy ? (
    <TopbarPill tone="warning">{t("voice.busy")}</TopbarPill>
  ) : lintResult && issues > 0 ? (
    <TopbarPill tone="warning">{fill(t("voice.to_resolve"), { n: issues })}</TopbarPill>
  ) : lintResult ? (
    <TopbarPill tone="success">{t("voice.in_sync")}</TopbarPill>
  ) : undefined;

  return (
    <div className="min-h-screen bg-bg text-text">
      <AppTopbar title={t("rolebook.title")} pill={pill} />
      <main className="mx-auto max-w-[760px] space-y-[18px] px-5 py-7 md:px-6">
        {!book ? (
          emptyVoice ? (
            busy ? (
              <ReExtractPanel stepIndex={stepIndex} steps={REEXTRACT_STEPS} t={t} />
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
              <h1 className="mt-3 text-h1 font-semibold tracking-tight">{t("voice.title")}</h1>
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
                  disabled={busy || checking}
                  loading={checking}
                  icon={<IcScan size={16} />}
                >
                  {checking ? t("voice.checking") : t("voice.check_voice")}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setReDialog(true)}
                  disabled={busy || checking}
                  icon={<IcRefresh size={16} />}
                >
                  {t("rolebook.extract.button")}
                </Button>
              </div>
            </section>

            {busy ? (
              <ReExtractPanel stepIndex={stepIndex} steps={REEXTRACT_STEPS} t={t} />
            ) : (
              <>
                {/* Voice check */}
                {(checking || lintResult) && (
                  <VoiceCheck
                    conflicts={conflicts}
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
                  value={sections.intro ?? ""}
                  onSave={(text) => saveSection({ intro: text })}
                  t={t}
                />

                {/* List sections */}
                {LIST_SECTIONS.map((s) => (
                  <ListSection
                    key={s.key}
                    config={s}
                    items={(sections[s.key] as string[] | undefined) ?? []}
                    flagged={flaggedBySection[s.key]}
                    onSave={(items) => saveSection({ [s.key]: items })}
                    t={t}
                  />
                ))}

                {/* Examples — typed, with Post/Reply context (Q16) */}
                <ExamplesSection
                  items={sections.examples ?? []}
                  flagged={flaggedExamples}
                  onSave={(examples) => saveSection({ examples })}
                  t={t}
                />

                {/* Transparency */}
                <details className="rounded-lg border border-border bg-surface p-5 shadow-sm">
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
        )}
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
    </section>
  );
}

// ── Section shell ───────────────────────────────────────────────────────────
function SectionShell({
  Icon,
  title,
  desc,
  count,
  editing,
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
        {!editing && (
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
  onSave,
  t,
}: {
  value: string;
  onSave: (text: string) => Promise<void>;
  t: (k: MessageKey) => string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return (
    <SectionShell
      Icon={IcVoice}
      title={t("rolebook.intro.label")}
      desc={t("rolebook.intro.helper")}
      editing={editing}
      onEdit={() => {
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
          className="min-h-[120px] w-full resize-y rounded-md border border-accent bg-surface px-3 py-2.5 text-body leading-relaxed text-text shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-accent)_16%,transparent)] outline-none"
        />
      ) : value ? (
        <p className="whitespace-pre-wrap text-body leading-relaxed text-text">{value}</p>
      ) : (
        <p className="text-small italic text-text-subtle">{t("rolebook.intro.placeholder")}</p>
      )}
    </SectionShell>
  );
}

function ListSection({
  config,
  items,
  flagged,
  onSave,
  t,
}: {
  config: (typeof LIST_SECTIONS)[number];
  items: string[];
  flagged?: Set<string>;
  onSave: (items: string[]) => Promise<void>;
  t: (k: MessageKey) => string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string[]>(items);
  useEffect(() => setDraft(items), [items]);
  const danger = config.danger;
  return (
    <SectionShell
      Icon={config.Icon}
      title={t(config.labelKey)}
      desc={t(config.helperKey)}
      count={items.length}
      editing={editing}
      onEdit={() => {
        setDraft(items.length ? [...items] : [""]);
        setEditing(true);
      }}
      onCancel={() => setEditing(false)}
      onSave={async () => {
        await onSave(draft.map((x) => x.trim()).filter(Boolean));
        setEditing(false);
      }}
      t={t}
    >
      {editing ? (
        <div className="flex flex-col gap-2.5">
          {draft.map((item, i) => (
            <div key={i} className="flex items-start gap-2.5 rounded-md border border-border bg-surface-2 p-2.5">
              {config.multiline ? (
                <textarea
                  value={item}
                  rows={2}
                  onChange={(e) => setDraft((d) => d.map((x, j) => (j === i ? e.target.value : x)))}
                  placeholder={t(config.placeholderKey)}
                  className="min-h-[60px] w-full resize-y rounded-sm border border-border bg-surface px-2.5 py-2 text-small leading-relaxed text-text outline-none focus:border-accent"
                />
              ) : (
                <input
                  value={item}
                  onChange={(e) => setDraft((d) => d.map((x, j) => (j === i ? e.target.value : x)))}
                  placeholder={t(config.placeholderKey)}
                  className="h-9 w-full rounded-sm border border-border bg-surface px-2.5 text-small text-text outline-none focus:border-accent"
                />
              )}
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
            onClick={() => setDraft((d) => [...d, ""])}
            className="inline-flex items-center gap-1.5 self-start rounded-md border border-dashed border-border bg-surface px-3 py-2 text-small font-medium text-text-muted transition-colors hover:border-text/20 hover:bg-surface-2 hover:text-text"
          >
            <IcPlus size={15} /> {t("voice.add_item")}
          </button>
        </div>
      ) : items.length === 0 ? (
        <p className="text-small italic text-text-subtle">{t(config.placeholderKey)}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item, i) => {
            const isFlagged = flagged?.has(item);
            return (
              <div
                key={i}
                className={cn(
                  "rounded-md border px-3 py-2.5 text-small leading-relaxed",
                  isFlagged
                    ? "border-warning/45 bg-warning/[0.07] text-text"
                    : danger
                      ? "border-danger/25 bg-danger/[0.05] text-text"
                      : "border-border bg-surface-2 text-text",
                )}
              >
                {item}
              </div>
            );
          })}
        </div>
      )}
    </SectionShell>
  );
}

// Q16: examples are typed ({id,context,text}) — show + edit the Post/Reply
// context per example, and preserve it (plus the stable id) through an edit.
function ExamplesSection({
  items,
  flagged,
  onSave,
  t,
}: {
  items: RoleBookExample[];
  flagged?: Set<string>;
  onSave: (examples: RoleBookExample[]) => Promise<void>;
  t: (k: MessageKey) => string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<RoleBookExample[]>(items);
  useEffect(() => setDraft(items), [items]);
  const set = (i: number, k: keyof RoleBookExample, v: string) =>
    setDraft((d) => d.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  return (
    <SectionShell
      Icon={IcQuote}
      title={t("rolebook.examples.label")}
      desc={t("rolebook.examples.helper")}
      count={items.length}
      editing={editing}
      onEdit={() => {
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
                  className="min-h-[60px] w-full resize-y rounded-sm border border-border bg-surface px-2.5 py-2 text-small leading-relaxed text-text outline-none focus:border-accent"
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
              key={i}
              className={cn(
                "rounded-md border px-3 py-2.5 text-small leading-relaxed",
                flagged?.has(x.text)
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
  conflicts: LintConflict[];
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
          {conflicts.map((c, i) => (
            <ConflictCard
              key={i}
              conflict={c}
              applying={applyingIdx === i}
              onApply={() => c.fix && onApply(c.fix, i)}
              onDismiss={() => onDismiss(i)}
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
  t,
}: {
  stepIndex: number;
  steps: MessageKey[];
  t: (k: MessageKey) => string;
}) {
  return (
    <section className="flex flex-col items-center rounded-xl border border-accent/40 bg-surface p-8 text-center shadow-md">
      <span className="text-text" style={{ animation: "nibwrite 1.5s ease infinite" }}>
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
                {t(k)}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
