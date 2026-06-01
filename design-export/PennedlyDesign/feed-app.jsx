// feed-app.jsx — My Feed app: state, flows, tweaks.

const { useState: useAS, useEffect: useAE, useRef: useAR } = React;

const FEED_TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "dark": false,
  "state": "Live",
  "sort": "Recent"
}/*EDITMODE-END*/;

function FeedApp() {
  const [t, setTweak] = window.useTweaks(FEED_TWEAK_DEFAULTS);

  const [posts, setPosts] = useAS(window.FEED_POSTS);
  const [phase, setPhase] = useAS("loading");          // loading | ready
  const [sort, setSort] = useAS(t.sort === "Top" ? "top" : "recent");
  const [expanded, setExpanded] = useAS(null);
  const [delTarget, setDelTarget] = useAS(null);
  const [leaving, setLeaving] = useAS(() => new Set());
  const [toasts, setToasts] = useAS([]);

  // realistic first-load: brief skeleton, then content
  useAE(() => {
    if (t.state === "Loading") { setPhase("loading"); return; }
    setPhase("loading");
    const id = setTimeout(() => setPhase("ready"), 850);
    return () => clearTimeout(id);
  }, [t.state]);

  useAE(() => { document.documentElement.classList.toggle("dark", !!t.dark); }, [t.dark]);
  useAE(() => { setSort(t.sort === "Top" ? "top" : "recent"); }, [t.sort]);

  /* toasts */
  function pushToast(toast) {
    const id = "t" + Date.now() + Math.random().toString(36).slice(2, 5);
    setToasts((ts) => [...ts, { ...toast, id }]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), 4600);
  }
  function undoToast(toast) {
    if (toast.undo) toast.undo();
    setToasts((ts) => ts.filter((x) => x.id !== toast.id));
  }

  function toggleTrend(id) { setExpanded((e) => (e === id ? null : id)); }

  function toggleReplies(id) {
    let now = false;
    setPosts((ps) => ps.map((p) => { if (p.id === id) { now = !p.autoReplies; return { ...p, autoReplies: now }; } return p; }));
    pushToast({ kind: "success", title: now ? "Auto-replies on" : "Auto-replies off", sub: now ? "Pennedly will draft replies to new comments" : "New comments won't get drafted replies" });
  }

  function confirmDelete() {
    const post = delTarget; setDelTarget(null);
    setLeaving((s) => new Set(s).add(post.id));
    setTimeout(() => {
      setPosts((ps) => ps.filter((p) => p.id !== post.id));
      setLeaving((s) => { const n = new Set(s); n.delete(post.id); return n; });
      pushToast({
        kind: "success", title: "Post deleted", sub: "Removed from Threads and your feed",
        undo: () => setPosts((ps) => (ps.some((p) => p.id === post.id) ? ps : [post, ...ps])),
      });
    }, 250);
  }

  const isEmpty = t.state === "Empty";
  const ordered = isEmpty ? [] : (sort === "top"
    ? [...posts].sort((a, b) => b.metrics.views - a.metrics.views)
    : posts);

  return (
    <div className="app">
      <window.Sidebar />
      <div className="main">
        <window.Topbar dark={!!t.dark} onToggleTheme={() => setTweak("dark", !t.dark)} />
        <div className="scroll">
          <div className="content">
            <div className="feed-intro">
              <h1>My Feed</h1>
              <p>How your published posts are landing — measured against your own baseline.</p>
            </div>

            {phase === "loading" ? (
              <>
                <window.SkeletonCard />
                <div className="feed" style={{ marginTop: 0 }}>
                  {Array.from({ length: 4 }).map((_, i) => <window.SkeletonCard key={"sk" + i} />)}
                </div>
              </>
            ) : isEmpty || ordered.length === 0 ? (
              <>
                <window.Baseline data={{ ...window.BASELINE, views: 0, likes: 0, comments: 0, reposts: 0, posts: 0 }} />
                <window.EmptyState />
              </>
            ) : (
              <>
                <window.Baseline data={window.BASELINE} />
                <window.FeedBar count={ordered.length} sort={sort} onSort={(s) => setTweak("sort", s === "top" ? "Top" : "Recent")} />
                <div className="feed">
                  {ordered.map((p) => (
                    <window.PostCard
                      key={p.id} post={p} baseline={window.BASELINE}
                      expanded={expanded === p.id} leaving={leaving.has(p.id)}
                      onToggleTrend={toggleTrend} onToggleReplies={toggleReplies}
                      onDelete={setDelTarget}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {delTarget && <window.ConfirmDelete post={delTarget} onCancel={() => setDelTarget(null)} onConfirm={confirmDelete} />}
      <window.Toasts toasts={toasts} onUndo={undoToast} />

      <window.TweaksPanel>
        <window.TweakSection label="Appearance" />
        <window.TweakToggle label="Dark mode" value={!!t.dark} onChange={(v) => setTweak("dark", v)} />
        <window.TweakSection label="Feed" />
        <window.TweakRadio label="Default sort" value={t.sort} options={["Recent", "Top"]} onChange={(v) => setTweak("sort", v)} />
        <window.TweakSection label="Preview state" />
        <window.TweakRadio label="State" value={t.state} options={["Live", "Loading", "Empty"]} onChange={(v) => setTweak("state", v)} />
      </window.TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<FeedApp />);
