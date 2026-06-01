// voice-data.jsx — seed content for the Voice screen (/app/role-book).
// One creator's voice (Mara Lin — writes about writing, building in public,
// and the craft of posting). Realistic themes / traits / examples — no lorem.

const VC_USER = {
  name: "Mara Lin",
  handle: "@mara.lin",
  initials: "ML",
};

// meta shown in the voice header
const VOICE_META = {
  sources: 312,          // posts the voice was extracted from
  updated: "3 days ago",
  match: 94,             // how closely recent drafts matched (a quiet confidence read)
};

// The voice as four editable sections. IDs are stable so lint fixes can target them.
const VOICE_SECTIONS = {
  intro:
    "Mara writes like she's leaving a voice note for one friend who also makes things on the internet — warm, but never gushing. She earns every claim with a small, specific moment from her own week, then gets out of the way. Plain words over clever ones. Short paragraphs. The occasional dry joke, usually at her own expense.",

  themes: [
    { id: "th1", label: "The craft of writing", note: "Finding a voice, cutting words, the gap between polished and honest." },
    { id: "th2", label: "Building in public", note: "Cadence over bursts, the unglamorous middle, showing work before it's finished." },
    { id: "th3", label: "Creative courage", note: "Publishing before you feel ready, and the quiet cost of waiting to be good." },
    { id: "th4", label: "Audience, honestly", note: "Writing for the right hundred people instead of chasing reach." },
    { id: "th5", label: "Anti-hype", note: "Calling out performative advice and engagement theatre." },
  ],

  traits: [
    { id: "tr1", kind: "Length", text: "Keep posts to one idea — three sentences at most." },
    { id: "tr2", kind: "Structure", text: "Open with the concrete: a specific moment before any lesson." },
    { id: "tr3", kind: "Structure", text: "End on a turn — a small reversal, or a question that lingers." },
    { id: "tr4", kind: "Diction", text: "Plain words only. Never \u201cleverage,\u201d \u201cunlock,\u201d or \u201cgame-changer.\u201d" },
    { id: "tr5", kind: "Format", text: "No hashtags, no emoji, no \u201cthread \uD83E\uDDF5\u201d theatrics." },
    { id: "tr6", kind: "Casing", text: "Sentence-case for posts; lowercase, conversational replies." },
  ],

  examples: [
    {
      id: "ex1",
      context: "Post",
      stat: "412 likes",
      text: "Wrote 1,000 words this morning before I opened email. Cut 600 of them. The 400 that survived are the only ones that were ever going to matter.",
    },
    {
      id: "ex2",
      context: "Post",
      stat: "980 likes",
      // NOTE: ends with an emoji — intentionally conflicts with trait tr5 (no emoji).
      text: "You don't need a bigger audience. You need a hundred people who'd be genuinely bummed if you stopped. \uD83D\uDE42",
    },
    {
      id: "ex3",
      context: "Reply",
      stat: "138 likes",
      text: "Start before you feel ready. I open a doc and write the worst possible first line on purpose — it kills the pressure to be good, and the real sentence usually shows up by line three.",
    },
  ],
};

// Lint conflicts. Each fix targets a specific section + id so "Apply" mutates the
// real voice state. severity: "caution" (tension) | "conflict" (contradiction).
const VOICE_CONFLICTS = [
  {
    id: "c1",
    severity: "caution",
    title: "Your length cap fights your structure rule",
    parts: [
      { label: "Trait · Length", text: "Keep posts to one idea — three sentences at most." },
      { label: "Trait · Structure", text: "Open with the concrete, then the lesson, then end on a turn." },
    ],
    why: "Three sentences rarely hold a setup, a lesson, and a turn. Drafts will either overrun the cap or drop the opening detail that makes them sound like you.",
    fix: {
      summary: "Relax the cap to \u201cusually three sentences, up to five when a post needs its setup.\u201d",
      section: "traits",
      id: "tr1",
      field: "text",
      value: "Keep posts to one idea — usually three sentences, up to five when a post needs its setup.",
    },
  },
  {
    id: "c2",
    severity: "conflict",
    title: "\u201cNo emoji\u201d contradicts one of your examples",
    parts: [
      { label: "Trait · Format", text: "No hashtags, no emoji, no \u201cthread \uD83E\uDDF5\u201d theatrics." },
      { label: "Example · Post", text: "\u2026a hundred people who'd be genuinely bummed if you stopped. \uD83D\uDE42" },
    ],
    why: "Pennedly learned \u201cno emoji\u201d as a hard rule, but a saved example ends with one. It will second-guess which signal to trust on every draft.",
    fix: {
      summary: "Drop the \uD83D\uDE42 from the example so it matches the rule.",
      section: "examples",
      id: "ex2",
      field: "text",
      value: "You don't need a bigger audience. You need a hundred people who'd be genuinely bummed if you stopped.",
    },
  },
];

// Re-extraction progress steps (the in-progress state).
const REEXTRACT_STEPS = [
  "Reading your 312 recent posts",
  "Clustering the themes you return to",
  "Distilling the traits that stay constant",
  "Choosing examples that show the voice",
];

Object.assign(window, { VC_USER, VOICE_META, VOICE_SECTIONS, VOICE_CONFLICTS, REEXTRACT_STEPS });
