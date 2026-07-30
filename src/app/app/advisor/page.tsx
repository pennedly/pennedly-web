"use client";

// Agent (/app/advisor) — the per-profile growth agent, rebuilt to the CD эталон
// `Agent-Redesign-SPEC.html`. A two-column workspace: the conversation on the
// left (its own inner scroller + a docked composer), and on the right the rail
// that says WHAT THE AGENT CAN READ RIGHT NOW, which past conversations exist,
// and what it has already applied to the account.
//
// One rule runs the whole screen (§1): every claim is either a number in the
// metric strip or a NAMED source in the grounding row. A signal that was checked
// and came back empty is shown dashed rather than hidden. Nothing here invents a
// figure — the briefing, the signal volumes and the action cards' «Сейчас» side
// are all read from real endpoints (stats · role-book · autopilot · user-rules ·
// scenarios · applied-changes), and a failed read says "unknown", never a value.
//
// Scroll: this screen scrolls an INNER container, so the app's --hdr-reveal
// docking (driven by window.scrollY) can never fire here — the bar keeps
// hasHero={false} on purpose and its title is always visible.
//
// Backend: POST /accounts/{id}/advisor (prose + chips + grounded_in +
// suggestions + actions), GET .../advisor/history (persisted turns),
// POST .../advisor/apply (one-click actions, closed catalog of 9).

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import "@/components/advisor/agent.css";

import {
  ApiError,
  applyAdvisorAction,
  chatAdvisor,
  clearTokens,
  fetchAdvisorHistory,
  fetchAppliedChanges,
  fetchAutopilot,
  fetchMe,
  fetchRoleBook,
  fetchScenarios,
  fetchStats,
  fetchUserRules,
  getTokens,
  refreshStats,
  rollbackAppliedChange,
} from "@/lib/api";
import { useSelectedAccountId } from "@/lib/account";
import { useTranslation, type MessageKey } from "@/lib/i18n";
import { nextOccurrence } from "@/lib/schedule";
import { AppTopbar } from "@/components/AppTopbar";
import { IcLayers } from "@/components/icons";
import { SkeletonText } from "@/components/ui";
import { TweaksPanel, TweakSection, TweakRadio, TweakToggle, useTweaks } from "@/components/tweaks/TweaksPanel";
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
  RailSheet,
  ReconnectBlock,
  SuggestionCard,
  ThinDataBlock,
  ThinkingSteps,
  UserTurn,
  type AgentActionView,
  type RailReceipt,
  type RailSession,
  type StarterChip,
} from "@/components/advisor/AgentParts";
import {
  buildActionDiff,
  buildBrief,
  buildSignals,
  EMPTY_SNAPSHOT,
  groundingFor,
  groupSessions,
  relFreshness,
  sessionStamp,
  turnTime,
  type AgentSnapshot,
  type AgentTurnData,
} from "@/components/advisor/agent-data";
import { AGENT_DEMO } from "@/components/advisor/agent-demo";
import type { AdvisorActionData, AdvisorHistoryEntry, AdvisorMessage, AdvisorResponse, AppliedChangeEntry } from "@/lib/types";
import { useDemoParam } from "@/lib/query";

const IS_DEV = process.env.NODE_ENV === "development";

// The backend caps the transcript at 40 messages (2 per turn + the new one);
// 18 prior turns → 37, safely under it even after a long history hydration.
const RECENT_TURNS_FOR_CONTEXT = 18;

// How far from the bottom counts as "the user has scrolled away" — the jump
// pill appears and the autoscroll stops (§2, §10.3).
const JUMP_THRESHOLD = 240;

type Turn = AgentTurnData;

export default function AdvisorPage() {
  const router = useRouter();
  const { t, locale } = useTranslation();

  const demoParam = useDemoParam();
  const [isTester, setIsTester] = useState(false);
  const allow = demoParam && (IS_DEV || isTester);

  useEffect(() => {
    if (demoParam) return;
    if (!getTokens()) {
      router.push("/app/login");
      return;
    }
    fetchMe()
      .then((m) => setIsTester(m.is_tester === true))
      .catch(() => {});
  }, [router, demoParam]);

  const accountId = useSelectedAccountId();

  const [turns, setTurns] = useState<Turn[]>([]);
  const [history, setHistory] = useState<AdvisorHistoryEntry[]>([]);
  const [sessionIdx, setSessionIdx] = useState<number | null>(null); // null = newest
  const [input, setInput] = useState("");
  const [thinkStep, setThinkStep] = useState(0);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [showJump, setShowJump] = useState(false);
  const [railOpen, setRailOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // What the agent can read + what the account currently looks like.
  const [stats, setStats] = useState<Awaited<ReturnType<typeof fetchStats>> | null>(null);
  const [roleBook, setRoleBook] = useState<Awaited<ReturnType<typeof fetchRoleBook>> | null>(null);
  const [snapshot, setSnapshot] = useState<AgentSnapshot>(EMPTY_SNAPSHOT);
  const [receipts, setReceipts] = useState<AppliedChangeEntry[]>([]);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  // Whether the user was pinned to the bottom before the last render — the
  // autoscroll only fires then, so reading history is never yanked (§10.3).
  const atBottomRef = useRef(true);

  // ── ?demo=1 Tweaks: drive each state with no backend ──
  const [tw, setTw] = useTweaks<{
    dark: boolean;
    state: "empty" | "conversation" | "thinking" | "thin" | "error" | "disconnected";
  }>({ dark: false, state: "empty" });
  useEffect(() => {
    if (!allow) return;
    document.documentElement.classList.toggle("dark", tw.dark);
    return () => document.documentElement.classList.remove("dark");
  }, [allow, tw.dark]);

  const busy = turns.some((x) => x.status === "thinking");

  // Tester review mode: one mock bundle (signals, briefing, snapshot, turns)
  // that every derived value below reads from instead of the network.
  const demo = useMemo(() => (allow ? AGENT_DEMO(t, locale) : null), [allow, t, locale]);

  // Walk the three "reading your data" steps while a reply generates. Driven by
  // the DEMO state too, so the tester review animates like the real thing.
  const stepping = busy || (demo !== null && tw.state === "thinking");
  useEffect(() => {
    if (!stepping) {
      setThinkStep(0);
      return;
    }
    const id = setInterval(() => setThinkStep((i) => Math.min(i + 1, 2)), 2200);
    return () => clearInterval(id);
  }, [stepping]);

  // ── load everything the screen grounds itself in ──
  const loadSignals = useCallback(
    async (id: number) => {
      const [s, rb, ap, ur, sc, ac] = await Promise.allSettled([
        fetchStats(id, { period: "7d" }),
        fetchRoleBook(id),
        fetchAutopilot(id),
        fetchUserRules(id),
        fetchScenarios(id),
        fetchAppliedChanges(id, { limit: 12 }),
      ]);
      setStats(s.status === "fulfilled" ? s.value : null);
      setRoleBook(rb.status === "fulfilled" ? rb.value : null);
      setSnapshot({
        autopilot: ap.status === "fulfilled" ? ap.value : null,
        voiceRules: ur.status === "fulfilled" ? ur.value.rules.length : null,
        scenarios: sc.status === "fulfilled" ? sc.value.scenarios.filter((x) => x.enabled).length : null,
      });
      setReceipts(
        ac.status === "fulfilled" ? ac.value.entries.filter((e) => e.source === "advisor_action") : [],
      );
    },
    [],
  );

  useEffect(() => {
    if (allow || accountId === null) return;
    void loadSignals(accountId);
  }, [allow, accountId, loadSignals]);

  // Map a live (or persisted) backend reply into the action views the card
  // renders. `accountId` is non-null at every call site.
  const buildActions = useCallback(
    (res: AdvisorResponse, id: number): AgentActionView[] =>
      // Max two per turn (§5) — a third means the agent dumped a menu.
      res.actions.slice(0, 2).map((act) => ({
        action: act,
        diff: buildActionDiff(act, demo?.snapshot ?? snapshot, locale, t),
        warn: warnFor(act, t),
        // Review mode: the card is MOCK, so Apply must resolve without writing.
        // A signed-in tester opening ?demo=1 would otherwise change their real
        // profile by clicking a sample card.
        onApply: async () => {
          if (demo) {
            await new Promise((r) => setTimeout(r, 700));
            return;
          }
          await applyAction(id, act);
        },
        onOpen: () => {
          if (!demo) router.push(openTargetFor(act));
        },
        onApplied: async () => {
          if (demo || accountId === null) return null;
          const before = Date.now() - 5_000;
          const fresh = await fetchAppliedChanges(id, { limit: 12 });
          const mine = fresh.entries.filter((e) => e.source === "advisor_action");
          setReceipts(mine);
          void loadSignals(id);
          const match = mine.find(
            (e) => !e.rolled_back_at && new Date(e.created_at).getTime() >= before,
          );
          return match ?? null;
        },
        onUndo: async (changeId: number) => {
          if (demo) return;
          await rollbackAppliedChange(id, changeId);
          const fresh = await fetchAppliedChanges(id, { limit: 12 });
          setReceipts(fresh.entries.filter((e) => e.source === "advisor_action"));
          void loadSignals(id);
        },
      })),
    [demo, snapshot, locale, t, router, accountId, loadSignals],
  );

  function buildMessages(question: string): AdvisorMessage[] {
    const msgs: AdvisorMessage[] = [];
    for (const turn of turns.slice(-RECENT_TURNS_FOR_CONTEXT)) {
      msgs.push({ role: "user", content: turn.user });
      if (turn.reply) msgs.push({ role: "assistant", content: turn.reply.reply });
    }
    msgs.push({ role: "user", content: question });
    return msgs;
  }

  async function ask(question: string) {
    const q = question.trim();
    // Review mode drives the thread from mock turns; sending would fire a real,
    // billed advisor call against whichever profile the tester has selected.
    if (allow) {
      setInput("");
      return;
    }
    if (!q || accountId === null || busy) return;
    setInput("");
    setThinkStep(0);
    setSessionIdx(null);
    const messages = buildMessages(q);
    atBottomRef.current = true;
    setTurns((prev) => [...prev, { user: q, reply: null, status: "thinking", createdAt: new Date().toISOString() }]);

    try {
      const res = await chatAdvisor(accountId, messages);
      setTurns((prev) => {
        const next = [...prev];
        next[next.length - 1] = { user: q, reply: res, status: "done", createdAt: new Date().toISOString() };
        return next;
      });
      // An answer may have changed nothing, but the freshness stamp and the
      // signal volumes are what the next turn is judged against — keep them live.
      void loadSignals(accountId);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        clearTokens();
        router.push("/app/login");
        return;
      }
      // 409 = the profile lost its Threads connection. One fix, not a retry.
      const disconnected = e instanceof ApiError && e.status === 409;
      const detail =
        e instanceof ApiError && e.status === 503 && e.retryAfter != null
          ? t("agent.err.busy").replace("{s}", String(e.retryAfter))
          : e instanceof ApiError && e.status >= 400 && e.status < 500
            ? e.message
            : null;
      setTurns((prev) => {
        const next = [...prev];
        next[next.length - 1] = {
          ...next[next.length - 1],
          reply: null,
          status: disconnected ? "disconnected" : "error",
          errorDetail: disconnected ? null : detail,
        };
        return next;
      });
    }
  }

  // Hydrate the persisted conversation. Fail-soft: an error starts empty and
  // never blocks the chat. Demo mode never touches the network.
  useEffect(() => {
    if (allow) {
      setHistoryLoaded(true);
      return;
    }
    if (accountId === null) {
      setHistoryLoaded(true);
      return;
    }
    let cancelled = false;
    setHistoryLoaded(false);
    fetchAdvisorHistory(accountId)
      .then((hist) => {
        if (cancelled) return;
        setHistory(hist.entries);
        setTurns(
          hist.entries.map((e) => ({
            user: e.question,
            reply: e.reply,
            status: "done" as const,
            createdAt: e.created_at,
          })),
        );
      })
      .catch(() => {
        /* fail-soft — an empty thread, same as before this feature */
      })
      .finally(() => {
        if (!cancelled) setHistoryLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [accountId, allow]);

  function retryLast() {
    const last = turns[turns.length - 1];
    if (!last || (last.status !== "error" && last.status !== "disconnected")) return;
    setTurns((prev) => prev.slice(0, -1));
    void ask(last.user);
  }

  function openInStudio(brief: string) {
    router.push(`/app?brief=${encodeURIComponent(brief)}`);
  }

  // ── manual data refresh (the composer's footer + the rail header) ──
  async function refreshData() {
    if (accountId === null || refreshing) return;
    setRefreshing(true);
    try {
      await refreshStats(accountId, true).catch(() => {});
      await loadSignals(accountId);
    } finally {
      setRefreshing(false);
    }
  }

  // ── derived view data ──
  const signals = useMemo(
    () => (demo ? demo.signals : buildSignals(stats, roleBook, locale, t)),
    [demo, stats, roleBook, locale, t],
  );
  const brief = useMemo(() => (demo ? demo.brief : buildBrief(stats, locale, t)), [demo, stats, locale, t]);

  const sessions = useMemo(() => groupSessions(history), [history]);
  const shownTurns: Turn[] = demo
    ? demo.turns(tw.state)
    : sessionIdx === null
      ? turns
      : turns.slice(sessions[sessionIdx].start, sessions[sessionIdx].end);

  const isEmpty = shownTurns.length === 0;
  const freshness = demo ? demo.freshness : relFreshness(stats?.refreshed_at ?? null, locale, t);
  const rangeLabel = demo ? demo.rangeLabel : `${t("agent.brief.window_7d")} · ${freshness}`;

  const starters: StarterChip[] = [
    { icon: "nib", label: t("agent.chip.today") },
    { icon: "voice", label: t("agent.chip.voice") },
    { icon: "replies", label: t("agent.chip.replies") },
  ];

  const railSessions: RailSession[] = demo
    ? demo.sessions.map((s, i) => ({ key: String(i), title: s.title, stamp: s.stamp, current: i === 0, onOpen: () => {} }))
    : sessions.map((s, i) => ({
        key: `${s.start}-${s.end}`,
        title: s.title,
        stamp: sessionStamp(s.at, locale, t),
        current: sessionIdx === null ? i === 0 : sessionIdx === i,
        onOpen: () => {
          setSessionIdx(i);
          setRailOpen(false);
          atBottomRef.current = true;
        },
      }));

  const railReceipts: RailReceipt[] = (demo ? demo.receipts : receipts.slice(0, 6)).map((r) => ({
    id: r.id,
    title: r.summary,
    meta: sessionStamp(r.created_at, locale, t),
  }));

  // ── scroll plumbing ──
  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    atBottomRef.current = distance <= JUMP_THRESHOLD;
    setShowJump(distance > JUMP_THRESHOLD);
  };

  const jumpToLatest = (smooth = true) => {
    const el = scrollRef.current;
    if (!el) return;
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth && !reduce ? "smooth" : "auto" });
    atBottomRef.current = true;
    setShowJump(false);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    // The empty state is a briefing that READS top-down — only a conversation
    // gets pinned to its newest turn (and only if the user was already there).
    if (shownTurns.length === 0) {
      el.scrollTop = 0;
      setShowJump(false);
      return;
    }
    if (atBottomRef.current) {
      el.scrollTop = el.scrollHeight;
      setShowJump(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shownTurns.length, historyLoaded]);

  const rail = (
    <Rail
      signals={signals}
      sessions={railSessions}
      receipts={railReceipts}
      onRefreshSignals={demo ? undefined : refreshData}
      refreshing={refreshing}
      onNewConversation={() => {
        // Clears the stream; the server history is untouched (§8).
        setTurns([]);
        setSessionIdx(null);
        setRailOpen(false);
      }}
    />
  );

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-bg text-text">
      <AppTopbar
        maxW="100%"
        title={t("advisor.title")}
        // App-Header-Pill-Budget-SPEC §8 — «Reads your data» is refused, not
        // moved: it is a constant (category C), and the right rail already
        // LISTS the sources the agent read. Demonstrating the claim beats
        // asserting it in a chip. The md: gate that used to hide it goes with
        // it — no screen gates the pill by breakpoint any more (§10).
        actions={
          <button
            type="button"
            onClick={() => setRailOpen(true)}
            aria-label={t("agent.rail.sheet_title")}
            className="grid h-9 w-9 place-items-center rounded-md border border-border bg-surface text-text-muted transition-colors hover:bg-surface-2 hover:text-text max-md:h-10 max-md:w-10 min-[1208px]:hidden"
          >
            <IcLayers size={17} />
          </button>
        }
      />

      <div className="ag-shell min-h-0 flex-1">
        <div className="ag-screen">
          <div className="ag-main">
            <div className={`ag-stream${showJump ? " ag-stream--jump" : ""}`}>
              <div className="ag-scroll" ref={scrollRef} onScroll={onScroll}>
                <div className="ag-col">
                  {!historyLoaded ? (
                    <SkeletonText lines={3} />
                  ) : isEmpty ? (
                    <Briefing
                      cards={brief}
                      rangeLabel={rangeLabel}
                      chips={starters}
                      onAsk={(q) => (allow ? setInput(q) : void ask(q))}
                    />
                  ) : (
                    shownTurns.map((turn, i) => (
                      <TurnBlock
                        key={i}
                        turn={turn}
                        step={thinkStep}
                        signals={signals}
                        buildActions={(res) => (accountId === null ? [] : buildActions(res, accountId))}
                        onOpenStudio={openInStudio}
                        onRetry={retryLast}
                        onReconnect={() => router.push("/app/settings")}
                        locale={locale}
                        t={t}
                      />
                    ))
                  )}
                </div>
              </div>
              {showJump && <JumpToLatest onClick={() => jumpToLatest()} />}
            </div>

            <div className="ag-dock">
              <div className="ag-dock-inner">
                <Composer
                  value={input}
                  onChange={setInput}
                  onSend={() => void ask(input)}
                  disabled={accountId === null && !allow}
                  busy={busy}
                  freshness={freshness}
                  onRefresh={demo ? undefined : refreshData}
                  refreshing={refreshing}
                />
              </div>
            </div>
          </div>

          {rail}
        </div>
      </div>

      <RailSheet open={railOpen} onClose={() => setRailOpen(false)}>
        {rail}
      </RailSheet>

      {allow && (
        <TweaksPanel title="Agent">
          <TweakSection label="Appearance" />
          <TweakToggle label="Dark mode" value={tw.dark} onChange={(v) => setTw("dark", v)} />
          <TweakSection label="State" />
          <TweakRadio
            label="Phase"
            value={tw.state}
            options={["empty", "conversation", "thinking", "thin", "error", "disconnected"]}
            onChange={(v) => setTw("state", v as typeof tw.state)}
          />
        </TweaksPanel>
      )}
    </div>
  );
}

// ── one rendered turn — the score never reorders (§4) ────────────────────────

function TurnBlock({
  turn,
  step,
  signals,
  buildActions,
  onOpenStudio,
  onRetry,
  onReconnect,
  locale,
  t,
}: {
  turn: Turn;
  step: number;
  signals: ReturnType<typeof buildSignals>;
  buildActions: (res: AdvisorResponse) => AgentActionView[];
  onOpenStudio: (brief: string) => void;
  onRetry: () => void;
  onReconnect: () => void;
  locale: string;
  t: (k: MessageKey) => string;
}) {
  const time = turnTime(turn.createdAt, locale);
  const res = turn.reply;

  const paragraphs = res ? res.reply.split(/\n{2,}/).map((s) => s.trim()).filter(Boolean) : [];
  const metrics = res ? res.chips.map((c) => ({ tone: c.tone, icon: c.icon ?? null, label: c.label })) : [];
  const grounding = res ? groundingFor(res.grounded_in, signals) : [];
  // No named source AND no cited number = the agent had nothing to stand on.
  // That is its own turn type, not an error (§7.2).
  const isThin = !!res && res.grounded_in.length === 0 && res.chips.length === 0;
  const withData = signals.filter((s) => !s.thin).length;

  return (
    <>
      <UserTurn text={turn.user} />
      {turn.status === "thinking" && (
        <AgentTurn time={time}>
          <ThinkingSteps step={step} />
        </AgentTurn>
      )}
      {turn.status === "disconnected" && (
        <AgentTurn time={time}>
          <ReconnectBlock onReconnect={onReconnect} />
        </AgentTurn>
      )}
      {turn.status === "error" && (
        <AgentTurn time={time}>
          <ErrorBlock onRetry={onRetry} detail={turn.errorDetail ?? null} />
        </AgentTurn>
      )}
      {turn.status === "done" && res && (
        <AgentTurn time={time}>
          {isThin ? (
            <ThinDataBlock
              d={{
                title: t("agent.thin.title"),
                body: paragraphs[0] ?? t("agent.thin.body"),
                have: withData,
                need: signals.length,
                scopeLabel: t("agent.brief.window_7d"),
              }}
            />
          ) : (
            <>
              {paragraphs[0] ? <p>{paragraphs[0]}</p> : null}
              <MetricStrip metrics={metrics} />
              {paragraphs.slice(1).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </>
          )}
          {res.suggestions.slice(0, 2).map((s, i) => (
            <SuggestionCard
              key={i}
              s={{ icon: s.icon, title: s.title, why: s.why, onOpenStudio: () => onOpenStudio(s.brief) }}
            />
          ))}
          {buildActions(res).map((a, i) => (
            <ActionCard key={i} a={a} />
          ))}
          <GroundingRow items={grounding} />
        </AgentTurn>
      )}
    </>
  );
}

// ── action plumbing ──────────────────────────────────────────────────────────

/** Only where a real side effect exists; otherwise the card has no warn line. */
function warnFor(a: AdvisorActionData, t: (k: MessageKey) => string): string | null {
  if (a.type === "schedule_post") return t("adv.act.sched_quota");
  if (a.type === "automation" && a.control_kind === "pause") return t("adv.act.ctrl_pause_warn");
  if ((a.type === "routine" || a.type === "best_time_routine") && a.times_per_day > 1) {
    return t("adv.act.cap_warn").replace("{n}", String(a.times_per_day));
  }
  if (a.type === "auto_replies") return t("adv.act.mode_instant");
  return null;
}

/** Where the change lives once applied — the card's «Изменить» / done deep link. */
function openTargetFor(a: AdvisorActionData): string {
  switch (a.type) {
    case "voice_rule":
      return "/app/style-rules";
    case "schedule_post":
      return "/app/calendar";
    case "auto_replies":
    case "automation":
      return "/app/autopilot";
    case "topics_list":
      return "/app";
    default:
      return "/app/scenarios";
  }
}

/** The apply call — the exact wire shape each action type expects. */
function applyAction(accountId: number, act: AdvisorActionData): Promise<unknown> {
  switch (act.type) {
    case "auto_replies":
      return applyAdvisorAction(accountId, {
        type: "auto_replies",
        title: act.title,
        audience: act.audience,
        replies_per_day: act.replies_per_day,
        skip_low_value: act.skip_low_value,
      });
    case "voice_rule":
      return applyAdvisorAction(accountId, {
        type: "voice_rule",
        title: act.title,
        rule_text: act.rule_text,
        kind: act.rule_kind,
      });
    case "schedule_post":
      // Resolve the absolute instant FRESH at click time (never frozen at
      // render) so a slow click cannot schedule a stale time.
      return applyAdvisorAction(accountId, {
        type: "schedule_post",
        title: act.title,
        brief: act.brief,
        scheduled_at: nextOccurrence(act.weekday, act.hour).toISOString(),
      });
    case "reactive":
      return applyAdvisorAction(accountId, {
        type: "reactive",
        title: act.title,
        kind: act.reactive_kind,
        comment_text: act.comment_text,
      });
    case "format":
      return applyAdvisorAction(accountId, {
        type: "format",
        title: act.title,
        kind: act.format_kind,
        topic: act.topic,
        rubric_name: act.rubric_name,
        rubric_idea: act.rubric_idea,
        question: act.question,
        options: act.options,
      });
    case "automation":
      return applyAdvisorAction(accountId, {
        type: "automation",
        title: act.title,
        kind: act.control_kind,
        ...(act.control_kind === "quiet_hours"
          ? { quiet_start: act.quiet_start ?? undefined, quiet_end: act.quiet_end ?? undefined }
          : {}),
      });
    case "best_time_routine":
      return applyAdvisorAction(accountId, {
        type: "best_time_routine",
        title: act.title,
        topic: act.topic,
        blocks: act.blocks,
      });
    case "topics_list":
      return applyAdvisorAction(accountId, { type: "topics_list", title: act.title, topics: act.topics });
    case "routine":
      return applyAdvisorAction(accountId, {
        type: "routine",
        title: act.title,
        topic: act.topic,
        times_per_day: act.times_per_day,
      });
  }
}
