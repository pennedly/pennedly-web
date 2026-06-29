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

// ════════════════════════════════════════════════════════════════════════════
//  Multi-select model («Кому отвечать» — Reply-Audience-Multiselect-SPEC)
//  Two groups: A = the 3 deterministic enum filters (pick ONE, like radio);
//  B = the text presets + «Свой вариант» (any combination, like checkboxes).
//  A and B are mutually exclusive. The B selection compiles to a single OR-joined
//  `audience_prompt` (reply_audience='custom'). The backend is unchanged — one
//  enum + one free-text field — so all of this is FE-only.
// ════════════════════════════════════════════════════════════════════════════

// The OR separator used to glue B fragments into one prompt + to split it back.
export const AUDIENCE_OR = " или ";

// The group an audience preset belongs to (builtin → A, text/custom → B).
export const AUDIENCE_A_IDS = AUDIENCE_PRESETS.filter((p) => p.kind === "builtin").map((p) => p.id);
export const AUDIENCE_B_IDS = AUDIENCE_PRESETS.filter((p) => p.kind !== "builtin").map((p) => p.id);

// The editing model the multi-select gallery works with. `manual` is a session
// flag: ON once the user hand-edits the merged description, so toggling tiles no
// longer regenerates it (until they hit «Собрать заново»). It's always false on
// load — a saved prompt is re-derived back into tiles.
export type AudienceModel =
  | { group: "a"; a: ReplyAudience }
  | { group: "b"; b: string[]; custom: string; manual: boolean };

// The TEXT presets in canonical (gallery) order, longest-prompt-first for greedy
// prefix matching during decompose.
const TEXT_PRESETS = AUDIENCE_PRESETS.filter((p) => p.kind === "text");
const TEXT_BY_LEN = [...TEXT_PRESETS].sort((a, b) => b.prompt.length - a.prompt.length);

// Glue the chosen B presets (+ the «Свой вариант» free text) into one OR-prompt,
// in canonical preset order. Empty fragments are skipped; «custom» contributes
// its trimmed text last. Returns "" when nothing contributes.
export function mergeAudiencePrompt(bIds: string[], custom: string): string {
  const parts: string[] = [];
  for (const p of TEXT_PRESETS) {
    if (bIds.includes(p.id) && p.prompt.trim()) parts.push(p.prompt.trim());
  }
  if (bIds.includes("custom") && custom.trim()) parts.push(custom.trim());
  return parts.join(AUDIENCE_OR);
}

// Reconstruct the editing model from a saved (reply_audience, audience_prompt).
// A builtin enum → group A. `custom` → greedily decompose the prompt back into
// known text fragments (+ a custom leftover), so editing keeps the SAME tiles
// lit. The decomposition is verified to round-trip exactly; if it doesn't (the
// prompt was hand-written/reordered), it falls back to a single «Свой вариант»
// holding the whole text — behaviour is preserved either way.
export function decomposeAudience(audience: ReplyAudience, prompt: string): AudienceModel {
  if (audience !== "custom") return { group: "a", a: audience };
  let rest = prompt.trim();
  const ids: string[] = [];
  // Greedy: peel off known fragments (longest first) separated by AUDIENCE_OR.
  for (;;) {
    const hit = TEXT_BY_LEN.find((p) => rest === p.prompt.trim() || rest.startsWith(p.prompt.trim() + AUDIENCE_OR));
    if (!hit) break;
    ids.push(hit.id);
    rest = rest === hit.prompt.trim() ? "" : rest.slice(hit.prompt.trim().length + AUDIENCE_OR.length);
    if (rest === "") break;
  }
  const leftover = rest.trim();
  const b = TEXT_PRESETS.filter((p) => ids.includes(p.id)).map((p) => p.id);
  if (leftover) b.push("custom");
  const model: AudienceModel = { group: "b", b, custom: leftover, manual: false };
  // Safety net: if our decomposition doesn't reproduce the exact stored prompt
  // (e.g. user reordered/edited it by hand), treat the whole thing as «Свой».
  if (mergeAudiencePrompt(b, leftover) !== prompt.trim()) {
    return { group: "b", b: prompt.trim() ? ["custom"] : [], custom: prompt.trim(), manual: false };
  }
  return model;
}

// Compile the editing model back to the backend payload (reply_audience +
// audience_prompt). Group A → the enum, no prompt. Group B → custom + the merged
// (or hand-edited) prompt.
export function audienceModelPayload(
  model: AudienceModel,
  description: string,
): { reply_audience: ReplyAudience; audience_prompt: string } {
  if (model.group === "a") return { reply_audience: model.a, audience_prompt: "" };
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
