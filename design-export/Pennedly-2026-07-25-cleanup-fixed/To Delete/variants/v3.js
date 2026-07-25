/* variants/v3.js — CONCEPT V3 · "Советник" (Advisor-led briefing).
   Center of gravity: the AI VERDICT. The screen opens like a morning briefing —
   a large editorial conclusion over the whole portfolio, its grounded chips and
   recommendations as the primary actions. The four totals and the channels sit
   below as EVIDENCE — the numbers the verdict is built on. The 204/thin state is
   first-class here: an honest invitation with starter questions, no fake verdict. */
(function () {
  "use strict";
  var VK = window.VK, ic = VK.ic, t = VK.t, L = VK.L, avatar = VK.avatar, fmtK = VK.fmtK;

  var S3 = {
    ru: {
      briefing: "Брифинг портфеля", evidence: "Доказательства",
      evNote: "Цифры и каналы, на которые опирается вывод", ask: "Спросите совет по портфелю…",
      tryAsk: "Например", ofPortfolio: "по портфелю",
      starters: ["Что чинить в первую очередь?", "Где просел темп постинга?", "Какой профиль растёт быстрее?"],
    },
    de: {
      briefing: "Portfolio-Briefing", evidence: "Belege",
      evNote: "Zahlen und Kanäle, auf denen das Urteil beruht", ask: "Frag den Portfolio-Rat…",
      tryAsk: "Zum Beispiel", ofPortfolio: "im Portfolio",
      starters: ["Was zuerst reparieren?", "Wo sank das Posting-Tempo?", "Welches Profil wächst schneller?"],
    },
  };
  function s3(l) { return S3[l] || S3.ru; }

  function heroHead(lang) {
    var tt = t(lang);
    return "<div class='v3-hero-head'><span class='v3-adv-mark'>" + ic("advisor", 19) + "</span>" +
      "<div class='v3-hero-htxt'><span class='v3-hero-t'>" + tt.advTitle + "</span><span class='v3-hero-scope'>" + tt.advScope + "</span></div>" +
      "<button class='v-btn v-btn--sm v3-hero-open'>" + ic("advisor", 14) + tt.advOpen + "</button></div>";
  }
  function composer(lang) {
    var tt = t(lang), sl = s3(lang);
    return "<div class='v3-ask'><span class='v3-ask-ph'>" + sl.ask + "</span><button class='v3-ask-send'>" + ic("send", 16) + "</button></div>";
  }

  function reco(r, lang) {
    var tone = r.tone === "danger" ? " v3-reco--danger" : r.tone === "accent" ? " v3-reco--accent" : "";
    return "<a class='v3-reco" + tone + "'><span class='v3-reco-ic'>" + ic(r.icon, 15) + "</span>" +
      "<span class='v3-reco-txt'><span class='v3-reco-t'>" + L(r.t, lang) + "</span><span class='v3-reco-s'>" + L(r.s, lang) + "</span></span>" +
      "<span class='v3-reco-go'>" + ic("chev-right", 16) + "</span></a>";
  }

  function verdictHero(r, lang) {
    var tt = t(lang), a = VK.ADVISOR.verdict;
    var chips = a.chips.map(function (c) { return VK.chip(c, lang); }).join("");
    var recos = a.recos.map(function (rr) { return reco(rr, lang); }).join("");
    return "<section class='v3-hero'>" + heroHead(lang) +
      "<h1 class='v3-verdict'>" + L(a.verdict, lang) + "</h1>" +
      "<p class='v3-detail'>" + L(a.detail, lang) + "</p>" +
      "<div class='v3-chips'>" + chips + "</div>" +
      "<div class='v3-grounded'>" + ic("sparkle", 12) + "<span class='v3-grounded-lab'>" + tt.advBasis + ":</span> " + L(a.grounded, lang) + "</div>" +
      "<div class='v3-recos-cap'>" + tt.advReco + "</div>" +
      "<div class='v3-recos'>" + recos + "</div>" +
      composer(lang) + "</section>";
  }

  function thinHero(r, lang) {
    var th = VK.ADVISOR.thin, sl = s3(lang);
    var starters = sl.starters.map(function (q) { return "<button class='v3-starter'>" + ic("sparkle", 12) + q + "</button>"; }).join("");
    return "<section class='v3-hero v3-hero--thin'>" + heroHead(lang) +
      "<h1 class='v3-verdict v3-verdict--thin'>" + L(th.title, lang) + "</h1>" +
      "<p class='v3-detail'>" + L(th.body, lang) + "</p>" +
      "<div class='v3-starters-cap'>" + sl.tryAsk + "</div>" +
      "<div class='v3-starters'>" + starters + "</div>" +
      composer(lang) + "</section>";
  }

  // evidence: totals bar + channel evidence cards
  function totalsBar(r, lang) {
    var cells = VK.totalsSpec(r, lang).map(function (m) {
      var val = m.value == null ? "—" : fmtK(m.value);
      var delta = (m.delta != null && m.value != null) ? "<span class='v3-ev-delta'>" + VK.deltaEl(m.delta) + "</span>" : "";
      return "<div class='v3-ev-t" + (m.attention ? " v3-ev-t--attn" : "") + "'>" +
        "<span class='v3-ev-lab'>" + ic(m.icon, 12) + m.label + "</span>" +
        "<span class='v3-ev-val'>" + val + delta + "</span>" +
        "<span class='v3-ev-sub'>" + m.sub + "</span></div>";
    }).join("");
    return "<div class='v3-ev-totals'>" + cells + "</div>";
  }

  function evCardProfile(p, lang) {
    var tt = t(lang);
    var body;
    if (p.sync === "importing") body = "<div class='v3-ev-state v3-ev-state--imp'>" + ic("clock", 13) + tt.importing + " · " + p.import.pct + "%</div>";
    else if (p.sync === "error") body = "<div class='v3-ev-state v3-ev-state--err'>" + ic("alert", 13) + tt.syncError + "<button class='v-btn v-btn--sm v-btn--danger'>" + ic("undo", 11) + tt.retry + "</button></div>";
    else if (p.sync === "disconnected") body = "<div class='v3-ev-state v3-ev-state--off'>" + ic("plug", 13) + tt.disconnected + "<button class='v-btn v-btn--sm'>" + tt.reconnect + "</button></div>";
    else body = "<div class='v3-ev-metrics'>" +
      "<span><b>" + fmtK(p.followers) + "</b> " + tt.followers.toLowerCase() + "</span><span><b>" + fmtK(p.views_7d) + "</b> " + tt.views.toLowerCase() + "</span></div>";
    var voice = (!p.has_voice && p.sync === "synced") ? VK.voiceTag(p, lang) : "";
    return "<div class='v3-ev-card v3-ev-card--click" + (p.sync === "disconnected" ? " v3-ev-card--off" : "") + "'>" +
      "<div class='v3-ev-head'>" + avatar(p, 32, { dim: p.sync === "disconnected" }) +
      "<span class='v3-ev-id'><span class='v3-ev-nm'>" + p.handle + "</span><span class='v3-ev-hd'>" + VK.NETWORKS[p.network].label + "</span></span>" + voice + ic("chev-right", 15) + "</div>" +
      body + "</div>";
  }
  function evCardBrand(b, lang) {
    var tt = t(lang);
    var stack = b.profiles.slice(0, 3).map(function (k) { return avatar(VK.profile(k), 22, { noBadge: true, cls: "v3-stackav" }); }).join("");
    var stat = b.counts.error ? "<span class='v-sync v-sync--error'><span class='v-sync-dot'></span>" + b.counts.error + " " + tt.nError + "</span>"
      : b.counts.importing ? "<span class='v-sync v-sync--imp'><span class='v-sync-dot'></span>" + b.counts.importing + " " + tt.nImporting + "</span>"
      : "<span class='v-sync'><span class='v-sync-dot'></span>" + tt.allSynced + "</span>";
    return "<a class='v3-ev-card v3-ev-card--brand'>" +
      "<div class='v3-ev-head'><span class='v3-brandmark'>" + b.mono + "</span>" +
      "<span class='v3-ev-id'><span class='v3-ev-nm'>" + b.name + "</span><span class='v3-ev-hd'>" + b.profiles.length + "\u00A0" + VK.plW(b.profiles.length, tt.profilesW, lang) + " · " + VK.brandKind(b, lang) + "</span></span>" + ic("chev-right", 15) + "</div>" +
      "<div class='v3-ev-metrics'><span><b>" + fmtK(b.stats.followers) + "</b> " + tt.followers.toLowerCase() + "</span><span><b>" + fmtK(b.stats.views_7d) + "</b> " + tt.views.toLowerCase() + "</span></div>" +
      "<div class='v3-ev-brandfoot'><span class='v3-stack'>" + stack + "</span>" + stat + "</div></a>";
  }
  function evidence(r, lang) {
    var tt = t(lang), sl = s3(lang), brandMode = r.show_brand_level;
    var cards = brandMode ? r.brands.map(function (b) { return evCardBrand(b, lang); }).join("") : r.profiles.map(function (p) { return evCardProfile(p, lang); }).join("");
    var add = "<button class='v3-ev-card v3-ev-add'>" + ic("plus", 16) + "<span>" + (brandMode ? tt.addBrand : tt.addProfile) + "</span></button>";
    return "<section class='v3-evidence'>" +
      "<header class='v3-ev-header'><span class='v3-ev-title'>" + tt.stats + " · " + (brandMode ? tt.secBrands : tt.secProfiles) + "</span><span class='v3-ev-note'>" + sl.evNote + "</span></header>" +
      totalsBar(r, lang) +
      "<div class='v3-ev-grid'>" + cards + add + "</div></section>";
  }

  function identity(r, lang) {
    return "<div class='v3-id'><span class='v3-id-mono'>" + VK.ACCOUNT.mono + "</span>" +
      "<span class='v3-id-name'>" + VK.ACCOUNT.name + "</span><span class='v-plan'>" + VK.ACCOUNT.plan + "</span>" +
      "<span class='v3-id-scale'>" + VK.scaleLine(r, lang) + "</span></div>";
  }

  function skeleton(lang) {
    function s(w, h, mt) { return "<div class='v-skel' style='width:" + w + ";height:" + h + "px" + (mt ? ";margin-top:" + mt + "px" : "") + "'></div>"; }
    return "<div class='v3-id'>" + s("34px", 34) + s("160px", 15) + "</div>" +
      "<section class='v3-hero'>" + s("180px", 14) + s("90%", 30, 16) + s("70%", 30, 8) + s("100%", 44, 16) + "<div class='v3-recos' style='margin-top:16px'>" + s("100%", 60) + s("100%", 60) + "</div></section>" +
      "<section class='v3-evidence'>" + s("160px", 13) + s("100%", 70, 12) + "</section>";
  }

  function render(ctx) {
    var r = ctx.r, lang = ctx.lang;
    if (r.loading) return "<div class='v3'>" + skeleton(lang) + "</div>";
    return "<div class='v3'>" + identity(r, lang) +
      (r.advisor === "thin" ? thinHero(r, lang) : verdictHero(r, lang)) +
      evidence(r, lang) + "</div>";
  }

  window.V3 = { render: render, name: { ru: "Советник", de: "Berater" } };
})();
