/* variants/v4.js — CONCEPT V4 · "Решётка" (Channel grid / portfolio wall).
   Center of gravity: the CHANNELS. A dense grid of rich cards is the whole
   screen; totals ride as a thin header, the advisor is one slim inline strip,
   and the "Требует тебя" signals surface directly ON the cards (error rails,
   attention counts, import banners, reconnect overlays, voice nudges). Best for
   the multi-account owner who thinks in channels and wants to jump in one click.
   Leans hardest into the adaptive brand↔profile mechanic (expandable brands). */
(function () {
  "use strict";
  var VK = window.VK, ic = VK.ic, t = VK.t, L = VK.L, avatar = VK.avatar, fmtK = VK.fmtK;

  // inline totals (thin header)
  function inlineTotals(r, lang) {
    var cells = VK.totalsSpec(r, lang).map(function (m) {
      var val = m.value == null ? "—" : fmtK(m.value);
      var delta = (m.delta != null && m.value != null) ? " " + VK.deltaEl(m.delta) : "";
      return "<div class='v4-tot" + (m.attention ? " v4-tot--attn" : "") + "'><span class='v4-tot-lab'>" + m.label + "</span><span class='v4-tot-val'>" + val + delta + "</span></div>";
    }).join("");
    return "<div class='v4-totals'>" + cells + "</div>";
  }

  // slim advisor strip
  function advisorStrip(r, lang) {
    var tt = t(lang);
    if (r.advisor === "thin") {
      var th = VK.ADVISOR.thin;
      return "<div class='v4-adv v4-adv--thin'><span class='v4-adv-mark'>" + ic("advisor", 16) + "</span>" +
        "<span class='v4-adv-txt'><b>" + L(th.title, lang) + "</b> " + L(th.body, lang) + "</span>" +
        "<button class='v-btn v-btn--sm v4-adv-open'>" + tt.advOpen + ic("arrow-right", 13) + "</button></div>";
    }
    var a = VK.ADVISOR.verdict;
    var chips = a.chips.map(function (c) { return VK.chip(c, lang); }).join("");
    return "<div class='v4-adv'><span class='v4-adv-mark'>" + ic("advisor", 16) + "</span>" +
      "<span class='v4-adv-verdict'>" + L(a.verdict, lang) + "</span>" +
      "<span class='v4-adv-chips'>" + chips + "</span>" +
      "<button class='v-btn v-btn--sm v4-adv-open'>" + tt.advOpen + ic("arrow-right", 13) + "</button></div>";
  }

  // needs-you chips in the grid header (aggregate signal; per-channel detail on cards)
  function needsChips(r, lang) {
    var tt = t(lang), items = VK.needsItems(r.tasks, lang);
    if (!items.length) return "";
    var chips = items.map(function (it) {
      return "<span class='v4-need v4-need--" + it.tone + "'>" + ic(it.icon, 12) + "<b>" + it.n + "</b> " + VK.plW(it.n, it.word, lang) + "</span>";
    }).join("");
    return "<span class='v4-needs'><span class='v4-needs-lab'>" + ic("bolt", 13) + tt.needsYou + "</span>" + chips + "</span>";
  }

  // one metric cell
  function m4(label, icon, value, opts) { return VK.metric(label, icon, value, Object.assign({ size: "sm" }, opts || {})); }
  function metricsGrid(p, lang, muted) {
    var tt = t(lang);
    if (muted) {
      return "<div class='v4-metrics'>" + m4(tt.followers, "users", p.followers, { delta: p.followers_delta }) +
        m4(tt.views, "eye", null) + m4(tt.posts, "nib", null) + m4(tt.replies, "bubble", null) + "</div>";
    }
    return "<div class='v4-metrics'>" +
      m4(tt.followers, "users", p.followers, { delta: p.followers_delta }) +
      m4(tt.views, "eye", p.views_7d) +
      m4(tt.posts, "nib", p.posts_week) +
      m4(tt.replies, "bubble", p.replies, { attention: p.replies > 0 }) + "</div>";
  }

  function cardHead(p, lang, dim) {
    return "<div class='v4-card-head'>" + avatar(p, 40, { dim: dim }) +
      "<div class='v4-card-id'><div class='v4-card-nm'>" + p.handle + "</div><div class='v4-card-hd'>" + VK.NETWORKS[p.network].label + (p.name ? " · " + p.name : "") + "</div></div>" +
      "<span class='v4-card-go'>" + ic("arrow-up-right", 16) + "</span></div>";
  }
  function quicklinks(p, lang) {
    var tt = t(lang);
    return "<div class='v4-quick'><a class='v-quick'>" + ic("chart", 12) + tt.stats + "</a>" +
      "<a class='v-quick" + (p.replies > 0 ? " v-quick--attention" : "") + "'>" + ic("reply", 12) + tt.replies + (p.replies > 0 ? " <span class='v-quick-n'>" + p.replies + "</span>" : "") + "</a></div>";
  }

  function profileCard(p, lang) {
    var tt = t(lang);
    if (p.sync === "importing") {
      return "<div class='v4-card v4-card--imp v4-card--click'>" + cardHead(p, lang) + VK.importBanner(p, lang) +
        "<div class='v4-card-foot'>" + VK.voiceTag(p, lang) + "<span class='v-spacer'></span></div></div>";
    }
    if (p.sync === "error") {
      return "<div class='v4-card v4-card--err v4-card--click'>" + cardHead(p, lang) + metricsGrid(p, lang, true) +
        "<div class='v4-card-foot'><span class='v-sync v-sync--error'><span class='v-sync-dot'></span>" + tt.syncError + "</span>" +
        "<button class='v-btn v-btn--sm v-btn--danger'>" + ic("undo", 12) + tt.retry + "</button></div></div>";
    }
    if (p.sync === "disconnected") {
      return "<div class='v4-card v4-card--off'>" + cardHead(p, lang, true) +
        "<div class='v4-off-note'>" + ic("plug", 14) + tt.disconnected + " · " + (lang === "de" ? "Daten & Verlauf gesichert" : "данные и история сохранены") + "</div>" +
        "<div class='v4-card-foot'><span class='v-spacer'></span><button class='v-btn v-btn--sm v-btn--primary'>" + ic("undo", 12) + tt.reconnect + "</button></div></div>";
    }
    var voice = !p.has_voice ? VK.voiceTag(p, lang) : "<span class='v-sync'><span class='v-sync-dot'></span>" + L(p.refreshed, lang) + "</span>";
    return "<div class='v4-card v4-card--click'>" + cardHead(p, lang) + metricsGrid(p, lang) +
      "<div class='v4-card-foot'>" + voice + quicklinks(p, lang) + "</div></div>";
  }

  function brandProfileRow(p, lang) {
    var tt = t(lang), right;
    if (p.sync === "importing") right = "<span class='v4-bp-state v4-bp-state--imp'><span class='ib-spinner' style='width:12px;height:12px'></span>" + tt.importing + "</span>";
    else if (p.sync === "error") right = "<button class='v-btn v-btn--sm v-btn--danger'>" + ic("undo", 11) + tt.retry + "</button>";
    else if (p.sync === "disconnected") right = "<button class='v-btn v-btn--sm'>" + tt.reconnect + "</button>";
    else right = "<span class='v4-bp-mini'><b>" + fmtK(p.followers) + "</b> · <b>" + fmtK(p.views_7d) + "</b></span>";
    return "<div class='v4-bp'>" + avatar(p, 28, { dim: p.sync === "disconnected" }) +
      "<span class='v4-bp-id'><span class='v4-bp-nm'>" + p.handle + "</span><span class='v4-bp-hd'>" + VK.NETWORKS[p.network].label + "</span></span>" +
      right + ic("chev-right", 14) + "</div>";
  }
  function brandCard(b, lang, expanded) {
    var tt = t(lang);
    var stack = b.profiles.slice(0, 3).map(function (k) { return avatar(VK.profile(k), 24, { noBadge: true, cls: "v4-stackav" }); }).join("");
    var stat = b.counts.error ? "<span class='v-sync v-sync--error'><span class='v-sync-dot'></span>" + b.counts.error + " " + tt.nError + "</span>"
      : b.counts.importing ? "<span class='v-sync v-sync--imp'><span class='v-sync-dot'></span>" + b.counts.importing + " " + tt.nImporting + "</span>"
      : "<span class='v-sync'><span class='v-sync-dot'></span>" + tt.allSynced + "</span>";
    var sub = b.profiles.length + "\u00A0" + VK.plW(b.profiles.length, tt.profilesW, lang) + " · " + VK.brandKind(b, lang);
    var body = "<div class='v4-card-head v4-card-head--brand'><span class='v4-brandmark'>" + b.mono + "</span>" +
      "<div class='v4-card-id'><div class='v4-card-nm'>" + b.name + "</div><div class='v4-card-hd'>" + sub + "</div></div>" +
      "<span class='v4-stack'>" + stack + "</span></div>" +
      metricsGrid(b.stats, lang) +
      "<div class='v4-card-foot'>" + stat + "<button class='v4-expand' data-v4-expand aria-expanded='" + (expanded ? "true" : "false") + "'>" + tt.expand + " " + ic("chev-down", 13) + "</button></div>" +
      "<div class='v4-bp-list'" + (expanded ? "" : " hidden") + ">" + b.profiles.map(function (k) { return brandProfileRow(VK.profile(k), lang); }).join("") + "</div>";
    return "<div class='v4-card v4-card--brand'>" + body + "</div>";
  }

  function addTile(brandMode, lang) {
    var tt = t(lang);
    return "<button class='v4-card v4-add'><span class='v4-add-ic'>" + ic("plus", 20) + "</span>" +
      "<span class='v4-add-t'>" + (brandMode ? tt.addBrand : tt.addProfile) + "</span>" +
      "<span class='v4-add-s'>Threads · LinkedIn " + tt.networkSoon.toLowerCase() + "</span></button>";
  }

  function grid(r, lang, opts) {
    var tt = t(lang), brandMode = r.show_brand_level;
    var cards;
    if (brandMode) {
      var exp = opts.expand != null ? opts.expand : 0;
      cards = r.brands.map(function (b, i) { return brandCard(b, lang, i === exp); }).join("");
    } else {
      cards = r.profiles.map(function (p) { return profileCard(p, lang); }).join("");
    }
    return "<section class='v4-gridwrap'>" +
      "<header class='v4-grid-head'><span class='v4-grid-t'>" + (brandMode ? tt.secBrands : tt.secChannels) + "</span>" +
      "<span class='v4-grid-n'>" + (brandMode ? r.brands.length : r.profiles.length) + "</span>" + needsChips(r, lang) + "</header>" +
      "<div class='v4-grid" + (brandMode ? " v4-grid--brand" : "") + "'>" + cards + addTile(brandMode, lang) + "</div></section>";
  }

  function skeleton(lang) {
    function s(w, h, mt) { return "<div class='v-skel' style='width:" + w + ";height:" + h + "px" + (mt ? ";margin-top:" + mt + "px" : "") + "'></div>"; }
    function card() { return "<div class='v4-card'><div class='v4-card-head'>" + s("40px", 40, 0) + "<div style='flex:1'>" + s("80px", 13) + s("50px", 10, 6) + "</div></div><div class='v4-metrics' style='margin-top:14px'>" + s("100%", 30) + s("100%", 30) + s("100%", 30) + s("100%", 30) + "</div></div>"; }
    return "<header class='v4-head'>" + s("220px", 20) + "<div class='v-spacer'></div>" + s("260px", 30) + "</header>" +
      "<div class='v4-adv'>" + s("100%", 20) + "</div>" +
      "<div class='v4-grid'>" + card() + card() + card() + "</div>";
  }

  function render(ctx) {
    var r = ctx.r, lang = ctx.lang, opts = ctx.opts || {};
    if (r.loading) return "<div class='v4'>" + skeleton(lang) + "</div>";
    var head = "<header class='v4-head'><div class='v4-id'><span class='v4-id-mono'>" + VK.ACCOUNT.mono + "</span>" +
      "<div class='v4-id-txt'><div class='v4-id-name'>" + VK.ACCOUNT.name + "<span class='v-plan'>" + VK.ACCOUNT.plan + "</span></div>" +
      "<div class='v4-id-scale'>" + VK.scaleLine(r, lang) + "</div></div></div>" + inlineTotals(r, lang) + "</header>";
    return "<div class='v4'>" + head + advisorStrip(r, lang) + grid(r, lang, opts) + "</div>";
  }

  // expand toggle
  if (!window.__v4wired) {
    window.__v4wired = true;
    document.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-v4-expand]");
      if (!btn) return;
      e.preventDefault();
      var list = btn.closest(".v4-card").querySelector(".v4-bp-list");
      if (list) { var open = list.hidden; list.hidden = !open; btn.setAttribute("aria-expanded", open ? "true" : "false"); }
    });
  }

  window.V4 = { render: render, name: { ru: "Решётка", de: "Kanal-Raster" } };
})();
