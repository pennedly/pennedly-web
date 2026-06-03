"use client";

// Reply queue — comments under the user's own posts. For each comment you
// generate an AI reply in your voice, review/edit it, approve, then
// publish it threaded under the comment. The queue is filled hourly by
// the ingest_comments worker; this is the manual-reply surface for the
// threads_manage_replies permission.
//
// Layout follows design-export/PennedlyDesign/replies-* (master-detail, Q18):
// a left post list (PostMaster) drives a right detail pane — a post-context
// header (PostContext) + a per-post status filter (Q77 buckets) + that post's
// comment cards. Each card has an in-card threaded reply block whose action set
// is the design's: generate → (regenerate / edit) → approve → publish, plus
// skip/restore on the comment itself.

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import {
  ApiError,
  approveDraft,
  clearTokens,
  fetchComments,
  generateReply,
  getTokens,
  publishDraft,
  restoreComment,
  skipComment,
} from "@/lib/api";
import { captureEvent } from "@/lib/analytics";
import { useSelectedAccountId } from "@/lib/account";
import { useTranslation, type MessageKey } from "@/lib/i18n";
import { PublishConfirmModal } from "@/components/PublishConfirmModal";
import { TranslateButton } from "@/components/TranslateButton";
import { useTesterGuard } from "@/lib/tester";
import { AppTopbar, TopbarPill } from "@/components/AppTopbar";
import { Button, buttonClasses } from "@/components/ui/button";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Mono } from "@/components/ui/mono";
import { Skeleton } from "@/components/ui/feedback";
import { Toast, ToastHost } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import {
  IcCheck,
  IcExternal,
  IcNib,
  IcPencil,
  IcReplies,
  IcReply,
  IcSkip,
  IcTweak,
  IcUndo,
} from "@/components/icons";
import type { CommentSummary } from "@/lib/types";

type Toast = {
  id: number;
  message: string;
  tone: "success" | "error";
  onUndo?: () => void;
  undoLabel?: string;
};

// Q24: how long the Undo toast stays up after a skip.
const UNDO_MS = 5000;

const REPLY_LIMIT = 500;

// E: one post + every comment sitting under it, used to build the post-rail
// and the "all posts" count.
type PostGroup = {
  postId: number;
  postText: string | null;
  postPublishedAt: string | null;
  postThreadsUrl: string | null;
  comments: CommentSummary[];
};

// Reply-queue filter tabs. `key` is the comment `status` passed to the API
// (null = all). `dot` is the status-dot colour (a Tailwind bg-* token).
const FILTER_TABS = [
  { key: null, labelKey: "replies.filter_all", dot: "bg-text-subtle" },
  { key: "new", labelKey: "replies.filter_new", dot: "bg-accent" },
  { key: "drafted", labelKey: "replies.filter_drafted", dot: "bg-text-muted" },
  { key: "replied", labelKey: "replies.filter_replied", dot: "bg-success" },
  { key: "skipped", labelKey: "replies.filter_skipped", dot: "bg-text-subtle" },
] as const;

// Which design "state" a comment is in — drives badge, reply thread and the
// footer action set. Maps the backend (comment.status + draft_status) onto
// the card states from the design. `skipped` covers BOTH a manual skip and
// the generator's auto-SKIP (reply_generator sets comment.status='skipped').
type CardState = "new" | "pending" | "approved" | "rejected" | "replied" | "skip";
function cardState(c: CommentSummary): CardState {
  if (c.status === "replied") return "replied";
  if (c.status === "skipped" || c.draft_is_skip === true) return "skip";
  if (c.ai_draft_id !== null && c.draft_text !== null) {
    if (c.draft_status === "approved") return "approved";
    if (c.draft_status === "rejected") return "rejected";
    return "pending";
  }
  return "new";
}

// Q77: the status bucket a comment falls in (approved/rejected fold into Draft).
function bucketOf(c: CommentSummary): "new" | "drafted" | "replied" | "skipped" {
  const s = cardState(c);
  if (s === "replied") return "replied";
  if (s === "skip") return "skipped";
  if (s === "new") return "new";
  return "drafted";
}

const BADGE = {
  new: { tone: "accent", labelKey: "replies.badge_new", dot: true },
  pending: { tone: "neutral", labelKey: "replies.badge_draft", dot: true },
  approved: { tone: "accent", labelKey: "replies.badge_approved", dot: true },
  rejected: { tone: "neutral", labelKey: "replies.badge_draft", dot: true },
  replied: { tone: "good", labelKey: "replies.filter_replied", dot: true },
  skip: { tone: "neutral", labelKey: "replies.filter_skipped", dot: false },
} as const satisfies Record<CardState, { tone: BadgeTone; labelKey: string; dot: boolean }>;

export default function RepliesPage() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const { checking } = useTesterGuard();
  const accountId = useSelectedAccountId();
  const [comments, setComments] = useState<CommentSummary[]>([]);
  const [filter, setFilter] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loaded, setLoaded] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);
  const [generatingId, setGeneratingId] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  // Inline edit of a pending reply draft: which comment, and the buffer.
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editBuffer, setEditBuffer] = useState("");
  // Committed edits per draft id (applied at approve time).
  const [edits, setEdits] = useState<Record<number, string>>({});
  const [publishTarget, setPublishTarget] = useState<{
    draftId: number;
    text: string;
  } | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  // Q18: master-detail — the post selected in the left list; the detail pane
  // shows that post's comments. The status `filter` is now per-post (client).
  const [selectedPost, setSelectedPost] = useState<number | null>(null);

  function toast(
    message: string,
    tone: Toast["tone"] = "success",
    opts?: { onUndo?: () => void; undoLabel?: string; duration?: number },
  ) {
    const id = Date.now() + Math.random();
    setToasts((s) => [
      ...s,
      { id, message, tone, onUndo: opts?.onUndo, undoLabel: opts?.undoLabel },
    ]);
    setTimeout(
      () => setToasts((s) => s.filter((x) => x.id !== id)),
      opts?.duration ?? 3500,
    );
    return id;
  }

  function dismissToast(id: number) {
    setToasts((s) => s.filter((x) => x.id !== id));
  }

  useEffect(() => {
    if (!getTokens()) router.push("/app/login");
  }, [router]);

  useEffect(() => {
    if (accountId === null) return;
    setLoaded(false);
    (async () => {
      try {
        // Q18: fetch all comments (no status param) — the status filter is now
        // client-side per selected post; status_counts stays account-wide.
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
  }, [accountId, router]);

  async function reload() {
    if (accountId === null) return;
    try {
      const list = await fetchComments(accountId, { limit: 50 });
      setComments(list.comments);
      setCounts(list.status_counts ?? {});
    } catch {
      // keep current list on a transient failure
    }
  }

  // Group the flat comment list by the post each comment sits under, so the
  // post-rail can offer "All posts" + one chip per post. Posts sort newest-first.
  const postGroups = useMemo<PostGroup[]>(() => {
    const map = new Map<number, PostGroup>();
    for (const c of comments) {
      let g = map.get(c.post_id);
      if (!g) {
        g = {
          postId: c.post_id,
          postText: c.post_text,
          postPublishedAt: c.post_published_at,
          postThreadsUrl: c.post_threads_url,
          comments: [],
        };
        map.set(c.post_id, g);
      }
      g.comments.push(c);
    }
    return [...map.values()].sort((a, b) => {
      const ta = a.postPublishedAt ? Date.parse(a.postPublishedAt) : 0;
      const tb = b.postPublishedAt ? Date.parse(b.postPublishedAt) : 0;
      return tb - ta;
    });
  }, [comments]);

  // Q18: keep a valid selected post — default to the newest, re-home if it left.
  useEffect(() => {
    if (postGroups.length === 0) {
      if (selectedPost !== null) setSelectedPost(null);
    } else if (
      selectedPost === null ||
      !postGroups.some((g) => g.postId === selectedPost)
    ) {
      setSelectedPost(postGroups[0].postId);
    }
  }, [postGroups, selectedPost]);

  const activeGroup =
    postGroups.find((g) => g.postId === selectedPost) ?? postGroups[0] ?? null;

  // Q77: per-post status buckets — `approved` folds into the Draft bucket.
  const postComments = activeGroup?.comments ?? [];
  const postCounts: Record<string, number> = { new: 0, drafted: 0, replied: 0, skipped: 0 };
  for (const c of postComments) postCounts[bucketOf(c)] += 1;
  const filteredComments =
    filter === null ? postComments : postComments.filter((c) => bucketOf(c) === filter);

  const needsCount = counts["new"] ?? 0;

  // Generate (also used to regenerate — the endpoint re-links a fresh draft).
  async function onGenerate(comment: CommentSummary) {
    setGeneratingId(comment.id);
    captureEvent("ui.reply_generate_clicked", { comment_id: comment.id });
    try {
      const reply = await generateReply(comment.id);
      toast(
        reply.is_skip
          ? t("replies.skipped")
          : `${t("dashboard.toast.generated")} · ${reply.text.length}`,
      );
      await reload();
    } catch (e) {
      toast(errMsg(e), "error");
    } finally {
      setGeneratingId(null);
    }
  }

  async function onApprove(comment: CommentSummary) {
    if (comment.ai_draft_id === null) return;
    const draftId = comment.ai_draft_id;
    const original = comment.draft_text ?? "";
    const localEdit = edits[draftId];
    const wasEdited =
      localEdit !== undefined && localEdit.trim() !== original.trim();
    setBusyId(comment.id);
    captureEvent("ui.reply_approve_clicked", {
      draft_id: draftId,
      edited: wasEdited,
    });
    try {
      await approveDraft(draftId, {
        editedText: wasEdited ? localEdit : undefined,
      });
      setEdits((e) => {
        const n = { ...e };
        delete n[draftId];
        return n;
      });
      toast(
        `#${draftId} ${
          wasEdited
            ? t("dashboard.toast.approved_edited")
            : t("dashboard.toast.approved_as_is")
        }`,
      );
      await reload();
    } catch (e) {
      toast(errMsg(e), "error");
    } finally {
      setBusyId(null);
    }
  }

  async function onPublishConfirm() {
    if (publishTarget === null) return;
    const { draftId } = publishTarget;
    setPublishing(true);
    captureEvent("ui.reply_publish_confirmed", { draft_id: draftId });
    try {
      const result = await publishDraft(draftId);
      toast(
        `#${draftId} ${t("dashboard.toast.published")} · ${result.threads_post_id}`,
      );
      setPublishTarget(null);
      await reload();
    } catch (e) {
      toast(errMsg(e), "error");
    } finally {
      setPublishing(false);
    }
  }

  // Skip the whole comment (won't reply) — reversible via restore.
  async function onSkip(comment: CommentSummary) {
    setBusyId(comment.id);
    captureEvent("ui.reply_skip_clicked", { comment_id: comment.id });
    // Q24: optimistically move the card to the skipped bucket for instant
    // feedback, then commit + reconcile. Undo restores via the existing
    // restore endpoint (skip ↔ restore is already bidirectional).
    setComments((cs) =>
      cs.map((c) => (c.id === comment.id ? { ...c, status: "skipped" } : c)),
    );
    try {
      await skipComment(comment.id);
      await reload();
      toast(t("replies.toast_skipped"), "success", {
        duration: UNDO_MS,
        undoLabel: t("common.undo"),
        onUndo: () => void onRestore(comment),
      });
    } catch (e) {
      setComments((cs) =>
        cs.map((c) => (c.id === comment.id ? { ...c, status: comment.status } : c)),
      );
      toast(errMsg(e), "error");
    } finally {
      setBusyId(null);
    }
  }

  async function onRestore(comment: CommentSummary) {
    setBusyId(comment.id);
    captureEvent("ui.reply_restore_clicked", { comment_id: comment.id });
    try {
      await restoreComment(comment.id);
      toast(t("replies.toast_restored"));
      await reload();
    } catch (e) {
      toast(errMsg(e), "error");
    } finally {
      setBusyId(null);
    }
  }

  function startEdit(comment: CommentSummary) {
    if (comment.ai_draft_id === null) return;
    setEditBuffer(edits[comment.ai_draft_id] ?? comment.draft_text ?? "");
    setEditingId(comment.id);
  }

  function saveEdit(comment: CommentSummary) {
    if (comment.ai_draft_id === null) return;
    const draftId = comment.ai_draft_id;
    const next = editBuffer;
    const original = comment.draft_text ?? "";
    setEdits((s) => {
      const n = { ...s };
      if (next.trim() && next.trim() !== original.trim()) n[draftId] = next;
      else delete n[draftId];
      return n;
    });
    setEditingId(null);
  }

  if (checking) return null;

  const pill =
    needsCount > 0 ? (
      <TopbarPill tone="accent">
        {needsCount} {t("replies.need_reply")}
      </TopbarPill>
    ) : undefined;

  if (bootError) {
    return (
      <div className="min-h-screen bg-bg text-text">
        <AppTopbar maxW="960px" title={t("replies.title")} />
        <main className="mx-auto max-w-[960px] px-5 py-7 md:px-6">
          <div className="rounded-lg border border-danger/40 bg-danger/10 p-4 text-small text-danger">
            {bootError}
          </div>
        </main>
      </div>
    );
  }

  // Empty-state copy per active filter (mirrors the design's EMPTY map).
  const emptyCopy: Record<string, { title: string; sub: string }> = {
    all: { title: t("replies.empty_all_title"), sub: t("replies.empty_all_sub") },
    new: { title: t("replies.empty_needs_title"), sub: t("replies.empty_needs_sub") },
    drafted: { title: t("replies.empty_drafts_title"), sub: t("replies.empty_drafts_sub") },
    replied: { title: t("replies.empty_replied_title"), sub: t("replies.empty_replied_sub") },
    skipped: { title: t("replies.empty_skipped_title"), sub: t("replies.empty_skipped_sub") },
  };
  const empty = emptyCopy[filter ?? "all"] ?? emptyCopy.all;

  return (
    <div className="min-h-screen bg-bg text-text">
      <AppTopbar maxW="960px" title={t("replies.title")} pill={pill} />
      <main className="mx-auto max-w-[960px] space-y-5 px-5 py-7 md:px-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-h1 font-semibold">{t("replies.title")}</h1>
          <p className="text-small text-text-muted">{t("replies.subtitle")}</p>
        </div>

        {!loaded && <p className="text-small text-text-muted">{t("common.loading")}</p>}

        {/* Q18: account-wide empty — no comments under any post yet. */}
        {loaded && postGroups.length === 0 && (
          <div className="flex flex-col items-center rounded-lg border border-dashed border-border px-6 py-16 text-center">
            <span className="mb-3 grid h-11 w-11 place-items-center rounded-full border border-border bg-surface-2 text-text-subtle">
              <IcReplies size={22} />
            </span>
            <p className="text-body font-semibold">{t("replies.empty_all_title")}</p>
            <p className="mt-1 max-w-[42ch] text-small leading-relaxed text-text-muted">
              {t("replies.empty_all_sub")}
            </p>
          </div>
        )}

        {/* Q18: master-detail — post list (left) drives the detail pane (right). */}
        {loaded && postGroups.length > 0 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[300px_minmax(0,1fr)]">
            <PostMaster
              groups={postGroups}
              selected={selectedPost}
              onSelect={(id) => {
                setSelectedPost(id);
                setFilter(null);
              }}
              cap={t("replies.posts_with_comments")}
              toAnswerLabel={t("replies.to_answer")}
              commentWord={t("replies.comments_word")}
              fmtTime={(iso) => relativeTime(iso, locale)}
            />

            <div className="min-w-0 space-y-4">
              {activeGroup && <PostContext group={activeGroup} locale={locale} t={t} />}

              {/* per-post status filter (Q77 buckets) */}
              <div
                role="tablist"
                aria-label={t("replies.title")}
                className="flex items-center gap-1 rounded-md border border-border bg-surface-2 p-1"
              >
                {FILTER_TABS.map((tab) => {
                  const n = tab.key === null ? postComments.length : postCounts[tab.key] ?? 0;
                  const active = filter === tab.key;
                  return (
                    <button
                      key={tab.key ?? "all"}
                      role="tab"
                      aria-selected={active}
                      onClick={() => setFilter(tab.key)}
                      className={cn(
                        "inline-flex h-9 min-w-0 flex-1 items-center justify-center gap-2 rounded-sm border border-transparent px-2.5 text-small font-medium whitespace-nowrap text-text-muted transition-colors hover:text-text",
                        active && "border-border bg-surface font-semibold text-text shadow-sm",
                      )}
                    >
                      <span className={cn("h-[7px] w-[7px] shrink-0 rounded-full", tab.dot)} />
                      <span className="truncate">{t(tab.labelKey)}</span>
                      <span
                        className={cn(
                          "text-caption font-semibold tabular-nums",
                          active ? "text-text-muted" : "text-text-subtle",
                        )}
                      >
                        {n}
                      </span>
                    </button>
                  );
                })}
              </div>

              {filteredComments.length === 0 ? (
                <div className="flex flex-col items-center rounded-lg border border-dashed border-border px-6 py-14 text-center">
                  <span className="mb-3 grid h-11 w-11 place-items-center rounded-full border border-border bg-surface-2 text-text-subtle">
                    <IcReplies size={22} />
                  </span>
                  <p className="text-body font-semibold">{empty.title}</p>
                  <p className="mt-1 max-w-[42ch] text-small leading-relaxed text-text-muted">
                    {empty.sub}
                  </p>
                </div>
              ) : (
                <ul className="space-y-3.5">
                  {filteredComments.map((c) => {
                  const state = cardState(c);
                  const draftId = c.ai_draft_id;
                  const generating = generatingId === c.id;
                  const busy = busyId === c.id;
                  const editing = editingId === c.id;
                  const displayText =
                    draftId !== null ? edits[draftId] ?? c.draft_text ?? "" : "";
                  const isEdited =
                    draftId !== null &&
                    edits[draftId] !== undefined &&
                    edits[draftId].trim() !== (c.draft_text ?? "").trim();
                  const badge = BADGE[state];

                  return (
                    <li
                      key={c.id}
                      className={cn(
                        "rounded-lg border border-border bg-surface p-4 shadow-sm transition-colors hover:border-text/15",
                        state === "skip" && "opacity-[0.66]",
                      )}
                      style={{ animation: "card-in 240ms var(--ease-entrance) both" }}
                    >
                      {/* comment head: author + status badge (the post context
                          lives in the PostContext header above the list now) */}
                      <div className="flex items-center gap-2.5">
                        <Mono text={(c.author_username?.[0] ?? "@").toUpperCase()} size={34} />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-small font-semibold leading-tight">
                            @{c.author_username ?? "—"}
                          </div>
                          {c.published_at && (
                            <div className="text-caption text-text-subtle">
                              {relativeTime(c.published_at, locale)}
                            </div>
                          )}
                        </div>
                        <Badge tone={badge.tone} dot={badge.dot}>
                          {t(badge.labelKey)}
                        </Badge>
                      </div>

                      {/* the comment body */}
                      <p className="mt-2.5 whitespace-pre-wrap text-body leading-relaxed text-text">
                        {c.text ?? ""}
                      </p>
                      {c.text && (
                        <div className="mt-2">
                          <TranslateButton text={c.text} source="comment" />
                        </div>
                      )}

                      {/* threaded reply block */}
                      {generating ? (
                        <ReplyThread>
                          <div className="flex flex-col gap-2.5">
                            <Skeleton className="h-3 w-[88%]" />
                            <Skeleton className="h-3 w-[55%]" />
                            <span className="mt-0.5 inline-flex items-center gap-1.5 text-caption text-accent">
                              <IcNib size={13} />
                              {t("replies.drafting")}
                            </span>
                          </div>
                        </ReplyThread>
                      ) : (
                        (state === "pending" || state === "approved" || state === "replied") && (
                          <ReplyThread replied={state === "replied"}>
                            <div className="mb-2 flex items-center gap-2">
                              <Mono text={t("replies.you").slice(0, 1)} size={22} />
                              <span className="text-small font-semibold">{t("replies.you")}</span>
                              {state === "pending" && (
                                <span className="inline-flex items-center gap-1.5 text-caption text-text-subtle">
                                  <IcNib size={12} />
                                  {t("replies.tag_drafted")}
                                </span>
                              )}
                              {state === "approved" && (
                                <span className="inline-flex items-center gap-1.5 text-caption text-accent">
                                  <IcCheck size={12} />
                                  {t("replies.tag_approved")}
                                </span>
                              )}
                              {state === "replied" && (
                                <span className="inline-flex items-center gap-1.5 text-caption text-success">
                                  <IcCheck size={12} />
                                  {t("replies.replied")}
                                  {c.replied_at && ` · ${relativeTime(c.replied_at, locale)}`}
                                </span>
                              )}
                              {/* Q3: the reply went out via the Autopilot sweep. */}
                              {state === "replied" && c.auto_replied && (
                                <span className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/12 px-2 py-px text-caption font-medium text-accent">
                                  <IcReply size={11} />
                                  {t("replies.auto_replied")}
                                </span>
                              )}
                            </div>

                            {state === "pending" && editing ? (
                              <>
                                <textarea
                                  value={editBuffer}
                                  autoFocus
                                  onChange={(e) => setEditBuffer(e.target.value)}
                                  rows={Math.min(
                                    10,
                                    Math.max(2, editBuffer.split("\n").length + 1),
                                  )}
                                  className="w-full resize-y rounded-sm border border-accent bg-surface px-3 py-2 text-small leading-relaxed text-text shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-accent)_16%,transparent)] outline-none"
                                />
                                <div className="mt-1.5 flex justify-end">
                                  <span
                                    className={cn(
                                      "text-caption tabular-nums text-text-subtle",
                                      editBuffer.length > REPLY_LIMIT && "font-semibold text-danger",
                                    )}
                                  >
                                    {editBuffer.length} / {REPLY_LIMIT}
                                  </span>
                                </div>
                              </>
                            ) : (
                              <>
                                <p className="whitespace-pre-wrap text-small leading-relaxed text-text">
                                  {state === "replied" ? c.draft_text ?? "" : displayText}
                                </p>
                                {/* Q10: translate the reply draft to the UI locale. */}
                                {(state === "replied" ? c.draft_text : displayText) && (
                                  <div className="mt-2">
                                    <TranslateButton
                                      text={(state === "replied" ? c.draft_text : displayText) ?? ""}
                                      source="reply"
                                    />
                                  </div>
                                )}
                              </>
                            )}
                          </ReplyThread>
                        )
                      )}

                      {/* footer: meta (left) + actions (right) */}
                      {!generating && (
                        <div className="mt-3.5 flex items-center gap-3 border-t border-border pt-3.5">
                          <div className="flex min-w-0 flex-1 items-center gap-3 text-caption text-text-subtle">
                            {state === "replied" ? (
                              <span className="inline-flex items-center gap-1.5">
                                <IcCheck size={13} />
                                {t("replies.published")}
                                {c.replied_at && ` · ${relativeTime(c.replied_at, locale)}`}
                              </span>
                            ) : (
                              c.comment_url && (
                                <a
                                  href={c.comment_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 underline-offset-2 hover:text-text hover:underline"
                                >
                                  <IcExternal size={13} />
                                  {t("replies.view_comment")}
                                </a>
                              )
                            )}
                          </div>

                          <div className="flex shrink-0 items-center gap-2">
                            {/* editing a pending draft */}
                            {editing && state === "pending" ? (
                              <>
                                <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                                  {t("common.cancel")}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="primary"
                                  onClick={() => saveEdit(c)}
                                  disabled={
                                    editBuffer.trim().length === 0 ||
                                    editBuffer.length > REPLY_LIMIT
                                  }
                                  icon={<IcCheck size={15} />}
                                >
                                  {t("common.save")}
                                </Button>
                              </>
                            ) : (
                              <>
                                {(state === "new" || state === "rejected") && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => onSkip(c)}
                                      disabled={busy}
                                      icon={<IcSkip size={15} />}
                                    >
                                      {t("replies.skip")}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="primary"
                                      onClick={() => onGenerate(c)}
                                      disabled={generating}
                                      icon={<IcNib size={15} />}
                                    >
                                      {t("replies.generate")}
                                    </Button>
                                  </>
                                )}

                                {state === "pending" && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => onSkip(c)}
                                      disabled={busy}
                                      aria-label={t("replies.skip")}
                                      title={t("replies.skip")}
                                      icon={<IcSkip size={15} />}
                                    />
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => onGenerate(c)}
                                      disabled={busy}
                                      icon={<IcTweak size={15} />}
                                    >
                                      {t("replies.regenerate")}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      onClick={() => startEdit(c)}
                                      disabled={busy}
                                      icon={<IcPencil size={15} />}
                                    >
                                      {t("dashboard.draft.edit")}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="primary"
                                      onClick={() => onApprove(c)}
                                      disabled={busy}
                                      icon={<IcCheck size={15} />}
                                    >
                                      {isEdited
                                        ? t("dashboard.draft.approve_edited")
                                        : t("dashboard.draft.approve")}
                                    </Button>
                                  </>
                                )}

                                {state === "approved" && (
                                  <Button
                                    size="sm"
                                    variant="primary"
                                    onClick={() =>
                                      setPublishTarget({
                                        draftId: draftId!,
                                        text: c.draft_text ?? "",
                                      })
                                    }
                                    icon={<IcReply size={15} />}
                                  >
                                    {t("dashboard.draft.publish")}
                                  </Button>
                                )}

                                {state === "skip" && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => onRestore(c)}
                                    disabled={busy}
                                    icon={<IcUndo size={15} />}
                                  >
                                    {t("replies.restore")}
                                  </Button>
                                )}

                                {state === "replied" && (c.comment_url || c.post_threads_url) && (
                                  <a
                                    href={(c.comment_url || c.post_threads_url)!}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={buttonClasses({ variant: "secondary", size: "sm" })}
                                  >
                                    <IcExternal size={15} />
                                    {t("replies.open_thread")}
                                  </a>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
              )}
            </div>
          </div>
        )}
      </main>

      <PublishConfirmModal
        open={publishTarget !== null}
        text={publishTarget?.text ?? ""}
        isPublishing={publishing}
        onClose={() => {
          if (!publishing) setPublishTarget(null);
        }}
        onConfirm={onPublishConfirm}
      />

      <ToastHost>
        {toasts.map((tt) => (
          <Toast
            key={tt.id}
            tone={tt.tone}
            title={tt.message}
            undoLabel={tt.undoLabel}
            onUndo={
              tt.onUndo
                ? () => {
                    tt.onUndo?.();
                    dismissToast(tt.id);
                  }
                : undefined
            }
          />
        ))}
      </ToastHost>
    </div>
  );
}

// Threaded reply container — a vertical connector line + an inset block,
// mirroring the design's .reply-thread / .reply-block.
function ReplyThread({
  children,
  replied = false,
}: {
  children: ReactNode;
  replied?: boolean;
}) {
  return (
    <div className="relative mt-3.5 pl-[26px]">
      <span className="absolute bottom-4 left-[11px] top-0 w-0.5 rounded bg-border" aria-hidden />
      <div
        className={cn(
          "rounded-md border border-border bg-surface-2 p-3.5",
          replied && "border-success/30",
        )}
      >
        {children}
      </div>
    </div>
  );
}

// Q18 master pane: the posts that have comments (newest first). Each row shows
// the post text, time, comment count, and an unanswered-count badge; selecting
// one drives the detail pane.
function PostMaster({
  groups,
  selected,
  onSelect,
  cap,
  toAnswerLabel,
  commentWord,
  fmtTime,
}: {
  groups: PostGroup[];
  selected: number | null;
  onSelect: (id: number) => void;
  cap: string;
  toAnswerLabel: string;
  commentWord: string;
  fmtTime: (iso: string) => string;
}) {
  return (
    <aside className="md:sticky md:top-3 md:self-start">
      <div className="mb-2 px-1 text-caption font-semibold uppercase tracking-wide text-text-subtle">
        {cap}
      </div>
      <div
        role="listbox"
        aria-label={cap}
        className="flex flex-col gap-2 md:max-h-[calc(100vh-150px)] md:overflow-y-auto md:pr-1"
      >
        {groups.map((g) => {
          const unanswered = g.comments.filter((c) => bucketOf(c) === "new").length;
          const active = selected === g.postId;
          return (
            <button
              key={g.postId}
              role="option"
              aria-selected={active}
              onClick={() => onSelect(g.postId)}
              className={cn(
                "flex flex-col gap-2 rounded-lg border p-3 text-left transition-colors",
                active
                  ? "border-accent/55 bg-surface-2 shadow-sm"
                  : "border-border bg-surface hover:bg-surface-2",
              )}
            >
              <span className={cn("line-clamp-2 text-small leading-snug text-text", active && "font-semibold")}>
                {g.postText || `#${g.postId}`}
              </span>
              <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-caption text-text-subtle">
                {g.postPublishedAt && (
                  <span className="whitespace-nowrap">{fmtTime(g.postPublishedAt)}</span>
                )}
                <span>·</span>
                <span className="whitespace-nowrap">
                  {g.comments.length} {commentWord}
                </span>
                {unanswered > 0 && (
                  <span className="rounded-full border border-accent/30 bg-accent/12 px-1.5 py-px font-semibold text-accent">
                    {unanswered} {toAnswerLabel}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

// Q18 detail header: the post the comments below sit under.
function PostContext({
  group,
  locale,
  t,
}: {
  group: PostGroup;
  locale: string;
  t: (k: MessageKey) => string;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface-2 p-4">
      <div className="text-caption font-semibold uppercase tracking-wide text-text-subtle">
        {t("replies.replying_under")}
      </div>
      <p className="mt-1.5 whitespace-pre-wrap text-small leading-relaxed text-text">
        {group.postText || `#${group.postId}`}
      </p>
      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-text-subtle">
        {group.postPublishedAt && <span>{relativeTime(group.postPublishedAt, locale)}</span>}
        {group.postThreadsUrl && (
          <a
            href={group.postThreadsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 underline-offset-2 hover:text-text hover:underline"
          >
            <IcExternal size={13} />
            {t("replies.open_thread")}
          </a>
        )}
      </div>
    </div>
  );
}

// Localized relative time ("2 hours ago"), falling back to a medium date past
// a week. Mirrors the Mentions screen for consistency.
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

function errMsg(e: unknown): string {
  if (e instanceof ApiError) {
    const detail =
      typeof e.detail === "object" &&
      e.detail !== null &&
      "detail" in (e.detail as Record<string, unknown>)
        ? (e.detail as { detail: unknown }).detail
        : e.detail;
    return `${e.status}: ${String(detail)}`;
  }
  return String(e);
}
