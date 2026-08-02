"use client";

// Scenario Activity (/app/scenarios/[id]/activity) — a human journal (§10): what
// Pennedly did and what's waiting for your word. «Спроси меня» drafts await
// confirmation; «Уже сделано» lists finished posts/replies in plain past tense
// with Threads links. A reply scenario points at the Replies screen. ?demo=1
// renders the neutral-creator journal for local review (no backend).

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import { ApiError, clearTokens, confirmScenarioDraft, fetchScenarioActivity, getTokens, skipScenarioDraft } from "@/lib/api";
import { errorCodeText } from "@/lib/errors";
import { useTranslation } from "@/lib/i18n";
import { AppTopbar } from "@/components/AppTopbar";
import { Spinner } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { IcArrowLeft, IcReplies } from "@/components/icons";
import {
  ActivityJournal,
  type ActivityDoneView,
  type ActivityDraftView,
} from "@/components/studio/scenarios-screens";
import { DEMO_ACTIVITY_DRAFTS, DEMO_ACTIVITY_DONE } from "@/components/studio/scenarios-presentation";
import type { ScenarioActivity } from "@/lib/types";
import { useDemoParam } from "@/lib/query";

const IS_DEV = process.env.NODE_ENV === "development";

function fmtN(n: number, locale: string): string {
  return n.toLocaleString(locale === "ru" ? "ru-RU" : locale);
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
  const demo = useDemoParam() && IS_DEV;

  const [data, setData] = useState<ScenarioActivity | null>(null);
  const [loading, setLoading] = useState(!demo);
  // Two pieces, because they answer different questions: `failed` decides which
  // branch renders, `errorText` is the server's own reason when it sent a code
  // we can translate (otherwise the screen's generic line stands).
  const [failed, setFailed] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    if (demo) return;
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
        if (alive) {
          setFailed(true);
          setErrorText(errorCodeText(e));
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [scenarioId, router, demo]);

  // ── demo journal ──
  if (demo) {
    const drafts: ActivityDraftView[] = DEMO_ACTIVITY_DRAFTS.map((d) => ({ id: d.id, kind: d.kind, when: t(d.whenKey), ctx: d.ctx, body: d.body }));
    const done: ActivityDoneView[] = DEMO_ACTIVITY_DONE.map((d) => ({ id: d.id, kind: d.kind, text: d.text, sub: d.sub, url: d.url }));
    return (
      <ActivityShell title={t("scenarios.fr.ex_morning")} sub={t("scenarios.act.subtitle")}>
        <ActivityJournal drafts={drafts} done={done} />
      </ActivityShell>
    );
  }

  // ── real journal ──
  const done: ActivityDoneView[] = (data?.items ?? []).map((it) => ({
    id: it.post_id,
    kind: "post" as const,
    text: it.text ?? "",
    sub: [fmtWhen(it.published_at, locale), it.views ? `${fmtN(it.views, locale)} ${t("scenarios.act.views")}` : ""].filter(Boolean).join(" · "),
    url: it.threads_url ?? "#",
  }));
  const drafts: ActivityDraftView[] = (data?.pending ?? []).map((p) => ({
    id: p.id,
    kind: p.kind,
    when: fmtWhen(p.created_at, locale),
    ctx: p.context,
    body: p.text,
  }));
  const hasContent = drafts.length > 0 || done.length > 0;
  async function refetch() {
    try {
      setData(await fetchScenarioActivity(scenarioId));
    } catch {
      /* keep the current view on a refetch hiccup */
    }
  }

  return (
    <ActivityShell title={data?.scenario_name ?? t("scenarios.activity.title")} sub={t("scenarios.act.subtitle")}>
      {loading ? (
        <div className="grid place-items-center py-20">
          <Spinner label={t("a11y.loading")} />
        </div>
      ) : failed ? (
        <div className="rounded-lg border border-border border-l-[3px] border-l-danger bg-surface px-4 py-3.5 text-small text-text-muted shadow-sm">
          {errorText ?? t("scenarios.activity.error")}
        </div>
      ) : hasContent ? (
        <ActivityJournal
          drafts={drafts}
          done={done}
          onPublish={async (id) => {
            await confirmScenarioDraft(scenarioId, id);
            await refetch();
          }}
          onSkip={async (id) => {
            await skipScenarioDraft(scenarioId, id);
            await refetch();
          }}
          onEdit={() => router.push("/app/studio")}
        />
      ) : data?.kind === "reply" ? (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-accent/25 bg-accent/[0.05] px-4 py-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-accent/25 bg-accent/10 text-accent">
            <IcReplies size={20} />
          </span>
          <p className="min-w-0 flex-1 text-small leading-[1.5] text-text">{t("scenarios.activity.reply_pointer")}</p>
          <Button size="sm" variant="secondary" onClick={() => router.push("/app/replies")} className="shrink-0">
            {t("scenarios.activity.go_replies")}
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border bg-surface/50 px-6 py-14 text-center">
          <p className="text-body font-medium text-text">{t("scenarios.activity.empty_title")}</p>
          <p className="mt-1 text-small text-text-muted">{t("scenarios.activity.empty_sub")}</p>
        </div>
      )}
    </ActivityShell>
  );
}

function ActivityShell({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-bg text-text">
      <AppTopbar maxW="760px" title={t("scenarios.activity.title")} />
      <main className="mx-auto max-w-[760px] space-y-4 px-3.5 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-4 md:px-6 md:pb-24 md:pt-7">
        <Link href="/app/scenarios" className="inline-flex items-center gap-1.5 text-small text-text-muted transition-colors hover:text-text">
          <IcArrowLeft size={15} /> {t("scenarios.back_to_list")}
        </Link>
        <div className="flex flex-col gap-1">
          <h1 className="text-h2 font-semibold tracking-tight">{title}</h1>
          <p className="max-w-[60ch] text-small text-text-muted">{sub}</p>
        </div>
        {children}
      </main>
    </div>
  );
}
