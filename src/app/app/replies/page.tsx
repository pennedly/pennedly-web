"use client";

// Reply queue — comments under the user's own posts. For each comment you
// generate an AI reply in your voice, review/edit it, approve, then
// publish it threaded under the comment. The queue is filled hourly by
// the ingest_comments worker; this is the manual-reply surface for the
// threads_manage_replies permission. Mirrors the dashboard draft flow:
// generate → edit → approve → publish.

import Link from "next/link";
import { useEffect, useState } from "react";
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

export default function RepliesPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { checking } = useTesterGuard();
  const accountId = useSelectedAccountId();
  const [comments, setComments] = useState<CommentSummary[]>([]);
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
        const list = await fetchComments(accountId, { limit: 50 });
        setComments(list.comments);
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
    } catch {
      // keep current list on a transient failure
    }
  }

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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("replies.title")}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">{t("replies.subtitle")}</p>
        </div>

        {!loaded && (
          <p className="text-sm text-zinc-500">{t("common.loading")}</p>
        )}

        {loaded && comments.length === 0 && (
          <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 p-8 text-center">
            <p className="text-sm text-zinc-500">{t("replies.empty")}</p>
          </div>
        )}

        <ul className="space-y-4">
          {comments.map((c) => {
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
                className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm"
              >
                {/* Which post this comment is under */}
                {c.post_text && (
                  <div className="mb-2 flex items-center gap-1.5 text-xs text-zinc-500 min-w-0">
                    <span className="shrink-0 text-zinc-400">
                      {t("replies.under_post")}
                    </span>
                    {c.post_threads_url ? (
                      <a
                        href={c.post_threads_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate text-zinc-600 dark:text-zinc-400 hover:underline"
                      >
                        {c.post_text}
                      </a>
                    ) : (
                      <span className="truncate text-zinc-600 dark:text-zinc-400">
                        {c.post_text}
                      </span>
                    )}
                    {c.post_published_at && (
                      <span className="shrink-0 text-zinc-400">
                        · {fmtDate(c.post_published_at)}
                      </span>
                    )}
                  </div>
                )}

                {/* The original comment */}
                <div className="flex items-center justify-between mb-2 text-xs text-zinc-500">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-medium text-zinc-700 dark:text-zinc-300 truncate">
                      @{c.author_username ?? "—"}
                    </span>
                    {c.published_at && (
                      <>
                        <span className="text-zinc-400">·</span>
                        <span className="truncate">
                          {fmtDate(c.published_at)}
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
                <blockquote className="border-l-2 border-zinc-200 dark:border-zinc-700 pl-3 text-sm leading-relaxed text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap">
                  {c.text ?? ""}
                </blockquote>
                {c.text && (
                  <div className="mt-2">
                    <TranslateButton text={c.text} source="comment" />
                  </div>
                )}

                {/* Reply workflow */}
                <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  {isReplied ? (
                    <div>
                      <div className="flex items-center gap-2 mb-1.5 text-xs">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                          {t("replies.replied")}
                        </span>
                        {c.replied_at && (
                          <span className="text-zinc-400">
                            {fmtDate(c.replied_at)}
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
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
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
                          className="text-xs px-3 py-1.5 rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-white transition-colors"
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
                      className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-md border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 transition-colors"
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
                        className="w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-700 resize-y mb-2"
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
                          className="text-xs px-3 py-1.5 rounded-md border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 transition-colors"
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
                      className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-white disabled:opacity-50 transition-colors"
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

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString();
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
