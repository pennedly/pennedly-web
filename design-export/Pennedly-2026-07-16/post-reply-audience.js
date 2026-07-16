/* post-reply-audience.js — рендер КАРТОЧКИ «Аудитория ответов» для ПОСТОВЫХ
   сценариев (обычный пост + «Акция»). Заменяет заглушку «Неприменимо» на месте
   Слоя-3 у постовых сценариев. Boost-сценарии сохраняют заглушку без изменений.

   Модель (ровно ДВЕ строки в режиме «свои правила», не четыре):
     1. одно предложение про наследование от аккаунтного дежурства;
     2. бинарный режим — (a) «Как в Правилах дома» / (b) «Свои правила»;
        (b) раскрывает: «Кому отвечать» (переиспользован ReplyAudiencePicker)
        + «Пропускать короткие реакции» (toggle, по умолчанию наследуется).
   Лимит / частота / тихие часы — только на уровне аккаунта (серые, не редакт.).

   Строится на window.SR (scenarios-redesign-data.js). Поверх ds/tokens.css +
   ds/components.css + scenarios.css + scenarios-redesign.css + recipe-editor.css
   + layer3-override.css + post-reply-audience.css. Только семантические токены.
   Весь пользовательский текст — через i18n (8 локалей, EN fallback); здесь
   зашиты RU-примеры (ключи см. в Post-Reply-Audience-SPEC.html). */
(function () {
  "use strict";
  var SR = window.SR || {};
  var C = (SR.CREATOR) || { handle: "@alex.makes" };

  /* ------------------------------- icon bank -------------------------------- */
  function ic(n, s) {
    s = s || 14;
    var v = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
    var G = {
      person: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>',
      shield: '<path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3Z"/>',
      shieldhouse: '<path d="M4 11l8-6 8 6v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z"/><path d="M9.5 20v-5h5v5"/>',
      heart: '<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z"/>',
      bubbleq: '<path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2Z"/><path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"/>',
      bubble: '<path d="M21 12a8 8 0 0 1-11.5 7.2L4 20l1-5A8 8 0 1 1 21 12Z"/>',
      pencil: '<path d="M4 20h4L19 9a2 2 0 0 0-3-3L5 17v3Z"/><path d="M14.5 6.5 17.5 9.5"/>',
      gauge: '<path d="M12 13l4-3"/><path d="M4 18a9 9 0 1 1 16 0"/><circle cx="12" cy="13" r="1.4"/>',
      repeat: '<path d="M17 2.5 20.5 6 17 9.5"/><path d="M3.5 11V9a3 3 0 0 1 3-3h14"/><path d="M7 21.5 3.5 18 7 14.5"/><path d="M20.5 13v2a3 3 0 0 1-3 3h-14"/>',
      timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 2h6"/>',
      megaphone: '<path d="M3 11v2a1 1 0 0 0 1 1h2l9 5V5L6 10H4a1 1 0 0 0-1 1Z"/><path d="M18 9a4 4 0 0 1 0 6"/>',
      filter: '<path d="M3 5h18l-7 8v6l-4-2v-4L3 5Z"/>',
      lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
      warn: '<path d="M12 3 2 20h20L12 3Z"/><path d="M12 10v4M12 17.5v.5"/>',
      check: '<path d="M20 7 9 18l-5-5"/>',
      chev: '<path d="M9 6l6 6-6 6"/>',
      info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.5v.5"/>',
      expand: '<path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3"/>'
    };
    return '<svg width="' + s + '" height="' + s + '" ' + v + ' aria-hidden="true">' + (G[n] || '') + '</svg>';
  }

  /* ------------------------------- primitives ------------------------------- */
  function sw(on, disabled) {
    return '<label class="switch"><input type="checkbox"' + (on ? ' checked' : '') + (disabled ? ' disabled' : '') + ' aria-label="переключатель"><span class="track"></span><span class="knob"></span></label>';
  }
  function audTile(icoName, t, d, on) {
    return '<button class="aud-tile' + (on ? ' aud-tile--on' : '') + '" type="button"><span class="at-t">' + ic(icoName, 14) + ' ' + t + '</span><span class="at-d">' + d + '</span></button>';
  }
  /* свободный текст → удобный триггер (тот же bigtext, что в редакторе) */
  function bigText(value, hint) {
    var empty = !value;
    return '<div class="bigtext"><div class="bigtext-val' + (empty ? ' is-empty' : '') + '">' + (value || 'Нажми, чтобы написать…') + '</div>'
      + '<div class="bigtext-foot"><span class="bt-hint">' + (hint || '') + '</span>'
      + '<button class="bigtext-expand" type="button">' + ic('expand', 13) + ' Открыть в отдельном окне</button></div></div>';
  }

  /* ------------------------------- audiences -------------------------------- */
  /* переиспользуем те же пресеты, что в аккаунтных настройках и «Дежурстве» */
  var AUD = {
    fans: { ico: 'heart',   t: 'Только фанатам',    d: 'Тёплым и постоянным.',       phrase: 'только фанатам' },
    all:  { ico: 'shield',  t: 'Все, кроме троллей', d: 'Как в Правилах дома.',       phrase: 'всем, кроме троллей' },
    q:    { ico: 'bubbleq', t: 'Только вопросы',     d: 'Где явно что-то спросили.',  phrase: 'только на вопросы' },
    custom: { ico: 'pencil', t: 'Свой вариант',      d: 'Опиши словами.',             phrase: 'свой вариант' }
  };
  function audPhrase(cfg) {
    if (cfg.promoApplied) return 'всем, кто откликнулся';
    var a = cfg.aud || 'all';
    if (a === 'custom') return cfg.customText ? cfg.customText : 'свой вариант';
    return (AUD[a] || AUD.all).phrase;
  }

  /* ═════════════════ БЕЙДЖ НА КАРТОЧКЕ СЦЕНАРИЯ ═════════════════
     (a) «Ответы: как в Правилах дома» · (b) «Ответы: <аудитория>» */
  function praBadge(cfg) {
    cfg = cfg || {};
    if (cfg.mode !== 'own') {
      return '<span class="pra-badge">' + ic('shieldhouse', 11) + ' Ответы: как в Правилах дома</span>';
    }
    return '<span class="pra-badge pra-badge--on">' + ic('bubble', 11) + ' Ответы: ' + audPhrase(cfg) + '</span>';
  }

  /* ─────────────── строка-предупреждение (правило не сработает) ─────────────── */
  function warnRow(tone, html) {
    return '<div class="pra-warn pra-warn--' + tone + '"><span class="pra-warn-ico">' + ic('warn', 15) + '</span><div class="pra-warn-t">' + html + '</div></div>';
  }

  /* ─────────────── быстрый пресет для «Акции» ─────────────── */
  function promoPreset(applied) {
    return '<div class="pra-preset-wrap">'
      + '<button class="pra-preset' + (applied ? ' is-applied' : '') + '" type="button">'
      + '<span class="pp-ico">' + ic(applied ? 'check' : 'megaphone', 15) + '</span>'
      + '<span class="pp-body"><span class="pp-t">' + (applied ? 'Готово: отвечаем всем, кто откликнулся' : 'Отвечать всем, кто откликнулся') + '</span>'
      + '<span class="pp-d">Ставит «все, кроме троллей» и выключает пропуск коротких реакций.</span></span>'
      + (applied ? '<span class="pp-tag">применено</span>' : '<span class="pp-cta">В один клик</span>')
      + '</button></div>';
  }

  /* ─────────────── строка «Кому отвечать» (галерея аудитории) ─────────────── */
  function whoRow(cfg) {
    var a = cfg.aud || 'all', custom = a === 'custom';
    var grid = '<div class="aud-grid">'
      + audTile('heart',   AUD.fans.t, AUD.fans.d, a === 'fans')
      + audTile('shield',  AUD.all.t,  AUD.all.d,  a === 'all')
      + audTile('bubbleq', AUD.q.t,    AUD.q.d,    a === 'q')
      + audTile('pencil',  AUD.custom.t, AUD.custom.d, custom)
      + '</div>'
      + (custom ? '<div class="aud-custom">' + bigText(cfg.customText || 'всем, кто прислал дату рождения', 'Только для этого сценария · Pennedly решит по каждому комментарию') + '</div>' : '');
    return '<div class="pra-row pra-row--open">'
      + '<div class="ovr-main"><span class="ovr-ico">' + ic('person', 15) + '</span>'
      + '<div class="ovr-text"><div class="ovr-t">Кому отвечать</div>'
      + '<div class="ovr-d">Какие комментарии под этим постом сценарий берёт в работу.</div></div></div>'
      + '<div class="pra-ctl">'
      + (cfg.kind === 'promo' ? promoPreset(cfg.promoApplied) : '')
      + grid
      + '<div class="ovr-hard">' + ic('shield', 12) + '<span>Тролли и токсичность отсекаются всегда — это переопределить нельзя.</span></div>'
      + '</div></div>';
  }

  /* ─────────────── строка «Пропускать короткие реакции» ─────────────── */
  function skipRow(cfg) {
    var inh = (cfg.skipShort == null);           // ещё не трогали → наследуется
    var acct = cfg.acctSkipShort !== false;      // значение аккаунта (дефолт вкл)
    var eff = inh ? acct : !!cfg.skipShort;
    var badge = inh ? '<span class="pra-inh-badge">' + ic('shieldhouse', 10) + ' наследуется: ' + (acct ? 'вкл' : 'выкл') + '</span>' : '';
    return '<div class="pra-row pra-row--toggle">'
      + '<div class="ovr-main"><span class="ovr-ico">' + ic('filter', 15) + '</span>'
      + '<div class="ovr-text"><div class="ovr-t">Пропускать короткие реакции ' + badge + '</div>'
      + '<div class="ovr-d">«+1», «🔥», «спасибо» и такие же — Pennedly не тратит на них ответ.</div></div>'
      + sw(eff, false) + '</div></div>';
  }

  /* ─────────────── аккаунтный блок (серый, не редактируется) ─────────────── */
  function accountLevel() {
    function item(icoName, t, val) {
      return '<div class="pra-acct-item"><span class="pai-ico">' + ic(icoName, 13) + '</span><span class="pai-t">' + t + '</span><span class="pai-v">' + val + '</span></div>';
    }
    return '<div class="pra-acct">'
      + '<div class="pra-acct-k">' + ic('lock', 12) + ' Действует на уровне аккаунта</div>'
      + '<div class="pra-acct-list">'
      + item('gauge', 'Лимит ответов в день', 'до 25')
      + item('repeat', 'Частота проверки', 'раз в 15 мин')
      + item('timer', 'Тихие часы', '23:00 – 08:00')
      + '</div>'
      + '<div class="pra-acct-note">Один общий дневной лимит на все ответы аккаунта — здесь не меняется. <a href="#">Открыть Правила дома</a>.</div>'
      + '</div>';
  }

  /* ════════════════════════ ГЛАВНАЯ КАРТОЧКА ════════════════════════ */
  function praCard(cfg) {
    cfg = cfg || {};

    /* boost-сценарии сохраняют заглушку «Неприменимо» без изменений */
    if (cfg.kind === 'boost') {
      return '<div class="pra">'
        + '<div class="rce-stub"><span class="rs-ico">' + ic('lock', 16) + '</span>'
        + '<div><div class="rs-t">Аудитория ответов — неприменимо</div>'
        + '<div class="rs-d">Этот сценарий не собирает собственную аудиторию ответов. Комментарии под его постами идут по общему <b>дежурству аккаунта</b>.</div>'
        + '<span class="rs-soon">boost-сценарий · без изменений</span></div></div>'
        + '</div>';
    }

    var own = cfg.mode === 'own';
    var acctAud = cfg.acctAudPhrase || 'всем, кроме троллей';

    /* лид — одно предложение про наследование */
    var lead = '<div class="pra-lead"><span class="pra-lead-ico">' + ic('bubble', 15) + '</span>'
      + '<div class="pra-lead-t">У аккаунта есть общее <b>дежурство по ответам</b>. Комментарии под этими постами идут по нему, пока не зададите сценарию своё правило <b>«кому отвечать»</b>.</div></div>';

    /* бинарный выбор режима */
    var seg = '<div class="pra-moderow"><div class="seg" role="tablist" aria-label="Режим ответов">'
      + '<button class="seg-opt' + (!own ? ' seg-opt--active' : '') + '" type="button" role="tab" aria-selected="' + (!own) + '">' + ic('shieldhouse', 13) + ' Как в Правилах дома</button>'
      + '<button class="seg-opt' + (own ? ' seg-opt--active' : '') + '" type="button" role="tab" aria-selected="' + own + '">' + ic('pencil', 13) + ' Свои правила</button>'
      + '</div></div>';

    var body;
    if (!own) {
      /* (a) наследование — показываем, что наследуется */
      body = '<div class="pra-inherit">'
        + '<div class="pra-inh-line"><span class="pra-vk">наследуется</span><span class="pra-vv">' + acctAud + '</span></div>'
        + '<div class="pra-inh-sub">' + ic('info', 13) + '<span>Лимит ответов, частота проверки и тихие часы — тоже из <b>Правил дома</b>. Задайте своё правило, только если под этим постом нужно отвечать иначе.</span></div>'
        + '<a class="pra-openhr" href="#">' + ic('shieldhouse', 13) + ' Открыть Правила дома</a>'
        + '</div>';
    } else {
      /* (b) свои правила — предупреждения + две строки + аккаунтный блок */
      var warns = '';
      if (cfg.warnAcctOff) warns += warnRow('danger', 'У аккаунта <b>отключены ответы</b> — правило сценария не сработает, пока не включите ответы в <a href="#">Правилах дома</a>.');
      if (cfg.warnMuted) warns += warnRow('warn', 'Под этим постом <b>ответы отключены</b> — правило не применится.');

      body = '<div class="pra-own">'
        + (warns ? '<div class="pra-warns">' + warns + '</div>' : '')
        + '<div class="pra-rows">' + whoRow(cfg) + skipRow(cfg) + '</div>'
        + accountLevel()
        + '</div>';
    }

    return '<div class="pra' + (own ? ' pra--own' : '') + '">' + lead + seg + body + '</div>';
  }

  /* ─────────── обёртка «в контексте Слоя-3 редактора» ─────────── */
  function inLayer(inner, tag) {
    return '<div class="rce" style="max-width:660px"><div class="rce-layers">'
      + '<div class="rce-layer is-open"><div class="rl-head" style="cursor:default"><span class="rl-chev">' + ic('chev', 16) + '</span>'
      + '<span class="rl-hd"><span class="rl-t">Только для этого сценария <span class="rl-pro">для продвинутых</span></span>'
      + (tag ? '<span class="rl-sum">' + tag + '</span>' : '') + '</span></div>'
      + '<div class="rl-body">' + inner + '</div></div>'
      + '</div></div>';
  }

  /* ─────────── демонстрационная карточка сценария из списка ─────────── */
  function scenarioCard(cfg) {
    cfg = cfg || {};
    var icoName = cfg.ico || 'bubbleq';
    var name = cfg.name || 'Сценарий';
    var sentence = cfg.sentence || '';
    return '<div class="sc-card sc-card--on pra-democard">'
      + '<div class="sc-card-head"><span class="sc-card-icon">' + ic(icoName, 20) + '</span>'
      + '<div class="sc-card-titles"><div class="sc-card-name">' + name + '</div>'
      + '<div class="sc-cardline">' + sentence + '</div></div>'
      + '<div class="sc-card-toggle"><span class="sc-bigstatus sc-bigstatus--on"><span class="bs-dot"></span>Активен</span></div></div>'
      + '<div class="pra-cardstrip">' + praBadge(cfg) + '</div>'
      + '</div>';
  }

  window.PostReplyAudience = { card: praCard, badge: praBadge, inLayer: inLayer, scenarioCard: scenarioCard, ic: ic };

  /* ── auto-mount ── */
  function parse(el, attr) { try { return JSON.parse(el.getAttribute(attr) || '{}'); } catch (e) { return {}; } }
  function frameWrap(inner, dark) { return '<div class="frame' + (dark ? ' dark' : '') + '">' + inner + '</div>'; }

  function mountAll() {
    document.querySelectorAll('[data-pra]').forEach(function (el) {
      var cfg = parse(el, 'data-pra');
      var inner = cfg.inLayer ? inLayer(praCard(cfg), cfg.layerTag) : praCard(cfg);
      el.innerHTML = cfg.bare ? inner : frameWrap(inner, cfg.dark);
    });
    document.querySelectorAll('[data-pra-badge]').forEach(function (el) {
      el.innerHTML = praBadge(parse(el, 'data-pra-badge'));
    });
    document.querySelectorAll('[data-pra-card]').forEach(function (el) {
      var cfg = parse(el, 'data-pra-card');
      el.innerHTML = '<div class="frame' + (cfg.dark ? ' dark' : '') + '" style="padding:22px">' + scenarioCard(cfg) + '</div>';
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountAll); else mountAll();
})();
