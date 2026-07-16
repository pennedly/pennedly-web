/* variants/v1.js — CONCEPT V1 · "Пульт" (Portfolio command deck).
   Center of gravity: the four portfolio TOTALS + live SIGNALS, read like a
   mission-control console. Big tabular tickers up top answer "how is the whole
   portfolio right now"; the "Требует тебя" console answers "what's blinking".
   The advisor is a compact readout, and the channels are a quiet secondary
   strip — because here the numbers lead, not the cards. */
(function () {
  "use strict";
  var VK = window.VK, ic = VK.ic, t = VK.t, L = VK.L, avatar = VK.avatar, fmtK = VK.fmtK;

  function identity(r, lang) {
    var tt = t(lang), A = VK.ACCOUNT;
    return "<div class='v1-id'>" +
      "<span class='v1-id-mono'>" + A.mono + "</span>" +
      "<div class='v1-id-txt'><div class='v1-id-name'>" + A.name + "<span class='v-plan'>" + A.plan + "</span></div>" +
      "<div class='v1-id-scale'>" + VK.scaleLine(r, lang) + "</div></div>" +
      "<span class='v1-live'><span class='v1-live-dot'></span>" + tt.updatedDaily + "</span></div>";
  }

  function ticker(r, lang) {
    var tt = t(lang);
    var cells = VK.totalsSpec(r, lang).map(function (m) {
      var val = m.value == null ? "—" : fmtK(m.value);
      // delta rides in the sub-line (keeps the big number single-line at any width)
      var sub = (m.delta != null && m.value != null)
        ? "<span class='v1-tk-delta'>" + VK.deltaEl(m.delta) + "</span> " + tt.per30
        : m.sub;
      return "<div class='v1-tk" + (m.attention ? " v1-tk--attn" : "") + "'>" +
        "<div class='v1-tk-lab'>" + ic(m.icon, 13) + "<span>" + m.label + "</span></div>" +
        "<div class='v1-tk-num'>" + val + "</div>" +
        "<div class='v1-tk-sub'>" + sub + "</div></div>";
    }).join("");
    return "<div class='v1-ticker'>" + cells + "</div>";
  }

  function signals(r, lang) {
    var tt = t(lang), items = VK.needsItems(r.tasks, lang);
    if (!items.length) return ""; // brief: no signals → block disappears
    var rows = items.map(function (it) {
      var ctx = it.type === "sync" ? "@field.co" : it.type === "reply" ? tt.subAll : it.type === "draft" ? tt.subAll : tt.subWeek;
      return "<div class='v1-sig v1-sig--" + it.tone + "'>" +
        "<span class='v1-sig-ic'>" + ic(it.icon, 15) + "</span>" +
        "<span class='v1-sig-n'>" + it.n + "</span>" +
        "<span class='v1-sig-txt'><span class='v1-sig-word'>" + VK.plW(it.n, it.word, lang) + "</span><span class='v1-sig-ctx'>" + ctx + "</span></span>" +
        "<button class='v-btn v-btn--sm v1-sig-go'>" + it.cta + ic("arrow-right", 13) + "</button></div>";
    }).join("");
    return "<section class='v1-panel v1-signals'>" +
      "<header class='v1-panel-h'><span class='v1-panel-t'>" + ic("bolt", 15) + tt.needsYou + "</span>" +
      "<button class='v-btn v-btn--sm v-btn--ghost'>" + tt.resolveAll + ic("arrow-right", 13) + "</button></header>" +
      "<div class='v1-sig-list'>" + rows + "</div></section>";
  }

  function advisorReadout(r, lang) {
    var tt = t(lang);
    if (r.advisor === "thin") {
      var th = VK.ADVISOR.thin;
      return "<section class='v1-panel v1-adv v1-adv--thin'>" +
        "<header class='v1-panel-h'><span class='v1-panel-t'>" + ic("advisor", 15) + tt.advTitle + "</span><span class='v1-adv-scope'>" + tt.advScope + "</span></header>" +
        "<div class='v1-adv-thintitle'>" + L(th.title, lang) + "</div>" +
        "<p class='v1-adv-body'>" + L(th.body, lang) + "</p>" +
        "<div class='v1-adv-ask'><span class='v1-adv-ph'>" + tt.advAsk + "</span><button class='v1-adv-send'>" + ic("send", 16) + "</button></div></section>";
    }
    var a = VK.ADVISOR.verdict;
    var chips = a.chips.map(function (c) { return VK.chip(c, lang); }).join("");
    return "<section class='v1-panel v1-adv'>" +
      "<header class='v1-panel-h'><span class='v1-panel-t'>" + ic("advisor", 15) + tt.advTitle + "</span><span class='v1-adv-scope'>" + tt.advScope + "</span></header>" +
      "<div class='v1-adv-verdict'>" + L(a.verdict, lang) + "</div>" +
      "<div class='v1-adv-chips'>" + chips + "</div>" +
      "<div class='v1-adv-basis'>" + ic("sparkle", 12) + "<span class='v1-adv-basis-lab'>" + tt.advBasis + ":</span> " + L(a.grounded, lang) + "</div>" +
      "<div class='v1-adv-foot'><div class='v1-adv-ask'><span class='v1-adv-ph'>" + tt.advAsk + "</span><button class='v1-adv-send'>" + ic("send", 16) + "</button></div>" +
      "<button class='v-btn v-btn--sm v1-adv-open'>" + tt.advOpen + ic("arrow-right", 13) + "</button></div></section>";
  }

  // compact secondary channel row (profile)
  function profileRow(p, lang) {
    var tt = t(lang);
    var right;
    if (p.sync === "importing") right = "<span class='v1-ch-state v1-ch-state--imp'>" + ic("clock", 12) + p.import.pct + "%</span>";
    else if (p.sync === "error") right = "<button class='v-btn v-btn--sm v-btn--danger'>" + ic("undo", 12) + tt.retry + "</button>";
    else if (p.sync === "disconnected") right = "<button class='v-btn v-btn--sm'>" + ic("plug", 12) + tt.reconnect + "</button>";
    else right = "<span class='v1-ch-mini'><b>" + fmtK(p.followers) + "</b> " + tt.followers.toLowerCase() + " · <b>" + fmtK(p.views_7d) + "</b> " + tt.views.toLowerCase() + "</span>";
    var voice = (!p.has_voice && p.sync !== "disconnected" && p.sync !== "importing") ? VK.voiceTag(p, lang) : "";
    return "<div class='v1-ch v1-ch--click" + (p.sync === "disconnected" ? " v1-ch--off" : "") + "'>" +
      avatar(p, 34, { dim: p.sync === "disconnected" }) +
      "<span class='v1-ch-id'><span class='v1-ch-nm'>" + p.handle + "</span><span class='v1-ch-sub'>" + VK.syncLine(p, lang) + "</span></span>" +
      voice + "<span class='v1-ch-right'>" + right + "</span>" + ic("chev-right", 15) + "</div>";
  }

  function brandRow(b, lang) {
    var tt = t(lang);
    var stat = b.counts.error ? "<span class='v-sync v-sync--error'><span class='v-sync-dot'></span>" + b.counts.error + " " + tt.nError + "</span>"
      : b.counts.importing ? "<span class='v-sync v-sync--imp'><span class='v-sync-dot'></span>" + b.counts.importing + " " + tt.nImporting + "</span>"
      : "<span class='v-sync'><span class='v-sync-dot'></span>" + tt.allSynced + "</span>";
    var stack = b.profiles.slice(0, 3).map(function (k) { return avatar(VK.profile(k), 24, { noBadge: true, cls: "v1-stackav" }); }).join("");
    return "<a class='v1-ch v1-ch--brand'>" +
      "<span class='v1-brandmark'>" + b.mono + "</span>" +
      "<span class='v1-ch-id'><span class='v1-ch-nm'>" + b.name + "</span><span class='v1-ch-sub'>" + b.profiles.length + "\u00A0" + VK.plW(b.profiles.length, tt.profilesW, lang) + " · " + VK.brandKind(b, lang) + "</span></span>" +
      "<span class='v1-stack'>" + stack + "</span>" +
      "<span class='v1-ch-mini v1-ch-brandmini'><b>" + fmtK(b.stats.followers) + "</b> · <b>" + fmtK(b.stats.views_7d) + "</b> " + tt.views.toLowerCase() + "</span>" +
      "<span class='v1-ch-right'>" + stat + "</span>" + ic("chev-right", 15) + "</a>";
  }

  function channels(r, lang) {
    var tt = t(lang);
    var brandMode = r.show_brand_level;
    var cards = brandMode
      ? r.brands.map(function (b) { return brandRow(b, lang); }).join("")
      : r.profiles.map(function (p) { return profileRow(p, lang); }).join("");
    var addLabel = brandMode ? tt.addBrand : tt.addProfile;
    var add = "<button class='v1-ch v1-add'><span class='v1-add-ic'>" + ic("plus", 16) + "</span><span class='v1-add-t'>" + addLabel + "</span><span class='v1-add-s'>Threads · LinkedIn " + tt.networkSoon.toLowerCase() + "</span></button>";
    return "<section class='v1-channels'>" +
      "<header class='v1-ch-head'><span class='v1-ch-title'>" + (brandMode ? tt.secBrands : tt.secProfiles) + "</span>" +
      "<span class='v1-ch-count'>" + (brandMode ? r.brands.length : r.profiles.length) + "</span>" +
      "<span class='v1-ch-note'>" + (brandMode ? "" : "") + "</span></header>" +
      "<div class='v1-ch-grid'>" + cards + add + "</div></section>";
  }

  function skeleton(lang) {
    function line(w, h, mt) { return "<div class='v-skel' style='width:" + w + ";height:" + h + "px" + (mt ? ";margin-top:" + mt + "px" : "") + "'></div>"; }
    var tk = "";
    for (var i = 0; i < 4; i++) tk += "<div class='v1-tk'>" + line("60%", 11) + "<div style='margin-top:10px'>" + line("80%", 30) + "</div>" + line("50%", 10, 10) + "</div>";
    return "<div class='v1-id'>" + "<div class='v-skel' style='width:44px;height:44px;border-radius:999px'></div><div style='flex:1'>" + line("180px", 16) + line("240px", 12, 8) + "</div></div>" +
      "<div class='v1-ticker'>" + tk + "</div>" +
      "<div class='v1-mid'><section class='v1-panel'>" + line("140px", 14) + line("100%", 44, 14) + line("100%", 44, 8) + "</section>" +
      "<section class='v1-panel'>" + line("140px", 14) + line("100%", 40, 14) + line("80%", 14, 10) + "</section></div>";
  }

  function render(ctx) {
    var r = ctx.r, lang = ctx.lang;
    if (r.loading) return "<div class='v1'>" + skeleton(lang) + "</div>";
    return "<div class='v1'>" + identity(r, lang) + ticker(r, lang) +
      "<div class='v1-mid'>" + signals(r, lang) + advisorReadout(r, lang) + "</div>" +
      channels(r, lang) + "</div>";
  }

  window.V1 = { render: render, name: { ru: "Пульт", de: "Kommandodeck" } };
})();
