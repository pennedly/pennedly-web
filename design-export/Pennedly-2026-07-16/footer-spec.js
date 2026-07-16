/* footer-spec.js — builds the live frames in Footer-SPEC.html from the REAL shell
   classes (studio.css + shell.css) + the new footer component (app-foot.css),
   inside token-pinned `.frame` hosts that flip light/dark via the `.dark` class.
   Copy = en source; the i18n table in the doc proves it survives 8 locales. */
(function () {
  "use strict";

  var YEAR = 2026;

  /* --------------------------------- icons --------------------------------- */
  function ic(n, s) {
    s = s || 16;
    var v = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
    var P = {
      pencil: '<path d="M4 20h4L19 9a2 2 0 0 0-3-3L5 17v3Z"/><path d="M14.5 6.5 17.5 9.5"/>',
      layers: '<path d="M12 3 3 8l9 5 9-5-9-5Z"/><path d="M3 13l9 5 9-5"/>',
      chart: '<path d="M5 20V11M12 20V5M19 20v-6"/>',
      bubble: '<path d="M21 12a8 8 0 0 1-11.5 7.2L4 20l1-5A8 8 0 1 1 21 12Z"/>',
      gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
      sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19"/>',
      mail: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m3.5 7 8.5 6 8.5-6"/>',
      chev: '<path d="M6 9l6 6 6-6"/>'
    };
    return '<svg width="' + s + '" height="' + s + '" ' + v + '>' + (P[n] || '') + '</svg>';
  }
  function nib(s) {
    s = s || 34;
    return '<span class="brand-mark" style="width:' + s + 'px;height:' + s + 'px;background:var(--color-primary);border-radius:10px;display:grid;place-items:center">'
      + '<svg width="' + Math.round(s * 0.5) + '" height="' + Math.round(s * 0.5) + '" viewBox="0 0 512 512" fill="var(--color-primary-foreground)"><g transform="rotate(42 256 256)"><path d="M236 150 Q236 128 256 128 Q276 128 276 150 L276 300 L256 360 L236 300 Z"/><rect x="236" y="206" width="40" height="7"/></g></svg></span>';
  }
  function set(id, html) { var e = document.getElementById(id); if (e) e.innerHTML = html; }

  /* frame chrome (matches the doc's existing .fr / .fr-head pattern) */
  function head(label, dark) { return '<div class="fr-head"><span class="dh' + (dark ? ' dh--dark' : '') + '"></span>' + label + '</div>'; }
  function col(label, inner, dark, flush) {
    return '<div class="fr">' + head(label, dark)
      + '<div class="frame' + (dark ? ' dark' : '') + (flush ? ' frame--flush' : '') + '">' + inner + '</div></div>';
  }
  function row() { return '<div class="frow">' + [].slice.call(arguments).join('') + '</div>'; }

  /* ───────────────────────────── the footer itself ───────────────────────── */
  /* opts: wide (bool), focusOn ('privacy'|'support'), hoverOn ('terms') */
  function footer(opts) {
    opts = opts || {};
    function lk(key, label) {
      var cls = 'af-link';
      var attr = '';
      if (opts.hoverOn === key) { cls += ' is-hover'; }
      if (opts.focusOn === key) { cls += ' is-focus'; attr = ' tabindex="0"'; }
      return '<a class="' + cls + '" href="/' + (key === 'data_deletion' ? 'data-deletion' : key) + '"' + attr + '>' + label + '</a>';
    }
    var supCls = 'af-support' + (opts.focusOn === 'support' ? ' is-focus' : '');
    return '<footer class="app-foot' + (opts.wide ? ' app-foot--wide' : '') + '" role="contentinfo">'
      + '<div class="app-foot-in">'
      + '<span class="af-copy">\u00A9 Pennedly ' + YEAR + '</span>'
      + '<span class="af-dot"></span>'
      + '<nav class="af-links" aria-label="Legal">'
      + lk('privacy', 'Privacy')
      + lk('terms', 'Terms')
      + lk('data_deletion', 'Data deletion')
      + '</nav>'
      + '<span class="af-sp"></span>'
      + '<a class="' + supCls + '" href="mailto:support@pennedly.com">'
      + '<span class="af-mail">' + ic('mail', 16) + '</span>'
      + '<span class="af-sr">Support: </span>support@pennedly.com</a>'
      + '</div></footer>';
  }

  /* ───────────────────────────── compact mock shell ──────────────────────── */
  var NAV = [
    { cap: 'Create', items: [['pencil', 'Studio', true], ['bubble', 'Replies']] },
    { cap: 'Insight', items: [['layers', 'Feed'], ['chart', 'Stats']] }
  ];
  function sidebar() {
    var nav = NAV.map(function (g) {
      return '<div class="nav-cap">' + g.cap + '</div>' + g.items.map(function (it) {
        return '<a class="nav-item ' + (it[2] ? 'nav-item--active' : '') + '" href="#"><span style="display:inline-flex">' + ic(it[0], 16) + '</span><span class="nav-label">' + it[1] + '</span></a>';
      }).join('');
    }).join('');
    return '<aside class="sidebar">'
      + '<div class="brand">' + nib(34) + '<div><div class="brand-name">Pennedly</div><div class="brand-sub">Drafting partner</div></div></div>'
      + '<nav class="nav">' + nav + '</nav>'
      + '<div class="sidebar-foot"><button class="account"><span class="avatar" style="width:32px;height:32px;display:grid;place-items:center;border-radius:9999px;background:var(--color-text);color:var(--color-bg);font-weight:600;font-size:13px">S</span><span class="who"><span class="nm">Sonya</span><span class="hd">@sonya.taro</span></span>' + ic('chev', 15) + '</button></div>'
      + '</aside>';
  }
  function topbar() {
    return '<div class="topbar"><span class="topbar-title">Studio</span><span class="topbar-spacer"></span>'
      + '<div class="topbar-actions"><button class="icon-btn">' + ic('sun', 17) + '</button><button class="icon-btn">' + ic('gear', 16) + '</button></div></div>';
  }
  /* a short page: content does not fill the viewport, footer pins to bottom */
  function shortContent() {
    return '<div class="content" style="padding:22px 24px">'
      + '<div style="font-size:var(--text-h2);font-weight:600;letter-spacing:-.01em">Today\u2019s drafts</div>'
      + '<div style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--radius-lg);padding:16px;color:var(--color-text-muted);font-size:var(--text-small)">A short page \u2014 only one card. The footer rests against the viewport bottom, never floating mid-screen.</div>'
      + '</div>';
  }
  function shell(dark) {
    return '<div class="app" style="height:100%">' + sidebar()
      + '<div class="main">' + topbar()
      + '<div class="scroll scroll--footed">' + shortContent() + footer({}) + '</div>'
      + '</div></div>';
  }

  /* ════════════════════════════════ RENDER ═══════════════════════════════ */

  /* 1 — in the app shell, footer pinned to a short page's bottom (light+dark).
     Stacked full-width so the 248px sidebar + main column read at real scale. */
  set('f-context',
    col('LIGHT \u00B7 /app \u00B7 footer pinned to a short page\u2019s bottom', shell(false), false, true)
    + col('DARK \u00B7 /app \u00B7 footer pinned to a short page\u2019s bottom', shell(true), true, true)
  );

  /* 2 — footer band, close-up, default (reading + wide widths) */
  set('f-band', row(
    col('LIGHT \u00B7 default (reading width)', footer({}), false),
    col('DARK \u00B7 default (reading width)', footer({}), true)
  ) + row(
    col('LIGHT \u00B7 .app-foot--wide (data screens, 960)', footer({ wide: true }), false),
    col('DARK \u00B7 .app-foot--wide (data screens, 960)', footer({ wide: true }), true)
  ));

  /* 3 — hover + keyboard focus (visible focus ring) */
  set('f-states', row(
    col('LIGHT \u00B7 hover \u201CTerms\u201D + focus-ring on \u201CPrivacy\u201D', footer({ hoverOn: 'terms', focusOn: 'privacy' }), false),
    col('DARK \u00B7 focus-ring on support mailto', footer({ focusOn: 'support' }), true)
  ));

  /* 4 — mobile / collapsed: stacked, ≥44px tap targets */
  function phone(inner, dark) {
    return '<div style="max-width:380px;margin:0 auto;border:1px solid var(--color-border);border-radius:var(--radius-lg);overflow:hidden;background:var(--color-bg)">' + inner + '</div>';
  }
  set('f-mobile', row(
    col('LIGHT \u00B7 phone \u2264640 \u00B7 stacked, 44px taps', phone(footer({}), false), false),
    col('DARK \u00B7 phone \u2264640 \u00B7 stacked, 44px taps', phone(footer({}), true), true)
  ));

  /* 5 — placement logic: short page (pinned) vs long page (flows after content) */
  function diagram(longPage, dark) {
    var view = '<div style="position:relative;height:230px;border:1px solid var(--color-border);border-radius:var(--radius-md);background:var(--color-surface-2);overflow:hidden">';
    if (longPage) {
      view += '<div style="position:absolute;inset:0;overflow:hidden">'
        + '<div style="padding:12px;display:flex;flex-direction:column;gap:8px">'
        + new Array(6).join('') /* noop */
        + Array.from({ length: 5 }).map(function () { return '<div style="height:30px;background:var(--color-surface);border:1px solid var(--color-border);border-radius:8px"></div>'; }).join('')
        + '</div></div>'
        + '<div style="position:absolute;left:8px;right:8px;bottom:8px;border:1px dashed color-mix(in srgb,var(--color-accent) 55%,var(--color-border));border-radius:8px;padding:8px 10px;background:color-mix(in srgb,var(--color-accent) 9%,var(--color-bg));font-family:var(--font-mono);font-size:11px;color:var(--color-accent)">.app-foot \u2014 scrolls in after content \u2191</div>';
    } else {
      view += '<div style="position:absolute;left:8px;right:8px;top:8px;height:54px;background:var(--color-surface);border:1px solid var(--color-border);border-radius:8px"></div>'
        + '<div style="position:absolute;left:8px;right:8px;top:70px;bottom:46px;display:grid;place-items:center;color:var(--color-text-subtle);font-size:var(--text-caption);font-family:var(--font-mono)">content flex:1 0 auto \u2192 grows</div>'
        + '<div style="position:absolute;left:8px;right:8px;bottom:8px;border:1px dashed color-mix(in srgb,var(--color-accent) 55%,var(--color-border));border-radius:8px;padding:8px 10px;background:color-mix(in srgb,var(--color-accent) 9%,var(--color-bg));font-family:var(--font-mono);font-size:11px;color:var(--color-accent)">.app-foot \u2014 pinned to viewport bottom</div>';
    }
    return view + '</div>';
  }
  set('f-placement', row(
    col('SHORT PAGE \u00B7 footer pinned to bottom', diagram(false), false),
    col('LONG PAGE \u00B7 footer flows after content', diagram(true), false)
  ));

})();
