/* ds/data.js — renders color swatches, spacing scale, and the token table. */
(function () {
  "use strict";
  var $ = function (s) { return document.querySelector(s); };
  var el = function (tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

  /* ---------- Ink scale ---------- */
  var ink = [
    ["50","#f9f8f6"],["100","#ededed"],["200","#ddddda"],["300","#c8c7c3"],
    ["400","#a2a19c"],["500","#7b7a74"],["600","#565550"],["700","#3c3b37"],
    ["800","#262521"],["900","#171717"],["950","#0a0a0a"]
  ];
  var inkHost = $("#ink-scale");
  if (inkHost) ink.forEach(function (p) {
    var s = el("div", "swatch");
    s.appendChild(el("div", "chip", "")).style.background = p[1];
    var m = el("div", "meta");
    m.appendChild(el("div", "nm", "ink-" + p[0]));
    m.appendChild(el("div", "hex", p[1]));
    s.appendChild(m); inkHost.appendChild(s);
  });

  /* ---------- Semantic roles (live swatch, reflects theme) ---------- */
  var roles = [
    ["--color-bg","Page background"],["--color-surface","Cards, panels"],
    ["--color-surface-2","Inset · hover · alt rows"],["--color-border","Hairlines · input outlines"],
    ["--color-text","Primary text & marks"],["--color-text-muted","Secondary text"],
    ["--color-text-subtle","Placeholders · captions"],["--color-primary","Primary action"]
  ];
  var rHost = $("#roles");
  if (rHost) roles.forEach(function (p) {
    var r = el("div", "role");
    var d = el("div", "dot"); d.style.background = "var(" + p[0] + ")"; r.appendChild(d);
    var t = el("div"); t.appendChild(el("div", "nm", p[0])); t.appendChild(el("div", "use", p[1]));
    r.appendChild(t); rHost.appendChild(r);
  });

  var accents = [
    ["--color-accent","Links · focus · selection"],["--color-success","Positive status"],
    ["--color-warning","Caution"],["--color-danger","Destructive · error"]
  ];
  var aHost = $("#accents");
  if (aHost) accents.forEach(function (p) {
    var r = el("div", "role");
    var d = el("div", "dot"); d.style.background = "var(" + p[0] + ")"; r.appendChild(d);
    var t = el("div"); t.appendChild(el("div", "nm", p[0])); t.appendChild(el("div", "use", p[1]));
    r.appendChild(t); aHost.appendChild(r);
  });

  /* ---------- Spacing scale ---------- */
  var steps = [["1","4"],["2","8"],["3","12"],["4","16"],["6","24"],["8","32"],["12","48"],["16","64"]];
  var sHost = $("#spacing-scale");
  if (sHost) steps.forEach(function (p) {
    var c = el("div"); c.style.cssText = "display:flex;flex-direction:column;align-items:center;gap:8px";
    var b = el("div"); b.style.cssText = "width:" + p[1] + "px;height:" + p[1] + "px;background:var(--color-ink-900);border-radius:3px";
    var l = el("div", null, p[1]); l.style.cssText = "font-family:var(--font-mono);font-size:11px;color:var(--color-text-subtle)";
    var k = el("div", null, "·" + p[0]); k.style.cssText = "font-family:var(--font-mono);font-size:10px;color:var(--color-text-subtle);opacity:.7";
    c.appendChild(b); c.appendChild(l); c.appendChild(k); sHost.appendChild(c);
  });

  /* ---------- Token reference table ---------- */
  function sw(v) { return v.charAt(0) === "#" ? '<span class="vswatch" style="background:' + v + '"></span>' + v : v; }
  var groups = [
    ["Semantic color · light / dark", [
      ["--color-bg","#efedea","#0a0a0a","Page background (warm paper / deepest ink)"],
      ["--color-surface","#ffffff","#171717","Cards, panels, menus"],
      ["--color-surface-2","#f6f5f2","#201f1d","Inset areas, hover, alternating rows"],
      ["--color-border","#dcd9d2","#2b2a27","Hairlines, dividers, input outlines"],
      ["--color-text","#171717","#ededed","Primary text & icon marks"],
      ["--color-text-muted","#565550","#a2a19c","Secondary / supporting text"],
      ["--color-text-subtle","#6f6e69","#898882","Placeholders, captions, timestamps"],
      ["--color-primary","#171717","#ededed","Primary action background (ink)"],
      ["--color-primary-foreground","#ededed","#171717","Text/icon on primary"],
      ["--color-accent","#2f4cc4","#9aacff","Links, focus ring, selection, active nav"],
      ["--color-accent-foreground","#ffffff","#0a0a0a","Text/icon on a solid accent fill"],
      ["--color-success","#2c7350","#5fbf8d","Positive status & fills"],
      ["--color-success-foreground","#ffffff","#0a0a0a","Text on success"],
      ["--color-warning","#8a5b16","#d8a754","Caution status & fills"],
      ["--color-warning-foreground","#ffffff","#0a0a0a","Text on warning"],
      ["--color-danger","#b23b30","#ef8a80","Destructive actions & errors"],
      ["--color-danger-foreground","#ffffff","#0a0a0a","Text on danger"]
    ]],
    ["Radius", [
      ["--radius-sm","6px","6px","Chips, small inputs, focus-clip"],
      ["--radius-md","10px","10px","Buttons, inputs, small cards"],
      ["--radius-lg","14px","14px","Cards, panels, toasts"],
      ["--radius-xl","20px","20px","Large panels, popovers"],
      ["--radius-2xl","28px","28px","Modals, hero surfaces"],
      ["--radius-full","9999px","9999px","Pills, switches, avatars"]
    ]],
    ["Elevation", [
      ["--shadow-sm","ink / 6%","black / 50%","Resting cards"],
      ["--shadow-md","ink / 8%","black / 60%","Popovers, menus, dropdowns"],
      ["--shadow-lg","ink / 16%","black / 70%","Modals, toasts (overlays only)"]
    ]],
    ["Type (size · line-height · weight)", [
      ["--text-display","48 · 1.05 · 600","—","Marketing / empty-state hero"],
      ["--text-h1","32 · 1.15 · 600","—","Page titles"],
      ["--text-h2","24 · 1.2 · 600","—","Section headings"],
      ["--text-h3","19 · 1.3 · 600","—","Card / group headings"],
      ["--text-body","15 · 1.6 · 400","—","Default body & UI text"],
      ["--text-small","13 · 1.5 · 400","—","Dense UI, secondary rows"],
      ["--text-caption","12 · 1.4 · 500","—","Labels, eyebrows, badges"]
    ]],
    ["Motion & spacing", [
      ["--duration-fast","120ms","120ms","Hovers, tap feedback"],
      ["--duration-base","180ms","180ms","Color & state changes"],
      ["--duration-slow","240ms","240ms","Overlays, dialogs"],
      ["--ease-standard","(.2,.7,.3,1)","—","Most transitions"],
      ["--ease-entrance","(.16,1,.3,1)","—","Enters, overlays"],
      ["--spacing","0.25rem","0.25rem","4px base grid unit"]
    ]]
  ];
  var tbl = $("#token-table");
  if (tbl) {
    var thead = el("thead", null, "<tr><th>Token</th><th>Light</th><th>Dark</th><th>When to use</th></tr>");
    tbl.appendChild(thead);
    var tbody = el("tbody");
    groups.forEach(function (g) {
      var gr = el("tr", "grp-row", '<td colspan="4">' + g[0] + "</td>");
      tbody.appendChild(gr);
      g[1].forEach(function (row) {
        var tr = el("tr");
        tr.appendChild(el("td", "tk", row[0]));
        tr.appendChild(el("td", "val", sw(row[1])));
        tr.appendChild(el("td", "val", sw(row[2])));
        tr.appendChild(el("td", null, row[3]));
        tbody.appendChild(tr);
      });
    });
    tbl.appendChild(tbody);
  }
})();
