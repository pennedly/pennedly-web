// settings-data.jsx — seed content for the Settings screen (/app/settings).
// The signed-in identity, connected Threads accounts, and language flags all
// come from the shared shell (shell-data.jsx) so this screen stays in sync with
// the sidebar account switcher. This file only adds the bits unique to Settings.

// Flag glyph per UI locale (keys match window.UI_LANGS codes). English uses GB.
const LANG_FLAGS = {
  en: "\uD83C\uDDEC\uD83C\uDDE7", // 🇬🇧
  es: "\uD83C\uDDEA\uD83C\uDDF8", // 🇪🇸
  de: "\uD83C\uDDE9\uD83C\uDDEA", // 🇩🇪
  fr: "\uD83C\uDDEB\uD83C\uDDF7", // 🇫🇷
  it: "\uD83C\uDDEE\uD83C\uDDF9", // 🇮🇹
  pt: "\uD83C\uDDF5\uD83C\uDDF9", // 🇵🇹
  ru: "\uD83C\uDDF7\uD83C\uDDFA", // 🇷🇺
  uk: "\uD83C\uDDFA\uD83C\uDDE6", // 🇺🇦
};

// Extra Threads accounts the user can connect (no avatar → initials fallback).
const CONNECTABLE = [
  { id: "reads",  name: "Mara Reads", handle: "@mara.reads", initials: "MR" },
  { id: "garden", name: "Slow Garden", handle: "@slow.garden", initials: "SG" },
];

// The signed-in user shown on the account card. Email + plan come from the shared
// SHELL_USER; avatar + display name reuse the primary connected account.
const PLAN_NOTE = "Billed yearly";

Object.assign(window, { LANG_FLAGS, CONNECTABLE, PLAN_NOTE });
