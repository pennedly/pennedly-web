/* mention-routines-build.js — общий рендер «Рутин упоминаний» для обоих спеков
   (desktop + mobile), чтобы не было расхождений. Строит хаб (карточки в стиле
   рутин постинга) и конструктор (карточка-рецепт). Максимально переиспользует
   готовые классы: .recipe/.rc-slot/.rc-drawer/.bigtext (recipe-editor.css),
   .rt-mode/.sc-mode/.pm-* (autopilot-publishmode.css), .sc-card
   (scenarios-redesign.css), .rce-stub (Layer-3). Своё — только поле цели,
   гарантия движка, выбор действия «Скоро» (mention-routines.css).

   Экспортирует window.MR. Автомонтирует [data-mr] и [data-mr-card]. */
(function () {
  "use strict";

  var OWNER = { name: "Алекс", handle: "@alex.makes", initial: "А" };

  /* ------------------------------- иконки -------------------------------- */
  function ic(n, s) {
    s = s || 14;
    var v = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
    var G = {
      at: '<circle cx="12" cy="12" r="4"/><path d="M16 12v1.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-3.5 7.1"/>',
      bubble: '<path d="M21 12a8 8 0 0 1-11.5 7.2L4 20l1-5A8 8 0 1 1 21 12Z"/>',
      bubbleq: '<path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2Z"/><path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"/>',
      image: '<rect x="3" y="4.5" width="18" height="15" rx="2.5"/><circle cx="8.5" cy="10" r="1.8"/><path d="M21 16l-5-5L5 19"/>',
      sparkle: '<path d="M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3Z"/>',
      wand: '<path d="M15 4V2M15 10V8M12.5 6.5H10.5M19.5 6.5h-2M6 20l10-10-2-2L4 18l2 2Z"/>',
      eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
      bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/>',
      shield: '<path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3Z"/>',
      shieldcheck: '<path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3Z"/><path d="M9 12l2 2 4-4"/>',
      lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
      check: '<path d="M20 7 9 18l-5-5"/>',
      chev: '<path d="M9 6l6 6-6 6"/>',
      back: '<path d="M15 18l-6-6 6-6"/>',
      pencil: '<path d="M4 20h4L19 9a2 2 0 0 0-3-3L5 17v3Z"/><path d="M14.5 6.5 17.5 9.5"/>',
      plus: '<path d="M12 5v14M5 12h14"/>',
      info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.5v.5"/>',
      sliders: '<path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h7M15 18h5"/><circle cx="16" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="13" cy="18" r="2"/>',
      shieldhouse: '<path d="M4 11l8-6 8 6v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z"/><path d="M9.5 20v-5h5v5"/>',
      route: '<circle cx="6" cy="19" r="2.5"/><circle cx="18" cy="5" r="2.5"/><path d="M8.5 19H15a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h6.5"/>',
      x: '<path d="M6 6l12 12M18 6 6 18"/>',
      inbox: '<path d="M3 12h5l2 3h4l2-3h5"/><path d="M4.5 6.5 3 12v6a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-6l-1.5-5.5A1 1 0 0 0 18 6H6a1 1 0 0 0-1 .5Z"/>'
    };
    return '<svg width="' + s + '" height="' + s + '" ' + v + '>' + (G[n] || '') + '</svg>';
  }
  function set(id, html) { var e = document.getElementById(id); if (e) e.innerHTML = html; }
  function frame(inner, dark) { return '<div class="frame' + (dark ? ' dark' : '') + '">' + inner + '</div>'; }
  function sw(on) { return '<label class="switch"><input type="checkbox"' + (on ? ' checked' : '') + ' aria-label="toggle"><span class="track"></span><span class="knob"></span></label>'; }
  function av(initials, sz) { sz = sz || 32; return '<span style="width:' + sz + 'px;height:' + sz + 'px;display:inline-grid;place-items:center;border-radius:9999px;background:var(--color-surface-2);border:1px solid var(--color-border);font-size:' + Math.round(sz * 0.38) + 'px;font-weight:600;color:var(--color-text-muted);flex:0 0 auto">' + initials + '</span>'; }
  function who() { return '<span class="who">' + OWNER.handle + '</span>'; }

  /* --------- слоты рецепта (переиспускаем классы recipe-editor.css) -------- */
  function slot(txt, open) { return '<span class="rc-slot' + (open ? ' is-open' : '') + '" role="button" tabindex="0">' + txt + '</span>'; }
  function lockPhrase(txt) { return '<span class="rc-slot--lock">' + ic('at', 11) + txt + '</span>'; }
  function drawer(title, icoName, body) {
    return '<div class="rc-drawer"><div class="rcd-head"><span class="rcdh-ico">' + ic(icoName, 15) + '</span>'
      + '<span class="rcdh-t">' + title + '</span>'
      + '<button class="rcdh-done">' + ic('check', 14) + ' Готово</button></div>'
      + '<div class="rcd-body">' + body + '</div></div>';
  }
  function why(html) { return '<div class="rc-why">' + ic('info', 13) + '<span>' + html + '</span></div>'; }

  /* гарантия движка — успокаивающая (НЕ warning): на что бот НЕ полезет сам */
  function guard() {
    return '<div class="mr-guard"><span class="mg-ico">' + ic('shieldcheck', 18) + '</span><div>'
      + '<div class="mg-t">Отвечает сам только на безопасное</div>'
      + '<div class="mg-d">Даже с широкой целью Pennedly сам отвечает только на <b>вопрос, похвалу и нейтральное</b>. Жалобы, лиды, провокации и конкурентов он не трогает — они ждут вас в очереди «Требуют вас».</div></div></div>';
  }

  /* ════════════════ ДРАВЕРЫ КОНСТРУКТОРА ════════════════ */
  var GOAL_PH = 'Например: прислали фото двух людей и просят показать их будущего ребёнка. Или: спрашивают про мой марафон и хотят записаться.';

  function goalDrawer(cfg) {
    var catchall = !!cfg.catchall;
    var val = catchall ? '' : (cfg.goalText || '');
    var count = val.length;
    return drawer('Цель упоминания', 'sparkle',
      '<div class="mr-goalfield' + (catchall ? ' is-off' : '') + '">'
        + '<textarea class="mr-goal-area" maxlength="500" placeholder="' + GOAL_PH + '">' + val + '</textarea>'
        + '<div class="mr-goal-foot"><span class="mr-goal-hint">' + ic('sparkle', 12) + 'Pennedly сам поймёт, какие упоминания под это подходят</span>'
        + '<span class="mr-goal-count">' + count + ' / 500</span></div></div>'
      + '<button class="mr-catchall' + (catchall ? ' is-on' : '') + '"><span class="mc-box">' + ic('check', 13) + '</span>'
        + '<span><span class="mc-t">Отвечать на любые безопасные упоминания</span>'
        + '<span class="mc-d">Цель не задаётся — это рутина по умолчанию. Ловит всё безопасное, что не подошло под другие рутины.</span></span></button>'
      + guard());
  }

  function mediaSeg(mode) {
    var M = [['any', 'Неважно'], ['image', 'Только с фото'], ['none', 'Только текст']];
    return '<div class="seg" role="tablist" aria-label="Вложение">'
      + M.map(function (x) { return '<button class="seg-opt' + (x[0] === mode ? ' seg-opt--active' : '') + '" role="tab">' + x[1] + '</button>'; }).join('') + '</div>';
  }
  function mediaDrawer(cfg) {
    return drawer('Вложение', 'image', mediaSeg(cfg.media || 'any')
      + why('Условие к вложению упоминания. <b>«Только с фото»</b> — рутина возьмётся, лишь если к упоминанию приложена картинка; иначе оно останется другим рутинам или в очереди.'));
  }

  /* действие: «в моём голосе» (реально) + «сгенерированным фото» (Скоро, locked) */
  function actionDrawer(cfg) {
    var voice = cfg.action !== 'image';
    var body = '<div class="mr-actions">'
      + '<button class="mr-action' + (voice ? ' mr-action--on' : '') + '"><span class="ma-radio"></span>'
        + '<span class="ma-ico">' + ic('bubble', 17) + '</span>'
        + '<span class="ma-body"><span class="ma-t">Ответить в моём голосе</span>'
        + '<span class="ma-d">Текстовый ответ в вашем голосе на основе профиля. Работает уже сегодня.</span></span></button>'
      + '<div class="mr-action mr-action--soon" aria-disabled="true"><span class="ma-radio"></span>'
        + '<span class="ma-ico">' + ic('wand', 17) + '</span>'
        + '<span class="ma-body"><span class="ma-t">Ответить сгенерированным фото <span class="mr-soonpill">' + ic('lock', 10) + ' Скоро</span></span>'
        + '<span class="ma-d">Pennedly пришлёт в ответ сгенерированное изображение (кейс «фото будущего ребёнка»). Требование «с фото» и матч по цели работают уже сейчас — само действие появится во второй волне.</span></span></div>'
      + '</div>'
      + '<div class="sc-field" style="margin-top:15px"><label>Как отвечать <span class="sc-opt">· необязательно</span></label>'
        + bigInst(cfg.inst) + '</div>';
    return drawer('Что сделать в ответ', 'wand', body);
  }
  function bigInst(val) {
    var v = val || '';
    return '<div class="bigtext"><div class="bigtext-val' + (v ? '' : ' is-empty') + '">' + (v || 'Нажми, чтобы добавить подсказку…') + '</div>'
      + '<div class="bigtext-foot"><span class="bt-hint">Слой поверх голоса · базовые правила Pennedly применит сам</span>'
      + '<button class="bigtext-expand">' + ic('pencil', 13) + ' Открыть в отдельном окне</button></div></div>';
  }

  /* режим — переиспользуем .sc-mode из autopilot-publishmode / scenarios-redesign */
  function modeDrawer(cfg) {
    var ask = cfg.mode !== 'auto';
    var body = '<div class="sc-modepick">'
      + '<button class="sc-mode' + (ask ? ' sc-mode--on' : '') + '"><span class="mo-radio"></span><div class="mo-body">'
        + '<div class="mo-t">' + ic('eye', 15) + ' Спроси меня <span class="mo-default">по умолчанию</span></div>'
        + '<div class="mo-d">Pennedly готовит черновик ответа и кладёт его в очередь. Пока ты не подтвердишь — ничего не уходит.</div></div></button>'
      + '<button class="sc-mode sc-mode--auto' + (!ask ? ' sc-mode--on' : '') + '"><span class="mo-radio"></span><div class="mo-body">'
        + '<div class="mo-t">' + ic('bolt', 15) + ' Отвечает сразу</div>'
        + '<div class="mo-d">Ответ уходит человеку сразу, без ревью. Только на безопасные упоминания — жалобы и лиды всё равно ждут вас в очереди.</div></div></button>'
      + '</div>';
    return drawer('Как публиковать ответ', 'check', body);
  }

  /* ════════════════ КАРТОЧКА-РЕЦЕПТ ════════════════ */
  function recipeCard(cfg) {
    var open = cfg.openSlot;
    var catchall = !!cfg.catchall;
    var media = cfg.media || 'any';
    // фраза-рецепт: триггер зафиксирован, слоты — медиа / цель / режим / действие
    var mediaTxt = media === 'image' ? 'с фото' : (media === 'none' ? 'только текстом' : 'с чем угодно');
    var goalTxt = catchall ? 'по любой безопасной причине' : (cfg.goalShort || 'просят показать их будущего ребёнка');
    var modeTxt = cfg.mode === 'auto' ? 'ответит сам, сразу' : 'покажет вам черновик ответа';
    var actionTxt = cfg.action === 'image' ? 'сгенерированным фото' : 'в вашем голосе';

    var sMedia = media === 'any' ? slot(mediaTxt, open === 'media') : slot(mediaTxt, open === 'media');
    var sGoal = slot(goalTxt, open === 'goal');
    var sMode = slot(modeTxt, open === 'mode');
    var sAction = slot(actionTxt, open === 'action');

    var mediaClause = ' ' + sMedia;
    var goalClause = catchall ? ' ' + sGoal : ' и ' + sGoal;
    var prose = 'Когда ' + lockPhrase('меня упоминают') + mediaClause + goalClause
      + ', Pennedly ' + sMode + ' ' + sAction + '.';

    var dr = '';
    if (open === 'goal') dr = goalDrawer(cfg);
    else if (open === 'media') dr = mediaDrawer(cfg);
    else if (open === 'action') dr = actionDrawer(cfg);
    else if (open === 'mode') dr = modeDrawer(cfg);

    var showHint = cfg.hint !== false;
    return '<div class="recipe recipe--v9"><div class="recipe-eyebrow">' + ic('sparkle', 12) + ' Что будет происходить'
      + '<span class="re-kind">' + ic('at', 11) + ' Упоминание</span></div>'
      + (showHint ? '<div class="recipe-hint">' + ic('pencil', 13) + '<span>Нажми на <b>подчёркнутые слова</b>, чтобы собрать рутину</span></div>' : '')
      + '<p class="recipe-prose">' + prose + '</p>'
      + '<div class="recipe-cond"><span class="rc-condlead">' + ic('route', 13) + ' Одно упоминание</span> уходит максимум в одну рутину — Pennedly выберет подходящую по цели.</div>'
      + dr + '</div>';
  }

  /* ════════════════ СЛОИ ГЛУБИНЫ (2 · 3) ════════════════ */
  function layer(title, pro, sum, body, openState) {
    return '<div class="rce-layer' + (openState ? ' is-open' : '') + '"><button class="rl-head"><span class="rl-chev">' + ic('chev', 16) + '</span>'
      + '<span class="rl-hd"><span class="rl-t">' + title + (pro ? ' <span class="rl-pro">для продвинутых</span>' : '') + '</span>'
      + (openState ? '' : '<span class="rl-sum">' + sum + '</span>') + '</span></button>'
      + (openState ? '<div class="rl-body">' + body + '</div>' : '') + '</div>';
  }
  function rlGroup(k, inner) { return '<div class="rl-group"><div class="rlg-k">' + k + '</div>' + inner + '</div>'; }
  function layer2Body(cfg) {
    return rlGroup('Вложение', '<div class="sc-fieldset">' + mediaSeg(cfg.media || 'any')
        + why('Требование к вложению упоминания.') + '</div>')
      + rlGroup('Как отвечать — подсказка в вашем голосе', '<div class="sc-fieldset">' + bigInst(cfg.inst) + '</div>');
  }
  function layer3Body() {
    return '<div class="rce-stub"><span class="rs-ico">' + ic('shieldhouse', 16) + '</span><div>'
      + '<div class="rs-t">Переопределить «Правила дома» только для этой рутины</div>'
      + '<div class="rs-d">Своя аудитория, лимит ответов на упоминания, частота и тихие часы — вместо общих. Сейчас всё наследуется из «Правил дома»; точечное переопределение приедет второй волной.</div>'
      + '<span class="rs-soon">' + ic('lock', 10) + ' скоро · второй волной</span></div></div>';
  }

  /* ════════════════ АСАЙД · живое превью упоминания + «как это работает» ════ */
  function mentionThread(cfg) {
    var withPhoto = (cfg.media === 'image') || cfg.threadPhoto;
    var auto = cfg.mode === 'auto';
    var attach = withPhoto ? '<div class="mr-attach"><span class="at-thumb">' + ic('image', 20) + '</span>'
      + '<span class="at-cap"><b>Фото от автора упоминания</b><br>2 человека · приложено к посту</span></div>' : '';
    var parentText = withPhoto
      ? '<span class="who">' + OWNER.handle + '</span> обожаю твои работы! сможешь показать, каким получится наш будущий малыш? прикладываю нас с мужем 🙌'
      : '<span class="who">' + OWNER.handle + '</span> расскажи, когда стартует ближайший марафон и как на него попасть?';
    var botText = withPhoto
      ? 'Катя, спасибо, что отметили — фото чудесное. Забираю в работу и пришлю вариант в своём стиле в течение дня. Договорились?'
      : 'Марина, ближайший поток стартует 1 июля. Запись открыта по ссылке в профиле — забронируйте место, группа небольшая. Что хотите прокачать на нём в первую очередь?';
    var botTag = auto
      ? '<span class="mrb-tag" style="color:var(--color-warning)">' + ic('bolt', 11) + ' ответил сам</span>'
      : '<span class="mrb-tag">' + ic('eye', 11) + ' черновик · ждёт вас</span>';
    var parent = '<div class="mockpost" style="border-bottom:1px solid var(--color-border)"><div class="mockpost-top">' + av('К') + '<div class="mockpost-who"><span class="mw-n">Катя</span><span class="mw-h">@katya.p</span></div><span class="mockpost-time">12 мин</span></div>'
      + '<div class="mockpost-text">' + parentText + '</div>' + attach + '</div>';
    var reply = '<div class="mockreply"><div class="mr-k">так Pennedly ответит на упоминание</div>'
      + '<div class="mr-bot">' + av(OWNER.initial) + '<div class="mrb-body"><div class="mrb-who">' + OWNER.name + ' ' + botTag + '</div><div class="mrb-text">' + botText + '</div></div></div></div>';
    return '<div class="rce-stage"><div class="rce-stagebar"><span class="sb-dot"></span><span class="sb-t">Упоминание · Threads</span><span class="sb-live">live</span></div>'
      + parent + reply
      + '<div class="rce-invoice">' + ic('sparkle', 13) + '<span>В вашем голосе · на основе профиля и ветки. Pennedly не выдумывает за вас.</span></div></div>';
  }
  function howBlock() {
    return '<div class="mr-how"><div class="mh-k">' + ic('route', 13) + ' Как Pennedly решает</div>'
      + '<div class="mr-how-step"><span class="hs-n">1</span><span class="hs-t">Пришло упоминание — движок <b>один раз</b> читает его и вложение.</span></div>'
      + '<div class="mr-how-step"><span class="hs-n">2</span><span class="hs-t">Подбирает <b>одну</b> подходящую рутину по цели. Не подошло ни одной — берёт рутину по умолчанию.</span></div>'
      + '<div class="mr-how-step"><span class="hs-n">3</span><span class="hs-t">Опасное (жалоба, лид, провокация, спам) <b>не трогает</b> — оставляет вам в очереди.</span></div></div>';
  }
  function aside(cfg) {
    return '<aside class="rce-aside"><div class="rce-stagecap">' + ic('eye', 13) + ' Живой предпросмотр</div>'
      + mentionThread(cfg) + howBlock()
      + '<div class="rce-runnow"><span class="rn-note">Готовый ответ уходит по вашему режиму. Опасные упоминания рутина никогда не публикует сама.</span></div></aside>';
  }

  /* ════════════════ ХРОМ КОНСТРУКТОРА ════════════════ */
  function topbar(name) {
    return '<div class="ed-topbar"><button class="ed-back">' + ic('back', 16) + ' Рутины упоминаний</button>'
      + '<div class="ed-titlerow"><div class="ed-titlewrap"><h1 class="ed-title">' + name + '</h1>'
      + '<button class="ed-edit" aria-label="переименовать">' + ic('pencil', 13) + '</button></div></div>'
      + '<div class="ed-kindrow"><span class="ed-kind">' + ic('at', 13) + ' рутина упоминаний</span></div></div>';
  }
  function statusRow(cfg) {
    if (cfg.isNew) {
      return '<div class="rce-status"><span class="rce-next">' + ic('info', 14) + '<span>Черновик рутины — ещё не сохранён</span></span>'
        + '<span class="sc-bigstatus"><span class="bs-dot"></span>Выключен</span></div>';
    }
    return '<div class="rce-status"><span class="rce-next">' + ic('at', 14) + '<span>Сработает при следующем подходящем упоминании</span></span>'
      + '<span class="sc-bigstatus sc-bigstatus--on"><span class="bs-dot"></span>Активна</span></div>';
  }
  function foot(cfg) {
    return '<div class="rce-foot"><div class="sc-actionbar">'
      + '<button class="btn btn--secondary">Сохранить выключенной</button>'
      + '<button class="btn btn--primary">' + ic('check', 15) + ' ' + (cfg.isNew ? 'Сохранить и включить' : 'Сохранить') + '</button>'
      + '<span class="sa-spacer"></span>'
      + (cfg.isNew ? '' : '<button class="btn btn--ghost">' + ic('x', 15) + ' Удалить</button>') + '</div></div>';
  }

  function buildConstructor(cfg) {
    cfg = cfg || {};
    var name = cfg.name || (cfg.catchall ? 'Все остальные безопасные' : 'Новая рутина упоминаний');
    var l2sum = 'Вложение · подсказка «как отвечать»';
    var left = '<div class="rce-main">'
      + statusRow(cfg)
      + recipeCard(cfg)
      + '<div class="rce-layers">'
        + layer('Настроить точнее', false, l2sum, layer2Body(cfg), cfg.layer2)
        + layer('Только для этой рутины', true, 'Переопределить «Правила дома» здесь', layer3Body(), cfg.layer3)
        + '</div>'
      + foot(cfg) + '</div>';
    return '<div class="rce">' + topbar(name) + '<div class="rce-grid">' + left + aside(cfg) + '</div></div>';
  }

  /* ════════════════ ХАБ ════════════════ */
  function modeBadge(o) {
    var mi = o.mode === 'auto'
      ? { ico: 'bolt', t: 'Отвечает сразу', d: 'Ответ уходит без вашего ревью.' }
      : { ico: 'eye', t: 'Черновик ответа', d: 'Каждый ответ ждёт вашего подтверждения.' };
    if (!o.on) {
      return '<div class="rt-mode rt-mode--muted"><span class="rtm-ico">' + ic(mi.ico, 17) + '</span>'
        + '<div class="rtm-body"><div class="rtm-t">' + mi.t + '</div><div class="rtm-d">' + mi.d + '</div></div>'
        + '<span class="rtm-locknote">' + ic('lock', 12) + ' включи, чтобы сменить</span></div>';
    }
    var cls = o.mode === 'auto' ? 'rt-mode--auto' : 'rt-mode--ask';
    return '<div class="rt-mode ' + cls + '"><span class="rtm-ico">' + ic(mi.ico, 17) + '</span>'
      + '<div class="rtm-body"><div class="rtm-t">' + mi.t + '</div><div class="rtm-d">' + mi.d + '</div></div></div>';
  }
  function hubCard(o) {
    var statusTxt = o.on ? 'Активна' : 'Выключена';
    var status = '<span class="sc-bigstatus' + (o.on ? ' sc-bigstatus--on' : '') + '"><span class="bs-dot"></span>' + statusTxt + '</span>';
    var tag = o.fallback
      ? ' <span class="mr-fallback-tag">' + ic('shieldhouse', 11) + ' по умолчанию</span>'
      : (o.media === 'image' ? ' <span class="sc-plaque">' + ic('image', 11) + ' только с фото</span>' : '');
    var createdoff = !o.on
      ? '<div class="sc-createdoff"><span class="co-ico">' + ic('info', 15) + '</span><span class="co-text"><b>Создана, но выключена.</b> Пока она ничего не делает — включи, когда будешь готов.</span><button class="btn btn--primary btn--sm">' + ic('check', 14) + ' Включить</button></div>'
      : '';
    var cardCls = 'sc-card' + (o.on ? ' sc-card--on' : ' sc-card--off') + ((o.on && o.mode === 'auto') ? ' sc-card--auto' : '') + (o.fallback ? ' sc-card--fallback' : '');
    var edit = o.on ? '<button class="rtm-edit" style="margin-left:auto">' + ic('pencil', 14) + ' Изменить</button>' : '';
    return '<div class="' + cardCls + '">'
      + '<div class="sc-card-head"><span class="sc-card-icon">' + ic(o.ico, 20) + '</span>'
      + '<div class="sc-card-titles"><div class="sc-card-name">' + o.name + tag + '</div>'
      + '<div class="sc-cardline">' + o.line + '</div></div>'
      + '<div class="sc-card-toggle">' + status + sw(o.on) + '</div></div>'
      + createdoff
      + '<div style="display:flex;align-items:center;gap:12px;margin-top:2px">' + modeBadge(o)
      + (o.on ? '' : '') + '</div>'
      + '<div class="sc-card-foot"><div class="sc-runs">'
      + '<div class="sc-run"><span class="sr-k">последнее срабатывание</span><span class="sr-v' + (o.last ? '' : ' muted') + '">' + (o.last || 'ещё не было') + '</span></div>'
      + (o.runs != null ? '<span class="sc-runcount">ответила <b>' + o.runs + '</b> раз</span>' : '')
      + '</div>'
      + '<div class="sc-card-actions">' + (o.on ? '<button class="rtm-edit">' + ic('pencil', 14) + ' Изменить</button>' : '') + '<a class="btn btn--ghost btn--sm" href="#">Активность</a></div>'
      + '</div></div>';
  }
  var CARDS = {
    photo: { ico: 'wand', name: 'Сгенерировать по фото', media: 'image', on: true, mode: 'ask',
      line: 'Когда упоминают <b>с фото</b> и просят сделать в вашем стиле — готовит тёплый ответ, что заберёте в работу. Ответ картинкой появится позже.',
      last: '20 минут назад', runs: 12 },
    course: { ico: 'bubbleq', name: 'Вопросы про курс', media: 'any', on: true, mode: 'auto',
      line: 'Когда спрашивают про ваш курс и хотят записаться — отвечает сам, в вашем голосе, со ссылкой на запись.',
      last: '5 минут назад', runs: 48 },
    praise: { ico: 'bubble', name: 'Похвалили работу', media: 'any', on: false, mode: 'auto',
      line: 'Когда хвалят проект без вопроса — отвечает коротким тёплым спасибо.',
      last: '', runs: null },
    fallback: { ico: 'shieldhouse', name: 'Все остальные безопасные', fallback: true, media: 'any', on: true, mode: 'ask',
      line: 'Ловит всё безопасное, что не подошло под рутины выше. Готовит черновик — вы решаете, отправлять ли.',
      last: '2 часа назад', runs: 31 }
  };
  function hub(cfg) {
    cfg = cfg || {};
    var list = (cfg.cards || ['photo', 'course', 'fallback']).map(function (k) { return hubCard(CARDS[k]); }).join('');
    return '<div class="mr-hub" style="display:flex;flex-direction:column;gap:14px">'
      + '<div class="mr-hubhead"><span class="mh-t">Рутины упоминаний</span><span class="mh-s">' + (cfg.count || '3 рутины · 2 активны') + '</span></div>'
      + '<button class="mr-addcard">' + ic('plus', 17) + ' Новая рутина упоминаний</button>'
      + '<div class="mr-hublist">' + list + '</div></div>';
  }
  function emptyHub() {
    return '<div class="mr-hub" style="display:flex;flex-direction:column;gap:14px">'
      + '<div class="mr-hubhead"><span class="mh-t">Рутины упоминаний</span><span class="mh-s">пока пусто</span></div>'
      + '<div class="mr-empty"><span class="me-mark">' + ic('at', 26) + '</span>'
      + '<div class="me-t">Соберите помощника под конкретную цель</div>'
      + '<div class="me-d">Рутина упоминаний — это <b>цель своими словами</b> плюс что сделать в ответ. Например: «когда прикладывают фото и просят показать будущего ребёнка — ответить». Pennedly сам поймёт, какие упоминания подходят, и ответит в вашем голосе — сам или с вашего подтверждения.</div>'
      + '<button class="mr-addcard" style="max-width:340px">' + ic('plus', 17) + ' Создать первую рутину</button></div></div>';
  }

  window.MR = {
    ic: ic, frame: frame, hub: hub, emptyHub: emptyHub, hubCard: hubCard, CARDS: CARDS,
    constructor: buildConstructor, recipeCard: recipeCard, modeBadge: modeBadge, set: set
  };

  /* ── авто-монтаж ── */
  function mountAll() {
    var hosts = document.querySelectorAll('[data-mr]');
    for (var i = 0; i < hosts.length; i++) {
      var el = hosts[i], cfg = {};
      try { cfg = JSON.parse(el.getAttribute('data-mr') || '{}'); } catch (e) { cfg = {}; }
      var inner = cfg.view === 'hub' ? hub(cfg)
        : cfg.view === 'empty' ? emptyHub()
        : buildConstructor(cfg);
      el.innerHTML = frame(inner, cfg.dark);
    }
    var cards = document.querySelectorAll('[data-mr-card]');
    for (var j = 0; j < cards.length; j++) {
      var ce = cards[j], ccfg = {};
      try { ccfg = JSON.parse(ce.getAttribute('data-mr-card') || '{}'); } catch (e2) { ccfg = {}; }
      ce.innerHTML = '<div class="frame' + (ccfg.dark ? ' dark' : '') + '" style="padding:20px">' + hubCard(CARDS[ccfg.card] || ccfg) + '</div>';
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountAll); else mountAll();
})();
