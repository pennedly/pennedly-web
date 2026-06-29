"use client";

// Scenario editor — CD's «карточка-рецепт» redesign (Wave 1). A two-column
// screen (max-w 1000px, grid minmax(0,1fr) 392px, sticky right aside, 1-col
// ≤900px):
//   LEFT  — the recipe: one readable SENTENCE with editable «slots». Tapping a
//           slot opens an inline drawer in place under the prose (only one open).
//           Below it: Layer 2 «Настроить точнее» (accordion) + Layer 3 stub.
//   RIGHT — a framed live STAGE (post mock / reply thread), the «честная строка»
//           invoice, «Следующие 3 запуска» (computed), «Прогнать сейчас» (draft).
//
// Ported 1:1 from design-export/PennedlyDesign/recipe-editor/{recipe-editor.js,
// recipe-editor.css}. SAME prop interface as the previous StepEditor (the page
// that hosts it is unchanged). Wave-1 cut hides the not-ready cadence/condition
// modes (decision б) — see scenarios-recipe.tsx.

import { useRef, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { useTranslation, type MessageKey } from "@/lib/i18n";
import {
  IcAlert,
  IcArrowLeft,
  IcBolt,
  IcBubble,
  IcBubbleQuestion,
  IcCheck,
  IcChevRight,
  IcClock,
  IcEye,
  IcHeart,
  IcInfo,
  IcLink,
  IcPencil,
  IcPlay,
  IcRepeat,
  IcShieldHouse,
  IcSliders,
  IcSparkle,
  IcTrash,
} from "@/components/icons";
import { MoreSettings } from "./scenarios-screens";
import { type PreviewState } from "./ScenariosParts";
import {
  BigTextModal,
  type BigTextField,
  BoostAttachSection,
  BoostCommentBody,
  BoostTargetBody,
  BoostTargetLock,
  BoostTriggerBody,
  Drawer,
  HowBody,
  IfBody,
  type L3Inherited,
  Layer3Override,
  LockSlot,
  type OpenSlot,
  SLOT_ICON,
  Slot,
  ToneBody,
  WhatPostBody,
  WhenMentionBody,
  WhenPostBody,
  WhenReplyBody,
  WhoBody,
} from "./scenarios-recipe";
import { BOOST_DEFAULT_THRESHOLD, type FormState, interpolate, MONTHS, type visibleFields } from "./scenarios-form";
import type { ScenarioPreview as ScenarioPreviewT, ScenarioRunNow } from "@/lib/types";

type T = (k: MessageKey) => string;

// ── boost → human phrases for the boost sentence slots ──
// «за любым моим постом» / «за постами сценария» / «за конкретным постом» — the
// target slot phrase (entry A only).
function boostTargetPhrase(t: T, form: FormState): string {
  switch (form.boostTargetType) {
    case "scenario":
      return t("scenarios.bo.tphrase.scenario");
    case "post":
      return t("scenarios.bo.tphrase.post");
    default:
      return t("scenarios.bo.tphrase.all");
  }
}
// «5 000 просмотров» / «200 лайков» / «50 комментариев» — the metric+threshold
// slot phrase. A blank threshold reads as the metric's default.
function boostMetricPhrase(t: T, form: FormState): string {
  const n = form.boostThreshold.trim() && Number(form.boostThreshold) >= 1 ? Math.floor(Number(form.boostThreshold)) : BOOST_DEFAULT_THRESHOLD[form.boostMetric];
  const unit =
    form.boostMetric === "views"
      ? t("scenarios.bo.unit_views")
      : form.boostMetric === "likes"
        ? t("scenarios.bo.unit_likes")
        : t("scenarios.bo.unit_comments");
  return `${n.toLocaleString()} ${unit}`;
}

// ── audience → human phrase for the reply sentence slot ──
function audPhrase(t: T, a: string): string {
  if (a === "fans") return t("scenarios.aud_phrase.fans");
  if (a === "questions") return t("scenarios.aud_phrase.questions");
  if (a === "custom") return t("scenarios.aud_phrase.custom");
  return t("scenarios.aud_phrase.all");
}

// «9:00, 14:00 и 19:00» — the scenario's post times as a human phrase. One slot
// reads as the single time («9:00»); 2+ slots are listed, the last joined by «и».
// Reads `form.hours` (the multi-slot list) when it holds 2+, else `form.hour`.
function timesPhrase(t: T, form: FormState): string {
  const list = [...new Set(form.hours.filter((h) => h >= 0 && h <= 23))].sort((a, b) => a - b);
  if (list.length < 2) return form.hour;
  const labels = list.map((h) => `${h}:00`);
  return `${labels.slice(0, -1).join(", ")} ${t("common.and")} ${labels[labels.length - 1]}`;
}

// ── КОГДА → a short human phrase for the sentence slot ──
function whenPhrase(t: T, form: FormState): string {
  const time = timesPhrase(t, form);
  switch (form.when) {
    case "every_n_days":
      return t("scenarios.rc.sent.every_n").replace("{n}", String(form.nDays)).replace("{time}", time);
    case "weekly":
      return t("scenarios.rc.sent.weekly").replace("{days}", weekdaysPhrase(t, form)).replace("{time}", time);
    case "monthly":
      return t("scenarios.rc.sent.monthly").replace("{days}", monthlyDaysPhrase(t, form)).replace("{time}", time);
    case "yearly":
      return t("scenarios.rc.sent.yearly").replace("{date}", yearlyFirstDatePhrase(t, form));
    case "date_range":
      return t("scenarios.rc.sent.period").replace("{time}", time);
    case "event":
      return form.eventKind === "on_follower_milestone" ? t("scenarios.rc.sent.event_followers") : t("scenarios.rc.sent.event_views");
    case "daily":
    default:
      return t("scenarios.rc.sent.daily").replace("{time}", time);
  }
}

// «1, 15 и 31» — the selected days-of-month, plus «последний» when «Последний
// день месяца» is on. Empty selection falls back to «последний» / a dash.
function monthlyDaysPhrase(t: T, form: FormState): string {
  const parts = [...form.monthlyDays].sort((a, b) => a - b).map(String);
  if (form.monthlyLastDay) parts.push(t("scenarios.rc.sent.monthly_last"));
  if (parts.length === 0) return "—";
  if (parts.length === 1) return parts[0];
  return `${parts.slice(0, -1).join(", ")} ${t("common.and")} ${parts[parts.length - 1]}`;
}
// «1 января» — the first yearly anchor in «day месяц» genitive form (the design's
// summary uses the first date; the drawer lists them all).
function yearlyFirstDatePhrase(t: T, form: FormState): string {
  const first = form.yearlyDates[0];
  if (!first) return "—";
  return `${first.day} ${t(MONTHS[first.month] ?? MONTHS[0])}`;
}
const WD_FULL: MessageKey[] = [
  "scenarios.rc.wdfull.mon",
  "scenarios.rc.wdfull.tue",
  "scenarios.rc.wdfull.wed",
  "scenarios.rc.wdfull.thu",
  "scenarios.rc.wdfull.fri",
  "scenarios.rc.wdfull.sat",
  "scenarios.rc.wdfull.sun",
];
// Short Пн…Вс labels for the multi-weekday summary phrase.
const WD_SHORT: MessageKey[] = [
  "scenarios.wd.mon",
  "scenarios.wd.tue",
  "scenarios.wd.wed",
  "scenarios.wd.thu",
  "scenarios.wd.fri",
  "scenarios.wd.sat",
  "scenarios.wd.sun",
];
// «по будням» / «по выходным» / «Пн, Ср и Пт» — the selected weekdays as a short
// human phrase for the sentence + run rows. Mon–Fri and Sat–Sun get the natural
// «будням»/«выходным» wording; any other set lists the short day labels.
function weekdaysPhrase(t: T, form: FormState): string {
  const days = [...new Set(form.weekdays)].filter((d) => d >= 0 && d <= 6).sort((a, b) => a - b);
  if (days.length === 0) return t(WD_FULL[0]);
  if (days.length === 5 && days.every((d, i) => d === i)) return t("scenarios.rc.sent.weekdays_workdays");
  if (days.length === 2 && days[0] === 5 && days[1] === 6) return t("scenarios.rc.sent.weekdays_weekend");
  if (days.length === 7) return t("scenarios.rc.sent.weekdays_all");
  const labels = days.map((d) => t(WD_SHORT[d] ?? WD_SHORT[0]));
  if (labels.length === 1) return labels[0];
  return `${labels.slice(0, -1).join(", ")} ${t("common.and")} ${labels[labels.length - 1]}`;
}

// ════════════════════════════════════════════════════════════════════════════
//  RIGHT STAGE — framed live preview (post mock / reply thread)
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

function StagePost({
  initials,
  name,
  handle,
  text,
}: {
  initials: string;
  name: string;
  handle: string;
  text: string;
}) {
  return (
    <div className="px-5 py-[18px]">
      <div className="mb-[13px] flex items-center gap-2.5">
        <StageAvatar initials={initials} />
        <div className="leading-tight">
          <p className="text-small font-semibold text-text">{name}</p>
          <p className="text-caption text-text-subtle">{handle}</p>
        </div>
        <span className="ml-auto text-caption text-text-subtle">9:00</span>
      </div>
      <p className="text-[15px] leading-[1.65] text-text [text-wrap:pretty]">{text}</p>
      <div className="mt-[15px] flex gap-5 text-caption text-text-subtle">
        <span className="inline-flex items-center gap-1.5"><IcEye size={13} /> 1,2K</span>
        <span className="inline-flex items-center gap-1.5"><IcHeart size={13} /> 84</span>
        <span className="inline-flex items-center gap-1.5"><IcBubble size={13} /> 47</span>
      </div>
    </div>
  );
}

function StageReplyThread({ initials, name, handle, mention }: { initials: string; name: string; handle: string; mention?: boolean }) {
  const { t } = useTranslation();
  // mention: the parent is SOMEONE ELSE's post that tags @you (not your own post
  // with a comment under it). The «who» line is the mentioner; the «text» is the
  // post that contains the @mention.
  const parentName = mention ? t("scenarios.ed.mention_who") : name;
  const parentHandle = mention ? t("scenarios.ed.mention_handle") : handle;
  const parentInitials = mention ? t("scenarios.ed.mention_who").slice(0, 1) : initials;
  return (
    <>
      <div className="border-b border-border px-5 py-[18px]">
        <div className="mb-[13px] flex items-center gap-2.5">
          <StageAvatar initials={parentInitials} />
          <div className="leading-tight">
            <p className="text-small font-semibold text-text">{parentName}</p>
            <p className="text-caption text-text-subtle">{parentHandle}</p>
          </div>
          <span className="ml-auto text-caption text-text-subtle">{t("scenarios.rc.stage_yesterday")}</span>
        </div>
        <p className="text-[15px] leading-[1.65] text-text [text-wrap:pretty]">{mention ? t("scenarios.ed.mention_post") : t("scenarios.ed.parent_post")}</p>
      </div>
      <div className="px-5 py-4">
        <p className="mb-2.5 font-mono text-[10px] uppercase tracking-wide text-text-subtle">{mention ? t("scenarios.rc.stage_how_mention") : t("scenarios.rc.stage_how_reply")}</p>
        {!mention && (
          <div className="flex gap-2.5">
            <StageAvatar initials={t("scenarios.ed.comment_who").slice(0, 1)} size={30} />
            <div className="min-w-0">
              <p className="text-caption font-semibold text-text-muted">{t("scenarios.ed.comment_who")}</p>
              <p className="mt-0.5 text-small text-text-muted [text-wrap:pretty]">{t("scenarios.ed.comment_text")}</p>
            </div>
          </div>
        )}
        <div
          className={cn(
            "flex gap-2.5",
            mention
              ? "mt-0"
              : "relative mt-2.5 pl-3 before:absolute before:bottom-1.5 before:left-[3px] before:top-0.5 before:w-0.5 before:rounded before:bg-border",
          )}
        >
          <StageAvatar initials={initials} size={30} />
          <div className="min-w-0">
            <p className="mb-0.5 flex flex-wrap items-center gap-1.5 text-caption font-semibold text-text">
              {name}
              <span className="inline-flex items-center gap-1 font-medium text-accent">
                <IcBubble size={11} /> {t("scenarios.ed.reply_tag")}
              </span>
            </p>
            <p className="text-[14.5px] leading-[1.6] text-text [text-wrap:pretty]">{mention ? t("scenarios.ed.bot_reply_mention") : t("scenarios.ed.bot_reply")}</p>
          </div>
        </div>
      </div>
    </>
  );
}

// Boost stage — a post of yours that JUST crossed the threshold (the matched
// metric is highlighted) + the pre-written boost comment added as a reply branch.
// Mirrors the v2 design's «пост + добавленный комментарий веткой».
function StageBoost({
  initials,
  name,
  handle,
  metric,
  metricPhrase,
  comment,
}: {
  initials: string;
  name: string;
  handle: string;
  metric: FormState["boostMetric"];
  metricPhrase: string;
  comment: string;
}) {
  const { t } = useTranslation();
  const text = comment.trim() ? comment : t("scenarios.bo.stage_comment_ph");
  // Highlight the metric that crossed; the other two show muted sample counts.
  const stat = (key: FormState["boostMetric"], icon: ReactNode, sample: string) => (
    <span className={cn("inline-flex items-center gap-1.5", key === metric ? "font-semibold text-accent" : "text-text-subtle")}>
      {icon} {key === metric ? metricPhrase.split(" ")[0] : sample}
    </span>
  );
  return (
    <>
      <div className="border-b border-border px-5 py-[18px]">
        <div className="mb-[13px] flex items-center gap-2.5">
          <StageAvatar initials={initials} />
          <div className="leading-tight">
            <p className="text-small font-semibold text-text">{name}</p>
            <p className="text-caption text-text-subtle">{handle}</p>
          </div>
          {/* «залетел» badge — the post crossed the threshold */}
          <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-accent/24 bg-accent/[0.08] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.04em] text-accent">
            <IcBolt size={11} /> {t("scenarios.bo.stage_crossed")}
          </span>
        </div>
        <p className="text-[15px] leading-[1.65] text-text [text-wrap:pretty]">{t("scenarios.bo.stage_post")}</p>
        <div className="mt-[15px] flex gap-5 text-caption tabular-nums">
          {stat("views", <IcEye size={13} />, "1,2K")}
          {stat("likes", <IcHeart size={13} />, "84")}
          {stat("comments", <IcBubble size={13} />, "47")}
        </div>
      </div>
      <div className="px-5 py-4">
        <p className="mb-2.5 font-mono text-[10px] uppercase tracking-wide text-text-subtle">{t("scenarios.bo.stage_how")}</p>
        <div className="relative flex gap-2.5 pl-3 before:absolute before:bottom-1.5 before:left-[3px] before:top-0.5 before:w-0.5 before:rounded before:bg-border">
          <StageAvatar initials={initials} size={30} />
          <div className="min-w-0">
            <p className="mb-0.5 flex flex-wrap items-center gap-1.5 text-caption font-semibold text-text">
              {name}
              <span className="inline-flex items-center gap-1 font-medium text-accent">
                <IcLink size={11} /> {t("scenarios.bo.stage_tag")}
              </span>
            </p>
            <p className="text-[14.5px] leading-[1.6] text-text [text-wrap:pretty]">{text}</p>
          </div>
        </div>
      </div>
    </>
  );
}

// «Следующие 3 запуска» (or «Ритм проверки» for reply) — computed from the
// КОГДА mode + hour. Honest-but-approximate (~hour), matching the design rows.
// `mention` reply scenarios fire off each @mention (no poll cadence), so they
// show a reactive rhythm instead of the comment-duty's «каждые 15 минут».
function NextRuns({ reply, mention, boost, form }: { reply: boolean; mention?: boolean; boost?: boolean; form: FormState }) {
  const { t } = useTranslation();
  if (boost) {
    // Reactive: Pennedly polls the watched posts ~every 15 min; when one crosses
    // the threshold it adds the comment once. No schedule → a rhythm, not a list.
    return (
      <div className="rounded-lg border border-border bg-surface p-4 shadow-sm">
        <div className="mb-[11px] flex items-center gap-[7px] text-caption font-semibold uppercase tracking-[0.05em] text-text-subtle">
          <IcRepeat size={13} /> {t("scenarios.rc.runs_rhythm")}
        </div>
        <RunItem when={t("scenarios.rc.runs_15min")} what={t("scenarios.bo.runs_check")} />
        <RunItem when={t("scenarios.bo.runs_crossed")} what={t("scenarios.bo.runs_add")} />
      </div>
    );
  }
  if (reply) {
    return (
      <div className="rounded-lg border border-border bg-surface p-4 shadow-sm">
        <div className="mb-[11px] flex items-center gap-[7px] text-caption font-semibold uppercase tracking-[0.05em] text-text-subtle">
          <IcRepeat size={13} /> {t("scenarios.rc.runs_rhythm")}
        </div>
        {mention ? (
          <>
            <RunItem when={t("scenarios.rc.runs_on_mention")} what={t("scenarios.rc.runs_check_mention")} />
            <RunItem when={t("scenarios.rc.runs_ready")} what={t("scenarios.rc.runs_draft")} />
          </>
        ) : (
          <>
            <RunItem when={t("scenarios.rc.runs_15min")} what={t("scenarios.rc.runs_check")} />
            <RunItem when={t("scenarios.rc.runs_ready")} what={t("scenarios.rc.runs_draft")} />
          </>
        )}
      </div>
    );
  }
  const rows = computeRuns(t, form);
  return (
    <div className="rounded-lg border border-border bg-surface p-4 shadow-sm">
      <div className="mb-[11px] flex items-center gap-[7px] text-caption font-semibold uppercase tracking-[0.05em] text-text-subtle">
        <IcClock size={13} /> {t("scenarios.rc.runs_next3")}
      </div>
      {rows.map((r, i) => (
        <RunItem key={i} when={r} what={t("scenarios.rc.runs_post")} />
      ))}
    </div>
  );
}
function RunItem({ when, what }: { when: string; what: string }) {
  return (
    <div className="flex items-center gap-[11px] border-t border-border py-[9px] first:border-t-0 first:pt-0">
      <span className="h-[7px] w-[7px] shrink-0 rounded-full bg-accent/60" />
      <span className="min-w-[116px] shrink-0 text-small font-semibold tabular-nums text-text">{when}</span>
      <span className="flex-1 text-right text-caption leading-[1.4] text-text-subtle">{what}</span>
    </div>
  );
}
// The sorted slot list (local hours) for the runs list — at least the primary
// `hour`. Multi-slot scenarios fire once per slot per due day, so the runs expand
// across slots (then days) until the ~3-row budget is filled.
function runHours(form: FormState): number[] {
  const list = [...new Set(form.hours.filter((h) => h >= 0 && h <= 23))].sort((a, b) => a - b);
  if (list.length > 0) return list;
  const h = parseInt(form.hour, 10);
  return [Number.isInteger(h) ? h : 0];
}

// The next-3 «when» labels. Event scenarios have no schedule → a single row.
function computeRuns(t: T, form: FormState): string[] {
  const hh = `~${form.hour}`;
  const slots = runHours(form);
  // Slot labels for ONE due day, e.g. ["~9:00","~14:00","~19:00"].
  const slotLabels = slots.map((h) => `~${h}:00`);
  if (form.when === "event") return [t("scenarios.rc.runs_on_event")];
  if (form.when === "every_n_days") {
    // Multi-slot: list each of today's-anchor slots first (capped at 3), else the
    // single-slot interval ladder («завтра» / «через N дн.» / «через 2N дн.»).
    if (slots.length >= 2) {
      return slotLabels.slice(0, 3).map((s) => t("scenarios.rc.runs_tomorrow").replace("{time}", s));
    }
    return [
      t("scenarios.rc.runs_tomorrow").replace("{time}", hh),
      t("scenarios.rc.runs_in_n_days").replace("{n}", String(form.nDays)).replace("{time}", hh),
      t("scenarios.rc.runs_in_n_days").replace("{n}", String(form.nDays * 2)).replace("{time}", hh),
    ];
  }
  if (form.when === "weekly") {
    // Multi-weekday — the next runs land on the chosen days; the summary phrase
    // («по будням» / «Пн, Ср и Пт») reads the same on each approximate row.
    const days = weekdaysPhrase(t, form);
    // Multi-slot: the next due day fires every slot — list them (capped at 3).
    if (slots.length >= 2) {
      return slotLabels.slice(0, 3).map((s) => t("scenarios.rc.runs_next_day").replace("{day}", days).replace("{time}", s));
    }
    return [
      t("scenarios.rc.runs_next_day").replace("{day}", days).replace("{time}", hh),
      t("scenarios.rc.runs_next_day").replace("{day}", days).replace("{time}", hh),
      t("scenarios.rc.runs_next_day").replace("{day}", days).replace("{time}", hh),
    ];
  }
  if (form.when === "monthly") {
    // Honest-but-approximate: the chosen days, each month, around the time(s) —
    // multi-slot times are listed inline in {time} (e.g. «9:00, 14:00 и 19:00»).
    const days = monthlyDaysPhrase(t, form);
    const mt = `~${timesPhrase(t, form)}`;
    return [
      t("scenarios.rc.runs_monthly").replace("{days}", days).replace("{time}", mt),
      t("scenarios.rc.runs_monthly_next").replace("{days}", days).replace("{time}", mt),
    ];
  }
  if (form.when === "yearly") {
    // Single anchored row per the design's «каждый год» feel (times listed inline).
    return [t("scenarios.rc.runs_yearly").replace("{date}", yearlyFirstDatePhrase(t, form)).replace("{time}", `~${timesPhrase(t, form)}`)];
  }
  // daily / date_range. Multi-slot: tomorrow fires every slot — list them (cap 3).
  // Single slot: three consecutive days around the one hour.
  if (slots.length >= 2) {
    return slotLabels.slice(0, 3).map((s) => t("scenarios.rc.runs_tomorrow").replace("{time}", s));
  }
  return [
    t("scenarios.rc.runs_tomorrow").replace("{time}", hh),
    t("scenarios.rc.runs_day2").replace("{time}", hh),
    t("scenarios.rc.runs_day3").replace("{time}", hh),
  ];
}

function Stage({
  reply,
  mention,
  boost,
  form,
  preview,
  running,
  runResult,
  onRunNow,
  canRunNow,
  handle,
  boostMetricPhrase,
}: {
  reply: boolean;
  mention?: boolean;
  boost?: boolean;
  form: FormState;
  preview: ScenarioPreviewT | null;
  running?: boolean;
  runResult?: ScenarioRunNow | null;
  onRunNow?: () => void;
  canRunNow?: boolean;
  handle: string;
  boostMetricPhrase?: string;
}) {
  const { t } = useTranslation();
  const name = "Алекс";
  const initials = "А";
  const samplePost = preview?.sample_post?.trim() ? preview.sample_post : t("scenarios.rc.stage_sample_post");
  return (
    <aside className="flex flex-col gap-[13px] min-[900px]:sticky min-[900px]:top-[76px] min-[900px]:max-h-[calc(100vh-92px)] min-[900px]:self-start min-[900px]:overflow-y-auto min-[900px]:overflow-x-visible min-[900px]:pr-0.5">
      <div className="inline-flex items-center gap-[7px] text-caption font-semibold uppercase tracking-[0.06em] text-text-subtle">
        <IcEye size={13} /> {t("scenarios.rc.stage_cap")}
      </div>

      {/* the framed stage */}
      <div className="overflow-hidden rounded-[28px] border border-border bg-surface shadow-lg">
        <div className="flex items-center gap-2.5 border-b border-border bg-surface-2 px-[17px] py-3">
          <span className="h-[9px] w-[9px] shrink-0 rounded-full bg-accent/55" />
          <span className="text-small font-semibold text-text-muted">{boost ? t("scenarios.bo.stage_bar") : mention ? t("scenarios.rc.stage_bar_mention") : reply ? t("scenarios.rc.stage_bar_reply") : t("scenarios.rc.stage_bar_post")}</span>
          <span className="ml-auto inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.04em] text-text-subtle">
            <span className="h-1.5 w-1.5 rounded-full bg-success shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-success)_20%,transparent)]" />
            {t("scenarios.rc.stage_live")}
          </span>
        </div>

        {boost ? (
          <StageBoost initials={initials} name={name} handle={handle} metric={form.boostMetric} metricPhrase={boostMetricPhrase ?? ""} comment={form.boostComment} />
        ) : reply ? (
          <StageReplyThread initials={initials} name={name} handle={handle} mention={mention} />
        ) : (
          <StagePost initials={initials} name={name} handle={handle} text={samplePost} />
        )}

        {/* honest invoice line */}
        <p className="flex items-start gap-2 border-t border-border bg-surface-2 px-[17px] py-[11px] text-caption leading-[1.45] text-text-subtle [&_b]:font-semibold [&_b]:text-text-muted">
          <IcSparkle size={13} className="mt-px shrink-0 opacity-85" />
          <span dangerouslySetInnerHTML={{ __html: boost ? t("scenarios.bo.invoice") : mention ? t("scenarios.rc.invoice_mention") : reply ? t("scenarios.rc.invoice_reply") : t("scenarios.rc.invoice_post") }} />
        </p>
      </div>

      <NextRuns reply={reply} mention={mention} boost={boost} form={form} />

      {/* run-now — only ever a draft */}
      {onRunNow && (
        <div className="flex flex-wrap items-start gap-[11px]">
          <Button size="sm" variant="secondary" onClick={onRunNow} loading={running} disabled={!canRunNow} icon={<IcPlay size={14} />}>
            {t("scenarios.run_now")}
          </Button>
          <span className="flex-1 basis-[130px] pt-0.5 text-caption leading-[1.4] text-text-subtle">{t("scenarios.rc.runnow_note")}</span>
        </div>
      )}

      {/* run result */}
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
//  LAYER (accordion) — Layer 2 «Настроить точнее» + Layer 3 stub
// ════════════════════════════════════════════════════════════════════════════
function Layer({
  title,
  proLabel,
  summary,
  open,
  onToggle,
  children,
}: {
  title: string;
  proLabel?: string;
  summary?: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className={cn("overflow-hidden rounded-lg border bg-surface shadow-sm", open ? "border-accent/30" : "border-border")}>
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full items-center gap-3 px-[18px] py-[15px] text-left text-text transition-colors hover:bg-surface-2">
        <IcChevRight size={16} className={cn("shrink-0 text-text-subtle transition-transform", open && "rotate-90")} />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2.5 text-[15px] font-semibold tracking-[-0.004em]">
            {title}
            {proLabel && <span className="rounded-full border border-border px-2 py-px font-mono text-[9.5px] uppercase tracking-[0.05em] text-text-subtle">{proLabel}</span>}
          </span>
          {!open && summary && <span className="mt-[3px] block text-caption leading-[1.45] text-text-subtle [text-wrap:pretty]">{summary}</span>}
        </span>
      </button>
      {open && <div className="flex flex-col gap-5 border-t border-border px-[18px] pb-[19px] pt-1">{children}</div>}
    </div>
  );
}

// Layer 3 for a scenario that produces no replies (post / boost / «Акция»): the
// override settings are reply-only, so there's nothing to override here. Instead
// of a collapsible Layer wrapping a dashed plaque, this IS the whole card — a
// calm, non-interactive «Слой 3 не применим» note that sits in the layer's place
// (same surface/border as a collapsed Layer, no chevron, no nested plaque).
function Layer3NotApplicable() {
  const { t } = useTranslation();
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-surface px-[18px] py-[15px] shadow-sm">
      <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-sm border border-border bg-surface-2 text-text-subtle">
        <IcShieldHouse size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2.5 text-[15px] font-semibold tracking-[-0.004em] text-text">
          {t("scenarios.rc.l3_title_short")}
          <span className="rounded-full border border-border px-2 py-px font-mono text-[9.5px] uppercase tracking-[0.05em] text-text-subtle">{t("scenarios.rc.layer_pro")}</span>
        </span>
        <p className="mt-1 text-caption leading-[1.5] text-text-subtle [text-wrap:pretty]">{t("scenarios.rc.l3_na_desc")}</p>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  STEP EDITOR — same prop interface as before (the host page is unchanged)
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
  isReplyPolicy,
  isReactive,
  isMentionReply,
  isBoost,
  boostScenarioOptions,
  boostPostOptions,
  l3Inherited,
  bakedRules,
  preview,
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
  demoOpenSlot,
  demoModal,
  demoLayer2,
  demoLayer3,
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
  /** on_mention: a REACTIVE reply scenario — the «Когда» slot is the locked
   *  «когда меня упомянут» (no schedule), and the rhythm/sentence reflect that
   *  it fires off the @mention rather than a poll. Always implies isReplyPolicy. */
  isMentionReply: boolean;
  /** boost: «Комментарий-добавка при росте поста» — a reactive scenario whose
   *  recipe is target + metric+threshold + a pre-written comment. Mutually
   *  exclusive with reply/post kinds. The target slot is an explicit picker for
   *  entry A (form.boostEntry==="a") and a locked plaque for B/C. */
  isBoost: boolean;
  /** Publisher scenarios the boost's «scenario» target may watch (id + label). */
  boostScenarioOptions: { id: number; label: string }[];
  /** Recent posts the boost's «post» target may watch (id + short preview). */
  boostPostOptions: { id: number; label: string }[];
  /** The live «Правила дома» values a reply scenario inherits — shown in Layer 3
   *  as «наследуется (значение)» per setting. Sourced from the account autopilot
   *  config on the page (sample values on demo). */
  l3Inherited: L3Inherited;
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
  /** Gallery-only seeds — open a slot drawer / modal / layer on first render so
   *  every Wave-1 state is reachable on demo data (undefined in the live page). */
  demoOpenSlot?: OpenSlot;
  demoModal?: BigTextField;
  demoLayer2?: boolean;
  demoLayer3?: boolean;
}) {
  const promoMode = form.helperOn || form.preset?.id === "promo";
  const reply = (isReplyPolicy || promoMode) && !isBoost;

  // ── editor-local UI state (demo seeds let the gallery open any state) ──
  const [openSlot, setOpenSlot] = useState<OpenSlot>(demoOpenSlot ?? null);
  const [bigText, setBigText] = useState<BigTextField>(demoModal ?? null);
  const [condMenuOpen, setCondMenuOpen] = useState(false);
  // separate «+ Добавить условие» menu state for the Layer-2 «Настроить точнее»
  // copy of IfBody (its own surface — was wired to a dead () => {} setter).
  const [condMenuL2, setCondMenuL2] = useState(false);
  const [layer2Open, setLayer2Open] = useState(demoLayer2 ?? false);
  const [layer3Open, setLayer3Open] = useState(demoLayer3 ?? false);

  // ── rename: contentEditable h1 toggled by the pencil, commit on blur ──
  const [renaming, setRenaming] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);

  const toggleSlot = (s: Exclude<OpenSlot, null>) => {
    setOpenSlot((cur) => (cur === s ? null : s));
    setCondMenuOpen(false);
  };

  // The instruction value shown in the «Что писать» big-text field (the baked /
  // free instruction with the preset fields interpolated, before recipe folding).
  const instructionValue = interpolate(form.instruction, form.fields);
  // A condition is "set" when any of the 3 recipe conditions is active.
  const condSet = form.condNoPostToday || form.cooldownOn || form.maxFiresOn;

  // ── sentence slots ──
  let prose: ReactNode;
  if (isBoost) {
    // Boost — «Бустер следит за [целью]. Когда такой пост наберёт [N метрику] →
    // Pennedly добавит к нему комментарий: [текст] (один раз на пост)». The target
    // is a slot ONLY in entry A (explicit picker); B/C lock it to a plaque shown
    // above the recipe, so their sentence opens with «Когда такой пост…».
    const showTargetSlot = form.boostEntry === "a";
    prose = (
      <>
        {showTargetSlot ? (
          <>
            {t("scenarios.bo.sent.a")}{" "}
            <Slot open={openSlot === "target"} onClick={() => toggleSlot("target")}>
              {boostTargetPhrase(t, form)}
            </Slot>
            {". "}
            {t("scenarios.bo.sent.b")}{" "}
          </>
        ) : (
          <>{t("scenarios.bo.sent.b_locked")} </>
        )}
        <Slot open={openSlot === "metric"} onClick={() => toggleSlot("metric")}>
          {boostMetricPhrase(t, form)}
        </Slot>{" "}
        {t("scenarios.bo.sent.c")}{" "}
        <Slot open={openSlot === "what"} onClick={() => toggleSlot("what")}>
          {t("scenarios.bo.sent.comment")}
        </Slot>{" "}
        <span className="text-[0.82em] text-text-subtle">{t("scenarios.bo.sent.once")}</span>
      </>
    );
  } else if (isMentionReply) {
    // on_mention — a REACTIVE reply: «Когда меня упомянут → Pennedly ответит на
    // упоминание твоим голосом — звучит [тон] — и [отправит сам / покажет перед
    // отправкой]». The «когда» is a locked reactive slot (no schedule); the
    // audience still lives in КОМУ (Layer 2 + the «who» drawer), kept out of the
    // headline sentence since a mention has no comment-thread audience to pick.
    prose = (
      <>
        <Slot open={openSlot === "when"} onClick={() => toggleSlot("when")}>
          {t("scenarios.rc.sent.mention_when")}
        </Slot>{" "}
        {t("scenarios.rc.sent.mention_a")}{" "}
        <Slot open={openSlot === "tone"} onClick={() => toggleSlot("tone")}>
          {t("scenarios.rc.sent.reply_tone")}
        </Slot>{" "}
        {t("scenarios.rc.sent.mention_b")}{" "}
        <Slot open={openSlot === "how"} onClick={() => toggleSlot("how")}>
          {form.mode === "auto" ? t("scenarios.rc.sent.how_auto_reply") : t("scenarios.rc.sent.how_ask_reply")}
        </Slot>
        .
      </>
    );
  } else if (reply) {
    prose = (
      <>
        {t("scenarios.rc.sent.reply_a")} <LockSlot>{t("scenarios.rc.lock_15min")}</LockSlot> {t("scenarios.rc.sent.reply_b")}{" "}
        <Slot open={openSlot === "who"} onClick={() => toggleSlot("who")}>
          {audPhrase(t, form.audience)}
        </Slot>{" "}
        {t("scenarios.rc.sent.reply_c")}{" "}
        <Slot open={openSlot === "tone"} onClick={() => toggleSlot("tone")}>
          {t("scenarios.rc.sent.reply_tone")}
        </Slot>{" "}
        {t("scenarios.rc.sent.reply_d")} <Handle>{handle}</Handle>
        {t("scenarios.rc.sent.reply_e")}{" "}
        <Slot open={openSlot === "how"} onClick={() => toggleSlot("how")}>
          {form.mode === "auto" ? t("scenarios.rc.sent.how_auto_reply") : t("scenarios.rc.sent.how_ask_reply")}
        </Slot>
        .
      </>
    );
  } else {
    prose = (
      <>
        <Slot open={openSlot === "when"} onClick={() => toggleSlot("when")}>
          {whenPhrase(t, form)}
        </Slot>{" "}
        {t("scenarios.rc.sent.post_a")}{" "}
        <Slot open={openSlot === "what"} onClick={() => toggleSlot("what")}>
          {t("scenarios.rc.sent.post_what")}
        </Slot>{" "}
        {t("scenarios.rc.sent.post_b")} <Handle>{handle}</Handle> {t("scenarios.rc.sent.post_c")}{" "}
        <Slot open={openSlot === "how"} onClick={() => toggleSlot("how")}>
          {form.mode === "auto" ? t("scenarios.rc.sent.how_auto_post") : t("scenarios.rc.sent.how_ask_post")}
        </Slot>
        .
      </>
    );
  }

  // condition line (quiet, under the sentence — POST only; a boost has no
  // conditions — the backend stores condition_cfg=None — so it's hidden there).
  const condLine = !reply && !isBoost && (
    <div className="px-6 pb-5 text-[15px] leading-[1.6] text-text-muted">
      {condSet ? (
        <>
          <span className="inline-flex items-center gap-1.5 text-text-subtle">
            <IcSliders size={13} className="opacity-70" /> {t("scenarios.rc.cond_lead")}
          </span>{" "}
          <Slot open={openSlot === "if"} onClick={() => toggleSlot("if")}>
            {condSummary(t, form)}
          </Slot>
          .
        </>
      ) : (
        <button
          type="button"
          onClick={() => toggleSlot("if")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md border border-dashed px-[11px] py-[3px] align-middle text-[0.9em] font-medium transition-colors",
            openSlot === "if" ? "border-accent text-accent" : "border-border text-text-subtle hover:border-accent/40 hover:text-accent",
          )}
        >
          <IcSliders size={12} /> {t("scenarios.rc.add_cond_inline")}
        </button>
      )}
    </div>
  );

  // ── boost slot handlers (target / metric+threshold) ──
  // Changing the metric re-seeds the threshold to that metric's default ONLY when
  // the field is blank or still holds the previous metric's default (so a user's
  // explicit number is never clobbered). Changing the target type clears the
  // other type's id so a stale id never reaches the body.
  const setBoostMetric = (m: FormState["boostMetric"]) => {
    const prevDefault = BOOST_DEFAULT_THRESHOLD[form.boostMetric];
    const keep = form.boostThreshold.trim() && Number(form.boostThreshold) !== prevDefault;
    update({ boostMetric: m, boostThreshold: keep ? form.boostThreshold : String(BOOST_DEFAULT_THRESHOLD[m]) });
  };
  const setBoostTargetType = (tt: FormState["boostTargetType"]) => {
    update({ boostTargetType: tt, ...(tt === "scenario" ? { boostPostId: 0 } : tt === "post" ? { boostScenarioId: 0 } : { boostScenarioId: 0, boostPostId: 0 }) });
  };
  // entry C — same metric-change reseed as the standalone boost, on the attached fields.
  const setAttachBoostMetric = (m: FormState["attachBoostMetric"]) => {
    const prevDefault = BOOST_DEFAULT_THRESHOLD[form.attachBoostMetric];
    const keep = form.attachBoostThreshold.trim() && Number(form.attachBoostThreshold) !== prevDefault;
    update({ attachBoostMetric: m, attachBoostThreshold: keep ? form.attachBoostThreshold : String(BOOST_DEFAULT_THRESHOLD[m]) });
  };

  // the open slot's inline drawer
  const drawer = openSlot && (
    <Drawer title={drawerTitle(t, openSlot, isBoost)} icon={SLOT_ICON[openSlot]} onDone={() => setOpenSlot(null)}>
      {openSlot === "when" && (isMentionReply ? <WhenMentionBody /> : reply ? <WhenReplyBody /> : <WhenPostBody form={form} update={update} />)}
      {openSlot === "if" && <IfBody form={form} update={update} menuOpen={condMenuOpen} setMenuOpen={setCondMenuOpen} />}
      {openSlot === "what" &&
        (isBoost ? (
          <BoostCommentBody value={form.boostComment} onOpen={() => setBigText("boost")} />
        ) : (
          <WhatPostBody form={form} update={update} instructionValue={instructionValue} onOpenInstruction={() => setBigText("instruction")} />
        ))}
      {openSlot === "target" && (
        <BoostTargetBody
          targetType={form.boostTargetType}
          onTargetType={setBoostTargetType}
          scenarioId={form.boostScenarioId}
          onScenarioId={(id) => update({ boostScenarioId: id })}
          postId={form.boostPostId}
          onPostId={(id) => update({ boostPostId: id })}
          scenarioOptions={boostScenarioOptions}
          postOptions={boostPostOptions}
        />
      )}
      {openSlot === "metric" && (
        <BoostTriggerBody metric={form.boostMetric} onMetric={setBoostMetric} threshold={form.boostThreshold} onThreshold={(v) => update({ boostThreshold: v })} />
      )}
      {openSlot === "who" && <WhoBody audience={form.audience} audiencePrompt={form.audiencePrompt} onChange={(a, p) => update({ audience: a, audiencePrompt: p })} />}
      {openSlot === "tone" && <ToneBody value={form.replyInstruction} onOpen={() => setBigText("tone")} />}
      {openSlot === "how" && <HowBody mode={form.mode} onMode={(m) => update({ mode: m })} />}
    </Drawer>
  );

  const l2sum = reply ? t("scenarios.rc.l2sum_reply") : t("scenarios.rc.l2sum_post");

  return (
    <div className="relative mx-auto max-w-[1000px]">
      {/* ── topbar ── */}
      <div className="mb-[26px] flex flex-col gap-3.5">
        <button onClick={onBack} className="inline-flex items-center gap-1.5 self-start rounded-sm py-1 pl-1.5 pr-2.5 text-small font-medium text-text-muted transition-colors hover:bg-surface-2 hover:text-text">
          <IcArrowLeft size={16} /> {t("scenarios.back_to_list")}
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
            {/* kind plaque */}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/22 bg-accent/[0.08] py-1 pl-2.5 pr-[11px] text-caption font-semibold text-text-muted">
              {isBoost ? <IcBolt size={13} className="text-accent" /> : reply ? <IcBubble size={13} className="text-accent" /> : <IcBubbleQuestion size={13} className="text-accent" />}
              {isBoost ? t("scenarios.bo.kind") : reply ? t("scenarios.rc.kind_reply") : t("scenarios.rc.kind_post")}
            </span>
          </div>
        </div>
      </div>

      {/* ── two-column grid ── */}
      <div className="grid grid-cols-1 items-start gap-[30px] min-[900px]:grid-cols-[minmax(0,1fr)_392px]">
        {/* LEFT — the recipe */}
        <div className="flex min-w-0 flex-col gap-4">
          {/* status row */}
          <div className="flex flex-wrap items-center gap-3">
            {isExisting ? (
              <>
                <span className="inline-flex items-center gap-[7px] text-small text-text-muted">
                  <IcClock size={14} className="shrink-0 text-text-subtle" />
                  <span dangerouslySetInnerHTML={{ __html: isBoost ? t("scenarios.bo.status_next") : isMentionReply ? t("scenarios.rc.status_next_mention") : reply ? t("scenarios.rc.status_next_reply") : t("scenarios.rc.status_next_post") }} />
                </span>
                <span className="ml-auto inline-flex items-center gap-2 rounded-full border border-success/30 bg-success/10 px-3 py-1.5 text-small font-semibold text-success">
                  <span className="h-2 w-2 rounded-full bg-success" />
                  {t("scenarios.rc.status_active")}
                </span>
              </>
            ) : (
              <>
                <span className="inline-flex items-center gap-[7px] text-small text-text-muted">
                  <IcInfo size={14} className="shrink-0 text-text-subtle" />
                  {t("scenarios.rc.status_draft")}
                </span>
                <span className="ml-auto inline-flex items-center gap-2 rounded-full border border-border bg-surface-2 px-3 py-1.5 text-small font-semibold text-text-subtle">
                  <span className="h-2 w-2 rounded-full bg-ink-400" />
                  {t("scenarios.status_off")}
                </span>
              </>
            )}
          </div>

          {nameErr && (
            <p className="inline-flex items-center gap-1.5 text-caption text-danger">
              <IcAlert size={13} /> {t("scenarios.err_required")}
            </p>
          )}

          {/* the recipe card */}
          <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
            <div className="flex items-center gap-2 border-b border-border bg-surface-2 px-[22px] py-3.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-text-subtle">
              <IcSparkle size={12} className="shrink-0 text-accent" /> {t("scenarios.rc.eyebrow")}
              <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2 py-0.5 font-mono text-[10px] normal-case tracking-[0.04em] text-text-muted">
                {isBoost ? <IcBolt size={11} className="text-accent" /> : reply ? <IcBubble size={11} className="text-accent" /> : <IcPencil size={11} className="text-accent" />}
                {isBoost ? t("scenarios.bo.kind") : reply ? t("scenarios.rc.kind_reply") : t("scenarios.rc.kind_post")}
              </span>
            </div>
            <p className="flex items-center gap-2 px-6 pt-[11px] text-[13px] text-text-subtle [&_b]:font-semibold [&_b]:text-text-muted">
              <IcPencil size={13} className="shrink-0 text-accent" />
              <span dangerouslySetInnerHTML={{ __html: isBoost ? t("scenarios.bo.hint") : t("scenarios.rc.hint") }} />
            </p>
            {/* boost entry B/C — the locked target plaque sits above the sentence */}
            {isBoost && form.boostEntry !== "a" && (
              <div className="px-6 pt-[14px]">
                <BoostTargetLock entry={form.boostEntry === "studio" ? "studio" : "scenario"} />
              </div>
            )}
            <p className="px-6 pb-3 pt-[22px] text-[21px] leading-[1.75] text-text [text-wrap:pretty]">{prose}</p>
            {condLine}
            {drawer}
          </div>

          {/* layers */}
          <div className="flex flex-col gap-3">
            <Layer title={t("scenarios.rc.l2_title")} summary={isBoost ? t("scenarios.bo.l2sum") : l2sum} open={layer2Open} onToggle={() => setLayer2Open((o) => !o)}>
              {isBoost ? (
                // Boost Layer 2 — the SAME three config groups as the slots (target,
                // unless locked in B/C · metric+threshold · the pre-written comment).
                <>
                  {form.boostEntry === "a" && (
                    <LayerGroup label={t("scenarios.bo.l2_grp_target")}>
                      <BoostTargetBody
                        targetType={form.boostTargetType}
                        onTargetType={setBoostTargetType}
                        scenarioId={form.boostScenarioId}
                        onScenarioId={(id) => update({ boostScenarioId: id })}
                        postId={form.boostPostId}
                        onPostId={(id) => update({ boostPostId: id })}
                        scenarioOptions={boostScenarioOptions}
                        postOptions={boostPostOptions}
                      />
                    </LayerGroup>
                  )}
                  <LayerGroup label={t("scenarios.bo.l2_grp_trigger")}>
                    <BoostTriggerBody metric={form.boostMetric} onMetric={setBoostMetric} threshold={form.boostThreshold} onThreshold={(v) => update({ boostThreshold: v })} />
                  </LayerGroup>
                  <LayerGroup label={t("scenarios.bo.l2_grp_comment")}>
                    <BoostCommentBody value={form.boostComment} onOpen={() => setBigText("boost")} />
                  </LayerGroup>
                </>
              ) : (
                <>
                  <LayerGroup label={t("scenarios.rc.l2_grp_conditions")}>
                    <IfBody form={form} update={update} menuOpen={condMenuL2} setMenuOpen={setCondMenuL2} />
                  </LayerGroup>
                  {reply ? (
                    <LayerGroup label={t("scenarios.rc.l2_grp_tone")}>
                      <ToneBody value={form.replyInstruction} onOpen={() => setBigText("tone")} />
                    </LayerGroup>
                  ) : (
                    <>
                      <LayerGroup label={t("scenarios.rc.l2_grp_time")}>
                        <WhenPostBody form={form} update={update} />
                      </LayerGroup>
                      <LayerGroup label={t("scenarios.rc.l2_grp_content")}>
                        <WhatPostBody form={form} update={update} instructionValue={instructionValue} onOpenInstruction={() => setBigText("instruction")} />
                      </LayerGroup>
                      {/* Entry C — «Бустер» for THIS post-scenario's posts (creates a
                          separate boost watching {type:"scenario"} on save). */}
                      <LayerGroup label={t("scenarios.bo.attach_group")}>
                        <BoostAttachSection
                          on={form.attachBoostOn}
                          onToggle={(v) => update({ attachBoostOn: v })}
                          metric={form.attachBoostMetric}
                          onMetric={setAttachBoostMetric}
                          threshold={form.attachBoostThreshold}
                          onThreshold={(v) => update({ attachBoostThreshold: v })}
                          comment={form.attachBoostComment}
                          onOpenComment={() => setBigText("attachBoost")}
                          isExisting={isExisting}
                        />
                      </LayerGroup>
                    </>
                  )}
                </>
              )}
              {!isBoost && bakedRules.length > 0 && (
                <LayerGroup label={t("scenarios.baked_title")}>
                  <ul className="flex flex-col gap-2">
                    {bakedRules.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-small text-text-muted">
                        <IcCheck size={15} className="mt-0.5 shrink-0 text-success" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </LayerGroup>
              )}
              {/* the "More settings" extra toggles (spam filter / quiet hours …) — read-only FE knobs */}
              <LayerGroup label={t("scenarios.more.title")}>
                <MoreSettings isReply={reply} embedded />
              </LayerGroup>
            </Layer>

            {isReplyPolicy ? (
              // Reply scenarios («Дежурство» / «Ответ на упоминания») — the real
              // per-scenario reply overrides inside a collapsible Layer.
              <Layer
                title={t("scenarios.rc.l3_title_short")}
                proLabel={t("scenarios.rc.layer_pro")}
                summary={t("scenarios.rc.l3_summary")}
                open={layer3Open}
                onToggle={() => setLayer3Open((o) => !o)}
              >
                <Layer3Override form={form} update={update} inherited={l3Inherited} onOpenCustom={() => setBigText("audience")} />
              </Layer>
            ) : (
              // Post / boost / «Акция» produce no replies → nothing to override. The
              // N/A card IS the whole layer (not a plaque inside a collapsible card).
              <Layer3NotApplicable />
            )}
          </div>

          {/* action footer */}
          <div className="mt-1 flex flex-col gap-3.5">
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
                {t("scenarios.rc.save_off")}
              </Button>
              <Button variant="primary" onClick={onSaveOn} loading={saving} icon={<IcCheck size={15} />} className="max-sm:w-full">
                {isExisting ? t("scenarios.save") : t("scenarios.save_on")}
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
          </div>
        </div>

        {/* RIGHT — stage */}
        <Stage reply={reply} mention={isMentionReply} boost={isBoost} form={form} preview={preview} running={running} runResult={runResult} onRunNow={onRunNow} canRunNow={canRunNow} handle={handle} boostMetricPhrase={isBoost ? boostMetricPhrase(t, form) : ""} />
      </div>

      {/* big-text modal — mounted inside the editor (relative positioning above) */}
      {bigText && (
        <BigTextModal
          field={bigText}
          value={
            bigText === "instruction"
              ? form.instruction
              : bigText === "tone"
                ? form.replyInstruction
                : bigText === "boost"
                  ? form.boostComment
                  : bigText === "attachBoost"
                    ? form.attachBoostComment
                    : form.audiencePrompt
          }
          onChange={(v) =>
            update(
              bigText === "instruction"
                ? { instruction: v }
                : bigText === "tone"
                  ? { replyInstruction: v }
                  : bigText === "boost"
                    ? { boostComment: v }
                    : bigText === "attachBoost"
                      ? { attachBoostComment: v }
                      : { audiencePrompt: v },
            )
          }
          onClose={() => setBigText(null)}
        />
      )}
    </div>
  );
}

// «Срабатывает только если …» summary phrase from the active recipe conditions.
function condSummary(t: T, form: FormState): string {
  const parts: string[] = [];
  if (form.condNoPostToday) parts.push(t("scenarios.rc.condsum_no_post"));
  if (form.cooldownOn) parts.push(t("scenarios.rc.condsum_cooldown").replace("{n}", String(form.cooldownValue)).replace("{unit}", form.cooldownUnit === "days" ? t("scenarios.rc.unit_days_word") : t("scenarios.rc.unit_hours_word")));
  if (form.maxFiresOn) parts.push(t("scenarios.rc.condsum_max").replace("{n}", String(form.maxFires)));
  return parts.join(t("scenarios.rc.condsum_join"));
}

function drawerTitle(t: T, slot: Exclude<OpenSlot, null>, isBoost?: boolean): string {
  // The boost's «what» slot edits the pre-written comment (not a post body), and
  // its target/metric slots have their own titles.
  if (isBoost && slot === "what") return t("scenarios.bo.dt_comment");
  if (slot === "target") return t("scenarios.bo.dt_target");
  if (slot === "metric") return t("scenarios.bo.dt_metric");
  return t(`scenarios.rc.dt_${slot}` as MessageKey);
}

// `@handle` — violet, non-clickable (its own colour so it never reads as a slot).
function Handle({ children }: { children: ReactNode }) {
  return <span className="whitespace-nowrap font-semibold text-[oklch(0.52_0.14_295)] dark:text-[oklch(0.80_0.12_295)]">{children}</span>;
}

function LayerGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-[11px]">
      <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-text-subtle">{label}</span>
      {children}
    </div>
  );
}
