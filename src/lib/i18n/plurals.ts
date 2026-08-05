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
  | "changes"
  | "published_posts"
  | "characters"
  | "accounts"
  | "followers"
  | "sources"
  | "times";

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
  // `proposals` deliberately mirrors "proposal(s)" — the word `audit.prop.count`
  // actually renders — not "suggestion(s)"; the advisor's own suggestion copy
  // (`adv.*`) is a separate, unrelated string family and doesn't use this unit.
  proposals: {
    en: { one: "proposal", other: "proposals" },
    ru: { one: "предложение", few: "предложения", many: "предложений", other: "предложений" },
    uk: { one: "пропозиція", few: "пропозиції", many: "пропозицій", other: "пропозицій" },
    de: { one: "Vorschlag", other: "Vorschläge" },
    es: { one: "propuesta", other: "propuestas" },
    fr: { one: "proposition", other: "propositions" },
    it: { one: "proposta", other: "proposte" },
    pt: { one: "proposta", other: "propostas" },
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
  // The feed's own counter ("12 published posts") — the adjective inflects with
  // the noun in Slavic locales, so it travels as one unit, not `posts` + a word.
  published_posts: {
    en: { one: "published post", other: "published posts" },
    ru: { one: "опубликованный пост", few: "опубликованных поста", many: "опубликованных постов", other: "опубликованных постов" },
    uk: { one: "опублікований пост", few: "опубліковані пости", many: "опублікованих постів", other: "опублікованих постів" },
    de: { one: "veröffentlichter Beitrag", other: "veröffentlichte Beiträge" },
    es: { one: "publicación publicada", other: "publicaciones publicadas" },
    fr: { one: "post publié", other: "posts publiés" },
    it: { one: "post pubblicato", other: "post pubblicati" },
    pt: { one: "post publicado", other: "posts publicados" },
  },
  characters: {
    en: { one: "character", other: "characters" },
    ru: { one: "символ", few: "символа", many: "символов", other: "символов" },
    uk: { one: "символ", few: "символи", many: "символів", other: "символів" },
    de: { one: "Zeichen", other: "Zeichen" },
    es: { one: "carácter", other: "caracteres" },
    fr: { one: "caractère", other: "caractères" },
    it: { one: "carattere", other: "caratteri" },
    pt: { one: "caractere", other: "caracteres" },
  },
  accounts: {
    en: { one: "account", other: "accounts" },
    ru: { one: "аккаунт", few: "аккаунта", many: "аккаунтов", other: "аккаунтов" },
    uk: { one: "акаунт", few: "акаунти", many: "акаунтів", other: "акаунтів" },
    de: { one: "Konto", other: "Konten" },
    es: { one: "cuenta", other: "cuentas" },
    fr: { one: "compte", other: "comptes" },
    it: { one: "account", other: "account" },
    pt: { one: "conta", other: "contas" },
  },
  followers: {
    en: { one: "follower", other: "followers" },
    ru: { one: "подписчик", few: "подписчика", many: "подписчиков", other: "подписчиков" },
    uk: { one: "підписник", few: "підписники", many: "підписників", other: "підписників" },
    de: { one: "Follower", other: "Follower" },
    es: { one: "seguidor", other: "seguidores" },
    fr: { one: "abonné", other: "abonnés" },
    it: { one: "follower", other: "follower" },
    pt: { one: "seguidor", other: "seguidores" },
  },
  sources: {
    en: { one: "source", other: "sources" },
    ru: { one: "источник", few: "источника", many: "источников", other: "источников" },
    uk: { one: "джерело", few: "джерела", many: "джерел", other: "джерел" },
    de: { one: "Quelle", other: "Quellen" },
    es: { one: "fuente", other: "fuentes" },
    fr: { one: "source", other: "sources" },
    it: { one: "fonte", other: "fonti" },
    pt: { one: "fonte", other: "fontes" },
  },
  times: {
    en: { one: "time", other: "times" },
    ru: { one: "раз", few: "раза", many: "раз", other: "раз" },
    uk: { one: "раз", few: "рази", many: "разів", other: "разів" },
    de: { one: "Mal", other: "Mal" },
    es: { one: "vez", other: "veces" },
    fr: { one: "fois", other: "fois" },
    it: { one: "volta", other: "volte" },
    pt: { one: "vez", other: "vezes" },
  },
};

/** The unit noun for `count`, inflected for `locale` — e.g. (ru, 4, "posts") → "поста". */
export function pluralUnit(locale: LocaleCode, unit: Unit, count: number): string {
  const forms = UNITS[unit][locale];
  const category = new Intl.PluralRules(locale).select(count);
  return forms[category as keyof PluralForms] ?? forms.other;
}

/** Catalog-key picker for whole sentences that inflect ("{n} tips hidden").
 *
 *  The old idiom here was `n === 1 ? key_one : key_many`, which is right for
 *  English and wrong for ru/uk, where 2–4 takes its own form ("2 совета", not
 *  "2 советов"). This picks by the real CLDR category instead, falling back to
 *  `many` when a locale has no `few` (every non-Slavic one). Use `pluralUnit`
 *  when only a noun inflects; use this when the verb or adjective moves too. */
export function pluralKey<K extends string>(
  locale: LocaleCode,
  count: number,
  forms: { one: K; few?: K; many: K },
): K {
  const category = new Intl.PluralRules(locale).select(count);
  if (category === "one") return forms.one;
  if (category === "few") return forms.few ?? forms.many;
  return forms.many;
}
