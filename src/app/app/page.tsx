"use client";

// Dashboard: where the user spends 90% of their time.
// Layout: sticky header, primary CTA, draft feed. Toast notifications
// for approve/reject so the action feels acknowledged without taking
// the user out of context. TranslateButton inline on every draft for
// users running accounts in a non-native language.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  ApiError,
  approveDraft,
  clearTokens,
  deleteDraft,
  fetchMe,
  fetchMyAccounts,
  fetchOnboardingStatus,
  generatePost,
  generatePostBatch,
  getTokens,
  listDrafts,
  publishDraft,
  refineDraft,
  rejectDraft,
} from "@/lib/api";
import { captureEvent, identify } from "@/lib/analytics";
import { isOnboardingSkipped, useSelectedAccountId } from "@/lib/account";
import Link from "next/link";
import { useTranslation, type MessageKey } from "@/lib/i18n";
import { PublishConfirmModal } from "@/components/PublishConfirmModal";
import { TranslateButton } from "@/components/TranslateButton";
import { AppTopbar, TopbarPill } from "@/components/AppTopbar";
import { Button, buttonClasses } from "@/components/ui/button";
import { Mono } from "@/components/ui/mono";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Toast, ToastHost } from "@/components/ui/toast";
import { IcArrowRight, IcCheck, IcChevDown, IcExternal, IcNib, IcPencil, IcReply, IcSend, IcSparkle, IcStudio, IcTrash, IcTweak, IcX } from "@/components/icons";
import { SkeletonText } from "@/components/ui/feedback";
import { cn } from "@/lib/cn";
import type { DraftSummary, Me } from "@/lib/types";

type Toast = { id: number; message: string; tone: "success" | "error" };

// Composer quick-start chips — clicking one fills the brief (free-text → the
// generator writes about it). Keys live in the i18n catalog.
const COMPOSER_CHIPS: MessageKey[] = [
  "dashboard.composer.chip_lesson",
  "dashboard.composer.chip_trend",
  "dashboard.composer.chip_opinion",
  "dashboard.composer.chip_story",
];

// Threads' text-post limit. The char meter warns as you approach it.
const DRAFT_LIMIT = 500;

function CharMeter({ len, showBar = true }: { len: number; showBar?: boolean }) {
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

export default function Dashboard() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const [me, setMe] = useState<Me | null>(null);
  const [drafts, setDrafts] = useState<DraftSummary[]>([]);
  const accountId = useSelectedAccountId();
  const [generating, setGenerating] = useState(false);
  // How many drafts to generate per click. Persists in localStorage so
  // the user's preference sticks across reloads. 1..5.
  const [batchCount, setBatchCount] = useState<number>(() => {
    if (typeof window === "undefined") return 1;
    const raw = window.localStorage.getItem("pennedly.batchCount");
    const n = raw ? Number(raw) : 1;
    return Number.isFinite(n) && n >= 1 && n <= 4 ? n : 1;
  });
  const [composerText, setComposerText] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<{
    name: string;
    handle: string | null;
    initials: string;
  } | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [bootError, setBootError] = useState<string | null>(null);
  // Per-draft edited text. Empty string means "user cleared it" (we
  // still send it, the backend rejects empty). Undefined means "no
  // local edit yet" and we fall back to draft.generated_text.
  const [edits, setEdits] = useState<Record<number, string>>({});
  // Per-draft refine input + which draft id is currently in-flight.
  const [refineInputs, setRefineInputs] = useState<Record<number, string>>({});
  const [refiningId, setRefiningId] = useState<number | null>(null);
  // Publish modal state. `null` means closed; otherwise carries the
  // draft id + text being confirmed.
  const [publishTarget, setPublishTarget] = useState<{
    draftId: number;
    text: string;
  } | null>(null);
  const [publishing, setPublishing] = useState(false);
  // Which status group the feed is showing. Splits the old single endless
  // column into scannable tabs (drafts / ready / published / rejected).
  // Default to "ready to publish" (approved) — the most actionable group —
  // shown first in the tab row too.
  const [tab, setTab] = useState<
    "pending" | "approved" | "published" | "rejected"
  >("approved");
  // Per-draft: is the refine ("tweak") panel expanded? Collapsed by
  // default so a pending card isn't dominated by refine controls.
  const [refineOpen, setRefineOpen] = useState<Record<number, boolean>>({});
  // Inline "delete draft?" confirm — which draft id is awaiting confirm.
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  // The selected account has no voice yet (needs_onboarding) but the user
  // chose "skip for now" in onboarding — so instead of bouncing them back to
  // the wizard we show a gentle "set up your voice" prompt where the generate
  // panel would be (generation needs a role_book, so we don't offer it yet).
  const [needsVoiceSetup, setNeedsVoiceSetup] = useState(false);
  // Q14: voice-state pill in the topbar. null = still loading (no pill yet);
  // true = "Voice active"; false = "Voice not set up" (= needs_onboarding).
  const [voiceReady, setVoiceReady] = useState<boolean | null>(null);

  function toast(message: string, tone: Toast["tone"] = "success") {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }

  useEffect(() => {
    if (!getTokens()) {
      router.push("/app/login");
      return;
    }
    (async () => {
      try {
        const profile = await fetchMe();
        setMe(profile);
        identify(profile.user_id, profile.email, profile.tenant.id);
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          clearTokens();
          router.push("/app/login");
          return;
        }
        setBootError(String(e));
      }
    })();
  }, [router]);

  // Zero-account gating now lives in the shell (src/app/app/layout.tsx):
  // it shows the dedicated full-screen connect flow before any /app page
  // renders, so by the time the dashboard mounts there is ≥1 connected
  // account. We only handle the post-connect / voice-setup states here.

  // Post-OAuth landing: the Threads callback 302s back here with
  // ?threads_connected=1 (or ?threads_error=…). Show a toast, then strip
  // the params so a refresh doesn't replay it.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const connected = params.get("threads_connected");
    const err = params.get("threads_error");
    if (!connected && !err) return;
    if (connected === "1") {
      const u = params.get("username");
      toast(u ? `@${u} · ${t("accounts.connected")}` : t("accounts.connected"));
      captureEvent("threads.connect_succeeded");
    } else if (err) {
      toast(
        err === "account_limit"
          ? t("accounts.connect_limit")
          : t("accounts.connect_error"),
        "error",
      );
      captureEvent("threads.connect_failed", { reason: err });
    }
    const url = new URL(window.location.href);
    url.searchParams.delete("threads_connected");
    url.searchParams.delete("threads_error");
    url.searchParams.delete("username");
    window.history.replaceState({}, "", url.pathname + url.search + url.hash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload drafts whenever the selected account changes (initial mount,
  // user clicks a different account in the switcher).
  useEffect(() => {
    if (accountId === null) return;
    (async () => {
      try {
        // New / un-set-up account → send to the onboarding wizard first,
        // UNLESS the user explicitly skipped voice setup for this account
        // (then we show a "set up your voice" prompt instead of looping).
        const ob = await fetchOnboardingStatus(accountId);
        setVoiceReady(!ob.needs_onboarding); // Q14
        if (ob.needs_onboarding) {
          if (!isOnboardingSkipped(accountId)) {
            router.replace("/app/onboarding");
            return;
          }
          setNeedsVoiceSetup(true);
          return;
        }
        setNeedsVoiceSetup(false);
        const list = await listDrafts(accountId, { limit: 50 });
        setDrafts(list.drafts);
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          clearTokens();
          router.push("/app/login");
          return;
        }
        // Don't blow up the dashboard if drafts fail to load — show
        // empty state instead.
      }
    })();
  }, [accountId, router]);

  // The selected account's identity for the draft cards (avatar + name + handle).
  useEffect(() => {
    if (accountId === null) {
      setSelectedAccount(null);
      return;
    }
    fetchMyAccounts()
      .then((list) => {
        const a = list.accounts.find((x) => x.id === accountId);
        if (!a) return;
        const name = a.display_name ?? a.username ?? `Account ${a.id}`;
        const parts = name.trim().split(/\s+/).filter(Boolean);
        const initials = (
          parts.length >= 2 ? parts[0][0] + parts[1][0] : name.slice(0, 2)
        ).toUpperCase();
        setSelectedAccount({ name, handle: a.username, initials: initials || "?" });
      })
      .catch(() => {});
  }, [accountId]);

  function persistBatchCount(n: number) {
    setBatchCount(n);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("pennedly.batchCount", String(n));
    }
  }

  async function onGenerate() {
    if (accountId === null) return;
    setGenerating(true);
    captureEvent("ui.generate_clicked", {
      account_id: accountId,
      batch_count: batchCount,
    });
    try {
      if (batchCount === 1) {
        const draft = await generatePost(accountId, undefined, composerText);
        toast(
          `${t("dashboard.toast.generated")} · ${draft.text.length} · ${draft.latency_ms}ms`,
        );
      } else {
        const result = await generatePostBatch(accountId, batchCount, undefined, composerText);
        if (result.errors.length === 0) {
          toast(
            `${t("dashboard.toast.generated")} · ${result.succeeded}/${result.requested}`,
          );
        } else {
          toast(
            `${result.succeeded}/${result.requested} · ${result.errors[0].detail}`,
            result.succeeded > 0 ? "success" : "error",
          );
        }
      }
      const list = await listDrafts(accountId, { limit: 50 });
      setDrafts(list.drafts);
      setComposerText("");
      // Freshly generated drafts are pending — surface that tab so they show
      // immediately (the default tab is "ready to publish", which excludes them).
      setTab("pending");
    } catch (e) {
      toast(String(e), "error");
    } finally {
      setGenerating(false);
    }
  }

  async function onApprove(id: number, originalText: string) {
    const localEdit = edits[id];
    const wasEdited =
      localEdit !== undefined && localEdit.trim() !== originalText.trim();
    captureEvent("ui.approve_clicked", { draft_id: id, edited: wasEdited });
    try {
      const result = await approveDraft(id, {
        editedText: wasEdited ? localEdit : undefined,
      });
      if (accountId !== null) {
        const list = await listDrafts(accountId, { limit: 50 });
        setDrafts(list.drafts);
      }
      // Clear local edit so the (now-approved) row shows the freshly
      // fetched generated_text from the server.
      setEdits((e) => {
        const next = { ...e };
        delete next[id];
        return next;
      });
      toast(
        result.edited
          ? `#${id} ${t("dashboard.toast.approved_edited")}`
          : `#${id} ${t("dashboard.toast.approved_as_is")}`,
      );
    } catch (e) {
      toast(String(e), "error");
    }
  }

  async function onRefine(draftId: number, instructionOverride?: string) {
    const instruction = (
      instructionOverride ?? refineInputs[draftId] ?? ""
    ).trim();
    if (!instruction) {
      toast(t("dashboard.draft.refine_empty"), "error");
      return;
    }
    setRefiningId(draftId);
    captureEvent("ui.refine_clicked", {
      draft_id: draftId,
      instruction_length: instruction.length,
    });
    try {
      const result = await refineDraft(draftId, instruction);
      // Reload the drafts list so the card shows the new generated_text.
      if (accountId !== null) {
        const list = await listDrafts(accountId, { limit: 50 });
        setDrafts(list.drafts);
      }
      // Clear local edit (the refined text from server now wins) and
      // the refine input itself.
      setEdits((s) => {
        const next = { ...s };
        delete next[draftId];
        return next;
      });
      setRefineInputs((s) => {
        const next = { ...s };
        delete next[draftId];
        return next;
      });
      toast(`#${draftId} ${t("dashboard.toast.refined")} · ${result.latency_ms}ms`);
    } catch (e) {
      let msg = String(e);
      if (e instanceof ApiError) {
        const detail =
          typeof e.detail === "object" &&
          e.detail !== null &&
          "detail" in (e.detail as Record<string, unknown>)
            ? (e.detail as { detail: unknown }).detail
            : e.detail;
        msg = `${e.status}: ${String(detail)}`;
      }
      toast(msg, "error");
    } finally {
      setRefiningId(null);
    }
  }

  function onPublishClick(draftId: number, text: string) {
    captureEvent("ui.publish_clicked", { draft_id: draftId });
    setPublishTarget({ draftId, text });
  }

  async function onPublishConfirm() {
    if (publishTarget === null) return;
    const { draftId } = publishTarget;
    setPublishing(true);
    captureEvent("ui.publish_confirmed", { draft_id: draftId });
    try {
      const result = await publishDraft(draftId);
      toast(`#${draftId} ${t("dashboard.toast.published")} · ${result.threads_post_id}`);
      setPublishTarget(null);
      // Jump to the feed so the freshly-published post is right there at the
      // top (newest first).
      router.push("/app/feed");
    } catch (e) {
      let msg = String(e);
      if (e instanceof ApiError) {
        const detail =
          typeof e.detail === "object" &&
          e.detail !== null &&
          "detail" in (e.detail as Record<string, unknown>)
            ? (e.detail as { detail: unknown }).detail
            : e.detail;
        msg = `${e.status}: ${String(detail)}`;
      }
      toast(msg, "error");
    } finally {
      setPublishing(false);
    }
  }

  function onPublishCancel() {
    if (publishing) return;
    captureEvent("ui.publish_cancelled", {
      draft_id: publishTarget?.draftId,
    });
    setPublishTarget(null);
  }

  async function onReject(id: number) {
    captureEvent("ui.reject_clicked", { draft_id: id });
    try {
      await rejectDraft(id);
      if (accountId !== null) {
        const list = await listDrafts(accountId, { limit: 50 });
        setDrafts(list.drafts);
      }
      toast(`#${id} ${t("dashboard.toast.rejected")}`);
    } catch (e) {
      toast(String(e), "error");
    }
  }

  async function onDeleteDraft(id: number) {
    captureEvent("ui.draft_delete_confirmed", { draft_id: id });
    try {
      await deleteDraft(id);
      setDrafts((p) => p.filter((x) => x.id !== id));
      setConfirmDeleteId(null);
      toast(t("dashboard.draft.toast_deleted"));
    } catch (e) {
      let msg = String(e);
      if (e instanceof ApiError) {
        const detail =
          typeof e.detail === "object" &&
          e.detail !== null &&
          "detail" in (e.detail as Record<string, unknown>)
            ? (e.detail as { detail: unknown }).detail
            : e.detail;
        msg = `${e.status}: ${String(detail)}`;
      }
      toast(msg, "error");
    }
  }

  // Feed split into status groups. "approved" = approved but not yet
  // published; "published" = has gone live (manual or autopilot).
  const draftCounts = {
    pending: drafts.filter((d) => d.status === "pending").length,
    approved: drafts.filter((d) => d.status === "approved" && !d.published)
      .length,
    published: drafts.filter((d) => d.published).length,
    rejected: drafts.filter((d) => d.status === "rejected").length,
  };
  const visibleDrafts = drafts.filter((d) => {
    if (tab === "pending") return d.status === "pending";
    if (tab === "approved") return d.status === "approved" && !d.published;
    if (tab === "published") return d.published;
    return d.status === "rejected";
  });

  if (bootError) {
    return (
      <main className="max-w-2xl mx-auto px-6 py-16">
        <div className="rounded-lg border border-danger/40 bg-danger/10 p-4 text-small text-danger">
          {bootError}
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-text">
      <AppTopbar
        maxW="900px"
        title={t("nav.studio")}
        pill={
          voiceReady === null ? undefined : (
            <TopbarPill tone={voiceReady ? "success" : "warning"}>
              {voiceReady ? t("dashboard.voice_active") : t("dashboard.voice_not_set")}
            </TopbarPill>
          )
        }
      />
      <main className="mx-auto max-w-[900px] space-y-5 px-5 py-7 md:px-6">
        {needsVoiceSetup ? (
          /* Account connected, but the user skipped voice setup. Generation
             needs a role_book, so prompt to finish setup rather than offer a
             generate button that would just error. */
          <section className="rounded-lg border border-border bg-surface p-8 text-center shadow-sm">
            <h2 className="text-h3 font-semibold">
              {t("dashboard.voice_setup_title")}
            </h2>
            <p className="mx-auto mb-5 mt-1.5 max-w-md text-small text-text-muted">
              {t("dashboard.voice_setup_body")}
            </p>
            <div className="flex justify-center">
              <Link href="/app/onboarding" className={buttonClasses({ variant: "primary" })}>
                {t("dashboard.voice_setup_cta")}
              </Link>
            </div>
          </section>
        ) : (
          <>
        {/* Composer — type a brief (a topic, a hot take, a link) or pick a chip;
            Pennedly writes it in your voice. An empty brief falls back to an
            auto-picked topic. */}
        <section className="rounded-xl border border-border bg-surface p-4 shadow-sm transition-all focus-within:border-accent/55 focus-within:shadow-md">
          {generating ? (
            <div className="flex items-center gap-3 px-1 py-2">
              <span
                className="text-text"
                style={{ animation: "nib-write 1.5s var(--ease-standard) infinite" }}
              >
                <IcNib size={22} />
              </span>
              <span className="text-h3 text-text">
                {t("dashboard.generate.generating")}
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
                <Mono
                  text={(me?.display_name?.[0] ?? me?.email?.[0] ?? "?").toUpperCase()}
                  size={36}
                />
                <textarea
                  value={composerText}
                  onChange={(e) => {
                    setComposerText(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
                  }}
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") onGenerate();
                  }}
                  placeholder={t("dashboard.composer.placeholder")}
                  rows={1}
                  className="mt-1 min-h-[30px] flex-1 resize-none border-0 bg-transparent text-h3 leading-snug text-text placeholder:text-text-subtle focus:outline-none"
                />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
                  {COMPOSER_CHIPS.map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setComposerText(t(key))}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-small font-medium text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
                    >
                      <IcSparkle size={13} className="text-text-subtle" />
                      {t(key)}
                    </button>
                  ))}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <div className="relative">
                    <select
                      value={batchCount}
                      onChange={(e) => persistBatchCount(Number(e.target.value))}
                      aria-label={t("dashboard.composer.count_label")}
                      className="h-9 appearance-none rounded-md border border-border bg-surface pl-3 pr-8 text-small text-text transition-colors hover:bg-surface-2 focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/25"
                    >
                      {[1, 2, 3, 4].map((n) => (
                        <option key={n} value={n}>
                          {n}{" "}
                          {n === 1
                            ? t("dashboard.composer.draft_one")
                            : t("dashboard.composer.draft_few")}
                        </option>
                      ))}
                    </select>
                    <IcChevDown
                      size={14}
                      className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-text-subtle"
                    />
                  </div>
                  <Button
                    variant="primary"
                    onClick={onGenerate}
                    disabled={accountId === null}
                    icon={<IcNib size={16} />}
                  >
                    {t("dashboard.generate.button")}
                  </Button>
                </div>
              </div>

            </>
          )}
        </section>

        {/* Drafts feed */}
        <section>
          {/* Sticky status filter — a colored dot + count per group. */}
          <div className="sticky top-15 z-[5] mb-3.5 flex items-center gap-1 rounded-md border border-border bg-surface-2 p-1">
            {(
              [
                ["approved", t("dashboard.tab.approved"), draftCounts.approved, "bg-accent"],
                ["pending", t("dashboard.tab.pending"), draftCounts.pending, "bg-ink-400"],
                ["published", t("dashboard.tab.published"), draftCounts.published, "bg-success"],
                ["rejected", t("dashboard.tab.rejected"), draftCounts.rejected, "bg-danger"],
              ] as const
            ).map(([key, label, count, dot]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                aria-selected={tab === key}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-sm px-2.5 py-1.5 text-small font-medium transition-colors",
                  tab === key
                    ? "bg-surface text-text shadow-sm"
                    : "text-text-muted hover:text-text",
                )}
              >
                <span className={cn("h-[7px] w-[7px] shrink-0 rounded-full", dot)} />
                <span className="truncate">{label}</span>
                <span className="text-caption tabular-nums text-text-subtle">{count}</span>
              </button>
            ))}
          </div>

          {visibleDrafts.length === 0 && (
            <div className="flex flex-col items-center rounded-lg border border-dashed border-border px-6 py-14 text-center">
              <p className="max-w-[42ch] text-small leading-relaxed text-text-muted">
                {tab === "pending" ? (
                  <>
                    {t("dashboard.feed.empty")}{" "}
                    <span className="font-medium text-text">
                      {t("dashboard.feed.empty_cta")}
                    </span>{" "}
                    {t("dashboard.feed.empty_after")}
                  </>
                ) : (
                  t("dashboard.tab.empty")
                )}
              </p>
            </div>
          )}

          <ul className="space-y-3">
            {visibleDrafts.map((d) => {
              const localEdit = edits[d.id];
              const currentText =
                localEdit !== undefined ? localEdit : d.generated_text;
              const isEdited =
                localEdit !== undefined &&
                localEdit.trim() !== d.generated_text.trim();
              // Q62: reply drafts are read-only here (managed on /app/replies).
              const isReply = d.content_type === "comment_reply";
              return (
                <li
                  key={d.id}
                  className="rounded-lg border border-border bg-surface p-4 shadow-sm transition-colors hover:border-text/15"
                  style={{ animation: "card-in 240ms var(--ease-entrance) both" }}
                >
                  {/* head: author + time + status (Threads-style) */}
                  <div className="flex items-center gap-2.5">
                    <Mono text={selectedAccount?.initials ?? "·"} size={34} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-small font-semibold leading-tight">
                        {selectedAccount?.name ?? "…"}
                      </div>
                      <div className="flex items-center gap-1.5 text-caption text-text-subtle">
                        {selectedAccount?.handle && (
                          <>
                            <span className="truncate">@{selectedAccount.handle}</span>
                            <span>·</span>
                          </>
                        )}
                        {isReply && d.reply_to?.who && (
                          <>
                            <span className="inline-flex items-center gap-1 whitespace-nowrap text-accent">
                              <IcReply size={11} />
                              {t("dashboard.draft.replying_to")} @{d.reply_to.who}
                            </span>
                            <span>·</span>
                          </>
                        )}
                        <span className="whitespace-nowrap">
                          {relativeTime(d.created_at, locale)}
                        </span>
                      </div>
                    </div>
                    <StatusBadge status={d.published ? "published" : d.status} />
                  </div>

                  {isReply ? (
                    /* Q62: reply drafts are read-only in Studio — they're
                       generated and approved on /app/replies. Show the comment
                       being answered + the draft text, and link out to act. */
                    <>
                      {d.reply_to?.text && (
                        <div className="mt-3 flex gap-2.5 rounded-md border border-border bg-surface-2 p-3">
                          <span className="w-0.5 shrink-0 self-stretch rounded bg-border" />
                          <div className="min-w-0">
                            {d.reply_to.who && (
                              <div className="mb-0.5 text-caption font-semibold text-text-muted">
                                @{d.reply_to.who}
                              </div>
                            )}
                            <div className="text-small leading-relaxed text-text-muted">
                              {d.reply_to.text}
                            </div>
                          </div>
                        </div>
                      )}
                      <p className="mt-3 whitespace-pre-wrap text-body leading-relaxed text-text">
                        {d.generated_text}
                      </p>
                      <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-border pt-3">
                        <span className="text-caption text-text-subtle">
                          {t("dashboard.draft.reply_managed")}
                        </span>
                        <Link
                          href="/app/replies"
                          className="inline-flex items-center gap-1 text-small font-medium text-accent hover:underline"
                        >
                          {t("dashboard.draft.open_replies")}
                          <IcArrowRight size={14} />
                        </Link>
                      </div>
                    </>
                  ) : (
                  <>

                  {/* body: revising · editing · clean text */}
                  {refiningId === d.id ? (
                    <div className="mt-3.5 flex flex-col gap-2.5">
                      <SkeletonText lines={3} />
                      <span className="inline-flex items-center gap-1.5 text-caption text-accent">
                        <IcTweak size={13} /> {t("dashboard.draft.refining")}
                      </span>
                    </div>
                  ) : editingId === d.id ? (
                    <div className="mt-3">
                      <textarea
                        autoFocus
                        value={currentText}
                        onChange={(e) => setEdits((s) => ({ ...s, [d.id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") setEditingId(null);
                        }}
                        rows={Math.min(12, Math.max(3, currentText.split("\n").length + 1))}
                        className="w-full resize-y rounded-md border border-accent bg-surface px-3 py-2.5 text-body leading-relaxed text-text ring-[3px] ring-accent/20 focus:outline-none"
                      />
                      <div className="mt-2">
                        <CharMeter len={currentText.length} />
                      </div>
                    </div>
                  ) : (
                    <p className="mt-3 whitespace-pre-wrap text-body leading-relaxed text-text">
                      {currentText}
                    </p>
                  )}

                  {d.status === "pending" &&
                    refineOpen[d.id] &&
                    editingId !== d.id &&
                    refiningId !== d.id && (
                    <div className="mt-3">
                      <div className="flex items-center gap-2 rounded-md border border-accent/40 bg-surface-2 px-2.5 py-2">
                        <IcTweak size={16} className="shrink-0 text-accent" />
                        <input
                          type="text"
                          autoFocus
                          value={refineInputs[d.id] ?? ""}
                          onChange={(e) =>
                            setRefineInputs((s) => ({
                              ...s,
                              [d.id]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && refiningId === null) {
                              e.preventDefault();
                              onRefine(d.id);
                            }
                            if (e.key === "Escape")
                              setRefineOpen((s) => ({ ...s, [d.id]: false }));
                          }}
                          placeholder={t("dashboard.draft.refine_placeholder")}
                          disabled={refiningId === d.id}
                          className="min-w-0 flex-1 bg-transparent text-small text-text placeholder:text-text-subtle focus:outline-none disabled:opacity-50"
                        />
                        <Button
                          size="sm"
                          variant="primary"
                          aria-label={t("dashboard.draft.refine")}
                          onClick={() => onRefine(d.id)}
                          loading={refiningId === d.id}
                          disabled={
                            refiningId !== null || !(refineInputs[d.id] ?? "").trim()
                          }
                          icon={<IcSend size={15} />}
                        />
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {[
                          {
                            label: t("dashboard.draft.refine_preset_shorter"),
                            // Always send English to the LLM regardless of UI
                            // locale — the model performs better with English
                            // instructions and Zakhar's role_book is English.
                            instruction: "make shorter",
                          },
                          {
                            label: t("dashboard.draft.refine_preset_informal"),
                            instruction: "less formal",
                          },
                          {
                            label: t("dashboard.draft.refine_preset_question"),
                            instruction: "add a question",
                          },
                          {
                            label: t("dashboard.draft.refine_preset_punchier"),
                            instruction: "punchier opening",
                          },
                        ].map(({ label, instruction }) => (
                          <button
                            key={instruction}
                            type="button"
                            onClick={() => onRefine(d.id, instruction)}
                            disabled={refiningId !== null}
                            className="rounded-full border border-border bg-surface px-2.5 py-1 text-caption text-text-muted transition-colors hover:bg-surface-2 hover:text-text disabled:opacity-50"
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* footer — meta (left) + actions (right) */}
                  {refiningId !== d.id && (
                    <div className="mt-3.5 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                      {editingId === d.id ? (
                        <span className="text-caption text-text-subtle">
                          {t("dashboard.draft.editing")}
                        </span>
                      ) : d.published ? (
                        <span className="inline-flex items-center gap-1.5 text-small font-medium text-success">
                          <IcCheck size={15} />
                          {t("dashboard.draft.published")}
                        </span>
                      ) : d.status === "rejected" ? (
                        <span className="text-caption text-text-subtle">
                          {t("dashboard.draft.passed_on")}
                        </span>
                      ) : (
                        <div className="flex items-center gap-2.5">
                          <CharMeter len={currentText.length} showBar={false} />
                          <span className="hidden items-center gap-1.5 text-caption text-text-subtle sm:inline-flex">
                            <IcSparkle size={12} /> {t("dashboard.draft.in_your_voice")}
                          </span>
                        </div>
                      )}

                      <div className="ml-auto flex items-center gap-1.5">
                        {editingId === d.id ? (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEdits((s) => {
                                  const next = { ...s };
                                  delete next[d.id];
                                  return next;
                                });
                                setEditingId(null);
                              }}
                            >
                              {t("common.cancel")}
                            </Button>
                            <Button
                              size="sm"
                              variant="primary"
                              icon={<IcCheck size={15} />}
                              disabled={
                                currentText.trim().length === 0 ||
                                currentText.length > DRAFT_LIMIT
                              }
                              onClick={() => setEditingId(null)}
                            >
                              {t("common.save")}
                            </Button>
                          </>
                        ) : d.published ? (
                          d.threads_url && (
                            <a
                              href={d.threads_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-small text-text-subtle underline-offset-2 hover:text-text hover:underline"
                            >
                              <IcExternal size={14} />
                              {t("dashboard.draft.open_threads")}
                            </a>
                          )
                        ) : (
                          <>
                            {d.status === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  aria-label={t("dashboard.draft.reject")}
                                  onClick={() => onReject(d.id)}
                                  icon={<IcX size={15} />}
                                />
                                <Button
                                  size="sm"
                                  variant={refineOpen[d.id] ? "secondary" : "ghost"}
                                  icon={<IcTweak size={15} />}
                                  onClick={() =>
                                    setRefineOpen((s) => ({ ...s, [d.id]: !s[d.id] }))
                                  }
                                >
                                  {t("dashboard.draft.tweak")}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  icon={<IcPencil size={15} />}
                                  onClick={() => {
                                    setRefineOpen((s) => ({ ...s, [d.id]: false }));
                                    setEditingId(d.id);
                                  }}
                                >
                                  {t("dashboard.draft.edit")}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="primary"
                                  icon={<IcCheck size={15} />}
                                  onClick={() => onApprove(d.id, d.generated_text)}
                                >
                                  {isEdited
                                    ? t("dashboard.draft.approve_edited")
                                    : t("dashboard.draft.approve")}
                                </Button>
                              </>
                            )}
                            {d.status === "approved" && (
                              <Button
                                size="sm"
                                variant="primary"
                                icon={<IcStudio size={15} />}
                                onClick={() => onPublishClick(d.id, currentText)}
                              >
                                {t("dashboard.draft.publish")}
                              </Button>
                            )}
                            {confirmDeleteId === d.id ? (
                              <span className="inline-flex items-center gap-2 text-small">
                                <button
                                  onClick={() => onDeleteDraft(d.id)}
                                  className="font-medium text-danger hover:underline"
                                >
                                  {t("dashboard.draft.delete")}
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="text-text-subtle hover:text-text"
                                >
                                  {t("common.cancel")}
                                </button>
                              </span>
                            ) : (
                              <button
                                onClick={() => setConfirmDeleteId(d.id)}
                                aria-label={t("dashboard.draft.delete")}
                                className="grid h-8 w-8 place-items-center rounded-sm text-text-subtle transition-colors hover:bg-surface-2 hover:text-danger"
                              >
                                <IcTrash size={15} />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                  </>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
          </>
        )}
      </main>

      {/* Publish confirmation modal */}
      <PublishConfirmModal
        open={publishTarget !== null}
        text={publishTarget?.text ?? ""}
        isPublishing={publishing}
        onClose={onPublishCancel}
        onConfirm={onPublishConfirm}
      />

      {/* Toasts */}
      <ToastHost>
        {toasts.map((to) => (
          <Toast key={to.id} tone={to.tone} title={to.message} />
        ))}
      </ToastHost>
    </div>
  );
}

const STATUS_LABEL: Record<string, MessageKey> = {
  pending: "dashboard.status.pending",
  approved: "dashboard.status.approved",
  rejected: "dashboard.status.rejected",
  published: "dashboard.status.published",
};

function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const tone: BadgeTone =
    status === "approved"
      ? "accent"
      : status === "published"
        ? "good"
        : status === "rejected"
          ? "bad"
          : "neutral";
  const key = STATUS_LABEL[status];
  return (
    <Badge tone={tone} dot className="uppercase">
      {key ? t(key) : status}
    </Badge>
  );
}

// Locale-aware relative time. Intl.RelativeTimeFormat renders correctly in
// every supported locale (incl. plurals) with no manual translation strings.
function relativeTime(iso: string, locale: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (mins < 1) return rtf.format(0, "minute");
  if (mins < 60) return rtf.format(-mins, "minute");
  const hours = Math.floor(mins / 60);
  if (hours < 24) return rtf.format(-hours, "hour");
  const days = Math.floor(hours / 24);
  if (days < 7) return rtf.format(-days, "day");
  return new Date(iso).toLocaleDateString(locale);
}
