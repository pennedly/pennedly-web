/* studio-schedule-build.js — string builders for Studio's scheduling touchpoints:
   the NEW card entry point (3 options), the publish/schedule dialog (4 modes),
   the scheduled card, the Scheduled tab + its empty state — for web (feed column)
   and phone (390px), light + dark. Built on the real product layers (studio.css +
   calendar.css scheduling controls + studio-schedule.css) over ds/tokens.css.
   Icons from the shared sprite — NO new icon is needed (clock/send/check/caret
   all exist). */
(function () {
  const A = "../../assets/avatars/";
  const ic = (id, s) => `<svg style="width:${s}px;height:${s}px;display:block;flex:0 0 auto" aria-hidden="true"><use href="#i-${id}"/></svg>`;
  const avatar = (s) => `<img class="avatar-img" src="${A}mara.png" width="${s}" height="${s}" alt=""/>`;
  const POST = "The fastest way to find your voice online: publish the thing you're slightly embarrassed by. The polished version is everyone's. The embarrassing one is yours.";

  function charmeter(len) {
    const pct = Math.min(100, (len / 500) * 100);
    const tone = len > 500 ? "over" : len > 440 ? "warn" : "";
    return `<div class="charmeter ${tone}"><div class="track"><div class="fill" style="width:${pct.toFixed(0)}%"></div></div><span class="cc">${len} / 500</span></div>`;
  }

  /* ----------------------------- ready card ------------------------------ */
  const readyBadge = `<span class="badge" style="background:color-mix(in srgb,var(--color-accent) 13%,var(--color-surface));color:var(--color-accent);border-color:color-mix(in srgb,var(--color-accent) 30%,transparent)"><span class="pill-dot"></span>Ready</span>`;
  function headWeb(badge, sub) {
    return `<div class="draft-head">${avatar(38)}<div class="draft-id"><div class="draft-name">Mara Lin</div>`
      + `<div class="draft-sub"><span>@mara.lin</span><span class="sep">·</span><span>${sub || "just now"}</span></div></div>${badge}</div>`;
  }
  function headMob(badge, sub) {
    return `<div class="m-card-head">${avatar(38)}<div class="m-card-id"><div class="m-card-name">Mara Lin</div>`
      + `<div class="m-card-sub"><span>@mara.lin</span><span class="sep">·</span><span>${sub || "just now"}</span></div></div>${badge}</div>`;
  }
  const body = (cls) => `<p class="${cls}">${POST}</p>`;

  /* ----- ENTRY POINT — finalized on Option A (two labelled buttons) ----- */
  function entryActionsWeb() {
    return `<div class="draft-actions"><button class="icon-btn" aria-label="More">${ic("more", 17)}</button>`
      + `<button class="btn btn--secondary btn--sm">${ic("clock", 15)} Schedule</button>`
      + `<button class="btn btn--primary btn--sm">${ic("send", 15)} Publish</button></div>`;
  }
  function entryActionsMob() {
    return `<div class="m-foot-row"><button class="m-iconbtn--foot" aria-label="More">${ic("more", 18)}</button>`
      + `<button class="btn btn--secondary m-btn m-btn--grow">${ic("clock", 16)} Schedule</button>`
      + `<button class="btn btn--primary m-btn m-btn--grow">${ic("send", 16)} Publish</button></div>`;
  }
  const readyMetaWeb = `<div class="draft-meta"><span class="cc-inline">${POST.length} / 500</span><span class="meta-sep"></span><span class="voice-tag">${ic("check", 13)} Ready to publish</span></div>`;
  const readyMetaMob = `<div class="m-foot-meta"><span class="cc-inline">${POST.length} / 500</span><span class="meta-sep"></span><span class="voice-tag">${ic("check", 13)} Ready to publish</span></div>`;

  function readyCardWeb(option, menu) {
    return `<article class="draft draft--draft">${headWeb(readyBadge)}${body("draft-body")}`
      + `<div class="draft-foot">${readyMetaWeb}${entryActionsWeb(option, menu)}</div></article>`;
  }
  function readyCardMob(option, menu) {
    return `<article class="m-card">${headMob(readyBadge)}${body("m-card-body")}`
      + `<div class="m-foot">${readyMetaMob}${entryActionsMob(option, menu)}</div></article>`;
  }

  /* ------------------------------ dialog --------------------------------- */
  // mode: 'now' | 'sched-empty' | 'sched-valid' | 'sched-soon'
  function schedFields(mode, mob) {
    const empty = mode === "sched-empty";
    const dv = empty ? "" : "Sat, Jun 16, 2026";
    const tv = empty ? "" : "14:30";
    const dateField = `<div class="sched-field"><label>Date</label><div class="field sched-pick${empty ? " sched-pick--empty" : ""}"><span>${dv || "Pick a date"}</span>${ic("calendar", 16)}</div></div>`;
    const timeField = `<div class="sched-field"><label>Time</label><div class="field sched-pick${empty ? " sched-pick--empty" : ""}"><span>${tv || "Pick a time"}</span>${ic("clock", 16)}</div></div>`;
    const hintCls = mob ? "msched-hint" : "sched-hint";
    let hint;
    if (empty) hint = `<div class="${hintCls}">${ic("clock", 13)} Pick a date &amp; time at least 5 minutes out.</div>`;
    else if (mode === "sched-soon") hint = `<div class="${hintCls} ${hintCls}--bad">${ic("clock", 13)} That's less than 5 minutes out — pick a later time.</div>`;
    else hint = `<div class="${hintCls}">= 14:30 UTC · at least 5 min out</div>`;
    return `<div class="${mob ? "msched-fields" : "sched-fields"}">${dateField}${timeField}${hint}</div>`;
  }
  function segBtns(sched, mob) {
    return `<button class="${!sched ? "is-active" : ""}">${ic("send", 15)} Publish now</button>`
      + `<button class="${sched ? "is-active" : ""}">${ic("clock", 15)} Schedule</button>`;
  }
  function primaryBtn(mode, mob) {
    const base = mob ? "btn btn--primary" : "btn btn--primary";
    if (mode === "now") return `<button class="${base}">${ic("check", 16)} Publish now</button>`;
    if (mode === "sched-valid") return `<button class="${base}">${ic("clock", 16)} Schedule for Sat, Jun 16 · 14:30</button>`;
    return `<button class="${base}" disabled>${ic("clock", 16)} Schedule</button>`;
  }

  function dialogWeb(mode) {
    const sched = mode !== "now";
    return `<div class="overlay"><div class="dialog" role="dialog" aria-modal="true">`
      + `<div class="dialog-head"><span class="dialog-mark">${ic("send", 18)}</span><div><div class="dialog-title">Publish to Threads?</div>`
      + `<div class="dialog-sub">This posts publicly. Publish now, or pick a time to schedule it.</div></div></div>`
      + `<div class="sched-seg" style="margin-top:14px">${segBtns(sched)}</div>`
      + `<div class="pub-account">${avatar(30)}<div class="pa-t"><b>Mara Lin</b> <span>@mara.lin</span></div></div>`
      + `<div class="pub-preview">${POST}</div>${charmeter(POST.length)}`
      + (sched ? schedFields(mode, false) : "")
      + `<div class="dialog-actions"><button class="btn btn--ghost">Cancel</button>${primaryBtn(mode)}</div></div></div>`;
  }
  function sheetMob(mode) {
    const sched = mode !== "now";
    return `<div class="m-sheet" style="max-height:92%"><div class="m-sheet-grip" style="margin:10px auto 6px"></div>`
      + `<div style="padding:0 16px 18px;overflow-y:auto">`
      + `<div class="m-sheet-head" style="padding-left:0;padding-right:0"><div class="m-sheet-title">Publish to Threads?</div><button class="m-sheet-close">${ic("x", 18)}</button></div>`
      + `<div class="msched-seg">${segBtns(sched, true)}</div>`
      + `<div class="pub-account" style="margin-top:14px">${avatar(30)}<div class="pa-t"><b>Mara Lin</b> <span>@mara.lin</span></div></div>`
      + `<div class="pub-preview">${POST}</div>${charmeter(POST.length)}`
      + (sched ? schedFields(mode, true) : "")
      + `<div class="mcal-sheet-actions">${primaryBtn(mode, true)}<button class="btn btn--ghost">Cancel</button></div>`
      + `</div></div>`;
  }

  /* --------------------------- scheduled card ---------------------------- */
  const schedBadge = `<span class="draft-badge">${ic("clock", 13)}Scheduled</span>`;
  function schedMenu() {
    const item = (icon, label) => `<button class="card-menu-item"><span class="cmi-ico">${ic(icon, 15)}</span><span class="cmi-label">${label}</span><span class="cmi-ext">${ic("external", 13)}</span></button>`;
    return `<div class="card-menu"><span class="sched-menu-cap">Managed on the Calendar</span>${item("clock", "Reschedule")}${item("undo", "Unschedule")}${item("send", "Publish now")}</div>`;
  }
  function scheduledCardWeb(menu) {
    const foot = `<div class="draft-foot"><div class="draft-meta"><span class="sched-goesout">${ic("clock", 14)}Goes out <b>Sat, Jun 16, 14:30</b></span></div>`
      + `<div class="draft-actions"><a class="sched-manage">${ic("calendar", 15)} Manage on Calendar ${ic("external", 13)}</a>`
      + `<div class="card-menu-anchor"><button class="icon-btn" aria-label="More">${ic("more", 17)}</button>${menu ? schedMenu() : ""}</div></div></div>`;
    return `<article class="draft draft--draft">${headWeb(schedBadge, "scheduled")}${body("draft-body")}${foot}</article>`;
  }
  function scheduledCardMob(menu) {
    const foot = `<div class="m-foot"><div class="m-foot-meta"><span class="sched-goesout">${ic("clock", 13)}Goes out <b>Sat, Jun 16, 14:30</b></span></div>`
      + `<div class="m-foot-row"><div class="card-menu-anchor"><button class="m-iconbtn--foot" aria-label="More">${ic("more", 18)}</button>${menu ? schedMenu() : ""}</div>`
      + `<a class="sched-manage m-btn m-btn--grow" style="justify-content:center;border:1px solid color-mix(in srgb,var(--color-accent) 30%,var(--color-border));border-radius:var(--radius-md)">${ic("calendar", 16)} Manage on Calendar ${ic("external", 13)}</a></div></div>`;
    return `<article class="m-card">${headMob(schedBadge, "scheduled")}${body("m-card-body")}${foot}</article>`;
  }

  /* ------------------------------- tabs ---------------------------------- */
  function tabsWeb() {
    const tab = (dot, label, count, active) => `<button class="filter${active ? " filter--active" : ""}"><span class="fdot dot-${dot}"></span><span class="flabel">${label}</span><span class="fcount">${count}</span></button>`;
    return `<div class="filterbar">${tab("ready", "Ready", 2)}${tab("draft", "Drafts", 4)}${tab("scheduled", "Scheduled", 3, true)}${tab("published", "Published", 12)}${tab("rejected", "Rejected", 1)}</div>`;
  }
  function tabsMob() {
    const tab = (dot, label, count, active) => `<button class="m-filter${active ? " m-filter--active" : ""}"><span class="fdot dot-${dot}"></span>${label}<span class="fcount">${count}</span></button>`;
    return `<div class="m-substick"><div class="m-filterbar">${tab("ready", "Ready", 2)}${tab("draft", "Drafts", 4)}${tab("scheduled", "Scheduled", 3, true)}${tab("published", "Published", 12)}${tab("rejected", "Rejected", 1)}</div></div>`;
  }

  /* ----------------------------- empty tab ------------------------------- */
  function emptyScheduledWeb() {
    return `<div class="empty"><div class="empty-mark">${ic("clock", 24)}</div><div class="empty-title">Nothing scheduled</div>`
      + `<div class="empty-sub">Drafts you schedule for later land here. Pick a time from a ready draft, then manage timing on the Calendar.</div>`
      + `<a class="btn btn--secondary">${ic("calendar", 16)} Open Calendar</a></div>`;
  }
  function emptyScheduledMob() {
    return `<div class="empty" style="padding:40px 20px"><div class="empty-mark">${ic("clock", 22)}</div><div class="empty-title">Nothing scheduled</div>`
      + `<div class="empty-sub">Drafts you schedule for later land here. Manage timing on the Calendar.</div>`
      + `<a class="btn btn--secondary">${ic("calendar", 16)} Open Calendar</a></div>`;
  }

  window.SCHED = {
    ic, readyCardWeb, readyCardMob, dialogWeb, sheetMob,
    scheduledCardWeb, scheduledCardMob, tabsWeb, tabsMob,
    emptyScheduledWeb, emptyScheduledMob,
  };
})();
