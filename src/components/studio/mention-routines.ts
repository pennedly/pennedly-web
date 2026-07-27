// Mention routines — the view model for «Рутины упоминаний» (auto-scenarios keyed
// to a custom intent). A routine IS an `on_mention` scenario: `trigger_cfg.intent`
// is the goal in the owner's words (empty = the catch-all «по умолчанию» routine),
// `trigger_cfg.requires_media` narrows the attachment, `publish_mode` is auto/ask.
// The engine (backend Phase 3) is live; the generated-photo action is «Скоро».
// Ported from design-export/PennedlyDesign (mention-routines-build.js).

import { fetchAutopilot, updateAutopilot } from "@/lib/api";
import type { Scenario } from "@/lib/types";

export type RoutineMode = "auto" | "ask";
export type RoutineMedia = "any" | "image" | "none";
export type RoutineAction = "voice" | "image"; // 'image' = generated photo (Скоро)

export type MRoutine = {
  id: number;
  name: string;
  enabled: boolean;
  mode: RoutineMode;
  media: RoutineMedia;
  /** The goal in the owner's words; '' → the catch-all fallback routine. */
  goal: string;
  catchall: boolean;
  action: RoutineAction;
  replyInstruction: string;
  /** Human one-liner shown on the hub card (the goal, or a fallback label). */
  line: string;
  lastRunAt: string | null;
  fireCount: number;
  /** Demo-only relative label (real cards format `lastRunAt`). */
  demoLast?: string;
};

const asStr = (v: unknown): string => (typeof v === "string" ? v : "");

export function isMentionRoutine(s: Scenario): boolean {
  return asStr(s.trigger_cfg?.kind) === "on_mention";
}

export function toRoutine(s: Scenario): MRoutine {
  const goal = asStr(s.trigger_cfg?.intent).trim();
  const rmRaw = asStr(s.trigger_cfg?.requires_media).toLowerCase();
  const media: RoutineMedia = rmRaw === "image" ? "image" : rmRaw === "none" ? "none" : "any";
  const mode: RoutineMode = s.publish_mode === "auto" ? "auto" : "ask";
  const action: RoutineAction = asStr(s.trigger_cfg?.action) === "generate_image" ? "image" : "voice";
  return {
    id: s.id,
    name: s.name,
    enabled: s.enabled,
    mode,
    media,
    goal,
    catchall: goal === "",
    action,
    replyInstruction: s.reply_instruction ?? "",
    line: goal || "",
    lastRunAt: s.last_run_at,
    fireCount: s.fire_count,
  };
}

// ── demo ─────────────────────────────────────────────────────────────────────
// Mirrors the design's four hub cards (mention-routines-build.js CARDS).
export const DEMO_ROUTINES: MRoutine[] = [
  {
    id: 1, name: "Сгенерировать по фото", enabled: true, mode: "ask", media: "image",
    goal: "прислали фото и просят сделать в вашем стиле", catchall: false, action: "voice",
    replyInstruction: "",
    line: "Когда упоминают с фото и просят сделать в вашем стиле — готовит тёплый ответ, что заберёте в работу. Ответ картинкой появится позже.",
    lastRunAt: null, fireCount: 12, demoLast: "20 минут назад",
  },
  {
    id: 2, name: "Вопросы про курс", enabled: true, mode: "auto", media: "any",
    goal: "спрашивают про ваш курс и хотят записаться", catchall: false, action: "voice",
    replyInstruction: "",
    line: "Когда спрашивают про ваш курс и хотят записаться — отвечает сам, в вашем голосе, со ссылкой на запись.",
    lastRunAt: null, fireCount: 48, demoLast: "5 минут назад",
  },
  {
    id: 3, name: "Похвалили работу", enabled: false, mode: "auto", media: "any",
    goal: "хвалят проект без вопроса", catchall: false, action: "voice",
    replyInstruction: "",
    line: "Когда хвалят проект без вопроса — отвечает коротким тёплым спасибо.",
    lastRunAt: null, fireCount: 0,
  },
  {
    id: 4, name: "Все остальные безопасные", enabled: true, mode: "ask", media: "any",
    goal: "", catchall: true, action: "voice", replyInstruction: "",
    line: "Ловит всё безопасное, что не подошло под рутины выше. Готовит черновик — вы решаете, отправлять ли.",
    lastRunAt: null, fireCount: 31, demoLast: "2 часа назад",
  },
];

export const MR_TWEAK_DEFAULTS = { dark: false, state: "Populated" };

// Enabling a routine (scenario.enabled=true) is a silent no-op unless the account
// autopilot MASTER gate is on too — `run_mention_reply_scenarios` only fires inside
// `if account["enabled"]`. So whenever a routine is turned on we also flip the
// master on, exactly as the scenarios screen does when an auto scenario is enabled
// (the documented single-master-gate rule). Idempotent + fail-soft: a hiccup leaves
// the routine enabled and the master flippable elsewhere, never blocks the toggle.
export async function ensureAutopilotMaster(accountId: number): Promise<void> {
  try {
    const ap = await fetchAutopilot(accountId);
    if (!ap.enabled) await updateAutopilot(accountId, { ...ap, enabled: true });
  } catch {
    /* non-fatal */
  }
}
