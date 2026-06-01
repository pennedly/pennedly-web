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
import { IcCheck, IcFilter, IcPencil, IcPenLine, IcPlus, IcSliders, IcTrash } from "@/components/icons";
import type { StyleRule, StyleRuleCategory, UserRule } from "@/lib/types";

const PUNCTUATION_RULE_KEY = "human_punctuation";

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

type Toast = { id: number; message: string; tone: "success" | "error" };

function fill(s: string, vars: Record<string, string | number>): string {
  return s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
}

export default function StyleRulesEditor() {
  const router = useRouter();
  const { t } = useTranslation();
  const accountId = useSelectedAccountId();
  const [rules, setRules] = useState<StyleRule[] | null>(null);
  const [userRules, setUserRules] = useState<UserRule[] | null>(null);
  const [filter, setFilter] = useState<"all" | StyleRuleCategory>("all");
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [newBody, setNewBody] = useState("");
  const [newKind, setNewKind] = useState("post");
  const [bootError, setBootError] = useState<string | null>(null);
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

  async function onToggle(rule: StyleRule) {
    if (accountId === null) return;
    const next = !rule.enabled;
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
    if (accountId === null || !body.trim()) return;
    captureEvent("ui.user_rule_added", { account_id: accountId });
    try {
      const r = await createUserRule(accountId, { kind: newKind, body: body.trim() });
      setUserRules((rs) => [...(rs ?? []), r]);
      setNewBody("");
      toast(t("style_rules.toast_rule_added"));
    } catch (e) {
      toast(String(e), "error");
    }
  }

  async function onEditRule(id: number, body: string) {
    setUserRules((rs) => rs?.map((r) => (r.id === id ? { ...r, body } : r)) ?? rs);
    try {
      await updateUserRule(id, { body });
    } catch (e) {
      toast(String(e), "error");
    }
  }

  async function onDeleteRule(id: number) {
    const prev = userRules;
    setUserRules((rs) => rs?.filter((r) => r.id !== id) ?? rs);
    try {
      await deleteUserRule(id);
    } catch (e) {
      setUserRules(prev ?? null);
      toast(String(e), "error");
    }
  }

  if (bootError) {
    return (
      <div className="min-h-screen bg-bg text-text">
        <AppTopbar maxW="740px" title={t("style_rules.title")} />
        <main className="mx-auto max-w-[740px] px-5 py-7 md:px-6">
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

  // Categories actually present, in canonical order.
  const presentCats = CATEGORIES.filter((c) => rules?.some((r) => r.category === c));
  const catCount = (c: StyleRuleCategory) => rules?.filter((r) => r.category === c).length ?? 0;
  const visible = rules
    ? filter === "all"
      ? rules
      : rules.filter((r) => r.category === filter)
    : [];

  return (
    <div className="min-h-screen bg-bg text-text">
      <AppTopbar maxW="740px"
        title={t("style_rules.title")}
        pill={
          rules ? (
            <TopbarPill tone="success">
              {fill(t("style_rules.rules_on"), { on: totalOn, total: totalRules })}
            </TopbarPill>
          ) : undefined
        }
      />
      <main className="mx-auto max-w-[740px] space-y-5 px-5 py-7 md:px-6">
        {!rules ? (
          <div className="space-y-5">
            <Skeleton className="h-28 w-full rounded-lg" />
            <Skeleton className="h-72 w-full rounded-lg" />
          </div>
        ) : (
          <>
            {/* Intro */}
            <div>
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

            {/* Built-in anti-AI rules */}
            <section className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
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

              {/* category filter chips */}
              <div role="tablist" className="flex flex-wrap items-center gap-1.5 px-4 pb-3.5">
                <Chip active={filter === "all"} onClick={() => setFilter("all")} label={t("style_rules.filter_all")} n={builtinTotal} />
                {presentCats.map((c) => (
                  <Chip key={c} active={filter === c} onClick={() => setFilter(c)} label={t(CAT_LABEL[c])} n={catCount(c)} />
                ))}
              </div>

              <div className="flex flex-col">
                {visible.length === 0 ? (
                  <div className="px-4 py-7 text-center text-small text-text-subtle">
                    {t("style_rules.no_in_category")}
                  </div>
                ) : (
                  visible.map((rule) => (
                    <div
                      key={rule.key}
                      className={cn(
                        "flex items-start gap-3.5 border-t border-border px-4 py-4 transition-colors first:border-t-0 hover:bg-surface-2",
                        !rule.enabled && "opacity-95",
                      )}
                    >
                      <div className="mt-0.5 shrink-0">
                        <Switch
                          checked={rule.enabled}
                          onCheckedChange={() => onToggle(rule)}
                          disabled={pending.has(rule.key)}
                          aria-label={rule.title}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2.5">
                          <span className={cn("text-small font-semibold", !rule.enabled && "text-text-subtle")}>
                            {rule.title}
                          </span>
                          <span className="shrink-0 rounded-sm border border-border bg-surface-2 px-2 py-px text-caption font-semibold text-text-muted">
                            {t(CAT_LABEL[rule.category])}
                          </span>
                        </div>
                        <p className={cn("mt-1 text-small leading-relaxed", rule.enabled ? "text-text-muted" : "text-text-subtle")}>
                          {rule.body}
                        </p>
                        {rule.key === PUNCTUATION_RULE_KEY && (
                          <p className="mt-1.5 text-caption leading-relaxed text-warning">
                            {t("style_rules.punctuation_note")}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Freeform rules */}
            <section className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
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
                      <FreeformRow key={r.id} rule={r} onEdit={onEditRule} onRemove={onDeleteRule} t={t} />
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
          </>
        )}
      </main>

      <ToastHost>
        {toasts.map((tt) => (
          <Toast key={tt.id} tone={tt.tone} title={tt.message} />
        ))}
      </ToastHost>
    </div>
  );
}

function Chip({
  active,
  onClick,
  label,
  n,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  n: number;
}) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-caption font-medium whitespace-nowrap transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-surface text-text-muted hover:bg-surface-2 hover:text-text",
      )}
    >
      {label}
      <span className={cn("tabular-nums", active ? "opacity-75" : "opacity-60")}>{n}</span>
    </button>
  );
}

function FreeformRow({
  rule,
  onEdit,
  onRemove,
  t,
}: {
  rule: UserRule;
  onEdit: (id: number, body: string) => void;
  onRemove: (id: number) => void;
  t: (k: MessageKey) => string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(rule.body);
  return (
    <div className="group flex items-start gap-3 border-t border-border px-4 py-3.5 transition-colors first:border-t-0 hover:bg-surface-2">
      <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rotate-45 rounded-[2px] bg-text" />
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
            className="h-9 w-full rounded-md border border-accent bg-surface px-3 text-small text-text shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-accent)_16%,transparent)] outline-none"
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
          <span className="min-w-0 flex-1 pt-px text-small leading-relaxed text-text">{rule.body}</span>
          <span className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
            <button
              onClick={() => {
                setDraft(rule.body);
                setEditing(true);
              }}
              aria-label={t("common.save")}
              className="grid h-8 w-8 place-items-center rounded-sm text-text-subtle transition-colors hover:bg-surface hover:text-text"
            >
              <IcPencil size={15} />
            </button>
            <button
              onClick={() => onRemove(rule.id)}
              aria-label={t("user_rules.delete")}
              className="grid h-8 w-8 place-items-center rounded-sm text-text-subtle transition-colors hover:bg-danger/12 hover:text-danger"
            >
              <IcTrash size={15} />
            </button>
          </span>
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
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 bg-surface-2 px-4 py-3.5",
        !solo && "border-t border-border",
      )}
    >
      <select
        value={kind}
        onChange={(e) => setKind(e.target.value)}
        aria-label="kind"
        className="h-10 shrink-0 rounded-md border border-border bg-surface px-2.5 text-small text-text outline-none focus-visible:outline-2 focus-visible:outline-accent"
      >
        <option value="post">{t("user_rules.kind_post")}</option>
        <option value="reply">{t("user_rules.kind_reply")}</option>
      </select>
      <input
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && body.trim()) onAdd();
        }}
        placeholder={t("style_rules.add_placeholder")}
        aria-label={t("style_rules.add_placeholder")}
        className="h-10 min-w-0 flex-1 rounded-md border border-border bg-surface px-3 text-small text-text outline-none focus:border-accent"
      />
      <Button variant="primary" onClick={onAdd} disabled={!body.trim()} icon={<IcPlus size={16} />}>
        {t("style_rules.add_rule")}
      </Button>
    </div>
  );
}
