"use client";

// Audits presentational layer — pure components driven by props, so the live
// list/detail (real API) and the ?demo=1 review (mock data) render identical
// pixels. Built 1:1 to Audits-SPEC.html: audit rows, coach narrative, change
// cards with diff viewer / per-change note / autopilot hours / effect chip /
// approve-reject. Append-only (no undo). Reading-width 720.

import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/cn";
import { useTranslation, type MessageKey } from "@/lib/i18n";
import { localUtcOffsetLabel, utcHourToLocal } from "@/lib/timezone";
import { Button, buttonClasses } from "@/components/ui/button";
import { BrandMark, IcArrowDown, IcArrowLeft, IcArrowUp, IcAudit, IcCheck, IcChevDown, IcClock, IcFormat, IcInfo, IcPencil, IcPenLine, IcPower, IcRepeat, IcReplies, IcSparkle, IcTag, IcVoice, IcX } from "@/components/icons";
import type { ChangeStatus, DemoChange } from "@/components/studio/audits-demo";
import type { AuditDim } from "@/components/studio/audits-redesign";

export type ChangeModel = DemoChange;

export type AuditRowModel = {
  id: number;
  title: string;
  range: string;
  summary?: string;
  postsAnalyzed: number;
  wowDelta: number | null;
  undecided: number;
  total: number;
  dims?: AuditDim[]; // 7-dimension coverage strip (hidden until the backend supplies it)
};

export type AuditDetailModel = {
  id: number;
  title: string;
  range: string;
  postsAnalyzed: number;
  narrative: string[];
  changes: ChangeModel[];
};

export type AuditHandlers = {
  onApprove: (c: ChangeModel) => void;
  onReject: (c: ChangeModel) => void;
  onSaveNote: (c: ChangeModel, note: string | null) => void;
};

function fmtHour(h: number): string {
  const am = h < 12;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12} ${am ? "AM" : "PM"}`;
}

// ── AuditOptIn (Screen 0 — the OFF / opt-in front door, built 1:1 to
// Audit-Redesign-SPEC `bodyOptIn`). Shown at /app/audits when the account hasn't
// turned the weekly audit on (it's per-account + token-costing → OFF by default).
// `onEnable` flips `audit_enabled` via PATCH /api/audits/settings. ────────────
const OPTIN_DIMS = [
  { key: "topics", Icon: IcTag },
  { key: "scenarios", Icon: IcRepeat },
  { key: "timing", Icon: IcClock },
  { key: "voice", Icon: IcVoice },
  { key: "rules", Icon: IcPenLine },
  { key: "replies", Icon: IcReplies },
  { key: "format", Icon: IcFormat },
] as const;

const OPTIN_BENEFITS = [
  { Icon: IcTag, tk: "audit.optin.b1_t", dk: "audit.optin.b1_d" },
  { Icon: IcRepeat, tk: "audit.optin.b2_t", dk: "audit.optin.b2_d" },
  { Icon: IcClock, tk: "audit.optin.b3_t", dk: "audit.optin.b3_d" },
  { Icon: IcSparkle, tk: "audit.optin.b4_t", dk: "audit.optin.b4_d" },
] as const;

export function AuditOptIn({ onEnable, busy }: { onEnable: () => void; busy?: boolean }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-4">
      <section className="relative overflow-hidden rounded-xl border border-border bg-surface px-[30px] pb-7 pt-8 shadow-sm max-md:px-5 max-md:pb-6 max-md:pt-[26px]">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full"
          style={{ background: "radial-gradient(circle, color-mix(in srgb, var(--color-accent) 9%, transparent) 0%, transparent 70%)" }}
        />
        <span className="relative mb-[18px] grid h-[52px] w-[52px] place-items-center rounded-lg border border-accent/25 bg-accent/[0.12] text-accent">
          <IcAudit size={26} />
        </span>
        <div className="text-caption font-semibold uppercase tracking-[0.06em] text-text-subtle">{t("audit.optin.eyebrow")}</div>
        <h1 className="relative mt-2 text-h1 font-semibold tracking-[-0.02em]">{t("audit.optin.title")}</h1>
        <p
          className="relative mt-[11px] max-w-[56ch] text-body leading-[1.62] text-text-muted [text-wrap:pretty] [&_b]:font-semibold [&_b]:text-text"
          dangerouslySetInnerHTML={{ __html: t("audit.optin.lede") }}
        />
        <div className="relative mt-5 flex flex-wrap items-center gap-[7px]">
          <span className="mr-[3px] text-caption text-text-subtle">{t("audit.optin.dims_cap")}</span>
          {OPTIN_DIMS.map(({ key, Icon }) => (
            <span key={key} className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-surface-2 px-2.5 py-1 text-caption text-text-muted">
              <Icon size={12} className="shrink-0 text-text-subtle" />
              {t(`audit.dim.${key}` as MessageKey)}
            </span>
          ))}
        </div>
        <div className="relative mt-6 flex flex-wrap items-center gap-3.5">
          <Button variant="primary" size="lg" icon={<IcPower size={18} />} onClick={onEnable} disabled={busy} className="max-md:flex-1 max-md:basis-full">
            {t("audit.optin.cta")}
          </Button>
          <span className="text-caption text-text-subtle">{t("audit.optin.cta_sub")}</span>
        </div>
        <div className="relative mt-4 flex items-start gap-2 text-caption leading-[1.5] text-text-subtle">
          <IcInfo size={13} className="mt-px shrink-0" />
          <span>{t("audit.optin.note")}</span>
        </div>
      </section>
      <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
        {OPTIN_BENEFITS.map(({ Icon, tk, dk }) => (
          <div key={tk} className="flex gap-3 rounded-lg border border-border bg-surface p-4 shadow-sm">
            <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-md border border-border bg-surface-2 text-text-muted">
              <Icon size={17} />
            </span>
            <div>
              <div className="text-small font-semibold tracking-[-0.003em] text-text">{t(tk as MessageKey)}</div>
              <div className="mt-1 text-caption leading-[1.5] text-text-muted [text-wrap:pretty]">{t(dk as MessageKey)}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-start gap-[11px] rounded-lg border border-success/30 bg-success/[0.06] px-[17px] py-[15px]">
        <IcCheck size={16} className="mt-px shrink-0 text-success" />
        <div className="text-small leading-[1.55] text-text [&_b]:font-semibold" dangerouslySetInnerHTML={{ __html: t("audit.optin.reassure") }} />
      </div>
    </div>
  );
}

// ─────────────────────────────── AuditRow ───────────────────────────────────
export function AuditRow({ audit, onOpen }: { audit: AuditRowModel; onOpen: (id: number) => void }) {
  const { t } = useTranslation();
  const needs = audit.undecided > 0;
  const decided = audit.total - audit.undecided;
  return (
    <button
      type="button"
      onClick={() => onOpen(audit.id)}
      className={cn(
        "relative flex w-full items-center gap-[18px] rounded-lg border bg-surface px-5 py-[18px] text-left shadow-sm transition-all hover:border-text/15 hover:shadow-md",
        needs ? "border-accent/30" : "border-border",
      )}
      style={{ animation: "card-in var(--duration-slow) var(--ease-entrance) both" }}
    >
      {needs && <span className="absolute bottom-4 left-[-1px] top-4 w-[3px] rounded-full bg-accent" />}
      <span className="min-w-0 flex-1">
        <span className="block text-h3 font-semibold tracking-[-0.006em]">{audit.title}</span>
        {audit.summary && <span className="mt-[5px] block text-small leading-[1.5] text-text-muted max-md:line-clamp-2">{audit.summary}</span>}
        <span className="mt-2.5 flex flex-wrap items-center gap-[9px] text-caption text-text-subtle">
          <span>{audit.range}</span>
          <span className="opacity-50">·</span>
          <span>
            {audit.postsAnalyzed} {t("audits.posts_analyzed")}
          </span>
          <span className="opacity-50">·</span>
          <span>
            {decided} {t("audits.of_word")} {audit.total} {t("audits.decided_of_total")}
          </span>
          {audit.wowDelta !== null && (
            <span className={cn("inline-flex items-center gap-1 font-semibold tabular-nums", audit.wowDelta >= 0 ? "text-success" : "text-danger")}>
              {audit.wowDelta >= 0 ? <IcArrowUp size={12} /> : <IcArrowDown size={12} />}
              {Math.abs(audit.wowDelta)}% {t("audits.wow")}
            </span>
          )}
        </span>
        {audit.dims && audit.dims.length > 0 && (
          <span className="mt-[11px] flex flex-wrap items-center gap-[5px]">
            <span className="mr-[3px] text-caption text-text-subtle">{t("audit.list.coverage")}</span>
            {OPTIN_DIMS.map(({ key, Icon }) => {
              const on = audit.dims!.includes(key as AuditDim);
              return (
                <span
                  key={key}
                  title={t(`audit.dim.${key}` as MessageKey)}
                  className={cn("inline-grid h-[22px] w-[22px] place-items-center rounded-[var(--radius-sm)] border border-border bg-surface-2 text-text-muted", !on && "opacity-[0.32]")}
                >
                  <Icon size={12} />
                </span>
              );
            })}
          </span>
        )}
      </span>
      <span className="flex shrink-0 items-center gap-3.5 max-md:gap-2.5">
        {needs ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/12 px-2.5 py-1 text-caption font-medium text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {t("audits.cstatus_needs")}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-text/[0.06] px-2.5 py-1 text-caption font-medium text-text-muted">{t("audits.reviewed")}</span>
        )}
        <IcChevDown size={18} className="-rotate-90 text-text-subtle" />
      </span>
    </button>
  );
}

export function AuditsEmpty() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center rounded-lg border border-dashed border-border bg-surface/50 px-7 py-16 text-center">
      <span className="mb-[18px] grid h-[54px] w-[54px] place-items-center rounded-lg border border-border bg-surface-2 text-text-subtle">
        <IcAudit size={26} />
      </span>
      <h2 className="text-h2 font-semibold tracking-[-0.01em]">{t("audits.empty_title")}</h2>
      <p className="mt-2 max-w-[46ch] text-body leading-[1.55] text-text-muted">{t("audits.empty_sub")}</p>
    </div>
  );
}

export function AuditsSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="rounded-lg border border-border bg-surface px-5 py-[18px] shadow-sm">
          <div className="skel h-[18px] w-[150px] rounded" />
          <div className="skel mt-2.5 h-[11px] w-[80%] rounded" />
          <div className="skel mt-3 h-2.5 w-[240px] rounded" />
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────── Detail ─────────────────────────────────────
export function AuditDetailView({ audit, onBack, h }: { audit: AuditDetailModel; onBack: () => void; h: AuditHandlers }) {
  const { t } = useTranslation();
  const total = audit.changes.length;
  const applied = audit.changes.filter((c) => c.status === "applied").length;
  const rejected = audit.changes.filter((c) => c.status === "rejected").length;
  const pending = audit.changes.filter((c) => c.status === "undecided").length;
  return (
    <>
      <button type="button" onClick={onBack} className="inline-flex items-center gap-[7px] self-start py-1 pr-1.5 text-small font-medium text-text-muted transition-colors hover:text-text">
        <IcArrowLeft size={16} /> {t("audits.all_audits")}
      </button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-h1 font-semibold tracking-[-0.015em]">{audit.title}</h1>
          <div className="mt-1 text-small text-text-subtle">
            {audit.range} · {audit.postsAnalyzed} {t("audits.posts_analyzed")}
          </div>
        </div>
        {pending > 0 ? (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-accent/30 bg-accent/12 px-2.5 py-1 text-caption font-medium text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {pending} {t("audits.to_review")}
          </span>
        ) : (
          <span className="inline-flex shrink-0 items-center rounded-full border border-border bg-text/[0.06] px-2.5 py-1 text-caption font-medium text-text-muted">{t("audits.reviewed")}</span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-[18px] gap-y-2 text-small text-text-muted">
        <Tally n={total} word={t("audits.suggestions_word")} dot="bg-text-subtle" />
        {applied > 0 && <Tally n={applied} word={t("audits.detail.applied")} dot="bg-success" />}
        {rejected > 0 && <Tally n={rejected} word={t("audits.detail.rejected_label")} dot="bg-danger" />}
        {pending > 0 && <Tally n={pending} word={t("audits.status.pending")} dot="bg-accent" />}
      </div>

      {/* coach narrative */}
      <section className="rounded-xl border border-border bg-surface-2 px-[22px] py-5 max-md:px-[18px]">
        <div className="mb-3.5 flex items-center gap-[11px]">
          <BrandMark size={34} radius={9} className="shadow-sm" />
          <span>
            <span className="block text-small font-semibold">{t("audits.coach_name")}</span>
            <span className="block whitespace-nowrap text-caption text-text-subtle max-md:whitespace-normal">
              {t("audits.coach_role")} · {audit.range}
            </span>
          </span>
        </div>
        <div className="text-body leading-[1.65] text-text">
          {audit.narrative.map((p, i) => (
            <p key={i} className={i < audit.narrative.length - 1 ? "mb-3" : ""}>
              {p}
            </p>
          ))}
        </div>
      </section>

      <div className="text-caption font-semibold uppercase tracking-[0.06em] text-text-subtle">{t("audits.detail.proposed_changes")}</div>
      <div className="flex flex-col gap-3.5">
        {audit.changes.map((c) => (
          <ChangeCard key={c.id} change={c} h={h} />
        ))}
      </div>
    </>
  );
}

function Tally({ n, word, dot }: { n: number; word: string; dot: string }) {
  return (
    <span className="inline-flex items-center gap-[7px]">
      <span className={cn("h-[7px] w-[7px] rounded-full", dot)} />
      <b className="font-semibold tabular-nums text-text">{n}</b> {word}
    </span>
  );
}

// ─────────────────────────────── ChangeCard ─────────────────────────────────
function ChangeCard({ change, h }: { change: ChangeModel; h: AuditHandlers }) {
  const { t } = useTranslation();
  const [diffOpen, setDiffOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [noteBuffer, setNoteBuffer] = useState(change.note ?? "");
  const decided = change.status !== "undecided";

  return (
    <article
      className={cn(
        "rounded-lg border border-border bg-surface px-[18px] pb-3.5 pt-4 shadow-sm transition-colors hover:border-text/12",
        change.status === "rejected" && "opacity-[0.72]",
      )}
      style={{ animation: "card-in var(--duration-slow) var(--ease-entrance) both" }}
    >
      <div className="flex items-center gap-2.5">
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-surface-2 px-2.5 py-[3px] text-caption font-semibold text-text-muted">{change.category}</span>
        <h3 className="flex-1 text-h3 font-semibold leading-[1.3] tracking-[-0.006em]">{change.title}</h3>
        <ChangeStatusBadge status={change.status} />
      </div>

      {change.detail && <p className="mt-[11px] text-body leading-[1.6] text-text-muted">{change.detail}</p>}

      {/* extras: diff toggle + add-note */}
      <div className="mt-[13px] flex flex-wrap gap-2">
        {change.diff && (
          <button type="button" aria-expanded={diffOpen} onClick={() => setDiffOpen((v) => !v)} className="inline-flex items-center gap-1.5 rounded-full border border-border px-[11px] py-[5px] text-caption font-medium text-text-muted transition-colors hover:bg-surface-2 hover:text-text">
            <IcAudit size={13} /> {diffOpen ? t("audits.hide_change") : t("audits.view_change")}
          </button>
        )}
        {!decided && !change.note && !editing && (
          <button type="button" onClick={() => { setNoteBuffer(""); setEditing(true); }} className="inline-flex items-center gap-1.5 rounded-full border border-border px-[11px] py-[5px] text-caption font-medium text-text-muted transition-colors hover:bg-surface-2 hover:text-text">
            <IcPencil size={13} /> {t("audits.add_note")}
          </button>
        )}
      </div>

      {/* diff */}
      {diffOpen && change.diff && (
        <div className="mt-3 overflow-hidden rounded-md border border-border font-mono text-caption leading-[1.6]" style={{ animation: "card-in var(--duration-base) var(--ease-entrance) both" }}>
          <div className="flex gap-2 whitespace-pre-wrap break-words bg-danger/[0.09] px-3 py-[7px] text-danger max-md:flex-wrap">
            <span className="hidden basis-full font-sans text-caption font-semibold uppercase tracking-[0.04em] opacity-80 max-md:block">{t("audits.diff_now")}</span>
            <span className="opacity-70">−</span>
            <span>{change.diff.before}</span>
          </div>
          <div className="flex gap-2 whitespace-pre-wrap break-words bg-success/10 px-3 py-[7px] text-success max-md:flex-wrap">
            <span className="hidden basis-full font-sans text-caption font-semibold uppercase tracking-[0.04em] opacity-80 max-md:block">{t("audits.diff_proposed")}</span>
            <span className="opacity-70">+</span>
            <span>{change.diff.after}</span>
          </div>
        </div>
      )}

      {/* note editor / saved note */}
      {editing ? (
        <div className="mt-3">
          <textarea
            autoFocus
            rows={2}
            value={noteBuffer}
            onChange={(e) => setNoteBuffer(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && noteBuffer.trim()) {
                h.onSaveNote(change, noteBuffer.trim());
                setEditing(false);
              }
              if (e.key === "Escape") setEditing(false);
            }}
            placeholder={t("audits.detail.note_placeholder")}
            className="w-full resize-y rounded-md border border-accent bg-surface px-3 py-2.5 text-small leading-[1.55] text-text outline-none ring-[3px] ring-accent/[0.16]"
          />
          <div className="mt-2 flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
              {t("studio.cancel")}
            </Button>
            <Button size="sm" variant="secondary" disabled={!noteBuffer.trim()} onClick={() => { h.onSaveNote(change, noteBuffer.trim()); setEditing(false); }}>
              {t("audits.save_note")}
            </Button>
          </div>
        </div>
      ) : change.note ? (
        <div className="mt-3 flex gap-2 rounded-md border border-border bg-surface-2 px-3 py-2.5 text-small leading-[1.5] text-text-muted">
          <IcPencil size={14} className="mt-0.5 shrink-0 text-text-subtle" />
          <span className="min-w-0 flex-1">{change.note}</span>
          {!decided && (
            <button type="button" onClick={() => { setNoteBuffer(change.note ?? ""); setEditing(true); }} className="shrink-0 font-medium text-accent hover:underline">
              {t("audits.edit_note")}
            </button>
          )}
        </div>
      ) : null}

      {/* autopilot hours */}
      {change.hoursUtc && change.hoursUtc.length > 0 && (
        <div className="mt-[13px] rounded-md border border-border bg-surface-2 px-[14px] py-3">
          <div className="text-caption font-semibold uppercase tracking-[0.04em] text-text-subtle">{t("audits.ah_cap")}</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {change.hoursUtc.map((hh) => (
              <span key={hh} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-[5px] text-small font-semibold tabular-nums text-text">
                <IcClock size={13} className="text-accent" /> {fmtHour(utcHourToLocal(hh))}
              </span>
            ))}
          </div>
          <div className="mt-2 text-caption text-text-subtle">
            {t("audits.ah_note")} · {localUtcOffsetLabel()}
          </div>
        </div>
      )}

      {/* footer */}
      <div className="mt-3.5 flex flex-wrap items-center gap-3 border-t border-border pt-[13px] max-md:flex-col max-md:items-stretch">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3 max-md:w-full">
          {change.status === "undecided" && <span className="whitespace-nowrap text-caption text-text-subtle max-md:whitespace-normal">{t("audits.awaiting")} · {t("audits.applies_immediately")}</span>}
          {change.status === "rejected" && <span className="text-caption text-text-subtle">{t("audits.you_rejected")}</span>}
          {change.status === "applied" && <EffectChip effectPct={change.effectPct ?? null} />}
        </div>
        {change.status === "undecided" && (
          <div className="flex shrink-0 items-center gap-2 max-md:w-full max-md:flex-wrap">
            <Button size="sm" variant="ghost" icon={<IcX size={15} />} onClick={() => h.onReject(change)} className="max-md:min-h-[44px] max-md:flex-1 max-md:basis-[150px]">
              {t("audits.btn_reject")}
            </Button>
            <Button size="sm" variant="primary" icon={<IcCheck size={15} />} onClick={() => h.onApprove(change)} className="max-md:min-h-[44px] max-md:flex-1 max-md:basis-[150px]">
              {t("audits.btn_approve")}
            </Button>
          </div>
        )}
      </div>
    </article>
  );
}

function ChangeStatusBadge({ status }: { status: ChangeStatus }) {
  const { t } = useTranslation();
  const map: Record<ChangeStatus, { key: MessageKey; cls: string }> = {
    undecided: { key: "audits.cstatus_needs", cls: "border-accent/30 bg-accent/12 text-accent" },
    applied: { key: "audits.cstatus_applied", cls: "border-success/30 bg-success/12 text-success" },
    rejected: { key: "audits.cstatus_rejected", cls: "border-danger/30 bg-danger/12 text-danger" },
  };
  const m = map[status];
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-caption font-medium", m.cls)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {t(m.key)}
    </span>
  );
}

function EffectChip({ effectPct }: { effectPct: number | null }) {
  const { t } = useTranslation();
  if (effectPct === null)
    return (
      <span className="inline-flex items-center gap-1 text-small font-medium text-text-subtle">
        <IcClock size={13} /> {t("audits.measuring")}
      </span>
    );
  const up = effectPct >= 0;
  return (
    <span className={cn("inline-flex items-center gap-1 text-small font-semibold tabular-nums", up ? "text-success" : "text-danger")}>
      {up ? <IcArrowUp size={13} /> : <IcArrowDown size={13} />}
      {up ? "+" : ""}
      {effectPct}% {t("audits.effect_engagement")}
    </span>
  );
}
