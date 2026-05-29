"use client";

// My Feed — the account's own posts, Threads-style, but every card carries
// inline analytics: views / likes / comments / reposts, plus a "how viral
// vs my usual" badge (vs_avg_views = this post's views ÷ the account's
// recent-average views). A reference header shows that baseline. Read-only,
// main tab (no tester gate) — it only reads metrics we already snapshot.

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ApiError, clearTokens, fetchFeed, getTokens } from "@/lib/api";
import { useSelectedAccountId } from "@/lib/account";
import { useTranslation } from "@/lib/i18n";
import { AccountSwitcher } from "@/components/AccountSwitcher";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { TranslateButton } from "@/components/TranslateButton";
import type { FeedPost, FeedReference } from "@/lib/types";

function num(n: number): string {
  return n.toLocaleString();
}

function vsAvgClasses(r: number): string {
  if (r >= 1.2)
    return "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300";
  if (r >= 0.6)
    return "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300";
  return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
}

function Stat({ icon, value }: { icon: React.ReactNode; value: number }) {
  return (
    <span className="inline-flex items-center gap-1">
      {icon}
      {num(value)}
    </span>
  );
}

const ICON = {
  views: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  likes: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z" />
    </svg>
  ),
  comments: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5z" />
    </svg>
  ),
  reposts: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M17 1l4 4-4 4" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <path d="M7 23l-4-4 4-4" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  ),
};

export default function FeedPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const accountId = useSelectedAccountId();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [reference, setReference] = useState<FeedReference | null>(null);
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
        const data = await fetchFeed(accountId, { limit: 50 });
        setPosts(data.posts);
        setReference(data.reference);
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

  if (bootError) {
    return (
      <main className="max-w-2xl mx-auto px-6 py-16">
        <div className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-950 p-4 text-sm text-red-800 dark:text-red-200">
          {bootError}
        </div>
      </main>
    );
  }

  const hasBaseline = reference !== null && reference.posts_counted > 0;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <header className="sticky top-0 z-20 bg-white/90 dark:bg-zinc-950/90 backdrop-blur border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between gap-3">
          <Link
            href="/app"
            className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            {t("feed.back")}
          </Link>
          <div className="flex items-center gap-3">
            <AccountSwitcher />
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("feed.title")}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">{t("feed.subtitle")}</p>
        </div>

        {/* Reference baseline */}
        {loaded && reference && (
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm">
            {hasBaseline ? (
              <>
                <p className="text-xs font-medium text-zinc-500 mb-2">
                  {reference.window_days <= 7
                    ? t("feed.ref_week")
                    : t("feed.ref_30d")}{" "}
                  · {reference.posts_counted} {t("feed.posts_word")}
                </p>
                <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-700 dark:text-zinc-300">
                  <Stat icon={ICON.views} value={Math.round(reference.avg_views)} />
                  <Stat icon={ICON.likes} value={Math.round(reference.avg_likes)} />
                  <Stat icon={ICON.comments} value={Math.round(reference.avg_comments)} />
                </div>
              </>
            ) : (
              <p className="text-sm text-zinc-500">{t("feed.ref_none")}</p>
            )}
          </div>
        )}

        {!loaded && (
          <p className="text-sm text-zinc-500">{t("common.loading")}</p>
        )}

        {loaded && posts.length === 0 && (
          <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 p-8 text-center">
            <p className="text-sm text-zinc-500">{t("feed.empty")}</p>
          </div>
        )}

        <ul className="space-y-4">
          {posts.map((p) => (
            <li
              key={p.id}
              className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm"
            >
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
                {p.text ?? ""}
              </p>

              <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                <span className="inline-flex items-center gap-3">
                  <Stat icon={ICON.views} value={p.views} />
                  <Stat icon={ICON.likes} value={p.likes} />
                  <Stat icon={ICON.comments} value={p.comments_count} />
                  <Stat icon={ICON.reposts} value={p.reposts} />
                </span>

                {/* Virality verdict */}
                {p.is_fresh ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                    🕐 {t("feed.fresh")}
                  </span>
                ) : (
                  p.vs_avg_views !== null && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${vsAvgClasses(
                        p.vs_avg_views,
                      )}`}
                    >
                      {p.vs_avg_views.toFixed(1)}
                      {t("feed.vs_avg")}
                    </span>
                  )
                )}

                <div className="ml-auto flex items-center gap-3">
                  {p.published_at && (
                    <span>
                      {new Date(p.published_at).toLocaleDateString()}
                    </span>
                  )}
                  {p.threads_url && (
                    <a
                      href={p.threads_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-zinc-700 dark:hover:text-zinc-300 underline-offset-2 hover:underline"
                    >
                      {t("feed.open")}
                    </a>
                  )}
                </div>
              </div>

              {p.text && (
                <div className="mt-2">
                  <TranslateButton text={p.text} source="post" />
                </div>
              )}
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
