// PostHog client wrapper for the browser.
// Init happens once on app boot (via PostHogProvider in layout). After
// that, components import { posthog, identify, captureEvent } and call
// them directly. Empty NEXT_PUBLIC_POSTHOG_KEY = no-op so local dev
// without analytics keys still works.

import posthog from "posthog-js";

let _initialized = false;
// Events captured before init, replayed the moment it lands.
//
// React commits child effects BEFORE parent ones, so anything a page fires from
// its own mount effect runs while AnalyticsProvider (the parent) still hasn't
// called initAnalytics() — `landing.viewed`, the head of the funnel, was
// dropped every single time. Buffering costs nothing and makes the ordering
// stop mattering. Consent is untouched: the replay goes through posthog.capture
// exactly like a live call, so an opted-out visitor still sends nothing.
const _pending: { event: string; properties: Record<string, unknown> }[] = [];
const PENDING_CAP = 20; // no key configured → init never lands → don't grow forever
const CONSENT_KEY = "pennedly.consent"; // "accepted" | "declined"
// localStorage is per-ORIGIN, so a choice made on pennedly.com never reached
// app.pennedly.com (and vice versa) — the banner re-asked on every subdomain.
// The cookie carries the choice across *.pennedly.com; localStorage stays as
// the fallback for origins where a domain cookie can't apply (localhost).
const CONSENT_COOKIE = "pennedly_consent";
const CONSENT_MAX_AGE = 60 * 60 * 24 * 365; // re-ask after a year (GDPR-friendly)

function consentCookieDomain(): string {
  const host = window.location.hostname;
  return host === "pennedly.com" || host.endsWith(".pennedly.com")
    ? "; Domain=.pennedly.com"
    : "";
}

function readConsentCookie(): "accepted" | "declined" | null {
  const m = document.cookie.match(/(?:^|;\s*)pennedly_consent=(accepted|declined)(?:;|$)/);
  return m ? (m[1] as "accepted" | "declined") : null;
}

function writeConsent(value: "accepted" | "declined"): void {
  window.localStorage.setItem(CONSENT_KEY, value);
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CONSENT_COOKIE}=${value}; Max-Age=${CONSENT_MAX_AGE}; Path=/${consentCookieDomain()}; SameSite=Lax${secure}`;
}

/** The user's stored analytics-consent choice, or null if undecided. */
export function analyticsConsent(): "accepted" | "declined" | null {
  if (typeof window === "undefined") return null;
  const fromCookie = readConsentCookie();
  if (fromCookie) return fromCookie;
  const v = window.localStorage.getItem(CONSENT_KEY);
  if (v === "accepted" || v === "declined") {
    // Migrate a pre-cookie choice so the OTHER subdomain stops re-asking too.
    writeConsent(v);
    return v;
  }
  return null;
}

// Strip auth secrets that can ride a URL (magic-link token / OAuth handoff /
// code) so they never reach the analytics store via $current_url / $referrer.
function scrubUrl(value: unknown): unknown {
  return typeof value === "string"
    ? value.replace(/([?&](?:token|handoff|code)=)[^&#]*/gi, "$1[redacted]")
    : value;
}

export function initAnalytics(): void {
  if (_initialized) return;
  if (typeof window === "undefined") return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host =
    process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";
  if (!key) {
    console.info("[analytics] disabled — NEXT_PUBLIC_POSTHOG_KEY missing");
    return;
  }
  posthog.init(key, {
    api_host: host,
    capture_pageview: true,
    capture_pageleave: true,
    disable_session_recording: true,
    // No autocapture — it can incidentally ingest draft text / @handles from
    // the DOM. We send an explicit, PII-clean event taxonomy instead.
    autocapture: false,
    persistence: "localStorage+cookie",
    // GDPR / ePrivacy: load the library but capture + persist NOTHING until the
    // user grants consent (the cookie banner calls grantAnalyticsConsent()).
    opt_out_capturing_by_default: true,
    opt_out_persistence_by_default: true,
    // Never let an auth secret that rode the URL land in the analytics store.
    sanitize_properties: (props) => {
      if (props.$current_url) props.$current_url = scrubUrl(props.$current_url);
      if (props.$referrer) props.$referrer = scrubUrl(props.$referrer);
      return props;
    },
  });
  _initialized = true;
  // Honor a prior "accepted" decision across reloads. Before the replay, so a
  // returning visitor's buffered events actually go out.
  if (analyticsConsent() === "accepted") posthog.opt_in_capturing();
  for (const { event, properties } of _pending.splice(0)) {
    posthog.capture(event, properties);
  }
}

/** Cookie-banner "Accept": start capturing + remember the choice. */
export function grantAnalyticsConsent(): void {
  if (typeof window === "undefined") return;
  writeConsent("accepted");
  if (_initialized) posthog.opt_in_capturing();
}

/** Cookie-banner "Decline": stay opted out + remember the choice. */
export function declineAnalyticsConsent(): void {
  if (typeof window === "undefined") return;
  writeConsent("declined");
  if (_initialized) posthog.opt_out_capturing();
}

export function identify(userId: number, tenantId: number): void {
  if (typeof window === "undefined") return;
  if (!_initialized) return;
  // Identify by an opaque id only — no raw email to the analytics store (GDPR
  // data-minimization; the email↔id map stays in our DB).
  posthog.identify(`user:${userId}`, { tenant_id: tenantId });
  posthog.group("tenant", String(tenantId));
}

export function resetIdentity(): void {
  if (typeof window === "undefined") return;
  if (!_initialized) return;
  posthog.reset();
}

export function captureEvent(
  event: string,
  properties: Record<string, unknown> = {}
): void {
  if (typeof window === "undefined") return;
  if (!_initialized) {
    if (_pending.length < PENDING_CAP) _pending.push({ event, properties });
    return;
  }
  posthog.capture(event, properties);
}
