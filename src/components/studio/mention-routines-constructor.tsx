"use client";

// «Рутина упоминаний» constructor — the recipe-card editor for one on_mention
// routine: a clickable recipe phrase (when mentioned → media → goal → mode →
// action) that opens drawers, a safety guarantee, two depth layers, and a live
// mention preview. Ported from design-export/PennedlyDesign
// (mention-routines-build.js buildConstructor). Chrome from mention-routines.css
// (.mr-*) + Tailwind; the generated-photo action is «Скоро» (Phase 4).

import { useState, type ReactNode } from "react";

import { buttonClasses } from "@/components/ui/button";
import {
  IcAlert,
  IcAt,
  IcBolt,
  IcBubble,
  IcCheck,
  IcChevDown,
  IcChevRight,
  IcEye,
  IcImage,
  IcInfo,
  IcLock,
  IcPencil,
  IcRoute,
  IcShield,
  IcSparkle,
  IcTrash,
  IcWand,
} from "@/components/icons";
import type { MessageKey } from "@/lib/i18n";
import type { RoutineMedia, RoutineMode } from "@/components/studio/mention-routines";
import {
  EMPTY_L3,
  Layer3Panel,
  l3OverrideCount,
  l3Valid,
  type L3House,
  type MRL3,
} from "@/components/studio/mention-routines-layer3";

type T = (k: MessageKey) => string;
type SlotKey = "goal" | "media" | "action" | "mode" | null;

export type MRConfig = {
  name: string;
  goal: string;
  catchall: boolean;
  media: RoutineMedia;
  action: "voice" | "image";
  mode: RoutineMode;
  inst: string;
  /** The generation prompt/style for `action: "image"` (Phase 4). */
  imagePrompt: string;
  /** Layer-3 per-routine reply overrides (inherit «Правила дома» by default). */
  l3: MRL3;
};

const MEDIA_TXT: Record<RoutineMedia, MessageKey> = {
  image: "mrc.media.image_txt",
  none: "mrc.media.none_txt",
  any: "mrc.media.any_txt",
};

// ── small chrome ─────────────────────────────────────────────────────────────
function Slot({ children, open, onClick }: { children: ReactNode; open: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "mx-0.5 rounded px-1 font-medium text-accent underline decoration-dotted decoration-accent/50 underline-offset-4 transition-colors hover:bg-accent/[0.08] " +
        (open ? "bg-accent/[0.12] decoration-accent" : "")
      }
    >
      {children}
    </button>
  );
}

function Drawer({
  title,
  icon,
  onDone,
  children,
  t,
}: {
  title: string;
  icon: ReactNode;
  onDone: () => void;
  children: ReactNode;
  t: T;
}) {
  return (
    <div className="mt-3.5 rounded-lg border border-border bg-surface-2/60 p-3.5 md:p-4">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-border bg-surface text-text-subtle">
          {icon}
        </span>
        <span className="flex-1 text-small font-semibold">{title}</span>
        <button
          type="button"
          onClick={onDone}
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-caption font-medium text-text-muted transition-colors hover:bg-surface hover:text-text"
        >
          <IcCheck size={14} /> {t("mrc.done")}
        </button>
      </div>
      {children}
    </div>
  );
}

function Guard({ t }: { t: T }) {
  return (
    <div className="mr-guard mt-3.5">
      <span className="mg-ico">
        <IcShield size={18} />
      </span>
      <div>
        <div className="mg-t">{t("mrc.guard.t")}</div>
        <div className="mg-d">{t("mrc.guard.d")}</div>
      </div>
    </div>
  );
}

function OptionTile({
  on,
  disabled,
  icon,
  title,
  desc,
  pill,
  onClick,
}: {
  on: boolean;
  disabled?: boolean;
  icon: ReactNode;
  title: ReactNode;
  desc: string;
  pill?: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-disabled={disabled}
      className={
        "mr-action" + (on ? " mr-action--on" : "") + (disabled ? " mr-action--soon" : "")
      }
    >
      <span className="ma-radio" />
      <span className="ma-ico">{icon}</span>
      <span className="ma-body">
        <span className="ma-t">
          {title}
          {pill}
        </span>
        <span className="ma-d">{desc}</span>
      </span>
    </button>
  );
}

function BigInst({ value, t, onChange }: { value: string; t: T; onChange: (v: string) => void }) {
  return (
    <div className="rounded-md border border-border bg-surface p-3">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={600}
        rows={2}
        placeholder={t("mrc.inst.placeholder")}
        className="w-full resize-y bg-transparent text-small leading-relaxed text-text outline-none placeholder:text-text-subtle"
      />
      <div className="mt-2.5 flex items-center gap-2 border-t border-border pt-2.5">
        <IcPencil size={13} className="shrink-0 text-text-subtle" />
        <span className="text-caption text-text-subtle">{t("mrc.inst.hint")}</span>
      </div>
    </div>
  );
}

function MediaSeg({ value, t, onPick }: { value: RoutineMedia; t: T; onPick: (m: RoutineMedia) => void }) {
  const opts: [RoutineMedia, MessageKey][] = [
    ["any", "mrc.media.any"],
    ["image", "mrc.media.image"],
    ["none", "mrc.media.none"],
  ];
  return (
    <div className="inline-flex rounded-md border border-border bg-surface p-0.5" role="tablist">
      {opts.map(([k, label]) => (
        <button
          key={k}
          type="button"
          role="tab"
          aria-selected={value === k}
          onClick={() => onPick(k)}
          className={
            "rounded px-3 py-1.5 text-small font-medium transition-colors " +
            (value === k ? "bg-surface-2 text-text shadow-sm" : "text-text-muted hover:text-text")
          }
        >
          {t(label)}
        </button>
      ))}
    </div>
  );
}

function Why({ children }: { children: ReactNode }) {
  return (
    <div className="mt-3 flex items-start gap-2 rounded-md bg-surface-2 px-3 py-2.5 text-caption leading-normal text-text-muted">
      <IcInfo size={13} className="mt-0.5 shrink-0 text-text-subtle" />
      <span>{children}</span>
    </div>
  );
}

// ── depth layers ─────────────────────────────────────────────────────────────
function Layer({
  title,
  pro,
  summary,
  open,
  onToggle,
  children,
  t,
}: {
  title: string;
  pro?: boolean;
  summary: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
  t: T;
}) {
  return (
    <div className={"rounded-lg border border-border bg-surface " + (open ? "" : "")}>
      <button type="button" onClick={onToggle} className="flex w-full items-center gap-3 px-4 py-3 text-left">
        <span className={"shrink-0 text-text-subtle transition-transform " + (open ? "rotate-180" : "")}>
          <IcChevDown size={16} />
        </span>
        <span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-small font-semibold">{title}</span>
          {pro && (
            <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-text-subtle">
              {t("mrc.layer.pro")}
            </span>
          )}
          {!open && <span className="text-caption text-text-subtle">{summary}</span>}
        </span>
      </button>
      {open && <div className="border-t border-border px-4 py-4">{children}</div>}
    </div>
  );
}

// ── live preview aside ───────────────────────────────────────────────────────
function Aside({ cfg, t }: { cfg: MRConfig; t: T }) {
  const withPhoto = cfg.media === "image";
  const auto = cfg.mode === "auto";
  return (
    <aside className="flex flex-col gap-3.5">
      <div className="inline-flex items-center gap-1.5 text-caption font-medium text-text-subtle">
        <IcEye size={13} /> {t("mrc.aside.cap")}
      </div>
      <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
        <div className="flex items-center gap-2 border-b border-border bg-surface-2/60 px-3.5 py-2 text-caption text-text-subtle">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" /> {t("mrc.aside.stagebar")}
          <span className="ml-auto rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-accent">live</span>
        </div>
        <div className="border-b border-border p-3.5">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-2 text-caption font-semibold text-text-muted">К</span>
            <div className="min-w-0">
              <div className="text-small font-semibold leading-tight">Катя</div>
              <div className="text-caption text-text-subtle">@katya.p</div>
            </div>
            <span className="ml-auto text-caption text-text-subtle">12 мин</span>
          </div>
          <p className="mt-2 text-small leading-normal text-text">
            <span className="font-medium text-accent">@alex.makes</span>{" "}
            {t(withPhoto ? "mrc.preview.parent_photo" : "mrc.preview.parent_text")}
          </p>
          {withPhoto && (
            <div className="mr-attach">
              <span className="at-thumb">
                <IcImage size={20} />
              </span>
              <span className="at-cap">
                <b>{t("mrc.preview.attach_t")}</b>
                <br />
                {t("mrc.preview.attach_d")}
              </span>
            </div>
          )}
        </div>
        <div className="p-3.5">
          <div className="mb-2 text-caption font-medium text-text-subtle">{t("mrc.preview.reply_k")}</div>
          <div className="flex gap-2.5">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent text-caption font-semibold text-accent-foreground">А</span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-small font-semibold">
                Алекс
                <span className={"inline-flex items-center gap-1 text-caption font-medium " + (auto ? "text-warning" : "text-text-subtle")}>
                  {auto ? <IcBolt size={11} /> : <IcEye size={11} />}
                  {t(auto ? "mrc.preview.bot_auto" : "mrc.preview.bot_ask")}
                </span>
              </div>
              <p className="mt-1 text-small leading-normal text-text">
                {t(withPhoto ? "mrc.preview.bot_photo" : "mrc.preview.bot_text")}
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-start gap-2 border-t border-border pt-2.5 text-caption text-text-subtle">
            <IcSparkle size={13} className="mt-0.5 shrink-0 text-accent" />
            <span>{t("mrc.preview.invoice")}</span>
          </div>
        </div>
      </div>

      <div className="mr-how">
        <div className="mh-k">
          <IcRoute size={13} /> {t("mrc.how.k")}
        </div>
        {[1, 2, 3].map((n) => (
          <div className="mr-how-step" key={n}>
            <span className="hs-n">{n}</span>
            <span className="hs-t">{t(`mrc.how.${n}` as MessageKey)}</span>
          </div>
        ))}
      </div>
      <p className="text-caption leading-normal text-text-subtle">{t("mrc.aside.runnow")}</p>
    </aside>
  );
}

// ── the constructor ──────────────────────────────────────────────────────────
export function MentionRoutineConstructor({
  initial,
  isNew,
  enabled = false,
  t,
  onBack,
  onSave,
  onDelete,
  initialSlot = null,
  busy = false,
  house,
  masterOff = false,
}: {
  initial: MRConfig;
  isNew: boolean;
  enabled?: boolean;
  t: T;
  onBack?: () => void;
  onSave?: (cfg: MRConfig, enable: boolean) => void;
  onDelete?: () => void;
  initialSlot?: SlotKey;
  busy?: boolean;
  /** The account «Правила дома» values shown as Layer-3 inherited defaults. */
  house: L3House;
  /** The account reply master is off → Layer-3 shows a soft "won't fire" note. */
  masterOff?: boolean;
}) {
  const [cfg, setCfg] = useState<MRConfig>(initial);
  const [open, setOpen] = useState<SlotKey>(initialSlot);
  const [layer2, setLayer2] = useState(false);
  const [layer3, setLayer3] = useState(false);
  const set = <K extends keyof MRConfig>(k: K, v: MRConfig[K]) => setCfg((c) => ({ ...c, [k]: v }));
  const toggle = (s: SlotKey) => setOpen((o) => (o === s ? null : s));

  const mediaTxt = t(MEDIA_TXT[cfg.media]);
  const goalTxt = cfg.catchall ? t("mrc.goal.catchall_txt") : cfg.goal.trim() || t("mrc.goal.default_txt");
  const modeTxt = cfg.mode === "auto" ? t("mrc.mode.auto_txt") : t("mrc.mode.ask_txt");
  const actionTxt = cfg.action === "image" ? t("mrc.action.image_txt") : t("mrc.action.voice_txt");

  return (
    <div className="min-h-screen bg-bg text-text">
      {/* topbar */}
      <div className="border-b border-border bg-bg/95 px-3.5 py-3 backdrop-blur md:px-6">
        <div className="mx-auto max-w-[1080px]">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-caption font-medium text-text-subtle transition-colors hover:text-text"
          >
            <IcChevRight size={14} className="rotate-180" /> {t("mrc.back")}
          </button>
          <div className="mt-1.5 flex items-center gap-2">
            <input
              value={cfg.name}
              onChange={(e) => set("name", e.target.value)}
              className="min-w-0 flex-1 bg-transparent text-h2 font-semibold tracking-tight outline-none"
              aria-label={t("mrc.name_label")}
            />
          </div>
          <div className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-2.5 py-0.5 text-caption text-text-muted">
            <IcAt size={13} /> {t("mrc.kindrow")}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1080px] px-3.5 py-5 md:px-6 md:py-7">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* left — the recipe + layers + foot */}
          <div className="flex flex-col gap-4">
            {/* status */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-caption text-text-subtle">
                {isNew ? <IcInfo size={14} /> : <IcAt size={14} />}
                {isNew ? t("mrc.status.draft") : t("mrc.status.active")}
              </span>
              <span
                className={
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-caption font-medium " +
                  (isNew || !enabled
                    ? "bg-surface-2 text-text-muted"
                    : "bg-success/12 text-success")
                }
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {isNew || !enabled ? t("mrc.status.off_badge") : t("mrc.status.on_badge")}
              </span>
            </div>

            {/* recipe card */}
            <div className="rounded-xl border border-border bg-surface p-4 shadow-sm md:p-5">
              <div className="flex flex-wrap items-center gap-2 text-caption font-medium text-text-subtle">
                <IcSparkle size={12} /> {t("mrc.eyebrow")}
                <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5">
                  <IcAt size={11} /> {t("mrc.kind")}
                </span>
              </div>
              <div className="mt-2 inline-flex items-center gap-1.5 text-caption text-text-subtle">
                <IcPencil size={13} /> {t("mrc.hint")}
              </div>
              <p className="mt-2.5 text-body leading-relaxed text-text">
                {t("mrc.phrase.when")}{" "}
                <span className="inline-flex items-center gap-1 rounded bg-surface-2 px-1.5 py-0.5 font-medium text-text-muted">
                  <IcAt size={11} /> {t("mrc.phrase.mentioned")}
                </span>{" "}
                <Slot open={open === "media"} onClick={() => toggle("media")}>
                  {mediaTxt}
                </Slot>
                {cfg.catchall ? " " : ` ${t("mrc.phrase.and")} `}
                <Slot open={open === "goal"} onClick={() => toggle("goal")}>
                  {goalTxt}
                </Slot>
                {", "}
                {t("mrc.phrase.pennedly")}{" "}
                <Slot open={open === "mode"} onClick={() => toggle("mode")}>
                  {modeTxt}
                </Slot>{" "}
                <Slot open={open === "action"} onClick={() => toggle("action")}>
                  {actionTxt}
                </Slot>
                .
              </p>
              <div className="mt-3 flex items-start gap-2 rounded-md bg-surface-2/60 px-3 py-2 text-caption leading-normal text-text-muted">
                <IcRoute size={13} className="mt-0.5 shrink-0 text-text-subtle" />
                <span>
                  <b className="font-semibold text-text">{t("mrc.cond_lead")}</b> {t("mrc.cond")}
                </span>
              </div>

              {/* the open drawer */}
              {open === "goal" && (
                <Drawer title={t("mrc.goal.title")} icon={<IcSparkle size={15} />} onDone={() => setOpen(null)} t={t}>
                  <div className={"mr-goalfield" + (cfg.catchall ? " is-off" : "")}>
                    <textarea
                      className="mr-goal-area"
                      maxLength={500}
                      placeholder={t("mrc.goal.placeholder")}
                      value={cfg.catchall ? "" : cfg.goal}
                      onChange={(e) => set("goal", e.target.value)}
                    />
                    <div className="mr-goal-foot">
                      <span className="mr-goal-hint">
                        <IcSparkle size={12} /> {t("mrc.goal.hint")}
                      </span>
                      <span className="mr-goal-count">{(cfg.catchall ? 0 : cfg.goal.length)} / 500</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => set("catchall", !cfg.catchall)}
                    className={"mr-catchall" + (cfg.catchall ? " is-on" : "")}
                  >
                    <span className="mc-box">
                      <IcCheck size={13} />
                    </span>
                    <span>
                      <span className="mc-t">{t("mrc.goal.catchall_t")}</span>
                      <span className="mc-d">{t("mrc.goal.catchall_d")}</span>
                    </span>
                  </button>
                  <Guard t={t} />
                </Drawer>
              )}

              {open === "media" && (
                <Drawer title={t("mrc.media.title")} icon={<IcImage size={15} />} onDone={() => setOpen(null)} t={t}>
                  <MediaSeg value={cfg.media} t={t} onPick={(m) => set("media", m)} />
                  <Why>{t("mrc.media.why")}</Why>
                </Drawer>
              )}

              {open === "action" && (
                <Drawer title={t("mrc.action.title")} icon={<IcWand size={15} />} onDone={() => setOpen(null)} t={t}>
                  <div className="mr-actions">
                    <OptionTile
                      on={cfg.action === "voice"}
                      icon={<IcBubble size={17} />}
                      title={t("mrc.action.voice_t")}
                      desc={t("mrc.action.voice_d")}
                      onClick={() => set("action", "voice")}
                    />
                    <OptionTile
                      on={cfg.action === "image"}
                      icon={<IcWand size={17} />}
                      title={t("mrc.action.image_t")}
                      desc={t("mrc.action.image_d")}
                      onClick={() =>
                        // A generated-photo routine only makes sense on a photo
                        // mention, and is always review-gated → force image + ask.
                        setCfg((c) => ({ ...c, action: "image", media: "image", mode: "ask" }))
                      }
                    />
                  </div>
                  {cfg.action === "image" ? (
                    <div className="mt-4">
                      <label className="mb-1.5 block text-small font-medium">
                        {t("mrc.imgprompt.label")}{" "}
                        <span className="text-text-subtle">· {t("mrc.inst.optional")}</span>
                      </label>
                      <div className="rounded-md border border-border bg-surface p-3">
                        <textarea
                          value={cfg.imagePrompt}
                          onChange={(e) => set("imagePrompt", e.target.value)}
                          maxLength={2000}
                          rows={2}
                          placeholder={t("mrc.imgprompt.placeholder")}
                          className="w-full resize-y bg-transparent text-small leading-relaxed text-text outline-none placeholder:text-text-subtle"
                        />
                        <div className="mt-2.5 flex items-center gap-2 border-t border-border pt-2.5">
                          <IcWand size={13} className="shrink-0 text-text-subtle" />
                          <span className="text-caption text-text-subtle">{t("mrc.imgprompt.hint")}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4">
                      <label className="mb-1.5 block text-small font-medium">
                        {t("mrc.inst.label")} <span className="text-text-subtle">· {t("mrc.inst.optional")}</span>
                      </label>
                      <BigInst value={cfg.inst} t={t} onChange={(v) => set("inst", v)} />
                    </div>
                  )}
                </Drawer>
              )}

              {open === "mode" && (
                <Drawer title={t("mrc.mode.title")} icon={<IcCheck size={15} />} onDone={() => setOpen(null)} t={t}>
                  <div className="mr-actions">
                    <OptionTile
                      on={cfg.mode === "ask"}
                      icon={<IcEye size={17} />}
                      title={
                        <>
                          {t("mrc.mode.ask_t")}{" "}
                          <span className="text-caption font-normal text-text-subtle">{t("mrc.mode.ask_default")}</span>
                        </>
                      }
                      desc={t("mrc.mode.ask_d")}
                      onClick={() => set("mode", "ask")}
                    />
                    <OptionTile
                      on={cfg.mode === "auto" && cfg.action !== "image"}
                      disabled={cfg.action === "image"}
                      icon={<IcBolt size={17} />}
                      title={t("mrc.mode.auto_t")}
                      desc={t("mrc.mode.auto_d")}
                      pill={
                        cfg.action === "image" ? (
                          <span className="mr-soonpill">
                            <IcLock size={10} /> {t("mrc.mode.image_locked")}
                          </span>
                        ) : undefined
                      }
                      onClick={cfg.action === "image" ? undefined : () => set("mode", "auto")}
                    />
                  </div>
                  {cfg.action === "image" && (
                    <Why>{t("mrc.mode.image_note")}</Why>
                  )}
                </Drawer>
              )}
            </div>

            {/* depth layers */}
            <div className="flex flex-col gap-2.5">
              <Layer
                title={t("mrc.layer2.title")}
                summary={t("mrc.layer2.sum")}
                open={layer2}
                onToggle={() => setLayer2((v) => !v)}
                t={t}
              >
                <div className="flex flex-col gap-4">
                  <div>
                    <div className="mb-2 text-caption font-semibold uppercase tracking-wide text-text-subtle">
                      {t("mrc.media.title")}
                    </div>
                    <MediaSeg value={cfg.media} t={t} onPick={(m) => set("media", m)} />
                  </div>
                  <div>
                    <div className="mb-2 text-caption font-semibold uppercase tracking-wide text-text-subtle">
                      {t("mrc.layer2.inst_k")}
                    </div>
                    <BigInst value={cfg.inst} t={t} onChange={(v) => set("inst", v)} />
                  </div>
                </div>
              </Layer>
              <Layer
                title={t("mrc.layer3.title")}
                pro
                summary={
                  l3OverrideCount(cfg.l3) === 0
                    ? t("mrl3.sumnone")
                    : t("mrl3.count.n").replace("{n}", String(l3OverrideCount(cfg.l3)))
                }
                open={layer3}
                onToggle={() => setLayer3((v) => !v)}
                t={t}
              >
                <Layer3Panel l3={cfg.l3} setL3={(next) => set("l3", next)} house={house} masterOff={masterOff} t={t} />
              </Layer>
            </div>

            {/* foot — Save is blocked while a Layer-3 override is half-set (a lone
                quiet bound / an empty custom-audience description). */}
            {!l3Valid(cfg.l3) && (
              <div className="ml3-invalid">
                <IcAlert size={13} />
                <span>{t("mrl3.savepblocked")}</span>
              </div>
            )}
            <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:items-center">
              <button
                type="button"
                disabled={busy || !l3Valid(cfg.l3)}
                onClick={() => onSave?.(cfg, false)}
                className={buttonClasses({ variant: "secondary", size: "md" })}
              >
                {t("mrc.foot.save_off")}
              </button>
              <button
                type="button"
                disabled={busy || !l3Valid(cfg.l3)}
                onClick={() => onSave?.(cfg, isNew ? true : enabled)}
                className={buttonClasses({ variant: "primary", size: "md" })}
              >
                <IcCheck size={15} /> {isNew ? t("mrc.foot.save_on") : t("mrc.foot.save")}
              </button>
              {!isNew && (
                <button
                  type="button"
                  onClick={onDelete}
                  className={buttonClasses({ variant: "ghost", size: "md", className: "sm:ml-auto text-text-muted" })}
                >
                  <IcTrash size={15} /> {t("mrc.foot.delete")}
                </button>
              )}
            </div>
          </div>

          {/* right — live preview */}
          <Aside cfg={cfg} t={t} />
        </div>
      </div>
    </div>
  );
}

export function emptyConfig(): MRConfig {
  return {
    name: "",
    goal: "",
    catchall: false,
    media: "any",
    action: "voice",
    mode: "ask",
    inst: "",
    imagePrompt: "",
    l3: EMPTY_L3,
  };
}
