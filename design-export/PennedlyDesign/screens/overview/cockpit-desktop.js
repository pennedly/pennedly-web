/* cockpit-desktop.js — desktop component builders for Overview-Cockpit-SPEC.
   Locale-aware: every builder takes lang ('ru' | 'de'); copy comes from
   window.CKPT (T[lang] for static strings, L(item, lang) for per-item pairs).
   Returns HTML strings rendered on the live DS layer. window.OVC.* is called
   from the spec's inline script. */
(function () {
  const C = window.CKPT;
  const L = C.L;
  const A = "assets/avatars/";
  const T = (lang) => C.T[lang] || C.T.ru;

  const IMP = {
    ru: { t: "Импортируем историю", p: "постов", c: "комментариев" },
    de: { t: "Verlauf wird importiert", p: "Beiträge", c: "Kommentare" },
  };
  const NAV = {
    ru: ["Главная", "Студия", "Лента", "Статистика", "Аудиты"],
    de: ["Start", "Studio", "Feed", "Statistik", "Audits"],
  };

  // ── icons ──────────────────────────────────────────────────────────────
  const P = {
    home:"<rect x='4' y='4' width='7' height='7' rx='1.5'/><rect x='13' y='4' width='7' height='7' rx='1.5'/><rect x='4' y='13' width='7' height='7' rx='1.5'/><rect x='13' y='13' width='7' height='7' rx='1.5'/>",
    users:"<circle cx='9' cy='9' r='3.2'/><path d='M3.5 19a5.5 5.5 0 0 1 11 0'/><path d='M16 6.3a3 3 0 0 1 0 5.4M17.5 19a5.5 5.5 0 0 0-3-4.9'/>",
    eye:"<path d='M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z'/><circle cx='12' cy='12' r='2.6'/>",
    nib:"<path d='M4 20 13 11'/><path d='M12 4 20 12 13 11 13 4Z'/><circle cx='6' cy='18' r='0.6'/>",
    bubble:"<path d='M5 17l-1.5 3.5L8 19h8a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3H7a3 3 0 0 0-3 3v6a3 3 0 0 0 1 2.7Z'/>",
    reply:"<path d='M9 7 4 12l5 5M4 12h9a6 6 0 0 1 6 6v1'/>",
    chart:"<path d='M4 19V5M4 19h16'/><path d='M8 16l3.5-4 3 2.5L19 8'/>",
    audit:"<rect x='5' y='4' width='14' height='17' rx='2'/><path d='M9 4.5h6V7H9Z'/><path d='M8.5 12.5l2 2 4-4.5'/>",
    up:"<path d='M12 19V6M6 11l6-6 6 6'/>",
    down:"<path d='M12 5v13M6 13l6 6 6-6'/>",
    flat:"<path d='M5 12h14'/>",
    "arrow-right":"<path d='M5 12h14M13 6l6 6-6 6'/>",
    plus:"<path d='M12 5v14M5 12h14'/>",
    undo:"<path d='M9 7 5 11l4 4'/><path d='M5 11h9a5 5 0 0 1 0 10h-3'/>",
    x:"<path d='M6 6 18 18M18 6 6 18'/>",
    check:"<path d='M4.5 12.5 9.5 17.5 19.5 6.5'/>",
    "chev-right":"<path d='M9 6l6 6-6 6'/>",
    "chev-down":"<path d='M6 9l6 6 6-6'/>",
    settings:"<circle cx='12' cy='12' r='3'/><path d='M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2'/>",
    logout:"<path d='M14 7V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2'/><path d='M10 12h10M17 9l3 3-3 3'/>",
    moon:"<path d='M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z'/>",
    sun:"<circle cx='12' cy='12' r='4'/><path d='M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19'/>",
    alert:"<path d='M12 4 2.5 20.5h19L12 4Z'/><path d='M12 10v4'/><circle cx='12' cy='17.4' r='0.5'/>",
    clock:"<circle cx='12' cy='12' r='8.5'/><path d='M12 7.5V12l3 2'/>",
  };
  function ic(n, s) {
    s = s || 14;
    return "<svg width='" + s + "' height='" + s + "' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'>" + (P[n] || "") + "</svg>";
  }
  function delta(v) {
    if (v == null) return "<span class='delta delta--flat'>—</span>";
    var down = String(v).charAt(0) === "-";
    return "<span class='delta delta--" + (down ? "down" : "up") + "'>" + ic(down ? "down" : "up", 12) + String(v).replace(/^[-+]/, "") + "</span>";
  }
  function netBadge(p) {
    var n = C.NETWORKS[p.network];
    return "<span class='ov-net ov-net--" + p.network + "' title='" + n.label + "'>" + n.glyph + "</span>";
  }
  function avatar(p, cls) {
    var inner = p.avatar ? "<img src='" + A + p.avatar + "' alt=''/>" : "<span class='mono'>" + p.mono + "</span>";
    return "<span class='" + (cls || "ov-av") + "'>" + inner + netBadge(p) + "</span>";
  }

  // ── triage queue (hero) ────────────────────────────────────────────────
  var TYPE_IC = { sync: "alert", reply: "reply", draft: "nib", audit: "audit" };
  function triageRow(it, lang) {
    var p = C.PROFILES[it.profile], t = T(lang), tone = C.TRIAGE_TONE[it.type];
    var action = it.action === "retry"
      ? "<span class='ov-tr-btn'>" + ic("undo", 13) + t.retry + "</span>"
      : "<span class='ov-tr-go'>" + ic("arrow-right", 16) + "</span>";
    return "<a class='ov-tr ov-tr--" + tone + "'>"
      + avatar(p, "ov-tr-av")
      + "<span class='ov-tr-body'>"
      +   "<span class='ov-tr-line'><span class='ov-tr-ic'>" + ic(TYPE_IC[it.type], 13) + "</span><span class='ov-tr-title'>" + L(it.title, lang) + "</span></span>"
      +   "<span class='ov-tr-meta'><span class='ov-tr-h'>" + p.handle + "</span><span class='ov-dot'>·</span><span class='ov-tr-metatxt'>" + L(it.meta, lang) + "</span></span>"
      + "</span>" + action + "</a>";
  }
  function triageQueue(lang, items) {
    items = items || C.TRIAGE; var t = T(lang);
    var head = "<div class='ov-tri-head'><span class='ov-tri-title'>" + t.triHeading + "</span><span class='ov-tri-count'>" + L(C.TRIAGE_COUNT, lang) + "</span></div>";
    return "<section class='ov-tri'>" + head + "<div class='ov-tri-list'>" + items.map(function (it) { return triageRow(it, lang); }).join("") + "</div></section>";
  }
  function triageZero(lang, n) {
    n = n || 4; var t = T(lang);
    var body = lang === "de"
      ? "Im Moment braucht dich nichts in deinen " + n + " Profilen. Neue Entwürfe, Antworten und Audits erscheinen hier."
      : "Сейчас по вашим " + n + " профилям ничего не требуется. Новые черновики, ответы и аудиты появятся здесь.";
    return "<section class='ov-tri ov-tri--zero'>"
      + "<span class='ov-tri-zero-mark'>" + ic("check", 24) + "</span>"
      + "<div class='ov-tri-zero-t'>" + t.zeroT + "</div>"
      + "<div class='ov-tri-zero-s'>" + body + "</div>"
      + "<div class='ov-tri-zero-foot'>" + ic("clock", 12) + t.zeroFoot + "</div>"
      + "</section>";
  }

  // ── growth-audit row ───────────────────────────────────────────────────
  function auditCard(sig, lang) {
    var p = C.PROFILES[sig.profile], t = T(lang);
    var dirIc = sig.signal === "up" ? "up" : sig.signal === "down" ? "down" : "flat";
    var sigLab = sig.signal === "up" ? t.sigUpL : sig.signal === "down" ? t.sigDownL : t.sigFlatL;
    var confW = sig.conf === "high" ? t.confHigh : sig.conf === "medium" ? t.confMed : t.confLow;
    var conf = confW + " " + t.confWord + " · " + sig.posts + " " + t.postsWord;
    var prop = sig.proposals > 0
      ? "<span class='ov-au-cta'>" + ic("arrow-right", 13) + "<span class='ov-au-ctatxt'>" + L(sig.propText, lang) + "</span></span>"
      : "<span class='ov-au-done'>" + ic("check", 13) + t.auReviewed + "</span>";
    return "<a class='ov-au'>"
      + "<div class='ov-au-head'>" + avatar(p, "ov-au-av") + "<div class='ov-au-id'><div class='ov-au-h'>" + p.handle + "</div><div class='ov-au-when'>" + L(sig.when, lang) + "</div></div></div>"
      + "<div class='ov-au-sig ov-au-sig--" + sig.signal + "'>" + ic(dirIc, 15) + "<span class='ov-au-delta'>" + sig.delta + "</span><span class='ov-au-lab'>" + sigLab + "</span></div>"
      + "<div class='ov-au-conf'>" + conf + "</div>"
      + prop + "</a>";
  }
  function auditRow(lang, sigs) {
    sigs = sigs || C.AUDIT_SIGNALS; var t = T(lang);
    var head = "<div class='ov-sec-head'><span class='ov-sec-ic'>" + ic("audit", 14) + "</span><span class='ov-sec-t'>" + t.auHeading + "</span><span class='ov-sec-s'>" + t.auSubhead + "</span></div>";
    return "<section class='ov-ausec'>" + head + "<div class='ov-au-row'>" + sigs.map(function (s) { return auditCard(s, lang); }).join("") + "</div></section>";
  }

  // ── per-profile card ───────────────────────────────────────────────────
  function metric(lab, icon, val, unit, extra, attention) {
    return "<div class='ov-m" + (attention ? " ov-m--attention" : "") + "'><span class='ov-m-lab'>" + ic(icon, 12) + "<span class='ov-m-labtxt'>" + lab + "</span></span><span class='ov-m-val'>" + val + (unit ? " <span class='u'>" + unit + "</span>" : "") + "</span>" + (extra || "") + "</div>";
  }
  function cardHead(p, lang) {
    var sub = p.handle + " · " + C.NETWORKS[p.network].label;
    return "<div class='ov-card-head'>" + avatar(p) + "<div class='ov-id'><div class='ov-name'>" + p.brand + "</div><div class='ov-handle'>" + sub + "</div></div><span class='ov-go'>" + ic("arrow-right", 16) + "</span></div>";
  }
  function card(p, lang) {
    var t = T(lang);
    if (p.sync === "importing") {
      var im = p.import, m = IMP[lang] || IMP.ru;
      return "<div class='ov-card ov-card--importing'>" + cardHead(p, lang)
        + "<div class='import-banner import-banner--syncing'><span class='ib-mark'><span class='ib-spinner'></span></span><div class='ib-body'><div class='ib-title'>" + m.t + "</div><div class='ib-sub'><b>" + im.posts + "</b> " + m.p + " · <b>" + im.comments + "</b> " + m.c + "</div><div class='ib-bar'><div class='ib-bar-fill' style='width:" + im.pct + "%'></div></div></div><span class='ib-since'>" + L(im.eta, lang) + "</span></div></div>";
    }
    if (p.sync === "error") {
      var me = "<div class='ov-metrics'>"
        + metric(t.tFollowers, "users", p.followers, null, delta(p.followers_delta))
        + metric(t.tViews, "eye", "—") + metric(t.tPosts, "nib", "—") + metric(t.tReplies, "bubble", "—") + "</div>";
      return "<div class='ov-card'>" + cardHead(p, lang) + me + "<div class='ov-status'><span class='ov-sync ov-sync--error'><span class='ov-sync-dot'></span>" + t.syncFailed + "</span><div class='ov-quick'><button class='ov-quicklink'>" + ic("undo", 12) + t.retry + "</button></div></div></div>";
    }
    var metrics = "<div class='ov-metrics'>"
      + metric(t.tFollowers, "users", p.followers, null, delta(p.followers_delta))
      + metric(t.tViews, "eye", p.views_7d)
      + metric(t.tPosts, "nib", p.posts_this_week, t.mPostsUnit)
      + metric(t.tReplies, "bubble", String(p.replies_to_answer), null, null, p.replies_to_answer > 0)
      + "</div>";
    var quick = "<div class='ov-quick'><a class='ov-quicklink'>" + ic("chart", 12) + t.stats + "</a>"
      + "<a class='ov-quicklink" + (p.replies_to_answer > 0 ? " ov-quicklink--attention" : "") + "'>" + ic("reply", 12) + t.replies + (p.replies_to_answer > 0 ? " " + p.replies_to_answer : "") + "</a></div>";
    return "<div class='ov-card'>" + cardHead(p, lang) + metrics + "<div class='ov-status'><span class='ov-sync'><span class='ov-sync-dot'></span>" + L(p.refreshed, lang) + "</span>" + quick + "</div></div>";
  }

  // ── totals strip (label = 1 word, detail in sub) ────────────────────────
  function total(lab, icon, num, sub, extra, attention) {
    return "<div class='ov-total" + (attention ? " ov-total--attention" : "") + "'><div class='ov-total-lab'><span class='ic'>" + ic(icon, 13) + "</span><span class='ov-total-labtxt'>" + lab + "</span></div><div class='ov-total-num'>" + num + "</div><div class='ov-total-foot'><span class='ov-total-sub'>" + sub + "</span>" + (extra || "") + "</div></div>";
  }
  function strip(lang, tot) {
    tot = tot || C.TOTALS; var t = T(lang);
    var cap = "<div class='ov-strip-cap'><span class='lab'>" + t.capPrefix + " " + tot.profiles_count + " " + t.capProfiles + "</span>" + (tot.importing_count ? "<span class='imp'>+" + tot.importing_count + " " + t.importing + "</span>" : "") + "</div>";
    var totals = "<div class='ov-totals'>"
      + total(t.tFollowers, "users", tot.followers, t.subAll, delta(tot.followers_delta))
      + total(t.tViews, "eye", tot.views_7d, t.sub7d)
      + total(t.tPosts, "nib", tot.posts_this_week, t.subWeek)
      + total(t.tReplies, "bubble", tot.replies_to_answer, t.subWait, null, true)
      + "</div>";
    return cap + totals;
  }

  // ── compositions + states ──────────────────────────────────────────────
  function grid(lang, ids) {
    return "<div class='ov-grid'>" + (ids || C.ORDER).map(function (id) { return card(C.PROFILES[id], lang); }).join("") + "</div>";
  }
  function cockpit(lang, opts) {
    opts = opts || {};
    var tri = opts.zero ? triageZero(lang, 4) : triageQueue(lang);
    return "<div class='ov'>" + tri + strip(lang) + auditRow(lang) + grid(lang) + "</div>";
  }
  function nudge(lang) {
    var t = T(lang);
    return "<div class='ov-nudge'><span class='ov-nudge-ico'>" + ic("plus", 20) + "</span><div class='ov-nudge-body'><div class='ov-nudge-t'>" + t.nudgeT + "</div><div class='ov-nudge-s'>" + t.nudgeS + "</div></div><button class='btn btn--secondary btn--sm'>" + ic("plus", 15) + t.nudgeCta + "</button></div>";
  }
  function singleStudioNote(lang) {
    var t = T(lang);
    var tot = Object.assign({}, C.TOTALS, { profiles_count: 1, importing_count: 0, followers: "12,4K", followers_delta: "+312", views_7d: "98K", posts_this_week: "5", replies_to_answer: 3 });
    return "<div class='ov-singlewrap'><div class='ov-single-note'><span class='ov-single-ic'>" + ic("nib", 17) + "</span><div class='ov-single-body'><div class='ov-single-t'>" + t.singleT + "</div><div class='ov-single-s'>" + t.singleS + "</div></div><span class='ov-single-go'>" + ic("arrow-right", 15) + "</span></div>"
      + "<div class='ov'>" + strip(lang, tot) + "<div class='ov-grid' style='grid-template-columns:1fr'>" + card(C.PROFILES.mara, lang) + "</div>" + nudge(lang) + "</div></div>";
  }
  function skelCard() {
    return "<div class='ov-card'><div class='ov-card-head'><span class='ov-av'></span><div class='ov-id'><div class='skel-line' style='width:90px;height:13px'></div><div class='skel-line' style='width:70px;height:11px;margin-top:6px'></div></div><span class='ov-go'></span></div><div class='ov-metrics'><div class='skel-line' style='height:34px'></div><div class='skel-line' style='height:34px'></div><div class='skel-line' style='height:34px'></div><div class='skel-line' style='height:34px'></div></div><div class='ov-status'><div class='skel-line' style='width:110px;height:12px'></div><div class='skel-line' style='width:120px;height:22px;border-radius:999px'></div></div></div>";
  }
  function skeleton() {
    var triRow = "<div class='skel-line' style='height:54px;border-radius:12px'></div>";
    var triS = "<div class='ov-tri'><div class='skel-line' style='width:120px;height:15px'></div><div class='ov-tri-list' style='margin-top:12px'>" + triRow + triRow + triRow + "</div></div>";
    var t = "<div class='skel-line' style='height:96px;border-radius:14px'></div>";
    return "<div class='ov'>" + triS + "<div class='ov-totals'>" + t + t + t + t + "</div><div class='ov-grid'>" + skelCard() + skelCard() + "</div></div>";
  }
  function empty(lang) {
    var t = T(lang);
    return "<div class='ov-empty'><div class='ov-empty-mark'>" + ic("home", 26) + "</div><div class='ov-empty-t'>" + t.emptyT + "</div><div class='ov-empty-s'>" + t.emptyS + "</div><button class='btn btn--primary'>" + ic("plus", 16) + t.emptyCta + "</button></div>";
  }
  function errorBanner(lang) {
    var t = T(lang);
    return "<div class='ov-error'><span class='ov-error-mark'>" + ic("x", 18) + "</span><div class='ov-error-body'><div class='ov-error-t'>" + t.errorT + "</div><div class='ov-error-s'>" + t.errorS + "</div></div><button class='btn btn--secondary btn--sm'>" + ic("undo", 15) + t.retry + "</button></div>";
  }

  // ── entry: account switcher (upward menu) ───────────────────────────────
  function switcher(lang) {
    var t = T(lang);
    var rows = ["mara", "field", "studio"].map(function (id, i) {
      var a = C.PROFILES[id];
      return "<button class='ovsw-row'>" + avatar(a, "ovsw-av") + "<span class='ovsw-who'><span class='ovsw-nm'>" + a.brand + "</span><span class='ovsw-hd'>" + a.handle + "</span></span>" + (i === 0 ? "<span class='ovsw-check'>" + ic("check", 16) + "</span>" : "") + "</button>";
    }).join("");
    return "<div class='ovsw'>"
      + "<div class='ovsw-acct'><div class='ovsw-acct-email'>" + C.ACCOUNT.email + "</div><span class='ovsw-acct-plan'>" + C.ACCOUNT.plan + "</span></div>"
      + "<a class='ovsw-all'><span class='ovsw-ico'>" + ic("home", 17) + "</span><span class='ovsw-who'><span class='ovsw-nm'>" + t.allAccounts + "</span><span class='ovsw-hd'>" + t.allSub + "</span></span><span class='ovsw-chev'>" + ic("chev-right", 15) + "</span></a>"
      + "<div class='ovsw-cap'>" + t.switch + "</div>" + rows
      + "<button class='ovsw-row'><span class='ovsw-av ovsw-av--add'>" + ic("plus", 15) + "</span><span class='ovsw-who'><span class='ovsw-nm'>" + t.connect + "</span></span></button>"
      + "<div class='ovsw-sep'></div>"
      + "<button class='ovsw-row ovsw-row--min'><span class='ovsw-mini'>" + ic("settings", 15) + "</span>" + t.settings + "</button>"
      + "<button class='ovsw-row ovsw-row--min'><span class='ovsw-mini'>" + ic("logout", 15) + "</span>" + t.logout + "</button>"
      + "</div>";
  }

  // ── home sidebar (Home active + first) ──────────────────────────────────
  function sidebar(lang) {
    var t = T(lang), labels = NAV[lang] || NAV.ru;
    var ICONS = ["home", "nib", "eye", "chart", "audit"];
    var rows = labels.map(function (lbl, i) {
      return "<div class='sb-row" + (i === 0 ? " sb-row--active" : "") + "'>" + ic(ICONS[i], 17) + "<span class='sb-rowtxt'>" + lbl + "</span></div>";
    }).join("");
    return "<div class='sb'>"
      + "<div class='sb-brand'><span class='sb-mark'>" + ic("nib", 16) + "</span><span class='sb-name'>Pennedly</span></div>"
      + "<div class='sb-nav'>" + rows + "</div>"
      + "<div class='sb-foot'><button class='sb-acct'>" + avatar(C.PROFILES.mara, "sb-acct-av") + "<span class='sb-acct-who'><span class='sb-acct-nm'>" + t.allAccounts + "</span><span class='sb-acct-hd'>5 " + t.capProfiles.toLowerCase() + "</span></span>" + ic("chev-down", 15) + "</button></div>"
      + "</div>";
  }

  function topbar(dark, lang) {
    var t = T(lang);
    return "<div class='tbdemo'><span class='tbt'>" + t.home + "</span><span class='status-pill'>" + ic("home", 13) + "<span class='sp-txt'>" + t.pill + " · " + t.updatedDaily + "</span></span><span class='sp'></span><span class='ib'>" + ic(dark ? "sun" : "moon", 16) + "</span><span class='ib'>" + ic("settings", 16) + "</span></div>";
  }

  function set(id, html) { var e = document.getElementById(id); if (e) e.innerHTML = html; }

  window.OVC = {
    ic, delta, avatar, netBadge,
    triageRow, triageQueue, triageZero, auditCard, auditRow,
    card, strip, grid, cockpit,
    nudge, singleStudioNote, skeleton, empty, errorBanner,
    switcher, sidebar, topbar, set,
  };
})();
