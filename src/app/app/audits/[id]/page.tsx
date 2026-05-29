"use client";

// Single-audit detail: shows the LLM's reasoning + week-over-week
// metrics + each proposed_change with per-row approve / reject.
//
// Per-change state lives on the row. Already-decided changes (from
// prior visits) render their final decision read-only with the
// applied/effect badges. Pending changes render approve/reject
// buttons and an optional comment textarea.
//
// "Apply all approved" at the bottom submits the batch — we then
// re-fetch the audit to pick up applied_change + new status.

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  ApiError,
  clearTokens,
  fetchAudit,
  getTokens,
  submitAuditDecisions,
} from "@/lib/api";
import { captureEvent } from "@/lib/analytics";
import type {
  AuditDecisionRow,
  AuditDetail,
  DecisionInput,
  ProposedChange,
} from "@/lib/types";

type DraftDecision = {
  // null = user hasn't chosen yet
  approved: boolean | null;
  comment: string;
};

type Toast = { id: number; message: string; tone: "success" | "error" };

export default function AuditDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const auditId = Number(params.id);

  const [audit, setAudit] = useState<AuditDetail | null>(null);
  const [bootError, setBootError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, DraftDecision>>({});
  const [submitting, setSubmitting] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  function toast(message: string, tone: Toast["tone"] = "success") {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
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
        const a = await fetchAudit(auditId);
        setAudit(a);
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

  if (bootError) {
    return (
      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-950 p-4 text-sm text-red-800 dark:text-red-200">
          {bootError}
        </div>
      </main>
    );
  }

  if (!audit) {
    return (
      <main className="max-w-3xl mx-auto px-6 py-16 text-sm text-zinc-500">
        loading…
      </main>
    );
  }

  // Map change_id → existing decision (from server).
  const decidedByChangeId = new Map<string, AuditDecisionRow>();
  for (const d of audit.decisions) {
    if (d.change_id) decidedByChangeId.set(d.change_id, d);
  }

  function setDraft(changeId: string, partial: Partial<DraftDecision>) {
    setDrafts((s) => {
      const existing = s[changeId] ?? { approved: null, comment: "" };
      return {
        ...s,
        [changeId]: { ...existing, ...partial },
      };
    });
  }

  async function onSubmitAll() {
    const decisions: DecisionInput[] = [];
    for (const change of audit?.proposed_changes ?? []) {
      const draft = drafts[change.id];
      if (!draft || draft.approved === null) continue;
      decisions.push({
        change_id: change.id,
        approved: draft.approved,
        user_comment: draft.comment || undefined,
      });
    }

    if (decisions.length === 0) {
      toast("nothing to submit — pick approve or reject on at least one", "error");
      return;
    }

    setSubmitting(true);
    captureEvent("ui.audit_decisions_submitted", {
      audit_id: auditId,
      count: decisions.length,
      approved: decisions.filter((d) => d.approved).length,
    });

    try {
      const res = await submitAuditDecisions(auditId, decisions);
      const applied = res.results.filter((r) => r.applied).length;
      const rejected = res.results.filter((r) => !r.approved).length;
      toast(
        `submitted ${res.results.length} · ${applied} applied · ${rejected} rejected`,
      );
      // Refetch to show the applied state.
      const fresh = await fetchAudit(auditId);
      setAudit(fresh);
      setDrafts({});
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
      setSubmitting(false);
    }
  }

  const undecidedDraftCount = audit.proposed_changes.filter(
    (c) => !decidedByChangeId.has(c.id) && drafts[c.id]?.approved !== undefined,
  ).length;
  const readyToSubmit = audit.proposed_changes.filter(
    (c) =>
      !decidedByChangeId.has(c.id) &&
      drafts[c.id]?.approved !== null &&
      drafts[c.id]?.approved !== undefined,
  ).length;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <section>
          <h1 className="text-2xl font-semibold tracking-tight">
            Weekly audit · {fmtDate(audit.period_start)} →{" "}
            {fmtDate(audit.period_end)}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            {audit.posts_analyzed} posts analyzed ·{" "}
            {audit.proposed_changes.length} proposed change(s) · status{" "}
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              {audit.status.replace(/_/g, " ")}
            </span>
          </p>
        </section>

        {audit.llm_reasoning && (
          <details className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
            <summary className="cursor-pointer text-sm font-semibold">
              Why the coach proposed these changes
              {audit.llm_model && (
                <span className="ml-2 font-normal text-xs text-zinc-500">
                  · {audit.llm_model}
                </span>
              )}
            </summary>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              {audit.llm_reasoning}
            </p>
          </details>
        )}

        <section className="space-y-3">
          <h2 className="text-base font-semibold">Proposed changes</h2>

          {audit.proposed_changes.length === 0 && (
            <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 p-6 text-center text-sm text-zinc-500">
              The coach didn&apos;t propose any changes for this period.
            </div>
          )}

          {audit.proposed_changes.map((change) => {
            const existing = decidedByChangeId.get(change.id);
            return (
              <ChangeCard
                key={change.id}
                change={change}
                existing={existing}
                draft={drafts[change.id]}
                onDraftChange={(partial) => setDraft(change.id, partial)}
              />
            );
          })}
        </section>

        {/* Submit bar */}
        {audit.proposed_changes.length > 0 && (
          <div className="sticky bottom-4 flex items-center justify-end gap-3 bg-white/95 dark:bg-zinc-950/95 backdrop-blur border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 shadow-md">
            <span className="mr-auto text-xs text-zinc-500">
              {readyToSubmit} of {audit.proposed_changes.length - decidedByChangeId.size}{" "}
              pending change(s) ready to submit
            </span>
            <button
              onClick={onSubmitAll}
              disabled={submitting || readyToSubmit === 0}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-sm font-medium hover:bg-zinc-700 dark:hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting && (
                <span
                  className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"
                  aria-hidden
                />
              )}
              {submitting ? "submitting…" : "submit decisions"}
            </button>
          </div>
        )}
      </main>

      <div className="fixed bottom-6 right-6 z-30 space-y-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium pointer-events-auto ${
              t.tone === "error"
                ? "bg-red-600 text-white"
                : "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}

function ChangeCard({
  change,
  existing,
  draft,
  onDraftChange,
}: {
  change: ProposedChange;
  existing: AuditDecisionRow | undefined;
  draft: DraftDecision | undefined;
  onDraftChange: (partial: Partial<DraftDecision>) => void;
}) {
  const decided = existing !== undefined;
  const localApproved = draft?.approved ?? null;

  return (
    <article
      className={`rounded-xl border bg-white dark:bg-zinc-900 p-5 shadow-sm space-y-3 ${
        decided
          ? "border-zinc-200 dark:border-zinc-800 opacity-90"
          : localApproved === true
            ? "border-green-300 dark:border-green-900/60"
            : localApproved === false
              ? "border-red-300 dark:border-red-900/60"
              : "border-zinc-200 dark:border-zinc-800"
      }`}
    >
      <header className="flex items-baseline justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <KindBadge kind={change.kind} />
          {change.target_section && (
            <span className="text-zinc-600 dark:text-zinc-400 font-mono">
              {change.target_section}
            </span>
          )}
        </div>
        {decided && existing && (
          <DecisionStatus row={existing} />
        )}
      </header>

      <h3 className="text-base font-semibold leading-tight">{change.title}</h3>

      {change.detail && (
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
          {change.detail}
        </p>
      )}

      {change.diff !== undefined && change.diff !== null && (
        <details>
          <summary className="cursor-pointer text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
            View raw diff
          </summary>
          <pre className="mt-2 text-xs font-mono p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md overflow-x-auto whitespace-pre-wrap">
            {JSON.stringify(change.diff, null, 2)}
          </pre>
        </details>
      )}

      {decided && existing ? (
        existing.user_comment && (
          <p className="text-xs text-zinc-500 italic">
            Your note: {existing.user_comment}
          </p>
        )
      ) : (
        <>
          <textarea
            value={draft?.comment ?? ""}
            onChange={(e) => onDraftChange({ comment: e.target.value })}
            placeholder="Optional note about this decision…"
            rows={2}
            className="w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-700"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onDraftChange({ approved: true })}
              className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
                localApproved === true
                  ? "bg-green-600 text-white"
                  : "border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-green-50 dark:hover:bg-green-950/30"
              }`}
            >
              approve
            </button>
            <button
              type="button"
              onClick={() => onDraftChange({ approved: false })}
              className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
                localApproved === false
                  ? "bg-red-600 text-white"
                  : "border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-red-50 dark:hover:bg-red-950/30"
              }`}
            >
              reject
            </button>
            {localApproved !== null && (
              <button
                type="button"
                onClick={() => onDraftChange({ approved: null })}
                className="text-xs px-2 py-1 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
              >
                clear
              </button>
            )}
          </div>
        </>
      )}
    </article>
  );
}

function KindBadge({ kind }: { kind: string }) {
  return (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
      {kind.replace(/_/g, " ")}
    </span>
  );
}

function DecisionStatus({ row }: { row: AuditDecisionRow }) {
  if (row.rolled_back) {
    return (
      <span className="text-xs text-red-700 dark:text-red-400 font-medium">
        rolled back · effect {fmtEffect(row.effect_pct)}
      </span>
    );
  }
  if (!row.approved) {
    return (
      <span className="text-xs text-zinc-500 font-medium">rejected</span>
    );
  }
  if (row.applied_change) {
    return (
      <span className="text-xs text-green-700 dark:text-green-400 font-medium">
        approved · applied
        {row.effect_pct !== null && (
          <span className="ml-2 text-zinc-500 font-normal">
            effect {fmtEffect(row.effect_pct)}
          </span>
        )}
      </span>
    );
  }
  return (
    <span className="text-xs text-green-700 dark:text-green-400 font-medium">
      approved
    </span>
  );
}

function fmtEffect(pct: number | null): string {
  if (pct === null) return "pending";
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}
