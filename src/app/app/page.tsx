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
import type { DraftSummary, GeneratedDraft, Me } from "@/lib/types";

type Toast = { id: number; message: string; tone: "success" | "error" };

export default function Dashboard() {
  const router = useRouter();
  const { t } = useTranslation();
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
    return Number.isFinite(n) && n >= 1 && n <= 5 ? n : 1;
  });
  const [lastDraft, setLastDraft] = useState<GeneratedDraft | null>(null);
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
  const [tab, setTab] = useState<
    "pending" | "approved" | "published" | "rejected"
  >("pending");
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
        // Clear the "last generated" preview when switching accounts —
        // it belonged to the previous account.
        setLastDraft(null);
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
        const draft = await generatePost(accountId);
        setLastDraft(draft);
        toast(
          `${t("dashboard.toast.generated")} · ${draft.text.length} · ${draft.latency_ms}ms`,
        );
      } else {
        const result = await generatePostBatch(accountId, batchCount);
        // Show the LAST successful draft in the preview slot (most
        // recent generation feels right); all of them land in the
        // feed below.
        if (result.drafts.length > 0) {
          setLastDraft(result.drafts[result.drafts.length - 1]);
        }
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
      if (accountId !== null) {
        const list = await listDrafts(accountId, { limit: 50 });
        setDrafts(list.drafts);
      }
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
        <div className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-950 p-4 text-sm text-red-800 dark:text-red-200">
          {bootError}
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-text">
      {/* Nav + account + language + logout now live in the sidebar
          (src/app/app/layout.tsx → Sidebar). */}
      <main className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        {/* Identity strip */}
        {me && (
          <p className="text-xs text-zinc-500 sm:hidden">
            {t("common.signed_in_as")} {me.email}
          </p>
        )}

        {needsVoiceSetup ? (
          /* Account connected, but the user skipped voice setup. Generation
             needs a role_book, so prompt to finish setup rather than offer a
             generate button that would just error. */
          <section className="rounded-xl border border-border bg-surface p-8 text-center shadow-sm">
            <h2 className="text-lg font-semibold">
              {t("dashboard.voice_setup_title")}
            </h2>
            <p className="text-sm text-zinc-500 mt-1 mb-4 max-w-md mx-auto">
              {t("dashboard.voice_setup_body")}
            </p>
            <div className="flex justify-center">
              <Link
                href="/app/onboarding"
                className="inline-flex items-center px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                {t("dashboard.voice_setup_cta")}
              </Link>
            </div>
          </section>
        ) : (
          <>
        {/* Generate panel */}
        <section className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-base font-semibold">
                {t("dashboard.generate.title")}
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                {t("dashboard.generate.subtitle")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Batch count stepper. Click ×N to flip between values. */}
              <div className="inline-flex items-center rounded-md border border-border overflow-hidden text-xs">
                {[1, 2, 3, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => persistBatchCount(n)}
                    disabled={generating}
                    className={`px-2.5 py-1 transition-colors ${
                      batchCount === n
                        ? "bg-primary text-primary-foreground font-medium"
                        : "text-text-muted hover:bg-surface-2"
                    }`}
                    title={
                      n === 1
                        ? "Single draft"
                        : `Generate ${n} drafts in parallel`
                    }
                  >
                    ×{n}
                  </button>
                ))}
              </div>
              <button
                onClick={onGenerate}
                disabled={generating || accountId === null}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {generating && (
                  <span
                    className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"
                    aria-hidden
                  />
                )}
                {generating
                  ? t("dashboard.generate.generating")
                  : t("dashboard.generate.button")}
              </button>
            </div>
          </div>

          {lastDraft && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between mb-2 text-xs text-zinc-500">
                <span>
                  <span className="font-medium text-text">
                    {lastDraft.topic_label ?? t("dashboard.generate.no_topic")}
                  </span>{" "}
                  · {lastDraft.text.length} chars · {lastDraft.latency_ms}ms ·{" "}
                  {lastDraft.prompt_tokens + lastDraft.completion_tokens} tok
                </span>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {lastDraft.text}
              </p>
              <div className="mt-3">
                <TranslateButton text={lastDraft.text} source="generated_draft_preview" />
              </div>
            </div>
          )}
        </section>

        {/* Drafts feed */}
        <section>
          <h2 className="text-base font-semibold mb-3">
            {t("dashboard.feed.title")}
          </h2>

          {/* Status tabs — show one scannable group at a time instead of
              one endless mixed column. */}
          <div className="flex items-center gap-1 mb-4 border-b border-border overflow-x-auto">
            {(
              [
                ["pending", t("dashboard.tab.pending"), draftCounts.pending],
                ["approved", t("dashboard.tab.approved"), draftCounts.approved],
                ["published", t("dashboard.tab.published"), draftCounts.published],
                ["rejected", t("dashboard.tab.rejected"), draftCounts.rejected],
              ] as const
            ).map(([key, label, count]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`relative px-3 py-2 text-sm whitespace-nowrap transition-colors ${
                  tab === key
                    ? "text-text font-medium"
                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                }`}
              >
                {label}
                {count > 0 && (
                  <span className="ml-1.5 text-xs text-zinc-400">{count}</span>
                )}
                {tab === key && (
                  <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-zinc-900 dark:bg-zinc-100" />
                )}
              </button>
            ))}
          </div>

          {visibleDrafts.length === 0 && (
            <div className="rounded-xl border border-dashed border-border p-8 text-center">
              <p className="text-sm text-zinc-500">
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
              const editable = d.status === "pending";
              return (
                <li
                  key={d.id}
                  className="rounded-xl border border-border bg-surface p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2 text-xs text-zinc-500">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={d.status} />
                      {d.topic_label && (
                        <span className="text-text-muted">
                          {d.topic_label}
                        </span>
                      )}
                      <span className="text-zinc-400">·</span>
                      <span>#{d.id}</span>
                      {isEdited && (
                        <>
                          <span className="text-zinc-400">·</span>
                          <span className="text-amber-600 dark:text-amber-400 font-medium">
                            {t("dashboard.draft.edited")}
                          </span>
                        </>
                      )}
                    </div>
                    <span>{relativeTime(d.created_at)}</span>
                  </div>

                  {editable ? (
                    <textarea
                      value={currentText}
                      onChange={(e) =>
                        setEdits((s) => ({ ...s, [d.id]: e.target.value }))
                      }
                      rows={Math.min(
                        12,
                        Math.max(3, currentText.split("\n").length + 1),
                      )}
                      className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm leading-relaxed font-sans focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-700 resize-y mb-3"
                    />
                  ) : (
                    <p className="whitespace-pre-wrap text-sm leading-relaxed mb-3">
                      {d.generated_text}
                    </p>
                  )}

                  {d.status === "pending" && refineOpen[d.id] && (
                    <div className="flex flex-wrap items-stretch gap-2 mb-3 pt-3 border-t border-border">
                      <input
                        type="text"
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
                        }}
                        placeholder={t("dashboard.draft.refine_placeholder")}
                        disabled={refiningId === d.id}
                        className="flex-1 min-w-[180px] rounded-md border border-border bg-bg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-700 disabled:opacity-50"
                      />
                      <button
                        onClick={() => onRefine(d.id)}
                        disabled={
                          refiningId !== null ||
                          !(refineInputs[d.id] ?? "").trim()
                        }
                        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-border text-text hover:bg-surface-2 disabled:opacity-50 transition-colors"
                      >
                        {refiningId === d.id && (
                          <span
                            className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"
                            aria-hidden
                          />
                        )}
                        {refiningId === d.id
                          ? t("dashboard.draft.refining")
                          : t("dashboard.draft.refine")}
                      </button>
                      <div className="basis-full flex flex-wrap gap-1.5 text-[10px] text-zinc-500">
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
                            className="px-2 py-0.5 rounded-full bg-surface-2 hover:bg-surface-2 disabled:opacity-50 transition-colors"
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-border">
                    {d.status === "pending" && (
                      <>
                        <button
                          onClick={() => onApprove(d.id, d.generated_text)}
                          className="text-xs px-3 py-1.5 rounded-md bg-green-600 hover:bg-green-700 text-white transition-colors"
                        >
                          {isEdited
                            ? t("dashboard.draft.approve_edited")
                            : t("dashboard.draft.approve")}
                        </button>
                        <button
                          onClick={() => onReject(d.id)}
                          className="text-xs px-3 py-1.5 rounded-md border border-border text-text hover:bg-surface-2 transition-colors"
                        >
                          {t("dashboard.draft.reject")}
                        </button>
                        <button
                          onClick={() =>
                            setRefineOpen((s) => ({ ...s, [d.id]: !s[d.id] }))
                          }
                          className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
                            refineOpen[d.id]
                              ? "border-zinc-400 dark:border-zinc-600 bg-surface-2 text-text"
                              : "border-border text-text hover:bg-surface-2"
                          }`}
                        >
                          {t("dashboard.draft.tweak")} {refineOpen[d.id] ? "▴" : "▾"}
                        </button>
                        {isEdited && (
                          <button
                            onClick={() =>
                              setEdits((s) => {
                                const next = { ...s };
                                delete next[d.id];
                                return next;
                              })
                            }
                            className="text-xs px-2 py-1 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                          >
                            {t("common.revert")}
                          </button>
                        )}
                      </>
                    )}
                    {/* Publish only when approved AND not yet live. */}
                    {d.status === "approved" && !d.published && (
                      <button
                        onClick={() => onPublishClick(d.id, d.generated_text)}
                        className="text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors inline-flex items-center gap-1.5"
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden
                        >
                          <line x1="22" y1="2" x2="11" y2="13" />
                          <polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                        {t("dashboard.draft.publish")}
                      </button>
                    )}
                    {/* Already live — no publish button, link out instead. */}
                    {d.published && (
                      <span className="inline-flex items-center gap-2 text-xs">
                        <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          {t("dashboard.draft.published")}
                        </span>
                        {d.threads_url && (
                          <a
                            href={d.threads_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 underline-offset-2 hover:underline"
                          >
                            {t("dashboard.draft.open_threads")}
                          </a>
                        )}
                      </span>
                    )}
                    <div className="ml-auto flex items-center gap-3">
                      {!d.published &&
                        (confirmDeleteId === d.id ? (
                          <span className="inline-flex items-center gap-2 text-xs">
                            <span className="text-zinc-500">
                              {t("dashboard.draft.confirm_delete")}
                            </span>
                            <button
                              onClick={() => onDeleteDraft(d.id)}
                              className="text-red-600 dark:text-red-400 hover:text-red-700 font-medium"
                            >
                              {t("dashboard.draft.delete")}
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                            >
                              {t("common.cancel")}
                            </button>
                          </span>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(d.id)}
                            className="text-xs text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                          >
                            {t("dashboard.draft.delete")}
                          </button>
                        ))}
                      <TranslateButton
                        text={currentText}
                        source={`draft_${d.content_type}`}
                      />
                    </div>
                  </div>
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
      <div className="fixed bottom-6 right-6 z-30 space-y-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium pointer-events-auto ${
              t.tone === "error"
                ? "bg-red-600 text-white"
                : "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
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
  const styles =
    status === "approved"
      ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
      : status === "published"
      ? "bg-primary text-primary-foreground"
      : status === "rejected"
      ? "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 line-through"
      : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300";
  const key = STATUS_LABEL[status];
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide ${styles}`}>
      {key ? t(key) : status}
    </span>
  );
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}
