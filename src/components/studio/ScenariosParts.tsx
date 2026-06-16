"use client";

// Scenarios — presentational pieces for /app/scenarios (list · template picker ·
// «Акция» editor). Built 1:1 toward design-export/Scenarios-{WEB,MOBILE}-SPEC.html.
// Icons: scenario = repeat-loop, Акция = gift, Свой = sliders, auto-reply = bubble.

import { useState } from "react";

import { Button, buttonClasses } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/feedback";
import { cn } from "@/lib/cn";
import { useTranslation } from "@/lib/i18n";
import {
  IcArrowLeft,
  IcCalendar,
  IcCheck,
  IcGift,
  IcList,
  IcReload,
  IcRepeat,
  IcSliders,
  IcTrash,
} from "@/components/icons";
import type {
  MessageKey,
} from "@/lib/i18n/messages/en";
import type { Scenario, ScenarioTemplate } from "@/lib/types";

type IconCmp = (p: { size?: number; className?: string }) => React.ReactNode;

export const TEMPLATE_META: Record<
  ScenarioTemplate,
  { icon: IconCmp; ready: boolean; label: MessageKey; desc: MessageKey }
> = {
  promo: { icon: IcGift, ready: true, label: "scenarios.tpl.promo", desc: "scenarios.tpl.promo_desc" },
  custom: { icon: IcSliders, ready: false, label: "scenarios.tpl.custom", desc: "scenarios.tpl.custom_desc" },
  rubric: { icon: IcList, ready: false, label: "scenarios.tpl.rubric", desc: "scenarios.tpl.rubric_desc" },
  seasonal: { icon: IcCalendar, ready: false, label: "scenarios.tpl.seasonal", desc: "scenarios.tpl.seasonal_desc" },
};

const SELECT =
  "h-9 w-full rounded-md border border-border bg-surface px-2.5 text-small text-text transition-colors focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent max-md:min-h-[44px] max-md:text-[16px]";
const INPUT =
  "h-10 w-full rounded-md border border-border bg-surface px-3 text-body text-text transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25 max-md:min-h-[44px] max-md:text-[16px]";
const TEXTAREA =
  "w-full rounded-md border border-border bg-surface px-3 py-2 text-body text-text transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25 max-md:text-[16px]";

function fmtRun(iso: string | null, locale: string): string {
  if (!iso) return "";
  const loc = locale === "ru" ? "ru-RU" : locale === "en" ? "en-US" : locale;
  return new Date(iso).toLocaleString(loc, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function triggerSummary(s: Scenario, t: (k: MessageKey) => string): string {
  const kind = (s.trigger_cfg?.kind as string) || "";
  if (kind === "every_n_days") {
    const n = (s.trigger_cfg?.n as number) ?? "N";
    return `${t("scenarios.sched.every_n")} (${n})`;
  }
  return t("scenarios.sched.daily");
}

// ───────────────────────────── list card ────────────────────────────────────
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
  const meta = TEMPLATE_META[s.template] ?? TEMPLATE_META.custom;
  const Icon = meta.icon;
  const desc =
    s.template === "promo" && s.structured
      ? `${s.structured.ask} → ${s.structured.reward}`
      : s.instruction || triggerSummary(s, t);
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-surface p-4 shadow-sm transition-colors hover:border-text/15 md:p-[18px]",
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
          <Icon size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pr-1">
            <h3 className="text-body font-semibold tracking-tight">{s.name}</h3>
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-caption font-medium",
                s.template === "promo"
                  ? "border-accent/30 bg-accent/10 text-accent"
                  : "border-border bg-surface-2 text-text-muted",
              )}
            >
              {t(meta.label)}
            </span>
          </div>
          <p className="mt-1 line-clamp-1 text-small text-text-muted">{desc}</p>
        </div>
        <label className="flex shrink-0 items-center gap-2 text-caption text-text-muted">
          <span className="max-sm:sr-only">{s.enabled ? t("scenarios.on") : t("scenarios.off")}</span>
          <Switch checked={s.enabled} onCheckedChange={(v) => onToggle(s, v)} aria-label={s.name} />
        </label>
      </div>
      <div className="mt-3.5 flex flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-caption text-text-subtle tabular-nums">
          <span>
            {t("scenarios.next_run")}:{" "}
            {s.enabled && s.next_run_at ? fmtRun(s.next_run_at, locale) : t("scenarios.paused")}
          </span>
          <span>
            {t("scenarios.last_run")}:{" "}
            {s.last_run_at ? fmtRun(s.last_run_at, locale) : t("scenarios.never_ran")}
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
        <Skeleton className="h-10 w-10 rounded-md" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-64" />
        </div>
        <Skeleton className="h-6 w-10 rounded-full" />
      </div>
      <Skeleton className="mt-4 h-3 w-full" />
    </div>
  );
}

export function ScenariosEmpty({ onCreate }: { onCreate: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center rounded-lg border border-dashed border-border px-6 py-12 text-center">
      <span className="mb-4 grid h-12 w-12 place-items-center rounded-lg border border-border bg-surface-2 text-text-subtle">
        <IcRepeat size={24} />
      </span>
      <p className="text-h3 font-semibold">{t("scenarios.empty_title")}</p>
      <p className="mt-1.5 max-w-[46ch] text-small leading-relaxed text-text-muted">{t("scenarios.empty_sub")}</p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {(Object.keys(TEMPLATE_META) as ScenarioTemplate[]).map((k) => {
          const m = TEMPLATE_META[k];
          const Icon = m.icon;
          return (
            <span key={k} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-caption text-text-muted">
              <Icon size={13} /> {t(m.label)}
            </span>
          );
        })}
      </div>
      <Button variant="primary" className="mt-5" onClick={onCreate}>{t("scenarios.create")}</Button>
    </div>
  );
}

export function ScenariosError({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-start gap-3 rounded-lg border border-danger/40 bg-danger/10 p-4 text-small text-danger sm:flex-row sm:items-center sm:justify-between">
      <span>{t("scenarios.error")}</span>
      <Button size="sm" variant="secondary" icon={<IcReload size={14} />} onClick={onRetry}>{t("scenarios.retry")}</Button>
    </div>
  );
}

// ─────────────────────────── template picker ────────────────────────────────
export function TemplatePicker({ onPick, onBack }: { onPick: (tpl: ScenarioTemplate) => void; onBack: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-small text-text-muted hover:text-text">
        <IcArrowLeft size={16} /> {t("scenarios.back")}
      </button>
      <h2 className="text-h2 font-semibold">{t("scenarios.pick_title")}</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {(Object.keys(TEMPLATE_META) as ScenarioTemplate[]).map((k) => {
          const m = TEMPLATE_META[k];
          const Icon = m.icon;
          return (
            <button
              key={k}
              disabled={!m.ready}
              onClick={() => m.ready && onPick(k)}
              className={cn(
                "flex flex-col items-start gap-2 rounded-lg border border-border bg-surface p-4 text-left shadow-sm transition-colors",
                m.ready ? "hover:border-accent/40 hover:shadow-md" : "cursor-not-allowed opacity-60",
              )}
            >
              <span className="grid h-10 w-10 place-items-center rounded-md border border-border bg-surface-2 text-text-muted">
                <Icon size={20} />
              </span>
              <div className="flex items-center gap-2">
                <span className="text-body font-semibold">{t(m.label)}</span>
                {!m.ready && (
                  <span className="rounded-full border border-border bg-surface-2 px-2 py-0.5 text-caption text-text-subtle">
                    {t("scenarios.soon")}
                  </span>
                )}
              </div>
              <p className="text-small leading-relaxed text-text-muted">{t(m.desc)}</p>
              {m.ready && <span className="mt-1 text-caption font-medium text-accent">{t("scenarios.choose")} →</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ───────────────────────────── delete confirm ───────────────────────────────
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

// re-export field classes for the editor (page composes the form)
export { SELECT, INPUT, TEXTAREA };
