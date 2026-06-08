/* mobile/mock.js — shared mockup builders for the Pennedly mobile docs.
   Returns HTML strings for the live phone previews embedded in the Design
   System (Mobile section) and the *-Mobile-SPEC.html files. Every mockup is
   the REAL product layer (pennedly-mobile.css on ds/tokens.css), so what the
   spec shows is what the recipe produces — in light and dark.

   Conventions: pass dark:true for the dark-theme variant; all icons come from
   the shared sprite (mobile/sprite.js). */
(function () {
  const A = 'assets/avatars/';
  const ic = (id, s) => `<svg style="width:${s}px;height:${s}px;display:block" aria-hidden="true"><use href="#i-${id}"/></svg>`;

  /* ------------------------------ status bar ------------------------------ */
  function statusbar() {
    return `<div class="m-status"><span>9:41</span><span class="m-status-r">`
      + `<svg style="width:17px;height:11px;display:block"><use href="#i-signal"/></svg>`
      + `<svg style="width:17px;height:12px;display:block"><use href="#i-wifi"/></svg>`
      + `<svg style="width:24px;height:13px;display:block"><use href="#i-battery"/></svg></span></div>`;
  }

  /* -------------------------------- top bar ------------------------------- */
  // opts: { title, brand, pill ('success'|'warning'), action ('settings'|'search'|null), back }
  function top(opts = {}) {
    const o = opts;
    let left;
    if (o.brand) {
      left = `<div class="m-top-brand"><img class="m-brand-mark" src="${A}mara.png" width="30" height="30" alt=""/><span class="m-brand-name">Pennedly</span></div>`;
    } else {
      left = (o.back ? `<button class="m-iconbtn m-iconbtn--plain">${ic('arrow-left',20)}</button>` : '')
        + `<div class="m-top-title">${o.title || 'Studio'}</div>`;
    }
    let pill = '';
    if (o.pill === 'success') pill = `<span class="status-pill status-pill--success"><i class="pill-dot"></i>Voice active</span>`;
    if (o.pill === 'warning') pill = `<span class="status-pill status-pill--warning"><i class="pill-dot"></i>Voice not set up</span>`;
    const action = o.action ? `<button class="m-iconbtn">${ic(o.action,18)}</button>` : '';
    const themeBtn = `<button class="m-iconbtn">${ic('moon',18)}</button>`;
    const avatar = `<button class="m-avatar-btn"><img class="avatar-img" src="${A}mara.png" width="32" height="32" alt=""/></button>`;
    return `<header class="m-top">${left}${pill}<div class="m-top-spacer"></div>`
      + `<div class="m-top-actions">${action}${themeBtn}${avatar}</div></header>`;
  }

  /* ------------------------------- tab bar -------------------------------- */
  // active: 'studio'|'feed'|'replies'|'mentions'|'more'; opts.testers=false → 3 tabs
  function tabs(active = 'studio', opts = {}) {
    const testers = opts.testers !== false;
    const T = (key, icon, label, badge) => {
      const act = active === key ? ' m-tab--active' : '';
      const b = badge ? `<span class="m-tab-badge">${badge}</span>` : '';
      return `<a class="m-tab${act}"><svg class="m-tab-ic"><use href="#i-${icon}"/></svg>${b}<span class="m-tab-lbl">${label}</span></a>`;
    };
    let inner;
    if (testers) {
      inner = T('studio','nib','Studio',4) + T('feed','feed','Feed') + T('replies','bubble','Replies',3)
        + T('mentions','at','Mentions') + T('more','grid','More');
    } else {
      inner = T('studio','nib','Studio',4) + T('feed','feed','Feed') + T('more','grid','More');
    }
    return `<nav class="m-tabbar">${inner}</nav>`;
  }

  /* -------------------------------- phone --------------------------------- */
  // opts: { dark, variant ('sm'|'short'|'tall'|'auto'), top, body, tabs (html|false), overlay, flush }
  function phone(opts = {}) {
    const o = opts;
    const cls = ['device', o.variant ? 'device--' + o.variant : ''].join(' ').trim();
    const island = o.variant === 'auto' ? '' : '<div class="device-island"></div>';
    const tabbar = o.tabs === false ? '' : (o.tabs || tabs('studio'));
    const contentCls = 'm-content' + (o.flush ? ' m-content--flush' : '');
    const scroll = o.rawBody
      ? o.body
      : `<div class="m-scroll"><div class="${contentCls}">${o.body || ''}</div></div>`;
    return `<div class="${cls}">${island}<div class="device-screen mob${o.dark ? ' dark' : ''}">`
      + `${statusbar()}${o.top || top({title:'Studio'})}${scroll}${tabbar}${o.overlay || ''}</div></div>`;
  }

  /* an auto-height frame holding an isolated component (no shell) */
  function comp(html, opts = {}) {
    const cls = ['device', 'device--auto', opts.sm ? 'device--sm' : ''].join(' ').trim();
    return `<div class="${cls}"><div class="device-screen mob${opts.dark ? ' dark' : ''}">${html}</div></div>`;
  }

  /* a captioned column in a stage */
  function col(head, phoneHTML, cap) {
    const h = head ? `<div class="devhead">${head}</div>` : '';
    const c = cap ? `<div class="devcap">${cap}</div>` : '';
    return `<div class="devcol">${h}${phoneHTML}${c}</div>`;
  }
  function light(label) { return `<span class="dh-dot"></span>${label || 'Light'}`; }
  function dark(label) { return `<span class="dh-dot dh-dot--dark"></span>${label || 'Dark'}`; }

  /* ============================= COMPONENTS ============================== */

  function composer(state = 'default') {
    if (state === 'busy') {
      return `<div class="m-composer m-composer--busy"><div class="m-drafting"><span class="nib">${ic('nib',24)}</span>`
        + `<span class="m-drafting-text">Drafting <b>3</b> posts in your voice<span class="dots"><i></i><i></i><i></i></span></span></div></div>`;
    }
    const filled = state === 'filled';
    const ph = filled
      ? `Why most "post daily" advice quietly burns creators out`
      : '';
    const val = filled ? ` data-filled` : '';
    const chip = (t) => `<button class="chip">${ic('sparkle',13)}${t}</button>`;
    return `<div class="m-composer">`
      + `<textarea class="m-composer-input" placeholder="What do you want to write about? A topic, a hot take, a link…">${ph}</textarea>`
      + `<div class="m-chiprow">${chip('A lesson from this week')}${chip('React to a trend')}${chip('Reply to recent mentions')}${chip('An unpopular opinion')}</div>`
      + `<div class="m-composer-foot"><select class="field count-select"><option>1 draft</option><option selected>3 drafts</option><option>4 drafts</option></select>`
      + `<button class="btn btn--primary m-gen"${filled?'':' disabled'}>${ic('nib',16)}Generate</button></div></div>`;
  }

  function filterbar(active = 'ready') {
    const f = (key, dot, label, count) => `<button class="m-filter${active===key?' m-filter--active':''}"><span class="fdot dot-${dot}"></span>${label}<span class="fcount">${count}</span></button>`;
    return `<div class="m-substick"><div class="m-filterbar">`
      + f('ready','ready','Ready to publish',2) + f('draft','draft','Drafts',4)
      + f('published','published','Published',9) + f('rejected','rejected','Rejected',1)
      + `</div></div>`;
  }

  const badge = {
    ready: `<span class="badge" style="background:color-mix(in srgb,var(--color-accent) 12%,var(--color-surface));color:var(--color-accent);border-color:color-mix(in srgb,var(--color-accent) 30%,transparent)"><span class="pill-dot"></span>Ready</span>`,
    draft: `<span class="badge badge--neutral"><span class="pill-dot" style="color:var(--color-ink-400)"></span>Draft</span>`,
    published: `<span class="badge badge--good"><span class="pill-dot"></span>Published</span>`,
    rejected: `<span class="badge badge--bad"><span class="pill-dot"></span>Rejected</span>`,
    new: `<span class="badge" style="background:color-mix(in srgb,var(--color-accent) 12%,var(--color-surface));color:var(--color-accent);border-color:color-mix(in srgb,var(--color-accent) 30%,transparent)"><span class="pill-dot"></span>New</span>`,
    approved: `<span class="badge" style="background:color-mix(in srgb,var(--color-accent) 12%,var(--color-surface));color:var(--color-accent);border-color:color-mix(in srgb,var(--color-accent) 30%,transparent)"><span class="pill-dot"></span>Approved</span>`,
    replied: `<span class="badge badge--good"><span class="pill-dot"></span>Replied</span>`,
    skipped: `<span class="badge badge--neutral">Skipped</span>`
  };

  function head(name, sub, av, extra) {
    return `<div class="m-card-head"><img class="avatar-img" src="${A}${av||'mara.png'}" width="38" height="38" alt=""/>`
      + `<div class="m-card-id"><div class="m-card-name">${name}</div><div class="m-card-sub">${sub}</div></div>${extra||''}</div>`;
  }

  // Studio draft card. status: 'ready'|'draft'|'published'|'rejected'|'editing'
  function studioCard(status = 'ready', opts = {}) {
    const body = opts.body || `The trick to shipping more is lowering the stakes of starting. Open the doc, write the worst possible first line on purpose, and let momentum carry the rest.`;
    const overflow = (items) => `<div class="m-menu-anchor"><button class="m-iconbtn--foot">${ic('more',18)}</button>${items?menu(items):''}</div>`;
    let foot;
    if (status === 'ready') {
      foot = `<div class="m-foot"><div class="m-foot-meta"><span class="cc-inline">218 / 500</span><span class="meta-sep"></span><span class="voice-tag">${ic('check',13)}Ready to publish</span></div>`
        + `<div class="m-foot-row">${overflow()}<button class="btn btn--primary m-btn m-btn--grow">${ic('nib',16)}Publish to Threads</button></div></div>`;
    } else if (status === 'draft') {
      foot = `<div class="m-foot"><div class="m-foot-meta"><span class="cc-inline">218 / 500</span><span class="meta-sep"></span><span class="voice-tag">${ic('sparkle',13)}In your voice</span></div>`
        + `<div class="m-foot-row">${overflow()}<button class="btn btn--primary m-btn m-btn--grow">${ic('check',16)}Approve</button></div></div>`;
    } else if (status === 'published') {
      foot = `<div class="m-foot"><div class="m-foot-meta"><span class="m-metric-sub">${ic('heart',15)}1.2k</span><span class="m-metric-sub">${ic('bubble',15)}84</span><span class="m-metric-sub">${ic('repost',15)}37</span></div>`
        + `<div class="m-foot-row">${overflow()}<a class="btn btn--secondary m-btn m-btn--grow">${ic('external',15)}Open in Threads</a></div></div>`;
    } else if (status === 'rejected') {
      foot = `<div class="m-foot"><div class="m-foot-meta"><span>Passed on · won’t be published</span></div>`
        + `<div class="m-foot-row">${overflow()}<button class="btn btn--secondary m-btn m-btn--grow">${ic('undo',15)}Restore to drafts</button></div></div>`;
    } else if (status === 'editing') {
      foot = `<textarea class="edit-area">${body}</textarea>`
        + `<div class="charmeter"><span class="track"><span class="fill" style="width:44%"></span></span><span class="cc">218 / 500</span></div>`
        + `<div class="m-foot"><div class="m-foot-row"><button class="btn btn--ghost m-btn">Cancel</button><button class="btn btn--primary m-btn m-btn--grow">${ic('check',16)}Save</button></div></div>`;
    }
    const cls = 'm-card' + (status==='published'?' m-card--published':'') + (status==='rejected'?' m-card--rejected':'');
    return `<article class="${cls}">${head('Mara Lin', `<span>@mara.lin</span><span class="sep">·</span><span>2h ago</span>`, 'mara.png', badge[status==='editing'?'draft':status])}`
      + (status==='editing' ? '' : `<p class="m-card-body">${body}</p>`) + foot + `</article>`;
  }

  function menu(items) {
    // items: array of {icon,label,danger,caret}
    return `<div class="m-menu" role="menu">` + items.map(it =>
      `<button class="m-menu-item${it.danger?' m-menu-item--danger':''}" role="menuitem">${ic(it.icon,15)}<span class="mi-label">${it.label}</span>${it.caret?ic('chev-right',13):''}</button>`
    ).join('') + `</div>`;
  }

  // Feed post card. opts: { reply, autoReplies, expanded, over }
  function feedCard(opts = {}) {
    const o = opts;
    const v = o.over
      ? `<span class="vbadge vbadge--over">${ic('arrow-up',12)}2.4× average</span>`
      : `<span class="vbadge">On par</span>`;
    const replyCtx = o.reply ? `<div class="reply-ctx"><div class="rc-bar"></div><div class="rc-body"><div class="rc-who">@devon.makes</div><div class="rc-txt">How do you keep a posting streak without burning out?</div></div></div>` : '';
    const body = o.reply
      ? `Lower the bar on purpose. A streak survives on small, honest posts — not on waiting for the perfect one.`
      : `Most "post every day" advice quietly optimizes for burnout. Consistency is a floor, not a quota. Three real posts beat seven forced ones.`;
    const sub = o.reply
      ? `<span>@mara.lin</span><span class="sep">·</span><span style="display:inline-flex;align-items:center;gap:4px">${ic('reply',12)}replied to @devon.makes</span><span class="sep">·</span><span>5h ago</span>`
      : `<span>@mara.lin</span><span class="sep">·</span><span>5h ago</span>`;
    const metrics = `<div class="m-metrics"><div class="m-metric-hero">${ic('eye',18)}<span class="m-num">38.2k</span><span class="m-lbl">views</span></div>`
      + `<div class="m-metric-subs"><span class="m-metric-sub">${ic('heart',15)}1.9k</span><span class="m-metric-sub">${ic('bubble',15)}214</span><span class="m-metric-sub">${ic('repost',15)}96</span></div></div>`;
    const trend = o.expanded ? `<div class="m-trend"><div class="m-trend-cap"><span class="tc-t">Views over 7 days</span><span class="tc-s">peaked day 2</span></div>`
      + `<svg viewBox="0 0 600 112" role="img" aria-label="Views over time vs your average"><path d="M8 84 L107 70 L206 40 L305 30 L404 24 L503 20 L592 16 L592 92 L8 92 Z" fill="var(--color-accent)" fill-opacity="0.10"/>`
      + `<line x1="8" y1="58" x2="592" y2="58" stroke="var(--color-text-subtle)" stroke-width="1" stroke-dasharray="4 4" opacity="0.75"/>`
      + `<text x="592" y="52" text-anchor="end" font-size="11" fill="var(--color-text-subtle)" style="font-family:var(--font-sans)">your average</text>`
      + `<path d="M8 84 L107 70 L206 40 L305 30 L404 24 L503 20 L592 16" fill="none" stroke="var(--color-accent)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`
      + `<circle cx="592" cy="16" r="3.6" fill="var(--color-accent)" stroke="var(--color-surface)" stroke-width="2"/></svg>`
      + `<div class="m-trend-axis"><span>Posted</span><span>Now</span></div></div>` : '';
    const arOn = o.autoReplies !== false;
    const pill = `<button class="ar-pill ${arOn?'ar-pill--on':''}">${arOn?ic('reply',14):'<span class="ar-dot"></span>'}Auto-replies ${arOn?'on':'off'}</button>`;
    const growthCaret = o.expanded ? ' style="transform:rotate(180deg)"' : '';
    const foot = `<div class="m-foot"><div class="m-foot-meta">${pill}</div>`
      + `<div class="m-foot-row"><button class="m-iconbtn--foot" aria-label="Growth">${ic('chart',18)}</button>`
      + `<a class="btn btn--primary m-btn m-btn--grow">${ic('external',15)}Open on Threads</a>`
      + `<div class="m-menu-anchor"><button class="m-iconbtn--foot">${ic('more',18)}</button></div></div></div>`;
    return `<article class="m-card">${head('Mara Lin', sub, 'mara.png', v)}${replyCtx}<p class="m-card-body">${body}</p>${metrics}${trend}${foot}</article>`;
  }

  // Replies comment card. status: 'new'|'draft'|'approved'|'replied'|'skipped'|'editing'|'generating'
  function commentCard(status = 'new', opts = {}) {
    const author = opts.author || { name: 'Devon Park', handle: '@devon.makes', av: 'c-devon.png' };
    const commentText = opts.text || `This is so timely. How do you keep a posting streak going without burning out on it?`;
    const replyText = `Lower the bar on purpose. A streak survives on small, honest posts, not on waiting for the perfect one. Some weeks "showing up" is the whole win.`;
    const remove = (status==='new'||status==='draft'||status==='approved') ? `<button class="m-card-remove" aria-label="Remove from queue">${ic('x',15)}</button>` : '';
    const cmtHead = `<div class="m-card-head"><img class="avatar-img" src="${A}${author.av}" width="38" height="38" alt=""/>`
      + `<div class="m-card-id"><div class="m-card-name">${author.name}</div><div class="m-card-sub"><span>${author.handle}</span><span class="sep">·</span><span>3h ago</span></div></div>${badge[status==='editing'?'draft':status]}${remove}</div>`;

    let thread = '';
    if (status === 'generating') {
      thread = `<div class="reply-thread"><div class="reply-block"><div class="skel-line" style="width:88%"></div><div class="skel-line" style="width:60%;margin-top:8px"></div>`
        + `<span class="reply-gen-note"><span class="nib">${ic('nib',13)}</span>Drafting a reply in your voice…</span></div></div>`;
    } else if (status==='draft'||status==='approved'||status==='replied'||status==='editing') {
      const tag = status==='draft' ? `<span class="ra-tag">${ic('nib',12)}drafted in your voice</span>`
        : status==='approved' ? `<span class="ra-tag" style="color:var(--color-accent)">${ic('check',12)}approved · ready to publish</span>`
        : status==='replied' ? `<span class="ra-tag is-good">${ic('check',12)}replied 2h ago</span>` : '';
      const inner = status==='editing'
        ? `<textarea class="reply-edit">${replyText}</textarea><div class="charmeter" style="margin-top:8px"><span class="track"><span class="fill" style="width:38%"></span></span><span class="cc">189 / 500</span></div>`
        : `<div class="reply-text">${replyText}</div>`;
      thread = `<div class="reply-thread"><div class="reply-block ${status==='replied'?'reply-block--replied':''}">`
        + `<div class="reply-author"><img class="avatar-img" src="${A}mara.png" width="24" height="24" alt=""/><span class="ra-name">You</span>${tag}</div>${inner}</div></div>`;
    }

    let foot = '';
    const overflow = '';
    if (status !== 'generating') {
      let meta = '';
      if (status==='replied') meta = `<span class="m-metric-sub">${ic('check',13)}Published 2h ago</span>`;
      else if (status==='skipped') meta = `<span>Removed from queue · won’t be answered</span>`;
      let row = '';
      if (status==='new') row = `<button class="btn btn--primary m-btn m-btn--grow">${ic('nib',15)}Generate reply</button>`;
      else if (status==='draft') row = `<button class="m-iconbtn--foot" aria-label="Regenerate">${ic('tweak',18)}</button><button class="m-iconbtn--foot" aria-label="Edit">${ic('pencil',18)}</button><button class="btn btn--primary m-btn m-btn--grow">${ic('check',15)}Approve</button>`;
      else if (status==='approved') row = `<button class="m-iconbtn--foot" aria-label="Edit">${ic('pencil',18)}</button><button class="btn btn--primary m-btn m-btn--grow">${ic('reply',15)}Publish reply</button>`;
      else if (status==='replied') row = `<a class="btn btn--secondary m-btn m-btn--grow">${ic('external',15)}Open in Threads</a>`;
      else if (status==='skipped') row = `<button class="btn btn--ghost m-btn m-btn--grow">${ic('undo',15)}Restore</button>`;
      else if (status==='editing') row = `<button class="btn btn--ghost m-btn">Cancel</button><button class="btn btn--primary m-btn m-btn--grow">${ic('check',15)}Save</button>`;
      foot = `<div class="m-foot">${meta?`<div class="m-foot-meta">${meta}</div>`:''}<div class="m-foot-row">${row}</div></div>`;
    }
    const cls = 'm-card' + (status==='skipped'?' m-card--skipped':'');
    const trrow = `<div class="translate-row"><button class="translate-btn">${ic('globe',13)}Translate from Spanish</button></div>`;
    return `<article class="${cls}">${cmtHead}<p class="m-card-body">${commentText}</p>${opts.lang?trrow:''}${thread}${foot}</article>`;
  }

  /* ------------------------------- sheets --------------------------------- */
  function moreSheet() {
    const row = (icon,label,extra) => `<a class="m-navrow">${ic('','')}<svg class="m-navrow-ic"><use href="#i-${icon}"/></svg><span class="m-navrow-lbl">${label}</span>${extra||''}</a>`;
    const chev = `<svg class="m-navrow-chev" style="width:16px;height:16px"><use href="#i-chev-right"/></svg>`;
    return `<div class="m-scrim"></div><div class="m-sheet"><div class="m-sheet-grip"></div><div class="m-sheet-scroll">`
      + `<div class="m-navgroup"><div class="m-navcap">Insight</div>`
      + `<a class="m-navrow"><svg class="m-navrow-ic"><use href="#i-chart"/></svg><span class="m-navrow-lbl">Stats</span>${chev}</a>`
      + `<a class="m-navrow"><svg class="m-navrow-ic"><use href="#i-audit"/></svg><span class="m-navrow-lbl">Audits</span><span class="m-navrow-badge">1</span></a>`
      + `<a class="m-navrow"><svg class="m-navrow-ic"><use href="#i-layers"/></svg><span class="m-navrow-lbl">Pattern study</span></a>`
      + `<a class="m-navrow"><svg class="m-navrow-ic"><use href="#i-compass"/></svg><span class="m-navrow-lbl">Explore patterns</span></a></div>`
      + `<div class="m-navgroup"><div class="m-navcap">Voice &amp; automation</div>`
      + `<a class="m-navrow"><svg class="m-navrow-ic"><use href="#i-voice"/></svg><span class="m-navrow-lbl">Voice</span></a>`
      + `<a class="m-navrow"><svg class="m-navrow-ic"><use href="#i-sliders"/></svg><span class="m-navrow-lbl">Style rules</span></a>`
      + `<a class="m-navrow"><svg class="m-navrow-ic"><use href="#i-autopilot"/></svg><span class="m-navrow-lbl">Autopilot</span></a></div>`
      + `<div class="m-sheet-sep"></div>`
      + `<div class="m-appearance"><svg class="m-navrow-ic" style="width:20px;height:20px"><use href="#i-moon"/></svg><div class="who"><div style="font-weight:500">Dark mode</div></div><label class="switch"><input type="checkbox"/><span class="track"></span><span class="knob"></span></label></div>`
      + `<a class="m-navrow"><svg class="m-navrow-ic"><use href="#i-settings"/></svg><span class="m-navrow-lbl">Settings</span></a>`
      + `<button class="m-navrow m-navrow--danger"><svg class="m-navrow-ic"><use href="#i-logout"/></svg><span class="m-navrow-lbl">Log out</span></button>`
      + `</div></div>`;
  }

  function accountSheet() {
    const acct = (name,handle,av,active) => `<button class="m-acct-row"><img class="avatar-img" src="${A}${av}" width="40" height="40" alt=""/><div class="who"><div class="nm">${name}</div><div class="hd">${handle}</div></div>${active?`<svg class="acct-check" style="width:18px;height:18px"><use href="#i-check"/></svg>`:''}</button>`;
    return `<div class="m-scrim"></div><div class="m-sheet"><div class="m-sheet-grip"></div>`
      + `<div class="m-sheet-head"><div class="m-sheet-title">Accounts</div><button class="m-sheet-close">${ic('x',16)}</button></div><div class="m-sheet-scroll">`
      + `<div class="m-navcap" style="padding-top:0">Switch account</div>`
      + acct('Mara Lin','@mara.lin','mara.png',true) + acct('Field Notes','@field.notes','fieldnotes.png',false) + acct('Studio Mara','@studio.mara','studio.png',false)
      + `<a class="m-navrow"><svg class="m-navrow-ic"><use href="#i-plus"/></svg><span class="m-navrow-lbl">Connect another account</span></a>`
      + `<div class="m-sheet-sep"></div>`
      + `<div style="padding:8px 8px 4px"><div style="font-size:var(--text-small);font-weight:600">mara@pennedly.com</div><div style="font-size:var(--text-caption);color:var(--color-text-subtle);display:flex;align-items:center;gap:6px;margin-top:2px"><span style="width:6px;height:6px;border-radius:9999px;background:var(--color-accent)"></span>Creator plan</div></div>`
      + `<a class="m-navrow"><svg class="m-navrow-ic"><use href="#i-settings"/></svg><span class="m-navrow-lbl">Settings</span></a>`
      + `<button class="m-navrow m-navrow--danger"><svg class="m-navrow-ic"><use href="#i-logout"/></svg><span class="m-navrow-lbl">Log out</span></button>`
      + `</div></div>`;
  }

  function dialogSheet() {
    return `<div class="m-scrim"></div><div class="m-sheet m-dialogsheet"><div class="m-sheet-grip"></div>`
      + `<div class="dialog-head"><div class="dialog-mark">${ic('nib',18)}</div><div><div class="dialog-title">Publish to Threads?</div>`
      + `<div class="dialog-sub">This posts immediately and publicly. You can still delete it from Threads afterwards.</div></div></div>`
      + `<div class="pub-account"><img class="avatar-img" src="${A}mara.png" width="30" height="30" alt=""/><div class="pa-t"><b>Mara Lin</b> <span>@mara.lin</span></div></div>`
      + `<div class="pub-preview">The trick to shipping more is lowering the stakes of starting. Open the doc, write the worst possible first line on purpose, and let momentum carry the rest.</div>`
      + `<div class="m-dialog-actions"><button class="btn btn--primary">${ic('check',16)}Publish now</button><button class="btn btn--ghost">Cancel</button></div></div>`;
  }

  function toast(kind = 'success') {
    return `<div class="m-toast-host"><div class="m-toast m-toast--${kind}"><span class="toast-mark"></span>`
      + `<div class="toast-body"><div class="toast-title">${kind==='success'?'Approved':'Couldn’t publish'}</div>`
      + `<div class="toast-sub">${kind==='success'?'Moved to Ready to publish':'Check your connection and try again'}</div></div>`
      + `<button class="toast-undo">${kind==='success'?'Undo':'Retry'}</button></div></div>`;
  }

  function firstRun() {
    const step = (n,t,d) => `<div class="fr-step"><div class="fr-num">${n}</div><div><div class="fs-t">${t}</div><div class="fs-d">${d}</div></div></div>`;
    return `<div class="m-firstrun"><img class="fr-mark" src="${A}mara.png" width="44" height="44" alt=""/>`
      + `<div class="fr-eyebrow">Welcome to Pennedly</div><h2>First, let’s capture your voice.</h2>`
      + `<p>Pennedly drafts in your voice, so it learns how you actually write before it suggests a thing.</p>`
      + `<div class="fr-steps">${step(1,'Share a few posts','Paste 3–5 posts that sound like you.')}${step(2,'We study the patterns','Tone, rhythm, the words you reach for.')}${step(3,'Start drafting','Brief a topic and review every draft.')}</div>`
      + `<button class="btn btn--primary">${ic('voice',16)}Set up your voice</button></div>`;
  }

  function empty(kind = 'ready') {
    const map = {
      ready: ['Nothing ready to publish', 'Approved drafts will collect here, ready for one tap.'],
      draft: ['No drafts waiting', 'Brief a topic above and Pennedly will draft in your voice.'],
      feed: ['No posts yet', 'Once you publish, performance lands here against your average.'],
      replies: ['You’re all caught up', 'New comments worth answering will appear here.']
    };
    const m = map[kind] || map.ready;
    const cta = kind==='draft' ? `<button class="btn btn--secondary">${ic('nib',15)}Write something</button>` : '';
    return `<div class="m-empty"><div class="m-empty-mark">${ic('nib',24)}</div><div class="m-empty-title">${m[0]}</div><div class="m-empty-sub">${m[1]}</div>${cta}</div>`;
  }

  function errorBanner(title, sub) {
    return `<div class="m-error"><div class="eb-mark">${ic('x',18)}</div><div><div class="eb-title">${title||'Couldn’t load your drafts'}</div>`
      + `<div class="eb-sub">${sub||'Something went wrong on our end.'}</div><button class="btn btn--secondary btn--sm" style="min-height:40px">${ic('undo',15)}Retry</button></div></div>`;
  }

  function skeletonCard() {
    return `<article class="m-card skeleton"><div class="m-card-head"><div class="skel-line" style="width:38px;height:38px;border-radius:9999px;flex:0 0 auto"></div>`
      + `<div style="flex:1"><div class="skel-line" style="width:40%"></div><div class="skel-line" style="width:26%;margin-top:7px"></div></div></div>`
      + `<div class="skel-line" style="width:96%;margin-top:14px"></div><div class="skel-line" style="width:100%;margin-top:9px"></div><div class="skel-line" style="width:62%;margin-top:9px"></div></article>`;
  }

  window.MOCK = {
    ic, statusbar, top, tabs, phone, comp, col, light, dark,
    composer, filterbar, studioCard, feedCard, commentCard, menu,
    moreSheet, accountSheet, dialogSheet, toast, firstRun, empty, errorBanner, skeletonCard
  };
})();
