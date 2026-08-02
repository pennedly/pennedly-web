"use client";

// Presentational pieces for the Agent screen (/app/advisor), built 1:1 to the CD
// эталон `Agent-Redesign-SPEC.html` + `agent-redesign.css` (ported here as
// `agent.css`). Class names and geometry come from that file verbatim; this
// module only supplies markup, icons and localized copy.
//
// The turn score is FIXED and never reorders (§4):
//     prose → metric strip → prose → cards → grounding row
//
// Shared by the live screen and /gallery/advisor (same components, mock data).

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";

import { ApiError } from "@/lib/api";
import { cn } from "@/lib/cn";
import { useTranslation, type MessageKey } from "@/lib/i18n";
import {
  IcAdvisor,
  IcAlert,
  IcArrowDown,
  IcArrowUp,
  IcBolt,
  IcBubble,
  IcCalendar,
  IcChart,
  IcCheck,
  IcClock,
  IcExternal,
  IcEye,
  IcLayers,
  IcNib,
  IcOverview,
  IcPlus,
  IcReplies,
  IcReply,
  IcSend,
  IcTags,
  IcTweak,
  IcUndo,
  IcVoice,
  type IconProps,
} from "@/components/icons";
import type { AdvisorActionData } from "@/lib/types";
import {
  splitMetric,
  type ActionDiff,
  type AgentSignal,
  type BriefCard,
  type DiffRun,
  type GroundedIcon,
  type GroundingItem,
} from "@/components/advisor/agent-data";

type IconCmp = (p: IconProps) => React.ReactElement;

// ── user turn ────────────────────────────────────────────────────────────────

export function UserTurn({ text }: { text: string }) {
  return (
    <div className="ag-turn ag-turn--user">
      <div className="ag-bubble">{text}</div>
    </div>
  );
}

// ── agent turn shell (mark + «АГЕНТ · время» + body) ─────────────────────────

export function AgentTurn({ time, children }: { time?: string; children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className="ag-turn">
      <span className="ag-mark">
        <IcAdvisor size={18} />
      </span>
      <div className="ag-body">
        <div className="ag-who">
          <b>{t("advisor.assistant_name")}</b>
          {time ? <time>{time}</time> : null}
        </div>
        {children}
      </div>
    </div>
  );
}

// ── metric strip (§4.2) ──────────────────────────────────────────────────────

export type MetricTone = "up" | "down" | "accent" | "neutral";
export type MetricIcon = "eye" | "reply" | "clock" | "chart" | "up" | "down";
export type AgentMetric = { tone: MetricTone; icon?: MetricIcon | null; label: string };

const METRIC_ICONS: Record<MetricIcon, IconCmp> = {
  eye: IcEye,
  reply: IcReply,
  clock: IcClock,
  chart: IcChart,
  up: IcArrowUp,
  down: IcArrowDown,
};

const TONE_CLASS: Record<MetricTone, string> = {
  up: "ag-metric--up",
  down: "ag-metric--down",
  accent: "ag-metric--note",
  neutral: "",
};

export function MetricStrip({ metrics }: { metrics: AgentMetric[] }) {
  if (metrics.length === 0) return null;
  return (
    <div className="ag-metrics">
      {metrics.map((m, i) => {
        const Icon = m.icon ? METRIC_ICONS[m.icon] : null;
        const { value, caption } = splitMetric(m.label);
        return (
          <div key={i} className={cn("ag-metric", TONE_CLASS[m.tone], caption === null && "ag-metric--text")}>
            <div className="ag-metric-v">
              {Icon ? <Icon size={14} /> : null}
              {value}
            </div>
            {caption ? <div className="ag-metric-l">{caption}</div> : null}
          </div>
        );
      })}
    </div>
  );
}

// ── grounding row (§4.3) — the honesty mechanism ─────────────────────────────

const SIGNAL_ICON: Record<GroundedIcon, IconCmp> = {
  stats: IcChart,
  heatmap: IcClock,
  posts: IcNib,
  replies: IcReply,
  voice: IcVoice,
  top_posts: IcOverview,
};

export function GroundingRow({ items }: { items: GroundingItem[] }) {
  const { t } = useTranslation();
  if (items.length === 0) return null;
  return (
    <div className="ag-grounded">
      <span className="ag-grounded-lab">
        <IcLayers size={14} />
        {t("advisor.grounded_in")}
      </span>
      {items.map((item) => {
        const Icon = SIGNAL_ICON[item.icon];
        const body = (
          <>
            <Icon size={12} />
            <b>{item.name}</b> · {item.volume}
          </>
        );
        // A checked-but-empty signal is shown, dashed and quiet — it is proof the
        // agent looked, not a link worth following.
        return item.href ? (
          <Link key={item.key} href={item.href} className="ag-src">
            {body}
          </Link>
        ) : (
          <span key={item.key} className="ag-src ag-src--empty">
            {body}
          </span>
        );
      })}
    </div>
  );
}

// ── suggestion card (§6) — hands a brief to the Studio composer ──────────────

export type AgentSuggestion = {
  icon: "nib" | "clock";
  title: string;
  why: string;
  onOpenStudio?: () => void;
};

export function SuggestionCard({ s }: { s: AgentSuggestion }) {
  const { t } = useTranslation();
  const Icon = s.icon === "clock" ? IcClock : IcNib;
  return (
    <div className="ag-sug">
      <span className="ag-sug-ico">
        <Icon size={17} />
      </span>
      <div className="ag-sug-b">
        <div className="ag-sug-t">{s.title}</div>
        <div className="ag-sug-s">{s.why}</div>
        <div className="ag-sug-a">
          <button type="button" className="ag-btn ag-btn--secondary ag-btn--sm" onClick={s.onOpenStudio}>
            <IcExternal size={14} />
            {t("advisor.open_in_studio")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── action card (§5) — writes to the account, so it states what changes ──────

type ActionType = AdvisorActionData["type"];

// Kind glyph + надтип + button verb, KEYED BY TYPE (§5.1: the verb is fixed by
// the type, never composed per answer). The kind/verb/done strings reuse the
// existing `adv.act.*` catalog, which is already translated into all 8 locales.
const ACT_META: Record<
  ActionType,
  { icon: IconCmp; kind: MessageKey; cta: MessageKey; done: MessageKey; link: MessageKey }
> = {
  routine: { icon: IcTweak, kind: "adv.act.routine_kind", cta: "adv.act.routine_apply", done: "adv.act.routine_done", link: "adv.act.routine_link" },
  auto_replies: { icon: IcReplies, kind: "adv.act.replies_kind", cta: "adv.act.replies_apply", done: "adv.act.replies_done", link: "adv.act.replies_link" },
  voice_rule: { icon: IcVoice, kind: "adv.act.voice_kind", cta: "adv.act.voice_apply", done: "adv.act.voice_done", link: "adv.act.voice_link" },
  schedule_post: { icon: IcCalendar, kind: "adv.act.sched_kind", cta: "adv.act.sched_apply", done: "adv.act.sched_done", link: "adv.act.sched_link" },
  reactive: { icon: IcBolt, kind: "adv.act.react_kind", cta: "adv.act.react_apply", done: "adv.act.react_done", link: "adv.act.react_link" },
  format: { icon: IcNib, kind: "adv.act.fmt_kind", cta: "adv.act.fmt_apply", done: "adv.act.fmt_done", link: "adv.act.fmt_link" },
  automation: { icon: IcBolt, kind: "adv.act.ctrl_pause_kind", cta: "adv.act.ctrl_pause_apply", done: "adv.act.ctrl_pause_done", link: "adv.act.ctrl_link" },
  best_time_routine: { icon: IcClock, kind: "adv.act.bt_kind", cta: "adv.act.bt_apply", done: "adv.act.bt_done", link: "adv.act.bt_link" },
  topics_list: { icon: IcTags, kind: "adv.act.topics_kind", cta: "adv.act.topics_apply", done: "adv.act.topics_done", link: "adv.act.topics_link" },
};

// The automation card's three control kinds carry their own glyph/verb/done copy.
const CTRL_META: Record<string, { kind: MessageKey; cta: MessageKey; done: MessageKey }> = {
  pause: { kind: "adv.act.ctrl_pause_kind", cta: "adv.act.ctrl_pause_apply", done: "adv.act.ctrl_pause_done" },
  quiet_hours: { kind: "adv.act.ctrl_quiet_kind", cta: "adv.act.ctrl_quiet_apply", done: "adv.act.ctrl_quiet_done" },
  resume: { kind: "adv.act.ctrl_resume_kind", cta: "adv.act.ctrl_resume_apply", done: "adv.act.ctrl_resume_done" },
};

// Mode = what actually happens on Apply, read off the BACKEND's behaviour, not
// guessed: "review" = the change lands as a draft for approval, "live" = it
// takes effect immediately. (This inverts the эталон's table for three types —
// schedule_post auto-publishes, reactive/format land as drafts. The pill has to
// tell the truth about the code, so the code wins.)
//
// The эталон's live pill reads «Сразу · можно отменить». Phase 1 has NO
// rollback: applied_changes_rollback.py gives `advisor_action` no safe inverse,
// so `rollbackable` is false for every card this screen can apply. The pill
// says «Сразу» only, and the applied row offers the deep link, not an Undo that
// could never run.
const ACT_MODE: Record<ActionType, "review" | "live"> = {
  routine: "review",
  best_time_routine: "review",
  reactive: "review",
  format: "review",
  auto_replies: "live",
  voice_rule: "live",
  schedule_post: "live",
  automation: "live",
  topics_list: "live",
};

export type AgentActionView = {
  action: AdvisorActionData;
  diff: ActionDiff;
  /** Only when there is a real side effect; otherwise the line is absent (§5). */
  warn?: string | null;
  onApply: () => Promise<void>;
  onOpen: () => void;
  /** Runs after a successful apply — refreshes the rail's receipts and signals
   *  so the journal shows the change that just landed. */
  onApplied?: () => Promise<void>;
  /** A card replayed from an older conversation whose condition no longer holds. */
  stale?: boolean;
  /** Review-only: open the card straight into one state so /gallery can show all
   *  four without clicking through them. Never set by the live screen. */
  initialState?: "proposed" | "applying" | "applied" | "error";
};

function DiffSide({ runs }: { runs: DiffRun[] }) {
  return (
    <>
      {runs.map((r, i) => (r.mark ? <mark key={i}>{r.text}</mark> : <span key={i}>{r.text}</span>))}
    </>
  );
}

export function ActionCard({ a }: { a: AgentActionView }) {
  const { t } = useTranslation();
  const [state, setState] = useState<"proposed" | "applying" | "applied" | "error">(a.initialState ?? "proposed");
  const [dismissed, setDismissed] = useState(false);
  // A definitive 4xx (quota 429, validation 422, cap 409) carries the server's own
  // reason and drops Retry — retrying cannot succeed. A 5xx / dropped connection
  // keeps the generic line + Retry. `errText` non-null ⇒ not retryable.
  const [errText, setErrText] = useState<string | null>(null);
  const [doneAt, setDoneAt] = useState<string>(
    a.initialState === "applied" ? new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : "",
  );

  if (dismissed) return null;

  const type = a.action.type;
  const meta = ACT_META[type];
  const ctrl = a.action.type === "automation" ? CTRL_META[a.action.control_kind] : null;
  const Icon = meta.icon;
  const mode = ACT_MODE[type];

  const apply = async () => {
    setErrText(null);
    setState("applying");
    try {
      await a.onApply();
      setDoneAt(new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }));
      setState("applied");
      if (a.onApplied) await a.onApplied().catch(() => {});
    } catch (e) {
      const client = e instanceof ApiError && e.status >= 400 && e.status < 500;
      setErrText(client ? (e as ApiError).message : null);
      setState("error");
    }
  };

  // Applied → the card collapses into a 48px check row (§5.2). The trailing
  // slot is the deep link to where the change now lives: phase 1 has no undo.
  if (state === "applied") {
    return (
      <div className="ag-act ag-act--done">
        <div className="ag-done-row">
          <IcCheck size={16} />
          <span>
            <span className="ag-done-t">{t(ctrl?.done ?? meta.done)}</span>
            <span className="ag-done-m">{doneAt ? `${t("agent.act.applied_at")} ${doneAt}` : ""}</span>
          </span>
          <span className="un">
            <button type="button" className="ag-btn ag-btn--ghost ag-btn--sm" onClick={a.onOpen}>
              {t(meta.link)}
              <IcExternal size={14} />
            </button>
          </span>
        </div>
      </div>
    );
  }

  const busy = state === "applying";
  return (
    <div className={cn("ag-act", busy && "ag-act--busy", state === "error" && "ag-act--fail")}>
      <div className="ag-act-hd">
        <span className="ag-act-ico">
          <Icon size={18} />
        </span>
        <div className="ag-act-hb">
          <div className="ag-act-kind">{t(ctrl?.kind ?? meta.kind)}</div>
          <div className="ag-act-t">{a.action.title}</div>
        </div>
        <span className={cn("ag-mode", mode === "review" ? "ag-mode--review" : "ag-mode--live")}>
          {mode === "review" ? <IcCheck size={11} /> : <IcBolt size={11} />}
          {t(mode === "review" ? "agent.mode.review" : "agent.mode.live")}
        </span>
      </div>

      <div className="ag-act-body">
        {/* Сейчас → Станет. No action card exists without it (§5). */}
        <dl className="ag-diff">
          <dt>{t("agent.diff.now")}</dt>
          <dd className="now">
            <DiffSide runs={a.diff.now} />
          </dd>
          <dt>{t("agent.diff.next")}</dt>
          <dd className="next">
            <DiffSide runs={a.diff.next} />
          </dd>
        </dl>
        {a.warn ? (
          <div className="ag-act-warn">
            <IcAlert size={14} />
            <span>{a.warn}</span>
          </div>
        ) : null}
      </div>

      {a.stale ? (
        <div className="ag-act-stale">{t("agent.act.stale")}</div>
      ) : (
        <div className="ag-act-ft">
          {state === "error" ? (
            <>
              {errText === null && (
                <button type="button" className="ag-btn ag-btn--secondary ag-btn--sm" onClick={apply}>
                  <IcUndo size={14} />
                  {t("advisor.retry")}
                </button>
              )}
              <span className="sp" />
              <span className="ag-act-err">{errText ?? t("agent.act.failed")}</span>
            </>
          ) : busy ? (
            <button type="button" className="ag-btn ag-btn--primary ag-btn--sm" disabled>
              <span className="ag-spin" />
              {t("adv.act.applying")}
            </button>
          ) : (
            <>
              <button type="button" className="ag-btn ag-btn--primary ag-btn--sm" onClick={apply}>
                {t(ctrl?.cta ?? meta.cta)}
              </button>
              <button type="button" className="ag-btn ag-btn--secondary ag-btn--sm" onClick={a.onOpen}>
                {t("agent.act.edit")}
              </button>
              <span className="sp" />
              <button type="button" className="ag-btn ag-btn--ghost ag-btn--sm" onClick={() => setDismissed(true)}>
                {t("agent.act.not_now")}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── thinking · thin data · error (§7) ────────────────────────────────────────

/** The agent reads its signals in order — an honest progress list, not dots. */
export function ThinkingSteps({ step }: { step: number }) {
  const { t } = useTranslation();
  const labels: MessageKey[] = ["agent.think.stats", "agent.think.times", "agent.think.write"];
  return (
    <div className="ag-steps">
      {labels.map((k, i) => {
        const state = i < step ? "done" : i === step ? "now" : "wait";
        return (
          <div key={k} className={`ag-step ag-step--${state}`}>
            {state === "done" ? <IcCheck size={15} /> : <span className="ag-step-g" />}
            {t(k)}
          </div>
        );
      })}
    </div>
  );
}

export type ThinData = { title: string; body: string; have: number; need: number; scopeLabel: string };

export function ThinDataBlock({ d }: { d: ThinData }) {
  const { t } = useTranslation();
  const pct = d.need > 0 ? Math.max(0, Math.min(100, Math.round((d.have / d.need) * 100))) : 0;
  return (
    <div className="ag-thin">
      <div className="ag-thin-t">
        <IcAlert size={16} />
        {d.title}
      </div>
      <p>{d.body}</p>
      <div className="ag-gauge">
        <span>{t("agent.thin.gauge").replace("{have}", String(d.have)).replace("{need}", String(d.need))}</span>
        <span className="ag-gauge-bar">
          <i style={{ width: `${pct}%` }} />
        </span>
        <span>{d.scopeLabel}</span>
      </div>
    </div>
  );
}

export function ErrorBlock({
  onRetry,
  onCopy,
  detail,
}: {
  onRetry: () => void;
  onCopy?: () => void;
  detail?: string | null;
}) {
  const { t } = useTranslation();
  return (
    <div className="ag-err">
      <div className="ag-err-t">
        <IcAlert size={16} />
        {t("agent.err.title")}
      </div>
      <p>{detail ?? t("agent.err.body")}</p>
      <div className="ag-err-a">
        <button type="button" className="ag-btn ag-btn--secondary ag-btn--sm" onClick={onRetry}>
          <IcUndo size={14} />
          {t("agent.err.retry")}
        </button>
        {onCopy ? (
          <button type="button" className="ag-btn ag-btn--ghost ag-btn--sm" onClick={onCopy}>
            {t("agent.err.copy")}
          </button>
        ) : null}
      </div>
    </div>
  );
}

/** The account lost its Threads connection (HTTP 409) — the one error that is
 *  not retryable and has exactly one fix. */
export function ReconnectBlock({ onReconnect }: { onReconnect: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="ag-err">
      <div className="ag-err-t">
        <IcAlert size={16} />
        {t("agent.err.disconnected_title")}
      </div>
      <p>{t("agent.err.disconnected_body")}</p>
      <div className="ag-err-a">
        <button type="button" className="ag-btn ag-btn--primary ag-btn--sm" onClick={onReconnect}>
          {t("agent.err.reconnect")}
        </button>
      </div>
    </div>
  );
}

// ── empty state: the week briefing (§3) ──────────────────────────────────────

const BRIEF_ICON: Record<NonNullable<BriefCard["icon"]>, IconCmp> = {
  up: IcArrowUp,
  down: IcArrowDown,
  clock: IcClock,
};

export type StarterChip = { icon: "nib" | "voice" | "replies"; label: string };
const CHIP_ICON: Record<StarterChip["icon"], IconCmp> = { nib: IcNib, voice: IcVoice, replies: IcReplies };

export function Briefing({
  cards,
  rangeLabel,
  chips,
  onAsk,
}: {
  cards: BriefCard[];
  rangeLabel: string;
  chips: StarterChip[];
  onAsk: (question: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="ag-open">
      <div className="ag-open-hd">
        <h2>{t("agent.brief.title")}</h2>
        <span>{rangeLabel}</span>
      </div>

      {cards.length > 0 ? (
        <div className="ag-brief">
          {cards.map((c) => {
            const Icon = c.icon ? BRIEF_ICON[c.icon] : null;
            return (
              <button
                key={c.key}
                type="button"
                className={cn("ag-card", c.tone === "up" && "ag-card--up", c.tone === "down" && "ag-card--down")}
                onClick={() => onAsk(c.question)}
              >
                <span className="ag-card-v">
                  {Icon ? <Icon size={15} /> : null}
                  {c.value}
                </span>
                <span className="ag-card-l">{c.label}</span>
                <span className="ag-card-q">
                  <IcAdvisor size={13} />
                  {c.question}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        // No card has enough data yet. Say so; do not draw a placeholder metric.
        <p className="ag-open-thin">{t("agent.brief.thin")}</p>
      )}

      <div className="ag-lab">{t("agent.brief.or_ask")}</div>
      <div className="ag-open-more">
        {chips.map((c) => {
          const Icon = CHIP_ICON[c.icon];
          return (
            <button key={c.label} type="button" className="ag-chipq" onClick={() => onAsk(c.label)}>
              <Icon size={14} />
              {c.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── composer (§3.1) ──────────────────────────────────────────────────────────

export function Composer({
  value,
  onChange,
  onSend,
  disabled,
  busy,
  freshness,
  onRefresh,
  refreshing,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled?: boolean;
  busy?: boolean;
  /** "updated 8 minutes ago" — the footer is a state line, not a disclaimer. */
  freshness: string;
  onRefresh?: () => void;
  refreshing?: boolean;
}) {
  const { t } = useTranslation();
  const canSend = !disabled && !busy && value.trim().length > 0;
  const ph = t("advisor.composer_placeholder");
  const ref = useRef<HTMLTextAreaElement | null>(null);

  // Grow with the content, capped by the эталон's 132px.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 132)}px`;
  }, [value]);

  return (
    <div className="ag-composer">
      <div className="ag-composer-row">
        <textarea
          ref={ref}
          rows={1}
          className="ag-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (canSend) onSend();
            }
          }}
          placeholder={ph}
          aria-label={ph}
        />
        <button
          type="button"
          className="ag-send"
          onClick={() => canSend && onSend()}
          disabled={!canSend}
          aria-label={t("advisor.send")}
        >
          {busy ? <span className="ag-spin" /> : <IcSend size={18} />}
        </button>
      </div>
      <div className="ag-composer-ft">
        <IcLayers size={13} />
        <span>{t("agent.composer_reads")}</span>
        <span className="sp" />
        <IcTweak size={13} />
        <button type="button" onClick={onRefresh} disabled={!onRefresh || refreshing}>
          {refreshing ? t("agent.refreshing") : freshness}
        </button>
      </div>
    </div>
  );
}

// ── right rail (§8) ──────────────────────────────────────────────────────────

/** One stored thread in the rail's list. `id` is null only for a thread that
 *  exists on screen but not yet on the server — the fresh stream right after
 *  «+ Новый», before its first question is answered (the server materializes a
 *  thread WITH its first exchange, so there is nothing to point at until then). */
export type RailConversation = {
  id: number | null;
  title: string;
  stamp: string;
};
export type RailReceipt = {
  id: number;
  title: string;
  meta: string;
  onOpen?: () => void;
};

export function Rail({
  signals,
  conversations,
  activeConversationId,
  onOpenConversation,
  onNewConversation,
  receipts,
  onRefreshSignals,
  refreshing,
}: {
  signals: AgentSignal[];
  /** Newest activity first; the first entry may be the unsaved fresh stream. */
  conversations: RailConversation[];
  /** Which row reads as current. `null` = the unsaved fresh stream. */
  activeConversationId: number | null;
  onOpenConversation?: (id: number) => void;
  /** Absent → «+ Новый» is not offered (the gallery's static frames). */
  onNewConversation?: () => void;
  receipts: RailReceipt[];
  onRefreshSignals?: () => void;
  refreshing?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className="ag-rail">
      <div className="ag-panel">
        <div className="ag-panel-hd">
          <IcLayers size={13} />
          {t("agent.rail.signals")}
          {onRefreshSignals ? (
            <button type="button" className="act" onClick={onRefreshSignals} disabled={refreshing}>
              {refreshing ? t("agent.refreshing") : t("agent.rail.refresh")}
            </button>
          ) : null}
        </div>
        {signals.map((s) => {
          const Icon = SIGNAL_ICON[s.id];
          return (
            <div key={s.id} className={cn("ag-sig", s.thin && "ag-sig--thin")}>
              <Icon size={15} />
              <span className="ag-sig-n">{s.name}</span>
              <span className="ag-sig-v">{s.volume}</span>
            </div>
          );
        })}
      </div>

      <div className="ag-panel">
        <div className="ag-panel-hd">
          <IcBubble size={13} />
          {t("agent.rail.conversations")}
          {onNewConversation ? (
            // «+ Новый» clears the stream; it creates nothing server-side (§8).
            <button type="button" className="act" onClick={onNewConversation}>
              {t("agent.rail.new_conversation")}
            </button>
          ) : null}
        </div>
        {conversations.length === 0 ? (
          <div className="ag-panel-empty">{t("agent.rail.no_conversations")}</div>
        ) : (
          conversations.map((c) => {
            const current = c.id === activeConversationId;
            // The current row and the not-yet-saved one have nowhere to go, so
            // they render as plain rows; aria-current marks the one in view.
            const body = (
              <>
                <span className="ag-conv-t">{c.title}</span>
                <span className="ag-conv-m">{c.stamp}</span>
              </>
            );
            return current || c.id === null || !onOpenConversation ? (
              <div
                key={c.id ?? "fresh"}
                className="ag-conv"
                {...(current ? { "aria-current": "true" as const } : {})}
              >
                {body}
              </div>
            ) : (
              <button
                key={c.id}
                type="button"
                className="ag-conv"
                onClick={() => onOpenConversation(c.id as number)}
              >
                {body}
              </button>
            );
          })
        )}
      </div>

      <div className="ag-panel">
        <div className="ag-panel-hd">
          <IcCheck size={13} />
          {t("agent.rail.applied")}
        </div>
        {receipts.length === 0 ? (
          <div className="ag-panel-empty">{t("agent.rail.no_applied")}</div>
        ) : (
          receipts.map((r) =>
            r.onOpen ? (
              <button key={r.id} type="button" className="ag-receipt" onClick={r.onOpen}>
                <IcCheck size={14} />
                <span>
                  <span className="ag-receipt-t">{r.title}</span>
                  <span className="ag-receipt-m">{r.meta}</span>
                </span>
              </button>
            ) : (
              <div key={r.id} className="ag-receipt">
                <IcCheck size={14} />
                <span>
                  <span className="ag-receipt-t">{r.title}</span>
                  <span className="ag-receipt-m">{r.meta}</span>
                </span>
              </div>
            ),
          )
        )}
      </div>
    </div>
  );
}

/** ≤959px: the SAME rail block, in a bottom sheet opened from the bar (§8). */
export function RailSheet({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  const { t } = useTranslation();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <>
      <div className="ag-sheet-scrim" onMouseDown={onClose} />
      <div className="ag-sheet" role="dialog" aria-modal="true" aria-label={t("agent.rail.signals")}>
        <div className="ag-sheet-hd">
          <b>{t("agent.rail.sheet_title")}</b>
          <span className="sp" />
          <button type="button" className="ag-sheet-x" onClick={onClose} aria-label={t("a11y.close")}>
            <IcPlus size={18} style={{ transform: "rotate(45deg)" }} />
          </button>
        </div>
        {children}
      </div>
    </>
  );
}

// ── scroll-to-latest pill ────────────────────────────────────────────────────

export function JumpToLatest({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation();
  return (
    <button type="button" className="ag-jump" onClick={onClick}>
      <IcArrowDown size={14} />
      {t("agent.jump")}
    </button>
  );
}

// Re-exported so the gallery can build a rail without importing icons itself.
export { IcOverview };
