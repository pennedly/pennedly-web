// Calendar demo data — drives the `?demo=1` review. Built relative to "now" so
// the agenda always straddles today (the demo has no server clock): a few
// manually scheduled drafts, a projection of two autopilot rules, and one
// failed entry, across the next few days.

import type { CalendarEntry } from "@/lib/types";

export function demoCalendar(): CalendarEntry[] {
  const at = (offsetDays: number, hour: number, min = 0): string => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    d.setHours(hour, min, 0, 0);
    return d.toISOString();
  };
  return [
    { id: "draft-1", source: "manual", status: "failed", scheduled_at: at(0, 8), text: "three small edits that made this paragraph finally land — cut the throat-clear, name the stakes, end on a verb.", error: "Threads rejected the post — duplicate content within 24h. Edit the text or pick a new time, then retry." },
    { id: "draft-2", source: "manual", status: "scheduled", scheduled_at: at(0, 13), text: "editing is just deciding, over and over, what you actually meant. the cuts are where the voice shows up." },
    { id: "rule-1-d0e", source: "autopilot", status: "projected", scheduled_at: at(0, 18), text: null, rule_name: "Evening question" },
    { id: "rule-2-d1m", source: "autopilot", status: "projected", scheduled_at: at(1, 9), text: null, rule_name: "Morning thought" },
    { id: "rule-1-d1e", source: "autopilot", status: "projected", scheduled_at: at(1, 18), text: null, rule_name: "Evening question" },
    { id: "rule-2-d2m", source: "autopilot", status: "projected", scheduled_at: at(2, 9), text: null, rule_name: "Morning thought" },
    { id: "draft-3", source: "manual", status: "scheduled", scheduled_at: at(2, 9, 30), text: "a question I keep coming back to: who is this paragraph for? write to that one person and the rest follows." },
    { id: "rule-1-d2e", source: "autopilot", status: "projected", scheduled_at: at(2, 18), text: null, rule_name: "Evening question" },
    { id: "draft-4", source: "manual", status: "scheduled", scheduled_at: at(4, 11), text: "weekend writing is permission, not pressure. write one true line and stop. momentum beats marathons." },
  ];
}
