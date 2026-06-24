"use client";

// Scenarios (/app/scenarios) — the «рутинный автопилот». Rebuilt 1:1 to the new
// Scenarios-{WEB,Mobile}-SPEC. ONE page, THREE views:
//   • DISCOVERY — the preset gallery (4 groups, sorted by impact, no «soon», no
//                 «Свой»). Also the empty state. Starter-set + from-scratch.
//   • CONTROL CENTER — the list: per-day cap, week strip, stacking warnings,
//                 «автопостинг выключен», skips, cross-account «Применить к…».
//   • EDITOR — the ONE unified form, pre-filled by the chosen preset: Name ·
//                 КОГДА (5 modes) · что вы задаёте (1–2 fields) · что зашьётся ·
//                 [как отвечать] · «Показать как сценарий» · sticky preview +
//                 «Прогнать сейчас» (draft only).
//
// A scenario compiles to ONE of: { promo } · { reply_policy, reply_instruction }
// · { trigger, instruction, reply_instruction?, condition? }. NEVER sends
// `template`. Tester-gated, OFF by default.

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  ApiError,
  clearTokens,
  createScenario,
  deleteScenario,
  fetchAutopilot,
  fetchMe,
  fetchMyAccounts,
  fetchScenarioPresets,
  fetchScenarios,
  getTokens,
  previewScenario,
  runScenarioNow,
  setScenarioEnabled,
  updateAutopilot,
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
  AutopostOffBanner,
  BakedRules,
  CardTitle,
  ControlCenterHeader,
  DeleteConfirm,
  EnableConfirm,
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
  presetProducesReplies,
  whenModeFromCfg,
  eventKindOf,
} from "@/components/studio/ScenariosParts";
import {
  BAKED_RULE_KEYS,
  compileBody,
  type FormState,
  interpolate,
  visibleFields,
} from "@/components/studio/scenarios-form";
import {
  BLANK_PROMO,
  DEMO_CATALOG,
  PROMO_PRESET,
  SCENARIOS_TWEAK_DEFAULTS,
} from "@/components/studio/scenarios-demo";
import { DEMO_CC, DEMO_CREATOR, presetSentence, presetSkel } from "@/components/studio/scenarios-presentation";
import { LivingSentence, Skeleton3, type PublishMode } from "@/components/studio/scenarios-living";
import { FirstRun, GalleryScreen, MoreSettings } from "@/components/studio/scenarios-screens";
import type {
  ConnectedAccount,
  Scenario,
  ScenarioPreset,
  ScenarioPreview as ScenarioPreviewT,
  ScenarioPromoFields,
  ScenarioRunNow,
} from "@/lib/types";

const IS_DEV = process.env.NODE_ENV === "development";

type ToastT = { id: number; message: string; tone: "success" | "error" };
type View = "list" | "discovery" | "editor";

// A fresh form state for a chosen preset (or null = from scratch / promo).
function freshForm(preset: ScenarioPreset | null, t: (k: MessageKey) => string): FormState {
  const isPromo = preset?.id === "promo";
  const when: WhenMode = preset ? whenModeFromCfg(preset.trigger_cfg, preset.condition_cfg) : "daily";
  const fields: Record<string, string> = {};
  for (const f of preset?.fields ?? []) {
    if (f.kind === "text" || f.kind === "textarea" || f.kind === "options") {
      fields[f.key] = typeof f.default === "string" ? f.default : "";
    }
  }
  return {
    name: preset ? t(preset.name_key as MessageKey) : "",
    preset,
    helperOn: isPromo,
    promo: { ...BLANK_PROMO },
    instruction: preset && !isPromo ? preset.instruction : "",
    replyInstruction: preset && preset.reply_instruction ? preset.reply_instruction : "",
    audience: (preset?.reply_defaults?.audience as string) || "all_except_trolls",
    when,
    nDays: (preset?.trigger_cfg?.n as number) ?? 3,
    weekday: (preset?.trigger_cfg?.weekday as number) ?? 0,
    dateFrom: (preset?.condition_cfg?.active_from as string) || "",
    dateTo: (preset?.condition_cfg?.active_to as string) || "",
    threshold: "",
    fields,
  };
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
  const [presets, setPresets] = useState<ScenarioPreset[]>([]);
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [postAutopilotOn, setPostAutopilotOn] = useState(true); // account autopilot post_enabled
  const [cap, setCap] = useState(1); // max_post_scenarios_per_day
  const [loaded, setLoaded] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);

  const [view, setView] = useState<View>("list");
  const [editing, setEditing] = useState<Scenario | null>(null); // null = new

  // ── unified-form state ──
  const [form, setForm] = useState<FormState>(() => freshForm(null, t));
  const [bakedOpen, setBakedOpen] = useState(false);
  const [powerOpen, setPowerOpen] = useState(false);
  const [preview, setPreview] = useState<ScenarioPreviewT | null>(null);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<ScenarioRunNow | null>(null);

  const [saving, setSaving] = useState(false);
  const [nameErr, setNameErr] = useState(false);
  const [fieldErrs, setFieldErrs] = useState<Record<string, boolean>>({});
  const [askErr, setAskErr] = useState(false);
  const [saveErr, setSaveErr] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmInline, setConfirmInline] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // Delete straight from a control-center card (independent of the editor flow).
  const [delTarget, setDelTarget] = useState<Scenario | null>(null);
  const [delBusy, setDelBusy] = useState(false);
  // Enabling a scenario goes through a confirm («это будет само постить/отвечать»).
  const [pendingEnable, setPendingEnable] = useState<Scenario | null>(null);
  const [enableBusy, setEnableBusy] = useState(false);
  const [toasts, setToasts] = useState<ToastT[]>([]);

  const [tw, setTw] = useTweaks(SCENARIOS_TWEAK_DEFAULTS);

  function toast(message: string, tone: ToastT["tone"] = "success") {
    const id = Date.now() + Math.random();
    setToasts((s) => [...s, { id, message, tone }]);
    setTimeout(() => setToasts((s) => s.filter((x) => x.id !== id)), 3500);
  }

  const update = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));
  const setField = (key: string, v: string) => setForm((f) => ({ ...f, fields: { ...f.fields, [key]: v } }));

  // The full catalog the gallery shows = backend presets + the synthetic «Акция».
  const catalog = useMemo(() => [...presets, PROMO_PRESET], [presets]);

  // ── load ──
  useEffect(() => {
    if (demoParam) return;
    if (!getTokens()) return;
    fetchMe().then((m) => setIsTester(m.is_tester === true)).catch(() => {});
  }, [demoParam]);

  function load(id: number) {
    setLoaded(false);
    Promise.all([
      fetchScenarios(id),
      fetchScenarioPresets().catch(() => ({ locale: "en", presets: [] })),
      fetchMyAccounts().catch(() => ({ accounts: [] as ConnectedAccount[] })),
      fetchAutopilot(id).catch(() => null),
    ])
      .then(([sc, pr, acc, ap]) => {
        setScenarios(sc.scenarios);
        setPresets(pr.presets);
        setAccounts(acc.accounts);
        if (ap) {
          setPostAutopilotOn(ap.post_enabled);
          if (typeof ap.max_post_scenarios_per_day === "number") setCap(ap.max_post_scenarios_per_day);
        }
      })
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
    setScenarios(st === "Empty" ? [] : DEMO_CC);
    setPresets(DEMO_CATALOG.filter((p) => p.id !== "promo"));
    setAccounts([]);
  }, [demoOn, tw.dark, tw.state]);

  // ── derived: does this preset produce replies / is reactive ──
  const presetId = form.preset?.id ?? "";
  const producesReplies = form.helperOn ? true : presetId ? presetProducesReplies(presetId) : false;
  const isReplyPolicy = !!form.preset && (form.preset.action_cfg?.kind as string) === "reply_policy";
  const isReactive = form.when === "event" && !!form.preset && eventKindOf(form.preset.trigger_cfg) !== "";
  const bakedKeys = presetId ? BAKED_RULE_KEYS[presetId] ?? [] : [];
  const bakedRules = bakedKeys.map((k) => t(k as MessageKey));
  const vFields = visibleFields(form.preset);

  // ── live preview (debounced) ──
  useEffect(() => {
    if (view !== "editor") return;
    // reply-policy → no post/cta preview; we render the reply sample statically.
    if (isReplyPolicy) {
      setPreview({ cta: "", instruction: "", reply_instruction: form.replyInstruction || (form.preset?.reply_instruction ?? ""), sample_post: "" });
      return;
    }
    if (form.helperOn || form.preset?.id === "promo") {
      if (!form.promo.ask.trim() || !form.promo.reward.trim()) {
        setPreview(null);
        return;
      }
      if (demoOn || accountId === null) {
        setPreview({ cta: `Напишите в комментариях «${form.promo.ask}» — и ${form.promo.reward}.`, instruction: "", reply_instruction: form.replyInstruction, sample_post: "" });
        return;
      }
      const id = setTimeout(() => {
        previewScenario(accountId, { promo: { ...form.promo, reply_instruction: form.replyInstruction } }).then(setPreview).catch(() => {});
      }, 500);
      return () => clearTimeout(id);
    }
    // free / cadence — interpolate the baked instruction with the edited fields.
    const instr = interpolate(form.instruction, form.fields).trim();
    if (!instr) {
      setPreview(null);
      return;
    }
    if (demoOn || accountId === null) {
      setPreview({ cta: "", instruction: instr, reply_instruction: "", sample_post: demoSamplePost(instr) });
      return;
    }
    const id = setTimeout(() => {
      previewScenario(accountId, { instruction: instr }).then(setPreview).catch(() => {});
    }, 500);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, isReplyPolicy, form.helperOn, form.preset, form.promo, form.instruction, form.fields, form.replyInstruction, demoOn, accountId]);

  const activeCount = useMemo(() => scenarios.filter((s) => s.enabled).length, [scenarios]);

  // ── control-center: stacking warnings ──
  const morning = useMemo(() => {
    const names = scenarios
      .filter((s) => s.enabled && (s.action_cfg?.kind as string) !== "reply_policy")
      .filter((s) => {
        const m = whenModeFromCfg(s.trigger_cfg, s.condition_cfg);
        return m === "daily" || m === "weekly" || m === "every_n_days" || m === "date_range";
      })
      .map((s) => s.name);
    return names;
  }, [scenarios]);
  const promoDaily = useMemo(
    () => scenarios.some((s) => s.enabled && s.template === "promo" && whenModeFromCfg(s.trigger_cfg, s.condition_cfg) === "daily"),
    [scenarios],
  );
  const anyPostScenarioOn = useMemo(
    () => scenarios.some((s) => s.enabled && (s.action_cfg?.kind as string) !== "reply_policy"),
    [scenarios],
  );

  // ── preview state ──
  const previewState: PreviewState = isReplyPolicy
    ? "reply"
    : form.helperOn || form.preset?.id === "promo"
      ? form.promo.ask.trim() && form.promo.reward.trim()
        ? "promo"
        : "empty"
      : interpolate(form.instruction, form.fields).trim()
        ? "free"
        : "empty";

  // ── editor open / close ──
  function openDiscovery() {
    setView("discovery");
  }
  function openPreset(p: ScenarioPreset) {
    setEditing(null);
    setForm(freshForm(p, t));
    setBakedOpen(false);
    setPowerOpen(false);
    setPreview(null);
    setRunResult(null);
    setNameErr(false);
    setFieldErrs({});
    setAskErr(false);
    setSaveErr(false);
    setConfirmInline(false);
    setView("editor");
  }
  function openScratch() {
    setEditing(null);
    setForm(freshForm(null, t));
    setBakedOpen(false);
    setPowerOpen(true); // from scratch → the raw model is the heart
    setPreview(null);
    setRunResult(null);
    setNameErr(false);
    setFieldErrs({});
    setAskErr(false);
    setSaveErr(false);
    setConfirmInline(false);
    setView("editor");
  }

  function openEditor(s: Scenario) {
    setEditing(s);
    // reconstruct a form from the saved scenario
    const usePromo = s.template === "promo" && s.structured != null;
    const replyPolicy = (s.action_cfg?.kind as string) === "reply_policy";
    const when = whenModeFromCfg(s.trigger_cfg, s.condition_cfg);
    // best-effort: match a catalog preset for the baked-rules + reply detection
    const matched = matchPreset(s, catalog);
    const f: FormState = {
      name: s.name,
      preset: matched,
      helperOn: usePromo,
      promo: usePromo && s.structured ? s.structured : { ...BLANK_PROMO },
      instruction: usePromo || replyPolicy ? "" : s.instruction,
      replyInstruction: s.reply_instruction,
      audience: (s.action_cfg?.audience as string) || "all_except_trolls",
      when,
      nDays: (s.trigger_cfg?.n as number) ?? 3,
      weekday: (s.trigger_cfg?.weekday as number) ?? 0,
      dateFrom: (s.condition_cfg?.active_from as string) || "",
      dateTo: (s.condition_cfg?.active_to as string) || "",
      threshold: s.trigger_cfg?.threshold_views != null ? String(s.trigger_cfg.threshold_views) : "",
      fields: {},
    };
    if (usePromo && s.structured) {
      f.nDays = s.structured.n_days;
    }
    setForm(f);
    setBakedOpen(false);
    setPowerOpen(false);
    setPreview(null);
    setRunResult(null);
    setNameErr(false);
    setFieldErrs({});
    setAskErr(false);
    setSaveErr(false);
    setConfirmInline(false);
    setView("editor");
  }

  function backToList() {
    setView("list");
    setEditing(null);
  }

  async function doToggle(s: Scenario, on: boolean) {
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
  // Turning ON gets a confirm (the «это будет само постить/отвечать» moment);
  // turning OFF is harmless → immediate.
  function toggle(s: Scenario, on: boolean) {
    if (on && !s.enabled) {
      setPendingEnable(s);
      return;
    }
    void doToggle(s, on);
  }
  async function confirmEnable(mode: PublishMode, opts: { enableAutopost: boolean }) {
    const s = pendingEnable;
    if (!s) return;
    setEnableBusy(true);
    if (opts.enableAutopost) setPostAutopilotOn(true);
    await doToggle(s, true);
    // reflect the chosen mode on the card immediately (demo + optimistic)
    setScenarios((xs) => xs.map((x) => (x.id === s.id ? { ...x, publish_mode: mode } : x)));
    setEnableBusy(false);
    setPendingEnable(null);
  }

  // Cross-account «Применить к…» — client-side clone: compile the scenario's
  // resolved shape and POST-create it (OFF) on each selected account.
  async function applyToAccounts(s: Scenario, ids: number[]) {
    if (demoOn) {
      toast(t("scenarios.apply_done").replace("{n}", String(ids.length)));
      return;
    }
    try {
      const body = scenarioToCreateBody(s);
      for (const id of ids) await createScenario(id, { ...body, enabled: false });
      toast(t("scenarios.apply_done").replace("{n}", String(ids.length)));
    } catch (e) {
      toast(String(e), "error");
    }
  }

  async function onCap(n: number) {
    setCap(n);
    if (demoOn || accountId === null) return;
    // Best-effort: the GET/PUT autopilot endpoint may not yet surface the field
    // (the worker reads the column directly). We send it so it persists once the
    // backend wires it; absent that, the control still drives the session.
    try {
      const ap = await fetchAutopilot(accountId);
      await updateAutopilot(accountId, { ...ap, max_post_scenarios_per_day: n });
    } catch {
      /* fail-soft — keep the local cap */
    }
  }

  function enablePostAutopilot() {
    router.push("/app/autopilot");
  }

  async function onRunNow() {
    if (!editing) {
      // run-now needs a saved scenario; for a new one we can't (no id yet).
      toast(t("scenarios.run_now_save_first"), "error");
      return;
    }
    if (demoOn) {
      setRunResult({ draft_id: 0, text: previewState === "free" ? preview?.sample_post ?? "" : "Готовый черновик акционного поста — найдёте его в Студии.", kind: isReplyPolicy ? "reply" : "post", replied_to: isReplyPolicy ? "А если совсем нет сил начать?" : null });
      return;
    }
    setRunning(true);
    setRunResult(null);
    try {
      const r = await runScenarioNow(editing.id);
      setRunResult(r);
    } catch (e) {
      toast(String(e), "error");
    } finally {
      setRunning(false);
    }
  }

  async function save(enable: boolean) {
    setSaveErr(false);
    let bad = false;
    const fe: Record<string, boolean> = {};
    if (!form.name.trim()) {
      setNameErr(true);
      bad = true;
    }
    if ((form.helperOn || form.preset?.id === "promo") && !form.promo.ask.trim()) {
      setAskErr(true);
      bad = true;
    }
    for (const f of vFields) {
      if (f.required && !(form.fields[f.key] ?? "").trim()) {
        fe[f.key] = true;
        bad = true;
      }
    }
    setFieldErrs(fe);
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
      const body = compileBody(form);
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

  // Delete a scenario straight from its control-center card (no editor round-trip).
  async function deleteFromCard() {
    const target = delTarget;
    if (!target) return;
    if (demoOn) {
      setScenarios((xs) => xs.filter((x) => x.id !== target.id));
      setDelTarget(null);
      toast(t("scenarios.toast_deleted"));
      return;
    }
    setDelBusy(true);
    try {
      await deleteScenario(target.id);
      setScenarios((xs) => xs.filter((x) => x.id !== target.id));
      setDelTarget(null);
      toast(t("scenarios.toast_deleted"));
    } catch (e) {
      toast(String(e), "error");
    } finally {
      setDelBusy(false);
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

  const otherAccounts = accounts.filter((a) => a.id !== accountId);
  const currentAccount = accounts.find((a) => a.id === accountId);
  const handle = demoOn ? DEMO_CREATOR.handle : currentAccount?.username ? `@${currentAccount.username}` : "@you";
  const whenFires = humanWhenFires(form, t);

  return (
    <div className="min-h-screen bg-bg text-text">
      <AppTopbar
        maxW="960px"
        title={t("scenarios.title")}
        pill={
          activeCount > 0 ? (
            <TopbarPill tone="success">{t("scenarios.active").replace("{n}", String(activeCount))}</TopbarPill>
          ) : (
            <TopbarPill tone="warning">{t("scenarios.all_off")}</TopbarPill>
          )
        }
        actions={
          view === "list" ? (
            <Button size="sm" onClick={openDiscovery} icon={<IcPlus size={15} />} className="max-sm:px-2.5">
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
            form={form}
            handle={handle}
            update={update}
            setField={setField}
            isExisting={!!editing}
            nameErr={nameErr}
            fieldErrs={fieldErrs}
            askErr={askErr}
            vFields={vFields}
            producesReplies={producesReplies}
            isReplyPolicy={isReplyPolicy}
            isReactive={isReactive}
            bakedRules={bakedRules}
            bakedOpen={bakedOpen}
            onBakedToggle={() => setBakedOpen((o) => !o)}
            powerOpen={powerOpen}
            onPowerToggle={() => setPowerOpen((o) => !o)}
            previewState={previewState}
            preview={preview}
            whenFires={whenFires}
            running={running}
            runResult={runResult}
            onRunNow={onRunNow}
            canRunNow={!!editing}
            saving={saving}
            saveErr={saveErr}
            confirmInline={confirmInline}
            onBack={backToList}
            onSave={() => save(false)}
            onSaveOn={() => save(true)}
            onDeleteDesktop={() => setConfirmInline(true)}
            onDeleteMobile={() => setDeleteOpen(true)}
            onCancelInline={() => setConfirmInline(false)}
            onConfirmInline={doDelete}
            deleting={deleting}
          />
        ) : view === "discovery" ? (
          <GalleryScreen presets={catalog} onPick={openPreset} onScratch={openScratch} onBack={backToList} />
        ) : !loaded ? (
          <div className="space-y-3">
            <ScenarioSkeleton />
            <ScenarioSkeleton />
            <ScenarioSkeleton />
          </div>
        ) : scenarios.length === 0 ? (
          <FirstRun
            handle={handle}
            onTry={(id) => {
              const p = catalog.find((x) => x.id === id);
              if (p) openPreset(p);
            }}
            onScratch={openScratch}
          />
        ) : (
          <div className="flex flex-col gap-3">
            <ControlCenterHeader cap={cap} onCap={onCap} />
            <StackingWarnings morningCount={morning.length} morningNames={morning} promoDaily={promoDaily} cap={cap} />
            {anyPostScenarioOn && !postAutopilotOn && <AutopostOffBanner onEnable={enablePostAutopilot} />}
            {scenarios.map((s) => (
              <ScenarioCard key={s.id} s={s} accounts={otherAccounts} handle={handle} onToggle={toggle} onOpen={openEditor} onApply={applyToAccounts} onDelete={(sc) => setDelTarget(sc)} />
            ))}
            {/* Obvious entry into the discovery gallery (the "new flow") even when
                scenarios already exist — the top-bar "+ Новый" reads as "add another",
                this reads as "browse the catalog". */}
            <button
              type="button"
              onClick={openDiscovery}
              className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-surface-2/40 px-4 py-3.5 text-small font-medium text-text-muted transition-colors hover:border-accent/40 hover:bg-accent/[0.05] hover:text-text"
            >
              <IcPlus size={15} /> {t("scenarios.browse_catalog")}
            </button>
          </div>
        )}
      </main>

      <DeleteConfirm open={deleteOpen} deleting={deleting} onClose={() => setDeleteOpen(false)} onConfirm={doDelete} />
      <DeleteConfirm open={!!delTarget} deleting={delBusy} onClose={() => setDelTarget(null)} onConfirm={deleteFromCard} />
      <EnableConfirm scenario={pendingEnable} postAutopilotOn={postAutopilotOn} handle={handle} busy={enableBusy} onConfirm={confirmEnable} onCancel={() => setPendingEnable(null)} />

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

// Best-effort: match a saved scenario back to a catalog preset (by reply-policy
// shape or trigger kind) so the editor shows the right baked rules + reply block.
function matchPreset(s: Scenario, catalog: ScenarioPreset[]): ScenarioPreset | null {
  if (s.template === "promo") return catalog.find((p) => p.id === "promo") ?? null;
  if ((s.action_cfg?.kind as string) === "reply_policy") return catalog.find((p) => p.id === "reply_duty") ?? null;
  const kind = (s.trigger_cfg?.kind as string) || "";
  if (kind === "on_metric_threshold") return catalog.find((p) => p.id === "amplify_viral") ?? null;
  if (kind === "on_follower_milestone") return catalog.find((p) => p.id === "milestone_thanks") ?? null;
  return null; // free scenario — no preset chrome
}

// Compile an EXISTING scenario into a create body for cross-account clone.
function scenarioToCreateBody(s: Scenario): Parameters<typeof createScenario>[1] {
  if (s.template === "promo" && s.structured) {
    return { name: s.name, promo: s.structured };
  }
  if ((s.action_cfg?.kind as string) === "reply_policy") {
    return {
      name: s.name,
      reply_policy: {
        audience: (s.action_cfg?.audience as string) || "all_except_trolls",
        max_per_day: (s.action_cfg?.max_per_day as number) ?? 60,
        skip_low_value: s.action_cfg?.skip_low_value !== false,
      },
      reply_instruction: s.reply_instruction,
    };
  }
  return {
    name: s.name,
    trigger: s.trigger_cfg,
    instruction: s.instruction,
    reply_instruction: s.reply_instruction,
    condition: s.condition_cfg,
  };
}

// «Сработает: завтра в 9:00 первым постом» — a human "when it fires" line.
function humanWhenFires(form: FormState, t: (k: MessageKey) => string): string {
  switch (form.when) {
    case "weekly":
      return t("scenarios.fires.weekly");
    case "every_n_days":
      return t("scenarios.fires.every_n").replace("{n}", String(form.nDays));
    case "date_range":
      return t("scenarios.fires.dates");
    case "event":
      return t("scenarios.fires.event");
    default:
      return t("scenarios.fires.morning");
  }
}

// ── the ONE unified form (fields + sticky preview + run-now) ──
function EditorView({
  t,
  form,
  handle,
  update,
  setField,
  isExisting,
  nameErr,
  fieldErrs,
  askErr,
  vFields,
  producesReplies,
  isReplyPolicy,
  isReactive,
  bakedRules,
  bakedOpen,
  onBakedToggle,
  powerOpen,
  onPowerToggle,
  previewState,
  preview,
  whenFires,
  running,
  runResult,
  onRunNow,
  canRunNow,
  saving,
  saveErr,
  confirmInline,
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
  form: FormState;
  handle: string;
  update: (patch: Partial<FormState>) => void;
  setField: (key: string, v: string) => void;
  isExisting: boolean;
  nameErr: boolean;
  fieldErrs: Record<string, boolean>;
  askErr: boolean;
  vFields: ReturnType<typeof visibleFields>;
  producesReplies: boolean;
  isReplyPolicy: boolean;
  isReactive: boolean;
  bakedRules: string[];
  bakedOpen: boolean;
  onBakedToggle: () => void;
  powerOpen: boolean;
  onPowerToggle: () => void;
  previewState: PreviewState;
  preview: ScenarioPreviewT | null;
  whenFires: string;
  running: boolean;
  runResult: ScenarioRunNow | null;
  onRunNow: () => void;
  canRunNow: boolean;
  saving: boolean;
  saveErr: boolean;
  confirmInline: boolean;
  onBack: () => void;
  onSave: () => void;
  onSaveOn: () => void;
  onDeleteDesktop: () => void;
  onDeleteMobile: () => void;
  onCancelInline: () => void;
  onConfirmInline: () => void;
  deleting: boolean;
}) {
  const promoMode = form.helperOn || form.preset?.id === "promo";
  const eventKind = form.preset ? eventKindOf(form.preset.trigger_cfg) : "";
  // living sentence (A) + skeleton (B), recomposed from the form's preset + fields
  const pid = form.preset?.id ?? null;
  const sentenceOverrides: Record<string, string> = {};
  if (pid === "rubric" && form.fields.rubric_name?.trim()) sentenceOverrides.name = form.fields.rubric_name.trim();
  if (promoMode && form.promo.ask?.trim()) sentenceOverrides.ask = form.promo.ask.trim();
  if (pid === "reply_duty")
    sentenceOverrides.audience =
      form.audience === "fans"
        ? t("scenarios.aud_phrase.fans")
        : form.audience === "questions"
          ? t("scenarios.aud_phrase.questions")
          : t("scenarios.aud_phrase.all");
  const sentenceId = promoMode ? "promo" : pid;
  const sentence = presetSentence(t, sentenceId, handle, sentenceOverrides);
  const skel = presetSkel(t, sentenceId);
  return (
    <div className="space-y-4">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-small text-text-muted hover:text-text">
        <IcArrowLeft size={16} /> {t("scenarios.back")}
      </button>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-[minmax(0,1fr)_380px] md:items-start">
        {/* form column */}
        <div className="space-y-4 md:space-y-5">
          {/* living sentence (A) + skeleton (B) — «ЧТО БУДЕТ ПРОИСХОДИТЬ» */}
          <LivingSentence template={sentence.template} slots={sentence.slots} mode="ask" kind={sentence.kind} />
          <Skeleton3 when={skel.when} onlyif={skel.onlyif} whatdo={skel.whatdo} />
          {/* name */}
          <FormCard>
            <Field label={t("scenarios.f.name")} error={nameErr ? t("scenarios.err_required") : undefined}>
              <input
                className={cn(INPUT, nameErr && "border-danger focus:border-danger focus:ring-danger/25")}
                value={form.name}
                onChange={(e) => update({ name: e.target.value })}
                placeholder={t("scenarios.f.name_ph")}
              />
            </Field>
          </FormCard>

          {/* КОГДА — schedule (hidden for a pure reply-policy duty) */}
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
                onMode={(m) => update({ when: m })}
                onNDays={(n) => update({ nDays: n })}
                onWeekday={(d) => update({ weekday: d })}
                onDate={(which, v) => update(which === "from" ? { dateFrom: v } : { dateTo: v })}
                onThreshold={(v) => update({ threshold: v })}
              />
            </FormCard>
          )}

          {/* ЧТО ВЫ ЗАДАЁТЕ — preset fields OR promo helper OR free instruction */}
          {promoMode ? (
            <FormCard>
              <CardTitle title={t("scenarios.sec.generate")} sub={t("scenarios.sec.generate_sub")} />
              <PromoHelper on={form.helperOn} promo={form.promo} askErr={askErr} onToggle={(on) => update({ helperOn: on })} onChange={(p) => update({ promo: p })} />
            </FormCard>
          ) : form.preset && (vFields.length > 0 || isReplyPolicy) ? (
            <FormCard>
              <CardTitle title={t("scenarios.sec.you_set")} sub={t("scenarios.sec.you_set_sub")} />
              <div className="space-y-4">
                {vFields.map((f) => (
                  <PresetFieldInput key={f.key} field={f} value={form.fields[f.key] ?? ""} error={fieldErrs[f.key]} onChange={(v) => setField(f.key, v)} />
                ))}
                {isReplyPolicy && (
                  <ReplyBlock audience={form.audience} onAudience={(a) => update({ audience: a })} replyInstruction={form.replyInstruction} onReplyInstruction={(v) => update({ replyInstruction: v })} />
                )}
              </div>
            </FormCard>
          ) : !form.preset ? (
            // from scratch → a free instruction textarea (the heart)
            <FormCard>
              <CardTitle title={t("scenarios.sec.generate")} sub={t("scenarios.sec.generate_sub")} />
              <Field label={t("scenarios.f.instruction")} hint={t("scenarios.f.instruction_hint")}>
                <textarea rows={5} className={cn(TEXTAREA, "min-h-[132px]")} value={form.instruction} onChange={(e) => update({ instruction: e.target.value })} placeholder={t("scenarios.f.instruction_ph")} />
              </Field>
            </FormCard>
          ) : null}

          {/* ЧТО ЗАШЬЁТСЯ — read-only baked rules */}
          {bakedRules.length > 0 && <BakedRules open={bakedOpen} onToggle={onBakedToggle} rules={bakedRules} />}

          {/* КАК ОТВЕЧАТЬ — for reply-producing post presets (NOT reply-policy, which has its own block above; NOT promo, which has the field below) */}
          {producesReplies && !isReplyPolicy && !promoMode && (
            <FormCard>
              <CardTitle title={t("scenarios.sec.reply")} sub={t("scenarios.sec.reply_sub")} />
              <Field label={t("scenarios.sec.reply")} hint={t("scenarios.f.reply_hint")}>
                <textarea rows={3} className={TEXTAREA} value={form.replyInstruction} onChange={(e) => update({ replyInstruction: e.target.value })} placeholder={t("scenarios.f.reply_ph")} />
              </Field>
            </FormCard>
          )}

          {/* promo reply field (the «Акция» reply instruction) */}
          {promoMode && (
            <FormCard>
              <div className="mb-4">
                <h2 className="flex flex-wrap items-center gap-2 text-h3 font-semibold tracking-tight">
                  {t("scenarios.sec.reply")}
                  <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-caption font-medium text-accent">{t("scenarios.helper_filled")}</span>
                </h2>
                <p className="mt-1 text-small leading-relaxed text-text-subtle">{t("scenarios.sec.reply_sub")}</p>
              </div>
              <Field label={t("scenarios.sec.reply")} hint={t("scenarios.f.reply_hint")}>
                <textarea rows={3} className={TEXTAREA} value={form.replyInstruction} onChange={(e) => update({ replyInstruction: e.target.value })} placeholder={t("scenarios.f.reply_ph")} />
              </Field>
            </FormCard>
          )}

          {/* «Ещё настройки» — ТОЛЬКО ЕСЛИ: фильтры, тихие часы, кап */}
          <MoreSettings isReply={isReplyPolicy || promoMode} />

          {/* power-user disclosure — «Показать как правило» */}
          <PowerUserDisclosure open={powerOpen} onToggle={onPowerToggle} instruction={form.instruction} onInstruction={(v) => update({ instruction: v })} />
        </div>

        {/* sticky live preview + run-now */}
        <aside className="md:sticky md:top-4 md:self-start">
          <ScenarioPreview
            state={previewState}
            preview={preview}
            promo={form.promo}
            whenFires={whenFires}
            canRunNow={canRunNow}
            running={running}
            runResult={runResult}
            onRunNow={onRunNow}
          />
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
              <button onClick={onDeleteDesktop} className="inline-flex items-center gap-1.5 text-small font-medium text-text-muted hover:text-danger max-sm:hidden sm:ml-auto">
                <IcTrash size={15} /> {t("scenarios.delete")}
              </button>
              <button onClick={onDeleteMobile} className="inline-flex items-center justify-center gap-1.5 py-2 text-small font-medium text-danger sm:hidden">
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
