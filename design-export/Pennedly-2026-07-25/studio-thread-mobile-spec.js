/* studio-thread-mobile-spec.js — assembles the phone (390px) thread-chains gallery.
   Real mobile draft cards (pennedly-mobile.css + studio-thread.css; media from
   compose-media.css) inside device bezels (mobile/frame.css); MOCK supplies the
   device shell + an in-context Studio screen. */
(function () {
  const T = window.THREAD;
  const M = window.MOCK;
  const set = (id, html) => { const e = document.getElementById(id); if (e) e.innerHTML = html; };
  const stage = (...c) => c.join("");
  const pcol = (label, dark, html, cap, sm) =>
    M.col((dark ? M.dark : M.light)(label), M.comp(html, { dark, sm }), cap);

  const top = M.top({ title: "Studio", pill: "success", menu: true });

  /* 1 — in context */
  set("stg-context", stage(
    M.col(M.light("In context"),
      M.phone({ top, tabs: false, body: M.filterbar("draft") + T.build("view-draft", true) }),
      "A thread card in the feed — “Thread · 3” badge over stacked full-width part cards."),
    M.col(M.dark("In context · dark"),
      M.phone({ dark: true, top, tabs: false, body: M.filterbar("draft") + T.build("view-draft", true) }),
      "Identical layout, dark tokens.")
  ));

  /* 2 — edit single */
  set("stg-single", stage(
    pcol("Edit · single", false, T.build("edit-single", true), "16px editor + char-meter + 44px “New part” pill."),
    pcol("Edit · single · dark", true, T.build("edit-single", true), "Same, dark.")
  ));

  /* 3 — edit thread */
  set("stg-thread", stage(
    pcol("Edit · thread", false, T.build("edit-thread", true), "Per-part counters wrap; <code>---</code> reads literally."),
    pcol("Edit · thread · dark", true, T.build("edit-thread", true), "Same, dark.")
  ));

  /* 4 — edit over */
  set("stg-over", stage(
    pcol("Edit · Part 2 over 500", false, T.build("edit-over", true), "Counter danger/bold + hint; Save disabled."),
    pcol("Over · dark", true, T.build("edit-over", true), "Same, dark.")
  ));

  /* 5 — view draft */
  set("stg-view", stage(
    pcol("View · thread draft", false, T.build("view-draft", true), "Stacked full-width parts, chained; ⋯ + Approve."),
    pcol("View · draft · dark", true, T.build("view-draft", true), "Same, dark.")
  ));

  /* 6 — view published */
  set("stg-pub", stage(
    pcol("View · published", false, T.build("view-published", true), "Muted + stats + Open in Threads (grows)."),
    pcol("Published · dark", true, T.build("view-published", true), "Same, dark.")
  ));

  /* 7 — thread + media */
  set("stg-media", stage(
    pcol("Thread · media on lead", false, T.build("view-media", true), "Media on Post 1 + cue; follow-ups text-only; thumbs scroll."),
    pcol("Media on lead · dark", true, T.build("view-media", true), "Same, dark.")
  ));

  /* 8 — localization & 360 */
  const DE = [
    "Hör auf, deinen ersten Satz zu optimieren. Optimiere den Grund, warum jemandem deine Worte beim dritten Satz noch wichtig sein sollten.",
    "Aufhänger verblassen im Scrollen; Substanz ist das, was sich summiert. Schreib die zweite Zeile für die Menschen, die schon geblieben sind — nicht für die, die du noch einfangen willst.",
    "Und wenn es fertig ist, streiche den Teil, auf den du am stolzesten bist. Neun von zehn Mal ist es der Satz, der von dir handelt, nicht von ihnen.",
  ];
  const deCard = `<article class="m-card">${T.headMob("draft")}${T.threadView({ parts: DE })}${T.footMob("draft")}</article>`;
  set("stg-narrow", stage(
    pcol("DE · long copy", false, deCard, "Counters + “Part N” wrap; the badge never clips."),
    pcol("360px", false, T.build("view-draft", true), "Same rules ~30px narrower.", true)
  ));
})();
