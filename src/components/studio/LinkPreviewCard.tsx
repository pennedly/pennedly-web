"use client";

import { useEffect, useState } from "react";

import { IcExternal, IcGlobe, IcLink, IcX } from "@/components/icons";
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

// Raw-URL text for the bare-fallback chip — same host, no protocol noise.
function bareUrl(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

/**
 * An OpenGraph link-preview card for a URL in a post/draft body. Threads' API
 * returns only the raw URL, so Pennedly builds the card from the server-fetched
 * OG metadata (`fetchLinkPreview`).
 *
 * Two modes:
 *  • auto — pass only `url`; the card fetches on mount and shows a loading
 *    skeleton, then the card, or a bare domain+URL fallback when no preview
 *    is available — the card never just disappears.
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
      // Gate on what the loaded card actually renders (title / image). A
      // description-only result has nothing showable in the spec's card
      // anatomy, so it falls through to the bare URL-chip fallback below.
      if (p && (p.title || p.image)) {
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
      <div className="mt-3 flex animate-pulse flex-col overflow-hidden rounded-lg border border-border bg-surface-2 md:flex-row">
        <div className="h-28 w-full shrink-0 bg-border/40 md:h-auto md:w-32" />
        <div className="min-w-0 flex-1 space-y-2 p-3">
          <div className="h-3 w-2/3 rounded bg-border/50" />
          <div className="h-2.5 w-1/2 rounded bg-border/40" />
        </div>
      </div>
    );
  }

  const dismissBtn = onDismiss && (
    <button
      type="button"
      aria-label={t("link.dismiss")}
      onClick={onDismiss}
      className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full border border-border bg-surface/90 text-text-muted shadow-sm transition-colors hover:text-text"
    >
      <IcX size={14} />
    </button>
  );

  // No OG data (fetch failed, or it returned nothing usable) — a bare card
  // with just the domain + raw-URL chip, so the link never just vanishes.
  if (state === "none" || !data) {
    return (
      <div className="relative mt-3">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="block overflow-hidden rounded-lg border border-border bg-surface-2 transition-colors hover:border-text/15"
        >
          <div className="flex min-w-0 flex-col gap-2 px-3.5 py-3">
            <div className="line-clamp-2 text-small font-semibold leading-snug text-text">{t("link.unavailable")}</div>
            <div className="inline-flex max-w-full items-center gap-[7px] self-start rounded-sm border border-border bg-surface-2 px-[9px] py-1 font-mono text-[11.5px] text-text-muted">
              <IcLink size={13} className="shrink-0 text-text-subtle" />
              <span className="truncate">{bareUrl(url)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-caption text-text-subtle">
              <span className="truncate">{hostOf(url)}</span>
              <IcExternal size={12} className="ml-auto shrink-0" />
            </div>
          </div>
        </a>
        {dismissBtn}
      </div>
    );
  }

  const host = data.site_name || hostOf(data.url);
  return (
    <div className="relative mt-3">
      <a
        href={data.url}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="flex flex-col overflow-hidden rounded-lg border border-border bg-surface-2 transition-colors hover:border-text/15 md:flex-row"
      >
        {data.image && (
          <img
            src={mediaUrl(data.image)}
            alt=""
            className="block aspect-video w-full shrink-0 object-cover md:aspect-auto md:h-auto md:w-32"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        )}
        <div className="min-w-0 flex-1 p-3">
          <div className="mb-1 flex max-w-full items-center gap-1.5 text-caption text-text-subtle">
            <IcGlobe size={12} className="shrink-0" />
            <span className="truncate">{host}</span>
            <IcExternal size={12} className="ml-auto shrink-0" />
          </div>
          {data.title && (
            <div className="line-clamp-2 text-small font-semibold leading-snug text-text">
              {data.title}
            </div>
          )}
        </div>
      </a>
      {dismissBtn}
    </div>
  );
}
