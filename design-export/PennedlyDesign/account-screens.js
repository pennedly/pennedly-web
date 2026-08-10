/* account-screens.js — DESKTOP builders for the account-level screens that live
   in the account-dashboard chrome: Account Settings (/app/account/settings) and
   the Portfolio Advisor chat (/app/account/advisor), plus the Account ↔ Profile
   navigation controls (#7). Depends on account-data.js (window.ACCT) and
   account-desktop.js (window.ACC — reuses ic/acctMark/avatar/sidebar/crumb).
   Returns HTML strings on the live DS layer (account-screens.css on
   account.css on ds/tokens.css). window.ACCX.* is called from the specs. */
(function () {
  const C = window.ACCT;
  const ACC = window.ACC;
  const L = C.L;
  const T = (lang) => C.T[lang] || C.T.ru;
  const ic = ACC.ic; // shared account icon set

  // extra glyphs the settings/advisor screens need (superset of ACC.ic)
  const XP = {
    download: "<path d='M12 3v11'/><path d='M8 10.5l4 4 4-4'/><path d='M5 20h14'/>",
    trash: "<path d='M4 7h16'/><path d='M9.5 7V5.2A1.2 1.2 0 0 1 10.7 4h2.6a1.2 1.2 0 0 1 1.2 1.2V7'/><path d='M6.6 7l.9 12.1A1 1 0 0 0 8.5 20h7a1 1 0 0 0 1-.9L17.4 7'/>",
    mail: "<rect x='3' y='5.5' width='18' height='13' rx='2'/><path d='M4 7l8 5.5L20 7'/>",
    user: "<circle cx='12' cy='8' r='3.4'/><path d='M5.5 19.5a6.5 6.5 0 0 1 13 0'/>",
    star: "<path d='M12 4.2l2.3 4.9 5.3.5-4 3.6 1.2 5.2L12 15.8 7.2 18.4l1.2-5.2-4-3.6 5.3-.5z'/>",
    external: "<path d='M14 5h5v5'/><path d='M19 5l-8 8'/><path d='M11 6H6.5A1.5 1.5 0 0 0 5 7.5v10A1.5 1.5 0 0 0 6.5 19h10A1.5 1.5 0 0 0 18 17.5V13'/>",
    clock: "<circle cx='12' cy='12' r='8.5'/><path d='M12 7.5V12l3 2'/>",
    shield: "<path d='M12 3.2l7 2.8v5c0 4.4-3 7.8-7 9.8-4-2-7-5.4-7-9.8V6z'/>",
    globe: "<circle cx='12' cy='12' r='8.5'/><path d='M3.5 12h17M12 3.5c2.5 2.2 2.5 14.8 0 17M12 3.5c-2.5 2.2-2.5 14.8 0 17'/>",
    "arrow-left": "<path d='M19 12H5M11 6l-6 6 6 6'/>",
    copy: "<rect x='9' y='9' width='11' height='11' rx='2'/><path d='M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3'/>",
    key: "<circle cx='8' cy='16' r='4'/><path d='M11 13 20 4'/><path d='M15.5 8.5 18 11'/>",
  };
  function xic(n, s) {
    s = s || 14;
    if (XP[n]) return "<svg width='" + s + "' height='" + s + "' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'>" + XP[n] + "</svg>";
    return ic(n, s);
  }

  // ═══════════════════ chrome: breadcrumb · topbar · shell ═══════════════════
  // segs: [{type:'account'|'brand'|'profile'|'page', label, mono?, profile?, current?}]
  function crumb(lang, segs) {
    var html = segs.map(function (s, i) {
      var lead = s.type === "account" ? ACC.acctMark()
        : s.type === "brand" ? "<span class='acc-brandmark'>" + s.mono + "</span>"
        : s.type === "profile" ? ACC.avatar(s.profile, "acc-av")
        : ""; // 'page' → text only
      var seg = "<a class='acc-crumb-seg" + (s.current ? " acc-crumb-seg--current" : "") + "'>" + lead + "<span class='acc-crumb-txt'>" + s.label + "</span></a>";
      return (i ? "<span class='acc-crumb-sep'>" + ic("chev-right", 14) + "</span>" : "") + seg;
    }).join("");
    return "<nav class='acc-crumb'>" + html + "</nav>";
  }

  function topbar(lang, opts) {
    opts = opts || {};
    var pill = opts.pill ? "<span class='status-pill status-pill--accent'>" + ic("sparkle", 13) + opts.pill + "</span>" : "";
    var actions = "<div class='acc-top-actions'>" + pill + (opts.actions || "") + "<span class='acc-ib'>" + ic(opts.dark ? "sun" : "moon", 16) + "</span></div>";
    return "<div class='acc-top'>" + crumb(lang, opts.crumbSegs || []) + actions + "</div>";
  }

  // full account shell: account sidebar (active row) + main column (topbar + body)
  function shell(lang, opts) {
    opts = opts || {};
    var totals = C.TOTALS[opts.mode || "single_brand"] || C.TOTALS.single_brand;
    var brandsCount = opts.brandsCount != null ? opts.brandsCount : totals.brands_count;
    var sb = ACC.sidebar(lang, { active: opts.active, brandsCount: brandsCount });
    var top = topbar(lang, { crumbSegs: opts.crumbSegs, pill: opts.pill, actions: opts.actions, dark: opts.dark });
    return "<div class='acc-shell'>" + sb
      + "<div class='acc-mainwrap' style='min-width:0;display:flex;flex-direction:column;gap:18px'>" + top + (opts.body || "") + "</div></div>";
  }

  // ═══════════════════ Account ↔ Profile navigation (#7) ═══════════════════
  // "Back to account dashboard" — pill (topbar) or sidebar row placements.
  function backButton(lang) {
    var t = T(lang);
    return "<a class='acc-back' title='" + t.navBackDash + "'><span class='acc-back-arrow'>" + xic("arrow-left", 15) + "</span>" + ACC.acctMark() + t.navBackShort + "</a>";
  }
  function backRow(lang) {
    var t = T(lang);
    return "<a class='acc-backrow'><span class='acc-back-arrow'>" + xic("arrow-left", 16) + "</span>" + ACC.acctMark()
      + "<span class='acc-backrow-txt'><span class='acc-backrow-t'>" + t.navBackShort + "</span><span class='acc-backrow-s'>" + t.navBackDash + "</span></span></a>";
  }

  // ═══════════════════ Account Settings ═══════════════════
  function card2(h, d, body, danger, headAction) {
    return "<section class='acc-card2" + (danger ? " acc-card2--danger" : "") + "'>"
      + "<div class='acc-card2-head'><div class='acc-card2-headrow'><div class='acc-card2-h'>" + h + "</div>" + (headAction || "") + "</div>" + (d ? "<div class='acc-card2-d'>" + d + "</div>" : "") + "</div>"
      + "<div class='acc-card2-body'>" + body + "</div></section>";
  }

  function settingsAccountCard(lang) {
    var t = T(lang);
    var id = "<div class='acc-set-id'>" + ACC.acctMark()
      + "<div class='acc-set-id-who'><div class='acc-set-id-nm'>" + C.ACCOUNT.name + "</div><div class='acc-set-id-em'>" + C.ACCOUNT.email + "</div></div>"
      + "<span class='acc-plan-badge'>" + xic("star", 13) + C.ACCOUNT.plan + "</span></div>";
    var nameField = "<div class='acc-set-field'><label class='field-label'>" + t.setName + "</label>"
      + "<input class='field' value='" + C.ACCOUNT.name + "' aria-label='" + t.setName + "'/>"
      + "<div class='field-hint'>" + t.setNameHint + "</div></div>";
    var rows = "<div class='acc-set-rows'>"
      + "<div class='acc-set-row'><span class='sr-k'>" + xic("mail", 15) + t.setEmail + "</span><span class='sr-v mono'>" + C.ACCOUNT.email + "</span></div>"
      + "<div class='acc-set-row'><span class='sr-k'>" + xic("star", 15) + t.setPlan + "</span><span class='sr-v'>" + C.ACCOUNT.plan + " · " + t.planNote + "</span></div>"
      + "</div>";
    return card2(t.setAccountCap, null, id + nameField + rows);
  }

  function settingsLangCard(lang, activeCode) {
    var t = T(lang);
    var grid = C.LOCALE_NAMES.map(function (l) {
      var active = l.code === (activeCode || "RU");
      return "<button class='acc-lang" + (active ? " acc-lang--active" : "") + "' role='radio' aria-checked='" + (active ? "true" : "false") + "'>"
        + "<span class='acc-lang-code'>" + l.code + "</span>"
        + "<span class='acc-lang-txt'><span class='acc-lang-nm'>" + l.native + "</span><span class='acc-lang-rg'>" + L(l, lang) + "</span></span>"
        + "<span class='acc-lang-tick'>" + ic("check", 16) + "</span></button>";
    }).join("");
    return card2(t.setLangCap, t.setLangHint, "<div class='acc-langgrid' role='radiogroup'>" + grid + "</div>");
  }

  function settingsDataCard(lang, state) {
    var t = T(lang); state = state || "idle";
    var act, note;
    if (state === "preparing") {
      act = "<span class='acc-export-state'><span class='spinner'></span>" + t.exportPreparing + "</span>";
      note = t.exportPrepNote;
    } else if (state === "ready") {
      act = "<span style='display:inline-flex;align-items:center;gap:11px'><span class='acc-export-ready'>" + xic("check", 15) + t.exportReady + "</span><button class='btn btn--secondary btn--sm'>" + xic("download", 15) + t.exportDownload + "</button></span>";
      note = t.exportReadyNote;
    } else {
      act = "<button class='btn btn--secondary btn--sm'>" + xic("download", 15) + t.exportBtn + "</button>";
      note = t.exportS;
    }
    var row = "<div class='acc-actionrow'><span class='acc-actionrow-ico'>" + xic("download", 18) + "</span>"
      + "<div class='acc-actionrow-txt'><div class='acc-actionrow-t'>" + t.exportT + "<span class='acc-endpoint'><b>GET</b> /api/me/export</span></div>"
      + "<div class='acc-actionrow-s'>" + note + "</div></div>"
      + "<span class='acc-actionrow-act'>" + act + "</span></div>";
    return card2(t.setDataCap, null, row);
  }

  function settingsDangerCard(lang, state) {
    var t = T(lang); state = state || "idle";
    var btn = state === "idle" ? "<span class='acc-actionrow-act'><button class='btn btn--danger btn--sm'>" + xic("trash", 15) + t.deleteBtn + "</button></span>" : "";
    var row = "<div class='acc-actionrow'><span class='acc-actionrow-ico acc-actionrow-ico--danger'>" + xic("trash", 18) + "</span>"
      + "<div class='acc-actionrow-txt'><div class='acc-actionrow-t'>" + t.deleteT + "<span class='acc-endpoint'><b>DELETE</b> /api/me</span></div>"
      + "<div class='acc-actionrow-s'>" + t.deleteS + "</div></div>" + btn + "</div>";
    var extra = "";
    if (state === "confirm") {
      extra = "<div class='acc-del-confirm'><div class='acc-del-confirm-t'>" + t.deleteConfirmT + "</div><div class='acc-del-confirm-s'>" + t.deleteConfirmS + "</div>"
        + "<div class='acc-del-type'><div class='acc-del-type-lab'>" + t.deleteTypeLab + " <b>" + t.deleteTypeWord + "</b></div><input class='field field--error' placeholder='" + t.deleteTypeWord + "' aria-label='" + t.deleteTypeLab + " " + t.deleteTypeWord + "'/></div>"
        + "<div class='acc-del-actions'><button class='btn btn--ghost btn--sm'>" + t.deleteCancel + "</button><button class='btn btn--danger btn--sm'>" + xic("trash", 15) + t.deleteGo + "</button></div></div>";
    } else if (state === "deleting") {
      extra = "<div class='acc-deleting'><span class='spinner'></span><div><div class='acc-deleting-t'>" + t.deleting + "</div><div class='acc-deleting-s'>" + t.deletingNote + "</div></div></div>";
    }
    return card2(t.dangerCap, null, row + extra, true);
  }

  function scopeBadge(t, scope) {
    return "<span class='acc-scope-badge acc-scope-badge--" + scope + "'>" + (scope === "write" ? t.mcpScopeWrite : t.mcpScopeRead) + "</span>";
  }
  function mcpRow(lang, tok, confirmId) {
    var t = T(lang);
    var revoked = !!tok.revoked;
    var meta = "<span>" + L(tok.created, lang) + "</span><span class='dot'></span><span>"
      + (revoked ? L(tok.revokedOn, lang) : (tok.lastUsed ? t.mcpLastUsed + " " + L(tok.lastUsed, lang) : t.mcpNeverUsed)) + "</span>";
    var act = revoked ? "" : "<span class='acc-mcp-act'><button class='btn btn--ghost btn--sm'>" + t.mcpRevokeBtn + "</button></span>";
    var row = "<div class='acc-mcp-row" + (revoked ? " acc-mcp-row--revoked" : "") + "'>"
      + "<span class='acc-mcp-ico'>" + xic("key", 17) + "</span>"
      + "<div class='acc-mcp-body'><div class='acc-mcp-name-row'><span class='acc-mcp-name'>" + tok.name + "</span>"
      + (revoked ? "<span class='acc-revoked-badge'>" + t.mcpRevokedBadge + "</span>" : scopeBadge(t, tok.scope))
      + "</div><div class='acc-mcp-meta'>" + meta + "</div></div>" + act + "</div>";
    if (confirmId === tok.id) {
      row += "<div class='acc-mcp-revoke-confirm'><div class='acc-mcp-revoke-confirm-t'>" + t.mcpRevokeConfirmT + "</div>"
        + "<div class='acc-mcp-revoke-confirm-s'>" + t.mcpRevokeConfirmS + "</div>"
        + "<div class='acc-mcp-revoke-confirm-act'><button class='btn btn--ghost btn--sm'>" + t.mcpRevokeCancel + "</button><button class='btn btn--danger btn--sm'>" + xic("trash", 15) + t.mcpRevokeGo + "</button></div></div>";
    }
    return row;
  }
  function mcpList(lang, tokens, confirmId) {
    var t = T(lang);
    if (!tokens || !tokens.length) return "<div class='acc-mcp-empty'><div class='acc-mcp-empty-t'>" + t.mcpEmptyT + "</div><div class='acc-mcp-empty-s'>" + t.mcpEmptyS + "</div></div>";
    return "<div class='acc-mcp-list'>" + tokens.map(function (tok) { return mcpRow(lang, tok, confirmId); }).join("") + "</div>";
  }
  function mcpForm(lang) {
    var t = T(lang);
    return "<div class='acc-mcp-form'>"
      + "<div class='acc-set-field' style='margin-top:0'><label class='field-label'>" + t.mcpFormNameLab + "</label><input class='field' placeholder='" + t.mcpFormNamePh + "'/><div class='field-hint'>" + t.mcpFormNameHint + "</div></div>"
      + "<div><label class='field-label'>" + t.mcpFormScopeLab + "</label><div class='acc-scope-toggle' role='radiogroup'><button class='acc-scope-opt acc-scope-opt--active' role='radio' aria-checked='true'>" + t.mcpScopeRead + "</button><button class='acc-scope-opt' role='radio' aria-checked='false'>" + t.mcpScopeWrite + "</button></div><div class='field-hint'>" + t.mcpFormScopeHint + "</div></div>"
      + "<div class='acc-mcp-form-actions'><button class='btn btn--ghost btn--sm'>" + t.mcpFormCancel + "</button><button class='btn btn--primary btn--sm'>" + xic("plus", 15) + t.mcpFormCreate + "</button></div>"
      + "</div>";
  }
  function mcpReveal(lang, value) {
    var t = T(lang);
    return "<div class='acc-mcp-reveal'>"
      + "<div><div class='acc-mcp-reveal-t'>" + t.mcpRevealT + "</div><div class='acc-mcp-reveal-s'>" + t.mcpRevealS + "</div></div>"
      + "<div class='acc-tokval'>" + xic("key", 15) + "<code>" + value + "</code><button class='acc-copy-btn'>" + xic("copy", 13) + t.mcpCopy + "</button></div>"
      + "<div class='acc-mcp-warn'>" + xic("alert", 15) + "<span>" + t.mcpRevealWarn + "</span></div>"
      + "<div class='acc-mcp-form-actions'><button class='btn btn--primary btn--sm'>" + xic("check", 15) + t.mcpRevealDone + "</button></div>"
      + "</div>";
  }
  function mcpConnect(lang) {
    var t = T(lang);
    var cfg = "{\n  \"mcpServers\": {\n    \"pennedly\": {\n      \"url\": \"https://api.pennedly.com/mcp\",\n      \"headers\": { \"Authorization\": \"Bearer " + t.mcpTokenPlaceholder + "\" }\n    }\n  }\n}";
    return "<div class='acc-mcp-connect'>"
      + "<div class='acc-mcp-connect-t'>" + t.mcpConnectCap + "</div><div class='acc-mcp-connect-s'>" + t.mcpConnectS + "</div>"
      + "<div class='acc-mcp-field-lab'>" + t.mcpServerLab + "</div>"
      + "<div class='acc-tokval'>" + xic("external", 15) + "<code>https://api.pennedly.com/mcp</code><button class='acc-copy-btn'>" + xic("copy", 13) + t.mcpCopy + "</button></div>"
      + "<div class='acc-mcp-field-lab'>" + t.mcpConfigLab + "</div>"
      + "<div class='acc-codeblock'><div class='acc-codeblock-head'><button class='acc-copy-btn'>" + xic("copy", 13) + t.mcpCopy + "</button></div><pre>" + cfg + "</pre></div>"
      + "</div>";
  }
  function settingsMcpCard(lang, opts) {
    opts = opts || {}; var t = T(lang); var view = opts.view || "list";
    var headBtn = view === "list" ? "<button class='btn btn--secondary btn--sm'>" + xic("plus", 15) + t.mcpCreateBtn + "</button>" : "";
    var body;
    if (view === "create") body = mcpForm(lang);
    else if (view === "reveal") body = mcpReveal(lang, opts.tokenValue || "pnd_mcp_live_8f2a91c3e0b74dd1a6f2c9e0b3a7d5f1");
    else body = mcpList(lang, opts.tokens != null ? opts.tokens : C.MCP_TOKENS, opts.confirmId);
    body += mcpConnect(lang);
    return card2(t.mcpCap, t.mcpHint, body, false, headBtn);
  }
  function skelCard2(lines) {
    var b = "";
    for (var i = 0; i < lines; i++) b += "<div class='acc-set-skel' style='height:44px;margin-top:10px'></div>";
    return "<section class='acc-card2'><div class='acc-card2-head'><div class='acc-set-skel' style='width:150px;height:15px'></div></div><div class='acc-card2-body'>" + b + "</div></section>";
  }
  function settingsSkeleton() {
    return "<div class='acc-page'><div class='acc-pagehead'><div class='acc-set-skel' style='width:210px;height:26px'></div><div class='acc-set-skel' style='width:340px;height:12px;margin-top:12px'></div></div>"
      + skelCard2(3) + skelCard2(4) + skelCard2(1) + skelCard2(2) + skelCard2(1) + "</div>";
  }

  function settingsBody(lang, opts) {
    opts = opts || {}; var t = T(lang);
    if (opts.loading) return settingsSkeleton();
    var head = opts.noHead ? "" : "<div class='acc-pagehead'><div class='acc-pagehead-t'>" + t.setTitle + "</div><div class='acc-pagehead-d'>" + t.setLead + "</div></div>";
    return "<div class='acc-page'>" + head
      + settingsAccountCard(lang)
      + settingsLangCard(lang, opts.activeLang || "RU")
      + settingsDataCard(lang, opts.exportState || "idle")
      + settingsMcpCard(lang, opts.mcp || {})
      + settingsDangerCard(lang, opts.delState || "idle")
      + "</div>";
  }

  // ═══════════════════ Portfolio Advisor chat ═══════════════════
  function chatChip(c, lang) {
    return "<span class='adv-chip" + (c.tone ? " adv-chip--" + c.tone : "") + "'>" + (c.icon ? ic(c.icon, 13) : "") + L(c.text, lang) + "</span>";
  }
  function chipsRow(lang, arr) { return "<div class='adv-chips'>" + arr.map(function (c) { return chatChip(c, lang); }).join("") + "</div>"; }
  function sourcesRow(lang, srcStr) {
    var srcArr = L(srcStr, lang).split(" · ");
    return "<div class='adv-sources'><span class='lab'>" + ic("sparkle", 12) + T(lang).advGroundedFull + "</span>"
      + srcArr.map(function (s, i) { return (i ? "<span class='dot'></span>" : "") + "<span class='src'>" + s + "</span>"; }).join("") + "</div>";
  }
  function suggestCard(lang, s) {
    var acts = "<button class='btn btn--primary btn--sm'>" + xic("external", 15) + L(s.primary, lang) + "</button>"
      + "<button class='btn btn--ghost btn--sm'>" + L(s.secondary, lang) + "</button>";
    return "<div class='adv-suggest'><span class='adv-suggest-ico" + (s.tone === "danger" ? " adv-suggest-ico--danger" : "") + "'>" + ic(s.icon, 18) + "</span>"
      + "<div class='adv-suggest-body'><div class='adv-suggest-t'>" + L(s.t, lang) + "</div><div class='adv-suggest-s'>" + L(s.s, lang) + "</div><div class='adv-suggest-act'>" + acts + "</div></div></div>";
  }
  function chatPinned(lang, mode) {
    var t = T(lang); var a = C.ADVISOR[mode] || C.ADVISOR.single_brand;
    var chips = a.chips.map(function (c) { return chatChip(c, lang); }).join("");
    return "<div class='acc-chat-pinned'>"
      + "<div class='acc-chat-pinned-cap'><span class='acc-chat-pinned-mark'>" + ic("sparkle", 15) + "</span><span class='acc-chat-pinned-caplab'>" + t.advPinnedCap + "</span><span class='acc-chat-pinned-scope'>" + t.advChatScope + "</span></div>"
      + "<div class='acc-chat-pinned-verdict'>" + L(a.verdict, lang) + "</div>"
      + "<div class='acc-chat-pinned-chips'>" + chips + "</div></div>";
  }
  function userMsg(txt) { return "<div class='adv-row adv-row--user'><div class='adv-userbubble'>" + txt + "</div></div>"; }
  function aiMsg(lang, inner) { return "<div class='adv-row'><span class='adv-ai-mark'>" + ic("advisor", 18) + "</span><div class='adv-ai'><div class='adv-ai-name'>" + T(lang).advName + "</div>" + inner + "</div></div>"; }
  function aiTurn(lang, turn) {
    var paras = turn.paras.map(function (p) { return "<p>" + L(p, lang) + "</p>"; }).join("");
    return paras + chipsRow(lang, turn.chips) + sourcesRow(lang, turn.sources) + suggestCard(lang, turn.suggest);
  }
  function composer(lang, disabled) {
    return "<div class='adv-composer'><textarea class='adv-input' rows='1' placeholder='" + T(lang).advAskPort + "'></textarea><button class='adv-send'" + (disabled ? " disabled" : "") + ">" + ic("send", 18) + "</button></div>";
  }
  function starters(lang, mode) {
    var ch = C.ADVISOR_CHAT[mode] || C.ADVISOR_CHAT.single_brand;
    return "<div class='adv-starters'>" + ch.starters.map(function (s) { return "<button class='adv-starter'>" + ic(s.icon, 15) + L(s.text, lang) + "</button>"; }).join("") + "</div>";
  }
  function thinking(lang) {
    return "<div class='adv-row'><span class='adv-ai-mark'>" + ic("advisor", 18) + "</span><div class='adv-ai'><div class='adv-ai-name'>" + T(lang).advName + "</div><div class='adv-thinking'><span class='adv-dots'><i></i><i></i><i></i></span>" + T(lang).advReading + "</div></div></div>";
  }
  function thinRow(lang) {
    var t = T(lang);
    return "<div class='adv-row'><span class='adv-ai-mark'>" + ic("advisor", 18) + "</span><div class='adv-ai'><div class='adv-ai-name'>" + t.advName + "</div><div class='adv-thin'><div class='adv-thin-t'>" + t.advThinT + "</div><div class='adv-thin-s'>" + t.advThinS + "</div></div></div></div>";
  }
  function errorRow(lang) {
    var t = T(lang);
    return "<div class='adv-row'><span class='adv-ai-mark'>" + ic("advisor", 18) + "</span><div class='adv-ai'><div class='adv-ai-name'>" + t.advName + "</div><div class='adv-error'><div class='adv-error-t'>" + t.advErrT + "</div><div class='adv-error-s'>" + t.advErrS + "</div><div class='adv-error-act'><button class='btn btn--secondary btn--sm'>" + ic("undo", 15) + t.advRetry + "</button></div></div></div></div>";
  }
  function heroEmpty(lang, mode) {
    var t = T(lang);
    var sub = L({ ru: "Читаю статистику всех профилей портфеля, их голоса и недавние посты — совет под ваш аккаунт, а не общие подсказки.", de: "Ich lese die Statistiken aller Portfolio-Profile, ihre Stimmen und letzten Beiträge — Rat für dein Konto, keine generischen Tipps." }, lang);
    return "<div class='adv-hero'><div class='adv-hero-mark'>" + ic("advisor", 24) + "</div><h3>" + t.advTitle + "</h3><p>" + sub + "</p></div>"
      + "<div class='adv-hero-cap'>" + t.advTry + "</div>" + starters(lang, mode);
  }
  function clueLine(lang) {
    return "<div class='adv-clue'>" + L({ ru: "Pennedly читает статистику, голоса и посты всех профилей портфеля.", de: "Pennedly liest Statistiken, Stimmen und Beiträge aller Portfolio-Profile." }, lang) + "</div>";
  }

  // full chat screen. state: 'ready' | 'empty' | 'thinking' | 'thin' | 'error'
  function advisorChat(lang, opts) {
    opts = opts || {}; var mode = opts.mode || "single_brand"; var state = opts.state || "ready";
    var ch = C.ADVISOR_CHAT[mode] || C.ADVISOR_CHAT.single_brand;
    var pinned = chatPinned(lang, mode);
    var thread, footDisabled = false, showClue = true;
    if (state === "empty") { thread = heroEmpty(lang, mode); showClue = false; }
    else if (state === "thinking") { thread = "<div class='adv-thread'>" + userMsg(L(ch.turns[1].q, lang)) + thinking(lang) + "</div>"; footDisabled = true; }
    else if (state === "thin") { thread = "<div class='adv-thread'>" + userMsg(L(ch.starters[2].text, lang)) + thinRow(lang) + "</div>"; }
    else if (state === "error") { thread = "<div class='adv-thread'>" + userMsg(L(ch.turns[0].q, lang)) + errorRow(lang) + "</div>"; }
    else {
      thread = "<div class='adv-thread'>"
        + userMsg(L(ch.turns[0].q, lang)) + aiMsg(lang, aiTurn(lang, ch.turns[0]))
        + userMsg(L(ch.turns[1].q, lang)) + aiMsg(lang, aiTurn(lang, ch.turns[1]))
        + "</div>";
    }
    var foot = "<div class='acc-chat-foot'><div class='acc-chat-foot-inner'>" + composer(lang, footDisabled) + (showClue ? clueLine(lang) : "") + "</div></div>";
    return "<div class='acc-chat" + (opts.tall ? " acc-chat--tall" : "") + "'>" + pinned + "<div class='acc-chat-scroll'>" + thread + "</div>" + foot + "</div>";
  }

  function set(id, html) { var e = document.getElementById(id); if (e) e.innerHTML = html; }

  window.ACCX = {
    xic, crumb, topbar, shell, backButton, backRow,
    card2, settingsAccountCard, settingsLangCard, settingsDataCard, settingsDangerCard, settingsSkeleton, settingsBody,
    scopeBadge, mcpRow, mcpList, mcpForm, mcpReveal, mcpConnect, settingsMcpCard,
    chatPinned, userMsg, aiMsg, aiTurn, chatChip, chipsRow, sourcesRow, suggestCard, composer, starters, thinking, thinRow, errorRow, heroEmpty, advisorChat,
    set,
  };
})();
