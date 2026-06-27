// Autopilot `post_hour` is stored and scheduled in UTC end to end (DB +
// worker). The UI shows and accepts hours in the viewer's local timezone and
// converts here, so the backend stays UTC-only. "Today" supplies the offset,
// which tracks the current DST state.

/** UTC hour-of-day (0-23) → the viewer's local hour-of-day (0-23). */
export function utcHourToLocal(utcHour: number): number {
  const d = new Date();
  d.setUTCHours(utcHour, 0, 0, 0);
  return d.getHours();
}

/** Local hour-of-day (0-23) → the UTC hour-of-day (0-23) to store. */
export function localHourToUtc(localHour: number): number {
  const d = new Date();
  d.setHours(localHour, 0, 0, 0);
  return d.getUTCHours();
}

/** Current local offset as "UTC+3" / "UTC-5:30" / "UTC". */
export function localUtcOffsetLabel(): string {
  const offsetMin = -new Date().getTimezoneOffset(); // east of UTC = positive
  return offsetLabelFromMinutes(offsetMin);
}

// ── per-ACCOUNT timezone (an IANA name, e.g. 'Europe/Warsaw', from the
// autopilot config's `timezone`) — distinct from the helpers above, which read
// the *viewer's* browser tz. The account quiet-hours control labels itself with
// the ACCOUNT's tz, not the viewer's. All three are total: an empty / 'UTC' /
// unknown / malformed name resolves to UTC (mirrors the backend's
// `pennedly.scenario_time.account_tz`), so a bad row never throws in the UI. ──

/** "UTC+3" / "UTC-5:30" / "UTC" from a signed minutes-east-of-UTC offset. */
function offsetLabelFromMinutes(offsetMin: number): string {
  if (!Number.isFinite(offsetMin) || offsetMin === 0) return "UTC";
  const sign = offsetMin > 0 ? "+" : "-";
  const abs = Math.abs(offsetMin);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return m === 0
    ? `UTC${sign}${h}`
    : `UTC${sign}${h}:${String(m).padStart(2, "0")}`;
}

/**
 * Minutes east of UTC for an IANA `tz` *right now* (so it tracks the current
 * DST state, like the browser helpers above). Returns 0 for 'UTC' / unknown /
 * malformed names. Uses `Intl` `longOffset` parts (e.g. "GMT+02:00").
 */
function tzOffsetMinutes(tz: string): number {
  if (!tz || tz === "UTC") return 0;
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "longOffset",
    }).formatToParts(new Date());
    const name = parts.find((p) => p.type === "timeZoneName")?.value ?? "";
    // "GMT+02:00" / "GMT-05:30" / "GMT" (= UTC).
    const m = /GMT([+-])(\d{1,2})(?::(\d{2}))?/.exec(name);
    if (!m) return 0;
    const sign = m[1] === "-" ? -1 : 1;
    const h = Number(m[2]);
    const min = m[3] ? Number(m[3]) : 0;
    return sign * (h * 60 + min);
  } catch {
    // Unknown/malformed IANA name or an environment without the tz data.
    return 0;
  }
}

/** The account tz `tz` as a "UTC+3" / "UTC-5:30" / "UTC" offset label. */
export function tzUtcOffsetLabel(tz: string): string {
  return offsetLabelFromMinutes(tzOffsetMinutes(tz));
}

/**
 * A local hour-of-day (0-23) IN the account tz → the UTC hour-of-day (0-23).
 * 'UTC' / unknown tz is the identity. Hour granularity: a sub-hour offset
 * (e.g. UTC+5:30) is floored to whole UTC hours, matching the whole-hour quiet
 * window the backend stores.
 */
export function tzLocalHourToUtc(localHour: number, tz: string): number {
  const offsetMin = tzOffsetMinutes(tz);
  const utcMinutes = localHour * 60 - offsetMin;
  const utcHour = Math.floor(utcMinutes / 60);
  return ((utcHour % 24) + 24) % 24;
}
