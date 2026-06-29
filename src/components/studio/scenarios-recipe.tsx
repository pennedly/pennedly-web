"use client";

// «Карточка-рецепт» building blocks — the Wave-1 scenario editor primitives,
// ported 1:1 from design-export/PennedlyDesign/recipe-editor/{recipe-editor.js,
// recipe-editor.css}. A scenario reads as ONE sentence with editable «slots»;
// tapping a slot opens an inline drawer in place (only one open at a time). The
// shell + preview live in scenarios-editor.tsx; this file holds the slot, drawer,
// the КОГДА / ЕСЛИ / ЧТО / КАК / КОМУ / ТОН drawer bodies, and the big-text modal.
//
// Wave progress: monthly/yearly cadence (Wave 3) and weekly multi-day + everyN
// «Начиная с» start-date (Wave 2) are now LIVE. Still cut: the «когда упомянут»
// event, multi-slot times, per-day times, period sub-rhythm, and the 3 «по будням
// / подписчики / дата в тексте» conditions are simply omitted. Layer 3 is the one
// honest «скоро» stub by design.

import { type ReactNode, useState } from "react";

import { cn } from "@/lib/cn";
import { useTranslation, type MessageKey } from "@/lib/i18n";
import { localHourToUtc, localUtcOffsetLabel } from "@/lib/timezone";
import {
  IcBolt,
  IcBubble,
  IcBubbleQuestion,
  IcCheck,
  IcClock,
  IcExpand,
  IcEye,
  IcGauge,
  IcHeart,
  IcInfo,
  IcLink,
  IcLock,
  IcMoon,
  IcPencil,
  IcPerson,
  IcPlus,
  IcRepeat,
  IcShield,
  IcShieldHouse,
  IcSliders,
  IcTarget,
  IcTimer,
  IcUndo,
  IcX,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  BOOST_DEFAULT_THRESHOLD,
  BOOST_PRESETS,
  type BoostMetric,
  type BoostTargetType,
  daysInMonth,
  L3_LIMIT_SLIDER_MAX,
  L3_LIMIT_SLIDER_MIN,
  MONTHS,
  PER_DAY_DEFAULT,
  type CooldownUnit,
  type FormState,
  type MonthDate,
  type MonthlyMissing,
  normalizeMilestoneTargets,
  type RecipeEvent,
  type RecipeLength,
} from "./scenarios-form";
import { type ReplyFreq } from "./HouseRules";

type T = (k: MessageKey) => string;

// Which slot's inline drawer is open (only one at a time), or null. The boost
// recipe adds two: «target» (which posts to watch) + «metric» (metric+threshold).
export type OpenSlot = "when" | "if" | "what" | "who" | "tone" | "how" | "target" | "metric" | null;
// Which big-text modal is open (instruction / tone / custom audience / boost
// comment / attached-boost comment), or null. The boost's pre-written comment uses
// the same big-text modal; `attachBoost` is entry C's companion-boost comment.
export type BigTextField = "instruction" | "tone" | "audience" | "boost" | "attachBoost" | null;

// ════════════════════════════════════════════════════════════════════════════
//  SLOT — an editable word in the recipe sentence (style v9: dark bold + grey
//  dotted underline; hover/open → accent). `@handle` is rendered separately
//  (violet, non-clickable) by the editor.
// ════════════════════════════════════════════════════════════════════════════
export function Slot({ children, open, onClick }: { children: ReactNode; open?: boolean; onClick: () => void }) {
  return (
    // A true inline <span>, NOT a <button>: a button is inline-block (an atomic
    // box), so a slot that wraps to two lines becomes a centered block instead of
    // flowing with the prose. A span flows inline and its dotted underline follows
    // the text across the line break (design §1: «Слот = inline-span, переносится
    // по словам»). role/tabIndex/keydown keep it keyboard-accessible.
    <span
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        "cursor-pointer px-px font-semibold underline decoration-dotted decoration-[1.5px] underline-offset-4 outline-offset-2 transition-colors",
        open ? "text-accent decoration-accent" : "text-text decoration-text-subtle/75 hover:text-accent hover:decoration-accent",
      )}
    >
      {children}
    </span>
  );
}

// A locked slot — value fixed by the platform (reply polls every 15 min). Dotted
// border-bottom, muted, not clickable.
export function LockSlot({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-[5px] border-b border-dotted border-border px-px font-semibold text-text-muted">
      <IcLock size={11} className="shrink-0 opacity-60" />
      {children}
    </span>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  INLINE DRAWER — the slot's editor, opened in place under the sentence.
// ════════════════════════════════════════════════════════════════════════════
export function Drawer({
  title,
  icon,
  onDone,
  children,
}: {
  title: string;
  icon: ReactNode;
  onDone: () => void;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <div className="animate-[rcd-in_180ms_ease-out] border-t border-border bg-surface-2">
      <div className="flex items-center gap-2.5 px-[22px] pt-3.5">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-sm border border-accent/24 bg-accent/[0.11] text-accent">
          {icon}
        </span>
        <span className="flex-1 text-small font-semibold">{title}</span>
        <button
          type="button"
          onClick={onDone}
          className="inline-flex items-center gap-1.5 rounded-sm bg-primary px-3.5 py-1.5 text-small font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <IcCheck size={14} /> {t("scenarios.rc.done")}
        </button>
      </div>
      <div className="flex flex-col gap-[15px] px-[22px] pb-5 pt-3.5">{children}</div>
    </div>
  );
}

// ── micro-helpers shared by drawer bodies ──
// `children` may be a trusted i18n string with <b> emphasis (rendered as HTML)
// or arbitrary nodes.
export function Why({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-start gap-2 text-caption leading-[1.5] text-text-subtle [&_b]:font-semibold [&_b]:text-text-muted">
      <IcInfo size={13} className="mt-px shrink-0 opacity-80" />
      {typeof children === "string" ? <span dangerouslySetInnerHTML={{ __html: children }} /> : <span>{children}</span>}
    </p>
  );
}
export function Hard({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-start gap-[7px] rounded-sm border border-border bg-surface px-[11px] py-2 text-caption leading-[1.45] text-text-subtle">
      <IcLock size={13} className="mt-px shrink-0 opacity-85" />
      <span>{children}</span>
    </p>
  );
}
function FieldLabel({ children, opt }: { children: ReactNode; opt?: string }) {
  return (
    <span className="text-small font-medium text-text">
      {children}
      {opt && <span className="text-text-subtle"> · {opt}</span>}
    </span>
  );
}
function Stepper({ value, onMinus, onPlus, suffix }: { value: ReactNode; onMinus: () => void; onPlus: () => void; suffix?: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2.5 text-small text-text">
      <span className="inline-flex items-center overflow-hidden rounded-sm border border-border bg-surface">
        <button type="button" onClick={onMinus} aria-label="−" className="grid h-8 w-[30px] place-items-center text-base text-text-muted transition-colors hover:bg-surface-2 hover:text-text">
          –
        </button>
        <span className="grid h-8 min-w-[42px] place-items-center border-x border-border px-1 text-small font-semibold tabular-nums">{value}</span>
        <button type="button" onClick={onPlus} aria-label="+" className="grid h-8 w-[30px] place-items-center text-base text-text-muted transition-colors hover:bg-surface-2 hover:text-text">
          +
        </button>
      </span>
      {suffix}
    </span>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  КОГДА (POST) — cadence segment (5 modes) + hour picker + jitter slider
// ════════════════════════════════════════════════════════════════════════════
// Cadence modes. Wave 3 (decision б reversed) un-hides «Раз в месяц» / «Раз в
// год», restoring the design's full 7-mode segment.
const CADENCE_MODES: { key: FormState["when"]; label: MessageKey }[] = [
  { key: "daily", label: "scenarios.rc.cad.daily" },
  { key: "every_n_days", label: "scenarios.rc.cad.every_n" },
  { key: "weekly", label: "scenarios.rc.cad.weekly" },
  { key: "monthly", label: "scenarios.rc.cad.monthly" },
  { key: "yearly", label: "scenarios.rc.cad.yearly" },
  { key: "date_range", label: "scenarios.rc.cad.period" },
  { key: "event", label: "scenarios.rc.cad.event" },
];
const RC_WEEKDAYS: MessageKey[] = [
  "scenarios.wd.mon",
  "scenarios.wd.tue",
  "scenarios.wd.wed",
  "scenarios.wd.thu",
  "scenarios.wd.fri",
  "scenarios.wd.sat",
  "scenarios.wd.sun",
];

function Seg({ options, value, onPick }: { options: { key: string; label: string }[]; value: string; onPick: (k: string) => void }) {
  return (
    // w-fit so the pill track hugs its options instead of stretching the grey
    // background to the full column width when everything already fits.
    <div className="flex w-fit max-w-full flex-wrap gap-1 rounded-lg border border-border bg-surface-2 p-1">
      {options.map((o) => {
        const active = o.key === value;
        return (
          <button
            key={o.key}
            type="button"
            onClick={() => onPick(o.key)}
            aria-pressed={active}
            className={cn(
              "rounded-md px-3 py-2 text-small font-medium leading-none transition-colors max-md:min-h-[40px]",
              active ? "bg-surface text-text shadow-sm" : "text-text-muted hover:text-text",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// A single removable time-slot chip — a 0–23 hour picker + an «×» remove button
// (the design's `.rc-slotchip` + `.scx`). Remove hides on the last slot so the
// list can never go empty. The chip shows the local hour; the UTC equivalent is
// summarised once below the whole list.
function SlotChip({
  hour,
  canRemove,
  onChange,
  onRemove,
}: {
  hour: number;
  canRemove: boolean;
  onChange: (h: number) => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation();
  return (
    <span className="inline-flex items-center gap-[7px] rounded-full border border-border bg-surface py-1.5 pl-[11px] pr-2 text-small font-semibold tabular-nums text-text">
      <IcClock size={13} className="text-text-subtle" />
      <select
        aria-label={t("scenarios.rc.when_time")}
        className="cursor-pointer border-none bg-transparent text-small font-semibold tabular-nums text-text outline-none"
        value={`${hour}:00`}
        onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
      >
        {Array.from({ length: 24 }, (_, i) => `${i}:00`).map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>
      {canRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={t("a11y.remove")}
          className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full text-text-subtle transition-colors hover:bg-surface-2 hover:text-text"
        >
          <IcX size={12} />
        </button>
      )}
    </span>
  );
}

// A single multi-slot time list: the removable hour chips + the «+ Ещё время»
// button. Shared by `TimeSection` (the shared list) and the per-weekday rows
// («Разное время в разные дни»). The list is normalized (deduped, sorted) on every
// change so the chip order + the emitted hours always agree. `addLabel` defaults to
// «+ Ещё время»; the per-day rows pass `compactAdd` for the design's icon-only «+».
function SlotList({
  hours,
  onHours,
  compactAdd,
}: {
  hours: number[];
  onHours: (h: number[]) => void;
  compactAdd?: boolean;
}) {
  const { t } = useTranslation();
  // Always render at least one slot (the form seeds ≥1; this guards stray empties).
  const slots = hours.length > 0 ? hours : [0];
  // Append the next free hour (so a fresh slot doesn't collide with an existing
  // one and vanish on the dedup); fall back to the last hour when all 24 are used.
  function addSlot() {
    const used = new Set(slots);
    let next = (slots[slots.length - 1] + 1) % 24;
    for (let i = 0; i < 24 && used.has(next); i++) next = (next + 1) % 24;
    onHours(normalize([...slots, next]));
  }
  function changeSlot(i: number, h: number) {
    onHours(normalize(slots.map((cur, n) => (n === i ? h : cur))));
  }
  function removeSlot(i: number) {
    const next = slots.filter((_, n) => n !== i);
    onHours(normalize(next.length > 0 ? next : slots.slice(0, 1)));
  }
  // Dedup + sort to mirror the backend's stored shape (so the chip order + the
  // emitted `hours` array always agree, and never 422s).
  function normalize(list: number[]): number[] {
    return Array.from(new Set(list.filter((h) => h >= 0 && h <= 23))).sort((a, b) => a - b);
  }
  return (
    <span className="flex flex-wrap items-center gap-2">
      {slots.map((h, i) => (
        <SlotChip key={`${h}-${i}`} hour={h} canRemove={slots.length > 1} onChange={(v) => changeSlot(i, v)} onRemove={() => removeSlot(i)} />
      ))}
      <button
        type="button"
        onClick={addSlot}
        aria-label={t("scenarios.rc.add_time")}
        className="inline-flex items-center gap-[5px] rounded-full border border-dashed border-accent/36 bg-accent/[0.09] px-3 py-1.5 text-small font-semibold text-accent transition-colors hover:bg-accent/15"
      >
        <IcPlus size={13} /> {!compactAdd && t("scenarios.rc.add_time")}
      </button>
    </span>
  );
}

// The slot list («несколько раз в день») + jitter slider (cadence modes only).
// Each slot is a removable 0–23 hour picker; «+ Ещё время» appends one. Whole-hour
// posting → the .rc-hard caption; the UTC equivalents of all slots are summarised
// under the list.
function TimeSection({ hours, jitter, onHours, onJitter }: { hours: number[]; jitter: number; onHours: (h: number[]) => void; onJitter: (j: number) => void }) {
  const { t } = useTranslation();
  const slots = hours.length > 0 ? hours : [0];
  const utcLabel = slots.map((h) => `${String(localHourToUtc(h)).padStart(2, "0")}:00`).join(", ");
  return (
    <>
      <label className="flex flex-col gap-1.5">
        <FieldLabel opt={t("scenarios.rc.when_time_opt")}>{t("scenarios.rc.when_time")}</FieldLabel>
        <SlotList hours={hours} onHours={onHours} />
        <span className="text-caption tabular-nums text-text-subtle">
          {localUtcOffsetLabel()} · {t("scenarios.ed.sends_utc").replace("{time}", utcLabel)}
        </span>
      </label>
      <label className="flex flex-col gap-1.5">
        <FieldLabel opt={t("scenarios.rc.jitter_opt")}>{t("scenarios.rc.jitter")}</FieldLabel>
        <Stepper
          value={jitter}
          onMinus={() => onJitter(Math.max(0, jitter - 5))}
          onPlus={() => onJitter(Math.min(120, jitter + 5))}
          suffix={<span className="text-caption font-medium text-text-muted">{t("scenarios.rc.jitter_unit")}</span>}
        />
      </label>
      <Hard>{t("scenarios.rc.when_hard")}</Hard>
    </>
  );
}

// «Разное время в разные дни» — the design's `toggleRow`: a title + sub-line on the
// left, a Switch on the right (the recipe-editor.css `.rc-toggle-row`).
function ToggleRow({ title, sub, on, onToggle }: { title: string; sub: string; on: boolean; onToggle: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3.5 rounded-md border border-border bg-surface px-[13px] py-[11px]">
      <div className="min-w-0">
        <div className="text-small font-medium text-text">{title}</div>
        <div className="mt-0.5 text-caption leading-[1.4] text-text-subtle">{sub}</div>
      </div>
      <Switch checked={on} onCheckedChange={onToggle} aria-label={title} />
    </div>
  );
}

// «Время по дням» — the per-weekday time editor (design `perDayTimes`): one
// `.daytime-row` per SELECTED weekday (day label 40px + that day's own multi-slot
// `SlotList`). A day's empty list means no post that day. Seeds a missing day's
// list from the design defaults (`PER_DAY_DEFAULT`) so a freshly-selected day shows
// a sensible time. Editing writes back into `form.perDayTimes[weekday]`.
function PerDayTimes({
  weekdays,
  perDayTimes,
  onChange,
}: {
  weekdays: number[];
  perDayTimes: Record<number, number[]>;
  onChange: (wd: number, hours: number[]) => void;
}) {
  const { t } = useTranslation();
  const days = [...new Set(weekdays.filter((d) => d >= 0 && d <= 6))].sort((a, b) => a - b);
  return (
    <label className="flex flex-col gap-2">
      <FieldLabel>{t("scenarios.rc.per_day_label")}</FieldLabel>
      {days.length === 0 ? (
        <span className="text-caption text-text-subtle">{t("scenarios.rc.per_day_empty")}</span>
      ) : (
        <div className="flex flex-col">
          {days.map((wd) => {
            const hours = perDayTimes[wd] && perDayTimes[wd].length > 0 ? perDayTimes[wd] : PER_DAY_DEFAULT[wd] ?? [9];
            return (
              <div key={wd} className="flex items-center gap-3 border-t border-border py-[9px] first:border-t-0 first:pt-0.5">
                <span className="w-10 shrink-0 text-small font-semibold text-text">{t(RC_WEEKDAYS[wd])}</span>
                <span className="min-w-0 flex-1">
                  <SlotList hours={hours} onHours={(h) => onChange(wd, h)} compactAdd />
                </span>
              </div>
            );
          })}
        </div>
      )}
    </label>
  );
}

// Shared «.field» styling for the day/month selects (recipe-editor.css `.field`).
const FIELD_SELECT =
  "h-10 cursor-pointer rounded-md border border-border bg-surface px-3 text-small text-text focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25";

// ── «Раз в месяц» — the 31-cell day-of-month grid (`domGrid`) ──
// Toggling a cell adds/removes that day; days 29–31 are `.dom-rare` (muted, since
// they're absent from short months). The «Последний день месяца» button sits
// below the grid. When ANY chosen day is > 28, the missing-day fallback select
// appears («Опубликовать в последний день месяца» / «Пропустить этот месяц»).
function DomGrid({
  days,
  lastDay,
  onMissing,
  onToggleDay,
  onToggleLast,
  onMissingChange,
}: {
  days: number[];
  lastDay: boolean;
  onMissing: MonthlyMissing;
  onToggleDay: (d: number) => void;
  onToggleLast: () => void;
  onMissingChange: (v: MonthlyMissing) => void;
}) {
  const { t } = useTranslation();
  const hasRare = days.some((d) => d > 28);
  return (
    <>
      <div className="grid grid-cols-7 gap-[5px]">
        {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => {
          const on = days.includes(d);
          const rare = d > 28;
          return (
            <button
              key={d}
              type="button"
              aria-pressed={on}
              onClick={() => onToggleDay(d)}
              className={cn(
                "grid h-8 place-items-center rounded-sm border text-small font-medium tabular-nums transition-colors",
                on
                  ? "border-primary bg-primary font-semibold text-primary-foreground"
                  : rare
                    ? "border-border bg-surface text-text-subtle hover:border-text/16"
                    : "border-border bg-surface text-text-muted hover:border-text/16",
              )}
            >
              {d}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        aria-pressed={lastDay}
        onClick={onToggleLast}
        className={cn(
          "grid h-[34px] w-full place-items-center rounded-sm border text-small font-medium transition-colors",
          lastDay ? "border-primary bg-primary font-semibold text-primary-foreground" : "border-border bg-surface text-text-muted hover:border-text/16",
        )}
      >
        {t("scenarios.rc.dom_last")}
      </button>
      <p className="flex items-start gap-[7px] text-caption leading-[1.45] text-text-subtle [&_b]:font-semibold [&_b]:text-text-muted">
        <IcInfo size={12} className="mt-px shrink-0 opacity-80" />
        <span dangerouslySetInnerHTML={{ __html: t("scenarios.rc.dom_note") }} />
      </p>
      {hasRare && (
        <div className="flex flex-col gap-2 rounded-md border border-warning/26 bg-warning/[0.07] px-[13px] py-[11px]">
          <span className="flex items-center gap-[7px] text-caption font-semibold text-warning">
            <IcInfo size={13} className="shrink-0" /> {t("scenarios.rc.dom_fallback_label")}
          </span>
          <select
            aria-label={t("scenarios.rc.dom_fallback_label")}
            className={cn(FIELD_SELECT, "max-w-[320px]")}
            value={onMissing}
            onChange={(e) => onMissingChange(e.target.value as MonthlyMissing)}
          >
            <option value="last">{t("scenarios.rc.dom_missing_last")}</option>
            <option value="skip">{t("scenarios.rc.dom_missing_skip")}</option>
          </select>
        </div>
      )}
    </>
  );
}

// ── «Раз в год» — a list of (day × month) anchors (`yearDates`) ──
// Each row is a day-select (only the chosen month's real days) × a month-select;
// changing the month re-clamps the day. «Добавить дату» appends a new row; the
// remove × hides on the last remaining row so the list can't go empty.
function YearDates({
  dates,
  onAdd,
  onRemove,
  onChange,
}: {
  dates: MonthDate[];
  onAdd: () => void;
  onRemove: (i: number) => void;
  onChange: (i: number, next: MonthDate) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-2">
      {dates.map((d, i) => {
        const dim = daysInMonth(d.month);
        return (
          <div key={i} className="flex items-center gap-2">
            <select
              aria-label={t("scenarios.rc.yd_day")}
              className={cn(FIELD_SELECT, "max-w-[132px] tabular-nums")}
              value={d.day}
              onChange={(e) => onChange(i, { ...d, day: Number(e.target.value) })}
            >
              {Array.from({ length: dim }, (_, n) => n + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <select
              aria-label={t("scenarios.rc.yd_month")}
              className={cn(FIELD_SELECT, "max-w-[132px]")}
              value={d.month}
              onChange={(e) => {
                const month = Number(e.target.value);
                onChange(i, { day: Math.min(d.day, daysInMonth(month)), month });
              }}
            >
              {MONTHS.map((mk, mi) => (
                <option key={mi} value={mi}>
                  {t(mk)}
                </option>
              ))}
            </select>
            {dates.length > 1 && (
              <button
                type="button"
                onClick={() => onRemove(i)}
                aria-label={t("a11y.remove")}
                className="grid h-7 w-7 shrink-0 place-items-center rounded-sm text-text-subtle transition-colors hover:bg-surface-2 hover:text-danger"
              >
                <IcX size={14} />
              </button>
            )}
          </div>
        );
      })}
      <button
        type="button"
        onClick={onAdd}
        className="inline-flex items-center gap-[5px] self-start rounded-full border border-dashed border-accent/36 bg-accent/[0.09] px-3 py-1.5 text-small font-semibold text-accent transition-colors hover:bg-accent/15"
      >
        <IcPlus size={13} /> {t("scenarios.rc.yd_add")}
      </button>
      <p className="mt-px flex items-start gap-[7px] text-caption leading-[1.45] text-text-subtle [&_b]:font-semibold [&_b]:text-text-muted">
        <IcInfo size={12} className="mt-px shrink-0 opacity-80" />
        <span dangerouslySetInnerHTML={{ __html: t("scenarios.rc.yd_note") }} />
      </p>
    </div>
  );
}

// «Круглое число подписчиков» — the editable milestone ladder. Each rung is a
// removable chip; a draft input adds new positive integers (deduped + sorted).
// An empty ladder is valid — buildTrigger omits `targets` and the backend falls
// back to its default ladder.
function MilestoneLadder({ form, update }: { form: FormState; update: (patch: Partial<FormState>) => void }) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState("");
  const targets = form.milestoneTargets;
  const add = () => {
    const n = Number(draft.replace(/\D/g, ""));
    if (!Number.isInteger(n) || n <= 0) {
      setDraft("");
      return;
    }
    update({ milestoneTargets: normalizeMilestoneTargets([...targets, n]) });
    setDraft("");
  };
  const remove = (n: number) => update({ milestoneTargets: targets.filter((x) => x !== n) });
  return (
    <label className="flex flex-col gap-1.5">
      <FieldLabel>{t("scenarios.field.milestone_targets")}</FieldLabel>
      <div className="flex flex-wrap items-center gap-1.5">
        {targets.map((n) => (
          <span
            key={n}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2 py-1 pl-3 pr-1.5 text-small font-semibold tabular-nums text-text"
          >
            {n.toLocaleString("en-US")}
            <button
              type="button"
              onClick={() => remove(n)}
              aria-label={t("a11y.remove")}
              className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-text-subtle transition-colors hover:bg-surface hover:text-danger"
            >
              <IcX size={12} />
            </button>
          </span>
        ))}
        <span className="inline-flex items-center gap-1">
          <input
            type="text"
            inputMode="numeric"
            aria-label={t("scenarios.field.milestone_targets_add")}
            placeholder={t("scenarios.field.milestone_targets_ph")}
            className="h-8 w-[88px] rounded-md border border-border bg-surface px-2.5 text-small tabular-nums text-text focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
          />
          <button
            type="button"
            onClick={add}
            aria-label={t("scenarios.field.milestone_targets_add")}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-dashed border-accent/36 bg-accent/[0.09] text-accent transition-colors hover:bg-accent/15"
          >
            <IcPlus size={14} />
          </button>
        </span>
      </div>
      <span className="text-caption text-text-subtle">{t("scenarios.field.milestone_targets_hint")}</span>
    </label>
  );
}

export function WhenPostBody({
  form,
  update,
}: {
  form: FormState;
  update: (patch: Partial<FormState>) => void;
}) {
  const { t } = useTranslation();
  const mode = form.when;
  // The slot list edits `hours`; keep the primary `hour` string synced to the
  // first (sorted) slot so the sentence + «Следующие N запусков» (which read
  // `form.hour`) reflect the earliest time. The list always stays ≥ 1.
  const setHours = (next: number[]) => {
    const list = next.length > 0 ? next : [0];
    update({ hours: list, hour: `${list[0]}:00` });
  };
  // «Разное время в разные дни» toggle. Turning ON seeds each selected weekday's
  // list from the design defaults (so every row shows a sensible time), but never
  // overwrites a day that already has saved times. Turning OFF keeps the map (a
  // re-toggle restores the rows); only the OFF state's flat `hours` then emits.
  const setPerDay = (on: boolean) => {
    if (!on) {
      update({ perDay: false });
      return;
    }
    const seeded: Record<number, number[]> = { ...form.perDayTimes };
    for (const wd of form.weekdays) {
      if (!seeded[wd] || seeded[wd].length === 0) seeded[wd] = PER_DAY_DEFAULT[wd] ?? [9];
    }
    update({ perDay: true, perDayTimes: seeded });
  };
  // Edit one weekday's per-day time list (deduped/sorted already by SlotList).
  const setPerDayHours = (wd: number, hours: number[]) => {
    update({ perDayTimes: { ...form.perDayTimes, [wd]: hours } });
  };
  return (
    <>
      <label className="flex flex-col gap-1.5">
        <FieldLabel>{t("scenarios.rc.how_often")}</FieldLabel>
        <Seg
          options={CADENCE_MODES.map((m) => ({ key: m.key, label: t(m.label) }))}
          value={mode}
          onPick={(k) => update({ when: k as FormState["when"] })}
        />
      </label>

      {mode === "daily" && (
        <>
          <Why>{t("scenarios.rc.daily_why")}</Why>
          <TimeSection hours={form.hours} jitter={form.jitter} onHours={setHours} onJitter={(j) => update({ jitter: j })} />
        </>
      )}

      {mode === "every_n_days" && (
        <>
          <label className="flex flex-col gap-1.5">
            <FieldLabel>{t("scenarios.rc.interval")}</FieldLabel>
            <Stepper
              value={form.nDays}
              onMinus={() => update({ nDays: Math.max(1, form.nDays - 1) })}
              onPlus={() => update({ nDays: Math.min(90, form.nDays + 1) })}
              suffix={<span className="text-text-subtle">{t("scenarios.rc.interval_unit")}</span>}
            />
          </label>
          {/* «Начиная с · необязательно» — an optional ISO start date (design's
              everyN body; .field max-width 200px). Empty → the interval starts now. */}
          <label className="flex flex-col gap-1.5">
            <FieldLabel opt={t("scenarios.rc.optional")}>{t("scenarios.rc.start_from")}</FieldLabel>
            <input
              type="date"
              aria-label={t("scenarios.rc.start_from")}
              className="h-10 max-w-[200px] rounded-md border border-border bg-surface px-3 text-small text-text focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
              value={form.startDate}
              onChange={(e) => update({ startDate: e.target.value })}
            />
          </label>
          <TimeSection hours={form.hours} jitter={form.jitter} onHours={setHours} onJitter={(j) => update({ jitter: j })} />
        </>
      )}

      {mode === "weekly" && (
        <>
          <label className="flex flex-col gap-1.5">
            <FieldLabel>{t("scenarios.rc.which_days")}</FieldLabel>
            {/* `wkPills` — the 7 Пн…Вс day pills, multi-select (design default
                Mon–Fri). Toggling adds/removes the day; selection may be any set.
                In perDay mode, adding a day also seeds its per-day time row. */}
            <span className="flex flex-wrap gap-1.5">
              {RC_WEEKDAYS.map((wd, i) => {
                const on = form.weekdays.includes(i);
                return (
                  <button
                    key={i}
                    type="button"
                    aria-pressed={on}
                    onClick={() => {
                      const weekdays = on ? form.weekdays.filter((x) => x !== i) : [...form.weekdays, i].sort((a, b) => a - b);
                      // perDay + adding a day with no times yet → seed its default row.
                      if (form.perDay && !on && (!form.perDayTimes[i] || form.perDayTimes[i].length === 0)) {
                        update({ weekdays, perDayTimes: { ...form.perDayTimes, [i]: PER_DAY_DEFAULT[i] ?? [9] } });
                      } else {
                        update({ weekdays });
                      }
                    }}
                    className={cn(
                      "grid h-[34px] min-w-[38px] place-items-center rounded-sm border px-2.5 text-small font-medium transition-colors",
                      on ? "border-primary bg-primary font-semibold text-primary-foreground" : "border-border bg-surface text-text-muted hover:border-text/16",
                    )}
                  >
                    {t(wd)}
                  </button>
                );
              })}
            </span>
          </label>
          {/* «Разное время в разные дни» — OFF: the shared time list applies to all
              selected days. ON: a per-weekday time editor (the design's perDay body). */}
          <ToggleRow
            title={t("scenarios.rc.per_day_toggle")}
            sub={t("scenarios.rc.per_day_toggle_sub")}
            on={form.perDay}
            onToggle={setPerDay}
          />
          {form.perDay ? (
            <PerDayTimes weekdays={form.weekdays} perDayTimes={form.perDayTimes} onChange={setPerDayHours} />
          ) : (
            <TimeSection hours={form.hours} jitter={form.jitter} onHours={setHours} onJitter={(j) => update({ jitter: j })} />
          )}
        </>
      )}

      {mode === "monthly" && (
        <>
          <label className="flex flex-col gap-2">
            <FieldLabel opt={t("scenarios.rc.dom_multi")}>{t("scenarios.rc.dom_label")}</FieldLabel>
            <DomGrid
              days={form.monthlyDays}
              lastDay={form.monthlyLastDay}
              onMissing={form.monthlyOnMissing}
              onToggleDay={(d) =>
                update({
                  monthlyDays: form.monthlyDays.includes(d)
                    ? form.monthlyDays.filter((x) => x !== d)
                    : [...form.monthlyDays, d].sort((a, b) => a - b),
                })
              }
              onToggleLast={() => update({ monthlyLastDay: !form.monthlyLastDay })}
              onMissingChange={(v) => update({ monthlyOnMissing: v })}
            />
          </label>
          <TimeSection hours={form.hours} jitter={form.jitter} onHours={setHours} onJitter={(j) => update({ jitter: j })} />
        </>
      )}

      {mode === "yearly" && (
        <>
          <label className="flex flex-col gap-2">
            <FieldLabel opt={t("scenarios.rc.yd_opt")}>{t("scenarios.rc.yd_label")}</FieldLabel>
            <YearDates
              dates={form.yearlyDates}
              onAdd={() => update({ yearlyDates: [...form.yearlyDates, { day: 1, month: 0 }] })}
              onRemove={(i) => update({ yearlyDates: form.yearlyDates.filter((_, n) => n !== i) })}
              onChange={(i, next) => update({ yearlyDates: form.yearlyDates.map((d, n) => (n === i ? next : d)) })}
            />
          </label>
          <TimeSection hours={form.hours} jitter={form.jitter} onHours={setHours} onJitter={(j) => update({ jitter: j })} />
        </>
      )}

      {mode === "date_range" && (
        <>
          <label className="flex flex-col gap-1.5">
            <FieldLabel>{t("scenarios.rc.period_range")}</FieldLabel>
            <span className="inline-flex flex-wrap items-center gap-2.5">
              <input
                type="date"
                aria-label={t("scenarios.date_from")}
                className="h-10 max-w-[172px] rounded-md border border-border bg-surface px-3 text-small text-text focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
                value={form.dateFrom}
                onChange={(e) => update({ dateFrom: e.target.value })}
              />
              <IcChevSep />
              <input
                type="date"
                aria-label={t("scenarios.date_to")}
                className="h-10 max-w-[172px] rounded-md border border-border bg-surface px-3 text-small text-text focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
                value={form.dateTo}
                onChange={(e) => update({ dateTo: e.target.value })}
              />
            </span>
          </label>
          <TimeSection hours={form.hours} jitter={form.jitter} onHours={setHours} onJitter={(j) => update({ jitter: j })} />
          <Why>{t("scenarios.rc.period_why")}</Why>
        </>
      )}

      {mode === "event" && (
        <>
          <label className="flex flex-col gap-1.5">
            <FieldLabel>{t("scenarios.rc.event_trigger")}</FieldLabel>
            <Seg
              options={[
                { key: "on_metric_threshold", label: t("scenarios.rc.event_views") },
                { key: "on_follower_milestone", label: t("scenarios.rc.event_followers") },
              ]}
              value={form.eventKind}
              onPick={(k) => update({ eventKind: k as RecipeEvent })}
            />
          </label>
          {form.eventKind === "on_metric_threshold" && (
            <label className="flex flex-col gap-1.5">
              <FieldLabel>{t("scenarios.rc.threshold")}</FieldLabel>
              <input
                type="number"
                inputMode="numeric"
                placeholder={t("scenarios.threshold_ph")}
                className="h-10 max-w-[160px] rounded-md border border-border bg-surface px-3 text-small tabular-nums text-text focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
                value={form.threshold}
                onChange={(e) => update({ threshold: e.target.value })}
              />
              <span className="text-caption text-text-subtle">{t("scenarios.threshold_auto")}</span>
            </label>
          )}
          {form.eventKind === "on_follower_milestone" && <MilestoneLadder form={form} update={update} />}
          <p className="flex items-start gap-2.5 rounded-md border border-border bg-surface px-3 py-2.5 text-small leading-[1.5] text-text-muted [&_b]:font-semibold [&_b]:text-text">
            <IcGauge size={16} className="mt-px shrink-0 text-accent" />
            <span dangerouslySetInnerHTML={{ __html: t("scenarios.rc.event_note") }} />
          </p>
        </>
      )}
    </>
  );
}

function IcChevSep() {
  return <span className="text-text-subtle">→</span>;
}

// КОГДА (reply) — locked «каждые 15 минут» explainer + .rc-hard.
export function WhenReplyBody() {
  const { t } = useTranslation();
  return (
    <>
      <p className="flex items-start gap-2.5 rounded-md border border-border bg-surface px-3 py-2.5 text-small leading-[1.5] text-text-muted [&_b]:font-semibold [&_b]:text-text">
        <IcRepeat size={16} className="mt-px shrink-0 text-accent" />
        <span dangerouslySetInnerHTML={{ __html: t("scenarios.rc.when_reply_body") }} />
      </p>
      <Hard>{t("scenarios.rc.when_reply_hard")}</Hard>
    </>
  );
}

// КОГДА (on_mention) — locked REACTIVE «когда меня упомянут». Unlike the comment
// duty there's no poll cadence to surface: the scenario fires off the @mention
// itself (the hourly mention ingest feeds it), so this is a pure explainer + the
// shared reply-cap/quiet-hours note. No schedule controls.
export function WhenMentionBody() {
  const { t } = useTranslation();
  return (
    <>
      <p className="flex items-start gap-2.5 rounded-md border border-border bg-surface px-3 py-2.5 text-small leading-[1.5] text-text-muted [&_b]:font-semibold [&_b]:text-text">
        <IcLock size={16} className="mt-px shrink-0 text-accent" />
        <span dangerouslySetInnerHTML={{ __html: t("scenarios.rc.when_mention_body") }} />
      </p>
      <Hard>{t("scenarios.rc.when_mention_hard")}</Hard>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  ЕСЛИ — condition builder (Wave 1: 3 honest conditions)
// ════════════════════════════════════════════════════════════════════════════
function CondRow({ icon, title, sub, ctl, onRemove }: { icon: ReactNode; title: string; sub?: string; ctl?: ReactNode; onRemove: () => void }) {
  return (
    // flex-wrap so a wide control (cooldown stepper + ч/дни segment) drops to its
    // own full-width line on a narrow column instead of overlapping the subtitle
    // and overflowing the card; stays inline on the right at ≥sm.
    <div className="flex flex-wrap items-center gap-x-[11px] gap-y-2.5 rounded-md border border-border bg-surface px-[13px] py-[11px]">
      <span className="order-1 grid h-[26px] w-[26px] shrink-0 place-items-center rounded-sm border border-border bg-surface-2 text-text-muted">{icon}</span>
      <span className="order-2 min-w-0 flex-1">
        <span className="block text-small font-medium text-text">{title}</span>
        {sub && <span className="mt-px block text-caption leading-[1.4] text-text-subtle">{sub}</span>}
      </span>
      {ctl && <span className="order-4 flex w-full flex-wrap items-center gap-2 pl-[37px] sm:order-3 sm:w-auto sm:pl-0">{ctl}</span>}
      <button type="button" onClick={onRemove} aria-label="×" className="order-3 grid h-[26px] w-[26px] shrink-0 place-items-center rounded-sm text-text-subtle transition-colors hover:bg-surface-2 hover:text-danger sm:order-4">
        <IcX size={14} />
      </button>
    </div>
  );
}

export function IfBody({
  form,
  update,
  menuOpen,
  setMenuOpen,
}: {
  form: FormState;
  update: (patch: Partial<FormState>) => void;
  menuOpen: boolean;
  setMenuOpen: (v: boolean) => void;
}) {
  const { t } = useTranslation();
  const anyActive = form.condNoPostToday || form.cooldownOn || form.maxFiresOn;
  // The «+ Добавить условие» menu — only the conditions NOT already active.
  const menuItems: { key: "noPost" | "cooldown" | "maxFires"; icon: ReactNode; label: string; active: boolean }[] = [
    { key: "noPost", icon: <IcCheck size={15} />, label: t("scenarios.rc.cond_no_post"), active: form.condNoPostToday },
    { key: "cooldown", icon: <IcTimer size={15} />, label: t("scenarios.rc.cond_cooldown"), active: form.cooldownOn },
    { key: "maxFires", icon: <IcGauge size={15} />, label: t("scenarios.rc.cond_max_fires"), active: form.maxFiresOn },
  ];
  const addable = menuItems.filter((m) => !m.active);
  function enable(key: "noPost" | "cooldown" | "maxFires") {
    if (key === "noPost") update({ condNoPostToday: true });
    else if (key === "cooldown") update({ cooldownOn: true });
    else update({ maxFiresOn: true });
    setMenuOpen(false);
  }
  return (
    <>
      {anyActive && (
        <div className="flex flex-col gap-2.5">
          {form.condNoPostToday && (
            <CondRow
              icon={<IcCheck size={14} />}
              title={t("scenarios.rc.cond_no_post")}
              sub={t("scenarios.rc.cond_no_post_sub")}
              onRemove={() => update({ condNoPostToday: false })}
            />
          )}
          {form.cooldownOn && (
            <CondRow
              icon={<IcTimer size={14} />}
              title={t("scenarios.rc.cond_cooldown")}
              sub={t("scenarios.rc.cond_cooldown_sub")}
              ctl={
                <>
                  <Stepper
                    value={form.cooldownValue}
                    onMinus={() => update({ cooldownValue: Math.max(1, form.cooldownValue - 1) })}
                    onPlus={() => update({ cooldownValue: form.cooldownValue + 1 })}
                  />
                  <Seg
                    options={[
                      { key: "hours", label: t("scenarios.rc.unit_hours") },
                      { key: "days", label: t("scenarios.rc.unit_days") },
                    ]}
                    value={form.cooldownUnit}
                    onPick={(k) => update({ cooldownUnit: k as CooldownUnit })}
                  />
                </>
              }
              onRemove={() => update({ cooldownOn: false })}
            />
          )}
          {form.maxFiresOn && (
            <CondRow
              icon={<IcGauge size={14} />}
              title={t("scenarios.rc.cond_max_fires")}
              sub={t("scenarios.rc.cond_max_fires_sub")}
              ctl={
                <Stepper
                  value={form.maxFires}
                  onMinus={() => update({ maxFires: Math.max(1, form.maxFires - 1) })}
                  onPlus={() => update({ maxFires: form.maxFires + 1 })}
                />
              }
              onRemove={() => update({ maxFiresOn: false })}
            />
          )}
        </div>
      )}

      {addable.length > 0 &&
        (menuOpen ? (
          <div className="flex flex-col gap-0.5 rounded-md border border-border bg-surface p-1.5 shadow-md">
            {addable.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => enable(m.key)}
                className="flex w-full items-center gap-2.5 rounded-sm px-[11px] py-2.5 text-left text-text transition-colors hover:bg-surface-2"
              >
                <span className="shrink-0 text-text-subtle">{m.icon}</span>
                <span className="flex-1 text-small font-medium">{m.label}</span>
              </button>
            ))}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="inline-flex items-center gap-[7px] self-start rounded-md border border-dashed border-accent/36 px-3.5 py-2.5 text-small font-semibold text-accent transition-colors hover:bg-accent/[0.07]"
          >
            <IcPlus size={14} /> {t("scenarios.rc.add_condition")}
          </button>
        ))}

      <Why>{t("scenarios.rc.if_why")}</Why>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  BIG-TEXT FIELD — a free-text trigger that opens the full modal
// ════════════════════════════════════════════════════════════════════════════
export function BigText({ value, hint, onOpen }: { value: string; hint: string; onOpen: () => void }) {
  const { t } = useTranslation();
  const empty = !value.trim();
  return (
    <div className="flex cursor-text flex-col overflow-hidden rounded-md border border-border bg-surface transition-colors hover:border-accent/32" onClick={onOpen}>
      <div className={cn("min-h-[52px] px-[13px] py-[11px] text-small leading-[1.55] [text-wrap:pretty]", empty ? "text-text-subtle" : "text-text")}>
        {empty ? t("scenarios.rc.bigtext_empty") : value}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-2.5 gap-y-1.5 border-t border-border bg-surface-2 py-2 pl-[13px] pr-[11px]">
        <span className="min-w-0 flex-1 basis-[160px] text-caption leading-[1.4] text-text-subtle">{hint}</span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
          className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-sm px-[7px] py-1 text-caption font-semibold text-accent transition-colors hover:bg-accent/[0.09]"
        >
          <IcExpand size={13} /> {t("scenarios.rc.bigtext_open")}
        </button>
      </div>
    </div>
  );
}

// The full-size modal for instruction / tone / custom-audience editing.
const BT_META: Record<Exclude<BigTextField, null>, { icon: ReactNode; titleKey: MessageKey; hintKey: MessageKey; phKey: MessageKey }> = {
  instruction: { icon: <IcPencil size={16} />, titleKey: "scenarios.rc.bt.instr_title", hintKey: "scenarios.rc.bt.instr_hint", phKey: "scenarios.rc.bt.instr_ph" },
  tone: { icon: <IcBubble size={16} />, titleKey: "scenarios.rc.bt.tone_title", hintKey: "scenarios.rc.bt.tone_hint", phKey: "scenarios.rc.bt.tone_ph" },
  audience: { icon: <IcPerson size={16} />, titleKey: "scenarios.rc.bt.aud_title", hintKey: "scenarios.rc.bt.aud_hint", phKey: "scenarios.rc.bt.aud_ph" },
  // the boost's pre-written comment (link / CTA / addendum) — authored, ≤500 chars.
  boost: { icon: <IcLink size={16} />, titleKey: "scenarios.bo.bt.title", hintKey: "scenarios.bo.bt.hint", phKey: "scenarios.bo.bt.ph" },
  // entry C — the attached-boost companion comment (same modal copy as `boost`).
  attachBoost: { icon: <IcLink size={16} />, titleKey: "scenarios.bo.bt.title", hintKey: "scenarios.bo.bt.hint", phKey: "scenarios.bo.bt.ph" },
};

export function BigTextModal({
  field,
  value,
  onChange,
  onClose,
}: {
  field: Exclude<BigTextField, null>;
  value: string;
  onChange: (v: string) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const m = BT_META[field];
  return (
    // Full-VIEWPORT overlay (fixed, not absolute-within-.rce) so the scrim/blur
    // covers the whole app, and a responsive dialog that grows with the monitor
    // (w 92vw up to 860px, max-h 88vh) instead of a fixed 580px box.
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-ink-950/[0.48] backdrop-blur-[1.5px]" onClick={onClose} />
      <div role="dialog" aria-modal="true" className="relative flex max-h-[88vh] w-[92vw] max-w-[860px] animate-[bt-in_180ms_ease-out] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-lg">
        <div className="flex shrink-0 items-center gap-[11px] border-b border-border px-[18px] py-[15px]">
          <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-sm border border-accent/24 bg-accent/[0.11] text-accent">{m.icon}</span>
          <span className="min-w-0 flex-1 text-body font-semibold tracking-[-0.004em]">{t(m.titleKey)}</span>
          <button type="button" onClick={onClose} aria-label={t("a11y.close")} className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-sm text-text-subtle transition-colors hover:bg-surface-2 hover:text-text">
            <IcX size={16} />
          </button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-[13px] overflow-y-auto p-[18px]">
          <textarea
            autoFocus
            placeholder={t(m.phKey)}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="min-h-[clamp(300px,50vh,600px)] w-full flex-1 resize-y rounded-md border border-border bg-surface-2 px-[15px] py-3.5 text-[15.5px] leading-[1.6] text-text outline-none focus:border-accent focus:bg-surface focus:ring-2 focus:ring-accent/22"
          />
          <p className="flex items-start gap-2 text-caption leading-[1.5] text-text-subtle [&_b]:font-semibold [&_b]:text-text-muted">
            <IcInfo size={13} className="mt-px shrink-0 opacity-80" />
            <span dangerouslySetInnerHTML={{ __html: t(m.hintKey) }} />
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2.5 border-t border-border bg-surface-2 px-[18px] py-3.5">
          {/* the boost comment has a hard 500-char ceiling (backend) — show «N / 500»
              with an over-limit warning colour; other fields show the plain count. */}
          {field === "boost" || field === "attachBoost" ? (
            <span className={cn("text-caption tabular-nums", value.length > 500 ? "font-semibold text-danger" : "text-text-subtle")}>
              {t("scenarios.bo.bt.count").replace("{n}", String(value.length)).replace("{max}", "500")}
            </span>
          ) : (
            <span className="text-caption tabular-nums text-text-subtle">{t("scenarios.rc.bt.count").replace("{n}", String(value.length))}</span>
          )}
          <span className="flex-1" />
          <Button variant="secondary" size="sm" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button variant="primary" size="sm" icon={<IcCheck size={15} />} onClick={onClose}>
            {t("common.save")}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  ЧТО (POST) — instruction (→ modal) · topic · length · CTA
// ════════════════════════════════════════════════════════════════════════════
export function WhatPostBody({
  form,
  update,
  instructionValue,
  onOpenInstruction,
}: {
  form: FormState;
  update: (patch: Partial<FormState>) => void;
  instructionValue: string;
  onOpenInstruction: () => void;
}) {
  const { t } = useTranslation();
  const LENGTHS: { key: RecipeLength; label: string }[] = [
    { key: "short", label: t("scenarios.rc.len_short") },
    { key: "medium", label: t("scenarios.rc.len_medium") },
    { key: "any", label: t("scenarios.rc.len_any") },
  ];
  return (
    <>
      <label className="flex flex-col gap-1.5">
        <FieldLabel>{t("scenarios.rc.what_instr")}</FieldLabel>
        <BigText value={instructionValue} hint={t("scenarios.rc.what_instr_hint")} onOpen={onOpenInstruction} />
      </label>
      <label className="flex flex-col gap-1.5">
        <FieldLabel opt={t("scenarios.rc.optional")}>{t("scenarios.rc.topic")}</FieldLabel>
        <input
          className="h-10 w-full rounded-md border border-border bg-surface px-3 text-small text-text focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
          value={form.topic}
          onChange={(e) => update({ topic: e.target.value })}
          placeholder={t("scenarios.rc.topic_ph")}
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <FieldLabel>{t("scenarios.rc.length")}</FieldLabel>
        <Seg options={LENGTHS} value={form.length} onPick={(k) => update({ length: k as RecipeLength })} />
      </label>
      <label className="flex flex-col gap-1.5">
        <FieldLabel opt={t("scenarios.rc.optional")}>{t("scenarios.rc.cta")}</FieldLabel>
        <input
          className="h-10 w-full rounded-md border border-border bg-surface px-3 text-small text-text focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
          value={form.cta}
          onChange={(e) => update({ cta: e.target.value })}
          placeholder={t("scenarios.rc.cta_ph")}
        />
      </label>
      <Hard>{t("scenarios.rc.what_hard")}</Hard>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  BOOST — «Комментарий-добавка при росте поста» (reactive)
//  Three drawer bodies (target · metric+threshold · comment via the big-text
//  modal). The metric/threshold/comment block is IDENTICAL across all three
//  entry points; only the target slot differs (an explicit picker in A, a locked
//  plaque in B/C). Ported from Scenario-Growth-Comment-SPEC v2.
// ════════════════════════════════════════════════════════════════════════════
const BOOST_METRIC_TILES: { key: BoostMetric; icon: ReactNode; titleKey: MessageKey; subKey: MessageKey }[] = [
  { key: "views", icon: <IcEye size={14} />, titleKey: "scenarios.bo.metric_views", subKey: "scenarios.bo.metric_views_sub" },
  { key: "likes", icon: <IcHeart size={14} />, titleKey: "scenarios.bo.metric_likes", subKey: "scenarios.bo.metric_likes_sub" },
  { key: "comments", icon: <IcBubble size={14} />, titleKey: "scenarios.bo.metric_comments", subKey: "scenarios.bo.metric_comments_sub" },
];

// ЦЕЛЬ — which posts the boost watches (entry A only; B/C lock it). The three
// tiles map 1:1 to the backend BOOST_TARGET_TYPES (all / scenario / post). The
// scenario/post tiles reveal a contextual sub-control (an id picker). When the
// account has no publisher scenarios / recent posts to pick, the sub-control
// shows an honest empty note and the target falls back to «all» on save.
export function BoostTargetBody({
  targetType,
  onTargetType,
  scenarioId,
  onScenarioId,
  postId,
  onPostId,
  scenarioOptions,
  postOptions,
}: {
  targetType: BoostTargetType;
  onTargetType: (t: BoostTargetType) => void;
  scenarioId: number;
  onScenarioId: (id: number) => void;
  postId: number;
  onPostId: (id: number) => void;
  /** Publisher scenarios the boost may watch (id + label) — for the «scenario» picker. */
  scenarioOptions: { id: number; label: string }[];
  /** Recent posts the boost may watch (id + a short preview) — for the «post» picker. */
  postOptions: { id: number; label: string }[];
}) {
  const { t } = useTranslation();
  const TILES: { key: BoostTargetType; icon: ReactNode; titleKey: MessageKey; subKey: MessageKey }[] = [
    { key: "all", icon: <IcShieldHouse size={14} />, titleKey: "scenarios.bo.target_all", subKey: "scenarios.bo.target_all_sub" },
    { key: "scenario", icon: <IcRepeat size={14} />, titleKey: "scenarios.bo.target_scenario", subKey: "scenarios.bo.target_scenario_sub" },
    { key: "post", icon: <IcPencil size={14} />, titleKey: "scenarios.bo.target_post", subKey: "scenarios.bo.target_post_sub" },
  ];
  return (
    <>
      <label className="flex flex-col gap-1.5">
        <FieldLabel>{t("scenarios.bo.target_label")}</FieldLabel>
        <div className="grid grid-cols-3 gap-2.5 max-[520px]:grid-cols-1">
          {TILES.map((tile) => {
            const on = tile.key === targetType;
            return (
              <button
                key={tile.key}
                type="button"
                onClick={() => onTargetType(tile.key)}
                aria-pressed={on}
                className={cn(
                  "flex flex-col gap-1 rounded-md border bg-surface px-[13px] py-3 text-left transition-colors",
                  on ? "border-accent bg-accent/[0.06] shadow-[0_0_0_1px_var(--color-accent)]" : "border-border hover:border-text/16",
                )}
              >
                <span className="flex items-center gap-[7px] text-small font-semibold text-text">
                  <span className={cn("shrink-0", on ? "text-accent" : "text-text-subtle")}>{tile.icon}</span>
                  {t(tile.titleKey)}
                </span>
                <span className="text-caption leading-[1.4] text-text-subtle">{t(tile.subKey)}</span>
              </button>
            );
          })}
        </div>
      </label>
      {/* contextual sub-control — a scenario / post picker for the matching tile */}
      {targetType === "scenario" && (
        <label className="flex flex-col gap-1.5">
          <FieldLabel>{t("scenarios.bo.pick_scenario")}</FieldLabel>
          {scenarioOptions.length === 0 ? (
            <Why>{t("scenarios.bo.pick_scenario_empty")}</Why>
          ) : (
            <select
              aria-label={t("scenarios.bo.pick_scenario")}
              className={cn(FIELD_SELECT, "max-w-full")}
              value={scenarioId || ""}
              onChange={(e) => onScenarioId(Number(e.target.value) || 0)}
            >
              <option value="">{t("scenarios.bo.pick_placeholder")}</option>
              {scenarioOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          )}
        </label>
      )}
      {targetType === "post" && (
        <label className="flex flex-col gap-1.5">
          <FieldLabel>{t("scenarios.bo.pick_post")}</FieldLabel>
          {postOptions.length === 0 ? (
            <Why>{t("scenarios.bo.pick_post_empty")}</Why>
          ) : (
            <select
              aria-label={t("scenarios.bo.pick_post")}
              className={cn(FIELD_SELECT, "max-w-full")}
              value={postId || ""}
              onChange={(e) => onPostId(Number(e.target.value) || 0)}
            >
              <option value="">{t("scenarios.bo.pick_placeholder")}</option>
              {postOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          )}
        </label>
      )}
      <Why>{t("scenarios.bo.target_why")}</Why>
    </>
  );
}

// МЕТРИКА + ПОРОГ — one metric per boost (tiles) + an absolute threshold (number
// input + quick-preset chips seeded per metric). Changing the metric re-seeds the
// threshold to that metric's default when the field is empty / still the previous
// metric's default. The honest captions (reactive · once-per-post · ~48h window)
// live under the controls.
export function BoostTriggerBody({
  metric,
  onMetric,
  threshold,
  onThreshold,
}: {
  metric: BoostMetric;
  onMetric: (m: BoostMetric) => void;
  threshold: string;
  onThreshold: (v: string) => void;
}) {
  const { t } = useTranslation();
  const presets = BOOST_PRESETS[metric];
  return (
    <>
      <label className="flex flex-col gap-1.5">
        <FieldLabel>{t("scenarios.bo.metric_label")}</FieldLabel>
        <div className="grid grid-cols-3 gap-2.5 max-[520px]:grid-cols-1">
          {BOOST_METRIC_TILES.map((tile) => {
            const on = tile.key === metric;
            return (
              <button
                key={tile.key}
                type="button"
                onClick={() => onMetric(tile.key)}
                aria-pressed={on}
                className={cn(
                  "flex flex-col gap-1 rounded-md border bg-surface px-[13px] py-3 text-left transition-colors",
                  on ? "border-accent bg-accent/[0.06] shadow-[0_0_0_1px_var(--color-accent)]" : "border-border hover:border-text/16",
                )}
              >
                <span className="flex items-center gap-[7px] text-small font-semibold text-text">
                  <span className={cn("shrink-0", on ? "text-accent" : "text-text-subtle")}>{tile.icon}</span>
                  {t(tile.titleKey)}
                </span>
                <span className="text-caption leading-[1.4] text-text-subtle">{t(tile.subKey)}</span>
              </button>
            );
          })}
        </div>
      </label>
      <label className="flex flex-col gap-1.5">
        <FieldLabel>{t("scenarios.bo.threshold_label")}</FieldLabel>
        <input
          type="number"
          inputMode="numeric"
          min={1}
          placeholder={String(BOOST_DEFAULT_THRESHOLD[metric])}
          className="h-10 max-w-[180px] rounded-md border border-border bg-surface px-3 text-small tabular-nums text-text focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
          value={threshold}
          onChange={(e) => onThreshold(e.target.value)}
        />
        {/* quick presets — tap to set the threshold to a common value */}
        <span className="flex flex-wrap gap-1.5">
          {presets.map((p) => {
            const on = Number(threshold) === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => onThreshold(String(p))}
                aria-pressed={on}
                className={cn(
                  "rounded-full border px-3 py-1 text-caption font-semibold tabular-nums transition-colors",
                  on ? "border-accent bg-accent/[0.09] text-accent" : "border-border bg-surface text-text-muted hover:border-text/16",
                )}
              >
                {p.toLocaleString()}
              </button>
            );
          })}
        </span>
        <span className="text-caption text-text-subtle">{t("scenarios.bo.threshold_hint")}</span>
      </label>
      <Hard>{t("scenarios.bo.trigger_hard")}</Hard>
    </>
  );
}

// КАК (boost) — the pre-written comment, via the big-text modal (the comment is
// authored, never generated). Mirrors WhatPost's instruction field.
export function BoostCommentBody({ value, onOpen }: { value: string; onOpen: () => void }) {
  const { t } = useTranslation();
  return (
    <label className="flex flex-col gap-1.5">
      <FieldLabel>{t("scenarios.bo.comment_label")}</FieldLabel>
      <BigText value={value} hint={t("scenarios.bo.comment_hint")} onOpen={onOpen} />
    </label>
  );
}

// A locked target plaque for entry points B (this post) / C (this scenario's
// posts) — the design's «Цель: …» locked row. The config below it is identical to
// entry A; only this plaque replaces the explicit picker.
export function BoostTargetLock({ entry }: { entry: "studio" | "scenario" }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-[9px] rounded-md border border-border bg-surface-2 px-[13px] py-2.5">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-sm border border-accent/24 bg-accent/[0.11] text-accent">
        <IcTarget size={14} />
      </span>
      <span className="min-w-0">
        <span className="block text-caption font-mono uppercase tracking-[0.05em] text-text-subtle">{t("scenarios.bo.target_locked_k")}</span>
        <span className="mt-px flex items-center gap-1.5 text-small font-semibold text-text">
          <IcLock size={11} className="shrink-0 opacity-60" />
          {entry === "studio" ? t("scenarios.bo.target_this_post") : t("scenarios.bo.target_this_scenario")}
        </span>
      </span>
    </div>
  );
}

// Entry C — the «Бустер» section inside a POST-scenario's editor (Layer 2). A
// toggle reveals the SAME boost config (metric+threshold+comment) with the target
// LOCKED to «посты этого сценария». On save it spins up a SEPARATE boost scenario
// watching this scenario's posts (a scenario can't be both a publisher AND a boost
// — the backend resolves one fork). For a not-yet-saved scenario it shows an
// honest "save first" note (the companion needs this scenario's id to target).
export function BoostAttachSection({
  on,
  onToggle,
  metric,
  onMetric,
  threshold,
  onThreshold,
  comment,
  onOpenComment,
  isExisting,
}: {
  on: boolean;
  onToggle: (v: boolean) => void;
  metric: BoostMetric;
  onMetric: (m: BoostMetric) => void;
  threshold: string;
  onThreshold: (v: string) => void;
  comment: string;
  onOpenComment: () => void;
  /** A boost companion needs this scenario's id → only offered once it's saved. */
  isExisting: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-3">
      <ToggleRow title={t("scenarios.bo.attach_title")} sub={t("scenarios.bo.attach_sub")} on={on} onToggle={onToggle} />
      {on && (
        <div className="flex flex-col gap-[15px] rounded-md border border-border bg-surface px-[13px] py-3.5">
          {/* locked target — «Цель: посты этого сценария» */}
          <div className="inline-flex items-center gap-1.5 self-start rounded-full border border-accent/24 bg-accent/[0.08] px-2.5 py-1 text-caption font-semibold text-text-muted">
            <IcLock size={11} className="text-accent" /> {t("scenarios.bo.attach_target")}
          </div>
          {/* the SAME metric+threshold + comment config as entry A */}
          <BoostTriggerBody metric={metric} onMetric={onMetric} threshold={threshold} onThreshold={onThreshold} />
          <BoostCommentBody value={comment} onOpen={onOpenComment} />
          {!isExisting && <Why>{t("scenarios.bo.attach_save_first")}</Why>}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  КАК — publish mode (2 radio cards) → publish_mode
// ════════════════════════════════════════════════════════════════════════════
export function HowBody({ mode, onMode }: { mode: "ask" | "auto"; onMode: (m: "ask" | "auto") => void }) {
  const { t } = useTranslation();
  return (
    <>
      <div className="flex flex-col gap-2.5">
        <ModeCard
          active={mode === "ask"}
          tone="ask"
          title={t("scenarios.rc.mode_ask")}
          badge={t("scenarios.rc.mode_default")}
          sub={t("scenarios.rc.mode_ask_sub")}
          onPick={() => onMode("ask")}
        />
        <ModeCard
          active={mode === "auto"}
          tone="auto"
          title={t("scenarios.rc.mode_auto")}
          sub={t("scenarios.rc.mode_auto_sub")}
          onPick={() => onMode("auto")}
        />
      </div>
      <Why>{t("scenarios.rc.how_why")}</Why>
    </>
  );
}

function ModeCard({ active, tone, title, badge, sub, onPick }: { active: boolean; tone: "ask" | "auto"; title: string; badge?: string; sub: string; onPick: () => void }) {
  const auto = tone === "auto";
  return (
    <button
      type="button"
      onClick={onPick}
      aria-pressed={active}
      className={cn(
        "flex items-start gap-3 rounded-lg border bg-surface px-3.5 py-3 text-left transition-colors",
        active ? (auto ? "border-warning bg-warning/[0.06] ring-1 ring-warning" : "border-accent bg-accent/[0.06] ring-1 ring-accent") : "border-border hover:border-text/20",
      )}
    >
      <span className={cn("mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2", active ? (auto ? "border-warning" : "border-accent") : "border-border")}>
        {active && <span className={cn("h-2.5 w-2.5 rounded-full", auto ? "bg-warning" : "bg-accent")} />}
      </span>
      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-2 text-small font-semibold text-text">
          {title}
          {badge && <span className="rounded-full border border-success/30 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.04em] text-success">{badge}</span>}
        </span>
        <span className="mt-0.5 block text-caption leading-relaxed text-text-muted">{sub}</span>
      </span>
    </button>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  КОМУ (reply) — 4-tile audience gallery + «из Правил дома» badge
// ════════════════════════════════════════════════════════════════════════════
const AUD_TILES: { key: string; icon: ReactNode; titleKey: MessageKey; subKey: MessageKey }[] = [
  { key: "fans", icon: <IcHeart size={14} />, titleKey: "scenarios.rc.aud_fans", subKey: "scenarios.rc.aud_fans_sub" },
  { key: "all_except_trolls", icon: <IcShield size={14} />, titleKey: "scenarios.rc.aud_all", subKey: "scenarios.rc.aud_all_sub" },
  { key: "questions", icon: <IcBubbleQuestion size={14} />, titleKey: "scenarios.rc.aud_questions", subKey: "scenarios.rc.aud_questions_sub" },
  { key: "custom", icon: <IcPencil size={14} />, titleKey: "scenarios.rc.aud_custom", subKey: "scenarios.rc.aud_custom_sub" },
];

export function WhoBody({
  audience,
  onAudience,
  audiencePrompt,
  onOpenCustom,
}: {
  audience: string;
  onAudience: (a: string) => void;
  audiencePrompt: string;
  onOpenCustom: () => void;
}) {
  const { t } = useTranslation();
  const custom = audience === "custom";
  return (
    <>
      <label className="flex flex-col gap-1.5">
        <FieldLabel>{t("scenarios.rc.who_label")}</FieldLabel>
        <div className="grid grid-cols-2 gap-2.5 max-[520px]:grid-cols-1">
          {AUD_TILES.map((tile) => {
            const on = tile.key === audience;
            return (
              <button
                key={tile.key}
                type="button"
                onClick={() => onAudience(tile.key)}
                aria-pressed={on}
                className={cn(
                  "flex flex-col gap-1 rounded-md border bg-surface px-[13px] py-3 text-left transition-colors",
                  on ? "border-accent bg-accent/[0.06] shadow-[0_0_0_1px_var(--color-accent)]" : "border-border hover:border-text/16",
                )}
              >
                <span className="flex items-center gap-[7px] text-small font-semibold text-text">
                  <span className={cn("shrink-0", on ? "text-accent" : "text-text-subtle")}>{tile.icon}</span>
                  {t(tile.titleKey)}
                </span>
                <span className="text-caption leading-[1.4] text-text-subtle">{t(tile.subKey)}</span>
              </button>
            );
          })}
        </div>
      </label>
      {custom && <BigText value={audiencePrompt} hint={t("scenarios.rc.aud_custom_hint")} onOpen={onOpenCustom} />}
      <p className="inline-flex flex-wrap items-center gap-1.5 text-caption text-text-subtle [&_a]:font-semibold [&_a]:text-accent">
        <span className="rounded-full border border-accent/30 px-[7px] py-px font-mono text-[9.5px] uppercase tracking-[0.03em] text-accent">
          <IcShieldHouse size={10} className="-mt-px mr-1 inline" />
          {t("scenarios.rc.inherit_badge")}
        </span>
        {t("scenarios.rc.inherit_text")}
      </p>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  ТОН (reply) — tone, via the big-text modal
// ════════════════════════════════════════════════════════════════════════════
export function ToneBody({ value, onOpen }: { value: string; onOpen: () => void }) {
  const { t } = useTranslation();
  return (
    <label className="flex flex-col gap-1.5">
      <FieldLabel>{t("scenarios.rc.tone_label")}</FieldLabel>
      <BigText value={value} hint={t("scenarios.rc.tone_hint")} onOpen={onOpen} />
    </label>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  СЛОЙ 3 — «Только для этого сценария» (per-scenario reply overrides)
//  Ported 1:1 from design-export/.../recipe-editor/Layer3-Scenario-Override-SPEC
//  + Layer3-HANDOFF. Replaces the old `.rce-stub`. Each of 4 settings INHERITS
//  «Правила дома» by default (a badge + the inherited value + «Переопределить»);
//  «Переопределить» reveals the control + «В Правилах дома: …» + «Вернуть к
//  наследованию». A lead counts the overrides + «Сбросить все переопределения».
// ════════════════════════════════════════════════════════════════════════════

// The live «Правила дома» values a reply scenario inherits — passed down from the
// page (the account autopilot config) so each row can show «наследуется (значение)».
export type L3Inherited = {
  audience: string; // reply_audience enum (fans | all_except_trolls | questions | custom)
  audiencePrompt: string; // the account custom audience text (when audience === "custom")
  limit: number; // replies_per_day ceiling
  freq: ReplyFreq; // reply check rhythm
  quietOn: boolean; // account quiet-hours on/off
  quietFrom: string; // "HH:00"
  quietTo: string; // "HH:00"
};

// The 4-way frequency segment (the same control «Правила дома» uses — overriding the
// SAME account value). Labels reuse the account-level `ap.freq.*` keys.
const L3_FREQS: { key: ReplyFreq; labelKey: MessageKey }[] = [
  { key: "instant", labelKey: "ap.freq.instant" },
  { key: "hourly", labelKey: "ap.freq.hourly" },
  { key: "few", labelKey: "ap.freq.few" },
  { key: "daily", labelKey: "ap.freq.daily" },
];

// A short human phrase for an inherited audience value (for «наследуется (…)» +
// «В Правилах дома: …»). Built-in enums read their phrase key; «custom» echoes the
// account's own description (trimmed), else a generic fallback.
function audienceInheritPhrase(t: T, audience: string, prompt: string): string {
  if (audience === "fans") return t("scenarios.aud_phrase.fans");
  if (audience === "questions") return t("scenarios.aud_phrase.questions");
  if (audience === "custom") return prompt.trim() || t("scenarios.aud_phrase.custom");
  return t("scenarios.aud_phrase.all");
}
function freqPhrase(t: T, f: ReplyFreq): string {
  return t(L3_FREQS.find((x) => x.key === f)?.labelKey ?? "ap.freq.hourly");
}
function quietPhrase(t: T, on: boolean, from: string, to: string): string {
  if (!on || from === to) return t("scenarios.rc.l3.quiet_none");
  return `${from} – ${to}`;
}

// One override row. Collapsed: icon + title + sub + «наследуется (значение)» badge +
// «Переопределить». Expanded (overridden): the row highlights, the badge flips to
// «переопределено здесь», the control renders, and a foot shows «В Правилах дома:
// <inherited>» + «Вернуть к наследованию».
function L3Row({
  icon,
  title,
  sub,
  overridden,
  inheritedPhrase,
  onOverride,
  onRevert,
  children,
}: {
  icon: ReactNode;
  title: string;
  sub: string;
  overridden: boolean;
  /** The INHERITED «Правила дома» value — shown both on the collapsed «Сейчас
   *  действует» line (when inherited) and in the «В Правилах дома: …» foot (when
   *  overridden). Always the account value, never the current override. */
  inheritedPhrase: string;
  onOverride: () => void;
  onRevert: () => void;
  children?: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border px-[15px] py-3.5 transition-colors",
        overridden ? "border-accent/40 bg-accent/[0.04] shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-accent)_18%,transparent)]" : "border-border bg-surface",
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "grid h-7 w-7 shrink-0 place-items-center rounded-sm border",
            overridden ? "border-accent/26 bg-accent/[0.11] text-accent" : "border-border bg-surface-2 text-text-muted",
          )}
        >
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-small font-semibold text-text">{title}</span>
            {overridden ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-surface px-[7px] py-px font-mono text-[9.5px] uppercase tracking-[0.03em] text-accent">
                <IcCheck size={10} /> {t("scenarios.rc.l3.over_badge")}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-border bg-surface-2 px-[7px] py-px font-mono text-[9.5px] uppercase tracking-[0.03em] text-text-subtle">
                <IcShieldHouse size={10} /> {t("scenarios.rc.l3.inherit_badge")}
              </span>
            )}
          </div>
          <div className="mt-0.5 text-caption leading-[1.45] text-text-subtle">{sub}</div>
          {!overridden && (
            <div className="mt-1.5 text-caption text-text-muted">
              {t("scenarios.rc.l3.now")} <b className="font-semibold text-text">{inheritedPhrase}</b>
            </div>
          )}
        </div>
        {!overridden && (
          <button
            type="button"
            onClick={onOverride}
            className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-sm border border-border bg-surface px-2.5 py-1.5 text-caption font-semibold text-text-muted transition-colors hover:border-accent/40 hover:text-accent"
          >
            <IcSliders size={12} /> {t("scenarios.rc.l3.override")}
          </button>
        )}
      </div>

      {overridden && (
        <div className="flex flex-col gap-3 border-t border-accent/15 pt-3">
          {children}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-caption text-text-subtle [&_b]:font-semibold [&_b]:text-text-muted">
              <IcShieldHouse size={12} className="shrink-0 opacity-80" />
              <span dangerouslySetInnerHTML={{ __html: t("scenarios.rc.l3.in_house").replace("{value}", inheritedPhrase) }} />
            </span>
            <button
              type="button"
              onClick={onRevert}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-sm px-2 py-1 text-caption font-semibold text-accent transition-colors hover:bg-accent/[0.09]"
            >
              <IcUndo size={12} /> {t("scenarios.rc.l3.revert")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// The 4-tile audience grid + custom free-text — reused from the КОМУ slot (same
// AUD_TILES). Lives inside the «Кому отвечать» override row.
function L3AudienceControl({
  audience,
  onAudience,
  audiencePrompt,
  onOpenCustom,
}: {
  audience: string;
  onAudience: (a: string) => void;
  audiencePrompt: string;
  onOpenCustom: () => void;
}) {
  const { t } = useTranslation();
  const custom = audience === "custom";
  return (
    <>
      <div className="grid grid-cols-2 gap-2.5 max-[520px]:grid-cols-1">
        {AUD_TILES.map((tile) => {
          const on = tile.key === audience;
          return (
            <button
              key={tile.key}
              type="button"
              onClick={() => onAudience(tile.key)}
              aria-pressed={on}
              className={cn(
                "flex flex-col gap-1 rounded-md border bg-surface px-[13px] py-3 text-left transition-colors",
                on ? "border-accent bg-accent/[0.06] shadow-[0_0_0_1px_var(--color-accent)]" : "border-border hover:border-text/16",
              )}
            >
              <span className="flex items-center gap-[7px] text-small font-semibold text-text">
                <span className={cn("shrink-0", on ? "text-accent" : "text-text-subtle")}>{tile.icon}</span>
                {t(tile.titleKey)}
              </span>
              <span className="text-caption leading-[1.4] text-text-subtle">{t(tile.subKey)}</span>
            </button>
          );
        })}
      </div>
      {custom && <BigText value={audiencePrompt} hint={t("scenarios.rc.aud_custom_hint")} onOpen={onOpenCustom} />}
      <p className="inline-flex flex-wrap items-center gap-1.5 text-caption text-text-subtle">
        <IcLock size={11} className="shrink-0 opacity-70" />
        {t("scenarios.rc.l3.trolls_always")}
      </p>
    </>
  );
}

// «Лимит ответов в день» override — the design's big-number slider (5–100).
function L3LimitControl({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const { t } = useTranslation();
  const pct = ((value - L3_LIMIT_SLIDER_MIN) / (L3_LIMIT_SLIDER_MAX - L3_LIMIT_SLIDER_MIN)) * 100;
  return (
    <label className="flex flex-col gap-2">
      <span className="flex items-baseline justify-between">
        <span className="text-caption font-medium text-text-muted">{t("scenarios.rc.l3.limit_unit")}</span>
        <span className="text-h3 font-semibold tabular-nums text-text">{value}</span>
      </span>
      <input
        type="range"
        min={L3_LIMIT_SLIDER_MIN}
        max={L3_LIMIT_SLIDER_MAX}
        value={value}
        aria-label={t("scenarios.rc.l3.limit_title")}
        onChange={(e) => onChange(Number(e.target.value))}
        className="rc-range h-[5px] w-full cursor-pointer appearance-none rounded-full outline-none"
        style={{
          background: `linear-gradient(90deg, color-mix(in srgb, var(--color-accent) 55%, var(--color-surface)) 0 ${pct}%, var(--color-border) ${pct}% 100%)`,
        }}
      />
    </label>
  );
}

// «Частота проверки» override — the 4-way segment (the same account-level control).
function L3FreqControl({ value, onChange }: { value: ReplyFreq; onChange: (f: ReplyFreq) => void }) {
  const { t } = useTranslation();
  return (
    <Seg options={L3_FREQS.map((f) => ({ key: f.key, label: t(f.labelKey) }))} value={value} onPick={(k) => onChange(k as ReplyFreq)} />
  );
}

// «Тихие часы» override — two hour selects + «без тихих часов» (from==to encodes the
// zero-width "no quiet hours" window the backend accepts).
function L3QuietControl({
  from,
  to,
  onFrom,
  onTo,
}: {
  from: string;
  to: string;
  onFrom: (v: string) => void;
  onTo: (v: string) => void;
}) {
  const { t } = useTranslation();
  const none = from === to;
  const HOURS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`);
  const SELECT =
    "h-9 rounded-md border border-border bg-surface px-2.5 text-small tabular-nums text-text transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25 disabled:opacity-50 max-md:min-h-[44px] max-md:text-[16px]";
  return (
    <div className="flex flex-col gap-2.5">
      <div className={cn("flex flex-wrap items-center gap-2 text-small text-text-muted", none && "opacity-50")}>
        <span>{t("scenarios.rc.l3.quiet_from")}</span>
        <select className={SELECT} value={from} onChange={(e) => onFrom(e.target.value)} disabled={none} aria-label={t("scenarios.rc.l3.quiet_from")}>
          {HOURS.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
        <span>{t("scenarios.rc.l3.quiet_to")}</span>
        <select className={SELECT} value={to} onChange={(e) => onTo(e.target.value)} disabled={none} aria-label={t("scenarios.rc.l3.quiet_to")}>
          {HOURS.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
      </div>
      <label className="inline-flex cursor-pointer items-center gap-2 text-caption text-text-muted">
        <input
          type="checkbox"
          checked={none}
          onChange={(e) => {
            // «без тихих часов» = a zero-width window (from==to). Toggling off restores
            // the design default window so the selects aren't stuck equal.
            if (e.target.checked) onTo(from);
            else onTo(from === "23:00" ? "08:00" : "23:00");
          }}
          className="h-3.5 w-3.5 rounded-sm border-border text-accent accent-[var(--color-accent)]"
        />
        {t("scenarios.rc.l3.quiet_none_toggle")}
      </label>
    </div>
  );
}

// The Layer-3 accordion BODY — the override list. Reply scenarios only (the editor
// shows a different note for non-reply kinds). `onOpenCustom` opens the big-text
// modal for the custom audience (the same modal the КОМУ slot uses).
export function Layer3Override({
  form,
  update,
  inherited,
  onOpenCustom,
}: {
  form: FormState;
  update: (patch: Partial<FormState>) => void;
  inherited: L3Inherited;
  onOpenCustom: () => void;
}) {
  const { t } = useTranslation();
  const overrides = [form.l3WhoOn, form.l3LimitOn, form.l3FreqOn, form.l3QuietOn];
  const overCount = overrides.filter(Boolean).length;
  // Revert «Кому отвечать» to inherited: drop the override flag AND restore the
  // account audience/prompt into the form (so the КОМУ slot reads inherited again).
  const revertWho = () => update({ l3WhoOn: false, audience: inherited.audience, audiencePrompt: inherited.audiencePrompt });
  // Override «Кому отвечать»: flip the flag; the form audience already mirrors the
  // inherited value at open, so the grid starts on the inherited tile.
  const overrideWho = () => update({ l3WhoOn: true });
  const resetAll = () =>
    update({
      l3WhoOn: false,
      audience: inherited.audience,
      audiencePrompt: inherited.audiencePrompt,
      l3LimitOn: false,
      l3FreqOn: false,
      l3QuietOn: false,
    });
  return (
    <div className="flex flex-col gap-3.5">
      {/* lead — override counter + reset-all */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-caption text-text-muted [&_b]:font-semibold [&_b]:text-text">
          <IcShieldHouse size={14} className="shrink-0 text-accent" />
          {overCount === 0 ? (
            <span>{t("scenarios.rc.l3.lead_all_inherit")}</span>
          ) : (
            <span dangerouslySetInnerHTML={{ __html: t("scenarios.rc.l3.lead_count").replace("{n}", String(overCount)) }} />
          )}
        </p>
        {overCount > 0 && (
          <button
            type="button"
            onClick={resetAll}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-sm px-2 py-1 text-caption font-semibold text-text-muted transition-colors hover:text-danger"
          >
            <IcUndo size={12} /> {t("scenarios.rc.l3.reset_all")}
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2.5">
        {/* 1 — Кому отвечать */}
        <L3Row
          icon={<IcPerson size={14} />}
          title={t("scenarios.rc.l3.who_title")}
          sub={t("scenarios.rc.l3.who_sub")}
          overridden={form.l3WhoOn}
          inheritedPhrase={audienceInheritPhrase(t, inherited.audience, inherited.audiencePrompt)}
          onOverride={overrideWho}
          onRevert={revertWho}
        >
          <L3AudienceControl
            audience={form.audience}
            onAudience={(a) => update({ audience: a })}
            audiencePrompt={form.audiencePrompt}
            onOpenCustom={onOpenCustom}
          />
        </L3Row>

        {/* 2 — Лимит ответов в день */}
        <L3Row
          icon={<IcGauge size={14} />}
          title={t("scenarios.rc.l3.limit_title")}
          sub={t("scenarios.rc.l3.limit_sub")}
          overridden={form.l3LimitOn}
          inheritedPhrase={t("scenarios.rc.l3.limit_value").replace("{n}", String(inherited.limit))}
          onOverride={() => update({ l3LimitOn: true, l3Limit: inherited.limit })}
          onRevert={() => update({ l3LimitOn: false })}
        >
          <L3LimitControl value={form.l3Limit} onChange={(n) => update({ l3Limit: n })} />
        </L3Row>

        {/* 3 — Частота проверки */}
        <L3Row
          icon={<IcTimer size={14} />}
          title={t("scenarios.rc.l3.freq_title")}
          sub={t("scenarios.rc.l3.freq_sub")}
          overridden={form.l3FreqOn}
          inheritedPhrase={freqPhrase(t, inherited.freq)}
          onOverride={() => update({ l3FreqOn: true, l3Freq: inherited.freq })}
          onRevert={() => update({ l3FreqOn: false })}
        >
          <L3FreqControl value={form.l3Freq} onChange={(f) => update({ l3Freq: f })} />
        </L3Row>

        {/* 4 — Тихие часы */}
        <L3Row
          icon={<IcMoon size={14} />}
          title={t("scenarios.rc.l3.quiet_title")}
          sub={t("scenarios.rc.l3.quiet_sub")}
          overridden={form.l3QuietOn}
          inheritedPhrase={quietPhrase(t, inherited.quietOn, inherited.quietFrom, inherited.quietTo)}
          onOverride={() =>
            update({
              l3QuietOn: true,
              // seed from the inherited window when the account has one, else the design default.
              l3QuietFrom: inherited.quietOn ? inherited.quietFrom : "23:00",
              l3QuietTo: inherited.quietOn ? inherited.quietTo : "08:00",
            })
          }
          onRevert={() => update({ l3QuietOn: false })}
        >
          <L3QuietControl from={form.l3QuietFrom} to={form.l3QuietTo} onFrom={(v) => update({ l3QuietFrom: v })} onTo={(v) => update({ l3QuietTo: v })} />
        </L3Row>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  DRAWER ICON map — the head icon per slot
// ════════════════════════════════════════════════════════════════════════════
export const SLOT_ICON: Record<Exclude<OpenSlot, null>, ReactNode> = {
  when: <IcClock size={15} />,
  if: <IcSliders size={15} />,
  what: <IcPencil size={15} />,
  who: <IcPerson size={15} />,
  tone: <IcBubble size={15} />,
  how: <IcCheck size={15} />,
  target: <IcTarget size={15} />,
  metric: <IcGauge size={15} />,
};

// re-export so the editor can reference the same translator type
export type { T };
