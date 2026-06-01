// mentions-app.jsx — read-only Mentions monitoring screen.

const { useState: useMS, useEffect: useME } = React;

const MENT_TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "dark": false,
  "state": "Live"
}/*EDITMODE-END*/;

// which statuses each filter shows ("all" = everything except archived)
function inFilter(status, filter) {
  if (filter === "all") return status !== "archived";
  return status === filter;
}

function MentionsApp() {
  const [t, setTweak] = window.useTweaks(MENT_TWEAK_DEFAULTS);
  const [mentions, setMentions] = useMS(window.MENTIONS);
  const [phase, setPhase] = useMS("loading");
  const [filter, setFilter] = useMS("all");
  const [leaving, setLeaving] = useMS(() => new Set());
  const [toasts, setToasts] = useMS([]);

  useME(() => {
    if (t.state === "Loading") { setPhase("loading"); return; }
    setPhase("loading");
    const id = setTimeout(() => setPhase("ready"), 850);
    return () => clearTimeout(id);
  }, [t.state]);
  useME(() => { document.documentElement.classList.toggle("dark", !!t.dark); }, [t.dark]);

  const live = t.state === "Empty" ? [] : mentions;
  const countOf = (s) => live.filter((m) => m.status === s).length;
  const newCount = countOf("new");
  const filters = [
    { key: "all", label: "All", count: live.filter((m) => m.status !== "archived").length },
    { key: "new", label: "New", count: newCount },
    { key: "saved", label: "Saved", count: countOf("saved") },
    { key: "archived", label: "Archived", count: countOf("archived") },
  ];
  const visible = live.filter((m) => inFilter(m.status, filter));

  /* toasts */
  function pushToast(toast) {
    const id = "t" + Date.now() + Math.random().toString(36).slice(2, 5);
    setToasts((ts) => [...ts, { ...toast, id }]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), 4600);
  }
  function undoToast(toast) { if (toast.undo) toast.undo(); setToasts((ts) => ts.filter((x) => x.id !== toast.id)); }

  function patch(id, changes) { setMentions((ms) => ms.map((m) => (m.id === id ? { ...m, ...changes } : m))); }

  // change status; animate out only when it leaves the active filter
  function setStatus(id, newStatus, toast) {
    const m = mentions.find((x) => x.id === id);
    const exits = inFilter(m.status, filter) && !inFilter(newStatus, filter);
    if (exits) {
      setLeaving((s) => new Set(s).add(id));
      setTimeout(() => {
        patch(id, { status: newStatus });
        setLeaving((s) => { const n = new Set(s); n.delete(id); return n; });
        if (toast) pushToast(toast);
      }, 250);
    } else {
      patch(id, { status: newStatus });
      if (toast) pushToast(toast);
    }
  }

  const save = (id) => {
    const m = mentions.find((x) => x.id === id);
    if (m.status === "saved") setStatus(id, "seen", { kind: "success", title: "Removed from saved" });
    else setStatus(id, "saved", { kind: "success", title: "Saved", sub: "Kept in your Saved tab", undo: () => patch(id, { status: m.status }) });
  };
  const archive = (id) => {
    const m = mentions.find((x) => x.id === id);
    setStatus(id, "archived", { kind: "success", title: "Mention archived", undo: () => patch(id, { status: m.status }) });
  };
  const restore = (id) => setStatus(id, "seen", { kind: "success", title: "Mention restored" });
  const open = (id) => { const m = mentions.find((x) => x.id === id); if (m && m.status === "new") patch(id, { status: "seen" }); };
  const markAllSeen = () => { setMentions((ms) => ms.map((m) => (m.status === "new" ? { ...m, status: "seen" } : m))); pushToast({ kind: "success", title: "All caught up", sub: "New mentions marked as seen" }); };

  return (
    <div className="app">
      <window.Sidebar newCount={newCount} />
      <div className="main">
        <window.Topbar dark={!!t.dark} onToggleTheme={() => setTweak("dark", !t.dark)} newCount={newCount} />
        <div className="scroll">
          <div className="content">
            <div className="page-intro">
              <h1>Mentions</h1>
              <p>Posts across Threads that @-mention you — a calm place to keep an eye on the conversation.</p>
            </div>

            {phase === "loading" ? (
              <div className="feed">{Array.from({ length: 4 }).map((_, i) => <window.SkeletonCard key={"sk" + i} />)}</div>
            ) : (
              <>
                <div className="ment-bar">
                  <window.StatusFilter filters={filters} active={filter} onChange={setFilter} />
                  <button className="markseen" onClick={markAllSeen} disabled={newCount === 0}>
                    <window.IcCheck size={15} /><span className="ms-label">Mark all seen</span>
                  </button>
                </div>
                <div className="feed">
                  {visible.length === 0 ? (
                    <window.EmptyState status={filter} />
                  ) : (
                    visible.map((m) => (
                      <window.MentionCard key={m.id} m={m} leaving={leaving.has(m.id)}
                        onSave={save} onArchive={archive} onRestore={restore} onOpen={open} />
                    ))
                  )}
                </div>
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

ReactDOM.createRoot(document.getElementById("root")).render(<MentionsApp />);
