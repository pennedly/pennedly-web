/* studio-thread-build.js — string builders for Studio THREAD CHAINS on the draft
   card, in every state for web (feed column) and phone (390px), light + dark.
   Pure builders on the real product layers (studio.css + studio-thread.css; media
   classes from compose-media.css) over ds/tokens.css. Icons come from the shared
   sprite (#i-*); the host page injects one NEW glyph, #i-thread, which the shipped
   set is missing (called out for icons.tsx). */
(function () {
  const A = "assets/avatars/";
  const ic = (id, s) => `<svg style="width:${s}px;height:${s}px;display:block;flex:0 0 auto" aria-hidden="true"><use href="#i-${id}"/></svg>`;

  /* a 3-part thread in Mara Lin's voice (warm, direct). */
  const PARTS = [
    "Stop optimizing your first sentence. Optimize the reason someone should still care by the third.",
    "Hooks fade in a scroll; substance is what compounds. Write the second line for the people who already stayed — not the ones you're still trying to catch.",
    "And when it's done, cut the part you're proudest of. Nine times out of ten it's the sentence that's about you, not them.",
  ];
  const SINGLE = "The fastest way to find your voice online: publish the thing you're slightly embarrassed by. The polished version is everyone's. The embarrassing one is yours.";
  // a deliberately over-length Part 2 for the over-limit state
  const OVER_P2 = "Hooks fade in a scroll; substance is what compounds, which is exactly why the second line matters more than the first — write it for the people who already chose to stay, the ones who gave you the benefit of the doubt, and keep writing for them sentence after sentence until the idea is genuinely finished, because the scroll is unforgiving and a thread that runs long without earning each new line is a thread nobody finishes, and the part you cut is always the part that was about you instead of them, so cut it twice.";

  const joinedBody = (parts) => parts.join("\n---\n");

  /* ------------------------------ card chrome ---------------------------- */
  function statusBadge(status) {
    if (status === "published") return `<span class="badge badge--good"><span class="pill-dot"></span>Published</span>`;
    return `<span class="badge badge--neutral"><span class="pill-dot" style="background:var(--color-ink-400)"></span>Draft</span>`;
  }
  function headWeb(status) {
    return `<div class="draft-head"><img class="avatar-img" src="${A}mara.png" width="38" height="38" alt=""/>`
      + `<div class="draft-id"><div class="draft-name">Mara Lin</div>`
      + `<div class="draft-sub"><span>@mara.lin</span><span class="sep">·</span><span>just now</span></div></div>${statusBadge(status)}</div>`;
  }
  function headMob(status) {
    return `<div class="m-card-head"><img class="avatar-img" src="${A}mara.png" width="38" height="38" alt=""/>`
      + `<div class="m-card-id"><div class="m-card-name">Mara Lin</div>`
      + `<div class="m-card-sub"><span>@mara.lin</span><span class="sep">·</span><span>just now</span></div></div>${statusBadge(status)}</div>`;
  }

  /* ------------------------------ char meter ----------------------------- */
  function charmeter(len) {
    const pct = Math.min(100, (len / 500) * 100);
    const tone = len > 500 ? "over" : len > 440 ? "warn" : "";
    return `<div class="charmeter ${tone}" style="flex:1 1 240px;max-width:280px"><div class="track"><div class="fill" style="width:${pct.toFixed(0)}%"></div></div><span class="cc">${len} / 500</span></div>`;
  }

  /* --------------------------- edit-mode tools --------------------------- */
  function threadTools(parts, opts = {}) {
    const counts = parts.map((t, i) => {
      const len = t.length;
      const over = len > 500;
      return `<span class="thr-count${over ? " thr-count--over" : ""}"><span class="thr-pn">Part ${i + 1}</span><span class="thr-dot">·</span>${len}/500</span>`;
    }).join("");
    const overHint = opts.over
      ? `<div class="thr-overhint">${ic("alert", 14)}<span><b>Part 2</b> is over the 500-character limit. Trim it before you can approve or publish — Pennedly never truncates a part silently.</span></div>`
      : `<div class="thr-rule-hint">${ic("thread", 13)}<span>A line with only <code>---</code> starts a new part.</span></div>`;
    return `<div class="thr-edit-tools"><div class="thr-meta">${counts}</div>`
      + `<button class="thr-newpart"><span class="tnp-ico">${ic("thread", 15)}</span>New part</button></div>${overHint}`;
  }
  function singleTools(len) {
    return `<div class="thr-edit-tools"><div class="thr-meta-single">${charmeter(len)}</div>`
      + `<button class="thr-newpart"><span class="tnp-ico">${ic("thread", 15)}</span>New part</button></div>`;
  }
  // o: { single, parts, over }
  function editor(o = {}) {
    if (o.single) {
      const body = SINGLE;
      return `<textarea class="edit-area" rows="3">${body}</textarea>${singleTools(body.length)}`;
    }
    const parts = o.over ? [PARTS[0], OVER_P2, PARTS[2]] : PARTS;
    return `<textarea class="edit-area" rows="${o.rows || 8}">${joinedSafe(parts)}</textarea>${threadTools(parts, { over: o.over })}`;
  }
  function joinedSafe(parts) { return parts.join("\n---\n"); }

  /* ----------------------------- view mode ------------------------------- */
  // o: { parts, muted, leadMedia }
  function threadView(o = {}) {
    const parts = o.parts || PARTS;
    const badge = `<div class="thr-badge">${ic("thread", 13)}Thread · ${parts.length}</div>`;
    const stack = parts.map((t, i) => {
      const lead = i === 0;
      const tag = `<div class="thr-part-tag${lead ? " thr-part-tag--lead" : ""}">${lead ? ic("thread", 11) + "Lead post" : "Part " + (i + 1)}</div>`;
      let media = "";
      if (lead && o.leadMedia) {
        media = `<div class="threadcue">${ic("thread", 14)}<span><b>Attached to the first post.</b> Media rides the lead of a thread; follow-up parts stay text-only.</span></div>${o.leadMedia}`;
      }
      return `<div class="thr-part${o.muted ? " thr-part--muted" : ""}">${tag}<div class="thr-part-body">${t}</div>${media}</div>`;
    }).join(`<div class="thr-link"></div>`);
    return `<div class="thr-view">${badge}<div class="thr-stack">${stack}</div></div>`;
  }

  /* ------------------------- lead-part media ----------------------------- */
  const ph = () => `<div class="ph"></div>`;
  function leadImages() {
    const thumb = () => `<div class="mthumb">${ph()}<button class="mthumb-alt mthumb-alt--set">${ic("check", 11)}ALT</button></div>`;
    return `<div class="cmedia"><div class="mstrip">${thumb()}${thumb()}</div><div class="mcount">2 / 20 · posts as a carousel on the lead</div></div>`;
  }

  /* ------------------------------- footers ------------------------------- */
  function footWeb(kind, o = {}) {
    if (kind === "editing") {
      const meta = o.over
        ? `<span class="thr-foot-warn">${ic("alert", 13)}Part 2 is over the limit</span>`
        : `<span class="cc-inline">Editing · thread</span>`;
      return `<div class="draft-foot"><div class="draft-meta">${meta}</div>`
        + `<div class="draft-actions"><button class="btn btn--ghost btn--sm">Cancel</button>`
        + `<button class="btn btn--primary btn--sm"${o.over ? " disabled" : ""}>${ic("check", 15)} Save</button></div></div>`;
    }
    if (kind === "published") {
      return `<div class="draft-foot"><div class="draft-stats">`
        + `<span class="stat">${ic("heart", 15)}1.2k</span><span class="stat">${ic("bubble", 15)}84</span><span class="stat">${ic("repost", 15)}57</span></div>`
        + `<div class="draft-actions"><button class="icon-btn" aria-label="More">${ic("more", 17)}</button>`
        + `<a class="btn btn--primary btn--sm">${ic("external", 15)} Open in Threads</a></div></div>`;
    }
    // draft (view)
    return `<div class="draft-foot"><div class="draft-meta"><span class="cc-inline">3 parts</span><span class="meta-sep"></span><span class="voice-tag">${ic("sparkle", 13)} In your voice</span></div>`
      + `<div class="draft-actions"><button class="icon-btn" aria-label="More">${ic("more", 17)}</button>`
      + `<button class="btn btn--primary btn--sm">${ic("check", 15)} Approve</button></div></div>`;
  }
  function footMob(kind, o = {}) {
    if (kind === "editing") {
      const meta = o.over ? `<div class="m-foot-meta"><span class="thr-foot-warn">${ic("alert", 13)}Part 2 is over the 500-character limit</span></div>` : "";
      return `<div class="m-foot">${meta}<div class="m-foot-row"><button class="btn btn--ghost m-btn">Cancel</button>`
        + `<button class="btn btn--primary m-btn m-btn--grow"${o.over ? " disabled" : ""}>${ic("check", 16)} Save</button></div></div>`;
    }
    if (kind === "published") {
      return `<div class="m-foot"><div class="m-foot-meta"><span class="stat">${ic("heart", 14)}1.2k</span><span class="meta-sep"></span><span class="stat">${ic("bubble", 14)}84</span><span class="meta-sep"></span><span class="stat">${ic("repost", 14)}57</span></div>`
        + `<div class="m-foot-row"><button class="m-iconbtn--foot" aria-label="More">${ic("more", 18)}</button>`
        + `<a class="btn btn--primary m-btn m-btn--grow">${ic("external", 16)} Open in Threads</a></div></div>`;
    }
    return `<div class="m-foot"><div class="m-foot-meta"><span class="cc-inline">3 parts</span><span class="meta-sep"></span><span class="voice-tag">${ic("sparkle", 13)} In your voice</span></div>`
      + `<div class="m-foot-row"><button class="m-iconbtn--foot" aria-label="More">${ic("more", 18)}</button>`
      + `<button class="btn btn--primary m-btn m-btn--grow">${ic("check", 16)} Approve</button></div></div>`;
  }

  /* ------------------------------- cards --------------------------------- */
  // o: { mode: 'edit-single'|'edit-thread'|'edit-over'|'view-draft'|'view-published'|'view-media' }
  function build(mode, mob) {
    const head = mob ? headMob : headWeb;
    const foot = mob ? footMob : footWeb;
    const wrap = (status, content, footHtml) =>
      mob ? `<article class="m-card${status === "published" ? " m-card--published" : ""}">${head(status)}${content}${footHtml}</article>`
          : `<article class="draft draft--${status === "published" ? "published" : "draft"}">${head(status)}${content}${footHtml}</article>`;

    if (mode === "edit-single") return wrap("draft", editor({ single: true }), foot("editing"));
    if (mode === "edit-thread") return wrap("draft", editor({}), foot("editing"));
    if (mode === "edit-over") return wrap("draft", editor({ over: true }), foot("editing", { over: true }));
    if (mode === "view-draft") return wrap("draft", threadView({}), foot("draft"));
    if (mode === "view-published") return wrap("published", threadView({ muted: true }), foot("published"));
    if (mode === "view-media") return wrap("draft", threadView({ leadMedia: leadImages() }), foot("draft"));
    return "";
  }

  window.THREAD = { ic, PARTS, build, threadView, editor, leadImages, headWeb, headMob, footWeb, footMob };
})();
