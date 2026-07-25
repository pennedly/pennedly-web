/* variants/v5.js — CONCEPT V5 · "Диалог" (Conversational, calm home).
   Center of gravity: a conversation. The screen opens with the advisor speaking
   first — an invitation + a compact summary — and everything else unfolds on
   demand. One calm centered column, low density, sidebar-less chrome. It is the
   most natural home for the 204/thin state (little data → just an invitation)
   and for owners who find dense dashboards overwhelming. */
(function () {
  "use strict";
  var VK = window.VK, ic = VK.ic, t = VK.t, L = VK.L, avatar = VK.avatar, fmtK = VK.fmtK;

  var S5 = {
    ru: {
      hi: "С возвращением", ask: "Спросите о портфеле…", tryAsk: "или спросите",
      channels: "Каналы", channelsShow: "каналов в портфеле", needsAtt: "требует внимания", allCalm: "всё спокойно",
      advName: "Советник Pennedly", summary: "Портфель сегодня", replyWith: "Быстрый ответ",
    },
    de: {
      hi: "Willkommen zurück", ask: "Frag zu deinem Portfolio…", tryAsk: "oder frag",
      channels: "Kanäle", channelsShow: "Kanäle im Portfolio", needsAtt: "braucht Aufmerksamkeit", allCalm: "alles ruhig",
      advName: "Pennedly Berater", summary: "Portfolio heute", replyWith: "Schnellantwort",
    },
  };
  function s5(l) { return S5[l] || S5.ru; }

  function composer(lang) {
    return "<div class='v5-composer'><span class='v5-composer-ph'>" + s5(lang).ask + "</span><button class='v5-composer-send'>" + ic("send", 17) + "</button></div>";
  }

  function dialogue(r, lang) {
    var tt = t(lang), sl = s5(lang);
    var name = "<div class='v5-dlg-name'><span class='v5-dlg-mark'>" + ic("advisor", 15) + "</span>" + sl.advName + "<span class='v5-dlg-scope'>· " + tt.advScope + "</span></div>";
    if (r.advisor === "thin") {
      var th = VK.ADVISOR.thin;
      var starters = s5(lang) && S3starters(lang).map(function (q) { return "<button class='v5-reply'>" + q + "</button>"; }).join("");
      return "<section class='v5-dlg'>" + name +
        "<div class='v5-dlg-bubble'><div class='v5-dlg-verdict v5-dlg-verdict--thin'>" + L(th.title, lang) + "</div>" +
        "<p class='v5-dlg-detail'>" + L(th.body, lang) + "</p></div>" +
        "<div class='v5-reply-cap'>" + sl.tryAsk + "</div><div class='v5-replies'>" + starters + "</div>" +
        composer(lang) + "</section>";
    }
    var a = VK.ADVISOR.verdict;
    var chips = a.chips.map(function (c) { return VK.chip(c, lang); }).join("");
    var replies = a.recos.map(function (rr) { return "<button class='v5-reply v5-reply--" + rr.tone + "'>" + ic(rr.icon, 12) + L(rr.t, lang) + "</button>"; }).join("");
    return "<section class='v5-dlg'>" + name +
      "<div class='v5-dlg-bubble'>" +
      "<div class='v5-dlg-verdict'>" + L(a.verdict, lang) + "</div>" +
      "<p class='v5-dlg-detail'>" + L(a.detail, lang) + "</p>" +
      "<div class='v5-dlg-chips'>" + chips + "</div>" +
      "<div class='v5-dlg-grounded'>" + ic("sparkle", 11) + tt.advBasis + ": " + L(a.grounded, lang) + "</div></div>" +
      "<div class='v5-reply-cap'>" + sl.replyWith + "</div><div class='v5-replies'>" + replies + "</div>" +
      composer(lang) + "</section>";
  }
  function S3starters(lang) {
    return lang === "de"
      ? ["Was zuerst reparieren?", "Wo sank das Tempo?", "Welches Profil wächst?"]
      : ["Что чинить в первую очередь?", "Где просел темп?", "Какой профиль растёт?"];
  }

  function summary(r, lang) {
    var tt = t(lang), sl = s5(lang);
    var cells = VK.totalsSpec(r, lang).map(function (m) {
      var val = m.value == null ? "—" : fmtK(m.value);
      var delta = (m.delta != null && m.value != null) ? " " + VK.deltaEl(m.delta) : "";
      return "<div class='v5-sum-cell" + (m.attention ? " v5-sum-cell--attn" : "") + "'><span class='v5-sum-val'>" + val + delta + "</span><span class='v5-sum-lab'>" + m.label + "</span></div>";
    }).join("");
    var items = VK.needsItems(r.tasks, lang);
    var needs = "";
    if (items.length) {
      var chips = items.map(function (it) { return "<span class='v5-need v5-need--" + it.tone + "'>" + ic(it.icon, 12) + "<b>" + it.n + "</b> " + VK.plW(it.n, it.word, lang) + "</span>"; }).join("");
      needs = "<button class='v5-sum-needs'><span class='v5-sum-needs-lab'>" + ic("bolt", 13) + tt.needsYou + "</span><span class='v5-sum-needs-chips'>" + chips + "</span>" + ic("arrow-right", 14) + "</button>";
    }
    return "<section class='v5-sum'><header class='v5-sum-h'>" + ic("chart", 13) + sl.summary + "</header>" +
      "<div class='v5-sum-grid'>" + cells + "</div>" + needs + "</section>";
  }

  function chRow(p, lang) {
    var tt = t(lang), right;
    if (p.sync === "synced") right = "<span class='v5-ch-mini'><b>" + fmtK(p.followers) + "</b> " + tt.followers.toLowerCase() + (p.replies > 0 ? " · <span class='v5-ch-att'>" + p.replies + " " + tt.replies.toLowerCase() + "</span>" : "") + "</span>";
    else if (p.sync === "importing") right = "<span class='v-sync v-sync--imp'><span class='v-sync-dot'></span>" + tt.importing + "</span>";
    else if (p.sync === "error") right = "<span class='v-sync v-sync--error'><span class='v-sync-dot'></span>" + tt.syncError + "</span>";
    else right = "<span class='v-sync v-sync--off'><span class='v-sync-dot'></span>" + tt.disconnected + "</span>";
    return "<a class='v5-ch-row'>" + avatar(p, 30, { dim: p.sync === "disconnected" }) +
      "<span class='v5-ch-nm'>" + p.handle + "</span>" + right + ic("chev-right", 14) + "</a>";
  }
  function brandRow(b, lang) {
    var tt = t(lang);
    var stack = b.profiles.slice(0, 3).map(function (k) { return avatar(VK.profile(k), 22, { noBadge: true, cls: "v5-stackav" }); }).join("");
    var stat = b.counts.error ? "<span class='v-sync v-sync--error'><span class='v-sync-dot'></span>" + b.counts.error + " " + tt.nError + "</span>"
      : b.counts.importing ? "<span class='v-sync v-sync--imp'><span class='v-sync-dot'></span>" + b.counts.importing + " " + tt.nImporting + "</span>"
      : "<span class='v-sync'><span class='v-sync-dot'></span>" + tt.allSynced + "</span>";
    return "<a class='v5-ch-row v5-ch-row--brand'><span class='v5-brandmark'>" + b.mono + "</span>" +
      "<span class='v5-ch-nm'>" + b.name + "</span><span class='v5-stack'>" + stack + "</span>" + stat + ic("chev-right", 14) + "</a>";
  }
  function channels(r, lang, open) {
    var tt = t(lang), sl = s5(lang), brandMode = r.show_brand_level;
    var n = brandMode ? r.brands.length : r.profiles.length;
    var attn = r.profiles.filter(function (p) { return p.sync === "error" || p.sync === "disconnected"; }).length;
    var attnTxt = attn ? attn + " " + sl.needsAtt : sl.allCalm;
    var rows = brandMode ? r.brands.map(function (b) { return brandRow(b, lang); }).join("") : r.profiles.map(function (p) { return chRow(p, lang); }).join("");
    var add = "<button class='v5-ch-row v5-ch-add'>" + ic("plus", 15) + (brandMode ? tt.addBrand : tt.addProfile) + "</button>";
    return "<section class='v5-ch'>" +
      "<button class='v5-ch-toggle' data-v5-expand aria-expanded='" + (open ? "true" : "false") + "'>" +
      "<span class='v5-ch-tt'>" + (brandMode ? tt.secBrands : sl.channels) + "</span><span class='v5-ch-cnt'>" + n + "</span>" +
      "<span class='v5-ch-attn" + (attn ? " v5-ch-attn--on" : "") + "'>" + attnTxt + "</span>" + ic("chev-down", 16) + "</button>" +
      "<div class='v5-ch-body'" + (open ? "" : " hidden") + ">" + rows + add + "</div></section>";
  }

  function skeleton(lang) {
    function s(w, h, mt) { return "<div class='v-skel' style='width:" + w + ";height:" + h + "px" + (mt ? ";margin-top:" + mt + "px" : "") + ";margin-left:auto;margin-right:auto'></div>"; }
    return "<div class='v5'>" + s("240px", 22, 0) +
      "<section class='v5-dlg'>" + s("180px", 14) + s("100%", 26, 16) + s("90%", 26, 8) + s("100%", 46, 18) + "</section>" +
      "<section class='v5-sum'>" + s("100%", 80) + "</section></div>";
  }

  function render(ctx) {
    var r = ctx.r, lang = ctx.lang, sl = s5(lang), opts = ctx.opts || {};
    if (r.loading) return skeleton(lang);
    var first = VK.ACCOUNT.name.split(" ")[0];
    var greet = "<div class='v5-greet'><h1 class='v5-greet-t'>" + sl.hi + ", " + first + "</h1>" +
      "<div class='v5-greet-s'>" + VK.scaleLine(r, lang) + "</div></div>";
    return "<div class='v5'>" + greet + dialogue(r, lang) + summary(r, lang) + channels(r, lang, opts.chOpen) + "</div>";
  }

  if (!window.__v5wired) {
    window.__v5wired = true;
    document.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-v5-expand]");
      if (!btn) return;
      e.preventDefault();
      var body = btn.parentElement.querySelector(".v5-ch-body");
      if (body) { var open = body.hidden; body.hidden = !open; btn.setAttribute("aria-expanded", open ? "true" : "false"); }
    });
  }

  window.V5 = { render: render, name: { ru: "Диалог", de: "Dialog" } };
})();
