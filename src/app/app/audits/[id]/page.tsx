"use client";

// Single-audit detail (/app/audits/[id]) — the coach's weekly review, rebuilt
// 1:1 to Audits-SPEC.html. Narrative + tally + change cards with diff / note /
// autopilot hours / effect chip / approve-reject. Append-only (one decision per
// change, no undo). The note is sent as the decision's user_comment.

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { ApiError, clearTokens, fetchAudit, getTokens, submitAuditDecisions } from "@/lib/api";
import { captureEvent } from "@/lib/analytics";
import { useTranslation } from "@/lib/i18n";
import { AppTopbar, TopbarPill } from "@/components/AppTopbar";
import { Toast, ToastHost } from "@/components/ui/toast";
import { Spinner } from "@/components/ui/feedback";
import { AuditDetailView, type AuditHandlers, type ChangeModel } from "@/components/studio/AuditsParts";
import type { ChangeStatus } from "@/components/studio/audits-demo";
import type { AuditDetail } from "@/lib/types";

type ToastT = { id: number; title: string; description?: string };

function fmtDate(iso: string, locale: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(locale, { month: "short", day: "numeric" });
}

export default function AuditDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const auditId = Number(params.id);
  const { t, locale } = useTranslation();

  const [demoParam] = useState(() => (typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("demo") === "1" : false));
  const [audit, setAudit] = useState<AuditDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [bootError, setBootError] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [toasts, setToasts] = useState<ToastT[]>([]);

  function toast(title: string, description?: string) {
    const id = Date.now() + Math.random();
    setToasts((s) => [...s, { id, title, description }]);
    setTimeout(() => setToasts((s) => s.filter((x) => x.id !== id)), 4200);
  }

  useEffect(() => {
    // Demo lives on the list route's local view; bounce there.
    if (demoParam) {
      router.replace("/app/audits?demo=1");
      return;
    }
    if (!getTokens()) {
      router.push("/app/login");
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
      } finally {
        setLoading(false);
      }
    })();
  }, [auditId, router, demoParam]);

  async function reload() {
    try {
      setAudit(await fetchAudit(auditId));
    } catch {
      /* keep current */
    }
  }

  async function decide(c: ChangeModel, approved: boolean) {
    captureEvent("ui.audit_decision", { audit_id: auditId, change_id: c.id, approved });
    try {
      await submitAuditDecisions(auditId, [{ change_id: c.id, approved, user_comment: notes[c.id] }]);
      await reload();
      if (approved) toast(t("audits.toast_approved_title"), t("audits.toast_approved_sub"));
      else toast(t("audits.toast_rejected_title"), t("audits.toast_rejected_sub"));
    } catch (e) {
      toast(String(e));
    }
  }

  const handlers: AuditHandlers = {
    onApprove: (c) => decide(c, true),
    onReject: (c) => decide(c, false),
    onSaveNote: (c, note) => {
      setNotes((s) => ({ ...s, [c.id]: note ?? "" }));
      toast(note ? t("audits.toast_note_saved") : t("audits.toast_note_removed"));
    },
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <Spinner size={20} className="text-text-subtle" />
      </div>
    );
  }
  if (bootError || !audit) {
    return (
      <main className="mx-auto max-w-2xl px-3.5 py-16 md:px-6">
        <div className="rounded-lg border border-danger/40 bg-danger/10 p-4 text-small text-danger">{bootError ?? "Not found"}</div>
      </main>
    );
  }

  const changes: ChangeModel[] = audit.proposed_changes.map((pc) => {
    const decision = audit.decisions.find((d) => d.change_id === pc.id);
    const status: ChangeStatus = decision ? (decision.approved ? "applied" : "rejected") : "undecided";
    return {
      id: pc.id,
      category: pc.category ?? pc.kind,
      title: pc.title,
      detail: pc.detail ?? "",
      status,
      diff: ((d) => (d && (d.old_text || d.new_text || d.before || d.after) ? { before: d.old_text ?? d.before ?? "", after: d.new_text ?? d.after ?? "" } : null))(
        pc.diff as { old_text?: string; new_text?: string; before?: string; after?: string } | null,
      ),
      hoursUtc: pc.payload?.post_hours ?? null,
      note: notes[pc.id] ?? decision?.user_comment ?? audit.user_comments?.[pc.id] ?? null,
      effectPct: decision?.effect_pct ?? null,
    };
  });
  const narrative = audit.llm_reasoning ? audit.llm_reasoning.split(/\n\n+/).map((p) => p.trim()).filter(Boolean) : [];
  const pending = changes.filter((c) => c.status === "undecided").length;

  return (
    <div className="min-h-screen bg-bg text-text">
      <AppTopbar
        maxW="720px"
        title={t("audits.title")}
        pill={pending > 0 ? <TopbarPill tone="accent">{pending} {t("audits.to_review")}</TopbarPill> : <TopbarPill tone="success">{t("audits.pill_reviewed")}</TopbarPill>}
      />
      <main className="mx-auto flex max-w-[720px] flex-col gap-4 px-3.5 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-4 md:gap-5 md:px-6 md:pb-24 md:pt-7">
        <AuditDetailView
          audit={{ id: audit.id, title: `Week of ${fmtDate(audit.period_end, locale)}`, range: `${fmtDate(audit.period_start, locale)} – ${fmtDate(audit.period_end, locale)}`, postsAnalyzed: audit.posts_analyzed, narrative, changes }}
          onBack={() => router.push("/app/audits")}
          h={handlers}
        />
      </main>

      <ToastHost>
        {toasts.map((to) => (
          <Toast key={to.id} tone="success" title={to.title} description={to.description} className="[animation:toast-in_var(--duration-slow)_var(--ease-entrance)]" />
        ))}
      </ToastHost>
    </div>
  );
}
