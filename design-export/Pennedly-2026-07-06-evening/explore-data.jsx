// explore-data.jsx — "Explore patterns": the user pastes the TEXT of posts they
// admire, Pennedly extracts the reusable writing move (not the post), and offers
// to fold the good ones into the user's own voice. One creator (Mara Lin, who
// writes about writing & the craft of posting). Real, specific copy — no lorem.

const EXPLORE_USER = { name: "Mara Lin", handle: "@mara.lin", initials: "ML" };

// What the user pasted — three admired posts, blank line between each. Used by the
// "Try a sample set" seed chip to fill the input.
const SAMPLE_POSTS = `I deleted 40,000 followers worth of old posts last night. Not because they were bad. Because they weren't me anymore. The account felt lighter by morning.

Most advice is autobiography in disguise. When someone tells you how to succeed, they're really telling you how they survived. Take the data point, leave the certainty.

Here's what nobody tells you about going viral: the post you worked hardest on is never the one that lands. It's the one you almost didn't publish.`;

// One-line read on the whole set, shown above the cards.
const EXPLORE_SUMMARY = "Three moves worth stealing — and every one of them is about restraint, not volume.";

// The extracted techniques. Each: a named move, what the writer actually does,
// a quiet why-it-works, the exact line it was spotted in, a fresh example
// rewritten in Mara's own voice, and a do-rule she can fold into her role-book.
const EXPLORE_PATTERNS = [
  {
    id: "x1",
    kind: "Hook",
    name: "The concrete number",
    technique: "Opens on one exact, slightly surprising figure instead of a vague claim — so the reader has something specific to picture before any point is made.",
    why: "A precise number reads as reported, not performed. It feels true before you've argued anything.",
    spotted: "I deleted 40,000 followers worth of old posts last night.",
    voiceExample: "I cut 600 words out of this post before you ever saw it. What's left is the only part that was working.",
    doRule: "open on a specific number, not a vague claim",
  },
  {
    id: "x2",
    kind: "Structure",
    name: "The quarter-turn reframe",
    technique: "States a belief the reader already holds, then rotates it one notch so the same idea is suddenly seen from a sharper angle — no argument, just a better lens.",
    why: "People rarely share what they agree with. They share what quietly reorganizes something they already knew.",
    spotted: "Most advice is autobiography in disguise.",
    voiceExample: "You don't find your voice by writing more. You find it by deleting every line that sounds like someone else.",
    doRule: "take a familiar idea, turn it one notch",
  },
  {
    id: "x3",
    kind: "Cadence",
    name: "The withheld turn",
    technique: "Sets up an expectation in the opening line, then holds the payoff back until a short final sentence that lands on its own, alone.",
    why: "The gap between setup and payoff is where attention lives. A hard last line gives the reader a place to stop.",
    spotted: "It's the one you almost didn't publish.",
    voiceExample: "I rewrote this opening nine times. The version you're reading is the one I almost deleted.",
    doRule: "end on a short line, let it land alone",
  },
];

// Footer meta for the results state.
const EXPLORE_META = { samples: 3, latencyMs: 1840, model: "Pennedly Craft 2" };

// Steps for the brief "reading the craft…" analyzing state.
const EXPLORE_STEPS = [
  "Reading the text you pasted",
  "Separating the move from the post",
  "Naming each technique",
  "Rewriting an example in your voice",
];

// quiet starter chips under the input
const EXPLORE_SEEDS = ["A hook that stopped you", "A post you reread", "A line you wish you'd written"];

Object.assign(window, {
  EXPLORE_USER, SAMPLE_POSTS, EXPLORE_SUMMARY, EXPLORE_PATTERNS,
  EXPLORE_META, EXPLORE_STEPS, EXPLORE_SEEDS,
});
