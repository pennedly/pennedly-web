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
  if (offsetMin === 0) return "UTC";
  const sign = offsetMin > 0 ? "+" : "-";
  const abs = Math.abs(offsetMin);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return m === 0
    ? `UTC${sign}${h}`
    : `UTC${sign}${h}:${String(m).padStart(2, "0")}`;
}
