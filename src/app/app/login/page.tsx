"use client";

// Sign-in — passwordless, full-screen (NO app shell), restyled 1:1 to
// design-export/PennedlyDesign/login-* (per Login-SPEC.html): a centred card on
// a soft radial stage, a globe language switch top-right, and a bottom dev
// drawer. State machine view = email → code → signing; three errors (rate-limit,
// invalid-code with SHAKE, google-failed) overlay email/code. The real email-code
// / Google-handoff / magic-link / dev-login APIs back the live flow; the tester
// ?demo=1 panel drives every view + error on mock data (no backend).

import { Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  ApiError,
  consumeMagicLink,
  devLogin,
  exchangeGoogleHandoff,
  fetchMe,
  getTokens,
  googleSignInUrl,
  requestEmailCode,
  setMyLocale,
  setTokens,
  verifyEmailCode,
} from "@/lib/api";
import { invalidateAccountData } from "@/lib/account-data";
import { captureEvent, identify } from "@/lib/analytics";
import {
  LOCALES,
  setLocale,
  useLocale,
  useTranslation,
  type LocaleCode,
  type MessageKey,
} from "@/lib/i18n";
import {
  TweaksPanel,
  TweakSection,
  TweakRadio,
  TweakToggle,
  useTweaks,
} from "@/components/tweaks/TweaksPanel";
import { BrandMark, IcAlert, IcArrowRight, IcCheck, IcChevDown, IcGlobe, IcMail, IcSettings } from "@/components/icons";
import { cn } from "@/lib/cn";

type View = "email" | "code" | "signing";
type ErrKind = "None" | "Rate limit" | "Invalid code" | "Google";

const RADIAL =
  "radial-gradient(120% 75% at 50% -8%, color-mix(in srgb, var(--color-surface) 55%, transparent) 0%, transparent 58%), var(--color-bg)";
// Q20: legal pages live on app.pennedly.com — pin consent links there.
const APP_ORIGIN = "https://app.pennedly.com";
const EMAIL_RE = /\S+@\S+\.\S+/;
const VIEW_IN = { animation: "view-in var(--duration-base) var(--ease-entrance) both" } as const;
const IS_DEV = process.env.NODE_ENV === "development";
const DEV_BUILD = process.env.NEXT_PUBLIC_BUILD_HASH || "dev";

// ───────────────────────────── Language switch ──────────────────────────────
// Globe + locale code → 8-locale listbox (login.css .lang-switch), on the real
// i18n store. Matches the design's LangSwitch (not the flag-based shell one).
function LangSwitch() {
  const { t } = useTranslation();
  const current = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", h);
    document.addEventListener("keydown", k);
    return () => {
      document.removeEventListener("mousedown", h);
      document.removeEventListener("keydown", k);
    };
  }, [open]);
  const cur = LOCALES.find((l) => l.code === current) ?? LOCALES[0];
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex h-9 items-center gap-[7px] rounded-md border border-border bg-surface px-2.5 text-small font-medium text-text-muted transition-colors duration-[120ms] ease-[cubic-bezier(0.2,0.7,0.3,1)] hover:bg-surface-2 hover:text-text"
      >
        <IcGlobe size={15} />
        <span className="font-mono text-caption font-medium uppercase">{cur.code}</span>
        <IcChevDown size={14} className={cn("text-text-subtle transition-transform duration-[120ms]", open && "rotate-180")} />
      </button>
      {open && (
        <div
          role="listbox"
          aria-label={t("a11y.interface_language")}
          className="absolute right-0 top-[calc(100%+6px)] z-20 min-w-[200px] rounded-lg border border-border bg-surface p-1.5 shadow-lg"
        >
          {LOCALES.map((l) => {
            const sel = l.code === current;
            return (
              <button
                key={l.code}
                role="option"
                aria-selected={sel}
                onClick={() => {
                  setLocale(l.code as LocaleCode);
                  setOpen(false);
                  captureEvent("ui.locale_switched", { locale: l.code });
                  if (getTokens()) setMyLocale(l.code).catch(() => {});
                }}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-sm px-2.5 py-[9px] text-left text-small text-text transition-colors hover:bg-surface-2",
                  sel && "font-semibold",
                )}
              >
                <span className="w-[22px] font-mono text-caption text-text-subtle">{l.code}</span>
                <span className="flex-1">{l.name}</span>
                <IcCheck size={15} className={cn("text-text", sel ? "opacity-100" : "opacity-0")} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ───────────────────────────── Card pieces ──────────────────────────────────
function LoginHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="flex flex-col items-center text-center">
      <BrandMark size={52} radius={14} className="shadow-sm" />
      <h1 className="mt-[18px] text-h2 font-semibold tracking-[-0.012em]">{title}</h1>
      <p className="mt-[7px] max-w-[34ch] text-pretty text-small leading-[1.5] text-text-muted">{sub}</p>
    </div>
  );
}

function Alert({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <div
      role="alert"
      style={VIEW_IN}
      className="mt-[18px] flex items-start gap-2.5 rounded-md border p-[11px] px-[13px] [background:color-mix(in_srgb,var(--color-danger)_9%,var(--color-surface))] [border-color:color-mix(in_srgb,var(--color-danger)_28%,var(--color-border))]"
    >
      <IcAlert size={16} className="mt-px shrink-0 text-danger" />
      <span className="text-small leading-[1.45] [color:color-mix(in_srgb,var(--color-danger)_70%,var(--color-text))]">{text}</span>
    </div>
  );
}

function GoogleMark() {
  return (
    <span
      aria-hidden
      className="grid h-[22px] w-[22px] shrink-0 place-items-center rounded-[6px] border border-border bg-surface-2 text-[14px] font-bold leading-none text-text"
    >
      G
    </span>
  );
}

const PRIMARY_LG =
  "flex h-[46px] w-full items-center justify-center gap-2 rounded-md bg-primary px-[18px] text-body font-medium text-primary-foreground transition-[background-color,transform] duration-[180ms] ease-[cubic-bezier(0.2,0.7,0.3,1)] hover:bg-[color-mix(in_srgb,var(--color-primary)_88%,var(--color-bg))] active:translate-y-[0.5px] disabled:pointer-events-none disabled:opacity-50";
const SECONDARY_BTN =
  "inline-flex items-center justify-center gap-2.5 rounded-md border border-border bg-surface text-body font-medium text-text transition-[background-color,transform] duration-[180ms] ease-[cubic-bezier(0.2,0.7,0.3,1)] hover:bg-surface-2 active:translate-y-[0.5px] disabled:pointer-events-none disabled:opacity-50";

function Spinner() {
  return <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />;
}

// ── Email form ───────────────────────────────────────────────────────────────
function EmailForm({
  email,
  setEmail,
  onGoogle,
  onSubmit,
  busyGoogle,
  busy = false,
  error,
  t,
}: {
  email: string;
  setEmail: (v: string) => void;
  onGoogle: () => void;
  onSubmit: () => void;
  busyGoogle: boolean;
  busy?: boolean;
  error: string | null;
  t: (k: MessageKey) => string;
}) {
  const valid = EMAIL_RE.test(email.trim());
  return (
    <div style={VIEW_IN}>
      <div className="mt-[22px] flex flex-col gap-3">
        <button type="button" onClick={onGoogle} disabled={busyGoogle} className={cn(SECONDARY_BTN, "h-[46px] w-full")}>
          {busyGoogle ? (
            <>
              <Spinner /> {t("login.signing_google")}
            </>
          ) : (
            <>
              <GoogleMark /> {t("login.google_button")}
            </>
          )}
        </button>
      </div>

      <div className="my-[18px] flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-caption uppercase tracking-[0.04em] text-text-subtle">{t("login.or")}</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <form
        className="mt-1.5 flex flex-col gap-3.5"
        onSubmit={(e) => {
          e.preventDefault();
          if (valid && !busy) onSubmit();
        }}
      >
        <label className="block">
          <span className="mb-[7px] block text-small font-medium text-text">{t("login.email_label")}</span>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("login.email_placeholder")}
            className={cn(
              "h-[46px] w-full rounded-md border bg-surface px-[13px] text-body text-text outline-none transition-[border-color,box-shadow] duration-[120ms] placeholder:text-text-subtle focus:border-accent focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-accent)_18%,transparent)] max-md:text-[16px]",
              error ? "border-danger" : "border-border",
            )}
          />
        </label>
        <Alert text={error} />
        <button type="submit" disabled={!valid || busy} className={PRIMARY_LG}>
          {busy ? (
            <>
              <Spinner /> {t("login.sending")}
            </>
          ) : (
            <>
              <IcMail size={17} /> {t("login.submit_code")}
            </>
          )}
        </button>
      </form>

      <p className="mx-auto mt-5 max-w-[32ch] text-center text-caption leading-[1.5] text-text-subtle">
        {t("login.consent_prefix")}{" "}
        <a href={`${APP_ORIGIN}/terms`} target="_blank" rel="noopener noreferrer" className="underline decoration-border underline-offset-2 hover:text-text hover:decoration-text-subtle">
          {t("login.consent_terms")}
        </a>{" "}
        {t("login.consent_and")}{" "}
        <a href={`${APP_ORIGIN}/privacy`} target="_blank" rel="noopener noreferrer" className="underline decoration-border underline-offset-2 hover:text-text hover:decoration-text-subtle">
          {t("login.consent_privacy")}
        </a>
        .
      </p>
    </div>
  );
}

// ── OTP ──────────────────────────────────────────────────────────────────────
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
      className="mb-1 mt-[22px] flex justify-center gap-[9px] max-[420px]:gap-1.5"
      onPaste={handlePaste}
      style={error ? { animation: "shake 0.4s var(--ease-standard)" } : undefined}
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
            "h-14 w-[46px] rounded-md border text-center font-mono text-h2 font-medium text-text caret-accent outline-none transition-[border-color,box-shadow,background] duration-[120ms] max-[420px]:h-[50px] max-[420px]:w-10 max-[420px]:text-h3",
            error
              ? "border-danger shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-danger)_14%,transparent)]"
              : "border-border focus:border-accent focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-accent)_18%,transparent)]",
            value[i] && !error && "bg-surface-2",
          )}
        />
      ))}
    </div>
  );
}

// ── Code form ──────────────────────────────────────────────────────────────
function CodeForm({
  email,
  code,
  setCode,
  onSubmit,
  onChangeEmail,
  onResend,
  resendIn,
  error,
  busy,
  t,
}: {
  email: string;
  code: string;
  setCode: (v: string) => void;
  onSubmit: (v: string) => void;
  onChangeEmail: () => void;
  onResend: () => void;
  resendIn: number;
  error: string | null;
  busy: boolean;
  t: (k: MessageKey) => string;
}) {
  return (
    <div style={VIEW_IN}>
      <p className="m-0 text-center text-small leading-[1.5] text-text-muted">
        {t("login.code_sent_to")} <b className="font-semibold text-text">{email || "you@example.com"}</b>.{" "}
        <button type="button" onClick={onChangeEmail} className="p-0 text-small text-accent">
          {t("login.use_different_email")}
        </button>
      </p>

      <OtpInput value={code} onChange={(v) => setCode(v)} error={!!error} onComplete={onSubmit} />
      <Alert text={error} />

      <div className="mt-5 flex flex-col gap-3">
        <button type="button" onClick={() => onSubmit(code)} disabled={code.length < 6 || busy} className={PRIMARY_LG}>
          {busy ? (
            <>
              <Spinner /> {t("login.signing_in")}
            </>
          ) : (
            <>
              {t("login.verify")} <IcArrowRight size={17} />
            </>
          )}
        </button>
        <div className="flex items-center justify-center gap-1.5 text-small text-text-subtle">
          {t("login.no_code_q")}
          <button
            type="button"
            onClick={onResend}
            disabled={resendIn > 0}
            className="p-0 font-semibold text-accent disabled:cursor-default disabled:font-medium disabled:text-text-subtle"
          >
            {resendIn > 0 ? t("login.resend_in").replace("{n}", String(resendIn)) : t("login.resend")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Signing ──────────────────────────────────────────────────────────────────
function SigningIn({ text }: { text: string }) {
  return (
    <div style={VIEW_IN} className="flex flex-col items-center pb-[18px] pt-[26px] text-center">
      <span className="h-10 w-10 animate-spin rounded-full border-[2.5px] border-border border-t-text [animation-duration:0.7s]" aria-hidden />
      <span className="mt-[18px] text-body text-text-muted">{text}</span>
    </div>
  );
}

// ── Dev drawer ───────────────────────────────────────────────────────────────
function DevDrawer({
  devEmail,
  setDevEmail,
  onDevLogin,
  pending,
  t,
}: {
  devEmail: string;
  setDevEmail: (v: string) => void;
  onDevLogin: () => void;
  pending: boolean;
  t: (k: MessageKey) => string;
}) {
  const [open, setOpen] = useState(false);
  const valid = EMAIL_RE.test(devEmail.trim());
  return (
    <div className="shrink-0 border-t [background:color-mix(in_srgb,var(--color-surface)_30%,transparent)] [border-top-color:color-mix(in_srgb,var(--color-border)_50%,transparent)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-center gap-[7px] px-3 py-[9px] text-[11px] tracking-[0.04em] [color:color-mix(in_srgb,var(--color-text-subtle)_60%,transparent)] transition-colors hover:text-text-subtle"
      >
        <IcSettings size={13} className="opacity-70" /> {open ? t("login.dev_toggle_hide") : t("login.dev_toggle_show")}
        <IcChevDown size={13} className={cn("transition-transform duration-[120ms]", open && "rotate-180")} />
      </button>
      {open && (
        <div className="mx-auto flex max-w-[460px] flex-col gap-3.5 px-5 pb-[22px] pt-1.5">
          <div className="flex flex-col items-start gap-[9px]">
            <span
              className="inline-flex items-center gap-[7px] rounded-full border bg-surface py-[5px] pl-[9px] pr-[11px] text-small text-accent [border-color:color-mix(in_srgb,var(--color-accent)_30%,var(--color-border))]"
            >
              <span className="h-[7px] w-[7px] rounded-full bg-accent" /> DEV_LOGIN enabled
            </span>
            <span className="text-pretty text-caption leading-[1.5] text-text-subtle">{t("login.dev_explainer")}</span>
          </div>
          <form
            className="flex gap-2.5 max-[460px]:flex-col"
            onSubmit={(e) => {
              e.preventDefault();
              if (valid) onDevLogin();
            }}
          >
            <input
              type="email"
              inputMode="email"
              autoComplete="off"
              spellCheck={false}
              aria-label="Developer email"
              value={devEmail}
              onChange={(e) => setDevEmail(e.target.value)}
              className="h-[38px] min-w-0 flex-1 rounded-md border border-border bg-surface px-[11px] font-mono text-small text-text outline-none transition-[border-color,box-shadow] duration-[120ms] focus:border-accent focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-accent)_18%,transparent)] max-md:text-[16px]"
            />
            <button type="submit" disabled={!valid || pending} className={cn(SECONDARY_BTN, "h-[38px] shrink-0 px-3.5 text-small")}>
              {pending ? <Spinner /> : <IcArrowRight size={16} />} {pending ? t("login.dev_signing_in") : t("login.dev_submit")}
            </button>
          </form>
          <div className="flex items-center pt-0.5">
            <span className="font-mono text-[11px] text-text-subtle">build {DEV_BUILD}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Shell (top + stage + dev) ────────────────────────────────────────────────
function LoginShell({
  showDev,
  children,
  dev,
}: {
  showDev: boolean;
  children: ReactNode;
  dev: ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col text-text" style={{ background: RADIAL }}>
      <div className="flex shrink-0 items-center justify-end px-5 py-[18px]">
        <LangSwitch />
      </div>
      <div className="flex flex-1 items-center justify-center px-6 pb-10 pt-2">
        <div className="w-full max-w-[408px] rounded-2xl border border-border bg-surface px-8 pb-[26px] pt-8 shadow-lg max-[460px]:rounded-xl max-[460px]:px-5 max-[460px]:pb-[22px] max-[460px]:pt-[26px]">
          {children}
        </div>
      </div>
      {showDev && dev}
    </div>
  );
}

function headFor(view: View, t: (k: MessageKey) => string): { title: string; sub: string } {
  if (view === "signing") return { title: t("login.signing_title"), sub: t("login.signing_sub") };
  if (view === "code") return { title: t("login.code_title"), sub: t("login.code_sub") };
  return { title: t("login.email_title"), sub: t("login.email_sub") };
}

// ════════════════════════════════ Live flow ═════════════════════════════════
function LoginPageInner() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const searchParams = useSearchParams();
  const incomingToken = searchParams.get("token");
  const incomingHandoff = searchParams.get("handoff");
  const authErrorParam = searchParams.get("auth_error");

  const [tw, setTw] = useTweaks<LoginTweaks>(LOGIN_TWEAKS);
  const [tester, setTester] = useState(false);

  const [view, setView] = useState<View>(incomingToken || incomingHandoff ? "signing" : "email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busyGoogle, setBusyGoogle] = useState(false);
  const [pending, setPending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const [devEmail, setDevEmail] = useState("");
  const [signingText, setSigningText] = useState<string>("");
  const cdRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!getTokens()) return;
    fetchMe().then((m) => setTester(m.is_tester)).catch(() => {});
  }, []);
  useEffect(() => {
    if (tw.demo) document.documentElement.classList.toggle("dark", !!tw.dark);
  }, [tw.demo, tw.dark]);
  useEffect(() => {
    try {
      if (new URLSearchParams(window.location.search).get("demo") === "1") setTw("demo", true);
    } catch {
      /* no-op */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // SECURITY: the magic-link token / OAuth handoff ride the URL. Strip them
  // from the address bar on mount (the values are already captured in the
  // consts above) so they never reach analytics ($current_url) or the Referer.
  useEffect(() => {
    if (incomingToken || incomingHandoff) {
      window.history.replaceState(null, "", "/app/login");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Magic-link consume on mount when ?token=… is present.
  useEffect(() => {
    if (!incomingToken) return;
    setSigningText(t("login.signing_in"));
    (async () => {
      try {
        const pair = await consumeMagicLink(incomingToken);
        setTokens(pair);
        invalidateAccountData(); // wipe any prior user's cached account data
        try {
          const me = await fetchMe();
          identify(me.user_id, me.tenant.id);
          captureEvent("ui.login_succeeded", { method: "magic_link" });
        } catch {
          /* best-effort */
        }
        router.push("/app");
      } catch (e) {
        setError(e instanceof ApiError && e.status === 410 ? t("login.link_invalid") : t("login.signin_failed"));
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
    setSigningText(t("login.signing_google"));
    (async () => {
      try {
        const pair = await exchangeGoogleHandoff(incomingHandoff);
        setTokens(pair);
        invalidateAccountData(); // wipe any prior user's cached account data
        try {
          const me = await fetchMe();
          identify(me.user_id, me.tenant.id);
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

  function onGoogle() {
    setError(null);
    setBusyGoogle(true);
    captureEvent("ui.google_signin_clicked", {});
    window.location.href = googleSignInUrl();
  }

  async function onRequestCode() {
    if (pending) return; // in-flight guard — a 2nd click would email a 2nd code
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
    setSigningText(t("login.signing_in"));
    setView("signing");
    captureEvent("ui.email_code_verify", { email_length: email.length });
    try {
      const pair = await verifyEmailCode(email, value.trim());
      setTokens(pair);
      invalidateAccountData(); // wipe any prior user's cached account data
      try {
        const me = await fetchMe();
        identify(me.user_id, me.tenant.id);
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
    if (resendIn > 0 || pending) return; // in-flight guard — a 2nd click would email a 2nd code
    setError(null);
    setPending(true);
    captureEvent("ui.signin_requested", { email_length: email.length, resend: true });
    try {
      await requestEmailCode(email, locale);
      startCooldown();
    } catch {
      setError(t("login.signin_failed"));
    } finally {
      setPending(false);
    }
  }

  async function onDevLogin() {
    setError(null);
    setPending(true);
    try {
      const pair = await devLogin(devEmail);
      setTokens(pair);
      invalidateAccountData(); // wipe any prior user's cached account data
      try {
        const me = await fetchMe();
        identify(me.user_id, me.tenant.id);
      } catch {
        /* best-effort */
      }
      router.push("/app");
    } catch (e) {
      setError(e instanceof ApiError && e.status === 404 ? t("login.dev_disabled") : t("login.signin_failed"));
    } finally {
      setPending(false);
    }
  }

  const allow = tester || IS_DEV;
  if (allow && tw.demo) {
    return (
      <>
        <LoginDemo tw={tw} />
        <LoginTweaks tw={tw} setTw={setTw} />
      </>
    );
  }

  const head = headFor(view, t);
  return (
    <>
      <LoginShell
        showDev={IS_DEV}
        dev={<DevDrawer devEmail={devEmail} setDevEmail={setDevEmail} onDevLogin={onDevLogin} pending={pending} t={t} />}
      >
        <LoginHeader title={head.title} sub={head.sub} />
        {view === "signing" ? (
          <SigningIn text={signingText || t("login.signing_in")} />
        ) : view === "email" ? (
          <EmailForm
            email={email}
            setEmail={setEmail}
            onGoogle={onGoogle}
            onSubmit={onRequestCode}
            busyGoogle={busyGoogle}
            busy={pending}
            error={error}
            t={t}
          />
        ) : (
          <CodeForm
            email={email}
            code={code}
            setCode={(v) => {
              setCode(v);
              if (error) setError(null);
            }}
            onSubmit={onVerify}
            onChangeEmail={() => {
              setView("email");
              setCode("");
              setError(null);
            }}
            onResend={onResend}
            resendIn={resendIn}
            error={error}
            busy={verifying}
            t={t}
          />
        )}
      </LoginShell>
      {allow && <LoginTweaks tw={tw} setTw={setTw} />}
    </>
  );
}

// ════════════════════════════════ Demo (tester) ═════════════════════════════
type LoginTweaks = { demo: boolean; screen: string; error: ErrKind; dark: boolean };
const LOGIN_TWEAKS: LoginTweaks = { demo: false, screen: "Email", error: "None", dark: false };
const SCREEN_TO_VIEW: Record<string, View> = { Email: "email", Code: "code", "Signing in": "signing" };

function LoginDemo({ tw }: { tw: LoginTweaks }) {
  const { t } = useTranslation();
  const [view, setView] = useState<View>(SCREEN_TO_VIEW[tw.screen] ?? "email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busyGoogle, setBusyGoogle] = useState(false);
  const [busyCode, setBusyCode] = useState(false);
  const [signingText, setSigningText] = useState(t("login.signing_in"));
  const [resendIn, setResendIn] = useState(0);
  const [devEmail, setDevEmail] = useState("dev@pennedly.test");
  const cdRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  useEffect(() => () => {
    if (cdRef.current) clearInterval(cdRef.current);
    if (timer.current) clearTimeout(timer.current);
  }, []);

  // View tweak → jump to a view (start cooldown on code).
  useEffect(() => {
    const v = SCREEN_TO_VIEW[tw.screen] ?? "email";
    setView(v);
    if (v === "signing") setSigningText(t("login.signing_in"));
    if (v === "code" && resendIn === 0) startCooldown();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tw.screen]);

  // Error tweak → overlay the matching error on the matching view.
  useEffect(() => {
    if (tw.error === "None") {
      setError(null);
      return;
    }
    if (tw.error === "Invalid code") {
      setView("code");
      setCode("739104");
      setError(t("login.code_invalid"));
    } else if (tw.error === "Rate limit") {
      setView("email");
      setError(t("login.rate_limited"));
    } else if (tw.error === "Google") {
      setView("email");
      setError(t("login.google_error"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tw.error]);

  function onGoogle() {
    setError(null);
    setBusyGoogle(true);
    timer.current = setTimeout(() => {
      setBusyGoogle(false);
      setSigningText(t("login.signing_google"));
      setView("signing");
    }, 700);
  }
  function requestCode() {
    setError(null);
    setCode("");
    setView("code");
    startCooldown();
  }
  function verifyCode(v: string) {
    if (v.length < 6) return;
    setBusyCode(true);
    timer.current = setTimeout(() => {
      setBusyCode(false);
      setSigningText(t("login.signing_in"));
      setView("signing");
    }, 1000);
  }

  const head = headFor(view, t);
  return (
    <LoginShell
      showDev
      dev={<DevDrawer devEmail={devEmail} setDevEmail={setDevEmail} onDevLogin={() => { setSigningText(t("login.signing_in")); setView("signing"); }} pending={false} t={t} />}
    >
      <LoginHeader title={head.title} sub={head.sub} />
      {view === "signing" ? (
        <SigningIn text={signingText} />
      ) : view === "email" ? (
        <EmailForm email={email} setEmail={setEmail} onGoogle={onGoogle} onSubmit={requestCode} busyGoogle={busyGoogle} error={error} t={t} />
      ) : (
        <CodeForm
          email={email}
          code={code}
          setCode={(v) => {
            setCode(v);
            if (error) setError(null);
          }}
          onSubmit={verifyCode}
          onChangeEmail={() => {
            setView("email");
            setCode("");
            setError(null);
          }}
          onResend={() => {
            setError(null);
            startCooldown();
          }}
          resendIn={resendIn}
          error={error}
          busy={busyCode}
          t={t}
        />
      )}
    </LoginShell>
  );
}

function LoginTweaks({ tw, setTw }: { tw: LoginTweaks; setTw: (k: keyof LoginTweaks, v: LoginTweaks[keyof LoginTweaks]) => void }) {
  return (
    <TweaksPanel title="Login">
      <TweakSection label="Demo" />
      <TweakToggle label="Mock data" value={tw.demo} onChange={(v) => setTw("demo", v)} />
      <TweakSection label="Screen" />
      <TweakRadio label="View" value={tw.screen} options={["Email", "Code", "Signing in"]} onChange={(v) => { setTw("screen", v); setTw("error", "None"); }} />
      <TweakSection label="Error state" />
      <TweakRadio label="Show" value={tw.error} options={["None", "Rate limit", "Invalid code", "Google"]} onChange={(v) => setTw("error", v as ErrKind)} />
      <TweakSection label="Appearance" />
      <TweakToggle label="Dark mode" value={tw.dark} onChange={(v) => setTw("dark", v)} />
    </TweaksPanel>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}
