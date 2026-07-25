/* scenarios-mobile-redesign.js — builds every phone frame in the redesigned
   Scenarios-Mobile-SPEC.html. Uses the shared shell (window.MOCK) + the shared
   mobile layers (pennedly-mobile.css · scenarios-mobile.css · scenarios-mobile-
   redesign.css · scenarios-mobile-ia.css) + the shared content model (window.SR).

   IA / NAVIGATION REWORK — the phone is a FULLSCREEN DRILL-DOWN over the same
   four surfaces as desktop. Each level is its own screen with a back-chevron in
   the top bar; the editor and constructor carry a STICKY action panel at the
   bottom. Home = «Мои сценарии» (Активные + На паузе). Neutral creator. */
(function () {
  "use strict";
  var M = window.MOCK, SR = window.SR, P = SR.PRESETS, WK = SR.WK;

  /* rules for the from-scratch constructor (not tied to a preset) */
  SR.RULES.custom = ['Поверх всего — твой голос из Voice, без «продающих» формулировок.', 'Никогда не постит чаще лимита постов в день.', 'Тролли и токсичность отсеиваются до черновика ответа.', 'Каждое срабатывание попадает в «Активность» с возможностью отменить.'];

  var ic = function (id, s) { return '<svg style="width:' + s + 'px;height:' + s + 'px;display:block" aria-hidden="true"><use href="#i-' + id + '"/></svg>'; };
  function cic(n, s) {
    s = s || 14;
    var v = 'style="width:' + s + 'px;height:' + s + 'px;display:block" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
    var G = {
      bubbleq: '<path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2Z"/><path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"/>',
      columns: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/>',
      shield: '<path d="M12 3 5 6v5c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z"/><path d="M9.5 12l1.8 1.8 3.4-3.6"/>',
      flag: '<path d="M5 21V4M5 4h11l-2 3 2 3H5"/>',
      poll: '<path d="M5 20V11M12 20V5M19 20v-6"/>',
      boost: '<path d="M3 17 9 11l4 4 8-8"/><path d="M15 7h6v6"/>',
      seasonal: '<path d="M12 3v18M12 8c-2-2-5-2-6 0M12 8c2-2 5-2 6 0M12 14c-2-2-5-2-6 0M12 14c2-2 5-2 6 0"/>',
      lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
      play: '<path d="M7 5l12 7-12 7V5Z"/>',
      bolt2: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/>',
      checkc: '<circle cx="12" cy="12" r="9"/><path d="M8.5 12.2l2.3 2.3 4.7-4.8"/>',
      send: '<path d="M22 3 11 14M22 3l-7 19-4-8-8-4 19-7Z"/>',
      sliders: '<path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h7M15 18h5"/><circle cx="16" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="13" cy="18" r="2"/>',
      eyecheck: '<path d="M2 12s3.5-7 10-7 10 7 10 7"/><path d="M9 13l2 2 4-4"/>',
      info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.5v.5"/>',
      external: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
      grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>',
      wand: '<path d="M15 4V2M15 10V8M9.5 6.5h-2M22.5 6.5h-2M19 3l-1.4 1.4M11.4 8.6 10 10M4 20l9.5-9.5"/>',
      help: '<circle cx="12" cy="12" r="9"/><path d="M9.2 9.3a2.8 2.8 0 0 1 5.4 1c0 1.9-2.6 2.3-2.6 3.7M12 17.2v.05"/>'
    };
    return '<svg ' + v + '>' + (G[n] || '') + '</svg>';
  }
  function icoOf(p, s) {
    var customs = { talk: "bubbleq", column: "columns", safety: "shield", thanks: "flag", poll: "poll", boost: "boost", seasonal: "seasonal" };
    if (customs[p.id]) return cic(customs[p.id], s || 19);
    return ic(p.id === "duty" ? "bubble" : "gift", s || 19);
  }
  function set(id, html) { var e = document.getElementById(id); if (e) e.innerHTML = html; }
  function clip(s, n) { return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s; }
  function av(initials) { return '<span class="m-scn-av">' + initials + '</span>'; }
  function toggle(on, lg) { return '<span class="m-toggle' + (lg ? " m-toggle--lg" : "") + (on ? " is-on" : "") + '"><span class="m-toggle-knob"></span></span>'; }
  function selectEl(val, opts) { return '<select class="m-select" aria-label="select">' + opts.map(function (o) { return '<option' + (o === val ? " selected" : "") + '>' + o + '</option>'; }).join("") + '</select>'; }
  function input(val, ph, err) { return '<input class="m-objname" style="border:1px solid ' + (err ? "var(--color-danger)" : "var(--color-border)") + ';background:var(--color-surface);width:100%;height:44px;font-size:16px;border-radius:var(--radius-md);padding:0 12px" value="' + val + '" placeholder="' + ph + '">'; }
  function mta(val, ph) { return '<textarea class="m-objname" style="width:100%;min-height:88px;height:auto;padding:11px 12px;font-size:16px;line-height:1.5;border:1px solid var(--color-border);background:var(--color-surface);border-radius:var(--radius-md)" placeholder="' + (ph || "") + '">' + (val || "") + '</textarea>'; }
  function field(label, control, hint, fkey, err) {
    var lbl = (fkey ? '<span class="m-scn-fkey">' + fkey + '</span>' : "") + label;
    return '<div class="m-field"><label>' + lbl + '</label>' + control + (hint ? '<div class="m-field-hint"' + (err ? ' style="color:var(--color-danger)"' : "") + '>' + hint + '</div>' : "") + '</div>';
  }
  function intro(h, sub) { return '<div class="m-scn-intro"><h1>' + h + '</h1><p>' + sub + '</p></div>'; }
  function ap2(inner) { return '<div class="m-ap2sec"><div class="m-ap2body">' + inner + '</div></div>'; }
  function ap2head(fkey, title, sub, inner) { return '<div class="m-ap2sec"><div class="m-ap2head"><div><div class="t"><span class="m-scn-fkey">' + fkey + '</span>' + title + '</div><div class="s">' + sub + '</div></div></div><div class="m-ap2body">' + inner + '</div></div>'; }

  /* ════════════ living sentence + skeleton ════════════ */
  function sentence(p, opts) {
    opts = opts || {};
    var mode = opts.mode || "ask";
    var pr = SR.promise(mode, p.kind);
    return '<div class="m-sc-sentence"><span class="ss-k">' + ic("sparkle", 12) + ' Что будет происходить</span>'
      + p.sentence(opts.fields || {})
      + '<div><span class="ss-promise' + (pr.tone === "auto" ? " is-auto" : "") + '">' + cic(pr.tone === "ask" ? "eyecheck" : "bolt2", 14) + ' ' + pr.text + '</span></div></div>';
  }
  function skel(p) {
    var s = p.skel;
    return '<div class="m-sc-skel">'
      + '<div class="m-sc-skel-step"><div class="sk-k">Когда</div><div class="sk-v">' + s.when + '</div></div>'
      + '<div class="m-sc-skel-step is-opt"><div class="sk-k">Только если</div><div class="sk-v">' + (s.onlyif || "— без условий") + '</div></div>'
      + '<div class="m-sc-skel-step"><div class="sk-k">Что сделает</div><div class="sk-v">' + s.whatdo + '</div></div></div>';
  }

  /* ════════════ A · СТАРТ / ОБУЧЕНИЕ ════════════ */
  function teachExample(ico, t, k, q) {
    return '<div class="m-sc-example"><div class="m-sc-example-top"><span class="m-sc-example-ico">' + ico + '</span><span class="m-sc-example-name">' + t + '</span></div>'
      + '<div class="m-sc-teach-exq"><span class="qk">' + ic("eye", 11) + ' ' + k + '</span>' + q + '</div></div>';
  }
  function teach() {
    var steps = [
      ['Выбрал шаблон или собрал свой', 'Готовый <b>шаблон</b> или <b>конструктор с нуля</b> — как удобнее.'],
      ['Проверил превью', 'Pennedly показывает <b>реальный пример</b> в твоём голосе.'],
      ['Включил', '<b>Сам постит и отвечает</b> по расписанию. Выключить можно мгновенно.']
    ];
    return intro("Сценарии", "Pennedly сам постит и отвечает по расписанию — настраиваешь один раз.")
      + '<div class="m-sc-firstrun"><div class="m-sc-fr-explain"><span class="fre-mark">' + ic("repeat", 20) + '</span><div><div class="fre-t">Что такое сценарий?</div>'
      + '<div class="fre-s"><b>Это рутина: «когда случится вот это — сделай вот то».</b> Сам публикует посты и отвечает на комментарии в твоём голосе. Экономит время, держит аккаунт живым и не даёт пропустить ответы.</div></div></div>'
      + '<div class="m-sc-fr-head">Как это выглядит</div>'
      + teachExample(icoOf(P.talk), "Каждое утро — пост с пользой", "пример поста", "Вопрос на сегодня: что вы сегодня доведёте до конца — даже если выйдет неидеально?")
      + teachExample(ic("gift", 19), "Акция — собирает заявки и сама отвечает", "пример ответа", "Дима, попробуй заголовок как ответ на «что я получу за 10 секунд?». Скинь варианты — помогу выбрать.")
      + teachExample(ic("bubble", 19), "Дежурный по ответам, пока ты занят", "пример ответа", "Марина, когда сил нет — цель не «сделать», а «начать на 5 минут». С чего бы ты начала?")
      + '<div class="m-sc-fr-head">Как это работает</div>'
      + '<div class="m-sc-steps">' + steps.map(function (s, i) { return '<div class="m-sc-step"><span class="ms-n">' + (i + 1) + '</span><div><div class="ms-t">' + s[0] + '</div><div class="ms-d">' + s[1] + '</div></div></div>'; }).join("") + '</div>'
      + '<div class="m-sc-teach-cta"><button class="btn btn--primary m-btn">' + ic("grid", 16) + ' Посмотреть шаблоны</button>'
      + '<button class="btn btn--secondary m-btn">' + cic("wand", 16) + ' Создать свой</button></div>'
      + '<div class="m-sc-teach-note">Сценарии создаются выключенными — ничего не запустится, пока не включишь.</div>'
      + '<span class="m-sc-gatenote">' + cic("lock", 12) + ' Виден только тестерам · по умолчанию выключен</span>'
      + '</div>';
  }

  /* ════════════ C · КАТАЛОГ — gallery by goal, each card with an example ════════════ */
  function tExample(p) {
    var s = SR.SAMPLE[p.id], k, body = "";
    if (s.poll) { k = "пример опроса"; body = '<span class="exq">' + clip(s.poll[0], 90) + '</span>'; }
    else if (s.post) { k = "пример поста"; body = '<span class="exq">' + clip(s.post, 110) + '</span>'; }
    else if (s.reply) k = "пример ответа";
    var rep = s.reply ? '<div class="m-sc-tcard-ex-reply"><span class="exr-k">' + ic("bubble", 11) + ' авто-ответ</span> <span class="exq">' + clip(s.reply.bot, 100) + '</span></div>' : "";
    return '<div class="m-sc-tcard-ex"><div class="m-sc-tcard-ex-k">' + ic("eye", 11) + ' ' + k + '</div><div class="m-sc-tcard-ex-body">' + body + rep + '</div></div>';
  }
  function presetCard(p) {
    var cls = "m-scn-pcard" + (p.goal === "engage" ? " m-scn-pcard--core" : "") + (p.gated ? " m-scn-pcard--campaign" : "");
    var foot = p.gated
      ? '<div class="m-scn-pcard-foot"><span class="m-scn-risk">' + ic("lock", 12) + ' Сильный инструмент</span></div>'
      : (p.replies ? '<div class="m-scn-pcard-foot"><span class="m-sc-plaque">' + ic("bubble", 12) + ' Отвечает людям</span></div>'
        : '<div class="m-scn-pcard-foot"><span class="m-scn-pcard-when">' + ic("clock", 12) + p.whenShort + '</span></div>');
    return '<button class="' + cls + '"><div class="m-scn-pcard-top"><span class="m-scn-pcard-ico">' + icoOf(p) + '</span>'
      + '<span class="m-scn-pcard-name">' + p.name + '</span><span class="m-scn-pcard-chev">' + ic("chev-right", 16) + '</span></div>'
      + '<div class="m-sc-pcard-benefit">' + p.benefit + '</div>'
      + '<div class="m-sc-pcard-will">' + p.will() + '</div>'
      + tExample(p) + foot + '</button>';
  }
  function group(g) {
    var grid = '<div class="m-scn-pgrid">' + g.presets.map(function (id) { return presetCard(P[id]); }).join("") + '</div>';
    if (g.gated) grid = '<div class="m-scn-pcampaign">' + grid + '</div>';
    return '<div class="m-scn-pgroup"><div class="m-scn-pg-head"><span class="m-scn-pg-title">' + g.title + '</span><span class="m-scn-pg-note">' + g.note + '</span></div>' + grid + '</div>';
  }
  function catalog() {
    return intro("Готовые шаблоны", "Выбери под свою цель — на каждой карточке есть пример. Все создаются выключенными.")
      + '<div class="m-sc-scratch-cta"><span class="scc-ico">' + cic("wand", 20) + '</span><div><div class="scc-t">Создать свой с нуля</div><div class="scc-d">Собери любой сценарий в конструкторе.</div></div><span class="scc-chev">' + ic("chev-right", 18) + '</span></div>'
      + SR.GROUPS.map(group).join("");
  }

  /* ════════════ КОГДА · ЧТО СДЕЛАЕТ (editor from a template) ════════════ */
  function whenSection(p, opts) {
    opts = opts || {};
    if (p.id === "duty") {
      return ap2head("когда", "Когда срабатывает", "Это реакция на комментарии, не расписание.",
        '<div class="m-scn-event-ro"><span class="ev-ico">' + ic("clock", 16) + '</span><div><div class="ev-txt">Pennedly <b>проверяет новые комментарии каждые 15 минут</b> и готовит ответ. Небольшая задержка нормальна.</div></div></div>');
    }
    var mode = opts.mode || (p.id === "column" || p.id === "poll" ? "weekly" : p.id === "seasonal" || p.id === "promo" ? "dates" : p.id === "boost" || p.id === "thanks" ? "event" : opts.everyN ? "everyn" : "daily");
    var segs = [["daily", "Ежедневно"], ["everyn", "Раз в N дней"], ["weekly", "Еженедельно"], ["dates", "В период дат"], ["event", "По событию"]];
    var seg = '<div class="m-scn-seg" style="flex-wrap:wrap">' + segs.map(function (z) { return '<button class="m-scn-segbtn' + (z[0] === mode ? " is-on" : "") + '" style="flex:1 1 30%">' + z[1] + '</button>'; }).join("") + '</div>';
    var body = "";
    if (mode === "daily") body = '<div class="m-scn-schedhint">' + ic("clock", 14) + ' Каждое утро в 9:00, первым постом дня</div>';
    else if (mode === "everyn") body = '<div class="m-scn-everyn">Каждые ' + selectEl("3", ["2", "3", "5", "7"]) + ' дня, утром</div>';
    else if (mode === "weekly") body = '<div style="display:flex;flex-direction:column;gap:11px;margin-top:12px"><div class="m-scn-weekdays">' + WK.map(function (d, i) { return '<span class="m-scn-wd' + (i === (p.id === "poll" ? 3 : 1) ? " on" : "") + '">' + d + '</span>'; }).join("") + '</div><div class="m-scn-schedhint">' + ic("clock", 14) + (p.id === "poll" ? " Каждый четверг в 18:00" : " Каждый вторник в 12:00") + '</div></div>';
    else if (mode === "dates") body = '<div class="m-scn-daterange" style="margin-top:12px"><div class="m-field" style="margin:0"><label>Начало</label>' + input("28 июн 2026", "") + '</div><div class="m-field" style="margin:0"><label>Конец</label>' + input("5 июл 2026", "") + '</div></div>';
    else if (mode === "event") {
      var evtTxt = p.id === "boost" ? "Когда твой пост <b>наберёт больше N просмотров</b>" : "Когда ты <b>наберёшь круглую отметку подписчиков</b>";
      body = '<div class="m-scn-event" style="margin-top:12px"><div class="m-scn-event-ro"><span class="ev-ico">' + cic("bolt2", 16) + '</span><div><div class="ev-txt">' + evtTxt + '</div><span class="ev-lock">' + cic("lock", 11) + ' задано пресетом</span></div></div>';
      if (p.id === "boost") body += '<div class="m-field" style="margin:0"><label>Порог просмотров</label>' + input(opts.empty ? "" : "5000", "авто") + '<div class="m-field-hint">пусто = авто от твоей медианы (~3,2K)</div></div>';
      if (p.id === "thanks") body += '<div class="m-field" style="margin:0"><label>Каждые N подписчиков</label>' + input("1000", "") + '</div>';
      body += "</div>";
    }
    return ap2head("когда", "Когда срабатывает", "В часовом поясе аккаунта (" + SR.CREATOR.tz + ").", seg + body);
  }
  function whatdoSection(p, opts) {
    opts = opts || {}; var E = opts.empty; var rows = "";
    if (p.id === "talk") rows = field('Тема дня <span style="font-weight:400;color:var(--color-text-subtle)">· необязательно</span>', input(E ? "" : "довести дело до конца", "пусто — подберём сами"), "Одно слово задаёт настроение вопроса.");
    else if (p.id === "column") rows = field("Имя рубрики", input(E ? "" : "Маленькая победа", "напр., Маленькая победа")) + field("О чём рубрика", input(E ? "" : "одна закрытая задача + вывод", "формат в одну строку"), "Постоянный формат из выпуска в выпуск.");
    else if (p.id === "duty") rows = field("Кому отвечаем", selectEl("Всем, кроме троллей", ["Только тёплым и фанатам", "Всем, кроме троллей", "Только тем, кто задал вопрос"]), "Готовит черновик — ты утверждаешь в «Активности».");
    else if (p.id === "poll") rows = field("Вопрос", input(E ? "" : "Про что сделать большой разбор?", "")) + '<div class="m-field"><label>Варианты <span style="font-weight:400;color:var(--color-text-subtle)">· 2–4</span></label><div class="m-scn-poll">' + ["Как доводить дела до конца", "Борьба с прокрастинацией", "Фокус и внимание", "Отдых без вины"].slice(0, E ? 2 : 4).map(function (o, i) { return '<div class="m-scn-poll-opt"><span class="po-n">' + (i + 1) + '</span>' + input(E ? "" : o, "") + '<button class="po-del">' + ic("x", 14) + '</button></div>'; }).join("") + '<button class="btn btn--secondary m-btn" style="align-self:flex-start;min-height:40px;margin-top:2px">' + ic("plus", 14) + ' Вариант</button></div></div>';
    else if (p.id === "seasonal") rows = field("Тема", input(E ? "" : "Новый месяц", "напр., Новый месяц, Новый год"), "Период дат — в «Когда» выше.");
    else if (p.id === "promo") rows = field("Что просим написать в комментах", input(E ? "" : "над чем вы застряли", "напр., над чем застряли", opts.err), opts.err ? "Заполни это поле — без него не собрать призыв." : "Одно короткое действие. Попадёт в текст призыва.", null, opts.err)
      + field("Что даём взамен", input(E ? "" : "короткий конкретный совет в ответ", "напр., короткий совет"), "Чем понятнее выгода, тем больше откликов.")
      + '<div class="m-scn-trow"><div class="lbl"><div class="t">' + ic("person", 14) + ' Требовать подписку</div><div class="d">Отвечаем только подписчикам.</div></div>' + toggle(!E) + '</div>'
      + '<div class="m-scn-trow"><div class="lbl"><div class="t">' + ic("heart", 14) + ' Требовать лайк</div><div class="d">Отвечаем только если лайкнули пост.</div></div>' + toggle(false) + '</div>';
    var actT = p.kind === "reply" ? "Ответит человеку в комментариях" : "Опубликует пост";
    var actS = p.id === "poll" ? "Опрос — обычный текстовый пост: у Threads нет встроенных опросов." : p.kind === "reply" ? "Готовит черновик ответа в твоём голосе." : "Готовит черновик поста в твоём голосе.";
    var headBlock = '<div class="m-sc-whatdo"><span class="wd-ico">' + (p.kind === "reply" ? ic("bubble", 18) : cic("send", 18)) + '</span><div><div class="wd-t">' + actT + '</div><div class="wd-s">' + actS + '</div></div></div>';
    return ap2head("что сделает", "Что Pennedly сделает", "Только то, что нельзя угадать за тебя.", headBlock + rows);
  }
  function rulesSection(p, open) {
    var rules = SR.RULES[p.id] || SR.RULES.custom;
    return '<div class="m-scn-baked' + (open ? " is-open" : "") + '"><button class="m-scn-baked-head"><span class="bh-ico">' + ic("check", 15) + '</span><span class="bh-t">Что Pennedly добавит от себя</span><span class="bh-chev">' + ic("chev-right", 16) + '</span></button>'
      + (open ? '<div class="m-scn-baked-body"><p class="m-scn-baked-intro">Проверенные правила поверх твоего голоса. Их видно, но менять нельзя — так превью честное.</p>'
        + rules.map(function (r) { return '<div class="m-scn-baked-rule"><span class="br-ico">' + ic("check", 14) + '</span><span>' + r + '</span></div>'; }).join("")
        + '<div class="m-scn-baked-foot">' + cic("lock", 12) + ' Только для чтения · поверх — твой голос</div></div>' : "") + '</div>';
  }
  function moreSection(p, open) {
    var onlyif = p.kind === "reply"
      ? '<div class="m-sc-onlyif-row"><div><div class="oi-t">Пропускать спам и токсичность</div><div class="oi-d">Не отвечать на оскорбления и спам.</div></div><div class="oi-control">' + toggle(true) + '</div></div>'
        + '<div class="m-sc-onlyif-row"><div><div class="oi-t">Только содержательные</div><div class="oi-d">Пропускать пустые «спасибо».</div></div><div class="oi-control">' + toggle(true) + '</div></div>'
        + '<div class="m-sc-onlyif-row"><div><div class="oi-t">Не больше ответов в день</div><div class="oi-d">Чтобы не завалить ленту.</div></div><div class="oi-control">' + input("20", "") + '</div></div>'
      : '<div class="m-sc-onlyif-row"><div><div class="oi-t">Только по будням</div><div class="oi-d">Не публиковать по выходным.</div></div><div class="oi-control">' + toggle(p.id === "column") + '</div></div>'
        + '<div class="m-sc-onlyif-row"><div><div class="oi-t">Не повторять тему дня</div><div class="oi-d">Пропустить, если похожий пост уже вышел.</div></div><div class="oi-control">' + toggle(true) + '</div></div>';
    return '<div class="m-sc-more' + (open ? " is-open" : "") + '"><button class="m-sc-more-head"><span class="mh-ico">' + ic("chev-right", 16) + '</span><span class="mh-t">' + cic("sliders", 14) + ' Ещё настройки</span><span class="mh-hint">' + (open ? "" : "не обязательно") + '</span></button>'
      + (open ? '<div class="m-sc-more-body">'
        + '<div class="m-sc-more-group"><div class="mg-k">' + (p.kind === "reply" ? "Кому и сколько отвечать" : "Только если") + '</div>' + onlyif + '</div>'
        + '<div class="m-sc-more-group"><div class="mg-k">Тихие часы</div><div class="m-sc-onlyif-row" style="padding-top:2px;border:none"><div><div class="oi-t">Не публиковать ночью</div><div class="oi-d">Пауза с 23:00 до 8:00.</div></div><div class="oi-control">' + toggle(true) + '</div></div></div>'
        + '<div class="m-sc-more-group"><div class="mg-k">Аккаунт</div>' + selectEl("Алекс · @alex.makes", ["Алекс · @alex.makes", "Заметки · @alex.notes"]) + '</div>'
        + '</div>' : "") + '</div>';
  }
  function advancedSection(p, open) {
    var trig = p.id === "boost" ? "Когда пост перейдёт N просмотров" : p.id === "thanks" ? "Когда наберётся N подписчиков" : p.id === "duty" ? "Каждые 15 минут" : p.id === "column" || p.id === "poll" ? "Еженедельно" : p.id === "seasonal" || p.id === "promo" ? "В период дат" : "Ежедневно";
    return '<div class="m-scn-disclose' + (open ? " is-open" : "") + '"><button class="m-scn-disclose-head"><span class="dh-ico">' + ic("chev-right", 16) + '</span><span class="m-scn-disclose-t">Показать как правило</span><span class="m-scn-disclose-hint">для продвинутых</span></button>'
      + (open ? '<div class="m-scn-disclose-body"><div class="m-scn-disclose-note">Та же рутина сырыми полями. Связана с формой выше.</div>'
        + field("Когда", selectEl(trig, ["Ежедневно", "Раз в N дней", "Еженедельно", "В период дат", "Каждые 15 минут", "Когда пост перейдёт N просмотров"]))
        + field('Только если <span style="font-weight:400;color:var(--color-text-subtle)">· необязательно</span>', selectEl("Без условия", ["Без условия", "Только по будням", "Только для подписчиков", "Если за день не было постов"]))
        + field("Что сделать", selectEl(p.kind === "reply" ? "Ответ в комментариях" : "Пост", ["Пост", "Ответ в комментариях"]), "Только пост и ответ — другого пока нет.")
        + '</div>' : "") + '</div>';
  }

  /* ════════════ preview ════════════ */
  function pollBlock(q, opts) {
    return '<div style="font-size:var(--text-small);line-height:1.55;color:var(--color-text);margin-bottom:10px">' + q + '</div>'
      + opts.map(function (o, i) { var pct = [42, 28, 19, 11][i] || 8; return '<div style="position:relative;border:1px solid var(--color-border);border-radius:var(--radius-md);padding:8px 11px;margin-bottom:7px;overflow:hidden;font-size:var(--text-small)"><span style="position:absolute;inset:0;width:' + pct + '%;background:color-mix(in srgb,var(--color-accent) 12%,transparent)"></span><span style="position:relative;display:flex;justify-content:space-between"><span>' + o + '</span><span style="color:var(--color-text-subtle)">' + pct + '%</span></span></div>'; }).join("");
  }
  function mockPost(s) {
    var C = SR.CREATOR;
    var body = s.poll ? pollBlock(s.poll[0], s.poll[1]) : '<div class="m-autopost-text">' + s.post + '</div><div class="m-autopost-foot"><div class="m-autopost-stats"><span class="ms">' + ic("eye", 13) + ' ' + s.stats[0] + '</span><span class="ms">' + ic("heart", 13) + ' ' + s.stats[1] + '</span><span class="ms">' + ic("bubble", 13) + ' ' + s.stats[2] + '</span></div></div>';
    return '<div class="m-autopost"><div class="m-autopost-top">' + av(C.initial) + '<div class="m-autopost-who"><span class="n">' + C.name + '</span><span class="h">' + C.handle + '</span></div><span class="m-autopost-time">' + s.time + '</span></div>' + body + '</div>';
  }
  function mockReply(r) {
    var C = SR.CREATOR;
    return '<div class="m-autoreply" style="margin-top:12px"><div class="m-ar-comment"><span class="m-ar-av">' + r.who[0] + '</span><div><div class="m-ar-who">' + r.who + '</div><div style="font-size:var(--text-small);color:var(--color-text-muted);margin-top:1px">' + r.text + '</div></div></div>'
      + '<div style="display:flex;gap:9px;margin-top:11px;padding-left:13px"><span class="m-ar-av">' + C.initial + '</span><div><div style="display:flex;align-items:center;gap:7px;font-size:var(--text-caption);font-weight:600;margin-bottom:3px">' + C.name + ' <span style="color:var(--color-accent);display:inline-flex;align-items:center;gap:4px">' + ic("bubble", 11) + ' ответ Pennedly</span></div><div style="font-size:var(--text-small);color:var(--color-text);line-height:1.55">' + r.bot + '</div></div></div></div>';
  }
  function previewSection(p, opts) {
    opts = opts || {};
    var s = SR.SAMPLE[p.id];
    var body;
    if (opts.state === "loading") {
      body = '<div class="m-scn-prevload"><span class="skel-line" style="width:44%;height:11px"></span><span class="skel-line" style="width:100%;height:13px"></span><span class="skel-line" style="width:88%;height:13px"></span><span class="skel-line" style="width:100%;height:70px;border-radius:10px;margin-top:6px"></span></div>';
    } else {
      body = (s.cta ? '<div class="m-scn-prevcta"><div class="k">Собранный призыв</div><div class="txt">' + s.cta + '</div></div>' : "")
        + '<div class="m-sc-invoice">' + ic("sparkle", 13) + '<span>В твоём голосе · на основе <b>' + s.invoice + '</b>. Не выдумывает за тебя.</span></div>'
        + (opts.runResult ? '<div class="m-scn-draftnote">' + cic("checkc", 16) + '<span>Черновик создан<span class="dn-sub">Ничего не опубликовано. Найдёшь в Студии.</span></span></div>' : "")
        + (s.post || s.poll ? mockPost(s) : "")
        + (s.reply ? mockReply(s.reply) : "")
        + '<div class="m-scn-whenfires">' + ic("clock", 14) + '<span>Сработает: <b>' + s.fires + '</b></span></div>'
        + (opts.runResult ? "" : '<div class="m-scn-runnow"><button class="btn btn--secondary m-btn">' + cic("play", 14) + ' Прогнать сейчас</button><div class="rn-note">Создаст черновик прямо сейчас — никогда не публикует.</div></div>');
    }
    return '<div class="m-ap2sec"><div class="m-scn-prevcap"><span class="cap">' + ic("sparkle", 13) + ' Превью в твоём голосе</span>'
      + (opts.state === "loading" ? "" : '<button class="btn btn--ghost m-btn" style="min-height:36px;padding:0 12px">' + ic("repeat", 14) + '</button>') + '</div>'
      + '<div class="m-ap2body">' + body + '</div></div>';
  }

  /* ════════════ sticky bottom ACTION PANEL (editor / constructor) ════════════ */
  function stickyBar(opts) {
    opts = opts || {};
    var enable = opts.saving ? '<button class="btn btn--primary m-btn" aria-disabled="true"><span class="spinner"></span> Сохранение…</button>' : '<button class="btn btn--primary m-btn">' + ic("check", 15) + ' Сохранить и включить</button>';
    var save = opts.saving ? '<button class="btn btn--secondary m-btn" aria-disabled="true">Сохранение…</button>' : '<button class="btn btn--secondary m-btn">Сохранить выключенным</button>';
    var del = opts.existing ? '<button class="sb-del">' + ic("trash", 15) + ' Удалить сценарий</button>' : "";
    return '<div class="m-sc-stickybar">' + enable + save + del + '</div>';
  }

  /* ════════════ editor body (template-seeded) ════════════ */
  function editorBody(p, opts) {
    opts = opts || {};
    var nameVal = opts.empty ? "" : (p.id === "column" ? "Маленькая победа" : p.id === "promo" ? "Разбор ваших затыков" : p.name);
    var out = ap2(sentence(p, opts) + '<div style="height:12px"></div>' + skel(p));
    out += ap2(field("Название", input(nameVal, "напр., " + p.name)));
    out += whenSection(p, opts);
    out += whatdoSection(p, opts);
    out += ap2(rulesSection(p, opts.rules));
    out += ap2(moreSection(p, opts.more));
    out += ap2(advancedSection(p, opts.advanced));
    out += previewSection(p, opts);
    if (opts.err) out += '<div class="m-error"><span class="eb-mark">' + ic("alert", 18) + '</span><div><div class="eb-title">Не получилось сохранить</div><div class="eb-sub">Проверь обязательные поля. Изменения не потеряны.</div></div></div>';
    return out;
  }

  /* ════════════ D · КОНСТРУКТОР (from scratch) ════════════ */
  function actcard(on, ico, t, d) {
    return '<div class="m-sc-actcard' + (on ? " is-on" : "") + '"><span class="ac-ico">' + (ico === "send" ? cic("send", 18) : ic("bubble", 18)) + '</span><div class="ac-body"><div class="ac-t">' + t + '</div><div class="ac-d">' + d + '</div></div>' + toggle(on) + '</div>';
  }
  function postSub(opts) {
    return '<div class="m-sc-subblock"><span class="m-sc-subblock-k">' + cic("send", 13) + ' Что постить</span>'
      + field("Инструкция для поста", mta(opts.empty ? "" : "Короткий вопрос-размышление по теме «довести дело до конца» — один открытый вопрос на одно слово в ответ.", "опиши, о чём и как писать"))
      + '<div class="m-sc-tip"><div class="tip-k">' + ic("sparkle", 13) + ' Как написать хорошую инструкцию</div><ul><li>Одна задача на пост — тема + формат.</li><li>Скажи тон и длину: «коротко, тепло, без клише».</li><li>Дай зацепку для ответа — вопрос или призыв.</li></ul><div class="tip-ex"><b>Пример</b>Каждое утро — короткий вопрос на одно слово в ответ, в моём тоне, без «продающих» формулировок.</div></div></div>';
  }
  function replySub(opts) {
    return '<div class="m-sc-subblock"><span class="m-sc-subblock-k">' + ic("bubble", 13) + ' Как отвечать</span>'
      + field("Кому отвечаем", selectEl("Всем, кроме троллей", ["Только тёплым и фанатам", "Всем, кроме троллей", "Только тем, кто задал вопрос"]))
      + field("Инструкция для ответа", mta(opts.empty ? "" : "По имени, по сути комментария, одно наблюдение и мягкий вопрос. Без шаблонов.", "как звучит каждый ответ")) + '</div>';
  }
  function constructorBody(opts) {
    opts = opts || {};
    var post = !opts.replyOnly, reply = !opts.postOnly;
    if (opts.postOnly) { post = true; reply = false; }
    if (opts.replyOnly) { post = false; reply = true; }
    var shape = post && reply ? "расписание · пост + ответы" : reply && !post ? "дежурный по ответам" : "расписание · пост";
    var out = ap2(field("Название", input(opts.empty ? "" : "Мой утренний вопрос", "напр., Утренний вопрос")));
    out += whenSection({ id: "custom", kind: "post" }, { mode: "daily" });
    out += ap2head("что делать", "Что Pennedly сделает", "Постить, отвечать или и то и другое.",
      '<div class="m-sc-actpick">' + actcard(post, "send", "Публиковать посты", "Сам постит по расписанию.") + actcard(reply, "bubble", "Отвечать на комментарии", "Сам отвечает тем, кто пишет.") + '</div>'
      + (post ? postSub(opts) : "") + (reply ? replySub(opts) : ""));
    out += ap2head("если", 'Условие <span style="font-weight:400;color:var(--color-text-subtle)">· необязательно</span>', "Сузь, когда срабатывает.",
      selectEl("Без условия", ["Без условия", "Только по будням", "Только для подписчиков", "Если за день не было постов", "Если пост перейдёт порог просмотров"]));
    out += ap2(rulesSection({ id: "custom", kind: "post" }, opts.rules));
    out += ap2('<span class="m-sc-compiles">' + ic("repeat", 14) + ' Соберётся в: <b>' + shape + '</b></span>');
    out += previewSection({ id: "talk", kind: "post" }, opts);
    return out;
  }

  /* ════════════ enable sheet ════════════ */
  function enableSheet(p, opts) {
    opts = opts || {};
    var selm = opts.mode || "ask";
    var ask = '<button class="m-sc-mode' + (selm === "ask" ? " is-on" : "") + '"><span class="mo-radio"></span><div><div class="mo-t">Спроси меня перед публикацией <span class="mo-default">по умолчанию</span></div><div class="mo-d">' + (p.kind === "reply" ? "Готовит ответ → ты подтверждаешь в «Активности»." : "Готовит черновик → ты подтверждаешь публикацию.") + '</div></div></button>';
    var auto = '<button class="m-sc-mode is-auto' + (selm === "auto" ? " is-on" : "") + '"><span class="mo-radio"></span><div><div class="mo-t">Публиковать автоматически</div><div class="mo-d">' + (p.kind === "reply" ? "Pennedly отвечает живым людям сам, без подтверждения." : "Pennedly публикует сам, без подтверждения.") + '</div></div></button>';
    var gate = opts.autopostOff && p.kind === "post" ? '<div class="m-sc-autopost-inline"><span class="ai-ico">' + ic("info", 16) + '</span><div><div class="ai-t">Сначала включи автопубликацию аккаунта</div><div class="ai-d">Без неё Pennedly будет только готовить черновики. Включим сейчас:</div><div class="ai-toggle">' + toggle(false) + ' Разрешить публиковать на @alex.makes</div></div></div>' : "";
    var reactive = p.replies && selm === "auto" ? '<div class="m-sc-reactive-confirm"><span class="rc-check">' + ic("check", 13) + '</span><div class="rc-text">Понимаю: будет <b>сам отвечать живым людям</b>, без моего подтверждения каждого ответа.</div></div>' : "";
    return '<div class="m-scrim"></div><div class="m-sheet"><div class="m-sheet-grip"></div>'
      + '<div class="m-sc-enable-head"><span class="eh-ico">' + ic("repeat", 18) + '</span><div><div class="eh-t">Включить «' + (p.id === "column" ? "Маленькая победа" : p.name) + '»?</div><div class="eh-s">' + p.sentence({}) + '</div></div></div>'
      + '<div class="m-sc-modepick">' + ask + auto + '</div>' + gate + reactive
      + '<div class="m-sc-enable-actions"><button class="btn btn--primary m-btn">' + ic("check", 15) + ' Включить</button><button class="btn btn--secondary m-btn">Отмена</button></div></div>';
  }

  /* ════════════ B · МОИ СЦЕНАРИИ — control center (active / paused) ════════════ */
  var WKf = { talk: [1, 1, 1, 1, 1, 1, 1], column: [0, 1, 0, 0, 0, 0, 0], safety: [1, 1, 1, 1, 1, 1, 1] };
  function cadStrip(fire, cap, evt, evtLabel) {
    if (evtLabel) return '<div class="m-scn-cadence"><span class="m-scn-cad-cap">' + cic("bolt2", 13) + '<span class="cw">' + evtLabel + '</span></span></div>';
    var days = '<div class="m-scn-cad-days">' + WK.map(function (d, i) { return '<span class="m-scn-cad-day' + (fire[i] ? " fire" + (evt ? " fire--evt" : "") : "") + '">' + d + '</span>'; }).join("") + '</div>';
    return '<div class="m-scn-cadence">' + days + '<span class="m-scn-cad-cap">' + ic("clock", 12) + '<span class="cw">' + cap + '</span></span></div>';
  }
  function ccCard(o) {
    var p = o.preset;
    var status = '<span class="m-sc-bigstatus' + (o.on ? " is-on" : "") + '"><span class="bs-dot"></span>' + (o.on ? "Активен" : "На паузе") + '</span>';
    var createdoff = !o.on ? '<div class="m-sc-createdoff"><span class="co-ico">' + ic("info", 15) + '</span><span class="co-text"><b>Создан, но выключен.</b> Пока ничего не делает — включи, когда будешь готов.</span><button class="btn btn--primary m-btn">' + ic("check", 14) + ' Включить</button></div>' : "";
    var runlink = o.on ? '<span class="m-sc-runlink">' + ic("repeat", 12) + ' сработал <b>' + (o.runs || 0) + '</b>× · Активность</span>' : "";
    return '<div class="m-scncard' + (o.on ? " is-on" : " is-off") + '">'
      + '<div class="m-scncard-head"><span class="m-scncard-ico">' + icoOf(p) + '</span>'
      + '<div class="m-scncard-titles"><div class="m-scncard-name">' + o.name + '</div>'
      + '<div class="m-scncard-badges">' + status + (p.replies ? '<span class="m-sc-plaque">' + ic("bubble", 11) + ' отвечает людям</span>' : "") + '</div></div>'
      + '<div class="m-scncard-toggle">' + toggle(o.on) + '</div></div>'
      + '<div class="m-sc-cardline">' + p.sentence(o.fields || {}) + '</div>'
      + createdoff
      + cadStrip(o.fire || WKf[p.id] || [1, 1, 1, 1, 1, 0, 0], o.cap, o.evt, o.evtLabel)
      + '<div class="m-scncard-runs"><div class="m-scncard-run"><span class="k">след. запуск</span><span class="v' + (o.on ? "" : " muted") + '">' + (o.on ? o.next : "на паузе") + '</span></div>' + runlink + '</div>'
      + '<div class="m-scn-cardacts"><a class="btn btn--ghost m-btn" style="flex:1 1 0">' + ic("repeat", 14) + ' Применить к…</a><a class="btn btn--secondary m-btn" style="flex:1 1 0">' + ic("pencil", 14) + ' Редактировать</a></div></div>';
  }
  var CC = {
    talk: { preset: P.talk, name: "Утренний вопрос", on: true, mode: "ask", cap: "утром, 9:00", next: "Завтра, 9:00", runs: 38 },
    duty: { preset: P.duty, name: "Отвечать на комментарии", on: true, mode: "ask", evtLabel: "Проверяет каждые 15 минут", next: "По мере комментов", runs: 142 },
    column: { preset: P.column, name: "Маленькая победа", on: true, mode: "ask", fields: { name: "Маленькая победа" }, cap: "вт, 12:00", next: "Вт, 12:00", runs: 21 },
    safety: { preset: P.safety, name: "Если сегодня не постил", on: false, mode: "ask", cap: "вечером, 19:00", next: "", runs: 4 }
  };
  function ccHead() {
    return '<div class="m-scn-cchead"><span class="cc-k">' + ic("repeat", 13) + ' Твоя неделя · время аккаунта</span><span class="m-scn-cap"><span class="m-scn-cap-l">Постов/день</span><span class="m-scn-stepper"><button>' + ic("x", 14) + '</button><span class="sv">1</span><button>' + ic("plus", 14) + '</button></span></span></div>';
  }
  function secHead(t, c, active) { return '<div class="m-sc-sec-head' + (active ? " m-sc-sec-head--active" : "") + '"><span class="m-sc-sec-title">' + t + '</span><span class="m-sc-sec-count">' + c + '</span><span class="m-sc-sec-rule"></span></div>'; }
  function gl(cards) { return '<div style="display:flex;flex-direction:column;gap:12px">' + cards.join("") + '</div>'; }
  function controlList(opts) {
    opts = opts || {};
    return intro("Сценарии", "Что Pennedly делает за тебя — и что на паузе. Одним взглядом.") + ccHead()
      + (opts.warn ? warnStack() : "")
      + secHead("Активные", 3, true) + gl([ccCard(CC.talk), ccCard(CC.duty), ccCard(CC.column)])
      + secHead("На паузе", 1, false) + gl([ccCard(CC.safety)]);
  }
  function warnStack() {
    return '<div class="m-scn-warn"><span class="sw-mark">' + ic("alert", 16) + '</span><div><div class="sw-title">Два поста метят на одно утро</div><div class="sw-sub"><b>Утренний вопрос</b> и <b>Сезонная тема</b> хотят выйти первым постом — а лимит 1 пост в день. Подними лимит или разнеси по времени.</div></div></div>';
  }
  function applySheet() {
    var accts = [["Алекс · @alex.makes", "@alex.makes", true], ["Заметки", "@alex.notes", false]];
    return '<div class="m-scrim"></div><div class="m-sheet"><div class="m-sheet-grip"></div><div class="m-sheet-head"><div class="m-sheet-title">Скопировать на другой аккаунт</div></div>'
      + '<div style="font-size:var(--text-caption);color:var(--color-text-subtle);margin:0 2px 8px">Времена пересчитаются в локальную зону аккаунта.</div>'
      + accts.map(function (a) { return '<div class="m-scn-acct">' + toggle(a[2]) + '<span class="ac-name">' + a[0] + '</span><span class="ac-h">' + a[1] + '</span></div>'; }).join("")
      + '<div style="display:flex;flex-direction:column;gap:10px;margin-top:14px"><button class="btn btn--primary m-btn">' + ic("check", 15) + ' Скопировать</button><button class="btn btn--secondary m-btn">Отмена</button></div></div>';
  }
  function skelCard() {
    return '<div class="m-scncard skeleton" style="margin-bottom:12px"><div class="m-scncard-head"><span class="skel-line" style="width:38px;height:38px;border-radius:10px;flex:0 0 auto"></span><div style="flex:1 1 auto"><span class="skel-line" style="width:70%;height:15px"></span><span class="skel-line" style="width:40%;height:11px;margin-top:9px"></span></div><span class="skel-line" style="width:80px;height:28px;border-radius:9999px;flex:0 0 auto"></span></div><span class="skel-line" style="width:100%;height:28px;border-radius:6px"></span></div>';
  }
  function listLoading() { return intro("Сценарии", "Что Pennedly делает за тебя — одним взглядом.") + skelCard() + skelCard() + skelCard(); }
  function listError() {
    return intro("Сценарии", "Что Pennedly делает за тебя — одним взглядом.") + '<div class="m-error"><span class="eb-mark">' + ic("alert", 18) + '</span><div><div class="eb-title">Не удалось загрузить</div><div class="eb-sub">Что-то пошло не так при обращении к Threads. Сценарии в безопасности.</div><button class="btn btn--secondary m-btn">' + ic("repeat", 15) + ' Повторить</button></div></div>';
  }

  /* ════════════ Активность ════════════ */
  function activity() {
    var draftPost = '<div class="m-sc-act-draft"><div class="m-sc-act-draft-head"><span class="ad-tag">' + cic("eyecheck", 13) + ' Ждёт подтверждения</span><span class="ad-when">к 9:00</span></div>'
      + '<div class="m-sc-act-draft-ctx"><b>Утренний вопрос</b> · черновик поста</div>'
      + '<div class="m-sc-act-draft-body">Вопрос на сегодня: что вы сегодня доведёте до конца — даже если получится неидеально? Напишите одним словом 👇</div>'
      + '<div class="m-sc-act-draft-actions"><button class="btn btn--primary m-btn">' + cic("send", 14) + ' Опубликовать</button><button class="btn btn--secondary m-btn">' + ic("pencil", 14) + ' Изменить</button></div></div>';
    var draftReply = '<div class="m-sc-act-draft"><div class="m-sc-act-draft-head"><span class="ad-tag">' + ic("bubble", 13) + ' Ждёт подтверждения</span><span class="ad-when">12 мин назад</span></div>'
      + '<div class="m-sc-act-draft-ctx"><b>Отвечать на комментарии</b> · ответ Марине</div>'
      + '<div class="m-sc-act-draft-body">Марина, когда сил нет, цель не «сделать», а «начать на 5 минут» — почти всегда этого хватает. С чего бы вы начали эти пять минут?</div>'
      + '<div class="m-sc-act-draft-actions"><button class="btn btn--primary m-btn">' + cic("send", 14) + ' Отправить ответ</button><button class="btn btn--secondary m-btn">' + ic("pencil", 14) + ' Изменить</button></div></div>';
    function item(reply, text, sub) {
      return '<div class="m-sc-act-item"><span class="ai-dot' + (reply ? " is-reply" : "") + '">' + (reply ? ic("bubble", 14) : cic("send", 14)) + '</span><div class="ai-main"><div class="ai-text">' + text + '</div><div class="ai-sub">' + sub + '</div><a class="link ai-open" href="#">Открыть в Threads ' + cic("external", 11) + '</a></div></div>';
    }
    return intro("Активность", "Что Pennedly сделал и что ждёт твоего слова — по-человечески.")
      + '<div class="m-sc-activity"><div class="m-sc-act-section"><span class="as-k">Ждут подтверждения · 2</span>' + draftPost + draftReply + '</div>'
      + '<div class="m-sc-act-section"><span class="as-k">Уже сделано</span><div class="m-sc-act-list">'
      + item(false, 'Опубликовал твой <b>утренний вопрос</b>', "Сегодня в 9:02 · 1,2K просмотров")
      + item(true, 'Ответил <b>Диме</b> под постом «Разбор затыков»', "Сегодня в 8:41")
      + item(false, 'Опубликовал рубрику <b>«Маленькая победа»</b>', "Вчера в 12:00 · 960 просмотров")
      + item(true, 'Ответил <b>Анне</b> под постом «Утренний вопрос»', "Вчера в 9:18")
      + '</div></div></div>';
  }

  /* ══════════════════════════════ MOUNT ════════════════════════════════ */
  var topHome = M.top({ title: "Сценарии", menu: true, pill: "success", pillText: "3 активны", action: "plus" });
  var topNew = M.top({ title: "Сценарии", menu: true, action: "plus" });
  var topCatalog = M.top({ title: "Готовые шаблоны", menu: false, back: true });
  var topConstruct = M.top({ title: "Свой с нуля", menu: false, back: true });
  var topTalk = M.top({ title: "Утренний вопрос", menu: false, back: true });
  var topReact = M.top({ title: "Раскрутить залетевший", menu: false, back: true });
  var topDuty = M.top({ title: "Отвечать на комментарии", menu: false, back: true });
  var topPromo = M.top({ title: "Разбор ваших затыков", menu: false, back: true });
  var topAct = M.top({ title: "Активность", menu: false, back: true });

  /* §2 — drawer / shell */
  set("stg-drawer",
    M.col(M.light("Гамбургер → drawer"), M.phone({ top: topHome, body: controlList(), tabs: false, overlay: M.drawer("scenarios") }), "Активная = Scenarios (repeat), Voice & automation, перед Autopilot.") +
    M.col(M.dark("· dark"), M.phone({ dark: true, top: topHome, body: controlList(), tabs: false, overlay: M.drawer("scenarios") }), ""));

  /* §3 — A · старт / обучение (= пустое состояние) */
  set("stg-teach",
    M.col(M.light("A · Старт / обучение"), M.phone({ top: topNew, body: teach(), tabs: false }), "Что такое сценарий + «как выглядит» + «как работает» + 2 кнопки.") +
    M.col(M.dark("· dark"), M.phone({ dark: true, top: topNew, body: teach(), tabs: false }), ""));

  /* §4 — B · мои сценарии */
  set("stg-home",
    M.col(M.light("B · Мои сценарии · активные + на паузе"), M.phone({ top: topHome, body: controlList(), tabs: false }), "Секции «Активные»/«На паузе» с количеством; карта = предложение + большой статус.") +
    M.col(M.dark("· dark"), M.phone({ dark: true, top: topHome, body: controlList(), tabs: false }), ""));
  set("stg-home-empty",
    M.col(M.light("B · пусто → ведёт в A (старт)"), M.phone({ top: topNew, body: teach(), tabs: false }), "Нет сценариев → стартовый-обучающий экран, не пустая таблица."));
  set("stg-home-card",
    M.col(M.light("Активен · предложение + статус"), M.comp(ccCard(CC.talk)), "Статус «Активен», «сработал N× · Активность», действия.") +
    M.col(M.light("Reply · честно «каждые 15 минут»"), M.comp(ccCard(CC.duty)), "Плашка «отвечает людям», событие вместо полосы.") +
    M.col(M.dark("На паузе · «создан, но выключен» · dark"), M.comp(ccCard(CC.safety), { dark: true }), "Прямым текстом: «создан, но выключен» + «Включить»."));
  set("stg-home-cc",
    M.col(M.light("Центр управления · лимит + стэкинг"), M.phone({ top: topHome, body: controlList({ warn: true }), tabs: false }), "Лимит постов/день + предупреждение называет конкретные сценарии."));
  set("stg-home-states",
    M.col(M.light("Загрузка"), M.phone({ top: topNew, body: listLoading(), tabs: false }), "Скелетоны.") +
    M.col(M.dark("Ошибка · dark"), M.phone({ dark: true, top: topNew, body: listError(), tabs: false }), "Баннер + «Повторить».") +
    M.col(M.light("«Скопировать на другой аккаунт» · sheet"), M.phone({ top: topHome, body: controlList(), tabs: false, overlay: applySheet() }), "«Применить к…» — bottom sheet."));

  /* §5 — C · каталог */
  set("stg-catalog",
    M.col(M.light("C · Каталог · по цели + примеры"), M.phone({ top: topCatalog, body: catalog(), tabs: false }), "«← Сценарии» в топбаре; «с нуля» вверху; группы по цели; пример на карте.") +
    M.col(M.dark("· dark"), M.phone({ dark: true, top: topCatalog, body: catalog(), tabs: false }), ""));
  set("stg-catalog-card",
    M.col(M.light("Карта шаблона · пост-пример"), M.comp(presetCard(P.talk)), "Бенефит + «будет…» + пример поста + плашка.") +
    M.col(M.light("Карта · ответ-пример"), M.comp(presetCard(P.duty)), "«Отвечает людям» + пример авто-ответа.") +
    M.col(M.dark("Карта · кампания (gated) · dark"), M.comp('<div class="m-scn-pcampaign">' + presetCard(P.promo) + '</div>', { dark: true }), "Замок + пример поста + ответа."));

  /* §6 — D · конструктор (sticky action bar) */
  set("stg-constructor",
    M.col(M.light("D · Конструктор · пост + ответы"), M.phone({ top: topConstruct, body: constructorBody({}), tabs: stickyBar({}) }), "Когда · действие (пост и/или ответ) · условие · sticky-панель снизу.") +
    M.col(M.dark("· dark"), M.phone({ dark: true, top: topConstruct, body: constructorBody({}), tabs: stickyBar({}) }), ""));
  set("stg-constructor-act",
    M.col(M.light("Только пост"), M.phone({ top: topConstruct, body: constructorBody({ postOnly: true }), tabs: stickyBar({}) }), "Инструкция поста + подсказка с примером.") +
    M.col(M.light("Только ответы (дежурный)"), M.phone({ top: topConstruct, body: constructorBody({ replyOnly: true }), tabs: stickyBar({}) }), "Кому + инструкция ответа. Соберётся в «дежурный по ответам»."));

  /* §7 — editor of existing (sticky action bar) */
  set("stg-editor",
    M.col(M.light("Редактор · «Рубрика» (из шаблона)"), M.phone({ top: topTalk, body: editorBody(P.column, { existing: true }), tabs: stickyBar({ existing: true }) }), "Та же форма, предзаполнена; sticky действия снизу с «Удалить».") +
    M.col(M.dark("Редактор · «Акция» · dark"), M.phone({ dark: true, top: topPromo, body: editorBody(P.promo, { existing: true }), tabs: stickyBar({ existing: true }) }), "Что просим / что даём + подписка-лайк; gated."));
  set("stg-editor-states",
    M.col(M.light("Раз в N дней + сохранение"), M.phone({ top: topTalk, body: editorBody(P.talk, { existing: true, everyN: true }), tabs: stickyBar({ existing: true, saving: true }) }), "Сегмент N + спиннеры на кнопках в sticky-панели.") +
    M.col(M.light("Ошибка валидации"), M.phone({ top: topPromo, body: editorBody(P.promo, { existing: true, err: true, state: "loading" }), tabs: stickyBar({ existing: true }) }), "Поле подсвечено + баннер; превью-скелетон.") +
    M.col(M.dark("Удаление · sheet · dark"), M.phone({ dark: true, top: topPromo, body: editorBody(P.promo, { existing: true }), tabs: stickyBar({ existing: true }), overlay: '<div class="m-scrim"></div><div class="m-sheet m-csheet"><div class="m-sheet-grip"></div><div class="m-csheet-ico" style="background:color-mix(in srgb,var(--color-danger) 13%,var(--color-surface));border:1px solid color-mix(in srgb,var(--color-danger) 28%,transparent);color:var(--color-danger)">' + ic("trash", 20) + '</div><div class="m-csheet-title">Удалить сценарий?</div><div class="m-csheet-sub">«Разбор ваших затыков» перестанет запускаться и будет удалён. Действие необратимо.</div><div class="m-csheet-actions"><button class="btn btn--danger m-btn">' + ic("trash", 15) + ' Удалить</button><button class="btn btn--secondary m-btn">Отмена</button></div></div>' }), "Подтверждение — bottom sheet, danger сверху."));

  /* §8 — enable moment */
  set("stg-enable",
    M.col(M.light("Включение · «Спроси меня»"), M.phone({ top: topTalk, body: editorBody(P.talk, { existing: true }), tabs: stickyBar({ existing: true }), overlay: enableSheet(P.talk, { mode: "ask" }) }), "Включение — через подтверждение; выбор режима. Выключение — мгновенно.") +
    M.col(M.dark("Ответы людям · «Авто» + согласие · dark"), M.phone({ dark: true, top: topDuty, body: editorBody(P.duty, { existing: true }), tabs: stickyBar({ existing: true }), overlay: enableSheet(P.duty, { mode: "auto" }) }), "Мягкое согласие «будет сам отвечать людям».") +
    M.col(M.light("Гейт «Автопостинг» inline"), M.phone({ top: topTalk, body: editorBody(P.talk, { existing: true }), tabs: stickyBar({ existing: true }), overlay: enableSheet(P.talk, { mode: "auto", autopostOff: true }) }), "Глобальный гейт — здесь же, не баннером после."));

  /* §9 — preview + run-now */
  set("stg-preview",
    M.col(M.light("Превью в твоём голосе + Прогнать"), M.comp(previewSection(P.talk, {})), "Реальный пример + «в твоём голосе» + run-now (только черновик).") +
    M.col(M.dark("Результат прогона — ЧЕРНОВИК · dark"), M.comp(previewSection(P.column, { runResult: true }), { dark: true }), "Никогда не публикует."));

  /* §10 — activity */
  set("stg-activity",
    M.col(M.light("Активность · журнал + черновики"), M.phone({ top: topAct, body: activity(), tabs: false }), "Черновики ждут подтверждения + человеческий журнал со ссылками.") +
    M.col(M.dark("· dark"), M.phone({ dark: true, top: topAct, body: activity(), tabs: false }), ""));

  /* §11 — narrow 360 */
  set("stg-narrow",
    M.col(M.light("360 · каталог"), M.phone({ variant: "sm", top: topCatalog, body: catalog(), tabs: false }), "Карты full-width с примером, группы стопкой.") +
    M.col(M.light("360 · мои сценарии"), M.phone({ variant: "sm", top: topHome, body: controlList(), tabs: false }), "Активные/на паузе; предложение и статус не клипаются.") +
    M.col(M.dark("360 · конструктор · dark"), M.phone({ variant: "sm", dark: true, top: topConstruct, body: constructorBody({}), tabs: stickyBar({}) }), "Поля 16px / ≥44px; sticky-панель снизу."));
})();
