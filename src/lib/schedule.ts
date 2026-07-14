// Time resolution for the advisor's schedule_post action. The model proposes a
// weekday (1=Mon..7=Sun) + a LOCAL hour; the browser (which holds the viewer's
// true wall clock + timezone) resolves that to the NEXT future occurrence and to
// an absolute UTC instant for the API. Keeping the resolution client-side avoids
// any fabricated "now" or timezone guess on the model/server side.

// A lead buffer so a resolved time is never so close that it fails the server's
// 5-min minimum lead — even after multi-second post generation. If the target
// hour is within this window today, we jump to next week instead. Comfortably
// above the backend's 5-min guard + worst-case generation latency.
const LEAD_MS = 15 * 60_000;

// Resolve weekday (1=Mon..7=Sun) + local hour to the next occurrence that is at
// least LEAD_MS in the future. Callers should resolve at APPLY time (not freeze
// the instant at render) so a slow user click can't post a now-stale time.
export function nextOccurrence(weekday: number, hour: number, from: Date = new Date()): Date {
  const d = new Date(from);
  d.setHours(hour, 0, 0, 0);
  // Our weekday is 1..7 Mon..Sun; JS getDay() is 0..6 Sun..Sat → 7 (Sun) maps to 0.
  const targetDow = weekday % 7;
  let delta = (targetDow - d.getDay() + 7) % 7;
  // Same weekday but the hour is already past OR too soon (within the lead) →
  // jump a week, so the result always clears the server's minimum lead.
  if (delta === 0 && d.getTime() <= from.getTime() + LEAD_MS) delta = 7;
  d.setDate(d.getDate() + delta);
  return d;
}

// Human label for the resolved local time, e.g. "Tue, 18:00" / "вт, 18:00".
export function formatSchedule(date: Date, locale: string): string {
  return date.toLocaleString(locale, {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
