/* cockpit-data.js — shared source of truth for the Overview cockpit specs
   (desktop + mobile). Mirrors GET /api/me/overview.

   Model: Account (the login) → Brands (unit of voice) → Profiles (one social
   account in one network). The cockpit aggregates PROFILES.

   LOCALE: review language is Russian (ru). Pennedly ships 8 locales
   (en/ru/uk/de/es/fr/it/pt); German (de) is the longest and is carried here as
   the layout stress-test. Every visible string is a {ru, de} pair (static UI
   in T, per-item copy on the items). Builders take a `lang` ('ru' | 'de').

   LAYOUT CONTRACT (acceptance criteria):
   Rule 1 — single-line elements (metric values, totals, triage counters,
     badges, @handle chips, button labels, audit verdicts, short captions)
     NEVER wrap; they truncate/ellipsis instead, and never push a neighbour
     down. Holds at narrow desktop, phone, and 320px.
   Rule 2 — copy is Russian by default but every container is sized for the
     longest locale (German, ~1.3–1.5× ru); de must still obey Rule 1. */
(function () {
  const LOCALES = ["en", "ru", "uk", "de", "es", "fr", "it", "pt"];

  // network marks — neutral letterforms (no third-party logos)
  const NETWORKS = {
    threads:  { id: "threads",  label: "Threads",  glyph: "@" },
    bluesky:  { id: "bluesky",  label: "Bluesky",  glyph: "b" },
    mastodon: { id: "mastodon", label: "Mastodon", glyph: "m" },
  };

  const ACCOUNT = { email: "mara@example.com", plan: "Pro" };

  // ── static UI strings (ru = review, de = longest-locale stress) ──────────
  const T = {
    ru: {
      home: "Главная", pill: "5 профилей", updatedDaily: "обновлено ежедневно",
      triHeading: "Требует тебя", retry: "Повторить",
      zeroT: "Всё разобрано", zeroFoot: "Проверено только что",
      capPrefix: "По", capProfiles: "профилям", importing: "импортируется",
      tFollowers: "Подписчики", tViews: "Просмотры", tPosts: "Посты", tReplies: "Ответы",
      subAll: "все профили", sub7d: "за 7 дней", subWeek: "на неделе", subWait: "ждут ответа",
      mPostsUnit: "нед", stats: "Статистика", replies: "Ответы", syncFailed: "Сбой синка",
      auHeading: "Аудит роста", auSubhead: "Сигнал недели по профилю", auReviewed: "Всё разобрано",
      sigUpL: "Сигнал вверх", sigDownL: "Сигнал вниз", sigFlatL: "Сигнал ровно",
      confHigh: "Высокая", confMed: "Средняя", confLow: "Низкая", confWord: "уверенность", postsWord: "постов",
      nudgeT: "Ведёте больше одного аккаунта?", nudgeS: "Подключите ещё аккаунт, чтобы видеть подписчиков, ответы и рост по всем сразу.", nudgeCta: "Подключить аккаунт",
      emptyT: "Пока нет подключённых аккаунтов", emptyS: "Подключите аккаунт, чтобы писать, отвечать и отслеживать рост. Позже добавите ещё — они встанут рядом здесь.", emptyCta: "Подключить аккаунт",
      errorT: "Не удалось загрузить профили", errorS: "Что-то пошло не так с сетями. Данные целы — попробуйте через минуту.",
      singleT: "Студия — ваша главная", singleS: "С одним профилем главной остаётся Студия — кокпит появится со вторым профилем.",
      allAccounts: "Все аккаунты", allSub: "5 профилей · Главная",
      switch: "Сменить профиль", connect: "Подключить ещё аккаунт", settings: "Настройки", logout: "Выйти",
    },
    de: {
      home: "Start", pill: "5 Profile", updatedDaily: "täglich aktualisiert",
      triHeading: "Braucht dich", retry: "Erneut versuchen",
      zeroT: "Alles erledigt", zeroFoot: "Gerade geprüft",
      capPrefix: "Über", capProfiles: "Profile", importing: "werden importiert",
      tFollowers: "Follower", tViews: "Aufrufe", tPosts: "Beiträge", tReplies: "Antworten",
      subAll: "alle Profile", sub7d: "letzte 7 Tage", subWeek: "diese Woche", subWait: "wartet",
      mPostsUnit: "Wo.", stats: "Statistik", replies: "Antworten", syncFailed: "Synchronisierung fehlgeschlagen",
      auHeading: "Wachstums-Audit", auSubhead: "Wochensignal pro Profil", auReviewed: "Alles geprüft",
      sigUpL: "Signal steigt", sigDownL: "Signal fällt", sigFlatL: "Signal stabil",
      confHigh: "Hohe", confMed: "Mittlere", confLow: "Geringe", confWord: "Konfidenz", postsWord: "Beiträge",
      nudgeT: "Mehr als ein Konto?", nudgeS: "Verbinde ein weiteres Konto, um Follower, Antworten und Wachstum nebeneinander zu sehen.", nudgeCta: "Konto verbinden",
      emptyT: "Noch keine Konten verbunden", emptyS: "Verbinde ein Konto, um zu schreiben, zu antworten und Wachstum zu verfolgen. Weitere kannst du später hinzufügen.", emptyCta: "Konto verbinden",
      errorT: "Profile konnten nicht geladen werden", errorS: "Beim Erreichen deiner Netzwerke ist etwas schiefgelaufen. Versuche es gleich erneut.",
      singleT: "Studio ist dein Start", singleS: "Mit einem Profil bleibt Studio dein Start — das Cockpit erscheint ab dem zweiten Profil.",
      allAccounts: "Alle Konten", allSub: "5 Profile · Start",
      switch: "Profil wechseln", connect: "Weiteres Konto verbinden", settings: "Einstellungen", logout: "Abmelden",
    },
  };

  // ── profiles ──────────────────────────────────────────────────────────────
  const PROFILES = {
    mara: {
      id: "mara", brand: "Mara Lin", handle: "@mara.lin", network: "threads",
      avatar: "mara.png", sync: "synced",
      refreshed: { ru: "Обновлено 2 ч назад", de: "Vor 2 Std. aktualisiert" },
      followers: "12 438", followers_delta: "+312", views_7d: "98K",
      posts_this_week: "5", replies_to_answer: 3,
    },
    field: {
      id: "field", brand: "Field Notes", handle: "@fieldnotes", network: "bluesky",
      avatar: "fieldnotes.png", sync: "synced",
      refreshed: { ru: "Обновлено 1 ч назад", de: "Vor 1 Std. aktualisiert" },
      followers: "4 210", followers_delta: "+86", views_7d: "41K",
      posts_this_week: "3", replies_to_answer: 7,
    },
    studio: {
      id: "studio", brand: "Studio Mara", handle: "@studio.mara", network: "mastodon",
      avatar: "studio.png", sync: "synced",
      refreshed: { ru: "Обновлено 3 ч назад", de: "Vor 3 Std. aktualisiert" },
      followers: "1 890", followers_delta: "-12", views_7d: "12K",
      posts_this_week: "2", replies_to_answer: 0,
    },
    quill: {
      id: "quill", brand: "Quill & Co", handle: "@quill.co", network: "threads",
      avatar: null, mono: "Q", sync: "error",
      followers: "6 540", followers_delta: "+40",
    },
    late: {
      id: "late", brand: "Late Drafts", handle: "@late.drafts", network: "threads",
      avatar: null, mono: "LD", sync: "importing",
      import: { posts: 42, comments: 310, pct: 46, eta: { ru: "Осталось ~минута", de: "Noch ~1 Minute" } },
    },
  };
  const ORDER = ["mara", "field", "studio", "quill", "late"];

  // ── portfolio totals (sum of SYNCED profiles: mara+field+studio) ─────────
  const TOTALS = {
    profiles_count: 5, synced_count: 3, importing_count: 1, error_count: 1,
    followers: "18,5K", followers_delta: "+386",
    views_7d: "151K", posts_this_week: "10", replies_to_answer: 10,
  };

  // ── "Needs you" triage queue ────────────────────────────────────────────
  const TRIAGE_PRIORITY = ["sync", "reply", "draft", "audit"];
  const TRIAGE_TONE = { sync: "danger", reply: "accent", draft: "ink", audit: "advisor" };
  const TRIAGE_COUNT = { ru: "7 пунктов · 4 профиля", de: "7 Einträge · 4 Profile" };
  const TRIAGE = [
    { type: "sync", profile: "quill", action: "retry", target: "retry",
      title: { ru: "Threads: сбой синка", de: "Threads: Synchronisierung fehlgeschlagen" },
      meta: { ru: "Синхр. 6 ч назад", de: "Sync vor 6 Std." } },
    { type: "reply", profile: "field", action: "open", target: "replies",
      title: { ru: "7 ответов к разбору", de: "7 Antworten offen" },
      meta: { ru: "старшему 3 ч", de: "ältester vor 3 Std." } },
    { type: "reply", profile: "mara", action: "open", target: "replies",
      title: { ru: "3 ответа к разбору", de: "3 Antworten offen" },
      meta: { ru: "старшему 1 ч", de: "ältester vor 1 Std." } },
    { type: "draft", profile: "field", action: "open", target: "studio",
      title: { ru: "4 черновика на проверку", de: "4 Entwürfe zu prüfen" },
      meta: { ru: "ждут в Студии", de: "warten in Studio" } },
    { type: "draft", profile: "mara", action: "open", target: "studio",
      title: { ru: "2 черновика на проверку", de: "2 Entwürfe zu prüfen" },
      meta: { ru: "ждут в Студии", de: "warten in Studio" } },
    { type: "audit", profile: "mara", action: "open", target: "audits",
      title: { ru: "Аудит недели готов", de: "Wochen-Audit bereit" },
      meta: { ru: "2 предложения · сигнал вверх", de: "2 Vorschläge · Signal steigt" } },
    { type: "audit", profile: "studio", action: "open", target: "audits",
      title: { ru: "Аудит недели готов", de: "Wochen-Audit bereit" },
      meta: { ru: "1 предложение · сигнал вниз", de: "1 Vorschlag · Signal fällt" } },
  ];

  // ── growth-audit signals (read-only; only profiles w/ a recent audit) ──────
  const AUDIT_SIGNALS = [
    { profile: "mara", signal: "up", delta: "+12%", posts: 18, conf: "high", proposals: 2,
      when: { ru: "2 дня назад", de: "vor 2 Tagen" },
      propText: { ru: "Разобрать 2 предложения", de: "2 Vorschläge prüfen" } },
    { profile: "field", signal: "up", delta: "+5%", posts: 16, conf: "high", proposals: 0,
      when: { ru: "3 дня назад", de: "vor 3 Tagen" }, propText: null },
    { profile: "studio", signal: "down", delta: "-3%", posts: 14, conf: "medium", proposals: 1,
      when: { ru: "4 дня назад", de: "vor 4 Tagen" },
      propText: { ru: "Разобрать 1 предложение", de: "1 Vorschlag prüfen" } },
  ];

  // resolve a {ru,de} pair (or pass through a plain string)
  function L(x, lang) { return (x && typeof x === "object") ? (x[lang] || x.ru) : x; }

  // localization proof rows for the spec table
  const I18N_LONG = [
    { key: "home", en: "Home", ru: "Главная", de: "Start" },
    { key: "triHeading", en: "Needs you", ru: "Требует тебя", de: "Braucht dich" },
    { key: "reply.title", en: "7 replies to answer", ru: "7 ответов к разбору", de: "7 Antworten offen" },
    { key: "draft.title", en: "2 drafts to review", ru: "2 черновика на проверку", de: "2 Entwürfe zu prüfen" },
    { key: "sync.failed", en: "Threads sync failed", ru: "Threads: сбой синка", de: "Threads: Synchronisierung fehlgeschlagen" },
    { key: "zeroT", en: "You're all caught up", ru: "Всё разобрано", de: "Alles erledigt" },
    { key: "auHeading", en: "Growth audits", ru: "Аудит роста", de: "Wachstums-Audit" },
    { key: "proposals", en: "Review 2 proposals", ru: "Разобрать 2 предложения", de: "2 Vorschläge prüfen" },
    { key: "retry", en: "Retry", ru: "Повторить", de: "Erneut versuchen" },
  ];

  window.CKPT = {
    LOCALES, NETWORKS, ACCOUNT, T, PROFILES, ORDER, TOTALS,
    TRIAGE, TRIAGE_PRIORITY, TRIAGE_TONE, TRIAGE_COUNT, AUDIT_SIGNALS,
    L, I18N_LONG,
  };
})();
