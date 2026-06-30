"use client";

// Calm "beta — some metrics may differ from Threads" disclaimer, shared by the
// analytics surfaces (Feed, Stats). The Threads insights `likes` metric reads 0
// for recent posts despite real likes in the Threads app — a Threads-API
// limitation, not ours (see SPEC §14). This warns the user that counts here can
// differ from the Threads app until Meta App Review clears (which may restore
// full insights). REMOVE this component + the `common.beta_notice` i18n key once
// review clears and the data reconciles.

import { IcInfo } from "@/components/icons";
import { useTranslation } from "@/lib/i18n";

export function BetaNotice({ className = "" }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <div
      className={`flex items-start gap-2.5 rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-caption text-text-muted [text-wrap:pretty] ${className}`}
    >
      <IcInfo size={15} className="mt-px shrink-0 text-text-subtle" />
      <span>{t("common.beta_notice")}</span>
    </div>
  );
}
