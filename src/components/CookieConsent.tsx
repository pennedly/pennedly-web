"use client";

// GDPR / ePrivacy consent gate for analytics. PostHog loads opted-OUT by
// default (see lib/analytics initAnalytics); this banner is the only thing that
// flips it on. Shown once until the user decides; the choice persists in
// localStorage and is honored across reloads.

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  analyticsConsent,
  declineAnalyticsConsent,
  grantAnalyticsConsent,
} from "@/lib/analytics";
import { useTranslation } from "@/lib/i18n";

export function CookieConsent() {
  const { t } = useTranslation();
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only prompt when undecided AND analytics is actually configured.
    if (analyticsConsent() === null && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  // Compact corner card, not a full-width strip — the strip used to sit
  // centered above the hero waitlist form and could clip its bottom edge on
  // a tall ru heading. A 320px card anchored bottom-right lives in its own
  // column of the two-column hero grid, so it can never overlap the form:
  // they're separated on the X axis, not just Y. Class name is the
  // prefixed `pnd-consent` (not `cookie-banner`/`consent-banner`) — generic
  // names like that match ad-blocker cosmetic filter lists (EasyList Cookie
  // List) and get display:none'd for a slice of real visitors.
  return (
    <div
      role="dialog"
      aria-label={t("consent.title")}
      className="pnd-consent fixed bottom-5 right-5 z-50 w-[320px] rounded-lg border border-border bg-surface p-4 shadow-lg max-[560px]:inset-x-3 max-[560px]:bottom-3 max-[560px]:w-auto max-[560px]:right-auto"
      style={{ animation: "pnd-consent-in var(--duration-slow) var(--ease-entrance) both" }}
    >
      <div className="flex flex-col gap-3">
        <p className="text-small leading-[1.5] text-text-muted">
          {t("consent.text")}{" "}
          <Link
            href="/privacy"
            className="text-text underline underline-offset-2 hover:text-accent"
          >
            {t("consent.learn")}
          </Link>
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              declineAnalyticsConsent();
              setShow(false);
            }}
            className="inline-flex h-8 items-center rounded-md border border-border px-[13px] text-small text-text-muted transition-colors hover:bg-surface-2 hover:text-text max-[560px]:flex-1 max-[560px]:justify-center"
          >
            {t("consent.decline")}
          </button>
          <button
            type="button"
            onClick={() => {
              grantAnalyticsConsent();
              setShow(false);
            }}
            className="inline-flex h-8 items-center rounded-md bg-text px-[13px] text-small font-medium text-bg transition-opacity hover:opacity-90 max-[560px]:flex-1 max-[560px]:justify-center"
          >
            {t("consent.accept")}
          </button>
        </div>
      </div>
    </div>
  );
}
