// replies-app.jsx — Reply queue (master-detail): pick a post → work its comments.

/* ── DEV HANDOFF · Replies ──────────────────────────────────────────
 * Route / shell:   /app/replies  (full app shell, sidebar = yes; active="replies").
 *                  Tester-gated nav item.
 * Purpose:         Answer comments on your posts in your voice — generate → edit →
 *                  approve → publish threaded under the comment, only on approval.
 * Content width:   wide (--content-wide, 960); topbar .topbar-inner.topbar--wide.
 * Topbar:          title="Replies"; .status-pill — accent "N need a reply" /
 *                  success "All caught up"; actions = theme toggle, settings.
 * Sections (top→bottom):
 *   - page intro
 *   - MASTER-DETAIL: left = post list (text · local date·time · comment count ·
 *     unanswered badge, newest first); right = selected post's context header
 *     (text · date·time · Open in Threads) + status tabs + that post's comments.
 * States:          loading (skeleton master + detail) · live · empty — global
 *                  (no posts with comments) AND per-status (no comments in the
 *                  active tab) · error (banner + retry). Driven by `state` tweak;
 *                  real app: loading on fetch, error on failure.
 * Data shown:      per comment — author avatar + name/handle + local date·time,
 *                  comment body (+ translate), status badge, the drafted reply
 *                  threaded beneath (+ translate), reply status tag. NO like
 *                  counts anywhere (see gotcha).
 * Interactions:    select post → detail swaps. Generate → nib draft (in voice) →
 *                  Draft. Regenerate cycles candidates. Edit → inline textarea
 *                  (⌘↵ save). Approve → Approved (optimistic + toast + undo).
 *                  Publish reply → confirm intent → Replied (optimistic + toast).
 *                  Remove from queue (✕) → Skipped (optimistic + toast + undo);
 *                  Restore → back to New. Translate (comment + reply) toggles the
 *                  text ↔ its translation inline.
 * Localize:        end-user copy = intro, tab labels, status badges/tags, button
 *                  + empty/error copy, toasts, translate labels, context header.
 *                  Comment bodies, posts, drafted replies + translations are
 *                  SAMPLE content (real text + translations come from the API).
 * Backend truth:   Threads' API does NOT return per-reply like counts — so NO
 *                  likes are shown on comments or replies. Publishing posts the
 *                  reply threaded under the comment. Status flow is per-comment.
 *                  Timestamps render in the viewer's local timezone.
 * Changed in rework: rebuilt as true master-detail (was a single feed + post-
 *                  filter rail); adopted shared shell + real avatars; wide +
 *                  aligned topbar; .status-pill; added error state (shared
 *                  ErrorBanner); local date+time (fmtDateTime); removed all like
 *                  counts (gotcha); per-comment ✕ remove-from-queue; translate on
 *                  the reply as well as the comment.
 * ─────────────────────────────────────────────────────────────────── */

const { useState: useApS, useEffect: useApE } = React;

const REPLY_TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "dark": false,
  "state": "Live"
}/*EDITMODE-END*/;

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
  const [filter, setFilter] = useApS("all");
  const [selectedPost, setSelectedPost] = useApS(null);
  const [leaving, setLeaving] = useApS(() => new Set());
  const [toasts, setToasts] = useApS([]);
  const [pubTarget, setPubTarget] = useApS(null);

  useApE(() => {
    if (t.state === "Loading") { setPhase("loading"); return; }
    setPhase("loading");
    const id = setTimeout(() => setPhase("ready"), 850);
    return () => clearTimeout(id);
  }, [t.state]);
  useApE(() => { document.documentElement.classList.toggle("dark", !!t.dark); }, [t.dark]);

  const errored = t.state === "Error";
  const live = t.state === "Empty" ? [] : comments;

  // master: posts with comments, newest first, each with total + unanswered
  const isOpen = (s) => s !== "replied" && s !== "skipped";
  const masterPosts = Object.values(window.POSTS)
    .map((p) => {
      const cs = live.filter((c) => c.postId === p.id);
      return { ...p, total: cs.length, unanswered: cs.filter((c) => isOpen(c.status)).length };
    })
    .filter((p) => p.total > 0)
    .sort((a, b) => new Date(b.at) - new Date(a.at));

  const activePost = masterPosts.find((p) => p.id === selectedPost) || masterPosts[0] || null;
  const detail = activePost ? live.filter((c) => c.postId === activePost.id) : [];

  const statusOf = (s) => detail.filter((c) => c.status === s).length;
  const filters = [
    { key: "all", label: "All", count: detail.length },
    { key: "needs", label: "Needs reply", count: detail.filter((c) => matchesStatus(c.status, "needs")).length },
    { key: "drafts", label: "Draft", count: detail.filter((c) => matchesStatus(c.status, "drafts")).length },
    { key: "replied", label: "Replied", count: statusOf("replied") },
    { key: "skipped", label: "Skipped", count: statusOf("skipped") },
  ];
  const visible = detail.filter((c) => matchesStatus(c.status, filter));
  const needsCount = live.filter((c) => c.status === "new").length;

  /* toasts */
  function pushToast(toast) {
    const id = "t" + Date.now() + Math.random().toString(36).slice(2, 5);
    setToasts((ts) => [...ts, { ...toast, id }]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), 4600);
  }
  function undoToast(toast) { if (toast.undo) toast.undo(); setToasts((ts) => ts.filter((x) => x.id !== toast.id)); }
  function patch(id, changes) { setComments((cs) => cs.map((c) => (c.id === id ? { ...c, ...changes } : c))); }

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
  function requestPublish(id) { const c = comments.find((x) => x.id === id); setPubTarget(c || null); }
  function confirmPublish() { const c = pubTarget; setPubTarget(null); if (c) publish(c.id); }
  const skip = (id) => transition(id, "skipped", {}, { kind: "success", title: "Removed from queue", undo: () => patch(id, { status: "new" }) });
  const restore = (id) => transition(id, "new", { reply: null }, { kind: "success", title: "Restored to queue" });
  function saveEdit(id, text) { patch(id, { reply: text }); pushToast({ kind: "success", title: "Reply updated" }); }

  function commentList() {
    return (
      <div className="feed">
        {visible.length === 0 ? (
          <window.EmptyState status={filter} />
        ) : (
          visible.map((c) => (
            <window.CommentCard
              key={c.id} comment={c} post={window.POSTS[c.postId]} leaving={leaving.has(c.id)}
              onGenerate={generate} onRegenerate={regenerate} onApprove={approve}
              onPublish={requestPublish} onSaveEdit={saveEdit} onSkip={skip} onRestore={restore}
            />
          ))
        )}
      </div>
    );
  }

  return (
    <div className="app">
      <window.Sidebar active="replies" />
      <div className="main">
        <window.Topbar dark={!!t.dark} onToggleTheme={() => setTweak("dark", !t.dark)} needsCount={needsCount} />
        <div className="scroll">
          <div className="content content--wide">
            <div className="page-intro">
              <h1>Reply queue</h1>
              <p>Comments under your posts — answered in your voice, published only when you approve.</p>
            </div>

            {errored ? (
              <window.ErrorBanner title="Couldn’t load your replies" onRetry={() => setTweak("state", "Live")} />
            ) : phase === "loading" ? (
              <div className="rq-layout">
                <aside className="rq-master">
                  <div className="rq-master-cap">Posts with comments</div>
                  <div className="rq-post-list">
                    {Array.from({ length: 3 }).map((_, i) => <div key={i} className="rq-post skeleton"><div className="skel-line" style={{ width: "92%" }} /><div className="skel-line" style={{ width: "50%", height: 9, marginTop: 8 }} /></div>)}
                  </div>
                </aside>
                <div className="rq-detail">
                  <div className="feed">{Array.from({ length: 3 }).map((_, i) => <window.SkeletonCard key={i} />)}</div>
                </div>
              </div>
            ) : !activePost ? (
              <window.EmptyState status="all" />
            ) : (
              <div className="rq-layout">
                <window.PostMaster posts={masterPosts} selected={activePost.id} onSelect={(id) => { setSelectedPost(id); setFilter("all"); }} />
                <div className="rq-detail">
                  <window.PostContext post={activePost} />
                  <window.StatusFilter filters={filters} active={filter} onChange={setFilter} />
                  {commentList()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <window.Toasts toasts={toasts} onUndo={undoToast} />
      {pubTarget && <window.PublishReplyDialog comment={pubTarget} onCancel={() => setPubTarget(null)} onConfirm={confirmPublish} />}

      <window.TweaksPanel>
        <window.TweakSection label="Appearance" />
        <window.TweakToggle label="Dark mode" value={!!t.dark} onChange={(v) => setTweak("dark", v)} />
        <window.TweakSection label="Preview state" />
        <window.TweakRadio label="State" value={t.state} options={["Live", "Loading", "Empty", "Error"]} onChange={(v) => setTweak("state", v)} />
      </window.TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<RepliesApp />);
