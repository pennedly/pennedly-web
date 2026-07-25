/* account/spec-kit.js — shared SPEC-document render helpers for the V3
   "Агент" deliverables. Thin layer over the production kit:
   VSHELL.render(V3.render(ctx), ctx). Nothing here re-implements dashboard
   markup — the docs only *frame* the real kit output, so every frame is 1:1
   with what /app/account ships. Exposes window.SK. */
(function () {
  "use strict";
  var VK = window.VK, VSHELL = window.VSHELL, V3 = window.V3;

  /* ── doc frame primitives ── */
  function head(label, dark) {
    return "<div class='fr-head'><span class='dh" + (dark ? " dh--dark" : "") + "'></span>" + label + "</div>";
  }
  function frame(inner, dark, cls) {
    return "<div class='frame" + (dark ? " dark" : "") + (cls ? " " + cls : "") + "'>" + inner + "</div>";
  }
  function col(label, inner, dark, cls) {
    return "<div class='fr'>" + head(label, dark) + frame(inner, dark, cls) + "</div>";
  }
  function rowOf() {
    return "<div class='frow'>" + Array.prototype.join.call(arguments, "") + "</div>";
  }
  function set(id, html) {
    var el = document.getElementById(id);
    if (el) el.innerHTML = html;
  }

  /* ── resolve a scenario into a normalized ctx, applying doc overrides ── */
  function ctxOf(opts) {
    opts = opts || {};
    var r = VK.resolve(opts.scn || "two_brands");
    if (opts.advisor) r.advisor = opts.advisor;   // verdict | thin override
    return {
      r: r,
      lang: opts.lang || "ru",
      device: opts.device || "desktop",
      dark: !!opts.dark,
      chrome: null,
      opts: { expand: opts.expand },
    };
  }

  /* ── full dashboard render (shell + V3 body) ── */
  function stage(opts) {
    var ctx = ctxOf(opts);
    return VSHELL.render(V3.render(ctx), ctx);
  }

  /* ── the V3 body only (no shell) — for anatomy sections ── */
  function body(opts) {
    var ctx = ctxOf(opts);
    return "<div class='vshell" + (ctx.dark ? " dark" : " light") + "' data-theme-root style='border:none;min-height:0;background:transparent'>" +
      "<div class='vbody' style='padding:0'>" + V3.render(ctx) + "</div></div>";
  }

  /* ── mobile stage wrapped in a device bezel ── */
  function phone(opts, width) {
    width = width || 390;
    var m = Object.assign({}, opts, { device: "mobile" });
    return "<div class='phone phone--" + width + "'><span class='phone-cap'></span>" +
      "<div class='phone-screen'>" + stage(m) + "</div></div>";
  }
  function phoneCol(label, opts, width) {
    return "<div class='phonecol'><div class='w'>" + label + "</div>" + phone(opts, width) + "</div>";
  }

  /* ── clamp a desktop stage to a container width (proves @container queries) ── */
  function clamp(w, opts) {
    return "<div class='ruler'>контейнер <b>" + w + "px</b></div>" +
      "<div style='width:" + w + "px;max-width:100%'>" + stage(opts) + "</div>";
  }

  /* ── generic segmented-control + toggle playground wiring ──
     config: { state:{...defaults}, segs:[{id,key}], toggles:[{id,key}],
               render(state)->html, onChange(state) } */
  function playground(config) {
    var state = Object.assign({}, config.state);
    function paint() {
      var stageEl = document.getElementById(config.stageId);
      if (!stageEl) return;
      if (config.onChange) config.onChange(state, stageEl);
      stageEl.classList.toggle("dark", !!state.dark);
      stageEl.innerHTML = config.render(state);
    }
    (config.segs || []).forEach(function (s) {
      var wrap = document.getElementById(s.id);
      if (!wrap) return;
      wrap.querySelectorAll("button").forEach(function (b) {
        b.addEventListener("click", function () {
          wrap.querySelectorAll("button").forEach(function (x) { x.classList.remove("on"); });
          b.classList.add("on");
          state[s.key] = b.getAttribute("data-v");
          paint();
        });
      });
    });
    (config.toggles || []).forEach(function (tg) {
      var el = document.getElementById(tg.id);
      if (!el) return;
      el.addEventListener("change", function () { state[tg.key] = this.checked; paint(); });
    });
    paint();
    return { state: state, paint: paint };
  }

  window.SK = {
    head: head, frame: frame, col: col, rowOf: rowOf, set: set,
    ctxOf: ctxOf, stage: stage, body: body, phone: phone, phoneCol: phoneCol,
    clamp: clamp, playground: playground,
  };
})();
