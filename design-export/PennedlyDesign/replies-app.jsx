// replies-app.jsx — Reply queue app: triage state + the reply pipeline.

const { useState: useApS, useEffect: useApE } = React;

const REPLY_TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "dark": false,
  "state": "Live"
}/*EDITMODE-END*/;

// which statuses each filter shows
function matchesStatus(status, filter) {
  if (filter === "all") return true;
  if (filter === "needs") return status === "new" || status === "draft" || status === "approved";
  if (filter === "drafts") return status === "draft" || status === "approved";
  if (filter === "replied") return status === "replied";
  if (filter === "skipped") return status === "skipped";
  return true;
}

function RepliesApp() {
  const [t, setTweak] = window.useTweaks(REPLY_TWEAK_DEFAULTS);

  const [comments, setComments] = useApS(() => window.COMMENTS.map((c) => ({ ...c, ci: 0, generating: false, reply: (c.status === "draft" || c.status === "approved" || c.status === "replied") ? c.candidates[0] : null })));
  const [phase, setPhase] = useApS("loading");
  const [filter, setFilter] = useApS("needs");
  const [postFilter, setPostFilter] = useApS("all");
  const [leaving, setLeaving] = useApS(() => new Set());
  const [toasts, setToasts] = useApS([]);

  useApE(() => {
    if (t.state === "Loading") { setPhase("loading"); return; }
    setPhase("loading");
    const id = setTimeout(() => setPhase("ready"), 850);
    return () => clearTimeout(id);
  }, [t.state]);
  useApE(() => { document.documentElement.classList.toggle("dark", !!t.dark); }, [t.dark]);

  const live = t.state === "Empty" ? [] : comments;

  /* counts */
  const statusOf = (s) => live.filter((c) => c.status === s).length;
  const needsCount = statusOf("new");
  const filters = [
    { key: "all", label: "All", count: live.length },
    { key: "needs", label: "Needs reply", count: live.filter((c) => matchesStatus(c.status, "needs")).length },
    { key: "drafts", label: "Drafts", count: live.filter((c) => matchesStatus(c.status, "drafts")).length },
    { key: "replied", label: "Replied", count: statusOf("replied") },
    { key: "skipped", label: "Skipped", count: statusOf("skipped") },
  ];
  // per-post "still to work through" counts (not replied, not skipped)
  const postCounts = {};
  live.forEach((c) => { if (c.status !== "replied" && c.status !== "skipped") postCounts[c.postId] = (postCounts[c.postId] || 0) + 1; });
  const totalActive = Object.values(postCounts).reduce((a, b) => a + b, 0);
  const postList = Object.values(window.POSTS);

  const visible = live.filter((c) => matchesStatus(c.status, filter) && (postFilter === "all" || c.postId === postFilter));


  /* toasts */
  function pushToast(toast) {
    const id = "t" + Date.now() + Math.random().toString(36).slice(2, 5);
    setToasts((ts) => [...ts, { ...toast, id }]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), 4600);
  }
  function undoToast(toast) { if (toast.undo) toast.undo(); setToasts((ts) => ts.filter((x) => x.id !== toast.id)); }

  function patch(id, changes) { setComments((cs) => cs.map((c) => (c.id === id ? { ...c, ...changes } : c))); }

  // status transition; animates out only if it leaves the current filter
  function transition(id, newStatus, extra, toast) {
    const c = comments.find((x) => x.id === id);
    const exits = matchesStatus(c.status, filter) && !matchesStatus(newStatus, filter);
    if (exits) {
      setLeaving((s) => new Set(s).add(id));
      setTimeout(() => {
        patch(id, { status: newStatus, ...extra });
        setLeaving((s) => { const n = new Set(s); n.delete(id); return n; });
        if (toast) pushToast(toast);
      }, 250);
    } else {
      patch(id, { status: newStatus, ...extra });
      if (toast) pushToast(toast);
    }
  }

  function generate(id) {
    patch(id, { generating: true });
    setTimeout(() => {
      const c = comments.find((x) => x.id === id);
      patch(id, { generating: false, status: "draft", reply: c.candidates[c.ci % c.candidates.length] });
    }, 1500);
  }
  function regenerate(id) {
    const c = comments.find((x) => x.id === id);
    const ni = (c.ci + 1) % c.candidates.length;
    patch(id, { generating: true, ci: ni });
    setTimeout(() => patch(id, { generating: false, reply: c.candidates[ni] }), 900);
  }
  const approve = (id) => transition(id, "approved", {}, { kind: "success", title: "Reply approved", sub: "Ready to publish", undo: () => patch(id, { status: "draft" }) });
  const publish = (id) => transition(id, "replied", { repliedTime: "just now" }, { kind: "success", title: "Reply published", sub: "Posted under the comment on Threads" });
  const skip = (id) => transition(id, "skipped", {}, { kind: "success", title: "Comment skipped", undo: () => patch(id, { status: "new" }) });
  const restore = (id) => transition(id, "new", { reply: null }, { kind: "success", title: "Restored to queue" });
  function saveEdit(id, text) { patch(id, { reply: text }); pushToast({ kind: "success", title: "Reply updated" }); }

  const feedEl = (
    <div className="feed">
      {visible.length === 0 ? (
        <window.EmptyState status={filter} />
      ) : (
        visible.map((c) => (
          <window.CommentCard
            key={c.id} comment={c} post={window.POSTS[c.postId]} leaving={leaving.has(c.id)}
            onGenerate={generate} onRegenerate={regenerate} onApprove={approve}
            onPublish={publish} onSaveEdit={saveEdit} onSkip={skip} onRestore={restore}
          />
        ))
      )}
    </div>
  );

  return (
    <div className="app">
      <window.Sidebar needsCount={needsCount} />
      <div className="main">
        <window.Topbar dark={!!t.dark} onToggleTheme={() => setTweak("dark", !t.dark)} needsCount={needsCount} />
        <div className="scroll">
          <div className="content">
            <div className="page-intro">
              <h1>Reply queue</h1>
              <p>Comments under your posts — answered in your voice, published only when you approve.</p>
            </div>

            {phase === "loading" ? (
              <div className="feed">{Array.from({ length: 4 }).map((_, i) => <window.SkeletonCard key={"sk" + i} />)}</div>
            ) : (
              <>
                <window.StatusFilter filters={filters} active={filter} onChange={setFilter} />
                {live.length > 0 && (
                  <window.PostSelector posts={postList} counts={postCounts} active={postFilter} onChange={setPostFilter} total={totalActive} />
                )}
                {feedEl}
              </>
            )}
          </div>
        </div>
      </div>

      <window.Toasts toasts={toasts} onUndo={undoToast} />

      <window.TweaksPanel>
        <window.TweakSection label="Appearance" />
        <window.TweakToggle label="Dark mode" value={!!t.dark} onChange={(v) => setTweak("dark", v)} />
        <window.TweakSection label="Preview state" />
        <window.TweakRadio label="State" value={t.state} options={["Live", "Loading", "Empty"]} onChange={(v) => setTweak("state", v)} />
      </window.TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<RepliesApp />);
