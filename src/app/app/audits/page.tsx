"use client";

// Audit list — every weekly audit the coach loop produced for the account.
// Each row → the detail page where the user approves/rejects proposed changes.
// Layout per design-export/PennedlyDesign/audits-* (list view): an audit-row
// with a coach-style date title, a meta line (suggestions / to-review /
// applied) and a Needs-review / Reviewed badge; rows with pending changes get
// an accent left-bar.

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ApiError, clearTokens, getTokens, listAudits } from "@/lib/api";
import { useSelectedAccountId } from "@/lib/account";
import { useTranslation, useLocale } from "@/lib/i18n";
import { AppTopbar, TopbarPill } from "@/components/AppTopbar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/feedback";
import { cn } from "@/lib/cn";
import { IcAudit, IcChevDown } from "@/components/icons";
import type { AuditSummary } from "@/lib/types";

function fmtDate(iso: string, locale: string): string {
  const loc = locale === "ru" ? "ru-RU" : locale === "en" ? "en-US" : locale;
  try {
    return new Date(iso).toLocaleDateString(loc, { month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

export default function AuditsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const locale = useLocale();
  const accountId = useSelectedAccountId();
  const [audits, setAudits] = useState<AuditSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [bootError, setBootError] = useState<string | null>(null);

  useEffect(() => {
    if (!getTokens()) router.push("/app/login");
  }, [router]);

  useEffect(() => {
    if (accountId === null) return;
    setLoading(true);
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
        setLoading(false);
      }
    })();
  }, [accountId, router]);

  const toReview = (a: AuditSummary) =>
    Math.max(0, a.proposed_change_count - a.decided_change_count);
  const totalToReview = audits.reduce((n, a) => n + toReview(a), 0);

  return (
    <div className="min-h-screen bg-bg text-text">
      <AppTopbar
        title={t("audits.title")}
        pill={
          totalToReview > 0 ? (
            <TopbarPill tone="accent">
              {totalToReview} {t("audits.to_review")}
            </TopbarPill>
          ) : undefined
        }
      />
      <main className="mx-auto max-w-[760px] space-y-4 px-5 py-7 md:px-6">
        <p className="max-w-[64ch] text-small text-text-muted">{t("audits.subtitle")}</p>

        {bootError && (
          <div className="rounded-lg border border-danger/40 bg-danger/10 p-4 text-small text-danger">
            {bootError}
          </div>
        )}

        {loading && !bootError && (
          <ul className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <li key={i} className="rounded-lg border border-border bg-surface p-5 shadow-sm">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="mt-2.5 h-3 w-3/4" />
                <Skeleton className="mt-3 h-2.5 w-52" />
              </li>
            ))}
          </ul>
        )}

        {!loading && !bootError && audits.length === 0 && (
          <div className="flex flex-col items-center rounded-lg border border-dashed border-border px-7 py-16 text-center">
            <span className="mb-4 grid h-[54px] w-[54px] place-items-center rounded-lg border border-border bg-surface-2 text-text-subtle">
              <IcAudit size={26} />
            </span>
            <p className="text-h2 font-semibold tracking-tight">{t("audits.empty_title")}</p>
            <p className="mt-2 max-w-[46ch] text-body leading-relaxed text-text-muted">
              {t("audits.empty")}
            </p>
          </div>
        )}

        <ul className="space-y-3">
          {audits.map((a) => {
            const pending = toReview(a);
            const isNew = pending > 0;
            return (
              <li key={a.id}>
                <Link
                  href={`/app/audits/${a.id}`}
                  className={cn(
                    "flex items-center gap-4 rounded-lg border bg-surface p-5 shadow-sm transition-colors hover:border-text/15",
                    isNew ? "border-l-[3px] border-l-accent border-accent/30" : "border-border",
                  )}
                  style={{ animation: "card-in 240ms var(--ease-entrance) both" }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-h3 font-semibold tracking-tight">
                      {fmtDate(a.period_start, locale)} – {fmtDate(a.period_end, locale)}
                    </div>
                    <div className="mt-2.5 flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-caption text-text-subtle">
                      <span className="inline-flex items-center gap-1.5">
                        <IcAudit size={13} />
                        {a.proposed_change_count} {t("audits.suggestions_word")}
                      </span>
                      {pending > 0 ? (
                        <span className="inline-flex items-center gap-1.5 text-accent">
                          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                          {pending} {t("audits.to_review")}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-success" />
                          {t("audits.all_reviewed")}
                        </span>
                      )}
                      <span>
                        {a.posts_analyzed} {t("audits.posts_analyzed")}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3.5">
                    {a.week_over_week_delta_pct !== null && (
                      <span
                        className={cn(
                          "text-caption font-semibold tabular-nums",
                          a.week_over_week_delta_pct >= 0 ? "text-success" : "text-danger",
                        )}
                      >
                        {a.week_over_week_delta_pct >= 0 ? "▲" : "▼"}{" "}
                        {Math.abs(a.week_over_week_delta_pct).toFixed(1)}% {t("audits.delta_wow")}
                      </span>
                    )}
                    <Badge tone={isNew ? "accent" : "neutral"} dot={isNew}>
                      {isNew ? t("audits.cstatus_needs") : t("audits.reviewed")}
                    </Badge>
                    <IcChevDown
                      size={18}
                      className="text-text-subtle"
                      style={{ transform: "rotate(-90deg)" }}
                    />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </main>
    </div>
  );
}
