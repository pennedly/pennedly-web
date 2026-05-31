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
  requestEmailCode,
  requestMagicLink,
  setTokens,
  verifyEmailCode,
} from "@/lib/api";
import { captureEvent, identify } from "@/lib/analytics";
import { useTranslation } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

function LoginPageInner() {
  const router = useRouter();
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const incomingToken = searchParams.get("token");

  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  // Sign-in method: a typed 6-digit code (default) or a clicked link.
  const [method, setMethod] = useState<"link" | "code">("code");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [verifying, setVerifying] = useState(false);

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

  async function onEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    captureEvent("ui.signin_requested", {
      method,
      email_length: email.length,
    });
    try {
      if (method === "code") {
        await requestEmailCode(email);
        setCodeSent(true);
      } else {
        await requestMagicLink(email);
        setSent(true);
      }
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
          setError("dev-login is disabled on the backend.");
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
          {sent ? (
            <div className="rounded-xl border border-green-300 dark:border-green-900/60 bg-green-50 dark:bg-green-950/30 p-5 space-y-3">
              <h2 className="text-base font-semibold text-green-900 dark:text-green-200">
                {t("login.sent_title")}
              </h2>
              <p className="text-sm text-green-800 dark:text-green-200">
                {t("login.sent_to")}{" "}
                <span className="font-medium">{email}</span>.{" "}
                {t("login.sent_validity")}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSent(false);
                  setError(null);
                }}
                className="text-xs text-green-800 dark:text-green-300 underline hover:text-green-900 dark:hover:text-green-200"
              >
                {t("login.use_different_email")}
              </button>
            </div>
          ) : codeSent ? (
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
            <form onSubmit={onEmailSubmit} className="space-y-3">
              {/* Method selector — prominent so the choice is unmissable. */}
              <div className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-surface-2 p-1">
                {(["code", "link"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setMethod(m);
                      setError(null);
                    }}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                      method === m
                        ? "bg-primary text-primary-foreground"
                        : "text-text-muted hover:text-text"
                    }`}
                  >
                    {m === "code" ? t("login.tab_code") : t("login.tab_link")}
                  </button>
                ))}
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
                {pending
                  ? t("login.sending")
                  : method === "code"
                    ? t("login.submit_code")
                    : t("login.submit")}
              </button>

              <p className="text-xs text-zinc-500 leading-relaxed pt-2">
                {method === "code"
                  ? t("login.no_password_code")
                  : t("login.no_password")}
              </p>
            </form>
          )}
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
