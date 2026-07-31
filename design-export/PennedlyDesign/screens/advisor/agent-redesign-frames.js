/* agent-redesign-frames.js — renders every live mockup in Agent-Redesign-SPEC.html */
(function(){
var V='viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
/* Paths copied VERBATIM from system/studio-icons.jsx (the shared 24-grid line set)
   except where noted. Nothing here is drawn by hand. Glyphs the repo has no
   counterpart for are not invented — the closest real one is reused and named. */
var P={
 advisor:'<path d="M4 16V7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H9l-4 4v-4Z"/><path d="M8 13l2.6-2.6 1.8 1.8L16 9"/><path d="M13.4 9H16v2.6"/>', /* IcAdvisor */
 up:'<path d="M12 19V6M6 11l6-6 6 6"/>', /* IcArrowUp */
 down:'<path d="M12 5v13M6 13l6 6 6-6"/>', /* IcArrowDown */
 eye:'<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.6"/>', /* IcEye */
 reply:'<path d="M9 7 4 12l5 5M4 12h9a6 6 0 0 1 6 6v1"/>', /* IcReply */
 replies:'<path d="M21 11.5a8 8 0 0 1-11.4 7.2L4 20l1.3-4.6A8 8 0 1 1 21 11.5Z"/>', /* IcReplies */
 clock:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>', /* IcClock */
 chart:'<path d="M4 19V5M4 19h16"/><path d="M8 16l3.5-4 3 2.5L19 8"/>', /* IcChart */
 nib:'<path d="M12 4c3 0 5 3 4.8 7-.2 3-2.2 6-4.8 8.5C9.4 17 7.4 14 7.2 11 7 7 9 4 12 4Z"/><circle cx="12" cy="10" r="1.4"/><path d="M12 12v6.5"/>', /* IcNib */
 layers:'<path d="M12 4 3 9l9 5 9-5-9-5Z"/><path d="M3 14l9 5 9-5"/>', /* mobile/sprite.js i-layers — studio-icons has no layers glyph */
 check:'<path d="M4.5 12.5 9.5 17.5 19.5 6.5"/>', /* IcCheck */
 alert:'<path d="M12 4 2.5 20.5h19L12 4Z"/><path d="M12 10v4.5"/><circle cx="12" cy="17.6" r="0.8" fill="currentColor" stroke="none"/>', /* IcAlert */
 refresh:'<path d="M4 5v5h5"/><path d="M4 10a8 8 0 1 1 1 7"/>', /* IcTweak — the set\'s only circular-arrow glyph */
 send:'<path d="M5 12h13M12 5l7 7-7 7"/>', /* IcSend */
 cal:'<rect x="4" y="5.5" width="16" height="15" rx="2.5"/><path d="M4 9.5h16M8.5 3.5v4M15.5 3.5v4"/>', /* mobile/sprite.js i-calendar */
 bolt:'<path d="M13 3 5 13h6l-1 8 8-10h-6l1-8Z"/>', /* IcBolt */
 voice:'<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>', /* IcVoice */
 overview:'<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>', /* IcOverview */
 bubble:'<path d="M5 5h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9l-4 3.5V6a1 1 0 0 1 1-1Z"/>', /* IcBubble — used for the conversation list; the repo has no history glyph */
 ext:'<path d="M14 5h5v5M19 5l-8 8M11 6H6.5A1.5 1.5 0 0 0 5 7.5v10A1.5 1.5 0 0 0 6.5 19h10A1.5 1.5 0 0 0 18 17.5V13"/>', /* IcExternal */
 undo:'<path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-4"/>', /* IcUndo */
 plus:'<path d="M12 5v14M5 12h14"/>', /* IcPlus */
 sparkle:'<path d="M12 4l1.6 4.8L18.5 10l-4.9 1.2L12 16l-1.6-4.8L5.5 10l4.9-1.2L12 4Z"/>', /* IcSparkle */
 settings:'<path d="M10.13 3.2 13.87 3.2 14.26 5.8 16.24 6.94 18.69 5.98 20.56 9.22 18.5 10.85 18.5 13.15 20.56 14.78 18.69 18.02 16.24 17.06 14.26 18.2 13.87 20.8 10.13 20.8 9.74 18.2 7.76 17.06 5.31 18.02 3.44 14.78 5.5 13.15 5.5 10.85 3.44 9.22 5.31 5.98 7.76 6.94 9.74 5.8Z"/><circle cx="12" cy="12" r="2.6"/>', /* IcSettings */
 sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/>' /* IcSun */
};
function ic(n,s){return '<svg width="'+(s||14)+'" height="'+(s||14)+'" '+V+'>'+(P[n]||'')+'</svg>';}
/* phone bars reference the real sprite, as mobile/sprite.js\'s header prescribes */
function sp(n,s){return '<svg width="'+(s||18)+'" height="'+(s||18)+'" viewBox="0 0 24 24"><use href="#i-'+n+'"/></svg>';}

/* ── atoms ─────────────────────────────────────────────── */
function user(t){return '<div class="ag-turn ag-turn--user"><div class="ag-bubble">'+t+'</div></div>';}
function agent(inner,time){return '<div class="ag-turn"><span class="ag-mark">'+ic('advisor',18)+'</span><div class="ag-body"><div class="ag-who"><b>Агент</b><time>'+(time||'14:32')+'</time></div>'+inner+'</div></div>';}
function metrics(a){return '<div class="ag-metrics">'+a.map(function(m){
 return '<div class="ag-metric'+(m.t?' ag-metric--'+m.t:'')+'"><div class="ag-metric-v">'+(m.i?ic(m.i,14):'')+m.v+'</div><div class="ag-metric-l">'+m.l+'</div></div>';}).join('')+'</div>';}
function grounded(a){return '<div class="ag-grounded"><span class="ag-grounded-lab">'+ic('layers',14)+'На основе</span>'+a.map(function(s){
 return '<a class="ag-src'+(s.empty?' ag-src--empty':'')+'" href="#">'+(s.i?ic(s.i,12):'')+'<b>'+s.n+'</b> · '+s.v+'</a>';}).join('')+'</div>';}
function sug(i,t,s,acts){return '<div class="ag-sug"><span class="ag-sug-ico">'+ic(i,17)+'</span><div class="ag-sug-b"><div class="ag-sug-t">'+t+'</div><div class="ag-sug-s">'+s+'</div><div class="ag-sug-a">'+acts+'</div></div></div>';}
function mode(k){return k==='review'
 ? '<span class="ag-mode ag-mode--review">'+ic('check',11)+'На ревью</span>'
 : '<span class="ag-mode ag-mode--live">'+ic('bolt',11)+'Сразу · можно отменить</span>';}
function diff(now,next){return '<dl class="ag-diff"><dt>Сейчас</dt><dd class="now">'+now+'</dd><dt>Станет</dt><dd class="next">'+next+'</dd></dl>';}
function act(o){
 var st=o.state||'idle';
 if(st==='done') return '<div class="ag-act ag-act--done"><div class="ag-done-row">'+ic('check',16)+'<span><span class="ag-done-t">'+o.doneT+'</span><span class="ag-done-m">'+o.doneS+'</span></span><span class="un"><button class="btn btn--ghost btn--sm">'+ic('undo',14)+'Отменить</button></span></div></div>';
 var ft;
 if(st==='busy') ft='<div class="ag-act-ft"><button class="btn btn--primary btn--sm"><span class="ag-spin"></span>Включаю…</button></div>';
 else if(st==='fail') ft='<div class="ag-act-ft"><button class="btn btn--secondary btn--sm">'+ic('undo',14)+'Повторить</button><span class="sp"></span><span style="font-size:12.5px;color:var(--color-danger)">Не удалось применить — настройки не изменились</span></div>';
 else ft='<div class="ag-act-ft"><button class="btn btn--primary btn--sm">'+o.cta+'</button><button class="btn btn--secondary btn--sm">Изменить</button><span class="sp"></span><button class="btn btn--ghost btn--sm">Не сейчас</button></div>';
 return '<div class="ag-act'+(st==='busy'?' ag-act--busy':'')+(st==='fail'?' ag-act--fail':'')+'">'
  +'<div class="ag-act-hd"><span class="ag-act-ico">'+ic(o.i,18)+'</span><div class="ag-act-hb"><div class="ag-act-kind">'+o.kind+'</div><div class="ag-act-t">'+o.t+'</div></div>'+mode(o.mode)+'</div>'
  +'<div class="ag-act-body">'+diff(o.now,o.next)+(o.warn?'<div class="ag-act-warn">'+ic('alert',14)+'<span>'+o.warn+'</span></div>':'')+'</div>'+ft+'</div>';}

function composer(ph,dis,ft){return '<div class="ag-composer"><div class="ag-composer-row"><textarea class="ag-input" rows="1" placeholder="'+(ph||'Спросите про рост — или поручите настроить')+'"></textarea><button class="ag-send"'+(dis?' disabled':'')+'>'+ic('send',18)+'</button></div>'
 +'<div class="ag-composer-ft">'+ic('layers',13)+'<span>'+(ft||'Читает вашу статистику, голос, посты и полученные ответы')+'</span><span class="sp"></span>'+ic('refresh',13)+'<button>Обновлено 8 минут назад</button></div></div>';}

/* ── composed regions ──────────────────────────────────── */
var BRIEF=[
 {t:'down',i:'down',v:'−18%',l:'Просмотры за 7 дней',q:'Почему упали просмотры?'},
 {t:'down',i:null,v:'3',l:'Поста за неделю — было 5',q:'Как вернуть ритм публикаций?'},
 {t:'up',i:'up',v:'+6%',l:'Доля ответов на ваши посты',q:'Что сработало в ответах?'},
 {t:null,i:'clock',v:'Вт 18:00',l:'Лучшее окно — свободно',q:'Запланировать пост на вторник?'}
];
function open_(){return '<div class="ag-open">'
 +'<div class="ag-open-hd"><h2>Что изменилось за неделю</h2><span>8 июля – 14 июля · обновлено 8 минут назад</span></div>'
 +'<div class="ag-brief">'+BRIEF.map(function(c){return '<button class="ag-card'+(c.t?' ag-card--'+c.t:'')+'"><span class="ag-card-v">'+(c.i?ic(c.i,15):'')+c.v+'</span><span class="ag-card-l">'+c.l+'</span><span class="ag-card-q">'+ic('advisor',13)+c.q+'</span></button>';}).join('')+'</div>'
 +'<div class="ag-lab">Или спросите иначе</div>'
 +'<div class="ag-open-more">'
 +'<button class="ag-chipq">'+ic('nib')+'Что опубликовать сегодня?</button>'
 +'<button class="ag-chipq">'+ic('voice')+'Проверь мой голос за месяц</button>'
 +'<button class="ag-chipq">'+ic('replies')+'Настрой автоответы</button>'
 +'</div></div>';}

var T1=user('Почему упали просмотры на этой неделе?')+agent(
 '<p>Просмотры действительно ниже, но провал <strong>уже, чем кажется</strong> — он собран из двух дней без публикаций, а не из общего спада.</p>'
 +metrics([{t:'down',i:'down',v:'−18%',l:'Просмотры за 7 дней'},{t:'down',v:'3',l:'Поста — было 5'},{t:'up',i:'up',v:'+6%',l:'Доля ответов'}])
 +'<p>Вторник и четверг остались пустыми, а оба поста в выходные собрали <strong>выше вашей средней</strong>. Доля ответов при этом выросла — читатели на месте, постов меньше. Это провал по <strong>объёму</strong>, не по качеству.</p>'
 +sug('nib','Вернуться к пяти постам в неделю','Два коротких поста в вашей интонации «признать ошибку» обычно перформят выше средней. Открыть черновик?','<button class="btn btn--secondary btn--sm">'+ic('ext',14)+'Открыть в Studio</button><button class="btn btn--ghost btn--sm">Показать данные</button>')
 +grounded([{n:'Статистика',v:'7 дней',i:'chart'},{n:'Посты',v:'12',i:'nib'},{n:'Полученные ответы',v:'148',i:'reply'},{n:'Топ-посты',v:'нет данных',empty:1}]),'14:32');

var T2=user('Включи автоответы, но только на вопросы')+agent(
 '<p>Могу. За последние 30 дней вам задали <strong>41 вопрос</strong>, и на 17 из них ответа не было — это самая заметная дыра в ответах.</p>'
 +metrics([{t:'note',i:'reply',v:'41',l:'Вопрос за 30 дней'},{t:'down',v:'17',l:'Остались без ответа'},{t:null,i:'clock',v:'4 ч',l:'Медианное время ответа'}])
 +act({i:'replies',kind:'Автоответы',t:'Включить автоответы только на вопросы',mode:'live',
  now:'Выключены — вы отвечаете вручную',
  next:'Включены · <mark>только вопросы</mark> · <mark>09:00–21:00</mark> · интонация из профиля голоса',
  warn:'Автоответы публикуются от вашего имени. Первые 20 уйдут на ревью, дальше — автоматически.',
  cta:'Включить'})
 +grounded([{n:'Полученные ответы',v:'30 дней',i:'reply'},{n:'Профиль голоса',v:'14 правил',i:'voice'},{n:'Автоматизация',v:'выключена',i:'bolt'}]),'14:36');

function thinking(){return agent('<div class="ag-steps">'
 +'<div class="ag-step ag-step--done">'+ic('check',15)+'Прочитал статистику за 7 дней</div>'
 +'<div class="ag-step ag-step--now"><span class="ag-step-g"></span>Сверяю с картой лучшего времени</div>'
 +'<div class="ag-step ag-step--wait"><span class="ag-step-g"></span>Соберу ответ</div>'
 +'</div>','14:36');}
function thin(){return agent(
 '<div class="ag-thin"><div class="ag-thin-t">'+ic('alert',16)+'Данных пока мало для честного ответа</div>'
 +'<p>Чтобы сравнить месяцы, мне нужно минимум 10 постов за каждый. За июнь у вас 4 — любая цифра отсюда будет выдумкой, поэтому я её не покажу.</p>'
 +'<div class="ag-gauge"><span>4 из 10 постов</span><span class="ag-gauge-bar"><i style="width:40%"></i></span><span>июнь</span></div></div>'
 +'<p style="margin-top:13px">Что я <strong>могу</strong> сказать уже сейчас — сравнить последние 14 дней с предыдущими 14: там данных хватает.</p>'
 +sug('chart','Сравнить 14 дней вместо месяцев','Достаточно постов в обоих окнах — ответ будет с реальными цифрами.','<button class="btn btn--secondary btn--sm">Спросить так</button>')
 +grounded([{n:'Посты',v:'июнь · 4',i:'nib'},{n:'Статистика',v:'14 дней',i:'chart'},{n:'Топ-посты',v:'нет данных',empty:1},{n:'Карта времени',v:'нет данных',empty:1}]),'14:41');}
function err(){return agent(
 '<div class="ag-err"><div class="ag-err-t">'+ic('alert',16)+'Не удалось получить ответ</div>'
 +'<p>Запрос шёл дольше 30 секунд и был прерван. Ваши данные не затронуты — это связь, а не аккаунт.</p>'
 +'<div class="ag-err-a"><button class="btn btn--secondary btn--sm">'+ic('undo',14)+'Повторить вопрос</button><button class="btn btn--ghost btn--sm">Скопировать вопрос</button></div></div>','14:44');}

function rail(){return '<div class="ag-rail">'
 +'<div class="ag-panel"><div class="ag-panel-hd">'+ic('layers')+'Данные агента<a class="act">Обновить</a></div>'
 +sig('chart','Статистика','7 дней')+sig('clock','Карта лучшего времени','168 постов')+sig('nib','Ваши посты','12 за 14 дней')
 +sig('reply','Полученные ответы','148')+sig('voice','Профиль голоса','14 правил')+sig('overview','Топ-посты','мало данных',1)+'</div>'
 +'<div class="ag-panel"><div class="ag-panel-hd">'+ic('bubble')+'Диалоги<a class="act">'+ic('plus',12)+' Новый</a></div>'
 +conv('Почему упали просмотры на этой неделе?','Сегодня, 14:32',1)+conv('Настрой автоответы на вопросы','Вчера, 19:04')+conv('Лучшее время для постинга','9 июля')+'</div>'
 +'<div class="ag-panel"><div class="ag-panel-hd">'+ic('check')+'Применено агентом</div>'
 +rec('Автоответы включены','Только вопросы · 09:00–21:00 · вчера')+rec('Правило голоса добавлено','«Без смайликов в первом абзаце» · 9 июля')+'</div></div>';}
function sig(i,n,v,thin){return '<div class="ag-sig'+(thin?' ag-sig--thin':'')+'">'+ic(i,15)+'<span class="ag-sig-n">'+n+'</span><span class="ag-sig-v">'+v+'</span></div>';}
function conv(t,m,cur){return '<button class="ag-conv"'+(cur?' aria-current="true"':'')+'><span class="ag-conv-t">'+t+'</span><span class="ag-conv-m">'+m+'</span></button>';}
function rec(t,m){return '<div class="ag-receipt">'+ic('check',14)+'<span><span class="ag-receipt-t">'+t+'</span><span class="ag-receipt-m">'+m+'</span></span></div>';}

function screen(thread,dock,h,jump){return '<div class="ag-shell" style="height:'+h+'px"><div class="ag-screen">'
 +'<div class="ag-main"><div class="ag-stream'+(jump?' ag-stream--jump':'')+'"><div class="ag-scroll"><div class="ag-col">'+thread+'</div></div>'
 +(jump?'<button class="ag-jump">'+ic('down',14)+'К последнему</button>':'')+'</div>'
 +'<div class="ag-dock"><div class="ag-dock-inner">'+dock+'</div></div></div>'
 +rail()+'</div></div>';}
/* Frames must render at their LABELLED width regardless of the reader's window,
   so each one is a fixed-width stage scaled down to fit the doc column. */
function stage(w,inner){return '<div class="fscale" data-w="'+w+'"><div class="fstage" style="width:'+w+'px">'+inner+'</div></div>';}

/* ── doc frame chrome ──────────────────────────────────── */
/* Bar uses the REAL shell classes from studio.css — no doc-local aliases.
   Slot order per system/App-Header-Pill-Placement-SPEC: pill leading, then title. */
function bar(){return '<div class="topbar"><span class="status-pill status-pill--accent"><i class="pill-dot"></i>Читает данные</span><span class="topbar-title">Агент</span><span class="topbar-spacer"></span><span class="topbar-actions"><button class="icon-btn">'+ic('bubble',17)+'</button><button class="icon-btn">'+ic('sun',17)+'</button><button class="icon-btn">'+ic('settings',17)+'</button></span></div>';}
function mbar(){return '<div class="m-top"><button class="m-iconbtn m-iconbtn--plain">'+sp('menu',20)+'</button><span class="m-top-title">Агент</span><span class="m-top-spacer"></span><span class="m-top-actions"><button class="m-iconbtn">'+sp('layers',18)+'</button><button class="m-iconbtn">'+sp('bubble',18)+'</button></span></div>';}
function frame(inner,dark,w){return '<div class="fr'+(dark?' dark':'')+'"'+(w?' style="max-width:'+w+'px"':'')+'>'+inner+'</div>';}
function lab(t,dark){return '<div class="fr-lab"><span class="dh'+(dark?' dh--dark':'')+'"></span>'+t+'</div>';}
function cell(t,inner,dark,w){return '<div class="fcell">'+lab(t,dark)+frame(inner,dark,w)+'</div>';}
function set(id,html){var e=document.getElementById(id);if(e)e.innerHTML=html;}

/* ── render ────────────────────────────────────────────── */
/* Stage widths are the SCREEN CONTAINER, not the window: studio.css gives
   .sidebar{flex:0 0 248px}, so container = window − 248. 1032 ≡ a 1280 window. */
var DOCK=composer();
set('f-empty',cell('контейнер 1032 = окно 1280 · тёмная · пусто',stage(1032,bar()+screen(open_(),DOCK,560)),1));
set('f-empty-l',cell('контейнер 1032 = окно 1280 · светлая · пусто',stage(1032,bar()+screen(open_(),DOCK,560)),0));
set('f-active',cell('контейнер 1032 = окно 1280 · тёмная · диалог + кнопка «к последнему»',stage(1032,bar()+screen(T1+T2,DOCK,700,1)),1));
set('f-active-l',cell('контейнер 1032 = окно 1280 · светлая · диалог',stage(1032,bar()+screen(T1+T2,DOCK,700)),0));

set('f-user',cell('Реплика пользователя','<div class="ag-col" style="padding:18px">'+user('Почему упали просмотры на этой неделе?')+user('Включи автоответы, но только на вопросы — и не трогай ночь')+'</div>',1));
set('f-metrics','<div class="fgrid">'
 +cell('Полоса метрик · 3 ячейки · светлая','<div style="padding:18px">'+metrics([{t:'down',i:'down',v:'−18%',l:'Просмотры за 7 дней'},{t:'down',v:'3',l:'Поста — было 5'},{t:'up',i:'up',v:'+6%',l:'Доля ответов'}])+'</div>',0)
 +cell('4 ячейки · длинная локаль (de) · тёмная','<div style="padding:18px">'+metrics([{t:'down',i:'down',v:'−18%',l:'Aufrufe (7 Tage)'},{t:'down',v:'3',l:'Beiträge — vorher 5'},{t:'up',i:'up',v:'+6%',l:'Antwortquote'},{t:null,i:'clock',v:'Di 18:00',l:'Bestes Zeitfenster'}])+'</div>',1)+'</div>');
set('f-grounded','<div class="fgrid">'
 +cell('Полная привязка · светлая','<div style="padding:18px">'+grounded([{n:'Статистика',v:'7 дней',i:'chart'},{n:'Посты',v:'12',i:'nib'},{n:'Полученные ответы',v:'148',i:'reply'},{n:'Топ-посты',v:'нет данных',empty:1}])+'</div>',0)
 +cell('Тонкие данные · тёмная','<div style="padding:18px">'+grounded([{n:'Статистика',v:'14 дней',i:'chart'},{n:'Карта времени',v:'нет данных',empty:1},{n:'Топ-посты',v:'нет данных',empty:1}])+'</div>',1)+'</div>');

var A_AUTO={i:'replies',kind:'Автоответы',t:'Включить автоответы только на вопросы',mode:'live',now:'Выключены — вы отвечаете вручную',next:'Включены · <mark>только вопросы</mark> · <mark>09:00–21:00</mark> · интонация из профиля голоса',warn:'Автоответы публикуются от вашего имени. Первые 20 уйдут на ревью.',cta:'Включить'};
set('f-act','<div class="fgrid">'
 +cell('Предложено · светлая','<div style="padding:18px">'+act(A_AUTO)+'</div>',0)
 +cell('Предложено · тёмная','<div style="padding:18px">'+act({i:'cal',kind:'Публикация',t:'Поставить пост на вторник, 18:00',mode:'review',now:'В календаре на этой неделе пусто',next:'Черновик «итоги недели» → <mark>вт, 15 июля, 18:00</mark> · на ревью перед отправкой',cta:'Запланировать'})+'</div>',1)+'</div>');
set('f-act-states','<div class="fgrid">'
 +cell('Применяется','<div style="padding:18px">'+act(Object.assign({},A_AUTO,{state:'busy'}))+'</div>',1)
 +cell('Применено · свёрнуто в чек','<div style="padding:18px">'+act({state:'done',doneT:'Автоответы включены',doneS:'Только вопросы · 09:00–21:00 · применено 14:37'})+'</div>',1)
 +cell('Ошибка · повторить','<div style="padding:18px">'+act(Object.assign({},A_AUTO,{state:'fail'}))+'</div>',1)
 +cell('Мягкое предупреждение · светлая','<div style="padding:18px">'+act({i:'bolt',kind:'Автоматизация',t:'Поставить всю автоматизацию на паузу до понедельника',mode:'live',now:'Активны: 2 рутины, автоответы, 1 триггер',next:'<mark>Пауза до пн, 21 июля</mark> · запланированные посты сохранятся',warn:'На паузе агент не будет отвечать на упоминания — 3 рутины пропустят свои окна.',cta:'Поставить на паузу'})+'</div>',0)+'</div>');
set('f-sug',cell('Карточка-подсказка (в композер, ничего не меняет)','<div style="padding:18px">'
 +sug('nib','Вернуться к пяти постам в неделю','Два коротких поста в интонации «признать ошибку» обычно перформят выше средней.','<button class="btn btn--secondary btn--sm">'+ic('ext',14)+'Открыть в Studio</button><button class="btn btn--ghost btn--sm">Показать данные</button>')
 +sug('clock','Занять окно вторника, 18:00','Ваше сильнейшее окно, и оно свободно.','<button class="btn btn--secondary btn--sm">'+ic('ext',14)+'Открыть черновик</button>')+'</div>',1));

set('f-think',cell('Агент читает данные · тёмная','<div class="ag-col" style="padding:18px">'+user('Лучшее время для постинга на этой неделе?')+thinking()+'</div>',1));
set('f-thin',cell('Данных не хватает · светлая','<div class="ag-col" style="padding:18px">'+user('Сравни июнь с маем')+thin()+'</div>',0));
set('f-err',cell('Ошибка · тёмная','<div class="ag-col" style="padding:18px">'+user('Что опубликовать сегодня?')+err()+'</div>',1));

set('f-composer','<div class="fgrid">'
 +cell('Пустой · Send отключён','<div style="padding:18px">'+composer('Спросите про рост — или поручите настроить',1)+'</div>',0)
 +cell('Фокус · тёмная','<div style="padding:18px" class="is-focus">'+composer()+'</div>',1)+'</div>');
set('f-rail',cell('Правая колонка · 320px · тёмная','<div style="padding:18px;max-width:360px">'+rail().replace('class="ag-rail"','class="ag-rail" style="overflow:visible;padding:0"')+'</div>',1));

/* phone frames render inside .mob — the real phone shell's scope */
function phone(inner){return '<div class="mob">'+inner+'</div>';}
set('f-mob','<div class="fgrid fgrid--m">'
 +cell('390 · пусто',stage(390,phone(mbar()+screen(open_(),DOCK,600))),1)
 +cell('390 · диалог + действие',stage(390,phone(mbar()+screen(T2,DOCK,600))),1)
 +cell('390 · мало данных',stage(390,phone(mbar()+screen(user('Сравни июнь с маем')+thin(),DOCK,600))),0)+'</div>');
set('f-narrow',cell('контейнер 900 = окно 1148 · рейл схлопнут контейнерным запросом, лента во всю ширину',stage(900,bar()+screen(T1,DOCK,520)),1));
set('f-wide',cell('контейнер 1440 = окно 1688 · рейл 320, лента упирается в меру чтения 760',stage(1440,bar()+screen(T1,DOCK,520)),1));

/* scale every fixed-width stage into the doc column */
function fit(){
  Array.prototype.forEach.call(document.querySelectorAll('.fscale'),function(el){
    var w=+el.getAttribute('data-w'),st=el.firstElementChild,fr=el.parentElement;
    if(!st)return;
    st.style.transform='none';el.style.height='auto';
    if(fr&&fr.className.indexOf('fr')===0)fr.style.maxWidth=(w+2)+'px'; /* +2 = .fr border */
    var s=Math.min(1,el.clientWidth/w);
    st.style.transform='scale('+s+')';
    el.style.height=Math.ceil(st.offsetHeight*s)+'px';
  });
}
fit();requestAnimationFrame(fit);setTimeout(fit,400);
window.addEventListener('resize',fit);
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(fit);
})();
