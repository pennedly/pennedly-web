/* scenario-editor-directions.js — three DISTINCT re-imaginings of the Scenario
   EDITOR for the non-technical solo creator. Built on the real Pennedly DS
   (ds/tokens.css + ds/components.css + scenarios.css + scenarios-redesign.css)
   and the neutral-creator content model (window.SR from scenarios-redesign-data.js).

   Each direction renders a REPLY editor («Дежурство в комментах», @alex.makes)
   and a POST editor («Утренний вопрос»), light + one dark.

   Honors the hard constraints:
   • only POST + REPLY exist (no threads/media/native polls)
   • replies = poll every 15 min, never «мгновенно»
   • preview / «Прогнать» → draft only, never publishes
   • ask-vs-auto is chosen in a SEPARATE enable dialog — the editor never
     duplicates the mode picker, it only states the default truthfully. */
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
      send: '<path d="M22 3 11 14M22 3l-7 19-4-8-8-4 19-7Z"/>',
      clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
      eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
      heart: '<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z"/>',
      person: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>',
      lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
      play: '<path d="M7 5l12 7-12 7V5Z"/>',
      sparkle: '<path d="M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3Z"/>',
      check: '<path d="M20 7 9 18l-5-5"/>',
      checkc: '<circle cx="12" cy="12" r="9"/><path d="M8.5 12.2l2.3 2.3 4.7-4.8"/>',
      x: '<path d="M6 6l12 12M18 6 6 18"/>',
      chev: '<path d="M9 6l6 6-6 6"/>',
      back: '<path d="M15 18l-6-6 6-6"/>',
      pencil: '<path d="M4 20h4L19 9a2 2 0 0 0-3-3L5 17v3Z"/><path d="M14.5 6.5 17.5 9.5"/>',
      bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/>',
      eyecheck: '<path d="M2 12s3.5-7 10-7 10 7 10 7"/><path d="M9 13l2 2 4-4"/>',
      sliders: '<path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h7M15 18h5"/><circle cx="16" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="13" cy="18" r="2"/>',
      info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.5v.5"/>',
      trash: '<path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/>',
      plus: '<path d="M12 5v14M5 12h14"/>',
      external: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>'
    };
    return '<svg width="' + s + '" height="' + s + '" ' + v + '>' + (G[n] || '') + '</svg>';
  }

  /* ------------------------------- primitives ------------------------------- */
  function set(id, html) { var e = document.getElementById(id); if (e) e.innerHTML = html; }
  function frame(inner, dark) { return '<div class="frame' + (dark ? ' dark' : '') + '">' + inner + '</div>'; }
  function sw(on) { return '<label class="switch"><input type="checkbox"' + (on ? ' checked' : '') + ' aria-label="toggle"><span class="track"></span><span class="knob"></span></label>'; }
  function sel(val, opts) { return '<select class="field" aria-label="select">' + opts.map(function (o) { return '<option' + (o === val ? ' selected' : '') + '>' + o + '</option>'; }).join('') + '</select>'; }
  function av(initials, sz) { sz = sz || 32; return '<span style="width:' + sz + 'px;height:' + sz + 'px;display:inline-grid;place-items:center;border-radius:9999px;background:var(--color-surface-2);border:1px solid var(--color-border);font-size:' + Math.round(sz * 0.36) + 'px;font-weight:600;color:var(--color-text-muted);flex:0 0 auto">' + initials + '</span>'; }

  var NAME = { reply: "Дежурство в комментах", post: "Утренний вопрос" };

  /* --------------------------- shared editor chrome ------------------------- */
  function topbar(name) {
    return '<div class="ed-topbar"><button class="ed-back">' + ic("back", 16) + ' Мои сценарии</button>'
      + '<div class="ed-titlerow"><div class="ed-titlewrap"><h1 class="ed-title">' + name + '</h1>'
      + '<button class="ed-edit" aria-label="переименовать">' + ic("pencil", 13) + '</button></div>'
      + '<span class="sc-bigstatus"><span class="bs-dot"></span>Выключен</span></div></div>';
  }
  function actions() {
    return '<div class="sc-actionbar"><button class="btn btn--secondary">Сохранить выключенным</button>'
      + '<button class="btn btn--primary">' + ic("check", 15) + ' Сохранить и включить</button>'
      + '<span class="sa-spacer"></span><button class="btn btn--ghost">' + ic("trash", 15) + ' Удалить</button></div>';
  }
  function enableNote() {
    return '<p class="enable-note">' + ic("info", 13) + '<span>При включении выберешь, как публиковать: <b>спрашивать тебя</b> перед каждой публикацией (по умолчанию) или <b>автоматически</b>. Здесь это решать не нужно.</span></p>';
  }

  /* ------------------------------ WHEN controls ----------------------------- */
  function whenReply() {
    return '<div class="sc-event-ro"><span class="ev-ico">' + ic("clock", 16) + '</span>'
      + '<span class="ev-txt">Pennedly <b>проверяет новые комментарии каждые 15 минут</b> и готовит ответ. Это не мгновенный ответ — небольшая задержка нормальна.</span></div>';
  }
  function whenPostSeg() {
    var segs = ["Ежедневно", "Раз в N дней", "Еженедельно", "В период дат", "По событию"];
    return '<div class="seg" role="tablist">' + segs.map(function (s, i) { return '<button class="seg-opt' + (i === 0 ? " seg-opt--active" : "") + '">' + s + '</button>'; }).join("") + '</div>'
      + '<div class="sc-everyn" style="color:var(--color-text-subtle);margin-top:12px">' + ic("clock", 14) + ' Каждое утро в 9:00, первым постом дня</div>';
  }

  /* ---------------------------- WHAT-you-set blocks -------------------------- */
  function setReply() {
    return '<div class="sc-field"><label>Кому отвечаем</label>'
      + sel("Всем, кроме троллей", ["Только тёплым и фанатам", "Всем, кроме троллей", "Только тем, кто задал вопрос"])
      + '<span class="field-hint">Pennedly готовит черновик — ты утверждаешь его в «Активности».</span></div>'
      + '<div class="sc-field"><label>Как отвечать</label><textarea class="field" rows="3">по имени, одно наблюдение и мягкий вопрос — без шаблонов</textarea>'
      + '<span class="field-hint">Это твоя добавка поверх голоса из Voice. Базовые правила уже учтены ниже.</span></div>';
  }
  function setPost() {
    return '<div class="sc-field"><label>Тема дня <span class="sc-opt">· необязательно</span></label>'
      + '<input class="field" value="довести дело до конца" placeholder="оставь пустым — Pennedly подберёт сам">'
      + '<span class="field-hint">Одно слово или короткая фраза задаёт настроение вопроса.</span></div>';
  }

  /* ----------------------- read-only «Что Pennedly добавит» ----------------- */
  function rulesBlock(id, open) {
    var rules = SR.RULES[id] || [];
    return '<div class="sc-rules' + (open ? " sc-rules--open" : "") + '">'
      + '<button class="sc-rules-head"><span class="rh-ico">' + ic("check", 15) + '</span><span class="rh-t">Что Pennedly добавит от себя</span><span class="rh-chev">' + ic("chev", 16) + '</span></button>'
      + (open ? '<div class="sc-rules-body"><p class="sc-rules-intro">Несколько проверенных правил поверх твоего голоса. Их видно, но менять нельзя — так превью остаётся честным.</p>'
        + '<ul class="sc-rules-list">' + rules.map(function (r) { return '<li class="sc-rules-item"><span class="ri-ico">' + ic("check", 14) + '</span><span>' + r + '</span></li>'; }).join("") + '</ul>'
        + '<div class="sc-rules-foot">' + ic("lock", 12) + ' Только для чтения · поверх — твой голос из Voice</div></div>' : "")
      + '</div>';
  }
  function inlineRules(id) {
    var rules = SR.RULES[id] || [];
    return '<div class="inline-rules"><p class="sc-rules-intro" style="margin-top:0">Эти правила Pennedly соблюдает всегда — их видно, но менять нельзя, чтобы превью оставалось честным.</p>'
      + '<ul class="sc-rules-list">' + rules.map(function (r) { return '<li class="sc-rules-item"><span class="ri-ico">' + ic("check", 14) + '</span><span>' + r + '</span></li>'; }).join("") + '</ul>'
      + '<div class="sc-rules-foot">' + ic("lock", 12) + ' Только для чтения · поверх — твой голос из Voice</div></div>';
  }

  /* ------------------------------ «Ещё настройки» --------------------------- */
  function row2(t, d, control) {
    return '<div class="sc-onlyif-row"><div class="oi-label"><div class="oi-t">' + t + '</div><div class="oi-d">' + d + '</div></div><div class="oi-control">' + control + '</div></div>';
  }
  function moreSettings(kind, open) {
    var reply = kind === "reply";
    var rows = reply
      ? row2("Пропускать спам и токсичность", "Не отвечать на оскорбления и явный спам.", sw(true))
      + row2("Только содержательные комментарии", "Пропускать пустые «спасибо» и эмодзи.", sw(true))
      + row2("Не больше ответов в день", "Чтобы не завалить ленту ответами.", '<input class="field" value="20" style="width:72px;text-align:center">')
      : row2("Только по будням", "Не публиковать по выходным.", sw(false))
      + row2("Не повторять сегодняшнюю тему", "Пропустить, если похожий пост уже вышел сегодня.", sw(true));
    return '<div class="sc-more' + (open ? " sc-more--open" : "") + '">'
      + '<button class="sc-more-head"><span class="mh-ico">' + ic("chev", 16) + '</span><span class="mh-t">' + ic("sliders", 14) + ' Ещё настройки</span><span class="mh-hint">' + (open ? "фильтры, тихие часы, аккаунт" : "не обязательно") + '</span></button>'
      + (open ? '<div class="sc-more-body">'
        + '<div class="sc-more-group"><div class="mg-k">' + (reply ? "Кому и сколько отвечать" : "Только если") + '</div><div class="sc-onlyif">' + rows + '</div></div>'
        + '<div class="sc-more-group"><div class="mg-k">Тихие часы</div><div class="sc-onlyif"><div class="sc-onlyif-row" style="padding-top:2px"><div class="oi-label"><div class="oi-t">Не публиковать ночью</div><div class="oi-d">Пауза с 23:00 до 8:00.</div></div><div class="oi-control">' + sw(true) + '</div></div></div></div>'
        + '<div class="sc-more-group"><div class="mg-k">Аккаунт</div><div class="sc-field" style="max-width:280px">' + sel("Алекс · @alex.makes", ["Алекс · @alex.makes", "Заметки · @alex.notes"]) + '</div></div>'
        + '</div>' : "")
      + '</div>';
  }

  /* --------------------------- «Показать как правило» ----------------------- */
  function advancedBlock(kind, open) {
    var reply = kind === "reply";
    var trig = reply ? "Каждые 15 минут" : "Ежедневно";
    var act = reply ? "Ответ в комментариях" : "Пост";
    return '<div class="sc-advanced' + (open ? " sc-advanced--open" : "") + '">'
      + '<button class="sc-advanced-head"><span class="ah-ico">' + ic("chev", 16) + '</span><span class="ah-t">Показать как правило</span><span class="ah-hint">для продвинутых</span></button>'
      + (open ? '<div class="sc-advanced-body"><p class="sc-advanced-note">Та же рутина сырыми полями. Они связаны с формой выше: правки здесь меняют её, и наоборот. Если не уверен — закрой и пользуйся обычной формой.</p>'
        + '<div class="sc-field"><label>Когда</label>' + sel(trig, ["Ежедневно", "Раз в N дней", "Еженедельно", "В период дат", "Каждые 15 минут", "Когда пост перейдёт N просмотров", "Когда наберётся N подписчиков"]) + '</div>'
        + '<div class="sc-field"><label>Только если <span class="sc-opt">· необязательно</span></label>' + sel("Без условия", ["Без условия", "Только по будням", "Только для подписчиков", "Если за день не было постов", "Если комментарий содержательный"]) + '</div>'
        + '<div class="sc-field"><label>Что сделать</label>' + sel(act, ["Пост", "Ответ в комментариях"]) + '<span class="field-hint">Pennedly умеет только постить и отвечать — другого пока нет.</span></div>'
        + '</div>' : "")
      + '</div>';
  }

  /* ------------------------------ mock previews ----------------------------- */
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
      + '<div class="mr-comment">' + av(r.who[0]) + '<div class="mrc-body"><div class="mrc-who">' + r.who + '</div><div class="mrc-text">' + r.text + '</div></div></div>'
      + '<div class="mr-bot">' + av(C.initial) + '<div class="mrb-body"><div class="mrb-who">' + C.name + ' <span class="mrb-tag">' + ic("bubble", 11) + ' ответ Pennedly</span></div><div class="mrb-text">' + r.bot + '</div></div></div></div>';
    return parent + thread;
  }
  function previewInner(kind) {
    var reply = kind === "reply", s = reply ? SR.SAMPLE.duty : SR.SAMPLE.talk;
    return '<div class="sc-invoice">' + ic("sparkle", 13) + '<span>В твоём голосе · на основе <b>' + (reply ? "8 твоих постов и ветки комментариев" : "8 твоих недавних постов") + '</b>. Pennedly не выдумывает за тебя.</span></div>'
      + (reply ? replyThread() : mockPost(s))
      + '<div class="sc-when-fires">' + ic("clock", 14) + '<span>Сработает: <b>' + (reply ? "в течение 15 минут после нового комментария" : "завтра в 9:00, первым постом дня") + '</b></span></div>'
      + '<div class="sc-runnow-bar"><button class="btn btn--secondary btn--sm">' + ic("play", 14) + ' Прогнать сейчас</button><span class="rn-note">Создаст черновик прямо сейчас — никогда не публикует.</span></div>';
  }

  /* ════════════════════════ A · ЖИВОЙ БРИФ ════════════════════════
     The scenario is one written paragraph; key values are inline-editable
     «slots». No separate living-sentence + skeleton + form — the prose IS
     the form. */
  function slot(t, open) { return '<button class="brief-slot' + (open ? " is-open" : "") + '">' + t + '</button>'; }
  function lslot(t) { return '<span class="brief-slot brief-slot--lock">' + ic("lock", 11) + t + '</span>'; }

  function dirA(kind) {
    var reply = kind === "reply", prose, drawer, promise;
    if (reply) {
      prose = 'Когда под твоими постами на <span class="brief-who">@alex.makes</span> появляются комментарии, Pennedly '
        + lslot("проверяет их каждые 15 минут") + ' и готовит ответ ' + slot("всем, кроме троллей", true)
        + '. Звучит он ' + slot("по имени, с одним наблюдением и мягким вопросом") + ' — в твоём голосе.';
      drawer = '<div class="brief-drawer"><div class="bd-k">Кому отвечаем</div>'
        + sel("Всем, кроме троллей", ["Только тёплым и фанатам", "Всем, кроме троллей", "Только тем, кто задал вопрос"])
        + '<span class="field-hint" style="margin-top:8px;display:block">Тролли и явный спам отсекаются ещё до черновика — это одно из правил ниже.</span></div>';
      promise = '<span><b>Перед отправкой ты увидишь каждый ответ.</b> Pennedly кладёт черновик в «Активность» — пока ты не разрешишь, людям ничего не уходит.</span>';
    } else {
      prose = 'Pennedly опубликует короткий пост-вопрос ' + slot("каждое утро в 9:00", true) + ' '
        + slot("на тему «довести дело до конца»") + ' — в твоём голосе на <span class="brief-who">@alex.makes</span>.';
      drawer = '<div class="brief-drawer"><div class="bd-k">Когда публиковать</div>' + whenPostSeg() + '</div>';
      promise = '<span><b>Ты увидишь пост перед публикацией.</b> Pennedly готовит черновик — публикуешь его ты.</span>';
    }
    return topbar(NAME[kind]) + '<div class="brief-wrap">'
      + '<div class="brief-card"><div class="brief-eyebrow">' + ic("sparkle", 12) + ' Что будет происходить</div>'
      + '<p class="brief-prose">' + prose + '</p>' + drawer
      + '<div class="brief-promise">' + ic("eyecheck", 15) + promise + '</div></div>'
      + '<div class="brief-section"><div class="sc-prev-head"><span class="sc-prev-cap">' + ic("eye", 13) + ' Превью · так это прозвучит</span><button class="btn btn--ghost btn--sm">' + ic("repeat", 14) + ' Другой пример</button></div>'
      + '<div class="sc-prev-panel" style="margin-top:10px">' + previewInner(kind) + '</div></div>'
      + '<div class="brief-deeper-k">Глубже, если нужно</div>'
      + '<div class="brief-rows">' + rulesBlock(reply ? "duty" : "talk", false) + moreSettings(kind, false) + advancedBlock(kind, false) + '</div>'
      + '<div class="brief-foot">' + actions() + enableNote() + '</div>'
      + '</div>';
  }

  /* ════════════════════════ B · СТУДИЯ ПРЕВЬЮ ════════════════════════
     Calm settings on the left; a LARGE, device-framed live preview on the
     right is the hero — it does the convincing. */
  function group(k, inner) { return '<div class="set-group"><div class="set-k">' + k + '</div><div class="set-card">' + inner + '</div></div>'; }
  function studioStage(kind) {
    var reply = kind === "reply";
    return '<div class="studio-stage"><div class="stage-cap">' + ic("eye", 13) + ' Превью · так это увидят люди</div>'
      + '<div class="stage-frame"><div class="stage-bar"><span class="sb-dot"></span><span class="sb-t">' + (reply ? "Ответ под твоим постом · Threads" : "Пост в ленте · Threads") + '</span></div>'
      + (reply ? replyThread() : mockPost(SR.SAMPLE.talk))
      + '<div class="stage-foot">'
      + '<div class="stage-line">' + ic("sparkle", 13) + '<span>В твоём голосе · на основе <b>' + (reply ? "8 постов и ветки" : "8 твоих постов") + '</b></span></div>'
      + '<div class="stage-line">' + ic("clock", 13) + '<span>Сработает: <b>' + (reply ? "в течение 15 минут после комментария" : "завтра в 9:00") + '</b></span></div>'
      + '<div class="stage-run"><button class="btn btn--secondary btn--sm">' + ic("play", 14) + ' Прогнать сейчас</button><span class="rn-note">Только черновик — никогда не публикует.</span></div>'
      + '</div></div></div>';
  }
  function dirB(kind) {
    var reply = kind === "reply";
    var left = '<div class="studio-set">'
      + group("Когда сработает", reply ? whenReply() : whenPostSeg())
      + group("Что ты задаёшь", '<div class="sc-fieldset">' + (reply ? setReply() : setPost()) + '</div>')
      + '<div class="brief-rows">' + rulesBlock(reply ? "duty" : "talk", false) + moreSettings(kind, false) + advancedBlock(kind, false) + '</div>'
      + '<div class="brief-foot">' + actions() + enableNote() + '</div>'
      + '</div>';
    return topbar(NAME[kind]) + '<div class="studio">' + left + studioStage(kind) + '</div>';
  }

  /* ════════════════════════ C · ШАГИ ════════════════════════
     A numbered top-to-bottom journey. Each step collapses to a plain-language
     summary line; trust-building rules are their own visible step. */
  function step(n, title, summary, body, open) {
    return '<div class="step' + (open ? " step--open" : "") + '">'
      + '<div class="step-rail"><span class="step-num">' + n + '</span></div>'
      + '<div class="step-main"><button class="step-head"><div class="step-hd-txt"><div class="step-title">' + title + '</div>'
      + (open ? "" : '<div class="step-sum">' + summary + '</div>') + '</div><span class="step-chev">' + ic("chev", 16) + '</span></button>'
      + (open ? '<div class="step-body">' + body + '</div>' : "") + '</div></div>';
  }
  function dirC(kind) {
    var reply = kind === "reply";
    var s1sum = reply ? "Каждые 15 минут Pennedly проверяет новые комментарии" : "Каждое утро в 9:00, первым постом дня";
    var s2sum = reply ? "Кому отвечать и как звучит ответ" : "Тема дня";
    var s3body = inlineRules(reply ? "duty" : "talk")
      + '<div class="brief-rows" style="margin-top:6px">' + moreSettings(kind, false) + advancedBlock(kind, false) + '</div>';
    var s4body = '<div class="sc-prev-panel">' + previewInner(kind) + '</div><div class="brief-foot">' + actions() + enableNote() + '</div>';
    return topbar(NAME[kind])
      + '<div class="steps">'
      + step("1", "Когда сработает", s1sum, reply ? whenReply() : whenPostSeg(), false)
      + step("2", "Что ты задаёшь", s2sum, '<div class="sc-fieldset">' + (reply ? setReply() : setPost()) + '</div>', true)
      + step("3", "Что Pennedly добавит сам", "Проверенные правила поверх твоего голоса", s3body, true)
      + step("4", "Посмотри и включи", "Превью в твоём голосе · Прогнать сейчас", s4body, true)
      + '</div>';
  }

  /* ──────────────────────────────── MOUNT ──────────────────────────────── */
  set("dA-reply", frame(dirA("reply"), false));
  set("dA-post", frame(dirA("post"), false));
  set("dA-dark", frame(dirA("reply"), true));

  set("dB-reply", frame(dirB("reply"), false));
  set("dB-post", frame(dirB("post"), false));
  set("dB-dark", frame(dirB("reply"), true));

  set("dC-reply", frame(dirC("reply"), false));
  set("dC-post", frame(dirC("post"), false));
  set("dC-dark", frame(dirC("reply"), true));
})();
