/* variants/spec.js — render harness for Account-Dashboard-Variants-SPEC.html.
   Mounts every concept in the shell across scenarios/themes/devices, wires the
   live stand (playground) and the document theme toggle. All concept + shell
   logic lives in vk.js / shell.js / v1..v5.js — this only composes frames. */
(function () {
  "use strict";
  var CONCEPTS = {
    V1: { C: window.V1, chrome: null, alt: "single_brand", altLabel: "1 бренд · профили" },
    V2: { C: window.V2, chrome: null, alt: "all_off", altLabel: "все отключены → переподключение" },
    V3: { C: window.V3, chrome: null, alt: "one_profile", altLabel: "тонкий советник · новый" },
    V4: { C: window.V4, chrome: null, alt: "single_brand", altLabel: "1 бренд · богатые карточки профилей" },
    V5: { C: window.V5, chrome: "minimal", alt: "one_profile", altLabel: "тонкий диалог · новый" },
  };

  function ctxFor(cid, scn, opts) {
    opts = opts || {};
    return {
      r: VK.resolve(scn), lang: opts.lang || "ru", device: opts.device || "desktop",
      dark: !!opts.dark, chrome: CONCEPTS[cid].chrome,
      opts: { expand: (opts.expand != null ? opts.expand : 0), chOpen: !!opts.chOpen },
    };
  }
  function shellFor(cid, scn, opts) { var ctx = ctxFor(cid, scn, opts); return VSHELL.render(CONCEPTS[cid].C.render(ctx), ctx); }
  function fr(label, html, dark, mob) { return "<div class='fr" + (mob ? " fr--mob" : "") + "'><div class='fr-head'><span class='dh" + (dark ? " dh--dark" : "") + "'></span>" + label + "</div>" + html + "</div>"; }
  function frow(a, b) { return "<div class='frow'>" + a + b + "</div>"; }
  function set(id, html) { var e = document.getElementById(id); if (e) e.innerHTML = html; }
  function box(inner, dark) { return "<div class='" + (dark ? "dark" : "light") + "' style='background:var(--color-bg);border:1px solid var(--color-border);border-radius:16px;padding:20px;max-width:430px'>" + inner + "</div>"; }

  // §1.2 picker
  set("f-picker", frow(
    fr("Светлая · Threads live · LinkedIn скоро", box(VSHELL.picker("ru"), false), false),
    fr("Тёмная", box(VSHELL.picker("ru"), true), true)
  ));

  // concept sections
  ["V1", "V2", "V3", "V4", "V5"].forEach(function (cid) {
    var n = cid.slice(1), C = CONCEPTS[cid];
    set("c" + n + "-hero", fr("Десктоп · светлая · 2 бренда (реальные данные)", shellFor(cid, "two_brands", {}), false));
    set("c" + n + "-alt", frow(
      fr("Тёмная · 2 бренда", shellFor(cid, "two_brands", { dark: true }), true),
      fr("Светлая · " + C.altLabel, shellFor(cid, C.alt, {}), false)
    ));
    set("c" + n + "-mob",
      fr("Мобайл · светлая", shellFor(cid, "two_brands", { device: "mobile" }), false, true) +
      fr("Мобайл · тёмная", shellFor(cid, "two_brands", { device: "mobile", dark: true }), true, true)
    );
  });

  // §04 states gallery
  set("s-sync", frow(
    fr("Импорт + сбой синка (в развёрнутых брендах) · V4 · 2 бренда", shellFor("V4", "two_brands", {}), false),
    fr("Все отключены · переподключение · V4", shellFor("V4", "all_off", {}), false)
  ));
  set("s-adv", frow(
    fr("Вердикт · V3 · светлая", shellFor("V3", "two_brands", {}), false),
    fr("Тонкий (204) · V3 · новый пользователь", shellFor("V3", "one_profile", {}), false)
  ) + frow(
    fr("Загрузка · скелет · V1", shellFor("V1", "loading", {}), false),
    fr("Загрузка · скелет · V4", shellFor("V4", "loading", {}), false)
  ));

  // §05 layout proofs
  set("l-narrow",
    fr("390 · V1 (плотный пульт)", "<div class='narrow390'>" + shellFor("V1", "two_brands", { device: "mobile" }) + "</div>", false, true) +
    fr("320 · V1 (край)", "<div class='narrow320'>" + shellFor("V1", "two_brands", { device: "mobile" }) + "</div>", false, true) +
    fr("320 · V4 карточки", "<div class='narrow320'>" + shellFor("V4", "single_brand", { device: "mobile" }) + "</div>", false, true)
  );
  set("l-de", frow(
    fr("de · V1 · 2 бренда", shellFor("V1", "two_brands", { lang: "de" }), false),
    fr("de · V4 · 2 бренда", shellFor("V4", "two_brands", { lang: "de" }), false)
  ));

  // §03 live stand
  var pg = { concept: "V1", scn: "two_brands", lang: "ru", device: "desktop", dark: false };
  function renderPG() {
    var stage = document.getElementById("pg-stage");
    if (!stage) return;
    stage.classList.toggle("dark", pg.dark);
    stage.classList.toggle("dev-mobile", pg.device === "mobile");
    stage.innerHTML = shellFor(pg.concept, pg.scn, { lang: pg.lang, device: pg.device, dark: pg.dark });
  }
  function seg(id, key) {
    var wrap = document.getElementById(id);
    if (!wrap) return;
    wrap.querySelectorAll("button").forEach(function (b) {
      b.addEventListener("click", function () {
        wrap.querySelectorAll("button").forEach(function (x) { x.classList.remove("on"); });
        b.classList.add("on"); pg[key] = b.getAttribute("data-v"); renderPG();
      });
    });
  }
  seg("pg-concept", "concept"); seg("pg-scn", "scn"); seg("pg-lang", "lang"); seg("pg-dev", "device");
  var dark = document.getElementById("pg-dark");
  if (dark) dark.addEventListener("change", function () { pg.dark = this.checked; renderPG(); });
  renderPG();

  // document theme toggle (chrome only — preview frames carry their own theme)
  var dt = document.getElementById("doc-theme");
  if (dt) dt.addEventListener("click", function () {
    var on = document.documentElement.classList.toggle("dark");
    dt.textContent = on ? "Светлая тема документа" : "Тёмная тема документа";
  });
})();
