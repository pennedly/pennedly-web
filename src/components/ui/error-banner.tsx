"use client";

// Shared inline error state for data screens (design §3.8). Title / subtitle /
// Retry are localized — they default to the `error.*` i18n keys (EN is the
// fallback), and any screen can override them with its own strings (e.g. a
// per-endpoint message). Pair with an `onRetry` to show the Retry button.

import { useTranslation } from "@/lib/i18n";
import { IcAlert, IcUndo } from "@/components/icons";

export function ErrorBanner({
  title,
  subtitle,
  onRetry,
}: {
  title?: string;
  subtitle?: string;
  onRetry?: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div
      role="alert"
      className="flex items-center gap-3.5 rounded-lg border border-danger/30 bg-danger/[0.09] px-[18px] py-4"
    >
      <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full bg-danger/15 text-danger">
        <IcAlert size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-small font-semibold text-text">{title ?? t("error.title")}</div>
        <div className="mt-0.5 text-caption leading-relaxed text-text-muted">
          {subtitle ?? t("error.subtitle")}
        </div>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-caption font-medium text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
        >
          <IcUndo size={14} /> {t("error.retry")}
        </button>
      )}
    </div>
  );
}
