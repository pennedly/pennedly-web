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
  exchangeGoogleHandoff,
  fetchMe,
  googleSignInUrl,
  requestEmailCode,
  setTokens,
  verifyEmailCode,
} from "@/lib/api";
import { captureEvent, identify } from "@/lib/analytics";
import { useTranslation } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

function LoginPageInner() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const searchParams = useSearchParams();
  const incomingToken = searchParams.get("token");
  const incomingHandoff = searchParams.get("handoff");
  const authErrorParam = searchParams.get("auth_error");

  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sign-in is by an emailed 6-digit code (the only method).
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Dev-login bottom drawer (hidden by default)
  const [devOpen, setDevOpen] = useState(false);
  const [devEmail, setDevEmail] = useState("");

  // Magic-link consume on mount when ?token=xxx is present.
  const [consumeState, setConsumeState] = useState<
    "idle" | "consuming" | "failed"
  >(incomingToken || incomingHandoff ? "consuming" : "idle");
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
              ? t("login.link_invalid")
              : `${t("login.signin_failed")} (${e.status}).`,
          );
        } else {
          setConsumeError(String(e));
        }
        setConsumeState("failed");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Google sign-in returns here: ?handoff=… → swap for a session;
  // ?auth_error=… → show a generic error on the form.
  useEffect(() => {
    if (authErrorParam) {
      setError(t("login.google_error"));
      return;
    }
    if (!incomingHandoff) return;
    (async () => {
      try {
        const pair = await exchangeGoogleHandoff(incomingHandoff);
        setTokens(pair);
        try {
          const me = await fetchMe();
          identify(me.user_id, me.email, me.tenant.id);
          captureEvent("ui.login_succeeded", { method: "google" });
        } catch {
          // identity hydration is best-effort
        }
        router.push("/app");
      } catch (e) {
        setConsumeError(
          e instanceof ApiError && e.status === 410
            ? t("login.google_error")
            : `${t("login.signin_failed")}.`,
        );
        setConsumeState("failed");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onRequestCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    captureEvent("ui.signin_requested", { email_length: email.length });
    try {
      await requestEmailCode(email, locale);
      setCodeSent(true);
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.status === 429) {
          setError(t("login.rate_limited"));
        } else if (e.status === 503) {
          setError(t("login.email_down"));
        } else {
          setError(`${t("login.signin_failed")} (${e.status}).`);
        }
      } else {
        setError(String(e));
      }
    } finally {
      setPending(false);
    }
  }

  async function onVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setVerifying(true);
    captureEvent("ui.email_code_verify", { email_length: email.length });
    try {
      const pair = await verifyEmailCode(email, code.trim());
      setTokens(pair);
      try {
        const me = await fetchMe();
        identify(me.user_id, me.email, me.tenant.id);
        captureEvent("ui.login_succeeded", { method: "email_code" });
      } catch {
        // identity hydration is best-effort
      }
      router.push("/app");
    } catch (e) {
      if (e instanceof ApiError) {
        setError(
          e.status === 410
            ? t("login.code_invalid")
            : e.status === 429
              ? t("login.rate_limited")
              : `${t("login.signin_failed")} (${e.status}).`,
        );
      } else {
        setError(String(e));
      }
    } finally {
      setVerifying(false);
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
          setError(t("login.dev_disabled"));
        } else if (e.status === 429) {
          setError(t("login.rate_limited"));
        } else {
          setError(`${t("login.signin_failed")} (${e.status}).`);
        }
      } else {
        setError(String(e));
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="max-w-md mx-auto px-6 py-12 font-sans text-text">
      <div className="flex items-start justify-between mb-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("app.brand")}
        </h1>
        <LanguageSwitcher />
      </div>
      <p className="text-sm text-zinc-500 mb-8">{t("app.tagline")}</p>

      {/* Magic-link consume state */}
      {consumeState === "consuming" && (
        <div className="rounded-lg border border-border bg-surface p-5 text-sm">
          <div className="flex items-center gap-2">
            <span
              className="inline-block w-3 h-3 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin"
              aria-hidden
            />
            {t("login.signing_in")}
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
          {codeSent ? (
            <form onSubmit={onVerifyCode} className="space-y-3">
              <div className="rounded-lg border border-border bg-surface-2 p-3 text-sm text-text-muted">
                {t("login.code_sent_to")}{" "}
                <span className="font-medium text-text">{email}</span>
              </div>
              <label className="block">
                <span className="text-sm text-text-muted">
                  {t("login.code_label")}
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  autoFocus
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder={t("login.code_placeholder")}
                  className="mt-1 w-full px-3 py-2 rounded-md border border-border bg-surface text-sm tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-700"
                />
              </label>
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              )}
              <button
                type="submit"
                disabled={verifying || !code}
                className="w-full px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {verifying ? t("login.verifying") : t("login.verify")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setCodeSent(false);
                  setCode("");
                  setError(null);
                }}
                className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 underline"
              >
                {t("login.use_different_email")}
              </button>
            </form>
          ) : (
            <form onSubmit={onRequestCode} className="space-y-3">
              {/* Continue with Google — full-page nav to the backend, which
                  redirects to Google's consent screen. */}
              <a
                href={googleSignInUrl()}
                className="flex w-full items-center justify-center gap-2 rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-text hover:bg-surface-2 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden>
                  <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.49h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.63Z" />
                  <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z" />
                  <path fill="#FBBC05" d="M3.97 10.72a5.41 5.41 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33Z" />
                  <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z" />
                </svg>
                {t("login.google_button")}
              </a>

              <div className="flex items-center gap-3 py-1">
                <span className="h-px flex-1 bg-border" />
                <span className="text-xs text-zinc-400">{t("login.or")}</span>
                <span className="h-px flex-1 bg-border" />
              </div>

              <label className="block">
                <span className="text-sm text-text-muted">
                  {t("login.email_label")}
                </span>
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-md border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-700"
                  placeholder={t("login.email_placeholder")}
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
                className="w-full px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {pending ? t("login.sending") : t("login.submit_code")}
              </button>

              <p className="text-xs text-zinc-500 leading-relaxed pt-2">
                {t("login.no_password_code")}
              </p>
            </form>
          )}

          {/* Consent — applies to every sign-in method (Google + code). */}
          <p className="mt-5 text-center text-xs leading-relaxed text-zinc-400">
            {t("login.consent_prefix")}{" "}
            <a
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              {t("login.consent_terms")}
            </a>{" "}
            {t("login.consent_and")}{" "}
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              {t("login.consent_privacy")}
            </a>
            .
          </p>
        </>
      )}

      {/* Dev-login drawer */}
      <div className="mt-12 pt-6 border-t border-border">
        <button
          type="button"
          onClick={() => setDevOpen((o) => !o)}
          className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
        >
          {devOpen ? t("login.dev_toggle_hide") : t("login.dev_toggle_show")}
        </button>
        {devOpen && (
          <form onSubmit={onDevSubmit} className="mt-3 space-y-2">
            <p className="text-xs text-zinc-500">{t("login.dev_explainer")}</p>
            <input
              type="email"
              value={devEmail}
              onChange={(e) => setDevEmail(e.target.value)}
              placeholder={t("login.email_placeholder")}
              className="w-full px-3 py-1.5 rounded-md border border-border bg-surface text-xs focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-700"
            />
            <button
              type="submit"
              disabled={pending || !devEmail}
              className="text-xs px-3 py-1.5 rounded-md border border-border text-text hover:bg-surface-2 disabled:opacity-50 transition-colors"
            >
              {pending ? t("login.dev_signing_in") : t("login.dev_submit")}
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
