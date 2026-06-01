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
import { AppTopbar } from "@/components/AppTopbar";
import { Button, buttonClasses } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Toast, ToastHost } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import {
  IcArrowUp,
  IcBubble,
  IcChart,
  IcChevDown,
  IcClock,
  IcExternal,
  IcEye,
  IcHeart,
  IcRepost,
  IcTrash,
} from "@/components/icons";
import type { FeedPost, FeedReference, MetricsSnapshot } from "@/lib/types";

type Toast = { id: number; message: string; tone: "success" | "error" };

// 48200 -> "48.2K", 1205 -> "1,205" (we keep <10k exact).
function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 10_000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toLocaleString();
}

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
      <div className="min-h-screen bg-bg text-text">
        <AppTopbar title={t("feed.title")} />
        <main className="mx-auto max-w-[712px] px-5 py-7 md:px-6">
          <div className="rounded-lg border border-danger/40 bg-danger/10 p-4 text-small text-danger">
            {bootError}
          </div>
        </main>
      </div>
    );
  }

  const hasBaseline = reference !== null && reference.posts_counted > 0;
  const baselineStats = reference
    ? [
        { Icon: IcEye, val: reference.avg_views },
        { Icon: IcHeart, val: reference.avg_likes },
        { Icon: IcBubble, val: reference.avg_comments },
      ]
    : [];

  return (
    <div className="min-h-screen bg-bg text-text">
      <AppTopbar title={t("feed.title")} />
      <main className="mx-auto max-w-[712px] space-y-4 px-5 py-7 md:px-6">
        {/* Reference baseline */}
        {loaded && reference && (
          <section className="rounded-xl border border-border bg-surface p-5 shadow-sm">
            {hasBaseline ? (
              <>
                <div className="flex items-center gap-2.5">
                  <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-md border border-border bg-surface-2 text-text-muted">
                    <IcChart size={16} />
                  </span>
                  <div className="text-small text-text-muted">
                    <span className="font-semibold text-text">
                      {reference.window_days <= 7 ? t("feed.ref_week") : t("feed.ref_30d")}
                    </span>{" "}
                    · {reference.posts_counted} {t("feed.posts_word")}
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3">
                  {baselineStats.map((s, i) => (
                    <div
                      key={i}
                      className={cn("px-4", i === 0 ? "pl-0" : "border-l border-border")}
                    >
                      <div className="text-h2 font-semibold leading-tight tracking-tight tabular-nums">
                        {fmt(Math.round(s.val))}
                      </div>
                      <div className="mt-1.5 text-text-subtle">
                        <s.Icon size={14} />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-small text-text-muted">{t("feed.ref_none")}</p>
            )}
          </section>
        )}

        {!loaded && <p className="text-small text-text-muted">{t("common.loading")}</p>}

        {loaded && posts.length === 0 && (
          <div className="flex flex-col items-center rounded-lg border border-dashed border-border px-6 py-14 text-center">
            <p className="max-w-[42ch] text-small leading-relaxed text-text-muted">
              {t("feed.empty")}
            </p>
          </div>
        )}

        <ul className="space-y-3.5">
          {posts.map((p) => (
            <li
              key={p.id}
              className="rounded-lg border border-border bg-surface p-4 shadow-sm transition-colors hover:border-text/15"
              style={{ animation: "card-in 240ms var(--ease-entrance) both" }}
            >
              {/* head: time + virality verdict */}
              <div className="flex items-center gap-2 text-caption text-text-subtle">
                {p.published_at && (
                  <span>
                    {new Date(p.published_at).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                )}
                <span className="ml-auto">
                  {p.is_fresh ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/12 px-2.5 py-1 text-caption font-semibold text-accent">
                      <IcClock size={12} />
                      {t("feed.fresh")}
                    </span>
                  ) : (
                    p.vs_avg_views !== null && (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-caption font-semibold",
                          p.vs_avg_views >= 1.5
                            ? "border-success/30 bg-success/12 text-success"
                            : "border-border bg-surface-2 text-text-muted",
                        )}
                      >
                        {p.vs_avg_views >= 1.5 && <IcArrowUp size={12} />}
                        {p.vs_avg_views.toFixed(1)}
                        {t("feed.vs_avg")}
                      </span>
                    )
                  )}
                </span>
              </div>

              <p className="mt-2.5 whitespace-pre-wrap text-body leading-relaxed text-text">
                {p.text ?? ""}
              </p>

              {/* metrics — hero views + sub likes/comments/reposts */}
              <div className="mt-3.5 flex flex-wrap items-baseline gap-x-5 gap-y-2">
                <span className="inline-flex items-baseline gap-2">
                  <IcEye size={18} className="self-center text-text-muted" />
                  <span className="text-h2 font-semibold tracking-tight tabular-nums">
                    {fmt(p.views)}
                  </span>
                </span>
                <span className="inline-flex items-baseline gap-1.5">
                  <IcHeart size={15} className="self-center text-text-subtle" />
                  <span className="font-semibold tabular-nums">{fmt(p.likes)}</span>
                </span>
                <span className="inline-flex items-baseline gap-1.5">
                  <IcBubble size={15} className="self-center text-text-subtle" />
                  <span className="font-semibold tabular-nums">{fmt(p.comments_count)}</span>
                </span>
                <span className="inline-flex items-baseline gap-1.5">
                  <IcRepost size={15} className="self-center text-text-subtle" />
                  <span className="font-semibold tabular-nums">{fmt(p.reposts)}</span>
                </span>
              </div>

              {growthOpen === p.id && (
                <div
                  className="mt-3.5 rounded-md border border-border bg-surface-2 p-4"
                  style={{ animation: "card-in 180ms var(--ease-entrance) both" }}
                >
                  <TrendChart
                    series={growth[p.id]}
                    baseline={reference?.avg_views ?? null}
                    emptyLabel={t("feed.growth_none")}
                  />
                </div>
              )}

              {/* footer: auto-reply switch + actions */}
              <div className="mt-3.5 flex items-center gap-3 border-t border-border pt-3.5">
                <label className="flex min-w-0 flex-1 items-center gap-2.5">
                  <Switch
                    checked={p.auto_reply}
                    onCheckedChange={() => onToggleAutoReply(p)}
                    aria-label={t("feed.autoreply_hint")}
                  />
                  <span className="truncate text-small text-text-muted">
                    {p.auto_reply ? t("feed.autoreply_on") : t("feed.autoreply_off")}
                  </span>
                </label>

                <div className="flex shrink-0 items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleGrowth(p.id)}
                    aria-expanded={growthOpen === p.id}
                    icon={<IcChart size={15} />}
                  >
                    {t("feed.growth")}
                    <IcChevDown
                      size={14}
                      className="transition-transform"
                      style={{
                        transform: growthOpen === p.id ? "rotate(180deg)" : "none",
                      }}
                    />
                  </Button>
                  {p.threads_url && (
                    <a
                      href={p.threads_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={buttonClasses({ variant: "secondary", size: "sm" })}
                    >
                      <IcExternal size={15} />
                      {t("feed.open")}
                    </a>
                  )}
                  {isTester && (
                    <button
                      onClick={() => setDeleteTarget(p)}
                      aria-label={t("posts.delete")}
                      className="grid h-8 w-8 place-items-center rounded-sm text-text-subtle transition-colors hover:bg-surface-2 hover:text-danger"
                    >
                      <IcTrash size={15} />
                    </button>
                  )}
                </div>
              </div>

              {p.text && (
                <div className="mt-2.5">
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
          className="fixed inset-0 z-40 grid place-items-center bg-ink-950/55 p-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !deleting) setDeleteTarget(null);
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-lg">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-danger/30 bg-danger/12 text-danger">
                <IcTrash size={18} />
              </span>
              <div>
                <h2 className="text-h3 font-semibold">{t("posts.confirm_title")}</h2>
                <p className="mt-1 text-small leading-relaxed text-text-muted">
                  {t("posts.confirm_body")}
                </p>
              </div>
            </div>
            <div className="mt-4 line-clamp-3 whitespace-pre-wrap rounded-md border border-border bg-surface-2 p-3.5 text-small leading-relaxed text-text-muted">
              {deleteTarget.text ?? ""}
            </div>
            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                onClick={() => {
                  if (!deleting) setDeleteTarget(null);
                }}
                disabled={deleting}
                className={buttonClasses({ variant: "ghost" })}
              >
                {t("common.cancel")}
              </button>
              <Button
                variant="danger"
                onClick={onDeleteConfirm}
                loading={deleting}
                disabled={deleting}
                icon={<IcTrash size={15} />}
              >
                {deleting ? t("posts.deleting") : t("posts.confirm_cta")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      <ToastHost>
        {toasts.map((to) => (
          <Toast key={to.id} tone={to.tone} title={to.message} />
        ))}
      </ToastHost>
    </div>
  );
}

// Cumulative views over time, drawn against a dashed "your average" line so
// the post reads relative to the baseline strip at the top.
function TrendChart({
  series,
  baseline,
  emptyLabel,
}: {
  series: MetricsSnapshot[] | undefined;
  baseline: number | null;
  emptyLabel: string;
}) {
  if (series === undefined) {
    return <div className="h-20" aria-hidden />; // loading placeholder
  }
  const pts = series.filter((s) => s.views !== null).map((s) => s.views ?? 0);
  if (pts.length < 2) {
    return <p className="text-caption text-text-subtle">{emptyLabel}</p>;
  }
  const W = 600;
  const H = 112;
  const L = 8;
  const R = 592;
  const TOP = 12;
  const BOT = 92;
  const base = baseline ?? 0;
  const max = Math.max(...pts, base) * 1.1 || 1;
  const plotH = BOT - TOP;
  const x = (i: number) => L + (i / (pts.length - 1)) * (R - L);
  const y = (v: number) => BOT - (v / max) * plotH;
  const line = pts
    .map((v, i) => (i ? "L" : "M") + x(i).toFixed(1) + " " + y(v).toFixed(1))
    .join(" ");
  const area = `${line} L ${R} ${BOT} L ${L} ${BOT} Z`;
  const byY = y(base);
  const lastX = x(pts.length - 1);
  const lastY = y(pts[pts.length - 1]);
  return (
    <>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block h-auto w-full overflow-visible"
        role="img"
        aria-label="Views over time vs your average"
      >
        <path d={area} fill="var(--color-accent)" fillOpacity="0.1" />
        {base > 0 && (
          <>
            <line
              x1={L}
              y1={byY}
              x2={R}
              y2={byY}
              stroke="var(--color-text-subtle)"
              strokeWidth="1"
              strokeDasharray="4 4"
              opacity="0.75"
            />
            <text
              x={R}
              y={byY - 6}
              textAnchor="end"
              fontSize="11"
              fill="var(--color-text-subtle)"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              {fmt(Math.round(base))}
            </text>
          </>
        )}
        <path
          d={line}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        <circle
          cx={lastX}
          cy={lastY}
          r="3.6"
          fill="var(--color-accent)"
          stroke="var(--color-surface)"
          strokeWidth="2"
        />
      </svg>
      <div className="mt-1.5 flex justify-between text-caption text-text-subtle">
        <span>{fmt(pts[0])}</span>
        <span>{fmt(pts[pts.length - 1])}</span>
      </div>
    </>
  );
}
