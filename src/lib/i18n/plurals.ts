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

type Unit =
  | "posts"
  | "replies"
  | "comments"
  | "days"
  | "drafts"
  | "audits"
  | "proposals"
  | "items"
  | "profiles"
  | "brands"
  | "changes";

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
  comments: {
    en: { one: "comment", other: "comments" },
    ru: { one: "комментарий", few: "комментария", many: "комментариев", other: "комментариев" },
    uk: { one: "коментар", few: "коментарі", many: "коментарів", other: "коментарів" },
    de: { one: "Kommentar", other: "Kommentare" },
    es: { one: "comentario", other: "comentarios" },
    fr: { one: "commentaire", other: "commentaires" },
    it: { one: "commento", other: "commenti" },
    pt: { one: "comentário", other: "comentários" },
  },
  days: {
    en: { one: "day", other: "days" },
    ru: { one: "день", few: "дня", many: "дней", other: "дней" },
    uk: { one: "день", few: "дні", many: "днів", other: "днів" },
    de: { one: "Tag", other: "Tage" },
    es: { one: "día", other: "días" },
    fr: { one: "jour", other: "jours" },
    it: { one: "giorno", other: "giorni" },
    pt: { one: "dia", other: "dias" },
  },
  drafts: {
    en: { one: "draft", other: "drafts" },
    ru: { one: "черновик", few: "черновика", many: "черновиков", other: "черновиков" },
    uk: { one: "чернетка", few: "чернетки", many: "чернеток", other: "чернеток" },
    de: { one: "Entwurf", other: "Entwürfe" },
    es: { one: "borrador", other: "borradores" },
    fr: { one: "brouillon", other: "brouillons" },
    it: { one: "bozza", other: "bozze" },
    pt: { one: "rascunho", other: "rascunhos" },
  },
  audits: {
    en: { one: "audit", other: "audits" },
    ru: { one: "аудит", few: "аудита", many: "аудитов", other: "аудитов" },
    uk: { one: "аудит", few: "аудити", many: "аудитів", other: "аудитів" },
    de: { one: "Audit", other: "Audits" },
    es: { one: "auditoría", other: "auditorías" },
    fr: { one: "audit", other: "audits" },
    it: { one: "audit", other: "audit" },
    pt: { one: "auditoria", other: "auditorias" },
  },
  proposals: {
    en: { one: "suggestion", other: "suggestions" },
    ru: { one: "предложение", few: "предложения", many: "предложений", other: "предложений" },
    uk: { one: "пропозиція", few: "пропозиції", many: "пропозицій", other: "пропозицій" },
    de: { one: "Vorschlag", other: "Vorschläge" },
    es: { one: "sugerencia", other: "sugerencias" },
    fr: { one: "suggestion", other: "suggestions" },
    it: { one: "suggerimento", other: "suggerimenti" },
    pt: { one: "sugestão", other: "sugestões" },
  },
  items: {
    en: { one: "item", other: "items" },
    ru: { one: "пункт", few: "пункта", many: "пунктов", other: "пунктов" },
    uk: { one: "пункт", few: "пункти", many: "пунктів", other: "пунктів" },
    de: { one: "Eintrag", other: "Einträge" },
    es: { one: "elemento", other: "elementos" },
    fr: { one: "élément", other: "éléments" },
    it: { one: "elemento", other: "elementi" },
    pt: { one: "item", other: "itens" },
  },
  profiles: {
    en: { one: "profile", other: "profiles" },
    ru: { one: "профиль", few: "профиля", many: "профилей", other: "профилей" },
    uk: { one: "профіль", few: "профілі", many: "профілів", other: "профілів" },
    de: { one: "Profil", other: "Profile" },
    es: { one: "perfil", other: "perfiles" },
    fr: { one: "profil", other: "profils" },
    it: { one: "profilo", other: "profili" },
    pt: { one: "perfil", other: "perfis" },
  },
  brands: {
    en: { one: "brand", other: "brands" },
    ru: { one: "бренд", few: "бренда", many: "брендов", other: "брендов" },
    uk: { one: "бренд", few: "бренди", many: "брендів", other: "брендів" },
    de: { one: "Marke", other: "Marken" },
    es: { one: "marca", other: "marcas" },
    fr: { one: "marque", other: "marques" },
    it: { one: "brand", other: "brand" },
    pt: { one: "marca", other: "marcas" },
  },
  changes: {
    en: { one: "change", other: "changes" },
    ru: { one: "изменение", few: "изменения", many: "изменений", other: "изменений" },
    uk: { one: "зміна", few: "зміни", many: "змін", other: "змін" },
    de: { one: "Änderung", other: "Änderungen" },
    es: { one: "cambio", other: "cambios" },
    fr: { one: "modification", other: "modifications" },
    it: { one: "modifica", other: "modifiche" },
    pt: { one: "alteração", other: "alterações" },
  },
};

/** The unit noun for `count`, inflected for `locale` — e.g. (ru, 4, "posts") → "поста". */
export function pluralUnit(locale: LocaleCode, unit: Unit, count: number): string {
  const forms = UNITS[unit][locale];
  const category = new Intl.PluralRules(locale).select(count);
  return forms[category as keyof PluralForms] ?? forms.other;
}
