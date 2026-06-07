"use client";

// Reply queue (/app/replies) — comments under the user's own posts, rebuilt 1:1
// to Replies-SPEC.html. Master-detail: a left post list drives a right detail
// pane (post context + 5-tab status filter + that post's comment cards). Each
// card threads a reply drafted in your voice; flow: generate → regenerate/edit →
// approve → publish (confirm dialog). Real API wiring is preserved; a tester-only
// ?demo=1 panel (dark + state) drives every state on mock data.

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  ApiError,
  approveDraft,
  clearTokens,
  fetchComments,
  fetchMe,
  fetchMyAccounts,
  generateReply,
  getTokens,
  publishDraft,
  restoreComment,
  skipComment,
} from "@/lib/api";
import { captureEvent } from "@/lib/analytics";
import { useSelectedAccountId } from "@/lib/account";
import { useTranslation } from "@/lib/i18n";
import { useTesterGuard } from "@/lib/tester";
import { AppTopbar, TopbarPill } from "@/components/AppTopbar";
import { Toast, ToastHost } from "@/components/ui/toast";
import { Spinner } from "@/components/ui/feedback";
import { TweaksPanel, TweakSection, TweakToggle, TweakRadio, useTweaks } from "@/components/tweaks/TweaksPanel";
import { ErrorBanner } from "@/components/studio/StudioParts";
import {
  CommentCard,
  PostContext,
  PostMaster,
  PublishReplyDialog,
  RepliesEmpty,
  RepliesLoading,
  StatusFilter,
  inFilter,
  type ReplyFilter,
  type ReplyHandlers,
} from "@/components/studio/RepliesParts";
import {
  DEMO_COMMENTS,
  DEMO_POSTS,
  REPLY_TWEAK_DEFAULTS,
  type ReplyComment,
  type ReplyPost,
  type ReplyStatus,
} from "@/components/studio/replies-demo";
import type { CommentSummary } from "@/lib/types";

const IS_DEV = process.env.NODE_ENV === "development";
const UNDO_MS = 5000;

type ToastT = { id: number; title: string; description?: string; tone: "success" | "error"; onUndo?: () => void; undoLabel?: string };

// Backend (comment.status + draft_status) → the spec's 5 card statuses.
function specStatus(c: CommentSummary): ReplyStatus {
  if (c.status === "replied") return "replied";
  if (c.status === "skipped" || c.draft_is_skip === true) return "skipped";
  if (c.ai_draft_id !== null && c.draft_text !== null) {
    if (c.draft_status === "approved") return "approved";
    if (c.draft_status === "rejected") return "new"; // rejected → regenerate
    return "draft"; // pending
  }
  return "new";
}

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

const FILTER_KEYS: ReplyFilter[] = ["all", "needs", "drafts", "replied", "skipped"];

export default function RepliesPage() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const [demoParam] = useState(() => (typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("demo") === "1" : false));
  const [isTester, setIsTester] = useState(false);
  const allow = demoParam && (IS_DEV || isTester);
  const { checking } = useTesterGuard(allow);
  const accountId = useSelectedAccountId();

  const [comments, setComments] = useState<CommentSummary[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [edits, setEdits] = useState<Record<number, string>>({});
  const [loaded, setLoaded] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [filter, setFilter] = useState<ReplyFilter>("all");
  const [generatingId, setGeneratingId] = useState<number | null>(null);
  const [publishTarget, setPublishTarget] = useState<{ comment: ReplyComment; reply: string; draftId: number | null } | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [toasts, setToasts] = useState<ToastT[]>([]);
  const [youInitials, setYouInitials] = useState("Y");
  const [youAvatar, setYouAvatar] = useState<string | null>(null);

  // demo
  const [tw, setTw] = useTweaks(REPLY_TWEAK_DEFAULTS);
  const [demoComments, setDemoComments] = useState<ReplyComment[]>(DEMO_COMMENTS);
  const demoOn = allow;

  function toast(title: string, tone: ToastT["tone"] = "success", opts?: { description?: string; onUndo?: () => void; undoLabel?: string; duration?: number }) {
    const id = Date.now() + Math.random();
    setToasts((s) => [...s, { id, title, description: opts?.description, tone, onUndo: opts?.onUndo, undoLabel: opts?.undoLabel }]);
    setTimeout(() => setToasts((s) => s.filter((x) => x.id !== id)), opts?.duration ?? 4600);
    return id;
  }
  function dismissToast(id: number) {
    setToasts((s) => s.filter((x) => x.id !== id));
  }

  // best-effort identity (tester flag for the panel gate + "You" avatar initials)
  useEffect(() => {
    if (!getTokens()) return;
    fetchMe().then((m) => {
      setIsTester(m.is_tester === true);
      setYouInitials((m.display_name?.[0] ?? m.email?.[0] ?? "Y").toUpperCase());
    }).catch(() => {});
    fetchMyAccounts().then((list) => {
      const a = list.accounts.find((x) => x.id === accountId) ?? list.accounts[0];
      if (a) {
        const name = a.display_name ?? a.username ?? "You";
        setYouInitials(name.slice(0, 2).toUpperCase());
        setYouAvatar(a.profile_picture_url);
      }
    }).catch(() => {});
  }, [accountId]);

  // real comments load
  useEffect(() => {
    if (demoParam) return;
    if (accountId === null) return;
    setLoaded(false);
    (async () => {
      try {
        const list = await fetchComments(accountId, { limit: 50 });
        setComments(list.comments);
        setCounts(list.status_counts ?? {});
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

  // demo dark
  useEffect(() => {
    if (!demoOn) return;
    document.documentElement.classList.toggle("dark", !!tw.dark);
  }, [demoOn, tw.dark]);

  async function reload() {
    if (accountId === null) return;
    try {
      const list = await fetchComments(accountId, { limit: 50 });
      setComments(list.comments);
      setCounts(list.status_counts ?? {});
    } catch {
      /* keep current on transient failure */
    }
  }

  // ── build posts + comments-by-post (real or demo) ──
  const { posts, byPost } = useMemo(() => {
    if (demoOn) {
      const map: Record<string, ReplyComment[]> = {};
      for (const c of demoComments) (map[c.postId] ??= []).push(c);
      return { posts: DEMO_POSTS, byPost: map };
    }
    const pmap = new Map<string, ReplyPost>();
    const map: Record<string, ReplyComment[]> = {};
    for (const c of comments) {
      const pid = String(c.post_id);
      if (!pmap.has(pid)) {
        pmap.set(pid, { id: pid, text: c.post_text ?? "", time: relativeTime(c.post_published_at, locale), threadsUrl: c.post_threads_url ?? "#" });
      }
      const name = c.author_username ?? "Someone";
      (map[pid] ??= []).push({
        id: c.id,
        postId: pid,
        status: specStatus(c),
        author: { name, handle: name, initials: name.slice(0, 2).toUpperCase() },
        text: c.text ?? "",
        reply: edits[c.ai_draft_id ?? -1] ?? c.draft_text ?? null,
        time: relativeTime(c.created_at, locale),
        repliedTime: relativeTime(c.replied_at, locale) || null,
      });
    }
    const ordered = [...pmap.values()].sort((a, b) => {
      const ca = comments.find((x) => String(x.post_id) === a.id)?.post_published_at;
      const cb = comments.find((x) => String(x.post_id) === b.id)?.post_published_at;
      return (cb ? Date.parse(cb) : 0) - (ca ? Date.parse(ca) : 0);
    });
    return { posts: ordered, byPost: map };
  }, [demoOn, demoComments, comments, edits, locale]);

  // keep a valid selected post
  useEffect(() => {
    if (posts.length === 0) {
      if (selectedPost !== null) setSelectedPost(null);
    } else if (selectedPost === null || !posts.some((p) => p.id === selectedPost)) {
      setSelectedPost(posts[0].id);
    }
  }, [posts, selectedPost]);

  const activePost = posts.find((p) => p.id === selectedPost) ?? posts[0] ?? null;
  const postComments = activePost ? byPost[activePost.id] ?? [] : [];

  const countsByPost: Record<string, { total: number; unanswered: number }> = {};
  for (const p of posts) {
    const cs = byPost[p.id] ?? [];
    countsByPost[p.id] = { total: cs.length, unanswered: cs.filter((c) => c.status !== "replied" && c.status !== "skipped").length };
  }

  const filterCounts = Object.fromEntries(FILTER_KEYS.map((f) => [f, postComments.filter((c) => inFilter(c.status, f)).length])) as Record<ReplyFilter, number>;
  const visible = postComments.filter((c) => inFilter(c.status, filter));

  const needsCount = demoOn ? demoComments.filter((c) => c.status === "new").length : counts["new"] ?? 0;
  const feedState = demoOn ? (tw.state as "Live" | "Loading" | "Empty" | "Error") : "Live";
  const phase: "loading" | "ready" | "empty" | "error" =
    demoOn
      ? feedState === "Loading"
        ? "loading"
        : feedState === "Error"
          ? "error"
          : feedState === "Empty"
            ? "empty"
            : "ready"
      : !loaded
        ? "loading"
        : posts.length === 0
          ? "empty"
          : "ready";

  // ════════════ real handlers ════════════
  function findDraftId(id: number): number | null {
    return comments.find((x) => x.id === id)?.ai_draft_id ?? null;
  }

  async function realGenerate(c: ReplyComment) {
    setGeneratingId(c.id);
    captureEvent("ui.reply_generate_clicked", { comment_id: c.id });
    try {
      await generateReply(c.id);
      await reload();
    } catch (e) {
      toast(String(e), "error");
    } finally {
      setGeneratingId(null);
    }
  }

  async function realApprove(c: ReplyComment) {
    const draftId = findDraftId(c.id);
    if (draftId === null) return;
    captureEvent("ui.reply_approve_clicked", { comment_id: c.id });
    try {
      await approveDraft(draftId, { editedText: edits[draftId] });
      setEdits((s) => {
        const n = { ...s };
        delete n[draftId];
        return n;
      });
      await reload();
      toast(t("replies.toast_approved"), "success", { description: t("replies.toast_ready") });
    } catch (e) {
      toast(String(e), "error");
    }
  }

  async function realPublishConfirm() {
    if (!publishTarget?.draftId) return;
    setPublishing(true);
    captureEvent("ui.reply_publish_confirmed", { draft_id: publishTarget.draftId });
    try {
      await publishDraft(publishTarget.draftId);
      await reload();
      setPublishTarget(null);
      toast(t("replies.toast_published"), "success", { description: t("replies.toast_posted") });
    } catch (e) {
      toast(String(e), "error");
    } finally {
      setPublishing(false);
    }
  }

  function realSkip(c: ReplyComment) {
    captureEvent("ui.reply_skip_clicked", { comment_id: c.id });
    // optimistic: drop from view; skipComment fires immediately, undo restores.
    setComments((p) => p.map((x) => (x.id === c.id ? { ...x, status: "skipped", draft_is_skip: true } : x)));
    skipComment(c.id).catch(() => reload());
    toast(t("replies.toast_dismissed"), "success", {
      duration: UNDO_MS,
      undoLabel: t("common.undo"),
      onUndo: () => {
        restoreComment(c.id).then(reload).catch(() => {});
      },
    });
  }

  async function realRestore(c: ReplyComment) {
    captureEvent("ui.reply_restore_clicked", { comment_id: c.id });
    try {
      await restoreComment(c.id);
      await reload();
      toast(t("replies.toast_restored"));
    } catch (e) {
      toast(String(e), "error");
    }
  }

  const realHandlers: ReplyHandlers = {
    onGenerate: realGenerate,
    onApprove: realApprove,
    onPublish: (c) => setPublishTarget({ comment: c, reply: c.reply ?? "", draftId: findDraftId(c.id) }),
    onSkip: realSkip,
    onRestore: realRestore,
    onSaveEdit: (c, text) => {
      const draftId = findDraftId(c.id);
      if (draftId !== null) setEdits((s) => ({ ...s, [draftId]: text }));
      toast(t("replies.toast_updated"));
    },
  };

  // ════════════ demo handlers ════════════
  function demoSet(id: number, patch: Partial<ReplyComment>) {
    setDemoComments((p) => p.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }
  function demoMove(c: ReplyComment, to: ReplyStatus, title: string, description?: string, undoTo?: ReplyStatus) {
    const from = c.status;
    demoSet(c.id, { status: to, ...(to === "replied" ? { repliedTime: "now" } : {}) });
    toast(title, "success", {
      description,
      duration: undoTo ? UNDO_MS : 4600,
      undoLabel: undoTo ? t("common.undo") : undefined,
      onUndo: undoTo ? () => demoSet(c.id, { status: from }) : undefined,
    });
  }
  const demoHandlers: ReplyHandlers = {
    onGenerate: (c) => {
      setGeneratingId(c.id);
      setTimeout(() => {
        demoSet(c.id, { status: "draft", reply: "Great question. The short version: keep the bar low enough that a tired you still clears it, and let the streak do the heavy lifting." });
        setGeneratingId(null);
      }, 1500);
    },
    onApprove: (c) => demoMove(c, "approved", t("replies.toast_approved"), t("replies.toast_ready"), "draft"),
    onPublish: (c) => setPublishTarget({ comment: c, reply: c.reply ?? "", draftId: null }),
    onSkip: (c) => demoMove(c, "skipped", t("replies.toast_dismissed"), undefined, "new"),
    onRestore: (c) => demoMove(c, "new", t("replies.toast_restored")),
    onSaveEdit: (c, text) => {
      demoSet(c.id, { reply: text });
      toast(t("replies.toast_updated"));
    },
  };

  const handlers = demoOn ? demoHandlers : realHandlers;

  const pill = needsCount > 0 ? (
    <TopbarPill tone="accent">
      {needsCount} {t("replies.need_reply")}
    </TopbarPill>
  ) : (
    <TopbarPill tone="success">{t("replies.all_caught_up")}</TopbarPill>
  );

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <Spinner size={20} className="text-text-subtle" />
      </div>
    );
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
      <AppTopbar maxW="960px" title={t("replies.title")} pill={pill} />
      <main className="mx-auto flex max-w-[960px] flex-col gap-5 px-5 pb-24 pt-7 md:px-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-h1 font-semibold tracking-[-0.015em]">{t("replies.heading")}</h1>
          <p className="text-body text-text-muted">{t("replies.subtitle")}</p>
        </div>

        {phase === "loading" ? (
          <RepliesLoading />
        ) : phase === "error" ? (
          <ErrorBanner onRetry={() => setTw("state", "Live")} titleKey="replies.error_title" subKey="replies.error_sub" />
        ) : phase === "empty" || !activePost ? (
          <RepliesEmpty filter="all" />
        ) : (
          <div className="grid grid-cols-[300px_1fr] items-start gap-[22px] max-[900px]:grid-cols-1">
            <PostMaster
              posts={posts}
              countsByPost={countsByPost}
              selected={activePost.id}
              onSelect={(id) => {
                setSelectedPost(id);
                setFilter("all");
              }}
            />
            <div className="flex min-w-0 flex-col gap-4">
              <PostContext post={activePost} />
              <StatusFilter active={filter} counts={filterCounts} onChange={setFilter} />
              <div className="flex flex-col gap-3.5">
                {visible.length === 0 ? (
                  <RepliesEmpty filter={filter} />
                ) : (
                  visible.map((c) => (
                    <CommentCard key={c.id} c={c} youInitials={youInitials} youAvatar={demoOn ? null : youAvatar} generating={generatingId === c.id} h={handlers} />
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <PublishReplyDialog
        open={publishTarget !== null}
        comment={publishTarget?.comment ?? null}
        reply={publishTarget?.reply ?? ""}
        publishing={publishing}
        onClose={() => {
          if (!publishing) setPublishTarget(null);
        }}
        onConfirm={() => {
          if (demoOn) {
            const c = publishTarget?.comment;
            if (c) demoMove(c, "replied", t("replies.toast_published"), t("replies.toast_posted"));
            setPublishTarget(null);
          } else {
            realPublishConfirm();
          }
        }}
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
        <TweaksPanel title="Replies">
          <TweakSection label="Appearance" />
          <TweakToggle label="Dark mode" value={tw.dark} onChange={(v) => setTw("dark", v)} />
          <TweakSection label="Feed" />
          <TweakRadio label="State" value={tw.state} options={["Live", "Loading", "Empty", "Error"]} onChange={(v) => setTw("state", v)} />
        </TweaksPanel>
      )}
    </div>
  );
}
