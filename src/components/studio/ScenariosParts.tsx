"use client";

// Scenarios — presentational pieces for /app/scenarios. Rebuilt 1:1 to the new
// Scenarios-{WEB,Mobile}-SPEC (_cd-new). The OLD 4-template picker + the
// separate «Свой» editor are GONE: there is now ONE scenario and ONE form.
//
//   a scenario = КОГДА (schedule) → ИНСТРУКЦИЯ → [КАК ОТВЕЧАТЬ]
//
// Templates became PRESETS (a thin chip row) that pre-fill that one form. The
// rich «Акция» editor is PRESERVED as the "Промо-помощник ВКЛ" disclosure of
// the form. The raw model lives under a "Показать как сценарий" disclosure.
// Icons: scenario = repeat-loop (one for all), promo helper = gift, auto-reply
// = chat bubble. No bolt. No «Свой» card.

import { type ReactNode } from "react";

import { Button, buttonClasses } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/cn";
import { useTranslation } from "@/lib/i18n";
import {
  IcBubble,
  IcCalendar,
  IcCheck,
  IcChevRight,
  IcClock,
  IcEye,
  IcGift,
  IcHeart,
  IcList,
  IcReload,
  IcRepeat,
  IcSparkle,
  IcTrash,
  IcUsers,
} from "@/components/icons";
import type { MessageKey } from "@/lib/i18n/messages/en";
import type { Scenario, ScenarioPromoFields, ScenarioPreview } from "@/lib/types";

type IconCmp = (p: { size?: number; className?: string }) => React.ReactNode;
type T = (k: MessageKey) => string;

// ── field recipes (shared with the page-composed form) ──
const SELECT =
  "h-10 w-full rounded-md border border-border bg-surface px-2.5 text-small text-text transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25 max-md:min-h-[44px] max-md:text-[16px]";
const INPUT =
  "h-10 w-full rounded-md border border-border bg-surface px-3 text-body text-text transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25 max-md:min-h-[44px] max-md:text-[16px]";
const TEXTAREA =
  "w-full rounded-md border border-border bg-surface px-3 py-2 text-body text-text transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25 max-md:text-[16px]";

export { SELECT, INPUT, TEXTAREA };

// ── presets (the entry chip row). Only «Акция» (promo) is live. ──
export type Preset = "promo" | "rubric" | "seasonal";
export const PRESETS: { key: Preset; icon: IconCmp; label: MessageKey; ready: boolean }[] = [
  { key: "promo", icon: IcGift, label: "scenarios.tpl.promo", ready: true },
  { key: "rubric", icon: IcList, label: "scenarios.tpl.rubric", ready: false },
  { key: "seasonal", icon: IcCalendar, label: "scenarios.tpl.seasonal", ready: false },
];

function fmtRun(iso: string | null, locale: string): string {
  if (!iso) return "";
  const loc = locale === "ru" ? "ru-RU" : locale === "en" ? "en-US" : locale;
  return new Date(iso).toLocaleString(loc, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

// A short, human schedule summary for the provenance badge / card desc of a
// FREE scenario (a promo scenario shows the «Акция» badge instead).
export function scheduleSummary(s: Scenario, t: T): string {
  const kind = (s.trigger_cfg?.kind as string) || "";
  if (kind === "every_n_days") {
    const n = (s.trigger_cfg?.n as number) ?? "N";
    return `${t("scenarios.sched.every_n")} (${n})`;
  }
  return t("scenarios.sched.daily");
}

// ───────────────────────────── list card ────────────────────────────────────
// One icon for every scenario (repeat-loop). The badge is PROVENANCE, not a
// type: promo-seeded → soft «Акция» (accent + gift); else → schedule summary
// (neutral, mono "when: …").
export function ScenarioCard({
  s,
  onToggle,
  onOpen,
}: {
  s: Scenario;
  onToggle: (s: Scenario, on: boolean) => void;
  onOpen: (s: Scenario) => void;
}) {
  const { t, locale } = useTranslation();
  const isPromo = s.template === "promo";
  const desc =
    isPromo && s.structured
      ? `${s.structured.ask} → ${s.structured.reward}`
      : s.instruction || scheduleSummary(s, t);
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-surface p-4 shadow-sm transition-colors hover:border-text/15 hover:shadow-md md:p-[18px]",
        !s.enabled && "opacity-[0.78]",
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "grid h-10 w-10 shrink-0 place-items-center rounded-md border",
            s.enabled ? "border-success/30 bg-success/12 text-success" : "border-border bg-surface-2 text-text-muted",
          )}
        >
          <IcRepeat size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pr-1">
            <h3 className="text-body font-semibold tracking-tight">{s.name}</h3>
            {isPromo ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-caption font-medium text-accent">
                <IcGift size={12} /> {t("scenarios.tpl.promo")}
              </span>
            ) : (
              <span className="rounded-full border border-border bg-surface-2 px-2 py-0.5 font-mono text-caption font-medium text-text-muted">
                {t("scenarios.prov_when").replace("{summary}", scheduleSummary(s, t))}
              </span>
            )}
          </div>
          <p className="mt-1 line-clamp-1 text-small text-text-muted">{desc}</p>
        </div>
        <label className="flex shrink-0 items-center gap-2 text-caption font-semibold text-text-subtle">
          <span className={cn("max-sm:sr-only", s.enabled && "text-success")}>
            {s.enabled ? t("scenarios.on") : t("scenarios.off")}
          </span>
          <Switch checked={s.enabled} onCheckedChange={(v) => onToggle(s, v)} aria-label={s.name} />
        </label>
      </div>
      <div className="mt-3.5 flex flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-caption tabular-nums text-text-subtle">
          <span>
            {t("scenarios.next_run")}:{" "}
            <span className={s.enabled && s.next_run_at ? "font-medium text-text" : ""}>
              {s.enabled && s.next_run_at ? fmtRun(s.next_run_at, locale) : t("scenarios.paused")}
            </span>
          </span>
          <span>
            {t("scenarios.last_run")}:{" "}
            <span className={s.last_run_at ? "font-medium text-text" : ""}>
              {s.last_run_at ? fmtRun(s.last_run_at, locale) : t("scenarios.never_ran")}
            </span>
          </span>
        </div>
        <Button size="sm" variant="secondary" onClick={() => onOpen(s)} className="shrink-0 max-sm:w-full">
          {t("scenarios.open")}
        </Button>
      </div>
    </div>
  );
}

export function ScenarioSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-surface p-[18px] shadow-sm">
      <div className="flex items-start gap-3">
        <span className="h-10 w-10 shrink-0 animate-pulse rounded-md bg-surface-2" />
        <div className="flex-1 space-y-2">
          <span className="block h-4 w-40 animate-pulse rounded bg-surface-2" />
          <span className="block h-3 w-64 animate-pulse rounded bg-surface-2" />
        </div>
        <span className="h-6 w-11 shrink-0 animate-pulse rounded-full bg-surface-2" />
      </div>
      <div className="mt-4 flex items-center gap-4 border-t border-border pt-3">
        <span className="h-3 w-24 animate-pulse rounded bg-surface-2" />
        <span className="h-3 w-28 animate-pulse rounded bg-surface-2" />
        <span className="ml-auto h-8 w-20 animate-pulse rounded-sm bg-surface-2" />
      </div>
    </div>
  );
}

// Empty: model explainer + the SAME preset chips (Акция live · Рубрика/Сезонное
// soon) + «Create» + «or from scratch». No «Свой».
export function ScenariosEmpty({ onCreate, onPreset }: { onCreate: () => void; onPreset: (p: Preset) => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center rounded-lg border border-dashed border-border px-6 py-12 text-center">
      <span className="mb-4 grid h-12 w-12 place-items-center rounded-md border border-border bg-surface-2 text-text-subtle">
        <IcRepeat size={24} />
      </span>
      <p className="text-h3 font-semibold">{t("scenarios.empty_title")}</p>
      <p className="mt-1.5 max-w-[46ch] text-small leading-relaxed text-text-muted">{t("scenarios.empty_sub")}</p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {PRESETS.map((p) => (
          <PresetChip key={p.key} preset={p} onPick={() => p.ready && onPreset(p.key)} />
        ))}
      </div>
      <Button variant="primary" className="mt-5" onClick={onCreate}>
        {t("scenarios.create")}
      </Button>
      <p className="mt-2 text-caption text-text-subtle">{t("scenarios.preset_or_scratch")}</p>
    </div>
  );
}

export function ScenariosError({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-start gap-3 rounded-lg border border-danger/30 bg-danger/[0.07] p-4">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-danger/12 text-danger">
        <IcReload size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-small font-semibold text-text">{t("scenarios.error")}</p>
        <p className="mt-0.5 text-caption leading-relaxed text-text-muted">{t("scenarios.error_sub")}</p>
      </div>
      <Button size="sm" variant="secondary" icon={<IcReload size={14} />} onClick={onRetry}>
        {t("scenarios.retry")}
      </Button>
    </div>
  );
}

// ─────────────────────────── entry: preset chips ────────────────────────────
function PresetChip({ preset, onPick }: { preset: (typeof PRESETS)[number]; onPick: () => void }) {
  const { t } = useTranslation();
  const Icon = preset.icon;
  return (
    <button
      type="button"
      disabled={!preset.ready}
      onClick={onPick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-small font-medium transition-colors max-md:min-h-[40px]",
        preset.ready
          ? "border-accent/30 bg-accent/[0.06] text-accent hover:border-accent/50 hover:shadow-sm"
          : "cursor-default border-border bg-surface-2 text-text-subtle opacity-70",
      )}
    >
      <Icon size={14} /> {t(preset.label)}
      {!preset.ready && (
        <span className="rounded-full border border-border px-1.5 font-mono text-[10px] uppercase tracking-wide text-text-subtle">
          {t("scenarios.soon")}
        </span>
      )}
    </button>
  );
}

// The thin preset bar above the form (new scenario only): «Start from a preset».
export function PresetBar({ onPick }: { onPick: (p: Preset) => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface-2/60 px-3.5 py-3">
      <span className="text-caption font-semibold uppercase tracking-wide text-text-subtle">{t("scenarios.preset_title")}</span>
      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map((p) => (
          <PresetChip key={p.key} preset={p} onPick={() => p.ready && onPick(p.key)} />
        ))}
      </div>
      <span className="text-caption text-text-subtle max-sm:w-full">{t("scenarios.preset_scratch")}</span>
    </div>
  );
}

// ─────────────────────────────── form bits ──────────────────────────────────
export function FormCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-lg border border-border bg-surface p-5 shadow-sm md:p-[22px]", className)}>{children}</section>
  );
}

export function CardTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-h3 font-semibold tracking-tight">{title}</h2>
      {sub && <p className="mt-1 text-small leading-relaxed text-text-subtle">{sub}</p>}
    </div>
  );
}

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: ReactNode;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-small font-medium text-text">{label}</span>
      {children}
      {error ? (
        <span className="text-caption text-danger">{error}</span>
      ) : hint ? (
        <span className="text-caption leading-relaxed text-text-subtle">{hint}</span>
      ) : null}
    </label>
  );
}

// «КОГДА» segment: Daily · Every N days · Over a date range (soon). Only the
// first two are buildable; date_range is shown disabled per the SPEC.
export function ScheduleSegment({
  value,
  nDays,
  onChange,
  onNDays,
}: {
  value: ScenarioPromoFields["schedule"];
  nDays: number;
  onChange: (v: ScenarioPromoFields["schedule"]) => void;
  onNDays: (n: number) => void;
}) {
  const { t } = useTranslation();
  const opts: { key: ScenarioPromoFields["schedule"] | "date_range"; label: MessageKey; soon?: boolean }[] = [
    { key: "daily", label: "scenarios.sched.daily" },
    { key: "every_n_days", label: "scenarios.sched.every_n" },
    { key: "date_range", label: "scenarios.sched.date_range", soon: true },
  ];
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-1 rounded-lg border border-border bg-surface-2 p-1 text-small">
        {opts.map((o) => {
          const active = !o.soon && o.key === value;
          return (
            <button
              key={o.key}
              type="button"
              disabled={o.soon}
              onClick={() => !o.soon && onChange(o.key as ScenarioPromoFields["schedule"])}
              aria-pressed={active}
              className={cn(
                "flex items-center justify-center gap-1.5 whitespace-normal rounded-md px-2.5 py-2 text-center font-medium transition-colors max-md:min-h-[44px]",
                active
                  ? "bg-surface text-text shadow-sm"
                  : o.soon
                    ? "cursor-default text-text-subtle opacity-70"
                    : "text-text-muted hover:text-text",
              )}
            >
              {t(o.label)}
              {o.soon && (
                <span className="rounded-full border border-border px-1.5 font-mono text-[10px] uppercase tracking-wide">
                  {t("scenarios.soon")}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {value === "every_n_days" ? (
        <div className="flex flex-wrap items-center gap-2.5 text-small text-text-muted">
          <span>{t("scenarios.f.n_days")}</span>
          <input
            type="number"
            min={1}
            max={90}
            inputMode="numeric"
            aria-label={t("scenarios.f.n_days")}
            className="h-10 w-[76px] rounded-md border border-border bg-surface text-center text-body tabular-nums text-text focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25 max-md:min-h-[44px] max-md:text-[16px]"
            value={nDays}
            onChange={(e) => onNDays(Math.min(90, Math.max(1, Number(e.target.value) || 1)))}
          />
          <span className="text-text-subtle">{t("scenarios.sched.every_n_unit").replace("{n}", String(nDays))}</span>
        </div>
      ) : (
        <p className="inline-flex items-center gap-1.5 text-small text-text-subtle">
          <IcClock size={14} /> {t("scenarios.sched.daily_note")}
        </p>
      )}
    </div>
  );
}

// Promo-helper disclosure. Head = gift + «Промо-помощник» + switch; ON → the
// preserved «Акция» fields (ask / reward / require-follow / require-like) + an
// accent border. This IS the re-hosted rich «Акция» editor.
export function PromoHelper({
  on,
  promo,
  askErr,
  onToggle,
  onChange,
}: {
  on: boolean;
  promo: ScenarioPromoFields;
  askErr?: boolean;
  onToggle: (on: boolean) => void;
  onChange: (p: ScenarioPromoFields) => void;
}) {
  const { t } = useTranslation();
  const set = <K extends keyof ScenarioPromoFields>(k: K, v: ScenarioPromoFields[K]) => onChange({ ...promo, [k]: v });
  return (
    <div className={cn("rounded-md border bg-surface transition-colors", on ? "border-accent/40" : "border-border")}>
      <div className="flex items-center justify-between gap-3 p-3.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className={cn(
              "grid h-8 w-8 shrink-0 place-items-center rounded-md border",
              on ? "border-accent/30 bg-accent/10 text-accent" : "border-border bg-surface-2 text-text-muted",
            )}
          >
            <IcGift size={16} />
          </span>
          <div className="min-w-0">
            <p className="text-small font-semibold">{t("scenarios.helper_title")}</p>
            {on && <p className="truncate text-caption text-text-subtle">{t("scenarios.helper_sub")}</p>}
          </div>
        </div>
        <Switch checked={on} onCheckedChange={onToggle} aria-label={t("scenarios.helper_title")} />
      </div>
      {on && (
        <div className="flex flex-col gap-4 border-t border-border p-3.5">
          <Field
            label={t("scenarios.f.ask")}
            hint={t("scenarios.f.ask_hint")}
            error={askErr ? t("scenarios.f.ask_err") : undefined}
          >
            <input
              className={cn(INPUT, askErr && "border-danger focus:border-danger focus:ring-danger/25")}
              value={promo.ask}
              onChange={(e) => set("ask", e.target.value)}
              placeholder={t("scenarios.f.ask_ph")}
            />
          </Field>
          <Field label={t("scenarios.f.reward")} hint={t("scenarios.f.reward_hint")}>
            <input className={INPUT} value={promo.reward} onChange={(e) => set("reward", e.target.value)} placeholder={t("scenarios.f.reward_ph")} />
          </Field>
          <div className="flex flex-col gap-1 border-t border-border pt-1.5">
            <ToggleRow
              icon={IcUsers}
              title={t("scenarios.f.require_follow")}
              sub={t("scenarios.f.require_follow_sub")}
              checked={promo.require_follow}
              onChange={(v) => set("require_follow", v)}
            />
            <ToggleRow
              icon={IcHeart}
              title={t("scenarios.f.require_like")}
              sub={t("scenarios.f.require_like_sub")}
              checked={promo.require_like}
              onChange={(v) => set("require_like", v)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function ToggleRow({
  icon: Icon,
  title,
  sub,
  checked,
  onChange,
}: {
  icon: IconCmp;
  title: string;
  sub: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 border-t border-border py-3 first:border-t-0">
      <span className="min-w-0">
        <span className="flex items-center gap-1.5 text-small font-semibold">
          <Icon size={14} /> {title}
        </span>
        <span className="mt-0.5 block text-caption leading-relaxed text-text-subtle">{sub}</span>
      </span>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={title} />
    </label>
  );
}

// Power-user disclosure — «Показать как сценарий». Collapsed = a row-button with
// a chevron; expanded = the raw КОГДА/ЕСЛИ/СГЕНЕРИРОВАТЬ/С ИНСТРУКЦИЕЙ fields.
// This is the old «Свой», expressed as raw fields, NOT a type.
export function PowerUserDisclosure({
  open,
  onToggle,
  instruction,
  onInstruction,
}: {
  open: boolean;
  onToggle: () => void;
  instruction: string;
  onInstruction: (v: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <FormCard className="p-0 md:p-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-2.5 px-5 py-4 text-left md:px-[22px]"
      >
        <IcChevRight size={16} className={cn("shrink-0 text-text-subtle transition-transform", open && "rotate-90")} />
        <span className="text-small font-semibold">{t("scenarios.disclose_show")}</span>
        <span className="rounded-full border border-border bg-surface-2 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-text-subtle">
          {t("scenarios.disclose_for_pros")}
        </span>
      </button>
      {open && (
        <div className="flex flex-col gap-4 border-t border-border p-5 md:p-[22px]">
          <RawField labelKey="scenarios.raw.when" subKey="scenarios.raw.when_sub" modelKey="когда">
            <select className={SELECT} aria-label={t("scenarios.raw.when")}>
              <option>{t("scenarios.raw.trig_daily")}</option>
              <option>{t("scenarios.raw.trig_every_n")}</option>
              <option>{t("scenarios.raw.trig_time")}</option>
              <option>{t("scenarios.raw.trig_comment")}</option>
              <option>{t("scenarios.raw.trig_mention")}</option>
            </select>
          </RawField>
          <RawField labelKey="scenarios.raw.if" subKey="scenarios.raw.if_sub" modelKey="если" optional>
            <select className={SELECT} aria-label={t("scenarios.raw.if")}>
              <option>{t("scenarios.raw.cond_none")}</option>
              <option>{t("scenarios.raw.cond_weekdays")}</option>
              <option>{t("scenarios.raw.cond_followers")}</option>
              <option>{t("scenarios.raw.cond_date")}</option>
              <option>{t("scenarios.raw.cond_positive")}</option>
            </select>
          </RawField>
          <RawField labelKey="scenarios.raw.generate" subKey="scenarios.raw.generate_sub" modelKey="сгенерировать">
            <select className={SELECT} aria-label={t("scenarios.raw.generate")}>
              <option>{t("scenarios.raw.act_post")}</option>
              <option>{t("scenarios.raw.act_reply")}</option>
              <option>{t("scenarios.raw.act_thread")}</option>
            </select>
          </RawField>
          <RawField labelKey="scenarios.raw.with" subKey="scenarios.raw.with_sub" modelKey="с инструкцией">
            <textarea
              rows={3}
              className={TEXTAREA}
              value={instruction}
              onChange={(e) => onInstruction(e.target.value)}
              placeholder={t("scenarios.f.instruction_ph")}
            />
          </RawField>
        </div>
      )}
    </FormCard>
  );
}

function RawField({
  labelKey,
  subKey,
  modelKey,
  optional,
  children,
}: {
  labelKey: MessageKey;
  subKey: MessageKey;
  modelKey: string;
  optional?: boolean;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex flex-wrap items-center gap-2 text-small font-semibold">
        <span className="rounded-sm border border-accent/30 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-accent">
          {modelKey}
        </span>
        {t(labelKey)}
        {optional && <span className="font-normal text-text-subtle">· {t("scenarios.raw.if_optional")}</span>}
      </span>
      {children}
      <span className="text-caption leading-relaxed text-text-subtle">{t(subKey)}</span>
    </label>
  );
}

// ─────────────────────────────── preview ────────────────────────────────────
export type PreviewState = "promo" | "free" | "loading" | "empty";

export function ScenarioPreview({
  state,
  preview,
  promo,
  onRefresh,
}: {
  state: PreviewState;
  preview: ScenarioPreview | null;
  promo: ScenarioPromoFields;
  onRefresh?: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-caption font-semibold uppercase tracking-wide text-text-subtle">
          <IcSparkle size={13} /> {t("scenarios.preview")}
        </span>
        {(state === "promo" || state === "free") && onRefresh && (
          <Button size="sm" variant="ghost" icon={<IcReload size={14} />} onClick={onRefresh}>
            {t("scenarios.preview_refresh")}
          </Button>
        )}
      </div>
      <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
        {state === "loading" ? (
          <PreviewLoading />
        ) : state === "empty" ? (
          <PreviewEmpty />
        ) : state === "promo" ? (
          <PromoPreview cta={preview?.cta ?? ""} replyInstruction={promo.reply_instruction} />
        ) : (
          <FreePreview instruction={preview?.instruction ?? ""} samplePost={preview?.sample_post ?? ""} />
        )}
      </div>
    </div>
  );
}

function MockAvatar({ initials }: { initials: string }) {
  return (
    <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-full border border-border bg-surface-2 text-caption font-semibold text-text-muted">
      {initials}
    </span>
  );
}

function PromoPreview({ cta, replyInstruction }: { cta: string; replyInstruction: string }) {
  const { t } = useTranslation();
  return (
    <>
      <div className="border-b border-border bg-accent/[0.06] px-[17px] py-[15px]">
        <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wide text-accent">{t("scenarios.preview_cta")}</p>
        <p className="text-small leading-relaxed text-text">{cta}</p>
      </div>
      <div className="px-[17px] py-[15px]">
        <div className="mb-2.5 flex items-center gap-2.5">
          <MockAvatar initials="С" />
          <div className="leading-tight">
            <p className="text-small font-semibold">Соня</p>
            <p className="text-caption text-text-subtle">@sonya.tarot</p>
          </div>
          <span className="ml-auto text-caption text-text-subtle">9:00</span>
        </div>
        <p className="text-small leading-relaxed text-text">
          Сегодня звёзды на вашей стороне ✨ Хотите узнать, что именно? Напишите в комментариях свою дату рождения — пришлю короткий мини-разбор лично вам.
        </p>
        <div className="mt-3 flex gap-4 text-caption text-text-subtle">
          <span className="inline-flex items-center gap-1"><IcEye size={13} /> 1,2K</span>
          <span className="inline-flex items-center gap-1"><IcHeart size={13} /> 84</span>
          <span className="inline-flex items-center gap-1"><IcBubble size={13} /> 37</span>
        </div>
      </div>
      <div className="border-t border-border bg-surface-2 px-[17px] py-3.5">
        <p className="mb-2.5 font-mono text-[10px] uppercase tracking-wide text-text-subtle">{t("scenarios.preview_sample_reply")}</p>
        <div className="flex gap-2.5">
          <MockAvatar initials="А" />
          <div className="min-w-0">
            <p className="text-caption font-semibold text-text-muted">Аня</p>
            <p className="mt-0.5 text-small text-text-muted">14.03.1996 🙏</p>
          </div>
        </div>
        <div className="relative mt-2.5 flex gap-2.5 pl-3 before:absolute before:bottom-1.5 before:left-[3px] before:top-0.5 before:w-0.5 before:rounded before:bg-border">
          <MockAvatar initials="С" />
          <div className="min-w-0">
            <p className="mb-0.5 flex items-center gap-1.5 text-caption font-semibold">
              Соня
              <span className="inline-flex items-center gap-1 font-medium text-accent">
                <IcBubble size={11} /> {t("scenarios.preview_reply")}
              </span>
            </p>
            <p className="text-small leading-relaxed text-text">
              {replyInstruction
                ? "Аня, ваш день рождения говорит о тяге к свободе и глубоким разговорам. Сегодня хороший день начать то, что давно откладывали."
                : "Аня, спасибо! Загляну к вам с коротким разбором совсем скоро 🌙"}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

function FreePreview({ instruction, samplePost }: { instruction: string; samplePost: string }) {
  const { t } = useTranslation();
  return (
    <>
      <div className="border-b border-border bg-surface-2 px-[17px] py-[15px]">
        <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wide text-text-subtle">{t("scenarios.preview_instruction")}</p>
        <p className="text-small leading-relaxed text-text-muted">{instruction}</p>
      </div>
      <div className="px-[17px] py-[15px]">
        <div className="mb-2.5 flex items-center gap-2.5">
          <MockAvatar initials="С" />
          <div className="leading-tight">
            <p className="text-small font-semibold">Соня</p>
            <p className="text-caption text-text-subtle">@sonya.tarot</p>
          </div>
          <span className="ml-auto text-caption text-text-subtle">12:00</span>
        </div>
        <p className="text-small leading-relaxed text-text">{samplePost}</p>
        <div className="mt-3 flex gap-4 text-caption text-text-subtle">
          <span className="inline-flex items-center gap-1"><IcEye size={13} /> 940</span>
          <span className="inline-flex items-center gap-1"><IcHeart size={13} /> 71</span>
          <span className="inline-flex items-center gap-1"><IcBubble size={13} /> 12</span>
        </div>
      </div>
    </>
  );
}

function PreviewLoading() {
  return (
    <div className="flex flex-col gap-2.5 p-[17px]">
      <span className="h-3 w-2/5 animate-pulse rounded bg-surface-2" />
      <span className="h-3.5 w-full animate-pulse rounded bg-surface-2" />
      <span className="h-3.5 w-[92%] animate-pulse rounded bg-surface-2" />
      <span className="h-3.5 w-3/5 animate-pulse rounded bg-surface-2" />
      <span className="mt-1.5 h-16 w-full animate-pulse rounded-md bg-surface-2" />
    </div>
  );
}

function PreviewEmpty() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-1.5 px-[22px] py-[34px] text-center text-text-subtle">
      <span className="mb-1 grid h-10 w-10 place-items-center rounded-md border border-border bg-surface-2">
        <IcSparkle size={20} />
      </span>
      <p className="max-w-[30ch] text-caption leading-relaxed">{t("scenarios.preview_empty")}</p>
    </div>
  );
}

// ───────────────────────────── delete confirm ───────────────────────────────
// Desktop: inline confirm in the action bar (rendered by the page). Phone: a
// bottom-sheet modal (this component) — danger primary on top.
export function DeleteConfirm({
  open,
  deleting,
  onClose,
  onConfirm,
}: {
  open: boolean;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-40 grid place-items-center bg-ink-950/55 p-6 backdrop-blur-sm max-md:items-end max-md:p-0"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-[420px] rounded-2xl border border-border bg-surface p-6 shadow-lg max-md:max-w-none max-md:rounded-b-none max-md:rounded-t-2xl max-md:pb-[calc(env(safe-area-inset-bottom)+20px)]">
        <div className="flex items-start gap-3">
          <span className="grid h-[38px] w-[38px] place-items-center rounded-md border border-danger/28 bg-danger/12 text-danger">
            <IcTrash size={18} />
          </span>
          <div>
            <h2 className="text-h3 font-semibold">{t("scenarios.delete_confirm")}</h2>
            <p className="mt-1 text-small text-text-muted">{t("scenarios.delete_confirm_sub")}</p>
          </div>
        </div>
        <div className="mt-[22px] flex justify-end gap-2.5 max-md:flex-col-reverse">
          <button onClick={onClose} disabled={deleting} className={cn(buttonClasses({ variant: "ghost" }), "max-md:min-h-[44px] max-md:w-full")}>
            {t("common.cancel")}
          </button>
          <Button variant="danger" loading={deleting} onClick={onConfirm} icon={<IcCheck size={15} />} className="max-md:min-h-[44px] max-md:w-full">
            {t("scenarios.delete")}
          </Button>
        </div>
      </div>
    </div>
  );
}
