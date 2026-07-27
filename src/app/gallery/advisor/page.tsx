"use client";

// State gallery for the Agent screen (/app/advisor) — the REAL components on
// mock data, no auth and no backend, for verifying every state against the CD
// эталон `Agent-Redesign-SPEC.html`. Lives under /gallery (404 in production).
//
// Covers, in the spec's own order: the two-column layout · the empty-state week
// briefing (with cards and with none) · a full agent turn (prose → metric strip
// → prose → cards → grounding) · the metric strip alone · the grounding row
// (full and thin) · all nine action types · the four action states · the
// suggestion card · thinking · thin data · error · reconnect · the composer ·
// the right rail. Toggle theme and locale from the header to check ru/de length
// and dark/light in one place.

import { useState, type ReactNode } from "react";

import "@/components/advisor/agent.css";

import {
  ActionCard,
  AgentTurn,
  Briefing,
  Composer,
  ErrorBlock,
  GroundingRow,
  JumpToLatest,
  MetricStrip,
  Rail,
  ReconnectBlock,
  SuggestionCard,
  ThinDataBlock,
  ThinkingSteps,
  UserTurn,
  type AgentActionView,
  type StarterChip,
} from "@/components/advisor/AgentParts";
import { buildActionDiff, groundingFor, sessionStamp, type AgentSignal } from "@/components/advisor/agent-data";
import { AGENT_DEMO } from "@/components/advisor/agent-demo";
import { LOCALES, setLocale, useTranslation, type LocaleCode } from "@/lib/i18n";
import type { AdvisorActionData } from "@/lib/types";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-6">
      <h3 className="mb-2 font-mono text-caption uppercase tracking-wide text-text-subtle">{title}</h3>
      <div className="rounded-lg border border-border bg-surface p-4">{children}</div>
    </section>
  );
}

// A stream column at the эталон's reading measure, so spacing matches the spec.
function Col({ children }: { children: ReactNode }) {
  return <div className="ag-col">{children}</div>;
}

// One of each of the nine action types (§5.1) — the closed catalog.
const ACTIONS: AdvisorActionData[] = [
  { type: "routine", title: "Fishing posts", topic: "fishing", times_per_day: 3, hours_preview: [9, 14, 20] },
  { type: "auto_replies", title: "Auto-reply to questions only", audience: "questions", replies_per_day: 10, skip_low_value: true },
  { type: "voice_rule", title: "No emoji in the opening line", rule_text: "No emoji in the first paragraph.", rule_kind: "both" },
  { type: "schedule_post", title: "Tuesday wrap-up", brief: "The week in three lines.", weekday: 2, hour: 18 },
  { type: "reactive", title: "Follow up when a post takes off", reactive_kind: "amplify" },
  { type: "format", title: "A question every day", format_kind: "daily_question", topic: "coffee brewing" },
  { type: "automation", title: "Pause everything until Monday", control_kind: "pause" },
  { type: "best_time_routine", title: "Post at your strongest hours", blocks: ["daytime", "evening"], hours_preview: [14, 20], times_per_day: 2 },
  { type: "topics_list", title: "Add content lanes", topics: ["Morning routines", "Craft notes", "Behind the scenes"] },
];

export default function AgentGallery() {
  const { t, locale } = useTranslation();
  const [dark, setDark] = useState(false);
  function toggleDark() {
    document.documentElement.classList.toggle("dark");
    setDark((d) => !d);
  }

  const demo = AGENT_DEMO(t, locale);
  const [turn1, turn2] = demo.turns("conversation");
  const thinTurn = demo.turns("thin")[0];

  const starters: StarterChip[] = [
    { icon: "nib", label: t("agent.chip.today") },
    { icon: "voice", label: t("agent.chip.voice") },
    { icon: "replies", label: t("agent.chip.replies") },
  ];

  // A never-applied card: apply resolves after a beat so the busy → done
  // transition is reviewable; the receipt is null so the done row shows the
  // deep link rather than a fake undo.
  const view = (a: AdvisorActionData, extra?: Partial<AgentActionView>): AgentActionView => ({
    action: a,
    diff: buildActionDiff(a, demo.snapshot, locale, t),
    warn:
      a.type === "automation"
        ? t("adv.act.ctrl_pause_warn")
        : a.type === "schedule_post"
          ? t("adv.act.sched_quota")
          : null,
    onApply: () => new Promise<void>((r) => setTimeout(r, 700)),
    onOpen: () => {},
    onApplied: async () => null,
    ...extra,
  });

  const signals = demo.signals;
  const groundedFull = groundingFor(["Stats · 7 days", "recent posts", "replies"], signals);
  const groundedThin = groundingFor([], thinSignals(signals, t("agent.no_data")));

  return (
    <div className="min-h-screen bg-bg p-6 text-text">
      <div className="mx-auto max-w-[860px]">
        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-h2 font-semibold">Agent — state gallery</h1>
            <p className="text-caption text-text-subtle">
              dev-only · real components, no backend · compare to Agent-Redesign-SPEC.html
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value as LocaleCode)}
              aria-label="Locale"
              className="rounded-md border border-border bg-surface px-2 py-1.5 text-small"
            >
              {LOCALES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.code}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={toggleDark}
              className="rounded-md border border-border px-3 py-1.5 text-small transition-colors hover:bg-surface-2"
            >
              {dark ? "Light" : "Dark"}
            </button>
          </div>
        </header>

        <h2 className="mb-3 text-h3 font-semibold">Empty — the week briefing</h2>
        <Section title="4 real 7-day metrics, each with the one question it raises (§3)">
          <Col>
            <Briefing cards={demo.brief} rangeLabel={demo.rangeLabel} chips={starters} onAsk={() => {}} />
          </Col>
        </Section>
        <Section title="no metric has enough data yet — one honest line, no placeholder cards">
          <Col>
            <Briefing cards={[]} rangeLabel={demo.rangeLabel} chips={starters} onAsk={() => {}} />
          </Col>
        </Section>

        <h2 className="mb-3 mt-8 text-h3 font-semibold">A full turn</h2>
        <Section title="prose → metric strip → prose → suggestion → grounding row (§4)">
          <Col>
            <UserTurn text={turn1.user} />
            <AgentTurn time="14:32">
              <p>{turn1.reply!.reply.split("\n\n")[0]}</p>
              <MetricStrip metrics={turn1.reply!.chips.map((c) => ({ tone: c.tone, icon: c.icon ?? null, label: c.label }))} />
              <p>{turn1.reply!.reply.split("\n\n")[1]}</p>
              <SuggestionCard
                s={{
                  icon: "nib",
                  title: turn1.reply!.suggestions[0].title,
                  why: turn1.reply!.suggestions[0].why,
                  onOpenStudio: () => {},
                }}
              />
              <GroundingRow items={groundedFull} />
            </AgentTurn>
          </Col>
        </Section>
        <Section title="a turn that ends in an action card (§5) + the jump-to-latest pill (§2)">
          <div className="ag-stream ag-stream--jump" style={{ minHeight: 320 }}>
            <Col>
              <UserTurn text={turn2.user} />
              <AgentTurn time="14:36">
                <p>{turn2.reply!.reply}</p>
                <MetricStrip metrics={turn2.reply!.chips.map((c) => ({ tone: c.tone, icon: c.icon ?? null, label: c.label }))} />
                <ActionCard a={view(turn2.reply!.actions[0])} />
                <GroundingRow items={groundingFor(turn2.reply!.grounded_in, signals)} />
              </AgentTurn>
            </Col>
            <JumpToLatest onClick={() => {}} />
          </div>
        </Section>

        <h2 className="mb-3 mt-8 text-h3 font-semibold">Metric strip · grounding</h2>
        <Section title="2 / 3 / 4 cells, one un-splittable label (text cell)">
          <div className="flex flex-col gap-4">
            <MetricStrip metrics={[{ tone: "down", icon: "down", label: t("agent.demo.chip_views") }, { tone: "up", icon: "up", label: t("agent.demo.chip_replies") }]} />
            <MetricStrip
              metrics={turn1.reply!.chips.map((c) => ({ tone: c.tone, icon: c.icon ?? null, label: c.label }))}
            />
            <MetricStrip
              metrics={[
                { tone: "down", icon: "down", label: t("agent.demo.chip_views") },
                { tone: "down", icon: null, label: t("agent.demo.chip_posts") },
                { tone: "up", icon: "up", label: t("agent.demo.chip_replies") },
                { tone: "accent", icon: "clock", label: `${t("agent.demo.tue")} · ${t("adv.act.block_evening")}` },
              ]}
            />
          </div>
        </Section>
        <Section title="grounding row: named sources (solid, navigable) vs checked-and-empty (dashed) (§4.3)">
          <div className="flex flex-col gap-4">
            <GroundingRow items={groundedFull} />
            <GroundingRow items={groundedThin} />
          </div>
        </Section>

        <h2 className="mb-3 mt-8 text-h3 font-semibold">Action cards — all nine types</h2>
        {ACTIONS.map((a) => (
          <Section key={a.type + a.title} title={`${a.type} · «Now → After» is mandatory (§5)`}>
            <Col>
              <ActionCard a={view(a)} />
            </Col>
          </Section>
        ))}

        <h2 className="mb-3 mt-8 text-h3 font-semibold">Action states</h2>
        <Section title="applying · the diff stays on screen while it writes (§5.2)">
          <Col>
            <ActionCard a={view(ACTIONS[1], { initialState: "applying" })} />
          </Col>
        </Section>
        <Section title="applied · collapsed into the 48px check row + deep link (§5.2)">
          <Col>
            <ActionCard a={view(ACTIONS[1], { initialState: "applied" })} />
          </Col>
        </Section>
        <Section title="failed · the point is that NOTHING changed (§5.2)">
          <Col>
            <ActionCard a={view(ACTIONS[1], { initialState: "error" })} />
          </Col>
        </Section>
        <Section title="condition no longer holds — replayed from an older conversation (§8)">
          <Col>
            <ActionCard a={view(ACTIONS[0], { stale: true })} />
          </Col>
        </Section>
        <Section title="suggestion card — no accent edge, no diff, no mode pill (§6)">
          <Col>
            <SuggestionCard s={{ icon: "nib", title: t("agent.demo.sug1_t"), why: t("agent.demo.sug1_w"), onOpenStudio: () => {} }} />
            <SuggestionCard s={{ icon: "clock", title: t("agent.brief.window_q"), why: t("agent.brief.window_l"), onOpenStudio: () => {} }} />
          </Col>
        </Section>

        <h2 className="mb-3 mt-8 text-h3 font-semibold">Thinking · thin data · errors (§7)</h2>
        <Section title="reading your data — the sources it opens, in order">
          <Col>
            <UserTurn text={t("agent.demo.q4")} />
            <AgentTurn time="14:36">
              <ThinkingSteps step={1} />
            </AgentTurn>
          </Col>
        </Section>
        <Section title="not enough data — a gauge, the reason, and what it CAN answer (§7.2)">
          <Col>
            <UserTurn text={thinTurn.user} />
            <AgentTurn time="14:41">
              <ThinDataBlock
                d={{
                  title: t("agent.thin.title"),
                  body: thinTurn.reply!.reply,
                  have: 2,
                  need: 5,
                  scopeLabel: t("agent.brief.window_7d"),
                }}
              />
              <GroundingRow items={groundedThin} />
            </AgentTurn>
          </Col>
        </Section>
        <Section title="error — only the last turn fails, never a whole-screen banner (§7.3)">
          <Col>
            <UserTurn text={t("agent.demo.q4")} />
            <AgentTurn time="14:44">
              <ErrorBlock onRetry={() => {}} onCopy={() => {}} />
            </AgentTurn>
          </Col>
        </Section>
        <Section title="503 busy — the server's own Retry-After, surfaced">
          <Col>
            <AgentTurn time="14:45">
              <ErrorBlock onRetry={() => {}} detail={t("agent.err.busy").replace("{s}", "20")} />
            </AgentTurn>
          </Col>
        </Section>
        <Section title="409 — the profile lost its Threads connection: one fix, not a retry">
          <Col>
            <AgentTurn time="14:46">
              <ReconnectBlock onReconnect={() => {}} />
            </AgentTurn>
          </Col>
        </Section>

        <h2 className="mb-3 mt-8 text-h3 font-semibold">Composer (§3.1)</h2>
        <Section title="empty · Send disabled, footer states what is read and when it refreshed">
          <div className="ag-dock-inner">
            <Composer value="" onChange={() => {}} onSend={() => {}} freshness={demo.freshness} onRefresh={() => {}} />
          </div>
        </Section>
        <Section title="busy · a reply is generating">
          <div className="ag-dock-inner">
            <Composer value={t("agent.demo.q4")} onChange={() => {}} onSend={() => {}} busy freshness={demo.freshness} />
          </div>
        </Section>

        <h2 className="mb-3 mt-8 text-h3 font-semibold">Right rail (§8)</h2>
        <Section title="signals · conversations · applied — 320px">
          <div className="max-w-[320px]">
            <div style={{ display: "contents" }}>
              <Rail
                signals={signals}
                sessions={demo.sessions.map((s, i) => ({
                  key: String(i),
                  title: s.title,
                  stamp: s.stamp,
                  current: i === 0,
                  onOpen: () => {},
                }))}
                receipts={demo.receipts.map((r) => ({
                  id: r.id,
                  title: r.summary,
                  meta: sessionStamp(r.created_at, locale, t),
                }))}
                onRefreshSignals={() => {}}
                onNewConversation={() => {}}
              />
            </div>
          </div>
        </Section>
        <Section title="empty rail — no conversations, nothing applied">
          <div className="max-w-[320px]">
            <Rail signals={signals} sessions={[]} receipts={[]} onNewConversation={() => {}} />
          </div>
        </Section>
      </div>
    </div>
  );
}

/** The thin variant of the signal list — everything empty but stats, so the
 *  grounding row can show the dashed "checked, nothing there" chips. An empty
 *  signal reports the no-data copy, never a leftover volume. */
function thinSignals(signals: AgentSignal[], noData: string): AgentSignal[] {
  return signals.map((s) => (s.id === "stats" ? s : { ...s, thin: true, volume: noData }));
}
