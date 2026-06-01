// mentions-parts.jsx — shell + components for the read-only Mentions screen.
// Reuses Studio shell classes (studio.css) + ds tokens. No hardcoded hex.

function MMono({ text, size = 34, font = 13 }) {
  return <span className="mono" style={{ width: size, height: size, fontSize: font }}>{text}</span>;
}

/* highlight @handles in accent ink-blue */
function highlight(text) {
  return text.split(/(@[\w.]+)/g).map((part, i) =>
    /^@[\w.]+$/.test(part) ? <span key={i} className="at-mention">{part}</span> : part
  );
}

/* ------------------------------- Sidebar ------------------------------- */
function Sidebar({ newCount }) {
  const nav = [
    { id: "studio", label: "Studio", Icon: window.IcStudio, badge: 4 },
    { id: "feed", label: "My Feed", Icon: window.IcFeed },
    { id: "replies", label: "Replies", Icon: window.IcReplies, badge: 3 },
    { id: "mentions", label: "Mentions", Icon: window.IcAt, active: true, badge: newCount || null },
    { id: "voice", label: "Voice", Icon: window.IcVoice },
    { id: "settings", label: "Settings", Icon: window.IcSettings },
  ];
  return (
    <aside className="sidebar">
      <div className="brand">
        <window.Logo size={34} radius={10} className="brand-mark" />
        <div>
          <div className="brand-name">Pennedly</div>
          <div className="brand-sub">Drafting partner</div>
        </div>
      </div>
      <nav className="nav">
        <div className="nav-cap">Workspace</div>
        {nav.map(({ id, label, Icon, active, badge }) => (
          <a key={id} className={`nav-item ${active ? "nav-item--active" : ""}`} tabIndex="0">
            <Icon size={16} />
            <span className="nav-label">{label}</span>
            {badge ? <span className="nav-badge">{badge}</span> : null}
          </a>
        ))}
      </nav>
      <div className="sidebar-foot">
        <button className="account">
          <MMono text={window.MENTION_USER.initials} size={32} font={12} />
          <div className="who">
            <div className="nm">{window.MENTION_USER.name}</div>
            <div className="hd">{window.MENTION_USER.handle}</div>
          </div>
          <window.IcChevDown size={15} className="chev" />
        </button>
      </div>
    </aside>
  );
}

/* -------------------------------- Topbar ------------------------------- */
function Topbar({ dark, onToggleTheme, newCount }) {
  return (
    <header className="topbar">
      <span className="topbar-title">Mentions</span>
      {newCount > 0 && <span className="topbar-pill"><span className="pdot" />{newCount} new</span>}
      <span className="topbar-spacer" />
      <div className="topbar-actions">
        <button className="icon-btn" aria-label="Toggle theme" onClick={onToggleTheme}>
          {dark ? <window.IcSun size={17} /> : <window.IcMoon size={16} />}
        </button>
        <button className="icon-btn" aria-label="Settings"><window.IcSettings size={17} /></button>
      </div>
    </header>
  );
}

/* ---------------------------- Status filter ---------------------------- */
function StatusFilter({ filters, active, onChange }) {
  return (
    <div className="filterbar" role="tablist" aria-label="Mention status">
      {filters.map((f) => (
        <button key={f.key} role="tab" aria-selected={active === f.key}
          className={`filter ${active === f.key ? "filter--active" : ""}`}
          onClick={() => onChange(f.key)}>
          <span className={`fdot dot-${f.key}`} />
          <span className="flabel">{f.label}</span>
          <span className="fcount">{f.count}</span>
        </button>
      ))}
    </div>
  );
}

/* ----------------------------- Mention card ---------------------------- */
function MentionCard({ m, leaving, onSave, onArchive, onRestore, onOpen }) {
  const isNew = m.status === "new";
  const isSaved = m.status === "saved";
  const isArchived = m.status === "archived";
  const cls = ["ment-card", isNew ? "ment-card--new" : "", isArchived ? "ment-card--archived" : "", leaving ? "ment-card--leaving" : ""].join(" ");
  return (
    <article className={cls}>
      <div className="ment-head">
        <MMono text={m.author.initials} size={34} font={12} />
        <div className="ment-id">
          <div className="ment-name">
            <span className="nm">{m.author.name}</span>
          </div>
          <div className="ment-sub">
            <span>{m.author.handle}</span><span>·</span>
            <span className="foll">{m.author.followers} followers</span><span>·</span>
            <span>{m.time}</span>
          </div>
        </div>
        {isNew && <span className="ment-new-badge"><span className="nd" />New</span>}
      </div>

      <p className="ment-text">{highlight(m.text)}</p>

      <div className="ment-foot">
        <div className="ment-meta">
          <span className="mm"><window.IcHeart size={13} className="mm-ico" />{m.likes.toLocaleString("en-US")}</span>
          <span className="mm"><window.IcBubble size={13} className="mm-ico" />{m.replies}</span>
        </div>
        <div className="ment-actions">
          {isArchived ? (
            <button className="btn btn--ghost btn--sm" onClick={() => onRestore(m.id)}><window.IcUndo size={15} /> Unarchive</button>
          ) : (
            <>
              <button className={`ment-iconbtn ${isSaved ? "ment-iconbtn--on" : ""}`} aria-label={isSaved ? "Unsave" : "Save"} aria-pressed={isSaved} onClick={() => onSave(m.id)}>
                <window.IcStar size={16} />
              </button>
              <button className="ment-iconbtn" aria-label="Archive" onClick={() => onArchive(m.id)}>
                <window.IcArchive size={16} />
              </button>
            </>
          )}
          <a className="btn btn--secondary btn--sm" href="https://www.threads.net" target="_blank" rel="noopener noreferrer" onClick={() => onOpen(m.id)}>
            <window.IcExternal size={15} /> Open on Threads
          </a>
        </div>
      </div>
    </article>
  );
}

/* ----------------------------- Empty states ---------------------------- */
const EMPTY = {
  all: { title: "No mentions yet", sub: "When someone @-mentions you on Threads, it'll appear here so you can keep an eye on the conversation." },
  new: { title: "You're all caught up", sub: "No new mentions right now — everything's been seen." },
  saved: { title: "Nothing saved", sub: "Star a mention to keep it here for later." },
  archived: { title: "Nothing archived", sub: "Mentions you archive — spam, noise, the irrelevant — collect here." },
};
function EmptyState({ status }) {
  const e = EMPTY[status] || EMPTY.all;
  return (
    <div className="empty">
      <div className="empty-mark"><window.IcAt size={24} /></div>
      <div className="empty-title">{e.title}</div>
      <div className="empty-sub">{e.sub}</div>
    </div>
  );
}

/* ---------------------------- Skeleton card ---------------------------- */
function SkeletonCard() {
  return (
    <div className="ment-card skeleton" aria-hidden="true">
      <div className="ment-head">
        <div className="skel-line" style={{ width: 34, height: 34, borderRadius: 999 }} />
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

/* -------------------------------- Toasts ------------------------------- */
function Toasts({ toasts, onUndo }) {
  return (
    <div className="toast-host">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.kind === "error" ? "error" : "success"}`}>
          <span className="toast-mark" />
          <div className="toast-body">
            <div className="toast-title">{t.title}</div>
            {t.sub && <div className="toast-sub">{t.sub}</div>}
          </div>
          {t.undo && <button className="toast-undo" onClick={() => onUndo(t)}>Undo</button>}
        </div>
      ))}
    </div>
  );
}

Object.assign(window, { MMono, Sidebar, Topbar, StatusFilter, MentionCard, EmptyState, SkeletonCard, Toasts });
