/* studio-ideas-mobile-spec.js — assembles the phone (390px) Ideas state gallery.
   Builds the real mobile composer (pennedly-mobile.css + studio-ideas.css) inside
   device bezels from mobile/frame.css; uses MOCK for the device shell + an
   in-context Studio screen. */
(function () {
  const I = window.IDEAS;
  const M = window.MOCK;
  const { composerMob, panel, IDEAS_DATA, ideaCard, head } = I;

  const set = (id, html) => { const e = document.getElementById(id); if (e) e.innerHTML = html; };
  const stage = (...c) => c.join("");
  // isolated composer in an auto-height bezel
  const pcol = (label, dark, html, cap, sm) =>
    M.col((dark ? M.dark : M.light)(label), M.comp(html, { dark, sm }), cap);

  const top = M.top({ title: "Studio", pill: "success", menu: true });

  /* 1 — in context: top bar, composer + open panel, filter row, a draft card */
  set("stg-context", stage(
    M.col(M.light("In context"),
      M.phone({ top, tabs: false, body:
        composerMob({ chip: { active: true }, panel: panel("results", { n: 4 }) })
        + M.filterbar("ready") + M.studioCard("ready") }),
      "The Ideas panel open inline — it pushes the sticky filter row and feed down, the shipped placement."),
    M.col(M.dark("In context · dark"),
      M.phone({ dark: true, top, tabs: false, body:
        composerMob({ chip: { active: true }, panel: panel("results", { n: 4 }) })
        + M.filterbar("ready") + M.studioCard("ready") }),
      "Identical layout, dark tokens.")
  ));

  /* 3 — chip states */
  set("stg-chip", stage(
    pcol("Idle", false, composerMob({ chip: {} }), "Accent pill leads the scroller; chips keep full size, right edge-fade."),
    pcol("Disabled · no voice", false, composerMob({ chip: { disabled: "voice" } }), "Dimmed chip; the hint rides the scroller as one line."),
    pcol("Disabled · no account · dark", true, composerMob({ chip: { disabled: "account" } }), "Same, dark.")
  ));

  /* 4 — loading */
  set("stg-loading", stage(
    pcol("Loading", false, composerMob({ chip: { active: true }, panel: panel("loading") }), "Sparkle pulses; “Brainstorming…” over shimmer placeholders."),
    pcol("Loading · dark", true, composerMob({ chip: { active: true }, panel: panel("loading") }), "Dark tokens.")
  ));

  /* 5 — results */
  set("stg-results", stage(
    pcol("Results", false, composerMob({ chip: { active: true }, panel: panel("results", { n: 6 }) }), "Header (caption + 44px refresh + close) over the list of hooks + angles."),
    pcol("Results · dark", true, composerMob({ chip: { active: true }, panel: panel("results", { n: 6 }) }), "Same panel, dark.")
  ));

  /* 6 — card press + after-pick */
  set("stg-card", stage(
    pcol("Card pressed", false, composerMob({ chip: { active: true }, panel: panel("results", { n: 4, hoverIdx: 1 }) }), "Accent border + faint tint; “Use ↑” stays visible on touch."),
    pcol("After tap — hook seeded", false, composerMob({ value: IDEAS_DATA[1].hook, chip: {}, seeded: true }), "The hook <b>replaces</b> the editor text + closes the panel; Generate enables.")
  ));

  /* 7 — error & empty */
  set("stg-state", stage(
    pcol("Error", false, composerMob({ chip: { active: true }, panel: panel("error") }), "“Couldn’t get ideas.” + a ≥44px Try again (503)."),
    pcol("Empty · dark", true, composerMob({ chip: { active: true }, panel: panel("empty") }), "“No ideas right now.” — no voice/posts yet (422) — dark.")
  ));

  /* 8 — localization & 360 */
  const DE = [
    { hook: "Der schnellste Weg, deine eigene Stimme zu finden: Veröffentliche genau das, was dir ein kleines bisschen peinlich ist.",
      angle: "Verletzlichkeit — die unperfekte Fassung gehört dir, die geschliffene gehört allen." },
    { hook: "Jeden Tag zu schreiben hat mich nicht zu einem besseren Autor gemacht. Jeden Tag zu veröffentlichen schon.",
      angle: "Konträre These zu Üben gegen tatsächliches Versenden." },
    { hook: "Jemand hat gefragt, woher ich meine Ideen nehme. Die ehrliche Antwort: Ich habe nur aufgehört, sie wegzuwerfen.",
      angle: "Prozess-Beitrag — festhalten statt erzwingen." },
  ];
  const dePanel = `<div class="ideas-panel">${head()}<div class="ideas-list">${DE.map((d) => ideaCard(d)).join("")}</div></div>`;
  set("stg-narrow", stage(
    pcol("DE · long copy", false, composerMob({ chip: { active: true }, panel: dePanel }), "Hooks + angles wrap; chip label + caption never clip."),
    pcol("360px", false, composerMob({ chip: { active: true }, panel: panel("results", { n: 4 }) }), "Same rules ~30px narrower; the chip row absorbs it by scrolling.", true)
  ));

  /* icon refresh — the three buttons at mobile 44px sizes */
  const ic = I.ic;
  const mbtns = () =>
    `<div style="display:flex;flex-direction:column;gap:14px;padding:2px">`
    + `<div><div style="font-family:var(--font-mono);font-size:11px;color:var(--color-text-subtle);margin-bottom:7px">Composer · Generate</div>`
    + `<button class="btn btn--primary m-gen" style="width:100%">${ic("gen", 16)}Generate</button></div>`
    + `<div><div style="font-family:var(--font-mono);font-size:11px;color:var(--color-text-subtle);margin-bottom:7px">Draft card · Approve</div>`
    + `<div style="display:flex;gap:8px"><button class="btn btn--ghost m-btn">${ic("more", 16)}</button><button class="btn btn--primary m-btn m-btn--grow">${ic("approve", 16)}Approve</button></div></div>`
    + `<div><div style="font-family:var(--font-mono);font-size:11px;color:var(--color-text-subtle);margin-bottom:7px">Approved · Publish to Threads</div>`
    + `<div style="display:flex;gap:8px"><button class="btn btn--ghost m-btn">${ic("more", 16)}</button><button class="btn btn--primary m-btn m-btn--grow">${ic("publish", 16)}Publish to Threads</button></div></div>`
    + `</div>`;
  set("stg-iconbtns", stage(
    pcol("Buttons · light", false, mbtns(), "Generate (full-width), Approve and Publish (grow + 44px ⋯) with the new glyphs."),
    pcol("Buttons · dark", true, mbtns(), "Same, dark tokens.")
  ));
})();
