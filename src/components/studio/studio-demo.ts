// Studio demo data — drives the `?demo=1` Tweaks review (tester-only) so every
// feed/card state can be exercised on mock content without touching the real
// API. The live Studio maps its DraftSummary list into the same StudioCard
// shape, so the card component renders one model for both real + demo.

export type StudioStatus = "draft" | "ready" | "published" | "rejected";

export type StudioCard = {
  id: number;
  status: StudioStatus;
  kind: "post" | "reply";
  author: { name: string; handle: string | null; initials: string };
  body: string;
  // Pre-formatted relative time. Real mode passes a localized string; demo uses
  // short universal forms so there's no hydration/locale coupling in mock data.
  time: string;
  reply?: { who: string; text: string } | null;
  threadsUrl?: string | null;
  stats?: { likes: number; replies: number; reposts: number } | null;
};

// The 8 UI locales offered by the card ⋯ → Translate submenu (English = the
// untranslated original). Shared by real + demo card menus.
export const UI_LANGS = [
  { code: "en", name: "English", native: "Original" },
  { code: "es", name: "Spanish", native: "Español" },
  { code: "de", name: "German", native: "Deutsch" },
  { code: "fr", name: "French", native: "Français" },
  { code: "it", name: "Italian", native: "Italiano" },
  { code: "pt", name: "Portuguese", native: "Português" },
  { code: "ru", name: "Russian", native: "Русский" },
  { code: "uk", name: "Ukrainian", native: "Українська" },
] as const;

export type UiLang = (typeof UI_LANGS)[number];

// Demo Tweaks defaults (mirror the design's TWEAK_DEFAULTS). No `as const` so the
// values widen to string/boolean — useTweaks needs that to set them (and `dark`
// must infer as boolean for TweakToggle).
export const STUDIO_TWEAK_DEFAULTS = {
  account: "Active", // Active | First-run
  state: "Normal", // Normal | Loading | Empty | Error
  drafts: "3", // 1 | 2 | 3 | 4 (generate count)
  density: "Comfortable", // Comfortable | Compact
  dark: false,
};

const MARA = { name: "Mara Lin", handle: "mara.lin", initials: "ML" };

// A spread of mock cards covering every status + a reply + a long body (for the
// char-meter warn state) + published cards with stats. Tab filtering in demo
// mode runs over these exactly like the real feed runs over real drafts.
export const DEMO_CARDS: StudioCard[] = [
  {
    id: 9001,
    status: "ready",
    kind: "post",
    author: MARA,
    time: "2h",
    body: "Consistency beats talent. Show up every day, keep the bar low enough to clear when you're tired, and let the compounding do the rest. Most people quit one post before it would have worked.",
    stats: null,
  },
  {
    id: 9002,
    status: "ready",
    kind: "reply",
    author: MARA,
    time: "3h",
    reply: {
      who: "devjuno",
      text: "How do you stay consistent when nothing is landing? I post for weeks and get crickets.",
    },
    body: "Crickets are data, not a verdict. Keep one variable steady (your voice), change one thing a week (hook, length, time), and read the few replies you do get like gold. Reach is lumpy; the habit isn't.",
    stats: null,
  },
  {
    id: 9003,
    status: "draft",
    kind: "post",
    author: MARA,
    time: "5h",
    body: "Unpopular opinion: most \"growth hacks\" are just consistency with a costume on. There's no trick under the trick. Pick a lane, post daily, reply like a human. That's the whole playbook.",
    stats: null,
  },
  {
    id: 9004,
    status: "draft",
    kind: "post",
    author: MARA,
    time: "6h",
    body: "I used to think a big account needed a big idea every day. It doesn't. It needs a small, true observation every day. Big ideas are rare; small true things are everywhere once you start writing them down. The account that wins isn't the smartest in the room, it's the one that kept showing up while everyone else waited to feel ready. Inspiration is a nice-to-have, not a dependency. Build the muscle and the ideas follow.",
    stats: null,
  },
  {
    id: 9005,
    status: "draft",
    kind: "reply",
    author: MARA,
    time: "8h",
    reply: {
      who: "lena.writes",
      text: "Do you outline posts or just write them in one go?",
    },
    body: "One go, then I cut. Outlining a 200-character post is like drawing a map to your own kitchen. Write the messy version fast, delete half, ship the half that's left.",
    stats: null,
  },
  {
    id: 9006,
    status: "published",
    kind: "post",
    author: MARA,
    time: "1d",
    threadsUrl: "https://www.threads.net/@mara.lin/post/demo",
    body: "The fastest way to find your voice online: stop performing the person you think gets followers, and start writing the way you text your smartest friend.",
    stats: { likes: 1240, replies: 86, reposts: 73 },
  },
  {
    id: 9007,
    status: "published",
    kind: "post",
    author: MARA,
    time: "2d",
    threadsUrl: "https://www.threads.net/@mara.lin/post/demo2",
    body: "You don't need a niche. You need a point of view you'll still hold in a year. Niches box you in; a point of view lets you write about anything and still sound like you.",
    stats: { likes: 642, replies: 39, reposts: 21 },
  },
  {
    id: 9008,
    status: "rejected",
    kind: "post",
    author: MARA,
    time: "3d",
    body: "5 productivity hacks that will 10x your output (a thread). Number 3 will shock you.",
    stats: null,
  },
];

export function demoCardsForStatus(status: StudioStatus): StudioCard[] {
  return DEMO_CARDS.filter((c) => c.status === status);
}
