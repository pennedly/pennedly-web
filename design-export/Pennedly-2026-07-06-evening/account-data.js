/* account-data.js — shared source of truth for the Account Dashboard specs
   (desktop + mobile). Mirrors GET /api/me/account.

   MODEL — three DATA levels, but the UI only shows what the user actually has:
     Account (the login, this dashboard, always visible)
       → Brand (unit of voice; exists for every user, becomes a VISIBLE
         navigation level only at 2+ brands)
         → Profile (one social account in one network; today Threads).

   The dashboard is ONE component parameterised by brand count:
     • 1 brand  → the cards are this brand's PROFILES; the brand is invisible.
     • 2+ brands → the cards are BRANDS (roll-up stats); a brand expands to its
       profiles. The same grid, the same chrome — a level simply appears.

   NETWORKS — today only Threads. The network badge is neutral/swappable so the
   next network (LinkedIn) drops in without a redesign; LinkedIn appears only in
   the forward-looking 2+ brands (agency) demo to prove the roll-up.

   LOCALE — review language is Russian (ru). Pennedly ships 8 locales
   (en/ru/uk/de/es/fr/it/pt); German (de) is the longest and is carried here as
   the layout stress-test. Every visible string is a {ru, de} pair.

   LAYOUT CONTRACT (acceptance criteria):
   Rule 1 — single-line elements (metric values/totals, counters, badges,
     @handle chips, brand names, button labels, short captions) NEVER wrap; they
     ellipsis-truncate and never push a neighbour down. Holds at narrow desktop,
     phone, and 320px — by design (short labels, roomy containers), not patched.
   Rule 2 — copy is Russian by default but every container is sized for the
     longest locale (German, ~1.3–1.5× ru); de must still obey Rule 1. */
(function () {
  const LOCALES = ["en", "ru", "uk", "de", "es", "fr", "it", "pt"];

  // neutral network marks — letterforms, no third-party logos
  const NETWORKS = {
    threads:  { id: "threads",  label: "Threads",  glyph: "@" },
    linkedin: { id: "linkedin", label: "LinkedIn", glyph: "in" }, // next network
  };

  // the account = the login (tenant). The sidebar foot switches THIS.
  const ACCOUNT = { name: "Mara Lin", email: "mara@pennedly.com", plan: "Pro", mono: "M" };
  // other logins the same person can switch into (tenant switch, not profile)
  const LOGINS = [
    { email: "mara@pennedly.com", plan: "Pro",  mono: "M", current: true },
    { email: "studio@northwind.co", plan: "Team", mono: "N", current: false },
  ];

  // ── static UI strings (ru = review, de = longest-locale stress) ──────────
  const T = {
    ru: {
      // shell / nav (ACCOUNT level — not the profile menu)
      navDashboard: "Дашборд", navBrands: "Бренды", navAdvisor: "Советник",
      navSettings: "Настройки аккаунта",
      switchAccount: "Сменить аккаунт", accountWord: "Аккаунт", logout: "Выйти",
      settings: "Настройки аккаунта",
      // breadcrumb + flat profile switcher
      crumbAccount: "Аккаунт",
      swAll: "Все профили", swJump: "Перейти к профилю", swConnect: "Подключить профиль",
      swCount: "профилей", inBrand: "Бренд",
      // header
      headScale: "профилей", headIn: "в", headBrands: "брендах", headOne: "бренде",
      headThreads: "Threads", updatedDaily: "обновлено ежедневно",
      // tasks strip ("Требует тебя")
      tasksTitle: "Требует тебя", tasksAll: "Разобрать всё",
      tSync: "сбой синка", tReplies: "ответов", tDrafts: "черновиков", tAudits: "аудита",
      // portfolio totals
      pCap: "Портфель", tFollowers: "Подписчики", tViews: "Просмотры",
      tPosts: "Посты", tReplies2: "Ответы",
      subAll: "по портфелю", sub7d: "за 7 дней", subWeek: "на неделе", subWait: "к разбору",
      importing: "импортируется",
      // advisor (account scope)
      advTitle: "Советник аккаунта", advScope: "По всему портфелю",
      advGrounded: "На основе", advOpen: "Открыть советника",
      advAsk: "Спросите о портфеле…", advReco: "Рекомендации",
      // cards section
      secProfiles: "Профили", secBrands: "Бренды",
      profilesWord: "профилей", profileWord: "профиля",
      cardOpen: "Открыть", expand: "Профили", collapse: "Свернуть",
      mPostsUnit: "нед", stats: "Студия", replies: "Ответы",
      syncFailed: "Сбой синка", retry: "Повторить",
      syncedAll: "Все синхронизированы", importingN: "импортируется", errorN: "сбой синка",
      // add-brand CTA
      addBrandT: "Добавить бренд",
      addBrandS: "Сгруппируйте профили под отдельным голосом и аналитикой.",
      // states
      newWelcome: "С возвращением", newSub: "Вот ваш портфель одним взглядом.",
      // brand kinds (subtitle on a brand mark)
      brandPersonal: "Личный бренд", brandPub: "Издание", brandClient: "Клиент",
      // ── account settings screen (/app/account/settings) ──
      setTitle: "Настройки аккаунта",
      setLead: "Аккаунт, язык интерфейса, тариф и ваши данные. Настройки отдельных профилей живут внутри каждого профиля.",
      setAccountCap: "Аккаунт", setName: "Имя", setEmail: "Email", setPlan: "Тариф",
      setNameHint: "Так вас видят в Pennedly.", setEmailHint: "Вход и уведомления.",
      planNote: "Оплачен · продление 12 апреля", planManage: "Тариф",
      setLangCap: "Язык интерфейса",
      setLangHint: "Меняет язык меток и меню Pennedly. Черновики остаются на том языке, на котором вы их пишете.",
      setDataCap: "Данные",
      exportT: "Экспорт данных", exportS: "Заберите все посты, черновики и статистику по портфелю одним архивом.",
      exportBtn: "Экспортировать",
      exportPreparing: "Готовим архив…", exportPrepNote: "Пришлём ссылку на почту, когда будет готово.",
      exportReady: "Архив готов", exportReadyNote: "Ссылка активна 24 часа.", exportDownload: "Скачать .zip",
      dangerCap: "Опасная зона",
      deleteT: "Удалить аккаунт", deleteS: "Навсегда удаляет аккаунт, все бренды, профили и данные. Отменить нельзя.",
      deleteBtn: "Удалить аккаунт",
      deleteConfirmT: "Удалить аккаунт безвозвратно?",
      deleteConfirmS: "Будут удалены аккаунт, все бренды и профили, посты, черновики и статистика. Это необратимо.",
      deleteTypeLab: "Для подтверждения введите", deleteTypeWord: "УДАЛИТЬ", deleteCancel: "Отмена", deleteGo: "Удалить навсегда",
      deleting: "Удаляем аккаунт…", deletingNote: "Отзываем доступы и стираем данные.",
      // ── portfolio advisor chat (/app/account/advisor) ──
      advChatScope: "По всему портфелю", advPill: "На основе всего портфеля",
      advPinnedCap: "Сводка портфеля", advAskPort: "Спросите о портфеле…", advOpenFull: "Открыть советника",
      advTry: "Спросите, например", advReading: "Читаю статистику портфеля…",
      advThinT: "Пока мало данных по портфелю",
      advThinS: "Профили ещё набирают историю. Как накопится за пару недель — дам конкретику по росту; пока помогу с базовой настройкой.",
      advErrT: "Не удалось связаться с советником", advErrS: "Запрос отвалился по таймауту. Данные целы — это только соединение.", advRetry: "Повторить",
      advName: "Советник Pennedly", advGroundedFull: "На основе",
      // ── account ↔ profile navigation (#7) ──
      navBackDash: "Дашборд аккаунта", navBackShort: "Аккаунт",
      crumbAdvisor: "Советник", crumbSettings: "Настройки", testerGated: "Тестер",
    },
    de: {
      navDashboard: "Übersicht", navBrands: "Marken", navAdvisor: "Berater",
      navSettings: "Kontoeinstellungen",
      switchAccount: "Konto wechseln", accountWord: "Konto", logout: "Abmelden",
      settings: "Kontoeinstellungen",
      crumbAccount: "Konto",
      swAll: "Alle Profile", swJump: "Zu Profil wechseln", swConnect: "Profil verbinden",
      swCount: "Profile", inBrand: "Marke",
      headScale: "Profile", headIn: "in", headBrands: "Marken", headOne: "Marke",
      headThreads: "Threads", updatedDaily: "täglich aktualisiert",
      tasksTitle: "Braucht dich", tasksAll: "Alles erledigen",
      tSync: "Sync-Fehler", tReplies: "Antworten", tDrafts: "Entwürfe", tAudits: "Audits",
      pCap: "Portfolio", tFollowers: "Follower", tViews: "Aufrufe",
      tPosts: "Beiträge", tReplies2: "Antworten",
      subAll: "im Portfolio", sub7d: "letzte 7 Tage", subWeek: "diese Woche", subWait: "zu klären",
      importing: "werden importiert",
      advTitle: "Konto-Berater", advScope: "Über das gesamte Portfolio",
      advGrounded: "Basis", advOpen: "Berater öffnen",
      advAsk: "Frag zu deinem Portfolio…", advReco: "Empfehlungen",
      secProfiles: "Profile", secBrands: "Marken",
      profilesWord: "Profile", profileWord: "Profile",
      cardOpen: "Öffnen", expand: "Profile", collapse: "Einklappen",
      mPostsUnit: "Wo.", stats: "Studio", replies: "Antworten",
      syncFailed: "Synchronisierung fehlgeschlagen", retry: "Erneut versuchen",
      syncedAll: "Alle synchronisiert", importingN: "wird importiert", errorN: "Sync-Fehler",
      addBrandT: "Marke hinzufügen",
      addBrandS: "Profile unter einer eigenen Stimme und Auswertung bündeln.",
      newWelcome: "Willkommen zurück", newSub: "Dein Portfolio auf einen Blick.",
      brandPersonal: "Persönliche Marke", brandPub: "Publikation", brandClient: "Kunde",
      setTitle: "Kontoeinstellungen",
      setLead: "Konto, Anzeigesprache, Tarif und deine Daten. Einstellungen einzelner Profile liegen im jeweiligen Profil.",
      setAccountCap: "Konto", setName: "Name", setEmail: "E-Mail", setPlan: "Tarif",
      setNameHint: "So erscheinst du in Pennedly.", setEmailHint: "Anmeldung und Benachrichtigungen.",
      planNote: "Bezahlt · Verlängerung 12. April", planManage: "Tarif",
      setLangCap: "Anzeigesprache",
      setLangHint: "Ändert Beschriftungen und Menüs von Pennedly. Deine Entwürfe bleiben in ihrer Sprache.",
      setDataCap: "Daten",
      exportT: "Daten exportieren", exportS: "Alle Beiträge, Entwürfe und Portfolio-Statistiken als ein Archiv.",
      exportBtn: "Exportieren",
      exportPreparing: "Archiv wird erstellt…", exportPrepNote: "Wir mailen den Link, sobald es fertig ist.",
      exportReady: "Archiv bereit", exportReadyNote: "Link 24 Stunden gültig.", exportDownload: ".zip laden",
      dangerCap: "Gefahrenzone",
      deleteT: "Konto löschen", deleteS: "Löscht Konto, alle Marken, Profile und Daten dauerhaft. Nicht umkehrbar.",
      deleteBtn: "Konto löschen",
      deleteConfirmT: "Konto unwiderruflich löschen?",
      deleteConfirmS: "Gelöscht werden Konto, alle Marken und Profile, Beiträge, Entwürfe und Statistiken. Dieser Schritt ist endgültig.",
      deleteTypeLab: "Zum Bestätigen tippe", deleteTypeWord: "LÖSCHEN", deleteCancel: "Abbrechen", deleteGo: "Endgültig löschen",
      deleting: "Konto wird gelöscht…", deletingNote: "Zugänge werden entzogen, Daten gelöscht.",
      advChatScope: "Über das gesamte Portfolio", advPill: "Basiert aufs Portfolio",
      advPinnedCap: "Portfolio-Überblick", advAskPort: "Frag zu deinem Portfolio…", advOpenFull: "Berater öffnen",
      advTry: "Frag zum Beispiel", advReading: "Lese Portfolio-Statistiken…",
      advThinT: "Noch wenig Portfolio-Daten",
      advThinS: "Die Profile sammeln noch Verlauf. In ein paar Wochen wird der Rat konkret; bis dahin helfe ich beim Setup.",
      advErrT: "Berater nicht erreichbar", advErrS: "Zeitüberschreitung. Deine Daten sind da — nur die Verbindung.", advRetry: "Erneut versuchen",
      advName: "Pennedly Berater", advGroundedFull: "Basis",
      navBackDash: "Konto-Übersicht", navBackShort: "Konto",
      crumbAdvisor: "Berater", crumbSettings: "Einstellungen", testerGated: "Tester",
    },
  };

  // ── profiles (today all Threads; one LinkedIn lives in the agency brand) ──
  const PROFILES = {
    mara: {
      id: "mara", brandId: "mara", handle: "@mara.lin", network: "threads",
      avatar: "mara.png", sync: "synced",
      refreshed: { ru: "Обновлено 2 ч назад", de: "Vor 2 Std. aktualisiert" },
      followers: "12,4K", followers_delta: "+312", views_7d: "98K",
      posts_this_week: "5", replies_to_answer: 3,
    },
    notes: {
      id: "notes", brandId: "field", handle: "@mara.notes", network: "threads",
      avatar: "studio.png", sync: "synced",
      refreshed: { ru: "Обновлено 1 ч назад", de: "Vor 1 Std. aktualisiert" },
      followers: "4,2K", followers_delta: "+86", views_7d: "41K",
      posts_this_week: "3", replies_to_answer: 7,
    },
    studio: {
      id: "studio", brandId: "mara", handle: "@mara.studio", network: "threads",
      avatar: "c-theo.png", sync: "synced",
      refreshed: { ru: "Обновлено 3 ч назад", de: "Vor 3 Std. aktualisiert" },
      followers: "1,9K", followers_delta: "-12", views_7d: "12K",
      posts_this_week: "2", replies_to_answer: 0,
    },
    co: {
      id: "co", brandId: "field", handle: "@mara.co", network: "threads",
      avatar: null, mono: "CO", sync: "error",
      followers: "6,5K", followers_delta: "+40",
    },
    drafts: {
      id: "drafts", brandId: "mara", handle: "@mara.drafts", network: "threads",
      avatar: null, mono: "DR", sync: "importing",
      import: { posts: 42, comments: 310, pct: 46, eta: { ru: "Осталось ~минута", de: "Noch ~1 Minute" } },
    },
    north: {
      id: "north", brandId: "north", handle: "@northwind", network: "threads",
      avatar: "c-devon.png", sync: "synced",
      refreshed: { ru: "Обновлено 4 ч назад", de: "Vor 4 Std. aktualisiert" },
      followers: "8,9K", followers_delta: "+210", views_7d: "64K",
      posts_this_week: "4", replies_to_answer: 2,
    },
    northIn: {
      id: "northIn", brandId: "north", handle: "@northwind.co", network: "linkedin",
      avatar: "c-marina.png", sync: "importing",
      import: { posts: 30, comments: 120, pct: 38, eta: { ru: "Осталось ~3 минуты", de: "Noch ~3 Minuten" } },
    },
  };

  // ── brands (group profiles; aggregate over their SYNCED profiles) ─────────
  const BRANDS = {
    mara: {
      id: "mara", name: "Mara Lin", mono: "M", kind: "personal",
      profiles: ["mara", "studio", "drafts"],
      networks: ["threads"],
      followers: "14,3K", followers_delta: "+300", views_7d: "110K",
      posts_this_week: "7", replies_to_answer: 3,
      synced: 2, importing: 1, error: 0,
    },
    field: {
      id: "field", name: "Field Notes", mono: "F", kind: "pub",
      profiles: ["notes", "co"],
      networks: ["threads"],
      followers: "4,2K", followers_delta: "+86", views_7d: "41K",
      posts_this_week: "3", replies_to_answer: 7,
      synced: 1, importing: 0, error: 1,
    },
    north: {
      id: "north", name: "Northwind", mono: "N", kind: "client",
      profiles: ["north", "northIn"],
      networks: ["threads", "linkedin"],
      followers: "8,9K", followers_delta: "+210", views_7d: "64K",
      posts_this_week: "4", replies_to_answer: 2,
      synced: 1, importing: 1, error: 0,
    },
  };

  // ── portfolio totals per state (sum of SYNCED profiles) ───────────────────
  const TOTALS = {
    // 1 brand · many profiles (mara,notes,studio,co,drafts)
    single_brand: {
      brands_count: 1, profiles_count: 5, synced_count: 3, importing_count: 1, error_count: 1,
      followers: "18,5K", followers_delta: "+386", views_7d: "151K",
      posts_this_week: "10", replies_to_answer: 10,
    },
    // 1 brand · 1 profile (new user)
    one_profile: {
      brands_count: 1, profiles_count: 1, synced_count: 1, importing_count: 0, error_count: 0,
      followers: "12,4K", followers_delta: "+312", views_7d: "98K",
      posts_this_week: "5", replies_to_answer: 3,
    },
    // 2+ brands (mara,field,north → 6 profiles)
    multi_brand: {
      brands_count: 3, profiles_count: 6, synced_count: 4, importing_count: 1, error_count: 1,
      followers: "27,5K", followers_delta: "+596", views_7d: "215K",
      posts_this_week: "14", replies_to_answer: 12,
    },
  };

  // ── account-wide "Needs you" aggregate (thin strip above the cards) ───────
  const TASKS = {
    single_brand: [
      { type: "sync",  n: 1, label: { ru: "сбой синка", de: "Sync-Fehler" } },
      { type: "reply", n: 10, label: { ru: "ответов", de: "Antworten" } },
      { type: "draft", n: 6, label: { ru: "черновиков", de: "Entwürfe" } },
      { type: "audit", n: 2, label: { ru: "аудита", de: "Audits" } },
    ],
    multi_brand: [
      { type: "sync",  n: 1, label: { ru: "сбой синка", de: "Sync-Fehler" } },
      { type: "reply", n: 12, label: { ru: "ответов", de: "Antworten" } },
      { type: "draft", n: 9, label: { ru: "черновиков", de: "Entwürfe" } },
      { type: "audit", n: 3, label: { ru: "аудита", de: "Audits" } },
    ],
    one_profile: [
      { type: "reply", n: 3, label: { ru: "ответа", de: "Antworten" } },
      { type: "audit", n: 1, label: { ru: "аудит", de: "Audit" } },
    ],
  };

  // ── account advisor (verdict + grounded chips + portfolio recommendations)
  //    structure mirrors the profile advisor; scope = the whole account ──────
  const ADVISOR = {
    single_brand: {
      verdict: {
        ru: "Портфель в плюсе — но один профиль выпал и темп постинга просел.",
        de: "Das Portfolio wächst — doch ein Profil fehlt und das Tempo sinkt.",
      },
      detail: {
        ru: "За 30 дней портфель прибавил <b>+386 подписчиков</b>. <b>@mara.co</b> со сбоем синка не отдаёт данные, а на этой неделе вышло <b>10 постов</b> против 14 неделей раньше.",
        de: "In 30 Tagen kamen <b>+386 Follower</b> dazu. <b>@mara.co</b> liefert wegen eines Sync-Fehlers keine Daten, und diese Woche gab es <b>10 Beiträge</b> statt 14.",
      },
      chips: [
        { tone: "up", icon: "users", text: { ru: "+386 за 30 дней", de: "+386 in 30 Tagen" } },
        { tone: "down", icon: "alert", text: { ru: "@mara.co · сбой синка", de: "@mara.co · Sync-Fehler" } },
        { tone: "accent", icon: "nib", text: { ru: "10 постов на неделе", de: "10 Beiträge/Woche" } },
      ],
      grounded: { ru: "Статистика · Профили · недавние посты", de: "Statistik · Profile · letzte Beiträge" },
      recos: [
        { icon: "alert", tone: "danger", profile: "co", to: "retry",
          t: { ru: "Почини синк @mara.co", de: "Sync von @mara.co reparieren" },
          s: { ru: "6 ч без обновления. Данные целы — нужен повторный коннект.", de: "6 Std. ohne Update. Daten sind da — neu verbinden." } },
        { icon: "reply", tone: "accent", profile: "notes", to: "replies",
          t: { ru: "Разбери 7 ответов в @mara.notes", de: "7 Antworten bei @mara.notes klären" },
          s: { ru: "Старшему 3 ч — окно вовлечённости ещё открыто.", de: "Ältester 3 Std. — das Fenster ist noch offen." } },
        { icon: "nib", tone: "ink", profile: "studio", to: "studio",
          t: { ru: "Верни 5 постов в неделю на @mara.studio", de: "@mara.studio zurück auf 5 Beiträge/Woche" },
          s: { ru: "Профиль просел до 2 постов. Два коротких в твоём голосе обычно заходят.", de: "Auf 2 Beiträge gefallen. Zwei kurze in deiner Stimme ziehen meist." } },
      ],
    },
    multi_brand: {
      verdict: {
        ru: "Портфель растёт по всем брендам — Northwind ещё импортируется.",
        de: "Alle Marken wachsen — Northwind wird noch importiert.",
      },
      detail: {
        ru: "Три бренда дали <b>+596 подписчиков</b> за 30 дней. <b>Field Notes</b> тянет один профиль со сбоем синка, а <b>Northwind</b> только подключил LinkedIn — данные подтянутся за пару минут.",
        de: "Drei Marken brachten <b>+596 Follower</b> in 30 Tagen. <b>Field Notes</b> hat ein Profil mit Sync-Fehler, und <b>Northwind</b> hat gerade LinkedIn verbunden — gleich da.",
      },
      chips: [
        { tone: "up", icon: "users", text: { ru: "+596 за 30 дней", de: "+596 in 30 Tagen" } },
        { tone: "accent", icon: "layers", text: { ru: "3 бренда · 6 профилей", de: "3 Marken · 6 Profile" } },
        { tone: "down", icon: "alert", text: { ru: "Field Notes · 1 сбой", de: "Field Notes · 1 Fehler" } },
      ],
      grounded: { ru: "Статистика · Бренды · Профили", de: "Statistik · Marken · Profile" },
      recos: [
        { icon: "alert", tone: "danger", profile: "co", to: "retry",
          t: { ru: "Почини синк в Field Notes", de: "Sync in Field Notes reparieren" },
          s: { ru: "@mara.co не обновлялся 6 ч. Бренд считается без него.", de: "@mara.co 6 Std. alt. Die Marke rechnet ohne ihn." } },
        { icon: "layers", tone: "accent", brand: "north", to: "brand",
          t: { ru: "Открой Northwind — LinkedIn почти готов", de: "Northwind öffnen — LinkedIn fast fertig" },
          s: { ru: "Импорт на 38%. Скоро увидишь первую статистику нового профиля.", de: "Import bei 38%. Bald erste Zahlen des neuen Profils." } },
        { icon: "nib", tone: "ink", brand: "mara", to: "brand",
          t: { ru: "Mara Lin держит темп — 7 постов", de: "Mara Lin hält das Tempo — 7 Beiträge" },
          s: { ru: "Лучший бренд недели по охвату. Стоит повторить формат.", de: "Beste Marke der Woche. Format ruhig wiederholen." } },
      ],
    },
    one_profile: {
      verdict: {
        ru: "Хороший старт — @mara.lin прибавляет, дальше дело за темпом.",
        de: "Guter Start — @mara.lin wächst, jetzt zählt das Tempo.",
      },
      detail: {
        ru: "За 30 дней <b>+312 подписчиков</b> и <b>98K просмотров</b>. Есть <b>3 ответа</b> к разбору и свежий аудит недели — с них и начнём.",
        de: "In 30 Tagen <b>+312 Follower</b> und <b>98K Aufrufe</b>. <b>3 Antworten</b> warten und ein frisches Wochen-Audit — damit starten wir.",
      },
      chips: [
        { tone: "up", icon: "users", text: { ru: "+312 за 30 дней", de: "+312 in 30 Tagen" } },
        { tone: "accent", icon: "eye", text: { ru: "98K просмотров", de: "98K Aufrufe" } },
        { tone: "accent", icon: "reply", text: { ru: "3 ответа к разбору", de: "3 Antworten offen" } },
      ],
      grounded: { ru: "Статистика · недавние посты", de: "Statistik · letzte Beiträge" },
      recos: [
        { icon: "reply", tone: "accent", profile: "mara", to: "replies",
          t: { ru: "Разбери 3 ответа", de: "3 Antworten klären" },
          s: { ru: "Ответы — самый быстрый рост на старте.", de: "Antworten sind der schnellste Hebel am Anfang." } },
        { icon: "audit", tone: "ink", profile: "mara", to: "audits",
          t: { ru: "Открой аудит недели", de: "Wochen-Audit öffnen" },
          s: { ru: "2 предложения по формату — на основе твоих лучших постов.", de: "2 Format-Vorschläge — aus deinen besten Beiträgen." } },
      ],
    },
  };

  // ── interface locales (8) — code badge + native name + localized label ──
  const LOCALE_NAMES = [
    { code: "EN", native: "English", ru: "Английский", de: "Englisch" },
    { code: "RU", native: "Русский", ru: "Русский", de: "Russisch" },
    { code: "UK", native: "Українська", ru: "Украинский", de: "Ukrainisch" },
    { code: "DE", native: "Deutsch", ru: "Немецкий", de: "Deutsch" },
    { code: "ES", native: "Español", ru: "Испанский", de: "Spanisch" },
    { code: "FR", native: "Français", ru: "Французский", de: "Französisch" },
    { code: "IT", native: "Italiano", ru: "Итальянский", de: "Italienisch" },
    { code: "PT", native: "Português", ru: "Португальский", de: "Portugiesisch" },
  ];

  // ── portfolio advisor chat — reuses the /app/advisor vocabulary (chip tones,
  //    suggestion cards, sources line); scope = data across ALL portfolio
  //    profiles. Hero verdict is the pinned ADVISOR[mode] summary above. ──
  const ADVISOR_CHAT = {
    single_brand: {
      starters: [
        { icon: "alert", text: { ru: "Что чинить в первую очередь?", de: "Was zuerst reparieren?" } },
        { icon: "nib", text: { ru: "Где просел темп постинга?", de: "Wo sank das Posting-Tempo?" } },
        { icon: "users", text: { ru: "Какой профиль растёт быстрее?", de: "Welches Profil wächst schneller?" } },
      ],
      turns: [
        {
          q: { ru: "Что требует внимания по портфелю прямо сейчас?", de: "Was braucht im Portfolio gerade Aufmerksamkeit?" },
          paras: [
            { ru: "Две вещи, и обе быстрые. <b>@mara.co</b> выпал из синка — 6 часов без данных, поэтому портфель считается без него. И в <b>@mara.notes</b> копятся <b>7 ответов</b>, старшему уже 3 часа.", de: "Zwei Dinge, beide schnell erledigt. <b>@mara.co</b> ist aus dem Sync gefallen — 6 Stunden ohne Daten, daher rechnet das Portfolio ohne ihn. Und bei <b>@mara.notes</b> stauen sich <b>7 Antworten</b>, die älteste seit 3 Stunden." },
            { ru: "Начал бы с синка: данные целы, нужен только повторный коннект — и профиль вернётся в общий счёт.", de: "Ich würde mit dem Sync starten: die Daten sind da, es braucht nur eine neue Verbindung — dann zählt das Profil wieder mit." },
          ],
          chips: [
            { tone: "down", icon: "alert", text: { ru: "@mara.co · сбой синка", de: "@mara.co · Sync-Fehler" } },
            { tone: "accent", icon: "reply", text: { ru: "7 ответов · @mara.notes", de: "7 Antworten · @mara.notes" } },
            { tone: "down", icon: null, text: { ru: "6 ч без данных", de: "6 Std. ohne Daten" } },
          ],
          sources: { ru: "Профили · Статистика портфеля · Ответы", de: "Profile · Portfolio-Statistik · Antworten" },
          suggest: {
            icon: "alert", tone: "danger",
            t: { ru: "Почини синк @mara.co", de: "Sync von @mara.co reparieren" },
            s: { ru: "6 ч без обновления. Повторный коннект вернёт данные в портфель.", de: "6 Std. ohne Update. Neu verbinden holt die Daten ins Portfolio zurück." },
            primary: { ru: "Открыть @mara.co", de: "@mara.co öffnen" },
            secondary: { ru: "Все ответы", de: "Alle Antworten" },
          },
        },
        {
          q: { ru: "Где просел темп постинга?", de: "Wo sank das Posting-Tempo?" },
          paras: [
            { ru: "В основном на <b>@mara.studio</b> — за неделю всего <b>2 поста</b> против обычных 5. По всему портфелю вышло <b>10 постов</b> против 14 неделей раньше, и почти вся просадка — здесь.", de: "Vor allem bei <b>@mara.studio</b> — nur <b>2 Beiträge</b> diese Woche statt der üblichen 5. Im ganzen Portfolio waren es <b>10 Beiträge</b> gegenüber 14 in der Vorwoche, und fast der ganze Rückgang liegt hier." },
            { ru: "Остальные профили держат темп. Два коротких поста в твоём голосе обычно возвращают ритм быстрее всего.", de: "Die anderen Profile halten das Tempo. Zwei kurze Beiträge in deiner Stimme bringen den Rhythmus meist am schnellsten zurück." },
          ],
          chips: [
            { tone: "down", icon: "nib", text: { ru: "@mara.studio · 2 поста", de: "@mara.studio · 2 Beiträge" } },
            { tone: "down", icon: null, text: { ru: "портфель 10 ← 14", de: "Portfolio 10 ← 14" } },
            { tone: "accent", icon: null, text: { ru: "остальные в норме", de: "Rest im Plan" } },
          ],
          sources: { ru: "Посты · Статистика портфеля", de: "Beiträge · Portfolio-Statistik" },
          suggest: {
            icon: "nib", tone: "accent",
            t: { ru: "Верни 5 постов в неделю на @mara.studio", de: "@mara.studio zurück auf 5 Beiträge/Woche" },
            s: { ru: "Профиль просел до 2 постов. Заведу черновик в твоём голосе.", de: "Auf 2 Beiträge gefallen. Ich lege einen Entwurf in deiner Stimme an." },
            primary: { ru: "Открыть Студию", de: "Studio öffnen" },
            secondary: { ru: "Показать статистику", de: "Statistik zeigen" },
          },
        },
      ],
    },
    multi_brand: {
      starters: [
        { icon: "layers", text: { ru: "Какой бренд ведёт по росту?", de: "Welche Marke führt beim Wachstum?" } },
        { icon: "alert", text: { ru: "Где сбои по брендам?", de: "Wo gibt es Marken-Fehler?" } },
        { icon: "nib", text: { ru: "Что повторить на этой неделе?", de: "Was diese Woche wiederholen?" } },
      ],
      turns: [
        {
          q: { ru: "Как идут бренды в этом месяце?", de: "Wie laufen die Marken diesen Monat?" },
          paras: [
            { ru: "Портфель в плюсе: <b>+596 подписчиков</b> за 30 дней по трём брендам. <b>Mara Lin</b> — лучший по охвату, <b>Northwind</b> только подключил LinkedIn и ещё импортируется.", de: "Das Portfolio wächst: <b>+596 Follower</b> in 30 Tagen über drei Marken. <b>Mara Lin</b> führt bei der Reichweite, <b>Northwind</b> hat gerade LinkedIn verbunden und importiert noch." },
            { ru: "Единственный риск — <b>Field Notes</b>: там один профиль со сбоем синка, и бренд считается без него.", de: "Das einzige Risiko ist <b>Field Notes</b>: dort hat ein Profil einen Sync-Fehler, und die Marke rechnet ohne ihn." },
          ],
          chips: [
            { tone: "up", icon: "users", text: { ru: "+596 за 30 дней", de: "+596 in 30 Tagen" } },
            { tone: "accent", icon: "layers", text: { ru: "3 бренда · 6 профилей", de: "3 Marken · 6 Profile" } },
            { tone: "down", icon: "alert", text: { ru: "Field Notes · 1 сбой", de: "Field Notes · 1 Fehler" } },
          ],
          sources: { ru: "Бренды · Профили · Статистика портфеля", de: "Marken · Profile · Portfolio-Statistik" },
          suggest: {
            icon: "alert", tone: "danger",
            t: { ru: "Почини синк в Field Notes", de: "Sync in Field Notes reparieren" },
            s: { ru: "@mara.co не обновлялся 6 ч. Бренд считается без него.", de: "@mara.co 6 Std. alt. Die Marke rechnet ohne ihn." },
            primary: { ru: "Открыть Field Notes", de: "Field Notes öffnen" },
            secondary: { ru: "Все бренды", de: "Alle Marken" },
          },
        },
        {
          q: { ru: "Что повторить на этой неделе?", de: "Was diese Woche wiederholen?" },
          paras: [
            { ru: "Формат <b>Mara Lin</b>: 7 постов, лучший охват недели. Короткие «разборы ошибок» в твоём голосе тянут заметно выше среднего.", de: "Das Format von <b>Mara Lin</b>: 7 Beiträge, beste Reichweite der Woche. Kurze „Fehler-Analysen“ in deiner Stimme ziehen deutlich über den Schnitt." },
          ],
          chips: [
            { tone: "up", icon: "nib", text: { ru: "Mara Lin · 7 постов", de: "Mara Lin · 7 Beiträge" } },
            { tone: "up", icon: null, text: { ru: "лучший охват недели", de: "beste Reichweite" } },
          ],
          sources: { ru: "Бренды · недавние посты", de: "Marken · letzte Beiträge" },
          suggest: {
            icon: "nib", tone: "accent",
            t: { ru: "Повтори формат Mara Lin", de: "Format von Mara Lin wiederholen" },
            s: { ru: "Заведу черновик в том же голосе и ритме.", de: "Ich lege einen Entwurf im gleichen Ton und Rhythmus an." },
            primary: { ru: "Открыть Студию", de: "Studio öffnen" },
            secondary: { ru: "Открыть Mara Lin", de: "Mara Lin öffnen" },
          },
        },
      ],
    },
  };

  // resolve a {ru,de} pair (or pass through a plain string)
  function L(x, lang) { return (x && typeof x === "object") ? (x[lang] || x.ru) : x; }

  // localization proof rows for the spec table
  const I18N_LONG = [
    { key: "nav.dashboard", en: "Dashboard", ru: "Дашборд", de: "Übersicht" },
    { key: "nav.brands", en: "Brands", ru: "Бренды", de: "Marken" },
    { key: "nav.settings", en: "Account settings", ru: "Настройки аккаунта", de: "Kontoeinstellungen" },
    { key: "switcher.all", en: "All profiles", ru: "Все профили", de: "Alle Profile" },
    { key: "advisor.title", en: "Account advisor", ru: "Советник аккаунта", de: "Konto-Berater" },
    { key: "addBrand", en: "Add brand", ru: "Добавить бренд", de: "Marke hinzufügen" },
    { key: "sync.failed", en: "Sync failed", ru: "Сбой синка", de: "Synchronisierung fehlgeschlagen" },
    { key: "retry", en: "Retry", ru: "Повторить", de: "Erneut versuchen" },
    { key: "expand", en: "Profiles", ru: "Профили", de: "Profile" },
  ];

  window.ACCT = {
    LOCALES, NETWORKS, ACCOUNT, LOGINS, T,
    PROFILES, BRANDS, TOTALS, TASKS, ADVISOR,
    LOCALE_NAMES, ADVISOR_CHAT,
    L, I18N_LONG,
  };
})();
