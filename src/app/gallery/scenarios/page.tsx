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
  AutopostOffBanner,
  BakedRules,
  CardTitle,
  ControlCenterHeader,
  DiscoveryGallery,
  Field,
  FormCard,
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
  StackingWarnings,
  TEXTAREA,
  WhenSegment,
  type WhenMode,
  whenModeFromCfg,
  eventKindOf,
} from "@/components/studio/ScenariosParts";
import {
  BAKED_RULE_KEYS,
  type FormState,
  interpolate,
  visibleFields,
} from "@/components/studio/scenarios-form";
import { BLANK_PROMO, DEMO_CATALOG, DEMO_PRESETS, DEMO_PROMO, DEMO_SCENARIOS, PROMO_PRESET } from "@/components/studio/scenarios-demo";
import { useTranslation, type MessageKey } from "@/lib/i18n";
import { cn } from "@/lib/cn";
import type { ScenarioPreset, ScenarioPreview as ScenarioPreviewT } from "@/lib/types";

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
      when: presetId === "rubric" ? "weekly" : when0,
      nDays: 3,
      weekday: 0,
      dateFrom: "",
      dateTo: "",
      threshold: "",
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
              weekday={form.weekday}
              dateFrom={form.dateFrom}
              dateTo={form.dateTo}
              threshold={form.threshold}
              locked={isReactive}
              eventKind={eventKind}
              onMode={(m) => up({ when: m })}
              onNDays={(n) => up({ nDays: n })}
              onWeekday={(d) => up({ weekday: d })}
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

export default function ScenariosGallery() {
  const { t } = useTranslation();
  const [dark, setDark] = useState(false);
  const catalog = useMemo(() => [...DEMO_PRESETS, PROMO_PRESET], []);
  function toggleDark() {
    document.documentElement.classList.toggle("dark");
    setDark((d) => !d);
  }
  const morningNames = DEMO_SCENARIOS.filter((s) => s.enabled && (s.action_cfg?.kind as string) !== "reply_policy").map((s) => s.name);

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

        <h2 className="mb-3 text-h3 font-semibold">Discovery — preset gallery</h2>
        <Section title="grouped by nature · starter-set · campaign gated · from-scratch">
          <DiscoveryGallery presets={catalog} onPick={() => {}} onStarter={() => {}} onScratch={() => {}} />
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
        <Section title="stacking warning (names victims) + autopost-off banner">
          <div className="flex flex-col gap-3">
            <StackingWarnings morningCount={morningNames.length} morningNames={morningNames} promoDaily cap={1} />
            <AutopostOffBanner onEnable={() => {}} />
          </div>
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

        <h2 className="mb-3 mt-8 text-h3 font-semibold">Unified form — per preset</h2>
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
