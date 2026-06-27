"use client";

// «Отвечать на комментарии» — the built-in reply routine card (Autopilot-Reply-
// Card-SPEC + Reply-Settings-Gallery-SPEC §1). ALWAYS present, pinned FIRST in the
// routine list under a «Встроенная» group label. It is NOT a user scenario — it
// reflects the account's real reply mode, so it NEVER has a «Удалить» action.
//
// Three states:
//   ON   — «отвечает людям» + «встроенная» badges; a living sentence «Отвечает на
//          комментарии <audience>, в твоём голосе. Частоту и тихие часы берёт из
//          Правил дома.»; status «Активна»; footer facts «отвечает сама · без
//          подтверждения · ~15 мин» + «из Правил дома» chip + «Активность» (→
//          /app/replies) + «Настроить» (→ the preset gallery).
//   OFF  — a «.sc-createdoff»-style banner «Ответы выключены — включи, когда
//          будешь готов» + «Включить»; no plaque/chips.
//   PAUSED (coexistence) — when an active reply_policy scenario exists, the card
//          dims to «На паузе» «Заменена сценарием …» (the custom scenario then
//          shows below carrying a «перебивает дефолт» badge).
//
// Uses the unified badge system (Badges.tsx). All Tailwind + semantic tokens.

import Link from "next/link";

import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  IcBubble,
  IcCheck,
  IcReplies,
  IcRepeat,
  IcSliders,
  IcSwap,
} from "@/components/icons";
import { Badge, InheritChip, StatusBadge } from "./Badges";
import { audiencePhraseKey } from "./reply-audience";

export type ReplyRoutineCardProps = {
  /** Reply routine on/off (= account reply mode ≠ off). Ignored while paused. */
  on: boolean;
  /** Coexistence: an active custom reply_policy scenario overrides the sweep —
   *  the card dims to «На паузе» «Заменена сценарием {scenarioName}». */
  paused?: boolean;
  /** The overriding scenario's name (paused state) + an «Open it» link target. */
  scenarioName?: string;
  onOpenScenario?: () => void;
  /** Currently-selected audience preset id (built-in enum or a text/custom id) +
   *  the user's audience description — together they build the living sentence. */
  audienceId: string;
  audienceDescription?: string;
  onToggle: (on: boolean) => void;
  /** «Настроить» → opens the «кому отвечать» preset gallery (the primary path). */
  onConfigure: () => void;
  /** «Активность» → the account Replies screen (default /app/replies). */
  activityHref?: string;
  /** Last auto-reply, e.g. «12 мин назад» — omitted when never / off. */
  lastReplyLabel?: string;
};

export function ReplyRoutineCard({
  on,
  paused = false,
  scenarioName,
  onOpenScenario,
  audienceId,
  audienceDescription,
  onToggle,
  onConfigure,
  activityHref = "/app/replies",
  lastReplyLabel,
}: ReplyRoutineCardProps) {
  const { t } = useTranslation();
  const active = on && !paused;

  // Living sentence audience phrase: a built-in preset reads its own phrase; a
  // text/custom preset reads the user's description (trimmed), falling back to a
  // generic «тем, кого ты описал».
  const phraseKey = audiencePhraseKey(audienceId);
  const audiencePhrase = phraseKey
    ? t(phraseKey)
    : (audienceDescription ?? "").trim() || t("ap.reply.phrase.described");

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-surface p-4 shadow-sm transition-colors md:p-[18px]",
        active ? "hover:border-text/15 hover:shadow-md" : "opacity-[0.82]",
      )}
    >
      <div className={cn("flex items-start gap-3", paused && "opacity-50")}>
        <span
          className={cn(
            "grid h-10 w-10 shrink-0 place-items-center rounded-md border",
            active ? "border-success/30 bg-success/12 text-success" : "border-border bg-surface-2 text-text-muted",
          )}
        >
          <IcBubble size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-body font-semibold tracking-tight">{t("ap.reply.title")}</h3>
          {/* living sentence */}
          <p className="mt-1 text-caption leading-normal text-text-muted">
            {paused ? (
              t("ap.reply.line.paused")
            ) : active ? (
              <SentenceWithRules audience={audiencePhrase} />
            ) : (
              t("ap.reply.line.off")
            )}
          </p>
          {/* property badges (under the subtitle, not the title row) */}
          {active && (
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <Badge tone="neutral" icon={<IcReplies />}>{t("ap.reply.badge.answers_people")}</Badge>
              <Badge tone="neutral" icon={<IcSliders />}>{t("ap.reply.badge.builtin")}</Badge>
            </div>
          )}
        </div>
        {/* status (only family with a dot) + toggle — paused: dot+switch stay
            visible but the row dims; the toggle is disabled while a scenario rules */}
        <div className="flex shrink-0 flex-col items-end gap-2">
          <StatusBadge tone={paused ? "paused" : active ? "on" : "off"}>
            {paused ? t("scenarios.paused_status") : active ? t("scenarios.status_on") : t("scenarios.status_off")}
          </StatusBadge>
          <Switch checked={active} onCheckedChange={onToggle} disabled={paused} aria-label={t("ap.reply.title")} />
        </div>
      </div>

      {/* OFF banner — «Ответы выключены — включи, когда будешь готов» */}
      {!on && !paused && (
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-md border border-warning/30 bg-warning/[0.06] px-3 py-2.5">
          <span className="min-w-0 flex-1 text-small leading-[1.45] text-text">
            <b className="font-semibold">{t("ap.reply.off_title")}</b> {t("ap.reply.off_body")}
          </span>
          <Button size="sm" variant="primary" icon={<IcCheck size={14} />} onClick={() => onToggle(true)} className="shrink-0 max-sm:w-full">
            {t("ap.reply.turn_on")}
          </Button>
        </div>
      )}

      {/* PAUSED — «Заменена сценарием …» with a link to the overriding scenario */}
      {paused && (
        <div className="mt-3 flex flex-wrap items-start gap-3 rounded-md border border-accent/24 bg-accent/[0.07] px-3.5 py-3">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-sm bg-accent/[0.13] text-accent">
            <IcSwap size={15} />
          </span>
          <p className="min-w-0 flex-1 text-small leading-normal text-text">
            <b className="font-semibold">{t("ap.reply.replaced_title").replace("{name}", scenarioName ?? "")}</b>{" "}
            {t("ap.reply.replaced_body")}{" "}
            <button type="button" onClick={onOpenScenario} className="font-semibold text-accent underline underline-offset-2">
              {t("ap.reply.replaced_open")}
            </button>
          </p>
        </div>
      )}

      {/* footer — facts on the left, «Активность» + «Настроить» on the right */}
      <div className="mt-3.5 flex flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1.5">
          {active ? (
            <>
              <span className="inline-flex items-center gap-2 text-caption leading-snug text-text-muted">
                <IcRepeat size={13} className="shrink-0" />
                <span>
                  <b className="font-semibold text-text">{t("ap.reply.foot.self")}</b> {t("ap.reply.foot.self_sub")}
                </span>
              </span>
              <span className="inline-flex flex-wrap items-center gap-2 text-caption leading-snug text-text-subtle">
                <InheritChip icon={<IcSliders />}>{t("ap.inherit")}</InheritChip>
                <span>{t("ap.reply.foot.limits")}</span>
                {lastReplyLabel && <span className="tabular-nums">· {t("ap.reply.foot.last").replace("{when}", lastReplyLabel)}</span>}
              </span>
            </>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-caption text-text-subtle">
              {paused ? (
                <>
                  <IcSwap size={13} /> {t("ap.reply.foot.yields")}
                </>
              ) : (
                t("ap.reply.foot.off")
              )}
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2 max-sm:w-full">
          <Link
            href={activityHref}
            className="inline-flex h-9 shrink-0 items-center rounded-md border border-border px-3 text-small font-medium text-text-muted transition-colors hover:bg-surface-2 hover:text-text max-sm:flex-1 max-sm:justify-center"
          >
            {t("scenarios.activity.title")}
          </Link>
          <Button size="sm" variant="secondary" icon={<IcSliders size={13} />} onClick={onConfigure} className="shrink-0 max-sm:flex-1">
            {t("ap.reply.configure")}
          </Button>
        </div>
      </div>
    </div>
  );
}

// «Отвечает на комментарии <b>{audience}</b>, в твоём голосе. Частоту и тихие
// часы берёт <span class=who>из Правил дома</span>.» — built from a copy string
// with {audience} (bolded) and an <a>…</a> marker for the «из Правил дома» phrase.
function SentenceWithRules({ audience }: { audience: string }) {
  const { t } = useTranslation();
  const raw = t("ap.reply.line.on"); // "Отвечает на комментарии {audience}, в твоём голосе. Частоту и тихие часы берёт <a>из Правил дома</a>."
  const aOpen = raw.indexOf("<a>");
  const aClose = raw.indexOf("</a>");
  const before = aOpen === -1 ? raw : raw.slice(0, aOpen);
  const link = aOpen === -1 ? "" : raw.slice(aOpen + 3, aClose);
  const after = aClose === -1 ? "" : raw.slice(aClose + 4);
  const parts = before.split("{audience}");
  return (
    <>
      {parts[0]}
      <b className="font-semibold text-text">{audience}</b>
      {parts[1] ?? ""}
      {link && <span className="text-text-subtle">{link}</span>}
      {after}
    </>
  );
}
