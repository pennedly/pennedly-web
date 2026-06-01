// stylerules-data.jsx — seed content for the Style & reply rules screen
// (/app/style-rules). One creator's setup (Mara Lin). Realistic rules — no lorem.

const SR_USER = { name: "Mara Lin", handle: "@mara.lin", initials: "ML" };

// the categories a built-in rule can belong to (also the filter set)
const RULE_KINDS = ["Punctuation", "Diction", "Structure", "Cadence", "Formatting", "Tone"];

// Built-in "anti-AI-tell" rules. on/off is the default state; two ship off so the
// off-state is visible out of the box.
const BUILTIN_RULES = [
  { id: "b1",  kind: "Punctuation", title: "No em-dashes", desc: "Swap em-dashes for a comma, a full stop, or parentheses. The runaway em-dash is the loudest tell of all.", on: true },
  { id: "b2",  kind: "Structure",   title: "Cut \u201cit\u2019s not just X, it\u2019s Y\u201d", desc: "Kill the not-just-but reversal and other templated contrasts that read as filler.", on: true },
  { id: "b3",  kind: "Cadence",     title: "Break the rule of three", desc: "Avoid the reflexive three-part list \u2014 \u201cclear, concise, and compelling.\u201d One sharp word beats three tidy ones.", on: true },
  { id: "b4",  kind: "Diction",     title: "Ban hype adjectives", desc: "No \u201cpowerful,\u201d \u201cseamless,\u201d \u201crobust,\u201d or \u201cgame-changing.\u201d Name the concrete thing instead.", on: true },
  { id: "b5",  kind: "Structure",   title: "Delete the windup", desc: "Strip throat-clearing openers like \u201cin today\u2019s fast-paced world\u201d or \u201clet\u2019s dive in.\u201d Start on the point.", on: true },
  { id: "b6",  kind: "Diction",     title: "Avoid \u201cdelve,\u201d \u201cleverage,\u201d \u201cutilize\u201d", desc: "Replace the LLM-favourite verbs with the plain ones a person would actually type.", on: true },
  { id: "b7",  kind: "Structure",   title: "Drop the bow-tie ending", desc: "No \u201cat the end of the day\u2026\u201d summary that just restates the post. End on the last real idea.", on: true },
  { id: "b8",  kind: "Formatting",  title: "No emoji bullets", desc: "Don\u2019t open lines with \u2728, \uD83D\uDE80, or \u2705. Let the words carry the structure.", on: true },
  { id: "b9",  kind: "Cadence",     title: "Vary sentence length", desc: "Mix short lines with long ones. Uniform medium-length sentences are the rhythm of a machine.", on: true },
  { id: "b10", kind: "Tone",        title: "Keep contractions", desc: "Use don\u2019t, it\u2019s, you\u2019re. Fully expanded forms read stiff and synthetic.", on: true },
  { id: "b11", kind: "Tone",        title: "No hedging filler", desc: "Cut \u201cI think,\u201d \u201carguably,\u201d \u201cit could be said that.\u201d Commit to the sentence.", on: false },
  { id: "b12", kind: "Formatting",  title: "No hashtag stacks", desc: "Never append #writing #content #threads. One hashtag, and only if it truly earns its place.", on: false },
];

// The user's own freeform rules (plain text). Used for the "with a few" state;
// the "empty" state is driven by a tweak.
const FREEFORM_RULES = [
  { id: "f1", text: "Never open a reply with \u201cGreat question!\u201d or \u201cLove this.\u201d" },
  { id: "f2", text: "Keep replies to two sentences unless someone clearly wants more." },
  { id: "f3", text: "Quote a specific detail from their post \u2014 never a generic platitude." },
];

// a few example prompts shown under the empty add-input to get people started
const FREEFORM_HINTS = [
  "Always spell out numbers under ten",
  "No exclamation marks in replies",
  "Mention a book only when it's genuinely relevant",
];

Object.assign(window, { SR_USER, RULE_KINDS, BUILTIN_RULES, FREEFORM_RULES, FREEFORM_HINTS });
