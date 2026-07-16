/* account/v3.js — PRODUCTION build of the chosen concept V3 "Советник"
   (Advisor-led briefing). Center of gravity: the AI VERDICT. The screen opens
   like a morning briefing — a large editorial conclusion over the whole
   portfolio, its grounded chips + recommendations as the primary actions. The
   four totals and the channels sit BELOW as EVIDENCE.

   Product decisions baked in (see Account-Dashboard-SPEC §Advisor routing):
   • No "Советник" nav item — the dashboard is the advisor's home.
   • The ask line + "Открыть советника" DON'T expand a chat inline: they route to
     the chat screen (/app/account/advisor) seeding the first question. Marked
     with data-nav="advisor-chat" + data-seed for 1:1 wiring.
   • 204/thin advisor is first-class: honest invitation + starters, no fake verdict.
   • 2+ brands → brand cards that EXPAND inline into profile rows (sync states
     shown both on the direct profile card and inside the expanded brand). */
(function () {
  "use strict";
  var VK = window.VK, ic = VK.ic, t = VK.t, L = VK.L, avatar = VK.avatar, fmtK = VK.fmtK;

  var S3 = {
    ru: {
      evNote: "Цифры и каналы, на которые опирается вывод", ask: "Спросите совет по портфелю…",
      tryAsk: "Например", askHint: "Вопрос откроет чат-советника",
      starters: ["Что чинить в первую очередь?", "Где просел темп постинга?", "Какой профиль растёт быстрее?"],
    },
    de: {
      evNote: "Zahlen und Kanäle, auf denen das Urteil beruht", ask: "Frag den Portfolio-Rat…",
      tryAsk: "Zum Beispiel", askHint: "Die Frage öffnet den Chat-Berater",
      starters: ["Was zuerst reparieren?", "Wo sank das Posting-Tempo?", "Welches Profil wächst schneller?"],
    },
  };
  function s3(l) { return S3[l] || S3.ru; }

  /* ── hero head: advisor mark + title + scope + "open chat" ── */
  function heroHead(lang) {
    var tt = t(lang);
    return "<div class='v3-hero-head'><span class='v3-adv-mark'>" + ic("advisor", 19) + "</span>" +
      "<div class='v3-hero-htxt'><span class='v3-hero-t'>" + tt.advTitle + "</span><span class='v3-hero-scope'>" + tt.advScope + "</span></div>" +
      "<button class='v-btn v-btn--sm v3-hero-open' data-nav='advisor-chat'>" + ic("advisor", 14) + "<span>" + tt.advOpen + "</span></button></div>";
  }

  /* ── ask composer: routes to the chat screen, seeding the question ── */
  function composer(lang) {
    var sl = s3(lang);
    return "<div class='v3-ask' data-nav='advisor-chat' data-seed=''>" +
      "<span class='v3-ask-ph'>" + sl.ask + "</span>" +
      "<button class='v3-ask-send' aria-label='" + sl.ask + "'>" + ic("send", 16) + "</button></div>" +
      "<div class='v3-ask-hint'>" + ic("arrow-up-right", 11) + sl.askHint + "</div>";
  }

  /* ── one recommendation (primary action; deep-links into the breakdown) ── */
  function reco(r, lang) {
    var tone = r.tone === "danger" ? " v3-reco--danger" : r.tone === "accent" ? " v3-reco--accent" : "";
    return "<a class='v3-reco" + tone + "' data-to='" + (r.to || "") + "'>" +
      "<span class='v3-reco-ic'>" + ic(r.icon, 15) + "</span>" +
      "<span class='v3-reco-txt'><span class='v3-reco-t'>" + L(r.t, lang) + "</span><span class='v3-reco-s'>" + L(r.s, lang) + "</span></span>" +
      "<span class='v3-reco-go'>" + ic("chev-right", 16) + "</span></a>";
  }

  /* ── verdict hero (advisor has a verdict) ── */
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

  /* ── thin hero (204 / not enough data → honest invitation) ── */
  function thinHero(r, lang) {
    var sl = s3(lang), tt = t(lang);
    var allOff = r.profiles && r.profiles.length && r.profiles.every(function (p) { return p.sync === "disconnected"; });
    var th = allOff ? (VK.ADVISOR.off || VK.ADVISOR.thin) : VK.ADVISOR.thin;
    var mid;
    if (allOff) {
      // reconnect is the primary action — analysis starters would be misleading
      mid = "<div class='v3-starters' style='margin-top:16px'>" +
        "<button class='v3-starter' data-nav='picker'>" + ic("plug", 12) + tt.reconnect + "</button></div>";
    } else {
      var starters = sl.starters.map(function (q) { return "<button class='v3-starter' data-nav='advisor-chat' data-seed='" + q + "'>" + ic("sparkle", 12) + q + "</button>"; }).join("");
      mid = "<div class='v3-starters-cap'>" + sl.tryAsk + "</div><div class='v3-starters'>" + starters + "</div>";
    }
    return "<section class='v3-hero v3-hero--thin'>" + heroHead(lang) +
      "<h1 class='v3-verdict v3-verdict--thin'>" + L(th.title, lang) + "</h1>" +
      "<p class='v3-detail'>" + L(th.body, lang) + "</p>" +
      mid + composer(lang) + "</section>";
  }

  /* ── evidence: the four totals ── */
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

  /* ── importing / error / disconnected state block (shared by card + row) ── */
  function stateBlock(p, lang, compact) {
    var tt = t(lang);
    if (p.sync === "importing") {
      var pct = (p.import && p.import.pct != null) ? p.import.pct : 0;
      return "<div class='v3-ev-state v3-ev-state--imp'><span class='v3-spin'></span>" +
        "<b class='v3-ev-pct'>" + pct + "%</b>" +
        "<span class='v3-ev-imptxt'>" + tt.importing + "</span>" +
        "<span class='v3-ev-eta'>" + tt.importEta + "</span></div>";
    }
    if (p.sync === "error")
      return "<div class='v3-ev-state v3-ev-state--err'>" + ic("alert", 13) + "<span class='v3-ev-imptxt'>" + tt.syncError + "</span>" +
        "<button class='v-btn v-btn--sm v-btn--danger'>" + ic("undo", 11) + tt.retry + "</button></div>";
    if (p.sync === "disconnected")
      return "<div class='v3-ev-state v3-ev-state--off'>" + ic("plug", 13) + "<span class='v3-ev-imptxt'>" + tt.disconnected + "</span>" +
        "<button class='v-btn v-btn--sm'>" + tt.reconnect + "</button></div>";
    // synced → mini metrics
    return "<div class='v3-ev-metrics'>" +
      "<span><b>" + fmtK(p.followers) + "</b> " + tt.followers.toLowerCase() + "</span>" +
      "<span><b>" + fmtK(p.views_7d) + "</b> " + tt.views.toLowerCase() + "</span></div>";
  }

  /* ── profile evidence card (1-brand mode, or standalone) ── */
  function evCardProfile(p, lang) {
    var tt = t(lang);
    var voice = (!p.has_voice && p.sync === "synced") ? VK.voiceTag(p, lang) : "";
    return "<div class='v3-ev-card v3-ev-card--click" + (p.sync === "disconnected" ? " v3-ev-card--off" : "") + "'>" +
      "<div class='v3-ev-head'>" + avatar(p, 32, { dim: p.sync === "disconnected" }) +
      "<span class='v3-ev-id'><span class='v3-ev-nm'>" + p.handle + "</span><span class='v3-ev-hd'>" + VK.NETWORKS[p.network].label + "</span></span>" +
      voice + ic("chev-right", 15) + "</div>" +
      stateBlock(p, lang) + "</div>";
  }

  /* ── profile row inside an expanded brand card ── */
  function bpRow(p, lang) {
    return "<div class='v3-bp" + (p.sync === "disconnected" ? " v3-bp--off" : "") + "'>" +
      avatar(p, 26, { dim: p.sync === "disconnected" }) +
      "<span class='v3-bp-id'><span class='v3-ev-nm'>" + p.handle + "</span><span class='v3-ev-hd'>" + VK.NETWORKS[p.network].label + "</span></span>" +
      "<span class='v3-bp-state'>" + stateBlock(p, lang) + "</span></div>";
  }

  /* ── brand evidence card (2+-brand mode) — expands into profile rows ── */
  function evCardBrand(b, lang, opts) {
    opts = opts || {};
    var tt = t(lang);
    var stack = b.profiles.slice(0, 3).map(function (k) { return avatar(VK.profile(k), 22, { noBadge: true, cls: "v3-stackav" }); }).join("");
    var stat = b.counts.error ? "<span class='v-sync v-sync--error'><span class='v-sync-dot'></span>" + b.counts.error + " " + tt.nError + "</span>"
      : b.counts.importing ? "<span class='v-sync v-sync--imp'><span class='v-sync-dot'></span>" + b.counts.importing + " " + tt.nImporting + "</span>"
        : "<span class='v-sync'><span class='v-sync-dot'></span>" + tt.allSynced + "</span>";
    var expanded = !!opts.expanded;
    var rows = expanded ? "<div class='v3-bexpand'>" + b.profiles.map(function (k) { return bpRow(VK.profile(k), lang); }).join("") + "</div>" : "";
    var toggle = "<button class='v3-bp-toggle" + (expanded ? " is-open" : "") + "' data-expand='" + b.key + "'>" +
      (expanded ? tt.collapse : tt.expand) + ic(expanded ? "chev-up" : "chev-down", 14) + "</button>";
    return "<div class='v3-ev-card v3-ev-card--brand" + (expanded ? " is-open" : "") + "'>" +
      "<a class='v3-ev-brandmain'>" +
      "<div class='v3-ev-head'><span class='v3-brandmark'>" + b.mono + "</span>" +
      "<span class='v3-ev-id'><span class='v3-ev-nm'>" + b.name + "</span><span class='v3-ev-hd'>" + b.profiles.length + "\u00A0" + VK.plW(b.profiles.length, tt.profilesW, lang) + " · " + VK.brandKind(b, lang) + "</span></span>" + ic("chev-right", 15) + "</div>" +
      "<div class='v3-ev-metrics'><span><b>" + fmtK(b.stats.followers) + "</b> " + tt.followers.toLowerCase() + "</span><span><b>" + fmtK(b.stats.views_7d) + "</b> " + tt.views.toLowerCase() + "</span></div>" +
      "<div class='v3-ev-brandfoot'><span class='v3-stack'>" + stack + "</span>" + stat + "</div></a>" +
      toggle + rows + "</div>";
  }

  /* ── add tile (add brand / add profile / connect-more when all off) ── */
  function addTile(r, lang) {
    var tt = t(lang);
    var allOff = r.profiles.length > 0 && r.profiles.every(function (p) { return p.sync === "disconnected"; });
    var label = allOff ? tt.connectMore : (r.show_brand_level ? tt.addBrand : tt.addProfile);
    return "<button class='v3-ev-card v3-ev-add' data-nav='picker'>" + ic("plus", 16) + "<span>" + label + "</span></button>";
  }

  function evidence(r, lang, opts) {
    opts = opts || {};
    var tt = t(lang), sl = s3(lang), brandMode = r.show_brand_level;
    var cards;
    if (brandMode) {
      cards = r.brands.map(function (b) {
        var open = opts.expand === true ? true : (opts.expand === b.key);
        return evCardBrand(b, lang, { expanded: open });
      }).join("");
    } else {
      cards = r.profiles.map(function (p) { return evCardProfile(p, lang); }).join("");
    }
    return "<section class='v3-evidence'>" +
      "<header class='v3-ev-header'><span class='v3-ev-title'>" + tt.stats + " · " + (brandMode ? tt.secBrands : tt.secProfiles) + "</span><span class='v3-ev-note'>" + sl.evNote + "</span></header>" +
      totalsBar(r, lang) +
      "<div class='v3-ev-grid'>" + cards + addTile(r, lang) + "</div></section>";
  }

  /* ── account identity (quiet — the verdict is the star) ── */
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
    var r = ctx.r, lang = ctx.lang, opts = ctx.opts || {};
    if (r.loading) return "<div class='v3'>" + skeleton(lang) + "</div>";
    return "<div class='v3'>" + identity(r, lang) +
      (r.advisor === "thin" ? thinHero(r, lang) : verdictHero(r, lang)) +
      evidence(r, lang, { expand: opts.expand }) + "</div>";
  }

  window.V3 = {
    render: render, name: { ru: "Советник", de: "Berater" },
    // exported builders for the SPEC anatomy sections
    identity: identity, verdictHero: verdictHero, thinHero: thinHero, skeleton: skeleton,
    evidence: evidence, totalsBar: totalsBar,
    evCardProfile: evCardProfile, evCardBrand: evCardBrand, bpRow: bpRow, addTile: addTile,
    heroHead: heroHead, composer: composer, reco: reco, s3: s3,
  };
})();
