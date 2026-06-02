// patterns-data.jsx — findings from a study of Mara Lin's posts.
// Each pattern: a headline finding + evidence (a lead vs baseline comparison)
// + real example posts. strength: strong | emerging.

const PATTERN_USER = { name: "Mara Lin", handle: "@mara.lin", initials: "ML" };

const STUDY_META = { postsAnalyzed: 47, lastRun: "3 days ago" };

const PATTERNS = [
  {
    id: "p1", kind: "Hook", stat: "2.1×", strength: "strong", sample: 18,
    headline: "Posts that open with a question pull more than twice the comments.",
    evidence: {
      lead: { label: "Opens with a question", value: 34, display: "34 avg comments", n: 18 },
      base: { label: "Opens with a statement", value: 16, display: "16 avg comments", n: 29 },
    },
    note: "Across 18 posts that opened on a question — a reliable signal.",
    examples: [
      { text: "what's the worst writing advice you ever actually followed? I'll go first.", metric: "47 comments" },
      { text: "do you outline everything first, or just start typing and pray? asking for science.", metric: "38 comments" },
    ],
  },
  {
    id: "p2", kind: "Length", stat: "1.7×", strength: "strong", sample: 23,
    headline: "Your short posts under 120 characters travel almost twice as far.",
    evidence: {
      lead: { label: "Under 120 characters", value: 24600, display: "24.6K avg views", n: 23 },
      base: { label: "Over 120 characters", value: 14200, display: "14.2K avg views", n: 24 },
    },
    note: "The tighter the line, the further it goes — true across 23 short posts.",
    examples: [
      { text: "you don't need a bigger audience. you need 100 people who'd be genuinely bummed if you stopped.", metric: "31.8K views" },
      { text: "nobody is thinking about your last post as much as you are. post the next one.", metric: "27.4K views" },
    ],
  },
  {
    id: "p3", kind: "Topic", stat: "1.9×", strength: "strong", sample: 14,
    headline: "Posts about revision outperform posts about motivation, nearly 2 to 1.",
    evidence: {
      lead: { label: "Craft & revision", value: 412, display: "412 avg likes", n: 14 },
      base: { label: "Motivation & mindset", value: 218, display: "218 avg likes", n: 19 },
    },
    note: "When you write about the work itself, people lean in.",
    examples: [
      { text: "wrote 1,000 words this morning before email. cut 600. the 400 that survived are the only ones that mattered.", metric: "48.2K views" },
      { text: "the fastest way to find your voice: publish the thing you're slightly embarrassed by.", metric: "29.1K views" },
    ],
  },
  {
    id: "p4", kind: "Timing", stat: "1.6×", strength: "emerging", sample: 9,
    headline: "Tuesday mornings are quietly your strongest reach window.",
    evidence: {
      lead: { label: "Tue 8–10am", value: 28100, display: "28.1K avg views", n: 9 },
      base: { label: "All other slots", value: 17300, display: "17.3K avg views", n: 38 },
    },
    note: "Promising, but only 9 posts so far — worth testing before you commit.",
    examples: [
      { text: "shipping cadence beats shipping speed. three decent things a week for a year beats twenty in a month.", metric: "26.7K views" },
      { text: "consistency compounds. bursts don't. that's the whole strategy.", metric: "22.9K views" },
    ],
  },
];

Object.assign(window, { PATTERN_USER, STUDY_META, PATTERNS });
