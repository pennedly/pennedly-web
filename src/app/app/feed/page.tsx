"use client";

// My Feed — the account's own posts, Threads-style, with inline analytics
// (views / likes / comments / reposts + a "how viral vs my usual" badge)
// AND, for testers, a delete action (folds in the old /app/posts screen —
// best of both: analytics + management). Main tab; delete is tester-gated
// since it uses the round-2 threads_delete scope.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  ApiError,
  clearTokens,
  deletePost,
  fetchFeed,
  fetchMe,
  fetchPostMetricsHistory,
  getTokens,
  setPostAutoReply,
} from "@/lib/api";
import { captureEvent } from "@/lib/analytics";
import { useSelectedAccountId } from "@/lib/account";
import { useTranslation } from "@/lib/i18n";
import { TranslateButton } from "@/components/TranslateButton";
import type { FeedPost, FeedReference, MetricsSnapshot } from "@/lib/types";

type Toast = { id: number; message: string; tone: "success" | "error" };

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
  const [isTester, setIsTester] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FeedPost | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [growthOpen, setGrowthOpen] = useState<number | null>(null);
  const [growth, setGrowth] = useState<Record<number, MetricsSnapshot[]>>({});
  const [toasts, setToasts] = useState<Toast[]>([]);

  async function toggleGrowth(postId: number) {
    if (growthOpen === postId) {
      setGrowthOpen(null);
      return;
    }
    setGrowthOpen(postId);
    if (!growth[postId]) {
      try {
        const data = await fetchPostMetricsHistory(postId);
        setGrowth((g) => ({ ...g, [postId]: data.series }));
      } catch {
        setGrowth((g) => ({ ...g, [postId]: [] }));
      }
    }
  }

  function toast(message: string, tone: Toast["tone"] = "success") {
    const id = Date.now() + Math.random();
    setToasts((s) => [...s, { id, message, tone }]);
    setTimeout(() => setToasts((s) => s.filter((x) => x.id !== id)), 3500);
  }

  useEffect(() => {
    if (!getTokens()) router.push("/app/login");
  }, [router]);

  // Delete is a tester-only (round-2) action; gate the button on is_tester.
  useEffect(() => {
    fetchMe()
      .then((m) => setIsTester(m.is_tester))
      .catch(() => {});
  }, []);

  async function onDeleteConfirm() {
    if (deleteTarget === null) return;
    const id = deleteTarget.id;
    setDeleting(true);
    captureEvent("ui.post_delete_confirmed", { post_id: id });
    try {
      await deletePost(id);
      setPosts((p) => p.filter((x) => x.id !== id));
      setDeleteTarget(null);
      toast(t("posts.toast_deleted"));
    } catch (e) {
      let msg = String(e);
      if (e instanceof ApiError) {
        const detail =
          typeof e.detail === "object" &&
          e.detail !== null &&
          "detail" in (e.detail as Record<string, unknown>)
            ? (e.detail as { detail: unknown }).detail
            : e.detail;
        msg = `${e.status}: ${String(detail)}`;
      }
      toast(msg, "error");
    } finally {
      setDeleting(false);
    }
  }

  // Per-post auto-reply toggle (optimistic; revert on error). Works on any
  // post — the auto-reply sweep keys off this flag, not the post's origin.
  async function onToggleAutoReply(p: FeedPost) {
    const next = !p.auto_reply;
    setPosts((ps) =>
      ps.map((x) => (x.id === p.id ? { ...x, auto_reply: next } : x)),
    );
    captureEvent("ui.post_autoreply_toggle", {
      post_id: p.id,
      auto_reply: next,
    });
    try {
      await setPostAutoReply(p.id, next);
      toast(
        next ? t("feed.autoreply_toast_on") : t("feed.autoreply_toast_off"),
      );
    } catch (e) {
      setPosts((ps) =>
        ps.map((x) => (x.id === p.id ? { ...x, auto_reply: !next } : x)),
      );
      toast(String(e), "error");
    }
  }

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
    <div className="min-h-screen bg-bg text-text">
      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("feed.title")}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">{t("feed.subtitle")}</p>
        </div>

        {/* Reference baseline */}
        {loaded && reference && (
          <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
            {hasBaseline ? (
              <>
                <p className="text-xs font-medium text-zinc-500 mb-2">
                  {reference.window_days <= 7
                    ? t("feed.ref_week")
                    : t("feed.ref_30d")}{" "}
                  · {reference.posts_counted} {t("feed.posts_word")}
                </p>
                <div className="flex flex-wrap items-center gap-4 text-sm text-text">
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
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <p className="text-sm text-zinc-500">{t("feed.empty")}</p>
          </div>
        )}

        <ul className="space-y-4">
          {posts.map((p) => (
            <li
              key={p.id}
              className="rounded-xl border border-border bg-surface p-4 shadow-sm"
            >
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-text">
                {p.text ?? ""}
              </p>

              <div className="mt-3 pt-3 border-t border-border flex flex-wrap items-center gap-3 text-xs text-zinc-500">
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

                {/* Per-post auto-reply toggle + indicator */}
                <button
                  onClick={() => onToggleAutoReply(p)}
                  title={t("feed.autoreply_hint")}
                  aria-pressed={p.auto_reply}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${
                    p.auto_reply
                      ? "bg-accent/10 text-accent hover:bg-accent/20"
                      : "bg-surface-2 text-text-subtle hover:bg-surface-2/70"
                  }`}
                >
                  <span aria-hidden>{p.auto_reply ? "↩︎" : "○"}</span>
                  {p.auto_reply
                    ? t("feed.autoreply_on")
                    : t("feed.autoreply_off")}
                </button>

                <div className="ml-auto flex items-center gap-3">
                  {p.published_at && (
                    <span>
                      {new Date(p.published_at).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>
                  )}
                  <button
                    onClick={() => toggleGrowth(p.id)}
                    className={`hover:text-zinc-700 dark:hover:text-zinc-300 underline-offset-2 hover:underline ${
                      growthOpen === p.id
                        ? "text-text font-medium"
                        : ""
                    }`}
                  >
                    {t("feed.growth")}
                  </button>
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
                  {isTester && (
                    <button
                      onClick={() => setDeleteTarget(p)}
                      className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                    >
                      {t("posts.delete")}
                    </button>
                  )}
                </div>
              </div>

              {growthOpen === p.id && (
                <GrowthChart series={growth[p.id]} label={t("feed.growth_none")} />
              )}

              {p.text && (
                <div className="mt-2">
                  <TranslateButton text={p.text} source="post" />
                </div>
              )}
            </li>
          ))}
        </ul>
      </main>

      {/* Delete confirmation (tester-only) */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-2xl bg-surface border border-border shadow-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold tracking-tight">
              {t("posts.confirm_title")}
            </h2>
            <p className="text-sm text-text-muted leading-relaxed">
              {t("posts.confirm_body")}
            </p>
            <p className="text-sm text-zinc-500 line-clamp-3 whitespace-pre-wrap border-l-2 border-border pl-3">
              {deleteTarget.text ?? ""}
            </p>
            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                onClick={() => {
                  if (!deleting) setDeleteTarget(null);
                }}
                disabled={deleting}
                className="text-sm px-4 py-2 rounded-md text-text hover:bg-surface-2 disabled:opacity-50 transition-colors"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={onDeleteConfirm}
                disabled={deleting}
                className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {deleting && (
                  <span
                    className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"
                    aria-hidden
                  />
                )}
                {deleting ? t("posts.deleting") : t("posts.confirm_cta")}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-6 right-6 z-30 space-y-2 pointer-events-none">
        {toasts.map((tt) => (
          <div
            key={tt.id}
            className={`px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium pointer-events-auto ${
              tt.tone === "error"
                ? "bg-red-600 text-white"
                : "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
            }`}
          >
            {tt.message}
          </div>
        ))}
      </div>
    </div>
  );
}

// Hand-rolled SVG sparkline of a post's views over time (no chart lib).
function GrowthChart({
  series,
  label,
}: {
  series: MetricsSnapshot[] | undefined;
  label: string;
}) {
  if (series === undefined) {
    return <div className="mt-3 h-14" aria-hidden />; // loading placeholder
  }
  const pts = series.filter((s) => s.views !== null);
  if (pts.length < 2) {
    return <p className="mt-3 text-xs text-zinc-400">{label}</p>;
  }
  const vals = pts.map((s) => s.views ?? 0);
  const max = Math.max(...vals);
  const min = Math.min(...vals);
  const range = max - min || 1;
  const W = 300;
  const H = 56;
  const coords = pts
    .map((s, i) => {
      const x = (i / (pts.length - 1)) * W;
      const y = H - (((s.views ?? 0) - min) / range) * H;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <div className="mt-3 pt-3 border-t border-border">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-14 text-green-500 dark:text-green-400"
        preserveAspectRatio="none"
        aria-hidden
      >
        <polyline
          points={coords}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="flex justify-between text-[10px] text-zinc-400 mt-0.5">
        <span>{num(min)} 👁</span>
        <span>{num(max)} 👁</span>
      </div>
    </div>
  );
}
