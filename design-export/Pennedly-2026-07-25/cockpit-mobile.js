/* cockpit-mobile.js — phone component builders for Overview-Cockpit-Mobile-SPEC.
   Locale-aware (lang 'ru' | 'de'); copy from window.CKPT. Uses window.MOCK (M)
   for the device shell + sheet and sprite icons (#i-*). window.MOVC.* is called
   from the spec script. */
(function () {
  const M = window.MOCK;
  const C = window.CKPT;
  const L = C.L;
  const A = "assets/avatars/";
  const ic = (n, s) => M.ic(n, s || 14);
  const T = (lang) => C.T[lang] || C.T.ru;

  const IMP = {
    ru: { t: "Импортируем историю", p: "постов", c: "комм." },
    de: { t: "Verlauf wird importiert", p: "Beiträge", c: "Komm." },
  };

  function delta(v) {
    if (v == null) return "<span class='m-delta m-delta--flat'>—</span>";
    var down = String(v).charAt(0) === "-";
    return "<span class='m-delta m-delta--" + (down ? "down" : "up") + "'>" + ic(down ? "arrow-down" : "arrow-up", 11) + String(v).replace(/^[-+]/, "") + "</span>";
  }
  function netBadge(p) {
    var n = C.NETWORKS[p.network];
    return "<span class='m-ov-net m-ov-net--" + p.network + "'>" + n.glyph + "</span>";
  }
  function avatar(p, cls) {
    var inner = p.avatar ? "<img src='" + A + p.avatar + "' alt=''/>" : "<span class='mono'>" + p.mono + "</span>";
    return "<span class='" + (cls || "m-ov-av") + "'>" + inner + netBadge(p) + "</span>";
  }

  // ── triage queue ─────────────────────────────────────────────────────────
  var TYPE_IC = { sync: "alert", reply: "reply", draft: "nib", audit: "audit" };
  function triRow(it, lang) {
    var p = C.PROFILES[it.profile], t = T(lang), tone = C.TRIAGE_TONE[it.type];
    var action = it.action === "retry"
      ? "<span class='m-tr-btn'>" + ic("undo", 12) + t.retry + "</span>"
      : "<span class='m-tr-go'>" + ic("chev-right", 16) + "</span>";
    return "<a class='m-tr m-tr--" + tone + "'>"
      + avatar(p, "m-tr-av")
      + "<span class='m-tr-body'>"
      +   "<span class='m-tr-line'><span class='m-tr-ic'>" + ic(TYPE_IC[it.type], 12) + "</span><span class='m-tr-title'>" + L(it.title, lang) + "</span></span>"
      +   "<span class='m-tr-meta'><span class='m-tr-h'>" + p.handle + "</span><span class='m-dot'>·</span><span class='m-tr-metatxt'>" + L(it.meta, lang) + "</span></span>"
      + "</span>" + action + "</a>";
  }
  function triageQueue(lang, items) {
    items = items || C.TRIAGE; var t = T(lang);
    var count = L(C.TRIAGE_COUNT, lang).split(" · ")[0];
    var head = "<div class='m-tri-head'><span class='m-tri-title'>" + t.triHeading + "</span><span class='m-tri-count'>" + count + "</span></div>";
    return "<section class='m-tri'>" + head + "<div class='m-tri-list'>" + items.map(function (it) { return triRow(it, lang); }).join("") + "</div></section>";
  }
  function triageZero(lang, n) {
    n = n || 4; var t = T(lang);
    var body = lang === "de"
      ? "Im Moment braucht dich nichts in deinen " + n + " Profilen."
      : "Сейчас по вашим " + n + " профилям ничего не требуется.";
    return "<section class='m-tri m-tri--zero'>"
      + "<span class='m-tri-zero-mark'>" + ic("check", 22) + "</span>"
      + "<div class='m-tri-zero-t'>" + t.zeroT + "</div>"
      + "<div class='m-tri-zero-s'>" + body + "</div>"
      + "<div class='m-tri-zero-foot'>" + ic("clock", 11) + t.zeroFoot + "</div>"
      + "</section>";
  }

  // ── growth-audit row (horizontal scroll) ───────────────────────────────────
  function auditCard(sig, lang) {
    var p = C.PROFILES[sig.profile], t = T(lang);
    var dir = sig.signal === "up" ? "arrow-up" : sig.signal === "down" ? "arrow-down" : "repeat";
    var sigLab = sig.signal === "up" ? t.sigUpL : sig.signal === "down" ? t.sigDownL : t.sigFlatL;
    var confW = sig.conf === "high" ? t.confHigh : sig.conf === "medium" ? t.confMed : t.confLow;
    var conf = confW + " · " + sig.posts + " " + t.postsWord;
    var prop = sig.proposals > 0
      ? "<span class='m-au-cta'>" + ic("chev-right", 12) + "<span class='m-au-ctatxt'>" + L(sig.propText, lang) + "</span></span>"
      : "<span class='m-au-done'>" + ic("check", 12) + t.auReviewed + "</span>";
    return "<a class='m-au'>"
      + "<div class='m-au-head'>" + avatar(p, "m-au-av") + "<div class='m-au-id'><div class='m-au-h'>" + p.handle + "</div><div class='m-au-when'>" + L(sig.when, lang) + "</div></div></div>"
      + "<div class='m-au-sig m-au-sig--" + sig.signal + "'>" + ic(dir, 14) + "<span class='m-au-delta'>" + sig.delta + "</span><span class='m-au-lab'>" + sigLab + "</span></div>"
      + "<div class='m-au-conf'>" + conf + "</div>"
      + prop + "</a>";
  }
  function auditRow(lang, sigs) {
    sigs = sigs || C.AUDIT_SIGNALS; var t = T(lang);
    var head = "<div class='m-sec-head'><span class='m-sec-ic'>" + ic("audit", 13) + "</span><span class='m-sec-t'>" + t.auHeading + "</span></div>";
    return "<section class='m-ausec'>" + head + "<div class='m-au-row'>" + sigs.map(function (s) { return auditCard(s, lang); }).join("") + "</div></section>";
  }

  // ── per-profile card ───────────────────────────────────────────────────────
  function metric(lab, icon, val, unit, extra, attention) {
    return "<div class='m-ov-m" + (attention ? " m-ov-m--attention" : "") + "'><span class='m-ov-m-lab'>" + ic(icon, 11) + "<span class='m-ov-m-labtxt'>" + lab + "</span></span><span class='m-ov-m-row'><span class='m-ov-m-val'>" + val + (unit ? " <span class='u'>" + unit + "</span>" : "") + "</span>" + (extra || "") + "</span></div>";
  }
  function cardHead(p) {
    var sub = p.handle + " · " + C.NETWORKS[p.network].label;
    return "<div class='m-ov-card-head'>" + avatar(p) + "<div class='m-ov-id'><div class='m-ov-name'>" + p.brand + "</div><div class='m-ov-handle'>" + sub + "</div></div><span class='m-ov-go'>" + ic("chev-right", 15) + "</span></div>";
  }
  function card(p, lang) {
    var t = T(lang);
    if (p.sync === "importing") {
      var im = p.import, m = IMP[lang] || IMP.ru;
      return "<div class='m-ov-card m-ov-card--importing'>" + cardHead(p)
        + "<div class='import-banner import-banner--syncing'><span class='ib-mark'><span class='ib-spinner'></span></span><div class='ib-body'><div class='ib-title'>" + m.t + "</div><div class='ib-sub'><b>" + im.posts + "</b> " + m.p + " · <b>" + im.comments + "</b> " + m.c + "</div><div class='ib-bar'><div class='ib-bar-fill' style='width:" + im.pct + "%'></div></div></div></div></div>";
    }
    if (p.sync === "error") {
      var me = "<div class='m-ov-metrics'>" + metric(t.tFollowers, "users", p.followers, null, delta(p.followers_delta)) + metric(t.tViews, "eye", "—") + metric(t.tPosts, "nib", "—", t.mPostsUnit) + metric(t.tReplies, "bubble", "—") + "</div>";
      return "<div class='m-ov-card'>" + cardHead(p) + me + "<div class='m-ov-status'><span class='m-ov-sync m-ov-sync--error'><span class='m-ov-sync-dot'></span>" + t.syncFailed + "</span><div class='m-ov-quick'><button class='m-ov-quicklink'>" + ic("undo", 11) + t.retry + "</button></div></div></div>";
    }
    var metrics = "<div class='m-ov-metrics'>"
      + metric(t.tFollowers, "users", p.followers, null, delta(p.followers_delta))
      + metric(t.tViews, "eye", p.views_7d)
      + metric(t.tPosts, "nib", p.posts_this_week, t.mPostsUnit)
      + metric(t.tReplies, "bubble", String(p.replies_to_answer), null, null, p.replies_to_answer > 0)
      + "</div>";
    var quick = "<div class='m-ov-quick'><a class='m-ov-quicklink'>" + ic("chart", 11) + t.stats + "</a>"
      + "<a class='m-ov-quicklink" + (p.replies_to_answer > 0 ? " m-ov-quicklink--attention" : "") + "'>" + ic("reply", 11) + t.replies + (p.replies_to_answer > 0 ? " " + p.replies_to_answer : "") + "</a></div>";
    return "<div class='m-ov-card'>" + cardHead(p) + metrics + "<div class='m-ov-status'><span class='m-ov-sync'><span class='m-ov-sync-dot'></span>" + L(p.refreshed, lang) + "</span>" + quick + "</div></div>";
  }

  // ── totals strip ───────────────────────────────────────────────────────────
  function total(lab, icon, num, sub, extra, attention) {
    return "<div class='m-ov-total" + (attention ? " m-ov-total--attention" : "") + "'><div class='m-ov-total-lab'>" + ic(icon, 12) + "<span class='m-ov-total-labtxt'>" + lab + "</span></div><div class='m-ov-total-num'>" + num + "</div><div class='m-ov-total-foot'><span class='m-ov-total-sub'>" + sub + "</span>" + (extra || "") + "</div></div>";
  }
  function strip(lang, tot) {
    tot = tot || C.TOTALS; var t = T(lang);
    var cap = "<div class='m-ov-strip-cap'><span class='lab'>" + t.capPrefix + " " + tot.profiles_count + " " + t.capProfiles + "</span>" + (tot.importing_count ? "<span class='imp'>+" + tot.importing_count + " " + t.importing + "</span>" : "") + "</div>";
    return cap + "<div class='m-ov-totals'>"
      + total(t.tFollowers, "users", tot.followers, t.subAll, delta(tot.followers_delta))
      + total(t.tViews, "eye", tot.views_7d, t.sub7d)
      + total(t.tPosts, "nib", tot.posts_this_week, t.subWeek)
      + total(t.tReplies, "bubble", String(tot.replies_to_answer), t.subWait, null, true)
      + "</div>";
  }

  // ── states ───────────────────────────────────────────────────────────────
  function nudge(lang) {
    var t = T(lang);
    return "<div class='m-ov-nudge'><span class='m-ov-nudge-ico'>" + ic("plus", 18) + "</span><div><div class='m-ov-nudge-t'>" + t.nudgeT + "</div><div class='m-ov-nudge-s'>" + t.nudgeS + "</div><button class='btn btn--secondary btn--sm'>" + ic("plus", 15) + t.nudgeCta + "</button></div></div>";
  }
  function singleNote(lang) {
    var t = T(lang);
    return "<div class='m-ov-single-note'><span class='m-ov-single-ic'>" + ic("nib", 16) + "</span><div><div class='m-ov-single-t'>" + t.singleT + "</div><div class='m-ov-single-s'>" + t.singleS + "</div></div></div>";
  }
  function empty(lang) {
    var t = T(lang);
    return "<div class='m-ov-empty'><div class='m-ov-empty-mark'>" + ic("overview", 24) + "</div><div class='m-ov-empty-t'>" + t.emptyT + "</div><div class='m-ov-empty-s'>" + t.emptyS + "</div><button class='btn btn--primary'>" + ic("plus", 16) + t.emptyCta + "</button></div>";
  }
  function errorBanner(lang) {
    var t = T(lang);
    return "<div class='m-ov-error'><span class='m-ov-error-mark'>" + ic("x", 17) + "</span><div style='flex:1 1 auto;min-width:0'><div class='m-ov-error-t'>" + t.errorT + "</div><div class='m-ov-error-s'>" + t.errorS + "</div></div><button class='btn btn--secondary btn--sm'>" + ic("undo", 15) + t.retry + "</button></div>";
  }
  function skelCard() {
    return "<div class='m-ov-card'><div class='m-ov-card-head'><span class='m-ov-av'></span><div class='m-ov-id'><div class='skel-line' style='width:90px;height:13px'></div><div class='skel-line' style='width:66px;height:11px;margin-top:6px'></div></div></div><div class='m-ov-metrics'><div class='skel-line' style='height:32px'></div><div class='skel-line' style='height:32px'></div><div class='skel-line' style='height:32px'></div><div class='skel-line' style='height:32px'></div></div></div>";
  }

  // ── bodies ───────────────────────────────────────────────────────────────
  function pad() { return "<div style='height:64px'></div>"; }
  function bodyBusy(lang) {
    return "<div class='m-ov'>" + triageQueue(lang) + strip(lang) + auditRow(lang) + "<div class='m-ov-grid'>" + C.ORDER.map(function (id) { return card(C.PROFILES[id], lang); }).join("") + "</div>" + pad() + "</div>";
  }
  function bodyZero(lang) {
    return "<div class='m-ov'>" + triageZero(lang, 4) + strip(lang) + auditRow(lang) + "<div class='m-ov-grid'>" + ["mara", "field", "studio"].map(function (id) { return card(C.PROFILES[id], lang); }).join("") + "</div>" + pad() + "</div>";
  }
  function bodySingle(lang) {
    var tot = Object.assign({}, C.TOTALS, { profiles_count: 1, importing_count: 0, followers: "12,4K", followers_delta: "+312", views_7d: "98K", posts_this_week: "5", replies_to_answer: 3 });
    return "<div class='m-ov'>" + singleNote(lang) + strip(lang, tot) + "<div class='m-ov-grid'>" + card(C.PROFILES.mara, lang) + "</div>" + nudge(lang) + pad() + "</div>";
  }
  function bodyLoading() {
    var triRowS = "<div class='skel-line' style='height:52px;border-radius:12px'></div>";
    var tri = "<div class='m-tri'><div class='skel-line' style='width:110px;height:14px'></div><div style='display:flex;flex-direction:column;gap:8px;margin-top:12px'>" + triRowS + triRowS + "</div></div>";
    var tile = "<div class='skel-line' style='height:78px;border-radius:14px'></div>";
    return "<div class='m-ov'>" + tri + "<div class='m-ov-totals'>" + tile + tile + tile + tile + "</div><div class='m-ov-grid'>" + skelCard() + skelCard() + "</div>" + pad() + "</div>";
  }

  // ── bottom account button + sheet (the only mobile account control) ────────
  function acctButton(lang, opts) {
    opts = opts || {}; var t = T(lang);
    if (opts.profile) {
      var p = C.PROFILES[opts.profile];
      return "<button class='m-acctbtn'>" + avatar(p, "m-acctbtn-av") + "<span class='m-acctbtn-who'><span class='m-acctbtn-nm'>" + p.brand + "</span><span class='m-acctbtn-hd'>" + p.handle + "</span></span><span class='m-acctbtn-chev'>" + ic("arrow-up", 16) + "</span></button>";
    }
    return "<button class='m-acctbtn'><span class='m-acctbtn-all'>" + ic("overview", 18) + "</span><span class='m-acctbtn-who'><span class='m-acctbtn-nm'>" + t.allAccounts + "</span><span class='m-acctbtn-hd'>" + t.allSub + "</span></span><span class='m-acctbtn-chev'>" + ic("arrow-up", 16) + "</span></button>";
  }
  function acctSheet(lang) {
    var t = T(lang);
    var rows = ["mara", "field", "studio"].map(function (id, i) {
      var a = C.PROFILES[id];
      return "<button class='m-ac-row'>" + avatar(a, "m-ac-av") + "<span class='m-ac-who'><span class='m-ac-nm'>" + a.brand + "</span><span class='m-ac-hd'>" + a.handle + " · " + C.NETWORKS[a.network].label + "</span></span>" + (i === 0 ? "<span class='m-ac-check'>" + ic("check", 17) + "</span>" : "") + "</button>";
    }).join("");
    var inner = "<div class='m-sheet-grip'></div>"
      + "<div class='m-ac-acct'><div class='m-ac-acct-id'><div class='m-ac-email'>" + C.ACCOUNT.email + "</div><span class='m-ac-plan'>" + C.ACCOUNT.plan + "</span></div><button class='m-sheet-close'>" + ic("x", 16) + "</button></div>"
      + "<a class='m-ac-all'><span class='m-ac-all-ico'>" + ic("overview", 19) + "</span><span class='m-ac-who'><span class='m-ac-nm'>" + t.allAccounts + "</span><span class='m-ac-hd'>" + t.allSub + "</span></span><span class='m-ac-check'>" + ic("check", 17) + "</span></a>"
      + "<div class='m-ac-cap'>" + t.switch + "</div>" + rows
      + "<button class='m-ac-row'><span class='m-ac-av m-ac-av--add'>" + ic("plus", 16) + "</span><span class='m-ac-who'><span class='m-ac-nm'>" + t.connect + "</span></span></button>"
      + "<div class='m-sheet-sep'></div>"
      + "<button class='m-ac-row m-ac-row--min'><span class='m-ac-mini'>" + ic("settings", 16) + "</span>" + t.settings + "</button>"
      + "<button class='m-ac-row m-ac-row--min'><span class='m-ac-mini'>" + ic("logout", 16) + "</span>" + t.logout + "</button>";
    return "<div class='m-scrim'></div><div class='m-sheet'><div style='padding:8px 14px 22px'>" + inner + "</div></div>";
  }

  function set(id, html) { var e = document.getElementById(id); if (e) e.innerHTML = html; }

  window.MOVC = {
    ic, avatar, delta,
    triageQueue, triageZero, auditRow, card, strip,
    nudge, singleNote, empty, errorBanner,
    bodyBusy, bodyZero, bodySingle, bodyLoading,
    acctButton, acctSheet, set,
  };
})();
