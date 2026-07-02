// Demo fixtures for the account dashboard gallery — mirrors the CD эталон
// sample data (account-data.js). No auth / no backend; drives /gallery/account
// so every mode + state is reviewable against the spec.

import type { AccountProfile, MeAccountResponse } from "@/lib/types";
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
  scope: { brands_count: 1, profiles_count: 1, show_brand_level: false },
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
  scope: { brands_count: 1, profiles_count: SINGLE.length, show_brand_level: false },
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
  scope: { brands_count: 3, profiles_count: MULTI.length, show_brand_level: true },
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
  "acc.nav_advisor": "Советник",
  "acc.nav_settings": "Настройки аккаунта",
  "acc.crumb_account": "Аккаунт",
  "acc.sw_all": "Все профили",
  "acc.profiles_word": "профилей",
  "acc.brands_word": "брендах",
  "acc.followers": "Подписчики",
  "acc.views": "Просмотры",
  "acc.posts": "Посты",
  "acc.posts_unit": "нед",
  "acc.replies": "Ответить",
  "acc.replies_short": "Ответы",
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
  "acc.tasks_title": "Требует тебя",
  "acc.tasks_all": "Открыть всё",
  "acc.task_sync": "сбой синка",
  "acc.task_replies": "к ответу",
  "acc.task_drafts": "черновика",
  "acc.task_audits": "аудит",
  "acc.adv_title": "Советник аккаунта",
  "acc.adv_scope": "по всему портфелю",
  "acc.adv_open": "Открыть чат",
  "acc.adv_grounded": "Основано на:",
  "acc.adv_ask": "Спросите совет по портфелю…",
  "acc.adv_reco": "Рекомендации",
};

export const demoT: T = (k) => RU[k] ?? k;
