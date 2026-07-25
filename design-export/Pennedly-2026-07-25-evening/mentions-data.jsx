// mentions-data.jsx — posts elsewhere on Threads that @-mention the account.
// Read-only monitoring data, newest first. Three are in other languages (es/de/fr)
// to exercise the translate affordance. Refreshed hourly by the backend.

const MENTION_USER = { name: "Mara Lin", handle: "@mara.lin", initials: "ML", avatar: "assets/avatars/mara.png" };

const MENTIONS = [
  {
    id: "m1", at: "2026-06-01T10:42:00",
    author: { name: "The Writing Room", handle: "@writingroom", initials: "WR" },
    text: "just read @mara.lin's thread on cutting 600 words before breakfast and had to sit down for a minute. the best writing advice is always the most uncomfortable one.",
  },
  {
    id: "m2", at: "2026-06-01T10:00:00",
    author: { name: "Devon Pierce", handle: "@devon_makes", initials: "DP", avatar: "assets/avatars/c-devon.png" },
    text: "if you're not following @mara.lin you're missing the most honest writing account on here. start with her \u201Cworst first line on purpose\u201D post and thank me later.",
  },
  {
    id: "m3", at: "2026-06-01T08:00:00", lang: "Spanish",
    author: { name: "Lottie Wren", handle: "@lottie.writes", initials: "LW" },
    text: "@mara.lin ¿cómo te mantienes constante sin quemarte? lo pregunto por mí, específicamente, hoy 😅",
    translated: "@mara.lin how do you stay consistent without burning out? asking for me, specifically, today 😅",
  },
  {
    id: "m4", at: "2026-05-31T12:00:00",
    author: { name: "The Draft Club", handle: "@the_draft_club", initials: "DC" },
    text: "added @mara.lin to this week's roundup of writers worth reading. her \u201Cship three decent things a week for a year\u201D line lives in my head rent-free.",
  },
  {
    id: "m5", at: "2026-05-31T09:30:00", lang: "German",
    author: { name: "Kenji Sato", handle: "@kenji.dev", initials: "KS", avatar: "assets/avatars/c-kenji.png" },
    text: "Der Thread von @mara.lin über das Kürzen von Texten ist absolute Pflichtlektüre für alle, die online schreiben.",
    translated: "@mara.lin's thread on cutting text down is absolute essential reading for anyone who writes online.",
  },
  {
    id: "m6", at: "2026-05-30T16:00:00",
    author: { name: "Paul Esi", handle: "@paulwrites", initials: "PE" },
    text: "stealing @mara.lin's \u201Cwrite the worst possible first line on purpose\u201D for my workshop tomorrow. credited, obviously. it unlocks every nervous writer in the room.",
  },
  {
    id: "m7", at: "2026-05-29T14:00:00", lang: "French",
    author: { name: "Ana Brandt", handle: "@ana.writes", initials: "AB", avatar: "assets/avatars/c-ana.png" },
    text: "la façon dont @mara.lin parle de la constance plutôt que de l'intensité a discrètement recadré toute mon année. merci d'écrire en public, là où le reste d'entre nous peut apprendre.",
    translated: "the way @mara.lin talks about consistency over intensity quietly reframed my whole year. thank you for writing in public, where the rest of us can learn from it.",
  },
  {
    id: "m8", at: "2026-05-28T11:00:00",
    author: { name: "Creator Growth", handle: "@creatorgrowth_io", initials: "CG" },
    text: "🔥 @mara.lin and 50+ top creators are scaling their reach with THIS one tool. tap the link in our bio to 10x your engagement today 🚀",
  },
];

Object.assign(window, { MENTION_USER, MENTIONS });
