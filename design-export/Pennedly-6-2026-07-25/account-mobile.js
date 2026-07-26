/* account-mobile.js — PHONE component builders for Account-Dashboard-Mobile-SPEC.
   Locale-aware (lang 'ru' | 'de'); copy from window.ACCT (shared with the
   desktop spec). Uses window.MOCK (M) for the device shell (drawer / sheet /
   top bar / sprite icons #i-*). window.MACC.* is called from the spec script.

   ONE component, three modes — identical semantics to the desktop:
     'one_profile'  — 1 brand · 1 profile (new user)   → profile cards
     'single_brand' — 1 brand · many profiles          → profile cards
     'multi_brand'  — 2+ brands                         → brand cards
   The brand level is invisible until a 2nd brand exists.

   TWO DISTINCT ACCOUNT CONTROLS on the phone (the brief keeps them separate):
     • bottom-docked FLAT PROFILE SWITCHER (thumb) → sheet of every profile
       across brands — one tap to any profile (continuation of AccountSwitcher).
     • hamburger ACCOUNT NAV drawer (Dashboard / [Brands] / Advisor / Settings)
       with the LOGIN/tenant switcher pinned to its foot. */
(function () {
  const C = window.ACCT;
  const M = window.MOCK;
  const L = C.L;
  const A = new URL("assets/avatars/", document.currentScript.src).href;
  const ic = (n, s) => M.ic(n, s || 14);
  const T = (lang) => C.T[lang] || C.T.ru;

  const IMP = {
    ru: { t: "Импортируем историю", p: "постов", c: "комм." },
    de: { t: "Verlauf wird importiert", p: "Beiträge", c: "Komm." },
  };

  function plRu(n, forms) {
    n = Math.abs(n) % 100; var n1 = n % 10;
    if (n > 10 && n < 20) return forms[2];
    if (n1 > 1 && n1 < 5) return forms[1];
    if (n1 === 1) return forms[0];
    return forms[2];
  }
  function delta(v) {
    if (v == null) return "<span class='ma-delta ma-delta--flat'>—</span>";
    var down = String(v).charAt(0) === "-";
    return "<span class='ma-delta ma-delta--" + (down ? "down" : "up") + "'>" + ic(down ? "arrow-down" : "arrow-up", 11) + String(v).replace(/^[-+]/, "") + "</span>";
  }

  // ── marks ─────────────────────────────────────────────────────────────────
  function netBadge(p) {
    var n = C.NETWORKS[p.network];
    return "<span class='ma-net ma-net--" + p.network + "' title='" + n.label + "'>" + n.glyph + "</span>";
  }
  function avatar(p, cls) {
    var inner = p.avatar ? "<img src='" + A + p.avatar + "' alt=''/>" : "<span class='mono'>" + p.mono + "</span>";
    return "<span class='" + (cls || "ma-av") + "'>" + inner + netBadge(p) + "</span>";
  }
  function acctMark(cls) { return "<span class='ma-acctmark" + (cls ? " " + cls : "") + "'>" + C.ACCOUNT.mono + "</span>"; }
  function brandMark(b, cls) { return "<span class='ma-brandmark" + (cls ? " " + cls : "") + "'>" + b.mono + "</span>"; }

  // ── account header band (identity + portfolio totals 2×2) ──────────────────
  function scaleLine(lang, totals) {
    var p = totals.profiles_count, b = totals.brands_count;
    var nets = b >= 2 ? "Threads · LinkedIn" : "Threads";
    if (lang === "de") {
      var base = p + " " + T("de").headScale;
      if (b >= 2) base += " " + T("de").headIn + " " + b + " " + T("de").headBrands;
      return base + " · " + nets;
    }
    var s = p + " " + plRu(p, ["профиль", "профиля", "профилей"]);
    if (b >= 2) s += " в " + b + " " + plRu(b, ["бренде", "брендах", "брендах"]);
    return s + " · " + nets;
  }
  function header(lang, totals) {
    var t = T(lang);
    return "<div class='ma-head'>" + acctMark()
      + "<div class='ma-head-txt'><div class='ma-head-name'>" + C.ACCOUNT.name + "</div>"
      + "<div class='ma-head-meta'><span class='ma-head-plan'>" + C.ACCOUNT.plan + "</span><span class='ma-head-scale'>" + scaleLine(lang, totals) + "</span></div></div></div>";
  }
  function total(lab, icon, num, sub, extra, attention) {
    return "<div class='ma-total" + (attention ? " ma-total--attention" : "") + "'><div class='ma-total-lab'>" + ic(icon, 12) + "<span class='ma-total-labtxt'>" + lab + "</span></div><div class='ma-total-row'><span class='ma-total-num'>" + num + "</span>" + (extra || "") + "</div><div class='ma-total-sub'>" + sub + "</div></div>";
  }
  function totalsGrid(lang, totals) {
    var t = T(lang);
    return "<div class='ma-totals'>"
      + total(t.tFollowers, "users", totals.followers, t.subAll, delta(totals.followers_delta))
      + total(t.tViews, "eye", totals.views_7d, t.sub7d)
      + total(t.tPosts, "nib", totals.posts_this_week, t.subWeek)
      + total(t.tReplies2, "bubble", String(totals.replies_to_answer), t.subWait, null, true)
      + "</div>";
  }

  // ── tasks strip ("Требует тебя") ────────────────────────────────────────────
  var TASK_IC = { sync: "alert", reply: "reply", draft: "nib", audit: "audit" };
  function tasksStrip(lang, tasks) {
    var t = T(lang);
    var chips = tasks.map(function (it) {
      var cls = it.type === "sync" ? " ma-taskchip--sync" : "";
      return "<span class='ma-taskchip" + cls + "'>" + ic(TASK_IC[it.type], 12) + "<b>" + it.n + "</b> " + L(it.label, lang) + "</span>";
    }).join("");
    return "<section class='ma-tasks'><div class='ma-tasks-head'><span class='ma-tasks-lab'>" + ic("alert", 15) + t.tasksTitle + "</span><a class='ma-tasks-all'>" + t.tasksAll + ic("arrow-right", 13) + "</a></div><div class='ma-tasks-chips'>" + chips + "</div></section>";
  }

  // ── account advisor (hero, first-class) ─────────────────────────────────────
  function advChip(c, lang) {
    return "<span class='ma-chip ma-chip--" + c.tone + "'>" + ic(c.icon, 13) + "<span class='t'>" + L(c.text, lang) + "</span></span>";
  }
  function advReco(r, lang) {
    var tone = r.tone === "danger" ? " ma-rec--danger" : r.tone === "accent" ? " ma-rec--accent" : "";
    return "<a class='ma-rec" + tone + "'><span class='ma-rec-ic'>" + ic(r.icon, 15) + "</span><span class='ma-rec-body'><span class='ma-rec-t'>" + L(r.t, lang) + "</span><span class='ma-rec-s'>" + L(r.s, lang) + "</span></span><span class='ma-rec-go'>" + ic("chev-right", 16) + "</span></a>";
  }
  function advisor(lang, mode) {
    var t = T(lang); var a = C.ADVISOR[mode] || C.ADVISOR.single_brand;
    var chips = a.chips.map(function (c) { return advChip(c, lang); }).join("");
    var recos = a.recos.map(function (r) { return advReco(r, lang); }).join("");
    return "<section class='ma-adv'>"
      + "<div class='ma-adv-rail'><span class='ma-adv-mark'>" + ic("advisor", 18) + "</span><div class='ma-adv-headtext'><div class='ma-adv-title'>" + t.advTitle + "</div><div class='ma-adv-scope'>" + t.advScope + "</div></div></div>"
      + "<div class='ma-adv-body'>"
      +   "<div class='ma-adv-verdict'>" + L(a.verdict, lang) + "</div>"
      +   "<div class='ma-adv-detail'>" + L(a.detail, lang) + "</div>"
      +   "<div class='ma-adv-chips'>" + chips + "</div>"
      +   "<div class='ma-adv-grounded'><span class='lab'>" + ic("sparkle", 12) + t.advGrounded + "</span><span class='src'>" + L(a.grounded, lang) + "</span></div>"
      +   "<div class='ma-adv-recos'>" + recos + "</div>"
      +   "<div class='ma-adv-composer'><span class='ph'>" + t.advAsk + "</span><button class='ma-adv-send'>" + ic("send", 16) + "</button></div>"
      +   "<button class='btn btn--secondary ma-adv-open'>" + ic("advisor", 15) + t.advOpen + "</button>"
      + "</div></section>";
  }

  // ── metrics (shared profile + brand aggregate; 2×2) ─────────────────────────
  function metric(lab, icon, val, unit, extra, attention) {
    return "<div class='ma-m" + (attention ? " ma-m--attention" : "") + "'><span class='ma-m-lab'>" + ic(icon, 11) + "<span class='ma-m-labtxt'>" + lab + "</span></span><span class='ma-m-row'><span class='ma-m-val'>" + val + (unit ? " <span class='u'>" + unit + "</span>" : "") + "</span>" + (extra || "") + "</span></div>";
  }
  function metrics4(lang, d, opts) {
    opts = opts || {}; var t = T(lang);
    if (opts.muted) {
      return "<div class='ma-metrics'>"
        + metric(t.tFollowers, "users", d.followers, null, delta(d.followers_delta))
        + metric(t.tViews, "eye", "—") + metric(t.tPosts, "nib", "—", t.mPostsUnit) + metric(t.tReplies2, "bubble", "—") + "</div>";
    }
    return "<div class='ma-metrics'>"
      + metric(t.tFollowers, "users", d.followers, null, delta(d.followers_delta))
      + metric(t.tViews, "eye", d.views_7d)
      + metric(t.tPosts, "nib", d.posts_this_week, t.mPostsUnit)
      + metric(t.tReplies2, "bubble", String(d.replies_to_answer), null, null, d.replies_to_answer > 0)
      + "</div>";
  }

  // ── profile card (1-brand mode) ─────────────────────────────────────────────
  function profileHead(p) {
    return "<div class='ma-card-head'>" + avatar(p) + "<div class='ma-card-id'><div class='ma-card-name'>" + p.handle + "</div><div class='ma-card-sub'>" + C.NETWORKS[p.network].label + "</div></div><span class='ma-go'>" + ic("chev-right", 15) + "</span></div>";
  }
  function profileCard(p, lang) {
    var t = T(lang);
    if (p.sync === "importing") {
      var im = p.import, m = IMP[lang] || IMP.ru;
      return "<div class='ma-card ma-card--importing'>" + profileHead(p)
        + "<div class='import-banner import-banner--syncing'><span class='ib-mark'><span class='ib-spinner'></span></span><div class='ib-body'><div class='ib-title'>" + m.t + "</div><div class='ib-sub'><b>" + im.posts + "</b> " + m.p + " · <b>" + im.comments + "</b> " + m.c + "</div><div class='ib-bar'><div class='ib-bar-fill' style='width:" + im.pct + "%'></div></div></div></div></div>";
    }
    if (p.sync === "error") {
      return "<div class='ma-card'>" + profileHead(p) + metrics4(lang, p, { muted: true })
        + "<div class='ma-cardfoot'><span class='ma-sync ma-sync--error'><span class='ma-sync-dot'></span>" + t.syncFailed + "</span><button class='ma-retry'>" + ic("undo", 12) + t.retry + "</button></div></div>";
    }
    var quick = "<div class='ma-quick'><a class='ma-quicklink'>" + ic("nib", 11) + t.stats + "</a>"
      + "<a class='ma-quicklink" + (p.replies_to_answer > 0 ? " ma-quicklink--attention" : "") + "'>" + ic("reply", 11) + t.replies + (p.replies_to_answer > 0 ? " " + p.replies_to_answer : "") + "</a></div>";
    return "<div class='ma-card'>" + profileHead(p) + metrics4(lang, p)
      + "<div class='ma-cardfoot'><span class='ma-sync'><span class='ma-sync-dot'></span>" + L(p.refreshed, lang) + "</span>" + quick + "</div></div>";
  }

  // ── brand card (2+ brands mode) ─────────────────────────────────────────────
  function brandNetBadges(b) {
    return "<span class='ma-brand-net'>" + b.networks.map(function (nid) {
      return "<span class='ma-brand-netbadge'>" + C.NETWORKS[nid].glyph + "</span>";
    }).join("") + "</span>";
  }
  function brandStack(b) {
    var ids = b.profiles.slice(0, 3);
    var av = ids.map(function (id) { return avatar(C.PROFILES[id], "ma-av"); }).join("");
    var more = b.profiles.length > 3 ? "<span class='ma-stack-more'>+" + (b.profiles.length - 3) + "</span>" : "";
    return "<span class='ma-stack'>" + av + more + "</span>";
  }
  function brandKindLabel(b, lang) {
    var t = T(lang);
    return b.kind === "personal" ? t.brandPersonal : b.kind === "pub" ? t.brandPub : t.brandClient;
  }
  function brandStatLine(b, lang) {
    var t = T(lang);
    if (b.error) return "<span class='ma-brand-statline'><span class='ma-brand-statdot ma-brand-statdot--warn'></span>" + b.error + " " + t.errorN + "</span>";
    if (b.importing) return "<span class='ma-brand-statline'><span class='ma-brand-statdot ma-brand-statdot--imp'></span>" + b.importing + " " + t.importingN + "</span>";
    return "<span class='ma-brand-statline'><span class='ma-brand-statdot'></span>" + t.syncedAll + "</span>";
  }
  function brandProfileRow(id, lang) {
    var p = C.PROFILES[id], t = T(lang);
    var right;
    if (p.sync === "importing") {
      right = "<span class='ma-bp-state ma-bp-state--sync'><span class='ib-spinner' style='width:13px;height:13px'></span>" + t.importingN + "</span>";
    } else if (p.sync === "error") {
      right = "<button class='ma-bp-retry'>" + ic("undo", 12) + t.retry + "</button>";
    } else {
      right = "<span class='ma-bp-mini'><span class='ma-bp-stat'><span class='ma-bp-statnum'>" + p.followers + "</span><span class='ma-bp-statlab'>" + t.tFollowers + "</span></span></span>";
    }
    return "<a class='ma-bp'>" + avatar(p, "ma-bp-av") + "<span class='ma-bp-id'><span class='ma-bp-hd'>" + p.handle + "</span><span class='ma-bp-sub'>" + C.NETWORKS[p.network].label + "</span></span>" + right + "</a>";
  }
  function brandCard(b, lang, opts) {
    opts = opts || {}; var t = T(lang);
    var pc = b.profiles.length;
    var sub = pc + " " + (lang === "de" ? t.profilesWord : plRu(pc, ["профиль", "профиля", "профилей"])) + " · " + brandKindLabel(b, lang);
    var head = "<div class='ma-card-head'><span style='position:relative;flex:0 0 auto'>" + brandMark(b) + brandNetBadges(b) + "</span><div class='ma-card-id'><div class='ma-card-name'>" + b.name + "</div><div class='ma-card-sub'>" + sub + "</div></div><span class='ma-go'>" + ic("chev-right", 15) + "</span></div>";
    var foot = "<div class='ma-cardfoot'>" + brandStatLine(b, lang) + "<button class='ma-brand-expand' aria-expanded='" + (opts.expanded ? "true" : "false") + "'>" + t.expand + " " + ic("chev-down", 13) + "</button></div>";
    var expanded = opts.expanded ? "<div class='ma-brand-profiles'>" + b.profiles.map(function (id) { return brandProfileRow(id, lang); }).join("") + "</div>" : "";
    return "<div class='ma-card ma-card--brand'>" + head + brandStack(b) + metrics4(lang, b) + foot + expanded + "</div>";
  }

  // ── add-brand CTA ───────────────────────────────────────────────────────────
  function addBrand(lang) {
    var t = T(lang);
    return "<a class='ma-add'><span class='ma-add-ico'>" + ic("plus", 20) + "</span><span class='ma-add-body'><span class='ma-add-t'>" + t.addBrandT + "</span><span class='ma-add-s'>" + t.addBrandS + "</span></span><span class='ma-add-go'>" + ic("chev-right", 16) + "</span></a>";
  }

  // ── cards section (adaptive) ────────────────────────────────────────────────
  function profileList(mode) {
    if (mode === "multi_brand") return ["mara", "studio", "notes", "co", "north", "northIn"];
    if (mode === "one_profile") return ["mara"];
    return ["mara", "notes", "studio", "co", "drafts"];
  }
  function cardsSection(lang, mode, opts) {
    opts = opts || {}; var t = T(lang);
    var cards, count, title, note;
    if (mode === "multi_brand") {
      var order = Object.keys(C.BRANDS);
      cards = order.map(function (bid) { return brandCard(C.BRANDS[bid], lang, { expanded: opts.expand === bid }); }).join("");
      count = order.length; title = t.secBrands;
      note = lang === "de" ? "Marke → Übersicht" : "Бренд → дашборд";
    } else {
      var ids = profileList(mode);
      cards = ids.map(function (id) { return profileCard(C.PROFILES[id], lang); }).join("");
      count = ids.length; title = t.secProfiles;
      note = lang === "de" ? "Profil → Studio" : "Профиль → Студия";
    }
    var headRow = "<div class='ma-sec'><span class='ma-sec-t'>" + title + "</span><span class='ma-sec-n'>" + count + "</span><span class='ma-sec-note'>" + note + "</span></div>";
    return headRow + "<div class='ma-grid'>" + cards + addBrand(lang) + "</div>";
  }

  // ── breadcrumb (variable segments) ──────────────────────────────────────────
  function crumb(lang, segs) {
    var html = segs.map(function (s, i) {
      var lead = s.type === "account" ? acctMark() : s.type === "brand" ? "<span class='ma-brandmark'>" + s.mono + "</span>" : avatar(s.profile, "ma-av");
      var seg = "<a class='ma-crumb-seg" + (s.current ? " ma-crumb-seg--current" : "") + "'>" + lead + "<span class='ma-crumb-txt'>" + s.label + "</span></a>";
      return (i ? "<span class='ma-crumb-sep'>" + ic("chev-right", 13) + "</span>" : "") + seg;
    }).join("");
    return "<nav class='ma-crumb'>" + html + "</nav>";
  }

  // ── flat profile switcher: bottom-docked button + sheet ─────────────────────
  function swButton(lang, mode) {
    var t = T(lang); var ids = profileList(mode);
    var stack = ids.slice(0, 3).map(function (id) { return avatar(C.PROFILES[id], "ma-av"); }).join("");
    var count = ids.length + " " + (lang === "de" ? t.swCount : plRu(ids.length, ["профиль", "профиля", "профилей"]));
    return "<button class='ma-swbtn'><span class='ma-swbtn-stack'>" + stack + "</span><span class='ma-swbtn-who'><span class='ma-swbtn-t'>" + t.swAll + "</span><span class='ma-swbtn-s'>" + count + "</span></span><span class='ma-swbtn-chev'>" + ic("arrow-up", 16) + "</span></button>";
  }
  function swRow(id, active, lang) {
    var p = C.PROFILES[id];
    var statCls = p.sync === "error" ? " ma-sw-stat--error" : p.sync === "importing" ? " ma-sw-stat--importing" : "";
    var right = active ? "<span class='ma-sw-check'>" + ic("check", 17) + "</span>" : "<span class='ma-sw-stat" + statCls + "'></span>";
    return "<button class='ma-sw-row'>" + avatar(p, "ma-sw-av") + "<span class='ma-sw-who'><span class='ma-sw-nm'>" + p.handle + "</span><span class='ma-sw-hd'>" + C.NETWORKS[p.network].label + "</span></span>" + right + "</button>";
  }
  function swSheet(lang, mode) {
    var t = T(lang); var multi = mode === "multi_brand";
    var body;
    if (multi) {
      body = Object.keys(C.BRANDS).map(function (bid, bi) {
        var b = C.BRANDS[bid];
        var cap = "<div class='ma-sw-brandcap'><span class='ma-brandmark'>" + b.mono + "</span><span class='t'>" + b.name + "</span></div>";
        return cap + b.profiles.map(function (id, i) { return swRow(id, bi === 0 && i === 0, lang); }).join("");
      }).join("");
    } else {
      body = "<div class='ma-sw-cap'>" + t.swJump + "</div>" + profileList(mode).map(function (id, i) { return swRow(id, i === 0, lang); }).join("");
    }
    var inner = "<div class='m-sheet-grip'></div>"
      + "<div class='m-sheet-head'><div class='m-sheet-title'>" + t.swAll + "</div><button class='m-sheet-close'>" + ic("x", 16) + "</button></div>"
      + body
      + "<button class='ma-sw-row'><span class='ma-sw-av ma-sw-av--add'>" + ic("plus", 16) + "</span><span class='ma-sw-who'><span class='ma-sw-nm'>" + t.swConnect + "</span></span></button>";
    return "<div class='m-scrim'></div><div class='m-sheet'><div style='padding:8px 14px 22px'>" + inner + "</div></div>";
  }

  // ── account nav drawer (hamburger) + login foot ─────────────────────────────
  function navRow(icon, label, active, badge, extraCls) {
    var cls = "m-navrow" + (active ? " m-navrow--active" : "") + (extraCls ? " " + extraCls : "");
    var b = badge ? "<span class='m-navrow-badge'>" + badge + "</span>" : "";
    return "<a class='" + cls + "'" + (active ? " aria-current='page'" : "") + "><svg class='m-navrow-ic'><use href='#i-" + icon + "'/></svg><span class='m-navrow-lbl'>" + label + "</span>" + b + "</a>";
  }
  function navDrawer(lang, opts) {
    opts = opts || {}; var t = T(lang); var multi = opts.brandsCount >= 2;
    var active = opts.active || "dashboard"; // dashboard | brands | advisor | settings
    var rows = navRow("grid", t.navDashboard, active === "dashboard");
    if (multi) rows += navRow("layers", t.navBrands, active === "brands", opts.brandsCount);
    rows += navRow("advisor", t.navAdvisor, active === "advisor");
    rows += navRow("settings", t.navSettings, active === "settings");
    var addRow = navRow("plus", t.addBrandT, false, null, "ma-navrow-add");
    var group = "<div class='m-navgroup'><div class='m-navcap'>" + t.accountWord + "</div>" + rows + "</div>"
      + "<div class='m-navgroup'>" + addRow + "</div>";
    var foot = "<div class='m-drawer-foot'><button class='ma-loginctl'>" + acctMark() + "<span class='ma-loginctl-who'><span class='ma-loginctl-email'>" + C.ACCOUNT.email + "</span><span class='ma-loginctl-plan'>" + C.ACCOUNT.plan + "</span></span><span class='ma-loginctl-chev'>" + ic("chev-up", 16) + "</span></button></div>";
    return "<div class='m-scrim'></div><aside class='m-drawer' role='dialog' aria-label='Account menu'>"
      + "<div class='m-drawer-head'><div class='m-drawer-brand'><img class='m-brand-mark' src='" + A + "mara.png' width='30' height='30' alt=''/><div class='db-id'><div class='bn'>Pennedly</div><div class='bs'>" + t.accountWord + "</div></div></div><button class='m-drawer-close'>" + ic("x", 16) + "</button></div>"
      + "<div class='m-drawer-scroll'>" + group + "</div>" + foot + "</aside>";
  }

  // ── login sheet (tenant switch — opened from the drawer foot) ────────────────
  function loginSheet(lang) {
    var t = T(lang);
    var rows = C.LOGINS.map(function (g) {
      var mark = g.mono === C.ACCOUNT.mono ? acctMark() : "<span class='ma-brandmark'>" + g.mono + "</span>";
      return "<button class='ma-login-row'>" + mark + "<span class='ma-login-who'><span class='ma-login-nm'>" + g.email + "</span><span class='ma-login-hd'>" + g.plan + "</span></span>" + (g.current ? "<span class='ma-login-check'>" + ic("check", 17) + "</span>" : "") + "</button>";
    }).join("");
    var inner = "<div class='m-sheet-grip'></div>"
      + "<div class='ma-login-head'><div class='ma-login-head-id'><div class='ma-login-email'>" + C.ACCOUNT.email + "</div><span class='ma-login-plan'>" + C.ACCOUNT.plan + "</span></div><button class='m-sheet-close'>" + ic("x", 16) + "</button></div>"
      + "<div class='ma-sw-cap'>" + t.switchAccount + "</div>" + rows
      + "<button class='ma-login-row'><span class='ma-login-add'>" + ic("plus", 16) + "</span><span class='ma-login-who'><span class='ma-login-nm'>" + (lang === "de" ? "Konto hinzufügen" : "Добавить аккаунт") + "</span></span></button>"
      + "<div class='m-sheet-sep'></div>"
      + "<button class='ma-login-row ma-login-row--min'><span class='ma-login-mini'>" + ic("settings", 16) + "</span>" + t.settings + "</button>"
      + "<button class='ma-login-row ma-login-row--min'><span class='ma-login-mini'>" + ic("logout", 16) + "</span>" + t.logout + "</button>";
    return "<div class='m-scrim'></div><div class='m-sheet'><div style='padding:8px 14px 22px'>" + inner + "</div></div>";
  }

  // ── top bar (hamburger · Дашборд · N профилей pill · theme) ──────────────────
  function topbar(lang, mode, dark) {
    var t = T(lang);
    var totals = C.TOTALS[mode] || C.TOTALS.single_brand;
    var pill = totals.profiles_count + " " + (lang === "de" ? t.headScale : plRu(totals.profiles_count, ["профиль", "профиля", "профилей"]));
    return M.top({ title: t.navDashboard, menu: true, pill: "accent", pillIcon: "overview", pillText: pill });
  }

  // ── skeleton (loading) ──────────────────────────────────────────────────────
  function skelCard() {
    var mrow = "<div class='skel-line' style='height:16px;margin:9px 0'></div>";
    return "<div class='ma-card'><div class='ma-card-head'><span class='ma-av'></span><div class='ma-card-id'><div class='skel-line' style='width:96px;height:13px'></div><div class='skel-line' style='width:60px;height:11px;margin-top:6px'></div></div></div><div class='ma-metrics'>" + mrow + mrow + mrow + mrow + "</div></div>";
  }
  function skeleton() {
    var head = "<div class='ma-head'><span class='ma-acctmark' style='background:var(--color-surface-2);border:1px solid var(--color-border)'></span><div style='flex:1 1 auto;min-width:0'><div class='skel-line' style='width:130px;height:16px'></div><div class='skel-line' style='width:180px;height:11px;margin-top:8px'></div></div></div>";
    var tile = "<div class='skel-line' style='height:74px;border-radius:14px'></div>";
    var advS = "<div class='ma-adv'><div class='ma-adv-rail'><span class='ma-adv-mark'></span><div style='flex:1 1 auto'><div class='skel-line' style='width:140px;height:14px'></div></div></div><div style='padding:14px'><div class='skel-line' style='height:14px'></div><div class='skel-line' style='height:14px;margin-top:8px;width:82%'></div><div class='skel-line' style='height:48px;margin-top:14px;border-radius:12px'></div></div></div>";
    return "<div class='ma'>" + head + "<div class='ma-totals'>" + tile + tile + tile + tile + "</div>" + advS + skelCard() + skelCard() + pad() + "</div>";
  }

  // ── bodies ──────────────────────────────────────────────────────────────────
  function pad() { return "<div style='height:78px'></div>"; }
  function bodyDash(lang, mode, opts) {
    opts = opts || {};
    if (opts.state === "loading") return skeleton();
    var totals = C.TOTALS[mode] || C.TOTALS.single_brand;
    var tasks = C.TASKS[mode] || C.TASKS.single_brand;
    return "<div class='ma'>" + header(lang, totals) + totalsGrid(lang, totals) + tasksStrip(lang, tasks) + advisor(lang, mode) + cardsSection(lang, mode, opts) + pad() + "</div>";
  }

  function set(id, html) { var e = document.getElementById(id); if (e) e.innerHTML = html; }

  window.MACC = {
    ic: ic, avatar: avatar, acctMark: acctMark, brandMark: brandMark, delta: delta, netBadge: netBadge,
    header: header, totalsGrid: totalsGrid, tasksStrip: tasksStrip, advisor: advisor,
    metrics4: metrics4, profileCard: profileCard, brandCard: brandCard, brandProfileRow: brandProfileRow,
    addBrand: addBrand, cardsSection: cardsSection, profileList: profileList,
    crumb: crumb, swButton: swButton, swSheet: swSheet, navDrawer: navDrawer, loginSheet: loginSheet,
    topbar: topbar, skeleton: skeleton, bodyDash: bodyDash, set: set,
  };
})();
