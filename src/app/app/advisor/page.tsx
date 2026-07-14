"use client";

// Advisor (/app/advisor) — the AI growth-advisor chat, built 1:1 to
// Advisor-SPEC.html (+ the mobile spec). Tester-gated, Insight group. A
// conversation where the author asks about Threads growth and the advisor
// answers with concrete, data-grounded advice drawn from THIS account's own
// data (assembled server-side from stats/voice/recent posts; see the backend
// `api/advisor.py`). Phases: first-run (hero + starters) · ready (thread) ·
// thinking (pulse dots + honest label) · error (inline reply row + Retry, never
// a whole-screen banner). The only mutation is "Open in Studio" — it routes to
// the Studio composer with a prefilled brief.
//
// The live reply is prose grounded by a real "Grounded in: …" source line
// (mapped from the backend `grounded_in`) PLUS the backend's structured data
// chips + suggestion cards (the model returns them as JSON; see
// `api/advisor.py`). /gallery/advisor shows the same rich design on mock data.

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { ApiError, applyAdvisorAction, chatAdvisor, clearTokens, fetchMe, getTokens } from "@/lib/api";
import { useSelectedAccountId } from "@/lib/account";
import { useTranslation } from "@/lib/i18n";
import { AppTopbar, TopbarPill } from "@/components/AppTopbar";
import { IcSparkle } from "@/components/icons";
import { TweaksPanel, TweakSection, TweakRadio, TweakToggle, useTweaks } from "@/components/tweaks/TweaksPanel";
import {
  AssistantReply,
  Composer,
  ErrorRow,
  Hero,
  Starters,
  ThinkingRow,
  UserBubble,
  type AdvisorReplyContent,
  type Starter,
} from "@/components/advisor/AdvisorParts";
import { ADVISOR_DEMO_TURNS, advisorSourceLabel } from "@/components/advisor/advisor-demo";
import type { AdvisorMessage } from "@/lib/types";

const IS_DEV = process.env.NODE_ENV === "development";

// A rendered turn in the thread: the user's message, then the assistant's reply
// (or a pending/errored placeholder while it generates).
type Turn = {
  user: string;
  // null while thinking; an AdvisorReplyContent once answered.
  reply: AdvisorReplyContent | null;
  status: "thinking" | "done" | "error";
};

// Cycle the honest "what it's reading" thinking labels.
const THINKING_KEYS = ["advisor.thinking_stats", "advisor.thinking_times", "advisor.thinking_writing"] as const;

export default function AdvisorPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [demoParam] = useState(() =>
    typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("demo") === "1" : false,
  );
  const [isTester, setIsTester] = useState(false);
  const allow = demoParam && (IS_DEV || isTester);

  // Auth gate (skipped in demo review).
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
  const [input, setInput] = useState("");
  const [thinkIdx, setThinkIdx] = useState(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // ── ?demo=1 Tweaks: drive each state without a backend ──
  const [tw, setTw] = useTweaks<{ dark: boolean; state: "first-run" | "ready" | "thinking" | "error" }>({
    dark: false,
    state: "first-run",
  });
  useEffect(() => {
    if (!allow) return;
    document.documentElement.classList.toggle("dark", tw.dark);
    return () => document.documentElement.classList.remove("dark");
  }, [allow, tw.dark]);

  const busy = turns.some((x) => x.status === "thinking");

  // Cycle thinking labels while a reply generates.
  useEffect(() => {
    if (!busy) return;
    const id = setInterval(() => setThinkIdx((i) => (i + 1) % THINKING_KEYS.length), 1600);
    return () => clearInterval(id);
  }, [busy]);

  // Keep the thread pinned to the newest message.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns]);

  const starters: Starter[] = [
    { icon: "nib", label: t("advisor.starter_post") },
    { icon: "chart", label: t("advisor.starter_drop") },
    { icon: "clock", label: t("advisor.starter_time") },
  ];

  // Build the API conversation from the answered turns + the new question.
  function buildMessages(question: string): AdvisorMessage[] {
    const msgs: AdvisorMessage[] = [];
    for (const turn of turns) {
      msgs.push({ role: "user", content: turn.user });
      if (turn.reply) msgs.push({ role: "assistant", content: turn.reply.paragraphs.join("\n\n") });
    }
    msgs.push({ role: "user", content: question });
    return msgs;
  }

  async function ask(question: string) {
    const q = question.trim();
    if (!q || accountId === null || busy) return;
    setInput("");
    setThinkIdx(0);
    const messages = buildMessages(q);
    setTurns((prev) => [...prev, { user: q, reply: null, status: "thinking" }]);

    try {
      const res = await chatAdvisor(accountId, messages);
      const content: AdvisorReplyContent = {
        // The model replies in prose; split blank-line-separated paragraphs.
        paragraphs: res.reply.split(/\n{2,}/).map((s) => s.trim()).filter(Boolean),
        sources: res.grounded_in.map((id) => advisorSourceLabel(id, t)),
        // Structured extras from the backend: data chips echoing the cited
        // numbers + suggestion cards (each wired to the Studio handoff).
        chips: res.chips.map((c) => ({ tone: c.tone, icon: c.icon ?? undefined, label: c.label })),
        suggestions: res.suggestions.map((s) => ({
          icon: s.icon,
          title: s.title,
          why: s.why,
          brief: s.brief,
          onOpenStudio: () => openInStudio(s.brief),
        })),
        // Per-account chat: an action targets THIS profile (accountId is non-null
        // here — the ask() guard returns early otherwise). No profile row.
        actions: res.actions.map((act) => ({
          type: act.type,
          title: act.title,
          topic: act.topic,
          timesPerDay: act.times_per_day,
          hoursPreview: act.hours_preview,
          onApply: async () => {
            await applyAdvisorAction(accountId, {
              type: "routine",
              title: act.title,
              topic: act.topic,
              times_per_day: act.times_per_day,
            });
          },
          onOpenScenarios: () => router.push("/app/scenarios"),
        })),
      };
      setTurns((prev) => {
        const next = [...prev];
        next[next.length - 1] = { user: q, reply: content, status: "done" };
        return next;
      });
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        clearTokens();
        router.push("/app/login");
        return;
      }
      setTurns((prev) => {
        const next = [...prev];
        next[next.length - 1] = { ...next[next.length - 1], reply: null, status: "error" };
        return next;
      });
    }
  }

  // Retry the last (errored) turn with the same question.
  function retryLast() {
    const last = turns[turns.length - 1];
    if (!last || last.status !== "error") return;
    setTurns((prev) => prev.slice(0, -1));
    void ask(last.user);
  }

  // Hand a suggestion brief to the Studio composer (the one mutation). Reused by
  // the gallery's mock suggestion cards in the live screen if structured output
  // lands; for now it's wired for completeness.
  function openInStudio(brief: string) {
    router.push(`/app?brief=${encodeURIComponent(brief)}`);
  }

  // ── what to render in the thread ──
  let demoTurns: Turn[] | null = null;
  if (allow) {
    if (tw.state === "ready") demoTurns = ADVISOR_DEMO_TURNS(t, openInStudio);
    else if (tw.state === "thinking")
      demoTurns = [{ user: t("advisor.starter_drop"), reply: null, status: "thinking" }];
    else if (tw.state === "error")
      demoTurns = [{ user: t("advisor.starter_post"), reply: null, status: "error" }];
    else demoTurns = [];
  }
  const shown = demoTurns ?? turns;
  const isFirstRun = shown.length === 0;
  const composerEl = (
    <Composer
      value={input}
      onChange={setInput}
      onSend={() => ask(input)}
      disabled={accountId === null && !allow}
      busy={busy}
    />
  );

  return (
    <div className="min-h-screen bg-bg text-text">
      <AppTopbar
        maxW="720px"
        title={t("advisor.title")}
        pill={
          <TopbarPill tone="accent" icon={<IcSparkle size={13} />}>
            {t("advisor.pill")}
          </TopbarPill>
        }
      />

      {/* Column layout: scrolling thread → docked composer (always visible). The
          fixed offsets keep the composer pinned above the safe area while the
          thread scrolls under the sticky topbar. */}
      <div className="mx-auto flex h-[calc(100dvh-3.25rem)] max-w-[720px] flex-col px-3.5 md:h-[calc(100dvh-3.75rem)] md:px-6">
        <div ref={scrollRef} className="flex-1 overflow-y-auto py-4 md:py-6">
          {isFirstRun ? (
            <div className="mx-auto max-w-[640px]">
              <Hero />
              <p className="mx-auto mb-2.5 max-w-[640px] text-center text-caption font-semibold uppercase tracking-[0.04em] text-text-subtle">
                {t("advisor.try_asking")}
              </p>
              <Starters starters={starters} onPick={(label) => setInput(label)} />
              {/* First run: the composer flows right under the suggestion pills
                  (with a gap), not docked to the bottom of the viewport. */}
              <div className="mt-5">{composerEl}</div>
            </div>
          ) : (
            <div className="mx-auto flex max-w-[640px] flex-col gap-6">
              {shown.map((turn, i) => (
                <div key={i} className="flex flex-col gap-6">
                  <UserBubble text={turn.user} />
                  {turn.status === "thinking" && <ThinkingRow label={t(THINKING_KEYS[thinkIdx])} />}
                  {turn.status === "error" && <ErrorRow onRetry={retryLast} />}
                  {turn.status === "done" && turn.reply && <AssistantReply content={turn.reply} />}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Once the conversation starts the composer docks at the bottom. */}
        {!isFirstRun && (
          <div className="shrink-0 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3">{composerEl}</div>
        )}
      </div>

      {allow && (
        <TweaksPanel title="Advisor">
          <TweakSection label="Appearance" />
          <TweakToggle label="Dark mode" value={tw.dark} onChange={(v) => setTw("dark", v)} />
          <TweakSection label="State" />
          <TweakRadio
            label="Phase"
            value={tw.state}
            options={["first-run", "ready", "thinking", "error"]}
            onChange={(v) => setTw("state", v as typeof tw.state)}
          />
        </TweaksPanel>
      )}
    </div>
  );
}
