// Mentions demo dataset — powers the tester ?demo=1 review with no auth or
// backend. Shaped like the real MentionSummary (plus an optional `translation`
// the demo uses in place of the on-demand translate call). Content mirrors
// design-export/PennedlyDesign mentions-data.jsx (Mara Lin), em-dash-free.

import type { MentionSummary } from "@/lib/types";

export type DemoMention = MentionSummary & { translation?: string };

// NOT `as const` — tweak values must widen to {boolean, string}.
export const MN_TWEAK_DEFAULTS = { dark: false, state: "Populated" };

function m(id: number, username: string, at: string, text: string, translation?: string): DemoMention {
  return {
    id,
    account_id: 1,
    threads_mention_id: `tm${id}`,
    author_username: username,
    text,
    permalink: `https://www.threads.net/@${username}/post/m${id}`,
    status: "new",
    published_at: at,
    created_at: at,
    translation,
  };
}

export const DEMO_MENTIONS: DemoMention[] = [
  m(1, "writingroom", "2026-06-01T10:42:00Z",
    "just read @mara.lin's thread on cutting 600 words before breakfast and had to sit down for a minute. the best writing advice is always the most uncomfortable one."),
  m(2, "devon_makes", "2026-06-01T10:00:00Z",
    'if you\'re not following @mara.lin you\'re missing the most honest writing account on here. start with her "worst first line on purpose" post and thank me later.'),
  m(3, "lottie.writes", "2026-06-01T08:00:00Z",
    "@mara.lin ¿cómo te mantienes constante sin quemarte? lo pregunto por mí, específicamente, hoy 😅",
    "@mara.lin how do you stay consistent without burning out? asking for me, specifically, today 😅"),
  m(4, "the_draft_club", "2026-05-31T12:00:00Z",
    'added @mara.lin to this week\'s roundup of writers worth reading. her "ship three decent things a week for a year" line lives in my head rent-free.'),
  m(5, "kenji.dev", "2026-05-31T09:30:00Z",
    "Der Thread von @mara.lin über das Kürzen von Texten ist absolute Pflichtlektüre für alle, die online schreiben.",
    "@mara.lin's thread on cutting text down is absolute essential reading for anyone who writes online."),
  m(6, "paulwrites", "2026-05-30T16:00:00Z",
    'stealing @mara.lin\'s "write the worst possible first line on purpose" for my workshop tomorrow. credited, obviously. it unlocks every nervous writer in the room.'),
  m(7, "ana.writes", "2026-05-29T14:00:00Z",
    "la façon dont @mara.lin parle de la constance plutôt que de l'intensité a discrètement recadré toute mon année. merci d'écrire en public, là où le reste d'entre nous peut apprendre.",
    "the way @mara.lin talks about consistency over intensity quietly reframed my whole year. thank you for writing in public, where the rest of us can learn from it."),
  m(8, "creatorgrowth_io", "2026-05-28T11:00:00Z",
    "🔥 @mara.lin and 50+ top creators are scaling their reach with THIS one tool. tap the link in our bio to 10x your engagement today 🚀"),
];
