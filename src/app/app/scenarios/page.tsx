"use client";

// Scenarios (/app/scenarios) — recurring content in the author's voice. Rebuilt
// 1:1 to the new Scenarios-{WEB,Mobile}-SPEC. ONE page, TWO views: the LIST and
// the ONE UNIFIED FORM (the old 4-template picker + separate «Свой» editor are
// gone). The model is КОГДА (schedule) → ИНСТРУКЦИЯ → [КАК ОТВЕЧАТЬ].
//
// The form has two states, switched by the promo-helper disclosure:
//   • helper ON  → the preserved «Акция» editor (ask/reward/follow/like) — the
//                  server assembles instruction + reply from these. Sends
//                  `{ promo }`.
//   • helper OFF → a free «Инструкция» textarea (the heart). Sends
//                  `{ trigger, instruction, reply_instruction }`.
// Neither path sends `template` — it's resolved server-side as provenance.
// Opening an existing scenario: `structured` present → helper ON & filled; else
// → helper OFF with the free instruction (fixes the old bug that forced the
// promo editor open for every scenario). Tester-gated, OFF by default.

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  ApiError,
  clearTokens,
  createScenario,
  deleteScenario,
  fetchScenarios,
  fetchMe,
  getTokens,
  previewScenario,
  setScenarioEnabled,
  updateScenario,
} from "@/lib/api";
import { useSelectedAccountId } from "@/lib/account";
import { useTranslation, type MessageKey } from "@/lib/i18n";
import { useTesterGuard } from "@/lib/tester";
import { cn } from "@/lib/cn";
import { AppTopbar, TopbarPill } from "@/components/AppTopbar";
import { Button } from "@/components/ui/button";
import { Toast, ToastHost } from "@/components/ui/toast";
import { IcArrowLeft, IcCheck, IcPlus, IcTrash } from "@/components/icons";
import { TweaksPanel, TweakSection, TweakToggle, TweakRadio, useTweaks } from "@/components/tweaks/TweaksPanel";
import {
  CardTitle,
  DeleteConfirm,
  Field,
  FormCard,
  INPUT,
  type Preset,
  PresetBar,
  PowerUserDisclosure,
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
import { BLANK_PROMO, DEMO_SCENARIOS, SCENARIOS_TWEAK_DEFAULTS } from "@/components/studio/scenarios-demo";
import type { Scenario, ScenarioPreview as ScenarioPreviewT, ScenarioPromoFields } from "@/lib/types";

const IS_DEV = process.env.NODE_ENV === "development";

type ToastT = { id: number; message: string; tone: "success" | "error" };
type View = "list" | "editor";

// Raw trigger_cfg from the schedule choice — the two kinds the worker supports.
function triggerFromSchedule(schedule: ScenarioPromoFields["schedule"], nDays: number): Record<string, unknown> {
  return schedule === "every_n_days" ? { kind: "every_n_days", n: nDays } : { kind: "daily_first_post" };
}

function scheduleFromTrigger(s: Scenario): { schedule: ScenarioPromoFields["schedule"]; nDays: number } {
  const kind = (s.trigger_cfg?.kind as string) || "";
  if (kind === "every_n_days") return { schedule: "every_n_days", nDays: (s.trigger_cfg?.n as number) ?? 3 };
  return { schedule: "daily", nDays: 3 };
}

export default function ScenariosPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [demoParam] = useState(() =>
    typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("demo") === "1" : false,
  );
  const { checking } = useTesterGuard(demoParam);
  const [isTester, setIsTester] = useState(false);
  const allow = demoParam && (IS_DEV || isTester);
  const demoOn = allow;
  const accountId = useSelectedAccountId();

  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);

  const [view, setView] = useState<View>("list");
  const [editing, setEditing] = useState<Scenario | null>(null); // null = new

  // ── unified-form state ──
  const [name, setName] = useState("");
  const [helperOn, setHelperOn] = useState(false); // promo-helper disclosure
  const [promo, setPromo] = useState<ScenarioPromoFields>(BLANK_PROMO);
  const [instruction, setInstruction] = useState(""); // free instruction (heart)
  const [replyInstruction, setReplyInstruction] = useState("");
  const [schedule, setSchedule] = useState<ScenarioPromoFields["schedule"]>("daily");
  const [nDays, setNDays] = useState(3);
  const [powerOpen, setPowerOpen] = useState(false);
  const [preview, setPreview] = useState<ScenarioPreviewT | null>(null);

  const [saving, setSaving] = useState(false);
  const [nameErr, setNameErr] = useState(false);
  const [askErr, setAskErr] = useState(false);
  const [saveErr, setSaveErr] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false); // phone bottom-sheet
  const [confirmInline, setConfirmInline] = useState(false); // desktop inline confirm
  const [deleting, setDeleting] = useState(false);
  const [toasts, setToasts] = useState<ToastT[]>([]);

  const [tw, setTw] = useTweaks(SCENARIOS_TWEAK_DEFAULTS);

  function toast(message: string, tone: ToastT["tone"] = "success") {
    const id = Date.now() + Math.random();
    setToasts((s) => [...s, { id, message, tone }]);
    setTimeout(() => setToasts((s) => s.filter((x) => x.id !== id)), 3500);
  }

  // ── load ──
  useEffect(() => {
    if (demoParam) return;
    if (!getTokens()) return;
    fetchMe().then((m) => setIsTester(m.is_tester === true)).catch(() => {});
  }, [demoParam]);

  function load(id: number) {
    setLoaded(false);
    fetchScenarios(id)
      .then((r) => setScenarios(r.scenarios))
      .catch((e) => {
        if (e instanceof ApiError && e.status === 401) {
          clearTokens();
          router.push("/app/login");
          return;
        }
        setBootError(String(e));
      })
      .finally(() => setLoaded(true));
  }

  useEffect(() => {
    if (demoParam) return;
    if (accountId === null) return;
    load(accountId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId, demoParam]);

  // demo state machine
  useEffect(() => {
    if (!demoOn) return;
    document.documentElement.classList.toggle("dark", !!tw.dark);
    const st = tw.state;
    setBootError(st === "Error" ? "TypeError: Load failed" : null);
    setLoaded(st !== "Loading");
    setScenarios(st === "Empty" ? [] : DEMO_SCENARIOS);
  }, [demoOn, tw.dark, tw.state]);

  // ── live preview (debounced) — promo helper sends `{promo}`, free sends
  // `{instruction}`. The server assembles the CTA / mock post. ──
  useEffect(() => {
    if (view !== "editor") return;
    if (helperOn) {
      if (!promo.ask.trim() || !promo.reward.trim()) {
        setPreview(null);
        return;
      }
      if (demoOn || accountId === null) {
        setPreview({
          cta: `Напишите в комментариях «${promo.ask}» — и ${promo.reward}.`,
          instruction: "",
          reply_instruction: promo.reply_instruction,
          sample_post: "",
        });
        return;
      }
      const id = setTimeout(() => {
        previewScenario(accountId, { promo }).then(setPreview).catch(() => {});
      }, 500);
      return () => clearTimeout(id);
    }
    // free
    if (!instruction.trim()) {
      setPreview(null);
      return;
    }
    if (demoOn || accountId === null) {
      setPreview({ cta: "", instruction: instruction.trim(), reply_instruction: "", sample_post: demoSamplePost(instruction) });
      return;
    }
    const id = setTimeout(() => {
      previewScenario(accountId, { instruction }).then(setPreview).catch(() => {});
    }, 500);
    return () => clearTimeout(id);
  }, [view, helperOn, promo, instruction, demoOn, accountId]);

  const activeCount = useMemo(() => scenarios.filter((s) => s.enabled).length, [scenarios]);
  const previewState: PreviewState = helperOn
    ? promo.ask.trim() && promo.reward.trim()
      ? "promo"
      : "empty"
    : instruction.trim()
      ? "free"
      : "empty";

  // ── editor open / close ──
  function resetForm() {
    setName("");
    setHelperOn(false);
    setPromo(BLANK_PROMO);
    setInstruction("");
    setReplyInstruction("");
    setSchedule("daily");
    setNDays(3);
    setPowerOpen(false);
    setPreview(null);
    setNameErr(false);
    setAskErr(false);
    setSaveErr(false);
    setConfirmInline(false);
  }

  function openNew() {
    setEditing(null);
    resetForm();
    setView("editor");
  }

  function applyPreset(p: Preset) {
    if (p !== "promo") return; // only «Акция» is live
    setHelperOn(true);
    setPromo({ ...BLANK_PROMO });
  }

  function openEditor(s: Scenario) {
    setEditing(s);
    setName(s.name);
    const usePromo = s.structured != null;
    setHelperOn(usePromo);
    if (usePromo && s.structured) {
      setPromo(s.structured);
      setSchedule(s.structured.schedule);
      setNDays(s.structured.n_days);
      setReplyInstruction(s.structured.reply_instruction);
      setInstruction("");
    } else {
      setPromo(BLANK_PROMO);
      const sched = scheduleFromTrigger(s);
      setSchedule(sched.schedule);
      setNDays(sched.nDays);
      setInstruction(s.instruction);
      setReplyInstruction(s.reply_instruction);
    }
    setPowerOpen(false);
    setNameErr(false);
    setAskErr(false);
    setSaveErr(false);
    setConfirmInline(false);
    setPreview(null);
    setView("editor");
  }

  function backToList() {
    setView("list");
    setEditing(null);
  }

  // Keep the promo schedule in sync with the shared schedule segment while the
  // helper is on (the promo body carries its own schedule/n_days).
  function onSchedule(v: ScenarioPromoFields["schedule"]) {
    setSchedule(v);
    if (helperOn) setPromo((p) => ({ ...p, schedule: v }));
  }
  function onNDays(n: number) {
    setNDays(n);
    if (helperOn) setPromo((p) => ({ ...p, n_days: n }));
  }
  // Toggling the helper: when turning it on, seed its schedule from the segment;
  // its reply_instruction shares the «Как отвечать» textarea below.
  function onHelperToggle(on: boolean) {
    setHelperOn(on);
    if (on) setPromo((p) => ({ ...p, schedule, n_days: nDays, reply_instruction: replyInstruction }));
    setSaveErr(false);
    setAskErr(false);
  }

  async function toggle(s: Scenario, on: boolean) {
    setScenarios((xs) => xs.map((x) => (x.id === s.id ? { ...x, enabled: on } : x)));
    if (demoOn) return;
    try {
      await setScenarioEnabled(s.id, on);
      toast(on ? t("scenarios.toast_on") : t("scenarios.toast_off"));
    } catch (e) {
      setScenarios((xs) => xs.map((x) => (x.id === s.id ? { ...x, enabled: !on } : x)));
      toast(String(e), "error");
    }
  }

  // Build the request body on the ONE fork (promo present, or not). NEVER sends
  // `template`. Reply instruction is shared between both forks.
  function buildBody(): {
    name: string;
    promo?: ScenarioPromoFields;
    trigger?: Record<string, unknown>;
    instruction?: string;
    reply_instruction?: string;
  } {
    if (helperOn) {
      return { name: name.trim(), promo: { ...promo, schedule, n_days: nDays, reply_instruction: replyInstruction } };
    }
    return {
      name: name.trim(),
      trigger: triggerFromSchedule(schedule, nDays),
      instruction: instruction.trim(),
      reply_instruction: replyInstruction.trim(),
    };
  }

  async function save(enable: boolean) {
    setSaveErr(false);
    let bad = false;
    if (!name.trim()) {
      setNameErr(true);
      bad = true;
    }
    if (helperOn && !promo.ask.trim()) {
      setAskErr(true);
      bad = true;
    }
    if (bad) {
      setSaveErr(true);
      return;
    }
    if (demoOn) {
      toast(enable ? t("scenarios.toast_on") : t("scenarios.toast_saved"));
      backToList();
      return;
    }
    if (accountId === null) return;
    setSaving(true);
    try {
      const body = buildBody();
      let saved: Scenario;
      if (editing) {
        saved = await updateScenario(editing.id, { ...body, ...(enable ? { enabled: true } : {}) });
        setScenarios((xs) => xs.map((x) => (x.id === saved.id ? saved : x)));
      } else {
        saved = await createScenario(accountId, { ...body, enabled: enable });
        setScenarios((xs) => [...xs, saved]);
      }
      toast(enable ? t("scenarios.toast_on") : t("scenarios.toast_saved"));
      backToList();
    } catch (e) {
      setSaveErr(true);
      toast(String(e), "error");
    } finally {
      setSaving(false);
    }
  }

  async function doDelete() {
    if (!editing) {
      setDeleteOpen(false);
      setConfirmInline(false);
      return;
    }
    if (demoOn) {
      setScenarios((xs) => xs.filter((x) => x.id !== editing.id));
      setDeleteOpen(false);
      setConfirmInline(false);
      backToList();
      toast(t("scenarios.toast_deleted"));
      return;
    }
    setDeleting(true);
    try {
      await deleteScenario(editing.id);
      setScenarios((xs) => xs.filter((x) => x.id !== editing.id));
      setDeleteOpen(false);
      setConfirmInline(false);
      backToList();
      toast(t("scenarios.toast_deleted"));
    } catch (e) {
      toast(String(e), "error");
    } finally {
      setDeleting(false);
    }
  }

  if (checking) return null;

  if (bootError && view === "list") {
    return (
      <div className="min-h-screen bg-bg text-text">
        <AppTopbar maxW="960px" title={t("scenarios.title")} />
        <main className="mx-auto max-w-[960px] px-3.5 pt-4 md:px-6 md:pt-7">
          <ScenariosError onRetry={() => (accountId !== null ? load(accountId) : undefined)} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-text">
      <AppTopbar
        maxW="960px"
        title={t("scenarios.title")}
        pill={
          activeCount > 0 ? (
            <TopbarPill tone="success">{t("scenarios.active").replace("{n}", String(activeCount))}</TopbarPill>
          ) : undefined
        }
        actions={
          view === "list" ? (
            <Button size="sm" onClick={openNew} icon={<IcPlus size={15} />} className="max-sm:px-2.5">
              <span className="max-sm:hidden">{t("scenarios.new")}</span>
            </Button>
          ) : undefined
        }
      />
      <main className="mx-auto max-w-[960px] space-y-4 px-3.5 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-4 md:space-y-5 md:px-6 md:pb-24 md:pt-7">
        {view === "list" && (
          <div className="flex flex-col gap-1">
            <h1 className="text-h1 font-semibold tracking-tight">{t("scenarios.title")}</h1>
            <p className="max-w-[60ch] text-small text-text-muted">{t("scenarios.subtitle")}</p>
          </div>
        )}

        {view === "editor" ? (
          <EditorView
            t={t}
            isExisting={!!editing}
            name={name}
            setName={setName}
            nameErr={nameErr}
            helperOn={helperOn}
            promo={promo}
            askErr={askErr}
            onHelperToggle={onHelperToggle}
            onPromo={setPromo}
            instruction={instruction}
            setInstruction={setInstruction}
            replyInstruction={replyInstruction}
            setReplyInstruction={(v) => {
              setReplyInstruction(v);
              if (helperOn) setPromo((p) => ({ ...p, reply_instruction: v }));
            }}
            schedule={schedule}
            nDays={nDays}
            onSchedule={onSchedule}
            onNDays={onNDays}
            powerOpen={powerOpen}
            onPowerToggle={() => setPowerOpen((o) => !o)}
            previewState={previewState}
            preview={preview}
            saving={saving}
            saveErr={saveErr}
            confirmInline={confirmInline}
            onApplyPreset={applyPreset}
            onBack={backToList}
            onSave={() => save(false)}
            onSaveOn={() => save(true)}
            onDeleteDesktop={() => setConfirmInline(true)}
            onDeleteMobile={() => setDeleteOpen(true)}
            onCancelInline={() => setConfirmInline(false)}
            onConfirmInline={doDelete}
            deleting={deleting}
          />
        ) : !loaded ? (
          <div className="space-y-3">
            <ScenarioSkeleton />
            <ScenarioSkeleton />
            <ScenarioSkeleton />
          </div>
        ) : scenarios.length === 0 ? (
          <ScenariosEmpty
            onCreate={openNew}
            onPreset={(p) => {
              openNew();
              applyPreset(p);
            }}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {scenarios.map((s) => (
              <ScenarioCard key={s.id} s={s} onToggle={toggle} onOpen={openEditor} />
            ))}
          </div>
        )}
      </main>

      <DeleteConfirm open={deleteOpen} deleting={deleting} onClose={() => setDeleteOpen(false)} onConfirm={doDelete} />

      <ToastHost>
        {toasts.map((to) => (
          <Toast key={to.id} tone={to.tone} title={to.message} />
        ))}
      </ToastHost>

      {allow && (
        <TweaksPanel title="Scenarios">
          <TweakSection label="Appearance" />
          <TweakToggle label="Dark mode" value={tw.dark} onChange={(v) => setTw("dark", v)} />
          <TweakSection label="State" />
          <TweakRadio label="State" value={tw.state} options={["List", "Empty", "Loading", "Error"]} onChange={(v) => setTw("state", v)} />
        </TweaksPanel>
      )}
    </div>
  );
}

// A tiny client-side sample post for the demo/offline free preview.
function demoSamplePost(instruction: string): string {
  return `Пример поста по инструкции: ${instruction.trim()}`;
}

// ── the ONE unified form (fields + sticky preview) ──
function EditorView({
  t,
  isExisting,
  name,
  setName,
  nameErr,
  helperOn,
  promo,
  askErr,
  onHelperToggle,
  onPromo,
  instruction,
  setInstruction,
  replyInstruction,
  setReplyInstruction,
  schedule,
  nDays,
  onSchedule,
  onNDays,
  powerOpen,
  onPowerToggle,
  previewState,
  preview,
  saving,
  saveErr,
  confirmInline,
  onApplyPreset,
  onBack,
  onSave,
  onSaveOn,
  onDeleteDesktop,
  onDeleteMobile,
  onCancelInline,
  onConfirmInline,
  deleting,
}: {
  t: (k: MessageKey) => string;
  isExisting: boolean;
  name: string;
  setName: (v: string) => void;
  nameErr: boolean;
  helperOn: boolean;
  promo: ScenarioPromoFields;
  askErr: boolean;
  onHelperToggle: (on: boolean) => void;
  onPromo: (p: ScenarioPromoFields) => void;
  instruction: string;
  setInstruction: (v: string) => void;
  replyInstruction: string;
  setReplyInstruction: (v: string) => void;
  schedule: ScenarioPromoFields["schedule"];
  nDays: number;
  onSchedule: (v: ScenarioPromoFields["schedule"]) => void;
  onNDays: (n: number) => void;
  powerOpen: boolean;
  onPowerToggle: () => void;
  previewState: PreviewState;
  preview: ScenarioPreviewT | null;
  saving: boolean;
  saveErr: boolean;
  confirmInline: boolean;
  onApplyPreset: (p: Preset) => void;
  onBack: () => void;
  onSave: () => void;
  onSaveOn: () => void;
  onDeleteDesktop: () => void;
  onDeleteMobile: () => void;
  onCancelInline: () => void;
  onConfirmInline: () => void;
  deleting: boolean;
}) {
  return (
    <div className="space-y-4">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-small text-text-muted hover:text-text">
        <IcArrowLeft size={16} /> {t("scenarios.back")}
      </button>

      {/* preset bar — only for a NEW scenario */}
      {!isExisting && <PresetBar onPick={onApplyPreset} />}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-[minmax(0,1fr)_380px] md:items-start">
        {/* form column */}
        <div className="space-y-4 md:space-y-5">
          {/* name */}
          <FormCard>
            <Field label={t("scenarios.f.name")} error={nameErr ? t("scenarios.err_required") : undefined}>
              <input
                className={cn(INPUT, nameErr && "border-danger focus:border-danger focus:ring-danger/25")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("scenarios.f.name_ph")}
              />
            </Field>
          </FormCard>

          {/* КОГДА — schedule */}
          <FormCard>
            <CardTitle title={t("scenarios.sec.schedule")} sub={t("scenarios.sec.schedule_sub")} />
            <ScheduleSegment value={schedule} nDays={nDays} onChange={onSchedule} onNDays={onNDays} />
          </FormCard>

          {/* ИНСТРУКЦИЯ — promo helper OR free instruction */}
          <FormCard>
            <CardTitle title={t("scenarios.sec.generate")} sub={t("scenarios.sec.generate_sub")} />
            <div className="space-y-4">
              <PromoHelper on={helperOn} promo={promo} askErr={askErr} onToggle={onHelperToggle} onChange={onPromo} />
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

          {/* КАК ОТВЕЧАТЬ — reply instruction */}
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
              <textarea
                rows={3}
                className={TEXTAREA}
                value={replyInstruction}
                onChange={(e) => setReplyInstruction(e.target.value)}
                placeholder={t("scenarios.f.reply_ph")}
              />
            </Field>
          </FormCard>

          {/* power-user disclosure */}
          <PowerUserDisclosure open={powerOpen} onToggle={onPowerToggle} instruction={instruction} onInstruction={setInstruction} />
        </div>

        {/* sticky live preview */}
        <aside className="md:sticky md:top-4 md:self-start">
          <ScenarioPreview state={previewState} preview={preview} promo={promo} />
        </aside>
      </div>

      {/* save error banner */}
      {saveErr && (
        <div className="flex items-start gap-3 rounded-lg border border-danger/30 bg-danger/[0.07] p-4">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-danger/12 text-danger">
            <IcTrash size={18} className="rotate-45" />
          </span>
          <div className="min-w-0">
            <p className="text-small font-semibold text-text">{t("scenarios.save_error")}</p>
            <p className="mt-0.5 text-caption leading-relaxed text-text-muted">{t("scenarios.save_error_sub")}</p>
          </div>
        </div>
      )}

      {/* action bar */}
      <FormCard>
        <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">
          <Button variant="secondary" onClick={onSave} loading={saving} className="max-sm:w-full">
            {t("scenarios.save")}
          </Button>
          <Button variant="primary" onClick={onSaveOn} loading={saving} icon={<IcCheck size={15} />} className="max-sm:w-full">
            {t("scenarios.save_on")}
          </Button>
          {isExisting && (
            <>
              {/* desktop: inline confirm. phone: opens the bottom sheet. */}
              <button
                onClick={onDeleteDesktop}
                className="inline-flex items-center gap-1.5 text-small font-medium text-text-muted hover:text-danger max-sm:hidden sm:ml-auto"
              >
                <IcTrash size={15} /> {t("scenarios.delete")}
              </button>
              <button
                onClick={onDeleteMobile}
                className="inline-flex items-center justify-center gap-1.5 py-2 text-small font-medium text-danger sm:hidden"
              >
                <IcTrash size={15} /> {t("scenarios.delete")}
              </button>
            </>
          )}
        </div>
        {confirmInline && (
          <div className="mt-3.5 flex flex-wrap items-center gap-2.5 border-t border-border pt-3.5 max-sm:hidden">
            <span className="flex-1 text-small font-medium text-text">{t("scenarios.delete_confirm_inline")}</span>
            <Button size="sm" variant="ghost" onClick={onCancelInline} disabled={deleting}>
              {t("common.cancel")}
            </Button>
            <Button size="sm" variant="danger" loading={deleting} onClick={onConfirmInline}>
              {t("scenarios.delete")}
            </Button>
          </div>
        )}
      </FormCard>
    </div>
  );
}
