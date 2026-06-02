// feed-card.jsx — the published-post card for My Feed.
// PostCard + ViralityBadge + MetricRow + TrendChart (baseline-aware) + more-menu.

const { useState: useCS, useEffect: useCE, useRef: useCR } = React;

/* --------------------------- Virality badge --------------------------- */
function ViralityBadge({ ratio, settling }) {
  if (settling)
    return <span className="vbadge vbadge--settling"><window.IcClock size={12} className="v-ico" />Still settling</span>;
  if (ratio >= 1.5)
    return <span className="vbadge vbadge--over"><window.IcArrowUp size={12} className="v-ico" />{ratio.toFixed(1)}× average</span>;
  if (ratio >= 0.85)
    return <span className="vbadge">On par</span>;
  return <span className="vbadge">{ratio.toFixed(1)}× average</span>;
}

/* ------------------------------ Metric row ---------------------------- */
function MetricRow({ m }) {
  return (
    <div className="metrics">
      <div className="metric metric--hero">
        <window.IcEye size={18} className="m-ico" />
        <span className="m-num">{window.fmt(m.views)}</span>
        <span className="m-lbl">views</span>
      </div>
      <div className="metric metric--sub"><window.IcHeart size={15} className="m-ico" /><span className="m-num">{window.fmt(m.likes)}</span></div>
      <div className="metric metric--sub"><window.IcBubble size={15} className="m-ico" /><span className="m-num">{window.fmt(m.comments)}</span></div>
      <div className="metric metric--sub"><window.IcRepost size={15} className="m-ico" /><span className="m-num">{window.fmt(m.reposts)}</span></div>
    </div>
  );
}

/* ----------------------------- Trend chart ---------------------------- */
// Cumulative views over time, drawn against a dashed "your average" line so
// every post reads relative to the baseline at the top of the screen.
function TrendChart({ points, baseline }) {
  const W = 600, H = 112, L = 8, R = 592, TOP = 12, BOT = 92;
  const max = Math.max(...points, baseline) * 1.1;
  const plotH = BOT - TOP;
  const x = (i) => L + (i / (points.length - 1)) * (R - L);
  const y = (v) => BOT - (v / max) * plotH;
  const line = points.map((v, i) => (i ? "L" : "M") + x(i).toFixed(1) + " " + y(v).toFixed(1)).join(" ");
  const area = line + ` L ${R} ${BOT} L ${L} ${BOT} Z`;
  const byY = y(baseline);
  const last = [x(points.length - 1), y(points[points.length - 1])];
  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Views over time vs your average">
        <path d={area} fill="var(--color-accent)" fillOpacity="0.10" />
        {/* baseline reference */}
        <line x1={L} y1={byY} x2={R} y2={byY} stroke="var(--color-text-subtle)" strokeWidth="1" strokeDasharray="4 4" opacity="0.75" />
        <text x={R} y={byY - 6} textAnchor="end" fontSize="11" fill="var(--color-text-subtle)" style={{ fontFamily: "var(--font-sans)" }}>your average</text>
        {/* the post's curve */}
        <path d={line} fill="none" stroke="var(--color-accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={last[0]} cy={last[1]} r="3.6" fill="var(--color-accent)" stroke="var(--color-surface)" strokeWidth="2" />
      </svg>
    </div>
  );
}

/* ------------------------------ Post card ----------------------------- */
function PostCard({ post, baseline, expanded, leaving, onToggleTrend, onToggleReplies, onDelete }) {
  const [menu, setMenu] = useCS(false);
  const [menuMode, setMenuMode] = useCS("root");
  const [lang, setLang] = useCS(null);
  const anchorRef = useCR(null);
  useCE(() => {
    if (!menu) return;
    const close = (e) => { if (anchorRef.current && !anchorRef.current.contains(e.target)) { setMenu(false); setMenuMode("root"); } };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menu]);

  const ratio = post.metrics.views / baseline.views;
  const isReply = post.kind === "reply";
  const origLang = post.lang || "en";
  const translatedLang = lang ? window.UI_LANGS.find((l) => l.code === lang) : null;
  const bodyText = translatedLang ? (post.tr && post.tr[lang]) || post.text : post.text;
  function pickLang(code) { setMenu(false); setMenuMode("root"); setLang(code === origLang ? null : code); }

  return (
    <article className={`feed-card ${leaving ? "feed-card--leaving" : ""}`}>
      <div className="draft-head">
        <window.Avatar src={window.FEED_USER.avatar} initials={window.FEED_USER.initials} size={38} />
        <div className="draft-id">
          <div className="draft-name">{window.FEED_USER.name}</div>
          <div className="draft-sub">
            <span>{window.FEED_USER.handle}</span>
            {isReply && <><span className="sep">·</span><span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><window.IcReply size={12} />replied to {post.replyTo.who}</span></>}
            <span className="sep">·</span><span title={post.time}>{window.fmtDateTime(post.at)}</span>
          </div>
        </div>
        <ViralityBadge ratio={ratio} settling={post.settling} />
      </div>

      {isReply && (
        <div className="reply-ctx">
          <div className="rc-bar" />
          <div className="rc-body">
            <div className="rc-who">{post.replyTo.who}</div>
            <div className="rc-txt">{post.replyTo.text}</div>
          </div>
        </div>
      )}

      <p className="draft-body">{bodyText}</p>
      {translatedLang && (
        <div className="translate-bar">
          <window.IcGlobe size={13} className="tb-ico" />
          <span>Translated to {translatedLang.native}</span>
          <span className="tb-dot">·</span>
          <button className="tb-orig" onClick={() => setLang(null)}>Show original</button>
        </div>
      )}

      <MetricRow m={post.metrics} />

      {expanded && (
        <div className="trend-panel">
          <div className="trend-cap">
            <span className="tc-t">Views over {post.span}</span>
            <span className="tc-s">{post.peak}</span>
          </div>
          <TrendChart points={post.trend} baseline={baseline.views} />
          <div className="chart-axis"><span>Posted</span><span>Now</span></div>
        </div>
      )}

      <div className="feed-foot">
        <button className={`ar-pill ${post.autoReplies ? "ar-pill--on" : ""}`} onClick={() => onToggleReplies(post.id)} aria-pressed={post.autoReplies}>
          {post.autoReplies ? <window.IcReply size={14} className="ar-ico" /> : <span className="ar-dot" />}
          Auto-replies {post.autoReplies ? "on" : "off"}
        </button>

        <div className="feed-actions">
          <button className="btn btn--ghost btn--sm" onClick={() => onToggleTrend(post.id)} aria-expanded={expanded}>
            <window.IcChart size={15} /> Growth
            <window.IcChevDown size={14} style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform var(--duration-base) var(--ease-standard)" }} />
          </button>
          <a className="btn btn--primary btn--sm" href="https://www.threads.net" target="_blank" rel="noopener noreferrer">
            <window.IcExternal size={15} /> Open on Threads
          </a>
          <div className="menu-anchor" ref={anchorRef}>
            <button className="icon-btn" style={{ width: 34, height: 34 }} aria-label="More actions" aria-haspopup="menu" aria-expanded={menu} onClick={() => { setMenu((v) => !v); setMenuMode("root"); }}>
              <window.IcMore size={17} />
            </button>
            {menu && (
              <div className="menu" role="menu">
                {menuMode === "root" ? (
                  <>
                    {translatedLang && (
                      <button className="menu-item" role="menuitem" onClick={() => { setMenu(false); setLang(null); }}>
                        <window.IcUndo size={15} className="mi-ico" /> Show original
                      </button>
                    )}
                    <button className="menu-item" role="menuitem" onClick={() => setMenuMode("translate")}>
                      <window.IcGlobe size={15} className="mi-ico" /> Translate
                      <window.IcChevDown size={13} className="mi-caret" />
                    </button>
                    <a className="menu-item" role="menuitem" href="https://www.threads.net" target="_blank" rel="noopener noreferrer" onClick={() => setMenu(false)}>
                      <window.IcExternal size={15} className="mi-ico" /> Open on Threads
                    </a>
                    <div className="menu-sep" />
                    <button className="menu-item menu-item--danger" role="menuitem" onClick={() => { setMenu(false); onDelete(post); }}>
                      <window.IcTrash size={15} className="mi-ico" /> Delete post
                    </button>
                  </>
                ) : (
                  <>
                    <button className="menu-back" onClick={() => setMenuMode("root")}><window.IcArrowLeft size={14} /> Translate to</button>
                    {window.UI_LANGS.map((l) => {
                      const isOrig = l.code === origLang;
                      const on = lang ? lang === l.code : isOrig;
                      return (
                        <button key={l.code} className={`menu-item ${on ? "menu-item--on" : ""}`} role="menuitemradio" aria-checked={on} onClick={() => pickLang(l.code)}>
                          <span className="mi-lang"><span className="mi-lname">{l.label}</span><span className="mi-native">{isOrig ? "Original" : l.native}</span></span>
                          {on && <window.IcCheck size={14} className="mi-check" />}
                        </button>
                      );
                    })}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

Object.assign(window, { ViralityBadge, MetricRow, TrendChart, PostCard });
