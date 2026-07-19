// «Аудитория ответов» — the Layer-3 card for POST + «Акция» scenarios. It replaces
// the `Layer3NotApplicable` stub (a post produces no replies of its OWN, but its
// posts DO collect comments, and the account reply duty answers them). This card
// lets a post scenario answer comments UNDER its posts with its OWN audience rule
// instead of the account «Правила дома» duty. Ported 1:1 from the design export
// (Post-Reply-Audience-SPEC.html / post-reply-audience.js|css).
//
// Model — exactly TWO rows in «Свои правила» (not the full 4-row Layer3Override):
//   (a) «Как в Правилах дома» — inherit the account audience (nothing emitted).
//   (b) «Свои правила»       — «Кому отвечать» (the shared ReplyAudiencePicker) +
//                              «Пропускать короткие реакции» (a skip-short toggle).
// Limit / frequency / quiet hours stay on the ONE account reply sweep (a greyed,
// non-editable mirror block). «Акция» adds a one-click preset chip that sets
// «все, кроме троллей» + skip-short OFF (answer everyone who responded).
//
// Audience-only override → it reuses the SAME `form.audience`/`audiencePrompt` the
// reply КОМУ slot uses; compileBody emits `reply_audience_override` (see
// scenarios-form.ts buildReplyAudienceOverride). Nothing here is post-visual: it
// leans on ds tokens + the existing ReplyAudiencePicker + Switch.

import { useState } from "react";

import {
  IcAlert,
  IcBubble,
  IcCheck,
  IcFilter,
  IcGauge,
  IcInfo,
  IcLock,
  IcMegaphone,
  IcPencil,
  IcPerson,
  IcRepeat,
  IcShield,
  IcShieldHouse,
  IcTimer,
} from "@/components/icons";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/cn";
import { type MessageKey, useTranslation } from "@/lib/i18n";

import { type ReplyFreq } from "./HouseRules";
import type { ReplyAudience } from "./reply-audience";
import { type FormState, postReplyAudiencePhrase } from "./scenarios-form";
import { type L3Inherited, ReplyAudiencePicker } from "./scenarios-recipe";

// The «Акция» one-click preset is "applied" when its exact combination is live:
// own rules · audience «все, кроме троллей» · skip-short overridden OFF. Derived
// (never stored) — it drives the preset chip's «готово» state + the badge phrase.
export function isPromoPresetApplied(form: FormState, isPromo: boolean): boolean {
  return isPromo && form.postReplyOwn && form.audience === "all_except_trolls" && form.postSkipShortOn && form.postSkipShort === false;
}

const FREQ_LABEL_KEY: Record<ReplyFreq, MessageKey> = {
  instant: "ap.freq.instant",
  hourly: "ap.freq.hourly",
  few: "ap.freq.few",
  daily: "ap.freq.daily",
};

// The account-level mirror block: limit / frequency / quiet hours — all set on the
// ONE account reply sweep, shown greyed + non-editable (this card only owns the
// per-post audience). Values reflect the live inherited «Правила дома» config.
function AccountLevel({ inherited, onOpenHouseRules }: { inherited: L3Inherited; onOpenHouseRules?: () => void }) {
  const { t } = useTranslation();
  const quiet =
    inherited.quietOn && inherited.quietFrom !== inherited.quietTo
      ? `${inherited.quietFrom} – ${inherited.quietTo}`
      : t("scenarios.rc.l3.quiet_none");
  const items: { icon: React.ReactNode; label: string; value: string }[] = [
    { icon: <IcGauge size={13} />, label: t("postReplyAudience.account.limit"), value: t("scenarios.rc.l3.limit_value").replace("{n}", String(inherited.limit)) },
    { icon: <IcRepeat size={13} />, label: t("postReplyAudience.account.freq"), value: t(FREQ_LABEL_KEY[inherited.freq]) },
    { icon: <IcTimer size={13} />, label: t("postReplyAudience.account.quiet"), value: quiet },
  ];
  return (
    <div className="flex flex-col gap-2.5 rounded-md border border-dashed border-border bg-surface-2 px-[15px] py-3">
      <div className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.04em] text-text-subtle">
        <IcLock size={12} className="shrink-0 opacity-80" /> {t("postReplyAudience.account.title")}
      </div>
      <div className="flex flex-col">
        {items.map((it, i) => (
          <div key={i} className={cn("flex flex-wrap items-center gap-2.5 py-2 text-text-subtle", i > 0 && "border-t border-border")}>
            <span className="grid h-[22px] w-[22px] shrink-0 place-items-center rounded-sm border border-border bg-surface text-text-subtle">{it.icon}</span>
            <span className="min-w-0 flex-1 text-small font-medium">{it.label}</span>
            <span className="shrink-0 text-caption tabular-nums text-text-subtle">{it.value}</span>
          </div>
        ))}
      </div>
      <p className="text-caption leading-[1.45] text-text-subtle">
        {t("postReplyAudience.account.note")}{" "}
        {onOpenHouseRules && (
          <button type="button" onClick={onOpenHouseRules} className="font-semibold text-accent hover:underline">
            {t("postReplyAudience.openHouseRules")}
          </button>
        )}
      </p>
    </div>
  );
}

// The «Акция» one-click preset chip: sets «все, кроме троллей» + skip-short OFF so
// every reply-worthy comment (even a short one) gets answered during a campaign.
function PromoPreset({ applied, onApply }: { applied: boolean; onApply: () => void }) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onApply}
      className={cn(
        "flex w-full items-center gap-3 rounded-md border px-3 py-2.5 text-left transition-colors",
        applied
          ? "border-success/32 bg-success/[0.09]"
          : "border-accent/30 bg-accent/[0.07] hover:bg-accent/[0.12]",
      )}
    >
      <span className={cn("grid h-[30px] w-[30px] shrink-0 place-items-center rounded-sm", applied ? "bg-success text-success-foreground" : "bg-accent text-accent-foreground")}>
        {applied ? <IcCheck size={15} /> : <IcMegaphone size={15} />}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-small font-semibold text-text">{applied ? t("postReplyAudience.promoPreset.applied") : t("postReplyAudience.promoPreset.title")}</span>
        <span className="text-caption leading-[1.4] text-text-muted">{t("postReplyAudience.promoPreset.desc")}</span>
      </span>
      <span
        className={cn(
          "shrink-0 rounded-full border px-2.5 py-[3px] font-mono text-[9.5px] uppercase tracking-[0.04em]",
          applied ? "border-success/34 text-success" : "border-accent/34 text-accent",
        )}
      >
        {applied ? t("postReplyAudience.promoPreset.tag") : t("postReplyAudience.promoPreset.cta")}
      </span>
    </button>
  );
}

export function PostReplyAudience({
  form,
  update,
  inherited,
  isPromo,
  onOpenHouseRules,
}: {
  form: FormState;
  update: (patch: Partial<FormState>) => void;
  inherited: L3Inherited;
  isPromo: boolean;
  onOpenHouseRules?: () => void;
}) {
  const { t } = useTranslation();
  const own = form.postReplyOwn;
  // Force the once-seeded ReplyAudiencePicker to re-read form.audience after the
  // «Акция» preset overwrites it in place (mode switches remount it on their own).
  const [pickerNonce, setPickerNonce] = useState(0);
  // True once the user has entered «Свои правила» this session (or the scenario
  // opened already in own mode). Gates the one-time audience seed below so toggling
  // between modes to compare never re-seeds over the user's own pick.
  const [ownSeeded, setOwnSeeded] = useState(own);

  const promoApplied = isPromoPresetApplied(form, isPromo);
  const inheritedPhrase = postReplyAudiencePhrase(t, inherited.audience, inherited.audiencePrompt, false);

  // Enter «Свои правила». On the FIRST entry (a fresh POST scenario whose form
  // audience is still the default, not the account value) seed the audience from
  // the inherited account value — like «Дежурство» overrideWho — so the picker
  // starts on the inherited tile. On every later entry keep the user's own pick
  // (compileBody omits the override while inheriting, so it survives untouched).
  function pickOwn() {
    if (own) return;
    if (!ownSeeded) {
      update({ postReplyOwn: true, audience: inherited.audience, audiencePrompt: inherited.audiencePrompt });
      setOwnSeeded(true);
    } else {
      update({ postReplyOwn: true });
    }
  }
  function pickInherit() {
    if (!own) return;
    // Only flip the mode; the last own-rules audience/skip stay in the form so
    // flipping back to «Свои правила» doesn't lose the user's picks.
    update({ postReplyOwn: false });
  }
  function applyPromoPreset() {
    update({ postReplyOwn: true, audience: "all_except_trolls", audiencePrompt: "", postSkipShortOn: true, postSkipShort: false });
    setOwnSeeded(true);
    setPickerNonce((n) => n + 1);
  }

  // skip-short: inherited (not overridden) shows the account value + a «наследуется»
  // badge; toggling it always sets an explicit override.
  const skipInherited = !form.postSkipShortOn;
  const skipEffective = skipInherited ? inherited.skipLowValue : form.postSkipShort;

  return (
    <div className="@container flex flex-col gap-3.5">
      {/* lead — one sentence about the inherited account duty */}
      <div className="flex items-start gap-3 rounded-md border border-border bg-surface-2 px-[15px] py-3">
        <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-sm border border-accent/24 bg-accent/10 text-accent">
          <IcBubble size={15} />
        </span>
        <p className="text-small leading-[1.55] text-text-muted [&_b]:font-semibold [&_b]:text-text">
          <span dangerouslySetInnerHTML={{ __html: t("postReplyAudience.lead") }} />
        </p>
      </div>

      {/* mode segment (a) / (b) — the эталон stacks each option full-width below a
          narrow container width (@container pra 480px). */}
      <div className="flex w-full flex-wrap gap-1 rounded-lg border border-border bg-surface-2 p-1">
        <button
          type="button"
          role="tab"
          aria-selected={!own}
          onClick={pickInherit}
          className={cn(
            "inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 py-2 text-small font-medium leading-none transition-colors max-md:min-h-[40px] @max-[480px]:basis-full",
            !own ? "bg-surface text-text shadow-sm" : "text-text-muted hover:text-text",
          )}
        >
          <IcShieldHouse size={13} className={cn("shrink-0", !own ? "text-accent" : "opacity-85")} /> {t("postReplyAudience.mode.inherit")}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={own}
          onClick={pickOwn}
          className={cn(
            "inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 py-2 text-small font-medium leading-none transition-colors max-md:min-h-[40px] @max-[480px]:basis-full",
            own ? "bg-surface text-text shadow-sm" : "text-text-muted hover:text-text",
          )}
        >
          <IcPencil size={13} className={cn("shrink-0", own ? "text-accent" : "opacity-85")} /> {t("postReplyAudience.mode.own")}
        </button>
      </div>

      {!own ? (
        /* (a) inherit — show what is inherited */
        <div className="flex flex-col gap-3 rounded-md border border-border bg-surface px-[15px] py-4">
          <div className="flex flex-wrap items-baseline gap-2.5">
            <span className="shrink-0 rounded-full border border-border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.04em] text-text-subtle">
              {t("postReplyAudience.inherited")}
            </span>
            <span className="text-body font-semibold text-text [text-wrap:pretty]">{inheritedPhrase}</span>
          </div>
          <div className="flex items-start gap-2 text-caption leading-[1.5] text-text-subtle [&_b]:font-semibold [&_b]:text-text-muted">
            <IcInfo size={13} className="mt-px shrink-0 opacity-80" />
            <span dangerouslySetInnerHTML={{ __html: t("postReplyAudience.inherit.sub") }} />
          </div>
          {onOpenHouseRules && (
            <button type="button" onClick={onOpenHouseRules} className="inline-flex items-center gap-1.5 self-start text-caption font-semibold text-accent hover:underline">
              <IcShieldHouse size={13} /> {t("postReplyAudience.openHouseRules")}
            </button>
          )}
        </div>
      ) : (
        /* (b) own rules — warning(s) + two rows + the account-level mirror */
        <div className="flex flex-col gap-3.5">
          {inherited.replyOff && (
            <div className="flex items-start gap-2.5 rounded-md border border-danger/32 bg-danger/[0.08] px-3 py-2.5">
              <IcAlert size={15} className="mt-px shrink-0 text-danger" />
              <p className="text-small leading-[1.5] text-danger [&_a]:font-semibold [&_a]:text-danger [&_a]:underline [&_b]:font-semibold">
                {onOpenHouseRules ? (
                  <>
                    {t("postReplyAudience.warn.accountOff").split("{link}")[0]}
                    <button type="button" onClick={onOpenHouseRules} className="font-semibold text-danger underline">
                      {t("postReplyAudience.warn.accountOff_link")}
                    </button>
                    {t("postReplyAudience.warn.accountOff").split("{link}")[1] ?? ""}
                  </>
                ) : (
                  t("postReplyAudience.warn.accountOff").replace("{link}", t("postReplyAudience.warn.accountOff_link"))
                )}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2.5">
            {/* row 1 — Кому отвечать (the shared picker) */}
            <div className="overflow-hidden rounded-md border border-border bg-surface">
              <div className="flex items-start gap-3 px-[15px] py-3">
                <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-sm border border-accent/26 bg-accent/[0.11] text-accent">
                  <IcPerson size={15} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-small font-semibold text-text">{t("postReplyAudience.who.label")}</div>
                  <div className="mt-0.5 text-caption leading-[1.45] text-text-subtle">{t("postReplyAudience.who.desc")}</div>
                </div>
              </div>
              <div className="flex flex-col gap-3 border-t border-border bg-surface-2 px-[15px] py-4">
                {isPromo && <PromoPreset applied={promoApplied} onApply={applyPromoPreset} />}
                <ReplyAudiencePicker
                  key={pickerNonce}
                  audience={form.audience as ReplyAudience}
                  audiencePrompt={form.audiencePrompt}
                  onChange={(a, p) => update({ audience: a, audiencePrompt: p })}
                />
                <div className="flex items-start gap-2 text-caption leading-[1.45] text-text-subtle">
                  <IcShield size={12} className="mt-px shrink-0 opacity-80" />
                  <span>{t("postReplyAudience.hardTrolls")}</span>
                </div>
              </div>
            </div>

            {/* row 2 — Пропускать короткие реакции */}
            <div className="flex items-center gap-3 rounded-md border border-border bg-surface px-[15px] py-3">
              <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-sm border border-accent/26 bg-accent/[0.11] text-accent">
                <IcFilter size={15} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-small font-semibold text-text">
                  {t("postReplyAudience.skipShort.label")}
                  {skipInherited && (
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border px-2 py-px font-mono text-[9.5px] uppercase tracking-[0.03em] text-text-subtle">
                      <IcShieldHouse size={10} className="opacity-70" />
                      {inherited.skipLowValue ? t("postReplyAudience.skipShort.inheritedOn") : t("postReplyAudience.skipShort.inheritedOff")}
                    </span>
                  )}
                </div>
                <div className="mt-0.5 text-caption leading-[1.45] text-text-subtle">{t("postReplyAudience.skipShort.desc")}</div>
              </div>
              <Switch checked={skipEffective} onCheckedChange={(v) => update({ postSkipShortOn: true, postSkipShort: v })} aria-label={t("postReplyAudience.skipShort.label")} />
            </div>
          </div>

          <AccountLevel inherited={inherited} onOpenHouseRules={onOpenHouseRules} />
        </div>
      )}
    </div>
  );
}
