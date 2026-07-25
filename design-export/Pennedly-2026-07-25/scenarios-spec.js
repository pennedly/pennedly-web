/* scenarios-spec.js — builds every live frame in Scenarios-WEB-SPEC.html out of
   the real DS classes (ds/components.css + scenarios.css + scenarios-ia.css),
   inside token-pinned `.frame` hosts that flip light/dark via the `.dark` class.

   IA / NAVIGATION REWORK. The mode now has FOUR explicit surfaces, and every
   surface above home always shows «← Мои сценарии» + breadcrumbs + a strong
   title, so the person always knows where they are and how to get back:
     A · Старт / обучение   — что такое сценарии и зачем (+ пустое состояние)
     B · Мои сценарии (дом) — активные + на паузе, центр управления
     C · Каталог шаблонов   — карточки с примером и пояснением
     D · Конструктор        — гибкий билдер с нуля (пост и/или ответ)
   Visual language + components are native; only wayfinding & the create flow
   changed. Demo content = neutral creator (Соня · таро case kept generic). */
(function () {
  "use strict";

  /* ---------------------------------- icons --------------------------------- */
  function ic(n, s) {
    s = s || 14;
    var v = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
    var P = {
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
      cal: '<rect x="4" y="5.5" width="16" height="15" rx="2.5"/><path d="M4 9.5h16M8.5 3.5v4M15.5 3.5v4"/>',
      eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
      heart: '<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z"/>',
      person: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>',
      lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
      doc: '<path d="M6 3h8l4 4v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M14 3v4h4M8.5 13h7M8.5 16.5h5"/>',
      play: '<path d="M7 5l12 7-12 7V5Z"/>',
      settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
      sparkle: '<path d="M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3Z"/>',
      alert: '<path d="M12 8v5M12 16.5v.5"/><path d="M10.3 3.3 2.5 17a2 2 0 0 0 1.7 3h15.6a2 2 0 0 0 1.7-3L13.7 3.3a2 2 0 0 0-3.4 0Z"/>',
      arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
      arrowL: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
      chev: '<path d="M9 6l6 6-6 6"/>',
      pencil: '<path d="M4 20h4L19 9a2 2 0 0 0-3-3L5 17v3Z"/><path d="M14.5 6.5 17.5 9.5"/>',
      bolt2: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/>',
      help: '<circle cx="12" cy="12" r="9"/><path d="M9.2 9.3a2.8 2.8 0 0 1 5.4 1c0 1.9-2.6 2.3-2.6 3.7M12 17.2v.05"/>',
      grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>',
      wand: '<path d="M15 4V2M15 10V8M9.5 6.5h-2M22.5 6.5h-2M19 3l-1.4 1.4M11.4 8.6 10 10M4 20l9.5-9.5"/>'
    };
    return '<svg width="' + s + '" height="' + s + '" ' + v + '>' + (P[n] || '') + '</svg>';
  }

  /* -------------------------------- primitives ------------------------------ */
  function sw(on, lg) { return '<label class="switch' + (lg ? ' switch--lg' : '') + '"><input type="checkbox"' + (on ? ' checked' : '') + ' aria-label="toggle"><span class="track"></span><span class="knob"></span></label>'; }
  function sel(val, opts) { return '<select class="field" aria-label="select">' + opts.map(function (o) { return '<option' + (o === val ? ' selected' : '') + '>' + o + '</option>'; }).join('') + '</select>'; }
  function set(id, html) { var e = document.getElementById(id); if (e) e.innerHTML = html; }
  function av(initials) { return '<span class="avatar" style="width:30px;height:30px;display:inline-grid;place-items:center;border-radius:9999px;background:var(--color-surface-2);border:1px solid var(--color-border);font-size:11px;font-weight:600;color:var(--color-text-muted);flex:0 0 auto">' + initials + '</span>'; }
  function clip(s, n) { return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s; }

  /* frame chrome */
  function head(label, dark) { return '<div class="fr-head"><span class="dh' + (dark ? ' dh--dark' : '') + '"></span>' + label + '</div>'; }
  function frame(inner, dark, extra) { return '<div class="frame' + (dark ? ' dark' : '') + (extra ? ' ' + extra : '') + '">' + inner + '</div>'; }
  function col(label, inner, dark, extra) { return '<div class="fr">' + head(label, dark) + frame(inner, dark, extra) + '</div>'; }
  function row() { var a = [].slice.call(arguments); return '<div class="frow">' + a.join('') + '</div>'; }

  /* ════════════════════════ NAV CHROME (the spine) ═══════════════════════ */
  /* home top bar OR a deep top bar with «← Мои сценарии» + breadcrumbs + title */
  function topbar(o) {
    o = o || {};
    var left;
    if (o.home) {
      left = '<div class="sc-topbar-l"><div class="sc-tb-titles"><span class="sc-tb-title">Сценарии</span></div></div>';
    } else {
      var crumbs = o.crumbs ? '<div class="sc-crumbs">' + o.crumbs + '</div>' : '';
      left = '<div class="sc-topbar-l">'
        + '<button class="sc-back">' + ic('arrowL', 15) + ' Мои сценарии</button>'
        + '<div class="sc-tb-titles">' + crumbs + '<span class="sc-tb-title">' + o.title + '</span></div></div>';
    }
    var pill = o.pill === 'success' ? '<span class="status-pill status-pill--success"><i class="pill-dot"></i>' + o.pillText + '</span>'
      : o.pill === 'neutral' ? '<span class="status-pill status-pill--neutral"><i class="pill-dot"></i>' + o.pillText + '</span>' : '';
    var how = o.how ? '<button class="sc-howlink">' + ic('help', 15) + ' Как это работает</button>' : '';
    var action = o.action ? '<button class="btn btn--primary btn--sm">' + ic('plus', 15) + ' Создать сценарий</button>' : '';
    return '<div class="sc-topbar">' + left + '<div class="sc-topbar-r">' + how + pill + action + '</div></div>';
  }
  function crumb(parts) {
    return parts.map(function (p, i) {
      var sep = i ? '<span class="sep">/</span>' : '';
      return sep + (p.cur ? '<span class="cur">' + p.t + '</span>' : '<a href="#">' + p.t + '</a>');
    }).join(' ');
  }

  /* ════════════════════════ PRESET CATALOG ════════════════════════ */
  var PRESETS = {
    talk:    { id: 'talk', name: 'Разговор дня', ico: 'bubbleq', reply: true, when: 'каждый день · утром', desc: 'Открытый вопрос дня первым постом — и тёплые авто-ответы каждому, кто откликнулся.' },
    column:  { id: 'column', name: 'Рубрика', ico: 'columns', when: 'еженедельно · по будням', desc: 'Именованная регулярная колонка: один и тот же формат в один и тот же день.' },
    duty:    { id: 'duty', name: 'Дежурство в комментах', ico: 'bubble', reply: true, when: 'весь день · на комментарии', desc: 'Авто-черновики содержательных ответов под вашими постами — вы их утверждаете.' },
    safety:  { id: 'safety', name: 'Если сегодня не постил', ico: 'shield', when: 'ежедневно · если тихо', desc: 'Подстраховка: если к часу отсечки ничего не вышло — мягкий пост, чтобы лента не молчала.' },
    thanks:  { id: 'thanks', name: 'Спасибо за N', ico: 'flag', when: 'по событию · подписчики', desc: 'Пост-благодарность на круглой отметке подписчиков.' },
    seasonal:{ id: 'seasonal', name: 'Сезонное', ico: 'seasonal', when: 'в период дат', desc: 'Тема под праздник или сезон — только внутри выбранного окна дат.' },
    poll:    { id: 'poll', name: 'Опрос', ico: 'poll', when: 'еженедельно', desc: 'Текстовый опрос: вопрос и 2–4 варианта, чтобы собрать мнения.' },
    boost:   { id: 'boost', name: 'Раскрутить залетевший', ico: 'boost', when: 'по событию · просмотры', desc: 'Пост перешёл порог просмотров → авто-фоллоуап, пока тема горячая.' },
    promo:   { id: 'promo', name: 'Акция', ico: 'gift', reply: true, when: 'в период дат', desc: 'Розыгрыш или лид-магнит: просим действие в комментах → присылаем выгоду в ответ.', risk: true, campaign: true }
  };
  /* C · grouped by GOAL / effect (рост · вовлечение · удержание · продажи) */
  var GOALS = [
    { title: 'Рост аудитории', note: 'привлечь новых и подхватить волну', ids: ['talk', 'boost', 'thanks'] },
    { title: 'Вовлечение', note: 'разговоры, ответы, мнения', ids: ['duty', 'poll'] },
    { title: 'Удержание ритма', note: 'чтобы лента не молчала, даже когда руки не дошли', ids: ['column', 'safety', 'seasonal'] },
    { title: 'Продажи и кампании', note: 'сильный инструмент — отдельным, обдуманным путём', ids: ['promo'], campaign: true }
  ];

  /* ════════════════════════ PREVIEW SAMPLES ════════════════════════ */
  var SAMPLE = {
    talk: { primed: 'вашем голосе + 6 недавних постах', fires: 'Завтра в 9:00 — первым постом дня', who: ['Соня', '@sonya.tarot', '9:00'],
      post: 'Вопрос на сегодня: что вы откладываете не потому, что трудно, а потому, что страшно начать? Напишите одним словом — отвечу каждому 🌙', stats: ['1,4K', '96', '54'],
      reply: { who: 'Марина', text: 'Разговор с мамой…', bot: 'Марина, слово «разговор» здесь не случайно — страх часто живёт там, где важнее всего быть услышанным. Один маленький шаг: начните с одной фразы, которую давно держите. Что это за фраза?' } },
    column: { primed: 'вашем голосе + рубрике «Карта дня»', fires: 'Завтра в 12:00 — первым постом дня', who: ['Соня', '@sonya.tarot', '12:00'],
      post: 'Карта дня — Восьмёрка Жезлов 🔥 День ускоряется: то, что вы откладывали, наконец сдвинется. Совет дня: ответьте на одно письмо, которое давно избегаете.', stats: ['940', '71', '12'] },
    duty: { primed: 'вашем голосе + ветке под постом', fires: 'Когда под вашим постом появится содержательный комментарий', who: ['Соня', '@sonya.tarot', 'сейчас'], reply: { who: 'Дима', text: 'А если карта выпала «перевёрнутой» — это плохо?', bot: 'Дима, «перевёрнутая» — не приговор, а оттенок: та же энергия, но направленная внутрь или с задержкой. Не плохо — скорее «пока рано». В каком вопросе она вам выпала?' } },
    safety: { primed: 'вашем голосе + тихом дне', fires: 'Сегодня в 19:00 — только если за день ничего не вышло', who: ['Соня', '@sonya.tarot', '19:00'],
      post: 'День выдался тихим — а вечер хорош для честного вопроса к себе: что из сегодняшнего стоит забрать с собой, а что оставить здесь? Напишите, разберём вместе.', stats: ['610', '48', '9'] },
    seasonal: { primed: 'вашем голосе + теме «Новолуние»', fires: 'Каждый день периода 28 июн — 5 июл, утром', who: ['Соня', '@sonya.tarot', '9:00'],
      post: 'Новолуние — время не итогов, а намерений 🌑 Что вы хотите начать в этом цикле? Сформулируйте одно желание так, будто оно уже сбылось.', stats: ['1,1K', '88', '40'] },
    poll: { primed: 'вашем голосе + теме недели', fires: 'Каждый четверг в 18:00', who: ['Соня', '@sonya.tarot', '18:00'], poll: ['О чём сделать большой разбор на этой неделе?', ['Деньги и поток', 'Отношения', 'Призвание и дело', 'Тень и страхи']] },
    boost: { primed: 'залетевшем посте + вашем голосе', fires: 'Когда пост перейдёт порог просмотров', who: ['Соня', '@sonya.tarot', '+3 часа'],
      post: 'Вижу, вчерашний пост про страх начать отозвался у многих 🙏 Раз так — короткое продолжение: страх — это не стоп-сигнал, а компас. Куда он показывает у вас?', stats: ['8,7K', '410', '180'] },
    thanks: { primed: 'вашем голосе + вехе подписчиков', fires: 'Когда наберёте круглую отметку подписчиков', who: ['Соня', '@sonya.tarot', 'сейчас'],
      post: 'Нас стало 25 000 🌙 Спасибо, что приходите со своими вопросами — именно они держат меня в деле. Расскажите, как вы здесь оказались?', stats: ['2,3K', '210', '88'] },
    promo: { cta: 'Напишите в комментариях <b>свою дату рождения</b> 🌙 — и я пришлю вам <b>короткий мини-разбор</b> прямо в ответ. Подпишитесь, чтобы не потерять свой.', primed: 'вашем голосе + механике откликов', fires: 'Каждый день периода, в 10:00', who: ['Соня', '@sonya.tarot', '10:00'],
      post: 'Сегодня звёзды на вашей стороне ✨ Напишите в комментариях свою дату рождения — пришлю короткий мини-разбор лично вам. Подпишитесь, чтобы не пропустить свой.', stats: ['1,2K', '84', '37'],
      reply: { who: 'Аня', text: '14.03.1996 🙏', bot: 'Аня, ваш день рождения говорит о тяге к свободе и глубоким разговорам. Сегодня хороший день начать то, что давно откладывали. Что это для вас?' } }
  };

  /* ════════════════════════ «Что зашьётся» ════════════════════════ */
  var BAKED = {
    talk: ['Вопрос открытый, личный, на одно слово или короткую фразу в ответ.', 'Без эзотерических клише и без «продающих» формулировок.', 'Авто-ответ обращается по имени, даёт 1–2 наблюдения и заканчивается мягким вопросом.', 'Не больше одного разговора в день — чтобы не превратить ленту в анкету.'],
    column: ['Один и тот же зачин рубрики, чтобы её узнавали.', 'Трактовка простыми словами, 2–3 предложения, без клише.', 'Всегда один практический совет на день в конце.'],
    duty: ['Отвечаем только содержательно — на пустые «спасибо» реакция, не ответ.', 'По имени, по сути комментария, без шаблонных фраз.', 'Тролли и токсичность отсеиваются до черновика.', 'Каждый ответ — черновик; публикуете вы.'],
    safety: ['Срабатывает только если за день не вышло ни одного поста.', 'Тон мягкий, вечерний — не «затыкаем дыру», а честный вопрос.', 'Никогда не дублирует тему сегодняшних постов.'],
    promo: ['Призыв — одно понятное действие в комментах и понятная выгода в ответ.', 'Авто-ответ персональный, по имени, без копипасты.', 'Уважает требования подписки/лайка, если включены.', 'Частит мягко — Pennedly придержит, если акций слишком много.'],
    custom: ['Поверх всего — ваш голос из Voice, без шаблонных «продающих» формулировок.', 'Никогда не публикует и не отвечает чаще лимита постов в день.', 'Тролли и токсичность отсеиваются до черновика ответа.', 'Каждое срабатывание попадает в «Активность» с возможностью undo.']
  };

  /* ════════════════════════ A · СТАРТ / ОБУЧЕНИЕ ════════════════════════ */
  function teach() {
    var ex = [
      { ico: 'bubbleq', t: 'Каждое утро — пост с пользой по вашей теме', k: 'пример поста', q: 'Вопрос на сегодня: что вы откладываете не потому, что трудно, а потому, что страшно начать?' },
      { ico: 'gift', t: 'Запустили акцию — собирает заявки в комментах и сам отвечает', k: 'пример ответа', q: 'Аня, ваш день рождения говорит о тяге к свободе и глубоким разговорам. С чего хотите начать?' },
      { ico: 'bubble', t: 'Дежурный по ответам — отвечает подписчикам, пока вы заняты', k: 'пример ответа', q: '«Перевёрнутая» карта — не приговор, а оттенок: та же энергия, но с задержкой. В каком вопросе она выпала?' }
    ];
    var steps = [
      { t: 'Выбрал шаблон или собрал свой', d: 'Готовый <b>шаблон из каталога</b> или <b>конструктор с нуля</b> — как удобнее.' },
      { t: 'Проверил превью', d: 'Pennedly показывает <b>реальный пример</b> в вашем голосе и «Прогнать сейчас».' },
      { t: 'Включил', d: 'Сценарий <b>сам постит и отвечает</b> по расписанию. Выключить можно мгновенно.' }
    ];
    return topbar({ back: false, home: false, title: '', crumbs: crumb([{ t: 'Сценарии', cur: true }]) }).replace('<div class="sc-topbar-l"><button class="sc-back">' + ic('arrowL', 15) + ' Мои сценарии</button>', '<div class="sc-topbar-l">')
      + '<div class="sc-teach">'
      + '<div class="sc-teach-hero"><div class="th-eyebrow">Сценарии · рутинный автопилот</div>'
      + '<h1>Сценарии сами постят и отвечают по расписанию</h1>'
      + '<p>Сценарий — это <b>рутина, которую вы настраиваете один раз</b>. Дальше Pennedly сам публикует посты и отвечает на комментарии в вашем голосе, в локальное время аккаунта. Это <b>экономит время</b>, <b>держит аккаунт живым</b> и <b>не даёт пропустить ответы</b>, пока вы заняты.</p></div>'
      + '<div><div class="sc-teach-block-k">Как это выглядит</div><div class="sc-teach-examples">'
      + ex.map(function (e) {
        return '<div class="sc-teach-ex"><div class="sc-teach-ex-top"><span class="sc-teach-ex-ico">' + ic(e.ico, 19) + '</span><span class="sc-teach-ex-title">' + e.t + '</span></div>'
          + '<div class="sc-teach-ex-quote"><span class="qk">' + ic('eye', 11) + ' ' + e.k + '</span>' + e.q + '</div></div>';
      }).join('') + '</div></div>'
      + '<div><div class="sc-teach-block-k">Как это работает</div><div class="sc-steps">'
      + steps.map(function (s, i) { return '<div class="sc-step"><span class="st-n">' + (i + 1) + '</span><div class="st-t">' + s.t + '</div><div class="st-d">' + s.d + '</div></div>'; }).join('')
      + '</div></div>'
      + '<div class="sc-teach-cta"><button class="btn btn--primary">' + ic('grid', 16) + ' Посмотреть шаблоны</button>'
      + '<button class="btn btn--secondary">' + ic('wand', 16) + ' Создать свой</button>'
      + '<span class="tc-note">Сценарии создаются выключенными — ничего не запустится, пока вы не включите.</span></div>'
      + '<div><span class="sc-gatenote">' + ic('lock', 13) + ' Режим виден только тестерам · по умолчанию выключен</span></div>'
      + '</div>';
  }

  /* ════════════════════════ B · МОИ СЦЕНАРИИ (home) ════════════════════════ */
  var WK = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  function cadStrip(fire, capLabel, evt) {
    var days = '<span class="sc-cad-days">' + WK.map(function (d, i) {
      return '<span class="sc-cad-day' + (fire[i] ? ' fire' + (evt ? ' fire--evt' : '') : '') + '">' + d + '</span>';
    }).join('') + '</span>';
    return '<div class="sc-cadence">' + days + '<span class="sc-cad-cap">' + ic('clock', 12) + '<span class="cc-when">' + capLabel + '</span></span></div>';
  }
  function prov(o) {
    if (o.prov === 'promo') return '<span class="tpl-badge tpl-badge--promo">' + ic('gift', 12) + 'Акция</span>';
    return '<span class="tpl-badge tpl-badge--sched">' + ic('clock', 11) + '<span class="tb-k">когда:</span> ' + o.sched + '</span>';
  }
  function ccCard(o) {
    var fire = o.fire || [1, 1, 1, 1, 1, 0, 0];
    var strip = o.evtLabel
      ? '<div class="sc-cadence"><span class="sc-cad-cap" style="margin:0">' + ic('bolt2', 13) + '<span class="cc-when">' + o.evtLabel + '</span></span></div>'
      : cadStrip(fire, o.cap, o.evt);
    var runlink = o.runs != null ? '<a class="sc-runlink" href="#">' + ic('repeat', 12) + 'сработал <b>' + o.runs + '</b>× · Активность</a>' : '';
    return '<div class="sc-card' + (o.on ? ' sc-card--on' : ' sc-card--off') + '">'
      + '<div class="sc-card-head">'
      + '<span class="sc-card-icon">' + ic(o.ico || 'repeat', 20) + '</span>'
      + '<div class="sc-card-titles">'
      + '<div class="sc-card-name">' + o.name + prov(o) + '</div>'
      + '<div class="sc-card-desc">' + o.desc + '</div>'
      + '</div>'
      + '<div class="sc-card-toggle"><span class="sc-card-state">' + (o.on ? 'Включён' : 'На паузе') + '</span>' + sw(o.on, false) + '</div>'
      + '</div>'
      + strip
      + '<div class="sc-card-foot">'
      + '<div class="sc-runs">'
      + '<div class="sc-run"><span class="sr-k">след. запуск</span><span class="sr-v' + (o.on ? '' : ' muted') + '">' + (o.on ? o.next : '— на паузе') + '</span></div>'
      + runlink
      + '</div>'
      + '<div class="sc-card-actions"><button class="sc-apply">' + ic('users', 14) + ' Применить к…</button>'
      + '<button class="sc-iconbtn" title="Редактировать">' + ic('pencil', 15) + '</button>'
      + '<button class="sc-iconbtn sc-iconbtn--danger" title="Удалить">' + ic('trash', 15) + '</button></div>'
      + '</div>'
      + (o.skip ? '<div class="sc-skip">' + ic('alert', 14) + '<span><b>Вчера пропущен.</b> ' + o.skip + '</span></div>' : '')
      + (o.applyOpen ? applyPop() : '')
      + '</div>';
  }
  function applyPop() {
    var accts = [['Sonya · Таро', '@sonya.tarot', true], ['Sonya Live', '@sonya.live', false], ['Дневник Таро', '@tarot.daily', false]];
    return '<div class="sc-apply-pop"><div class="ap-k">Скопировать сценарий на аккаунты</div>'
      + accts.map(function (a) { return '<div class="sc-acct">' + sw(a[2]) + '<span class="ac-name">' + a[0] + '</span><span class="ac-h">' + a[1] + '</span></div>'; }).join('')
      + '<div class="ap-foot"><button class="btn btn--primary btn--sm">' + ic('check', 14) + ' Применить к 1</button><button class="btn btn--ghost btn--sm">Отмена</button></div></div>';
  }
  var CC = {
    talk: { name: 'Разговор дня', ico: 'bubbleq', prov: 'sched', sched: 'каждый день', desc: 'Открытый вопрос дня первым постом + авто-ответы каждому.', on: true, fire: [1, 1, 1, 1, 1, 1, 1], cap: 'утром, 9:00', next: 'Завтра, 9:00', runs: 38 },
    column: { name: 'Карта дня', ico: 'columns', prov: 'sched', sched: 'по будням', desc: 'Рубрика: одна карта дня с короткой трактовкой.', on: true, fire: [1, 1, 1, 1, 1, 0, 0], cap: 'днём, 12:00', next: 'Завтра, 12:00', runs: 21 },
    duty: { name: 'Дежурство в комментах', ico: 'bubble', prov: 'sched', sched: 'на комментарии', desc: 'Содержательные авто-черновики ответов под постами.', on: true, fire: [1, 1, 1, 1, 1, 1, 1], cap: 'весь день', evt: true, next: 'По мере комментов', runs: 142 },
    safety: { name: 'Если сегодня не постил', ico: 'shield', prov: 'sched', sched: 'если тихо', desc: 'Подстраховка: мягкий пост, если к 19:00 ничего не вышло.', on: false, fire: [1, 1, 1, 1, 1, 1, 1], cap: 'отсечка 19:00', runs: 4, skip: 'Условие не выполнено — «Карта дня» уже вышла сегодня.' },
    promo: { name: 'Мини-разбор по дате', ico: 'gift', prov: 'promo', desc: 'Просим дату рождения в комментах → присылаем разбор в ответ.', on: false, fire: [1, 1, 1, 1, 1, 1, 1], cap: 'весь период', next: '', runs: 6 }
  };
  function ccHead() {
    return '<div class="sc-cc-head"><span class="cc-k">' + ic('repeat', 13) + ' Неделя · в локальном времени аккаунта</span>'
      + '<span class="sc-cap"><span class="sc-cap-l">Лимит постов в день</span>'
      + '<span class="sc-stepper"><button aria-label="меньше">' + ic('x', 13) + '</button><span class="sv">2</span><button aria-label="больше">' + ic('plus', 13) + '</button></span></span></div>';
  }
  function secHead(title, count, active) {
    return '<div class="sc-sec-head' + (active ? ' sc-sec-head--active' : '') + '"><span class="sc-sec-title">' + title + '</span><span class="sc-sec-count">' + count + '</span><span class="sc-sec-rule"></span></div>';
  }
  function homePage(opts) {
    opts = opts || {};
    var promo = opts.applyOn ? Object.assign({ applyOpen: true }, CC.promo) : CC.promo;
    var active = '<div class="sc-groupsec">' + secHead('Активные', 3, true)
      + '<div class="sc-list">' + ccCard(CC.talk) + ccCard(CC.column) + ccCard(CC.duty) + '</div></div>';
    var paused = '<div class="sc-groupsec">' + secHead('На паузе', 2, false)
      + '<div class="sc-list">' + ccCard(CC.safety) + ccCard(promo) + '</div></div>';
    return topbar({ home: true, pill: 'success', pillText: '3 активны', how: true, action: true })
      + '<div class="sc-page">' + ccHead()
      + (opts.warn ? '<div style="display:flex;flex-direction:column;gap:12px">' + warnStack() + '</div>' : '')
      + active + paused + '</div>';
  }

  /* control-center warnings */
  function warnStack() {
    return '<div class="sc-warn"><span class="sw-mark">' + ic('alert', 16) + '</span>'
      + '<div class="sw-body"><div class="sw-title">3 пост-сценария метят в утро</div>'
      + '<div class="sw-sub"><b>Разговор дня</b>, <b>Карта дня</b> и <b>Сезонное</b> хотят выйти первым постом — при лимите 2 сработают два по порядку, третий сдвинется на завтра. Поднимите лимит или разнесите по времени.</div></div></div>';
  }
  function warnPromo() {
    return '<div class="sc-warn"><span class="sw-mark">' + ic('gift', 16) + '</span>'
      + '<div class="sw-body"><div class="sw-title">«Мини-разбор по дате» идёт каждый день</div>'
      + '<div class="sw-sub">Акции бьют сильнее, когда редки — <b>лучше ≤2×/нед</b>. Сузьте период или сделайте по будням, чтобы не выжечь аудиторию.</div></div></div>';
  }
  function warnAutopost() {
    return '<div class="sc-warn sc-warn--autopost"><span class="sw-mark">' + ic('alert', 16) + '</span>'
      + '<div class="sw-body"><div class="sw-title">Автопостинг выключен для @sonya.tarot</div>'
      + '<div class="sw-sub">Вы включаете пост-сценарий, но Pennedly не опубликует посты, пока автопостинг выключен — будет только готовить черновики.</div>'
      + '<button class="btn btn--secondary btn--sm">' + ic('settings', 14) + ' Включить автопостинг</button></div></div>';
  }

  /* list states */
  function skelCard() {
    return '<div class="sc-skel-card">'
      + '<div class="sc-skel-row"><span class="sk" style="width:40px;height:40px;border-radius:10px;flex:0 0 auto"></span>'
      + '<div style="flex:1 1 auto"><span class="sk" style="display:block;width:52%;height:15px"></span><span class="sk" style="display:block;width:78%;height:11px;margin-top:8px"></span></div>'
      + '<span class="sk" style="width:44px;height:24px;border-radius:9999px;flex:0 0 auto"></span></div>'
      + '<span class="sk" style="width:230px;height:28px;border-radius:6px"></span>'
      + '<div style="border-top:1px solid var(--color-border);padding-top:13px;display:flex;gap:18px"><span class="sk" style="width:90px;height:13px"></span><span class="sk" style="width:110px;height:13px"></span><span class="sk" style="width:74px;height:30px;border-radius:6px;margin-left:auto"></span></div>'
      + '</div>';
  }
  function listLoading() { return topbar({ home: true, pill: 'neutral', pillText: '…', action: true }) + '<div class="sc-page"><div class="sc-list">' + skelCard() + skelCard() + skelCard() + '</div></div>'; }
  function listError() {
    return topbar({ home: true, pill: 'neutral', pillText: 'всё выключено', action: true })
      + '<div class="sc-page"><div class="sc-error">'
      + '<span class="sce-mark">' + ic('alert', 18) + '</span>'
      + '<div class="sce-body"><div class="sce-title">Не удалось загрузить сценарии</div>'
      + '<div class="sce-sub">Что-то пошло не так при обращении к Threads. Ваши сценарии в безопасности — попробуйте ещё раз.</div></div>'
      + '<button class="btn btn--secondary btn--sm">' + ic('repeat', 15) + ' Повторить</button></div></div>';
  }

  /* ════════════════════════ C · КАТАЛОГ ШАБЛОНОВ ════════════════════════ */
  function tExample(p) {
    var s = SAMPLE[p.id], k, body = '';
    if (s.poll) { k = 'пример опроса'; body = '<span class="exq">' + s.poll[0] + ' · ' + s.poll[1].slice(0, 3).join(' / ') + '…</span>'; }
    else if (s.post) { k = 'пример поста'; body = '<span class="exq">' + clip(s.post, 150) + '</span>'; }
    else if (s.reply) { k = 'пример ответа'; }
    var rep = '';
    if (s.reply) rep = '<div class="sc-tcard-ex-reply"><span class="exr-k">' + ic('bubble', 11) + ' авто-ответ</span> <span class="exq">' + clip(s.reply.bot, 130) + '</span></div>';
    return '<div class="sc-tcard-ex"><div class="sc-tcard-ex-k">' + ic('eye', 12) + ' ' + k + '</div><div class="sc-tcard-ex-body">' + body + rep + '</div></div>';
  }
  function tcard(p) {
    var cls = 'sc-tcard' + (p.campaign ? ' sc-tcard--campaign' : (p.reply ? ' sc-tcard--reply' : ''));
    var meta = p.reply
      ? '<span class="sc-tcard-when">' + ic('bubble', 11) + ' отвечает людям</span>'
      : '<span class="sc-tcard-when">' + ic('clock', 11) + ' ' + p.when + '</span>';
    return '<button class="' + cls + '">'
      + '<div class="sc-tcard-top"><span class="sc-tcard-ico">' + ic(p.ico, 20) + '</span>'
      + '<div class="sc-tcard-titles"><div class="sc-tcard-name">' + p.name + '</div>' + meta + '</div></div>'
      + '<div class="sc-tcard-desc">' + p.desc + '</div>'
      + tExample(p)
      + '<div class="sc-tcard-foot"><span class="sc-tcard-pick">Выбрать шаблон ' + ic('arrow', 15) + '</span>'
      + (p.campaign ? '<span class="sc-risk">' + ic('alert', 12) + ' мощно, осторожно</span>' : '') + '</div></button>';
  }
  function catalogPage() {
    var groups = GOALS.map(function (g) {
      var cards = g.ids.map(function (id) { return tcard(PRESETS[id]); }).join('');
      return '<div class="sc-pgroup"><div class="sc-pg-head"><span class="sc-pg-title">' + g.title + '</span><span class="sc-pg-note">' + g.note + '</span></div>'
        + '<div class="sc-tgrid">' + cards + '</div></div>';
    }).join('');
    return topbar({ title: 'Готовые шаблоны', crumbs: crumb([{ t: 'Мои сценарии' }, { t: 'Каталог', cur: true }]) })
      + '<div class="sc-page">'
      + '<div class="sc-scratch-cta"><span class="scc-ico">' + ic('wand', 20) + '</span>'
      + '<div class="scc-body"><div class="scc-t">Создать свой с нуля</div><div class="scc-d">Соберите любой сценарий в конструкторе — когда, что постить и/или как отвечать.</div></div>'
      + '<button class="btn btn--secondary">' + ic('plus', 15) + ' Конструктор</button></div>'
      + '<div class="sc-pgroups">' + groups + '</div></div>';
  }

  /* ════════════════════════ FORM PARTS (editor + constructor) ════════════════════════ */
  function fkey(k) { return '<span class="fc-k">' + k + '</span>'; }
  function whenControl(p, opts) {
    opts = opts || {};
    var mode = opts.mode || (p.id === 'column' || p.id === 'poll' ? 'weekly'
      : p.id === 'seasonal' || p.id === 'promo' ? 'dates'
        : p.id === 'boost' || p.id === 'thanks' || p.id === 'duty' ? 'event'
          : opts.everyN ? 'everyn' : 'daily');
    var segs = [['daily', 'Ежедневно'], ['everyn', 'Раз в N дней'], ['weekly', 'Еженедельно'], ['dates', 'В период дат'], ['event', 'По событию']];
    var seg = '<div class="seg" role="tablist">' + segs.map(function (s) {
      return '<button class="seg-opt' + (s[0] === mode ? ' seg-opt--active' : '') + '">' + s[1] + '</button>';
    }).join('') + '</div>';
    var body = '';
    if (mode === 'daily') body = '<div class="sc-everyn" style="color:var(--color-text-subtle)">' + ic('clock', 14) + ' Завтра в 9:00 — первым постом дня</div>';
    else if (mode === 'everyn') body = '<div class="sc-everyn">Каждые <input class="field" value="3" inputmode="numeric" aria-label="число дней"> дня — первым постом дня</div>';
    else if (mode === 'weekly') body = '<div style="display:flex;flex-direction:column;gap:11px"><div class="sc-weekdays">' + WK.map(function (d, i) { return '<span class="sc-wd' + (i === (p.id === 'poll' ? 3 : 1) ? ' on' : '') + '">' + d + '</span>'; }).join('') + '</div><div class="sc-everyn" style="color:var(--color-text-subtle)">' + ic('clock', 14) + (p.id === 'poll' ? ' Каждый четверг в 18:00' : ' Каждый вторник в 12:00') + '</div></div>';
    else if (mode === 'dates') body = '<div class="sc-daterange"><div class="dr-field"><label>Начало</label><input class="field" value="28 июн 2026"></div><span class="dr-arrow">' + ic('arrow', 16) + '</span><div class="dr-field"><label>Конец</label><input class="field" value="5 июл 2026"></div></div>';
    else if (mode === 'event') {
      var evtTxt = p.id === 'boost' ? 'Когда ваш пост <b>перейдёт порог просмотров</b>'
        : p.id === 'thanks' ? 'Когда вы <b>наберёте круглую отметку подписчиков</b>'
          : 'Когда под вашим постом появится <b>новый содержательный комментарий</b>';
      body = '<div class="sc-event"><div class="sc-event-ro"><span class="ev-ico">' + ic('bolt2', 16) + '</span><span class="ev-txt">' + evtTxt + '</span><span class="ev-lock">' + ic('lock', 11) + ' задано пресетом</span></div>';
      if (p.id === 'boost') body += '<div class="sc-threshold"><span>Порог просмотров</span><input class="field" placeholder="авто" value="' + (opts.empty ? '' : '5000') + '"><span class="th-auto">пусто = авто от вашей медианы (~3,2K)</span></div>';
      if (p.id === 'thanks') body += '<div class="sc-ladder"><span>Каждые</span><input class="field" value="1000"><span>подписчиков · или список: 10K, 25K, 50K</span></div>';
      body += '</div>';
    }
    return '<div class="sc-formcard">'
      + '<div class="sc-fc-title">' + fkey('когда') + ' Расписание' + (mode === 'event' ? '<span style="font-weight:400;color:var(--color-text-subtle)"> · по событию</span>' : '') + '</div>'
      + '<div class="sc-fc-sub">' + (mode === 'event' ? 'Этот сценарий реагирует на событие, не на часы. Запускается в локальном времени аккаунта (UTC+1).' : 'Когда запускать — в локальном времени аккаунта (UTC+1).') + '</div>'
      + '<div class="sc-sched">' + seg + body + '</div></div>';
  }
  function bakedRules(id, open) {
    var rules = BAKED[id] || BAKED.custom;
    return '<div class="sc-baked' + (open ? ' sc-baked--open' : '') + '">'
      + '<button class="sc-baked-head"><span class="bh-ico">' + ic('lock', 15) + '</span>'
      + '<span class="bh-t">Что зашьётся</span><span class="bh-chev">' + ic('chev', 16) + '</span></button>'
      + (open ? '<div class="sc-baked-body">'
        + '<p class="sc-baked-intro">Проверенные правила, которые Pennedly добавляет к вашему голосу. Читать можно, менять — нет: так предпросмотр честен.</p>'
        + '<ul class="sc-baked-rules">' + rules.map(function (r) { return '<li class="sc-baked-rule"><span class="br-ico">' + ic('check', 14) + '</span><span>' + r + '</span></li>'; }).join('') + '</ul>'
        + '<div class="sc-baked-foot">' + ic('lock', 12) + ' Только для чтения · поверх — ваш голос из Voice</div>'
        + '</div>' : '') + '</div>';
  }

  /* preview panel (shared) */
  function pollBlock(q, opts) {
    return '<div style="font-size:var(--text-small);line-height:1.6;color:var(--color-text);margin-bottom:11px">' + q + '</div>'
      + opts.map(function (o, i) {
        var pct = [42, 28, 19, 11][i] || 8;
        return '<div style="position:relative;border:1px solid var(--color-border);border-radius:var(--radius-md);padding:8px 11px;margin-bottom:7px;overflow:hidden;font-size:var(--text-small)"><span style="position:absolute;inset:0;width:' + pct + '%;background:color-mix(in srgb,var(--color-accent) 12%,transparent)"></span><span style="position:relative;display:flex;justify-content:space-between"><span>' + o + '</span><span style="color:var(--color-text-subtle);font-variant-numeric:tabular-nums">' + pct + '%</span></span></div>';
      }).join('');
  }
  function mockPost(s) {
    var body = s.poll ? pollBlock(s.poll[0], s.poll[1])
      : '<div class="mockpost-text">' + s.post + '</div>'
      + '<div class="mockpost-stats"><span class="ms">' + ic('eye', 13) + ' ' + s.stats[0] + '</span><span class="ms">' + ic('heart', 13) + ' ' + s.stats[1] + '</span><span class="ms">' + ic('bubble', 13) + ' ' + s.stats[2] + '</span></div>';
    return '<div class="mockpost">'
      + '<div class="mockpost-top">' + av('С') + '<div class="mockpost-who"><span class="mw-n">' + s.who[0] + '</span><span class="mw-h">' + s.who[1] + '</span></div><span class="mockpost-time">' + s.who[2] + '</span></div>'
      + body + '</div>';
  }
  function mockReply(r) {
    return '<div class="mockreply"><div class="mr-k">пример авто-ответа</div>'
      + '<div class="mr-comment">' + av(r.who[0]) + '<div class="mrc-body"><div class="mrc-who">' + r.who + '</div><div class="mrc-text">' + r.text + '</div></div></div>'
      + '<div class="mr-bot">' + av('С') + '<div class="mrb-body"><div class="mrb-who">Соня <span class="mrb-tag">' + ic('bubble', 11) + ' авто-ответ</span></div>'
      + '<div class="mrb-text">' + r.bot + '</div></div></div></div>';
  }
  function previewPanel(id, opts) {
    opts = opts || {};
    var s = SAMPLE[id];
    if (opts.state === 'loading') {
      return '<div class="sc-preview"><div class="sc-prev-head"><span class="sc-prev-cap">' + ic('sparkle', 13) + ' Живой предпросмотр</span></div>'
        + '<div class="sc-prev-panel"><div class="prev-loading">'
        + '<span class="sk" style="width:40%;height:11px"></span><span class="sk" style="width:100%;height:13px"></span><span class="sk" style="width:92%;height:13px"></span><span class="sk" style="width:64%;height:13px"></span>'
        + '<span class="sk" style="width:100%;height:64px;margin-top:6px;border-radius:10px"></span></div></div></div>';
    }
    var cta = s.cta ? '<div class="sc-prev-cta"><div class="pc-k">Собранный призыв</div><div class="pc-text">' + s.cta + '</div></div>' : '';
    var draftNote = opts.runResult ? '<div class="sc-draftnote">' + ic('checkc', 16) + ' Черновик создан <span class="dn-sub">— ничего не опубликовано. Найдёте его в Студии.</span></div>' : '';
    var inner = cta
      + '<div class="sc-primed">' + ic('sparkle', 13) + '<span>Грунтован на <b>' + s.primed + '</b> — Pennedly не выдумывает за вас.</span></div>'
      + draftNote
      + (s.post || s.poll ? mockPost(s) : '')
      + (s.reply ? mockReply(s.reply) : '')
      + '<div class="sc-when-fires">' + ic('clock', 14) + '<span>Сработает: <b>' + s.fires + '</b></span></div>'
      + (opts.runResult ? '' : '<div class="sc-runnow-bar"><button class="btn btn--secondary btn--sm">' + ic('play', 14) + ' Прогнать сейчас</button><span class="rn-note">Создаст черновик прямо сейчас — никогда не публикует.</span></div>');
    return '<div class="sc-preview"><div class="sc-prev-head"><span class="sc-prev-cap">' + ic('sparkle', 13) + ' Живой предпросмотр</span>'
      + '<button class="btn btn--ghost btn--sm">' + ic('repeat', 14) + ' Обновить</button></div>'
      + '<div class="sc-prev-panel">' + inner + '</div></div>';
  }

  /* minimal per-preset fields (editor from a template) */
  function minimalFields(p, opts) {
    opts = opts || {}; var E = opts.empty; var rows = '';
    if (p.id === 'talk') rows = '<div class="sc-field"><label>Тема дня <span style="font-weight:400;color:var(--color-text-subtle)">· необязательно</span></label><input class="field" placeholder="оставьте пустым — Pennedly подберёт сам" value="' + (E ? '' : 'про страх начать') + '"><span class="field-hint">Одно слово или фраза задаёт настроение вопроса.</span></div>';
    else if (p.id === 'column') rows = '<div class="sc-field"><label>Имя рубрики</label><input class="field" value="' + (E ? '' : 'Карта дня') + '" placeholder="например, Карта дня"></div><div class="sc-field"><label>Тема-столп</label><input class="field" value="' + (E ? '' : 'одна карта Таро + практический совет') + '" placeholder="о чём эта рубрика, в одной строке"><span class="field-hint">Постоянный формат — Pennedly держит его из выпуска в выпуск.</span></div>';
    else if (p.id === 'duty') rows = '<div class="sc-field"><label>Кому отвечаем</label>' + sel('Все, кроме троллей', ['Только фанатам и тёплым', 'Все, кроме троллей', 'Только тем, кто задал вопрос']) + '<span class="field-hint">Pennedly готовит черновик ответа — вы его утверждаете в «Ответах».</span></div>';
    else if (p.id === 'boost') rows = '<div class="sc-fc-sub" style="margin:0">Порог задан в «Расписании» выше — это и есть весь сценарий. Дальше — что зашьётся и как звучит фоллоуап.</div>';
    else if (p.id === 'promo') rows = '<div class="sc-field' + (opts.err ? ' sc-field--err' : '') + '"><label>Что просим написать в комментах</label><input class="field" placeholder="например, свою дату рождения" value="' + (E ? '' : 'свою дату рождения') + '">'
      + (opts.err ? '<span class="field-hint field-hint--error" style="color:var(--color-danger)">Заполните это поле — без него не собрать призыв.</span>' : '<span class="field-hint">Одно короткое действие. Это попадёт прямо в призыв-CTA.</span>') + '</div>'
      + '<div class="sc-field"><label>Что даём взамен</label><input class="field" placeholder="например, короткий мини-разбор" value="' + (E ? '' : 'короткий мини-разбор прямо в комментах') + '"><span class="field-hint">Чем понятнее выгода, тем больше откликов.</span></div>'
      + '<div class="sc-toggles"><div class="sc-toggle"><div class="st-label"><div class="st-t">' + ic('person', 14) + ' Требовать подписку</div><div class="st-d">Отвечаем только тем, кто подписан на аккаунт.</div></div>' + sw(!E) + '</div>'
      + '<div class="sc-toggle"><div class="st-label"><div class="st-t">' + ic('heart', 14) + ' Требовать лайк</div><div class="st-d">Отвечаем только если человек лайкнул пост.</div></div>' + sw(false) + '</div></div>';
    var title = p.id === 'promo' ? 'Механика акции' : p.id === 'duty' ? 'Кого дежурить' : 'Что вы задаёте';
    return '<div class="sc-formcard"><div class="sc-fc-title">' + fkey('что') + ' ' + title + '</div>'
      + '<div class="sc-fc-sub">Только то, что нельзя угадать за вас — остальное зашьётся ниже.</div>' + rows + '</div>';
  }
  function replyBlock(p, opts) {
    opts = opts || {};
    var val = opts.empty ? '' : (p.id === 'promo' ? 'Отвечай тепло и по имени. Дай 1–2 наблюдения по дате, без клише, заканчивай мягким вопросом.' : 'Отвечай по сути комментария, по имени, дай одно наблюдение и мягкий вопрос.');
    return '<div class="sc-formcard"><div class="sc-fc-title">' + fkey('как отвечать') + ' Ответы в комментах</div>'
      + '<div class="sc-fc-sub">Как звучит каждый авто-ответ. Базовое правило зашито; ниже — ваша правка.</div>'
      + '<div class="sc-baked" style="margin-bottom:14px"><div class="sc-baked-body" style="padding:13px 15px"><p class="sc-baked-intro" style="margin:0 0 9px">Зашитое правило</p>'
      + '<div class="sc-baked-rule" style="border:none;padding:0"><span class="br-ico">' + ic('lock', 13) + '</span><span>Только содержательно, по имени, без шаблонов; тролли отсеяны.</span></div></div></div>'
      + '<div class="sc-field"><label>' + ic('pencil', 13) + ' Ваша правка <span style="font-weight:400;color:var(--color-text-subtle)">· поверх зашитого</span></label><textarea class="field" rows="3" placeholder="например, обращайся по имени, дай 1–2 наблюдения и мягкий вопрос">' + val + '</textarea></div></div>';
  }
  function actionbar(opts) {
    opts = opts || {};
    return '<div class="sc-formcard"><div class="sc-actionbar">'
      + (opts.saving ? '<button class="btn btn--secondary" aria-disabled="true"><span class="spinner"></span> Сохранение…</button>' : '<button class="btn btn--secondary">Сохранить</button>')
      + (opts.saving ? '<button class="btn btn--primary" aria-disabled="true"><span class="spinner"></span> Сохранение…</button>' : '<button class="btn btn--primary">' + ic('check', 15) + ' Сохранить и включить</button>')
      + '<span class="sa-spacer"></span>'
      + (opts.existing ? '<button class="btn btn--ghost">' + ic('trash', 15) + ' Удалить</button>' : '')
      + '</div>'
      + (opts.deleteConfirm ? '<div class="sc-delete-confirm"><span class="sdc-t">Удалить этот сценарий? Действие необратимо.</span><button class="btn btn--ghost btn--sm">Отмена</button><button class="btn btn--danger btn--sm">Удалить</button></div>' : '')
      + '</div>';
  }

  /* editor of an EXISTING / template-seeded scenario */
  function editorPage(p, opts) {
    opts = opts || {};
    var title = opts.empty ? 'Новый сценарий' : (p.id === 'promo' ? 'Мини-разбор по дате рождения' : (CC[p.id] ? CC[p.id].name : p.name));
    var form = '<div class="sc-form">'
      + '<div class="sc-formcard"><div class="sc-field"><label>Название сценария</label><input class="field" value="' + title + '"></div></div>'
      + whenControl(p, opts) + minimalFields(p, opts) + bakedRules(p.id, opts.baked)
      + (p.reply ? replyBlock(p, opts) : '')
      + (opts.err ? '<div class="sc-error"><span class="sce-mark">' + ic('alert', 18) + '</span><div class="sce-body"><div class="sce-title">Не удалось сохранить</div><div class="sce-sub">Проверьте обязательные поля и попробуйте снова. Изменения не потеряны.</div></div></div>' : '')
      + actionbar({ existing: true, saving: opts.saving, deleteConfirm: opts.deleteConfirm }) + '</div>';
    return topbar({ title: title, crumbs: crumb([{ t: 'Мои сценарии' }, { t: 'Каталог' }, { t: 'Редактор', cur: true }]) })
      + '<div class="sc-page"><div class="sc-editor">' + form + previewPanel(p.id, opts) + '</div></div>';
  }

  /* ════════════════════════ D · КОНСТРУКТОР (from scratch) ════════════════════════ */
  function actcard(on, ico, t, d) {
    return '<div class="sc-actcard' + (on ? ' sc-actcard--on' : '') + '"><span class="ac-ico">' + ic(ico, 18) + '</span>'
      + '<div class="ac-body"><div class="ac-t">' + t + '</div><div class="ac-d">' + d + '</div></div>' + sw(on) + '</div>';
  }
  function postSub(opts) {
    opts = opts || {};
    return '<div class="sc-subblock"><span class="sc-subblock-k">' + ic('doc', 13) + ' Что постить</span>'
      + '<div class="sc-field"><label>Инструкция для поста</label><textarea class="field" rows="3" placeholder="опишите, о чём и как писать">' + (opts.empty ? '' : 'Короткий вопрос-размышление по теме «довести дело до конца». Один открытый вопрос, на который легко ответить одним словом.') + '</textarea></div>'
      + '<div class="sc-tip"><div class="tip-k">' + ic('sparkle', 13) + ' Как написать хорошую инструкцию</div>'
      + '<ul><li>Одна задача на пост — тема + формат, не список тем.</li><li>Скажите тон и длину: «коротко, тепло, без клише».</li><li>Дайте зацепку для ответа — вопрос или призыв.</li></ul>'
      + '<div class="tip-ex"><b>Пример</b>Каждое утро — короткий вопрос-размышление на одно слово в ответ, в моём обычном тоне, без «продающих» формулировок.</div></div></div>';
  }
  function replySub(opts) {
    opts = opts || {};
    return '<div class="sc-subblock"><span class="sc-subblock-k">' + ic('bubble', 13) + ' Как отвечать</span>'
      + '<div class="sc-field"><label>Кому отвечаем</label>' + sel('Все, кроме троллей', ['Только фанатам и тёплым', 'Все, кроме троллей', 'Только тем, кто задал вопрос']) + '</div>'
      + '<div class="sc-field"><label>Инструкция для ответа</label><textarea class="field" rows="3" placeholder="как звучит каждый ответ">' + (opts.empty ? '' : 'По имени, по сути комментария, одно наблюдение и мягкий вопрос. Без шаблонных фраз.') + '</textarea></div></div>';
  }
  function constructorPage(opts) {
    opts = opts || {};
    var post = opts.reply && !opts.both ? false : true;       /* default: both on */
    var reply = opts.post && !opts.both ? false : true;
    if (opts.both) { post = true; reply = true; }
    if (opts.postOnly) { post = true; reply = false; }
    if (opts.replyOnly) { post = false; reply = true; }
    var shape = post && reply ? 'расписание · пост + ответы' : reply && !post ? 'дежурный по ответам' : 'расписание · пост';
    var form = '<div class="sc-form">'
      + '<div class="sc-formcard"><div class="sc-field"><label>Название сценария</label><input class="field" value="' + (opts.empty ? '' : 'Мой утренний вопрос') + '" placeholder="например, Утренний вопрос"></div></div>'
      + whenControl({ id: 'custom' }, { mode: opts.mode || 'daily' })
      + '<div class="sc-formcard"><div class="sc-fc-title">' + fkey('что делать') + ' Действие</div>'
      + '<div class="sc-fc-sub">Соберите пост-сценарий, ответный, или оба сразу — отметьте, что нужно.</div>'
      + '<div class="sc-actpick">' + actcard(post, 'doc', 'Публиковать посты', 'Сам постит по расписанию выше.') + actcard(reply, 'bubble', 'Отвечать на комментарии', 'Сам отвечает тем, кто пишет.') + '</div>'
      + (post ? postSub(opts) : '') + (reply ? replySub(opts) : '') + '</div>'
      + '<div class="sc-formcard"><div class="sc-fc-title">' + fkey('если') + ' Условие <span style="font-weight:400;color:var(--color-text-subtle)">· необязательно</span></div>'
      + '<div class="sc-fc-sub">Сузьте, когда сценарий срабатывает.</div>'
      + sel('Без условия', ['Без условия', 'Только по будням', 'Только для подписчиков', 'Если за день не было постов', 'Если пост перейдёт порог просмотров']) + '</div>'
      + bakedRules('custom', opts.baked)
      + '<div class="sc-formcard" style="padding:14px 18px"><span class="sc-compiles">' + ic('repeat', 14) + ' Соберётся в: <b>' + shape + '</b></span></div>'
      + actionbar({ existing: false }) + '</div>';
    return topbar({ title: 'Конструктор сценария', crumbs: crumb([{ t: 'Мои сценарии' }, { t: 'Каталог' }, { t: 'Конструктор', cur: true }]) })
      + '<div class="sc-page"><div class="sc-editor">' + form + previewPanel('talk', opts) + '</div></div>';
  }

  /* ══════════════════════════════ MOUNT ════════════════════════════════ */

  /* §2 — nav chrome: home top bar vs deep top bar (back + crumbs + title) */
  set('f-nav', row(
    col('Дом · топбар «Сценарии» + статус-pill + «Создать»', '<div style="min-height:60px">' + topbar({ home: true, pill: 'success', pillText: '3 активны', how: true, action: true }) + '</div>', false),
    col('Вглубь · «← Мои сценарии» + крошки + заголовок', '<div style="min-height:60px">' + topbar({ title: 'Готовые шаблоны', crumbs: crumb([{ t: 'Мои сценарии' }, { t: 'Каталог', cur: true }]) }) + '</div>', false)
  ));

  /* §3 — A · старт / обучение (= пустое состояние) */
  set('f-teach', col('A · Старт / обучение · Light', teach(), false) + col('A · Старт / обучение · Dark', teach(), true));

  /* §4 — B · мои сценарии (active + paused) */
  set('f-home', col('B · Мои сценарии · активные + на паузе · Light', homePage({}), false)
    + col('B · Мои сценарии · Dark', homePage({}), true));
  set('f-home-empty', col('B · пусто → ведёт в A (старт)', teach(), false));
  set('f-home-card', row(
    col('Карта · активна + недельная полоса', '<div class="sc-list">' + ccCard(CC.talk) + '</div>', false),
    col('Карта · на паузе + «почему не сработало»', '<div class="sc-list">' + ccCard(CC.safety) + '</div>', false)
  ));
  set('f-home-cc', col('Центр управления · лимит/день + стэкинг-варнинги · Light', homePage({ warn: true }), false));
  set('f-home-warn', row(
    col('Стэкинг-предупреждения (называют жертв)', '<div style="display:flex;flex-direction:column;gap:12px">' + warnStack() + warnPromo() + '</div>', false),
    col('Автопостинг выключен', warnAutopost(), false)
  ));
  set('f-home-states', row(
    col('Загрузка (скелетоны)', listLoading(), false),
    col('Ошибка', listError(), false)
  ));
  set('f-home-apply', col('«Применить к…» · клон на аккаунты · Light', topbar({ home: true, pill: 'success', pillText: '3 активны', action: true }) + '<div class="sc-page"><div class="sc-list">' + ccCard(Object.assign({ applyOpen: true }, CC.promo, { on: true })) + '</div></div>', false));

  /* §5 — C · каталог */
  set('f-catalog', col('C · Каталог шаблонов · по цели · Light', catalogPage(), false)
    + col('C · Каталог · Dark', catalogPage(), true));
  set('f-catalog-card', row(
    col('Карта шаблона · пост-пример', '<div class="sc-tgrid">' + tcard(PRESETS.talk) + tcard(PRESETS.poll) + '</div>', false),
    col('Карта шаблона · ответ-пример + кампания', '<div class="sc-tgrid">' + tcard(PRESETS.duty) + tcard(PRESETS.promo) + '</div>', false)
  ));

  /* §6 — D · конструктор */
  set('f-constructor', col('D · Конструктор · пост + ответы · Light', constructorPage({ both: true }), false)
    + col('D · Конструктор · Dark', constructorPage({ both: true }), true));
  set('f-constructor-actions', row(
    col('Только пост', constructorPage({ postOnly: true }), false),
    col('Только ответы (дежурный)', constructorPage({ replyOnly: true }), false)
  ));

  /* §7 — editor of existing (template-seeded) */
  set('f-editor', col('Редактор · «Рубрика» (из шаблона) · Light', editorPage(PRESETS.column, { existing: true }), false)
    + col('Редактор · «Акция» · Dark', editorPage(PRESETS.promo, { existing: true }), true));
  set('f-editor-states', row(
    col('Раз в N дней + сохранение', editorPage(PRESETS.talk, { existing: true, everyN: true, saving: true }), false),
    col('Ошибка валидации + удаление-confirm', editorPage(PRESETS.promo, { existing: true, err: true, deleteConfirm: true, state: 'loading' }), false)
  ));

  /* §8 — preview + run-now */
  set('f-preview', row(
    col('Предпросмотр + «Прогнать сейчас»', '<div class="sc-editor" style="grid-template-columns:1fr">' + previewPanel('talk', {}) + '</div>', false),
    col('Результат прогона — создан ЧЕРНОВИК', '<div class="sc-editor" style="grid-template-columns:1fr">' + previewPanel('column', { runResult: true }) + '</div>', false)
  ));

  /* §9 — «что зашьётся» + reactive event */
  set('f-disclose', row(
    col('«Что зашьётся» раскрыто (доверие)', '<div class="sc-form">' + bakedRules('talk', true) + '</div>', false),
    col('Реактивный «По событию» + порог', '<div class="sc-form">' + whenControl(PRESETS.boost, {}) + minimalFields(PRESETS.boost, {}) + '</div>', false)
  ));

  window.SCEN = { ic: ic, PRESETS: PRESETS };
})();
