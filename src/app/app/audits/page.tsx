"use client";

// Audits list (/app/audits) — every weekly audit the coach produced. Rebuilt
// 1:1 to Audits-SPEC.html (reading-width 720). Each row → the detail route. A
// tester ?demo=1 panel (dark/state) drives the list + an inline detail view on
// mock data (the design uses a local view toggle).

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ApiError, clearTokens, fetchMe, getTokens, listAudits } from "@/lib/api";
import { useSelectedAccountId } from "@/lib/account";
import { useTranslation } from "@/lib/i18n";
import { AppTopbar, TopbarPill } from "@/components/AppTopbar";
import { Toast, ToastHost } from "@/components/ui/toast";
import { TweaksPanel, TweakSection, TweakToggle, TweakRadio, useTweaks } from "@/components/tweaks/TweaksPanel";
import {
  AuditDetailView,
  AuditRow,
  AuditsEmpty,
  AuditsSkeleton,
  type AuditHandlers,
  type AuditRowModel,
  type ChangeModel,
} from "@/components/studio/AuditsParts";
import { AUDIT_TWEAK_DEFAULTS, DEMO_AUDITS, type ChangeStatus, type DemoAudit } from "@/components/studio/audits-demo";
import type { AuditSummary } from "@/lib/types";

const IS_DEV = process.env.NODE_ENV === "development";

type ToastT = { id: number; title: string; description?: string };

function fmtDate(iso: string, locale: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(locale, { month: "short", day: "numeric" });
}

export default function AuditsPage() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const [demoParam] = useState(() => (typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("demo") === "1" : false));
  const [isTester, setIsTester] = useState(false);
  const allow = demoParam && (IS_DEV || isTester);
  const demoOn = allow;
  const accountId = useSelectedAccountId();

  const [audits, setAudits] = useState<AuditSummary[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "detail">("list");
  const [openId, setOpenId] = useState<number | null>(null);
  const [toasts, setToasts] = useState<ToastT[]>([]);

  const [tw, setTw] = useTweaks(AUDIT_TWEAK_DEFAULTS);
  const [demoAudits, setDemoAudits] = useState<DemoAudit[]>(DEMO_AUDITS);

  function toast(title: string, description?: string) {
    const id = Date.now() + Math.random();
    setToasts((s) => [...s, { id, title, description }]);
    setTimeout(() => setToasts((s) => s.filter((x) => x.id !== id)), 4200);
  }

  useEffect(() => {
    if (!getTokens()) return;
    fetchMe().then((m) => setIsTester(m.is_tester === true)).catch(() => {});
  }, []);

  useEffect(() => {
    if (demoParam) return;
    if (!getTokens()) {
      router.push("/app/login");
      return;
    }
    if (accountId === null) return;
    setLoaded(false);
    (async () => {
      try {
        const list = await listAudits({ accountId, limit: 50 });
        setAudits(list.audits);
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          clearTokens();
          router.push("/app/login");
          return;
        }
        setBootError(String(e));
      } finally {
        setLoaded(true);
      }
    })();
  }, [accountId, router, demoParam]);

  useEffect(() => {
    if (!demoOn) return;
    document.documentElement.classList.toggle("dark", !!tw.dark);
  }, [demoOn, tw.dark]);

  const feedState = demoOn ? (tw.state as "Live" | "Loading" | "Empty") : "Live";

  const rows: AuditRowModel[] = demoOn
    ? demoAudits.map((a) => ({
        id: a.id,
        title: a.title,
        range: a.range,
        summary: a.summary,
        postsAnalyzed: a.postsAnalyzed,
        wowDelta: a.wowDelta,
        undecided: a.changes.filter((c) => c.status === "undecided").length,
        total: a.changes.length,
      }))
    : audits.map((a) => ({
        id: a.id,
        title: `Week of ${fmtDate(a.period_end, locale)}`,
        range: `${fmtDate(a.period_start, locale)} – ${fmtDate(a.period_end, locale)}`,
        postsAnalyzed: a.posts_analyzed,
        wowDelta: a.week_over_week_delta_pct,
        undecided: Math.max(0, a.proposed_change_count - a.decided_change_count),
        total: a.proposed_change_count,
      }));

  const reviewCount = rows.reduce((n, r) => n + r.undecided, 0);

  const phase: "loading" | "ready" | "empty" = demoOn
    ? feedState === "Loading"
      ? "loading"
      : feedState === "Empty"
        ? "empty"
        : "ready"
    : !loaded
      ? "loading"
      : rows.length === 0
        ? "empty"
        : "ready";

  function openAudit(id: number) {
    if (demoOn) {
      setOpenId(id);
      setView("detail");
      window.scrollTo({ top: 0 });
    } else {
      router.push(`/app/audits/${id}`);
    }
  }

  // demo detail handlers
  function setDemoChange(auditId: number, changeId: string, patch: Partial<ChangeModel>) {
    setDemoAudits((p) => p.map((a) => (a.id === auditId ? { ...a, changes: a.changes.map((c) => (c.id === changeId ? { ...c, ...patch } : c)) } : a)));
  }
  const openAuditData = demoAudits.find((a) => a.id === openId) ?? null;
  const demoHandlers: AuditHandlers = openAuditData
    ? {
        onApprove: (c) => { setDemoChange(openAuditData.id, c.id, { status: "applied" as ChangeStatus, effectPct: null }); toast(t("audits.toast_approved_title"), t("audits.toast_approved_sub")); },
        onReject: (c) => { setDemoChange(openAuditData.id, c.id, { status: "rejected" as ChangeStatus }); toast(t("audits.toast_rejected_title"), t("audits.toast_rejected_sub")); },
        onSaveNote: (c, note) => { setDemoChange(openAuditData.id, c.id, { note }); toast(note ? t("audits.toast_note_saved") : t("audits.toast_note_removed")); },
      }
    : { onApprove: () => {}, onReject: () => {}, onSaveNote: () => {} };

  const pill =
    reviewCount > 0 ? (
      <TopbarPill tone="accent">{reviewCount} {t("audits.to_review")}</TopbarPill>
    ) : (
      <TopbarPill tone="success">{t("audits.pill_reviewed")}</TopbarPill>
    );

  if (bootError) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <div className="rounded-lg border border-danger/40 bg-danger/10 p-4 text-small text-danger">{bootError}</div>
      </main>
    );
  }

  const showDetail = demoOn && view === "detail" && openAuditData;

  return (
    <div className="min-h-screen bg-bg text-text">
      <AppTopbar maxW="720px" title={t("audits.title")} pill={pill} />
      <main className="mx-auto flex max-w-[720px] flex-col gap-5 px-5 pb-24 pt-7 md:px-6">
        {showDetail ? (
          <AuditDetailView
            audit={{ id: openAuditData.id, title: openAuditData.title, range: openAuditData.range, postsAnalyzed: openAuditData.postsAnalyzed, narrative: openAuditData.narrative, changes: openAuditData.changes }}
            onBack={() => setView("list")}
            h={demoHandlers}
          />
        ) : (
          <>
            <div className="flex flex-col gap-1">
              <h1 className="text-h1 font-semibold tracking-[-0.015em]">{t("audits.title")}</h1>
              <p className="max-w-[64ch] text-body text-text-muted">{t("audits.list_sub")}</p>
            </div>
            {phase === "loading" ? (
              <AuditsSkeleton />
            ) : phase === "empty" ? (
              <AuditsEmpty />
            ) : (
              <div className="flex flex-col gap-3">
                {rows.map((r) => (
                  <AuditRow key={r.id} audit={r} onOpen={openAudit} />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <ToastHost>
        {toasts.map((to) => (
          <Toast key={to.id} tone="success" title={to.title} description={to.description} className="[animation:toast-in_var(--duration-slow)_var(--ease-entrance)]" />
        ))}
      </ToastHost>

      {allow && (
        <TweaksPanel title="Audits">
          <TweakSection label="Appearance" />
          <TweakToggle label="Dark mode" value={tw.dark} onChange={(v) => setTw("dark", v)} />
          <TweakSection label="State" />
          <TweakRadio label="State" value={tw.state} options={["Live", "Loading", "Empty"]} onChange={(v) => setTw("state", v)} />
        </TweaksPanel>
      )}
    </div>
  );
}
