"use client";

// Gallery page for the in-app feedback dialog — the real component, no auth.
//
// Only the live one is rendered: it now owns every state itself (empty, typed,
// sending, sent, error, plus the character counter and the phone sheet), so a
// hand-built copy of a state here would be a second source of truth that drifts.
// Submitting without a signed-in session lands on the error state, which is how
// you inspect it; resize under 768px to get the bottom sheet.
//
// What this page CAN'T prove: that the report reaches the database. That is
// covered by the backend's tests against a real Postgres.

import { useState } from "react";

import { FeedbackDialog } from "@/components/FeedbackDialog";
import { IcMail } from "@/components/icons";
import { useTranslation } from "@/lib/i18n";

export default function FeedbackGallery() {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  return (
    <div className="p-8">
      <h1 className="text-h2 font-semibold">Feedback dialog</h1>
      <p className="mt-1.5 max-w-[62ch] text-small text-text-muted">
        The menu entry lives at the bottom of the sidebar, next to Settings.
        Submitting from here hits the real endpoint — without a session that
        lands on the error state, which is the point. Below 768px the dialog
        becomes a bottom sheet (Feedback-Dialog-SPEC §6); type past 3600
        characters to bring out the counter.
      </p>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-6 inline-flex h-10 items-center gap-2.5 rounded-md border border-border bg-surface px-4 text-small text-text transition-colors hover:bg-surface-2"
      >
        <IcMail size={16} className="text-text-subtle" /> {t("feedback.menu")}
      </button>

      <FeedbackDialog open={open} onClose={() => setOpen(false)} accountHandle="mara.lin" />
    </div>
  );
}
