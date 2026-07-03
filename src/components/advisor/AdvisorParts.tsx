"use client";

// Presentational pieces for the Advisor chat (the AI growth-advisor screen),
// ported 1:1 from the design SPEC (_cd-new/Advisor-SPEC.html + the mobile spec).
// Pure Tailwind + semantic tokens (no hardcoded colour) so light/dark both work;
// the SPEC's `color-mix(...)` tints are kept verbatim as arbitrary values. These
// are shared by the live page and the /gallery/advisor state page.
//
//   • user message  → right-aligned accent bubble (no avatar)
//   • assistant reply → mark + prose (not a bubble): paragraphs, data chips,
//     a "Grounded in: …" source line, and optional suggestion cards
//   • data chips → up=success / down=danger / accent=info·time / muted=context
//   • suggestion card → title + why + "Open in Studio" (handoff) + "Show me the data"
//   • composer + starter chips · thinking row · inline error row · first-run hero

import { type ReactNode } from "react";

import { cn } from "@/lib/cn";
import { useTranslation } from "@/lib/i18n";
import {
  IcAdvisor,
  IcArrowDown,
  IcArrowUp,
  IcChart,
  IcClock,
  IcExternal,
  IcEye,
  IcNib,
  IcReply,
  IcSend,
  IcUndo,
  type IconProps,
} from "@/components/icons";

type IconCmp = (p: IconProps) => React.ReactElement;

// ── shared token shorthands (the SPEC's accent/surface mixes) ────────────────
const ACCENT_TILE =
  "bg-[color-mix(in_srgb,var(--color-accent)_12%,var(--color-surface))] " +
  "border border-[color-mix(in_srgb,var(--color-accent)_24%,transparent)] text-accent";

// ── chips ────────────────────────────────────────────────────────────────────
export type AdvisorChipTone = "up" | "down" | "accent" | "neutral";
export type AdvisorChipIcon = "eye" | "reply" | "clock" | "chart" | "up" | "down";

const CHIP_ICONS: Record<AdvisorChipIcon, IconCmp> = {
  eye: IcEye,
  reply: IcReply,
  clock: IcClock,
  chart: IcChart,
  up: IcArrowUp,
  down: IcArrowDown,
};

const CHIP_TONE: Record<AdvisorChipTone, string> = {
  up:
    "text-success bg-[color-mix(in_srgb,var(--color-success)_12%,var(--color-surface))] " +
    "border-[color-mix(in_srgb,var(--color-success)_28%,transparent)]",
  down:
    "text-danger bg-[color-mix(in_srgb,var(--color-danger)_12%,var(--color-surface))] " +
    "border-[color-mix(in_srgb,var(--color-danger)_28%,transparent)]",
  accent:
    "text-accent bg-[color-mix(in_srgb,var(--color-accent)_12%,var(--color-surface))] " +
    "border-[color-mix(in_srgb,var(--color-accent)_28%,transparent)]",
  neutral: "text-text-muted bg-surface-2 border-border",
};

export type AdvisorChip = { tone: AdvisorChipTone; icon?: AdvisorChipIcon; label: string };

export function ChipRow({ chips }: { chips: AdvisorChip[] }) {
  if (chips.length === 0) return null;
  return (
    <div className="mb-3 mt-0.5 flex flex-wrap gap-[7px]">
      {chips.map((c, i) => {
        const Icon = c.icon ? CHIP_ICONS[c.icon] : null;
        return (
          <span
            key={i}
            className={cn(
              "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-caption font-semibold tabular-nums",
              CHIP_TONE[c.tone],
            )}
          >
            {Icon && <Icon size={13} className="opacity-85" />}
            {c.label}
          </span>
        );
      })}
    </div>
  );
}

// ── source / grounding line ──────────────────────────────────────────────────
export function SourceLine({ sources }: { sources: string[] }) {
  const { t } = useTranslation();
  if (sources.length === 0) return null;
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2 text-caption text-text-subtle">
      <span className="inline-flex items-center gap-1.5">{t("advisor.grounded_in")}</span>
      {sources.map((s, i) => (
        <span key={i} className="inline-flex items-center gap-2">
          {i > 0 && <span className="h-[3px] w-[3px] rounded-full bg-text-subtle opacity-60" />}
          <span className="font-medium text-text-muted">{s}</span>
        </span>
      ))}
    </div>
  );
}

// ── suggestion card (handoff → Studio) ───────────────────────────────────────
export type AdvisorSuggestion = {
  icon: "nib" | "clock";
  title: string;
  why: string;
  // The brief handed to the Studio composer when "Open in Studio" is tapped.
  brief: string;
  onOpenStudio?: () => void;
  onShowData?: () => void;
};

export function SuggestionCard({ s }: { s: AdvisorSuggestion }) {
  const { t } = useTranslation();
  const Icon = s.icon === "clock" ? IcClock : IcNib;
  return (
    <div className="mb-[9px] flex items-start gap-[13px] rounded-lg border border-border bg-surface px-[15px] py-[13px] shadow-sm">
      <span className={cn("grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[9px]", ACCENT_TILE)}>
        <Icon size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-small font-semibold tracking-[-0.003em] text-text">{s.title}</div>
        <div className="mt-[3px] text-caption leading-[1.5] text-text-muted">{s.why}</div>
        <div className="mt-[11px] flex flex-wrap gap-2 max-[420px]:flex-col">
          <button
            type="button"
            onClick={s.onOpenStudio}
            className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-small font-medium text-primary-foreground transition-opacity hover:opacity-90 max-[420px]:w-full"
          >
            <IcExternal size={15} />
            {t("advisor.open_in_studio")}
          </button>
          {s.onShowData && (
            <button
              type="button"
              onClick={s.onShowData}
              className="inline-flex items-center justify-center rounded-md px-3 py-1.5 text-small font-medium text-text-muted transition-colors hover:bg-surface-2 hover:text-text max-[420px]:w-full"
            >
              {t("advisor.show_data")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── message rows ─────────────────────────────────────────────────────────────
export function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <div
        className={cn(
          "max-w-[80%] rounded-[15px_15px_5px_15px] px-[15px] py-[11px] text-body leading-[1.55] text-text",
          "bg-[color-mix(in_srgb,var(--color-accent)_12%,var(--color-surface))]",
          "border border-[color-mix(in_srgb,var(--color-accent)_22%,transparent)]",
        )}
      >
        {text}
      </div>
    </div>
  );
}

function AssistantMark() {
  return (
    <span className={cn("mt-0.5 grid h-[30px] w-[30px] shrink-0 place-items-center rounded-[9px]", ACCENT_TILE)}>
      <IcAdvisor size={18} />
    </span>
  );
}

// Wraps the left mark + the assistant body (name + children).
export function AssistantRow({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-start gap-3">
      <AssistantMark />
      <div className="min-w-0 flex-1">
        <div className="mb-2 mt-[3px] text-caption font-semibold uppercase tracking-[0.03em] text-text-subtle">
          {t("advisor.assistant_name")}
        </div>
        {children}
      </div>
    </div>
  );
}

// One full assistant reply: prose paragraphs + chips + source line + suggestions.
export type AdvisorReplyContent = {
  paragraphs: string[];
  chips?: AdvisorChip[];
  sources?: string[];
  suggestions?: AdvisorSuggestion[];
};

export function AssistantReply({ content }: { content: AdvisorReplyContent }) {
  return (
    <AssistantRow>
      {content.paragraphs.map((p, i) => (
        <p key={i} className="mb-[11px] text-body leading-[1.62] text-text last:mb-0">
          {p}
        </p>
      ))}
      {content.chips && content.chips.length > 0 && (
        <div className="mt-[11px]">
          <ChipRow chips={content.chips} />
        </div>
      )}
      {content.sources && <SourceLine sources={content.sources} />}
      {content.suggestions?.map((s, i) => <SuggestionCard key={i} s={s} />)}
    </AssistantRow>
  );
}

// ── thinking row (loading) ───────────────────────────────────────────────────
export function ThinkingRow({ label }: { label: string }) {
  return (
    <AssistantRow>
      <div className="inline-flex items-center gap-2.5 text-small text-text-subtle">
        <span className="inline-flex gap-1">
          <i className="h-1.5 w-1.5 rounded-full bg-current" style={{ animation: "dot-pulse 1.2s infinite" }} />
          <i
            className="h-1.5 w-1.5 rounded-full bg-current"
            style={{ animation: "dot-pulse 1.2s infinite", animationDelay: "0.18s" }}
          />
          <i
            className="h-1.5 w-1.5 rounded-full bg-current"
            style={{ animation: "dot-pulse 1.2s infinite", animationDelay: "0.36s" }}
          />
        </span>
        {label}
      </div>
    </AssistantRow>
  );
}

// ── inline error row (per-reply, not a whole-screen banner) ──────────────────
export function ErrorRow({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <AssistantRow>
      <div
        className={cn(
          "rounded-[11px] border border-l-[3px] px-[15px] py-3",
          "border-[color-mix(in_srgb,var(--color-danger)_30%,var(--color-border))]",
          "bg-[color-mix(in_srgb,var(--color-danger)_6%,var(--color-surface))]",
        )}
      >
        <div className="text-small font-semibold text-text">{t("advisor.error_title")}</div>
        <div className="mt-[3px] text-caption text-text-muted">{t("advisor.error_sub")}</div>
        <div className="mt-2.5">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-small font-medium text-text transition-colors hover:bg-surface-2"
          >
            <IcUndo size={15} />
            {t("advisor.retry")}
          </button>
        </div>
      </div>
    </AssistantRow>
  );
}

// ── starter prompts ──────────────────────────────────────────────────────────
export type Starter = { icon: "nib" | "chart" | "clock"; label: string };

const STARTER_ICONS: Record<Starter["icon"], IconCmp> = { nib: IcNib, chart: IcChart, clock: IcClock };

export function Starters({
  starters,
  onPick,
  scroll = false,
}: {
  starters: Starter[];
  onPick: (label: string) => void;
  // Phone composer dock scrolls the starters horizontally; the desktop first-run
  // wraps them. `scroll` selects the phone behaviour.
  scroll?: boolean;
}) {
  return (
    <div
      className={cn(
        "mx-auto mb-3 max-w-[640px] gap-2",
        scroll
          ? "flex overflow-x-auto pb-0.5 [mask-image:linear-gradient(90deg,#000_86%,transparent)] [-webkit-overflow-scrolling:touch]"
          : "flex flex-wrap justify-center",
      )}
    >
      {starters.map((s, i) => {
        const Icon = STARTER_ICONS[s.icon];
        return (
          <button
            key={i}
            type="button"
            onClick={() => onPick(s.label)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border border-border bg-surface px-[13px] py-[9px] text-small font-medium text-text transition-colors hover:bg-surface-2",
              scroll && "shrink-0 whitespace-nowrap",
            )}
          >
            <Icon size={15} className="text-accent opacity-90" />
            {s.label}
          </button>
        );
      })}
    </div>
  );
}

// ── composer (auto-growing textarea + Send) ──────────────────────────────────
export function Composer({
  value,
  onChange,
  onSend,
  disabled,
  busy,
  hint = true,
  placeholder,
  hintText,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  // Send disabled when empty; `busy` (generating) also disables it.
  disabled?: boolean;
  busy?: boolean;
  hint?: boolean;
  // Copy overrides (the portfolio advisor passes its own placeholder + hint);
  // default to the growth-advisor keys.
  placeholder?: string;
  hintText?: string;
}) {
  const { t } = useTranslation();
  const canSend = !disabled && !busy && value.trim().length > 0;
  const ph = placeholder ?? t("advisor.composer_placeholder");
  return (
    <div className="mx-auto max-w-[640px]">
      <div
        className={cn(
          "flex items-end gap-2.5 rounded-lg border border-border bg-surface py-[9px] pl-[15px] pr-[9px] shadow-sm",
          "focus-within:border-accent focus-within:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-accent)_20%,transparent)]",
        )}
      >
        <textarea
          rows={1}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            const el = e.target;
            el.style.height = "auto";
            el.style.height = Math.min(el.scrollHeight, 120) + "px";
          }}
          onKeyDown={(e) => {
            // Enter sends; Shift+Enter inserts a newline (chat convention).
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (canSend) onSend();
            }
          }}
          placeholder={ph}
          className="max-h-[120px] min-w-0 flex-1 resize-none bg-transparent py-[7px] text-body leading-[1.5] text-text outline-none placeholder:text-text-subtle"
          aria-label={ph}
        />
        <button
          type="button"
          onClick={() => canSend && onSend()}
          disabled={!canSend}
          aria-label={t("advisor.send")}
          className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-md bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <IcSend size={18} />
        </button>
      </div>
      {hint && (
        <p className="mx-auto mt-2 max-w-[640px] text-center text-caption text-text-subtle">
          {hintText ?? t("advisor.composer_hint")}
        </p>
      )}
    </div>
  );
}

// ── first-run hero ───────────────────────────────────────────────────────────
// Copy overrides let the portfolio advisor pass its own title/sub; default to
// the growth-advisor keys.
export function Hero({ title, sub }: { title?: string; sub?: string } = {}) {
  const { t } = useTranslation();
  return (
    <div className="mx-auto flex max-w-[560px] flex-col items-center px-5 pb-[22px] pt-[38px] text-center">
      <span className={cn("mb-4 grid h-14 w-14 place-items-center rounded-[16px]", ACCENT_TILE)}>
        <IcAdvisor size={26} />
      </span>
      <h2 className="mb-2 text-h2 font-semibold tracking-[-0.01em] text-text">{title ?? t("advisor.hero_title")}</h2>
      <p className="max-w-[44ch] text-body leading-[1.55] text-text-muted">{sub ?? t("advisor.hero_sub")}</p>
    </div>
  );
}
