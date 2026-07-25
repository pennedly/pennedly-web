/* scenario-editor.js — FINAL hybrid Scenario Editor renderer (C×B).
   Каркас/логика из направления C, крупное липкое превью из направления B.
   Один редактор для двух видов сценария: ОТВЕТ (reply) и ПОСТ (post).
   Использует window.SR (scenarios-redesign-data.js) + реальные классы DS.

   Жёсткие ограничения соблюдены:
   • только ПОСТ + ОТВЕТ (без тредов/каруселей/медиа/нативных опросов);
   • ответы — опрос раз в 15 минут, не мгновенно;
   • «Прогнать сейчас» / превью → только черновик, никогда не публикует;
   • выбор «спроси/авто» здесь НЕ показан — он в окне включения;
   • по умолчанию сценарий спрашивает перед публикацией.

   Опции состояния (для демонстрации механики свёртки шагов):
     open: индекс активного (развёрнутого) шага в [1..2]
   Шаг 3 (что добавит) всегда развёрнут — это видимый шаг доверия.
*/
(function () {
  "use strict";
  var SR = window.SR, C = SR.CREATOR;

  /* ------------------------------- icon bank -------------------------------- */
  function ic(n, s) {
    s = s || 14;
    var v = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
    var G = {
      repeat: '<path d="M17 2.5 20.5 6 17 9.5"/><path d="M3.5 11V9a3 3 0 0 1 3-3h14"/><path d="M7 21.5 3.5 18 7 14.5"/><path d="M20.5 13v2a3 3 0 0 1-3 3h-14"/>',
      bubble: '<path d="M21 12a8 8 0 0 1-11.5 7.2L4 20l1-5A8 8 0 1 1 21 12Z"/>',
      bubbleq: '<path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2Z"/><path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"/>',
      clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
      eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
      heart: '<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z"/>',
      lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
      play: '<path d="M7 5l12 7-12 7V5Z"/>',
      sparkle: '<path d="M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3Z"/>',
      check: '<path d="M20 7 9 18l-5-5"/>',
      x: '<path d="M6 6l12 12M18 6 6 18"/>',
      chev: '<path d="M9 6l6 6-6 6"/>',
      back: '<path d="M15 18l-6-6 6-6"/>',
      pencil: '<path d="M4 20h4L19 9a2 2 0 0 0-3-3L5 17v3Z"/><path d="M14.5 6.5 17.5 9.5"/>',
      eyecheck: '<path d="M2 12s3.5-7 10-7 10 7 10 7"/><path d="M9 13l2 2 4-4"/>',
      sliders: '<path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h7M15 18h5"/><circle cx="16" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="13" cy="18" r="2"/>',
      info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.5v.5"/>',
      trash: '<path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/>',
      code: '<path d="M8 6 2 12l6 6M16 6l6 6-6 6"/>'
    };
    return '<svg width="' + s + '" height="' + s + '" ' + v + '>' + (G[n] || '') + '</svg>';
  }

  function av(initials, sz) {
    sz = sz || 34;
    return '<span style="width:' + sz + 'px;height:' + sz + 'px;display:inline-grid;place-items:center;border-radius:9999px;background:var(--color-surface-2);border:1px solid var(--color-border);font-size:' + Math.round(sz * 0.36) + 'px;font-weight:600;color:var(--color-text-muted);flex:0 0 auto">' + initials + '</span>';
  }
  function sw(on) { return '<label class="switch"><input type="checkbox"' + (on ? ' checked' : '') + ' aria-label="toggle"><span class="track"></span><span class="knob"></span></label>'; }
  function sel(val, opts) { return '<select class="field" aria-label="select">' + opts.map(function (o) { return '<option' + (o === val ? ' selected' : '') + '>' + o + '</option>'; }).join('') + '</select>'; }

  var NAME = { reply: "Дежурство в комментах", post: "Утренний вопрос" };

  /* --------------------------------- chrome --------------------------------- */
  function topbar(kind) {
    var reply = kind === "reply";
    var kindPill = '<span class="ed-kind">' + ic(reply ? "bubble" : "bubbleq", 13) + (reply ? "Сценарий-ответ" : "Сценарий-пост") + '</span>';
    return '<div class="ed-topbar"><button class="ed-back">' + ic("back", 16) + ' Мои сценарии</button>'
      + '<div class="ed-titlerow"><div class="ed-titlewrap">'
      + '<h1 class="ed-title" contenteditable="false">' + NAME[kind] + '</h1>'
      + '<button class="ed-edit" aria-label="переименовать">' + ic("pencil", 13) + '</button></div>'
      + '<span class="sc-bigstatus"><span class="bs-dot"></span>Выключен</span></div>'
      + '<div class="ed-kindrow">' + kindPill + '<span style="font-size:var(--text-caption);color:var(--color-text-subtle)">Заголовок выше — название сценария, можно переименовать</span></div>'
      + '</div>';
  }

  function actions() {
    return '<div class="sc-actionbar"><button class="btn btn--secondary">Сохранить выключенным</button>'
      + '<button class="btn btn--primary">' + ic("check", 15) + ' Сохранить и включить</button>'
      + '<span class="sa-spacer"></span><button class="btn btn--ghost">' + ic("trash", 15) + ' Удалить</button></div>';
  }
  function enableNote() {
    return '<p class="enable-note">' + ic("info", 13) + '<span>При включении выберешь, как публиковать: <b>спрашивать тебя</b> перед каждой публикацией (по умолчанию) или <b>автоматически</b>. Здесь это решать не нужно.</span></p>';
  }

  /* ------------------------------ step controls ----------------------------- */
  function whenReplyBody() {
    return '<div class="sced-when-reply"><span class="wr-ico">' + ic("clock", 17) + '</span>'
      + '<span class="wr-txt">Pennedly <b>проверяет новые комментарии каждые 15 минут</b> и готовит ответ. Это не мгновенный ответ — небольшая задержка нормальна, расписание выбирать не нужно.</span></div>';
  }
  function whenPostBody() {
    var segs = ["Ежедневно", "Раз в N дней", "Еженедельно", "В период дат", "По событию"];
    return '<div class="seg" role="tablist">' + segs.map(function (s, i) { return '<button class="seg-opt' + (i === 0 ? " seg-opt--active" : "") + '">' + s + '</button>'; }).join("") + '</div>'
      + '<div class="sc-everyn" style="color:var(--color-text-subtle);margin-top:2px">' + ic("clock", 14) + ' Каждое утро в <b style="color:var(--color-text);font-weight:600;margin:0 2px">9:00</b>, первым постом дня</div>';
  }
  function whatReplyBody() {
    return '<div class="sc-field"><label>Кому отвечаем</label>'
      + sel("Всем, кроме троллей", ["Только тёплым и фанатам", "Всем, кроме троллей", "Только тем, кто задал вопрос"])
      + '<span class="field-hint">Pennedly готовит черновик — ты утверждаешь его в «Активности».</span></div>'
      + '<div class="sc-field"><label>Как отвечать <span class="sc-opt">· короткая инструкция</span></label>'
      + '<textarea class="field" rows="3">по имени, одно наблюдение и мягкий вопрос — без шаблонов</textarea>'
      + '<span class="field-hint">Твоя добавка поверх голоса из Voice. Базовые правила — в следующем шаге.</span></div>';
  }
  function whatPostBody() {
    return '<div class="sc-field"><label>Тема дня <span class="sc-opt">· необязательно</span></label>'
      + '<input class="field" value="довести дело до конца" placeholder="оставь пустым — Pennedly подберёт сам">'
      + '<span class="field-hint">Одно слово или короткая фраза задаёт настроение вопроса.</span></div>';
  }
  function inlineRules(id) {
    var rules = SR.RULES[id] || [];
    return '<div class="inline-rules"><p class="sc-rules-intro">Эти правила Pennedly соблюдает всегда — их <b>видно, но менять нельзя</b>, чтобы превью оставалось честным.</p>'
      + '<ul class="sc-rules-list">' + rules.map(function (r) { return '<li class="sc-rules-item"><span class="ri-ico">' + ic("check", 14) + '</span><span>' + r + '</span></li>'; }).join("") + '</ul>'
      + '<div class="sc-rules-foot">' + ic("lock", 12) + ' Только для чтения · поверх — твой голос из Voice</div></div>';
  }
  function moreBody(kind) {
    var reply = kind === "reply";
    function row(t, d, control) {
      return '<div class="sc-onlyif-row"><div class="oi-label"><div class="oi-t">' + t + '</div><div class="oi-d">' + d + '</div></div><div class="oi-control">' + control + '</div></div>';
    }
    var first = reply
      ? row("Пропускать спам и токсичность", "Не отвечать на оскорбления и явный спам.", sw(true))
        + row("Только содержательные комментарии", "Пропускать пустые «спасибо» и эмодзи.", sw(true))
        + row("Не больше ответов в день", "Чтобы не завалить ленту ответами.", '<input class="field" value="20" style="width:72px;text-align:center">')
      : row("Только по будням", "Не публиковать по выходным.", sw(false))
        + row("Не повторять сегодняшнюю тему", "Пропустить, если похожий пост уже вышел сегодня.", sw(true));
    return '<div class="sc-more-group"><div class="mg-k">' + (reply ? "Кому и сколько отвечать" : "Когда не публиковать") + '</div><div class="sc-onlyif">' + first + '</div></div>'
      + '<div class="sc-more-group"><div class="mg-k">Тихие часы</div><div class="sc-onlyif"><div class="sc-onlyif-row" style="border-top:none;padding-top:2px"><div class="oi-label"><div class="oi-t">Не публиковать ночью</div><div class="oi-d">Пауза с 23:00 до 8:00.</div></div><div class="oi-control">' + sw(true) + '</div></div></div></div>'
      + '<div class="sc-more-group"><div class="mg-k">Аккаунт</div><div class="sc-field" style="max-width:280px">' + sel("Алекс · @alex.makes", ["Алекс · @alex.makes", "Заметки · @alex.notes"]) + '</div></div>';
  }
  function advancedBody(kind) {
    var reply = kind === "reply";
    var trig = reply ? "Каждые 15 минут" : "Ежедневно";
    var act = reply ? "Ответ в комментариях" : "Пост";
    return '<p class="sc-advanced-note" style="margin-top:0">Та же рутина сырыми полями. Они связаны с формой выше: правки здесь меняют её, и наоборот. Не уверен — закрой и пользуйся обычными шагами.</p>'
      + '<div class="sc-field"><label>Когда</label>' + sel(trig, ["Ежедневно", "Раз в N дней", "Еженедельно", "В период дат", "Каждые 15 минут", "Когда пост перейдёт N просмотров", "Когда наберётся N подписчиков"]) + '</div>'
      + '<div class="sc-field"><label>Только если <span class="sc-opt">· необязательно</span></label>' + sel("Без условия", ["Без условия", "Только по будням", "Только для подписчиков", "Если за день не было постов", "Если комментарий содержательный"]) + '</div>'
      + '<div class="sc-field"><label>Что сделать</label>' + sel(act, ["Пост", "Ответ в комментариях"]) + '<span class="field-hint">Pennedly умеет только постить и отвечать — другого пока нет.</span></div>';
  }

  /* ---------------------------------- step ---------------------------------- */
  // state: 'open' | 'done' | 'opt'  (opt = свёрнутый необязательный)
  function step(n, opts) {
    var open = opts.open, done = opts.done, optional = opts.optional, finish = opts.finish;
    var cls = "step";
    if (open) cls += " step--open step--active";
    else if (done) cls += " step--done";
    if (optional) cls += " step--opt";
    if (finish) cls += " step--finish";
    var numInner = done ? ic("check", 16) : n;
    var titleExtra = optional ? ' <span class="st-opt">· не обязательно</span>' : '';
    var head = '<button class="step-head"><div class="step-hd-txt"><div class="step-title">' + opts.title + titleExtra + '</div>'
      + (open ? "" : '<div class="step-sum">' + opts.summary + '</div>') + '</div>'
      + (finish ? "" : '<span class="step-chev">' + ic("chev", 16) + '</span>') + '</button>';
    return '<div class="' + cls + '"><div class="step-rail"><span class="step-num">' + numInner + '</span></div>'
      + '<div class="step-main">' + head + (open ? '<div class="step-body">' + opts.body + '</div>' : "") + '</div></div>';
  }

  /* ----------------------------- live preview (B) --------------------------- */
  function mockPost(s) {
    return '<div class="mockpost"><div class="mockpost-top">' + av(C.initial) + '<div class="mockpost-who"><span class="mw-n">' + C.name + '</span><span class="mw-h">' + C.handle + '</span></div><span class="mockpost-time">' + s.time + '</span></div>'
      + '<div class="mockpost-text">' + s.post + '</div>'
      + '<div class="mockpost-stats"><span class="ms">' + ic("eye", 13) + ' ' + s.stats[0] + '</span><span class="ms">' + ic("heart", 13) + ' ' + s.stats[1] + '</span><span class="ms">' + ic("bubble", 13) + ' ' + s.stats[2] + '</span></div></div>';
  }
  function replyThread() {
    var r = SR.SAMPLE.duty.reply;
    var parent = '<div class="mockpost" style="border-bottom:1px solid var(--color-border)"><div class="mockpost-top">' + av(C.initial) + '<div class="mockpost-who"><span class="mw-n">' + C.name + '</span><span class="mw-h">' + C.handle + '</span></div><span class="mockpost-time">вчера</span></div>'
      + '<div class="mockpost-text">Маленькая победа недели 🟢 Закрыл задачу, которая висела с марта. Не «найти время», а занять 20 минут и начать.</div></div>';
    var thread = '<div class="mockreply"><div class="mr-k">так Pennedly ответит на комментарий</div>'
      + '<div class="mr-comment">' + av(r.who[0], 30) + '<div class="mrc-body"><div class="mrc-who">' + r.who + '</div><div class="mrc-text">' + r.text + '</div></div></div>'
      + '<div class="mr-bot">' + av(C.initial, 30) + '<div class="mrb-body"><div class="mrb-who">' + C.name + ' <span class="mrb-tag">' + ic("bubble", 11) + ' ответ Pennedly</span></div><div class="mrb-text">' + r.bot + '</div></div></div></div>';
    return parent + thread;
  }
  function stage(kind) {
    var reply = kind === "reply";
    return '<aside class="sced-stage"><div class="stage-cap">' + ic("eye", 13) + ' Превью · так это увидят люди</div>'
      + '<div class="stage-frame"><div class="stage-bar"><span class="sb-dot"></span><span class="sb-t">' + (reply ? "Ответ под твоим постом · Threads" : "Пост в ленте · Threads") + '</span><span class="sb-live">Живо</span></div>'
      + (reply ? replyThread() : mockPost(SR.SAMPLE.talk))
      + '<div class="stage-foot">'
      + '<div class="stage-line">' + ic("sparkle", 13) + '<span>В твоём голосе · на основе <b>' + (reply ? "8 постов и ветки комментариев" : "8 твоих недавних постов") + '</b></span></div>'
      + '<div class="stage-line">' + ic("clock", 13) + '<span>Сработает: <b>' + (reply ? "в течение 15 минут после нового комментария" : "завтра в 9:00, первым постом дня") + '</b></span></div>'
      + '<div class="stage-run"><button class="btn btn--secondary btn--sm">' + ic("play", 14) + ' Прогнать сейчас</button><span class="rn-note">Создаст черновик прямо сейчас — никогда не публикует.</span></div>'
      + '</div></div>'
      + '<p class="stage-disc">' + ic("info", 13) + '<span>Превью и «Прогнать» — всегда только черновик. Опрос Pennedly публикует обычным текстовым постом.</span></p>'
      + '</aside>';
  }

  /* --------------------------------- editor --------------------------------- */
  // active: 1 или 2 — какой из первых двух шагов развёрнут (демо механики свёртки)
  function editor(kind, active) {
    var reply = kind === "reply";
    active = active || 2;
    var rulesId = reply ? "duty" : "talk";

    var s1sum = reply ? 'Каждые 15 минут проверяет новые комментарии' : 'Каждое утро в <span class="v">9:00</span>, первым постом дня';
    var s2sum = reply ? 'Отвечать <span class="v">всем, кроме троллей</span> · по имени, с вопросом' : 'Тема дня — <span class="v">«довести дело до конца»</span>';

    var steps =
      step("1", {
        title: "Когда сработает", summary: s1sum,
        open: active === 1, done: active !== 1,
        body: reply ? whenReplyBody() : whenPostBody()
      })
      + step("2", {
        title: "Что ты задаёшь", summary: s2sum,
        open: active === 2, done: active !== 2,
        body: reply ? whatReplyBody() : whatPostBody()
      })
      + step("3", {
        title: "Что Pennedly добавит сам", open: true,
        body: inlineRules(rulesId)
      })
      + step("4", {
        title: "Ещё настройки", optional: true,
        summary: reply ? "Спам-фильтр, кап ответов, тихие часы, аккаунт" : "Будни, тихие часы, аккаунт",
        open: false, body: moreBody(kind)
      })
      + step("5", {
        title: "Для продвинутых", optional: true,
        summary: "Сырая модель: когда · только если · что сделать",
        open: false, body: advancedBody(kind)
      })
      + step("6", {
        title: "Готово", finish: true, open: true,
        body: actions() + enableNote()
      });

    return '<div class="sced">' + topbar(kind)
      + '<div class="sced-grid"><div class="sced-steps">' + steps + '</div>' + stage(kind) + '</div></div>';
  }

  /* ---------------------------------- mount --------------------------------- */
  function frame(inner, dark) { return '<div class="frame' + (dark ? ' dark' : '') + '">' + inner + '</div>'; }
  function set(id, html) { var e = document.getElementById(id); if (e) e.innerHTML = html; }

  set("ed-reply", frame(editor("reply", 2), false));
  set("ed-reply-s1", frame(editor("reply", 1), false));
  set("ed-post", frame(editor("post", 1), false));
  set("ed-dark", frame(editor("reply", 2), true));

  window.PennedlyEditor = { editor: editor, frame: frame };
})();
