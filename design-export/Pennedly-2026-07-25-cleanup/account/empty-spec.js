/* account/empty-spec.js — populates Account-Dashboard-Empty-SPEC.html (desktop).
   The V3 "all profiles disconnected" state: portfolio ALIVE, full chrome, each
   ex-profile a card with «Переподключить» + a «Подключить ещё аккаунт» tile.
   Real account/v3.js output (scenario all_off). Anti-"logged out", NOT a wizard. */
(function () {
  "use strict";
  var VK = window.VK, V3 = window.V3, SK = window.SK;
  var L = "ru";
  var rOff = VK.resolve("all_off");

  function stack() { return Array.prototype.join.call(arguments, ""); }
  function grid(h) { return "<div class='v3-ev-grid'>" + h + "</div>"; }
  function piece(inner, dark) {
    return "<div class='vshell " + (dark ? "dark" : "light") + "' data-theme-root " +
      "style='display:block;border:none;min-height:0;background:transparent'>" +
      "<div class='vbody' style='padding:0'>" + inner + "</div></div>";
  }
  function narrow(w, opts) {
    var ctx = SK.ctxOf(opts);
    return "<div class='ruler'>vbody <b>" + w + "px</b></div>" +
      "<div class='vshell " + (opts.dark ? "dark" : "light") + "' data-theme-root " +
      "style='display:block;border:1px solid var(--color-border);border-radius:14px;min-height:0;width:" + w + "px;max-width:100%'>" +
      "<div class='vbody'>" + V3.render(ctx) + "</div></div>";
  }

  /* ── §3 full screen ── */
  SK.set("f-screen", stack(
    SK.col("Светлая · все профили отключены (портфель жив, полный хром)", SK.stage({ scn: "all_off", lang: L }), false, "frame--pad14"),
    SK.col("Тёмная · то же", SK.stage({ scn: "all_off", lang: L, dark: true }), true, "frame--pad14")
  ));

  /* ── §4 honest advisor hero ── */
  SK.set("f-hero", stack(
    SK.col("Светлая · честное приглашение (без выдуманного вердикта)", piece(V3.thinHero(rOff, L)), false),
    SK.col("Тёмная · то же", piece(V3.thinHero(rOff, L), true), true)
  ));

  /* ── §5 totals show «—» (honesty rule) ── */
  SK.set("f-totals", stack(
    SK.col("Светлая · нет чисел → «—», ответы 0 (не выдуманные метрики)", piece(V3.totalsBar(rOff, L)), false),
    SK.col("Тёмная · то же", piece(V3.totalsBar(rOff, L), true), true)
  ));

  /* ── §6 reconnect card + connect-more tile ── */
  SK.set("f-cards", SK.rowOf(
    SK.col("Светлая · карточка отключённого профиля + «Переподключить»", piece(grid(V3.evCardProfile(VK.profile("mara_off"), L))), false),
    SK.col("Тёмная · плитка «Подключить ещё аккаунт»", piece(grid(V3.addTile(rOff, L)), true), true)
  ));

  /* ── §7 narrow + german ── */
  SK.set("f-narrow", SK.rowOf(
    SK.col("Светлая · vbody 560", narrow(560, { scn: "all_off", lang: L }), false, "frame--narrow"),
    SK.col("Немецкий · тёмная · vbody 560", narrow(560, { scn: "all_off", lang: "de", dark: true }), true, "frame--narrow")
  ));

  /* ── §2 playground (locale · theme on the all-off state) ── */
  SK.playground({
    stageId: "pg-stage",
    state: { lang: "ru", dark: false },
    segs: [{ id: "pg-lang", key: "lang" }],
    toggles: [{ id: "pg-dark", key: "dark" }],
    render: function (s) { return SK.stage({ scn: "all_off", lang: s.lang, dark: s.dark }); },
  });
})();
