/* variants/shell.js — shared account-level app shell for all concepts.
   The shell holds the INVARIANT navigation the brief requires in every variant:
   account identity, plan badge, portfolio scale, one-click profile switcher,
   account menu (email + plan → settings, logout), theme toggle, and the
   adaptive nav (the "Бренды" item appears only at 2+ brands). Each concept
   supplies only its MAIN content composition; the chrome stays constant so the
   five concepts are compared on structure, not on re-drawn nav.

   Two chrome forms (brief lets us choose): a left sidebar on desktop, and a top
   bar + bottom bar + account sheet on mobile. V5 opts into a slimmer, sidebar-
   less "calm" chrome via ctx.chrome === 'minimal'. */
(function () {
  "use strict";
  var VK = window.VK, ic = VK.ic, t = VK.t, L = VK.L, avatar = VK.avatar;

  function navRow(id, icon, label, active, badge) {
    return "<a class='vsb-row" + (active ? " vsb-row--active" : "") + "'" + (active ? " aria-current='page'" : "") + ">" +
      ic(icon, 17) + "<span class='vsb-rowtxt'>" + label + "</span>" +
      (badge ? "<span class='vsb-badge'>" + badge + "</span>" : "") + "</a>";
  }

  function accountBtn(lang) {
    var A = VK.ACCOUNT;
    return "<button class='vsb-acct' data-vpop-btn='acct'>" +
      "<span class='vsb-acct-mono'>" + A.mono + "</span>" +
      "<span class='vsb-acct-who'><span class='vsb-acct-email'>" + A.email + "</span><span class='vsb-acct-plan'>" + A.plan + "</span></span>" +
      ic("chev-up", 15) + "</button>";
  }
  function accountMenu(lang) {
    var A = VK.ACCOUNT, tt = t(lang);
    return "<div class='vpop vpop--up vpop--acct' data-vpop='acct' hidden>" +
      "<div class='vpop-head'><span class='vsb-acct-mono'>" + A.mono + "</span><span class='vsb-acct-who'><span class='vsb-acct-email'>" + A.email + "</span><span class='vsb-acct-plan'>" + A.plan + "</span></span></div>" +
      "<div class='vpop-sep'></div>" +
      "<button class='vpop-row'>" + ic("settings", 16) + tt.accSettings + "</button>" +
      "<button class='vpop-row'>" + ic("logout", 16) + tt.logout + "</button>" +
      "</div>";
  }

  // one-click profile switcher (flat; grouped by brand only when 2+ brands)
  function switcher(ctx) {
    var lang = ctx.lang, tt = t(lang), r = ctx.r;
    var live = r.profiles.filter(function (p) { return p.sync !== "disconnected"; });
    var stackSrc = (live.length ? live : r.profiles).slice(0, 3);
    var stack = stackSrc.map(function (p) { return avatar(p, 22, { noBadge: true, cls: "vsw-stackav" }); }).join("");
    var n = r.profiles.length;
    var btn = "<button class='vsw' data-vpop-btn='sw'><span class='vsw-stack'>" + stack + "</span>" +
      "<span class='vsw-lab'><span class='vsw-t'>" + tt.allProfiles + "</span><span class='vsw-s'>" + n + "\u00A0" + VK.plW(n, tt.profilesW, lang) + "</span></span>" +
      ic("chev-down", 15) + "</button>";
    var groups = r.groups.map(function (g) {
      var cap = g.brand ? "<div class='vsw-cap'>" + g.brand.name + "</div>" : "<div class='vsw-cap'>" + tt.jumpProfile + "</div>";
      var rows = g.profiles.map(function (p) {
        var dotCls = p.sync === "error" ? " vsw-dot--error" : p.sync === "importing" ? " vsw-dot--imp" : p.sync === "disconnected" ? " vsw-dot--off" : "";
        return "<button class='vsw-row'>" + avatar(p, 26) +
          "<span class='vsw-who'><span class='vsw-nm'>" + p.handle + "</span><span class='vsw-hd'>" + VK.NETWORKS[p.network].label + "</span></span>" +
          "<span class='vsw-dot" + dotCls + "'></span></button>";
      }).join("");
      return cap + rows;
    }).join("");
    var menu = "<div class='vpop vpop--sw' data-vpop='sw' hidden>" + groups +
      "<div class='vpop-sep'></div><button class='vsw-row vsw-row--add'>" + ic("plus", 15) + "<span class='vsw-who'><span class='vsw-nm'>" + tt.connectProfile + "</span></span></button></div>";
    return "<div class='vsw-wrap'>" + btn + menu + "</div>";
  }

  function themeToggle(lang) {
    return "<button class='vtheme' data-vtheme title='" + t(lang).switchTheme + "'>" + ic("sun", 16) + ic("moon", 16) + "</button>";
  }

  function sidebar(ctx) {
    var lang = ctx.lang, tt = t(lang), r = ctx.r;
    var multi = (r.scope.brands_count || 0) >= 2;
    // Product decision: the dashboard IS the advisor's home — no separate
    // "Агент" nav item. Menu = Дашборд · [Бренды at 2+] · Настройки.
    var rows = navRow("dashboard", "grid", tt.dashboard, true) +
      (multi ? navRow("brands", "layers", tt.brands, false, r.scope.brands_count) : "") +
      navRow("settings", "settings", tt.accSettings, false);
    return "<aside class='vsb'>" +
      "<div class='vsb-brand'><span class='vsb-nib'>" + nib() + "</span><span class='vsb-name'>Pennedly</span></div>" +
      "<div class='vsb-cap'>" + tt.account + "<span class='v-tag v-tester'>" + tt.tester + "</span></div>" +
      "<nav class='vsb-nav'>" + rows + "</nav>" +
      "<div class='vsb-foot'>" + accountBtn(lang) + accountMenu(lang) + "</div>" +
      "</aside>";
  }

  function nib() {
    return "<svg width='16' height='16' viewBox='0 0 512 512' aria-hidden='true'><g fill='currentColor'><g transform='rotate(42 256 256)'><path d='M236 150 Q236 128 256 128 Q276 128 276 150 L276 300 L256 360 L236 300 Z'/><rect x='236' y='206' width='40' height='7'/></g></g></svg>";
  }

  function breadcrumb(ctx) {
    var lang = ctx.lang, tt = t(lang);
    return "<nav class='vcrumb'><span class='vcrumb-seg vcrumb-seg--current'><span class='vcrumb-mono'>" + VK.ACCOUNT.mono + "</span><span class='vcrumb-txt'>" + tt.account + "</span></span></nav>";
  }

  function topbar(ctx) {
    return "<header class='vtop'>" + breadcrumb(ctx) +
      "<div class='vtop-actions'>" + switcher(ctx) + themeToggle(ctx.lang) + "</div></header>";
  }

  // ── mobile chrome ──
  function mobileTop(ctx) {
    var lang = ctx.lang;
    return "<header class='vmtop'>" +
      "<span class='vmtop-brand'><span class='vsb-nib'>" + nib() + "</span>Pennedly</span>" +
      "<div class='vmtop-actions'>" + themeToggle(lang) +
      "<button class='vmtop-acct' data-vpop-btn='macct'><span class='vsb-acct-mono'>" + VK.ACCOUNT.mono + "</span></button>" +
      "<div class='vpop vpop--macct' data-vpop='macct' hidden>" +
      "<div class='vpop-head'><span class='vsb-acct-mono'>" + VK.ACCOUNT.mono + "</span><span class='vsb-acct-who'><span class='vsb-acct-email'>" + VK.ACCOUNT.email + "</span><span class='vsb-acct-plan'>" + VK.ACCOUNT.plan + "</span></span></div>" +
      "<div class='vpop-sep'></div><button class='vpop-row'>" + ic("settings", 16) + t(lang).accSettings + "</button><button class='vpop-row'>" + ic("logout", 16) + t(lang).logout + "</button></div>" +
      "</div></header>";
  }
  function mobileBottom(ctx) {
    var lang = ctx.lang, tt = t(lang), r = ctx.r;
    var multi = (r.scope.brands_count || 0) >= 2;
    function b(icon, label, active) { return "<button class='vmb-item" + (active ? " vmb-item--active" : "") + "'>" + ic(icon, 19) + "<span>" + label + "</span></button>"; }
    // No "Агент" tab — advisor lives on the dashboard (product decision).
    return "<nav class='vmbottom'>" + b("grid", tt.dashboard, true) +
      (multi ? b("layers", tt.brands, false) : b("target", tt.profiles, false)) +
      b("settings", tt.settings, false) + "</nav>";
  }

  // ── main entry: wrap concept body in the shell ──
  function render(bodyHtml, ctx) {
    var minimal = ctx.chrome === "minimal";
    var dk = ctx.dark ? " dark" : " light";
    if (ctx.device === "mobile") {
      return "<div class='vshell vshell--mobile" + (minimal ? " vshell--min" : "") + dk + "' data-theme-root>" +
        mobileTop(ctx) + "<div class='vbody'>" + (ctx.subtop ? ctx.subtop : "") + bodyHtml + "</div>" +
        (minimal ? "" : mobileBottom(ctx)) + "</div>";
    }
    if (minimal) {
      return "<div class='vshell vshell--min" + dk + "' data-theme-root>" +
        "<header class='vtop vtop--min'>" +
        "<span class='vmtop-brand'><span class='vsb-nib'>" + nib() + "</span>Pennedly<span class='v-tag v-tester'>" + t(ctx.lang).tester + "</span></span>" +
        "<div class='vtop-actions'>" + switcher(ctx) + themeToggle(ctx.lang) +
        "<div class='vsw-wrap'>" + accountBtn(ctx.lang) + accountMenu(ctx.lang) + "</div></div></header>" +
        "<div class='vmain vmain--min'><div class='vbody'>" + bodyHtml + "</div></div></div>";
    }
    return "<div class='vshell" + dk + "' data-theme-root>" + sidebar(ctx) +
      "<div class='vmain'>" + topbar(ctx) + "<div class='vbody'>" + bodyHtml + "</div></div></div>";
  }

  // ── network picker (Threads live / LinkedIn soon) — used by add tiles ──
  function picker(lang) {
    var tt = t(lang);
    return "<div class='v-picker'>" +
      "<button class='v-picker-row'><span class='v-picker-mark'>" + VK.netLogo("threads", 20) + "</span>" +
      "<span class='v-picker-txt'><span class='v-picker-name'>Threads</span><span class='v-picker-sub'>" + tt.networkLive + "</span></span>" + ic("arrow-right", 16) + "</button>" +
      "<button class='v-picker-row' aria-disabled='true'><span class='v-picker-mark'>" + VK.netLogo("linkedin", 20) + "</span>" +
      "<span class='v-picker-txt'><span class='v-picker-name'>LinkedIn</span><span class='v-picker-sub'>" + tt.networkSoon + "</span></span>" +
      "<span class='v-picker-soon'>" + tt.networkSoon + "</span></button></div>";
  }

  // ── delegated popover + theme wiring (runs once) ──
  function wire() {
    if (window.__vshellWired) return; window.__vshellWired = true;
    document.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-vpop-btn]");
      var root = e.target.closest(".vshell") || document;
      // close others
      function closeAll(except) {
        (root.querySelectorAll ? root.querySelectorAll("[data-vpop]") : []).forEach(function (p) { if (p !== except) p.hidden = true; });
      }
      if (btn) {
        var name = btn.getAttribute("data-vpop-btn");
        var pop = btn.parentElement.querySelector("[data-vpop='" + name + "']") || root.querySelector("[data-vpop='" + name + "']");
        if (pop) { var willOpen = pop.hidden; closeAll(pop); pop.hidden = !willOpen; e.stopPropagation(); return; }
      }
      var theme = e.target.closest("[data-vtheme]");
      if (theme) {
        var tr = theme.closest("[data-theme-root]") || theme.closest(".pg-stage") || theme.closest(".vframe");
        if (tr) tr.classList.toggle("dark");
        e.stopPropagation(); return;
      }
      if (!e.target.closest("[data-vpop]")) closeAll(null);
    });
  }

  window.VSHELL = { render: render, picker: picker, switcher: switcher, wire: wire, nib: nib, sidebar: sidebar, accountMenu: accountMenu, topbar: topbar };
  if (document.readyState !== "loading") wire(); else document.addEventListener("DOMContentLoaded", wire);
})();
