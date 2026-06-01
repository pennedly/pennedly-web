"use client";

// Reply queue — comments under the user's own posts. For each comment you
// generate an AI reply in your voice, review/edit it, approve, then
// publish it threaded under the comment. The queue is filled hourly by
// the ingest_comments worker; this is the manual-reply surface for the
// threads_manage_replies permission. Mirrors the dashboard draft flow:
// generate → edit → approve → publish.
//
// Layout follows design-export/PennedlyDesign/replies-* (the rail variant):
// a single feed of comment cards, with a status filter + a horizontal
// post-rail above it. Each card carries its own "on your post" context
// inset and an in-card threaded reply block. Logic/data flow are unchanged
// from the master-detail version — this is a presentation restyle.

import { useEffect, useMemo, useState, type ReactNode } from "react";
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
  IcReplies,
  IcReply,
  IcSkip,
} from "@/components/icons";
import type { CommentSummary } from "@/lib/types";

type Toast = { id: number; message: string; tone: "success" | "error" };

const REPLY_LIMIT = 500;

// E: one post + every comment sitting under it (master-detail grouping),
// reused here to build the post-rail and "all posts" count.
type PostGroup = {
  postId: number;
  postText: string | null;
  postPublishedAt: string | null;
  postThreadsUrl: string | null;
  comments: CommentSummary[];
};

// Reply-queue filter tabs. `key` is the comment `status` passed to the API
// (null = all). new = needs a reply, drafted = AI reply awaiting review,
// replied = answered, skipped = autopilot/generator blocked it. `dot` is the
// status-dot colour (a Tailwind bg-* token) shown on each tab.
const FILTER_TABS = [
  { key: null, labelKey: "replies.filter_all", dot: "bg-text-subtle" },
  { key: "new", labelKey: "replies.filter_new", dot: "bg-accent" },
  { key: "drafted", labelKey: "replies.filter_drafted", dot: "bg-text-muted" },
  { key: "replied", labelKey: "replies.filter_replied", dot: "bg-success" },
  { key: "skipped", labelKey: "replies.filter_skipped", dot: "bg-text-subtle" },
] as const;

// Which design "state" a comment is in — drives badge, reply thread and the
// footer action set. Maps the backend (comment.status + draft_status +
// draft_is_skip) onto the five card states from the design.
type CardState = "new" | "pending" | "approved" | "rejected" | "replied" | "skip";
function cardState(c: CommentSummary): CardState {
  if (c.status === "replied") return "replied";
  if (c.draft_is_skip === true) return "skip";
  if (c.ai_draft_id !== null && c.draft_text !== null) {
    if (c.draft_status === "approved") return "approved";
    if (c.draft_status === "rejected") return "rejected";
    return "pending";
  }
  return "new";
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
  const [busyDraftId, setBusyDraftId] = useState<number | null>(null);
  const [edits, setEdits] = useState<Record<number, string>>({});
  const [publishTarget, setPublishTarget] = useState<{
    draftId: number;
    text: string;
  } | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [confirmDismissId, setConfirmDismissId] = useState<number | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  // E: post-rail filter — "all" or a specific post id (client-side narrowing
  // of the already status-filtered list).
  const [postFilter, setPostFilter] = useState<number | "all">("all");

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

  // Drop the post filter if the selected post left the (re-filtered) list.
  useEffect(() => {
    if (postFilter !== "all" && !postGroups.some((g) => g.postId === postFilter)) {
      setPostFilter("all");
    }
  }, [postGroups, postFilter]);

  const visible =
    postFilter === "all"
      ? comments
      : comments.filter((c) => c.post_id === postFilter);

  const needsCount = counts["new"] ?? 0;

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

  const pill =
    needsCount > 0 ? (
      <TopbarPill tone="accent">
        {needsCount} {t("replies.need_reply")}
      </TopbarPill>
    ) : undefined;

  if (bootError) {
    return (
      <div className="min-h-screen bg-bg text-text">
        <AppTopbar title={t("replies.title")} />
        <main className="mx-auto max-w-[900px] px-5 py-7 md:px-6">
          <div className="rounded-lg border border-danger/40 bg-danger/10 p-4 text-small text-danger">
            {bootError}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-text">
      <AppTopbar title={t("replies.title")} pill={pill} />
      <main className="mx-auto max-w-[900px] space-y-4 px-5 py-7 md:px-6">
        <p className="text-small text-text-muted">{t("replies.subtitle")}</p>

        {!loaded && <p className="text-small text-text-muted">{t("common.loading")}</p>}

        {loaded && (
          <>
            {/* status filter — equal-width segments inside a surface-2 bar */}
            <div
              role="tablist"
              aria-label={t("replies.title")}
              className="sticky top-3 z-[5] flex items-center gap-1 rounded-md border border-border bg-surface-2 p-1"
            >
              {FILTER_TABS.map((tab) => {
                const n =
                  tab.key === null
                    ? Object.values(counts).reduce((a, b) => a + b, 0)
                    : counts[tab.key] ?? 0;
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

            {/* post-rail — horizontal scroll of post chips to narrow the feed */}
            {comments.length > 0 && (
              <PostRail
                groups={postGroups}
                total={comments.length}
                active={postFilter}
                onChange={setPostFilter}
                allLabel={t("replies.all_posts")}
                everythingLabel={t("replies.rail_everything")}
                fmtTime={(iso) => relativeTime(iso, locale)}
              />
            )}

            {visible.length === 0 ? (
              <div className="flex flex-col items-center rounded-lg border border-dashed border-border px-6 py-14 text-center">
                <span className="mb-3 grid h-11 w-11 place-items-center rounded-full border border-border bg-surface-2 text-text-subtle">
                  <IcReplies size={22} />
                </span>
                <p className="max-w-[42ch] text-small leading-relaxed text-text-muted">
                  {t("replies.empty")}
                </p>
              </div>
            ) : (
              <ul className="space-y-3.5">
                {visible.map((c) => {
                  const state = cardState(c);
                  const draftId = c.ai_draft_id;
                  const generating = generatingId === c.id;
                  const busy = draftId !== null && busyDraftId === draftId;
                  const currentText =
                    draftId !== null ? edits[draftId] ?? c.draft_text ?? "" : "";
                  const isEdited =
                    draftId !== null &&
                    edits[draftId] !== undefined &&
                    edits[draftId].trim() !== (c.draft_text ?? "").trim();
                  const editLen = currentText.length;
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
                      {/* "on your post" context inset */}
                      {(c.post_text || c.post_threads_url) &&
                        (c.post_threads_url ? (
                          <a
                            href={c.post_threads_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mb-3 flex items-center gap-2.5 rounded-md border border-border bg-surface-2 px-3 py-2.5 transition-colors hover:bg-text/[0.04]"
                          >
                            <IcReply size={14} className="shrink-0 text-text-subtle" />
                            <span className="shrink-0 text-caption font-semibold text-text-muted">
                              {t("replies.on_post")}
                            </span>
                            <span className="min-w-0 flex-1 truncate text-small text-text-muted">
                              {c.post_text || `#${c.post_id}`}
                            </span>
                            {c.post_published_at && (
                              <span className="shrink-0 text-caption text-text-subtle">
                                {relativeTime(c.post_published_at, locale)}
                              </span>
                            )}
                          </a>
                        ) : (
                          <div className="mb-3 flex items-center gap-2.5 rounded-md border border-border bg-surface-2 px-3 py-2.5">
                            <IcReply size={14} className="shrink-0 text-text-subtle" />
                            <span className="shrink-0 text-caption font-semibold text-text-muted">
                              {t("replies.on_post")}
                            </span>
                            <span className="min-w-0 flex-1 truncate text-small text-text-muted">
                              {c.post_text || `#${c.post_id}`}
                            </span>
                          </div>
                        ))}

                      {/* comment head: author + status badge */}
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
                            </div>

                            {state === "pending" ? (
                              <>
                                <textarea
                                  value={currentText}
                                  onChange={(e) =>
                                    setEdits((s) => ({ ...s, [draftId!]: e.target.value }))
                                  }
                                  rows={Math.min(
                                    10,
                                    Math.max(2, currentText.split("\n").length + 1),
                                  )}
                                  className="w-full resize-y rounded-sm border border-accent bg-surface px-3 py-2 text-small leading-relaxed text-text shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-accent)_16%,transparent)] outline-none"
                                />
                                <div className="mt-1.5 flex justify-end">
                                  <span
                                    className={cn(
                                      "text-caption tabular-nums text-text-subtle",
                                      editLen > REPLY_LIMIT && "font-semibold text-danger",
                                    )}
                                  >
                                    {editLen} / {REPLY_LIMIT}
                                  </span>
                                </div>
                              </>
                            ) : (
                              <p className="whitespace-pre-wrap text-small leading-relaxed text-text">
                                {c.draft_text ?? ""}
                              </p>
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
                            {/* remove-from-queue (with inline confirm) — all but replied */}
                            {state !== "replied" &&
                              (confirmDismissId === c.id ? (
                                <>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setConfirmDismissId(null)}
                                  >
                                    {t("common.cancel")}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="danger"
                                    onClick={() => onDismiss(c)}
                                  >
                                    {t("replies.dismiss")}
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setConfirmDismissId(c.id)}
                                  icon={<IcSkip size={15} />}
                                  aria-label={t("replies.dismiss")}
                                  title={t("replies.dismiss")}
                                />
                              ))}

                            {confirmDismissId !== c.id &&
                              (state === "new" || state === "rejected") && (
                                <Button
                                  size="sm"
                                  variant="primary"
                                  onClick={() => onGenerate(c)}
                                  disabled={generating}
                                  icon={<IcNib size={15} />}
                                >
                                  {t("replies.generate")}
                                </Button>
                              )}

                            {confirmDismissId !== c.id && state === "pending" && (
                              <>
                                {isEdited && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() =>
                                      setEdits((s) => {
                                        const n = { ...s };
                                        delete n[draftId!];
                                        return n;
                                      })
                                    }
                                  >
                                    {t("common.revert")}
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => onReject(c)}
                                  disabled={busy}
                                >
                                  {t("dashboard.draft.reject")}
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

                            {confirmDismissId !== c.id && state === "approved" && (
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
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </>
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
          <Toast key={tt.id} tone={tt.tone} title={tt.message} />
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

// Horizontal post-rail: "All posts" + one chip per post, with a count pill and
// a right-edge fade hinting there's more to scroll.
function PostRail({
  groups,
  total,
  active,
  onChange,
  allLabel,
  everythingLabel,
  fmtTime,
}: {
  groups: PostGroup[];
  total: number;
  active: number | "all";
  onChange: (key: number | "all") => void;
  allLabel: string;
  everythingLabel: string;
  fmtTime: (iso: string) => string;
}) {
  const items: {
    key: number | "all";
    label: string;
    count: number;
    time: string | null;
  }[] = [
    { key: "all", label: allLabel, count: total, time: null },
    ...groups.map((g) => ({
      key: g.postId,
      label: g.postText || `#${g.postId}`,
      count: g.comments.length,
      time: g.postPublishedAt,
    })),
  ];
  return (
    <div className="relative">
      <div className="flex gap-2.5 overflow-x-auto px-0.5 pb-2 pt-0.5 [scrollbar-width:thin]">
        {items.map((it) => {
          const on = active === it.key;
          return (
            <button
              key={it.key}
              onClick={() => onChange(it.key)}
              title={it.label}
              className={cn(
                "flex w-[204px] shrink-0 flex-col gap-2.5 rounded-md border bg-surface p-3 text-left transition-colors hover:bg-surface-2",
                on
                  ? "border-accent/55 bg-surface-2 shadow-sm"
                  : "border-border",
              )}
            >
              <span
                className={cn(
                  "line-clamp-2 min-h-[2.8em] text-small leading-snug text-text",
                  (on || it.key === "all") && "font-semibold",
                )}
              >
                {it.label}
              </span>
              <span className="flex items-center justify-between gap-2">
                <span className="text-caption text-text-subtle">
                  {it.time ? fmtTime(it.time) : everythingLabel}
                </span>
                <span
                  className={cn(
                    "inline-flex h-[19px] min-w-[20px] items-center justify-center rounded-full border px-1.5 text-caption font-semibold tabular-nums",
                    on
                      ? "border-accent/30 bg-accent/12 text-accent"
                      : "border-border bg-surface-2 text-text-muted",
                  )}
                >
                  {it.count}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <span
        className="pointer-events-none absolute bottom-2.5 right-0 top-0 w-11 bg-gradient-to-r from-transparent to-bg"
        aria-hidden
      />
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
