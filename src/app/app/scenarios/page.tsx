"use client";

import "@/components/studio/publish-mode.css";

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

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import {
  ApiError,
  clearTokens,
  createScenario,
  deleteScenario,
  fetchAutopilot,
  fetchMe,
  fetchMyAccounts,
  fetchPosts,
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
import { pluralKey, useTranslation, type MessageKey } from "@/lib/i18n";
import { useTesterGuard } from "@/lib/tester";
import { AppTopbar, TopbarPill } from "@/components/AppTopbar";
import { Button } from "@/components/ui/button";
import { Toast, ToastHost } from "@/components/ui/toast";
import { IcPlus, IcSliders } from "@/components/icons";
import { TweaksPanel, TweakSection, TweakToggle, TweakRadio, useTweaks } from "@/components/tweaks/TweaksPanel";
import {
  ConflictBracket,
  DeleteConfirm,
  EnableConfirm,
  HiddenTipsPill,
  ScenarioCard,
  type PreviewState,
  ScenarioSkeleton,
  ScenariosError,
  type TipAdvice,
  TipRestoredLine,
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
  BOOST_FORM_DEFAULTS,
  boostFromCfg,
  buildAttachedBoostBody,
  compileBody,
  type FormState,
  hoursFromCfg,
  interpolate,
  isBoostScenario,
  L3_FORM_DEFAULTS,
  MILESTONE_DEFAULT_TARGETS,
  milestoneTargetsFromCfg,
  type MonthDate,
  monthlyDaysFromCfg,
  normalizeMilestoneTargets,
  perDayTimesFromCfg,
  POST_REPLY_FORM_DEFAULTS,
  replyAudienceOverrideFromCfg,
  replyOverridesFromCfg,
  scenarioHour,
  scenarioHours,
  scenarioJitter,
  visibleFields,
  weekdaysFromCfg,
  yearlyDatesFromCfg,
} from "@/components/studio/scenarios-form";
import type { L3Inherited } from "@/components/studio/scenarios-recipe";
import {
  BLANK_PROMO,
  BOOST_PRESET,
  DEMO_CATALOG,
  MENTION_PRESET,
  PROMO_PRESET,
  SCENARIOS_TWEAK_DEFAULTS,
} from "@/components/studio/scenarios-demo";
import { DEMO_CC, DEMO_CREATOR, demoSampleKey } from "@/components/studio/scenarios-presentation";
import { type PublishMode } from "@/components/studio/scenarios-living";
import { FirstRun, GalleryScreen } from "@/components/studio/scenarios-screens";
import { ReplyRoutineCard } from "@/components/studio/ReplyRoutineCard";
import { ReplyAudienceGallery } from "@/components/studio/ReplyAudienceGallery";
import {
  AUDIENCE_PRESETS,
  presetIdFor,
  type ReplyAudience,
} from "@/components/studio/reply-audience";
import type {
  AutopilotConfig,
  ConnectedAccount,
  PostSummary,
  Scenario,
  ScenarioPreset,
  ScenarioPreview as ScenarioPreviewT,
  ScenarioRunNow,
} from "@/lib/types";

const IS_DEV = process.env.NODE_ENV === "development";

// ── Tip-plaque dismissal (FE-only, no backend) ──────────────────────────────
// A dismissed tip really "returns in a week": we persist a per-account, per-advice
// expiry timestamp in localStorage and treat the tip as hidden only while that
// stamp is in the future. The key is `pl-dismiss:<accountId>:<adviceKey>`.
const TIP_DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
function tipDismissKey(accountId: number | string, adviceKey: string): string {
  return `pl-dismiss:${accountId}:${adviceKey}`;
}
// Read the still-active dismissals for an account (expired ones are pruned).
function readActiveDismissals(accountId: number | string): Set<string> {
  const out = new Set<string>();
  if (typeof window === "undefined") return out;
  const prefix = `pl-dismiss:${accountId}:`;
  const now = Date.now();
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (!k || !k.startsWith(prefix)) continue;
      const exp = Number(window.localStorage.getItem(k) ?? 0);
      if (exp > now) out.add(k.slice(prefix.length));
      else window.localStorage.removeItem(k); // prune expired
    }
  } catch {
    /* localStorage unavailable (private mode / SSR) — treat as nothing hidden */
  }
  return out;
}

// The hour a post-scenario «metits на» (0–23), or null when it has no fixed hour
// (asap / hourly / event scenarios are never grouped). Mirrors scenarioHour().
function postHour(s: Scenario): number | null {
  if (typeof s.hour === "number") return s.hour;
  const h = s.trigger_cfg?.hour;
  return typeof h === "number" && Number.isInteger(h) && h >= 0 && h <= 23 ? h : null;
}
function fmtHour(h: number): string {
  return `${h}:00`;
}

type ToastT = { id: number; message: string; tone: "success" | "error" };
type View = "list" | "discovery" | "editor" | "reply-gallery";

// A fresh form state for a chosen preset (or null = from scratch / promo).
function freshForm(preset: ScenarioPreset | null, t: (k: MessageKey) => string): FormState {
  const isPromo = preset?.id === "promo";
  // The boost preset opens the boost recipe (entry A). Seed metric/threshold/target
  // from the preset's trigger_cfg so a fresh boost shows the design defaults.
  const isBoostPreset = preset?.id === "boost" || (preset?.trigger_cfg?.kind as string) === "on_post_metric";
  const boost = isBoostPreset ? boostFromCfg(preset?.trigger_cfg, preset?.action_cfg) : null;
  const when: WhenMode = preset ? whenModeFromCfg(preset.trigger_cfg, preset.condition_cfg) : "daily";
  const fields: Record<string, string> = {};
  for (const f of preset?.fields ?? []) {
    if (f.kind === "text" || f.kind === "textarea" || f.kind === "options") {
      fields[f.key] = typeof f.default === "string" ? f.default : "";
    }
  }
  const eventKind: FormState["eventKind"] =
    (preset?.trigger_cfg?.kind as string) === "on_follower_milestone" ? "on_follower_milestone" : "on_metric_threshold";
  return {
    // from a preset → its name; from scratch → a real default name (never an empty
    // H1) the founder can rename with the pencil.
    name: preset ? t(preset.name_key as MessageKey) : t("scenarios.new"),
    preset,
    helperOn: isPromo,
    promo: { ...BLANK_PROMO },
    instruction: preset && !isPromo ? preset.instruction : "",
    replyInstruction: preset && preset.reply_instruction ? preset.reply_instruction : "",
    audience: (preset?.reply_defaults?.audience as string) || "all_except_trolls",
    audiencePrompt: "",
    when,
    nDays: (preset?.trigger_cfg?.n as number) ?? 3,
    // every_n_days «Начиная с» — seed from the preset's cfg (rarely present),
    // else empty (interval starts now).
    startDate: (preset?.trigger_cfg?.start_date as string) || "",
    // weekly — multi-weekday. A preset may ship `weekdays`; fall back to a single
    // `weekday` (back-compat), else the design default Mon–Fri.
    weekdays: weekdaysFromCfg(preset?.trigger_cfg) ?? [0, 1, 2, 3, 4],
    perDay: false,
    perDayTimes: {},
    // «Раз в месяц» / «Раз в год» — fresh defaults from the design. (A preset that
    // ships a monthly/yearly trigger seeds these from its cfg; openEditor does the
    // round-trip for saved scenarios.) Months are 0-indexed in the form.
    monthlyDays: monthlyDaysFromCfg(preset?.trigger_cfg) ?? [1, 15, 31],
    monthlyLastDay: (preset?.trigger_cfg?.last_day as boolean) === true,
    monthlyOnMissing: (preset?.trigger_cfg?.on_missing as string) === "skip" ? "skip" : "last",
    // milestone ladder — a preset that ships `targets` seeds them; else the
    // design-default ladder (openEditor does the round-trip for saved scenarios).
    milestoneTargets: milestoneTargetsFromCfg(preset?.trigger_cfg) ?? [...MILESTONE_DEFAULT_TARGETS],
    yearlyDates: yearlyDatesFromCfg(preset?.trigger_cfg) ?? [
      { day: 1, month: 0 },
      { day: 29, month: 1 },
    ],
    dateFrom: (preset?.condition_cfg?.active_from as string) || "",
    dateTo: (preset?.condition_cfg?.active_to as string) || "",
    threshold: "",
    eventKind,
    // schedule time(s) — a preset may ship a multi-slot `hours` array or a single
    // `hour`; default to one 9:00 slot. `hour` mirrors the first (sorted) slot.
    hours: hoursFromCfg(preset?.trigger_cfg) ?? [9],
    hour: `${(hoursFromCfg(preset?.trigger_cfg) ?? [9])[0]}:00`,
    jitter: 15,
    // recipe condition builder — a fresh preset starts with the preset's own
    // baked conditions reflected (only_if_no_post_today is the only one presets
    // seed today; cooldown/max_fires are user-added).
    condNoPostToday: (preset?.condition_cfg?.only_if_no_post_today as boolean) === true,
    cooldownOn: false,
    cooldownValue: 6,
    cooldownUnit: "hours",
    maxFiresOn: false,
    maxFires: 3,
    // recipe content shaping — defaults that fold to nothing (round-trip safe).
    topic: "",
    length: "any",
    cta: "",
    // КАК — default «Спроси меня» (ask). New scenarios stay drafts-first.
    mode: "ask",
    // Layer 3 — a fresh scenario inherits every «Правила дома» reply setting (all
    // override toggles OFF → compileBody emits nothing extra).
    ...L3_FORM_DEFAULTS,
    // «Аудитория ответов» — a fresh POST/PROMO scenario inherits the account reply
    // audience (postReplyOwn=false → no override emitted).
    ...POST_REPLY_FORM_DEFAULTS,
    // Boost defaults (inert for a non-boost preset). The boost preset flips
    // isBoost + seeds metric/threshold/target/comment from its trigger/action cfg
    // (entry A — the standalone editor with the explicit target picker).
    ...BOOST_FORM_DEFAULTS,
    ...(boost
      ? {
          isBoost: true,
          boostEntry: "a" as const,
          boostMetric: boost.metric,
          boostThreshold: boost.threshold,
          boostComment: boost.comment,
          boostTargetType: boost.targetType,
          boostScenarioId: boost.scenarioId,
          boostPostId: boost.postId,
        }
      : {}),
    fields,
  };
}

export default function ScenariosPage() {
  const router = useRouter();
  const { t, locale } = useTranslation();
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
  // Recent posts — for the boost editor's «Конкретному посту» target picker (id +
  // a short preview). Loaded alongside scenarios; empty until then / on demo.
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [cap, setCap] = useState(1); // max_post_scenarios_per_day
  // Tip-plaque dismissals (advice keys currently hidden; 7-day TTL via localStorage).
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

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

  // ── built-in «Отвечать на комментарии» routine. The card's toggle = the
  // account reply mode (off ↔ all); «кому отвечать» = reply_audience (+ a free
  // `audience_prompt` when audience='custom'). These mirror account_autopilot;
  // on demo they're FE-only sample values driven from local state. ──
  const [replyOn, setReplyOn] = useState(true);
  const [replyAudience, setReplyAudience] = useState<ReplyAudience>("all_except_trolls");
  const [audiencePrompt, setAudiencePrompt] = useState("");
  const [replyHowTo, setReplyHowTo] = useState("");
  // The gallery edits a DRAFT (reply_audience enum + merged audience_prompt),
  // committed on «Назад»/toggle so a filter pick and a description edit both
  // round-trip through one save.
  const [replyDraftAudience, setReplyDraftAudience] = useState<ReplyAudience>("all_except_trolls");
  const [replyDraftDesc, setReplyDraftDesc] = useState("");

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

  // The full catalog the gallery shows = backend presets + the synthetic
  // «Ответ на упоминания» (on_mention) + «Акция». Neither ships from the backend
  // today; if it ever ships an `on_mention` preset, prefer that one (dedupe by id).
  const catalog = useMemo(() => {
    const base = [...presets];
    if (!base.some((p) => p.id === MENTION_PRESET.id)) base.push(MENTION_PRESET);
    // boost («Комментарий-добавка при росте поста») — synthetic FE-only entry (the
    // backend ships no preset but accepts the `boost` create field). Add unless the
    // backend ever ships one (dedupe by id).
    if (!base.some((p) => p.id === BOOST_PRESET.id)) base.push(BOOST_PRESET);
    base.push(PROMO_PRESET);
    return base;
  }, [presets]);

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
    if (typeof ap.max_post_scenarios_per_day === "number") setCap(ap.max_post_scenarios_per_day);
    setReplyFreq(freqFromBackend(ap.reply_frequency));
    setReplyCeiling(ap.replies_per_day);
    // «Тихие часы» is ONE account window that pauses BOTH posts and auto-replies:
    // the reply pair (reply_quiet_*) and the post pair (quiet_*) are kept in sync by
    // every writer (this control + the advisor quiet-hours action). Read from the
    // reply pair, falling back to the post pair, so an advisor-set window (or a
    // half-synced row) still shows and can be cleared here.
    const from = hourToHHMM(ap.reply_quiet_start_hour ?? ap.quiet_start_hour);
    const to = hourToHHMM(ap.reply_quiet_end_hour ?? ap.quiet_end_hour);
    const on = from !== null && to !== null;
    setQuietOn(on);
    // Keep the last-shown window when the user toggles quiet off (so flipping it
    // back doesn't lose their hours); only overwrite from the config when set.
    if (from !== null) setQuietFrom(from);
    if (to !== null) setQuietTo(to);
    // Built-in reply routine: the card is ON when the account replies at all
    // (reply_mode ≠ off); «кому» = reply_audience (+ a free audience_prompt for
    // 'custom'). audience_prompt may be absent until the backend ships it.
    setReplyOn(ap.reply_mode !== "off");
    const aud = (ap.reply_audience as ReplyAudience) || "all_except_trolls";
    const prompt = ap.audience_prompt ?? "";
    setReplyAudience(aud);
    setAudiencePrompt(prompt);
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
      // Recent posts for the boost «post» target picker — non-blocking (empty on
      // failure; the picker then shows its honest "no posts" note).
      fetchPosts(id, { limit: 50 }).catch(() => ({ posts: [] as PostSummary[], count: 0 })),
    ])
      .then(([sc, pr, acc, ap, po]) => {
        setScenarios(sc.scenarios);
        setPresets(pr.presets);
        setAccounts(acc.accounts);
        setPosts(po.posts);
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

  // The localStorage scope for tip dismissals — the real account id, or a stable
  // «demo» bucket on the demo/gallery path.
  const tipScope = demoOn ? "demo" : accountId;
  // Hydrate dismissed-tip keys for the active account (prunes expired stamps).
  useEffect(() => {
    if (tipScope === null) return;
    setDismissed(readActiveDismissals(tipScope));
  }, [tipScope]);

  // Hide / restore a tip — flips local state and writes/clears the 7-day stamp.
  function dismissTip(adviceKey: string) {
    if (tipScope === null) return;
    setDismissed((p) => new Set(p).add(adviceKey));
    try {
      window.localStorage.setItem(tipDismissKey(tipScope, adviceKey), String(Date.now() + TIP_DISMISS_TTL_MS));
    } catch {
      /* no-op when storage is unavailable */
    }
  }
  function restoreTip(adviceKey: string) {
    if (tipScope === null) return;
    setDismissed((p) => {
      const n = new Set(p);
      n.delete(adviceKey);
      return n;
    });
    try {
      window.localStorage.removeItem(tipDismissKey(tipScope, adviceKey));
    } catch {
      /* no-op */
    }
  }

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
    // Built-in reply routine demo: a text preset («про цены») is selected so the
    // living sentence + gallery prefilled-description states both read on demo.
    const replyMode = tw.replyState ?? "on";
    setReplyOn(replyMode !== "off");
    setReplyAudience("custom");
    setAudiencePrompt(AUDIENCE_PRESETS.find((p) => p.id === "pricing")!.prompt);
    setReplyHowTo("коротко и тепло, без воды; на грубость не реагирую");
  }, [demoOn, tw.dark, tw.state, tw.master, tw.replyState]);

  // ── derived: does this preset produce replies / is reactive ──
  const presetId = form.preset?.id ?? "";
  const producesReplies = form.helperOn ? true : presetId ? presetProducesReplies(presetId) : false;
  const isReplyPolicy = !!form.preset && (form.preset.action_cfg?.kind as string) === "reply_policy";
  const isReactive = form.when === "event" && !!form.preset && eventKindOf(form.preset.trigger_cfg) !== "";
  // on_mention — a REACTIVE reply scenario (locked «когда меня упомянут»). Always
  // implies isReplyPolicy; the editor uses it to swap the «Когда» slot + rhythm.
  const isMentionReply = !!form.preset && (form.preset.trigger_cfg?.kind as string) === "on_mention";
  const bakedKeys = presetId ? BAKED_RULE_KEYS[presetId] ?? [] : [];
  const bakedRules = bakedKeys.map((k) => t(k as MessageKey));
  const vFields = visibleFields(form.preset);

  // ── boost target pickers (entry A) ──────────────────────────────────────────
  // «Постам сценария» picks among the account's POST-producing scenarios (a boost
  // watches posts a publisher routine made — reply/boost scenarios produce none).
  // «Конкретному посту» picks among recent posts (id + a short text preview).
  const boostScenarioOptions = useMemo(
    () =>
      scenarios
        .filter((s) => {
          const kind = (s.action_cfg?.kind as string) || "post";
          return kind === "post"; // promo + free cadence posts → kind "post"; reply/boost excluded
        })
        .map((s) => ({ id: s.id, label: s.name })),
    [scenarios],
  );
  const boostPostOptions = useMemo(
    () =>
      posts.map((p) => {
        const raw = (p.text ?? "").trim().replace(/\s+/g, " ");
        const label = raw ? (raw.length > 56 ? `${raw.slice(0, 56)}…` : raw) : `#${p.id}`;
        return { id: p.id, label };
      }),
    [posts],
  );

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

  // Coexistence: an ENABLED custom reply_policy scenario overrides the account's
  // built-in reply sweep. While one exists the built-in card pauses («Заменена
  // сценарием …») and that scenario carries the «перебивает дефолт» badge. On
  // demo the «paused» reply-state forces this so the state is reviewable.
  const activeReplyScenario = useMemo(
    () => scenarios.find((s) => s.enabled && (s.action_cfg?.kind as string) === "reply_policy") ?? null,
    [scenarios],
  );
  const replyPaused = demoOn ? tw.replyState === "paused" : activeReplyScenario !== null;
  const overridingScenarioId = replyPaused ? activeReplyScenario?.id ?? null : null;

  // ── control-center: context advice (Case A band + Case B conflict bracket) ──
  // Conflict (Case B): enabled POST scenarios (not reply_policy) that share the
  // same fixed post hour. A group of ≥2 → one shared bracket. Scenarios without a
  // fixed hour (asap / hourly / event) are never grouped.
  const conflictGroups = useMemo(() => {
    const byHour = new Map<number, Scenario[]>();
    for (const s of scenarios) {
      if (!s.enabled) continue;
      if ((s.action_cfg?.kind as string) === "reply_policy") continue;
      const h = postHour(s);
      if (h === null) continue;
      (byHour.get(h) ?? byHour.set(h, []).get(h)!).push(s);
    }
    return [...byHour.entries()]
      .filter(([, list]) => list.length >= 2)
      .map(([hour, list]) => ({ hour, scenarios: list }));
  }, [scenarios]);
  const conflictIds = useMemo(() => {
    const set = new Set<number>();
    for (const g of conflictGroups) for (const s of g.scenarios) set.add(s.id);
    return set;
  }, [conflictGroups]);
  const hourOfId = useMemo(() => {
    const m = new Map<number, number>();
    for (const g of conflictGroups) for (const s of g.scenarios) m.set(s.id, g.hour);
    return m;
  }, [conflictGroups]);

  // Case A: an enabled «Акция» (promo) running daily — UNLESS it's already part of
  // a conflict group (then the bracket owns it). The band attaches to this card.
  const promoCard = useMemo(
    () =>
      scenarios.find(
        (s) =>
          s.enabled &&
          s.template === "promo" &&
          !conflictIds.has(s.id) &&
          whenModeFromCfg(s.trigger_cfg, s.condition_cfg) === "daily",
      ) ?? null,
    [scenarios, conflictIds],
  );

  // ── advice objects (stable keys for dismissal) ──
  const promoAdvice: TipAdvice | null = promoCard
    ? {
        id: "promo",
        title: t("scenarios.tip.promo_title"),
        body: t("scenarios.tip.promo_body"),
        actions: [{ key: "spread", label: t("scenarios.tip.promo_action"), icon: "spread" }],
      }
    : null;
  // A Case-B advice for one conflict group. Names are bolded inline (`**name**`),
  // joined by «, » / « и » so the body reads like the design's «who» spans.
  function conflictAdvice(group: { hour: number; scenarios: Scenario[] }): TipAdvice {
    const n = group.scenarios.length;
    const time = fmtHour(group.hour);
    const quoted = group.scenarios.map((s) => `**«${s.name}»**`);
    const names = quoted.length <= 1 ? quoted.join("") : `${quoted.slice(0, -1).join(", ")} ${t("common.and")} ${quoted[quoted.length - 1]}`;
    const title = t(pluralKey(locale, n, { one: "scenarios.tip.conflict_title_one", few: "scenarios.tip.conflict_title_few", many: "scenarios.tip.conflict_title_many" })).replace("{n}", String(n));
    const body = t("scenarios.tip.conflict_body").replace("{names}", names).replace("{time}", time).replace("{cap}", String(cap));
    return { id: `conflict:${group.hour}`, title, body };
  }
  const conflictActions: TipAdvice["actions"] = [
    { key: "spread", label: t("scenarios.tip.conflict_spread"), icon: "spread" },
    { key: "raise", label: t("scenarios.tip.conflict_raise"), icon: "up" },
  ];

  // How many tips are currently hidden (would otherwise show) — drives the header
  // «N совет скрыт» pill. A tip "would show" if its trigger condition holds.
  const hiddenCount = useMemo(() => {
    let n = 0;
    if (promoAdvice && dismissed.has(promoAdvice.id)) n++;
    for (const g of conflictGroups) if (dismissed.has(`conflict:${g.hour}`)) n++;
    return n;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [promoCard, conflictGroups, dismissed]);
  // Restore ALL hidden tips (the header pill is a quiet "bring them back").
  function restoreAllTips() {
    if (promoAdvice && dismissed.has(promoAdvice.id)) restoreTip(promoAdvice.id);
    for (const g of conflictGroups) {
      const k = `conflict:${g.hour}`;
      if (dismissed.has(k)) restoreTip(k);
    }
  }

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
    // A boost scenario (on_post_metric → boost_comment) reopens in the boost
    // recipe; reconstruct its metric/threshold/comment/target for round-trip.
    const isBoost = isBoostScenario(s.trigger_cfg, s.action_cfg);
    const boost = boostFromCfg(s.trigger_cfg, s.action_cfg);
    // Layer 3 — reconstruct the per-scenario reply overrides from action_cfg so an
    // overridden setting reopens with its toggle ON + value (and an inherited one
    // OFF). `replyCeiling` is the live account cap a stored max_per_day is compared
    // against (== ⇒ inherited, ≠ ⇒ overridden). Audience is an override when the
    // saved audience differs from the inherited account audience (the КОМУ slot
    // already holds the saved value either way).
    const savedAudience = (s.action_cfg?.audience as string) || "all_except_trolls";
    const l3 = replyOverridesFromCfg(s.action_cfg, replyCeiling);
    const l3WhoOn = (s.action_cfg?.kind as string) === "reply_policy" && savedAudience !== replyAudience;
    // «Аудитория ответов» — a POST/PROMO scenario's per-post reply-audience
    // override (mutually exclusive with reply_policy, so `own` is false for a
    // «Дежурство»). When present, the КОМУ audience is read from the override, not
    // from action_cfg.audience (which only a reply_policy scenario carries).
    const pra = replyAudienceOverrideFromCfg(s.action_cfg);
    const when = whenModeFromCfg(s.trigger_cfg, s.condition_cfg);
    // best-effort: match a catalog preset for the baked-rules + reply detection
    const matched = matchPreset(s, catalog);
    const cc = s.condition_cfg ?? {};
    const cooldownHours = typeof cc.cooldown_hours === "number" ? (cc.cooldown_hours as number) : null;
    const cooldownDays = typeof cc.cooldown_days === "number" ? (cc.cooldown_days as number) : null;
    const f: FormState = {
      name: s.name,
      preset: matched,
      helperOn: usePromo,
      promo: usePromo && s.structured ? s.structured : { ...BLANK_PROMO },
      // Load the saved instruction AS-IS into the editor; the recipe content
      // shapers (topic/length/cta) start neutral so re-saving reproduces the
      // exact same instruction string (round-trip — incl. Sonya's «Акция»).
      instruction: usePromo || replyPolicy ? "" : s.instruction,
      replyInstruction: s.reply_instruction,
      // The КОМУ audience: from the reply-audience override for a POST/PROMO
      // scenario that set «Свои правила», else from action_cfg.audience (a
      // reply_policy «Дежурство») / the default.
      audience: pra.own ? pra.audience : (s.action_cfg?.audience as string) || "all_except_trolls",
      audiencePrompt: pra.own ? pra.audiencePrompt : "",
      when,
      nDays: (s.trigger_cfg?.n as number) ?? 3,
      // every_n_days «Начиная с» — restore the saved ISO start date (absent → "").
      startDate: (s.trigger_cfg?.start_date as string) || "",
      // weekly — reconstruct the multi-weekday selection: prefer a saved `weekdays`
      // array, else seed from a legacy single `weekday` (back-compat read), else
      // the design default Mon–Fri.
      weekdays: weekdaysFromCfg(s.trigger_cfg) ?? [0, 1, 2, 3, 4],
      perDay: perDayTimesFromCfg(s.trigger_cfg?.per_day_times) !== null,
      perDayTimes: perDayTimesFromCfg(s.trigger_cfg?.per_day_times) ?? {},
      // «Раз в месяц» / «Раз в год» — reconstructed from trigger_cfg so editing +
      // re-saving reproduces the same shape (absent → the design defaults).
      monthlyDays: monthlyDaysFromCfg(s.trigger_cfg) ?? [1, 15, 31],
      monthlyLastDay: (s.trigger_cfg?.last_day as boolean) === true,
      monthlyOnMissing: (s.trigger_cfg?.on_missing as string) === "skip" ? "skip" : "last",
      // milestone ladder — restore the saved `targets` (absent → default ladder).
      milestoneTargets: milestoneTargetsFromCfg(s.trigger_cfg) ?? [...MILESTONE_DEFAULT_TARGETS],
      yearlyDates: yearlyDatesFromCfg(s.trigger_cfg) ?? [
        { day: 1, month: 0 },
        { day: 29, month: 1 },
      ],
      dateFrom: (s.condition_cfg?.active_from as string) || "",
      dateTo: (s.condition_cfg?.active_to as string) || "",
      threshold: s.trigger_cfg?.threshold_views != null ? String(s.trigger_cfg.threshold_views) : "",
      eventKind: (s.trigger_cfg?.kind as string) === "on_follower_milestone" ? "on_follower_milestone" : "on_metric_threshold",
      // Schedule «Время»/«Разброс» — restored from the saved scenario (the backend
      // surfaces them top-level, sourced from trigger_cfg). Multi-slot scenarios
      // store `trigger_cfg.hours[]`; single-time ones a lone `hour` — reconstruct
      // the slot list from either (round-trip safe), `hour` mirrors the first slot.
      hours: scenarioHours(s) ?? [typeof scenarioHour(s) === "number" ? (scenarioHour(s) as number) : 9],
      hour: `${(scenarioHours(s) ?? [typeof scenarioHour(s) === "number" ? (scenarioHour(s) as number) : 9])[0]}:00`,
      jitter: scenarioJitter(s) ?? 15,
      // recipe condition builder — reconstructed from condition_cfg so editing +
      // saving keeps the same conditions (an absent key → that row is off).
      condNoPostToday: (cc.only_if_no_post_today as boolean) === true,
      cooldownOn: cooldownHours !== null || cooldownDays !== null,
      cooldownValue: cooldownDays ?? cooldownHours ?? 6,
      cooldownUnit: cooldownDays !== null ? "days" : "hours",
      maxFiresOn: typeof cc.max_fires === "number",
      maxFires: typeof cc.max_fires === "number" ? (cc.max_fires as number) : 3,
      topic: "",
      length: "any",
      cta: "",
      // КАК — restore the saved publish mode (absent → treat as 'auto', the
      // current backend default for legacy scenarios).
      mode: s.publish_mode === "ask" ? "ask" : "auto",
      // Layer 3 — start from the inert defaults, then flip ON + seed values for any
      // setting the saved scenario overrides (replyOverridesFromCfg + l3WhoOn).
      ...L3_FORM_DEFAULTS,
      l3WhoOn,
      l3LimitOn: l3.limitOn,
      l3Limit: l3.limit,
      l3FreqOn: l3.freqOn,
      l3Freq: l3.freq,
      l3QuietOn: l3.quietOn,
      l3QuietFrom: l3.quietFrom,
      l3QuietTo: l3.quietTo,
      // «Аудитория ответов» — start inert, then flip to «Свои правила» + seed the
      // skip-short override when the saved POST/PROMO scenario carries one.
      ...POST_REPLY_FORM_DEFAULTS,
      postReplyOwn: pra.own,
      postSkipShortOn: pra.skipShortOn,
      postSkipShort: pra.skipShort,
      // Boost — reconstruct from trigger_cfg/action_cfg when this is a boost
      // scenario (isBoost drives the editor into the boost recipe); inert
      // otherwise. A saved boost edits as entry "a" (the standalone editor) so the
      // user can change the target via the explicit picker.
      ...BOOST_FORM_DEFAULTS,
      ...(isBoost
        ? {
            isBoost: true,
            boostEntry: "a" as const,
            boostMetric: boost.metric,
            boostThreshold: boost.threshold,
            boostComment: boost.comment,
            boostTargetType: boost.targetType,
            boostScenarioId: boost.scenarioId,
            boostPostId: boost.postId,
          }
        : {}),
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
    // Already on ⇒ this dialog was opened to CHANGE the mode (not to enable), so
    // the toast should say "mode saved", not "turned on".
    const wasEnabled = s.enabled;
    setEnableBusy(true);
    // optimistic: flip on + record the chosen mode
    setScenarios((xs) => xs.map((x) => (x.id === s.id ? { ...x, enabled: true, publish_mode: mode } : x)));
    // The gate now reflects the real master («Правила дома»): a post scenario going
    // «Автоматически» while the master is off offers to turn the MASTER on inline
    // (post_enabled is dead post-merge — the worker gates only on `enabled`).
    if (opts.enableAutopost) setMasterOn(true);
    if (demoOn) {
      toast(wasEnabled ? t("scenarios.mode_saved") : t("scenarios.toast_on"));
      setEnableBusy(false);
      setPendingEnable(null);
      return;
    }
    try {
      // post + «Автоматически» with the master off → turn the master on inline
      if (opts.enableAutopost && accountId !== null) {
        const ap = await fetchAutopilot(accountId);
        const saved = await updateAutopilot(accountId, { ...ap, enabled: true });
        setApConfig(saved);
      }
      const saved = await updateScenario(s.id, { publish_mode: mode, enabled: true });
      setScenarios((xs) => xs.map((x) => (x.id === saved.id ? saved : x)));
      toast(wasEnabled ? t("scenarios.mode_saved") : t("scenarios.toast_on"));
    } catch (e) {
      // Roll back to the PRE-change snapshot (`s` predates the optimistic update),
      // restoring BOTH fields. On a failed enable that's `enabled:false` as before;
      // now that «Изменить» reuses this dialog for a RUNNING routine, it also restores
      // `enabled:true` + the original mode on a failed mode-change — so a transient
      // error never shows a live routine as OFF (or with the unsaved mode).
      setScenarios((xs) => xs.map((x) => (x.id === s.id ? { ...x, enabled: s.enabled, publish_mode: s.publish_mode } : x)));
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
  // backend's no-window). Toggling on commits the currently-shown From/To. The
  // window pauses BOTH posts and auto-replies, so every writer sets the POST pair
  // (quiet_*) AND the REPLY pair (reply_quiet_*) together — this keeps the worker's
  // two gates in sync and makes this control the single reader/editor/clearer of the
  // account «тихие часы» (incl. a window an advisor quiet-hours action set).
  function onQuiet(on: boolean) {
    const prev = quietOn;
    setQuietOn(on);
    const from = hhmmToHour(quietFrom);
    const to = hhmmToHour(quietTo);
    const patch = on
      ? {
          reply_quiet_start_hour: from,
          reply_quiet_end_hour: to,
          quiet_start_hour: from,
          quiet_end_hour: to,
        }
      : {
          reply_quiet_start_hour: null,
          reply_quiet_end_hour: null,
          quiet_start_hour: null,
          quiet_end_hour: null,
        };
    void saveAutopilot(patch, () => setQuietOn(prev));
  }
  function onQuietFrom(v: string) {
    const prev = quietFrom;
    setQuietFrom(v);
    if (!quietOn) return; // off → don't persist a window
    const h = hhmmToHour(v);
    void saveAutopilot(
      { reply_quiet_start_hour: h, quiet_start_hour: h },
      () => setQuietFrom(prev),
    );
  }
  function onQuietTo(v: string) {
    const prev = quietTo;
    setQuietTo(v);
    if (!quietOn) return;
    const h = hhmmToHour(v);
    void saveAutopilot(
      { reply_quiet_end_hour: h, quiet_end_hour: h },
      () => setQuietTo(prev),
    );
  }


  // ── built-in reply routine handlers ──────────────────────────────────────
  // Card toggle = account reply mode (off ↔ all). Optimistic + persisted via
  // saveAutopilot; we keep the legacy reply_enabled mirror consistent.
  function onReplyToggle(on: boolean) {
    const prev = replyOn;
    setReplyOn(on);
    void saveAutopilot(
      { reply_mode: on ? "all" : "off", reply_enabled: on },
      () => setReplyOn(prev),
    );
  }

  // «Настроить» → open the «кому отвечать» multi-select gallery, seeding its
  // draft from the live (audience enum + merged prompt); the gallery decomposes
  // the prompt back into lit tiles on mount.
  function openReplyGallery() {
    setReplyDraftAudience(replyAudience);
    setReplyDraftDesc(audiencePrompt);
    setView("reply-gallery");
  }

  // Commit the gallery draft → live state + persist. Group A → {reply_audience}
  // only; group B → {reply_audience:'custom', audience_prompt:<merged desc>}.
  function commitReplyDraft() {
    const reply_audience = replyDraftAudience;
    const audience_prompt = replyDraftAudience === "custom" ? replyDraftDesc : "";
    const prevAud = replyAudience;
    const prevPrompt = audiencePrompt;
    setReplyAudience(reply_audience);
    setAudiencePrompt(audience_prompt);
    void saveAutopilot({ reply_audience, audience_prompt }, () => {
      setReplyAudience(prevAud);
      setAudiencePrompt(prevPrompt);
    });
  }

  function backFromReplyGallery() {
    commitReplyDraft();
    setView("list");
  }

  // The «Правилах дома» inline link (reply-gallery foot): go back to the hub list
  // and open the House Rules header where frequency / quiet hours / ceiling live.
  function openHouseRules() {
    commitReplyDraft();
    setHrOpen(true);
    setView("list");
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
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
    // boost — the pre-written comment is required (the backend rejects an empty /
    // whitespace-only comment_text). The threshold falls back to the metric default
    // (so a blank threshold is fine), and the target defaults to «all».
    if (form.isBoost && !form.boostComment.trim()) {
      bad = true;
      toast(t("scenarios.bo.err_comment"), "error");
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
      toast(enable && !editing ? t("scenarios.toast_on") : t("scenarios.toast_saved"));
      backToList();
      return;
    }
    if (accountId === null) return;
    setSaving(true);
    try {
      const body = compileBody(form);
      let saved: Scenario;
      // «Сохранить и включить» — the editor's «Как публиковать» slot always wins
      // (compileBody carries it; on an existing scenario it's seeded from the
      // saved mode, so enabling never silently rewrites auto → ask). A
      // brand-new scenario of a shape whose body has NO publish_mode slot
      // (reply_duty/promo/boost) falls back to the safe ask default on EVERY
      // create — a plain-saved one would otherwise land on the backend's
      // 'auto' default and later enable straight into auto-publishing.
      if (editing) {
        // Editing NEVER touches enabled (A2): a disabled routine stays disabled
        // after «Сохранить» — arming happens only through the list card's
        // explicit toggle + EnableConfirm. The old `enabled: true` spread here
        // silently armed a routine the user opened "just to look".
        saved = await updateScenario(editing.id, body);
        setScenarios((xs) => xs.map((x) => (x.id === saved.id ? saved : x)));
      } else {
        saved = await createScenario(accountId, { ...body, enabled: enable, ...(body.publish_mode === undefined ? { publish_mode: "ask" } : {}) });
        setScenarios((xs) => [...xs, saved]);
      }
      // Entry C — a post-scenario with the «Бустер» section ON spins up a SEPARATE
      // boost scenario watching THIS scenario's posts (target {type:"scenario"}).
      // Created OFF (the user enables it like any routine); a failure here is
      // surfaced but doesn't undo the main save (the scenario itself is saved).
      const companion = !form.isBoost ? buildAttachedBoostBody(form, saved.id, saved.name, t("scenarios.bo.attach_name_suffix")) : null;
      if (companion) {
        try {
          const boostSaved = await createScenario(accountId, { ...companion, enabled: false });
          setScenarios((xs) => (xs.some((x) => x.id === boostSaved.id) ? xs : [...xs, boostSaved]));
          toast(t("scenarios.bo.attach_created"));
        } catch (e) {
          toast(String(e), "error");
        }
      }
      toast(enable && !editing ? t("scenarios.toast_on") : t("scenarios.toast_saved"));
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

  // The «Встроенная» group: a small section label + the always-present built-in
  // «Отвечать на комментарии» card, pinned FIRST in the routine area (shown in
  // both the first-run/empty state and the populated list).
  const builtInGroup = (
    <div className="flex flex-col gap-3">
      <GroupLabel icon={<IcSliders size={12} />}>{t("ap.reply.group.builtin")}</GroupLabel>
      <ReplyRoutineCard
        on={replyOn}
        paused={replyPaused}
        scenarioName={demoOn ? "Тёплый приём новичкам" : activeReplyScenario?.name}
        onOpenScenario={() => {
          if (activeReplyScenario) openEditor(activeReplyScenario);
        }}
        audienceId={presetIdFor(replyAudience, audiencePrompt)}
        audienceDescription={audiencePrompt}
        onToggle={onReplyToggle}
        onConfigure={openReplyGallery}
        lastReplyLabel={replyOn && !replyPaused ? (demoOn ? "12 мин назад" : undefined) : undefined}
      />
    </div>
  );

  // One control-center card with the shared prop wiring; `extra` carries the
  // per-card advice band / conflict time-chip when relevant.
  function cardFor(s: Scenario, extra?: { band?: TipAdvice; onDismissBand?: () => void; timechip?: string }) {
    return (
      <ScenarioCard
        key={s.id}
        s={s}
        accounts={otherAccounts}
        handle={handle}
        onToggle={toggle}
        onOpen={openEditor}
        onApply={applyToAccounts}
        onDelete={(sc) => setDelTarget(sc)}
        onChangeMode={(sc) => setPendingEnable(sc)}
        inheritFromHouseRules={(s.action_cfg?.kind as string) === "reply_policy"}
        overridesDefault={s.id === overridingScenarioId}
        band={extra?.band}
        onDismissBand={extra?.onDismissBand}
        timechip={extra?.timechip}
      />
    );
  }

  // Render «Твои рутины» in list order, emitting a Case-B bracket once at its
  // group's first member (skipping the rest), the Case-A band on the «Акция»
  // card, and an inline restore line where a dismissed tip used to be.
  function renderRoutines(): ReactNode {
    const out: ReactNode[] = [];
    const consumed = new Set<number>();
    for (const s of scenarios) {
      if (consumed.has(s.id)) continue;

      // Case B — this scenario opens a conflict group.
      if (conflictIds.has(s.id)) {
        const group = conflictGroups.find((g) => g.scenarios.some((x) => x.id === s.id))!;
        for (const x of group.scenarios) consumed.add(x.id);
        const advice = conflictAdvice(group);
        const isHidden = dismissed.has(advice.id);
        if (isHidden) {
          // collapsed back to normal cards + a restore line in the plaque's place
          for (const x of group.scenarios) out.push(cardFor(x));
          out.push(
            <TipRestoredLine key={`restore-${advice.id}`} name={group.scenarios[0].name} onRestore={() => restoreTip(advice.id)} />,
          );
        } else {
          out.push(
            <ConflictBracket key={`bracket-${advice.id}`} advice={{ ...advice, actions: conflictActions }} onDismiss={() => dismissTip(advice.id)}>
              {group.scenarios.map((x) => cardFor(x, { timechip: fmtHour(hourOfId.get(x.id)!) }))}
            </ConflictBracket>,
          );
        }
        continue;
      }

      // Case A — the «Акция» card carries a fused band (or a restore line when hidden).
      if (promoCard && s.id === promoCard.id && promoAdvice) {
        const isHidden = dismissed.has(promoAdvice.id);
        if (isHidden) {
          out.push(cardFor(s));
          out.push(
            <TipRestoredLine key={`restore-${promoAdvice.id}`} name={s.name} onRestore={() => restoreTip(promoAdvice.id)} />,
          );
        } else {
          out.push(cardFor(s, { band: promoAdvice, onDismissBand: () => dismissTip(promoAdvice.id) }));
        }
        continue;
      }

      out.push(cardFor(s));
    }
    return out;
  }

  return (
    <div className="min-h-screen bg-bg text-text">
      <AppTopbar
        maxW="960px"
        title={t("ap.title")}
        pill={
          activeCount > 0 ? (
            <TopbarPill tone="success">{t("scenarios.active").replace("{n}", String(activeCount))}</TopbarPill>
          ) : (
            <TopbarPill tone="neutral">{t("scenarios.all_off")}</TopbarPill>
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
        {/* H1 removed (SPEC задача 3): the topbar owns the word «Автопилот» —
            title + state-only pill; the page keeps only the quiet lead line. */}
        {view === "list" && (
          <p className="max-w-[60ch] text-small text-text-muted">{t("scenarios.subtitle")}</p>
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
            // Real account tz (IANA name from the config); demo shows a sample
            // zone so the hint still reads as a real offset. HouseRules derives
            // the "UTC+N" label + UTC-equivalent window from it.
            tz={demoOn ? "Europe/Warsaw" : (apConfig?.timezone ?? QUIET_TZ_LABEL)}
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
            enabled={editing?.enabled ?? false}
            nameErr={nameErr}
            fieldErrs={fieldErrs}
            askErr={askErr}
            vFields={vFields}
            producesReplies={producesReplies}
            isReplyPolicy={isReplyPolicy}
            isReactive={isReactive}
            isMentionReply={isMentionReply}
            isBoost={form.isBoost}
            boostScenarioOptions={boostScenarioOptions}
            boostPostOptions={boostPostOptions}
            l3Inherited={{
              // The live «Правила дома» reply values a scenario inherits, shown in
              // Layer 3 as «наследуется (значение)» per setting.
              audience: replyAudience,
              audiencePrompt,
              limit: replyCeiling,
              freq: replyFreq,
              quietOn,
              quietFrom,
              quietTo,
              // POST/PROMO «Аудитория ответов» inherit signals: the account's
              // skip-short value + whether replies are off (drives the warning).
              skipLowValue: apConfig?.reply_skip_low_value ?? true,
              replyOff: apConfig ? apConfig.reply_mode === "off" : !replyOn,
            }}
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
            onOpenHouseRules={() => {
              // The account reply audience / skip-short / limits live in «Правила
              // дома» on the list view — go back and open it.
              setHrOpen(true);
              backToList();
            }}
            deleting={deleting}
          />
        ) : view === "reply-gallery" ? (
          <ReplyAudienceGallery
            on={replyPaused ? false : replyOn}
            onToggle={(on) => {
              onReplyToggle(on);
            }}
            audience={replyDraftAudience}
            audiencePrompt={replyDraftDesc}
            onChange={(a, p) => {
              setReplyDraftAudience(a);
              setReplyDraftDesc(p);
            }}
            howTo={replyHowTo}
            onHowTo={setReplyHowTo}
            onBack={backFromReplyGallery}
            onHouseRules={openHouseRules}
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
          // visible but nothing runs until you turn the master on). The built-in
          // reply routine is ALWAYS present, so it shows above the teach-by-example.
          <div className={cn("flex flex-col gap-5 md:gap-[22px]", !masterOn && "pointer-events-none opacity-50 transition-opacity")}>
            {builtInGroup}
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
          <div className={cn("flex flex-col gap-5", !masterOn && "pointer-events-none opacity-50 transition-opacity")}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3.5 gap-y-0.5">
              <span className="text-h3 font-semibold tracking-tight">{t("ap.routines.title")}</span>
              <span className="text-small text-text-subtle">
                {t(pluralKey(locale, scenarios.length, { one: "ap.routines.count_one", few: "ap.routines.count_few", many: "ap.routines.count_many" }))
                  .replace("{total}", String(scenarios.length))
                  .replace("{active}", String(activeCount))}
              </span>
            </div>

            {/* «Встроенная» — the always-present built-in reply routine, pinned first */}
            {builtInGroup}

            {/* «Твои рутины» — the user's scenarios. Advice rides ON the routine it's
                about: Case A = a band fused to the «Акция» card; Case B = a shared
                bracket around the hour-conflicting group. A hidden tip → a quiet
                header pill + an inline restore line in its place. */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <GroupLabel icon={<IcSliders size={12} />}>{t("ap.reply.group.yours")}</GroupLabel>
                </div>
                <HiddenTipsPill count={hiddenCount} onShow={restoreAllTips} />
              </div>
              {renderRoutines()}
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
          </div>
        )}
      </main>

      <DeleteConfirm open={deleteOpen} deleting={deleting} onClose={() => setDeleteOpen(false)} onConfirm={doDelete} />
      <DeleteConfirm open={!!delTarget} deleting={delBusy} onClose={() => setDelTarget(null)} onConfirm={deleteFromCard} />
      <EnableConfirm scenario={pendingEnable} postAutopilotOn={masterOn} handle={handle} busy={enableBusy} onConfirm={confirmEnable} onCancel={() => setPendingEnable(null)} />

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
          <TweakSection label="Reply routine" />
          <TweakRadio label="Reply state" value={tw.replyState} options={["on", "off", "paused"]} onChange={(v) => setTw("replyState", v)} />
          <TweakSection label="State" />
          <TweakRadio label="State" value={tw.state} options={["List", "Empty", "Loading", "Error"]} onChange={(v) => setTw("state", v)} />
        </TweaksPanel>
      )}
    </div>
  );
}

// A routine-group label («Встроенная» / «Твои рутины») — an uppercase caption
// followed by a hairline rule (the SPEC's .rl-group-k), separating the built-in
// reply routine from the user's scenarios.
function GroupLabel({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 px-0.5 text-caption font-semibold uppercase tracking-[0.05em] text-text-subtle">
      <span className="shrink-0">{icon}</span>
      {children}
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

// Best-effort: match a saved scenario back to a catalog preset (by reply-policy
// shape or trigger kind) so the editor shows the right baked rules + reply block.
function matchPreset(s: Scenario, catalog: ScenarioPreset[]): ScenarioPreset | null {
  if (s.template === "promo") return catalog.find((p) => p.id === "promo") ?? null;
  // boost (on_post_metric → boost_comment) — match it FIRST so it doesn't fall
  // through to a cadence/reactive preset (its trigger kind is unique).
  if (isBoostScenario(s.trigger_cfg, s.action_cfg)) return catalog.find((p) => p.id === "boost") ?? BOOST_PRESET;
  // on_mention is a reply_policy action too — match it on its trigger FIRST so it
  // doesn't fall into «Дежурство». Falls back to MENTION_PRESET if the live
  // catalog somehow lacks it (it's injected client-side, not from the backend).
  if ((s.trigger_cfg?.kind as string) === "on_mention") {
    return catalog.find((p) => p.id === "on_mention") ?? MENTION_PRESET;
  }
  if ((s.action_cfg?.kind as string) === "reply_policy") return catalog.find((p) => p.id === "reply_duty") ?? null;
  const kind = (s.trigger_cfg?.kind as string) || "";
  if (kind === "on_metric_threshold") return catalog.find((p) => p.id === "amplify_viral") ?? null;
  if (kind === "on_follower_milestone") return catalog.find((p) => p.id === "milestone_thanks") ?? null;
  return null; // free scenario — no preset chrome
}

// Compile an EXISTING scenario into a create body for cross-account clone.
function scenarioToCreateBody(s: Scenario): Parameters<typeof createScenario>[1] {
  if (s.template === "promo" && s.structured) {
    return { name: s.name, promo: s.structured, publish_mode: s.publish_mode };
  }
  if ((s.action_cfg?.kind as string) === "reply_policy") {
    // on_mention carries its trigger (the worker selects it by trigger_cfg.kind);
    // a plain «Дежурство» clones without one (the comment sweep ignores it).
    // publish_mode rides every shape so a clone never loses the source's mode.
    const onMention = (s.trigger_cfg?.kind as string) === "on_mention";
    return {
      name: s.name,
      publish_mode: s.publish_mode,
      ...(onMention ? { trigger: { kind: "on_mention" } } : {}),
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
    publish_mode: s.publish_mode,
  };
}

// Read a saved scenario's schedule hour (0–23): prefer the backend's lifted
// top-level `hour`, fall back to `trigger_cfg.hour`, else null.
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
