// feed-app.jsx — My Feed app: state, flows, tweaks.

/* ── DEV HANDOFF · My Feed ──────────────────────────────────────────
 * Route / shell:   /app/feed   (full app shell, sidebar = yes; active="feed")
 * Purpose:         How the user's published Threads posts are performing,
 *                  every post measured against the account's own baseline.
 * Content width:   wide (--content-wide, 960); topbar .topbar-inner.topbar--wide.
 * Topbar:          title="My Feed"; .status-pill success "Updated just now";
 *                  actions = theme toggle, settings.
 * Sections (top→bottom):
 *   - page heading
 *   - Baseline strip (30-day avg views/likes/comments/reposts + WoW sparkline)
 *   - Sort bar (Recent / Top performing) + count
 *   - Post cards (metrics, virality badge, auto-reply toggle, trend sparkline)
 * States:          loading (skeleton baseline + cards) · live · empty (zeroed
 *                  baseline + empty state) · error (banner + retry). Driven by
 *                  the `state` tweak; real app: loading on fetch, error on failure.
 * Data shown:      per card — avatar, name/handle, local date+time (§3.10),
 *                  reply context (if a reply), body, virality badge ("N× average"
 *                  / "Still settling" while fresh), views/likes/comments/reposts,
 *                  an expandable cumulative-views trend vs the dashed baseline,
 *                  and a per-post auto-reply toggle.
 * Interactions:    Auto-reply pill → optimistic toggle + toast (accent "on" /
 *                  hollow "off"). Growth → expand inline views-over-time chart vs
 *                  the dashed baseline. Translate (⋯ menu → globe → one of 8 UI
 *                  locales) → body swaps inline with a "Translated to <native> ·
 *                  Show original" bar; each post's own language is the "Original".
 *                  More menu → Open on Threads / Delete (tester-only) → confirm
 *                  dialog → optimistic remove + toast w/ undo. Sort → reorders.
 * Localize:        end-user copy = heading, baseline labels, sort labels, badges,
 *                  pill/menu/empty/error copy, toasts, dialog, the translate menu.
 *                  Post bodies + their per-locale translations (post.tr, UI_LANGS)
 *                  are SAMPLE content; real translations come from the service.
 * Backend truth:   metrics + trend come from Threads insights; baseline is the
 *                  account's own rolling average. Delete is tester-gated and
 *                  removes from Threads + feed. Timestamps render in the viewer's
 *                  local timezone. Translate calls the translation service only
 *                  when needed (post language ≠ UI locale).
 * Changed in rework: adopted shared shell + real avatars; wide column + aligned
 *                  topbar; .status-pill; added the error state (shared
 *                  ErrorBanner); timestamps now local date+time (fmtDateTime).
 *                  Parity pass: translate-on-every-card (⋯ → 8 locales, inline,
 *                  shared UI_LANGS + per-post tr); auto-reply switch → accent
 *                  "on" / hollow "off" pill; "Trend" → "Growth".
 * ─────────────────────────────────────────────────────────────────── */

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
  const errored = t.state === "Error";
  const ordered = isEmpty ? [] : (sort === "top"
    ? [...posts].sort((a, b) => b.metrics.views - a.metrics.views)
    : posts);

  return (
    <div className="app">
      <window.Sidebar active="feed" />
      <div className="main">
        <window.Topbar dark={!!t.dark} onToggleTheme={() => setTweak("dark", !t.dark)} />
        <div className="scroll">
          <div className="content content--wide">
            <div className="feed-intro">
              <h1>My Feed</h1>
              <p>How your published posts are landing — measured against your own baseline.</p>
            </div>

            {errored ? (
              <window.ErrorBanner title="Couldn’t load your feed" onRetry={() => setTweak("state", "Live")} />
            ) : phase === "loading" ? (
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
        <window.TweakRadio label="State" value={t.state} options={["Live", "Loading", "Empty", "Error"]} onChange={(v) => setTweak("state", v)} />
      </window.TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<FeedApp />);
