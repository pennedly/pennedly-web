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

  return (
    <div
      role="dialog"
      aria-label={t("consent.title")}
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-2xl rounded-lg border border-border bg-surface p-4 shadow-lg max-md:inset-x-2 max-md:bottom-2"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-small text-text-muted">
          {t("consent.text")}{" "}
          <Link
            href="/privacy"
            className="underline underline-offset-2 hover:text-text"
          >
            {t("consent.learn")}
          </Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => {
              declineAnalyticsConsent();
              setShow(false);
            }}
            className="rounded-md border border-border px-3 py-1.5 text-small text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
          >
            {t("consent.decline")}
          </button>
          <button
            type="button"
            onClick={() => {
              grantAnalyticsConsent();
              setShow(false);
            }}
            className="rounded-md bg-text px-3 py-1.5 text-small font-medium text-bg transition-opacity hover:opacity-90"
          >
            {t("consent.accept")}
          </button>
        </div>
      </div>
    </div>
  );
}
