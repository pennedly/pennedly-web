"use client";

// Sign-in page — primarily magic-link via email.
//
// Two phases the user can be in:
//   1. Email form  — they came here to sign in. Submit POSTs
//      /api/auth/magic-link/request, then we show a "check your
//      email" confirmation. The same form is used to resend.
//   2. Token consume — they clicked a link in their email. The URL
//      carries ?token=xxx; on mount we POST /consume, set tokens,
//      hydrate identity, redirect to /app.
//
// Dev-login form is collapsed by default under a "developer mode"
// toggle so it doesn't pollute the primary flow for real users.

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  ApiError,
  consumeMagicLink,
  devLogin,
  fetchMe,
  requestMagicLink,
  setTokens,
} from "@/lib/api";
import { captureEvent, identify } from "@/lib/analytics";

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const incomingToken = searchParams.get("token");

  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  // Dev-login bottom drawer (hidden by default)
  const [devOpen, setDevOpen] = useState(false);
  const [devEmail, setDevEmail] = useState("");

  // Magic-link consume on mount when ?token=xxx is present.
  const [consumeState, setConsumeState] = useState<
    "idle" | "consuming" | "failed"
  >(incomingToken ? "consuming" : "idle");
  const [consumeError, setConsumeError] = useState<string | null>(null);

  useEffect(() => {
    if (!incomingToken) return;
    (async () => {
      try {
        const pair = await consumeMagicLink(incomingToken);
        setTokens(pair);
        try {
          const me = await fetchMe();
          identify(me.user_id, me.email, me.tenant.id);
          captureEvent("ui.login_succeeded", { method: "magic_link" });
        } catch {
          // identity hydration is best-effort
        }
        router.push("/app");
      } catch (e) {
        if (e instanceof ApiError) {
          setConsumeError(
            e.status === 410
              ? "This sign-in link is no longer valid. Request a new one below."
              : `Sign-in failed (${e.status}). Try again below.`,
          );
        } else {
          setConsumeError(String(e));
        }
        setConsumeState("failed");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onMagicSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    captureEvent("ui.magic_link_requested", { email_length: email.length });
    try {
      await requestMagicLink(email);
      setSent(true);
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.status === 429) {
          setError("Too many sign-in attempts — wait an hour and try again.");
        } else if (e.status === 503) {
          setError("Email delivery is down right now. Try again in a minute.");
        } else {
          setError(`Sign-in failed (${e.status}).`);
        }
      } else {
        setError(String(e));
      }
    } finally {
      setPending(false);
    }
  }

  async function onDevSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const pair = await devLogin(devEmail);
      setTokens(pair);
      try {
        const me = await fetchMe();
        identify(me.user_id, me.email, me.tenant.id);
        captureEvent("ui.login_succeeded", { method: "dev_login" });
      } catch {
        // best-effort
      }
      router.push("/app");
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.status === 404) {
          setError("dev-login is disabled on the backend.");
        } else if (e.status === 429) {
          setError("Too many sign-in attempts — wait an hour.");
        } else {
          setError(`Sign-in failed (${e.status}).`);
        }
      } else {
        setError(String(e));
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="max-w-md mx-auto px-6 py-12 font-sans text-zinc-900 dark:text-zinc-100">
      <h1 className="text-2xl font-semibold tracking-tight mb-1">Pennedly</h1>
      <p className="text-sm text-zinc-500 mb-8">
        Drafting partner for your Threads voice.
      </p>

      {/* Magic-link consume state */}
      {consumeState === "consuming" && (
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 text-sm">
          <div className="flex items-center gap-2">
            <span
              className="inline-block w-3 h-3 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin"
              aria-hidden
            />
            Signing you in…
          </div>
        </div>
      )}

      {consumeState === "failed" && consumeError && (
        <div className="rounded-lg border border-amber-300 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/30 p-4 text-sm text-amber-900 dark:text-amber-200 mb-4">
          {consumeError}
        </div>
      )}

      {/* Primary: magic-link email form. Hidden while we're consuming
          to avoid flashing the form mid-redirect. */}
      {consumeState !== "consuming" && (
        <>
          {sent ? (
            <div className="rounded-xl border border-green-300 dark:border-green-900/60 bg-green-50 dark:bg-green-950/30 p-5 space-y-3">
              <h2 className="text-base font-semibold text-green-900 dark:text-green-200">
                Check your inbox
              </h2>
              <p className="text-sm text-green-800 dark:text-green-200">
                We sent a sign-in link to{" "}
                <span className="font-medium">{email}</span>. The link is
                valid for 15 minutes and can only be used once.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSent(false);
                  setError(null);
                }}
                className="text-xs text-green-800 dark:text-green-300 underline hover:text-green-900 dark:hover:text-green-200"
              >
                use a different email
              </button>
            </div>
          ) : (
            <form onSubmit={onMagicSubmit} className="space-y-3">
              <label className="block">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  email
                </span>
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-700"
                  placeholder="you@example.com"
                />
              </label>

              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={pending || !email}
                className="w-full px-4 py-2 rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-sm font-medium hover:bg-zinc-700 dark:hover:bg-white disabled:opacity-50 transition-colors"
              >
                {pending ? "sending…" : "send sign-in link"}
              </button>

              <p className="text-xs text-zinc-500 leading-relaxed pt-2">
                We&apos;ll email you a one-time link. No password needed.
              </p>
            </form>
          )}
        </>
      )}

      {/* Dev-login drawer */}
      <div className="mt-12 pt-6 border-t border-zinc-200 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => setDevOpen((o) => !o)}
          className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
        >
          {devOpen ? "hide developer mode" : "developer mode"}
        </button>
        {devOpen && (
          <form onSubmit={onDevSubmit} className="mt-3 space-y-2">
            <p className="text-xs text-zinc-500">
              Skips email verification. Only works when{" "}
              <code className="font-mono">ALLOW_DEV_LOGIN=true</code> is set on
              the backend.
            </p>
            <input
              type="email"
              value={devEmail}
              onChange={(e) => setDevEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-1.5 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-700"
            />
            <button
              type="submit"
              disabled={pending || !devEmail}
              className="text-xs px-3 py-1.5 rounded-md border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 transition-colors"
            >
              {pending ? "signing in…" : "dev sign in"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

export default function LoginPage() {
  // useSearchParams must be inside a Suspense boundary for streaming SSR.
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}
