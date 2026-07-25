/* variants/v2.js — CONCEPT V2 · "Требует тебя" (Attention-forward inbox).
   Center of gravity: what awaits ACTION. A single prioritised queue is the hero
   — sync errors, disconnected profiles, replies, drafts, audits, all as native
   rows that resolve here, not in the old overview. Totals shrink to a small
   context card and the advisor sits in a slim rail, because here the JOB leads.
   The queue absorbs profile states too, so "all disconnected" becomes a clean
   list of reconnect actions instead of an empty screen. */
(function () {
  "use strict";
  var VK = window.VK, ic = VK.ic, t = VK.t, L = VK.L, avatar = VK.avatar, fmtK = VK.fmtK;

  var Q = {
    ru: {
      first: "Сначала это", context: "Портфель", open: "Открыть", review: "Разобрать",
      deals: ["дело", "дела", "дел"], waiting: "ждут", allClear: "Всё разобрано",
      allClearSub: "По портфелю нет открытых дел — можно заняться ростом.",
      syncSub: "Данные не обновляются ~6 ч · переподключение вернёт их",
      offSub: "Данные, голос и история сохранены",
      repliesSub: "Окно вовлечённости ещё открыто — быстрый рост на старте",
      draftsSub: "Готовы к публикации в твоём голосе",
      auditsSub: "Свежие предложения по формату недели",
      voiceSub: "Профиль без голоса — не пройдёт автопилот",
      impSub: "из 115 постов · ≈ пара минут",
    },
    de: {
      first: "Zuerst das", context: "Portfolio", open: "Öffnen", review: "Klären",
      deals: ["Aufgabe", "Aufgaben", "Aufgaben"], waiting: "offen", allClear: "Alles erledigt",
      allClearSub: "Im Portfolio sind keine offenen Aufgaben — Zeit fürs Wachstum.",
      syncSub: "Daten seit ~6 Std. nicht aktualisiert · neu verbinden holt sie zurück",
      offSub: "Daten, Stimme und Verlauf sind gesichert",
      repliesSub: "Das Engagement-Fenster ist noch offen — schneller Hebel",
      draftsSub: "Bereit zur Veröffentlichung in deiner Stimme",
      auditsSub: "Frische Format-Vorschläge der Woche",
      voiceSub: "Profil ohne Stimme — kein Autopilot",
      impSub: "von 115 Beiträgen · ≈ ein paar Minuten",
    },
  };
  function q(l) { return Q[l] || Q.ru; }

  // build the unified action queue from tasks + live profile states
  function buildQueue(r, lang) {
    var tt = t(lang), ql = q(lang), items = [];
    r.profiles.forEach(function (p) {
      if (p.sync === "error") items.push({ tone: "danger", icon: "alert", title: tt.fixSync + " " + p.handle, sub: ql.syncSub, cta: tt.retry, cta2: tt.openStudio, primary: "v-btn--danger", p: p });
    });
    r.profiles.forEach(function (p) {
      if (p.sync === "disconnected") items.push({ tone: "warn", icon: "plug", title: tt.reconnect + " " + p.handle, sub: ql.offSub, cta: tt.reconnect, primary: "v-btn--primary", p: p });
    });
    if (r.tasks.replies) items.push({ tone: "accent", icon: "reply", n: r.tasks.replies, title: tt.reviewReplies, sub: ql.repliesSub, cta: ql.review, primary: "v-btn--accent" });
    // profiles without a voice → nudge (brief reimagine opportunity)
    r.profiles.forEach(function (p) {
      if (!p.has_voice && p.sync !== "disconnected") items.push({ tone: "ink", icon: "mic", title: tt.noVoice + " · " + p.handle, sub: ql.voiceSub, cta: tt.noVoice, primary: "v-btn--primary" });
    });
    if (r.tasks.drafts) items.push({ tone: "ink", icon: "nib", n: r.tasks.drafts, title: tt.confirmDrafts, sub: ql.draftsSub, cta: ql.open, primary: "" });
    if (r.tasks.audits) items.push({ tone: "ink", icon: "audit", n: r.tasks.audits, title: tt.viewAudits, sub: ql.auditsSub, cta: ql.open, primary: "" });
    // importing → info row (no action)
    r.profiles.forEach(function (p) {
      if (p.sync === "importing") items.push({ tone: "info", icon: "clock", title: p.handle + " · " + tt.importing.toLowerCase(), sub: p.import.posts + " " + ql.impSub, info: true });
    });
    return items;
  }

  function qRow(o, lang, first) {
    var n = o.n != null ? "<span class='v2-q-n'>" + o.n + "</span>" : "";
    var acts = o.info ? "" :
      "<span class='v2-q-act'>" + (o.cta2 ? "<button class='v-btn v-btn--sm v-btn--ghost v2-q-cta2'>" + o.cta2 + "</button>" : "") +
      "<button class='v-btn v-btn--sm " + (o.primary || "") + "'>" + o.cta + ic("arrow-right", 13) + "</button></span>";
    return "<div class='v2-q v2-q--" + o.tone + (first ? " v2-q--first" : "") + (o.info ? " v2-q--info" : "") + "'>" +
      "<span class='v2-q-ic'>" + ic(o.icon, 16) + "</span>" + n +
      "<span class='v2-q-txt'><span class='v2-q-t'>" + o.title + "</span><span class='v2-q-s'>" + o.sub + "</span></span>" +
      acts + "</div>";
  }

  function queue(r, lang) {
    var tt = t(lang), ql = q(lang);
    var items = buildQueue(r, lang);
    var actionable = items.filter(function (i) { return !i.info; });
    var head = "<header class='v2-q-head'><h2 class='v2-q-title'>" + ql.first + "</h2>" +
      "<span class='v2-q-sum'>" + actionable.length + "\u00A0" + VK.plW(actionable.length, ql.deals, lang) + "</span>" +
      "<button class='v-btn v-btn--sm v-btn--ghost v2-q-all'>" + tt.resolveAll + ic("arrow-right", 13) + "</button></header>";
    if (!actionable.length) {
      var body = "<div class='v2-clear'><span class='v2-clear-ic'>" + ic("check", 26) + "</span><div class='v2-clear-t'>" + ql.allClear + "</div><div class='v2-clear-s'>" + ql.allClearSub + "</div></div>";
      return "<section class='v2-queue'>" + head + body + items.filter(function (i) { return i.info; }).map(function (o) { return qRow(o, lang, false); }).join("") + "</section>";
    }
    var rows = items.map(function (o, i) { return qRow(o, lang, i === 0); }).join("");
    return "<section class='v2-queue'>" + head + "<div class='v2-q-list'>" + rows + "</div></section>";
  }

  function totalsCard(r, lang) {
    var tt = t(lang);
    var cells = VK.totalsSpec(r, lang).map(function (m) {
      var val = m.value == null ? "—" : fmtK(m.value);
      var sub = (m.delta != null && m.value != null) ? "<span class='v2-t-delta'>" + VK.deltaEl(m.delta) + "</span>" : m.sub;
      return "<div class='v2-t" + (m.attention ? " v2-t--attn" : "") + "'><div class='v2-t-lab'>" + m.label + "</div><div class='v2-t-val'>" + val + "</div><div class='v2-t-sub'>" + sub + "</div></div>";
    }).join("");
    return "<section class='v2-totals'><header class='v2-rail-h'>" + ic("chart", 14) + q(lang).context + "</header><div class='v2-t-grid'>" + cells + "</div></section>";
  }

  function advisorCard(r, lang) {
    var tt = t(lang);
    if (r.advisor === "thin") {
      var th = VK.ADVISOR.thin;
      return "<section class='v2-adv v2-adv--thin'><header class='v2-rail-h'>" + ic("advisor", 14) + tt.advTitle + "</header>" +
        "<div class='v2-adv-thintitle'>" + L(th.title, lang) + "</div><p class='v2-adv-body'>" + L(th.body, lang) + "</p>" +
        "<div class='v2-adv-ask'><span>" + tt.advAsk + "</span><button class='v2-adv-send'>" + ic("send", 15) + "</button></div></section>";
    }
    var a = VK.ADVISOR.verdict;
    var chips = a.chips.map(function (c) { return VK.chip(c, lang); }).join("");
    return "<section class='v2-adv'><header class='v2-rail-h'>" + ic("advisor", 14) + tt.advTitle + "<span class='v2-adv-scope'>" + tt.advScope + "</span></header>" +
      "<div class='v2-adv-verdict'>" + L(a.verdict, lang) + "</div>" +
      "<div class='v2-adv-chips'>" + chips + "</div>" +
      "<button class='v-btn v-btn--sm v2-adv-open'>" + tt.advOpen + ic("arrow-right", 13) + "</button></section>";
  }

  // compact channel list under the queue
  function channelItem(p, lang) {
    var tt = t(lang);
    var right = (p.sync === "synced")
      ? "<span class='v2-ch-mini'><b>" + fmtK(p.followers) + "</b> · <b>" + fmtK(p.views_7d) + "</b></span>"
      : "<span class='" + (p.sync === "error" ? "v-sync v-sync--error" : p.sync === "importing" ? "v-sync v-sync--imp" : "v-sync v-sync--off") + "'><span class='v-sync-dot'></span>" + (p.sync === "error" ? tt.syncError : p.sync === "importing" ? tt.importing : tt.disconnected) + "</span>";
    return "<a class='v2-ch'>" + avatar(p, 30, { dim: p.sync === "disconnected" }) +
      "<span class='v2-ch-nm'>" + p.handle + "</span>" + right + ic("chev-right", 14) + "</a>";
  }
  function brandItem(b, lang) {
    var tt = t(lang);
    var stack = b.profiles.slice(0, 3).map(function (k) { return avatar(VK.profile(k), 22, { noBadge: true, cls: "v2-stackav" }); }).join("");
    return "<a class='v2-ch v2-ch--brand'><span class='v2-brandmark'>" + b.mono + "</span>" +
      "<span class='v2-ch-nm'>" + b.name + "</span><span class='v2-stack'>" + stack + "</span>" +
      "<span class='v2-ch-mini'><b>" + fmtK(b.stats.followers) + "</b> · <b>" + fmtK(b.stats.views_7d) + "</b></span>" + ic("chev-right", 14) + "</a>";
  }
  function channels(r, lang) {
    var tt = t(lang), brandMode = r.show_brand_level;
    var items = brandMode ? r.brands.map(function (b) { return brandItem(b, lang); }).join("") : r.profiles.map(function (p) { return channelItem(p, lang); }).join("");
    var add = "<button class='v2-ch v2-ch--add'>" + ic("plus", 15) + (brandMode ? tt.addBrand : tt.addProfile) + "</button>";
    return "<section class='v2-channels'><header class='v2-rail-h v2-ch-h'>" + ic(brandMode ? "layers" : "target", 14) + (brandMode ? tt.secBrands : tt.secChannels) + "<span class='v2-ch-n'>" + (brandMode ? r.brands.length : r.profiles.length) + "</span></header><div class='v2-ch-list'>" + items + add + "</div></section>";
  }

  function skeleton(lang) {
    function s(w, h, mt) { return "<div class='v-skel' style='width:" + w + ";height:" + h + "px" + (mt ? ";margin-top:" + mt + "px" : "") + "'></div>"; }
    var rows = "";
    for (var i = 0; i < 4; i++) rows += "<div class='v2-q'>" + s("36px", 36) + "<div style='flex:1'>" + s("55%", 14) + s("75%", 11, 7) + "</div>" + s("96px", 30) + "</div>";
    return "<div class='v2-id'>" + s("44px", 44, 0) + "<div style='flex:1'>" + s("160px", 16) + s("220px", 12, 8) + "</div></div>" +
      "<section class='v2-queue'>" + s("120px", 16) + "<div class='v2-q-list' style='margin-top:12px'>" + rows + "</div></section>" +
      "<div class='v2-context'><section class='v2-totals'>" + s("90px", 13) + s("100%", 120, 10) + "</section><section class='v2-adv'>" + s("90px", 13) + s("100%", 80, 10) + "</section></div>";
  }

  function render(ctx) {
    var r = ctx.r, lang = ctx.lang, tt = t(lang);
    if (r.loading) return "<div class='v2'>" + skeleton(lang) + "</div>";
    var actionable = buildQueue(r, lang).filter(function (i) { return !i.info; }).length;
    var id = "<div class='v2-id'><span class='v2-id-mono'>" + VK.ACCOUNT.mono + "</span>" +
      "<div class='v2-id-txt'><div class='v2-id-name'>" + VK.ACCOUNT.name + "<span class='v-plan'>" + VK.ACCOUNT.plan + "</span></div>" +
      "<div class='v2-id-scale'>" + VK.scaleLine(r, lang) + "</div></div>" +
      (actionable ? "<span class='v2-id-count'>" + ic("inbox", 13) + actionable + "\u00A0" + VK.plW(actionable, q(lang).deals, lang) + " " + q(lang).waiting + "</span>" : "<span class='v2-id-count v2-id-count--clear'>" + ic("check", 13) + q(lang).allClear + "</span>") + "</div>";
    return "<div class='v2'>" + id + queue(r, lang) +
      "<div class='v2-context'>" + totalsCard(r, lang) + advisorCard(r, lang) + "</div>" +
      channels(r, lang) + "</div>";
  }

  window.V2 = { render: render, name: { ru: "Требует тебя", de: "Braucht dich" } };
})();
