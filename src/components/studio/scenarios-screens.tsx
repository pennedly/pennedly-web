"use client";

// Screen-level pieces for the Pennedly-3 Scenarios redesign that aren't part of
// the older ScenariosParts. First-run (teach-by-example empty state) lands here;
// gallery / editor / enable / activity pieces will join it as they're built.
// Source spec: Scenarios-SPEC.html §4.

import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/cn";
import { useTranslation } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n/messages/en";
import {
  IcArrowLeft,
  IcBolt,
  IcBubble,
  IcCalendar,
  IcChart,
  IcChevRight,
  IcExternal,
  IcGift,
  IcList,
  IcPencil,
  IcReplies,
  IcSend,
  IcShield,
  IcSparkle,
  IcUsers,
} from "@/components/icons";
import type { ScenarioPreset } from "@/lib/types";
import { Sentence } from "./scenarios-living";
import { DiscoveryGallery } from "./ScenariosParts";
import { PRESENTATION, FIRSTRUN_EXAMPLES } from "./scenarios-presentation";

type IconCmp = (p: { size?: number; className?: string }) => ReactNode;

// preset → glyph (shared with the gallery)
export const PRESET_ICON: Record<string, IconCmp> = {
  daily_question: IcBubble,
  rubric: IcList,
  safety_net: IcShield,
  reply_duty: IcReplies,
  amplify_viral: IcBolt,
  milestone_thanks: IcUsers,
  poll: IcChart,
  seasonal: IcCalendar,
  promo: IcGift,
};

// ════════════════════════════════════════════════════════════════════════════
//  FIRST RUN — teach by example (§4). The empty state of the control center.
// ════════════════════════════════════════════════════════════════════════════
export function FirstRun({
  handle,
  onTry,
  onScratch,
}: {
  handle: string;
  onTry: (presetId: string) => void;
  onScratch: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-5 md:gap-[22px]">
      <p className="max-w-[60ch] text-body text-text-muted">{t("ap.fr.lede")}</p>

      {/* «Что такое рутина?» explainer */}
      <div className="flex items-start gap-4 rounded-lg border border-border bg-surface p-5 shadow-sm md:px-[22px]">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md border border-accent/30 bg-accent/10 text-accent">
          <IcSparkle size={20} />
        </span>
        <div className="min-w-0">
          <h2 className="text-h3 font-semibold tracking-tight">{t("ap.fr.what_is_title")}</h2>
          <p className="mt-1.5 max-w-[62ch] text-body leading-relaxed text-text-muted">{t("ap.fr.what_is_body")}</p>
        </div>
      </div>

      {/* «вот как это выглядит — попробуй один» */}
      <div className="flex flex-col gap-3">
        <h3 className="text-small font-semibold uppercase tracking-[0.04em] text-text-subtle">{t("scenarios.fr.try_head")}</h3>
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 lg:grid-cols-3">
          {FIRSTRUN_EXAMPLES.map((ex) => (
            <ExampleCard key={ex.presetId} presetId={ex.presetId} nameKey={ex.nameKey} handle={handle} onTry={onTry} />
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={onScratch}
        className="mx-auto inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-small text-text-subtle transition-colors hover:bg-surface-2 hover:text-text"
      >
        <IcPencil size={14} /> {t("ap.fr.scratch")}
      </button>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  GALLERY — pick a routine by goal (§5). Reached from «+ Новый» / first-run.
// ════════════════════════════════════════════════════════════════════════════
export function GalleryScreen({
  presets,
  onPick,
  onScratch,
  onBack,
}: {
  presets: ScenarioPreset[];
  onPick: (p: ScenarioPreset) => void;
  onScratch: () => void;
  onBack: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="space-y-5">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-small text-text-muted transition-colors hover:text-text">
        <IcArrowLeft size={16} /> {t("scenarios.back_to_list")}
      </button>
      <div className="flex flex-col gap-1">
        <h1 className="text-h1 font-semibold tracking-tight">{t("scenarios.gallery_title")}</h1>
        <p className="max-w-[60ch] text-small text-text-muted">{t("scenarios.gallery_sub")}</p>
      </div>
      {/* «С нуля» — собрать свой сценарий (отдельный, очевидный путь) */}
      <button
        type="button"
        onClick={onScratch}
        className="flex w-full items-center gap-3 rounded-lg border border-dashed border-border bg-surface-2/40 p-4 text-left transition-colors hover:border-accent/40 hover:bg-accent/[0.04]"
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-border bg-surface text-text-muted">
          <IcPencil size={18} />
        </span>
        <span className="min-w-0">
          <span className="block text-small font-semibold text-text">{t("scenarios.scratch_title")}</span>
          <span className="block text-caption text-text-subtle">{t("scenarios.scratch_sub")}</span>
        </span>
      </button>
      <DiscoveryGallery presets={presets} onPick={onPick} />
    </div>
  );
}

function ExampleCard({
  presetId,
  nameKey,
  handle,
  onTry,
}: {
  presetId: string;
  nameKey: MessageKey;
  handle: string;
  onTry: (presetId: string) => void;
}) {
  const { t } = useTranslation();
  const p = PRESENTATION[presetId];
  const Icon = PRESET_ICON[presetId] ?? IcBubble;
  return (
    <div className="flex h-full flex-col gap-3 rounded-lg border border-border bg-surface p-4 shadow-sm md:p-[18px]">
      <div className="flex items-center gap-2.5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-border bg-surface-2 text-text-muted">
          <Icon size={18} />
        </span>
        <span className="min-w-0 flex-1 text-small font-semibold tracking-tight">{t(nameKey)}</span>
      </div>
      <Sentence template={t(p.sentenceKey)} slots={p.slots(t, handle)} variant="full" className="text-small" />
      <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3">
        {p.replies ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent/[0.08] px-2 py-0.5 text-caption font-medium text-text-muted">
            <IcReplies size={12} className="text-accent" /> {t("scenarios.replies_people")}
          </span>
        ) : (
          <span className="text-caption text-text-subtle">{t(p.skel.whenKey)}</span>
        )}
        <Button size="sm" variant="secondary" onClick={() => onTry(presetId)} className="shrink-0">
          {t("scenarios.fr.try")}
        </Button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  «ЕЩЁ НАСТРОЙКИ» — where ТОЛЬКО ЕСЛИ lives (§6.2): filters, quiet hours.
//  Collapsed by default, off the happy path. Presentational for now (wired to
//  the backend in the real-data pass); local state drives the toggles.
// ════════════════════════════════════════════════════════════════════════════
export function MoreSettings({ isReply, embedded }: { isReply: boolean; embedded?: boolean }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [weekdaysOnly, setWeekdaysOnly] = useState(false);
  const [noRepeat, setNoRepeat] = useState(false);
  const [skipSpam, setSkipSpam] = useState(true);
  const [meaningfulOnly, setMeaningfulOnly] = useState(false);
  const [quietNight, setQuietNight] = useState(false);
  // Embedded (inside a step body) → render the settings content directly: the
  // step head owns the open/close, so there's no own card/border/toggle here.
  const body = (
    <div className={cn("flex flex-col gap-5", !embedded && "border-t border-border px-5 py-4 md:px-[22px]")}>
      {isReply ? (
            <SettingsGroup label={t("scenarios.more.who_how")}>
              <SettingToggle title={t("scenarios.more.skip_spam")} sub={t("scenarios.more.skip_spam_sub")} v={skipSpam} on={setSkipSpam} />
              <SettingToggle title={t("scenarios.more.meaningful")} sub={t("scenarios.more.meaningful_sub")} v={meaningfulOnly} on={setMeaningfulOnly} />
              <div className="flex items-center justify-between gap-4 border-t border-border py-3">
                <span className="min-w-0">
                  <span className="block text-small font-medium text-text">{t("scenarios.more.cap")}</span>
                  <span className="mt-0.5 block text-caption text-text-subtle">{t("scenarios.more.cap_sub")}</span>
                </span>
                <input
                  type="number"
                  inputMode="numeric"
                  defaultValue={30}
                  aria-label={t("scenarios.more.cap")}
                  className="h-10 w-[76px] shrink-0 rounded-md border border-border bg-surface text-center text-body tabular-nums text-text focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25 max-md:min-h-[44px] max-md:text-[16px]"
                />
              </div>
            </SettingsGroup>
          ) : (
            <SettingsGroup label={t("scenarios.skel.onlyif")}>
              <SettingToggle title={t("scenarios.more.weekdays")} sub={t("scenarios.more.weekdays_sub")} v={weekdaysOnly} on={setWeekdaysOnly} />
              <SettingToggle title={t("scenarios.more.no_repeat")} sub={t("scenarios.more.no_repeat_sub")} v={noRepeat} on={setNoRepeat} />
            </SettingsGroup>
          )}
      <SettingsGroup label={t("scenarios.more.quiet_hours")}>
        <SettingToggle title={t("scenarios.more.quiet_night")} sub={t("scenarios.more.quiet_night_sub")} v={quietNight} on={setQuietNight} />
      </SettingsGroup>
    </div>
  );
  if (embedded) return body;
  return (
    <div className="rounded-lg border border-border bg-surface shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-2.5 px-5 py-4 text-left md:px-[22px]"
      >
        <span className="text-small font-semibold">{t("scenarios.more.title")}</span>
        <span className="text-caption text-text-subtle">{t("scenarios.more.hint")}</span>
        <IcChevRight size={16} className={cn("ml-auto shrink-0 text-text-subtle transition-transform", open && "rotate-90")} />
      </button>
      {open && body}
    </div>
  );
}

function SettingsGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col">
      <span className="mb-1 text-caption font-semibold uppercase tracking-[0.04em] text-text-subtle">{label}</span>
      {children}
    </div>
  );
}

function SettingToggle({ title, sub, v, on }: { title: string; sub: string; v: boolean; on: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-4 border-t border-border py-3">
      <span className="min-w-0">
        <span className="block text-small font-medium text-text">{title}</span>
        <span className="mt-0.5 block text-caption leading-relaxed text-text-subtle">{sub}</span>
      </span>
      <Switch checked={v} onCheckedChange={on} aria-label={title} />
    </label>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  ACTIVITY — a human journal (§10): drafts awaiting confirmation («Спроси меня»)
//  + what's already been done. Past tense, Threads links, no ids.
// ════════════════════════════════════════════════════════════════════════════
export type ActivityDraftView = { id: number; kind: "post" | "reply"; when: string; ctx: string; body: string };
export type ActivityDoneView = { id: number; kind: "post" | "reply"; text: string; sub: string; url: string };

export function ActivityJournal({
  drafts,
  done,
  onPublish,
  onEdit,
  onSkip,
}: {
  drafts: ActivityDraftView[];
  done: ActivityDoneView[];
  onPublish?: (id: number) => void;
  onEdit?: (id: number) => void;
  onSkip?: (id: number) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-6">
      {drafts.length > 0 && (
        <section className="flex flex-col gap-2.5">
          <h2 className="text-caption font-semibold uppercase tracking-[0.04em] text-text-subtle">
            {t("scenarios.act.waiting_head")} · {drafts.length}
          </h2>
          {drafts.map((d) => (
            <div key={d.id} className="rounded-lg border border-accent/26 bg-surface p-4 shadow-sm md:p-[18px]">
              <div className="flex items-center gap-2">
                <span className="text-caption font-semibold text-accent">{t("scenarios.act.waiting_tag")}</span>
                <span className="ml-auto text-caption text-text-subtle">{d.when}</span>
              </div>
              <p className="mt-1 text-caption leading-relaxed text-text-subtle [text-wrap:pretty]">{d.ctx}</p>
              <p className="mt-2.5 rounded-md border border-border bg-surface-2 px-3 py-2.5 text-small leading-[1.55] text-text [text-wrap:pretty]">{d.body}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="primary" icon={<IcSend size={14} />} onClick={() => onPublish?.(d.id)}>
                  {d.kind === "reply" ? t("scenarios.act.send_reply") : t("scenarios.act.publish")}
                </Button>
                <Button size="sm" variant="secondary" icon={<IcPencil size={14} />} onClick={() => onEdit?.(d.id)}>
                  {t("scenarios.act.edit")}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => onSkip?.(d.id)}>
                  {t("scenarios.act.skip")}
                </Button>
              </div>
            </div>
          ))}
        </section>
      )}

      {done.length > 0 && (
        <section className="flex flex-col gap-1">
          <h2 className="text-caption font-semibold uppercase tracking-[0.04em] text-text-subtle">{t("scenarios.act.done_head")}</h2>
          <div className="flex flex-col">
            {done.map((it) => {
              const reply = it.kind === "reply";
              const live = it.url && it.url !== "#";
              return (
                <div key={it.id} className="flex items-start gap-3 border-t border-border py-3 first:border-t-0">
                  <span className={cn("grid h-[30px] w-[30px] shrink-0 place-items-center rounded-full", reply ? "bg-accent/12 text-accent" : "bg-success/12 text-success")}>
                    {reply ? <IcReplies size={15} /> : <IcBubble size={15} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-small leading-[1.45] text-text [text-wrap:pretty]">{it.text}</p>
                    <p className="mt-0.5 text-caption tabular-nums text-text-subtle">{it.sub}</p>
                  </div>
                  {live ? (
                    <a href={it.url} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center gap-1 text-small font-medium text-accent hover:underline">
                      {t("scenarios.activity.open_threads")} <IcExternal size={12} />
                    </a>
                  ) : (
                    <span className="inline-flex shrink-0 items-center gap-1 text-small text-text-subtle">
                      {t("scenarios.activity.open_threads")} <IcExternal size={12} />
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
