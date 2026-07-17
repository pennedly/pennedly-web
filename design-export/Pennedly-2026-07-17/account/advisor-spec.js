/* account/advisor-spec.js — populates Account-Advisor-SPEC.html (desktop).
   Product decision C: the advisor chat is a DEEP screen reached ONLY from the
   dashboard (ask row / starter / «Открыть советника»), never from a menu — the
   «Советник» nav item is gone. So the chat keeps its exact body (account-screens.js
   .adv-* vocabulary — NO redesign) but swaps the old «Советник»-active sidebar
   chrome for a focused deep-screen header with «← Дашборд аккаунта» and opens
   SEEDED with the first question. */
(function () {
  "use strict";
  var A = window.ACCT, ACC = window.ACC, X = window.ACCX;
  var L = A.L, ic = ACC.ic;
  var LANG = "ru";

  function head(label, dark) { return "<div class='fr-head'><span class='dh" + (dark ? " dh--dark" : "") + "'></span>" + label + "</div>"; }
  function frame(inner, dark, cls) { return "<div class='frame" + (dark ? " dark" : "") + (cls ? " " + cls : "") + "'>" + inner + "</div>"; }
  function col(label, inner, dark, cls) { return "<div class='fr'>" + head(label, dark) + frame(inner, dark, cls) + "</div>"; }
  function rowOf(a, b) { return "<div class='frow'>" + a + b + "</div>"; }
  function stack() { return Array.prototype.join.call(arguments, ""); }

  /* ── the deep-screen back header (V3-consistent «← Дашборд аккаунта») ── */
  function backHeader(lang, dark) {
    var t = A.T[lang] || A.T.ru;
    var back = "<a class='acc-back' title='" + t.navBackDash + "'><span class='acc-back-arrow'>" + X.xic("arrow-left", 15) + "</span>" + ACC.acctMark() + t.navBackDash + "</a>";
    var pill = "<span class='status-pill status-pill--accent'>" + ic("sparkle", 13) + t.advPill + "</span>";
    var theme = "<span class='acc-ib'>" + ic(dark ? "sun" : "moon", 16) + "</span>";
    return "<div class='acc-top acc-adv-deephead'>" + back +
      "<div class='acc-top-actions'>" + pill + theme + "</div></div>";
  }

  /* ── full deep screen: back header + the (unchanged) chat body ── */
  function deepScreen(lang, dark, state, seededTag) {
    var chat = X.advisorChat(lang, { state: state || "ready", mode: "single_brand" });
    if (seededTag) {
      // annotate the first user bubble as seeded-from-dashboard (doc-only cue)
      chat = chat.replace("<div class='adv-row adv-row--user'>",
        "<div class='adv-seedtag'>" + X.xic("arrow-left", 12) + (A.T[lang] || A.T.ru).__seed + "</div><div class='adv-row adv-row--user'>");
    }
    return "<div class='acc-adv-deep" + (dark ? " dark" : "") + "'>" + backHeader(lang, dark) + chat + "</div>";
  }

  // seed caption string (added to T at runtime so both locales render)
  A.T.ru.__seed = "Засеяно с дашборда"; A.T.de.__seed = "Vom Dashboard übernommen";

  /* ── §2 full screen (seeded → answered), light + dark ── */
  X.set("f-screen", stack(
    col("Светлая · вход с дашборда, открыто засеянным вопросом", deepScreen(LANG, false, "ready", true), false, "frame--pad14"),
    col("Тёмная · то же", deepScreen(LANG, true, "ready", true), true, "frame--pad14")
  ));

  /* ── §3 back header anatomy ── */
  X.set("f-back", rowOf(
    col("Светлая · «← Дашборд аккаунта» + pill «На основе всего портфеля»", "<div style='padding:2px'>" + backHeader(LANG, false) + "</div>", false, "frame--pad14"),
    col("Тёмная · то же", "<div style='padding:2px'>" + backHeader(LANG, true) + "</div>", true, "frame--pad14")
  ));

  /* ── §4 opens seeded — arrival moment (seeded Q + advisor thinking) ── */
  X.set("f-seeded", stack(
    col("Светлая · момент входа: засеянный вопрос + советник генерирует", deepScreen(LANG, false, "thinking", true), false, "frame--pad14"),
    col("Тёмная · то же", deepScreen(LANG, true, "thinking", true), true, "frame--pad14")
  ));

  /* ── §5 pinned verdict ── */
  X.set("f-pinned", rowOf(
    col("Светлая · закреплённый вердикт (та же сводка, что на дашборде)", X.chatPinned(LANG, "single_brand"), false, "frame--pad0"),
    col("Тёмная · 2+ брендов", X.chatPinned(LANG, "multi_brand"), true, "frame--pad0")
  ));

  /* ── §6 answer anatomy ── */
  var CH = A.ADVISOR_CHAT.single_brand;
  X.set("f-turn", stack(
    col("Светлая · реплика + ответ (проза + чипы + «На основе:» + подсказка «Открыть в Студии»)", "<div class='adv-thread'>" + X.userMsg(L(CH.turns[0].q, LANG)) + X.aiMsg(LANG, X.aiTurn(LANG, CH.turns[0])) + "</div>", false),
    col("Тёмная · второй ход", "<div class='adv-thread'>" + X.userMsg(L(CH.turns[1].q, LANG)) + X.aiMsg(LANG, X.aiTurn(LANG, CH.turns[1])) + "</div>", true)
  ));

  /* ── §7 states ── */
  X.set("f-states", stack(
    rowOf(
      col("Светлая · засеяно → ответ (ready)", deepScreen(LANG, false, "ready", true), false, "frame--pad14"),
      col("Тёмная · генерация (thinking)", deepScreen(LANG, true, "thinking", true), true, "frame--pad14")
    ),
    rowOf(
      col("Светлая · тонкие данные (честно)", deepScreen(LANG, false, "thin", true), false, "frame--pad14"),
      col("Тёмная · error + Retry (inline)", deepScreen(LANG, true, "error", true), true, "frame--pad14")
    )
  ));

  /* ── §9 german ── */
  X.set("f-german", col("Немецкий · светлая · вход с дашборда, засеяно", deepScreen("de", false, "ready", true), false, "frame--pad14"));
})();
