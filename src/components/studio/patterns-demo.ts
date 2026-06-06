// Pattern study demo data — drives the `?demo=1` Tweaks review (tester-only) so
// every phase + the pattern cards can be exercised without the API. Rich literal
// content (the design's seeds); the live screen derives a thinner card model
// from the backend SelfStudyPattern.

export type PatternEvidence = { label: string; display: string; value: number; n: number };
export type PatternCardModel = {
  kind: string; // Hook / Length / Topic / Timing
  strength: "strong" | "emerging";
  sample: number;
  stat: string; // "2.1×"
  headline: string;
  lead: PatternEvidence;
  base: PatternEvidence;
  note?: string;
  examples: { text: string; metric: string }[];
};

export const PT_TWEAK_DEFAULTS = {
  dark: false,
  state: "Results", // Idle | Running | Results | Empty
};

export const STUDY_META = { postsAnalyzed: 47, lastRun: "3 days ago", emptyHave: 6, emptyNeed: 15 };

export const DEMO_PATTERNS: PatternCardModel[] = [
  {
    kind: "Hook",
    strength: "strong",
    sample: 18,
    stat: "2.1×",
    headline: "Posts that open with a question get 2.1× more comments",
    lead: { label: "Opens with a question", display: "34 avg comments", value: 34, n: 18 },
    base: { label: "Opens with a statement", display: "16 avg comments", value: 16, n: 29 },
    note: "Questions invite a reply, and replies are the strongest signal you can send the algorithm.",
    examples: [
      { text: "What's the one writing habit you'd never give up?", metric: "47 comments" },
      { text: "Why do we treat consistency like it's optional?", metric: "39 comments" },
    ],
  },
  {
    kind: "Length",
    strength: "strong",
    sample: 23,
    stat: "1.7×",
    headline: "Your short posts pull 1.7× the views of long ones",
    lead: { label: "Under 120 characters", display: "24.6K avg views", value: 24600, n: 23 },
    base: { label: "Over 120 characters", display: "14.2K avg views", value: 14200, n: 24 },
    note: "Tight posts are easier to finish and re-share. Long ones lose people mid-scroll.",
    examples: [
      { text: "Consistency beats talent. Every single time.", metric: "31.8K views" },
      { text: "Write the embarrassing version. Ship it anyway.", metric: "26.4K views" },
    ],
  },
  {
    kind: "Topic",
    strength: "strong",
    sample: 14,
    stat: "1.9×",
    headline: "Craft posts earn 1.9× the likes of motivation posts",
    lead: { label: "Craft & process", display: "412 avg likes", value: 412, n: 14 },
    base: { label: "Motivation", display: "218 avg likes", value: 218, n: 19 },
    note: "Specific, useful craft notes save better than general encouragement.",
    examples: [
      { text: "I cut every adverb from a draft. Here's what it did to the rhythm.", metric: "540 likes" },
      { text: "The first line is 80% of the work. Here's how I write it last.", metric: "486 likes" },
    ],
  },
  {
    kind: "Timing",
    strength: "emerging",
    sample: 9,
    stat: "1.6×",
    headline: "Tuesday mornings land 1.6× your usual views",
    lead: { label: "Tue 8–10am", display: "28.1K avg views", value: 28100, n: 9 },
    base: { label: "Other times", display: "17.3K avg views", value: 17300, n: 38 },
    note: "A small sample so far. Worth testing a few more Tuesdays before leaning in.",
    examples: [
      { text: "The version of you that waits never ships.", metric: "33.2K views" },
      { text: "Start before you feel ready. Ready is a myth.", metric: "29.7K views" },
    ],
  },
];
