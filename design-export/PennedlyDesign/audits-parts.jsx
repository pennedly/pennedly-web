// audits-parts.jsx — list view, coach narrative, list row, and states.
// Sidebar/account/avatar come from the shared shell. No hardcoded hex.

/* status helpers ------------------------------------------------------- */
const STATUS = {
  undecided: { label: "Needs review", color: "var(--color-accent)" },
  applied:   { label: "Applied",      color: "var(--color-success)" },
  rejected:  { label: "Rejected",     color: "var(--color-danger)" },
};
function counts(audit) {
  const c = { undecided: 0, applied: 0, rejected: 0 };
  audit.changes.forEach((ch) => { c[ch.status] = (c[ch.status] || 0) + 1; });
  c.total = audit.changes.length;
  c.decided = c.applied + c.rejected;
  return c;
}
function ChangeStatusBadge({ status }) {
  const s = STATUS[status] || STATUS.applied;
  return (
    <span className="badge" style={{
      background: `color-mix(in srgb, ${s.color} 12%, var(--color-surface))`,
      color: s.color, borderColor: `color-mix(in srgb, ${s.color} 30%, transparent)`,
    }}>
      <span className="pill-dot" style={{ color: s.color }} />{s.label}
    </span>
  );
}

/* -------------------------------- Topbar ------------------------------- */
function Topbar({ dark, onToggleTheme, reviewCount }) {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <span className="topbar-title">Audits</span>
        {reviewCount > 0
          ? <span className="status-pill status-pill--accent"><span className="pill-dot" />{reviewCount} to review</span>
          : <span className="status-pill status-pill--success"><span className="pill-dot" />All reviewed</span>}
        <span className="topbar-spacer" />
        <div className="topbar-actions">
          <button className="icon-btn" aria-label="Toggle theme" onClick={onToggleTheme}>{dark ? <window.IcSun size={17} /> : <window.IcMoon size={16} />}</button>
          <button className="icon-btn" aria-label="Settings"><window.IcSettings size={17} /></button>
        </div>
      </div>
    </header>
  );
}

/* ------------------------------ Audit row ------------------------------ */
function AuditRow({ audit, onOpen }) {
  const c = counts(audit);
  const isNew = c.undecided > 0;
  const wow = audit.wowDelta;
  return (
    <button className={`audit-row ${isNew ? "audit-row--new" : ""}`} onClick={() => onOpen(audit.id)}>
      <div className="ar-main">
        <div className="ar-date">{audit.title}</div>
        <div className="ar-summary">{audit.summary}</div>
        <div className="ar-meta">
          <span className="am">{audit.range}</span>
          <span className="am-sep">·</span>
          <span className="am">{audit.postsAnalyzed} posts analyzed</span>
          <span className="am-sep">·</span>
          <span className="am">{c.decided} of {c.total} decided</span>
          {wow != null && (
            <span className={`am-wow ${wow >= 0 ? "am-wow--up" : "am-wow--down"}`}>
              {wow >= 0 ? <window.IcArrowUp size={12} /> : <window.IcArrowDown size={12} />}{Math.abs(wow)}% WoW
            </span>
          )}
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
            <div className="skel-line" style={{ width: 240, height: 10, marginTop: 12 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------- Toasts ------------------------------- */
function Toasts({ toasts }) {
  return (
    <div className="toast-host">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.kind === "error" ? "error" : "success"}`}>
          <span className="toast-mark" />
          <div className="toast-body"><div className="toast-title">{t.title}</div>{t.sub && <div className="toast-sub">{t.sub}</div>}</div>
        </div>
      ))}
    </div>
  );
}

Object.assign(window, { STATUS, counts, ChangeStatusBadge, Topbar, AuditRow, CoachNarrative, EmptyState, SkeletonList, Toasts });
