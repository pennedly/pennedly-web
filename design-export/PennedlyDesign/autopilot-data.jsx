// autopilot-data.jsx — Autopilot defaults: scheduled-post objects, the
// account auto-reply policy, and recent activity (read-only).

const AP_USER = { name: "Mara Lin", handle: "@mara.lin", initials: "ML" };
const TZ = "your time (PT)";

const TIME_OPTIONS = ["6:30 AM", "7:00 AM", "8:00 AM", "8:30 AM", "9:00 AM", "12:00 PM", "1:00 PM", "5:00 PM", "6:00 PM", "7:30 PM", "9:00 PM"];
const JITTER_OPTIONS = ["Exact", "± 5 min", "± 15 min", "± 30 min"];
const TOPIC_OPTIONS = ["Writing craft", "Revision & editing", "Building in public", "Consistency & habits", "Replies to recent posts", "A question for my audience"];
const AUDIENCE_OPTIONS = ["Everyone", "Followers only", "People I follow", "Mentions only"];
const CAP_OPTIONS = ["10 / day", "25 / day", "50 / day", "No cap"];

const DEFAULT_OBJECTS = [
  { id: "o1", name: "Morning thought", time: "8:00 AM", jitter: "± 15 min", topic: "Writing craft", on: true, seeds: true },
  { id: "o2", name: "Midday craft note", time: "1:00 PM", jitter: "± 30 min", topic: "Revision & editing", on: true, seeds: false },
  { id: "o3", name: "Evening question", time: "7:30 PM", jitter: "Exact", topic: "A question for my audience", on: false, seeds: true },
];

const DEFAULT_POLICY = { on: true, audience: "Followers only", cap: "25 / day" };

const COUNTERS = [
  { name: "Morning thought", posts: 14, replies: 38 },
  { name: "Midday craft note", posts: 11, replies: 0 },
  { name: "Evening question", posts: 6, replies: 22 },
];

const AUTO_POSTS = [
  { id: "ap1", object: "Morning thought", time: "Today, 8:07 AM", text: "the draft you're avoiding is usually the one worth writing. open the doc, write one bad sentence, and let it pull you in.", views: "9.4K", likes: 187, replies: 14 },
  { id: "ap2", object: "Midday craft note", time: "Today, 1:22 PM", text: "editing is just deciding, over and over, what you actually meant. the cuts are where the voice shows up.", views: "6.1K", likes: 132, replies: 9 },
  { id: "ap3", object: "Evening question", time: "Yesterday, 7:30 PM", text: "what's a piece of writing advice you had to unlearn? i'll start: \u201Cwrite every day\u201D nearly burned me out.", views: "12.8K", likes: 264, replies: 41 },
];

const AUTO_REPLIES = [
  {
    id: "ar1", to: { name: "Devon Pierce", handle: "@devon_makes", initials: "DP" }, time: "Today, 8:21 AM", on: "Morning thought",
    comment: "needed this exact reminder before opening my laptop today. how do you push past the first bad sentence?",
    reply: "honestly i just let it be bad on purpose — the second sentence is always braver once the first one's out of the way.",
  },
  {
    id: "ar2", to: { name: "Rivka Adler", handle: "@rivka.k", initials: "RA" }, time: "Yesterday, 7:48 PM", on: "Evening question",
    comment: "\u201Cwrite every day\u201D wrecked me too. what replaced it for you?",
    reply: "\u201Cwrite most weeks, finish what matters.\u201D consistency over streaks — missing a day stopped meaning anything.",
  },
  {
    id: "ar3", to: { name: "Ana Brandt", handle: "@ana.writes", initials: "AB" }, time: "Yesterday, 8:02 PM", on: "Evening question",
    comment: "the unlearning one is so real. mine was that every post has to teach something.",
    reply: "yes — sometimes a post just has to be true. not every line needs a lesson attached to it.",
  },
];

Object.assign(window, {
  AP_USER, TZ, TIME_OPTIONS, JITTER_OPTIONS, TOPIC_OPTIONS, AUDIENCE_OPTIONS, CAP_OPTIONS,
  DEFAULT_OBJECTS, DEFAULT_POLICY, COUNTERS, AUTO_POSTS, AUTO_REPLIES,
});
