/* engagement-render.js — shared render layer for the Engagement panel.
   Exposes window.ENGAGE used by Engagement-SPEC.html (web, .spanel chrome) and
   Engagement-Mobile-SPEC.html (phone, .m-spanel + .mob chrome). Pure HTML-string
   builders on the real engagement.css classes; wire() attaches the hover tooltip.
   Data is deterministic so frames are stable. Numbers are samples; shapes are real. */
(function(){
  /* ------------------------------- icons --------------------------------- */
  function ic(n,s){ s=s||14; var v='viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
    var P={
      eye:'<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
      heart:'<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z"/>',
      reply:'<path d="M9 7 4 11l5 4"/><path d="M4 11h8a6 6 0 0 1 6 6v2"/>',
      repeat:'<path d="m17 2 4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>',
      quote:'<path d="M7 7h4v5a4 4 0 0 1-4 4M13 7h4v5a4 4 0 0 1-4 4"/>',
      up:'<path d="M7 17 17 7"/><path d="M8 7h9v9"/>',
      down:'<path d="M7 7 17 17"/><path d="M17 8v9H8"/>',
      chart:'<path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M3 20h18"/>',
      alert:'<path d="M12 4 2.5 20.5h19L12 4Z"/><path d="M12 10v4"/><circle cx="12" cy="17.4" r="0.7" fill="currentColor" stroke="none"/>',
      refresh:'<path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3v5h-5"/>'
    };
    return '<svg width="'+s+'" height="'+s+'" '+v+'>'+(P[n]||'')+'</svg>';
  }
  function sfmt(n){ if(n==null) return '—'; if(n>=1e6) return (n/1e6).toFixed(2).replace(/\.?0+$/,'')+'M'; if(n>=1e4) return (n/1e3).toFixed(1).replace(/\.0$/,'')+'K'; if(n>=1000) return (n/1000).toFixed(1).replace(/\.0$/,'')+'K'; return Math.round(n).toLocaleString('en-US'); }
  function full(n){ return Math.round(n).toLocaleString('en-US'); }

  /* ------------------------------- data ---------------------------------- */
  var TODAY = new Date(2026,5,18);
  var CONNECT = new Date(2024,3,13);
  var DAY = 86400000;
  var TODAY_ABS = Math.round((TODAY - CONNECT)/DAY);
  var ENGAGED = 26;                       // recent days that carry likes/replies/reposts/quotes
  var FRAC = { likes:0.012, replies:0.0011, reposts:0.0019, quotes:0.0007 };
  var METRICS = [['views','Views','eye'],['likes','Likes','heart'],['replies','Replies','reply'],['reposts','Reposts','repeat'],['quotes','Quotes','quote']];
  var LABEL = {}; METRICS.forEach(function(m){ LABEL[m[0]]=m[1]; });
  var LIFETIME = { likes:142000, replies:8400, reposts:3100, quotes:1200 };

  function rnd(seed){ var x=Math.sin(seed*12.9898)*43758.5453; return x-Math.floor(x); }
  function viewAt(abs){ if(abs<0) return 0;
    var trend=1400+abs*22;
    var season=1+0.16*Math.sin(abs/7*2*Math.PI+1);
    var noise=0.78+0.44*rnd(abs*1.3+5);
    var v=trend*season*noise;
    if(rnd(abs*2.7+11)>0.93) v*=1.8+rnd(abs)*1.2;
    return Math.round(v);
  }
  function valAt(metric,abs){
    if(metric==='views') return viewAt(abs);
    if(abs>TODAY_ABS-ENGAGED) return Math.round(viewAt(abs)*FRAC[metric]);
    return 0;
  }
  // series of {date,val} for the last `days` ending TODAY
  function series(metric,days,limit){
    var out=[], start=TODAY_ABS-days+1;
    for(var abs=start; abs<=TODAY_ABS; abs++){
      var d=new Date(CONNECT.getTime()+abs*DAY);
      var val = (limit!=null && abs<=TODAY_ABS-limit) ? null : valAt(metric,abs);
      out.push({date:d, val: val==null?0:val, real: val!=null});
    }
    return out;
  }
  function windowTotal(metric,days,offset){ offset=offset||0; var t=0, start=TODAY_ABS-days+1-offset, end=TODAY_ABS-offset;
    for(var a=start;a<=end;a++) t+=valAt(metric,a); return t; }
  function trendOf(metric,days){
    var cur=windowTotal(metric,days,0), prev=windowTotal(metric,days,days);
    if(prev<=0) return {cls:'flat', html:'no prior window'};
    var r=(cur-prev)/prev*100;
    if(Math.abs(r)<0.5) return {cls:'flat', html:'no change'};
    var up=r>0; return {cls:up?'up':'down', html:ic(up?'up':'down',13)+Math.round(Math.abs(r))+'%'};
  }
  function winLabel(days){ return days>=365?'year':(days+' days'); }
  function fmtDay(d){ return d.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'}); }
  function fmtAxis(d,days){ return d.toLocaleDateString('en-US', days>=365?{month:'short'}:{month:'short',day:'numeric'}); }

  /* ----------------------------- the chart ------------------------------- */
  function chart(metric,days,pin){
    var s=series(metric,days), n=s.length;
    var max=Math.max.apply(null,s.map(function(p){return p.val;}).concat([1]));
    var pts=s.map(function(p,i){ var x=n===1?50:(i/(n-1)*100); var y=6+(1-p.val/max)*92; return {x:x,y:y,day:fmtDay(p.date),val:p.val}; });
    var line='M'+pts.map(function(p){return p.x.toFixed(2)+' '+p.y.toFixed(2);}).join(' L');
    var area=line+' L'+pts[n-1].x.toFixed(2)+' 100 L'+pts[0].x.toFixed(2)+' 100 Z';
    var last=pts[n-1];
    // sparse axis ~5 labels
    var want=Math.min(5,n), idx=[]; for(var i=0;i<want;i++) idx.push(Math.round(i*(n-1)/(want-1||1)));
    idx=idx.filter(function(v,k){return idx.indexOf(v)===k;});
    var labels=idx.map(function(i){ return '<span class="echart-xlabel" style="left:'+pts[i].x.toFixed(1)+'%">'+fmtAxis(s[i].date,days)+'</span>'; }).join('');
    var bands=pts.map(function(p,i){ return '<div class="echart-band" data-i="'+i+'"></div>'; }).join('');
    // pinned tooltip (documentation): pin is a 0..1 fraction
    var pinIdx = pin!=null ? Math.max(0,Math.min(n-1,Math.round(pin*(n-1)))) : null;
    var pinAttr = pinIdx!=null ? ' data-pin="'+pinIdx+'"' : '';
    var hovering = pinIdx!=null ? ' is-hovering' : '';
    var pp = pinIdx!=null ? pts[pinIdx] : null;
    var cs = pp ? 'left:'+pp.x.toFixed(2)+'%' : '';
    var ds = pp ? 'left:'+pp.x.toFixed(2)+'%;top:'+pp.y.toFixed(2)+'%' : '';
    var ts = pp ? tipStyle(pp) : '';
    var tipDay = pp?pp.day:'', tipVal = pp?full(pp.val):'';
    var dataAttr = " data-pts='"+JSON.stringify(pts)+"'";
    var plot='<div class="echart-plot'+hovering+'"'+pinAttr+dataAttr+'>'
      +'<svg class="echart-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path class="echart-area" d="'+area+'"/><path class="echart-line" d="'+line+'"/></svg>'
      +'<div class="echart-floor"></div>'
      +'<span class="echart-dot" style="left:'+last.x.toFixed(2)+'%;top:'+last.y.toFixed(2)+'%"></span>'
      +'<span class="echart-cursor" style="'+cs+'"></span>'
      +'<span class="echart-dot echart-dot--hover" style="'+ds+'"></span>'
      +'<div class="echart-tip" style="'+ts+'"><span class="echart-tip-day">'+tipDay+'</span> <span class="echart-tip-val">'+tipVal+'</span></div>'
      +'<div class="echart-bands">'+bands+'</div>'
      +'</div>'
      +'<div class="echart-xaxis">'+labels+'</div>';
    return plot;
  }
  function tipStyle(p){
    var tx = p.x<14 ? '0' : (p.x>86 ? '-100%' : '-50%');
    return 'left:'+p.x.toFixed(2)+'%;top:'+p.y.toFixed(2)+'%;transform:translate('+tx+',-120%)';
  }

  function headline(metric,days){
    var total=windowTotal(metric,days,0), t=trendOf(metric,days);
    return '<div class="echart-hl">'
      +'<div><div class="ehl-label">'+LABEL[metric]+'</div><div class="ehl-num">'+sfmt(total)+'</div></div>'
      +'<div class="ehl-right"><div class="ehl-delta ehl-delta--'+t.cls+'">'+t.html+'</div><div class="ehl-sub">vs previous '+winLabel(days)+'</div></div>'
      +'</div>';
  }
  function chartBlock(o){ o=o||{}; var metric=o.metric||'views', days=o.days||90;
    return headline(metric,days)+chart(metric,days,o.pin); }

  /* --------------------------- thin / error ------------------------------ */
  function thinChart(){
    // a handful of real early points, plotted honestly at the left; rest hatched.
    var raw=[2,4,3,6,5], n=raw.length, max=6;
    var span=26; // the few days occupy ~the left quarter of a 90d-equivalent canvas
    var pts=raw.map(function(v,i){ var x=2+ i/(span-1)*98; var y=10+(1-v/max)*78; return [x,y]; });
    var line='M'+pts.map(function(p){return p[0].toFixed(2)+' '+p[1].toFixed(2);}).join(' L');
    var dots=pts.map(function(p){ return '<circle cx="'+p[0].toFixed(2)+'" cy="'+p[1].toFixed(2)+'" r="2.4" class="echart-thin-dot"/>'; }).join('');
    return '<div class="echart-thin"><div class="echart-thin-grid"></div>'
      +'<svg class="echart-thin-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path class="echart-thin-line" d="'+line+'"/>'+dots+'</svg>'
      +'<div class="echart-thin-note">'+ic('chart',15)+'<span class="echart-thin-t"><b>5 days</b> of history so far — building daily. Your engagement trend fills in as data accrues.</span></div>'
      +'</div>';
  }
  function errorBlock(){
    return '<div class="echart-error"><span class="echart-error-mark">'+ic('alert',20)+'</span>'
      +'<div class="echart-error-t">Couldn\u2019t load engagement</div>'
      +'<div class="echart-error-s">Something went wrong fetching this account\u2019s engagement. Your data is safe.</div>'
      +'<button class="echart-retry" type="button">'+ic('refresh',14)+'Retry</button></div>';
  }

  /* -------------------------- metric / range ----------------------------- */
  function metricBar(active){ active=active||'views';
    return '<div class="emetric" role="tablist" aria-label="Metric">'+METRICS.map(function(m){
      return '<button class="emetric-btn'+(m[0]===active?' emetric-btn--active':'')+'" role="tab" aria-selected="'+(m[0]===active)+'">'+ic(m[2],15)+m[1]+'</button>';
    }).join('')+'</div>'; }
  function rangeBar(days){ days=days||90; var R=[[30,'30d'],[90,'90d'],[365,'1y']];
    return '<div class="erange" role="tablist" aria-label="Range">'+R.map(function(r){
      return '<button class="erange-btn'+(r[0]===days?' erange-btn--active':'')+'" role="tab" aria-selected="'+(r[0]===days)+'">'+r[1]+'</button>';
    }).join('')+'</div>'; }

  /* --------------------------- lifetime tiles ---------------------------- */
  function lifeBlock(isNull){
    var T=[['heart','Likes','likes'],['reply','Replies','replies'],['repeat','Reposts','reposts'],['quote','Quotes','quotes']];
    var tiles=T.map(function(t){ var v=isNull?null:LIFETIME[t[2]];
      return '<div class="elife-tile"><div class="elife-top">'+ic(t[0],14)+'<span>'+t[1]+'</span></div><div class="elife-num'+(v==null?' elife-num--null':'')+'">'+sfmt(v)+'</div></div>';
    }).join('');
    return '<div class="elife"><div class="elife-cap">Lifetime totals</div><div class="elife-grid">'+tiles+'</div></div>';
  }

  /* ------------------------------ skeleton ------------------------------- */
  function skeleton(){
    var pill='<span class="skel-line" style="height:34px;flex:1 1 0;border-radius:6px"></span>';
    var metric='<div class="emetric" style="border-color:transparent;background:transparent;padding:0;gap:6px;margin-bottom:18px">'+pill+pill+pill+pill+pill+'</div>';
    var hl='<div class="echart-hl"><div><div class="skel-line" style="width:54px;height:11px"></div><div class="skel-line" style="width:120px;height:30px;margin-top:8px;border-radius:8px"></div></div><div class="skel-line" style="width:80px;height:14px"></div></div>';
    var plot='<div class="skel-line" style="width:100%;height:150px;border-radius:10px"></div>';
    var tile='<div class="elife-tile" style="border:none;background:transparent;padding:0"><div class="skel-line" style="width:58px;height:11px"></div><div class="skel-line" style="width:64px;height:20px;margin-top:10px;border-radius:6px"></div></div>';
    var life='<div class="elife"><div class="skel-line" style="width:90px;height:11px;margin-bottom:12px"></div><div class="elife-grid">'+tile+tile+tile+tile+'</div></div>';
    var head='<div class="echart-head"><div><div class="skel-line" style="width:96px;height:11px"></div><div class="skel-line" style="width:140px;height:11px;margin-top:6px"></div></div><div class="skel-line" style="width:120px;height:28px;border-radius:8px"></div></div>';
    return head+metric+hl+plot+life;
  }

  /* ------------------------------- panel --------------------------------- */
  function panel(o){ o=o||{}; var metric=o.metric||'views', days=o.days||90, state=o.state||'ready';
    var wrap=o.mob?'m-spanel':'spanel';
    var head='<div class="echart-head"><div><div class="echart-cap">Engagement</div><div class="echart-sub">'+LABEL[metric]+' · per day · last '+winLabel(days)+'</div></div>'+rangeBar(days)+'</div>';
    var inner;
    if(state==='loading'){ inner=skeleton(); return '<div class="'+wrap+'">'+inner+'</div>'; }
    if(state==='error'){ inner=head+errorBlock(); return '<div class="'+wrap+'">'+inner+'</div>'; }
    if(state==='thin'){
      var thl='<div class="echart-hl"><div><div class="ehl-label">'+LABEL[metric]+'</div><div class="ehl-num">'+sfmt(windowTotalThin())+'</div></div><div class="ehl-right"><div class="ehl-delta ehl-delta--flat">building</div><div class="ehl-sub">5 days so far</div></div></div>';
      inner=head+metricBar(metric)+thl+thinChart()+lifeBlock(true);
      return '<div class="'+wrap+'">'+inner+'</div>';
    }
    inner=head+metricBar(metric)+chartBlock({metric:metric,days:days,pin:o.pin})+lifeBlock(false);
    return '<div class="'+wrap+'">'+inner+'</div>';
  }
  function windowTotalThin(){ return 20+4+3+6+5; } // ~ small sample total of the few real view-days (sample)

  /* ------------------------------- wire ---------------------------------- */
  function wire(root){
    root=root||document;
    var plots=root.querySelectorAll('.echart-plot');
    plots.forEach(function(plot){
      var pts; try{ pts=JSON.parse(plot.getAttribute('data-pts')||'[]'); }catch(e){ pts=[]; }
      if(!pts.length) return;
      var cursor=plot.querySelector('.echart-cursor');
      var hdot=plot.querySelector('.echart-dot--hover');
      var tip=plot.querySelector('.echart-tip');
      var tDay=tip.querySelector('.echart-tip-day'), tVal=tip.querySelector('.echart-tip-val');
      var pin=plot.getAttribute('data-pin'); pin = pin==null?null:parseInt(pin,10);
      function activate(i){ var p=pts[i]; if(!p) return;
        cursor.style.left=p.x+'%'; hdot.style.left=p.x+'%'; hdot.style.top=p.y+'%';
        var tx = p.x<14?'0':(p.x>86?'-100%':'-50%');
        tip.style.left=p.x+'%'; tip.style.top=p.y+'%'; tip.style.transform='translate('+tx+',-120%)';
        tDay.textContent=p.day; tVal.textContent=Number(p.val).toLocaleString('en-US');
        plot.classList.add('is-hovering');
      }
      function reset(){ if(pin!=null){ activate(pin); } else { plot.classList.remove('is-hovering'); } }
      var bands=plot.querySelectorAll('.echart-band');
      bands.forEach(function(b){ var i=parseInt(b.getAttribute('data-i'),10);
        b.addEventListener('mouseenter',function(){ activate(i); });
        b.addEventListener('mousedown',function(){ activate(i); });
      });
      plot.addEventListener('mouseleave',reset);
    });
  }

  window.ENGAGE = { ic:ic, sfmt:sfmt, panel:panel, metricBar:metricBar, rangeBar:rangeBar, chartBlock:chartBlock, lifeBlock:lifeBlock, thinChart:thinChart, errorBlock:errorBlock, skeleton:skeleton, wire:wire };
})();
