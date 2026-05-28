// PostHog client wrapper for the browser.
// Init happens once on app boot (via PostHogProvider in layout). After
// that, components import { posthog, identify, captureEvent } and call
// them directly. Empty NEXT_PUBLIC_POSTHOG_KEY = no-op so local dev
// without analytics keys still works.

import posthog from "posthog-js";

let _initialized = false;

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
    // Defaults are good — autocapture pageviews + clicks. Disable
    // session recording at app level; opt-in per session later if needed.
    capture_pageview: true,
    capture_pageleave: true,
    disable_session_recording: true,
    persistence: "localStorage+cookie",
  });
  _initialized = true;
}

export function identify(
  userId: number,
  email: string,
  tenantId: number
): void {
  if (typeof window === "undefined") return;
  if (!_initialized) return;
  posthog.identify(`user:${userId}`, {
    email,
    tenant_id: tenantId,
  });
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
