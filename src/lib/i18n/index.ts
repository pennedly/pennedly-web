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

import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";

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
export { pluralUnit, pluralKey } from "./plurals";
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

/** Adopt the user's saved server-side locale (me.locale) when they have NOT
 *  made an explicit local choice yet. This makes a returning user's language
 *  preference follow them onto a fresh browser / the first-run onboarding,
 *  instead of falling back to the browser language. An explicit local pick
 *  (stored under STORAGE_KEY) always wins and is left untouched. */
export function adoptServerLocale(code: string | null | undefined): void {
  if (typeof window === "undefined" || !code) return;
  if (window.localStorage.getItem(STORAGE_KEY)) return; // explicit pick — respect it
  if (code !== current && LOCALES.some((l) => l.code === code)) {
    setLocale(code as LocaleCode);
  }
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

/** Keeps `<html lang>` in step with the active locale. Server-rendered markup
 *  always ships `lang="en"` (this dictionary switches client-side, no routing —
 *  see the file header), so without this a screen reader reads Russian copy
 *  with an English voice and crawlers only ever see `en`. Call once from a
 *  root-mounted client component (providers.tsx) rather than sprinkling this
 *  effect per page — it fires on mount (setting the real locale as soon as
 *  localStorage/navigator.language resolve) and again on every locale switch. */
export function useSyncHtmlLang(): void {
  const locale = useLocale();
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
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
  // Stable across renders (only changes when `locale` does) — an inline
  // `t: (key) => …` here was a fresh function every render, which silently
  // turned into infinite loops wherever a `useEffect`/`useMemo` depended on
  // `t` and set state with a fresh reference inside (e.g. `new Set()`, a
  // spread object): new `t` → effect refires → new state → re-render → new
  // `t` again. Confirmed on 2 independent screens (role-book, mentions
  // routine editor) before this fix.
  const t = useCallback((key: MessageKey): string => lookup(locale, key), [locale]);
  return useMemo(() => ({ locale, t }), [locale, t]);
}

/** Non-React lookup, useful in event handlers / toasts / API errors. */
export function tr(key: MessageKey): string {
  return lookup(current, key);
}

/** Lookup for a key assembled at RUNTIME from server data — today only
 *  `error.code.<code>` (see lib/errors.ts), where TypeScript cannot prove the
 *  key exists because the backend picked it. Returns null when `en` doesn't
 *  have it, so a code we haven't translated yet falls back to the caller's own
 *  copy instead of rendering `undefined`. */
export function trIfExists(key: string): string | null {
  return key in en ? lookup(current, key as MessageKey) : null;
}
