/* studio-ideas-spec.js — assembles the web/desktop Ideas state gallery. Builds
   real composer cards (studio.css + studio-ideas.css) inside token-pinned `.cf`
   frames; each frame flips light/dark independently via ds/tokens `.dark`. */
(function () {
  const I = window.IDEAS;
  const { composerWeb, panel, ideaCard, head, ic, IDEAS_DATA } = I;

  const cf = (html, dark) => `<div class="cf${dark ? " dark" : ""}">${html}</div>`;
  const hLight = (l) => `<span class="dh-dot"></span>${l || "Light"}`;
  const hDark = (l) => `<span class="dh-dot dh-dot--dark"></span>${l || "Dark"}`;
  const col = (heading, frame, cap) => `<div class="devcol"><div class="devhead">${heading}</div>${frame}${cap ? `<div class="devcap">${cap}</div>` : ""}</div>`;
  const wcol = (label, dark, html, cap) => col((dark ? hDark : hLight)(label), cf(html, dark), cap);
  const set = (id, html) => { const e = document.getElementById(id); if (e) e.innerHTML = html; };
  const stage = (...c) => c.join("");

  /* 0 — placement */
  set("stg-anatomy", stage(
    wcol("Idle — chip at rest", false, composerWeb({ chip: {} }),
      "The accent <b>✨ Ideas</b> pill leads a single horizontal-scroll chip row (right edge-fade); the count select + Generate stay flush on the same line. Nothing else is restyled."),
    wcol("Open — panel inline", false, composerWeb({ chip: { active: true }, panel: panel("results", { n: 5 }) }),
      "Tapping Ideas opens the panel inline under the action row (its own divider), above the draft feed. ~8 ideas; the list caps its height and scrolls.")
  ));

  /* new icon */
  set("stg-icon",
    `<div class="iconcell"><span class="iconcell-glyph">${ic("reload", 24)}</span><code>IcReload</code><span class="ic-new">new · icons.tsx</span></div>`
    + `<div class="iconcell"><span class="iconcell-glyph">${ic("sparkle", 24)}</span><code>IcSparkle</code><span class="ic-new" style="color:var(--subtle)">reused</span></div>`
    + `<div class="iconcell"><span class="iconcell-glyph">${ic("x", 24)}</span><code>IcX</code><span class="ic-new" style="color:var(--subtle)">reused</span></div>`
    + `<div class="iconcell"><span class="iconcell-glyph">${ic("arrow-up", 24)}</span><code>IcArrowUp</code><span class="ic-new" style="color:var(--subtle)">reused</span></div>`
  );

  /* 1 — chip states */
  set("stg-chip", stage(
    wcol("Idle", false, composerWeb({ chip: {} }), "At rest among the neutral chips — accent tint + sparkle, first in the row."),
    wcol("Disabled · no active voice", false, composerWeb({ chip: { disabled: "voice" } }), "Voice not set up yet → disabled chip + a wrapping hint."),
    wcol("Disabled · no account", true, composerWeb({ chip: { disabled: "account" } }), "No connected account → disabled with its own hint — dark.")
  ));

  /* 2 — loading */
  set("stg-loading", stage(
    wcol("Loading", false, composerWeb({ chip: { active: true }, panel: panel("loading") }),
      "Chip pressed — the sparkle pulses and the chip is disabled while it works. “Brainstorming…” over three shimmer placeholders."),
    wcol("Loading · dark", true, composerWeb({ chip: { active: true }, panel: panel("loading") }),
      "Identical, dark tokens.")
  ));

  /* 3 — results */
  set("stg-results", stage(
    wcol("Results", false, composerWeb({ chip: { active: true }, panel: panel("results") }),
      "Header (caption + refresh + close) over the list — each card a bold hook + a muted angle."),
    wcol("Results · dark", true, composerWeb({ chip: { active: true }, panel: panel("results") }),
      "Same panel, dark tokens.")
  ));

  /* 4 — card hover + after-pick */
  set("stg-card", stage(
    wcol("Card hover / press", false, composerWeb({ chip: { active: true }, panel: panel("results", { n: 4, hoverIdx: 1 }) }),
      "Hover/focus → accent border + faint accent tint + the “Use ↑” affordance."),
    wcol("After pick — hook seeded", false, composerWeb({ value: IDEAS_DATA[1].hook, chip: {}, seeded: true }),
      "Tapping a card <b>replaces</b> the editor text with that hook and closes the panel. Generate is now enabled.")
  ));

  /* 5 — error & empty */
  set("stg-state", stage(
    wcol("Error", false, composerWeb({ chip: { active: true }, panel: panel("error") }),
      "“Couldn’t get ideas.” + a quiet Try again (model down, <code>503</code>)."),
    wcol("Empty · dark", true, composerWeb({ chip: { active: true }, panel: panel("empty") }),
      "“No ideas right now.” Rare — no voice / posts to riff from (<code>422</code>) — dark.")
  ));

  /* localization — long DE copy proves wrapping */
  const DE = [
    { hook: "Der schnellste Weg, deine eigene Stimme zu finden: Veröffentliche genau das, was dir ein kleines bisschen peinlich ist.",
      angle: "Verletzlichkeit — die unperfekte Fassung gehört dir, die geschliffene gehört allen." },
    { hook: "Jeden Tag zu schreiben hat mich nicht zu einem besseren Autor gemacht. Jeden Tag zu veröffentlichen schon.",
      angle: "Konträre These zu Üben gegen tatsächliches Versenden." },
    { hook: "Jemand hat gefragt, woher ich meine Ideen nehme. Die ehrliche Antwort: Ich habe nur aufgehört, sie wegzuwerfen.",
      angle: "Prozess-Beitrag — festhalten statt erzwingen." },
  ];
  const dePanel = `<div class="ideas-panel">${head()}<div class="ideas-list">${DE.map((d) => ideaCard(d)).join("")}</div></div>`;
  set("stg-loc", stage(
    wcol("DE · long copy wraps", false, composerWeb({ chip: { active: true }, panel: dePanel }),
      "DE/RU run ~30–40% longer than EN. Hooks and angles wrap to as many lines as they need; the chip label and the “Ideas in your voice” caption never clip.")
  ));

  /* ===================== icon refresh — 3 primary actions ===================== */
  const swap2 = (name, was, oldId, newId, cap) =>
    `<div class="iconswap"><div class="iconswap-h"><code>${name}</code><span class="was">was ${was}</span></div>`
    + `<div class="iconswap-row"><span class="iconswap-g old">${ic(oldId, 22)}</span>`
    + `<span class="iconswap-arrow">${ic("chev-right", 16)}</span>`
    + `<span class="iconswap-g new">${ic(newId, 22)}</span></div>`
    + `<div class="iconswap-cap">${cap}</div></div>`;
  set("stg-iconswap",
    swap2("IcGenerate", "IcNib", "nib", "gen", "Lines of text drawn by a pen — reads “draft this for me”.")
    + swap2("IcApprove", "IcCheck", "check", "approve", "A check inside a circle — a deliberate “approve”, distinct from a bare check.")
    + swap2("IcPublish", "IcStudio", "studio", "publish", "A paper-plane — “publish / send to Threads”.")
  );

  // the three buttons in context, at real sizes
  const btnDemo = () =>
    `<div class="btnstack">`
    + `<div><div class="bs-cap">Composer · Generate</div><div class="bs-row"><button class="btn btn--primary">${ic("gen", 16)}Generate</button></div></div>`
    + `<div><div class="bs-cap">Draft card · Approve</div><div class="bs-row"><button class="btn btn--primary btn--sm">${ic("approve", 15)}Approve</button></div></div>`
    + `<div><div class="bs-cap">Approved · Publish to Threads</div><div class="bs-row"><button class="btn btn--primary btn--sm">${ic("publish", 15)}Publish to Threads</button></div></div>`
    + `<div><div class="bs-cap">Publish dialog · confirm (now matches Publish)</div><div class="bs-row"><button class="btn btn--ghost btn--sm">Cancel</button><button class="btn btn--primary btn--sm">${ic("publish", 15)}Publish now</button></div></div>`
    + `</div>`;
  set("stg-iconbtns", stage(
    wcol("Buttons · light", false, btnDemo(), "Generate, Approve, Publish to Threads, and the dialog confirm — all on the real <code>.btn--primary</code> at shipped sizes."),
    wcol("Buttons · dark", true, btnDemo(), "Same, dark tokens — the new glyphs hold up at 15–16px.")
  ));
})();
