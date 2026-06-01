// audits-parts.jsx — shell, list view, coach narrative, and states.
// Reuses Studio shell classes (studio.css) + ds tokens. No hardcoded hex.

function AMono({ text, size = 32, font = 12 }) {
  return <span className="mono" style={{ width: size, height: size, fontSize: font }}>{text}</span>;
}

/* status helpers ------------------------------------------------------- */
const STATUS = {
  undecided: { label: "Needs review", color: "var(--color-accent)" },
  applied:   { label: "Applied",      color: "var(--color-success)" },
  rejected:  { label: "Rejected",     color: "var(--color-danger)" },
  rolledback:{ label: "Rolled back",  color: "var(--color-ink-400)" },
};
function counts(audit) {
  const c = { undecided: 0, applied: 0, rejected: 0, rolledback: 0 };
  audit.changes.forEach((ch) => { c[ch.status] = (c[ch.status] || 0) + 1; });
  c.total = audit.changes.length;
  return c;
}
function ChangeStatusBadge({ status }) {
  const s = STATUS[status];
  const tint = status === "undecided" || status === "applied" || status === "rejected";
  return (
    <span className="badge" style={tint ? {
      background: `color-mix(in srgb, ${s.color} 12%, var(--color-surface))`,
      color: s.color, borderColor: `color-mix(in srgb, ${s.color} 30%, transparent)`,
    } : { background: "var(--color-surface-2)", color: "var(--color-text-muted)", borderColor: "var(--color-border)" }}>
      <span className="pill-dot" style={{ color: s.color }} />{s.label}
    </span>
  );
}

/* ------------------------------- Sidebar ------------------------------- */
function Sidebar({ reviewCount }) {
  const nav = [
    { id: "studio", label: "Studio", Icon: window.IcStudio, badge: 4 },
    { id: "feed", label: "My Feed", Icon: window.IcFeed },
    { id: "stats", label: "Stats", Icon: window.IcChart },
    { id: "audits", label: "Audits", Icon: window.IcAudit, active: true, badge: reviewCount || null },
    { id: "replies", label: "Replies", Icon: window.IcReplies, badge: 3 },
    { id: "voice", label: "Voice", Icon: window.IcVoice },
    { id: "settings", label: "Settings", Icon: window.IcSettings },
  ];
  return (
    <aside className="sidebar">
      <div className="brand">
        <window.Logo size={34} radius={10} className="brand-mark" />
        <div><div className="brand-name">Pennedly</div><div className="brand-sub">Drafting partner</div></div>
      </div>
      <nav className="nav">
        <div className="nav-cap">Workspace</div>
        {nav.map(({ id, label, Icon, active, badge }) => (
          <a key={id} className={`nav-item ${active ? "nav-item--active" : ""}`} tabIndex="0">
            <Icon size={16} /><span className="nav-label">{label}</span>
            {badge ? <span className="nav-badge">{badge}</span> : null}
          </a>
        ))}
      </nav>
      <div className="sidebar-foot">
        <button className="account">
          <AMono text={window.AUDIT_USER.initials} size={32} font={12} />
          <div className="who"><div className="nm">{window.AUDIT_USER.name}</div><div className="hd">{window.AUDIT_USER.handle}</div></div>
          <window.IcChevDown size={15} className="chev" />
        </button>
      </div>
    </aside>
  );
}

/* -------------------------------- Topbar ------------------------------- */
function Topbar({ dark, onToggleTheme, reviewCount }) {
  return (
    <header className="topbar">
      <span className="topbar-title">Audits</span>
      {reviewCount > 0 && <span className="topbar-pill"><span className="pdot" />{reviewCount} to review</span>}
      <span className="topbar-spacer" />
      <div className="topbar-actions">
        <button className="icon-btn" aria-label="Toggle theme" onClick={onToggleTheme}>{dark ? <window.IcSun size={17} /> : <window.IcMoon size={16} />}</button>
        <button className="icon-btn" aria-label="Settings"><window.IcSettings size={17} /></button>
      </div>
    </header>
  );
}

/* ------------------------------ Audit row ------------------------------ */
function AuditRow({ audit, onOpen }) {
  const c = counts(audit);
  const isNew = c.undecided > 0;
  return (
    <button className={`audit-row ${isNew ? "audit-row--new" : ""}`} onClick={() => onOpen(audit.id)}>
      <div className="ar-main">
        <div className="ar-date">{audit.title}</div>
        <div className="ar-summary">{audit.summary}</div>
        <div className="ar-meta">
          <span className="am"><window.IcAudit size={13} />{c.total} suggestions</span>
          {c.undecided > 0
            ? <span className="am" style={{ color: "var(--color-accent)" }}><span className="am-dot" style={{ background: "var(--color-accent)" }} />{c.undecided} to review</span>
            : <span className="am"><span className="am-dot" style={{ background: "var(--color-success)" }} />all reviewed</span>}
          {c.applied > 0 && <span className="am">{c.applied} applied</span>}
        </div>
      </div>
      <div className="ar-right">
        {isNew
          ? <span className="badge" style={{ background: "color-mix(in srgb, var(--color-accent) 12%, var(--color-surface))", color: "var(--color-accent)", borderColor: "color-mix(in srgb, var(--color-accent) 30%, transparent)" }}><span className="pill-dot" />Needs review</span>
          : <span className="badge badge--neutral">Reviewed</span>}
        <window.IcChevDown size={18} className="ar-chev" style={{ transform: "rotate(-90deg)" }} />
      </div>
    </button>
  );
}

/* --------------------------- Coach narrative --------------------------- */
function CoachNarrative({ audit }) {
  return (
    <div className="coach">
      <div className="coach-head">
        <window.Logo size={34} radius={9} className="coach-mark" />
        <div className="coach-who">
          <div className="cw-name">Pennedly Coach</div>
          <div className="cw-role">Weekly review · {audit.range}</div>
        </div>
      </div>
      <div className="coach-body">
        {audit.narrative.map((p, i) => <p key={i}>{p}</p>)}
      </div>
    </div>
  );
}

/* ------------------------------ Empty/Skel ----------------------------- */
function EmptyState() {
  return (
    <div className="audits-empty">
      <div className="ae-mark"><window.IcAudit size={26} /></div>
      <div className="ae-title">No audits yet</div>
      <div className="ae-sub">Pennedly's coach reviews your voice and strategy every week. Your first audit will land here after a few days of activity — you'll always approve changes before anything happens.</div>
    </div>
  );
}
function SkeletonList() {
  return (
    <div className="audit-list">
      {Array.from({ length: 4 }).map((_, i) => (
        <div className="audit-row skeleton" key={i} aria-hidden="true" style={{ cursor: "default" }}>
          <div className="ar-main">
            <div className="skel-line" style={{ width: 150, height: 18 }} />
            <div className="skel-line" style={{ width: "80%", height: 11, marginTop: 10 }} />
            <div className="skel-line" style={{ width: 220, height: 10, marginTop: 12 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------- Toasts ------------------------------- */
function Toasts({ toasts, onUndo }) {
  return (
    <div className="toast-host">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.kind === "error" ? "error" : "success"}`}>
          <span className="toast-mark" />
          <div className="toast-body"><div className="toast-title">{t.title}</div>{t.sub && <div className="toast-sub">{t.sub}</div>}</div>
          {t.undo && <button className="toast-undo" onClick={() => onUndo(t)}>Undo</button>}
        </div>
      ))}
    </div>
  );
}

Object.assign(window, { AMono, STATUS, counts, ChangeStatusBadge, Sidebar, Topbar, AuditRow, CoachNarrative, EmptyState, SkeletonList, Toasts });
