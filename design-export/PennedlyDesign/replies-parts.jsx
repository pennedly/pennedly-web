// replies-parts.jsx — shell + shared building blocks for the Reply queue.
// Reuses Studio shell classes (studio.css) + ds tokens. No hardcoded hex.

const { useEffect: useRE } = React;

function Mono({ text, size = 34, font = 13 }) {
  return <span className="mono" style={{ width: size, height: size, fontSize: font }}>{text}</span>;
}

/* ------------------------------- Sidebar ------------------------------- */
function Sidebar({ needsCount }) {
  const nav = [
    { id: "studio", label: "Studio", Icon: window.IcStudio, badge: 4 },
    { id: "feed", label: "My Feed", Icon: window.IcFeed },
    { id: "replies", label: "Replies", Icon: window.IcReplies, active: true, badge: needsCount || null },
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
          <Mono text={window.REPLY_USER.initials} size={32} font={12} />
          <div className="who">
            <div className="nm">{window.REPLY_USER.name}</div>
            <div className="hd">{window.REPLY_USER.handle}</div>
          </div>
          <window.IcChevDown size={15} className="chev" />
        </button>
      </div>
    </aside>
  );
}

/* -------------------------------- Topbar ------------------------------- */
function Topbar({ dark, onToggleTheme, needsCount }) {
  return (
    <header className="topbar">
      <span className="topbar-title">Replies</span>
      <span className="topbar-pill"><span className="pdot" />{needsCount} need a reply</span>
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
    <div className="filterbar" role="tablist" aria-label="Comment status">
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

/* ---------------------------- Post filter pills ------------------------ */
function PostPills({ posts, counts, active, onChange, total }) {
  return (
    <div className="post-pills">
      <button className={`post-pill ${active === "all" ? "post-pill--active" : ""}`} onClick={() => onChange("all")}>
        <span className="pp-label">All posts</span>
        <span className="pp-count">{total}</span>
      </button>
      {posts.map((p) => (
        <button key={p.id} className={`post-pill ${active === p.id ? "post-pill--active" : ""}`} onClick={() => onChange(p.id)} title={p.text}>
          <span className="pp-label">{p.text}</span>
          <span className="pp-count">{counts[p.id] || 0}</span>
        </button>
      ))}
    </div>
  );
}

/* ----------------------------- Empty states ---------------------------- */
const EMPTY = {
  all: { title: "Your queue is empty", sub: "When people comment on your posts, they'll show up here ready for a reply in your voice." },
  needs: { title: "You're all caught up", sub: "No comments are waiting on a reply. Nicely done — go make something new in the Studio." },
  drafts: { title: "No drafts in progress", sub: "Generate a reply on a comment and it'll wait here until you approve and publish it." },
  replied: { title: "Nothing published yet", sub: "Replies you publish will appear here, threaded under their comment." },
  skipped: { title: "Nothing skipped", sub: "Comments you pass on — spam, noise, the unanswerable — land here." },
};
function EmptyState({ status }) {
  const e = EMPTY[status] || EMPTY.all;
  return (
    <div className="empty">
      <div className="empty-mark"><window.IcReplies size={24} /></div>
      <div className="empty-title">{e.title}</div>
      <div className="empty-sub">{e.sub}</div>
    </div>
  );
}

/* ---------------------------- Skeleton card ---------------------------- */
function SkeletonCard() {
  return (
    <div className="cmt-card skeleton" aria-hidden="true">
      <div className="skel-line" style={{ width: "62%", height: 30, borderRadius: 10 }} />
      <div className="draft-head" style={{ marginTop: 14 }}>
        <div className="skel-line" style={{ width: 34, height: 34, borderRadius: 999 }} />
        <div style={{ flex: 1 }}>
          <div className="skel-line" style={{ width: 130, marginBottom: 6 }} />
          <div className="skel-line" style={{ width: 80, height: 9 }} />
        </div>
        <div className="skel-line" style={{ width: 64, height: 22, borderRadius: 999 }} />
      </div>
      <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 9 }}>
        <div className="skel-line" style={{ width: "90%" }} />
        <div className="skel-line" style={{ width: "55%" }} />
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

Object.assign(window, { Mono, Sidebar, Topbar, StatusFilter, PostPills, EmptyState, SkeletonCard, Toasts });
