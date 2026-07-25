/* account/empty-mobile-spec.js — populates Account-Dashboard-Empty-Mobile-SPEC.html.
   The V3 all-off state in the MOBILE shell, proven to 320. */
(function () {
  "use strict";
  var VK = window.VK, V3 = window.V3, SK = window.SK;
  var L = "ru";
  var rOff = VK.resolve("all_off");

  function grid(h) { return "<div class='v3-ev-grid'>" + h + "</div>"; }
  function mbody(inner, dark, w) {
    w = w || 340;
    return "<div class='vshell " + (dark ? "dark" : "light") + "' data-theme-root " +
      "style='display:block;border:1px solid var(--color-border);border-radius:16px;min-height:0;width:" + w + "px;max-width:100%'>" +
      "<div class='vbody' style='padding:14px'>" + inner + "</div></div>";
  }
  function mcol(label, inner, dark) {
    return "<div class='phonecol'><div class='w'>" + label + "</div>" + inner + "</div>";
  }

  /* ── §3 full phone (light + dark) ── */
  SK.set("f-screen", "<div class='frame frame--phones'>" +
    SK.phoneCol("Светлая · 390", { scn: "all_off", lang: L }, 390) +
    SK.phoneCol("Тёмная · 390", { scn: "all_off", lang: L, dark: true }, 390) +
    "</div>");

  /* ── §4 reconnect card + connect-more tile ── */
  SK.set("f-cards", "<div class='frame frame--phones'>" +
    mcol("Отключённый профиль + «Переподключить»", mbody(grid(V3.evCardProfile(VK.profile("mara_off"), L)), false)) +
    mcol("Плитка «Подключить ещё аккаунт»", mbody(grid(V3.addTile(rOff, L)), true), true) +
    mcol("Тоталы «—» (без выдуманных метрик)", mbody(V3.totalsBar(rOff, L), false)) +
    "</div>");

  /* ── §5 widths 390 · 360 · 320 ── */
  SK.set("f-widths", "<div class='frame frame--phones'>" +
    SK.phoneCol("390", { scn: "all_off", lang: L }, 390) +
    SK.phoneCol("360", { scn: "all_off", lang: L }, 360) +
    SK.phoneCol("320 · нижний предел", { scn: "all_off", lang: L }, 320) +
    "</div>");

  /* ── §6 german at 390 · 320 ── */
  SK.set("f-german", "<div class='frame frame--phones'>" +
    SK.phoneCol("Немецкий · 390", { scn: "all_off", lang: "de" }, 390) +
    SK.phoneCol("Немецкий · 320 · тёмная", { scn: "all_off", lang: "de", dark: true }, 320) +
    "</div>");

  /* ── §2 playground ── */
  SK.playground({
    stageId: "pg-stage",
    state: { lang: "ru", dark: false },
    segs: [{ id: "pg-lang", key: "lang" }],
    toggles: [{ id: "pg-dark", key: "dark" }],
    render: function (s) { return SK.phone({ scn: "all_off", lang: s.lang, dark: s.dark }, 390); },
  });
})();
