"use client";

import { useEffect, useState } from "react";

import { IcGlobe, IcX } from "@/components/icons";
import { fetchLinkPreview, mediaUrl } from "@/lib/api";
import { useTranslation } from "@/lib/i18n";
import type { LinkPreview } from "@/lib/types";

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/**
 * An OpenGraph link-preview card for a URL in a post/draft body. Threads' API
 * returns only the raw URL, so Pennedly builds the card from the server-fetched
 * OG metadata (`fetchLinkPreview`).
 *
 * Two modes:
 *  • auto — pass only `url`; the card fetches on mount and shows a loading
 *    skeleton, then the card, or renders nothing when no preview is available.
 *  • controlled — pass `preview` (a value, or `null`); the card renders that
 *    directly and never fetches. Used by the dev gallery to show states offline.
 *
 * `onDismiss` adds a remove button (the composer's "don't show this card").
 */
export function LinkPreviewCard({
  url,
  preview: controlled,
  onDismiss,
}: {
  url: string;
  preview?: LinkPreview | null;
  onDismiss?: () => void;
}) {
  const { t } = useTranslation();
  const isControlled = controlled !== undefined;
  const [data, setData] = useState<LinkPreview | null>(controlled ?? null);
  const [state, setState] = useState<"loading" | "ready" | "none">(
    isControlled ? (controlled ? "ready" : "none") : "loading",
  );

  useEffect(() => {
    if (isControlled) return;
    let alive = true;
    setState("loading");
    void fetchLinkPreview(url).then((p) => {
      if (!alive) return;
      if (p && (p.title || p.description || p.image)) {
        setData(p);
        setState("ready");
      } else {
        setState("none");
      }
    });
    return () => {
      alive = false;
    };
  }, [url, isControlled]);

  if (state === "loading") {
    return (
      <div className="mt-3 animate-pulse overflow-hidden rounded-lg border border-border bg-surface-2">
        <div className="h-28 w-full bg-border/40" />
        <div className="space-y-2 p-3">
          <div className="h-3 w-2/3 rounded bg-border/50" />
          <div className="h-2.5 w-1/2 rounded bg-border/40" />
        </div>
      </div>
    );
  }
  if (state === "none" || !data) return null;

  const host = data.site_name || hostOf(data.url);
  return (
    <div className="relative mt-3">
      <a
        href={data.url}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="block overflow-hidden rounded-lg border border-border bg-surface-2 transition-colors hover:border-text/15"
      >
        {data.image && (
          <img
            src={mediaUrl(data.image)}
            alt=""
            className="block max-h-52 w-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        )}
        <div className="p-3">
          <div className="mb-1 inline-flex max-w-full items-center gap-1.5 text-caption text-text-subtle">
            <IcGlobe size={12} className="shrink-0" />
            <span className="truncate">{host}</span>
          </div>
          {data.title && (
            <div className="line-clamp-2 text-small font-semibold leading-snug text-text">
              {data.title}
            </div>
          )}
          {data.description && (
            <div className="mt-1 line-clamp-2 text-caption leading-[1.5] text-text-muted">
              {data.description}
            </div>
          )}
        </div>
      </a>
      {onDismiss && (
        <button
          type="button"
          aria-label={t("link.dismiss")}
          onClick={onDismiss}
          className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full border border-border bg-surface/90 text-text-muted shadow-sm transition-colors hover:text-text"
        >
          <IcX size={14} />
        </button>
      )}
    </div>
  );
}
