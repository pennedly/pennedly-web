"use client";

// Single-audit detail (/app/audits/[id]) — the redesigned «Аудит роста» weekly
// review: verdict header + self-learning loop + «Разбор недели» + proposals
// grouped by the 7 dimensions. Renders the SAME AuditDetailRedesign as the
// ?demo=1 review, fed by the live audit through apiToAuditDetail. Approve/reject
// is append-only (one decision per proposal, no undo).

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { ApiError, clearTokens, fetchAudit, fetchMyAccounts, getTokens, submitAuditDecisions } from "@/lib/api";
import { captureEvent } from "@/lib/analytics";
import { useTranslation } from "@/lib/i18n";
import { AppTopbar, TopbarPill } from "@/components/AppTopbar";
import { Toast, ToastHost } from "@/components/ui/toast";
import { Spinner } from "@/components/ui/feedback";
import { AuditDetailRedesign } from "@/components/studio/AuditDetailRedesign";
import { apiToAuditDetail } from "@/components/studio/audits-map";
import type { AuditDetail } from "@/lib/types";
import { useDemoParam } from "@/lib/query";

type ToastT = { id: number; title: string; description?: string };
type Acct = { name: string; handle: string; initials: string };

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

  const demoParam = useDemoParam();
  const [audit, setAudit] = useState<AuditDetail | null>(null);
  const [acct, setAcct] = useState<Acct | null>(null);
  const [loading, setLoading] = useState(true);
  const [bootError, setBootError] = useState<string | null>(null);
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
        const a = await fetchAudit(auditId);
        setAudit(a);
        // Header (name/handle/initials) is cosmetic — never block the audit on it.
        try {
          const list = await fetchMyAccounts();
          const acc = list.accounts.find((x) => x.id === a.account_id);
          if (acc) {
            const name = acc.display_name ?? acc.username ?? `Account ${acc.id}`;
            const parts = name.trim().split(/\s+/).filter(Boolean);
            const initials = (parts.length >= 2 ? parts[0][0] + parts[1][0] : name.slice(0, 2)).toUpperCase();
            setAcct({ name, handle: acc.username ? `@${acc.username}` : "", initials: initials || "?" });
          }
        } catch {
          /* header is cosmetic */
        }
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

  const decide = useCallback(
    async (changeId: string, approved: boolean) => {
      captureEvent("ui.audit_decision", { audit_id: auditId, change_id: changeId, approved });
      try {
        await submitAuditDecisions(auditId, [{ change_id: changeId, approved }]);
        try {
          setAudit(await fetchAudit(auditId));
        } catch {
          /* keep current */
        }
        if (approved) toast(t("audits.toast_approved_title"), t("audits.toast_approved_sub"));
        else toast(t("audits.toast_rejected_title"), t("audits.toast_rejected_sub"));
      } catch (e) {
        toast(String(e));
      }
    },
    [auditId, t],
  );

  const model = useMemo(
    () => (audit ? apiToAuditDetail(audit, t, (iso) => fmtDate(iso, locale)) : null),
    [audit, t, locale],
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <Spinner size={20} className="text-text-subtle" label={t("a11y.loading")} />
      </div>
    );
  }
  if (bootError || !audit || !model) {
    return (
      <main className="mx-auto max-w-2xl px-3.5 py-16 md:px-6">
        <div className="rounded-lg border border-danger/40 bg-danger/10 p-4 text-small text-danger">{bootError ?? "Not found"}</div>
      </main>
    );
  }

  const pending = model.proposals.filter((p) => p.status === "undecided").length;

  return (
    <div className="min-h-screen bg-bg text-text">
      <AppTopbar
        maxW="720px"
        title={t("audits.title")}
        pill={pending > 0 ? <TopbarPill tone="accent">{pending} {t("audits.to_review")}</TopbarPill> : <TopbarPill tone="success">{t("audits.pill_reviewed")}</TopbarPill>}
      />
      <main className="mx-auto flex max-w-[720px] flex-col gap-4 px-3.5 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-4 md:gap-5 md:px-6 md:pb-24 md:pt-7">
        <AuditDetailRedesign
          model={model}
          initials={acct?.initials ?? "·"}
          name={acct?.name ?? "—"}
          handle={acct?.handle ?? ""}
          onBack={() => router.push("/app/audits")}
          h={{ onApprove: (id) => decide(id, true), onReject: (id) => decide(id, false) }}
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
