/* landing-sections-demo.js — renders the two public Landing sections in every
   state, for the spec docs (web + mobile), light + dark. Pure string builders on
   the real product layer (landing.css + landing-sections.css) over ds/tokens.css.
   Self-contained inline icons (no external sprite).

   Voice Test input is FINAL — Variant C, numbered post cards: one input field
   + an "Add post" button; each added post collapses into a compact numbered
   card stacked above the field (with × remove), the field clears for the next.
   Because each post is its own card, a paragraph break INSIDE a post never
   splits it. Cap ~5 in the UI ("Add post" hidden at cap); Run is enabled once
   there is ≥1 post. Call voiceTest(state):
     state: 'empty' | 'one' | 'filled' | 'running' | 'results' | 'error' | 'limit' */
(function () {
  const arrowR = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  const reply  = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 7 4 12l5 5M4 12h9a6 6 0 0 1 6 6v1"/></svg>';
  const alert  = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4 2.5 20.5h19L12 4Z"/><path d="M12 10v4"/><circle cx="12" cy="17.4" r="0.5" fill="currentColor"/></svg>';
  // IcPlus / IcX — same 24-grid, 1.8 stroke as landing-icons.jsx.
  const plus  = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>';
  const xmark = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6 18 18M18 6 6 18"/></svg>';

  const IDEAS = [
    { to: "@theo.makes", c: "Wait, you write ALL your replies by hand? How do you keep up?", r: "Honestly I don't keep up — I keep it small. Five real replies beat fifty rushed ones. The trick is replying like a person, not a brand." },
    { to: "@ana.writes", c: "This is the exact post I needed today. Saving it.", r: "That means a lot — genuinely. If you come back to it in a week and it still lands, that's the real test. Let me know what stuck." },
    { to: "@lucia.k", c: "Disagree. Posting daily is how you burn out, not grow.", r: "Fair pushback. I'd say daily *publishing* burned me out; daily *writing* didn't. The fix wasn't more output — it was lower stakes per post." },
  ];

  // Sample posts. POST 1 carries an internal paragraph break (a blank line) —
  // proof that breaks inside a post stay inside that post and never split it.
  const POSTS = [
    "The fastest way to find your voice online: publish the thing you're slightly embarrassed by.\n\nNot the polished take. The one you'd whisper to a friend.",
    "Writing every day didn't make me a better writer. Publishing every day did.",
    "Stop optimizing your first sentence. Optimize the reason someone should care by the third.",
  ];
  const FIVE = POSTS.concat([
    "Your first hundred posts are you clearing your throat. Keep going past them.",
    "Nobody remembers the post you almost deleted. They remember the one you shipped.",
  ]);

  const CAP = 5;

  function esc(s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function paras(s) { return s.split(/\n{2,}/).map((p) => `<p>${esc(p).replace(/\n/g, "<br>")}</p>`).join(""); }

  // Which posts a given state shows (as numbered cards above the field).
  function postsFor(state) {
    if (state === "empty") return [];
    if (state === "one") return [POSTS[0]];        // single card (with an internal break)
    if (state === "limit") return FIVE.slice();    // at cap
    return POSTS.slice();                          // filled, running, results, error → 3 cards
  }

  /* ----------------------------- shared run row + result body ----------------------------- */
  function runRow(state, canRun) {
    const cta = state === "running"
      ? `<button class="btn btn--primary btn--lg vt-cta" disabled><span class="vt-spin"></span>Drafting replies…</button>`
      : `<button class="btn btn--primary btn--lg vt-cta"${canRun ? "" : " disabled"}>Draft replies in my voice</button>`;
    return `<div class="vt-row">${cta}<span class="vt-hint">A quick taste. Nothing is saved.</span></div>`;
  }
  function resultBody(state) {
    if (state === "results") {
      return `<div class="vt-results">` + IDEAS.map((x) =>
        `<div class="vt-card"><div class="vt-to">Replying to <b>${x.to}</b> · “${x.c}”</div>`
        + `<div class="vt-reply"><span class="vt-reply-rail"></span><div class="vt-reply-body">`
        + `<span class="vt-reply-tag">${reply}In your voice</span>`
        + `<p class="vt-reply-text">${x.r}</p></div></div></div>`).join("") + `</div>`;
    }
    if (state === "error") {
      return `<div class="vt-error">${alert}Couldn’t draft replies right now. Please try again in a moment.</div>`;
    }
    return "";
  }

  /* ----------------------- input: numbered post cards + add field ----------------------- */
  function inputCards(state) {
    const posts = postsFor(state);
    const atCap = posts.length >= CAP;
    const cards = posts.length
      ? `<div class="vt-cards">` + posts.map((t, i) =>
          `<div class="vt-pcard"><span class="vt-pcard-n">${i + 1}</span>`
          + `<div class="vt-pcard-text">${paras(t)}</div>`
          + `<button class="vt-pcard-rm" type="button" aria-label="Remove post ${i + 1}">${xmark}</button></div>`).join("")
        + `</div>`
      : "";
    const field = atCap
      ? `<div class="vt-cap-note vt-cap-note--field">${plus}That’s the max. Remove one to add another (up to ${CAP}).</div>`
      : `<div class="vt-compose"><textarea class="vt-compose-ta" rows="2" placeholder="${posts.length ? "Paste your next post, then press Add…" : "Paste a post, then press Add…"}"></textarea>`
        + `<button class="vt-compose-add" type="button">${plus}Add post</button></div>`;
    return cards + field;
  }

  /* ----------------------------- assemble Voice Test ----------------------------- */
  // state: 'empty' | 'one' | 'filled' | 'running' | 'results' | 'error' | 'limit'
  function voiceTest(state) {
    const canRun = postsFor(state).length >= 1; // ≥1 post required to run
    return `<section class="voicetest"><div class="wrap">`
      + `<div class="vt-head"><p class="eyebrow">Try it free</p>`
      + `<h2 class="vt-title">Watch Pennedly reply in your voice</h2>`
      + `<p class="vt-sub">Paste a few of your posts and watch Pennedly draft replies that sound like you. No signup.</p></div>`
      + `<div class="vt-box vt-box--cards">${inputCards(state)}${runRow(state, canRun)}${resultBody(state)}</div>`
      + `</div></section>`;
  }

  /* --------------------------- The difference (unchanged) --------------------------- */
  const STEPS = [
    { t: "Drafts in your voice", d: "Every reply and post is written from your role-book — then waits for your approval. Nothing publishes on its own." },
    { t: "Measures what landed", d: "It watches which approved posts actually earned reach, replies and saves — your real signal, not vanity metrics." },
    { t: "Adjusts every week", d: "It tunes your voice toward what worked and quietly rolls back anything that hurt your reach. A loop, not a one-shot." },
  ];
  function difference(stack) {
    const arrow = `<span class="diff-arrow">${arrowR}</span>`;
    const cards = STEPS.map((s, i) =>
      `<div class="diff-step"><span class="diff-num">${i + 1}</span><div class="diff-st">${s.t}</div><div class="diff-sd">${s.d}</div></div>`);
    const steps = cards.join(arrow);
    return `<section class="difference"><div class="wrap">`
      + `<div class="diff-head"><p class="eyebrow">The difference</p>`
      + `<h2 class="diff-title">A coach that learns what works</h2>`
      + `<p class="diff-sub">It’s a loop, not a one-shot: every week it reviews what worked, adjusts your voice, and quietly rolls back anything that hurt your reach.</p></div>`
      + `<div class="diff-steps${stack ? " diff-steps--stack" : ""}">${steps}</div>`
      + `</div></section>`;
  }

  /* ---- full landing page (faithful to landing-parts.jsx) — so the spec can show
     Voice Test in context, under the real top bar + hero, not floating. Mirrors the
     React markup/classes; copy from landing-data.jsx. -------------------------------- */
  function ico(body, size) { return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`; }
  const I = {
    globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.3 2.5 14.7 0 17M12 3.5c-2.5 2.3-2.5 14.7 0 17"/>',
    chev: '<path d="M5 9l7 7 7-7"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    mail: '<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M4 7l8 6 8-6"/>',
    sparkle: '<path d="M12 4l1.6 4.8L18.5 10l-4.9 1.2L12 16l-1.6-4.8L5.5 10l4.9-1.2L12 4Z"/>',
    voice: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
    pencil: '<path d="M4 20h4L18.5 9.5a2 2 0 0 0-2.8-2.8L5 17.2V20Z"/><path d="M14.5 8.5l1.8 1.8"/>',
    check: '<path d="M4.5 12.5 9.5 17.5 19.5 6.5"/>',
  };
  function logo(size, radius, cls) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 512 512" aria-label="Pennedly"${cls ? ` class="${cls}"` : ""} style="display:block;border-radius:${radius}px">`
      + `<rect width="512" height="512" rx="115" fill="var(--color-text)"/>`
      + `<g fill="var(--color-bg)"><path d="M182 348 C248 366 322 352 376 312 C326 330 252 340 188 326 C176 324 174 344 182 348 Z"/>`
      + `<g transform="rotate(42 256 256)"><path d="M236 150 Q236 128 256 128 Q276 128 276 150 L276 300 L256 360 L236 300 Z"/><rect x="236" y="206" width="40" height="7"/></g></g></svg>`;
  }
  function av(src, size) { return `<span class="avatar" style="width:${size}px;height:${size}px"><img class="avatar-img" src="${src}" alt=""/></span>`; }

  function landTop() {
    return `<header class="land-top"><div class="wrap land-top-row">`
      + `<div class="brand">${logo(30, 9, "bm")}<span class="bn">Pennedly</span></div>`
      + `<span class="sp"></span>`
      + `<div class="actions">`
      + `<div class="lang"><button class="lang-trigger" type="button" aria-haspopup="listbox" aria-expanded="false" aria-label="Change language">${ico(I.globe, 16)}<span class="lang-code">EN</span>${ico(I.chev, 14)}</button></div>`
      + `<button class="icon-btn" type="button" aria-label="Toggle theme">${ico(I.moon, 16)}</button>`
      + `<a class="btn btn--primary" href="Login.html">Sign in</a>`
      + `</div></div></header>`;
  }
  function studioWindow() {
    const accts = [["assets/avatars/mara.png", 1], ["assets/avatars/c-theo.png", 0], ["assets/avatars/c-ana.png", 0], ["assets/avatars/c-lucia.png", 0]];
    const rail = accts.map((a) => `<span class="rail-acct ${a[1] ? "is-active" : ""}">${av(a[0], 28)}</span>`).join("")
      + `<span class="rail-add" aria-hidden="true">${ico('<path d="M12 5v14M5 12h14"/>', 15)}</span>`;
    return `<div class="window land-rise" aria-hidden="true">`
      + `<div class="winbar"><span class="dots"><i></i><i></i><i></i></span><span class="url">app.pennedly.com<span class="url-path">/studio</span></span></div>`
      + `<div class="app"><aside class="rail">${rail}</aside>`
      + `<div class="compose"><div class="compose-head">${av("assets/avatars/mara.png", 34)}`
      + `<div class="spec-id"><div class="spec-name">Mara Lin</div><div class="spec-handle">@mara.lin</div></div>`
      + `<span class="badge"><span class="bdot"></span> Draft</span></div>`
      + `<p class="compose-text">The fastest way to find your voice online: publish the thing you're slightly embarrassed by. The polished version is everyone's. The embarrassing one is yours.<span class="caret"></span></p>`
      + `<div class="compose-tools"><span class="chip chip--accent">${ico(I.sparkle, 12)} In your voice</span><span class="chip">${ico(I.voice, 12)} Warm, direct</span></div>`
      + `<div class="compose-foot"><span class="foot-note">Drafting in Mara's voice</span><span class="grow"></span>`
      + `<span class="ghost">${ico(I.pencil, 13)} Edit</span><span class="ink">${ico(I.check, 13)} Approve</span></div>`
      + `</div></div></div>`;
  }
  function hero() {
    return `<section class="hero"><div class="wrap hero-grid">`
      + `<div class="hero-text land-rise">`
      + `<span class="status"><span class="sdot"></span> In development · invite-only beta</span>`
      + `<h1 class="hero-title">Run Threads like a pro, in your own voice.</h1>`
      + `<p class="hero-lead">Pennedly drafts posts and replies in your voice, audits what's working, and shows you what's landing across every account you run.</p>`
      + `<p class="hero-approve">You approve every word. <span class="emph">Autopilot's there when you want it.</span></p>`
      + `<div class="hero-cta"><a class="btn btn--primary btn--lg" href="Login.html">Sign in ${ico(I.arrow, 17)}</a>`
      + `<a class="contact" href="mailto:hello@pennedly.com">${ico(I.mail, 15)} hello@pennedly.com</a></div>`
      + `</div>${studioWindow()}</div></section>`;
  }
  function footer() {
    return `<footer class="land-foot"><div class="wrap land-foot-row">`
      + `<span class="foot-brand">${logo(20, 6, "fm")} © 2026 Pennedly</span>`
      + `<span class="foot-sp"></span>`
      + `<nav class="foot-links" aria-label="Legal"><a href="#privacy">Privacy Policy</a><a href="#terms">Terms of Service</a><a href="#data-deletion">Data Deletion</a></nav>`
      + `</div></footer>`;
  }
  // Full page with the Voice Test (Variant C) shown in its real position: hero →
  // Voice Test → difference → footer. `state` drives the Voice Test.
  function landPage(state) {
    return `<div class="land">${landTop()}${hero()}${voiceTest(state || "filled")}${difference(false)}${footer()}</div>`;
  }

  window.LSEC = { voiceTest, difference, landPage };
})();
