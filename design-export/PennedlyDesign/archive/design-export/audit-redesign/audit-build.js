/* ===========================================================================
   Audit-Redesign-SPEC — builder
   Renders the spec doc: chrome + state galleries (web/mobile × light/dark).
   Pulls data/icons from window.AUDIT. Vanilla string-templating, same shape
   as the shipped PennedlyDesign *-SPEC builders.
   =========================================================================== */
(function () {
var A = window.AUDIT, I = A.I;

/* ------------------------------ small helpers ------------------------------- */
function dimByKey(k){ for (var i=0;i<A.DIMS.length;i++) if (A.DIMS[i].key===k) return A.DIMS[i]; return null; }
function propsFor(k){ return A.PROPOSALS.filter(function(p){ return p.dim===k; }); }
function clone(o){ return JSON.parse(JSON.stringify(o)); }

/* apply a set of decisions to a copy of PROPOSALS. decisions: {id:{status,effect,effectLabel}} */
function decide(decisions){
  return A.PROPOSALS.map(function(p){
    var d = decisions[p.id];
    if (!d) return p;
    return Object.assign({}, p, d);
  });
}
function countStatuses(props){
  var c = { undecided:0, applied:0, rejected:0 };
  props.forEach(function(p){ c[p.status] = (c[p.status]||0)+1; });
  c.total = props.length; c.decided = c.applied + c.rejected;
  return c;
}

/* =============================== shared shell =============================== */
var NAV = [
  { cap:'Рабочая зона', items:[['studio','Студия',4],['feed','Моя лента',0],['replies','Ответы',3],['at','Упоминания',0]] },
  { cap:'Аналитика',    items:[['chart','Статистика',0],['audit','Аудиты','review'],['study','Разбор паттернов',0],['compass','Изучать паттерны',0]] },
  { cap:'Голос и автопилот', items:[['voice','Голос',0],['autopilot','Автопилот',0]] }
];
function sidebar(){
  var groups = NAV.map(function(g){
    var items = g.items.map(function(it){
      var icon=it[0], label=it[1], badge=it[2];
      var active = label==='Аудиты' ? ' nav-item--active nav-item--accent' : '';
      var cur = label==='Аудиты' ? ' aria-current="page"' : '';
      var bdg = badge ? '<span class="nav-badge">'+(badge==='review'?'1':badge)+'</span>' : '';
      return '<a class="nav-item'+active+'"'+cur+'><span class="nav-ico">'+I(icon,16)+'</span><span class="nav-label">'+label+'</span>'+bdg+'</a>';
    }).join('');
    return '<div class="nav-cap">'+g.cap+'</div>'+items;
  }).join('');
  return '<aside class="sidebar"><div class="brand"><span class="brand-mark">'+I('nib',19)+'</span><div><div class="brand-name">Pennedly</div><div class="brand-sub">Партнёр по письму</div></div></div>'
    +'<nav class="nav">'+groups+'</nav>'
    +'<div class="sidebar-foot"><button class="account"><span class="avatar" style="width:32px;height:32px;"><span class="avatar-mono" style="font-size:13px;">'+A.ACCT.initials+'</span></span><div class="who"><div class="nm">'+A.ACCT.name+'</div><div class="hd">'+A.ACCT.handle+'</div></div><span class="chev">'+I('chevD',15)+'</span></button></div></aside>';
}
function topbar(pillHtml, dark){
  return '<header class="topbar"><div class="topbar-inner"><span class="topbar-title">Аудиты</span>'+(pillHtml||'')
    +'<span class="topbar-spacer"></span><div class="topbar-actions"><button class="icon-btn" aria-label="Тема">'+(dark?I('sun',17):I('moon',16))+'</button><a class="icon-btn" aria-label="Настройки">'+I('settings',17)+'</a></div></div></header>';
}
function app(body, pillHtml, dark){
  return '<div class="app">'+sidebar()+'<div class="main">'+topbar(pillHtml,dark)+'<div class="scroll"><div class="content">'+body+'</div></div></div></div>';
}

/* =============================== pills ===================================== */
function pillReview(n){ return '<span class="status-pill status-pill--accent"><span class="pill-dot"></span>'+n+' к разбору</span>'; }
var PILL_DONE = '<span class="status-pill status-pill--success"><span class="pill-dot"></span>Всё разобрано</span>';
var PILL_THIN = '<span class="status-pill"><span class="pill-dot"></span>Сигнала мало</span>';
var PILL_OFF = '<span class="status-pill"><span class="pill-dot"></span>Выключено</span>';

/* =============================== 3.1 header ================================= */
function signalChip(kind, label){
  var ico = kind==='up'?'trend':(kind==='down'?'arrowDown':'flat');
  return '<span class="signal signal--'+kind+'">'+I(ico,14)+'Динамика: '+label+'</span>';
}
function confChip(level){
  var map = { high:'высокая', med:'средняя', low:'низкая' };
  return '<span class="conf conf--'+level+'"><span class="conf-bars"><i></i><i></i><i></i></span>Уверенность: '+map[level]+'</span>';
}
function verdictHeader(opts){
  opts = opts || {};
  var H = A.HEADER;
  var badge = opts.done
    ? '<span class="badge badge--neutral">Разобрано</span>'
    : '<span class="badge" style="background:color-mix(in srgb, var(--color-accent) 12%, var(--color-surface));color:var(--color-accent);border-color:color-mix(in srgb, var(--color-accent) 30%, transparent);"><span class="pill-dot" style="background:var(--color-accent);"></span>'+opts.reviewCount+' к разбору</span>';
  return '<button class="back-link">'+I('arrowLeft',16)+' Все аудиты</button>'
    +'<section class="vd-hero">'
      +'<div class="vd-top">'
        +'<span class="avatar" style="width:38px;height:38px;"><span class="avatar-mono" style="font-size:14px;">'+A.ACCT.initials+'</span></span>'
        +'<div class="vd-id"><div><div class="vd-name">'+A.ACCT.name+' <span class="vd-handle">'+A.ACCT.handle+'</span></div>'
          +'<div class="vd-period">'+I('clock',12)+' '+(opts.period||H.period)+'<span class="sep"></span>'+(opts.posts||6)+' постов в анализе</div></div></div>'
        +'<span class="vd-spacer"></span>'+badge
      +'</div>'
      +'<h1 class="vd-verdict">'+(opts.verdict||H.verdict)+'</h1>'
      +'<div class="vd-signals">'+signalChip(opts.signal||H.signal, opts.signalLabel||H.signalLabel)+confChip(opts.conf||H.conf)+'</div>'
    +'</section>';
}

/* =============================== 3.4 loop strip ============================= */
function loopStrip(){
  var L = A.LOOP;
  return '<div class="loop-strip">'
    +'<span class="loop-mark">'+I('repeat',16)+'</span>'
    +'<div class="loop-body">Аудит учится на своих решениях: '+L.window+' правки дали <b>'+L.up+'</b> '+L.metric+'<span class="loop-sep">·</span><b>'+L.rolled+'</b> правки откатились как неудачные.</div>'
    +'<span class="loop-link">Что именно '+I('arrowRight',13)+'</span>'
  +'</div>';
}

/* =============================== 3.2 week review =========================== */
function wrRow(r, kind){
  return '<div class="wr-row wr-row--'+kind+'">'
    +'<div class="wr-text">'+r.text+'</div>'
    +'<div class="wr-nums"><span class="wr-num">'+r.num+'</span> <span style="font-size:var(--text-caption);color:var(--color-text-subtle);">'+r.unit+'</span> <span class="wr-mult wr-mult--'+kind+'">'+r.mult+'</span></div>'
  +'</div>';
}
function weekReview(opts){
  opts = opts || {};
  var wins = (opts.wins||A.WINS).map(function(r){ return wrRow(r,'win'); }).join('');
  var losses = (opts.losses||A.LOSSES).map(function(r){ return wrRow(r,'loss'); }).join('');
  var caveat = opts.caveat===false ? '' : '<div class="wr-caveat">'+I('info',15)+'<span>'+A.REVIEW_CAVEAT+'</span></div>';
  return '<section class="review">'
    +'<div class="review-head"><span class="review-mark">'+I('chart',17)+'</span><div class="review-ttl"><div class="h">Разбор недели</div><div class="d">Что зашло и что нет — с цифрами, до предложений</div></div></div>'
    +'<div class="wr-groups">'
      +'<div class="wr-group"><div class="wr-cap wr-cap--win">'+I('arrowUp',13)+'Что зашло</div><div class="wr-rows">'+wins+'</div></div>'
      +'<div class="wr-group"><div class="wr-cap wr-cap--loss">'+I('arrowDown',13)+'Что не зашло</div><div class="wr-rows">'+losses+'</div></div>'
      +caveat
    +'</div>'
  +'</section>';
}

/* =============================== 3.3 proposals ============================= */
function propOverview(c){
  var segs = [];
  for (var i=0;i<c.applied;i++) segs.push('<i class="is-applied"></i>');
  for (var j=0;j<c.rejected;j++) segs.push('<i class="is-rejected"></i>');
  for (var k=0;k<c.undecided;k++) segs.push('<i class="is-pending"></i>');
  return '<div class="prop-overview">'
    +'<span class="po-cap">Предложения</span>'
    +'<span class="po-count"><b>'+c.total+'</b> предложений · <b>'+c.applied+'</b> одобрено'+(c.rejected?' · <b>'+c.rejected+'</b> отклонено':'')+'</span>'
    +'<span class="po-spacer"></span>'
    +'<span class="prop-progress">'+segs.join('')+'</span>'
  +'</div>';
}

function statusBadge(status){
  if (status==='applied') return '<span class="badge" style="background:color-mix(in srgb, var(--color-success) 12%, var(--color-surface));color:var(--color-success);border-color:color-mix(in srgb, var(--color-success) 30%, transparent);"><span class="pill-dot" style="background:var(--color-success);"></span>Применено</span>';
  if (status==='rejected') return '<span class="badge badge--neutral">Отклонено</span>';
  return '';
}
function confMini(level){
  var map={high:'высокая',med:'средняя',low:'низкая'};
  return '<span class="pc-conf-mini is-'+level+'"><span class="cm-bars"><i></i><i></i><i></i></span>уверенность '+map[level]+'</span>';
}
function effectChip(p){
  if (!p.effect) return '<span class="effect effect--measuring">'+I('clock',13)+'измеряем эффект…</span>';
  var down = String(p.effect).trim().charAt(0)==='-';
  return '<span class="effect effect--'+(down?'down':'up')+'">'+I(down?'arrowDown':'arrowUp',13)+p.effect+' '+(p.effectLabel||'')+'</span>';
}

/* the two card shapes */
function shapeBody(p){
  if (p.shape==='diff'){
    return '<div class="pc-diff">'
      +'<div class="pc-diff-row pc-diff-row--before"><div class="dl-cap"><span class="dl-sign">−</span>Сейчас</div><div class="dl-txt">'+p.diff.before+'</div></div>'
      +'<div class="pc-diff-row pc-diff-row--after"><div class="dl-cap"><span class="dl-sign">+</span>Станет</div><div class="dl-txt">'+p.diff.after+'</div></div>'
    +'</div>';
  }
  if (p.shape==='hours'){
    var chips = p.hours.map(function(h){
      return '<span class="ph-chip'+(h.peak?' is-peak':'')+'">'+I('clock',13)+h.t+(h.peak?' · пик':'')+'</span>';
    }).join('');
    return '<div class="pc-hours"><div class="ph-cap">Окна активности · твоё время</div><div class="ph-chips">'+chips+'</div>'
      +(p.hoursNote?'<div style="font-size:var(--text-caption);color:var(--color-text-subtle);margin-top:10px;">'+p.hoursNote+'</div>':'')+'</div>';
  }
  /* action */
  var a = p.action;
  return '<div class="pc-action">'
    +'<span class="pc-action-ico">'+I(a.ico,16)+'</span>'
    +'<div class="pc-action-body"><div class="pc-action-kind">'+a.kind+'</div><div class="pc-action-label">'+a.label+'</div></div>'
  +'</div>';
}

function pcard(p){
  var cls = 'pcard';
  if (p.high) cls += ' pcard--high';
  if (p.status==='applied') cls += ' pcard--applied';
  if (p.status==='rejected') cls += ' pcard--rejected';

  var head = '<div class="pc-head">'
    +(p.high && p.status==='undecided' ? '<span class="pc-high-flag">'+I('spark',13)+'Высокий эффект</span>' : '')
    +'<div class="pc-title">'+p.title+'</div>'
    +'<span class="pc-status">'+statusBadge(p.status)+'</span>'
  +'</div>';

  var evidence = '<div class="pc-evidence">'+I('chart',14)+'<span>'+p.evidence+'</span></div>';
  var body = shapeBody(p);

  var foot;
  if (p.status==='undecided'){
    var expectIco = p.expect.dir==='up'?'trend':'flat';
    foot = '<div class="pc-foot">'
      +'<div class="pc-meta">'
        +'<span class="pc-expect pc-expect--'+p.expect.dir+'">'+I(expectIco,13)+'Ожидаем <b>↑ '+p.expect.label+'</b></span>'
        +'<span class="pe-sep"></span>'+confMini(p.conf)
      +'</div>'
      +'<div class="pc-actions"><button class="btn btn--ghost btn--sm">'+I('x',15)+' Отклонить</button><button class="btn btn--primary btn--sm">'+I('check',15)+' Одобрить</button></div>'
    +'</div>';
  } else if (p.status==='applied'){
    foot = '<div class="pc-foot"><div class="pc-meta">'+effectChip(p)+'</div></div>';
  } else {
    foot = '<div class="pc-foot"><div class="pc-meta"><span class="pc-when">Ты отклонил это предложение</span></div></div>';
  }

  return '<article class="'+cls+'">'+head+evidence+body+foot+'</article>';
}

function dimGroup(dim, props, opts){
  opts = opts || {};
  var c = countStatuses(props);
  var collapsed = opts.collapsed ? ' dgroup--collapsed' : '';
  var top = opts.top ? ' dgroup--top' : '';
  var impact = opts.top ? '<span class="impact-tag">'+I('spark',12)+'Высокий эффект</span>' : '';
  var decidedNote = c.decided ? '<span class="dgroup-decided">'+I('check',13)+c.applied+' одобрено'+(c.rejected?' · '+c.rejected+' отклонено':'')+'</span>' : '';
  var cards = props.map(pcard).join('');
  return '<section class="dgroup'+top+collapsed+'">'
    +'<button class="dgroup-head">'
      +'<span class="dgroup-mark">'+I(dim.ico,17)+'</span>'
      +'<div class="dgroup-ttl"><div class="h">'+dim.label+' <span class="gcount">'+props.length+'</span>'+impact+decidedNote+'</div><div class="d">'+dim.sub+'</div></div>'
      +'<span class="dgroup-chev">'+I('chevD',18)+'</span>'
    +'</button>'
    +'<div class="dgroup-body">'+cards+'</div>'
  +'</section>';
}

/* assemble the grouped proposals block */
function proposalsBlock(props, collapsedKeys){
  collapsedKeys = collapsedKeys || [];
  var c = countStatuses(props);
  var groups = A.DIMS.map(function(dim, idx){
    var gp = props.filter(function(p){ return p.dim===dim.key; });
    if (!gp.length) return '';
    return dimGroup(dim, gp, { top: idx===0, collapsed: collapsedKeys.indexOf(dim.key)>=0 });
  }).join('');
  return propOverview(c)+'<div class="dgroups">'+groups+'</div>';
}

/* =============================== detail bodies ============================= */
function bodyDetail(opts){
  opts = opts || {};
  var props = opts.props || A.PROPOSALS;
  var c = countStatuses(props);
  return verdictHeader({ done: opts.done, reviewCount: c.undecided, posts: opts.posts || 6,
      verdict: opts.verdict, signal: opts.signal, signalLabel: opts.signalLabel, conf: opts.conf })
    + loopStrip()
    + weekReview({ caveat: opts.caveat })
    + proposalsBlock(props, opts.collapsedKeys);
}

/* thin-data state */
function bodyThin(){
  return verdictHeader({ reviewCount:0, posts:2, period:'23–30 июня',
      verdict:'Постов мало — за неделю всего 2. Честно ждём данных, а не выдумываем советы.',
      signal:'flat', signalLabel:'недостаточно данных', conf:'low' })
    +'<section class="review">'
      +'<div class="review-head"><span class="review-mark">'+I('chart',17)+'</span><div class="review-ttl"><div class="h">Разбор недели</div><div class="d">Пока нечего раскладывать по полочкам</div></div></div>'
      +'<div class="wr-groups"><div class="wr-caveat" style="grid-column:1 / -1;">'+I('info',15)+'<span><b>2 поста за неделю</b> — этого мало для надёжных выводов. Один удачный пост ещё не тренд.</span></div></div>'
    +'</section>'
    +'<div class="thin">'
      +'<span class="thin-mark">'+I('audit',26)+'</span>'
      +'<div class="thin-title">Сигнала пока мало — дай данным накопиться</div>'
      +'<div class="thin-sub">На этой неделе слишком мало постов, чтобы предлагать изменения с уверенностью. Аудит вернётся с предложениями, когда наберётся материал — мы не показываем догадки под видом советов.</div>'
      +'<div class="thin-stats"><span class="thin-stat">'+I('feed',14)+'<b>2</b> поста</span><span class="thin-stat">'+I('chart',14)+'нужно от <b>5</b></span><span class="thin-stat">'+I('clock',14)+'следующий аудит через <b>7 дней</b></span></div>'
      +'<div class="thin-note">Можно опубликовать ещё пару постов на этой неделе — и аудит соберётся раньше.</div>'
    +'</div>';
}

/* loading skeleton */
function bodyLoading(){
  var rows = '';
  rows += '<div class="skel-card" aria-hidden="true"><div class="skel-line" style="width:170px;height:14px;"></div><div class="skel-line" style="width:60%;height:22px;margin-top:14px;"></div><div style="display:flex;gap:8px;margin-top:16px;"><div class="skel-line" style="width:120px;height:28px;border-radius:9999px;"></div><div class="skel-line" style="width:150px;height:28px;border-radius:9999px;"></div></div></div>';
  rows += '<div class="skel-card" aria-hidden="true" style="margin-top:4px;"><div class="skel-line" style="width:140px;height:13px;"></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px;"><div class="skel-block" style="height:58px;"></div><div class="skel-block" style="height:58px;"></div><div class="skel-block" style="height:58px;"></div><div class="skel-block" style="height:58px;"></div></div></div>';
  for (var i=0;i<3;i++){
    rows += '<div class="skel-card" aria-hidden="true"><div style="display:flex;gap:11px;align-items:center;"><div class="skel-block" style="width:34px;height:34px;"></div><div style="flex:1;"><div class="skel-line" style="width:120px;height:14px;"></div><div class="skel-line" style="width:200px;height:10px;margin-top:8px;"></div></div></div></div>';
  }
  return '<button class="back-link">'+I('arrowLeft',16)+' Все аудиты</button>'+rows;
}

/* =============================== Screen 0 · opt-in ======================== */
function bodyOptIn(){
  var dimChips = A.DIMS.map(function(d){
    return '<span class="optin-dim">'+I(d.ico,12)+d.label+'</span>';
  }).join('');
  var benefits = [
    { ico:'tags',   t:'Находит выигрышные темы', d:'Видит, какие темы недели обогнали твоё среднее, и подсказывает, на что налегать.' },
    { ico:'repeat', t:'Чинит сценарии', d:'Замечает дремлющие и слабые автоматизации: что включить, что убрать, где упёрся в лимит.' },
    { ico:'clock',  t:'Ловит лучшее время', d:'Сравнивает пик активности аудитории с тем, когда ты реально постишь.' },
    { ico:'spark',  t:'Учится на прошлых правках', d:'Помнит, что сработало и что откатилось, и предлагает точнее с каждой неделей.' }
  ].map(function(b){
    return '<div class="optin-benefit"><span class="ob-ico">'+I(b.ico,17)+'</span><div class="ob-body"><div class="ob-t">'+b.t+'</div><div class="ob-d">'+b.d+'</div></div></div>';
  }).join('');
  return '<div class="optin">'
    +'<section class="optin-hero">'
      +'<span class="optin-mark">'+I('audit',26)+'</span>'
      +'<div class="optin-eyebrow">Аудит роста</div>'
      +'<h1 class="optin-title">Раз в неделю — разбор аккаунта от стратега</h1>'
      +'<p class="optin-lede">Pennedly разбирает твой аккаунт как профессиональный ростовый стратег: <b>что сработало и что нет — с цифрами</b>, и какие конкретные улучшения применить в один клик.</p>'
      +'<div class="optin-dims"><span class="od-cap">Разбирает по 7 направлениям:</span>'+dimChips+'</div>'
      +'<div class="optin-cta"><button class="btn btn--primary btn--lg">'+I('power',18)+' Включить аудит</button><span class="optin-sub">Можно выключить в любой момент</span></div>'
      +'<div class="optin-note">'+I('info',13)+'<span>Аудит запускает еженедельный AI-анализ, поэтому по умолчанию выключен. Первый разбор появится в понедельник · тестеры могут запустить сразу.</span></div>'
    +'</section>'
    +'<div class="optin-grid">'+benefits+'</div>'
    +'<div class="optin-reassure">'+I('check',16)+'<div class="or-t"><b>Автоматически ничего не меняется.</b> Аудит только предлагает — каждое изменение ты одобряешь сам, в один клик.</div></div>'
  +'</div>';
}

/* =============================== list (Screen 2) ========================== */
function dimCoverage(dims){
  var dots = A.DIMS.map(function(d){
    var on = dims.indexOf(d.key)>=0;
    return '<span class="dimdot'+(on?'':' is-off')+'" title="'+d.label+'">'+I(d.ico,12)+'</span>';
  }).join('');
  return '<div class="ar-dims"><span class="adl">Охват:</span>'+dots+'</div>';
}
function auditRow(r){
  var isNew = r.decided < r.total;
  var wow;
  if (r.wow==null) wow = '';
  else {
    var kind = r.wow>0?'up':(r.wow<0?'down':'flat');
    var ico = r.wow>0?'arrowUp':(r.wow<0?'arrowDown':'flat');
    wow = '<span class="am-wow am-wow--'+kind+'">'+I(ico,12)+Math.abs(r.wow)+'% н/н</span>';
  }
  var badge = isNew
    ? '<span class="badge" style="background:color-mix(in srgb, var(--color-accent) 12%, var(--color-surface));color:var(--color-accent);border-color:color-mix(in srgb, var(--color-accent) 30%, transparent);"><span class="pill-dot" style="background:var(--color-accent);"></span>К разбору</span>'
    : '<span class="badge badge--neutral">Разобрано</span>';
  return '<button class="audit-row'+(isNew?' audit-row--new':'')+'">'
    +'<div class="ar-main">'
      +'<div class="ar-date">'+r.title+'</div>'
      +'<div class="ar-summary">'+r.summary+'</div>'
      +'<div class="ar-meta"><span class="am">'+r.range+'</span><span class="am-sep">·</span><span class="am">'+r.posts+' постов</span><span class="am-sep">·</span><span class="am">'+r.decided+' из '+r.total+' решено</span>'+wow+'</div>'
      +dimCoverage(r.dims)
    +'</div>'
    +'<div class="ar-right">'+badge+'<span class="ar-chev" style="transform:rotate(-90deg);">'+I('chevD',18)+'</span></div>'
  +'</button>';
}
function bodyList(){
  var intro = '<div class="page-intro"><h1>Аудиты</h1><p>Каждую неделю Pennedly разбирает аккаунт с разных сторон и предлагает точечные улучшения. Ты одобряешь то, что верно — без тебя ничего не меняется.</p></div>';
  var rows = A.LIST.map(auditRow).join('');
  return intro+'<div class="audit-list">'+rows+'</div>';
}
function bodyEmpty(){
  var intro = '<div class="page-intro"><h1>Аудиты</h1><p>Каждую неделю Pennedly разбирает аккаунт и предлагает изменения голоса и стратегии.</p></div>';
  return intro+'<div class="audits-empty"><div class="ae-mark">'+I('audit',26)+'</div><div class="ae-title">Аудитов пока нет</div><div class="ae-sub">Первый еженедельный разбор появится здесь через несколько дней активности. Ты всегда одобряешь изменения сам — ничего не происходит без тебя.</div></div>';
}

/* =============================== frames + doc ============================= */
function frame(device, theme, label, body, pillHtml){
  var dark = theme==='dark';
  var screen = '<div class="screen '+device+' pd-'+theme+'">'+app(body, pillHtml, dark)+'</div>';
  return '<figure class="vp"><figcaption><span class="tg tg--'+(device==='web'?'web':'mob')+'">'+(device==='web'?'Веб · 1080':'Моб · 392')+'</span><span class="tg tg--'+theme+'">'+(dark?'Тёмная':'Светлая')+'</span><span class="lbl">'+label+'</span></figcaption>'+screen+'</figure>';
}
function sectionHead(num, title, desc, notes, sub){
  var noteList = (notes||[]).map(function(n){ return '<li>'+n+'</li>'; }).join('');
  return '<section class="state-sec'+(sub?'':' divide')+'"><div class="sec-num">'+num+'</div><h2 class="sec-title'+(sub?' sub':'')+'">'+title+'</h2><p class="sec-desc">'+desc+'</p>'+(noteList?'<ul class="sec-notes">'+noteList+'</ul>':'')+'</section>';
}
function noteCard(t){ return '<div class="note-card"><div class="nc">'+t+'</div></div>'; }
function gallery(f){ return '<div class="gallery">'+f+'</div>'; }

/* ----- decision datasets ----- */
var POPULATED = decide({
  t1:{ status:'applied', effect:'+24%', effectLabel:'вовлечённость' },
  s2:{ status:'applied', effect:null, effectLabel:'охват ответов' }
});
var ALL_DECIDED = decide({
  t1:{ status:'applied', effect:'+24%', effectLabel:'вовлечённость' },
  t2:{ status:'rejected' },
  s1:{ status:'applied', effect:null, effectLabel:'ответы' },
  s2:{ status:'applied', effect:'+12%', effectLabel:'охват ответов' },
  s3:{ status:'applied', effect:'+9%', effectLabel:'диалоги' },
  s4:{ status:'rejected' },
  tm1:{ status:'applied', effect:'+17%', effectLabel:'просмотры' },
  v1:{ status:'applied', effect:'+8%', effectLabel:'вовлечённость' },
  v2:{ status:'rejected' },
  r1:{ status:'applied', effect:null, effectLabel:'дочитывания' },
  rp1:{ status:'rejected' },
  rp2:{ status:'applied', effect:'+14%', effectLabel:'диалоги' },
  f1:{ status:'rejected' }
});

/* =============================== BUILD ===================================== */
var H = '';
H += '<header class="doc-head">'
  +'<p class="doc-kicker">Pennedly · Спецификация состояний · Аудит роста</p>'
  +'<h1 class="doc-title">Аудит · разбор недели + предложения по 7 направлениям</h1>'
  +'<p class="doc-lede">Редизайн экрана аудита <code>/app/audits/[id]</code> и лёгкое обновление списка <code>/app/audits</code>. Аудит <b>выключен по умолчанию</b> — первый экран это витрина-подключение (Состояние 0). Старый аудит предлагал только ~3 мелкие правки текста; новый читается как отчёт ростового стратега: <b>что сработало и что нет — с цифрами</b>, затем <b>10–15 точечных предложений</b>, сгруппированных по <b>7 направлениям</b> и отсортированных по эффекту, каждое — в один клик. Спокойно, по делу, без чат-бота. Ключевая задача дизайна — <b>две формы карточки из одного списка</b>: <b>diff</b> (правка «было → станет») и <b>действие</b> (включить сценарий, сдвинуть время, поднять лимит). На реальных токенах PennedlyDesign, общий шелл, дифф-рендерер и effect-чип переиспользованы. Ширина чтения <b>760px</b>. Размечено для <b>веба + мобайла</b> в <b>светлой + тёмной</b> теме.</p>'
  +'<div class="doc-meta"><span class="m">route /app/audits/[id]</span><span class="m">7 направлений</span><span class="m">2 формы карточки: diff · действие</span><span class="m">opt-in по умолчанию</span><span class="m">6 состояний</span><span class="m">ширина 760</span><span class="m">i18n: 8 локалей</span></div>'
  +'</header>'
  +'<div class="legend"><span class="lk"><span class="dot" style="background:#2f4cc4;"></span>акцент / к разбору / высокий эффект</span><span class="lk"><span class="dot" style="background:#2c7350;"></span>зашло / применено / станет</span><span class="lk"><span class="dot" style="background:#b23b30;"></span>не зашло / отклонено / было</span><span class="lk"><span class="dot" style="background:#8a5b16;"></span>осторожный вывод (мало данных)</span><span class="lk"><span class="dot" style="background:#c8c7c3;"></span>свёрнутая группа</span></div>';

H += noteCard('<b>Две формы из одного списка.</b> Бэкенд отдаёт единый массив предложений; у каждого есть <code>shape</code>. <b>diff</b> рисует «Сейчас → Станет» (переиспользует системный дифф-рендерер). <b>действие</b> рисует подписанное действие без «было/станет» — включить/выключить сценарий, поднять лимит, сдвинуть тайминг (чипы окон), добавить правило, сменить аудиторию ответов. Общее у обеих форм: заголовок, <b>строка-доказательство с цифрами</b> (нет цифры — нет карточки), ожидаемый эффект + уверенность, кнопки одобрить/отклонить, и effect-чип после одобрения.');

/* STATE 0 — opt-in / off (the default front door) */
H += sectionHead('Состояние 0', 'Аудит выключен · экран подключения (по умолчанию)',
  'Аудит <b>выключен по умолчанию</b> у каждого аккаунта — он гоняет еженедельный LLM-анализ, и мы не жжём токены у тех, кому это не нужно. Поэтому первое, что почти все видят на <code>/app/audits</code>, — не список, а объяснение + кнопка включения. Это парадная дверь фичи, сделана как полноценное состояние: тёплый заголовок и объяснение что это, <b>4 конкретных выгоды</b>, привязанных к 7 направлениям, ряд чипов «разбирает по 7 направлениям», зелёный блок-успокоение «автоматически ничего не меняется — ты одобряешь каждое изменение», основная кнопка <b>«Включить аудит»</b> и тихая строка «можно выключить в любой момент». При включении экран превращается в обычный список (первый разбор — в понедельник, тестеры запускают сразу).',
  ['Тон приглашающий и честный — экран продаёт фичу, поэтому ему уделено особое внимание.',
   'Выгоды конкретные и привязаны к направлениям (темы, сценарии, тайминг, обучение на правках) — не маркетинговая вода.',
   'Честная строка про «еженедельный AI-анализ» объясняет, почему по умолчанию выключено — это снимает вопрос, а не прячет его.']);
H += gallery(
  frame('web','light','Аудит выключен · подключение', bodyOptIn(), PILL_OFF)
  +frame('web','dark','Аудит выключен · подключение', bodyOptIn(), PILL_OFF)
);
H += gallery(
  frame('mob','light','Подключение · мобайл', bodyOptIn(), PILL_OFF)
  +frame('mob','dark','Подключение · мобайл', bodyOptIn(), PILL_OFF)
);

/* STATE 1 — populated */
H += sectionHead('Состояние 1', 'Наполнено · полный разбор + предложения',
  'Основное состояние под нагрузкой: ~13 предложений по 7 направлениям. Сверху вниз: <b>3.1 шапка-вердикт</b> (аватар + период + статус-пилл, одна строка вердикта, чип динамики и чип уверенности), <b>3.4 петля обратной связи</b> («что дали прошлые правки»), <b>3.2 «Разбор недели»</b> (что зашло / что не зашло — компактные строки, цифра — первоклассный табличный элемент, + честная оговорка), затем <b>3.3 предложения</b> — счётчик «13 предложений · 2 одобрено» с прогрес-баром, сворачиваемые группы по направлениям в порядке эффекта, у верхней группы и топ-карточек маркер «высокий эффект». Здесь 2 предложения уже одобрены — видно и effect-чип «измеряем…», и измеренный «+24%».',
  ['Группы сворачиваемые; нижняя группа «Формат» показана свёрнутой как демонстрация управления плотностью.',
   'В каждой группе карточки идут по эффекту; верхняя группа — «Темы» с маркером высокого эффекта.',
   'Шапка честная: чип уверенности «средняя» и динамика «ровно» — аудит не приукрашивает ровную неделю.']);
H += gallery(
  frame('web','light','Наполнено · детальный экран', bodyDetail({ collapsedKeys:['format'], props:POPULATED }), pillReview(11))
  +frame('web','dark','Наполнено · детальный экран', bodyDetail({ collapsedKeys:['format'], props:POPULATED }), pillReview(11))
);
H += gallery(
  frame('mob','light','Наполнено · мобайл', bodyDetail({ collapsedKeys:['rules','replies','format'], props:POPULATED }), pillReview(11))
  +frame('mob','dark','Наполнено · мобайл', bodyDetail({ collapsedKeys:['rules','replies','format'], props:POPULATED }), pillReview(11))
);

/* STATE 1b — the two card shapes close-up (reuse same screen, all expanded) */
H += sectionHead('Состояние 1·b', 'Две формы карточки крупным планом',
  'Тот же экран с раскрытыми группами, чтобы рядом были видны обе формы: <b>Голос</b> и <b>Ответы</b> содержат diff-карточки («Сейчас → Станет»), а <b>Сценарии</b> и <b>Тайминг</b> — карточки-действия (включить сценарий, поднять лимит <code>10 → 25</code>, сдвинуть в окно пика чипами времени). Это доказывает, что один и тот же список рендерит обе формы из поля <code>shape</code>.',
  ['diff-карточка: красная «Сейчас» → зелёная «Станет», тот же визуальный язык, что у диффа в Студии и мобайле.',
   'карточка-действие: акцентная плашка с иконкой, ярлыком действия и подписью; для тайминга — чипы окон с пометкой «пик».',
   'Строка-доказательство одинакова у обеих форм: иконка графика + текст, числа жирные и табличные.']);
H += gallery(
  frame('web','light','Все группы раскрыты · обе формы', bodyDetail({ collapsedKeys:[], props:A.PROPOSALS }), pillReview(13))
);

/* STATE 2 — all decided */
H += sectionHead('Состояние 2', 'Всё решено · effect-чипы',
  'Каждое предложение одобрено или отклонено. Счётчик и прогрес-бар заполнены, статус-пилл вверху — <code>Всё разобрано</code>, бейдж шапки — «Разобрано». Одобренные карточки несут effect-чип в двух видах: <b>измеренный</b> результат («+24% вовлечённость», «+17% просмотры») и <b>«измеряем эффект…»</b> там, где данных ещё нет. Отклонённые приглушены и read-only (бэкенд append-only, без отката с экрана).',
  ['В группах появляется сводка «N одобрено · M отклонено» прямо в заголовке.',
   'effect-чип вверх — зелёный, вниз — красный, «измеряем…» — приглушённый; всё табличными цифрами.',
   'Отклонённые карточки на 38% прозрачнее и без кнопок — решение принято.']);
H += gallery(
  frame('web','light','Всё решено · детальный экран', bodyDetail({ done:true, collapsedKeys:[], props:ALL_DECIDED, conf:'med' }), PILL_DONE)
  +frame('web','dark','Всё решено · детальный экран', bodyDetail({ done:true, collapsedKeys:[], props:ALL_DECIDED, conf:'med' }), PILL_DONE)
);
H += gallery(
  frame('mob','light','Всё решено · мобайл', bodyDetail({ done:true, collapsedKeys:['rules','format'], props:ALL_DECIDED, conf:'med' }), PILL_DONE)
);

/* STATE 3 — thin data */
H += sectionHead('Состояние 3', 'Мало данных · честно ждём',
  'Неделя с малым числом постов. <b>Никаких выдуманных предложений.</b> Шапка-вердикт честно говорит «постов мало», чип уверенности — <b>«низкая»</b>, динамика — «недостаточно данных». «Разбор недели» сжимается до одной оговорки, а вместо предложений — спокойное состояние «сигнала пока мало, дай данным накопиться» со счётчиками: сколько постов есть, сколько нужно, когда следующий аудит.',
  ['Это не пустой экран и не ошибка — аудит существует, но честно воздерживается от советов.',
   'Цифры остаются первоклассными: <b>2 поста</b> · нужно от <b>5</b> · следующий аудит через <b>7 дней</b>.',
   'Тон спокойный и доверительный — «один удачный пост ещё не тренд».']);
H += gallery(
  frame('web','light','Мало данных · детальный экран', bodyThin(), PILL_THIN)
  +frame('mob','dark','Мало данных · мобайл', bodyThin(), PILL_THIN)
);

/* STATE 4 — loading */
H += sectionHead('Состояние 4', 'Загрузка · скелет',
  'Состояние загрузки детального экрана: скелет шапки, блока разбора и нескольких групп предложений. Каркас повторяет финальную раскладку, чтобы переход был спокойным, без скачка.',
  ['Скелет держит ту же ширину чтения и форму карточек, что и готовый экран.',
   'Появляется на запросе аудита; на медленной сети — до ~850 мс.']);
H += gallery(
  frame('web','light','Загрузка · скелет', bodyLoading(), '')
  +frame('mob','light','Загрузка · мобайл', bodyLoading(), '')
);

/* STATE 5 — list + empty */
H += sectionHead('Состояние 5', 'Список аудитов + пусто (Экран 2)',
  'Лёгкое обновление списка <code>/app/audits</code>. Строки прежние (статус-пилл · период · постов в анализе · решено N из M · дельта неделя-к-неделе) плюс новый <b>индикатор охвата направлений</b> — ряд иконок-точек показывает, какие из 7 областей затронул аудит недели. Серые точки — направление не затрагивалось. Рядом — пустое состояние для аккаунта без аудитов.',
  ['Точки охвата дают понять с одного взгляда: «на этой неделе аудит затронул Темы, Сценарии, Тайминг…».',
   'Строки «к разбору» несут акцентную полосу слева и бейдж; разобранные — нейтральный бейдж.',
   'Дельта н/н: зелёная вверх, красная вниз, приглушённая для ровной/нет данных.']);
H += gallery(
  frame('web','light','Список · охват направлений', bodyList(), pillReview(11))
  +frame('web','dark','Список · охват направлений', bodyList(), pillReview(11))
);
H += gallery(
  frame('mob','light','Список · мобайл', bodyList(), pillReview(11))
  +frame('web','light','Пусто · нет аудитов', bodyEmpty(), PILL_DONE)
);

/* i18n note */
H += sectionHead('i18n', 'Локализация · 8 локалей',
  'Вся пользовательская копия локализуется. Раскладка терпит длинные строки (de/uk): карточки переносят текст, чипы и кнопки не обрезаются, числа остаются <code>tabular-nums</code>. Контент аудита и цифры — это данные с бэкенда, не строки локали.',
  null, true);
H += noteCard('Ключевые новые строки: <code>audit.verdict.signal.{up|flat|down}</code> · <code>audit.confidence.{high|med|low}</code> · <code>audit.review.{wins|losses|caveat}</code> · <code>audit.dim.{topics|scenarios|timing|voice|rules|replies|format}</code> · <code>audit.proposal.shape.{diff|action}</code> · <code>audit.effect.measuring</code> · <code>audit.loop.summary</code>. Формы карточки (diff / действие) и направления — общие для всех локалей; меняется только текст.');

document.getElementById('root').innerHTML = H;
})();
