// Advisor demo/mock data + helpers, shared by the ?demo=1 review on the live
// page and the /gallery/advisor state page. No backend — pure sample content
// that mirrors the design SPEC's two-turn conversation (chips, source lines,
// suggestion cards). Keep copy via i18n so it localizes like the real screen.

import type { MessageKey } from "@/lib/i18n";
import type { AdvisorActionCardData, AdvisorChip, AdvisorReplyContent, AdvisorSuggestion } from "@/components/advisor/AdvisorParts";

type T = (key: MessageKey) => string;

// The backend returns canonical source ids in `grounded_in`; map each to its
// localized label for the "Grounded in: …" line. Unknown ids pass through as-is
// (forward-compatible if the backend adds a new source).
const SOURCE_KEY: Record<string, MessageKey> = {
  "Stats · 7 days": "advisor.source.stats",
  "best-time heatmap": "advisor.source.heatmap",
  "recent posts": "advisor.source.posts",
  replies: "advisor.source.replies",
  "Voice (role-book)": "advisor.source.voice",
};

export function advisorSourceLabel(id: string, t: T): string {
  const key = SOURCE_KEY[id];
  return key ? t(key) : id;
}

// A demo turn shape compatible with the page's `Turn` (status always "done").
export type DemoTurn = { user: string; reply: AdvisorReplyContent; status: "done" };

// The SPEC's two-turn sample conversation. `onOpenStudio(brief)` wires the
// suggestion-card handoff (the page passes its Studio router).
export function ADVISOR_DEMO_TURNS(t: T, onOpenStudio: (brief: string) => void): DemoTurn[] {
  const draftSuggestion: AdvisorSuggestion = {
    icon: "nib",
    title: "Get back to a 5-post week",
    why: "Two short posts in your “admit-the-mistake” voice tend to over-perform. Want a draft to start?",
    brief: "Two short posts in my 'admit-the-mistake' voice to get back to a 5-post week.",
    onOpenStudio: () =>
      onOpenStudio("Two short posts in my 'admit-the-mistake' voice to get back to a 5-post week."),
  };
  const scheduleSuggestion: AdvisorSuggestion = {
    icon: "clock",
    title: "Schedule your next post for Tue 6 PM",
    why: "Your strongest window, and it’s open. I can open a draft set to that time.",
    brief: "A post scheduled for Tuesday 6 PM — my strongest window.",
    onOpenStudio: () => onOpenStudio("A post scheduled for Tuesday 6 PM — my strongest window."),
  };

  // A one-click action card (the "apply-in-one-click" layer). Demo handlers: the
  // apply resolves after a beat so the applied/done state is reviewable; open is a
  // no-op in the gallery.
  const routineAction: AdvisorActionCardData = {
    type: "routine",
    title: "Fishing posts",
    topic: "fishing",
    timesPerDay: 3,
    hoursPreview: [9, 14, 20],
    onApply: () => new Promise<void>((r) => setTimeout(r, 600)),
    onOpenScenarios: () => {},
  };

  const turn1Chips: AdvisorChip[] = [
    { tone: "down", icon: "eye", label: "7-day views −18%" },
    { tone: "down", label: "Posts 5 → 3" },
    { tone: "up", icon: "reply", label: "Reply rate +6%" },
  ];
  const turn2Chips: AdvisorChip[] = [
    { tone: "accent", icon: "clock", label: "Best · Tue 6 PM" },
    { tone: "up", label: "Sat 6 PM · 1.6× avg" },
    { tone: "down", label: "Mornings · 0.7× avg" },
  ];

  return [
    {
      user: "Why did engagement drop this week?",
      status: "done",
      reply: {
        paragraphs: [
          "Your views are down, but it’s narrower than it looks — the dip is concentrated in two quiet days, not a broad decline.",
          "You published 3 times vs 5 the week before, and both low days had no post at all. Your replies actually pulled more engagement per post — so this reads like a volume dip, not a quality one.",
        ],
        chips: turn1Chips,
        sources: [t("advisor.source.stats"), t("advisor.source.posts"), t("advisor.source.replies")],
        suggestions: [draftSuggestion],
      },
    },
    {
      user: "Best time to post this week?",
      status: "done",
      reply: {
        paragraphs: [
          "Your audience clusters in two evening windows. Tuesday and Saturday around 6 PM have been your strongest by average views.",
          "Mornings under-deliver for you right now — the 9 AM slot runs about 0.7× your average. I’d hold new posts for the evening windows this week.",
        ],
        chips: turn2Chips,
        sources: [t("advisor.source.heatmap"), t("advisor.source.posts")],
        suggestions: [scheduleSuggestion],
        actions: [routineAction],
      },
    },
  ];
}
