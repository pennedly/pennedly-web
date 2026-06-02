"use client";

// Sign-in — passwordless. Centered card on a soft radial stage, per
// design-export/PennedlyDesign/login-* : Google → OR → email → a 6-cell OTP
// code → a brief "signing in" state. Magic-link (?token) and Google handoff
// (?handoff) are still consumed on mount; the dev-login drawer is hidden.
// Frontend restyle — the email-code / Google / magic-link APIs back it.

import { Suspense, useEffect, useRef, useState } from "react";
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
import { useTranslation, type MessageKey } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Button, buttonClasses } from "@/components/ui/button";
import { BrandMark, IcAlert, IcArrowRight, IcMail, IcSettings } from "@/components/icons";
import { cn } from "@/lib/cn";

const RADIAL =
  "radial-gradient(120% 75% at 50% -8%, color-mix(in srgb, var(--color-surface) 55%, transparent) 0%, transparent 58%), var(--color-bg)";

// Q20: pennedly.com is a separate marketing site; the app + its legal pages
// live on app.pennedly.com. Pin the consent links to that canonical origin so
// they never 404 even if the login card is ever reached cross-domain.
const APP_ORIGIN = "https://app.pennedly.com";

function Alert({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <div className="mt-3 flex items-start gap-2 rounded-md border border-danger/30 bg-danger/[0.08] px-3 py-2.5" role="alert">
      <IcAlert size={16} className="mt-px shrink-0 text-danger" />
      <span className="text-small leading-snug text-danger">{text}</span>
    </div>
  );
}

function OtpInput({
  value,
  onChange,
  error,
  onComplete,
}: {
  value: string;
  onChange: (v: string) => void;
  error: boolean;
  onComplete: (v: string) => void;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  function setDigit(i: number, d: string): string {
    const next = value.split("");
    next[i] = d;
    const joined = next.join("").slice(0, 6);
    onChange(joined);
    return joined;
  }
  function handleChange(i: number, raw: string) {
    const d = (raw.match(/\d/g) || []).join("");
    if (!d) {
      setDigit(i, "");
      return;
    }
    if (d.length > 1) {
      const joined = (value.slice(0, i) + d).slice(0, 6);
      onChange(joined);
      requestAnimationFrame(() => refs.current[Math.min(joined.length, 5)]?.focus());
      if (joined.length === 6) onComplete(joined);
      return;
    }
    const joined = setDigit(i, d);
    if (i < 5) refs.current[i + 1]?.focus();
    if (joined.length === 6 && !joined.includes("")) onComplete(joined);
  }
  function handleKey(i: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace") {
      if (value[i]) setDigit(i, "");
      else if (i > 0) {
        refs.current[i - 1]?.focus();
        setDigit(i - 1, "");
      }
    } else if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
    else if (e.key === "ArrowRight" && i < 5) refs.current[i + 1]?.focus();
  }
  function handlePaste(e: React.ClipboardEvent) {
    const d = (e.clipboardData.getData("text").match(/\d/g) || []).join("").slice(0, 6);
    if (!d) return;
    e.preventDefault();
    onChange(d);
    requestAnimationFrame(() => refs.current[Math.min(d.length, 5)]?.focus());
    if (d.length === 6) onComplete(d);
  }
  return (
    <div
      className="mt-1 flex justify-center gap-2.5"
      onPaste={handlePaste}
      style={error ? { animation: "shake 0.35s var(--ease-standard)" } : undefined}
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          inputMode="numeric"
          maxLength={1}
          aria-label={`Digit ${i + 1}`}
          autoFocus={i === 0}
          value={value[i] || ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKey(i, e)}
          className={cn(
            "h-14 w-11 rounded-md border text-center text-h3 font-semibold tabular-nums text-text outline-none transition-colors focus:border-accent",
            error ? "border-danger" : value[i] ? "border-border bg-surface-2" : "border-border bg-surface",
          )}
        />
      ))}
    </div>
  );
}

function LoginPageInner() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const searchParams = useSearchParams();
  const incomingToken = searchParams.get("token");
  const incomingHandoff = searchParams.get("handoff");
  const authErrorParam = searchParams.get("auth_error");

  const [view, setView] = useState<"email" | "code" | "signing">(
    incomingToken || incomingHandoff ? "signing" : "email",
  );
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const [devOpen, setDevOpen] = useState(false);
  const [devEmail, setDevEmail] = useState("");
  const cdRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function startCooldown() {
    setResendIn(30);
    if (cdRef.current) clearInterval(cdRef.current);
    cdRef.current = setInterval(() => {
      setResendIn((s) => {
        if (s <= 1) {
          if (cdRef.current) clearInterval(cdRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }
  useEffect(() => () => void (cdRef.current && clearInterval(cdRef.current)), []);

  // Magic-link consume on mount when ?token=… is present.
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
          /* best-effort */
        }
        router.push("/app");
      } catch (e) {
        setError(
          e instanceof ApiError && e.status === 410 ? t("login.link_invalid") : t("login.signin_failed"),
        );
        setView("email");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Google sign-in returns here: ?handoff=… → session; ?auth_error=… → error.
  useEffect(() => {
    if (authErrorParam) {
      setError(t("login.google_error"));
      setView("email");
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
          /* best-effort */
        }
        router.push("/app");
      } catch {
        setError(t("login.signin_failed"));
        setView("email");
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
      setCode("");
      setView("code");
      startCooldown();
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.status === 429
            ? t("login.rate_limited")
            : e.status === 503
              ? t("login.email_down")
              : `${t("login.signin_failed")} (${e.status}).`
          : String(e),
      );
    } finally {
      setPending(false);
    }
  }

  async function onVerify(value: string) {
    if (value.length < 6 || verifying) return;
    setError(null);
    setVerifying(true);
    setView("signing");
    captureEvent("ui.email_code_verify", { email_length: email.length });
    try {
      const pair = await verifyEmailCode(email, value.trim());
      setTokens(pair);
      try {
        const me = await fetchMe();
        identify(me.user_id, me.email, me.tenant.id);
        captureEvent("ui.login_succeeded", { method: "email_code" });
      } catch {
        /* best-effort */
      }
      router.push("/app");
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.status === 410
            ? t("login.code_invalid")
            : e.status === 429
              ? t("login.rate_limited")
              : `${t("login.signin_failed")} (${e.status}).`
          : String(e),
      );
      setView("code");
      setVerifying(false);
    }
  }

  async function onResend() {
    if (resendIn > 0) return;
    setError(null);
    captureEvent("ui.signin_requested", { email_length: email.length, resend: true });
    try {
      await requestEmailCode(email, locale);
      startCooldown();
    } catch {
      setError(t("login.signin_failed"));
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
      } catch {
        /* best-effort */
      }
      router.push("/app");
    } catch (e) {
      setError(
        e instanceof ApiError && e.status === 404 ? t("login.dev_disabled") : t("login.signin_failed"),
      );
    } finally {
      setPending(false);
    }
  }

  const head: { title: MessageKey; sub: MessageKey } =
    view === "signing"
      ? { title: "login.signing_title", sub: "login.signing_sub" }
      : view === "code"
        ? { title: "login.code_title", sub: "login.code_sub" }
        : { title: "login.email_title", sub: "login.email_sub" };

  return (
    <div className="flex min-h-screen flex-col text-text" style={{ background: RADIAL }}>
      <div className="flex justify-end p-5">
        <LanguageSwitcher />
      </div>

      <div className="flex flex-1 items-start justify-center px-5 pb-12 pt-2">
        <div className="w-full max-w-[400px] rounded-2xl border border-border bg-surface p-7 shadow-md">
          <div className="flex flex-col items-center text-center">
            <BrandMark size={52} radius={14} className="shadow-sm" />
            <h1 className="mt-4 text-h2 font-semibold tracking-tight">{t(head.title)}</h1>
            <p className="mt-1.5 text-small text-text-muted">{t(head.sub)}</p>
          </div>

          {view === "signing" ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <span className="inline-block h-7 w-7 animate-spin rounded-full border-2 border-accent border-t-transparent" aria-hidden />
              <span className="text-small text-text-muted">{t("login.signing_in")}</span>
            </div>
          ) : view === "email" ? (
            <div className="mt-6">
              <a
                href={googleSignInUrl()}
                className={buttonClasses({ variant: "secondary", className: "w-full" })}
              >
                <span className="grid h-[22px] w-[22px] place-items-center rounded-sm border border-border bg-surface-2 text-small font-bold leading-none text-text">
                  G
                </span>
                {t("login.google_button")}
              </a>

              <div className="my-[18px] flex items-center gap-3">
                <span className="h-px flex-1 bg-border" />
                <span className="text-caption uppercase tracking-wide text-text-subtle">{t("login.or")}</span>
                <span className="h-px flex-1 bg-border" />
              </div>

              <form onSubmit={onRequestCode}>
                <label className="block">
                  <span className="text-small text-text-muted">{t("login.email_label")}</span>
                  <input
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("login.email_placeholder")}
                    className={cn(
                      "mt-1 h-10 w-full rounded-md border bg-surface px-3 text-small text-text outline-none focus:border-accent",
                      error ? "border-danger" : "border-border",
                    )}
                  />
                </label>
                <Alert text={error} />
                <Button
                  type="submit"
                  variant="primary"
                  className="mt-3 w-full"
                  loading={pending}
                  disabled={pending || !email}
                  icon={<IcMail size={17} />}
                >
                  {pending ? t("login.sending") : t("login.submit_code")}
                </Button>
              </form>

              <p className="mt-5 text-center text-caption leading-relaxed text-text-subtle">
                {t("login.consent_prefix")}{" "}
                <a href={`${APP_ORIGIN}/terms`} target="_blank" rel="noopener noreferrer" className="underline hover:text-text">
                  {t("login.consent_terms")}
                </a>{" "}
                {t("login.consent_and")}{" "}
                <a href={`${APP_ORIGIN}/privacy`} target="_blank" rel="noopener noreferrer" className="underline hover:text-text">
                  {t("login.consent_privacy")}
                </a>
                .
              </p>
            </div>
          ) : (
            <div className="mt-6">
              <p className="text-center text-small text-text-muted">
                {t("login.code_sent_to")} <b className="text-text">{email}</b>.{" "}
                <button
                  onClick={() => {
                    setView("email");
                    setCode("");
                    setError(null);
                  }}
                  className="text-accent underline-offset-2 hover:underline"
                >
                  {t("login.use_different_email")}
                </button>
              </p>

              <OtpInput value={code} onChange={(v) => { setCode(v); if (error) setError(null); }} error={!!error} onComplete={onVerify} />
              <Alert text={error} />

              <Button
                variant="primary"
                className="mt-4 w-full"
                onClick={() => onVerify(code)}
                loading={verifying}
                disabled={code.length < 6 || verifying}
              >
                {t("login.verify")}
                <IcArrowRight size={17} />
              </Button>
              <div className="mt-3 text-center text-caption text-text-subtle">
                {t("login.no_code_q")}{" "}
                <button onClick={onResend} disabled={resendIn > 0} className="text-accent underline-offset-2 hover:underline disabled:text-text-subtle disabled:no-underline">
                  {resendIn > 0 ? t("login.resend_in").replace("{n}", String(resendIn)) : t("login.resend")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dev-login drawer (hidden) */}
      <div className="mx-auto w-full max-w-[400px] px-5 pb-8">
        <button
          type="button"
          onClick={() => setDevOpen((o) => !o)}
          className="inline-flex items-center gap-1.5 text-caption text-text-subtle transition-colors hover:text-text-muted"
        >
          <IcSettings size={13} />
          {devOpen ? t("login.dev_toggle_hide") : t("login.dev_toggle_show")}
        </button>
        {devOpen && (
          <form onSubmit={onDevSubmit} className="mt-3 space-y-2 rounded-md border border-border bg-surface p-3">
            <p className="text-caption text-text-subtle">{t("login.dev_explainer")}</p>
            <input
              type="email"
              value={devEmail}
              onChange={(e) => setDevEmail(e.target.value)}
              placeholder={t("login.email_placeholder")}
              className="h-9 w-full rounded-md border border-border bg-surface px-3 text-small text-text outline-none focus:border-accent"
            />
            <Button type="submit" size="sm" variant="secondary" loading={pending} disabled={pending || !devEmail}>
              {pending ? t("login.dev_signing_in") : t("login.dev_submit")}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}
