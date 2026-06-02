"use client";

// Single-audit detail — the coach's weekly review: a narrative, the
// week-over-week stat dots, and each proposed change with an in-card
// approve / reject (decided immediately, one decision per change). Layout per
// design-export/PennedlyDesign/audits-* (detail + change card).
//
// Backend reality (api/audits.py): decisions are APPEND-ONLY — one decision
// per change_id, no un-decide. So a decided change renders read-only (status +
// any measured effect); the design's user-facing "roll back" / "reconsider"
// aren't offered (auto-rollback is the effect-tracker's job). The optional
// note is sent as the decision's user_comment.

import { useEffect, useState, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  ApiError,
  clearTokens,
  fetchAudit,
  getTokens,
  submitAuditDecisions,
} from "@/lib/api";
import { captureEvent } from "@/lib/analytics";
import { useTranslation, useLocale, type MessageKey } from "@/lib/i18n";
import { localUtcOffsetLabel, utcHourToLocal } from "@/lib/timezone";
import { AppTopbar } from "@/components/AppTopbar";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Toast, ToastHost } from "@/components/ui/toast";
import {
  BrandMark,
  IcArrowDown,
  IcArrowLeft,
  IcArrowUp,
  IcAudit,
  IcCheck,
  IcClock,
  IcPencil,
  IcX,
} from "@/components/icons";
import { cn } from "@/lib/cn";
import type { AuditDecisionRow, AuditDetail, ProposedChange } from "@/lib/types";

type Toast = { id: number; message: string; tone: "success" | "error" };
type ChangeState = "undecided" | "applied" | "rejected" | "rolledback";

const KIND_LABEL_KEY: Record<string, MessageKey> = {
  prompt_edit: "audits.kind.prompt_edit",
  role_book_edit: "audits.kind.prompt_edit",
  post_prompt_edit: "audits.kind.prompt_edit",
  autopilot_config: "audits.kind.autopilot_config",
};

// Q75: the coach's editorial category badge. Unknown values render verbatim.
const CATEGORY_LABEL_KEY: Record<string, MessageKey> = {
  Voice: "audits.cat.voice",
  Cadence: "audits.cat.cadence",
  Topic: "audits.cat.topic",
  Format: "audits.cat.format",
};

function fmtDate(iso: string, locale: string): string {
  const loc = locale === "ru" ? "ru-RU" : locale === "en" ? "en-US" : locale;
  try {
    return new Date(iso).toLocaleDateString(loc, { month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

function changeState(d: AuditDecisionRow | undefined): ChangeState {
  if (!d) return "undecided";
  if (!d.approved) return "rejected";
  if (d.rolled_back) return "rolledback";
  return "applied";
}

// Q51: a real prompt diff carries old_text/new_text (not before/after).
function hasDiff(
  diff: ProposedChange["diff"],
): diff is { old_text?: string; new_text?: string } {
  return (
    typeof diff === "object" &&
    diff !== null &&
    ("old_text" in diff || "new_text" in diff)
  );
}

export default function AuditDetailPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const locale = useLocale();
  const params = useParams<{ id: string }>();
  const auditId = Number(params.id);

  const [audit, setAudit] = useState<AuditDetail | null>(null);
  const [bootError, setBootError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [openNote, setOpenNote] = useState<Set<string>>(new Set());
  const [openDiff, setOpenDiff] = useState<Set<string>>(new Set());
  const [toasts, setToasts] = useState<Toast[]>([]);

  function toast(message: string, tone: Toast["tone"] = "success") {
    const id = Date.now() + Math.random();
    setToasts((s) => [...s, { id, message, tone }]);
    setTimeout(() => setToasts((s) => s.filter((x) => x.id !== id)), 3500);
  }

  useEffect(() => {
    if (!getTokens()) {
      router.push("/app/login");
      return;
    }
    if (Number.isNaN(auditId)) {
      setBootError("Invalid audit id");
      return;
    }
    (async () => {
      try {
        setAudit(await fetchAudit(auditId));
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          clearTokens();
          router.push("/app/login");
          return;
        }
        setBootError(String(e));
      }
    })();
  }, [auditId, router]);

  async function onDecide(change: ProposedChange, approved: boolean) {
    setBusyId(change.id);
    const note = notes[change.id]?.trim() || undefined;
    captureEvent("ui.audit_decision", { audit_id: auditId, approved });
    try {
      await submitAuditDecisions(auditId, [
        { change_id: change.id, approved, user_comment: note },
      ]);
      toast(approved ? t("audits.toast_approved") : t("audits.toast_rejected"));
      setAudit(await fetchAudit(auditId));
    } catch (e) {
      let msg = String(e);
      if (e instanceof ApiError) {
        const detail =
          typeof e.detail === "object" &&
          e.detail !== null &&
          "detail" in (e.detail as Record<string, unknown>)
            ? (e.detail as { detail: unknown }).detail
            : e.detail;
        msg = `${e.status}: ${String(detail)}`;
      }
      toast(msg, "error");
    } finally {
      setBusyId(null);
    }
  }

  if (bootError) {
    return (
      <div className="min-h-screen bg-bg text-text">
        <AppTopbar title={t("audits.title")} />
        <main className="mx-auto max-w-[760px] px-5 py-7 md:px-6">
          <div className="rounded-lg border border-danger/40 bg-danger/10 p-4 text-small text-danger">
            {bootError}
          </div>
        </main>
      </div>
    );
  }

  if (!audit) {
    return (
      <div className="min-h-screen bg-bg text-text">
        <AppTopbar title={t("audits.title")} />
        <main className="mx-auto max-w-[760px] px-5 py-7 text-small text-text-muted md:px-6">
          {t("common.loading")}
        </main>
      </div>
    );
  }

  const decidedByChangeId = new Map<string, AuditDecisionRow>();
  for (const d of audit.decisions) if (d.change_id) decidedByChangeId.set(d.change_id, d);

  const total = audit.proposed_changes.length;
  let applied = 0;
  let rejected = 0;
  let rolledback = 0;
  for (const d of audit.decisions) {
    const s = changeState(d);
    if (s === "applied") applied++;
    else if (s === "rejected") rejected++;
    else if (s === "rolledback") rolledback++;
  }
  const pending = total - audit.decisions.length;
  const range = `${fmtDate(audit.period_start, locale)} – ${fmtDate(audit.period_end, locale)}`;

  const statDots = [
    { n: total, label: t("audits.suggestions_word"), color: "var(--color-text-subtle)" },
    { n: applied, label: t("audits.detail.applied"), color: "var(--color-success)" },
    { n: rejected, label: t("audits.detail.rejected_label"), color: "var(--color-danger)" },
    { n: rolledback, label: t("audits.detail.rolled_back"), color: "var(--color-text-muted)" },
    { n: pending, label: t("audits.status.pending"), color: "var(--color-accent)" },
  ].filter((s, i) => i === 0 || s.n > 0);

  const narrative = (audit.llm_reasoning ?? "")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-bg text-text">
      <AppTopbar title={t("audits.title")} />
      <main className="mx-auto max-w-[760px] space-y-4 px-5 py-7 md:px-6">
        <button
          onClick={() => router.push("/app/audits")}
          className="inline-flex items-center gap-1.5 self-start text-small font-medium text-text-muted transition-colors hover:text-text"
        >
          <IcArrowLeft size={16} />
          {t("audits.all_audits")}
        </button>

        {/* head */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-h1 font-semibold tracking-tight">
              {t("audits.detail.title")}
            </h1>
            <p className="mt-1 text-small text-text-subtle">
              {range} · {audit.posts_analyzed} {t("audits.posts_analyzed")}
            </p>
          </div>
          <Badge tone={pending > 0 ? "accent" : "neutral"} dot={pending > 0}>
            {pending > 0 ? `${pending} ${t("audits.to_review")}` : t("audits.reviewed")}
          </Badge>
        </div>

        {/* stat dots */}
        <div className="flex flex-wrap items-center gap-x-[18px] gap-y-2">
          {statDots.map((s) => (
            <span key={s.label} className="inline-flex items-center gap-1.5 text-small text-text-muted">
              <span className="h-[7px] w-[7px] rounded-full" style={{ background: s.color }} />
              <b className="font-semibold tabular-nums text-text">{s.n}</b> {s.label}
            </span>
          ))}
        </div>

        {/* coach narrative */}
        {narrative.length > 0 && (
          <div className="rounded-xl border border-border bg-surface-2 p-5">
            <div className="mb-3.5 flex items-center gap-2.5">
              <BrandMark size={34} className="rounded-md shadow-sm" />
              <div>
                <div className="text-small font-semibold">{t("audits.coach_name")}</div>
                <div className="text-caption text-text-subtle">
                  {t("audits.coach_role")} · {range}
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {narrative.map((p, i) => (
                <p key={i} className="text-body leading-relaxed text-text">
                  {p}
                </p>
              ))}
            </div>
          </div>
        )}

        <div className="pt-1 text-caption font-semibold uppercase tracking-wide text-text-subtle">
          {t("audits.detail.proposed_changes")}
        </div>

        {total === 0 && (
          <div className="rounded-lg border border-dashed border-border p-6 text-center text-small text-text-muted">
            {t("audits.detail.no_changes")}
          </div>
        )}

        <div className="space-y-3.5">
          {audit.proposed_changes.map((change) => {
            const decision = decidedByChangeId.get(change.id);
            const state = changeState(decision);
            const busy = busyId === change.id;
            const noteShown = openNote.has(change.id);
            const diffShown = openDiff.has(change.id);
            const hours =
              change.kind === "autopilot_config" && Array.isArray(change.payload?.post_hours)
                ? change.payload!.post_hours!
                : null;
            const kindKey = KIND_LABEL_KEY[change.kind];
            const catKey = change.category
              ? CATEGORY_LABEL_KEY[change.category]
              : undefined;
            const badgeLabel = change.category
              ? catKey
                ? t(catKey)
                : change.category
              : kindKey
                ? t(kindKey)
                : change.kind.replace(/_/g, " ");

            return (
              <article
                key={change.id}
                className={cn(
                  "rounded-lg border border-border bg-surface p-4 shadow-sm transition-colors hover:border-text/12",
                  state === "rejected" && "opacity-[0.72]",
                )}
                style={{ animation: "card-in 240ms var(--ease-entrance) both" }}
              >
                {/* head */}
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex shrink-0 items-center rounded-full border border-border bg-surface-2 px-2.5 py-0.5 text-caption font-semibold text-text-muted">
                    {badgeLabel}
                  </span>
                  <h3 className="min-w-0 flex-1 text-h3 font-semibold leading-snug tracking-tight">
                    {change.title}
                  </h3>
                  <ChangeStatusBadge state={state} t={t} />
                </div>

                {change.detail && (
                  <p className="mt-2.5 whitespace-pre-wrap text-body leading-relaxed text-text-muted">
                    {change.detail}
                  </p>
                )}

                {hours && hours.length > 0 && (
                  <p className="mt-2.5 inline-flex items-center gap-1.5 font-mono text-small text-text">
                    <IcClock size={14} className="text-text-subtle" />
                    {hours.map((h) => `${String(utcHourToLocal(h)).padStart(2, "0")}:00`).join(" · ")}{" "}
                    ({localUtcOffsetLabel()})
                  </p>
                )}

                {/* extra: view change / add note */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {hasDiff(change.diff) && (
                    <button
                      onClick={() =>
                        setOpenDiff((s) => {
                          const n = new Set(s);
                          n.has(change.id) ? n.delete(change.id) : n.add(change.id);
                          return n;
                        })
                      }
                      className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-caption font-medium text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
                    >
                      <IcAudit size={13} />
                      {diffShown ? t("audits.hide_change") : t("audits.view_change")}
                    </button>
                  )}
                  {state === "undecided" && !noteShown && !notes[change.id] && (
                    <button
                      onClick={() => setOpenNote((s) => new Set(s).add(change.id))}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-caption font-medium text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
                    >
                      <IcPencil size={13} />
                      {t("audits.add_note")}
                    </button>
                  )}
                </div>

                {/* diff */}
                {diffShown && hasDiff(change.diff) && (
                  <div className="mt-3 overflow-hidden rounded-md border border-border font-mono text-caption leading-relaxed">
                    {change.diff.old_text && (
                      <div className="flex gap-2 whitespace-pre-wrap break-words bg-danger/[0.09] px-3 py-1.5 text-danger">
                        <span className="shrink-0 opacity-70">−</span>
                        <span>{change.diff.old_text}</span>
                      </div>
                    )}
                    {change.diff.new_text && (
                      <div className="flex gap-2 whitespace-pre-wrap break-words bg-success/10 px-3 py-1.5 text-success">
                        <span className="shrink-0 opacity-70">+</span>
                        <span>{change.diff.new_text}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* note: editing (undecided) or saved (decided) */}
                {state === "undecided" && (noteShown || notes[change.id]) && (
                  <textarea
                    value={notes[change.id] ?? ""}
                    autoFocus={noteShown}
                    onChange={(e) =>
                      setNotes((s) => ({ ...s, [change.id]: e.target.value }))
                    }
                    placeholder={t("audits.detail.note_placeholder")}
                    rows={2}
                    className="mt-3 w-full resize-y rounded-md border border-accent bg-surface px-3 py-2 text-small leading-relaxed text-text shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-accent)_16%,transparent)] outline-none"
                  />
                )}
                {decision?.user_comment && (
                  <div className="mt-3 flex items-start gap-2 rounded-md border border-border bg-surface-2 px-3 py-2.5 text-small leading-relaxed text-text-muted">
                    <IcPencil size={14} className="mt-0.5 shrink-0 text-text-subtle" />
                    <div className="flex-1">{decision.user_comment}</div>
                  </div>
                )}

                {/* footer: meta + actions */}
                <div className="mt-3.5 flex items-center gap-3 border-t border-border pt-3.5">
                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3 text-caption text-text-subtle">
                    {state === "undecided" && <span>{t("audits.awaiting")}</span>}
                    {state === "rejected" && <span>{t("audits.you_rejected")}</span>}
                    {(state === "applied" || state === "rolledback") && decision && (
                      <EffectChip
                        rolledBack={state === "rolledback"}
                        effectPct={decision.effect_pct}
                        t={t}
                      />
                    )}
                  </div>
                  {state === "undecided" && (
                    <div className="flex shrink-0 items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDecide(change, false)}
                        disabled={busy}
                        icon={<IcX size={15} />}
                      >
                        {t("audits.detail.reject")}
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => onDecide(change, true)}
                        loading={busy}
                        disabled={busy}
                        icon={<IcCheck size={15} />}
                      >
                        {t("audits.detail.approve")}
                      </Button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </main>

      <ToastHost>
        {toasts.map((tt) => (
          <Toast key={tt.id} tone={tt.tone} title={tt.message} />
        ))}
      </ToastHost>
    </div>
  );
}

function ChangeStatusBadge({
  state,
  t,
}: {
  state: ChangeState;
  t: (k: MessageKey) => string;
}) {
  const map: Record<ChangeState, { tone: BadgeTone; key: MessageKey; dot: boolean }> = {
    undecided: { tone: "accent", key: "audits.cstatus_needs", dot: true },
    applied: { tone: "good", key: "audits.cstatus_applied", dot: true },
    rejected: { tone: "neutral", key: "audits.cstatus_rejected", dot: false },
    rolledback: { tone: "bad", key: "audits.cstatus_rolledback", dot: true },
  };
  const m = map[state];
  return (
    <Badge tone={m.tone} dot={m.dot}>
      {t(m.key)}
    </Badge>
  );
}

function EffectChip({
  rolledBack,
  effectPct,
  t,
}: {
  rolledBack: boolean;
  effectPct: number | null;
  t: (k: MessageKey) => string;
}) {
  if (effectPct === null && !rolledBack) {
    return (
      <span className="inline-flex items-center gap-1 text-small font-medium text-text-subtle">
        <IcClock size={13} />
        {t("audits.measuring")}
      </span>
    );
  }
  const down = (effectPct ?? 0) < 0 || rolledBack;
  const label = `${effectPct !== null ? `${effectPct >= 0 ? "+" : ""}${effectPct.toFixed(1)}%` : ""} ${t("audits.effect_engagement")}`;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-small font-semibold tabular-nums",
        down ? "text-danger" : "text-success",
      )}
    >
      {down ? <IcArrowDown size={13} /> : <IcArrowUp size={13} />}
      {label.trim()}
      {rolledBack && ` · ${t("audits.detail.rolled_back")}`}
    </span>
  );
}
