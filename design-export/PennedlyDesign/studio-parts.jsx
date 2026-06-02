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

/* ------------------------------- Composer ------------------------------ */
const COMPOSER_CHIPS = [
  "A lesson from this week",
  "React to a trend",
  "Reply to recent mentions",
  "An unpopular opinion",
];

function Composer({ value, onChange, onGenerate, busy, count, onCount }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, [value]);

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

  return (
    <div className="composer">
      <div className="composer-top">
        <window.Avatar src={window.USER.avatar} initials={window.USER.initials} size={38} />
        <textarea
          ref={ref}
          className="composer-input"
          rows={1}
          placeholder="What do you want to write about? A topic, a hot take, a link…"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") onGenerate();
          }}
        />
      </div>
      <div className="composer-row">
        <div className="chips">
          {COMPOSER_CHIPS.map((c) => (
            <button key={c} className="chip" onClick={() => onChange(c)}>
              <window.IcSparkle size={13} className="chip-ico" />{c}
            </button>
          ))}
        </div>
        <div className="composer-tools">
          <select className="field count-select" value={count} onChange={(e) => onCount(Number(e.target.value))} aria-label="Drafts to generate">
            <option value={1}>1 draft</option>
            <option value={2}>2 drafts</option>
            <option value={3}>3 drafts</option>
            <option value={4}>4 drafts</option>
          </select>
          <button className="btn btn--primary" onClick={onGenerate} disabled={!value.trim()}>
            <window.IcNib size={16} /> Generate
          </button>
        </div>
      </div>
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
      <div className="composer fr-disabled-composer" style={{ marginTop: 22 }}>
        <div className="composer-top">
          <window.Avatar src={window.USER.avatar} initials={window.USER.initials} size={38} />
          <div className="composer-input" style={{ color: "var(--color-text-subtle)" }}>Set up your voice to start drafting…</div>
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
