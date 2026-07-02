/* account-desktop.js — desktop component builders for Account-Dashboard-SPEC.
   Locale-aware: every builder takes lang ('ru' | 'de'); copy comes from
   window.ACCT. Returns HTML strings on the live DS layer (account.css on
   ds/tokens.css). window.ACC.* is called from the spec's inline script.

   ONE component, three modes:
     'one_profile'  — 1 brand · 1 profile  (new user)   → profile cards
     'single_brand' — 1 brand · many profiles           → profile cards
     'multi_brand'  — 2+ brands                          → brand cards
   The brand level is invisible until a 2nd brand exists. */
(function () {
  const C = window.ACCT;
  const L = C.L;
  const A = "assets/avatars/";
  const T = (lang) => C.T[lang] || C.T.ru;

  const IMP = {
    ru: { t: "Импортируем историю", p: "постов", c: "комментариев" },
    de: { t: "Verlauf wird importiert", p: "Beiträge", c: "Kommentare" },
  };

  // ── icons (inline; the desktop doc doesn't use the sprite) ──────────────
  const P = {
    grid: "<rect x='4' y='4' width='7' height='7' rx='1.5'/><rect x='13' y='4' width='7' height='7' rx='1.5'/><rect x='4' y='13' width='7' height='7' rx='1.5'/><rect x='13' y='13' width='7' height='7' rx='1.5'/>",
    layers: "<path d='M12 4 3 9l9 5 9-5-9-5Z'/><path d='M3 14l9 5 9-5'/>",
    advisor: "<path d='M4 16V7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H9l-4 4v-4Z'/><path d='M8 13l2.6-2.6 1.8 1.8L16 9'/><path d='M13.4 9H16v2.6'/>",
    settings: "<circle cx='12' cy='12' r='3'/><path d='M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2'/>",
    users: "<circle cx='9' cy='9' r='3.2'/><path d='M3.5 19a5.5 5.5 0 0 1 11 0'/><path d='M16 6.3a3 3 0 0 1 0 5.4M17.5 19a5.5 5.5 0 0 0-3-4.9'/>",
    eye: "<path d='M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z'/><circle cx='12' cy='12' r='2.6'/>",
    nib: "<path d='M4 20 13 11'/><path d='M12 4 20 12 13 11 13 4Z'/><circle cx='6' cy='18' r='0.6'/>",
    bubble: "<path d='M5 17l-1.5 3.5L8 19h8a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3H7a3 3 0 0 0-3 3v6a3 3 0 0 0 1 2.7Z'/>",
    reply: "<path d='M9 7 4 12l5 5M4 12h9a6 6 0 0 1 6 6v1'/>",
    chart: "<path d='M4 19V5M4 19h16'/><path d='M8 16l3.5-4 3 2.5L19 8'/>",
    audit: "<rect x='5' y='4' width='14' height='17' rx='2'/><path d='M9 4.5h6V7H9Z'/><path d='M8.5 12.5l2 2 4-4.5'/>",
    up: "<path d='M12 19V6M6 11l6-6 6 6'/>",
    down: "<path d='M12 5v13M6 13l6 6 6-6'/>",
    "arrow-right": "<path d='M5 12h14M13 6l6 6-6 6'/>",
    plus: "<path d='M12 5v14M5 12h14'/>",
    undo: "<path d='M9 7 5 11l4 4'/><path d='M5 11h9a5 5 0 0 1 0 10h-3'/>",
    check: "<path d='M4.5 12.5 9.5 17.5 19.5 6.5'/>",
    "chev-right": "<path d='M9 6l6 6-6 6'/>",
    "chev-down": "<path d='M6 9l6 6 6-6'/>",
    "chev-up": "<path d='M6 15l6-6 6 6'/>",
    logout: "<path d='M14 7V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2'/><path d='M10 12h10M17 9l3 3-3 3'/>",
    moon: "<path d='M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z'/>",
    sun: "<circle cx='12' cy='12' r='4'/><path d='M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19'/>",
    alert: "<path d='M12 4 2.5 20.5h19L12 4Z'/><path d='M12 10v4'/><circle cx='12' cy='17.4' r='0.5'/>",
    send: "<path d='M5 12h13M12 5l7 7-7 7'/>",
    sparkle: "<path d='M12 4l1.6 4.8L18 10l-4.4 1.2L12 16l-1.6-4.8L6 10l4.4-1.2L12 4Z'/>",
  };
  function ic(n, s) {
    s = s || 14;
    return "<svg width='" + s + "' height='" + s + "' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'>" + (P[n] || "") + "</svg>";
  }
  function delta(v) {
    if (v == null) return "<span class='acc-delta acc-delta--flat'>—</span>";
    var down = String(v).charAt(0) === "-";
    return "<span class='acc-delta acc-delta--" + (down ? "down" : "up") + "'>" + ic(down ? "down" : "up", 12) + String(v).replace(/^[-+]/, "") + "</span>";
  }
  function plRu(n, forms) {
    n = Math.abs(n) % 100; var n1 = n % 10;
    if (n > 10 && n < 20) return forms[2];
    if (n1 > 1 && n1 < 5) return forms[1];
    if (n1 === 1) return forms[0];
    return forms[2];
  }

  // ── marks ───────────────────────────────────────────────────────────────
  function netBadge(p) {
    var n = C.NETWORKS[p.network];
    return "<span class='acc-net acc-net--" + p.network + "' title='" + n.label + "'>" + n.glyph + "</span>";
  }
  function avatar(p, cls) {
    var inner = p.avatar ? "<img src='" + A + p.avatar + "' alt=''/>" : "<span class='mono'>" + p.mono + "</span>";
    return "<span class='" + (cls || "acc-av") + "'>" + inner + netBadge(p) + "</span>";
  }
  function acctMark(cls) { return "<span class='acc-acctmark" + (cls ? " " + cls : "") + "'>" + C.ACCOUNT.mono + "</span>"; }
  function brandMark(b, cls) { return "<span class='acc-brandmark" + (cls ? " " + cls : "") + "'>" + b.mono + "</span>"; }

  // ── sidebar (ACCOUNT level) ─────────────────────────────────────────────
  function sidebar(lang, opts) {
    opts = opts || {}; var t = T(lang); var multi = opts.brandsCount >= 2;
    var rows = "";
    rows += "<a class='acc-sb-row acc-sb-row--active'>" + ic("grid", 17) + "<span class='acc-sb-rowtxt'>" + t.navDashboard + "</span></a>";
    if (multi) rows += "<a class='acc-sb-row'>" + ic("layers", 17) + "<span class='acc-sb-rowtxt'>" + t.navBrands + "</span><span class='acc-sb-badge'>" + opts.brandsCount + "</span></a>";
    rows += "<a class='acc-sb-row'>" + ic("advisor", 17) + "<span class='acc-sb-rowtxt'>" + t.navAdvisor + "</span></a>";
    rows += "<a class='acc-sb-row'>" + ic("settings", 17) + "<span class='acc-sb-rowtxt'>" + t.navSettings + "</span></a>";
    return "<div class='acc-sb'>"
      + "<div class='acc-sb-brand'><span class='acc-sb-mark'>" + ic("nib", 16) + "</span><span class='acc-sb-name'>Pennedly</span></div>"
      + "<div class='acc-sb-cap'>" + t.accountWord + "</div>"
      + "<div class='acc-sb-nav'>" + rows + "</div>"
      + "<div class='acc-sb-foot'>" + loginButton(lang) + "</div></div>";
  }
  function loginButton(lang) {
    return "<button class='acc-login'>" + acctMark() + "<span class='acc-login-who'><span class='acc-login-email'>" + C.ACCOUNT.email + "</span><span class='acc-login-plan'>" + C.ACCOUNT.plan + "</span></span>" + ic("chev-up", 15) + "</button>";
  }
  function loginMenu(lang) {
    var t = T(lang);
    var rows = C.LOGINS.map(function (g) {
      return "<button class='acc-lm-row'><span class='acc-acctmark'>" + g.mono + "</span><span class='acc-lm-who'><span class='acc-lm-email'>" + g.email + "</span><span class='acc-lm-plan'>" + g.plan + "</span></span>" + (g.current ? "<span class='acc-lm-check'>" + ic("check", 16) + "</span>" : "") + "</button>";
    }).join("");
    return "<div class='acc-loginmenu'>"
      + "<div class='acc-lm-cap'>" + t.switchAccount + "</div>" + rows
      + "<button class='acc-lm-row'><span class='acc-lm-add'>" + ic("plus", 15) + "</span><span class='acc-lm-who'><span class='acc-lm-email'>" + (lang === "de" ? "Konto hinzufügen" : "Добавить аккаунт") + "</span></span></button>"
      + "<div class='acc-lm-sep'></div>"
      + "<button class='acc-lm-row acc-lm-row--min'><span class='acc-lm-mini'>" + ic("settings", 15) + "</span>" + t.settings + "</button>"
      + "<button class='acc-lm-row acc-lm-row--min'><span class='acc-lm-mini'>" + ic("logout", 15) + "</span>" + t.logout + "</button>"
      + "</div>";
  }

  // ── breadcrumb (variable segments) ──────────────────────────────────────
  function crumb(lang, segs) {
    var html = segs.map(function (s, i) {
      var lead = s.type === "account" ? acctMark() : s.type === "brand" ? "<span class='acc-brandmark'>" + s.mono + "</span>" : avatar(s.profile, "acc-av");
      var seg = "<a class='acc-crumb-seg" + (s.current ? " acc-crumb-seg--current" : "") + "'>" + lead + "<span class='acc-crumb-txt'>" + s.label + "</span></a>";
      return (i ? "<span class='acc-crumb-sep'>" + ic("chev-right", 14) + "</span>" : "") + seg;
    }).join("");
    return "<nav class='acc-crumb'>" + html + "</nav>";
  }

  // ── flat profile switcher ───────────────────────────────────────────────
  function profileList(mode) {
    if (mode === "multi_brand") return ["mara", "studio", "notes", "co", "north", "northIn"];
    if (mode === "one_profile") return ["mara"];
    return ["mara", "notes", "studio", "co", "drafts"];
  }
  function flatSwitcher(lang, mode) {
    var t = T(lang); var ids = profileList(mode);
    var stack = ids.slice(0, 3).map(function (id) { return avatar(C.PROFILES[id], "acc-av"); }).join("");
    return "<button class='acc-sw'><span class='acc-sw-stack'>" + stack + "</span><span class='acc-sw-lab'><span class='acc-sw-t'>" + t.swAll + "</span><span class='acc-sw-s'>" + ids.length + " " + (lang === "de" ? t.swCount : plRu(ids.length, ["профиль", "профиля", "профилей"])) + "</span></span>" + ic("chev-down", 15) + "</button>";
  }
  function switcherMenu(lang, mode) {
    var t = T(lang); var multi = mode === "multi_brand";
    var statDot = function (p) {
      var cls = p.sync === "error" ? " acc-swrow-stat--error" : p.sync === "importing" ? " acc-swrow-stat--importing" : "";
      return "<span class='acc-swrow-stat" + cls + "'></span>";
    };
    var rowOf = function (id, active) {
      var p = C.PROFILES[id];
      return "<button class='acc-swrow'>" + avatar(p, "acc-sw-av") + "<span class='acc-swrow-who'><span class='acc-swrow-nm'>" + p.handle + "</span><span class='acc-swrow-hd'>" + C.NETWORKS[p.network].label + "</span></span>" + (active ? "<span class='acc-swrow-check'>" + ic("check", 16) + "</span>" : statDot(p)) + "</button>";
    };
    var body;
    if (multi) {
      // flat — but each profile labelled by its brand (still one click)
      body = Object.keys(C.BRANDS).map(function (bid, bi) {
        var b = C.BRANDS[bid];
        var cap = "<div class='acc-swmenu-cap'><span class='acc-brandmark'>" + b.mono + "</span><span class='t'>" + b.name + "</span></div>";
        var rows = b.profiles.map(function (id, i) { return rowOf(id, bi === 0 && i === 0); }).join("");
        return cap + rows;
      }).join("");
    } else {
      body = "<div class='acc-swmenu-cap'><span class='t'>" + t.swJump + "</span></div>" + profileList(mode).map(function (id, i) { return rowOf(id, i === 0); }).join("");
    }
    return "<div class='acc-swmenu'>" + body
      + "<div class='acc-sw-sep'></div>"
      + "<button class='acc-swrow acc-swrow--add'><span class='acc-sw-av'>" + ic("plus", 15) + "</span><span class='acc-swrow-who'><span class='acc-swrow-nm'>" + t.swConnect + "</span></span></button>"
      + "</div>";
  }

  // ── account header band (identity + portfolio totals) ───────────────────
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
  function ht(lab, icon, num, sub, extra, attention) {
    return "<div class='acc-ht" + (attention ? " acc-ht--attention" : "") + "'><div class='acc-ht-lab'>" + ic(icon, 12) + "<span class='acc-ht-labtxt'>" + lab + "</span></div><div class='acc-ht-row'><span class='acc-ht-num'>" + num + "</span>" + (extra || "") + "</div><div class='acc-ht-sub'>" + sub + "</div></div>";
  }
  function header(lang, totals) {
    var t = T(lang);
    var totalsHtml = "<div class='acc-head-totals'>"
      + ht(t.tFollowers, "users", totals.followers, t.subAll, delta(totals.followers_delta))
      + ht(t.tViews, "eye", totals.views_7d, t.sub7d)
      + ht(t.tPosts, "nib", totals.posts_this_week, t.subWeek)
      + ht(t.tReplies2, "bubble", String(totals.replies_to_answer), t.subWait, null, true)
      + "</div>";
    return "<div class='acc-head'>"
      + "<div class='acc-head-id'>" + acctMark() + "<div class='acc-head-txt'><div class='acc-head-name'>" + C.ACCOUNT.name + "</div><div class='acc-head-meta'><span class='acc-head-plan'>" + C.ACCOUNT.plan + "</span><span class='acc-head-scale'>" + scaleLine(lang, totals) + "</span></div></div></div>"
      + "<div class='acc-head-spacer'></div>"
      + totalsHtml + "</div>";
  }

  // ── tasks strip ─────────────────────────────────────────────────────────
  var TASK_IC = { sync: "alert", reply: "reply", draft: "nib", audit: "audit" };
  function tasksStrip(lang, tasks) {
    var t = T(lang);
    var chips = tasks.map(function (it) {
      var cls = it.type === "sync" ? " acc-taskchip--sync" : "";
      return "<span class='acc-taskchip" + cls + "'>" + ic(TASK_IC[it.type], 12) + "<b>" + it.n + "</b> " + L(it.label, lang) + "</span>";
    }).join("");
    return "<div class='acc-tasks'><span class='acc-tasks-lab'>" + ic("alert", 15) + t.tasksTitle + "</span><div class='acc-tasks-chips'>" + chips + "</div><a class='acc-tasks-all'>" + t.tasksAll + ic("arrow-right", 13) + "</a></div>";
  }

  // ── account advisor (hero) ──────────────────────────────────────────────
  function advChip(c, lang) {
    return "<span class='acc-chip acc-chip--" + c.tone + "'>" + ic(c.icon, 13) + "<span class='t'>" + L(c.text, lang) + "</span></span>";
  }
  function advReco(r, lang) {
    var tone = r.tone === "danger" ? " acc-rec--danger" : r.tone === "accent" ? " acc-rec--accent" : "";
    return "<a class='acc-rec" + tone + "'><span class='acc-rec-ic'>" + ic(r.icon, 15) + "</span><span class='acc-rec-body'><span class='acc-rec-t'>" + L(r.t, lang) + "</span><span class='acc-rec-s'>" + L(r.s, lang) + "</span></span><span class='acc-rec-go'>" + ic("chev-right", 16) + "</span></a>";
  }
  function advisor(lang, mode) {
    var t = T(lang); var a = C.ADVISOR[mode] || C.ADVISOR.single_brand;
    var chips = a.chips.map(function (c) { return advChip(c, lang); }).join("");
    var recos = a.recos.map(function (r) { return advReco(r, lang); }).join("");
    var grounded = "<div class='acc-adv-grounded'><span class='lab'>" + ic("sparkle", 12) + t.advGrounded + "</span><span class='src'>" + L(a.grounded, lang) + "</span></div>";
    var composer = "<div class='acc-adv-composer'><span class='ph'>" + t.advAsk + "</span><button class='acc-adv-send'>" + ic("send", 17) + "</button></div>";
    return "<section class='acc-adv'>"
      + "<div class='acc-adv-rail'><span class='acc-adv-mark'>" + ic("advisor", 20) + "</span><div class='acc-adv-headtext'><div class='acc-adv-title'>" + t.advTitle + "</div><div class='acc-adv-scope'>" + t.advScope + "</div></div><button class='btn btn--secondary btn--sm acc-adv-open'>" + ic("advisor", 15) + t.advOpen + "</button></div>"
      + "<div class='acc-adv-body'><div class='acc-adv-main'><div class='acc-adv-verdict'>" + L(a.verdict, lang) + "</div><div class='acc-adv-detail'>" + L(a.detail, lang) + "</div><div class='acc-adv-chips'>" + chips + "</div>" + grounded + composer + "</div>"
      + "<div class='acc-adv-side'><div class='acc-adv-sidecap'>" + t.advReco + "</div>" + recos + "</div></div>"
      + "</section>";
  }

  // ── metrics (shared profile + brand aggregate) ──────────────────────────
  function metric(lab, icon, val, unit, extra, attention) {
    // no data → just the dash, nothing after it (no unit, no delta)
    var noData = (val === "—");
    var unitHtml = (unit && !noData) ? " <span class='u'>" + unit + "</span>" : "";
    var extraHtml = (extra && !noData) ? extra : "";
    return "<div class='acc-m" + (attention ? " acc-m--attention" : "") + "'><span class='acc-m-lab'>" + ic(icon, 11) + "<span class='acc-m-labtxt'>" + lab + "</span></span><span class='acc-m-row'><span class='acc-m-val'>" + val + unitHtml + "</span>" + extraHtml + "</span></div>";
  }
  function metrics4(lang, d, opts) {
    opts = opts || {}; var t = T(lang);
    if (opts.muted) {
      return "<div class='acc-metrics'>"
        + metric(t.tFollowers, "users", d.followers, null, delta(d.followers_delta))
        + metric(t.tViews, "eye", "—") + metric(t.tPosts, "nib", "—", t.mPostsUnit) + metric(t.tReplies2, "bubble", "—") + "</div>";
    }
    return "<div class='acc-metrics'>"
      + metric(t.tFollowers, "users", d.followers, null, delta(d.followers_delta))
      + metric(t.tViews, "eye", d.views_7d)
      + metric(t.tPosts, "nib", d.posts_this_week, t.mPostsUnit)
      + metric(t.tReplies2, "bubble", String(d.replies_to_answer), null, null, d.replies_to_answer > 0)
      + "</div>";
  }

  // ── profile card ────────────────────────────────────────────────────────
  function profileHead(p) {
    return "<div class='acc-card-head'>" + avatar(p) + "<div class='acc-card-id'><div class='acc-card-name'>" + p.handle + "</div><div class='acc-card-sub'>" + C.NETWORKS[p.network].label + "</div></div><span class='acc-go'>" + ic("arrow-right", 16) + "</span></div>";
  }
  function profileCard(p, lang) {
    var t = T(lang);
    if (p.sync === "importing") {
      var im = p.import, m = IMP[lang] || IMP.ru;
      return "<div class='acc-card acc-card--importing'>" + profileHead(p)
        + "<div class='import-banner import-banner--syncing'><span class='ib-mark'><span class='ib-spinner'></span></span><div class='ib-body'><div class='ib-title'>" + m.t + "</div><div class='ib-sub'><b>" + im.posts + "</b> " + m.p + " · <b>" + im.comments + "</b> " + m.c + "</div><div class='ib-bar'><div class='ib-bar-fill' style='width:" + im.pct + "%'></div></div></div><span class='ib-since'>" + L(im.eta, lang) + "</span></div></div>";
    }
    if (p.sync === "error") {
      return "<div class='acc-card'>" + profileHead(p) + metrics4(lang, p, { muted: true })
        + "<div class='acc-cardfoot'><span class='acc-sync acc-sync--error'><span class='acc-sync-dot'></span>" + t.syncFailed + "</span><button class='acc-retry'>" + ic("undo", 12) + t.retry + "</button></div></div>";
    }
    var quick = "<div class='acc-quick'><a class='acc-quicklink'>" + ic("nib", 12) + t.stats + "</a>"
      + "<a class='acc-quicklink" + (p.replies_to_answer > 0 ? " acc-quicklink--attention" : "") + "'>" + ic("reply", 12) + t.replies + (p.replies_to_answer > 0 ? " " + p.replies_to_answer : "") + "</a></div>";
    return "<div class='acc-card'>" + profileHead(p) + metrics4(lang, p)
      + "<div class='acc-cardfoot'><span class='acc-sync'><span class='acc-sync-dot'></span>" + L(p.refreshed, lang) + "</span>" + quick + "</div></div>";
  }

  // ── brand card (2+ brands mode) ─────────────────────────────────────────
  function brandNetBadges(b) {
    return "<span class='acc-brand-net'>" + b.networks.map(function (nid) {
      return "<span class='acc-brand-netbadge'>" + C.NETWORKS[nid].glyph + "</span>";
    }).join("") + "</span>";
  }
  function brandStack(b) {
    var ids = b.profiles.slice(0, 3);
    var av = ids.map(function (id) { return avatar(C.PROFILES[id], "acc-av"); }).join("");
    var more = b.profiles.length > 3 ? "<span class='acc-stack-more'>+" + (b.profiles.length - 3) + "</span>" : "";
    return "<span class='acc-stack'>" + av + more + "</span>";
  }
  function brandKindLabel(b, lang) {
    var t = T(lang);
    return b.kind === "personal" ? t.brandPersonal : b.kind === "pub" ? t.brandPub : t.brandClient;
  }
  function brandStatLine(b, lang) {
    var t = T(lang);
    if (b.error) return "<span class='acc-brand-statline'><span class='acc-brand-statdot acc-brand-statdot--warn'></span>" + b.error + " " + t.errorN + "</span>";
    if (b.importing) return "<span class='acc-brand-statline'><span class='acc-brand-statdot acc-brand-statdot--warn' style='background:var(--color-accent)'></span>" + b.importing + " " + t.importingN + "</span>";
    return "<span class='acc-brand-statline'><span class='acc-brand-statdot'></span>" + t.syncedAll + "</span>";
  }
  function brandProfileRow(id, lang) {
    var p = C.PROFILES[id], t = T(lang);
    var sub = p.handle + " · " + C.NETWORKS[p.network].label;
    var right;
    if (p.sync === "importing") {
      right = "<span class='acc-bp-state acc-bp-state--sync'><span class='ib-spinner' style='width:13px;height:13px'></span>" + t.importingN + "</span>";
    } else if (p.sync === "error") {
      right = "<button class='acc-bp-retry'>" + ic("undo", 12) + t.retry + "</button>";
    } else {
      right = "<span class='acc-bp-mini'><span class='acc-bp-stat'><span class='acc-bp-statnum'>" + p.followers + "</span><span class='acc-bp-statlab'>" + t.tFollowers + "</span></span><span class='acc-bp-stat'><span class='acc-bp-statnum'>" + p.views_7d + "</span><span class='acc-bp-statlab'>" + t.tViews + "</span></span></span>";
    }
    return "<a class='acc-bp'>" + avatar(p, "acc-bp-av") + "<span class='acc-bp-id'><span class='acc-bp-hd'>" + p.handle + "</span><span class='acc-bp-sub'>" + C.NETWORKS[p.network].label + "</span></span>" + right + "</a>";
  }
  function brandCard(b, lang, opts) {
    opts = opts || {}; var t = T(lang);
    var pc = b.profiles.length;
    var sub = pc + " " + (lang === "de" ? t.profilesWord : plRu(pc, ["профиль", "профиля", "профилей"])) + " · " + brandKindLabel(b, lang);
    var head = "<div class='acc-card-head'><span style='position:relative;flex:0 0 auto'>" + brandMark(b) + brandNetBadges(b) + "</span><div class='acc-card-id'><div class='acc-card-name'>" + b.name + "</div><div class='acc-card-sub'>" + sub + "</div></div><span class='acc-go'>" + ic("arrow-right", 16) + "</span></div>";
    var foot = "<div class='acc-cardfoot'>" + brandStatLine(b, lang) + "<button class='acc-brand-expand' aria-expanded='" + (opts.expanded ? "true" : "false") + "'>" + t.expand + " " + ic("chev-down", 13) + "</button></div>";
    var expanded = opts.expanded ? "<div class='acc-brand-profiles'>" + b.profiles.map(function (id) { return brandProfileRow(id, lang); }).join("") + "</div>" : "";
    return "<div class='acc-card acc-card--brand'>" + head
      + "<div style='display:flex;align-items:center;gap:10px;margin-top:14px;min-width:0'>" + brandStack(b) + "</div>"
      + metrics4(lang, b) + foot + expanded + "</div>";
  }

  // ── add-brand CTA ───────────────────────────────────────────────────────
  function addBrand(lang) {
    var t = T(lang);
    return "<a class='acc-add'><span class='acc-add-ico'>" + ic("plus", 20) + "</span><span class='acc-add-t'>" + t.addBrandT + "</span><span class='acc-add-s'>" + t.addBrandS + "</span></a>";
  }

  // ── cards section (adaptive) ────────────────────────────────────────────
  function cardsSection(lang, mode, opts) {
    opts = opts || {}; var t = T(lang);
    var multi = mode === "multi_brand";
    var cards, count, title, note;
    if (multi) {
      var order = Object.keys(C.BRANDS);
      cards = order.map(function (bid) { return brandCard(C.BRANDS[bid], lang, { expanded: opts.expand === bid }); }).join("");
      count = order.length; title = t.secBrands;
      note = lang === "de" ? "Klick auf eine Marke → Marken-Übersicht" : "Клик по бренду → дашборд бренда";
    } else {
      var ids = profileList(mode);
      cards = ids.map(function (id) { return profileCard(C.PROFILES[id], lang); }).join("");
      count = ids.length; title = t.secProfiles;
      note = lang === "de" ? "Klick auf ein Profil → Studio" : "Клик по профилю → Студия";
    }
    var headRow = "<div class='acc-sec'><span class='acc-sec-t'>" + title + "</span><span class='acc-sec-n'>" + count + "</span><span class='acc-sec-note'>" + note + "</span></div>";
    return headRow + "<div class='acc-grid'>" + cards + addBrand(lang) + "</div>";
  }

  // ── topbar + body + shell compositions ──────────────────────────────────
  function topbar(lang, mode, dark) {
    var t = T(lang);
    var segs = [{ type: "account", label: t.crumbAccount, current: true }];
    return "<div class='acc-top'>" + crumb(lang, segs) + "<div class='acc-top-actions'>" + flatSwitcher(lang, mode) + "<span class='acc-ib'>" + ic(dark ? "sun" : "moon", 16) + "</span><span class='acc-ib'>" + ic("settings", 16) + "</span></div></div>";
  }
  function body(lang, mode, opts) {
    opts = opts || {};
    if (opts.state === "loading") return skeleton();
    var totals = C.TOTALS[mode] || C.TOTALS.single_brand;
    var tasks = C.TASKS[mode] || C.TASKS.single_brand;
    return "<div class='acc'>" + header(lang, totals) + tasksStrip(lang, tasks) + advisor(lang, mode) + cardsSection(lang, mode, opts) + "</div>";
  }
  function mainCol(lang, mode, dark, opts) {
    return "<div class='acc-mainwrap' style='min-width:0;display:flex;flex-direction:column;gap:18px'>" + topbar(lang, mode, dark) + body(lang, mode, opts) + "</div>";
  }
  function shell(lang, mode, dark, opts) {
    opts = opts || {};
    var totals = C.TOTALS[mode] || C.TOTALS.single_brand;
    return "<div class='acc-shell'>" + sidebar(lang, { brandsCount: totals.brands_count }) + mainCol(lang, mode, dark, opts) + "</div>";
  }

  // ── skeleton (loading; mirrors the dashboard layout) ────────────────────
  function skelCard() {
    var mrow = "<div class='skel-line' style='height:16px;margin:9px 0'></div>";
    return "<div class='acc-card'><div class='acc-card-head'><span class='acc-av'></span><div class='acc-card-id'><div class='skel-line' style='width:92px;height:13px'></div><div class='skel-line' style='width:60px;height:11px;margin-top:6px'></div></div><span class='acc-go'></span></div><div class='acc-metrics'>" + mrow + mrow + mrow + mrow + "</div><div class='acc-cardfoot'><div class='skel-line' style='width:110px;height:12px'></div><div class='skel-line' style='width:120px;height:22px;border-radius:999px'></div></div></div>";
  }
  function skeleton() {
    var head = "<div class='acc-head'><span class='acc-acctmark' style='background:var(--color-surface-2);border:1px solid var(--color-border)'></span><div style='flex:1 1 auto;min-width:0'><div class='skel-line' style='width:140px;height:18px'></div><div class='skel-line' style='width:200px;height:12px;margin-top:8px'></div></div></div>";
    var advS = "<div class='acc-adv'><div class='acc-adv-rail'><span class='acc-adv-mark'></span><div style='flex:1 1 auto'><div class='skel-line' style='width:150px;height:15px'></div></div></div><div style='padding:16px 18px'><div class='skel-line' style='height:14px'></div><div class='skel-line' style='height:14px;margin-top:8px;width:80%'></div><div class='skel-line' style='height:54px;margin-top:14px;border-radius:12px'></div></div></div>";
    return "<div class='acc'>" + head + advS + "<div class='acc-grid'>" + skelCard() + skelCard() + "</div></div>";
  }

  function set(id, html) { var e = document.getElementById(id); if (e) e.innerHTML = html; }

  window.ACC = {
    ic, delta, avatar, acctMark, brandMark, netBadge,
    sidebar, loginButton, loginMenu, crumb, flatSwitcher, switcherMenu,
    header, tasksStrip, advisor, advReco,
    profileCard, brandCard, brandProfileRow, addBrand, cardsSection,
    topbar, body, mainCol, shell, skeleton, set,
    profileList,
  };
})();
