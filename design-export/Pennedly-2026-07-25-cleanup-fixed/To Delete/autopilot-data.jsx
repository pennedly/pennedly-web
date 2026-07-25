// autopilot-data.jsx — Autopilot defaults + helpers.
//
// SCHEDULE TIME MODEL (§3.10 local-time handling): the canonical post hour is
// stored in UTC minutes-since-midnight (`utcMin`) — that's the backend truth.
// Everything the VIEWER sees and picks is converted to their LOCAL timezone, so
// two people on different continents looking at the same schedule each see a
// sensible local clock time plus a "UTC±N" hint of the canonical value.

/* ---- local ↔ UTC time helpers (pure; no React) ---- */
// Minutes to add to UTC to reach the viewer's local wall clock.
// getTimezoneOffset() is minutes WEST of UTC (PT summer = 420 → offset = −420).
function apOffsetMin() { return -new Date().getTimezoneOffset(); }
function apFmtOffset() {
  const m = apOffsetMin(), s = m < 0 ? "\u2212" : "+", a = Math.abs(m);
  const h = Math.floor(a / 60), mm = a % 60;
  return "UTC" + s + h + (mm ? ":" + String(mm).padStart(2, "0") : "");
}
function apFmtClock(min) {            // local minutes-since-midnight → "8:00 AM"
  min = ((min % 1440) + 1440) % 1440;
  let h = Math.floor(min / 60); const m = min % 60;
  const ap = h < 12 ? "AM" : "PM"; let h12 = h % 12; if (h12 === 0) h12 = 12;
  return h12 + ":" + String(m).padStart(2, "0") + " " + ap;
}
function apFmtUTC(utcMin) {           // utc minutes-since-midnight → "15:00 UTC" (24h)
  utcMin = ((utcMin % 1440) + 1440) % 1440;
  return String(Math.floor(utcMin / 60)).padStart(2, "0") + ":" + String(utcMin % 60).padStart(2, "0") + " UTC";
}
function apUtcToLocal(utcMin) { return ((utcMin + apOffsetMin()) % 1440 + 1440) % 1440; }
function apLocalToUtc(localMin) { return ((localMin - apOffsetMin()) % 1440 + 1440) % 1440; }

// The picker lists every half hour across the day, in LOCAL time.
const TIME_SLOTS = Array.from({ length: 48 }, (_, i) => i * 30);   // local minutes-since-midnight
// Jitter = a random ± minute spread around the post time. 0 = exact.
const JITTER_OPTIONS = [0, 5, 15, 30];
function apFmtJitter(n) { return n === 0 ? "Exact (no spread)" : "\u00B1 " + n + " min"; }

const TOPIC_OPTIONS = ["Writing craft", "Revision & editing", "Building in public", "Consistency & habits", "A question for my audience"];

// Account-level auto-reply policy options (the worker honors THESE).
const AUDIENCE_OPTIONS = ["Everyone", "Followers only", "People I follow", "Mentions only"];
const CAP_OPTIONS = ["10 / day", "25 / day", "50 / day", "No cap"];

// Build a default schedule from an INTENDED LOCAL time so the demo always shows
// nice local clock times for whoever opens it; the stored value is UTC.
function mkObj(id, name, localMin, jitter, topic, on, seed) {
  return { id, name, utcMin: apLocalToUtc(localMin), jitter, topic, on, seed };
}
const DEFAULT_OBJECTS = [
  mkObj("o1", "Morning thought",  8 * 60,      15, "Writing craft",                true,  true),
  mkObj("o2", "Midday craft note", 13 * 60,    30, "Revision & editing",           true,  false),
  mkObj("o3", "Evening question",  19 * 60 + 30, 0, "A question for my audience",   false, true),
];

// Account-level auto-reply policy. on=master; this is what actually runs.
const DEFAULT_POLICY = { on: true, audience: "Followers only", cap: "25 / day" };

// Read-only activity. Per-object counters …
const COUNTERS = [
  { name: "Morning thought",   posts: 14, replies: 38 },
  { name: "Midday craft note", posts: 11, replies: 0 },
  { name: "Evening question",  posts: 6,  replies: 22 },
];

// … recent published posts (timestamps are absolute instants → shown in local
// time via window.fmtDateTime). Computed from "now" so they always read recent.
const H = 3600e3;
function ago(ms) { return new Date(Date.now() - ms).toISOString(); }
const AUTO_POSTS = [
  { id: "ap1", object: "Morning thought",  at: ago(5 * H),         text: "the draft you're avoiding is usually the one worth writing. open the doc, write one bad sentence, and let it pull you in.", views: "9.4K", likes: 187, replies: 14, link: "https://www.threads.net/@mara.lin/post/ap1" },
  { id: "ap2", object: "Midday craft note", at: ago(28 * H),        text: "editing is just deciding, over and over, what you actually meant. the cuts are where the voice shows up.", views: "6.1K", likes: 132, replies: 9, link: "https://www.threads.net/@mara.lin/post/ap2" },
  { id: "ap3", object: "Evening question",  at: ago(34 * H),        text: "what's a piece of writing advice you had to unlearn? i'll start: \u201Cwrite every day\u201D nearly burned me out.", views: "12.8K", likes: 264, replies: 41, link: "https://www.threads.net/@mara.lin/post/ap3" },
];

// … and recent auto-replies it sent: the original comment + the bot's reply +
// the post it was on + a link to the thread.
const AUTO_REPLIES = [
  { id: "ar1", from: { name: "Devon Pierce", handle: "@devon_makes", initials: "DP" }, at: ago(4.5 * H), onPost: "Morning thought",
    comment: "needed this exact reminder before opening my laptop today. how do you push past the first bad sentence?",
    reply: "honestly i just let it be bad on purpose — the second sentence is always braver once the first one's out of the way.",
    link: "https://www.threads.net/@mara.lin/post/ap1" },
  { id: "ar2", from: { name: "Rivka Adler", handle: "@rivka.k", initials: "RA" }, at: ago(33 * H), onPost: "Evening question",
    comment: "\u201Cwrite every day\u201D wrecked me too. what replaced it for you?",
    reply: "\u201Cwrite most weeks, finish what matters.\u201D consistency over streaks — missing a day stopped meaning anything.",
    link: "https://www.threads.net/@mara.lin/post/ap3" },
  { id: "ar3", from: { name: "Ana Brandt", handle: "@ana.writes", initials: "AB" }, at: ago(35 * H), onPost: "Evening question",
    comment: "the unlearning one is so real. mine was that every post has to teach something.",
    reply: "yes — sometimes a post just has to be true. not every line needs a lesson attached to it.",
    link: "https://www.threads.net/@mara.lin/post/ap3" },
];

Object.assign(window, {
  apOffsetMin, apFmtOffset, apFmtClock, apFmtUTC, apUtcToLocal, apLocalToUtc,
  TIME_SLOTS, JITTER_OPTIONS, apFmtJitter, TOPIC_OPTIONS, AUDIENCE_OPTIONS, CAP_OPTIONS,
  DEFAULT_OBJECTS, DEFAULT_POLICY, COUNTERS, AUTO_POSTS, AUTO_REPLIES,
});
