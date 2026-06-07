// Voice (role-book) demo dataset — the literal content from Voice-SPEC.html
// (mirrors design-export/PennedlyDesign voice-data.jsx), every em-dash stripped.
// Powers the tester ?demo=1 review so the screen renders all seven states
// (populated / edit / check / re-extract / translated / prompt / empty) with no
// auth and no backend. Shaped exactly like the real RoleBook / RoleBookSections
// / LintResult so the live render path is reused verbatim.

import type { LintResult, RoleBook, RoleBookSections } from "@/lib/types";

// NOT `as const` — tweak values must widen to {boolean, string}.
export const VC_TWEAK_DEFAULTS = { dark: false, state: "Populated" };

export const DEMO_POSTS_ANALYZED = 312;

const INTRO_EN =
  "Mara writes like she's leaving a voice note for one friend who also makes things on the internet, warm, but never gushing. She earns every claim with a small, specific moment from her own week, then gets out of the way. Plain words over clever ones. Short paragraphs. The occasional dry joke, usually at her own expense.";
const INTRO_DE =
  "Mara schreibt, als hinterließe sie einer Freundin, die auch Dinge im Internet macht, eine Sprachnachricht, warm, aber nie überschwänglich. Sie untermauert jede Aussage mit einem kleinen, konkreten Moment ihrer Woche und tritt dann zurück. Einfache Worte statt cleverer. Kurze Absätze. Hin und wieder ein trockener Witz, meist auf eigene Kosten.";

// ── English (editable original) ──────────────────────────────────────────────
export const DEMO_SECTIONS: RoleBookSections = {
  intro: INTRO_EN,
  themes_include: [
    { id: "ti1", label: "The craft of writing", note: "Finding a voice, cutting words, the gap between polished and honest." },
    { id: "ti2", label: "Building in public", note: "Cadence over bursts, the unglamorous middle, showing work before it's finished." },
    { id: "ti3", label: "Creative courage", note: "Publishing before you feel ready, and the quiet cost of waiting to be good." },
    { id: "ti4", label: "Audience, honestly", note: "Writing for the right hundred people instead of chasing reach." },
    { id: "ti5", label: "Anti-hype", note: "Calling out performative advice and engagement theatre." },
  ],
  themes_exclude: [
    { id: "tx1", label: "Personal life & family", note: "Keep the people in my life off the timeline." },
    { id: "tx2", label: "The daily outrage cycle", note: "No reacting to the news or piling onto drama." },
    { id: "tx3", label: "Income & follower counts", note: "No revenue screenshots, no growth-flexing." },
    { id: "tx4", label: "Other people's launches", note: "Don't comment on competitors or subtweet." },
  ],
  voice_characteristics: [
    { id: "ch1", label: "Warmth", text: "Warm but never gushing, like a voice note to one friend who also makes things." },
    { id: "ch2", label: "Evidence", text: "Earns every claim with a small, specific moment from the week." },
    { id: "ch3", label: "Restraint", text: "Plain words over clever ones; gets out of the way once the point lands." },
    { id: "ch4", label: "Humor", text: "Dry, occasional, usually at her own expense." },
    { id: "ch5", label: "Rhythm", text: "Short paragraphs. One idea per post." },
  ],
  do_list: [
    { id: "do1", text: "Open with the concrete, a specific moment before any lesson." },
    { id: "do2", text: "End on a turn: a small reversal, or a question that lingers." },
    { id: "do3", text: "Keep posts to one idea, three sentences at most." },
    { id: "do4", text: "Sentence case for posts; lowercase, conversational replies." },
  ],
  dont_list: [
    { id: "dn1", text: 'Never use "leverage," "unlock," or "game-changer."' },
    { id: "dn2", text: 'No hashtags, no emoji, no "thread 🧵" theatrics.' },
    { id: "dn3", text: "Don't chase reach or mention follower counts." },
    { id: "dn4", text: "No engagement-bait questions you don't actually care about." },
  ],
  examples: [
    { id: "ex1", context: "post", text: "Wrote 1,000 words this morning before I opened email. Cut 600 of them. The 400 that survived are the only ones that were ever going to matter." },
    { id: "ex2", context: "post", text: "You don't need a bigger audience. You need a hundred people who'd be genuinely bummed if you stopped. 🙂" },
    { id: "ex3", context: "reply", text: "Start before you feel ready. I open a doc and write the worst possible first line on purpose, it kills the pressure to be good, and the real sentence usually shows up by line three." },
  ],
};

// ── German (read-only translated reading layer) ──────────────────────────────
export const DEMO_SECTIONS_DE: RoleBookSections = {
  intro: INTRO_DE,
  themes_include: [
    { id: "ti1", label: "Das Handwerk des Schreibens", note: "Eine Stimme finden, Wörter kürzen, die Kluft zwischen poliert und ehrlich." },
    { id: "ti2", label: "Öffentlich aufbauen", note: "Beständigkeit statt Schübe, die unglamouröse Mitte, Arbeit vor der Fertigstellung zeigen." },
    { id: "ti3", label: "Kreativer Mut", note: "Veröffentlichen, bevor man sich bereit fühlt, und der stille Preis des Wartens." },
    { id: "ti4", label: "Publikum, ehrlich", note: "Für die richtigen hundert Menschen schreiben, statt Reichweite zu jagen." },
    { id: "ti5", label: "Anti-Hype", note: "Effekthascherische Ratschläge und Engagement-Theater benennen." },
  ],
  themes_exclude: [
    { id: "tx1", label: "Privatleben & Familie", note: "Die Menschen in meinem Leben aus der Timeline heraushalten." },
    { id: "tx2", label: "Der tägliche Empörungszyklus", note: "Nicht auf Nachrichten reagieren oder mich in Dramen einreihen." },
    { id: "tx3", label: "Einkommen & Followerzahlen", note: "Keine Umsatz-Screenshots, kein Wachstums-Protzen." },
    { id: "tx4", label: "Launches anderer Leute", note: "Keine Kommentare über Mitbewerber, keine Sticheleien." },
  ],
  voice_characteristics: [
    { id: "ch1", label: "Wärme", text: "Warm, aber nie überschwänglich, wie eine Sprachnachricht an eine Freundin, die auch etwas schafft." },
    { id: "ch2", label: "Beleg", text: "Untermauert jede Aussage mit einem kleinen, konkreten Moment der Woche." },
    { id: "ch3", label: "Zurückhaltung", text: "Einfache Worte statt cleverer; tritt zurück, sobald der Punkt sitzt." },
    { id: "ch4", label: "Humor", text: "Trocken, gelegentlich, meist auf eigene Kosten." },
    { id: "ch5", label: "Rhythmus", text: "Kurze Absätze. Eine Idee pro Beitrag." },
  ],
  do_list: [
    { id: "do1", text: "Beginne konkret, ein bestimmter Moment vor jeder Lehre." },
    { id: "do2", text: "Ende mit einer Wendung: eine kleine Kehrtwende oder eine Frage, die nachhallt." },
    { id: "do3", text: "Halte Beiträge auf eine Idee, höchstens drei Sätze." },
    { id: "do4", text: "Satzanfang groß bei Beiträgen; Antworten klein und gesprächig." },
  ],
  dont_list: [
    { id: "dn1", text: 'Niemals "leveragen," "freischalten" oder "Game-Changer" verwenden.' },
    { id: "dn2", text: 'Keine Hashtags, keine Emojis, kein "Thread 🧵"-Theater.' },
    { id: "dn3", text: "Jage keine Reichweite und erwähne keine Followerzahlen." },
    { id: "dn4", text: "Keine Köderfragen, die dich eigentlich nicht interessieren." },
  ],
  examples: [
    { id: "ex1", context: "post", text: "Heute Morgen 1.000 Wörter geschrieben, bevor ich die Mails öffnete. 600 gestrichen. Die 400, die blieben, waren die einzigen, auf die es je ankam." },
    { id: "ex2", context: "post", text: "Du brauchst kein größeres Publikum. Du brauchst hundert Menschen, die es ehrlich bedauern würden, wenn du aufhörst. 🙂" },
    { id: "ex3", context: "reply", text: "Fang an, bevor du dich bereit fühlst. Ich öffne ein Dokument und schreibe absichtlich die schlechteste erste Zeile, das nimmt den Druck, gut zu sein, und der echte Satz kommt meist ab Zeile drei." },
  ],
};

// The literal system prompt assembled from the sections (read-only preview).
export const DEMO_PROMPT_TEXT = [
  "VOICE PROFILE",
  "",
  "# Voice summary",
  INTRO_EN,
  "",
  "# Write about",
  ...DEMO_SECTIONS.themes_include!.map((x) => `- ${x.label}: ${x.note}`),
  "",
  "# Never write about",
  ...DEMO_SECTIONS.themes_exclude!.map((x) => `- ${x.label}`),
  "",
  "# Voice characteristics",
  ...DEMO_SECTIONS.voice_characteristics!.map((x) => `- ${x.label}: ${x.text}`),
  "",
  "# Always",
  ...DEMO_SECTIONS.do_list!.map((x) => `- ${x.text}`),
  "",
  "# Never",
  ...DEMO_SECTIONS.dont_list!.map((x) => `- ${x.text}`),
  "",
  "# Reference posts, match their rhythm and length",
  ...DEMO_SECTIONS.examples!.map((x, i) => `${i + 1}. ${x.text}`),
].join("\n");

export const DEMO_BOOK: RoleBook = {
  role_book_id: 1,
  name: "voice",
  sections: DEMO_SECTIONS,
  prompt_text: DEMO_PROMPT_TEXT,
  created_by: "extract",
  parent_id: null,
  activated_at: "2026-06-04T10:00:00Z",
  posts_analyzed: DEMO_POSTS_ANALYZED,
};

// Two conflicts surfaced by Check: a caution (length cap vs opening rule, all
// three Do rows flagged) and a contradiction (no-emoji vs an example, dn2 + ex2
// flagged). Each carries a one-click structured fix.
export const DEMO_LINT: LintResult = {
  llm_model: "Pennedly Craft 2",
  prompt_tokens: 0,
  completion_tokens: 0,
  latency_ms: 0,
  linted_sections: DEMO_SECTIONS,
  conflicts: [
    {
      severity: "medium",
      title: "Your length cap fights your opening rule",
      description:
        "Three sentences rarely hold a setup, a lesson, and a turn. Drafts will either overrun the cap or drop the opening detail that makes them sound like you.",
      items: [
        { section: "do_list", id: "do3", text: "Keep posts to one idea, three sentences at most." },
        { section: "do_list", id: "do1", text: "Open with the concrete, a specific moment before any lesson." },
        { section: "do_list", id: "do2", text: "End on a turn: a small reversal, or a question that lingers." },
      ],
      suggestion: 'Relax the cap to "usually three sentences, up to five when a post needs its setup."',
      fix: {
        kind: "set_field",
        section: "do_list",
        id: "do3",
        field: "text",
        value: "Keep posts to one idea, usually three sentences, up to five when a post needs its setup.",
      },
    },
    {
      severity: "high",
      title: '"No emoji" contradicts one of your examples',
      description:
        'Pennedly learned "no emoji" as a hard rule, but a saved example ends with one. It will second-guess which signal to trust on every draft.',
      items: [
        { section: "dont_list", id: "dn2", text: 'No hashtags, no emoji, no "thread 🧵" theatrics.' },
        { section: "examples", id: "ex2", text: "...a hundred people who'd be genuinely bummed if you stopped. 🙂" },
      ],
      suggestion: "Drop the emoji from the example so it matches the rule.",
      fix: {
        kind: "set_field",
        section: "examples",
        id: "ex2",
        field: "text",
        value: "You don't need a bigger audience. You need a hundred people who'd be genuinely bummed if you stopped.",
      },
    },
  ],
};
