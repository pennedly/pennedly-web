// One-off: inject the account-dashboard `acc.*` i18n keys into all 8 locale
// files. en + ru are authored; the other 6 get the English value (fallback,
// present so the parity ratchet stays at 0 gaps) — a proper translation of the
// 6 is a follow-up. Idempotent-ish: refuses if `acc.account_word` already there.
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const MSG = join(HERE, "..", "src", "lib", "i18n", "messages");

// key: [en, ru]
const K = {
  "acc.account_word": ["Account", "Аккаунт"],
  "acc.nav_dashboard": ["Dashboard", "Дашборд"],
  "acc.nav_brands": ["Brands", "Бренды"],
  "acc.nav_advisor": ["Advisor", "Советник"],
  "acc.nav_settings": ["Account settings", "Настройки аккаунта"],
  "acc.crumb_account": ["Account", "Аккаунт"],
  "acc.sw_all": ["All profiles", "Все профили"],
  "acc.followers": ["Followers", "Подписчики"],
  "acc.views": ["Views", "Просмотры"],
  "acc.posts": ["Posts", "Посты"],
  "acc.posts_unit": ["wk", "нед"],
  "acc.replies": ["Reply", "Ответить"],
  "acc.replies_short": ["Replies", "Ответы"],
  "acc.stats": ["Stats", "Статистика"],
  "acc.sub_all": ["total", "всего"],
  "acc.sub_7d": ["7 days", "7 дней"],
  "acc.sub_week": ["this week", "за неделю"],
  "acc.sub_wait": ["awaiting reply", "ждут ответа"],
  "acc.synced": ["Updated recently", "Обновлено недавно"],
  "acc.synced_all": ["All synced", "Все синхронизированы"],
  "acc.sync_failed": ["Sync failed", "Сбой синка"],
  "acc.retry": ["Retry", "Повторить"],
  "acc.importing": ["Importing history", "Импортируем историю"],
  "acc.imp_posts": ["posts", "постов"],
  "acc.imp_comments": ["comments", "комментариев"],
  "acc.imp_eta": ["≈ a couple minutes", "≈ пара минут"],
  "acc.importing_n": ["importing", "импортируется"],
  "acc.error_n": ["with an error", "со сбоем"],
  "acc.sec_profiles": ["Profiles", "Профили"],
  "acc.sec_brands": ["Brands", "Бренды"],
  "acc.note_profile": ["Click a profile → Studio", "Клик по профилю → Студия"],
  "acc.note_brand": ["Click a brand → brand dashboard", "Клик по бренду → дашборд бренда"],
  "acc.add_brand_t": ["Add a brand", "Добавить бренд"],
  "acc.add_brand_s": ["A new voice and set of profiles", "Новый голос и набор профилей"],
  "acc.tasks_title": ["Needs you", "Требует тебя"],
  "acc.tasks_all": ["Open all", "Открыть всё"],
  "acc.task_sync": ["sync error", "сбой синка"],
  "acc.task_replies": ["to answer", "к ответу"],
  "acc.task_drafts": ["drafts", "черновиков"],
  "acc.task_audits": ["audit", "аудит"],
  "acc.adv_title": ["Account advisor", "Советник аккаунта"],
  "acc.adv_scope": ["across the whole portfolio", "по всему портфелю"],
  "acc.adv_open": ["Open chat", "Открыть чат"],
  "acc.adv_ask": ["Ask about your portfolio…", "Спросите совет по портфелю…"],
  "acc.adv_invite": [
    "Ask the advisor what to post, when, and which account needs attention — grounded in your portfolio's own stats.",
    "Спросите советника, что и когда постить и какому аккаунту нужно внимание — на основе статистики вашего портфеля.",
  ],
  // profile / brand plural forms (n → one/few/many); en uses one/other
  "acc.profiles_one": ["profile", "профиль"],
  "acc.profiles_few": ["profiles", "профиля"],
  "acc.profiles_many": ["profiles", "профилей"],
  "acc.brands_one": ["brand", "бренд"],
  "acc.brands_few": ["brands", "бренда"],
  "acc.brands_many": ["brands", "брендов"],
  // states
  "acc.error_title": ["Couldn't load your dashboard", "Не удалось загрузить дашборд"],
  "acc.error_sub": ["Something went wrong. Try again.", "Что-то пошло не так. Попробуйте ещё раз."],
};

const LOCALES = ["en", "ru", "de", "es", "fr", "it", "pt", "uk"];

function block(locale) {
  const idx = locale === "ru" ? 1 : 0; // ru authored; everything else uses en value
  return Object.entries(K)
    .map(([k, v]) => `  "${k}": ${JSON.stringify(v[idx])},`)
    .join("\n");
}

for (const loc of LOCALES) {
  const path = join(MSG, `${loc}.ts`);
  let src = readFileSync(path, "utf8");
  if (src.includes('"acc.account_word"')) {
    console.log(`skip ${loc} (already has acc.*)`);
    continue;
  }
  // en closes with `} as const;`, the other locales with a plain `};`.
  let marker = "} as const;";
  let at = src.lastIndexOf(marker);
  if (at < 0) {
    marker = "};";
    at = src.lastIndexOf(marker);
  }
  if (at < 0) throw new Error(`no marker in ${loc}.ts`);
  src = src.slice(0, at) + block(loc) + "\n" + src.slice(at);
  writeFileSync(path, src);
  console.log(`injected acc.* into ${loc}.ts (${Object.keys(K).length} keys)`);
}
