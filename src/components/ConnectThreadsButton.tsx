"use client";

// Starts the Threads OAuth connect: asks the backend for the Meta
// authorize URL (carrying a return_to back to /app) and navigates the
// browser there. On return, Meta → backend callback → 302 back to /app
// with ?threads_connected=1 (the dashboard shows the toast).
//
// Two looks:
//   "primary" — filled CTA, used in the zero-account hero + header.
//   "menu"    — full-width row, used inside the AccountSwitcher dropdown.

import { useState } from "react";

import { startThreadsConnect } from "@/lib/api";
import { captureEvent } from "@/lib/analytics";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { IcAt, IcPlus } from "@/components/icons";

type Props = {
  variant?: "primary" | "menu";
  // Where Meta's callback 302s back to (a path under our origin). Defaults to
  // the dashboard; onboarding passes "/app/onboarding" so the user lands back
  // in the wizard (Q32) instead of the app.
  returnTo?: string;
};

export function ConnectThreadsButton({ variant = "primary", returnTo = "/app" }: Props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onConnect() {
    setLoading(true);
    setError(null);
    captureEvent("ui.threads_connect_clicked", { variant });
    try {
      const returnUrl = `${window.location.origin}${returnTo}`;
      const { authorize_url } = await startThreadsConnect(returnUrl);
      // Full-page navigation out of the SPA to Meta's consent screen.
      window.location.href = authorize_url;
    } catch {
      // startThreadsConnect failed (network / not authed / no tenant).
      // Leave the spinner off and surface a retry hint inline.
      setLoading(false);
      setError(t("accounts.connect_error"));
    }
  }

  const label = loading
    ? t("accounts.connecting")
    : variant === "menu"
      ? t("accounts.connect_another")
      : t("accounts.connect");

  if (variant === "menu") {
    return (
      <div>
        <button
          type="button"
          onClick={onConnect}
          disabled={loading}
          className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-small text-text transition-colors hover:bg-surface-2 disabled:opacity-50"
        >
          <IcPlus size={16} className="text-text-subtle" />
          {label}
        </button>
        {error && <span className="px-3 text-caption text-danger">{error}</span>}
      </div>
    );
  }

  return (
    <div className="inline-flex flex-col gap-1">
      <Button
        variant="primary"
        onClick={onConnect}
        loading={loading}
        icon={<IcAt size={16} />}
      >
        {label}
      </Button>
      {error && <span className="px-1 text-caption text-danger">{error}</span>}
    </div>
  );
}
