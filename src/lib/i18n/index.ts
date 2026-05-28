"use client";

// Pennedly i18n — dictionary-based, no routing tax.
//
// Why dictionary not next-intl + per-locale routes:
//   • Routing-based i18n means /ru/app/dashboard URLs, which churns
//     every Link + every test fixture. Not worth it for a tool where
//     users link-share rarely (the URL is per-user-session, not for
//     SEO).
//   • Dictionary lookup + localStorage means switching locale is a
//     state change, no navigation, no flicker.
//
// Lookup contract: t(key) returns the locale's string, or falls back
// to en if missing. Both stubs and partial translations work fine —
// you can ship a feature in en first and translate to others later
// at any pace.

import { useSyncExternalStore } from "react";

import { en, type MessageKey } from "./messages/en";
import { ru } from "./messages/ru";
import { uk } from "./messages/uk";
import { de } from "./messages/de";
import { es } from "./messages/es";
import { fr } from "./messages/fr";
import { it } from "./messages/it";
import { pt } from "./messages/pt";
import { DEFAULT_LOCALE, LOCALES, type LocaleCode } from "./locales";

export { LOCALES, DEFAULT_LOCALE, type LocaleCode } from "./locales";
export type { MessageKey } from "./messages/en";

const STORAGE_KEY = "pennedly.locale";

// Strict map. Adding a new locale = add it to LOCALES + drop a file
// in messages/ + plug into this object — TypeScript will yell if
// any of those three drift.
const CATALOGS: Record<LocaleCode, Partial<Record<MessageKey, string>>> = {
  en,
  ru,
  uk,
  de,
  es,
  fr,
  it,
  pt,
};

// Reactive store ── ─────────────────────────────────────────────

const listeners = new Set<() => void>();

function detectBrowserLocale(): LocaleCode {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  // navigator.language is "en-US" / "ru" / "pt-BR". We only match on
  // the prefix so "en-GB" → en, "pt-BR" → pt.
  const raw = (navigator.language || "").toLowerCase();
  const prefix = raw.split("-")[0];
  const match = LOCALES.find((l) => l.code === prefix);
  return (match?.code as LocaleCode) ?? DEFAULT_LOCALE;
}

function readFromStorage(): LocaleCode {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw && LOCALES.some((l) => l.code === raw)) {
    return raw as LocaleCode;
  }
  return detectBrowserLocale();
}

let current: LocaleCode = readFromStorage();

function emit() {
  for (const fn of listeners) fn();
}

export function getLocale(): LocaleCode {
  return current;
}

export function setLocale(code: LocaleCode): void {
  current = code;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, code);
  }
  emit();
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

// SSR fallback — always render English on the server so the markup
// matches what `current` will resolve to before hydration.
function getServerSnapshot(): LocaleCode {
  return DEFAULT_LOCALE;
}

export function useLocale(): LocaleCode {
  return useSyncExternalStore(subscribe, () => current, getServerSnapshot);
}

// Translation ── ────────────────────────────────────────────────

function lookup(locale: LocaleCode, key: MessageKey): string {
  const catalog = CATALOGS[locale];
  if (catalog && key in catalog) {
    const value = catalog[key];
    if (value !== undefined) return value;
  }
  // Fallback to English. en is exhaustive by type, so this never returns
  // undefined at runtime.
  return en[key];
}

/** React hook — re-renders when the locale changes. */
export function useTranslation() {
  const locale = useLocale();
  return {
    locale,
    t: (key: MessageKey): string => lookup(locale, key),
  };
}

/** Non-React lookup, useful in event handlers / toasts / API errors. */
export function tr(key: MessageKey): string {
  return lookup(current, key);
}
