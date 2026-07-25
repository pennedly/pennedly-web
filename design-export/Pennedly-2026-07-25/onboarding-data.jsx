// onboarding-data.jsx — copy + seed content for first-run onboarding
// (/app/onboarding). Realistic copy — no lorem.

// the account the user connects in step 1 (simulated). `avatar` is a real photo;
// `initials` is the monogram fallback (§3.4).
const OB_ACCOUNT = { name: "Mara Lin", handle: "@mara.lin", initials: "ML", avatar: "assets/avatars/mara.png", followers: "18.2k" };

// "Analyze my posts" is only offered when the connected account has enough recent
// posts to learn from. `need` is the floor; counts drive the enough/too-few states.
const OB_POSTS = { need: 15, enough: 214, tooFew: 6 };

// The voice Pennedly WOULD build — shown read-only in tester preview mode
// (?preview=1), which runs the flow for real but saves nothing.
const OB_PREVIEW_VOICE = {
  summary: "Warm but never gushing — like a voice note to one friend who also makes things. Earns every claim with a small, specific moment, then gets out of the way.",
  themes: ["The craft of writing", "Building in public", "Creative courage", "Writing for the right hundred people"],
  traits: ["Plain words over clever ones", "Opens on a concrete moment", "Short paragraphs, one idea each", "Dry humour, usually self-directed"],
};

// trust points shown on the connect step
const OB_TRUST = [
  { ico: "eye",   text: "Read-only — Pennedly studies your posts to learn your voice." },
  { ico: "check", text: "Nothing is ever posted without your approval." },
  { ico: "lock",  text: "Disconnect anytime. Your account stays yours." },
];

// the two ways to build a voice (the "choose" step)
const OB_VOICE_MODES = [
  {
    id: "analyze",
    title: "Analyze my posts",
    recommended: true,
    desc: "Pennedly reads your recent Threads posts and distils your themes, rhythm, and the things you'd never say.",
    meta: "Takes about a minute",
  },
  {
    id: "scratch",
    title: "Build from scratch",
    recommended: false,
    desc: "Describe your voice in your own words and choose what to write about. Best if your account is new or private.",
    meta: "Takes a few minutes",
  },
];

// steps the analyze path animates through
const OB_ANALYZE_STEPS = [
  "Reading your recent posts",
  "Finding the themes you return to",
  "Distilling how you sound",
];

// from-scratch helpers
const OB_VOICE_STARTERS = [
  "Warm but direct. Short sentences, plain words, the occasional dry joke. I write like I'm talking to one smart friend.",
  "Curious and a little contrarian. I ask questions more than I give answers, and I'd rather be honest than polished.",
];
const OB_TOPICS_WRITE = ["Writing craft", "Building in public", "Productivity", "Design", "Books & reading", "Startups", "Creativity"];
const OB_TOPICS_AVOID = ["Politics", "Crypto", "Hustle culture", "Personal drama", "Engagement bait"];

Object.assign(window, {
  OB_ACCOUNT, OB_POSTS, OB_PREVIEW_VOICE, OB_TRUST, OB_VOICE_MODES, OB_ANALYZE_STEPS,
  OB_VOICE_STARTERS, OB_TOPICS_WRITE, OB_TOPICS_AVOID,
});
