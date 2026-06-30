"use client";

// My Feed (/app/feed) — published-posts analytics, rebuilt 1:1 to Feed-SPEC.html.
// Baseline summary → sort segment → post cards with a virality verdict vs the
// account's own baseline, hero+sub metrics, an expandable growth chart, a
// per-post auto-reply toggle, inline translate and delete. Real API wiring is
// preserved; a tester ?demo=1 panel (dark/state/sort) drives every state.

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  ApiError,
  clearTokens,
  deletePost,
  fetchAutopilot,
  fetchFeed,
  fetchMe,
  fetchMyAccounts,
  fetchPostMetricsHistory,
  getTokens,
  setPostAutoReply,
  translateText,
} from "@/lib/api";
import { captureEvent } from "@/lib/analytics";
import { useSelectedAccountId } from "@/lib/account";
import { useTranslation } from "@/lib/i18n";
import { AppTopbar, TopbarPill } from "@/components/AppTopbar";
import { BetaNotice } from "@/components/ui/beta-notice";
import { Toast, ToastHost } from "@/components/ui/toast";
import { TweaksPanel, TweakSection, TweakToggle, TweakRadio, useTweaks } from "@/components/tweaks/TweaksPanel";
import { ErrorBanner } from "@/components/studio/StudioParts";
import {
  ConfirmDelete,
  FeedBar,
  FeedCard,
  FeedEmpty,
  FeedSkeleton,
  type FeedCardModel,
  type FeedHandlers,
} from "@/components/studio/FeedParts";
import { FEED_DEMO_BASELINE, FEED_DEMO_POSTS, FEED_TWEAK_DEFAULTS, type FeedDemoPost } from "@/components/studio/feed-demo";
import type { FeedPost, FeedReference } from "@/lib/types";

const IS_DEV = process.env.NODE_ENV === "development";

type ToastT = { id: number; title: string; description?: string; tone: "success" | "error"; onUndo?: () => void; undoLabel?: string };

function relativeTime(iso: string | null, locale: string): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (mins < 1) return rtf.format(0, "minute");
  if (mins < 60) return rtf.format(-mins, "minute");
  const hours = Math.floor(mins / 60);
  if (hours < 24) return rtf.format(-hours, "hour");
  const days = Math.floor(hours / 24);
  if (days < 7) return rtf.format(-days, "day");
  return new Date(iso).toLocaleDateString(locale);
}

export default function FeedPage() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const [demoParam] = useState(() => (typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("demo") === "1" : false));
  const [isTester, setIsTester] = useState(false);
  const allow = demoParam && (IS_DEV || isTester);
  const demoOn = allow;
  const accountId = useSelectedAccountId();

  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [reference, setReference] = useState<FeedReference | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);
  const [account, setAccount] = useState<{ name: string; handle: string; initials: string; avatarUrl: string | null }>({ name: "You", handle: "you", initials: "Y", avatarUrl: null });
  const [sort, setSort] = useState<"recent" | "top">("recent");
  // The account reply mode resolves a post's NULL (inherit) auto_reply for display.
  const [replyMode, setReplyMode] = useState<"off" | "all" | "selected">("all");
  const [growthOpen, setGrowthOpen] = useState<number | null>(null);
  const [growth, setGrowth] = useState<Record<number, number[]>>({});
  const [deleteTarget, setDeleteTarget] = useState<FeedCardModel | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toasts, setToasts] = useState<ToastT[]>([]);

  // demo
  const [tw, setTw] = useTweaks(FEED_TWEAK_DEFAULTS);
  const [demoPosts, setDemoPosts] = useState<FeedDemoPost[]>(FEED_DEMO_POSTS);

  function toast(title: string, tone: ToastT["tone"] = "success", opts?: { description?: string; onUndo?: () => void; undoLabel?: string; duration?: number }) {
    const id = Date.now() + Math.random();
    setToasts((s) => [...s, { id, title, description: opts?.description, tone, onUndo: opts?.onUndo, undoLabel: opts?.undoLabel }]);
    setTimeout(() => setToasts((s) => s.filter((x) => x.id !== id)), opts?.duration ?? 4600);
    return id;
  }
  const dismissToast = (id: number) => setToasts((s) => s.filter((x) => x.id !== id));

  // best-effort identity (tester flag + author)
  useEffect(() => {
    if (!getTokens()) return;
    fetchMe().then((m) => setIsTester(m.is_tester === true)).catch(() => {});
    fetchMyAccounts().then((list) => {
      const a = list.accounts.find((x) => x.id === accountId) ?? list.accounts[0];
      if (a) {
        const name = a.display_name ?? a.username ?? "You";
        setAccount({ name, handle: a.username ?? "you", initials: name.slice(0, 2).toUpperCase(), avatarUrl: a.profile_picture_url });
      }
    }).catch(() => {});
  }, [accountId]);

  // real feed load
  useEffect(() => {
    if (demoParam) return;
    if (!getTokens()) {
      router.push("/app/login");
      return;
    }
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
  }, [accountId, router, demoParam]);

  // Reply mode for resolving NULL (inherit) per-post flags — fail-soft.
  useEffect(() => {
    if (demoParam || accountId === null) return;
    fetchAutopilot(accountId)
      .then((c) => setReplyMode(c.reply_mode))
      .catch(() => {});
  }, [accountId, demoParam]);

  useEffect(() => {
    if (!demoOn) return;
    document.documentElement.classList.toggle("dark", !!tw.dark);
  }, [demoOn, tw.dark]);

  useEffect(() => {
    if (demoOn) setSort(tw.sort === "Top" ? "top" : "recent");
  }, [demoOn, tw.sort]);

  // ── unified cards + baseline ──
  const cards: FeedCardModel[] = useMemo(() => {
    const list: FeedCardModel[] = demoOn
      ? demoPosts
      : posts.map((fp) => ({
          id: fp.id,
          kind: "post",
          text: fp.text ?? "",
          time: relativeTime(fp.published_at, locale),
          views: fp.views,
          likes: fp.likes,
          comments: fp.comments_count,
          reposts: fp.reposts,
          settling: fp.is_fresh,
          autoReply: fp.auto_reply ?? (replyMode === "all"),
          media: fp.media ?? [],
        }));
    return sort === "top" ? [...list].sort((a, b) => b.views - a.views) : list;
  }, [demoOn, demoPosts, posts, sort, locale, replyMode]);

  const baseline = demoOn
    ? FEED_DEMO_BASELINE
    : {
        posts: reference?.posts_counted ?? 0,
        views: reference?.avg_views ?? 0,
        likes: reference?.avg_likes ?? 0,
        comments: reference?.avg_comments ?? 0,
        reposts: reference?.avg_reposts ?? 0,
        deltaViews: 0,
        sparkline: [] as number[],
      };

  const feedState = demoOn ? (tw.state as "Live" | "Loading" | "Empty" | "Error") : "Live";
  const phase: "loading" | "ready" | "empty" | "error" = demoOn
    ? feedState === "Loading"
      ? "loading"
      : feedState === "Error"
        ? "error"
        : feedState === "Empty"
          ? "empty"
          : "ready"
    : !loaded
      ? "loading"
      : cards.length === 0
        ? "empty"
        : "ready";

  // ── handlers ──
  function growthSeries(p: FeedCardModel): number[] | null {
    if (demoOn) return demoPosts.find((d) => d.id === p.id)?.growth ?? null;
    return growth[p.id] ?? null;
  }

  const realHandlers: FeedHandlers = {
    onToggleAutoReply: (p) => {
      const next = !p.autoReply;
      setPosts((ps) => ps.map((x) => (x.id === p.id ? { ...x, auto_reply: next } : x)));
      captureEvent("ui.post_autoreply_toggle", { post_id: p.id, auto_reply: next });
      setPostAutoReply(p.id, next).catch(() => {
        setPosts((ps) => ps.map((x) => (x.id === p.id ? { ...x, auto_reply: !next } : x)));
      });
      toast(next ? t("feed.autoreply_on") : t("feed.autoreply_off"), "success", { description: next ? t("feed.autoreply_sub_on") : t("feed.autoreply_sub_off") });
    },
    onToggleGrowth: async (p) => {
      if (growthOpen === p.id) {
        setGrowthOpen(null);
        return;
      }
      setGrowthOpen(p.id);
      if (!growth[p.id]) {
        try {
          const g = await fetchPostMetricsHistory(p.id);
          setGrowth((m) => ({ ...m, [p.id]: g.series.map((s) => s.views ?? 0) }));
        } catch {
          setGrowth((m) => ({ ...m, [p.id]: [] }));
        }
      }
    },
    onDelete: (p) => setDeleteTarget(p),
    onTranslate: async (p, lang) => (await translateText(p.text, lang.code)).translated_text,
  };

  const demoHandlers: FeedHandlers = {
    onToggleAutoReply: (p) => {
      const next = !p.autoReply;
      setDemoPosts((ps) => ps.map((x) => (x.id === p.id ? { ...x, autoReply: next } : x)));
      toast(next ? t("feed.autoreply_on") : t("feed.autoreply_off"), "success", { description: next ? t("feed.autoreply_sub_on") : t("feed.autoreply_sub_off") });
    },
    onToggleGrowth: (p) => setGrowthOpen((cur) => (cur === p.id ? null : p.id)),
    onDelete: (p) => setDeleteTarget(p),
    onTranslate: async (p, lang) => {
      await new Promise((r) => setTimeout(r, 500));
      const d = demoPosts.find((x) => x.id === p.id);
      return d?.tr?.[lang.code] ?? `[${lang.native}] ${p.text}`;
    },
  };

  const handlers = demoOn ? demoHandlers : realHandlers;

  function confirmDelete() {
    const target = deleteTarget;
    if (!target) return;
    if (demoOn) {
      const removed = demoPosts.find((x) => x.id === target.id);
      const idx = demoPosts.findIndex((x) => x.id === target.id);
      setDemoPosts((ps) => ps.filter((x) => x.id !== target.id));
      setDeleteTarget(null);
      toast(t("feed.toast_deleted"), "success", {
        description: t("feed.toast_deleted_sub"),
        undoLabel: t("common.undo"),
        onUndo: () => {
          if (removed) setDemoPosts((ps) => { const n = ps.slice(); n.splice(Math.min(idx, n.length), 0, removed); return n; });
        },
      });
      return;
    }
    const removed = posts.find((x) => x.id === target.id);
    const idx = posts.findIndex((x) => x.id === target.id);
    setDeleting(true);
    deletePost(target.id)
      .then(() => {
        setPosts((ps) => ps.filter((x) => x.id !== target.id));
        setDeleteTarget(null);
        toast(t("feed.toast_deleted"), "success", {
          description: t("feed.toast_deleted_sub"),
          undoLabel: t("common.undo"),
          onUndo: () => {
            if (removed) setPosts((ps) => { const n = ps.slice(); n.splice(Math.min(idx, n.length), 0, removed); return n; });
          },
        });
      })
      .catch((e) => toast(String(e), "error"))
      .finally(() => setDeleting(false));
  }

  function onSort(s: "recent" | "top") {
    setSort(s);
    if (demoOn) setTw("sort", s === "top" ? "Top" : "Recent");
  }

  if (bootError) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <div className="rounded-lg border border-danger/40 bg-danger/10 p-4 text-small text-danger">{bootError}</div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-text">
      <AppTopbar maxW="960px" title={t("feed.title")} pill={<TopbarPill tone="success">{t("feed.updated")}</TopbarPill>} />
      <main className="mx-auto flex max-w-[960px] flex-col gap-4 px-3.5 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-4 md:gap-5 md:px-6 md:pb-24 md:pt-7">
        <div className="flex flex-col gap-1">
          <h1 className="text-h1 font-semibold tracking-[-0.015em]">{t("feed.title")}</h1>
          <p className="text-body text-text-muted">{t("feed.subtitle")}</p>
        </div>

        {/* Beta disclaimer — the Threads insights `likes` metric reads 0 for recent
            posts despite real likes (a Threads-API limit, see SPEC §14). Shared with
            Stats; remove once Meta review clears and the data reconciles. */}
        <BetaNotice />

        {phase === "loading" ? (
          <div className="flex flex-col gap-5">
            {[0, 1, 2, 3, 4].map((i) => (
              <FeedSkeleton key={i} />
            ))}
          </div>
        ) : phase === "error" ? (
          <ErrorBanner onRetry={() => setTw("state", "Live")} titleKey="feed.error_title" subKey="feed.error_sub" />
        ) : phase === "empty" ? (
          <FeedEmpty onStudio={() => router.push("/app")} />
        ) : (
          <>
            <FeedBar count={cards.length} sort={sort} onSort={onSort} />
            <div className="flex flex-col gap-5">
              {cards.map((p) => (
                <FeedCard
                  key={p.id}
                  p={p}
                  baselineViews={baseline.views}
                  authorInitials={demoOn ? "ML" : account.initials}
                  authorAvatar={demoOn ? null : account.avatarUrl}
                  authorName={demoOn ? "Mara Lin" : account.name}
                  authorHandle={demoOn ? "mara.lin" : account.handle}
                  growthOpen={growthOpen === p.id}
                  growthSeries={growthSeries(p)}
                  tester={demoOn ? true : isTester}
                  h={handlers}
                />
              ))}
            </div>
          </>
        )}
      </main>

      <ConfirmDelete
        open={deleteTarget !== null}
        text={deleteTarget?.text ?? ""}
        deleting={deleting}
        onClose={() => {
          if (!deleting) setDeleteTarget(null);
        }}
        onConfirm={confirmDelete}
      />

      <ToastHost>
        {toasts.map((to) => (
          <Toast
            key={to.id}
            tone={to.tone}
            title={to.title}
            description={to.description}
            undoLabel={to.undoLabel}
            className="[animation:toast-in_var(--duration-slow)_var(--ease-entrance)]"
            onUndo={to.onUndo ? () => { to.onUndo?.(); dismissToast(to.id); } : undefined}
          />
        ))}
      </ToastHost>

      {allow && (
        <TweaksPanel title="Feed">
          <TweakSection label="Appearance" />
          <TweakToggle label="Dark mode" value={tw.dark} onChange={(v) => setTw("dark", v)} />
          <TweakSection label="Feed" />
          <TweakRadio label="Default sort" value={tw.sort} options={["Recent", "Top"]} onChange={(v) => setTw("sort", v)} />
          <TweakRadio label="State" value={tw.state} options={["Live", "Loading", "Empty", "Error"]} onChange={(v) => setTw("state", v)} />
        </TweaksPanel>
      )}
    </div>
  );
}
