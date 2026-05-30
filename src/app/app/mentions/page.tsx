"use client";

// Mentions — standalone Threads posts elsewhere that @-mention the
// account, filled hourly by the ingest_mentions worker. Read-only list:
// the read surface for the threads_manage_mentions permission. No write
// actions on mentions yet.

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ApiError, clearTokens, fetchMentions, getTokens } from "@/lib/api";
import { useSelectedAccountId } from "@/lib/account";
import { useTranslation } from "@/lib/i18n";
import { TranslateButton } from "@/components/TranslateButton";
import { useTesterGuard } from "@/lib/tester";
import type { MentionSummary } from "@/lib/types";

export default function MentionsPage() {
  const router = useRouter();
  const { t } = useTranslation();
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

  if (bootError) {
    return (
      <main className="max-w-2xl mx-auto px-6 py-16">
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
            {t("mentions.title")}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">{t("mentions.subtitle")}</p>
        </div>

        {!loaded && (
          <p className="text-sm text-zinc-500">{t("common.loading")}</p>
        )}

        {loaded && mentions.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <p className="text-sm text-zinc-500">{t("mentions.empty")}</p>
          </div>
        )}

        <ul className="space-y-4">
          {mentions.map((m) => (
            <li
              key={m.id}
              className="rounded-xl border border-border bg-surface p-4 shadow-sm"
            >
              <div className="flex items-center justify-between mb-2 text-xs text-zinc-500">
                <span className="font-medium text-text truncate">
                  @{m.author_username ?? "—"}
                </span>
                {m.permalink && (
                  <a
                    href={m.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 underline-offset-2 hover:underline"
                  >
                    {t("mentions.view")} ↗
                  </a>
                )}
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-text">
                {m.text ?? ""}
              </p>
              {m.text && (
                <div className="mt-2">
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
