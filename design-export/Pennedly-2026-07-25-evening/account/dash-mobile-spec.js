/* account/dash-mobile-spec.js — populates Account-Dashboard-Mobile-SPEC.html.
   Real account/v3.js output in the MOBILE shell (device:"mobile" → 390px chrome
   with top bar + bottom bar, no «Агент» tab). Proves Rule 1 down to 320. */
(function () {
  "use strict";
  var VK = window.VK, V3 = window.V3, SK = window.SK;
  var L = "ru";

  function stack() { return Array.prototype.join.call(arguments, ""); }
  function p(key) { return VK.profile(key); }
  function grid(cardsHtml) { return "<div class='v3-ev-grid'>" + cardsHtml + "</div>"; }
  function novoice() { return Object.assign({}, VK.PROFILES.studio, { has_voice: false }); }

  /* body-only render inside a mobile-width vbody so @container hits mobile rules */
  function mbody(inner, dark, w) {
    w = w || 340;
    return "<div class='vshell " + (dark ? "dark" : "light") + "' data-theme-root " +
      "style='display:block;border:1px solid var(--color-border);border-radius:16px;min-height:0;width:" + w + "px;max-width:100%'>" +
      "<div class='vbody' style='padding:14px'>" + inner + "</div></div>";
  }
  function mcol(label, inner, dark) {
    return "<div class='phonecol'><div class='w'>" + label + "</div>" + inner + "</div>";
  }

  /* ── §3 full screen (light + dark phones) ── */
  SK.set("f-screen", "<div class='frame frame--phones'>" +
    SK.phoneCol("Светлая · 390", { scn: "two_brands", lang: L }, 390) +
    SK.phoneCol("Тёмная · 390", { scn: "two_brands", lang: L, dark: true }, 390) +
    "</div>");

  /* ── §4 chrome: top bar + bottom bar (no «Агент» tab) + account sheet ── */
  SK.set("f-chrome", "<div class='frame frame--phones'>" +
    SK.phoneCol("Нижний бар: Дашборд · Бренды · Настройки — без «Агента»", { scn: "two_brands", lang: L }, 390) +
    SK.phoneCol("1 бренд → «Профили» вместо «Бренды»", { scn: "single_brand", lang: L, dark: true }, 390) +
    "</div>");

  /* ── §5 thin (204) ── */
  SK.set("f-thin", "<div class='frame frame--phones'>" +
    SK.phoneCol("Светлая · 204 → приглашение + стартеры", { scn: "one_profile", lang: L }, 390) +
    SK.phoneCol("Тёмная · то же", { scn: "one_profile", lang: L, dark: true }, 390) +
    "</div>");

  /* ── §6 evidence: totals 2×2 + channels stacked ── */
  var rTwo = VK.resolve("two_brands");
  SK.set("f-evidence", "<div class='frame frame--phones'>" +
    mcol("Светлая · тоталы 2×2 + каналы столбиком", mbody(V3.evidence(rTwo, L), false), false) +
    mcol("Тёмная · то же", mbody(V3.evidence(rTwo, L), true, 340), true) +
    "</div>");

  /* ── §7 profile cards + statuses ── */
  SK.set("f-cards", "<div class='frame frame--phones'>" +
    mcol("synced · голос", mbody(grid(V3.evCardProfile(p("mara"), L)), false)) +
    mcol("«Настроить голос»", mbody(grid(V3.evCardProfile(novoice(), L)), true), true) +
    mcol("importing", mbody(grid(V3.evCardProfile(p("notes"), L)), false)) +
    mcol("sync-error + «Повторить»", mbody(grid(V3.evCardProfile(p("co"), L)), true), true) +
    mcol("disconnected + «Переподключить»", mbody(grid(V3.evCardProfile(p("old"), L)), false)) +
    "</div>");

  /* ── §8 brand cards + expansion ── */
  SK.set("f-brands", "<div class='frame frame--phones'>" +
    mcol("Бренд свёрнут · «1 сбой синка»", mbody(grid(V3.evCardBrand(VK.BRANDS.field, L, {})), false)) +
    mcol("Развёрнут · sync-error + disconnected внутри", mbody(grid(V3.evCardBrand(VK.BRANDS.field, L, { expanded: true })), true), true) +
    "</div>");

  /* ── §9 all states ── */
  SK.set("f-states", "<div class='frame frame--phones'>" +
    SK.phoneCol("1 бренд · 1 профиль (новый)", { scn: "one_profile", lang: L }, 390) +
    SK.phoneCol("2+ брендов · Field развёрнут (смешанное)", { scn: "two_brands", lang: L, expand: "field" }, 390) +
    SK.phoneCol("Загрузка (скелет)", { scn: "loading", lang: L, dark: true }, 390) +
    "</div>");

  /* ── §10 Rule 1: 390 · 360 · 320 ── */
  SK.set("f-widths", "<div class='frame frame--phones'>" +
    SK.phoneCol("390", { scn: "two_brands", lang: L, expand: "field" }, 390) +
    SK.phoneCol("360", { scn: "two_brands", lang: L, expand: "field" }, 360) +
    SK.phoneCol("320 · нижний предел", { scn: "two_brands", lang: L, expand: "field" }, 320) +
    "</div>");

  /* ── §11 german at 390 · 320 ── */
  SK.set("f-german", "<div class='frame frame--phones'>" +
    SK.phoneCol("Немецкий · 390", { scn: "two_brands", lang: "de", expand: "field" }, 390) +
    SK.phoneCol("Немецкий · 320", { scn: "two_brands", lang: "de", expand: "field" }, 320) +
    SK.phoneCol("Немецкий · 320 · тёмная", { scn: "two_brands", lang: "de", dark: true, expand: "field" }, 320) +
    "</div>");

  /* ── §2 live playground (phone) ── */
  function pgRender(s) {
    if (s.phase === "loading") return SK.phone({ scn: "loading", lang: s.lang, dark: s.dark }, 390);
    var expand = (s.mode === "two_brands" && s.expand) ? "field" : undefined;
    return SK.phone({ scn: s.mode, lang: s.lang, dark: s.dark, advisor: s.adv, expand: expand }, 390);
  }
  SK.playground({
    stageId: "pg-stage",
    state: { mode: "two_brands", adv: "verdict", phase: "ready", lang: "ru", dark: false, expand: false },
    segs: [
      { id: "pg-mode", key: "mode" }, { id: "pg-adv", key: "adv" },
      { id: "pg-state", key: "phase" }, { id: "pg-lang", key: "lang" },
    ],
    toggles: [{ id: "pg-dark", key: "dark" }, { id: "pg-expand", key: "expand" }],
    onChange: function (s) {
      var canExpand = s.mode === "two_brands" && s.phase !== "loading";
      var w = document.getElementById("pg-expand-wrap");
      if (w) w.classList.toggle("dis", !canExpand);
    },
    render: pgRender,
  });
})();
