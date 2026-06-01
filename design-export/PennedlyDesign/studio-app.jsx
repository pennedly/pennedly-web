// studio-app.jsx — DraftCard + the Studio App (state, flows, tweaks).

const { useState: useS, useEffect: useE, useRef: useR } = React;

/* --------------------------- status helpers --------------------------- */
function StatusBadge({ status }) {
  if (status === "ready")
    return (
      <span className="badge" style={{
        background: "color-mix(in srgb, var(--color-accent) 13%, var(--color-surface))",
        color: "var(--color-accent)",
        borderColor: "color-mix(in srgb, var(--color-accent) 30%, transparent)",
      }}><span className="pill-dot" />Ready</span>
    );
  if (status === "published")
    return <span className="badge badge--good"><span className="pill-dot" />Published</span>;
  if (status === "rejected")
    return <span className="badge badge--bad"><span className="pill-dot" />Rejected</span>;
  return <span className="badge badge--neutral"><span className="pill-dot" style={{ color: "var(--color-ink-400)" }} />Draft</span>;
}

function sentences(t) { return t.match(/[^.!?]+[.!?]+(\s|$)/g) || [t]; }
function revise(text, instr) {
  const i = (instr || "").toLowerCase();
  const s = sentences(text);
  if (i.includes("short")) return s.slice(0, Math.max(1, s.length - 1)).join("").trim();
  if (i.includes("punch") || i.includes("tight")) return s.slice(0, Math.min(2, s.length)).join("").trim();
  if (i.includes("question")) return text.trim().replace(/[.!?]?$/, "") + ". What would you add?";
  if (i.includes("warm") || i.includes("kind")) return "Honestly? " + text.charAt(0).toLowerCase() + text.slice(1);
  return s.slice(0, Math.min(2, s.length)).join("").trim();
}

/* ------------------------------ DraftCard ----------------------------- */
function DraftCard({ draft, leaving, onApprove, onReject, onPublish, onSaveEdit, onTweak, onRestore }) {
  const [editing, setEditing] = useS(false);
  const [editText, setEditText] = useS(draft.text);
  const [tweaking, setTweaking] = useS(false);
  const [tweakText, setTweakText] = useS("");
  const editRef = useR(null);

  useE(() => { if (editing && editRef.current) { editRef.current.focus(); autosize(editRef.current); } }, [editing]);
  function autosize(el) { el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; }

  const isReply = draft.kind === "reply";
  const cls = ["draft", `draft--${draft.status}`, leaving ? "draft--leaving" : ""].join(" ");

  function startEdit() { setEditText(draft.text); setTweaking(false); setEditing(true); }
  function saveEdit() { onSaveEdit(draft.id, editText.trim()); setEditing(false); }
  function sendTweak(instruction) {
    const instr = (instruction ?? tweakText).trim();
    if (!instr) return;
    setTweaking(false); setTweakText("");
    onTweak(draft.id, instr);
  }

  return (
    <article className={cls}>
      <div className="draft-head">
        <window.Mono text={window.USER.initials} size={34} font={12} />
        <div className="draft-id">
          <div className="draft-name">{window.USER.name}</div>
          <div className="draft-sub">
            <span>{window.USER.handle}</span>
            {isReply && <><span className="sep">·</span><span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><window.IcReply size={12} />replying to {draft.replyTo.who}</span></>}
            <span className="sep">·</span><span>{draft.time}</span>
          </div>
        </div>
        <StatusBadge status={draft.status} />
      </div>

      {isReply && (
        <div className="reply-ctx">
          <div className="rc-bar" />
          <div className="rc-body">
            <div className="rc-who">{draft.replyTo.who}</div>
            <div className="rc-txt">{draft.replyTo.text}</div>
          </div>
        </div>
      )}

      {draft.revising ? (
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 9 }}>
          <div className="skel-line" style={{ width: "92%" }} />
          <div className="skel-line" style={{ width: "100%" }} />
          <div className="skel-line" style={{ width: "48%" }} />
          <span className="revised-note"><window.IcTweak size={13} /> Revising in your voice…</span>
        </div>
      ) : editing ? (
        <>
          <textarea
            ref={editRef}
            className="edit-area"
            value={editText}
            onChange={(e) => { setEditText(e.target.value); autosize(e.target); }}
            onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") saveEdit(); }}
          />
          <window.CharMeter len={editText.length} />
        </>
      ) : (
        <p className="draft-body">{draft.text}</p>
      )}

      {draft.revised && !editing && !draft.revising && (
        <span className="revised-note"><window.IcSparkle size={13} /> Revised just now</span>
      )}

      {tweaking && !editing && (
        <>
          <div className="tweakbar">
            <window.IcTweak size={16} className="tw-ico" />
            <input
              autoFocus
              placeholder="What should change? e.g. make it punchier…"
              value={tweakText}
              onChange={(e) => setTweakText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") sendTweak(); if (e.key === "Escape") setTweaking(false); }}
            />
            <button className="btn btn--primary btn--sm" onClick={() => sendTweak()} disabled={!tweakText.trim()}><window.IcSend size={15} /></button>
          </div>
          <div className="tweak-suggest">
            {window.TWEAK_SUGGESTIONS.map((s) => (
              <button key={s} className="ts" onClick={() => sendTweak(s)}>{s}</button>
            ))}
          </div>
        </>
      )}

      {/* ---------------------------- footer ---------------------------- */}
      {!draft.revising && (
        <div className="draft-foot">
          {draft.status === "published" ? (
            <>
              <div className="draft-stats">
                <span className="stat"><window.IcHeart size={15} className="st-ico" />{draft.stats.likes.toLocaleString()}</span>
                <span className="stat"><window.IcBubble size={15} className="st-ico" />{draft.stats.replies}</span>
                <span className="stat"><window.IcRepost size={15} className="st-ico" />{draft.stats.reposts}</span>
              </div>
              <div className="draft-actions">
                <a className="btn btn--secondary btn--sm" href="https://www.threads.net" target="_blank" rel="noopener noreferrer"><window.IcExternal size={15} /> View on Threads</a>
              </div>
            </>
          ) : draft.status === "rejected" ? (
            <>
              <div className="draft-meta"><span className="cc-inline">Passed on · won't be published</span></div>
              <div className="draft-actions">
                <button className="btn btn--ghost btn--sm" onClick={() => onRestore(draft.id)}><window.IcUndo size={15} /> Restore to drafts</button>
              </div>
            </>
          ) : editing ? (
            <>
              <div className="draft-meta"><span className="cc-inline">Editing</span></div>
              <div className="draft-actions">
                <button className="btn btn--ghost btn--sm" onClick={() => setEditing(false)}>Cancel</button>
                <button className="btn btn--primary btn--sm" onClick={saveEdit} disabled={editText.trim().length === 0 || editText.length > window.LIMIT}><window.IcCheck size={15} /> Save</button>
              </div>
            </>
          ) : (
            <>
              <div className="draft-meta">
                <window.CharMeter len={draft.text.length} showBar={false} />
                <span className="voice-tag"><window.IcSparkle size={12} className="vt-ico" />In your voice</span>
              </div>
              <div className="draft-actions">
                <button className="btn btn--ghost btn--sm" onClick={() => onReject(draft.id)} aria-label="Reject"><window.IcX size={15} /></button>
                <button className="btn btn--secondary btn--sm" onClick={() => { setEditing(false); setTweaking((v) => !v); }}><window.IcTweak size={15} /> Tweak</button>
                <button className="btn btn--secondary btn--sm" onClick={startEdit}><window.IcPencil size={15} /> Edit</button>
                {draft.status === "ready" ? (
                  <button className="btn btn--primary btn--sm" onClick={() => onPublish(draft)}><window.IcStudio size={15} /> Publish</button>
                ) : (
                  <button className="btn btn--primary btn--sm" onClick={() => onApprove(draft.id)}><window.IcCheck size={15} /> Approve</button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </article>
  );
}

/* -------------------------------- App --------------------------------- */
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "account": "Active",
  "dark": false,
  "density": "Comfortable",
  "drafts": "3"
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = window.useTweaks(TWEAK_DEFAULTS);
  const firstRun = t.account === "First-run";

  const [drafts, setDrafts] = useS(window.SEED_DRAFTS);
  const [filter, setFilter] = useS("draft");
  const [composer, setComposer] = useS("");
  const [count, setCount] = useS(parseInt(t.drafts) || 3);
  const [generating, setGenerating] = useS(false);
  const [leaving, setLeaving] = useS(() => new Set());
  const [toasts, setToasts] = useS([]);
  const [pubTarget, setPubTarget] = useS(null);
  const composerRef = useR(null);
  const genIdx = useR(0);

  // sync tweaks → app
  useE(() => { document.documentElement.classList.toggle("dark", !!t.dark); }, [t.dark]);
  useE(() => { setCount(parseInt(t.drafts) || 3); }, [t.drafts]);

  const counts = drafts.reduce((a, d) => { a[d.status] = (a[d.status] || 0) + 1; return a; }, {});
  const filters = [
    { key: "draft", label: "Drafts", count: counts.draft || 0 },
    { key: "ready", label: "Ready", count: counts.ready || 0 },
    { key: "published", label: "Published", count: counts.published || 0 },
    { key: "rejected", label: "Rejected", count: counts.rejected || 0 },
  ];
  const visible = drafts.filter((d) => d.status === filter);

  /* toasts */
  function pushToast(toast) {
    const id = "t" + Date.now() + Math.random().toString(36).slice(2, 5);
    const full = { ...toast, id };
    setToasts((ts) => [...ts, full]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), 4800);
  }
  function dismissToast(toast) { setToasts((ts) => ts.filter((x) => x.id !== toast.id)); }
  function undoToast(toast) {
    if (toast.undo) setDrafts((ds) => ds.map((d) => d.id === toast.undo.id ? { ...d, ...toast.undo.patch } : d));
    dismissToast(toast);
  }

  /* status transition with leave animation */
  function commit(id, patch, toast) {
    setLeaving((s) => new Set(s).add(id));
    setTimeout(() => {
      setDrafts((ds) => ds.map((d) => d.id === id ? { ...d, ...patch } : d));
      setLeaving((s) => { const n = new Set(s); n.delete(id); return n; });
      if (toast) pushToast(toast);
    }, 250);
  }

  const approve = (id) => commit(id, { status: "ready", time: "Approved just now" }, { kind: "success", title: "Approved", sub: "Moved to Ready to publish", undo: { id, patch: { status: "draft", time: "Just now" } } });
  const reject = (id) => commit(id, { status: "rejected", time: "Rejected just now" }, { kind: "success", title: "Draft rejected", sub: "Moved to Rejected", undo: { id, patch: { status: "draft", time: "Just now" } } });
  const restore = (id) => commit(id, { status: "draft", time: "Restored just now" }, { kind: "success", title: "Restored to drafts" });

  function saveEdit(id, text) {
    setDrafts((ds) => ds.map((d) => d.id === id ? { ...d, text, revised: false } : d));
    pushToast({ kind: "success", title: "Edit saved" });
  }

  function tweakDraft(id, instruction) {
    setDrafts((ds) => ds.map((d) => d.id === id ? { ...d, revising: true } : d));
    setTimeout(() => {
      setDrafts((ds) => ds.map((d) => d.id === id ? { ...d, text: revise(d.text, instruction), revising: false, revised: true, time: "Revised just now" } : d));
    }, 1400);
  }

  function confirmPublish() {
    const d = pubTarget; setPubTarget(null);
    commit(d.id, { status: "published", time: "Published just now", stats: { likes: 0, replies: 0, reposts: 0 } }, { kind: "success", title: "Published to Threads", sub: window.USER.handle });
  }

  function generate() {
    if (!composer.trim() || generating) return;
    setGenerating(true);
    setFilter("draft");
    setTimeout(() => {
      const made = Array.from({ length: count }).map((_, i) => {
        const text = window.GENERATED_POOL[genIdx.current % window.GENERATED_POOL.length];
        genIdx.current += 1;
        return { id: "g" + Date.now() + i, kind: "post", status: "draft", time: "Just now", text };
      });
      setDrafts((ds) => [...made, ...ds]);
      setGenerating(false);
      setComposer("");
    }, 1600);
  }

  function focusComposer() {
    const el = document.querySelector(".composer-input");
    if (el && el.focus) el.focus();
  }

  return (
    <div className="app" data-density={t.density === "Compact" ? "compact" : "comfortable"}>
      <window.Sidebar counts={counts} />
      <div className="main">
        <window.Topbar dark={!!t.dark} onToggleTheme={() => setTweak("dark", !t.dark)} voiceReady={!firstRun} />
        <div className="scroll">
          <div className="content">
            {firstRun ? (
              <window.FirstRun onSetup={() => setTweak("account", "Active")} />
            ) : (
              <>
                <window.Composer
                  value={composer} onChange={setComposer}
                  onGenerate={generate} busy={generating}
                  count={count} onCount={setCount}
                />
                <window.FilterTabs filters={filters} active={filter} onChange={setFilter} />
                <div className="feed">
                  {generating && filter === "draft" &&
                    Array.from({ length: count }).map((_, i) => <window.SkeletonCard key={"sk" + i} />)}
                  {visible.length === 0 && !generating ? (
                    <window.EmptyState status={filter} onCta={focusComposer} />
                  ) : (
                    visible.map((d) => (
                      <DraftCard
                        key={d.id} draft={d} leaving={leaving.has(d.id)}
                        onApprove={approve} onReject={reject} onPublish={setPubTarget}
                        onSaveEdit={saveEdit} onTweak={tweakDraft} onRestore={restore}
                      />
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {pubTarget && <window.PublishDialog draft={pubTarget} onCancel={() => setPubTarget(null)} onConfirm={confirmPublish} />}
      <window.Toasts toasts={toasts} onUndo={undoToast} onDismiss={dismissToast} />

      {/* ----------------------------- Tweaks ----------------------------- */}
      <window.TweaksPanel>
        <window.TweakSection label="Account" />
        <window.TweakRadio label="State" value={t.account} options={["Active", "First-run"]} onChange={(v) => setTweak("account", v)} />
        <window.TweakSection label="Composer" />
        <window.TweakRadio label="Drafts / generate" value={t.drafts} options={["1", "2", "3", "4"]} onChange={(v) => setTweak("drafts", v)} />
        <window.TweakSection label="Appearance" />
        <window.TweakToggle label="Dark mode" value={!!t.dark} onChange={(v) => setTweak("dark", v)} />
        <window.TweakRadio label="Density" value={t.density} options={["Comfortable", "Compact"]} onChange={(v) => setTweak("density", v)} />
      </window.TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
