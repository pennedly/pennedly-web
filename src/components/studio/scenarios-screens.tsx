"use client";

// Screen-level pieces for the Pennedly-3 Scenarios redesign that aren't part of
// the older ScenariosParts. First-run (teach-by-example empty state) lands here;
// gallery / editor / enable / activity pieces will join it as they're built.
// Source spec: Scenarios-SPEC.html §4.

import { type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { useTranslation } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n/messages/en";
import {
  IcArrowLeft,
  IcBolt,
  IcBubble,
  IcCalendar,
  IcChart,
  IcGift,
  IcList,
  IcPencil,
  IcReplies,
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
      <p className="max-w-[60ch] text-body text-text-muted">{t("scenarios.fr.lede")}</p>

      {/* «Что такое сценарий?» explainer */}
      <div className="flex items-start gap-4 rounded-lg border border-border bg-surface p-5 shadow-sm md:px-[22px]">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md border border-accent/30 bg-accent/10 text-accent">
          <IcSparkle size={20} />
        </span>
        <div className="min-w-0">
          <h2 className="text-h3 font-semibold tracking-tight">{t("scenarios.fr.what_is_title")}</h2>
          <p className="mt-1.5 max-w-[62ch] text-body leading-relaxed text-text-muted">{t("scenarios.fr.what_is_body")}</p>
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
        <IcPencil size={14} /> {t("scenarios.fr.scratch")}
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
