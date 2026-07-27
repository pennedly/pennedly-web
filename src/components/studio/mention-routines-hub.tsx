"use client";

// «Рутины упоминаний» hub — the list of mention routines (on_mention scenarios),
// each a card mirroring the live scenario card (Tailwind shell + the `.rt-mode`
// publish-mode strip) specialized for mentions. Chrome from mention-routines.css.
// Ported from design-export/PennedlyDesign (mention-routines-build.js `hub`).

import { Badge, StatusBadge } from "@/components/studio/Badges";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  IcAt,
  IcBolt,
  IcCheck,
  IcEye,
  IcImage,
  IcLock,
  IcPlus,
  IcRepeat,
  IcShieldHouse,
  IcSwap,
  IcWand,
} from "@/components/icons";
import type { MessageKey } from "@/lib/i18n";
import type { MRoutine } from "@/components/studio/mention-routines";

type T = (k: MessageKey) => string;

function relTime(iso: string, locale: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (mins < 1) return rtf.format(0, "minute");
  if (mins < 60) return rtf.format(-mins, "minute");
  const hours = Math.floor(mins / 60);
  if (hours < 24) return rtf.format(-hours, "hour");
  const days = Math.floor(hours / 24);
  if (days < 7) return rtf.format(-days, "day");
  return new Date(iso).toLocaleDateString(locale, { dateStyle: "medium" });
}

function RoutineCard({
  r,
  t,
  locale,
  demo,
  onToggle,
  onEdit,
}: {
  r: MRoutine;
  t: T;
  locale: string;
  demo: boolean;
  onToggle?: (r: MRoutine, on: boolean) => void;
  onEdit?: (r: MRoutine) => void;
}) {
  const CardIcon = r.catchall ? IcShieldHouse : r.media === "image" ? IcWand : IcAt;
  const ModeIcon = r.mode === "auto" ? IcBolt : IcEye;
  const modeCls = !r.enabled ? "rt-mode--muted" : r.mode === "auto" ? "rt-mode--auto" : "rt-mode--ask";
  const shell =
    "rounded-lg bg-surface p-4 shadow-sm md:p-[18px] " +
    (r.catchall ? "border border-dashed border-border " : "border border-border ") +
    (r.enabled && r.mode === "auto" ? "border-l-[3px] border-l-warning" : "");
  const last = demo ? r.demoLast ?? "" : r.lastRunAt ? relTime(r.lastRunAt, locale) : "";

  return (
    <article className={shell}>
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-border bg-surface-2 text-text-muted">
          <CardIcon size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-small font-semibold text-text">{r.name}</span>
            {r.catchall ? (
              <span className="mr-fallback-tag">
                <IcShieldHouse size={11} /> {t("mr.card.fallback_tag")}
              </span>
            ) : r.media === "image" ? (
              <Badge tone="neutral" icon={<IcImage />}>
                {t("mr.card.media_image")}
              </Badge>
            ) : null}
          </div>
          {r.line && <p className="mt-1 text-caption leading-normal text-text-muted">{r.line}</p>}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <StatusBadge tone={r.enabled ? "on" : "off"}>
            {r.enabled ? t("mr.card.active") : t("mr.card.off")}
          </StatusBadge>
          <Switch checked={r.enabled} onCheckedChange={(v) => onToggle?.(r, v)} aria-label={r.name} />
        </div>
      </div>

      {!r.enabled && (
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-md border border-warning/30 bg-warning/[0.06] px-3 py-2.5">
          <span className="min-w-0 flex-1 text-small leading-[1.45] text-text">
            <b className="font-semibold">{t("mr.card.createdoff_title")}</b> {t("mr.card.createdoff_body")}
          </span>
          <Button
            size="sm"
            variant="primary"
            icon={<IcCheck size={14} />}
            onClick={() => onToggle?.(r, true)}
            className="shrink-0 max-sm:w-full"
          >
            {t("mr.card.turn_on")}
          </Button>
        </div>
      )}

      <div className={"rt-mode mt-3 " + modeCls}>
        <span className="rtm-ico">
          <ModeIcon size={17} />
        </span>
        <div className="rtm-body">
          <div className="rtm-t">{t(r.mode === "auto" ? "mr.mode.auto_t" : "mr.mode.ask_t")}</div>
          <div className="rtm-d">{t(r.mode === "auto" ? "mr.mode.auto_d" : "mr.mode.ask_d")}</div>
        </div>
        {r.enabled ? (
          <button type="button" className="rtm-edit" onClick={() => onEdit?.(r)}>
            <IcSwap size={14} /> {t("mr.card.edit")}
          </button>
        ) : (
          <span className="rtm-locknote">
            <IcLock size={12} /> {t("mr.mode.locked")}
          </span>
        )}
      </div>

      <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border pt-3 text-caption tabular-nums text-text-subtle">
        <span>
          {t("mr.card.last")}:{" "}
          <span className={last ? "font-medium text-text" : ""}>{last || t("mr.card.never")}</span>
        </span>
        {r.fireCount > 0 && (
          <span className="inline-flex items-center gap-1 text-text-muted">
            <IcRepeat size={12} /> {t("mr.card.runs").replace("{n}", String(r.fireCount))}
          </span>
        )}
      </div>
    </article>
  );
}

export function MentionRoutinesHub({
  routines,
  t,
  locale,
  demo,
  onToggle,
  onEdit,
  onCreate,
}: {
  routines: MRoutine[];
  t: T;
  locale: string;
  demo: boolean;
  onToggle?: (r: MRoutine, on: boolean) => void;
  onEdit?: (r: MRoutine) => void;
  onCreate?: () => void;
}) {
  if (routines.length === 0) {
    return (
      <div className="mr-empty">
        <span className="me-mark">
          <IcAt size={26} />
        </span>
        <div className="me-t">{t("mr.empty.title")}</div>
        <div className="me-d">{t("mr.empty.body")}</div>
        <button type="button" className="mr-addcard" style={{ maxWidth: 340 }} onClick={onCreate}>
          <IcPlus size={17} /> {t("mr.empty.create")}
        </button>
      </div>
    );
  }
  const on = routines.filter((r) => r.enabled).length;
  return (
    <div className="flex flex-col gap-3.5">
      <div className="mr-hubhead">
        <span className="mh-t">{t("mr.hub.title")}</span>
        <span className="mh-s">
          {t("mr.hub.count").replace("{total}", String(routines.length)).replace("{on}", String(on))}
        </span>
      </div>
      <button type="button" className="mr-addcard" onClick={onCreate}>
        <IcPlus size={17} /> {t("mr.hub.add")}
      </button>
      <div className="mr-hublist">
        {routines.map((r) => (
          <RoutineCard key={r.id} r={r} t={t} locale={locale} demo={demo} onToggle={onToggle} onEdit={onEdit} />
        ))}
      </div>
    </div>
  );
}
