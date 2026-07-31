"use client";

// Gallery page for the in-app feedback dialog — every state, no auth, no
// backend. The real dialog POSTs to /api/feedback; here the submit is stubbed
// so the "sent" and "error" screens can be inspected on demand.
//
// What this page CAN'T prove: that the report actually reaches the database.
// That is covered by the backend's own tests against a real Postgres.

import { useState } from "react";

import { Dialog, DialogTitle } from "@/components/ui/overlay";
import { FeedbackDialog } from "@/components/FeedbackDialog";
import { Spinner } from "@/components/ui/feedback";
import { IcCheck, IcMail } from "@/components/icons";
import { useTranslation } from "@/lib/i18n";

// The live component, driven for real (its submit will fail without a backend,
// which is exactly how you inspect the error state).
function LiveOne() {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center gap-2.5 rounded-md border border-border bg-surface px-4 text-small text-text transition-colors hover:bg-surface-2"
      >
        <IcMail size={16} className="text-text-subtle" /> {t("feedback.menu")}
      </button>
      <FeedbackDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}

// Static renders of the two end states, so they can be reviewed without having
// to make a request succeed or fail on cue.
function SentState() {
  const { t } = useTranslation();
  return (
    <Dialog open onClose={() => {}}>
      <div className="text-center">
        <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-success/[0.12] text-success">
          <IcCheck size={22} />
        </span>
        <DialogTitle className="mt-3.5 text-h3 font-semibold">{t("feedback.sent_title")}</DialogTitle>
        <p className="mt-1.5 text-small text-text-muted">{t("feedback.sent_body")}</p>
        <button
          type="button"
          className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-primary px-5 text-small font-medium text-primary-foreground"
        >
          {t("feedback.close")}
        </button>
      </div>
    </Dialog>
  );
}

function BusyState() {
  const { t } = useTranslation();
  return (
    <Dialog open onClose={() => {}}>
      <DialogTitle className="text-h3 font-semibold">{t("feedback.title")}</DialogTitle>
      <p className="mt-1.5 text-small text-text-muted">{t("feedback.sub")}</p>
      <textarea
        readOnly
        rows={5}
        value="The reply queue shows yesterday's comments after I switch accounts."
        className="mt-3.5 w-full resize-y rounded-lg border border-border bg-surface px-3.5 py-3 text-[16px] leading-[1.55] text-text"
      />
      <p className="mt-2 text-caption text-text-subtle">{t("feedback.context_note")}</p>
      <div className="mt-5 flex items-center justify-end gap-2.5">
        <button type="button" className="inline-flex h-10 items-center rounded-md px-4 text-small font-medium text-text-muted">
          {t("feedback.cancel")}
        </button>
        <button
          type="button"
          disabled
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-5 text-small font-medium text-primary-foreground opacity-50"
        >
          <Spinner size={14} /> {t("feedback.sending")}
        </button>
      </div>
    </Dialog>
  );
}

export default function FeedbackGallery() {
  const [state, setState] = useState<"live" | "busy" | "sent">("live");
  return (
    <div className="p-8">
      <h1 className="text-h2 font-semibold">Feedback dialog</h1>
      <p className="mt-1.5 max-w-[60ch] text-small text-text-muted">
        The menu entry lives at the bottom of the sidebar, next to Settings.
        Submitting from here hits the real endpoint — without a backend that
        lands on the error state, which is the point.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-2.5">
        {(["live", "busy", "sent"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setState(s)}
            className={`h-9 rounded-md border px-3.5 text-small ${
              state === s ? "border-text bg-surface-2 font-semibold" : "border-border bg-surface"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {state === "live" && <LiveOne />}
        {state === "busy" && <BusyState />}
        {state === "sent" && <SentState />}
      </div>
    </div>
  );
}
