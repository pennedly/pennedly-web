// Demo data + Tweaks defaults for the Scenarios screen (?demo=1 / gallery).
// No backend — drives every state for local spec-fidelity review. Covers BOTH
// provenance kinds: a promo-seeded scenario (`template:"promo"` + structured)
// and a FREE scenario (`template:null` + a raw instruction).

import type { Scenario, ScenarioPromoFields } from "@/lib/types";

export const SCENARIOS_TWEAK_DEFAULTS = {
  dark: false,
  state: "List", // List | Empty | Loading | Error
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

// A filled promo (for «edit existing promo») — reopens the promo helper.
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

export const DEMO_SCENARIOS: Scenario[] = [
  {
    id: 1,
    name: "Мини-разбор по дате рождения",
    template: "promo",
    enabled: true,
    trigger_cfg: { kind: "daily_first_post" },
    condition_cfg: { once_per_day: true },
    action_cfg: { kind: "post" },
    structured: DEMO_PROMO,
    instruction: "ЭТОТ ПОСТ — АКЦИЯ…",
    reply_instruction: DEMO_PROMO.reply_instruction,
    next_run_at: "2026-06-22T08:00:00Z",
    last_run_at: "2026-06-21T08:02:00Z",
  },
  {
    id: 2,
    name: "Карта дня по будням",
    template: null,
    enabled: true,
    trigger_cfg: { kind: "every_n_days", n: 1 },
    condition_cfg: null,
    action_cfg: { kind: "post" },
    structured: null,
    instruction:
      "Вытяни одну карту дня. 2–3 предложения трактовки простыми словами, без эзотерических клише, и один практический совет на день.",
    reply_instruction: "",
    next_run_at: "2026-06-22T11:00:00Z",
    last_run_at: "2026-06-21T11:00:00Z",
  },
  {
    id: 3,
    name: "Совместимость по знакам",
    template: "promo",
    enabled: false,
    trigger_cfg: { kind: "every_n_days", n: 3 },
    condition_cfg: { cooldown_days: 3 },
    action_cfg: { kind: "post" },
    structured: {
      ask: "свой знак и знак партнёра",
      reward: "мини-разбор вашей пары в ответ",
      require_follow: true,
      require_like: true,
      reply_instruction: "коротко и по делу, 2 наблюдения о паре, мягкий вопрос",
      schedule: "every_n_days",
      n_days: 3,
    },
    instruction: "ЭТОТ ПОСТ — АКЦИЯ…",
    reply_instruction: "коротко и по делу…",
    next_run_at: null,
    last_run_at: "2026-06-14T08:00:00Z",
  },
];
