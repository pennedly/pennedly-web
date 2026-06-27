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
import { cn } from "@/lib/cn";
import { useTranslation, type MessageKey } from "@/lib/i18n";
import { useTesterGuard } from "@/lib/tester";
import { AppTopbar, TopbarPill } from "@/components/AppTopbar";
import { Button } from "@/components/ui/button";
import { Toast, ToastHost } from "@/components/ui/toast";
import { IcPlus } from "@/components/icons";
import { TweaksPanel, TweakSection, TweakToggle, TweakRadio, useTweaks } from "@/components/tweaks/TweaksPanel";
import {
  AutopostOffBanner,
  DeleteConfirm,
  EnableConfirm,
  ScenarioCard,
  type PreviewState,
  ScenarioSkeleton,
  ScenariosError,
  StackingWarnings,
  type WhenMode,
  presetProducesReplies,
  whenModeFromCfg,
  eventKindOf,
} from "@/components/studio/ScenariosParts";
import {
  HouseRules,
  type ReplyFreq,
  freqFromBackend,
  freqToBackend,
  hhmmToHour,
  hourToHHMM,
  QUIET_TZ_LABEL,
} from "@/components/studio/HouseRules";
import { StepEditor } from "@/components/studio/scenarios-editor";
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
import { DEMO_CC, DEMO_CREATOR, demoSampleKey } from "@/components/studio/scenarios-presentation";
import { type PublishMode } from "@/components/studio/scenarios-living";
import { FirstRun, GalleryScreen } from "@/components/studio/scenarios-screens";
import type {
  AutopilotConfig,
  ConnectedAccount,
  Scenario,
  ScenarioPreset,
  ScenarioPreview as ScenarioPreviewT,
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
    hour: "9:00",
    jitter: 15,
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

  // ── «Правила дома» (global house rules). On the real path these mirror the
  // account's `account_autopilot` config; on demo they're FE-only sample values.
  // The master is the single real gate; default ON for existing accounts (§8).
  // `apConfig` is the last-loaded full config — the base every PUT spreads over
  // so a single-knob save never clobbers the other autopilot fields. ──
  const [hrOpen, setHrOpen] = useState(false);
  const [masterOn, setMasterOn] = useState(true);
  const [replyFreq, setReplyFreq] = useState<ReplyFreq>("hourly");
  const [quietOn, setQuietOn] = useState(true);
  const [quietFrom, setQuietFrom] = useState("23:00");
  const [quietTo, setQuietTo] = useState("08:00");
  const [replyCeiling, setReplyCeiling] = useState(25);
  const [apConfig, setApConfig] = useState<AutopilotConfig | null>(null);

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

  // Map a loaded backend autopilot config → the «Правила дома» control state.
  // The master switch is the account's single `enabled` gate; the reply rhythm,
  // ceiling and quiet window come from the reply_* fields. Quiet is "on" only
  // when BOTH reply-quiet hours are set (the backend's "no window" = both null).
  function applyAutopilot(ap: AutopilotConfig) {
    setApConfig(ap);
    setMasterOn(ap.enabled);
    setPostAutopilotOn(ap.post_enabled);
    if (typeof ap.max_post_scenarios_per_day === "number") setCap(ap.max_post_scenarios_per_day);
    setReplyFreq(freqFromBackend(ap.reply_frequency));
    setReplyCeiling(ap.replies_per_day);
    const from = hourToHHMM(ap.reply_quiet_start_hour);
    const to = hourToHHMM(ap.reply_quiet_end_hour);
    const on = from !== null && to !== null;
    setQuietOn(on);
    // Keep the last-shown window when the user toggles quiet off (so flipping it
    // back doesn't lose their hours); only overwrite from the config when set.
    if (from !== null) setQuietFrom(from);
    if (to !== null) setQuietTo(to);
  }

  // Persist a single «Правила дома» change: spread the patch over the last-loaded
  // config and PUT it (optimistic — the caller already updated local state; we
  // roll the whole config back on error). No-op on demo / before an account /
  // before the first load. Always keeps the legacy `reply_enabled` mirror and the
  // `reply_mode` consistent with what we send.
  async function saveAutopilot(patch: Partial<AutopilotConfig>, rollback: () => void) {
    if (demoOn || accountId === null) return;
    const base = apConfig;
    if (!base) return; // not loaded yet — nothing safe to merge onto
    const next: AutopilotConfig = { ...base, ...patch };
    setApConfig(next);
    try {
      const saved = await updateAutopilot(accountId, next);
      setApConfig(saved);
    } catch (e) {
      setApConfig(base);
      rollback();
      toast(String(e), "error");
    }
  }

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
        if (ap) applyAutopilot(ap);
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
    // «Правила дома» demo values (master driven by a Tweaks toggle).
    setMasterOn(!!tw.master);
    setCap(1);
    setReplyFreq("hourly");
    setQuietOn(true);
    setQuietFrom("23:00");
    setQuietTo("08:00");
    setReplyCeiling(25);
  }, [demoOn, tw.dark, tw.state, tw.master]);

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
      setPreview({ cta: "", instruction: "", reply_instruction: "", sample_post: t(demoSampleKey(form.preset?.id)) });
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
      // Schedule «Время»/«Разброс» — restored from the saved scenario (the backend
      // surfaces them top-level, sourced from trigger_cfg). Defaults when absent.
      hour: typeof scenarioHour(s) === "number" ? `${scenarioHour(s)}:00` : "9:00",
      jitter: scenarioJitter(s) ?? 15,
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
    // optimistic: flip on + record the chosen mode
    setScenarios((xs) => xs.map((x) => (x.id === s.id ? { ...x, enabled: true, publish_mode: mode } : x)));
    if (opts.enableAutopost) setPostAutopilotOn(true);
    if (demoOn) {
      toast(t("scenarios.toast_on"));
      setEnableBusy(false);
      setPendingEnable(null);
      return;
    }
    try {
      // post + «Автоматически» with account autopublish off → turn it on inline
      if (opts.enableAutopost && accountId !== null) {
        const ap = await fetchAutopilot(accountId);
        await updateAutopilot(accountId, { ...ap, post_enabled: true });
      }
      const saved = await updateScenario(s.id, { publish_mode: mode, enabled: true });
      setScenarios((xs) => xs.map((x) => (x.id === saved.id ? saved : x)));
      toast(t("scenarios.toast_on"));
    } catch (e) {
      setScenarios((xs) => xs.map((x) => (x.id === s.id ? { ...x, enabled: false } : x)));
      toast(String(e), "error");
    } finally {
      setEnableBusy(false);
      setPendingEnable(null);
    }
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

  // ── «Правила дома» handlers — each flips local state optimistically, then
  // persists the one field via saveAutopilot (which rolls the whole config +
  // this control back on error). master→enabled, cap→max_post_scenarios_per_day,
  // freq→reply_frequency, ceiling→replies_per_day, quiet→reply_quiet_*_hour. ──
  function onMaster(on: boolean) {
    const prev = masterOn;
    setMasterOn(on);
    void saveAutopilot({ enabled: on }, () => setMasterOn(prev));
  }
  function onCap(n: number) {
    const prev = cap;
    setCap(n);
    void saveAutopilot({ max_post_scenarios_per_day: n }, () => setCap(prev));
  }
  function onFreq(f: ReplyFreq) {
    const prev = replyFreq;
    setReplyFreq(f);
    void saveAutopilot({ reply_frequency: freqToBackend(f) }, () => setReplyFreq(prev));
  }
  function onCeiling(n: number) {
    const prev = replyCeiling;
    setReplyCeiling(n);
    void saveAutopilot({ replies_per_day: n }, () => setReplyCeiling(prev));
  }
  // Quiet hours: a window is "on" when both hours are set; "off" = both null (the
  // backend's no-window). Toggling on commits the currently-shown From/To.
  function onQuiet(on: boolean) {
    const prev = quietOn;
    setQuietOn(on);
    const patch = on
      ? { reply_quiet_start_hour: hhmmToHour(quietFrom), reply_quiet_end_hour: hhmmToHour(quietTo) }
      : { reply_quiet_start_hour: null, reply_quiet_end_hour: null };
    void saveAutopilot(patch, () => setQuietOn(prev));
  }
  function onQuietFrom(v: string) {
    const prev = quietFrom;
    setQuietFrom(v);
    if (!quietOn) return; // off → don't persist a window
    void saveAutopilot({ reply_quiet_start_hour: hhmmToHour(v) }, () => setQuietFrom(prev));
  }
  function onQuietTo(v: string) {
    const prev = quietTo;
    setQuietTo(v);
    if (!quietOn) return;
    void saveAutopilot({ reply_quiet_end_hour: hhmmToHour(v) }, () => setQuietTo(prev));
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
      // «Сохранить и включить» defaults to ask (drafts → you approve); going
      // fully automatic is a conscious opt-in via the enable-moment modal only.
      if (editing) {
        saved = await updateScenario(editing.id, { ...body, ...(enable ? { enabled: true, publish_mode: "ask" } : {}) });
        setScenarios((xs) => xs.map((x) => (x.id === saved.id ? saved : x)));
      } else {
        saved = await createScenario(accountId, { ...body, enabled: enable, ...(enable ? { publish_mode: "ask" } : {}) });
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
        <AppTopbar maxW="960px" title={t("ap.title")} />
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
        title={t("ap.title")}
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
            <h1 className="text-h1 font-semibold tracking-tight">{t("ap.title")}</h1>
            <p className="max-w-[60ch] text-small text-text-muted">{t("scenarios.subtitle")}</p>
          </div>
        )}

        {/* «Правила дома» — the global house-rules header, ON TOP of the routine
            area in BOTH the list and the first-run (empty) view. The master is the
            single real gate; the body + routine list dim when it's off (§4). */}
        {view === "list" && (loaded || demoOn) && !bootError && (
          <HouseRules
            masterOn={masterOn}
            cap={cap}
            freq={replyFreq}
            quietOn={quietOn}
            quietFrom={quietFrom}
            quietTo={quietTo}
            ceiling={replyCeiling}
            tz={demoOn ? "UTC+1" : QUIET_TZ_LABEL}
            open={hrOpen}
            onToggle={() => setHrOpen((o) => !o)}
            onMaster={onMaster}
            onCap={onCap}
            onFreq={onFreq}
            onQuiet={onQuiet}
            onQuietFrom={onQuietFrom}
            onQuietTo={onQuietTo}
            onCeiling={onCeiling}
          />
        )}

        {view === "editor" ? (
          <StepEditor
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
          // First-run, dimmed too when the master is off (the rules + examples are
          // visible but nothing runs until you turn the master on).
          <div className={masterOn ? undefined : "pointer-events-none opacity-50 transition-opacity"}>
            <FirstRun
              handle={handle}
              onTry={(id) => {
                const p = catalog.find((x) => x.id === id);
                if (p) openPreset(p);
              }}
              onScratch={openScratch}
            />
          </div>
        ) : (
          // The routines list. Dims (with the HR body) when the master is off — the
          // master switch stays the only live control (§4 «honestly dead»).
          <div className={cn("flex flex-col gap-3", !masterOn && "pointer-events-none opacity-50 transition-opacity")}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3.5 gap-y-0.5">
              <span className="text-h3 font-semibold tracking-tight">{t("ap.routines.title")}</span>
              <span className="text-small text-text-subtle">
                {(scenarios.length === 1 ? t("ap.routines.count_one") : t("ap.routines.count_many"))
                  .replace("{total}", String(scenarios.length))
                  .replace("{active}", String(activeCount))}
              </span>
            </div>
            <StackingWarnings morningCount={morning.length} morningNames={morning} promoDaily={promoDaily} cap={cap} />
            {anyPostScenarioOn && !postAutopilotOn && <AutopostOffBanner onEnable={enablePostAutopilot} />}
            {scenarios.map((s) => (
              <ScenarioCard
                key={s.id}
                s={s}
                accounts={otherAccounts}
                handle={handle}
                onToggle={toggle}
                onOpen={openEditor}
                onApply={applyToAccounts}
                onDelete={(sc) => setDelTarget(sc)}
                inheritFromHouseRules={(s.action_cfg?.kind as string) === "reply_policy"}
              />
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
        <TweaksPanel title="Autopilot">
          <TweakSection label="Appearance" />
          <TweakToggle label="Dark mode" value={tw.dark} onChange={(v) => setTw("dark", v)} />
          <TweakSection label="House Rules" />
          <TweakToggle label="Master on" value={tw.master} onChange={(v) => setTw("master", v)} />
          <TweakSection label="State" />
          <TweakRadio label="State" value={tw.state} options={["List", "Empty", "Loading", "Error"]} onChange={(v) => setTw("state", v)} />
        </TweaksPanel>
      )}
    </div>
  );
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

// Read a saved scenario's schedule hour (0–23): prefer the backend's lifted
// top-level `hour`, fall back to `trigger_cfg.hour`, else null.
function scenarioHour(s: Scenario): number | null {
  if (typeof s.hour === "number") return s.hour;
  const h = s.trigger_cfg?.hour;
  return typeof h === "number" && Number.isInteger(h) && h >= 0 && h <= 23 ? h : null;
}
function scenarioJitter(s: Scenario): number | null {
  if (typeof s.jitter_minutes === "number") return s.jitter_minutes;
  const j = s.trigger_cfg?.jitter_minutes;
  return typeof j === "number" && Number.isInteger(j) && j >= 0 && j <= 120 ? j : null;
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
