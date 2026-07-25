/* recipe-editor.js — рендер модели КАРТОЧКА-РЕЦЕПТ для редактора сценария.
   Строится на window.SR (scenarios-redesign-data.js) + recipe-editor.css.
   Один buildEditor(cfg) собирает весь экран; разные cfg дают кадры дока:
   пост/ответ, слот свёрнут/раскрыт, слой 2/3, новый/правка, из шаблона. */
(function () {
  "use strict";
  var SR = window.SR, C = SR.CREATOR;

  /* ------------------------------- icon bank -------------------------------- */
  function ic(n, s) {
    s = s || 14;
    var v = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
    var G = {
      clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
      repeat: '<path d="M17 2.5 20.5 6 17 9.5"/><path d="M3.5 11V9a3 3 0 0 1 3-3h14"/><path d="M7 21.5 3.5 18 7 14.5"/><path d="M20.5 13v2a3 3 0 0 1-3 3h-14"/>',
      bubble: '<path d="M21 12a8 8 0 0 1-11.5 7.2L4 20l1-5A8 8 0 1 1 21 12Z"/>',
      bubbleq: '<path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2Z"/><path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"/>',
      eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
      heart: '<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z"/>',
      person: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>',
      shield: '<path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3Z"/>',
      lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
      play: '<path d="M7 5l12 7-12 7V5Z"/>',
      sparkle: '<path d="M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3Z"/>',
      check: '<path d="M20 7 9 18l-5-5"/>',
      x: '<path d="M6 6l12 12M18 6 6 18"/>',
      chev: '<path d="M9 6l6 6-6 6"/>',
      back: '<path d="M15 18l-6-6 6-6"/>',
      pencil: '<path d="M4 20h4L19 9a2 2 0 0 0-3-3L5 17v3Z"/><path d="M14.5 6.5 17.5 9.5"/>',
      bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/>',
      sliders: '<path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h7M15 18h5"/><circle cx="16" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="13" cy="18" r="2"/>',
      info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.5v.5"/>',
      plus: '<path d="M12 5v14M5 12h14"/>',
      cal: '<rect x="3.5" y="5" width="17" height="16" rx="2"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/>',
      trophy: '<path d="M7 4h10v4a5 5 0 0 1-10 0V4Z"/><path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M9 20h6M12 13v4"/>',
      at: '<circle cx="12" cy="12" r="4"/><path d="M16 12v1.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-3.5 7.1"/>',
      hash: '<path d="M9 4 7 20M17 4l-2 16M5 9h15M4 15h15"/>',
      sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5 6.5 6.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19"/>',
      timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 2h6"/>',
      gauge: '<path d="M12 13l4-3"/><path d="M4 18a9 9 0 1 1 16 0"/><circle cx="12" cy="13" r="1.4"/>',
      layers: '<path d="M12 3 3 8l9 5 9-5-9-5Z"/><path d="M3 13l9 5 9-5M3 18l9 5 9-5"/>',
      shieldhouse: '<path d="M4 11l8-6 8 6v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z"/><path d="M9.5 20v-5h5v5"/>',
      megaphone: '<path d="M3 11v2a1 1 0 0 0 1 1h2l9 5V5L6 10H4a1 1 0 0 0-1 1Z"/><path d="M18 9a4 4 0 0 1 0 6"/>',
      type: '<path d="M5 6h14M12 6v13M9 19h6"/>',
      target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
      expand: '<path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3"/>'
    };
    return '<svg width="' + s + '" height="' + s + '" ' + v + '>' + (G[n] || '') + '</svg>';
  }

  /* ------------------------------- primitives ------------------------------- */
  function set(id, html) { var e = document.getElementById(id); if (e) e.innerHTML = html; }
  function frame(inner, dark) { return '<div class="frame' + (dark ? ' dark' : '') + '">' + inner + '</div>'; }
  function sw(on) { return '<label class="switch"><input type="checkbox"' + (on ? ' checked' : '') + ' aria-label="toggle"><span class="track"></span><span class="knob"></span></label>'; }
  function sel(val, opts) { return '<select class="field" aria-label="select">' + opts.map(function (o) { return '<option' + (o === val ? ' selected' : '') + '>' + o + '</option>'; }).join('') + '</select>'; }
  function av(initials, sz) { sz = sz || 32; return '<span style="width:' + sz + 'px;height:' + sz + 'px;display:inline-grid;place-items:center;border-radius:9999px;background:var(--color-surface-2);border:1px solid var(--color-border);font-size:' + Math.round(sz * 0.36) + 'px;font-weight:600;color:var(--color-text-muted);flex:0 0 auto">' + initials + '</span>'; }
  function why(html) { return '<div class="rc-why">' + ic('info', 13) + '<span>' + html + '</span></div>'; }
  function hard(html) { return '<div class="rc-hard">' + ic('lock', 13) + '<span>' + html + '</span></div>'; }
  function who() { return '<span class="who">' + C.handle + '</span>'; }

  /* свободный текст → удобный триггер, открывающий отдельное окно */
  function bigText(value, hint) {
    var empty = !value;
    return '<div class="bigtext"><div class="bigtext-val' + (empty ? ' is-empty' : '') + '">' + (value || 'Нажми, чтобы написать…') + '</div>'
      + '<div class="bigtext-foot"><span class="bt-hint">' + (hint || '') + '</span>'
      + '<button class="bigtext-expand">' + ic('expand', 13) + ' Открыть в отдельном окне</button></div></div>';
  }
  var BTM = {
    instruction: { ico: 'pencil', title: 'Что писать — инструкция в твоём голосе', value: 'короткий вопрос на одно слово в ответ, по теме дня, без штампов и «продающих» формулировок', hint: 'Это твоя добавка поверх голоса из <b>Voice</b>. Базовые правила Pennedly применит сам.', ph: 'Опиши своими словами, что и как писать…' },
    tone: { ico: 'bubble', title: 'Как звучит ответ', value: 'по имени, одно наблюдение и мягкий вопрос — без шаблонов и «спасибо за комментарий»', hint: 'Тон поверх твоего голоса. <b>Тролли и спам</b> отсекаются ещё до черновика.', ph: 'Опиши, каким тоном отвечать…' },
    audience: { ico: 'person', title: 'Своя аудитория — кому отвечать', value: 'тем, кто пишет по делу, без флуда', hint: 'Pennedly прочитает каждый комментарий и решит — подходит под твоё описание или нет.', ph: 'Опиши свою аудиторию словами…' }
  };
  function bigTextModal(field) {
    var m = BTM[field] || BTM.instruction;
    return '<div class="bt-overlay"><div class="bt-scrim"></div><div class="bt-dialog" role="dialog" aria-modal="true">'
      + '<div class="bt-dh"><span class="bt-dh-ico">' + ic(m.ico, 16) + '</span><span class="bt-dh-t">' + m.title + '</span>'
      + '<button class="bt-dh-x" aria-label="Закрыть">' + ic('x', 16) + '</button></div>'
      + '<div class="bt-db"><textarea class="bt-area" placeholder="' + m.ph + '">' + m.value + '</textarea>'
      + '<div class="bt-why">' + ic('info', 13) + '<span>' + m.hint + '</span></div></div>'
      + '<div class="bt-df"><span class="bt-count">' + m.value.length + ' символов</span><span style="flex:1 1 auto"></span>'
      + '<button class="btn btn--secondary">Отмена</button>'
      + '<button class="btn btn--primary">' + ic('check', 15) + ' Сохранить</button></div>'
      + '</div></div>';
  }

  /* -------------------------------- slots ----------------------------------- */
  function slot(txt, open, icoName) {
    return '<span class="rc-slot' + (open ? ' is-open' : '') + '" role="button" tabindex="0">' + (icoName ? '<span class="rcs-ico">' + ic(icoName, 13) + '</span>' : '') + txt + '</span>';
  }
  function lockSlot(txt) { return '<span class="rc-slot--lock">' + ic('lock', 11) + txt + '</span>'; }
  function addSlot(txt) { return '<button class="rc-slot rc-slot--add">' + ic('plus', 12) + (txt || 'добавить условие') + '</button>'; }

  /* ------------------------------ drawer shell ------------------------------ */
  function drawer(title, icoName, body) {
    return '<div class="rc-drawer"><div class="rcd-head"><span class="rcdh-ico">' + ic(icoName, 15) + '</span>'
      + '<span class="rcdh-t">' + title + '</span>'
      + '<button class="rcdh-done">' + ic('check', 14) + ' Готово</button></div>'
      + '<div class="rcd-body">' + body + '</div></div>';
  }

  /* ════════════════ DRAWER BODIES ════════════════ */
  /* ════════ ГИБКИЙ ПЛАНИРОВЩИК «КОГДА» ════════ */
  var WHEN_SUMMARY = {
    daily: 'каждый день в 9:00',
    everyN: 'каждые 3 дня в 9:00',
    weekly: 'по будням в 9:00',
    monthly: '1 и 15 числа в 10:00',
    yearly: 'каждый год, 1 января',
    period: 'каждый день, 28 июн – 5 июл',
    event: 'когда пост наберёт 5 000 просмотров'
  };
  var MONTHS = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
  function nums(a, b) { var r = []; for (var i = a; i <= b; i++) r.push(String(i)); return r; }
  function daysInMonth(mi) { return [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][mi]; }

  function cadenceChips(mode) {
    var M = [['daily','Каждый день'],['everyN','Раз в N дней'],['weekly','По дням недели'],['monthly','Раз в месяц'],['yearly','Раз в год'],['period','Период дат'],['event','По событию']];
    return '<div class="sc-field"><label>Как часто</label><div class="seg seg--wrap" role="tablist">'
      + M.map(function (x) { return '<button class="seg-opt' + (x[0] === mode ? ' seg-opt--active' : '') + '">' + x[1] + '</button>'; }).join('') + '</div></div>';
  }
  function timeSection() {
    return '<div class="sc-field"><label>Во сколько <span class="sc-opt">· можно несколько раз в день</span></label>'
      + '<div class="rc-slots"><span class="rc-slotchip">9:00 <button class="scx" aria-label="убрать">' + ic('x', 12) + '</button></span>'
      + '<button class="rc-slotadd">' + ic('plus', 13) + ' Ещё время</button></div></div>'
      + '<div class="sc-field"><label>Разброс <span class="sc-opt">· чтобы не ровно по будильнику</span></label>'
      + '<div class="rc-jitter" style="max-width:300px"><div class="rcj-top"><span class="rcj-k">± минут</span><span class="rcj-v">15</span></div>'
      + '<input type="range" class="rc-range" min="0" max="120" value="15" aria-label="разброс"></div></div>'
      + hard('Публикация привязана к целому часу — точную минуту внутри часа задаёт разброс. Это ограничение площадки.');
  }
  function wkPills(arr) { return '<div class="wk-pills">' + SR.WK.map(function (x, i) { return '<button class="wk-pill' + (arr[i] ? ' wk-pill--on' : '') + '">' + x + '</button>'; }).join('') + '</div>'; }
  function toggleRow(t, d, on) { return '<div class="rc-toggle-row"><div class="rtr-l"><div class="rtr-t">' + t + '</div><div class="rtr-d">' + d + '</div></div>' + sw(on) + '</div>'; }
  function perDayTimes(arr) {
    var def = ['8:00','9:00','9:00','9:00','12:00','—','—']; var rows = '';
    SR.WK.forEach(function (x, i) {
      if (!arr[i]) return;
      rows += '<div class="daytime-row"><span class="dt-day">' + x + '</span><div class="rc-slots">'
        + '<span class="rc-slotchip">' + def[i] + ' <button class="scx" aria-label="убрать">' + ic('x', 12) + '</button></span>'
        + '<button class="rc-slotadd">' + ic('plus', 13) + '</button></div></div>';
    });
    return '<div class="sc-field"><label>Время по дням</label><div class="daytime-list">' + rows + '</div></div>';
  }
  function domGrid(selDays) {
    var cells = '';
    for (var i = 1; i <= 31; i++) { var rare = i > 28; cells += '<button class="wk-pill' + (rare ? ' dom-rare' : '') + (selDays.indexOf(i) >= 0 ? ' wk-pill--on' : '') + '">' + i + '</button>'; }
    var hasRare = selDays.some(function (d) { return typeof d === 'number' && d > 28; });
    var fallback = hasRare
      ? '<div class="dom-fallback"><span class="domf-k">' + ic('info', 13) + ' Если в месяце нет такого числа</span>'
        + sel('Опубликовать в последний день месяца', ['Опубликовать в последний день месяца', 'Пропустить этот месяц']) + '</div>'
      : '';
    return '<div class="dom-grid">' + cells + '</div>'
      + '<button class="wk-pill dom-last' + (selDays.indexOf('last') >= 0 ? ' wk-pill--on' : '') + '">Последний день месяца</button>'
      + '<div class="dom-note">' + ic('info', 12) + ' <span>Числа <b>29–31</b> есть не во всех месяцах — никакого «31 февраля».</span></div>'
      + fallback;
  }
  function ydRow(day, mi) {
    return '<div class="yd-row">' + sel(day, nums(1, daysInMonth(mi))) + sel(MONTHS[mi], MONTHS) + '<button class="cr-x" aria-label="убрать">' + ic('x', 14) + '</button></div>';
  }
  function yearDates() {
    return '<div class="year-dates">' + ydRow('1', 0) + ydRow('29', 1)
      + '<button class="rc-slotadd">' + ic('plus', 13) + ' Добавить дату</button>'
      + '<div class="yd-note">' + ic('info', 12) + ' <span>Доступны только реальные дни выбранного месяца. 29 февраля — только в високосный год.</span></div></div>';
  }
  function dateRange() {
    return '<div class="rc-daterange"><input class="field" type="date" value="2026-06-28" aria-label="с"><span class="dr-sep">' + ic('chev', 13) + '</span><input class="field" type="date" value="2026-07-05" aria-label="по"></div>';
  }
  function whenBody(mode, cfg) {
    mode = mode || 'daily'; cfg = cfg || {};
    var b = '';
    if (mode === 'daily') {
      b = why('Самый простой ритм — пост выходит <b>каждый день</b>.') + timeSection();
    } else if (mode === 'everyN') {
      b = '<div class="sc-field"><label>Интервал</label><div class="rc-inline2">Каждые <div class="rc-step"><button aria-label="меньше">–</button><span class="rcs-val">3</span><button aria-label="больше">+</button></div> дня</div></div>'
        + '<div class="sc-field"><label>Начиная с <span class="sc-opt">· необязательно</span></label><input class="field" type="date" value="2026-06-30" style="max-width:200px"></div>'
        + timeSection();
    } else if (mode === 'weekly') {
      b = '<div class="sc-field"><label>В какие дни</label>' + wkPills([1,1,1,1,1,0,0]) + '</div>'
        + toggleRow('Разное время в разные дни', 'У каждого выбранного дня — своё время и слоты.', !!cfg.perDay)
        + (cfg.perDay ? perDayTimes([1,1,1,1,1,0,0]) : timeSection());
    } else if (mode === 'monthly') {
      b = '<div class="sc-field"><label>Числа месяца <span class="sc-opt">· можно несколько</span></label>' + domGrid([1, 15, 31]) + '</div>' + timeSection();
    } else if (mode === 'yearly') {
      b = '<div class="sc-field"><label>Даты в году <span class="sc-opt">· годовщины, праздники</span></label>' + yearDates() + '</div>' + timeSection();
    } else if (mode === 'period') {
      b = '<div class="sc-field"><label>Период — с и по</label>' + dateRange() + '<span class="count-badge">' + ic('cal', 12) + ' ≈ 8 дней в периоде</span></div>'
        + '<div class="sc-field"><label>Внутри периода</label><div class="seg seg--wrap"><button class="seg-opt seg-opt--active">Каждый день</button><button class="seg-opt">По дням недели</button><button class="seg-opt">Один раз</button></div></div>'
        + timeSection()
        + why('Удобно для <b>разовых акций</b>: задаёшь окно дат — после последней даты сценарий выключится сам.');
    } else if (mode === 'event') {
      b = '<div class="sc-field"><label>Событие-триггер</label>' + sel('Когда пост наберёт много просмотров', ['Когда пост наберёт много просмотров', 'Когда наберёшь круглое число подписчиков', 'Когда тебя упомянут']) + '</div>'
        + '<div class="sc-field"><label>Порог просмотров</label><div class="rc-inline2"><div class="rc-step"><button aria-label="меньше">–</button><span class="rcs-val">5 000</span><button aria-label="больше">+</button></div> просмотров</div></div>'
        + '<div class="sced-when-reply"><span class="wr-ico">' + ic('bolt', 16) + '</span><span class="wr-txt">Это <b>реактивный</b> сценарий — без расписания и времени. Сработает, как только условие выполнится.</span></div>';
    }
    return cadenceChips(mode) + '<div class="when-modebody">' + b + '</div>';
  }
  function whenReplyBody() {
    return '<div class="sced-when-reply"><span class="wr-ico">' + ic('repeat', 16) + '</span>'
      + '<span class="wr-txt">Pennedly <b>проверяет новые комментарии каждые 15 минут</b> и готовит ответ. Расписание тут не выбирается — это не мгновенный ответ, небольшая задержка нормальна.</span></div>'
      + hard('Частота проверки — общая для всех ответных сценариев, задаётся в «Правилах дома».');
  }

  function condRow(icoName, t, d, ctl) {
    return '<div class="cond-row"><span class="cr-ico">' + ic(icoName, 14) + '</span>'
      + '<div class="cr-body"><div class="cr-t">' + t + '</div>' + (d ? '<div class="cr-d">' + d + '</div>' : '') + '</div>'
      + (ctl ? '<div class="cr-ctl">' + ctl + '</div>' : '')
      + '<button class="cr-x" aria-label="убрать">' + ic('x', 14) + '</button></div>';
  }
  function ifBody(menuOpen) {
    var menu = '<div class="cond-menu">'
      + '<button class="cm-opt">' + ic('sun', 15) + '<span class="cm-t">Только по будням</span></button>'
      + '<button class="cm-opt">' + ic('check', 15) + '<span class="cm-t">Если сегодня ещё не постил</span></button>'
      + '<button class="cm-opt">' + ic('person', 15) + '<span class="cm-t">Только для подписчиков</span></button>'
      + '<button class="cm-opt">' + ic('cal', 15) + '<span class="cm-t">Если в тексте есть дата</span></button>'
      + '<button class="cm-opt">' + ic('timer', 15) + '<span class="cm-t">Кулдаун между запусками</span></button>'
      + '<button class="cm-opt">' + ic('gauge', 15) + '<span class="cm-t">Лимит срабатываний</span></button>'
      + '</div>';
    return '<div class="cond-list">'
      + condRow('sun', 'Только по будням', 'Не публиковать по выходным.', '')
      + condRow('timer', 'Кулдаун', 'Не запускать чаще, чем раз в', '<div class="rc-step"><button>–</button><span class="rcs-val">6 ч</span><button>+</button></div>')
      + '</div>'
      + (menuOpen ? menu : '<button class="cond-add">' + ic('plus', 14) + ' Добавить условие</button>')
      + why('Условия — это <b>«только если…»</b>. Без них сценарий срабатывает всегда по расписанию.');
  }

  function whatPostBody() {
    return '<div class="sc-field"><label>Что писать — инструкция в твоём голосе</label>'
      + bigText('короткий вопрос на одно слово в ответ, по теме дня, без штампов', 'В твоём голосе · базовые правила Pennedly применит сам') + '</div>'
      + '<div class="sc-field"><label>Тема дня <span class="sc-opt">· необязательно</span></label>'
        + '<input class="field" value="довести дело до конца" placeholder="оставь пустым — Pennedly подберёт сам"></div>'
      + '<div class="sc-field"><label>Длина и формат</label>'
        + '<div class="seg" role="tablist"><button class="seg-opt seg-opt--active">Коротко</button><button class="seg-opt">Средне</button><button class="seg-opt">Как выйдет</button></div></div>'
      + '<div class="sc-field"><label>Призыв в конце <span class="sc-opt">· необязательно</span></label>'
        + '<input class="field" value="ответьте одним словом 👇" placeholder="напр.: напишите в комментариях"></div>'
      + hard('Pennedly умеет только текстовый пост — без каруселей, видео и опросов-виджетов (у площадки их нет).');
  }
  function toneBody() {
    return '<div class="sc-field"><label>Как звучит ответ</label>'
      + bigText('по имени, одно наблюдение и мягкий вопрос — без шаблонов', 'Тон поверх твоего голоса · тролли и спам отсекаются заранее') + '</div>';
  }

  function audTile(icoName, t, d, on) {
    return '<button class="aud-tile' + (on ? ' aud-tile--on' : '') + '"><span class="at-t">' + ic(icoName, 14) + ' ' + t + '</span><span class="at-d">' + d + '</span></button>';
  }
  function whoBody(custom) {
    return '<div class="sc-field"><label>Кому отвечаем</label>'
      + '<div class="aud-grid">'
        + audTile('heart', 'Только фанатам', 'Тёплым и постоянным.', false)
        + audTile('shield', 'Все, кроме троллей', 'По умолчанию.', !custom)
        + audTile('bubbleq', 'Только вопросы', 'Где явно что-то спросили.', false)
        + audTile('pencil', 'Свой вариант', 'Опиши словами.', custom)
      + '</div>'
      + (custom ? '<div class="aud-custom">' + bigText('тем, кто пишет по делу, без флуда', 'Опиши аудиторию словами · Pennedly решит по каждому комментарию') + '</div>' : '')
      + '<div class="rc-inherit" style="margin-top:11px"><span class="ri-badge">' + ic('shieldhouse', 10) + ' из Правил дома</span> Тролли и токсичность отсекаются всегда · <a href="#">открыть</a></div></div>';
  }

  function howBody(mode) {
    var ask = mode !== 'auto';
    return '<div class="rce-how"><div class="sc-modepick">'
      + '<button class="sc-mode' + (ask ? ' sc-mode--on' : '') + '"><span class="mo-radio"></span><div class="mo-body">'
        + '<div class="mo-t">Спроси меня <span class="mo-default">по умолчанию</span></div>'
        + '<div class="mo-d">Pennedly кладёт черновик в «Активность». Пока ты не подтвердишь — ничего не публикуется.</div></div></button>'
      + '<button class="sc-mode sc-mode--auto' + (!ask ? ' sc-mode--on' : '') + '"><span class="mo-radio"></span><div class="mo-body">'
        + '<div class="mo-t">Публиковать автоматически</div>'
        + '<div class="mo-d">Выходит само, без подтверждения. Включай, когда уже доверяешь результату.</div></div></button>'
      + '</div>'
      + why('Раньше это решалось в отдельном окне при включении — теперь <b>прямо здесь</b>, рядом со всем остальным.') + '</div>';
  }

  /* ════════════════ RECIPE CARD ════════════════ */
  function recipeCard(cfg) {
    var reply = cfg.kind === 'reply';
    var open = cfg.openSlot;
    var prose;
    if (reply) {
      var sWhenLock = lockSlot('каждые 15 минут');
      var sWho = slot(cfg.whoCustom ? 'тем, кто пишет по делу' : 'всем, кроме троллей', open === 'who', 'person');
      var sTone = slot('по имени, с наблюдением и мягким вопросом', open === 'tone');
      var sHow = slot(cfg.mode === 'auto' ? 'отправит сам' : 'покажет тебе перед отправкой', open === 'how');
      prose = 'Pennedly проверяет комментарии ' + sWhenLock + ' и отвечает ' + sWho
        + ' — звучит ' + sTone + ' — твоим голосом на ' + who() + ', а готовый ответ ' + sHow + '.';
    } else {
      var sWhen = slot(cfg.tmpl ? 'каждый вторник в 12:00' : (WHEN_SUMMARY[cfg.whenMode] || WHEN_SUMMARY.daily), open === 'when', 'clock');
      var sWhat = slot(cfg.whatText || (cfg.tmpl ? 'выпуск рубрики «Маленькая победа»' : 'короткий пост-вопрос на тему «довести дело до конца»'), open === 'what', 'pencil');
      var sHowP = slot(cfg.mode === 'auto' ? 'опубликует сам' : 'покажет тебе перед публикацией', open === 'how');
      prose = sWhen + ' Pennedly напишет ' + sWhat + ' твоим голосом на ' + who() + ' и ' + sHowP + '.';
    }
    // условие живёт отдельной тихой строкой ПОД фразой — никогда не разрывает её
    var cond = cfg.ifSet
      ? '<div class="recipe-cond"><span class="rc-condlead">' + ic('sliders', 13) + ' Срабатывает только если</span> ' + slot('по будням и не чаще раза в 6 часов', open === 'if') + '.</div>'
      : '<div class="recipe-cond"><button class="rc-slot rc-slot--add' + (open === 'if' ? ' is-open' : '') + '">' + ic('plus', 12) + 'Добавить условие «только если…»</button></div>';
    // drawer for the open slot
    var dr = '';
    if (open === 'when') dr = drawer('Когда сработает', 'clock', reply ? whenReplyBody() : whenBody(cfg.whenMode, cfg));
    else if (open === 'if') dr = drawer('Только если…', 'sliders', ifBody(cfg.condMenu));
    else if (open === 'what') dr = drawer('Что писать', 'pencil', whatPostBody());
    else if (open === 'who') dr = drawer('Кому отвечать', 'person', whoBody(cfg.whoCustom));
    else if (open === 'tone') dr = drawer('Как звучит ответ', 'bubble', toneBody());
    else if (open === 'how') dr = drawer('Как публиковать', 'check', howBody(cfg.mode));

    // выбранный финал: вариант 9 (точки под текстом) + подсказка сверху по умолчанию
    var V = (cfg.variant != null) ? cfg.variant : 9;
    var showHint = (cfg.hint != null) ? cfg.hint : (cfg.variant == null);
    return '<div class="recipe recipe--v' + V + '"><div class="recipe-eyebrow">' + ic('sparkle', 12) + ' Что будет происходить'
      + '<span class="re-kind">' + ic(reply ? 'bubble' : 'pencil', 11) + ' ' + (reply ? 'Ответ' : 'Пост') + '</span></div>'
      + (showHint ? '<div class="recipe-hint">' + ic('pencil', 13) + '<span>Нажми на <b>подчёркнутые слова</b>, чтобы настроить сценарий</span></div>' : '')
      + '<p class="recipe-prose">' + prose + '</p>' + cond + dr + '</div>';
  }

  /* ════════════════ LAYERS ════════════════ */
  function layer(num, title, pro, sum, body, openState) {
    return '<div class="rce-layer' + (openState ? ' is-open' : '') + '"><button class="rl-head"><span class="rl-chev">' + ic('chev', 16) + '</span>'
      + '<span class="rl-hd"><span class="rl-t">' + title + (pro ? ' <span class="rl-pro">для продвинутых</span>' : '') + '</span>'
      + (openState ? '' : '<span class="rl-sum">' + sum + '</span>') + '</span></button>'
      + (openState ? '<div class="rl-body">' + body + '</div>' : '') + '</div>';
  }
  function rlGroup(k, inner) { return '<div class="rl-group"><div class="rlg-k">' + k + '</div>' + inner + '</div>'; }

  function layer2Body(cfg) {
    var reply = cfg.kind === 'reply';
    return rlGroup('Условия — «только если…»', ifBody(false))
      + (reply
        ? rlGroup('Как звучит ответ', '<div class="sc-fieldset">' + toneBody() + '</div>')
        : rlGroup('Точное время и дни', '<div class="sc-fieldset">' + whenBody() + '</div>')
          + rlGroup('Контент', '<div class="sc-fieldset">'
            + '<div class="sc-field"><label>Длина и формат</label><div class="seg"><button class="seg-opt seg-opt--active">Коротко</button><button class="seg-opt">Средне</button><button class="seg-opt">Как выйдет</button></div></div>'
            + '<div class="sc-field"><label>Тема <span class="sc-opt">· необязательно</span></label><input class="field" value="довести дело до конца"></div>'
            + '<div class="sc-field"><label>Призыв в конце <span class="sc-opt">· необязательно</span></label><input class="field" value="ответьте одним словом 👇"></div>'
            + '</div>'));
  }
  /* ════════════════ СЛОЙ 3 · ПЕРЕОПРЕДЕЛЕНИЕ «ПРАВИЛ ДОМА» ════════════════
     Для reply-сценария точечно переопределяем общие «Правила дома».
     По умолчанию ВСЁ наследуется; пользователь переопределяет отдельные
     пункты только для этого сценария. У каждого пункта чёткий вид
     «наследуется (значение)» ↔ «переопределено здесь», и можно вернуть. */
  var L3_ITEMS = {
    who:   { ico: 'person', t: 'Кому отвечать',        d: 'Какие комментарии этот сценарий берёт в работу.',  inh: 'всем, кроме троллей' },
    limit: { ico: 'gauge',  t: 'Лимит ответов в день', d: 'Сколько ответов сценарий публикует за сутки.',      inh: 'до 25 в день' },
    freq:  { ico: 'repeat', t: 'Частота проверки',     d: 'Как часто Pennedly опрашивает новые комментарии.',  inh: 'раз в ~15 минут' },
    quiet: { ico: 'timer',  t: 'Тихие часы',           d: 'Когда сценарий молчит и копит ответы на потом.',    inh: '23:00 – 08:00' }
  };

  function l3Badge(on) {
    return on
      ? '<span class="ovr-badge ovr-badge--on">' + ic('pencil', 10) + ' переопределено здесь</span>'
      : '<span class="ovr-badge">' + ic('shieldhouse', 10) + ' наследуется из Правил дома</span>';
  }

  function l3OverSummary(key, cfg) {
    if (key === 'who') return cfg.l3who === 'custom' ? 'новичкам и тем, кто пишет по делу'
      : (cfg.l3who === 'fans' ? 'только фанатам' : (cfg.l3who === 'q' ? 'только на вопросы' : 'всем, кроме троллей'));
    if (key === 'limit') return 'до ' + (cfg.l3limit || 40) + ' в день';
    if (key === 'freq') { var m = { '5': 'раз в 5 мин', '15': 'раз в 15 мин', '30': 'раз в 30 мин', '60': 'раз в час' }; return m[cfg.l3freq || '5']; }
    if (key === 'quiet') return cfg.l3quietOff ? 'круглосуточно, без тишины' : '22:00 – 09:00';
    return '';
  }

  function l3Ctl(key, cfg) {
    if (key === 'who') {
      var custom = cfg.l3who === 'custom';
      var fans = cfg.l3who === 'fans', q = cfg.l3who === 'q';
      return '<div class="aud-grid">'
        + audTile('heart', 'Только фанатам', 'Тёплым и постоянным.', fans)
        + audTile('shield', 'Все, кроме троллей', 'Как в Правилах дома.', !custom && !fans && !q)
        + audTile('bubbleq', 'Только вопросы', 'Где явно что-то спросили.', q)
        + audTile('pencil', 'Свой вариант', 'Опиши словами.', custom)
        + '</div>'
        + (custom ? '<div class="aud-custom">' + bigText('новичкам и тем, кто пишет по делу', 'Только для этого сценария · Pennedly решит по каждому комментарию') + '</div>' : '')
        + '<div class="ovr-hard">' + ic('shield', 12) + '<span>Тролли и токсичность отсекаются всегда — это переопределить нельзя.</span></div>';
    }
    if (key === 'limit') {
      var v = cfg.l3limit || 40;
      return '<div class="ovr-slider"><div class="rcj-top"><span class="rcj-k">Не больше ответов в день</span><span class="ovr-bignum">' + v + '</span></div>'
        + '<input type="range" class="rc-range" min="5" max="100" value="' + v + '" aria-label="лимит ответов в день"></div>'
        + why('Защита от перебора: дойдя до лимита, сценарий доберёт остаток завтра.');
    }
    if (key === 'freq') {
      var F = [['5', 'раз в 5 мин'], ['15', 'раз в 15 мин'], ['30', 'раз в 30 мин'], ['60', 'раз в час']];
      var cur = cfg.l3freq || '5';
      return '<div class="seg seg--wrap" role="tablist">' + F.map(function (x) { return '<button class="seg-opt' + (x[0] === cur ? ' seg-opt--active' : '') + '">' + x[1] + '</button>'; }).join('') + '</div>'
        + why('Чаще — реакция быстрее, но и нагрузка выше. Реже — спокойнее, ответы появляются с задержкой.');
    }
    if (key === 'quiet') {
      var off = !!cfg.l3quietOff;
      return '<div class="ovr-quiet"><div class="rc-time-row' + (off ? ' is-disabled' : '') + '"><span class="ovr-ql">с</span><input class="field" type="time" value="22:00"' + (off ? ' disabled' : '') + ' aria-label="с"><span class="ovr-ql">до</span><input class="field" type="time" value="09:00"' + (off ? ' disabled' : '') + ' aria-label="до"></div>'
        + '<label class="ovr-checkrow"><input type="checkbox"' + (off ? ' checked' : '') + '> Без тихих часов — отвечать круглосуточно</label></div>';
    }
    return '';
  }

  function l3Row(key, cfg) {
    var m = L3_ITEMS[key];
    var over = (cfg.l3over || []).indexOf(key) >= 0;
    var valNow = over ? l3OverSummary(key, cfg) : m.inh;
    var head = '<div class="ovr-main"><span class="ovr-ico">' + ic(m.ico, 15) + '</span>'
      + '<div class="ovr-text"><div class="ovr-t">' + m.t + ' ' + l3Badge(over) + '</div>'
      + '<div class="ovr-d">' + m.d + '</div></div>'
      + (over
        ? '<button class="ovr-revert">' + ic('repeat', 12) + ' Вернуть к наследованию</button>'
        : '<button class="ovr-btn">' + ic('pencil', 12) + ' Переопределить</button>')
      + '</div>';
    var valline = '<div class="ovr-valrow"><span class="ovr-vk">Сейчас действует</span><span class="ovr-vv' + (over ? ' ovr-vv--on' : '') + '">' + valNow + '</span></div>';
    var ctl = over
      ? '<div class="ovr-ctl">' + l3Ctl(key, cfg)
        + '<div class="ovr-was">' + ic('shieldhouse', 11) + ' В Правилах дома: <b>' + m.inh + '</b> · <a href="#">открыть</a></div></div>'
      : '';
    return '<div class="ovr-row' + (over ? ' is-over' : '') + '">' + head + valline + ctl + '</div>';
  }

  function layer3Body(cfg) {
    cfg = cfg || {};
    var keys = ['who', 'limit', 'freq', 'quiet'];
    var n = (cfg.l3over || []).length;
    var count = n === 0
      ? '<span class="ovr-count">' + ic('shieldhouse', 11) + ' всё наследуется из Правил дома</span>'
      : '<span class="ovr-count ovr-count--on">' + ic('pencil', 11) + ' переопределено: ' + n + ' из 4</span>';
    return '<div class="ovr">'
      + '<div class="ovr-lead"><div class="ovr-lead-t">По умолчанию сценарий живёт по общим <b>«Правилам дома»</b>. Здесь можно переопределить отдельные пункты — <b>только для этой рутины</b>. Остальное продолжит наследоваться.</div>'
      + '<div class="ovr-lead-foot">' + count + '<a class="ovr-openhr" href="#">' + ic('shieldhouse', 12) + ' Открыть Правила дома</a></div></div>'
      + '<div class="ovr-list">' + keys.map(function (k) { return l3Row(k, cfg); }).join('') + '</div>'
      + (n > 0 ? '<div class="ovr-resetall"><button class="btn btn--ghost btn--sm">' + ic('repeat', 13) + ' Сбросить все переопределения</button></div>' : '')
      + '</div>';
  }

  /* Слой 3 как самостоятельный аккордеон (для раскадровки/компактных кадров) */
  function buildLayer3(cfg) {
    cfg = cfg || {};
    return '<div class="rce" style="max-width:660px"><div class="rce-layers">'
      + layer('3', 'Только для этого сценария', true, 'Переопределить «Правила дома» здесь', layer3Body(cfg), true)
      + '</div></div>';
  }

  /* ════════════════ ASIDE · LIVE PREVIEW ════════════════ */
  function mockPost(s) {
    return '<div class="mockpost"><div class="mockpost-top">' + av(C.initial) + '<div class="mockpost-who"><span class="mw-n">' + C.name + '</span><span class="mw-h">' + C.handle + '</span></div><span class="mockpost-time">9:0' + (Math.floor(Math.random() * 6)) + '</span></div>'
      + '<div class="mockpost-text">' + s.post + '</div>'
      + '<div class="mockpost-stats"><span class="ms">' + ic('eye', 13) + ' ' + s.stats[0] + '</span><span class="ms">' + ic('heart', 13) + ' ' + s.stats[1] + '</span><span class="ms">' + ic('bubble', 13) + ' ' + s.stats[2] + '</span></div></div>';
  }
  function replyThread() {
    var r = SR.SAMPLE.duty.reply;
    var parent = '<div class="mockpost" style="border-bottom:1px solid var(--color-border)"><div class="mockpost-top">' + av(C.initial) + '<div class="mockpost-who"><span class="mw-n">' + C.name + '</span><span class="mw-h">' + C.handle + '</span></div><span class="mockpost-time">вчера</span></div>'
      + '<div class="mockpost-text">Маленькая победа недели 🟢 Закрыл задачу, которая висела с марта. Не «найти время», а занять 20 минут и начать.</div></div>';
    var thread = '<div class="mockreply"><div class="mr-k">так Pennedly ответит на комментарий</div>'
      + '<div class="mr-comment">' + av(r.who[0]) + '<div class="mrc-body"><div class="mrc-who">' + r.who + '</div><div class="mrc-text">' + r.text + '</div></div></div>'
      + '<div class="mr-bot">' + av(C.initial) + '<div class="mrb-body"><div class="mrb-who">' + C.name + ' <span class="mrb-tag">' + ic('bubble', 11) + ' ответ Pennedly</span></div><div class="mrb-text">' + r.bot + '</div></div></div></div>';
    return parent + thread;
  }
  function aside(cfg) {
    var reply = cfg.kind === 'reply';
    var s = reply ? SR.SAMPLE.duty : SR.SAMPLE.talk;
    var stage = '<div class="rce-stage"><div class="rce-stagebar"><span class="sb-dot"></span><span class="sb-t">' + (reply ? 'Ответ под постом · Threads' : 'Пост в ленте · Threads') + '</span><span class="sb-live">live</span></div>'
      + (reply ? replyThread() : mockPost(s))
      + '<div class="rce-invoice">' + ic('sparkle', 13) + '<span>В твоём голосе · на основе <b>' + (reply ? '8 постов и ветки комментариев' : '8 твоих недавних постов') + '</b>. Pennedly не выдумывает за тебя.</span></div></div>';
    var runs = reply
      ? '<div class="rce-runs"><div class="rr-k">' + ic('repeat', 13) + ' Ритм проверки</div>'
        + '<div class="rr-list"><div class="rr-item"><span class="rri-dot"></span><span class="rri-when">каждые 15 мин</span><span class="rri-what">проверяет новые комментарии</span></div>'
        + '<div class="rr-item"><span class="rri-dot"></span><span class="rri-when">по готовности</span><span class="rri-what">черновик ответа → в «Активность»</span></div></div></div>'
      : '<div class="rce-runs"><div class="rr-k">' + ic('clock', 13) + ' Следующие 3 запуска</div>'
        + '<div class="rr-list">'
        + '<div class="rr-item"><span class="rri-dot"></span><span class="rri-when">Завтра, ~9:00</span><span class="rri-what">пост-вопрос</span></div>'
        + '<div class="rr-item"><span class="rri-dot"></span><span class="rri-when">Чт, ~9:00</span><span class="rri-what">пост-вопрос</span></div>'
        + '<div class="rr-item"><span class="rri-dot"></span><span class="rri-when">Пт, ~9:00</span><span class="rri-what">пост-вопрос</span></div>'
        + '</div></div>';
    return '<aside class="rce-aside"><div class="rce-stagecap">' + ic('eye', 13) + ' Превью · так это увидят люди</div>'
      + stage + runs
      + '<div class="rce-runnow"><button class="btn btn--secondary btn--sm">' + ic('play', 14) + ' Прогнать сейчас</button>'
      + '<span class="rn-note">Создаст черновик прямо сейчас — даже у несохранённого сценария. Никогда не публикует.</span></div></aside>';
  }

  /* ════════════════ CHROME ════════════════ */
  function topbar(name, isNew) {
    return '<div class="ed-topbar"><button class="ed-back">' + ic('back', 16) + ' Мои рутины</button>'
      + '<div class="ed-titlerow"><div class="ed-titlewrap"><h1 class="ed-title">' + name + '</h1>'
      + '<button class="ed-edit" aria-label="переименовать">' + ic('pencil', 13) + '</button></div></div></div>';
  }
  function statusRow(cfg) {
    var reply = cfg.kind === 'reply';
    if (cfg.isNew) {
      return '<div class="rce-status"><span class="rce-next">' + ic('info', 14) + '<span>Черновик рутины — ещё не сохранён</span></span>'
        + '<span class="sc-bigstatus"><span class="bs-dot"></span>Выключен</span></div>';
    }
    return '<div class="rce-status"><span class="rce-next">' + ic('clock', 14) + '<span>Следующий запуск: <b>' + (reply ? 'в течение 15 мин после комментария' : 'завтра ~9:00') + '</b></span></span>'
      + '<span class="sc-bigstatus sc-bigstatus--on"><span class="bs-dot"></span>Активен</span></div>';
  }
  function foot(cfg) {
    return '<div class="rce-foot"><div class="sc-actionbar">'
      + '<button class="btn btn--secondary">Сохранить выключенным</button>'
      + '<button class="btn btn--primary">' + ic('check', 15) + ' ' + (cfg.isNew ? 'Сохранить и включить' : 'Сохранить') + '</button>'
      + '<span class="sa-spacer"></span>'
      + (cfg.isNew ? '' : '<button class="btn btn--ghost">' + ic('x', 15) + ' Удалить</button>') + '</div></div>';
  }

  /* ════════════════ BUILD ════════════════ */
  function buildEditor(cfg) {
    var reply = cfg.kind === 'reply';
    var name = cfg.name || (reply ? 'Дежурство в комментах' : 'Утренний вопрос');
    var l2sum = reply ? 'Условия · как звучит ответ' : 'Условия · точное время и дни · длина, тема, призыв';
    var left = '<div class="rce-main">'
      + statusRow(cfg)
      + recipeCard(cfg)
      + '<div class="rce-layers">'
        + layer('1', 'Суть', false, '', '', false) // layer 1 is the recipe itself, not a separate accordion
        + '</div>';
    // layer 1 is represented by the recipe card above; show only layers 2 & 3 as accordions
    left = '<div class="rce-main">'
      + statusRow(cfg)
      + recipeCard(cfg)
      + '<div class="rce-layers">'
        + layer('2', 'Настроить точнее', false, l2sum, layer2Body(cfg), cfg.layer2)
        + layer('3', 'Только для этого сценария', true, 'Переопределить «Правила дома» здесь', layer3Body(cfg), cfg.layer3)
        + '</div>'
      + foot(cfg) + '</div>';
    return '<div class="rce">' + topbar(name, cfg.isNew) + '<div class="rce-grid">' + left + aside(cfg) + '</div>' + (cfg.modal ? bigTextModal(cfg.modal) : '') + '</div>';
  }

  window.Layer3Editor = { build: buildEditor, layer3: buildLayer3, card: recipeCard, frame: frame, ic: ic };

  /* ── auto-mount any [data-recipe] hosts ── */
  function mountAll() {
    var hosts = document.querySelectorAll('[data-l3recipe]');
    for (var i = 0; i < hosts.length; i++) {
      var el = hosts[i];
      var cfg = {};
      try { cfg = JSON.parse(el.getAttribute('data-l3recipe') || '{}'); } catch (e) { cfg = {}; }
      cfg.layer3 = true;
      el.innerHTML = frame(buildEditor(cfg), cfg.dark);
    }
    var cards = document.querySelectorAll('[data-l3card]');
    for (var j = 0; j < cards.length; j++) {
      var ce = cards[j], ccfg = {};
      try { ccfg = JSON.parse(ce.getAttribute('data-l3card') || '{}'); } catch (e2) { ccfg = {}; }
      ce.innerHTML = '<div class="frame' + (ccfg.dark ? ' dark' : '') + '" style="padding:20px">' + buildLayer3(ccfg) + '</div>';
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountAll); else mountAll();
})();
