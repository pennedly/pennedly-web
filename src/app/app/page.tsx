"use client";

// Dashboard placeholder.
// Quality bar: SKELETON ONLY. Real form layout, loading skeletons,
// approve/reject UI polish, and visual design are deliberately
// deferred to the live UI session — they need eyes to tune.

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
import type { DraftSummary, GeneratedDraft, Me } from "@/lib/types";

export default function Dashboard() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [drafts, setDrafts] = useState<DraftSummary[]>([]);
  const [accountId, setAccountId] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);
  const [lastDraft, setLastDraft] = useState<GeneratedDraft | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        // For Phase 1 we assume one connected account per tenant; the UI
        // will gain a switcher later. Hardcode account 2 (the seeded
        // @reganomika1) for the dogfooding instance.
        setAccountId(2);
        const list = await listDrafts(2, { limit: 10 });
        setDrafts(list.drafts);
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          clearTokens();
          router.push("/app/login");
          return;
        }
        setError(String(e));
      }
    })();
  }, [router]);

  async function onGenerate() {
    if (accountId === null) return;
    setError(null);
    setGenerating(true);
    captureEvent("ui.generate_clicked", { account_id: accountId });
    try {
      const draft = await generatePost(accountId);
      setLastDraft(draft);
      const list = await listDrafts(accountId, { limit: 10 });
      setDrafts(list.drafts);
    } catch (e) {
      setError(String(e));
    } finally {
      setGenerating(false);
    }
  }

  async function onApprove(id: number) {
    captureEvent("ui.approve_clicked", { draft_id: id });
    try {
      await approveDraft(id);
      if (accountId !== null) {
        const list = await listDrafts(accountId, { limit: 10 });
        setDrafts(list.drafts);
      }
    } catch (e) {
      setError(String(e));
    }
  }

  async function onReject(id: number) {
    captureEvent("ui.reject_clicked", { draft_id: id });
    try {
      await rejectDraft(id);
      if (accountId !== null) {
        const list = await listDrafts(accountId, { limit: 10 });
        setDrafts(list.drafts);
      }
    } catch (e) {
      setError(String(e));
    }
  }

  function onLogout() {
    captureEvent("ui.logout_clicked");
    resetIdentity();
    clearTokens();
    router.push("/app/login");
  }

  return (
    <main className="max-w-3xl mx-auto p-8 font-sans text-zinc-900 dark:text-zinc-100">
      <header className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Pennedly</h1>
          {me && (
            <p className="text-sm text-zinc-500">
              {me.email} · {me.tenant.name} · {me.tenant.plan_tier}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <a
            href="/app/role-book"
            className="text-sm underline text-zinc-600 dark:text-zinc-400"
          >
            edit voice
          </a>
          <button
            onClick={onLogout}
            className="text-sm underline text-zinc-600 dark:text-zinc-400"
          >
            logout
          </button>
        </div>
      </header>

      {error && (
        <div className="mb-4 p-3 rounded border border-red-300 bg-red-50 dark:bg-red-950 text-sm">
          {error}
        </div>
      )}

      <section className="mb-8">
        <button
          onClick={onGenerate}
          disabled={generating || accountId === null}
          className="px-4 py-2 rounded bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black disabled:opacity-50"
        >
          {generating ? "generating…" : "generate post"}
        </button>
        {lastDraft && (
          <div className="mt-4 p-4 rounded border border-zinc-200 dark:border-zinc-800">
            <p className="text-xs text-zinc-500 mb-1">
              {lastDraft.topic_label} · {lastDraft.latency_ms}ms ·{" "}
              {lastDraft.prompt_tokens}+{lastDraft.completion_tokens} tok
            </p>
            <p className="whitespace-pre-wrap">{lastDraft.text}</p>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">recent drafts</h2>
        {drafts.length === 0 && (
          <p className="text-sm text-zinc-500">no drafts yet</p>
        )}
        <ul className="space-y-3">
          {drafts.map((d) => (
            <li
              key={d.id}
              className="p-3 rounded border border-zinc-200 dark:border-zinc-800"
            >
              <div className="text-xs text-zinc-500 mb-1 flex justify-between">
                <span>
                  #{d.id} · {d.content_type} · {d.topic_label ?? "—"} ·{" "}
                  <span
                    className={
                      d.status === "approved"
                        ? "text-green-600"
                        : d.status === "rejected"
                        ? "text-red-500"
                        : "text-zinc-400"
                    }
                  >
                    {d.status}
                  </span>
                </span>
                <span>{new Date(d.created_at).toLocaleString()}</span>
              </div>
              <p className="whitespace-pre-wrap mb-2">{d.generated_text}</p>
              {d.status === "pending" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => onApprove(d.id)}
                    className="text-xs px-2 py-1 rounded border border-green-600 text-green-700"
                  >
                    approve
                  </button>
                  <button
                    onClick={() => onReject(d.id)}
                    className="text-xs px-2 py-1 rounded border border-red-500 text-red-600"
                  >
                    reject
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
