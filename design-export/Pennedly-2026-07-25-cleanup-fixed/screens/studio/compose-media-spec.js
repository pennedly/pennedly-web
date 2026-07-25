/* compose-media-spec.js — renders the Studio draft composer (editing card) with
   the media toolbar + attachment previews in EVERY attach type + state, for web
   (feed column) and phone (390px), light and dark. Pure string builders on the
   real product layers (studio.css for web, pennedly-mobile.css for phone) over
   ds/tokens.css. Icons from the shared sprite + a few NEW compose glyphs the
   host page injects. */
(function () {
  const A = "assets/avatars/";
  const ic = (id, s) => `<svg style="width:${s}px;height:${s}px;display:block;flex:0 0 auto" aria-hidden="true"><use href="#i-${id}"/></svg>`;
  const ph = (label, opts = {}) => `<div class="ph"${opts.alt ? ` role="img" aria-label="${opts.alt}"` : ""}>${opts.bare ? "" : `<span class="ph-tag">${ic("image", 13)}${label}</span>`}</div>`;

  /* ============================== TOOLBAR ============================ */
  // excl: null | 'media' (image/video present → GIF off) | 'gif' (GIF present → image/video off)
  function toolbar(excl) {
    const mediaOff = excl === "gif";
    const gifOff = excl === "media";
    const c = (id, label, off) => `<button class="mtool${off ? " mtool--disabled" : ""}"${off ? ' disabled' : ''}><span class="mtool-ico">${ic(id, 16)}</span><span>${label}</span></button>`;
    let hint = "";
    if (excl === "media") hint = `<span class="mtool-hint">${ic("alert", 13)}GIFs can’t mix with photos or video</span>`;
    if (excl === "gif") hint = `<span class="mtool-hint">${ic("alert", 13)}A GIF replaces other media</span>`;
    return `<div class="mtoolbar">${c("image", "Image", mediaOff)}${c("video", "Video", mediaOff)}${c("gif", "GIF", gifOff)}${c("poll", "Poll", false)}${hint}</div>`;
  }

  /* ====================== IMAGE STRIP (1–20) ========================= */
  // state: 'empty' | 'one' | 'multi' | 'drag' | 'uploading' | 'error'
  function ring(pct) {
    const r = 15, c = 2 * Math.PI * r, off = c * (1 - pct / 100);
    return `<svg class="mthumb-ring" width="42" height="42" viewBox="0 0 42 42">`
      + `<circle cx="21" cy="21" r="${r}" fill="none" stroke="rgba(255,255,255,.3)" stroke-width="3"/>`
      + `<circle cx="21" cy="21" r="${r}" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}" transform="rotate(-90 21 21)"/></svg>`;
  }
  function thumb(opts = {}) {
    const altCls = opts.altSet ? " mthumb-alt--set" : "";
    const altInner = opts.altSet ? `${ic("check", 11)}ALT` : "ALT";
    let overlay = "";
    if (opts.uploading != null) overlay = `<div class="mthumb-up">${ring(opts.uploading)}<span class="mthumb-pct">${opts.uploading}%</span></div>`;
    if (opts.error) return `<div class="mthumb mthumb--error">${ph("", { bare: true })}<div class="mthumb-errmark">${ic("alert", 18)}</div><button class="mthumb-x">${ic("x", 13)}</button></div>`;
    if (opts.ghost) return `<div class="mthumb mthumb--ghost">${ph("", { bare: true })}</div>`;
    const cls = "mthumb" + (opts.drag ? " mthumb--drag" : "");
    return `<div class="${cls}">${ph("", { bare: true })}`
      + (opts.uploading == null ? `<span class="mthumb-grip">${ic("drag", 14)}</span>` : "")
      + `<button class="mthumb-x">${ic("x", 13)}</button>`
      + (opts.uploading == null ? `<button class="mthumb-alt${altCls}">${altInner}</button>` : "")
      + overlay + `</div>`;
  }
  function imageStrip(state = "one") {
    const add = `<button class="mstrip-add">${ic("plus", 18)}<span class="sa-lbl">Add</span></button>`;
    if (state === "empty") return ``; // empty = no strip, just the toolbar
    if (state === "one") return `<div class="mstrip">${thumb({ altSet: false })}${add}</div><div class="mcount">1 / 20 · drag to reorder · ALT adds a description</div>`;
    if (state === "multi") return `<div class="mstrip">${thumb({ altSet: true })}${thumb({ altSet: true })}${thumb({})}${thumb({})}${add}</div><div class="mcount">4 / 20 · posts as a carousel · 2 still need ALT</div>`;
    if (state === "drag") return `<div class="mstrip">${thumb({ altSet: true })}${thumb({ ghost: true })}${thumb({ drag: true })}${thumb({})}${add}</div><div class="mcount">Drop to reorder — image 3 → position 2</div>`;
    if (state === "uploading") return `<div class="mstrip">${thumb({ altSet: true })}${thumb({ uploading: 64 })}${thumb({ uploading: 22 })}${add}</div><div class="mcount">Uploading 2 images…</div>`;
    if (state === "error") return `<div class="mstrip">${thumb({ altSet: true })}${thumb({ error: true })}${add}</div>`
      + `<div class="merror">${ic("alert", 14)}<span><b>banner.heic</b> — HEIC isn’t supported. Use JPEG, PNG or WebP, up to 8 MB.</span></div>`;
    return "";
  }

  /* ============================== VIDEO ============================= */
  const VID_HINT = `<div class="mhint">${ic("alert", 13)}MP4 or MOV · up to 5 min · up to 1 GB · processed on publish</div>`;
  function video(state = "ready") {
    if (state === "empty") return "";
    if (state === "uploading")
      return `<div class="mvid mvid--up">${ph("uploading…", { bare: true })}<div class="mvid-upwrap"><div class="mvid-upinfo"><span class="mvid-uppct">38%</span><span class="mvid-uplbl">Uploading to Pennedly…</span></div></div><div class="mvid-upbar"><div class="mvid-upfill" style="width:38%"></div></div></div>${VID_HINT}`;
    if (state === "error")
      return `<div class="mvid mvid--error"><div class="mvid-fallback"><span class="mfb-mark">${ic("alert", 18)}</span><div class="mfb-t">Video too long</div><div class="mfb-s">This clip is 7:12 — Threads allows up to 5 minutes. Trim it and try again.</div></div><button class="mvid-x" style="position:absolute;top:9px;right:9px">${ic("x", 14)}</button></div>${VID_HINT}`;
    // ready
    return `<div class="mvid">${ph("1920 × 1080 · poster", { alt: "Time-lapse writing session" })}`
      + `<button class="mvid-play">${ic("play", 20)}</button>`
      + `<button class="mvid-x">${ic("x", 14)}</button>`
      + `<span class="mvid-dur">0:42</span>`
      + `<button class="mvid-alt mvid-alt--set">${ic("check", 11)}ALT</button>`
      + `</div>${VID_HINT}`;
  }

  /* =============================== GIF ============================== */
  function gifTile() {
    return `<div class="mgif">${ph("loop", { bare: true, alt: "Looping reaction GIF" })}`
      + `<span class="mgif-chip">GIF</span><button class="mgif-x mthumb-x">${ic("x", 13)}</button>`
      + `<span class="mgif-attr">via GIPHY</span></div>`;
  }
  // picker state: 'results' | 'loading' | 'empty'
  function gifPicker(state = "results") {
    const search = `<div class="gifpick-search">${ic("search", 16)}<input value="${state === "empty" ? "asdfgh" : "writing"}" placeholder="Search GIPHY"/>${ic("x", 15)}</div>`;
    const attr = `<div class="gifpick-attr">${ic("sparkle", 12)} Powered by GIPHY</div>`;
    let grid;
    if (state === "loading") grid = `<div class="gifpick-grid">${Array.from({ length: 9 }, () => `<div class="gifpick-skel"></div>`).join("")}</div>`;
    else if (state === "empty") grid = `<div class="gifpick-empty"><span class="spin" style="border-top-color:var(--color-text-subtle);animation:none"></span><div class="ge-t">No GIFs found</div><div class="ge-s">Try a different search — “celebrate”, “typing”, “nope”.</div></div>`;
    else grid = `<div class="gifpick-grid">${Array.from({ length: 9 }, (_, i) => `<div class="gifpick-cell">${ph("", { bare: true })}</div>`).join("")}</div>`;
    return `<div class="gifpick">${search}${grid}${attr}</div>`;
  }

  /* ============================== LINK ============================== */
  // state: 'detecting' | 'loaded' | 'unavailable' | 'multiple'
  function link(state = "loaded") {
    const x = `<div class="clink-actions"><button class="clink-x" aria-label="Remove preview">${ic("x", 14)}</button></div>`;
    if (state === "detecting")
      return `<div class="clink clink--skel"><div class="clink-thumb"><div class="gifpick-skel" style="height:100%;border-radius:0"></div></div>`
        + `<div class="clink-body"><div class="skel-line" style="width:84%"></div><div class="skel-line" style="width:60%"></div><div class="skel-line" style="width:38%;margin-top:auto"></div></div></div>`;
    if (state === "unavailable")
      return `<div class="clink clink--bare"><div class="clink-body"><div class="clink-title">Preview unavailable</div>`
        + `<div class="clink-urlchip">${ic("link", 13)}<span>theparisreview.org/interviews/the-art-of-fiction</span></div></div>${x}</div>`;
    const card = `<div class="clink"><div class="clink-thumb">${ph("1200 × 630", { bare: true, alt: "Article thumbnail" })}</div>`
      + `<div class="clink-body"><div class="clink-title">The art of the rough first draft — why finishing beats polishing</div>`
      + `<div class="clink-dom">${ic("globe", 13)}theparisreview.org</div></div>${x}</div>`;
    if (state === "multiple")
      return `<div class="clink-pick">Two links — preview <button class="clink-pickbtn clink-pickbtn--on">theparisreview.org</button><button class="clink-pickbtn">are.na</button></div>${card}`;
    return card;
  }

  /* =============================== POLL ============================= */
  function poll() {
    const row = (val, ph2) => `<div class="cpoll-row"><input class="cpoll-input" ${val ? `value="${val}"` : `placeholder="${ph2}"`}/><button class="cpoll-rm" aria-label="Remove option">${ic("x", 14)}</button></div>`;
    return `<div class="cpoll">${row("Finish the rough draft first", "")}${row("Polish as you go", "")}${row("", "Add an option")}`
      + `<button class="cpoll-add">${ic("plus", 15)} Add option</button>`
      + `<div class="cpoll-foot"><span class="cpoll-lbl">2–4 options · read-only once posted</span>`
      + `<select class="field cpoll-dur"><option>1 day</option><option selected>3 days</option><option>1 week</option></select></div></div>`;
  }

  /* =========================== ALT-TEXT SHEET ======================= */
  // state: 'empty' | 'filled'
  function altSheet(state = "empty") {
    const filled = state === "filled";
    const txt = filled ? "Sunlit desk with an open notebook, a coffee, and a pen resting on a half-written page." : "";
    return `<div class="altsheet"><div class="altsheet-head"><div class="altsheet-thumb">${ph("", { bare: true })}</div>`
      + `<div><div class="altsheet-t">Describe this image</div><div class="altsheet-s">Alt text helps people using screen readers. 1–2 plain sentences.</div></div></div>`
      + `<textarea class="altsheet-ta" placeholder="e.g. A sunlit desk with an open notebook and coffee">${txt}</textarea>`
      + `<div class="altsheet-foot"><span class="altsheet-count">${filled ? "84" : "0"} / 1000</span>`
      + `<button class="btn btn--primary btn--sm">${ic("check", 15)} ${filled ? "Update" : "Save"} description</button></div></div>`;
  }

  /* ============================ CARD SHELLS ========================= */
  const BODY = "Wrote 1,000 words this morning before I opened email. Cut 600 of them. The 400 that survived are the only ones that were ever going to matter.";
  const draftBadge = `<span class="badge badge--neutral"><span class="pill-dot" style="color:var(--color-ink-400)"></span>Draft</span>`;

  function headWeb() {
    return `<div class="draft-head"><img class="avatar-img" src="${A}mara.png" width="38" height="38" alt=""/>`
      + `<div class="draft-id"><div class="draft-name">Mara Lin</div>`
      + `<div class="draft-sub"><span>@mara.lin</span><span class="sep">·</span><span>just now</span></div></div>${draftBadge}</div>`;
  }
  function headMob() {
    return `<div class="m-card-head"><img class="avatar-img" src="${A}mara.png" width="38" height="38" alt=""/>`
      + `<div class="m-card-id"><div class="m-card-name">Mara Lin</div>`
      + `<div class="m-card-sub"><span>@mara.lin</span><span class="sep">·</span><span>just now</span></div></div>${draftBadge}</div>`;
  }
  // char meter, tone by length
  function charmeter(len, mob) {
    const pct = Math.min(100, (len / 500) * 100);
    const tone = len > 500 ? " over" : len > 440 ? " warn" : "";
    return `<div class="charmeter${tone}"><span class="track"><span class="fill" style="width:${pct.toFixed(0)}%"></span></span><span class="cc">${len} / 500</span></div>`;
  }
  const footWeb = `<div class="draft-foot"><div class="draft-meta"><span class="cc-inline">Editing</span></div>`
    + `<div class="draft-actions"><button class="btn btn--ghost btn--sm">Cancel</button>`
    + `<button class="btn btn--primary btn--sm">${ic("check", 15)} Save</button></div></div>`;
  const footMob = `<div class="m-foot"><div class="m-foot-row"><button class="btn btn--ghost m-btn">Cancel</button>`
    + `<button class="btn btn--primary m-btn m-btn--grow">${ic("check", 16)} Save</button></div></div>`;

  // o: { body, len, media (cmedia inner html), toolbarExcl, thread, toolbar:false }
  function composeWeb(o = {}) {
    if (o.thread) return `<article class="draft draft--draft">${headWeb()}${threadEditor(o)}${footWeb}</article>`;
    const body = o.body != null ? o.body : BODY;
    const editor = `<textarea class="edit-area" rows="3">${body}</textarea>${charmeter(o.len != null ? o.len : body.length)}`;
    const region = `<div class="cmedia">${o.toolbar !== false ? toolbar(o.toolbarExcl) : ""}${o.media || ""}</div>`;
    return `<article class="draft draft--draft">${headWeb()}${editor}${region}${footWeb}</article>`;
  }
  function composeMob(o = {}) {
    if (o.thread) return `<article class="m-card">${headMob()}${threadEditor(o, true)}${footMob}</article>`;
    const body = o.body != null ? o.body : BODY;
    const editor = `<textarea class="edit-area" rows="3">${body}</textarea>${charmeter(o.len != null ? o.len : body.length, true)}`;
    const region = `<div class="cmedia">${o.toolbar !== false ? toolbar(o.toolbarExcl) : ""}${o.media || ""}</div>`;
    return `<article class="m-card">${headMob()}${editor}${region}${footMob}</article>`;
  }

  /* thread editor: parts split on ---; media rides the lead part. */
  function threadEditor(o, mob) {
    const lead = "Stop optimizing your first sentence. Optimize the reason someone should still care by the third.";
    const p2 = "Hooks fade in a scroll; substance is what compounds. Write the second line for the people who already stayed. ---";
    const region = `<div class="cmedia"><div class="threadcue">${ic("layers", 14)}<span><b>Attached to the first post.</b> Media rides the lead of a thread.</span></div>${toolbar(o.toolbarExcl)}${o.media || ""}</div>`;
    return `<div class="thread-parts">`
      + `<div class="thread-part"><div class="thread-tag thread-tag--lead">${ic("layers", 12)} Post 1 of 2 · lead</div>${lead}</div>`
      + region
      + `<div class="thread-connector"></div>`
      + `<div class="thread-part"><div class="thread-tag">Post 2 of 2</div>${p2}</div></div>`;
  }

  /* ============================== FRAMES ============================ */
  const cf = (html, dark) => `<div class="cf${dark ? " dark" : ""}">${html}</div>`;
  const mc = (html, o = {}) => `<div class="device device--auto${o.sm ? " device--sm" : ""}"><div class="device-screen mob${o.dark ? " dark" : ""}">${html}</div></div>`;
  const hLight = (l) => `<span class="dh-dot"></span>${l || "Light"}`;
  const hDark = (l) => `<span class="dh-dot dh-dot--dark"></span>${l || "Dark"}`;
  const col = (head, frame, cap) => `<div class="devcol">${head ? `<div class="devhead">${head}</div>` : ""}${frame}${cap ? `<div class="devcap">${cap}</div>` : ""}</div>`;
  const wcol = (label, dark, html, cap) => col((dark ? hDark : hLight)(label), cf(html, dark), cap);
  const pcol = (label, dark, html, cap, sm) => col((dark ? hDark : hLight)(label), mc(html, { dark, sm }), cap);

  /* ============================== ASSEMBLY ========================== */
  const set = (id, html) => { const e = document.getElementById(id); if (e) e.innerHTML = html; };
  const stage = (...c) => c.join("");

  // anatomy / placement
  set("stg-anatomy", stage(
    wcol("Web · the slot", false, composeWeb({ media: imageStrip("one"), toolbarExcl: "media" }), "Editing card: head → editor + char meter → <b>media toolbar + previews</b> → footer (Cancel / Save). Same place the shipped image row lived."),
    pcol("Phone · the slot", false, composeMob({ media: imageStrip("one"), toolbarExcl: "media" }), "Identical placement at 390px; toolbar scrolls, thumbs in a horizontal scroller.")
  ));

  // toolbar / mutual exclusion
  set("stg-toolbar", stage(
    wcol("Default", false, composeWeb({ media: "", toolbar: true }), "Image · Video · GIF · Poll. The link card is auto — no button."),
    wcol("Photo attached → GIF off", false, composeWeb({ media: imageStrip("one"), toolbarExcl: "media" }), "GIF disabled with a hint — never silently fails."),
    wcol("GIF attached → Image/Video off", true, composeWeb({ body: "How it feels every time the first line finally clicks.", media: gifTile(), toolbarExcl: "gif" }), "Image + Video disabled; a GIF is text-only & exclusive — dark.")
  ));
  set("stg-toolbar-m", stage(
    pcol("Default", false, composeMob({ media: "", toolbar: true }), "Row scrolls horizontally; 44px targets."),
    pcol("GIF attached · dark", true, composeMob({ body: "How it feels every time the first line finally clicks.", media: gifTile(), toolbarExcl: "gif" }), "Mutual-exclusion hint, dark.")
  ));

  // 1 · images
  set("stg-image", stage(
    wcol("Empty", false, composeWeb({ media: imageStrip("empty"), toolbar: true }), "Before any pick — just the toolbar."),
    wcol("1 image", false, composeWeb({ media: imageStrip("one"), toolbarExcl: "media" }), "Thumbnail strip: remove (×), drag grip, ALT affordance (empty)."),
    wcol("Multi / carousel", false, composeWeb({ media: imageStrip("multi"), toolbarExcl: "media" }), "Up to 20 → posts as a carousel. ALT filled = green check; count notes what still needs ALT."),
    wcol("Reordering (drag)", false, composeWeb({ media: imageStrip("drag"), toolbarExcl: "media" }), "Lifted thumb + dashed drop slot."),
    wcol("Uploading", false, composeWeb({ media: imageStrip("uploading"), toolbarExcl: "media" }), "Per-thumb progress ring + %."),
    wcol("Error", true, composeWeb({ media: imageStrip("error"), toolbarExcl: "media" }), "Wrong type / too large → flagged thumb + a clear caption — dark.")
  ));
  set("stg-image-m", stage(
    pcol("Multi / carousel", false, composeMob({ media: imageStrip("multi"), toolbarExcl: "media" }), "Horizontal thumb scroller; larger tap targets."),
    pcol("Uploading", false, composeMob({ media: imageStrip("uploading"), toolbarExcl: "media" }), "Progress rings on phone."),
    pcol("Error · dark", true, composeMob({ media: imageStrip("error"), toolbarExcl: "media" }), "Clear, recoverable error.")
  ));

  // alt sheet
  set("stg-alt", stage(
    col(hLight("Web · ALT empty"), cf(`${composeWeb({ media: imageStrip("one"), toolbarExcl: "media" })}<div class="compose-overlay">${altSheet("empty")}</div>`), "Tapping ALT opens a small sheet — empty trigger."),
    col(hDark("Phone · ALT filled"), mc(`${composeMob({ media: imageStrip("multi"), toolbarExcl: "media" })}<div class="compose-overlay">${altSheet("filled")}</div>`, { dark: true }), "Filled state; the thumb’s ALT chip turns green with a check.")
  ));

  // 2 · video
  set("stg-video", stage(
    wcol("Ready", false, composeWeb({ body: "Recorded a full writing session and sped it up.", media: video("ready"), toolbarExcl: "media" }), "Play badge + duration + remove + ALT; the inline limit hint sits below."),
    wcol("Uploading", false, composeWeb({ body: "Recorded a full writing session and sped it up.", media: video("uploading"), toolbarExcl: "media" }), "Upload to Pennedly with % + a bottom progress bar."),
    wcol("Error", true, composeWeb({ body: "Recorded a full writing session and sped it up.", media: video("error"), toolbarExcl: "media" }), "Duration / size / format failure — clear, recoverable — dark.")
  ));
  set("stg-video-m", stage(
    pcol("Ready", false, composeMob({ body: "Recorded a full writing session and sped it up.", media: video("ready"), toolbarExcl: "media" }), "16:9 tile, thumb-reachable controls."),
    pcol("Uploading · dark", true, composeMob({ body: "Recorded a full writing session and sped it up.", media: video("uploading"), toolbarExcl: "media" }), "Progress, dark.")
  ));

  // 3 · GIF picker
  set("stg-gif", stage(
    col(hLight("Web · picker (results)"), cf(`${composeWeb({ body: "How it feels every time the first line finally clicks.", media: "", toolbar: true })}<div class="compose-overlay">${gifPicker("results")}</div>`), "GIF → GIPHY search: field · results grid · attribution."),
    col(hLight("Web · loading"), cf(`<div style="padding:0">${gifPicker("loading")}</div>`), "Results loading — skeleton grid."),
    col(hDark("Web · empty results"), cf(`<div style="padding:0">${gifPicker("empty")}</div>`, true), "No matches — a friendly nudge, dark."),
    col(hLight("Attached GIF tile"), cf(composeWeb({ body: "How it feels every time the first line finally clicks.", media: gifTile(), toolbarExcl: "gif" })), "Single looping tile + remove + GIPHY attribution.")
  ));
  const gifSheetPhone = (dark) => `<div class="device device--tall"><div class="device-screen mob${dark ? " dark" : ""}">`
    + `<div class="m-scroll"><div class="m-content" style="padding:14px">${composeMob({ body: "How it feels every time the first line finally clicks.", media: "", toolbar: true })}</div></div>`
    + `<div class="m-scrim"></div><div class="m-sheet" style="max-height:80%"><div class="m-sheet-grip"></div>${gifPicker("results")}</div>`
    + `</div></div>`;
  set("stg-gif-m", stage(
    col(hLight("Picker (sheet)"), gifSheetPhone(false), "GIPHY search becomes a full-width bottom sheet."),
    col(hDark("Attached · dark"), mc(composeMob({ body: "How it feels every time the first line finally clicks.", media: gifTile(), toolbarExcl: "gif" }), { dark: true }), "Looping tile, dark.")
  ));

  // 4 · link card
  set("stg-link", stage(
    wcol("Detecting", false, composeWeb({ body: "Came back to this interview again today: theparisreview.org/interviews/the-art-of-fiction", media: link("detecting"), toolbar: true }), "A URL in the body → preview builds (skeleton). No button — it auto-appears."),
    wcol("Loaded", false, composeWeb({ body: "Came back to this interview again today: theparisreview.org/interviews/the-art-of-fiction", media: link("loaded"), toolbar: true }), "Thumb + title + domain; keep or remove (×)."),
    wcol("Multiple links", false, composeWeb({ body: "Two good reads: theparisreview.org and are.na/feed", media: link("multiple"), toolbar: true }), "Pick which URL previews; the rest stay as plain links."),
    wcol("Unavailable", true, composeWeb({ body: "Came back to this interview again today: theparisreview.org/interviews/the-art-of-fiction", media: link("unavailable"), toolbar: true }), "Preview failed → tidy domain + URL chip, still removable — dark.")
  ));
  set("stg-link-m", stage(
    pcol("Loaded", false, composeMob({ body: "Came back to this interview today: theparisreview.org/interviews/the-art-of-fiction", media: link("loaded"), toolbar: true }), "Thumb stacks on top; remove floats on the image."),
    pcol("Unavailable · dark", true, composeMob({ body: "Came back to this interview today: theparisreview.org/interviews/the-art-of-fiction", media: link("unavailable"), toolbar: true }), "Graceful fallback, dark.")
  ));

  // 5 · poll
  set("stg-poll", stage(
    wcol("Editing", false, composeWeb({ body: "Settle a debate for me: when you sit down to write, what actually works?", media: poll(), toolbarExcl: "media" }), "2–4 option rows + a duration select. Lower priority — included for completeness."),
    pcol("Editing · dark", true, composeMob({ body: "Settle a debate: when you sit down to write, what works?", media: poll(), toolbarExcl: "media" }), "Full-width rows, 44px targets, dark.")
  ));

  // 6 · thread interplay
  set("stg-thread", stage(
    wcol("Thread · media on lead", false, composeWeb({ thread: true, media: imageStrip("multi"), toolbarExcl: "media" }), "Body split on <code>---</code> → media sits under Post 1 with an “attached to the first post” cue."),
    pcol("Thread · dark", true, composeMob({ thread: true, media: video("ready"), toolbarExcl: "media" }), "Same cue on phone; media rides the lead part.")
  ));

  // new icons
  const NEW_ICONS = [["image", "Image"], ["video", "Video"], ["gif", "Gif"], ["poll", "Poll"], ["drag", "Drag"], ["play", "Play"], ["upload", "Upload"]];
  set("stg-icons", NEW_ICONS.map(([id, name]) =>
    `<div class="iconcell"><span class="iconcell-glyph">${ic(id, 22)}</span><code>Ic${name}</code></div>`).join(""));
})();
