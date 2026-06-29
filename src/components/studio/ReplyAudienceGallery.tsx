"use client";

// «Кому отвечать» — the preset GALLERY (Reply-Settings-Gallery-SPEC), opened from
// «Настроить» on the built-in reply routine card. Desktop-focus, content 960px.
//
// Layout: header (routine name + plaques + Вкл switch) → a 3-col preset grid
// (icon + name + «кому» + an «…» example + a check when selected) → a description
// panel BELOW the grid (one of 3 modes) → a «Как отвечать» textarea → read-only
// foot facts (отвечает сама · limits live in House Rules).
//
// The grid looks unified, but maps to 3 backend shapes (see reply-audience.ts):
//   built-in  → reply_audience enum, NO description panel
//   text      → reply_audience=custom + a PREFILLED editable audience_prompt
//   custom    → reply_audience=custom + an EMPTY audience_prompt

import { useTranslation } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n/messages/en";
import { cn } from "@/lib/cn";
import { Switch } from "@/components/ui/switch";
import {
  IcArrowLeft,
  IcBriefcase,
  IcBubble,
  IcChat,
  IcCheck,
  IcHeart,
  IcHelp,
  IcPencil,
  IcReplies,
  IcRepeat,
  IcScale,
  IcSliders,
  IcSparkle,
  IcStar,
  IcTag,
  IcUsers,
  IcVoice,
} from "@/components/icons";
import { Badge } from "./Badges";
import {
  AUDIENCE_PRESETS,
  type AudiencePreset,
} from "./reply-audience";

type IconCmp = (p: { size?: number; className?: string }) => React.ReactNode;
const AUDIENCE_ICONS: Record<string, IconCmp> = {
  heart: IcHeart,
  users: IcUsers,
  help: IcHelp,
  briefcase: IcBriefcase,
  sparkle: IcSparkle,
  tag: IcTag,
  star: IcStar,
  chat: IcChat,
  scale: IcScale,
  pen: IcPencil,
};

const TEXTAREA =
  "w-full rounded-md border border-border bg-surface px-3 py-2 text-body text-text transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25 max-md:text-[16px]";

export type ReplyAudienceGalleryProps = {
  /** Built-in reply routine on/off (= account reply mode ≠ off). */
  on: boolean;
  onToggle: (on: boolean) => void;
  /** The currently-selected preset id (built-in enum or a text/custom preset). */
  selectedId: string;
  onSelect: (preset: AudiencePreset) => void;
  /** The editable audience description (audience_prompt) for text/custom presets. */
  description: string;
  onDescription: (v: string) => void;
  /** The «Как отвечать» tone instruction (reply_instruction). Optional. */
  howTo: string;
  onHowTo: (v: string) => void;
  /** «← Назад» out of the gallery, back to the routine list. */
  onBack: () => void;
  /** Follow the «Правилах дома» inline link → open the House Rules header. */
  onHouseRules: () => void;
};

export function ReplyAudienceGallery({
  on,
  onToggle,
  selectedId,
  onSelect,
  description,
  onDescription,
  howTo,
  onHowTo,
  onBack,
  onHouseRules,
}: ReplyAudienceGalleryProps) {
  const { t } = useTranslation();
  const selected = AUDIENCE_PRESETS.find((p) => p.id === selectedId) ?? AUDIENCE_PRESETS[1];

  return (
    <div className="mx-auto max-w-[960px] space-y-5">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-small text-text-muted transition-colors hover:text-text">
        <IcArrowLeft size={16} /> {t("ap.reply.gallery.back")}
      </button>

      <div className="overflow-hidden rounded-[20px] border border-border bg-surface shadow-sm">
        {/* ── header: icon + routine name + plaques + Вкл switch ── */}
        <div className="flex items-center gap-3.5 border-b border-border px-[22px] py-[18px]">
          <span className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-lg border border-success/26 bg-success/[0.13] text-success">
            <IcBubble size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5 text-h3 font-semibold tracking-tight">
              {t("ap.reply.title")}
              <Badge tone="neutral" icon={<IcReplies />}>{t("ap.reply.badge.answers_people")}</Badge>
              <Badge tone="neutral" icon={<IcSliders />}>{t("ap.reply.badge.builtin")}</Badge>
            </div>
            <p className="mt-1 text-caption text-text-subtle">{t("ap.reply.gallery.head_sub")}</p>
          </div>
          <Switch checked={on} onCheckedChange={onToggle} size="lg" aria-label={t("ap.reply.title")} />
        </div>

        {/* ── «Кому отвечать» section: grid + description panel ── */}
        <div className="px-[26px] py-[22px]">
          <div className="flex items-center gap-2 text-small font-semibold">
            <IcBubble size={14} /> {t("ap.reply.gallery.who_head")}
          </div>
          <p className="mb-3.5 mt-1 text-caption leading-normal text-text-subtle">{t("ap.reply.gallery.who_desc")}</p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {AUDIENCE_PRESETS.map((p) => (
              <PresetCard key={p.id} preset={p} selected={p.id === selectedId} onPick={() => onSelect(p)} />
            ))}
          </div>

          <DescriptionPanel preset={selected} description={description} onDescription={onDescription} />
        </div>

        {/* ── «Как отвечать» — optional tone instruction ── */}
        <div className="border-t border-border px-[26px] py-[22px]">
          <div className="flex flex-wrap items-center gap-2 text-small font-semibold">
            <IcVoice size={14} /> {t("ap.reply.gallery.how_head")}
            <span className="font-normal text-text-subtle">{t("ap.reply.gallery.how_opt")}</span>
          </div>
          <p className="mb-3.5 mt-1 text-caption leading-normal text-text-subtle">{t("ap.reply.gallery.how_desc")}</p>
          <textarea
            rows={2}
            className={cn(TEXTAREA, "min-h-[62px]")}
            value={howTo}
            onChange={(e) => onHowTo(e.target.value)}
            placeholder={t("ap.reply.gallery.how_ph")}
            aria-label={t("ap.reply.gallery.how_head")}
          />
        </div>

        {/* ── read-only foot facts: «отвечает сама» / «limits in House Rules» ── */}
        <div className="grid grid-cols-1 border-t border-border sm:grid-cols-2">
          <FootFact live icon={<IcRepeat size={16} />} title={t("ap.reply.gallery.fact_self")} body={t("ap.reply.gallery.fact_self_body")} />
          <FootFact icon={<IcSliders size={16} />} title={t("ap.reply.gallery.fact_limits")} bodyKey="ap.reply.gallery.fact_limits_body" onLink={onHouseRules} />
        </div>
      </div>
    </div>
  );
}

// One preset card: icon + name + «кому» one-liner + «…» example, accent ring +
// check when selected, dashed border for «Свой вариант».
function PresetCard({ preset, selected, onPick }: { preset: AudiencePreset; selected: boolean; onPick: () => void }) {
  const { t } = useTranslation();
  const Icon = AUDIENCE_ICONS[preset.icon] ?? IcBubble;
  return (
    <button
      type="button"
      onClick={onPick}
      aria-pressed={selected}
      className={cn(
        "group relative flex h-full flex-col gap-2 rounded-lg border bg-surface p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-text/20 hover:shadow-md",
        preset.kind === "custom" && "border-dashed",
        selected
          ? "border-accent bg-accent/[0.05] ring-1 ring-accent"
          : "border-border",
      )}
    >
      {selected && (
        <span className="absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full bg-accent text-primary-foreground">
          <IcCheck size={13} />
        </span>
      )}
      <div className="flex items-center gap-2.5 pr-6">
        <span
          className={cn(
            "grid h-9 w-9 shrink-0 place-items-center rounded-md border",
            selected ? "border-accent/26 bg-accent/12 text-accent" : "border-border bg-surface-2 text-text-muted",
          )}
        >
          <Icon size={18} />
        </span>
        <span className="min-w-0 flex-1 text-small font-semibold leading-tight tracking-tight text-text">{t(preset.nameKey)}</span>
      </div>
      <p className="min-h-[2.4em] text-caption leading-normal text-text-subtle">{t(preset.whoKey)}</p>
      <p className="font-mono text-[10.5px] leading-snug text-text-subtle">{t(preset.exampleKey)}</p>
    </button>
  );
}

// The description panel under the grid — 3 modes (SPEC §2–4):
//   text   → editable textarea PREFILLED with the preset's prompt, «готовое · можно править»
//   custom → empty textarea + placeholder, «своими словами»
//   builtin→ NO textarea, a read-only «это точный встроенный фильтр» note, «встроенный фильтр»
function DescriptionPanel({
  preset,
  description,
  onDescription,
}: {
  preset: AudiencePreset;
  description: string;
  onDescription: (v: string) => void;
}) {
  const { t } = useTranslation();

  if (preset.kind === "builtin") {
    return (
      <div className="mt-4 flex flex-col gap-2.5 rounded-lg border border-border bg-surface-2 p-[15px_17px]">
        <div className="flex flex-wrap items-center gap-2 text-small font-semibold">
          <IcSliders size={13} /> {t(preset.nameKey)}
          <span className="rounded-full border border-border bg-surface px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.04em] text-text-subtle">
            {t("ap.reply.gallery.badge_builtin_filter")}
          </span>
        </div>
        <p className="flex items-start gap-2.5 text-small leading-normal text-text">
          <IcCheck size={15} className="mt-0.5 shrink-0 text-success" />
          {t("ap.reply.gallery.builtin_note")}
        </p>
      </div>
    );
  }

  const isCustom = preset.kind === "custom";
  return (
    <div className="mt-4 flex flex-col gap-2.5 rounded-lg border border-accent/26 bg-accent/[0.04] p-[15px_17px]">
      <div className="flex flex-wrap items-center gap-2 text-small font-semibold">
        <IcPencil size={13} />
        {isCustom ? t("ap.reply.gallery.custom_label") : t("ap.reply.gallery.text_label")}
        <span className="rounded-full border border-accent/30 bg-surface px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.04em] text-accent">
          {isCustom ? t("ap.reply.gallery.badge_own_words") : t("ap.reply.gallery.badge_editable")}
        </span>
      </div>
      <textarea
        rows={2}
        className={cn(TEXTAREA, "min-h-[64px]")}
        value={description}
        onChange={(e) => onDescription(e.target.value)}
        placeholder={t("ap.reply.gallery.desc_ph")}
        aria-label={isCustom ? t("ap.reply.gallery.custom_label") : t("ap.reply.gallery.text_label")}
      />
      <p className="text-caption leading-normal text-text-subtle">
        {isCustom
          ? t("ap.reply.gallery.custom_hint")
          : t("ap.reply.gallery.text_hint").replace("{name}", t(preset.nameKey))}
      </p>
    </div>
  );
}

// One foot fact: an icon tile + a key + a description (the limits row has a link
// to House Rules; that copy carries an <a>…</a> marker we split on).
function FootFact({
  live,
  icon,
  title,
  body,
  bodyKey,
  onLink,
}: {
  live?: boolean;
  icon: React.ReactNode;
  title: string;
  body?: string;
  bodyKey?: MessageKey;
  onLink?: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex items-start gap-3 px-[22px] py-4 [&+&]:border-t [&+&]:border-border sm:[&+&]:border-l sm:[&+&]:border-t-0">
      <span
        className={cn(
          "grid h-8 w-8 shrink-0 place-items-center rounded-md border",
          live ? "border-success/28 bg-success/12 text-success" : "border-border bg-surface text-text-muted",
        )}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-small font-semibold leading-snug text-text">{title}</div>
        <div className="mt-0.5 text-caption leading-normal text-text-subtle">
          {bodyKey ? <LinkedCopy raw={t(bodyKey)} onLink={onLink} /> : body}
        </div>
      </div>
    </div>
  );
}

// Render a copy string with one inline <a>…</a> marker as a real link → House
// Rules (frequency / quiet hours / ceiling live there, one screen over).
function LinkedCopy({ raw, onLink }: { raw: string; onLink?: () => void }) {
  const open = raw.indexOf("<a>");
  const close = raw.indexOf("</a>");
  if (open === -1 || close === -1) return <>{raw}</>;
  const label = raw.slice(open + 3, close);
  return (
    <>
      {raw.slice(0, open)}
      {onLink ? (
        <button type="button" onClick={onLink} className="font-medium text-accent underline underline-offset-2 hover:text-accent/80">
          {label}
        </button>
      ) : (
        <span className="font-medium text-accent underline underline-offset-2">{label}</span>
      )}
      {raw.slice(close + 4)}
    </>
  );
}
