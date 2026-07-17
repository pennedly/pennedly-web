/* ds/app.js — documentation interactions (theme, copy, live demos). */
(function () {
  "use strict";

  /* ---- Theme toggle (persisted) ---- */
  var root = document.documentElement;
  var saved = null;
  try { saved = localStorage.getItem("pennedly-theme"); } catch (e) {}
  if (saved === "dark") root.classList.add("dark");
  function syncToggle() {
    var on = root.classList.contains("dark");
    document.querySelectorAll("[data-theme-toggle] .tt-label").forEach(function (el) {
      el.textContent = on ? "Dark" : "Light";
    });
  }
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-theme-toggle]");
    if (!t) return;
    root.classList.toggle("dark");
    try { localStorage.setItem("pennedly-theme", root.classList.contains("dark") ? "dark" : "light"); } catch (err) {}
    syncToggle();
  });
  syncToggle();

  /* ---- Copy to clipboard ---- */
  function flash(btn) {
    var label = btn.querySelector(".cb-label");
    var prev = label ? label.textContent : null;
    btn.classList.add("copied");
    if (label) label.textContent = "Copied";
    setTimeout(function () {
      btn.classList.remove("copied");
      if (label && prev !== null) label.textContent = prev;
    }, 1300);
  }
  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-copy]");
    if (!btn) return;
    var sel = btn.getAttribute("data-copy");
    var text = "";
    if (sel === "#self") {
      var holder = btn.closest(".recipe") || btn.parentElement;
      var codeEl = holder && holder.querySelector(".r-code");
      text = codeEl ? codeEl.textContent : "";
    } else {
      var target = document.querySelector(sel);
      text = target ? target.textContent : "";
    }
    text = text.replace(/\s+$/g, "");
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { flash(btn); }).catch(function () { flash(btn); });
    } else {
      var ta = document.createElement("textarea");
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); } catch (err) {}
      document.body.removeChild(ta); flash(btn);
    }
  });

  /* ---- Inject globals.css source into the code block ---- */
  var dest = document.getElementById("globals-code");
  if (dest) {
    fetch("globals.css")
      .then(function (r) { return r.ok ? r.text() : Promise.reject(); })
      .then(function (css) { dest.textContent = css; })
      .catch(function () { dest.textContent = "/* Open globals.css in the file tree — it lives at the project root. */"; });
  }

  /* ---- Modal demo ---- */
  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-open-modal]")) {
      var m = document.getElementById("demo-modal"); if (m) m.style.display = "grid";
    }
    if (e.target.closest("[data-close-modal]") || e.target.matches(".overlay")) {
      var m2 = document.getElementById("demo-modal"); if (m2) m2.style.display = "none";
    }
  });

  /* ---- Toast demo ---- */
  window.__toast = function (kind) {
    var host = document.getElementById("toast-host"); if (!host) return;
    var t = document.createElement("div");
    t.className = "toast toast--" + kind;
    t.innerHTML = '<span class="toast-mark"></span><div><div style="font-weight:600;font-size:var(--text-small)">' +
      (kind === "success" ? "Draft saved" : "Couldn’t reach Threads") +
      '</div><div style="font-size:var(--text-caption);color:var(--color-text-muted);margin-top:2px">' +
      (kind === "success" ? "Your reply is ready to review." : "We’ll retry in a moment.") + "</div></div>";
    t.style.animation = "dialog-in var(--duration-slow) var(--ease-entrance)";
    host.appendChild(t);
    setTimeout(function () {
      t.style.transition = "opacity var(--duration-base) var(--ease-standard), transform var(--duration-base) var(--ease-standard)";
      t.style.opacity = "0"; t.style.transform = "translateY(-6px)";
      setTimeout(function () { t.remove(); }, 200);
    }, 2600);
  };

  /* ---- Removable tag demo ---- */
  document.addEventListener("click", function (e) {
    var x = e.target.closest(".tag button");
    if (x) { var tag = x.closest(".tag"); if (tag) tag.remove(); }
  });

  /* ---- Loading button demo ---- */
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-loading-demo]");
    if (!b || b.getAttribute("aria-disabled") === "true") return;
    var original = b.innerHTML;
    b.setAttribute("aria-disabled", "true");
    b.innerHTML = '<span class="spinner"></span>Drafting…';
    setTimeout(function () { b.innerHTML = original; b.removeAttribute("aria-disabled"); }, 1800);
  });
})();
