"use client";

// Mentions — standalone Threads posts elsewhere that @-mention the
// account, filled hourly by the ingest_mentions worker. Read-only list:
// the read surface for the threads_manage_mentions permission. No write
// actions on mentions yet (so no save/archive/filter — those are design-only).

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { ApiError, clearTokens, fetchMentions, getTokens } from "@/lib/api";
import { useSelectedAccountId } from "@/lib/account";
import { useTranslation } from "@/lib/i18n";
import { TranslateButton } from "@/components/TranslateButton";
import { useTesterGuard } from "@/lib/tester";
import { AppTopbar, TopbarPill } from "@/components/AppTopbar";
import { ErrorBanner } from "@/components/ui/error-banner";
import { Mono } from "@/components/ui/mono";
import { IcClock, IcExternal } from "@/components/icons";
import type { MentionSummary } from "@/lib/types";

// Accent the @-handles inside a mention's text.
function highlightMentions(text: string): ReactNode[] {
  return text.split(/(@[a-zA-Z0-9_.]+)/g).map((part, i) =>
    part.startsWith("@") ? (
      <span key={i} className="font-medium text-accent">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

function relativeTime(iso: string, locale: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (mins < 1) return rtf.format(0, "minute");
  if (mins < 60) return rtf.format(-mins, "minute");
  const hours = Math.floor(mins / 60);
  if (hours < 24) return rtf.format(-hours, "hour");
  const days = Math.floor(hours / 24);
  if (days < 7) return rtf.format(-days, "day");
  return new Date(iso).toLocaleDateString(locale, { dateStyle: "medium" });
}

export default function MentionsPage() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const { checking } = useTesterGuard();
  const accountId = useSelectedAccountId();
  const [mentions, setMentions] = useState<MentionSummary[]>([]);
  const [loaded, setLoaded] = useState(false);
  // Q22: a load failure → the shared ErrorBanner. Keep this a boolean (not the
  // message) so the callback doesn't depend on `t` and re-fetch on locale load.
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!getTokens()) router.push("/app/login");
  }, [router]);

  const load = useCallback(async () => {
    if (accountId === null) return;
    setLoaded(false);
    setHasError(false);
    try {
      const list = await fetchMentions(accountId, { limit: 50 });
      setMentions(list.mentions);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        clearTokens();
        router.push("/app/login");
        return;
      }
      setHasError(true);
    } finally {
      setLoaded(true);
    }
  }, [accountId, router]);

  useEffect(() => {
    void load();
  }, [load]);

  if (checking) return null;

  return (
    <div className="min-h-screen bg-bg text-text">
      <AppTopbar
        maxW="900px"
        title={t("mentions.title")}
        pill={
          <TopbarPill icon={<IcClock size={13} className="text-text-subtle" />}>
            {t("mentions.updated_hourly")}
          </TopbarPill>
        }
      />
      <main className="mx-auto max-w-[900px] space-y-4 px-5 py-7 md:px-6">
        {hasError && (
          <ErrorBanner subtitle={t("mentions.error")} onRetry={load} />
        )}

        {!hasError && (
          <p className="text-small text-text-muted">{t("mentions.subtitle")}</p>
        )}

        {!loaded && !hasError && (
          <p className="text-small text-text-muted">{t("common.loading")}</p>
        )}

        {loaded && !hasError && mentions.length === 0 && (
          <div className="flex flex-col items-center rounded-lg border border-dashed border-border px-6 py-14 text-center">
            <p className="max-w-[42ch] text-small leading-relaxed text-text-muted">
              {t("mentions.empty")}
            </p>
          </div>
        )}

        <ul className="space-y-3.5">
          {mentions.map((m) => (
            <li
              key={m.id}
              // Q15: no new/seen accent — there's no mark-seen endpoint, so the
              // accent would glow forever. Flat read-only feed.
              className="rounded-lg border border-border bg-surface p-4 shadow-sm transition-colors hover:border-text/15"
              style={{ animation: "card-in 240ms var(--ease-entrance) both" }}
            >
              <div className="flex items-center gap-2.5">
                <Mono text={(m.author_username?.[0] ?? "@").toUpperCase()} size={32} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-small font-semibold leading-tight">
                    @{m.author_username ?? "—"}
                  </div>
                  <div className="text-caption text-text-subtle">
                    {relativeTime(m.published_at ?? m.created_at, locale)}
                  </div>
                </div>
                {m.permalink && (
                  <a
                    href={m.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex shrink-0 items-center gap-1 text-small text-text-subtle underline-offset-2 hover:text-text hover:underline"
                  >
                    <IcExternal size={14} />
                    {t("mentions.view")}
                  </a>
                )}
              </div>

              <p className="mt-2.5 whitespace-pre-wrap text-body leading-relaxed text-text">
                {highlightMentions(m.text ?? "")}
              </p>

              {m.text && (
                <div className="mt-2.5">
                  <TranslateButton text={m.text} source="mention" />
                </div>
              )}
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
