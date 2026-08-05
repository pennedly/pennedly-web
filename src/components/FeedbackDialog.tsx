"use client";

// In-app feedback — opened from the profile menu at the bottom of the sidebar
// (and, on a phone, the same menu inside the nav drawer).
//
// Built to Feedback-Dialog-SPEC.html. Three of its calls carry the weight:
//
//  • THE CONTEXT IS SHOWN AS PILLS WITH VALUES, not a grey sentence and not a
//    collapsed list. The spec rejects the collapsed variant outright: context
//    you have to expand to read IS "quietly collecting it", and a click to find
//    out what we send about you is exactly what people resent later. Five
//    fields, none hidden. A sixth one added later must appear here too or the
//    block stops being honest.
//  • ON A PHONE THIS IS A BOTTOM SHEET, not the centred modal. Every other
//    modal in the product already is one, and this is the only one with a text
//    field: pinned to the bottom the content rides above the keyboard, and the
//    buttons sit under the thumb.
//  • THE CHARACTER COUNT ONLY APPEARS IN THE LAST 400. A permanent counter on a
//    feedback form nags — someone is writing about something broken and we're
//    counting their words at them.

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { submitFeedback } from "@/lib/api";
import { getSelectedAccountId } from "@/lib/account";
import { APP_VERSION } from "@/lib/version";
import { captureEvent } from "@/lib/analytics";
import { useTranslation, pluralKey } from "@/lib/i18n";
import { Spinner } from "@/components/ui/feedback";
import { IcCheck, IcMail, IcAlert } from "@/components/icons";
import "@/components/feedback-dialog.css";

const MAX = 4000;
// The counter shows up only for the last stretch (spec §5).
const COUNT_FROM = MAX - 400;

// Short, human browser name for the context pills. Deliberately coarse: the
// full user-agent is what the SERVER stores for diagnosis; this line only has
// to let the reporter recognise their own browser.
function browserName(ua: string): string {
  if (/edg\//i.test(ua)) return "Edge";
  if (/opr\/|opera/i.test(ua)) return "Opera";
  if (/firefox\//i.test(ua)) return "Firefox";
  if (/chrome\//i.test(ua)) return "Chrome";
  if (/safari\//i.test(ua)) return "Safari";
  return "—";
}

function usePhone(): boolean {
  const [phone, setPhone] = useState(false);
  useEffect(() => {
    const q = window.matchMedia("(max-width: 767px)");
    const sync = () => setPhone(q.matches);
    sync();
    q.addEventListener("change", sync);
    return () => q.removeEventListener("change", sync);
  }, []);
  return phone;
}

export function FeedbackDialog({
  open,
  onClose,
  accountHandle,
}: {
  open: boolean;
  onClose: () => void;
  /** Active account's bare handle, for the context pills. */
  accountHandle?: string | null;
}) {
  const { t, locale } = useTranslation();
  const pathname = usePathname();
  const phone = usePhone();
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "sent" | "error">("idle");
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const returnFocusRef = useRef<Element | null>(null);

  // A reopened dialog starts clean — otherwise the previous "thanks" screen (or
  // a half-typed report someone chose to abandon) greets the next visit.
  useEffect(() => {
    if (!open) return;
    returnFocusRef.current = document.activeElement;
    setMessage("");
    setState("idle");
    const id = window.setTimeout(() => taRef.current?.focus(), 30);
    return () => window.clearTimeout(id);
  }, [open]);

  // Escape closes — except mid-send, where losing the message to a stray key
  // would be the worst possible moment (spec §4).
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && state !== "busy") close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, state]);

  function close() {
    onClose();
    // Send focus back where it came from, so keyboard users aren't dropped at
    // the top of the page.
    const el = returnFocusRef.current;
    if (el instanceof HTMLElement) window.setTimeout(() => el.focus(), 0);
  }

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

  if (!open) return null;

  const left = MAX - message.length;
  const showCount = message.length >= COUNT_FROM;
  const failed = state === "error";

  const pills: { label: string; value: string }[] = [
    { label: t("feedback.ctx_screen"), value: pathname || "/" },
    { label: t("feedback.ctx_account"), value: accountHandle ? `@${accountHandle}` : "—" },
    { label: t("feedback.ctx_lang"), value: locale.toUpperCase() },
    { label: t("feedback.ctx_build"), value: APP_VERSION },
    {
      label: t("feedback.ctx_browser"),
      value: typeof navigator === "undefined" ? "—" : browserName(navigator.userAgent),
    },
  ];

  const body = state === "sent" ? (
    <>
      <div className="flex items-start gap-3">
        <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-md border border-success/30 bg-success/[0.13] text-success">
          <IcCheck size={18} />
        </span>
        <div className="min-w-0">
          <h2 id="feedback-title" className="text-h3 font-semibold leading-[1.3]">
            {t("feedback.sent_title")}
          </h2>
          <p className="mt-1 text-small leading-[1.55] text-text-muted">{t("feedback.sent_body")}</p>
        </div>
      </div>
      <div className={phone ? "fb-sheet-actions" : "mt-[22px] flex justify-end gap-2.5"}>
        <button
          type="button"
          onClick={close}
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-5 text-small font-medium text-primary-foreground transition-colors hover:bg-[color-mix(in_srgb,var(--color-primary)_88%,var(--color-bg))]"
        >
          {t("feedback.close")}
        </button>
      </div>
    </>
  ) : (
    <>
      <div className="flex items-start gap-3">
        <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-md border border-border bg-surface-2 text-text">
          <IcMail size={18} />
        </span>
        <div className="min-w-0">
          <h2 id="feedback-title" className="text-h3 font-semibold leading-[1.3]">
            {t("feedback.title")}
          </h2>
          <p className="mt-1 text-small leading-[1.55] text-text-muted">{t("feedback.sub")}</p>
        </div>
      </div>

      <div className={phone ? "mt-3.5" : "mt-[18px]"}>
        <textarea
          ref={taRef}
          value={message}
          disabled={state === "busy"}
          onChange={(e) => {
            setMessage(e.target.value);
            if (failed) setState("idle");
          }}
          maxLength={MAX}
          placeholder={t("feedback.placeholder")}
          aria-invalid={failed || undefined}
          // 16px hard — anything smaller and Safari on iPhone zooms on focus.
          className={`w-full resize-y rounded-md border bg-surface px-3.5 py-3 text-[16px] leading-[1.55] text-text placeholder:text-text-subtle focus:outline-none focus:ring-[3px] focus:ring-accent/[0.18] disabled:resize-none disabled:opacity-65 ${
            phone ? "min-h-[116px] max-h-[40vh]" : "min-h-[132px] max-h-[300px]"
          } ${failed ? "border-danger focus:border-danger" : "border-border focus:border-accent"}`}
        />
        {showCount && (
          <p
            className={`mt-1.5 text-right text-caption tabular-nums ${
              left === 0 ? "text-danger" : "text-text-subtle"
            }`}
          >
            {t(pluralKey(locale, left, { one: "feedback.count_one", few: "feedback.count_few", many: "feedback.count_many" })).replace(
              "{n}",
              String(left),
            )}
          </p>
        )}

        {/* What travels with the message — visible, with the actual values. */}
        <div className={`${phone ? "mt-3" : "mt-3.5"} rounded-md border border-border bg-surface-2 px-[13px] py-3`}>
          <p className="flex items-center gap-2 text-small text-text-muted">
            <IcAlert size={15} className="shrink-0 text-text-subtle" />
            {t("feedback.ctx")}
          </p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {pills.map((p) => (
              <li
                key={p.label}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-caption text-text-muted"
              >
                {p.label}:
                <span className="max-w-[18ch] truncate font-mono text-[11.5px] font-medium text-text">
                  {p.value}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {failed && (
          <p className="mt-3 flex items-start gap-2 text-small text-danger" aria-live="polite">
            <IcAlert size={15} className="mt-0.5 shrink-0" />
            {t("feedback.error")}
          </p>
        )}
      </div>

      <div className={phone ? "fb-sheet-actions" : "mt-[22px] flex items-center justify-end gap-2.5"}>
        <button
          type="button"
          onClick={close}
          disabled={state === "busy"}
          className="inline-flex h-10 items-center justify-center rounded-md px-4 text-small font-medium text-text-muted transition-colors hover:bg-surface-2 hover:text-text disabled:opacity-50"
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
  );

  if (phone) {
    return (
      <>
        <div
          className="fb-scrim"
          onClick={() => state !== "busy" && close()}
          aria-hidden
        />
        <div className="fb-sheet" role="dialog" aria-modal="true" aria-labelledby="feedback-title">
          <div className="fb-sheet-grip" aria-hidden />
          <div className="fb-sheet-body">{body}</div>
        </div>
      </>
    );
  }

  return (
    <div
      className="fixed inset-0 z-30 grid place-items-center bg-ink-950/55 p-6 backdrop-blur-sm"
      onMouseDown={(e) => {
        // Mid-send the backdrop is inert: a stray click must not throw away a
        // message that is already on its way.
        if (e.target === e.currentTarget && state !== "busy") close();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-title"
        className="w-full max-w-[448px] rounded-2xl border border-border bg-surface p-6 shadow-lg"
      >
        {body}
      </div>
    </div>
  );
}
