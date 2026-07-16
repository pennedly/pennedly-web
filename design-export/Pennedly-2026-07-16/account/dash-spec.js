/* account/dash-spec.js — populates Account-Dashboard-SPEC.html (desktop).
   Every frame is the REAL account/v3.js output (via SK/V3/VSHELL), so the doc
   is 1:1 with what /app/account ships. No dashboard markup is re-authored here. */
(function () {
  "use strict";
  var VK = window.VK, V3 = window.V3, VSHELL = window.VSHELL, SK = window.SK;
  var L = "ru";

  // resolved scenarios reused across sections
  var rOne = VK.resolve("one_profile");     // 1 brand · 1 profile (thin advisor)
  var rSingle = VK.resolve("single_brand");  // 1 brand · 3 profiles
  var rTwo = VK.resolve("two_brands");       // 2 brands · mixed (verdict advisor)

  /* wrap raw v3-* HTML in a themed container that carries the @container(vbody) ctx */
  function piece(inner, dark) {
    return "<div class='vshell " + (dark ? "dark" : "light") + "' data-theme-root " +
      "style='display:block;border:none;min-height:0;background:transparent'>" +
      "<div class='vbody' style='padding:0'>" + inner + "</div></div>";
  }
  function grid(cardsHtml) { return "<div class='v3-ev-grid'>" + cardsHtml + "</div>"; }
  function stack() { return Array.prototype.join.call(arguments, ""); }
  /* body-only render clamped to a width — isolates the @container reflow proof */
  function narrow(w, opts) {
    var ctx = SK.ctxOf(opts);
    return "<div class='ruler'>vbody <b>" + w + "px</b></div>" +
      "<div class='vshell " + (opts.dark ? "dark" : "light") + "' data-theme-root " +
      "style='display:block;border:1px solid var(--color-border);border-radius:14px;min-height:0;width:" + w + "px;max-width:100%'>" +
      "<div class='vbody'>" + V3.render(ctx) + "</div></div>";
  }
  function p(key) { return VK.profile(key); }
  /* a doc-only clone to illustrate the has_voice=false + synced nudge (no such
     profile in the fixture; the "Настроить голос" rule still must be shown) */
  function novoice() { return Object.assign({}, VK.PROFILES.studio, { has_voice: false }); }

  /* ── §2.1 two card modes (full width so grids show real columns) ── */
  SK.set("f-modes", stack(
    SK.col("Режим «1 бренд» · карточки = профили", piece(V3.evidence(rSingle, L)), false),
    SK.col("Режим «2+ брендов» · карточки = бренды", piece(V3.evidence(rTwo, L)), false)
  ));

  /* ── §4 identity ── */
  SK.set("f-identity", SK.rowOf(
    SK.col("Светлая · 2+ брендов (масштаб с брендами)", piece(V3.identity(rTwo, L)), false),
    SK.col("Тёмная · 1 бренд (бренды скрыты из строки)", piece(V3.identity(rSingle, L), true), true)
  ));

  /* ── §5 sidebar nav (no «Советник») ── */
  function sidebarFrame(r, dark) {
    return "<div class='vshell " + (dark ? "dark" : "light") + "' data-theme-root " +
      "style='min-height:0;display:inline-flex;border-radius:14px'>" + VSHELL.sidebar({ lang: L, r: r }) + "</div>";
  }
  SK.set("f-shell-nav", SK.rowOf(
    SK.col("Светлая · 1 бренд — меню: Дашборд · Настройки", sidebarFrame(rSingle, false), false, "frame--pad18"),
    SK.col("Тёмная · 2+ брендов — добавляется «Бренды · 2»", sidebarFrame(rTwo, true), true, "frame--pad18")
  ));

  /* ── §6 breadcrumb + flat switcher (topbar; click opens the menu — wired live) ── */
  function topbarFrame(r, dark) {
    return "<div class='vshell " + (dark ? "dark" : "light") + "' data-theme-root style='display:block;min-height:0;border-radius:14px;overflow:visible'>" +
      "<div class='vmain' style='min-height:0'>" + VSHELL.topbar({ lang: L, r: r }) + "</div></div>";
  }
  SK.set("f-switcher", SK.rowOf(
    SK.col("Светлая · 2+ брендов (профили под подписями брендов)", topbarFrame(rTwo, false), false, "frame--pad14"),
    SK.col("Тёмная · 1 бренд (плоский список)", topbarFrame(rSingle, true), true, "frame--pad14")
  ));

  /* ── §7 verdict hero (full width so 3 recos sit in a row) ── */
  SK.set("f-hero", stack(
    SK.col("Светлая · герой-вердикт по портфелю", piece(V3.verdictHero(rTwo, L)), false),
    SK.col("Тёмная · тот же герой", piece(V3.verdictHero(rTwo, L), true), true)
  ));

  /* ── §8 thin (204) ── */
  SK.set("f-thin", stack(
    SK.col("Светлая · советник отдал 204 → приглашение + стартеры", piece(V3.thinHero(rOne, L)), false),
    SK.col("Тёмная · то же (без выдуманных цифр)", piece(V3.thinHero(rOne, L), true), true)
  ));

  /* ── §9 four totals ── */
  SK.set("f-totals", stack(
    SK.col("Светлая · 2+ брендов (полный портфель)", piece(V3.totalsBar(rTwo, L)), false),
    SK.col("Тёмная · 1 бренд · 1 профиль (меньше чисел)", piece(V3.totalsBar(rOne, L), true), true)
  ));

  /* ── §10 profile cards ── */
  SK.set("f-pcard", SK.rowOf(
    SK.col("Светлая · synced · голос настроен", piece(grid(V3.evCardProfile(p("mara"), L))), false),
    SK.col("Тёмная · synced · «Настроить голос» (has_voice=false)", piece(grid(V3.evCardProfile(novoice(), L)), true), true)
  ));

  /* ── §10.1 profile statuses ── */
  SK.set("f-pstatus", stack(
    SK.rowOf(
      SK.col("Светлая · importing (спиннер + % + «≈ пара минут»)", piece(grid(V3.evCardProfile(p("notes"), L))), false),
      SK.col("Тёмная · sync-error + «Повторить»", piece(grid(V3.evCardProfile(p("co"), L)), true), true)
    ),
    SK.col("Светлая · disconnected + «Переподключить» (вне тоталов)", piece(grid(V3.evCardProfile(p("old"), L))), false)
  ));

  /* ── §11 brand cards (collapsed) ── */
  SK.set("f-bcard", SK.rowOf(
    SK.col("Светлая · Mara Lin · «1 импортируется»", piece(grid(V3.evCardBrand(VK.BRANDS.mara, L, {}))), false),
    SK.col("Тёмная · Field Notes · «1 сбой синка»", piece(grid(V3.evCardBrand(VK.BRANDS.field, L, {})), true), true)
  ));

  /* ── §11.1 expanded brand (statuses inside) ── */
  SK.set("f-bexpand", SK.rowOf(
    SK.col("Светлая · Mara Lin развёрнут (synced + importing внутри)", piece(grid(V3.evCardBrand(VK.BRANDS.mara, L, { expanded: true }))), false),
    SK.col("Тёмная · Field Notes развёрнут (sync-error + disconnected внутри)", piece(grid(V3.evCardBrand(VK.BRANDS.field, L, { expanded: true })), true), true)
  ));

  /* ── §12 add tile ── */
  SK.set("f-add", SK.rowOf(
    SK.col("Светлая · 1 бренд → «Добавить профиль»", piece(grid(V3.addTile(rSingle, L))), false),
    SK.col("Тёмная · 2+ брендов → «Добавить бренд»", piece(grid(V3.addTile(rTwo, L)), true), true)
  ));

  /* ── §13.1 advisor states ── */
  SK.set("f-adv-states", stack(
    SK.col("Светлая · вердикт", piece(V3.verdictHero(rTwo, L)), false),
    SK.col("Тёмная · тонкий · 204", piece(V3.thinHero(rTwo, L), true), true),
    SK.col("Светлая · загрузка (скелет повторяет раскладку)", piece(V3.skeleton(L)), false)
  ));

  /* ── §13.2 minimal portfolio ── */
  SK.set("f-one", stack(
    SK.col("Светлая · 1 бренд · 1 профиль (новый пользователь · советник 204)", SK.stage({ scn: "one_profile", lang: L }), false, "frame--pad14"),
    SK.col("Тёмная · то же", SK.stage({ scn: "one_profile", lang: L, dark: true }), true, "frame--pad14")
  ));

  /* ── §13.3 mixed (live + disconnected, brand expanded to reveal it) ── */
  SK.set("f-mixed", stack(
    SK.col("Светлая · 2+ брендов · Field развёрнут (живой + sync-error + отключённый с «Переподключить»)", SK.stage({ scn: "two_brands", lang: L, expand: "field" }), false, "frame--pad14"),
    SK.col("Тёмная · то же", SK.stage({ scn: "two_brands", lang: L, dark: true, expand: "field" }), true, "frame--pad14")
  ));

  /* ── §14.1 narrow container (container queries) ── */
  SK.set("f-narrow", SK.rowOf(
    SK.col("Светлая · vbody 760 (рекомендации 1-стб · тоталы 2×2)", narrow(760, { scn: "two_brands", lang: L }), false, "frame--narrow"),
    SK.col("Тёмная · vbody 560 (каналы 1-стб · вердикт мельче)", narrow(560, { scn: "two_brands", lang: L, dark: true }), true, "frame--narrow")
  ));

  /* ── §14.2 german length ── */
  SK.set("f-german", stack(
    SK.col("Немецкий · светлая · 1 бренд", SK.stage({ scn: "single_brand", lang: "de" }), false, "frame--pad14"),
    SK.col("Немецкий · тёмная · 2+ брендов (Field развёрнут)", SK.stage({ scn: "two_brands", lang: "de", dark: true, expand: "field" }), true, "frame--pad14")
  ));

  /* ── §16 i18n table (acc.* keys, ru + de from VK.T) ── */
  (function () {
    var ru = VK.T.ru, de = VK.T.de;
    var keys = [
      ["dashboard", "acc.nav.dashboard"], ["brands", "acc.nav.brands"], ["accSettings", "acc.nav.settings"],
      ["advTitle", "acc.advisor.title"], ["advScope", "acc.advisor.scope"], ["advOpen", "acc.advisor.open"], ["advReco", "acc.advisor.recos"],
      ["followers", "acc.total.followers"], ["views", "acc.total.views"], ["posts", "acc.total.posts"], ["replies", "acc.total.replies"],
      ["synced", "acc.sync.synced"], ["importing", "acc.sync.importing"], ["syncError", "acc.sync.error"], ["retry", "acc.sync.retry"],
      ["disconnected", "acc.sync.disconnected"], ["reconnect", "acc.sync.reconnect"], ["connectMore", "acc.sync.connectMore"],
      ["noVoice", "acc.voice.setup"], ["allSynced", "acc.brand.allSynced"], ["addBrand", "acc.add.brand"], ["addProfile", "acc.add.profile"],
    ];
    var tb = document.querySelector("#i18n-tbl tbody");
    if (tb) tb.innerHTML = keys.map(function (k) {
      return "<tr><td><code>" + k[1] + "</code></td><td>" + ru[k[0]] + "</td><td>" + de[k[0]] + "</td></tr>";
    }).join("");
  })();

  /* ── §3 live playground (= ?demo=1 Tweaks) ── */
  function pgRender(s) {
    if (s.phase === "loading") return SK.stage({ scn: "loading", lang: s.lang, dark: s.dark });
    var expand = (s.mode === "two_brands" && s.expand) ? "field" : undefined;
    return SK.stage({ scn: s.mode, lang: s.lang, dark: s.dark, advisor: s.adv, expand: expand });
  }
  SK.playground({
    stageId: "pg-stage",
    state: { mode: "single_brand", adv: "verdict", phase: "ready", lang: "ru", dark: false, expand: false },
    segs: [
      { id: "pg-mode", key: "mode" }, { id: "pg-adv", key: "adv" },
      { id: "pg-state", key: "phase" }, { id: "pg-lang", key: "lang" },
    ],
    toggles: [{ id: "pg-dark", key: "dark" }, { id: "pg-expand", key: "expand" }],
    onChange: function (s) {
      var canExpand = s.mode === "two_brands" && s.phase !== "loading";
      var w = document.getElementById("pg-expand-wrap");
      if (w) w.classList.toggle("dis", !canExpand);
      var advGrp = document.getElementById("pg-adv");
      if (advGrp) advGrp.closest(".pg-grp").style.opacity = s.phase === "loading" ? ".4" : "";
    },
    render: pgRender,
  });
})();
