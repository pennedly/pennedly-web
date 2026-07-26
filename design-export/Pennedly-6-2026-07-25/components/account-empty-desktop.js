/* account-empty-desktop.js — DELTA desktop builders for the durable-dashboard
   states + the shared network picker (Account-Dashboard-Empty-SPEC and
   Connect-Network-Picker-SPEC). Additive: reuses window.ACC (shared marks /
   sidebar / header / tasks / advisor / profile cards / add-brand) and
   window.ACCX (delta data); exposes window.ACCE. Existing specs untouched.

   Durable dashboard, keeps the FULL chrome — for everyone EXCEPT the brand-new
   user, who gets the FULL-SCREEN first-connect instead:
     firstConnect — 0 profiles ever → full-screen "choose a network" (picker hero)
     'all_disc'   — had profiles, all disconnected → in-dashboard: reassurance +
                    disconnected cards (status-pill--warning) + Reconnect
     'mixed'      — ≥1 live + ≥1 disconnected → in-dashboard: dead profiles show
                    the pill + inline Reconnect instead of live metrics
     'loading'    — standard skeleton   ·   'error' — shared §3.8 ErrorBanner

   The NETWORK PICKER is one shared component (picker / pickerSheet / firstConnect):
   Threads = live primary affordance; LinkedIn = dimmed, non-interactive, "Coming
   soon" badge. It is what Connect / "Connect another" / Reconnect open. */
(function () {
  const C = window.ACCT;
  const X = window.ACCX;
  const ACC = window.ACC;
  const A = "../assets/avatars/";
  const L = C.L;

  const EIC = {
    link:   "<path d='M9 15 15 9'/><path d='M11 6.6 12.5 5.1a4 4 0 0 1 5.6 5.6L16.6 12.2'/><path d='M13 17.4 11.5 18.9a4 4 0 0 1-5.6-5.6L7.4 11.8'/>",
    shield: "<path d='M12 3 5 6v5.5c0 4.3 3 7.4 7 8.8 4-1.4 7-4.5 7-8.8V6l-7-3Z'/><path d='M9.2 12.2l1.9 1.9 3.9-4.3'/>",
  };
  function ic(n, s) {
    s = s || 14;
    if (EIC[n]) return "<svg width='" + s + "' height='" + s + "' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'>" + EIC[n] + "</svg>";
    return ACC.ic(n, s);
  }
  function plRu(n, f) { n = Math.abs(n) % 100; var n1 = n % 10; if (n > 10 && n < 20) return f[2]; if (n1 > 1 && n1 < 5) return f[1]; if (n1 === 1) return f[0]; return f[2]; }
  function plProfiles(lang, n) { return lang === "de" ? C.T.de.headScale : plRu(n, ["профиль", "профиля", "профилей"]); }

  function avatarDisc(p) {
    var inner = p.avatar ? "<img src='" + A + p.avatar + "' alt=''/>" : "<span class='mono'>" + p.mono + "</span>";
    return "<span class='acc-av acc-av--disc'>" + inner + ACC.netBadge(p) + "</span>";
  }

  // ══════════════ A — the shared NETWORK PICKER ════════════════════════════
  function netMark(net) { return "<span class='acc-net-tile acc-net-tile--" + net.tone + "'>" + net.glyph + "</span>"; }
  function networkRow(net, lang, opts) {
    opts = opts || {}; var t = X.T(lang);
    if (net.status === "soon") {
      return "<div class='acc-netrow acc-netrow--soon' role='listitem' aria-disabled='true'>" + netMark(net)
        + "<span class='acc-netrow-body'><span class='acc-netrow-nm'>" + net.name + "</span><span class='acc-netrow-sub'>" + t.soonSub + "</span></span>"
        + "<span class='acc-netrow-badge'>" + t.soonLabel + "</span></div>";
    }
    var sub = opts.reconnHandle ? opts.reconnHandle : t.liveLabel;
    return "<button class='acc-netrow acc-netrow--live" + (opts.primary ? " acc-netrow--primary" : "") + "' role='listitem'>" + netMark(net)
      + "<span class='acc-netrow-body'><span class='acc-netrow-nm'>" + net.name + "</span><span class='acc-netrow-sub'>" + sub + "</span></span>"
      + "<span class='acc-netrow-go'>" + t.connectVerb + ic("chev-right", 15) + "</span></button>";
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
    var cap = opts.cap === false ? "" : "<div class='acc-netpick-cap'>" + t.pickerChoose + "</div>";
    return "<div class='acc-netpick' role='list'>" + cap + pickerRows(lang, opts) + "</div>";
  }
  function reconnTitle(lang, handle) { var t = X.T(lang); return lang === "de" ? (handle + " erneut verbinden") : (t.reconnPre + " " + handle); }
  // popover / modal form — used by "Connect another" and "Reconnect"
  function pickerSheet(lang, opts) {
    opts = opts || {}; var t = X.T(lang);
    var title = opts.reconnHandle ? reconnTitle(lang, opts.reconnHandle) : t.sheetT;
    var sub = opts.reconnHandle ? t.reconnSub : t.sheetS;
    var body = "<div class='acc-pickcard-head'><div class='acc-pickcard-t'>" + title + "</div><div class='acc-pickcard-s'>" + sub + "</div></div>"
      + picker(lang, Object.assign({ cap: false }, opts));
    return "<div class='acc-pickcard'>" + body + "</div>";
  }
  // full-screen first-connect (brand-new user, 0 profiles ever) — picker as hero
  function firstConnect(lang) {
    var t = X.T(lang);
    var next = X.NEXT[lang] || X.NEXT.ru;
    var rows = next.map(function (r) { return "<div class='acc-next-row'><span class='acc-next-ic'>" + ic(r.icon, 15) + "</span><span class='acc-next-t'>" + r.t + "</span></div>"; }).join("");
    var top = "<div class='acc-first-top'><div class='acc-first-brand'><span class='acc-first-logo'>" + ic("nib", 17) + "</span>Pennedly</div>"
      + "<button class='acc-first-logout'>" + ic("logout", 15) + t.logOut + "</button></div>";
    return "<div class='acc-first'>" + top
      + "<div class='acc-first-inner'>"
      + "<div class='acc-first-eyebrow'>" + t.firstEyebrow + "</div>"
      + "<h1 class='acc-first-t'>" + t.firstT + "</h1>"
      + "<p class='acc-first-s'>" + t.firstS + "</p>"
      + picker(lang, {})
      + "<div class='acc-next acc-first-next'><div class='acc-next-cap'>" + t.nextCap + "</div>" + rows + "</div>"
      + "</div></div>";
  }

  // ══════════════ in-dashboard states (full chrome) ════════════════════════
  function headerId(lang, scaleText) {
    return "<div class='acc-head acc-head--idonly'>" + ACC.acctMark()
      + "<div class='acc-head-txt'><div class='acc-head-name'>" + C.ACCOUNT.name + "</div>"
      + "<div class='acc-head-meta'><span class='acc-head-plan'>" + C.ACCOUNT.plan + "</span><span class='acc-head-scale'>" + scaleText + "</span></div></div></div>";
  }
  function reassure(lang) {
    var t = X.T(lang);
    return "<div class='acc-reassure'><span class='acc-reassure-mark'>" + ic("shield", 20) + "</span>"
      + "<div class='acc-reassure-body'><div class='acc-reassure-t'>" + t.reassureT + "</div><div class='acc-reassure-s'>" + t.reassureS + "</div></div></div>";
  }
  function disconnectedCard(p, lang) {
    var t = X.T(lang);
    var head = "<div class='acc-card-head'>" + avatarDisc(p)
      + "<div class='acc-card-id'><div class='acc-card-name'>" + p.name + "</div><div class='acc-card-sub'>" + p.handle + " · " + C.NETWORKS[p.network].label + "</div></div></div>";
    var status = "<div class='acc-disc-status'><span class='status-pill status-pill--warning'><i class='pill-dot'></i>" + t.pillDisc + "</span>"
      + "<span class='acc-disc-safe'>" + ic("check", 12) + t.dataSafe + "</span></div>";
    var foot = "<div class='acc-cardfoot acc-cardfoot--disc'><span class='acc-disc-since'>" + L(p.since, lang) + "</span>"
      + "<button class='btn btn--primary btn--sm acc-reconnect'>" + ic("link", 13) + t.reconnect + "</button></div>";
    return "<div class='acc-card acc-card--disc'>" + head + status + foot + "</div>";
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
    var sec = "<div class='acc-sec'><span class='acc-sec-t'>" + t.discSecT + "</span><span class='acc-sec-n'>" + ids.length + "</span><span class='acc-sec-note'>" + t.discSecNote + "</span></div>";
    var connectAnother = "<div class='acc-connect-row'><button class='btn btn--secondary acc-connect-another'>" + ic("plus", 15) + t.connectAnother + "</button></div>";
    return "<div class='acc'>" + headerId(lang, scaleAllDisc(lang, ids.length)) + reassure(lang) + sec + "<div class='acc-grid'>" + cards + "</div>" + connectAnother + "</div>";
  }
  function mixedBody(lang) {
    var t = X.T(lang);
    var totals = X.MIXED_TOTALS;
    var secT = (C.T[lang] || C.T.ru).secProfiles;
    var cards = X.MIXED.order.map(function (id) {
      if (X.MIXED.disc.indexOf(id) >= 0) return disconnectedCard(X.STUDIO_DISC, lang);
      return ACC.profileCard(C.PROFILES[id], lang);
    }).join("");
    var sec = "<div class='acc-sec'><span class='acc-sec-t'>" + secT + "</span><span class='acc-sec-n'>" + X.MIXED.order.length + "</span><span class='acc-sec-note'>" + t.mixedSecNote + "</span></div>";
    return "<div class='acc'>" + ACC.header(lang, totals) + ACC.tasksStrip(lang, C.TASKS.single_brand) + ACC.advisor(lang, "single_brand")
      + sec + "<div class='acc-grid'>" + cards + ACC.addBrand(lang) + "</div></div>";
  }
  function errorBanner(lang) {
    var t = X.T(lang);
    return "<div class='error-banner' role='alert'><span class='eb-mark'>" + ic("x", 18) + "</span>"
      + "<div class='eb-body'><div class='eb-title'>" + t.errT + "</div><div class='eb-sub'>" + t.errS + "</div></div>"
      + "<button class='btn btn--secondary btn--sm'>" + ic("undo", 15) + t.retry + "</button></div>";
  }

  // ── topbar chrome per state (breadcrumb stays "Аккаунт") ──
  function discSwitcher(lang) {
    var t = X.T(lang); var ids = X.ALL_DISC;
    var stack = ids.slice(0, 3).map(function (id) { return avatarDisc(X.DISCONNECTED[id]); }).join("");
    return "<button class='acc-sw acc-sw--disc'><span class='acc-sw-stack'>" + stack + "</span>"
      + "<span class='acc-sw-lab'><span class='acc-sw-t'>" + t.swDisc + "</span><span class='acc-sw-s'>" + ids.length + " " + plProfiles(lang, ids.length) + "</span></span>"
      + "<span class='acc-sw-warn'></span></button>";
  }
  function topbarState(lang, state, dark) {
    if (state === "mixed") return ACC.topbar(lang, "single_brand", dark);
    var crumb = ACC.crumb(lang, [{ type: "account", label: (C.T[lang] || C.T.ru).crumbAccount, current: true }]);
    var right = state === "all_disc" ? discSwitcher(lang) : "";
    var icons = "<span class='acc-ib'>" + ic(dark ? "sun" : "moon", 16) + "</span><span class='acc-ib'>" + ic("settings", 16) + "</span>";
    return "<div class='acc-top'>" + crumb + "<div class='acc-top-actions'>" + right + icons + "</div></div>";
  }
  function stateBody(lang, state) {
    if (state === "all_disc") return allDiscBody(lang);
    if (state === "mixed") return mixedBody(lang);
    if (state === "loading") return ACC.skeleton();
    if (state === "error") return "<div class='acc'>" + errorBanner(lang) + "</div>";
    return "";
  }
  function stateShell(lang, state, dark) {
    var sb = ACC.sidebar(lang, { brandsCount: 1, active: "dashboard" });
    var main = "<div class='acc-mainwrap' style='min-width:0;display:flex;flex-direction:column;gap:18px'>" + topbarState(lang, state, dark) + stateBody(lang, state) + "</div>";
    return "<div class='acc-shell'>" + sb + main + "</div>";
  }

  function set(id, html) { var e = document.getElementById(id); if (e) e.innerHTML = html; }

  window.ACCE = {
    ic, avatarDisc,
    netMark, networkRow, pickerRows, picker, pickerSheet, reconnTitle, firstConnect,
    reassure, headerId, disconnectedCard, allDiscBody, mixedBody, errorBanner,
    discSwitcher, topbarState, stateBody, stateShell, set,
  };
})();
