/* scenarios-redesign.js — builds every live frame in Scenarios-SPEC.html from the
   real DS classes (ds/components.css + scenarios.css + scenarios-redesign.css),
   inside token-pinned `.frame` hosts that flip light/dark via `.dark`.

   REDESIGN for the non-technical creator. Four pillars:
   A. Living sentence everywhere · B. КОГДА → ТОЛЬКО ЕСЛИ → ЧТО СДЕЛАЕТ skeleton
   C. «Спроси меня» default vs «Публиковать автоматически» opt-in (enable moment)
   D. Preview «в твоём голосе» before enabling.
   Demo content = neutral creator (window.SR). Honors backend constraints. */
(function () {
  "use strict";
  var SR = window.SR, P = SR.PRESETS, WK = SR.WK;

  /* ---------------------------------- icons --------------------------------- */
  function ic(n, s) {
    s = s || 14;
    var v = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
    var G = {
      repeat: '<path d="M17 2.5 20.5 6 17 9.5"/><path d="M3.5 11V9a3 3 0 0 1 3-3h14"/><path d="M7 21.5 3.5 18 7 14.5"/><path d="M20.5 13v2a3 3 0 0 1-3 3h-14"/>',
      gift: '<path d="M20 12v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8"/><path d="M2.5 7.5h19v4.5h-19z"/><path d="M12 7.5V21"/><path d="M12 7.5S10.5 3 8 3a2.2 2.2 0 0 0 0 4.5ZM12 7.5S13.5 3 16 3a2.2 2.2 0 0 1 0 4.5Z"/>',
      columns: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/>',
      seasonal: '<path d="M12 3v18M12 8c-2-2-5-2-6 0M12 8c2-2 5-2 6 0M12 14c-2-2-5-2-6 0M12 14c2-2 5-2 6 0"/>',
      bubble: '<path d="M21 12a8 8 0 0 1-11.5 7.2L4 20l1-5A8 8 0 1 1 21 12Z"/>',
      bubbleq: '<path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2Z"/><path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"/>',
      poll: '<path d="M5 20V11M12 20V5M19 20v-6"/>',
      boost: '<path d="M3 17 9 11l4 4 8-8"/><path d="M15 7h6v6"/>',
      shield: '<path d="M12 3 5 6v5c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z"/><path d="M9.5 12l1.8 1.8 3.4-3.6"/>',
      flag: '<path d="M5 21V4M5 4h11l-2 3 2 3H5"/>',
      users: '<circle cx="9" cy="8" r="3.2"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><path d="M16 5.5a3 3 0 0 1 0 5.6M18 19a5.5 5.5 0 0 0-3-4.9"/>',
      plus: '<path d="M12 5v14M5 12h14"/>',
      trash: '<path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/>',
      check: '<path d="M20 7 9 18l-5-5"/>',
      checkc: '<circle cx="12" cy="12" r="9"/><path d="M8.5 12.2l2.3 2.3 4.7-4.8"/>',
      x: '<path d="M6 6l12 12M18 6 6 18"/>',
      clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
      eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
      heart: '<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z"/>',
      person: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>',
      lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
      play: '<path d="M7 5l12 7-12 7V5Z"/>',
      sparkle: '<path d="M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3Z"/>',
      alert: '<path d="M12 8v5M12 16.5v.5"/><path d="M10.3 3.3 2.5 17a2 2 0 0 0 1.7 3h15.6a2 2 0 0 0 1.7-3L13.7 3.3a2 2 0 0 0-3.4 0Z"/>',
      arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
      chev: '<path d="M9 6l6 6-6 6"/>',
      pencil: '<path d="M4 20h4L19 9a2 2 0 0 0-3-3L5 17v3Z"/><path d="M14.5 6.5 17.5 9.5"/>',
      bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/>',
      eyecheck: '<path d="M2 12s3.5-7 10-7 10 7 10 7"/><path d="M9 13l2 2 4-4"/>',
      send: '<path d="M22 3 11 14M22 3l-7 19-4-8-8-4 19-7Z"/>',
      sliders: '<path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h7M15 18h5"/><circle cx="16" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="13" cy="18" r="2"/>',
      settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
      bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M10.5 21a2 2 0 0 0 3 0"/>',
      info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.5v.5"/>',
      external: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>'
    };
    return '<svg width="' + s + '" height="' + s + '" ' + v + '>' + (G[n] || '') + '</svg>';
  }

  /* -------------------------------- primitives ------------------------------ */
  function sw(on, lg) { return '<label class="switch' + (lg ? ' switch--lg' : '') + '"><input type="checkbox"' + (on ? ' checked' : '') + ' aria-label="toggle"><span class="track"></span><span class="knob"></span></label>'; }
  function sel(val, opts) { return '<select class="field" aria-label="select">' + opts.map(function (o) { return '<option' + (o === val ? ' selected' : '') + '>' + o + '</option>'; }).join('') + '</select>'; }
  function set(id, html) { var e = document.getElementById(id); if (e) e.innerHTML = html; }
  function av(initials, sz) { sz = sz || 30; return '<span class="avatar" style="width:' + sz + 'px;height:' + sz + 'px;display:inline-grid;place-items:center;border-radius:9999px;background:var(--color-surface-2);border:1px solid var(--color-border);font-size:11px;font-weight:600;color:var(--color-text-muted);flex:0 0 auto">' + initials + '</span>'; }
  function fkey(k) { return '<span class="fc-k">' + k + '</span>'; }

  /* frame chrome */
  function head(label, dark) { return '<div class="fr-head"><span class="dh' + (dark ? ' dh--dark' : '') + '"></span>' + label + '</div>'; }
  function frame(inner, dark, extra) { return '<div class="frame' + (dark ? ' dark' : '') + (extra ? ' ' + extra : '') + '">' + inner + '</div>'; }
  function col(label, inner, dark, extra) { return '<div class="fr">' + head(label, dark) + frame(inner, dark, extra) + '</div>'; }
  function row() { var a = [].slice.call(arguments); return '<div class="frow">' + a.join('') + '</div>'; }

  /* ════════════════════════ A · LIVING SENTENCE ════════════════════════ */
  function sentenceBlock(p, opts) {
    opts = opts || {};
    var mode = opts.mode || "ask";
    var pr = SR.promise(mode, p.kind);
    var prIco = pr.tone === "ask" ? "eyecheck" : "bolt";
    return '<div class="sc-sentence">'
      + '<span class="ss-k">' + ic("sparkle", 12) + ' Что будет происходить</span>'
      + p.sentence(opts.fields || {})
      + '<div class="sc-sentence-promise"><span class="ss-promise' + (pr.tone === "auto" ? " ss-promise--auto" : "") + '">' + ic(prIco, 14) + ' ' + pr.text + '</span></div>'
      + '</div>';
  }

  /* B · skeleton КОГДА → ТОЛЬКО ЕСЛИ → ЧТО СДЕЛАЕТ (plain words) */
  function skelBlock(p) {
    var s = p.skel;
    var onlyif = s.onlyif
      ? '<div class="sc-skel-step sc-skel-step--opt"><div class="sk-k">Только если</div><div class="sk-v">' + s.onlyif + '</div></div>'
      : '<div class="sc-skel-step sc-skel-step--opt"><div class="sk-k">Только если</div><div class="sk-v">— без условий</div></div>';
    return '<div class="sc-skel">'
      + '<div class="sc-skel-step"><div class="sk-k">Когда</div><div class="sk-v">' + s.when + '</div></div>'
      + onlyif
      + '<div class="sc-skel-step"><div class="sk-k">Что сделает</div><div class="sk-v">' + s.whatdo + '</div></div>'
      + '</div>';
  }

  /* ════════════════════════ SCREEN 1 · FIRST RUN ════════════════════════ */
  function exampleCard(p) {
    var plaque = p.replies ? '<span class="sc-plaque">' + ic("bubble", 12) + ' Отвечает людям</span>' : '<span style="font-size:var(--text-caption);color:var(--color-text-subtle);display:inline-flex;align-items:center;gap:6px">' + ic("clock", 12) + p.whenShort + '</span>';
    return '<div class="sc-example">'
      + '<div class="sc-example-top"><span class="sc-example-ico">' + ic(p.ico, 19) + '</span><span class="sc-example-name">' + p.name + '</span></div>'
      + '<div class="sc-example-line">' + p.sentence({}) + '</div>'
      + '<div class="sc-example-foot">' + plaque + '<button class="btn btn--primary btn--sm">' + ic("plus", 14) + ' Попробовать</button></div>'
      + '</div>';
  }
  function firstRun() {
    return '<div class="sc-page">'
      + '<div class="sc-intro"><div class="sci-text"><h1>Сценарии</h1>'
      + '<p>Pennedly может вести часть твоего аккаунта сам — по правилам, которые ты задаёшь.</p></div></div>'
      + '<div class="sc-firstrun">'
      + '<div class="sc-fr-explain"><span class="fre-mark">' + ic("repeat", 22) + '</span><div class="fre-body">'
      + '<div class="fre-t">Что такое сценарий?</div>'
      + '<div class="fre-s"><b>Сценарий — это одно правило: «когда случится вот это — сделай вот то».</b> Например, каждое утро публикуй вопрос, или отвечай тем, кто комментирует. Pennedly делает это в твоём голосе. Каждый сценарий можно посмотреть до запуска, и по умолчанию он спрашивает тебя перед публикацией.</div>'
      + '</div></div>'
      + '<div class="sc-fr-head">Вот как это выглядит — попробуй один:</div>'
      + '<div class="sc-fr-grid">' + exampleCard(P.talk) + exampleCard(P.duty) + exampleCard(P.column) + '</div>'
      + '<div class="sc-scratch"><button>' + ic("pencil", 14) + ' Или собрать сценарий с нуля</button></div>'
      + '</div></div>';
  }

  /* ════════════════════════ SCREEN 2 · GALLERY by GOAL ════════════════════════ */
  function presetCard(p) {
    var plaque = p.replies ? '<span class="sc-plaque">' + ic("bubble", 12) + ' Отвечает людям</span>' : '';
    var foot = p.gated
      ? '<div class="sc-pcard-foot"><span class="sc-risk">' + ic("lock", 12) + ' Сильный инструмент</span></div>'
      : (plaque ? '<div class="sc-pcard-foot">' + plaque + '</div>' : '<div class="sc-pcard-foot"><span class="sc-pcard-when">' + ic("clock", 12) + p.whenShort + '</span></div>');
    var cls = "sc-pcard" + (p.goal === "engage" ? " sc-pcard--core" : "") + (p.gated ? " sc-pcard--campaign" : "");
    return '<button class="' + cls + '">'
      + '<div class="sc-pcard-top"><span class="sc-pcard-ico">' + ic(p.ico, 19) + '</span><span class="sc-pcard-name">' + p.name + '</span></div>'
      + '<div class="sc-pcard-benefit">' + p.benefit + '</div>'
      + '<div class="sc-pcard-will">' + p.will() + '</div>'
      + foot + '</button>';
  }
  function gallery() {
    var out = '<div class="sc-page"><div class="sc-intro"><div class="sci-text"><h1>Выбери сценарий</h1>'
      + '<p>Готовые рутины под твою цель. Любой можно настроить и посмотреть до запуска — все создаются выключенными.</p></div>'
      + '<button class="btn btn--secondary">' + ic("pencil", 15) + ' С нуля</button></div>';
    out += '<div class="sc-pgroups">';
    SR.GROUPS.forEach(function (g) {
      var cards = g.presets.map(function (id) { return presetCard(P[id]); }).join("");
      var grid = '<div class="sc-pg-grid' + (g.presets.length < 3 ? " sc-pg-grid--two" : "") + '">' + cards + '</div>';
      if (g.gated) grid = '<div class="sc-pcampaign">' + grid + '</div>';
      out += '<div class="sc-pgroup"><div class="sc-pg-head"><span class="sc-pg-title">' + g.title + '</span><span class="sc-pg-note">' + g.note + '</span></div>' + grid + '</div>';
    });
    out += '</div></div>';
    return out;
  }

  /* ════════════════════════ КОГДА · ЧТО СДЕЛАЕТ cards ════════════════════════ */
  function whenCard(p, opts) {
    opts = opts || {};
    /* duty = polling, not one of the 5 modes — honest read-only info */
    if (p.id === "duty") {
      return '<div class="sc-formcard"><div class="sc-fc-title">' + fkey("когда") + ' Когда срабатывает</div>'
        + '<div class="sc-fc-sub">Это реакция на комментарии, а не расписание.</div>'
        + '<div class="sc-event-ro"><span class="ev-ico">' + ic("clock", 16) + '</span><span class="ev-txt">Pennedly <b>проверяет новые комментарии каждые 15 минут</b> и готовит ответ. Это не мгновенный ответ — небольшая задержка нормальна.</span></div></div>';
    }
    var mode = p.id === "column" || p.id === "poll" ? "weekly"
      : p.id === "seasonal" || p.id === "promo" ? "dates"
        : p.id === "boost" || p.id === "thanks" ? "event"
          : opts.everyN ? "everyn" : "daily";
    var segs = [["daily", "Ежедневно"], ["everyn", "Раз в N дней"], ["weekly", "Еженедельно"], ["dates", "В период дат"], ["event", "По событию"]];
    var seg = '<div class="seg" role="tablist">' + segs.map(function (s) { return '<button class="seg-opt' + (s[0] === mode ? " seg-opt--active" : "") + '">' + s[1] + '</button>'; }).join("") + '</div>';
    var body = "";
    if (mode === "daily") body = '<div class="sc-everyn" style="color:var(--color-text-subtle)">' + ic("clock", 14) + ' Каждое утро в 9:00, первым постом дня';
    else if (mode === "everyn") body = '<div class="sc-everyn">Каждые <input class="field" value="3" inputmode="numeric" aria-label="число дней"> дня, утром</div>';
    else if (mode === "weekly") body = '<div style="display:flex;flex-direction:column;gap:11px"><div class="sc-weekdays">' + WK.map(function (d, i) { return '<span class="sc-wd' + (i === (p.id === "poll" ? 3 : 1) ? " on" : "") + '">' + d + '</span>'; }).join("") + '</div><div class="sc-everyn" style="color:var(--color-text-subtle)">' + ic("clock", 14) + (p.id === "poll" ? " Каждый четверг в 18:00" : " Каждый вторник в 12:00") + '</div></div>';
    else if (mode === "dates") body = '<div class="sc-daterange"><div class="dr-field"><label>Начало</label><input class="field" value="28 июн 2026"></div><span class="dr-arrow">' + ic("arrow", 16) + '</span><div class="dr-field"><label>Конец</label><input class="field" value="5 июл 2026"></div></div>';
    else if (mode === "event") {
      var evtTxt = p.id === "boost" ? 'Когда любой твой пост <b>наберёт больше N просмотров</b>' : 'Когда ты <b>наберёшь круглую отметку подписчиков</b>';
      body = '<div class="sc-event"><div class="sc-event-ro"><span class="ev-ico">' + ic("bolt", 16) + '</span><span class="ev-txt">' + evtTxt + '</span><span class="ev-lock">' + ic("lock", 11) + ' задано пресетом</span></div>';
      if (p.id === "boost") body += '<div class="sc-threshold"><span>Порог просмотров</span><input class="field" placeholder="авто" value="' + (opts.empty ? "" : "5000") + '"><span class="th-auto">пусто = авто от твоей медианы (~3,2K)</span></div>';
      if (p.id === "thanks") body += '<div class="sc-ladder"><span>Каждые</span><input class="field" value="1000"><span>подписчиков</span></div>';
      body += "</div>";
    }
    if (mode !== "dates" && mode !== "event" && mode !== "weekly") body += "</div>";
    return '<div class="sc-formcard"><div class="sc-fc-title">' + fkey("когда") + ' Когда срабатывает</div>'
      + '<div class="sc-fc-sub">В твоём часовом поясе аккаунта (' + SR.CREATOR.tz + ').</div>'
      + '<div class="sc-sched">' + seg + body + '</div></div>';
  }

  function whatdoCard(p, opts) {
    opts = opts || {};
    var E = opts.empty;
    var actT = p.kind === "reply" ? "Ответит человеку в комментариях" : "Опубликует пост";
    var actS = p.id === "poll" ? "Опрос — это обычный текстовый пост: в Threads нет встроенных опросов."
      : p.kind === "reply" ? "Готовит черновик ответа в твоём голосе под твоим постом."
        : "Готовит черновик поста в твоём голосе.";
    var rows = "";
    if (p.id === "talk") rows = '<div class="sc-field"><label>Тема дня <span class="sc-opt">· необязательно</span></label><input class="field" placeholder="оставь пустым — Pennedly подберёт сам" value="' + (E ? "" : "довести дело до конца") + '"><span class="field-hint">Одно слово или фраза задаёт настроение вопроса.</span></div>';
    else if (p.id === "column") rows = '<div class="sc-field"><label>Имя рубрики</label><input class="field" value="' + (E ? "" : "Маленькая победа") + '" placeholder="например, Маленькая победа"></div>'
      + '<div class="sc-field"><label>О чём рубрика</label><input class="field" value="' + (E ? "" : "одна закрытая задача недели + вывод") + '" placeholder="формат в одну строку"><span class="field-hint">Постоянный формат — Pennedly держит его из выпуска в выпуск.</span></div>';
    else if (p.id === "duty") rows = '<div class="sc-field"><label>Кому отвечаем</label>' + sel("Всем, кроме троллей", ["Только тёплым и фанатам", "Всем, кроме троллей", "Только тем, кто задал вопрос"]) + '<span class="field-hint">Pennedly готовит черновик — ты утверждаешь его в «Активности».</span></div>';
    else if (p.id === "poll") rows = '<div class="sc-field"><label>Вопрос</label><input class="field" value="' + (E ? "" : "Про что сделать большой разбор на этой неделе?") + '"></div>'
      + '<div class="sc-field"><label>Варианты <span class="sc-opt">· 2–4</span></label><div class="sc-poll">'
      + ["Как доводить дела до конца", "Борьба с прокрастинацией", "Фокус и внимание", "Отдых без вины"].slice(0, E ? 2 : 4).map(function (o, i) { return '<div class="sc-poll-opt"><span class="po-n">' + (i + 1) + '</span><input class="field" value="' + (E ? "" : o) + '"><button class="po-del" aria-label="удалить">' + ic("x", 14) + '</button></div>'; }).join("")
      + '<button class="btn btn--secondary btn--sm sc-poll-add">' + ic("plus", 14) + ' Вариант</button></div></div>';
    else if (p.id === "seasonal") rows = '<div class="sc-field"><label>Тема</label><input class="field" value="' + (E ? "" : "Новый месяц") + '" placeholder="например, Новый месяц, Новый год"><span class="field-hint">Период дат ты задаёшь в «Когда» выше.</span></div>';
    else if (p.id === "promo") rows = '<div class="sc-field' + (opts.err ? " sc-field--err" : "") + '"><label>Что просим написать в комментах</label><input class="field" placeholder="например, над чем застряли" value="' + (E ? "" : "над чем вы застряли") + '">'
      + (opts.err ? '<span class="field-hint field-hint--error">Заполни это поле — без него не собрать призыв.</span>' : '<span class="field-hint">Одно короткое действие. Это попадёт прямо в текст призыва.</span>') + '</div>'
      + '<div class="sc-field"><label>Что даём взамен</label><input class="field" placeholder="например, короткий совет в ответ" value="' + (E ? "" : "короткий конкретный совет в ответ") + '"><span class="field-hint">Чем понятнее выгода, тем больше откликов.</span></div>'
      + '<div class="sc-toggles">'
      + '<div class="sc-toggle"><div class="st-label"><div class="st-t">' + ic("person", 14) + ' Требовать подписку</div><div class="st-d">Отвечаем только тем, кто подписан.</div></div>' + sw(!E) + '</div>'
      + '<div class="sc-toggle"><div class="st-label"><div class="st-t">' + ic("heart", 14) + ' Требовать лайк</div><div class="st-d">Отвечаем только если человек лайкнул пост.</div></div>' + sw(false) + '</div>'
      + '</div>';
    var head = '<div class="sc-whatdo"><span class="wd-ico">' + ic(p.kind === "reply" ? "bubble" : "send", 18) + '</span><div class="wd-body"><div class="wd-t">' + actT + '</div><div class="wd-s">' + actS + '</div></div></div>';
    return '<div class="sc-formcard"><div class="sc-fc-title" style="margin-bottom:14px">' + fkey("что сделает") + ' Что Pennedly сделает</div>'
      + head + (rows ? '<div style="margin-top:16px;display:flex;flex-direction:column;gap:16px">' + rows + '</div>' : "") + '</div>';
  }

  /* «Что Pennedly добавит» — read-only proven rules (was «зашьётся») */
  function rulesBlock(p, open) {
    var rules = SR.RULES[p.id] || [];
    return '<div class="sc-rules' + (open ? " sc-rules--open" : "") + '">'
      + '<button class="sc-rules-head"><span class="rh-ico">' + ic("check", 15) + '</span><span class="rh-t">Что Pennedly добавит от себя</span><span class="rh-chev">' + ic("chev", 16) + '</span></button>'
      + (open ? '<div class="sc-rules-body"><p class="sc-rules-intro">Несколько проверенных правил, которые Pennedly соблюдает поверх твоего голоса в этом сценарии. Их видно, но менять нельзя — так превью остаётся честным.</p>'
        + '<ul class="sc-rules-list">' + rules.map(function (r) { return '<li class="sc-rules-item"><span class="ri-ico">' + ic("check", 14) + '</span><span>' + r + '</span></li>'; }).join("") + '</ul>'
        + '<div class="sc-rules-foot">' + ic("lock", 12) + ' Только для чтения · поверх — твой голос из Voice</div></div>' : "")
      + '</div>';
  }

  /* «Ещё настройки» — hides ТОЛЬКО ЕСЛИ + cap + quiet hours + account + tone */
  function moreSettings(p, open) {
    var onlyifRows = "";
    if (p.kind === "reply") {
      onlyifRows = '<div class="sc-onlyif-row"><div class="oi-label"><div class="oi-t">Пропускать спам и токсичность</div><div class="oi-d">Не отвечать на оскорбления и явный спам.</div></div><div class="oi-control">' + sw(true) + '</div></div>'
        + '<div class="sc-onlyif-row"><div class="oi-label"><div class="oi-t">Только содержательные комментарии</div><div class="oi-d">Пропускать пустые «спасибо» и эмодзи.</div></div><div class="oi-control">' + sw(true) + '</div></div>'
        + '<div class="sc-onlyif-row"><div class="oi-label"><div class="oi-t">Не больше ответов в день</div><div class="oi-d">Чтобы не завалить ленту ответами.</div></div><div class="oi-control"><input class="field" value="20" style="width:72px;text-align:center"></div></div>';
    } else {
      onlyifRows = '<div class="sc-onlyif-row"><div class="oi-label"><div class="oi-t">Только по будням</div><div class="oi-d">Не публиковать по выходным.</div></div><div class="oi-control">' + sw(p.id === "column") + '</div></div>'
        + '<div class="sc-onlyif-row"><div class="oi-label"><div class="oi-t">Не повторять сегодняшнюю тему</div><div class="oi-d">Пропустить, если похожий пост уже вышел.</div></div><div class="oi-control">' + sw(true) + '</div></div>';
    }
    return '<div class="sc-more' + (open ? " sc-more--open" : "") + '">'
      + '<button class="sc-more-head"><span class="mh-ico">' + ic("chev", 16) + '</span><span class="mh-t">' + ic("sliders", 14) + ' Ещё настройки</span><span class="mh-hint">' + (open ? "фильтры, тихие часы, аккаунт" : "не обязательно") + '</span></button>'
      + (open ? '<div class="sc-more-body">'
        + '<div class="sc-more-group"><div class="mg-k">' + (p.kind === "reply" ? "Кому и сколько отвечать" : "Только если") + '</div><div class="sc-onlyif">' + onlyifRows + '</div></div>'
        + '<div class="sc-more-group"><div class="mg-k">Тихие часы</div><div class="sc-onlyif"><div class="sc-onlyif-row" style="padding-top:2px"><div class="oi-label"><div class="oi-t">Не публиковать ночью</div><div class="oi-d">Пауза с 23:00 до 8:00.</div></div><div class="oi-control">' + sw(true) + '</div></div></div></div>'
        + '<div class="sc-more-group"><div class="mg-k">Аккаунт</div><div class="sc-field" style="max-width:280px">' + sel("Алекс · @alex.makes", ["Алекс · @alex.makes", "Заметки · @alex.notes"]) + '</div></div>'
        + (p.kind === "reply" ? '<div class="sc-more-group"><div class="mg-k">Как звучит ответ</div><div class="sc-field"><textarea class="field" rows="2" placeholder="например, по имени, одно наблюдение и мягкий вопрос">по имени, одно наблюдение и мягкий вопрос — без шаблонов</textarea><span class="field-hint">Базовые правила уже учтены выше; это лишь твоя добавка.</span></div></div>' : "")
        + '</div>' : "")
      + '</div>';
  }

  /* «для продвинутых» — raw model, deepest, off happy path. POST/REPLY only. */
  function advancedBlock(p, open) {
    var trig = p.id === "boost" ? "Когда пост перейдёт N просмотров" : p.id === "thanks" ? "Когда наберётся N подписчиков" : p.id === "duty" ? "Каждые 15 минут" : p.id === "column" || p.id === "poll" ? "Еженедельно" : p.id === "seasonal" || p.id === "promo" ? "В период дат" : "Ежедневно";
    var act = p.kind === "reply" ? "Ответ в комментариях" : "Пост";
    return '<div class="sc-advanced' + (open ? " sc-advanced--open" : "") + '">'
      + '<button class="sc-advanced-head"><span class="ah-ico">' + ic("chev", 16) + '</span><span class="ah-t">Показать как правило</span><span class="ah-hint">для продвинутых</span></button>'
      + (open ? '<div class="sc-advanced-body"><p class="sc-advanced-note">Та же рутина, выраженная сырыми полями. Они связаны с формой выше: правки здесь меняют её, и наоборот. Если не уверен — закрой и пользуйся обычной формой.</p>'
        + '<div class="sc-field"><label>Когда</label>' + sel(trig, ["Ежедневно", "Раз в N дней", "Еженедельно", "В период дат", "Каждые 15 минут", "Когда пост перейдёт N просмотров", "Когда наберётся N подписчиков"]) + '</div>'
        + '<div class="sc-field"><label>Только если <span class="sc-opt">· необязательно</span></label>' + sel("Без условия", ["Без условия", "Только по будням", "Только для подписчиков", "Если за день не было постов", "Если комментарий содержательный"]) + '</div>'
        + '<div class="sc-field"><label>Что сделать</label>' + sel(act, ["Пост", "Ответ в комментариях"]) + '<span class="field-hint">Pennedly умеет только постить и отвечать — другого пока нет.</span></div>'
        + '<div class="sc-field"><label>Указание поверх голоса</label><textarea class="field" rows="3">Базовые правила пресета + твои поля выше. Меняй осторожно — здесь нет страховки обычной формы.</textarea></div>'
        + '</div>' : "")
      + '</div>';
  }

  /* ════════════════════════ D · PREVIEW «в твоём голосе» ════════════════════════ */
  function pollBlock(q, opts) {
    return '<div style="font-size:var(--text-small);line-height:1.6;color:var(--color-text);margin-bottom:11px">' + q + '</div>'
      + opts.map(function (o, i) { var pct = [42, 28, 19, 11][i] || 8; return '<div style="position:relative;border:1px solid var(--color-border);border-radius:var(--radius-md);padding:8px 11px;margin-bottom:7px;overflow:hidden;font-size:var(--text-small)"><span style="position:absolute;inset:0;width:' + pct + '%;background:color-mix(in srgb,var(--color-accent) 12%,transparent)"></span><span style="position:relative;display:flex;justify-content:space-between"><span>' + o + '</span><span style="color:var(--color-text-subtle);font-variant-numeric:tabular-nums">' + pct + '%</span></span></div>'; }).join("");
  }
  function mockPost(s) {
    var C = SR.CREATOR;
    var body = s.poll ? pollBlock(s.poll[0], s.poll[1])
      : '<div class="mockpost-text">' + s.post + '</div><div class="mockpost-stats"><span class="ms">' + ic("eye", 13) + ' ' + s.stats[0] + '</span><span class="ms">' + ic("heart", 13) + ' ' + s.stats[1] + '</span><span class="ms">' + ic("bubble", 13) + ' ' + s.stats[2] + '</span></div>';
    return '<div class="mockpost"><div class="mockpost-top">' + av(C.initial) + '<div class="mockpost-who"><span class="mw-n">' + C.name + '</span><span class="mw-h">' + C.handle + '</span></div><span class="mockpost-time">' + s.time + '</span></div>' + body + '</div>';
  }
  function mockReply(r) {
    var C = SR.CREATOR;
    return '<div class="mockreply"><div class="mr-k">пример авто-ответа</div>'
      + '<div class="mr-comment">' + av(r.who[0]) + '<div class="mrc-body"><div class="mrc-who">' + r.who + '</div><div class="mrc-text">' + r.text + '</div></div></div>'
      + '<div class="mr-bot">' + av(C.initial) + '<div class="mrb-body"><div class="mrb-who">' + C.name + ' <span class="mrb-tag">' + ic("bubble", 11) + ' ответ Pennedly</span></div><div class="mrb-text">' + r.bot + '</div></div></div></div>';
  }
  function previewPanel(p, opts) {
    opts = opts || {};
    var s = SR.SAMPLE[p.id];
    if (opts.state === "loading") {
      return '<div class="sc-preview"><div class="sc-prev-head"><span class="sc-prev-cap">' + ic("sparkle", 13) + ' Превью в твоём голосе</span></div>'
        + '<div class="sc-prev-panel"><div class="prev-loading"><span class="sk" style="width:40%;height:11px"></span><span class="sk" style="width:100%;height:13px"></span><span class="sk" style="width:92%;height:13px"></span><span class="sk" style="width:64%;height:13px"></span><span class="sk" style="width:100%;height:64px;margin-top:6px;border-radius:10px"></span></div></div></div>';
    }
    var cta = s.cta ? '<div class="sc-prev-cta"><div class="pc-k">Собранный призыв</div><div class="pc-text">' + s.cta + '</div></div>' : "";
    var draftNote = opts.runResult ? '<div class="sc-draftnote">' + ic("checkc", 16) + ' Черновик создан <span class="dn-sub">— ничего не опубликовано. Найдёшь его в Студии.</span></div>' : "";
    var inner = cta
      + '<div class="sc-invoice">' + ic("sparkle", 13) + '<span>В твоём голосе · на основе <b>' + s.invoice + '</b>. Pennedly не выдумывает за тебя.</span></div>'
      + draftNote
      + (s.post || s.poll ? mockPost(s) : "")
      + (s.reply ? mockReply(s.reply) : "")
      + '<div class="sc-when-fires">' + ic("clock", 14) + '<span>Сработает: <b>' + s.fires + '</b></span></div>'
      + (opts.runResult ? "" : '<div class="sc-runnow-bar"><button class="btn btn--secondary btn--sm">' + ic("play", 14) + ' Прогнать сейчас</button><span class="rn-note">Создаст черновик прямо сейчас — никогда не публикует.</span></div>');
    return '<div class="sc-preview"><div class="sc-prev-head"><span class="sc-prev-cap">' + ic("sparkle", 13) + ' Превью в твоём голосе</span><button class="btn btn--ghost btn--sm">' + ic("repeat", 14) + ' Другой пример</button></div>'
      + '<div class="sc-prev-panel">' + inner + '</div></div>';
  }

  /* ════════════════════════ EDITOR PAGE ════════════════════════ */
  function unifiedForm(p, opts) {
    opts = opts || {};
    var nameVal = opts.empty ? "" : (p.id === "column" ? "Маленькая победа" : p.id === "promo" ? "Разбор ваших затыков" : p.name);
    var out = '<div class="sc-form">';
    out += sentenceBlock(p, opts);
    out += skelBlock(p);
    out += '<div class="sc-formcard"><div class="sc-field"><label>Название</label><input class="field" placeholder="например, ' + p.name + '" value="' + nameVal + '"><span class="field-hint">Так ты узнаешь сценарий в списке.</span></div></div>';
    out += whenCard(p, opts);
    out += whatdoCard(p, opts);
    out += rulesBlock(p, opts.rules);
    out += moreSettings(p, opts.more);
    out += advancedBlock(p, opts.advanced);
    if (opts.err) out += '<div class="sc-error"><span class="sce-mark">' + ic("alert", 18) + '</span><div class="sce-body"><div class="sce-title">Не получилось сохранить</div><div class="sce-sub">Проверь обязательные поля и попробуй снова. Изменения не потеряны.</div></div></div>';
    out += '<div class="sc-formcard"><div class="sc-actionbar">'
      + (opts.saving ? '<button class="btn btn--secondary" aria-disabled="true"><span class="spinner"></span> Сохранение…</button>' : '<button class="btn btn--secondary">Сохранить выключенным</button>')
      + (opts.saving ? '<button class="btn btn--primary" aria-disabled="true"><span class="spinner"></span> Сохранение…</button>' : '<button class="btn btn--primary">' + ic("check", 15) + ' Сохранить и включить</button>')
      + '<span class="sa-spacer"></span>'
      + (opts.existing ? '<button class="btn btn--ghost">' + ic("trash", 15) + ' Удалить</button>' : "")
      + '</div>'
      + (opts.deleteConfirm ? '<div class="sc-delete-confirm"><span class="sdc-t">Удалить этот сценарий? Действие необратимо.</span><button class="btn btn--ghost btn--sm">Отмена</button><button class="btn btn--danger btn--sm">Удалить</button></div>' : "")
      + '</div>';
    out += "</div>";
    return out;
  }
  function editorPage(p, opts) {
    opts = opts || {};
    var title = opts.empty ? "Новый сценарий" : (p.id === "column" ? "Маленькая победа" : p.id === "promo" ? "Разбор ваших затыков" : p.name);
    return '<div class="sc-page"><div class="sc-intro"><div class="sci-text"><h1>' + title + '</h1>'
      + '<p>' + p.benefit + ' — посмотри превью и реши, как включать.</p></div></div>'
      + '<div class="sc-editor">' + unifiedForm(p, opts) + previewPanel(p, opts) + '</div></div>';
  }

  /* ════════════════════════ SCREEN 4 · ENABLE MOMENT ════════════════════════ */
  function enableDialog(p, opts) {
    opts = opts || {};
    var sel = opts.mode || "ask";
    var autoMode = '<button class="sc-mode sc-mode--auto' + (sel === "auto" ? " sc-mode--on" : "") + '"><span class="mo-radio"></span><div class="mo-body"><div class="mo-t">Публиковать автоматически</div>'
      + '<div class="mo-d">' + (p.kind === "reply" ? "Pennedly отвечает людям сам, без твоего подтверждения. Ответы уходят живым комментаторам." : "Pennedly публикует сам, без твоего подтверждения.") + '</div></div></button>';
    var askMode = '<button class="sc-mode' + (sel === "ask" ? " sc-mode--on" : "") + '"><span class="mo-radio"></span><div class="mo-body"><div class="mo-t">Спроси меня перед публикацией <span class="mo-default">по умолчанию</span></div>'
      + '<div class="mo-d">' + (p.kind === "reply" ? "Pennedly готовит ответ в твоём голосе → ты подтверждаешь его в «Активности»." : "Pennedly готовит черновик в твоём голосе → ты подтверждаешь публикацию.") + '</div></div></button>';
    var gate = opts.autopostOff && p.kind === "post"
      ? '<div class="sc-autopost-inline"><span class="ai-ico">' + ic("info", 16) + '</span><div class="ai-body"><div class="ai-t">Сначала включи автопубликацию аккаунта</div>'
        + '<div class="ai-d">Для @alex.makes автопубликация выключена — без неё Pennedly будет только готовить черновики, но не публиковать. Включим вместе сейчас:</div>'
        + '<div class="ai-toggle">' + sw(false) + ' Разрешить Pennedly публиковать на @alex.makes</div></div></div>'
      : "";
    var reactive = p.replies && sel === "auto"
      ? '<div class="sc-reactive-confirm"><span class="rc-check">' + ic("check", 13) + '</span><div class="rc-text">Понимаю: этот сценарий будет <b>сам отвечать живым людям</b> в комментариях, без моего подтверждения каждого ответа.</div></div>'
      : "";
    return '<div class="dialog sc-enable">'
      + '<div class="sc-enable-head"><span class="eh-ico">' + ic("repeat", 20) + '</span><div><div class="eh-t">Включить «' + (p.id === "column" ? "Маленькая победа" : p.name) + '»?</div>'
      + '<div class="eh-s">' + p.sentence({}).replace(/<[^>]+>/g, function (m) { return m; }) + '</div></div></div>'
      + '<div class="sc-modepick">' + askMode + autoMode + '</div>'
      + gate + reactive
      + '<div class="sc-enable-actions"><button class="btn btn--secondary">Отмена</button><button class="btn btn--primary">' + ic("check", 15) + ' Включить</button></div>'
      + '</div>';
  }
  function enableStage(p, opts) {
    return '<div style="position:relative;min-height:430px;display:grid;place-items:center;background:var(--color-surface-2);border-radius:var(--radius-lg);padding:24px">' + enableDialog(p, opts) + '</div>';
  }

  /* ════════════════════════ SCREEN 5 · CONTROL CENTER ════════════════════════ */
  var WKf = { talk: [1, 1, 1, 1, 1, 1, 1], column: [0, 1, 0, 0, 0, 0, 0], safety: [1, 1, 1, 1, 1, 1, 1], poll: [0, 0, 0, 1, 0, 0, 0] };
  function cadStrip(fire, capLabel, evt) {
    var days = '<span class="sc-cad-days">' + WK.map(function (d, i) { return '<span class="sc-cad-day' + (fire[i] ? " fire" + (evt ? " fire--evt" : "") : "") + '">' + d + '</span>'; }).join("") + '</span>';
    return '<div class="sc-cadence">' + days + '<span class="sc-cad-cap">' + ic("clock", 12) + '<span class="cc-when">' + capLabel + '</span></span></div>';
  }
  function ccCard(o) {
    var p = o.preset;
    var strip = o.evtLabel
      ? '<div class="sc-cadence"><span class="sc-cad-cap" style="margin:0">' + ic("bolt", 13) + '<span class="cc-when">' + o.evtLabel + '</span></span></div>'
      : cadStrip(o.fire || WKf[p.id] || [1, 1, 1, 1, 1, 0, 0], o.cap, o.evt);
    var statusCls = o.on ? "sc-bigstatus--on" : "";
    var status = '<span class="sc-bigstatus ' + statusCls + '"><span class="bs-dot"></span>' + (o.on ? "Активен" : "Выключен") + '</span>';
    /* the «Сохранил ≠ работает» fix: off card says it plainly + offers Включить */
    var createdoff = !o.on ? '<div class="sc-createdoff"><span class="co-ico">' + ic("info", 15) + '</span><span class="co-text"><b>Создан, но выключен.</b> Пока он ничего не делает — включи, когда будешь готов.</span><button class="btn btn--primary btn--sm">' + ic("check", 14) + ' Включить</button></div>' : "";
    var runcount = o.runs != null ? '<span class="sc-runcount">' + ic("repeat", 12) + 'сработал <b>' + o.runs + '</b> раз</span>' : "";
    var ask = o.mode === "ask" ? '<span class="sc-runcount">' + ic("eyecheck", 12) + ' спрашивает перед публикацией</span>' : (o.on ? '<span class="sc-runcount" style="color:var(--color-warning)">' + ic("bolt", 12) + ' публикует автоматически</span>' : "");
    return '<div class="sc-card' + (o.on ? " sc-card--on" : " sc-card--off") + '">'
      + '<div class="sc-card-head"><span class="sc-card-icon">' + ic(p.ico, 20) + '</span>'
      + '<div class="sc-card-titles"><div class="sc-card-name">' + o.name + (p.replies ? ' <span class="sc-plaque">' + ic("bubble", 11) + ' отвечает людям</span>' : "") + '</div>'
      + '<div class="sc-cardline">' + p.sentence(o.fields || {}) + '</div></div>'
      + '<div class="sc-card-toggle">' + status + sw(o.on, false) + '</div></div>'
      + createdoff
      + strip
      + '<div class="sc-card-foot"><div class="sc-runs">'
      + '<div class="sc-run"><span class="sr-k">след. запуск</span><span class="sr-v' + (o.on ? "" : " muted") + '">' + (o.on ? o.next : "выключен") + '</span></div>'
      + '<div class="sc-run"><span class="sr-k">последний запуск</span><span class="sr-v' + (o.last ? "" : " muted") + '">' + (o.last || "ещё не было") + '</span></div>'
      + runcount + ask
      + '</div>'
      + '<div class="sc-card-actions"><a class="btn btn--ghost btn--sm" href="#">Активность</a><a class="btn btn--secondary btn--sm" href="#">Открыть</a></div>'
      + '</div></div>';
  }
  var CC = {
    talk: { preset: P.talk, name: "Утренний вопрос", on: true, mode: "ask", cap: "каждое утро, 9:00", next: "Завтра, 9:00", last: "Сегодня, 9:02", runs: 38 },
    column: { preset: P.column, name: "Маленькая победа", on: true, mode: "ask", fields: { name: "Маленькая победа" }, cap: "по вторникам, 12:00", next: "Вт, 12:00", last: "Вт назад, 12:00", runs: 9 },
    duty: { preset: P.duty, name: "Отвечать на комментарии", on: true, mode: "ask", evtLabel: "Проверяет каждые 15 минут", next: "По мере комментов", last: "8 минут назад", runs: 142 },
    boost: { preset: P.boost, name: "Раскрутить залетевший", on: true, mode: "auto", evtLabel: "Когда пост перейдёт 5 000 просмотров", next: "По событию", last: "3 дня назад", runs: 5 },
    safety: { preset: P.safety, name: "Если сегодня не постил", on: false, mode: "ask", cap: "вечером, 19:00", next: "", last: "12 июн, 19:00", runs: 4 }
  };
  function ccHead() {
    return '<div class="sc-cc-head"><span class="cc-k">' + ic("repeat", 13) + ' Твоя неделя · время аккаунта</span>'
      + '<span class="sc-cap"><span class="sc-cap-l">Не больше постов в день</span><span class="sc-stepper"><button aria-label="меньше">' + ic("x", 13) + '</button><span class="sv">1</span><button aria-label="больше">' + ic("plus", 13) + '</button></span></span></div>';
  }
  function controlList(opts) {
    opts = opts || {};
    var cards = [ccCard(CC.talk), ccCard(CC.duty), ccCard(CC.column), ccCard(CC.safety)];
    return '<div class="sc-list">' + cards.join("") + '</div>';
  }
  function listPage(body, withAdd, head2) {
    return '<div class="sc-page"><div class="sc-intro"><div class="sci-text"><h1>Сценарии</h1>'
      + '<p>Что Pennedly делает за тебя — и что сейчас выключено. Всё одним взглядом.</p></div>'
      + (withAdd ? '<button class="btn btn--primary">' + ic("plus", 16) + ' Новый сценарий</button>' : "") + '</div>'
      + (head2 || "") + body + '</div>';
  }
  /* warnings */
  function warnStack() {
    return '<div class="sc-warn"><span class="sw-mark">' + ic("alert", 16) + '</span><div class="sw-body"><div class="sw-title">Два поста метят на одно утро</div>'
      + '<div class="sw-sub"><b>Утренний вопрос</b> и <b>Сезонная тема</b> хотят выйти первым постом дня — а лимит сейчас 1 пост в день, так что выйдет только один. Подними лимит или разнеси их по времени.</div></div></div>';
  }
  function applyPop() {
    var accts = [["Алекс · @alex.makes", "@alex.makes", true], ["Заметки", "@alex.notes", false]];
    return '<div class="sc-apply-pop"><div class="ap-k">Скопировать сценарий на другой аккаунт</div>'
      + accts.map(function (a) { return '<div class="sc-acct">' + sw(a[2]) + '<span class="ac-name">' + a[0] + '</span><span class="ac-h">' + a[1] + '</span></div>'; }).join("")
      + '<div class="ap-foot"><button class="btn btn--primary btn--sm">' + ic("check", 14) + ' Скопировать</button><button class="btn btn--ghost btn--sm">Отмена</button></div></div>';
  }
  function skelCard() {
    return '<div class="sc-skel-card"><div class="sc-skel-row"><span class="sk" style="width:40px;height:40px;border-radius:10px;flex:0 0 auto"></span>'
      + '<div style="flex:1 1 auto"><span class="sk" style="display:block;width:52%;height:15px"></span><span class="sk" style="display:block;width:78%;height:11px;margin-top:8px"></span></div>'
      + '<span class="sk" style="width:90px;height:30px;border-radius:9999px;flex:0 0 auto"></span></div>'
      + '<span class="sk" style="width:230px;height:28px;border-radius:6px"></span></div>';
  }
  function listLoading() { return '<div class="sc-list">' + skelCard() + skelCard() + skelCard() + '</div>'; }
  function listError() {
    return '<div class="sc-error"><span class="sce-mark">' + ic("alert", 18) + '</span><div class="sce-body"><div class="sce-title">Не удалось загрузить сценарии</div>'
      + '<div class="sce-sub">Что-то пошло не так при обращении к Threads. Твои сценарии в безопасности — попробуй ещё раз.</div></div>'
      + '<button class="btn btn--secondary btn--sm">' + ic("repeat", 15) + ' Повторить</button></div>';
  }

  /* ════════════════════════ SCREEN 6 · ACTIVITY ════════════════════════ */
  function activity() {
    var C = SR.CREATOR;
    var draftPost = '<div class="sc-act-draft"><div class="sc-act-draft-head"><span class="ad-tag">' + ic("eyecheck", 13) + ' Ждёт твоего подтверждения</span><span class="ad-when">готово к 9:00</span></div>'
      + '<div class="sc-act-draft-ctx"><b>Утренний вопрос</b> · черновик поста</div>'
      + '<div class="sc-act-draft-body">Вопрос на сегодня: что вы сегодня доведёте до конца — даже если получится неидеально? Напишите одним словом 👇</div>'
      + '<div class="sc-act-draft-actions"><button class="btn btn--primary btn--sm">' + ic("send", 14) + ' Опубликовать</button><button class="btn btn--secondary btn--sm">' + ic("pencil", 14) + ' Изменить</button><button class="btn btn--ghost btn--sm">Пропустить</button></div></div>';
    var draftReply = '<div class="sc-act-draft"><div class="sc-act-draft-head"><span class="ad-tag">' + ic("bubble", 13) + ' Ждёт твоего подтверждения</span><span class="ad-when">12 минут назад</span></div>'
      + '<div class="sc-act-draft-ctx"><b>Отвечать на комментарии</b> · ответ Марине под постом «Маленькая победа»</div>'
      + '<div class="sc-act-draft-body">Марина, когда сил нет, цель не «сделать», а «начать на 5 минут» — почти всегда этого хватает, чтобы втянуться. С чего бы вы начали эти пять минут?</div>'
      + '<div class="sc-act-draft-actions"><button class="btn btn--primary btn--sm">' + ic("send", 14) + ' Отправить ответ</button><button class="btn btn--secondary btn--sm">' + ic("pencil", 14) + ' Изменить</button><button class="btn btn--ghost btn--sm">Пропустить</button></div></div>';
    function item(reply, text, sub) {
      return '<div class="sc-act-item"><span class="ai-dot' + (reply ? " ai-dot--reply" : "") + '">' + ic(reply ? "bubble" : "send", 14) + '</span>'
        + '<div class="ai-main"><div class="ai-text">' + text + '</div><div class="ai-sub">' + sub + '</div></div>'
        + '<span class="ai-open"><a class="link" href="#">Открыть в Threads ' + ic("external", 12) + '</a></span></div>';
    }
    return '<div class="sc-page"><div class="sc-intro"><div class="sci-text"><h1>Активность</h1>'
      + '<p>Что Pennedly сделал и что ждёт твоего слова. По-человечески, без технических логов.</p></div></div>'
      + '<div class="sc-activity">'
      + '<div class="sc-act-section"><div class="as-k">Ждут твоего подтверждения · 2</div>' + draftPost + draftReply + '</div>'
      + '<div class="sc-act-section"><div class="as-k">Уже сделано</div><div class="sc-act-list">'
      + item(false, 'Опубликовал твой <b>утренний вопрос</b>', "Сегодня в 9:02 · 1,2K просмотров")
      + item(true, 'Ответил <b>Диме</b> под постом «Разбор ваших затыков»', "Сегодня в 8:41")
      + item(false, 'Опубликовал выпуск рубрики <b>«Маленькая победа»</b>', "Вчера в 12:00 · 960 просмотров")
      + item(true, 'Ответил <b>Анне</b> под постом «Утренний вопрос»', "Вчера в 9:18")
      + item(false, 'Подхватил залетевший пост — <b>опубликовал продолжение</b>', "12 июня в 14:30 · 8,4K просмотров")
      + '</div></div></div></div>';
  }

  /* ══════════════════════════════ MOUNT ════════════════════════════════ */
  set("f-firstrun", col("Первый запуск · учим на примере · Light", firstRun(), false) + col("Первый запуск · Dark", firstRun(), true));

  set("f-sentence", row(
    col("Расписанный пост · «Спроси меня» (дефолт)", '<div style="display:flex;flex-direction:column;gap:14px">' + sentenceBlock(P.talk, { mode: "ask" }) + skelBlock(P.talk) + '</div>', false),
    col("Реактивный + ответы людям · «Автоматически»", '<div style="display:flex;flex-direction:column;gap:14px">' + sentenceBlock(P.duty, { mode: "auto" }) + skelBlock(P.duty) + '</div>', false)
  ));

  set("f-gallery", col("Галерея по цели · Light", gallery(), false) + col("Галерея по цели · Dark", gallery(), true));

  set("f-gallery-card", row(
    col("Карта пресета · постит", '<div class="sc-pg-grid sc-pg-grid--two">' + presetCard(P.talk) + presetCard(P.column) + '</div>', false),
    col("Отвечает людям (плашка) · gated (замок)", '<div class="sc-pg-grid sc-pg-grid--two">' + presetCard(P.duty) + presetCard(P.promo) + '</div>', false)
  ));

  set("f-editor", col("Редактор · happy path · Light", editorPage(P.talk, { existing: true }), false) + col("Редактор · happy path · Dark", editorPage(P.talk, { existing: true }), true));

  set("f-rules", col("«Что Pennedly добавит» раскрыто · Light", '<div class="sc-form" style="max-width:560px">' + rulesBlock(P.talk, true) + '</div>', false) + col("· Dark", '<div class="sc-form" style="max-width:560px">' + rulesBlock(P.duty, true) + '</div>', true));

  set("f-more", row(
    col("«Ещё настройки» раскрыто · пост", '<div class="sc-form" style="max-width:620px">' + moreSettings(P.column, true) + '</div>', false),
    col("«Ещё настройки» раскрыто · ответы", '<div class="sc-form" style="max-width:620px">' + moreSettings(P.duty, true) + '</div>', false)
  ));

  set("f-advanced", col("«Показать как правило» · для продвинутых · Light", '<div class="sc-form" style="max-width:560px">' + advancedBlock(P.boost, true) + '</div>', false) + col("· Dark", '<div class="sc-form" style="max-width:560px">' + advancedBlock(P.talk, true) + '</div>', true));

  set("f-preview", row(
    col("Превью в твоём голосе + «Прогнать сейчас»", '<div class="sc-editor" style="grid-template-columns:1fr">' + previewPanel(P.talk, {}) + '</div>', false),
    col("Результат прогона — создан ЧЕРНОВИК", '<div class="sc-editor" style="grid-template-columns:1fr">' + previewPanel(P.column, { runResult: true }) + '</div>', false)
  ));

  set("f-enable", row(
    col("Момент включения · «Спроси меня» (дефолт)", enableStage(P.talk, { mode: "ask" }), false),
    col("Включение ответов людям · «Автоматически» + согласие", enableStage(P.duty, { mode: "auto" }), false)
  ));
  set("f-enable2", col("Включаешь пост, но автопубликация выключена (гейт inline)", enableStage(P.talk, { mode: "auto", autopostOff: true }), false)
    + col("· Dark", enableStage(P.duty, { mode: "auto" }), true));

  set("f-list", col("Контроль-центр · Light", listPage(controlList(), true, ccHead()), false) + col("Контроль-центр · Dark", listPage(controlList(), true, ccHead()), true));

  set("f-list-card", row(
    col("Активен · живое предложение + статус", '<div class="sc-list">' + ccCard(CC.talk) + '</div>', false),
    col("Выключен · «создан, но выключен»", '<div class="sc-list">' + ccCard(CC.safety) + '</div>', false)
  ));

  set("f-list-states", row(
    col("Загрузка (скелетоны)", listPage(listLoading(), true), false),
    col("Ошибка", listPage(listError(), true), false)
  ));

  set("f-warn", row(
    col("Предупреждение называет конкретные сценарии", '<div style="display:flex;flex-direction:column;gap:12px">' + warnStack() + '</div>', false),
    col("«Скопировать на другой аккаунт»", '<div style="max-width:360px">' + applyPop() + '</div>', false)
  ));

  set("f-activity", col("Активность · Light", activity(), false) + col("Активность · Dark", activity(), true));

  set("f-reactive", col("Реактивный «Раскрутить» · по событию · Light", editorPage(P.boost, { existing: true }), false) + col("· Dark", editorPage(P.boost, { existing: true }), true));
  set("f-reply", col("«Отвечать на комментарии» · честно про 15 минут · Light", editorPage(P.duty, { existing: true }), false) + col("· Dark", editorPage(P.duty, { existing: true }), true));
  set("f-promo", col("«Акция» · сохранённый богатый редактор · Light", editorPage(P.promo, { existing: true }), false) + col("· Dark", editorPage(P.promo, { existing: true }), true));

  set("f-editor-states", row(
    col("Раз в N дней + сохранение", editorPage(P.talk, { existing: true, everyN: true, saving: true }), false),
    col("Ошибка валидации + удаление", editorPage(P.promo, { existing: true, err: true, deleteConfirm: true, state: "loading" }), false)
  ));

  window.SCEN = { ic: ic };
})();
