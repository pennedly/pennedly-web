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

import { type ReactNode, useState } from "react";

import { ApiError } from "@/lib/api";
import { cn } from "@/lib/cn";
import { useTranslation, type MessageKey } from "@/lib/i18n";
import {
  IcAdvisor,
  IcAlert,
  IcArrowDown,
  IcArrowRight,
  IcArrowUp,
  IcChart,
  IcCheck,
  IcClock,
  IcExternal,
  IcEye,
  IcMoon,
  IcNib,
  IcPlay,
  IcPower,
  IcReply,
  IcRepeat,
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

// ── one-click action card (the advisor's "apply-in-one-click" layer) ─────────
// A typed card the advisor attaches to propose an action the app applies in one
// click via an existing gated endpoint. ONE shell, per-type content. Catalog:
//   • `routine`      — a recurring ask-mode posting scenario (drafts for review);
//   • `auto_replies` — turn ON the auto-reply policy (applies immediately);
//   • `voice_rule`   — ADD one standing rule to the account's voice (additive).
// States: proposed → applying → applied (quiet done row + deep-link) | error
// (inline + Retry). `onApply` runs the apply call (baked in the chat's ask());
// Cancel dismisses the card locally. `onOpen` deep-links the applied surface.
type ActionCardCommon = {
  title: string;
  // Portfolio chat only: the target profile's @handle (shown on the card).
  targetHandle?: string | null;
  onApply: () => Promise<void>;
  onOpen: () => void;
};
export type AdvisorActionCardData =
  | (ActionCardCommon & {
      type: "routine";
      topic: string;
      timesPerDay: number;
      hoursPreview: number[];
    })
  | (ActionCardCommon & {
      type: "auto_replies";
      audience: "questions" | "fans" | "all_except_trolls";
      repliesPerDay: number;
      skipLowValue: boolean;
    })
  | (ActionCardCommon & {
      type: "voice_rule";
      ruleText: string;
      kind: "post" | "reply" | "both";
    })
  | (ActionCardCommon & {
      type: "schedule_post";
      brief: string;
      // The resolved local time, already formatted for display (the builder also
      // bakes the absolute scheduled_at into onApply).
      whenLabel: string;
    })
  | (ActionCardCommon & {
      type: "reactive";
      reactiveKind: "amplify" | "milestone" | "booster";
      commentText?: string; // booster only
    })
  | (ActionCardCommon & {
      type: "format";
      formatKind: "daily_question" | "rubric" | "poll";
      topic?: string; // daily_question
      rubricName?: string; // rubric
      rubricIdea?: string; // rubric
      question?: string; // poll
      options?: string[]; // poll
    })
  | (ActionCardCommon & {
      type: "automation";
      controlKind: "pause" | "quiet_hours" | "resume";
      quietStart?: number | null; // quiet_hours
      quietEnd?: number | null; // quiet_hours
    });

const AUDIENCE_KEY: Record<"questions" | "fans" | "all_except_trolls", MessageKey> = {
  questions: "adv.act.aud_questions",
  fans: "adv.act.aud_fans",
  all_except_trolls: "adv.act.aud_all_except_trolls",
};

const VOICE_KIND_KEY: Record<"post" | "reply" | "both", MessageKey> = {
  post: "adv.act.applies_post",
  reply: "adv.act.applies_reply",
  both: "adv.act.applies_both",
};

const REACT_BODY_KEY: Record<"amplify" | "milestone" | "booster", MessageKey> = {
  amplify: "adv.act.react_amplify",
  milestone: "adv.act.react_milestone",
  booster: "adv.act.react_booster",
};

// automation control (pause / quiet_hours / resume): the card shell (icon + the
// header/apply/done labels) per control_kind.
const CTRL_META: Record<
  "pause" | "quiet_hours" | "resume",
  { icon: IconCmp; kind: MessageKey; apply: MessageKey; done: MessageKey; mode: MessageKey }
> = {
  pause: {
    icon: IcPower,
    kind: "adv.act.ctrl_pause_kind",
    apply: "adv.act.ctrl_pause_apply",
    done: "adv.act.ctrl_pause_done",
    mode: "adv.act.ctrl_pause_mode",
  },
  quiet_hours: {
    icon: IcMoon,
    kind: "adv.act.ctrl_quiet_kind",
    apply: "adv.act.ctrl_quiet_apply",
    done: "adv.act.ctrl_quiet_done",
    mode: "adv.act.ctrl_quiet_mode",
  },
  resume: {
    icon: IcPlay,
    kind: "adv.act.ctrl_resume_kind",
    apply: "adv.act.ctrl_resume_apply",
    done: "adv.act.ctrl_resume_done",
    mode: "adv.act.ctrl_resume_mode",
  },
};

// "23:00-07:00" — a plain hyphen range (never an em/en dash).
const fmtWindow = (s?: number | null, e?: number | null): string => {
  const h = (n?: number | null) => `${String(n ?? 0).padStart(2, "0")}:00`;
  return `${h(s)}-${h(e)}`;
};

export function ActionCard({ a }: { a: AdvisorActionCardData }) {
  const { t } = useTranslation();
  const [state, setState] = useState<"proposed" | "applying" | "applied" | "error">("proposed");
  const [dismissed, setDismissed] = useState(false);
  // On a definitive 4xx (quota 429, validation 422, cap 409) we surface the server's
  // reason and drop the Retry — retrying can't succeed. A transient 5xx / network drop
  // keeps the generic message + a Retry. `errText` non-null ⇒ not retryable.
  const [errText, setErrText] = useState<string | null>(null);
  if (dismissed) return null;

  const apply = async () => {
    setErrText(null);
    setState("applying");
    try {
      await a.onApply();
      setState("applied");
    } catch (e) {
      const client = e instanceof ApiError && e.status >= 400 && e.status < 500;
      setErrText(client ? (e as ApiError).message : null);
      setState("error");
    }
  };

  // The automation card's header icon per control_kind (IcNib is an unused
  // placeholder for the non-automation branches — cfg only reads it for automation).
  const CtrlIcon = a.type === "automation" ? CTRL_META[a.controlKind].icon : IcNib;

  // Per-type copy (ONE shell, typed content).
  const cfg =
    a.type === "routine"
      ? {
          kindIcon: <IcRepeat size={17} />,
          kindLabel: t("adv.act.routine_kind"),
          applyLabel: t("adv.act.routine_apply"),
          doneLabel: t("adv.act.routine_done"),
          linkLabel: t("adv.act.routine_link"),
        }
      : a.type === "auto_replies"
        ? {
            kindIcon: <IcReply size={17} />,
            kindLabel: t("adv.act.replies_kind"),
            applyLabel: t("adv.act.replies_apply"),
            doneLabel: t("adv.act.replies_done"),
            linkLabel: t("adv.act.replies_link"),
          }
        : a.type === "voice_rule"
          ? {
              kindIcon: <IcNib size={17} />,
              kindLabel: t("adv.act.voice_kind"),
              applyLabel: t("adv.act.voice_apply"),
              doneLabel: t("adv.act.voice_done"),
              linkLabel: t("adv.act.voice_link"),
            }
          : a.type === "schedule_post"
            ? {
                kindIcon: <IcClock size={17} />,
                kindLabel: t("adv.act.sched_kind"),
                applyLabel: t("adv.act.sched_apply"),
                doneLabel: t("adv.act.sched_done"),
                linkLabel: t("adv.act.sched_link"),
              }
            : a.type === "reactive"
              ? {
                  kindIcon: <IcChart size={17} />,
                  kindLabel: t("adv.act.react_kind"),
                  applyLabel: t("adv.act.react_apply"),
                  doneLabel: t("adv.act.react_done"),
                  linkLabel: t("adv.act.react_link"),
                }
              : a.type === "format"
                ? {
                    kindIcon: <IcNib size={17} />,
                    kindLabel: t("adv.act.fmt_kind"),
                    applyLabel: t("adv.act.fmt_apply"),
                    doneLabel: t("adv.act.fmt_done"),
                    linkLabel: t("adv.act.fmt_link"),
                  }
                : {
                    kindIcon: <CtrlIcon size={17} />,
                    kindLabel: t(CTRL_META[a.controlKind].kind),
                    applyLabel: t(CTRL_META[a.controlKind].apply),
                    doneLabel: t(CTRL_META[a.controlKind].done),
                    linkLabel: t("adv.act.ctrl_link"),
                  };

  if (state === "applied") {
    return (
      <div className="mb-[9px] flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg border border-border bg-surface-2 px-[15px] py-[11px]">
        <span className="grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full bg-[color-mix(in_srgb,var(--color-success)_16%,var(--color-surface))] text-success">
          <IcCheck size={14} />
        </span>
        <span className="min-w-0 flex-1 text-small text-text">{cfg.doneLabel}</span>
        <button
          type="button"
          onClick={a.onOpen}
          className="inline-flex items-center gap-1 text-small font-medium text-accent hover:underline"
        >
          {cfg.linkLabel}
          <IcArrowRight size={14} />
        </button>
      </div>
    );
  }

  const applying = state === "applying";
  const line = (icon: ReactNode, text: string) => (
    <div className="flex items-center gap-2">
      <span className="shrink-0 text-text-subtle">{icon}</span>
      <span className="min-w-0 truncate text-small text-text-muted">{text}</span>
    </div>
  );

  return (
    <div className="mb-[9px] rounded-lg border border-border border-l-[3px] border-l-accent bg-surface p-[14px] shadow-sm">
      <div className="flex items-center gap-[11px]">
        <span className={cn("grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[9px]", ACCENT_TILE)}>
          {cfg.kindIcon}
        </span>
        <div className="min-w-0">
          <div className="text-caption font-semibold uppercase tracking-[0.03em] text-text-subtle">
            {cfg.kindLabel}
          </div>
          <div className="truncate text-small font-semibold text-text">{a.title}</div>
        </div>
      </div>

      <div className="mt-[11px] flex flex-col gap-[7px]">
        {a.type === "routine" ? (
          <>
            {line(
              <IcClock size={15} />,
              `${a.timesPerDay}× ${t("adv.act.per_day")} · ~${a.hoursPreview.map((h) => `${h}:00`).join(", ")}`,
            )}
            {line(
              <IcNib size={15} />,
              a.topic.trim() ? `${t("adv.act.topic")}: ${a.topic.trim()}` : t("adv.act.any_topic"),
            )}
            {line(<IcNib size={15} />, t("adv.act.in_voice"))}
          </>
        ) : a.type === "auto_replies" ? (
          <>
            {line(<IcReply size={15} />, t(AUDIENCE_KEY[a.audience]))}
            {line(<IcRepeat size={15} />, `${t("adv.act.up_to")} ${a.repliesPerDay}× ${t("adv.act.per_day")}`)}
            {a.skipLowValue && line(<IcEye size={15} />, t("adv.act.skip_low"))}
          </>
        ) : a.type === "voice_rule" ? (
          <>
            {line(<IcNib size={15} />, `«${a.ruleText}»`)}
            {line(<IcEye size={15} />, t(VOICE_KIND_KEY[a.kind]))}
          </>
        ) : a.type === "schedule_post" ? (
          <>
            {line(<IcNib size={15} />, `«${a.brief}»`)}
            {line(<IcClock size={15} />, `${t("adv.act.sched_when")}: ${a.whenLabel}`)}
          </>
        ) : a.type === "reactive" ? (
          <>
            {line(<IcChart size={15} />, t(REACT_BODY_KEY[a.reactiveKind]))}
            {a.reactiveKind === "booster" &&
              a.commentText &&
              line(<IcReply size={15} />, `«${a.commentText}»`)}
          </>
        ) : a.type === "format" ? (
          a.formatKind === "daily_question" ? (
            <>
              {line(<IcRepeat size={15} />, t("adv.act.fmt_dq"))}
              {line(<IcNib size={15} />, `${t("adv.act.topic")}: ${a.topic}`)}
            </>
          ) : a.formatKind === "rubric" ? (
            <>
              {line(<IcRepeat size={15} />, `${t("adv.act.fmt_rubric")}: ${a.rubricName}`)}
              {line(<IcNib size={15} />, `«${a.rubricIdea}»`)}
            </>
          ) : (
            <>
              {line(<IcNib size={15} />, `${t("adv.act.fmt_poll")}: ${a.question}`)}
              {line(<IcChart size={15} />, (a.options ?? []).join(" · "))}
            </>
          )
        ) : a.controlKind === "quiet_hours" ? (
          <>
            {line(<IcMoon size={15} />, `${t("adv.act.ctrl_quiet_window")}: ${fmtWindow(a.quietStart, a.quietEnd)}`)}
            {line(<IcReply size={15} />, t("adv.act.ctrl_quiet_body"))}
          </>
        ) : a.controlKind === "pause" ? (
          <>{line(<IcPower size={15} />, t("adv.act.ctrl_pause_body"))}</>
        ) : (
          <>{line(<IcPlay size={15} />, t("adv.act.ctrl_resume_body"))}</>
        )}
      </div>

      {a.type === "routine" && a.timesPerDay > 1 && (
        <div className="mt-[10px] flex items-center gap-2 text-caption text-warning">
          <IcAlert size={14} className="shrink-0" />
          <span>{t("adv.act.cap_warn").replace("{n}", String(a.timesPerDay))}</span>
        </div>
      )}

      {a.type === "schedule_post" && (
        <div className="mt-[10px] flex items-center gap-2 text-caption text-warning">
          <IcAlert size={14} className="shrink-0" />
          <span>{t("adv.act.sched_quota")}</span>
        </div>
      )}

      {a.type === "automation" && a.controlKind === "pause" && (
        <div className="mt-[10px] flex items-center gap-2 text-caption text-warning">
          <IcAlert size={14} className="shrink-0" />
          <span>{t("adv.act.ctrl_pause_warn")}</span>
        </div>
      )}

      <div className="mt-[11px] flex items-start gap-2 rounded-md bg-[color-mix(in_srgb,var(--color-accent)_8%,var(--color-surface))] px-3 py-2 text-caption leading-[1.45] text-text-muted">
        {a.type === "routine" ? (
          <>
            <IcEye size={14} className="mt-px shrink-0 text-accent" />
            <span>{t("adv.act.mode_review")}</span>
          </>
        ) : a.type === "auto_replies" ? (
          <>
            <IcReply size={14} className="mt-px shrink-0 text-accent" />
            <span>{t("adv.act.mode_instant")}</span>
          </>
        ) : a.type === "voice_rule" ? (
          <>
            <IcNib size={14} className="mt-px shrink-0 text-accent" />
            <span>{t("adv.act.voice_mode")}</span>
          </>
        ) : a.type === "schedule_post" ? (
          <>
            <IcClock size={14} className="mt-px shrink-0 text-accent" />
            <span>{t("adv.act.sched_mode")}</span>
          </>
        ) : a.type === "reactive" ? (
          <>
            <IcEye size={14} className="mt-px shrink-0 text-accent" />
            <span>{t("adv.act.react_mode")}</span>
          </>
        ) : a.type === "format" ? (
          <>
            <IcEye size={14} className="mt-px shrink-0 text-accent" />
            <span>{t("adv.act.fmt_mode")}</span>
          </>
        ) : (
          <>
            <CtrlIcon size={14} className="mt-px shrink-0 text-accent" />
            <span>{t(CTRL_META[a.controlKind].mode)}</span>
          </>
        )}
      </div>

      {a.targetHandle && (
        <div className="mt-[11px] flex items-center gap-2 border-t border-border pt-[11px] text-caption text-text-subtle">
          <span className="font-medium text-text-muted">@{a.targetHandle}</span>
          <span>· {t("adv.act.affects")} · Threads</span>
        </div>
      )}

      {state === "error" && (
        <div className="mt-[11px] flex items-start gap-2 text-caption text-danger">
          <IcAlert size={15} className="mt-px shrink-0" />
          <span>
            <b>{t("adv.act.err_title")}.</b> {errText ?? t("adv.act.err_sub")}
          </span>
        </div>
      )}

      <div className="mt-[13px] flex flex-wrap gap-2 max-[420px]:flex-col">
        {/* Hide the primary button on a definitive 4xx (errText set) — a Retry can't
            succeed; the user reads the reason and dismisses. */}
        {!(state === "error" && errText !== null) && (
          <button
            type="button"
            onClick={apply}
            disabled={applying}
            className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-small font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60 max-[420px]:w-full"
          >
            {applying ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
                {t("adv.act.applying")}
              </>
            ) : state === "error" ? (
              <>
                <IcUndo size={15} />
                {t("advisor.retry")}
              </>
            ) : (
              cfg.applyLabel
            )}
          </button>
        )}
        <button
          type="button"
          onClick={() => setDismissed(true)}
          disabled={applying}
          className="inline-flex items-center justify-center rounded-md px-3 py-2 text-small font-medium text-text-muted transition-colors hover:bg-surface-2 hover:text-text disabled:opacity-60 max-[420px]:w-full"
        >
          {t("adv.act.cancel")}
        </button>
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
  actions?: AdvisorActionCardData[];
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
      {content.actions && content.actions.length > 0 && (
        <div className="mt-[11px]">
          {content.actions.map((a, i) => (
            <ActionCard key={i} a={a} />
          ))}
        </div>
      )}
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
