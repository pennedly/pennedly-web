"use client";

// Living sentence (A) + skeleton (B) + promise line — the spine of the Pennedly-3
// Scenarios redesign. Every scenario is shown as a human sentence that recomposes
// from its fields and serves as the card caption; a closing "promise" line says
// who is at the wheel (green «Спроси меня» / amber «Автоматически»). The 3-step
// skeleton КОГДА → ТОЛЬКО ЕСЛИ → ЧТО СДЕЛАЕТ restates the same routine in plain
// words. Source spec: Scenarios-SPEC.html §3. Localizable: the sentence is an
// i18n template with {slots}; the renderer wraps each slot as a field (.v) or the
// account handle (.who), so word order stays per-locale.

import { type ReactNode } from "react";

import { cn } from "@/lib/cn";
import { useTranslation } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n/messages/en";
import { IcEye, IcBolt } from "@/components/icons";

// ── publish mode: who confirms before it goes out ──
export type PublishMode = "ask" | "auto";

// ── one interpolated slot of a living sentence ──
type SlotKind = "v" | "who" | "plain";
type Slot = { kind: SlotKind; text: string };
export type SentenceSlots = Record<string, Slot>;
export const v = (text: string): Slot => ({ kind: "v", text });
export const who = (text: string): Slot => ({ kind: "who", text });

// Render an i18n template with {slot} markers into highlighted React nodes.
// variant "card" quiets the handle (text-muted, not accent) per the spec gotcha.
function renderSentence(template: string, slots: SentenceSlots, variant: "full" | "card"): ReactNode[] {
  const parts = template.split(/(\{[a-z_]+\})/gi);
  return parts.map((part, i) => {
    const m = part.match(/^\{([a-z_]+)\}$/i);
    if (!m) return <span key={i}>{part}</span>;
    const slot = slots[m[1]];
    if (!slot) return <span key={i} />;
    if (slot.kind === "who") {
      return (
        <span key={i} className={cn("font-semibold", variant === "card" ? "text-text-muted" : "text-accent")}>
          {slot.text}
        </span>
      );
    }
    if (slot.kind === "v") {
      return (
        <span
          key={i}
          className={cn(
            "font-semibold text-text",
            variant === "full" && "underline decoration-accent/45 decoration-2 underline-offset-2",
          )}
        >
          {slot.text}
        </span>
      );
    }
    return <span key={i}>{slot.text}</span>;
  });
}

// ── the promise line (who is at the wheel) ──
const PROMISE_KEY: Record<`${PublishMode}_${"post" | "reply"}`, MessageKey> = {
  ask_post: "scenarios.promise.ask_post",
  ask_reply: "scenarios.promise.ask_reply",
  auto_post: "scenarios.promise.auto_post",
  auto_reply: "scenarios.promise.auto_reply",
};

export function PromiseLine({ mode, kind }: { mode: PublishMode; kind: "post" | "reply" }) {
  const { t } = useTranslation();
  const auto = mode === "auto";
  const Icon = auto ? IcBolt : IcEye;
  return (
    <p className={cn("mt-2 inline-flex items-start gap-1.5 text-small font-medium leading-snug text-text-muted")}>
      <Icon size={15} className={cn("mt-0.5 shrink-0", auto ? "text-warning" : "text-success")} />
      <span>{t(PROMISE_KEY[`${mode}_${kind}`])}</span>
    </p>
  );
}

// ── the full living sentence block (editor header / first-run example / preview) ──
export function LivingSentence({
  template,
  slots,
  mode,
  kind,
  eyebrow = true,
  className,
}: {
  template: string;
  slots: SentenceSlots;
  mode: PublishMode;
  kind: "post" | "reply";
  eyebrow?: boolean;
  className?: string;
}) {
  const { t } = useTranslation();
  return (
    <div
      className={cn(
        "rounded-lg border border-l-[3px] border-border border-l-accent bg-surface p-4 shadow-sm md:px-[19px] md:py-[17px]",
        className,
      )}
    >
      {eyebrow && (
        <span className="mb-[7px] block text-caption font-semibold uppercase tracking-[0.05em] text-text-subtle">
          {t("scenarios.sentence.eyebrow")}
        </span>
      )}
      <p className="text-[17px] leading-[1.55] text-text">{renderSentence(template, slots, "full")}</p>
      <PromiseLine mode={mode} kind={kind} />
    </div>
  );
}

// ── bare sentence text (no card / eyebrow / promise) — first-run examples, preview ──
export function Sentence({
  template,
  slots,
  variant = "full",
  className,
}: {
  template: string;
  slots: SentenceSlots;
  variant?: "full" | "card";
  className?: string;
}) {
  const base = variant === "card" ? "text-small leading-[1.5] text-text-muted [text-wrap:pretty]" : "text-body leading-relaxed text-text";
  return <p className={cn(base, className)}>{renderSentence(template, slots, variant)}</p>;
}

// ── the compact card caption (control-center list) — same string, quieter ──
export function CardLine({ template, slots, className }: { template: string; slots: SentenceSlots; className?: string }) {
  return <Sentence template={template} slots={slots} variant="card" className={className} />;
}

// ── the 3-step skeleton КОГДА → ТОЛЬКО ЕСЛИ → ЧТО СДЕЛАЕТ ──
export function Skeleton3({ when, onlyif, whatdo }: { when: string; onlyif: string | null; whatdo: string }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-wrap overflow-hidden rounded-md border border-border bg-surface-2">
      <SkelStep k={t("scenarios.skel.when")} val={when} />
      <SkelStep k={t("scenarios.skel.onlyif")} val={onlyif ?? t("scenarios.skel.no_condition")} opt />
      <SkelStep k={t("scenarios.skel.whatdo")} val={whatdo} />
    </div>
  );
}

function SkelStep({ k, val, opt }: { k: string; val: string; opt?: boolean }) {
  return (
    <div className="min-w-[150px] flex-1 border-border px-[15px] py-[11px] [&:not(:last-child)]:border-r max-[640px]:border-b max-[640px]:[&:not(:last-child)]:border-r-0">
      <span className={cn("block text-[10.5px] font-bold uppercase tracking-[0.07em]", opt ? "text-text-subtle/80" : "text-text-subtle")}>
        {k}
      </span>
      <span className={cn("mt-[3px] block text-small text-text", opt ? "font-normal text-text-subtle" : "font-medium")}>{val}</span>
    </div>
  );
}
