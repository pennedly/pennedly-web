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
  // opts: { title, brand, pill ('success'|'warning'), action, back,
  //         menu (true → hamburger far-left; account moves into the drawer, no avatar) }
  function top(opts = {}) {
    const o = opts;
    let left;
    if (o.brand) {
      left = `<div class="m-top-brand"><img class="m-brand-mark" src="${A}mara.png" width="30" height="30" alt=""/><span class="m-brand-name">Pennedly</span></div>`;
    } else {
      const burger = o.menu ? `<button class="m-iconbtn m-iconbtn--plain m-hamburger" aria-label="Open menu">${ic('menu',22)}</button>` : '';
      left = burger
        + (o.back ? `<button class="m-iconbtn m-iconbtn--plain">${ic('arrow-left',20)}</button>` : '')
        + `<div class="m-top-title">${o.title || 'Studio'}</div>`;
    }
    let pill = '';
    if (o.pill === 'success' || o.pill === 'warning' || o.pill === 'accent') {
      const cls = o.pill === 'success' ? 'status-pill--success' : o.pill === 'warning' ? 'status-pill--warning' : 'status-pill--accent';
      const lead = o.pillIcon ? ic(o.pillIcon, 12) : '<i class="pill-dot"></i>';
      const text = o.pillText || (o.pill === 'success' ? 'Voice active' : o.pill === 'warning' ? 'Voice not set up' : '');
      pill = `<span class="status-pill ${cls}">${lead}${text}</span>`;
    }
    const action = o.action ? `<button class="m-iconbtn">${ic(o.action,18)}</button>` : '';
    const themeBtn = `<button class="m-iconbtn">${ic('moon',18)}</button>`;
    // In the new shell the account lives in the drawer, so the top bar carries
    // only the theme toggle. Legacy callers (no `menu`) keep the avatar button.
    const avatar = o.menu ? '' : `<button class="m-avatar-btn"><img class="avatar-img" src="${A}mara.png" width="32" height="32" alt=""/></button>`;
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

  /* ------------------------- left nav drawer ------------------------------ */
  // The bottom tab bar was dropped app-wide; nav + account now live behind the
  // hamburger in a left slide-in drawer. active = current screen id.
  // opts.testers=false hides the tester-gated rows (Replies / Mentions / Autopilot).
  function drawer(active = 'studio', opts = {}) {
    const testers = opts.testers !== false;
    const NAV = [
      ['Workspace', [
        ['studio','nib','Studio',4,false],
        ['feed','feed','My Feed',0,false],
        ['replies','bubble','Replies',3,true],
        ['mentions','at','Mentions',0,true],
      ]],
      ['Insight', [
        ['stats','chart','Stats',0,false],
        ['advisor','advisor','Advisor',0,true],
        ['audits','audit','Audits',1,false],
        ['patterns','layers','Pattern study',0,false],
        ['explore','compass','Explore patterns',0,false],
      ]],
      ['Voice \u0026 automation', [
        ['voice','voice','Voice',0,false],
        ['stylerules','sliders','Style rules',0,false],
        ['scenarios','repeat','Scenarios',0,true],
        ['autopilot','autopilot','Autopilot',0,true],
      ]],
    ];
    const row = (id, icon, label, badge, tester) => {
      if (tester && !testers) return '';
      const act = id === active ? ' m-navrow--active' : '';
      const cur = id === active ? ' aria-current="page"' : '';
      const b = badge ? `<span class="m-navrow-badge">${badge}</span>` : '';
      return `<a class="m-navrow${act}"${cur}><svg class="m-navrow-ic"><use href="#i-${icon}"/></svg><span class="m-navrow-lbl">${label}</span>${b}</a>`;
    };
    const groups = NAV.map(([cap, items]) =>
      `<div class="m-navgroup"><div class="m-navcap">${cap}</div>` + items.map((it) => row(...it)).join('') + `</div>`
    ).join('');
    return `<div class="m-scrim"></div><aside class="m-drawer" role="dialog" aria-label="Navigation">`
      + `<div class="m-drawer-head"><div class="m-drawer-brand">`
      + `<img class="m-brand-mark" src="${A}mara.png" width="30" height="30" alt=""/>`
      + `<div class="db-id"><div class="bn">Pennedly</div><div class="bs">Drafting partner</div></div></div>`
      + `<button class="m-drawer-close" aria-label="Close menu">${ic('x',16)}</button></div>`
      + `<div class="m-drawer-scroll">${groups}</div>`
      + `<div class="m-drawer-foot"><button class="m-acct-control">`
      + `<img class="avatar-img" src="${A}mara.png" width="36" height="36" alt=""/>`
      + `<div class="who"><div class="nm">Mara Lin</div><div class="hd">@mara.lin</div></div>`
      + `<span class="chev">${ic('chev-down',16)}</span></button></div>`
      + `</aside>`;
  }

  /* -------------------------------- phone --------------------------------- */
  // opts: { dark, variant ('sm'|'short'|'tall'|'auto'), top, body, tabs (html|false), overlay, flush }
  function phone(opts = {}) {
    const o = opts;
    const cls = ['device', o.variant ? 'device--' + o.variant : ''].join(' ').trim();
    const island = o.variant === 'auto' ? '' : '<div class="device-island"></div>';
    const noTab = o.tabs === false;
    const tabbar = noTab ? '' : (o.tabs || tabs('studio'));
    const contentCls = 'm-content' + (o.flush ? ' m-content--flush' : '') + (noTab ? ' m-content--notab' : '');
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

  // «Строка» — the accepted canonical composer (bar + shelf / ideas palette),
  // phone build. Kept SEPARATE from the legacy composer() above so other exports
  // that still call composer() (e.g. the Design System page) render unchanged.
  // state: 'collapsed'|'default'|'filled'|'seeded'|'busy'
  //        |'ideas-loading'|'ideas-results'|'ideas-empty'|'ideas-error'
  // opts: { de:true → German strings (chips + seeded) for the localization proof }
  function stroka(state = 'default', opts = {}) {
    const de = opts.de;
    const AV = `<img class="avatar-img" src="${A}mara.png" width="38" height="38" alt=""/>`;

    if (state === 'busy') {
      return `<div class="m-composer m-composer--busy"><div class="m-drafting"><span class="nib">${ic('nib',24)}</span>`
        + `<span class="m-drafting-text">Drafting <b>3</b> posts in your voice<span class="dots"><i></i><i></i><i></i></span></span></div></div>`;
    }

    const T = de ? {
      ph: 'Worüber möchtest du schreiben? Ein Thema, eine steile These, ein Link…',
      ideas: 'Ideen',
      chips: ['Eine Lektion aus dieser Woche','Auf einen Trend reagieren','Auf aktuelle Erwähnungen antworten','Eine unpopuläre Meinung'],
      drafts: 'Entwürfe', gen: 'Generieren', seeded: 'Aus einer Idee übernommen', cap: 'Ideen in deiner Stimme'
    } : {
      ph: 'What do you want to write about? A topic, a hot take, a link…',
      ideas: 'Ideas',
      chips: ['A lesson from this week','React to a trend','Reply to recent mentions','An unpopular opinion'],
      drafts: 'Drafts', gen: 'Generate', seeded: 'Seeded from an idea', cap: 'Ideas in your voice'
    };

    const isIdeas = state.indexOf('ideas-') === 0;
    const sub = isIdeas ? state.slice(6) : '';
    const seeded = state === 'seeded';
    const filled = seeded || state === 'filled' || de;
    const val = seeded
      ? (de ? 'Der beste Beitrag dieses Jahres brach jede Regel, die man mir beigebracht hatte.' : 'The best post I wrote this year broke every rule I’d been taught.')
      : (filled ? (de ? 'Warum „poste täglich“ die meisten Creator leise ausbrennt' : 'Why most “post daily” advice quietly burns creators out') : '');

    const bar = `<div class="m-composer-bar">${AV}`
      + `<textarea class="m-composer-input" placeholder="${T.ph}">${val}</textarea>`
      + `<button class="m-composer-spark${isIdeas ? ' is-on' : ''}" aria-label="Ideas in your voice">${ic('sparkle',18)}</button></div>`;

    // collapsed — just the bar (resting «Строка»)
    if (state === 'collapsed') return `<div class="m-composer">${bar}</div>`;

    // ideas palette
    if (isIdeas) {
      const head = `<div class="ideas-head"><span class="ideas-cap">${ic('sparkle',12)}${T.cap}</span>`
        + `<div class="ideas-head-acts">`
        + (sub === 'results' ? `<button class="ideas-iconbtn" aria-label="More ideas">${ic('tweak',16)}</button>` : '')
        + `<button class="ideas-iconbtn" aria-label="Close ideas">${ic('x',16)}</button></div></div>`;
      let body;
      if (sub === 'loading') {
        body = `<div class="ideas-loading"><span class="spark">${ic('sparkle',17)}</span><span class="ideas-loading-text">Brainstorming ideas in your voice…</span></div>`
          + `<div class="ideas-skel-list"><div class="ideas-skel-card"></div><div class="ideas-skel-card"></div><div class="ideas-skel-card"></div></div>`;
      } else if (sub === 'empty') {
        body = `<div class="ideas-empty"><div class="ideas-empty-t">No fresh ideas this time</div>`
          + `<div class="ideas-empty-s">Pennedly didn’t find a new angle worth pitching just now. Try again, or start from a quick-start chip.</div>`
          + `<div class="ideas-empty-acts"><button class="ideas-retry">${ic('tweak',15)}Try again</button><button class="ideas-ghostbtn">Close</button></div></div>`;
      } else if (sub === 'error') {
        body = `<div class="ideas-error"><span class="ie-ico">${ic('alert',17)}</span>`
          + `<span class="ideas-error-text">Couldn’t reach the idea service. Your brief is safe.</span>`
          + `<button class="ideas-retry">${ic('undo',15)}Try again</button></div>`;
      } else {
        const L = [
          ['The best post I wrote this year took four minutes and broke every rule I’d been taught.','A short story about overthinking — momentum beats polish.'],
          ['Finding your voice mostly means deleting the sentences that sound like everyone else.','Craft note: subtraction is the real edit.'],
          ['I almost didn’t post the thing that did the best. Here’s exactly what stopped me.','Vulnerability — the embarrassing draft wins.'],
          ['Writing every day didn’t make me a better writer. Publishing every day did.','Contrarian take on practice vs. shipping.']
        ];
        body = `<div class="ideas-list">` + L.map(function (d) {
          return `<button class="idea-card"><span class="idea-text"><span class="idea-hook">${d[0]}</span><span class="idea-angle">${d[1]}</span></span><span class="idea-use">${ic('arrow-up',14)}Use</span></button>`;
        }).join('') + `</div>`;
      }
      return `<div class="m-composer is-open">${bar}<div class="m-composer-shelf m-composer-shelf--ideas">${head}${body}</div></div>`;
    }

    // default shelf (chips + tools)
    const chip = function (t, cls) { return `<button class="chip${cls ? ' ' + cls : ''}">${ic('sparkle',13)}${t}</button>`; };
    const chips = `<div class="m-chiprow">${chip(T.ideas, 'chip--ideas')}${T.chips.map(function (c) { return chip(c); }).join('')}</div>`;
    const seg = `<div class="count-seg">` + [1,2,3,4].map(function (n) { return `<b${n === 3 ? ' class="on"' : ''}>${n}</b>`; }).join('') + `</div>`;
    const seededNote = seeded ? `<span class="ideas-seeded-note">${ic('sparkle',13)}${T.seeded}</span>` : '';
    const tools = `<div class="m-shelf-tools"><span class="m-shelf-lbl">${T.drafts}</span>${seg}${seededNote}`
      + `<button class="btn btn--primary m-gen"${filled ? '' : ' disabled'}>${ic('nib',16)}${T.gen}</button></div>`;
    return `<div class="m-composer is-open">${bar}<div class="m-composer-shelf">${chips}${tools}</div></div>`;
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
  // opts: { body, reply (read-only reply draft), lang ({native,text} → translated),
  //         tweaking (revise bar + suggestions), revising (skeleton), revised (note),
  //         menu (render the ⋯ overflow OPEN to show collapsed actions) }
  function studioCard(status = 'ready', opts = {}) {
    const o = opts;
    const baseBody = o.body || `The trick to shipping more is lowering the stakes of starting. Open the doc, write the worst possible first line on purpose, and let momentum carry the rest.`;
    const body = o.lang ? o.lang.text : baseBody;

    // collapsed secondary actions per status — the ⋯ overflow contents.
    const MENU = {
      draft: [{icon:'x',label:'Reject draft',danger:true},{icon:'tweak',label:'Tweak in your voice'},{icon:'pencil',label:'Edit'},{icon:'globe',label:'Translate',caret:true}],
      ready: [{icon:'undo',label:'Send back to drafts'},{icon:'pencil',label:'Edit'},{icon:'globe',label:'Translate',caret:true}],
      published: [{icon:'globe',label:'Translate',caret:true}],
      rejected: [{icon:'undo',label:'Restore to drafts'},{icon:'globe',label:'Translate',caret:true}],
    };
    const overflow = () => `<div class="m-menu-anchor"><button class="m-iconbtn--foot" aria-label="More actions">${ic('more',18)}</button>`
      + (o.menu && MENU[status] ? menu(MENU[status], 'left') : '') + `</div>`;

    // read-only reply draft — answered in Replies, never published from Studio.
    if (o.reply) {
      const rsub = `<span>@mara.lin</span><span class="sep">·</span><span style="display:inline-flex;align-items:center;gap:4px">${ic('reply',12)}replying to @devon</span><span class="sep">·</span><span>2h ago</span>`;
      const rctx = `<div class="reply-ctx"><div class="rc-bar"></div><div class="rc-body"><div class="rc-who">@devon</div><div class="rc-txt">honestly how do you even start writing when your brain is completely blank</div></div></div>`;
      const rbody = `Start before you feel ready. I open a doc and write the worst possible first line on purpose — it kills the pressure, and the real sentence usually shows up by line three.`;
      const rfoot = `<div class="m-foot"><div class="m-readonly-note">${ic('reply',14)}<span>Reply draft · managed in Replies</span><a class="ro-link">Open in Replies${ic('chev-right',12)}</a></div></div>`;
      return `<article class="m-card">${head('Mara Lin', rsub, 'mara.png', badge.draft)}${rctx}<p class="m-card-body">${rbody}</p>${rfoot}</article>`;
    }

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
      foot = `<textarea class="edit-area">${baseBody}</textarea>`
        + `<div class="charmeter"><span class="track"><span class="fill" style="width:44%"></span></span><span class="cc">218 / 500</span></div>`
        + `<div class="m-foot"><div class="m-foot-row"><button class="btn btn--ghost m-btn">Cancel</button><button class="btn btn--primary m-btn m-btn--grow">${ic('check',16)}Save</button></div></div>`;
    }

    // revising → drafting skeleton replaces the body, foot suppressed (matches desktop).
    if (o.revising) {
      const skel = `<div class="m-revising"><div class="skel-line" style="width:92%"></div><div class="skel-line" style="width:100%;margin-top:9px"></div><div class="skel-line" style="width:48%;margin-top:9px"></div>`
        + `<span class="revised-note">${ic('tweak',13)}Revising in your voice…</span></div>`;
      return `<article class="m-card">${head('Mara Lin', `<span>@mara.lin</span><span class="sep">·</span><span>2h ago</span>`, 'mara.png', badge.draft)}${skel}</article>`;
    }

    const trBar = o.lang ? `<div class="translate-bar">${ic('globe',13)}<span>Translated to ${o.lang.native}</span><span class="tb-dot">·</span><button class="tb-orig">Show original</button></div>` : '';
    const revisedNote = (o.revised && status !== 'editing') ? `<span class="revised-note">${ic('sparkle',13)}Revised just now</span>` : '';
    const tweakUI = (o.tweaking && status !== 'editing')
      ? `<div class="m-tweakbar">${ic('tweak',16)}<input placeholder="What should change? e.g. make it punchier…"/><button class="tw-send" aria-label="Send">${ic('send',15)}</button></div>`
        + `<div class="m-tweak-suggest">${['Make it punchier','Make it shorter','End on a question','Warmer tone'].map(s=>`<button class="ts">${s}</button>`).join('')}</div>`
      : '';

    const cls = 'm-card' + (status==='published'?' m-card--published':'') + (status==='rejected'?' m-card--rejected':'');
    return `<article class="${cls}">${head('Mara Lin', `<span>@mara.lin</span><span class="sep">·</span><span>2h ago</span>`, 'mara.png', badge[status==='editing'?'draft':status])}`
      + (status==='editing' ? '' : `<p class="m-card-body">${body}</p>${trBar}${revisedNote}${tweakUI}`) + foot + `</article>`;
  }

  function menu(items, align) {
    // items: array of {icon,label,danger,caret} or {sep:true}; align='left' opens
    // rightward (for a left-anchored ⋯ trigger, so it never clips off the left edge).
    const mod = align === 'left' ? ' m-menu--left' : '';
    return `<div class="m-menu${mod}" role="menu">` + items.map(it =>
      it.sep ? `<div class="m-menu-sep"></div>`
        : `<button class="m-menu-item${it.danger?' m-menu-item--danger':''}" role="menuitem">${ic(it.icon,15)}<span class="mi-label">${it.label}</span>${it.caret?ic('chev-right',13):''}</button>`
    ).join('') + `</div>`;
  }

  // Feed post card. opts: { reply, autoReplies (true|false|'paused'), over, viral, settling,
  //   lang ({native,text} → translated), menu (⋯ open w/ Delete), m (metric overrides) }
  function feedCard(opts = {}) {
    const o = opts;
    const band = o.viral || (o.settling ? 'settling' : (o.over ? 'over' : 'onpar'));
    const v = band === 'settling'
      ? `<span class="vbadge vbadge--settling">${ic('clock',12)}Still settling</span>`
      : band === 'over'
        ? `<span class="vbadge vbadge--over">${ic('arrow-up',12)}${o.ratio || '2.4'}× average</span>`
        : band === 'under'
          ? `<span class="vbadge">${o.ratio || '0.6'}× average</span>`
          : `<span class="vbadge">On par</span>`;
    const replyCtx = o.reply ? `<div class="reply-ctx"><div class="rc-bar"></div><div class="rc-body"><div class="rc-who">@devon</div><div class="rc-txt">honestly how do you even start writing when your brain is blank</div></div></div>` : '';
    const baseBody = o.body || (o.reply
      ? `Start before you feel ready. I open a doc and write the worst possible first line on purpose — it kills the pressure to be good, and the real sentence usually shows up by line three.`
      : `Wrote 1,000 words this morning before I opened email. Cut 600 of them. The 400 that survived are the only ones that were ever going to matter.`);
    const body = o.lang ? o.lang.text : baseBody;
    const sub = o.reply
      ? `<span>@mara.lin</span><span class="sep">·</span><span style="display:inline-flex;align-items:center;gap:4px">${ic('reply',12)}replied to @devon</span><span class="sep">·</span><span>May 28</span>`
      : `<span>@mara.lin</span><span class="sep">·</span><span>${o.settling ? '3h ago' : 'May 30'}</span>`;
    const m = o.m || (o.settling ? { views:'2,140', likes:'71', comments:'5', reposts:'2' } : { views:'48.2K', likes:'1.2K', comments:'84', reposts:'63' });
    const metrics = `<div class="m-metrics"><div class="m-metric-hero">${ic('eye',18)}<span class="m-num">${m.views}</span><span class="m-lbl">views</span></div>`
      + `<div class="m-metric-subs"><span class="m-metric-sub">${ic('heart',15)}${m.likes}</span><span class="m-metric-sub">${ic('bubble',15)}${m.comments}</span><span class="m-metric-sub">${ic('repost',15)}${m.reposts}</span></div></div>`;
    const trBar = o.lang ? `<div class="translate-bar">${ic('globe',13)}<span>Translated to ${o.lang.native}</span><span class="tb-dot">·</span><button class="tb-orig">Show original</button></div>` : '';
    const arState = o.autoReplies === 'paused' ? 'paused' : (o.autoReplies === false ? 'off' : 'on');
    const pill = arState === 'paused'
      ? `<button class="ar-pill ar-pill--paused" title="Account replies are off — this post is marked, but nothing goes out until you turn replies back on in House rules.">${ic('reply',14)}Replies: paused</button>`
      : `<button class="ar-pill ${arState==='on'?'ar-pill--on':''}">${arState==='on'?ic('reply',14):'<span class="ar-dot"></span>'}Auto-replies ${arState==='on'?'on':'off'}</button>`;
    const delMenu = [
      ...(o.lang ? [{icon:'undo',label:'Show original'}] : []),
      {icon:'globe',label:'Translate',caret:true},
      {icon:'external',label:'Open on Threads'},
      {sep:true},
      {icon:'trash',label:'Delete post',danger:true},
    ];
    const overflow = `<div class="m-menu-anchor"><button class="m-iconbtn--foot" aria-label="More actions">${ic('more',18)}</button>`
      + (o.menu ? menu(delMenu) : '') + `</div>`;
    const foot = `<div class="m-foot"><div class="m-foot-meta">${pill}</div>`
      + `<div class="m-foot-row"><a class="btn btn--primary m-btn m-btn--grow">${ic('external',15)}Open on Threads</a>`
      + `${overflow}</div></div>`;
    return `<article class="m-card">${head('Mara Lin', sub, 'mara.png', v)}${replyCtx}<p class="m-card-body">${body}</p>${trBar}${metrics}${foot}</article>`;
  }

  // "Show older posts" — centered under the last card; visible only when has_more. opts: { loading }
  function loadMore(opts = {}) {
    const o = opts || {};
    return `<div style="display:flex;justify-content:center;margin-top:20px"><button class="btn btn--secondary m-loadmore"${o.loading?' disabled':''}>${o.loading?'<span class="m-lg-spin"></span>':''}Show older posts</button></div>`;
  }

  /* ---------------------- Feed: baseline + sort bar ---------------------- */
  // "Your base" — the account's 30-day average; the yardstick for every card.
  function feedBaseline(opts = {}) {
    const o = opts;
    const empty = o.empty;
    const stat = (num, lbl, icon) => `<div class="bstat"><div class="bstat-num">${num}</div><div class="bstat-lbl">${ic(icon,12)}${lbl}</div></div>`;
    const trend = empty ? '' : `<div class="bl-trend"><svg width="92" height="28" viewBox="0 0 92 28" style="display:block;overflow:visible" aria-hidden="true">`
      + `<path d="M0 22 L10 20 L20 21 L31 15 L41 17 L51 11 L61 13 L71 8 L82 6 L92 4" fill="none" stroke="var(--color-accent)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`
      + `<circle cx="92" cy="4" r="2.6" fill="var(--color-accent)" stroke="var(--color-surface)" stroke-width="1.5"/></svg>`
      + `<span class="bl-delta">${ic('arrow-up',13)}12%</span></div>`;
    const sub = empty ? 'No published posts in the last 30 days' : 'Average across your last 18 posts · 30 days';
    const g = empty
      ? stat('0','avg views','eye') + stat('0','avg likes','heart') + stat('0','avg comments','bubble') + stat('0','avg reposts','repost')
      : stat('14.8K','avg views','eye') + stat('286','avg likes','heart') + stat('21','avg comments','bubble') + stat('12','avg reposts','repost');
    return `<section class="m-baseline"><div class="m-baseline-head"><div class="bl-title"><span class="bl-mark">${ic('chart',16)}</span>`
      + `<div class="bl-id"><div class="bl-t">Your baseline</div><div class="bl-s">${sub}</div></div></div>${trend}</div>`
      + `<div class="m-baseline-grid">${g}</div></section>`;
  }

  // Sort bar: count + Recent / Top segmented toggle.
  function sortBar(active = 'recent', count = 6) {
    const seg = (key, label) => `<button class="m-seg-btn${active===key?' m-seg-btn--active':''}">${label}</button>`;
    return `<div class="m-feedbar"><div class="fb-count"><b>${count}</b> published posts</div>`
      + `<div class="m-seg" role="tablist">${seg('recent','Recent')}${seg('top','Top')}</div></div>`;
  }

  // Confirm-delete as a bottom sheet (the desktop modal → phone sheet).
  function deleteSheet() {
    return `<div class="m-scrim"></div><div class="m-sheet m-dialogsheet"><div class="m-sheet-grip"></div>`
      + `<div class="dialog-head"><div class="dialog-mark dialog-mark--danger">${ic('trash',18)}</div><div><div class="dialog-title">Delete this post?</div>`
      + `<div class="dialog-sub">This removes it from Threads and from your feed. This can’t be undone.</div></div></div>`
      + `<div class="pub-preview">Wrote 1,000 words this morning before I opened email. Cut 600 of them. The 400 that survived are the only ones that were ever going to matter.</div>`
      + `<div class="m-dialog-actions"><button class="btn btn--danger">${ic('trash',16)}Delete post</button><button class="btn btn--ghost">Cancel</button></div></div>`;
  }

  // Replies comment card. status: 'new'|'draft'|'approved'|'replied'|'skipped'|'editing'|'generating'
  // NOTE: Threads' API gives only the commenter's @username — NO avatar, NO display
  // name. The head is @username + time only. opts: { handle, time, text, reply,
  //   lang (comment src lang → translate), translated, translatedText,
  //   replyLang, autopilot, repliedTime }
  function commentCard(status = 'new', opts = {}) {
    const o = opts;
    const handle = o.handle || '@devon_makes';
    const time = o.time || '2h ago';
    const commentText = o.text || `this hit me at exactly the right time. how do you actually decide what to cut?`;
    const replyText = o.reply || `honestly? if a line is only there to sound smart, it goes. I keep the ones that would still be true even if no one read them.`;
    const remove = (status==='new'||status==='draft'||status==='approved') ? `<button class="m-card-remove" aria-label="Remove from queue">${ic('x',15)}</button>` : '';
    const stBadge = badge[status==='editing' ? 'draft' : (status==='generating' ? 'new' : status)];
    const cmtHead = `<div class="m-cmt-head"><div class="m-cmt-id"><span class="m-cmt-handle">${handle}</span><span class="m-cmt-time">${time}</span></div>${stBadge}${remove}</div>`;

    // comment translate row (on-demand)
    let trComment = '';
    if (o.lang) {
      trComment = o.translated
        ? `<div class="translate-row"><span class="translate-note">${ic('globe',13)}Translated from ${o.lang}</span><button class="translate-btn">Show original</button></div>`
        : `<div class="translate-row"><button class="translate-btn">${ic('globe',13)}Translate from ${o.lang}</button></div>`;
    }
    const cmtBodyText = (o.lang && o.translated && o.translatedText) ? o.translatedText : commentText;

    // the drafted reply, threaded
    let thread = '';
    if (status === 'generating') {
      thread = `<div class="reply-thread"><div class="reply-block"><div class="skel-line" style="width:88%"></div><div class="skel-line" style="width:60%;margin-top:8px"></div>`
        + `<span class="reply-gen-note"><span class="nib">${ic('nib',13)}</span>Drafting a reply in your voice…</span></div></div>`;
    } else if (status==='draft'||status==='approved'||status==='replied'||status==='editing') {
      const tag = o.autopilot ? `<span class="ra-tag" style="color:var(--color-accent)">${ic('autopilot',12)}Auto-replied by Pennedly</span>`
        : status==='draft' ? `<span class="ra-tag">${ic('nib',12)}drafted in your voice</span>`
        : status==='approved' ? `<span class="ra-tag" style="color:var(--color-accent)">${ic('check',12)}approved · ready to publish</span>`
        : status==='replied' ? `<span class="ra-tag is-good">${ic('check',12)}replied ${o.repliedTime||'1h ago'}</span>` : '';
      const inner = status==='editing'
        ? `<textarea class="reply-edit">${replyText}</textarea><div class="charmeter" style="margin-top:8px"><span class="track"><span class="fill" style="width:38%"></span></span><span class="cc">189 / 500</span></div>`
        : `<div class="reply-text">${replyText}</div>` + (o.replyLang ? `<div class="translate-row translate-row--reply"><button class="translate-btn">${ic('globe',13)}Translate from ${o.replyLang}</button></div>` : '');
      thread = `<div class="reply-thread"><div class="reply-block ${status==='replied'?'reply-block--replied':''}">`
        + `<div class="reply-author"><img class="avatar-img" src="${A}mara.png" width="24" height="24" alt=""/><span class="ra-name">You</span>${tag}</div>${inner}</div></div>`;
    }

    let foot = '';
    if (status !== 'generating') {
      let meta = '';
      if (status==='replied') meta = `<span class="voice-tag">${ic('check',13)}Published ${o.repliedTime||'1h ago'}</span>`;
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
    return `<article class="${cls}">${cmtHead}<p class="m-card-body">${cmtBodyText}</p>${trComment}${thread}${foot}</article>`;
  }

  /* ------------- Replies: horizontal post switcher + context + filter ----------- */
  // The desktop master column → a sticky, horizontally scrollable row of post
  // chips. One post's comments show at a time; scroll the row to change posts.
  function postSwitcher(active = 0) {
    const posts = [
      { text:'Wrote 1,000 words this morning before I opened email. Cut 600 of them. The 400 that survived are the only ones that mattered.', time:'May 30', un:4 },
      { text:'Start before you feel ready. I open a doc and write the worst possible first line on purpose — the real sentence shows up by line three.', time:'May 28', un:3 },
      { text:'Stop optimizing your first sentence. Optimize the reason someone should still care by the third. Hooks fade; substance compounds.', time:'May 26', un:2 },
    ];
    const chip = (p, i) => `<button class="m-pswitch-chip${i===active?' m-pswitch-chip--active':''}">`
      + `<span class="ps-text">${p.text}</span>`
      + `<span class="ps-meta"><span class="ps-time">${p.time}</span>${p.un?`<span class="ps-badge">${p.un} to answer</span>`:'<span class="ps-done">All answered</span>'}</span></button>`;
    return `<div class="m-substick m-pswitch-stick"><div class="m-pswitch-cap">Posts with comments<span class="ps-hint">${ic('chev-right',12)}swipe</span></div>`
      + `<div class="m-pswitch">${posts.map(chip).join('')}</div></div>`;
  }

  // Compact selected-post context line under the switcher.
  function replyContext() {
    return `<div class="m-rqcontext"><div class="rq-cap">Replying under your post</div>`
      + `<p class="rq-text">Wrote 1,000 words this morning before I opened email. Cut 600 of them. The 400 that survived are the only ones that were ever going to matter.</p>`
      + `<div class="rq-foot"><span class="rq-time">May 30 · 9:00 AM</span><a class="rq-link">${ic('external',14)}Open in Threads</a></div></div>`;
  }

  // Status filter row (horizontal scroll; labels kept). NOT sticky (the switcher is).
  function repliesFilter(active = 'all') {
    const f = (key, label, count) => `<button class="m-filter${active===key?' m-filter--active':''}"><span class="fdot dot-${key}"></span>${label}<span class="fcount">${count}</span></button>`;
    return `<div class="m-filterbar m-filterbar--flat">`
      + f('all','All',6) + f('needs','Needs',4) + f('drafts','Drafts',2) + f('replied','Replied',1) + f('skipped','Skipped',1)
      + `</div>`;
  }

  // Publish-reply confirmation as a bottom sheet.
  function publishReplySheet() {
    return `<div class="m-scrim"></div><div class="m-sheet m-dialogsheet"><div class="m-sheet-grip"></div>`
      + `<div class="dialog-head"><div class="dialog-mark">${ic('reply',18)}</div><div><div class="dialog-title">Publish this reply?</div>`
      + `<div class="dialog-sub">It posts publicly on Threads, threaded under @theo_writes’s comment.</div></div></div>`
      + `<div class="pub-ctx"><span class="pub-ctx-bar"></span><span class="pub-ctx-txt">“the 400 that survived” 😭 ok this is calling me OUT</span></div>`
      + `<div class="pub-preview">ha — the survivors are always the ones that scared me a little. those are usually the keepers.</div>`
      + `<div class="m-dialog-actions"><button class="btn btn--primary">${ic('reply',16)}Publish reply</button><button class="btn btn--ghost">Cancel</button></div></div>`;
  }

  /* ------------------------------- Mentions ------------------------------- */
  // Read-only mention card: @username + time only (no avatar / display name),
  // the mention text with @handles highlighted, optional translate, Open in Threads.
  function mentionCard(opts = {}) {
    const o = opts;
    const handle = o.handle || '@writingroom';
    const time = o.time || '2h ago';
    const raw = (o.lang && o.translated && o.translatedText) ? o.translatedText : (o.text || `just read @mara.lin’s thread on cutting 600 words before breakfast and had to sit down for a minute.`);
    const text = raw.replace(/(@[\w.]+)/g, '<span class="at-mention">$1</span>');
    let trRow = '';
    if (o.lang) {
      trRow = o.translated
        ? `<div class="translate-row"><span class="translate-note">${ic('globe',13)}Translated from ${o.lang}</span><button class="translate-btn">Show original</button></div>`
        : `<div class="translate-row"><button class="translate-btn">${ic('globe',13)}Translate from ${o.lang}</button></div>`;
    }
    return `<article class="m-card">`
      + `<div class="m-cmt-head"><div class="m-cmt-id"><span class="m-cmt-handle">${handle}</span><span class="m-cmt-time">${time}</span></div></div>`
      + `<p class="m-card-body">${text}</p>${trRow}`
      + `<div class="m-foot"><div class="m-foot-row"><a class="btn btn--secondary m-btn m-btn--grow">${ic('external',15)}Open in Threads</a></div></div></article>`;
  }

  /* -------------------------------- Stats -------------------------------- */
  const sfmt = (n) => n>=1000000 ? (n/1000000).toFixed(2).replace(/\.?0+$/,'')+'M'
    : n>=10000 ? (n/1000).toFixed(1).replace(/\.0$/,'')+'K'
    : Math.round(n).toLocaleString('en-US');

  // up/down/flat delta chip
  function dchip(v) {
    if (v == null) return `<span class="m-delta m-delta--flat">no prior period</span>`;
    const down = v.charAt(0) === '-';
    return `<span class="m-delta m-delta--${down?'down':'up'}">${ic(down?'arrow-down':'arrow-up',12)}${v.replace(/^\+/,'')}</span>`;
  }

  // period selector: 6 fixed ranges, horizontally scrollable segmented row.
  function statsPeriods(active = '7d') {
    const P = [['today','Today'],['yesterday','Yesterday'],['7d','7 days'],['month','Month'],['3mo','3 months'],['all','All time']];
    return `<div class="m-rangeseg">` + P.map(([k,l]) => `<button class="m-range-btn${k===active?' m-range-btn--active':''}">${l}</button>`).join('') + `</div>`;
  }

  // stacked summary: hero (Views) on its own line + a 3-up row (Posts/Likes/Comments).
  function statsSummary(period = '7d') {
    const SUM = {
      '7d':    { views:'98K',    viewsAvg:'14K',   viewsD:'+26%', posts:'7',   postsD:'+17%', likes:'980',  likesD:'+36%', comments:'56',   commentsD:'+27%' },
      'month': { views:'318K',   viewsAvg:'15.1K', viewsD:'+37%', posts:'21',  postsD:'+24%', likes:'3.1K', likesD:'+25%', comments:'235',  commentsD:'+29%' },
      '3mo':   { views:'642K',   viewsAvg:'13.4K', viewsD:'+64%', posts:'48',  postsD:'+23%', likes:'5.8K', likesD:'+49%', comments:'430',  commentsD:'+48%' },
      'all':   { views:'1.64M',  viewsAvg:'9.8K',  viewsD:null,   posts:'168', postsD:null,   likes:'14.2K',likesD:null,   comments:'1,060',commentsD:null },
    };
    const s = SUM[period] || SUM['7d'];
    const cell = (num, lbl, dl) => `<div class="m-statcell"><div class="sc-num">${num}</div><div class="sc-lbl">${lbl}</div>${dchip(dl)}</div>`;
    return `<div class="m-statsum"><div class="m-stat-hero"><div class="sh-top"><span class="sh-ico">${ic('eye',15)}</span><span class="sh-lbl">Views</span></div>`
      + `<div class="sh-num">${s.views}</div><div class="sh-foot"><span class="sh-sub">${s.viewsAvg} avg / post</span>${dchip(s.viewsD)}</div></div>`
      + `<div class="m-stat-grid">${cell(s.posts,'Posts',s.postsD)}${cell(s.likes,'Likes',s.likesD)}${cell(s.comments,'Comments',s.commentsD)}</div></div>`;
  }

  // a daily, GAP-FILLED month: every day present; empty days are [label, 0, 0] stubs.
  const MONTH_DAILY = (function () {
    const vals = [14800,0,16200,15100,0,17900,19800,0,12400,15600,14200,0,18900,16700,13200,0,0,21400,17800,15900,14100,0,16800,19200,22000,0,15400,17100,18600,16200];
    const start = new Date(2026, 4, 5);
    return vals.map((v, i) => { const d = new Date(start); d.setDate(start.getDate() + i);
      return [d.toLocaleDateString('en-US', { month:'short', day:'numeric' }), v, v > 0 ? 1 : 0]; });
  })();

  // full-width bar chart: avg views per bucket on a continuous gap-filled axis.
  // Every bucket is present; empty buckets (posts:0) render as a tiny zero stub.
  // The dashed average is computed over POSTED buckets only. Bars above it tint
  // accent, at/below muted. Many buckets → fixed ~40px bars + horizontal scroll
  // (never a crushed smear); labels go sparse (~8) so dates stay readable.
  function statsBarChart(period = '7d') {
    const SETS = {
      '7d':   [['Wed',11000,1],['Thu',13500,1],['Fri',9800,1],['Sat',22000,1],['Sun',12000,1],['Mon',15500,1],['Tue',14200,1]],
      'month': MONTH_DAILY,
      '3mo':  [['Mar 16',9200,1],['Mar 23',10100,1],['Mar 30',8800,1],['Apr 6',11200,1],['Apr 13',13400,1],['Apr 20',12100,1],['Apr 27',15600,1],['May 4',14800,1],['May 11',17300,1],['May 18',16200,1],['May 25',19800,1],['Jun 1',22400,1]],
    };
    const buckets = SETS[period] || SETS['7d'];
    const posts = (b) => (b[2] === undefined ? 1 : b[2]);
    const posted = buckets.filter((b) => posts(b) > 0).map((b) => b[1]);
    const max = Math.max(...buckets.map((b) => b[1]), 1);
    const avg = posted.reduce((a,b) => a+b, 0) / (posted.length || 1);
    const avgPct = (avg/max) * 100;
    const wide = buckets.length > 8;
    const colCls = wide ? 'm-colbar-col m-colbar-col--fixed' : 'm-colbar-col';
    const lblCls = wide ? 'm-collabel m-collabel--fixed' : 'm-collabel';
    const every = wide ? Math.ceil(buckets.length / 8) : 1;
    const bars = buckets.map((b) => {
      const empty = posts(b) === 0;
      const h = empty ? 0 : Math.max(3, (b[1]/max)*100);
      const cls = empty ? 'm-colbar m-colbar--zero' : ('m-colbar ' + (b[1] >= avg ? 'm-colbar--above' : 'm-colbar--below'));
      return `<div class="${colCls}"><div class="${cls}" style="height:${h.toFixed(1)}%"></div></div>`;
    }).join('');
    const labels = buckets.map((b, i) => `<span class="${lblCls}">${i % every === 0 ? b[0] : ''}</span>`).join('');
    return `<div class="m-chart"><div class="m-chart-scroll"><div class="m-chart-inner${wide?' is-wide':''}">`
      + `<div class="m-colplot"><div class="m-colavg" style="bottom:${avgPct.toFixed(1)}%"><span class="m-colavg-lbl">avg ${sfmt(avg)}</span></div>${bars}</div>`
      + `<div class="m-collabels">${labels}</div></div></div></div>`;
  }

  // Top posts — top-5 of the window by views; each row links out to Threads.
  // Verdict "N\u00d7 your average" colour-grades: success \u2265 1.5\u00d7, plain \u2265 0.7\u00d7, muted below.
  function statsTopPosts() {
    const P = [
      ['Most of my replies come from posts that admit a mistake before giving the lesson.','Jun 1',22000,240,31,'1.6','up'],
      ['The quiet trick to openings: start mid-thought, like the reader walked in mid-conversation.','May 30',19800,210,24,'1.4','mid'],
      ['I rewrote this six times before it sounded like me. Here\u2019s the version that landed.','May 28',13500,150,12,'0.97','mid'],
      ['A short thread about saying less — cut the draft you\u2019re scared to cut.','May 27',11000,98,9,'0.79','mid'],
      ['Notes from a slow week. Not everything has to perform to be worth posting.','May 29',9800,70,6,'0.70','low'],
    ];
    return `<div class="m-toplist">` + P.map((p, i) => `<a class="m-toppost">`
      + `<span class="m-tp-rank">${i+1}</span>`
      + `<span><span class="m-tp-snippet">${p[0]}</span><span class="m-tp-foot"><span class="m-tp-meta">`
      + `<span class="m-tp-m">${p[1]}</span><span class="m-tp-m">${ic('eye',12)}${sfmt(p[2])}</span><span class="m-tp-m">${ic('heart',12)}${p[3]}</span><span class="m-tp-m">${ic('bubble',12)}${p[4]}</span></span>`
      + `<span class="m-tp-verdict m-tp-verdict--${p[6]}">${p[5]}\u00d7<small>your average</small></span></span></span></a>`).join('') + `</div>`;
  }

  // Best times to post: two stacked mini charts (by hour, by day of week), in the
  // viewer's LOCAL timezone. Best slot (prefers slots with \u2265 2 posts) tints accent.
  function btBlock(title, rows, bestLbl) {
    const max = Math.max(...rows.map((r) => r[1]), 1);
    const elig = rows.filter((r) => r[2] >= 2); const pool = elig.length ? elig : rows;
    const best = pool.reduce((a,b) => b[1] > a[1] ? b : a, pool[0]);
    const wide = rows.length > 8;
    const colCls = wide ? 'm-bt-col m-bt-col--fixed' : 'm-bt-col';
    const lblCls = wide ? 'm-bt-label m-bt-label--fixed' : 'm-bt-label';
    const bars = rows.map((r) => { const isBest = r[0] === best[0]; const h = r[2] === 0 ? 0 : Math.max(3, (r[1]/max)*100);
      return `<div class="${colCls}"><div class="m-bt-bar${isBest?' m-bt-bar--best':''}" style="height:${h.toFixed(0)}%"></div></div>`; }).join('');
    const lbls = rows.map((r) => `<span class="${lblCls}${r[0]===best[0]?' m-bt-label--best':''}">${r[0]}</span>`).join('');
    return `<div class="m-bt-block"><div class="m-bt-head"><span class="m-bt-title">${title}</span><span class="m-bt-best">${ic('clock',12)}Best \u00b7 ${bestLbl}</span></div>`
      + `<div class="m-bt-scroll"><div class="m-bt-inner${wide?' is-wide':''}"><div class="m-bt-plot">${bars}</div><div class="m-bt-labels">${lbls}</div></div></div></div>`;
  }
  function statsBestTimes() {
    const hours = [['6 AM',3200,1],['9 AM',8600,2],['12 PM',11200,3],['3 PM',7400,2],['6 PM',19800,4],['9 PM',12600,3]];
    const days  = [['Mon',12000,3],['Tue',14200,3],['Wed',11000,2],['Thu',13500,2],['Fri',9800,2],['Sat',22000,3],['Sun',12000,2]];
    return `<div class="m-besttimes">` + btBlock('By hour', hours, '6 PM') + btBlock('By day of week', days, 'Sat') + `</div>`;
  }

  // Performance spread — viral-tier distribution of the window's posts.
  function statsSpread(period = '7d') {
    const D = {
      '7d':    [['Viral','3\u00d7+ your average','viral',1,14],['Good','1.5\u20133\u00d7 average','good',2,29],['Average','0.7\u20131.5\u00d7 average','average',3,43],['Weak','below 0.7\u00d7','weak',1,14]],
      'month': [['Viral','3\u00d7+ your average','viral',2,10],['Good','1.5\u20133\u00d7 average','good',5,24],['Average','0.7\u20131.5\u00d7 average','average',9,43],['Weak','below 0.7\u00d7','weak',5,23]],
    };
    const set = D[period] || D['7d']; const maxC = Math.max(...set.map((t) => t[3]));
    return `<div class="m-distlist">` + set.map((t) => `<div class="m-distrow"><div class="m-dist-top">`
      + `<span class="m-dist-name"><span class="m-dist-dot m-tier-${t[2]}"></span>${t[0]}<span class="m-dn-sub">\u00b7 ${t[1]}</span></span>`
      + `<span class="m-dist-val">${t[3]} post${t[3]===1?'':'s'}<span class="m-dv-pct">${t[4]}%</span></span></div>`
      + `<div class="m-dist-track"><div class="m-dist-fill m-tier-${t[2]}" style="width:${(t[3]/maxC*100).toFixed(0)}%"></div></div></div>`).join('') + `</div>`;
  }

  // best posting hours, in the viewer's LOCAL timezone — a compact bar row + takeaway.
  function statsHours() {
    const hrs = [['6a',30],['9a',55],['12p',62],['3p',48],['6p',95],['9p',70]];
    const max = 100;
    const bars = hrs.map((h) => {
      const peak = h[1] >= 90;
      return `<div class="m-hourcol"><div class="m-hourbar${peak?' m-hourbar--peak':''}" style="height:${(h[1]/max*100).toFixed(0)}%"></div><span class="m-hourlbl${peak?' is-peak':''}">${h[0]}</span></div>`;
    }).join('');
    return `<div class="m-hours-head"><div class="m-hours-hl">5–7pm</div><div class="m-hours-cap">${ic('clock',13)}Your strongest posting window · your local time</div></div>`
      + `<div class="m-hours">${bars}</div>`;
  }

  // a titled stats panel card
  function statsPanel(title, cap, body, headline) {
    const hl = headline ? `<div class="m-spanel-hl">${headline}</div>` : '';
    return `<div class="m-spanel"><div class="m-spanel-head"><div><div class="m-spanel-title">${title}</div>${cap?`<div class="m-spanel-cap">${cap}</div>`:''}</div>${hl}</div>${body}</div>`;
  }

  function statsEmpty() {
    return `<div class="m-empty"><div class="m-empty-mark">${ic('chart',24)}</div><div class="m-empty-title">Not enough data yet</div>`
      + `<div class="m-empty-sub">Stats need about two weeks of activity to show meaningful trends. Keep publishing and your performance will take shape here.</div>`
      + `<div class="m-stats-emeta"><span><b>1</b> week so far</span><span><b>3</b> posts published</span></div></div>`;
  }

  // skeleton MIRRORS the ready layout (selector + summary + chart + 3 panels)
  // so nothing reflows on load.
  function statsSkeleton() {
    const seg = `<div class="m-rangeseg">` + Array.from({length:6}).map(() => `<span class="skel-line" style="width:72px;height:36px;border-radius:10px;flex:0 0 auto"></span>`).join('') + `</div>`;
    const sumSk = `<article class="m-card skeleton"><div class="skel-line" style="width:60px;height:12px"></div><div class="skel-line" style="width:120px;height:30px;margin-top:12px;border-radius:8px"></div><div class="skel-line" style="width:140px;height:12px;margin-top:12px"></div></article>`;
    const grid = `<div class="m-stat-grid">` + Array.from({length:3}).map(() => `<div class="m-statcell"><div class="skel-line" style="width:50px;height:20px"></div><div class="skel-line" style="width:40px;height:10px;margin-top:8px"></div></div>`).join('') + `</div>`;
    const pan = (t, h) => `<div class="m-spanel skeleton"><div class="skel-line" style="width:${t}px;height:16px"></div><div class="skel-line" style="width:100%;height:${h}px;border-radius:10px;margin-top:16px"></div></div>`;
    return seg + sumSk + grid + pan(170,150) + pan(110,170) + pan(150,150) + pan(140,90);
  }

  /* -------------------------------- Audits ------------------------------- */
  // weekly-audit header: the week + WoW delta badge + summary + progress.
  function auditHeader(opts = {}) {
    const o = opts;
    const wow = o.wow == null ? '' : (o.wow >= 0
      ? `<span class="m-wow m-wow--up">${ic('arrow-up',12)}${o.wow}% WoW</span>`
      : `<span class="m-wow m-wow--down">${ic('arrow-down',12)}${Math.abs(o.wow)}% WoW</span>`);
    return `<div class="m-audithead">`
      + `<div class="ah-top"><span class="ah-mark">${ic('audit',18)}</span>`
      + `<div class="ah-id"><div class="ah-week">${o.week || 'Week of May 25'}</div><div class="ah-range">${o.range || 'May 25 – Jun 1'} · ${o.posts || 18} posts analyzed</div></div>${wow}</div>`
      + `<p class="ah-summary">${o.summary || 'Your revision posts are pulling ahead — let’s lean into craft and quiet the motivational closers.'}</p>`
      + `<div class="ah-progress"><span class="ahp-pill">${o.review != null ? o.review : 2} need review</span><span class="ahp-meta">${o.decided != null ? o.decided : 2} of ${o.total || 6} decided</span></div></div>`;
  }

  // one suggested refinement. status: 'undecided'|'applied'|'rejected'|'rolledback'
  // opts: { kind, title, detail, diff:{before,after}, effect, effectLabel, note, hours }
  function auditChange(status = 'undecided', opts = {}) {
    const o = opts;
    const SB = {
      undecided: `<span class="badge" style="background:color-mix(in srgb,var(--color-accent) 12%,var(--color-surface));color:var(--color-accent);border-color:color-mix(in srgb,var(--color-accent) 30%,transparent)"><span class="pill-dot"></span>Needs review</span>`,
      applied:   `<span class="badge badge--good"><span class="pill-dot"></span>Applied</span>`,
      rejected:  `<span class="badge badge--bad"><span class="pill-dot"></span>Rejected</span>`,
      rolledback:`<span class="badge" style="background:color-mix(in srgb,var(--color-warning) 13%,var(--color-surface));color:var(--color-warning);border-color:color-mix(in srgb,var(--color-warning) 30%,transparent)"><span class="pill-dot"></span>Rolled back</span>`,
    };
    const diff = o.diff ? `<div class="m-diff">`
      + `<div class="m-diff-row m-diff-row--before"><div class="dl-cap"><span class="dl-sign">−</span>Now</div><div class="dl-txt">${o.diff.before}</div></div>`
      + `<div class="m-diff-row m-diff-row--after"><div class="dl-cap"><span class="dl-sign">+</span>Proposed</div><div class="dl-txt">${o.diff.after}</div></div></div>` : '';
    const hours = o.hours ? `<div class="m-aphours"><div class="aph-cap">Proposed posting hours · your local time</div>`
      + `<div class="aph-chips">${o.hours.map((h) => `<span class="aph-chip">${ic('clock',13)}${h}</span>`).join('')}</div></div>` : '';
    const note = o.note ? `<div class="m-auditnote">${ic('pencil',14)}<span>${o.note}</span></div>` : '';

    // foot meta + actions
    let meta = '', actions = '';
    if (status === 'undecided') {
      meta = `<span class="cc-when">Awaiting your decision · applies immediately</span>`;
      actions = `<button class="btn btn--ghost m-btn m-btn--grow">${ic('x',15)}Reject</button><button class="btn btn--primary m-btn m-btn--grow">${ic('check',15)}Approve</button>`;
    } else if (status === 'applied') {
      meta = o.effect
        ? `<span class="effect effect--${o.effect.trim().charAt(0)==='-'?'down':'up'}">${ic(o.effect.trim().charAt(0)==='-'?'arrow-down':'arrow-up',13)}${o.effect} ${o.effectLabel||''}</span>`
        : `<span class="effect effect--measuring">${ic('clock',13)}measuring effect…</span>`;
    } else if (status === 'rejected') {
      meta = `<span class="cc-when">You rejected this suggestion</span>`;
    } else if (status === 'rolledback') {
      meta = `<span class="effect effect--down">${ic('arrow-down',13)}${o.effect||'-4%'} ${o.effectLabel||''}</span>`;
    }
    const rollNote = status === 'rolledback'
      ? `<div class="m-rollback">${ic('undo',14)}<span><b>Auto-rolled-back.</b> This change hurt performance, so Pennedly reverted it — no action needed.</span></div>` : '';
    const foot = `<div class="m-cc-foot"><div class="m-cc-meta">${meta}</div>${actions?`<div class="m-cc-actions">${actions}</div>`:''}</div>`;
    const cls = 'm-card change-card' + (status==='rejected'?' change-card--rejected':'') + (status==='rolledback'?' change-card--rolledback':'');
    return `<article class="${cls}">`
      + `<div class="m-cc-head"><span class="kind-badge">${o.kind||'Voice'}</span><span class="m-cc-title">${o.title||'Cut the motivational sign-offs'}</span>${SB[status]}</div>`
      + `<p class="m-cc-detail">${o.detail||''}</p>${hours}${diff}${note}${rollNote}${foot}</article>`;
  }

  // a past-audit history row (full-width, stacked).
  function auditRow(opts = {}) {
    const o = opts;
    const wow = o.wow == null ? '' : (o.wow >= 0
      ? `<span class="ar-wow ar-wow--up">${ic('arrow-up',12)}${o.wow}% WoW</span>`
      : `<span class="ar-wow ar-wow--down">${ic('arrow-down',12)}${Math.abs(o.wow)}% WoW</span>`);
    const right = o.isNew
      ? `<span class="badge" style="background:color-mix(in srgb,var(--color-accent) 12%,var(--color-surface));color:var(--color-accent);border-color:color-mix(in srgb,var(--color-accent) 30%,transparent)"><span class="pill-dot"></span>Needs review</span>`
      : `<span class="badge badge--neutral">Reviewed</span>`;
    return `<button class="m-auditrow${o.isNew?' m-auditrow--new':''}">`
      + `<div class="ar-head"><div class="ar-date">${o.title||'Week of May 18'}</div>${right}</div>`
      + `<div class="ar-summary">${o.summary||''}</div>`
      + `<div class="ar-meta"><span>${o.range||''}</span><span class="sep">·</span><span>${o.decided||0} of ${o.total||0} decided</span>${wow}<span class="ar-go">${ic('chev-right',16)}</span></div></button>`;
  }

  function auditEmpty() {
    return `<div class="m-empty"><div class="m-empty-mark">${ic('audit',24)}</div><div class="m-empty-title">No audits yet</div>`
      + `<div class="m-empty-sub">Pennedly’s coach reviews your voice and strategy every week. Your first audit will land here after a few days of activity — you’ll always approve changes before anything happens.</div></div>`;
  }

  function auditSkeleton() {
    const headSk = `<div class="m-audithead skeleton"><div class="skel-line" style="width:150px;height:18px"></div><div class="skel-line" style="width:90%;height:12px;margin-top:12px"></div><div class="skel-line" style="width:60%;height:12px;margin-top:8px"></div></div>`;
    const cardSk = `<article class="m-card skeleton"><div class="skel-line" style="width:54px;height:20px;border-radius:999px"></div><div class="skel-line" style="width:80%;height:15px;margin-top:12px"></div><div class="skel-line" style="width:100%;height:11px;margin-top:12px"></div><div class="skel-line" style="width:92%;height:11px;margin-top:8px"></div><div class="skel-line" style="width:100%;height:44px;border-radius:10px;margin-top:16px"></div></article>`;
    return headSk + cardSk + cardSk;
  }

  /* ----------------------------- Pattern study --------------------------- */
  // intro framing — "what we learned from YOUR posts"
  function patternsIntro(posts = 47, last = '3 days ago') {
    return `<div class="m-pintro"><div class="pi-mark">${ic('layers',18)}</div>`
      + `<div class="pi-body"><div class="pi-t">What we learned from your posts</div>`
      + `<div class="pi-s">Patterns from your own published posts that move engagement · ${posts} studied · ${last}</div></div></div>`;
  }

  // one pattern card. opts: { kind, strength ('strong'|'emerging'), sample, stat,
  //   metric, headline, lead:{label,display,value}, base:{label,display,value}, note, examples:[{text,metric}] }
  function patternCard(opts = {}) {
    const o = opts;
    const lead = o.lead || { label:'Opens with a question', display:'34 avg comments', value:34 };
    const base = o.base || { label:'Opens with a statement', display:'16 avg comments', value:16 };
    const max = Math.max(lead.value, base.value) || 1;
    const strong = (o.strength || 'strong') === 'strong';
    const examples = (o.examples || []).map((ex) =>
      `<div class="m-ex"><span class="ex-bar"></span><div class="ex-body"><div class="ex-text">${ex.text}</div><div class="ex-metric">${ex.metric}</div></div></div>`).join('');
    return `<article class="m-card pattern-card">`
      + `<div class="m-pc-head"><span class="kind-tag">${o.kind||'Hook'}</span><span class="m-strength m-strength--${strong?'strong':'emerging'}"><span class="st-dot"></span>${strong?'Strong signal':'Worth testing'} · ${o.sample||18} posts</span></div>`
      + `<div class="m-pc-finding"><span class="m-pc-stat">${o.stat||'2.1×'}</span><div class="m-pc-headtext"><div class="m-pc-headline">${o.headline||''}</div><div class="m-pc-metric">${ic('arrow-up',12)}more ${o.metric||'comments'}</div></div></div>`
      + `<div class="m-pc-evidence"><div class="ev-cap">The evidence</div>`
      + `<div class="m-ev-row"><div class="ev-top"><span class="ev-label">${lead.label}</span><span class="ev-val">${lead.display}</span></div><span class="ev-track"><span class="ev-fill ev-fill--lead" style="width:${(lead.value/max*100).toFixed(0)}%"></span></span></div>`
      + `<div class="m-ev-row"><div class="ev-top"><span class="ev-label">${base.label}</span><span class="ev-val">${base.display}</span></div><span class="ev-track"><span class="ev-fill ev-fill--base" style="width:${(base.value/max*100).toFixed(0)}%"></span></span></div>`
      + `<div class="ev-note">${o.note||''}</div></div>`
      + `<div class="m-examples"><div class="ex-cap">From your posts</div>${examples}</div></article>`;
  }

  function patternsEmpty(have = 6, need = 15) {
    return `<div class="m-empty"><div class="m-empty-mark">${ic('layers',24)}</div><div class="m-empty-title">Not enough posts to study yet</div>`
      + `<div class="m-empty-sub">A study needs at least ${need} published posts to find patterns it can stand behind. Keep writing in the Studio — you’re getting there.</div>`
      + `<div class="m-pe-progress"><div class="m-pe-bar"><i style="width:${Math.round(have/need*100)}%"></i></div><div class="m-pe-count">${have} of ${need} posts</div></div></div>`;
  }

  function patternsSkeleton() {
    const intro = `<div class="m-pintro skeleton"><div class="skel-line" style="width:60%;height:15px"></div><div class="skel-line" style="width:85%;height:11px;margin-top:8px"></div></div>`;
    const cardSk = `<article class="m-card skeleton"><div class="skel-line" style="width:54px;height:20px;border-radius:999px"></div><div style="display:flex;gap:12px;align-items:center;margin-top:14px"><div class="skel-line" style="width:54px;height:34px;border-radius:8px;flex:0 0 auto"></div><div style="flex:1"><div class="skel-line" style="width:100%;height:12px"></div><div class="skel-line" style="width:70%;height:12px;margin-top:7px"></div></div></div><div class="skel-line" style="width:100%;height:70px;border-radius:10px;margin-top:16px"></div></article>`;
    return intro + cardSk + cardSk;
  }

  /* --------------------------- Explore patterns -------------------------- */
  // Explore is a PASTE → ANALYZE → RESULTS tool (not a filter library): paste the
  // text of posts you admire, Pennedly names the reusable move + rewrites it in
  // your voice, and you can "Add to my voice". These builders mirror that flow.
  function exploreInput(opts = {}) {
    const o = opts;
    const filled = !o.empty;
    const sample = `I deleted 40,000 followers worth of old posts last night. Not because they were bad. Because they weren’t me anymore.\n\nMost advice is autobiography in disguise. Take the data point, leave the certainty.`;
    const warnText = `Check out my page → mara.lin/links and follow @somebody for daily tips`;
    const val = o.warn ? warnText : (filled ? sample : '');
    const ready = filled && !o.warn;
    const count = o.warn ? 'Can’t analyze a link' : (filled ? '3 posts ready' : 'No posts yet');
    const warn = o.warn ? `<span class="m-link-warn">${ic('link',15)}<span>That looks like a link. Paste the words of the post — Pennedly never opens links.</span></span>` : '';
    const seeds = ['Try a sample set','A hook that stopped you','A post you reread','A line you wish you’d written'];
    return `<div class="m-paste-notice">${ic('quote',18)}<div class="pn-body"><div class="pn-t">Paste the text, not links.</div>`
      + `<div class="pn-d">Pennedly never opens links or reads other accounts. Drop in the words of the posts you admire — one per block, a blank line between.</div></div></div>`
      + `<div class="m-paste-box${o.warn?' m-paste-box--warn':''}"><textarea class="m-paste-area" placeholder="Paste a few posts you admire here.&#10;&#10;Leave a blank line between each one.">${val}</textarea>`
      + `<div class="m-paste-foot"><span class="m-sample-count${ready?' is-ready':''}"><span class="sc-dot"></span>${count}</span>${warn}`
      + `<button class="btn btn--primary m-btn m-btn--grow"${ready?'':' disabled'}>${ic('compass',16)}Analyze the craft</button></div></div>`
      + `<div class="m-seed-row"><span class="seed-cap">Not sure what to paste?</span>${seeds.map((s) => `<button class="m-seed-chip">${s}</button>`).join('')}</div>`;
  }

  function exploreAnalyzing(step = 2) {
    const steps = ['Reading the text you pasted','Separating the move from the post','Naming each technique','Rewriting an example in your voice'];
    const rows = steps.map((s, i) => {
      const st = i < step ? 'done' : i === step ? 'active' : '';
      const tick = i < step ? ic('check',12) : i === step ? '<span class="m-read-spin"></span>' : '<span class="m-read-dot"></span>';
      return `<div class="m-read-step m-read-step--${st}"><span class="m-read-tick">${tick}</span>${s}</div>`;
    }).join('');
    return `<div class="m-reading-card"><span class="m-reading-nib">${ic('nib',40)}</span>`
      + `<div class="m-reading-title">Reading the craft…</div><div class="m-reading-sub">Pulling the move out of each post — not the post itself.</div>`
      + `<div class="m-read-steps">${rows}</div></div>`;
  }

  function exploreResultsHead() {
    return `<div class="m-xresults-head"><div><div class="rh-title">3 techniques worth borrowing</div>`
      + `<div class="rh-cap">Pulled from the text you pasted · each rewritten in your voice</div></div>`
      + `<button class="btn btn--secondary m-btn">${ic('arrow-left',15)}Paste more</button></div>`
      + `<div class="m-set-summary">${ic('sparkle',18)}<span>Three moves worth stealing — and every one is about restraint, not volume.</span></div>`;
  }

  function exploreMeta() {
    return `<div class="m-xresults-meta"><span>3 samples analyzed</span><span class="rm-dot"></span><span>1840ms</span><span class="rm-dot"></span><span>Pennedly Craft 2</span></div>`;
  }

  // one extracted technique. opts: { kind, idx, name, technique, why, spotted, voice, doRule, added }
  function exploreCard(opts = {}) {
    const o = opts;
    const add = o.added
      ? `<span class="m-add-done">${ic('check',15)}Added to your voice</span>`
      : `<button class="btn btn--secondary m-add-voice">${ic('plus',15)}Add to my voice</button>`;
    return `<article class="m-card xc-card">`
      + `<div class="xc-head"><span class="xc-kind">${o.kind||'Hook'}</span><span class="xc-idx">${String((o.idx||0)+1).padStart(2,'0')}</span></div>`
      + `<div class="xc-name">${o.name||''}</div><div class="xc-technique">${o.technique||''}</div>`
      + `<div class="xc-why">${ic('quote',16)}<span>${o.why||''}</span></div>`
      + `<div class="xc-transfer"><div class="xc-block"><div class="xc-cap">The line that did it</div>`
      + `<div class="xc-source"><span class="xs-bar"></span><span class="xs-text">${o.spotted||''}</span></div></div>`
      + `<div class="xc-block"><div class="xc-cap">The same move, in your voice</div>`
      + `<div class="xc-voice"><span class="xv-bar"></span><span class="xv-text">${o.voice||''}</span></div></div></div>`
      + `<div class="xc-rule"><span class="rule-mono"><span class="rm-do">do:</span><span class="rm-text">${o.doRule||''}</span></span>${add}</div></article>`;
  }

  function exploreEmpty() {
    return `<div class="m-empty"><div class="m-empty-mark">${ic('compass',24)}</div><div class="m-empty-title">No moves to show yet</div>`
      + `<div class="m-empty-sub">Nothing came back from that text — it may have been too short, or all link. Paste a few full posts you admire and Pennedly will find the techniques worth borrowing.</div>`
      + `<button class="btn btn--secondary" style="margin-top:16px">${ic('arrow-left',15)}Back to paste</button></div>`;
  }

  function exploreSkeleton() {
    const cardSk = `<article class="m-card skeleton"><div style="display:flex;justify-content:space-between"><div class="skel-line" style="width:54px;height:20px;border-radius:999px"></div><div class="skel-line" style="width:24px;height:14px"></div></div><div class="skel-line" style="width:70%;height:16px;margin-top:14px"></div><div class="skel-line" style="width:100%;height:11px;margin-top:12px"></div><div class="skel-line" style="width:90%;height:11px;margin-top:7px"></div><div class="skel-line" style="width:100%;height:64px;border-radius:10px;margin-top:16px"></div></article>`;
    return cardSk + cardSk;
  }

  /* ------------------------------ Autopilot ------------------------------ */
  // Opt-in automation, OFF by default. Two sections: Auto-post (clock) + Auto-reply
  // (speech bubble). A self-contained toggle keeps it dependency-free.
  const toggle = (on, lg) => `<span class="m-toggle${lg?' m-toggle--lg':''}${on?' is-on':''}" role="switch" aria-checked="${on?'true':'false'}"><span class="m-toggle-knob"></span></span>`;

  function apIntro() {
    return `<div class="m-apintro">${ic('clock',16)}<div><b>Opt-in automation, off by default.</b> Let Pennedly post approved drafts and reply to comments on a schedule — you stay in control and can pause anytime.</div></div>`;
  }

  // Auto-post section. on=true shows the hours + cap config.
  function apAutoPost(on = false, opts = {}) {
    const hrs = [['7 AM',0],['9 AM',1],['11 AM',0],['1 PM',1],['3 PM',0],['5 PM',1],['7 PM',1],['9 PM',0]];
    const chips = hrs.map((h) => `<button class="m-hourchip${h[1]?' is-on':''}">${h[0]}</button>`).join('');
    const body = on ? `<div class="m-apsec-body">`
      + `<div class="m-field"><label>Posting hours</label><div class="m-hourgrid">${chips}</div><span class="m-field-hint">${ic('clock',12)}Your local time · UTC+1 · whole-hour slots</span></div>`
      + `<div class="m-field"><label>Daily cap</label><select class="m-select"><option>10 posts / day</option><option selected>25 posts / day</option><option>50 posts / day</option></select><span class="m-field-hint">Safety limit · stops after the cap each day (default 5)</span></div>`
      + `<div class="m-apnote">${ic('check',13)}<span>Publishes already-<b>approved</b> drafts only — never an unreviewed one.</span></div>`
      + `<div class="m-apstatus">${ic('clock',14)}<span>Next auto-post at <b>5:00 PM</b> · your time</span></div></div>` : '';
    return `<div class="m-apsec${on?' is-on':''}"><div class="m-apsec-head"><span class="m-apsec-ico m-apsec-ico--post">${ic('clock',20)}</span>`
      + `<div class="m-apsec-id"><div class="t">Auto-post</div><div class="s">Publishes approved drafts at chosen hours.</div></div>${toggle(on)}</div>${body}</div>`;
  }

  // Auto-reply section. on=true shows the audience filter.
  function apAutoReply(on = false, opts = {}) {
    const body = on ? `<div class="m-apsec-body">`
      + `<div class="m-field"><label>Who it replies to</label><select class="m-select"><option>Everyone</option><option selected>Followers only</option><option>People I follow</option><option>Mentions only</option></select><span class="m-field-hint">Only comments from this audience get an automatic reply.</span></div>`
      + `<div class="m-apnote">${ic('check',13)}<span>Replies are drafted in <b>your voice</b>, then sent within your limits.</span></div></div>` : '';
    return `<div class="m-apsec${on?' is-on':''}"><div class="m-apsec-head"><span class="m-apsec-ico m-apsec-ico--reply">${ic('bubble',20)}</span>`
      + `<div class="m-apsec-id"><div class="t">Auto-reply</div><div class="s">Answers comments in your voice, automatically.</div></div>${toggle(on)}</div>${body}</div>`;
  }

  function apReassure() {
    return `<div class="m-apreassure">${ic('check',16)}<div><b>Autopilot is off — nothing posts or replies without you.</b> Set up each section below, then switch it on when you’re ready.</div></div>`;
  }

  function apSkeleton() {
    const secSk = `<div class="m-apsec skeleton"><div style="display:flex;align-items:center;gap:11px"><div class="skel-line" style="width:40px;height:40px;border-radius:10px;flex:0 0 auto"></div><div style="flex:1"><div class="skel-line" style="width:90px;height:15px"></div><div class="skel-line" style="width:170px;height:11px;margin-top:7px"></div></div><div class="skel-line" style="width:46px;height:28px;border-radius:99px;flex:0 0 auto"></div></div></div>`;
    return secSk + secSk;
  }

  /* ── Refreshed Autopilot mobile components (master · schedules · 5-row policy · activity) ── */
  const AP_OBJS = [
    { name:'Morning thought', time:'8:00 AM', offset:'UTC+1', utc:'07:00 UTC', spread:'\u00B1 15 min', spreadHint:'Posts within \u00B115 min', topic:'Writing craft', on:true, seed:true },
    { name:'Evening question', time:'7:00 PM', offset:'UTC+1', utc:'18:00 UTC', spread:'Exact (no spread)', spreadHint:'Posts exactly at the time', topic:'A question for my audience', on:false, seed:true },
  ];
  const AP_POSTS = [
    { obj:'Morning thought', at:'5h ago', text:'the draft you\u2019re avoiding is usually the one worth writing. open the doc, write one bad sentence, and let it pull you in.', v:'9.4K', l:187, c:14 },
    { obj:'Midday craft note', at:'yesterday', text:'editing is just deciding, over and over, what you actually meant. the cuts are where the voice shows up.', v:'6.1K', l:132, c:9 },
  ];
  const AP_REPLIES = [
    { ini:'DP', who:'Devon Pierce', handle:'@devon_makes', at:'5h ago', on:'Morning thought', comment:'needed this exact reminder before opening my laptop today.', reply:'honestly i just let it be bad on purpose \u2014 the second sentence is always braver once the first one\u2019s out.' },
    { ini:'RA', who:'Rivka Adler', handle:'@rivka.k', at:'yesterday', on:'Evening question', comment:'\u201Cwrite every day\u201D wrecked me too. what replaced it?', reply:'\u201Cwrite most weeks, finish what matters.\u201D consistency over streaks \u2014 missing a day stopped meaning anything.' },
  ];

  function apMaster(on) {
    return `<div class="m-apmaster${on?' is-on':''}"><span class="m-apmaster-ico">${ic('clock',22)}</span>`
      + `<div class="m-apmaster-id"><div class="t">Autopilot</div><div class="s"><span class="sdot"></span>${on?'On \u00B7 posting and replying on your schedule':'Off \u00B7 you approve everything yourself'}</div></div>`
      + toggle(on, true) + `</div>`;
  }
  // confirm bottom sheet — primary action ON TOP, ghost cancel below.
  function apConfirmSheet() {
    return `<div class="m-csheet-scrim"></div><div class="m-csheet"><div class="m-csheet-grip"></div>`
      + `<div class="m-csheet-ico">${ic('clock',20)}</div><div class="m-csheet-title">Turn on Autopilot?</div>`
      + `<div class="m-csheet-sub">Pennedly will publish your enabled schedules and send replies under your policy \u2014 automatically. Every post still appears in your feed, and you can pause anytime.</div>`
      + `<div class="m-csheet-actions"><button class="btn btn--primary m-btn">${ic('clock',15)} Turn on autopilot</button><button class="btn btn--secondary m-btn">Cancel</button></div></div>`;
  }
  function apField(label, val, opts, hint) {
    const o = opts.map((x) => `<option${x===val?' selected':''}>${x}</option>`).join('');
    return `<div class="m-field"><label>${label}</label><select class="m-select">${o}</select>${hint?`<span class="m-field-hint">${hint}</span>`:''}</div>`;
  }
  function apObjCard(o) {
    const body = o.confirm
      ? `<div class="m-objconfirm"><span class="t">Delete this object?</span><button class="btn btn--ghost m-btn" style="flex:1 1 0">Cancel</button><button class="btn btn--danger m-btn" style="flex:1 1 0">Delete</button></div>`
      : apField('Post time', o.time, ['7:00 AM','8:00 AM','12:00 PM','1:00 PM','7:00 PM'], `${ic('clock',12)}${o.offset} \u00B7 sends ${o.utc}`)
        + apField('Random spread', o.spread, ['Exact (no spread)','\u00B1 5 min','\u00B1 15 min','\u00B1 30 min'], o.spreadHint)
        + apField('Topic', o.topic, ['any (round-robin)','Writing craft','Revision & editing','A question for my audience'])
        + `<div class="m-objseed">${toggle(o.seed)}<span>New posts from this schedule start with auto-reply on</span></div>`
        + (o.on ? '' : `<div class="m-objpaused">Paused</div>`);
    return `<div class="m-objcard${o.on?'':' is-off'}"><div class="m-objhead"><input class="m-objname" value="${o.name}" aria-label="Schedule name">${toggle(o.on)}<button class="m-objdel" aria-label="Remove schedule">${ic('trash',16)}</button></div>${body}</div>`;
  }
  function apSchedule(objs) {
    objs = objs || AP_OBJS;
    const head = `<div class="m-ap2head"><div><div class="t">Scheduled posts</div><div class="s">Each schedule drafts a post in your voice and publishes around the set time \u2014 your local time (UTC+1).</div></div>${objs.length?`<button class="m-ap2add">${ic('plus',15)} Add</button>`:''}</div>`;
    const body = objs.length
      ? `<div class="m-ap2body">${objs.map(apObjCard).join('')}</div>`
      : `<div class="m-ap2body"><div class="m-empty"><div class="m-empty-mark">${ic('clock',24)}</div><div class="m-empty-title">No scheduled posts yet</div><div class="m-empty-sub">Add a schedule and Pennedly will draft and post on a rhythm \u2014 always in your voice, always visible in your feed.</div></div></div>`;
    return `<div class="m-ap2sec">${head}${body}</div>`;
  }
  function apPolicyRow(o) {
    const inline = (o.switchOn !== undefined) ? toggle(o.switchOn) : '';
    const below = o.select ? `<div class="m-prow-ctl"><select class="m-select">${o.select.opts.map((x) => `<option${x===o.select.val?' selected':''}>${x}</option>`).join('')}</select></div>` : '';
    return `<div class="m-prow${o.hero?' m-prow--hero':''}"><div class="m-prow-top"><div style="min-width:0"><div class="m-prow-t">${o.hero?'<span class="star"></span>':''}${o.t}</div><div class="m-prow-d">${o.d}</div></div>${inline}</div>${below}${o.extra||''}</div>`;
  }
  function apPolicy(opt) {
    opt = opt || {}; const mode = opt.mode; const on = mode ? (mode !== 'off') : (opt.on !== false); const quiet = opt.quiet !== false;
    const rows = ''
      + apPolicyRow({ t:'Who it replies to', d:'The audience whose comments can get an automatic reply.', select:{ val:'Fans & positive', opts:['Fans & positive','Everyone except trolls','Questions only'] } })
      + apPolicyRow({ t:'Only reply when it adds value', hero:true, switchOn:true, d:'Skip pure-reaction comments (emoji, \u201Cnice\u201D, \u201Cthanks\u201D) and threads that have run their course \u2014 autopilot reads the context and decides if a reply is worth it.' })
      + apPolicyRow({ t:'How often to reply', d:'New replies are batched to this rhythm; your daily cap still applies.', select:{ val:'About once an hour', opts:['As they come (~15 min)','About once an hour','A few times a day','Once a day'] } })
      + apPolicyRow({ t:'Daily reply cap', d:'A safety limit on how many replies autopilot sends each day.', select:{ val:'25 / day', opts:['10 / day','25 / day','50 / day'] } })
      + apPolicyRow({ t:'Quiet hours', d:'Pause replies overnight. Times are in your local timezone.', switchOn:quiet, extra: quiet ? `<div class="m-prow-quiet"><span class="ql">From</span><select class="m-select"><option selected>11:00 PM</option><option>10:00 PM</option></select><span class="ql">to</span><select class="m-select"><option selected>8:00 AM</option><option>7:00 AM</option></select><span class="qh">${ic('clock',12)} UTC+1 \u00B7 22:00\u201307:00 UTC</span></div>` : '' });
    return `<div class="m-ap2sec"><div class="m-ap2head"><div><div class="t">Auto-reply policy</div><div class="s">When on, replies are drafted in your voice and sent automatically.</div></div>${mode?'':toggle(on)}</div>`
      + (mode
        ? `<div class="m-ap2body"><div class="rmode-row rmode-row--stack"><span class="rmode-label">Reply to comments</span><div class="rmode-seg rmode-seg--full" role="tablist" aria-label="Auto-reply mode">${[['off','Off'],['all','All posts'],['selected','Selected']].map((x) => `<button class="rmode-btn${x[0]===mode?' rmode-btn--active':''}" role="tab" aria-selected="${x[0]===mode}">${x[1]}</button>`).join('')}</div></div>${mode==='selected'?'<div class="rmode-hint">Auto-replies go only to posts you flag in My Feed.</div>':''}<div class="m-policybody${on?'':' is-off'}" style="margin-top:16px">${rows}</div></div></div>`
        : `<div class="m-ap2body m-policybody${on?'':' is-off'}">${rows}</div></div>`);
  }
  function apAutoPostItem(p) {
    return `<div class="m-autopost"><div class="m-autopost-top"><span class="m-autopost-tag">${ic('clock',12)}${p.obj}</span><span class="m-autopost-time">${p.at}</span></div>`
      + `<div class="m-autopost-text">${p.text}</div>`
      + `<div class="m-autopost-foot"><div class="m-autopost-stats"><span class="ms">${ic('eye',12)}${p.v}</span><span class="ms">${ic('heart',12)}${p.l}</span><span class="ms">${ic('bubble',12)}${p.c}</span></div><a class="m-actlink">View post${ic('external',12)}</a></div></div>`;
  }
  function apAutoReplyItem(r) {
    return `<div class="m-autoreply"><div class="m-ar-comment"><span class="m-ar-av">${r.ini}</span><div style="min-width:0"><div class="m-ar-who">${r.who} <span>${r.handle}</span></div><div class="m-ar-ctext">${r.comment}</div></div></div>`
      + `<div class="m-ar-reply"><div class="m-ar-rwho">You <span class="m-ar-rtag">${ic('bubble',11)}auto-replied</span></div><div class="m-ar-rtext">${r.reply}</div></div>`
      + `<div class="m-ar-foot"><span>${r.at} \u00B7 on a comment to your \u201C${r.on}\u201D post</span><a class="m-actlink">View thread${ic('external',12)}</a></div></div>`;
  }
  function apActivity(tab) {
    const allTime = `<div class="m-act-alltime"><span class="cap">All time</span><span class="stat"><b>31</b> posts</span><span class="stat"><b>142</b> auto-replies</span></div>`;
    const objstats = `<div class="m-objstats">` + [['Morning thought',14,'May 30'],['Midday craft note',11,'May 29'],['Evening question',6,'May 28']]
      .map((c) => `<div class="m-objstat"><span class="nm">${c[0]}</span><span class="rt"><span class="ct">${c[1]}<small>posts</small></span><span class="lt">last ${c[2]}</span></span></div>`).join('') + `</div>`;
    const list = tab === 'replies' ? AP_REPLIES.map(apAutoReplyItem).join('') : AP_POSTS.map(apAutoPostItem).join('');
    return `<div class="m-ap2sec"><div class="m-ap2head"><div><div class="t">Activity</div><div class="s">Everything autopilot has done \u2014 read-only.</div></div>`
      + `<div class="m-acttabs"><button class="m-acttab${tab!=='replies'?' is-on':''}">Posts</button><button class="m-acttab${tab==='replies'?' is-on':''}">Replies</button></div></div>`
      + `<div class="m-ap2body">${allTime}${objstats}<div class="m-actlist">${list}</div></div></div>`;
  }
  function apEmptyActivity() {
    return `<div class="m-ap2sec"><div class="m-ap2head"><div><div class="t">Activity</div><div class="s">Everything autopilot has done \u2014 read-only.</div></div></div>`
      + `<div class="m-ap2body"><div class="m-empty"><div class="m-empty-mark">${ic('clock',24)}</div><div class="m-empty-title">No activity yet</div><div class="m-empty-sub">Once autopilot runs, the posts it publishes and the replies it sends will appear here for you to review.</div></div></div></div>`;
  }
  function apFooter() {
    return `<div class="m-apfoot"><div class="ln">${ic('clock',14)}<span>Autopilot follows your <a>Voice</a> and <a>Style rules</a>.</span></div>`
      + `<div class="ln">${ic('check',14)}<span><b>Only drafts that pass quality checks are published;</b> daily limits apply; everything is logged and can be undone.</span></div></div>`;
  }

  /* ----------------------------- Style rules ----------------------------- */
  const appliesCtl = (active) => `<div class="m-applies" role="group" aria-label="Applies to">`
    + [['all','Both'],['post','Posts'],['reply','Replies']].map(([k,l]) => `<button class="m-applies-btn${k===active?' is-on':''}">${l}</button>`).join('') + `</div>`;

  function srSectionHead(icon, title, count, sub) {
    return `<div class="m-srhead"><span class="m-srhead-mark">${ic(icon,17)}</span><div class="m-srhead-id">`
      + `<div class="t">${title}${count?` <span class="m-srhead-count">${count}</span>`:''}</div><div class="d">${sub}</div></div></div>`;
  }

  function srCatGroup(name, onN, total, rows) {
    return `<div class="m-catgroup"><div class="m-cathead"><span class="cat-name">${name}</span><span class="cat-count">${onN}/${total}</span></div><div class="m-rules">${rows}</div></div>`;
  }

  // before → after demo (stacked). on=false leaves "after" equal to "before".
  function srDemo(on, note) {
    const before = `It works — mostly — and reads «human».`;
    const after = on ? `It works, mostly, and reads "human".` : before;
    return `<div class="m-sr-demo">${note?`<div class="m-sr-note">${ic('sliders',13)}<span>${note}</span></div>`:''}`
      + `<div class="m-sd-row m-sd-row--from"><span class="m-sd-cap">Before</span><code class="m-sd-text">${before}</code></div>`
      + `<div class="m-sd-row m-sd-row--to${on?'':' is-off'}"><span class="m-sd-cap">After</span><code class="m-sd-text">${after}</code></div></div>`;
  }

  // built-in rule row. opts: { title, desc, on, applies, demo, note }
  function srRuleRow(o = {}) {
    const demo = o.demo ? srDemo(o.on !== false, o.note) : '';
    return `<div class="m-rule${o.on===false?' is-off':''}">`
      + `<div class="m-rule-row"><div class="m-rule-main"><div class="m-rule-title">${o.title||''}</div>`
      + `<div class="m-rule-desc">${o.desc||''}</div>${appliesCtl(o.applies||'all')}</div>${toggle(o.on!==false)}</div>${demo}</div>`;
  }

  // custom ("your") rule row. opts: { text, applies, on, editing }
  function srCustomRow(o = {}) {
    if (o.editing) {
      return `<div class="m-ffrow m-ffrow--editing"><input class="m-ff-input" value="${o.text||''}" aria-label="Edit rule"/>`
        + `<div class="m-ff-editfoot">${appliesCtl(o.applies||'all')}<div class="m-ff-editbtns"><button class="btn btn--ghost m-btn">Cancel</button><button class="btn btn--primary m-btn">${ic('check',15)}Save</button></div></div></div>`;
    }
    return `<div class="m-ffrow${o.on===false?' is-off':''}">`
      + `<div class="m-ff-main"><div class="m-ff-text">${o.text||''}</div>`
      + `<div class="m-ff-meta">${appliesCtl(o.applies||'all')}<span class="m-ff-icons"><button class="m-ff-icon" aria-label="Edit">${ic('pencil',15)}</button><button class="m-ff-icon m-ff-icon--danger" aria-label="Remove">${ic('trash',15)}</button></span></div></div>`
      + `${toggle(o.on!==false)}</div>`;
  }

  function srAddRule() {
    return `<div class="m-ffadd"><input class="m-ff-input" placeholder="Add a rule in your own words…" aria-label="New rule"/>`
      + `<div class="m-ffadd-foot">${appliesCtl('all')}<button class="btn btn--primary m-btn m-btn--grow">${ic('plus',16)}Add rule</button></div></div>`;
  }

  function srSkeleton() {
    const head = `<div class="m-srhead skeleton"><div class="skel-line" style="width:34px;height:34px;border-radius:8px;flex:0 0 auto"></div><div style="flex:1"><div class="skel-line" style="width:120px;height:14px"></div><div class="skel-line" style="width:200px;height:10px;margin-top:7px"></div></div></div>`;
    const ruleSk = `<div class="m-rule skeleton"><div style="display:flex;gap:12px"><div style="flex:1"><div class="skel-line" style="width:160px;height:13px"></div><div class="skel-line" style="width:90%;height:10px;margin-top:8px"></div></div><div class="skel-line" style="width:46px;height:28px;border-radius:99px;flex:0 0 auto"></div></div></div>`;
    return head + ruleSk + ruleSk + head + ruleSk + ruleSk;
  }

  /* ------------------------------- Settings ------------------------------ */
  function setSection(title, desc, body, opts = {}) {
    return `<section class="m-setcard${opts.danger?' m-setcard--danger':''}"><div class="m-setcard-head"><div class="t">${title}</div>`
      + `${desc?`<div class="d">${desc}</div>`:''}</div><div class="m-setcard-body">${body}</div></section>`;
  }

  // signed-in identity: avatar + email + plan (read-only; billing not built).
  function setIdentity() {
    const body = `<div class="m-identity"><img class="avatar-img" src="${A}mara.png" width="52" height="52" alt=""/>`
      + `<div class="who"><div class="em">mara@pennedly.com</div><div class="pl">Billed yearly</div></div>`
      + `<span class="m-planbadge">${ic('sparkle',13)}Creator plan</span></div>`
      + `<div class="m-setnote">Billing isn’t available yet — your plan can’t be changed here.</div>`;
    return setSection('Account', null, body);
  }

  // language: 8 UI locales as flag + native + English buttons (2-up grid).
  function setLanguage(active = 'en') {
    const L = [['en','🇬🇧','English','English'],['es','🇪🇸','Español','Spanish'],['de','🇩🇪','Deutsch','German'],['fr','🇫🇷','Français','French'],['it','🇮🇹','Italiano','Italian'],['pt','🇵🇹','Português','Portuguese'],['ru','🇷🇺','Русский','Russian'],['uk','🇺🇦','Українська','Ukrainian']];
    const grid = L.map(([code,flag,native,en]) => `<button class="m-lang${code===active?' is-active':''}" role="radio" aria-checked="${code===active?'true':'false'}">`
      + `<span class="m-lang-flag">${flag}</span><span class="m-lang-txt"><span class="nm">${native}</span><span class="rg">${en}</span></span>${ic('check',16)}</button>`).join('');
    return setSection('Interface language', 'Changes the app’s labels and menus. Your drafts stay in the language you write them in.', `<div class="m-langgrid" role="radiogroup">${grid}</div>`);
  }

  // a connected-account row. opts: { name, handle, av, primary }
  function setAccountRow(o = {}) {
    return `<div class="m-acctrow"><img class="avatar-img" src="${A}${o.av||'mara.png'}" width="40" height="40" alt=""/>`
      + `<div class="m-acct-main"><div class="m-acct-nm">${o.name||''}${o.primary?'<span class="m-primary">Primary</span>':''}</div><div class="m-acct-hd">${o.handle||''}</div></div>`
      + `<button class="m-disconnect">Disconnect</button></div>`;
  }

  // connected accounts section. opts.empty → zero-state + connect CTA.
  function setAccounts(opts = {}) {
    const desc = 'Pennedly drafts and posts for each connected account. Disconnecting stops all activity for that handle.';
    if (opts.empty) {
      const body = `<div class="m-acct-empty"><span class="ae-mark">${ic('link',20)}</span><div class="ae-t">No accounts connected</div>`
        + `<div class="ae-s">Connect a Threads account and Pennedly can start drafting for it.</div></div>`
        + `<button class="btn btn--secondary m-btn m-btn--grow" style="margin-top:14px">${ic('link',16)}Connect a Threads account</button>`;
      return setSection('Connected Threads accounts', desc, body);
    }
    const rows = setAccountRow({ name:'Mara Lin', handle:'@mara.lin', av:'mara.png', primary:true })
      + setAccountRow({ name:'Field Notes', handle:'@field.notes', av:'fieldnotes.png' });
    const body = `<div class="m-acct-list">${rows}</div>`
      + `<button class="btn btn--secondary m-btn m-btn--grow" style="margin-top:12px">${ic('link',16)}Connect another account</button>`;
    return setSection('Connected Threads accounts', desc, body);
  }

  // appearance: light / dark toggle.
  function setAppearance(dark) {
    const body = `<div class="m-aprow"><span class="m-aprow-ico">${ic('moon',18)}</span><div class="m-aprow-id"><div class="t">Dark mode</div><div class="d">Match your eyes, not the clock.</div></div>${toggle(!!dark)}</div>`;
    return setSection('Appearance', null, body);
  }

  // danger zone: delete the whole Pennedly account.
  function setDanger() {
    const body = `<div class="m-dangerrow"><div class="m-dangerrow-id"><div class="t">Delete Pennedly account</div>`
      + `<div class="d">Permanently deletes your account, every connected handle, and all drafts, replies and history. This cascade can’t be undone.</div></div></div>`
      + `<button class="btn btn--danger m-btn m-btn--grow" style="margin-top:4px">${ic('trash',16)}Delete account</button>`;
    return setSection('Danger zone', null, body, { danger:true });
  }

  // disconnect-account confirmation (bottom sheet).
  function disconnectSheet() {
    return `<div class="m-scrim"></div><div class="m-sheet m-dialogsheet"><div class="m-sheet-grip"></div>`
      + `<div class="dialog-head"><div class="dialog-mark dialog-mark--danger">${ic('link',18)}</div><div><div class="dialog-title">Disconnect @field.notes?</div>`
      + `<div class="dialog-sub">This deauthorizes the account on Threads and starts deleting its Pennedly data. You can reconnect later, but the history won’t come back.</div></div></div>`
      + `<div class="m-dialog-actions"><button class="btn btn--danger">${ic('link',16)}Disconnect account</button><button class="btn btn--ghost">Cancel</button></div></div>`;
  }

  // delete-account confirmation (bottom sheet, danger).
  function deleteAccountSheet() {
    return `<div class="m-scrim"></div><div class="m-sheet m-dialogsheet"><div class="m-sheet-grip"></div>`
      + `<div class="dialog-head"><div class="dialog-mark dialog-mark--danger">${ic('trash',18)}</div><div><div class="dialog-title">Delete your Pennedly account?</div>`
      + `<div class="dialog-sub">This permanently deletes your account, every connected handle, and all drafts, replies and history. The cascade can’t be undone.</div></div></div>`
      + `<div class="m-confirm-type"><label>Type <b>DELETE</b> to confirm</label><input class="m-ff-input" placeholder="DELETE"/></div>`
      + `<div class="m-dialog-actions"><button class="btn btn--danger">${ic('trash',16)}Delete everything</button><button class="btn btn--ghost">Cancel</button></div></div>`;
  }

  function setSkeleton() {
    const cardSk = (rows) => `<section class="m-setcard skeleton"><div class="skel-line" style="width:150px;height:15px"></div><div class="skel-line" style="width:240px;height:10px;margin-top:10px"></div>`
      + Array.from({length:rows}).map(() => `<div class="skel-line" style="width:100%;height:46px;border-radius:10px;margin-top:12px"></div>`).join('') + `</section>`;
    return cardSk(1) + cardSk(4) + cardSk(2);
  }

  /* ------------------------------ Onboarding ----------------------------- */
  // Full-screen first-run wizard — NO app shell (no hamburger / drawer / tab bar).
  // Its own brand bar + 3-step stepper + scrollable stage + pinned footer action.
  function obTopBar(opts = {}) {
    const o = opts;
    const pill = o.preview ? `<span class="status-pill status-pill--accent m-ob-pill"><i class="pill-dot"></i>Preview · nothing saved</span>` : '';
    const skip = o.skip === false ? '' : `<button class="m-ob-skip">Skip for now</button>`;
    return `<header class="m-ob-top"><span class="m-ob-logo">${ic('nib',18)}</span><span class="m-ob-name">Pennedly</span>${pill}`
      + `<span class="m-ob-spacer"></span><div class="m-ob-topact">${skip}<button class="m-iconbtn">${ic('moon',18)}</button></div></header>`;
  }

  function obStepper(step) {
    const S = ['Connect','Voice','Done'];
    return `<div class="m-ob-stepper" aria-label="Onboarding progress">` + S.map((l, i) => {
      const cls = i===step ? 'is-current' : i<step ? 'is-done' : '';
      const line = i>0 ? `<span class="m-ob-line${i<=step?' is-done':''}"></span>` : '';
      const dot = i<step ? ic('check',13) : String(i+1);
      return line + `<div class="m-ob-step ${cls}"><span class="m-ob-dot">${dot}</span><span class="m-ob-steplbl">${l}</span></div>`;
    }).join('') + `</div>`;
  }

  // wrap a stage's content + footer into the full onboarding screen body (rawBody).
  function obStage(step, content, foot) {
    return `<div class="m-ob"><div class="m-ob-steprow">${obStepper(step)}</div>`
      + `<div class="m-ob-scroll"><div class="m-ob-stage">${content}</div></div>`
      + (foot ? `<div class="m-ob-foot">${foot}</div>` : '') + `</div>`;
  }

  // Stage 1 — Connect. status: 'idle'|'connecting'|'connected'|'error'
  function obConnect(status = 'idle', opts = {}) {
    const trust = [['eye','Read-only — Pennedly studies your posts to learn your voice.'],['check','Nothing is ever posted without your approval.'],['lock','Disconnect anytime. Your account stays yours.']];
    const trustRows = trust.map((t) => `<div class="m-ob-trust-row"><span class="m-ob-trust-ico">${ic(t[0]==='lock'?'autopilot':t[0],15)}</span><span>${t[1]}</span></div>`).join('');
    const connected = `<div class="m-ob-connected"><img class="avatar-img" src="${A}mara.png" width="42" height="42" alt=""/>`
      + `<div class="who"><div class="nm">Mara Lin</div><div class="hd">@mara.lin · 18.2k followers</div></div>`
      + `<span class="status-pill status-pill--success"><i class="pill-dot"></i>Connected</span></div>`;
    const errBanner = status === 'error' ? `<div class="m-error" style="margin-top:18px"><div class="eb-mark">${ic('x',18)}</div><div><div class="eb-title">Couldn’t connect to Threads</div><div class="eb-sub">The authorization didn’t complete. Check your connection and try again.</div></div></div>` : '';
    const content = `<span class="m-ob-mark">${ic('nib',30)}</span>`
      + `<div class="m-ob-eyebrow">Welcome to Pennedly</div>`
      + `<h1 class="m-ob-title">Your drafting partner, ready in a minute.</h1>`
      + `<p class="m-ob-sub">Pennedly writes posts and replies that sound like you — then waits for your okay. To start, connect the Threads account you want it to write for.</p>`
      + (status==='connected' ? connected : `<div class="m-ob-trust">${trustRows}</div>`) + errBanner;
    let foot;
    if (status==='connected') foot = `<button class="btn btn--primary m-btn m-btn--grow">Continue ${ic('chev-right',16)}</button>`;
    else if (status==='connecting') foot = `<button class="btn btn--primary m-btn m-btn--grow" disabled><span class="m-spinner"></span>Connecting…</button>`;
    else if (status==='error') foot = `<button class="btn btn--primary m-btn m-btn--grow">${ic('undo',16)}Try connecting again</button>`;
    else foot = `<button class="btn btn--primary m-btn m-btn--grow">${ic('at',17)}Connect Threads account</button>`;
    return obStage(0, content, foot);
  }

  // Stage 2 — Choose. opts.locked → analyze is locked (too few posts).
  function obChoose(opts = {}) {
    const locked = !!opts.locked;
    const analyzeActive = !locked;
    const choiceAnalyze = locked
      ? `<button class="m-ob-choice is-disabled"><span class="m-ob-choice-ico">${ic('eye',20)}</span><span class="m-ob-choice-body"><span class="m-ob-choice-top"><span class="m-ob-choice-title">Analyze my posts</span><span class="m-ob-choice-locked">${ic('autopilot',12)}Needs 15 posts</span></span><span class="m-ob-choice-desc">Pennedly needs at least 15 recent posts to learn from — @mara.lin has 6. Build from scratch for now; this unlocks once you’ve posted more.</span></span></button>`
      : `<button class="m-ob-choice is-active"><span class="m-ob-choice-ico">${ic('eye',20)}</span><span class="m-ob-choice-body"><span class="m-ob-choice-top"><span class="m-ob-choice-title">Analyze my posts</span><span class="m-ob-choice-rec">Recommended</span></span><span class="m-ob-choice-desc">Pennedly reads @mara.lin’s recent posts and distils your themes, rhythm, and the things you’d never say.</span><span class="m-ob-choice-meta">${ic('clock',13)}Takes about a minute</span></span>${ic('check',18)}</button>`;
    const choiceScratch = `<button class="m-ob-choice${locked?' is-active':''}"><span class="m-ob-choice-ico">${ic('pencil',20)}</span><span class="m-ob-choice-body"><span class="m-ob-choice-top"><span class="m-ob-choice-title">Build from scratch</span></span><span class="m-ob-choice-desc">Describe your voice in your own words and choose what to write about. Best if your account is new or private.</span><span class="m-ob-choice-meta">${ic('clock',13)}Takes a few minutes</span></span>${ic('check',18)}</button>`;
    const content = `<div class="m-ob-eyebrow">Step 2 of 3 · Your voice</div>`
      + `<h1 class="m-ob-title">How should Pennedly learn your voice?</h1>`
      + `<p class="m-ob-sub">This is what makes drafts sound like you and not a robot. Pick one — you can always refine it later.</p>`
      + `<div class="m-ob-choices" role="radiogroup">${choiceAnalyze}${choiceScratch}</div>`;
    const foot = `<button class="m-ob-back">${ic('arrow-left',15)}Back</button><span class="m-ob-grow"></span><button class="btn btn--primary m-btn">Continue ${ic('chev-right',16)}</button>`;
    return obStage(1, content, foot);
  }

  // Stage 2 (analyze path) — in progress.
  function obAnalyze(step = 1) {
    const steps = ['Reading your recent posts','Finding the themes you return to','Distilling how you sound'];
    const rows = steps.map((l, i) => {
      const st = i<step ? 'done' : i===step ? 'active' : '';
      const tick = i<step ? ic('check',13) : i===step ? '<span class="m-read-spin"></span>' : '<span class="m-read-dot"></span>';
      return `<div class="m-ob-an-step m-ob-an-step--${st}"><span class="m-ob-an-tick">${tick}</span><span>${l}</span></div>`;
    }).join('');
    const content = `<div class="m-ob-analyze"><span class="m-ob-nib">${ic('nib',40)}</span>`
      + `<h1 class="m-ob-title" style="text-align:center">Learning how you write…</h1>`
      + `<span class="m-ob-an-acct"><img class="avatar-img" src="${A}mara.png" width="22" height="22" alt=""/>@mara.lin</span>`
      + `<div class="m-ob-an-steps">${rows}</div></div>`;
    return obStage(1, content, '');
  }

  // Stage 2 (scratch path) — short form.
  function obScratch() {
    const chip = (t) => `<span class="m-ob-chip">${t}<button aria-label="Remove">${ic('x',11)}</button></span>`;
    const sugg = (t) => `<button class="m-ob-suggest">${ic('plus',12)}${t}</button>`;
    const content = `<div class="m-ob-eyebrow">Step 2 of 3 · Build from scratch</div>`
      + `<h1 class="m-ob-title">Tell Pennedly how you write.</h1>`
      + `<p class="m-ob-sub">A few lines is plenty. This becomes the starting point for your voice — edit it anytime.</p>`
      + `<div class="m-ob-field"><label>Describe your voice</label>`
      + `<textarea class="m-ob-ta" placeholder="e.g. Warm but direct. Short sentences, plain words, the occasional dry joke."></textarea>`
      + `<div class="m-ob-starters"><button class="m-ob-starter">“Warm but direct. Short sentences, plain words…”</button><button class="m-ob-starter">“Curious and a little contrarian…”</button></div></div>`
      + `<div class="m-ob-field"><label>Topics to write about</label><div class="m-ob-chipfield">${chip('Writing craft')}${chip('Building in public')}<input class="m-ob-chipinput" placeholder="Add a topic and press Enter…"/></div>`
      + `<div class="m-ob-suggests">${sugg('Productivity')}${sugg('Design')}${sugg('Books & reading')}${sugg('Creativity')}</div></div>`
      + `<div class="m-ob-field"><label>Topics to avoid <span class="m-ob-opt">optional</span></label><div class="m-ob-chipfield">${chip('Politics')}<input class="m-ob-chipinput" placeholder="Anything Pennedly should never touch…"/></div>`
      + `<div class="m-ob-suggests">${sugg('Crypto')}${sugg('Hustle culture')}${sugg('Engagement bait')}</div></div>`;
    const foot = `<button class="m-ob-back">${ic('arrow-left',15)}Back</button><span class="m-ob-grow"></span><button class="btn btn--primary m-btn">Create my voice ${ic('chev-right',16)}</button>`;
    return obStage(1, content, foot);
  }

  // Stage 3 — Done recap.
  function obDone(opts = {}) {
    const connected = opts.connected !== false;
    const mode = opts.mode || 'analyze';
    const voiceLabel = mode==='scratch' ? 'Built from your description' : mode==='analyze' ? 'Analysed from your posts' : 'Set up later';
    const content = `<div class="m-ob-donehead"><span class="m-ob-donemark">${ic('check',30)}</span>`
      + `<h1 class="m-ob-title">You’re all set, Mara.</h1>`
      + `<p class="m-ob-sub">Pennedly is ready to draft for @mara.lin in your voice. Remember — nothing is published until you approve it.</p></div>`
      + `<div class="m-ob-recap"><div class="m-ob-recap-row"><span class="m-ob-recap-ico">${ic('at',16)}</span><div class="m-ob-recap-txt"><div class="k">Connected account</div><div class="v">@mara.lin</div></div>${ic('check',17)}</div>`
      + `<div class="m-ob-recap-row"><span class="m-ob-recap-ico">${ic('voice',16)}</span><div class="m-ob-recap-txt"><div class="k">Your voice</div><div class="v">${voiceLabel}</div></div>${ic('check',17)}</div></div>`;
    const foot = `<button class="m-ob-back">Refine your voice</button><span class="m-ob-grow"></span><a class="btn btn--primary m-btn">Go to Studio ${ic('chev-right',16)}</a>`;
    return obStage(2, content, foot);
  }

  // Stage 3 — read-only tester preview (?preview=1).
  function obPreview() {
    const themes = ['The craft of writing','Building in public','Creative courage','Writing for the right hundred people'].map((x) => `<span class="m-ob-pvchip">${x}</span>`).join('');
    const traits = ['Plain words over clever ones','Opens on a concrete moment','Short paragraphs, one idea each','Dry humour, usually self-directed'].map((x) => `<li>${ic('check',14)}${x}</li>`).join('');
    const content = `<div class="m-ob-donehead"><span class="status-pill status-pill--accent"><i class="pill-dot"></i>Preview · nothing was saved</span>`
      + `<h1 class="m-ob-title" style="margin-top:16px">The voice Pennedly would build</h1>`
      + `<p class="m-ob-sub">Generated for real from @mara.lin’s recent posts — but preview mode doesn’t save it. Run setup normally to keep this voice.</p></div>`
      + `<div class="m-ob-pv"><div class="m-ob-pvblock"><div class="m-ob-pvcap">Voice summary</div><p class="m-ob-pvsummary">Warm but never gushing — like a voice note to one friend who also makes things. Earns every claim with a small, specific moment, then gets out of the way.</p></div>`
      + `<div class="m-ob-pvblock"><div class="m-ob-pvcap">Themes</div><div class="m-ob-pvchips">${themes}</div></div>`
      + `<div class="m-ob-pvblock"><div class="m-ob-pvcap">How you sound</div><ul class="m-ob-pvlist">${traits}</ul></div></div>`;
    const foot = `<button class="m-ob-back">${ic('arrow-left',15)}Back to Settings</button><span class="m-ob-grow"></span><a class="btn btn--primary m-btn">Run setup for real ${ic('chev-right',16)}</a>`;
    return obStage(2, content, foot);
  }

  /* -------------------------------- Login -------------------------------- */
  // Full-screen public page — NO app shell. Centered narrow card; keeps its own
  // language switcher (globe). Passwordless: Google OAuth or a 6-digit email code.
  function lgLang() {
    return `<button class="m-lg-lang">${ic('globe',15)}<span class="lc">EN</span>${ic('chev-down',13)}</button>`;
  }
  function lgTop() {
    return `<header class="m-lg-top"><span class="m-lg-spacer"></span>${lgLang()}</header>`;
  }
  function lgHeader(title, sub) {
    return `<div class="m-lg-head"><span class="m-lg-mark">${ic('nib',26)}</span><h1 class="m-lg-title">${title}</h1><p class="m-lg-sub">${sub}</p></div>`;
  }
  function lgAlert(text) {
    return text ? `<div class="m-lg-alert" role="alert">${ic('alert',16)}<span>${text}</span></div>` : '';
  }
  function lgConsent() {
    return `<p class="m-lg-consent">By continuing you agree to Pennedly’s <a>Terms</a> and <a>Privacy Policy</a>.</p>`;
  }
  function lgGoogle(busy) {
    return `<button class="btn btn--secondary m-lg-google"${busy?' disabled':''}>`
      + (busy ? `<span class="m-lg-spin"></span>Opening Google…` : `<span class="m-g-tile">G</span>Continue with Google`) + `</button>`;
  }
  // 6-cell OTP. opts: { code (string of digits), error }
  function lgOtp(opts = {}) {
    const code = opts.code || '';
    const cells = Array.from({ length: 6 }).map((_, i) => {
      const d = code[i] || '';
      return `<input class="m-lg-otpcell${d?' is-filled':''}" inputmode="numeric" maxlength="1" value="${d}" aria-label="Digit ${i+1}"/>`;
    }).join('');
    return `<div class="m-lg-otp${opts.error?' is-error':''}">${cells}</div>`;
  }

  // assemble a login screen body (rawBody). opts.devOpen shows the dev drawer open.
  function lgScreen(cardContent, opts = {}) {
    return phone({ top: lgTop(), tabs:false, rawBody:true, dark:opts.dark, variant:opts.variant,
      body: `<div class="m-lg"><div class="m-lg-scroll"><div class="m-lg-card">${cardContent}</div></div>`
        + `<div class="m-lg-devrow">${lgDevDrawer(opts.devOpen)}</div></div>` });
  }

  // resting email form (+ error variants via opts.error)
  function lgEmail(opts = {}) {
    const content = lgHeader('Sign in to Pennedly', 'No password, ever. Your first sign-in creates your account.')
      + lgGoogle(false)
      + `<div class="m-lg-or"><span>or</span></div>`
      + `<form class="m-lg-form"><label class="m-lg-fld"><span class="lbl">Email</span>`
      + `<input class="m-lg-input${opts.error?' has-error':''}" type="email" inputmode="email" placeholder="you@example.com" value="${opts.email||''}"/></label>`
      + lgAlert(opts.error)
      + `<button class="btn btn--primary m-btn m-btn--grow">${ic('mail',17)}Email me a code</button></form>`
      + lgConsent();
    return lgScreen(content, opts);
  }

  // google-error variant
  function lgGoogleError() {
    const content = lgHeader('Sign in to Pennedly', 'No password, ever. Your first sign-in creates your account.')
      + lgGoogle(false)
      + lgAlert('We couldn’t sign you in with Google. Please try again.')
      + `<div class="m-lg-or"><span>or</span></div>`
      + `<form class="m-lg-form"><label class="m-lg-fld"><span class="lbl">Email</span><input class="m-lg-input" type="email" placeholder="you@example.com"/></label>`
      + `<button class="btn btn--primary m-btn m-btn--grow">${ic('mail',17)}Email me a code</button></form>` + lgConsent();
    return lgScreen(content);
  }

  // code-entry form. opts: { code, error, cooldown, busy }
  function lgCode(opts = {}) {
    const resend = opts.cooldown
      ? `Resend in <b>30s</b>` : `<button class="m-lg-resendbtn">Resend code</button>`;
    const content = lgHeader('Enter your code', '')
      + `<p class="m-lg-codeto">We sent a 6-digit code to <b>you@example.com</b>. <button class="m-lg-change">Use a different email</button></p>`
      + lgOtp({ code: opts.code, error: opts.error })
      + lgAlert(opts.error)
      + `<button class="btn btn--primary m-btn m-btn--grow"${opts.busy?' disabled':''}>${opts.busy?'<span class="m-lg-spin"></span>Signing you in…':'Sign in '+ic('chev-right',16)}</button>`
      + `<div class="m-lg-resend">Didn’t get it? ${resend}</div>`;
    return lgScreen(content, opts);
  }

  // signing-in (google handoff / code consume)
  function lgSigning(text) {
    const content = lgHeader('Sign in to Pennedly', '')
      + `<div class="m-lg-signing"><span class="m-lg-ring"></span><span class="m-lg-signtext">${text||'Signing you in…'}</span></div>`;
    return lgScreen(content);
  }

  // collapsed dev drawer (dev builds only)
  function lgDevDrawer(open) {
    const body = open ? `<div class="m-lg-devbody"><div class="m-lg-devgate"><span class="status-pill status-pill--accent"><i class="pill-dot"></i>DEV_LOGIN enabled</span>`
      + `<span class="m-lg-devnote">Email-only dev sign-in — skips the code. Available only when the <code>DEV_LOGIN</code> env flag is set; never in production.</span></div>`
      + `<form class="m-lg-devform"><input class="m-lg-input" type="email" value="dev@pennedly.test"/><button class="btn btn--secondary m-btn">${ic('chev-right',16)}Dev sign in</button></form>`
      + `<div class="m-lg-devfoot">build 2.4.1 · a31f9c2</div></div>` : '';
    return `<div class="m-lg-dev${open?' is-open':''}"><button class="m-lg-devtoggle">${ic('sliders',13)}Developer mode<span class="m-lg-devbadge">dev-only</span>${ic('chev-down',13)}</button>${body}</div>`;
  }

  /* -------------------------------- Landing ------------------------------ */
  // Public marketing page — NO app shell. Its own top bar (brand + language +
  // Sign in). Reflows to a single column on a phone; the product-peek shrinks.
  function landTop(opts = {}) {
    const langs = [['EN','English'],['ES','Español'],['DE','Deutsch'],['FR','Français'],['IT','Italiano'],['PT','Português'],['NL','Nederlands'],['JA','日本語']];
    const menu = opts.langOpen ? `<div class="m-land-langmenu" role="listbox">` + langs.map(([c,l]) =>
      `<button class="m-land-langopt${c==='EN'?' is-on':''}"><span class="lo-label">${l}</span><span class="lo-code">${c}</span>${c==='EN'?ic('check',14):''}</button>`).join('') + `</div>` : '';
    return `<header class="m-land-top"><div class="m-land-brand"><span class="m-land-logo">${ic('nib',16)}</span><span class="bn">Pennedly</span></div>`
      + `<span class="m-land-sp"></span><div class="m-land-topact"><div class="m-land-langwrap"><button class="m-land-lang">${ic('globe',15)}<span>EN</span>${ic('chev-down',13)}</button>${menu}</div>`
      + `<a class="btn btn--primary m-land-signin">Sign in</a></div></header>`;
  }

  function landHero() {
    return `<section class="m-land-hero"><span class="m-land-status"><i></i>In development · invite-only beta</span>`
      + `<h1 class="m-land-h1">Run Threads like a pro, in your own voice.</h1>`
      + `<p class="m-land-lead">Pennedly drafts posts and replies in your voice, audits what’s working, and shows you what’s landing across every account you run.</p>`
      + `<p class="m-land-approve">You approve every word. <span class="emph">Autopilot’s there when you want it.</span></p>`
      + `<div class="m-land-cta"><a class="btn btn--primary m-btn m-btn--grow">Sign in ${ic('chev-right',16)}</a>`
      + `<a class="m-land-contact">${ic('mail',15)}hello@pennedly.com</a></div></section>`;
  }

  // product peek — shrunk for a phone but keeps its essence (browser chrome +
  // account rail + composer drafting in voice with a blinking caret).
  function landWindow() {
    const avatars = [['mara.png',1],['c-theo.png',0],['c-ana.png',0],['c-lucia.png',0]]
      .map((a) => `<span class="m-land-railacct${a[1]?' is-active':''}"><img class="avatar-img" src="${A}${a[0]}" width="26" height="26" alt=""/></span>`).join('');
    return `<div class="m-land-window" aria-hidden="true"><div class="m-land-winbar"><span class="m-land-dots"><i></i><i></i><i></i></span>`
      + `<span class="m-land-url">app.pennedly.com<span class="path">/studio</span></span></div>`
      + `<div class="m-land-winapp"><div class="m-land-rail">${avatars}<span class="m-land-railadd">${ic('plus',14)}</span></div>`
      + `<div class="m-land-compose"><div class="m-land-comphead"><img class="avatar-img" src="${A}mara.png" width="32" height="32" alt=""/>`
      + `<div class="cid"><div class="nm">Mara Lin</div><div class="hd">@mara.lin</div></div><span class="badge badge--neutral"><span class="pill-dot"></span>Draft</span></div>`
      + `<p class="m-land-comptext">The fastest way to find your voice online: publish the thing you’re slightly embarrassed by. The polished version is everyone’s. The embarrassing one is yours.<span class="m-land-caret"></span></p>`
      + `<div class="m-land-compchips"><span class="m-land-chip is-accent">${ic('sparkle',12)}In your voice</span><span class="m-land-chip">${ic('voice',12)}Warm, direct</span></div>`
      + `<div class="m-land-compfoot"><span class="m-land-compnote">${ic('nib',12)}In your voice</span><span class="m-land-compacts"><span class="ghost">${ic('pencil',12)}Edit</span><span class="ink">${ic('check',12)}Approve</span></span></div></div></div></div>`;
  }

  function landBento() {
    const F = [
      ['voice','Viral posts in your voice','Drafts that study how you write, so they sound like you and never like a template.'],
      ['bubble','Replies that sound like you','Keep up with mentions and comments in your own tone, without living in the app.'],
      ['audit','Weekly audits and a coach','A standing read on what’s working, with specific, kind notes on what to try next.'],
      ['chart','Analytics, not noise','Quiet numbers that show which posts earned their place. No vanity dashboards.'],
      ['autopilot','Autopilot, your call','Let Pennedly post on a schedule only when you opt in. Off by default, always.'],
      ['users','Every account, one place','Switch between the handles you run without losing your thread or your tone.'],
    ];
    const tiles = F.map((f) => `<article class="m-land-feat"><div class="m-land-feathd"><span class="m-land-featico">${ic(f[0],18)}</span>`
      + `<h3 class="m-land-featt">${f[1]}</h3></div><p class="m-land-featd">${f[2]}</p></article>`).join('');
    return `<section class="m-land-features"><div class="m-land-feathead"><span class="m-land-eyebrow">The product</span>`
      + `<h2 class="m-land-h2">One workspace for every account you run.</h2></div><div class="m-land-bento">${tiles}</div></section>`;
  }

  function landFooter() {
    return `<footer class="m-land-foot"><span class="m-land-footbrand"><span class="m-land-logo m-land-logo--sm">${ic('nib',12)}</span>© 2026 Pennedly</span>`
      + `<nav class="m-land-footlinks"><a>Privacy Policy</a><a>Terms of Service</a><a>Data Deletion</a></nav></footer>`;
  }

  // full landing page (rawBody under the pinned landing top bar).
  function landPage(opts = {}) {
    return phone({ top: landTop(opts), tabs:false, rawBody:true, dark:opts.dark, variant:opts.variant,
      body: `<div class="m-land">${landHero()}${landWindow()}${landBento()}${landFooter()}</div>` });
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

  function toast(kind = 'success', opts = {}) {
    const host = 'm-toast-host' + (opts.notab ? ' m-toast-host--notab' : '');
    return `<div class="${host}"><div class="m-toast m-toast--${kind}"><span class="toast-mark"></span>`
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
      replies: ['You’re all caught up', 'New comments worth answering will appear here.'],
      mentions: ['No mentions yet', 'When someone @-mentions you on Threads, it’ll show up here. Pennedly checks about once an hour.']
    };
    const m = map[kind] || map.ready;
    const cta = kind==='draft' ? `<button class="btn btn--secondary">${ic('nib',15)}Write something</button>` : '';
    const markIcon = kind==='mentions' ? 'at' : kind==='feed' ? 'feed' : kind==='replies' ? 'bubble' : 'nib';
    return `<div class="m-empty"><div class="m-empty-mark">${ic(markIcon,24)}</div><div class="m-empty-title">${m[0]}</div><div class="m-empty-sub">${m[1]}</div>${cta}</div>`;
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
    ic, statusbar, top, tabs, drawer, phone, comp, col, light, dark,
    composer, stroka, filterbar, studioCard, feedCard, feedBaseline, sortBar, deleteSheet, loadMore,
    commentCard, postSwitcher, replyContext, repliesFilter, publishReplySheet, mentionCard,
    statsPeriods, statsSummary, statsBarChart, statsHours, statsTopPosts, statsBestTimes, statsSpread, statsPanel, statsEmpty, statsSkeleton,
    auditHeader, auditChange, auditRow, auditEmpty, auditSkeleton,
    patternsIntro, patternCard, patternsEmpty, patternsSkeleton,
    exploreInput, exploreAnalyzing, exploreResultsHead, exploreMeta, exploreCard, exploreEmpty, exploreSkeleton,
    apIntro, apAutoPost, apAutoReply, apReassure, apSkeleton,
    apMaster, apConfirmSheet, apSchedule, apPolicy, apActivity, apEmptyActivity, apFooter,
    srSectionHead, srCatGroup, srRuleRow, srCustomRow, srAddRule, srDemo, srSkeleton,
    setIdentity, setLanguage, setAccountRow, setAccounts, setAppearance, setDanger,
    disconnectSheet, deleteAccountSheet, setSkeleton,
    obTopBar, obConnect, obChoose, obAnalyze, obScratch, obDone, obPreview,
    lgEmail, lgCode, lgSigning, lgGoogleError, lgOtp, lgDevDrawer,
    landTop, landHero, landWindow, landBento, landFooter, landPage, menu,
    moreSheet, accountSheet, dialogSheet, toast, firstRun, empty, errorBanner, skeletonCard
  };
})();
