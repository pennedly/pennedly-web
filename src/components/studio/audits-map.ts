// Maps the audit API shapes into the redesigned «Аудит роста» view models, so
// the live detail/list render through the SAME components as the ?demo=1 review.
// The backend passes the LLM-shaped proposals + the narrative layer
// (metrics_summary.verdict/wins/losses/caveat) + the loop through raw; this turns
// them into AuditDetailModel — deriving each proposal's display shape (diff →
// before/after, hours → local-time chips, action → icon + kind label) and its
// status/effect from the decision history.

import type { MessageKey } from "@/lib/i18n";
import { utcHourToLocal } from "@/lib/timezone";
import type { AuditDecisionRow, AuditDetail, ProposedChange } from "@/lib/types";

import type {
  AuditDetailModel,
  AuditDim,
  AuditLoop,
  AuditProposal,
  AuditVerdict,
  ProposalConf,
  ProposalShape,
  ProposalStatus,
  WinLoss,
} from "./audits-redesign";

type T = (k: MessageKey) => string;

const DIMS = new Set<AuditDim>([
  "topics", "scenarios", "timing", "voice", "rules", "replies", "format",
]);

function obj(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
}
function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}
function asDim(d?: string): AuditDim {
  return DIMS.has(d as AuditDim) ? (d as AuditDim) : "format";
}
function asConf(c?: string): ProposalConf {
  return c === "high" ? "high" : c === "low" ? "low" : "med";
}
function fmtPct(n: number): string {
  return `${n >= 0 ? "+" : ""}${Number.isInteger(n) ? n : n.toFixed(1)}%`;
}
// UTC schedule hour → the user's local "HH:00" (autopilot hours are stored UTC).
function fmtHourUtc(h: number): string {
  const lh = ((utcHourToLocal(h) % 24) + 24) % 24;
  return `${String(lh).padStart(2, "0")}:00`;
}

function shapeOf(pc: ProposedChange): ProposalShape {
  if (pc.shape === "diff" || pc.shape === "hours" || pc.shape === "action") return pc.shape;
  if (pc.kind === "autopilot_config") return "hours";
  if (pc.kind === "user_rule_add" || pc.kind === "scenario_toggle" || pc.kind === "scenario_set_limit") return "action";
  return "diff";
}

function actionIco(pc: ProposedChange): string {
  if (pc.kind === "scenario_toggle") return pc.payload?.enabled === false ? "powerOff" : "power";
  if (pc.kind === "scenario_set_limit") return "sliders";
  if (pc.kind === "user_rule_add") return "plus";
  return "spark";
}
function actionKind(pc: ProposedChange, t: T): string {
  if (pc.kind === "scenario_toggle") {
    return t(pc.payload?.enabled === false ? "audit.action.scenario_off" : "audit.action.scenario_on");
  }
  if (pc.kind === "scenario_set_limit") return t("audit.action.scenario_limit");
  if (pc.kind === "user_rule_add") return t("audit.action.rule_add");
  return "";
}

function mapProposal(pc: ProposedChange, decision: AuditDecisionRow | undefined, t: T): AuditProposal {
  const shape = shapeOf(pc);
  const status: ProposalStatus = decision ? (decision.approved ? "applied" : "rejected") : "undecided";
  const p: AuditProposal = {
    id: pc.id,
    dim: asDim(pc.dim),
    high: pc.high,
    shape,
    title: pc.title,
    evidence: pc.evidence ?? pc.detail ?? "",
    expect: { dir: pc.expect_dir === "up" ? "up" : "flat", label: pc.expect_label ?? "" },
    conf: asConf(pc.confidence),
    status,
  };
  if (status === "applied") {
    p.effect = decision?.effect_pct != null ? fmtPct(decision.effect_pct) : null;
    p.effectLabel = t("audits.effect_engagement");
  }
  if (shape === "diff") {
    p.diff = { before: pc.diff?.old_text ?? "", after: pc.diff?.new_text ?? "" };
  } else if (shape === "hours") {
    p.hours = (pc.payload?.post_hours ?? []).map((h) => ({ t: fmtHourUtc(h), peak: true }));
    if (pc.action_label) p.hoursNote = pc.action_label;
  } else {
    p.action = {
      ico: actionIco(pc),
      kind: actionKind(pc, t),
      label: pc.action_label ?? pc.title,
      off: pc.kind === "scenario_toggle" && pc.payload?.enabled === false,
    };
  }
  return p;
}

function winLoss(v: unknown): WinLoss[] {
  if (!Array.isArray(v)) return [];
  return v.map((w) => {
    const o = obj(w);
    return { text: str(o.text), num: str(o.num), unit: str(o.unit), mult: str(o.mult) };
  });
}

// `fmtDate` is the page's locale-bound date formatter (iso → "23 Jun").
export function apiToAuditDetail(detail: AuditDetail, t: T, fmtDate: (iso: string) => string): AuditDetailModel {
  const ms = obj(detail.metrics_summary);
  const v = obj(ms.verdict);
  const sig = v.signal;
  const verdict: AuditVerdict = {
    period: `${fmtDate(detail.period_start)} – ${fmtDate(detail.period_end)}`,
    verdict: str(v.verdict) || (detail.llm_reasoning ?? ""),
    signal: sig === "up" || sig === "down" ? sig : "flat",
    signalLabel: str(v.signal_label),
    conf: asConf(typeof v.confidence === "string" ? v.confidence : undefined),
    posts: detail.posts_analyzed,
  };
  const loop: AuditLoop | null =
    detail.loop && detail.loop.up_pct != null
      ? {
          up: fmtPct(detail.loop.up_pct),
          metric: t("audit.loop.metric"),
          window: t("audit.loop.window"),
          rolled: detail.loop.rolled,
        }
      : null;
  const byChange = new Map(detail.decisions.map((d) => [d.change_id, d]));
  return {
    verdict,
    loop,
    wins: winLoss(ms.wins),
    losses: winLoss(ms.losses),
    caveat: str(ms.caveat) || null,
    proposals: detail.proposed_changes.map((pc) => mapProposal(pc, byChange.get(pc.id), t)),
  };
}
