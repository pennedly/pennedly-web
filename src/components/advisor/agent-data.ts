"use client";

// Data derivation for the Agent screen (/app/advisor) — the redesign's honesty
// layer. Nothing here invents a number: every value comes from an endpoint the
// user can open themselves, and a signal with no data is REPORTED as empty
// rather than hidden or guessed (Agent-Redesign-SPEC §1, §4.3, §7.2).
//
// Four jobs:
//   1. SIGNALS — the closed list of what the agent can read right now, with the
//      real volume of each. Backs both the rail panel (§8) and the per-turn
//      grounding row (§4.3).
//   2. BRIEFING — the empty state's week summary (§3): real 7-day metrics, each
//      with the one question it raises. Always an EVEN number of cards (2 or 4).
//   3. METRIC STRIP — splits the backend's single free-text chip label into a
//      value + a caption for the two-line cell (§4.2).
//   4. ACTION DIFF — the «Сейчас → Станет» block every action card must carry
//      (§5). "Сейчас" is read from the account's real config, never assumed.

import type { MessageKey } from "@/lib/i18n";
import { pluralUnit } from "@/lib/i18n";
import type { LocaleCode } from "@/lib/i18n";
import type {
  AdvisorActionData,
  AdvisorGroundedId,
  AdvisorResponse,
  AutopilotConfig,
  RoleBook,
  StatsResponse,
} from "@/lib/types";
import { nextOccurrence, formatSchedule } from "@/lib/schedule";

type T = (key: MessageKey) => string;

/** One rendered exchange: the question, then the agent's reply (or the pending /
 *  failed placeholder while it generates). Shared by the live screen, the
 *  ?demo=1 review and /gallery/advisor so all three render the same components. */
export type AgentTurnData = {
  user: string;
  reply: AdvisorResponse | null;
  status: "thinking" | "done" | "error" | "disconnected";
  createdAt: string | null;
  errorDetail?: string | null;
};

// U+2212 MINUS SIGN — the spec is explicit that a negative delta is never a
// hyphen (§11).
const MINUS = "−";

// ── numbers ──────────────────────────────────────────────────────────────────

/** "+18%" / "−18%" / "0%", grouped per locale, minus = U+2212. */
export function signedPct(pct: number, locale: string): string {
  const rounded = Math.round(pct);
  const body = `${Math.abs(rounded).toLocaleString(locale)}%`;
  if (rounded > 0) return `+${body}`;
  if (rounded < 0) return `${MINUS}${body}`;
  return body;
}

export function fmtInt(n: number, locale: string): string {
  return Math.round(n).toLocaleString(locale);
}

/** "updated 8 minutes ago" from an ISO stamp; null → the "never synced" copy. */
export function relFreshness(iso: string | null, locale: string, t: T): string {
  if (!iso) return t("agent.fresh_never");
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return t("agent.fresh_never");
  const diffSec = Math.round((then - Date.now()) / 1000);
  const abs = Math.abs(diffSec);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const rel =
    abs < 60
      ? rtf.format(diffSec, "second")
      : abs < 3600
        ? rtf.format(Math.round(diffSec / 60), "minute")
        : abs < 86400
          ? rtf.format(Math.round(diffSec / 3600), "hour")
          : rtf.format(Math.round(diffSec / 86400), "day");
  return `${t("agent.fresh_prefix")} ${rel}`;
}

// ── 1 · signals (the closed list) ────────────────────────────────────────────

// The per-PROFILE advisor grounds itself in exactly these five signals — the ids
// the backend emits in `grounded_in` (generation/advisor.py `sources.append`).
// The spec's sixth source ("Топ-посты") belongs to the ACCOUNT-level advisor,
// which is a different endpoint; listing it here would claim the agent checked
// something it never reads. See the handoff note in the page header.
export type AgentSignalId = "stats" | "heatmap" | "posts" | "replies" | "voice";

export const AGENT_SIGNALS: AgentSignalId[] = ["stats", "heatmap", "posts", "replies", "voice"];

// backend `grounded_in` id → our signal id.
const GROUNDED_ID_TO_SIGNAL: Record<string, AgentSignalId> = {
  "Stats · 7 days": "stats",
  "best-time heatmap": "heatmap",
  "recent posts": "posts",
  replies: "replies",
  "Voice (role-book)": "voice",
};

export function signalOfGroundedId(id: string): AgentSignalId | null {
  return GROUNDED_ID_TO_SIGNAL[id] ?? null;
}

const SIGNAL_NAME: Record<AgentSignalId, MessageKey> = {
  stats: "agent.sig.stats",
  heatmap: "agent.sig.heatmap",
  posts: "agent.sig.posts",
  replies: "agent.sig.replies",
  voice: "agent.sig.voice",
};

export type AgentSignal = {
  id: AgentSignalId;
  name: string;
  /** Human volume ("148", "12 posts", "7 days"), or the "no data" copy. */
  volume: string;
  /** True when the signal carries nothing — rendered dashed / warning-toned. */
  thin: boolean;
};

/** How many rules the account's voice actually holds (do + don't lists). */
function roleBookRules(rb: RoleBook | null): number {
  const s = rb?.sections;
  if (!s) return 0;
  return (s.do_list?.length ?? 0) + (s.dont_list?.length ?? 0);
}

export function buildSignals(
  stats: StatsResponse | null,
  roleBook: RoleBook | null,
  locale: LocaleCode,
  t: T,
): AgentSignal[] {
  const noData = t("agent.no_data");
  const heatPosts = (stats?.heatmap ?? []).reduce((n, c) => n + c.posts, 0);
  const posts = stats?.current.posts ?? 0;
  const comments = stats?.current.comments ?? 0;
  const rules = roleBookRules(roleBook);
  const hasVoice = roleBook !== null && (roleBook.prompt_text || "").trim().length > 0;
  const statsHasData = !!stats && (stats.current.posts > 0 || stats.current.views > 0);

  const of = (id: AgentSignalId, volume: string, thin: boolean): AgentSignal => ({
    id,
    name: t(SIGNAL_NAME[id]),
    volume: thin ? noData : volume,
    thin,
  });

  return [
    of("stats", `7 ${pluralUnit(locale, "days", 7)}`, !statsHasData),
    of("heatmap", `${fmtInt(heatPosts, locale)} ${pluralUnit(locale, "posts", heatPosts)}`, heatPosts === 0),
    of("posts", `${fmtInt(posts, locale)} ${pluralUnit(locale, "posts", posts)}`, posts === 0),
    of("replies", fmtInt(comments, locale), comments === 0),
    of(
      "voice",
      rules > 0 ? `${fmtInt(rules, locale)} ${t("agent.sig.rules_unit")}` : t("agent.sig.voice_active"),
      !hasVoice,
    ),
  ];
}

// ── the structured grounding row (§4.3) ──────────────────────────────────────
// The closed six the spec names. `best_times` is the same signal the rail calls
// `heatmap`; `top_posts` has no rail row on this endpoint (the per-profile
// advisor never reads it — only the account-level one does), so it appears here
// only if a reply actually names it.
export const GROUNDED_HREF: Record<AdvisorGroundedId, string> = {
  stats: "/app/stats",
  best_times: "/app/stats#best-times",
  posts: "/app/feed",
  top_posts: "/app/stats#top",
  replies: "/app/replies",
  voice: "/app/role-book",
};

const GROUNDED_NAME: Record<AdvisorGroundedId, MessageKey> = {
  stats: "agent.sig.stats",
  best_times: "agent.sig.heatmap",
  posts: "agent.sig.posts",
  top_posts: "agent.sig.top_posts",
  replies: "agent.sig.replies",
  voice: "agent.sig.voice",
};

/** Which glyph a grounding chip carries — the rail's icon set plus top-posts. */
export type GroundedIcon = AgentSignalId | "top_posts";

const SIGNAL_TO_GROUNDED: Record<AgentSignalId, AdvisorGroundedId> = {
  stats: "stats",
  heatmap: "best_times",
  posts: "posts",
  replies: "replies",
  voice: "voice",
};

/** One chip of the grounding row, already resolved to what it renders. */
export type GroundingItem = {
  key: string;
  icon: GroundedIcon;
  name: string;
  volume: string;
  /** Where the number lives. null ⇒ dashed, quiet, not a link (§4.3). */
  href: string | null;
};

/** The grounding row for one turn.
 *
 *  Preferred path: the reply's structured `grounded` — ids from the closed six,
 *  each with its real volume and an `empty` flag. Empty ⇒ dashed and inert.
 *
 *  Fallback (a reply that predates that field): the NAMED `grounded_in` strings
 *  paired with the signals this screen fetched itself. Those chips stay
 *  navigable — the id→screen map is verified against the backend's own
 *  `sources.append` values (generation/advisor.py), so the link is known-good;
 *  degrading them to inert text would drop working navigation for nothing. */
export function groundingFor(
  res: Pick<AdvisorResponse, "grounded_in" | "grounded">,
  signals: AgentSignal[],
  t: T,
): GroundingItem[] {
  const noData = t("agent.no_data");

  if (res.grounded && res.grounded.length > 0) {
    const out: GroundingItem[] = [];
    for (const g of res.grounded) {
      const name = GROUNDED_NAME[g.id];
      if (!name) continue; // an id outside the closed set is not rendered
      out.push({
        key: g.id,
        icon: g.id === "best_times" ? "heatmap" : g.id,
        name: t(name),
        volume: g.empty ? noData : g.volume,
        href: g.empty ? null : GROUNDED_HREF[g.id],
      });
    }
    return out;
  }

  const cited = new Set<AgentSignalId>();
  for (const id of res.grounded_in) {
    const sig = signalOfGroundedId(id);
    if (sig) cited.add(sig);
  }
  const out: GroundingItem[] = [];
  for (const s of signals) {
    const used = cited.has(s.id);
    // A signal holding data that wasn't cited is left out — it wasn't used.
    // One that came back empty is shown anyway: proof the agent looked.
    if (!used && !s.thin) continue;
    out.push({
      key: s.id,
      icon: s.id,
      name: s.name,
      volume: s.volume,
      href: used ? GROUNDED_HREF[SIGNAL_TO_GROUNDED[s.id]] : null,
    });
  }
  return out;
}

// ── 2 · the week briefing (empty state) ──────────────────────────────────────

export type BriefCard = {
  key: string;
  tone: "up" | "down" | null;
  icon: "up" | "down" | "clock" | null;
  value: string;
  label: string;
  question: string;
  /** Ranking weight — only the strongest survive the even-count rule. */
  weight: number;
};

const BLOCK_KEY: MessageKey[] = ["adv.act.block_morning", "adv.act.block_daytime", "adv.act.block_evening", "adv.act.block_night"];

/** Weekday name (ISO 1=Mon..7=Sun) in the viewer's locale, short form. */
function weekdayShort(weekday: number, locale: string): string {
  // 2024-01-01 was a Monday, so +(weekday-1) days lands on the right name.
  const d = new Date(Date.UTC(2024, 0, weekday));
  return d.toLocaleDateString(locale, { weekday: "short", timeZone: "UTC" });
}

/** The 7-day summary the empty state opens with. Always 0, 2 or 4 cards: an odd
 *  count would leave a hole in the 2×2 grid (§3). A metric with no data does not
 *  produce a card at all. */
export function buildBrief(stats: StatsResponse | null, locale: LocaleCode, t: T): BriefCard[] {
  if (!stats) return [];
  const cards: BriefCard[] = [];
  const { current, previous, deltas } = stats;

  if (deltas?.views_pct != null && current.views > 0) {
    const pct = deltas.views_pct;
    cards.push({
      key: "views",
      tone: pct < 0 ? "down" : pct > 0 ? "up" : null,
      icon: pct < 0 ? "down" : pct > 0 ? "up" : null,
      value: signedPct(pct, locale),
      label: t("agent.brief.views_l"),
      question: pct < 0 ? t("agent.brief.views_q_down") : t("agent.brief.views_q_up"),
      weight: Math.abs(pct) + 1,
    });
  }

  if (previous != null && (current.posts > 0 || previous.posts > 0)) {
    const diff = current.posts - previous.posts;
    cards.push({
      key: "posts",
      tone: diff < 0 ? "down" : diff > 0 ? "up" : null,
      icon: null,
      value: fmtInt(current.posts, locale),
      label: t("agent.brief.posts_l").replace("{n}", fmtInt(previous.posts, locale)),
      question: diff < 0 ? t("agent.brief.posts_q_down") : t("agent.brief.posts_q_up"),
      weight: Math.abs(diff) * 12 + 1,
    });
  }

  if (deltas?.comments_pct != null && current.comments > 0) {
    const pct = deltas.comments_pct;
    cards.push({
      key: "comments",
      tone: pct < 0 ? "down" : pct > 0 ? "up" : null,
      icon: pct < 0 ? "down" : pct > 0 ? "up" : null,
      value: signedPct(pct, locale),
      label: t("agent.brief.replies_l"),
      question: pct < 0 ? t("agent.brief.replies_q_down") : t("agent.brief.replies_q_up"),
      weight: Math.abs(pct),
    });
  }

  const best = [...(stats.heatmap ?? [])].filter((c) => c.posts > 0).sort((a, b) => b.avg_views - a.avg_views)[0];
  if (best) {
    cards.push({
      key: "window",
      tone: null,
      icon: "clock",
      value: `${weekdayShort(best.weekday, locale)} · ${t(BLOCK_KEY[best.block] ?? BLOCK_KEY[0])}`,
      label: t("agent.brief.window_l"),
      question: t("agent.brief.window_q"),
      weight: 8,
    });
  }

  if (cards.length >= 4) return cards.slice(0, 4);
  if (cards.length === 3) return [...cards].sort((a, b) => b.weight - a.weight).slice(0, 2);
  if (cards.length === 2) return cards;
  return [];
}

// ── 3 · metric strip ─────────────────────────────────────────────────────────

// The backend hands each cited number back as ONE free string ("7-day views
// −18%", "Posts 5 → 3"); the strip's cell wants a value and a caption. These
// patterns pull the numeric part out when there is an unambiguous one, and the
// caller falls back to a text cell when there isn't — no guessing, no clipping.
const NUM = String.raw`[+−\-]?\d[\d\s., ]*(?:\s*[%×x])?`;
const TRAILING = new RegExp(String.raw`^(.*?)[\s:·,]+(${NUM}(?:\s*(?:→|->)\s*${NUM})?)$`, "u");
const ARROW = new RegExp(String.raw`^(.*?)[\s:·,]+(${NUM}\s*(?:→|->)\s*${NUM})$`, "u");
// A leading number may carry a 1-2 letter unit ("4 h", "4 ч") — without this the
// unit is orphaned into the caption and the cell reads "4 / h median reply time".
// The lookahead keeps a real word out: "41 вопрос" splits at 41, not at "во".
const LEADING = new RegExp(
  String.raw`^([+−\-]?\d(?:[\d.,    ]*\d)?(?:\s*(?:%|×|x))?(?:\s+\p{L}{1,2}(?!\p{L}))?)[\s:·,]+(.+)$`,
  "u",
);

export type SplitMetric = { value: string; caption: string | null };

export function splitMetric(label: string): SplitMetric {
  const s = label.trim();
  const arrow = ARROW.exec(s);
  if (arrow) return { value: arrow[2].trim(), caption: arrow[1].trim() };
  const trail = TRAILING.exec(s);
  if (trail && trail[1].trim()) return { value: trail[2].trim(), caption: trail[1].trim() };
  const lead = LEADING.exec(s);
  if (lead && lead[2].trim()) return { value: lead[1].trim(), caption: lead[2].trim() };
  return { value: s, caption: null };
}

// ── 4 · the action diff («Сейчас → Станет») ──────────────────────────────────

/** What we actually know about the account right now. Every field is nullable:
 *  a failed read means the card says so instead of asserting a stale value. */
export type AgentSnapshot = {
  autopilot: AutopilotConfig | null;
  /** Standing user-authored voice rules (what `voice_rule` appends to). */
  voiceRules: number | null;
  /** Enabled scenarios (what `routine` / `best_time_routine` adds to). */
  scenarios: number | null;
};

export const EMPTY_SNAPSHOT: AgentSnapshot = { autopilot: null, voiceRules: null, scenarios: null };

/** One side of the diff: plain runs and highlighted runs. The highlight marks
 *  exactly the values that change (§5). */
export type DiffRun = { text: string; mark?: boolean };
export type ActionDiff = { now: DiffRun[]; next: DiffRun[] };

const AUDIENCE_KEY: Record<string, MessageKey> = {
  questions: "adv.act.aud_questions",
  fans: "adv.act.aud_fans",
  all_except_trolls: "adv.act.aud_all_except_trolls",
};

const BLOCK_LABEL_KEY: Record<string, MessageKey> = {
  morning: "adv.act.block_morning",
  daytime: "adv.act.block_daytime",
  evening: "adv.act.block_evening",
  night: "adv.act.block_night",
};

const REACT_KEY: Record<string, MessageKey> = {
  amplify: "adv.act.react_amplify",
  milestone: "adv.act.react_milestone",
  booster: "adv.act.react_booster",
};

const FORMAT_KEY: Record<string, MessageKey> = {
  daily_question: "adv.act.fmt_dq",
  rubric: "adv.act.fmt_rubric",
  poll: "adv.act.fmt_poll",
};

const hh = (n: number) => `${String(n).padStart(2, "0")}:00`;
const hours = (hs: number[]) => hs.map(hh).join(", ");

/** A `current_*` reading the backend actually sent. `null`/absent both mean "not
 *  sent" — the card then falls back to what this screen read for itself. */
function sent<V>(v: V | null | undefined): v is V {
  return v !== null && v !== undefined;
}

export function buildActionDiff(
  a: AdvisorActionData,
  snap: AgentSnapshot,
  locale: LocaleCode,
  t: T,
): ActionDiff {
  const unknown = t("agent.diff.unknown");
  const ap = snap.autopilot;

  // How many routines run right now: the backend's own reading wins over the
  // one derived from the scenarios list, because it is what apply() will act on.
  const routinesNow = sent(a.current_routines_count) ? a.current_routines_count : snap.scenarios;

  switch (a.type) {
    case "routine": {
      const now =
        routinesNow === null
          ? unknown
          : routinesNow === 0
            ? t("agent.diff.routine_none")
            : t("agent.diff.routine_n").replace("{n}", fmtInt(routinesNow, locale));
      const topic = a.topic.trim();
      return {
        now: [{ text: now }],
        next: [
          { text: `${a.times_per_day}× ${t("adv.act.per_day")} · ~${hours(a.hours_preview)}`, mark: true },
          { text: topic ? ` · ${t("adv.act.topic")}: ${topic}` : ` · ${t("adv.act.any_topic")}` },
        ],
      };
    }
    case "auto_replies": {
      // The backend's readings win when it sends them; otherwise the live
      // autopilot config this screen fetched.
      const onNow = sent(a.current_enabled)
        ? a.current_enabled
        : ap
          ? ap.enabled && ap.reply_mode !== "off"
          : null;
      const audienceNow = sent(a.current_audience) ? a.current_audience : (ap?.reply_audience ?? null);
      const now =
        onNow === null
          ? unknown
          : !onNow
            ? t("agent.diff.replies_off")
            : t("agent.diff.replies_on").replace(
                "{audience}",
                t(AUDIENCE_KEY[audienceNow ?? ""] ?? "adv.act.aud_all_except_trolls"),
              ) +
              (sent(a.current_replies_per_day)
                ? ` · ${t("adv.act.up_to")} ${fmtInt(a.current_replies_per_day, locale)}× ${t("adv.act.per_day")}`
                : "");
      return {
        now: [{ text: now }],
        next: [
          { text: `${t("agent.diff.replies_on_word")} · ` },
          { text: t(AUDIENCE_KEY[a.audience] ?? "adv.act.aud_all_except_trolls"), mark: true },
          { text: " · " },
          { text: `${t("adv.act.up_to")} ${a.replies_per_day}× ${t("adv.act.per_day")}`, mark: true },
          ...(a.skip_low_value ? [{ text: ` · ${t("adv.act.skip_low")}` }] : []),
        ],
      };
    }
    case "voice_rule": {
      const n = sent(a.current_rules_count) ? a.current_rules_count : snap.voiceRules;
      return {
        now: [{ text: n === null ? unknown : t("agent.diff.rules_n").replace("{n}", fmtInt(n, locale)) }],
        next: [
          ...(n === null ? [] : [{ text: t("agent.diff.rules_n").replace("{n}", fmtInt(n + 1, locale)), mark: true }, { text: " · " }]),
          { text: `«${a.rule_text}»` },
        ],
      };
    }
    case "schedule_post": {
      const when = formatSchedule(nextOccurrence(a.weekday, a.hour), locale);
      return {
        now: [{ text: t("agent.diff.sched_now") }],
        next: [{ text: `${t("agent.diff.sched_draft")} → ` }, { text: when, mark: true }],
      };
    }
    case "reactive":
      return {
        now: [{ text: t("agent.diff.reactive_now") }],
        next: [{ text: t(REACT_KEY[a.reactive_kind] ?? "adv.act.react_amplify"), mark: true }],
      };
    case "format": {
      const what =
        a.format_kind === "daily_question"
          ? `${t("adv.act.fmt_dq")}${a.topic ? ` · ${a.topic}` : ""}`
          : a.format_kind === "rubric"
            ? `${t("adv.act.fmt_rubric")}: ${a.rubric_name ?? ""}`
            : `${t("adv.act.fmt_poll")}: ${a.question ?? ""}`;
      // Only the backend knows which recurring format is on; absent ⇒ the
      // catalog's "no recurring format" line, which is what apply() assumes.
      const running = sent(a.current_format_kind) ? FORMAT_KEY[a.current_format_kind] : null;
      return {
        now: [{ text: running ? t(running) : t("agent.diff.format_now") }],
        next: [{ text: what, mark: true }],
      };
    }
    case "automation": {
      const pausedNow = sent(a.current_paused) ? a.current_paused : null;
      const runningNow = pausedNow !== null ? !pausedNow : sent(a.current_enabled) ? a.current_enabled : ap ? ap.enabled : null;
      const nowText =
        runningNow === null ? unknown : runningNow ? t("agent.diff.autom_on") : t("agent.diff.autom_off");
      if (a.control_kind === "quiet_hours") {
        const win = sent(a.current_hours) && a.current_hours.length === 2 ? a.current_hours : null;
        const cur = win
          ? t("agent.diff.quiet_cur").replace("{w}", `${hh(win[0])}${MINUS}${hh(win[1])}`)
          : ap && ap.quiet_start_hour != null && ap.quiet_end_hour != null
            ? t("agent.diff.quiet_cur").replace("{w}", `${hh(ap.quiet_start_hour)}${MINUS}${hh(ap.quiet_end_hour)}`)
            : ap || sent(a.current_hours)
              ? t("agent.diff.quiet_none")
              : unknown;
        return {
          now: [{ text: cur }],
          next: [
            { text: `${hh(a.quiet_start ?? 23)}${MINUS}${hh(a.quiet_end ?? 7)}`, mark: true },
            { text: ` · ${t("adv.act.ctrl_quiet_body")}` },
          ],
        };
      }
      return {
        now: [{ text: nowText }],
        next: [
          {
            text: a.control_kind === "pause" ? t("agent.diff.autom_paused") : t("agent.diff.autom_resumed"),
            mark: true,
          },
          {
            text: ` · ${a.control_kind === "pause" ? t("agent.diff.autom_pause_keeps") : t("agent.diff.autom_resume_note")}`,
          },
        ],
      };
    }
    case "best_time_routine": {
      const now =
        routinesNow === null
          ? unknown
          : routinesNow === 0
            ? t("agent.diff.routine_none")
            : t("agent.diff.routine_n").replace("{n}", fmtInt(routinesNow, locale));
      const blocks = a.blocks.map((b) => (BLOCK_LABEL_KEY[b] ? t(BLOCK_LABEL_KEY[b]) : b)).join(" · ");
      return {
        now: [{ text: now }],
        next: [
          { text: blocks, mark: true },
          { text: ` · ~${hours(a.hours_preview)} · ${a.times_per_day}× ${t("adv.act.per_day")}` },
        ],
      };
    }
    case "topics_list": {
      // The list itself when the backend sends it; otherwise the generic line —
      // this screen never fetches the topic list, so it cannot name it.
      const have = sent(a.current_topics) ? a.current_topics : null;
      return {
        now: [
          {
            text: have === null ? t("agent.diff.topics_now") : have.length === 0 ? t("agent.diff.topics_none") : have.join(" · "),
          },
        ],
        next: [{ text: a.topics.join(" · "), mark: true }],
      };
    }
  }
}

// ── the conversation row ─────────────────────────────────────────────────────
// Phase 1 has NO multi-conversation model: the backend keeps ONE ever-growing
// conversation per account (no conversation ids), so the rail's «Диалоги» panel
// shows exactly one row — the live conversation, titled by its first question
// and marked aria-current. There is no «+ New» and nothing to switch to; an
// earlier build grouped the flat history into pseudo-sittings by time gaps,
// which invented a structure the server does not have.

/** "Today, 14:32" / "9 July" — the conversation row's second line. */
export function sessionStamp(iso: string, locale: string, t: T): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const yst = new Date(now);
  yst.setDate(now.getDate() - 1);
  const isYesterday = d.toDateString() === yst.toDateString();
  const time = d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  if (sameDay) return `${t("appliedChanges.today")}, ${time}`;
  if (isYesterday) return `${t("appliedChanges.yesterday")}, ${time}`;
  return d.toLocaleDateString(locale, { day: "numeric", month: "long" });
}

/** "14:32" — the timestamp in a turn's «АГЕНТ · время» line. */
export function turnTime(iso: string | null, locale: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
}
