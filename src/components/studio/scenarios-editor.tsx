"use client";

// Scenario editor — CD's hybrid C×B redesign. A 2-column screen:
//   LEFT  — a numbered 6-step track (steps expand when active / collapse to a
//           one-line human summary when done).
//   RIGHT — a LARGE sticky preview («экран»-frame), the hero that convinces.
//
// Translated 1:1 from /tmp/pennedly5/scenario-editor.{css,js,html} to Tailwind +
// the app's semantic tokens. Reuses the existing form building blocks from
// ScenariosParts (WhenSegment, PresetFieldInput, ReplyBlock, MoreSettings,
// PowerUserDisclosure) and the existing run-now / preview data — only the chrome
// and the step/stage shells are new. Same prop interface as the old EditorView.
//
// Toggle model (the spec JS is static — we own the live state here):
//   • steps 1 & 2 are an accordion PAIR — exactly one active at a time;
//   • step 3 «Что Pennedly добавит» is ALWAYS expanded (visible trust step);
//   • steps 4 & 5 are independently collapsible (start collapsed);
//   • step 6 «Готово» is always shown, no chevron/summary.

import { useRef, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { useTranslation, type MessageKey } from "@/lib/i18n";
import {
  IcAlert,
  IcArrowLeft,
  IcBubble,
  IcBubbleQuestion,
  IcCheck,
  IcChevRight,
  IcClock,
  IcEye,
  IcHeart,
  IcLock,
  IcPencil,
  IcPlay,
  IcSparkle,
  IcTrash,
} from "@/components/icons";
import { MoreSettings } from "./scenarios-screens";
import {
  Field,
  PowerUserDisclosure,
  PresetFieldInput,
  PromoHelper,
  ReplyBlock,
  TEXTAREA,
  WhenSegment,
  WhenTimeJitter,
  eventKindOf,
  type PreviewState,
  type WhenMode,
} from "./ScenariosParts";
import type { FormState, visibleFields } from "./scenarios-form";
import type {
  ScenarioPreview as ScenarioPreviewT,
  ScenarioRunNow,
} from "@/lib/types";

type T = (k: MessageKey) => string;

// ── audience → human phrase for the step-2 reply summary ──
function audPhrase(t: T, a: string): string {
  if (a === "fans") return t("scenarios.aud_phrase.fans");
  if (a === "questions") return t("scenarios.aud_phrase.questions");
  return t("scenarios.aud_phrase.all");
}

// ════════════════════════════════════════════════════════════════════════════
//  STEP — one rail (number badge + connector) + a card (head + body/summary)
// ════════════════════════════════════════════════════════════════════════════
function Step({
  n,
  title,
  titleOpt,
  open,
  done,
  optional,
  finish,
  last,
  summary,
  onToggle,
  children,
}: {
  n: number;
  title: string;
  titleOpt?: string;
  open: boolean;
  done?: boolean; // collapsed → green check badge + summary
  optional?: boolean; // dimmed number badge
  finish?: boolean; // «Готово» — no chevron/summary, always open
  last?: boolean; // no connector line below
  summary?: ReactNode;
  onToggle?: () => void;
  children: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[34px_minmax(0,1fr)] gap-[17px]">
      {/* rail: number badge + connector line to the next step */}
      <div className="flex flex-col items-center">
        <span
          className={cn(
            "grid h-8 w-8 shrink-0 place-items-center rounded-full border font-mono text-[14px] font-semibold",
            done
              ? "border-success/28 bg-success/12 text-success"
              : optional
                ? "border-border bg-surface-2 text-text-subtle"
                : "border-accent/28 bg-accent/12 text-accent",
          )}
        >
          {done ? <IcCheck size={16} /> : n}
        </span>
        {!last && <span className="my-2 min-h-[14px] w-0.5 flex-1 rounded bg-border" />}
      </div>

      {/* card */}
      <div
        className={cn(
          "mb-3.5 min-w-0 overflow-hidden rounded-lg border bg-surface shadow-sm",
          open ? "border-accent/40 shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-accent)_26%,transparent)]" : "border-border",
        )}
      >
        {finish ? (
          <div className="flex w-full items-center gap-3 px-[18px] py-[15px] text-left text-text">
            <div className="min-w-0 flex-1">
              <div className="text-[15.5px] font-semibold tracking-[-0.006em]">{title}</div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={open}
            className="flex w-full items-center gap-3 px-[18px] py-[15px] text-left text-text transition-colors hover:bg-surface-2"
          >
            <div className="min-w-0 flex-1">
              <div className="text-[15.5px] font-semibold tracking-[-0.006em]">
                {title}
                {titleOpt && <span className="text-[0.86em] font-normal text-text-subtle"> {titleOpt}</span>}
              </div>
              {!open && summary != null && (
                <div className="mt-[3px] text-small leading-[1.45] text-text-muted [text-wrap:pretty]">{summary}</div>
              )}
            </div>
            <IcChevRight
              size={16}
              className={cn("shrink-0 text-text-subtle transition-transform", open && "rotate-90")}
            />
          </button>
        )}
        {open && (
          <div
            className={cn(
              "flex flex-col border-t border-border px-[18px] pb-[19px] pt-4",
              finish ? "gap-3.5" : "gap-4",
            )}
          >
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

// «v» — a bolded value inside a human summary line.
function V({ children }: { children: ReactNode }) {
  return <span className="font-semibold text-text">{children}</span>;
}

// ════════════════════════════════════════════════════════════════════════════
//  STEP 1 — reply read-only «when» (honest: polls every 15 min)
// ════════════════════════════════════════════════════════════════════════════
function WhenReplyCard() {
  const { t } = useTranslation();
  return (
    <div className="flex items-start gap-3 rounded-md border border-border bg-surface-2 px-[15px] py-[13px]">
      <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-md border border-success/26 bg-success/12 text-success">
        <IcClock size={17} />
      </span>
      <span
        className="text-small leading-[1.5] text-text [&_b]:font-semibold"
        dangerouslySetInnerHTML={{ __html: t("scenarios.ed.when_reply") }}
      />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  STEP 3 — read-only baked rules (the visible trust step)
// ════════════════════════════════════════════════════════════════════════════
function InlineRules({ rules }: { rules: string[] }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col">
      <p className="text-small leading-relaxed text-text-muted [&_b]:font-semibold [&_b]:text-text" dangerouslySetInnerHTML={{ __html: t("scenarios.ed.rules_intro") }} />
      <ul className="mt-3 flex flex-col gap-2">
        {rules.map((r, i) => (
          <li key={i} className="flex items-start gap-2 text-small text-text-muted">
            <IcCheck size={15} className="mt-0.5 shrink-0 text-success" />
            <span>{r}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3.5 inline-flex items-center gap-1.5 border-t border-border pt-3 text-caption text-text-subtle">
        <IcLock size={12} className="shrink-0" /> {t("scenarios.ed.rules_foot")}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  RIGHT STAGE — the large sticky preview (the hero)
// ════════════════════════════════════════════════════════════════════════════
function StageAvatar({ initials, size = 34 }: { initials: string; size?: number }) {
  return (
    <span
      className="inline-grid shrink-0 place-items-center rounded-full border border-border bg-surface-2 font-semibold text-text-muted"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
    >
      {initials}
    </span>
  );
}

// Enlarged post mock (per .stage-frame .mockpost — 19/22 padding, 15.5px text).
function StagePost({
  initials,
  name,
  handle,
  time,
  text,
  stats,
}: {
  initials: string;
  name: string;
  handle: string;
  time: string;
  text: string;
  stats: [string, string, string];
}) {
  return (
    <div className="px-[22px] py-[19px]">
      <div className="mb-[13px] flex items-center gap-2.5">
        <StageAvatar initials={initials} />
        <div className="leading-tight">
          <p className="text-small font-semibold text-text">{name}</p>
          <p className="text-caption text-text-subtle">{handle}</p>
        </div>
        <span className="ml-auto text-caption text-text-subtle">{time}</span>
      </div>
      <p className="text-[15.5px] leading-[1.65] text-text [text-wrap:pretty]">{text}</p>
      <div className="mt-[15px] flex gap-5 text-caption text-text-subtle">
        <span className="inline-flex items-center gap-1.5"><IcEye size={14} /> {stats[0]}</span>
        <span className="inline-flex items-center gap-1.5"><IcHeart size={14} /> {stats[1]}</span>
        <span className="inline-flex items-center gap-1.5"><IcBubble size={14} /> {stats[2]}</span>
      </div>
    </div>
  );
}

// Enlarged reply thread: parent post → comment → Pennedly reply (accent tag).
function StageReplyThread({
  initials,
  name,
  handle,
  parent,
  commentWho,
  commentText,
  botReply,
}: {
  initials: string;
  name: string;
  handle: string;
  parent: string;
  commentWho: string;
  commentText: string;
  botReply: string;
}) {
  const { t } = useTranslation();
  return (
    <>
      <div className="border-b border-border px-[22px] py-[19px]">
        <div className="mb-[13px] flex items-center gap-2.5">
          <StageAvatar initials={initials} />
          <div className="leading-tight">
            <p className="text-small font-semibold text-text">{name}</p>
            <p className="text-caption text-text-subtle">{handle}</p>
          </div>
        </div>
        <p className="text-[15.5px] leading-[1.65] text-text [text-wrap:pretty]">{parent}</p>
      </div>
      <div className="px-[22px] py-[17px]">
        <div className="flex gap-2.5">
          <StageAvatar initials={commentWho.slice(0, 1)} size={30} />
          <div className="min-w-0">
            <p className="text-caption font-semibold text-text-muted">{commentWho}</p>
            <p className="mt-0.5 text-small text-text-muted [text-wrap:pretty]">{commentText}</p>
          </div>
        </div>
        <div className="relative mt-2.5 flex gap-2.5 pl-3 before:absolute before:bottom-1.5 before:left-[3px] before:top-0.5 before:w-0.5 before:rounded before:bg-border">
          <StageAvatar initials={initials} size={30} />
          <div className="min-w-0">
            <p className="mb-0.5 flex flex-wrap items-center gap-1.5 text-caption font-semibold text-text">
              {name}
              <span className="inline-flex items-center gap-1 font-medium text-accent">
                <IcBubble size={11} /> {t("scenarios.ed.reply_tag")}
              </span>
            </p>
            <p className="text-[14.5px] leading-[1.6] text-text [text-wrap:pretty]">{botReply}</p>
          </div>
        </div>
      </div>
    </>
  );
}

function Stage({
  reply,
  preview,
  whenFires,
  canRunNow,
  running,
  runResult,
  onRunNow,
  handle,
}: {
  reply: boolean;
  preview: ScenarioPreviewT | null;
  whenFires?: string;
  canRunNow?: boolean;
  running?: boolean;
  runResult?: ScenarioRunNow | null;
  onRunNow?: () => void;
  handle: string;
}) {
  const { t } = useTranslation();
  // neutral demo creator for the mock (matches the rest of the redesign)
  const name = "Алекс";
  const initials = "А";
  const samplePost = preview?.sample_post?.trim()
    ? preview.sample_post
    : "Вопрос на сегодня: что вы сегодня доведёте до конца — даже если получится неидеально? Напишите одним словом 👇";
  return (
    <aside className="flex flex-col gap-[11px] min-[900px]:sticky min-[900px]:top-[18px] min-[900px]:self-start">
      <div className="inline-flex items-center gap-1.5 text-caption font-semibold uppercase tracking-[0.06em] text-text-subtle">
        <IcEye size={13} /> {t("scenarios.ed.stage_cap")}
      </div>

      {/* the framed «screen» */}
      <div className="overflow-hidden rounded-[28px] border border-border bg-surface shadow-lg">
        {/* bar */}
        <div className="flex items-center gap-2.5 border-b border-border bg-surface-2 px-[18px] py-3">
          <span className="h-[9px] w-[9px] shrink-0 rounded-full bg-accent/55" />
          <span className="text-small font-semibold text-text-muted">
            {reply ? t("scenarios.ed.stage_bar_reply") : t("scenarios.ed.stage_bar_post")}
          </span>
          <span className="ml-auto inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.04em] text-text-subtle">
            <span className="h-1.5 w-1.5 rounded-full bg-success shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-success)_20%,transparent)]" />
            {t("scenarios.ed.stage_live")}
          </span>
        </div>

        {/* mock */}
        {reply ? (
          <StageReplyThread
            initials={initials}
            name={name}
            handle={handle}
            parent={t("scenarios.ed.parent_post")}
            commentWho={t("scenarios.ed.comment_who")}
            commentText={t("scenarios.ed.comment_text")}
            botReply={t("scenarios.ed.bot_reply")}
          />
        ) : (
          <StagePost
            initials={initials}
            name={name}
            handle={handle}
            time="9:00"
            text={samplePost}
            stats={["1,2K", "84", "47"]}
          />
        )}

        {/* foot — honesty lines + run-now */}
        <div className="flex flex-col gap-2.5 border-t border-border bg-surface px-[18px] py-[15px]">
          <p className="flex items-start gap-2 text-caption leading-[1.5] text-text-subtle [&_b]:font-semibold [&_b]:text-text-muted">
            <IcSparkle size={13} className="mt-0.5 shrink-0 opacity-85" />
            <span dangerouslySetInnerHTML={{ __html: reply ? t("scenarios.ed.stage_voice_reply") : t("scenarios.ed.stage_voice_post").replace("{n}", "8") }} />
          </p>
          <p className="flex items-start gap-2 text-caption leading-[1.5] text-text-subtle [&_b]:font-semibold [&_b]:text-text-muted">
            <IcClock size={13} className="mt-0.5 shrink-0 opacity-85" />
            <span>
              {t("scenarios.when_fires").replace(
                "{when}",
                reply ? t("scenarios.ed.stage_fires_reply") : whenFires ?? t("scenarios.fires.morning"),
              )}
            </span>
          </p>
          {onRunNow && (
            <div className="mt-0.5 flex flex-wrap items-center gap-2.5 border-t border-border pt-3">
              <Button size="sm" variant="secondary" onClick={onRunNow} loading={running} disabled={!canRunNow} icon={<IcPlay size={14} />}>
                {t("scenarios.run_now")}
              </Button>
              <span className="flex-1 basis-[130px] text-caption leading-[1.4] text-text-subtle">{t("scenarios.ed.run_note")}</span>
            </div>
          )}
        </div>
      </div>

      {/* disclaimer under the frame */}
      <p className="mt-0.5 flex items-start gap-2 px-1 text-caption leading-[1.5] text-text-subtle">
        <IcAlert size={13} className="mt-0.5 shrink-0 opacity-80" />
        <span>{t("scenarios.ed.stage_disc")}</span>
      </p>

      {/* run result — draft created banner + the draft */}
      {runResult && (
        <div className="overflow-hidden rounded-lg border border-success/30 bg-success/[0.06]">
          <div className="flex items-start gap-2 border-b border-success/20 px-3.5 py-2.5">
            <IcCheck size={15} className="mt-0.5 shrink-0 text-success" />
            <p className="text-caption leading-relaxed text-text-muted">
              <span className="font-semibold text-text">{t("scenarios.draft_created")}</span> {t("scenarios.draft_created_sub")}
            </p>
          </div>
          {runResult.kind === "reply" && runResult.replied_to && (
            <div className="border-b border-success/20 bg-surface px-3.5 py-2.5">
              <p className="mb-1 font-mono text-[10px] uppercase tracking-wide text-text-subtle">{t("scenarios.replied_to")}</p>
              <p className="text-small leading-relaxed text-text-muted">{runResult.replied_to}</p>
            </div>
          )}
          <div className="bg-surface px-3.5 py-2.5">
            <p className="text-small leading-relaxed text-text">{runResult.text}</p>
          </div>
        </div>
      )}
    </aside>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  STEP EDITOR — same prop interface as the old EditorView
// ════════════════════════════════════════════════════════════════════════════
export function StepEditor({
  t,
  form,
  handle,
  update,
  setField,
  isExisting,
  nameErr,
  fieldErrs,
  askErr,
  vFields,
  isReplyPolicy,
  isReactive,
  bakedRules,
  preview,
  whenFires,
  running,
  runResult,
  onRunNow,
  canRunNow,
  saving,
  saveErr,
  confirmInline,
  onBack,
  onSave,
  onSaveOn,
  onDeleteDesktop,
  onDeleteMobile,
  onCancelInline,
  onConfirmInline,
  deleting,
  onPowerToggle,
}: {
  t: T;
  form: FormState;
  handle: string;
  update: (patch: Partial<FormState>) => void;
  setField: (key: string, v: string) => void;
  isExisting: boolean;
  nameErr: boolean;
  fieldErrs: Record<string, boolean>;
  askErr: boolean;
  vFields: ReturnType<typeof visibleFields>;
  producesReplies: boolean;
  isReplyPolicy: boolean;
  isReactive: boolean;
  bakedRules: string[];
  bakedOpen: boolean;
  onBakedToggle: () => void;
  powerOpen: boolean;
  onPowerToggle: () => void;
  previewState: PreviewState;
  preview: ScenarioPreviewT | null;
  whenFires: string;
  running: boolean;
  runResult: ScenarioRunNow | null;
  onRunNow: () => void;
  canRunNow: boolean;
  saving: boolean;
  saveErr: boolean;
  confirmInline: boolean;
  onBack: () => void;
  onSave: () => void;
  onSaveOn: () => void;
  onDeleteDesktop: () => void;
  onDeleteMobile: () => void;
  onCancelInline: () => void;
  onConfirmInline: () => void;
  deleting: boolean;
}) {
  const promoMode = form.helperOn || form.preset?.id === "promo";
  const reply = isReplyPolicy || promoMode;
  const eventKind = form.preset ? eventKindOf(form.preset.trigger_cfg) : "";

  // ── step toggle model ──
  // steps 1 & 2 are an accordion pair: which one is active (the other collapses).
  const [activePair, setActivePair] = useState<1 | 2>(2);
  const [more4Open, setMore4Open] = useState(false);
  const [adv5Open, setAdv5Open] = useState(false);

  // ── rename: contentEditable h1 toggled by the pencil, commit on blur ──
  const [renaming, setRenaming] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);

  // ── step summaries (human one-liners) ──
  const topicVal = vFields[0] ? (form.fields[vFields[0].key] ?? "").trim() : "";
  const sum1: ReactNode = reply ? (
    t("scenarios.ed.sum1_reply")
  ) : (
    <span dangerouslySetInnerHTML={{ __html: whenFires }} />
  );
  const sum2: ReactNode = reply ? (
    <>
      {t("scenarios.ed.sum2_reply").split("{audience}")[0]}
      <V>{audPhrase(t, form.audience)}</V>
      {t("scenarios.ed.sum2_reply").split("{audience}")[1]}
    </>
  ) : (
    <>
      {t("scenarios.ed.sum2_post").split("{topic}")[0]}
      <V>{topicVal ? `«${topicVal}»` : t("scenarios.ed.sum2_post_auto")}</V>
      {t("scenarios.ed.sum2_post").split("{topic}")[1]}
    </>
  );

  return (
    <div className="mx-auto max-w-[1040px]">
      {/* ── topbar ── */}
      <div className="mb-[26px] flex flex-col gap-3.5">
        <button onClick={onBack} className="inline-flex items-center gap-1.5 self-start rounded-sm py-1 pl-1.5 pr-2.5 text-small font-medium text-text-muted transition-colors hover:bg-surface-2 hover:text-text">
          <IcArrowLeft size={16} /> {t("scenarios.back")}
        </button>
        <div className="flex flex-wrap items-center justify-between gap-3.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <h1
              ref={titleRef}
              className="m-0 min-w-0 text-[26px] font-semibold tracking-[-0.015em] text-text outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-accent/40"
              contentEditable={renaming}
              suppressContentEditableWarning
              onBlur={(e) => {
                const next = (e.currentTarget.textContent ?? "").trim();
                if (next) update({ name: next });
                else e.currentTarget.textContent = form.name;
                setRenaming(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  e.currentTarget.blur();
                }
              }}
            >
              {form.name}
            </h1>
            <button
              type="button"
              aria-label={t("scenarios.ed.rename")}
              onClick={() => {
                setRenaming(true);
                requestAnimationFrame(() => {
                  const h1 = titleRef.current;
                  if (h1) {
                    h1.focus();
                    const sel = window.getSelection();
                    const range = document.createRange();
                    range.selectNodeContents(h1);
                    range.collapse(false);
                    sel?.removeAllRanges();
                    sel?.addRange(range);
                  }
                });
              }}
              className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-sm border border-border bg-surface text-text-subtle transition-colors hover:bg-surface-2 hover:text-text"
            >
              <IcPencil size={13} />
            </button>
          </div>
          {/* status pill — «Выключен» (off look) */}
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-2 px-3 py-1.5 text-small font-semibold text-text-subtle">
            <span className="h-2 w-2 rounded-full bg-ink-400" />
            {t("scenarios.status_off")}
          </span>
        </div>
        {/* kind plaque + hint */}
        <div className="-mt-0.5 flex flex-wrap items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/22 bg-accent/[0.08] py-1 pl-2.5 pr-[11px] text-caption font-semibold text-text-muted">
            {reply ? <IcBubble size={13} className="text-accent" /> : <IcBubbleQuestion size={13} className="text-accent" />}
            {reply ? t("scenarios.ed.kind_reply") : t("scenarios.ed.kind_post")}
          </span>
          <span className="text-caption text-text-subtle">{t("scenarios.ed.name_hint").replace(/<\/?b>/g, "")}</span>
        </div>
      </div>

      {/* ── hybrid grid ── */}
      <div className="grid grid-cols-1 items-start gap-[26px] min-[900px]:grid-cols-[minmax(0,1fr)_416px] min-[900px]:gap-[34px]">
        {/* LEFT — step track */}
        <div className="flex min-w-0 flex-col">
          {/* name error surfaces here (the title is the name field) */}
          {nameErr && (
            <p className="mb-3 inline-flex items-center gap-1.5 text-caption text-danger">
              <IcAlert size={13} /> {t("scenarios.err_required")}
            </p>
          )}

          {/* STEP 1 — when */}
          <Step
            n={1}
            title={t("scenarios.ed.s1_title")}
            open={activePair === 1}
            done={activePair !== 1}
            summary={sum1}
            onToggle={() => setActivePair(1)}
          >
            {reply ? (
              <WhenReplyCard />
            ) : (
              <>
                <WhenSegment
                  value={form.when}
                  nDays={form.nDays}
                  weekday={form.weekday}
                  dateFrom={form.dateFrom}
                  dateTo={form.dateTo}
                  threshold={form.threshold}
                  locked={isReactive}
                  eventKind={eventKind}
                  onMode={(m: WhenMode) => update({ when: m })}
                  onNDays={(n) => update({ nDays: n })}
                  onWeekday={(d) => update({ weekday: d })}
                  onDate={(which, v) => update(which === "from" ? { dateFrom: v } : { dateTo: v })}
                  onThreshold={(v) => update({ threshold: v })}
                />
                {/* Время + Разброс — POST routines, cadence modes only (not «по событию»). */}
                {form.when !== "event" && (
                  <WhenTimeJitter
                    hour={form.hour}
                    jitter={form.jitter}
                    onHour={(h) => update({ hour: h })}
                    onJitter={(j) => update({ jitter: j })}
                  />
                )}
              </>
            )}
          </Step>

          {/* STEP 2 — what you set */}
          <Step
            n={2}
            title={t("scenarios.ed.s2_title")}
            open={activePair === 2}
            done={activePair !== 2}
            summary={sum2}
            onToggle={() => setActivePair(2)}
          >
            {promoMode ? (
              <>
                <PromoHelper on={form.helperOn} promo={form.promo} askErr={askErr} onToggle={(on) => update({ helperOn: on })} onChange={(p) => update({ promo: p })} />
                <Field label={t("scenarios.sec.reply")} hint={t("scenarios.f.reply_hint")}>
                  <textarea rows={3} className={TEXTAREA} value={form.replyInstruction} onChange={(e) => update({ replyInstruction: e.target.value })} placeholder={t("scenarios.f.reply_ph")} />
                </Field>
              </>
            ) : isReplyPolicy ? (
              <ReplyBlock
                audience={form.audience}
                onAudience={(a) => update({ audience: a })}
                replyInstruction={form.replyInstruction}
                onReplyInstruction={(v) => update({ replyInstruction: v })}
              />
            ) : vFields.length > 0 ? (
              <div className="flex flex-col gap-4">
                {vFields.map((f) => (
                  <PresetFieldInput key={f.key} field={f} value={form.fields[f.key] ?? ""} error={fieldErrs[f.key]} onChange={(v) => setField(f.key, v)} />
                ))}
              </div>
            ) : (
              // from-scratch / no preset fields → a free topic-style instruction
              <Field label={t("scenarios.f.instruction")} hint={t("scenarios.f.instruction_hint")}>
                <textarea
                  rows={4}
                  className={cn(TEXTAREA, "min-h-[110px]")}
                  value={form.instruction}
                  onChange={(e) => update({ instruction: e.target.value })}
                  placeholder={t("scenarios.f.instruction_ph")}
                />
              </Field>
            )}
          </Step>

          {/* STEP 3 — what Pennedly adds (ALWAYS open, read-only) */}
          <Step n={3} title={t("scenarios.ed.s3_title")} open>
            {bakedRules.length > 0 ? (
              <InlineRules rules={bakedRules} />
            ) : (
              <p className="text-small leading-relaxed text-text-muted">{t("scenarios.baked_foot")}</p>
            )}
          </Step>

          {/* STEP 4 — more settings (collapsible) */}
          <Step
            n={4}
            title={t("scenarios.ed.s4_title")}
            titleOpt={t("scenarios.ed.optional")}
            optional
            open={more4Open}
            done={false}
            summary={reply ? t("scenarios.ed.sum4_reply") : t("scenarios.ed.sum4_post")}
            onToggle={() => setMore4Open((o) => !o)}
          >
            <MoreSettings isReply={reply} embedded />
          </Step>

          {/* STEP 5 — power users (collapsible) */}
          <Step
            n={5}
            title={t("scenarios.ed.s5_title")}
            titleOpt={t("scenarios.ed.optional")}
            optional
            open={adv5Open}
            done={false}
            summary={t("scenarios.ed.sum5")}
            onToggle={() => setAdv5Open((o) => !o)}
          >
            <PowerUserDisclosure
              open
              embedded
              onToggle={onPowerToggle}
              instruction={form.instruction}
              onInstruction={(v) => update({ instruction: v })}
            />
          </Step>

          {/* STEP 6 — done (always open, no chevron) */}
          <Step n={6} title={t("scenarios.ed.s6_title")} finish open last>
            {saveErr && (
              <div className="flex items-start gap-3 rounded-lg border border-danger/30 bg-danger/[0.07] p-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-danger/12 text-danger">
                  <IcTrash size={18} className="rotate-45" />
                </span>
                <div className="min-w-0">
                  <p className="text-small font-semibold text-text">{t("scenarios.save_error")}</p>
                  <p className="mt-0.5 text-caption leading-relaxed text-text-muted">{t("scenarios.save_error_sub")}</p>
                </div>
              </div>
            )}
            <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">
              <Button variant="secondary" onClick={onSave} loading={saving} className="max-sm:w-full">
                {t("scenarios.save")}
              </Button>
              <Button variant="primary" onClick={onSaveOn} loading={saving} icon={<IcCheck size={15} />} className="max-sm:w-full">
                {t("scenarios.save_on")}
              </Button>
              {isExisting && (
                <>
                  <button onClick={onDeleteDesktop} className="inline-flex items-center gap-1.5 text-small font-medium text-text-muted hover:text-danger max-sm:hidden sm:ml-auto">
                    <IcTrash size={15} /> {t("scenarios.delete")}
                  </button>
                  <button onClick={onDeleteMobile} className="inline-flex items-center justify-center gap-1.5 py-2 text-small font-medium text-danger sm:hidden">
                    <IcTrash size={15} /> {t("scenarios.delete")}
                  </button>
                </>
              )}
            </div>
            {confirmInline && (
              <div className="flex flex-wrap items-center gap-2.5 border-t border-border pt-3.5 max-sm:hidden">
                <span className="flex-1 text-small font-medium text-text">{t("scenarios.delete_confirm_inline")}</span>
                <Button size="sm" variant="ghost" onClick={onCancelInline} disabled={deleting}>
                  {t("common.cancel")}
                </Button>
                <Button size="sm" variant="danger" loading={deleting} onClick={onConfirmInline}>
                  {t("scenarios.delete")}
                </Button>
              </div>
            )}
            <p className="flex items-start gap-2 text-small leading-[1.5] text-text-subtle [&_b]:font-semibold [&_b]:text-text-muted">
              <IcAlert size={13} className="mt-0.5 shrink-0" />
              <span dangerouslySetInnerHTML={{ __html: t("scenarios.ed.enable_note") }} />
            </p>
          </Step>
        </div>

        {/* RIGHT — large sticky preview */}
        <Stage
          reply={reply}
          preview={preview}
          whenFires={whenFires}
          canRunNow={canRunNow}
          running={running}
          runResult={runResult}
          onRunNow={onRunNow}
          handle={handle}
        />
      </div>
    </div>
  );
}
