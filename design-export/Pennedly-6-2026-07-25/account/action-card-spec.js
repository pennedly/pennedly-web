/* account/action-card-spec.js — populates Advisor-Action-Card-SPEC.html.

   ONE reusable "action card" (.adv-act) with typed content — the advisor's
   "apply-in-one-click" layer over the platform. The advisor answers in prose AND
   attaches a card with a preview of what changes + one Apply button. The click
   runs an existing platform operation. This doc renders the SAME body on 5 types
   × every state, both themes, desktop + mobile (390 / 320), ru + de, plus the
   "several cards in one reply" case and a ?demo=1 playground.

   Truth: mirrors src/components/advisor/AdvisorParts.tsx (bubbles, data-chips,
   "Open in Studio" hint cards) — the action card is a heavier sibling of that
   hint. Reuses the account chat vocabulary (account-screens.js .adv-*, window.ACCX)
   and the shared data (account-data.js window.ACCT). */
(function () {
  "use strict";
  var C = window.ACCT, ACC = window.ACC, X = window.ACCX;
  var L = C.L;
  var DEFAULT_LANG = "ru";

  /* ── icon superset (24-grid, 1.8 stroke) — falls back to X.xic → ACC.ic ── */
  var AP = {
    routine:  "<path d='M17 2l4 4-4 4'/><path d='M3 11V9a4 4 0 0 1 4-4h14'/><path d='M7 22l-4-4 4-4'/><path d='M21 13v2a4 4 0 0 1-4 4H3'/>",
    calendar: "<rect x='4' y='5' width='16' height='16' rx='2'/><path d='M4 9.5h16M8 3v4M16 3v4'/>",
    tag:      "<path d='M3.6 12.4 11 5A2 2 0 0 1 12.4 4.4H18A1.7 1.7 0 0 1 19.7 6v5.6a2 2 0 0 1-.6 1.4l-7.4 7.4a1.7 1.7 0 0 1-2.4 0l-5.7-5.6a1.7 1.7 0 0 1 0-2.4Z'/><circle cx='15.3' cy='8.7' r='1.2'/>",
    bolt:     "<path d='M13 2 4 14h7l-1 8 9-12h-7l1-8Z'/>",
    sliders:  "<path d='M4 8h9M17 8h3M4 16h3M11 16h9'/><circle cx='15' cy='8' r='2.1'/><circle cx='9' cy='16' r='2.1'/>",
    retry:    "<path d='M20.5 12a8.5 8.5 0 1 1-2.6-6.1'/><path d='M20.5 4v5h-5'/>",
    x:        "<path d='M6 6l12 12M18 6 6 18'/>",
    gauge:    "<path d='M4 17.5a8 8 0 0 1 16 0'/><path d='M12 17.5l4.2-4.6'/><circle cx='12' cy='17.7' r='0.6'/>",
    eye:      "<path d='M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z'/><circle cx='12' cy='12' r='2.6'/>",
  };
  function aic(n, s) {
    s = s || 14;
    if (AP[n]) return "<svg width='" + s + "' height='" + s + "' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'>" + AP[n] + "</svg>";
    return X.xic(n, s);
  }

  /* ── neutral network mark (letterform, never a third-party logo) ── */
  function netGlyph(network) { var n = C.NETWORKS[network] || C.NETWORKS.threads; return n.glyph; }
  function actAvatar(p) {
    var A = "../assets/avatars/";
    var inner = p.avatar ? "<img src='" + A + p.avatar + "' alt=''/>" : "<span class='mono'>" + (p.mono || "•") + "</span>";
    var net = "<span class='adv-act-net adv-act-net--" + p.network + "' title='" + (C.NETWORKS[p.network] || {}).label + "'>" + netGlyph(p.network) + "</span>";
    return "<span class='adv-act-av'>" + inner + net + "</span>";
  }

  /* ════════════════════ THE ACTION-CARD CATALOG (5 types) ════════════════════
     First set; grows. Every field mirrors the actions[] contract. Honesty rule:
     render only the fields present — no target → no profile row; no grounded →
     no "grounded" line; change present → before/after pair. */
  var CARDS = {
    routine: {
      icon: "routine",
      kind: { ru: "Рутина", de: "Routine" },
      q: { ru: "постить 3×/день про рыбалку в разное время", de: "3×/Tag übers Angeln zu wechselnden Zeiten posten" },
      intro: { ru: "Собрал это в повторяющуюся рутину — держит ритм за тебя.", de: "Ich habe daraus eine wiederkehrende Routine gebaut — sie hält den Rhythmus für dich." },
      title: { ru: "Посты про рыбалку", de: "Beiträge übers Angeln" },
      summary: [
        { icon: "clock", text: { ru: "3 поста в день · ~9:00, 14:00, 20:00", de: "3 Beiträge/Tag · ~9:00, 14:00, 20:00" } },
        { icon: "tag",   text: { ru: "Тема: рыбалка", de: "Thema: Angeln" } },
        { icon: "nib",   text: { ru: "В голосе аккаунта", de: "In der Stimme des Kontos" } },
      ],
      warn: { ru: "Поднимет лимит постов до 3 в день.", de: "Hebt das Beitragslimit auf 3 pro Tag an." },
      mode: "review",
      mode_note: { ru: "<b>На ревью:</b> каждый пост уходит черновиком на подтверждение.", de: "<b>Zur Prüfung:</b> jeder Beitrag geht als Entwurf zur Bestätigung." },
      apply: { ru: "Создать рутину", de: "Routine erstellen" },
      link: { ru: "Открыть в Автопилоте", de: "In Autopilot öffnen" },
      done: { ru: "Рутина создана — <b>3 поста/день</b>, черновиками", de: "Routine erstellt — <b>3 Beiträge/Tag</b>, als Entwürfe" },
      target: "studio", configurable: true,
    },
    auto_replies: {
      icon: "reply",
      kind: { ru: "Автоответы", de: "Auto-Antworten" },
      q: { ru: "отвечай только на вопросы, но не на смайлики", de: "antworte nur auf Fragen, nicht auf Emojis" },
      intro: { ru: "Настроил автоответы под это правило — можно включить сейчас.", de: "Ich habe Auto-Antworten nach dieser Regel vorbereitet — jetzt aktivierbar." },
      title: { ru: "Автоответы на вопросы", de: "Auto-Antworten auf Fragen" },
      summary: [
        { icon: "reply",  text: { ru: "Только на вопросы", de: "Nur auf Fragen" } },
        { icon: "gauge",  text: { ru: "До 10 ответов в день", de: "Bis zu 10 Antworten pro Tag" } },
        { icon: "x",      text: { ru: "Пропускать пустые реакции (смайлы)", de: "Leere Reaktionen (Emojis) überspringen" } },
      ],
      mode: "config",
      mode_note: { ru: "<b>Применится сразу</b> · откат в настройках ответов.", de: "<b>Sofort aktiv</b> · rückgängig in den Antwort-Einstellungen." },
      apply: { ru: "Включить", de: "Aktivieren" },
      link: { ru: "Открыть ответы", de: "Antworten öffnen" },
      done: { ru: "Автоответы включены — <b>на вопросы, до 10/день</b>", de: "Auto-Antworten aktiv — <b>auf Fragen, bis 10/Tag</b>" },
      target: "notes", configurable: true,
    },
    voice_rule: {
      icon: "nib",
      kind: { ru: "Правило голоса", de: "Stimmregel" },
      q: { ru: "пиши короче и без смайликов", de: "schreib kürzer und ohne Emojis" },
      intro: { ru: "Добавлю это правило в Голос — оно применится к новым постам.", de: "Ich füge diese Regel der Stimme hinzu — sie gilt für neue Beiträge." },
      title: { ru: "Короче и без эмодзи", de: "Kürzer und ohne Emojis" },
      change: {
        before: { ru: "Обычная длина · эмодзи ок", de: "Normale Länge · Emojis ok" },
        after:  { ru: "Короче · без эмодзи", de: "Kürzer · ohne Emojis" },
      },
      mode: "config",
      mode_note: { ru: "<b>Применится сразу</b> · откат в разделе «Голос».", de: "<b>Sofort aktiv</b> · rückgängig unter „Stimme“." },
      apply: { ru: "Применить", de: "Anwenden" },
      link: { ru: "Открыть Голос", de: "Stimme öffnen" },
      done: { ru: "Правило добавлено в Голос — <b>короче, без эмодзи</b>", de: "Regel zur Stimme hinzugefügt — <b>kürzer, ohne Emojis</b>" },
      target: "mara", configurable: true,
    },
    schedule_post: {
      icon: "calendar",
      kind: { ru: "Пост", de: "Beitrag" },
      q: { ru: "напиши пост про запуск и поставь на вторник 18:00", de: "schreib einen Launch-Beitrag und plane ihn für Dienstag 18:00" },
      intro: { ru: "Набросал черновик в твоём голосе и поставил в очередь.", de: "Entwurf in deiner Stimme geschrieben und eingeplant." },
      title: { ru: "Пост про запуск", de: "Beitrag zum Launch" },
      draft: { ru: "Запускаем новую рубрику — короткие разборы чужих ошибок в постинге. Первый выпуск в четверг. С чего начать?", de: "Wir starten eine neue Rubrik — kurze Analysen fremder Posting-Fehler. Erste Folge am Donnerstag. Womit anfangen?" },
      summary: [
        { icon: "calendar", text: { ru: "Во вторник, 18:00", de: "Am Dienstag, 18:00" } },
      ],
      mode: "review",
      mode_note: { ru: "<b>Черновик на ревью</b> в Календаре — опубликуется после подтверждения.", de: "<b>Entwurf zur Prüfung</b> im Kalender — nach Bestätigung veröffentlicht." },
      apply: { ru: "Запланировать", de: "Einplanen" },
      link: { ru: "Открыть Календарь", de: "Kalender öffnen" },
      done: { ru: "Черновик поставлен на <b>вторник, 18:00</b>", de: "Entwurf geplant für <b>Dienstag, 18:00</b>" },
      target: "mara", configurable: true,
    },
    cadence: {
      icon: "clock",
      kind: { ru: "Расписание", de: "Zeitplan" },
      q: { ru: "перенеси вечерние посты на утро", de: "verschieb die Abend-Beiträge auf morgens" },
      intro: { ru: "Утро у тебя читают заметно активнее — вот перенос.", de: "Morgens wirst du deutlich aktiver gelesen — hier die Verschiebung." },
      title: { ru: "Перенести вечерние посты на утро", de: "Abend-Beiträge auf morgens verlegen" },
      change: {
        before: { ru: "Вечером · 20:00", de: "Abends · 20:00" },
        after:  { ru: "Утром · 9:00", de: "Morgens · 9:00" },
      },
      grounded: { ru: "просмотры за 7 дней", de: "Aufrufe der letzten 7 Tage" },
      mode: "config",
      mode_note: { ru: "<b>Применится сразу.</b>", de: "<b>Sofort aktiv.</b>" },
      apply: { ru: "Применить", de: "Anwenden" },
      link: { ru: "Открыть Автопилот", de: "Autopilot öffnen" },
      done: { ru: "Вечерние посты перенесены на <b>9:00</b>", de: "Abend-Beiträge auf <b>9:00</b> verlegt" },
      target: "studio", configurable: true,
    },
  };
  var TYPES = ["routine", "auto_replies", "voice_rule", "schedule_post", "cadence"];

  /* per-lang micro-copy for the card chrome */
  var UI = {
    ru: { grounded: "На основе:", configure: "Настроить", cancel: "Отмена", applying: "Применяю…", retry: "Повторить", errT: "Не удалось применить", errS: "Соединение отвалилось. Действие не выполнено — данные целы.", affect: "затронет", done: "Готово" },
    de: { grounded: "Basis:", configure: "Anpassen", cancel: "Abbrechen", applying: "Wird angewendet…", retry: "Erneut", errT: "Anwenden fehlgeschlagen", errS: "Verbindung abgebrochen. Nichts wurde geändert — Daten sind sicher.", affect: "betrifft", done: "Fertig" },
  };

  /* ════════════════════════ the card body builder ════════════════════════
     opts: { lang, state:'proposed'|'applying'|'applied'|'error', portfolio, mobile } */
  function card(type, opts) {
    opts = opts || {};
    var d = CARDS[type], lang = opts.lang || DEFAULT_LANG, u = UI[lang] || UI.ru;
    var state = opts.state || "proposed";
    var mob = opts.mobile ? " adv-act--mobile" : "";

    /* applied → collapse to a quiet done row */
    if (state === "applied") {
      var link = "<a class='adv-act-done-link'>" + L(d.link, lang) + ACC.ic("arrow-right", 14) + "</a>";
      var main = "<span class='adv-act-done-ico'>" + ACC.ic("check", 15) + "</span>"
        + "<span class='adv-act-done-txt'>" + L(d.done, lang) + "</span>";
      if (opts.mobile) return "<div class='adv-act-done" + mob + "'><div class='adv-act-done-main'>" + main + "</div>" + link + "</div>";
      return "<div class='adv-act-done'>" + main + link + "</div>";
    }

    /* header */
    var head = "<div class='adv-act-head'>"
      + "<span class='adv-act-ico'>" + aic(d.icon, 17) + "</span>"
      + "<span class='adv-act-headtext'>"
      + "<span class='adv-act-kind'>" + L(d.kind, lang) + "</span>"
      + "<span class='adv-act-title'>" + L(d.title, lang) + "</span>"
      + "</span></div>";

    /* preview: draft (schedule_post) + summary lines, and/or before→after */
    var preview = "";
    if (d.draft) preview += "<div class='adv-act-draft'>" + L(d.draft, lang) + "</div>";
    if (d.summary) preview += d.summary.map(function (s) {
      return "<div class='adv-act-line'><span class='adv-act-lineico'>" + aic(s.icon, 15) + "</span><span class='adv-act-linetxt'>" + L(s.text, lang) + "</span></div>";
    }).join("");
    if (d.change) {
      preview += "<div class='adv-act-change'>"
        + "<div class='adv-act-ba'><span class='lab'>" + (lang === "de" ? "Vorher" : "Было") + "</span><span class='val'>" + L(d.change.before, lang) + "</span></div>"
        + "<span class='adv-act-arrow'>" + ACC.ic("arrow-right", 16) + "</span>"
        + "<div class='adv-act-ba adv-act-ba--after'><span class='lab'>" + (lang === "de" ? "Nachher" : "Станет") + "</span><span class='val'>" + L(d.change.after, lang) + "</span></div>"
        + "</div>";
    }
    preview = "<div class='adv-act-preview'>" + preview + "</div>";

    /* grounded (optional) */
    var grounded = d.grounded ? "<div class='adv-act-grounded'>" + ACC.ic("sparkle", 13)
      + "<span class='src'>" + u.grounded + " " + L(d.grounded, lang) + "</span></div>" : "";

    /* soft warning (optional) */
    var warn = d.warn ? "<div class='adv-act-warn'>" + ACC.ic("alert", 14) + "<span>" + L(d.warn, lang) + "</span></div>" : "";

    /* mode plaque */
    var modeIco = d.mode === "review" ? aic("eye", 14) : aic("bolt", 14);
    var mode = "<div class='adv-act-mode adv-act-mode--" + d.mode + "'>" + modeIco + "<span>" + L(d.mode_note, lang) + "</span></div>";

    /* profile row (portfolio advisor only, and only if target present) */
    var profile = "";
    if (opts.portfolio && d.target && C.PROFILES[d.target]) {
      var p = C.PROFILES[d.target];
      profile = "<div class='adv-act-profile'>" + actAvatar(p)
        + "<span class='adv-act-handle'>" + p.handle + "</span>"
        + "<span class='adv-act-affect'>" + u.affect + " · " + (C.NETWORKS[p.network] || {}).label + "</span></div>";
    }

    /* error line (state === error) */
    var errline = state === "error" ? "<div class='adv-act-errline'>" + ACC.ic("alert", 15)
      + "<span><b>" + u.errT + ".</b> " + u.errS + "</span></div>" : "";

    /* actions */
    var applying = state === "applying";
    var primaryLabel = state === "error" ? (aic("retry", 15) + u.retry)
      : applying ? ("<span class='spinner'></span>" + u.applying)
      : L(d.apply, lang);
    var primary = "<button class='btn btn--primary adv-act-apply'" + (applying ? " disabled aria-disabled='true'" : "") + ">" + primaryLabel + "</button>";
    var configure = d.configurable ? "<button class='btn btn--secondary'" + (applying ? " disabled" : "") + ">" + aic("sliders", 15) + u.configure + "</button>" : "";
    var cancel = "<button class='btn btn--ghost'" + (applying ? " disabled" : "") + ">" + u.cancel + "</button>";
    var actions = "<div class='adv-act-actions'>" + primary + configure + cancel + "</div>";

    return "<div class='adv-act" + mob + (applying ? " is-applying" : "") + "'>"
      + head + preview + grounded + warn + mode + profile + errline + actions + "</div>";
  }

  /* ── render the card inside a real advisor turn (proves "in the flow") ── */
  function flowTurn(type, opts) {
    opts = opts || {}; var d = CARDS[type], lang = opts.lang || DEFAULT_LANG;
    var inner = "<p>" + L(d.intro, lang) + "</p>" + card(type, opts);
    return X.userMsg(L(d.q, lang)) + X.aiMsg(lang, inner);
  }

  /* ════════════════════════ doc frame primitives ════════════════════════ */
  function head(label, dark) { return "<div class='fr-head'><span class='dh" + (dark ? " dh--dark" : "") + "'></span>" + label + "</div>"; }
  function frame(inner, dark, cls) { return "<div class='frame" + (dark ? " dark" : "") + (cls ? " " + cls : "") + "'>" + inner + "</div>"; }
  function col(label, inner, dark, cls) { return "<div class='fr'>" + head(label, dark) + frame(inner, dark, cls) + "</div>"; }
  function rowOf() { return "<div class='frow'>" + Array.prototype.join.call(arguments, "") + "</div>"; }
  function stack() { return Array.prototype.join.call(arguments, ""); }
  function set(id, html) { var e = document.getElementById(id); if (e) e.innerHTML = html; }

  /* wrap card html in a minimal chat surface so it reads in-context, not floating */
  function threadWrap(inner) { return "<div class='adv-thread'>" + inner + "</div>"; }

  /* a phone bezel around a mobile chat surface holding the card */
  function phone(type, opts, width) {
    width = width || 390;
    var lang = opts.lang || DEFAULT_LANG, d = CARDS[type];
    var body = X.aiMsg(lang, "<p>" + L(d.intro, lang) + "</p>" + card(type, Object.assign({}, opts, { mobile: true })));
    return "<div class='phone phone--" + width + "'><span class='phone-cap'></span>"
      + "<div class='phone-screen'>"
      + "<div class='ac-mchat" + (opts.dark ? " dark" : "") + "'>" + threadWrap(body) + "</div>"
      + "</div></div>";
  }
  function phoneCol(label, type, opts, width) {
    return "<div class='phonecol'><div class='w'>" + label + "</div>" + phone(type, opts, width) + "</div>";
  }

  /* ════════════════════════════ SECTIONS ════════════════════════════ */

  /* §3 — single-body anatomy (one card, fully populated, light + dark) */
  set("f-anatomy", rowOf(
    col("Светлая · корпус на примере «Рутина» (портфельный)", threadWrap(card("routine", { lang: DEFAULT_LANG, portfolio: true })), false, "frame--pad18"),
    col("Тёмная · то же", threadWrap(card("routine", { lang: DEFAULT_LANG, portfolio: true })), true, "frame--pad18")
  ));

  /* §4 — catalog: 5 types (proposed), portfolio, light + dark */
  set("f-catalog", stack(
    rowOf(
      col("routine · рутина постинга", threadWrap(card("routine", { portfolio: true })), false, "frame--pad18"),
      col("auto_replies · автоответы", threadWrap(card("auto_replies", { portfolio: true })), false, "frame--pad18")
    ),
    rowOf(
      col("voice_rule · правило голоса (до/после)", threadWrap(card("voice_rule", { portfolio: true })), true, "frame--pad18"),
      col("schedule_post · написать + запланировать", threadWrap(card("schedule_post", { portfolio: true })), true, "frame--pad18")
    ),
    rowOf(
      col("cadence · сменить расписание (до/после + «на основе»)", threadWrap(card("cadence", { portfolio: true })), false, "frame--pad18"),
      col("Тёмная · cadence", threadWrap(card("cadence", { portfolio: true })), true, "frame--pad18")
    )
  ));

  /* §5 — all states, on one representative type each */
  set("f-states", stack(
    rowOf(
      col("Предложено (дефолт) · cadence", threadWrap(card("cadence", { state: "proposed" })), false, "frame--pad18"),
      col("Применяется · спиннер, карточка заблокирована", threadWrap(card("cadence", { state: "applying" })), true, "frame--pad18")
    ),
    rowOf(
      col("Применено · свёрнута в тихую строку", threadWrap(card("cadence", { state: "applied" })), false, "frame--pad18"),
      col("Ошибка · inline + «Повторить»", threadWrap(card("cadence", { state: "error" })), true, "frame--pad18")
    ),
    rowOf(
      col("Мягкое предупреждение · routine (поднимет лимит)", threadWrap(card("routine", { state: "proposed" })), false, "frame--pad18"),
      col("Применено · routine (мобильный done-row в §9)", threadWrap(card("routine", { state: "applied" })), true, "frame--pad18")
    )
  ));

  /* §6 — several cards in one reply (a task → two cards, stacked) */
  var stackTask = {
    ru: "настрой мне автопостинг и автоответы",
    de: "richte mir Auto-Posting und Auto-Antworten ein",
  };
  var stackIntro = {
    ru: "Готово к применению — две настройки. Включи по очереди или обе сразу.",
    de: "Bereit zum Anwenden — zwei Einstellungen. Nacheinander oder beide zusammen.",
  };
  function stackReply(lang, dark) {
    var inner = "<p>" + L(stackIntro, lang) + "</p>"
      + "<div class='adv-act-stack'>" + card("routine", { lang: lang, portfolio: true }) + card("auto_replies", { lang: lang, portfolio: true }) + "</div>";
    return threadWrap(X.userMsg(L(stackTask, lang)) + X.aiMsg(lang, inner));
  }
  set("f-multi", rowOf(
    col("Светлая · одна реплика → две карточки в стопке", stackReply(DEFAULT_LANG, false), false, "frame--pad18"),
    col("Тёмная · то же", stackReply(DEFAULT_LANG, true), true, "frame--pad18")
  ));

  /* §7 — in the flow: full turn (user → prose → card), portfolio, light + dark */
  set("f-flow", stack(
    col("Светлая · портфельный советник: реплика → проза → карточка", threadWrap(flowTurn("schedule_post", { lang: DEFAULT_LANG, portfolio: true })), false, "frame--pad18"),
    col("Тёмная · cadence в потоке", threadWrap(flowTurn("cadence", { lang: DEFAULT_LANG, portfolio: true })), true, "frame--pad18")
  ));

  /* §8 — profile advisor vs portfolio advisor (row shown / hidden) + net marks */
  set("f-scope", rowOf(
    col("Профильный /app/advisor · профиль очевиден → строки НЕТ", threadWrap(card("voice_rule", { portfolio: false })), false, "frame--pad18"),
    col("Портфельный /app/account/advisor · строка профиля ЕСТЬ", threadWrap(card("voice_rule", { portfolio: true })), true, "frame--pad18")
  ));
  // network-mark swap proof: threads (@) vs linkedin (in)
  function profileRowOnly(profId) {
    var p = C.PROFILES[profId];
    return "<div class='adv-act' style='border-left-color:var(--color-border)'><div class='adv-act-profile' style='margin-top:0;padding-top:0;border-top:none'>"
      + actAvatar(p) + "<span class='adv-act-handle'>" + p.handle + "</span>"
      + "<span class='adv-act-affect'>" + (UI.ru.affect) + " · " + (C.NETWORKS[p.network] || {}).label + "</span></div></div>";
  }
  set("f-marks", rowOf(
    col("Строка профиля · Threads (@)", profileRowOnly("studio"), false, "frame--pad18"),
    col("Строка профиля · LinkedIn (in) — марка меняется, корпус тот же", profileRowOnly("northIn"), true, "frame--pad18")
  ));

  /* §9 — mobile: 390 + 320, both themes, primary-first ≥44px */
  set("f-mobile", stack(
    "<div class='frame frame--phones'>"
      + phoneCol("390 · светлая · предложено", "auto_replies", { lang: DEFAULT_LANG, dark: false }, 390)
      + phoneCol("320 · светлая · до/после", "cadence", { lang: DEFAULT_LANG, dark: false }, 320)
      + "</div>",
    "<div class='frame frame--phones dark'>"
      + phoneCol("390 · тёмная · применено", "routine", { lang: DEFAULT_LANG, dark: true, state: "applied" }, 390)
      + phoneCol("320 · тёмная · ошибка", "schedule_post", { lang: DEFAULT_LANG, dark: true, state: "error" }, 320)
      + "</div>"
  ));

  /* §10 — localization: full German state (length stress) */
  set("f-german", rowOf(
    col("Немецкий · светлая · routine (портфельный, ~1.3–1.5× ru)", threadWrap(flowTurn("routine", { lang: "de", portfolio: true })), false, "frame--pad18"),
    col("Немецкий · тёмная · auto_replies", threadWrap(card("auto_replies", { lang: "de", portfolio: true })), true, "frame--pad18")
  ));

  /* ════════════════════════ ?demo=1 PLAYGROUND ════════════════════════ */
  var DEMO = /(?:\?|&)demo=1(?:&|$)/.test(location.search);
  (function wirePlayground() {
    var pg = document.getElementById("pg");
    if (!pg) return;
    var stageEl = document.getElementById("pg-stage");
    var s = { type: "routine", state: "proposed", scope: "portfolio", lang: "ru", dark: false };

    function paint() {
      stageEl.classList.toggle("dark", !!s.dark);
      stageEl.classList.toggle("pg-stage--phone", false);
      var opts = { lang: s.lang, state: s.state, portfolio: s.scope === "portfolio" };
      stageEl.innerHTML = threadWrap(flowTurn(s.type, opts));
      // reflect state in the foot
      var f = document.getElementById("pg-state-echo");
      if (f) f.textContent = s.type + " · " + s.state + " · " + s.scope + " · " + s.lang;
    }
    function bindSeg(id, key) {
      var wrap = document.getElementById(id); if (!wrap) return;
      wrap.querySelectorAll("button").forEach(function (b) {
        b.addEventListener("click", function () {
          wrap.querySelectorAll("button").forEach(function (x) { x.classList.remove("on"); });
          b.classList.add("on"); s[key] = b.getAttribute("data-v"); paint();
        });
      });
    }
    bindSeg("pg-type", "type"); bindSeg("pg-state", "state"); bindSeg("pg-scope", "scope"); bindSeg("pg-lang", "lang");
    var dk = document.getElementById("pg-dark");
    if (dk) dk.addEventListener("change", function () { s.dark = this.checked; paint(); });
    paint();

    // ?demo=1 hint (playground works regardless; the flag just documents intent)
    if (DEMO) pg.setAttribute("data-demo", "1");
  })();

  window.ACTION_CARD = { card: card, flowTurn: flowTurn, CARDS: CARDS, TYPES: TYPES };
})();
