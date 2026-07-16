/* studio-schedule-spec.js — assembles the web/desktop scheduling gallery. Real
   cards + dialog (studio.css + calendar.css + studio-schedule.css) in token-pinned
   `.cf` frames that flip light/dark independently via ds/tokens. */
(function () {
  const S = window.SCHED;
  const cf = (html, dark, tall) => `<div class="cf${dark ? " dark" : ""}${tall ? " cf--tall" : ""}">${html}</div>`;
  const hLight = (l) => `<span class="dh-dot"></span>${l || "Light"}`;
  const hDark = (l) => `<span class="dh-dot dh-dot--dark"></span>${l || "Dark"}`;
  const hRec = (l) => `<span class="dh-dot dh-dot--rec"></span>${l}`;
  const col = (heading, frame, cap) => `<div class="devcol"><div class="devhead">${heading}</div>${frame}${cap ? `<div class="devcap">${cap}</div>` : ""}</div>`;
  const wcol = (label, dark, html, cap) => col((dark ? hDark : hLight)(label), cf(html, dark), cap);
  const set = (id, html) => { const e = document.getElementById(id); if (e) e.innerHTML = html; };
  const stage = (...c) => c.join("");

  /* 1 — entry point (finalized on Option A) */
  set("stg-entry", stage(
    wcol("Ready card · Schedule + Publish", false, S.readyCardWeb(),
      "The finalized entry: ⋯ + a labelled <b>Schedule</b> (clock) + <b>Publish</b> (primary). “Schedule for later” is visible on the card; Publish stays one tap."),
    wcol("Ready card · dark", true, S.readyCardWeb(),
      "Same, dark tokens.")
  ));

  /* 2 — dialog publish now */
  set("stg-now", stage(
    col(hLight("Publish now"), cf(S.readyCardWeb("A") + S.dialogWeb("now"), false, true), "Default mode; primary “Publish now”. The segmented control is the escape hatch."),
    col(hDark("Publish now · dark"), cf(S.readyCardWeb("A") + S.dialogWeb("now"), true, true), "Same, dark tokens.")
  ));

  /* 3 — dialog schedule empty */
  set("stg-empty", stage(
    col(hLight("Schedule · empty"), cf(S.readyCardWeb("A") + S.dialogWeb("sched-empty"), false, true), "Empty Date/Time; Schedule disabled until a valid time is set."),
    col(hDark("Schedule · empty · dark"), cf(S.readyCardWeb("A") + S.dialogWeb("sched-empty"), true, true), "Same, dark tokens.")
  ));

  /* 4 — dialog schedule valid */
  set("stg-valid", stage(
    col(hLight("Schedule · valid"), cf(S.readyCardWeb("A") + S.dialogWeb("sched-valid"), false, true), "“= 14:30 UTC · at least 5 min out”; primary enabled."),
    col(hDark("Schedule · valid · dark"), cf(S.readyCardWeb("A") + S.dialogWeb("sched-valid"), true, true), "Same, dark tokens.")
  ));

  /* 5 — dialog schedule too soon */
  set("stg-soon", stage(
    col(hLight("Schedule · too soon"), cf(S.readyCardWeb("A") + S.dialogWeb("sched-soon"), false, true), "&lt; 5 min out → danger hint; Schedule disabled; picked time persists."),
    col(hDark("Too soon · dark"), cf(S.readyCardWeb("A") + S.dialogWeb("sched-soon"), true, true), "Same, dark tokens.")
  ));

  /* 6 — scheduled card (menu open in the 2nd frame) */
  set("stg-card", stage(
    wcol("Scheduled card", false, S.scheduledCardWeb(false), "Accent “Scheduled” badge + “Goes out …” foot + a Manage-on-Calendar link."),
    col(hLight("⋯ open · routes to Calendar"), cf(`<div style="padding-top:90px">${S.scheduledCardWeb(true)}</div>`), "The ⋯-menu is read-only in Studio — Reschedule / Unschedule / Publish now all open the Calendar."),
    wcol("Scheduled · dark", true, S.scheduledCardWeb(false), "Same, dark tokens.")
  ));

  /* 7 — scheduled tab */
  set("stg-tab", stage(
    wcol("Scheduled tab active", false, S.tabsWeb(), "A status tab between Ready and Published; accent dot."),
    wcol("Scheduled tab · dark", true, S.tabsWeb(), "Same, dark tokens.")
  ));

  /* 8 — scheduled empty */
  set("stg-emptytab", stage(
    wcol("Scheduled empty", false, S.emptyScheduledWeb(), "Per-tab empty state with a Calendar CTA."),
    wcol("Empty · dark", true, S.emptyScheduledWeb(), "Same, dark tokens.")
  ));
})();
