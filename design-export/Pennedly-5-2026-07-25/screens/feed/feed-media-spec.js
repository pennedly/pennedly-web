/* feed-media-spec.js — renders the My Feed post card in EVERY media variant +
   state, for web (feed column) and phone (390px), light and dark. Pure string
   builders (like mobile/mock.js), so the spec shows exactly what the recipe
   produces on the real product layers (feed.css + pennedly-mobile.css on
   ds/tokens.css). Icons come from the shared sprite (mobile/sprite.js) plus a
   small set of NEW media glyphs injected by the host page. */
(function () {
  const A = "../../assets/avatars/";
  const ic = (id, s) => `<svg style="width:${s}px;height:${s}px;display:block;flex:0 0 auto" aria-hidden="true"><use href="#i-${id}"/></svg>`;

  /* striped placeholder for real imagery — names the slot (dims / kind). */
  function ph(label, opts = {}) {
    const tag = opts.bare ? "" : `<span class="ph-tag">${ic("image", 13)}${label}</span>`;
    return `<div class="ph"${opts.alt ? ` role="img" aria-label="${opts.alt}"` : ""}>${tag}</div>`;
  }
  /* an alt-text slot ribbon (spec-only; real card keeps it on img alt / aria-label) */
  const altSlot = (txt) => `<div class="media-alt">${ic("image", 12)}<b>alt</b> — ${txt}</div>`;

  /* ============================ MEDIA BLOCKS =========================== */

  // 1 — SINGLE IMAGE. state: 'loaded' | 'tall' | 'loading' | 'failed'
  function mImage(state = "loaded") {
    if (state === "loading")
      return `<div class="media"><div class="media-frame"><div class="media-skel"></div></div></div>`;
    if (state === "failed")
      return `<div class="media"><div class="media-frame"><div class="media-fallback">`
        + `<span class="media-fallback-mark">${ic("image", 20)}</span>`
        + `<div class="media-fallback-t">Image unavailable</div>`
        + `<div class="media-fallback-s">This image couldn’t be loaded. Open the post on Threads to view it.</div>`
        + `</div></div></div>`;
    const tall = state === "tall";
    const dims = tall ? "1080 × 1350 · capped 4:5" : "1600 × 1067 · 3:2";
    return `<div class="media"><div class="media-frame${tall ? " media-frame--tall" : ""}">`
      + ph(dims, { alt: tall ? "Notebook page, handwritten edits in the margin" : "Sunlit desk with an open notebook and coffee" })
      + `<button class="media-chip media-chip--br media-expand">${ic("expand", 13)}Tap to expand</button>`
      + `</div>${altSlot(tall ? "Notebook page, handwritten edits in the margin" : "Sunlit desk, open notebook + coffee")}</div>`;
  }

  // 2 — CAROUSEL. state: 'first' | 'mid' | 'mixed'
  function mCarousel(state = "first") {
    const total = 4;
    const idx = state === "first" ? 1 : 2;
    const dots = Array.from({ length: total }, (_, i) =>
      `<span class="media-dot${i === idx - 1 ? " media-dot--on" : ""}"></span>`).join("");
    const isVideo = state === "mixed";
    const slideLabel = isVideo ? "0:24 · video · 1080²" : `image ${idx} · 1080²`;
    const playBadge = isVideo ? `<button class="media-play media-play--sm">${ic("play", 18)}</button>` : "";
    const durChip = isVideo ? `<span class="media-chip media-chip--bl">${ic("play", 11)} 0:24</span>` : "";
    return `<div class="media"><div class="media-frame media-carousel">`
      + `<div class="media-track"><div class="media-slide">${ph(slideLabel, { alt: "Carousel item " + idx })}${playBadge}${durChip}</div></div>`
      + `<span class="media-chip media-chip--tr">${idx} / ${total}</span>`
      + `<button class="media-arrow media-arrow--l"${idx === 1 ? " disabled" : ""}>${ic("arrow-left", 17)}</button>`
      + `<button class="media-arrow media-arrow--r">${ic("chev-right", 17)}</button>`
      + `<div class="media-dots">${dots}</div>`
      + `</div>${altSlot(isVideo ? "Item " + idx + " of " + total + " — short clip" : "Item " + idx + " of " + total)}</div>`;
  }

  // 3 — VIDEO. state: 'poster' | 'playing' | 'autoplay' | 'processing'
  function mVideo(state = "poster") {
    if (state === "processing")
      return `<div class="media"><div class="media-frame media-frame--wide"><div class="media-fallback">`
        + `<span class="media-fallback-mark">${ic("play", 20)}</span>`
        + `<div class="media-fallback-t">Video still processing</div>`
        + `<div class="media-fallback-s">Threads is still preparing this video. It’ll play here once ready.</div>`
        + `</div></div></div>`;
    let overlay;
    if (state === "playing") {
      overlay = `<div class="media-scrub"><button class="media-scrub-btn">${ic("pause", 16)}</button>`
        + `<span class="media-scrub-track"><span class="media-scrub-fill" style="width:38%"></span></span>`
        + `<span class="media-scrub-time">0:16 / 0:42</span></div>`;
    } else if (state === "autoplay") {
      overlay = `<span class="media-chip media-chip--bl">${ic("mute", 12)} Muted</span>`
        + `<span class="media-chip media-chip--br">0:42</span>`;
    } else {
      overlay = `<button class="media-play">${ic("play", 22)}</button>`
        + `<span class="media-chip media-chip--br">0:42</span>`;
    }
    return `<div class="media"><div class="media-frame media-frame--wide">`
      + ph("1920 × 1080 · poster", { alt: "Video — writing at a desk, time-lapse" })
      + overlay
      + `</div>${altSlot("Time-lapse of a writing session" + (state === "autoplay" ? " · autoplay muted, respects reduced-motion" : ""))}</div>`;
  }

  // 4 — GIF (auto-looping, muted, lighter than video — no duration chip)
  function mGif() {
    return `<div class="media"><div class="media-frame media-frame--wide">`
      + ph("640 × 360 · loop", { alt: "Looping animation of a pen drawing a line" })
      + `<span class="media-chip media-chip--tl media-chip--gif">GIF</span>`
      + `</div>${altSlot("Looping pen-stroke animation · paused under reduced-motion")}</div>`;
  }

  // 5 — AUDIO (display only). state: 'idle' | 'playing'
  function mAudio(state = "idle") {
    const playing = state === "playing";
    const heights = [9, 14, 7, 18, 11, 22, 15, 8, 19, 13, 24, 10, 16, 21, 12, 7, 17, 23, 9, 14, 11, 19, 8, 15, 22, 13, 10, 18, 7, 16, 12, 20];
    const onCount = playing ? 13 : 0;
    const bars = heights.map((h, i) =>
      `<span class="wbar${i < onCount ? " wbar--on" : ""}" style="height:${h}px"></span>`).join("");
    return `<div class="media-audio">`
      + `<button class="media-audio-btn" aria-label="${playing ? "Pause" : "Play"}">${ic(playing ? "pause" : "play", 15)}</button>`
      + `<span class="media-audio-wave" role="img" aria-label="Audio waveform">${bars}</span>`
      + `<span class="media-audio-time">${playing ? "0:41" : "0:00"} / 1:48</span>`
      + `</div>`;
  }

  // 6 — LINK CARD. state: 'loaded' | 'loading' | 'unavailable'
  function mLink(state = "loaded") {
    if (state === "loading")
      return `<div class="media"><a class="media-link">`
        + `<div class="media-link-thumb"><div class="media-skel" style="height:100%;min-height:100px"></div></div>`
        + `<div class="media-link-body"><div class="skel-line" style="width:88%"></div><div class="skel-line" style="width:64%"></div>`
        + `<div class="skel-line" style="width:40%;margin-top:auto"></div></div></a></div>`;
    if (state === "unavailable")
      return `<div class="media"><a class="media-link media-link--bare">`
        + `<div class="media-link-body">`
        + `<div class="media-link-title">Link preview unavailable</div>`
        + `<div class="media-link-urlchip">${ic("link", 13)}<span>theparisreview.org/interviews/the-art-of-fiction</span></div>`
        + `<div class="media-link-dom"><span class="dom-name">theparisreview.org</span><span class="dom-ext">${ic("external", 13)}</span></div>`
        + `</div></a></div>`;
    return `<div class="media"><a class="media-link">`
      + `<div class="media-link-thumb">${ph("1200 × 630", { bare: true, alt: "Article thumbnail" })}</div>`
      + `<div class="media-link-body">`
      + `<div class="media-link-title">The art of the rough first draft — why finishing beats polishing</div>`
      + `<div class="media-link-dom">${ic("globe", 13)}<span class="dom-name">theparisreview.org</span><span class="dom-ext">${ic("external", 13)}</span></div>`
      + `</div></a></div>`;
  }

  // 7 — POLL. state: 'open' | 'closed'
  function mPoll(state = "open") {
    const closed = state === "closed";
    // open: live standings · closed: winner emphasised
    const opts = [
      { label: "Finish the rough draft first", pct: 58, win: true },
      { label: "Polish as you go", pct: 27 },
      { label: "Outline obsessively", pct: 11 },
      { label: "I don’t plan at all", pct: 4 },
    ];
    const rows = opts.map((o) => {
      const win = closed && o.win;
      const lost = closed && !o.win;
      const cls = "poll-opt" + (win ? " poll-opt--win" : "") + (lost ? " poll-opt--lost" : "");
      const check = win ? `<span class="poll-check">${ic("check", 14)}</span>` : "";
      return `<div class="${cls}"><div class="poll-fill" style="width:${o.pct}%"></div>`
        + `<span class="poll-label">${check}<span>${o.label}</span></span>`
        + `<span class="poll-pct">${o.pct}%</span></div>`;
    }).join("");
    const foot = closed
      ? `<div class="poll-foot"><span>3,418 votes</span><span class="sep">·</span><span>Final result</span></div>`
      : `<div class="poll-foot"><span>1,204 votes</span><span class="sep">·</span><span>2 days left</span></div>`;
    return `<div class="media-poll">${rows}${foot}</div>`;
  }

  // 8 — QUOTE / REPOST. state: 'loaded' | 'thumb' | 'loading' | 'gone'
  function mQuote(state = "loaded") {
    if (state === "loading")
      return `<div class="media"><div class="media-quote media-quote--skel">`
        + `<div class="media-quote-head"><div class="skel-line" style="width:22px;height:22px;border-radius:999px"></div>`
        + `<div class="skel-line" style="width:120px;height:10px"></div></div>`
        + `<div style="margin-top:9px;display:flex;flex-direction:column;gap:7px"><div class="skel-line" style="width:96%"></div><div class="skel-line" style="width:72%"></div></div>`
        + `</div></div>`;
    if (state === "gone")
      return `<div class="media"><div class="media-quote media-quote--gone">`
        + `<span class="media-quote-mark">${ic("alert", 17)}</span>`
        + `<div><div class="qg-t">Post unavailable</div><div class="qg-s">This post may have been deleted or is from a private account.</div></div>`
        + `</div></div>`;
    const withThumb = state === "thumb";
    const thumb = withThumb ? `<div class="media-quote-thumb">${ph("", { bare: true })}</div>` : "";
    return `<div class="media"><div class="media-quote">`
      + `<div class="media-quote-head"><img class="avatar-img" src="${A}c-devon.png" width="22" height="22" alt=""/>`
      + `<span class="media-quote-handle">@devon</span><span class="media-quote-sub"><span class="sep">·</span>May 27</span></div>`
      + `<div class="media-quote-body"><div class="media-quote-text">honestly how do you even start writing when your brain is completely blank? i sit down and nothing comes out, then i scroll for an hour and feel worse. how do you push past the empty page every single day?</div>${thumb}</div>`
      + `</div></div>`;
  }

  // 9 — NONE (text only). returns empty.
  const mNone = () => "";

  /* ============================ CARD SHELLS =========================== */
  const BODIES = {
    image: "Took my notebook outside this morning. Something about writing by hand in the sun makes the sentences slower — and slower is usually better.",
    carousel: "Four pages from this week’s journal. The messy ones are always the ones that turn into something.",
    video: "Recorded a full writing session and sped it up. 90 minutes of staring, three minutes of typing, one paragraph I’ll actually keep.",
    gif: "How it feels every time the first line finally clicks.",
    audio: "Read this one out loud — sometimes a piece only tells you it’s finished when you hear it.",
    link: "Came back to this interview again today. The bit about finishing the bad draft before judging it never stops being true.",
    poll: "Settle a debate for me: when you sit down to write, what actually works?",
    quote: "Saw this and felt it in my bones. Here’s the honest answer I wish someone had told me at the start. 👇",
    none: "The best feedback I ever got on my writing was four words: “I can hear you.” Three years later it’s still the only metric I actually trust.",
  };

  function vbadge(kind, ratio) {
    if (kind === "settling") return `<span class="vbadge vbadge--settling">${ic("clock", 12)}Still settling</span>`;
    if (kind === "over") return `<span class="vbadge vbadge--over">${ic("arrow-up", 12)}${ratio || "2.4"}× average</span>`;
    if (kind === "under") return `<span class="vbadge">${ratio || "0.6"}× average</span>`;
    return `<span class="vbadge">On par</span>`;
  }

  // WEB card (.feed-card). o: { media, body, badge, ratio, m, autoReplies }
  function webCard(o = {}) {
    const m = o.m || { views: "48.2K", likes: "1.2K", comments: "84", reposts: "63" };
    const ar = o.autoReplies !== false;
    return `<article class="feed-card">`
      + `<div class="draft-head"><img class="avatar-img" src="${A}mara.png" width="38" height="38" alt=""/>`
      + `<div class="draft-id"><div class="draft-name">Mara Lin</div>`
      + `<div class="draft-sub"><span>@mara.lin</span><span class="sep">·</span><span>May 30</span></div></div>`
      + vbadge(o.badge || "over", o.ratio || "3.3") + `</div>`
      + `<p class="draft-body">${o.body || BODIES.none}</p>`
      + (o.media || "")
      + `<div class="metrics"><div class="metric metric--hero">${ic("eye", 18)}<span class="m-num">${m.views}</span><span class="m-lbl">views</span></div>`
      + `<div class="metric metric--sub">${ic("heart", 15)}<span class="m-num">${m.likes}</span></div>`
      + `<div class="metric metric--sub">${ic("bubble", 15)}<span class="m-num">${m.comments}</span></div>`
      + `<div class="metric metric--sub">${ic("repost", 15)}<span class="m-num">${m.reposts}</span></div></div>`
      + `<div class="feed-foot"><button class="ar-pill ${ar ? "ar-pill--on" : ""}">${ar ? ic("reply", 14) : '<span class="ar-dot"></span>'}Auto-replies ${ar ? "on" : "off"}</button>`
      + `<div class="feed-actions"><button class="btn btn--ghost btn--sm">${ic("chart", 15)} Growth ${ic("chev-down", 14)}</button>`
      + `<a class="btn btn--primary btn--sm">${ic("external", 15)} Open on Threads</a>`
      + `<div class="menu-anchor"><button class="icon-btn" style="width:34px;height:34px" aria-label="More actions">${ic("more", 17)}</button></div>`
      + `</div></div></article>`;
  }

  // PHONE card (.m-card). o: { media, body, badge, ratio, m, autoReplies }
  function mobCard(o = {}) {
    const m = o.m || { views: "48.2K", likes: "1.2K", comments: "84", reposts: "63" };
    const ar = o.autoReplies !== false;
    return `<article class="m-card">`
      + `<div class="m-card-head"><img class="avatar-img" src="${A}mara.png" width="38" height="38" alt=""/>`
      + `<div class="m-card-id"><div class="m-card-name">Mara Lin</div>`
      + `<div class="m-card-sub"><span>@mara.lin</span><span class="sep">·</span><span>May 30</span></div></div>`
      + vbadge(o.badge || "over", o.ratio || "3.3") + `</div>`
      + `<p class="m-card-body">${o.body || BODIES.none}</p>`
      + (o.media || "")
      + `<div class="m-metrics"><div class="m-metric-hero">${ic("eye", 18)}<span class="m-num">${m.views}</span><span class="m-lbl">views</span></div>`
      + `<div class="m-metric-subs"><span class="m-metric-sub">${ic("heart", 15)}${m.likes}</span><span class="m-metric-sub">${ic("bubble", 15)}${m.comments}</span><span class="m-metric-sub">${ic("repost", 15)}${m.reposts}</span></div></div>`
      + `<div class="m-foot"><div class="m-foot-meta"><button class="ar-pill ${ar ? "ar-pill--on" : ""}">${ar ? ic("reply", 14) : '<span class="ar-dot"></span>'}Auto-replies ${ar ? "on" : "off"}</button></div>`
      + `<div class="m-foot-row"><button class="m-iconbtn--foot" aria-label="Growth">${ic("chart", 18)}</button>`
      + `<a class="btn btn--primary m-btn m-btn--grow">${ic("external", 15)}Open on Threads</a>`
      + `<div class="m-menu-anchor"><button class="m-iconbtn--foot" aria-label="More actions">${ic("more", 18)}</button></div>`
      + `</div></div></article>`;
  }

  /* ============================== FRAMES ============================== */
  function wf(cardHtml, o = {}) { return `<div class="wf${o.dark ? " dark" : ""}">${cardHtml}</div>`; }
  function mc(cardHtml, o = {}) {
    const cls = "device device--auto" + (o.sm ? " device--sm" : "");
    return `<div class="${cls}"><div class="device-screen mob${o.dark ? " dark" : ""}">${cardHtml}</div></div>`;
  }
  const hLight = (l) => `<span class="dh-dot"></span>${l || "Light"}`;
  const hDark = (l) => `<span class="dh-dot dh-dot--dark"></span>${l || "Dark"}`;
  function col(head, frame, cap) {
    return `<div class="devcol">${head ? `<div class="devhead">${head}</div>` : ""}${frame}${cap ? `<div class="devcap">${cap}</div>` : ""}</div>`;
  }
  // labelled web column / phone column
  const wcol = (label, dark, cardHtml, cap) => col((dark ? hDark : hLight)(label), wf(cardHtml, { dark }), cap);
  const pcol = (label, dark, cardHtml, cap, sm) => col((dark ? hDark : hLight)(label), mc(cardHtml, { dark, sm }), cap);

  /* ============================= LIGHTBOX ============================= */
  function lightbox() {
    return `<div class="media-lightbox">`
      + `<div class="lb-bar"><button class="lb-icon" aria-label="Close">${ic("x", 18)}</button>`
      + `<span class="lb-count">1 / 1</span><span class="lb-spacer"></span>`
      + `<button class="lb-act">${ic("external", 14)} Open on Threads</button></div>`
      + `<div class="lb-stage"><div class="lb-img">${ph("1600 × 1067 · full resolution", { alt: "Sunlit desk with an open notebook and coffee" })}</div></div>`
      + `<div class="lb-cap">Sunlit desk with an open notebook and coffee — the alt text rides along into the viewer.</div>`
      + `</div>`;
  }
  function lightboxCarousel() {
    return `<div class="media-lightbox">`
      + `<div class="lb-bar"><button class="lb-icon" aria-label="Close">${ic("x", 18)}</button>`
      + `<span class="lb-count">2 / 4</span><span class="lb-spacer"></span>`
      + `<button class="lb-act">${ic("external", 14)} Open on Threads</button></div>`
      + `<div class="lb-stage"><button class="lb-nav lb-nav--l">${ic("arrow-left", 18)}</button>`
      + `<div class="lb-img">${ph("1080 × 1080 · item 2 of 4", { alt: "Carousel item 2" })}</div>`
      + `<button class="lb-nav lb-nav--r">${ic("chev-right", 18)}</button></div>`
      + `<div class="lb-cap">Carousel opens to the tapped item; ← → step through, Esc closes.</div>`
      + `</div>`;
  }

  /* ============================== ASSEMBLY ============================ */
  const set = (id, html) => { const e = document.getElementById(id); if (e) e.innerHTML = html; };
  const stage = (...cols) => cols.join("");

  // metric presets per example (so each post reads plausibly)
  const M_IMG = { views: "26.4K", likes: "612", comments: "38", reposts: "21" };
  const M_CAR = { views: "19.1K", likes: "488", comments: "29", reposts: "17" };
  const M_VID = { views: "41.7K", likes: "903", comments: "62", reposts: "44" };
  const M_GIF = { views: "33.0K", likes: "754", comments: "41", reposts: "39" };
  const M_AUD = { views: "9,820", likes: "201", comments: "14", reposts: "7" };
  const M_LNK = { views: "12.6K", likes: "243", comments: "11", reposts: "9" };
  const M_POL = { views: "22.9K", likes: "377", comments: "96", reposts: "12" };
  const M_QUO = { views: "31.8K", likes: "902", comments: "47", reposts: "28" };

  // ---- auto-reply flag (per-post · populates Autopilot "Selected")
  function arToast(on) {
    return `<div class="toast toast--${on ? "success" : "error"}"><span class="toast-mark"></span>`
      + `<div class="toast-body"><div class="toast-title">Auto-replies ${on ? "on" : "off"} for this post</div>`
      + `<div class="toast-sub">${on ? "Pennedly will draft replies to new comments." : "New comments won’t get drafted replies."}</div></div></div>`;
  }
  set("stg-flag", stage(
    wcol("Flag · ON (accent)", false, webCard({ media: "", body: BODIES.none, badge: "over", ratio: "3.3", autoReplies: true }), "Accent pill — <code>IcReply</code> + “Auto-replies on”. Small, secondary; never dominates the metrics."),
    wcol("Flag · OFF (neutral)", false, webCard({ media: "", body: BODIES.none, badge: "onpar", autoReplies: false }), "Neutral pill — a hollow ring + “Auto-replies off”."),
    col(hLight("Toast · on"), `<div class="wf">${webCard({ media: "", body: BODIES.none, badge: "over", ratio: "3.3", autoReplies: true })}<div style="position:absolute;left:50%;bottom:18px;transform:translateX(-50%)">${arToast(true)}</div></div>`, "Toggling fires a toast — “Auto-replies on for this post” + a sub line."),
    col(hDark("Toast · off · dark"), `<div class="wf">${webCard({ media: "", body: BODIES.none, badge: "under", ratio: "0.7", autoReplies: false })}<div style="position:absolute;left:50%;bottom:18px;transform:translateX(-50%)">${arToast(false)}</div></div>`, "Off toast, dark tokens.")
  ));

  // ---- 0 · anatomy (where the block goes)
  set("stg-anatomy", stage(
    wcol("Web · the slot", false, webCard({ media: mImage("loaded"), body: BODIES.image, badge: "over", ratio: "1.8", m: M_IMG }), "Header → text → <b>media block</b> → metrics → footer. The block sits inside card padding, full width, and never stacks (one per post)."),
    pcol("Phone · the slot", false, mobCard({ media: mImage("loaded"), body: BODIES.image, badge: "over", ratio: "1.8", m: M_IMG }), "Identical insertion point at 390px.")
  ));

  // ---- 1 · single image
  set("stg-image", stage(
    wcol("Loaded", false, webCard({ media: mImage("loaded"), body: BODIES.image, badge: "over", ratio: "1.8", m: M_IMG }), "Aspect-aware, rounded, full width. <b>Tap to expand</b> affordance bottom-right."),
    wcol("Tall · capped 4:5", false, webCard({ media: mImage("tall"), body: BODIES.image, badge: "onpar", m: M_IMG }), "Very tall images are capped at ~4:5 so one post never eats the feed."),
    wcol("Loading", false, webCard({ media: mImage("loading"), body: BODIES.image, badge: "onpar", m: M_IMG }), "Shimmer skeleton at the image’s box."),
    wcol("Failed", true, webCard({ media: mImage("failed"), body: BODIES.image, badge: "under", ratio: "0.6", m: M_IMG }), "Muted placeholder + “Image unavailable” — dark.")
  ));
  set("stg-image-m", stage(
    pcol("Loaded", false, mobCard({ media: mImage("loaded"), body: BODIES.image, badge: "over", ratio: "1.8", m: M_IMG }), "Same block, 390px."),
    pcol("Tall", false, mobCard({ media: mImage("tall"), body: BODIES.image, badge: "onpar", m: M_IMG }), "Capped 4:5 on phone."),
    pcol("Failed · dark", true, mobCard({ media: mImage("failed"), body: BODIES.image, badge: "under", ratio: "0.6", m: M_IMG }), "Graceful fallback, dark.")
  ));

  // ---- lightbox
  set("stg-lightbox", stage(
    col(hLight("Web · lightbox"), `<div class="wf">${webCard({ media: mImage("loaded"), body: BODIES.image, m: M_IMG })}${lightbox()}</div>`, "Tap-to-expand viewer over the feed — close · count · Open on Threads; alt text shown."),
    col(hDark("Phone · carousel lightbox"), mc(`${mobCard({ media: mCarousel("mid"), body: BODIES.carousel, m: M_CAR })}${lightboxCarousel()}`, { dark: true }), "Opens to the tapped item; ← → step, Esc closes.")
  ));

  // ---- 2 · carousel
  set("stg-carousel", stage(
    wcol("First item", false, webCard({ media: mCarousel("first"), body: BODIES.carousel, badge: "onpar", m: M_CAR }), "Count badge <b>1 / 4</b> top-right · dots · left arrow disabled at the start."),
    wcol("Mid-carousel", false, webCard({ media: mCarousel("mid"), body: BODIES.carousel, badge: "over", ratio: "1.6", m: M_CAR }), "Both arrows live; active dot advances. Arrows show on hover (web)."),
    wcol("Mixed image + video", true, webCard({ media: mCarousel("mixed"), body: BODIES.carousel, badge: "over", ratio: "2.0", m: M_CAR }), "Video items carry a play badge + a small duration chip — dark.")
  ));
  set("stg-carousel-m", stage(
    pcol("First", false, mobCard({ media: mCarousel("first"), body: BODIES.carousel, badge: "onpar", m: M_CAR }), "Edge-swipe on phone; same dots + count."),
    pcol("Mixed · video", false, mobCard({ media: mCarousel("mixed"), body: BODIES.carousel, badge: "over", ratio: "2.0", m: M_CAR }), "Play badge marks the video item."),
    pcol("Mid · dark", true, mobCard({ media: mCarousel("mid"), body: BODIES.carousel, badge: "over", ratio: "1.6", m: M_CAR }), "Dark tokens.")
  ));

  // ---- 3 · video
  set("stg-video", stage(
    wcol("Poster", false, webCard({ media: mVideo("poster"), body: BODIES.video, badge: "over", ratio: "2.8", m: M_VID }), "Poster + centered play badge + duration chip <b>0:42</b>."),
    wcol("Playing", false, webCard({ media: mVideo("playing"), body: BODIES.video, badge: "over", ratio: "2.8", m: M_VID }), "Click-to-play inline; slim scrubber + elapsed / total."),
    wcol("Autoplay · muted", false, webCard({ media: mVideo("autoplay"), body: BODIES.video, badge: "over", ratio: "2.8", m: M_VID }), "Muted-autoplay-in-view variant — “Muted” chip; <b>off under reduced-motion</b>."),
    wcol("Processing", true, webCard({ media: mVideo("processing"), body: BODIES.video, badge: "settling", m: { views: "1,240", likes: "44", comments: "3", reposts: "1" } }), "Still-processing / unavailable fallback — dark.")
  ));
  set("stg-video-m", stage(
    pcol("Poster", false, mobCard({ media: mVideo("poster"), body: BODIES.video, badge: "over", ratio: "2.8", m: M_VID }), "16:9 poster, big tap target."),
    pcol("Playing", false, mobCard({ media: mVideo("playing"), body: BODIES.video, badge: "over", ratio: "2.8", m: M_VID }), "Inline scrubber."),
    pcol("Autoplay · dark", true, mobCard({ media: mVideo("autoplay"), body: BODIES.video, badge: "over", ratio: "2.8", m: M_VID }), "Muted autoplay, dark.")
  ));

  // ---- 4 · gif
  set("stg-gif", stage(
    wcol("Looping", false, webCard({ media: mGif(), body: BODIES.gif, badge: "over", ratio: "2.2", m: M_GIF }), "Auto-loops, muted, lighter than video: a <b>GIF</b> chip, no duration."),
    wcol("Looping · dark", true, webCard({ media: mGif(), body: BODIES.gif, badge: "over", ratio: "2.2", m: M_GIF }), "Dark tokens; loop pauses under reduced-motion.")
  ));
  set("stg-gif-m", stage(
    pcol("Looping", false, mobCard({ media: mGif(), body: BODIES.gif, badge: "over", ratio: "2.2", m: M_GIF }), "Same GIF chip at 390px.")
  ));

  // ---- 5 · audio
  set("stg-audio", stage(
    wcol("Idle", false, webCard({ media: mAudio("idle"), body: BODIES.audio, badge: "onpar", m: M_AUD }), "One line tall: play · waveform · <b>0:00 / 1:48</b>. Display only — never composed in Pennedly."),
    wcol("Playing", false, webCard({ media: mAudio("playing"), body: BODIES.audio, badge: "onpar", m: M_AUD }), "Pause icon; progress fills the waveform in accent."),
    wcol("Playing · dark", true, webCard({ media: mAudio("playing"), body: BODIES.audio, badge: "onpar", m: M_AUD }), "Dark tokens.")
  ));
  set("stg-audio-m", stage(
    pcol("Idle", false, mobCard({ media: mAudio("idle"), body: BODIES.audio, badge: "onpar", m: M_AUD }), "Fits the phone width, still one line."),
    pcol("Playing · dark", true, mobCard({ media: mAudio("playing"), body: BODIES.audio, badge: "onpar", m: M_AUD }), "Dark.")
  ));

  // ---- 6 · link card
  set("stg-link", stage(
    wcol("Loaded", false, webCard({ media: mLink("loaded"), body: BODIES.link, badge: "onpar", m: M_LNK }), "Thumb left (web) · title (2 lines) · domain. Whole card links out."),
    wcol("Loading", false, webCard({ media: mLink("loading"), body: BODIES.link, badge: "onpar", m: M_LNK }), "Preview generates from OpenGraph — skeleton while it resolves."),
    wcol("Unavailable", true, webCard({ media: mLink("unavailable"), body: BODIES.link, badge: "under", ratio: "0.7", m: M_LNK }), "No thumb → tidy domain + URL chip. Never looks broken — dark.")
  ));
  set("stg-link-m", stage(
    pcol("Loaded", false, mobCard({ media: mLink("loaded"), body: BODIES.link, badge: "onpar", m: M_LNK }), "Thumbnail stacks on <b>top</b> at phone width."),
    pcol("Unavailable", false, mobCard({ media: mLink("unavailable"), body: BODIES.link, badge: "under", ratio: "0.7", m: M_LNK }), "Domain + URL chip fallback."),
    pcol("Loading · dark", true, mobCard({ media: mLink("loading"), body: BODIES.link, badge: "onpar", m: M_LNK }), "Skeleton, dark.")
  ));

  // ---- 7 · poll
  set("stg-poll", stage(
    wcol("Open", false, webCard({ media: mPoll("open"), body: BODIES.poll, badge: "over", ratio: "1.5", m: M_POL }), "Question is the post text; rows show live % bars, counts + total. Read-only here."),
    wcol("Closed", true, webCard({ media: mPoll("closed"), body: BODIES.poll, badge: "over", ratio: "1.5", m: M_POL }), "Winner emphasised (success + check); others recede — dark.")
  ));
  set("stg-poll-m", stage(
    pcol("Open", false, mobCard({ media: mPoll("open"), body: BODIES.poll, badge: "over", ratio: "1.5", m: M_POL }), "Bars wrap nothing — labels truncate before clipping."),
    pcol("Closed · dark", true, mobCard({ media: mPoll("closed"), body: BODIES.poll, badge: "over", ratio: "1.5", m: M_POL }), "Final standings, dark.")
  ));

  // ---- 8 · quote / repost
  set("stg-quote", stage(
    wcol("Loaded", false, webCard({ media: mQuote("loaded"), body: BODIES.quote, badge: "over", ratio: "2.1", m: M_QUO }), "Inset mini-card: avatar · @handle · time · 3-line text. Reads as nested."),
    wcol("With media thumb", false, webCard({ media: mQuote("thumb"), body: BODIES.quote, badge: "over", ratio: "2.1", m: M_QUO }), "Quoted post had an image → a small thumbnail rides alongside."),
    wcol("Loading", false, webCard({ media: mQuote("loading"), body: BODIES.quote, badge: "onpar", m: M_QUO }), "The quote loads via a second fetch — skeleton."),
    wcol("Unavailable", true, webCard({ media: mQuote("gone"), body: BODIES.quote, badge: "under", ratio: "0.8", m: M_QUO }), "Deleted / private → “Post unavailable” — dark.")
  ));
  set("stg-quote-m", stage(
    pcol("Loaded", false, mobCard({ media: mQuote("loaded"), body: BODIES.quote, badge: "over", ratio: "2.1", m: M_QUO }), "Indented inset at 390px."),
    pcol("With thumb", false, mobCard({ media: mQuote("thumb"), body: BODIES.quote, badge: "over", ratio: "2.1", m: M_QUO }), "Thumbnail alongside."),
    pcol("Unavailable · dark", true, mobCard({ media: mQuote("gone"), body: BODIES.quote, badge: "under", ratio: "0.8", m: M_QUO }), "Graceful, dark.")
  ));

  // ---- 9 · none
  set("stg-none", stage(
    wcol("Text only", false, webCard({ media: "", body: BODIES.none, badge: "over", ratio: "3.3" }), "No media block — today’s card, included for contrast."),
    pcol("Text only · dark", true, mobCard({ media: "", body: BODIES.none, badge: "over", ratio: "3.3" }), "Same on phone, dark.")
  ));

  // ---- new icons row
  const NEW_ICONS = [
    ["play", "play"], ["pause", "pause"], ["volume", "volume"], ["mute", "mute"],
    ["image", "image"], ["expand", "expand"], ["poll", "poll"],
  ];
  set("stg-icons", NEW_ICONS.map(([id, name]) =>
    `<div class="iconcell"><span class="iconcell-glyph">${ic(id, 22)}</span><code>Ic${name[0].toUpperCase() + name.slice(1)}</code></div>`
  ).join(""));
})();
