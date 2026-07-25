/* studio-thread-spec.js — assembles the web/desktop thread-chains gallery. Real
   draft cards (studio.css + studio-thread.css; media from compose-media.css) in
   token-pinned `.cf` frames that flip light/dark independently via ds/tokens. */
(function () {
  const T = window.THREAD;
  const cf = (html, dark) => `<div class="cf${dark ? " dark" : ""}">${html}</div>`;
  const hLight = (l) => `<span class="dh-dot"></span>${l || "Light"}`;
  const hDark = (l) => `<span class="dh-dot dh-dot--dark"></span>${l || "Dark"}`;
  const col = (heading, frame, cap) => `<div class="devcol"><div class="devhead">${heading}</div>${frame}${cap ? `<div class="devcap">${cap}</div>` : ""}</div>`;
  const wcol = (label, dark, html, cap) => col((dark ? hDark : hLight)(label), cf(html, dark), cap);
  const set = (id, html) => { const e = document.getElementById(id); if (e) e.innerHTML = html; };
  const stage = (...c) => c.join("");

  /* 0 — placement: single (edit) + thread (view) side by side */
  set("stg-anatomy", stage(
    wcol("Edit · single post", false, T.build("edit-single", false), "Editor + char-meter + the “New part” pill that turns a single post into a thread."),
    wcol("View · thread", false, T.build("view-draft", false), "The same card with <code>---</code> parts: a “Thread · 3” badge over stacked part cards.")
  ));

  /* new icon */
  set("stg-icon",
    `<div class="iconcell"><span class="iconcell-glyph">${T.ic("thread", 24)}</span><code>IcThread</code><span class="ic-new">new · icons.tsx</span></div>`
    + `<div class="iconcell"><span class="iconcell-glyph">${T.ic("external", 24)}</span><code>IcExternal</code><span class="ic-new" style="color:var(--subtle)">reused</span></div>`
  );

  /* 1 — edit single */
  set("stg-single", stage(
    wcol("Edit · single", false, T.build("edit-single", false), "Normal char-meter; “New part” available."),
    wcol("Edit · single · dark", true, T.build("edit-single", false), "Same, dark tokens.")
  ));

  /* 2 — edit thread */
  set("stg-thread", stage(
    wcol("Edit · thread", false, T.build("edit-thread", false), "Per-part counters replace the char-meter; <code>---</code> reads literally."),
    wcol("Edit · thread · dark", true, T.build("edit-thread", false), "Same, dark tokens.")
  ));

  /* 3 — edit over 500 */
  set("stg-over", stage(
    wcol("Edit · Part 2 over 500", false, T.build("edit-over", false), "Counter danger/bold; over-limit hint; Save disabled — approve/publish blocked."),
    wcol("Over · dark", true, T.build("edit-over", false), "Same, dark tokens.")
  ));

  /* 4 — view draft */
  set("stg-view", stage(
    wcol("View · thread draft", false, T.build("view-draft", false), "Badge + stacked soft part cards, chained; lead tagged; ⋯ + Approve."),
    wcol("View · draft · dark", true, T.build("view-draft", false), "Same, dark tokens.")
  ));

  /* 5 — view published */
  set("stg-pub", stage(
    wcol("View · published", false, T.build("view-published", false), "Muted parts + stats + “Open in Threads”."),
    wcol("Published · dark", true, T.build("view-published", false), "Same, dark tokens.")
  ));

  /* 6 — thread + media */
  set("stg-media", stage(
    wcol("Thread · media on lead", false, T.build("view-media", false), "Media rides Post 1 with an “attached to the first post” cue; follow-up parts text-only."),
    wcol("Media on lead · dark", true, T.build("view-media", false), "Same, dark tokens.")
  ));
})();
