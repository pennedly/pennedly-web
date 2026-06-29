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

import { useState } from "react";
import { useTranslation } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n/messages/en";
import { cn } from "@/lib/cn";
import { Switch } from "@/components/ui/switch";
import { BigText, BigTextModal, type BigTextField } from "./scenarios-recipe";
import {
  IcArrowLeft,
  IcBriefcase,
  IcBubble,
  IcChat,
  IcCheck,
  IcExpand,
  IcHeart,
  IcHelp,
  IcInfo,
  IcPencil,
  IcReplies,
  IcRefresh,
  IcRepeat,
  IcScale,
  IcShield,
  IcSliders,
  IcSparkle,
  IcStar,
  IcTag,
  IcUsers,
  IcVoice,
  IcX,
} from "@/components/icons";
import { Badge } from "./Badges";
import {
  AUDIENCE_PRESETS,
  type AudiencePreset,
  type ReplyAudience,
  decomposeAudience,
  mergeAudiencePrompt,
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


export type ReplyAudienceGalleryProps = {
  /** Built-in reply routine on/off (= account reply mode ≠ off). */
  on: boolean;
  onToggle: (on: boolean) => void;
  /** The committed reply_audience enum (group A) or "custom" (group B). */
  audience: ReplyAudience;
  /** The committed audience_prompt (the merged OR-description for group B). */
  audiencePrompt: string;
  /** Lift the edited audience back up (committed on «Назад»). */
  onChange: (replyAudience: ReplyAudience, audiencePrompt: string) => void;
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
  audience,
  audiencePrompt,
  onChange,
  howTo,
  onHowTo,
  onBack,
  onHouseRules,
}: ReplyAudienceGalleryProps) {
  const { t } = useTranslation();
  // The multi-select editing model. Seeded ONCE from the committed value (the
  // gallery mounts fresh each open). `bIds` are the selected group-B tiles (text
  // presets + maybe "custom"); `custom` is the «Свой вариант» free clause;
  // `manual` flags a hand-edited merge (toggles then stop regenerating it).
  const [init] = useState(() => decomposeAudience(audience, audiencePrompt));
  const [group, setGroup] = useState<"a" | "b">(init.group);
  const [aId, setAId] = useState<ReplyAudience>(init.group === "a" ? init.a : "all_except_trolls");
  const [bIds, setBIds] = useState<string[]>(init.group === "b" ? init.b : []);
  const [custom, setCustom] = useState(init.group === "b" ? init.custom : "");
  const [manual, setManual] = useState(false);
  const [manualDesc, setManualDesc] = useState("");
  // transient group-conflict notice ("a" = A cleared B · "b" = B cleared A).
  const [notice, setNotice] = useState<"a" | "b" | null>(null);
  // which big-text field is open in the full-screen modal (audience / tone).
  const [bigText, setBigText] = useState<BigTextField>(null);

  // The merged OR-description as currently shown + saved (audience_prompt).
  const autoDesc = mergeAudiencePrompt(bIds, custom);
  const desc = manual ? manualDesc : autoDesc;

  // Lift the committed (reply_audience, audience_prompt) up for any next state.
  function emit(g: "a" | "b", a: ReplyAudience, d: string) {
    if (g === "a") onChange(a, "");
    else onChange("custom", d);
  }

  // Pick a group-A filter (radio). Clears group B + shows the «A снял B» notice
  // when switching away from a non-empty B selection.
  function pickA(id: ReplyAudience) {
    const hadB = group === "b" && bIds.length > 0;
    setGroup("a");
    setAId(id);
    setBIds([]);
    setCustom("");
    setManual(false);
    setManualDesc("");
    setNotice(hadB ? "a" : null);
    emit("a", id, "");
  }

  // Toggle a group-B tile (checkbox). From group A this starts a fresh B
  // selection (and shows «B снял A»); within B it adds/removes the tile.
  function toggleB(id: string) {
    if (group === "a") {
      setGroup("b");
      setBIds([id]);
      const nextCustom = id === "custom" ? "" : "";
      setCustom(nextCustom);
      setManual(false);
      setManualDesc("");
      setNotice("b");
      emit("b", "custom", mergeAudiencePrompt([id], nextCustom));
      return;
    }
    const has = bIds.includes(id);
    const next = has ? bIds.filter((x) => x !== id) : [...bIds, id];
    const nextCustom = id === "custom" && has ? "" : custom;
    setBIds(next);
    if (id === "custom" && has) setCustom("");
    setNotice(null);
    // Manual text is preserved across toggles (only the lit tiles change).
    emit("b", "custom", manual ? manualDesc : mergeAudiencePrompt(next, nextCustom));
  }

  // Edit the description field. Custom-only stays WYSIWYG (edits the custom
  // clause); with presets involved, a hand-edit flips the «manual» badge on.
  function editDesc(value: string) {
    if (group !== "b") return;
    const customOnly = bIds.length === 1 && bIds[0] === "custom";
    if (!manual && customOnly) {
      setCustom(value);
      emit("b", "custom", mergeAudiencePrompt(bIds, value));
      return;
    }
    if (!manual) setManual(true);
    setManualDesc(value);
    emit("b", "custom", value);
  }

  // «Собрать заново из выбранного» — drop the manual edit, regenerate from tiles.
  function regen() {
    setManual(false);
    setManualDesc("");
    emit("b", "custom", mergeAudiencePrompt(bIds, custom));
  }

  // The OR-fragments to render (auto mode → from the lit tiles, so an internal
  // «или» inside a fragment is never mistaken for a separator).
  const fragments: string[] = [];
  for (const p of AUDIENCE_PRESETS) {
    if (p.kind === "text" && bIds.includes(p.id) && p.prompt.trim()) fragments.push(p.prompt.trim());
  }
  if (bIds.includes("custom") && custom.trim()) fragments.push(custom.trim());

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

        {/* ── «Кому отвечать» section: two groups (radio A / checkbox B) ── */}
        <div className="px-[26px] py-[22px]">
          <div className="flex items-center gap-2 text-small font-semibold">
            <IcBubble size={14} /> {t("ap.reply.gallery.who_head")}
          </div>
          <p className="mb-3.5 mt-1 text-caption leading-normal text-text-subtle">{t("ap.reply.gallery.who_desc")}</p>

          {/* Group A — точные фильтры (выбор один) */}
          <GroupHead title={t("ap.reply.group_a.title")} rule={t("ap.reply.group_a.rule")} />
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            {AUDIENCE_PRESETS.filter((p) => p.kind === "builtin").map((p) => (
              <AudTile
                key={p.id}
                preset={p}
                shape="circle"
                on={group === "a" && aId === (p.audience as ReplyAudience)}
                onToggle={() => pickA(p.audience as ReplyAudience)}
              />
            ))}
          </div>

          {/* Group B — по смыслу комментария (можно несколько) */}
          <div className="mt-[18px] border-t border-border pt-[18px]">
            <GroupHead title={t("ap.reply.group_b.title")} rule={t("ap.reply.group_b.rule")} />
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {AUDIENCE_PRESETS.filter((p) => p.kind !== "builtin").map((p) => (
                <AudTile
                  key={p.id}
                  preset={p}
                  shape="square"
                  on={group === "b" && bIds.includes(p.id)}
                  onToggle={() => toggleB(p.id)}
                />
              ))}
            </div>
          </div>

          {notice && <ConflictNotice kind={notice} onDismiss={() => setNotice(null)} />}

          {group === "a" ? (
            <ReadOnlyFilterNote name={t(aPresetNameKey(aId))} />
          ) : (
            <AudienceDescPanel
              fragments={fragments}
              manual={manual}
              hasPreset={bIds.some((id) => id !== "custom")}
              onExpand={() => setBigText("audience")}
              onRegen={regen}
            />
          )}
        </div>

        {/* ── «Как отвечать» — optional tone instruction ── */}
        <div className="border-t border-border px-[26px] py-[22px]">
          <div className="flex flex-wrap items-center gap-2 text-small font-semibold">
            <IcVoice size={14} /> {t("ap.reply.gallery.how_head")}
            <span className="font-normal text-text-subtle">{t("ap.reply.gallery.how_opt")}</span>
          </div>
          <p className="mb-3.5 mt-1 text-caption leading-normal text-text-subtle">{t("ap.reply.gallery.how_desc")}</p>
          <BigText value={howTo} hint={t("ap.reply.gallery.how_ph")} onOpen={() => setBigText("tone")} />
        </div>

        {/* ── read-only foot facts: «отвечает сама» / «limits in House Rules» ── */}
        <div className="grid grid-cols-1 border-t border-border sm:grid-cols-2">
          <FootFact live icon={<IcRepeat size={16} />} title={t("ap.reply.gallery.fact_self")} body={t("ap.reply.gallery.fact_self_body")} />
          <FootFact icon={<IcSliders size={16} />} title={t("ap.reply.gallery.fact_limits")} bodyKey="ap.reply.gallery.fact_limits_body" onLink={onHouseRules} />
        </div>
      </div>

      {/* full-screen big-text editor for «Описание аудитории» / «Как отвечать» */}
      {bigText && (
        <BigTextModal
          field={bigText}
          value={bigText === "tone" ? howTo : desc}
          onChange={bigText === "tone" ? onHowTo : editDesc}
          onClose={() => setBigText(null)}
        />
      )}
    </div>
  );
}

// The enum→name i18n key for a group-A filter's read-only note.
function aPresetNameKey(a: ReplyAudience): MessageKey {
  const p = AUDIENCE_PRESETS.find((x) => x.kind === "builtin" && x.audience === a);
  return p ? p.nameKey : "ap.reply.preset.all.name";
}

// A group label + its rule chip («выбор один» / «можно несколько»).
function GroupHead({ title, rule }: { title: string; rule: string }) {
  return (
    <div className="mb-2.5 flex flex-wrap items-baseline gap-2.5">
      <span className="text-caption font-semibold uppercase tracking-[0.06em] text-text-subtle">{title}</span>
      <span className="rounded-full border border-border px-2 py-px font-mono text-[10px] tracking-[0.02em] text-text-subtle">{rule}</span>
    </div>
  );
}

// A single audience tile. Round mark = «один из» (group A), square = «несколько»
// (group B). Dashed border for «Свой вариант».
function AudTile({
  preset,
  shape,
  on,
  onToggle,
}: {
  preset: AudiencePreset;
  shape: "circle" | "square";
  on: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation();
  const Icon = AUDIENCE_ICONS[preset.icon] ?? IcBubble;
  const custom = preset.kind === "custom";
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={on}
      className={cn(
        "relative flex flex-col gap-1 rounded-md border bg-surface px-3.5 py-3 pr-9 text-left transition-colors",
        custom && "border-dashed",
        on
          ? "border-accent bg-accent/[0.06] shadow-[0_0_0_1px_var(--color-accent)]"
          : "border-border hover:border-text/16",
      )}
    >
      <span
        className={cn(
          "absolute right-3 top-3 grid h-[18px] w-[18px] place-items-center border-[1.5px] transition-colors",
          shape === "circle" ? "rounded-full" : "rounded-[5px]",
          on ? "border-accent bg-accent text-accent-foreground" : "border-border bg-surface",
        )}
      >
        {on && (shape === "circle" ? <span className="h-[7px] w-[7px] rounded-full bg-accent-foreground" /> : <IcCheck size={12} />)}
      </span>
      <span className={cn("flex items-center gap-1.5 text-small font-semibold leading-tight text-text", on && "[&_svg]:text-accent")}>
        <Icon size={14} className="shrink-0 text-text-subtle" /> {t(preset.nameKey)}
      </span>
      <span className="text-caption leading-snug text-text-subtle">{t(preset.whoKey)}</span>
    </button>
  );
}

// The soft, non-blocking notice shown when picking across groups clears the
// other group's selection. Dismissible; it also clears on the next action.
function ConflictNotice({ kind, onDismiss }: { kind: "a" | "b"; onDismiss: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="mt-3.5 flex items-start gap-2.5 rounded-md border border-accent/26 bg-accent/[0.07] px-3 py-2.5 text-caption leading-snug text-text-muted">
      <IcInfo size={15} className="mt-px shrink-0 text-accent" />
      <span className="min-w-0 flex-1">{t(kind === "a" ? "ap.reply.conflict.a_clears_b" : "ap.reply.conflict.b_clears_a")}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label={t("a11y.remove")}
        className="grid h-[22px] w-[22px] shrink-0 place-items-center rounded-sm text-text-subtle transition-colors hover:bg-accent/12 hover:text-text"
      >
        <IcX size={13} />
      </button>
    </div>
  );
}

// Group A → a read-only «точный встроенный фильтр» note (no free-text panel).
function ReadOnlyFilterNote({ name }: { name: string }) {
  const { t } = useTranslation();
  return (
    <div className="mt-4">
      <div className="mb-2 text-small font-semibold text-text">{t("ap.reply.gallery.desc_label")}</div>
      <div className="flex items-start gap-2.5 rounded-md border border-border bg-surface-2 px-3.5 py-3 text-small leading-normal text-text-muted">
        <IcShield size={16} className="mt-px shrink-0 text-text-subtle" />
        <div>
          <b className="font-semibold text-text">{t("ap.reply.gallery.readonly_filter")}</b> «{name}»{" "}
          {t("ap.reply.gallery.readonly_filter_sub")}
        </div>
      </div>
    </div>
  );
}

// Group B → the merged «Описание аудитории» field. Auto mode renders the OR
// fragments (highlighting the «или» separators); manual mode shows a badge + a
// «Собрать заново» action. The footer carries «Открыть в отдельном окне».
function AudienceDescPanel({
  fragments,
  manual,
  hasPreset,
  onExpand,
  onRegen,
}: {
  fragments: string[];
  manual: boolean;
  hasPreset: boolean;
  onExpand: () => void;
  onRegen: () => void;
}) {
  const { t } = useTranslation();
  const empty = fragments.length === 0;
  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center gap-2.5">
        <span className="text-small font-semibold text-text">{t("ap.reply.gallery.desc_label")}</span>
        {manual && (
          <span className="inline-flex items-center gap-1 rounded-full border border-accent/32 bg-accent/[0.07] px-2 py-px font-mono text-[10px] text-accent">
            <IcPencil size={10} /> {t("ap.reply.desc.manual_badge")}
          </span>
        )}
      </div>
      <div className="overflow-hidden rounded-md border border-border bg-surface">
        <div
          className="min-h-[56px] cursor-text px-3.5 py-3 text-small leading-[1.65] text-text [text-wrap:pretty]"
          onClick={onExpand}
        >
          {empty ? (
            <span className="text-text-subtle">{t("ap.reply.desc.placeholder")}</span>
          ) : (
            fragments.map((f, i) => (
              <span key={i}>
                {i > 0 && <span className="mx-[0.32em] font-bold text-accent">{t("ap.reply.or")}</span>}
                {f}
              </span>
            ))
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-x-2.5 gap-y-1.5 border-t border-border bg-surface-2 py-2 pl-3.5 pr-2.5">
          <span className="min-w-0 flex-1 basis-[160px] text-caption leading-[1.4] text-text-subtle">
            {manual ? t("ap.reply.desc.hint_manual") : t("ap.reply.desc.hint_auto")}
          </span>
          <div className="flex shrink-0 items-center gap-1">
            {manual && hasPreset && (
              <button
                type="button"
                onClick={onRegen}
                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm px-[7px] py-1 text-caption font-semibold text-text-subtle transition-colors hover:bg-surface hover:text-text"
              >
                <IcRefresh size={12} /> {t("ap.reply.desc.regen")}
              </button>
            )}
            <button
              type="button"
              onClick={onExpand}
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm px-[7px] py-1 text-caption font-semibold text-accent transition-colors hover:bg-accent/[0.09]"
            >
              <IcExpand size={13} /> {t("scenarios.rc.bigtext_open")}
            </button>
          </div>
        </div>
      </div>
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
