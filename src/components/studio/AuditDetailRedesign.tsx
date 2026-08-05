"use client";

// «Аудит роста» — redesigned audit DETAIL screen. Built 1:1 to
// Audit-Redesign-SPEC (bodyDetail): a verdict header, the self-learning loop
// strip, the «Разбор недели» (wins/losses/caveat), and the proposals grouped by
// the 7 dimensions, each rendered as a `diff` / `hours` / `action` card with an
// evidence line (numbers first-class), expected impact, confidence, and
// approve/reject (or an effect chip once applied). Pure presentational — driven
// by props so the live screen and the ?demo=1 review render identical pixels.

import { useState, type ReactNode } from "react";

import { cn } from "@/lib/cn";
import { useTranslation, getLocale, pluralKey, pluralUnit, type MessageKey } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import {
  IcArrowDown, IcArrowLeft, IcArrowRight, IcArrowUp, IcChart, IcCheck, IcChevDown,
  IcClock, IcFormat, IcInfo, IcPenLine, IcPlus, IcPower, IcPowerOff, IcRepeat,
  IcReplies, IcSliders, IcSparkle, IcTag, IcTrend, IcUsers, IcVoice, IcX,
  type IconProps,
} from "@/components/icons";
import {
  AUDIT_DIMS, type AuditDetailModel, type AuditDim, type AuditProposal,
  type ProposalConf, type ProposalStatus, type WinLoss,
} from "@/components/studio/audits-redesign";

export type AuditDetailHandlers = { onApprove: (id: string) => void; onReject: (id: string) => void };

type IconCmp = (p: IconProps) => ReactNode;
const ICONS: Record<string, IconCmp> = {
  tag: IcTag, repeat: IcRepeat, clock: IcClock, voice: IcVoice, penline: IcPenLine,
  replies: IcReplies, format: IcFormat, arrowUp: IcArrowUp, arrowDown: IcArrowDown,
  arrowLeft: IcArrowLeft, arrowRight: IcArrowRight, power: IcPower, powerOff: IcPowerOff,
  sliders: IcSliders, plus: IcPlus, users: IcUsers, trend: IcTrend, chart: IcChart,
  spark: IcSparkle, check: IcCheck, x: IcX, chevD: IcChevDown, info: IcInfo,
};
// `flat` is a plain dash (no Pennedly icon for it).
function Ico({ name, size = 16, className }: { name: string; size?: number; className?: string }) {
  if (name === "flat") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden className={className}>
        <path d="M5 12h14" />
      </svg>
    );
  }
  const C = ICONS[name] ?? IcSparkle;
  return <C size={size} className={className} />;
}

const CONF_HEIGHTS = [5, 8, 11];
function ConfBars({ level, mini }: { level: ProposalConf; mini?: boolean }) {
  const lit = level === "high" ? 3 : level === "med" ? 2 : 1;
  const tone = level === "high" ? "var(--color-success)" : level === "med" ? "var(--color-warning)" : "var(--color-danger)";
  const heights = mini ? [4, 7, 10] : CONF_HEIGHTS;
  return (
    <span className="inline-flex items-end gap-[2px]" style={{ height: mini ? 10 : 12 }}>
      {heights.map((h, i) => (
        <i key={i} className="block rounded-[1px]" style={{ width: mini ? 2.5 : 3, height: h, background: i < lit ? tone : "var(--color-ink-300)" }} />
      ))}
    </span>
  );
}

function SignalChip({ signal, label, t }: { signal: "up" | "flat" | "down"; label: string; t: (k: MessageKey) => string }) {
  const tone =
    signal === "up"
      ? "border-success/30 bg-success/[0.09] text-success"
      : signal === "down"
        ? "border-danger/30 bg-danger/[0.09] text-danger"
        : "border-border bg-surface-2 text-text-muted";
  const ic = signal === "up" ? "trend" : signal === "down" ? "arrowDown" : "flat";
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border py-[5px] pl-[9px] pr-[11px] text-small font-semibold", tone)}>
      <Ico name={ic} size={14} className="shrink-0" />
      {t("audit.detail.dynamics")}: {label}
    </span>
  );
}

function ConfChip({ level, t }: { level: ProposalConf; t: (k: MessageKey) => string }) {
  return (
    <span className="inline-flex items-center gap-[7px] whitespace-nowrap rounded-full border border-border bg-surface px-[11px] py-[5px] text-small font-medium text-text-muted">
      <ConfBars level={level} />
      {t("audit.detail.confidence")}: {t(`audit.conf.${level}` as MessageKey)}
    </span>
  );
}

function VerdictHeader({ m, initials, name, handle, reviewCount, onBack, t }: {
  m: AuditDetailModel; initials: string; name: string; handle: string; reviewCount: number; onBack: () => void; t: (k: MessageKey) => string;
}) {
  const v = m.verdict;
  const done = reviewCount === 0;
  return (
    <>
      <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 self-start rounded-md py-1 text-small font-medium text-text-muted transition-colors hover:text-text">
        <IcArrowLeft size={16} /> {t("audit.detail.back")}
      </button>
      <section className="relative overflow-hidden rounded-xl border border-border bg-surface px-6 py-[22px] shadow-sm">
        <div className="flex items-center gap-[13px]">
          <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full border border-border bg-surface-2 text-small font-semibold text-text-muted">{initials}</span>
          <div className="min-w-0">
            <div className="text-small font-semibold leading-[1.2]">{name} <span className="text-caption text-text-subtle">{handle}</span></div>
            <div className="mt-0.5 inline-flex items-center gap-1.5 text-caption tabular-nums text-text-subtle">
              <IcClock size={12} /> {v.period}<span className="mx-0.5 inline-block h-[3px] w-[3px] rounded-full bg-ink-400" />{t("audit.detail.in_analysis").replace("{n}", String(v.posts)).replace("{u}", pluralUnit(getLocale(), "posts", v.posts))}
            </div>
          </div>
          <span className="flex-1" />
          {done ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-2.5 py-1 text-caption font-semibold text-text-muted">{t("audit.detail.reviewed")}</span>
          ) : (
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-accent/30 bg-accent/[0.12] px-2.5 py-1 text-caption font-semibold text-accent">
              <span className="inline-block h-[6px] w-[6px] rounded-full bg-accent" />{reviewCount} {t("audit.detail.to_review")}
            </span>
          )}
        </div>
        <h1 className="mt-[18px] max-w-[40ch] text-h2 font-semibold leading-[1.28] tracking-[-0.014em] [text-wrap:pretty]">{v.verdict}</h1>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <SignalChip signal={v.signal} label={v.signalLabel} t={t} />
          <ConfChip level={v.conf} t={t} />
        </div>
      </section>
    </>
  );
}

function LoopStrip({ loop, t }: { loop: NonNullable<AuditDetailModel["loop"]>; t: (k: MessageKey) => string }) {
  const body = t("audit.loop.text").replace("{window}", loop.window).replace("{up}", loop.up).replace("{metric}", loop.metric);
  const rolled = t(
    pluralKey(getLocale(), loop.rolled, { one: "audit.loop.rolled_one", few: "audit.loop.rolled_few", many: "audit.loop.rolled_many" }),
  ).replace("{n}", String(loop.rolled));
  return (
    <div className="flex items-center gap-3 rounded-lg border border-accent/25 bg-accent/[0.06] px-4 py-[13px] max-md:flex-wrap">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-accent/25 bg-accent/[0.13] text-accent"><IcRepeat size={16} /></span>
      <div className="min-w-0 flex-1 text-small leading-[1.5] text-text-muted [&_b]:font-bold [&_b]:tabular-nums [&_b]:text-text">
        <span dangerouslySetInnerHTML={{ __html: body }} /><span className="mx-1.5 text-ink-400">·</span><span dangerouslySetInnerHTML={{ __html: rolled }} />
      </div>
      <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-caption font-semibold text-accent">{t("audit.loop.link")} <IcArrowRight size={13} /></span>
    </div>
  );
}

function WrRow({ r, kind }: { r: WinLoss; kind: "win" | "loss" }) {
  return (
    <div className="relative flex flex-col gap-[5px] rounded-md border border-border bg-surface-2 py-[11px] pl-[15px] pr-[13px]">
      <span className={cn("absolute inset-y-[11px] left-0 w-[3px] rounded-[3px]", kind === "win" ? "bg-success" : "bg-danger")} />
      <div className="text-small leading-[1.45] text-text [text-wrap:pretty]">{r.text}</div>
      <div className="flex flex-wrap items-baseline gap-2">
        <span className="text-body font-bold tabular-nums tracking-[-0.01em] text-text">{r.num}</span>
        <span className="text-caption text-text-subtle">{r.unit}</span>
        <span className={cn("whitespace-nowrap rounded-full border px-[7px] py-px text-caption font-semibold tabular-nums", kind === "win" ? "border-success/30 bg-success/[0.12] text-success" : "border-danger/30 bg-danger/[0.12] text-danger")}>{r.mult}</span>
      </div>
    </div>
  );
}

function WeekReview({ m, t }: { m: AuditDetailModel; t: (k: MessageKey) => string }) {
  return (
    <section className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
      <div className="flex items-center gap-3 px-[18px] pb-[14px] pt-4">
        <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-md border border-border bg-surface-2 text-text-muted"><IcChart size={17} /></span>
        <div className="min-w-0 flex-1">
          <div className="text-h3 font-semibold leading-[1.2]">{t("audit.review.title")}</div>
          <div className="mt-0.5 text-caption text-text-subtle">{t("audit.review.sub")}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 max-md:grid-cols-1">
        <div className="border-t border-border px-[18px] pb-4 pt-1">
          <div className="my-[11px] mt-3.5 inline-flex items-center gap-[7px] text-caption font-semibold uppercase tracking-[0.04em] text-success"><IcArrowUp size={13} />{t("audit.review.wins")}</div>
          <div className="flex flex-col gap-2">{m.wins.map((r, i) => <WrRow key={i} r={r} kind="win" />)}</div>
        </div>
        <div className="border-t border-border px-[18px] pb-4 pt-1 max-md:border-t-0 md:border-l">
          <div className="my-[11px] mt-3.5 inline-flex items-center gap-[7px] text-caption font-semibold uppercase tracking-[0.04em] text-danger"><IcArrowDown size={13} />{t("audit.review.losses")}</div>
          <div className="flex flex-col gap-2">{m.losses.map((r, i) => <WrRow key={i} r={r} kind="loss" />)}</div>
        </div>
        {m.caveat && (
          <div className="col-span-full flex items-start gap-[9px] border-t border-border bg-warning/[0.06] px-[18px] py-3 text-small leading-[1.5] text-text-muted [&_b]:text-text">
            <IcInfo size={15} className="mt-px shrink-0 text-warning" />
            <span dangerouslySetInnerHTML={{ __html: m.caveat }} />
          </div>
        )}
      </div>
    </section>
  );
}

function ShapeBody({ p, t }: { p: AuditProposal; t: (k: MessageKey) => string }) {
  if (p.shape === "diff" && p.diff) {
    return (
      <div className="mt-3 flex flex-col gap-2">
        <div className="rounded-md border border-danger/20 bg-danger/[0.07] px-3 py-2.5">
          <div className="mb-[5px] inline-flex items-center gap-1.5 text-caption font-semibold uppercase tracking-[0.03em] text-danger"><span className="font-mono font-bold">−</span>{t("audit.card.diff_before")}</div>
          <div className="text-small leading-[1.5] text-text-muted [text-wrap:pretty]">{p.diff.before}</div>
        </div>
        <div className="rounded-md border border-success/25 bg-success/[0.08] px-3 py-2.5">
          <div className="mb-[5px] inline-flex items-center gap-1.5 text-caption font-semibold uppercase tracking-[0.03em] text-success"><span className="font-mono font-bold">+</span>{t("audit.card.diff_after")}</div>
          <div className="text-small leading-[1.5] text-text [text-wrap:pretty]">{p.diff.after}</div>
        </div>
      </div>
    );
  }
  if (p.shape === "hours" && p.hours) {
    return (
      <div className="mt-3 rounded-md border border-border bg-surface-2 px-[13px] py-[11px]">
        <div className="text-caption font-semibold uppercase tracking-[0.03em] text-text-subtle">{t("audit.card.hours_cap")}</div>
        <div className="mt-[9px] flex flex-wrap gap-2">
          {p.hours.map((h, i) => (
            <span key={i} className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-[5px] text-small font-semibold tabular-nums", h.peak ? "border-accent/30 bg-accent/[0.08] text-accent" : "border-border bg-surface text-text")}>
              <IcClock size={13} className="shrink-0 text-accent" />{h.t}{h.peak ? ` · ${t("audit.card.peak")}` : ""}
            </span>
          ))}
        </div>
        {p.hoursNote && <div className="mt-2.5 text-caption text-text-subtle">{p.hoursNote}</div>}
      </div>
    );
  }
  if (p.action) {
    return (
      <div className="mt-3 flex items-center gap-[11px] rounded-md border border-accent/25 bg-accent/[0.06] px-[13px] py-[11px]">
        <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-sm border border-accent/25 bg-accent/[0.13] text-accent"><Ico name={p.action.ico} size={16} /></span>
        <div className="min-w-0 flex-1">
          <div className="text-caption font-semibold uppercase tracking-[0.03em] text-accent">{p.action.kind}</div>
          <div className="mt-0.5 text-small font-semibold leading-[1.35] text-text [&_b]:tabular-nums" dangerouslySetInnerHTML={{ __html: p.action.label }} />
        </div>
      </div>
    );
  }
  return null;
}

function EffectChip({ p, t }: { p: AuditProposal; t: (k: MessageKey) => string }) {
  if (!p.effect) return <span className="inline-flex items-center gap-1 whitespace-nowrap text-small font-medium text-text-subtle"><IcClock size={13} />{t("audit.card.measuring")}</span>;
  const down = String(p.effect).trim().startsWith("-");
  return <span className={cn("inline-flex items-center gap-1 whitespace-nowrap text-small font-bold tabular-nums", down ? "text-danger" : "text-success")}>{down ? <IcArrowDown size={13} /> : <IcArrowUp size={13} />}{p.effect} {p.effectLabel ?? ""}</span>;
}

function ProposalCard({ p, h, t }: { p: AuditProposal; h: AuditDetailHandlers; t: (k: MessageKey) => string }) {
  return (
    <article className={cn(
      "relative rounded-md border border-border bg-surface px-4 pb-[13px] pt-[15px]",
      p.high && "border-accent/30 shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-accent)_12%,transparent)]",
      p.status === "applied" && "bg-success/[0.04]",
      p.status === "rejected" && "opacity-[0.62]",
    )}>
      <div className="flex items-start gap-2.5">
        {p.high && p.status === "undecided" && <span className="mt-px inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-caption font-semibold text-accent"><IcSparkle size={13} />{t("audit.card.high_flag")}</span>}
        <div className="min-w-0 flex-1 text-body font-semibold leading-[1.35] tracking-[-0.004em] text-text">{p.title}</div>
        {p.status === "applied" && <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-success/30 bg-success/[0.12] px-2.5 py-1 text-caption font-semibold text-success"><span className="inline-block h-[6px] w-[6px] rounded-full bg-success" />{t("audit.card.applied")}</span>}
        {p.status === "rejected" && <span className="inline-flex shrink-0 items-center rounded-full border border-border bg-surface-2 px-2.5 py-1 text-caption font-semibold text-text-muted">{t("audit.card.rejected")}</span>}
      </div>
      <div className="mt-[11px] flex items-start gap-[9px] rounded-md border border-border bg-surface-2 px-3 py-2.5 text-small leading-[1.5] text-text-muted [text-wrap:pretty] [&_b]:font-bold [&_b]:tabular-nums [&_b]:text-text">
        <IcChart size={14} className="mt-0.5 shrink-0 text-text-subtle" />
        <span dangerouslySetInnerHTML={{ __html: p.evidence }} />
      </div>
      <ShapeBody p={p} t={t} />
      <div className="mt-[13px] flex flex-wrap items-center gap-3 border-t border-border pt-3">
        {p.status === "undecided" ? (
          <>
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-caption text-text-muted [&_b]:font-semibold [&_b]:text-success">
                <Ico name={p.expect.dir === "up" ? "trend" : "flat"} size={13} className="shrink-0" />{t("audit.card.expect")} <b>↑ {p.expect.label}</b>
              </span>
              <span className="inline-block h-[3px] w-[3px] rounded-full bg-ink-400" />
              <span className="inline-flex items-center gap-[5px] whitespace-nowrap text-caption text-text-subtle"><ConfBars level={p.conf} mini />{t("audit.card.conf_mini")} {t(`audit.conf.${p.conf}` as MessageKey)}</span>
            </div>
            <div className="flex shrink-0 items-center gap-[7px] max-md:w-full">
              <Button size="sm" variant="ghost" icon={<IcX size={15} />} onClick={() => h.onReject(p.id)} className="max-md:min-h-[44px] max-md:flex-1">{t("audit.card.reject")}</Button>
              <Button size="sm" variant="primary" icon={<IcCheck size={15} />} onClick={() => h.onApprove(p.id)} className="max-md:min-h-[44px] max-md:flex-1">{t("audit.card.approve")}</Button>
            </div>
          </>
        ) : p.status === "applied" ? (
          <div className="flex min-w-0 flex-1 items-center"><EffectChip p={p} t={t} /></div>
        ) : (
          <div className="flex min-w-0 flex-1 items-center"><span className="whitespace-nowrap text-caption text-text-subtle">{t("audit.card.rejected_note")}</span></div>
        )}
      </div>
    </article>
  );
}

function DimGroup({ dim, props, top, h, t }: { dim: { key: AuditDim; ico: string; subKey: string }; props: AuditProposal[]; top: boolean; h: AuditDetailHandlers; t: (k: MessageKey) => string }) {
  const [open, setOpen] = useState(true);
  const applied = props.filter((p) => p.status === "applied").length;
  const rejected = props.filter((p) => p.status === "rejected").length;
  const decided = applied + rejected;
  return (
    <section className={cn("overflow-hidden rounded-lg border bg-surface shadow-sm", top ? "border-accent/30" : "border-border")}>
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-[13px] px-4 py-3.5 text-left text-text transition-colors hover:bg-surface-2">
        <span className={cn("grid h-[34px] w-[34px] shrink-0 place-items-center rounded-md border", top ? "border-accent/30 bg-accent/[0.12] text-accent" : "border-border bg-surface-2 text-text-muted")}><Ico name={dim.ico} size={17} /></span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-[9px] text-h3 font-semibold leading-[1.2]">
            {t(`audit.dim.${dim.key}` as MessageKey)}
            <span className="inline-flex h-[18px] min-w-[20px] items-center justify-center rounded-full border border-border bg-surface-2 px-1.5 text-caption font-semibold tabular-nums text-text-subtle">{props.length}</span>
            {top && <span className="inline-flex items-center gap-[5px] whitespace-nowrap rounded-full border border-accent/30 bg-accent/[0.11] py-0.5 pl-[7px] pr-[9px] text-caption font-semibold text-accent"><IcSparkle size={12} />{t("audit.card.high_flag")}</span>}
            {decided > 0 && <span className="inline-flex items-center gap-[7px] text-caption text-text-subtle"><IcCheck size={13} />{t("audit.group.approved").replace("{n}", String(applied))}{rejected > 0 ? ` · ${t("audit.group.rejected").replace("{n}", String(rejected))}` : ""}</span>}
          </div>
          <div className="mt-0.5 text-caption text-text-subtle [text-wrap:pretty]">{t(dim.subKey as MessageKey)}</div>
        </div>
        <IcChevDown size={18} className={cn("shrink-0 text-text-subtle transition-transform", !open && "-rotate-90")} />
      </button>
      {open && <div className="flex flex-col gap-2.5 px-4 pb-4 pt-0.5">{props.map((p) => <ProposalCard key={p.id} p={p} h={h} t={t} />)}</div>}
    </section>
  );
}

export function AuditDetailRedesign({ model, initials, name, handle, onBack, h }: {
  model: AuditDetailModel; initials: string; name: string; handle: string; onBack: () => void; h: AuditDetailHandlers;
}) {
  const { t, locale } = useTranslation();
  const total = model.proposals.length;
  const applied = model.proposals.filter((p) => p.status === "applied").length;
  const rejected = model.proposals.filter((p) => p.status === "rejected").length;
  const undecided = total - applied - rejected;
  const count = t("audit.prop.count")
    .replace("{total}", String(total))
    .replace("{applied}", String(applied))
    .replace("{u}", pluralUnit(locale, "proposals", total)) + (rejected > 0 ? t("audit.prop.count_rej").replace("{rejected}", String(rejected)) : "");
  const groups = AUDIT_DIMS.map((dim, idx) => ({ dim, top: idx === 0, props: model.proposals.filter((p) => p.dim === dim.key) })).filter((g) => g.props.length > 0);
  return (
    <div className="flex flex-col gap-4 md:gap-5">
      <VerdictHeader m={model} initials={initials} name={name} handle={handle} reviewCount={undecided} onBack={onBack} t={t} />
      {model.loop && <LoopStrip loop={model.loop} t={t} />}
      <WeekReview m={model} t={t} />
      {/* proposals overview + grouped */}
      <div className="mt-1 flex flex-wrap items-center gap-3">
        <span className="text-caption font-semibold uppercase tracking-[0.06em] text-text-subtle">{t("audit.prop.cap")}</span>
        <span className="text-small tabular-nums text-text-muted [&_b]:font-semibold [&_b]:text-text" dangerouslySetInnerHTML={{ __html: count }} />
        <span className="flex-1" />
        <span className="inline-flex items-center gap-[3px]">
          {Array.from({ length: applied }).map((_, i) => <i key={`a${i}`} className="block h-[5px] w-[14px] rounded-[3px] bg-success" />)}
          {Array.from({ length: rejected }).map((_, i) => <i key={`r${i}`} className="block h-[5px] w-[14px] rounded-[3px] bg-ink-400" />)}
          {Array.from({ length: undecided }).map((_, i) => <i key={`u${i}`} className="block h-[5px] w-[14px] rounded-[3px] bg-accent" />)}
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {groups.map((g) => <DimGroup key={g.dim.key} dim={g.dim} props={g.props} top={g.top} h={h} t={t} />)}
      </div>
    </div>
  );
}
