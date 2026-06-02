"use client";

// §3.4 Real avatar — the Threads profile photo when we have one, with the
// initials monogram as the fallback only. Shared by the sidebar account
// control, onboarding, settings, and anywhere an account/author appears, so
// the photo-or-monogram rule lives in exactly one place.

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
  if (account.profile_picture_url) {
    return (
      // Threads CDN host varies — a plain <img> avoids next/image remote config.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={account.profile_picture_url}
        alt={t("shell.avatar_alt")}
        width={size}
        height={size}
        className={cn("shrink-0 rounded-full bg-surface-2 object-cover", className)}
        style={{ width: size, height: size }}
      />
    );
  }
  return <Mono text={initialsOf(nameOf(account))} size={size} className={className} />;
}
