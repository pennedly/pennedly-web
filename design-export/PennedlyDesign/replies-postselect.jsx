// replies-postselect.jsx — the MASTER pane of the master-detail layout: a
// vertical list of the user's posts that have comments (newest first). Each row
// shows the post text, its date·time (local), the comment count, and an
// unanswered-count badge. Selecting a post drives the detail pane.

function PostMaster({ posts, selected, onSelect }) {
  return (
    <aside className="rq-master">
      <div className="rq-master-cap">Posts with comments</div>
      <div className="rq-post-list" role="listbox" aria-label="Posts with comments">
        {posts.map((p) => (
          <button
            key={p.id}
            role="option"
            aria-selected={selected === p.id}
            className={`rq-post ${selected === p.id ? "rq-post--active" : ""}`}
            onClick={() => onSelect(p.id)}
          >
            <span className="rq-post-text">{p.text}</span>
            <span className="rq-post-meta">
              <span className="rq-post-time">{window.fmtDateTime(p.at)}</span>
              <span className="rq-post-sep">·</span>
              <span className="rq-post-count">{p.total} comment{p.total === 1 ? "" : "s"}</span>
              {p.unanswered > 0 && <span className="rq-post-badge">{p.unanswered} to answer</span>}
            </span>
          </button>
        ))}
      </div>
    </aside>
  );
}

Object.assign(window, { PostMaster });
