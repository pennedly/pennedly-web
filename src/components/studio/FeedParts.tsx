"use client";

// My Feed presentational layer — pure components driven by props, so the live
// screen (real API) and the ?demo=1 review (mock data) render identical pixels.
// Built to Feed-SPEC.html: Baseline summary, sort segment, post cards with
// ViralityBadge ("Still settling" / "{r}× average" / "On par"), hero+sub metrics,
// auto-reply pill, ⋯-menu (translate + delete), confirm-delete dialog. The
// per-post growth chart was REMOVED 2026-07-10 (Zakhar: убрать «рост поста»).

import { useEffect, useRef, useState, type ReactNode } from "react";

import { mediaUrl } from "@/lib/api";
import { extractFirstUrl } from "@/lib/links";
import { cn } from "@/lib/cn";
import { useTranslation, type MessageKey } from "@/lib/i18n";
import { Button, buttonClasses } from "@/components/ui/button";
import { Mono } from "@/components/ui/mono";
import { AccountFace } from "@/components/ui/avatar";
import { LinkPreviewCard } from "@/components/studio/LinkPreviewCard";
import {
  IcArrowLeft,
  IcArrowUp,
  IcBubble,
  IcCheck,
  IcChevDown,
  IcClock,
  IcExpand,
  IcExternal,
  IcEye,
  IcFeed,
  IcGlobe,
  IcHeart,
  IcImage,
  IcPlay,
  IcMore,
  IcReply,
  IcRepost,
  IcStudio,
  IcTrash,
  IcUndo,
  IcX,
} from "@/components/icons";
import { UI_LANGS, type UiLang } from "@/components/studio/studio-demo";

export function fmt(n: number): string {
  // Round first: counts are whole, and the baseline card feeds in *averages*
  // (avg_views/likes/comments/reposts) that arrive fractional — "52.333 likes"
  // or "1.583 reposts" reads as a bug. Whole counts are unaffected.
  const r = Math.round(n);
  if (r >= 1_000_000) return (r / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (r >= 10_000) return (r / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return r.toLocaleString("en-US");
}

export type FeedCardModel = {
  id: number;
  kind: "post" | "reply";
  replyTo?: { who: string; text: string } | null;
  text: string;
  tr?: Record<string, string>;
  lang?: string | null;
  time: string;
  views: number;
  likes: number;
  comments: number;
  reposts: number;
  settling?: boolean;
  autoReply: boolean;
  media?: { url: string; alt?: string | null; type?: string | null; poster?: string | null }[];
  // Public Threads permalink for «Open in Threads». Null when we don't have one
  // yet (a fresh post before ingest, or Meta returned none) → the CTA renders
  // disabled instead of linking to a dead «#».
  threadsUrl?: string | null;
};

export type FeedHandlers = {
  onToggleAutoReply: (p: FeedCardModel) => void;
  onDelete: (p: FeedCardModel) => void;
  onTranslate: (p: FeedCardModel, lang: UiLang) => Promise<string>;
};

// ─────────────────────────────── FeedBar ────────────────────────────────────
export function FeedBar({ count, sort, onSort }: { count: number; sort: "recent" | "top"; onSort: (s: "recent" | "top") => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between gap-3 max-md:flex-wrap max-md:gap-y-2.5">
      <span className="text-small text-text-muted">
        <b className="font-semibold text-text">{count}</b> {t("feed.published_posts")}
      </span>
      <div role="tablist" aria-label={t("feed.sort_label")} className="inline-flex gap-[3px] rounded-md border border-border bg-surface-2 p-[3px] max-md:flex-wrap">
        {(["recent", "top"] as const).map((k) => (
          <button
            key={k}
            role="tab"
            aria-selected={sort === k}
            onClick={() => onSort(k)}
            className={cn(
              "h-[30px] rounded-sm border px-[13px] text-small font-medium transition-colors",
              sort === k ? "border-border bg-surface font-semibold text-text shadow-sm" : "border-transparent text-text-muted hover:text-text",
            )}
          >
            {t(k === "recent" ? "feed.sort_recent" : "feed.sort_top")}
          </button>
        ))}
      </div>
    </div>
  );
}

// ───────────────────────────── ViralityBadge ────────────────────────────────
function ViralityBadge({ ratio, settling }: { ratio: number | null; settling?: boolean }) {
  const { t } = useTranslation();
  const base =
    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[5px] text-caption font-semibold leading-none max-md:shrink-0 max-md:whitespace-normal max-md:text-balance max-md:leading-tight";
  if (settling)
    return (
      <span className={cn(base, "border-accent/28 bg-accent/12 text-accent")}>
        <IcClock size={12} className="animate-pulse" /> {t("feed.settling")}
      </span>
    );
  // No baseline yet (avg_views 0 — fresh account / thin history): a ratio
  // would be a lie («0.0× average» on every card, C10) — show nothing.
  if (ratio === null) return null;
  if (ratio >= 1.5)
    return (
      <span className={cn(base, "border-success/30 bg-success/[0.13] text-success")}>
        <IcArrowUp size={12} /> {ratio.toFixed(1)}
        {t("feed.times_average")}
      </span>
    );
  if (ratio >= 0.85) return <span className={cn(base, "border-border bg-surface-2 text-text-muted")}>{t("feed.on_par")}</span>;
  return (
    <span className={cn(base, "border-border bg-surface-2 text-text-muted")}>
      {ratio.toFixed(1)}
      {t("feed.times_average")}
    </span>
  );
}

// ─────────────────────────────── FeedMenu ───────────────────────────────────
function FeedMenu({
  threadsUrl,
  translatedLang,
  tester,
  onTranslate,
  onShowOriginal,
  onDelete,
}: {
  threadsUrl: string | null;
  translatedLang: UiLang | null;
  tester: boolean;
  onTranslate: (l: UiLang) => void;
  onShowOriginal: () => void;
  onDelete: () => void;
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
  const item = "flex w-full items-center gap-2.5 rounded-sm px-2.5 py-2 text-left text-small font-medium transition-colors";
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("dashboard.draft.more_actions")}
        onClick={() => setOpen((v) => !v)}
        className="grid h-[34px] w-[34px] place-items-center rounded-md border border-border bg-surface text-text-muted transition-colors hover:bg-surface-2 hover:text-text max-md:h-11 max-md:w-11 max-md:shrink-0"
      >
        <IcMore size={17} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute bottom-[calc(100%+6px)] right-0 z-30 max-h-[360px] min-w-[210px] overflow-y-auto rounded-md border border-border bg-surface p-1.5 shadow-lg"
          style={{ animation: "card-in var(--duration-fast) var(--ease-entrance) both" }}
        >
          {mode === "root" ? (
            <>
              {translatedLang && (
                <button role="menuitem" onClick={() => { shut(); onShowOriginal(); }} className={cn(item, "text-text hover:bg-surface-2")}>
                  <IcUndo size={15} /> {t("studio.show_original")}
                </button>
              )}
              <button role="menuitem" onClick={() => setMode("translate")} className={cn(item, "text-text hover:bg-surface-2")}>
                <IcGlobe size={15} />
                <span className="flex-1">{t("studio.translate")}</span>
                <IcChevDown size={13} className="-rotate-90 text-text-subtle" />
              </button>
              {threadsUrl ? (
                <a role="menuitem" href={threadsUrl} target="_blank" rel="noopener noreferrer" onClick={shut} className={cn(item, "text-text hover:bg-surface-2")}>
                  <IcExternal size={15} /> {t("feed.open_threads")}
                </a>
              ) : (
                <span role="menuitem" aria-disabled className={cn(item, "text-text-subtle opacity-50")}>
                  <IcExternal size={15} /> {t("feed.open_threads")}
                </span>
              )}
              {tester && (
                <>
                  <div className="my-1 h-px bg-border" />
                  <button role="menuitem" onClick={() => { shut(); onDelete(); }} className={cn(item, "text-danger hover:bg-danger/10")}>
                    <IcTrash size={15} /> {t("feed.delete_post")}
                  </button>
                </>
              )}
            </>
          ) : (
            <>
              <button onClick={() => setMode("root")} className="mb-1 flex w-full items-center gap-2 border-b border-border px-2.5 pb-2 pt-1 text-left text-caption font-semibold uppercase tracking-[0.04em] text-text-subtle">
                <IcArrowLeft size={14} /> {t("studio.translate_to")}
              </button>
              {UI_LANGS.map((l) => {
                const sel = l.code === "en" ? translatedLang === null : translatedLang?.code === l.code;
                return (
                  <button
                    key={l.code}
                    role="menuitemradio"
                    aria-checked={sel}
                    onClick={() => { shut(); if (l.code === "en") onShowOriginal(); else onTranslate(l); }}
                    className={cn("flex w-full items-center gap-2.5 rounded-sm px-2.5 py-2 text-left transition-colors hover:bg-surface-2", sel && "bg-surface-2")}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-small text-text">{l.name}</span>
                      <span className="block text-caption text-text-subtle">{l.code === "en" ? t("studio.original") : l.native}</span>
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

// ─────────────────────────────── FeedCard ───────────────────────────────────
type FeedPic = { url: string; alt?: string | null; type?: string | null; poster?: string | null };

type AspectVariant = "default" | "wide" | "square" | "tall";
const ASPECT_CLASS: Record<AspectVariant, string> = {
  default: "aspect-[3/2]",
  wide: "aspect-[16/9]",
  square: "aspect-square",
  tall: "aspect-[4/5]",
};
// Buckets a measured width/height into the spec's frame variants (default
// 3:2, wide 16:9, square 1:1, tall capped 4:5). The feed's media payload
// carries no dimensions from the backend, so this reads the real asset once
// it loads (img.naturalWidth/Height, video.videoWidth/Height) — thresholds
// sit at the geometric mean between each pair of canonical ratios.
function bucketAspect(w: number, h: number): AspectVariant {
  if (!w || !h) return "default";
  const r = w / h;
  if (r <= 0.9) return "tall";
  if (r <= 1.2) return "square";
  if (r <= 1.63) return "default";
  return "wide";
}

function fmtDuration(s: number): string {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const total = Math.round(s);
  const m = Math.floor(total / 60);
  const sec = total % 60;
  return `${m}:${sec < 10 ? "0" : ""}${sec}`;
}

// icons.tsx has no pause glyph yet (this fix's file scope is FeedParts.tsx /
// LinkPreviewCard.tsx only) — inline the same filled twin-bar mark the design
// spec defines for it, styled to match the rest of the icon set.
function PauseGlyph({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="7.4" y="5.5" width="3.4" height="13" rx="1.1" />
      <rect x="13.2" y="5.5" width="3.4" height="13" rx="1.1" />
    </svg>
  );
}

// A video item's own frame: a poster + duration chip until played, then real
// inline playback with a scrubber — it never jumps to the lightbox. `small`
// sizes the play badge/duration chip for a carousel slide vs. a lone video.
// `active` is false for an off-screen carousel slide, so swiping away pauses
// playback instead of leaving audio running behind another item.
function VideoFrame({
  m,
  small,
  active,
  onAspect,
  onError,
}: {
  m: FeedPic;
  small: boolean;
  active: boolean;
  onAspect: (v: AspectVariant) => void;
  onError: () => void;
}) {
  const { t } = useTranslation();
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [dur, setDur] = useState(0);

  useEffect(() => {
    if (!active && playing) {
      ref.current?.pause();
      setPlaying(false);
    }
  }, [active, playing]);

  return (
    <div className="relative h-full w-full bg-black">
      <video
        ref={ref}
        src={mediaUrl(m.url)}
        poster={m.poster ? mediaUrl(m.poster) : undefined}
        playsInline
        preload="metadata"
        onLoadedMetadata={(e) => {
          const el = e.currentTarget;
          setDur(el.duration);
          onAspect(bucketAspect(el.videoWidth, el.videoHeight));
        }}
        onTimeUpdate={(e) => setElapsed(e.currentTarget.currentTime)}
        onEnded={() => setPlaying(false)}
        onError={onError}
        className="h-full w-full object-cover"
      />
      {!playing ? (
        <>
          {dur > 0 && (
            <span
              className={cn(
                "pointer-events-none absolute inline-flex items-center gap-[5px] rounded-full bg-black/60 px-[9px] py-1 text-caption font-semibold text-white backdrop-blur-sm",
                small ? "bottom-2.5 left-2.5" : "bottom-2.5 right-2.5",
              )}
            >
              {small && <IcPlay size={11} />} {fmtDuration(dur)}
            </span>
          )}
          <button
            type="button"
            aria-label={t("feed.play_video")}
            onClick={() => {
              void ref.current?.play();
              setPlaying(true);
            }}
            className={cn(
              "absolute inset-0 m-auto grid place-items-center rounded-full border-[1.5px] border-white/55 bg-black/48 text-white backdrop-blur-sm transition-transform hover:scale-[1.04]",
              small ? "h-[42px] w-[42px]" : "h-[58px] w-[58px]",
            )}
          >
            <IcPlay size={small ? 18 : 22} className="ml-[3px]" />
          </button>
        </>
      ) : (
        <div className="absolute inset-x-0 bottom-0 flex items-center gap-[9px] bg-gradient-to-t from-black/70 to-transparent px-3 pb-[11px] pt-2.5">
          <button
            type="button"
            aria-label={t("feed.pause_video")}
            onClick={() => {
              ref.current?.pause();
              setPlaying(false);
            }}
            className="grid h-[26px] w-[26px] shrink-0 place-items-center text-white"
          >
            <PauseGlyph size={16} />
          </button>
          <span className="h-1 flex-1 overflow-hidden rounded-full bg-white/28">
            <span className="block h-full rounded-full bg-white" style={{ width: `${dur ? (elapsed / dur) * 100 : 0}%` }} />
          </span>
          <span className="shrink-0 whitespace-nowrap font-mono text-[11px] tabular-nums text-white">
            {fmtDuration(elapsed)} / {fmtDuration(dur)}
          </span>
        </div>
      )}
    </div>
  );
}

// A still image with a shimmer while it loads. `<img>`'s onLoad can fire
// before React attaches the listener — a data-URI or a cached response can
// resolve synchronously during mount — which would otherwise strand the
// shimmer on screen forever over an opacity-0 image. The mount check below
// (img.complete) catches that race.
function ImageFrame({
  m,
  loaded,
  onLoaded,
  onAspect,
  onError,
}: {
  m: FeedPic;
  loaded: boolean;
  onLoaded: () => void;
  onAspect: (v: AspectVariant) => void;
  onError: () => void;
}) {
  const ref = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el && el.complete && el.naturalWidth > 0) {
      onLoaded();
      onAspect(bucketAspect(el.naturalWidth, el.naturalHeight));
    }
    // Mount-only: catches an image that finished loading before this effect
    // could attach; the live onLoad handler below covers every other case.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative h-full w-full">
      {!loaded && <div className="skel absolute inset-0" />}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={ref}
        src={mediaUrl(m.url)}
        alt={m.alt ?? ""}
        onLoad={(e) => {
          const el = e.currentTarget;
          onLoaded();
          onAspect(bucketAspect(el.naturalWidth, el.naturalHeight));
        }}
        onError={onError}
        className={cn("h-full w-full object-cover", !loaded && "opacity-0")}
      />
    </div>
  );
}

// Images on a published post: a single image, or a swipeable carousel. Click to
// open the lightbox. Renders nothing for a text-only post. (GIF/link/poll/
// quote variants from the spec are deferred until the feed carries that data.)
// Exported so the dev /gallery route can render it in every state.
export function FeedMedia({ media }: { media?: FeedPic[] | null }) {
  const { t } = useTranslation();
  const [idx, setIdx] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [broken, setBroken] = useState<Record<number, boolean>>({});
  const [loaded, setLoaded] = useState<Record<number, boolean>>({});
  const [aspect, setAspect] = useState<Record<number, AspectVariant>>({});
  if (!media || media.length === 0) return null;
  const total = media.length;
  const cur = Math.min(idx, total - 1);
  // Carousel slides share one aspect, locked to the first item — matches the
  // spec (per-slide aspect would jump the card's height mid-swipe).
  const carouselAspect = ASPECT_CLASS[aspect[0] ?? "default"];

  function setItemAspect(i: number, v: AspectVariant) {
    setAspect((a) => (a[i] ? a : { ...a, [i]: v }));
  }

  const frame = (i: number) => {
    const m = media[i];
    if (broken[i]) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-surface-2 text-center text-text-subtle">
          <span className="grid h-10 w-10 place-items-center rounded-md border border-border">
            <IcImage size={20} />
          </span>
          <span className="text-small font-semibold text-text-muted">{t("feed.image_unavailable")}</span>
        </div>
      );
    }
    if (m.type === "video") {
      return (
        <VideoFrame
          m={m}
          small={total > 1}
          active={i === cur}
          onAspect={(v) => setItemAspect(i, v)}
          onError={() => setBroken((b) => ({ ...b, [i]: true }))}
        />
      );
    }
    return (
      <ImageFrame
        m={m}
        loaded={!!loaded[i]}
        onLoaded={() => setLoaded((l) => (l[i] ? l : { ...l, [i]: true }))}
        onAspect={(v) => setItemAspect(i, v)}
        onError={() => setBroken((b) => ({ ...b, [i]: true }))}
      />
    );
  };

  return (
    <div className="mt-3.5 max-md:mt-3">
      {total === 1 ? (
        media[0].type === "video" ? (
          <div className={cn("relative w-full overflow-hidden rounded-md border border-border bg-surface-2", ASPECT_CLASS[aspect[0] ?? "default"])}>
            {frame(0)}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setLightbox(0)}
            className="relative block w-full overflow-hidden rounded-md border border-border bg-surface-2"
          >
            <div className={cn("w-full", ASPECT_CLASS[aspect[0] ?? "default"])}>{frame(0)}</div>
            <span className="pointer-events-none absolute bottom-2.5 right-2.5 inline-flex items-center gap-[5px] rounded-full bg-black/60 px-[9px] py-1 text-caption font-semibold text-white backdrop-blur-sm">
              <IcExpand size={13} /> {t("feed.expand")}
            </span>
          </button>
        )
      ) : (
        <div className="relative overflow-hidden rounded-md border border-border bg-surface-2">
          <div
            className="flex transition-transform duration-300 ease-out motion-reduce:transition-none"
            style={{ transform: `translateX(-${cur * 100}%)` }}
          >
            {media.map((m, i) =>
              m.type === "video" ? (
                <div key={i} className={cn("relative w-full shrink-0", carouselAspect)}>
                  {frame(i)}
                </div>
              ) : (
                <button
                  key={i}
                  type="button"
                  onClick={() => setLightbox(i)}
                  className={cn("block w-full shrink-0", carouselAspect)}
                >
                  {frame(i)}
                </button>
              ),
            )}
          </div>
          <span className="pointer-events-none absolute right-2.5 top-2.5 rounded-full bg-black/60 px-[9px] py-1 text-caption font-semibold text-white backdrop-blur-sm">
            {cur + 1} / {total}
          </span>
          {cur > 0 && (
            <button
              type="button"
              aria-label={t("feed.prev")}
              onClick={() => setIdx(cur - 1)}
              className="absolute left-2.5 top-1/2 hidden h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white backdrop-blur-sm md:grid"
            >
              <IcArrowLeft size={16} />
            </button>
          )}
          {cur < total - 1 && (
            <button
              type="button"
              aria-label={t("feed.next")}
              onClick={() => setIdx(cur + 1)}
              className="absolute right-2.5 top-1/2 hidden h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white backdrop-blur-sm md:grid"
            >
              <IcArrowLeft size={16} className="rotate-180" />
            </button>
          )}
          <div className="absolute bottom-2.5 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/40 px-[9px] py-[5px] backdrop-blur-sm">
            {media.map((_, i) => (
              <span key={i} className={cn("h-1.5 w-1.5 rounded-full", i === cur ? "bg-white" : "bg-white/50")} />
            ))}
          </div>
        </div>
      )}
      {lightbox !== null && (
        <FeedLightbox media={media} start={lightbox} onClose={() => setLightbox(null)} />
      )}
    </div>
  );
}

function FeedLightbox({ media, start, onClose }: { media: FeedPic[]; start: number; onClose: () => void }) {
  const { t } = useTranslation();
  const [i, setI] = useState(start);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setI((x) => Math.max(0, x - 1));
      if (e.key === "ArrowRight") setI((x) => Math.min(media.length - 1, x + 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [media.length, onClose]);
  const m = media[Math.min(i, media.length - 1)];
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-sm" onClick={onClose}>
      <div className="flex items-center gap-3 px-4 py-3.5 text-white" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          aria-label={t("feed.close")}
          onClick={onClose}
          className="grid h-[34px] w-[34px] place-items-center rounded-full bg-white/15 hover:bg-white/25"
        >
          <IcX size={18} />
        </button>
        {media.length > 1 && <span className="font-mono text-xs text-white/80">{i + 1} / {media.length}</span>}
      </div>
      <div className="relative grid min-h-0 flex-1 place-items-center px-4 py-2" onClick={(e) => e.stopPropagation()}>
        {m.type === "video" ? (
          <video
            src={mediaUrl(m.url)}
            poster={m.poster ? mediaUrl(m.poster) : undefined}
            controls
            autoPlay
            playsInline
            className="max-h-full max-w-full rounded-md border border-white/15 object-contain"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mediaUrl(m.url)} alt={m.alt ?? ""} className="max-h-full max-w-full rounded-md border border-white/15 object-contain" />
        )}
        {media.length > 1 && i > 0 && (
          <button
            type="button"
            aria-label={t("feed.prev")}
            onClick={() => setI(i - 1)}
            className="absolute left-[18px] top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white"
          >
            <IcArrowLeft size={18} />
          </button>
        )}
        {media.length > 1 && i < media.length - 1 && (
          <button
            type="button"
            aria-label={t("feed.next")}
            onClick={() => setI(i + 1)}
            className="absolute right-[18px] top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white"
          >
            <IcArrowLeft size={18} className="rotate-180" />
          </button>
        )}
      </div>
      {m.alt && (
        <div className="px-[18px] pb-[18px] pt-3 text-center text-small text-white/75" onClick={(e) => e.stopPropagation()}>
          {m.alt}
        </div>
      )}
    </div>
  );
}

export function FeedCard({
  p,
  baselineViews,
  authorInitials,
  authorAvatar,
  authorName,
  authorHandle,
  tester,
  replyMasterOff = false,
  h,
}: {
  p: FeedCardModel;
  baselineViews: number;
  authorInitials: string;
  authorAvatar?: string | null;
  authorName: string;
  authorHandle: string;
  tester: boolean;
  /** The account's reply master is OFF — a per-post «reply to this» is stored
   *  but nothing goes out until the master is back on, so say so instead of
   *  letting the pill claim replies are running. */
  replyMasterOff?: boolean;
  h: FeedHandlers;
}) {
  const { t } = useTranslation();
  const [translated, setTranslated] = useState<{ lang: UiLang; body: string } | null>(null);
  const ratio = baselineViews > 0 ? p.views / baselineViews : null;
  const body = translated ? translated.body : p.text;
  // Link card: only when the post carries no image media (Threads shows a card
  // OR media, not both) and the body has a URL. Extracted from the original
  // text so a translation doesn't change which link is previewed.
  const linkUrl = !p.media || p.media.length === 0 ? extractFirstUrl(p.text) : null;

  async function runTranslate(lang: UiLang) {
    const tx = await h.onTranslate(p, lang);
    setTranslated({ lang, body: tx });
  }

  return (
    <article
      className="rounded-lg border border-border bg-surface px-[18px] pb-3.5 pt-4 shadow-sm transition-colors hover:border-text/15"
      style={{ animation: "card-in var(--duration-slow) var(--ease-entrance) both" }}
    >
      {/* head */}
      <div className="flex items-center gap-[11px]">
        <AccountFace url={authorAvatar} initials={authorInitials} size={38} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-small font-semibold leading-[1.25]">{authorName}</div>
          <div className="flex flex-wrap items-center gap-x-1.5 text-caption text-text-subtle">
            <span className="truncate">@{authorHandle}</span>
            {p.kind === "reply" && p.replyTo?.who && (
              <>
                <span className="opacity-60">·</span>
                <span className="inline-flex items-center gap-1 whitespace-nowrap">
                  <IcReply size={12} /> {t("studio.replying_to")} @{p.replyTo.who}
                </span>
              </>
            )}
            <span className="opacity-60">·</span>
            <span>{p.time}</span>
          </div>
        </div>
        <ViralityBadge ratio={ratio} settling={p.settling} />
      </div>

      {/* reply context */}
      {p.kind === "reply" && p.replyTo?.text && (
        <div className="mt-3 flex gap-2.5 rounded-md border border-border bg-surface-2 p-3">
          <span className="w-0.5 shrink-0 self-stretch rounded bg-border" />
          <div className="min-w-0">
            <div className="mb-0.5 text-caption font-semibold text-text-muted">@{p.replyTo.who}</div>
            <div className="text-small leading-[1.5] text-text-muted">{p.replyTo.text}</div>
          </div>
        </div>
      )}

      {/* body */}
      <p className="mt-3 whitespace-pre-wrap text-body leading-[1.62] text-text">{body}</p>
      {translated && (
        <div className="mt-[9px] inline-flex items-center gap-2 rounded-full border border-border bg-surface-2 px-2.5 py-[5px] text-caption text-text-subtle max-md:flex max-md:max-w-full max-md:flex-wrap">
          <IcGlobe size={13} className="max-md:shrink-0" /> {t("studio.translated_to")} {translated.lang.native}
          <span className="h-[3px] w-[3px] rounded-full bg-text-subtle" />
          <button type="button" onClick={() => setTranslated(null)} className="font-semibold text-accent transition-colors hover:text-accent/80">
            {t("studio.show_original")}
          </button>
        </div>
      )}

      {/* media — images carried by the post (between text and metrics) */}
      <FeedMedia media={p.media} />
      {/* link card — built from OG metadata when the post links out (no media) */}
      {linkUrl && <LinkPreviewCard url={linkUrl} />}

      {/* metrics — desktop: one inline row; mobile: hero on its own line, subs in an even row below */}
      <div className="mt-3.5 flex flex-wrap items-baseline gap-x-[22px] gap-y-2.5 max-md:flex-col max-md:items-stretch max-md:gap-y-3">
        <span className="mr-1 inline-flex items-baseline gap-[9px]">
          <IcEye size={18} className="self-center text-text-muted" />
          <span className="text-h2 font-semibold tabular-nums max-md:text-h3">{fmt(p.views)}</span>
          <span className="text-small text-text-subtle">{t("feed.views")}</span>
        </span>
        <div className="contents max-md:flex max-md:flex-wrap max-md:items-baseline max-md:gap-x-[18px] max-md:gap-y-2.5">
          <Sub Icon={IcHeart} n={p.likes} />
          <Sub Icon={IcBubble} n={p.comments} />
          <Sub Icon={IcRepost} n={p.reposts} />
        </div>
      </div>

      {/* footer — desktop: one row; mobile two-tier (auto-replies pill on its own meta line, then action row) */}
      <div className="mt-3.5 flex items-center gap-3 border-t border-border pt-[13px] max-md:flex-col max-md:items-stretch max-md:gap-2.5">
        <button
          type="button"
          aria-pressed={p.autoReply}
          onClick={() => h.onToggleAutoReply(p)}
          title={p.autoReply && replyMasterOff ? t("feed.autoreply_master_off") : undefined}
          className={cn(
            "inline-flex h-8 items-center gap-[7px] rounded-full border pl-[11px] pr-[13px] text-small font-medium transition-colors max-md:h-9 max-md:self-start",
            // ON + master OFF reads as pending, not active — the accent tint is
            // reserved for replies that actually go out.
            p.autoReply && !replyMasterOff
              ? "border-accent/32 bg-accent/12 text-accent"
              : p.autoReply
                ? "border-warning/30 bg-warning/[0.08] text-text-muted"
                : "border-border bg-surface-2 text-text-muted hover:border-text/20",
          )}
        >
          {p.autoReply ? <IcReply size={14} /> : <span className="h-[9px] w-[9px] rounded-full border-[1.6px] border-text-subtle" />}
          {p.autoReply ? (replyMasterOff ? t("feed.autoreply_paused") : t("feed.autoreply_on")) : t("feed.autoreply_off")}
        </button>
        <div className="ml-auto flex items-center gap-2 max-md:ml-0 max-md:w-full">
          {p.threadsUrl ? (
            <a
              href={p.threadsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses({ variant: "primary", size: "sm", className: "max-md:h-auto max-md:min-h-[44px] max-md:flex-1 max-md:whitespace-normal" })}
            >
              <IcExternal size={15} /> {t("feed.open_threads")}
            </a>
          ) : (
            <span
              aria-disabled
              className={buttonClasses({ variant: "primary", size: "sm", className: "pointer-events-none opacity-45 max-md:h-auto max-md:min-h-[44px] max-md:flex-1 max-md:whitespace-normal" })}
            >
              <IcExternal size={15} /> {t("feed.open_threads")}
            </span>
          )}
          <FeedMenu
            threadsUrl={p.threadsUrl ?? null}
            translatedLang={translated?.lang ?? null}
            tester={tester}
            onTranslate={runTranslate}
            onShowOriginal={() => setTranslated(null)}
            onDelete={() => h.onDelete(p)}
          />
        </div>
      </div>
    </article>
  );
}

function Sub({ Icon, n }: { Icon: (p: { size?: number; className?: string }) => ReactNode; n: number }) {
  return (
    <span className="inline-flex items-baseline gap-[7px]">
      <Icon size={15} className="self-center text-text-subtle" />
      <span className="text-body font-semibold tabular-nums">{fmt(n)}</span>
    </span>
  );
}

// ───────────────────────── empty / skeleton / dialog ────────────────────────
export function FeedEmpty({ onStudio }: { onStudio: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center rounded-lg border border-dashed border-border bg-surface/50 px-6 py-14 text-center">
      <span className="grid h-[52px] w-[52px] place-items-center rounded-lg border border-border bg-surface-2 text-text-subtle">
        <IcFeed size={24} />
      </span>
      <h3 className="mt-3.5 text-h3 font-semibold">{t("feed.empty_title")}</h3>
      <p className="mt-1 max-w-[38ch] text-small text-text-muted">{t("feed.empty")}</p>
      <button onClick={onStudio} className={cn("mt-4", buttonClasses({ variant: "secondary", size: "sm" }))}>
        <IcStudio size={16} /> {t("feed.empty_cta")}
      </button>
    </div>
  );
}

export function FeedSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-surface px-[18px] pb-3.5 pt-4 shadow-sm">
      <div className="flex items-center gap-[11px]">
        <div className="skel h-[34px] w-[34px] rounded-full" />
        <div className="flex-1 space-y-1.5">
          <div className="skel h-3 w-32 rounded" />
          <div className="skel h-2.5 w-20 rounded" />
        </div>
        <div className="skel h-[22px] w-[92px] rounded-full" />
      </div>
      <div className="mt-3 space-y-2">
        <div className="skel h-3.5 w-[94%] rounded" />
        <div className="skel h-3.5 w-[70%] rounded" />
      </div>
      <div className="mt-3.5 flex gap-5">
        <div className="skel h-[18px] w-24 rounded" />
        <div className="skel h-[14px] w-14 rounded" />
        <div className="skel h-[14px] w-14 rounded" />
      </div>
    </div>
  );
}

export function ConfirmDelete({
  open,
  text,
  deleting,
  onClose,
  onConfirm,
}: {
  open: boolean;
  text: string;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !deleting) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, deleting, onClose]);
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-40 grid place-items-center bg-ink-950/55 p-6 backdrop-blur-sm max-md:place-items-end max-md:p-0"
      role="dialog"
      aria-modal="true"
      aria-label={t("feed.delete_post")}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !deleting) onClose();
      }}
    >
      <div
        className="w-full max-w-[420px] rounded-2xl border border-border bg-surface p-6 shadow-lg max-md:max-w-none max-md:rounded-b-none max-md:rounded-t-2xl max-md:pb-[calc(24px+env(safe-area-inset-bottom))]"
        style={{ animation: "dialog-in var(--duration-slow) var(--ease-entrance) both" }}
      >
        <div className="flex items-start gap-3">
          <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-md border border-danger/28 bg-danger/12 text-danger">
            <IcTrash size={18} />
          </span>
          <div className="min-w-0">
            <h2 className="text-h3 font-semibold leading-[1.3]">{t("feed.delete_title")}</h2>
            <p className="mt-1 text-small text-text-muted">{t("feed.delete_sub")}</p>
          </div>
        </div>
        <div className="mt-3.5 whitespace-pre-wrap rounded-md border border-border bg-surface-2 px-[14px] py-3 text-small leading-[1.55] text-text-muted">{text}</div>
        <div className="mt-[22px] flex items-center justify-end gap-2.5 max-md:flex-col-reverse max-md:items-stretch max-md:gap-2">
          <button onClick={onClose} disabled={deleting} className={buttonClasses({ variant: "ghost", className: "max-md:min-h-[44px] max-md:w-full" })}>
            {t("studio.cancel")}
          </button>
          <Button variant="danger" className="max-md:min-h-[44px] max-md:w-full" icon={<IcTrash size={15} />} loading={deleting} onClick={onConfirm}>
            {t("feed.delete_post")}
          </Button>
        </div>
      </div>
    </div>
  );
}
