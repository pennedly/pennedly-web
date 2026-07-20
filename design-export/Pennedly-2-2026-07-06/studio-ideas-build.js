/* studio-ideas-build.js — string builders for the Studio "Ideas" hook-brainstorm
   panel, rendered in EVERY state for web (feed column) and phone (390px), light
   and dark. Pure builders on the real product layers (studio.css for web,
   pennedly-mobile.css for phone) over ds/tokens.css + studio-ideas.css. Icons
   come from the shared sprite (#i-*); the host page injects one NEW glyph,
   #i-reload, that the shipped icon set is missing (called out for icons.tsx). */
(function () {
  const A = "assets/avatars/";
  const ic = (id, s) => `<svg style="width:${s}px;height:${s}px;display:block;flex:0 0 auto" aria-hidden="true"><use href="#i-${id}"/></svg>`;
  const spark = (s = 13) => `<span class="chip-ico">${ic("sparkle", s)}</span>`;

  /* ~8 ideas in the account's own voice (Mara Lin — warm, direct, a writer who
     posts about writing & shipping). Each = a bold HOOK (ready-to-expand opening
     line) + a muted ANGLE (where the post goes). Copy runs long on purpose so the
     cards are proven to wrap, never clip. */
  const IDEAS_DATA = [
    { hook: "The best post I wrote this year took four minutes and broke every rule I'd been taught.",
      angle: "A short story about overthinking — argue momentum beats polish." },
    { hook: "Finding your voice mostly means deleting the sentences that sound like everyone else.",
      angle: "Craft note: subtraction is the real edit." },
    { hook: "I almost didn't post the thing that did the best. Here's exactly what stopped me.",
      angle: "Vulnerability — the embarrassing draft outperforms the safe one." },
    { hook: "Writing every day didn't make me a better writer. Publishing every day did.",
      angle: "Contrarian take on practice vs. shipping." },
    { hook: "Someone asked how I come up with ideas. The honest answer: I just stopped throwing them away.",
      angle: "Process post — capture, don't manufacture." },
    { hook: "The trend everyone's chasing this week is already over. Here's the quieter one underneath it.",
      angle: "React to a trend, then reframe to the durable signal." },
    { hook: "I used to think a small audience meant I was doing it wrong.",
      angle: "Encouragement for early creators — depth over reach." },
    { hook: "Three sentences I almost published, and the one word that would've made them mine.",
      angle: "Teardown of voice at the word level." },
  ];

  /* ----------------------------- the chip row ---------------------------- */
  // o: { active, disabled: false | 'voice' | 'account' }
  function chipRow(o = {}) {
    let ideas, hint = "";
    if (o.disabled) {
      ideas = `<button class="chip chip--ideas chip--ideas-disabled" disabled aria-disabled="true">${spark()}Ideas</button>`;
      hint = `<span class="ideas-chip-hint">${o.disabled === "account"
        ? "Connect an account to brainstorm ideas"
        : "Finish setting up your voice to brainstorm ideas"}</span>`;
    } else {
      ideas = `<button class="chip chip--ideas${o.active ? " is-active" : ""}"${o.active ? ' aria-expanded="true"' : ""}>${spark()}Ideas</button>`;
    }
    const others = ["A lesson from this week", "React to a trend", "An unpopular opinion"]
      .map((t) => `<button class="chip">${spark()}${t}</button>`).join("");
    return ideas + hint + others;
  }

  /* ------------------------------ idea cards ----------------------------- */
  function ideaCard(d, o = {}) {
    return `<button class="idea-card${o.hover ? " is-hover" : ""}">`
      + `<span class="idea-text"><span class="idea-hook">${d.hook}</span><span class="idea-angle">${d.angle}</span></span>`
      + `<span class="idea-use">${ic("arrow-up", 14)}Use</span></button>`;
  }
  function ideaList(n, hoverIdx) {
    return `<div class="ideas-list">`
      + IDEAS_DATA.slice(0, n || IDEAS_DATA.length).map((d, i) => ideaCard(d, { hover: i === hoverIdx })).join("")
      + `</div>`;
  }

  /* ------------------------------- the panel ----------------------------- */
  function head(opts = {}) {
    const refresh = opts.noRefresh ? "" : `<button class="ideas-iconbtn" aria-label="Refresh ideas" title="More ideas">${ic("reload", 16)}</button>`;
    return `<div class="ideas-head"><span class="ideas-cap">${ic("sparkle", 12)}Ideas in your voice</span>`
      + `<div class="ideas-head-acts">${refresh}<button class="ideas-iconbtn" aria-label="Close ideas">${ic("x", 16)}</button></div></div>`;
  }
  // state: 'results' | 'loading' | 'error' | 'empty'; opts: { n, hoverIdx }
  function panel(state, opts = {}) {
    if (state === "loading") {
      const skel = `<div class="ideas-skel-list">${[0, 1, 2].map(() => `<div class="ideas-skel-card"></div>`).join("")}</div>`;
      return `<div class="ideas-panel">${head({ noRefresh: true })}`
        + `<div class="ideas-loading"><span class="spark">${ic("sparkle", 17)}</span>`
        + `<span class="ideas-loading-text">Brainstorming ideas in your voice…</span></div>${skel}</div>`;
    }
    if (state === "error") {
      return `<div class="ideas-panel">${head({ noRefresh: true })}`
        + `<div class="ideas-error"><span class="ie-ico">${ic("alert", 15)}</span>`
        + `<span class="ideas-error-text">Couldn't get ideas.</span>`
        + `<button class="ideas-retry">${ic("reload", 14)}Try again</button></div></div>`;
    }
    if (state === "empty") {
      return `<div class="ideas-panel">${head({ noRefresh: true })}`
        + `<div class="ideas-empty"><div class="ideas-empty-t">No ideas right now.</div>`
        + `<div class="ideas-empty-s">Pennedly riffs from your role-book and your top posts. Add a few of your own posts or finish setting up your voice, and ideas will show up here.</div></div></div>`;
    }
    // results
    return `<div class="ideas-panel">${head()}${ideaList(opts.n, opts.hoverIdx)}</div>`;
  }

  /* --------------------------- composer (web) ---------------------------- */
  // o: { value, chip:{active,disabled}, panel:html, seeded }
  function composerWeb(o = {}) {
    const value = o.value || "";
    const av = `<img class="avatar-img" src="${A}mara.png" width="38" height="38" alt=""/>`;
    const top = `<div class="composer-top">${av}<textarea class="composer-input" rows="1" placeholder="What do you want to write about? A topic, a hot take, a link…">${value}</textarea></div>`;
    const row = `<div class="composer-row"><div class="chips">${chipRow(o.chip || {})}</div>`
      + `<div class="composer-tools"><select class="field count-select" aria-label="Drafts to generate"><option>1 draft</option><option selected>3 drafts</option><option>4 drafts</option></select>`
      + `<button class="btn btn--primary"${value.trim() ? "" : " disabled"}>${ic("nib", 16)}Generate</button></div></div>`;
    const seeded = o.seeded ? `<div class="ideas-seeded-note">${ic("sparkle", 13)}Seeded from an idea — edit freely, then Generate.</div>` : "";
    return `<div class="composer">${top}${row}${seeded}${o.panel || ""}</div>`;
  }

  /* -------------------------- composer (phone) --------------------------- */
  function composerMob(o = {}) {
    const value = o.value || "";
    const editor = `<textarea class="m-composer-input" placeholder="What do you want to write about? A topic, a hot take, a link…">${value}</textarea>`;
    const chiprow = `<div class="m-chiprow">${chipRow(o.chip || {})}</div>`;
    const foot = `<div class="m-composer-foot"><select class="field count-select" aria-label="Drafts to generate"><option>1 draft</option><option selected>3 drafts</option><option>4 drafts</option></select>`
      + `<button class="btn btn--primary m-gen"${value.trim() ? "" : " disabled"}>${ic("nib", 16)}Generate</button></div>`;
    const seeded = o.seeded ? `<div class="ideas-seeded-note">${ic("sparkle", 13)}Seeded from an idea — edit, then Generate.</div>` : "";
    return `<div class="m-composer">${editor}${chiprow}${foot}${seeded}${o.panel || ""}</div>`;
  }

  window.IDEAS = { ic, IDEAS_DATA, chipRow, ideaCard, ideaList, panel, head, composerWeb, composerMob };
})();
