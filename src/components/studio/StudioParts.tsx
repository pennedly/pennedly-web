"use client";

// Studio presentational layer — pure components driven entirely by props, so the
// live screen (real API) and the ?demo=1 Tweaks review (mock data) render the
// exact same pixels. State that mutates the draft list lives in the page; each
// card owns only its own interaction sub-state (edit / tweak / translate / menu).
// Built 1:1 to Studio-SPEC.html (composer, filterbar, feed states, draft card's
// 9 sub-states, ⋯-menu + translate submenu, publish dialog, first-run hero).

import { useEffect, useRef, useState, type ReactNode } from "react";

import { mediaUrl } from "@/lib/api";
import { extractFirstUrl } from "@/lib/links";
import { cn } from "@/lib/cn";
import { useTranslation, type MessageKey } from "@/lib/i18n";
import type { GifResult, Idea } from "@/lib/types";
import { Button, buttonClasses } from "@/components/ui/button";
import { Mono } from "@/components/ui/mono";
import { AccountFace } from "@/components/ui/avatar";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { LinkPreviewCard } from "@/components/studio/LinkPreviewCard";
import {
  BrandMark,
  IcArrowLeft,
  IcBubble,
  IcCheck,
  IcChevDown,
  IcClock,
  IcExternal,
  IcGif,
  IcGlobe,
  IcHeart,
  IcImage,
  IcMore,
  IcVideo,
  IcNib,
  IcPencil,
  IcReload,
  IcReply,
  IcSearch,
  IcRepost,
  IcSend,
  IcSparkle,
  IcStudio,
  IcThread,
  IcTrash,
  IcTweak,
  IcUndo,
  IcVoice,
  IcX,
} from "@/components/icons";
import {
  UI_LANGS,
  type StudioCard,
  type StudioStatus,
  type UiLang,
} from "@/components/studio/studio-demo";

export const DRAFT_LIMIT = 500;
// Images per post (Threads carousel max) + the upload limits the backend
// enforces, mirrored client-side so we reject before the round-trip.
export const MEDIA_MAX = 10;
const MEDIA_MAX_BYTES = 8 * 1024 * 1024;
const MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Mirror of the backend `thread_split` rule: a line of only `---` separates the
// parts of a thread chain. Returns a single segment for an ordinary post, so
// callers branch on length. Each part must stay within DRAFT_LIMIT (Threads
// caps a single post at 500 chars).
export function splitThreadSegments(text: string): string[] {
  const parts = text.split(/^[ \t]*---[ \t]*$/m).map((p) => p.trim());
  const segments = parts.filter((p) => p.length > 0);
  return segments.length > 0 ? segments : [text.trim()];
}

export type Density = "comfortable" | "compact";

export type CardHandlers = {
  onApprove: (c: StudioCard) => void;
  onReject: (c: StudioCard) => void;
  onPublish: (c: StudioCard) => void;
  onSendBack: (c: StudioCard) => void;
  onRestore: (c: StudioCard) => void;
  /** Persist an edited body into page state (card.body re-flows via props). */
  onSaveEdit: (c: StudioCard, text: string) => void;
  /** Rewrite the body in the user's voice; resolves to the new text. */
  onTweak: (c: StudioCard, instruction: string) => Promise<string>;
  /** Translate the body inline; resolves to the translated text. */
  onTranslate: (c: StudioCard, lang: UiLang) => Promise<string>;
  /** Hard-delete the draft from the queue (Undo-safe in the page). The
   *  endpoint refuses only a published draft, so it's offered everywhere else. */
  onDelete: (c: StudioCard) => void;
  /** Upload one image file for this draft's account; resolves to its URL. */
  onUploadImage: (file: File) => Promise<{ url: string }>;
  /** Persist the draft's full image list (attach / remove / reorder / alt). */
  onSetMedia: (c: StudioCard, media: { url: string; alt?: string | null }[]) => Promise<void>;
  /** Search Tenor (server-proxied) for the composer GIF picker. */
  onSearchTenor: (q: string) => Promise<GifResult[]>;
  /** Attach (or clear, with null) a GIF on the draft. */
  onSetGif: (c: StudioCard, gif: GifResult | null) => Promise<void>;
};

// ─────────────────────────────── CharMeter ──────────────────────────────────
export function CharMeter({ len, showBar = true }: { len: number; showBar?: boolean }) {
  const pct = Math.min(100, (len / DRAFT_LIMIT) * 100);
  const over = len > DRAFT_LIMIT;
  const warn = !over && len > DRAFT_LIMIT - 60;
  return (
    <div className="flex items-center gap-2.5">
      {showBar && (
        <div className="h-1 w-full max-w-[140px] overflow-hidden rounded-full border border-border bg-surface-2">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              over ? "bg-danger" : warn ? "bg-warning" : "bg-text-subtle",
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
      <span
        className={cn(
          "whitespace-nowrap text-caption tabular-nums",
          over ? "font-semibold text-danger" : warn ? "text-warning" : "text-text-subtle",
        )}
      >
        {len} / {DRAFT_LIMIT}
      </span>
    </div>
  );
}

// ────────────────────────────── StatusBadge ─────────────────────────────────
const BADGE: Record<StudioStatus, { tone: BadgeTone; key: MessageKey }> = {
  draft: { tone: "neutral", key: "studio.badge_draft" },
  ready: { tone: "accent", key: "studio.badge_ready" },
  scheduled: { tone: "accent", key: "studio.badge_scheduled" },
  published: { tone: "good", key: "studio.badge_published" },
  rejected: { tone: "bad", key: "studio.badge_rejected" },
};

export function StatusBadge({ status }: { status: StudioStatus }) {
  const { t } = useTranslation();
  const b = BADGE[status];
  return (
    <Badge tone={b.tone} dot>
      {t(b.key)}
    </Badge>
  );
}

// ─────────────────────────────── CardMenu ───────────────────────────────────
type MenuItem = { label: string; Icon: (p: { size?: number }) => ReactNode; onClick: () => void; danger?: boolean };

function CardMenu({
  items,
  translatedLang,
  onTranslate,
  onShowOriginal,
}: {
  items: MenuItem[];
  translatedLang: UiLang | null;
  onTranslate: (l: UiLang) => void;
  onShowOriginal: () => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"root" | "translate">("root");
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setMode("root");
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  function shut() {
    setOpen(false);
    setMode("root");
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={t("dashboard.draft.more_actions")}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="grid h-[34px] w-[34px] place-items-center rounded-md border border-border bg-surface text-text-muted transition-colors hover:bg-surface-2 hover:text-text max-md:h-11 max-md:w-11"
      >
        <IcMore size={17} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute bottom-[calc(100%+8px)] right-0 z-30 max-h-[360px] min-w-[200px] overflow-y-auto rounded-lg border border-border bg-surface p-1.5 shadow-lg max-md:left-0 max-md:right-auto"
          style={{ animation: "dialog-in var(--duration-base) var(--ease-entrance) both" }}
        >
          {mode === "root" ? (
            <>
              {items.map((it, i) => (
                <button
                  key={i}
                  role="menuitem"
                  onClick={() => {
                    shut();
                    it.onClick();
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-md border border-transparent px-2.5 py-2 text-left text-small font-medium transition-colors",
                    it.danger
                      ? "text-danger hover:bg-danger/10"
                      : "text-text hover:bg-surface-2",
                  )}
                >
                  <it.Icon size={15} />
                  {it.label}
                </button>
              ))}
              {translatedLang && (
                <button
                  role="menuitem"
                  onClick={() => {
                    shut();
                    onShowOriginal();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-small font-medium text-text transition-colors hover:bg-surface-2"
                >
                  <IcUndo size={15} />
                  {t("studio.show_original")}
                </button>
              )}
              <button
                role="menuitem"
                onClick={() => setMode("translate")}
                className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-small font-medium text-text transition-colors hover:bg-surface-2"
              >
                <IcGlobe size={15} />
                <span className="flex-1">{t("studio.translate")}</span>
                <IcChevDown size={13} className="-rotate-90 text-text-subtle" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setMode("root")}
                className="mb-1 flex w-full items-center gap-2 border-b border-border px-2.5 pb-2 pt-1 text-left text-caption font-semibold uppercase tracking-[0.04em] text-text-subtle"
              >
                <IcArrowLeft size={14} />
                {t("studio.translate_to")}
              </button>
              {UI_LANGS.map((l) => {
                const sel = l.code === "en" ? translatedLang === null : translatedLang?.code === l.code;
                return (
                  <button
                    key={l.code}
                    role="menuitemradio"
                    aria-checked={sel}
                    onClick={() => {
                      shut();
                      if (l.code === "en") onShowOriginal();
                      else onTranslate(l);
                    }}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-surface-2",
                      sel && "bg-surface-2",
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-small text-text">{l.name}</span>
                      <span className="block text-caption text-text-subtle">
                        {l.code === "en" ? t("studio.original") : l.native}
                      </span>
                    </span>
                    {sel && <IcCheck size={14} className="shrink-0 text-success" />}
                  </button>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────── DraftCard ──────────────────────────────────
export function DraftCard({
  card,
  density,
  h,
  replyReadOnly = false,
  demo = false,
}: {
  card: StudioCard;
  density: Density;
  h: CardHandlers;
  /** Q62: reply drafts are managed in /app/replies — no actions here. */
  replyReadOnly?: boolean;
  /** Demo mode surfaces every spec action; real mode hides the ones whose
   *  backend endpoint doesn't exist yet (send-back / restore / edit-on-ready). */
  demo?: boolean;
}) {
  const { t, locale } = useTranslation();
  const compact = density === "compact";
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(card.body);
  const [tweakOpen, setTweakOpen] = useState(false);
  const [tweakInput, setTweakInput] = useState("");
  const [revising, setRevising] = useState(false);
  const [revised, setRevised] = useState(false);
  const [translated, setTranslated] = useState<{ lang: UiLang; body: string } | null>(null);
  const [media, setMedia] = useState<{ url: string; alt?: string | null }[]>(card.media ?? []);
  const [uploading, setUploading] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [altIdx, setAltIdx] = useState<number | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [gif, setGif] = useState<StudioCard["gif"]>(card.gif ?? null);
  const [gifOpen, setGifOpen] = useState(false);
  const [linkDismissed, setLinkDismissed] = useState(false);
  const [gifQuery, setGifQuery] = useState("");
  const [gifResults, setGifResults] = useState<GifResult[]>([]);
  const [gifSearching, setGifSearching] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const status = card.status;
  const shownBody = translated ? translated.body : card.body;
  const charLen = (translated ? translated.body : card.body).length;

  // Thread chains: a body with `---`-only lines publishes as a multi-part
  // thread. We render the parts stacked, and in edit mode meter each part
  // against the per-post limit (the total can exceed it across parts).
  const viewSegments = splitThreadSegments(shownBody);
  const isThreadView = viewSegments.length > 1;
  const editSegments = splitThreadSegments(editText);
  const isThreadEdit = editSegments.length > 1;
  const editThreadOverLimit = editSegments.some((s) => s.length > DRAFT_LIMIT);

  async function runTweak(instruction: string) {
    if (!instruction.trim() || revising) return;
    setTweakOpen(false);
    setRevising(true);
    try {
      await h.onTweak(card, instruction.trim());
      setRevised(true);
      setTranslated(null);
    } finally {
      setRevising(false);
      setTweakInput("");
    }
  }

  async function runTranslate(lang: UiLang) {
    const body = await h.onTranslate(card, lang);
    setTranslated({ lang, body });
  }

  // ── images (post drafts only, before publish) ──
  const canEditMedia =
    card.kind === "post" && (status === "draft" || status === "ready") && !replyReadOnly;
  // Link card in the composer: a post draft that links out, with no image/GIF
  // attached (Threads renders a card OR media, not both) and not dismissed.
  const linkUrl =
    card.kind === "post" && media.length === 0 && !gif && !linkDismissed
      ? extractFirstUrl(card.body)
      : null;
  // GIF publish is gated off: Threads accepts only Tenor GIFs, and Google
  // closed the Tenor API to new clients (Jan 2026), so no key is obtainable.
  // The whole Tenor picker below stays implemented behind this flag — flip it
  // to true (and set TENOR_API_KEY) the moment a GIF provider is available.
  const gifEnabled: boolean = false;

  async function onPickFile() {
    const input = fileRef.current;
    const file = input?.files?.[0];
    if (input) input.value = ""; // let the same file be re-picked
    if (!file) return;
    setMediaError(null);
    if (!MEDIA_TYPES.includes(file.type)) {
      setMediaError(t("studio.image_bad_type"));
      return;
    }
    if (file.size > MEDIA_MAX_BYTES) {
      setMediaError(t("studio.image_too_large"));
      return;
    }
    setUploading(true);
    try {
      const { url } = await h.onUploadImage(file);
      const next = [...media, { url }];
      setMedia(next);
      await h.onSetMedia(card, next);
    } catch {
      setMediaError(t("studio.image_failed"));
    } finally {
      setUploading(false);
    }
  }

  async function removeImage(idx: number) {
    const prev = media;
    const next = media.filter((_, i) => i !== idx);
    setMedia(next);
    setMediaError(null);
    try {
      await h.onSetMedia(card, next);
    } catch {
      setMedia(prev); // revert on failure
      setMediaError(t("studio.image_failed"));
    }
  }

  async function persistMedia(next: { url: string; alt?: string | null }[]) {
    const prev = media;
    setMedia(next);
    try {
      await h.onSetMedia(card, next);
    } catch {
      setMedia(prev);
      setMediaError(t("studio.image_failed"));
    }
  }

  function reorderMedia(from: number, to: number) {
    if (from === to || from < 0 || to < 0) return;
    const next = [...media];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    void persistMedia(next);
  }

  async function runGifSearch(query: string) {
    if (!query.trim()) {
      setGifResults([]);
      return;
    }
    setGifSearching(true);
    try {
      setGifResults(await h.onSearchTenor(query.trim()));
    } catch {
      setGifResults([]);
    } finally {
      setGifSearching(false);
    }
  }

  async function pickGif(g: GifResult) {
    setGif({ gif_id: g.id, url: g.url, preview_url: g.preview_url, alt: g.alt });
    setGifOpen(false);
    setGifResults([]);
    setGifQuery("");
    setMediaError(null);
    try {
      await h.onSetGif(card, g);
    } catch {
      setMediaError(t("studio.image_failed"));
    }
  }

  async function removeGif() {
    const prev = gif;
    setGif(null);
    try {
      await h.onSetGif(card, null);
    } catch {
      setGif(prev);
    }
  }

  // ── ⋯-menu items per status ──
  const menuItems: MenuItem[] = [];
  if (status === "draft") {
    menuItems.push({ label: t("studio.reject"), Icon: IcX, onClick: () => h.onReject(card), danger: true });
    menuItems.push({ label: t("studio.tweak_action"), Icon: IcTweak, onClick: () => setTweakOpen(true) });
    menuItems.push({
      label: t("studio.edit"),
      Icon: IcPencil,
      onClick: () => {
        setEditText(card.body);
        setEditing(true);
      },
    });
  } else if (status === "ready") {
    if (demo) {
      menuItems.push({ label: t("studio.send_back"), Icon: IcUndo, onClick: () => h.onSendBack(card) });
      menuItems.push({
        label: t("studio.edit"),
        Icon: IcPencil,
        onClick: () => {
          setEditText(card.body);
          setEditing(true);
        },
      });
    }
  } else if (status === "rejected") {
    if (demo) menuItems.push({ label: t("studio.restore"), Icon: IcUndo, onClick: () => h.onRestore(card) });
  }
  // Hard-delete clears the draft from the queue. Offered on every
  // non-published, non-reply draft (the endpoint refuses only published) —
  // notably on an *approved* card, where there was no removal action before.
  // Undo-safe: the page drops it optimistically behind an Undo toast.
  if (status === "draft" || status === "ready" || status === "rejected") {
    menuItems.push({ label: t("studio.delete"), Icon: IcTrash, onClick: () => h.onDelete(card), danger: true });
  }

  const cardPad = compact ? "px-4 pb-[11px] pt-[13px]" : "px-[18px] pb-3.5 pt-4";
  const bodyCls = compact ? "mt-[9px] text-small" : "mt-3 text-body";
  const footCls = compact ? "mt-[11px] pt-2.5" : "mt-3.5 pt-3";

  return (
    <article
      className={cn(
        "relative rounded-lg border border-border bg-surface shadow-sm transition-colors focus-within:z-20 hover:border-text/15",
        cardPad,
        status === "published" && "bg-surface-2",
        status === "rejected" && "opacity-[0.72]",
      )}
      style={{ animation: "card-in var(--duration-slow) var(--ease-entrance) both" }}
    >
      {/* head */}
      <div className="flex items-center gap-2.5">
        <AccountFace url={card.author.avatarUrl} initials={card.author.initials} size={38} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-small font-semibold leading-[1.25]">{card.author.name}</div>
          <div className="flex flex-wrap items-center gap-x-1.5 text-caption text-text-subtle">
            {card.author.handle && <span className="truncate">@{card.author.handle}</span>}
            {card.kind === "reply" && card.reply?.who && (
              <>
                <span className="opacity-60">·</span>
                <span className="inline-flex items-center gap-1 whitespace-nowrap text-accent">
                  <IcReply size={12} />
                  {t("studio.replying_to")} @{card.reply.who}
                </span>
              </>
            )}
            <span className="opacity-60">·</span>
            <span className="whitespace-nowrap">{revised ? t("studio.revised") : card.time}</span>
          </div>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* reply context */}
      {card.kind === "reply" && card.reply?.text && (
        <div className="mt-3 flex gap-2.5 rounded-md border border-border bg-surface-2 p-3">
          <span className="w-0.5 shrink-0 self-stretch rounded bg-border" />
          <div className="min-w-0">
            {card.reply.who && (
              <div className="mb-0.5 text-caption font-semibold text-text-muted">@{card.reply.who}</div>
            )}
            <div className="text-small leading-[1.5] text-text-muted">{card.reply.text}</div>
          </div>
        </div>
      )}

      {/* body / editing / revising */}
      {revising ? (
        <div className="mt-3.5 flex flex-col gap-2">
          <div className="skel h-3.5 w-[92%] rounded" />
          <div className="skel h-3.5 w-full rounded" />
          <div className="skel h-3.5 w-[48%] rounded" />
          <span className="mt-1 inline-flex items-center gap-1.5 text-caption text-accent">
            <IcTweak size={13} /> {t("studio.revising")}
          </span>
        </div>
      ) : editing ? (
        <div className="mt-2.5">
          <textarea
            autoFocus
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={Math.min(12, Math.max(3, editText.split("\n").length + 1))}
            className="w-full resize-y rounded-md border border-accent bg-surface px-3 py-2.5 text-body leading-[1.62] text-text ring-[3px] ring-accent/[0.18] focus:outline-none"
          />
          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-2">
            <button
              type="button"
              onClick={() => setEditText((tx) => `${tx.trimEnd()}\n---\n`)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-caption text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
            >
              <IcThread size={13} /> {t("studio.thread_new_part")}
            </button>
            {isThreadEdit ? (
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-caption">
                {editSegments.map((s, i) => (
                  <span
                    key={i}
                    className={cn(
                      "tabular-nums",
                      s.length > DRAFT_LIMIT ? "font-semibold text-danger" : "text-text-subtle",
                    )}
                  >
                    {t("studio.thread_part")} {i + 1} · {s.length}/{DRAFT_LIMIT}
                  </span>
                ))}
              </div>
            ) : (
              <CharMeter len={editText.length} />
            )}
          </div>
        </div>
      ) : isThreadView ? (
        <div className={cn(compact ? "mt-[9px]" : "mt-3")}>
          <div className="mb-1.5 inline-flex items-center gap-1.5 text-caption text-text-muted">
            <IcThread size={13} /> {t("studio.thread_badge")} · {viewSegments.length}
          </div>
          <div className="flex flex-col gap-1.5">
            {viewSegments.map((seg, i) => (
              <div
                key={i}
                className={cn(
                  "whitespace-pre-wrap rounded-md border border-border bg-surface-2/40 px-3 py-2 leading-[1.6] text-text",
                  compact ? "text-small" : "text-body",
                  status === "published" && "text-text-muted",
                )}
              >
                {seg}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className={cn("whitespace-pre-wrap leading-[1.62] text-text", bodyCls, status === "published" && "text-text-muted")}>
          {shownBody}
        </p>
      )}

      {/* translate bar */}
      {translated && !editing && !revising && (
        <div className="mt-2.5 inline-flex items-center gap-2 rounded-full border border-border bg-surface-2 px-2.5 py-1 text-caption text-text-subtle">
          <IcGlobe size={13} />
          {t("studio.translated_to")} {translated.lang.native}
          <span className="h-[3px] w-[3px] rounded-full bg-text-subtle" />
          <button
            type="button"
            onClick={() => setTranslated(null)}
            className="font-semibold text-accent transition-colors hover:text-accent/80"
          >
            {t("studio.show_original")}
          </button>
        </div>
      )}

      {/* link card — OG preview when the draft links out (no image/GIF attached) */}
      {linkUrl && !editing && !revising && (
        <LinkPreviewCard url={linkUrl} onDismiss={() => setLinkDismissed(true)} />
      )}

      {/* media — attached images / GIF + attach controls (post drafts) */}
      {(media.length > 0 || gif || canEditMedia) && !editing && !revising && (
        <div className="mt-3">
          {gif && (
            <div className="relative inline-block max-w-[240px] overflow-hidden rounded-md border border-border bg-surface-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={gif.url} alt={gif.alt ?? ""} className="block max-h-[180px] w-full object-cover" />
              <span className="absolute left-1.5 top-1.5 rounded-full bg-black/60 px-1.5 py-0.5 text-[9.5px] font-bold tracking-wide text-white backdrop-blur-sm">
                GIF
              </span>
              {canEditMedia && (
                <button
                  type="button"
                  aria-label={t("studio.remove_gif")}
                  onClick={removeGif}
                  className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full border border-border bg-surface text-text shadow-sm transition-colors hover:bg-surface-2"
                >
                  <IcX size={12} />
                </button>
              )}
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-2 py-1 text-[9px] text-white">
                {t("studio.gif_powered")}
              </span>
            </div>
          )}
          {!gif && media.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {media.map((m, i) => (
                <div
                  key={m.url}
                  draggable={canEditMedia && media.length > 1}
                  onDragStart={() => setDragIdx(i)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (dragIdx !== null) reorderMedia(dragIdx, i);
                    setDragIdx(null);
                  }}
                  onDragEnd={() => setDragIdx(null)}
                  className={cn(
                    "relative h-[72px] w-[72px] overflow-hidden rounded-md border border-border bg-surface-2",
                    canEditMedia && media.length > 1 && "cursor-grab",
                    dragIdx === i && "opacity-50",
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={mediaUrl(m.url)} alt={m.alt ?? ""} className="h-full w-full object-cover" />
                  {canEditMedia && (
                    <>
                      <button
                        type="button"
                        aria-label={t("studio.remove_image")}
                        onClick={() => removeImage(i)}
                        className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full border border-border bg-surface text-text shadow-sm transition-colors hover:bg-surface-2"
                      >
                        <IcX size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setAltIdx(i)}
                        aria-label={t("studio.alt_label")}
                        className={cn(
                          "absolute bottom-1 left-1 inline-flex h-[18px] items-center gap-0.5 rounded-sm px-1 text-[9.5px] font-bold tracking-wide text-white backdrop-blur-sm",
                          m.alt ? "bg-success/90" : "bg-black/55",
                        )}
                      >
                        {m.alt && <IcCheck size={9} />} ALT
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {canEditMedia && altIdx !== null && media[altIdx] && (
            <div className="mt-2 rounded-md border border-accent/40 bg-surface-2 p-2.5">
              <div className="mb-1 text-caption text-text-muted">
                {t("studio.alt_label")} · {t("studio.alt_hint")}
              </div>
              <textarea
                autoFocus
                defaultValue={media[altIdx].alt ?? ""}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === "Enter")
                    (e.target as HTMLTextAreaElement).blur();
                  if (e.key === "Escape") setAltIdx(null);
                }}
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  const cur = altIdx;
                  void persistMedia(media.map((mm, ii) => (ii === cur ? { ...mm, alt: v || null } : mm)));
                  setAltIdx(null);
                }}
                rows={2}
                maxLength={1000}
                placeholder={t("studio.alt_placeholder")}
                className="w-full resize-y rounded-sm border border-border bg-surface px-2.5 py-2 text-small text-text outline-none focus:border-accent max-md:text-[16px]"
              />
            </div>
          )}

          {canEditMedia && !gif && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={onPickFile}
                className="hidden"
              />
              {media.length < MEDIA_MAX && (
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-caption text-text-muted transition-colors hover:bg-surface-2 hover:text-text disabled:opacity-60"
                >
                  <IcImage size={14} /> {uploading ? t("studio.image_uploading") : t("studio.add_image")}
                </button>
              )}
              {/* video stays gated (upload pipeline pending) */}
              <span
                title={t("studio.media_soon")}
                className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-caption text-text-subtle opacity-60"
              >
                <IcVideo size={14} /> {t("studio.video")}
                <span className="rounded-full bg-accent/12 px-1.5 text-[9.5px] font-semibold text-accent">{t("studio.soon")}</span>
              </span>
              {/* GIF — opens the Tenor picker (mutually exclusive with images).
                  Gated off via `gifEnabled` until a GIF provider is obtainable
                  (Threads = Tenor only; Tenor API closed to new clients). */}
              {gifEnabled ? (
                <button
                  type="button"
                  disabled={media.length > 0}
                  title={media.length > 0 ? t("studio.gif_excl") : undefined}
                  onClick={() => setGifOpen((v) => !v)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-caption text-text-muted transition-colors hover:bg-surface-2 hover:text-text disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <IcGif size={14} /> GIF
                </button>
              ) : (
                <span
                  title={t("studio.media_soon")}
                  className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-caption text-text-subtle opacity-60"
                >
                  <IcGif size={14} /> GIF
                  <span className="rounded-full bg-accent/12 px-1.5 text-[9.5px] font-semibold text-accent">{t("studio.soon")}</span>
                </span>
              )}
              {media.length > 1 && (
                <span className="text-caption text-text-subtle">{t("studio.media_reorder_hint")}</span>
              )}
              {mediaError && <span className="text-caption text-danger">{mediaError}</span>}
            </div>
          )}

          {gifEnabled && canEditMedia && !gif && gifOpen && (
            <div className="mt-2 rounded-lg border border-border bg-surface shadow-sm">
              <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                <IcSearch size={15} className="shrink-0 text-text-subtle" />
                <input
                  autoFocus
                  value={gifQuery}
                  onChange={(e) => {
                    setGifQuery(e.target.value);
                    void runGifSearch(e.target.value);
                  }}
                  placeholder={t("studio.gif_search")}
                  className="min-w-0 flex-1 bg-transparent text-small text-text outline-none placeholder:text-text-subtle max-md:text-[16px]"
                />
                <button
                  type="button"
                  aria-label={t("studio.gif_close")}
                  onClick={() => setGifOpen(false)}
                  className="text-text-subtle transition-colors hover:text-text"
                >
                  <IcX size={14} />
                </button>
              </div>
              {gifSearching ? (
                <div className="py-7 text-center text-caption text-text-subtle">{t("studio.gif_searching")}</div>
              ) : gifResults.length > 0 ? (
                <div className="flex gap-2 overflow-x-auto p-2">
                  {gifResults.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => pickGif(g)}
                      className="h-24 shrink-0 overflow-hidden rounded-sm border border-border bg-surface-2 transition-colors hover:border-accent/50"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={g.preview_url} alt={g.alt ?? ""} className="h-full w-auto max-w-none" />
                    </button>
                  ))}
                </div>
              ) : gifQuery.trim() ? (
                <div className="py-7 text-center text-caption text-text-subtle">{t("studio.gif_no_results")}</div>
              ) : (
                <div className="py-7 text-center text-caption text-text-subtle">{t("studio.gif_hint")}</div>
              )}
              <div className="border-t border-border py-1.5 text-center text-[10px] text-text-subtle">
                {t("studio.gif_powered")}
              </div>
            </div>
          )}
        </div>
      )}

      {/* revised note */}
      {revised && !editing && !revising && !translated && (
        <div className="mt-2.5 inline-flex items-center gap-1.5 text-caption text-accent">
          <IcSparkle size={13} /> {t("studio.revised")}
        </div>
      )}

      {/* tweakbar */}
      {tweakOpen && !editing && !revising && (
        <div className="mt-3">
          <div
            className="flex items-center gap-2 rounded-md border border-accent/40 bg-surface-2 py-2 pl-3 pr-2"
            style={{ animation: "card-in var(--duration-slow) var(--ease-entrance) both" }}
          >
            <IcTweak size={16} className="shrink-0 text-accent" />
            <input
              autoFocus
              value={tweakInput}
              onChange={(e) => setTweakInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  runTweak(tweakInput);
                }
                if (e.key === "Escape") setTweakOpen(false);
              }}
              placeholder={t("studio.tweak_placeholder")}
              className="min-w-0 flex-1 bg-transparent text-small text-text placeholder:text-text-subtle focus:outline-none"
            />
            <Button
              size="sm"
              variant="primary"
              aria-label={t("studio.tweak_action")}
              icon={<IcSend size={15} />}
              disabled={!tweakInput.trim()}
              onClick={() => runTweak(tweakInput)}
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(["studio.tweak_s1", "studio.tweak_s2", "studio.tweak_s3", "studio.tweak_s4"] as MessageKey[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => runTweak(t(k))}
                className="rounded-full border border-border bg-surface px-2.5 py-1 text-caption text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
              >
                {t(k)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* footer — hidden while revising */}
      {!revising && (
        <div className={cn("flex flex-wrap items-center gap-2.5 border-t border-border max-md:flex-col max-md:items-stretch", footCls)}>
          {renderFooter()}
        </div>
      )}
    </article>
  );

  function renderFooter() {
    if (editing) {
      return (
        <>
          <span className="text-caption text-text-subtle">{t("studio.editing")}</span>
          <div className="ml-auto flex items-center gap-2 max-md:w-full">
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)} className="max-md:min-h-[44px]">
              {t("studio.cancel")}
            </Button>
            <Button
              size="sm"
              variant="primary"
              className="max-md:h-auto max-md:min-h-[44px] max-md:flex-1 max-md:whitespace-normal"
              icon={<IcCheck size={15} />}
              disabled={
                editText.trim().length === 0 ||
                (isThreadEdit ? editThreadOverLimit : editText.length > DRAFT_LIMIT)
              }
              onClick={() => {
                h.onSaveEdit(card, editText);
                setEditing(false);
                setRevised(false);
              }}
            >
              {t("studio.save")}
            </Button>
          </div>
        </>
      );
    }

    if (status === "published") {
      return (
        <>
          <div className="flex flex-1 items-center gap-4 text-small text-text-muted">
            <Stat Icon={IcHeart} n={card.stats?.likes ?? 0} />
            <Stat Icon={IcBubble} n={card.stats?.replies ?? 0} />
            <Stat Icon={IcRepost} n={card.stats?.reposts ?? 0} />
          </div>
          <div className="ml-auto flex items-center gap-2 max-md:w-full">
            <CardMenu items={[]} translatedLang={translated?.lang ?? null} onTranslate={runTranslate} onShowOriginal={() => setTranslated(null)} />
            <a
              href={card.threadsUrl ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses({ variant: "secondary", size: "sm", className: "max-md:h-auto max-md:min-h-[44px] max-md:flex-1 max-md:whitespace-normal" })}
            >
              <IcExternal size={15} /> {t("studio.open_threads")}
            </a>
          </div>
        </>
      );
    }

    if (status === "rejected") {
      return (
        <>
          <span className="text-caption text-text-subtle">{t("studio.passed_on")}</span>
          <div className="ml-auto">
            <CardMenu items={menuItems} translatedLang={translated?.lang ?? null} onTranslate={runTranslate} onShowOriginal={() => setTranslated(null)} />
          </div>
        </>
      );
    }

    // Scheduled — queued for a future time; managed (reschedule / unschedule /
    // publish-now) from the Calendar. Studio just shows when it goes out.
    if (status === "scheduled") {
      return (
        <>
          <span className="inline-flex items-center gap-1.5 text-caption text-text-subtle">
            <IcClock size={12} />
            {card.scheduledAt
              ? `${t("studio.goes_out")} ${new Date(card.scheduledAt).toLocaleString(locale, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}`
              : t("studio.badge_scheduled")}
          </span>
          <div className="ml-auto">
            <CardMenu items={menuItems} translatedLang={translated?.lang ?? null} onTranslate={runTranslate} onShowOriginal={() => setTranslated(null)} />
          </div>
        </>
      );
    }

    // reply drafts (Q62) are read-only in Studio — managed in Replies.
    if (card.kind === "reply" && replyReadOnly) {
      return (
        <>
          <span className="text-caption text-text-subtle">{t("dashboard.draft.reply_managed")}</span>
          <a href="/app/replies" className="ml-auto inline-flex items-center gap-1 text-small font-medium text-accent hover:underline">
            {t("dashboard.draft.open_replies")}
          </a>
        </>
      );
    }

    // draft | ready
    const voiceTag =
      status === "ready" ? (
        <span className="inline-flex items-center gap-1.5 text-caption text-text-subtle">
          <IcCheck size={12} /> {t("studio.ready_tag")}
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 text-caption text-text-subtle">
          <IcSparkle size={12} /> {t("studio.in_your_voice")}
        </span>
      );
    return (
      <>
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="text-caption tabular-nums text-text-subtle">
            {charLen} / {DRAFT_LIMIT}
          </span>
          <span className="h-[3px] w-[3px] rounded-full bg-text-subtle" />
          {voiceTag}
        </div>
        <div className="ml-auto flex items-center gap-2 max-md:w-full">
          <CardMenu items={menuItems} translatedLang={translated?.lang ?? null} onTranslate={runTranslate} onShowOriginal={() => setTranslated(null)} />
          {status === "draft" ? (
            <Button size="sm" variant="primary" className="max-md:h-auto max-md:min-h-[44px] max-md:flex-1 max-md:whitespace-normal" icon={<IcCheck size={15} />} onClick={() => h.onApprove(card)}>
              {t("studio.approve")}
            </Button>
          ) : (
            <Button size="sm" variant="primary" className="max-md:h-auto max-md:min-h-[44px] max-md:flex-1 max-md:whitespace-normal" icon={<IcStudio size={15} />} onClick={() => h.onPublish(card)}>
              {t("studio.publish")}
            </Button>
          )}
        </div>
      </>
    );
  }
}

function Stat({ Icon, n }: { Icon: (p: { size?: number }) => ReactNode; n: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 tabular-nums">
      <Icon size={15} /> {n.toLocaleString()}
    </span>
  );
}

// ─────────────────────────────── Composer ───────────────────────────────────
const CHIPS: MessageKey[] = ["studio.chip_lesson", "studio.chip_trend", "studio.chip_mentions", "studio.chip_opinion"];

export function StudioComposer({
  avatarText,
  avatarUrl,
  value,
  onChange,
  count,
  onCount,
  onGenerate,
  onIdeas,
  busy,
  busyCount,
  disabled,
}: {
  avatarText: string;
  avatarUrl?: string | null;
  value: string;
  onChange: (v: string) => void;
  count: number;
  onCount: (n: number) => void;
  onGenerate: () => void;
  onIdeas: () => Promise<Idea[]>;
  busy: boolean;
  busyCount: number;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const [ideas, setIdeas] = useState<Idea[] | null>(null);
  const [ideasBusy, setIdeasBusy] = useState(false);
  const [ideasErr, setIdeasErr] = useState(false);
  async function loadIdeas() {
    setIdeasBusy(true);
    setIdeasErr(false);
    try {
      setIdeas(await onIdeas());
    } catch {
      setIdeasErr(true);
      setIdeas(null);
    } finally {
      setIdeasBusy(false);
    }
  }
  return (
    <section
      className={cn(
        "rounded-xl border bg-surface p-4 pb-3.5 shadow-sm transition-all",
        busy ? "border-accent/45" : "border-border focus-within:border-accent/55 focus-within:shadow-md",
      )}
    >
      {busy ? (
        <div className="flex items-center gap-3 px-0.5 py-1.5">
          <span className="text-text" style={{ animation: "nib-write 1.5s var(--ease-standard) infinite" }}>
            <IcNib size={22} />
          </span>
          <span className="text-h3 text-text">
            {t("studio.drafting_pre")} <b className="font-semibold">{busyCount}</b> {t("studio.drafting_post")}
            <span className="ml-1.5 inline-flex items-end gap-1 align-middle">
              {[0, 0.18, 0.36].map((d) => (
                <i
                  key={d}
                  className="inline-block h-1 w-1 rounded-full bg-text-subtle"
                  style={{ animation: `dot-pulse 1.2s var(--ease-standard) ${d}s infinite` }}
                />
              ))}
            </span>
          </span>
        </div>
      ) : (
        <>
          <div className="flex items-start gap-3">
            <AccountFace url={avatarUrl} initials={avatarText} size={38} className="max-md:hidden" />
            <textarea
              value={value}
              onChange={(e) => {
                onChange(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
              }}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") onGenerate();
              }}
              placeholder={t("studio.composer_placeholder")}
              rows={1}
              className="mt-1 min-h-[30px] flex-1 resize-none border-0 bg-transparent text-h3 leading-[1.45] text-text placeholder:text-text-subtle focus:outline-none"
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2.5 border-t border-border pt-3">
            <div className="flex gap-1.5 [scrollbar-width:none] max-md:w-full max-md:flex-nowrap max-md:overflow-x-auto max-md:[mask-image:linear-gradient(90deg,#000_calc(100%-20px),transparent)] md:min-w-0 md:flex-1 md:flex-wrap">
              <button
                type="button"
                onClick={loadIdeas}
                disabled={disabled || ideasBusy}
                aria-expanded={ideas !== null}
                className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-accent/40 bg-accent/10 px-2.5 py-1.5 text-small font-medium text-accent transition-colors hover:bg-accent/15 disabled:opacity-50"
              >
                <IcSparkle size={13} className={ideasBusy ? "animate-pulse" : ""} /> {t("studio.ideas")}
              </button>
              {CHIPS.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => onChange(t(k))}
                  className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-surface px-2.5 py-1.5 text-small font-medium text-text-muted transition-colors hover:border-text/20 hover:bg-surface-2 hover:text-text"
                >
                  <IcSparkle size={13} className="text-text-subtle" />
                  {t(k)}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 max-md:mt-2.5 max-md:w-full md:shrink-0">
              <div className="relative max-md:shrink-0">
                <select
                  value={count}
                  onChange={(e) => onCount(Number(e.target.value))}
                  aria-label={t("dashboard.composer.count_label")}
                  className="h-10 appearance-none rounded-md border border-border bg-surface pl-3 pr-8 text-small text-text transition-colors hover:bg-surface-2 focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/[0.22]"
                >
                  {[1, 2, 3, 4].map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? t("dashboard.composer.draft_one") : t("dashboard.composer.draft_few")}
                    </option>
                  ))}
                </select>
                <IcChevDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-text-subtle" />
              </div>
              <Button variant="primary" icon={<IcNib size={16} />} onClick={onGenerate} disabled={disabled || !value.trim()} className="max-md:h-auto max-md:min-h-[44px] max-md:flex-1 max-md:whitespace-normal">
                {t("studio.generate")}
              </Button>
            </div>
          </div>
          {(ideasBusy || ideas !== null || ideasErr) && (
            <div className="mt-3 border-t border-border pt-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-caption font-semibold uppercase tracking-[0.05em] text-text-subtle">
                  <IcSparkle size={12} className="text-accent" /> {t("studio.ideas_title")}
                </span>
                {ideas !== null && !ideasBusy && (
                  <div className="flex items-center gap-0.5">
                    <button type="button" onClick={loadIdeas} aria-label={t("studio.ideas_refresh")} className="grid h-7 w-7 place-items-center rounded-md text-text-subtle transition-colors hover:bg-surface-2 hover:text-text">
                      <IcReload size={13} />
                    </button>
                    <button type="button" onClick={() => setIdeas(null)} aria-label={t("studio.ideas_close")} className="grid h-7 w-7 place-items-center rounded-md text-text-subtle transition-colors hover:bg-surface-2 hover:text-text">
                      <IcX size={13} />
                    </button>
                  </div>
                )}
              </div>
              {ideasBusy ? (
                <div className="flex items-center gap-2 px-1 py-3 text-small text-text-muted">
                  <IcSparkle size={14} className="animate-pulse text-accent" /> {t("studio.ideas_loading")}
                </div>
              ) : ideasErr ? (
                <div className="flex items-center justify-between gap-2 px-1 py-2 text-small text-text-muted">
                  <span>{t("studio.ideas_error")}</span>
                  <button type="button" onClick={loadIdeas} className="font-medium text-accent hover:underline">
                    {t("studio.ideas_retry")}
                  </button>
                </div>
              ) : ideas && ideas.length > 0 ? (
                <ul className="flex flex-col gap-1.5">
                  {ideas.map((idea, i) => (
                    <li key={i}>
                      <button
                        type="button"
                        onClick={() => {
                          onChange(idea.hook);
                          setIdeas(null);
                        }}
                        className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-left transition-colors hover:border-accent/45 hover:bg-accent/[0.04]"
                      >
                        <span className="block text-small font-medium leading-snug text-text">{idea.hook}</span>
                        {idea.angle && <span className="mt-0.5 block text-caption text-text-subtle">{idea.angle}</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-1 py-2 text-small text-text-muted">{t("studio.ideas_empty")}</div>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}

// ────────────────────────────── FilterTabs ──────────────────────────────────
const TABS: { key: StudioStatus; label: MessageKey; dot: string }[] = [
  { key: "ready", label: "studio.tab_ready", dot: "bg-accent" },
  { key: "draft", label: "studio.tab_drafts", dot: "bg-ink-400" },
  { key: "scheduled", label: "studio.tab_scheduled", dot: "bg-accent" },
  { key: "published", label: "studio.tab_published", dot: "bg-success" },
  { key: "rejected", label: "studio.tab_rejected", dot: "bg-danger" },
];

export function FilterTabs({
  active,
  counts,
  onChange,
}: {
  active: StudioStatus;
  counts: Record<StudioStatus, number>;
  onChange: (s: StudioStatus) => void;
}) {
  const { t } = useTranslation();
  return (
    <div role="tablist" className="sticky top-13 z-[5] flex items-center gap-1 rounded-md border border-border bg-surface-2 p-1 [scrollbar-width:none] max-md:overflow-x-auto md:top-15">
      {TABS.map((tab) => {
        const on = active === tab.key;
        return (
          <button
            key={tab.key}
            role="tab"
            aria-selected={on}
            onClick={() => onChange(tab.key)}
            className={cn(
              "flex h-9 items-center justify-center gap-2 rounded-sm border px-2.5 text-small font-medium transition-colors max-md:shrink-0 md:flex-1",
              on ? "border-border bg-surface font-semibold text-text shadow-sm" : "border-transparent text-text-muted hover:text-text",
            )}
          >
            <span className={cn("h-[7px] w-[7px] shrink-0 rounded-full", tab.dot)} />
            <span className="truncate">{t(tab.label)}</span>
            <span className={cn("text-caption tabular-nums", on ? "text-text-muted" : "text-text-subtle")}>{counts[tab.key]}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────── Feed: skeleton/empty/error ─────────────────────
export function SkeletonCard() {
  return (
    <div className="rounded-lg border border-border bg-surface px-[18px] pb-3.5 pt-4 shadow-sm">
      <div className="flex items-center gap-2.5">
        <div className="skel h-[34px] w-[34px] rounded-full" />
        <div className="flex-1 space-y-1.5">
          <div className="skel h-3 w-32 rounded" />
          <div className="skel h-2.5 w-20 rounded" />
        </div>
      </div>
      <div className="mt-3.5 space-y-2">
        <div className="skel h-3.5 w-[96%] rounded" />
        <div className="skel h-3.5 w-full rounded" />
        <div className="skel h-3.5 w-[62%] rounded" />
      </div>
    </div>
  );
}

const EMPTY: Record<StudioStatus, { title: MessageKey; sub: MessageKey }> = {
  draft: { title: "studio.empty_draft_title", sub: "studio.empty_draft_sub" },
  ready: { title: "studio.empty_ready_title", sub: "studio.empty_ready_sub" },
  scheduled: { title: "studio.empty_scheduled_title", sub: "studio.empty_scheduled_sub" },
  published: { title: "studio.empty_published_title", sub: "studio.empty_published_sub" },
  rejected: { title: "studio.empty_rejected_title", sub: "studio.empty_rejected_sub" },
};

export function EmptyState({ status, onWrite }: { status: StudioStatus; onWrite?: () => void }) {
  const { t } = useTranslation();
  const e = EMPTY[status];
  return (
    <div className="flex flex-col items-center rounded-lg border border-dashed border-border bg-surface/50 px-6 py-14 text-center">
      <span className="grid h-[52px] w-[52px] place-items-center rounded-md border border-border bg-surface-2 text-text-subtle">
        <IcNib size={24} />
      </span>
      <h3 className="mt-3.5 text-h3 font-semibold">{t(e.title)}</h3>
      <p className="mt-1 max-w-[38ch] text-small text-text-muted">{t(e.sub)}</p>
      {status === "draft" && onWrite && (
        <button onClick={onWrite} className={cn("mt-4", buttonClasses({ variant: "secondary", size: "sm" }))}>
          {t("studio.empty_draft_cta")}
        </button>
      )}
    </div>
  );
}

export function ErrorBanner({
  onRetry,
  titleKey = "studio.error_title",
  subKey = "studio.error_sub",
}: {
  onRetry: () => void;
  titleKey?: MessageKey;
  subKey?: MessageKey;
}) {
  const { t } = useTranslation();
  return (
    <div
      className="flex items-center gap-3.5 rounded-lg border border-danger/30 bg-danger/[0.09] px-4 py-4"
      style={{ animation: "card-in var(--duration-slow) var(--ease-entrance) both" }}
    >
      <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full bg-danger/15 text-danger">
        <IcX size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-small font-semibold">{t(titleKey)}</div>
        <div className="text-caption text-text-muted">{t(subKey)}</div>
      </div>
      <button onClick={onRetry} className={buttonClasses({ variant: "secondary", size: "sm" })}>
        <IcReload size={15} /> {t("studio.retry")}
      </button>
    </div>
  );
}

// ─────────────────────────────── FirstRun ───────────────────────────────────
export function FirstRun({ onSetup }: { onSetup: () => void }) {
  const { t } = useTranslation();
  const steps: [MessageKey, MessageKey][] = [
    ["studio.fr_step1_t", "studio.fr_step1_d"],
    ["studio.fr_step2_t", "studio.fr_step2_d"],
    ["studio.fr_step3_t", "studio.fr_step3_d"],
  ];
  return (
    <>
      <section className="relative overflow-hidden rounded-xl border border-border bg-surface p-7 pb-6 shadow-sm">
        <BrandMark size={46} radius={11} className="shadow-sm" />
        <p className="mt-4 text-caption font-semibold uppercase tracking-[0.06em] text-accent">{t("studio.fr_eyebrow")}</p>
        <h2 className="mt-2.5 text-balance text-h2 font-semibold leading-[1.6] tracking-[-0.01em]">{t("studio.fr_title")}</h2>
        <p className="mt-3 max-w-[52ch] text-pretty text-body leading-relaxed text-text-muted">{t("studio.fr_lead")}</p>
        <div className="my-5 flex flex-col gap-0.5">
          {steps.map(([tk, dk], i) => (
            <div key={tk} className={cn("flex items-start gap-3 py-2.5", i > 0 && "border-t border-border")}>
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-surface-2 text-caption font-semibold text-text-muted">
                {i + 1}
              </span>
              <div>
                <div className="text-small font-semibold">{t(tk)}</div>
                <div className="text-small text-text-muted">{t(dk)}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onSetup} className={buttonClasses({ variant: "primary" })}>
            <IcVoice size={16} /> {t("studio.fr_cta")}
          </button>
          <span className="text-small text-text-subtle">{t("studio.fr_minutes")}</span>
        </div>
      </section>
      <section className="pointer-events-none rounded-xl border border-border bg-surface p-4 opacity-55 saturate-[0.6] shadow-sm">
        <div className="flex items-start gap-3">
          <span className="h-[38px] w-[38px] shrink-0 rounded-full bg-surface-2" />
          <span className="mt-2 text-h3 text-text-subtle">{t("studio.fr_disabled")}</span>
        </div>
      </section>
    </>
  );
}

// ──────────────────────────── Publish dialog ────────────────────────────────
export function StudioPublishDialog({
  open,
  text,
  account,
  publishing,
  scheduling = false,
  onClose,
  onConfirm,
  onSchedule,
}: {
  open: boolean;
  text: string;
  account: { name: string; handle: string | null; initials: string; avatarUrl?: string | null } | null;
  publishing: boolean;
  scheduling?: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onSchedule?: (scheduledAtIso: string) => void;
}) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<"now" | "schedule">("now");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const busy = publishing || scheduling;

  // On open: reset to "now" and pre-fill a sensible default (the next hour).
  useEffect(() => {
    if (!open) return;
    setMode("now");
    const d = new Date(Date.now() + 60 * 60 * 1000);
    d.setMinutes(0, 0, 0);
    const p = (n: number) => String(n).padStart(2, "0");
    setDate(`${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`);
    setTime(`${p(d.getHours())}:${p(d.getMinutes())}`);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onClose]);

  if (!open) return null;
  const over = text.length > DRAFT_LIMIT;
  const empty = text.length === 0;

  // Local date + time → an instant; valid only when ≥ 5 min out.
  const localDt = date && time ? new Date(`${date}T${time}`) : null;
  const validDt = localDt !== null && !Number.isNaN(localDt.getTime());
  const farEnough = validDt && localDt!.getTime() >= Date.now() + 5 * 60 * 1000;
  const utcLabel = validDt ? `= ${localDt!.toISOString().slice(11, 16)} UTC` : "";

  const seg = (key: "now" | "schedule", icon: ReactNode, label: string) => (
    <button
      type="button"
      onClick={() => setMode(key)}
      className={cn(
        "inline-flex flex-1 items-center justify-center gap-1.5 rounded-sm border px-3 py-2 text-small font-medium transition-colors",
        mode === key ? "border-border bg-surface text-text shadow-sm" : "border-transparent text-text-muted hover:text-text",
      )}
    >
      {icon}
      {label}
    </button>
  );
  const fieldCls = "h-9 rounded-md border border-border bg-surface px-2.5 text-small text-text outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 max-md:h-11 max-md:text-[16px]";

  return (
    <div
      className="fixed inset-0 z-40 grid place-items-center bg-ink-950/55 p-6 backdrop-blur-sm max-md:place-items-end max-md:p-0"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div
        className="w-full max-w-[420px] rounded-2xl border border-border bg-surface p-6 shadow-lg max-md:max-w-none max-md:rounded-b-none max-md:rounded-t-2xl max-md:pb-[calc(24px+env(safe-area-inset-bottom))]"
        style={{ animation: "dialog-in var(--duration-slow) var(--ease-entrance) both" }}
      >
        <div className="flex gap-3">
          <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-md border border-border bg-surface-2 text-text">
            <IcStudio size={18} />
          </span>
          <div className="min-w-0">
            <h2 className="text-h3 font-semibold leading-[1.3]">{t("studio.publish_title")}</h2>
            <p className="mt-1 text-small text-text-muted">{t("studio.publish_sub")}</p>
          </div>
        </div>

        <div className="mt-4 flex gap-1 rounded-md border border-border bg-surface-2 p-1">
          {seg("now", <IcSend size={15} />, t("studio.publish_now"))}
          {seg("schedule", <IcClock size={15} />, t("studio.schedule"))}
        </div>

        {mode === "schedule" && (
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            <label className="flex flex-col gap-1 text-caption font-medium text-text-subtle">
              {t("studio.sched_date")}
              <input type="date" value={date} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)} className={fieldCls} />
            </label>
            <label className="flex flex-col gap-1 text-caption font-medium text-text-subtle">
              {t("studio.sched_time")}
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={fieldCls} />
            </label>
            <p className="col-span-2 inline-flex items-center gap-1.5 text-caption text-text-subtle">
              <IcClock size={12} />
              {utcLabel} · {t("studio.sched_min")}
            </p>
          </div>
        )}

        {account && (
          <div className="mt-3.5 flex items-center gap-2.5 rounded-md border border-border bg-surface-2 px-3 py-2.5">
            <AccountFace url={account.avatarUrl} initials={account.initials} size={30} />
            <span className="min-w-0">
              <span className="block truncate text-small font-semibold">{account.name}</span>
              {account.handle && <span className="block truncate text-caption text-text-subtle">@{account.handle}</span>}
            </span>
          </div>
        )}
        <div className="mt-3.5 max-h-[180px] overflow-y-auto whitespace-pre-wrap rounded-md border border-border bg-surface-2 p-3.5 text-body leading-[1.6] text-text">
          {text}
        </div>
        <div className="mt-2.5">
          <CharMeter len={text.length} />
        </div>
        <div className="mt-5 flex items-center justify-end gap-2.5 max-md:flex-col-reverse max-md:items-stretch max-md:gap-2">
          <button onClick={onClose} disabled={busy} className={buttonClasses({ variant: "ghost", className: "max-md:min-h-[44px] max-md:w-full" })}>
            {t("studio.cancel")}
          </button>
          {mode === "now" ? (
            <Button variant="primary" className="max-md:min-h-[44px] max-md:w-full" icon={<IcCheck size={16} />} loading={publishing} disabled={busy || over || empty} onClick={onConfirm}>
              {over ? t("studio.too_long") : t("studio.publish_now")}
            </Button>
          ) : (
            <Button
              variant="primary"
              className="max-md:min-h-[44px] max-md:w-full"
              icon={<IcClock size={16} />}
              loading={scheduling}
              disabled={busy || over || empty || !farEnough}
              onClick={() => {
                if (farEnough && localDt) onSchedule?.(localDt.toISOString());
              }}
            >
              {over ? t("studio.too_long") : t("studio.schedule")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
