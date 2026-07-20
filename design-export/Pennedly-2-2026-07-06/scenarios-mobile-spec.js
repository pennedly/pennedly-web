/* scenarios-mobile-spec.js — builds every phone frame in Scenarios-Mobile-SPEC.html.
   Uses the shared shell (window.MOCK) + the shared mobile component layer
   (pennedly-mobile.css) + scenarios-mobile.css.

   REDESIGN — «РУТИННЫЙ АВТОПИЛОТ». A scenario = ONE form pre-filled by a real,
   shippable PRESET. Discover (preset gallery grouped by nature) → fill the one
   form → edit the 1–2 fields that ARE the intent → preview a real sample →
   run-now (DRAFT only) → switch on. The list is a CONTROL CENTER (week strip,
   per-day cap, stacking warnings, skip notes, cross-account apply). Every
   preset is REAL — no "soon". The rich «Акция» editor is PRESERVED as the
   «Акция» preset's form. All copy = the RU «Соня» (tarot) case. */
(function () {
  "use strict";
  var M = window.MOCK;
  var ic = function (id, s) { return '<svg style="width:' + s + 'px;height:' + s + 'px;display:block" aria-hidden="true"><use href="#i-' + id + '"/></svg>'; };
  /* custom glyphs not in the shared sprite */
  function cic(n, s) {
    s = s || 14;
    var v = 'style="width:' + s + 'px;height:' + s + 'px;display:block" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
    var P = {
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
      checkc: '<circle cx="12" cy="12" r="9"/><path d="M8.5 12.2l2.3 2.3 4.7-4.8"/>'
    };
    return '<svg ' + v + '>' + (P[n] || '') + '</svg>';
  }
  function set(id, html) { var e = document.getElementById(id); if (e) e.innerHTML = html; }
  function av(initials) { return '<span class="m-scn-av">' + initials + '</span>'; }
  function toggle(on, lg) { return '<span class="m-toggle' + (lg ? ' m-toggle--lg' : '') + (on ? ' is-on' : '') + '"><span class="m-toggle-knob"></span></span>'; }
  function selectEl(val, opts) { return '<select class="m-select" aria-label="select">' + opts.map(function (o) { return '<option' + (o === val ? ' selected' : '') + '>' + o + '</option>'; }).join('') + '</select>'; }
  function input(val, ph, err) { return '<input class="m-objname" style="border:1px solid ' + (err ? 'var(--color-danger)' : 'var(--color-border)') + ';background:var(--color-surface);width:100%;height:44px;font-size:16px;border-radius:var(--radius-md);padding:0 12px" value="' + val + '" placeholder="' + ph + '">'; }
  function field(label, control, hint, fkey, err) {
    var lbl = (fkey ? '<span class="m-scn-fkey">' + fkey + '</span>' : '') + label;
    return '<div class="m-field"><label>' + lbl + '</label>' + control
      + (hint ? '<div class="m-field-hint"' + (err ? ' style="color:var(--color-danger)"' : '') + '>' + hint + '</div>' : '') + '</div>';
  }
  function intro(h, sub) { return '<div class="m-scn-intro"><h1>' + h + '</h1><p>' + sub + '</p></div>'; }
  function prov(o) {
    if (o.prov === 'promo') return '<span class="m-scn-badge m-scn-badge--promo">' + ic('gift', 12) + 'Акция</span>';
    return '<span class="m-scn-badge m-scn-badge--sched">' + ic('clock', 11) + '<span class="tb-k">когда:</span> ' + o.sched + '</span>';
  }
  function impactPips(n) { var s = '<span class="m-scn-impact"><span class="ip-k">импакт</span>'; for (var i = 0; i < 3; i++) s += '<span class="ip' + (i < n ? ' on' : '') + '"></span>'; return s + '</span>'; }

  /* ════════════════ PRESET CATALOG ════════════════ */
  var P = {
    talk: { id: 'talk', name: 'Разговор дня', ico: cic('bubbleq', 19), group: 'core', face: true, reply: true, imp: 3, when: 'каждый день · утром', desc: 'Открытый вопрос дня первым постом — и тёплые авто-ответы каждому.' },
    column: { id: 'column', name: 'Рубрика', ico: cic('columns', 19), group: 'core', imp: 2, when: 'еженедельно', desc: 'Именованная регулярная колонка: один формат в один день.' },
    duty: { id: 'duty', name: 'Дежурство в комментах', ico: ic('bubble', 19), group: 'core', reply: true, imp: 3, when: 'на комментарии', desc: 'Авто-черновики содержательных ответов — вы их утверждаете.' },
    safety: { id: 'safety', name: 'Если сегодня не постил', ico: cic('shield', 19), group: 'periodic', imp: 2, when: 'ежедневно · если тихо', desc: 'Подстраховка: мягкий пост, если к отсечке ничего не вышло.' },
    thanks: { id: 'thanks', name: 'Спасибо за N', ico: cic('flag', 19), group: 'periodic', imp: 1, when: 'по событию', desc: 'Пост-благодарность на круглой отметке подписчиков.' },
    seasonal: { id: 'seasonal', name: 'Сезонное', ico: cic('seasonal', 19), group: 'periodic', imp: 1, when: 'в период дат', desc: 'Тема под праздник или сезон — только внутри окна дат.' },
    poll: { id: 'poll', name: 'Опрос', ico: cic('poll', 19), group: 'periodic', imp: 2, when: 'еженедельно', desc: 'Текстовый опрос: вопрос и 2–4 варианта.' },
    boost: { id: 'boost', name: 'Раскрутить залетевший', ico: cic('boost', 19), group: 'reactive', imp: 2, when: 'по событию · просмотры', desc: 'Пост перешёл порог просмотров → авто-фоллоуап.' },
    promo: { id: 'promo', name: 'Акция', ico: ic('gift', 19), group: 'campaign', reply: true, imp: 3, when: 'в период дат', desc: 'Розыгрыш: просим действие в комментах → выгода в ответ.', risk: true }
  };

  /* ════════════════ DISCOVERY ════════════════ */
  function presetCard(p) {
    var cls = 'm-scn-pcard' + (p.group === 'core' ? ' m-scn-pcard--core' : '') + (p.face ? ' m-scn-pcard--face' : '') + (p.group === 'campaign' ? ' m-scn-pcard--campaign' : '');
    var foot = p.risk
      ? '<div class="m-scn-pcard-foot"><span class="m-scn-risk">' + ic('alert', 12) + 'мощно, осторожно</span><span class="m-scn-nudge">' + ic('clock', 12) + '<code>≤2×/нед</code></span></div>'
      : '<div class="m-scn-pcard-foot"><span class="m-scn-pcard-when">' + ic('clock', 12) + p.when + '</span>' + impactPips(p.imp) + '</div>';
    return '<button class="' + cls + '"><div class="m-scn-pcard-top"><span class="m-scn-pcard-ico">' + p.ico + '</span>'
      + '<span class="m-scn-pcard-name">' + p.name + '</span><span class="m-scn-pcard-chev">' + ic('chev-right', 16) + '</span></div>'
      + '<div class="m-scn-pcard-desc">' + p.desc + '</div>' + foot + '</button>';
  }
  function group(title, note, presets, campaign) {
    var grid = '<div class="m-scn-pgrid">' + presets.map(presetCard).join('') + '</div>';
    if (campaign) grid = '<div class="m-scn-pcampaign">' + grid + '</div>';
    return '<div class="m-scn-pgroup"><div class="m-scn-pg-head"><span class="m-scn-pg-title">' + title + '</span><span class="m-scn-pg-note">' + note + '</span></div>' + grid + '</div>';
  }
  function discovery() {
    return intro('Сценарии', 'Выберите рутину — Pennedly запускает её в вашем голосе, в локальное время аккаунта.')
      + '<div class="m-scn-lede"><span class="ll-mark">' + ic('bubble', 17) + '</span><span class="ll-text"><b>Threads растит тех, кто отвечает больше, чем постит.</b> Начните с разговора и дежурства — посты подтянутся.</span></div>'
      + '<button class="btn btn--primary m-btn m-scn-basekit">' + ic('sparkle', 15) + ' Запусти базовый набор</button>'
      + group('Каждый день', 'ядро «отвечай больше, чем постишь»', [P.talk, P.column, P.duty])
      + group('Периодические', 'держат ритм, когда руки не дошли', [P.safety, P.thanks, P.seasonal, P.poll])
      + group('Реактивные', 'срабатывают на событие, не по часам', [P.boost])
      + group('Кампании', 'сильный инструмент — обдуманно', [P.promo], true)
      + '<button class="m-scn-scratch">' + ic('pencil', 14) + ' Или соберите сценарий с нуля</button>';
  }

  /* ════════════════ CONTROL-CENTER ════════════════ */
  var WK = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  function cadStrip(fire, cap, evt, evtLabel) {
    if (evtLabel) return '<div class="m-scn-cadence"><span class="m-scn-cad-cap">' + cic('bolt2', 13) + '<span class="cw">' + evtLabel + '</span></span></div>';
    var days = '<div class="m-scn-cad-days">' + WK.map(function (d, i) { return '<span class="m-scn-cad-day' + (fire[i] ? ' fire' + (evt ? ' fire--evt' : '') : '') + '">' + d + '</span>'; }).join('') + '</div>';
    return '<div class="m-scn-cadence">' + days + '<span class="m-scn-cad-cap">' + ic('clock', 12) + '<span class="cw">' + cap + '</span></span></div>';
  }
  function ccCard(o) {
    return '<div class="m-scncard' + (o.on ? ' is-on' : ' is-off') + '">'
      + '<div class="m-scncard-head"><span class="m-scncard-ico">' + (o.ico || ic('repeat', 19)) + '</span>'
      + '<div class="m-scncard-titles"><div class="m-scncard-name">' + o.name + '</div>'
      + '<div class="m-scncard-badges">' + prov(o) + '<span class="m-scncard-state">' + (o.on ? 'Включён' : 'Выключен') + '</span></div></div>'
      + '<span class="m-scncard-toggle">' + toggle(o.on) + '</span></div>'
      + '<div class="m-scncard-desc">' + o.desc + '</div>'
      + cadStrip(o.fire || [1, 1, 1, 1, 1, 0, 0], o.cap, o.evt, o.evtLabel)
      + '<div class="m-scncard-runs"><div class="m-scncard-run"><span class="k">след. запуск</span><span class="v' + (o.on ? '' : ' muted') + '">' + (o.on ? o.next : '— на паузе') + '</span></div>'
      + '<div class="m-scncard-run"><span class="k">последний</span><span class="v' + (o.last ? '' : ' muted') + '">' + (o.last || 'ещё не было') + '</span></div></div>'
      + (o.runs != null ? '<span class="m-scn-runcount">' + ic('repeat', 12) + 'сработал <b>' + o.runs + '</b> раз</span>' : '')
      + (o.skip ? '<div class="m-scn-skip">' + ic('alert', 14) + '<span><b>Вчера пропущен.</b> ' + o.skip + '</span></div>' : '')
      + '<div class="m-scn-cardacts"><button class="m-scn-apply">' + ic('users', 15) + ' Применить к…</button><a class="btn btn--secondary m-btn" style="flex:1 1 0">Открыть</a></div>'
      + '</div>';
  }
  var CC = {
    talk: { name: 'Разговор дня', ico: cic('bubbleq', 19), prov: 'sched', sched: 'каждый день', desc: 'Открытый вопрос дня + авто-ответы каждому.', on: true, fire: [1, 1, 1, 1, 1, 1, 1], cap: 'утром, 9:00', next: 'Завтра, 9:00', last: 'Сегодня, 9:02', runs: 38 },
    column: { name: 'Карта дня', ico: cic('columns', 19), prov: 'sched', sched: 'по будням', desc: 'Рубрика: одна карта дня с трактовкой.', on: true, fire: [1, 1, 1, 1, 1, 0, 0], cap: 'днём, 12:00', next: 'Завтра, 12:00', last: 'Сегодня, 12:00', runs: 21 },
    duty: { name: 'Дежурство в комментах', ico: ic('bubble', 19), prov: 'sched', sched: 'на комментарии', desc: 'Содержательные авто-черновики ответов.', on: true, fire: [1, 1, 1, 1, 1, 1, 1], cap: 'весь день', evt: true, next: 'По мере комментов', last: '11 мин назад', runs: 142 },
    safety: { name: 'Если сегодня не постил', ico: cic('shield', 19), prov: 'sched', sched: 'если тихо', desc: 'Мягкий пост, если к 19:00 ничего не вышло.', on: false, fire: [1, 1, 1, 1, 1, 1, 1], cap: 'отсечка 19:00', next: '', last: '12 июн', runs: 4, skip: 'Условие не выполнено — «Карта дня» уже вышла сегодня.' },
    promo: { name: 'Мини-разбор по дате', ico: ic('gift', 19), prov: 'promo', desc: 'Просим дату рождения → присылаем разбор.', on: true, fire: [1, 1, 1, 1, 1, 1, 1], cap: 'весь период', next: 'Завтра, 10:00', last: 'Сегодня, 10:01', runs: 6 }
  };
  function controlList() { return intro('Сценарии', 'Ваша неделя на автопилоте — одним взглядом.') + ccHead() + ccCard(CC.talk) + '<div style="height:12px"></div>' + ccCard(CC.column) + '<div style="height:12px"></div>' + ccCard(CC.duty) + '<div style="height:12px"></div>' + ccCard(CC.promo); }
  function ccHead() {
    return '<div class="m-scn-cchead"><span class="cc-k">' + ic('repeat', 13) + ' Неделя · локальное время</span>'
      + '<span class="m-scn-cap"><span class="m-scn-cap-l">Лимит/день</span><span class="m-scn-stepper"><button>' + ic('x', 14) + '</button><span class="sv">2</span><button>' + ic('plus', 14) + '</button></span></span></div>';
  }
  function warnStack() {
    return '<div class="m-scn-warn"><span class="sw-mark">' + ic('alert', 16) + '</span><div><div class="sw-title">3 пост-сценария метят в утро</div>'
      + '<div class="sw-sub"><b>Разговор дня</b>, <b>Карта дня</b> и <b>Сезонное</b> хотят выйти первым постом — при лимите 2 сработают два, третий сдвинется. Поднимите лимит или разнесите по времени.</div></div></div>';
  }
  function warnPromo() {
    return '<div class="m-scn-warn"><span class="sw-mark">' + ic('gift', 16) + '</span><div><div class="sw-title">«Мини-разбор» идёт каждый день</div>'
      + '<div class="sw-sub">Акции бьют сильнее, когда редки — <b>лучше ≤2×/нед</b>. Сузьте период, чтобы не выжечь аудиторию.</div></div></div>';
  }
  function warnAutopost() {
    return '<div class="m-scn-warn m-scn-warn--autopost"><span class="sw-mark">' + ic('alert', 16) + '</span><div><div class="sw-title">Автопостинг выключен для @sonya.tarot</div>'
      + '<div class="sw-sub">Вы включаете пост-сценарий, но Pennedly не опубликует посты, пока автопостинг выключен — будет только готовить черновики.</div>'
      + '<button class="btn btn--secondary m-btn">' + ic('settings', 14) + ' Включить автопостинг</button></div></div>';
  }
  function applySheet() {
    var accts = [['Sonya · Таро', '@sonya.tarot', true], ['Sonya Live', '@sonya.live', false], ['Дневник Таро', '@tarot.daily', false]];
    return '<div class="m-scrim"></div><div class="m-sheet"><div class="m-sheet-grip"></div>'
      + '<div class="m-sheet-head"><div class="m-sheet-title">Применить к…</div></div>'
      + '<div style="font-size:var(--text-caption);color:var(--color-text-subtle);margin:0 2px 8px">Скопировать «Мини-разбор по дате» на аккаунты. Времена пересчитаются в их локальную зону.</div>'
      + accts.map(function (a) { return '<div class="m-scn-acct">' + toggle(a[2]) + '<span class="ac-name">' + a[0] + '</span><span class="ac-h">' + a[1] + '</span></div>'; }).join('')
      + '<div style="display:flex;flex-direction:column;gap:10px;margin-top:14px"><button class="btn btn--primary m-btn">' + ic('check', 15) + ' Применить к 1</button><button class="btn btn--secondary m-btn">Отмена</button></div></div>';
  }

  /* list states */
  function skelCard() {
    return '<div class="m-scncard skeleton" style="margin-bottom:12px">'
      + '<div class="m-scncard-head"><span class="skel-line" style="width:38px;height:38px;border-radius:10px;flex:0 0 auto"></span>'
      + '<div style="flex:1 1 auto"><span class="skel-line" style="width:70%;height:15px"></span><span class="skel-line" style="width:40%;height:11px;margin-top:9px"></span></div>'
      + '<span class="skel-line" style="width:46px;height:28px;border-radius:9999px;flex:0 0 auto"></span></div>'
      + '<span class="skel-line" style="width:100%;height:28px;border-radius:6px"></span>'
      + '<div style="border-top:1px solid var(--color-border);padding-top:13px;display:flex;gap:22px"><span class="skel-line" style="width:84px;height:13px"></span><span class="skel-line" style="width:96px;height:13px"></span></div></div>';
  }
  function listLoading() { return intro('Сценарии', 'Ваша неделя на автопилоте — одним взглядом.') + skelCard() + skelCard() + skelCard(); }
  function listError() {
    return intro('Сценарии', 'Ваша неделя на автопилоте — одним взглядом.')
      + '<div class="m-error"><span class="eb-mark">' + ic('alert', 18) + '</span><div><div class="eb-title">Не удалось загрузить сценарии</div>'
      + '<div class="eb-sub">Что-то пошло не так при обращении к Threads. Ваши сценарии в безопасности.</div>'
      + '<button class="btn btn--secondary m-btn">' + ic('repeat', 15) + ' Повторить</button></div></div>';
  }

  /* ════════════════ PREVIEW ════════════════ */
  var SAMPLE = {
    talk: { primed: 'вашем голосе + 6 постах', fires: 'Завтра в 9:00 — первым постом', time: '9:00', post: 'Вопрос на сегодня: что вы откладываете не потому, что трудно, а потому, что страшно начать? Напишите одним словом — отвечу каждому 🌙', stats: ['1,4K', '96', '54'], reply: { who: 'Марина', text: 'Разговор с мамой…', bot: 'Марина, страх часто живёт там, где важнее всего быть услышанным. Один шаг: начните с одной фразы, которую давно держите. Что это за фраза?' } },
    column: { primed: 'вашем голосе + рубрике «Карта дня»', fires: 'Завтра в 12:00 — первым постом', time: '12:00', post: 'Карта дня — Восьмёрка Жезлов 🔥 День ускоряется: то, что откладывали, сдвинется. Совет дня: ответьте на одно письмо, которое избегаете.', stats: ['940', '71', '12'] },
    duty: { primed: 'вашем голосе + ветке под постом', fires: 'Когда под постом появится содержательный комментарий', time: 'сейчас', reply: { who: 'Дима', text: 'А если карта «перевёрнутая» — плохо?', bot: 'Дима, «перевёрнутая» — не приговор, а оттенок: та же энергия, но с задержкой. Скорее «пока рано». В каком вопросе она выпала?' } },
    safety: { primed: 'вашем голосе + тихом дне', fires: 'Сегодня в 19:00 — если за день ничего не вышло', time: '19:00', post: 'День выдался тихим — а вечер хорош для честного вопроса к себе: что из сегодняшнего забрать с собой, а что оставить здесь?', stats: ['610', '48', '9'] },
    seasonal: { primed: 'вашем голосе + теме «Новолуние»', fires: 'Каждый день периода 28 июн — 5 июл, утром', time: '9:00', post: 'Новолуние — время не итогов, а намерений 🌑 Что вы хотите начать в этом цикле? Сформулируйте одно желание так, будто оно уже сбылось.', stats: ['1,1K', '88', '40'] },
    poll: { primed: 'вашем голосе + теме недели', fires: 'Каждый четверг в 18:00', time: '18:00', poll: ['О чём сделать большой разбор?', ['Деньги и поток', 'Отношения', 'Призвание', 'Тень и страхи']] },
    boost: { primed: 'залетевшем посте + вашем голосе', fires: 'Когда пост перейдёт порог просмотров', time: '+3 часа', post: 'Вижу, вчерашний пост про страх начать отозвался у многих 🙏 Короткое продолжение: страх — это не стоп-сигнал, а компас. Куда он показывает у вас?', stats: ['8,7K', '410', '180'] },
    promo: { cta: 'Напишите в комментариях <b>свою дату рождения</b> 🌙 — пришлю <b>короткий мини-разбор</b> прямо в ответ. Подпишитесь, чтобы не потерять свой.', primed: 'вашем голосе + механике откликов', fires: 'Каждый день периода, в 10:00', time: '10:00', post: 'Сегодня звёзды на вашей стороне ✨ Напишите в комментариях свою дату рождения — пришлю короткий мини-разбор лично вам. Подпишитесь, чтобы не пропустить свой.', stats: ['1,2K', '84', '37'], reply: { who: 'Аня', text: '14.03.1996 🙏', bot: 'Аня, ваш день рождения говорит о тяге к свободе и глубоким разговорам. Сегодня хороший день начать то, что давно откладывали.' } }
  };
  function pollBlock(q, opts) {
    return '<div style="font-size:var(--text-small);line-height:1.55;color:var(--color-text);margin-bottom:10px">' + q + '</div>'
      + opts.map(function (o, i) { var pct = [42, 28, 19, 11][i] || 8; return '<div style="position:relative;border:1px solid var(--color-border);border-radius:var(--radius-md);padding:8px 11px;margin-bottom:7px;overflow:hidden;font-size:var(--text-small)"><span style="position:absolute;inset:0;width:' + pct + '%;background:color-mix(in srgb,var(--color-accent) 12%,transparent)"></span><span style="position:relative;display:flex;justify-content:space-between"><span>' + o + '</span><span style="color:var(--color-text-subtle)">' + pct + '%</span></span></div>'; }).join('');
  }
  function mockPost(s) {
    var body = s.poll ? pollBlock(s.poll[0], s.poll[1])
      : '<div class="m-autopost-text">' + s.post + '</div><div class="m-autopost-foot"><div class="m-autopost-stats"><span class="ms">' + ic('eye', 13) + ' ' + s.stats[0] + '</span><span class="ms">' + ic('heart', 13) + ' ' + s.stats[1] + '</span><span class="ms">' + ic('bubble', 13) + ' ' + s.stats[2] + '</span></div></div>';
    return '<div class="m-autopost"><div class="m-autopost-top">' + av('С') + '<div class="m-autopost-who"><span class="n">Соня</span><span class="h">@sonya.tarot</span></div><span class="m-autopost-time">' + s.time + '</span></div>' + body + '</div>';
  }
  function mockReply(r) {
    return '<div class="m-autoreply" style="margin-top:12px"><div class="m-ar-comment"><span class="m-ar-av">' + r.who[0] + '</span><div><div class="m-ar-who">' + r.who + '</div><div style="font-size:var(--text-small);color:var(--color-text-muted);margin-top:1px">' + r.text + '</div></div></div>'
      + '<div style="display:flex;gap:9px;margin-top:11px;padding-left:13px"><span class="m-ar-av">С</span><div><div style="display:flex;align-items:center;gap:7px;font-size:var(--text-caption);font-weight:600;margin-bottom:3px">Соня <span style="color:var(--color-accent);display:inline-flex;align-items:center;gap:4px">' + ic('bubble', 11) + ' авто-ответ</span></div>'
      + '<div style="font-size:var(--text-small);color:var(--color-text);line-height:1.55">' + r.bot + '</div></div></div></div>';
  }
  function previewSection(p, opts) {
    opts = opts || {};
    var s = SAMPLE[p.id];
    var body;
    if (opts.state === 'loading') {
      body = '<div class="m-scn-prevload"><span class="skel-line" style="width:44%;height:11px"></span><span class="skel-line" style="width:100%;height:13px"></span><span class="skel-line" style="width:88%;height:13px"></span><span class="skel-line" style="width:100%;height:70px;border-radius:10px;margin-top:6px"></span></div>';
    } else {
      body = (s.cta ? '<div class="m-scn-prevcta"><div class="k">Собранный призыв</div><div class="txt">' + s.cta + '</div></div>' : '')
        + '<div class="m-scn-primed">' + ic('sparkle', 13) + '<span>Грунтован на <b>' + s.primed + '</b> — Pennedly не выдумывает за вас.</span></div>'
        + (opts.runResult ? '<div class="m-scn-draftnote">' + cic('checkc', 16) + '<span>Черновик создан<span class="dn-sub">Ничего не опубликовано. Найдёте его в Студии.</span></span></div>' : '')
        + (s.post || s.poll ? mockPost(s) : '')
        + (s.reply ? mockReply(s.reply) : '')
        + '<div class="m-scn-whenfires">' + ic('clock', 14) + '<span>Сработает: <b>' + s.fires + '</b></span></div>'
        + (opts.runResult ? '' : '<div class="m-scn-runnow"><button class="btn btn--secondary m-btn">' + cic('play', 14) + ' Прогнать сейчас</button><div class="rn-note">Создаст черновик прямо сейчас — никогда не публикует.</div></div>');
    }
    return '<div class="m-ap2sec"><div class="m-scn-prevcap"><span class="cap">' + ic('sparkle', 13) + ' Живой предпросмотр</span>'
      + (opts.state === 'loading' ? '' : '<button class="btn btn--ghost m-btn" style="min-height:36px;padding:0 12px">' + ic('repeat', 14) + '</button>') + '</div>'
      + '<div class="m-ap2body">' + body + '</div></div>';
  }

  /* ════════════════ FORM ════════════════ */
  function whenSection(p, opts) {
    opts = opts || {};
    var mode = p.id === 'column' || p.id === 'poll' ? 'weekly'
      : p.id === 'seasonal' || p.id === 'promo' ? 'dates'
        : p.id === 'boost' || p.id === 'thanks' || p.id === 'duty' ? 'event'
          : opts.everyN ? 'everyn' : 'daily';
    var segs = [['daily', 'Ежедневно'], ['everyn', 'Раз в N дней'], ['weekly', 'Еженедельно'], ['dates', 'В период дат'], ['event', 'По событию']];
    var seg = '<div class="m-scn-seg" style="flex-wrap:wrap">' + segs.map(function (z) { return '<button class="m-scn-segbtn' + (z[0] === mode ? ' is-on' : '') + '" style="flex:1 1 30%">' + z[1] + '</button>'; }).join('') + '</div>';
    var body = '';
    if (mode === 'daily') body = '<div class="m-scn-schedhint">' + ic('clock', 14) + ' Завтра в 9:00 — первым постом дня</div>';
    else if (mode === 'everyn') body = '<div class="m-scn-everyn">Каждые ' + selectEl('3', ['2', '3', '5', '7']) + ' дня — первым постом</div>';
    else if (mode === 'weekly') body = '<div style="display:flex;flex-direction:column;gap:11px;margin-top:12px"><div class="m-scn-weekdays">' + WK.map(function (d, i) { return '<span class="m-scn-wd' + (i === (p.id === 'poll' ? 3 : 1) ? ' on' : '') + '">' + d + '</span>'; }).join('') + '</div><div class="m-scn-schedhint">' + ic('clock', 14) + (p.id === 'poll' ? ' Каждый четверг в 18:00' : ' Каждый вторник в 12:00') + '</div></div>';
    else if (mode === 'dates') body = '<div class="m-scn-daterange" style="margin-top:12px"><div class="m-field" style="margin:0">' + '<label>Начало</label>' + input('28 июн 2026', '') + '</div><div class="m-field" style="margin:0"><label>Конец</label>' + input('5 июл 2026', '') + '</div></div>';
    else if (mode === 'event') {
      var evtTxt = p.id === 'boost' ? 'Когда ваш пост <b>перейдёт порог просмотров</b>' : p.id === 'thanks' ? 'Когда вы <b>наберёте круглую отметку подписчиков</b>' : 'Когда под постом появится <b>новый содержательный комментарий</b>';
      body = '<div class="m-scn-event" style="margin-top:12px"><div class="m-scn-event-ro"><span class="ev-ico">' + cic('bolt2', 16) + '</span><div><div class="ev-txt">' + evtTxt + '</div><span class="ev-lock">' + cic('lock', 11) + ' задано пресетом</span></div></div>';
      if (p.id === 'boost') body += '<div class="m-field" style="margin:0"><label>Порог просмотров</label>' + input(opts.empty ? '' : '5000', 'авто') + '<div class="m-field-hint">пусто = авто от вашей медианы (~3,2K)</div></div>';
      if (p.id === 'thanks') body += '<div class="m-field" style="margin:0"><label>Каждые N подписчиков</label>' + input('1000', '') + '<div class="m-field-hint">или список: 10K, 25K, 50K</div></div>';
      body += '</div>';
    }
    var roNote = mode === 'event' ? ' · по событию' : '';
    return '<div class="m-ap2sec"><div class="m-ap2head"><div><div class="t"><span class="m-scn-fkey">когда</span>Расписание' + (roNote ? '<span style="font-weight:400;color:var(--color-text-subtle)">' + roNote + '</span>' : '') + '</div><div class="s">' + (mode === 'event' ? 'Реагирует на событие, не на часы. Локальное время аккаунта.' : 'В локальном времени аккаунта (UTC+1).') + '</div></div></div>'
      + '<div class="m-ap2body">' + seg + body + '</div></div>';
  }

  function minimalSection(p, opts) {
    opts = opts || {}; var E = opts.empty; var rows = '';
    if (p.id === 'talk') rows = field('Тема дня <span style="font-weight:400;color:var(--color-text-subtle)">· необязательно</span>', input(E ? '' : 'про страх начать', 'пусто — подберём сами'), 'Одно слово задаёт настроение. Пусто = свободная тема.');
    else if (p.id === 'column') rows = field('Имя рубрики', input(E ? '' : 'Карта дня', 'напр., Карта дня')) + field('Тема-столп', input(E ? '' : 'одна карта Таро + совет', 'о чём рубрика, в одной строке'), 'Постоянный формат из выпуска в выпуск.');
    else if (p.id === 'duty') rows = field('Кому отвечаем', selectEl('Все, кроме троллей', ['Только фанатам и тёплым', 'Все, кроме троллей', 'Только тем, кто задал вопрос']), 'Pennedly готовит черновик — вы утверждаете в «Ответах».');
    else if (p.id === 'safety') rows = field('Час отсечки', selectEl('19:00', ['16:00', '18:00', '19:00', '20:00', '21:00']), 'Если к этому часу за день не вышло постов — готовим мягкий пост.');
    else if (p.id === 'seasonal') rows = field('Повод', input(E ? '' : 'Новолуние', 'напр., Новолуние, 8 марта'), 'Период дат — в «Расписании» выше.');
    else if (p.id === 'poll') rows = field('Вопрос', input(E ? '' : 'О чём сделать большой разбор?', '')) + '<div class="m-field"><label>Варианты <span style="font-weight:400;color:var(--color-text-subtle)">· 2–4</span></label><div class="m-scn-poll">' + ['Деньги и поток', 'Отношения', 'Призвание', 'Тень и страхи'].slice(0, E ? 2 : 4).map(function (o, i) { return '<div class="m-scn-poll-opt"><span class="po-n">' + (i + 1) + '</span>' + input(E ? '' : o, '') + '<button class="po-del">' + ic('x', 14) + '</button></div>'; }).join('') + '<button class="btn btn--secondary m-btn" style="align-self:flex-start;min-height:40px;margin-top:2px">' + ic('plus', 14) + ' Вариант</button></div></div>';
    else if (p.id === 'boost') rows = '<div style="font-size:var(--text-small);color:var(--color-text-subtle);line-height:1.5">Порог и условие заданы в «Расписании» выше — это и есть весь сценарий.</div>';
    else if (p.id === 'thanks') rows = '<div style="font-size:var(--text-small);color:var(--color-text-subtle);line-height:1.5">Лестница отметок задана в «Расписании» выше.</div>';
    else if (p.id === 'promo') rows = field('Что просим написать в комментах', input(E ? '' : 'свою дату рождения', 'напр., свою дату рождения', opts.err), opts.err ? 'Заполните это поле — без него не собрать призыв.' : 'Одно короткое действие. Попадёт прямо в призыв.', null, opts.err)
      + field('Что даём взамен', input(E ? '' : 'короткий мини-разбор прямо в комментах', 'напр., короткий мини-разбор'), 'Чем понятнее выгода, тем больше откликов.')
      + '<div class="m-scn-trow"><div class="lbl"><div class="t">' + ic('users', 14) + ' Требовать подписку</div><div class="d">Отвечаем только подписчикам.</div></div>' + toggle(!E) + '</div>'
      + '<div class="m-scn-trow"><div class="lbl"><div class="t">' + ic('heart', 14) + ' Требовать лайк</div><div class="d">Отвечаем только если лайкнули пост.</div></div>' + toggle(false) + '</div>';
    var title = p.id === 'promo' ? 'Механика акции' : p.id === 'duty' ? 'Кого дежурить' : 'Что вы задаёте';
    var sub = p.id === 'promo' ? 'Сердце акции — из него соберётся призыв и как отвечать.' : 'Только то, что нельзя угадать за вас.';
    return '<div class="m-ap2sec"><div class="m-ap2head"><div><div class="t"><span class="m-scn-fkey">что</span>' + title + '</div><div class="s">' + sub + '</div></div></div><div class="m-ap2body">' + rows + '</div></div>';
  }

  var BAKED = {
    talk: ['Вопрос открытый, личный, на одно слово в ответ.', 'Без эзотерических клише и «продающих» формулировок.', 'Авто-ответ по имени, 1–2 наблюдения, мягкий вопрос.', 'Не больше одного разговора в день.'],
    column: ['Один и тот же зачин рубрики — её узнают.', 'Трактовка простыми словами, 2–3 предложения.', 'Всегда один практический совет в конце.'],
    duty: ['Отвечаем только содержательно; на пустые «спасибо» — реакция.', 'По имени, по сути, без шаблонов.', 'Тролли отсеиваются до черновика.', 'Каждый ответ — черновик; публикуете вы.'],
    safety: ['Срабатывает, только если за день не вышло постов.', 'Тон мягкий, вечерний — честный вопрос, не «затычка».', 'Не дублирует тему сегодняшних постов.'],
    thanks: ['Благодарность личная и конкретная, без пафоса.', 'Один пост на отметку — не спамим числами.'],
    seasonal: ['Тема живёт только внутри окна дат.', 'Повод вплетается в ваш голос, без штампов.'],
    poll: ['Варианты короткие и взаимоисключающие.', 'Вопрос приглашает к мнению, а не к «угадайке».'],
    boost: ['Фоллоуап выходит, пока тема горячая, ссылается по смыслу.', 'Не повторяет исходный пост — продолжает мысль.', 'Один фоллоуап на залетевший пост.'],
    promo: ['Призыв — одно действие в комментах и понятная выгода.', 'Авто-ответ персональный, по имени, без копипасты.', 'Уважает требования подписки/лайка.', 'Частит мягко — Pennedly придержит при перегрузе.']
  };
  function bakedSection(p, open) {
    var rules = BAKED[p.id] || [];
    return '<div class="m-scn-baked' + (open ? ' is-open' : '') + '"><button class="m-scn-baked-head"><span class="bh-ico">' + cic('lock', 15) + '</span><span class="bh-t">Что зашьётся</span><span class="bh-chev">' + ic('chev-right', 16) + '</span></button>'
      + (open ? '<div class="m-scn-baked-body"><p class="m-scn-baked-intro">Проверенные правила пресета поверх вашего голоса. Читать можно, менять — нет.</p>'
        + rules.map(function (r) { return '<div class="m-scn-baked-rule"><span class="br-ico">' + ic('check', 14) + '</span><span>' + r + '</span></div>'; }).join('')
        + '<div class="m-scn-baked-foot">' + cic('lock', 12) + ' Только для чтения · поверх — ваш голос</div></div>' : '') + '</div>';
  }
  function replySection(p, opts) {
    opts = opts || {};
    var val = opts.empty ? '' : (p.id === 'promo' ? 'Отвечай тепло, по имени. 1–2 наблюдения по дате, без клише, мягкий вопрос.' : 'Отвечай по сути, по имени, одно наблюдение и мягкий вопрос. Без шаблонов.');
    return '<div class="m-ap2sec"><div class="m-ap2head"><div><div class="t"><span class="m-scn-fkey">как отвечать</span>Ответы в комментах</div><div class="s">Базовое правило зашито; ниже — ваша правка.</div></div></div>'
      + '<div class="m-ap2body"><div class="m-scn-baked" style="margin-bottom:13px"><div class="m-scn-baked-body" style="padding:12px 13px"><p class="m-scn-baked-intro" style="margin:0 0 8px">Зашитое правило</p><div class="m-scn-baked-rule" style="border:none;padding:0"><span class="br-ico">' + cic('lock', 13) + '</span><span>Только содержательно, по имени, без шаблонов; тролли отсеяны.</span></div></div></div>'
      + '<div class="m-field" style="margin:0"><label>' + ic('pencil', 13) + ' Ваша правка <span style="font-weight:400;color:var(--color-text-subtle)">· поверх зашитого</span></label><textarea class="m-ob-ta" placeholder="напр., по имени, 1–2 наблюдения и мягкий вопрос">' + val + '</textarea></div></div></div>';
  }
  function discloseSection(p, opts) {
    opts = opts || {}; var open = opts.disclose;
    var trig = p.id === 'boost' ? 'Когда пост перейдёт N просмотров' : p.id === 'duty' ? 'На новый комментарий' : p.id === 'thanks' ? 'Когда наберётся N подписчиков' : p.id === 'column' || p.id === 'poll' ? 'Еженедельно' : p.id === 'seasonal' || p.id === 'promo' ? 'В период дат' : 'Ежедневно';
    return '<div class="m-scn-disclose' + (open ? ' is-open' : '') + '"><button class="m-scn-disclose-head"><span class="dh-ico">' + ic('chev-right', 16) + '</span><span class="m-scn-disclose-t">Показать как сценарий</span><span class="m-scn-disclose-hint">' + (open ? 'сырые поля' : 'для продвинутых') + '</span></button>'
      + (open ? '<div class="m-scn-disclose-body"><div class="m-scn-disclose-note">Та же рутина сырой моделью. Поля связаны с формой выше.</div>'
        + field('Триггер', selectEl(trig, ['Ежедневно', 'Раз в N дней', 'Еженедельно', 'В период дат', 'Когда пост перейдёт N просмотров', 'На новый комментарий']), '', 'когда')
        + field('Условие <span style="font-weight:400;color:var(--color-text-subtle)">· необязательно</span>', selectEl('Без условия', ['Без условия', 'Только по будням', 'Только для подписчиков', 'Если за день не было постов']), '', 'если')
        + field('Действие', selectEl(p.reply && p.id !== 'promo' ? 'Ответ в комментариях' : 'Пост', ['Пост', 'Ответ в комментариях', 'Тред', 'Опрос']), '', 'сгенерировать')
        + '<div class="m-field" style="margin:0"><label><span class="m-scn-fkey">с инструкцией</span>Поверх голоса</label><textarea class="m-ob-ta">Зашитые правила пресета + ваши поля выше.</textarea></div></div>' : '') + '</div>';
  }
  function saveBar(opts) {
    opts = opts || {};
    var enable = opts.saving ? '<button class="btn btn--primary m-btn" aria-disabled="true"><span class="spinner"></span> Сохранение…</button>' : '<button class="btn btn--primary m-btn">' + ic('check', 15) + ' Сохранить и включить</button>';
    var save = opts.saving ? '<button class="btn btn--secondary m-btn" aria-disabled="true">Сохранение…</button>' : '<button class="btn btn--secondary m-btn">Сохранить</button>';
    var del = opts.existing ? '<button class="btn btn--ghost m-btn m-scn-delete">' + ic('trash', 15) + ' Удалить</button>' : '';
    return '<div class="m-ap2sec"><div class="m-scn-savebar">' + enable + save + del + '</div></div>';
  }
  function formBody(p, opts) {
    opts = opts || {};
    var nameVal = opts.empty ? '' : (CC[p.id] ? CC[p.id].name : p.name);
    if (p.id === 'promo' && !opts.empty) nameVal = 'Мини-разбор по дате рождения';
    var out = '<div class="m-ap2sec"><div class="m-ap2body">' + field('Название сценария', input(nameVal, 'напр., ' + p.name)) + '</div></div>';
    out += whenSection(p, opts);
    out += minimalSection(p, opts);
    out += '<div class="m-ap2sec"><div class="m-ap2body">' + bakedSection(p, opts.baked) + '</div></div>';
    if (p.reply) out += replySection(p, opts);
    out += '<div class="m-ap2sec"><div class="m-ap2body">' + discloseSection(p, opts) + '</div></div>';
    out += previewSection(p, opts);
    if (opts.err) out += '<div class="m-error"><span class="eb-mark">' + ic('alert', 18) + '</span><div><div class="eb-title">Не удалось сохранить</div><div class="eb-sub">Проверьте обязательные поля. Изменения не потеряны.</div></div></div>';
    out += saveBar(opts);
    return out;
  }
  function deleteSheet() {
    return '<div class="m-scrim"></div><div class="m-sheet m-csheet"><div class="m-sheet-grip"></div>'
      + '<div class="m-csheet-ico" style="background:color-mix(in srgb,var(--color-danger) 13%,var(--color-surface));border:1px solid color-mix(in srgb,var(--color-danger) 28%,transparent);color:var(--color-danger)">' + ic('trash', 20) + '</div>'
      + '<div class="m-csheet-title">Удалить сценарий?</div>'
      + '<div class="m-csheet-sub">«Мини-разбор по дате рождения» перестанет запускаться и будет удалён. Действие необратимо.</div>'
      + '<div class="m-csheet-actions"><button class="btn btn--danger m-btn">' + ic('trash', 15) + ' Удалить</button><button class="btn btn--secondary m-btn">Отмена</button></div></div>';
  }

  /* ══════════════════════════════ MOUNT ════════════════════════════════ */
  var topList = M.top({ title: 'Сценарии', menu: true, pill: 'success', pillText: '4 активны', action: 'plus' });
  var topListOff = M.top({ title: 'Сценарии', menu: true, action: 'plus' });
  var topNew = M.top({ title: 'Новый сценарий', menu: false, back: true });
  var topR = M.top({ title: 'Рубрика «Карта дня»', menu: false, back: true });
  var topReact = M.top({ title: 'Раскрутить залетевший', menu: false, back: true });
  var topDuty = M.top({ title: 'Дежурство', menu: false, back: true });
  var topPromo = M.top({ title: 'Мини-разбор по дате', menu: false, back: true });
  var topTalk = M.top({ title: 'Разговор дня', menu: false, back: true });

  set('stg-layout',
    M.col(M.light(), M.phone({ top: topList, body: controlList(), tabs: false }), 'Контроль-центр: лимит/день, полосы недели Пн–Вс, провенанс, «сработал N раз».') +
    M.col(M.dark(), M.phone({ dark: true, top: topList, body: controlList(), tabs: false }), 'Тот же экран, тёмные токены.'));

  set('stg-drawer',
    M.col(M.light('Drawer'), M.phone({ top: topList, body: controlList(), tabs: false, overlay: M.drawer('scenarios') }), 'Гамбургер → drawer; активная = Scenarios (repeat), Voice & automation, перед Autopilot.') +
    M.col(M.dark('Drawer · dark'), M.phone({ dark: true, top: topList, body: controlList(), tabs: false, overlay: M.drawer('scenarios') }), ''));

  set('stg-disco',
    M.col(M.light('Открытие · пресет-галерея'), M.phone({ top: topListOff, body: discovery(), tabs: false }), 'Пусто/вход = галерея реальных пресетов по группам + «Запусти базовый набор» + «с нуля».') +
    M.col(M.dark('· dark'), M.phone({ dark: true, top: topListOff, body: discovery(), tabs: false }), 'Каждый день подсвечено; Акция — в «Кампании» с риск-бейджем.'));

  set('stg-list',
    M.col(M.light('Карта · вкл + полоса недели'), M.comp(ccCard(CC.talk)), 'Полоса Пн–Вс (огонь = срабатывает), «сработал 38 раз», «Применить к…».') +
    M.col(M.light('Дежурство · reply (event-тинт)'), M.comp(ccCard(CC.duty)), 'Reply-сценарий: полоса success-тинт, «на комментарии».') +
    M.col(M.dark('На паузе + «почему не сработало» · dark'), M.comp(ccCard(CC.safety), { dark: true }), 'Выключен: приглушён, «— на паузе» + skip-note.'));
  set('stg-list-states',
    M.col(M.light('Загрузка'), M.phone({ top: topList, body: listLoading(), tabs: false }), 'Скелетоны повторяют раскладку карточки с полосой.') +
    M.col(M.dark('Ошибка · dark'), M.phone({ dark: true, top: topList, body: listError(), tabs: false }), 'Inline-баннер + «Повторить».'));

  set('stg-warn',
    M.col(M.light('Стэкинг-варнинги (называют жертв)'), M.comp('<div style="display:flex;flex-direction:column;gap:12px">' + warnStack() + warnPromo() + '</div>'), '«3 пост-сценария метят в утро» + «Акция ≤2×/нед».') +
    M.col(M.dark('Автопостинг выключен · dark'), M.comp(warnAutopost(), { dark: true }), 'Danger-инлайн при включении пост-сценария.') +
    M.col(M.light('Применить к… · sheet'), M.phone({ top: topList, body: controlList(), tabs: false, overlay: applySheet() }), 'Кросс-аккаунт клон — bottom sheet.'));

  set('stg-form-cadence',
    M.col(M.light('Кадэнс «Рубрика» · еженедельно'), M.phone({ top: topR, body: formBody(P.column, { existing: true }), tabs: false }), 'КОГДА = Еженедельно (пикер дня) + имя рубрики + тема-столп. Превью = пост рубрики.') +
    M.col(M.dark('· dark'), M.phone({ dark: true, top: topR, body: formBody(P.column, { existing: true }), tabs: false }), ''));

  set('stg-form-reactive',
    M.col(M.light('Реактивный «Раскрутить» · по событию'), M.phone({ top: topReact, body: formBody(P.boost, { existing: true }), tabs: false }), 'КОГДА = По событию (read-only + замок) + поле порога (пусто = авто от медианы).') +
    M.col(M.dark('· dark'), M.phone({ dark: true, top: topReact, body: formBody(P.boost, { existing: true }), tabs: false }), ''));

  set('stg-form-reply',
    M.col(M.light('Дежурство · reply-форма'), M.phone({ top: topDuty, body: formBody(P.duty, { existing: true }), tabs: false }), 'Аудитория + блок «Как отвечать». Превью = сэмпл авто-ответа.') +
    M.col(M.dark('· dark'), M.phone({ dark: true, top: topDuty, body: formBody(P.duty, { existing: true }), tabs: false }), ''));

  set('stg-form-promo',
    M.col(M.light('Акция · сохранённый редактор'), M.phone({ top: topPromo, body: formBody(P.promo, { existing: true }), tabs: false }), 'Что просим / что даём + тумблеры подписка-лайк. Превью = CTA + пост + отклик.') +
    M.col(M.dark('· dark'), M.phone({ dark: true, top: topPromo, body: formBody(P.promo, { existing: true }), tabs: false }), ''));

  set('stg-disclose',
    M.col(M.light('«Что зашьётся» раскрыто'), M.comp(bakedSection(P.talk, true)), 'Read-only проверенные правила поверх голоса.') +
    M.col(M.light('«Показать как сценарий» раскрыто'), M.comp('<div class="m-ap2sec"><div class="m-ap2body">' + discloseSection(P.talk, { disclose: true }) + '</div></div>'), 'Сырые КОГДА / ЕСЛИ / СГЕНЕРИРОВАТЬ внутри формы.') +
    M.col(M.dark('· dark'), M.comp('<div class="m-ap2sec"><div class="m-ap2body">' + discloseSection(P.boost, { disclose: true }) + '</div></div>', { dark: true }), ''));

  set('stg-preview',
    M.col(M.light('Предпросмотр + «Прогнать сейчас»'), M.comp(previewSection(P.talk, {})), 'Реальный сэмпл + «Грунтован на…» + «когда сработает» + run-now.') +
    M.col(M.dark('Результат прогона — ЧЕРНОВИК · dark'), M.comp(previewSection(P.column, { runResult: true }), { dark: true }), '«Прогнать сейчас» создаёт только черновик, никогда не публикует.'));

  set('stg-states',
    M.col(M.light('Раз в N дней + сохранение'), M.phone({ top: topTalk, body: formBody(P.talk, { existing: true, everyN: true, saving: true }), tabs: false }), 'Второй сегмент → поле N; save-кнопки со спиннером.') +
    M.col(M.light('Ошибка валидации'), M.phone({ top: topPromo, body: formBody(P.promo, { existing: true, err: true, state: 'loading' }), tabs: false }), 'Поле «что просим» подсвечено + баннер; превью-скелетон.') +
    M.col(M.dark('Удаление · sheet · dark'), M.phone({ dark: true, top: topPromo, body: formBody(P.promo, { existing: true }), tabs: false, overlay: deleteSheet() }), 'Подтверждение удаления — bottom sheet, danger сверху.'));

  set('stg-narrow',
    M.col(M.light('360 · галерея'), M.phone({ variant: 'sm', top: topListOff, body: discovery(), tabs: false }), 'Пресет-карты full-width, группы стопкой.') +
    M.col(M.light('360 · контроль-центр'), M.phone({ variant: 'sm', top: topList, body: controlList(), tabs: false }), 'Полоса недели держит 7 ячеек, лейблы не клипаются.') +
    M.col(M.dark('360 · форма Акция · dark'), M.phone({ variant: 'sm', dark: true, top: topPromo, body: formBody(P.promo, { existing: true }), tabs: false }), 'Сегмент переносится; поля 16px / ≥44px.'));
})();
