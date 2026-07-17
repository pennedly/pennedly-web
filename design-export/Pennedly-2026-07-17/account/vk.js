/* variants/vk.js — shared KIT for Account-Dashboard-Variants-SPEC.
   ONE source of atoms + data for all 5 from-scratch concepts (V1…V5).
   Concepts import this and only compose LAYOUT; the DS atoms below are shared.

   Data mirrors GET /api/me/account for tenant "Alex Rivera" (brief JSON):
   2 brands · 4 profiles · 1 disconnected · show_brand_level = true.
   The default scenario is already a rich MIXED state (synced + importing +
   sync-error + disconnected + a no-voice profile), so every concept's default
   render proves most edge states at once.

   Everything is token-driven (ds/tokens.css): ink-on-paper, one accent, both
   themes, NO hardcoded hex. Network marks are real monochrome logos tinted by
   currentColor (Threads live; LinkedIn = "soon"), never the old "@"/"in" text. */
(function () {
  "use strict";

  /* ─────────────────────────── i18n helper ─────────────────────────── */
  function L(x, lang) { return (x && typeof x === "object" && !Array.isArray(x)) ? (x[lang] != null ? x[lang] : x.ru) : x; }

  /* ─────────────────────────── formatters ──────────────────────────── */
  function fmtK(n) {
    if (n == null) return "—";
    if (n < 1000) return "" + n;
    var v = n / 1000;
    var s = v >= 100 ? "" + Math.round(v) : ("" + (Math.round(v * 10) / 10)).replace(".", ",");
    return s + "K";
  }
  function fmtDelta(v) {
    if (v == null) return null;
    var sign = v < 0 ? "\u2212" : "+";
    var a = Math.abs(v);
    var s = a >= 10000 ? fmtK(a) : a.toLocaleString("ru-RU").replace(/[,\u202F]/g, "\u00A0");
    return sign + s;
  }
  function plRu(n, forms) {
    n = Math.abs(n) % 100; var n1 = n % 10;
    if (n > 10 && n < 20) return forms[2];
    if (n1 > 1 && n1 < 5) return forms[1];
    if (n1 === 1) return forms[0];
    return forms[2];
  }

  /* ─────────────────────────── icon set ────────────────────────────── */
  var IC = {
    grid: "<rect x='4' y='4' width='7' height='7' rx='1.6'/><rect x='13' y='4' width='7' height='7' rx='1.6'/><rect x='4' y='13' width='7' height='7' rx='1.6'/><rect x='13' y='13' width='7' height='7' rx='1.6'/>",
    layers: "<path d='M12 4 3 9l9 5 9-5-9-5Z'/><path d='M3 14l9 5 9-5'/>",
    advisor: "<path d='M4 16V7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H9l-4 4v-4Z'/><path d='M8 12.4l2.4-2.4 1.8 1.8L16 8.4'/>",
    settings: "<circle cx='12' cy='12' r='3'/><path d='M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.2 5.2l1.6 1.6M17.2 17.2l1.6 1.6M18.8 5.2l-1.6 1.6M6.8 17.2l-1.6 1.6'/>",
    users: "<circle cx='9' cy='9' r='3.2'/><path d='M3.5 19a5.5 5.5 0 0 1 11 0'/><path d='M16 6.3a3 3 0 0 1 0 5.4M17.5 19a5.5 5.5 0 0 0-3-4.9'/>",
    eye: "<path d='M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z'/><circle cx='12' cy='12' r='2.6'/>",
    nib: "<path d='M4 20 13 11'/><path d='M12 4 20 12 13 11 13 4Z'/>",
    bubble: "<path d='M5 17l-1.5 3.5L8 19h8a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3H7a3 3 0 0 0-3 3v6a3 3 0 0 0 1 2.7Z'/>",
    reply: "<path d='M9 7 4 12l5 5M4 12h9a6 6 0 0 1 6 6v1'/>",
    chart: "<path d='M4 19V5M4 19h16'/><path d='M8 16l3.5-4 3 2.5L19 8'/>",
    audit: "<rect x='5' y='4' width='14' height='17' rx='2'/><path d='M9 4.5h6V7H9Z'/><path d='M8.5 12.5l2 2 4-4.5'/>",
    up: "<path d='M12 19V6M6 11l6-6 6 6'/>",
    down: "<path d='M12 5v13M6 13l6 6 6-6'/>",
    "arrow-right": "<path d='M5 12h14M13 6l6 6-6 6'/>",
    "arrow-up-right": "<path d='M7 17 17 7M8 7h9v9'/>",
    plus: "<path d='M12 5v14M5 12h14'/>",
    undo: "<path d='M9 7 5 11l4 4'/><path d='M5 11h9a5 5 0 0 1 0 10h-3'/>",
    check: "<path d='M4.5 12.5 9.5 17.5 19.5 6.5'/>",
    "chev-right": "<path d='M9 6l6 6-6 6'/>",
    "chev-down": "<path d='M6 9l6 6 6-6'/>",
    "chev-up": "<path d='M6 15l6-6 6 6'/>",
    logout: "<path d='M14 7V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2'/><path d='M10 12h10M17 9l3 3-3 3'/>",
    moon: "<path d='M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z'/>",
    sun: "<circle cx='12' cy='12' r='4'/><path d='M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19'/>",
    alert: "<path d='M12 4 2.5 20.5h19L12 4Z'/><path d='M12 10v4'/><circle cx='12' cy='17.2' r='.4'/>",
    send: "<path d='M5 12h13M12 5l7 7-7 7'/>",
    sparkle: "<path d='M12 4l1.5 4.6L18 10l-4.5 1.4L12 16l-1.5-4.6L6 10l4.5-1.4L12 4Z'/>",
    bolt: "<path d='M13 3 5 13h6l-1 8 8-10h-6l1-8Z'/>",
    clock: "<circle cx='12' cy='12' r='8.5'/><path d='M12 7.5V12l3 2'/>",
    plug: "<path d='M9 3v5M15 3v5M6 8h12v2a6 6 0 0 1-12 0V8ZM12 16v5'/>",
    mic: "<rect x='9' y='3' width='6' height='11' rx='3'/><path d='M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21'/>",
    dot: "<circle cx='12' cy='12' r='4'/>",
    search: "<circle cx='11' cy='11' r='6.5'/><path d='m21 21-4.5-4.5'/>",
    bell: "<path d='M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z'/><path d='M9.5 19a2.5 2.5 0 0 0 5 0'/>",
    inbox: "<path d='M4 13h4l1.5 3h5L16 13h4'/><path d='M4 13 6 5h12l2 8v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z'/>",
    target: "<circle cx='12' cy='12' r='8.5'/><circle cx='12' cy='12' r='4.2'/><circle cx='12' cy='12' r='.6'/>",
  };
  function ic(name, size) {
    size = size || 14;
    return "<svg class='v-ic' width='" + size + "' height='" + size + "' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.75' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'>" + (IC[name] || "") + "</svg>";
  }

  /* ─────────────────── network marks (real logos, monochrome) ─────────── */
  var NETLOGO = {
    // Threads (Bootstrap Icons, MIT) — tinted with currentColor, never "@"
    threads: "M6.321 6.016c-.27-.18-1.166-.802-1.166-.802.756-1.081 1.753-1.502 3.132-1.502.975 0 1.803.327 2.394.948s.928 1.509 1.005 2.644q.492.207.905.484c1.109.745 1.719 1.86 1.719 3.137 0 2.716-2.226 5.075-6.256 5.075C4.594 16 1 13.987 1 7.994 1 2.034 4.482 0 8.044 0 9.69 0 13.55.243 15 5.036l-1.36.353C12.516 1.974 10.163 1.43 8.006 1.43c-3.565 0-5.582 2.171-5.582 6.79 0 4.143 2.254 6.343 5.63 6.343 2.777 0 4.847-1.443 4.847-3.556 0-1.438-1.208-2.127-1.27-2.127-.236 1.234-.868 3.31-3.644 3.31-1.618 0-3.013-1.118-3.013-2.582 0-2.09 1.984-2.847 3.55-2.847.586 0 1.294.04 1.663.114 0-.637-.54-1.728-1.9-1.728-1.25 0-1.566.405-1.967.868Zm2.395 2.174c-2.04 0-2.304.87-2.304 1.416 0 .878 1.043 1.168 1.6 1.168 1.02 0 2.067-.282 2.232-2.423a6.2 6.2 0 0 0-1.528-.161",
    // LinkedIn (Bootstrap Icons, MIT) — appears only as "soon" in the picker
    linkedin: "M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854zm4.943 12.248V6.169H2.542v7.225zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248S2.4 3.226 2.4 3.934c0 .694.521 1.248 1.327 1.248zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016l.016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225z",
  };
  function netLogo(netId, size) {
    size = size || 12;
    return "<svg class='v-netlogo' width='" + size + "' height='" + size + "' viewBox='0 0 16 16' fill='currentColor' aria-hidden='true'><path d='" + (NETLOGO[netId] || "") + "'/></svg>";
  }

  /* ─────────────────────────── copy (ru + de) ──────────────────────── */
  var T = {
    ru: {
      account: "Аккаунт", dashboard: "Дашборд", brands: "Бренды", advisor: "Советник",
      settings: "Настройки", accSettings: "Настройки аккаунта", logout: "Выйти",
      switchTheme: "Тема", switchAccount: "Сменить аккаунт",
      allProfiles: "Все профили", jumpProfile: "Перейти к профилю", connectProfile: "Подключить профиль",
      profilesW: ["профиль", "профиля", "профилей"], brandsW: ["бренд", "бренда", "брендов"],
      followers: "Подписчики", views: "Просмотры", posts: "Посты", replies: "Ответы",
      subAll: "по портфелю", sub7d: "за 7 дней", subWeek: "на неделе", subWait: "к разбору",
      per30: "за 30 дней", perWeek: "за неделю",
      needsYou: "Требует тебя", resolveAll: "Разобрать всё", nothingPending: "Всё разобрано",
      tSync: ["сбой синка", "сбоя синка", "сбоев синка"], tReply: ["ответ", "ответа", "ответов"],
      tDraft: ["черновик", "черновика", "черновиков"], tAudit: ["аудит", "аудита", "аудитов"],
      fixSync: "Починить синк", reviewReplies: "Разобрать ответы", confirmDrafts: "Подтвердить черновики", viewAudits: "Открыть аудиты",
      advTitle: "Советник аккаунта", advScope: "По всему портфелю", advBasis: "На основе",
      advAsk: "Спросите о портфеле…", advOpen: "Открыть советника", advReco: "Рекомендации",
      advThinTitle: "Пока рано делать вывод", advDetailMore: "Разбор",
      profiles: "Профили", secProfiles: "Профили", secBrands: "Бренды", secChannels: "Каналы",
      openStudio: "Студия", stats: "Статистика",
      synced: "Синхронизирован", refreshed: "Обновлено", syncError: "Сбой синка", retry: "Повторить",
      importing: "Импортируем историю", importOf: "постов из", importComments: "новых комментариев",
      importEta: "≈ пара минут",
      disconnected: "Отключён", reconnect: "Переподключить", connectMore: "Подключить ещё аккаунт",
      hasVoice: "Голос настроен", noVoice: "Настроить голос",
      addBrand: "Добавить бренд", addProfile: "Добавить профиль", addBrandSub: "Отдельный голос и аналитика",
      allSynced: "Все синхронизированы", nImporting: "импортируется", nError: "сбой синка",
      networkLive: "Живая сеть", networkSoon: "Скоро", pickNetwork: "Выберите сеть",
      goodMorning: "С возвращением", portfolioGlance: "Портфель одним взглядом",
      brandPersonal: "Личный бренд", brandPub: "Издание", brandClient: "Клиент",
      expand: "Профили", collapse: "Свернуть", open: "Открыть",
      loading: "Загрузка…", live: "в реальном времени", updatedDaily: "обновлено ежедневно",
      command: "Пульт портфеля", tester: "Тестер",
    },
    de: {
      account: "Konto", dashboard: "Übersicht", brands: "Marken", advisor: "Berater",
      settings: "Einstellungen", accSettings: "Kontoeinstellungen", logout: "Abmelden",
      switchTheme: "Design", switchAccount: "Konto wechseln",
      allProfiles: "Alle Profile", jumpProfile: "Zu Profil wechseln", connectProfile: "Profil verbinden",
      profilesW: ["Profil", "Profile", "Profile"], brandsW: ["Marke", "Marken", "Marken"],
      followers: "Follower", views: "Aufrufe", posts: "Beiträge", replies: "Antworten",
      subAll: "im Portfolio", sub7d: "letzte 7 Tage", subWeek: "diese Woche", subWait: "zu klären",
      per30: "in 30 Tagen", perWeek: "diese Woche",
      needsYou: "Braucht dich", resolveAll: "Alles erledigen", nothingPending: "Alles erledigt",
      tSync: ["Sync-Fehler", "Sync-Fehler", "Sync-Fehler"], tReply: ["Antwort", "Antworten", "Antworten"],
      tDraft: ["Entwurf", "Entwürfe", "Entwürfe"], tAudit: ["Audit", "Audits", "Audits"],
      fixSync: "Sync reparieren", reviewReplies: "Antworten klären", confirmDrafts: "Entwürfe bestätigen", viewAudits: "Audits öffnen",
      advTitle: "Konto-Berater", advScope: "Über das gesamte Portfolio", advBasis: "Basis",
      advAsk: "Frag zu deinem Portfolio…", advOpen: "Berater öffnen", advReco: "Empfehlungen",
      advThinTitle: "Noch zu früh für ein Urteil", advDetailMore: "Analyse",
      profiles: "Profile", secProfiles: "Profile", secBrands: "Marken", secChannels: "Kanäle",
      openStudio: "Studio", stats: "Statistik",
      synced: "Synchronisiert", refreshed: "Aktualisiert", syncError: "Synchronisierung fehlgeschlagen", retry: "Erneut versuchen",
      importing: "Verlauf wird importiert", importOf: "Beiträge von", importComments: "neue Kommentare",
      importEta: "≈ ein paar Minuten",
      disconnected: "Getrennt", reconnect: "Erneut verbinden", connectMore: "Weiteres Konto verbinden",
      hasVoice: "Stimme eingerichtet", noVoice: "Stimme einrichten",
      addBrand: "Marke hinzufügen", addProfile: "Profil hinzufügen", addBrandSub: "Eigene Stimme und Auswertung",
      allSynced: "Alle synchronisiert", nImporting: "wird importiert", nError: "Sync-Fehler",
      networkLive: "Live-Netzwerk", networkSoon: "Demnächst", pickNetwork: "Netzwerk wählen",
      goodMorning: "Willkommen zurück", portfolioGlance: "Portfolio auf einen Blick",
      brandPersonal: "Persönliche Marke", brandPub: "Publikation", brandClient: "Kunde",
      expand: "Profile", collapse: "Einklappen", open: "Öffnen",
      loading: "Wird geladen…", live: "in Echtzeit", updatedDaily: "täglich aktualisiert",
      command: "Portfolio-Kommandozentrale", tester: "Tester",
    },
  };
  function t(lang) { return T[lang] || T.ru; }

  /* ─────────────────────────── account + networks ──────────────────── */
  var ACCOUNT = { name: "Alex Rivera", email: "alex@pennedly.com", plan: "PRO", mono: "AR" };
  var NETWORKS = {
    threads: { id: "threads", label: "Threads", status: "live" },
    linkedin: { id: "linkedin", label: "LinkedIn", status: "soon" },
  };

  /* ─────────────────────────── profiles (brief JSON) ───────────────── */
  var AV = "assets/avatars/";
  var PROFILES = {
    mara: {
      id: 10, key: "mara", brand: "mara", network: "threads", handle: "@mara.lin", name: "Mara Lin",
      avatar: AV + "mara.png", mono: "ML", sync: "synced", has_voice: true,
      refreshed: { ru: "2 ч назад", de: "vor 2 Std." },
      followers: 22000, followers_delta: 800, views_7d: 120000, posts_week: 4, replies: 5,
    },
    notes: {
      id: 11, key: "notes", brand: "mara", network: "threads", handle: "@mara.notes", name: null,
      avatar: null, mono: "MN", sync: "importing", has_voice: false,
      import: { posts: 42, history_posts: 115, new_comments: 6, pct: 37 },
      followers: null, views_7d: 0, posts_week: 0, replies: 0,
    },
    co: {
      id: 12, key: "co", brand: "field", network: "threads", handle: "@field.co", name: "Field.co",
      avatar: AV + "fieldnotes.png", mono: "FC", sync: "error", has_voice: true,
      followers: 17210, followers_delta: null, views_7d: 82000, posts_week: 3, replies: 2,
    },
    old: {
      id: 13, key: "old", brand: "field", network: "threads", handle: "@field.old", name: "Field (old)",
      avatar: null, mono: "FO", sync: "disconnected", disconnected_at: "2026-07-01",
    },
    // extra synced profile used only by the "1 brand · many profiles" scenario
    studio: {
      id: 14, key: "studio", brand: "mara", network: "threads", handle: "@mara.studio", name: "Mara Studio",
      avatar: AV + "studio.png", mono: "MS", sync: "synced", has_voice: true,
      refreshed: { ru: "3 ч назад", de: "vor 3 Std." },
      followers: 8900, followers_delta: 210, views_7d: 64000, posts_week: 5, replies: 1,
    },
  };

  var BRANDS = {
    mara: {
      id: 1, key: "mara", name: "Mara Lin", mono: "ML", kind: "personal", networks: ["threads"],
      profiles: ["mara", "notes"],
      stats: { followers: 31000, followers_delta: 800, views_7d: 180000, posts_week: 6, replies: 5 },
      counts: { synced: 1, importing: 1, error: 0, disconnected: 0 },
    },
    field: {
      id: 2, key: "field", name: "Field Notes", mono: "FN", kind: "pub", networks: ["threads"],
      profiles: ["co", "old"],
      stats: { followers: 17210, followers_delta: null, views_7d: 82000, posts_week: 3, replies: 2 },
      counts: { synced: 0, importing: 0, error: 1, disconnected: 1 },
    },
  };

  // portfolio totals — precomputed by the server over LIVE profiles (brief JSON)
  var TOTALS = { followers: 48210, followers_delta: 1240, views_7d: 262000, posts_week: 9, replies: 7, importing_count: 0 };
  var TASKS = { drafts: 3, replies: 7, sync: 1, audits: 2 };

  /* ─────────────────────────── advisor (verdict + thin) ────────────── */
  var ADVISOR = {
    verdict: {
      verdict: {
        ru: "@field.co тянет портфель вниз — на нём просели просмотры.",
        de: "@field.co zieht das Portfolio runter — dort sind die Aufrufe eingebrochen.",
      },
      detail: {
        ru: "За 30 дней портфель прибавил <b>+1&nbsp;240 подписчиков</b>, но почти весь рост дали профили Mara&nbsp;Lin. У <b>@field.co</b> просмотры за неделю упали на 18% — плюс на профиле сбой синка, поэтому свежие данные приходят с задержкой.",
        de: "In 30 Tagen kamen <b>+1&nbsp;240 Follower</b> dazu, fast alles davon über die Mara&nbsp;Lin-Profile. Bei <b>@field.co</b> sind die Aufrufe diese Woche um 18% gefallen — dazu ein Sync-Fehler, daher kommen frische Daten verzögert.",
      },
      chips: [
        { tone: "down", icon: "eye", text: { ru: "\u221218% за неделю", de: "\u221218% diese Woche" } },
        { tone: "accent", icon: "reply", text: { ru: "7 ответов ждут", de: "7 Antworten offen" } },
      ],
      grounded: { ru: "просмотры @field.co за 7д · очередь ответов портфеля", de: "Aufrufe @field.co (7T) · Antwort-Queue des Portfolios" },
      recos: [
        { tone: "danger", icon: "alert", to: "co",
          t: { ru: "Почини синк @field.co", de: "Sync von @field.co reparieren" },
          s: { ru: "6 ч без обновления. Данные целы — нужен повторный коннект.", de: "6 Std. ohne Update. Daten sind da — neu verbinden." } },
        { tone: "danger", icon: "nib", to: "co",
          t: { ru: "Верни темп на @field.co", de: "Tempo bei @field.co zurückholen" },
          s: { ru: "Просел до 3 постов/нед — короткий пост в голосе бренда поднимет охват.", de: "Auf 3 Beiträge/Wo. gefallen — ein kurzer Beitrag hebt die Reichweite." } },
        { tone: "accent", icon: "reply", to: "replies",
          t: { ru: "Разбери 7 ответов по портфелю", de: "7 Portfolio-Antworten klären" },
          s: { ru: "Окно вовлечённости ещё открыто — быстрый рост на старте.", de: "Das Fenster ist noch offen — schneller Hebel." } },
      ],
    },
    thin: {
      title: { ru: "Пока рано делать вывод по портфелю", de: "Noch zu früh für ein Portfolio-Urteil" },
      body: {
        ru: "Профили ещё набирают историю. Как накопится за пару недель — дам конкретику по росту и рискам. Пока помогу с базовой настройкой и первыми шагами.",
        de: "Die Profile sammeln noch Verlauf. In ein paar Wochen wird der Rat konkret — zu Wachstum und Risiken. Bis dahin helfe ich beim Setup und den ersten Schritten.",
      },
    },
    // all profiles disconnected — honest "not logged out" invitation, no fake verdict
    off: {
      title: { ru: "Все профили отключены", de: "Alle Profile getrennt" },
      body: {
        ru: "Аккаунт и данные на месте — это не выход из системы. Переподключи хотя бы один профиль, и советник снова даст вывод по портфелю. Голоса и история сохранены.",
        de: "Konto und Daten sind da — das ist keine Abmeldung. Verbinde mindestens ein Profil neu, dann liefert der Berater wieder ein Portfolio-Urteil. Stimmen und Verlauf bleiben erhalten.",
      },
    },
  };

  /* ─────────────────────────── scenarios ───────────────────────────── */
  // Each scenario = which brands/profiles are present + derived flags.
  var SCENARIOS = {
    two_brands: {
      label: { ru: "2 бренда · реальные данные", de: "2 Marken · echte Daten" },
      brands: ["mara", "field"], show_brand_level: true,
      scope: { profiles_count: 4, brands_count: 2, disconnected_count: 1 },
      totals: TOTALS, tasks: TASKS, advisor: "verdict",
    },
    single_brand: {
      label: { ru: "1 бренд · N профилей", de: "1 Marke · N Profile" },
      brands: ["mara_plus"], show_brand_level: false,
      // Mara Lin brand with 3 profiles (adds @mara.studio)
      profiles: ["mara", "studio", "notes"],
      scope: { profiles_count: 3, brands_count: 1, disconnected_count: 0 },
      totals: { followers: 30900, followers_delta: 1010, views_7d: 184000, posts_week: 9, replies: 6, importing_count: 1 },
      tasks: { drafts: 2, replies: 6, sync: 0, audits: 1 }, advisor: "verdict",
    },
    one_profile: {
      label: { ru: "1 бренд · 1 профиль (новый)", de: "1 Marke · 1 Profil (neu)" },
      brands: ["mara_one"], show_brand_level: false, profiles: ["mara"],
      scope: { profiles_count: 1, brands_count: 1, disconnected_count: 0 },
      totals: { followers: 22000, followers_delta: 800, views_7d: 120000, posts_week: 4, replies: 5, importing_count: 0 },
      tasks: { drafts: 0, replies: 5, sync: 0, audits: 1 }, advisor: "thin",
    },
    all_off: {
      label: { ru: "Все профили отключены", de: "Alle Profile getrennt" },
      brands: ["field_off"], show_brand_level: false, profiles: ["mara_off", "co_off", "old"],
      scope: { profiles_count: 3, brands_count: 1, disconnected_count: 3 },
      totals: { followers: null, followers_delta: null, views_7d: null, posts_week: null, replies: 0, importing_count: 0 },
      tasks: {}, advisor: "thin",
    },
    loading: { label: { ru: "Загрузка (скелет)", de: "Laden (Skeleton)" }, loading: true },
  };

  // profile variants for the all-off scenario (kept out of the main map)
  var OFF_PROFILES = {
    mara_off: Object.assign({}, PROFILES.mara, { sync: "disconnected", disconnected_at: "2026-07-05" }),
    co_off: Object.assign({}, PROFILES.co, { sync: "disconnected", disconnected_at: "2026-07-01" }),
  };
  function profile(key) { return OFF_PROFILES[key] || PROFILES[key]; }

  // resolve the ordered profile list a scenario shows (flat)
  function scenarioProfiles(scn) {
    if (scn.profiles) return scn.profiles;
    // brand-level scenario → flatten brands' profiles
    var out = [];
    (scn.brands || []).forEach(function (bk) {
      var b = BRANDS[bk]; if (b) out = out.concat(b.profiles);
    });
    return out;
  }

  /* ─────────────────────────── shared atoms ────────────────────────── */
  function avatar(p, size, opts) {
    opts = opts || {}; size = size || 40;
    var inner = p.avatar
      ? "<img src='" + p.avatar + "' alt='' loading='lazy'/>"
      : "<span class='v-av-mono'>" + (p.mono || "?") + "</span>";
    var badge = opts.noBadge ? "" :
      "<span class='v-av-net v-av-net--" + p.network + "'>" + netLogo(p.network, Math.max(10, Math.round(size * 0.28))) + "</span>";
    var cls = "v-av" + (opts.dim ? " v-av--dim" : "") + (opts.cls ? " " + opts.cls : "");
    return "<span class='" + cls + "' style='--av:" + size + "px'>" + inner + badge + "</span>";
  }

  function deltaEl(v) {
    var d = fmtDelta(v);
    if (d == null) return "";
    var down = v < 0;
    return "<span class='v-delta v-delta--" + (down ? "down" : "up") + "'>" + ic(down ? "down" : "up", 11) + "<span>" + d.replace(/^[+\u2212]/, "") + "</span></span>";
  }

  function chip(c, lang) {
    return "<span class='v-chip v-chip--" + c.tone + "'>" + (c.icon ? ic(c.icon, 12) : "") + "<span class='v-chip-t'>" + L(c.text, lang) + "</span></span>";
  }

  function voiceTag(p, lang, opts) {
    opts = opts || {};
    if (p.has_voice) {
      if (opts.hideOnHas) return "";
      return "<span class='v-voice v-voice--on'>" + ic("check", 11) + t(lang).hasVoice + "</span>";
    }
    return "<button class='v-voice v-voice--off'>" + ic("mic", 12) + t(lang).noVoice + "</button>";
  }

  // one metric cell (label + value + optional delta). No data → dash only.
  function metric(label, icon, value, opts) {
    opts = opts || {};
    var noData = value == null;
    var v = noData ? "—" : (typeof value === "number" ? fmtK(value) : value);
    var extra = (!noData && opts.delta != null) ? deltaEl(opts.delta) : "";
    var attn = opts.attention ? " v-m--attention" : "";
    var sz = opts.size ? " v-m--" + opts.size : "";
    return "<div class='v-m" + attn + sz + "'>" +
      "<span class='v-m-lab'>" + (icon ? ic(icon, 11) : "") + "<span class='v-m-labtxt'>" + label + "</span></span>" +
      "<span class='v-m-row'><span class='v-m-val'>" + v + "</span>" + extra + "</span></div>";
  }

  // the four portfolio totals as an array of {key,label,icon,value,sub,delta,attention}
  function totalsSpec(scope, lang) {
    var T0 = scope.totals || TOTALS, tt = t(lang);
    return [
      { key: "followers", label: tt.followers, icon: "users", value: T0.followers, sub: tt.subAll, delta: T0.followers_delta },
      { key: "views", label: tt.views, icon: "eye", value: T0.views_7d, sub: tt.sub7d },
      { key: "posts", label: tt.posts, icon: "nib", value: T0.posts_week, sub: tt.subWeek },
      { key: "replies", label: tt.replies, icon: "bubble", value: T0.replies, sub: tt.subWait, attention: true },
    ];
  }

  // scale line "N профилей · M брендов · Threads"
  function scaleLine(scope, lang) {
    var s = scope.scope || scope, tt = t(lang);
    var parts = [s.profiles_count + "\u00A0" + plW(s.profiles_count, tt.profilesW, lang)];
    if (s.brands_count >= 2) parts.push(s.brands_count + "\u00A0" + plW(s.brands_count, tt.brandsW, lang));
    parts.push("Threads");
    return parts.join(" · ");
  }
  function plW(n, forms, lang) { return lang === "de" ? (n === 1 ? forms[0] : forms[1]) : plRu(n, forms); }

  // "Needs you" items present (drops empty). Returns [{type,n,label,cta,icon,tone}]
  function needsItems(tasks, lang) {
    var tt = t(lang), out = [];
    if (tasks.sync) out.push({ type: "sync", n: tasks.sync, icon: "alert", tone: "danger", cta: tt.fixSync, word: tt.tSync });
    if (tasks.replies) out.push({ type: "reply", n: tasks.replies, icon: "reply", tone: "accent", cta: tt.reviewReplies, word: tt.tReply });
    if (tasks.drafts) out.push({ type: "draft", n: tasks.drafts, icon: "nib", tone: "ink", cta: tt.confirmDrafts, word: tt.tDraft });
    if (tasks.audits) out.push({ type: "audit", n: tasks.audits, icon: "audit", tone: "ink", cta: tt.viewAudits, word: tt.tAudit });
    return out;
  }

  // import banner (uses import-banner.css)
  function importBanner(p, lang) {
    var tt = t(lang), im = p.import;
    return "<div class='import-banner import-banner--syncing'>" +
      "<span class='ib-mark'><span class='ib-spinner'></span></span>" +
      "<div class='ib-body'><div class='ib-title'>" + tt.importing + "</div>" +
      "<div class='ib-sub'><b>" + im.posts + "</b> " + tt.importOf + " <b>" + im.history_posts + "</b> · <b>" + im.new_comments + "</b> " + tt.importComments + "</div>" +
      "<div class='ib-bar'><div class='ib-bar-fill' style='width:" + im.pct + "%'></div></div></div>" +
      "<span class='ib-since'>" + tt.importEta + "</span></div>";
  }

  // sync status line (small)
  function syncLine(p, lang) {
    var tt = t(lang);
    if (p.sync === "error") return "<span class='v-sync v-sync--error'><span class='v-sync-dot'></span>" + tt.syncError + "</span>";
    if (p.sync === "importing") return "<span class='v-sync v-sync--imp'><span class='v-sync-dot'></span>" + tt.importing + "</span>";
    if (p.sync === "disconnected") return "<span class='v-sync v-sync--off'><span class='v-sync-dot'></span>" + tt.disconnected + "</span>";
    return "<span class='v-sync'><span class='v-sync-dot'></span>" + tt.refreshed + " " + L(p.refreshed, lang) + "</span>";
  }

  function brandKind(b, lang) {
    var tt = t(lang);
    return b.kind === "personal" ? tt.brandPersonal : b.kind === "pub" ? tt.brandPub : tt.brandClient;
  }

  // resolve a scenario key → normalized context used by shell + concepts
  function resolve(key) {
    var scn = SCENARIOS[key] || SCENARIOS.two_brands;
    var r = {
      key: key, label: scn.label, loading: !!scn.loading,
      show_brand_level: !!scn.show_brand_level, scope: scn.scope || {},
      totals: scn.totals || TOTALS, tasks: scn.tasks || {}, advisor: scn.advisor || "verdict",
    };
    var pkeys = scenarioProfiles(scn);
    r.profileKeys = pkeys;
    r.profiles = pkeys.map(profile);
    r.brands = r.show_brand_level ? (scn.brands || []).map(function (bk) { return BRANDS[bk]; }).filter(Boolean) : [];
    // switcher groups: [{brand?, profiles:[objs]}]
    if (r.show_brand_level && r.brands.length) {
      r.groups = r.brands.map(function (b) { return { brand: b, profiles: b.profiles.map(profile) }; });
    } else {
      r.groups = [{ brand: null, profiles: r.profiles }];
    }
    return r;
  }

  /* ─────────────────────────── exports ─────────────────────────────── */
  window.VK = {
    resolve,
    L, fmtK, fmtDelta, plRu, plW, ic, netLogo, t, T,
    ACCOUNT, NETWORKS, PROFILES, BRANDS, TOTALS, TASKS, ADVISOR, SCENARIOS,
    profile, scenarioProfiles,
    avatar, deltaEl, chip, voiceTag, metric, totalsSpec, scaleLine,
    needsItems, importBanner, syncLine, brandKind,
  };
})();
