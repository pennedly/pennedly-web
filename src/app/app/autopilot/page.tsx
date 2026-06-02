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
  getTokens,
  setAutopilotMaster,
  updateAutopilot,
  updateAutopostRule,
} from "@/lib/api";
import { captureEvent } from "@/lib/analytics";
import { useSelectedAccountId } from "@/lib/account";
import { useTranslation, useLocale } from "@/lib/i18n";
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
  IcBubble,
  IcCheck,
  IcClock,
  IcExternal,
  IcEye,
  IcHeart,
  IcPlus,
  IcTrash,
} from "@/components/icons";
import type {
  AutopilotConfig,
  AutopostActivity,
  AutopostRule,
  TopicOption,
} from "@/lib/types";

type Toast = { id: number; message: string; tone: "success" | "error" };

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const JITTERS = [0, 5, 10, 15, 30, 45, 60];
const SELECT =
  "h-9 w-full rounded-md border border-border bg-surface px-2.5 text-small text-text transition-colors focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

function fmtDate(iso: string | null, locale: string): string {
  if (!iso) return "";
  const loc = locale === "ru" ? "ru-RU" : locale === "en" ? "en-US" : locale;
  return new Date(iso).toLocaleDateString(loc, { month: "short", day: "numeric" });
}

export default function AutopilotPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const locale = useLocale();
  const { checking } = useTesterGuard();
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

  function toast(message: string, tone: Toast["tone"] = "success") {
    const id = Date.now() + Math.random();
    setToasts((s) => [...s, { id, message, tone }]);
    setTimeout(() => setToasts((s) => s.filter((x) => x.id !== id)), 3500);
  }

  useEffect(() => {
    if (!getTokens()) router.push("/app/login");
  }, [router]);

  useEffect(() => {
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

  async function doSetMaster(v: boolean) {
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
    if (accountId === null || config === null) return;
    const prev = config;
    const next = { ...config, ...patch };
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
    try {
      await updateAutopostRule(id, patch);
    } catch (e) {
      toast(String(e), "error");
    }
  }

  async function onDelete(id: number) {
    try {
      await deleteAutopostRule(id);
      setRules((rs) => rs.filter((r) => r.id !== id));
      setConfirmDelete(null);
    } catch (e) {
      toast(String(e), "error");
    }
  }

  if (checking) return null;

  if (bootError) {
    return (
      <div className="min-h-screen bg-bg text-text">
        <AppTopbar title={t("autopilot.title")} />
        <main className="mx-auto max-w-[760px] px-5 py-7 md:px-6">
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
      <main className="mx-auto max-w-[760px] space-y-5 px-5 py-7 md:px-6">
        <p className="max-w-[60ch] text-small text-text-muted">{t("autopilot.subtitle")}</p>

        {!loaded ? (
          <div className="space-y-5">
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
                <div>
                  <h2 className="text-h3 font-semibold tracking-tight">
                    {t("autopilot.schedules_title")}
                  </h2>
                  <p className="mt-0.5 text-small text-text-subtle">
                    {t("autopilot.schedules_sub")}
                  </p>
                </div>
                {rules.length > 0 && (
                  <Button size="sm" variant="secondary" onClick={onAdd} icon={<IcPlus size={15} />}>
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
                          className="h-9 min-w-0 flex-1 rounded-sm border border-transparent bg-transparent px-2 text-body font-semibold text-text transition-colors hover:border-border hover:bg-surface focus:border-accent focus:bg-surface focus:outline-none"
                        />
                        <Switch
                          checked={r.enabled}
                          onCheckedChange={(v) => patchRule(r.id, { enabled: v })}
                          aria-label={t("autopilot.master")}
                        />
                        <button
                          onClick={() =>
                            confirmDelete === r.id ? onDelete(r.id) : setConfirmDelete(r.id)
                          }
                          onBlur={() => setConfirmDelete(null)}
                          aria-label={t("autopilot.delete_object")}
                          title={t("autopilot.delete_object")}
                          className={cn(
                            "grid h-9 w-9 shrink-0 place-items-center rounded-md transition-colors",
                            confirmDelete === r.id
                              ? "bg-danger/12 text-danger"
                              : "text-text-subtle hover:bg-surface hover:text-danger",
                          )}
                        >
                          <IcTrash size={16} />
                        </button>
                      </div>

                      <div className="mt-3.5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <label className="flex min-w-0 flex-col gap-1.5">
                          <span className="text-caption font-medium text-text-muted">
                            {t("autopilot.field_time")} · {localUtcOffsetLabel()}
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
                            {JITTERS.map((m) => (
                              <option key={m} value={m}>
                                {m === 0 ? "0" : `± ${m} min`}
                              </option>
                            ))}
                          </select>
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
                        <label className="flex items-center gap-2.5 text-small text-text-muted">
                          <Switch
                            checked={r.auto_reply}
                            onCheckedChange={(v) => patchRule(r.id, { auto_reply: v })}
                            aria-label={t("autopilot.seed_label")}
                          />
                          {t("autopilot.seed_label")}
                        </label>
                        {!r.enabled && (
                          <span className="text-caption text-text-subtle">
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
                <div className="flex items-center justify-between gap-3.5">
                  <div>
                    <h2 className="text-h3 font-semibold tracking-tight">
                      {t("autopilot.policy_title")}
                    </h2>
                    <p className="mt-0.5 text-small text-text-subtle">
                      {t("autopilot.policy_sub")}
                    </p>
                  </div>
                  <Switch
                    checked={config.reply_enabled}
                    onCheckedChange={(v) => onReply({ reply_enabled: v })}
                    aria-label={t("autopilot.reply_enabled")}
                  />
                </div>

                <div
                  className={cn(
                    "mt-4 flex flex-col transition-opacity",
                    !config.reply_enabled && "pointer-events-none opacity-50",
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
                    title={t("autopilot.policy_cap_t")}
                    desc={t("autopilot.policy_cap_d")}
                  >
                    <select
                      value={config.replies_per_day}
                      onChange={(e) => onReply({ replies_per_day: Number(e.target.value) })}
                      className={cn(SELECT, "min-w-[168px]")}
                    >
                      {/* Q66: reply cap 10 / 25 / 50 (no "no cap"). Keep any
                          legacy stored value visible so the select never blanks. */}
                      {Array.from(new Set([10, 25, 50, config.replies_per_day]))
                        .sort((a, b) => a - b)
                        .map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                    </select>
                  </PolicyRow>
                </div>
              </section>
            )}

            {/* Activity */}
            <section className="rounded-lg border border-border bg-surface p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3.5">
                <div>
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
                    className="inline-flex gap-[3px] rounded-md border border-border bg-surface-2 p-[3px]"
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
                  {activity!.rules.length > 0 && (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {activity!.rules.map((r) => (
                        <div key={r.id} className="rounded-md border border-border bg-surface-2 p-3.5">
                          <div className="truncate text-caption text-text-subtle">
                            {r.name || `#${r.id}`}
                          </div>
                          <div className="mt-2 flex items-baseline gap-3">
                            <span className="text-h3 font-semibold tabular-nums">
                              {r.posts_today}
                              <small className="ml-1 text-caption font-medium text-text-subtle">
                                {t("autopilot.activity_posts")}
                              </small>
                            </span>
                            <span className="text-h3 font-semibold tabular-nums">
                              {r.replies_today}
                              <small className="ml-1 text-caption font-medium text-text-subtle">
                                {t("autopilot.activity_replies")}
                              </small>
                            </span>
                          </div>
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
          className="fixed inset-0 z-40 grid place-items-center bg-ink-950/55 p-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setConfirmOn(false);
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-lg">
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
            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button onClick={() => setConfirmOn(false)} className={buttonClasses({ variant: "ghost" })}>
                {t("common.cancel")}
              </button>
              <Button
                variant="primary"
                icon={<IcClock size={15} />}
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
          <Toast key={tt.id} tone={tt.tone} title={tt.message} />
        ))}
      </ToastHost>
    </div>
  );
}

function PolicyRow({
  title,
  desc,
  first = false,
  children,
}: {
  title: string;
  desc: string;
  first?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-start justify-between gap-3 py-3.5 sm:flex-row sm:items-center",
        first ? "pt-1" : "border-t border-border",
      )}
    >
      <div className="min-w-0">
        <div className="text-small font-semibold">{title}</div>
        <div className="mt-0.5 text-caption leading-relaxed text-text-subtle">{desc}</div>
      </div>
      <div className="w-full shrink-0 sm:w-auto">{children}</div>
    </div>
  );
}
