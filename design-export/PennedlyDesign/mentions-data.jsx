// mentions-data.jsx — posts elsewhere on Threads that @-mention the account.
// Read-only monitoring data. status: new | seen | saved | archived.

const MENTION_USER = { name: "Mara Lin", handle: "@mara.lin", initials: "ML" };

const MENTIONS = [
  {
    id: "m1", status: "new", time: "18m",
    author: { name: "The Writing Room", handle: "@writingroom", initials: "WR", followers: "41.2K" },
    text: "just read @mara.lin's thread on cutting 600 words before breakfast and had to sit down for a minute. the best writing advice is always the most uncomfortable one.",
    likes: 312, replies: 24,
  },
  {
    id: "m2", status: "new", time: "1h",
    author: { name: "Devon Pierce", handle: "@devon_makes", initials: "DP", followers: "8.7K" },
    text: "if you're not following @mara.lin you're missing the most honest writing account on here. start with her \u201Cworst first line on purpose\u201D post and thank me later.",
    likes: 156, replies: 11,
  },
  {
    id: "m3", status: "new", time: "3h",
    author: { name: "Lottie Wren", handle: "@lottie.writes", initials: "LW", followers: "2.1K" },
    text: "@mara.lin how do you stay consistent without burning out? asking for me, specifically, today 😅",
    likes: 42, replies: 6,
  },
  {
    id: "m4", status: "saved", time: "1d",
    author: { name: "The Draft Club", handle: "@the_draft_club", initials: "DC", followers: "23.9K" },
    text: "added @mara.lin to this week's roundup of writers worth reading. her \u201Cship three decent things a week for a year\u201D line lives in my head rent-free.",
    likes: 489, replies: 37,
  },
  {
    id: "m5", status: "seen", time: "1d",
    author: { name: "Kenji Sato", handle: "@kenji.dev", initials: "KS", followers: "5.4K" },
    text: "Der Thread von @mara.lin über das Kürzen von Texten ist absolute Pflichtlektüre für alle, die online schreiben.",
    likes: 73, replies: 4,
  },
  {
    id: "m6", status: "seen", time: "2d",
    author: { name: "Paul Esi", handle: "@paulwrites", initials: "PE", followers: "12.4K" },
    text: "stealing @mara.lin's \u201Cwrite the worst possible first line on purpose\u201D for my workshop tomorrow. credited, obviously. it unlocks every nervous writer in the room.",
    likes: 201, replies: 19,
  },
  {
    id: "m7", status: "saved", time: "3d",
    author: { name: "Ana Brandt", handle: "@ana.writes", initials: "AB", followers: "6.0K" },
    text: "the way @mara.lin talks about consistency over intensity quietly reframed my whole year. thank you for writing in public where the rest of us can learn from it.",
    likes: 134, replies: 9,
  },
  {
    id: "m8", status: "archived", time: "4d",
    author: { name: "Creator Growth", handle: "@creatorgrowth_io", initials: "CG", followers: "98.1K" },
    text: "🔥 @mara.lin and 50+ top creators are scaling their reach with THIS one tool. tap the link in our bio to 10x your engagement today 🚀",
    likes: 3, replies: 0,
  },
];

Object.assign(window, { MENTION_USER, MENTIONS });
