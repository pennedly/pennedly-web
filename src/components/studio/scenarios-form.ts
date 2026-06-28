// Pure helpers that compile the unified Scenarios form into the create/update
// body the existing backend accepts (the «рутинный автопилот» model). A scenario
// is ONE of three shapes — promo / reply_policy / free (trigger + instruction +
// condition) — resolved on a single fork, NEVER sending `template`.
//
// The preset's `fields[]` each declare a `maps_to` slot:
//   "instruction"          → interpolate {key} into the baked instruction text
//   "condition_cfg.<key>"  → set the resolved condition_cfg slot
//   "trigger_cfg.<key>"    → set the resolved trigger_cfg slot
//   "action_cfg.<key>"     → set the resolved action_cfg slot (reply audience)
// This module turns the edited field values + the КОГДА choice into that shape.

import type { MessageKey } from "@/lib/i18n";
import type {
  PresetField,
  PublishMode,
  ScenarioCreate,
  ScenarioPreset,
  ScenarioPromoFields,
} from "@/lib/types";
import type { WhenMode } from "./ScenariosParts";

// «Recipe» content shaping — the КАК-длинно/тема/призыв choices fold into the
// generation instruction (Wave 1: no new backend fields, decision §6.2).
export type RecipeLength = "short" | "medium" | "any";
export type CooldownUnit = "hours" | "days";
// The reactive event kind the recipe «По событию» mode targets (Wave 1: views
// threshold or follower milestone — NOT mentions, which need a new engine).
export type RecipeEvent = "on_metric_threshold" | "on_follower_milestone";

// ── Wave 3 «Раз в месяц» / «Раз в год» ──
// A single (day, month) anchor for the yearly cadence (month is 0-indexed, so
// it aligns with `MONTHS` / `daysInMonth`; the trigger_cfg shape sends 1-based).
export type MonthDate = { day: number; month: number };
// What to do when a chosen day-of-month (29–31) is absent from a short month.
export type MonthlyMissing = "last" | "skip";

// Months in the genitive case (the design's RU copy «1 января», «29 февраля»).
export const MONTHS: MessageKey[] = [
  "scenarios.rc.month.jan",
  "scenarios.rc.month.feb",
  "scenarios.rc.month.mar",
  "scenarios.rc.month.apr",
  "scenarios.rc.month.may",
  "scenarios.rc.month.jun",
  "scenarios.rc.month.jul",
  "scenarios.rc.month.aug",
  "scenarios.rc.month.sep",
  "scenarios.rc.month.oct",
  "scenarios.rc.month.nov",
  "scenarios.rc.month.dec",
];
// Real day count per month (index 0 = January). February shows 29 so Feb-29 is
// pickable (leap-only — the note warns, the engine doesn't block it).
const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
export function daysInMonth(mi: number): number {
  return DAYS_IN_MONTH[mi] ?? 31;
}

// The editable form state (everything the editor owns).
export type FormState = {
  name: string;
  preset: ScenarioPreset | null; // null = from scratch (free)
  helperOn: boolean; // «Акция» rich editor open (campaign preset)
  promo: ScenarioPromoFields;
  // free instruction (baked text from the preset, OR a from-scratch instruction)
  instruction: string;
  replyInstruction: string;
  audience: string; // reply audience (reply_policy / reply presets)
  // a free «Свой вариант» audience description (reply_policy custom audience)
  audiencePrompt: string;
  // КОГДА
  when: WhenMode;
  nDays: number;
  weekday: number;
  // «Раз в месяц» — selected days-of-month (1–31), the «Последний день месяца»
  // toggle, and what to do when a 29–31 day is missing from a short month.
  monthlyDays: number[];
  monthlyLastDay: boolean;
  monthlyOnMissing: MonthlyMissing;
  // «Раз в год» — a list of (day, month) anniversaries (months 0-indexed here).
  yearlyDates: MonthDate[];
  dateFrom: string;
  dateTo: string;
  threshold: string; // amplify_viral views threshold (blank = auto)
  // The reactive event kind chosen in the recipe «По событию» mode. Defaults to
  // the preset's event kind so an existing reactive scenario round-trips.
  eventKind: RecipeEvent;
  // POST routines only — local time-of-day + publish jitter for the cadence
  // modes. Sent to the backend as trigger_cfg.hour / trigger_cfg.jitter_minutes
  // (see buildTrigger / compileBody); ignored for event/reply/promo shapes.
  hour: string; // hour-of-day, e.g. "9:00"
  jitter: number; // ± minutes of random spread (0 = exact)
  // ── ЕСЛИ — the recipe condition builder (Wave 1: 3 honest conditions) ──
  condNoPostToday: boolean; // → condition_cfg.only_if_no_post_today
  cooldownOn: boolean;
  cooldownValue: number; // → condition_cfg.cooldown_hours | cooldown_days
  cooldownUnit: CooldownUnit;
  maxFiresOn: boolean;
  maxFires: number; // → condition_cfg.max_fires
  // ── ЧТО — content shaping that folds into the instruction (POST) ──
  topic: string; // «Тема дня» (optional; blank → Pennedly picks)
  length: RecipeLength; // «Длина и формат»
  cta: string; // «Призыв в конце» (optional)
  // ── КАК — who confirms before it publishes (the КАК slot → publish_mode) ──
  mode: PublishMode;
  // per-field text values, keyed by field.key (text/textarea/options)
  fields: Record<string, string>;
};

// Interpolate the preset's baked instruction with the edited field values.
// {topic} etc. — a blank optional field is left as a neutral phrase so the
// instruction still reads (the backend inherits the account default).
export function interpolate(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_m, key: string) => {
    const v = values[key];
    return v && v.trim() ? v.trim() : `{${key}}`;
  });
}

// The cadence POST trigger kinds that carry an explicit schedule «Время» (hour)
// + «Разброс минут» (jitter). MUST match the backend's TRIGGER_SCHEDULE_KINDS
// (api/scenarios.py): a present hour/jitter on any OTHER kind is dropped server-
// side, so we only attach them here for these. Wave 3 adds monthly / yearly.
const SCHEDULE_KINDS = new Set(["daily_first_post", "every_n_days", "weekly", "monthly", "yearly"]);

// Parse the editor's "H:MM" hour string into a whole hour 0–23, or null if it
// isn't a valid in-range hour (the backend validates 0–23 → 422 otherwise).
function parseHour(v: string): number | null {
  const h = Number(v.split(":")[0]);
  return Number.isInteger(h) && h >= 0 && h <= 23 ? h : null;
}

// Build the trigger_cfg from the КОГДА choice + the preset's base trigger (so a
// reactive preset keeps its event kind / targets). For a cadence POST kind we
// also fold in the schedule hour + jitter (the backend stores them in
// trigger_cfg and gates the next-run on them); they're omitted for event kinds.
function buildTrigger(s: FormState): Record<string, unknown> {
  const base = s.preset?.trigger_cfg ?? {};
  const withSchedule = (trigger: Record<string, unknown>): Record<string, unknown> => {
    if (!SCHEDULE_KINDS.has(trigger.kind as string)) return trigger;
    const hour = parseHour(s.hour);
    const jitter = Number.isInteger(s.jitter) ? Math.min(120, Math.max(0, s.jitter)) : 0;
    return { ...trigger, ...(hour !== null ? { hour } : {}), jitter_minutes: jitter };
  };
  switch (s.when) {
    case "every_n_days":
      return withSchedule({ kind: "every_n_days", n: s.nDays });
    case "weekly":
      return withSchedule({ kind: "weekly", weekday: s.weekday });
    case "monthly": {
      // «Раз в месяц» — selected days-of-month (deduped, sorted, 1–31) + the
      // «Последний день месяца» flag + the missing-day fallback. `on_missing` is
      // always sent (the W3 shape mandates it); the UI only surfaces the select
      // when a day > 28 is chosen, defaulting to "last".
      const days = Array.from(new Set(s.monthlyDays.filter((d) => Number.isInteger(d) && d >= 1 && d <= 31))).sort((a, b) => a - b);
      return withSchedule({
        kind: "monthly",
        days,
        last_day: !!s.monthlyLastDay,
        on_missing: s.monthlyOnMissing === "skip" ? "skip" : "last",
      });
    }
    case "yearly": {
      // «Раз в год» — (day, month) anchors. Months are 1-based in the cfg shape
      // (0-indexed in the form); each day is clamped to its month's real length.
      const dates = s.yearlyDates
        .filter((d) => Number.isInteger(d.month) && d.month >= 0 && d.month <= 11 && Number.isInteger(d.day) && d.day >= 1)
        .map((d) => ({ day: Math.min(d.day, daysInMonth(d.month)), month: d.month + 1 }));
      return withSchedule({ kind: "yearly", dates });
    }
    case "event": {
      // reactive — the recipe chooses the event kind (views / followers). Keep
      // the preset's base targets (the milestone ladder) when present.
      if (s.eventKind === "on_metric_threshold") {
        const th = Number(s.threshold);
        return s.threshold.trim() && th > 0
          ? { kind: "on_metric_threshold", threshold_views: th }
          : { kind: "on_metric_threshold" };
      }
      // follower milestone — preserve the preset's `targets` ladder if any.
      return (base.kind as string) === "on_follower_milestone" ? { ...base } : { kind: "on_follower_milestone" };
    }
    case "date_range":
    case "daily":
    default:
      return withSchedule({ kind: "daily_first_post" });
  }
}

// Build the condition_cfg from the preset base + the КОГДА choice + the recipe
// condition builder + any condition-mapped fields (not_before / dates).
function buildCondition(s: FormState): Record<string, unknown> | null {
  const cond: Record<string, unknown> = { ...(s.preset?.condition_cfg ?? {}) };
  // date_range → active_from / active_to guard
  if (s.when === "date_range") {
    cond.once_per_day = true;
    if (s.dateFrom) cond.active_from = s.dateFrom;
    if (s.dateTo) cond.active_to = s.dateTo;
  }
  // recipe condition builder (only_if_no_post_today / cooldown / max_fires).
  // Each only appears when its row is active, so a scenario without conditions
  // compiles to the preset's base condition_cfg unchanged (round-trip safe).
  if (s.condNoPostToday) cond.only_if_no_post_today = true;
  if (s.cooldownOn && s.cooldownValue > 0) {
    if (s.cooldownUnit === "days") cond.cooldown_days = s.cooldownValue;
    else cond.cooldown_hours = s.cooldownValue;
  }
  if (s.maxFiresOn && s.maxFires > 0) cond.max_fires = s.maxFires;
  // condition-mapped fields (e.g. safety_net not_before)
  for (const f of s.preset?.fields ?? []) {
    if (f.maps_to.startsWith("condition_cfg.")) {
      const key = f.maps_to.slice("condition_cfg.".length);
      const v = s.fields[f.key];
      if (v && v.trim()) cond[key] = v.trim();
    }
  }
  return Object.keys(cond).length > 0 ? cond : null;
}

// Fold the recipe «Тема дня» / «Длина и формат» / «Призыв в конце» onto the base
// instruction (Wave 1: no structured generation fields — they ride in the prompt
// text the backend already accepts). Each clause is appended only when set, so
// a scenario with none reproduces the bare instruction.
function compileInstruction(s: FormState): string {
  let base = interpolate(s.instruction, s.fields).trim();
  const extra: string[] = [];
  // Topic — only when the preset has NO {topic} slot already consumed it.
  const hasTopicSlot = /\{topic\}/.test(s.instruction);
  if (s.topic.trim() && !hasTopicSlot) extra.push(`Тема: ${s.topic.trim()}.`);
  if (s.length === "short") extra.push("Длина: коротко.");
  else if (s.length === "medium") extra.push("Длина: средне.");
  if (s.cta.trim()) extra.push(`Заверши призывом: ${s.cta.trim()}.`);
  if (extra.length === 0) return base;
  return base ? `${base} ${extra.join(" ")}` : extra.join(" ");
}

// Compile the full create body. Three forks: promo / reply_policy / free.
export function compileBody(s: FormState): ScenarioCreate {
  const name = s.name.trim();
  // hour + jitter are folded into the cadence trigger by buildTrigger (the
  // backend now persists trigger_cfg.hour / trigger_cfg.jitter_minutes).

  // 1) campaign / «Акция» → the promo helper owns the shape.
  if (s.helperOn || s.preset?.id === "promo") {
    return {
      name,
      promo: { ...s.promo, schedule: s.nDays > 0 && s.when === "every_n_days" ? "every_n_days" : "daily", n_days: s.nDays, reply_instruction: s.replyInstruction },
    };
  }

  // 2) reply duty → a standalone reply_policy (no post).
  if (s.preset && (s.preset.action_cfg?.kind as string) === "reply_policy") {
    const rd = s.preset.reply_defaults || {};
    return {
      name,
      reply_policy: {
        audience: s.audience || (rd.audience as string) || "all_except_trolls",
        max_per_day: (rd.max_per_day as number) ?? 60,
        skip_low_value: rd.skip_low_value !== false,
      },
      reply_instruction: s.replyInstruction.trim() || s.preset.reply_instruction,
    };
  }

  // 3) free / cadence preset → raw trigger + instruction (+ optional condition +
  // optional reply_instruction for reply-producing presets).
  return {
    name,
    trigger: buildTrigger(s),
    instruction: compileInstruction(s),
    reply_instruction: s.replyInstruction.trim(),
    condition: buildCondition(s),
    publish_mode: s.mode,
  };
}

// The «Что зашьётся» read-only proven rules per preset (i18n keys). These are
// the trust-building rules Pennedly layers over the voice — display only.
export const BAKED_RULE_KEYS: Record<string, string[]> = {
  daily_question: ["scenarios.baked.dq_1", "scenarios.baked.dq_2", "scenarios.baked.dq_3"],
  rubric: ["scenarios.baked.rub_1", "scenarios.baked.rub_2"],
  reply_duty: ["scenarios.baked.rd_1", "scenarios.baked.rd_2", "scenarios.baked.rd_3"],
  safety_net: ["scenarios.baked.sn_1", "scenarios.baked.sn_2"],
  milestone_thanks: ["scenarios.baked.ms_1", "scenarios.baked.ms_2"],
  seasonal: ["scenarios.baked.se_1", "scenarios.baked.se_2"],
  poll: ["scenarios.baked.po_1", "scenarios.baked.po_2"],
  amplify_viral: ["scenarios.baked.av_1", "scenarios.baked.av_2"],
  promo: ["scenarios.baked.pr_1", "scenarios.baked.pr_2", "scenarios.baked.pr_3"],
};

// Which preset fields render as form inputs (text/textarea/options) vs. are
// handled by the КОГДА segment (cadence/weekday/date) or reply block (audience).
export function visibleFields(preset: ScenarioPreset | null): PresetField[] {
  if (!preset) return [];
  return preset.fields.filter((f) => {
    if (f.kind === "cadence" || f.kind === "weekday" || f.kind === "date") return false;
    if (f.maps_to === "action_cfg.audience") return false; // reply audience → ReplyBlock
    if (f.maps_to === "trigger_cfg.threshold_views") return false; // → КОГДА event row
    if (f.maps_to === "trigger_cfg.targets") return false; // milestone ladder — pre-filled, advanced
    if (f.maps_to.startsWith("condition_cfg.")) return false; // → КОГДА (not_before/dates)
    return true; // instruction-mapped fields (topic / rubric / theme / question / options)
  });
}
