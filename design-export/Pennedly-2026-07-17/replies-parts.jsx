// replies-parts.jsx — building blocks for the Reply queue (master-detail).
// Sidebar/account/avatar come from the shared shell. No hardcoded hex.

const { useEffect: useRE } = React;

/* -------------------------------- Topbar ------------------------------- */
function Topbar({ dark, onToggleTheme, needsCount }) {
  return (
    <header className="topbar">
      <div className="topbar-inner topbar--wide">
        <span className="topbar-title">Replies</span>
        {needsCount > 0
          ? <span className="status-pill status-pill--accent"><span className="pill-dot" />{needsCount} need a reply</span>
          : <span className="status-pill status-pill--success"><span className="pill-dot" />All caught up</span>}
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

/* --------------------- Detail context header ("replying under") -------- */
function PostContext({ post }) {
  return (
    <div className="rq-context">
      <div className="rq-context-cap">Replying under your post</div>
      <p className="rq-context-text">{post.text}</p>
      <div className="rq-context-foot">
        <span className="rq-context-time">{window.fmtDateTime(post.at)}</span>
        <a className="rq-context-link" href="https://www.threads.net" target="_blank" rel="noopener noreferrer"><window.IcExternal size={14} /> Open in Threads</a>
      </div>
    </div>
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
// (PostPills removed — the master list now drives post selection.)

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

/* ----------------------------- Publish dialog -------------------------- */
function PublishReplyDialog({ comment, onCancel, onConfirm }) {
  useRE(() => {
    const h = (e) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onCancel]);
  return (
    <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="dialog" role="dialog" aria-modal="true" aria-label="Publish reply">
        <div className="dialog-head">
          <span className="dialog-mark"><window.IcReply size={18} /></span>
          <div>
            <div className="dialog-title">Publish this reply?</div>
            <div className="dialog-sub">It posts publicly on Threads, threaded under {comment.author.name}’s comment.</div>
          </div>
        </div>
        <div className="pub-ctx"><span className="pub-ctx-bar" /><span className="pub-ctx-txt">{comment.text}</span></div>
        <div className="pub-preview">{comment.reply}</div>
        <div className="dialog-actions">
          <button className="btn btn--ghost" onClick={onCancel}>Cancel</button>
          <button className="btn btn--primary" onClick={onConfirm}><window.IcReply size={16} /> Publish reply</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Topbar, PostContext, StatusFilter, EmptyState, SkeletonCard, Toasts, PublishReplyDialog });
