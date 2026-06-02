// Supported UI locales. Order = how they appear in the language picker.
// English first (default fallback), then Russian (founder's language),
// then the other 6 in rough Threads-popularity order.

// `name` is the language's own (native) name; `en` is its English name — both
// shown in the Settings picker (Q46). `flag` is the emoji glyph.
export const LOCALES = [
  { code: "en", name: "English", en: "English", flag: "🇬🇧" },
  { code: "ru", name: "Русский", en: "Russian", flag: "🇷🇺" },
  { code: "uk", name: "Українська", en: "Ukrainian", flag: "🇺🇦" },
  { code: "de", name: "Deutsch", en: "German", flag: "🇩🇪" },
  { code: "es", name: "Español", en: "Spanish", flag: "🇪🇸" },
  { code: "fr", name: "Français", en: "French", flag: "🇫🇷" },
  { code: "it", name: "Italiano", en: "Italian", flag: "🇮🇹" },
  { code: "pt", name: "Português", en: "Portuguese", flag: "🇵🇹" },
] as const;

export type LocaleCode = (typeof LOCALES)[number]["code"];

export const DEFAULT_LOCALE: LocaleCode = "en";
