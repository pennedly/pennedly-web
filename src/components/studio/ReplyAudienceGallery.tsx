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
import { BigText, BigTextModal, type BigTextField, ReplyAudiencePicker } from "./scenarios-recipe";
import { IcArrowLeft, IcBubble, IcReplies, IcRepeat, IcSliders, IcVoice } from "@/components/icons";
import { Badge } from "./Badges";
import { type ReplyAudience } from "./reply-audience";

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
  // The «Кому отвечать» multi-select lives in the shared `ReplyAudiencePicker`
  // (scenarios-recipe.tsx) — identical to the recipe-editor slot. This component
  // only wraps it with the routine header / «Как отвечать» tone / foot facts. The
  // tone field uses this local big-text modal (the picker hosts its own audience
  // modal).
  const [bigText, setBigText] = useState<BigTextField>(null);

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

        {/* ── «Кому отвечать» section — the shared two-group multi-select ── */}
        <div className="px-[26px] py-[22px]">
          <div className="flex items-center gap-2 text-small font-semibold">
            <IcBubble size={14} /> {t("ap.reply.gallery.who_head")}
          </div>
          <p className="mb-3.5 mt-1 text-caption leading-normal text-text-subtle">{t("ap.reply.gallery.who_desc")}</p>
          <ReplyAudiencePicker audience={audience} audiencePrompt={audiencePrompt} onChange={onChange} />
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

      {/* full-screen big-text editor for «Как отвечать» (tone) */}
      {bigText && <BigTextModal field={bigText} value={howTo} onChange={onHowTo} onClose={() => setBigText(null)} />}
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
