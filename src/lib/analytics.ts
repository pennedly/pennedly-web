// PostHog client wrapper for the browser.
// Init happens once on app boot (via PostHogProvider in layout). After
// that, components import { posthog, identify, captureEvent } and call
// them directly. Empty NEXT_PUBLIC_POSTHOG_KEY = no-op so local dev
// without analytics keys still works.

import posthog from "posthog-js";

let _initialized = false;
const CONSENT_KEY = "pennedly.consent"; // "accepted" | "declined"

/** The user's stored analytics-consent choice, or null if undecided. */
export function analyticsConsent(): "accepted" | "declined" | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(CONSENT_KEY);
  return v === "accepted" || v === "declined" ? v : null;
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
  // Honor a prior "accepted" decision across reloads.
  if (analyticsConsent() === "accepted") posthog.opt_in_capturing();
}

/** Cookie-banner "Accept": start capturing + remember the choice. */
export function grantAnalyticsConsent(): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CONSENT_KEY, "accepted");
  if (_initialized) posthog.opt_in_capturing();
}

/** Cookie-banner "Decline": stay opted out + remember the choice. */
export function declineAnalyticsConsent(): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CONSENT_KEY, "declined");
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
  if (!_initialized) return;
  posthog.capture(event, properties);
}
