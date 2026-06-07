// Explore patterns demo dataset — the literal content from Explore-SPEC.html
// (mirrors design-export/PennedlyDesign explore-data.jsx), every em-dash
// stripped. Powers the tester ?demo=1 review so the screen renders every state
// with no auth and no backend round-trip.

import type { PatternStudyResult } from "@/lib/types";

// NOT `as const` — the tweak values must widen to {boolean, string} so the
// panel can set them.
export const EX_TWEAK_DEFAULTS = { dark: false, state: "Input" };

// The three admired posts the demo idle pre-fills (and the "Try a sample set"
// chip drops into the textarea). Blank line between each post.
export const DEMO_SAMPLE = `I deleted 40,000 followers worth of old posts last night. Not because they were bad. Because they weren't me anymore. The account felt lighter by morning.

Most advice is autobiography in disguise. When someone tells you how to succeed, they're really telling you how they survived. Take the data point, leave the certainty.

Here's what nobody tells you about going viral: the post you worked hardest on is never the one that lands. It's the one you almost didn't publish.`;

// A voice-matched result for the demo Results state. Shaped exactly like the
// real PatternStudyResult so the live render path is reused verbatim.
export const DEMO_RESULT: PatternStudyResult = {
  summary: "Three moves worth stealing, and every one of them is about restraint, not volume.",
  samples_analyzed: 3,
  llm_model: "Pennedly Craft 2",
  prompt_tokens: 0,
  completion_tokens: 0,
  latency_ms: 1840,
  patterns: [
    {
      kind: "Hook",
      name: "The concrete number",
      technique:
        "Opens on one exact, slightly surprising figure instead of a vague claim, so the reader has something specific to picture before any point is made.",
      why_it_works:
        "A precise number reads as reported, not performed. It feels true before you've argued anything.",
      spotted: "I deleted 40,000 followers worth of old posts last night.",
      example:
        "I cut 600 words out of this post before you ever saw it. What's left is the only part that was working.",
      suggested_do_rule: "open on a specific number, not a vague claim",
    },
    {
      kind: "Structure",
      name: "The quarter-turn reframe",
      technique:
        "States a belief the reader already holds, then rotates it one notch so the same idea is suddenly seen from a sharper angle, no argument, just a better lens.",
      why_it_works:
        "People rarely share what they agree with. They share what quietly reorganizes something they already knew.",
      spotted: "Most advice is autobiography in disguise.",
      example:
        "You don't find your voice by writing more. You find it by deleting every line that sounds like someone else.",
      suggested_do_rule: "take a familiar idea, turn it one notch",
    },
    {
      kind: "Cadence",
      name: "The withheld turn",
      technique:
        "Sets up an expectation in the opening line, then holds the payoff back until a short final sentence that lands on its own, alone.",
      why_it_works:
        "The gap between setup and payoff is where attention lives. A hard last line gives the reader a place to stop.",
      spotted: "It's the one you almost didn't publish.",
      example:
        "I rewrote this opening nine times. The version you're reading is the one I almost deleted.",
      suggested_do_rule: "end on a short line, let it land alone",
    },
  ],
};

// The rule the demo Results state shows already folded in (its second card
// renders the "Added to your voice" confirmation, to demonstrate both states).
export const DEMO_ADDED_RULE = DEMO_RESULT.patterns[1].suggested_do_rule;
