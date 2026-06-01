// onboarding-data.jsx — copy + seed content for first-run onboarding
// (/app/onboarding). Realistic copy — no lorem.

// the account the user connects in step 1 (simulated)
const OB_ACCOUNT = { name: "Mara Lin", handle: "@mara.lin", initials: "ML", followers: "18.2k" };

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
  OB_ACCOUNT, OB_TRUST, OB_VOICE_MODES, OB_ANALYZE_STEPS,
  OB_VOICE_STARTERS, OB_TOPICS_WRITE, OB_TOPICS_AVOID,
});
