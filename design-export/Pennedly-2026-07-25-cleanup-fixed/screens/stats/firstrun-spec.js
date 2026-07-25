/* firstrun-spec.js — builds every live frame in First-Run-SPEC.html out of the
   real DS classes (ds/components.css + stats.css + stats-followers.css +
   import-banner.css + stats-firstrun.css), inside token-pinned `.frame` hosts
   that flip light/dark independently via the `.dark` class. Pure vanilla, no
   build step, so the doc renders exactly what the recipes produce. All
   end-user copy is English (source locale). */
(function () {
  "use strict";

  /* ---------------------------------- icons --------------------------------- */
  function ic(n, s) {
    s = s || 14;
    var v = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
    var P = {
      chart: '<path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M3 20h18"/>',
      eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
      heart: '<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z"/>',
      bubble: '<path d="M21 12a8 8 0 0 1-11.5 7.2L4 20l1-5A8 8 0 1 1 21 12Z"/>',
      nib: '<path d="m12 19 7-7-4-4-7 7-1 5 5-1Z"/><path d="m13 6 5 5"/>',
      up: '<path d="M12 19V6"/><path d="m6 12 6-6 6 6"/>',
      down: '<path d="M12 5v13"/><path d="m6 12 6 6 6-6"/>',
      clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
      lock: '<rect x="4.5" y="11" width="15" height="9.5" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
      sparkle: '<path d="M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3Z"/>',
      arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
      check: '<path d="M20 7 9 18l-5-5"/>',
      sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19"/>',
      settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
      users: '<circle cx="9" cy="8" r="3.2"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0"/><path d="M16 5.2a3.2 3.2 0 0 1 0 5.6M17.5 20a5.5 5.5 0 0 0-3-4.9"/>'
    };
    return '<svg width="' + s + '" height="' + s + '" ' + v + '>' + (P[n] || '') + '</svg>';
  }

  function set(id, html) { var e = document.getElementById(id); if (e) e.innerHTML = html; }
  function sfmt(n) { if (n >= 1e6) return (n / 1e6).toFixed(2).replace(/\.?0+$/, '') + 'M'; if (n >= 1e4) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K'; return Math.round(n).toLocaleString('en-US'); }

  /* frame chrome */
  function head(label, dark) { return '<div class="fr-head"><span class="dh' + (dark ? ' dh--dark' : '') + '"></span>' + label + '</div>'; }
  function frame(inner, dark) { return '<div class="frame' + (dark ? ' dark' : '') + '">' + inner + '</div>'; }
  function col(label, inner, dark) { return '<div class="fr">' + head(label, dark) + frame(inner, dark) + '</div>'; }
  function row() { return '<div class="frow">' + [].slice.call(arguments).join('') + '</div>'; }

  /* ════════════════════════ 1 · IMPORT BANNER ═══════════════════════════ */
  /* opts: {kind:'early'|'live'|'partial', posts, comments, pct} */
  function banner(opts) {
    opts = opts || {};
    var kind = opts.kind || 'live';
    if (kind === 'partial') {
      return '<div class="import-banner import-banner--partial">'
        + '<span class="ib-mark">' + ic('check', 18) + '</span>'
        + '<div class="ib-body">'
        + '<div class="ib-title">Imported most of your history</div>'
        + '<div class="ib-sub"><b>248</b> posts · <b>3,910</b> comments are in. A few older posts are still finishing up.</div>'
        + '</div>'
        + '</div>';
    }
    var sub, since, barCls, fill;
    if (kind === 'early') {
      sub = 'Pulling your posts, metrics and comments from Threads…';
      since = 'Usually under a minute';
      barCls = 'ib-bar ib-bar--indeterminate'; fill = '';
    } else {
      sub = '<b>' + opts.posts + '</b> posts · <b>' + opts.comments + '</b> comments so far';
      since = 'About a minute left';
      barCls = 'ib-bar'; fill = 'style="width:' + (opts.pct || 62) + '%"';
    }
    return '<div class="import-banner import-banner--syncing">'
      + '<span class="ib-mark"><span class="ib-spinner"></span></span>'
      + '<div class="ib-body" aria-live="polite">'
      + '<div class="ib-title">Importing your history</div>'
      + '<div class="ib-sub">' + sub + '</div>'
      + '<div class="' + barCls + '"><span class="ib-bar-fill" ' + fill + '></span></div>'
      + '</div>'
      + '<span class="ib-since">' + since + '</span>'
      + '</div>';
  }

  /* ── reusable per-screen skeletons (sit under the banner) ── */
  function statsSkel() {
    function card() {
      return '<div class="ib-skel-card"><span class="ib-skel" style="width:64px;height:11px"></span>'
        + '<span class="ib-skel" style="display:block;width:84px;height:26px;margin-top:14px;border-radius:8px"></span>'
        + '<span class="ib-skel" style="display:block;width:100%;height:9px;margin-top:14px"></span></div>';
    }
    var grid = '<div class="stats-grid">' + card() + card() + card() + card() + '</div>';
    var pan = '<div class="ib-skel-card"><span class="ib-skel" style="width:170px;height:14px"></span>'
      + '<span class="ib-skel" style="display:block;width:100%;height:140px;margin-top:18px;border-radius:10px"></span></div>';
    return '<div class="frstack">' + grid + pan + '</div>';
  }
  function repliesSkel() {
    function rowSkel() {
      return '<div class="ib-skel-card" style="display:flex;gap:13px;align-items:flex-start">'
        + '<span class="ib-skel" style="width:34px;height:34px;border-radius:9999px;flex:0 0 auto"></span>'
        + '<div style="flex:1 1 auto"><span class="ib-skel" style="display:block;width:38%;height:12px"></span>'
        + '<span class="ib-skel" style="display:block;width:92%;height:11px;margin-top:9px"></span>'
        + '<span class="ib-skel" style="display:block;width:70%;height:11px;margin-top:7px"></span></div></div>';
    }
    return '<div class="frstack">' + rowSkel() + rowSkel() + rowSkel() + '</div>';
  }

  /* ════════════════════════ 2 · STATS PIECES ════════════════════════════ */
  function delta(v) {
    if (v == null) return '<span class="delta delta--flat">no prior period</span>';
    var down = v.charAt(0) === '-';
    return '<span class="delta delta--' + (down ? 'down' : 'up') + '">' + ic(down ? 'down' : 'up', 12) + v.replace('+', '') + '</span>';
  }
  /* first-run summary cards: real but small values, no prior period to compare */
  var FR_CARDS = [
    ['nib', 'Posts', '6', 'since you connected', null],
    ['eye', 'Views', '4,820', '803 avg / post', null],
    ['heart', 'Likes', '112', '19 avg / post', null],
    ['bubble', 'Comments', '14', '2.3 avg / post', null]
  ];
  var FR_CARDS_ZERO = [
    ['nib', 'Posts', '0', 'since you connected', null],
    ['eye', 'Views', '0', 'no posts yet', null],
    ['heart', 'Likes', '0', 'no posts yet', null],
    ['bubble', 'Comments', '0', 'no posts yet', null]
  ];
  function cards(set) {
    return '<div class="stats-grid">' + set.map(function (c) {
      return '<div class="stat-card"><div class="sc-top"><span class="sc-ico">' + ic(c[0], 14) + '</span><span class="sc-label">' + c[1] + '</span></div>'
        + '<div class="sc-num">' + c[2] + '</div>'
        + '<div class="sc-foot"><span class="sc-sub">' + c[3] + '</span>' + delta(c[4]) + '</div></div>';
    }).join('') + '</div>';
  }

  /* warm nudge — the calm replacement for the wall */
  function nudge(variant) {
    if (variant === 'firststep') {
      return '<div class="stats-nudge">'
        + '<span class="sn-mark">' + ic('sparkle', 18) + '</span>'
        + '<div class="sn-body"><div class="sn-title">You\u2019re all set up</div>'
        + '<div class="sn-sub">Your history is in. Keep publishing from the Studio and the trend line, best times and viral spread fill in here as you go \u2014 no waiting period.</div>'
        + '<div class="sn-cta"><a class="btn btn--secondary btn--sm">' + ic('nib', 14) + ' Open the Studio</a></div></div>'
        + '</div>';
    }
    return '<div class="stats-nudge">'
      + '<span class="sn-mark">' + ic('chart', 18) + '</span>'
      + '<div class="sn-body"><div class="sn-title">Your history is importing</div>'
      + '<div class="sn-sub">These numbers are real and growing as we pull the rest of your posts and comments from Threads. Nothing is missing \u2014 the full picture lands in a moment.</div></div>'
      + '</div>';
  }

  /* follower panel — honest states */
  function followers(state) {
    var cap = '<div><div class="fchart-cap">Followers</div><div class="fchart-sub">Since you connected</div></div>';
    if (state === 'collecting') {
      var headC = '<div class="fchart-head">' + cap
        + '<div class="fchart-hl"><div class="fchart-count">312</div><div class="fchart-gain fchart-gain--flat">growth from today</div></div></div>';
      return '<div class="spanel">' + headC
        + '<div class="fchart-collect"><span class="fchart-collect-mark">' + ic('chart', 20) + '</span>'
        + '<div class="fchart-collect-t">Growth starts tracking today</div>'
        + '<div class="fchart-collect-s">Threads only gives your current follower count, not its history \u2014 so we start plotting your growth from today. Check back tomorrow for the first move.</div></div></div>';
    }
    if (state === 'locked') {
      var headL = '<div class="fchart-head">' + cap
        + '<div class="fchart-hl"><div class="fchart-count" style="color:var(--color-text-subtle)">\u2014</div></div></div>';
      return '<div class="spanel">' + headL
        + '<div class="fchart-collect fchart-collect--locked"><span class="fchart-collect-mark">' + ic('lock', 20) + '</span>'
        + '<div class="fchart-collect-t">Follower insights unlock at ~100 followers</div>'
        + '<div class="fchart-collect-s">Threads only shares follower analytics once an account passes about 100 followers. You\u2019re at <b>64</b> \u2014 almost there, and everything else on this page works in the meantime.</div></div></div>';
    }
    /* healthy line, for the before/after comparison */
    var pts = [311, 313, 312, 316, 319, 318, 324, 329, 327, 335, 341, 339, 348, 356, 352, 363, 372];
    var min = Math.min.apply(null, pts), max = Math.max.apply(null, pts), range = (max - min) || 1, n = pts.length;
    var Pp = pts.map(function (v, i) { var x = 1 + i / (n - 1) * 98; var y = 8 + (1 - (v - min) / range) * 84; return [x, y]; });
    var line = 'M' + Pp.map(function (p) { return p[0].toFixed(2) + ' ' + p[1].toFixed(2); }).join(' L');
    var area = line + ' L' + Pp[n - 1][0].toFixed(2) + ' 100 L' + Pp[0][0].toFixed(2) + ' 100 Z';
    var last = pts[n - 1], gain = last - pts[0];
    var head2 = '<div class="fchart-head">' + cap
      + '<div class="fchart-hl"><div class="fchart-count">' + last.toLocaleString('en-US') + '</div>'
      + '<div class="fchart-gain fchart-gain--up">+' + gain + '</div></div></div>';
    return '<div class="spanel">' + head2
      + '<div class="fchart-plot"><svg class="fchart-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path class="fchart-area" d="' + area + '"/><path class="fchart-line" d="' + line + '"/></svg>'
      + '<span class="fchart-dot" style="left:' + Pp[n - 1][0].toFixed(2) + '%;top:' + Pp[n - 1][1].toFixed(2) + '%"></span></div>'
      + '<div class="fchart-foot"><span>' + pts[0].toLocaleString('en-US') + '</span><span>full history · not tied to the period</span><span>' + last.toLocaleString('en-US') + '</span></div></div>';
  }

  /* performance-spread panel — calculating vs computed */
  var TIERS = [
    ['Viral', '3\u00d7+ your average', 'tier-viral'],
    ['Good', '1.5\u20133\u00d7 average', 'tier-good'],
    ['Average', '0.7\u20131.5\u00d7 average', 'tier-average'],
    ['Weak', 'below 0.7\u00d7', 'tier-weak']
  ];
  function spreadCalc() {
    var rows = TIERS.map(function (t) {
      return '<div class="distrow distrow--calc"><div class="dist-top"><span class="dist-name"><span class="dist-dot ' + t[2] + '"></span>' + t[0] + '<span class="dn-sub">\u00b7 ' + t[1] + '</span></span>'
        + '<span class="dist-val"><span class="sfr-skel sfr-skel--num"></span></span></div>'
        + '<div class="dist-track"><span class="sfr-skel"></span></div></div>';
    }).join('');
    var head = '<div class="spanel-head"><div><div class="spanel-title">Performance spread</div><div class="spanel-cap">How each post compares to your baseline</div></div>'
      + '<span class="calc-pill">Calculating<span class="cp-dots"><i></i><i></i><i></i></span></span></div>';
    return '<div class="spanel">' + head + '<div class="distlist">' + rows + '</div></div>';
  }

  /* the topbar mini-demo (shell context) */
  function topbar(dark) {
    return '<div class="tbdemo"><span class="tbt">Stats</span><span class="status-pill">' + ic('chart', 13) + 'Updated daily</span><span class="sp"></span><span class="ib">' + ic(dark ? 'sun' : 'clock', 16) + '</span><span class="ib">' + ic('settings', 16) + '</span></div>';
  }

  /* ── progressive Stats page (banner + real cards + nudge + honest panels) ── */
  function progressivePage(opts) {
    opts = opts || {};
    var top = opts.done ? '' : banner({ kind: 'live', posts: 42, comments: 310, pct: 62 });
    var nud = opts.done ? nudge('firststep') : nudge('importing');
    var cardSet = opts.zero ? FR_CARDS_ZERO : FR_CARDS;
    return '<div class="frstack">' + top + cards(cardSet) + nud + followers('collecting') + spreadCalc() + '</div>';
  }

  /* the OLD all-or-nothing wall (for the before/after) */
  function oldWall() {
    return '<div class="stats-empty"><div class="se-mark">' + ic('chart', 26) + '</div>'
      + '<div class="se-title">Not enough data yet</div>'
      + '<div class="se-sub">Stats need at least two weeks of activity to show meaningful trends. Keep publishing in the Studio and your performance will take shape here.</div>'
      + '<div class="se-meta"><span class="sm"><b>1</b> week so far</span><span class="sm"><b>3</b> posts published</span></div></div>';
  }

  /* ══════════════════════════════ MOUNT ════════════════════════════════ */

  /* §1 — banner anatomy: the three live shapes, light + dark */
  set('f-banner', col('Importing · live counts', banner({ kind: 'live', posts: 42, comments: 310, pct: 62 }), false)
    + col('Importing · live counts · Dark', banner({ kind: 'live', posts: 42, comments: 310, pct: 62 }), true));
  set('f-banner-states', row(
    col('Just started (indeterminate)', banner({ kind: 'early' }), false),
    col('Imported most (partial)', banner({ kind: 'partial' }), true)
  ));

  /* §1.x — banner + skeleton in context */
  set('f-ctx-stats', col('Stats · syncing (banner + skeleton)', '<div class="frstack">' + banner({ kind: 'live', posts: 42, comments: 310, pct: 62 }) + statsSkel() + '</div>', false));
  set('f-ctx-replies', col('Replies · syncing (banner + skeleton)', '<div class="frstack">' + banner({ kind: 'live', posts: 42, comments: 310, pct: 62 }) + repliesSkel() + '</div>', true));

  /* §2 — before / after wall replacement */
  set('f-beforeafter', row(
    col('BEFORE \u00b7 all-or-nothing wall', oldWall(), false),
    col('AFTER \u00b7 progressive first-run', progressivePage({}), false)
  ));

  /* §2 — progressive page, light + dark */
  set('f-progressive', col('Progressive Stats \u00b7 importing \u00b7 Light', progressivePage({}), false)
    + col('Progressive Stats \u00b7 importing \u00b7 Dark', progressivePage({}), true));

  /* §2 — variants: zero posts, and import-done first-step */
  set('f-progressive-var', row(
    col('Zero posts yet (still honest, not broken)', '<div class="frstack">' + cards(FR_CARDS_ZERO) + nudge('importing') + '</div>', false),
    col('Import done \u00b7 small account (first-step nudge)', '<div class="frstack">' + cards(FR_CARDS) + nudge('firststep') + '</div>', true)
  ));

  /* §3 — honest empty states */
  set('f-followers', row(
    col('Follower growth \u00b7 < 2 days of data', followers('collecting'), false),
    col('Follower count not available yet', followers('locked'), true)
  ));
  set('f-followers-ok', col('For contrast \u00b7 once growth is tracking', followers('ok'), false)
    + col('Once growth is tracking \u00b7 Dark', followers('ok'), true));
  set('f-spread-calc', row(
    col('Viral tiers \u00b7 Calculating\u2026', spreadCalc(), false),
    col('Viral tiers \u00b7 Calculating\u2026 \u00b7 Dark', spreadCalc(), true)
  ));

  /* shell topbar mini-demo */
  set('f-topbar', row(col('Light', topbar(false), false), col('Dark', topbar(true), true)));

  window.FR = { ic: ic, banner: banner, followers: followers };
})();
