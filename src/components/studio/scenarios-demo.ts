// Demo data + Tweaks defaults for the Scenarios screen (?demo=1 / gallery).
// No backend — drives every state for local spec-fidelity review of the
// «рутинный автопилот» redesign (Scenarios-{WEB,Mobile}-SPEC): the discovery
// gallery (real presets, grouped by nature), the control-center (cadence strip,
// stacking warnings, skips, cross-account apply), the unified form per preset,
// and the run-now preview. Sample content uses a neutral creator (Алекс); the feature
// is topic-agnostic. All scenarios OFF by default in the real flow.

import type { Scenario, ScenarioPreset, ScenarioPromoFields } from "@/lib/types";

export const SCENARIOS_TWEAK_DEFAULTS = {
  dark: false,
  state: "List", // List | Empty | Loading | Error
  master: true, // «Правила дома» master switch (on → live; off → dimmed)
  replyState: "on", // built-in reply routine: on | off | paused (replaced by a scenario)
};

export const BLANK_PROMO: ScenarioPromoFields = {
  ask: "",
  reward: "",
  require_follow: true,
  require_like: true,
  reply_instruction: "",
  schedule: "daily",
  n_days: 3,
};

// A filled promo (for «edit existing promo») — reopens the «Акция» rich editor.
export const DEMO_PROMO: ScenarioPromoFields = {
  ask: "свою дату рождения",
  reward: "короткий бесплатный мини-разбор прямо в комментах",
  require_follow: true,
  require_like: false,
  reply_instruction:
    "Отвечай тепло и по-человечески, обращайся по имени. Дай 1–2 конкретных наблюдения по дате, без эзотерических клише, заканчивай мягким вопросом.",
  schedule: "daily",
  n_days: 3,
};

// ── The preset catalog (mirrors GET /api/scenarios/presets, RU-localized). The
// 9 routines the gallery offers, grouped by nature; «Акция» is the synthetic
// FE-only "campaign" preset (the promo helper). Baked instructions are short
// stand-ins — the real ones come from the backend already localized. ──────────
export const DEMO_PRESETS: ScenarioPreset[] = [
  {
    id: "daily_question",
    name_key: "scenarios.preset.daily_question",
    icon: "IcBubble",
    group: "daily",
    instruction:
      "ЭТОТ ПОСТ — РАЗГОВОР ДНЯ. Задай один живой открытый вопрос в твоём голосе и пригласи людей ответить в комментариях. Тема: {topic}.",
    reply_instruction:
      "Это ответы на ТВОЙ вопрос дня. Отвечай тепло и по существу, как живой автор, которому правда интересно.",
    trigger_cfg: { kind: "daily_first_post" },
    condition_cfg: { once_per_day: true },
    action_cfg: { kind: "post" },
    fields: [
      { key: "topic", name_key: "scenarios.field.topic", kind: "text", required: false, default: null, maps_to: "instruction", min_count: null, max_count: null },
    ],
    reply_defaults: { audience: "all_except_trolls", max_per_day: 40 },
  },
  {
    id: "rubric",
    name_key: "scenarios.preset.rubric",
    icon: "IcList",
    group: "daily",
    instruction:
      "ЭТОТ ПОСТ — ВЫПУСК ПОСТОЯННОЙ РУБРИКИ «{rubric_name}». Сделай очередной выпуск в твоём голосе. Формат рубрики: {rubric_idea}.",
    reply_instruction: "",
    trigger_cfg: { kind: "weekly", weekday: 0 },
    condition_cfg: { once_per_day: true },
    action_cfg: { kind: "post" },
    fields: [
      { key: "rubric_name", name_key: "scenarios.field.rubric_name", kind: "text", required: true, default: null, maps_to: "instruction", min_count: null, max_count: null },
      { key: "rubric_idea", name_key: "scenarios.field.rubric_idea", kind: "textarea", required: true, default: null, maps_to: "instruction", min_count: null, max_count: null },
      { key: "cadence", name_key: "scenarios.field.cadence", kind: "cadence", required: false, default: "weekly", maps_to: "trigger_cfg.kind", min_count: null, max_count: null },
      { key: "weekday", name_key: "scenarios.field.weekday", kind: "weekday", required: false, default: 0, maps_to: "trigger_cfg.weekday", min_count: null, max_count: null },
    ],
    reply_defaults: {},
  },
  {
    id: "reply_duty",
    name_key: "scenarios.preset.reply_duty",
    icon: "IcReplies",
    group: "daily",
    instruction: "",
    reply_instruction:
      "Ты на дежурстве в комментариях. Отвечай людям под постами как живой автор — тепло, по делу, в своём голосе.",
    trigger_cfg: { kind: "on_new_comment", scope: "all_posts" },
    condition_cfg: null,
    action_cfg: { kind: "reply_policy", audience: "all_except_trolls", max_per_day: 60, skip_low_value: true },
    fields: [
      { key: "audience", name_key: "scenarios.field.reply_audience", kind: "text", required: false, default: "all_except_trolls", maps_to: "action_cfg.audience", min_count: null, max_count: null },
    ],
    reply_defaults: { audience: "all_except_trolls", max_per_day: 60, skip_low_value: true },
  },
  {
    id: "safety_net",
    name_key: "scenarios.preset.safety_net",
    icon: "IcShield",
    group: "periodic",
    instruction:
      "ЭТОТ ПОСТ — ПОДСТРАХОВКА: сегодня в ленте ещё ничего не выходило. Сделай один самостоятельный пост в твоём голосе. Тема: {topic}.",
    reply_instruction: "",
    trigger_cfg: { kind: "daily_first_post" },
    condition_cfg: { only_if_no_post_today: true, not_before: "18:00" },
    action_cfg: { kind: "post" },
    fields: [
      { key: "not_before", name_key: "scenarios.field.not_before", kind: "text", required: false, default: "18:00", maps_to: "condition_cfg.not_before", min_count: null, max_count: null },
      { key: "topic", name_key: "scenarios.field.topic", kind: "text", required: false, default: null, maps_to: "instruction", min_count: null, max_count: null },
    ],
    reply_defaults: {},
  },
  {
    id: "milestone_thanks",
    name_key: "scenarios.preset.milestone_thanks",
    icon: "IcUsers",
    group: "periodic",
    instruction:
      "ЭТОТ ПОСТ — БЛАГОДАРНОСТЬ ЗА {milestone} ПОДПИСЧИКОВ. Сделай тёплый короткий пост в твоём голосе.",
    reply_instruction: "",
    trigger_cfg: { kind: "on_follower_milestone", targets: [100, 500, 1000, 5000, 10000] },
    condition_cfg: null,
    action_cfg: { kind: "post" },
    fields: [
      { key: "targets", name_key: "scenarios.field.milestone_targets", kind: "number", required: false, default: [100, 500, 1000, 5000, 10000], maps_to: "trigger_cfg.targets", min_count: null, max_count: null },
    ],
    reply_defaults: {},
  },
  {
    id: "seasonal",
    name_key: "scenarios.preset.seasonal",
    icon: "IcCalendar",
    group: "periodic",
    instruction:
      "ЭТОТ ПОСТ — ЧАСТЬ СЕЗОННОЙ СЕРИИ: {theme}. Сделай очередной пост серии в твоём голосе.",
    reply_instruction: "",
    trigger_cfg: { kind: "daily_first_post" },
    condition_cfg: { once_per_day: true, active_from: null, active_to: null },
    action_cfg: { kind: "post" },
    fields: [
      { key: "theme", name_key: "scenarios.field.theme", kind: "text", required: true, default: null, maps_to: "instruction", min_count: null, max_count: null },
      { key: "active_from", name_key: "scenarios.field.active_from", kind: "date", required: true, default: null, maps_to: "condition_cfg.active_from", min_count: null, max_count: null },
      { key: "active_to", name_key: "scenarios.field.active_to", kind: "date", required: true, default: null, maps_to: "condition_cfg.active_to", min_count: null, max_count: null },
      { key: "cadence", name_key: "scenarios.field.cadence", kind: "cadence", required: false, default: "daily", maps_to: "trigger_cfg.kind", min_count: null, max_count: null },
    ],
    reply_defaults: {},
  },
  {
    id: "poll",
    name_key: "scenarios.preset.poll",
    icon: "IcChart",
    group: "periodic",
    instruction:
      "ЭТОТ ПОСТ — ОПРОС. Задай один вопрос с короткими вариантами и позови выбрать вариант в комментариях. Вопрос: {question}. Варианты: {options}.",
    reply_instruction:
      "Это голоса в твоём опросе, где человек пояснил выбор. Реагируй коротко и тепло.",
    trigger_cfg: { kind: "daily_first_post" },
    condition_cfg: { once_per_day: true },
    action_cfg: { kind: "post" },
    fields: [
      { key: "question", name_key: "scenarios.field.question", kind: "text", required: true, default: null, maps_to: "instruction", min_count: null, max_count: null },
      { key: "options", name_key: "scenarios.field.options", kind: "options", required: true, default: null, maps_to: "instruction", min_count: 2, max_count: 4 },
    ],
    reply_defaults: { audience: "questions", max_per_day: 40, skip_low_value: true },
  },
  {
    id: "amplify_viral",
    name_key: "scenarios.preset.amplify_viral",
    icon: "IcBolt",
    group: "reactive",
    instruction:
      "ЭТОТ ПОСТ — ПОДХВАТ УДАЧНОГО. Один из твоих постов сейчас заходит лучше обычного. Сделай follow-up в твоём голосе, пока тема горячая.",
    reply_instruction: "",
    trigger_cfg: { kind: "on_metric_threshold" },
    condition_cfg: null,
    action_cfg: { kind: "post" },
    fields: [
      { key: "threshold_views", name_key: "scenarios.field.threshold_views", kind: "number", required: false, default: null, maps_to: "trigger_cfg.threshold_views", min_count: null, max_count: null },
    ],
    reply_defaults: {},
  },
];

// «Ответ на упоминания» — a REACTIVE reply scenario (auto-replies to @mentions in
// the user's voice). Like «Акция», it is a synthetic FE-only catalog entry the
// backend ships no preset for: it compiles to a `reply_policy` action with a
// `trigger_cfg.kind="on_mention"` (the worker `run_mention_reply_scenarios` keys
// off that trigger). The editor renders it with the reply UI, but its «Когда»
// slot is the locked reactive «когда меня упомянут» (no schedule). The live page
// appends this to the fetched catalog, same as PROMO_PRESET.
export const MENTION_PRESET: ScenarioPreset = {
  id: "on_mention",
  name_key: "scenarios.preset.on_mention",
  icon: "IcBolt",
  group: "reactive",
  instruction: "",
  // The default tone (voice/layered guidance) — rides the `reply_instruction`
  // column. The real localized default would come from the backend; this is the
  // FE stand-in shown when the user opens a fresh «Ответ на упоминания».
  reply_instruction:
    "Тебя упомянули в чужом посте. Ответь как живой автор — тепло, по делу, в своём голосе. Поблагодари за упоминание, если уместно, и продолжи разговор.",
  trigger_cfg: { kind: "on_mention" },
  condition_cfg: null,
  action_cfg: { kind: "reply_policy", audience: "all_except_trolls", max_per_day: 30, skip_low_value: true },
  fields: [],
  reply_defaults: { audience: "all_except_trolls", max_per_day: 30, skip_low_value: true },
};

// «Акция» — the synthetic campaign preset (the preserved promo rich editor). It
// is NOT a backend catalog preset; the gallery renders it last, gated, with a
// risk badge. Selecting it opens the promo helper.
export const PROMO_PRESET: ScenarioPreset = {
  id: "promo",
  name_key: "scenarios.preset.promo",
  icon: "IcGift",
  group: "campaign",
  instruction: "",
  reply_instruction: "",
  trigger_cfg: { kind: "daily_first_post" },
  condition_cfg: { once_per_day: true },
  action_cfg: { kind: "post" },
  fields: [],
  reply_defaults: {},
};

// «Комментарий-добавка при росте поста» (boost) — a synthetic FE-only catalog
// entry (the backend ships no preset, but DOES accept the `boost` create field).
// Selecting it opens the boost recipe editor (target + metric+threshold + a
// pre-written comment). Its `trigger_cfg.kind="on_post_metric"` /
// `action_cfg.kind="boost_comment"` make matchPreset + isBoostScenario recognize
// a saved boost. The live page appends it to the fetched catalog like the others.
export const BOOST_PRESET: ScenarioPreset = {
  id: "boost",
  name_key: "scenarios.preset.boost",
  icon: "IcBolt",
  group: "reactive",
  instruction: "",
  reply_instruction: "",
  trigger_cfg: { kind: "on_post_metric", metric: "views", threshold: 5000, target: { type: "all" } },
  condition_cfg: null,
  action_cfg: { kind: "boost_comment", comment_text: "" },
  fields: [],
  reply_defaults: {},
};

// The full demo catalog the gallery renders (real presets + the synthetic
// «Ответ на упоминания» + «Акция» + «Бустер»). The live screen appends
// MENTION_PRESET + PROMO_PRESET + BOOST_PRESET to the fetched catalog too (none
// ship from the backend).
export const DEMO_CATALOG: ScenarioPreset[] = [...DEMO_PRESETS, MENTION_PRESET, PROMO_PRESET, BOOST_PRESET];

// ── The control-center demo list — covers every card shape the SPEC calls out:
// a daily question (on, fires every morning), a weekly rubric, a reply duty
// (event-driven), a promo (on, every-N), and a paused seasonal carrying a
// skip-note. Times are UTC ISO (the card localizes). ─────────────────────────
export const DEMO_SCENARIOS: Scenario[] = [
  {
    id: 1,
    name: "Разговор дня",
    template: null,
    enabled: true,
    trigger_cfg: { kind: "daily_first_post" },
    condition_cfg: { once_per_day: true },
    action_cfg: { kind: "post" },
    structured: null,
    instruction: "ЭТОТ ПОСТ — РАЗГОВОР ДНЯ. Задай один живой открытый вопрос…",
    reply_instruction: "Отвечай тепло и по существу…",
    next_run_at: "2026-06-23T06:00:00Z",
    last_run_at: "2026-06-22T06:02:00Z",
    fire_count: 38,
    recent_skips: [],
  },
  {
    id: 2,
    name: "Рубрика «Карта недели»",
    template: null,
    enabled: true,
    trigger_cfg: { kind: "weekly", weekday: 0 },
    condition_cfg: { once_per_day: true },
    action_cfg: { kind: "post" },
    structured: null,
    instruction: "ЭТОТ ПОСТ — ВЫПУСК ПОСТОЯННОЙ РУБРИКИ «Карта недели»…",
    reply_instruction: "",
    next_run_at: "2026-06-29T06:00:00Z",
    last_run_at: "2026-06-22T06:00:00Z",
    fire_count: 9,
    recent_skips: [],
  },
  {
    id: 3,
    name: "Дежурство в комментах",
    template: null,
    enabled: true,
    trigger_cfg: { kind: "on_new_comment", scope: "all_posts" },
    condition_cfg: null,
    action_cfg: { kind: "reply_policy", audience: "all_except_trolls", max_per_day: 60, skip_low_value: true },
    structured: null,
    instruction: "",
    reply_instruction: "Ты на дежурстве в комментариях…",
    next_run_at: null,
    last_run_at: "2026-06-22T13:40:00Z",
    fire_count: 142,
    recent_skips: [],
  },
  {
    id: 4,
    name: "Мини-разбор по дате рождения",
    template: "promo",
    enabled: true,
    trigger_cfg: { kind: "every_n_days", n: 3 },
    condition_cfg: { cooldown_days: 3 },
    action_cfg: { kind: "post" },
    structured: DEMO_PROMO,
    instruction: "ЭТОТ ПОСТ — АКЦИЯ…",
    reply_instruction: DEMO_PROMO.reply_instruction,
    next_run_at: "2026-06-24T06:00:00Z",
    last_run_at: "2026-06-21T06:02:00Z",
    fire_count: 5,
    recent_skips: [],
  },
  {
    id: 5,
    name: "Сезонное · ретроградный Меркурий",
    template: null,
    enabled: false,
    trigger_cfg: { kind: "daily_first_post" },
    condition_cfg: { once_per_day: true, active_from: "2026-07-01", active_to: "2026-07-21" },
    action_cfg: { kind: "post" },
    structured: null,
    instruction: "ЭТОТ ПОСТ — ЧАСТЬ СЕЗОННОЙ СЕРИИ: ретроградный Меркурий…",
    reply_instruction: "",
    next_run_at: null,
    last_run_at: "2026-06-20T06:00:00Z",
    fire_count: 3,
    recent_skips: [
      { local_date: "2026-06-21", reason: "condition", detail: "active_from 2026-07-01", created_at: "2026-06-21T06:00:00Z" },
    ],
  },
  {
    id: 6,
    name: "Ответ на упоминания",
    template: null,
    enabled: false,
    // Reactive reply scenario — keyed off trigger_cfg.kind="on_mention"; the
    // worker replies to new @mentions. No schedule (next_run_at stays null).
    trigger_cfg: { kind: "on_mention" },
    condition_cfg: null,
    action_cfg: { kind: "reply_policy", audience: "all_except_trolls", max_per_day: 30, skip_low_value: true },
    structured: null,
    instruction: "",
    reply_instruction: "Тебя упомянули в чужом посте. Ответь как живой автор — тепло, по делу, в своём голосе.",
    next_run_at: null,
    last_run_at: "2026-06-22T11:20:00Z",
    fire_count: 17,
    recent_skips: [],
  },
];
