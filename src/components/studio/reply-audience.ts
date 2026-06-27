// «Кому отвечать» — the audience-preset model shared by the built-in reply
// routine card + its preset gallery (Reply-Settings-Gallery-SPEC). The gallery
// LOOKS like one set of cards, but maps to three backend shapes:
//
//   BUILT-IN  → reply_audience ∈ {fans, all_except_trolls, questions}; the sweep
//               has an exact filter, no free-text description needed.
//   TEXT      → reply_audience = "custom" + audience_prompt = "<ready text>";
//               a written description the user can edit, prefilled from the preset.
//   CUSTOM    → reply_audience = "custom" + audience_prompt = "<user text>";
//               an empty description the user writes themselves.
//
// The backend enum uses `all_except_trolls` (NOT the spec's «not_trolls»).

import type { MessageKey } from "@/lib/i18n/messages/en";

export type ReplyAudience = "fans" | "all_except_trolls" | "questions" | "custom";
export type PresetKind = "builtin" | "text" | "custom";

export type AudiencePreset = {
  /** Stable preset id (FE-only — drives selection + icon). */
  id: string;
  kind: PresetKind;
  /** Icon key resolved against AUDIENCE_ICONS. */
  icon: string;
  /** The reply_audience enum this preset resolves to (text + custom → "custom"). */
  audience: ReplyAudience;
  /** For TEXT presets: the ready audience_prompt prefilled into the editable
   *  description. "" for built-in (no description) and custom (empty field). */
  prompt: string;
  nameKey: MessageKey;
  /** «кому» one-liner shown on the card. */
  whoKey: MessageKey;
  /** A short «…» example reply, shown muted-mono on the card. */
  exampleKey: MessageKey;
};

// The 10 presets, in gallery order (3 built-in · 6 text · 1 custom-dashed).
export const AUDIENCE_PRESETS: AudiencePreset[] = [
  { id: "fans", kind: "builtin", icon: "heart", audience: "fans", prompt: "", nameKey: "ap.reply.preset.fans.name", whoKey: "ap.reply.preset.fans.who", exampleKey: "ap.reply.preset.fans.ex" },
  { id: "all_except_trolls", kind: "builtin", icon: "users", audience: "all_except_trolls", prompt: "", nameKey: "ap.reply.preset.all.name", whoKey: "ap.reply.preset.all.who", exampleKey: "ap.reply.preset.all.ex" },
  { id: "questions", kind: "builtin", icon: "help", audience: "questions", prompt: "", nameKey: "ap.reply.preset.questions.name", whoKey: "ap.reply.preset.questions.who", exampleKey: "ap.reply.preset.questions.ex" },
  { id: "brief", kind: "text", icon: "briefcase", audience: "custom", prompt: "тем, кто пишет по делу, без флуда и пустых реакций", nameKey: "ap.reply.preset.brief.name", whoKey: "ap.reply.preset.brief.who", exampleKey: "ap.reply.preset.brief.ex" },
  { id: "new", kind: "text", icon: "sparkle", audience: "custom", prompt: "тем, кто пишет впервые и ещё не подписан — знакомлюсь тепло", nameKey: "ap.reply.preset.new.name", whoKey: "ap.reply.preset.new.who", exampleKey: "ap.reply.preset.new.ex" },
  { id: "pricing", kind: "text", icon: "tag", audience: "custom", prompt: "тем, кто спрашивает про цену, продукт, как купить или записаться", nameKey: "ap.reply.preset.pricing.name", whoKey: "ap.reply.preset.pricing.who", exampleKey: "ap.reply.preset.pricing.ex" },
  { id: "praise", kind: "text", icon: "star", audience: "custom", prompt: "тем, кто благодарит, хвалит или пишет, что текст откликнулся", nameKey: "ap.reply.preset.praise.name", whoKey: "ap.reply.preset.praise.who", exampleKey: "ap.reply.preset.praise.ex" },
  { id: "story", kind: "text", icon: "chat", audience: "custom", prompt: "тем, кто делится личным опытом или историей по теме поста", nameKey: "ap.reply.preset.story.name", whoKey: "ap.reply.preset.story.who", exampleKey: "ap.reply.preset.story.ex" },
  { id: "debate", kind: "text", icon: "scale", audience: "custom", prompt: "тем, кто спорит или не согласен, но по-человечески, без хамства", nameKey: "ap.reply.preset.debate.name", whoKey: "ap.reply.preset.debate.who", exampleKey: "ap.reply.preset.debate.ex" },
  { id: "custom", kind: "custom", icon: "pen", audience: "custom", prompt: "", nameKey: "ap.reply.preset.custom.name", whoKey: "ap.reply.preset.custom.who", exampleKey: "ap.reply.preset.custom.ex" },
];

// Resolve the current account config (reply_audience + audience_prompt) back to a
// gallery preset id. A built-in enum maps to its same-id preset; "custom" maps to
// the TEXT preset whose ready prompt matches the saved prompt, else «Свой вариант».
export function presetIdFor(audience: ReplyAudience, prompt: string): string {
  if (audience !== "custom") return audience; // fans | all_except_trolls | questions
  const match = AUDIENCE_PRESETS.find((p) => p.kind === "text" && p.prompt === prompt.trim());
  return match ? match.id : "custom";
}

// The backend payload a chosen preset (+ the current description text, for
// text/custom) compiles to. Built-in ignores the description.
export function audiencePayload(
  preset: AudiencePreset,
  description: string,
): { reply_audience: ReplyAudience; audience_prompt: string } {
  if (preset.kind === "builtin") return { reply_audience: preset.audience, audience_prompt: "" };
  return { reply_audience: "custom", audience_prompt: description };
}

// A short audience PHRASE for the card's living sentence («Отвечает <phrase>…»).
// Built-in presets read from their own phrase key; text/custom read the user's
// description (trimmed), falling back to a generic «тем, кого ты описал».
export function audiencePhraseKey(presetId: string): MessageKey | null {
  switch (presetId) {
    case "fans":
      return "ap.reply.phrase.fans";
    case "all_except_trolls":
      return "ap.reply.phrase.all";
    case "questions":
      return "ap.reply.phrase.questions";
    default:
      return null; // text / custom → use the description
  }
}
