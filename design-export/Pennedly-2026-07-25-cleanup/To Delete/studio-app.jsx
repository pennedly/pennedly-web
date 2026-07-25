// studio-app.jsx — DraftCard + the Studio App (state, flows, tweaks).

/* ── DEV HANDOFF · Studio ───────────────────────────────────────────
 * Route / shell:   /app   (full app shell, sidebar = yes; <Sidebar active="studio"/>)
 * Purpose:         Write a brief → Pennedly drafts posts/replies in the user's
 *                  voice → user reviews, tweaks, approves, and publishes to Threads.
 * Content width:   wide (--content-wide, 960); topbar uses .topbar-inner.topbar--wide.
 * Topbar:          title="Studio"; voice-state pill — success "Voice active" /
 *                  warning "Voice not set up"; actions = theme toggle, settings.
 * Sections (top→bottom):
 *   - First-run hero (only when voice not set up) OR
 *   - Composer (free-text brief + quick-start chips + 1–4 drafts count + Generate)
 *   - Status tabs: Ready to publish (default) · Drafts · Published · Rejected (counts)
 *   - Draft feed (cards for the active tab)
 * States:          firstRun (voice not set up → hero) · normal · generating
 *                  (nib-write composer + skeleton draft cards in the Drafts tab) ·
 *                  loading (server fetch → skeleton feed) · empty (per-tab) ·
 *                  error (banner on --color-danger + retry). Driven by the
 *                  `account` + `state` tweaks here; real triggers in comments below.
 * Data shown:      each card = account avatar, name/handle, time, (reply context if
 *                  a reply), body text, char count, status badge, status actions.
 *                  Published cards add likes/replies/reposts + Open-in-Threads.
 * Interactions:    Generate → nib-write → prepend N drafts → switch to Drafts tab
 *                  (NO separate preview card). Approve → Ready (optimistic + toast +
 *                  undo). Publish → confirm dialog → Published. Each card shows ONE
 *                  primary action (Approve / Publish to Threads); every secondary
 *                  action (Reject, Tweak, Edit, Send back, Restore) is collapsed into
 *                  a per-card "⋯" overflow menu. Translate (globe) → pick one of the 8
 *                  UI locales → body swaps to the translation inline ("Translated to
 *                  <lang> · Show original"); only EN is the original.
 * Localize:        end-user copy = composer placeholder + chips, tab labels, menu
 *                  items, empty/error copy, toasts, dialog, first-run hero, the
 *                  translate menu. Draft bodies + their per-locale translations
 *                  (STUDIO_TR / GENERATED_TR, UI_LANGS) are SAMPLE content; in the
 *                  real app translations come from the translation service on demand.
 * Backend truth:   NO "last generated" preview card — generated drafts land
 *                  straight in the feed (Drafts tab). Default tab (Ready to publish)
 *                  excludes fresh drafts, so generation switches to Drafts. Nothing
 *                  posts without the explicit Publish confirm. Char limit 500.
 * Changed in rework: adopted shared shell (§4) + real avatars (§3.4); wide column
 *                  + aligned topbar (§3.1/3.2); .status-pill voice state (§3.3);
 *                  canonical nib-write/dot-pulse (§3.5); reordered tabs so Ready to
 *                  publish is default + relabeled; added loading + error states.
 *                  Refinement pass: translate-on-every-card (8 locales, inline);
 *                  collapsed secondary actions into one "⋯" overflow per card;
 *                  redrew the Send-back/undo icon; aligned the footer char-count +
 *                  status on one baseline; equalized composer count-select + Generate.
 * ── «Строка» delivery patch (2026-07-12) — what changed ──────────────
 *   1. Mobile «Строка» is real now. studio.css ≤560 dropped the dead
 *      `.composer-row{flex-wrap}` rule (class no longer exists) and re-flows the
 *      shelf so it NEVER overflows at 390 → 320: DRAFTS + 1·2·3·4 stay on one
 *      row, Generate is full-width on its own row, a seeded note takes its own
 *      row; chips/ideas keep the scroll-row + fade. Sparkle/segment/idea ⋯ and
 *      idea cards are ≥44px; idea `Use` shows without hover; the ⌘↵ hint is
 *      hidden on coarse pointers. Desktop metrics are untouched (frozen/accepted).
 *   2. Ideas palette gained EMPTY + ERROR (was loading→results only). Driven for
 *      review by the new `ideas` tweak (Results / Empty / Error); real triggers:
 *      empty = brainstorm returns 0 hooks, error = brainstorm request fails (503).
 *      Error is danger-toned and does NOT self-collapse; both offer Try again.
 *   3. Full «Строка» state set (all specced): collapsed · open-empty · open-text ·
 *      seeded · ideas-loading · ideas-results · ideas-empty · ideas-error · busy ·
 *      first-run preview (desaturated, non-interactive under the hero).
 *   Specs synced: Studio-SPEC §2.5/§4/§6, Studio-Mobile-SPEC §4/§9-12 (+ mock.js
 *   composer(), mobile/pennedly-mobile.css «Строка» layer). Nothing else touched.
 * ───────────────────────────────────────────────────────────────── */

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

/* --------------------- Card overflow + translate menu ----------------- */
// Collapses every secondary action into one "⋯" menu; the Translate item opens
// a sub-list of the 8 UI languages (globe → languages → inline translation).
function CardMenu({ items, currentLang, onTranslate, onShowOriginal }) {
  const [open, setOpen] = useS(false);
  const [mode, setMode] = useS("root");
  const ref = useR(null);
  useE(() => {
    if (!open) return;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setMode("root"); } };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  function pick(fn) { setOpen(false); setMode("root"); if (fn) fn(); }
  return (
    <div className="card-menu-anchor" ref={ref}>
      <button className="icon-btn" style={{ width: 34, height: 34 }} aria-label="More actions" aria-haspopup="menu" aria-expanded={open}
        onClick={() => { setOpen((v) => !v); setMode("root"); }}>
        <window.IcMore size={17} />
      </button>
      {open && (
        <div className="card-menu" role="menu">
          {mode === "root" ? (
            <>
              {items.map((it, i) => (
                <button key={i} className={`card-menu-item ${it.danger ? "card-menu-item--danger" : ""}`} role="menuitem" onClick={() => pick(it.onClick)}>
                  <it.Icon size={15} className="cmi-ico" /><span className="cmi-label">{it.label}</span>
                </button>
              ))}
              {currentLang && (
                <button className="card-menu-item" role="menuitem" onClick={() => pick(onShowOriginal)}>
                  <window.IcUndo size={15} className="cmi-ico" /><span className="cmi-label">Show original</span>
                </button>
              )}
              <button className="card-menu-item" role="menuitem" onClick={() => setMode("translate")}>
                <window.IcGlobe size={15} className="cmi-ico" /><span className="cmi-label">Translate</span>
                <window.IcChevDown size={13} className="cmi-caret" />
              </button>
            </>
          ) : (
            <>
              <button className="card-menu-back" onClick={() => setMode("root")}><window.IcArrowLeft size={14} /> Translate to</button>
              {window.UI_LANGS.map((l) => {
                const on = l.original ? !currentLang : currentLang === l.code;
                return (
                  <button key={l.code} className={`card-menu-item ${on ? "card-menu-item--on" : ""}`} role="menuitemradio" aria-checked={on}
                    onClick={() => pick(() => (l.original ? onShowOriginal() : onTranslate(l.code)))}>
                    <span className="cmi-lang"><span className="cmi-lname">{l.label}</span><span className="cmi-native">{l.original ? "Original" : l.native}</span></span>
                    {on && <window.IcCheck size={14} className="cmi-check" />}
                  </button>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------ DraftCard ----------------------------- */
function DraftCard({ draft, leaving, onApprove, onReject, onPublish, onSaveEdit, onTweak, onRestore }) {
  const [editing, setEditing] = useS(false);
  const [editText, setEditText] = useS(draft.text);
  const [tweaking, setTweaking] = useS(false);
  const [tweakText, setTweakText] = useS("");
  const [lang, setLang] = useS(null);
  const editRef = useR(null);

  const trMap = window.STUDIO_TR[draft.id] || draft.tr || {};
  const translatedLang = lang && trMap[lang] ? window.UI_LANGS.find((l) => l.code === lang) : null;
  const bodyText = translatedLang ? trMap[lang] : draft.text;

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
        <window.Avatar src={window.USER.avatar} initials={window.USER.initials} size={38} />
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
        <>
          <p className="draft-body">{bodyText}</p>
          {translatedLang && (
            <div className="translate-bar">
              <window.IcGlobe size={13} className="tb-ico" />
              <span>Translated to {translatedLang.native}</span>
              <span className="tb-dot">·</span>
              <button className="tb-orig" onClick={() => setLang(null)}>Show original</button>
            </div>
          )}
        </>
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
                <CardMenu items={[]} currentLang={lang} onTranslate={setLang} onShowOriginal={() => setLang(null)} />
                <a className="btn btn--secondary btn--sm" href="https://www.threads.net" target="_blank" rel="noopener noreferrer"><window.IcExternal size={15} /> Open in Threads</a>
              </div>
            </>
          ) : draft.status === "rejected" ? (
            <>
              <div className="draft-meta"><span className="cc-inline">Passed on · won't be published</span></div>
              <div className="draft-actions">
                <CardMenu
                  items={[{ label: "Restore to drafts", Icon: window.IcUndo, onClick: () => onRestore(draft.id) }]}
                  currentLang={lang} onTranslate={setLang} onShowOriginal={() => setLang(null)} />
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
          ) : draft.status === "ready" ? (
            <>
              <div className="draft-meta">
                <span className="cc-inline">{draft.text.length} / {window.LIMIT}</span>
                <span className="meta-sep" />
                <span className="voice-tag"><window.IcCheck size={13} className="vt-ico" />Ready to publish</span>
              </div>
              <div className="draft-actions">
                <CardMenu
                  items={[
                    { label: "Send back to drafts", Icon: window.IcUndo, onClick: () => onRestore(draft.id) },
                    { label: "Edit", Icon: window.IcPencil, onClick: startEdit },
                  ]}
                  currentLang={lang} onTranslate={setLang} onShowOriginal={() => setLang(null)} />
                <button className="btn btn--primary btn--sm" onClick={() => onPublish(draft)}><window.IcStudio size={15} /> Publish to Threads</button>
              </div>
            </>
          ) : (
            <>
              <div className="draft-meta">
                <span className="cc-inline">{draft.text.length} / {window.LIMIT}</span>
                <span className="meta-sep" />
                <span className="voice-tag"><window.IcSparkle size={13} className="vt-ico" />In your voice</span>
              </div>
              <div className="draft-actions">
                <CardMenu
                  items={[
                    { label: "Reject draft", Icon: window.IcX, onClick: () => onReject(draft.id), danger: true },
                    { label: "Tweak in your voice", Icon: window.IcTweak, onClick: () => { setEditing(false); setTweaking((v) => !v); } },
                    { label: "Edit", Icon: window.IcPencil, onClick: startEdit },
                  ]}
                  currentLang={lang} onTranslate={setLang} onShowOriginal={() => setLang(null)} />
                <button className="btn btn--primary btn--sm" onClick={() => onApprove(draft.id)}><window.IcCheck size={15} /> Approve</button>
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
  "drafts": "3",
  "ideas": "Results",
  "state": "Normal"
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = window.useTweaks(TWEAK_DEFAULTS);
  const firstRun = t.account === "First-run";

  const [drafts, setDrafts] = useS(window.SEED_DRAFTS);
  const [filter, setFilter] = useS("ready");
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

  // §3.8 preview states (real app: loading while fetching, error on failure).
  const loading = t.state === "Loading";
  const errored = t.state === "Error";
  const sourceDrafts = t.state === "Empty" ? [] : drafts;

  const counts = sourceDrafts.reduce((a, d) => { a[d.status] = (a[d.status] || 0) + 1; return a; }, {});
  const filters = [
    { key: "ready", label: "Ready to publish", count: counts.ready || 0 },
    { key: "draft", label: "Drafts", count: counts.draft || 0 },
    { key: "published", label: "Published", count: counts.published || 0 },
    { key: "rejected", label: "Rejected", count: counts.rejected || 0 },
  ];
  const visible = sourceDrafts.filter((d) => d.status === filter);

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
        return { id: "g" + Date.now() + i, kind: "post", status: "draft", time: "Just now", text, tr: window.GENERATED_TR[(genIdx.current - 1) % window.GENERATED_TR.length] };
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
      <window.Sidebar active="studio" />
      <div className="main">
        <window.Topbar dark={!!t.dark} onToggleTheme={() => setTweak("dark", !t.dark)} voiceReady={!firstRun} />
        <div className="scroll">
          <div className="content content--wide">
            {firstRun ? (
              <window.FirstRun onSetup={() => setTweak("account", "Active")} />
            ) : (
              <>
                <window.Composer
                  value={composer} onChange={setComposer}
                  onGenerate={generate} busy={generating}
                  count={count} onCount={setCount}
                  ideasOutcome={t.ideas}
                />
                <window.FilterTabs filters={filters} active={filter} onChange={setFilter} />
                <div className="feed">
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => <window.SkeletonCard key={"ld" + i} />)
                  ) : errored ? (
                    <window.ErrorBanner title="Couldn’t load your drafts" onRetry={() => setTweak("state", "Normal")} />
                  ) : (
                    <>
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
                    </>
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
        <window.TweakRadio label="Account" value={t.account} options={["Active", "First-run"]} onChange={(v) => setTweak("account", v)} />
        <window.TweakSection label="Feed state" />
        <window.TweakRadio label="Feed" value={t.state} options={["Normal", "Loading", "Empty", "Error"]} onChange={(v) => setTweak("state", v)} />
        <window.TweakSection label="Composer" />
        <window.TweakRadio label="Drafts / generate" value={t.drafts} options={["1", "2", "3", "4"]} onChange={(v) => setTweak("drafts", v)} />
        <window.TweakRadio label="Ideas result" value={t.ideas} options={["Results", "Empty", "Error"]} onChange={(v) => setTweak("ideas", v)} />
        <window.TweakSection label="Appearance" />
        <window.TweakToggle label="Dark mode" value={!!t.dark} onChange={(v) => setTweak("dark", v)} />
        <window.TweakRadio label="Density" value={t.density} options={["Comfortable", "Compact"]} onChange={(v) => setTweak("density", v)} />
      </window.TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
