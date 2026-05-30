"use client";

// Audit list — shows every weekly audit the coach loop has produced
// for the user's accounts, with a status pill (pending / partial /
// fully / rejected), counts, and the week-over-week engagement delta.
//
// Each row links to the detail page where the user can approve or
// reject the LLM's proposed changes one by one.

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ApiError, clearTokens, getTokens, listAudits } from "@/lib/api";
import { useSelectedAccountId } from "@/lib/account";
import { useTranslation } from "@/lib/i18n";
import type { AuditSummary } from "@/lib/types";

export default function AuditsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const accountId = useSelectedAccountId();
  const [audits, setAudits] = useState<AuditSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [bootError, setBootError] = useState<string | null>(null);

  useEffect(() => {
    if (!getTokens()) {
      router.push("/app/login");
      return;
    }
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

  if (bootError) {
    return (
      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-950 p-4 text-sm text-red-800 dark:text-red-200">
          {bootError}
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-text">
      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("audits.title")}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">{t("audits.subtitle")}</p>
        </div>

        {loading && <p className="text-sm text-zinc-500">{t("common.loading")}</p>}

        {!loading && audits.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <p className="text-sm text-zinc-500">{t("audits.empty")}</p>
          </div>
        )}

        <ul className="space-y-3">
          {audits.map((a) => (
            <li key={a.id}>
              <Link
                href={`/app/audits/${a.id}`}
                className="block rounded-xl border border-border bg-surface p-4 shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-baseline justify-between gap-3 mb-2 flex-wrap">
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <StatusBadge status={a.status} />
                    <span>#{a.id}</span>
                    <span className="text-zinc-400">·</span>
                    <span>
                      {fmtDate(a.period_start)} → {fmtDate(a.period_end)}
                    </span>
                  </div>
                  {a.week_over_week_delta_pct !== null && (
                    <DeltaBadge pct={a.week_over_week_delta_pct} />
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-text flex-wrap">
                  <span>
                    <span className="font-medium">{a.posts_analyzed}</span>{" "}
                    {t("audits.posts_analyzed")}
                  </span>
                  <span className="text-zinc-400">·</span>
                  <span>
                    <span className="font-medium">
                      {a.decided_change_count}
                    </span>
                    /{a.proposed_change_count} {t("audits.decided_of_total")}
                  </span>
                  {a.proposed_change_count > a.decided_change_count && (
                    <span className="text-amber-600 dark:text-amber-400 text-xs font-medium">
                      → {a.proposed_change_count - a.decided_change_count}{" "}
                      {t("audits.pending_review")}
                    </span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    partial_approved:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    fully_approved:
      "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    rejected:
      "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
  };
  const cls = map[status] ?? map["pending"];
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide ${cls}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

function DeltaBadge({ pct }: { pct: number }) {
  const up = pct >= 0;
  return (
    <span
      className={`text-xs font-medium tabular-nums ${
        up
          ? "text-green-700 dark:text-green-400"
          : "text-red-700 dark:text-red-400"
      }`}
    >
      {up ? "▲" : "▼"} {Math.abs(pct).toFixed(1)}% wow
    </span>
  );
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
