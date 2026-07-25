/* account-empty-data.js — DELTA data for the durable-dashboard states
   (Account-Dashboard-Empty-SPEC · never-connected / all-disconnected / mixed /
   loading / error). Additive only: reads the shared window.ACCT and exposes a
   separate window.ACCX so the existing Account-Dashboard specs are untouched.

   WHY THIS EXISTS — behaviour change. Today the workspace requires ≥1 live
   connected profile: with zero connected profiles the shell hard-redirects to
   the full-screen connect/onboarding wizard and the whole chrome disappears, so
   a user who disconnects their last profile (or whose token silently goes bad)
   feels logged out even though the session and all data are intact. These states
   make the dashboard DURABLE ABOVE PROFILES — full chrome in every state.

   LOCALE — review language is Russian (ru); German (de) is the longest-locale
   stress; English (en) is carried for the i18n proof table. Every visible string
   is a {ru, de} pair (Rule 2). */
(function () {
  const C = window.ACCT;

  // ── new copy (ru = review · de = longest-locale stress) ───────────────────
  const TX = {
    ru: {
      // 1 — never-connected (brand-new user, 0 profiles ever)
      neverEyebrow: "Добро пожаловать в Pennedly",
      neverT: "Подключите первый аккаунт Threads",
      neverS: "Pennedly изучит ваши недавние посты, поймёт голос и поможет писать — вы одобряете каждый пост перед публикацией.",
      neverCta: "Подключить аккаунт Threads",
      nextCap: "Что дальше",
      // 2 — all-disconnected (had profiles, all now disconnected)
      reassureT: "Ваш рабочий кабинет на месте",
      reassureS: "Профили отключены, но черновики, настройки, голос и вся история сохранены. Переподключите профиль — всё вернётся как было.",
      discSecT: "Отключённые профили",
      discSecNote: "Переподключение восстанавливает доступ — данные не создаются заново.",
      pillDisc: "Отключён",
      reconnect: "Переподключить",
      dataSafe: "Данные сохранены",
      connectAnother: "Подключить другой аккаунт",
      allDiscScale: "все отключены",
      // 3 — mixed (≥1 live + ≥1 disconnected)
      mixedSecNote: "Отключённые профили видны и восстановимы — не спрятаны.",
      // topbar / switcher chrome in the connect states
      connectShort: "Подключить аккаунт",
      swDisc: "Профили отключены",
      // error (§3.8 shared banner)
      errT: "Не удалось загрузить аккаунт",
      errS: "Что-то пошло не так при обращении к Threads. Ваши данные в безопасности — попробуйте ещё раз.",
      retry: "Повторить",
      // A — network picker (shared connect affordance)
      pickerChoose: "Выберите сеть",
      firstEyebrow: "Добро пожаловать в Pennedly",
      firstT: "Подключите первый аккаунт",
      firstS: "Начнём с Threads. Pennedly изучит ваши недавние посты, поймёт голос и поможет писать — вы одобряете каждый пост.",
      sheetT: "Подключить аккаунт",
      sheetS: "Выберите сеть для подключения.",
      connectVerb: "Подключить",
      liveLabel: "Живая сеть",
      soonLabel: "Скоро",
      soonSub: "Скоро — команда Pennedly уже работает над этим.",
      reconnPre: "Переподключить",
      reconnSub: "Восстановит доступ. Данные и настройки на месте.",
      logOut: "Выйти",
    },
    de: {
      neverEyebrow: "Willkommen bei Pennedly",
      neverT: "Verbinde dein erstes Threads-Konto",
      neverS: "Pennedly liest deine letzten Beiträge, lernt deine Stimme und hilft beim Schreiben — du gibst jeden Beitrag vor der Veröffentlichung frei.",
      neverCta: "Threads-Konto verbinden",
      nextCap: "Was als Nächstes passiert",
      reassureT: "Dein Arbeitsbereich ist sicher",
      reassureS: "Die Profile sind getrennt, doch Entwürfe, Einstellungen, Stimme und der gesamte Verlauf bleiben erhalten. Verbinde ein Profil neu — alles kommt zurück.",
      discSecT: "Getrennte Profile",
      discSecNote: "Neu verbinden stellt den Zugang wieder her — es werden keine Daten neu angelegt.",
      pillDisc: "Getrennt",
      reconnect: "Erneut verbinden",
      dataSafe: "Daten gesichert",
      connectAnother: "Weiteres Konto verbinden",
      allDiscScale: "alle getrennt",
      mixedSecNote: "Getrennte Profile bleiben sichtbar und wiederherstellbar — nicht versteckt.",
      connectShort: "Konto verbinden",
      swDisc: "Profile getrennt",
      errT: "Konto konnte nicht geladen werden",
      errS: "Beim Zugriff auf Threads ist etwas schiefgelaufen. Deine Daten sind sicher — bitte erneut versuchen.",
      retry: "Erneut versuchen",
      pickerChoose: "Netzwerk wählen",
      firstEyebrow: "Willkommen bei Pennedly",
      firstT: "Verbinde dein erstes Konto",
      firstS: "Wir starten mit Threads. Pennedly liest deine letzten Beiträge, lernt deine Stimme und hilft beim Schreiben — du gibst jeden Beitrag frei.",
      sheetT: "Konto verbinden",
      sheetS: "Wähle ein Netzwerk zum Verbinden.",
      connectVerb: "Verbinden",
      liveLabel: "Aktives Netzwerk",
      soonLabel: "Bald",
      soonSub: "Bald — das Pennedly-Team arbeitet daran.",
      reconnPre: "Erneut verbinden:",
      reconnSub: "Stellt den Zugang wieder her. Daten und Einstellungen bleiben.",
      logOut: "Abmelden",
    },
    // en carried for the localization proof table + future English render
    en: {
      neverEyebrow: "Welcome to Pennedly",
      neverT: "Connect your first Threads account",
      neverS: "Pennedly reads your recent posts, learns your voice and helps you write — you approve every post before it goes out.",
      neverCta: "Connect Threads account",
      nextCap: "What happens next",
      reassureT: "Your workspace is safe",
      reassureS: "The profiles are disconnected, but your drafts, settings, voice and full history are kept. Reconnect a profile and everything comes back.",
      discSecT: "Disconnected profiles",
      discSecNote: "Reconnecting restores access — nothing is recreated from scratch.",
      pillDisc: "Disconnected",
      reconnect: "Reconnect",
      dataSafe: "Data is safe",
      connectAnother: "Connect another account",
      allDiscScale: "all disconnected",
      mixedSecNote: "Disconnected profiles stay visible and recoverable — not hidden.",
      connectShort: "Connect account",
      swDisc: "Profiles disconnected",
      errT: "Couldn’t load your account",
      errS: "Something went wrong reaching Threads. Your work is safe — try again in a moment.",
      retry: "Retry",
      pickerChoose: "Choose a network",
      firstEyebrow: "Welcome to Pennedly",
      firstT: "Connect your first account",
      firstS: "We start with Threads. Pennedly reads your recent posts, learns your voice and helps you write — you approve every post.",
      sheetT: "Connect account",
      sheetS: "Choose a network to connect.",
      connectVerb: "Connect",
      liveLabel: "Live network",
      soonLabel: "Coming soon",
      soonSub: "Coming soon — the Pennedly team is on it.",
      reconnPre: "Reconnect",
      reconnSub: "Restores access. Your data and settings are kept.",
      logOut: "Log out",
    },
  };

  // ── "what happens next" reassurance rows (never-connected) ────────────────
  // Reuses the onboarding connect trust language (read-only · you approve ·
  // disconnect anytime). icon → shared sprite / desktop icon set.
  const NEXT = {
    ru: [
      { icon: "eye", t: "Только чтение — изучаем ваши посты, чтобы поймать голос." },
      { icon: "check", t: "Ничего не публикуется без вашего одобрения." },
      { icon: "autopilot", t: "Отключить можно в любой момент — аккаунт остаётся вашим." },
    ],
    de: [
      { icon: "eye", t: "Nur Lesezugriff — wir studieren deine Beiträge für deine Stimme." },
      { icon: "check", t: "Nichts wird ohne deine Freigabe veröffentlicht." },
      { icon: "autopilot", t: "Jederzeit trennbar — dein Konto bleibt deins." },
    ],
    en: [
      { icon: "eye", t: "Read-only — we study your posts to learn your voice." },
      { icon: "check", t: "Nothing is ever posted without your approval." },
      { icon: "autopilot", t: "Disconnect anytime — your account stays yours." },
    ],
  };

  // ── disconnected profiles ─────────────────────────────────────────────────
  // GET /api/me/account lists these with disconnected_at set. Real avatar +
  // @handle + display name; reconnecting is the same OAuth connect flow targeted
  // at a known handle. No metrics — a disconnected profile reports no data.
  const DISCONNECTED = {
    lin:   { id: "lin",   name: "Mara Lin",    handle: "@mara.lin",    network: "threads", avatar: "mara.png",
             since: { ru: "Отключён 2 дня назад",   de: "Vor 2 Tagen getrennt",  en: "Disconnected 2 days ago" } },
    notes: { id: "notes", name: "Field Notes",  handle: "@mara.notes",  network: "threads", avatar: "studio.png",
             since: { ru: "Отключён 5 дней назад",  de: "Vor 5 Tagen getrennt",  en: "Disconnected 5 days ago" } },
    co:    { id: "co",    name: "Mara Co",      handle: "@mara.co",     network: "threads", avatar: null, mono: "CO",
             since: { ru: "Отключён 3 недели назад", de: "Vor 3 Wochen getrennt", en: "Disconnected 3 weeks ago" } },
  };
  // order the all-disconnected list renders in
  const ALL_DISC = ["lin", "notes", "co"];

  // ── the disconnected profile that lives inside the MIXED dashboard ─────────
  // (a disconnected @mara.studio — proven distinct from the sync-error @mara.co)
  const STUDIO_DISC = {
    id: "studioDisc", name: "Studio Mara", handle: "@mara.studio", network: "threads", avatar: "c-theo.png",
    since: { ru: "Отключён вчера", de: "Gestern getrennt", en: "Disconnected yesterday" },
  };
  // MIXED grid: live + importing + sync-error (from ACCT.PROFILES) + disconnected.
  // Cards render every real per-profile state side by side so a dead profile is
  // visible and recoverable rather than hidden.
  const MIXED = {
    order: ["mara", "notes", "studioDisc", "co", "drafts"],
    disc: ["studioDisc"], // ids rendered as disconnected cards (the rest come from ACCT.PROFILES)
  };
  // MIXED totals — sum of SYNCED only (mara + notes). studioDisc(disconnected),
  // co(sync-error) and drafts(importing) are excluded, exactly like today.
  const MIXED_TOTALS = {
    brands_count: 1, profiles_count: 5, synced_count: 2, importing_count: 1, error_count: 1, disc_count: 1,
    followers: "16,6K", followers_delta: "+398", views_7d: "139K",
    posts_this_week: "8", replies_to_answer: 10,
  };

  // ── localization proof rows (en / ru / de) for the spec table ─────────────
  const I18N = [
    { key: "empty.title", en: "Connect your first Threads account", ru: "Подключите первый аккаунт Threads", de: "Verbinde dein erstes Threads-Konto" },
    { key: "empty.cta", en: "Connect Threads account", ru: "Подключить аккаунт Threads", de: "Threads-Konto verbinden" },
    { key: "disc.pill", en: "Disconnected", ru: "Отключён", de: "Getrennt" },
    { key: "disc.reconnect", en: "Reconnect", ru: "Переподключить", de: "Erneut verbinden" },
    { key: "disc.connectAnother", en: "Connect another account", ru: "Подключить другой аккаунт", de: "Weiteres Konto verbinden" },
    { key: "reassure.title", en: "Your workspace is safe", ru: "Ваш рабочий кабинет на месте", de: "Dein Arbeitsbereich ist sicher" },
    { key: "error.title", en: "Couldn’t load your account", ru: "Не удалось загрузить аккаунт", de: "Konto konnte nicht geladen werden" },
    { key: "retry", en: "Retry", ru: "Повторить", de: "Erneut versuchen" },
    { key: "picker.choose", en: "Choose a network", ru: "Выберите сеть", de: "Netzwerk wählen" },
    { key: "network.soon", en: "Coming soon", ru: "Скоро", de: "Bald" },
    { key: "first.title", en: "Connect your first account", ru: "Подключите первый аккаунт", de: "Verbinde dein erstes Konto" },
  ];

  // ── network picker (shared connect affordance) ───────────────────────────
  // Threads is live; LinkedIn is a disabled coming-soon placeholder. Neutral
  // DS letterform marks (no third-party logos, per the DS) tinted per network;
  // `tone` maps to a semantic token so a third network slots in with no layout
  // surprise. Real brand assets can drop into the mark slot later.
  const PICKER_NETS = [
    { id: "threads",  name: "Threads",  status: "live", glyph: "@",  tone: "ink" },
    { id: "linkedin", name: "LinkedIn", status: "soon", glyph: "in", tone: "accent" },
  ];

  // in-dashboard states (state 1 first-connect is FULL-SCREEN → picker spec)
  const STATES = ["all_disc", "mixed", "loading", "error"];

  window.ACCX = {
    TX, NEXT, DISCONNECTED, ALL_DISC, STUDIO_DISC, MIXED, MIXED_TOTALS, I18N, STATES, PICKER_NETS,
    T: function (lang) { return TX[lang] || TX.ru; },
  };
})();
