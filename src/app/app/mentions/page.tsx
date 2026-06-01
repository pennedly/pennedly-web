"use client";

// Mentions — standalone Threads posts elsewhere that @-mention the
// account, filled hourly by the ingest_mentions worker. Read-only list:
// the read surface for the threads_manage_mentions permission. No write
// actions on mentions yet (so no save/archive/filter — those are design-only).

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { ApiError, clearTokens, fetchMentions, getTokens } from "@/lib/api";
import { useSelectedAccountId } from "@/lib/account";
import { useTranslation } from "@/lib/i18n";
import { TranslateButton } from "@/components/TranslateButton";
import { useTesterGuard } from "@/lib/tester";
import { AppTopbar } from "@/components/AppTopbar";
import { Mono } from "@/components/ui/mono";
import { cn } from "@/lib/cn";
import { IcExternal } from "@/components/icons";
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
  const [bootError, setBootError] = useState<string | null>(null);

  useEffect(() => {
    if (!getTokens()) router.push("/app/login");
  }, [router]);

  useEffect(() => {
    if (accountId === null) return;
    setLoaded(false);
    (async () => {
      try {
        const list = await fetchMentions(accountId, { limit: 50 });
        setMentions(list.mentions);
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
  }, [accountId, router]);

  if (checking) return null;

  return (
    <div className="min-h-screen bg-bg text-text">
      <AppTopbar maxW="900px" title={t("mentions.title")} />
      <main className="mx-auto max-w-[900px] space-y-4 px-5 py-7 md:px-6">
        {bootError && (
          <div className="rounded-lg border border-danger/40 bg-danger/10 p-4 text-small text-danger">
            {bootError}
          </div>
        )}

        {!bootError && (
          <p className="text-small text-text-muted">{t("mentions.subtitle")}</p>
        )}

        {!loaded && !bootError && (
          <p className="text-small text-text-muted">{t("common.loading")}</p>
        )}

        {loaded && !bootError && mentions.length === 0 && (
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
              className={cn(
                "rounded-lg border border-border bg-surface p-4 shadow-sm transition-colors hover:border-text/15",
                m.status === "new" && "border-l-2 border-l-accent",
              )}
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
