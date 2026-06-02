// stylerules-data.jsx — seed content for the Style & reply rules screen
// (/app/style-rules). One creator's setup (Mara Lin). Realistic rules — no lorem.

// Built-in rules are a FIXED catalog grouped by these categories (render order).
const RULE_CATEGORIES = ["Punctuation", "Diction", "Structure", "Cadence", "Formatting", "Tone"];

// Per-rule applicability. omitted / "all" → applies to posts AND replies (no chip);
// "post" / "reply" → shows a "Posts only" / "Replies only" chip.
// `stripper:true` marks the one rule whose switch ALSO drives a deterministic
// typographic pass (see `note` + `demo`).

const BUILTIN_RULES = [
  {
    id: "b1", category: "Punctuation", title: "Human punctuation",
    desc: "Avoid the runaway em-dash — the loudest tell of all — and the guillemets («») some models leave behind. Reach for commas, full stops, or parentheses instead.",
    on: true, stripper: true,
    note: "Its switch also runs a deterministic typographic pass after every draft (no model involved): em-dashes (—) → commas, guillemets («») → straight quotes.",
    demo: { from: "It works — mostly — and reads «human».", to: "It works, mostly, and reads \"human\"." },
  },
  { id: "b2", category: "Structure", title: "Cut \u201Cit\u2019s not just X, it\u2019s Y\u201D", desc: "Kill the not-just-but reversal and other templated contrasts that read as filler.", on: true },
  { id: "b3", category: "Cadence", title: "Break the rule of three", desc: "Avoid the reflexive three-part list, \u201Cclear, concise, and compelling.\u201D One sharp word beats three tidy ones.", on: true },
  { id: "b4", category: "Diction", title: "Ban hype adjectives", desc: "No \u201Cpowerful,\u201D \u201Cseamless,\u201D \u201Crobust,\u201D or \u201Cgame-changing.\u201D Name the concrete thing instead.", on: true },
  { id: "b5", category: "Structure", title: "Delete the windup", desc: "Strip throat-clearing openers like \u201Cin today\u2019s fast-paced world\u201D or \u201Clet\u2019s dive in.\u201D Start on the point.", on: true },
  { id: "b6", category: "Diction", title: "Avoid \u201Cdelve,\u201D \u201Cleverage,\u201D \u201Cutilize\u201D", desc: "Replace the LLM-favourite verbs with the plain ones a person would actually type.", on: true },
  { id: "b7", category: "Structure", title: "Drop the bow-tie ending", desc: "No \u201Cat the end of the day\u2026\u201D summary that just restates the post. End on the last real idea.", on: true },
  { id: "b8", category: "Formatting", title: "No emoji bullets", desc: "Don\u2019t open lines with \u2728, \uD83D\uDE80, or \u2705. Let the words carry the structure.", on: true, applies: "post" },
  { id: "b9", category: "Cadence", title: "Vary sentence length", desc: "Mix short lines with long ones. Uniform medium-length sentences are the rhythm of a machine.", on: true },
  { id: "b10", category: "Tone", title: "Keep contractions", desc: "Use don\u2019t, it\u2019s, you\u2019re. Fully expanded forms read stiff and synthetic.", on: true },
  { id: "b11", category: "Tone", title: "No hedging filler", desc: "Cut \u201CI think,\u201D \u201Carguably,\u201D \u201Cit could be said that.\u201D Commit to the sentence.", on: false },
  { id: "b12", category: "Formatting", title: "No hashtag stacks", desc: "Never append #writing #content #threads. One hashtag, and only if it truly earns its place.", on: false, applies: "post" },
];

// The user's own freeform rules. kind: "all" | "post" | "reply". enabled toggles
// whether the rule is applied. Used for the "with a few" state; the empty state
// is driven by a tweak.
const FREEFORM_RULES = [
  { id: "f1", text: "Never open a reply with \u201CGreat question!\u201D or \u201CLove this.\u201D", kind: "reply", enabled: true },
  { id: "f2", text: "Keep replies to two sentences unless someone clearly wants more.", kind: "reply", enabled: true },
  { id: "f3", text: "Quote a specific detail from the post I'm replying to \u2014 never a generic platitude.", kind: "reply", enabled: true },
  { id: "f4", text: "Open a post on a concrete moment from my week, not a definition.", kind: "post", enabled: true },
];

// example prompts shown under the empty add-input to get people started
const FREEFORM_HINTS = [
  "Spell out numbers under ten",
  "No exclamation marks in replies",
  "Mention a book only when it's genuinely relevant",
];

Object.assign(window, { RULE_CATEGORIES, BUILTIN_RULES, FREEFORM_RULES, FREEFORM_HINTS });
