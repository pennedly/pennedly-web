// mentions-parts.jsx — components for the read-only Mentions screen.
// Sidebar/account/avatar come from the shared shell. No hardcoded hex.

const { useState: useMnS } = React;

/* highlight @handles in accent ink-blue */
function highlight(text) {
  return text.split(/(@[\w.]+)/g).map((part, i) =>
    /^@[\w.]+$/.test(part) ? <span key={i} className="at-mention">{part}</span> : part
  );
}

/* -------------------------------- Topbar ------------------------------- */
function Topbar({ dark, onToggleTheme }) {
  return (
    <header className="topbar">
      <div className="topbar-inner topbar--wide">
        <span className="topbar-title">Mentions</span>
        <span className="status-pill"><window.IcClock size={13} />Updated hourly</span>
        <span className="topbar-spacer" />
        <div className="topbar-actions">
          <button className="icon-btn" aria-label="Toggle theme" onClick={onToggleTheme}>
            {dark ? <window.IcSun size={17} /> : <window.IcMoon size={16} />}
          </button>
          <button className="icon-btn" aria-label="Settings"><window.IcSettings size={17} /></button>
        </div>
      </div>
    </header>
  );
}

/* ----------------------------- Mention card ---------------------------- */
// Read-only: who mentioned you, what they said (+ translate), and a link out.
function MentionCard({ m }) {
  const [translated, setTranslated] = useMnS(false);
  const showText = m.lang && translated ? m.translated : m.text;
  return (
    <article className="ment-card">
      <div className="ment-head">
        <window.Avatar src={m.author.avatar} initials={m.author.initials} size={40} />
        <div className="ment-id">
          <div className="ment-name">{m.author.name}</div>
          <div className="ment-sub">
            <span>{m.author.handle}</span>
            <span className="sep">·</span>
            <span title={m.at}>{window.fmtDateTime(m.at)}</span>
          </div>
        </div>
        <a className="ment-open-ico" href="https://www.threads.net" target="_blank" rel="noopener noreferrer" aria-label="Open on Threads" title="Open on Threads">
          <window.IcExternal size={16} />
        </a>
      </div>

      <p className="ment-text">{highlight(showText)}</p>

      <div className="ment-foot">
        {m.lang ? (
          <div className="translate-row">
            {translated ? (
              <>
                <span className="translate-note"><window.IcGlobe size={13} />Translated from {m.lang}</span>
                <button className="translate-btn" onClick={() => setTranslated(false)}>Show original</button>
              </>
            ) : (
              <button className="translate-btn" onClick={() => setTranslated(true)}><window.IcGlobe size={13} />Translate from {m.lang}</button>
            )}
          </div>
        ) : <span className="ment-foot-spacer" />}
        <a className="btn btn--secondary btn--sm" href="https://www.threads.net" target="_blank" rel="noopener noreferrer">
          <window.IcExternal size={15} /> Open in Threads
        </a>
      </div>
    </article>
  );
}

/* ------------------------------ Empty state ---------------------------- */
function EmptyState() {
  return (
    <div className="empty">
      <div className="empty-mark"><window.IcAt size={24} /></div>
      <div className="empty-title">No mentions yet</div>
      <div className="empty-sub">When someone @-mentions you on Threads, it'll show up here. Pennedly checks for new mentions about once an hour.</div>
    </div>
  );
}

/* ---------------------------- Skeleton card ---------------------------- */
function SkeletonCard() {
  return (
    <div className="ment-card skeleton" aria-hidden="true">
      <div className="ment-head">
        <div className="skel-line" style={{ width: 40, height: 40, borderRadius: 999 }} />
        <div style={{ flex: 1 }}>
          <div className="skel-line" style={{ width: 150, marginBottom: 6 }} />
          <div className="skel-line" style={{ width: 90, height: 9 }} />
        </div>
      </div>
      <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 9 }}>
        <div className="skel-line" style={{ width: "95%" }} />
        <div className="skel-line" style={{ width: "64%" }} />
      </div>
    </div>
  );
}

Object.assign(window, { highlight, Topbar, MentionCard, EmptyState, SkeletonCard });
