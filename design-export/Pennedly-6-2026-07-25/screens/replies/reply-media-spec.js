/* reply-media-spec.js — renders the Replies answer box with its compact media
   affordance in every state, web (reply column) + phone (390px), light + dark.
   Pure string builders on the real product layers (replies.css for web,
   pennedly-mobile.css for phone) over ds/tokens.css. Icons from the shared
   sprite + a few NEW glyphs the host page injects. */
(function () {
  const A = "../../assets/avatars/";
  const ic = (id, s) => `<svg style="width:${s}px;height:${s}px;display:block;flex:0 0 auto" aria-hidden="true"><use href="#i-${id}"/></svg>`;
  const phBox = (cls) => `<div class="${cls}"></div>`;
  function ring(pct) {
    const r = 14, c = 2 * Math.PI * r, off = c * (1 - pct / 100);
    return `<svg width="40" height="40" viewBox="0 0 40 40"><circle cx="20" cy="20" r="${r}" fill="none" stroke="rgba(255,255,255,.3)" stroke-width="3"/>`
      + `<circle cx="20" cy="20" r="${r}" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}" transform="rotate(-90 20 20)"/></svg>`;
  }

  const COMMENT = "this hit me at exactly the right time. how do you actually decide what to cut?";
  const REPLY = "honestly? if a line is only there to sound smart, it goes. I keep the ones that would still be true even if no one read them.";

  /* ---------------------- attached media (reply block) ---------------- */
  // media: null | 'uploading' | 'attached' | 'altset' | 'error'
  function rmedia(media) {
    if (!media) return "";
    if (media === "uploading")
      return `<div class="rmedia"><div class="rmedia-thumb">${phBox("rmedia-ph")}<div class="rmedia-up">${ring(58)}<span class="rmedia-pct">58%</span></div></div>`
        + `<div class="rmedia-side"><div class="rmedia-cap">Uploading <b>desk.jpg</b>…</div></div></div>`;
    if (media === "error")
      return `<div class="rmedia"><div class="rmedia-thumb rmedia-thumb--error">${phBox("rmedia-ph")}<div class="rmedia-errmark">${ic("alert", 17)}</div><button class="rmedia-x">${ic("x", 13)}</button></div>`
        + `<div class="rmedia-side"><div class="rmedia-err">${ic("alert", 13)}<span><b>banner.heic</b> isn’t supported — use JPEG, PNG or WebP, up to 8 MB.</span></div><button class="rmedia-retry">Choose another</button></div></div>`;
    const altSet = media === "altset";
    const altBtn = `<button class="rmedia-alt${altSet ? " rmedia-alt--set" : ""}">${altSet ? `${ic("check", 11)}ALT` : "ALT"}</button>`;
    const side = altSet
      ? `<div class="rmedia-cap"><b>Image attached.</b> Alt text added.</div>`
      : `<div class="rmedia-cap"><b>Image attached.</b> Add ALT so screen readers can describe it.</div>`;
    return `<div class="rmedia"><div class="rmedia-thumb">${phBox("rmedia-ph")}<button class="rmedia-x">${ic("x", 13)}</button>${altBtn}</div>`
      + `<div class="rmedia-side">${side}</div></div>`;
  }

  /* ---------------------- footer media tools (web) -------------------- */
  // tools: 'none' (today) | 'chip' (Add image available) | 'used' (image present → disabled) | 'gate-inline'
  function toolsWeb(tools) {
    if (tools === "none") return "";
    if (tools === "used")
      return `<div class="rmedia-tools"><button class="rmedia-chip" disabled><span class="rc-ico">${ic("image", 16)}</span>Image added</button></div>`;
    if (tools === "gate-inline")
      return `<div class="rmedia-tools"><button class="rmedia-chip"><span class="rc-ico">${ic("image", 16)}</span>Image</button>`
        + `<div class="rmedia-gchips"><span class="rmedia-gchip">${ic("video", 13)}Video<span class="soon-tag">Soon</span></span>`
        + `<span class="rmedia-gchip">${ic("layers", 13)}Carousel<span class="soon-tag">Soon</span></span>`
        + `<span class="rmedia-gchip">${ic("gif", 13)}GIF<span class="soon-tag">Soon</span></span></div></div>`;
    // default 'chip' — Add image + a gated "More"
    return `<div class="rmedia-tools"><button class="rmedia-chip"><span class="rc-ico">${ic("image", 16)}</span>Image</button>`
      + `<button class="rmedia-chip rmedia-more">More<span class="rm-soon"></span>${ic("chev-down", 13)}</button></div>`;
  }

  // the gated "More" popover (intended end-state, clearly not live)
  function gatePop() {
    const row = (icon, label) => `<button class="rmedia-grow" disabled><span class="rg-ico">${ic(icon, 16)}</span><span class="rg-label">${label}</span><span class="soon-tag">${ic("clock", 11)}Soon</span></button>`;
    return `<div class="rmedia-gate"><span class="rmedia-gate-cap">Richer media</span>`
      + row("video", "Video") + row("layers", "Carousel") + row("gif", "GIF")
      + `<div class="rmedia-gate-note">${ic("clock", 14)}<span><b>Verifying support.</b> Image works in replies today; video, carousel &amp; GIF arrive once we confirm Threads accepts them in a reply.</span></div></div>`;
  }

  // alt-text popover
  function altSheet(filled) {
    const txt = filled ? "Sunlit desk with an open notebook and a coffee beside a half-written page." : "";
    return `<div class="rmedia-altsheet"><div class="rmedia-altsheet-head"><div class="rmedia-altsheet-thumb">${phBox("rmedia-ph")}</div>`
      + `<div><div class="rmedia-altsheet-t">Describe this image</div><div class="rmedia-altsheet-s">Helps people using screen readers. One plain sentence is plenty.</div></div></div>`
      + `<textarea class="rmedia-altsheet-ta" placeholder="e.g. A sunlit desk with an open notebook and coffee">${txt}</textarea>`
      + `<div class="rmedia-altsheet-foot"><span class="rmedia-altsheet-count">${filled ? "72" : "0"} / 1000</span>`
      + `<button class="btn btn--primary btn--sm">${ic("check", 15)} ${filled ? "Update" : "Save"} description</button></div></div>`;
  }

  /* ============================== WEB CARD =========================== */
  // o: { media, tools, gateNote, status:'draft', overlay }
  function replyWeb(o = {}) {
    const badge = `<span class="badge" style="background:color-mix(in srgb,var(--color-accent) 12%,var(--color-surface));color:var(--color-accent);border-color:color-mix(in srgb,var(--color-accent) 30%,transparent)"><span class="pill-dot"></span>Draft</span>`;
    const head = `<div class="draft-head"><img class="avatar-img" src="${A}c-devon.png" width="38" height="38" alt=""/>`
      + `<div class="draft-id"><div class="draft-name">Devon Reyes</div>`
      + `<div class="draft-sub"><span>@devon_makes</span><span class="sep">·</span><span>2h ago</span></div></div>${badge}`
      + `<button class="cmt-remove" aria-label="Remove from queue">${ic("x", 15)}</button></div>`;
    const replyBlock = `<div class="reply-thread"><div class="reply-block">`
      + `<div class="reply-author"><img class="avatar-img" src="${A}mara.png" width="24" height="24" alt=""/><span class="ra-name">You</span><span class="ra-tag">${ic("nib", 12)}drafted in your voice</span></div>`
      + `<div class="reply-text">${REPLY}</div>${rmedia(o.media)}</div></div>`;
    const tools = toolsWeb(o.tools || "chip");
    const actions = `<div class="cmt-actions">`
      + `<button class="btn btn--ghost btn--sm">${ic("tweak", 15)} Regenerate</button>`
      + `<button class="btn btn--secondary btn--sm">${ic("pencil", 15)} Edit</button>`
      + `<button class="btn btn--primary btn--sm">${ic("check", 15)} Approve</button></div>`;
    const note = o.gateNote ? `<div class="rmedia-gnote">${ic("clock", 13)}Image works today — video, carousel &amp; GIF are coming once verified.</div>` : "";
    const foot = `<div class="cmt-foot">${tools}<div class="cmt-meta"></div>${actions}</div>${note}`;
    const overlay = o.overlay ? `<div class="compose-overlay">${o.overlay}</div>` : "";
    return `<article class="cmt-card">${head}<p class="cmt-body">${COMMENT}</p>${replyBlock}${foot}${overlay}</article>`;
  }

  /* ============================ MOBILE CARD ========================== */
  function replyMob(o = {}) {
    const badge = `<span class="badge" style="background:color-mix(in srgb,var(--color-accent) 12%,var(--color-surface));color:var(--color-accent);border-color:color-mix(in srgb,var(--color-accent) 30%,transparent)"><span class="pill-dot"></span>Draft</span>`;
    const head = `<div class="m-cmt-head"><div class="m-cmt-id"><span class="m-cmt-handle">@devon_makes</span><span class="m-cmt-time">2h ago</span></div>${badge}<button class="m-card-remove" aria-label="Remove from queue">${ic("x", 15)}</button></div>`;
    const replyBlock = `<div class="reply-thread"><div class="reply-block">`
      + `<div class="reply-author"><img class="avatar-img" src="${A}mara.png" width="24" height="24" alt=""/><span class="ra-name">You</span><span class="ra-tag">${ic("nib", 12)}drafted in your voice</span></div>`
      + `<div class="reply-text">${REPLY}</div>${rmedia(o.media)}</div></div>`;
    const used = o.tools === "used";
    const imgBtn = used
      ? `<button class="m-iconbtn--foot" aria-label="Image added" disabled style="opacity:.45">${ic("image", 18)}</button>`
      : `<button class="m-iconbtn--foot rmedia-footbtn" aria-label="Add image">${ic("image", 18)}<span class="rm-soon"></span></button>`;
    const row = `<div class="m-foot-row">${o.tools === "none" ? "" : imgBtn}`
      + `<button class="m-iconbtn--foot" aria-label="Regenerate">${ic("tweak", 18)}</button>`
      + `<button class="btn btn--primary m-btn m-btn--grow">${ic("check", 16)} Approve</button></div>`;
    const note = o.gateNote ? `<div class="m-foot-meta"><span class="rmedia-gnote">${ic("clock", 13)}Image works today — richer media coming once verified.</span></div>` : "";
    const foot = `<div class="m-foot">${note}${row}</div>`;
    const overlay = o.overlay || "";
    return `<article class="m-card">${head}<p class="m-card-body">${COMMENT}</p>${replyBlock}${foot}${overlay}</article>`;
  }

  // mobile attach sheet (full-width) — Photo live + gated rows
  function mobPickSheet() {
    const live = `<button class="rmedia-pickbtn"><span class="rp-ico">${ic("image", 20)}</span><div><div class="rp-t">Photo</div><div class="rp-s">JPEG, PNG or WebP · up to 8 MB</div></div></button>`;
    const gated = (icon, t) => `<button class="rmedia-pickbtn rmedia-pickbtn--gated" disabled><span class="rp-ico">${ic(icon, 20)}</span><div><div class="rp-t">${t}</div><div class="rp-s">Verifying support in replies</div></div><span class="rp-soon soon-tag">${ic("clock", 11)}Soon</span></button>`;
    return `<div class="m-scrim"></div><div class="m-sheet"><div class="m-sheet-grip"></div>`
      + `<div class="m-sheet-head"><div class="m-sheet-title">Add to reply</div><button class="m-sheet-close">${ic("x", 16)}</button></div>`
      + `<div class="m-sheet-scroll"><div class="rmedia-pickrow">${live}${gated("video", "Video")}${gated("layers", "Carousel")}${gated("gif", "GIF")}</div></div></div>`;
  }

  /* ============================== FRAMES ============================= */
  const rf = (html, dark) => `<div class="rf${dark ? " dark" : ""}">${html}</div>`;
  const mc = (html, o = {}) => `<div class="device device--auto${o.sm ? " device--sm" : ""}"><div class="device-screen mob${o.dark ? " dark" : ""}">${html}</div></div>`;
  const tallPhone = (inner, sheet, dark) => `<div class="device device--tall"><div class="device-screen mob${dark ? " dark" : ""}">`
    + `<div class="m-scroll"><div class="m-content" style="padding:14px">${inner}</div></div>${sheet}</div></div>`;
  const hLight = (l) => `<span class="dh-dot"></span>${l || "Light"}`;
  const hDark = (l) => `<span class="dh-dot dh-dot--dark"></span>${l || "Dark"}`;
  const col = (head, frame, cap) => `<div class="devcol">${head ? `<div class="devhead">${head}</div>` : ""}${frame}${cap ? `<div class="devcap">${cap}</div>` : ""}</div>`;
  const wcol = (label, dark, html, cap) => col((dark ? hDark : hLight)(label), rf(html, dark), cap);
  const pcol = (label, dark, html, cap) => col((dark ? hDark : hLight)(label), mc(html, { dark }), cap);

  /* ============================== ASSEMBLY ========================== */
  const set = (id, html) => { const e = document.getElementById(id); if (e) e.innerHTML = html; };
  const stage = (...c) => c.join("");

  // 0 · placement
  set("stg-anatomy", stage(
    wcol("Web · the slot", false, replyWeb({ media: "attached", tools: "used" }), "The image chip joins the existing action row; the thumbnail sits inside the reply block, above the send action — the comment stays visible."),
    pcol("Phone · the slot", false, replyMob({ media: "attached", tools: "used" }), "Same idea at 390px: an image icon in the foot row, thumb in the reply block.")
  ));

  // 1 · text-only (today) vs affordance
  set("stg-base", stage(
    wcol("Text-only (today)", false, replyWeb({ media: null, tools: "none" }), "The shipped reply — text only, no media affordance."),
    wcol("Image affordance added", false, replyWeb({ media: null, tools: "chip" }), "An <b>Image</b> chip joins the action row + a gated <b>More</b> (accent dot). No second toolbar."),
    pcol("Today · dark", true, replyMob({ media: null, tools: "none" }), "Today, dark.")
  ));

  // 2 · image states
  set("stg-image", stage(
    wcol("Empty", false, replyWeb({ media: null, tools: "chip" }), "Before a pick — just the chip in the row."),
    wcol("Uploading", false, replyWeb({ media: "uploading", tools: "used" }), "Compact thumb with a progress ring + %."),
    wcol("Attached · ALT empty", false, replyWeb({ media: "attached", tools: "used" }), "One thumb: remove (×) + an ALT affordance. Scoped to a single image."),
    wcol("ALT filled", false, replyWeb({ media: "altset", tools: "used" }), "ALT chip turns success-green with a check once described."),
    wcol("Error", true, replyWeb({ media: "error", tools: "used" }), "Wrong type / too large → flagged thumb + a clear, recoverable caption — dark.")
  ));
  set("stg-image-m", stage(
    pcol("Attached", false, replyMob({ media: "attached", tools: "used" }), "Comfortable tap target; easy ✕ remove."),
    pcol("Uploading", false, replyMob({ media: "uploading", tools: "used" }), "Progress ring on phone."),
    pcol("Error · dark", true, replyMob({ media: "error", tools: "used" }), "Clear, recoverable.")
  ));

  // 3 · alt sheet
  set("stg-alt", stage(
    col(hLight("Web · ALT empty"), rf(replyWeb({ media: "attached", tools: "used", overlay: altSheet(false) })), "Tapping ALT opens a small sheet — empty."),
    col(hDark("Web · ALT filled"), rf(replyWeb({ media: "altset", tools: "used", overlay: altSheet(true) }), true), "Filled; thumb chip turns green — dark.")
  ));

  // 4 · gated richer media
  set("stg-gate", stage(
    col(hLight("More reveal (popover)"), rf(replyWeb({ media: null, tools: "chip", overlay: gatePop() })), "“More” reveals the intended end-state — Video · Carousel · GIF, each <b>Soon</b>, with a “verifying support” note."),
    wcol("Inline gated chips", false, replyWeb({ media: null, tools: "gate-inline", gateNote: true }), "Alternative: disabled chips inline + a one-line note. Never shown as working."),
    pcol("Phone · attach sheet", false, tallPhone(replyMob({ media: null, tools: "chip" }), mobPickSheet(), false), "Full-width sheet: Photo is live; Video/Carousel/GIF are gated with Soon."),
    pcol("Inline gated · dark", true, replyMob({ media: null, tools: "chip", gateNote: true }), "Note that richer media is coming — dark.")
  ));

  // new icons
  const NEW_ICONS = [["image", "Image"], ["video", "Video"], ["gif", "Gif"], ["layers", "Carousel*"]];
  set("stg-icons", NEW_ICONS.map(([id, name]) =>
    `<div class="iconcell"><span class="iconcell-glyph">${ic(id, 22)}</span><code>Ic${name}</code></div>`).join(""));
})();
