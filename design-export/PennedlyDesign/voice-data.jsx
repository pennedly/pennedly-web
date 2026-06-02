// voice-data.jsx — seed content for the Voice screen (/app/voice).
// One creator's voice (Mara Lin — writes about writing & building in public).
// Realistic content, no lorem. The voice is SEVEN editable sections.
//
// TRANSLATION MODEL: English is the source/original (editable). Every item
// carries an `i18n` map with bundled translations; this prototype bundles
// Spanish (es) + German (de). In production every locale in window.UI_LANGS is
// available (translated on demand). vLoc() reads a localized field, falling back
// to the original — so editing the original naturally supersedes a stale string.

// meta shown in the voice header — NOTE: deliberately NO "voice match %".
const VOICE_META = { sources: 312, updated: "3 days ago" };

// Languages the picker offers here, sourced from the shared UI_LANGS list.
const VOICE_LANGS = ["en", "es", "de"];

function vLoc(item, lang, field) {
  if (!lang || lang === "en") return item[field];
  return (item.i18n && item.i18n[lang] && item.i18n[lang][field]) || item[field];
}

const VOICE_SECTIONS = {
  // 1 · intro / through-line (plain text)
  intro:
    "Mara writes like she's leaving a voice note for one friend who also makes things on the internet — warm, but never gushing. She earns every claim with a small, specific moment from her own week, then gets out of the way. Plain words over clever ones. Short paragraphs. The occasional dry joke, usually at her own expense.",

  // 2 · themes to INCLUDE
  themesInclude: [
    { id: "ti1", label: "The craft of writing", note: "Finding a voice, cutting words, the gap between polished and honest.",
      i18n: { es: { label: "El oficio de escribir", note: "Encontrar una voz, recortar palabras, la distancia entre lo pulido y lo honesto." }, de: { label: "Das Handwerk des Schreibens", note: "Eine Stimme finden, Wörter kürzen, die Kluft zwischen poliert und ehrlich." } } },
    { id: "ti2", label: "Building in public", note: "Cadence over bursts, the unglamorous middle, showing work before it's finished.",
      i18n: { es: { label: "Construir en público", note: "Constancia antes que arranques, la parte sin glamour, mostrar el trabajo sin terminar." }, de: { label: "Öffentlich aufbauen", note: "Beständigkeit statt Schübe, die unglamouröse Mitte, Arbeit vor der Fertigstellung zeigen." } } },
    { id: "ti3", label: "Creative courage", note: "Publishing before you feel ready, and the quiet cost of waiting to be good.",
      i18n: { es: { label: "Valentía creativa", note: "Publicar antes de sentirte listo, y el coste silencioso de esperar a ser bueno." }, de: { label: "Kreativer Mut", note: "Veröffentlichen, bevor man sich bereit fühlt, und der stille Preis des Wartens." } } },
    { id: "ti4", label: "Audience, honestly", note: "Writing for the right hundred people instead of chasing reach.",
      i18n: { es: { label: "El público, con honestidad", note: "Escribir para las cien personas correctas en vez de perseguir alcance." }, de: { label: "Publikum, ehrlich", note: "Für die richtigen hundert Menschen schreiben, statt Reichweite zu jagen." } } },
    { id: "ti5", label: "Anti-hype", note: "Calling out performative advice and engagement theatre.",
      i18n: { es: { label: "Anti-hype", note: "Señalar los consejos para la galería y el teatro del engagement." }, de: { label: "Anti-Hype", note: "Effekthascherische Ratschläge und Engagement-Theater benennen." } } },
  ],

  // 3 · themes to EXCLUDE — the "won't write about this" zone
  themesExclude: [
    { id: "tx1", label: "Personal life & family", note: "Keep the people in my life off the timeline.",
      i18n: { es: { label: "Vida personal y familia", note: "Mantener a la gente de mi vida fuera de la timeline." }, de: { label: "Privatleben & Familie", note: "Die Menschen in meinem Leben aus der Timeline heraushalten." } } },
    { id: "tx2", label: "The daily outrage cycle", note: "No reacting to the news or piling onto drama.",
      i18n: { es: { label: "El ciclo diario de indignación", note: "No reaccionar a las noticias ni sumarme al drama." }, de: { label: "Der tägliche Empörungszyklus", note: "Nicht auf Nachrichten reagieren oder mich in Dramen einreihen." } } },
    { id: "tx3", label: "Income & follower counts", note: "No revenue screenshots, no growth-flexing.",
      i18n: { es: { label: "Ingresos y número de seguidores", note: "Sin capturas de ingresos ni alardes de crecimiento." }, de: { label: "Einkommen & Followerzahlen", note: "Keine Umsatz-Screenshots, kein Wachstums-Protzen." } } },
    { id: "tx4", label: "Other people's launches", note: "Don't comment on competitors or subtweet.",
      i18n: { es: { label: "Lanzamientos de otros", note: "No comentar sobre la competencia ni hacer indirectas." }, de: { label: "Launches anderer Leute", note: "Keine Kommentare über Mitbewerber, keine Sticheleien." } } },
  ],

  // 4 · voice characteristics — descriptive qualities (label + line)
  characteristics: [
    { id: "ch1", label: "Warmth", text: "Warm but never gushing — like a voice note to one friend who also makes things.",
      i18n: { es: { label: "Calidez", text: "Cálida pero nunca empalagosa: como una nota de voz a un amigo que también crea cosas." }, de: { label: "Wärme", text: "Warm, aber nie überschwänglich — wie eine Sprachnachricht an eine Freundin, die auch etwas schafft." } } },
    { id: "ch2", label: "Evidence", text: "Earns every claim with a small, specific moment from the week.",
      i18n: { es: { label: "Evidencia", text: "Justifica cada afirmación con un momento pequeño y concreto de la semana." }, de: { label: "Beleg", text: "Untermauert jede Aussage mit einem kleinen, konkreten Moment der Woche." } } },
    { id: "ch3", label: "Restraint", text: "Plain words over clever ones; gets out of the way once the point lands.",
      i18n: { es: { label: "Contención", text: "Palabras llanas antes que ingeniosas; se aparta en cuanto el punto cala." }, de: { label: "Zurückhaltung", text: "Einfache Worte statt cleverer; tritt zurück, sobald der Punkt sitzt." } } },
    { id: "ch4", label: "Humor", text: "Dry, occasional, usually at her own expense.",
      i18n: { es: { label: "Humor", text: "Seco, ocasional, normalmente a su propia costa." }, de: { label: "Humor", text: "Trocken, gelegentlich, meist auf eigene Kosten." } } },
    { id: "ch5", label: "Rhythm", text: "Short paragraphs. One idea per post.",
      i18n: { es: { label: "Ritmo", text: "Párrafos cortos. Una idea por publicación." }, de: { label: "Rhythmus", text: "Kurze Absätze. Eine Idee pro Beitrag." } } },
  ],

  // 5 · DO — rules to follow
  do: [
    { id: "do1", text: "Open with the concrete — a specific moment before any lesson.",
      i18n: { es: { text: "Empieza con lo concreto: un momento específico antes de cualquier lección." }, de: { text: "Beginne konkret — ein bestimmter Moment vor jeder Lehre." } } },
    { id: "do2", text: "End on a turn: a small reversal, or a question that lingers.",
      i18n: { es: { text: "Termina con un giro: un pequeño vuelco o una pregunta que se queda." }, de: { text: "Ende mit einer Wendung: eine kleine Kehrtwende oder eine Frage, die nachhallt." } } },
    { id: "do3", text: "Keep posts to one idea — three sentences at most.",
      i18n: { es: { text: "Limita cada publicación a una idea: tres frases como máximo." }, de: { text: "Halte Beiträge auf eine Idee — höchstens drei Sätze." } } },
    { id: "do4", text: "Sentence case for posts; lowercase, conversational replies.",
      i18n: { es: { text: "Mayúscula inicial en publicaciones; respuestas en minúscula y conversacionales." }, de: { text: "Satzanfang groß bei Beiträgen; Antworten klein und gesprächig." } } },
  ],

  // 6 · DON'T — rules to avoid
  dont: [
    { id: "dn1", text: "Never use \u201Cleverage,\u201D \u201Cunlock,\u201D or \u201Cgame-changer.\u201D",
      i18n: { es: { text: "Nunca uses \u201Capalancar,\u201D \u201Cdesbloquear\u201D ni \u201Crevolucionario.\u201D" }, de: { text: "Niemals \u201Eleveragen,\u201C \u201Efreischalten\u201C oder \u201EGame-Changer\u201C verwenden." } } },
    { id: "dn2", text: "No hashtags, no emoji, no \u201Cthread \uD83E\uDDF5\u201D theatrics.",
      i18n: { es: { text: "Sin hashtags, sin emoji, sin teatro de \u201Chilo \uD83E\uDDF5.\u201D" }, de: { text: "Keine Hashtags, keine Emojis, kein \u201EThread \uD83E\uDDF5\u201C-Theater." } } },
    { id: "dn3", text: "Don't chase reach or mention follower counts.",
      i18n: { es: { text: "No persigas alcance ni menciones el número de seguidores." }, de: { text: "Jage keine Reichweite und erwähne keine Followerzahlen." } } },
    { id: "dn4", text: "No engagement-bait questions you don't actually care about.",
      i18n: { es: { text: "Nada de preguntas cebo que en realidad no te importan." }, de: { text: "Keine Köderfragen, die dich eigentlich nicht interessieren." } } },
  ],

  // 7 · example posts
  examples: [
    { id: "ex1", context: "Post", stat: "412 likes",
      text: "Wrote 1,000 words this morning before I opened email. Cut 600 of them. The 400 that survived are the only ones that were ever going to matter.",
      i18n: { es: { text: "Escribí 1.000 palabras esta mañana antes de abrir el correo. Recorté 600. Las 400 que sobrevivieron son las únicas que iban a importar." }, de: { text: "Heute Morgen 1.000 Wörter geschrieben, bevor ich die Mails öffnete. 600 gestrichen. Die 400, die blieben, waren die einzigen, auf die es je ankam." } } },
    { id: "ex2", context: "Post", stat: "980 likes",
      // ends with an emoji — intentionally conflicts with dn2 (no emoji)
      text: "You don't need a bigger audience. You need a hundred people who'd be genuinely bummed if you stopped. \uD83D\uDE42",
      i18n: { es: { text: "No necesitas un público más grande. Necesitas cien personas a las que de verdad les daría pena que pararas. \uD83D\uDE42" }, de: { text: "Du brauchst kein größeres Publikum. Du brauchst hundert Menschen, die es ehrlich bedauern würden, wenn du aufhörst. \uD83D\uDE42" } } },
    { id: "ex3", context: "Reply", stat: "138 likes",
      text: "Start before you feel ready. I open a doc and write the worst possible first line on purpose — it kills the pressure to be good, and the real sentence usually shows up by line three.",
      i18n: { es: { text: "Empieza antes de sentirte listo. Abro un documento y escribo a propósito la peor primera línea posible: mata la presión de ser bueno, y la frase real suele aparecer hacia la tercera línea." }, de: { text: "Fang an, bevor du dich bereit fühlst. Ich öffne ein Dokument und schreibe absichtlich die schlechteste erste Zeile — das nimmt den Druck, gut zu sein, und der echte Satz kommt meist ab Zeile drei." } } },
  ],
};

// Lint conflicts. Each fix targets section + id so "Apply" mutates the real
// voice. `flags` lists the rows each conflict implicates (for the quiet
// flagged highlight). severity: "caution" (tension) | "conflict" (contradiction).
const VOICE_CONFLICTS = [
  {
    id: "c1", severity: "caution",
    title: "Your length cap fights your opening rule",
    parts: [
      { label: "Do · length", text: "Keep posts to one idea — three sentences at most." },
      { label: "Do · structure", text: "Open with the concrete, then end on a turn." },
    ],
    why: "Three sentences rarely hold a setup, a lesson, and a turn. Drafts will either overrun the cap or drop the opening detail that makes them sound like you.",
    flags: [["do", "do3"], ["do", "do1"], ["do", "do2"]],
    fix: { summary: "Relax the cap to \u201Cusually three sentences, up to five when a post needs its setup.\u201D", section: "do", id: "do3", field: "text", value: "Keep posts to one idea — usually three sentences, up to five when a post needs its setup." },
  },
  {
    id: "c2", severity: "conflict",
    title: "\u201CNo emoji\u201D contradicts one of your examples",
    parts: [
      { label: "Don't · format", text: "No hashtags, no emoji, no \u201Cthread \uD83E\uDDF5\u201D theatrics." },
      { label: "Example · post", text: "\u2026a hundred people who'd be genuinely bummed if you stopped. \uD83D\uDE42" },
    ],
    why: "Pennedly learned \u201Cno emoji\u201D as a hard rule, but a saved example ends with one. It will second-guess which signal to trust on every draft.",
    flags: [["dont", "dn2"], ["examples", "ex2"]],
    fix: { summary: "Drop the \uD83D\uDE42 from the example so it matches the rule.", section: "examples", id: "ex2", field: "text", value: "You don't need a bigger audience. You need a hundred people who'd be genuinely bummed if you stopped." },
  },
];

// Re-extraction progress steps (the in-progress state).
const REEXTRACT_STEPS = [
  "Reading your 312 recent posts",
  "Clustering the themes you return to",
  "Distilling the traits that stay constant",
  "Choosing examples that show the voice",
];

// ---- "What the AI actually sees": prompt scaffolding + its UI-string i18n ----
const PROMPT_LABELS = {
  heading: "VOICE PROFILE",
  intro: "Voice summary",
  themesInclude: "Write about",
  themesExclude: "Never write about",
  characteristics: "Voice characteristics",
  do: "Always",
  dont: "Never",
  examples: "Reference posts — match their rhythm and length",
  i18n: {
    es: { heading: "PERFIL DE VOZ", intro: "Resumen de voz", themesInclude: "Escribir sobre", themesExclude: "Nunca escribir sobre", characteristics: "Características de la voz", do: "Siempre", dont: "Nunca", examples: "Publicaciones de referencia — imita su ritmo y longitud" },
    de: { heading: "STIMMPROFIL", intro: "Stimm-Zusammenfassung", themesInclude: "Schreibe über", themesExclude: "Niemals schreiben über", characteristics: "Stimm-Merkmale", do: "Immer", dont: "Niemals", examples: "Referenzbeiträge — übernimm Rhythmus und Länge" },
  },
};
function promptLabel(key, lang) {
  if (lang && lang !== "en" && PROMPT_LABELS.i18n[lang]) return PROMPT_LABELS.i18n[lang][key] || PROMPT_LABELS[key];
  return PROMPT_LABELS[key];
}

// Assemble the literal system-prompt text the model receives, in `lang`.
function assemblePrompt(sections, lang) {
  const L = (k) => promptLabel(k, lang);
  const introTr = (lang && lang !== "en" && window.INTRO_I18N && window.INTRO_I18N[lang]) || sections.intro;
  const lines = [];
  lines.push(L("heading"));
  lines.push("");
  lines.push("# " + L("intro"));
  lines.push(introTr);
  lines.push("");
  lines.push("# " + L("themesInclude"));
  sections.themesInclude.forEach((x) => lines.push("- " + vLoc(x, lang, "label") + ": " + vLoc(x, lang, "note")));
  lines.push("");
  lines.push("# " + L("themesExclude"));
  sections.themesExclude.forEach((x) => lines.push("- " + vLoc(x, lang, "label")));
  lines.push("");
  lines.push("# " + L("characteristics"));
  sections.characteristics.forEach((x) => lines.push("- " + vLoc(x, lang, "label") + ": " + vLoc(x, lang, "text")));
  lines.push("");
  lines.push("# " + L("do"));
  sections.do.forEach((x) => lines.push("- " + vLoc(x, lang, "text")));
  lines.push("");
  lines.push("# " + L("dont"));
  sections.dont.forEach((x) => lines.push("- " + vLoc(x, lang, "text")));
  lines.push("");
  lines.push("# " + L("examples"));
  sections.examples.forEach((x, i) => lines.push((i + 1) + ". " + vLoc(x, lang, "text")));
  return lines.join("\n");
}

const INTRO_I18N = {
  es: "Mara escribe como si dejara una nota de voz a un amigo que también hace cosas en internet: cálida, pero nunca empalagosa. Justifica cada afirmación con un momento pequeño y concreto de su semana, y luego se aparta. Palabras llanas antes que ingeniosas. Párrafos cortos. Algún chiste seco, normalmente a su propia costa.",
  de: "Mara schreibt, als hinterließe sie einer Freundin, die auch Dinge im Internet macht, eine Sprachnachricht — warm, aber nie überschwänglich. Sie untermauert jede Aussage mit einem kleinen, konkreten Moment ihrer Woche und tritt dann zurück. Einfache Worte statt cleverer. Kurze Absätze. Hin und wieder ein trockener Witz, meist auf eigene Kosten.",
};

Object.assign(window, {
  VOICE_META, VOICE_LANGS, vLoc, VOICE_SECTIONS, VOICE_CONFLICTS, REEXTRACT_STEPS,
  PROMPT_LABELS, promptLabel, assemblePrompt, INTRO_I18N,
});
