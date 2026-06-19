"use client";

// Studio (/app) — the app's biggest screen, rebuilt 1:1 to Studio-SPEC.html.
// Brief a topic → Pennedly drafts N posts in your voice → review / tweak /
// translate / approve / publish to Threads. Real API wiring is preserved
// (generate, approve, reject, publish, refine, translate) with optimistic +
// deferred-commit Undo on approve/reject. A tester-only `?demo=1` Tweaks panel
// drives every state (account / feed-state / drafts / density / dark) on mock
// content so the redesign can be reviewed state-by-state.

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
  generateIdeas,
  generatePost,
  generatePostBatch,
  getTokens,
  listDrafts,
  publishDraft,
  refineDraft,
  rejectDraft,
  scheduleDraft,
  setDraftMedia,
  setDraftVideo,
  translateText,
  uploadMedia,
} from "@/lib/api";
import { captureEvent, identify } from "@/lib/analytics";
import { isOnboardingSkipped, setSelectedAccountId, useSelectedAccountId } from "@/lib/account";
import { useTranslation } from "@/lib/i18n";
import { AppTopbar, TopbarPill } from "@/components/AppTopbar";
import { Toast, ToastHost } from "@/components/ui/toast";
import { TweaksPanel, TweakSection, TweakToggle, TweakRadio, useTweaks } from "@/components/tweaks/TweaksPanel";
import {
  DraftCard,
  EmptyState,
  ErrorBanner,
  FilterTabs,
  FirstRun,
  SkeletonCard,
  StudioComposer,
  StudioPublishDialog,
  type CardHandlers,
  type Density,
} from "@/components/studio/StudioParts";
import { ImportBanner, useActiveSyncStatus } from "@/components/studio/ImportBanner";
import {
  DEMO_CARDS,
  STUDIO_TWEAK_DEFAULTS,
  type StudioCard,
  type StudioStatus,
  type UiLang,
} from "@/components/studio/studio-demo";
import { useDeferredCommit } from "@/lib/use-deferred-commit";
import type { DraftSummary, Me } from "@/lib/types";

const IS_DEV = process.env.NODE_ENV === "development";
const UNDO_MS = 5000;

type ToastT = {
  id: number;
  title: string;
  description?: string;
  tone: "success" | "error";
  onUndo?: () => void;
  undoLabel?: string;
};

// Map a backend draft into the unified card model the UI renders.
function statusOf(d: DraftSummary): StudioStatus {
  if (d.published) return "published";
  if (d.scheduled_at && d.status === "approved") return "scheduled";
  if (d.status === "approved") return "ready";
  if (d.status === "rejected") return "rejected";
  return "draft";
}

export default function Studio() {
  const router = useRouter();
  const { t, locale } = useTranslation();

  const [me, setMe] = useState<Me | null>(null);
  const accountId = useSelectedAccountId();
  const [drafts, setDrafts] = useState<DraftSummary[]>([]);
  // True while the first real drafts fetch is in flight, so the list shows a
  // skeleton instead of flashing the empty state. Starts true (the initial
  // render is a load); cleared once a fetch settles (or in demo mode).
  const [draftsLoading, setDraftsLoading] = useState(true);
  const [edits, setEdits] = useState<Record<number, string>>({});
  const [tab, setTab] = useState<StudioStatus>("ready");
  const [composerText, setComposerText] = useState("");
  const [generating, setGenerating] = useState(false);
  const [batchCount, setBatchCount] = useState<number>(() => {
    if (typeof window === "undefined") return 3;
    const raw = window.localStorage.getItem("pennedly.batchCount");
    const n = raw ? Number(raw) : 3;
    return Number.isFinite(n) && n >= 1 && n <= 4 ? n : 3;
  });
  const [selectedAccount, setSelectedAccount] = useState<{ name: string; handle: string | null; initials: string; avatarUrl: string | null } | null>(null);
  const [publishTarget, setPublishTarget] = useState<{ card: StudioCard; account: { name: string; handle: string | null; initials: string } | null; mode: "now" | "schedule" } | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [toasts, setToasts] = useState<ToastT[]>([]);
  const [bootError, setBootError] = useState<string | null>(null);
  const [needsVoiceSetup, setNeedsVoiceSetup] = useState(false);
  const [voiceReady, setVoiceReady] = useState<boolean | null>(null);

  // Demo (?demo=1, tester/dev only): Tweaks-driven mock content.
  const [demoParam] = useState(() => (typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("demo") === "1" : false));
  const [tw, setTw] = useTweaks(STUDIO_TWEAK_DEFAULTS);
  const [demoCards, setDemoCards] = useState<StudioCard[]>(DEMO_CARDS);
  const allowTweaks = demoParam && (me?.is_tester === true || IS_DEV);
  const demoOn = allowTweaks;

  const deferred = useDeferredCommit();

  function toast(title: string, tone: ToastT["tone"] = "success", opts?: { description?: string; onUndo?: () => void; undoLabel?: string; duration?: number }) {
    const id = Date.now() + Math.random();
    setToasts((p) => [...p, { id, title, description: opts?.description, tone, onUndo: opts?.onUndo, undoLabel: opts?.undoLabel }]);
    setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), opts?.duration ?? 4800);
    return id;
  }
  function dismissToast(id: number) {
    setToasts((p) => p.filter((x) => x.id !== id));
  }

  // ── auth + identity ──
  useEffect(() => {
    if (demoParam) return; // demo renders standalone — no auth required
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

  // ── post-OAuth landing toast ──
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
      // Switch the active account to the one just connected (mirrors the
      // onboarding flow), otherwise the dashboard lingers on the previously
      // selected profile. Prefer the username from the OAuth return query;
      // fall back to the newest account by connected_at.
      void (async () => {
        try {
          const list = await fetchMyAccounts();
          const active = list.accounts.filter((a) => a.disconnected_at === null);
          if (active.length === 0) return;
          const justConnected =
            (u ? active.find((a) => a.username === u) : undefined) ??
            active.reduce((a, b) => (b.connected_at > a.connected_at ? b : a));
          setSelectedAccountId(justConnected.id);
        } catch {
          /* the account switcher will still auto-select on its own fetch */
        }
      })();
    } else if (err) {
      toast(err === "account_limit" ? t("accounts.connect_limit") : t("accounts.connect_error"), "error");
      captureEvent("threads.connect_failed", { reason: err });
    }
    const url = new URL(window.location.href);
    url.searchParams.delete("threads_connected");
    url.searchParams.delete("threads_error");
    url.searchParams.delete("username");
    window.history.replaceState({}, "", url.pathname + url.search + url.hash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Advisor handoff: "Open in Studio" routes here with ?brief=… — seed the
  // composer with that brief (the author edits + hits Generate, the usual
  // Studio flow). A quiet toast names the origin. Consumed once, then stripped.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const brief = params.get("brief");
    if (!brief) return;
    setComposerText(brief.slice(0, 500));
    toast(t("advisor.from_advisor"));
    const url = new URL(window.location.href);
    url.searchParams.delete("brief");
    url.searchParams.delete("from");
    window.history.replaceState({}, "", url.pathname + url.search + url.hash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── load drafts on account change ──
  useEffect(() => {
    if (demoParam) {
      setDraftsLoading(false); // demo uses the Tweaks state, not a real fetch
      return;
    }
    if (accountId === null) return; // still resolving — keep the skeleton up
    setDraftsLoading(true);
    // Clear the voice-state pill while switching accounts so it shows a neutral
    // placeholder (voiceReady === null renders no pill) instead of the previous
    // account's "Voice active"/"not set" until this account's status resolves.
    setVoiceReady(null);
    (async () => {
      try {
        const ob = await fetchOnboardingStatus(accountId);
        setVoiceReady(!ob.needs_onboarding);
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
        }
      } finally {
        setDraftsLoading(false);
      }
    })();
  }, [accountId, router]);

  // ── selected account identity (card avatar/name) ──
  useEffect(() => {
    if (demoParam) return;
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
        const initials = (parts.length >= 2 ? parts[0][0] + parts[1][0] : name.slice(0, 2)).toUpperCase();
        setSelectedAccount({ name, handle: a.username, initials: initials || "?", avatarUrl: a.profile_picture_url });
      })
      .catch(() => {});
  }, [accountId]);

  // ── demo dark toggle ──
  useEffect(() => {
    if (!demoOn) return;
    document.documentElement.classList.toggle("dark", !!tw.dark);
  }, [demoOn, tw.dark]);

  function persistBatchCount(n: number) {
    setBatchCount(n);
    if (typeof window !== "undefined") window.localStorage.setItem("pennedly.batchCount", String(n));
  }

  // ════════════════════ REAL handlers ════════════════════
  async function realGenerate() {
    if (accountId === null || generating) return;
    setGenerating(true);
    setTab("draft");
    captureEvent("ui.generate_clicked", { account_id: accountId, batch_count: batchCount });
    try {
      if (batchCount === 1) await generatePost(accountId, undefined, composerText);
      else await generatePostBatch(accountId, batchCount, undefined, composerText);
      const list = await listDrafts(accountId, { limit: 50 });
      setDrafts(list.drafts);
      setComposerText("");
    } catch (e) {
      toast(String(e), "error");
    } finally {
      setGenerating(false);
    }
  }

  function realApprove(card: StudioCard) {
    const idx = drafts.findIndex((d) => d.id === card.id);
    const original = drafts[idx];
    if (!original) return;
    captureEvent("ui.approve_clicked", { draft_id: card.id });
    setDrafts((p) => p.map((d) => (d.id === card.id ? { ...d, status: "approved" } : d)));
    const key = `approve-${card.id}`;
    deferred.schedule(
      key,
      async () => {
        try {
          const localEdit = edits[card.id];
          const wasEdited = localEdit !== undefined && localEdit.trim() !== original.generated_text.trim();
          await approveDraft(card.id, { editedText: wasEdited ? localEdit : undefined });
          setEdits((s) => {
            const n = { ...s };
            delete n[card.id];
            return n;
          });
          if (accountId !== null) {
            const list = await listDrafts(accountId, { limit: 50 });
            setDrafts(list.drafts);
          }
        } catch (e) {
          setDrafts((p) => p.map((d) => (d.id === card.id ? original : d)));
          toast(String(e), "error");
        }
      },
      UNDO_MS,
    );
    toast(t("studio.toast_approved"), "success", {
      description: t("studio.toast_moved_ready"),
      duration: UNDO_MS,
      undoLabel: t("common.undo"),
      onUndo: () => {
        deferred.cancel(key);
        setDrafts((p) => p.map((d) => (d.id === card.id ? original : d)));
      },
    });
  }

  function realReject(card: StudioCard) {
    const idx = drafts.findIndex((d) => d.id === card.id);
    const original = drafts[idx];
    if (!original) return;
    captureEvent("ui.reject_clicked", { draft_id: card.id });
    setDrafts((p) => p.map((d) => (d.id === card.id ? { ...d, status: "rejected" } : d)));
    const key = `reject-${card.id}`;
    deferred.schedule(
      key,
      async () => {
        try {
          await rejectDraft(card.id);
        } catch (e) {
          setDrafts((p) => p.map((d) => (d.id === card.id ? original : d)));
          toast(String(e), "error");
        }
      },
      UNDO_MS,
    );
    toast(t("studio.toast_rejected"), "success", {
      description: t("studio.toast_moved_rejected"),
      duration: UNDO_MS,
      undoLabel: t("common.undo"),
      onUndo: () => {
        deferred.cancel(key);
        setDrafts((p) => p.map((d) => (d.id === card.id ? original : d)));
      },
    });
  }

  function realDelete(card: StudioCard) {
    const idx = drafts.findIndex((d) => d.id === card.id);
    const original = drafts[idx];
    if (!original) return;
    captureEvent("ui.delete_clicked", { draft_id: card.id });
    // Re-insert near the original slot on undo or on a failed commit.
    const restore = () =>
      setDrafts((p) => {
        if (p.some((d) => d.id === card.id)) return p;
        const next = [...p];
        next.splice(Math.min(idx, next.length), 0, original);
        return next;
      });
    setDrafts((p) => p.filter((d) => d.id !== card.id));
    const key = `delete-${card.id}`;
    deferred.schedule(
      key,
      async () => {
        try {
          await deleteDraft(card.id);
        } catch (e) {
          restore();
          toast(String(e), "error");
        }
      },
      UNDO_MS,
    );
    toast(t("studio.toast_deleted"), "success", {
      duration: UNDO_MS,
      undoLabel: t("common.undo"),
      onUndo: () => {
        deferred.cancel(key);
        restore();
      },
    });
  }

  async function realPublishConfirm() {
    if (publishTarget === null) return;
    const card = publishTarget.card;
    setPublishing(true);
    captureEvent("ui.publish_confirmed", { draft_id: card.id });
    try {
      const result = await publishDraft(card.id);
      setDrafts((p) => p.map((d) => (d.id === card.id ? { ...d, published: true, threads_url: d.threads_url } : d)));
      setPublishTarget(null);
      setTab("published");
      toast(t("studio.toast_published"), "success", { description: selectedAccount?.handle ? `@${selectedAccount.handle}` : `#${result.threads_post_id}` });
    } catch (e) {
      toast(String(e), "error");
    } finally {
      setPublishing(false);
    }
  }

  async function realScheduleConfirm(iso: string) {
    if (publishTarget === null) return;
    const card = publishTarget.card;
    setScheduling(true);
    captureEvent("ui.schedule_confirmed", { draft_id: card.id });
    try {
      const result = await scheduleDraft(card.id, iso);
      setDrafts((p) => p.map((d) => (d.id === card.id ? { ...d, scheduled_at: result.scheduled_at, schedule_failed: false } : d)));
      setPublishTarget(null);
      setTab("scheduled");
      toast(t("studio.toast_scheduled"), "success");
    } catch (e) {
      toast(String(e), "error");
    } finally {
      setScheduling(false);
    }
  }

  const realHandlers: CardHandlers = {
    onApprove: realApprove,
    onReject: realReject,
    onPublish: (card, mode = "now") => {
      captureEvent("ui.publish_clicked", { draft_id: card.id, mode });
      setPublishTarget({ card, account: selectedAccount, mode });
    },
    onSendBack: () => {},
    onRestore: () => {},
    onSaveEdit: (card, text) => setEdits((s) => ({ ...s, [card.id]: text })),
    onTweak: async (card, instruction) => {
      const result = await refineDraft(card.id, instruction);
      setDrafts((p) => p.map((d) => (d.id === card.id ? { ...d, generated_text: result.text } : d)));
      setEdits((s) => {
        const n = { ...s };
        delete n[card.id];
        return n;
      });
      return result.text;
    },
    onTranslate: async (card, lang) => {
      const r = await translateText(card.body, lang.code);
      return r.translated_text;
    },
    onDelete: realDelete,
    onUploadImage: async (file) => {
      if (accountId === null) throw new Error("no account");
      return uploadMedia(accountId, file);
    },
    onSetMedia: async (card, media) => {
      await setDraftMedia(card.id, media);
      // Attaching images clears any video server-side (mutual exclusion).
      setDrafts((p) =>
        p.map((d) => (d.id === card.id ? { ...d, media, video: media.length ? null : d.video } : d)),
      );
    },
    onSetVideo: async (card, video) => {
      await setDraftVideo(card.id, video);
      // Attaching a video clears images server-side (mutual exclusion).
      setDrafts((p) =>
        p.map((d) => (d.id === card.id ? { ...d, video, media: video ? [] : d.media } : d)),
      );
    },
  };

  // ════════════════════ DEMO handlers ════════════════════
  function demoMove(card: StudioCard, to: StudioStatus, title: string, description?: string, undoable = true) {
    const from = card.status;
    setDemoCards((p) => p.map((c) => (c.id === card.id ? { ...c, status: to } : c)));
    toast(title, "success", {
      description,
      duration: undoable ? UNDO_MS : 4800,
      undoLabel: undoable ? t("common.undo") : undefined,
      onUndo: undoable ? () => setDemoCards((p) => p.map((c) => (c.id === card.id ? { ...c, status: from } : c))) : undefined,
    });
  }

  const demoHandlers: CardHandlers = {
    onApprove: (card) => demoMove(card, "ready", t("studio.toast_approved"), t("studio.toast_moved_ready")),
    onReject: (card) => demoMove(card, "rejected", t("studio.toast_rejected"), t("studio.toast_moved_rejected")),
    onSendBack: (card) => demoMove(card, "draft", t("studio.toast_restored"), undefined, false),
    onRestore: (card) => demoMove(card, "draft", t("studio.toast_restored"), undefined, false),
    onPublish: (card, mode = "now") => setPublishTarget({ card, account: card.author, mode }),
    onSaveEdit: (card, text) => {
      setDemoCards((p) => p.map((c) => (c.id === card.id ? { ...c, body: text } : c)));
      toast(t("studio.toast_edit_saved"), "success", { duration: 2600 });
    },
    onTweak: async (card, _instruction) => {
      await new Promise((r) => setTimeout(r, 1400));
      const revised =
        "Show up every day. Keep the bar low enough to clear when you're tired, and let compounding do the work. Most people quit one post before it would have landed.";
      setDemoCards((p) => p.map((c) => (c.id === card.id ? { ...c, body: revised } : c)));
      return revised;
    },
    onTranslate: async (card, lang: UiLang) => {
      await new Promise((r) => setTimeout(r, 600));
      if (lang.code === "ru") return "Постоянство бьёт талант. Появляйся каждый день, держи планку посильной, и пусть всё решает накопленный эффект.";
      return `[${lang.native}] ${card.body}`;
    },
    onDelete: (card) => {
      const from = demoCards.findIndex((c) => c.id === card.id);
      const original = demoCards[from];
      if (!original) return;
      setDemoCards((p) => p.filter((c) => c.id !== card.id));
      toast(t("studio.toast_deleted"), "success", {
        duration: UNDO_MS,
        undoLabel: t("common.undo"),
        onUndo: () =>
          setDemoCards((p) => {
            if (p.some((c) => c.id === card.id)) return p;
            const next = [...p];
            next.splice(Math.min(from, next.length), 0, original);
            return next;
          }),
      });
    },
    onUploadImage: async (file) => ({ url: URL.createObjectURL(file) }),
    onSetMedia: async (card, media) => {
      setDemoCards((p) =>
        p.map((c) => (c.id === card.id ? { ...c, media, video: media.length ? null : c.video } : c)),
      );
    },
    onSetVideo: async (card, video) => {
      setDemoCards((p) =>
        p.map((c) => (c.id === card.id ? { ...c, video, media: video ? [] : c.media } : c)),
      );
    },
  };

  function demoGenerate() {
    if (generating) return;
    const n = Number(tw.drafts);
    setGenerating(true);
    setTab("draft");
    setComposerText("");
    setTimeout(() => {
      const made: StudioCard[] = Array.from({ length: n }, (_, i) => ({
        id: 8000 + i + Math.floor(Math.random() * 1000),
        status: "draft",
        kind: "post",
        author: { name: "Mara Lin", handle: "mara.lin", initials: "ML" },
        time: "now",
        body: "Fresh draft in your voice. Brief a topic and Pennedly writes a few takes you can approve, tweak, or pass on.",
        stats: null,
      }));
      setDemoCards((p) => [...made, ...p]);
      setGenerating(false);
    }, 1600);
  }

  // Backfill banner — top of the content column while the active account is
  // still importing its history (disabled in demo; the page drives it via props).
  const sync = useActiveSyncStatus(!demoOn);

  // ════════════════════ derived ════════════════════
  const handlers = demoOn ? demoHandlers : realHandlers;
  const density: Density = demoOn && tw.density === "Compact" ? "compact" : "comfortable";
  const firstRun = demoOn ? tw.account === "First-run" : needsVoiceSetup;
  const feedState = demoOn ? (tw.state as "Normal" | "Loading" | "Empty" | "Error") : "Normal";
  const busyCount = demoOn ? Number(tw.drafts) : batchCount;

  const realCards: StudioCard[] = drafts.map((d) => ({
    id: d.id,
    status: statusOf(d),
    kind: d.content_type === "comment_reply" ? "reply" : "post",
    author: { name: selectedAccount?.name ?? "…", handle: selectedAccount?.handle ?? null, initials: selectedAccount?.initials ?? "·", avatarUrl: selectedAccount?.avatarUrl ?? null },
    body: edits[d.id] ?? d.generated_text,
    time: relativeTime(d.created_at, locale),
    reply: d.reply_to ? { who: d.reply_to.who ?? "", text: d.reply_to.text } : null,
    threadsUrl: d.threads_url,
    stats: null,
    scheduledAt: d.scheduled_at,
    media: d.media ?? [],
    video: d.video ?? null,
  }));
  const cards = demoOn ? demoCards : realCards;

  const counts: Record<StudioStatus, number> = {
    ready: cards.filter((c) => c.status === "ready").length,
    draft: cards.filter((c) => c.status === "draft").length,
    scheduled: cards.filter((c) => c.status === "scheduled").length,
    published: cards.filter((c) => c.status === "published").length,
    rejected: cards.filter((c) => c.status === "rejected").length,
  };
  const visible = cards.filter((c) => c.status === tab);

  const voicePill = demoOn ? (
    <TopbarPill tone={firstRun ? "warning" : "success"}>{firstRun ? t("dashboard.voice_not_set") : t("dashboard.voice_active")}</TopbarPill>
  ) : voiceReady === null ? undefined : (
    <TopbarPill tone={voiceReady ? "success" : "warning"}>{voiceReady ? t("dashboard.voice_active") : t("dashboard.voice_not_set")}</TopbarPill>
  );

  if (bootError) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <div className="rounded-lg border border-danger/40 bg-danger/10 p-4 text-small text-danger">{bootError}</div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-text" data-density={density}>
      <AppTopbar maxW="960px" title={t("nav.studio")} pill={voicePill} />
      <main className="mx-auto flex max-w-[960px] flex-col gap-4 px-3.5 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-4 md:gap-5 md:px-6 md:pb-24 md:pt-7">
        {!demoOn && <ImportBanner status={sync.status} summary={sync.summary} />}
        {firstRun ? (
          <FirstRun onSetup={() => router.push("/app/onboarding")} />
        ) : (
          <>
            <StudioComposer
              // The composer writes AS the active Threads account, so its avatar
              // is that account's photo — not the signed-in Pennedly user's.
              avatarText={selectedAccount?.initials ?? "·"}
              avatarUrl={selectedAccount?.avatarUrl ?? null}
              value={composerText}
              onChange={setComposerText}
              count={demoOn ? Number(tw.drafts) : batchCount}
              onCount={(n) => (demoOn ? setTw("drafts", String(n)) : persistBatchCount(n))}
              onGenerate={demoOn ? demoGenerate : realGenerate}
              onIdeas={
                demoOn
                  ? async () => {
                      await new Promise((r) => setTimeout(r, 850));
                      return [
                        { hook: "The fastest way to find your voice online: publish the thing you're slightly embarrassed by.", angle: "Contrarian take on polish vs. authenticity" },
                        { hook: "Crickets are data, not a verdict.", angle: "Reframe a quiet post as a signal, not a failure" },
                        { hook: "I stopped chasing viral and my reach went up. Here's what I did instead.", angle: "Counterintuitive growth story from your own runs" },
                        { hook: "Consistency beats talent, but only if you make the bar low enough to clear when you're tired.", angle: "Practical systems angle on showing up" },
                        { hook: "Most people quit one post before it would have worked.", angle: "Short, punchy motivation in your voice" },
                      ];
                    }
                  : async () => (accountId === null ? [] : (await generateIdeas(accountId)).ideas)
              }
              busy={generating}
              busyCount={busyCount}
              disabled={!demoOn && accountId === null}
            />

            <FilterTabs active={tab} counts={counts} onChange={setTab} />

            <div className={density === "compact" ? "flex flex-col gap-2.5" : "flex flex-col gap-3.5"}>
              {feedState === "Loading" || (!demoOn && draftsLoading) ? (
                <>
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </>
              ) : feedState === "Error" ? (
                <ErrorBanner onRetry={() => setTw("state", "Normal")} />
              ) : feedState === "Empty" || visible.length === 0 ? (
                <EmptyState status={tab} onWrite={() => document.querySelector<HTMLTextAreaElement>("textarea")?.focus()} />
              ) : (
                visible.map((c) => (
                  <DraftCard key={c.id} card={c} density={density} h={handlers} demo={demoOn} replyReadOnly={!demoOn && c.kind === "reply"} />
                ))
              )}
            </div>
          </>
        )}
      </main>

      <StudioPublishDialog
        open={publishTarget !== null}
        text={publishTarget?.card.body ?? ""}
        account={publishTarget?.account ?? null}
        initialMode={publishTarget?.mode ?? "now"}
        publishing={publishing}
        scheduling={scheduling}
        onClose={() => {
          if (!publishing && !scheduling) setPublishTarget(null);
        }}
        onConfirm={() => {
          if (demoOn) {
            const card = publishTarget?.card;
            if (card) {
              setDemoCards((p) => p.map((c) => (c.id === card.id ? { ...c, status: "published", stats: { likes: 0, replies: 0, reposts: 0 } } : c)));
              setTab("published");
              toast(t("studio.toast_published"), "success", { description: card.author.handle ? `@${card.author.handle}` : undefined });
            }
            setPublishTarget(null);
          } else {
            realPublishConfirm();
          }
        }}
        onSchedule={(iso) => {
          if (demoOn) {
            const card = publishTarget?.card;
            if (card) {
              setDemoCards((p) => p.map((c) => (c.id === card.id ? { ...c, status: "scheduled", scheduledAt: iso } : c)));
              setTab("scheduled");
              toast(t("studio.toast_scheduled"), "success");
            }
            setPublishTarget(null);
          } else {
            realScheduleConfirm(iso);
          }
        }}
      />

      <ToastHost>
        {toasts.map((to) => (
          <Toast
            key={to.id}
            tone={to.tone}
            title={to.title}
            description={to.description}
            undoLabel={to.undoLabel}
            className="[animation:toast-in_var(--duration-slow)_var(--ease-entrance)]"
            onUndo={to.onUndo ? () => { to.onUndo?.(); dismissToast(to.id); } : undefined}
          />
        ))}
      </ToastHost>

      {allowTweaks && (
        <TweaksPanel title="Studio">
          <TweakSection label="Account" />
          <TweakRadio label="Account" value={tw.account} options={["Active", "First-run"]} onChange={(v) => setTw("account", v)} />
          <TweakSection label="Feed" />
          <TweakRadio label="State" value={tw.state} options={["Normal", "Loading", "Empty", "Error"]} onChange={(v) => setTw("state", v)} />
          <TweakRadio label="Drafts / generate" value={tw.drafts} options={["1", "2", "3", "4"]} onChange={(v) => setTw("drafts", v)} />
          <TweakSection label="Appearance" />
          <TweakToggle label="Dark mode" value={tw.dark} onChange={(v) => setTw("dark", v)} />
          <TweakRadio label="Density" value={tw.density} options={["Comfortable", "Compact"]} onChange={(v) => setTw("density", v)} />
        </TweaksPanel>
      )}
    </div>
  );
}

// Locale-aware relative time (Intl handles plurals/locales natively).
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
