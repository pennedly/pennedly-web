// Demo data + Tweaks defaults for the Scenarios screen (?demo=1 / gallery).
// No backend — drives every state for local spec-fidelity review.

import type { Scenario } from "@/lib/types";

export const SCENARIOS_TWEAK_DEFAULTS = {
  dark: false,
  state: "List", // List | Empty | Loading | Error
};

export const DEMO_SCENARIOS: Scenario[] = [
  {
    id: 1,
    name: "Ежедневный мини-разбор",
    template: "promo",
    enabled: true,
    trigger_cfg: { kind: "daily_first_post" },
    condition_cfg: { once_per_day: true },
    action_cfg: { kind: "post" },
    structured: {
      ask: "свою дату рождения",
      reward: "короткий бесплатный мини-разбор прямо в комментах",
      require_follow: true,
      require_like: true,
      reply_instruction:
        "прислал дату → дай мини-разбор в комментах; развёрнутый вопрос → в бота",
      schedule: "daily",
      n_days: 3,
    },
    instruction: "ЭТОТ ПОСТ — АКЦИЯ…",
    reply_instruction: "…",
    next_run_at: "2026-06-17T05:10:00Z",
    last_run_at: "2026-06-16T05:12:00Z",
  },
  {
    id: 2,
    name: "Карта дня",
    template: "custom",
    enabled: false,
    trigger_cfg: { kind: "daily_first_post" },
    condition_cfg: null,
    action_cfg: { kind: "post" },
    structured: null,
    instruction: "одна карта дня, 2-3 предложения, совет на день",
    reply_instruction: "",
    next_run_at: null,
    last_run_at: null,
  },
];
