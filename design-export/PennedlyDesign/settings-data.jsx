// settings-data.jsx — seed content for the Settings screen (/app/settings).
// One creator's account (Mara Lin). Realistic handles + plan — no lorem.

const ST_USER = {
  name: "Mara Lin",
  handle: "@mara.lin",
  initials: "ML",
  email: "mara@maralin.co",
  plan: "Creator",
  planNote: "Billed yearly \u00b7 renews Mar 2027",
};

// 8 interface languages. `code` is the 2-letter tile, `name` the native label,
// `region` the English name (used as the muted sub-label).
const LANGUAGES = [
  { code: "EN", name: "English",    region: "English" },
  { code: "DE", name: "Deutsch",    region: "German" },
  { code: "ES", name: "Espa\u00f1ol",    region: "Spanish" },
  { code: "FR", name: "Fran\u00e7ais",   region: "French" },
  { code: "PT", name: "Portugu\u00eas",  region: "Portuguese" },
  { code: "IT", name: "Italiano",   region: "Italian" },
  { code: "RU", name: "\u0420\u0443\u0441\u0441\u043a\u0438\u0439",    region: "Russian" },
  { code: "JA", name: "\u65e5\u672c\u8a9e",      region: "Japanese" },
];

// Connected Threads accounts. The first is primary. "Several" vs "one" is a tweak.
const CONNECTED_ACCOUNTS = [
  { id: "a1", name: "Mara Lin",    handle: "@mara.lin",    initials: "ML", primary: true,  followers: "18.2k" },
  { id: "a2", name: "Mara builds", handle: "@mara.builds", initials: "MB", primary: false, followers: "4.1k" },
  { id: "a3", name: "Lin Studio",  handle: "@lin.studio",  initials: "LS", primary: false, followers: "960" },
];

Object.assign(window, { ST_USER, LANGUAGES, CONNECTED_ACCOUNTS });
