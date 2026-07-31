"use client";

// In-app feedback — opened from the profile menu at the bottom of the sidebar
// (and, on a phone, the same menu inside the nav drawer).
//
// The point is the context. Before this, telling us something was broken meant
// leaving the product for hello@pennedly.com and describing from memory which
// screen you were on; most people don't bother. Here the route, the active
// account, the UI locale and the app version ride along automatically, so two
// sentences are already actionable. The user agent is added server-side.
//
// What we attach is shown, not hidden: a quiet line under the field lists it.
// A support form that silently collects context is the kind of thing people
// find out about later and resent.

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { submitFeedback } from "@/lib/api";
import { getSelectedAccountId } from "@/lib/account";
import { APP_VERSION } from "@/lib/version";
import { captureEvent } from "@/lib/analytics";
import { useTranslation } from "@/lib/i18n";
import { Dialog, DialogTitle } from "@/components/ui/overlay";
import { Spinner } from "@/components/ui/feedback";
import { IcCheck } from "@/components/icons";

const MAX = 4000;

export function FeedbackDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t, locale } = useTranslation();
  const pathname = usePathname();
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "sent" | "error">("idle");

  // A reopened dialog starts clean — otherwise the previous "thanks" screen (or
  // a half-typed report someone chose to abandon) greets the next visit.
  useEffect(() => {
    if (open) {
      setMessage("");
      setState("idle");
    }
  }, [open]);

  async function send() {
    const text = message.trim();
    if (!text || state === "busy") return;
    setState("busy");
    try {
      await submitFeedback({
        message: text,
        screen: pathname ?? undefined,
        account_id: getSelectedAccountId() ?? undefined,
        locale,
        app_version: APP_VERSION,
      });
      setState("sent");
      captureEvent("ui.feedback_sent", { screen: pathname ?? "" });
    } catch {
      setState("error");
    }
  }

  return (
    <Dialog open={open} onClose={onClose} labelledBy="feedback-title">
      {state === "sent" ? (
        <div className="text-center">
          <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-success/[0.12] text-success">
            <IcCheck size={22} />
          </span>
          <DialogTitle id="feedback-title" className="mt-3.5 text-h3 font-semibold">
            {t("feedback.sent_title")}
          </DialogTitle>
          <p className="mt-1.5 text-small text-text-muted">{t("feedback.sent_body")}</p>
          <button
            type="button"
            onClick={onClose}
            className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-primary px-5 text-small font-medium text-primary-foreground transition-colors hover:bg-[color-mix(in_srgb,var(--color-primary)_88%,var(--color-bg))]"
          >
            {t("feedback.close")}
          </button>
        </div>
      ) : (
        <>
          <DialogTitle id="feedback-title" className="text-h3 font-semibold">
            {t("feedback.title")}
          </DialogTitle>
          <p className="mt-1.5 text-small text-text-muted">{t("feedback.sub")}</p>
          <textarea
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              if (state === "error") setState("idle");
            }}
            maxLength={MAX}
            rows={5}
            autoFocus
            placeholder={t("feedback.placeholder")}
            className="mt-3.5 w-full resize-y rounded-lg border border-border bg-surface px-3.5 py-3 text-[16px] leading-[1.55] text-text placeholder:text-text-subtle focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/[0.18]"
          />
          <p className="mt-2 text-caption text-text-subtle">{t("feedback.context_note")}</p>
          {state === "error" && (
            <p className="mt-2 text-small text-danger">{t("feedback.error")}</p>
          )}
          <div className="mt-5 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 items-center rounded-md px-4 text-small font-medium text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
            >
              {t("feedback.cancel")}
            </button>
            <button
              type="button"
              onClick={send}
              disabled={state === "busy" || !message.trim()}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-5 text-small font-medium text-primary-foreground transition-colors hover:bg-[color-mix(in_srgb,var(--color-primary)_88%,var(--color-bg))] disabled:opacity-50"
            >
              {state === "busy" && <Spinner size={14} />}
              {state === "busy" ? t("feedback.sending") : t("feedback.send")}
            </button>
          </div>
        </>
      )}
    </Dialog>
  );
}
