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
  ScenarioBoost,
  ScenarioBoostTarget,
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

// ── Boost («Комментарий-добавка при росте поста») — the editor-side state ──────
// A boost is its own scenario kind (NOT a КОГДА mode): when a watched post's
// metric crosses a threshold, Pennedly appends a pre-written comment to it. The
// FormState carries `isBoost` (this scenario IS a boost) + the three config
// pieces (metric / threshold / comment) + the TARGET (which posts it watches).
// `compileBody` turns these into the backend `boost` object; only the target
// differs across the 3 entry points (explicit picker in A, locked in B/C).
export type BoostMetric = "comments" | "likes" | "views";
// The target a boost watches. `all` = every recent account post; `scenario` =
// posts a publisher scenario produced (needs a scenario id); `post` = one post
// (needs a posts.id). Mirrors backend BOOST_TARGET_TYPES exactly. (The v2 design
// also sketches a 4th «по условию» target — NOT backend-backed, so omitted.)
export type BoostTargetType = "all" | "scenario" | "post";

// Per-metric default threshold + quick presets (the design's metric tiles:
// просмотры→5000, лайки→200, комментарии→50). Used to seed the threshold when the
// metric changes and to render the quick-preset chips.
export const BOOST_DEFAULT_THRESHOLD: Record<BoostMetric, number> = {
  views: 5000,
  likes: 200,
  comments: 50,
};
export const BOOST_PRESETS: Record<BoostMetric, number[]> = {
  views: [1000, 5000, 10000, 50000],
  likes: [100, 200, 500, 1000],
  comments: [20, 50, 100, 200],
};
export const BOOST_COMMENT_MAX = 500; // mirrors backend _BOOST_COMMENT_MAX_LEN

// The boost FormState defaults — spread into every FormState construction site
// (freshForm / openEditor / gallery) so a non-boost scenario carries inert boost
// fields (isBoost=false → compileBody never emits `boost`) and the four sites
// never drift. A boost editor/preset overrides `isBoost` (+ entry/target) on top.
export const BOOST_FORM_DEFAULTS = {
  isBoost: false,
  boostMetric: "views" as BoostMetric,
  boostThreshold: "",
  boostComment: "",
  boostTargetType: "all" as BoostTargetType,
  boostScenarioId: 0,
  boostPostId: 0,
  boostEntry: "a" as "a" | "studio" | "scenario",
  // entry C — attached-boost (on a post scenario) defaults; inert unless toggled.
  attachBoostOn: false,
  attachBoostMetric: "views" as BoostMetric,
  attachBoostThreshold: "",
  attachBoostComment: "",
};

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

// The design's default per-weekday post times for the «Разное время в разные дни»
// editor: Mon=8, Tue–Thu=9, Fri=12, Sat/Sun=none (the recipe-editor.js
// `['8:00','9:00','9:00','9:00','12:00','—','—']`). A weekday absent here = no
// post; used to seed a row when a selected day has no times yet.
export const PER_DAY_DEFAULT: Record<number, number[]> = { 0: [8], 1: [9], 2: [9], 3: [9], 4: [12] };

// Reconstruct the form's `perDayTimes` map (number keys) from a saved scenario's
// `per_day_times` (string-keyed "0".."6", hour lists). Each list is deduped/sorted
// + range-clamped; an explicit empty list is kept (= "no post that day"). Returns
// null when the cfg carries no usable per-day map (→ the toggle stays OFF).
export function perDayTimesFromCfg(raw: unknown): Record<number, number[]> | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const out: Record<number, number[]> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const wd = Number(k);
    if (!Number.isInteger(wd) || wd < 0 || wd > 6 || !Array.isArray(v)) continue;
    out[wd] = normalizeHours((v as unknown[]).filter((h): h is number => typeof h === "number"));
  }
  return Object.keys(out).length > 0 ? out : null;
}

// A scenario is a boost when its trigger is the reactive `on_post_metric` kind
// (the backend stores it that way; the action is `boost_comment`). Shared by the
// page's openEditor + matchPreset so a saved boost reopens in the boost editor.
export function isBoostScenario(
  trigger: Record<string, unknown> | null | undefined,
  action: Record<string, unknown> | null | undefined,
): boolean {
  return (trigger?.kind as string) === "on_post_metric" || (action?.kind as string) === "boost_comment";
}

// Reconstruct the boost form fields from a saved scenario's resolved trigger_cfg
// + action_cfg (the backend's `on_post_metric` / `boost_comment` shapes). Returns
// the metric/threshold/comment + target so editing + re-saving round-trips. A
// missing/garbage value falls back to a sane default (the worker reads these
// permissively too). Months/ids that don't parse → "all" / 0 (no id picked).
export type BoostFromCfg = {
  metric: BoostMetric;
  threshold: string;
  comment: string;
  targetType: BoostTargetType;
  scenarioId: number;
  postId: number;
};
export function boostFromCfg(
  trigger: Record<string, unknown> | null | undefined,
  action: Record<string, unknown> | null | undefined,
): BoostFromCfg {
  const rawMetric = trigger?.metric;
  const metric: BoostMetric =
    rawMetric === "comments" || rawMetric === "likes" || rawMetric === "views" ? rawMetric : "views";
  const th = trigger?.threshold;
  const threshold = typeof th === "number" && Number.isFinite(th) && th >= 1 ? String(Math.floor(th)) : "";
  const comment = typeof action?.comment_text === "string" ? (action.comment_text as string) : "";
  const tgt = (trigger?.target ?? {}) as Record<string, unknown>;
  const ttype = tgt.type;
  let targetType: BoostTargetType = "all";
  let scenarioId = 0;
  let postId = 0;
  if (ttype === "scenario" && Number.isInteger(tgt.scenario_id) && (tgt.scenario_id as number) > 0) {
    targetType = "scenario";
    scenarioId = tgt.scenario_id as number;
  } else if (ttype === "post" && Number.isInteger(tgt.post_id) && (tgt.post_id as number) > 0) {
    targetType = "post";
    postId = tgt.post_id as number;
  }
  return { metric, threshold, comment, targetType, scenarioId, postId };
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
  // every_n_days «Начиная с» — optional ISO "YYYY-MM-DD" start anchor (may be
  // empty → the backend starts the interval from "now").
  startDate: string;
  // weekly — the selected weekdays (0=Mon..6=Sun, multi-select). The design
  // default is Mon–Fri ([0,1,2,3,4]); an existing single-weekday scenario seeds
  // this from its `weekday` (see openEditor).
  weekdays: number[];
  // weekly «Разное время в разные дни» — when ON, each SELECTED weekday gets its
  // own time-slot list (the shared `hours` no longer applies). The map is keyed
  // by the weekday index (0=Mon..6=Sun); a weekday with an empty list (or absent
  // from the map) = no post that day. OFF → the shared `hours` applies to every
  // selected weekday (the back-compat path). Emitted as trigger_cfg.per_day_times
  // (string keys "0".."6") only when ON; reconstructed from a saved scenario.
  perDay: boolean;
  perDayTimes: Record<number, number[]>;
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
  // ── Boost («Комментарий-добавка при росте поста») ──
  // `isBoost` ⇒ this scenario is a reactive boost: the editor swaps in the boost
  // sentence/slots and compileBody emits the `boost` object (NOT a free trigger).
  // The other boost* fields are the config; `boostTarget*` is which posts it
  // watches (locked to "post"/"scenario" in entry points B/C, a picker in A).
  isBoost: boolean;
  boostMetric: BoostMetric;
  boostThreshold: string; // numeric string (blank → the metric's default)
  boostComment: string; // the pre-written comment (≤500, non-empty to save)
  boostTargetType: BoostTargetType;
  // The chosen ids for the scenario/post targets (0 = none picked yet). For entry
  // points B/C these are seeded + locked from context; in A the user picks them.
  boostScenarioId: number;
  boostPostId: number;
  // The entry point — drives whether the target slot is an explicit picker ("a")
  // or a locked plaque ("studio" = this post, "scenario" = this scenario's posts).
  boostEntry: "a" | "studio" | "scenario";
  // ── Entry C — an ATTACHED boost on a POST scenario ──
  // A post-scenario (isBoost=false) may carry a «Бустер» section in its editor:
  // when ON, saving ALSO creates a SEPARATE boost scenario watching THIS
  // scenario's posts (target {type:"scenario", scenario_id:<this id>}). The config
  // is the same metric/threshold/comment; the target is implicit (this scenario).
  // These fields are inert unless `attachBoostOn` is true on a post scenario.
  attachBoostOn: boolean;
  attachBoostMetric: BoostMetric;
  attachBoostThreshold: string;
  attachBoostComment: string;
  // POST routines only — local time-of-day + publish jitter for the cadence
  // modes. Sent to the backend as trigger_cfg.hour / trigger_cfg.jitter_minutes
  // (see buildTrigger / compileBody); ignored for event/reply/promo shapes.
  hour: string; // primary hour-of-day, e.g. "9:00" (= the first slot; drives the
  // sentence/runs single-time display + the back-compat single-`hour` emit).
  // ── Wave 2 «несколько раз в день» — the full slot list (local hours 0–23,
  // length ≥ 1; the first entry mirrors `hour`). ONE slot → emit the single
  // trigger_cfg.hour (the once/day back-compat path); 2+ slots → emit
  // trigger_cfg.hours[] (deduped/sorted) and DROP `hour` (the worker then fires
  // once per slot/day). Jitter stays one value for the whole scenario.
  hours: number[];
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

// Normalize the slot list to deduped, sorted whole hours in [0, 23] (matches the
// backend's `_validate_trigger_hours`, so it never 422s). Empty/garbage → [].
function normalizeHours(hours: number[]): number[] {
  const valid = hours.filter((h) => Number.isInteger(h) && h >= 0 && h <= 23);
  return Array.from(new Set(valid)).sort((a, b) => a - b);
}

// Build the weekly `per_day_times` map (string keys "0".."6", deduped/sorted hour
// lists) from the form's perDayTimes — but ONLY for the SELECTED weekdays that
// have ≥1 valid hour. A selected weekday with no times is simply omitted (= no
// post that day); the backend treats the map's keys as the active weekdays. Mirrors
// `_validate_per_day_times`, so it never 422s. Returns null when nothing qualifies
// (→ the caller falls back to the flat weekly shape so the trigger is never empty).
function buildPerDayTimes(s: FormState): Record<string, number[]> | null {
  const selected = new Set(s.weekdays.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6));
  const out: Record<string, number[]> = {};
  for (const [k, list] of Object.entries(s.perDayTimes)) {
    const wd = Number(k);
    if (!Number.isInteger(wd) || wd < 0 || wd > 6 || !selected.has(wd)) continue;
    const hours = normalizeHours(list);
    if (hours.length > 0) out[String(wd)] = hours;
  }
  return Object.keys(out).length > 0 ? out : null;
}

// Build the trigger_cfg from the КОГДА choice + the preset's base trigger (so a
// reactive preset keeps its event kind / targets). For a cadence POST kind we
// also fold in the schedule hour + jitter (the backend stores them in
// trigger_cfg and gates the next-run on them); they're omitted for event kinds.
function buildTrigger(s: FormState): Record<string, unknown> {
  const base = s.preset?.trigger_cfg ?? {};
  const withSchedule = (trigger: Record<string, unknown>): Record<string, unknown> => {
    if (!SCHEDULE_KINDS.has(trigger.kind as string)) return trigger;
    const jitter = Number.isInteger(s.jitter) ? Math.min(120, Math.max(0, s.jitter)) : 0;
    // Multi-slot («несколько раз в день»): 2+ valid time slots → emit the
    // `hours` array (deduped/sorted) and DROP the single `hour` (the worker fires
    // once per slot/day). 1 slot → keep the single `hour` (the once/day back-compat
    // path — Sonya + every existing single-time scenario stays here, unchanged).
    const hours = normalizeHours(s.hours);
    if (hours.length >= 2) {
      return { ...trigger, hours, jitter_minutes: jitter };
    }
    // single slot — prefer the slot's hour, else fall back to the `hour` string.
    const hour = hours.length === 1 ? hours[0] : parseHour(s.hour);
    return { ...trigger, ...(hour !== null ? { hour } : {}), jitter_minutes: jitter };
  };
  switch (s.when) {
    case "every_n_days": {
      // «Начиная с» — sent only when a non-empty ISO date is set (omit otherwise).
      const start = s.startDate.trim();
      return withSchedule({ kind: "every_n_days", n: s.nDays, ...(start ? { start_date: start } : {}) });
    }
    case "weekly": {
      // «Разное время в разные дни» ON → emit `per_day_times` (the per-weekday
      // post-times map): only the SELECTED weekdays with ≥1 time, keyed "0".."6".
      // It is the backend's authority over both the days and the hours, so we DROP
      // `weekdays` + the shared `hour`/`hours` (don't run withSchedule) — jitter is
      // the one schedule control that still rides along. A perDay toggle with NO
      // qualifying day falls through to the flat shape so the trigger never empties.
      if (s.perDay) {
        const perDay = buildPerDayTimes(s);
        if (perDay) {
          const jitter = Number.isInteger(s.jitter) ? Math.min(120, Math.max(0, s.jitter)) : 0;
          return { kind: "weekly", per_day_times: perDay, jitter_minutes: jitter };
        }
      }
      // Multi-weekday — emit the deduped, sorted `weekdays` array (0=Mon..6=Sun).
      // An empty selection falls back to Mon ([0]) so the trigger is never dayless.
      const weekdays = Array.from(new Set(s.weekdays.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6))).sort((a, b) => a - b);
      return withSchedule({ kind: "weekly", weekdays: weekdays.length > 0 ? weekdays : [0] });
    }
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

// Build the backend `boost` object from the form. The metric/threshold/comment
// are identical across all three entry points; only the TARGET differs (an
// explicit picker in A, a locked context value in B/C). A blank threshold falls
// back to the metric's default; a non-positive one is clamped to 1 (the backend
// floor) so the body never 422s. `target` carries ONLY the keys its type needs
// (mirrors the backend's _validate_boost_target normalization). The comment is
// trimmed (the backend rejects whitespace-only); the caller gates empty before
// save, so we keep whatever is here (trimmed) for the round-trip.
export function buildBoost(s: FormState): ScenarioBoost {
  const th = Number(s.boostThreshold);
  const threshold = s.boostThreshold.trim() && Number.isFinite(th) && th >= 1
    ? Math.min(1_000_000_000, Math.floor(th))
    : BOOST_DEFAULT_THRESHOLD[s.boostMetric];
  let target: ScenarioBoostTarget;
  if (s.boostTargetType === "scenario" && s.boostScenarioId > 0) {
    target = { type: "scenario", scenario_id: s.boostScenarioId };
  } else if (s.boostTargetType === "post" && s.boostPostId > 0) {
    target = { type: "post", post_id: s.boostPostId };
  } else {
    // "all", or a scenario/post target with no id picked yet → watch everything
    // (the safe default; the editor still nudges the user to pick in A).
    target = { type: "all" };
  }
  return {
    metric: s.boostMetric,
    threshold,
    comment_text: s.boostComment.trim(),
    target,
  };
}

// Entry C — build the COMPANION boost create body for a post scenario's attached
// «Бустер». It targets THIS scenario's posts ({type:"scenario", scenario_id}),
// reusing the same metric/threshold/comment shape as the standalone boost. The
// caller supplies the (already-saved) scenario's id + name; returns a full
// ScenarioCreate (a separate scenario, OFF by default — the user enables it like
// any other). Returns null when the attach section is off or the comment is empty.
export function buildAttachedBoostBody(s: FormState, scenarioId: number, scenarioName: string): ScenarioCreate | null {
  if (!s.attachBoostOn || !s.attachBoostComment.trim() || scenarioId <= 0) return null;
  const th = Number(s.attachBoostThreshold);
  const threshold = s.attachBoostThreshold.trim() && Number.isFinite(th) && th >= 1
    ? Math.min(1_000_000_000, Math.floor(th))
    : BOOST_DEFAULT_THRESHOLD[s.attachBoostMetric];
  return {
    name: `${scenarioName} — бустер`,
    boost: {
      metric: s.attachBoostMetric,
      threshold,
      comment_text: s.attachBoostComment.trim(),
      target: { type: "scenario", scenario_id: scenarioId },
    },
  };
}

// Compile the full create body. Forks: boost / promo / reply_policy / free.
export function compileBody(s: FormState): ScenarioCreate {
  const name = s.name.trim();
  // hour + jitter are folded into the cadence trigger by buildTrigger (the
  // backend now persists trigger_cfg.hour / trigger_cfg.jitter_minutes).

  // 0) boost → the reactive «комментарий при росте» scenario. Its own kind (not a
  // КОГДА mode): the backend resolves `boost` ahead of trigger/instruction, so we
  // send ONLY name + boost (+ publish_mode is irrelevant — a boost has no draft
  // step). Mutually exclusive with promo/reply_policy by construction (isBoost is
  // only set for the boost editor + the boost discovery preset).
  if (s.isBoost) {
    return { name, boost: buildBoost(s) };
  }

  // 1) campaign / «Акция» → the promo helper owns the shape.
  if (s.helperOn || s.preset?.id === "promo") {
    return {
      name,
      promo: { ...s.promo, schedule: s.nDays > 0 && s.when === "every_n_days" ? "every_n_days" : "daily", n_days: s.nDays, reply_instruction: s.replyInstruction },
    };
  }

  // 2) reply scenario → a standalone reply_policy (no post). Two flavours:
  //    • «Дежурство» (reply_duty): replies to comments under the user's posts;
  //      the trigger is irrelevant to the comment sweep, so none is sent.
  //    • «Ответ на упоминания» (on_mention): a REACTIVE reply to @mentions —
  //      the worker `run_mention_reply_scenarios` selects it by
  //      `trigger_cfg.kind="on_mention"`, so we MUST send that trigger (the
  //      backend's _resolve_trigger_cfg strips any schedule keys from it). The
  //      audience/cap/skip ride `action_cfg` (reply_policy) exactly the same way.
  if (s.preset && (s.preset.action_cfg?.kind as string) === "reply_policy") {
    const rd = s.preset.reply_defaults || {};
    const onMention = (s.preset.trigger_cfg?.kind as string) === "on_mention";
    return {
      name,
      // on_mention only: send the trigger + the КАК publish mode (ask/auto). A
      // plain «Дежурство» keeps its byte-identical body (no trigger, no
      // publish_mode) so existing reply scenarios round-trip unchanged.
      ...(onMention ? { trigger: { kind: "on_mention" }, publish_mode: s.mode } : {}),
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
  on_mention: ["scenarios.baked.om_1", "scenarios.baked.om_2", "scenarios.baked.om_3"],
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
