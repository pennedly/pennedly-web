// studio-data.jsx — seed content for the Studio screen.
// Realistic Threads-style drafts in one creator's voice (Mara Lin — writes about
// writing, building in public, and the craft of posting). Char counts are derived
// live from text length against the 500 limit, never stored.

const USER = {
  name: "Mara Lin",
  handle: "@mara.lin",
  initials: "ML",
};

// status: 'draft' | 'ready' | 'published' | 'rejected'
const SEED_DRAFTS = [
  {
    id: "d1",
    kind: "post",
    status: "draft",
    time: "Just now",
    text: "The fastest way to find your voice online: publish the thing you're slightly embarrassed by. The polished version is everyone's. The embarrassing one is yours.",
  },
  {
    id: "d2",
    kind: "reply",
    status: "draft",
    time: "Just now",
    replyTo: { who: "@devon", text: "honestly how do you even start writing when your brain is completely blank" },
    text: "Start before you feel ready. I open a doc and write the worst possible first line on purpose — it kills the pressure to be good, and the real sentence usually shows up by line three.",
  },
  {
    id: "d3",
    kind: "post",
    status: "draft",
    time: "2 min ago",
    text: "Shipping cadence beats shipping speed. I'd rather post three decent things a week for a year than twenty great things in one month and then vanish. Consistency compounds. Bursts don't.",
  },
  {
    id: "d4",
    kind: "reply",
    status: "draft",
    time: "2 min ago",
    replyTo: { who: "@ana.writes", text: "do you outline everything first or just start typing and see what happens?" },
    text: "Outline anything over 200 words, freewrite everything under. The outline is just scaffolding — I tear most of it down once the real shape of the thing shows up.",
  },
  {
    id: "r1",
    kind: "post",
    status: "ready",
    time: "Approved 8 min ago",
    text: "You don't need a bigger audience. You need 100 people who'd be genuinely bummed if you stopped.",
  },
  {
    id: "r2",
    kind: "post",
    status: "ready",
    time: "Approved 20 min ago",
    text: "Three years of writing online taught me one thing worth repeating: nobody is thinking about your last post nearly as much as you are. So post the next one.",
  },
  {
    id: "p1",
    kind: "post",
    status: "published",
    time: "Published 2h ago",
    text: "Wrote 1,000 words this morning before I opened email. Cut 600 of them. The 400 that survived are the only ones that were ever going to matter.",
    stats: { likes: 412, replies: 27, reposts: 19 },
  },
  {
    id: "p2",
    kind: "reply",
    status: "published",
    time: "Published yesterday",
    replyTo: { who: "@samandtea", text: "what's the one habit that actually moved the needle for you?" },
    text: "Hitting publish before I'd decided whether it was good. The deciding never ends. The publishing is the only part that teaches you anything.",
    stats: { likes: 138, replies: 11, reposts: 4 },
  },
];

// canned regeneration outputs for the composer (used by the loading → result flow)
const GENERATED_POOL = [
  "Most 'writer's block' is just trying to write the finished sentence first. Write the ugly one. You can't edit a blank page, but you can always fix an embarrassing draft.",
  "Underrated creative skill: being willing to be a little boring on purpose. Not every post needs a twist. Some just need to be true and land on time.",
  "I stopped asking 'is this good enough to post?' and started asking 'would the version of me from a year ago have wanted to read this?' Much easier yes.",
  "The audience you're writing for doesn't exist yet — they show up after you've written the thing only they would love. You have to post into the quiet first.",
];

// canned "tweak" revisions, keyed loosely by intent
const TWEAK_RESULTS = {
  punchier: "Find your voice faster: publish the post you're a little embarrassed by. The polished one is everyone's. The embarrassing one is yours.",
  shorter: "Publish the thing you're slightly embarrassed by. The polished version is everyone's — the embarrassing one is yours.",
  question: "What's the fastest way to find your voice online? Publish the thing you're slightly embarrassed by. The polished version is everyone's; the embarrassing one is yours. What are you sitting on?",
  warmer: "Here's the kindest writing advice I have: publish the thing you're slightly embarrassed by. The polished version belongs to everyone. The embarrassing one is the only one that's truly yours.",
  default: "The fastest way to find your voice: publish the thing you're slightly embarrassed by. The careful, polished version is everyone's. The slightly-too-honest one is unmistakably yours.",
};

const TWEAK_SUGGESTIONS = ["Make it punchier", "Make it shorter", "End on a question", "Warmer tone"];

Object.assign(window, { USER, SEED_DRAFTS, GENERATED_POOL, TWEAK_RESULTS, TWEAK_SUGGESTIONS });
