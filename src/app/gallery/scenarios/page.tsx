"use client";

// State gallery for Scenarios (/app/scenarios) — renders the REAL components of
// the «рутинный автопилот» redesign in every state with NO auth / NO backend,
// for self-verification against Scenarios-{WEB,Mobile}-SPEC. Lives under
// /gallery (404 in prod). Covers: the discovery gallery · the control-center
// (default / empty / loading / error · stacking warning · autopost-off) · the
// unified form for a cadence preset / reactive preset / reply duty / «Акция» ·
// the «что зашьётся» + power-user disclosures · preview + run-now.

import { useMemo, useState, type ReactNode } from "react";

import {
  BakedRules,
  CardTitle,
  ConflictBracket,
  ControlCenterHeader,
  DiscoveryGallery,
  Field,
  FormCard,
  HiddenTipsPill,
  INPUT,
  PowerUserDisclosure,
  PresetFieldInput,
  PromoHelper,
  ReplyBlock,
  ScenarioCard,
  ScenarioPreview,
  type PreviewState,
  ScenarioSkeleton,
  ScenariosError,
  type TipAdvice,
  TipRestoredLine,
  TEXTAREA,
  WhenSegment,
  type WhenMode,
  whenModeFromCfg,
  eventKindOf,
} from "@/components/studio/ScenariosParts";
import {
  BAKED_RULE_KEYS,
  BOOST_FORM_DEFAULTS,
  type FormState,
  interpolate,
  L3_FORM_DEFAULTS,
  visibleFields,
} from "@/components/studio/scenarios-form";
import type { L3Inherited } from "@/components/studio/scenarios-recipe";
import { BLANK_PROMO, DEMO_CATALOG, DEMO_PROMO, DEMO_SCENARIOS } from "@/components/studio/scenarios-demo";
import { HouseRules, type ReplyFreq } from "@/components/studio/HouseRules";
import { StepEditor } from "@/components/studio/scenarios-editor";
import { ReplyRoutineCard } from "@/components/studio/ReplyRoutineCard";
import { ReplyAudienceGallery } from "@/components/studio/ReplyAudienceGallery";
import { AUDIENCE_PRESETS, type ReplyAudience, mergeAudiencePrompt } from "@/components/studio/reply-audience";
import { Badge, InheritChip, StatusBadge } from "@/components/studio/Badges";
import { IcReplies, IcRepeat, IcSliders, IcSwap } from "@/components/icons";
import { useTranslation, type MessageKey } from "@/lib/i18n";
import { cn } from "@/lib/cn";
import type { Scenario, ScenarioPreset, ScenarioPreview as ScenarioPreviewT } from "@/lib/types";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-7">
      <h3 className="mb-2 font-mono text-caption uppercase tracking-wide text-text-subtle">{title}</h3>
      <div className="rounded-lg border border-border bg-bg p-4">{children}</div>
    </section>
  );
}

// A self-contained form host that wires the real parts to local state, given a
// preset (mirrors the live EditorView, which is private).
function FormDemo({ presetId }: { presetId: string }) {
  const { t } = useTranslation();
  const preset: ScenarioPreset | null = useMemo(() => DEMO_CATALOG.find((p) => p.id === presetId) ?? null, [presetId]);
  const isPromo = presetId === "promo";
  const when0: WhenMode = preset ? whenModeFromCfg(preset.trigger_cfg, preset.condition_cfg) : "daily";
  const [form, setForm] = useState<FormState>(() => {
    const fields: Record<string, string> = {};
    for (const f of preset?.fields ?? []) {
      if (f.kind === "text" || f.kind === "textarea" || f.kind === "options") fields[f.key] = typeof f.default === "string" ? f.default : "";
    }
    // pre-fill a couple of demo values so the preview reads
    if (presetId === "rubric") {
      fields.rubric_name = "Карта недели";
      fields.rubric_idea = "Одна карта на неделю + короткий вывод";
    }
    if (presetId === "poll") {
      fields.question = "Что тебе сейчас ближе?";
      fields.options = "Уединение\nБлизкий круг\nБольшая компания";
    }
    return {
      name: preset ? t(preset.name_key as MessageKey) : "",
      preset,
      helperOn: isPromo,
      promo: isPromo ? DEMO_PROMO : { ...BLANK_PROMO },
      instruction: preset && !isPromo ? preset.instruction : "",
      replyInstruction: preset?.reply_instruction || "",
      audience: (preset?.reply_defaults?.audience as string) || "all_except_trolls",
      audiencePrompt: "",
      when: presetId === "rubric" ? "weekly" : when0,
      nDays: 3,
      startDate: "",
      weekdays: [0, 1, 2, 3, 4],
      perDay: false,
      perDayTimes: {},
      monthlyDays: [1, 15, 31],
      monthlyLastDay: false,
      monthlyOnMissing: "last",
      milestoneTargets: [100, 500, 1000, 5000, 10000, 25000, 50000, 100000],
      yearlyDates: [
        { day: 1, month: 0 },
        { day: 29, month: 1 },
      ],
      dateFrom: "",
      dateTo: "",
      threshold: "",
      eventKind: "on_metric_threshold",
      hours: [9],
      hour: "9:00",
      jitter: 15,
      condNoPostToday: false,
      cooldownOn: false,
      cooldownValue: 6,
      cooldownUnit: "hours",
      maxFiresOn: false,
      maxFires: 3,
      topic: "",
      length: "any",
      cta: "",
      mode: "ask",
      ...L3_FORM_DEFAULTS,
      ...BOOST_FORM_DEFAULTS,
      fields,
    };
  });
  const [bakedOpen, setBakedOpen] = useState(true);
  const [powerOpen, setPowerOpen] = useState(false);

  const up = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));
  const setField = (k: string, v: string) => setForm((f) => ({ ...f, fields: { ...f.fields, [k]: v } }));

  const isReplyPolicy = !!preset && (preset.action_cfg?.kind as string) === "reply_policy";
  const isReactive = form.when === "event" && !!preset && eventKindOf(preset.trigger_cfg) !== "";
  const promoMode = form.helperOn || isPromo;
  const vFields = visibleFields(preset);
  const bakedRules = (BAKED_RULE_KEYS[presetId] ?? []).map((k) => t(k as MessageKey));
  const eventKind = preset ? eventKindOf(preset.trigger_cfg) : "";

  const previewState: PreviewState = isReplyPolicy
    ? "reply"
    : promoMode
      ? "promo"
      : interpolate(form.instruction, form.fields).trim()
        ? "free"
        : "empty";
  const preview: ScenarioPreviewT = promoMode
    ? { cta: `Напишите в комментариях «${form.promo.ask || "свою дату рождения"}» — и ${form.promo.reward || "пришлю мини-разбор"}.`, instruction: "", reply_instruction: form.replyInstruction, sample_post: "" }
    : isReplyPolicy
      ? { cta: "", instruction: "", reply_instruction: form.replyInstruction, sample_post: "" }
      : { cta: "", instruction: interpolate(form.instruction, form.fields), reply_instruction: "", sample_post: "Карта дня — Восьмёрка Жезлов 🔥 День ускоряется: то, что вы откладывали, сдвинется. Совет: ответьте на одно письмо, которое избегаете." };

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-[minmax(0,1fr)_380px] md:items-start">
      <div className="space-y-4 md:space-y-5">
        <FormCard>
          <Field label={t("scenarios.f.name")}>
            <input className={INPUT} value={form.name} onChange={(e) => up({ name: e.target.value })} placeholder={t("scenarios.f.name_ph")} />
          </Field>
        </FormCard>
        {!isReplyPolicy && (
          <FormCard>
            <CardTitle title={t("scenarios.sec.schedule")} sub={t("scenarios.sec.schedule_sub")} />
            <WhenSegment
              value={form.when}
              nDays={form.nDays}
              // legacy single-weekday segment — bridge to the multi-weekday state.
              weekday={form.weekdays[0] ?? 0}
              dateFrom={form.dateFrom}
              dateTo={form.dateTo}
              threshold={form.threshold}
              locked={isReactive}
              eventKind={eventKind}
              onMode={(m) => up({ when: m })}
              onNDays={(n) => up({ nDays: n })}
              onWeekday={(d) => up({ weekdays: [d] })}
              onDate={(which, v) => up(which === "from" ? { dateFrom: v } : { dateTo: v })}
              onThreshold={(v) => up({ threshold: v })}
            />
          </FormCard>
        )}
        {promoMode ? (
          <FormCard>
            <CardTitle title={t("scenarios.sec.generate")} sub={t("scenarios.sec.generate_sub")} />
            <PromoHelper on={form.helperOn} promo={form.promo} onToggle={(on) => up({ helperOn: on })} onChange={(p) => up({ promo: p })} />
          </FormCard>
        ) : preset && (vFields.length > 0 || isReplyPolicy) ? (
          <FormCard>
            <CardTitle title={t("scenarios.sec.you_set")} sub={t("scenarios.sec.you_set_sub")} />
            <div className="space-y-4">
              {vFields.map((f) => (
                <PresetFieldInput key={f.key} field={f} value={form.fields[f.key] ?? ""} onChange={(v) => setField(f.key, v)} />
              ))}
              {isReplyPolicy && (
                <ReplyBlock audience={form.audience} onAudience={(a) => up({ audience: a })} replyInstruction={form.replyInstruction} onReplyInstruction={(v) => up({ replyInstruction: v })} />
              )}
            </div>
          </FormCard>
        ) : !preset ? (
          <FormCard>
            <CardTitle title={t("scenarios.sec.generate")} sub={t("scenarios.sec.generate_sub")} />
            <Field label={t("scenarios.f.instruction")} hint={t("scenarios.f.instruction_hint")}>
              <textarea rows={5} className={cn(TEXTAREA, "min-h-[132px]")} value={form.instruction} onChange={(e) => up({ instruction: e.target.value })} placeholder={t("scenarios.f.instruction_ph")} />
            </Field>
          </FormCard>
        ) : null}

        {bakedRules.length > 0 && <BakedRules open={bakedOpen} onToggle={() => setBakedOpen((o) => !o)} rules={bakedRules} />}

        <PowerUserDisclosure open={powerOpen} onToggle={() => setPowerOpen((o) => !o)} instruction={form.instruction} onInstruction={(v) => up({ instruction: v })} />
      </div>
      <aside className="md:sticky md:top-4 md:self-start">
        <ScenarioPreview state={previewState} preview={preview} promo={form.promo} whenFires={t("scenarios.fires.morning")} canRunNow running={false} runResult={null} onRunNow={() => {}} />
      </aside>
    </div>
  );
}

// Sample «Правила дома» values the gallery's reply scenarios inherit in Layer 3
// (mirrors the demo HouseRules: всем-кроме-троллей · до 25 · раз в ~час · 23–08).
const GAL_L3_INHERITED: L3Inherited = {
  audience: "all_except_trolls",
  audiencePrompt: "",
  limit: 25,
  freq: "hourly",
  quietOn: true,
  quietFrom: "23:00",
  quietTo: "08:00",
};

// Hosts the REAL StepEditor (recipe card + large preview) wired to local state,
// for spec-fidelity review against the recipe-editor source. `demo*` seeds open a
// slot drawer / modal / layer so every Wave-1 state is reachable without auth;
// `override` tweaks the starting form (mode, when-mode, conditions…).
function StepEditorDemo({
  presetId,
  isExisting = true,
  override,
  demoOpenSlot,
  demoModal,
  demoLayer2,
  demoLayer3,
}: {
  presetId: string;
  isExisting?: boolean;
  override?: Partial<FormState>;
  demoOpenSlot?: import("@/components/studio/scenarios-recipe").OpenSlot;
  demoModal?: import("@/components/studio/scenarios-recipe").BigTextField;
  demoLayer2?: boolean;
  demoLayer3?: boolean;
}) {
  const { t } = useTranslation();
  const preset: ScenarioPreset | null = useMemo(() => DEMO_CATALOG.find((p) => p.id === presetId) ?? null, [presetId]);
  const isPromo = presetId === "promo";
  const isBoostPreset = presetId === "boost";
  const when0: WhenMode = preset ? whenModeFromCfg(preset.trigger_cfg, preset.condition_cfg) : "daily";
  const [form, setForm] = useState<FormState>(() => {
    const fields: Record<string, string> = {};
    for (const f of preset?.fields ?? []) {
      if (f.kind === "text" || f.kind === "textarea" || f.kind === "options") fields[f.key] = typeof f.default === "string" ? f.default : "";
    }
    if (presetId === "talk" || presetId === "daily_question") fields.topic = "довести дело до конца";
    return {
      name: preset ? t(preset.name_key as MessageKey) : "Новый сценарий",
      preset,
      helperOn: isPromo,
      promo: isPromo ? DEMO_PROMO : { ...BLANK_PROMO },
      instruction: preset && !isPromo ? preset.instruction : "короткий вопрос на одно слово в ответ, по теме дня, без штампов",
      replyInstruction: preset?.reply_instruction || "по имени, одно наблюдение и мягкий вопрос — без шаблонов",
      audience: (preset?.reply_defaults?.audience as string) || "all_except_trolls",
      audiencePrompt: "тем, кто пишет по делу, без флуда",
      when: when0,
      nDays: 3,
      startDate: "",
      weekdays: [0, 1, 2, 3, 4],
      perDay: false,
      perDayTimes: {},
      monthlyDays: [1, 15, 31],
      monthlyLastDay: false,
      monthlyOnMissing: "last",
      milestoneTargets: [100, 500, 1000, 5000, 10000, 25000, 50000, 100000],
      yearlyDates: [
        { day: 1, month: 0 },
        { day: 29, month: 1 },
      ],
      dateFrom: "2026-06-28",
      dateTo: "2026-07-05",
      threshold: "5000",
      eventKind: "on_metric_threshold",
      hours: [9],
      hour: "9:00",
      jitter: 15,
      condNoPostToday: false,
      cooldownOn: false,
      cooldownValue: 6,
      cooldownUnit: "hours",
      maxFiresOn: false,
      maxFires: 3,
      topic: "довести дело до конца",
      length: "any",
      cta: "",
      mode: "ask",
      ...L3_FORM_DEFAULTS,
      ...BOOST_FORM_DEFAULTS,
      // boost preset → open the boost recipe (entry A) with the design defaults.
      ...(isBoostPreset ? { isBoost: true, boostEntry: "a" as const, boostMetric: "views" as const, boostThreshold: "5000" } : {}),
      fields,
      ...override,
    };
  });
  const [powerOpen, setPowerOpen] = useState(false);
  const up = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));
  const setField = (k: string, v: string) => setForm((f) => ({ ...f, fields: { ...f.fields, [k]: v } }));

  const isReplyPolicy = !!preset && (preset.action_cfg?.kind as string) === "reply_policy";
  const isReactive = form.when === "event" && !!preset && eventKindOf(preset.trigger_cfg) !== "";
  const isMentionReply = !!preset && (preset.trigger_cfg?.kind as string) === "on_mention";
  const promoMode = form.helperOn || isPromo;
  const vFields = visibleFields(preset);
  const bakedRules = (BAKED_RULE_KEYS[presetId] ?? []).map((k) => t(k as MessageKey));
  const previewState: PreviewState = isReplyPolicy ? "reply" : promoMode ? "promo" : "free";
  const preview: ScenarioPreviewT = {
    cta: "",
    instruction: interpolate(form.instruction, form.fields),
    reply_instruction: form.replyInstruction,
    sample_post: "Вопрос на сегодня: что вы сегодня доведёте до конца — даже если получится неидеально? Напишите одним словом 👇",
  };

  return (
    <StepEditor
      t={t}
      form={form}
      handle="@alex.makes"
      update={up}
      setField={setField}
      isExisting={isExisting}
      nameErr={false}
      fieldErrs={{}}
      askErr={false}
      vFields={vFields}
      producesReplies={promoMode || isReplyPolicy}
      isReplyPolicy={isReplyPolicy}
      isReactive={isReactive}
      isMentionReply={isMentionReply}
      isBoost={form.isBoost}
      boostScenarioOptions={[{ id: 1, label: "Утренний вопрос" }, { id: 2, label: "Рубрика недели" }]}
      boostPostOptions={[{ id: 11, label: "Собрал всё, что знаю по теме…" }, { id: 12, label: "Маленькая победа дня" }]}
      l3Inherited={GAL_L3_INHERITED}
      bakedRules={bakedRules}
      bakedOpen={false}
      onBakedToggle={() => {}}
      powerOpen={powerOpen}
      onPowerToggle={() => setPowerOpen((o) => !o)}
      previewState={previewState}
      preview={preview}
      whenFires={t("scenarios.fires.morning")}
      running={false}
      runResult={null}
      onRunNow={() => {}}
      canRunNow
      saving={false}
      saveErr={false}
      confirmInline={false}
      onBack={() => {}}
      onSave={() => {}}
      onSaveOn={() => {}}
      onDeleteDesktop={() => {}}
      onDeleteMobile={() => {}}
      onCancelInline={() => {}}
      onConfirmInline={() => {}}
      deleting={false}
      demoOpenSlot={demoOpenSlot}
      demoModal={demoModal}
      demoLayer2={demoLayer2}
      demoLayer3={demoLayer3}
    />
  );
}

// «Правила дома» wired to local state — renders the real HouseRules in a given
// open/master configuration for spec-fidelity review (Autopilot-Unified-SPEC §4).
function HouseRulesDemo({ open: open0, master }: { open?: boolean; master?: boolean }) {
  const [open, setOpen] = useState(open0 ?? false);
  const [masterOn, setMasterOn] = useState(master ?? true);
  const [cap, setCap] = useState(1);
  const [freq, setFreq] = useState<ReplyFreq>("hourly");
  const [quietOn, setQuietOn] = useState(true);
  const [quietFrom, setQuietFrom] = useState("23:00");
  const [quietTo, setQuietTo] = useState("08:00");
  const [ceiling, setCeiling] = useState(25);
  return (
    <HouseRules
      masterOn={masterOn}
      cap={cap}
      freq={freq}
      quietOn={quietOn}
      quietFrom={quietFrom}
      quietTo={quietTo}
      ceiling={ceiling}
      // Sample IANA tz so the gallery hint reads as a real offset (HouseRules
      // derives the "UTC+N" label from the name).
      tz="Europe/Warsaw"
      open={open}
      onToggle={() => setOpen((o) => !o)}
      onMaster={setMasterOn}
      onCap={setCap}
      onFreq={setFreq}
      onQuiet={setQuietOn}
      onQuietFrom={setQuietFrom}
      onQuietTo={setQuietTo}
      onCeiling={setCeiling}
    />
  );
}

// The built-in reply routine card wired to local state, for spec-fidelity review
// against Autopilot-Reply-Card-SPEC (ON / OFF / coexistence-paused).
function ReplyCardDemo({ state }: { state: "on" | "off" | "paused" }) {
  const [on, setOn] = useState(state !== "off");
  return (
    <ReplyRoutineCard
      on={on}
      paused={state === "paused"}
      scenarioName="Тёплый приём новичкам"
      onOpenScenario={() => {}}
      audienceId="pricing"
      audienceDescription="тем, кто спрашивает про цену, продукт, как купить или записаться"
      onToggle={setOn}
      onConfigure={() => {}}
      activityHref="#"
      lastReplyLabel={state === "on" ? "12 мин назад" : undefined}
    />
  );
}

// The «кому отвечать» multi-select gallery wired to local state. `initialId`
// seeds group A (builtin) or a single group-B text preset; `initialPrompt`
// overrides the seed prompt (e.g. a multi-preset OR-merge).
function ReplyGalleryDemo({ initialId, initialPrompt }: { initialId: string; initialPrompt?: string }) {
  const seed = AUDIENCE_PRESETS.find((p) => p.id === initialId) ?? AUDIENCE_PRESETS[1];
  const initAud: ReplyAudience = seed.kind === "builtin" ? (seed.audience as ReplyAudience) : "custom";
  const initPrompt = initialPrompt ?? (seed.kind === "text" ? seed.prompt : "");
  const [audience, setAudience] = useState<ReplyAudience>(initAud);
  const [audiencePrompt, setAudiencePrompt] = useState(initPrompt);
  const [howTo, setHowTo] = useState("коротко и тепло, без воды; на грубость не реагирую");
  const [on, setOn] = useState(true);
  return (
    <ReplyAudienceGallery
      on={on}
      onToggle={setOn}
      audience={audience}
      audiencePrompt={audiencePrompt}
      onChange={(a, p) => {
        setAudience(a);
        setAudiencePrompt(p);
      }}
      howTo={howTo}
      onHowTo={setHowTo}
      onBack={() => {}}
      onHouseRules={() => {}}
    />
  );
}

// ── Tip-plaque demo fixtures (Tip-Card-Plaque states) ──
// A base post scenario; `mk` clones it with a fixed post hour so several land on
// the same morning (drives the Case-B conflict bracket).
function mkScenario(id: number, name: string, hour: number, extra?: Partial<Scenario>): Scenario {
  return {
    id, name, template: null, enabled: true, preset_id: "daily_question", publish_mode: "ask",
    trigger_cfg: { kind: "daily_first_post", hour }, condition_cfg: { once_per_day: true }, action_cfg: { kind: "post" },
    structured: null, instruction: "", reply_instruction: "",
    next_run_at: "2026-06-29T05:00:00Z", last_run_at: "2026-06-28T05:02:00Z", fire_count: 12, recent_skips: [],
    ...extra,
  };
}
// Case A — a daily «Акция» (promo) the band attaches to.
const GAL_PROMO: Scenario = {
  id: 90, name: "Акция", template: "promo", enabled: true, preset_id: "promo", publish_mode: "ask",
  trigger_cfg: { kind: "daily_first_post" }, condition_cfg: { once_per_day: true }, action_cfg: { kind: "post" },
  structured: null, instruction: "", reply_instruction: "",
  next_run_at: "2026-06-28T15:00:00Z", last_run_at: "2026-06-27T15:00:00Z", fire_count: 5, recent_skips: [],
};
// Case B — three post routines all aiming at 8:00.
const GAL_CONFLICT: Scenario[] = [
  mkScenario(91, "Утренний вопрос", 8),
  mkScenario(92, "Цитата дня", 8),
  mkScenario(93, "Совет дня", 8),
];
// A plain post routine for the refreshed day-strip state.
const GAL_PLAIN = mkScenario(94, "Маленькая победа", 9, { trigger_cfg: { kind: "weekly", weekday: 1, hour: 9 } });

export default function ScenariosGallery() {
  const { t } = useTranslation();
  const [dark, setDark] = useState(false);
  // DEMO_CATALOG = the backend-shaped presets + the synthetic «Ответ на
  // упоминания» (on_mention) + «Акция» — mirrors what the live page builds.
  const catalog = useMemo(() => [...DEMO_CATALOG], []);
  function toggleDark() {
    document.documentElement.classList.toggle("dark");
    setDark((d) => !d);
  }

  // ── tip-plaque advice (built from the i18n copy, like the live page) ──
  const promoAdvice: TipAdvice = {
    id: "gal-promo",
    title: t("scenarios.tip.promo_title"),
    body: t("scenarios.tip.promo_body"),
    actions: [{ key: "spread", label: t("scenarios.tip.promo_action"), icon: "spread" }],
  };
  const promoCoachAdvice: TipAdvice = { ...promoAdvice, id: "gal-promo-coach", coach: true };
  const conflictNames = GAL_CONFLICT.map((s) => `**«${s.name}»**`);
  const conflictAdvice: TipAdvice = {
    id: "gal-conflict",
    title: t("scenarios.tip.conflict_title_many").replace("{n}", String(GAL_CONFLICT.length)),
    body: t("scenarios.tip.conflict_body")
      .replace("{names}", `${conflictNames.slice(0, -1).join(", ")} ${t("common.and")} ${conflictNames[conflictNames.length - 1]}`)
      .replace("{time}", "8:00")
      .replace("{cap}", "1"),
    actions: [
      { key: "spread", label: t("scenarios.tip.conflict_spread"), icon: "spread" },
      { key: "raise", label: t("scenarios.tip.conflict_raise"), icon: "up" },
    ],
  };

  // a run-now result preview
  const runDemo = useMemo(
    () => ({ draft_id: 0, text: "Сегодня звёзды на вашей стороне ✨ Хотите узнать, что именно? Напишите свою дату рождения в комментариях.", kind: "post" as const, replied_to: null }),
    [],
  );

  return (
    <div className="min-h-screen bg-bg p-6 text-text">
      <div className="mx-auto max-w-[960px]">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-h2 font-semibold">Scenarios — state gallery</h1>
            <p className="text-caption text-text-subtle">dev-only · real components, no backend · compare to Scenarios-WEB-SPEC.html</p>
          </div>
          <button type="button" onClick={toggleDark} className="shrink-0 rounded-md border border-border px-3 py-1.5 text-small transition-colors hover:bg-surface-2">
            {dark ? "Light" : "Dark"}
          </button>
        </header>

        <h2 className="mb-3 text-h3 font-semibold">Autopilot — «Правила дома» (house rules header)</h2>
        <Section title="collapsed · master ON · summary line built from live values">
          <HouseRulesDemo open={false} master />
        </Section>
        <Section title="expanded · settings (cap stepper · reply freq · quiet hours · ceiling · voice link)">
          <HouseRulesDemo open master />
        </Section>
        <Section title="master OFF · body dims (pointer-events-none); the master switch stays live">
          <HouseRulesDemo open master={false} />
        </Section>

        <h2 className="mb-3 mt-8 text-h3 font-semibold">Discovery — preset gallery</h2>
        <Section title="grouped by goal · campaign gated">
          <DiscoveryGallery presets={catalog} onPick={() => {}} />
        </Section>

        <h2 className="mb-3 mt-8 text-h3 font-semibold">Control center — the list</h2>
        <Section title="default · per-day cap stepper · week strip · provenance · runs · skip-note">
          <div className="flex flex-col gap-3">
            <ControlCenterHeader cap={1} onCap={() => {}} />
            <div className="flex flex-col gap-3">
              {DEMO_SCENARIOS.map((s) => (
                <ScenarioCard key={s.id} s={s} onToggle={() => {}} onOpen={() => {}} />
              ))}
            </div>
          </div>
        </Section>
        <h2 className="mb-3 mt-8 text-h3 font-semibold">Tip plaque — context advice (Tip-Card-Plaque)</h2>
        <Section title="(a) Case A · «Акция» daily — band fused to the card's bottom edge (below the footer)">
          <ScenarioCard s={GAL_PROMO} onToggle={() => {}} onOpen={() => {}} band={promoAdvice} onDismissBand={() => {}} />
        </Section>
        <Section title="(b) Case B · 3 routines aim at 8:00 — one shared bracket + «метит на 8:00» chips · built-in reply card stays outside">
          <div className="flex flex-col gap-3">
            <ConflictBracket advice={conflictAdvice} onDismiss={() => {}}>
              {GAL_CONFLICT.map((s) => (
                <ScenarioCard key={s.id} s={s} onToggle={() => {}} onOpen={() => {}} timechip="8:00" />
              ))}
            </ConflictBracket>
            <ScenarioCard
              s={DEMO_SCENARIOS.find((s) => (s.action_cfg?.kind as string) === "reply_policy")!}
              onToggle={() => {}}
              onOpen={() => {}}
              inheritFromHouseRules
            />
          </div>
        </Section>
        <Section title="(c) dismissed · header «1 совет скрыт» pill + the inline restore line in the plaque's place">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-caption font-semibold uppercase tracking-[0.05em] text-text-subtle">Твои рутины</span>
              <HiddenTipsPill count={1} onShow={() => {}} />
            </div>
            <ScenarioCard s={GAL_PROMO} onToggle={() => {}} onOpen={() => {}} />
            <TipRestoredLine name={GAL_PROMO.name} onRestore={() => {}} />
          </div>
        </Section>
        <Section title="(d) coach variant · «Коуч Pennedly» tag swaps for «Совет»">
          <ScenarioCard s={GAL_PROMO} onToggle={() => {}} onOpen={() => {}} band={promoCoachAdvice} onDismissBand={() => {}} />
        </Section>
        <Section title="(e) refreshed day strip on a normal card · «дни» label + filled active days, no advice">
          <ScenarioCard s={GAL_PLAIN} onToggle={() => {}} onOpen={() => {}} />
        </Section>
        <Section title="empty · = the discovery gallery (rendered above)">
          <p className="text-small text-text-subtle">Empty state shows the discovery gallery (see the first section).</p>
        </Section>
        <Section title="loading · skeleton cards with the week strip">
          <div className="flex flex-col gap-3">
            <ScenarioSkeleton />
            <ScenarioSkeleton />
          </div>
        </Section>
        <Section title="error · inline banner + Retry">
          <ScenariosError onRetry={() => {}} />
        </Section>

        <h2 className="mb-3 mt-8 text-h3 font-semibold">Badge system (unified — Badge-System-SPEC)</h2>
        <Section title="status (.st — the only family with a dot) · on / off / paused">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge tone="on">Активна</StatusBadge>
            <StatusBadge tone="off">Выключена</StatusBadge>
            <StatusBadge tone="paused">На паузе</StatusBadge>
          </div>
        </Section>
        <Section title="properties (.bdg) · neutral / link / note — normal-case sans, icon = text, fixed height">
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone="neutral" icon={<IcReplies />}>отвечает людям</Badge>
            <Badge tone="neutral" icon={<IcSliders />}>встроенная</Badge>
            <Badge tone="link" icon={<IcSwap />}>перебивает дефолт</Badge>
            <Badge tone="note" icon={<IcRepeat />}>нужен доступ</Badge>
          </div>
        </Section>
        <Section title="inheritance (.inh) · ghost dashed, lives next to a value">
          <InheritChip icon={<IcSliders />}>из Правил дома</InheritChip>
        </Section>

        <h2 className="mb-3 mt-8 text-h3 font-semibold">Reply routine card — «Отвечать на комментарии» (built-in)</h2>
        <Section title="ON · «отвечает людям» + «встроенная» badges · «отвечает сама» + «из Правил дома» · «Настроить» → gallery">
          <ReplyCardDemo state="on" />
        </Section>
        <Section title="OFF · «Ответы выключены — включи, когда будешь готов» + «Включить» · no plaque/chips">
          <ReplyCardDemo state="off" />
        </Section>
        <Section title="coexistence · «На паузе» «Заменена сценарием …» (a custom reply scenario overrides)">
          <div className="flex flex-col gap-3">
            <ReplyCardDemo state="paused" />
            <ScenarioCard
              s={DEMO_SCENARIOS.find((s) => (s.action_cfg?.kind as string) === "reply_policy")!}
              handle="@alex.makes"
              onToggle={() => {}}
              onOpen={() => {}}
              inheritFromHouseRules
              overridesDefault
            />
          </div>
        </Section>

        <h2 className="mb-3 mt-8 text-h3 font-semibold">«Кому отвечать» — мультивыбор с защитой от конфликтов (960 · «Настроить»)</h2>
        <Section title="группа A · точный фильтр «Только вопросы» (radio) → read-only заметка, поля нет">
          <ReplyGalleryDemo initialId="questions" />
        </Section>
        <Section title="группа B · один текстовый пресет «про цены» → редактируемое OR-описание">
          <ReplyGalleryDemo initialId="pricing" />
        </Section>
        <Section title="группа B · два пресета (хвалит + про цены) → склеенное OR-описание через «или»">
          <ReplyGalleryDemo initialId="praise" initialPrompt={mergeAudiencePrompt(["praise", "pricing"], "")} />
        </Section>
        <Section title="группа B · «Свой вариант» (пусто) → поле с плейсхолдером">
          <ReplyGalleryDemo initialId="custom" />
        </Section>

        <h2 className="mb-3 mt-8 text-h3 font-semibold">Scenario editor — «карточка-рецепт» (Wave 1)</h2>
        <Section title="POST · default · «Утренний вопрос» (sentence + condition line + Layers + stage)">
          <StepEditorDemo presetId="daily_question" />
        </Section>
        <Section title="POST · new «черновик, не сохранён» (status row + «Сохранить и включить»)">
          <StepEditorDemo presetId="daily_question" isExisting={false} />
        </Section>
        <Section title="POST · slot «Когда» open · mode = Каждый день (hour picker + jitter)">
          <StepEditorDemo presetId="daily_question" demoOpenSlot="when" override={{ when: "daily" }} />
        </Section>
        <Section title="POST · slot «Когда» open · mode = Каждый день · несколько раз в день (3 слота: 9:00 + 14:00 + 19:00)">
          <StepEditorDemo presetId="daily_question" demoOpenSlot="when" override={{ when: "daily", hours: [9, 14, 19], hour: "9:00" }} />
        </Section>
        <Section title="POST · slot «Когда» open · mode = Раз в N дней (interval stepper · «Начиная с» empty)">
          <StepEditorDemo presetId="daily_question" demoOpenSlot="when" override={{ when: "every_n_days" }} />
        </Section>
        <Section title="POST · slot «Когда» open · mode = Раз в N дней · «Начиная с» set (start-date input filled)">
          <StepEditorDemo presetId="daily_question" demoOpenSlot="when" override={{ when: "every_n_days", nDays: 5, startDate: "2026-07-01" }} />
        </Section>
        <Section title="POST · slot «Когда» open · mode = По дням недели (multi-select, default Mon–Fri)">
          <StepEditorDemo presetId="daily_question" demoOpenSlot="when" override={{ when: "weekly" }} />
        </Section>
        <Section title="POST · slot «Когда» open · mode = По дням недели · custom multi-day pick (Пн, Ср, Пт)">
          <StepEditorDemo presetId="daily_question" demoOpenSlot="when" override={{ when: "weekly", weekdays: [0, 2, 4] }} />
        </Section>
        <Section title="POST · slot «Когда» open · mode = Раз в месяц (day-of-month grid, default 1/15/31 → fallback select)">
          <StepEditorDemo presetId="daily_question" demoOpenSlot="when" override={{ when: "monthly", monthlyDays: [1, 15, 31], hour: "10:00" }} />
        </Section>
        <Section title="POST · slot «Когда» open · mode = Раз в месяц · only days ≤ 28 selected (NO fallback) + «Последний день месяца» on">
          <StepEditorDemo presetId="daily_question" demoOpenSlot="when" override={{ when: "monthly", monthlyDays: [1, 15], monthlyLastDay: true }} />
        </Section>
        <Section title="POST · slot «Когда» open · mode = Раз в год (day × month rows + «Добавить дату» + leap note)">
          <StepEditorDemo presetId="daily_question" demoOpenSlot="when" override={{ when: "yearly", yearlyDates: [{ day: 1, month: 0 }, { day: 29, month: 1 }] }} />
        </Section>
        <Section title="POST · slot «Когда» open · mode = Период дат (date range, «каждый день» in window)">
          <StepEditorDemo presetId="daily_question" demoOpenSlot="when" override={{ when: "date_range" }} />
        </Section>
        <Section title="POST · slot «Когда» open · mode = По событию (views threshold + порог)">
          <StepEditorDemo presetId="daily_question" demoOpenSlot="when" override={{ when: "event", eventKind: "on_metric_threshold" }} />
        </Section>
        <Section title="POST · slot «Когда» open · mode = По событию (круглое число подписчиков → editable milestone ladder chips)">
          <StepEditorDemo
            presetId="daily_question"
            demoOpenSlot="when"
            override={{ when: "event", eventKind: "on_follower_milestone", milestoneTargets: [100, 500, 1000, 5000, 10000] }}
          />
        </Section>
        <Section title="POST · slot «Что писать» open (instruction → modal · тема · длина · призыв · hard caption)">
          <StepEditorDemo presetId="daily_question" demoOpenSlot="what" />
        </Section>
        <Section title="POST · slot «Только если…» open · 2 active conditions + add menu">
          <StepEditorDemo presetId="daily_question" demoOpenSlot="if" override={{ condNoPostToday: true, cooldownOn: true }} />
        </Section>
        <Section title="POST · slot «Как публиковать» open · mode = Спроси меня (ask)">
          <StepEditorDemo presetId="daily_question" demoOpenSlot="how" override={{ mode: "ask" }} />
        </Section>
        <Section title="POST · slot «Как публиковать» open · mode = Публиковать автоматически (auto / warning)">
          <StepEditorDemo presetId="daily_question" demoOpenSlot="how" override={{ mode: "auto" }} />
        </Section>
        <Section title="POST · big-text modal open (instruction)">
          <StepEditorDemo presetId="daily_question" demoModal="instruction" />
        </Section>
        <Section title="POST · Layer 2 «Настроить точнее» open (conditions · time · content · baked rules)">
          <StepEditorDemo presetId="daily_question" demoLayer2 />
        </Section>
        <Section title="POST · Layer 3 open · N/A note (post scenario produces no replies → nothing to override)">
          <StepEditorDemo presetId="daily_question" demoLayer3 />
        </Section>
        <Section title="REPLY · «Дежурство» default (locked «каждые 15 минут» + who/tone slots + reply-thread stage)">
          <StepEditorDemo presetId="reply_duty" />
        </Section>
        <Section title="REPLY · slot «Кому отвечать» open (4-tile gallery)">
          <StepEditorDemo presetId="reply_duty" demoOpenSlot="who" />
        </Section>
        <Section title="REPLY · slot «Кому отвечать» open · «Свой вариант» (free text)">
          <StepEditorDemo presetId="reply_duty" demoOpenSlot="who" override={{ audience: "custom" }} />
        </Section>
        <Section title="REPLY · slot «Как звучит ответ» (тон) open">
          <StepEditorDemo presetId="reply_duty" demoOpenSlot="tone" />
        </Section>
        <Section title="REPLY · Layer 2 «Настроить точнее» open (conditions · tone)">
          <StepEditorDemo presetId="reply_duty" demoLayer2 />
        </Section>
        <Section title="REPLY · Layer 3 open · default — everything inherited from «Правила дома» (0 overrides)">
          <StepEditorDemo presetId="reply_duty" demoLayer3 />
        </Section>
        <Section title="REPLY · Layer 3 open · «Лимит ответов» overridden (slider → до 40/день); rest inherited">
          <StepEditorDemo presetId="reply_duty" demoLayer3 override={{ l3LimitOn: true, l3Limit: 40 }} />
        </Section>
        <Section title="REPLY · Layer 3 open · «Кому отвечать» overridden — «Свой вариант» (audience gallery reused)">
          <StepEditorDemo presetId="reply_duty" demoLayer3 override={{ l3WhoOn: true, audience: "custom", audiencePrompt: "тем, кто спрашивает про цену" }} />
        </Section>
        <Section title="REPLY · Layer 3 open · 3 of 4 overridden (audience · limit · quiet) → «Сбросить все»">
          <StepEditorDemo presetId="reply_duty" demoLayer3 override={{ l3WhoOn: true, audience: "fans", l3LimitOn: true, l3Limit: 60, l3QuietOn: true, l3QuietFrom: "22:00", l3QuietTo: "07:00" }} />
        </Section>
        <Section title="REPLY · on_mention · Layer 3 open · «Частота проверки» overridden (segment)">
          <StepEditorDemo presetId="on_mention" demoLayer3 override={{ l3FreqOn: true, l3Freq: "few" }} />
        </Section>
        <Section title="REPLY · on_mention «Ответ на упоминания» default (locked «когда меня упомянут» + tone slot + mention stage)">
          <StepEditorDemo presetId="on_mention" />
        </Section>
        <Section title="REPLY · on_mention — new (draft, not saved)">
          <StepEditorDemo presetId="on_mention" isExisting={false} />
        </Section>
        <Section title="REPLY · on_mention — locked «Когда меня упомянут» drawer open (reactive, no schedule)">
          <StepEditorDemo presetId="on_mention" demoOpenSlot="when" />
        </Section>
        <Section title="REPLY · on_mention — «как звучит ответ» (тон) drawer open">
          <StepEditorDemo presetId="on_mention" demoOpenSlot="tone" />
        </Section>
        <Section title="REPLY · on_mention — «отправит сам» (publish-mode auto) drawer open">
          <StepEditorDemo presetId="on_mention" demoOpenSlot="how" override={{ mode: "auto" }} />
        </Section>
        <Section title="REPLY · on_mention — Layer 2 «Настроить точнее» open (conditions · tone)">
          <StepEditorDemo presetId="on_mention" demoLayer2 />
        </Section>
        <Section title="from-template · «Акция» (promo) — reply kind, sentence prefilled">
          <StepEditorDemo presetId="promo" />
        </Section>

        <h2 className="mb-3 mt-8 text-h3 font-semibold">Boost — «Комментарий-добавка при росте поста» (Scenario-Growth-Comment v2)</h2>
        <Section title="A · standalone boost · default (target slot + metric+threshold slot + comment + boost stage)">
          <StepEditorDemo presetId="boost" override={{ boostComment: "Полный гайд по ссылке в профиле →" }} />
        </Section>
        <Section title="A · target slot open · «Ко всем моим постам» (default)">
          <StepEditorDemo presetId="boost" demoOpenSlot="target" override={{ boostTargetType: "all", boostComment: "Полный гайд по ссылке в профиле →" }} />
        </Section>
        <Section title="A · target slot open · «Постам сценария» + scenario picker">
          <StepEditorDemo presetId="boost" demoOpenSlot="target" override={{ boostTargetType: "scenario", boostScenarioId: 1, boostComment: "Полный гайд по ссылке в профиле →" }} />
        </Section>
        <Section title="A · target slot open · «Конкретному посту» + post picker">
          <StepEditorDemo presetId="boost" demoOpenSlot="target" override={{ boostTargetType: "post", boostPostId: 11, boostComment: "Полный гайд по ссылке в профиле →" }} />
        </Section>
        <Section title="A · metric+threshold slot open · Просмотры · порог 5 000 + quick presets">
          <StepEditorDemo presetId="boost" demoOpenSlot="metric" override={{ boostMetric: "views", boostThreshold: "5000", boostComment: "Полный гайд по ссылке в профиле →" }} />
        </Section>
        <Section title="A · metric+threshold slot open · Комментарии · порог 50">
          <StepEditorDemo presetId="boost" demoOpenSlot="metric" override={{ boostMetric: "comments", boostThreshold: "50", boostComment: "Полный гайд по ссылке в профиле →" }} />
        </Section>
        <Section title="A · comment big-text modal open">
          <StepEditorDemo presetId="boost" demoModal="boost" override={{ boostComment: "Полный гайд по ссылке в профиле →" }} />
        </Section>
        <Section title="A · new boost (draft, not saved)">
          <StepEditorDemo presetId="boost" isExisting={false} override={{ boostComment: "Полный гайд по ссылке в профиле →" }} />
        </Section>
        <Section title="A · Layer 2 open (target · metric+threshold · comment groups)">
          <StepEditorDemo presetId="boost" demoLayer2 override={{ boostComment: "Полный гайд по ссылке в профиле →" }} />
        </Section>
        <Section title="C · post scenario «Утренний вопрос» · Layer 2 open · «Бустер» section ON (locked «посты этого сценария»)">
          <StepEditorDemo presetId="daily_question" demoLayer2 override={{ attachBoostOn: true, attachBoostMetric: "comments", attachBoostThreshold: "50", attachBoostComment: "Полный разбор — по ссылке в профиле →" }} />
        </Section>

        <h2 className="mb-3 mt-8 text-h3 font-semibold">Unified form — per preset (legacy single-column form)</h2>
        <Section title="cadence preset · «Рубрика» (Weekly + weekday + name + format) · baked rules open">
          <FormDemo presetId="rubric" />
        </Section>
        <Section title="reactive preset · «Раскрутить залетевший» (event read-only + threshold field)">
          <FormDemo presetId="amplify_viral" />
        </Section>
        <Section title="reply duty · «Дежурство» (audience segment + how-to-answer + reply sample)">
          <FormDemo presetId="reply_duty" />
        </Section>
        <Section title="poll · «Опрос» (question + 2–4 options) · substance-gated replies">
          <FormDemo presetId="poll" />
        </Section>
        <Section title="campaign · «Акция» (preserved rich editor: ask / reward / follow-like)">
          <FormDemo presetId="promo" />
        </Section>

        <h2 className="mb-3 mt-8 text-h3 font-semibold">Preview + run-now</h2>
        <Section title="run-now result · «Черновик создан» banner + the draft (never publishes)">
          <div className="max-w-[380px]">
            <ScenarioPreview
              state="free"
              preview={{ cta: "", instruction: "Один вопрос дня в твоём голосе.", reply_instruction: "", sample_post: runDemo.text }}
              promo={BLANK_PROMO}
              whenFires={t("scenarios.fires.morning")}
              canRunNow
              running={false}
              runResult={runDemo}
              onRunNow={() => {}}
            />
          </div>
        </Section>

        <p className="mt-2 text-caption text-text-subtle">{t("scenarios.subtitle")}</p>
      </div>
    </div>
  );
}
