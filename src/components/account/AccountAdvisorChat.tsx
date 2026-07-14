"use client";

// Portfolio Advisor chat (/app/account/advisor) — a 1:1 React port of the CD
// эталон (Account-Advisor-SPEC.html + the mobile spec). The account-scope
// sibling of the per-profile advisor chat (/app/advisor): the SAME chat
// components (components/advisor/AdvisorParts — prose + data chips + suggestion
// cards + "Open in Studio" handoff), scoped to the WHOLE portfolio, with the
// dashboard's advisor verdict PINNED at the top (never scrolls). Backend:
// POST /api/me/account/advisor/chat (chatAccountAdvisor). Tester-gated.
//
// Phases: empty (first-run hero + starters) · ready (thread) · thinking (pulse
// dots + honest label) · error (inline reply row + Retry) — the honest thin-data
// state is a demo/gallery frame (the live model answers thin data as normal
// prose). The composer is always docked; the pinned verdict is always visible.

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  AssistantReply,
  AssistantRow,
  Composer,
  ErrorRow,
  Hero,
  Starters,
  ThinkingRow,
  UserBubble,
  type AdvisorReplyContent,
  type Starter,
} from "@/components/advisor/AdvisorParts";
import { advisorSourceLabel } from "@/components/advisor/advisor-demo";
import { IcSparkle } from "@/components/icons";
import { setSelectedAccountId, useSelectedAccountId } from "@/lib/account";
import { ApiError, applyAdvisorAction, chatAccountAdvisor, clearTokens } from "@/lib/api";
import { useTranslation } from "@/lib/i18n";
import type { AdvisorData, AdvisorMessage, MeAccountResponse } from "@/lib/types";

import { ADVISOR_SEED_KEY, DynIcon, ScreenTopbar, Sidebar, useAccountNav } from "./AccountDashboard";
import type { Plural, T } from "./AccountDashboard";
import { AccountMobileShell } from "./AccountMobileDashboard";

// A rendered turn: the user's message, then the assistant's reply (or a pending /
// errored placeholder while it generates).
export type Turn = {
  user: string;
  reply: AdvisorReplyContent | null;
  status: "thinking" | "done" | "error";
};

export type ChatDemoState = "empty" | "ready" | "thinking" | "thin" | "error";

function starters(t: T): Starter[] {
  return [
    { icon: "nib", label: t("acc.adv_starter_fix") },
    { icon: "chart", label: t("acc.adv_starter_grow") },
    { icon: "clock", label: t("acc.adv_starter_pace") },
  ];
}

// ── pinned portfolio verdict (never scrolls) ─────────────────────────────────
function PinnedVerdict({ adv, t, mobile }: { adv?: AdvisorData | null; t: T; mobile?: boolean }) {
  const pfx = mobile ? "ma-chat-pinned" : "acc-chat-pinned";
  const verdict = adv?.verdict ?? t("acc.adv_thin_t");
  return (
    <div className={pfx}>
      <div className={`${pfx}-cap`}>
        <span className={`${pfx}-mark`}>
          <IcSparkle size={mobile ? 14 : 15} />
        </span>
        <span className={`${pfx}-caplab`}>{t("acc.adv_pinned_cap")}</span>
        <span className={`${pfx}-scope`}>{t("acc.adv_scope")}</span>
      </div>
      <div className={`${pfx}-verdict`}>{verdict}</div>
      {adv && adv.chips.length > 0 ? (
        <div className={`${pfx}-chips`}>
          {adv.chips.map((c, i) => (
            <span key={i} className={`acc-chip acc-chip--${c.tone}`}>
              <DynIcon n={c.icon} s={13} />
              <span className="t">{c.text}</span>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

// ── honest thin-data assistant row (a demo/gallery frame) ────────────────────
function ThinRow({ t }: { t: T }) {
  return (
    <AssistantRow>
      <div className="rounded-[11px] border border-l-[3px] border-border border-l-accent bg-surface px-[15px] py-[13px]">
        <div className="text-small font-semibold text-text">{t("acc.adv_thin_t")}</div>
        <div className="mt-1 text-caption leading-[1.55] text-text-muted">{t("acc.adv_thin_s")}</div>
      </div>
    </AssistantRow>
  );
}

// The demo conversation the gallery's "ready" state renders.
function demoTurns(t: T): Turn[] {
  return [
    {
      user: t("acc.adv_starter_fix"),
      status: "done",
      reply: {
        paragraphs: [
          "Две вещи, и обе быстрые. @mara.co выпал из синка — 6 часов без данных, поэтому портфель считается без него. И в @mara.notes копятся 7 ответов, старшему уже 3 часа.",
          "Начал бы с синка: данные целы, нужен только повторный коннект — и профиль вернётся в общий счёт.",
        ],
        chips: [
          { tone: "down", icon: "reply", label: "@mara.co · сбой синка" },
          { tone: "accent", icon: "reply", label: "7 ответов · @mara.notes" },
        ],
        sources: ["Профили", "Статистика портфеля", "Ответы"],
        suggestions: [
          {
            icon: "nib",
            title: "Почини синк @mara.co",
            why: "6 ч без обновления. Повторный коннект вернёт данные в портфель.",
            brief: "Открой @mara.co и переподключи синхронизацию.",
          },
        ],
      },
    },
    {
      user: t("acc.adv_starter_pace"),
      status: "done",
      reply: {
        paragraphs: [
          "В основном на @mara.studio — за неделю всего 2 поста против обычных 5. По всему портфелю вышло 10 постов против 14 неделей раньше, и почти вся просадка здесь.",
        ],
        chips: [
          { tone: "down", icon: "chart", label: "@mara.studio · 2 поста" },
          { tone: "down", label: "портфель 10 ← 14" },
        ],
        sources: ["Посты", "Статистика портфеля"],
        suggestions: [
          {
            icon: "nib",
            title: "Верни 5 постов в неделю на @mara.studio",
            why: "Профиль просел до 2 постов. Заведу черновик в твоём голосе.",
            brief: "Короткий пост в голосе @mara.studio на тему недели.",
          },
        ],
      },
    },
  ];
}

// Suggestion @handle → LIVE, VOICED profile's account id, from the portfolio
// payload. Case-insensitive, tolerant of a leading '@' on either side.
// Disconnected profiles never match (no token — the composer couldn't generate
// for them); voiceless ones don't either — switching to one would bounce the
// Studio into the onboarding wizard and lose the seeded brief (B9 follow-up),
// so the handoff keeps the current profile instead.
function makeAccountResolver(data: MeAccountResponse) {
  return (handle: string | null | undefined): number | null => {
    const h = (handle || "").trim().replace(/^@/, "").toLowerCase();
    if (!h) return null;
    for (const b of data.brands) {
      for (const p of b.profiles) {
        if (
          !p.disconnected &&
          p.has_voice !== false &&
          (p.handle || "").replace(/^@/, "").toLowerCase() === h
        )
          return p.id;
      }
    }
    return null;
  };
}

// ── chat state hook (mirrors /app/advisor) ───────────────────────────────────
function useChat(
  router: ReturnType<typeof useRouter>,
  t: T,
  demoState?: ChatDemoState,
  // Maps a suggestion's bare @handle to a LIVE profile's account id (null = no
  // match). Provided by the screens from their MeAccountResponse (B9).
  resolveAccountId?: (handle: string | null | undefined) => number | null,
  // Which breakpoint variant this instance is (the page mounts both) — decides
  // which one consumes the seeded first question, so only the visible chat asks.
  isMobile = false,
) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const busy = turns.some((x) => x.status === "thinking");
  // Fallback apply target for a portfolio action with no named profile.
  const selectedAccountId = useSelectedAccountId();

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns]);

  // Decision C handoff: the dashboard's ask line / «Открыть советника» / starters
  // / recos route here, seeding the first question via sessionStorage. Read +
  // clear it once on mount and fire the turn (clean URL, no re-ask on refresh).
  // The page mounts BOTH the desktop and the mobile chat (one hidden by a CSS
  // breakpoint), so only the instance that matches the ACTIVE viewport may
  // consume the single seed — otherwise the hidden instance would eat it and the
  // visible chat would render empty. `md` = 768px (Tailwind).
  useEffect(() => {
    if (demoState) return;
    const desktopActive = window.matchMedia("(min-width: 768px)").matches;
    if (isMobile ? desktopActive : !desktopActive) return;
    let seed = "";
    try {
      seed = sessionStorage.getItem(ADVISOR_SEED_KEY) || "";
      if (seed) sessionStorage.removeItem(ADVISOR_SEED_KEY);
    } catch {
      /* storage disabled — no seed to replay */
    }
    if (seed.trim()) void ask(seed, []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function buildMessages(question: string, base: Turn[]): AdvisorMessage[] {
    const msgs: AdvisorMessage[] = [];
    for (const turn of base) {
      msgs.push({ role: "user", content: turn.user });
      if (turn.reply) msgs.push({ role: "assistant", content: turn.reply.paragraphs.join("\n\n") });
    }
    msgs.push({ role: "user", content: question });
    return msgs;
  }

  function openInStudio(brief: string, accountHandle?: string | null) {
    // Switch the Studio to the ADVISED profile first (B9): without this the
    // brief landed on whatever profile happened to be selected, and the draft
    // was written in the wrong account's voice. No/unknown handle → keep the
    // current selection (portfolio-wide advice).
    const id = resolveAccountId?.(accountHandle) ?? null;
    if (id !== null) setSelectedAccountId(id);
    router.push(`/app?brief=${encodeURIComponent(brief)}`);
  }

  // `base` = the turns the request is built from (defaults to the current
  // turns; retryLast passes the already-trimmed list so the async setTurns
  // doesn't race the stale closure and double the user message).
  async function ask(question: string, base: Turn[] = turns) {
    const q = question.trim();
    if (!q || busy || demoState) return;
    setInput("");
    const messages = buildMessages(q, base);
    setTurns((prev) => [...prev, { user: q, reply: null, status: "thinking" }]);
    try {
      const res = await chatAccountAdvisor(messages);
      const content: AdvisorReplyContent = {
        paragraphs: res.reply.split(/\n{2,}/).map((s) => s.trim()).filter(Boolean),
        sources: res.grounded_in.map((id) => advisorSourceLabel(id, t)),
        chips: res.chips.map((c) => ({ tone: c.tone, icon: c.icon ?? undefined, label: c.label })),
        suggestions: res.suggestions.map((s) => ({
          icon: s.icon,
          title: s.title,
          why: s.why,
          brief: s.brief,
          onOpenStudio: () => openInStudio(s.brief, s.account),
        })),
        actions: res.actions.map((act) => {
          // Portfolio chat: target the named profile (resolved @handle) or fall
          // back to the currently selected one; the apply endpoint is per-account.
          const resolvedId = resolveAccountId?.(act.account) ?? null;
          const targetId = resolvedId ?? selectedAccountId ?? null;
          return {
            type: act.type,
            title: act.title,
            topic: act.topic,
            timesPerDay: act.times_per_day,
            hoursPreview: act.hours_preview,
            // Show the @handle ONLY when it resolved to the account we'll apply to
            // (else we'd claim a target we're not actually using — the fallback
            // applies to the currently selected profile, with no named-target row).
            targetHandle: resolvedId != null ? (act.account ?? null) : null,
            onApply: async () => {
              if (targetId == null) throw new Error("no target account");
              await applyAdvisorAction(targetId, {
                type: "routine",
                title: act.title,
                topic: act.topic,
                times_per_day: act.times_per_day,
              });
            },
            onOpenScenarios: () => {
              if (targetId != null) setSelectedAccountId(targetId);
              router.push("/app/scenarios");
            },
          };
        }),
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

  function retryLast() {
    const last = turns[turns.length - 1];
    if (!last || last.status !== "error") return;
    const base = turns.slice(0, -1); // drop the errored turn; rebuild from before it
    setTurns(() => base);
    void ask(last.user, base);
  }

  // Demo (gallery) overrides the live thread with a scripted state.
  let shown: Turn[] = turns;
  if (demoState === "ready") shown = demoTurns(t);
  else if (demoState === "thinking") shown = [{ user: t("acc.adv_starter_grow"), reply: null, status: "thinking" }];
  else if (demoState === "error") shown = [{ user: t("acc.adv_starter_fix"), reply: null, status: "error" }];
  else if (demoState === "thin") shown = [{ user: t("acc.adv_starter_grow"), reply: null, status: "done" }]; // ThinRow rendered below
  else if (demoState === "empty") shown = [];

  return { shown, input, setInput, ask, retryLast, busy, scrollRef, openInStudio, demoState };
}

// ── shared thread body (turns / hero+starters) ───────────────────────────────
function renderThread(
  shown: Turn[],
  t: T,
  retryLast: () => void,
  demoState: ChatDemoState | undefined,
) {
  return shown.map((turn, i) => (
    <div key={i} className="flex flex-col gap-6">
      <UserBubble text={turn.user} />
      {turn.status === "thinking" && <ThinkingRow label={t("acc.adv_reading")} />}
      {turn.status === "error" && <ErrorRow onRetry={retryLast} />}
      {turn.status === "done" && demoState === "thin" && <ThinRow t={t} />}
      {turn.status === "done" && demoState !== "thin" && turn.reply && <AssistantReply content={turn.reply} />}
    </div>
  ));
}

function FirstRun({ t, onPick }: { t: T; onPick: (label: string) => void }) {
  return (
    <div className="mx-auto max-w-[640px]">
      <Hero title={t("acc.adv_title")} sub={t("acc.adv_hero_sub")} />
      <p className="mx-auto mb-2.5 max-w-[640px] text-center text-caption font-semibold uppercase tracking-[0.04em] text-text-subtle">
        {t("advisor.try_asking")}
      </p>
      <Starters starters={starters(t)} onPick={onPick} />
    </div>
  );
}

// ── desktop screen (account shell + fixed-height chat) ───────────────────────
export function AccountAdvisorChat({
  data,
  adv,
  t,
  dark,
  demoState,
}: {
  data: MeAccountResponse;
  adv?: AdvisorData | null;
  t: T;
  dark?: boolean;
  demoState?: ChatDemoState;
}) {
  const router = useRouter();
  const nav = useAccountNav();
  const { shown, input, setInput, ask, retryLast, busy, scrollRef } = useChat(router, t, demoState, makeAccountResolver(data), false);
  const isFirstRun = shown.length === 0;
  return (
    <div className="acc-shell">
      <Sidebar data={data} t={t} nav={nav} active="advisor" />
      <div className="acc-mainwrap" style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 18 }}>
        <ScreenTopbar page="advisor" tenantName={data.tenant.name} t={t} nav={nav} dark={dark} pill={t("acc.adv_pill")} />
        <div className="acc-chat acc-chat--page">
          <PinnedVerdict adv={adv} t={t} />
          <div ref={scrollRef} className="acc-chat-scroll">
            {isFirstRun ? (
              <FirstRun t={t} onPick={setInput} />
            ) : (
              <div className="acc-chat-thread">{renderThread(shown, t, retryLast, demoState)}</div>
            )}
          </div>
          <div className="acc-chat-foot">
            <div className="acc-chat-foot-inner">
              <Composer
                value={input}
                onChange={setInput}
                onSend={() => ask(input)}
                busy={busy}
                disabled={!!demoState}
                placeholder={t("acc.adv_ask")}
                hintText={t("acc.adv_composer_hint")}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── mobile screen (shell + sticky pinned + docked composer) ──────────────────
export function AccountMobileAdvisorChat({
  data,
  adv,
  t,
  plural,
  dark,
  demoState,
}: {
  data: MeAccountResponse;
  adv?: AdvisorData | null;
  t: T;
  plural: Plural;
  dark?: boolean;
  demoState?: ChatDemoState;
}) {
  const router = useRouter();
  const { shown, input, setInput, ask, retryLast, busy } = useChat(router, t, demoState, makeAccountResolver(data), true);
  const isFirstRun = shown.length === 0;
  const dock = (
    <div className="ma-chat-dock">
      <Composer
        value={input}
        onChange={setInput}
        onSend={() => ask(input)}
        busy={busy}
        disabled={!!demoState}
        hint={false}
        placeholder={t("acc.adv_ask")}
      />
    </div>
  );
  return (
    <AccountMobileShell data={data} t={t} plural={plural} title={t("acc.adv_title")} active="advisor" dark={dark} bare dock={dock}>
      <div className="ma-chat-body">
        <PinnedVerdict adv={adv} t={t} mobile />
        <div className="ma-chat-thread">
          {isFirstRun ? <FirstRun t={t} onPick={setInput} /> : renderThread(shown, t, retryLast, demoState)}
        </div>
      </div>
    </AccountMobileShell>
  );
}
