"use client";

// Mock content for the Agent screen — used by /gallery/advisor (dev-only, no
// auth, no backend) and by the tester `?demo=1` review on the live screen.
//
// The numbers here are the CD эталон's own sample conversation
// (Agent-Redesign-SPEC.html frames), kept verbatim so a screenshot of the
// gallery can be diffed against the spec side by side. They never reach a real
// user: /gallery 404s in production and ?demo=1 is tester-gated.

import { pluralUnit, type MessageKey, type LocaleCode } from "@/lib/i18n";
import type { AdvisorResponse, AppliedChangeEntry } from "@/lib/types";
import type { AgentSignal, AgentSnapshot, AgentTurnData, BriefCard } from "@/components/advisor/agent-data";

type T = (key: MessageKey) => string;

export type AgentDemoState = "empty" | "conversation" | "thinking" | "thin" | "error" | "disconnected";

const reply = (p: Partial<AdvisorResponse>): AdvisorResponse => ({
  reply: "",
  model: "demo",
  grounded_in: [],
  chips: [],
  suggestions: [],
  actions: [],
  prompt_tokens: 0,
  completion_tokens: 0,
  ...p,
});

const at = (minutesAgo: number) => new Date(Date.now() - minutesAgo * 60_000).toISOString();

export type AgentDemo = {
  signals: AgentSignal[];
  brief: BriefCard[];
  receipts: AppliedChangeEntry[];
  /** The account state the action-card diffs read their «Now» side from. */
  snapshot: AgentSnapshot;
  /** The rail's thread list — two, so review mode shows both the current row
   *  and a switchable one (phase 2). */
  conversations: { id: number | null; title: string; stamp: string }[];
  activeConversationId: number | null;
  freshness: string;
  rangeLabel: string;
  turns: (state: AgentDemoState) => AgentTurnData[];
};

export function AGENT_DEMO(t: T, locale: LocaleCode): AgentDemo {
  const signals: AgentSignal[] = [
    { id: "stats", name: t("agent.sig.stats"), volume: `7 ${pluralUnit(locale, "days", 7)}`, thin: false },
    { id: "heatmap", name: t("agent.sig.heatmap"), volume: `168 ${pluralUnit(locale, "posts", 168)}`, thin: false },
    { id: "posts", name: t("agent.sig.posts"), volume: `12 ${pluralUnit(locale, "posts", 12)}`, thin: false },
    { id: "replies", name: t("agent.sig.replies"), volume: "148", thin: false },
    { id: "voice", name: t("agent.sig.voice"), volume: t("agent.no_data"), thin: true },
  ];

  // A real AutopilotConfig shape, so the diffs show a true «Now» side instead of
  // the "couldn't read the setting" fallback.
  const snapshot: AgentSnapshot = {
    autopilot: {
      enabled: true,
      post_enabled: true,
      posts_per_day: 1,
      quiet_start_hour: null,
      quiet_end_hour: null,
      reply_enabled: false,
      reply_mode: "off",
      reply_audience: "questions",
      replies_per_day: 10,
      reply_frequency: "hourly",
      reply_quiet_start_hour: null,
      reply_quiet_end_hour: null,
      reply_skip_low_value: true,
      reply_post_max_age_days: null,
    },
    voiceRules: 14,
    scenarios: 2,
  };

  const brief: BriefCard[] = [
    {
      key: "views",
      tone: "down",
      icon: "down",
      value: "−18%",
      label: t("agent.brief.views_l"),
      question: t("agent.brief.views_q_down"),
      weight: 18,
    },
    {
      key: "posts",
      tone: "down",
      icon: null,
      value: "3",
      label: t("agent.brief.posts_l").replace("{n}", "5"),
      question: t("agent.brief.posts_q_down"),
      weight: 24,
    },
    {
      key: "comments",
      tone: "up",
      icon: "up",
      value: "+6%",
      label: t("agent.brief.replies_l"),
      question: t("agent.brief.replies_q_up"),
      weight: 6,
    },
    {
      key: "window",
      tone: null,
      icon: "clock",
      value: `${t("agent.demo.tue")} · ${t("adv.act.block_evening")}`,
      label: t("agent.brief.window_l"),
      question: t("agent.brief.window_q"),
      weight: 8,
    },
  ];

  const receipts: AppliedChangeEntry[] = [
    {
      id: 2,
      source: "advisor_action",
      kind: "auto_replies",
      summary: t("adv.act.replies_done"),
      payload: {},
      actor: "user",
      rollbackable: true,
      rollback_reason: null,
      rolled_back_at: null,
      created_at: at(60 * 20),
    },
    {
      id: 1,
      source: "advisor_action",
      kind: "voice_rule",
      summary: t("adv.act.voice_done"),
      payload: {},
      actor: "user",
      rollbackable: false,
      rollback_reason: "later",
      rolled_back_at: null,
      created_at: at(60 * 52),
    },
  ];

  const turn1: AgentTurnData = {
    user: t("agent.demo.q1"),
    status: "done",
    createdAt: at(24),
    reply: reply({
      reply: `${t("agent.demo.a1p1")}\n\n${t("agent.demo.a1p2")}`,
      grounded_in: ["Stats · 7 days", "recent posts", "replies"],
      chips: [
        { tone: "down", icon: "down", label: t("agent.demo.chip_views") },
        { tone: "down", icon: null, label: t("agent.demo.chip_posts") },
        { tone: "up", icon: "up", label: t("agent.demo.chip_replies") },
      ],
      suggestions: [
        {
          icon: "nib",
          title: t("agent.demo.sug1_t"),
          why: t("agent.demo.sug1_w"),
          brief: t("agent.demo.sug1_t"),
        },
      ],
    }),
  };

  // Turn 1 carries only the legacy `grounded_in` (the fallback path); turn 2
  // carries the structured `grounded`, including an empty source and the
  // top-posts id the legacy map has no string for. Both render in the gallery.
  const turn2: AgentTurnData = {
    user: t("agent.demo.q2"),
    status: "done",
    createdAt: at(20),
    reply: reply({
      reply: t("agent.demo.a2p1"),
      grounded_in: ["replies", "Voice (role-book)"],
      grounded: [
        { id: "replies", volume: `30 ${pluralUnit(locale, "days", 30)}`, empty: false },
        { id: "voice", volume: `14 ${t("agent.sig.rules_unit")}`, empty: false },
        { id: "top_posts", volume: "", empty: true },
      ],
      chips: [
        { tone: "accent", icon: "reply", label: t("agent.demo.chip_q30") },
        { tone: "down", icon: null, label: t("agent.demo.chip_unanswered") },
        { tone: "neutral", icon: "clock", label: t("agent.demo.chip_median") },
      ],
      actions: [
        {
          type: "auto_replies",
          title: t("agent.demo.act_replies_t"),
          audience: "questions",
          replies_per_day: 10,
          skip_low_value: true,
        },
      ],
    }),
  };

  const thinTurn: AgentTurnData = {
    user: t("agent.demo.q3"),
    status: "done",
    createdAt: at(6),
    reply: reply({ reply: t("agent.demo.a3"), grounded_in: [], chips: [] }),
  };

  return {
    signals,
    brief,
    receipts,
    snapshot,
    conversations: [
      { id: 1, title: t("agent.demo.q1"), stamp: `${t("appliedChanges.today")}, 14:32` },
      { id: 2, title: t("agent.demo.q2"), stamp: t("appliedChanges.yesterday") },
    ],
    activeConversationId: 1,
    freshness: t("agent.demo.fresh"),
    rangeLabel: `${t("agent.brief.window_7d")} · ${t("agent.demo.fresh")}`,
    turns: (state) => {
      switch (state) {
        case "conversation":
          return [turn1, turn2];
        case "thinking":
          return [{ user: t("agent.demo.q4"), reply: null, status: "thinking", createdAt: at(0) }];
        case "thin":
          return [thinTurn];
        case "error":
          return [{ user: t("agent.demo.q4"), reply: null, status: "error", createdAt: at(1), errorDetail: null }];
        case "disconnected":
          return [{ user: t("agent.demo.q4"), reply: null, status: "disconnected", createdAt: at(1) }];
        default:
          return [];
      }
    },
  };
}
