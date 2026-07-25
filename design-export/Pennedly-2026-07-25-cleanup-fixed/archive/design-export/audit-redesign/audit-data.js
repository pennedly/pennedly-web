/* ===========================================================================
   Audit-Redesign-SPEC — data + icons
   All product copy is Russian (this user's UI locale). Account = the shared
   shell's canonical Mara Lin. Numbers are sample data. Strings tolerate the
   longer de/uk locales (cards reflow, never truncate).
   =========================================================================== */

/* ----------------------------------- icons ----------------------------------- */
function ic(d, s) { s = s || 16; return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>'; }
var ICONS = {
  studio:'<path d="M4 20l1-4L16 5a2 2 0 0 1 3 3L8 19z"/><path d="M14 7l3 3"/>',
  feed:'<rect x="4" y="5" width="16" height="4.5" rx="1.4"/><rect x="4" y="14.5" width="16" height="4.5" rx="1.4"/>',
  replies:'<path d="M5 6.5h14v8.5H10l-4 3.5v-3.5H5z"/>',
  at:'<circle cx="12" cy="12" r="3.4"/><path d="M15.4 12v1.6a2.4 2.4 0 0 0 4.1 1.4A8 8 0 1 0 15 19.4"/>',
  chart:'<path d="M5 19V5"/><path d="M5 19h14"/><rect x="8" y="11" width="2.6" height="5"/><rect x="13" y="7.5" width="2.6" height="8.5"/>',
  audit:'<path d="M8 4h8a1 1 0 0 1 1 1v1h1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h1V5a1 1 0 0 1 1-1Z"/><path d="M8.5 13.5l2.2 2.2 4.3-4.6"/>',
  study:'<path d="M5 5.5A1.5 1.5 0 0 1 6.5 4H18v13H6.5A1.5 1.5 0 0 0 5 18.5z"/><path d="M5 18.5A1.5 1.5 0 0 1 6.5 17H18v3H6.5A1.5 1.5 0 0 1 5 18.5z"/>',
  compass:'<circle cx="12" cy="12" r="8.2"/><path d="M15.4 8.6l-2 4.8-4.8 2 2-4.8z"/>',
  voice:'<rect x="9" y="3.5" width="6" height="11" rx="3"/><path d="M6 11.5a6 6 0 0 0 12 0M12 17.5V20M9 20h6"/>',
  autopilot:'<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/>',
  tags:'<path d="M4 10.5V5.5A1.5 1.5 0 0 1 5.5 4h5l8 8a1.5 1.5 0 0 1 0 2.1l-4.4 4.4a1.5 1.5 0 0 1-2.1 0l-8-8Z"/><circle cx="8" cy="8" r="1.2" fill="currentColor" stroke="none"/>',
  repeat:'<path d="M17 2.5 20.5 6 17 9.5"/><path d="M3.5 11V9a3 3 0 0 1 3-3h14"/><path d="M7 21.5 3.5 18 7 14.5"/><path d="M20.5 13v2a3 3 0 0 1-3 3h-14"/>',
  clock:'<circle cx="12" cy="12" r="8.2"/><path d="M12 7.5V12l3 1.8"/>',
  penline:'<path d="M4 20h16"/><path d="M5 16h2L16 7a1.6 1.6 0 0 0-2.3-2.3L5 13.5V16Z"/>',
  format:'<rect x="4" y="4.5" width="16" height="15" rx="2"/><path d="M4 9.5h16M9 9.5v10"/>',
  list:'<path d="M5 7.5l1.5 1.5L9 6M5 16.5l1.5 1.5L9 14M12.5 8h6.5M12.5 16h6.5"/>',
  chevD:'<path d="M6 9.5 12 15l6-5.5"/>',
  check:'<path d="M5 12.5 10 17.5 19 7"/>',
  x:'<path d="M6 6l12 12M18 6 6 18"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  power:'<path d="M12 4v8"/><path d="M7.5 7a7 7 0 1 0 9 0"/>',
  powerOff:'<path d="M12 4v6"/><path d="M8 8.5a6 6 0 1 0 8 0"/><path d="M5 5l14 14"/>',
  spark:'<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" fill="currentColor" stroke="none"/>',
  trend:'<path d="M4 16l5-5 3.5 3.5L20 7"/><path d="M15 7h5v5"/>',
  flat:'<path d="M5 12h14"/>',
  arrowUp:'<path d="M12 19V5"/><path d="M6 11l6-6 6 6"/>',
  arrowDown:'<path d="M12 5v14"/><path d="M6 13l6 6 6-6"/>',
  arrowRight:'<path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>',
  arrowLeft:'<path d="M19 12H5"/><path d="M11 18l-6-6 6-6"/>',
  alert:'<path d="M12 4.5 21 19.5H3L12 4.5Z"/><path d="M12 10.5v4M12 17.4v.1"/>',
  info:'<circle cx="12" cy="12" r="8.2"/><path d="M12 11v5M12 8v.1"/>',
  moon:'<path d="M20 14.5A8 8 0 1 1 9.5 4 6.3 6.3 0 0 0 20 14.5z"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/>',
  settings:'<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.2l1.8-1.3-1.8-3.1-2.1.8a7 7 0 0 0-2-1.2l-.3-2.2H8.5l-.3 2.2a7 7 0 0 0-2 1.2l-2.1-.8L2.3 9.5l1.8 1.3A7 7 0 0 0 4 12a7 7 0 0 0 .1 1.2l-1.8 1.3 1.8 3.1 2.1-.8a7 7 0 0 0 2 1.2l.3 2.2h3.2l.3-2.2a7 7 0 0 0 2-1.2l2.1.8 1.8-3.1-1.8-1.3A7 7 0 0 0 19 12z"/>',
  nib:'<path d="M12 3.5 7 8.5l3 9 2 2 2-2 3-9z"/><circle cx="12" cy="11" r="1.2"/>',
  users:'<circle cx="9" cy="8.5" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><path d="M16 6a3 3 0 0 1 0 5.6M20.5 19a5.5 5.5 0 0 0-4-5.3"/>',
  sliders:'<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>'
};
function I(n, s) { return ic(ICONS[n] || '', s); }

/* --------------------------------- account ----------------------------------- */
var ACCT = { name: 'Mara Lin', handle: '@mara.lin', initials: 'ML' };

/* ------------------------------- 7 dimensions -------------------------------- */
/* in impact order (most impactful first). key, icon, label, sub-line. */
var DIMS = [
  { key:'topics',    ico:'tags',     label:'Темы',      sub:'Какие темы недели выстрелили, а какие просели' },
  { key:'scenarios', ico:'repeat',   label:'Сценарии',  sub:'Включить дремлющий, убрать слабый, поправить запуск' },
  { key:'timing',    ico:'clock',    label:'Тайминг',   sub:'Твой пик активности против того, когда ты постишь' },
  { key:'voice',     ico:'voice',    label:'Голос',     sub:'Тонкие правки голоса: правила, «в одном предложении»' },
  { key:'rules',     ico:'penline',  label:'Правила',   sub:'Добавить или поправить отдельное правило письма' },
  { key:'replies',   ico:'replies',  label:'Ответы',    sub:'Аудитория и охват ответов, как они греют читателя' },
  { key:'format',    ico:'format',   label:'Формат',    sub:'Текст против карусели, видео и треда' }
];

/* --------------------------- proposals (~13 cards) --------------------------- */
/* shape: 'diff' (before→after) | 'action' (a labeled action, no before/after).
   conf: high|med|low. expect: {dir, label}. high: a high-impact marker.
   status: undecided|applied|rejected. effect/effectLabel filled once applied.   */
var PROPOSALS = [
  /* ── Темы ── */
  { id:'t1', dim:'topics', high:true, shape:'diff',
    title:'Чаще пиши про утренние ритуалы и фокус',
    evidence:'3 поста по теме: медиана <b>4.1k</b> просмотров против твоих обычных <b>1.7k</b> — это <b>×2.4</b>.',
    diff:{ before:'Темы распределены поровну, без приоритета.', after:'Приоритет в подсказках — утренние ритуалы, ремесло, фокус.' },
    expect:{ dir:'up', label:'вовлечённость' }, conf:'high', status:'undecided' },
  { id:'t2', dim:'topics', shape:'action',
    title:'Реже предлагай посты про новости платформы',
    evidence:'4 поста про новости индустрии: медиана <b>0.9k</b> против <b>1.7k</b> — на <b>47%</b> ниже твоего среднего.',
    action:{ ico:'arrowDown', kind:'Понизить тему', label:'«Новости платформы» — реже в подсказках тем' },
    expect:{ dir:'up', label:'охват' }, conf:'med', status:'undecided' },

  /* ── Сценарии ── */
  { id:'s1', dim:'scenarios', high:true, shape:'action',
    title:'Включи сценарий «Дежурство»',
    evidence:'Сценарий дремлет 2 недели. За это время ты упустил <b>~9</b> окон для ответа в прайм-тайм.',
    action:{ ico:'power', kind:'Включить сценарий', label:'«Дежурство» — ответы на свежие комментарии в течение часа' },
    expect:{ dir:'up', label:'ответы' }, conf:'med', status:'undecided' },
  { id:'s2', dim:'scenarios', shape:'action',
    title:'Подними лимит ответов с 10 до 25 в день',
    evidence:'Сценарий «Тёплый отклик» пропустил <b>14</b> комментариев за неделю — упёрся в дневной лимит.',
    action:{ ico:'sliders', kind:'Изменить лимит', label:'Дневной лимит ответов: <span class="strong-num">10 → 25</span>' },
    expect:{ dir:'up', label:'охват ответов' }, conf:'high', status:'undecided' },
  { id:'s3', dim:'scenarios', shape:'diff',
    title:'Сузь аудиторию сценария «Дежурство»',
    evidence:'Сейчас он отвечает всем подряд; <b>62%</b> ответов уходят в нейтральные комментарии без отклика.',
    diff:{ before:'Отвечает на все новые комментарии под постом.', after:'Отвечает тем, кто делится своим опытом или задаёт вопрос.' },
    expect:{ dir:'up', label:'качество диалога' }, conf:'med', status:'undecided' },
  { id:'s4', dim:'scenarios', shape:'action',
    title:'Отключи сценарий «Кросс-постинг»',
    evidence:'6 запусков за месяц: медиана <b>0.4k</b> — в <b>4×</b> ниже твоего среднего по постам.',
    action:{ ico:'powerOff', kind:'Отключить сценарий', label:'«Кросс-постинг» — слабый канал, тянет среднее вниз', off:true },
    expect:{ dir:'up', label:'среднее по постам' }, conf:'med', status:'undecided' },

  /* ── Тайминг ── */
  { id:'tm1', dim:'timing', high:true, shape:'hours',
    title:'Сдвинь «Утренний пост» в вечернее окно',
    evidence:'Твой пик активности аудитории — <b>18:00–21:00</b>, а «Утренний пост» уходит в <b>9:00</b>, мимо пика.',
    hours:[ {t:'09:00', peak:false}, {t:'18:00', peak:true}, {t:'19:30', peak:true}, {t:'21:00', peak:true} ],
    hoursNote:'Сдвинуть запуск сценария на 19:00 по твоему времени.',
    expect:{ dir:'up', label:'просмотры' }, conf:'high', status:'undecided' },

  /* ── Голос ── */
  { id:'v1', dim:'voice', shape:'diff',
    title:'Убери мотивационные концовки',
    evidence:'Топ-посты заканчиваются на мысли; 5 слабых закрылись фразой вроде «ты справишься» — медиана <b>1.1k</b> против <b>1.7k</b>.',
    diff:{ before:'Пост может заканчиваться подбадривающей строкой для читателя.', after:'Пост заканчивается на мысли — без «ты справишься» и мотивационных концовок.' },
    expect:{ dir:'up', label:'вовлечённость' }, conf:'high', status:'undecided' },
  { id:'v2', dim:'voice', shape:'diff',
    title:'Уточни «в одном предложении»',
    evidence:'Посты, открытые конкретным моментом, собрали в среднем <b>×1.6</b> к твоим постам с определением в начале.',
    diff:{ before:'Мара пишет о ремесле, честно и тепло.', after:'Мара начинает с конкретного момента недели, потом выводит мысль — тепло, но без пафоса.' },
    expect:{ dir:'up', label:'дочитывания' }, conf:'med', status:'undecided' },

  /* ── Правила ── */
  { id:'r1', dim:'rules', shape:'action',
    title:'Добавь правило: не открывать пост определением',
    evidence:'5 постов начались с определения в первой строке: медиана <b>1.1k</b> против твоих <b>1.7k</b>.',
    action:{ ico:'plus', kind:'Добавить правило', label:'«Открывай пост сценой или моментом, а не определением темы»' },
    expect:{ dir:'up', label:'дочитывания' }, conf:'med', status:'undecided' },

  /* ── Ответы ── */
  { id:'rp1', dim:'replies', shape:'diff',
    title:'Твои ответы информируют, но не греют',
    evidence:'Из <b>38</b> ответов за неделю лишь <b>6</b> получили продолжение диалога — остальные закрыли тему.',
    diff:{ before:'Ответы дают точную справку и закрывают вопрос.', after:'Ответы цепляют деталь из комментария и оставляют зацепку для продолжения.' },
    expect:{ dir:'up', label:'продолжения диалога' }, conf:'med', status:'undecided' },
  { id:'rp2', dim:'replies', shape:'action',
    title:'Отвечай тем, кто делится своим опытом',
    evidence:'Ответы на «истории из опыта» собрали <b>×2.1</b> лайков к ответам на нейтральные комментарии.',
    action:{ ico:'users', kind:'Аудитория ответов', label:'Добавить в охват: «делится личным опытом по теме»' },
    expect:{ dir:'up', label:'тёплые диалоги' }, conf:'med', status:'undecided' },

  /* ── Формат ── */
  { id:'f1', dim:'format', shape:'action',
    title:'Попробуй карусель для разборов',
    evidence:'2 карусели за месяц: медиана <b>3.2k</b> против текстовых <b>1.7k</b> — <b>×1.9</b>. Но выборка мала.',
    action:{ ico:'format', kind:'Сменить формат', label:'Предлагать карусель для постов-разборов и пошаговых' },
    expect:{ dir:'up', label:'просмотры' }, conf:'low', status:'undecided' }
];

/* -------------------------- week review (wins/losses) ------------------------ */
var WINS = [
  { text:'Пост про утренние ритуалы',          num:'4.1k', unit:'просмотров', mult:'×2.4 среднего' },
  { text:'Тред о том, как ты режешь черновики', num:'312',  unit:'сохранений', mult:'×1.9 среднего' },
  { text:'Ранний ответ под постом коллеги',     num:'48',   unit:'ответов',    mult:'лучший за неделю' }
];
var LOSSES = [
  { text:'Пост про новости платформы',     num:'0.6k', unit:'просмотров', mult:'×0.4 среднего' },
  { text:'Вечерний пост-вопрос в 23:40',    num:'9',    unit:'ответов',    mult:'мимо пика' }
];
var REVIEW_CAVEAT = 'На этой неделе вышло <b>6 постов</b> — на пару меньше обычного. По форматам выводы держим осторожными.';

/* loop strip (3.4) */
var LOOP = { up:'+18%', metric:'к вовлечённости', window:'за месяц', rolled:2 };

/* --------------------------- header verdict copy ----------------------------- */
var HEADER = {
  period:'23–30 июня',
  verdict:'Неделя ровная: охваты держатся, но разговор просел.',
  signal:'flat',            // up | flat | down
  signalLabel:'ровно',
  conf:'med'                // high | med | low
};

/* ----------------------------- audit list rows ------------------------------- */
/* dims = the dimensions this week's audit touched (coverage indicator). */
var LIST = [
  { id:'a1', title:'Неделя 23–30 июня', range:'23–30 июня', summary:'Охваты держатся, разговор просел. 13 правок по 7 направлениям — от тем до тайминга.',
    posts:6, decided:0, total:13, wow:-2,
    dims:['topics','scenarios','timing','voice','rules','replies','format'] },
  { id:'a2', title:'Неделя 16–22 июня', range:'16–22 июня', summary:'Сильная неделя на ответах. Правки по голосу, таймингу и сценариям закрепили рост.',
    posts:9, decided:8, total:8, wow:12,
    dims:['voice','timing','scenarios','replies'] },
  { id:'a3', title:'Неделя 9–15 июня', range:'9–15 июня', summary:'Чистка тем и формата. Две правки зашли, одна не подошла голосу.',
    posts:8, decided:6, total:6, wow:5,
    dims:['topics','format','rules'] },
  { id:'a4', title:'Неделя 2–8 июня', range:'2–8 июня', summary:'Нашли лучшее окно для постинга и более острый стиль вопросов.',
    posts:7, decided:7, total:7, wow:9,
    dims:['timing','format','voice','replies'] },
  { id:'a5', title:'Неделя 26 мая – 1 июня', range:'26 мая – 1 июня', summary:'Мало данных: всего 3 поста. Базовые настройки голоса, без громких выводов.',
    posts:3, decided:2, total:3, wow:null,
    dims:['voice','topics'] }
];

window.AUDIT = { I, ICONS, ACCT, DIMS, PROPOSALS, WINS, LOSSES, REVIEW_CAVEAT, LOOP, HEADER, LIST };
