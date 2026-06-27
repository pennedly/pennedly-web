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

import type {
  PresetField,
  ScenarioCreate,
  ScenarioPreset,
  ScenarioPromoFields,
} from "@/lib/types";
import type { WhenMode } from "./ScenariosParts";

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
  // КОГДА
  when: WhenMode;
  nDays: number;
  weekday: number;
  dateFrom: string;
  dateTo: string;
  threshold: string; // amplify_viral views threshold (blank = auto)
  // POST routines only — local time-of-day + publish jitter for the cadence
  // modes. Sent to the backend as trigger_cfg.hour / trigger_cfg.jitter_minutes
  // (see buildTrigger / compileBody); ignored for event/reply/promo shapes.
  hour: string; // hour-of-day, e.g. "9:00"
  jitter: number; // ± minutes of random spread (0 = exact)
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
// side, so we only attach them here for these.
const SCHEDULE_KINDS = new Set(["daily_first_post", "every_n_days", "weekly"]);

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
    case "event":
      // reactive — keep the preset's event trigger, apply the optional threshold
      if ((base.kind as string) === "on_metric_threshold") {
        const th = Number(s.threshold);
        return s.threshold.trim() && th > 0 ? { kind: "on_metric_threshold", threshold_views: th } : { kind: "on_metric_threshold" };
      }
      return { ...base };
    case "date_range":
    case "daily":
    default:
      return withSchedule({ kind: "daily_first_post" });
  }
}

// Build the condition_cfg from the preset base + the КОГДА choice + any
// condition-mapped fields (not_before / active_from / active_to).
function buildCondition(s: FormState): Record<string, unknown> | null {
  const cond: Record<string, unknown> = { ...(s.preset?.condition_cfg ?? {}) };
  // date_range → active_from / active_to guard
  if (s.when === "date_range") {
    cond.once_per_day = true;
    if (s.dateFrom) cond.active_from = s.dateFrom;
    if (s.dateTo) cond.active_to = s.dateTo;
  }
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
  const instruction = interpolate(s.instruction, s.fields).trim();
  return {
    name,
    trigger: buildTrigger(s),
    instruction,
    reply_instruction: s.replyInstruction.trim(),
    condition: buildCondition(s),
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
