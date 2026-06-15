"use client";

// Style & reply rules — the built-in anti-AI-tell catalog (toggles, filtered
// by category) plus the account's own freeform rules. Layout per
// design-export/PennedlyDesign/stylerules-* : an intro, a built-in section
// with category filter chips + a switch per rule, and a freeform section with
// inline add/edit/remove. Frontend restyle — the style-rules + user-rules APIs
// already back it (the only backend touch was adding the display `category`).

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import {
  ApiError,
  clearTokens,
  createUserRule,
  deleteUserRule,
  fetchMe,
  fetchStyleRules,
  fetchUserRules,
  getTokens,
  updateStyleRule,
  updateUserRule,
} from "@/lib/api";
import { captureEvent } from "@/lib/analytics";
import { useSelectedAccountId } from "@/lib/account";
import { useTranslation, type MessageKey } from "@/lib/i18n";
import { AppTopbar, TopbarPill } from "@/components/AppTopbar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/feedback";
import { Toast, ToastHost } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { useDeferredCommit } from "@/lib/use-deferred-commit";
import { IcCheck, IcFilter, IcPencil, IcPenLine, IcPlus, IcSliders, IcTrash } from "@/components/icons";
import { TweaksPanel, TweakSection, TweakToggle, TweakRadio, useTweaks } from "@/components/tweaks/TweaksPanel";
import { DEMO_BUILTIN, DEMO_FREEFORM, SR_TWEAK_DEFAULTS } from "@/components/studio/stylerules-demo";
import type { StyleRule, StyleRuleCategory, UserRule } from "@/lib/types";

const PUNCTUATION_RULE_KEY = "human_punctuation";
const IS_DEV = process.env.NODE_ENV === "development";
const SR_SCREENS = ["Default", "Catalog", "Loading"];

const CATEGORIES: StyleRuleCategory[] = [
  "punctuation",
  "diction",
  "structure",
  "cadence",
  "formatting",
  "tone",
];
const CAT_LABEL: Record<StyleRuleCategory, MessageKey> = {
  punctuation: "style_rules.cat_punctuation",
  diction: "style_rules.cat_diction",
  structure: "style_rules.cat_structure",
  cadence: "style_rules.cat_cadence",
  formatting: "style_rules.cat_formatting",
  tone: "style_rules.cat_tone",
};

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

// Q49: display title + description come from i18n keyed by the rule's stable
// backend `key` (the Russian title/body stay as the model prompt only). Fall
// back to the backend strings for any future rule without an i18n entry.
const RULE_I18N: Record<string, { t: MessageKey; d: MessageKey }> = {
  no_antithesis: { t: "style_rules.r.no_antithesis.t", d: "style_rules.r.no_antithesis.d" },
  no_rule_of_three: { t: "style_rules.r.no_rule_of_three.t", d: "style_rules.r.no_rule_of_three.d" },
  no_baity_opener: { t: "style_rules.r.no_baity_opener.t", d: "style_rules.r.no_baity_opener.d" },
  no_engagement_question: { t: "style_rules.r.no_engagement_question.t", d: "style_rules.r.no_engagement_question.d" },
  no_significance_formula: { t: "style_rules.r.no_significance_formula.t", d: "style_rules.r.no_significance_formula.d" },
  no_ai_buzzwords: { t: "style_rules.r.no_ai_buzzwords.t", d: "style_rules.r.no_ai_buzzwords.d" },
  no_hedging: { t: "style_rules.r.no_hedging.t", d: "style_rules.r.no_hedging.d" },
  no_elegant_variation: { t: "style_rules.r.no_elegant_variation.t", d: "style_rules.r.no_elegant_variation.d" },
  no_summary_closer: { t: "style_rules.r.no_summary_closer.t", d: "style_rules.r.no_summary_closer.d" },
  vary_rhythm: { t: "style_rules.r.vary_rhythm.t", d: "style_rules.r.vary_rhythm.d" },
  be_concrete: { t: "style_rules.r.be_concrete.t", d: "style_rules.r.be_concrete.d" },
  plain_formatting: { t: "style_rules.r.plain_formatting.t", d: "style_rules.r.plain_formatting.d" },
  no_capital_after_colon: { t: "style_rules.r.no_capital_after_colon.t", d: "style_rules.r.no_capital_after_colon.d" },
  human_punctuation: { t: "style_rules.r.human_punctuation.t", d: "style_rules.r.human_punctuation.d" },
  no_false_agency: { t: "style_rules.r.no_false_agency.t", d: "style_rules.r.no_false_agency.d" },
  no_passive: { t: "style_rules.r.no_passive.t", d: "style_rules.r.no_passive.d" },
  reader_in_room: { t: "style_rules.r.reader_in_room.t", d: "style_rules.r.reader_in_room.d" },
};

function ruleTitle(rule: StyleRule, t: (k: MessageKey) => string): string {
  const m = RULE_I18N[rule.key];
  return m ? t(m.t) : rule.title;
}
function ruleDesc(rule: StyleRule, t: (k: MessageKey) => string): string {
  const m = RULE_I18N[rule.key];
  return m ? t(m.d) : rule.body;
}

// Q44: the human_punctuation rule is a deterministic stripper — show its live
// before→after on a sample, applying the same typographic swaps output_guard
// does (em-dash → hyphen, «guillemets» → straight quotes, … → ...). The "from"
// sample is localized per UI locale (style_rules.punct_example_from) so the
// transformation is legible in each language's own typography; the "to" half
// is always derived via humanizePunctuation(from), never stored.
function humanizePunctuation(s: string): string {
  return s.replace(/—/g, "-").replace(/[«»]/g, '"').replace(/…/g, "...");
}

function fill(s: string, vars: Record<string, string | number>): string {
  return s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
}

export default function StyleRulesEditor() {
  const router = useRouter();
  const { t } = useTranslation();
  const accountId = useSelectedAccountId();
  const [rules, setRules] = useState<StyleRule[] | null>(null);
  const [userRules, setUserRules] = useState<UserRule[] | null>(null);
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [newBody, setNewBody] = useState("");
  // Q81: default to "both" (post + reply), matching the design's default.
  const [newKind, setNewKind] = useState("both");
  const [bootError, setBootError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const deferred = useDeferredCommit();

  // Tester ?demo=1: a tweak panel drives states on mock content.
  const [demoParam] = useState(() =>
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("demo") === "1"
      : false,
  );
  const [isTester, setIsTester] = useState(false);
  const allow = demoParam && (IS_DEV || isTester);
  const demoOn = allow;
  const [tw, setTw] = useTweaks(SR_TWEAK_DEFAULTS);
  const compact = demoOn && tw.density === "Compact";
  const catalogOnly = demoOn && tw.screen === "Catalog";

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
    setRules(null);
    fetchUserRules(accountId)
      .then((r) => setUserRules(r.rules))
      .catch(() => setUserRules([]));
    (async () => {
      try {
        const list = await fetchStyleRules(accountId);
        setRules(list.rules);
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          clearTokens();
          router.push("/app/login");
          return;
        }
        setBootError(String(e));
      }
    })();
  }, [accountId, router]);

  // Demo: seed the real state from the tweak so the live render paths light up.
  useEffect(() => {
    if (!demoOn) return;
    document.documentElement.classList.toggle("dark", !!tw.dark);
  }, [demoOn, tw.dark]);

  useEffect(() => {
    if (!demoOn) return;
    setBootError(null);
    if (tw.screen === "Loading") {
      setRules(null);
      return;
    }
    setRules(DEMO_BUILTIN.map((r) => ({ ...r })));
    setUserRules(tw.yourRules === "Empty" ? [] : DEMO_FREEFORM.map((r) => ({ ...r })));
  }, [demoOn, tw.screen, tw.yourRules]);

  async function onToggle(rule: StyleRule) {
    const next = !rule.enabled;
    if (demoOn) {
      setRules((rs) => rs?.map((r) => (r.key === rule.key ? { ...r, enabled: next } : r)) ?? rs);
      return;
    }
    if (accountId === null) return;
    setRules((rs) => rs?.map((r) => (r.key === rule.key ? { ...r, enabled: next } : r)) ?? rs);
    setPending((p) => new Set(p).add(rule.key));
    captureEvent("ui.style_rule_toggled", { account_id: accountId, rule_key: rule.key, enabled: next });
    try {
      const updated = await updateStyleRule(accountId, rule.key, next);
      setRules((rs) => rs?.map((r) => (r.key === rule.key ? updated : r)) ?? rs);
    } catch (e) {
      setRules((rs) => rs?.map((r) => (r.key === rule.key ? { ...r, enabled: rule.enabled } : r)) ?? rs);
      toast(String(e), "error");
    } finally {
      setPending((p) => {
        const n = new Set(p);
        n.delete(rule.key);
        return n;
      });
    }
  }

  async function onAdd(body: string) {
    if (!body.trim()) return;
    if (demoOn) {
      const r: UserRule = { id: Date.now(), kind: newKind, body: body.trim(), enabled: true, sort_order: userRules?.length ?? 0 };
      setUserRules((rs) => [...(rs ?? []), r]);
      setNewBody("");
      toast(t("style_rules.toast_rule_added"));
      return;
    }
    if (accountId === null) return;
    captureEvent("ui.user_rule_added", { account_id: accountId });
    try {
      const r = await createUserRule(accountId, { kind: newKind, body: body.trim() });
      setUserRules((rs) => [...(rs ?? []), r]);
      setNewBody("");
      // Q81: the toast names where the rule applies.
      const toastKey: MessageKey =
        newKind === "post"
          ? "style_rules.toast_added_post"
          : newKind === "reply"
            ? "style_rules.toast_added_reply"
            : "style_rules.toast_rule_added";
      toast(t(toastKey));
    } catch (e) {
      toast(String(e), "error");
    }
  }

  async function onEditRule(id: number, body: string) {
    setUserRules((rs) => rs?.map((r) => (r.id === id ? { ...r, body } : r)) ?? rs);
    if (demoOn) return;
    try {
      await updateUserRule(id, { body });
    } catch (e) {
      toast(String(e), "error");
    }
  }

  async function onToggleUserRule(rule: UserRule) {
    const next = !rule.enabled;
    setUserRules((rs) => rs?.map((r) => (r.id === rule.id ? { ...r, enabled: next } : r)) ?? rs);
    if (demoOn) return;
    try {
      await updateUserRule(rule.id, { enabled: next });
    } catch (e) {
      setUserRules((rs) => rs?.map((r) => (r.id === rule.id ? { ...r, enabled: rule.enabled } : r)) ?? rs);
      toast(String(e), "error");
    }
  }

  // Q24: optimistic + Undo. Keeps the (id) signature FreeformRow calls with;
  // looks up the rule so it can be re-inserted on undo / commit-error.
  function onDeleteRule(id: number) {
    const list = userRules ?? [];
    const idx = list.findIndex((r) => r.id === id);
    const rule = list[idx];
    if (!rule) return;
    setUserRules((rs) => rs?.filter((r) => r.id !== id) ?? rs);
    if (demoOn) {
      toast(t("style_rules.toast_rule_deleted"), "success", {
        duration: UNDO_MS,
        undoLabel: t("common.undo"),
        onUndo: () => setUserRules((rs) => insertAt(rs ?? [], idx, rule)),
      });
      return;
    }
    const key = `userrule-${id}`;
    deferred.schedule(
      key,
      async () => {
        try {
          await deleteUserRule(id);
        } catch (e) {
          setUserRules((rs) => insertAt(rs ?? [], idx, rule));
          toast(String(e), "error");
        }
      },
      UNDO_MS,
    );
    toast(t("style_rules.toast_rule_deleted"), "success", {
      duration: UNDO_MS,
      undoLabel: t("common.undo"),
      onUndo: () => {
        deferred.cancel(key);
        setUserRules((rs) => insertAt(rs ?? [], idx, rule));
      },
    });
  }

  if (bootError) {
    return (
      <div className="min-h-screen bg-bg text-text">
        <AppTopbar maxW="720px" title={t("style_rules.title")} />
        <main className="mx-auto max-w-[720px] px-3.5 pb-24 pt-7 md:px-6">
          <div className="rounded-lg border border-danger/40 bg-danger/10 p-4 text-small text-danger">
            {bootError}
          </div>
        </main>
      </div>
    );
  }

  const builtinOn = rules?.filter((r) => r.enabled).length ?? 0;
  const builtinTotal = rules?.length ?? 0;
  const ownCount = userRules?.length ?? 0;
  const totalOn = builtinOn + (userRules?.filter((r) => r.enabled).length ?? 0);
  const totalRules = builtinTotal + ownCount;

  // Categories actually present, in canonical order (Q30: always-visible groups).
  const presentCats = CATEGORIES.filter((c) => rules?.some((r) => r.category === c));

  return (
    <div className="min-h-screen bg-bg text-text">
      <AppTopbar maxW="720px"
        title={t("style_rules.title")}
        pill={
          rules ? (
            <TopbarPill tone="success">
              {fill(t("style_rules.rules_on"), { on: totalOn, total: totalRules })}
            </TopbarPill>
          ) : undefined
        }
      />
      <main className="mx-auto max-w-[720px] space-y-4 px-3.5 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-4 md:space-y-5 md:px-6 md:pb-24 md:pt-7">
        {!rules ? (
          <div className="space-y-5">
            <Skeleton className="h-28 w-full rounded-lg" />
            <Skeleton className="h-72 w-full rounded-lg" />
          </div>
        ) : (
          // Q29: Your rules shown first, then the built-in catalog (flex order).
          <div className="flex flex-col gap-5">
            {/* Intro */}
            <div className="order-1">
              <span className="inline-flex items-center gap-1.5 text-caption font-semibold uppercase tracking-wide text-text-subtle">
                <IcSliders size={14} className="text-text-muted" />
                {t("style_rules.eyebrow")}
              </span>
              <h1 className="mt-3 text-h1 font-semibold tracking-tight">{t("style_rules.intro_title")}</h1>
              <p className="mt-2.5 max-w-[60ch] text-body leading-relaxed text-text-muted">
                {t("style_rules.intro_lead")}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-small text-text-muted">
                <span>{fill(t("style_rules.stat_builtin"), { on: builtinOn, total: builtinTotal })}</span>
                <span className="h-[3px] w-[3px] rounded-full bg-text-subtle" />
                <span>{fill(t("style_rules.stat_own"), { n: ownCount })}</span>
              </div>
            </div>

            {/* Built-in anti-AI rules (Q29: order-3, after Your rules) */}
            <section className="order-3 overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
              <div className="flex items-center gap-3 p-4">
                <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-md border border-border bg-surface-2 text-text-muted">
                  <IcFilter size={17} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-h3 font-semibold leading-tight">
                    {t("style_rules.builtin_title")}
                    <span className="inline-flex h-[18px] items-center justify-center rounded-full border border-border bg-surface-2 px-1.5 text-caption font-semibold tabular-nums text-text-subtle">
                      {builtinOn}/{builtinTotal}
                    </span>
                  </div>
                  <div className="mt-0.5 text-caption text-text-subtle">{t("style_rules.builtin_desc")}</div>
                </div>
              </div>

              {/* Q30: always-visible category groups (was a chip filter). */}
              <div className="flex flex-col">
                {presentCats.map((c) => {
                  const items = rules.filter((r) => r.category === c);
                  const cOn = items.filter((r) => r.enabled).length;
                  return (
                    <div key={c} className="border-t border-border">
                      <div className="flex items-center justify-between gap-2 bg-surface-2 px-4 py-2">
                        <span className="text-caption font-semibold uppercase tracking-wide text-text-subtle">
                          {t(CAT_LABEL[c])}
                        </span>
                        <span className="text-caption tabular-nums text-text-subtle">
                          {cOn}/{items.length}
                        </span>
                      </div>
                      {items.map((rule) => (
                        <div
                          key={rule.key}
                          className={cn(
                            "flex items-start gap-3.5 border-t border-border px-4 transition-colors hover:bg-surface",
                            compact ? "py-2.5" : "py-4",
                            !rule.enabled && "opacity-95",
                          )}
                        >
                          <div className="mt-0.5 shrink-0">
                            <Switch
                              checked={rule.enabled}
                              onCheckedChange={() => onToggle(rule)}
                              disabled={pending.has(rule.key)}
                              aria-label={ruleTitle(rule, t)}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={cn("text-small font-semibold", !rule.enabled && "text-text-subtle")}>
                                {ruleTitle(rule, t)}
                              </span>
                              {rule.kind !== "both" && (
                                <span
                                  className={cn(
                                    "shrink-0 rounded-sm border border-border bg-surface-2 px-2 py-0.5 text-caption font-semibold text-text-muted",
                                    !rule.enabled && "opacity-70",
                                  )}
                                >
                                  {rule.kind === "post" ? t("style_rules.posts_only") : t("style_rules.replies_only")}
                                </span>
                              )}
                            </div>
                            {!compact && (
                              <p className={cn("mt-1 text-small leading-relaxed", rule.enabled ? "text-text-muted" : "text-text-subtle")}>
                                {ruleDesc(rule, t)}
                              </p>
                            )}
                            {!compact && rule.key === PUNCTUATION_RULE_KEY && (
                              <PunctuationDemo on={rule.enabled} t={t} />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Freeform rules — Your rules (Q29: order-2, first after the intro) */}
            <section className={cn("order-2 overflow-hidden rounded-lg border border-border bg-surface shadow-sm", catalogOnly && "hidden")}>
              <div className="flex items-center gap-3 p-4">
                <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-md border border-border bg-surface-2 text-text-muted">
                  <IcPenLine size={17} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-h3 font-semibold leading-tight">
                    {t("style_rules.your_title")}
                    {ownCount > 0 && (
                      <span className="inline-flex h-[18px] min-w-[20px] items-center justify-center rounded-full border border-border bg-surface-2 px-1.5 text-caption font-semibold tabular-nums text-text-subtle">
                        {ownCount}
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-caption text-text-subtle">{t("style_rules.your_desc")}</div>
                </div>
              </div>

              {userRules && userRules.length === 0 ? (
                <>
                  <div className="flex flex-col items-center px-6 pb-2 pt-2 text-center">
                    <span className="mb-3.5 grid h-12 w-12 place-items-center rounded-lg border border-border bg-surface-2 text-text-subtle">
                      <IcPenLine size={22} />
                    </span>
                    <p className="text-h3 font-semibold">{t("style_rules.ff_empty_title")}</p>
                    <p className="mt-1.5 max-w-[42ch] text-small leading-relaxed text-text-muted">
                      {t("style_rules.ff_empty_sub")}
                    </p>
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                      {[t("style_rules.hint1"), t("style_rules.hint2"), t("style_rules.hint3")].map((h) => (
                        <button
                          key={h}
                          onClick={() => onAdd(h)}
                          className="rounded-full border border-dashed border-border bg-surface px-3 py-1.5 text-caption text-text-muted transition-colors hover:border-text/20 hover:bg-surface-2 hover:text-text"
                        >
                          {h}
                        </button>
                      ))}
                    </div>
                  </div>
                  <AddComposer
                    body={newBody}
                    setBody={setNewBody}
                    kind={newKind}
                    setKind={setNewKind}
                    onAdd={() => onAdd(newBody)}
                    solo
                    t={t}
                  />
                </>
              ) : (
                <>
                  <div className="flex flex-col">
                    {userRules?.map((r) => (
                      <FreeformRow key={r.id} rule={r} onEdit={onEditRule} onRemove={onDeleteRule} onToggle={onToggleUserRule} t={t} />
                    ))}
                  </div>
                  <AddComposer
                    body={newBody}
                    setBody={setNewBody}
                    kind={newKind}
                    setKind={setNewKind}
                    onAdd={() => onAdd(newBody)}
                    t={t}
                  />
                </>
              )}
            </section>
          </div>
        )}
      </main>

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
        <TweaksPanel title="Style rules">
          <TweakSection label="Appearance" />
          <TweakToggle label="Dark mode" value={tw.dark} onChange={(v) => setTw("dark", v)} />
          <TweakRadio
            label="Density"
            value={tw.density}
            options={["Comfortable", "Compact"]}
            onChange={(v) => setTw("density", v)}
          />
          <TweakSection label="Content" />
          <TweakRadio
            label="Your rules"
            value={tw.yourRules}
            options={["Some", "Empty"]}
            onChange={(v) => setTw("yourRules", v)}
          />
          <TweakRadio label="Screen" value={tw.screen} options={SR_SCREENS} onChange={(v) => setTw("screen", v)} />
        </TweaksPanel>
      )}
    </div>
  );
}

// Q44: live before→after for the human_punctuation stripper. The note explains
// it's typographic + opt-in; the demo shows the actual swap on a sample.
function PunctuationDemo({ on, t }: { on: boolean; t: (k: MessageKey) => string }) {
  const demoFrom = t("style_rules.punct_example_from");
  return (
    <>
      <p className="mt-1.5 text-caption leading-relaxed text-warning">
        {t("style_rules.punctuation_note")}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2 rounded-md border border-border bg-surface-2 px-3 py-2 font-mono text-caption">
        <code className="text-text-subtle">{demoFrom}</code>
        <span className="shrink-0 text-text-subtle">→</span>
        <code className={cn("font-medium", on ? "text-success" : "text-text-subtle")}>
          {on ? humanizePunctuation(demoFrom) : demoFrom}
        </code>
      </div>
    </>
  );
}

function FreeformRow({
  rule,
  onEdit,
  onRemove,
  onToggle,
  t,
}: {
  rule: UserRule;
  onEdit: (id: number, body: string) => void;
  onRemove: (id: number) => void;
  onToggle: (rule: UserRule) => void;
  t: (k: MessageKey) => string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(rule.body);
  const [confirming, setConfirming] = useState(false);
  return (
    <div className="group flex items-start gap-3 border-t border-border px-4 py-3.5 transition-colors first:border-t-0 hover:bg-surface-2">
      <div className="mt-0.5 shrink-0">
        <Switch checked={rule.enabled} onCheckedChange={() => onToggle(rule)} aria-label={rule.body} />
      </div>
      {editing ? (
        <div className="flex flex-1 items-center gap-2">
          <input
            value={draft}
            autoFocus
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && draft.trim()) {
                onEdit(rule.id, draft.trim());
                setEditing(false);
              }
              if (e.key === "Escape") {
                setDraft(rule.body);
                setEditing(false);
              }
            }}
            className="h-9 w-full rounded-md border border-accent bg-surface px-3 text-small text-text shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-accent)_16%,transparent)] outline-none max-md:h-11 max-md:text-[16px]"
          />
          <Button
            size="sm"
            variant="primary"
            disabled={!draft.trim()}
            onClick={() => {
              onEdit(rule.id, draft.trim());
              setEditing(false);
            }}
            icon={<IcCheck size={15} />}
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setDraft(rule.body);
              setEditing(false);
            }}
          >
            {t("common.cancel")}
          </Button>
        </div>
      ) : (
        <>
          <span className={cn("min-w-0 flex-1 pt-0.5 text-small leading-relaxed", rule.enabled ? "text-text" : "text-text-subtle")}>
            {rule.body}
          </span>
          {rule.kind !== "both" && (
            <span className="mt-0.5 shrink-0 rounded-sm border border-border bg-surface-2 px-2 py-0.5 text-caption font-semibold text-text-muted">
              {rule.kind === "post" ? t("style_rules.kind_post") : t("style_rules.kind_reply")}
            </span>
          )}
          {confirming ? (
            <span className="flex shrink-0 items-center gap-2">
              <span className="whitespace-nowrap text-small font-semibold text-danger">{t("style_rules.delete_q")}</span>
              <Button
                size="sm"
                variant="danger"
                onClick={() => {
                  onRemove(rule.id);
                  setConfirming(false);
                }}
              >
                {t("user_rules.delete")}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
                {t("common.cancel")}
              </Button>
            </span>
          ) : (
            <span className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 max-md:opacity-100">
              <button
                onClick={() => {
                  setDraft(rule.body);
                  setEditing(true);
                }}
                aria-label={t("common.save")}
                className="grid h-8 w-8 max-md:h-10 max-md:w-10 place-items-center rounded-sm text-text-subtle transition-colors hover:bg-surface hover:text-text"
              >
                <IcPencil size={15} />
              </button>
              <button
                onClick={() => setConfirming(true)}
                aria-label={t("user_rules.delete")}
                className="grid h-8 w-8 max-md:h-10 max-md:w-10 place-items-center rounded-sm text-text-subtle transition-colors hover:bg-danger/12 hover:text-danger"
              >
                <IcTrash size={15} />
              </button>
            </span>
          )}
        </>
      )}
    </div>
  );
}

function AddComposer({
  body,
  setBody,
  kind,
  setKind,
  onAdd,
  solo = false,
  t,
}: {
  body: string;
  setBody: (v: string) => void;
  kind: string;
  setKind: (v: string) => void;
  onAdd: () => void;
  solo?: boolean;
  t: (k: MessageKey) => string;
}): ReactNode {
  const KINDS: [string, MessageKey][] = [
    ["both", "style_rules.kind_both"],
    ["post", "style_rules.kind_post"],
    ["reply", "style_rules.kind_reply"],
  ];
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2.5 bg-surface-2 px-4 py-3.5",
        !solo && "border-t border-border",
      )}
    >
      <input
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && body.trim()) onAdd();
        }}
        placeholder={t("style_rules.add_placeholder")}
        aria-label={t("style_rules.add_placeholder")}
        className="h-10 min-w-0 flex-1 basis-60 rounded-md border border-border bg-surface px-3 text-small text-text outline-none focus:border-accent max-md:h-11 max-md:basis-full max-md:text-[16px]"
      />
      <div className="inline-flex shrink-0 gap-0.5 rounded-md border border-border bg-surface p-0.5">
        {KINDS.map(([k, key]) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={cn(
              "h-8 rounded-sm px-3 text-small font-medium transition-colors",
              kind === k ? "bg-text font-semibold text-bg" : "text-text-muted hover:text-text",
            )}
          >
            {t(key)}
          </button>
        ))}
      </div>
      <Button variant="primary" onClick={onAdd} disabled={!body.trim()} icon={<IcPlus size={16} />}>
        {t("style_rules.add_rule")}
      </Button>
    </div>
  );
}
