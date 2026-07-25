// studio-parts.jsx — shared building blocks for the Studio screen.
// Sidebar + account + avatar now come from the shared shell (shell-parts.jsx).
// All visuals reference the ink-on-paper tokens; no hardcoded colours.

const { useState, useRef, useEffect } = React;

/* ----------------------------- Char meter ------------------------------ */
const LIMIT = 500;
function CharMeter({ len, showBar = true }) {
  const pct = Math.min(100, (len / LIMIT) * 100);
  const tone = len > LIMIT ? "over" : len > LIMIT - 60 ? "warn" : "";
  return (
    <div className={`charmeter ${tone}`}>
      {showBar && (
        <div className="track"><div className="fill" style={{ width: `${pct}%` }} /></div>
      )}
      <span className="cc">{len} / {LIMIT}</span>
    </div>
  );
}

/* ----------------------------- Filter tabs ----------------------------- */
function FilterTabs({ filters, active, onChange }) {
  return (
    <div className="filterbar" role="tablist" aria-label="Draft status">
      {filters.map((f) => (
        <button
          key={f.key}
          role="tab"
          aria-selected={active === f.key}
          className={`filter ${active === f.key ? "filter--active" : ""}`}
          onClick={() => onChange(f.key)}
        >
          <span className={`fdot dot-${f.key}`} />
          <span className="flabel">{f.label}</span>
          <span className="fcount">{f.count}</span>
        </button>
      ))}
    </div>
  );
}

/* ------------------------------- Sidebar -------------------------------
   Now the shared <window.Sidebar active="studio" /> (shell-parts.jsx, §4). */

/* -------------------------------- Topbar ------------------------------- */
function Topbar({ dark, onToggleTheme, voiceReady }) {
  return (
    <header className="topbar">
      <div className="topbar-inner topbar--wide">
        <span className="topbar-title">Studio</span>
        {voiceReady ? (
          <span className="status-pill status-pill--success"><span className="pill-dot" />Voice active</span>
        ) : (
          <span className="status-pill status-pill--warning"><span className="pill-dot" />Voice not set up</span>
        )}
        <span className="topbar-spacer" />
        <div className="topbar-actions">
          <button className="icon-btn" aria-label="Toggle theme" onClick={onToggleTheme}>
            {dark ? <window.IcSun size={17} /> : <window.IcMoon size={16} />}
          </button>
          <button className="icon-btn" aria-label="Settings"><window.IcSettings size={17} /></button>
        </div>
      </div>
    </header>
  );
}

/* ------------------------------- Composer ------------------------------
   «Строка» — the one canonical composer across the product. A single calm prompt
   line that discloses its shelf (quick-start chips + 1–4 count + Generate) on
   focus/typing; the ✨ sparkle swaps the shelf for the Ideas palette (loading →
   ideas → empty/error), and picking an idea seeds the brief. Cmd/Ctrl+Enter
   generates. Busy turns the whole block into a drafting status. Self-contained:
   holds its own focus / ideas state, same prop contract as before. */
const COMPOSER_CHIPS = [
  "A lesson from this week",
  "React to a trend",
  "Reply to recent mentions",
  "An unpopular opinion",
];

function Composer({ value, onChange, onGenerate, busy, count, onCount, ideasOutcome = "Results" }) {
  const ref = useRef(null);
  const [focused, setFocused] = useState(false);
  const [ideas, setIdeas] = useState(null); // null | 'loading' | 'results' | 'empty' | 'error'
  const [seeded, setSeeded] = useState(false);
  const timer = useRef(null);

  const hasText = !!value.trim();
  const open = focused || hasText || !!ideas;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, [value, open]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const outcomeState = (o) => (o === "Empty" ? "empty" : o === "Error" ? "error" : "results");
  function brainstorm() {
    setIdeas("loading");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setIdeas(outcomeState(ideasOutcome)), 850);
  }
  // Review aid: flipping the Ideas-result tweak while the palette is already
  // settled reflects live (loading stays loading; closed stays closed).
  useEffect(() => {
    setIdeas((cur) => (cur && cur !== "loading" ? outcomeState(ideasOutcome) : cur));
  }, [ideasOutcome]);
  function toggleIdeas() { if (ideas) setIdeas(null); else brainstorm(); }
  function pickIdea(hook) {
    onChange(hook); setSeeded(true); setIdeas(null);
    requestAnimationFrame(() => ref.current && ref.current.focus());
  }
  const keepFocus = (e) => e.preventDefault();

  if (busy) {
    return (
      <div className="composer composer--busy">
        <div className="drafting">
          <span className="nib"><window.IcNib size={22} /></span>
          <span className="drafting-text">Drafting <b>{count}</b> posts in your voice<span className="dots"><i /><i /><i /></span></span>
        </div>
      </div>
    );
  }

  const IDEAS = window.STUDIO_IDEAS || [];

  return (
    <div className={`composer ${open ? "is-active" : ""}`}>
      <div className={`composer-bar ${open ? "is-open" : ""}`}>
        <window.Avatar src={window.USER.avatar} initials={window.USER.initials} size={38} />
        <textarea
          ref={ref}
          className="composer-input"
          rows={1}
          placeholder="What do you want to write about? A topic, a hot take, a link…"
          value={value}
          onChange={(e) => { onChange(e.target.value); if (seeded) setSeeded(false); }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") onGenerate(); }}
        />
        <kbd className="composer-kbd">⌘↵</kbd>
        <button
          className={`composer-spark ${ideas ? "is-on" : ""}`}
          aria-label="Ideas in your voice" aria-expanded={!!ideas}
          onMouseDown={keepFocus} onClick={toggleIdeas}
        >
          <window.IcSparkle size={18} />
        </button>
      </div>

      {ideas ? (
        <div className="composer-shelf composer-shelf--ideas">
          <div className="ideas-head">
            <span className="ideas-cap"><window.IcSparkle size={12} />Ideas in your voice</span>
            <div className="ideas-head-acts">
              {ideas === "results" && (
                <button className="ideas-iconbtn" aria-label="More ideas" title="More ideas" onMouseDown={keepFocus} onClick={brainstorm}><window.IcTweak size={16} /></button>
              )}
              <button className="ideas-iconbtn" aria-label="Close ideas" onMouseDown={keepFocus} onClick={() => setIdeas(null)}><window.IcX size={16} /></button>
            </div>
          </div>
          {ideas === "loading" ? (
            <>
              <div className="ideas-loading"><span className="spark"><window.IcSparkle size={17} /></span><span className="ideas-loading-text">Brainstorming ideas in your voice…</span></div>
              <div className="ideas-skel-list"><div className="ideas-skel-card" /><div className="ideas-skel-card" /><div className="ideas-skel-card" /></div>
            </>
          ) : ideas === "empty" ? (
            <div className="ideas-empty">
              <div className="ideas-empty-t">No fresh ideas this time</div>
              <div className="ideas-empty-s">Pennedly didn’t find a new angle worth pitching just now. Try again, or start from a quick-start chip below.</div>
              <div className="ideas-empty-acts">
                <button className="ideas-retry" onMouseDown={keepFocus} onClick={brainstorm}><window.IcTweak size={15} />Try again</button>
                <button className="ideas-ghostbtn" onMouseDown={keepFocus} onClick={() => setIdeas(null)}>Close</button>
              </div>
            </div>
          ) : ideas === "error" ? (
            <div className="ideas-error">
              <span className="ie-ico"><window.IcAlert size={17} /></span>
              <span className="ideas-error-text">Couldn’t reach the idea service. Your brief is safe.</span>
              <button className="ideas-retry" onMouseDown={keepFocus} onClick={brainstorm}><window.IcUndo size={15} />Try again</button>
            </div>
          ) : (
            <div className="ideas-list">
              {IDEAS.map((d, i) => (
                <button key={i} className="idea-card" onMouseDown={keepFocus} onClick={() => pickIdea(d.hook)}>
                  <span className="idea-text"><span className="idea-hook">{d.hook}</span><span className="idea-angle">{d.angle}</span></span>
                  <span className="idea-use"><window.IcArrowUp size={14} />Use</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : open ? (
        <div className="composer-shelf">
          <div className="chips">
            <button className="chip chip--ideas" onMouseDown={keepFocus} onClick={brainstorm}><window.IcSparkle size={13} className="chip-ico" />Ideas</button>
            {COMPOSER_CHIPS.map((c) => (
              <button key={c} className="chip" onMouseDown={keepFocus} onClick={() => onChange(c)}><window.IcSparkle size={13} className="chip-ico" />{c}</button>
            ))}
          </div>
          <div className="composer-shelf-tools">
            <span className="composer-shelf-lbl">Drafts</span>
            <div className="count-seg" role="radiogroup" aria-label="Drafts to generate">
              {[1, 2, 3, 4].map((n) => (
                <b key={n} className={count === n ? "on" : ""} role="radio" aria-checked={count === n} onMouseDown={keepFocus} onClick={() => onCount(n)}>{n}</b>
              ))}
            </div>
            {seeded && <span className="ideas-seeded-note"><window.IcSparkle size={13} />Seeded from an idea</span>}
            <span className="composer-spacer" />
            <button className="btn btn--primary" onClick={onGenerate} disabled={!hasText}>
              <window.IcNib size={16} /> Generate
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ----------------------------- Skeleton card --------------------------- */
function SkeletonCard() {
  return (
    <div className="draft skeleton" aria-hidden="true">
      <div className="draft-head">
        <div className="skel-line" style={{ width: 34, height: 34, borderRadius: 999 }} />
        <div style={{ flex: 1 }}>
          <div className="skel-line" style={{ width: 120, marginBottom: 6 }} />
          <div className="skel-line" style={{ width: 80, height: 9 }} />
        </div>
      </div>
      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 9 }}>
        <div className="skel-line" style={{ width: "96%" }} />
        <div className="skel-line" style={{ width: "100%" }} />
        <div className="skel-line" style={{ width: "62%" }} />
      </div>
    </div>
  );
}

/* ----------------------------- Empty states ---------------------------- */
const EMPTY = {
  draft: {
    title: "No drafts waiting",
    sub: "You're all caught up. Start a new one above and Pennedly will draft it in your voice.",
    cta: "Write something",
  },
  ready: {
    title: "Nothing ready to publish",
    sub: "Approve a draft and it'll wait here until you're ready to send it to Threads.",
  },
  published: {
    title: "Nothing published yet",
    sub: "Approved drafts you publish will live here, with their Threads stats.",
  },
  rejected: {
    title: "No rejected drafts",
    sub: "Drafts you pass on land here. Nothing's been turned down — nice and tidy.",
  },
};

function EmptyState({ status, onCta }) {
  const e = EMPTY[status];
  return (
    <div className="empty">
      <div className="empty-mark"><window.IcNib size={24} /></div>
      <div className="empty-title">{e.title}</div>
      <div className="empty-sub">{e.sub}</div>
      {e.cta && <button className="btn btn--secondary" onClick={onCta}>{e.cta}</button>}
    </div>
  );
}

/* ------------------------------- First run ----------------------------- */
function FirstRun({ onSetup }) {
  return (
    <div className="firstrun">
      <window.Logo size={46} radius={12} className="fr-mark" />
      <p className="fr-eyebrow">Welcome to Pennedly</p>
      <h2>First, let's capture your voice.</h2>
      <p>Pennedly drafts posts and replies that sound like <em>you</em> — then waits for your approval. To do that well, it needs a few samples of how you actually write. It takes about two minutes.</p>
      <div className="fr-steps">
        <div className="fr-step"><span className="fr-num">1</span><div><div className="fs-t">Paste a few of your posts</div><div className="fs-d">Five to ten is plenty. Pennedly studies your rhythm, length, and the things you'd never say.</div></div></div>
        <div className="fr-step"><span className="fr-num">2</span><div><div className="fs-t">Set a couple of guardrails</div><div className="fs-d">No hashtags, no em-dashes, keep it under three sentences — whatever makes it yours.</div></div></div>
        <div className="fr-step"><span className="fr-num">3</span><div><div className="fs-t">Generate your first drafts</div><div className="fs-d">Review every word and approve what ships. Nothing posts without you.</div></div></div>
      </div>
      <div className="fr-actions">
        <button className="btn btn--primary" onClick={onSetup}><window.IcVoice size={16} /> Set up your voice</button>
        <span style={{ fontSize: "var(--text-small)", color: "var(--color-text-subtle)", whiteSpace: "nowrap" }}>~2 minutes</span>
      </div>
      <div className="composer composer--disabled fr-disabled-composer" style={{ marginTop: 22 }} aria-hidden="true">
        <div className="composer-bar">
          <window.Avatar src={window.USER.avatar} initials={window.USER.initials} size={38} />
          <div className="composer-input" style={{ color: "var(--color-text-subtle)", alignSelf: "center" }}>Set up your voice to start drafting…</div>
          <kbd className="composer-kbd">⌘↵</kbd>
          <span className="composer-spark"><window.IcSparkle size={18} /></span>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- Publish dialog -------------------------- */
function PublishDialog({ draft, onCancel, onConfirm }) {
  const len = draft.text.length;
  const over = len > LIMIT;
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onCancel]);
  return (
    <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="dialog" role="dialog" aria-modal="true" aria-label="Publish to Threads">
        <div className="dialog-head">
          <span className="dialog-mark"><window.IcStudio size={18} /></span>
          <div>
            <div className="dialog-title">Publish to Threads?</div>
            <div className="dialog-sub">This posts immediately and publicly. You can still delete it from Threads afterwards.</div>
          </div>
        </div>
        <div className="pub-account">
          <window.Avatar src={window.USER.avatar} initials={window.USER.initials} size={30} />
          <div className="pa-t"><b>{window.USER.name}</b> <span>{window.USER.handle}</span></div>
        </div>
        <div className="pub-preview">{draft.text}</div>
        <CharMeter len={len} />
        <div className="dialog-actions">
          <button className="btn btn--ghost" onClick={onCancel}>Cancel</button>
          <button className="btn btn--primary" onClick={onConfirm} disabled={over}>
            <window.IcCheck size={16} /> {over ? "Too long to publish" : "Publish now"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------- Toasts ------------------------------- */
function Toasts({ toasts, onUndo, onDismiss }) {
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

/* ----------------------------- Error banner ---------------------------
   Now the shared <window.ErrorBanner> from shell-parts.jsx (§3.8). */

Object.assign(window, {
  CharMeter, FilterTabs, Topbar, Composer,
  SkeletonCard, EmptyState, FirstRun, PublishDialog, Toasts, LIMIT,
});
