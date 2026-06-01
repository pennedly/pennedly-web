// replies-postselect.jsx — choosing which post's comments to work through:
// a horizontal scroll rail of post cards. Scrolls right; the right edge fades
// to hint there's more. Drives the postFilter state. No hardcoded hex.

function PostSelector({ posts, counts, active, onChange, total }) {
  const items = [
    { key: "all", label: "All posts", count: total, time: null },
    ...posts.map((p) => ({ key: p.id, label: p.text, count: counts[p.id] || 0, time: p.time })),
  ];
  return (
    <div className="post-rail-wrap">
      <div className="post-rail">
        {items.map((it) => (
          <button
            key={it.key}
            className={`railcard ${it.key === "all" ? "railcard--all" : ""} ${active === it.key ? "railcard--active" : ""}`}
            onClick={() => onChange(it.key)}
            title={it.label}
          >
            <span className="rc-snippet">{it.label}</span>
            <span className="rc-foot">
              <span className="rc-time">{it.time ? it.time : "everything"}</span>
              <span className={`ps-count ${active === it.key ? "ps-count--on" : ""}`}>{it.count}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { PostSelector });
