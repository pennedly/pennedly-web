// Demo fixtures for the account dashboard gallery — mirrors the CD эталон
// sample data (account-data.js). No auth / no backend; drives /gallery/account
// so every mode + state is reviewable against the spec.

import { ru } from "@/lib/i18n/messages/ru";
import type { AccountProfile, Me, MeAccountResponse } from "@/lib/types";
import type { AdvisorData, T } from "./AccountDashboard";

function prof(over: Partial<AccountProfile> & { id: number }): AccountProfile {
  return {
    tenant_id: 1,
    brand_id: 1,
    network: "threads",
    handle: null,
    name: over.name ?? over.handle ?? null,
    avatar: null,
    followers: 0,
    followers_delta: 0,
    views_7d: 0,
    posts_week: 0,
    replies_to_answer: 0,
    pending_drafts: 0,
    pending_audits: 0,
    sync_status: "synced",
    synced_at: null,
    sync_summary: null,
    sync_started_at: null,
    disconnected: false,
    disconnected_at: null,
    ...over,
  };
}

const MARA = prof({ id: 1, handle: "@mara.lin", name: "Mara Lin", followers: 12438, followers_delta: 438, views_7d: 70000, posts_week: 5, replies_to_answer: 0 });
const NOTES = prof({ id: 2, handle: "@daily.notes", name: "Daily Notes", followers: 3120, followers_delta: -60, views_7d: 18400, posts_week: 3, replies_to_answer: 7 });
const STUDIO = prof({ id: 3, handle: "@studio.co", name: "Studio Co", followers: 8760, followers_delta: 210, views_7d: 41200, posts_week: 4, replies_to_answer: 2 });
const CO = prof({ id: 4, handle: "@co.works", name: "Co Works", followers: 540, followers_delta: 30, views_7d: 2600, posts_week: 2, replies_to_answer: 0 });
const IMPORTING = prof({ id: 5, handle: "@fresh.acc", name: "Fresh", sync_status: "importing", followers: null, sync_summary: { posts: 82, new_comments: 140, history_posts: 180 } });
const ERRORED = prof({ id: 6, handle: "@stuck.sync", name: "Stuck", sync_status: "error", followers: 1200, followers_delta: null });

function brand(id: number, name: string, profiles: AccountProfile[]) {
  const synced = profiles.filter((p) => p.sync_status === "synced");
  const stats = {
    followers: synced.reduce((a, p) => a + (p.followers ?? 0), 0),
    followers_delta: synced.reduce((a, p) => a + (p.followers_delta ?? 0), 0),
    views_7d: synced.reduce((a, p) => a + p.views_7d, 0),
    posts_week: synced.reduce((a, p) => a + p.posts_week, 0),
    replies_to_answer: synced.reduce((a, p) => a + p.replies_to_answer, 0),
    accounts_count: profiles.length,
    importing_count: profiles.filter((p) => p.sync_status === "importing").length,
  };
  const networks = [...new Set(profiles.map((p) => p.network))];
  return { id, name, networks, stats, profiles: profiles.map((p) => ({ ...p, brand_id: id })) };
}

function totals(profiles: AccountProfile[]): MeAccountResponse["totals"] {
  const synced = profiles.filter((p) => p.sync_status === "synced");
  return {
    followers: synced.reduce((a, p) => a + (p.followers ?? 0), 0),
    followers_delta: synced.reduce((a, p) => a + (p.followers_delta ?? 0), 0),
    views_7d: synced.reduce((a, p) => a + p.views_7d, 0),
    posts_week: synced.reduce((a, p) => a + p.posts_week, 0),
    replies_to_answer: synced.reduce((a, p) => a + p.replies_to_answer, 0),
    accounts_count: profiles.length,
    importing_count: profiles.filter((p) => p.sync_status === "importing").length,
  };
}

const TENANT = { id: 1, name: "Alex Rivera", slug: null, plan_tier: "PRO", accounts_limit: 50 };

// The signed-in user (for the account settings gallery — identity card + locale).
export const DEMO_ME: Me = {
  user_id: 1,
  email: "alex@pennedly.com",
  display_name: "Alex Rivera",
  tenant: TENANT,
  is_tester: true,
  locale: "ru",
  avatar_url: null,
};

function tasks(profiles: AccountProfile[]) {
  return {
    pending_drafts: profiles.reduce((a, p) => a + p.pending_drafts, 0),
    replies_attention: profiles.reduce((a, p) => a + p.replies_to_answer, 0),
    sync_errors: profiles.filter((p) => p.sync_status === "error").length,
    pending_audits: profiles.reduce((a, p) => a + p.pending_audits, 0),
  };
}

// ── one profile (new user) ──
const ONE = [prof({ ...MARA, pending_drafts: 1 })];
export const DEMO_ONE_PROFILE: MeAccountResponse = {
  tenant: TENANT,
  brands: [brand(1, "Mara Lin", ONE)],
  totals: totals(ONE),
  tasks: tasks(ONE),
  scope: { brands_count: 1, profiles_count: 1, disconnected_count: 0, show_brand_level: false },
};

// ── single brand · many profiles ──
const SINGLE = [
  { ...MARA },
  { ...NOTES, pending_drafts: 2 },
  { ...STUDIO },
  { ...CO },
  { ...IMPORTING },
];
export const DEMO_SINGLE_BRAND: MeAccountResponse = {
  tenant: TENANT,
  brands: [brand(1, "Studio", SINGLE)],
  totals: totals(SINGLE),
  tasks: { ...tasks(SINGLE), sync_errors: 0 },
  scope: { brands_count: 1, profiles_count: SINGLE.length, disconnected_count: 0, show_brand_level: false },
};

// ── 2+ brands ──
const B1 = [{ ...MARA }, { ...NOTES }, { ...STUDIO }];
const B2 = [{ ...CO }, { ...ERRORED }];
const B3 = [prof({ id: 7, handle: "@northwind", name: "Northwind", network: "linkedin", followers: 4300, followers_delta: 120, views_7d: 9800, posts_week: 2 })];
const MULTI = [...B1, ...B2, ...B3];
export const DEMO_MULTI_BRAND: MeAccountResponse = {
  tenant: TENANT,
  brands: [brand(1, "Studio", B1), brand(2, "Co Works", B2), brand(3, "Northwind", B3)],
  totals: totals(MULTI),
  tasks: { ...tasks(MULTI), pending_drafts: 3, pending_audits: 1 },
  scope: { brands_count: 3, profiles_count: MULTI.length, disconnected_count: 0, show_brand_level: true },
};

// ── durable-dashboard empty states (disconnected / reconnect) ──
const nowMinus = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();
const DISC1 = prof({ id: 11, handle: "@mara.lin", name: "Mara Lin", disconnected: true, disconnected_at: nowMinus(2), sync_status: "disconnected" });
const DISC2 = prof({ id: 12, handle: "@field.notes", name: "Field Notes", disconnected: true, disconnected_at: nowMinus(5), sync_status: "disconnected" });
const DISC3 = prof({ id: 13, handle: "@mara.co", name: "Mara Co", disconnected: true, disconnected_at: nowMinus(21), sync_status: "disconnected" });

// every profile disconnected → the in-dashboard reconnect state (0 live)
const ALL_DISC = [DISC1, DISC2, DISC3];
export const DEMO_ALL_DISCONNECTED: MeAccountResponse = {
  tenant: TENANT,
  brands: [brand(1, "Studio Mara", ALL_DISC)],
  totals: totals([]),
  tasks: tasks([]),
  scope: { brands_count: 1, profiles_count: 0, disconnected_count: 3, show_brand_level: false },
};

// multi-brand WITH a disconnected profile — verifies the disconnected paths that
// only exist in 2+ brand mode (BrandProfileRow reconnect row on expand, BrandCard
// "N disconnected" status, switcher live-only count). No such fixture existed
// before, which is exactly why the multi-brand disconnected regressions shipped
// unverified.
const MBD_DISC = prof({ id: 15, handle: "@studio.old", name: "Studio Old", disconnected: true, disconnected_at: nowMinus(9), sync_status: "disconnected" });
const MBD_B1 = [{ ...MARA }, { ...NOTES }, MBD_DISC];
const MBD_B2 = [{ ...CO }, { ...ERRORED }];
const MBD_B3 = [prof({ id: 16, handle: "@northwind", name: "Northwind", network: "linkedin", followers: 4300, followers_delta: 120, views_7d: 9800, posts_week: 2 })];
const MBD_ALL = [...MBD_B1, ...MBD_B2, ...MBD_B3];
const MBD_LIVE = MBD_ALL.filter((p) => !p.disconnected);
export const DEMO_MULTI_BRAND_DISC: MeAccountResponse = {
  tenant: TENANT,
  brands: [brand(1, "Studio", MBD_B1), brand(2, "Co Works", MBD_B2), brand(3, "Northwind", MBD_B3)],
  totals: totals(MBD_ALL),
  tasks: { ...tasks(MBD_ALL), pending_drafts: 2 },
  scope: { brands_count: 3, profiles_count: MBD_LIVE.length, disconnected_count: 1, show_brand_level: true },
};

// mixed: live + disconnected side by side in one grid
const D_STUDIO = prof({ id: 14, handle: "@mara.studio", name: "Studio Mara", disconnected: true, disconnected_at: nowMinus(1), sync_status: "disconnected" });
const MIX = [{ ...MARA }, { ...NOTES, pending_drafts: 2 }, D_STUDIO, { ...CO }];
export const DEMO_MIXED: MeAccountResponse = {
  tenant: TENANT,
  brands: [brand(1, "Studio", MIX)],
  totals: totals(MIX),
  tasks: tasks(MIX),
  scope: { brands_count: 1, profiles_count: 3, disconnected_count: 1, show_brand_level: false },
};

// ── advisor sample (account scope) ──
export const DEMO_ADVISOR: AdvisorData = {
  verdict: "Портфель растёт ровно: +738 подписчиков за неделю, но два аккаунта тянут вниз медиану ответов.",
  detail:
    "Studio и Northwind дают 80% просмотров. У @daily.notes 7 комментариев без ответа третий день — это гасит охват. Утренние посты стабильно обгоняют вечерние по всему портфелю.",
  chips: [
    { tone: "up", icon: "up", text: "+738 подписчиков / 7д" },
    { tone: "accent", icon: "eye", text: "142к просмотров" },
    { tone: "down", icon: "down", text: "1 аккаунт без ответов" },
  ],
  grounded: "Статистика 6 профилей · голос · топ-посты за 14 дней",
  recos: [
    { tone: "danger", icon: "reply", t: "Разберите очередь @daily.notes", s: "7 комментариев ждут третий день" },
    { tone: "accent", icon: "nib", t: "Сдвиньте вечерние посты на утро", s: "утро даёт +34% охвата по портфелю" },
    { icon: "audit", t: "Примените аудит роста Studio", s: "3 предложения ждут одобрения" },
  ],
};

// ── demo translator (RU strings mirroring the эталон copy) ──
const RU: Record<string, string> = {
  "acc.account_word": "Аккаунт",
  "acc.nav_dashboard": "Дашборд",
  "acc.nav_brands": "Бренды",
  "acc.nav_advisor": "Агент",
  "acc.nav_settings": "Настройки аккаунта",
  "acc.crumb_account": "Аккаунт",
  "acc.sw_all": "Все профили",
  "acc.sw_jump": "Перейти к профилю",
  "acc.sw_connect": "Подключить профиль",
  "acc.expand": "Профили",
  "settings.logout": "Выйти",
  "acc.profiles_word": "профилей",
  "acc.brands_word": "брендах",
  "acc.followers": "Подписчики",
  "acc.views": "Просмотры",
  "acc.posts": "Посты",
  "acc.posts_unit": "нед",
  "acc.replies": "Ответы",
  "acc.stats": "Статистика",
  "acc.sub_all": "всего",
  "acc.sub_7d": "7 дней",
  "acc.sub_week": "за неделю",
  "acc.sub_wait": "ждут ответа",
  "acc.synced": "Обновлено недавно",
  "acc.synced_all": "Все синхронизированы",
  "acc.sync_failed": "Сбой синка",
  "acc.retry": "Повторить",
  "acc.importing": "Импортируем историю",
  "acc.imp_posts": "постов",
  "acc.imp_comments": "комментариев",
  "acc.imp_eta": "≈ пара минут",
  "acc.importing_n": "импортируется",
  "acc.error_n": "со сбоем",
  "acc.sec_profiles": "Профили",
  "acc.sec_brands": "Бренды",
  "acc.note_profile": "Клик по профилю → Студия",
  "acc.note_brand": "Клик по бренду → дашборд бренда",
  "acc.add_brand_t": "Добавить бренд",
  "acc.add_brand_s": "Новый голос и набор профилей",
  "acc.adv_title": "Агент аккаунта",
  "acc.adv_scope": "по всему портфелю",
  "acc.adv_open": "Открыть агента",
  "acc.adv_grounded": "Основано на:",
  "acc.adv_ask": "Спросите совет по портфелю…",
  "acc.adv_reco": "Рекомендации",
  // ── settings screen ──
  "acc.set_lead": "Аккаунт, язык интерфейса, тариф и ваши данные. Настройки отдельных профилей живут внутри каждого профиля.",
  "acc.set_name": "Имя",
  "acc.set_name_hint": "Так вас видят в Pennedly.",
  "acc.set_email": "Email",
  "acc.set_plan": "Тариф",
  "acc.set_plan_note": "Оплата пока не подключена.",
  "acc.set_save": "Сохранить",
  "acc.set_saved": "Имя сохранено",
  "acc.set_lang_cap": "Язык интерфейса",
  "acc.set_lang_hint": "Меняет язык меток и меню Pennedly. Черновики остаются на том языке, на котором вы их пишете.",
  "acc.set_data_cap": "Данные",
  "acc.export_t": "Экспорт данных",
  "acc.export_s": "Заберите все посты, черновики и статистику по портфелю одним архивом.",
  "acc.export_btn": "Экспортировать",
  "acc.export_preparing": "Готовим…",
  "acc.export_prep_note": "Собираем ваши данные…",
  "acc.export_ready": "Экспорт готов",
  "acc.export_ready_note": "Файл скачан.",
  "acc.export_download": "Скачать снова",
  "acc.export_failed": "Не удалось экспортировать. Попробуйте ещё раз.",
  "acc.danger_cap": "Опасная зона",
  "acc.delete_t": "Удалить аккаунт",
  "acc.delete_s": "Навсегда удаляет аккаунт, все бренды, профили и данные. Отменить нельзя.",
  "acc.delete_btn": "Удалить аккаунт",
  "acc.delete_confirm_t": "Удалить аккаунт безвозвратно?",
  "acc.delete_confirm_s": "Будут удалены аккаунт, все бренды и профили, посты, черновики и статистика. Это необратимо.",
  "acc.delete_type_lab": "Для подтверждения введите",
  "acc.delete_type_word": "УДАЛИТЬ",
  "acc.delete_cancel": "Отмена",
  "acc.delete_go": "Удалить навсегда",
  "acc.deleting": "Удаляем аккаунт…",
  "acc.deleting_note": "Отзываем доступы и стираем данные.",
  "acc.delete_failed": "Не удалось удалить аккаунт. Попробуйте ещё раз.",
  // ── advisor chat ──
  "acc.adv_pinned_cap": "Сводка портфеля",
  "acc.adv_reading": "Читаю статистику портфеля…",
  "acc.adv_thin_t": "Пока мало данных по портфелю",
  "acc.adv_thin_s": "Профили ещё набирают историю. Как накопится за пару недель, дам конкретику по росту; пока помогу с базовой настройкой.",
  "acc.adv_hero_sub": "Читаю статистику всех профилей портфеля, их голоса и недавние посты: совет под ваш аккаунт, а не общие подсказки.",
  "acc.adv_starter_fix": "Что чинить в первую очередь?",
  "acc.adv_starter_pace": "Где просел темп постинга?",
  "acc.adv_starter_grow": "Какой профиль растёт быстрее?",
  "acc.adv_composer_hint": "Pennedly читает статистику, голоса и посты всех профилей портфеля.",
  // ── navigation (#7) ──
  "acc.nav_back_dash": "Дашборд аккаунта",
  "acc.crumb_settings": "Настройки",
  "acc.crumb_advisor": "Агент",
  // ── advisor chat vocabulary (AdvisorParts reads these) ──
  "advisor.assistant_name": "Агент Pennedly",
  "advisor.grounded_in": "На основе",
  "advisor.try_asking": "Спросите, например",
  "advisor.open_in_studio": "Открыть в Создать",
  "advisor.show_data": "Показать данные",
  "advisor.error_title": "Не удалось связаться с агентом",
  "advisor.error_sub": "Запрос отвалился по таймауту. Данные целы, это только соединение.",
  "advisor.retry": "Повторить",
  "advisor.composer_placeholder": "Спросите о портфеле…",
  "advisor.composer_hint": "Pennedly читает статистику, голоса и посты всех профилей портфеля.",
};

// Demo overrides first, then the real ru catalog (so new keys resolve in the
// gallery without duplicating their translations here), then the key itself.
export const demoT: T = (k) => RU[k] ?? ru[k as keyof typeof ru] ?? k;
