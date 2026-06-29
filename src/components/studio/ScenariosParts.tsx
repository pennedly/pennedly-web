"use client";

// Scenarios — presentational pieces for /app/scenarios. Rebuilt 1:1 to the
// «рутинный автопилот» Scenarios-{WEB,Mobile}-SPEC (_cd-new).
//
//   a scenario = ONE form, pre-filled by a PRESET. КОГДА (schedule, 5 modes) →
//   что вы задаёте (1–2 fields) → что зашьётся (read-only) → [как отвечать] →
//   preview + «Прогнать сейчас» (draft only).
//
// Discovery is a preset GALLERY (4 groups, sorted by impact, no «soon», no
// «Свой» card). The list is a CONTROL-CENTER: per-day cap, week strip Mon–Sun,
// stacking warnings (named victims), «почему не сработало», cross-account
// «Применить к…». The rich «Акция» editor is PRESERVED as the campaign preset's
// form. Raw model lives under «Показать как сценарий». Icons: scenario = repeat;
// promo = gift; replies = bubble; reactive = bolt-event.

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";

import { Button, buttonClasses } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/cn";
import { useTranslation } from "@/lib/i18n";
import { localHourToUtc, localUtcOffsetLabel } from "@/lib/timezone";
import {
  IcArrowUp,
  IcBolt,
  IcBubble,
  IcBulb,
  IcCalendar,
  IcChart,
  IcCheck,
  IcChevRight,
  IcClock,
  IcExternal,
  IcEye,
  IcGift,
  IcHeart,
  IcList,
  IcLock,
  IcNib,
  IcPlay,
  IcReload,
  IcRepeat,
  IcReplies,
  IcShield,
  IcSliders,
  IcSparkle,
  IcSpread,
  IcSwap,
  IcTrash,
  IcUsers,
  IcX,
} from "@/components/icons";
import type { MessageKey } from "@/lib/i18n/messages/en";
import type {
  ConnectedAccount,
  PresetField,
  Scenario,
  ScenarioPreset,
  ScenarioPromoFields,
  ScenarioPreview as ScenarioPreviewT,
  ScenarioRunNow,
} from "@/lib/types";
import { CardLine, Sentence, type PublishMode } from "./scenarios-living";
import { deriveSentence, publishModeOf } from "./scenarios-presentation";
import { Badge, InheritChip, StatusBadge } from "./Badges";

type IconCmp = (p: { size?: number; className?: string }) => React.ReactNode;
type T = (k: MessageKey) => string;

// ── field recipes (shared with the page-composed form) ──
const SELECT =
  "h-10 w-full rounded-md border border-border bg-surface px-2.5 text-small text-text transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25 max-md:min-h-[44px] max-md:text-[16px]";
const INPUT =
  "h-10 w-full rounded-md border border-border bg-surface px-3 text-body text-text transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25 max-md:min-h-[44px] max-md:text-[16px]";
const TEXTAREA =
  "w-full rounded-md border border-border bg-surface px-3 py-2 text-body text-text transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25 max-md:text-[16px]";

export { SELECT, INPUT, TEXTAREA };

// ── icon resolution for preset cards / list ──
const ICONS: Record<string, IconCmp> = {
  IcBubble,
  IcReplies,
  IcShield,
  IcCalendar,
  IcChart,
  IcList,
  IcBolt,
  IcUsers,
  IcGift,
};
function presetIcon(key: string): IconCmp {
  return ICONS[key] ?? IcRepeat;
}

// ── group metadata: order, label, impact (0–3 pips, sort high→low) ──
export type Group = "daily" | "periodic" | "reactive" | "campaign";
const GROUP_ORDER: Group[] = ["daily", "periodic", "reactive", "campaign"];
const GROUP_LABEL: Record<Group, MessageKey> = {
  daily: "scenarios.group.daily",
  periodic: "scenarios.group.periodic",
  reactive: "scenarios.group.reactive",
  campaign: "scenarios.group.campaign",
};
const GROUP_NOTE: Record<Group, MessageKey> = {
  daily: "scenarios.group.daily_note",
  periodic: "scenarios.group.periodic_note",
  reactive: "scenarios.group.reactive_note",
  campaign: "scenarios.group.campaign_note",
};
// Per-preset impact (3-pip meter) — drives the high→low sort inside a group.
const IMPACT: Record<string, number> = {
  daily_question: 3,
  reply_duty: 3,
  on_mention: 2,
  rubric: 2,
  safety_net: 2,
  poll: 2,
  seasonal: 1,
  milestone_thanks: 1,
  amplify_viral: 2,
  boost: 2,
  promo: 3,
};
// Presets that PRODUCE replies → the form shows the «Как отвечать» block.
const REPLY_PRESETS = new Set(["daily_question", "reply_duty", "poll", "promo", "on_mention"]);
export function presetProducesReplies(id: string): boolean {
  return REPLY_PRESETS.has(id);
}

// The starter-set presets the «Запусти базовый набор» button pre-binds.
export const STARTER_SET = ["daily_question", "rubric", "reply_duty"];

// ── GOAL gallery (CD redesign) ──────────────────────────────────────────────
// The discovery gallery groups presets by the creator's GOAL ("keep a rhythm",
// "grow engagement", "for the moment", "campaigns"), not by the backend's
// mechanical group. Each card shows a benefit headline + a plain "this will…"
// sentence; reply-producing scenarios carry an honest "replies to people" plaque.
export type Goal = "rhythm" | "engage" | "timely" | "campaign";
export const GOAL_ORDER: Goal[] = ["rhythm", "engage", "timely", "campaign"];
const GOAL_OF: Record<string, Goal> = {
  daily_question: "rhythm",
  rubric: "rhythm",
  safety_net: "rhythm",
  reply_duty: "engage",
  on_mention: "engage",
  amplify_viral: "engage",
  milestone_thanks: "engage",
  // boost («Комментарий-добавка при росте поста») — an engagement amplifier (a
  // link/CTA under a post that takes off), grouped with the other reactive boosts.
  boost: "engage",
  poll: "timely",
  seasonal: "timely",
  promo: "campaign",
};
export function goalOf(presetId: string): Goal {
  return GOAL_OF[presetId] ?? "timely";
}
const GOAL_LABEL: Record<Goal, MessageKey> = {
  rhythm: "scenarios.goal.rhythm",
  engage: "scenarios.goal.engage",
  timely: "scenarios.goal.timely",
  campaign: "scenarios.goal.campaign",
};
const GOAL_NOTE: Record<Goal, MessageKey> = {
  rhythm: "scenarios.goal.rhythm_note",
  engage: "scenarios.goal.engage_note",
  timely: "scenarios.goal.timely_note",
  campaign: "scenarios.goal.campaign_note",
};
// Presets that prominently reply to real people → show the honest plaque.
const PLAQUE_PRESETS = new Set(["reply_duty", "promo", "on_mention"]);

// ── KOGDA (schedule) modes ──
// Wave 3 (decision б reversed): `monthly` / `yearly` un-hidden.
export type WhenMode = "daily" | "every_n_days" | "weekly" | "monthly" | "yearly" | "date_range" | "event";

// Derive the active КОГДА mode from a preset's / scenario's trigger_cfg +
// condition_cfg. A date-window guard (active_from/active_to) reads as date_range.
export function whenModeFromCfg(
  trigger: Record<string, unknown> | null | undefined,
  condition: Record<string, unknown> | null | undefined,
): WhenMode {
  const kind = (trigger?.kind as string) || "";
  if (kind === "every_n_days") return "every_n_days";
  if (kind === "weekly") return "weekly";
  if (kind === "monthly") return "monthly";
  if (kind === "yearly") return "yearly";
  // boost (on_post_metric) is reactive too — read it as an event so a list view
  // never mislabels it as a daily cadence (the boost editor owns its real UI).
  if (kind === "on_metric_threshold" || kind === "on_follower_milestone" || kind === "on_new_comment" || kind === "on_post_metric") return "event";
  if (condition && ("active_from" in condition || "active_to" in condition)) return "date_range";
  return "daily";
}

// Which event a reactive preset listens to (read-only КОГДА row copy + threshold
// field presence).
export function eventKindOf(trigger: Record<string, unknown> | null | undefined): string {
  return (trigger?.kind as string) || "";
}

const WEEKDAYS: MessageKey[] = [
  "scenarios.wd.mon",
  "scenarios.wd.tue",
  "scenarios.wd.wed",
  "scenarios.wd.thu",
  "scenarios.wd.fri",
  "scenarios.wd.sat",
  "scenarios.wd.sun",
];

function fmtRun(iso: string | null, locale: string): string {
  if (!iso) return "";
  const loc = locale === "ru" ? "ru-RU" : locale === "en" ? "en-US" : locale;
  return new Date(iso).toLocaleString(loc, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ════════════════════════════════════════════════════════════════════════════
//  DISCOVERY — the preset gallery (§3)
// ════════════════════════════════════════════════════════════════════════════

// 3-pip impact meter. Hidden for «Акция» (campaign carries risk/nudge instead).
function ImpactMeter({ value }: { value: number }) {
  const { t } = useTranslation();
  return (
    <span className="inline-flex items-center gap-1" title={t("scenarios.impact")} aria-label={t("scenarios.impact")}>
      {[0, 1, 2].map((i) => (
        <span key={i} className={cn("h-1.5 w-1.5 rounded-full", i < value ? "bg-accent" : "bg-border")} />
      ))}
    </span>
  );
}

// A human-readable "when" hint for a preset card footer.
function presetWhenHint(p: ScenarioPreset, t: T): string {
  // on_mention is reactive (fires off the @mention) but isn't a `post`-on-event
  // kind, so whenModeFromCfg reads it as "daily" — special-case the hint here.
  if ((p.trigger_cfg?.kind as string) === "on_mention") return t("scenarios.when_hint.on_mention");
  const mode = whenModeFromCfg(p.trigger_cfg, p.condition_cfg);
  switch (mode) {
    case "weekly":
      return t("scenarios.when_hint.weekly");
    case "every_n_days":
      return t("scenarios.when_hint.every_n");
    case "date_range":
      return t("scenarios.when_hint.dates");
    case "event":
      return eventKindOf(p.trigger_cfg) === "on_new_comment"
        ? t("scenarios.when_hint.all_day")
        : t("scenarios.when_hint.event");
    default:
      return t("scenarios.when_hint.morning");
  }
}

export function PresetCard({ preset, onPick }: { preset: ScenarioPreset; onPick: (p: ScenarioPreset) => void }) {
  const { t } = useTranslation();
  const Icon = presetIcon(preset.icon);
  const isCampaign = goalOf(preset.id) === "campaign";
  const replies = PLAQUE_PRESETS.has(preset.id);
  return (
    <button
      type="button"
      onClick={() => onPick(preset)}
      className={cn(
        "group flex h-full flex-col gap-2.5 rounded-lg border bg-surface p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-text/20 hover:shadow-md md:p-[18px]",
        isCampaign ? "border-warning/30 bg-warning/[0.04]" : "border-border",
      )}
    >
      <div className="flex items-start gap-2.5">
        <span
          className={cn(
            "grid h-9 w-9 shrink-0 place-items-center rounded-md border",
            isCampaign ? "border-warning/30 bg-warning/10 text-warning" : "border-accent/30 bg-accent/10 text-accent",
          )}
        >
          <Icon size={18} />
        </span>
        {/* benefit headline — the outcome, not the mechanism */}
        <span className="min-w-0 flex-1 text-small font-semibold leading-tight tracking-tight text-text">
          {t(`scenarios.p.${preset.id}.benefit` as MessageKey)}
        </span>
      </div>
      {/* plain "this scenario will…" sentence */}
      <p className="min-h-[3em] flex-1 text-caption leading-normal text-text-muted">
        {t(`scenarios.p.${preset.id}.will` as MessageKey)}
      </p>
      {(replies || isCampaign) && (
        <div className="flex flex-wrap items-center gap-2">
          {replies && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent/[0.08] px-2 py-0.5 text-caption font-medium text-text-muted">
              <IcReplies size={12} className="text-accent" /> {t("scenarios.replies_people")}
            </span>
          )}
          {isCampaign && (
            <span className="rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-caption font-medium text-warning">
              {t("scenarios.risk")}
            </span>
          )}
        </div>
      )}
    </button>
  );
}

// The full discovery gallery: starter-set lede, groups (sorted by impact),
// campaign in a dashed container, quiet «from scratch» at the bottom.
export function DiscoveryGallery({
  presets,
  onPick,
}: {
  presets: ScenarioPreset[];
  onPick: (p: ScenarioPreset) => void;
}) {
  const { t } = useTranslation();
  const byGoal = useMemo(() => {
    const m = new Map<Goal, ScenarioPreset[]>();
    for (const g of GOAL_ORDER) m.set(g, []);
    for (const p of presets) m.get(goalOf(p.id))!.push(p);
    for (const g of GOAL_ORDER) m.get(g)!.sort((a, b) => (IMPACT[b.id] ?? 1) - (IMPACT[a.id] ?? 1));
    return m;
  }, [presets]);

  return (
    <div className="flex flex-col gap-6">
      {GOAL_ORDER.map((g) => {
        const items = byGoal.get(g)!;
        if (items.length === 0) return null;
        const campaign = g === "campaign";
        return (
          <section key={g} className={cn("flex flex-col gap-3", campaign && "rounded-lg border border-dashed border-warning/40 bg-warning/[0.03] p-4 md:p-5")}>
            <div className="flex flex-col gap-0.5">
              <h3 className="flex items-center gap-2 text-h3 font-semibold tracking-tight">
                {t(GOAL_LABEL[g])}
                {campaign && <IcLock size={14} className="text-warning" />}
              </h3>
              <p className="text-small text-text-subtle">{t(GOAL_NOTE[g])}</p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
              {items.map((p) => (
                <PresetCard key={p.id} preset={p} onPick={onPick} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  CONTROL CENTER — the list (§4)
// ════════════════════════════════════════════════════════════════════════════

// Header: «Неделя · локальное время» + the per-day post-scenario cap stepper.
export function ControlCenterHeader({
  cap,
  onCap,
}: {
  cap: number;
  onCap: (n: number) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface-2/60 px-3.5 py-3">
      <span className="inline-flex items-center gap-1.5 text-caption font-semibold uppercase tracking-wide text-text-subtle">
        <IcClock size={13} /> {t("scenarios.cc_week")}
      </span>
      <div className="flex items-center gap-2.5">
        <span className="text-small text-text-muted">{t("scenarios.cap_label")}</span>
        <div className="inline-flex items-center gap-1 rounded-md border border-border bg-surface p-0.5">
          <button
            type="button"
            aria-label={t("scenarios.cap_dec")}
            onClick={() => onCap(Math.max(1, cap - 1))}
            disabled={cap <= 1}
            className="grid h-7 w-7 place-items-center rounded text-text-muted transition-colors hover:bg-surface-2 hover:text-text disabled:opacity-40 max-md:min-h-[40px] max-md:min-w-[40px]"
          >
            −
          </button>
          <span className="w-6 text-center text-body font-semibold tabular-nums">{cap}</span>
          <button
            type="button"
            aria-label={t("scenarios.cap_inc")}
            onClick={() => onCap(Math.min(10, cap + 1))}
            disabled={cap >= 10}
            className="grid h-7 w-7 place-items-center rounded text-text-muted transition-colors hover:bg-surface-2 hover:text-text disabled:opacity-40 max-md:min-h-[40px] max-md:min-w-[40px]"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}

// The week strip Mon–Sun: a "fire" cell on the days the scenario fires. Reactive
// scenarios show an event row instead.
function CadenceStrip({ s }: { s: Scenario }) {
  const { t } = useTranslation();
  const mode = whenModeFromCfg(s.trigger_cfg, s.condition_cfg);
  const evt = mode === "event";
  if (evt) {
    const kind = eventKindOf(s.trigger_cfg);
    const label =
      kind === "on_metric_threshold"
        ? t("scenarios.event_views")
        : kind === "on_follower_milestone"
          ? t("scenarios.event_followers")
          : t("scenarios.event_comment");
    return (
      <div className="flex items-center gap-2 rounded-md border border-success/25 bg-success/[0.05] px-2.5 py-1.5 text-caption text-text-muted">
        <IcBolt size={13} className="shrink-0 text-success" />
        <span>{label}</span>
      </div>
    );
  }
  // which days fire (0=Mon..6=Sun)
  let fire = (i: number) => true; // daily
  if (mode === "weekly") {
    const wd = Number(s.trigger_cfg?.weekday ?? 0);
    fire = (i) => i === wd;
  } else if (mode === "every_n_days") {
    const n = Number(s.trigger_cfg?.n ?? 1);
    fire = (i) => n <= 1 || i % n === 0;
  }
  // Restyled day strip (Tip-Card-Plaque .sc-days): a mono «дни» label, then the
  // 7 weekday cells. Active days are FILLED with --color-primary; inactive are
  // surface-2 with subtle text. Reply scenarios fire every day (success cue n/a
  // here — the built-in reply card carries its own «постоянно» wording).
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 font-mono text-[10.5px] uppercase tracking-[0.05em] text-text-subtle">{t("scenarios.tip.days_k")}</span>
      {WEEKDAYS.map((wd, i) => {
        const on = fire(i);
        return (
          <span
            key={i}
            className={cn(
              "grid h-[26px] min-w-[30px] place-items-center rounded-sm px-[5px] font-mono text-[10.5px] font-medium tracking-[0.01em] tabular-nums transition-colors",
              on
                ? "border border-primary bg-primary font-semibold text-primary-foreground"
                : "border border-border bg-surface-2 text-text-subtle",
            )}
            title={t(wd)}
          >
            {t(wd)}
          </span>
        );
      })}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  TIP PLAQUE — context advice attached to the routine(s) it's about (§Case A/B).
//  Tone = «совет», low priority, warm warning tint that never screams. The exact
//  treatment is ported 1:1 from Tip-Card-Plaque.html: per-card «подвал-полоса»
//  (.pl-band), a per-group bracket (.pl-conflict + .pl-shared) and the dismiss /
//  restore states. Colours use the design's literal color-mix() expressions via
//  inline style so the warm tints match the tokens exactly in both themes.
// ════════════════════════════════════════════════════════════════════════════

// One advice action (a soft accent button next to the body text).
export type TipAction = { key: string; label: string; icon: "spread" | "up" };
export type TipAdvice = {
  /** Stable id for localStorage dismissal (per-account, per-advice). */
  id: string;
  title: string;
  /** Body with **bold** spans (parsed into <b>). */
  body: string;
  actions?: TipAction[];
  /** Swap the «Совет» tag for «Коуч Pennedly». */
  coach?: boolean;
};

// **bold** → <b>… ; the rest stays plain text. Mirrors the design's <b> spans.
function renderBold(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const parts = text.split(/\*\*(.+?)\*\*/g);
  parts.forEach((p, i) => {
    if (i % 2 === 1) out.push(<b key={i} className="font-semibold text-text">{p}</b>);
    else if (p) out.push(<span key={i}>{p}</span>);
  });
  return out;
}

function TipActionBtn({ action }: { action: TipAction }) {
  const Icon = action.icon === "up" ? IcArrowUp : IcSpread;
  return (
    <button
      type="button"
      style={{
        background: "color-mix(in srgb, var(--color-accent) 10%, var(--color-surface))",
        color: "var(--color-accent)",
        borderColor: "color-mix(in srgb, var(--color-accent) 26%, var(--color-border))",
      }}
      className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border px-2.5 text-small font-medium transition-colors hover:brightness-[0.97]"
    >
      <Icon size={14} /> {action.label}
    </button>
  );
}

// The shared inner of every plaque anchoring — bulb glyph · mark/coach + title ·
// body · optional actions · dismiss ✕. Identical markup everywhere (design's
// plInner). `who` spans inside the body are pre-marked by the caller via **…**?
// No — names are bolded inline by the caller through the body string itself.
function TipInner({ advice, onDismiss }: { advice: TipAdvice; onDismiss?: () => void }) {
  const { t } = useTranslation();
  return (
    <>
      <span
        className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-warning"
        style={{ background: "color-mix(in srgb, var(--color-warning) 15%, var(--color-surface))" }}
      >
        <IcBulb size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          {advice.coach ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface py-0.5 pl-1.5 pr-2 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-text-subtle">
              <IcNib size={12} className="text-accent" /> {t("scenarios.tip.coach")}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface py-0.5 pl-1.5 pr-2 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-text-subtle">
              <IcBulb size={12} className="text-warning" /> {t("scenarios.tip.mark")}
            </span>
          )}
          <span className="text-small font-semibold text-text">{advice.title}</span>
        </div>
        <p className="mt-[3px] text-caption leading-[1.5] text-text-muted [text-wrap:pretty]">{renderBold(advice.body)}</p>
      </div>
      {advice.actions && advice.actions.length > 0 && (
        <div className="flex shrink-0 flex-wrap items-center gap-2 self-center max-md:w-full max-md:self-stretch">
          {advice.actions.map((a) => (
            <TipActionBtn key={a.key} action={a} />
          ))}
        </div>
      )}
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label={t("scenarios.tip.dismiss")}
          className="grid h-[26px] w-[26px] shrink-0 self-start place-items-center rounded-sm text-text-subtle transition-colors hover:bg-warning/[0.14] hover:text-text"
        >
          <IcX size={15} />
        </button>
      )}
    </>
  );
}

// Case A — «подвал-полоса»: a tinted band fused to the card's bottom edge, INSIDE
// the border, BELOW the footer. Negative side/bottom margins cancel the card
// padding so it runs full-width and rounds with the card (design .pl-band).
export function TipBand({ advice, onDismiss }: { advice: TipAdvice; onDismiss?: () => void }) {
  return (
    <div
      className="-mx-[19px] -mb-[17px] mt-[13px] flex items-start gap-3 rounded-b-lg px-[18px] pb-[13px] pt-3 max-md:flex-wrap"
      style={{
        borderTop: "1px solid color-mix(in srgb, var(--color-warning) 28%, var(--color-border))",
        background: "color-mix(in srgb, var(--color-warning) 8%, var(--color-surface))",
      }}
    >
      <TipInner advice={advice} onDismiss={onDismiss} />
    </div>
  );
}

// A warm «aims-at» time chip beside a routine's name (conflict case only). Design
// .sc-timechip — «{clock} метит на {time}».
export function TimeChip({ time }: { time: string }) {
  const { t } = useTranslation();
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border py-[3px] pl-[7px] pr-[9px] text-caption font-semibold leading-none text-warning"
      style={{
        background: "color-mix(in srgb, var(--color-warning) 11%, var(--color-surface))",
        borderColor: "color-mix(in srgb, var(--color-warning) 28%, var(--color-border))",
      }}
    >
      <IcClock size={11} className="shrink-0" /> {t("scenarios.tip.aims_at").replace("{time}", time)}
    </span>
  );
}

// Case B — the SHARED bracket: ONE advice spanning a conflicting group. Wraps the
// conflicting cards in a warning-tinted container with a left rail; a single
// shared plaque is fused to the group's bottom (design .pl-conflict + .pl-shared).
export function ConflictBracket({
  advice,
  onDismiss,
  children,
}: {
  advice: TipAdvice;
  onDismiss?: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className="relative flex flex-col gap-3 rounded-xl px-[13px] pb-0 pt-[13px] [&_>_div.rounded-lg]:shadow-sm"
      style={{
        border: "1px solid color-mix(in srgb, var(--color-warning) 24%, var(--color-border))",
        background: "color-mix(in srgb, var(--color-warning) 4%, transparent)",
      }}
    >
      <span
        className="pointer-events-none absolute left-0 w-[3px] rounded-r-[2px]"
        style={{ top: "13px", bottom: "74px", background: "color-mix(in srgb, var(--color-warning) 50%, transparent)" }}
      />
      {children}
      <div
        className="-mx-[13px] mt-px flex items-start gap-3 rounded-b-xl px-4 pb-[14px] pt-[13px] max-md:flex-wrap"
        style={{
          borderTop: "1px solid color-mix(in srgb, var(--color-warning) 28%, var(--color-border))",
          background: "color-mix(in srgb, var(--color-warning) 9%, var(--color-surface))",
        }}
      >
        <TipInner advice={advice} onDismiss={onDismiss} />
      </div>
    </div>
  );
}

// The quiet «{n} совет скрыт» button in the routine-list header (design .rl-hidden).
export function HiddenTipsPill({ count, onShow }: { count: number; onShow: () => void }) {
  const { t } = useTranslation();
  if (count <= 0) return null;
  const label = (count === 1 ? t("scenarios.tip.hidden_one") : t("scenarios.tip.hidden_many")).replace("{n}", String(count));
  return (
    <button
      type="button"
      onClick={onShow}
      className="inline-flex items-center gap-[7px] text-small text-text-subtle transition-colors hover:text-text"
    >
      <IcBulb size={13} className="text-warning" /> {label}
    </button>
  );
}

// The dismissed-state restore line (design .pl-restored) — «Совет по «{name}»
// скрыт. Вернётся…» + a «Вернуть» accent button that clears the dismissal.
export function TipRestoredLine({ name, onRestore }: { name: string; onRestore: () => void }) {
  const { t } = useTranslation();
  const txt = t("scenarios.tip.restored").replace("{name}", name);
  return (
    <div className="flex items-center gap-2.5 rounded-md border border-dashed border-border bg-surface-2 px-3.5 py-[9px]">
      <span className="min-w-0 flex-1 text-caption text-text-subtle">{txt}</span>
      <button
        type="button"
        onClick={onRestore}
        className="shrink-0 rounded-sm px-2 py-1 text-small font-semibold text-accent transition-colors hover:bg-accent/[0.09]"
      >
        {t("scenarios.tip.restore")}
      </button>
    </div>
  );
}

const SKIP_REASON: Record<string, MessageKey> = {
  cap: "scenarios.skip.cap",
  condition: "scenarios.skip.condition",
  gated: "scenarios.skip.gated",
  quota: "scenarios.skip.quota",
};

// One control-center card: glyph + name + provenance + toggle, the cadence
// strip, runs (next/last) + run-count, a skip-note, and «Применить к…» + Open.
export function ScenarioCard({
  s,
  accounts,
  handle = "@you",
  onToggle,
  onOpen,
  onApply,
  onDelete,
  inheritFromHouseRules = false,
  overridesDefault = false,
  band,
  onDismissBand,
  timechip,
}: {
  s: Scenario;
  accounts?: ConnectedAccount[];
  handle?: string;
  onToggle: (s: Scenario, on: boolean) => void;
  onOpen: (s: Scenario) => void;
  onApply?: (s: Scenario, accountIds: number[]) => void;
  onDelete?: (s: Scenario) => void;
  /** Unified Autopilot: this routine's reply cadence/quiet/ceiling come from the
   *  global «Правила дома» → show an «из Правил дома» inherit chip in the footer. */
  inheritFromHouseRules?: boolean;
  /** Coexistence: this is an ACTIVE custom reply scenario that overrides the
   *  account's built-in reply sweep → show a «перебивает дефолт» link badge. */
  overridesDefault?: boolean;
  /** Case A — a context advice fused to this card's bottom edge (§Case A). */
  band?: TipAdvice;
  onDismissBand?: () => void;
  /** Conflict case — a warm «метит на {time}» chip beside the name (§Case B). */
  timechip?: string;
}) {
  const { t, locale } = useTranslation();
  const isPromo = s.template === "promo";
  const isReply = (s.action_cfg?.kind as string) === "reply_policy";
  const Icon = isPromo ? IcGift : isReply ? IcReplies : IcRepeat;
  const skip = s.recent_skips?.[0];
  // living sentence (caption) + who-confirms line (the «спрашивает / публикует
  // автоматически» promise, shown plainly on the card).
  const sentence = deriveSentence(t, s, handle);
  const mode = publishModeOf(s);
  const modeKey = (`scenarios.card.${mode}_${sentence.kind}` as MessageKey);
  const ModeIcon = mode === "auto" ? IcBolt : IcEye;
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-surface p-4 shadow-sm transition-colors hover:border-text/15 hover:shadow-md md:p-[18px]",
        !s.enabled && "opacity-[0.82]",
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "grid h-10 w-10 shrink-0 place-items-center rounded-md border",
            s.enabled ? "border-success/30 bg-success/12 text-success" : "border-border bg-surface-2 text-text-muted",
          )}
        >
          <Icon size={20} />
        </span>
        <div className="min-w-0 flex-1">
          {/* Name on the title line — plus a warm «метит на {time}» chip in the
              conflict case (§Case B). Badges live in a calm tag row below. */}
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-body font-semibold tracking-tight">{s.name}</h3>
            {timechip && <TimeChip time={timechip} />}
          </div>
          <CardLine template={sentence.template} slots={sentence.slots} className="mt-1" />
          {/* property/relation badges: «отвечает людям» (neutral) for a reply
              scenario; «перебивает дефолт» (link) when it overrides the default sweep */}
          {isReply && (
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <Badge tone="neutral" icon={<IcReplies />}>{t("scenarios.replies_people")}</Badge>
              {overridesDefault && <Badge tone="link" icon={<IcSwap />}>{t("scenarios.overrides_default")}</Badge>}
            </div>
          )}
        </div>
        {/* Big, unambiguous status — the «сохранил ≠ работает» fix (now via the
            unified StatusBadge: the only family carrying a dot). */}
        <div className="flex shrink-0 flex-col items-end gap-2">
          <StatusBadge tone={s.enabled ? "on" : "off"}>
            {s.enabled ? t("scenarios.status_on") : t("scenarios.status_off")}
          </StatusBadge>
          <Switch checked={s.enabled} onCheckedChange={(v) => onToggle(s, v)} aria-label={s.name} />
        </div>
      </div>

      {/* skip-note, else the «сохранил ≠ работает» block — an OFF scenario says so
          plainly and offers to turn it on right there. */}
      {skip ? (
        <div className="mt-3 rounded-md border border-dashed border-warning/40 bg-warning/[0.04] px-3 py-2 text-caption text-text-muted">
          <span className="font-medium text-text">{t("scenarios.skip_title")}</span>{" "}
          {t(SKIP_REASON[skip.reason] ?? "scenarios.skip.condition")}
        </div>
      ) : !s.enabled ? (
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-md border border-warning/30 bg-warning/[0.06] px-3 py-2.5">
          <span className="min-w-0 flex-1 text-small leading-[1.45] text-text">
            <b className="font-semibold">{t("scenarios.created_off_title")}</b> {t("scenarios.created_off_body")}
          </span>
          <Button
            size="sm"
            variant="primary"
            icon={<IcCheck size={14} />}
            onClick={() => onToggle(s, true)}
            className="shrink-0 max-sm:w-full"
          >
            {t("scenarios.turn_on")}
          </Button>
        </div>
      ) : null}

      {/* cadence strip — the WHEN */}
      <div className="mt-3">
        <CadenceStrip s={s} />
      </div>

      {/* who confirms before it goes out — «спрашивает / публикует автоматически» */}
      <p className={cn("mt-2.5 inline-flex items-center gap-1.5 text-caption", mode === "auto" ? "text-warning" : "text-text-subtle")}>
        <ModeIcon size={13} /> {t(modeKey)}
      </p>

      <div className="mt-3.5 flex flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-caption tabular-nums text-text-subtle">
          <span>
            {t("scenarios.next_run")}:{" "}
            <span className={s.enabled && s.next_run_at ? "font-medium text-text" : ""}>
              {s.enabled && s.next_run_at ? fmtRun(s.next_run_at, locale) : t("scenarios.paused")}
            </span>
          </span>
          <span>
            {t("scenarios.last_run")}:{" "}
            <span className={s.last_run_at ? "font-medium text-text" : ""}>
              {s.last_run_at ? fmtRun(s.last_run_at, locale) : t("scenarios.never_ran")}
            </span>
          </span>
          {s.fire_count > 0 && (
            <span className="inline-flex items-center gap-1 text-text-muted">
              <IcRepeat size={12} /> {t("scenarios.fired").replace("{n}", String(s.fire_count))}
            </span>
          )}
          {inheritFromHouseRules && (
            <InheritChip icon={<IcSliders />}>{t("ap.inherit")}</InheritChip>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2 max-sm:w-full">
          {onApply && accounts && accounts.length > 1 && (
            <ApplyToPopover s={s} accounts={accounts} onApply={onApply} />
          )}
          {s.fire_count > 0 && (
            <Link
              href={`/app/scenarios/${s.id}/activity`}
              className="inline-flex h-9 shrink-0 items-center rounded-md border border-border px-3 text-small font-medium text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
            >
              {t("scenarios.activity.title")}
            </Link>
          )}
          <Button size="sm" variant="secondary" onClick={() => onOpen(s)} className="shrink-0 max-sm:flex-1">
            {t("scenarios.open")}
          </Button>
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(s)}
              aria-label={t("scenarios.delete")}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-border text-text-subtle transition-colors hover:border-danger/40 hover:bg-danger/10 hover:text-danger"
            >
              <IcTrash size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Case A — context advice fused to the card's bottom edge (below the footer). */}
      {band && <TipBand advice={band} onDismiss={onDismissBand} />}
    </div>
  );
}

// Cross-account «Применить к…» — a popover (desktop) / sheet (phone) listing the
// OTHER accounts, each toggleable, + «Применить к N». Client-side clone.
export function ApplyToPopover({
  s,
  accounts,
  onApply,
}: {
  s: Scenario;
  accounts: ConnectedAccount[];
  onApply: (s: Scenario, accountIds: number[]) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState<Set<number>>(new Set());
  const others = accounts; // page already filters out the current account
  function toggle(id: number) {
    setSel((p) => {
      const n = new Set(p);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }
  function apply() {
    onApply(s, [...sel]);
    setOpen(false);
    setSel(new Set());
  }
  return (
    <div className="relative">
      <Button size="sm" variant="ghost" onClick={() => setOpen((o) => !o)} icon={<IcExternal size={14} />}>
        {t("scenarios.apply_to")}
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-30 max-md:bg-ink-950/40" onMouseDown={() => setOpen(false)} aria-hidden />
          <div
            className="absolute right-0 z-40 mt-2 w-72 rounded-lg border border-border bg-surface p-3 shadow-lg max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:mt-0 max-md:w-auto max-md:rounded-b-none max-md:pb-[calc(env(safe-area-inset-bottom)+16px)]"
            role="dialog"
          >
            <p className="mb-2 text-caption font-semibold uppercase tracking-wide text-text-subtle">{t("scenarios.apply_title")}</p>
            <div className="flex max-h-64 flex-col gap-1 overflow-y-auto">
              {others.map((a) => (
                <label key={a.id} className="flex items-center justify-between gap-3 rounded-md px-1.5 py-2 hover:bg-surface-2">
                  <span className="min-w-0 truncate text-small text-text">{a.display_name || a.username || `#${a.id}`}</span>
                  <Switch checked={sel.has(a.id)} onCheckedChange={() => toggle(a.id)} aria-label={a.username || String(a.id)} />
                </label>
              ))}
              {others.length === 0 && <p className="px-1.5 py-2 text-caption text-text-subtle">{t("scenarios.apply_none")}</p>}
            </div>
            <Button variant="primary" className="mt-3 w-full" disabled={sel.size === 0} onClick={apply}>
              {t("scenarios.apply_n").replace("{n}", String(sel.size))}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

export function ScenarioSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-surface p-[18px] shadow-sm">
      <div className="flex items-start gap-3">
        <span className="h-10 w-10 shrink-0 animate-pulse rounded-md bg-surface-2" />
        <div className="flex-1 space-y-2">
          <span className="block h-4 w-40 animate-pulse rounded bg-surface-2" />
          <span className="block h-3 w-64 animate-pulse rounded bg-surface-2" />
        </div>
        <span className="h-6 w-11 shrink-0 animate-pulse rounded-full bg-surface-2" />
      </div>
      <div className="mt-3 flex gap-1.5">
        {Array.from({ length: 7 }).map((_, i) => (
          <span key={i} className="h-7 flex-1 animate-pulse rounded bg-surface-2" />
        ))}
      </div>
      <div className="mt-4 flex items-center gap-4 border-t border-border pt-3">
        <span className="h-3 w-24 animate-pulse rounded bg-surface-2" />
        <span className="h-3 w-28 animate-pulse rounded bg-surface-2" />
        <span className="ml-auto h-8 w-20 animate-pulse rounded-sm bg-surface-2" />
      </div>
    </div>
  );
}

export function ScenariosError({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-start gap-3 rounded-lg border border-danger/30 bg-danger/[0.07] p-4">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-danger/12 text-danger">
        <IcReload size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-small font-semibold text-text">{t("scenarios.error")}</p>
        <p className="mt-0.5 text-caption leading-relaxed text-text-muted">{t("scenarios.error_sub")}</p>
      </div>
      <Button size="sm" variant="secondary" icon={<IcReload size={14} />} onClick={onRetry}>
        {t("scenarios.retry")}
      </Button>
    </div>
  );
}

// A short, human schedule summary for a free scenario's provenance badge.
export function scheduleSummary(s: Scenario, t: T): string {
  const mode = whenModeFromCfg(s.trigger_cfg, s.condition_cfg);
  switch (mode) {
    case "every_n_days": {
      const n = (s.trigger_cfg?.n as number) ?? "N";
      return `${t("scenarios.sched.every_n")} (${n})`;
    }
    case "weekly":
      return t("scenarios.sched.weekly");
    case "date_range":
      return t("scenarios.sched.date_range");
    case "event":
      return t("scenarios.sched.event");
    default:
      return t("scenarios.sched.daily");
  }
}

// ════════════════════════════════════════════════════════════════════════════
//  THE UNIFIED FORM — building blocks (§5–§9)
// ════════════════════════════════════════════════════════════════════════════

export function FormCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-lg border border-border bg-surface p-5 shadow-sm md:p-[22px]", className)}>{children}</section>
  );
}

export function CardTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-h3 font-semibold tracking-tight">{title}</h2>
      {sub && <p className="mt-1 text-small leading-relaxed text-text-subtle">{sub}</p>}
    </div>
  );
}

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: ReactNode;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-small font-medium text-text">{label}</span>
      {children}
      {error ? (
        <span className="text-caption text-danger">{error}</span>
      ) : hint ? (
        <span className="text-caption leading-relaxed text-text-subtle">{hint}</span>
      ) : null}
    </label>
  );
}

// «КОГДА» — 5 modes. The active one is set by the preset; reactive's «По
// событию» is read-only (the segment shows it locked).
export function WhenSegment({
  value,
  nDays,
  weekday,
  dateFrom,
  dateTo,
  threshold,
  locked,
  eventKind,
  onMode,
  onNDays,
  onWeekday,
  onDate,
  onThreshold,
}: {
  value: WhenMode;
  nDays: number;
  weekday: number;
  dateFrom: string;
  dateTo: string;
  threshold: string;
  locked?: boolean; // reactive: «По событию» is fixed by the preset
  eventKind?: string;
  onMode: (m: WhenMode) => void;
  onNDays: (n: number) => void;
  onWeekday: (d: number) => void;
  onDate: (which: "from" | "to", v: string) => void;
  onThreshold: (v: string) => void;
}) {
  const { t } = useTranslation();
  const MODES: { key: WhenMode; label: MessageKey }[] = [
    { key: "daily", label: "scenarios.when.daily" },
    { key: "every_n_days", label: "scenarios.when.every_n" },
    { key: "weekly", label: "scenarios.when.weekly" },
    { key: "date_range", label: "scenarios.when.dates" },
    { key: "event", label: "scenarios.when.event" },
  ];
  // When the preset is reactive, show ONLY the locked event row (no segment).
  if (locked && value === "event") {
    const row =
      eventKind === "on_metric_threshold"
        ? t("scenarios.event_views")
        : eventKind === "on_follower_milestone"
          ? t("scenarios.event_followers")
          : t("scenarios.event_comment");
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2.5 rounded-md border border-border bg-surface-2 px-3 py-2.5 text-small text-text-muted">
          <IcLock size={14} className="shrink-0 text-text-subtle" />
          <span className="min-w-0">{row}</span>
          <span className="ml-auto shrink-0 rounded-full border border-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-text-subtle">
            {t("scenarios.preset_locked")}
          </span>
        </div>
        {eventKind === "on_metric_threshold" && (
          <Field label={t("scenarios.field.threshold_views")} hint={t("scenarios.threshold_auto")}>
            <input
              type="number"
              inputMode="numeric"
              className={INPUT}
              value={threshold}
              onChange={(e) => onThreshold(e.target.value)}
              placeholder={t("scenarios.threshold_ph")}
            />
          </Field>
        )}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      {/* Single even row — fills the width when the labels fit (flex-1), scrolls
          horizontally rather than wrapping to ragged 2-line buttons when they don't. */}
      <div className="flex gap-1 overflow-x-auto rounded-lg border border-border bg-surface-2 p-1 text-small [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {MODES.map((o) => {
          const active = o.key === value;
          return (
            <button
              key={o.key}
              type="button"
              onClick={() => onMode(o.key)}
              aria-pressed={active}
              className={cn(
                "flex flex-1 items-center justify-center whitespace-nowrap rounded-md px-3 py-2 font-medium leading-none transition-colors max-md:min-h-[44px]",
                active ? "bg-surface text-text shadow-sm" : "text-text-muted hover:text-text",
              )}
            >
              {t(o.label)}
            </button>
          );
        })}
      </div>

      {value === "every_n_days" && (
        <div className="flex flex-wrap items-center gap-2.5 text-small text-text-muted">
          <span>{t("scenarios.f.n_days")}</span>
          <input
            type="number"
            min={1}
            max={90}
            inputMode="numeric"
            aria-label={t("scenarios.f.n_days")}
            className="h-10 w-[76px] rounded-md border border-border bg-surface text-center text-body tabular-nums text-text focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25 max-md:min-h-[44px] max-md:text-[16px]"
            value={nDays}
            onChange={(e) => onNDays(Math.min(90, Math.max(1, Number(e.target.value) || 1)))}
          />
          <span className="text-text-subtle">{t("scenarios.sched.every_n_unit").replace("{n}", String(nDays))}</span>
        </div>
      )}

      {value === "weekly" && (
        <div className="flex flex-wrap gap-1.5">
          {WEEKDAYS.map((wd, i) => (
            <button
              key={i}
              type="button"
              aria-pressed={weekday === i}
              onClick={() => onWeekday(i)}
              className={cn(
                "grid h-10 min-w-[44px] flex-1 place-items-center rounded-md border text-small font-medium transition-colors max-md:min-h-[44px]",
                weekday === i ? "border-accent bg-accent/10 text-accent" : "border-border bg-surface text-text-muted hover:text-text",
              )}
            >
              {t(wd)}
            </button>
          ))}
        </div>
      )}

      {value === "date_range" && (
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <Field label={t("scenarios.date_from")}>
            <input type="date" className={INPUT} value={dateFrom} onChange={(e) => onDate("from", e.target.value)} />
          </Field>
          <Field label={t("scenarios.date_to")}>
            <input type="date" className={INPUT} value={dateTo} onChange={(e) => onDate("to", e.target.value)} />
          </Field>
        </div>
      )}

      {value === "daily" && (
        <p className="inline-flex items-center gap-1.5 text-small text-text-subtle">
          <IcClock size={14} /> {t("scenarios.sched.daily_note")}
        </p>
      )}
    </div>
  );
}

// «Время» + «Разброс минут» — POST routines only, shown under the schedule for
// the cadence modes (daily / every-N / weekly / date-range). Two selects in a
// 2-col grid that stacks on narrow screens. The hour caption shows the local
// offset + the equivalent UTC send time; the jitter caption explains the spread.
// FE-state only for now (compileBody does not send these yet).
const HOUR_OPTIONS = ["7:00", "8:00", "9:00", "12:00", "19:00"];
const JITTER_OPTIONS = [0, 5, 15, 30];

export function WhenTimeJitter({
  hour,
  jitter,
  onHour,
  onJitter,
}: {
  hour: string;
  jitter: number;
  onHour: (h: string) => void;
  onJitter: (j: number) => void;
}) {
  const { t } = useTranslation();
  // Local hour → UTC send time (truthful, via the same helper Autopilot uses).
  const localHour = parseInt(hour, 10) || 0;
  const utcTime = `${String(localHourToUtc(localHour)).padStart(2, "0")}:00`;
  return (
    <div className="mt-0.5 grid grid-cols-2 gap-3 max-[640px]:grid-cols-1">
      <label className="flex min-w-0 flex-col gap-1.5">
        <span className="text-caption font-medium text-text-muted">{t("scenarios.ed.time_label")}</span>
        <select className={SELECT} value={hour} onChange={(e) => onHour(e.target.value)} aria-label={t("scenarios.ed.time_label")}>
          {Array.from(new Set([...HOUR_OPTIONS, hour])).map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
        <span className="text-caption text-text-subtle tabular-nums">
          {localUtcOffsetLabel()} · {t("scenarios.ed.sends_utc").replace("{time}", utcTime)}
        </span>
      </label>
      <label className="flex min-w-0 flex-col gap-1.5">
        <span className="text-caption font-medium text-text-muted">{t("scenarios.ed.jitter_label")}</span>
        <select className={SELECT} value={jitter} onChange={(e) => onJitter(Number(e.target.value))} aria-label={t("scenarios.ed.jitter_label")}>
          {Array.from(new Set([...JITTER_OPTIONS, jitter]))
            .sort((a, b) => a - b)
            .map((m) => (
              <option key={m} value={m}>
                {m === 0 ? t("scenarios.ed.jitter_exact") : t("scenarios.ed.jitter_min").replace("{n}", String(m))}
              </option>
            ))}
        </select>
        <span className="text-caption text-text-subtle tabular-nums">
          {jitter === 0 ? t("scenarios.ed.jitter_hint_exact") : t("scenarios.ed.jitter_hint").replace("{n}", String(jitter))}
        </span>
      </label>
    </div>
  );
}

// Renders a single preset field by kind (text/textarea/options) into the form.
// Returns the value via `onChange`. cadence/weekday/date are handled by the
// КОГДА segment, so they are skipped here.
export function PresetFieldInput({
  field,
  value,
  error,
  onChange,
}: {
  field: PresetField;
  value: string;
  error?: boolean;
  onChange: (v: string) => void;
}) {
  const { t } = useTranslation();
  const label = t(field.name_key as MessageKey);
  const hint = t(`${field.name_key}_hint` as MessageKey);
  const ph = t(`${field.name_key}_ph` as MessageKey);
  if (field.kind === "textarea") {
    return (
      <Field label={label} hint={hint} error={error ? t("scenarios.err_required") : undefined}>
        <textarea rows={3} className={cn(TEXTAREA, error && "border-danger focus:border-danger focus:ring-danger/25")} value={value} onChange={(e) => onChange(e.target.value)} placeholder={ph} />
      </Field>
    );
  }
  if (field.kind === "options") {
    // 2–4 short options, one per line.
    return (
      <Field label={label} hint={hint} error={error ? t("scenarios.options_err") : undefined}>
        <textarea rows={4} className={cn(TEXTAREA, error && "border-danger focus:border-danger focus:ring-danger/25")} value={value} onChange={(e) => onChange(e.target.value)} placeholder={ph} />
      </Field>
    );
  }
  return (
    <Field label={label} hint={hint} error={error ? t("scenarios.err_required") : undefined}>
      <input className={cn(INPUT, error && "border-danger focus:border-danger focus:ring-danger/25")} value={value} onChange={(e) => onChange(e.target.value)} placeholder={ph} />
    </Field>
  );
}

// «Как отвечать» — only for reply-producing presets. The audience 3-way segment
// + a baked rule (read-only) + an editable reply instruction on top.
export function ReplyBlock({
  audience,
  onAudience,
  replyInstruction,
  onReplyInstruction,
}: {
  audience: string;
  onAudience: (a: string) => void;
  replyInstruction: string;
  onReplyInstruction: (v: string) => void;
}) {
  const { t } = useTranslation();
  const AUD: { key: string; label: MessageKey }[] = [
    { key: "fans", label: "scenarios.aud.fans" },
    { key: "all_except_trolls", label: "scenarios.aud.all" },
    { key: "questions", label: "scenarios.aud.questions" },
  ];
  return (
    <div className="flex flex-col gap-4">
      <Field label={t("scenarios.f.audience")} hint={t("scenarios.f.audience_hint")}>
        <div className="grid grid-cols-1 gap-1 rounded-lg border border-border bg-surface-2 p-1 text-small sm:grid-cols-3">
          {AUD.map((o) => {
            const active = o.key === audience;
            return (
              <button
                key={o.key}
                type="button"
                aria-pressed={active}
                onClick={() => onAudience(o.key)}
                className={cn(
                  "flex items-center justify-center whitespace-normal rounded-md px-2.5 py-2 text-center font-medium transition-colors max-md:min-h-[44px]",
                  active ? "bg-surface text-text shadow-sm" : "text-text-muted hover:text-text",
                )}
              >
                {t(o.label)}
              </button>
            );
          })}
        </div>
      </Field>
      <Field label={t("scenarios.sec.reply")} hint={t("scenarios.f.reply_hint")}>
        <textarea rows={3} className={TEXTAREA} value={replyInstruction} onChange={(e) => onReplyInstruction(e.target.value)} placeholder={t("scenarios.f.reply_ph")} />
      </Field>
    </div>
  );
}

// «Что зашьётся» — read-only proven rules the preset layers over the voice.
// Collapsed by default; a head row (lock + title + chevron) → rules + foot.
export function BakedRules({
  open,
  onToggle,
  rules,
}: {
  open: boolean;
  onToggle: () => void;
  rules: string[];
}) {
  const { t } = useTranslation();
  if (rules.length === 0) return null;
  return (
    <FormCard className="p-0 md:p-0">
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full items-center gap-2.5 px-5 py-4 text-left md:px-[22px]">
        <IcLock size={15} className="shrink-0 text-text-subtle" />
        <span className="text-small font-semibold">{t("scenarios.baked_title")}</span>
        <IcChevRight size={16} className={cn("ml-auto shrink-0 text-text-subtle transition-transform", open && "rotate-90")} />
      </button>
      {open && (
        <div className="flex flex-col gap-2 border-t border-border p-5 md:p-[22px]">
          {rules.map((r, i) => (
            <p key={i} className="flex items-start gap-2 text-small text-text-muted">
              <IcCheck size={15} className="mt-0.5 shrink-0 text-success" /> {r}
            </p>
          ))}
          <p className="mt-1 text-caption text-text-subtle">{t("scenarios.baked_foot")}</p>
        </div>
      )}
    </FormCard>
  );
}

// Power-user disclosure — «Показать как сценарий» (raw model fields). The old
// «Свой» as a disclosure inside the form, not a type.
export function PowerUserDisclosure({
  open,
  onToggle,
  instruction,
  onInstruction,
  embedded,
}: {
  open: boolean;
  onToggle: () => void;
  instruction: string;
  onInstruction: (v: string) => void;
  /** Inside a step body — render just the raw fields (no FormCard / head). */
  embedded?: boolean;
}) {
  const { t } = useTranslation();
  const fields = (
    <div className={cn("flex flex-col gap-4", !embedded && "border-t border-border p-5 md:p-[22px]")}>
      <RawField labelKey="scenarios.raw.when" subKey="scenarios.raw.when_sub" modelKey="когда">
        <select className={SELECT} aria-label={t("scenarios.raw.when")}>
          <option>{t("scenarios.raw.trig_daily")}</option>
          <option>{t("scenarios.raw.trig_every_n")}</option>
          <option>{t("scenarios.raw.trig_time")}</option>
          <option>{t("scenarios.raw.trig_comment")}</option>
          <option>{t("scenarios.raw.trig_mention")}</option>
        </select>
      </RawField>
      <RawField labelKey="scenarios.raw.if" subKey="scenarios.raw.if_sub" modelKey="если" optional>
        <select className={SELECT} aria-label={t("scenarios.raw.if")}>
          <option>{t("scenarios.raw.cond_none")}</option>
          <option>{t("scenarios.raw.cond_weekdays")}</option>
          <option>{t("scenarios.raw.cond_followers")}</option>
          <option>{t("scenarios.raw.cond_date")}</option>
          <option>{t("scenarios.raw.cond_positive")}</option>
        </select>
      </RawField>
      <RawField labelKey="scenarios.raw.generate" subKey="scenarios.raw.generate_sub" modelKey="сгенерировать">
        <select className={SELECT} aria-label={t("scenarios.raw.generate")}>
          <option>{t("scenarios.raw.act_post")}</option>
          <option>{t("scenarios.raw.act_reply")}</option>
          <option>{t("scenarios.raw.act_thread")}</option>
        </select>
      </RawField>
      <RawField labelKey="scenarios.raw.with" subKey="scenarios.raw.with_sub" modelKey="с инструкцией">
        <textarea rows={3} className={TEXTAREA} value={instruction} onChange={(e) => onInstruction(e.target.value)} placeholder={t("scenarios.f.instruction_ph")} />
      </RawField>
    </div>
  );
  if (embedded) return fields;
  return (
    <FormCard className="p-0 md:p-0">
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full items-center gap-2.5 px-5 py-4 text-left md:px-[22px]">
        <span className="text-small font-semibold">{t("scenarios.disclose_show")}</span>
        <span className="rounded-full border border-border bg-surface-2 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-text-subtle">
          {t("scenarios.disclose_for_pros")}
        </span>
        <IcChevRight size={16} className={cn("ml-auto shrink-0 text-text-subtle transition-transform", open && "rotate-90")} />
      </button>
      {open && fields}
    </FormCard>
  );
}

function RawField({
  labelKey,
  subKey,
  modelKey,
  optional,
  children,
}: {
  labelKey: MessageKey;
  subKey: MessageKey;
  modelKey: string;
  optional?: boolean;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex flex-wrap items-center gap-2 text-small font-semibold">
        <span className="rounded-sm border border-accent/30 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-accent">{modelKey}</span>
        {t(labelKey)}
        {optional && <span className="font-normal text-text-subtle">· {t("scenarios.raw.if_optional")}</span>}
      </span>
      {children}
      <span className="text-caption leading-relaxed text-text-subtle">{t(subKey)}</span>
    </label>
  );
}

// Promo-helper disclosure (the PRESERVED «Акция» rich editor). Head = gift +
// «Промо-помощник» + switch; ON → ask / reward / require-follow / require-like.
export function PromoHelper({
  on,
  promo,
  askErr,
  onToggle,
  onChange,
}: {
  on: boolean;
  promo: ScenarioPromoFields;
  askErr?: boolean;
  onToggle: (on: boolean) => void;
  onChange: (p: ScenarioPromoFields) => void;
}) {
  const { t } = useTranslation();
  const set = <K extends keyof ScenarioPromoFields>(k: K, v: ScenarioPromoFields[K]) => onChange({ ...promo, [k]: v });
  return (
    <div className={cn("rounded-md border bg-surface transition-colors", on ? "border-warning/40" : "border-border")}>
      <div className="flex items-center justify-between gap-3 p-3.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-md border", on ? "border-warning/30 bg-warning/10 text-warning" : "border-border bg-surface-2 text-text-muted")}>
            <IcGift size={16} />
          </span>
          <div className="min-w-0">
            <p className="text-small font-semibold">{t("scenarios.helper_title")}</p>
            {on && <p className="truncate text-caption text-text-subtle">{t("scenarios.helper_sub")}</p>}
          </div>
        </div>
        <Switch checked={on} onCheckedChange={onToggle} aria-label={t("scenarios.helper_title")} />
      </div>
      {on && (
        <div className="flex flex-col gap-4 border-t border-border p-3.5">
          <Field label={t("scenarios.f.ask")} hint={t("scenarios.f.ask_hint")} error={askErr ? t("scenarios.f.ask_err") : undefined}>
            <input className={cn(INPUT, askErr && "border-danger focus:border-danger focus:ring-danger/25")} value={promo.ask} onChange={(e) => set("ask", e.target.value)} placeholder={t("scenarios.f.ask_ph")} />
          </Field>
          <Field label={t("scenarios.f.reward")} hint={t("scenarios.f.reward_hint")}>
            <input className={INPUT} value={promo.reward} onChange={(e) => set("reward", e.target.value)} placeholder={t("scenarios.f.reward_ph")} />
          </Field>
          <div className="flex flex-col gap-1 border-t border-border pt-1.5">
            <ToggleRow icon={IcUsers} title={t("scenarios.f.require_follow")} sub={t("scenarios.f.require_follow_sub")} checked={promo.require_follow} onChange={(v) => set("require_follow", v)} />
            <ToggleRow icon={IcHeart} title={t("scenarios.f.require_like")} sub={t("scenarios.f.require_like_sub")} checked={promo.require_like} onChange={(v) => set("require_like", v)} />
          </div>
        </div>
      )}
    </div>
  );
}

function ToggleRow({ icon: Icon, title, sub, checked, onChange }: { icon: IconCmp; title: string; sub: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-4 border-t border-border py-3 first:border-t-0">
      <span className="min-w-0">
        <span className="flex items-center gap-1.5 text-small font-semibold">
          <Icon size={14} /> {title}
        </span>
        <span className="mt-0.5 block text-caption leading-relaxed text-text-subtle">{sub}</span>
      </span>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={title} />
    </label>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  PREVIEW + RUN-NOW (§10)
// ════════════════════════════════════════════════════════════════════════════

export type PreviewState = "promo" | "free" | "reply" | "loading" | "empty";

export function ScenarioPreview({
  state,
  preview,
  promo,
  primedCount,
  whenFires,
  canRunNow,
  running,
  runResult,
  onRunNow,
}: {
  state: PreviewState;
  preview: ScenarioPreviewT | null;
  promo: ScenarioPromoFields;
  primedCount?: number;
  whenFires?: string;
  canRunNow?: boolean;
  running?: boolean;
  runResult?: ScenarioRunNow | null;
  onRunNow?: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-caption font-semibold uppercase tracking-wide text-text-subtle">
          <IcSparkle size={13} /> {t("scenarios.preview")}
        </span>
      </div>
      <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
        {state === "loading" ? (
          <PreviewLoading />
        ) : state === "empty" ? (
          <PreviewEmpty />
        ) : state === "promo" ? (
          <PromoPreview cta={preview?.cta ?? ""} replyInstruction={promo.reply_instruction} />
        ) : state === "reply" ? (
          <ReplyPreview replyOn={(preview?.reply_instruction ?? "").length > 0} />
        ) : (
          <FreePreview samplePost={preview?.sample_post ?? ""} />
        )}
      </div>

      {/* primed-on honesty line */}
      {state !== "empty" && state !== "loading" && (
        <p className="inline-flex items-start gap-1.5 px-1 text-caption leading-relaxed text-text-subtle">
          <IcSparkle size={12} className="mt-0.5 shrink-0" />
          {t("scenarios.primed_on").replace("{n}", String(primedCount ?? 6))}
        </p>
      )}

      {/* when-fires */}
      {whenFires && state !== "empty" && (
        <p className="inline-flex items-center gap-1.5 px-1 text-caption text-text-subtle">
          <IcClock size={12} className="shrink-0" /> {t("scenarios.when_fires").replace("{when}", whenFires)}
        </p>
      )}

      {/* run-now bar */}
      {onRunNow && (
        <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-surface-2/60 p-3">
          <Button variant="secondary" onClick={onRunNow} loading={running} disabled={!canRunNow} icon={<IcPlay size={14} />} className="w-full">
            {t("scenarios.run_now")}
          </Button>
          <p className="text-caption leading-relaxed text-text-subtle">{t("scenarios.run_now_note")}</p>
        </div>
      )}

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
    </div>
  );
}

function MockAvatar({ initials }: { initials: string }) {
  return (
    <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-full border border-border bg-surface-2 text-caption font-semibold text-text-muted">
      {initials}
    </span>
  );
}

function PromoPreview({ cta, replyInstruction }: { cta: string; replyInstruction: string }) {
  const { t } = useTranslation();
  return (
    <>
      <div className="border-b border-border bg-warning/[0.06] px-[17px] py-[15px]">
        <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wide text-warning">{t("scenarios.preview_cta")}</p>
        <p className="text-small leading-relaxed text-text">{cta}</p>
      </div>
      <div className="px-[17px] py-[15px]">
        <div className="mb-2.5 flex items-center gap-2.5">
          <MockAvatar initials="А" />
          <div className="leading-tight">
            <p className="text-small font-semibold">Алекс</p>
            <p className="text-caption text-text-subtle">@alex.makes</p>
          </div>
          <span className="ml-auto text-caption text-text-subtle">9:00</span>
        </div>
        <p className="text-small leading-relaxed text-text">
          Сегодня разбираю ваши затыки ✍️ Напишите в комментариях, над чем вы сейчас застряли — пришлю короткий конкретный совет лично вам. Подпишитесь, чтобы не пропустить свой ответ.
        </p>
        <div className="mt-3 flex gap-4 text-caption text-text-subtle">
          <span className="inline-flex items-center gap-1"><IcEye size={13} /> 1,2K</span>
          <span className="inline-flex items-center gap-1"><IcHeart size={13} /> 84</span>
          <span className="inline-flex items-center gap-1"><IcBubble size={13} /> 37</span>
        </div>
      </div>
      <div className="border-t border-border bg-surface-2 px-[17px] py-3.5">
        <p className="mb-2.5 font-mono text-[10px] uppercase tracking-wide text-text-subtle">{t("scenarios.preview_sample_reply")}</p>
        <div className="flex gap-2.5">
          <MockAvatar initials="Д" />
          <div className="min-w-0">
            <p className="text-caption font-semibold text-text-muted">Дима</p>
            <p className="mt-0.5 text-small text-text-muted">Застрял на лендинге, не могу выбрать заголовок 🙏</p>
          </div>
        </div>
        <div className="relative mt-2.5 flex gap-2.5 pl-3 before:absolute before:bottom-1.5 before:left-[3px] before:top-0.5 before:w-0.5 before:rounded before:bg-border">
          <MockAvatar initials="А" />
          <div className="min-w-0">
            <p className="mb-0.5 flex items-center gap-1.5 text-caption font-semibold">
              Алекс
              <span className="inline-flex items-center gap-1 font-medium text-accent">
                <IcBubble size={11} /> {t("scenarios.preview_reply")}
              </span>
            </p>
            <p className="text-small leading-relaxed text-text">
              {replyInstruction
                ? "Дима, попробуйте написать заголовок как ответ на вопрос «что я получу за 10 секунд?» — и выберите самый конкретный из трёх вариантов. Скиньте варианты, помогу выбрать."
                : "Дима, спасибо, что написали! Гляну ваш случай и пришлю короткий конкретный совет совсем скоро 🙌"}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

function FreePreview({ samplePost }: { samplePost: string }) {
  return (
    <>
      <div className="px-[17px] py-[15px]">
        <div className="mb-2.5 flex items-center gap-2.5">
          <MockAvatar initials="А" />
          <div className="leading-tight">
            <p className="text-small font-semibold">Алекс</p>
            <p className="text-caption text-text-subtle">@alex.makes</p>
          </div>
          <span className="ml-auto text-caption text-text-subtle">12:00</span>
        </div>
        <p className="text-small leading-relaxed text-text">{samplePost}</p>
        <div className="mt-3 flex gap-4 text-caption text-text-subtle">
          <span className="inline-flex items-center gap-1"><IcEye size={13} /> 940</span>
          <span className="inline-flex items-center gap-1"><IcHeart size={13} /> 71</span>
          <span className="inline-flex items-center gap-1"><IcBubble size={13} /> 12</span>
        </div>
      </div>
    </>
  );
}

// Reply-duty preview — a sample comment → a substantive auto-reply (not a post).
function ReplyPreview({ replyOn }: { replyOn: boolean }) {
  const { t } = useTranslation();
  return (
    <div className="px-[17px] py-[15px]">
      <p className="mb-2.5 font-mono text-[10px] uppercase tracking-wide text-text-subtle">{t("scenarios.preview_sample_reply")}</p>
      <div className="flex gap-2.5">
        <MockAvatar initials="М" />
        <div className="min-w-0">
          <p className="text-caption font-semibold text-text-muted">Марина</p>
          <p className="mt-0.5 text-small text-text-muted">А если совсем нет сил начать?</p>
        </div>
      </div>
      <div className="relative mt-2.5 flex gap-2.5 pl-3 before:absolute before:bottom-1.5 before:left-[3px] before:top-0.5 before:w-0.5 before:rounded before:bg-border">
        <MockAvatar initials="А" />
        <div className="min-w-0">
          <p className="mb-0.5 flex items-center gap-1.5 text-caption font-semibold">
            Алекс
            <span className="inline-flex items-center gap-1 font-medium text-accent">
              <IcBubble size={11} /> {t("scenarios.preview_reply")}
            </span>
          </p>
          <p className="text-small leading-relaxed text-text">
            {replyOn
              ? "Марина, когда сил нет, цель не «сделать», а «начать на 5 минут» — почти всегда этого хватает, чтобы втянуться. С чего бы вы начали эти пять минут?"
              : "Марина, отлично, что спросили! Загляну к вам с конкретным ответом совсем скоро 🙌"}
          </p>
        </div>
      </div>
    </div>
  );
}

function PreviewLoading() {
  return (
    <div className="flex flex-col gap-2.5 p-[17px]">
      <span className="h-3 w-2/5 animate-pulse rounded bg-surface-2" />
      <span className="h-3.5 w-full animate-pulse rounded bg-surface-2" />
      <span className="h-3.5 w-[92%] animate-pulse rounded bg-surface-2" />
      <span className="h-3.5 w-3/5 animate-pulse rounded bg-surface-2" />
      <span className="mt-1.5 h-16 w-full animate-pulse rounded-md bg-surface-2" />
    </div>
  );
}

function PreviewEmpty() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-1.5 px-[22px] py-[34px] text-center text-text-subtle">
      <span className="mb-1 grid h-10 w-10 place-items-center rounded-md border border-border bg-surface-2">
        <IcSparkle size={20} />
      </span>
      <p className="max-w-[30ch] text-caption leading-relaxed">{t("scenarios.preview_empty")}</p>
    </div>
  );
}

// ── delete confirm (phone bottom-sheet; desktop uses an inline confirm) ──
// Confirm dialog shown when TURNING A SCENARIO ON — the «сохранил ≠ работает»
// + auto-reply-surprise fix. Says plainly what enabling will do (publish posts
// vs reply to real people), flags the account autopost gate when it's off, and
// only then flips it on. Turning OFF is harmless and skips this.
// The «момент включения» (§8) — not a silent toggle. A mode pick («Спроси меня»
// default / «Публиковать автоматически»), with an inline autopost gate for post
// scenarios when account autopublish is off, and a consent checkbox for reply
// scenarios going fully automatic.
export function EnableConfirm({
  scenario,
  postAutopilotOn,
  handle = "@you",
  busy,
  onConfirm,
  onCancel,
}: {
  scenario: Scenario | null;
  postAutopilotOn: boolean;
  handle?: string;
  busy: boolean;
  onConfirm: (mode: PublishMode, opts: { enableAutopost: boolean }) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<PublishMode>("ask");
  const [consent, setConsent] = useState(false);
  const [enableAutopost, setEnableAutopost] = useState(false);
  if (!scenario) return null;
  const sentence = deriveSentence(t, scenario, handle);
  const isReply = sentence.kind === "reply";
  const showGate = !isReply && mode === "auto" && !postAutopilotOn;
  const needConsent = isReply && mode === "auto";
  const blocked = (needConsent && !consent) || (showGate && !enableAutopost);
  return (
    <div
      className="fixed inset-0 z-40 grid place-items-center bg-ink-950/55 p-6 backdrop-blur-sm max-md:items-end max-md:p-0"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="w-full max-w-[480px] rounded-2xl border border-border bg-surface p-6 shadow-lg max-md:max-w-none max-md:rounded-b-none max-md:rounded-t-2xl max-md:pb-[calc(env(safe-area-inset-bottom)+20px)]">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-success/28 bg-success/12 text-success">
            {isReply ? <IcReplies size={18} /> : <IcRepeat size={18} />}
          </span>
          <div className="min-w-0">
            <h2 className="text-h3 font-semibold [text-wrap:balance]">{t("scenarios.enable_title").replace("{name}", scenario.name)}</h2>
            <Sentence template={sentence.template} slots={sentence.slots} variant="card" className="mt-1" />
          </div>
        </div>

        {/* mode pick */}
        <div className="mt-[18px] flex flex-col gap-2.5">
          <ModeOption
            active={mode === "ask"}
            tone="ask"
            title={t("scenarios.enable.ask_title")}
            badge={t("scenarios.enable.default_badge")}
            sub={isReply ? t("scenarios.enable.ask_reply_sub") : t("scenarios.enable.ask_post_sub")}
            onPick={() => setMode("ask")}
          />
          <ModeOption
            active={mode === "auto"}
            tone="auto"
            title={t("scenarios.enable.auto_title")}
            sub={isReply ? t("scenarios.enable.auto_reply_sub") : t("scenarios.enable.auto_post_sub")}
            onPick={() => setMode("auto")}
          />
        </div>

        {/* inline autopost gate — post + auto + account autopublish off */}
        {showGate && (
          <div className="mt-3.5 rounded-md border border-warning/28 bg-warning/[0.08] p-3.5">
            <div className="flex items-start gap-2.5">
              <IcBolt size={16} className="mt-0.5 shrink-0 text-warning" />
              <div className="min-w-0">
                <p className="text-small font-semibold text-text">{t("scenarios.enable.gate_title")}</p>
                <p className="mt-0.5 text-caption leading-relaxed text-text-muted">{t("scenarios.enable.gate_body").replace("{handle}", handle)}</p>
              </div>
            </div>
            <label className="mt-2.5 flex items-center justify-between gap-3 text-small font-medium text-text">
              <span>{t("scenarios.enable.gate_toggle").replace("{handle}", handle)}</span>
              <Switch checked={enableAutopost} onCheckedChange={setEnableAutopost} aria-label={t("scenarios.enable.gate_toggle").replace("{handle}", handle)} />
            </label>
          </div>
        )}

        {/* reactive consent — reply + auto */}
        {needConsent && (
          <label className="mt-3.5 flex items-start gap-2.5 rounded-md border border-accent/24 bg-accent/[0.07] p-3.5">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 h-[18px] w-[18px] shrink-0 rounded border-border accent-accent"
            />
            <span className="text-small leading-relaxed text-text">{t("scenarios.enable.reply_consent")}</span>
          </label>
        )}

        <div className="mt-[22px] flex justify-end gap-2.5 max-md:flex-col-reverse">
          <button onClick={onCancel} disabled={busy} className={cn(buttonClasses({ variant: "ghost" }), "max-md:min-h-[44px] max-md:w-full")}>
            {t("common.cancel")}
          </button>
          <Button
            variant="primary"
            loading={busy}
            disabled={blocked}
            onClick={() => onConfirm(mode, { enableAutopost })}
            icon={<IcCheck size={15} />}
            className="max-md:min-h-[44px] max-md:w-full"
          >
            {t("scenarios.turn_on")}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ModeOption({
  active,
  tone,
  title,
  badge,
  sub,
  onPick,
}: {
  active: boolean;
  tone: "ask" | "auto";
  title: string;
  badge?: string;
  sub: string;
  onPick: () => void;
}) {
  const auto = tone === "auto";
  return (
    <button
      type="button"
      onClick={onPick}
      aria-pressed={active}
      className={cn(
        "flex items-start gap-3 rounded-lg border bg-surface p-3.5 text-left transition-colors",
        active
          ? auto
            ? "border-warning bg-warning/[0.06] ring-1 ring-warning"
            : "border-accent bg-accent/[0.06] ring-1 ring-accent"
          : "border-border hover:border-text/20",
      )}
    >
      <span className={cn("mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2", active ? (auto ? "border-warning" : "border-accent") : "border-border")}>
        {active && <span className={cn("h-2.5 w-2.5 rounded-full", auto ? "bg-warning" : "bg-accent")} />}
      </span>
      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-2 text-small font-semibold text-text">
          {title}
          {badge && (
            <span className="rounded-full border border-success/30 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.04em] text-success">{badge}</span>
          )}
        </span>
        <span className="mt-0.5 block text-caption leading-relaxed text-text-muted">{sub}</span>
      </span>
    </button>
  );
}

export function DeleteConfirm({
  open,
  deleting,
  onClose,
  onConfirm,
}: {
  open: boolean;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-40 grid place-items-center bg-ink-950/55 p-6 backdrop-blur-sm max-md:items-end max-md:p-0"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-[420px] rounded-2xl border border-border bg-surface p-6 shadow-lg max-md:max-w-none max-md:rounded-b-none max-md:rounded-t-2xl max-md:pb-[calc(env(safe-area-inset-bottom)+20px)]">
        <div className="flex items-start gap-3">
          <span className="grid h-[38px] w-[38px] place-items-center rounded-md border border-danger/28 bg-danger/12 text-danger">
            <IcTrash size={18} />
          </span>
          <div>
            <h2 className="text-h3 font-semibold">{t("scenarios.delete_confirm")}</h2>
            <p className="mt-1 text-small text-text-muted">{t("scenarios.delete_confirm_sub")}</p>
          </div>
        </div>
        <div className="mt-[22px] flex justify-end gap-2.5 max-md:flex-col-reverse">
          <button onClick={onClose} disabled={deleting} className={cn(buttonClasses({ variant: "ghost" }), "max-md:min-h-[44px] max-md:w-full")}>
            {t("common.cancel")}
          </button>
          <Button variant="danger" loading={deleting} onClick={onConfirm} icon={<IcCheck size={15} />} className="max-md:min-h-[44px] max-md:w-full">
            {t("scenarios.delete")}
          </Button>
        </div>
      </div>
    </div>
  );
}
