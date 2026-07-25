// landing-data.jsx — copy + seed content for the public landing page (/).
// Calm, non-hypey. No lorem. Positioning held: Pennedly is a drafting partner
// where the user approves every word; autopilot is opt-in only.
//
// LOCALIZE: every string in LAND, LAND_FEATURES[].title/desc, LAND_FOOTER[].label
// and LAND_LANGS[].label is end-user chrome → wire to an i18n key (8 locales, EN
// baseline). LAND_SAMPLE.text / LAND_ACCOUNTS are ILLUSTRATIVE sample content,
// not localized chrome.

const LAND = {
  status: "In development · invite-only beta",
  headline: "Run Threads like a pro, in your own voice.",
  lead: "Pennedly drafts posts and replies in your voice, audits what's working, and shows you what's landing across every account you run.",
  approve: "You approve every word.",
  autopilot: "Autopilot's there when you want it.",
  signIn: "Sign in",
  contactEmail: "hello@pennedly.com",
  // feature section heading
  featEyebrow: "The product",
  featTitle: "One workspace for every account you run.",
  // window peek chrome (illustrative)
  winUrl: "app.pennedly.com",
  winPath: "/studio",
  draftLabel: "Draft",
  voiceTag: "In your voice",
  toneTag: "Warm, direct",
  composeNote: "Drafting in Mara's voice",
  edit: "Edit",
  approveBtn: "Approve",
};

// six capabilities. `ico` resolves to an icon in landing-parts. `span` drives the
// bento layout: "wide" = 2 cols, "full" = full-width banner, default = 1 col.
const LAND_FEATURES = [
  { ico: "voice",     span: "wide", title: "Viral posts in your voice", desc: "Drafts that study how you write, so they sound like you and never like a template." },
  { ico: "replies",   span: "",     title: "Replies that sound like you", desc: "Keep up with mentions and comments in your own tone, without living in the app." },
  { ico: "audits",    span: "",     title: "Weekly audits and a coach", desc: "A standing read on what's working, with specific, kind notes on what to try next." },
  { ico: "analytics", span: "",     title: "Analytics, not noise", desc: "Quiet numbers that show which posts earned their place. No vanity dashboards." },
  { ico: "autopilot", span: "",     title: "Autopilot, your call", desc: "Let Pennedly post on a schedule only when you opt in. Off by default, always." },
  { ico: "accounts",  span: "full", title: "Every account, one place", desc: "Switch between the handles you run without losing your thread or your tone." },
];

// hero draft specimen (Mara Lin's voice) — ILLUSTRATIVE, not a live feed.
const LAND_SAMPLE = {
  name: "Mara Lin", handle: "@mara.lin", initials: "ML", avatar: "assets/avatars/mara.png",
  text: "The fastest way to find your voice online: publish the thing you're slightly embarrassed by. The polished version is everyone's. The embarrassing one is yours.",
};

// accounts shown in the window rail — illustrative. First is the active one.
const LAND_ACCOUNTS = [
  { initials: "ML", avatar: "assets/avatars/mara.png" },
  { initials: "TP", avatar: "assets/avatars/c-theo.png" },
  { initials: "AR", avatar: "assets/avatars/c-ana.png" },
  { initials: "LM", avatar: "assets/avatars/c-lucia.png" },
];

const LAND_FOOTER = [
  { label: "Privacy Policy", href: "#privacy" },
  { label: "Terms of Service", href: "#terms" },
  { label: "Data Deletion", href: "#data-deletion" },
];

// 8 locales the page localizes into (EN baseline). The switcher shows the label;
// `code` is the short tag in the trigger + option rows.
const LAND_LANGS = [
  { code: "EN", label: "English" },
  { code: "ES", label: "Español" },
  { code: "DE", label: "Deutsch" },
  { code: "FR", label: "Français" },
  { code: "IT", label: "Italiano" },
  { code: "PT", label: "Português" },
  { code: "NL", label: "Nederlands" },
  { code: "JA", label: "日本語" },
];

Object.assign(window, { LAND, LAND_FEATURES, LAND_SAMPLE, LAND_ACCOUNTS, LAND_FOOTER, LAND_LANGS });
