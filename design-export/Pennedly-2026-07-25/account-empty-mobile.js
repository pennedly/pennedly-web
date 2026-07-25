/* account-empty-mobile.js — DELTA phone builders for the durable-dashboard
   states + the shared network picker (Account-Dashboard-Empty-Mobile-SPEC and
   Connect-Network-Picker-Mobile-SPEC). Additive: reuses window.MACC (shared
   phone builders), window.MOCK (device shell + sprite) and window.ACCX; exposes
   window.MACCE. Existing Account-Dashboard-Mobile spec untouched.

   Brand-new user → FULL-SCREEN first-connect (phoneFirst). Everyone else keeps
   the full phone shell in-dashboard: 'all_disc' · 'mixed' · 'loading' · 'error'.
   The NETWORK PICKER (picker / pickerSheet / firstBody) is one shared component:
   Threads live primary, LinkedIn dimmed "Coming soon" placeholder. */
(function () {
  const C = window.ACCT;
  const X = window.ACCX;
  const M = window.MOCK;
  const V = window.MACC;
  const A = "assets/avatars/";
  const L = C.L;
  const ic = (n, s) => M.ic(n, s || 14);
  const TB = (lang) => C.T[lang] || C.T.ru;

  function plRu(n, f) { n = Math.abs(n) % 100; var n1 = n % 10; if (n > 10 && n < 20) return f[2]; if (n1 > 1 && n1 < 5) return f[1]; if (n1 === 1) return f[0]; return f[2]; }
  function plProfiles(lang, n) { return lang === "de" ? C.T.de.headScale : plRu(n, ["профиль", "профиля", "профилей"]); }
  function pad() { return "<div style='height:78px'></div>"; }

  function avatarDisc(p, cls) {
    var n = C.NETWORKS[p.network];
    var badge = "<span class='ma-net ma-net--" + p.network + "'>" + n.glyph + "</span>";
    var inner = p.avatar ? "<img src='" + A + p.avatar + "' alt=''/>" : "<span class='mono'>" + p.mono + "</span>";
    return "<span class='" + (cls || "ma-av") + " ma-av--disc'>" + inner + badge + "</span>";
  }

  // ══════════ A — shared NETWORK PICKER ══════════
  function netMark(net) { return "<span class='ma-net-tile ma-net-tile--" + net.tone + "'>" + net.glyph + "</span>"; }
  function networkRow(net, lang, opts) {
    opts = opts || {}; var t = X.T(lang);
    if (net.status === "soon") {
      return "<div class='ma-netrow ma-netrow--soon' aria-disabled='true'>" + netMark(net)
        + "<span class='ma-netrow-body'><span class='ma-netrow-nm'>" + net.name + "</span><span class='ma-netrow-sub'>" + t.soonSub + "</span></span>"
        + "<span class='ma-netrow-badge'>" + t.soonLabel + "</span></div>";
    }
    var sub = opts.reconnHandle ? opts.reconnHandle : t.liveLabel;
    return "<button class='ma-netrow ma-netrow--live" + (opts.primary ? " ma-netrow--primary" : "") + "'>" + netMark(net)
      + "<span class='ma-netrow-body'><span class='ma-netrow-nm'>" + net.name + "</span><span class='ma-netrow-sub'>" + sub + "</span></span>"
      + "<span class='ma-netrow-go'>" + t.connectVerb + ic("chev-right", 15) + "</span></button>";
  }
  function pickerRows(lang, opts) {
    opts = opts || {};
    return X.PICKER_NETS.map(function (net) {
      var o = {};
      if (opts.reconnHandle && net.id === "threads") { o.reconnHandle = opts.reconnHandle; o.primary = true; }
      return networkRow(net, lang, o);
    }).join("");
  }
  function picker(lang, opts) {
    opts = opts || {}; var t = X.T(lang);
    var cap = opts.cap === false ? "" : "<div class='ma-netpick-cap'>" + t.pickerChoose + "</div>";
    return "<div class='ma-netpick'>" + cap + pickerRows(lang, opts) + "</div>";
  }
  function reconnTitle(lang, handle) { var t = X.T(lang); return lang === "de" ? (handle + " erneut verbinden") : (t.reconnPre + " " + handle); }
  // bottom sheet form — "Connect another" / "Reconnect"
  function pickerSheet(lang, opts) {
    opts = opts || {}; var t = X.T(lang);
    var title = opts.reconnHandle ? reconnTitle(lang, opts.reconnHandle) : t.sheetT;
    var sub = opts.reconnHandle ? t.reconnSub : t.sheetS;
    var inner = "<div class='m-sheet-grip'></div>"
      + "<div class='ma-pick-head'><div class='ma-pick-t'>" + title + "</div><button class='m-sheet-close'>" + ic("x", 16) + "</button></div>"
      + "<div class='ma-pick-s'>" + sub + "</div>"
      + picker(lang, Object.assign({ cap: false }, opts));
    return "<div class='m-scrim'></div><div class='m-sheet'><div style='padding:8px 14px 22px'>" + inner + "</div></div>";
  }
  // full-screen first-connect (0 profiles ever) — picker as hero
  function firstTop(lang) {
    var t = X.T(lang);
    return "<header class='m-top m-top--first'><div class='m-top-brand'><span class='ma-first-logo'>" + ic("nib", 16) + "</span><span class='m-brand-name'>Pennedly</span></div>"
      + "<div class='m-top-spacer'></div><div class='m-top-actions'><button class='m-iconbtn m-iconbtn--plain'>" + ic("logout", 18) + "</button></div></header>";
  }
  function firstBody(lang) {
    var t = X.T(lang);
    var next = X.NEXT[lang] || X.NEXT.ru;
    var rows = next.map(function (r) { return "<div class='ma-next-row'><span class='ma-next-ic'>" + ic(r.icon, 15) + "</span><span class='ma-next-t'>" + r.t + "</span></div>"; }).join("");
    return "<div class='ma ma-first'>"
      + "<div class='ma-first-eyebrow'>" + t.firstEyebrow + "</div>"
      + "<h1 class='ma-first-t'>" + t.firstT + "</h1>"
      + "<p class='ma-first-s'>" + t.firstS + "</p>"
      + picker(lang, {})
      + "<div class='ma-next ma-first-next'><div class='ma-next-cap'>" + t.nextCap + "</div>" + rows + "</div>" + pad()
      + "</div>";
  }
  function phoneFirst(lang, dark) { return M.phone({ dark: dark, top: firstTop(lang), body: firstBody(lang), tabs: false }); }

  // ══════════ in-dashboard states ══════════
  function headerId(lang, scaleText) {
    return "<div class='ma-head'>" + "<span class='ma-acctmark'>" + C.ACCOUNT.mono + "</span>"
      + "<div class='ma-head-txt'><div class='ma-head-name'>" + C.ACCOUNT.name + "</div>"
      + "<div class='ma-head-meta'><span class='ma-head-plan'>" + C.ACCOUNT.plan + "</span><span class='ma-head-scale'>" + scaleText + "</span></div></div></div>";
  }
  function reassure(lang) {
    var t = X.T(lang);
    return "<div class='ma-reassure'><span class='ma-reassure-mark'>" + ic("check", 18) + "</span>"
      + "<div class='ma-reassure-body'><div class='ma-reassure-t'>" + t.reassureT + "</div><div class='ma-reassure-s'>" + t.reassureS + "</div></div></div>";
  }
  function disconnectedCard(p, lang) {
    var t = X.T(lang);
    var head = "<div class='ma-card-head'>" + avatarDisc(p)
      + "<div class='ma-card-id'><div class='ma-card-name'>" + p.name + "</div><div class='ma-card-sub'>" + p.handle + " · " + C.NETWORKS[p.network].label + "</div></div></div>";
    var status = "<div class='ma-disc-status'><span class='status-pill status-pill--warning'><i class='pill-dot'></i>" + t.pillDisc + "</span>"
      + "<span class='ma-disc-safe'>" + ic("check", 12) + t.dataSafe + "</span></div>";
    var foot = "<div class='ma-cardfoot ma-cardfoot--disc'><span class='ma-disc-since'>" + L(p.since, lang) + "</span>"
      + "<button class='btn btn--primary btn--sm ma-reconnect'>" + ic("link", 13) + t.reconnect + "</button></div>";
    return "<div class='ma-card ma-card--disc'>" + head + status + foot + "</div>";
  }
  function scaleAllDisc(lang, n) {
    var t = X.T(lang);
    if (lang === "de") return n + " Profile · " + t.allDiscScale;
    return n + " " + plRu(n, ["профиль", "профиля", "профилей"]) + " · " + t.allDiscScale;
  }
  function allDiscBody(lang) {
    var t = X.T(lang);
    var ids = X.ALL_DISC;
    var cards = ids.map(function (id) { return disconnectedCard(X.DISCONNECTED[id], lang); }).join("");
    var sec = "<div class='ma-sec'><span class='ma-sec-t'>" + t.discSecT + "</span><span class='ma-sec-n'>" + ids.length + "</span></div>";
    var connectAnother = "<button class='btn btn--secondary ma-connect-another'>" + ic("plus", 15) + t.connectAnother + "</button>";
    return "<div class='ma'>" + headerId(lang, scaleAllDisc(lang, ids.length)) + reassure(lang) + sec + "<div class='ma-grid'>" + cards + "</div>" + connectAnother + pad() + "</div>";
  }
  function mixedBody(lang) {
    var t = X.T(lang);
    var totals = X.MIXED_TOTALS;
    var secT = TB(lang).secProfiles;
    var cards = X.MIXED.order.map(function (id) {
      if (X.MIXED.disc.indexOf(id) >= 0) return disconnectedCard(X.STUDIO_DISC, lang);
      return V.profileCard(C.PROFILES[id], lang);
    }).join("");
    var sec = "<div class='ma-sec'><span class='ma-sec-t'>" + secT + "</span><span class='ma-sec-n'>" + X.MIXED.order.length + "</span><span class='ma-sec-note'>" + t.mixedSecNote + "</span></div>";
    return "<div class='ma'>" + V.header(lang, totals) + V.totalsGrid(lang, totals) + V.tasksStrip(lang, C.TASKS.single_brand) + V.advisor(lang, "single_brand")
      + sec + "<div class='ma-grid'>" + cards + V.addBrand(lang) + "</div>" + pad() + "</div>";
  }
  function errorBanner(lang) {
    var t = X.T(lang);
    return "<div class='m-error'><div class='eb-mark'>" + ic("x", 18) + "</div><div><div class='eb-title'>" + t.errT + "</div>"
      + "<div class='eb-sub'>" + t.errS + "</div><button class='btn btn--secondary btn--sm' style='min-height:40px'>" + ic("undo", 15) + t.retry + "</button></div></div>";
  }

  function swButtonDisc(lang) {
    var t = X.T(lang); var ids = X.ALL_DISC;
    var stack = ids.slice(0, 3).map(function (id) { return avatarDisc(X.DISCONNECTED[id], "ma-av"); }).join("");
    return "<button class='ma-swbtn'><span class='ma-swbtn-stack'>" + stack + "</span>"
      + "<span class='ma-swbtn-who'><span class='ma-swbtn-t'>" + t.swDisc + "</span><span class='ma-swbtn-s'>" + ids.length + " " + plProfiles(lang, ids.length) + "</span></span>"
      + "<span class='ma-swbtn-warn'></span></button>";
  }
  function topbar(lang, state) {
    if (state === "mixed") return V.topbar(lang, "single_brand", false);
    return M.top({ title: TB(lang).navDashboard, menu: true });
  }
  function body(lang, state) {
    if (state === "all_disc") return allDiscBody(lang);
    if (state === "mixed") return mixedBody(lang);
    if (state === "loading") return V.skeleton();
    if (state === "error") return "<div class='ma'>" + errorBanner(lang) + pad() + "</div>";
    return "";
  }
  function phone(lang, state, dark) {
    var overlay = state === "mixed" ? V.swButton(lang, "single_brand") : state === "all_disc" ? swButtonDisc(lang) : "";
    return M.phone({ dark: dark, top: topbar(lang, state), body: body(lang, state), tabs: false, overlay: overlay });
  }

  function set(id, html) { var e = document.getElementById(id); if (e) e.innerHTML = html; }

  window.MACCE = {
    ic, avatarDisc,
    netMark, networkRow, pickerRows, picker, pickerSheet, reconnTitle, firstTop, firstBody, phoneFirst,
    reassure, headerId, disconnectedCard, allDiscBody, mixedBody, errorBanner,
    swButtonDisc, topbar, body, phone, set,
  };
})();
