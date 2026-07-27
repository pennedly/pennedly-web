// Advisor source-label mapping. Once this module also held the demo/mock
// conversation for the ?demo=1 review and the /gallery/advisor state page; the
// /app/advisor redesign dropped those, so all that's left is turning the
// backend's canonical source ids into localized labels.

import type { MessageKey } from "@/lib/i18n";

type T = (key: MessageKey) => string;

// The backend returns canonical source ids in `grounded_in`; map each to its
// localized label for the "Grounded in: …" line. Unknown ids pass through as-is
// (forward-compatible if the backend adds a new source).
const SOURCE_KEY: Record<string, MessageKey> = {
  "Stats · 7 days": "advisor.source.stats",
  "best-time heatmap": "advisor.source.heatmap",
  "recent posts": "advisor.source.posts",
  replies: "advisor.source.replies",
  "Voice (role-book)": "advisor.source.voice",
};

export function advisorSourceLabel(id: string, t: T): string {
  const key = SOURCE_KEY[id];
  return key ? t(key) : id;
}
