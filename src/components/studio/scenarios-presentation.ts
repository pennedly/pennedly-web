// Presentation layer for the Pennedly-3 Scenarios redesign: the per-preset living
// sentence + 3-step skeleton (as i18n templates + slot builders), a shape-based
// deriver for scenarios whose origin preset is unknown, and neutral demo data
// (creator Алекс · @alex.makes) for ?demo=1 + /gallery review. No backend.

import { v, who, type SentenceSlots, type PublishMode } from "./scenarios-living";
import type { MessageKey } from "@/lib/i18n/messages/en";
import type { Scenario } from "@/lib/types";

type T = (k: MessageKey) => string;

// ── what the presentation layer knows about each preset ──
export type PresetPresentation = {
  /** primary action — drives the promise line + the «Отвечает людям» plaque */
  kind: "post" | "reply";
  /** show the honest «Отвечает людям» plaque (replies to real people) */
  replies: boolean;
  /** Акция — gated flagship */
  gated?: boolean;
  /** living-sentence template (with {slots}) */
  sentenceKey: MessageKey;
  /** the 3-step skeleton, as i18n keys */
  skel: { whenKey: MessageKey; onlyifKey: MessageKey | null; whatdoKey: MessageKey };
  /** build the {slots} from the account handle + (optional) field overrides */
  slots: (t: T, handle: string, f?: Record<string, string>) => SentenceSlots;
};

// audience phrase for the reply sentence
function audiencePhrase(t: T, a?: string): string {
  if (a === "fans") return t("scenarios.aud_phrase.fans");
  if (a === "questions") return t("scenarios.aud_phrase.questions");
  return t("scenarios.aud_phrase.all");
}

export const PRESENTATION: Record<string, PresetPresentation> = {
  daily_question: {
    kind: "post",
    replies: false,
    sentenceKey: "scenarios.sentence.daily_question",
    skel: { whenKey: "scenarios.skel.daily_question.when", onlyifKey: null, whatdoKey: "scenarios.skel.daily_question.whatdo" },
    slots: (_t, handle, f) => ({ time: v(f?.time || "9:00"), who: who(handle) }),
  },
  rubric: {
    kind: "post",
    replies: false,
    sentenceKey: "scenarios.sentence.rubric",
    skel: { whenKey: "scenarios.skel.rubric.when", onlyifKey: null, whatdoKey: "scenarios.skel.rubric.whatdo" },
    slots: (t, handle, f) => ({ time: v(f?.time || "12:00"), name: v(f?.name || t("scenarios.demo.rubric_name")), who: who(handle) }),
  },
  safety_net: {
    kind: "post",
    replies: false,
    sentenceKey: "scenarios.sentence.safety_net",
    skel: { whenKey: "scenarios.skel.safety_net.when", onlyifKey: "scenarios.skel.safety_net.onlyif", whatdoKey: "scenarios.skel.safety_net.whatdo" },
    slots: (_t, handle, f) => ({ time: v(f?.time || "19:00"), who: who(handle) }),
  },
  reply_duty: {
    kind: "reply",
    replies: true,
    sentenceKey: "scenarios.sentence.reply_duty",
    skel: { whenKey: "scenarios.skel.reply_duty.when", onlyifKey: "scenarios.skel.reply_duty.onlyif", whatdoKey: "scenarios.skel.reply_duty.whatdo" },
    slots: (t, handle, f) => ({ interval: v(f?.interval || t("scenarios.slot.interval_15")), audience: v(audiencePhrase(t, f?.audience)), who: who(handle) }),
  },
  amplify_viral: {
    kind: "post",
    replies: false,
    sentenceKey: "scenarios.sentence.amplify_viral",
    skel: { whenKey: "scenarios.skel.amplify_viral.when", onlyifKey: null, whatdoKey: "scenarios.skel.amplify_viral.whatdo" },
    slots: (t, handle, f) => ({ threshold: v(f?.threshold || t("scenarios.slot.views_5000")), who: who(handle) }),
  },
  milestone_thanks: {
    kind: "post",
    replies: false,
    sentenceKey: "scenarios.sentence.milestone_thanks",
    skel: { whenKey: "scenarios.skel.milestone_thanks.when", onlyifKey: null, whatdoKey: "scenarios.skel.milestone_thanks.whatdo" },
    slots: (t, handle, f) => ({ step: v(f?.step || t("scenarios.slot.step_1000")), who: who(handle) }),
  },
  poll: {
    kind: "post",
    replies: false,
    sentenceKey: "scenarios.sentence.poll",
    skel: { whenKey: "scenarios.skel.poll.when", onlyifKey: null, whatdoKey: "scenarios.skel.poll.whatdo" },
    slots: (_t, handle, f) => ({ time: v(f?.time || "18:00"), who: who(handle) }),
  },
  seasonal: {
    kind: "post",
    replies: false,
    sentenceKey: "scenarios.sentence.seasonal",
    skel: { whenKey: "scenarios.skel.seasonal.when", onlyifKey: null, whatdoKey: "scenarios.skel.seasonal.whatdo" },
    slots: (t, handle, f) => ({ period: v(f?.period || t("scenarios.demo.season_period")), topic: v(f?.topic || t("scenarios.demo.season_topic")), who: who(handle) }),
  },
  promo: {
    kind: "reply",
    replies: true,
    gated: true,
    sentenceKey: "scenarios.sentence.promo",
    skel: { whenKey: "scenarios.skel.promo.when", onlyifKey: null, whatdoKey: "scenarios.skel.promo.whatdo" },
    slots: (t, handle, f) => ({ ask: v(f?.ask || t("scenarios.slot.promo_action")), who: who(handle) }),
  },
};

// ── derive a living sentence for ANY scenario (preset known or not) ──
export type DerivedSentence = {
  template: string; // already-resolved i18n string with {slots}
  slots: SentenceSlots;
  kind: "post" | "reply";
};

export function deriveSentence(t: T, s: Scenario, handle: string): DerivedSentence {
  // 1) origin preset known → speak in its exact words
  if (s.preset_id && PRESENTATION[s.preset_id]) {
    const p = PRESENTATION[s.preset_id];
    return { template: t(p.sentenceKey), slots: p.slots(t, handle, fieldsFromScenario(s)), kind: p.kind };
  }
  // 2) shape-based families
  const trig = (s.trigger_cfg?.kind as string) || "";
  const isReply = (s.action_cfg?.kind as string) === "reply_policy";
  if (s.template === "promo") {
    return { template: t("scenarios.sentence.promo"), slots: PRESENTATION.promo.slots(t, handle, fieldsFromScenario(s)), kind: "reply" };
  }
  if (isReply || trig === "on_new_comment") {
    return { template: t("scenarios.sentence.reply_duty"), slots: PRESENTATION.reply_duty.slots(t, handle, fieldsFromScenario(s)), kind: "reply" };
  }
  if (trig === "on_metric_threshold") {
    return { template: t("scenarios.sentence.amplify_viral"), slots: PRESENTATION.amplify_viral.slots(t, handle, fieldsFromScenario(s)), kind: "post" };
  }
  if (trig === "on_follower_milestone") {
    return { template: t("scenarios.sentence.milestone_thanks"), slots: PRESENTATION.milestone_thanks.slots(t, handle), kind: "post" };
  }
  // generic posts
  if (trig === "weekly") return { template: t("scenarios.sentence.generic_weekly"), slots: { who: who(handle) }, kind: "post" };
  if (trig === "every_n_days") {
    const n = String(s.trigger_cfg?.n ?? 3);
    return { template: t("scenarios.sentence.generic_every_n"), slots: { n: v(n), who: who(handle) }, kind: "post" };
  }
  if (s.condition_cfg && ("active_from" in s.condition_cfg || "active_to" in s.condition_cfg)) {
    return { template: t("scenarios.sentence.generic_dates"), slots: { who: who(handle) }, kind: "post" };
  }
  return { template: t("scenarios.sentence.generic_post"), slots: { who: who(handle) }, kind: "post" };
}

// Pull slot-override fields out of a scenario's stored config.
function fieldsFromScenario(s: Scenario): Record<string, string> {
  const f: Record<string, string> = {};
  const aud = s.action_cfg?.audience as string | undefined;
  if (aud) f.audience = aud;
  const thr = s.trigger_cfg?.threshold_views as number | undefined;
  if (typeof thr === "number") f.threshold = `${thr.toLocaleString("ru-RU")}`;
  if (s.template === "promo" && s.structured?.ask) f.ask = s.structured.ask;
  return f;
}

export function publishModeOf(s: Scenario): PublishMode {
  return s.publish_mode ?? "auto";
}

// ── editor: build the live sentence + skeleton from the form's preset + fields ──
export function presetSentence(
  t: T,
  presetId: string | null,
  handle: string,
  overrides?: Record<string, string>,
): DerivedSentence {
  const p = presetId ? PRESENTATION[presetId] : null;
  if (!p) return { template: t("scenarios.sentence.generic_post"), slots: { who: who(handle) }, kind: "post" };
  return { template: t(p.sentenceKey), slots: p.slots(t, handle, overrides), kind: p.kind };
}

export function presetSkel(t: T, presetId: string | null): { when: string; onlyif: string | null; whatdo: string } {
  const p = presetId ? PRESENTATION[presetId] : null;
  if (!p) return { when: t("scenarios.skel.generic_when"), onlyif: null, whatdo: t("scenarios.skel.generic_whatdo") };
  return {
    when: t(p.skel.whenKey),
    onlyif: p.skel.onlyifKey ? t(p.skel.onlyifKey) : null,
    whatdo: t(p.skel.whatdoKey),
  };
}

// ════════════════════════════════════════════════════════════════════════════
//  DEMO DATA (neutral creator Алекс · @alex.makes) — ?demo=1 + /gallery
// ════════════════════════════════════════════════════════════════════════════

export const DEMO_CREATOR = { name: "Алекс", handle: "@alex.makes", initial: "А", samples: 8, tz: "UTC+1" };

// First-run example cards — full living sentence + «Попробовать».
export type FirstRunExample = { presetId: string; nameKey: MessageKey };
export const FIRSTRUN_EXAMPLES: FirstRunExample[] = [
  { presetId: "daily_question", nameKey: "scenarios.fr.ex_morning" },
  { presetId: "reply_duty", nameKey: "scenarios.fr.ex_replies" },
  { presetId: "rubric", nameKey: "scenarios.fr.ex_rubric" },
];

// Control-center demo list (Алекс). Real Scenario shape so the live card path is
// exercised; preset_id + publish_mode are the Pennedly-3 additions.
export const DEMO_CC: Scenario[] = [
  {
    id: 1, name: "Утренний вопрос", template: null, enabled: true, preset_id: "daily_question", publish_mode: "ask",
    trigger_cfg: { kind: "daily_first_post" }, condition_cfg: { once_per_day: true }, action_cfg: { kind: "post" },
    structured: null, instruction: "", reply_instruction: "",
    next_run_at: "2026-06-25T08:00:00Z", last_run_at: "2026-06-24T08:02:00Z", fire_count: 38, recent_skips: [],
  },
  {
    id: 2, name: "Маленькая победа", template: null, enabled: true, preset_id: "rubric", publish_mode: "ask",
    trigger_cfg: { kind: "weekly", weekday: 1 }, condition_cfg: { once_per_day: true }, action_cfg: { kind: "post" },
    structured: null, instruction: "", reply_instruction: "",
    next_run_at: "2026-06-30T11:00:00Z", last_run_at: "2026-06-23T11:00:00Z", fire_count: 9, recent_skips: [],
  },
  {
    id: 3, name: "Отвечать на комментарии", template: null, enabled: true, preset_id: "reply_duty", publish_mode: "ask",
    trigger_cfg: { kind: "on_new_comment", scope: "all_posts" }, condition_cfg: null,
    action_cfg: { kind: "reply_policy", audience: "all_except_trolls", max_per_day: 60, skip_low_value: true },
    structured: null, instruction: "", reply_instruction: "",
    next_run_at: null, last_run_at: "2026-06-24T08:52:00Z", fire_count: 142, recent_skips: [],
  },
  {
    id: 4, name: "Раскрутить залетевший", template: null, enabled: true, preset_id: "amplify_viral", publish_mode: "auto",
    trigger_cfg: { kind: "on_metric_threshold", threshold_views: 5000 }, condition_cfg: null, action_cfg: { kind: "post" },
    structured: null, instruction: "", reply_instruction: "",
    next_run_at: null, last_run_at: "2026-06-21T14:30:00Z", fire_count: 5, recent_skips: [],
  },
  {
    id: 5, name: "Если сегодня не постил", template: null, enabled: false, preset_id: "safety_net", publish_mode: "ask",
    trigger_cfg: { kind: "daily_first_post" }, condition_cfg: { only_if_no_post_today: true, not_before: "19:00" }, action_cfg: { kind: "post" },
    structured: null, instruction: "", reply_instruction: "",
    next_run_at: null, last_run_at: "2026-06-12T17:00:00Z", fire_count: 4, recent_skips: [],
  },
];

// Activity — drafts awaiting confirmation + the human journal of what's done.
export type ActivityDraft = { id: number; kind: "post" | "reply"; whenKey: MessageKey; ctx: string; body: string };
export type ActivityDone = { id: number; kind: "post" | "reply"; text: string; sub: string; url: string };

export const DEMO_ACTIVITY_DRAFTS: ActivityDraft[] = [
  { id: 1, kind: "post", whenKey: "scenarios.act.ready_900", ctx: "Утренний вопрос · черновик поста", body: "Вопрос на сегодня: что вы сегодня доведёте до конца — даже если получится неидеально? Напишите одним словом 👇" },
  { id: 2, kind: "reply", whenKey: "scenarios.act.min_ago_12", ctx: "Отвечать на комментарии · ответ Марине под постом «Маленькая победа»", body: "Марина, когда сил нет, цель не «сделать», а «начать на 5 минут» — почти всегда этого хватает, чтобы втянуться. С чего бы вы начали эти пять минут?" },
];

// Clean per-preset sample posts for the editor preview in demo/offline mode (real
// mode gets a generated sample from the backend). Keeps the preview reading as a
// real post «в твоём голосе» — never echoes the raw instruction template.
export const SCEN_SAMPLE: Record<string, MessageKey> = {
  daily_question: "scenarios.sample.daily_question",
  rubric: "scenarios.sample.rubric",
  safety_net: "scenarios.sample.safety_net",
  amplify_viral: "scenarios.sample.amplify_viral",
  milestone_thanks: "scenarios.sample.milestone_thanks",
  poll: "scenarios.sample.poll",
  seasonal: "scenarios.sample.seasonal",
};
export function demoSampleKey(presetId: string | null | undefined): MessageKey {
  return (presetId && SCEN_SAMPLE[presetId]) || "scenarios.sample.generic";
}

export const DEMO_ACTIVITY_DONE: ActivityDone[] = [
  { id: 1, kind: "post", text: "Опубликовал твой утренний вопрос", sub: "Сегодня в 9:02 · 1,2K просмотров", url: "#" },
  { id: 2, kind: "reply", text: "Ответил Диме под постом «Разбор ваших затыков»", sub: "Сегодня в 8:41", url: "#" },
  { id: 3, kind: "post", text: "Опубликовал выпуск рубрики «Маленькая победа»", sub: "Вчера в 12:00 · 960 просмотров", url: "#" },
  { id: 4, kind: "reply", text: "Ответил Анне под постом «Утренний вопрос»", sub: "Вчера в 9:18", url: "#" },
  { id: 5, kind: "post", text: "Подхватил залетевший пост — опубликовал продолжение", sub: "12 июня в 14:30 · 8,4K просмотров", url: "#" },
];
