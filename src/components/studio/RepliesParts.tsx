"use client";

// Replies presentational layer — pure components driven by props, so the live
// master-detail (real API) and the ?demo=1 review (mock data) render the same
// pixels. Built 1:1 to Replies-SPEC.html: PostMaster + PostContext + 5-tab
// StatusFilter + CommentCard (comment + threaded reply, inline buttons per
// status, inline translate-row, edit/generating sub-states) + PublishReplyDialog.

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { mediaUrl } from "@/lib/api";
import { cn } from "@/lib/cn";
import { useTranslation, type MessageKey } from "@/lib/i18n";
import { Button, buttonClasses } from "@/components/ui/button";
import { Mono } from "@/components/ui/mono";
import { AccountFace } from "@/components/ui/avatar";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import {
  IcArrowLeft,
  IcArrowRight,
  IcCheck,
  IcExternal,
  IcGlobe,
  IcImage,
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
  // Attach one image to a reply draft (the backend supports an image on a
  // reply; carousel/video in replies is unverified, so it's a single image).
  onUploadImage: (file: File) => Promise<{ url: string }>;
  onSetMedia: (c: ReplyComment, media: { url: string }[]) => Promise<void>;
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
  const railRef = useRef<HTMLDivElement>(null);
  // Does the rail overflow on each side? Drives the arrows + edge fades.
  const [over, setOver] = useState({ left: false, right: false });

  const recompute = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setOver({ left: el.scrollLeft > 1, right: el.scrollLeft < max - 1 });
  }, []);

  useEffect(() => {
    recompute();
    const el = railRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(recompute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [recompute, posts.length]);

  // Keep the active chip in view when the selection changes (keyboard / programmatic).
  useEffect(() => {
    const el = railRef.current;
    if (!el || selected == null) return;
    el.querySelector<HTMLElement>(`[data-pm-id="${CSS.escape(selected)}"]`)?.scrollIntoView({
      behavior: "smooth",
      inline: "nearest",
      block: "nearest",
    });
  }, [selected]);

  function pageScroll(dir: -1 | 1) {
    const el = railRef.current;
    if (el) el.scrollBy({ left: dir * Math.max(296, el.clientWidth * 0.8), behavior: "smooth" });
  }

  // Click-drag to pan (desktop mouse). `moved` suppresses the click that would
  // otherwise select a chip at the end of a drag; touch swipes natively.
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  function onPointerDown(e: React.PointerEvent) {
    suppressClick.current = false;
    if (e.pointerType === "touch") return;
    const el = railRef.current;
    if (el) drag.current = { x: e.clientX, left: el.scrollLeft, moved: false };
  }
  function onPointerMove(e: React.PointerEvent) {
    const el = railRef.current;
    if (!el || !drag.current) return;
    const dx = e.clientX - drag.current.x;
    if (Math.abs(dx) > 3) drag.current.moved = true;
    el.scrollLeft = drag.current.left - dx;
  }
  function onPointerEnd() {
    if (drag.current?.moved) suppressClick.current = true;
    drag.current = null;
  }
  function onWheel(e: React.WheelEvent) {
    const el = railRef.current;
    if (el && e.shiftKey && e.deltaY !== 0) el.scrollLeft += e.deltaY;
  }
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const idx = posts.findIndex((p) => p.id === selected);
    const target = posts[e.key === "ArrowRight" ? Math.min(posts.length - 1, idx + 1) : Math.max(0, idx - 1)];
    if (target) onSelect(target.id);
  }

  const arrowCls =
    "absolute top-1/2 z-10 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full border border-border bg-surface text-text-muted shadow-md transition-colors hover:bg-surface-2 hover:text-text max-md:hidden";

  return (
    // Horizontal post switcher — the single way to change posts, sticky under the
    // top bar on every width so it stays in reach while a long comment list
    // scrolls. (Replaces the old desktop left master column.) On a phone it
    // swipes; on desktop, arrows / edge-fades / click-drag / shift-wheel / ←→.
    <div className="sticky top-3 z-10 bg-bg/85 backdrop-blur max-md:top-13">
      <div className="mb-2 text-caption font-semibold uppercase tracking-[0.06em] text-text-subtle">
        {t("replies.posts_with_comments")}
        <span className="ml-1.5 opacity-70">· {posts.length}</span>
      </div>
      <div className="relative">
        {over.left && (
          <>
            <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 z-[5] w-10 bg-gradient-to-r from-bg to-transparent max-md:hidden" />
            <button type="button" aria-label={t("replies.scroll_prev")} onClick={() => pageScroll(-1)} className={cn(arrowCls, "left-1")}>
              <IcArrowLeft size={15} />
            </button>
          </>
        )}
        <div
          ref={railRef}
          role="listbox"
          tabIndex={0}
          aria-label={t("replies.posts_with_comments")}
          onScroll={recompute}
          onWheel={onWheel}
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerLeave={onPointerEnd}
          className="flex gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none] [scroll-snap-type:x_proximity] focus:outline-none [&::-webkit-scrollbar]:hidden"
        >
          {posts.map((p) => {
            const c = countsByPost[p.id] ?? { total: 0, unanswered: 0 };
            const on = p.id === selected;
            return (
              <button
                key={p.id}
                data-pm-id={p.id}
                role="option"
                aria-selected={on}
                onClick={() => {
                  if (suppressClick.current) {
                    suppressClick.current = false;
                    return;
                  }
                  onSelect(p.id);
                }}
                className={cn(
                  "flex w-[280px] shrink-0 flex-col gap-2 rounded-lg border bg-surface px-3.5 py-3 text-left transition-colors [scroll-snap-align:start] hover:bg-surface-2 max-md:w-[220px]",
                  on ? "border-accent ring-1 ring-accent/40" : "border-border",
                )}
              >
                <span className={cn("line-clamp-2 text-small leading-[1.45] text-text", on && "font-semibold")}>{p.text}</span>
                <span className="flex flex-wrap items-center gap-[7px] text-caption text-text-subtle">
                  <span>{p.time}</span>
                  <span className="opacity-50">·</span>
                  <span>
                    {c.total} {t("replies.comments_word")}
                  </span>
                  {c.unanswered > 0 ? (
                    <span className="ml-auto rounded-full border border-accent/30 bg-accent/12 px-2 py-px text-caption font-semibold text-accent">
                      {c.unanswered} {t("replies.to_answer")}
                    </span>
                  ) : (
                    <span className="ml-auto rounded-full border border-success/30 bg-success/12 px-2 py-px text-caption font-semibold text-success">
                      {t("replies.all_answered")}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
        {over.right && (
          <>
            <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 z-[5] w-10 bg-gradient-to-l from-bg to-transparent max-md:hidden" />
            <button type="button" aria-label={t("replies.scroll_next")} onClick={() => pageScroll(1)} className={cn(arrowCls, "right-1")}>
              <IcArrowRight size={15} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────── PostContext ────────────────────────────────
export function PostContext({ post }: { post: ReplyPost }) {
  const { t } = useTranslation();
  return (
    <div className="rounded-lg border border-border bg-surface px-[18px] py-4 shadow-sm">
      <div className="text-caption font-semibold uppercase tracking-[0.05em] text-text-subtle">{t("replies.replying_under")}</div>
      <p className="mt-2 text-body leading-[1.55] text-text max-md:line-clamp-2">{post.text}</p>
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-caption text-text-subtle">{post.time}</span>
        <a
          href={post.threadsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1.5 text-small font-medium text-accent hover:underline hover:underline-offset-2"
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
    // Not sticky on mobile (deliberate — only the switcher sticks). Labels are
    // kept on mobile; the row scrolls horizontally instead of hiding them.
    <div role="tablist" aria-label="Comment status" className="flex gap-1 rounded-md border border-border bg-surface-2 p-1 [scrollbar-width:none] max-md:overflow-x-auto">
      {REPLY_FILTERS.map((f) => {
        const on = active === f.key;
        return (
          <button
            key={f.key}
            role="tab"
            aria-selected={on}
            onClick={() => onChange(f.key)}
            className={cn(
              "inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-sm border px-2.5 text-small font-medium transition-colors max-md:shrink-0",
              on ? "border-border bg-surface font-semibold text-text shadow-sm" : "border-transparent text-text-muted hover:text-text",
            )}
          >
            <span className={cn("h-[7px] w-[7px] shrink-0 rounded-full", f.dot)} />
            <span className="truncate">{t(f.label)}</span>
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
const REPLY_IMG_TYPES = ["image/jpeg", "image/png", "image/webp"];

// One image on a reply draft (the backend caps a reply at a single image).
// Exported so the dev /gallery route can render it in every state.
export function ReplyImage({ c, h }: { c: ReplyComment; h: ReplyHandlers }) {
  const { t } = useTranslation();
  const [media, setMedia] = useState<{ url: string }[]>(c.media ?? []);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function pick() {
    const f = fileRef.current?.files?.[0];
    if (fileRef.current) fileRef.current.value = "";
    if (!f) return;
    setErr(null);
    if (!REPLY_IMG_TYPES.includes(f.type)) return setErr(t("studio.image_bad_type"));
    if (f.size > 8 * 1024 * 1024) return setErr(t("studio.image_too_large"));
    setUploading(true);
    try {
      const { url } = await h.onUploadImage(f);
      const next = [{ url }];
      setMedia(next);
      await h.onSetMedia(c, next);
    } catch {
      setErr(t("studio.image_failed"));
    } finally {
      setUploading(false);
    }
  }

  async function remove() {
    const prev = media;
    setMedia([]);
    setErr(null);
    try {
      await h.onSetMedia(c, []);
    } catch {
      setMedia(prev);
      setErr(t("studio.image_failed"));
    }
  }

  return (
    <div className="mt-2.5">
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={pick}
        className="hidden"
      />
      {media.length === 0 ? (
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-caption text-text-muted transition-colors hover:bg-surface-2 hover:text-text disabled:opacity-60"
        >
          <IcImage size={14} /> {uploading ? t("studio.image_uploading") : t("studio.add_image")}
        </button>
      ) : (
        <div className="relative h-[72px] w-[72px] overflow-hidden rounded-md border border-border bg-surface-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mediaUrl(media[0].url)} alt="" className="h-full w-full object-cover" />
          <button
            type="button"
            aria-label={t("studio.remove_image")}
            onClick={remove}
            className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full border border-border bg-surface text-text shadow-sm transition-colors hover:bg-surface-2"
          >
            <IcX size={12} />
          </button>
        </div>
      )}
      {err && <p className="mt-1 text-caption text-danger">{err}</p>}
    </div>
  );
}

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
      {/* head — Threads gives only the commenter's @username (no avatar, no
          display name). Desktop keeps its Mono initials + name; on a phone we
          collapse to @username + time only, with the @username truncating. */}
      <div className="flex items-center gap-[11px] max-md:gap-2.5">
        <Mono text={c.author.initials} size={38} className="max-md:hidden" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-small font-semibold leading-[1.25] max-md:hidden">{c.author.name}</div>
          <div className="flex flex-wrap items-center gap-1.5 text-caption text-text-subtle max-md:flex-nowrap max-md:overflow-hidden">
            <span className="truncate max-md:min-w-0 max-md:font-medium max-md:text-text">@{c.author.handle}</span>
            {/* Meta doesn't always give a reply time → c.time is "". Drop the
                "·" + time chip rather than rendering a misleading "just now". */}
            {c.time && (
              <>
                <span className="opacity-60 max-md:shrink-0">·</span>
                <span className="max-md:shrink-0">{c.time}</span>
              </>
            )}
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
            className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-transparent bg-transparent text-text-subtle transition-colors hover:bg-danger/10 hover:text-danger max-md:h-11 max-md:w-11"
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
            <div className="mb-2 flex items-center gap-2 max-md:flex-wrap max-md:gap-y-1">
              <AccountFace url={youAvatar} initials={youInitials} size={24} className="max-md:shrink-0" />
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
                  className="w-full resize-y rounded-sm border border-accent bg-surface px-[11px] py-[9px] text-small leading-[1.6] text-text outline-none ring-[3px] ring-accent/[0.16] max-md:text-[16px]"
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
                {(status === "draft" || status === "approved") && <ReplyImage c={c} h={h} />}
              </>
            )}
          </div>
        </div>
      )}

      {/* footer — two-tier on mobile: meta line wraps, then a full-width action
          row with one grow-primary + 44×44 icon buttons. */}
      {!generating && (
        <div className="mt-[13px] flex flex-wrap items-center gap-2.5 border-t border-border pt-3 max-md:flex-col max-md:items-stretch">
          {renderFoot()}
        </div>
      )}
    </article>
  );

  function renderFoot() {
    // Each action button group is wrapped so that on mobile (max-md) it becomes
    // the full-width second tier under the meta line: the labelled primary grows
    // to 44px and any Regenerate/Edit collapse to 44×44 icon buttons. Desktop
    // keeps the buttons inline at the right with the original gap (gap-2.5).
    if (editing) {
      return (
        <>
          <span className="flex-1 max-md:hidden" />
          <div className="flex items-center gap-2.5 max-md:w-full max-md:gap-2">
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)} className="max-md:min-h-[44px]">
              {t("studio.cancel")}
            </Button>
            <Button
              size="sm"
              variant="primary"
              icon={<IcCheck size={15} />}
              className="max-md:h-auto max-md:min-h-[44px] max-md:flex-1 max-md:whitespace-normal"
              disabled={editBuffer.trim().length === 0 || editBuffer.length > REPLY_LIMIT}
              onClick={() => {
                h.onSaveEdit(c, editBuffer);
                setEditing(false);
              }}
            >
              {t("studio.save")}
            </Button>
          </div>
        </>
      );
    }

    // On desktop the meta div is always present (flex-1) so the action group is
    // pushed right; when there's no meta text we keep an empty spacer on desktop
    // but drop it on mobile (where the action row is its own full-width tier).
    const meta = (node: ReactNode) =>
      node === null ? (
        <div className="flex-1 max-md:hidden" />
      ) : (
        <div className="flex flex-1 items-center gap-3.5 text-caption text-text-subtle max-md:w-full max-md:flex-none">{node}</div>
      );
    // Action-row wrapper: right-aligned inline on desktop, full-width tier on mobile.
    const actions = (node: ReactNode) => <div className="flex items-center gap-2.5 max-md:w-full max-md:gap-2">{node}</div>;
    // Hide a button's text label on mobile (it becomes a 44×44 icon button).
    const iconBtnCls = "max-md:h-11 max-md:w-11 max-md:shrink-0 max-md:gap-0 max-md:px-0";
    const growCls = "max-md:h-auto max-md:min-h-[44px] max-md:flex-1 max-md:whitespace-normal";

    if (status === "new") {
      return (
        <>
          {meta(null)}
          {actions(
            <Button size="sm" variant="primary" className={growCls} icon={<IcNib size={15} />} onClick={() => h.onGenerate(c)}>
              {t("replies.generate_reply")}
            </Button>,
          )}
        </>
      );
    }
    if (status === "draft") {
      return (
        <>
          {meta(c.lang ? <LangMeta lang={c.lang} /> : null)}
          {actions(
            <>
              <Button size="sm" variant="ghost" className={iconBtnCls} icon={<IcTweak size={15} />} aria-label={t("replies.regenerate")} onClick={() => h.onGenerate(c)}>
                <span className="max-md:hidden">{t("replies.regenerate")}</span>
              </Button>
              <Button size="sm" variant="secondary" className={iconBtnCls} icon={<IcPencil size={15} />} aria-label={t("studio.edit")} onClick={() => { setEditBuffer(c.reply ?? ""); setEditing(true); }}>
                <span className="max-md:hidden">{t("studio.edit")}</span>
              </Button>
              <Button size="sm" variant="primary" className={growCls} icon={<IcCheck size={15} />} onClick={() => h.onApprove(c)}>
                {t("studio.approve")}
              </Button>
            </>,
          )}
        </>
      );
    }
    if (status === "approved") {
      return (
        <>
          {meta(c.lang ? <LangMeta lang={c.lang} /> : null)}
          {actions(
            <>
              <Button size="sm" variant="secondary" className={iconBtnCls} icon={<IcPencil size={15} />} aria-label={t("studio.edit")} onClick={() => { setEditBuffer(c.reply ?? ""); setEditing(true); }}>
                <span className="max-md:hidden">{t("studio.edit")}</span>
              </Button>
              <Button size="sm" variant="primary" className={growCls} icon={<IcReply size={15} />} onClick={() => h.onPublish(c)}>
                {t("replies.publish_reply")}
              </Button>
            </>,
          )}
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
          {actions(
            <a href="#" target="_blank" rel="noopener noreferrer" className={buttonClasses({ variant: "secondary", size: "sm", className: growCls })}>
              <IcExternal size={15} /> {t("replies.open_in_threads")}
            </a>,
          )}
        </>
      );
    }
    // skipped
    return (
      <>
        {meta(<span>{t("replies.removed_meta")}</span>)}
        {actions(
          <Button size="sm" variant="ghost" className={growCls} icon={<IcUndo size={15} />} onClick={() => h.onRestore(c)}>
            {t("replies.restore")}
          </Button>,
        )}
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
    <div className="grid grid-cols-[300px_1fr] items-start gap-[22px] max-md:grid-cols-1 max-md:gap-4">
      {/* Desktop: vertical post-list skeleton. Mobile: horizontal switcher
          skeleton (220px chips, scrolls), matching the live PostMaster. */}
      <aside className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm max-md:flex max-md:gap-2.5 max-md:overflow-x-auto max-md:rounded-none max-md:border-0 max-md:bg-transparent max-md:p-0 max-md:shadow-none [scrollbar-width:none]">
        <div className="border-b border-border px-4 pb-[11px] pt-[13px] text-caption font-semibold uppercase tracking-[0.06em] text-text-subtle max-md:hidden">
          {t("replies.posts_with_comments")}
        </div>
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-2 border-b border-border px-4 py-[13px] last:border-0 max-md:w-[220px] max-md:shrink-0 max-md:space-y-2 max-md:rounded-lg max-md:border max-md:border-border max-md:py-[13px] max-md:last:border">
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
      className="fixed inset-0 z-40 grid place-items-center bg-ink-950/55 p-6 backdrop-blur-sm max-md:place-items-end max-md:p-0"
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
        className="w-full max-w-[420px] rounded-2xl border border-border bg-surface p-6 shadow-lg max-md:max-w-none max-md:rounded-b-none max-md:rounded-t-2xl max-md:pb-[calc(24px+env(safe-area-inset-bottom))]"
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
        <div className="mt-[22px] flex items-center justify-end gap-2.5 max-md:flex-col-reverse max-md:items-stretch max-md:gap-2">
          <button onClick={onClose} disabled={publishing} className={buttonClasses({ variant: "ghost", className: "max-md:min-h-[44px] max-md:w-full" })}>
            {t("studio.cancel")}
          </button>
          <Button variant="primary" className="max-md:min-h-[44px] max-md:w-full" icon={<IcReply size={16} />} loading={publishing} onClick={onConfirm}>
            {t("replies.publish_reply")}
          </Button>
        </div>
      </div>
    </div>
  );
}
