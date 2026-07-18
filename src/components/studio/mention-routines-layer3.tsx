"use client";

// Mention-routine constructor — Layer 3 «Только для этой рутины». Per-routine reply
// overrides (частота · тихие часы · лимит · аудитория). Model: inherit «Правила
// дома» by default, override per field. Ported 1:1 from Mention-Routine-Layer3-SPEC
// (layer3Body). The backend writes ONLY the overridden keys (reply_overrides), so an
// inherited knob keeps tracking the account value (true inheritance). Tailwind chrome
// in the constructor's idiom; both themes via tokens.

import type { ReactNode } from "react";

import {
  IcAlert,
  IcBubbleQuestion,
  IcGauge,
  IcHeart,
  IcInfo,
  IcMinus,
  IcMoon,
  IcPencil,
  IcPerson,
  IcPlus,
  IcRepeat,
  IcShield,
  IcShieldHouse,
} from "@/components/icons";
import type { MessageKey } from "@/lib/i18n";
import type { ScenarioReplyOverrides } from "@/lib/types";

type T = (k: MessageKey) => string;

export type L3Freq = "now" | "30" | "hour" | "multi" | "day";
export type L3Aud = "fans" | "all" | "q" | "custom";

// A per-routine override set. `null` for a knob = inherit «Правила дома».
export type MRL3 = {
  freq: L3Freq | null;
  // null = inherit · "off" = 24/7 (no quiet hours) · {start,end} = a window (an empty
  // bound is the invalid "half window" that blocks Save).
  quiet: null | "off" | { start: string; end: string };
  limit: number | null;
  aud: L3Aud | null;
  audPrompt: string;
};

export const EMPTY_L3: MRL3 = { freq: null, quiet: null, limit: null, aud: null, audPrompt: "" };

// The account «Правила дома» values shown as the inherited defaults. null = unknown
// at render → a neutral «как в Правилах дома», never a fabricated number.
export type L3House = {
  freq: L3Freq | null;
  quietStart: number | null;
  quietEnd: number | null;
  limit: number | null;
  aud: L3Aud | null;
};

const FREQ_ORDER: L3Freq[] = ["now", "30", "hour", "multi", "day"];
const FREQ_TO_BACKEND: Record<L3Freq, string> = {
  now: "asap",
  "30": "half_hourly",
  hour: "hourly",
  multi: "few_daily",
  day: "daily",
};
const AUD_ORDER: L3Aud[] = ["fans", "all", "q", "custom"];
const AUD_TO_BACKEND: Record<L3Aud, string> = {
  fans: "fans",
  all: "all_except_trolls",
  q: "questions",
  custom: "custom",
};
const L3_LIMIT_MIN = 1;
const L3_LIMIT_MAX = 500;
const L3_LIMIT_DEFAULT = 15;

export function freqFromBackend(v: string | undefined | null): L3Freq | null {
  const hit = (Object.keys(FREQ_TO_BACKEND) as L3Freq[]).find((k) => FREQ_TO_BACKEND[k] === v);
  return hit ?? null;
}
export function audFromBackend(v: string | undefined | null): L3Aud | null {
  const hit = (Object.keys(AUD_TO_BACKEND) as L3Aud[]).find((k) => AUD_TO_BACKEND[k] === v);
  return hit ?? null;
}
const pad = (n: number) => String(n).padStart(2, "0");
export const hourToHHMM = (h: number | null): string => (h == null ? "" : pad(((h % 24) + 24) % 24) + ":00");
const hhmmToHour = (s: string): number | null => {
  const h = Number(s.split(":")[0]);
  return Number.isInteger(h) && h >= 0 && h <= 23 ? h : null;
};

// ── override count / validity ────────────────────────────────────────────────
export function l3OverrideCount(l3: MRL3): number {
  return [l3.freq != null, l3.quiet != null, l3.limit != null, l3.aud != null].filter(Boolean).length;
}
export function l3QuietInvalid(l3: MRL3): boolean {
  return typeof l3.quiet === "object" && l3.quiet !== null && (!l3.quiet.start || !l3.quiet.end);
}
export function l3AudInvalid(l3: MRL3): boolean {
  return l3.aud === "custom" && !l3.audPrompt.trim();
}
/** Save is blocked while any override is half-set (a lone quiet bound / an empty
 *  custom-audience description). Editing is never blocked, only Save. */
export function l3Valid(l3: MRL3): boolean {
  return !l3QuietInvalid(l3) && !l3AudInvalid(l3);
}

// ── read/write the backend action_cfg ────────────────────────────────────────
export function l3FromActionCfg(cfg: Record<string, unknown> | null | undefined): MRL3 {
  const c = cfg || {};
  const freq = "frequency" in c ? freqFromBackend(String(c.frequency)) : null;
  const qs = c.quiet_start_hour;
  const qe = c.quiet_end_hour;
  let quiet: MRL3["quiet"] = null;
  if (typeof qs === "number" && typeof qe === "number") {
    quiet = qs === qe ? "off" : { start: hourToHHMM(qs), end: hourToHHMM(qe) };
  }
  const limit = typeof c.max_per_day === "number" ? c.max_per_day : null;
  const aud = "audience" in c ? audFromBackend(String(c.audience)) : null;
  const audPrompt = typeof c.audience_prompt === "string" ? c.audience_prompt : "";
  return { freq, quiet, limit, aud, audPrompt };
}

export function buildReplyOverrides(l3: MRL3): ScenarioReplyOverrides {
  const out: ScenarioReplyOverrides = {};
  if (l3.freq) out.frequency = FREQ_TO_BACKEND[l3.freq];
  if (l3.quiet != null) {
    if (l3.quiet === "off") {
      out.quiet_start_hour = 0;
      out.quiet_end_hour = 0; // start == end ⇒ "no quiet hours"
    } else {
      const s = hhmmToHour(l3.quiet.start);
      const e = hhmmToHour(l3.quiet.end);
      if (s != null && e != null) {
        out.quiet_start_hour = s;
        out.quiet_end_hour = e;
      }
    }
  }
  if (l3.limit != null) {
    out.max_per_day = Math.min(L3_LIMIT_MAX, Math.max(L3_LIMIT_MIN, Math.round(l3.limit)));
  }
  if (l3.aud) {
    out.audience = AUD_TO_BACKEND[l3.aud];
    if (l3.aud === "custom") out.audience_prompt = l3.audPrompt.trim();
  }
  return out;
}

// ── chrome ───────────────────────────────────────────────────────────────────
const badge = (over: boolean, t: T) =>
  over ? (
    <span className="ml3-badge ml3-badge--on">
      <IcPencil size={10} /> {t("mrl3.badge.own")}
    </span>
  ) : (
    <span className="ml3-badge">
      <IcShieldHouse size={10} /> {t("mrl3.badge.inherit")}
    </span>
  );

function Row({
  ico,
  title,
  desc,
  over,
  invalid,
  secondary,
  activeVal,
  houseVal,
  onOverride,
  onRevert,
  children,
  t,
}: {
  ico: ReactNode;
  title: string;
  desc: string;
  over: boolean;
  invalid: boolean;
  secondary?: boolean;
  activeVal: string; // «Сейчас действует» value (already resolved, "—" when invalid)
  houseVal: string | null; // «В Правилах дома» value (null → neutral)
  onOverride: () => void;
  onRevert: () => void;
  children?: ReactNode; // the control, shown when overridden
  t: T;
}) {
  return (
    <div className={"ml3-row" + (over ? " is-over" : "") + (invalid ? " is-invalid" : "") + (secondary ? " ml3-row--secondary" : "")}>
      <div className="ml3-main">
        <span className="ml3-ico">{ico}</span>
        <div className="ml3-text">
          <div className="ml3-t">
            {title} {badge(over, t)}
          </div>
          <div className="ml3-d">{desc}</div>
        </div>
        {over ? (
          <button type="button" className="ml3-revert" onClick={onRevert}>
            <IcShieldHouse size={12} /> {t("mrl3.badge.inherit")}
          </button>
        ) : (
          <button type="button" className="ml3-btn" onClick={onOverride}>
            <IcPencil size={12} /> {t("mrl3.override")}
          </button>
        )}
      </div>
      <div className="ml3-valrow">
        <span className="ml3-vk">{t("mrl3.active")}</span>
        <span className={"ml3-vv" + (over && !invalid ? " ml3-vv--on" : "")}>{activeVal}</span>
      </div>
      {over && (
        <div className="ml3-ctl">
          {children}
          <div className="ml3-was">
            <IcShieldHouse size={11} /> {t("mrl3.inhouse")}: <b>{houseVal ?? t("mrl3.inherited")}</b> ·{" "}
            <a href="/app/scenarios">{t("mrl3.open")}</a>
          </div>
        </div>
      )}
    </div>
  );
}

// ── the panel ────────────────────────────────────────────────────────────────
export function Layer3Panel({
  l3,
  setL3,
  house,
  masterOff,
  t,
}: {
  l3: MRL3;
  setL3: (next: MRL3) => void;
  house: L3House;
  masterOff: boolean;
  t: T;
}) {
  const patch = (p: Partial<MRL3>) => setL3({ ...l3, ...p });
  const n = l3OverrideCount(l3);

  const freqLabel = (f: L3Freq) => t(("mrl3.freq." + f) as MessageKey);
  const audLabel = (a: L3Aud) => t(("mrl3.aud." + a) as MessageKey);
  const houseFreq = house.freq ? freqLabel(house.freq) : null;
  const houseQuiet =
    house.quietStart != null && house.quietEnd != null
      ? house.quietStart === house.quietEnd
        ? t("mrl3.quiet.offval")
        : hourToHHMM(house.quietStart) + " – " + hourToHHMM(house.quietEnd)
      : null;
  const houseLimit = house.limit != null ? t("mrl3.limitval").replace("{n}", String(house.limit)) : null;
  const houseAud = house.aud ? audLabel(house.aud) : null;

  // «Сейчас действует» values.
  const freqActive = l3.freq ? freqLabel(l3.freq) : (houseFreq ?? t("mrl3.inherited"));
  const quietActive =
    l3.quiet == null
      ? (houseQuiet ?? t("mrl3.inherited"))
      : l3.quiet === "off"
        ? t("mrl3.quiet.offval")
        : l3QuietInvalid(l3)
          ? "—"
          : l3.quiet.start + " – " + l3.quiet.end;
  const limitActive = l3.limit != null ? t("mrl3.limitval").replace("{n}", String(l3.limit)) : (houseLimit ?? t("mrl3.inherited"));
  const audActive = l3.aud
    ? l3.aud === "custom"
      ? l3AudInvalid(l3)
        ? "—"
        : l3.audPrompt.trim()
      : audLabel(l3.aud)
    : (houseAud ?? t("mrl3.inherited"));

  return (
    <div className="mr-l3">
      <div className="ml3-lead">
        <div className="ml3-lead-t" dangerouslySetInnerHTML={{ __html: t("mrl3.lead") }} />
        <div className="ml3-lead-foot">
          {n === 0 ? (
            <span className="ml3-count">
              <IcShieldHouse size={11} /> {t("mrl3.count.none")}
            </span>
          ) : (
            <span className="ml3-count ml3-count--on">
              <IcPencil size={11} /> {t("mrl3.count.n").replace("{n}", String(n))}
            </span>
          )}
          <a className="ml3-openhr" href="/app/scenarios">
            <IcShieldHouse size={12} /> {t("mrl3.openhouse")}
          </a>
        </div>
      </div>

      {masterOff && (
        <div className="ml3-masteroff">
          <IcInfo size={15} />
          <div className="mo-t" dangerouslySetInnerHTML={{ __html: t("mrl3.masteroff") }} />
        </div>
      )}

      <div className="ml3-list">
        {/* 01 частота */}
        <Row
          ico={<IcRepeat size={15} />}
          title={t("mrl3.freq.title")}
          desc={t("mrl3.freq.desc")}
          over={l3.freq != null}
          invalid={false}
          activeVal={freqActive}
          houseVal={houseFreq}
          onOverride={() => patch({ freq: house.freq ?? "hour" })}
          onRevert={() => patch({ freq: null })}
          t={t}
        >
          <div className="seg seg--wrap" role="tablist">
            {FREQ_ORDER.map((k) => (
              <button
                key={k}
                type="button"
                role="tab"
                className={"seg-opt" + (l3.freq === k ? " seg-opt--active" : "")}
                onClick={() => patch({ freq: k })}
              >
                {freqLabel(k)}
              </button>
            ))}
          </div>
        </Row>

        {/* 02 тихие часы */}
        <Row
          ico={<IcMoon size={15} />}
          title={t("mrl3.quiet.title")}
          desc={t("mrl3.quiet.desc")}
          over={l3.quiet != null}
          invalid={l3QuietInvalid(l3)}
          activeVal={quietActive}
          houseVal={houseQuiet}
          onOverride={() => patch({ quiet: { start: hourToHHMM(house.quietStart) || "23:00", end: hourToHHMM(house.quietEnd) || "07:00" } })}
          onRevert={() => patch({ quiet: null })}
          t={t}
        >
          <div className="ml3-quiet">
            <div className={"ml3-quiet-row" + (l3.quiet === "off" ? " is-disabled" : "")}>
              <span className="ml3-ql">{t("mrl3.quiet.from")}</span>
              <input
                className="field"
                type="time"
                step={3600}
                disabled={l3.quiet === "off"}
                value={typeof l3.quiet === "object" && l3.quiet ? l3.quiet.start : ""}
                onChange={(e) =>
                  patch({ quiet: { start: e.target.value, end: typeof l3.quiet === "object" && l3.quiet ? l3.quiet.end : "" } })
                }
                aria-label={t("mrl3.quiet.from")}
              />
              <span className="ml3-ql">{t("mrl3.quiet.to")}</span>
              <input
                className="field"
                type="time"
                step={3600}
                disabled={l3.quiet === "off"}
                value={typeof l3.quiet === "object" && l3.quiet ? l3.quiet.end : ""}
                onChange={(e) =>
                  patch({ quiet: { start: typeof l3.quiet === "object" && l3.quiet ? l3.quiet.start : "", end: e.target.value } })
                }
                aria-label={t("mrl3.quiet.to")}
              />
            </div>
            {l3QuietInvalid(l3) && (
              <div className="ml3-invalid">
                <IcAlert size={13} />
                <span dangerouslySetInnerHTML={{ __html: t("mrl3.quiet.invalid") }} />
              </div>
            )}
            <label className="ml3-checkrow">
              <input type="checkbox" checked={l3.quiet === "off"} onChange={(e) => patch({ quiet: e.target.checked ? "off" : { start: "23:00", end: "07:00" } })} />
              {t("mrl3.quiet.off")}
            </label>
          </div>
        </Row>

        {/* 03 лимит */}
        <Row
          ico={<IcGauge size={15} />}
          title={t("mrl3.limit.title")}
          desc={t("mrl3.limit.desc")}
          over={l3.limit != null}
          invalid={false}
          activeVal={limitActive}
          houseVal={houseLimit}
          onOverride={() => patch({ limit: house.limit ?? L3_LIMIT_DEFAULT })}
          onRevert={() => patch({ limit: null })}
          t={t}
        >
          <div className="ml3-limit">
            <div className="rc-step">
              <button type="button" aria-label={t("mrl3.less")} onClick={() => patch({ limit: Math.max(L3_LIMIT_MIN, (l3.limit ?? L3_LIMIT_DEFAULT) - 1) })}>
                <IcMinus size={14} />
              </button>
              <span className="rcs-val">{l3.limit ?? L3_LIMIT_DEFAULT}</span>
              <button
                type="button"
                aria-label={t("mrl3.more")}
                onClick={() => patch({ limit: Math.min(house.limit ?? L3_LIMIT_MAX, (l3.limit ?? L3_LIMIT_DEFAULT) + 1) })}
              >
                <IcPlus size={14} />
              </button>
            </div>
            <span className="ml3-limit-unit">{t("mrl3.limit.unit")}</span>
          </div>
        </Row>

        {/* 04 аудитория — secondary, last */}
        <Row
          ico={<IcPerson size={15} />}
          title={t("mrl3.aud.title")}
          desc={t("mrl3.aud.desc")}
          over={l3.aud != null}
          invalid={l3AudInvalid(l3)}
          secondary
          activeVal={audActive}
          houseVal={houseAud}
          onOverride={() => patch({ aud: house.aud ?? "all" })}
          onRevert={() => patch({ aud: null, audPrompt: "" })}
          t={t}
        >
          <div className="aud-grid">
            {AUD_ORDER.map((a) => {
              const ico =
                a === "fans" ? <IcHeart size={14} /> : a === "all" ? <IcShield size={14} /> : a === "q" ? <IcBubbleQuestion size={14} /> : <IcPencil size={14} />;
              return (
                <button key={a} type="button" className={"aud-tile" + (l3.aud === a ? " aud-tile--on" : "")} onClick={() => patch({ aud: a })}>
                  <span className="at-t">
                    {ico} {audLabel(a)}
                  </span>
                  <span className="at-d">{t(("mrl3.aud." + a + "_d") as MessageKey)}</span>
                </button>
              );
            })}
          </div>
          {l3.aud === "custom" && (
            <textarea
              className="field"
              rows={3}
              value={l3.audPrompt}
              onChange={(e) => patch({ audPrompt: e.target.value })}
              placeholder={t("mrl3.aud.custom_ph")}
              aria-label={t("mrl3.aud.title")}
            />
          )}
          {l3AudInvalid(l3) && (
            <div className="ml3-invalid">
              <IcAlert size={13} />
              <span>{t("mrl3.aud.custom_invalid")}</span>
            </div>
          )}
          <div className="ml3-hard">
            <IcShield size={12} />
            <span>{t("mrl3.aud.hard")}</span>
          </div>
        </Row>
      </div>

      {n > 0 && (
        <div className="ml3-resetall">
          <button type="button" className="ml3-reset-btn" onClick={() => setL3(EMPTY_L3)}>
            <IcRepeat size={13} /> {t("mrl3.resetall")}
          </button>
        </div>
      )}
    </div>
  );
}
