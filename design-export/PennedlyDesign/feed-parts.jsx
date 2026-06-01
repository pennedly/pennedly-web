// feed-parts.jsx — shell + shared building blocks for the My Feed screen.
// Reuses the Studio shell classes (studio.css) + ds tokens. No hardcoded hex.

const { useState: useFS, useEffect: useFE, useRef: useFR } = React;

/* number formatting: 48200 -> "48.2K", 1205 -> "1,205"... we keep <10k exact */
function fmt(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 10000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toLocaleString("en-US");
}

/* monogram avatar (same as Studio's) */
function Mono({ text, size = 34, font = 13 }) {
  return <span className="mono" style={{ width: size, height: size, fontSize: font }}>{text}</span>;
}

/* ------------------------------- Sidebar ------------------------------- */
function Sidebar() {
  const nav = [
    { id: "studio", label: "Studio", Icon: window.IcStudio, badge: 4 },
    { id: "feed", label: "My Feed", Icon: window.IcFeed, active: true },
    { id: "replies", label: "Replies", Icon: window.IcReplies, badge: 3 },
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
          <Mono text={window.FEED_USER.initials} size={32} font={12} />
          <div className="who">
            <div className="nm">{window.FEED_USER.name}</div>
            <div className="hd">{window.FEED_USER.handle}</div>
          </div>
          <window.IcChevDown size={15} className="chev" />
        </button>
      </div>
    </aside>
  );
}

/* -------------------------------- Topbar ------------------------------- */
function Topbar({ dark, onToggleTheme }) {
  return (
    <header className="topbar">
      <span className="topbar-title">My Feed</span>
      <span className="topbar-pill"><span className="pdot" />Updated just now</span>
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

/* ------------------------------ Sparkline ------------------------------ */
// tiny on-token momentum line for the baseline strip
function Sparkline({ data, w = 92, h = 28 }) {
  const max = Math.max(...data), min = Math.min(...data);
  const rng = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - 3 - ((v - min) / rng) * (h - 6);
    return [x, y];
  });
  const line = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  const last = pts[pts.length - 1];
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block", overflow: "visible" }} aria-hidden="true">
      <path d={line} fill="none" stroke="var(--color-accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="2.6" fill="var(--color-accent)" stroke="var(--color-surface)" strokeWidth="1.5" />
    </svg>
  );
}

/* ------------------------------- Baseline ------------------------------ */
function Baseline({ data }) {
  const stats = [
    { num: fmt(data.views), lbl: "avg views", Icon: window.IcEye },
    { num: fmt(data.likes), lbl: "avg likes", Icon: window.IcHeart },
    { num: fmt(data.comments), lbl: "avg comments", Icon: window.IcBubble },
    { num: fmt(data.reposts), lbl: "avg reposts", Icon: window.IcRepost },
  ];
  return (
    <section className="baseline">
      <div className="baseline-head">
        <div className="baseline-title">
          <span className="bt-ico"><window.IcChart size={16} /></span>
          <div>
            <div className="bt-t">Your baseline</div>
            <div className="bt-s">{data.posts > 0 ? `Average across your last ${data.posts} posts · 30 days` : "No published posts in the last 30 days"}</div>
          </div>
        </div>
        {data.posts > 0 && (
          <div className="baseline-trend">
            <Sparkline data={[9, 10, 9, 12, 11, 13, 12, 14, 15, 16]} />
            <span className="bt-delta"><window.IcArrowUp size={13} />{data.deltaViews}%</span>
          </div>
        )}
      </div>
      <div className="baseline-grid">
        {stats.map((s) => (
          <div className="bstat" key={s.lbl}>
            <div className="bstat-num">{s.num}</div>
            <div className="bstat-lbl"><s.Icon size={12} className="bl-ico" />{s.lbl}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------ Sort bar ------------------------------- */
function FeedBar({ count, sort, onSort }) {
  return (
    <div className="feed-bar">
      <div className="fb-count"><b>{count}</b> published posts</div>
      <div className="seg" role="tablist" aria-label="Sort posts">
        {[["recent", "Recent"], ["top", "Top performing"]].map(([k, l]) => (
          <button key={k} role="tab" aria-selected={sort === k}
            className={`seg-btn ${sort === k ? "seg-btn--active" : ""}`}
            onClick={() => onSort(k)}>{l}</button>
        ))}
      </div>
    </div>
  );
}

/* ----------------------------- Empty state ----------------------------- */
function EmptyState() {
  return (
    <div className="empty">
      <div className="empty-mark"><window.IcFeed size={24} /></div>
      <div className="empty-title">No published posts yet</div>
      <div className="empty-sub">Once you approve a draft in the Studio and publish it to Threads, it'll appear here with its performance against your baseline.</div>
      <button className="btn btn--secondary"><window.IcStudio size={16} /> Go to Studio</button>
    </div>
  );
}

/* ---------------------------- Skeleton card ---------------------------- */
function SkeletonCard() {
  return (
    <div className="feed-card skeleton" aria-hidden="true">
      <div className="draft-head">
        <div className="skel-line" style={{ width: 34, height: 34, borderRadius: 999 }} />
        <div style={{ flex: 1 }}>
          <div className="skel-line" style={{ width: 130, marginBottom: 6 }} />
          <div className="skel-line" style={{ width: 80, height: 9 }} />
        </div>
        <div className="skel-line" style={{ width: 92, height: 22, borderRadius: 999 }} />
      </div>
      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 9 }}>
        <div className="skel-line" style={{ width: "94%" }} />
        <div className="skel-line" style={{ width: "70%" }} />
      </div>
      <div style={{ marginTop: 16, display: "flex", gap: 22 }}>
        <div className="skel-line" style={{ width: 96, height: 18 }} />
        <div className="skel-line" style={{ width: 54, height: 14, alignSelf: "center" }} />
        <div className="skel-line" style={{ width: 54, height: 14, alignSelf: "center" }} />
      </div>
    </div>
  );
}

/* ---------------------------- Confirm dialog --------------------------- */
function ConfirmDelete({ post, onCancel, onConfirm }) {
  useFE(() => {
    const h = (e) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onCancel]);
  return (
    <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="dialog" role="dialog" aria-modal="true" aria-label="Delete post">
        <div className="dialog-head">
          <span className="dialog-mark dialog-mark--danger"><window.IcTrash size={18} /></span>
          <div>
            <div className="dialog-title">Delete this post?</div>
            <div className="dialog-sub">This removes it from Threads and from your feed. This can't be undone.</div>
          </div>
        </div>
        <div className="dialog-quote">{post.text}</div>
        <div className="dialog-actions">
          <button className="btn btn--ghost" onClick={onCancel}>Cancel</button>
          <button className="btn btn--danger" onClick={onConfirm}><window.IcTrash size={15} /> Delete post</button>
        </div>
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

Object.assign(window, {
  fmt, Mono, Sidebar, Topbar, Sparkline, Baseline, FeedBar,
  EmptyState, SkeletonCard, ConfirmDelete, Toasts,
});
