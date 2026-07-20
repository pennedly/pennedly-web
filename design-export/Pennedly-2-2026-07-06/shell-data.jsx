// shell-data.jsx — shared app-shell content (§4). One canonical nav + the
// signed-in identity and connected Threads accounts behind the consolidated
// bottom-of-sidebar control. Used by every in-app screen's <window.Sidebar />.

// Canonical nav, grouped. `tester:true` = gated behind the tester flag in the
// real app (shown here; hidden for non-testers). `badge` = a live count.
const SHELL_NAV = [
  {
    cap: "Workspace",
    items: [
      { id: "studio",   label: "Studio",      Icon: window.IcStudio,  href: "Studio.html",   badge: 4 },
      { id: "feed",     label: "My Feed",     Icon: window.IcFeed,    href: "Feed.html" },
      { id: "replies",  label: "Replies",     Icon: window.IcReplies, href: "Replies.html",  badge: 3, tester: true },
      { id: "mentions", label: "Mentions",    Icon: window.IcAt,      href: "Mentions.html", tester: true },
    ],
  },
  {
    cap: "Insight",
    items: [
      { id: "stats",    label: "Stats",            Icon: window.IcChart,   href: "Stats.html" },
      { id: "advisor",  label: "Advisor",          Icon: window.IcAdvisor, href: "Advisor.html", tester: true },
      { id: "audits",   label: "Audits",           Icon: window.IcAudit,   href: "Audits.html", badge: 1 },
      { id: "patterns", label: "Pattern study",    Icon: window.IcStudy,   href: "Patterns.html" },
      { id: "explore",  label: "Explore patterns", Icon: window.IcCompass, href: "Explore.html" },
    ],
  },
  {
    cap: "Voice & automation",
    items: [
      { id: "voice",      label: "Voice",      Icon: window.IcVoice,  href: "Voice.html" },
      { id: "stylerules", label: "Style rules", Icon: window.IcPencil, href: "Style Rules.html" },
      { id: "scenarios", label: "Scenarios",   Icon: window.IcRepeat, href: "Scenarios.html", tester: true },
      { id: "autopilot",  label: "Autopilot",  Icon: window.IcBolt,   href: "Autopilot.html", tester: true },
    ],
  },
];

// The connected Threads accounts the bottom control switches between. `avatar`
// is a real profile photo; `initials` is the monogram fallback (§3.4).
const SHELL_ACCOUNTS = [
  { id: "mara",   name: "Mara Lin",   handle: "@mara.lin",    initials: "ML", avatar: "assets/avatars/mara.png",       active: true },
  { id: "field",  name: "Field Notes", handle: "@field.notes", initials: "FN", avatar: "assets/avatars/fieldnotes.png" },
  { id: "studio", name: "Studio Mara", handle: "@studio.mara", initials: "SM", avatar: "assets/avatars/studio.png" },
  { id: "late",   name: "Late Drafts", handle: "@late.drafts", initials: "LD" },
];

// The signed-in Pennedly user (separate identity from the Threads accounts).
const SHELL_USER = { email: "mara@pennedly.com", plan: "Creator plan" };

// The 8 UI locales the app ships in (app-wide). English is the source language;
// the other 7 are translate targets shown in each card's globe / translate menu.
const UI_LANGS = [
  { code: "en", label: "English",    native: "English",    original: true },
  { code: "es", label: "Spanish",    native: "Español" },
  { code: "de", label: "German",     native: "Deutsch" },
  { code: "fr", label: "French",     native: "Français" },
  { code: "it", label: "Italian",    native: "Italiano" },
  { code: "pt", label: "Portuguese", native: "Português" },
  { code: "ru", label: "Russian",    native: "Русский" },
  { code: "uk", label: "Ukrainian",  native: "Українська" },
];

Object.assign(window, { SHELL_NAV, SHELL_ACCOUNTS, SHELL_USER, UI_LANGS });
