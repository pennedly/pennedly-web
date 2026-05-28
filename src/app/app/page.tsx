"use client";

// Dashboard: where the user spends 90% of their time.
// Layout: sticky header, primary CTA, draft feed. Toast notifications
// for approve/reject so the action feels acknowledged without taking
// the user out of context. TranslateButton inline on every draft for
// users running accounts in a non-native language.

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  ApiError,
  approveDraft,
  clearTokens,
  fetchMe,
  generatePost,
  getTokens,
  listDrafts,
  rejectDraft,
} from "@/lib/api";
import { captureEvent, identify, resetIdentity } from "@/lib/analytics";
import { TranslateButton } from "@/components/TranslateButton";
import type { DraftSummary, GeneratedDraft, Me } from "@/lib/types";

type Toast = { id: number; message: string; tone: "success" | "error" };

export default function Dashboard() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [drafts, setDrafts] = useState<DraftSummary[]>([]);
  const [accountId, setAccountId] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);
  const [lastDraft, setLastDraft] = useState<GeneratedDraft | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [bootError, setBootError] = useState<string | null>(null);

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
        // Single connected account per tenant in Phase 1 — hardcode @reganomika1.
        // Replace with an account picker once /api/me/accounts exists.
        setAccountId(2);
        const list = await listDrafts(2, { limit: 20 });
        setDrafts(list.drafts);
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

  async function onGenerate() {
    if (accountId === null) return;
    setGenerating(true);
    captureEvent("ui.generate_clicked", { account_id: accountId });
    try {
      const draft = await generatePost(accountId);
      setLastDraft(draft);
      const list = await listDrafts(accountId, { limit: 20 });
      setDrafts(list.drafts);
      toast(`generated · ${draft.text.length} chars · ${draft.latency_ms}ms`);
    } catch (e) {
      toast(String(e), "error");
    } finally {
      setGenerating(false);
    }
  }

  async function onApprove(id: number) {
    captureEvent("ui.approve_clicked", { draft_id: id });
    try {
      await approveDraft(id);
      if (accountId !== null) {
        const list = await listDrafts(accountId, { limit: 20 });
        setDrafts(list.drafts);
      }
      toast(`#${id} approved`);
    } catch (e) {
      toast(String(e), "error");
    }
  }

  async function onReject(id: number) {
    captureEvent("ui.reject_clicked", { draft_id: id });
    try {
      await rejectDraft(id);
      if (accountId !== null) {
        const list = await listDrafts(accountId, { limit: 20 });
        setDrafts(list.drafts);
      }
      toast(`#${id} rejected`);
    } catch (e) {
      toast(String(e), "error");
    }
  }

  function onLogout() {
    captureEvent("ui.logout_clicked");
    resetIdentity();
    clearTokens();
    router.push("/app/login");
  }

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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* Sticky header */}
      <header className="sticky top-0 z-20 bg-white/90 dark:bg-zinc-950/90 backdrop-blur border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/app" className="flex items-baseline gap-3">
            <span className="text-lg font-semibold tracking-tight">Pennedly</span>
            {me && (
              <span className="hidden sm:inline text-xs text-zinc-500">
                {me.tenant.name} · {me.tenant.plan_tier}
              </span>
            )}
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link
              href="/app/role-book"
              className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
            >
              voice
            </Link>
            <button
              onClick={onLogout}
              className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
            >
              logout
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        {/* Identity strip */}
        {me && (
          <p className="text-xs text-zinc-500 sm:hidden">
            signed in as {me.email}
          </p>
        )}

        {/* Generate panel */}
        <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-base font-semibold">Generate a post</h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                In your voice. Topic auto-picked round-robin from your topics.
              </p>
            </div>
            <button
              onClick={onGenerate}
              disabled={generating || accountId === null}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-sm font-medium hover:bg-zinc-700 dark:hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {generating && (
                <span
                  className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"
                  aria-hidden
                />
              )}
              {generating ? "generating…" : "generate post"}
            </button>
          </div>

          {lastDraft && (
            <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-2 text-xs text-zinc-500">
                <span>
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">
                    {lastDraft.topic_label ?? "no topic"}
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
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-base font-semibold">Recent drafts</h2>
            <span className="text-xs text-zinc-500">
              {drafts.length} {drafts.length === 1 ? "draft" : "drafts"}
            </span>
          </div>

          {drafts.length === 0 && (
            <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 p-8 text-center">
              <p className="text-sm text-zinc-500">
                No drafts yet. Hit{" "}
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  generate post
                </span>{" "}
                above to get started.
              </p>
            </div>
          )}

          <ul className="space-y-3">
            {drafts.map((d) => (
              <li
                key={d.id}
                className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm"
              >
                <div className="flex items-center justify-between mb-2 text-xs text-zinc-500">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={d.status} />
                    {d.topic_label && (
                      <span className="text-zinc-600 dark:text-zinc-400">
                        {d.topic_label}
                      </span>
                    )}
                    <span className="text-zinc-400">·</span>
                    <span>#{d.id}</span>
                  </div>
                  <span>{relativeTime(d.created_at)}</span>
                </div>

                <p className="whitespace-pre-wrap text-sm leading-relaxed mb-3">
                  {d.generated_text}
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  {d.status === "pending" && (
                    <>
                      <button
                        onClick={() => onApprove(d.id)}
                        className="text-xs px-3 py-1.5 rounded-md bg-green-600 hover:bg-green-700 text-white transition-colors"
                      >
                        approve
                      </button>
                      <button
                        onClick={() => onReject(d.id)}
                        className="text-xs px-3 py-1.5 rounded-md border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      >
                        reject
                      </button>
                    </>
                  )}
                  <div className="ml-auto">
                    <TranslateButton text={d.generated_text} source={`draft_${d.content_type}`} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>

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

function StatusBadge({ status }: { status: string }) {
  const styles =
    status === "approved"
      ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
      : status === "rejected"
      ? "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 line-through"
      : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300";
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide ${styles}`}>
      {status}
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
