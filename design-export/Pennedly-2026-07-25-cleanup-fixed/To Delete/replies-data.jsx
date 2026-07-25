// replies-data.jsx — seed content for the Reply queue (master-detail).
// Comments under Mara Lin's posts, in varied states, with realistic text.
// Two comments are in other languages (es/de) and their drafted replies are too,
// so the translate affordance can be shown on BOTH the comment and the reply.
// `candidates` are the in-voice replies Pennedly drafts (regenerate cycles them);
// `candTr` are English translations of those candidates (when the reply isn't EN).
// Per Threads' API, replies don't return like counts — so NO likes are shown.

const REPLY_USER = { name: "Mara Lin", handle: "@mara.lin", initials: "ML", avatar: "assets/avatars/mara.png" };

// the user's own posts that have comments (newest first via `at`)
const POSTS = {
  pA: { id: "pA", at: "2026-05-30T09:00:00", text: "Wrote 1,000 words this morning before I opened email. Cut 600 of them. The 400 that survived are the only ones that were ever going to matter." },
  pB: { id: "pB", at: "2026-05-28T18:30:00", text: "Start before you feel ready. I open a doc and write the worst possible first line on purpose — the real sentence usually shows up by line three." },
  pC: { id: "pC", at: "2026-05-26T08:15:00", text: "Stop optimizing your first sentence. Optimize the reason someone should still care by the third. Hooks fade; substance compounds." },
};

// status: new | draft | approved | replied | skipped
const COMMENTS = [
  {
    id: "c1", postId: "pA", at: "2026-06-01T09:40:00", status: "new",
    author: { name: "Devon Pierce", handle: "@devon_makes", initials: "DP", avatar: "assets/avatars/c-devon.png" },
    text: "this hit me at exactly the right time. how do you actually decide what to cut?",
    candidates: [
      "honestly? if a line is only there to sound smart, it goes. I keep the ones that would still be true even if no one read them.",
      "I read the whole thing out loud — anything I stumble over or wouldn't actually say gets cut. the draft kind of tells you.",
    ],
  },
  {
    id: "c2", postId: "pA", at: "2026-06-01T08:30:00", status: "new", lang: "Spanish",
    author: { name: "Lucía Romero", handle: "@lucia.r", initials: "LR", avatar: "assets/avatars/c-lucia.png" },
    text: "Esto es justo lo que necesitaba leer hoy. ¡Mil gracias por compartirlo! 🙏",
    translated: "This is exactly what I needed to read today. A thousand thanks for sharing it! 🙏",
    replyLang: "Spanish",
    candidates: [
      "me alegra muchísimo que te llegara justo hoy — gracias a ti por leerlo. 🙏",
      "gracias por estar aquí, Lucía. nos leemos pronto.",
    ],
    candTr: [
      "so glad it reached you right on time — thank you for reading it. 🙏",
      "thanks for being here, Lucía. talk soon.",
    ],
  },
  {
    id: "c3", postId: "pA", at: "2026-06-01T07:10:00", status: "draft",
    author: { name: "Theo Vance", handle: "@theo_writes", initials: "TV", avatar: "assets/avatars/c-theo.png" },
    text: "\u201Cthe 400 that survived\u201D 😭 ok this is calling me OUT",
    candidates: [
      "ha — the survivors are always the ones that scared me a little. those are usually the keepers.",
      "the other 600 had it coming 😅",
    ],
  },
  {
    id: "c4", postId: "pA", at: "2026-06-01T06:20:00", status: "approved",
    author: { name: "Marina Koll", handle: "@marina.k", initials: "MK", avatar: "assets/avatars/c-marina.png" },
    text: "do you write longhand first or go straight to a doc?",
    candidates: [
      "straight to a doc, always — I type faster than I can second-guess. longhand is only for when I'm truly stuck.",
      "doc for drafting; paper only when I need to think slower on purpose.",
    ],
  },
  {
    id: "c5", postId: "pA", at: "2026-05-31T15:00:00", status: "replied", repliedTime: "1h ago",
    author: { name: "Paul Esi", handle: "@paulwrites", initials: "PE" },
    text: "saving this. genuinely needed the permission to cut today.",
    candidates: [
      "cut freely — you can always paste it back later, but you almost never want to.",
      "permission granted. delete with confidence.",
    ],
  },
  {
    id: "c6", postId: "pA", at: "2026-05-31T12:00:00", status: "skipped",
    author: { name: "Growth Tips Daily", handle: "@growthhacks_io", initials: "GT" },
    text: "🚀 amazing post!! check out my page for DAILY writing hacks and follow back 🔥🔥 link in bio",
    candidates: [],
  },
  {
    id: "c7", postId: "pB", at: "2026-06-01T05:30:00", status: "new",
    author: { name: "Ana Brandt", handle: "@ana.writes", initials: "AB", avatar: "assets/avatars/c-ana.png" },
    text: "this is genuinely the only writing advice that has ever worked for me.",
    candidates: [
      "that means a lot — the \u201Cworst first line\u201D trick is the one I'd keep if I could only keep one.",
      "then it's doing its job. go write the bad line today.",
    ],
  },
  {
    id: "c8", postId: "pB", at: "2026-06-01T03:10:00", status: "new", lang: "German",
    author: { name: "Kenji Sato", handle: "@kenji.dev", initials: "KS", avatar: "assets/avatars/c-kenji.png" },
    text: "Genau so mache ich das auch. Der erste Satz ist immer der schlechteste — und das ist völlig okay.",
    translated: "That's exactly how I do it too. The first sentence is always the worst — and that's totally fine.",
    replyLang: "German",
    candidates: [
      "genau — der erste Satz muss nur existieren, nicht gut sein. 🙂",
      "vollkommen — schreib den schlechten Satz zuerst, der gute kommt von allein.",
    ],
    candTr: [
      "exactly — the first sentence just has to exist, not be good. 🙂",
      "totally — write the bad sentence first, the good one shows up on its own.",
    ],
  },
  {
    id: "c9", postId: "pB", at: "2026-05-31T20:00:00", status: "draft",
    author: { name: "Sam Ortega", handle: "@sam_writes", initials: "SO" },
    text: "but what if the worst first line is somehow still too precious to delete lol",
    candidates: [
      "then it's not the worst one yet 😄 write three more bad ones — the real throwaway shows up fast.",
      "screenshot it for the memories, then delete it. you'll never miss it.",
    ],
  },
  {
    id: "c10", postId: "pC", at: "2026-06-01T01:30:00", status: "new",
    author: { name: "Rivka Adler", handle: "@rivka.k", initials: "RA" },
    text: "the third sentence is exactly where I always lose people. this completely reframes it for me.",
    candidates: [
      "that's the spot — the first two are a promise, the third has to pay it off. it's where I spend the most time.",
      "right? the hook gets them in; sentence three decides whether they stay.",
    ],
  },
  {
    id: "c11", postId: "pC", at: "2026-05-31T23:00:00", status: "new",
    author: { name: "Dan Bishop", handle: "@dan_b", initials: "DB" },
    text: "hard disagree. hooks matter more than ever in a feed this crowded.",
    candidates: [
      "fair — I'd say a great hook earns the click, but substance is what earns the follow. you need both; I just think we over-index on the hook.",
      "totally hear you on the crowded feed. maybe less either/or: hook to stop the scroll, substance to make it worth stopping.",
    ],
  },
];

Object.assign(window, { REPLY_USER, POSTS, COMMENTS });
