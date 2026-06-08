"use client";

// §3.4 Real avatar — the Threads profile photo when we have one, with the
// initials monogram as the fallback only. Shared by the sidebar account
// control, onboarding, settings, and anywhere an account/author appears, so
// the photo-or-monogram rule lives in exactly one place.
//
// Robust fallback: a present-but-FAILING photo URL (e.g. an expired Threads CDN
// link) falls back to the monogram — never the browser's broken-image glyph.
// We catch BOTH failure timings: `onError` for a load that fails after hydration
// (the client-rendered app avatars), AND a post-mount `complete && naturalWidth
// === 0` check for an image that already failed before React attached onError
// (the SSR-rendered landing avatars — the classic SSR img-error gap). The state
// resets when the URL changes (account switch) so a fresh URL is retried.

import { useEffect, useRef, useState } from "react";

import { useTranslation } from "@/lib/i18n";
import { Mono } from "@/components/ui/mono";
import { cn } from "@/lib/cn";
import type { ConnectedAccount } from "@/lib/types";

export function nameOf(a: ConnectedAccount): string {
  return a.display_name ?? a.username ?? `acct ${a.id}`;
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.trim().slice(0, 2).toUpperCase() || "?";
}

function useImgFallback(url?: string | null) {
  const ref = useRef<HTMLImageElement>(null);
  const [errored, setErrored] = useState(false);
  useEffect(() => {
    setErrored(false);
    const img = ref.current;
    // An image that already failed (incl. SSR, pre-hydration) reports complete
    // with a zero natural width — catch it here since onError won't re-fire.
    if (img && img.complete && img.naturalWidth === 0) setErrored(true);
  }, [url]);
  return { ref, errored, setErrored };
}

export function Avatar({
  account,
  size,
  className,
}: {
  account: ConnectedAccount;
  size: number;
  className?: string;
}) {
  const { t } = useTranslation();
  const url = account.profile_picture_url;
  const { ref, errored, setErrored } = useImgFallback(url);
  if (url && !errored) {
    return (
      // Threads CDN host varies — a plain <img> avoids next/image remote config.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        ref={ref}
        src={url}
        alt={t("shell.avatar_alt")}
        width={size}
        height={size}
        onError={() => setErrored(true)}
        className={cn("shrink-0 rounded-full bg-surface-2 object-cover", className)}
        style={{ width: size, height: size }}
      />
    );
  }
  return <Mono text={initialsOf(nameOf(account))} size={size} className={className} />;
}

// Like Avatar, but for places that already carry a flat author shape
// ({ initials } + an optional photo URL) instead of a full ConnectedAccount —
// the own-account author on Studio drafts, My Feed posts, and reply previews.
// Shows the Threads photo when one is present (and loads), the monogram otherwise.
export function AccountFace({
  url,
  initials,
  size,
  className,
}: {
  url?: string | null;
  initials: string;
  size: number;
  className?: string;
}) {
  const { t } = useTranslation();
  const { ref, errored, setErrored } = useImgFallback(url);
  if (url && !errored) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        ref={ref}
        src={url}
        alt={t("shell.avatar_alt")}
        width={size}
        height={size}
        onError={() => setErrored(true)}
        className={cn("shrink-0 rounded-full bg-surface-2 object-cover", className)}
        style={{ width: size, height: size }}
      />
    );
  }
  return <Mono text={initials} size={size} className={className} />;
}
