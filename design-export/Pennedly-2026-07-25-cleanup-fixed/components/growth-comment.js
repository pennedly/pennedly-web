/* growth-comment.js — рендер НОВОГО типа сценария «КОММЕНТАРИЙ-ДОБАВКА ПРИ РОСТЕ ПОСТА».
   Модель та же — КАРТОЧКА-РЕЦЕПТ: читаемая фраза со слотами + инлайн-драйверы +
   живой предпросмотр справа. Отличие от «много просмотров → новый ПОСТ»:
   действие = КОММЕНТАРИЙ к тому же посту, с ЗАРАНЕЕ НАПИСАННЫМ текстом (не генерится).

   Один buildGC(cfg) собирает весь экран; cfg задаёт кадр дока. Переиспует токены
   и классы из recipe-editor.css / scenarios*.css; новые классы — в growth-comment.css.
   Зависит от window.SR (scenarios-redesign-data.js) для имени/ленты автора. */
(function () {
  "use strict";
  var SR = window.SR, C = SR.CREATOR;

  /* ------------------------------- icon bank -------------------------------- */
  function ic(n, s) {
    s = s || 14;
    var v = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
    var G = {
      bubble: '<path d="M21 12a8 8 0 0 1-11.5 7.2L4 20l1-5A8 8 0 1 1 21 12Z"/>',
      heart: '<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z"/>',
      eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
      check: '<path d="M20 7 9 18l-5-5"/>',
      x: '<path d="M6 6l12 12M18 6 6 18"/>',
      chev: '<path d="M9 6l6 6-6 6"/>',
      back: '<path d="M15 18l-6-6 6-6"/>',
      info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.5v.5"/>',
      lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
      plus: '<path d="M12 5v14M5 12h14"/>',
      pencil: '<path d="M4 20h4L19 9a2 2 0 0 0-3-3L5 17v3Z"/><path d="M14.5 6.5 17.5 9.5"/>',
      sparkle: '<path d="M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3Z"/>',
      play: '<path d="M7 5l12 7-12 7V5Z"/>',
      bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/>',
      repeat: '<path d="M17 2.5 20.5 6 17 9.5"/><path d="M3.5 11V9a3 3 0 0 1 3-3h14"/><path d="M7 21.5 3.5 18 7 14.5"/><path d="M20.5 13v2a3 3 0 0 1-3 3h-14"/>',
      sliders: '<path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h7M15 18h5"/><circle cx="16" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="13" cy="18" r="2"/>',
      expand: '<path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3"/>',
      link: '<path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 1 0-5.66-5.66l-1.5 1.5"/><path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 1 0 5.66 5.66l1.5-1.5"/>',
      megaphone: '<path d="M3 11v2a1 1 0 0 0 1 1h2l9 5V5L6 10H4a1 1 0 0 0-1 1Z"/><path d="M18 9a4 4 0 0 1 0 6"/>',
      trend: '<path d="M3 17l6-6 4 4 8-8"/><path d="M21 7v5h-5"/>',
      timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 2h6"/>',
      gauge: '<path d="M12 13l4-3"/><path d="M4 18a9 9 0 1 1 16 0"/><circle cx="12" cy="13" r="1.4"/>',
      shieldhouse: '<path d="M4 11l8-6 8 6v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z"/><path d="M9.5 20v-5h5v5"/>',
      clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
      hash: '<path d="M9 4 7 20M17 4l-2 16M5 9h15M4 15h15"/>',
      layers: '<path d="M12 3 3 8l9 5 9-5-9-5Z"/><path d="M3 13l9 5 9-5M3 16.5l9 5 9-5"/>',
      pin: '<path d="M12 21s-6-5.5-6-10a6 6 0 0 1 12 0c0 4.5-6 10-6 10Z"/><circle cx="12" cy="11" r="2.2"/>',
      target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="0.6" fill="currentColor"/>',
      calendar: '<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M4 9h16M8 3v4M16 3v4"/>',
      pencildoc: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/><path d="M18 2.5 21.5 6 14 13.5 10.5 14 11 10.5 18 2.5Z"/>'
    };
    return '<svg width="' + s + '" height="' + s + '" ' + v + '>' + (G[n] || '') + '</svg>';
  }

  /* ------------------------------- primitives ------------------------------- */
  function frame(inner, dark) { return '<div class="frame' + (dark ? ' dark' : '') + '">' + inner + '</div>'; }
  function av(initials, sz) { sz = sz || 32; return '<span style="width:' + sz + 'px;height:' + sz + 'px;display:inline-grid;place-items:center;border-radius:9999px;background:var(--color-surface-2);border:1px solid var(--color-border);font-size:' + Math.round(sz * 0.36) + 'px;font-weight:600;color:var(--color-text-muted);flex:0 0 auto">' + initials + '</span>'; }
  function why(html) { return '<div class="rc-why">' + ic('info', 13) + '<span>' + html + '</span></div>'; }
  function hard(html) { return '<div class="rc-hard">' + ic('lock', 13) + '<span>' + html + '</span></div>'; }
  function who() { return '<span class="who">' + C.handle + '</span>'; }
  function sel(val, opts) { return '<select class="field" aria-label="select">' + opts.map(function (o) { return '<option' + (o === val ? ' selected' : '') + '>' + o + '</option>'; }).join('') + '</select>'; }
  function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0'); }

  /* ------------------------------- domain ----------------------------------- */
  var METRIC = {
    views:    { ico: 'eye',    word: 'просмотров',   one: 'просмотр',     def: 5000, label: 'Просмотры',    quick: [3000, 5000, 10000] },
    likes:    { ico: 'heart',  word: 'лайков',       one: 'лайк',         def: 200,  label: 'Лайки',         quick: [100, 200, 500] },
    comments: { ico: 'bubble', word: 'комментариев', one: 'комментарий',  def: 50,   label: 'Комментарии',   quick: [25, 50, 100] }
  };
  function metricOf(cfg) { return METRIC[cfg.metric] || METRIC.views; }
  function threshOf(cfg) { return cfg.threshold != null ? cfg.threshold : metricOf(cfg).def; }

  /* ── ЦЕЛЬ: за какими постами следит бустер. Под капотом — одно поле target.
     A задаёт её явным пикером; B/C — неявно из контекста (target залочен). ── */
  var SAMPLE_SCENARIO = 'Утренний вопрос';
  var SAMPLE_KEYWORD = 'гайд';
  function scenarioOf(cfg) { return cfg.scenario || SAMPLE_SCENARIO; }
  function keywordOf(cfg) { return cfg.keyword || SAMPLE_KEYWORD; }
  // короткая формулировка цели для слота фразы (после «Бустер следит за …» — творительный падеж)
  function targetSummary(cfg) {
    switch (cfg.target) {
      case 'scenario': return 'постами сценария «' + scenarioOf(cfg) + '»';
      case 'post': return 'этим постом';
      case 'condition': return 'постами со словом «' + keywordOf(cfg) + '»';
      default: return 'всеми моими постами';
    }
  }
  // подлежащее во множественном/нужном числе для зачина фразы
  function targetSubject(cfg) {
    switch (cfg.target) {
      case 'scenario': return 'пост сценария «' + scenarioOf(cfg) + '»';
      case 'post': return 'этот пост';
      case 'condition': return 'пост со словом «' + keywordOf(cfg) + '»';
      default: return 'любой мой пост';
    }
  }
  // человекочитаемая цель для локнутой плашки B/C
  function targetChipText(cfg) {
    switch (cfg.target) {
      case 'scenario': return ['repeat', 'Цель: посты сценария ', scenarioOf(cfg)];
      case 'post': return ['pin', 'Цель: ', 'этот пост'];
      case 'condition': return ['hash', 'Цель: посты со словом ', '«' + keywordOf(cfg) + '»'];
      default: return ['layers', 'Цель: ', 'все мои посты'];
    }
  }

  // заранее ЗАГОТОВЛЕННЫЙ текст комментария (обычно ссылка/призыв) — НЕ генерится
  var COMMENT_FULL = 'Если откликнулось — я собрал это в бесплатный гайд «20 минут в день, чтобы доводить дела до конца». Забрать без почты → alex.makes/guide 👇';
  function commentText(cfg) { return cfg.commentText || COMMENT_FULL; }
  function quoteShort(t, n) { n = n || 44; var s = t.length > n ? t.slice(0, n).replace(/\s+\S*$/, '') + '…' : t; return '«' + s + '»'; }

  /* текст комментария с подсвеченной ссылкой (для предпросмотра) */
  function commentRich(t) {
    return t.replace(/(alex\.makes\/\S+)/g, '<span class="gc-link">$1</span>');
  }

  /* свободный текст → удобный триггер «открыть в отдельном окне» (как в других сценариях) */
  function bigText(value, hint) {
    var empty = !value;
    return '<div class="bigtext"><div class="bigtext-val' + (empty ? ' is-empty' : '') + '">' + (value || 'Нажми, чтобы написать комментарий…') + '</div>'
      + '<div class="bigtext-foot"><span class="bt-hint">' + (hint || '') + '</span>'
      + '<button class="bigtext-expand">' + ic('expand', 13) + ' Открыть в отдельном окне</button></div></div>';
  }
  function commentModal(cfg) {
    var val = commentText(cfg);
    return '<div class="bt-overlay"><div class="bt-scrim"></div><div class="bt-dialog" role="dialog" aria-modal="true">'
      + '<div class="bt-dh"><span class="bt-dh-ico">' + ic('megaphone', 16) + '</span><span class="bt-dh-t">Текст комментария — заготовлен заранее</span>'
      + '<button class="bt-dh-x" aria-label="Закрыть">' + ic('x', 16) + '</button></div>'
      + '<div class="bt-db"><textarea class="bt-area" placeholder="Напиши комментарий, который Pennedly добавит к посту: ссылку, призыв, дополнение…">' + val + '</textarea>'
      + '<div class="bt-why">' + ic('info', 13) + '<span>Этот текст <b>публикуется как есть</b> — Pennedly его не переписывает и не «озвучивает голосом». Можно вставить ссылку, промокод или призыв.</span></div></div>'
      + '<div class="bt-df"><span class="bt-count">' + val.length + ' символов</span><span style="flex:1 1 auto"></span>'
      + '<button class="btn btn--secondary">Отмена</button>'
      + '<button class="btn btn--primary">' + ic('check', 15) + ' Сохранить</button></div>'
      + '</div></div>';
  }

  /* -------------------------------- slots ----------------------------------- */
  function slot(txt, open) { return '<span class="rc-slot' + (open ? ' is-open' : '') + '" role="button" tabindex="0">' + txt + '</span>'; }

  /* ------------------------------ drawer shell ------------------------------ */
  function drawer(title, icoName, body) {
    return '<div class="rc-drawer"><div class="rcd-head"><span class="rcdh-ico">' + ic(icoName, 15) + '</span>'
      + '<span class="rcdh-t">' + title + '</span>'
      + '<button class="rcdh-done">' + ic('check', 14) + ' Готово</button></div>'
      + '<div class="rcd-body">' + body + '</div></div>';
  }

  /* ════════════════ DRAWER · МЕТРИКА + ПОРОГ ════════════════ */
  function metricTile(key, cfg) {
    var m = METRIC[key], on = (cfg.metric || 'views') === key;
    return '<button class="aud-tile' + (on ? ' aud-tile--on' : '') + '"><span class="at-t">' + ic(m.ico, 14) + ' ' + m.label + '</span>'
      + '<span class="at-d">порог по умолчанию · <span class="at-metricnum">' + fmt(m.def) + '</span></span></button>';
  }
  function anyTile(cfg) {
    var on = cfg.metric === 'any';
    return '<button class="aud-tile' + (on ? ' aud-tile--on' : '') + '"><span class="at-t">' + ic('trend', 14) + ' Любая из метрик</span>'
      + '<span class="at-d">сработает, как только пройдён <b>любой</b> из порогов</span></button>';
  }
  function step(val) {
    return '<div class="rc-step"><button aria-label="меньше">–</button><span class="rcs-val">' + val + '</span><button aria-label="больше">+</button></div>';
  }
  function quickChips(cfg) {
    var m = metricOf(cfg), th = threshOf(cfg);
    return '<span class="gt-quick">' + m.quick.map(function (q) {
      return '<button class="gt-chip' + (q === th ? ' gt-chip--on' : '') + '">' + fmt(q) + '</button>';
    }).join('') + '</span>';
  }
  function singleThreshold(cfg) {
    var m = metricOf(cfg), th = threshOf(cfg);
    return '<div class="sc-field"><label>Сколько ' + m.word + ' — порог</label>'
      + '<div class="gc-thresh">' + step(fmt(th)) + '<span class="gt-word">' + m.word + '</span>' + quickChips(cfg) + '</div></div>';
  }
  function anyRows() {
    var rows = ['views', 'likes', 'comments'].map(function (k, i) {
      var m = METRIC[k], off = k === 'comments';
      return '<div class="gc-metric-row' + (off ? ' gc-metric-row--off' : '') + '"><span class="gmr-ico">' + ic(m.ico, 14) + '</span>'
        + '<span class="gmr-name">' + m.label + '</span>'
        + '<span class="gmr-ctl">' + step(fmt(m.def)) + ' ' + m.word + '</span></div>';
    }).join('');
    return '<div class="gc-metric-rows"><div class="gc-anyhead">' + ic('info', 12) + ' Сработает, как только пост перейдёт <b>любой</b> из включённых порогов — что наступит раньше.</div>' + rows + '</div>';
  }
  function metricPicker(cfg) {
    var any = cfg.metric === 'any';
    return '<div class="sc-field"><label>По какой активности срабатывать</label>'
      + '<div class="gc-metric-grid">' + metricTile('views', cfg) + metricTile('likes', cfg) + metricTile('comments', cfg) + anyTile(cfg) + '</div></div>'
      + (any ? anyRows() : singleThreshold(cfg));
  }
  function metricBody(cfg) {
    return metricPicker(cfg)
      + why('Одна метрика на сценарий — так предсказуемее. Нужно несколько порогов разом — выбери <b>«Любая из метрик»</b>.')
      + hard('Реактивно: Pennedly проверяет метрики <b>раз в ~15 минут</b>, не мгновенно. Между порогом и комментарием возможна небольшая задержка.')
      + hard('Под наблюдением — только <b>посты за последние ~48 часов</b>. На старые посты сценарий не реагирует.');
  }

  /* ════════════════ DRAWER · ЦЕЛЬ «ЗА ЧЕМ СЛЕДИТ» (только точка входа A) ════════════════ */
  function goalTile(key, cfg) {
    var meta = {
      all:       { ico: 'layers', t: 'Ко всем моим постам',        d: 'бустер следит за любым новым постом' },
      scenario:  { ico: 'repeat', t: 'К постам сценария',          d: 'только посты, что создаёт выбранный сценарий' },
      post:      { ico: 'pin',    t: 'К конкретному посту',        d: 'один выбранный пост — точечно' },
      condition: { ico: 'hash',   t: 'По условию',                 d: 'посты со словом / тегом или в окне дат' }
    }[key];
    var on = (cfg.target || 'all') === key;
    return '<button class="aud-tile' + (on ? ' aud-tile--on' : '') + '"><span class="at-t">' + ic(meta.ico, 14) + ' ' + meta.t + '</span>'
      + '<span class="at-d">' + meta.d + '</span></button>';
  }
  function goalSub(cfg) {
    switch (cfg.target) {
      case 'scenario':
        return '<div class="gc-goal-sub"><div class="ggs-k">Какой сценарий отслеживать — бустер сработает только под его постами.</div>'
          + '<div class="ggs-row">' + sel(scenarioOf(cfg), ['Утренний вопрос', 'Рубрика', 'Опрос', 'Сезонная тема']) + '</div></div>';
      case 'post':
        var s = SR.SAMPLE.boost;
        return '<div class="gc-goal-sub"><div class="ggs-k">Выбранный пост — бустер ждёт только его порог.</div>'
          + '<div class="gc-postpick">' + av(C.initial, 30) + '<div class="gp-snip">' + s.post.slice(0, 96).replace(/\s+\S*$/, '') + '…<div class="gp-when">опубликован 3 ч назад</div></div>'
          + '<button class="btn btn--secondary btn--sm gp-change">Сменить</button></div></div>';
      case 'condition':
        return '<div class="gc-goal-sub"><div class="ggs-k">Бустер сработает только на постах, подходящих под условие.</div>'
          + '<div class="ggs-row"><span class="gt-word">Слово или тег в тексте:</span>' + sel('содержит «' + keywordOf(cfg) + '»', ['содержит «' + keywordOf(cfg) + '»', 'содержит «ссылка»', 'тег #запуск']) + '</div>'
          + '<div class="ggs-row"><span class="gt-word">Период:</span>' + sel('без ограничений', ['без ограничений', 'только 1–7 июля', 'только этот месяц']) + '</div></div>';
      default:
        return '<div class="gc-goal-sub"><div class="ggs-k">Бустер будет следить за <b>каждым новым постом</b> и срабатывать на тех, что перешли порог. Можно сузить условием на «Слое 2».</div></div>';
    }
  }
  function goalBody(cfg) {
    return '<div class="sc-field"><label>За какими постами следит бустер</label>'
      + '<div class="gc-goal-grid">' + goalTile('all', cfg) + goalTile('scenario', cfg) + goalTile('post', cfg) + goalTile('condition', cfg) + '</div></div>'
      + goalSub(cfg)
      + why('Цель — это <b>область наблюдения</b>. Конфиг бустера (метрика, порог, текст, режим) от цели не зависит — он одинаковый, куда бы бустер ни был привязан.')
      + hard('Один бустер = одна цель. Хочешь разные тексты для разных постов — заведи отдельные бустеры.');
  }

  /* ════════════════ DRAWER · ТЕКСТ КОММЕНТАРИЯ ════════════════ */
  function commentField(cfg) {
    return '<div class="sc-field"><label>Что добавить комментарием</label>'
      + bigText(commentText(cfg), 'Публикуется как есть · ссылка, призыв или дополнение') + '</div>';
  }
  function commentBody(cfg) {
    return commentField(cfg)
      + hard('Это <b>заготовленный текст</b> — Pennedly не переписывает и не генерирует его. Добавляется к посту <b>один раз</b> и при повторном росте не дублируется.');
  }

  /* ════════════════ DRAWER · КАК ПУБЛИКОВАТЬ ════════════════ */
  function modePicker(mode) {
    var ask = mode !== 'auto';
    return '<div class="sc-modepick">'
      + '<button class="sc-mode' + (ask ? ' sc-mode--on' : '') + '"><span class="mo-radio"></span><div class="mo-body">'
        + '<div class="mo-t">Спроси меня <span class="mo-default">по умолчанию</span></div>'
        + '<div class="mo-d">Pennedly кладёт комментарий-черновик в «Активность». Пока не подтвердишь — под постом ничего не появится.</div></div></button>'
      + '<button class="sc-mode sc-mode--auto' + (!ask ? ' sc-mode--on' : '') + '"><span class="mo-radio"></span><div class="mo-body">'
        + '<div class="mo-t">Добавлять автоматически</div>'
        + '<div class="mo-d">Комментарий появится под постом сам, без подтверждения. Включай, когда уверен в тексте и ссылке.</div></div></button>'
      + '</div>';
  }
  function howBody(mode) {
    return '<div class="rce-how">' + modePicker(mode)
      + why('Текст всегда один и тот же — но даже на «авто» ты можешь сперва обкатать его на «Спроси меня».') + '</div>';
  }

  /* ════════════════ ОБЩИЙ КОНФИГ-БЛОК — ИДЕНТИЧЕН В A / B / C ════════════════
     Те же три builder'а (metricPicker · commentField · modePicker), что стоят за
     слотами рецепта в точке входа A. В B/C показываем их прямой связкой. */
  function sharedConfig(cfg, opts) {
    opts = opts || {};
    var inner = '<div class="gc-cfg">'
      + '<div class="gc-cfg-group"><div class="gc-cfg-k">' + ic('trend', 12) + ' Когда добавить — метрика и порог</div>' + metricPicker(cfg) + '</div>'
      + '<div class="gc-cfg-group"><div class="gc-cfg-k">' + ic('megaphone', 12) + ' Текст комментария</div>' + commentField(cfg) + '</div>'
      + '<div class="gc-cfg-group"><div class="gc-cfg-k">' + ic('check', 12) + ' Как добавлять</div>' + modePicker(cfg.mode) + '</div>'
      + '</div>';
    if (opts.banner) {
      return '<div class="gc-cfg--shared"><div class="gc-cfg-banner">' + ic('sparkle', 12) + ' Тот же конфиг, что и в отдельном бустере — меняется только цель</div>' + inner + '</div>';
    }
    return inner;
  }

  /* ════════════════ DRAWER · УСЛОВИЯ «ТОЛЬКО ЕСЛИ» ════════════════ */
  function condRow(icoName, t, d, ctl) {
    return '<div class="cond-row"><span class="cr-ico">' + ic(icoName, 14) + '</span>'
      + '<div class="cr-body"><div class="cr-t">' + t + '</div>' + (d ? '<div class="cr-d">' + d + '</div>' : '') + '</div>'
      + (ctl ? '<div class="cr-ctl">' + ctl + '</div>' : '')
      + '<button class="cr-x" aria-label="убрать">' + ic('x', 14) + '</button></div>';
  }
  function ifBody(menuOpen) {
    var menu = '<div class="cond-menu">'
      + '<button class="cm-opt">' + ic('link', 15) + '<span class="cm-t">Только если в посте есть ссылка</span></button>'
      + '<button class="cm-opt">' + ic('hash', 15) + '<span class="cm-t">Только посты с словом / тегом</span></button>'
      + '<button class="cm-opt">' + ic('pencil', 15) + '<span class="cm-t">Только мои оригинальные посты</span></button>'
      + '<button class="cm-opt">' + ic('timer', 15) + '<span class="cm-t">Кулдаун между добавлениями</span></button>'
      + '<button class="cm-opt">' + ic('gauge', 15) + '<span class="cm-t">Лимит добавлений в день</span></button>'
      + '</div>';
    return '<div class="cond-list">'
      + condRow('gauge', 'Лимит в день', 'Не больше скольких добавлений за сутки.', step('5'))
      + condRow('pencil', 'Только оригинальные посты', 'Игнорировать репосты и цитаты.', '')
      + '</div>'
      + (menuOpen ? menu : '<button class="cond-add">' + ic('plus', 14) + ' Добавить условие</button>')
      + why('Условия — это <b>«только если…»</b>. Без них комментарий добавляется к любому посту, перешедшему порог.');
  }

  /* ════════════════ RECIPE CARD ════════════════ */
  function triggerSummary(cfg) {
    if (cfg.metric === 'any') return 'любой из порогов активности';
    var m = metricOf(cfg);
    return fmt(threshOf(cfg)) + '\u00A0' + m.word;
  }
  function recipeCard(cfg) {
    var open = cfg.openSlot;
    var sTarget = slot(targetSummary(cfg), open === 'target');
    var sTrigger = slot(triggerSummary(cfg), open === 'trigger');
    var sText = slot(quoteShort(commentText(cfg)), open === 'text');
    var sHow = slot(cfg.mode === 'auto' ? 'добавит сам' : 'покажет тебе перед добавлением', open === 'how');
    var prose = 'Бустер следит за ' + sTarget + '. Когда такой пост наберёт ' + sTrigger + ', Pennedly добавит к нему комментарий ' + sText + ' от моего имени на ' + who() + ', а готовый комментарий ' + sHow + '.';

    var tail = '<div class="recipe-tail">' + ic('repeat', 12) + '<span><b>Один раз на пост</b> · реактивно, проверка раз в ~15 мин · посты за ~48 ч</span></div>';

    var cond = cfg.ifSet
      ? '<div class="recipe-cond"><span class="rc-condlead">' + ic('sliders', 13) + ' Срабатывает только если</span> ' + slot('пост оригинальный и не чаще 5 раз в день', open === 'if') + '.</div>'
      : '<div class="recipe-cond"><button class="rc-slot rc-slot--add' + (open === 'if' ? ' is-open' : '') + '">' + ic('plus', 12) + 'Добавить условие «только если…»</button></div>';

    var dr = '';
    if (open === 'target') dr = drawer('Цель — за какими постами следить', 'target', goalBody(cfg));
    else if (open === 'trigger') dr = drawer('Когда сработает — метрика и порог', 'trend', metricBody(cfg));
    else if (open === 'text') dr = drawer('Текст комментария', 'megaphone', commentBody(cfg));
    else if (open === 'how') dr = drawer('Как добавлять', 'check', howBody(cfg.mode));
    else if (open === 'if') dr = drawer('Только если…', 'sliders', ifBody(cfg.condMenu));

    var showHint = (cfg.hint != null) ? cfg.hint : true;
    return '<div class="recipe recipe--v1"><div class="recipe-eyebrow">' + ic('sparkle', 12) + ' Что будет происходить'
      + '<span class="re-kind">' + ic('megaphone', 11) + ' Комментарий при росте</span></div>'
      + (showHint ? '<div class="recipe-hint">' + ic('pencil', 13) + '<span>Нажми на <b>подчёркнутые слова</b>, чтобы настроить сценарий</span></div>' : '')
      + '<p class="recipe-prose">' + prose + '</p>' + tail + cond + dr + '</div>';
  }

  /* ════════════════ LAYERS ════════════════ */
  function layer(title, pro, sum, body, openState) {
    return '<div class="rce-layer' + (openState ? ' is-open' : '') + '"><button class="rl-head"><span class="rl-chev">' + ic('chev', 16) + '</span>'
      + '<span class="rl-hd"><span class="rl-t">' + title + (pro ? ' <span class="rl-pro">для продвинутых</span>' : '') + '</span>'
      + (openState ? '' : '<span class="rl-sum">' + sum + '</span>') + '</span></button>'
      + (openState ? '<div class="rl-body">' + body + '</div>' : '') + '</div>';
  }
  function rlGroup(k, inner) { return '<div class="rl-group"><div class="rlg-k">' + k + '</div>' + inner + '</div>'; }
  function layer2Body(cfg) {
    return rlGroup('Условия — «только если…»', ifBody(false))
      + rlGroup('Окно наблюдения и проверка', '<div class="sc-fieldset" style="display:flex;flex-direction:column;gap:13px">'
        + '<div class="sc-field"><label>За какой срок смотреть посты</label>' + sel('Последние 48 часов', ['Последние 24 часа', 'Последние 48 часов', 'Последние 72 часа']) + '</div>'
        + '<div class="rc-inherit"><span class="ri-badge">' + ic('shieldhouse', 10) + ' из Правил дома</span> Частота проверки — раз в ~15 минут · <a href="#">открыть</a></div>'
        + hard('Частота проверки общая для всех реактивных сценариев — задаётся в «Правилах дома».')
        + '</div>');
  }
  function layer3Body() {
    return '<div class="rce-stub"><span class="rs-ico">' + ic('shieldhouse', 16) + '</span><div>'
      + '<div class="rs-t">Переопределить «Правила дома» только для этого сценария</div>'
      + '<div class="rs-d">Своя частота проверки, тихие часы и лимит добавлений — вместо общих. Сейчас всё наследуется; точечное переопределение появится во второй волне.</div>'
      + '<span class="rs-soon">' + ic('lock', 10) + ' скоро · второй волной</span></div></div>';
  }

  /* ════════════════ ASIDE · ЖИВОЙ ПРЕДПРОСМОТР ════════════════ */
  function mockpost() {
    var s = SR.SAMPLE.boost;
    return '<div class="mockpost"><div class="mockpost-top">' + av(C.initial) + '<div class="mockpost-who"><span class="mw-n">' + C.name + '</span><span class="mw-h">' + C.handle + '</span></div><span class="mockpost-time">3 ч назад</span></div>'
      + '<div class="mockpost-text">' + s.post + '</div>'
      + '<div class="mockpost-stats"><span class="ms">' + ic('eye', 13) + ' ' + s.stats[0] + '</span><span class="ms">' + ic('heart', 13) + ' ' + s.stats[1] + '</span><span class="ms">' + ic('bubble', 13) + ' ' + s.stats[2] + '</span></div></div>';
  }
  function selfThread(cfg) {
    var crossed = cfg.metric === 'any' ? 'пройден порог по просмотрам' : 'пройден порог: ' + triggerSummary(cfg);
    var tag = cfg.mode === 'auto' ? 'добавлено Pennedly' : 'черновик · ждёт тебя';
    return '<div class="mockreply gc-selfcomment"><div class="mr-k">' + ic('megaphone', 11) + ' так комментарий появится под твоим постом</div>'
      + '<div class="gc-crossed">' + ic('bolt', 12) + ' ' + crossed + ' → Pennedly добавил комментарий</div>'
      + '<div class="mr-bot">' + av(C.initial) + '<div class="mrb-body"><div class="mrb-who">' + C.name
        + ' <span class="mrb-tag mrb-tag--added">' + ic('megaphone', 11) + ' ' + tag + '</span></div>'
        + '<div class="mrb-text">' + commentRich(commentText(cfg)) + '</div></div></div></div>';
  }
  function aside(cfg) {
    var stage = '<div class="rce-stage"><div class="rce-stagebar"><span class="sb-dot"></span><span class="sb-t">Твой пост + комментарий · Threads</span><span class="sb-live">live</span></div>'
      + mockpost() + selfThread(cfg)
      + '<div class="rce-invoice">' + ic('megaphone', 13) + '<span>Комментарий — <b>твой заготовленный текст</b>, дословно. Pennedly его не переписывает.</span></div></div>';
    var runs = '<div class="rce-runs"><div class="rr-k">' + ic('repeat', 13) + ' Ритм проверки</div>'
      + '<div class="rr-list">'
      + '<div class="rr-item"><span class="rri-dot"></span><span class="rri-when">каждые ~15 мин</span><span class="rri-what">сверяет метрики постов за 48 ч</span></div>'
      + '<div class="rr-item"><span class="rri-dot"></span><span class="rri-when">по порогу</span><span class="rri-what">' + (cfg.mode === 'auto' ? 'добавляет комментарий под пост' : 'черновик комментария → в «Активность»') + '</span></div>'
      + '<div class="rr-item"><span class="rri-dot"></span><span class="rri-when">один раз</span><span class="rri-what">на каждый пост, без повторов</span></div>'
      + '</div></div>';
    return '<aside class="rce-aside"><div class="rce-stagecap">' + ic('eye', 13) + ' Превью · так это увидят люди</div>'
      + stage + runs
      + '<div class="rce-runnow"><button class="btn btn--secondary btn--sm">' + ic('play', 14) + ' Прогнать сейчас</button>'
      + '<span class="rn-note">Создаст комментарий-черновик к выбранному посту прямо сейчас — мимо порога, чтобы проверить текст. Никогда не публикует само.</span></div></aside>';
  }

  /* ════════════════ CHROME ════════════════ */
  function topbar(name) {
    return '<div class="ed-topbar"><button class="ed-back">' + ic('back', 16) + ' Мои рутины</button>'
      + '<div class="ed-titlerow"><div class="ed-titlewrap"><h1 class="ed-title">' + name + '</h1>'
      + '<button class="ed-edit" aria-label="переименовать">' + ic('pencil', 13) + '</button></div></div></div>';
  }
  function statusRow(cfg) {
    if (cfg.isNew) {
      return '<div class="rce-status"><span class="rce-next">' + ic('info', 14) + '<span>Черновик рутины — ещё не сохранён</span></span>'
        + '<span class="sc-bigstatus"><span class="bs-dot"></span>Выключен</span></div>';
    }
    return '<div class="rce-status"><span class="rce-next">' + ic('repeat', 14) + '<span>Сработает: <b>в течение ~15 мин после того, как пост перейдёт порог</b></span></span>'
      + '<span class="sc-bigstatus sc-bigstatus--on"><span class="bs-dot"></span>Активен</span></div>';
  }
  function foot(cfg) {
    return '<div class="rce-foot"><div class="sc-actionbar">'
      + '<button class="btn btn--secondary">Сохранить выключенным</button>'
      + '<button class="btn btn--primary">' + ic('check', 15) + ' ' + (cfg.isNew ? 'Сохранить и включить' : 'Сохранить') + '</button>'
      + '<span class="sa-spacer"></span>'
      + (cfg.isNew ? '' : '<button class="btn btn--ghost">' + ic('x', 15) + ' Удалить</button>') + '</div></div>';
  }

  /* ════════════════ ТОЧКИ ВХОДА B / C · ПРИЦЕП-ПАНЕЛЬ БУСТЕРА ════════════════
     Та же сущность, что и отдельный бустер (A). Цель здесь НЕ выбирается —
     она задана контекстом (этот пост / этот сценарий) и показана локнутой
     плашкой. Конфиг (sharedConfig) идентичен отдельному бустеру. */
  function targetChip(cfg) {
    var t = targetChipText(cfg);
    return '<span class="gc-target-chip">' + ic(t[0], 13) + '<span>' + t[1] + '<b>' + t[2] + '</b></span>'
      + '<span class="tc-lock" title="задано контекстом">' + ic('lock', 12) + '</span></span>';
  }
  function panelSummary(cfg) {
    return '\u041a\u043e\u0433\u0434\u0430 \u043d\u0430\u0431\u0435\u0440\u0451\u0442 <b>' + triggerSummary(cfg) + '</b> \u2192 \u0434\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u043a\u043e\u043c\u043c\u0435\u043d\u0442\u0430\u0440\u0438\u0439 ' + quoteShort(commentText(cfg), 30)
      + ' \u00b7 ' + (cfg.mode === 'auto' ? '\u0410\u0432\u0442\u043e\u043c\u0430\u0442\u0438\u0447\u0435\u0441\u043a\u0438' : '\u0421\u043f\u0440\u043e\u0441\u0438 \u043c\u0435\u043d\u044f');
  }
  function boosterPanel(cfg, o) {
    o = o || {};
    var on = cfg.boosterOn !== false;
    var open = !!o.open;
    var sw = '<span class="switch" role="switch" aria-checked="' + on + '"><input type="checkbox"' + (on ? ' checked' : '') + ' aria-label="\u0412\u043a\u043b\u044e\u0447\u0438\u0442\u044c \u0431\u0443\u0441\u0442\u0435\u0440"><span class="track"></span><span class="knob"></span></span>';
    var head = '<div class="gcp-head"><span class="gcph-ico">' + ic('megaphone', 16) + '</span>'
      + '<span class="gcph-tt"><span class="gcph-t">' + o.title + ' <span class="gcph-new">\u041d\u041e\u0412\u041e\u0415</span></span>'
      + (open ? '<span class="gcph-sum">' + o.sub + '</span>' : '<span class="gcph-sum">' + panelSummary(cfg) + '</span>') + '</span>'
      + '<span class="gcph-right">' + sw + '<span class="gcph-chev">' + ic('chev', 16) + '</span></span></div>';
    var body = '';
    if (open) {
      body = '<div class="gcp-body' + (on ? '' : ' gcp-body--off') + '">'
        + '<p class="gcp-phrase">' + o.phrase + '</p>'
        + targetChip(cfg)
        + sharedConfig(cfg, { banner: true })
        + hard('\u0420\u0435\u0430\u043a\u0442\u0438\u0432\u043d\u043e: \u043f\u0440\u043e\u0432\u0435\u0440\u043a\u0430 \u0440\u0430\u0437 \u0432 ~15 \u043c\u0438\u043d, \u043d\u0435 \u043c\u0433\u043d\u043e\u0432\u0435\u043d\u043d\u043e \u00b7 \u0434\u043e\u0431\u0430\u0432\u043b\u044f\u0435\u0442\u0441\u044f <b>\u043e\u0434\u0438\u043d \u0440\u0430\u0437</b> \u00b7 \u043f\u043e\u0434 \u043d\u0430\u0431\u043b\u044e\u0434\u0435\u043d\u0438\u0435\u043c \u043f\u043e\u0441\u0442\u044b \u0437\u0430 ~48 \u0447.')
        + '</div>';
    }
    return '<div class="gc-panel' + (on ? ' gc-panel--on' : '') + (open ? ' is-open' : '') + ' gc-attach">' + head + body + '</div>';
  }

  /* ════════════════ ТОЧКА ВХОДА B · СТУДИЯ ════════════════ */
  function studioComposer(cfg) {
    var s = SR.SAMPLE.boost;
    var pill = cfg.plan === 'schedule' ? '\u0417\u0430\u043f\u043b\u0430\u043d\u0438\u0440\u043e\u0432\u0430\u043d \u00b7 \u0437\u0430\u0432\u0442\u0440\u0430 9:00' : '\u0427\u0435\u0440\u043d\u043e\u0432\u0438\u043a';
    return '<div class="gc-composer"><div class="gcc-top">' + av(C.initial, 36)
      + '<div class="gcc-who"><span class="gw-n">' + C.name + '</span><span class="gw-h">' + C.handle + '</span></div>'
      + '<span class="gcc-pill">' + pill + '</span></div>'
      + '<div class="gcc-body">' + s.post + '</div>'
      + '<div class="gcc-toolbar"><span class="gcc-cc">169 / 500</span><span class="tb-spacer"></span>'
      + '<button class="btn btn--secondary btn--sm">\u0417\u0430\u043f\u043b\u0430\u043d\u0438\u0440\u043e\u0432\u0430\u0442\u044c</button>'
      + '<button class="btn btn--primary btn--sm">' + ic('check', 14) + ' \u041e\u043f\u0443\u0431\u043b\u0438\u043a\u043e\u0432\u0430\u0442\u044c</button></div></div>';
  }
  function buildStudio(cfg) {
    var pcfg = Object.assign({}, cfg, { target: 'post' });
    var panel = boosterPanel(pcfg, {
      open: cfg.boosterOpen !== false,
      title: '\u0411\u0443\u0441\u0442\u0435\u0440 \u0434\u043b\u044f \u044d\u0442\u043e\u0433\u043e \u043f\u043e\u0441\u0442\u0430',
      sub: '\u0426\u0435\u043b\u044c \u0437\u0430\u0434\u0430\u043d\u0430: \u0431\u0443\u0441\u0442\u0435\u0440 \u0436\u0434\u0451\u0442 \u043f\u043e\u0440\u043e\u0433 \u0438\u043c\u0435\u043d\u043d\u043e \u044d\u0442\u043e\u0433\u043e \u043f\u043e\u0441\u0442\u0430',
      phrase: '\u041a\u043e\u0433\u0434\u0430 <b>\u044d\u0442\u043e\u0442 \u043f\u043e\u0441\u0442</b> \u043d\u0430\u0431\u0435\u0440\u0451\u0442 \u043f\u043e\u0440\u043e\u0433 \u2014 Pennedly \u0434\u043e\u0431\u0430\u0432\u0438\u0442 \u043a \u043d\u0435\u043c\u0443 \u0437\u0430\u0433\u043e\u0442\u043e\u0432\u043b\u0435\u043d\u043d\u044b\u0439 \u043a\u043e\u043c\u043c\u0435\u043d\u0442\u0430\u0440\u0438\u0439. \u041e\u0434\u0438\u043d \u0440\u0430\u0437.'
    });
    var left = '<div class="rce-main"><div class="rce-status"><span class="rce-next">' + ic('pencildoc', 14) + '<span>\u0421\u0442\u0443\u0434\u0438\u044f \u00b7 \u043f\u0443\u0431\u043b\u0438\u043a\u0430\u0446\u0438\u044f \u043f\u043e\u0441\u0442\u0430</span></span></div>'
      + studioComposer(pcfg) + panel + '</div>';
    return '<div class="rce">' + studioTopbar() + '<div class="rce-grid">' + left + asideCompact(pcfg) + '</div>' + (cfg.modal ? commentModal(pcfg) : '') + '</div>';
  }
  function studioTopbar() {
    return '<div class="ed-topbar"><button class="ed-back">' + ic('back', 16) + ' \u0421\u0442\u0443\u0434\u0438\u044f</button>'
      + '<div class="ed-titlerow"><div class="ed-titlewrap"><h1 class="ed-title">\u041d\u043e\u0432\u044b\u0439 \u043f\u043e\u0441\u0442</h1></div></div></div>';
  }

  /* ════════════════ ТОЧКА ВХОДА C · РЕДАКТОР СЦЕНАРИЯ-ПОСТА ════════════════ */
  function scenarioSteps(cfg) {
    var rows = [
      ['1', '\u041e \u0447\u0451\u043c \u043f\u043e\u0441\u0442', '\u041a\u043e\u0440\u043e\u0442\u043a\u0438\u0439 \u0432\u043e\u043f\u0440\u043e\u0441 \u00b7 \u043e \u0444\u043e\u043a\u0443\u0441\u0435 \u0438 \u0434\u0435\u043b\u0430\u0445', true],
      ['2', '\u041a\u043e\u0433\u0434\u0430 \u043f\u0443\u0431\u043b\u0438\u043a\u043e\u0432\u0430\u0442\u044c', '\u041a\u0430\u0436\u0434\u043e\u0435 \u0443\u0442\u0440\u043e \u0432 9:00', true],
      ['3', '\u041a\u0430\u043a \u043f\u0443\u0431\u043b\u0438\u043a\u043e\u0432\u0430\u0442\u044c', '\u0421\u043f\u0440\u043e\u0441\u0438 \u043c\u0435\u043d\u044f \u043f\u0435\u0440\u0435\u0434 \u043f\u0443\u0431\u043b\u0438\u043a\u0430\u0446\u0438\u0435\u0439', true]
    ].map(function (r) {
      return '<div class="gc-steprow"><span class="gsr-n">' + r[0] + '</span><div class="gsr-b"><div class="gsr-t">' + r[1] + '</div><div class="gsr-v">' + r[2] + '</div></div>'
        + (r[3] ? '<span class="gsr-done">' + ic('check', 16) + '</span>' : '') + '</div>';
    }).join('');
    return '<div class="gc-steps">' + rows + '</div>';
  }
  function buildScenario(cfg) {
    var pcfg = Object.assign({}, cfg, { target: 'scenario', scenario: cfg.scenario || SAMPLE_SCENARIO });
    var panel = boosterPanel(pcfg, {
      open: cfg.boosterOpen !== false,
      title: '\u0411\u0443\u0441\u0442\u0435\u0440',
      sub: '\u0426\u0435\u043b\u044c \u0437\u0430\u0434\u0430\u043d\u0430: \u043f\u043e\u0441\u0442\u044b \u044d\u0442\u043e\u0433\u043e \u0441\u0446\u0435\u043d\u0430\u0440\u0438\u044f',
      phrase: '\u0414\u043b\u044f <b>\u043f\u043e\u0441\u0442\u043e\u0432 \u044d\u0442\u043e\u0433\u043e \u0441\u0446\u0435\u043d\u0430\u0440\u0438\u044f</b>: \u043a\u043e\u0433\u0434\u0430 \u043d\u0430\u0431\u0435\u0440\u0443\u0442 \u043f\u043e\u0440\u043e\u0433 \u2014 \u0434\u043e\u0431\u0430\u0432\u044c \u0437\u0430\u0433\u043e\u0442\u043e\u0432\u043b\u0435\u043d\u043d\u044b\u0439 \u043a\u043e\u043c\u043c\u0435\u043d\u0442\u0430\u0440\u0438\u0439. \u041e\u0434\u0438\u043d \u0440\u0430\u0437 \u043d\u0430 \u043a\u0430\u0436\u0434\u044b\u0439 \u043f\u043e\u0441\u0442.'
    });
    var left = '<div class="rce-main">'
      + '<div class="rce-status"><span class="rce-next">' + ic('repeat', 14) + '<span>\u0421\u0446\u0435\u043d\u0430\u0440\u0438\u0439-\u043f\u043e\u0441\u0442 \u00b7 \u043f\u0443\u0431\u043b\u0438\u043a\u0443\u0435\u0442 \u043a\u0430\u0436\u0434\u043e\u0435 \u0443\u0442\u0440\u043e</span></span>'
      + '<span class="sc-bigstatus sc-bigstatus--on"><span class="bs-dot"></span>\u0410\u043a\u0442\u0438\u0432\u0435\u043d</span></div>'
      + scenarioSteps(pcfg) + panel + foot({ isNew: false }) + '</div>';
    return '<div class="rce sced">' + scenarioTopbar(pcfg) + '<div class="rce-grid">' + left + asideCompact(pcfg) + '</div>' + (cfg.modal ? commentModal(pcfg) : '') + '</div>';
  }
  function scenarioTopbar(cfg) {
    return '<div class="ed-topbar"><button class="ed-back">' + ic('back', 16) + ' \u041c\u043e\u0438 \u0440\u0443\u0442\u0438\u043d\u044b</button>'
      + '<div class="ed-titlerow"><div class="ed-titlewrap"><h1 class="ed-title">' + scenarioOf(cfg) + '</h1>'
      + '<button class="ed-edit" aria-label="\u043f\u0435\u0440\u0435\u0438\u043c\u0435\u043d\u043e\u0432\u0430\u0442\u044c">' + ic('pencil', 13) + '</button></div>'
      + '<span class="ed-kind">' + ic('repeat', 13) + ' \u0421\u0446\u0435\u043d\u0430\u0440\u0438\u0439-\u043f\u043e\u0441\u0442</span></div></div>';
  }

  /* компактный предпросмотр для B/C — без блока «Прогнать сейчас», уже встроено */
  function asideCompact(cfg) {
    var stage = '<div class="rce-stage"><div class="rce-stagebar"><span class="sb-dot"></span><span class="sb-t">\u0422\u0432\u043e\u0439 \u043f\u043e\u0441\u0442 + \u043a\u043e\u043c\u043c\u0435\u043d\u0442\u0430\u0440\u0438\u0439 \u00b7 Threads</span><span class="sb-live">live</span></div>'
      + mockpost() + selfThread(cfg)
      + '<div class="rce-invoice">' + ic('megaphone', 13) + '<span>\u041a\u043e\u043c\u043c\u0435\u043d\u0442\u0430\u0440\u0438\u0439 \u2014 <b>\u0442\u0432\u043e\u0439 \u0437\u0430\u0433\u043e\u0442\u043e\u0432\u043b\u0435\u043d\u043d\u044b\u0439 \u0442\u0435\u043a\u0441\u0442</b>, \u0434\u043e\u0441\u043b\u043e\u0432\u043d\u043e.</span></div></div>';
    return '<aside class="rce-aside"><div class="rce-stagecap">' + ic('eye', 13) + ' \u041f\u0440\u0435\u0432\u044c\u044e \u00b7 \u0442\u0430\u043a \u044d\u0442\u043e \u0443\u0432\u0438\u0434\u044f\u0442 \u043b\u044e\u0434\u0438</div>' + stage + '</aside>';
  }

  /* ════════════════ BUILD ════════════════ */
  function buildGC(cfg) {
    cfg = cfg || {};
    var name = cfg.name || 'Ссылка под залетевшим постом';
    var left = '<div class="rce-main">'
      + statusRow(cfg)
      + recipeCard(cfg)
      + '<div class="rce-layers">'
        + layer('Настроить точнее', false, 'Условия · окно наблюдения · частота проверки', layer2Body(cfg), cfg.layer2)
        + layer('Только для этого сценария', true, 'Переопределить «Правила дома» здесь', layer3Body(), cfg.layer3)
        + '</div>'
      + foot(cfg) + '</div>';
    return '<div class="rce">' + topbar(name) + '<div class="rce-grid">' + left + aside(cfg) + '</div>' + (cfg.modal ? commentModal(cfg) : '') + '</div>';
  }

  window.GrowthComment = { build: buildGC, studio: buildStudio, scenario: buildScenario, card: recipeCard, panel: boosterPanel, ic: ic };

  /* ── auto-mount ── */
  function mountAll() {
    var hosts = document.querySelectorAll('[data-gc]');
    for (var i = 0; i < hosts.length; i++) {
      var el = hosts[i], cfg = {};
      try { cfg = JSON.parse(el.getAttribute('data-gc') || '{}'); } catch (e) { cfg = {}; }
      var builder = cfg.entry === 'studio' ? buildStudio : cfg.entry === 'scenario' ? buildScenario : buildGC;
      el.innerHTML = frame(builder(cfg), cfg.dark);
    }
    var cards = document.querySelectorAll('[data-gc-card]');
    for (var j = 0; j < cards.length; j++) {
      var ce = cards[j], ccfg = {};
      try { ccfg = JSON.parse(ce.getAttribute('data-gc-card') || '{}'); } catch (e2) { ccfg = {}; }
      ce.innerHTML = '<div class="frame' + (ccfg.dark ? ' dark' : '') + '" style="padding:20px">' + recipeCard(ccfg) + '</div>';
    }
    var panels = document.querySelectorAll('[data-gc-panel]');
    for (var p = 0; p < panels.length; p++) {
      var pe = panels[p], pcfg = {};
      try { pcfg = JSON.parse(pe.getAttribute('data-gc-panel') || '{}'); } catch (e3) { pcfg = {}; }
      var po = { open: pcfg.open !== false, title: pcfg.title || 'Бустер', sub: pcfg.sub || '', phrase: pcfg.phrase || '' };
      pe.innerHTML = '<div class="frame' + (pcfg.dark ? ' dark' : '') + '" style="padding:20px">' + boosterPanel(pcfg, po) + '</div>';
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountAll); else mountAll();
})();
