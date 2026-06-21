"use client";

// State gallery for Scenarios (/app/scenarios) — renders the REAL components in
// every state with NO auth / NO backend, for self-verification against
// Scenarios-{WEB,Mobile}-SPEC. Lives under /gallery (404 in prod). Drives the
// new unified-form model: list (default/empty/loading/error) · form promo-ON ·
// form promo-OFF · power-user disclosure expanded · edit-existing-promo ·
// edit-existing-free. All inputs are wired to local state so a real click /
// type works without the backend.

import { useState, type ReactNode } from "react";

import {
  CardTitle,
  Field,
  FormCard,
  INPUT,
  PowerUserDisclosure,
  PresetBar,
  PromoHelper,
  ScenarioCard,
  ScenarioPreview,
  type PreviewState,
  ScenarioSkeleton,
  ScenariosEmpty,
  ScenariosError,
  ScheduleSegment,
  TEXTAREA,
} from "@/components/studio/ScenariosParts";
import { BLANK_PROMO, DEMO_PROMO, DEMO_SCENARIOS } from "@/components/studio/scenarios-demo";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/cn";
import type { ScenarioPreview as ScenarioPreviewT, ScenarioPromoFields } from "@/lib/types";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-7">
      <h3 className="mb-2 font-mono text-caption uppercase tracking-wide text-text-subtle">{title}</h3>
      <div className="rounded-lg border border-border bg-bg p-4">{children}</div>
    </section>
  );
}

const PROMO_PREVIEW: ScenarioPreviewT = {
  cta: "Напишите в комментариях «свою дату рождения» — и я пришлю короткий мини-разбор прямо в ответ. Подпишитесь, чтобы не потерять свой.",
  instruction: "",
  reply_instruction: DEMO_PROMO.reply_instruction,
  sample_post: "",
};
const FREE_PREVIEW: ScenarioPreviewT = {
  cta: "",
  instruction: "Вытяни одну карту дня. 2–3 предложения трактовки простыми словами и один практический совет на день.",
  reply_instruction: "",
  sample_post:
    "Карта дня — Восьмёрка Жезлов 🔥 День ускоряется: то, что вы откладывали, наконец сдвинется. Совет дня: ответьте на одно письмо, которое давно избегаете.",
};

// A self-contained copy of the unified-form layout that wires the real parts to
// local state — mirrors EditorView in the live page (which is private).
function FormDemo({
  existing,
  initialHelperOn,
  powerOpen: powerOpenInit = false,
}: {
  existing: boolean;
  initialHelperOn: boolean;
  powerOpen?: boolean;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState(existing ? (initialHelperOn ? "Мини-разбор по дате рождения" : "Карта дня по будням") : "");
  const [helperOn, setHelperOn] = useState(initialHelperOn);
  const [promo, setPromo] = useState<ScenarioPromoFields>(initialHelperOn ? DEMO_PROMO : BLANK_PROMO);
  const [instruction, setInstruction] = useState(initialHelperOn ? "" : existing ? FREE_PREVIEW.instruction : "");
  const [reply, setReply] = useState(initialHelperOn ? DEMO_PROMO.reply_instruction : "");
  const [schedule, setSchedule] = useState<ScenarioPromoFields["schedule"]>(initialHelperOn ? DEMO_PROMO.schedule : "every_n_days");
  const [nDays, setNDays] = useState(initialHelperOn ? DEMO_PROMO.n_days : 1);
  const [powerOpen, setPowerOpen] = useState(powerOpenInit);

  const previewState: PreviewState = helperOn
    ? promo.ask.trim() && promo.reward.trim()
      ? "promo"
      : "empty"
    : instruction.trim()
      ? "free"
      : "empty";
  const preview = helperOn ? PROMO_PREVIEW : FREE_PREVIEW;

  return (
    <div className="space-y-4">
      {!existing && <PresetBar onPick={(p) => p === "promo" && (setHelperOn(true), setPromo({ ...BLANK_PROMO }))} />}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-[minmax(0,1fr)_380px] md:items-start">
        <div className="space-y-4 md:space-y-5">
          <FormCard>
            <Field label={t("scenarios.f.name")}>
              <input className={INPUT} value={name} onChange={(e) => setName(e.target.value)} placeholder={t("scenarios.f.name_ph")} />
            </Field>
          </FormCard>
          <FormCard>
            <CardTitle title={t("scenarios.sec.schedule")} sub={t("scenarios.sec.schedule_sub")} />
            <ScheduleSegment value={schedule} nDays={nDays} onChange={setSchedule} onNDays={setNDays} />
          </FormCard>
          <FormCard>
            <CardTitle title={t("scenarios.sec.generate")} sub={t("scenarios.sec.generate_sub")} />
            <div className="space-y-4">
              <PromoHelper on={helperOn} promo={promo} onToggle={setHelperOn} onChange={setPromo} />
              {!helperOn && (
                <Field label={t("scenarios.f.instruction")} hint={t("scenarios.f.instruction_hint")}>
                  <textarea
                    rows={5}
                    className={cn(TEXTAREA, "min-h-[132px]")}
                    value={instruction}
                    onChange={(e) => setInstruction(e.target.value)}
                    placeholder={t("scenarios.f.instruction_ph")}
                  />
                </Field>
              )}
            </div>
          </FormCard>
          <FormCard>
            <div className="mb-4">
              <h2 className="flex flex-wrap items-center gap-2 text-h3 font-semibold tracking-tight">
                {t("scenarios.sec.reply")}
                {helperOn && (
                  <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-caption font-medium text-accent">
                    {t("scenarios.helper_filled")}
                  </span>
                )}
              </h2>
              <p className="mt-1 text-small leading-relaxed text-text-subtle">{t("scenarios.sec.reply_sub")}</p>
            </div>
            <Field label={t("scenarios.sec.reply")} hint={t("scenarios.f.reply_hint")}>
              <textarea rows={3} className={TEXTAREA} value={reply} onChange={(e) => setReply(e.target.value)} placeholder={t("scenarios.f.reply_ph")} />
            </Field>
          </FormCard>
          <PowerUserDisclosure open={powerOpen} onToggle={() => setPowerOpen((o) => !o)} instruction={instruction} onInstruction={setInstruction} />
        </div>
        <aside className="md:sticky md:top-4 md:self-start">
          <ScenarioPreview state={previewState} preview={preview} promo={promo} />
        </aside>
      </div>
    </div>
  );
}

export default function ScenariosGallery() {
  const { t } = useTranslation();
  const [dark, setDark] = useState(false);
  function toggleDark() {
    document.documentElement.classList.toggle("dark");
    setDark((d) => !d);
  }

  return (
    <div className="min-h-screen bg-bg p-6 text-text">
      <div className="mx-auto max-w-[960px]">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-h2 font-semibold">Scenarios — state gallery</h1>
            <p className="text-caption text-text-subtle">
              dev-only · real components, no backend · compare to Scenarios-WEB-SPEC.html
            </p>
          </div>
          <button
            type="button"
            onClick={toggleDark}
            className="shrink-0 rounded-md border border-border px-3 py-1.5 text-small transition-colors hover:bg-surface-2"
          >
            {dark ? "Light" : "Dark"}
          </button>
        </header>

        <h2 className="mb-3 text-h3 font-semibold">List</h2>
        <Section title="default · cards with provenance (Акция / when:…), on + off, runs">
          <div className="flex flex-col gap-3">
            {DEMO_SCENARIOS.map((s) => (
              <ScenarioCard key={s.id} s={s} onToggle={() => {}} onOpen={() => {}} />
            ))}
          </div>
        </Section>
        <Section title="empty · model explainer + preset chips + «Create» + «or from scratch»">
          <ScenariosEmpty onCreate={() => {}} onPreset={() => {}} />
        </Section>
        <Section title="loading · skeleton cards mirroring the layout">
          <div className="flex flex-col gap-3">
            <ScenarioSkeleton />
            <ScenarioSkeleton />
            <ScenarioSkeleton />
          </div>
        </Section>
        <Section title="error · inline banner + Retry">
          <ScenariosError onRetry={() => {}} />
        </Section>

        <h2 className="mb-3 mt-8 text-h3 font-semibold">Unified form — new scenario</h2>
        <Section title="промо-помощник ВКЛ · preserved «Акция» editor + CTA/post/reply preview">
          <FormDemo existing={false} initialHelperOn />
        </Section>
        <Section title="промо-помощник ВЫКЛ · free «Инструкция» textarea + instruction/post preview">
          <FormDemo existing={false} initialHelperOn={false} />
        </Section>
        <Section title="power-user disclosure expanded · raw КОГДА/ЕСЛИ/СГЕНЕРИРОВАТЬ/С ИНСТРУКЦИЕЙ">
          <FormDemo existing={false} initialHelperOn={false} powerOpen />
        </Section>

        <h2 className="mb-3 mt-8 text-h3 font-semibold">Edit existing</h2>
        <Section title="edit promo · helper open & filled, no preset bar">
          <FormDemo existing initialHelperOn />
        </Section>
        <Section title="edit free · helper closed, free instruction filled, no preset bar">
          <FormDemo existing initialHelperOn={false} />
        </Section>

        <p className="mt-2 text-caption text-text-subtle">{t("scenarios.subtitle")}</p>
      </div>
    </div>
  );
}
