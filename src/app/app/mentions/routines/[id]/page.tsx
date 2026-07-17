"use client";

// Mention-routine constructor route — create (`/new`) or edit (`/:id`). Renders the
// recipe editor; save creates/updates an on_mention scenario (intent/requires_media/
// publish_mode/reply_instruction). Slice 2 of the mention-routines build.

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import "@/components/studio/mention-routines.css";
import {
  ApiError,
  clearTokens,
  createScenario,
  deleteScenario,
  fetchMe,
  fetchScenarios,
  getTokens,
  updateScenario,
} from "@/lib/api";
import { useSelectedAccountId } from "@/lib/account";
import { useTranslation } from "@/lib/i18n";
import { useTesterGuard } from "@/lib/tester";
import { TweaksPanel, TweakSection, TweakToggle, TweakRadio, useTweaks } from "@/components/tweaks/TweaksPanel";
import {
  MentionRoutineConstructor,
  emptyConfig,
  type MRConfig,
} from "@/components/studio/mention-routines-constructor";
import { ensureAutopilotMaster, isMentionRoutine } from "@/components/studio/mention-routines";
import type { Scenario, ScenarioCreate } from "@/lib/types";

const IS_DEV = process.env.NODE_ENV === "development";
const HUB = "/app/mentions/routines";

const asStr = (v: unknown): string => (typeof v === "string" ? v : "");

function scenarioToConfig(s: Scenario): MRConfig {
  const goal = asStr(s.trigger_cfg?.intent).trim();
  const rm = asStr(s.trigger_cfg?.requires_media).toLowerCase();
  const image = asStr(s.trigger_cfg?.action) === "generate_image";
  return {
    name: s.name,
    goal,
    catchall: goal === "",
    media: rm === "image" ? "image" : rm === "none" ? "none" : "any",
    action: image ? "image" : "voice",
    mode: s.publish_mode === "auto" ? "auto" : "ask",
    inst: s.reply_instruction ?? "",
    imagePrompt: asStr(s.trigger_cfg?.image_prompt),
  };
}

function configToBody(cfg: MRConfig, enable: boolean, fallbackName: string): ScenarioCreate {
  const trigger: Record<string, unknown> = { kind: "on_mention" };
  if (!cfg.catchall && cfg.goal.trim()) trigger.intent = cfg.goal.trim();
  if (cfg.media !== "any") trigger.requires_media = cfg.media;
  if (cfg.action === "image") {
    // A generated-photo routine (Phase 4) — the backend forces publish_mode='ask'.
    trigger.action = "generate_image";
    if (cfg.imagePrompt.trim()) trigger.image_prompt = cfg.imagePrompt.trim();
  }
  return {
    name: cfg.name.trim() || fallbackName,
    enabled: enable,
    publish_mode: cfg.action === "image" ? "ask" : cfg.mode,
    trigger,
    reply_instruction: cfg.inst.trim(),
  };
}

const DEMO_CFG: MRConfig = {
  name: "Сгенерировать по фото",
  goal: "прислали фото и просят показать их будущего ребёнка",
  catchall: false,
  media: "image",
  action: "image",
  mode: "ask",
  inst: "",
  imagePrompt: "покажи их будущего ребёнка, сохрани черты лиц, тёплый фотореализм",
};
const OPEN_MAP: Record<string, "goal" | "media" | "action" | "mode" | null> = {
  None: null,
  Goal: "goal",
  Media: "media",
  Action: "action",
  Mode: "mode",
};
// Module-level so the value types widen (dark → boolean), matching setTw's signature.
const MRC_TWEAK_DEFAULTS = { dark: false, open: "None", variant: "New" };

export default function MentionRoutineConstructorPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { t } = useTranslation();
  const rawId = params.id;
  const isNew = rawId === "new";
  const scenarioId = isNew ? null : Number(rawId);

  const [demoParam] = useState(() =>
    typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("demo") === "1" : false,
  );
  const { checking } = useTesterGuard(demoParam);
  const [isTester, setIsTester] = useState(false);
  const demoOn = demoParam && (IS_DEV || isTester);

  const accountId = useSelectedAccountId();
  const [config, setConfig] = useState<MRConfig | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tw, setTw] = useTweaks(MRC_TWEAK_DEFAULTS);

  useEffect(() => {
    if (demoParam) return;
    if (!getTokens()) router.push("/app/login");
  }, [router, demoParam]);

  useEffect(() => {
    if (!getTokens()) return;
    fetchMe().then((m) => setIsTester(m.is_tester === true)).catch(() => {});
  }, []);

  // Live: seed a new routine, or load the scenario to edit.
  useEffect(() => {
    if (demoParam) return;
    if (isNew) {
      setConfig({ ...emptyConfig(), name: t("mrc.default_name") });
      setEnabled(false);
      return;
    }
    if (accountId === null || scenarioId === null) return;
    if (Number.isNaN(scenarioId)) {
      router.push(HUB);
      return;
    }
    fetchScenarios(accountId)
      .then((list) => {
        const s = list.scenarios.find((x) => x.id === scenarioId);
        // Guard the kind: editing a non-mention scenario here would let Save
        // overwrite its trigger into an on_mention routine (silent corruption).
        if (!s || !isMentionRoutine(s)) {
          router.push(HUB);
          return;
        }
        setConfig(scenarioToConfig(s));
        setEnabled(s.enabled);
      })
      .catch((e) => {
        if (e instanceof ApiError && e.status === 401) {
          clearTokens();
          router.push("/app/login");
          return;
        }
        router.push(HUB);
      });
  }, [demoParam, isNew, accountId, scenarioId, router, t]);

  useEffect(() => {
    if (!demoOn) return;
    document.documentElement.classList.toggle("dark", !!tw.dark);
  }, [demoOn, tw.dark]);

  const onSave = useCallback(
    async (cfg: MRConfig, enable: boolean) => {
      if (demoOn || accountId === null) return;
      const fallback = cfg.catchall ? t("mrc.default_name_catchall") : t("mrc.default_name");
      setBusy(true);
      try {
        if (isNew) {
          await createScenario(accountId, configToBody(cfg, enable, fallback));
        } else if (scenarioId !== null) {
          await updateScenario(scenarioId, configToBody(cfg, enable, fallback));
        }
        // Saving-and-enabling is a no-op unless the autopilot master is on too.
        if (enable) await ensureAutopilotMaster(accountId);
        router.push(HUB);
      } catch {
        setBusy(false);
      }
    },
    [demoOn, accountId, isNew, scenarioId, router, t],
  );

  const onDelete = useCallback(async () => {
    if (demoOn || scenarioId === null) return;
    setBusy(true);
    try {
      await deleteScenario(scenarioId);
      router.push(HUB);
    } catch {
      setBusy(false);
    }
  }, [demoOn, scenarioId, router]);

  const demoVariantNew = tw.variant === "New";
  const demoConfig = useMemo(() => ({ ...DEMO_CFG }), []);

  if (checking) return null;

  // Demo: remount on tweak change to re-seed the initial config / open drawer.
  if (demoOn) {
    return (
      <>
        <MentionRoutineConstructor
          key={`${tw.open}-${tw.variant}`}
          initial={demoConfig}
          initialSlot={OPEN_MAP[tw.open] ?? null}
          isNew={demoVariantNew}
          enabled={!demoVariantNew}
          t={t}
          onBack={() => router.push(HUB)}
        />
        <TweaksPanel title="Routine constructor">
          <TweakSection label="Appearance" />
          <TweakToggle label="Dark mode" value={tw.dark} onChange={(v) => setTw("dark", v)} />
          <TweakSection label="State" />
          <TweakRadio label="Variant" value={tw.variant} options={["New", "Edit"]} onChange={(v) => setTw("variant", v)} />
          <TweakRadio
            label="Open drawer"
            value={tw.open}
            options={["None", "Goal", "Media", "Action", "Mode"]}
            onChange={(v) => setTw("open", v)}
          />
        </TweaksPanel>
      </>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen bg-bg px-6 py-8">
        <div className="mx-auto max-w-[1080px]">
          <div className="h-64 animate-pulse rounded-xl border border-border bg-surface-2/60" />
        </div>
      </div>
    );
  }

  return (
    <MentionRoutineConstructor
      initial={config}
      isNew={isNew}
      enabled={enabled}
      busy={busy}
      t={t}
      onBack={() => router.push(HUB)}
      onSave={onSave}
      onDelete={isNew ? undefined : onDelete}
    />
  );
}
