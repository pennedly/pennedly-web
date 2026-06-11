"use client";

// Count-inflected unit nouns ("3 posts", "1 пост", "4 поста", "5 постов").
//
// Why a dedicated module and not catalog keys: the dictionary convention
// elsewhere (`draft_one` / `draft_few`, picked by `n === 1`) is two-form —
// fine for English, but WRONG for Slavic locales, where 2–4 takes a distinct
// "few" form ("4 поста", not "4 постов"). Here we pick the real CLDR plural
// category via `Intl.PluralRules` so every locale inflects correctly.

import type { LocaleCode } from "./locales";

type PluralForms = {
  one?: string;
  few?: string;
  many?: string;
  other: string; // always defined — the fallback for any category
};

type Unit = "posts" | "replies";

// `other` mirrors the plain plural already in the message catalogs; `one`
// (and `few`/`many` for ru/uk) are the additions that make counts grammatical.
const UNITS: Record<Unit, Record<LocaleCode, PluralForms>> = {
  posts: {
    en: { one: "post", other: "posts" },
    ru: { one: "пост", few: "поста", many: "постов", other: "постов" },
    uk: { one: "пост", few: "пости", many: "постів", other: "постів" },
    de: { one: "Beitrag", other: "Beiträge" },
    es: { one: "publicación", other: "publicaciones" },
    fr: { one: "post", other: "posts" },
    it: { one: "post", other: "post" },
    pt: { one: "post", other: "posts" },
  },
  replies: {
    en: { one: "auto-reply", other: "auto-replies" },
    ru: { one: "ответ", few: "ответа", many: "ответов", other: "ответов" },
    uk: { one: "відповідь", few: "відповіді", many: "відповідей", other: "відповідей" },
    de: { one: "Antwort", other: "Antworten" },
    es: { one: "respuesta", other: "respuestas" },
    fr: { one: "réponse", other: "réponses" },
    it: { one: "risposta", other: "risposte" },
    pt: { one: "resposta", other: "respostas" },
  },
};

/** The unit noun for `count`, inflected for `locale` — e.g. (ru, 4, "posts") → "поста". */
export function pluralUnit(locale: LocaleCode, unit: Unit, count: number): string {
  const forms = UNITS[unit][locale];
  const category = new Intl.PluralRules(locale).select(count);
  return forms[category as keyof PluralForms] ?? forms.other;
}
