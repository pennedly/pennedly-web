"use client";

// Scenarios (/app/scenarios) — recurring/conditional content. One page, three
// views: list · template picker · «Акция» editor (form + live preview). The
// engine + API are in pennedly-backend; this screen edits scenarios. Tester-gated,
// OFF by default. Built toward design-export/Scenarios-{WEB,MOBILE}-SPEC.html.

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
import { useTranslation } from "@/lib/i18n";
import { useTesterGuard } from "@/lib/tester";
import { cn } from "@/lib/cn";
import { AppTopbar, TopbarPill } from "@/components/AppTopbar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Toast, ToastHost } from "@/components/ui/toast";
import { IcArrowLeft, IcBubble, IcCheck, IcGift, IcPlus } from "@/components/icons";
import { TweaksPanel, TweakSection, TweakToggle, TweakRadio, useTweaks } from "@/components/tweaks/TweaksPanel";
import {
  DeleteConfirm,
  INPUT,
  ScenarioCard,
  ScenarioSkeleton,
  ScenariosEmpty,
  ScenariosError,
  TEXTAREA,
  TemplatePicker,
} from "@/components/studio/ScenariosParts";
import { DEMO_SCENARIOS, SCENARIOS_TWEAK_DEFAULTS } from "@/components/studio/scenarios-demo";
import type { Scenario, ScenarioPromoFields } from "@/lib/types";

const IS_DEV = process.env.NODE_ENV === "development";

const BLANK_PROMO: ScenarioPromoFields = {
  ask: "",
  reward: "",
  require_follow: true,
  require_like: true,
  reply_instruction: "",
  schedule: "daily",
  n_days: 3,
};

type ToastT = { id: number; message: string; tone: "success" | "error" };
type View = "list" | "picker" | "editor";

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
  const [name, setName] = useState("");
  const [promo, setPromo] = useState<ScenarioPromoFields>(BLANK_PROMO);
  const [cta, setCta] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [nameErr, setNameErr] = useState(false);
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

  useEffect(() => {
    if (demoParam) return;
    if (accountId === null) return;
    setLoaded(false);
    fetchScenarios(accountId)
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
  }, [accountId, router, demoParam]);

  // demo state machine
  useEffect(() => {
    if (!demoOn) return;
    document.documentElement.classList.toggle("dark", !!tw.dark);
    const st = tw.state;
    setBootError(st === "Error" ? "TypeError: Load failed" : null);
    setLoaded(st !== "Loading");
    setScenarios(st === "Empty" ? [] : DEMO_SCENARIOS);
  }, [demoOn, tw.dark, tw.state]);

  // live preview (debounced) — backend assembles the CTA from the fields
  useEffect(() => {
    if (view !== "editor") return;
    if (!promo.ask.trim() || !promo.reward.trim()) {
      setCta("");
      return;
    }
    if (demoOn || accountId === null) {
      setCta(`«${promo.ask}» → ${promo.reward}`);
      return;
    }
    const id = setTimeout(() => {
      previewScenario(accountId, promo).then((p) => setCta(p.cta)).catch(() => {});
    }, 500);
    return () => clearTimeout(id);
  }, [view, promo, demoOn, accountId]);

  const activeCount = useMemo(() => scenarios.filter((s) => s.enabled).length, [scenarios]);

  // ── handlers ──
  function openNew() {
    setView("picker");
  }
  function pickTemplate() {
    // v1: only «Акция» (promo) is selectable from the picker
    setEditing(null);
    setName("");
    setPromo(BLANK_PROMO);
    setCta("");
    setNameErr(false);
    setView("editor");
  }
  function openEditor(s: Scenario) {
    setEditing(s);
    setName(s.name);
    setPromo(s.structured ?? BLANK_PROMO);
    setNameErr(false);
    setView("editor");
  }
  function backToList() {
    setView("list");
    setEditing(null);
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

  async function save(enable: boolean) {
    if (!name.trim()) {
      setNameErr(true);
      return;
    }
    if (demoOn) {
      toast(t("scenarios.toast_saved"));
      backToList();
      return;
    }
    if (accountId === null) return;
    setSaving(true);
    try {
      let saved: Scenario;
      if (editing) {
        saved = await updateScenario(editing.id, { name: name.trim(), promo, ...(enable ? { enabled: true } : {}) });
        setScenarios((xs) => xs.map((x) => (x.id === saved.id ? saved : x)));
      } else {
        saved = await createScenario(accountId, { name: name.trim(), template: "promo", promo, enabled: enable });
        setScenarios((xs) => [...xs, saved]);
      }
      toast(enable ? t("scenarios.toast_on") : t("scenarios.toast_saved"));
      backToList();
    } catch (e) {
      toast(String(e), "error");
    } finally {
      setSaving(false);
    }
  }

  async function doDelete() {
    if (!editing) return;
    if (demoOn) {
      setScenarios((xs) => xs.filter((x) => x.id !== editing.id));
      setDeleteOpen(false);
      backToList();
      toast(t("scenarios.toast_deleted"));
      return;
    }
    setDeleting(true);
    try {
      await deleteScenario(editing.id);
      setScenarios((xs) => xs.filter((x) => x.id !== editing.id));
      setDeleteOpen(false);
      backToList();
      toast(t("scenarios.toast_deleted"));
    } catch (e) {
      toast(String(e), "error");
    } finally {
      setDeleting(false);
    }
  }

  if (checking) return null;

  if (bootError) {
    return (
      <div className="min-h-screen bg-bg text-text">
        <AppTopbar title={t("scenarios.title")} />
        <main className="mx-auto max-w-[960px] px-3.5 pt-4 md:px-6 md:pt-7">
          <div className="rounded-lg border border-danger/40 bg-danger/10 p-4 text-small text-danger">{bootError}</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-text">
      <AppTopbar
        title={t("scenarios.title")}
        pill={
          activeCount > 0 ? (
            <TopbarPill tone="success">{t("scenarios.active").replace("{n}", String(activeCount))}</TopbarPill>
          ) : undefined
        }
      />
      <main className="mx-auto max-w-[960px] space-y-4 px-3.5 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-4 md:space-y-5 md:px-6 md:pb-24 md:pt-7">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h1 className="text-h1 font-semibold tracking-tight">{t("scenarios.title")}</h1>
            <p className="max-w-[68ch] text-small text-text-muted">{t("scenarios.subtitle")}</p>
          </div>
          {view === "list" && scenarios.length > 0 && (
            <Button size="sm" onClick={openNew} icon={<IcPlus size={15} />} className="shrink-0 max-sm:hidden">
              {t("scenarios.new")}
            </Button>
          )}
        </div>

        {view === "picker" ? (
          <TemplatePicker onPick={pickTemplate} onBack={backToList} />
        ) : view === "editor" ? (
          <PromoEditorView
            t={t}
            name={name}
            setName={setName}
            nameErr={nameErr}
            promo={promo}
            setPromo={setPromo}
            cta={cta}
            saving={saving}
            isExisting={!!editing}
            onBack={backToList}
            onSave={() => save(false)}
            onSaveOn={() => save(true)}
            onDelete={() => setDeleteOpen(true)}
          />
        ) : !loaded ? (
          <div className="space-y-4">
            <ScenarioSkeleton />
            <ScenarioSkeleton />
          </div>
        ) : scenarios.length === 0 ? (
          <ScenariosEmpty onCreate={openNew} />
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

// ── «Акция» editor (form + sticky live preview) ──
function PromoEditorView({
  t,
  name,
  setName,
  nameErr,
  promo,
  setPromo,
  cta,
  saving,
  isExisting,
  onBack,
  onSave,
  onSaveOn,
  onDelete,
}: {
  t: (k: import("@/lib/i18n/messages/en").MessageKey) => string;
  name: string;
  setName: (v: string) => void;
  nameErr: boolean;
  promo: ScenarioPromoFields;
  setPromo: (p: ScenarioPromoFields) => void;
  cta: string;
  saving: boolean;
  isExisting: boolean;
  onBack: () => void;
  onSave: () => void;
  onSaveOn: () => void;
  onDelete: () => void;
}) {
  const set = <K extends keyof ScenarioPromoFields>(k: K, v: ScenarioPromoFields[K]) => setPromo({ ...promo, [k]: v });
  return (
    <div className="space-y-4">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-small text-text-muted hover:text-text">
        <IcArrowLeft size={16} /> {t("scenarios.back")}
      </button>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-[minmax(0,1fr)_360px]">
        {/* form */}
        <div className="space-y-5">
          <section className="rounded-lg border border-border bg-surface p-5 shadow-sm">
            <h2 className="mb-3.5 text-h3 font-semibold tracking-tight">{t("scenarios.sec.what")}</h2>
            <div className="space-y-3.5">
              <label className="block">
                <span className="mb-1 block text-caption font-medium text-text-muted">{t("scenarios.f.name")}</span>
                <input className={cn(INPUT, nameErr && "border-danger focus:border-danger focus:ring-danger/25")} value={name} onChange={(e) => setName(e.target.value)} placeholder={t("scenarios.f.name_ph")} />
                {nameErr && <span className="mt-1 block text-caption text-danger">{t("scenarios.err_required")}</span>}
              </label>
              <label className="block">
                <span className="mb-1 block text-caption font-medium text-text-muted">{t("scenarios.f.ask")}</span>
                <input className={INPUT} value={promo.ask} onChange={(e) => set("ask", e.target.value)} placeholder={t("scenarios.f.ask_ph")} />
              </label>
              <label className="block">
                <span className="mb-1 block text-caption font-medium text-text-muted">{t("scenarios.f.reward")}</span>
                <input className={INPUT} value={promo.reward} onChange={(e) => set("reward", e.target.value)} placeholder={t("scenarios.f.reward_ph")} />
              </label>
              <div className="flex flex-col gap-2.5 border-t border-border pt-3.5">
                <label className="flex items-center justify-between gap-3 text-small">
                  <span>{t("scenarios.f.require_follow")}</span>
                  <Switch checked={promo.require_follow} onCheckedChange={(v) => set("require_follow", v)} aria-label={t("scenarios.f.require_follow")} />
                </label>
                <label className="flex items-center justify-between gap-3 text-small">
                  <span>{t("scenarios.f.require_like")}</span>
                  <Switch checked={promo.require_like} onCheckedChange={(v) => set("require_like", v)} aria-label={t("scenarios.f.require_like")} />
                </label>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-surface p-5 shadow-sm">
            <h2 className="mb-3.5 text-h3 font-semibold tracking-tight">{t("scenarios.sec.when")}</h2>
            <div className="inline-flex w-full rounded-lg border border-border bg-surface-2 p-0.5 text-small">
              {(["daily", "every_n_days"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => set("schedule", m)}
                  aria-pressed={promo.schedule === m}
                  className={cn(
                    "flex-1 whitespace-normal rounded-md px-3 py-2 font-medium transition-colors max-md:min-h-[44px]",
                    promo.schedule === m ? "bg-surface text-text shadow-sm" : "text-text-muted hover:text-text",
                  )}
                >
                  {m === "daily" ? t("scenarios.sched.daily") : t("scenarios.sched.every_n")}
                </button>
              ))}
            </div>
            {promo.schedule === "every_n_days" && (
              <label className="mt-3 block max-w-[140px]">
                <span className="mb-1 block text-caption font-medium text-text-muted">{t("scenarios.f.n_days")}</span>
                <input type="number" min={1} max={90} className={INPUT} value={promo.n_days} onChange={(e) => set("n_days", Math.max(1, Number(e.target.value) || 1))} />
              </label>
            )}
          </section>

          <section className="rounded-lg border border-border bg-surface p-5 shadow-sm">
            <h2 className="mb-3.5 text-h3 font-semibold tracking-tight">{t("scenarios.sec.reply")}</h2>
            <textarea rows={3} className={TEXTAREA} value={promo.reply_instruction} onChange={(e) => set("reply_instruction", e.target.value)} placeholder={t("scenarios.f.reply_ph")} />
          </section>
        </div>

        {/* live preview (sticky on desktop) */}
        <aside className="md:sticky md:top-4 md:self-start">
          <div className="rounded-lg border border-border bg-surface p-5 shadow-sm">
            <h2 className="mb-3 text-caption font-semibold uppercase tracking-wide text-text-subtle">{t("scenarios.preview")}</h2>
            {cta ? (
              <div className="space-y-3">
                <div className="rounded-md border border-accent/25 bg-accent/8 p-3 text-small leading-relaxed text-text">
                  <span className="mb-1 block text-caption font-medium text-accent">{t("scenarios.preview_cta")}</span>
                  {cta}
                </div>
                <div className="rounded-md border border-border bg-surface-2 p-3 text-small text-text-muted">
                  <span className="mb-1 flex items-center gap-1.5 text-caption font-medium text-accent">
                    <IcBubble size={12} /> {t("scenarios.preview_reply")}
                  </span>
                  {promo.reply_instruction || t("scenarios.f.reply_ph")}
                </div>
              </div>
            ) : (
              <p className="flex items-center gap-2 text-small text-text-subtle">
                <IcGift size={16} /> {t("scenarios.preview_empty")}
              </p>
            )}
          </div>
        </aside>
      </div>

      {/* action bar */}
      <div className="flex flex-col-reverse gap-2.5 border-t border-border pt-4 sm:flex-row sm:items-center">
        {isExisting && (
          <button onClick={onDelete} className="text-small font-medium text-danger hover:underline sm:mr-auto max-sm:py-2">
            {t("scenarios.delete")}
          </button>
        )}
        <Button variant="secondary" onClick={onSave} loading={saving} className="max-sm:w-full sm:ml-auto">
          {t("scenarios.save")}
        </Button>
        <Button variant="primary" onClick={onSaveOn} loading={saving} icon={<IcCheck size={15} />} className="max-sm:w-full">
          {t("scenarios.save_on")}
        </Button>
      </div>
    </div>
  );
}
