"use client";

// ImportBanner — the reusable "Importing your history" banner shown at the top
// of the content column on Dashboard / Stats / Replies while a just-connected
// account is still backfilling its posts, per-post metrics and comments from
// Threads in the background. Built 1:1 to import-banner.css / First-Run-SPEC:
//
//   sync_status === 'importing' → accent rail + spinner + live counts + bar
//                                  (indeterminate sweep until a post total is
//                                   known, determinate fill once it is)
//   sync_status === 'partial'   → success rail + check + "imported most of
//                                  your history" (no bar — the counts carry it)
//   'complete' | 'failed' | null → nothing (the normal screen renders)
//
// Tone is calm and non-apologetic: the platform is working, the history is
// loading. Tokens only (light/dark follow the ambient theme). The progress sub
// is an aria-live region so the climbing counts are announced; the spinner +
// sweep are CSS animations that respect prefers-reduced-motion via the house
// rules in globals.css.

import { useEffect, useState } from "react";

import { fetchMyAccounts, getTokens } from "@/lib/api";
import { useSelectedAccountId } from "@/lib/account";
import { cn } from "@/lib/cn";
import { useTranslation } from "@/lib/i18n";
import { pluralUnit } from "@/lib/i18n/plurals";
import { IcCheck, IcX } from "@/components/icons";
import type { SyncStatus, SyncSummary } from "@/lib/types";

// Live backfill state for the currently-selected account, read from
// GET /api/me/accounts. Shared by the three screens (Dashboard / Stats /
// Replies) so the banner reads identically everywhere. Fail-soft: any error
// (or no token / no account / SSR) resolves to a hidden banner. While the
// import is running we re-poll on an interval so the climbing counts and the
// eventual resolve land without a manual refresh.
//
// `enabled=false` (demo mode) short-circuits to nothing — the ?demo=1 review
// drives the banner via explicit props, never a real fetch.
const POLL_MS = 8000;

export function useActiveSyncStatus(enabled = true): { status: SyncStatus; summary: SyncSummary | null } {
  const accountId = useSelectedAccountId();
  const [state, setState] = useState<{ status: SyncStatus; summary: SyncSummary | null }>({ status: null, summary: null });

  useEffect(() => {
    if (!enabled || accountId === null || !getTokens()) {
      setState({ status: null, summary: null });
      return;
    }
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      try {
        const list = await fetchMyAccounts();
        const a = list.accounts.find((x) => x.id === accountId);
        if (!alive) return;
        const status = a?.sync_status ?? null;
        setState({ status, summary: a?.sync_summary ?? null });
        // Keep polling only while the backfill is still in flight.
        if (status === "importing") timer = setTimeout(tick, POLL_MS);
      } catch {
        if (alive) setState({ status: null, summary: null });
      }
    };
    void tick();
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
    };
  }, [enabled, accountId]);

  return state;
}

// A non-negative count from the summary, or null when not yet reported.
function num(v: number | undefined): number | null {
  return typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : null;
}

const dismissKey = (accountId: number) => `pennedly:importDismissed:${accountId}`;

export function ImportBanner({ status, summary }: { status: SyncStatus; summary: SyncSummary | null }) {
  const { t, locale } = useTranslation();
  const accountId = useSelectedAccountId();
  // The terminal `partial` banner is a one-time reassurance, not a live
  // process — make it dismissible so it doesn't haunt the screen on every
  // reload. Dismissal is remembered per account; a fresh import (status flips
  // back to `importing`) re-arms it.
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || accountId === null) {
      setDismissed(false);
      return;
    }
    if (status === "importing") {
      window.localStorage.removeItem(dismissKey(accountId));
      setDismissed(false);
    } else if (status === "partial") {
      setDismissed(window.localStorage.getItem(dismissKey(accountId)) === "1");
    } else {
      setDismissed(false);
    }
  }, [status, accountId]);

  if (status !== "importing" && status !== "partial") return null;
  if (dismissed) return null;

  const onDismiss = () => {
    if (accountId !== null && typeof window !== "undefined") {
      window.localStorage.setItem(dismissKey(accountId), "1");
    }
    setDismissed(true);
  };

  const posts = num(summary?.posts) ?? num(summary?.history_posts);
  const comments = num(summary?.new_comments);
  const total = num(summary?.history_posts);
  // Live count line: shown once we have at least one count; otherwise the calm
  // "pulling your posts…" early line. Numbers are locale-formatted + tabular.
  const haveCounts = posts !== null || comments !== null;
  const fmtN = (n: number) => n.toLocaleString(locale);
  // Inflect the unit noun for the count + locale ("42 поста", not "42 постов")
  // via the shared pluralUnit helper, so each count phrase agrees grammatically.
  const postsPhrase = `${fmtN(posts ?? 0)} ${pluralUnit(locale, "posts", posts ?? 0)}`;
  const commentsPhrase = `${fmtN(comments ?? 0)} ${pluralUnit(locale, "comments", comments ?? 0)}`;
  const liveSub = (key: "backfill.banner_sub_live" | "backfill.partial_sub") =>
    t(key).replace("{posts}", postsPhrase).replace("{comments}", commentsPhrase);

  const partial = status === "partial";

  // A `partial` result that imported NOTHING (0 posts AND 0 comments) is noise —
  // e.g. reconnecting an already-synced account re-runs the backfill and finds
  // nothing new, leaving a confusing "0 posts · 0 comments already here" plaque.
  // Don't surface a zero-reassurance; just show the normal screen. (A real import
  // still streams its progress under the `importing` status above.)
  if (partial && (posts ?? 0) === 0 && (comments ?? 0) === 0) return null;

  // Determinate fill only once a post total is known and we have progress
  // against it; before then the bar sweeps (honest about not-yet-knowing).
  const determinate = !partial && total !== null && total > 0 && posts !== null;
  const fillPct = determinate ? Math.min(100, Math.round(((posts ?? 0) / (total as number)) * 100)) : 0;

  return (
    <div
      className={cn(
        "flex items-center gap-3.5 rounded-lg border border-border bg-surface px-4 py-[13px] shadow-sm max-[560px]:flex-wrap",
        "border-l-[3px]",
        partial ? "border-l-success" : "border-l-accent",
      )}
    >
      {/* mark — spinner while syncing, a check once most history has landed */}
      <span
        className={cn(
          "grid h-9 w-9 shrink-0 place-items-center rounded-md border",
          partial ? "border-success/30 text-success" : "border-border bg-surface-2 text-accent",
        )}
        style={partial ? { background: "color-mix(in srgb, var(--color-success) 12%, var(--color-surface))" } : undefined}
      >
        {partial ? (
          <IcCheck size={18} />
        ) : (
          <span
            className="h-[18px] w-[18px] animate-spin rounded-full border-2 border-accent/30 border-t-accent [animation-duration:0.7s] motion-reduce:[animation-duration:1.6s]"
            aria-hidden
          />
        )}
      </span>

      {/* body — title + live progress sub + (syncing only) progress bar */}
      <div className="min-w-0 flex-1">
        <div className="text-small font-semibold text-text">{t(partial ? "backfill.partial_title" : "backfill.banner_title")}</div>
        <div className="mt-0.5 text-caption tabular-nums text-text-muted [text-wrap:pretty]" aria-live="polite">
          {partial ? liveSub("backfill.partial_sub") : haveCounts ? liveSub("backfill.banner_sub_live") : t("backfill.banner_sub_early")}
        </div>
        {!partial && (
          <div className="relative mt-[9px] h-1 max-w-[360px] overflow-hidden rounded-full border border-border bg-surface-2 max-[560px]:max-w-none">
            <div
              className={cn(
                "absolute inset-y-0 left-0 rounded-full bg-accent",
                determinate
                  ? "transition-[width] duration-[240ms] ease-[cubic-bezier(0.2,0.7,0.3,1)]"
                  : "w-[36%] [animation:ib-sweep_1.3s_cubic-bezier(0.2,0.7,0.3,1)_infinite] motion-reduce:left-[35%] motion-reduce:w-[30%] motion-reduce:[animation:none]",
              )}
              style={determinate ? { width: `${fillPct}%` } : undefined}
            />
          </div>
        )}
      </div>

      {/* trailing — an ETA while syncing, a dismiss control once partial (the
          terminal "imported most of your history" note shouldn't be permanent). */}
      {partial ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label={t("backfill.dismiss")}
          className="grid h-7 w-7 shrink-0 place-items-center self-center rounded-md text-text-subtle transition-colors hover:bg-surface-2 hover:text-text"
        >
          <IcX size={15} />
        </button>
      ) : (
        <span className="shrink-0 self-center whitespace-nowrap text-caption text-text-subtle max-[560px]:order-3 max-[560px]:ml-[50px] max-[560px]:basis-full">
          {t("backfill.banner_eta")}
        </span>
      )}
    </div>
  );
}
