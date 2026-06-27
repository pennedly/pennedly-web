"use client";

// «Правила дома» — the global house-rules header of the unified «Автопилот» hub
// (Autopilot-Unified-SPEC §3/§4). It sits ON TOP of the routine list and is the
// single real on/off for the account: a large master switch + state line, a
// collapsed one-line summary of the global rules, and an expandable Settings
// panel (posts-per-day cap · reply frequency · quiet hours · reply ceiling · a
// link to Voice). All rules here apply to EVERY routine at once.
//
// FE-only on demo values for now — the real backend wiring (autopilot policy)
// comes in a later pass. Source layer: autopilot.css (.hr / .ap-master /
// .hr-toggle / .hr-body / .hr-group / .hr-stepper / policy-row / .hr-voice).

import Link from "next/link";

import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/cn";
import { useTranslation } from "@/lib/i18n";
import { IcChevRight, IcClock, IcReplies, IcSliders, IcVoice } from "@/components/icons";

// The voice route is the role-book (labeled «Голос» in the sidebar nav).
const VOICE_HREF = "/app/role-book";

export type ReplyFreq = "instant" | "hourly" | "few" | "daily";

// ── reply-frequency map: HouseRules' 4-way ReplyFreq ↔ the backend's
// `reply_frequency` enum ({asap, half_hourly, hourly, few_daily, daily}). The FE
// has no «half-hourly» option, so a stored `half_hourly` reads back as the
// nearest FE value («hourly»); everything else is 1:1. ──
export type BackendReplyFreq = "asap" | "half_hourly" | "hourly" | "few_daily" | "daily";

export function freqToBackend(f: ReplyFreq): BackendReplyFreq {
  switch (f) {
    case "instant":
      return "asap";
    case "few":
      return "few_daily";
    case "daily":
      return "daily";
    case "hourly":
    default:
      return "hourly";
  }
}

export function freqFromBackend(v: string | null | undefined): ReplyFreq {
  switch (v) {
    case "asap":
      return "instant";
    case "few_daily":
      return "few";
    case "daily":
      return "daily";
    case "half_hourly": // no FE «half-hourly» → nearest option
    case "hourly":
    default:
      return "hourly";
  }
}

// Quiet hours: the backend stores whole UTC hours (0–23, both null = off); the
// HouseRules selects work in "HH:00" strings. With no per-account tz on the
// accounts API yet, we round-trip the stored hours AS UTC ("UTC" tz label) so
// the value the user sees is exactly the value stored — no misleading offset.
export const QUIET_TZ_LABEL = "UTC";

export function hourToHHMM(h: number | null | undefined): string | null {
  if (typeof h !== "number" || !Number.isInteger(h) || h < 0 || h > 23) return null;
  return `${String(h).padStart(2, "0")}:00`;
}

export function hhmmToHour(v: string): number | null {
  const h = Number(v.split(":")[0]);
  return Number.isInteger(h) && h >= 0 && h <= 23 ? h : null;
}

export type HouseRulesValues = {
  /** master on/off — the single real gate (default ON for existing accounts) */
  masterOn: boolean;
  /** max posts per day across every posting routine (1–10, default 1) */
  cap: number;
  /** how often replies are gathered into a rhythm */
  freq: ReplyFreq;
  /** quiet hours on/off (default on) */
  quietOn: boolean;
  /** quiet window start hour, e.g. "23:00" */
  quietFrom: string;
  /** quiet window end hour, e.g. "08:00" */
  quietTo: string;
  /** daily reply ceiling (10 / 25 / 50, default 25) */
  ceiling: number;
  /** the account timezone label for the quiet-hours hint, e.g. "UTC+1" */
  tz: string;
};

const FREQ_ORDER: ReplyFreq[] = ["instant", "hourly", "few", "daily"];
const FREQ_LABEL_KEY: Record<ReplyFreq, "ap.freq.instant" | "ap.freq.hourly" | "ap.freq.few" | "ap.freq.daily"> = {
  instant: "ap.freq.instant",
  hourly: "ap.freq.hourly",
  few: "ap.freq.few",
  daily: "ap.freq.daily",
};
const FREQ_SUMMARY_KEY: Record<ReplyFreq, "ap.summary.freq_instant" | "ap.summary.freq_hourly" | "ap.summary.freq_few" | "ap.summary.freq_daily"> = {
  instant: "ap.summary.freq_instant",
  hourly: "ap.summary.freq_hourly",
  few: "ap.summary.freq_few",
  daily: "ap.summary.freq_daily",
};

const FROM_HOURS = ["22:00", "23:00", "00:00"];
const TO_HOURS = ["06:00", "07:00", "08:00"];
const CEILINGS = [10, 25, 50];

// The design select offers a fixed set, but the real stored value can be
// anything in the backend's range (e.g. a power account at 200/day, or a quiet
// hour outside the three presets). Surface the current value as an extra option
// so the control NEVER renders blank / silently snaps the real value to a preset.
function withCurrent<T extends string | number>(options: readonly T[], current: T): T[] {
  return options.includes(current) ? [...options] : [current, ...options];
}

// Shared select recipe (mirrors ScenariosParts' field style, ~36px tall).
const SELECT =
  "h-9 min-w-[168px] rounded-md border border-border bg-surface px-2.5 text-small text-text transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25 max-md:min-h-[44px] max-md:w-full max-md:text-[16px]";
const SELECT_SM =
  "h-9 rounded-md border border-border bg-surface px-2.5 text-small tabular-nums text-text transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25 max-md:min-h-[44px] max-md:text-[16px]";

export type HouseRulesProps = HouseRulesValues & {
  /** Settings panel open/closed */
  open: boolean;
  onToggle: () => void;
  /** master switch handler */
  onMaster: (on: boolean) => void;
  /** value change handlers */
  onCap: (n: number) => void;
  onFreq: (f: ReplyFreq) => void;
  onQuiet: (on: boolean) => void;
  onQuietFrom: (v: string) => void;
  onQuietTo: (v: string) => void;
  onCeiling: (n: number) => void;
};

export function HouseRules({
  masterOn,
  cap,
  freq,
  quietOn,
  quietFrom,
  quietTo,
  ceiling,
  tz,
  open,
  onToggle,
  onMaster,
  onCap,
  onFreq,
  onQuiet,
  onQuietFrom,
  onQuietTo,
  onCeiling,
}: HouseRulesProps) {
  const { t } = useTranslation();

  // ── collapsed summary: built from the live values ──
  const postsLabel = (cap === 1 ? t("ap.summary.posts_one") : t("ap.summary.posts_many")).replace("{n}", String(cap));
  const freqLabel = t(FREQ_SUMMARY_KEY[freq]);
  const quietLabel = quietOn ? `${quietFrom}–${quietTo}` : "—";
  // split «… <b>{posts}</b> … <b>{freq}</b> … <b>{quiet}</b>» so we can bold the values.
  const summaryParts = t("ap.summary").split(/(\{posts\}|\{freq\}|\{quiet\})/);

  // voice line: split «… <a>Голосе</a> …» around the link markers.
  const voiceRaw = t("ap.voice.text");
  const voiceBefore = voiceRaw.slice(0, voiceRaw.indexOf("<a>"));
  const voiceLink = voiceRaw.slice(voiceRaw.indexOf("<a>") + 3, voiceRaw.indexOf("</a>"));
  const voiceAfter = voiceRaw.slice(voiceRaw.indexOf("</a>") + 4);

  return (
    <div className="overflow-hidden rounded-[20px] border border-border bg-surface shadow-sm">
      {/* ── master row (.ap-master) — the single real switch ── */}
      <div className="flex items-center gap-[18px] px-[22px] py-5">
        <span
          className={cn(
            "grid h-[46px] w-[46px] shrink-0 place-items-center rounded-[14px] border transition-colors",
            masterOn
              ? "border-success/28 bg-success/[0.14] text-success"
              : "border-border bg-surface-2 text-text-muted",
          )}
        >
          <IcSliders size={24} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-h2 font-semibold tracking-[-0.01em]">{t("ap.master.title")}</div>
          <div
            className={cn(
              "mt-1 inline-flex items-center gap-[7px] text-small",
              masterOn ? "font-medium text-success" : "text-text-muted",
            )}
          >
            <span className={cn("h-[7px] w-[7px] rounded-full", masterOn ? "bg-success" : "bg-text-subtle")} />
            {masterOn ? t("ap.master.on") : t("ap.master.off")}
          </div>
        </div>
        {/* large master switch (≈56×30) */}
        <Switch checked={masterOn} onCheckedChange={onMaster} size="lg" aria-label={t("ap.master.title")} />
      </div>

      {/* The settings (summary + body) dim when the master is off — the master
          row above stays fully interactive (§4: master-off is «honestly dead»). */}
      <div className={cn("transition-opacity", !masterOn && "pointer-events-none opacity-50")}>
      {/* ── summary / settings toggle row (.hr-toggle) ── */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-[14px] border-t border-border bg-surface-2 px-[22px] py-[13px] text-left transition-colors hover:bg-[color-mix(in_srgb,var(--color-text)_4%,var(--color-surface-2))]"
      >
        <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-sm border border-border bg-surface text-text-muted">
          <IcSliders size={16} />
        </span>
        <span className="min-w-0 flex-1 text-small leading-snug text-text-muted">
          {summaryParts.map((part, i) => {
            if (part === "{posts}") return <b key={i} className="font-semibold text-text">{postsLabel}</b>;
            if (part === "{freq}") return <b key={i} className="font-semibold text-text">{freqLabel}</b>;
            if (part === "{quiet}") return <b key={i} className="font-semibold text-text">{quietLabel}</b>;
            return <span key={i}>{part}</span>;
          })}
        </span>
        <span className="inline-flex shrink-0 items-center gap-[7px] text-small font-semibold text-text">
          {t("ap.settings")}
          <IcChevRight size={16} className={cn("text-text-subtle transition-transform", open && "rotate-90")} />
        </span>
      </button>

      {/* ── expanded settings body (.hr-body) ── */}
      {open && (
        <div className="flex flex-col gap-1 border-t border-border px-[22px] pb-5 pt-1.5">
          {/* POSTING group */}
          <div className="border-t border-border py-4 first:border-t-0">
            <div className="mb-1 flex items-center gap-2 text-caption font-semibold uppercase tracking-[0.05em] text-text-subtle">
              <IcClock size={13} /> {t("ap.group.posting")}
            </div>
            <div className="flex items-center justify-between gap-4 py-3.5">
              <div className="min-w-0">
                <div className="text-small font-semibold">{t("ap.cap.title")}</div>
                <div className="mt-0.5 text-caption leading-relaxed text-text-subtle">{t("ap.cap.desc")}</div>
              </div>
              {/* whole-number stepper (.hr-stepper) */}
              <div className="inline-flex shrink-0 items-center overflow-hidden rounded-md border border-border bg-surface">
                <button
                  type="button"
                  aria-label={t("ap.cap.dec")}
                  onClick={() => onCap(Math.max(1, cap - 1))}
                  disabled={cap <= 1}
                  className="grid h-9 w-9 place-items-center text-lg text-text-muted transition-colors hover:bg-surface-2 hover:text-text disabled:opacity-40"
                >
                  −
                </button>
                <span className="grid h-9 min-w-[46px] place-items-center border-x border-border text-body font-semibold tabular-nums text-text">
                  {cap}
                </span>
                <button
                  type="button"
                  aria-label={t("ap.cap.inc")}
                  onClick={() => onCap(Math.min(10, cap + 1))}
                  disabled={cap >= 10}
                  className="grid h-9 w-9 place-items-center text-lg text-text-muted transition-colors hover:bg-surface-2 hover:text-text disabled:opacity-40"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* REPLIES group */}
          <div className="border-t border-border py-4">
            <div className="mb-1 flex items-center gap-2 text-caption font-semibold uppercase tracking-[0.05em] text-text-subtle">
              <IcReplies size={13} /> {t("ap.group.replies")}
            </div>
            <div className="flex flex-col">
              {/* (a) how often */}
              <PolicyRow title={t("ap.freq.title")} desc={t("ap.freq.desc")}>
                <select
                  className={SELECT}
                  value={freq}
                  onChange={(e) => onFreq(e.target.value as ReplyFreq)}
                  aria-label={t("ap.freq.title")}
                >
                  {FREQ_ORDER.map((f) => (
                    <option key={f} value={f}>
                      {t(FREQ_LABEL_KEY[f])}
                    </option>
                  ))}
                </select>
              </PolicyRow>

              {/* (b) quiet hours — switch + From/to + UTC hint */}
              <div className="flex flex-col gap-2.5 border-t border-border py-3.5">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-small font-semibold">{t("ap.quiet.title")}</div>
                    <div className="mt-0.5 text-caption leading-relaxed text-text-subtle">{t("ap.quiet.desc")}</div>
                  </div>
                  <Switch checked={quietOn} onCheckedChange={onQuiet} aria-label={t("ap.quiet.title")} className="shrink-0" />
                </div>
                <div className={cn("flex flex-wrap items-center gap-2 text-small text-text-muted", !quietOn && "opacity-50")}>
                  <span>{t("ap.quiet.from")}</span>
                  <select
                    className={SELECT_SM}
                    value={quietFrom}
                    onChange={(e) => onQuietFrom(e.target.value)}
                    disabled={!quietOn}
                    aria-label={t("ap.quiet.from")}
                  >
                    {withCurrent(FROM_HOURS, quietFrom).map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                  <span>{t("ap.quiet.to")}</span>
                  <select
                    className={SELECT_SM}
                    value={quietTo}
                    onChange={(e) => onQuietTo(e.target.value)}
                    disabled={!quietOn}
                    aria-label={t("ap.quiet.to")}
                  >
                    {withCurrent(TO_HOURS, quietTo).map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                  <span className="text-caption tabular-nums text-text-subtle">
                    {t("ap.quiet.utc").replace("{tz}", tz).replace("{range}", quietWindowUtc(quietFrom, quietTo, tz))}
                  </span>
                </div>
              </div>

              {/* (c) reply ceiling */}
              <PolicyRow title={t("ap.ceiling.title")} desc={t("ap.ceiling.desc")}>
                <select
                  className={SELECT}
                  value={ceiling}
                  onChange={(e) => onCeiling(Number(e.target.value))}
                  aria-label={t("ap.ceiling.title")}
                >
                  {withCurrent(CEILINGS, ceiling).map((c) => (
                    <option key={c} value={c}>
                      {t("ap.ceiling.per_day").replace("{n}", String(c))}
                    </option>
                  ))}
                </select>
              </PolicyRow>
            </div>
          </div>

          {/* voice link box (.hr-voice) */}
          <div className="mt-1 flex items-start gap-[9px] rounded-md border border-accent/[0.22] bg-accent/[0.06] px-[15px] py-[13px] text-small leading-relaxed text-text-muted">
            <IcVoice size={15} className="mt-px shrink-0 text-accent" />
            <span>
              {voiceBefore}
              <Link href={VOICE_HREF} className="font-semibold text-accent underline underline-offset-2">
                {voiceLink}
              </Link>
              {voiceAfter}{" "}
              <Link href={VOICE_HREF} className="font-semibold text-text hover:underline">
                {t("ap.voice.cta")}
              </Link>
            </span>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

// One reply policy row (.policy-row): label/desc on the left, control on the right.
function PolicyRow({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5 border-t border-border py-3.5 first:border-t-0 max-md:gap-2.5 md:flex-row md:items-center md:justify-between md:gap-4">
      <div className="min-w-0">
        <div className="text-small font-semibold">{title}</div>
        <div className="mt-0.5 text-caption leading-relaxed text-text-subtle">{desc}</div>
      </div>
      <div className="shrink-0 max-md:w-full">{children}</div>
    </div>
  );
}

// Convert a local quiet window (e.g. 23:00–08:00 at UTC+1) to a UTC range string
// «22:00–07:00» for the hint. Best-effort, hour-granularity, demo-only.
function quietWindowUtc(from: string, to: string, tz: string): string {
  const m = /UTC([+-]\d+)/.exec(tz);
  const offset = m ? Number(m[1]) : 0;
  const shift = (hhmm: string) => {
    const [h, mm] = hhmm.split(":").map(Number);
    const u = ((h - offset) % 24 + 24) % 24;
    return `${String(u).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
  };
  return `${shift(from)}–${shift(to)}`;
}
