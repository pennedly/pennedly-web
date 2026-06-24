"use client";

// Scenario Activity (/app/scenarios/[id]/activity) — what a scenario actually
// DID: its published posts (metrics + the Threads permalink), newest first. A
// reply scenario («Дежурство») answers in comment threads instead of posting, so
// it points the user at the Replies screen. Reached from the card's «Активность».

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import { ApiError, clearTokens, fetchScenarioActivity, getTokens } from "@/lib/api";
import { useTranslation } from "@/lib/i18n";
import { AppTopbar } from "@/components/AppTopbar";
import { Spinner } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { IcArrowLeft, IcBubble, IcExternal, IcEye, IcHeart, IcReplies } from "@/components/icons";
import type { ScenarioActivity } from "@/lib/types";

function fmtN(n: number, locale: string): string {
  return n.toLocaleString(locale);
}
function fmtWhen(iso: string | null, locale: string): string {
  if (!iso) return "";
  const loc = locale === "ru" ? "ru-RU" : locale === "en" ? "en-US" : locale;
  return new Date(iso).toLocaleString(loc, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function ScenarioActivityPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const scenarioId = Number(params.id);
  const { t, locale } = useTranslation();

  const [data, setData] = useState<ScenarioActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getTokens()) {
      router.push("/app/login");
      return;
    }
    let alive = true;
    (async () => {
      try {
        const a = await fetchScenarioActivity(scenarioId);
        if (alive) setData(a);
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          clearTokens();
          router.push("/app/login");
          return;
        }
        if (alive) setError(String(e));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [scenarioId, router]);

  return (
    <div className="min-h-screen bg-bg text-text">
      <AppTopbar maxW="760px" title={t("scenarios.activity.title")} />
      <main className="mx-auto max-w-[760px] space-y-4 px-3.5 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-4 md:px-6 md:pb-24 md:pt-7">
        <Link
          href="/app/scenarios"
          className="inline-flex items-center gap-1.5 text-small text-text-muted transition-colors hover:text-text"
        >
          <IcArrowLeft size={15} /> {t("scenarios.activity.back")}
        </Link>

        {loading ? (
          <div className="grid place-items-center py-20">
            <Spinner />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-border border-l-[3px] border-l-danger bg-surface px-4 py-3.5 text-small text-text-muted shadow-sm">
            {t("scenarios.activity.error")}
          </div>
        ) : data ? (
          <>
            <div className="flex flex-col gap-1">
              <h1 className="text-h2 font-semibold tracking-tight">{data.scenario_name}</h1>
              <p className="text-small text-text-muted">{t("scenarios.activity.subtitle")}</p>
            </div>

            {data.kind === "reply" ? (
              <div className="flex flex-wrap items-center gap-3 rounded-lg border border-accent/25 bg-accent/[0.05] px-4 py-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-accent/25 bg-accent/10 text-accent">
                  <IcReplies size={20} />
                </span>
                <p className="min-w-0 flex-1 text-small leading-[1.5] text-text">{t("scenarios.activity.reply_pointer")}</p>
                <Button size="sm" variant="secondary" onClick={() => router.push("/app/replies")} className="shrink-0">
                  {t("scenarios.activity.go_replies")}
                </Button>
              </div>
            ) : data.items.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-surface/50 px-6 py-14 text-center">
                <p className="text-body font-medium text-text">{t("scenarios.activity.empty_title")}</p>
                <p className="mt-1 text-small text-text-muted">{t("scenarios.activity.empty_sub")}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {data.items.map((it) => (
                  <div key={it.post_id} className="rounded-lg border border-border bg-surface p-4 shadow-sm">
                    <p className="line-clamp-3 text-small leading-[1.5] text-text [text-wrap:pretty]">{it.text}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-border pt-2.5 text-caption text-text-subtle">
                      <span className="tabular-nums">{fmtWhen(it.published_at, locale)}</span>
                      <span className="inline-flex items-center gap-1 tabular-nums">
                        <IcEye size={13} /> {fmtN(it.views, locale)}
                      </span>
                      <span className="inline-flex items-center gap-1 tabular-nums">
                        <IcHeart size={13} /> {fmtN(it.likes, locale)}
                      </span>
                      <span className="inline-flex items-center gap-1 tabular-nums">
                        <IcBubble size={13} /> {fmtN(it.comments_count, locale)}
                      </span>
                      {it.threads_url && (
                        <a
                          href={it.threads_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-auto inline-flex items-center gap-1 font-medium text-accent hover:underline"
                        >
                          {t("scenarios.activity.open_threads")} <IcExternal size={12} />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : null}
      </main>
    </div>
  );
}
