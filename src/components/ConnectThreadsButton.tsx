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

type Props = {
  variant?: "primary" | "menu";
};

export function ConnectThreadsButton({ variant = "primary" }: Props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onConnect() {
    setLoading(true);
    setError(null);
    captureEvent("ui.threads_connect_clicked", { variant });
    try {
      const returnTo = `${window.location.origin}/app`;
      const { authorize_url } = await startThreadsConnect(returnTo);
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

  const className =
    variant === "menu"
      ? "w-full text-left px-3 py-2 text-sm flex items-center gap-2 text-text hover:bg-surface-2/60 disabled:opacity-50 transition-colors"
      : "inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors";

  const icon = loading ? (
    <span
      className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"
      aria-hidden
    />
  ) : (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );

  return (
    <div className={variant === "menu" ? "" : "inline-flex flex-col gap-1"}>
      <button
        type="button"
        onClick={onConnect}
        disabled={loading}
        className={className}
      >
        {icon}
        {label}
      </button>
      {error && (
        <span className="text-xs text-red-600 dark:text-red-400 px-1">
          {error}
        </span>
      )}
    </div>
  );
}
