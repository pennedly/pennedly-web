"use client";

// Reply queue — comments under the user's own posts. For each comment you
// generate an AI reply in your voice, review/edit it, approve, then
// publish it threaded under the comment. The queue is filled hourly by
// the ingest_comments worker; this is the manual-reply surface for the
// threads_manage_replies permission. Mirrors the dashboard draft flow:
// generate → edit → approve → publish.

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  ApiError,
  approveDraft,
  clearTokens,
  dismissComment,
  fetchComments,
  generateReply,
  getTokens,
  publishDraft,
  rejectDraft,
} from "@/lib/api";
import { captureEvent } from "@/lib/analytics";
import { useSelectedAccountId } from "@/lib/account";
import { useTranslation } from "@/lib/i18n";
import { PublishConfirmModal } from "@/components/PublishConfirmModal";
import { TranslateButton } from "@/components/TranslateButton";
import { useTesterGuard } from "@/lib/tester";
import type { CommentSummary } from "@/lib/types";

type Toast = { id: number; message: string; tone: "success" | "error" };

// E: one post + every comment sitting under it (master-detail grouping).
type PostGroup = {
  postId: number;
  postText: string | null;
  postPublishedAt: string | null;
  postThreadsUrl: string | null;
  comments: CommentSummary[];
};

// Comments still awaiting action (a fresh comment or an AI draft to review).
// Drives the unanswered-count badge on each post in the picker.
function pendingCount(comments: CommentSummary[]): number {
  return comments.filter(
    (c) => c.status === "new" || c.status === "drafted",
  ).length;
}

// Reply-queue filter tabs. `key` is the comment `status` passed to the API
// (null = all). new = needs a reply, drafted = AI reply awaiting review,
// replied = answered, skipped = autopilot/generator blocked it.
const FILTER_TABS = [
  { key: null, labelKey: "replies.filter_all" },
  { key: "new", labelKey: "replies.filter_new" },
  { key: "drafted", labelKey: "replies.filter_drafted" },
  { key: "replied", labelKey: "replies.filter_replied" },
  { key: "skipped", labelKey: "replies.filter_skipped" },
] as const;

export default function RepliesPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { checking } = useTesterGuard();
  const accountId = useSelectedAccountId();
  const [comments, setComments] = useState<CommentSummary[]>([]);
  const [filter, setFilter] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loaded, setLoaded] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);
  const [generatingId, setGeneratingId] = useState<number | null>(null);
  const [busyDraftId, setBusyDraftId] = useState<number | null>(null);
  const [edits, setEdits] = useState<Record<number, string>>({});
  const [publishTarget, setPublishTarget] = useState<{
    draftId: number;
    text: string;
  } | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [confirmDismissId, setConfirmDismissId] = useState<number | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  // E: master-detail — which post's replies the right column shows.
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);

  function toast(message: string, tone: Toast["tone"] = "success") {
    const id = Date.now() + Math.random();
    setToasts((s) => [...s, { id, message, tone }]);
    setTimeout(() => setToasts((s) => s.filter((x) => x.id !== id)), 3500);
  }

  useEffect(() => {
    if (!getTokens()) router.push("/app/login");
  }, [router]);

  useEffect(() => {
    if (accountId === null) return;
    setLoaded(false);
    (async () => {
      try {
        const list = await fetchComments(accountId, {
          limit: 50,
          status: filter ?? undefined,
        });
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
  }, [accountId, filter, router]);

  async function reload() {
    if (accountId === null) return;
    try {
      const list = await fetchComments(accountId, {
        limit: 50,
        status: filter ?? undefined,
      });
      setComments(list.comments);
      setCounts(list.status_counts ?? {});
    } catch {
      // keep current list on a transient failure
    }
  }

  // E: group the flat comment list by the post each comment sits under, so
  // the UI can show a post picker (left) → that post's replies (right)
  // instead of one undifferentiated column. Posts sort newest-first.
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

  // Keep a valid post selected as the (filtered) group list changes.
  useEffect(() => {
    if (postGroups.length === 0) {
      if (selectedPostId !== null) setSelectedPostId(null);
      return;
    }
    if (
      selectedPostId === null ||
      !postGroups.some((g) => g.postId === selectedPostId)
    ) {
      setSelectedPostId(postGroups[0].postId);
    }
  }, [postGroups, selectedPostId]);

  const selectedGroup =
    postGroups.find((g) => g.postId === selectedPostId) ?? null;

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
    setBusyDraftId(draftId);
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
      setBusyDraftId(null);
    }
  }

  async function onReject(comment: CommentSummary) {
    if (comment.ai_draft_id === null) return;
    const draftId = comment.ai_draft_id;
    setBusyDraftId(draftId);
    captureEvent("ui.reply_reject_clicked", { draft_id: draftId });
    try {
      await rejectDraft(draftId);
      toast(`#${draftId} ${t("dashboard.toast.rejected")}`);
      await reload();
    } catch (e) {
      toast(errMsg(e), "error");
    } finally {
      setBusyDraftId(null);
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

  async function onDismiss(comment: CommentSummary) {
    setConfirmDismissId(null);
    const prev = comments;
    setComments((s) => s.filter((x) => x.id !== comment.id)); // optimistic
    captureEvent("ui.reply_dismiss_clicked", { comment_id: comment.id });
    try {
      await dismissComment(comment.id);
      toast(t("replies.toast_dismissed"));
    } catch (e) {
      setComments(prev); // restore on failure
      toast(errMsg(e), "error");
    }
  }

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
            {t("replies.title")}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">{t("replies.subtitle")}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {FILTER_TABS.map((tab) => {
            const n =
              tab.key === null
                ? Object.values(counts).reduce((a, b) => a + b, 0)
                : counts[tab.key] ?? 0;
            const active = filter === tab.key;
            return (
              <button
                key={tab.key ?? "all"}
                onClick={() => setFilter(tab.key)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  active
                    ? "bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100"
                    : "border-border text-text-muted hover:bg-surface-2"
                }`}
              >
                {t(tab.labelKey)}
                {n > 0 && <span className="ml-1.5 opacity-60">{n}</span>}
              </button>
            );
          })}
        </div>

        {!loaded && (
          <p className="text-sm text-zinc-500">{t("common.loading")}</p>
        )}

        {loaded && comments.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <p className="text-sm text-zinc-500">{t("replies.empty")}</p>
          </div>
        )}

        {loaded && comments.length > 0 && (
          <div className="grid gap-6 md:grid-cols-[300px_1fr] items-start">
            {/* Post picker (master) — select a post to see its replies */}
            <aside className="md:sticky md:top-6 space-y-2">
              <p className="px-1 text-xs font-medium uppercase tracking-wide text-zinc-400">
                {t("replies.posts_column")}
              </p>
              {postGroups.length === 0 ? (
                <p className="px-1 text-sm text-zinc-500">
                  {t("replies.no_posts")}
                </p>
              ) : (
                <ul className="space-y-1.5 pr-1 md:max-h-[calc(100vh-12rem)] md:overflow-auto">
                  {postGroups.map((g) => {
                    const active = g.postId === selectedPostId;
                    const pending = pendingCount(g.comments);
                    return (
                      <li key={g.postId}>
                        <button
                          onClick={() => setSelectedPostId(g.postId)}
                          className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                            active
                              ? "border-primary bg-surface-2"
                              : "border-border bg-surface hover:bg-surface-2"
                          }`}
                        >
                          <p className="line-clamp-2 text-sm text-text">
                            {g.postText || `#${g.postId}`}
                          </p>
                          <div className="mt-1 flex items-center gap-2 text-xs text-zinc-400">
                            <span className="truncate">
                              {fmtDateTime(g.postPublishedAt)}
                            </span>
                            <span className="ml-auto shrink-0">
                              {g.comments.length} 💬
                            </span>
                            {pending > 0 && (
                              <span className="inline-flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                                {pending}
                              </span>
                            )}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </aside>

            {/* Selected post's replies (detail) */}
            <section className="min-w-0 space-y-4">
              {selectedGroup === null ? (
                <p className="text-sm text-zinc-500">
                  {t("replies.select_post")}
                </p>
              ) : (
                <>
                  {/* Parent post context — text, publish time, open link */}
                  <div className="rounded-xl border border-border bg-surface-2 p-4">
                    <div className="mb-1.5 flex items-center gap-2 text-xs text-zinc-400">
                      <span className="shrink-0">{t("replies.under_post")}</span>
                      {selectedGroup.postPublishedAt && (
                        <span className="shrink-0">
                          · {fmtDateTime(selectedGroup.postPublishedAt)}
                        </span>
                      )}
                      {selectedGroup.postThreadsUrl && (
                        <a
                          href={selectedGroup.postThreadsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-auto shrink-0 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:underline"
                        >
                          {t("feed.open")}
                        </a>
                      )}
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-text">
                      {selectedGroup.postText || `#${selectedGroup.postId}`}
                    </p>
                  </div>

                  <ul className="space-y-4">
                    {selectedGroup.comments.map((c) => {
            const draftId = c.ai_draft_id;
            const isReplied = c.status === "replied";
            const isSkip = c.draft_is_skip === true;
            const hasDraft =
              draftId !== null && c.draft_text !== null && !isSkip;
            const currentText =
              draftId !== null ? edits[draftId] ?? c.draft_text ?? "" : "";
            const isEdited =
              draftId !== null &&
              edits[draftId] !== undefined &&
              edits[draftId].trim() !== (c.draft_text ?? "").trim();
            const busy = draftId !== null && busyDraftId === draftId;

            return (
              <li
                key={c.id}
                className="rounded-xl border border-border bg-surface p-4 shadow-sm"
              >
                {/* The original comment */}
                <div className="flex items-center justify-between mb-2 text-xs text-zinc-500">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-medium text-text truncate">
                      @{c.author_username ?? "—"}
                    </span>
                    {c.published_at && (
                      <>
                        <span className="text-zinc-400">·</span>
                        <span className="truncate">
                          {fmtDateTime(c.published_at)}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {c.comment_url && (
                      <a
                        href={c.comment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 underline-offset-2 hover:underline"
                      >
                        {t("replies.view_comment")} ↗
                      </a>
                    )}
                    {confirmDismissId === c.id ? (
                      <span className="flex items-center gap-2">
                        <span className="text-zinc-500">
                          {t("replies.confirm_dismiss")}
                        </span>
                        <button
                          onClick={() => onDismiss(c)}
                          className="text-red-600 dark:text-red-400 font-medium hover:underline"
                        >
                          {t("replies.dismiss")}
                        </button>
                        <button
                          onClick={() => setConfirmDismissId(null)}
                          className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                        >
                          {t("common.cancel")}
                        </button>
                      </span>
                    ) : (
                      <button
                        onClick={() => setConfirmDismissId(c.id)}
                        title={t("replies.dismiss")}
                        aria-label={t("replies.dismiss")}
                        className="text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
                <blockquote className="border-l-2 border-border pl-3 text-sm leading-relaxed text-text whitespace-pre-wrap">
                  {c.text ?? ""}
                </blockquote>
                {c.text && (
                  <div className="mt-2">
                    <TranslateButton text={c.text} source="comment" />
                  </div>
                )}

                {/* Reply workflow */}
                <div className="mt-3 pt-3 border-t border-border">
                  {isReplied ? (
                    <div>
                      <div className="flex items-center gap-2 mb-1.5 text-xs">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                          {t("replies.replied")}
                        </span>
                        {c.replied_at && (
                          <span className="text-zinc-400">
                            {fmtDateTime(c.replied_at)}
                          </span>
                        )}
                        {(c.comment_url || c.post_threads_url) && (
                          <a
                            href={(c.comment_url || c.post_threads_url)!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-auto text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:underline"
                          >
                            {t("replies.open_thread")}
                          </a>
                        )}
                      </div>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-text">
                        {c.draft_text ?? ""}
                      </p>
                    </div>
                  ) : isSkip ? (
                    <p className="text-sm text-zinc-500 italic">
                      {t("replies.skipped")}
                    </p>
                  ) : hasDraft && c.draft_status === "approved" ? (
                    <div>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed mb-3">
                        {c.draft_text ?? ""}
                      </p>
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          onClick={() =>
                            setPublishTarget({
                              draftId: draftId!,
                              text: c.draft_text ?? "",
                            })
                          }
                          className="text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                        >
                          {t("dashboard.draft.publish")}
                        </button>
                        <div className="ml-auto">
                          <TranslateButton
                            text={c.draft_text ?? ""}
                            source="reply_approved"
                          />
                        </div>
                      </div>
                    </div>
                  ) : hasDraft && c.draft_status === "rejected" ? (
                    <button
                      onClick={() => onGenerate(c)}
                      disabled={generatingId === c.id}
                      className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-md border border-border text-text hover:bg-surface-2 disabled:opacity-50 transition-colors"
                    >
                      {generatingId === c.id && (
                        <span
                          className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"
                          aria-hidden
                        />
                      )}
                      {generatingId === c.id
                        ? t("dashboard.generate.generating")
                        : t("replies.generate")}
                    </button>
                  ) : hasDraft ? (
                    // pending draft — editable
                    <div>
                      <textarea
                        value={currentText}
                        onChange={(e) =>
                          setEdits((s) => ({ ...s, [draftId!]: e.target.value }))
                        }
                        rows={Math.min(
                          10,
                          Math.max(2, currentText.split("\n").length + 1),
                        )}
                        className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-700 resize-y mb-2"
                      />
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          onClick={() => onApprove(c)}
                          disabled={busy}
                          className="text-xs px-3 py-1.5 rounded-md bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 transition-colors"
                        >
                          {isEdited
                            ? t("dashboard.draft.approve_edited")
                            : t("dashboard.draft.approve")}
                        </button>
                        <button
                          onClick={() => onReject(c)}
                          disabled={busy}
                          className="text-xs px-3 py-1.5 rounded-md border border-border text-text hover:bg-surface-2 disabled:opacity-50 transition-colors"
                        >
                          {t("dashboard.draft.reject")}
                        </button>
                        {isEdited && (
                          <button
                            onClick={() =>
                              setEdits((s) => {
                                const n = { ...s };
                                delete n[draftId!];
                                return n;
                              })
                            }
                            className="text-xs px-2 py-1 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                          >
                            {t("common.revert")}
                          </button>
                        )}
                        <div className="ml-auto">
                          <TranslateButton
                            text={currentText}
                            source="reply_draft"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    // new — no draft yet
                    <button
                      onClick={() => onGenerate(c)}
                      disabled={generatingId === c.id}
                      className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                    >
                      {generatingId === c.id && (
                        <span
                          className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"
                          aria-hidden
                        />
                      )}
                      {generatingId === c.id
                        ? t("dashboard.generate.generating")
                        : t("replies.generate")}
                    </button>
                  )}
                </div>
                      </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </section>
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

// D: date AND time (the reply queue previously showed date only). Matches
// the feed's format for consistency.
function fmtDateTime(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
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
