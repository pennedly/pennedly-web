// Style rules demo dataset — powers the tester ?demo=1 review with no auth or
// backend. Uses the REAL backend rule catalog (14 keys, localized titles via the
// page's RULE_I18N) rather than the design's sample 12, so the demo matches what
// users actually see. Shaped exactly like StyleRule / UserRule so the live
// render path is reused verbatim.

import type { StyleRule, UserRule } from "@/lib/types";

// NOT `as const` — tweak values must widen to {boolean, string}.
export const SR_TWEAK_DEFAULTS = {
  dark: false,
  yourRules: "Some",
  screen: "Default",
  density: "Comfortable",
};

// title/body left blank: the screen renders display copy from RULE_I18N keyed by
// `key`, falling back to these only for an unknown key.
function r(key: string, category: StyleRule["category"], kind: StyleRule["kind"], enabled: boolean): StyleRule {
  return { key, category, kind, title: "", body: "", enabled };
}

export const DEMO_BUILTIN: StyleRule[] = [
  r("human_punctuation", "punctuation", "both", true), // the stripper
  r("no_capital_after_colon", "punctuation", "both", false),
  r("no_ai_buzzwords", "diction", "both", true),
  r("no_elegant_variation", "diction", "both", true),
  r("be_concrete", "diction", "both", true),
  r("no_antithesis", "structure", "both", true),
  r("no_baity_opener", "structure", "both", true),
  r("no_summary_closer", "structure", "both", true),
  r("no_significance_formula", "structure", "both", true),
  r("no_rule_of_three", "cadence", "both", true),
  r("vary_rhythm", "cadence", "both", true),
  r("no_engagement_question", "tone", "post", true), // posts-only chip
  r("no_hedging", "tone", "both", false),
  r("plain_formatting", "formatting", "post", true), // posts-only chip
];

export const DEMO_FREEFORM: UserRule[] = [
  { id: 1, kind: "reply", body: 'Never open a reply with "Great question!" or "Love this."', enabled: true, sort_order: 0 },
  { id: 2, kind: "reply", body: "Keep replies to two sentences unless someone clearly wants more.", enabled: true, sort_order: 1 },
  { id: 3, kind: "reply", body: "Quote a specific detail from the post I'm replying to, never a generic platitude.", enabled: true, sort_order: 2 },
  { id: 4, kind: "post", body: "Open a post on a concrete moment from my week, not a definition.", enabled: true, sort_order: 3 },
];
