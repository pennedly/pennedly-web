"use client";

// Replies presentational layer — pure components driven by props, so the live
// master-detail (real API) and the ?demo=1 review (mock data) render the same
// pixels. Built 1:1 to Replies-SPEC.html: PostMaster + PostContext + 5-tab
// StatusFilter + CommentCard (comment + threaded reply, inline buttons per
// status, inline translate-row, edit/generating sub-states) + PublishReplyDialog.

import { useState, type ReactNode } from "react";

import { cn } from "@/lib/cn";
import { useTranslation, type MessageKey } from "@/lib/i18n";
import { Button, buttonClasses } from "@/components/ui/button";
import { Mono } from "@/components/ui/mono";
import { AccountFace } from "@/components/ui/avatar";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import {
  IcCheck,
  IcExternal,
  IcGlobe,
  IcNib,
  IcPencil,
  IcReplies,
  IcReply,
  IcTweak,
  IcUndo,
  IcX,
} from "@/components/icons";
import {
  type ReplyComment,
  type ReplyPost,
  type ReplyStatus,
} from "@/components/studio/replies-demo";

export const REPLY_LIMIT = 500;

export type ReplyFilter = "all" | "needs" | "drafts" | "replied" | "skipped";

export const REPLY_FILTERS: { key: ReplyFilter; label: MessageKey; dot: string }[] = [
  { key: "all", label: "replies.filter_all", dot: "bg-ink-300" },
  { key: "needs", label: "replies.filter_new", dot: "bg-accent" },
  { key: "drafts", label: "replies.filter_drafted", dot: "bg-ink-400" },
  { key: "replied", label: "replies.filter_replied", dot: "bg-success" },
  { key: "skipped", label: "replies.filter_skipped", dot: "bg-ink-300" },
];

export function inFilter(status: ReplyStatus, f: ReplyFilter): boolean {
  if (f === "all") return true;
  if (f === "needs") return status === "new" || status === "draft" || status === "approved";
  if (f === "drafts") return status === "draft" || status === "approved";
  if (f === "replied") return status === "replied";
  return status === "skipped";
}

export type ReplyHandlers = {
  onGenerate: (c: ReplyComment) => void; // generate or regenerate
  onApprove: (c: ReplyComment) => void;
  onPublish: (c: ReplyComment) => void; // opens dialog
  onSkip: (c: ReplyComment) => void; // ✕ remove from queue
  onRestore: (c: ReplyComment) => void;
  onSaveEdit: (c: ReplyComment, text: string) => void;
};

// ─────────────────────────────── PostMaster ─────────────────────────────────
export function PostMaster({
  posts,
  countsByPost,
  selected,
  onSelect,
}: {
  posts: ReplyPost[];
  countsByPost: Record<string, { total: number; unanswered: number }>;
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <aside className="sticky top-3 max-h-[calc(100vh-132px)] self-start overflow-hidden rounded-lg border border-border bg-surface shadow-sm max-[900px]:static max-[900px]:max-h-[300px]">
      <div className="shrink-0 border-b border-border px-4 pb-[11px] pt-[13px] text-caption font-semibold uppercase tracking-[0.06em] text-text-subtle">
        {t("replies.posts_with_comments")}
      </div>
      <div role="listbox" aria-label={t("replies.posts_with_comments")} className="flex flex-col overflow-y-auto">
        {posts.map((p, i) => {
          const c = countsByPost[p.id] ?? { total: 0, unanswered: 0 };
          const on = p.id === selected;
          return (
            <button
              key={p.id}
              role="option"
              aria-selected={on}
              onClick={() => onSelect(p.id)}
              className={cn(
                "flex flex-col gap-2 border-l-[3px] px-4 py-[13px] text-left transition-colors hover:bg-surface-2",
                i < posts.length - 1 && "border-b border-border",
                on ? "border-l-accent bg-surface-2" : "border-l-transparent",
              )}
            >
              <span className={cn("line-clamp-2 text-small leading-[1.45] text-text", on && "font-semibold")}>{p.text}</span>
              <span className="flex flex-wrap items-center gap-[7px] text-caption text-text-subtle">
                <span>{p.time}</span>
                <span className="opacity-50">·</span>
                <span>
                  {c.total} {t("replies.comments_word")}
                </span>
                {c.unanswered > 0 && (
                  <span className="ml-auto rounded-full border border-accent/30 bg-accent/12 px-2 py-px text-caption font-semibold text-accent">
                    {c.unanswered} {t("replies.to_answer")}
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

// ─────────────────────────────── PostContext ────────────────────────────────
export function PostContext({ post }: { post: ReplyPost }) {
  const { t } = useTranslation();
  return (
    <div className="rounded-lg border border-border bg-surface px-[18px] py-4 shadow-sm">
      <div className="text-caption font-semibold uppercase tracking-[0.05em] text-text-subtle">{t("replies.replying_under")}</div>
      <p className="mt-2 text-body leading-[1.55] text-text">{post.text}</p>
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-caption text-text-subtle">{post.time}</span>
        <a
          href={post.threadsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-small font-medium text-accent hover:underline hover:underline-offset-2"
        >
          {t("replies.open_in_threads")} <IcExternal size={14} />
        </a>
      </div>
    </div>
  );
}

// ─────────────────────────────── StatusFilter ───────────────────────────────
export function StatusFilter({
  active,
  counts,
  onChange,
}: {
  active: ReplyFilter;
  counts: Record<ReplyFilter, number>;
  onChange: (f: ReplyFilter) => void;
}) {
  const { t } = useTranslation();
  return (
    <div role="tablist" aria-label="Comment status" className="flex gap-1 rounded-md border border-border bg-surface-2 p-1">
      {REPLY_FILTERS.map((f) => {
        const on = active === f.key;
        return (
          <button
            key={f.key}
            role="tab"
            aria-selected={on}
            onClick={() => onChange(f.key)}
            className={cn(
              "inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-sm border px-2.5 text-small font-medium transition-colors",
              on ? "border-border bg-surface font-semibold text-text shadow-sm" : "border-transparent text-text-muted hover:text-text",
            )}
          >
            <span className={cn("h-[7px] w-[7px] shrink-0 rounded-full", f.dot)} />
            <span className="hidden truncate min-[561px]:inline">{t(f.label)}</span>
            <span className={cn("text-caption tabular-nums", on ? "text-text-muted" : "text-text-subtle")}>{counts[f.key]}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────── CommentBadge ───────────────────────────────
const CBADGE: Record<ReplyStatus, { tone: BadgeTone; key: MessageKey; dot: boolean }> = {
  new: { tone: "accent", key: "replies.badge_new", dot: true },
  draft: { tone: "neutral", key: "replies.badge_draft", dot: true },
  approved: { tone: "accent", key: "replies.badge_approved", dot: true },
  replied: { tone: "good", key: "replies.filter_replied", dot: true },
  skipped: { tone: "neutral", key: "replies.filter_skipped", dot: false },
};

// ─────────────────────────────── CommentCard ────────────────────────────────
export function CommentCard({
  c,
  youInitials,
  youAvatar,
  generating,
  h,
}: {
  c: ReplyComment;
  youInitials: string;
  youAvatar?: string | null;
  generating: boolean;
  h: ReplyHandlers;
}) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [editBuffer, setEditBuffer] = useState(c.reply ?? "");
  const [cmtTr, setCmtTr] = useState(false); // comment translated?
  const [rpTr, setRpTr] = useState(false); // reply translated?

  const status = c.status;
  const badge = CBADGE[status];
  const hasReply = status === "draft" || status === "approved" || status === "replied";
  const showRemove = status === "new" || status === "draft" || status === "approved";
  const commentBody = cmtTr && c.translated ? c.translated : c.text;
  const replyBody = rpTr && c.replyTranslated ? c.replyTranslated : c.reply ?? "";

  return (
    <article
      className={cn(
        "relative rounded-lg border border-border bg-surface px-[18px] py-3.5 shadow-sm transition-colors hover:border-text/15",
        status === "skipped" && "opacity-[0.66]",
      )}
      style={{ animation: "card-in var(--duration-slow) var(--ease-entrance) both" }}
    >
      {/* head */}
      <div className="flex items-center gap-[11px]">
        <Mono text={c.author.initials} size={38} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-small font-semibold leading-[1.25]">{c.author.name}</div>
          <div className="flex flex-wrap items-center gap-1.5 text-caption text-text-subtle">
            <span className="truncate">@{c.author.handle}</span>
            <span className="opacity-60">·</span>
            <span>{c.time}</span>
          </div>
        </div>
        <Badge tone={badge.tone} dot={badge.dot}>
          {t(badge.key)}
        </Badge>
        {showRemove && (
          <button
            type="button"
            aria-label={t("replies.dismiss")}
            onClick={() => h.onSkip(c)}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-transparent bg-transparent text-text-subtle transition-colors hover:bg-danger/10 hover:text-danger"
          >
            <IcX size={15} />
          </button>
        )}
      </div>

      {/* comment body */}
      <p className={cn("mt-[11px] text-body leading-[1.6] text-text", status === "skipped" && "text-text-muted")}>{commentBody}</p>
      {c.lang && (
        <TranslateRow lang={c.lang} on={cmtTr} onToggle={() => setCmtTr((v) => !v)} className="mt-[9px]" />
      )}

      {/* reply thread */}
      {(hasReply || generating) && (
        <div className="relative mt-3.5 pl-[26px]">
          <span className="absolute bottom-4 left-[11px] top-[-2px] w-0.5 rounded bg-border" />
          <div className={cn("rounded-md border border-border bg-surface-2 px-[14px] py-3", status === "replied" && "border-success/30")}>
            <div className="mb-2 flex items-center gap-2">
              <AccountFace url={youAvatar} initials={youInitials} size={24} />
              <span className="text-small font-semibold">{t("replies.you")}</span>
              {!generating && <RaTag status={status} repliedTime={c.repliedTime} />}
            </div>

            {generating ? (
              <div className="flex flex-col gap-[9px]">
                <div className="skel h-3.5 w-[88%] rounded" />
                <div className="skel h-3.5 w-[60%] rounded" />
                <span className="mt-0.5 inline-flex items-center gap-1.5 text-caption text-accent">
                  <span style={{ animation: "nib-write 1.5s var(--ease-standard) infinite" }}>
                    <IcNib size={13} />
                  </span>
                  {t("replies.drafting")}
                </span>
              </div>
            ) : editing ? (
              <>
                <textarea
                  autoFocus
                  value={editBuffer}
                  onChange={(e) => setEditBuffer(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && editBuffer.trim() && editBuffer.length <= REPLY_LIMIT) {
                      h.onSaveEdit(c, editBuffer);
                      setEditing(false);
                    }
                  }}
                  rows={Math.min(10, Math.max(2, editBuffer.split("\n").length + 1))}
                  className="w-full resize-y rounded-sm border border-accent bg-surface px-[11px] py-[9px] text-small leading-[1.6] text-text outline-none ring-[3px] ring-accent/[0.16]"
                />
                <div className="mt-[7px] flex justify-end">
                  <span className={cn("text-caption tabular-nums", editBuffer.length > REPLY_LIMIT ? "font-semibold text-danger" : "text-text-subtle")}>
                    {editBuffer.length} / {REPLY_LIMIT}
                  </span>
                </div>
              </>
            ) : (
              <>
                <p className="whitespace-pre-wrap text-small leading-[1.6] text-text">{replyBody}</p>
                {c.replyLang && <TranslateRow lang={c.replyLang} on={rpTr} onToggle={() => setRpTr((v) => !v)} className="mt-2" />}
              </>
            )}
          </div>
        </div>
      )}

      {/* footer */}
      {!generating && (
        <div className="mt-[13px] flex flex-wrap items-center gap-2.5 border-t border-border pt-3">
          {renderFoot()}
        </div>
      )}
    </article>
  );

  function renderFoot() {
    if (editing) {
      return (
        <>
          <span className="flex-1" />
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
            {t("studio.cancel")}
          </Button>
          <Button
            size="sm"
            variant="primary"
            icon={<IcCheck size={15} />}
            disabled={editBuffer.trim().length === 0 || editBuffer.length > REPLY_LIMIT}
            onClick={() => {
              h.onSaveEdit(c, editBuffer);
              setEditing(false);
            }}
          >
            {t("studio.save")}
          </Button>
        </>
      );
    }

    const meta = (node: ReactNode) => <div className="flex flex-1 items-center gap-3.5 text-caption text-text-subtle">{node}</div>;

    if (status === "new") {
      return (
        <>
          {meta(null)}
          <Button size="sm" variant="primary" icon={<IcNib size={15} />} onClick={() => h.onGenerate(c)}>
            {t("replies.generate_reply")}
          </Button>
        </>
      );
    }
    if (status === "draft") {
      return (
        <>
          {meta(c.lang ? <LangMeta lang={c.lang} /> : null)}
          <Button size="sm" variant="ghost" icon={<IcTweak size={15} />} onClick={() => h.onGenerate(c)}>
            {t("replies.regenerate")}
          </Button>
          <Button size="sm" variant="secondary" icon={<IcPencil size={15} />} onClick={() => { setEditBuffer(c.reply ?? ""); setEditing(true); }}>
            {t("studio.edit")}
          </Button>
          <Button size="sm" variant="primary" icon={<IcCheck size={15} />} onClick={() => h.onApprove(c)}>
            {t("studio.approve")}
          </Button>
        </>
      );
    }
    if (status === "approved") {
      return (
        <>
          {meta(c.lang ? <LangMeta lang={c.lang} /> : null)}
          <Button size="sm" variant="secondary" icon={<IcPencil size={15} />} onClick={() => { setEditBuffer(c.reply ?? ""); setEditing(true); }}>
            {t("studio.edit")}
          </Button>
          <Button size="sm" variant="primary" icon={<IcReply size={15} />} onClick={() => h.onPublish(c)}>
            {t("replies.publish_reply")}
          </Button>
        </>
      );
    }
    if (status === "replied") {
      return (
        <>
          {meta(
            <span className="inline-flex items-center gap-1.5">
              <IcCheck size={13} /> {t("replies.published")} {c.repliedTime}
            </span>,
          )}
          <a href="#" target="_blank" rel="noopener noreferrer" className={buttonClasses({ variant: "secondary", size: "sm" })}>
            <IcExternal size={15} /> {t("replies.open_in_threads")}
          </a>
        </>
      );
    }
    // skipped
    return (
      <>
        {meta(<span>{t("replies.removed_meta")}</span>)}
        <Button size="sm" variant="ghost" icon={<IcUndo size={15} />} onClick={() => h.onRestore(c)}>
          {t("replies.restore")}
        </Button>
      </>
    );
  }
}

function LangMeta({ lang }: { lang: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <IcGlobe size={13} /> {lang}
    </span>
  );
}

function RaTag({ status, repliedTime }: { status: ReplyStatus; repliedTime?: string | null }) {
  const { t } = useTranslation();
  if (status === "draft")
    return (
      <span className="inline-flex items-center gap-1.5 text-caption text-text-subtle">
        <IcNib size={12} /> {t("replies.tag_drafted")}
      </span>
    );
  if (status === "approved")
    return (
      <span className="inline-flex items-center gap-1.5 text-caption text-accent">
        <IcCheck size={12} /> {t("replies.tag_approved")}
      </span>
    );
  if (status === "replied")
    return (
      <span className="inline-flex items-center gap-1.5 text-caption text-success">
        <IcCheck size={12} /> {t("replies.tag_replied")} {repliedTime}
      </span>
    );
  return null;
}

function TranslateRow({ lang, on, onToggle, className }: { lang: string; on: boolean; onToggle: () => void; className?: string }) {
  const { t } = useTranslation();
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {on ? (
        <>
          <span className="inline-flex items-center gap-1.5 text-caption text-text-subtle">
            <IcGlobe size={13} /> {t("replies.translated_from")} {lang}
          </span>
          <button type="button" onClick={onToggle} className="text-caption font-medium text-accent hover:underline hover:underline-offset-2">
            {t("studio.show_original")}
          </button>
        </>
      ) : (
        <button type="button" onClick={onToggle} className="inline-flex items-center gap-1.5 text-caption font-medium text-accent hover:underline hover:underline-offset-2">
          <IcGlobe size={13} /> {t("replies.translate_from")} {lang}
        </button>
      )}
    </div>
  );
}

// ───────────────────────── loading / empty ──────────────────────────────────
export function CommentSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-surface px-[18px] py-3.5 shadow-sm">
      <div className="flex items-center gap-[11px]">
        <div className="skel h-[34px] w-[34px] rounded-full" />
        <div className="flex-1 space-y-1.5">
          <div className="skel h-3 w-32 rounded" />
          <div className="skel h-2.5 w-20 rounded" />
        </div>
        <div className="skel h-[22px] w-16 rounded-full" />
      </div>
      <div className="mt-3 space-y-2">
        <div className="skel h-3.5 w-[90%] rounded" />
        <div className="skel h-3.5 w-[55%] rounded" />
      </div>
    </div>
  );
}

export function RepliesLoading() {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-[300px_1fr] items-start gap-[22px] max-[900px]:grid-cols-1">
      <aside className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
        <div className="border-b border-border px-4 pb-[11px] pt-[13px] text-caption font-semibold uppercase tracking-[0.06em] text-text-subtle">
          {t("replies.posts_with_comments")}
        </div>
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-2 border-b border-border px-4 py-[13px] last:border-0">
            <div className="skel h-3 w-[92%] rounded" />
            <div className="skel h-2.5 w-[50%] rounded" />
          </div>
        ))}
      </aside>
      <div className="flex flex-col gap-3.5">
        <CommentSkeleton />
        <CommentSkeleton />
        <CommentSkeleton />
      </div>
    </div>
  );
}

const EMPTY: Record<ReplyFilter | "all", { title: MessageKey; sub: MessageKey }> = {
  all: { title: "replies.empty_all_title", sub: "replies.empty_all_sub" },
  needs: { title: "replies.empty_needs_title", sub: "replies.empty_needs_sub" },
  drafts: { title: "replies.empty_drafts_title", sub: "replies.empty_drafts_sub" },
  replied: { title: "replies.empty_replied_title", sub: "replies.empty_replied_sub" },
  skipped: { title: "replies.empty_skipped_title", sub: "replies.empty_skipped_sub" },
};

export function RepliesEmpty({ filter }: { filter: ReplyFilter }) {
  const { t } = useTranslation();
  const e = EMPTY[filter];
  return (
    <div className="flex flex-col items-center rounded-lg border border-dashed border-border bg-surface/50 px-6 py-14 text-center">
      <span className="grid h-[52px] w-[52px] place-items-center rounded-lg border border-border bg-surface-2 text-text-subtle">
        <IcReplies size={24} />
      </span>
      <h3 className="mt-3.5 text-h3 font-semibold">{t(e.title)}</h3>
      <p className="mt-1 max-w-[38ch] text-small text-text-muted">{t(e.sub)}</p>
    </div>
  );
}

// ──────────────────────────── Publish dialog ────────────────────────────────
export function PublishReplyDialog({
  open,
  comment,
  reply,
  publishing,
  onClose,
  onConfirm,
}: {
  open: boolean;
  comment: ReplyComment | null;
  reply: string;
  publishing: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-40 grid place-items-center bg-ink-950/55 p-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Publish reply"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !publishing) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape" && !publishing) onClose();
      }}
      tabIndex={-1}
    >
      <div
        className="w-full max-w-[420px] rounded-2xl border border-border bg-surface p-6 shadow-lg"
        style={{ animation: "dialog-in var(--duration-slow) var(--ease-entrance) both" }}
      >
        <div className="flex items-start gap-3">
          <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-md border border-border bg-surface-2 text-text">
            <IcReply size={18} />
          </span>
          <div className="min-w-0">
            <h2 className="text-h3 font-semibold leading-[1.3]">{t("replies.dialog_title")}</h2>
            <p className="mt-1 text-small text-text-muted">{t("replies.dialog_sub")}</p>
          </div>
        </div>
        {comment && (
          <div className="mt-1.5 flex gap-[11px] rounded-md border border-border bg-surface-2 px-[13px] py-[11px]">
            <span className="w-0.5 shrink-0 self-stretch rounded bg-border" />
            <span className="text-small leading-[1.5] text-text-muted">{comment.text}</span>
          </div>
        )}
        <div className="mt-3.5 max-h-[220px] overflow-y-auto whitespace-pre-wrap rounded-md border border-border bg-surface-2 p-3.5 text-body leading-[1.6] text-text">
          {reply}
        </div>
        <div className="mt-[22px] flex items-center justify-end gap-2.5">
          <button onClick={onClose} disabled={publishing} className={buttonClasses({ variant: "ghost" })}>
            {t("studio.cancel")}
          </button>
          <Button variant="primary" icon={<IcReply size={16} />} loading={publishing} onClick={onConfirm}>
            {t("replies.publish_reply")}
          </Button>
        </div>
      </div>
    </div>
  );
}
