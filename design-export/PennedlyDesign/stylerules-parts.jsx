// stylerules-parts.jsx — shell + presentational blocks for Style & reply rules.
// All visuals reference the ink-on-paper tokens; no hardcoded colours.

const { useState: srS, useEffect: srE, useRef: srR } = React;

/* ------------------------------- Avatar -------------------------------- */
function Mono({ text, size = 34, font = 13 }) {
  return <span className="mono" style={{ width: size, height: size, fontSize: font }}>{text}</span>;
}

/* ------------------------------- Sidebar ------------------------------- */
function Sidebar() {
  const nav = [
    { id: "studio",   label: "Studio",   Icon: window.IcStudio,   href: "Studio.html", badge: 4 },
    { id: "feed",     label: "My Feed",  Icon: window.IcFeed,     href: "Feed.html" },
    { id: "stats",    label: "Stats",    Icon: window.IcChart,    href: "Stats.html" },
    { id: "replies",  label: "Replies",  Icon: window.IcReplies,  href: "Replies.html", badge: 3 },
    { id: "autopilot",label: "Autopilot",Icon: window.IcBolt,     href: "Autopilot.html" },
    { id: "voice",    label: "Voice",    Icon: window.IcVoice,    href: "Voice.html" },
    { id: "rules",    label: "Rules",    Icon: window.IcSliders,  active: true },
    { id: "settings", label: "Settings", Icon: window.IcSettings },
  ];
  return (
    <aside className="sidebar">
      <div className="brand">
        <window.Logo size={34} radius={10} className="brand-mark" />
        <div>
          <div className="brand-name">Pennedly</div>
          <div className="brand-sub">Drafting partner</div>
        </div>
      </div>
      <nav className="nav">
        <div className="nav-cap">Workspace</div>
        {nav.map(({ id, label, Icon, active, badge, href }) => (
          <a key={id} className={`nav-item ${active ? "nav-item--active" : ""}`} href={href || undefined} tabIndex="0">
            <Icon size={16} />
            <span className="nav-label">{label}</span>
            {badge ? <span className="nav-badge">{badge}</span> : null}
          </a>
        ))}
      </nav>
      <div className="sidebar-foot">
        <button className="account">
          <Mono text={window.SR_USER.initials} size={32} font={12} />
          <div className="who">
            <div className="nm">{window.SR_USER.name}</div>
            <div className="hd">{window.SR_USER.handle}</div>
          </div>
          <window.IcChevDown size={15} className="chev" />
        </button>
      </div>
    </aside>
  );
}

/* -------------------------------- Topbar ------------------------------- */
function Topbar({ dark, onToggleTheme, activeCount, total }) {
  return (
    <header className="topbar">
      <span className="topbar-title">Style &amp; reply rules</span>
      <span className="topbar-meta"><span className="vdot" />{activeCount} of {total} rules on</span>
      <span className="topbar-spacer" />
      <div className="topbar-actions">
        <button className="icon-btn" aria-label="Toggle theme" onClick={onToggleTheme}>
          {dark ? <window.IcSun size={17} /> : <window.IcMoon size={16} />}
        </button>
        <button className="icon-btn" aria-label="Settings"><window.IcSettings size={17} /></button>
      </div>
    </header>
  );
}

/* -------------------------------- Intro -------------------------------- */
function Intro({ builtinOn, builtinTotal, freeformCount }) {
  return (
    <div className="intro">
      <span className="intro-eyebrow"><window.IcSliders size={14} className="ie-ico" /> Generation rules</span>
      <h1 className="intro-title">The rules behind every draft</h1>
      <p className="intro-lead">
        Every post and reply Pennedly writes runs through these. Switch on the built-in fixes that strip
        the tells of machine writing, then add your own rules in plain words.
      </p>
      <div className="intro-stats">
        <span className="istat"><b>{builtinOn}</b> of {builtinTotal} built-in active</span>
        <span className="sep" />
        <span className="istat"><b>{freeformCount}</b> of your own</span>
      </div>
    </div>
  );
}

/* -------------------------------- Switch ------------------------------- */
function Switch({ checked, onChange, label }) {
  return (
    <label className="switch" title={label}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} aria-label={label} />
      <span className="track" />
      <span className="knob" />
    </label>
  );
}

/* ----------------------------- Built-in rules -------------------------- */
function BuiltinSection({ rules, kinds, filter, onFilter, onToggle }) {
  const onCount = rules.filter((r) => r.on).length;
  const counts = kinds.reduce((a, k) => { a[k] = rules.filter((r) => r.kind === k).length; return a; }, {});
  const visible = filter === "All" ? rules : rules.filter((r) => r.kind === filter);
  return (
    <section className="sec">
      <div className="sec-head">
        <span className="sec-mark"><window.IcFilter size={17} /></span>
        <div className="sec-ttl">
          <div className="h">Anti-AI-tells <span className="count">{onCount}/{rules.length}</span></div>
          <div className="d">Built-in fixes that keep drafts from sounding generated</div>
        </div>
      </div>
      <div className="filterbar" role="tablist" aria-label="Filter rules by kind">
        <button className={`fchip ${filter === "All" ? "fchip--active" : ""}`} onClick={() => onFilter("All")} role="tab" aria-selected={filter === "All"}>
          All<span className="fc-n">{rules.length}</span>
        </button>
        {kinds.map((k) => (
          <button key={k} className={`fchip ${filter === k ? "fchip--active" : ""}`} onClick={() => onFilter(k)} role="tab" aria-selected={filter === k}>
            {k}<span className="fc-n">{counts[k]}</span>
          </button>
        ))}
      </div>
      <div className="rules">
        {visible.length === 0 ? (
          <div className="rule-none">No rules in this category.</div>
        ) : visible.map((r) => (
          <div className={`rule ${r.on ? "" : "is-off"}`} key={r.id}>
            <div className="rule-toggle"><Switch checked={r.on} onChange={() => onToggle(r.id)} label={`${r.title} — ${r.on ? "on" : "off"}`} /></div>
            <div className="rule-body">
              <div className="rule-top">
                <span className="rule-title">{r.title}</span>
                <span className="rule-kind">{r.kind}</span>
              </div>
              <div className="rule-desc">{r.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* --------------------------- Freeform rule row ------------------------- */
function FreeformRow({ rule, leaving, onEdit, onRemove }) {
  const [editing, setEditing] = srS(false);
  const [draft, setDraft] = srS(rule.text);
  const ref = srR(null);
  srE(() => { if (editing && ref.current) { ref.current.focus(); ref.current.select(); } }, [editing]);
  function save() { const v = draft.trim(); if (v) onEdit(rule.id, v); setEditing(false); }
  return (
    <div className={`ff-row ${leaving ? "ff-row--leaving" : ""}`}>
      <span className="ff-bullet" />
      {editing ? (
        <div className="ff-edit">
          <input
            ref={ref} className="ff-input" value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") { setDraft(rule.text); setEditing(false); } }}
          />
          <button className="btn btn--primary btn--sm" onClick={save} disabled={!draft.trim()}><window.IcCheck size={15} /></button>
          <button className="btn btn--ghost btn--sm" onClick={() => { setDraft(rule.text); setEditing(false); }}>Cancel</button>
        </div>
      ) : (
        <>
          <span className="ff-text">{rule.text}</span>
          <span className="ff-actions">
            <button className="ff-icon" aria-label="Edit rule" onClick={() => { setDraft(rule.text); setEditing(true); }}><window.IcPencil size={15} /></button>
            <button className="ff-icon danger" aria-label="Remove rule" onClick={() => onRemove(rule.id)}><window.IcTrash size={15} /></button>
          </span>
        </>
      )}
    </div>
  );
}

/* --------------------------- Add-a-rule input -------------------------- */
function AddRule({ solo, onAdd }) {
  const [value, setValue] = srS("");
  function add() { const v = value.trim(); if (!v) return; onAdd(v); setValue(""); }
  return (
    <div className={`ff-add ${solo ? "ff-add--solo" : ""}`}>
      <input
        className="add-field" value={value} placeholder="Add a rule in your own words…"
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") add(); }}
        aria-label="New rule"
      />
      <button className="btn btn--primary" onClick={add} disabled={!value.trim()}><window.IcPlus size={16} /> Add rule</button>
    </div>
  );
}

/* ----------------------------- Freeform card --------------------------- */
function FreeformSection({ rules, leavingIds, hints, onAdd, onEdit, onRemove }) {
  const empty = rules.length === 0;
  return (
    <section className="sec">
      <div className="sec-head">
        <span className="sec-mark"><window.IcPenLine size={17} /></span>
        <div className="sec-ttl">
          <div className="h">Your rules {!empty && <span className="count">{rules.length}</span>}</div>
          <div className="d">Anything else Pennedly should always do — in your words</div>
        </div>
      </div>

      {empty ? (
        <>
          <div className="ff-empty">
            <span className="fe-mark"><window.IcPenLine size={22} /></span>
            <div className="fe-title">No rules of your own yet</div>
            <div className="fe-sub">Add a habit Pennedly should always follow. Short and specific works best.</div>
            <div className="ff-hints">
              {hints.map((h) => (
                <button key={h} className="ff-hint" onClick={() => onAdd(h)}>{h}</button>
              ))}
            </div>
          </div>
          <div className="ff-empty-add"><AddRule solo onAdd={onAdd} /></div>
        </>
      ) : (
        <>
          <div className="ff-list">
            {rules.map((r) => (
              <FreeformRow key={r.id} rule={r} leaving={leavingIds.includes(r.id)} onEdit={onEdit} onRemove={onRemove} />
            ))}
          </div>
          <AddRule onAdd={onAdd} />
        </>
      )}
    </section>
  );
}

/* ------------------------------ Skeleton ------------------------------- */
function RulesSkeleton() {
  return (
    <>
      <div className="intro skel">
        <div className="skel-line" style={{ width: 130, height: 10 }} />
        <div className="skel-line" style={{ width: 320, height: 26, marginTop: 14 }} />
        <div className="skel-line" style={{ width: "80%", height: 12, marginTop: 14 }} />
        <div className="skel-line" style={{ width: 220, height: 11, marginTop: 14 }} />
      </div>
      <section className="sec skel">
        <div className="sec-head">
          <div className="skel-block" style={{ width: 34, height: 34 }} />
          <div style={{ flex: 1 }}>
            <div className="skel-line" style={{ width: 150, height: 14, marginBottom: 7 }} />
            <div className="skel-line" style={{ width: 230, height: 9 }} />
          </div>
        </div>
        <div style={{ padding: "0 18px 14px", display: "flex", gap: 6 }}>
          {[60, 80, 74, 70].map((w, i) => <div className="skel-block" key={i} style={{ width: w, height: 26 }} />)}
        </div>
        <div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div className="skel-rule" key={i}>
              <div className="skel-block" style={{ width: 40, height: 23, borderRadius: 999 }} />
              <div style={{ flex: 1 }}>
                <div className="skel-line" style={{ width: 160, height: 12, marginBottom: 8 }} />
                <div className="skel-line" style={{ width: "70%", height: 10 }} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

/* -------------------------------- Toasts ------------------------------- */
function Toasts({ toasts, onUndo }) {
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

Object.assign(window, {
  Mono, Sidebar, Topbar, Intro, Switch,
  BuiltinSection, FreeformRow, AddRule, FreeformSection,
  RulesSkeleton, Toasts,
});
