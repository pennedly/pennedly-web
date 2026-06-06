// Audits demo data — drives the `?demo=1` Tweaks review (tester-only) so the
// list + detail + every change state can be exercised without the API. The live
// screens map AuditSummary / AuditDetail into the same shapes.

export type ChangeStatus = "undecided" | "applied" | "rejected";

export type DemoChange = {
  id: string;
  category: string; // editorial label from the coach: Voice / Cadence / Topic / Format / Autopilot
  title: string;
  detail: string;
  status: ChangeStatus;
  diff?: { before: string; after: string } | null;
  hoursUtc?: number[] | null; // autopilot_config proposed posting hours (UTC)
  note?: string | null;
  effectPct?: number | null; // applied only: null = measuring, +/- = measured
};

export type DemoAudit = {
  id: number;
  title: string; // "Week of May 25"
  range: string; // "May 19 – 25"
  summary: string;
  postsAnalyzed: number;
  wowDelta: number | null;
  narrative: string[];
  changes: DemoChange[];
};

export const AUDIT_TWEAK_DEFAULTS = {
  dark: false,
  state: "Live", // Live | Loading | Empty
};

export const DEMO_AUDITS: DemoAudit[] = [
  {
    id: 1,
    title: "Week of May 25",
    range: "May 19 – 25",
    summary: "Your shorter, opinion-led posts pulled ahead this week. The coach suggests leaning into them and tightening your openers.",
    postsAnalyzed: 18,
    wowDelta: 12,
    narrative: [
      "Strong week. Your views are up 12% over last week, and almost all of that came from five short, opinionated posts that opened with a claim instead of a setup.",
      "The posts that underperformed had a common shape: a warm-up sentence before the real point. Cutting that warm-up is the single highest-leverage change I can see in your voice right now.",
      "I'm proposing a few small edits below. Nothing changes until you approve it.",
    ],
    changes: [
      {
        id: "c1",
        category: "Voice",
        title: "Open with the claim, not the warm-up",
        detail: "Your top posts this week led with the point. Let's bias your voice toward dropping the first throat-clearing sentence.",
        status: "undecided",
        diff: {
          before: "Lead the reader in gently. Start with context so they know why this matters before you make your point.",
          after: "Open with the claim. Put your sharpest sentence first; context can come after if it earns its place.",
        },
      },
      {
        id: "c2",
        category: "Format",
        title: "Keep posts under 220 characters when you can",
        detail: "Your short posts averaged 2.4× the views of your long ones this week. Worth defaulting to tight.",
        status: "applied",
        effectPct: 18,
      },
      {
        id: "c3",
        category: "Topic",
        title: "More craft, fewer meta-takes",
        detail: "Posts about the actual writing craft outperformed posts about posting. Shifting the topic mix slightly.",
        status: "applied",
        effectPct: null,
      },
      {
        id: "c4",
        category: "Cadence",
        title: "Skip the Sunday slot",
        detail: "Sunday posts consistently underperformed. The coach suggested dropping that slot.",
        status: "rejected",
        note: "I like posting Sundays even if reach is lower. Keeping it.",
      },
      {
        id: "c5",
        category: "Autopilot",
        title: "Shift posting to your high-engagement hours",
        detail: "Your audience is most active mid-afternoon and evening. Proposed autopilot hours below.",
        status: "undecided",
        hoursUtc: [13, 18, 23],
      },
    ],
  },
  {
    id: 2,
    title: "Week of May 18",
    range: "May 12 – 18",
    summary: "A steady week. One voice tweak applied, one cadence idea passed on.",
    postsAnalyzed: 16,
    wowDelta: 5,
    narrative: [
      "Solid, consistent week. Views up 5%. Nothing dramatic, which is fine — the compounding is working.",
      "I proposed two small changes; you've already decided on both.",
    ],
    changes: [
      { id: "c6", category: "Voice", title: "Trust shorter sentences", detail: "Your punchier lines landed harder. Biasing toward shorter sentences.", status: "applied", effectPct: 9 },
      { id: "c7", category: "Cadence", title: "Add a second daily post", detail: "Proposed doubling output. You passed.", status: "rejected", note: null },
    ],
  },
  {
    id: 3,
    title: "Week of May 11",
    range: "May 5 – 11",
    summary: "A down week (−3%). The coach traced it to a run of link-heavy posts.",
    postsAnalyzed: 14,
    wowDelta: -3,
    narrative: [
      "Quieter week — views dipped 3%. The dip lines up with a run of posts that leaned on external links, which the algorithm tends to suppress.",
      "The fix below is already applied.",
    ],
    changes: [
      { id: "c8", category: "Format", title: "Keep links out of the main post", detail: "Link posts underperformed. Move links to the first reply instead.", status: "applied", effectPct: 14 },
    ],
  },
  {
    id: 4,
    title: "Week of May 4",
    range: "Apr 28 – May 4",
    summary: "Good week (+9%). Topic focus paid off.",
    postsAnalyzed: 17,
    wowDelta: 9,
    narrative: ["Strong week, up 9%. Your tighter topic focus is clearly working — both proposed changes are decided."],
    changes: [
      { id: "c9", category: "Topic", title: "Stay in your lane: writing + consistency", detail: "Your on-topic posts far outperformed. Narrowing the focus.", status: "applied", effectPct: 21 },
      { id: "c10", category: "Voice", title: "End on a question more often", detail: "Question-enders drove more replies.", status: "applied", effectPct: 6 },
    ],
  },
  {
    id: 5,
    title: "Week of Apr 27",
    range: "Apr 21 – 27",
    summary: "Your first audit. A baseline read on your voice.",
    postsAnalyzed: 12,
    wowDelta: null,
    narrative: [
      "Welcome to your first weekly review. I read your last 12 posts to get a baseline on your voice and what's landing.",
      "One small suggestion to start — you can always say no.",
    ],
    changes: [{ id: "c11", category: "Voice", title: "Lean into your dry humor", detail: "Your driest lines got the most saves. Worth doing more of.", status: "applied", effectPct: 11 }],
  },
];
