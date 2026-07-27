"use client";

// Content Calendar presentational layer — a centered agenda-lente (the same
// idiom on desktop + mobile, per Calendar-SPEC.html): a range navigator, then
// day-groups (sticky header, today highlighted, past dimmed) of entry rows in
// three honest variants — manual (solid, pencil), autopilot projection (ghost
// dashed, clock, "written at post time", read-only), failed (danger). Tapping a
// row opens a detail dialog with the per-status actions. Pure components driven
// by props so the live screen (real API) and the ?demo=1 review render alike.

import { Fragment, useEffect, useState } from "react";

import { cn } from "@/lib/cn";
import { useTranslation } from "@/lib/i18n";
import { Button, buttonClasses } from "@/components/ui/button";
import {
  IcArrowLeft,
  IcArrowRight,
  IcCalendar,
  IcClock,
  IcExternal,
  IcPencil,
  IcPlus,
  IcReload,
  IcSend,
  IcTrash,
  IcX,
} from "@/components/icons";
import type { CalendarEntry } from "@/lib/types";

// ─────────────────────────────── helpers ────────────────────────────────────

export function fmtTime(iso: string, locale: string): string {
  return new Date(iso).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
}
function fmtUtc(iso: string): string {
  return new Date(iso).toISOString().slice(11, 16);
}
function fmtWhen(iso: string, locale: string): string {
  return new Date(iso).toLocaleString(locale, { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
export function draftIdOf(entry: CalendarEntry): number | null {
  return entry.id.startsWith("draft-") ? Number(entry.id.slice(6)) : null;
}

type DayGroup = { key: string; date: Date; isToday: boolean; isPast: boolean; entries: CalendarEntry[] };

export function groupByDay(entries: CalendarEntry[]): DayGroup[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const map = new Map<string, DayGroup>();
  for (const e of [...entries].sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))) {
    const d = new Date(e.scheduled_at);
    const day = new Date(d);
    day.setHours(0, 0, 0, 0);
    const key = day.toISOString().slice(0, 10);
    let g = map.get(key);
    if (!g) {
      g = { key, date: day, isToday: day.getTime() === today.getTime(), isPast: day.getTime() < today.getTime(), entries: [] };
      map.set(key, g);
    }
    g.entries.push(e);
  }
  return [...map.values()].sort((a, b) => a.date.getTime() - b.date.getTime());
}

// ─────────────────────────────── Toolbar ────────────────────────────────────

export function CalendarToolbar({
  rangeLabel,
  tzLabel,
  onPrev,
  onNext,
  onToday,
  onSchedule,
}: {
  rangeLabel: string;
  tzLabel: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onSchedule: () => void;
}) {
  const { t } = useTranslation();
  // `shrink-0` is load-bearing: without it the 32px steppers squeeze to ~17px
  // on a 375px phone once a long locale's range label and «Сегодня» join the
  // row (spec `.mcal-navbtn` is `flex: 0 0 auto`).
  const nav = "grid h-8 w-8 shrink-0 place-items-center rounded-md border border-border bg-surface text-text-muted transition-colors hover:bg-surface-2 hover:text-text";
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <div className="min-w-0 flex-1">
        <h1 className="text-h1 font-semibold tracking-[-0.015em]">{t("calendar.title")}</h1>
        <p className="text-body text-text-muted">{t("calendar.subtitle")}</p>
      </div>
      <Button variant="secondary" size="sm" icon={<IcPlus size={15} />} onClick={onSchedule} className="max-md:order-2">
        {t("calendar.schedule_post")}
      </Button>
      {/* Wraps rather than clips: on a long locale the tz chip drops to a second
          line instead of running off the right edge (mobile spec §11). */}
      <div className="flex flex-wrap items-center gap-2 gap-y-2.5 max-md:order-1 max-md:w-full">
        <button type="button" aria-label={t("calendar.prev")} onClick={onPrev} className={nav}><IcArrowLeft size={15} /></button>
        <span className="min-w-[8.5rem] text-center text-small font-medium tabular-nums text-text">{rangeLabel}</span>
        <button type="button" aria-label={t("calendar.next")} onClick={onNext} className={nav}><IcArrowRight size={15} /></button>
        <button type="button" onClick={onToday} className={cn(buttonClasses({ variant: "ghost", size: "sm" }), "shrink-0")}>{t("calendar.today")}</button>
        <span className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-caption text-text-subtle">
          <IcClock size={12} /> {tzLabel}
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────── Agenda ─────────────────────────────────────

const SRC_ICON = { manual: IcPencil, autopilot: IcClock } as const;

function EntryRow({ entry, locale, onSelect }: { entry: CalendarEntry; locale: string; onSelect: (e: CalendarEntry) => void }) {
  const { t } = useTranslation();
  const proj = entry.status === "projected";
  const failed = entry.status === "failed";
  const past = new Date(entry.scheduled_at).getTime() < Date.now();
  const Icon = SRC_ICON[entry.source];
  const srcLabel = entry.source === "manual" ? (failed ? t("calendar.src_failed") : t("calendar.src_manual")) : `${t("calendar.src_autopilot")}${entry.rule_name ? ` · ${entry.rule_name}` : ""}`;
  return (
    <button
      type="button"
      onClick={() => onSelect(entry)}
      className={cn(
        "flex w-full items-start gap-3 rounded-lg border px-3.5 py-3 text-left transition-colors",
        proj
          ? "border-dashed border-border bg-transparent hover:bg-surface-2"
          : failed
            ? "border-danger/40 bg-danger/[0.06] hover:bg-danger/10"
            : "border-border bg-surface shadow-sm hover:bg-surface-2",
        past && "opacity-[0.55] hover:opacity-100",
      )}
    >
      <div className="flex w-[58px] shrink-0 flex-col items-start gap-1">
        <span className={cn("text-small font-semibold tabular-nums", failed ? "text-danger" : proj ? "text-text-muted" : "text-text")}>{fmtTime(entry.scheduled_at, locale)}</span>
        <span className={cn("grid h-[26px] w-[26px] place-items-center rounded-md border", failed ? "border-danger/30 bg-danger/10 text-danger" : proj ? "border-border bg-surface-2 text-text-subtle" : "border-accent/25 bg-accent/10 text-accent")}>
          <Icon size={14} />
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-caption font-semibold text-text-subtle">{srcLabel}</div>
        <div className={cn("mt-0.5 line-clamp-2 text-small leading-[1.45]", proj ? "italic text-text-subtle" : "text-text")}>
          {proj ? t("calendar.written_at_post_time") : entry.text}
        </div>
      </div>
      <span className={cn("mt-1.5 h-[7px] w-[7px] shrink-0 rounded-full", failed ? "bg-danger" : proj ? "bg-text-subtle/40" : "bg-accent")} />
    </button>
  );
}

// The unobtrusive "now" divider inside today's list (spec §2.2, `.cal-nowrow`):
// a label on the left, a hairline filling the rest.
function NowRow({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2.5 px-0.5 py-px">
      <span className="shrink-0 text-caption font-semibold tabular-nums text-accent">{label}</span>
      <span className="h-[1.5px] flex-1 rounded-[2px] bg-accent opacity-45" />
    </div>
  );
}

export function CalendarAgenda({ entries, onSelect }: { entries: CalendarEntry[]; onSelect: (e: CalendarEntry) => void }) {
  const { t, locale } = useTranslation();
  const groups = groupByDay(entries);
  // Read the clock only after mount (a server-rendered "now" would mismatch on
  // hydration) and re-read it every minute so the divider keeps up with time.
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  const nowLabel = now ? `${t("calendar.now")} · ${fmtTime(now.toISOString(), locale)}` : null;
  return (
    <div className="flex flex-col gap-5">
      {groups.map((g) => {
        // Index of the first entry still ahead of us — where the divider goes.
        // All past → it lands after the last row; all ahead → before the first.
        const nowAt = g.isToday && now ? g.entries.findIndex((e) => new Date(e.scheduled_at).getTime() > now.getTime()) : -1;
        const nowIdx = nowAt === -1 && g.isToday && now ? g.entries.length : nowAt;
        return (
          <section key={g.key}>
            <div className={cn("sticky top-13 z-[4] -mx-1 mb-2 flex items-baseline gap-2 bg-bg/85 px-1 py-1 backdrop-blur md:top-15", g.isPast && "opacity-60")}>
              <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg text-h3 font-semibold tabular-nums", g.isToday ? "bg-accent text-accent-foreground" : "text-text")}>{g.date.getDate()}</span>
              <span className="text-small font-semibold text-text">{g.date.toLocaleDateString(locale, { weekday: "long" })}</span>
              <span className="text-caption text-text-subtle">{g.date.toLocaleDateString(locale, { month: "short", day: "numeric" })}</span>
              {g.isToday && <span className="rounded-full bg-accent/12 px-2 py-px text-caption font-semibold text-accent">{t("calendar.today")}</span>}
              <span className="ml-auto text-caption text-text-subtle">{g.entries.length}</span>
            </div>
            <div className="flex flex-col gap-2">
              {g.entries.map((e, i) => (
                <Fragment key={e.id}>
                  {nowLabel && i === nowIdx && <NowRow label={nowLabel} />}
                  <EntryRow entry={e} locale={locale} onSelect={onSelect} />
                </Fragment>
              ))}
              {nowLabel && nowIdx === g.entries.length && <NowRow label={nowLabel} />}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export function CalendarEmpty({ onSchedule }: { onSchedule: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center rounded-lg border border-dashed border-border px-6 py-14 text-center">
      <span className="mb-3.5 grid h-[46px] w-[46px] place-items-center rounded-md border border-border bg-surface-2 text-text-subtle"><IcCalendar size={22} /></span>
      <p className="text-h3 font-semibold">{t("calendar.empty_title")}</p>
      <p className="mt-1.5 max-w-[42ch] text-small leading-relaxed text-text-muted">{t("calendar.empty_sub")}</p>
      <Button variant="secondary" size="sm" icon={<IcPlus size={15} />} onClick={onSchedule} className="mt-4">{t("calendar.schedule_post")}</Button>
    </div>
  );
}

export function CalendarSkeleton() {
  const line = (w: string, h = "h-[60px]") => <div className={cn("skel-line rounded-[10px]", h)} style={{ width: w }} />;
  return (
    <div className="flex flex-col gap-5" aria-hidden>
      {[0, 1].map((i) => (
        <div key={i} className="flex flex-col gap-2">
          <div className="skel-line mb-1 h-3.5 w-32 rounded" />
          {line("100%")}
          {line("100%")}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────── Detail ─────────────────────────────────────

export function EntryDetail({
  entry,
  busy,
  onClose,
  onReschedule,
  onPublishNow,
  onUnschedule,
  onRetry,
}: {
  entry: CalendarEntry;
  busy: boolean;
  onClose: () => void;
  onReschedule: (iso: string) => void;
  onPublishNow: () => void;
  onUnschedule: () => void;
  onRetry: () => void;
}) {
  const { t, locale } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const proj = entry.status === "projected";
  const failed = entry.status === "failed";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !busy) onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  function startEdit() {
    const d = new Date(entry.scheduled_at);
    const p = (n: number) => String(n).padStart(2, "0");
    setDate(`${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`);
    setTime(`${p(d.getHours())}:${p(d.getMinutes())}`);
    setEditing(true);
  }
  const localDt = date && time ? new Date(`${date}T${time}`) : null;
  const farEnough = localDt !== null && !Number.isNaN(localDt.getTime()) && localDt.getTime() >= Date.now() + 5 * 60 * 1000;
  const fieldCls = "h-9 rounded-md border border-border bg-surface px-2.5 text-small text-text outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 max-md:h-11 max-md:text-[16px]";

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-ink-950/55 p-6 backdrop-blur-sm max-md:place-items-end max-md:p-0" role="dialog" aria-modal="true"
      onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) onClose(); }}>
      <div className="w-full max-w-[420px] rounded-2xl border border-border bg-surface p-6 shadow-lg max-md:max-w-none max-md:rounded-b-none max-md:rounded-t-2xl max-md:pb-[calc(24px+env(safe-area-inset-bottom))]"
        style={{ animation: "dialog-in var(--duration-slow) var(--ease-entrance) both" }}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-small font-semibold tabular-nums">{fmtTime(entry.scheduled_at, locale)}</div>
            <div className="mt-0.5 text-caption text-text-subtle">{fmtUtc(entry.scheduled_at)} UTC · {new Date(entry.scheduled_at).toLocaleDateString(locale, { weekday: "short", month: "short", day: "numeric" })}</div>
          </div>
          <button type="button" aria-label={t("calendar.close")} onClick={onClose} className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-text-subtle hover:bg-surface-2 hover:text-text"><IcX size={16} /></button>
        </div>

        <div className="mt-3 inline-flex items-center gap-1.5 text-caption font-semibold text-text-muted">
          {entry.source === "manual" ? <IcPencil size={13} /> : <IcClock size={13} />}
          {entry.source === "manual" ? (failed ? t("calendar.src_failed") : t("calendar.src_manual")) : `${t("calendar.src_autopilot")}${entry.rule_name ? ` · ${entry.rule_name}` : ""}`}
        </div>
        <div className={cn("mt-2 max-h-[180px] overflow-y-auto whitespace-pre-wrap rounded-md border border-border bg-surface-2 p-3.5 text-body leading-[1.55]", proj ? "italic text-text-subtle" : "text-text")}>
          {proj ? t("calendar.written_at_post_time") : entry.text}
        </div>
        {failed && entry.error && (
          <div className="mt-2.5 rounded-md border border-danger/30 bg-danger/[0.07] p-3 text-caption leading-relaxed text-danger">{entry.error}</div>
        )}

        {editing && (
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            <input type="date" value={date} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)} className={fieldCls} aria-label={t("studio.sched_date")} />
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={fieldCls} aria-label={t("studio.sched_time")} />
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-end gap-2.5 max-md:flex-col-reverse max-md:items-stretch">
          {proj ? (
            <a href="/app/autopilot" className={buttonClasses({ variant: "secondary", size: "sm", className: "max-md:min-h-[44px] max-md:w-full" })}>
              <IcExternal size={15} /> {t("calendar.manage_schedule")}
            </a>
          ) : editing ? (
            <>
              <button onClick={() => setEditing(false)} disabled={busy} className={buttonClasses({ variant: "ghost", className: "max-md:min-h-[44px] max-md:w-full" })}>{t("studio.cancel")}</button>
              <Button variant="primary" size="sm" icon={<IcClock size={15} />} loading={busy} disabled={busy || !farEnough} className="max-md:min-h-[44px] max-md:w-full" onClick={() => { if (farEnough && localDt) onReschedule(localDt.toISOString()); }}>{t("studio.save")}</Button>
            </>
          ) : failed ? (
            <>
              <button onClick={onUnschedule} disabled={busy} className={buttonClasses({ variant: "ghost", className: "text-danger max-md:min-h-[44px] max-md:w-full" })}><IcTrash size={15} /> {t("calendar.unschedule")}</button>
              <Button variant="primary" size="sm" icon={<IcReload size={15} />} loading={busy} disabled={busy} className="max-md:min-h-[44px] max-md:w-full" onClick={onRetry}>{t("calendar.retry")}</Button>
            </>
          ) : (
            <>
              <button onClick={onUnschedule} disabled={busy} className={buttonClasses({ variant: "ghost", className: "max-md:min-h-[44px] max-md:w-full" })}>{t("calendar.unschedule")}</button>
              <button onClick={onPublishNow} disabled={busy} className={buttonClasses({ variant: "secondary", size: "sm", className: "max-md:min-h-[44px] max-md:w-full" })}><IcSend size={15} /> {t("calendar.publish_now")}</button>
              <Button variant="primary" size="sm" icon={<IcClock size={15} />} disabled={busy} className="max-md:min-h-[44px] max-md:w-full" onClick={startEdit}>{t("calendar.edit_time")}</Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
