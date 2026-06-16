"use client";

// Autopilot — opt-in, OFF by default. A global master switch + a list of
// "scheduled posts" (each posts once a day at its hour, optional topic, own
// seed-replies toggle), an account-level auto-reply policy, and a read-only
// activity log. Tester-gated. The autopilot_tick worker reads these; this
// screen only edits them. Layout per design-export/PennedlyDesign/autopilot-*.

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import {
  ApiError,
  clearTokens,
  createAutopostRule,
  deleteAutopostRule,
  fetchAutopilot,
  fetchAutopostActivity,
  fetchAutopostRules,
  fetchMe,
  getTokens,
  setAutopilotMaster,
  updateAutopilot,
  updateAutopostRule,
} from "@/lib/api";
import { captureEvent } from "@/lib/analytics";
import { useSelectedAccountId } from "@/lib/account";
import { useTranslation, useLocale, pluralUnit } from "@/lib/i18n";
import { useTesterGuard } from "@/lib/tester";
import { localHourToUtc, localUtcOffsetLabel, utcHourToLocal } from "@/lib/timezone";
import { AppTopbar, TopbarPill } from "@/components/AppTopbar";
import { Button, buttonClasses } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/feedback";
import { Toast, ToastHost } from "@/components/ui/toast";
import { Mono } from "@/components/ui/mono";
import { cn } from "@/lib/cn";
import {
  IcAlert,
  IcBubble,
  IcCheck,
  IcClock,
  IcExternal,
  IcEye,
  IcHeart,
  IcPlus,
  IcTrash,
} from "@/components/icons";
import { useDeferredCommit } from "@/lib/use-deferred-commit";
import { TweaksPanel, TweakSection, TweakToggle, TweakRadio, useTweaks } from "@/components/tweaks/TweaksPanel";
import { AP_TWEAK_DEFAULTS, DEMO_ACTIVITY, DEMO_CONFIG, DEMO_RULES, DEMO_TOPICS } from "@/components/studio/autopilot-demo";
import type {
  AutopilotConfig,
  AutopostActivity,
  AutopostRule,
  TopicOption,
} from "@/lib/types";

type Toast = {
  id: number;
  message: string;
  tone: "success" | "error";
  onUndo?: () => void;
  undoLabel?: string;
};

// Q24: how long a deleted rule stays undoable before the delete commits.
const UNDO_MS = 5000;

function insertAt<T>(arr: T[], index: number, item: T): T[] {
  const next = arr.slice();
  next.splice(Math.min(Math.max(index, 0), next.length), 0, item);
  return next;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const JITTERS = [0, 5, 15, 30];
const IS_DEV = process.env.NODE_ENV === "development";
const AP_STATES = ["On", "Off", "Edit", "Empty", "PolicyOff", "Replies", "Loading"];
const SELECT =
  "h-9 w-full rounded-md border border-border bg-surface px-2.5 text-small text-text transition-colors focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent max-md:min-h-[44px] max-md:text-[16px]";
// Daily reply cap is a free numeric field (1–500). Above this we show a banner
// about Threads' ~250/day publish limit + spam-flag risk (it's advisory, not a
// hard block — power users can still set higher).
const NUMFIELD =
  "h-9 w-[120px] rounded-md border border-border bg-surface px-2.5 text-center text-small text-text tabular-nums transition-colors focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent max-md:min-h-[44px] max-md:text-[16px]";
const REPLIES_WARN_AT = 200;

function fmtDate(iso: string | null, locale: string): string {
  if (!iso) return "";
  const loc = locale === "ru" ? "ru-RU" : locale === "en" ? "en-US" : locale;
  return new Date(iso).toLocaleDateString(loc, { month: "short", day: "numeric" });
}

export default function AutopilotPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const locale = useLocale();
  const [demoParam] = useState(() =>
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("demo") === "1"
      : false,
  );
  const { checking } = useTesterGuard(demoParam);
  const [isTester, setIsTester] = useState(false);
  const allow = demoParam && (IS_DEV || isTester);
  const demoOn = allow;
  const accountId = useSelectedAccountId();
  const [master, setMaster] = useState(false);
  const [config, setConfig] = useState<AutopilotConfig | null>(null);
  const [rules, setRules] = useState<AutopostRule[]>([]);
  const [topics, setTopics] = useState<TopicOption[]>([]);
  const [activity, setActivity] = useState<AutopostActivity | null>(null);
  const [actTab, setActTab] = useState<"posts" | "replies">("posts");
  const [loaded, setLoaded] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);
  const [confirmOn, setConfirmOn] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const deferred = useDeferredCommit();
  const [tw, setTw] = useTweaks(AP_TWEAK_DEFAULTS);

  function toast(
    message: string,
    tone: Toast["tone"] = "success",
    opts?: { onUndo?: () => void; undoLabel?: string; duration?: number },
  ) {
    const id = Date.now() + Math.random();
    setToasts((s) => [
      ...s,
      { id, message, tone, onUndo: opts?.onUndo, undoLabel: opts?.undoLabel },
    ]);
    setTimeout(
      () => setToasts((s) => s.filter((x) => x.id !== id)),
      opts?.duration ?? 3500,
    );
    return id;
  }

  function dismissToast(id: number) {
    setToasts((s) => s.filter((x) => x.id !== id));
  }

  useEffect(() => {
    if (demoParam) return;
    if (!getTokens()) router.push("/app/login");
  }, [router, demoParam]);

  useEffect(() => {
    if (!getTokens()) return;
    fetchMe().then((m) => setIsTester(m.is_tester === true)).catch(() => {});
  }, []);

  useEffect(() => {
    if (demoParam) return;
    if (accountId === null) return;
    setLoaded(false);
    (async () => {
      try {
        const [data, cfg] = await Promise.all([
          fetchAutopostRules(accountId),
          fetchAutopilot(accountId),
        ]);
        setMaster(data.master_enabled);
        setConfig(cfg);
        setRules(data.rules);
        setTopics(data.topics);
        fetchAutopostActivity(accountId).then(setActivity).catch(() => {});
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          clearTokens();
          router.push("/app/login");
          return;
        }
        setBootError(String(e));
      } finally {
        setLoaded(true);
      }
    })();
  }, [accountId, router]);

  useEffect(() => {
    if (!demoOn) return;
    document.documentElement.classList.toggle("dark", !!tw.dark);
  }, [demoOn, tw.dark]);

  useEffect(() => {
    if (!demoOn) return;
    const st = tw.state;
    setBootError(null);
    if (st === "Loading") {
      setLoaded(false);
      return;
    }
    setMaster(st !== "Off");
    setTopics(DEMO_TOPICS);
    setRules(st === "Empty" ? [] : DEMO_RULES.map((r) => ({ ...r })));
    setConfig({ ...DEMO_CONFIG, reply_mode: st === "PolicyOff" ? "off" : "all", reply_enabled: st !== "PolicyOff" });
    setActivity(st === "Empty" ? { rules: [], posts_total: 0, replies_total: 0, posts: [], replies: [] } : DEMO_ACTIVITY);
    setActTab(st === "Replies" ? "replies" : "posts");
    setLoaded(true);
  }, [demoOn, tw.state]);

  async function doSetMaster(v: boolean) {
    if (demoOn) {
      setMaster(v);
      setConfig((c) => (c ? { ...c, enabled: v } : c));
      setTw("state", v ? "On" : "Off");
      return;
    }
    if (accountId === null) return;
    setMaster(v);
    setConfig((c) => (c ? { ...c, enabled: v } : c));
    captureEvent("ui.autopilot_master", { account_id: accountId, enabled: v });
    try {
      await setAutopilotMaster(accountId, v);
      toast(v ? t("autopilot.toast_on") : t("autopilot.toast_off"));
    } catch (e) {
      setMaster(!v);
      setConfig((c) => (c ? { ...c, enabled: !v } : c));
      toast(String(e), "error");
    }
  }

  // Enabling is deliberate → confirm; pausing is immediate.
  function requestMaster(v: boolean) {
    if (v) setConfirmOn(true);
    else doSetMaster(false);
  }

  async function onReply(patch: Partial<AutopilotConfig>) {
    if (config === null) return;
    if (demoOn) {
      setConfig((c) => {
        if (!c) return c;
        const n = { ...c, ...patch };
        n.reply_enabled = n.reply_mode !== "off";
        return n;
      });
      return;
    }
    if (accountId === null) return;
    const prev = config;
    const next = { ...config, ...patch };
    // Keep the legacy boolean in sync with the mode so an old backend (during
    // the deploy window) still reads the right reply master.
    next.reply_enabled = next.reply_mode !== "off";
    setConfig(next);
    captureEvent("ui.autopilot_reply_policy", { account_id: accountId, ...patch });
    try {
      await updateAutopilot(accountId, next);
    } catch (e) {
      setConfig(prev);
      toast(String(e), "error");
    }
  }

  async function onAdd() {
    if (demoOn) {
      const rule: AutopostRule = { id: Date.now(), name: null, topic_id: null, post_hour: 8, jitter_minutes: 15, enabled: false, auto_reply: false, reply_audience: "", replies_per_day: 0 };
      setRules((rs) => [...rs, rule]);
      return;
    }
    if (accountId === null) return;
    captureEvent("ui.autopilot_add_object", { account_id: accountId });
    try {
      const rule = await createAutopostRule(accountId, { post_hour: localHourToUtc(9) });
      setRules((rs) => [...rs, rule]);
    } catch (e) {
      toast(String(e), "error");
    }
  }

  async function patchRule(id: number, patch: Partial<AutopostRule>) {
    setRules((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    if (demoOn) return;
    try {
      await updateAutopostRule(id, patch);
    } catch (e) {
      toast(String(e), "error");
    }
  }

  // Q24: optimistic + Undo. The rule leaves the list immediately; the real
  // delete is deferred and an Undo toast can cancel it before it fires.
  function onDelete(rule: AutopostRule) {
    const idx = rules.findIndex((r) => r.id === rule.id);
    setRules((rs) => rs.filter((r) => r.id !== rule.id));
    setConfirmDelete(null);
    if (demoOn) {
      toast(t("autopilot.toast_rule_deleted"), "success", {
        duration: UNDO_MS,
        undoLabel: t("common.undo"),
        onUndo: () => setRules((rs) => insertAt(rs, idx, rule)),
      });
      return;
    }
    const key = `rule-${rule.id}`;
    deferred.schedule(
      key,
      async () => {
        try {
          await deleteAutopostRule(rule.id);
        } catch (e) {
          setRules((rs) => insertAt(rs, idx, rule));
          toast(String(e), "error");
        }
      },
      UNDO_MS,
    );
    toast(t("autopilot.toast_rule_deleted"), "success", {
      duration: UNDO_MS,
      undoLabel: t("common.undo"),
      onUndo: () => {
        deferred.cancel(key);
        setRules((rs) => insertAt(rs, idx, rule));
      },
    });
  }

  if (checking) return null;

  if (bootError) {
    return (
      <div className="min-h-screen bg-bg text-text">
        <AppTopbar title={t("autopilot.title")} />
        <main className="mx-auto max-w-[720px] px-3.5 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-4 md:px-6 md:pb-24 md:pt-7">
          <div className="rounded-lg border border-danger/40 bg-danger/10 p-4 text-small text-danger">
            {bootError}
          </div>
        </main>
      </div>
    );
  }

  const hasActivity =
    !!activity && (activity.posts.length > 0 || activity.replies.length > 0);

  return (
    <div className="min-h-screen bg-bg text-text">
      <AppTopbar
        title={t("autopilot.title")}
        pill={master ? <TopbarPill tone="success">{t("autopilot.active")}</TopbarPill> : undefined}
      />
      <main className="mx-auto max-w-[720px] space-y-4 px-3.5 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-4 md:space-y-5 md:px-6 md:pb-24 md:pt-7">
        <div className="flex flex-col gap-1">
          <h1 className="text-h1 font-semibold">{t("autopilot.title")}</h1>
          <p className="max-w-[60ch] text-small text-text-muted">{t("autopilot.subtitle")}</p>
        </div>

        {!loaded ? (
          <div className="space-y-4 md:space-y-5">
            <Skeleton className="h-[90px] w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-lg" />
          </div>
        ) : (
          <>
            {/* Master card */}
            <div
              className={cn(
                "flex items-center gap-4 rounded-xl border bg-surface p-5 shadow-sm transition-colors",
                master ? "border-success/30" : "border-border",
              )}
            >
              <span
                className={cn(
                  "grid h-12 w-12 shrink-0 place-items-center rounded-lg border",
                  master
                    ? "border-success/30 bg-success/12 text-success"
                    : "border-border bg-surface-2 text-text-muted",
                )}
              >
                <IcClock size={24} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-h2 font-semibold tracking-tight">{t("autopilot.title")}</div>
                <div
                  className={cn(
                    "mt-1 inline-flex items-center gap-1.5 text-small",
                    master ? "font-medium text-success" : "text-text-muted",
                  )}
                >
                  <span
                    className={cn("h-[7px] w-[7px] rounded-full", master ? "bg-success" : "bg-text-subtle")}
                  />
                  {master ? t("autopilot.master_on") : t("autopilot.master_off")}
                </div>
              </div>
              <Switch
                checked={master}
                onCheckedChange={requestMaster}
                aria-label={t("autopilot.master")}
              />
            </div>

            {/* Reassurance when off */}
            {!master && (
              <div className="flex items-start gap-2.5 rounded-md border border-border bg-surface-2 px-4 py-3 text-small leading-relaxed text-text-muted">
                <IcCheck size={16} className="mt-0.5 shrink-0 text-text-subtle" />
                <div>
                  <b className="font-semibold text-text">{t("autopilot.reassure_lead")}</b>{" "}
                  {t("autopilot.reassure_body")}
                </div>
              </div>
            )}

            {/* Scheduled posts */}
            <section className="rounded-lg border border-border bg-surface p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3.5">
                <div className="min-w-0">
                  <h2 className="text-h3 font-semibold tracking-tight">
                    {t("autopilot.schedules_title")}
                  </h2>
                  <p className="mt-0.5 text-small text-text-subtle">
                    {t("autopilot.schedules_sub")}
                  </p>
                </div>
                {rules.length > 0 && (
                  <Button size="sm" variant="secondary" onClick={onAdd} icon={<IcPlus size={15} />} className="shrink-0">
                    {t("autopilot.add")}
                  </Button>
                )}
              </div>

              {rules.length === 0 ? (
                <div className="flex flex-col items-center rounded-md border border-dashed border-border px-6 py-10 text-center">
                  <span className="mb-3.5 grid h-[46px] w-[46px] place-items-center rounded-md border border-border bg-surface-2 text-text-subtle">
                    <IcClock size={22} />
                  </span>
                  <p className="text-h3 font-semibold">{t("autopilot.empty_obj_title")}</p>
                  <p className="mt-1.5 max-w-[40ch] text-small leading-relaxed text-text-muted">
                    {t("autopilot.empty_obj_sub")}
                  </p>
                  <Button className="mt-4" variant="secondary" onClick={onAdd} icon={<IcPlus size={16} />}>
                    {t("autopilot.add_schedule")}
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {rules.map((r) => (
                    <div
                      key={r.id}
                      className={cn(
                        "rounded-md border border-border bg-surface-2 p-4",
                        !r.enabled && "opacity-70",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          value={r.name ?? ""}
                          onChange={(e) =>
                            setRules((rs) =>
                              rs.map((x) => (x.id === r.id ? { ...x, name: e.target.value } : x)),
                            )
                          }
                          onBlur={(e) => patchRule(r.id, { name: e.target.value.trim() || null })}
                          placeholder={t("autopilot.object_name_ph")}
                          aria-label={t("autopilot.object_name_ph")}
                          className="h-9 min-w-0 flex-1 rounded-sm border border-transparent bg-transparent px-2 text-body font-semibold text-text transition-colors hover:border-border hover:bg-surface focus:border-accent focus:bg-surface focus:outline-none max-md:min-h-[44px] max-md:text-[16px]"
                        />
                        <Switch
                          checked={r.enabled}
                          onCheckedChange={(v) => patchRule(r.id, { enabled: v })}
                          aria-label={t("autopilot.master")}
                        />
                        <button
                          onClick={() =>
                            confirmDelete === r.id ? onDelete(r) : setConfirmDelete(r.id)
                          }
                          onBlur={() => setConfirmDelete(null)}
                          aria-label={t("autopilot.delete_object")}
                          title={t("autopilot.delete_object")}
                          className={cn(
                            "grid h-9 w-9 shrink-0 place-items-center rounded-md transition-colors max-md:h-11 max-md:w-11",
                            confirmDelete === r.id
                              ? "bg-danger/12 text-danger"
                              : "text-text-subtle hover:bg-surface hover:text-danger",
                          )}
                        >
                          <IcTrash size={16} />
                        </button>
                      </div>

                      <div className="mt-3.5 grid grid-cols-1 gap-3 md:grid-cols-3">
                        <label className="flex min-w-0 flex-col gap-1.5">
                          <span className="text-caption font-medium text-text-muted">
                            {t("autopilot.field_time")}
                          </span>
                          <select
                            value={utcHourToLocal(r.post_hour)}
                            onChange={(e) =>
                              patchRule(r.id, { post_hour: localHourToUtc(Number(e.target.value)) })
                            }
                            className={SELECT}
                          >
                            {HOURS.map((h) => (
                              <option key={h} value={h}>
                                {String(h).padStart(2, "0")}:00
                              </option>
                            ))}
                          </select>
                          <span className="text-caption tabular-nums text-text-subtle">
                            {localUtcOffsetLabel()} ·{" "}
                            {t("autopilot.sends_utc").replace("{time}", `${String(r.post_hour).padStart(2, "0")}:00`)}
                          </span>
                        </label>
                        <label className="flex min-w-0 flex-col gap-1.5">
                          <span className="text-caption font-medium text-text-muted">
                            {t("autopilot.field_jitter")}
                          </span>
                          <select
                            value={r.jitter_minutes}
                            onChange={(e) =>
                              patchRule(r.id, { jitter_minutes: Number(e.target.value) })
                            }
                            className={SELECT}
                          >
                            {Array.from(new Set([...JITTERS, r.jitter_minutes]))
                              .sort((a, b) => a - b)
                              .map((m) => (
                                <option key={m} value={m}>
                                  {m === 0
                                    ? t("autopilot.jitter_exact")
                                    : t("autopilot.jitter_min").replace("{n}", String(m))}
                                </option>
                              ))}
                          </select>
                          <span className="text-caption text-text-subtle">
                            {r.jitter_minutes === 0
                              ? t("autopilot.jitter_hint_exact")
                              : t("autopilot.jitter_hint").replace("{n}", String(r.jitter_minutes))}
                          </span>
                        </label>
                        <label className="flex min-w-0 flex-col gap-1.5">
                          <span className="text-caption font-medium text-text-muted">
                            {t("autopilot.field_topic")}
                          </span>
                          <select
                            value={r.topic_id ?? ""}
                            onChange={(e) =>
                              patchRule(r.id, {
                                topic_id: e.target.value === "" ? null : Number(e.target.value),
                              })
                            }
                            className={SELECT}
                          >
                            <option value="">{t("autopilot.any_topic")}</option>
                            {topics.map((tp) => (
                              <option key={tp.id} value={tp.id}>
                                {tp.label}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>

                      <div className="mt-3.5 flex items-center justify-between gap-3 border-t border-border pt-3.5">
                        <label className="flex min-w-0 items-center gap-2.5 text-small text-text-muted">
                          <Switch
                            checked={r.auto_reply}
                            onCheckedChange={(v) => patchRule(r.id, { auto_reply: v })}
                            aria-label={t("autopilot.seed_label")}
                          />
                          {t("autopilot.seed_label")}
                        </label>
                        {!r.enabled && (
                          <span className="shrink-0 text-caption text-text-subtle">
                            {t("autopilot.paused")}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Auto-reply policy */}
            {config && (
              <section className="rounded-lg border border-border bg-surface p-5 shadow-sm">
                <div className="min-w-0">
                  <h2 className="text-h3 font-semibold tracking-tight">
                    {t("autopilot.policy_title")}
                  </h2>
                  <p className="mt-0.5 text-small text-text-subtle">
                    {t("autopilot.policy_sub")}
                  </p>
                </div>
                {/* 3-way reply mode: a visible "Reply to comments" label beside the
                    off / all / selected segment (CD Autopilot-SPEC `rmode-row`). */}
                <div className="mt-3.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5">
                  <span className="text-small font-semibold text-text">{t("autopilot.reply_mode_row_label")}</span>
                  <div
                    role="group"
                    aria-label={t("autopilot.reply_mode_label")}
                    className="inline-flex rounded-lg border border-border bg-surface-2 p-0.5 text-small max-sm:w-full sm:w-auto"
                  >
                    {(["off", "all", "selected"] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => onReply({ reply_mode: m })}
                        aria-pressed={config.reply_mode === m}
                        className={cn(
                          "flex-1 whitespace-nowrap rounded-md px-3.5 py-1.5 font-medium transition-colors sm:flex-initial",
                          config.reply_mode === m
                            ? "bg-surface text-text shadow-sm"
                            : "text-text-muted hover:text-text",
                        )}
                      >
                        {t(
                          m === "off"
                            ? "autopilot.reply_mode_off"
                            : m === "all"
                              ? "autopilot.reply_mode_all"
                              : "autopilot.reply_mode_selected",
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                {config.reply_mode === "selected" && (
                  <p className="mt-2.5 text-small text-text-subtle">
                    {t("autopilot.reply_mode_selected_hint")}
                  </p>
                )}

                <div
                  className={cn(
                    "mt-4 flex flex-col transition-opacity",
                    config.reply_mode === "off" && "pointer-events-none opacity-50",
                  )}
                >
                  <PolicyRow
                    title={t("autopilot.policy_audience_t")}
                    desc={t("autopilot.policy_audience_d")}
                    first
                  >
                    <select
                      value={config.reply_audience}
                      onChange={(e) => onReply({ reply_audience: e.target.value })}
                      className={cn(SELECT, "min-w-[168px]")}
                    >
                      <option value="fans">{t("autopilot.audience_fans")}</option>
                      <option value="all_except_trolls">
                        {t("autopilot.audience_all_except_trolls")}
                      </option>
                      <option value="questions">{t("autopilot.audience_questions")}</option>
                    </select>
                  </PolicyRow>
                  <PolicyRow
                    title={t("autopilot.policy_skip_t")}
                    desc={t("autopilot.policy_skip_d")}
                    hero
                  >
                    <Switch
                      checked={config.reply_skip_low_value}
                      onCheckedChange={(v) => onReply({ reply_skip_low_value: v })}
                      aria-label={t("autopilot.policy_skip_t")}
                    />
                  </PolicyRow>
                  <PolicyRow
                    title={t("autopilot.policy_freq_t")}
                    desc={t("autopilot.policy_freq_d")}
                  >
                    <select
                      value={config.reply_frequency}
                      onChange={(e) => onReply({ reply_frequency: e.target.value })}
                      className={cn(SELECT, "min-w-[168px]")}
                    >
                      <option value="asap">{t("autopilot.freq_asap")}</option>
                      <option value="hourly">{t("autopilot.freq_hourly")}</option>
                      <option value="few_daily">{t("autopilot.freq_few_daily")}</option>
                      <option value="daily">{t("autopilot.freq_daily")}</option>
                    </select>
                  </PolicyRow>
                  <PolicyRow
                    title={t("autopilot.policy_cap_t")}
                    desc={t("autopilot.policy_cap_d")}
                  >
                    <input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={500}
                      value={config.replies_per_day}
                      onChange={(e) =>
                        onReply({
                          replies_per_day: Math.min(500, Math.max(1, Math.floor(Number(e.target.value) || 1))),
                        })
                      }
                      aria-label={t("autopilot.policy_cap_t")}
                      className={NUMFIELD}
                    />
                  </PolicyRow>
                  {config.replies_per_day > REPLIES_WARN_AT && (
                    <div className="mt-2 flex items-start gap-2 rounded-md border border-warning/45 bg-warning/12 px-3 py-2.5 text-caption leading-relaxed text-text">
                      <IcAlert size={15} className="mt-px shrink-0 text-warning" />
                      <span>{t("autopilot.replies_warn")}</span>
                    </div>
                  )}
                  <PolicyRow
                    title={t("autopilot.policy_quiet_t")}
                    desc={t("autopilot.policy_quiet_d")}
                  >
                    <Switch
                      checked={
                        config.reply_quiet_start_hour !== null &&
                        config.reply_quiet_end_hour !== null
                      }
                      onCheckedChange={(v) =>
                        onReply(
                          v
                            ? {
                                reply_quiet_start_hour: localHourToUtc(23),
                                reply_quiet_end_hour: localHourToUtc(8),
                              }
                            : { reply_quiet_start_hour: null, reply_quiet_end_hour: null },
                        )
                      }
                      aria-label={t("autopilot.policy_quiet_t")}
                    />
                  </PolicyRow>
                  {config.reply_quiet_start_hour !== null &&
                    config.reply_quiet_end_hour !== null && (
                      <div className="flex flex-wrap items-center gap-2 border-t border-border py-3.5">
                        <span className="text-caption text-text-muted">
                          {t("autopilot.quiet_from")}
                        </span>
                        <select
                          value={utcHourToLocal(config.reply_quiet_start_hour)}
                          onChange={(e) =>
                            onReply({ reply_quiet_start_hour: localHourToUtc(Number(e.target.value)) })
                          }
                          className={cn(SELECT, "w-auto min-w-[88px]")}
                        >
                          {HOURS.map((h) => (
                            <option key={h} value={h}>
                              {String(h).padStart(2, "0")}:00
                            </option>
                          ))}
                        </select>
                        <span className="text-caption text-text-muted">
                          {t("autopilot.quiet_to")}
                        </span>
                        <select
                          value={utcHourToLocal(config.reply_quiet_end_hour)}
                          onChange={(e) =>
                            onReply({ reply_quiet_end_hour: localHourToUtc(Number(e.target.value)) })
                          }
                          className={cn(SELECT, "w-auto min-w-[88px]")}
                        >
                          {HOURS.map((h) => (
                            <option key={h} value={h}>
                              {String(h).padStart(2, "0")}:00
                            </option>
                          ))}
                        </select>
                        <span className="text-caption text-text-subtle">
                          {localUtcOffsetLabel()}
                        </span>
                      </div>
                    )}
                </div>
              </section>
            )}

            {/* Activity */}
            <section className="rounded-lg border border-border bg-surface p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3.5">
                <div className="min-w-0">
                  <h2 className="text-h3 font-semibold tracking-tight">
                    {t("autopilot.activity_title")}
                  </h2>
                  <p className="mt-0.5 text-small text-text-subtle">
                    {t("autopilot.activity_sub")}
                  </p>
                </div>
                {hasActivity && (
                  <div
                    role="tablist"
                    className="inline-flex shrink-0 gap-[3px] rounded-md border border-border bg-surface-2 p-[3px]"
                  >
                    {(["posts", "replies"] as const).map((tab) => (
                      <button
                        key={tab}
                        role="tab"
                        aria-selected={actTab === tab}
                        onClick={() => setActTab(tab)}
                        className={cn(
                          "h-8 rounded-sm border px-3 text-small font-medium transition-colors",
                          actTab === tab
                            ? "border-border bg-surface font-semibold text-text shadow-sm"
                            : "border-transparent text-text-muted hover:text-text",
                        )}
                      >
                        {tab === "posts" ? t("autopilot.tab_posts") : t("autopilot.tab_replies")}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {!hasActivity ? (
                <div className="flex flex-col items-center rounded-md border border-dashed border-border px-6 py-10 text-center">
                  <span className="mb-3.5 grid h-[46px] w-[46px] place-items-center rounded-md border border-border bg-surface-2 text-text-subtle">
                    <IcClock size={22} />
                  </span>
                  <p className="text-h3 font-semibold">{t("autopilot.empty_act_title")}</p>
                  <p className="mt-1.5 max-w-[40ch] text-small leading-relaxed text-text-muted">
                    {t("autopilot.empty_act_sub")}
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-[14px] flex flex-wrap items-center gap-3 rounded-md border border-border bg-surface-2 px-4 py-[13px]">
                    <span className="text-caption font-semibold uppercase tracking-wide text-text-subtle">
                      {t("autopilot.activity_alltime")}
                    </span>
                    <span className="text-body text-text-muted">
                      <b className="font-semibold tabular-nums text-text">{activity!.posts_total}</b>{" "}
                      {pluralUnit(locale, "posts", activity!.posts_total)}
                      <span className="mx-1 text-text-subtle opacity-50">·</span>
                      <b className="font-semibold tabular-nums text-text">{activity!.replies_total}</b>{" "}
                      {pluralUnit(locale, "replies", activity!.replies_total)}
                    </span>
                  </div>
                  {activity!.rules.length > 0 && (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      {activity!.rules.map((r) => (
                        <div key={r.id} className="rounded-md border border-border bg-surface-2 p-3.5">
                          <div className="truncate text-caption text-text-subtle">
                            {r.name || `#${r.id}`}
                          </div>
                          <div className="mt-2 text-h3 font-semibold tabular-nums">
                            {r.posts_total}
                            <small className="ml-1 text-caption font-medium text-text-subtle">
                              {pluralUnit(locale, "posts", r.posts_total)}
                            </small>
                          </div>
                          {r.last_post_at && (
                            <div className="mt-[7px] text-caption text-text-subtle">
                              {t("autopilot.activity_last")} {fmtDate(r.last_post_at, locale)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 flex flex-col gap-3">
                    {actTab === "posts"
                      ? activity!.posts.map((p) => (
                          <div key={p.post_id} className="rounded-md border border-border bg-surface p-3.5">
                            <div className="mb-2 flex items-center gap-2.5">
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-2.5 py-0.5 text-caption font-semibold text-text-muted">
                                <IcClock size={12} />
                                {p.rule_name || t("autopilot.title")}
                              </span>
                              <span className="text-caption text-text-subtle">
                                {fmtDate(p.published_at, locale)}
                              </span>
                              {p.threads_url && (
                                <a
                                  href={p.threads_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="ml-auto text-text-subtle hover:text-text"
                                  aria-label={t("feed.open")}
                                >
                                  <IcExternal size={14} />
                                </a>
                              )}
                            </div>
                            <p className="whitespace-pre-wrap text-small leading-relaxed text-text">
                              {p.text}
                            </p>
                            <div className="mt-2.5 flex gap-3.5 text-caption text-text-subtle">
                              <span className="inline-flex items-center gap-1.5">
                                <IcEye size={13} />
                                {p.views ?? 0}
                              </span>
                              <span className="inline-flex items-center gap-1.5">
                                <IcHeart size={13} />
                                {p.likes ?? 0}
                              </span>
                              <span className="inline-flex items-center gap-1.5">
                                <IcBubble size={13} />
                                {p.comments ?? 0}
                              </span>
                            </div>
                          </div>
                        ))
                      : activity!.replies.map((rep) => (
                          <div key={rep.comment_id} className="rounded-md border border-border bg-surface p-3.5">
                            <div className="flex gap-2.5">
                              <Mono text={(rep.author_username?.[0] ?? "@").toUpperCase()} size={28} />
                              <div className="min-w-0 flex-1">
                                <div className="truncate text-caption font-semibold text-text-muted">
                                  @{rep.author_username ?? "—"}
                                </div>
                                {rep.comment_text && (
                                  <div className="mt-0.5 line-clamp-2 text-small leading-snug text-text-muted">
                                    {rep.comment_text}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="relative mt-3 pl-3.5">
                              <span className="absolute bottom-2 left-[3px] top-0.5 w-0.5 rounded bg-border" aria-hidden />
                              <div className="mb-1 flex items-center gap-1.5 text-caption font-semibold">
                                {t("autopilot.you")}
                                <span className="inline-flex items-center gap-1 font-medium text-accent">
                                  <IcBubble size={11} />
                                  {t("autopilot.auto_replied")}
                                </span>
                              </div>
                              <p className="whitespace-pre-wrap text-small leading-relaxed text-text">
                                {rep.reply_text}
                              </p>
                            </div>
                            {rep.replied_at && (
                              <div className="mt-2.5 text-caption text-text-subtle">
                                {fmtDate(rep.replied_at, locale)}
                              </div>
                            )}
                          </div>
                        ))}
                  </div>
                </>
              )}
            </section>

            <div className="space-y-1 text-caption text-text-subtle">
              <p>
                {t("autopilot.uses_voice")}{" "}
                <Link href="/app/role-book" className="underline underline-offset-2 hover:text-text">
                  {t("dashboard.nav.voice")}
                </Link>{" "}
                ·{" "}
                <Link href="/app/style-rules" className="underline underline-offset-2 hover:text-text">
                  {t("dashboard.nav.style_rules")}
                </Link>
              </p>
              <p>{t("autopilot.safety")}</p>
            </div>
          </>
        )}
      </main>

      {/* Turn-on confirmation */}
      {confirmOn && (
        <div
          className="fixed inset-0 z-40 grid place-items-center bg-ink-950/55 p-6 backdrop-blur-sm max-md:items-end max-md:p-0"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setConfirmOn(false);
          }}
        >
          {/* Desktop: a centered modal. Phone: a bottom sheet (rounded top,
              full-width, primary action on top within thumb reach). */}
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-lg max-md:max-w-none max-md:rounded-b-none max-md:rounded-t-2xl max-md:pb-[calc(env(safe-area-inset-bottom)+20px)]">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-accent/30 bg-accent/12 text-accent">
                <IcClock size={18} />
              </span>
              <div>
                <h2 className="text-h3 font-semibold">{t("autopilot.confirm_title")}</h2>
                <p className="mt-1 text-small leading-relaxed text-text-muted">
                  {t("autopilot.confirm_body")}
                </p>
              </div>
            </div>
            <div className="mt-5 flex items-center justify-end gap-2.5 max-md:mt-6 max-md:flex-col-reverse max-md:items-stretch">
              <button
                onClick={() => setConfirmOn(false)}
                className={cn(buttonClasses({ variant: "ghost" }), "max-md:min-h-[44px] max-md:w-full")}
              >
                {t("common.cancel")}
              </button>
              <Button
                variant="primary"
                icon={<IcClock size={15} />}
                className="max-md:min-h-[44px] max-md:w-full"
                onClick={() => {
                  setConfirmOn(false);
                  doSetMaster(true);
                }}
              >
                {t("autopilot.confirm_cta")}
              </Button>
            </div>
          </div>
        </div>
      )}

      <ToastHost>
        {toasts.map((tt) => (
          <Toast
            key={tt.id}
            tone={tt.tone}
            title={tt.message}
            undoLabel={tt.undoLabel}
            onUndo={
              tt.onUndo
                ? () => {
                    tt.onUndo?.();
                    dismissToast(tt.id);
                  }
                : undefined
            }
          />
        ))}
      </ToastHost>

      {allow && (
        <TweaksPanel title="Autopilot">
          <TweakSection label="Appearance" />
          <TweakToggle label="Dark mode" value={tw.dark} onChange={(v) => setTw("dark", v)} />
          <TweakSection label="State" />
          <TweakRadio label="State" value={tw.state} options={AP_STATES} onChange={(v) => setTw("state", v)} />
        </TweaksPanel>
      )}
    </div>
  );
}

function PolicyRow({
  title,
  desc,
  first = false,
  hero = false,
  children,
}: {
  title: string;
  desc: string;
  first?: boolean;
  // The "only reply when it adds value" row — the policy's behavioral brain.
  // It breaks out of the divider flow into a lightly accent-tinted panel with a
  // marker dot, so it reads as the weighted control, not just another toggle.
  hero?: boolean;
  children: ReactNode;
}) {
  if (hero) {
    return (
      <div
        className="my-2 flex flex-col items-start justify-between gap-3 rounded-md border px-3.5 py-3 md:flex-row md:items-center"
        style={{
          background: "color-mix(in srgb, var(--color-accent) 6%, var(--color-surface))",
          borderColor: "color-mix(in srgb, var(--color-accent) 22%, var(--color-border))",
        }}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-small font-semibold">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
            {title}
          </div>
          <div className="mt-0.5 text-caption leading-relaxed text-text-subtle">{desc}</div>
        </div>
        <div className="w-full shrink-0 md:w-auto">{children}</div>
      </div>
    );
  }
  return (
    <div
      className={cn(
        "flex flex-col items-start justify-between gap-3 py-3.5 md:flex-row md:items-center",
        first ? "pt-1" : "border-t border-border",
      )}
    >
      <div className="min-w-0">
        <div className="text-small font-semibold">{title}</div>
        <div className="mt-0.5 text-caption leading-relaxed text-text-subtle">{desc}</div>
      </div>
      <div className="w-full shrink-0 md:w-auto">{children}</div>
    </div>
  );
}
