"use client";

// Account Settings (/app/account/settings) — a 1:1 React port of the CD эталон
// (design-export/PennedlyDesign/Account-Settings-SPEC.html + account-screens.js).
// Account-LEVEL settings in the account-dashboard chrome (its own sidebar +
// a breadcrumb «Аккаунт › Настройки»), distinct from the per-profile Settings.
// Sections: account identity (editable name · read-only email · plan badge),
// interface language (the 8 UI locales), data export (GET /api/me/export), and
// the danger zone (DELETE /api/me). Both map to REAL endpoints — no new backend
// beyond the tiny display-name PATCH. NOT tester-gated.
//
// The .acc-* structure/classes come from account-screens.css (ported from the
// эталон); the DS primitives the spec drew from ds/components.css are the app's
// real <Input>/<Button>. Container-query responsive, so the SAME cards serve the
// desktop shell and the mobile shell with no separate layout.

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { resetAccountsPresenceForSignedOutUser } from "@/lib/accounts";
import {
  IcAlert,
  IcArchive,
  IcArrowLeft,
  IcAudit,
  IcCheck,
  IcChevRight,
  IcCopy,
  IcExternal,
  IcKey,
  IcMail,
  IcPlus,
  IcStar,
  IcTrash,
} from "@/components/icons";
import {
  clearTokens,
  deleteAccount,
  exportAccountData,
  setMyLocale,
  updateMyDisplayName,
} from "@/lib/api";
import { patchMeCache } from "@/lib/account-data";
import { LOCALES } from "@/lib/i18n/locales";
import { setLocale, useLocale } from "@/lib/i18n";
import type { LocaleCode } from "@/lib/i18n/locales";
import { formatMcpDate, MCP_CONFIG_SNIPPET, MCP_ENDPOINT, useMcpTokens } from "@/lib/use-mcp-tokens";
import type { Me, MeAccountResponse, McpTokenScope, McpTokenSummary } from "@/lib/types";

import {
  AcctMark,
  ScreenTopbar,
  Sidebar,
  useAccountNav,
} from "./AccountDashboard";
import type { Plural, T } from "./AccountDashboard";
import { AccountMobileShell } from "./AccountMobileDashboard";

// ── card shell (the эталон .acc-card2) ───────────────────────────────────────
// `headAction` is the эталон's 5th `card2(h, d, body, danger, headAction)`
// param — an optional control (the MCP card's "Create token" button) that
// sits in the header next to the title, inside `.acc-card2-headrow`.
function Card2({
  h,
  d,
  danger,
  headAction,
  children,
}: {
  h: string;
  d?: string;
  danger?: boolean;
  headAction?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className={`acc-card2${danger ? " acc-card2--danger" : ""}`}>
      <div className="acc-card2-head">
        <div className="acc-card2-headrow">
          <div className="acc-card2-h">{h}</div>
          {headAction}
        </div>
        {d ? <div className="acc-card2-d">{d}</div> : null}
      </div>
      <div className="acc-card2-body">{children}</div>
    </section>
  );
}

// ── account identity card (name edit · email · plan) ─────────────────────────
function AccountCard({ me, t }: { me: Me; t: T }) {
  const startName = me.display_name ?? "";
  const [name, setName] = useState(startName);
  // The saved baseline lives in state (the `me` prop is fetched once by the page
  // and never refreshed), so after a save `dirty` flips false → the Save button
  // hides and the 'Saved' check shows.
  const [baseName, setBaseName] = useState(startName);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState(false);
  const dirty = name.trim().length > 0 && name.trim() !== baseName;
  const mono = (me.display_name || me.tenant.name || "?").slice(0, 2).toUpperCase();
  const plan = me.tenant.plan_tier;

  async function save() {
    if (!dirty || saving) return;
    setSaving(true);
    setErr(false);
    setSaved(false);
    try {
      const res = await updateMyDisplayName(name.trim());
      setName(res.display_name);
      setBaseName(res.display_name);
      // Keep the shared cache current so switching back to the dashboard/advisor
      // shows the new name without a refetch.
      patchMeCache((m) => ({ ...m, display_name: res.display_name }));
      setSaved(true);
    } catch {
      setErr(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card2 h={t("acc.account_word")}>
      <div className="acc-set-id">
        <AcctMark mono={mono} />
        <div className="acc-set-id-who">
          <div className="acc-set-id-nm">{me.display_name || me.tenant.name}</div>
          <div className="acc-set-id-em">{me.email}</div>
        </div>
        <span className="acc-plan-badge">
          <IcStar size={13} />
          {plan}
        </span>
      </div>

      <div className="acc-set-field">
        <label className="field-label" htmlFor="acc-name">
          <span>{t("acc.set_name")}</span>
          {saved && !dirty ? (
            <span className="field-saved">
              <IcCheck size={14} />
              {t("acc.set_saved")}
            </span>
          ) : null}
        </label>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Input
            id="acc-name"
            value={name}
            error={err}
            maxLength={120}
            onChange={(e) => {
              setName(e.target.value);
              setSaved(false);
              setErr(false);
            }}
            aria-label={t("acc.set_name")}
          />
          {dirty ? (
            <Button variant="primary" size="sm" onClick={save} loading={saving} style={{ flex: "0 0 auto" }}>
              {t("acc.set_save")}
            </Button>
          ) : null}
        </div>
        <div className="field-hint">{t("acc.set_name_hint")}</div>
      </div>

      <div className="acc-set-rows">
        <div className="acc-set-row">
          <span className="sr-k">
            <IcMail size={15} />
            {t("acc.set_email")}
          </span>
          <span className="sr-v mono">{me.email}</span>
        </div>
        <div className="acc-set-row">
          <span className="sr-k">
            <IcStar size={15} />
            {t("acc.set_plan")}
          </span>
          <span className="sr-v">
            {plan} · {t("acc.set_plan_note")}
          </span>
        </div>
      </div>
    </Card2>
  );
}

// ── interface language grid (the 8 UI locales) ───────────────────────────────
function LanguageCard({ t }: { t: T }) {
  const active = useLocale();
  function pick(code: LocaleCode) {
    if (code === active) return;
    setLocale(code); // live UI switch (localStorage + subscribers)
    void setMyLocale(code).catch(() => {}); // persist server-side (fire-and-forget)
  }
  return (
    <Card2 h={t("acc.set_lang_cap")} d={t("acc.set_lang_hint")}>
      <div className="acc-langgrid" role="radiogroup" aria-label={t("acc.set_lang_cap")}>
        {LOCALES.map((l) => {
          const on = l.code === active;
          return (
            <button
              key={l.code}
              type="button"
              role="radio"
              aria-checked={on}
              className={`acc-lang${on ? " acc-lang--active" : ""}`}
              onClick={() => pick(l.code)}
            >
              <span className="acc-lang-code">{l.code.toUpperCase()}</span>
              <span className="acc-lang-txt">
                <span className="acc-lang-nm">{l.name}</span>
                <span className="acc-lang-rg">{l.en}</span>
              </span>
              <span className="acc-lang-tick">
                <IcCheck size={16} />
              </span>
            </button>
          );
        })}
      </div>
    </Card2>
  );
}

// ── data export (GET /api/me/export) ─────────────────────────────────────────
type ExportState = "idle" | "preparing" | "ready";

function DataCard({ t }: { t: T }) {
  const [state, setState] = useState<ExportState>("idle");
  const [err, setErr] = useState(false);

  async function run() {
    if (state === "preparing") return;
    setState("preparing");
    setErr(false);
    try {
      const data = await exportAccountData();
      // The endpoint returns the dump synchronously; save it as a file client-side.
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "pennedly-export.json";
      a.click();
      URL.revokeObjectURL(url);
      setState("ready");
    } catch {
      setErr(true);
      setState("idle");
    }
  }

  let act: React.ReactNode;
  let note: string;
  if (state === "preparing") {
    act = (
      <span className="acc-export-state">
        <span className="spinner" />
        {t("acc.export_preparing")}
      </span>
    );
    note = t("acc.export_prep_note");
  } else if (state === "ready") {
    act = (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 11 }}>
        <span className="acc-export-ready">
          <IcCheck size={15} />
          {t("acc.export_ready")}
        </span>
        <Button variant="secondary" size="sm" icon={<IcArchive size={15} />} onClick={run}>
          {t("acc.export_download")}
        </Button>
      </span>
    );
    note = t("acc.export_ready_note");
  } else {
    act = (
      <Button variant="secondary" size="sm" icon={<IcArchive size={15} />} onClick={run}>
        {t("acc.export_btn")}
      </Button>
    );
    note = err ? t("acc.export_failed") : t("acc.export_s");
  }

  return (
    <Card2 h={t("acc.set_data_cap")}>
      <div className="acc-actionrow">
        <span className="acc-actionrow-ico">
          <IcArchive size={18} />
        </span>
        <div className="acc-actionrow-txt">
          <div className="acc-actionrow-t">
            {t("acc.export_t")}
            <span className="acc-endpoint">
              <b>GET</b> /api/me/export
            </span>
          </div>
          <div className="acc-actionrow-s">{note}</div>
        </div>
        <span className="acc-actionrow-act">{act}</span>
      </div>
    </Card2>
  );
}

// ── danger zone (DELETE /api/me) ─────────────────────────────────────────────
type DeleteState = "idle" | "confirm" | "deleting";

function DangerCard({ t }: { t: T }) {
  const router = useRouter();
  const [state, setState] = useState<DeleteState>("idle");
  const [word, setWord] = useState("");
  const [err, setErr] = useState(false);
  const confirmWord = t("acc.delete_type_word");
  const canDelete = word.trim().toUpperCase() === confirmWord.toUpperCase();

  async function go() {
    if (!canDelete || state === "deleting") return;
    setState("deleting");
    setErr(false);
    try {
      await deleteAccount();
      resetAccountsPresenceForSignedOutUser();
      clearTokens();
      router.push("/app/login");
    } catch {
      setErr(true);
      setState("confirm");
    }
  }

  return (
    <Card2 h={t("acc.danger_cap")} danger>
      <div className="acc-actionrow">
        <span className="acc-actionrow-ico acc-actionrow-ico--danger">
          <IcTrash size={18} />
        </span>
        <div className="acc-actionrow-txt">
          <div className="acc-actionrow-t">
            {t("acc.delete_t")}
            <span className="acc-endpoint">
              <b>DELETE</b> /api/me
            </span>
          </div>
          <div className="acc-actionrow-s">{err ? t("acc.delete_failed") : t("acc.delete_s")}</div>
        </div>
        {state === "idle" ? (
          <span className="acc-actionrow-act">
            <Button variant="danger" size="sm" icon={<IcTrash size={15} />} onClick={() => setState("confirm")}>
              {t("acc.delete_btn")}
            </Button>
          </span>
        ) : null}
      </div>

      {state === "confirm" ? (
        <div className="acc-del-confirm">
          <div className="acc-del-confirm-t">{t("acc.delete_confirm_t")}</div>
          <div className="acc-del-confirm-s">{t("acc.delete_confirm_s")}</div>
          <div className="acc-del-type">
            <div className="acc-del-type-lab">
              {t("acc.delete_type_lab")} <b>{confirmWord}</b>
            </div>
            <Input
              value={word}
              error={word.length > 0 && !canDelete}
              placeholder={confirmWord}
              onChange={(e) => setWord(e.target.value)}
              aria-label={`${t("acc.delete_type_lab")} ${confirmWord}`}
            />
          </div>
          <div className="acc-del-actions">
            <Button variant="ghost" size="sm" onClick={() => { setState("idle"); setWord(""); }}>
              {t("acc.delete_cancel")}
            </Button>
            <Button variant="danger" size="sm" icon={<IcTrash size={15} />} disabled={!canDelete} onClick={go}>
              {t("acc.delete_go")}
            </Button>
          </div>
        </div>
      ) : null}

      {state === "deleting" ? (
        <div className="acc-deleting">
          <span className="spinner" />
          <div>
            <div className="acc-deleting-t">{t("acc.deleting")}</div>
            <div className="acc-deleting-s">{t("acc.deleting_note")}</div>
          </div>
        </div>
      ) : null}
    </Card2>
  );
}

// ── MCP personal tokens (§7.17) ───────────────────────────────────────────────
// 1:1 port of the эталон's settingsMcpCard/mcpRow/mcpForm/mcpReveal/mcpConnect
// (account-screens.js). Fetch/create/revoke logic lives in the shared
// `useMcpTokens` hook (also used by the old /app/settings screen) so the two
// screens never carry two independently-maintained copies of that logic —
// this component only owns the card's own view state (list vs. create-form)
// and markup.
function ScopeBadge({ scope, t }: { scope: McpTokenScope; t: T }) {
  return (
    <span className={`acc-scope-badge acc-scope-badge--${scope}`}>
      {scope === "read_write" ? t("settings.mcp.scope.read_write") : t("settings.mcp.scope.read")}
    </span>
  );
}

function McpRow({
  tok,
  t,
  locale,
  confirming,
  revoking,
  onRevokeClick,
  onCancelRevoke,
  onConfirmRevoke,
}: {
  tok: McpTokenSummary;
  t: T;
  locale: string;
  confirming: boolean;
  revoking: boolean;
  onRevokeClick: () => void;
  onCancelRevoke: () => void;
  onConfirmRevoke: () => void;
}) {
  const revoked = !!tok.revoked_at;
  return (
    <>
      <div className={`acc-mcp-row${revoked ? " acc-mcp-row--revoked" : ""}`}>
        <span className="acc-mcp-ico">
          <IcKey size={17} />
        </span>
        <div className="acc-mcp-body">
          <div className="acc-mcp-name-row">
            <span className="acc-mcp-name">{tok.name}</span>
            {revoked ? (
              <span className="acc-revoked-badge">{t("settings.mcp.revoked_badge")}</span>
            ) : (
              <ScopeBadge scope={tok.scope} t={t} />
            )}
          </div>
          <div className="acc-mcp-meta">
            <span>
              {t("settings.mcp.created_label")} {formatMcpDate(tok.created_at, locale)}
            </span>
            <span className="dot" />
            <span>
              {revoked
                ? `${t("settings.mcp.revoked_label")} ${formatMcpDate(tok.revoked_at!, locale)}`
                : tok.last_used_at
                  ? `${t("settings.mcp.last_used_label")} ${formatMcpDate(tok.last_used_at, locale)}`
                  : t("settings.mcp.last_used_never")}
            </span>
          </div>
        </div>
        {revoked ? null : (
          <span className="acc-mcp-act">
            <Button variant="ghost" size="sm" onClick={onRevokeClick}>
              {t("settings.mcp.revoke_btn")}
            </Button>
          </span>
        )}
      </div>
      {confirming ? (
        <div className="acc-mcp-revoke-confirm">
          <div className="acc-mcp-revoke-confirm-t">{t("acc.mcp_revoke_confirm_t")}</div>
          <div className="acc-mcp-revoke-confirm-s">{t("acc.mcp_revoke_confirm_s")}</div>
          <div className="acc-mcp-revoke-confirm-act">
            <Button variant="ghost" size="sm" onClick={onCancelRevoke} disabled={revoking}>
              {t("common.cancel")}
            </Button>
            <Button variant="danger" size="sm" icon={<IcTrash size={15} />} loading={revoking} onClick={onConfirmRevoke}>
              {t("acc.mcp_revoke_go")}
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}

function McpConnect({ t, copied, onCopy }: { t: T; copied: string | null; onCopy: (text: string, which: string) => void }) {
  return (
    <div className="acc-mcp-connect">
      <div className="acc-mcp-connect-t">{t("settings.mcp.connect_title")}</div>
      <div className="acc-mcp-connect-s">{t("acc.mcp_connect_s")}</div>
      <div className="acc-mcp-field-lab">{t("settings.mcp.connect_endpoint_label")}</div>
      <div className="acc-tokval">
        <IcExternal size={15} />
        <code>{MCP_ENDPOINT}</code>
        <button type="button" className="acc-copy-btn" onClick={() => onCopy(MCP_ENDPOINT, "endpoint")}>
          {copied === "endpoint" ? <IcCheck size={13} /> : <IcCopy size={13} />}
          {t("acc.mcp_copy")}
        </button>
      </div>
      <div className="acc-mcp-field-lab">{t("acc.mcp_config_label")}</div>
      <div className="acc-codeblock">
        <div className="acc-codeblock-head">
          <button type="button" className="acc-copy-btn" onClick={() => onCopy(MCP_CONFIG_SNIPPET, "config")}>
            {copied === "config" ? <IcCheck size={13} /> : <IcCopy size={13} />}
            {t("acc.mcp_copy")}
          </button>
        </div>
        <pre>{MCP_CONFIG_SNIPPET}</pre>
      </div>
    </div>
  );
}

function McpCard({ t, demoTokens }: { t: T; demoTokens?: McpTokenSummary[] | null }) {
  const locale = useLocale();
  const mcp = useMcpTokens({ demoTokens: demoTokens ?? null });
  const [creatingView, setCreatingView] = useState(false);

  // A successful create swaps the card into the one-time reveal panel — land
  // back on the list (not the form) once the user dismisses it.
  useEffect(() => {
    if (mcp.reveal) setCreatingView(false);
  }, [mcp.reveal]);

  function openForm() {
    mcp.resetForm();
    setCreatingView(true);
  }
  function cancelForm() {
    mcp.resetForm();
    setCreatingView(false);
  }

  const view: "list" | "create" | "reveal" = mcp.reveal ? "reveal" : creatingView ? "create" : "list";

  const headAction =
    view === "list" ? (
      <Button variant="secondary" size="sm" icon={<IcPlus size={15} />} onClick={openForm}>
        {t("settings.mcp.create_btn")}
      </Button>
    ) : null;

  let body: React.ReactNode;
  if (view === "create") {
    body = (
      <div className="acc-mcp-form">
        <div className="acc-set-field" style={{ marginTop: 0 }}>
          <label className="field-label" htmlFor="acc-mcp-name">
            {t("settings.mcp.name_label")}
          </label>
          <Input
            id="acc-mcp-name"
            value={mcp.name}
            onChange={(e) => mcp.setName(e.target.value)}
            placeholder={t("settings.mcp.name_placeholder")}
            maxLength={80}
            aria-label={t("settings.mcp.name_label")}
          />
          <div className="field-hint">{t("acc.mcp_form_name_hint")}</div>
        </div>
        <div>
          <label className="field-label">{t("settings.mcp.scope_label")}</label>
          <div className="acc-scope-toggle" role="radiogroup" aria-label={t("settings.mcp.scope_label")}>
            {(["read", "read_write"] as const).map((s) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={mcp.scope === s}
                className={`acc-scope-opt${mcp.scope === s ? " acc-scope-opt--active" : ""}`}
                onClick={() => mcp.setScope(s)}
              >
                {s === "read" ? t("settings.mcp.scope.read") : t("settings.mcp.scope.read_write")}
              </button>
            ))}
          </div>
          <div className="field-hint">{t("acc.mcp_form_scope_hint")}</div>
        </div>
        {mcp.createError ? <p className="field-hint" style={{ color: "var(--color-danger)" }}>{mcp.createError}</p> : null}
        <div className="acc-mcp-form-actions">
          <Button variant="ghost" size="sm" onClick={cancelForm} disabled={mcp.creating}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<IcPlus size={15} />}
            loading={mcp.creating}
            disabled={mcp.creating || !mcp.name.trim()}
            onClick={() => mcp.create()}
          >
            {t("settings.mcp.create_btn")}
          </Button>
        </div>
      </div>
    );
  } else if (view === "reveal" && mcp.reveal) {
    body = (
      <div className="acc-mcp-reveal">
        <div>
          <div className="acc-mcp-reveal-t">{t("acc.mcp_reveal_t")}</div>
          <div className="acc-mcp-reveal-s">{t("acc.mcp_reveal_s")}</div>
        </div>
        <div className="acc-tokval">
          <IcKey size={15} />
          <code>{mcp.reveal.token}</code>
          <button type="button" className="acc-copy-btn" onClick={() => mcp.copy(mcp.reveal!.token, "token")}>
            {mcp.copied === "token" ? <IcCheck size={13} /> : <IcCopy size={13} />}
            {t("acc.mcp_copy")}
          </button>
        </div>
        <div className="acc-mcp-warn">
          <IcAlert size={15} />
          <span>{t("acc.mcp_reveal_warn")}</span>
        </div>
        <div className="acc-mcp-form-actions">
          <Button variant="primary" size="sm" icon={<IcCheck size={15} />} onClick={() => mcp.dismissReveal()}>
            {t("acc.mcp_reveal_done")}
          </Button>
        </div>
      </div>
    );
  } else if (!mcp.loaded) {
    body = (
      <div className="acc-mcp-list">
        <div className="acc-set-skel" style={{ height: 56 }} />
        <div className="acc-set-skel" style={{ height: 56, marginTop: 10 }} />
      </div>
    );
  } else if (mcp.tokens.length === 0) {
    body = (
      <div className="acc-mcp-empty">
        <div className="acc-mcp-empty-t">{t("settings.mcp.empty.title")}</div>
        <div className="acc-mcp-empty-s">{t("acc.mcp_empty_s")}</div>
      </div>
    );
  } else {
    body = (
      <div className="acc-mcp-list">
        {mcp.tokens.map((tok) => (
          <McpRow
            key={tok.id}
            tok={tok}
            t={t}
            locale={locale}
            confirming={mcp.revokeConfirmId === tok.id}
            revoking={mcp.revokingId === tok.id}
            onRevokeClick={() => mcp.setRevokeConfirmId(tok.id)}
            onCancelRevoke={() => mcp.setRevokeConfirmId(null)}
            onConfirmRevoke={() => mcp.revoke(tok)}
          />
        ))}
      </div>
    );
  }

  return (
    <Card2 h={t("acc.mcp_cap")} d={t("acc.mcp_hint")} headAction={headAction}>
      {body}
      <McpConnect t={t} copied={mcp.copied} onCopy={mcp.copy} />
    </Card2>
  );
}

// ── the settings body (head + 4 cards) — shared desktop + mobile ─────────────
// «История изменений» — a quiet link row into the applied-changes journal (the
// design's `.ch-entryrow`): what Pennedly applied for you by a one-click.
function HistoryLinkCard({ t }: { t: T }) {
  return (
    <Link
      href="/app/account/history"
      className="group flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3.5 shadow-sm transition-colors hover:border-accent/40"
    >
      <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-md border border-border bg-surface-2 text-text-muted transition-colors group-hover:border-accent/30 group-hover:text-accent">
        <IcAudit size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-small font-semibold text-text">{t("appliedChanges.entryTitle")}</span>
        <span className="mt-0.5 block text-caption leading-[1.45] text-text-subtle">{t("appliedChanges.entrySub")}</span>
      </span>
      <IcChevRight size={18} className="shrink-0 text-text-subtle transition-colors group-hover:text-accent" />
    </Link>
  );
}

function SettingsBody({
  me,
  t,
  noHead,
  mcpDemoTokens,
}: {
  me: Me;
  t: T;
  noHead?: boolean;
  mcpDemoTokens?: McpTokenSummary[] | null;
}) {
  return (
    <div className="acc-page">
      {noHead ? null : (
        <div className="acc-pagehead">
          <div className="acc-pagehead-t">{t("acc.nav_settings")}</div>
          <div className="acc-pagehead-d">{t("acc.set_lead")}</div>
        </div>
      )}
      <AccountCard me={me} t={t} />
      <HistoryLinkCard t={t} />
      <LanguageCard t={t} />
      <DataCard t={t} />
      <McpCard t={t} demoTokens={mcpDemoTokens} />
      <DangerCard t={t} />
    </div>
  );
}

// ── desktop screen (account shell: sidebar + breadcrumb topbar) ──────────────
export function AccountSettings({
  data,
  me,
  t,
  dark,
  mcpDemoTokens,
}: {
  data: MeAccountResponse;
  me: Me;
  t: T;
  dark?: boolean;
  // Non-null (even []) renders the MCP card offline on sample tokens instead
  // of fetching — the real `/app/account/settings` page passes this only
  // behind `?demo=1`; /gallery passes it always (no auth, no backend there).
  mcpDemoTokens?: McpTokenSummary[] | null;
}) {
  const nav = useAccountNav();
  return (
    <div className="acc-shell">
      <Sidebar data={data} t={t} nav={nav} active="settings" />
      <div className="acc-mainwrap" style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 18 }}>
        <ScreenTopbar page="settings" tenantName={data.tenant.name} t={t} nav={nav} dark={dark} />
        <SettingsBody me={me} t={t} mcpDemoTokens={mcpDemoTokens} />
      </div>
    </div>
  );
}

// ── mobile screen (top bar + drawer) ─────────────────────────────────────────
export function AccountMobileSettings({
  data,
  me,
  t,
  plural,
  dark,
  mcpDemoTokens,
}: {
  data: MeAccountResponse;
  me: Me;
  t: T;
  plural: Plural;
  dark?: boolean;
  mcpDemoTokens?: McpTokenSummary[] | null;
}) {
  return (
    <AccountMobileShell data={data} t={t} plural={plural} title={t("acc.nav_settings")} active="settings" dark={dark}>
      <SettingsBody me={me} t={t} noHead mcpDemoTokens={mcpDemoTokens} />
    </AccountMobileShell>
  );
}

// ── loading skeleton (mirrors the эталон settingsSkeleton) ───────────────────
function SkelCard({ lines }: { lines: number }) {
  return (
    <section className="acc-card2">
      <div className="acc-card2-head">
        <div className="acc-set-skel" style={{ width: 150, height: 15 }} />
      </div>
      <div className="acc-card2-body">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="acc-set-skel" style={{ height: 44, marginTop: 10 }} />
        ))}
      </div>
    </section>
  );
}

function SettingsSkeletonBody({ noHead }: { noHead?: boolean }) {
  return (
    <div className="acc-page">
      {noHead ? null : (
        <div className="acc-pagehead">
          <div className="acc-set-skel" style={{ width: 210, height: 26 }} />
          <div className="acc-set-skel" style={{ width: 340, height: 12, marginTop: 12 }} />
        </div>
      )}
      <SkelCard lines={3} />
      <SkelCard lines={4} />
      <SkelCard lines={1} />
      <SkelCard lines={2} />
      <SkelCard lines={1} />
    </div>
  );
}

export function AccountSettingsSkeleton() {
  return <SettingsSkeletonBody />;
}

export function AccountMobileSettingsSkeleton() {
  return (
    <div className="acc-mob">
      <SettingsSkeletonBody noHead />
    </div>
  );
}
