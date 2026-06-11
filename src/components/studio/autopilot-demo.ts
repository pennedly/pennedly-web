// Autopilot demo dataset — powers the tester ?demo=1 review with no auth or
// backend. Shaped exactly like the real types (AutopilotConfig / AutopostRule /
// TopicOption / AutopostActivity) so the live render path is reused verbatim.
// Content mirrors design-export/PennedlyDesign autopilot-data.jsx (Mara Lin),
// em-dash-free. Post hours are stored UTC; the screen shows them in local time.

import type {
  AutopilotConfig,
  AutopostActivity,
  AutopostRule,
  TopicOption,
} from "@/lib/types";

// NOT `as const` — tweak values must widen to {boolean, string}.
export const AP_TWEAK_DEFAULTS = { dark: false, state: "On" };

export const DEMO_TOPICS: TopicOption[] = [
  { id: 1, label: "Writing craft" },
  { id: 2, label: "Revision & editing" },
  { id: 3, label: "Building in public" },
  { id: 4, label: "Consistency & habits" },
  { id: 5, label: "A question for my audience" },
];

// post_hour is the canonical UTC hour; the UI converts it to the viewer's local
// clock and shows a "UTC±N · sends HH:00 UTC" hint.
export const DEMO_RULES: AutopostRule[] = [
  { id: 1, name: "Morning thought", topic_id: 1, post_hour: 7, jitter_minutes: 15, enabled: true, auto_reply: true, reply_audience: "", replies_per_day: 0 },
  { id: 2, name: "Midday craft note", topic_id: 2, post_hour: 12, jitter_minutes: 30, enabled: true, auto_reply: false, reply_audience: "", replies_per_day: 0 },
  { id: 3, name: "Evening question", topic_id: 5, post_hour: 18, jitter_minutes: 0, enabled: false, auto_reply: true, reply_audience: "", replies_per_day: 0 },
];

export const DEMO_CONFIG: AutopilotConfig = {
  enabled: true,
  post_enabled: true,
  posts_per_day: 3,
  quiet_start_hour: null,
  quiet_end_hour: null,
  reply_enabled: true,
  reply_audience: "fans",
  replies_per_day: 25,
  reply_frequency: "hourly",
  reply_quiet_start_hour: 21, // 21:00 UTC → a populated quiet window in the demo
  reply_quiet_end_hour: 6,
  reply_skip_low_value: true,
};

export const DEMO_ACTIVITY: AutopostActivity = {
  rules: [
    { id: 1, name: "Morning thought", enabled: true, last_post_at: "2026-06-07T07:04:00Z", posts_total: 142 },
    { id: 2, name: "Midday craft note", enabled: true, last_post_at: "2026-06-06T12:12:00Z", posts_total: 118 },
    { id: 3, name: "Evening question", enabled: false, last_post_at: "2026-06-06T18:28:00Z", posts_total: 63 },
  ],
  posts_total: 323,
  replies_total: 1184,
  posts: [
    { post_id: 1, rule_id: 1, rule_name: "Morning thought", text: "the draft you're avoiding is usually the one worth writing. open the doc, write one bad sentence, and let it pull you in.", published_at: "2026-06-07T07:04:00Z", views: 9400, likes: 187, comments: 14, threads_url: "https://www.threads.net/@mara.lin/post/ap1" },
    { post_id: 2, rule_id: 2, rule_name: "Midday craft note", text: "editing is just deciding, over and over, what you actually meant. the cuts are where the voice shows up.", published_at: "2026-06-06T12:12:00Z", views: 6100, likes: 132, comments: 9, threads_url: "https://www.threads.net/@mara.lin/post/ap2" },
    { post_id: 3, rule_id: 3, rule_name: "Evening question", text: "what's a piece of writing advice you had to unlearn? i'll start: \"write every day\" nearly burned me out.", published_at: "2026-06-06T18:28:00Z", views: 12800, likes: 264, comments: 41, threads_url: "https://www.threads.net/@mara.lin/post/ap3" },
  ],
  replies: [
    { comment_id: 1, author_username: "devon_makes", comment_text: "needed this exact reminder before opening my laptop today. how do you push past the first bad sentence?", reply_text: "honestly i just let it be bad on purpose, the second sentence is always braver once the first one's out of the way.", replied_at: "2026-06-07T07:32:00Z", post_threads_url: "https://www.threads.net/@mara.lin/post/ap1" },
    { comment_id: 2, author_username: "rivka.k", comment_text: "\"write every day\" wrecked me too. what replaced it for you?", reply_text: "\"write most weeks, finish what matters.\" consistency over streaks, missing a day stopped meaning anything.", replied_at: "2026-06-06T19:06:00Z", post_threads_url: "https://www.threads.net/@mara.lin/post/ap3" },
    { comment_id: 3, author_username: "ana.writes", comment_text: "the unlearning one is so real. mine was that every post has to teach something.", reply_text: "yes, sometimes a post just has to be true. not every line needs a lesson attached to it.", replied_at: "2026-06-06T19:10:00Z", post_threads_url: "https://www.threads.net/@mara.lin/post/ap3" },
  ],
};
