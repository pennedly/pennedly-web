// patterns-parts.jsx — shell + states + pattern card for the Pattern study.
// Reuses Studio shell classes (studio.css) + ds tokens. No hardcoded hex.

function PMono({ text, size = 32, font = 12 }) {
  return <span className="mono" style={{ width: size, height: size, fontSize: font }}>{text}</span>;
}

/* ------------------------------- Sidebar ------------------------------- */
function Sidebar() {
  const nav = [
    { id: "studio", label: "Studio", Icon: window.IcStudio, badge: 4 },
    { id: "feed", label: "My Feed", Icon: window.IcFeed },
    { id: "stats", label: "Stats", Icon: window.IcChart },
    { id: "patterns", label: "Patterns", Icon: window.IcStudy, active: true },
    { id: "audits", label: "Audits", Icon: window.IcAudit, badge: 1 },
    { id: "replies", label: "Replies", Icon: window.IcReplies, badge: 3 },
    { id: "settings", label: "Settings", Icon: window.IcSettings },
  ];
  return (
    <aside className="sidebar">
      <div className="brand">
        <window.Logo size={34} radius={10} className="brand-mark" />
        <div><div className="brand-name">Pennedly</div><div className="brand-sub">Drafting partner</div></div>
      </div>
      <nav className="nav">
        <div className="nav-cap">Workspace</div>
        {nav.map(({ id, label, Icon, active, badge }) => (
          <a key={id} className={`nav-item ${active ? "nav-item--active" : ""}`} tabIndex="0">
            <Icon size={16} /><span className="nav-label">{label}</span>
            {badge ? <span className="nav-badge">{badge}</span> : null}
          </a>
        ))}
      </nav>
      <div className="sidebar-foot">
        <button className="account">
          <PMono text={window.PATTERN_USER.initials} size={32} font={12} />
          <div className="who"><div className="nm">{window.PATTERN_USER.name}</div><div className="hd">{window.PATTERN_USER.handle}</div></div>
          <window.IcChevDown size={15} className="chev" />
        </button>
      </div>
    </aside>
  );
}

/* -------------------------------- Topbar ------------------------------- */
function Topbar({ dark, onToggleTheme, lastRun }) {
  return (
    <header className="topbar">
      <span className="topbar-title">Pattern study</span>
      {lastRun && <span className="topbar-pill"><span className="pdot" />Studied {lastRun}</span>}
      <span className="topbar-spacer" />
      <div className="topbar-actions">
        <button className="icon-btn" aria-label="Toggle theme" onClick={onToggleTheme}>{dark ? <window.IcSun size={17} /> : <window.IcMoon size={16} />}</button>
        <button className="icon-btn" aria-label="Settings"><window.IcSettings size={17} /></button>
      </div>
    </header>
  );
}

/* ------------------------------ Idle view ------------------------------ */
const LOOKS_FOR = ["Hooks & openings", "Post length", "Topics", "Timing", "Format & structure", "Questions vs statements"];
function IdleView({ onRun, postsAnalyzed }) {
  return (
    <div className="idle-hero">
      <span className="idle-mark"><window.IcStudy size={28} /></span>
      <h2>Find what's working</h2>
      <p>A study reads back through your posts and surfaces the patterns that actually move engagement — each one backed by your own numbers and examples.</p>
      <button className="btn btn--primary btn--lg idle-run" onClick={onRun}><window.IcStudy size={18} /> Run a study</button>
      <div className="idle-scope"><span>{postsAnalyzed} posts ready to analyze</span><span className="dot" /><span>about 30 seconds</span></div>
      <div className="idle-kinds">
        {LOOKS_FOR.map((k) => <span className="idle-kind" key={k}>{k}</span>)}
      </div>
    </div>
  );
}

/* ---------------------------- Running view ----------------------------- */
const RUN_STEPS = ["Reading your last 47 posts", "Grouping by hook, length & topic", "Testing each pattern against the numbers", "Ranking by strength of evidence"];
function RunningView({ step }) {
  return (
    <div className="running-card">
      <span className="running-nib"><window.IcNib size={40} /></span>
      <div className="running-title">Studying your posts…</div>
      <div className="running-sub">Looking for what reliably moves the needle.</div>
      <div className="run-steps">
        {RUN_STEPS.map((s, i) => {
          const state = i < step ? "done" : i === step ? "active" : "";
          return (
            <div className={`run-step run-step--${state}`} key={i}>
              <span className="run-tick">
                {i < step ? <window.IcCheck size={12} /> : i === step ? <span className="run-spin" /> : <span style={{ width: 6, height: 6, borderRadius: 99, background: "currentColor", opacity: 0.5 }} />}
              </span>
              {s}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------ Empty view ----------------------------- */
function EmptyView({ have = 6, need = 15 }) {
  return (
    <div className="study-empty">
      <div className="se-mark"><window.IcStudy size={26} /></div>
      <div className="se-title">Not enough posts to study yet</div>
      <div className="se-sub">A study needs at least {need} published posts to find patterns it can stand behind. Keep writing in the Studio — you're getting there.</div>
      <div className="se-progress">
        <div className="se-bar"><i style={{ width: `${Math.round((have / need) * 100)}%` }} /></div>
        <div className="se-count">{have} of {need} posts</div>
      </div>
    </div>
  );
}

/* ----------------------------- Pattern card ---------------------------- */
function fmtNum(n) {
  if (n >= 10000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toLocaleString("en-US");
}
function PatternCard({ p }) {
  const max = Math.max(p.evidence.lead.value, p.evidence.base.value);
  return (
    <article className="pattern-card">
      <div className="pc-head">
        <span className="kind-tag">{p.kind}</span>
        <span className="spacer" />
        <span className={`strength strength--${p.strength}`}>
          <span className="st-dot" />{p.strength === "strong" ? "Strong signal" : "Worth testing"} · {p.sample} posts
        </span>
      </div>

      <div className="pc-finding">
        <span className="pc-stat">{p.stat}</span>
        <span className="pc-headline">{p.headline}</span>
      </div>

      <div className="pc-evidence">
        <div className="ev-cap">The evidence</div>
        <div className="ev-bars">
          <div className="ev-row">
            <span className="ev-label">{p.evidence.lead.label}</span>
            <span className="ev-track"><span className="ev-fill ev-fill--lead" style={{ width: `${(p.evidence.lead.value / max) * 100}%` }} /></span>
            <span className="ev-val">{p.evidence.lead.display}</span>
          </div>
          <div className="ev-row ev-row--base">
            <span className="ev-label">{p.evidence.base.label}</span>
            <span className="ev-track"><span className="ev-fill ev-fill--base" style={{ width: `${(p.evidence.base.value / max) * 100}%` }} /></span>
            <span className="ev-val">{p.evidence.base.display}</span>
          </div>
        </div>
        <div className="ev-note">{p.note}</div>
      </div>

      <div className="examples">
        <div className="ex-cap">From your posts</div>
        {p.examples.map((ex, i) => (
          <div className="ex-inset" key={i}>
            <span className="ex-bar" />
            <span className="ex-text">{ex.text}</span>
            <span className="ex-metric">{ex.metric}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

Object.assign(window, { PMono, Sidebar, Topbar, IdleView, RunningView, RUN_STEPS, EmptyView, PatternCard });
