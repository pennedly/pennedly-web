// stylerules-parts.jsx — presentational blocks for Style & reply rules.
// Sidebar / account / avatar come from the shared shell (shell-parts.jsx).
// All visuals reference the ink-on-paper tokens; no hardcoded colours.

const { useState: srS, useEffect: srE, useRef: srR } = React;

/* -------------------------------- Topbar ------------------------------- */
function Topbar({ dark, onToggleTheme, activeCount, total }) {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <span className="topbar-title">Style &amp; reply rules</span>
        <span className="status-pill"><span className="pill-dot" />{activeCount} of {total} on</span>
        <span className="topbar-spacer" />
        <div className="topbar-actions">
          <button className="icon-btn" aria-label="Toggle theme" onClick={onToggleTheme}>
            {dark ? <window.IcSun size={17} /> : <window.IcMoon size={16} />}
          </button>
          <a className="icon-btn" href="Settings.html" aria-label="Settings"><window.IcSettings size={17} /></a>
        </div>
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
        Every post and reply Pennedly writes runs through these. Add your own rules in plain words,
        then switch on the built-in fixes that strip the tells of machine writing.
      </p>
      <div className="intro-stats">
        <span className="istat"><b>{freeformCount}</b> of your own</span>
        <span className="sep" />
        <span className="istat"><b>{builtinOn}</b> of {builtinTotal} built-in active</span>
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

/* --------------------------- Applies-to chip --------------------------- */
function KindChip({ kind, only }) {
  if (!kind || kind === "all") return null;
  const base = kind === "post" ? "Posts" : "Replies";
  return <span className={`kind-chip kind-chip--${kind}`}>{only ? base + " only" : base}</span>;
}

/* ---------------------- Deterministic stripper note -------------------- */
function StripperNote({ rule }) {
  return (
    <div className={`stripper ${rule.on ? "" : "stripper--off"}`}>
      <div className="strip-note"><window.IcSliders size={13} className="sn-ico" /><span>{rule.note}</span></div>
      <div className="strip-demo" aria-hidden="true">
        <code className="sd-from">{rule.demo.from}</code>
        <span className="sd-arrow">{"\u2192"}</span>
        <code className="sd-to">{rule.on ? rule.demo.to : rule.demo.from}</code>
      </div>
    </div>
  );
}

/* ----------------------------- Built-in rule --------------------------- */
function BuiltinRow({ r, onToggle }) {
  return (
    <div className={`rule ${r.on ? "" : "is-off"}`}>
      <div className="rule-toggle"><Switch checked={r.on} onChange={() => onToggle(r.id)} label={`${r.title} — ${r.on ? "on" : "off"}`} /></div>
      <div className="rule-body">
        <div className="rule-top">
          <span className="rule-title">{r.title}</span>
          <KindChip kind={r.applies} only />
        </div>
        <div className="rule-desc">{r.desc}</div>
        {r.stripper && <StripperNote rule={r} />}
      </div>
    </div>
  );
}

/* --------------------- Built-in section (by category) ------------------ */
function BuiltinSection({ rules, categories, onToggle }) {
  const onCount = rules.filter((r) => r.on).length;
  return (
    <section className="sec">
      <div className="sec-head">
        <span className="sec-mark"><window.IcFilter size={17} /></span>
        <div className="sec-ttl">
          <div className="h">Anti-AI-tells <span className="count">{onCount}/{rules.length}</span></div>
          <div className="d">A fixed catalog of fixes that keep drafts from sounding generated</div>
        </div>
      </div>
      <div className="cat-groups">
        {categories.map((cat) => {
          const items = rules.filter((r) => r.category === cat);
          if (!items.length) return null;
          const cOn = items.filter((r) => r.on).length;
          return (
            <div className="cat-group" key={cat}>
              <div className="cat-head"><span className="cat-name">{cat}</span><span className="cat-count">{cOn}/{items.length}</span></div>
              <div className="rules">
                {items.map((r) => <BuiltinRow key={r.id} r={r} onToggle={onToggle} />)}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* --------------------------- Freeform rule row ------------------------- */
function FreeformRow({ rule, leaving, onEdit, onToggle, onRemove }) {
  const [editing, setEditing] = srS(false);
  const [draft, setDraft] = srS(rule.text);
  const [confirming, setConfirming] = srS(false);
  const ref = srR(null);
  srE(() => { if (editing && ref.current) { ref.current.focus(); ref.current.select(); } }, [editing]);
  function save() { const v = draft.trim(); if (v) onEdit(rule.id, v); setEditing(false); }
  return (
    <div className={`ff-row ${leaving ? "ff-row--leaving" : ""} ${rule.enabled ? "" : "is-off"}`}>
      <div className="ff-toggle"><Switch checked={rule.enabled} onChange={() => onToggle(rule.id)} label={`${rule.enabled ? "Disable" : "Enable"} this rule`} /></div>
      {editing ? (
        <div className="ff-edit">
          <input
            ref={ref} className="ff-input" value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") { setDraft(rule.text); setEditing(false); } }}
            aria-label="Edit rule"
          />
          <button className="btn btn--primary btn--sm" onClick={save} disabled={!draft.trim()}><window.IcCheck size={15} /></button>
          <button className="btn btn--ghost btn--sm" onClick={() => { setDraft(rule.text); setEditing(false); }}>Cancel</button>
        </div>
      ) : (
        <>
          <div className="ff-main">
            <span className="ff-text">{rule.text}</span>
          </div>
          <KindChip kind={rule.kind} />
          {confirming ? (
            <span className="ff-confirm">
              <span className="ffc-q">Delete?</span>
              <button className="btn btn--danger btn--sm" onClick={() => onRemove(rule.id)}>Delete</button>
              <button className="btn btn--ghost btn--sm" onClick={() => setConfirming(false)}>Cancel</button>
            </span>
          ) : (
            <span className="ff-actions">
              <button className="ff-icon" aria-label="Edit rule" onClick={() => { setDraft(rule.text); setEditing(true); }}><window.IcPencil size={15} /></button>
              <button className="ff-icon danger" aria-label="Remove rule" onClick={() => setConfirming(true)}><window.IcTrash size={15} /></button>
            </span>
          )}
        </>
      )}
    </div>
  );
}

/* --------------------------- Add-a-rule input -------------------------- */
const KIND_OPTS = [["all", "Both"], ["post", "Posts"], ["reply", "Replies"]];
function AddRule({ solo, onAdd }) {
  const [value, setValue] = srS("");
  const [kind, setKind] = srS("all");
  function add() { const v = value.trim(); if (!v) return; onAdd(v, kind); setValue(""); setKind("all"); }
  return (
    <div className={`ff-add ${solo ? "ff-add--solo" : ""}`}>
      <input
        className="add-field" value={value} placeholder="Add a rule in your own words…"
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") add(); }}
        aria-label="New rule"
      />
      <div className="kind-seg" role="group" aria-label="Applies to">
        {KIND_OPTS.map(([k, l]) => (
          <button key={k} type="button" className={`kseg ${kind === k ? "kseg--active" : ""}`} aria-pressed={kind === k} onClick={() => setKind(k)}>{l}</button>
        ))}
      </div>
      <button className="btn btn--primary" onClick={add} disabled={!value.trim()}><window.IcPlus size={16} /> Add</button>
    </div>
  );
}

/* ----------------------------- Freeform card --------------------------- */
function FreeformSection({ rules, leavingIds, hints, onAdd, onEdit, onToggle, onRemove }) {
  const empty = rules.length === 0;
  const onCount = rules.filter((r) => r.enabled).length;
  return (
    <section className="sec">
      <div className="sec-head">
        <span className="sec-mark"><window.IcPenLine size={17} /></span>
        <div className="sec-ttl">
          <div className="h">Your rules {!empty && <span className="count">{onCount}/{rules.length}</span>}</div>
          <div className="d">Anything else Pennedly should always do — in your words</div>
        </div>
      </div>

      {empty ? (
        <>
          <div className="ff-empty">
            <span className="fe-mark"><window.IcPenLine size={22} /></span>
            <div className="fe-title">No rules of your own yet</div>
            <div className="fe-sub">Add a habit Pennedly should always follow. Short and specific works best — and you can scope each one to posts or replies.</div>
            <div className="ff-hints">
              {hints.map((h) => (
                <button key={h} className="ff-hint" onClick={() => onAdd(h, "all")}>{h}</button>
              ))}
            </div>
          </div>
          <div className="ff-empty-add"><AddRule solo onAdd={onAdd} /></div>
        </>
      ) : (
        <>
          <div className="ff-list">
            {rules.map((r) => (
              <FreeformRow key={r.id} rule={r} leaving={leavingIds.includes(r.id)} onEdit={onEdit} onToggle={onToggle} onRemove={onRemove} />
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
  Topbar, Intro, Switch, KindChip, StripperNote, BuiltinRow, BuiltinSection,
  FreeformRow, AddRule, FreeformSection, RulesSkeleton, Toasts,
});
