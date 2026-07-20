/* account-screens-mobile.js — PHONE builders for the account-level screens.
   Depends on account-data.js (ACCT), account-desktop.js (ACC), account-screens.js
   (ACCX — the message vocabulary & settings cards are reused verbatim) and
   mobile/mock.js (MOCK — device shell). window.MACCX.* is called from the two
   mobile specs. Settings reuse ACCX.settingsBody; only the chat needs phone
   chrome (pinned verdict + docked composer). */
(function () {
  const C = window.ACCT;
  const ACC = window.ACC;
  const X = window.ACCX;
  const M = window.MOCK;
  const L = C.L;
  const T = (lang) => C.T[lang] || C.T.ru;

  // pinned portfolio verdict (mobile) — same summary as the dashboard advisor card
  function pinned(lang, mode) {
    var t = T(lang); var a = C.ADVISOR[mode] || C.ADVISOR.single_brand;
    var chips = a.chips.map(function (c) { return X.chatChip(c, lang); }).join("");
    return "<div class='ma-chat-pinned'>"
      + "<div class='ma-chat-pinned-cap'><span class='ma-chat-pinned-mark'>" + ACC.ic("sparkle", 14) + "</span><span class='ma-chat-pinned-caplab'>" + t.advPinnedCap + "</span><span class='ma-chat-pinned-scope'>" + t.advChatScope + "</span></div>"
      + "<div class='ma-chat-pinned-verdict'>" + L(a.verdict, lang) + "</div>"
      + "<div class='ma-chat-pinned-chips'>" + chips + "</div></div>";
  }

  // scroll body: pinned verdict (always) + thread/hero for the state
  function advisorBody(lang, opts) {
    opts = opts || {}; var mode = opts.mode || "single_brand"; var state = opts.state || "ready";
    var ch = C.ADVISOR_CHAT[mode] || C.ADVISOR_CHAT.single_brand;
    var thread;
    if (state === "empty") thread = "<div class='ma-chat-thread'>" + X.heroEmpty(lang, mode) + "</div>";
    else if (state === "thinking") thread = "<div class='ma-chat-thread'>" + X.userMsg(L(ch.turns[1].q, lang)) + X.thinking(lang) + "</div>";
    else if (state === "thin") thread = "<div class='ma-chat-thread'>" + X.userMsg(L(ch.starters[2].text, lang)) + X.thinRow(lang) + "</div>";
    else if (state === "error") thread = "<div class='ma-chat-thread'>" + X.userMsg(L(ch.turns[0].q, lang)) + X.errorRow(lang) + "</div>";
    else thread = "<div class='ma-chat-thread'>"
      + X.userMsg(L(ch.turns[0].q, lang)) + X.aiMsg(lang, X.aiTurn(lang, ch.turns[0]))
      + X.userMsg(L(ch.turns[1].q, lang)) + X.aiMsg(lang, X.aiTurn(lang, ch.turns[1])) + "</div>";
    return "<div class='ma' style='display:block'>" + pinned(lang, mode) + thread + "</div>";
  }

  // docked composer (pass as the phone `overlay`)
  function advisorDock(lang, opts) {
    opts = opts || {};
    return "<div class='ma-chat-dock'>" + X.composer(lang, opts.state === "thinking") + "</div>";
  }

  // top bars
  function advisorTop(lang, opts) {
    opts = opts || {};
    // short title on the phone (title + pill would overflow at 390); the pinned
    // verdict's scope line carries "portfolio" context instead.
    return M.top({ title: T(lang).navAdvisor, menu: true, back: opts.back });
  }
  function settingsTop(lang, opts) {
    opts = opts || {};
    return M.top({ title: T(lang).setTitle, menu: true, back: opts.back });
  }

  // settings body — reuse the desktop cards (container-query responsive), no big head
  function settingsBody(lang, opts) {
    opts = opts || {};
    return X.settingsBody(lang, Object.assign({ noHead: true }, opts));
  }

  function set(id, html) { var e = document.getElementById(id); if (e) e.innerHTML = html; }

  window.MACCX = {
    pinned, advisorBody, advisorDock, advisorTop, settingsTop, settingsBody, set,
  };
})();
