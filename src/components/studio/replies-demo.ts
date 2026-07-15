// Replies demo data — drives the `?demo=1` Tweaks review (tester-only) so every
// master-detail / card state can be exercised on mock content without the API.
// The live screen maps its CommentSummary list into the same ReplyComment shape.

export type ReplyStatus = "new" | "draft" | "approved" | "replied" | "skipped";

export type ReplyComment = {
  id: number;
  postId: string;
  status: ReplyStatus;
  author: { name: string; handle: string; initials: string };
  text: string;
  // Translate-row appears only when `lang` is set (design seeds es/de). Real
  // comments have no lang, so the row is demo-only.
  lang?: string | null;
  translated?: string | null;
  // The drafted / published reply (draft / approved / replied statuses).
  reply?: string | null;
  replyLang?: string | null;
  replyTranslated?: string | null;
  time: string;
  repliedTime?: string | null;
  // Public Threads permalink of the comment itself, for «Open in Threads» on a
  // replied comment. Null when Meta didn't return one → the CTA renders disabled.
  url?: string | null;
  // Media attached to the incoming Threads comment.
  commentMedia?: { url: string; alt?: string | null; type?: string | null; poster?: string | null }[];
  // One image attached to the reply draft (relative /media/... URL).
  media?: { url: string; alt?: string | null }[];
};

export type ReplyPost = {
  id: string;
  text: string;
  time: string;
  // Public Threads permalink of the parent post. Null when we don't have one
  // (Meta omitted it and it hasn't re-synced) → PostContext renders the link disabled.
  threadsUrl: string | null;
};

// Only two tweaks in Replies (no account / density / tab — see spec §6).
export const REPLY_TWEAK_DEFAULTS = {
  dark: false,
  state: "Live", // Live | Loading | Empty | Error
};

export const DEMO_POSTS: ReplyPost[] = [
  {
    id: "pA",
    text: "Consistency beats talent. Show up every day, keep the bar low enough to clear when you're tired, and let compounding do the rest.",
    time: "2h",
    threadsUrl: "https://www.threads.net/@mara.lin/post/demoA",
  },
  {
    id: "pB",
    text: "The fastest way to find your voice online: write the way you text your smartest friend.",
    time: "1d",
    threadsUrl: "https://www.threads.net/@mara.lin/post/demoB",
  },
  {
    id: "pC",
    text: "You don't need a niche. You need a point of view you'll still hold in a year.",
    time: "3d",
    threadsUrl: "https://www.threads.net/@mara.lin/post/demoC",
  },
];

const A = (name: string, handle: string, initials: string) => ({ name, handle, initials });

export const DEMO_COMMENTS: ReplyComment[] = [
  // ── pA ──
  {
    id: 1,
    postId: "pA",
    status: "new",
    author: A("Jonas Reed", "jonasreed", "JR"),
    text: "Needed this today. How do you keep going when the numbers are flat for weeks?",
    time: "1h",
  },
  {
    id: 2,
    postId: "pA",
    status: "new",
    author: A("Lucía Marín", "lucia.escribe", "LM"),
    text: "Esto es justo lo que necesitaba leer hoy. ¿Cómo mantienes el ritmo cuando nadie responde?",
    lang: "Spanish",
    translated: "This is exactly what I needed to read today. How do you keep the rhythm when nobody replies?",
    time: "2h",
  },
  {
    id: 3,
    postId: "pA",
    status: "draft",
    author: A("Priya Nair", "priyawrites", "PN"),
    text: "Do you ever take days off, or is it really every single day?",
    reply: "Days off are fine. The trick is making the default low enough that a tired you can still clear it. Miss a day, not a week.",
    time: "3h",
  },
  {
    id: 4,
    postId: "pA",
    status: "approved",
    author: A("Mark Devlin", "markd", "MD"),
    text: "Compounding is so underrated. People want the viral month, not the boring year.",
    reply: "The boring year is what makes the viral month possible. Nobody sees the reps, everybody sees the highlight.",
    time: "4h",
  },
  {
    id: 5,
    postId: "pA",
    status: "replied",
    author: A("Sara Kim", "sarakim", "SK"),
    text: "Saving this. Simple but true.",
    reply: "Thanks Sara. Simple and repeatable beats clever and rare, every time.",
    time: "5h",
    repliedTime: "4h",
    url: "https://www.threads.net/@mara.lin/post/demoA",
  },
  // ── pB ──
  {
    id: 6,
    postId: "pB",
    status: "skipped",
    author: A("crypto_gainz", "crypto_gainz", "CG"),
    text: "Check my profile for 10x signals 🚀🚀",
    time: "1d",
  },
  {
    id: 7,
    postId: "pB",
    status: "new",
    author: A("Tom Alvarez", "tom.writes", "TA"),
    text: "What if texting my smartest friend is also overthought and full of edits?",
    time: "1d",
  },
  {
    id: 8,
    postId: "pB",
    status: "new",
    author: A("Felix Brandt", "felixbrandt", "FB"),
    text: "Endlich mal ein ehrlicher Tipp. Wie findet man die eigene Stimme, ohne sich zu verstellen?",
    lang: "German",
    translated: "Finally an honest tip. How do you find your own voice without putting on an act?",
    time: "1d",
  },
  {
    id: 9,
    postId: "pB",
    status: "draft",
    author: A("Dana Cole", "danacole", "DC"),
    text: "This reframed how I think about my drafts. Thank you.",
    reply: "Glad it landed. Write it messy, then read it out loud. If it sounds like you talking, ship it.",
    time: "1d",
  },
  // ── pC ──
  {
    id: 10,
    postId: "pC",
    status: "new",
    author: A("Ravi Shah", "ravishah", "RS"),
    text: "But doesn't the algorithm reward niching down hard?",
    time: "2d",
  },
  {
    id: 11,
    postId: "pC",
    status: "new",
    author: A("Ana Flores", "anaflores", "AF"),
    text: "A point of view is so much harder to copy than a niche. Love this.",
    time: "3d",
  },
];
