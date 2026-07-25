/* studio-schedule-mobile-spec.js — assembles the phone (390px) scheduling gallery.
   Real mobile cards + a bottom-sheet dialog (pennedly-mobile.css + calendar.css +
   studio-schedule.css) inside device bezels (mobile/frame.css); MOCK supplies the
   device shell + status bar/top for the sheet frames. */
(function () {
  const S = window.SCHED;
  const M = window.MOCK;
  const set = (id, html) => { const e = document.getElementById(id); if (e) e.innerHTML = html; };
  const stage = (...c) => c.join("");
  const pcol = (label, dark, html, cap, sm) =>
    M.col((dark ? M.dark : M.light)(label), M.comp(html, { dark, sm }), cap);

  // a tall phone showing the bottom sheet over a ready-card backdrop
  function sheetPhone(mode, dark) {
    return `<div class="device device--tall"><div class="device-screen mob${dark ? " dark" : ""}">`
      + M.statusbar() + M.top({ title: "Studio", pill: "success", menu: true })
      + `<div class="m-scroll"><div class="m-content m-content--notab">${S.readyCardMob("A")}</div></div>`
      + `<div class="m-scrim"></div>${S.sheetMob(mode)}</div></div>`;
  }
  const scol = (label, dark, mode, cap) => M.col((dark ? M.dark : M.light)(label), sheetPhone(mode, dark), cap);

  /* 1 — entry point (finalized on Option A) */
  set("stg-entry", stage(
    pcol("Ready card · Schedule + Publish", false, S.readyCardMob(), "44px ⋯ + labelled Schedule + Publish. “Schedule for later” is on the card; Publish stays one tap."),
    pcol("Ready card · dark", true, S.readyCardMob(), "Same, dark tokens.")
  ));

  /* 2 — sheet publish now */
  set("stg-now", stage(
    scol("Publish now", false, "now", "Bottom sheet; primary “Publish now” on top."),
    scol("Publish now · dark", true, "now", "Same, dark.")
  ));

  /* 3 — sheet schedule empty */
  set("stg-empty", stage(
    scol("Schedule · empty", false, "sched-empty", "Date + Time stacked; Schedule disabled."),
    scol("Empty · dark", true, "sched-empty", "Same, dark.")
  ));

  /* 4 — sheet schedule valid */
  set("stg-valid", stage(
    scol("Schedule · valid", false, "sched-valid", "“= 14:30 UTC · at least 5 min out”; primary enabled."),
    scol("Valid · dark", true, "sched-valid", "Same, dark.")
  ));

  /* 5 — sheet too soon */
  set("stg-soon", stage(
    scol("Schedule · too soon", false, "sched-soon", "Danger hint; Schedule disabled."),
    scol("Too soon · dark", true, "sched-soon", "Same, dark.")
  ));

  /* 6 — scheduled card */
  set("stg-card", stage(
    pcol("Scheduled card", false, S.scheduledCardMob(false), "Accent badge + “Goes out …” + full-width Manage-on-Calendar."),
    pcol("⋯ open · routes out", false, S.scheduledCardMob(true), "Read-only menu — Reschedule / Unschedule / Publish now open the Calendar."),
    pcol("Scheduled · dark", true, S.scheduledCardMob(false), "Same, dark.")
  ));

  /* 7 — scheduled tab */
  set("stg-tab", stage(
    pcol("Scheduled tab", false, S.tabsMob(), "Filter scrolls; “Scheduled” (accent dot) between Ready and Published."),
    pcol("Scheduled tab · dark", true, S.tabsMob(), "Same, dark.")
  ));

  /* 8 — scheduled empty */
  set("stg-emptytab", stage(
    pcol("Scheduled empty", false, S.emptyScheduledMob(), "Per-tab empty + Calendar CTA."),
    pcol("Empty · dark", true, S.emptyScheduledMob(), "Same, dark.")
  ));
})();
