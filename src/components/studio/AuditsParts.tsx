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
import { BrandMark, IcArrowDown, IcArrowLeft, IcArrowUp, IcAudit, IcCheck, IcChevDown, IcClock, IcPencil, IcX } from "@/components/icons";
import type { ChangeStatus, DemoChange } from "@/components/studio/audits-demo";

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
        {audit.summary && <span className="mt-[5px] block text-small leading-[1.5] text-text-muted">{audit.summary}</span>}
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
      </span>
      <span className="flex shrink-0 items-center gap-3.5">
        {needs ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/12 px-2.5 py-1 text-caption font-medium text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {t("audits.cstatus_needs")}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-text/[0.06] px-2.5 py-1 text-caption font-medium text-text-muted">{t("audits.reviewed")}</span>
        )}
        <IcChevDown size={18} className="-rotate-90 text-text-subtle max-[560px]:hidden" />
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
      <section className="rounded-xl border border-border bg-surface-2 px-[22px] py-5">
        <div className="mb-3.5 flex items-center gap-[11px]">
          <BrandMark size={34} radius={9} className="shadow-sm" />
          <span>
            <span className="block text-small font-semibold">{t("audits.coach_name")}</span>
            <span className="block whitespace-nowrap text-caption text-text-subtle">
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
          <div className="flex gap-2 whitespace-pre-wrap break-words bg-danger/[0.09] px-3 py-[7px] text-danger">
            <span className="opacity-70">−</span>
            <span>{change.diff.before}</span>
          </div>
          <div className="flex gap-2 whitespace-pre-wrap break-words bg-success/10 px-3 py-[7px] text-success">
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
      <div className="mt-3.5 flex flex-wrap items-center gap-3 border-t border-border pt-[13px]">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
          {change.status === "undecided" && <span className="whitespace-nowrap text-caption text-text-subtle">{t("audits.awaiting")} · {t("audits.applies_immediately")}</span>}
          {change.status === "rejected" && <span className="text-caption text-text-subtle">{t("audits.you_rejected")}</span>}
          {change.status === "applied" && <EffectChip effectPct={change.effectPct ?? null} />}
        </div>
        {change.status === "undecided" && (
          <div className="flex shrink-0 items-center gap-2">
            <Button size="sm" variant="ghost" icon={<IcX size={15} />} onClick={() => h.onReject(change)}>
              {t("audits.btn_reject")}
            </Button>
            <Button size="sm" variant="primary" icon={<IcCheck size={15} />} onClick={() => h.onApprove(change)}>
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
