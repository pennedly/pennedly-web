// audits-app.jsx — Audits: list ⇄ detail, approve/reject decisions, states.

/* ── DEV HANDOFF · Audits ───────────────────────────────────────────
 * Route / shell:   /app/audits (list) + /app/audits/{id} (detail). Full app
 *                  shell, sidebar = yes; active="audits".
 * Purpose:         Pennedly's weekly coach reviews the account and proposes
 *                  voice/strategy changes; the user approves or rejects each.
 * Content width:   reading (--content-reading, 720); topbar .topbar-inner (no --wide).
 * Topbar:          title="Audits"; .status-pill — accent "N to review" / success
 *                  "All reviewed"; actions = theme, settings.
 * Sections (top→bottom):
 *   - LIST: intro + audit rows (status pill · period range · posts analyzed ·
 *     "N of M decided" · week-over-week delta).
 *   - DETAIL: back link, header + decision tally, the coach's narrative, then each
 *     proposed change as a card (approve/reject + optional note; diff viewer; an
 *     autopilot_config change also shows its posting hours in LOCAL time).
 * States:          loading (skeleton list) · live · empty (no audits yet).
 *                  Driven by the `state` tweak; real app: loading on fetch.
 * Data shown:      list row metrics above; per change — kind, title, detail,
 *                  status badge, optional diff, optional note, and (once applied)
 *                  the measured effect %.
 * Interactions:    open row → detail. On an UNDECIDED change: Approve → Applied
 *                  (immediately, effect measured later) / Reject → Rejected; both
 *                  show a confirmation toast (NO undo — see gotcha). Add/edit a
 *                  note while undecided. Decided changes are READ-ONLY.
 * Localize:        end-user copy = intro, row labels, status badges, narrative
 *                  framing, change buttons/labels, autopilot hours caption + note,
 *                  empty copy, toasts. Audit content + numbers are SAMPLE data.
 * Backend truth:   APPEND-ONLY — a change is decided once, immediately, and cannot
 *                  be rolled back or reconsidered, so there is NO undo / rollback /
 *                  reconsider affordance anywhere. autopilot_config hours are
 *                  stored UTC and rendered in the viewer's local timezone.
 * Changed in rework: removed the invented rollback/reconsider (+ rolled-back
 *                  status) and the post-decision undo; decided changes now render
 *                  read-only. Adopted shared shell; reading width + aligned topbar;
 *                  .status-pill; added posts-analyzed + N-of-M-decided + WoW delta
 *                  to list rows; added an autopilot_config change with local-time
 *                  posting hours.
 * ─────────────────────────────────────────────────────────────────── */

const { useState: useAuS, useEffect: useAuE } = React;

const AUDIT_TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "dark": false,
  "state": "Live"
}/*EDITMODE-END*/;

function AuditsApp() {
  const [t, setTweak] = window.useTweaks(AUDIT_TWEAK_DEFAULTS);
  const [audits, setAudits] = useAuS(window.AUDITS);
  const [phase, setPhase] = useAuS("loading");
  const [view, setView] = useAuS("list");      // list | detail
  const [openId, setOpenId] = useAuS(null);
  const [toasts, setToasts] = useAuS([]);

  useAuE(() => {
    if (t.state === "Loading") { setPhase("loading"); return; }
    setPhase("loading");
    const id = setTimeout(() => setPhase("ready"), 850);
    return () => clearTimeout(id);
  }, [t.state]);
  useAuE(() => { document.documentElement.classList.toggle("dark", !!t.dark); }, [t.dark]);

  const live = t.state === "Empty" ? [] : audits;
  const reviewCount = live.reduce((a, au) => a + au.changes.filter((c) => c.status === "undecided").length, 0);
  const open = live.find((a) => a.id === openId);

  /* toasts — confirmation only; decisions are append-only (no undo) */
  function pushToast(toast) {
    const id = "t" + Date.now() + Math.random().toString(36).slice(2, 5);
    setToasts((ts) => [...ts, { ...toast, id }]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), 4200);
  }

  function patchChange(changeId, changes) {
    setAudits((as) => as.map((a) => a.id !== openId ? a : {
      ...a, changes: a.changes.map((c) => (c.id === changeId ? { ...c, ...changes } : c)),
    }));
  }
  const findCh = (id) => open && open.changes.find((c) => c.id === id);

  const approve = (id) => { const c = findCh(id); patchChange(id, { status: "applied", effect: null, effectLabel: c.effectLabel || "engagement" }); pushToast({ kind: "success", title: "Change approved", sub: "Applied now — Pennedly will measure the effect" }); };
  const reject = (id) => { patchChange(id, { status: "rejected" }); pushToast({ kind: "success", title: "Change rejected", sub: "Nothing changes in your voice" }); };
  const saveNote = (id, text) => { patchChange(id, { note: text || null }); pushToast({ kind: "success", title: text ? "Note saved" : "Note removed" }); };

  function openAudit(id) { setOpenId(id); setView("detail"); document.querySelector(".scroll")?.scrollTo(0, 0); }

  return (
    <div className="app">
      <window.Sidebar active="audits" />
      <div className="main">
        <window.Topbar dark={!!t.dark} onToggleTheme={() => setTweak("dark", !t.dark)} reviewCount={reviewCount} />
        <div className="scroll">
          <div className="content">
            {phase === "loading" ? (
              <>
                <div className="page-intro"><h1>Audits</h1><p>Your weekly voice &amp; strategy review from Pennedly's coach.</p></div>
                <window.SkeletonList />
              </>
            ) : view === "detail" && open ? (
              <AuditDetail audit={open} onBack={() => setView("list")}
                onApprove={approve} onReject={reject} onSaveNote={saveNote} />
            ) : (
              <>
                <div className="page-intro">
                  <h1>Audits</h1>
                  <p>Every week, Pennedly's coach reviews your account and proposes changes to your voice and strategy. You approve what's right — nothing happens without you.</p>
                </div>
                {live.length === 0 ? (
                  <window.EmptyState />
                ) : (
                  <div className="audit-list">
                    {live.map((a) => <window.AuditRow key={a.id} audit={a} onOpen={openAudit} />)}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <window.Toasts toasts={toasts} />

      <window.TweaksPanel>
        <window.TweakSection label="Appearance" />
        <window.TweakToggle label="Dark mode" value={!!t.dark} onChange={(v) => setTweak("dark", v)} />
        <window.TweakSection label="Preview state" />
        <window.TweakRadio label="State" value={t.state} options={["Live", "Loading", "Empty"]} onChange={(v) => setTweak("state", v)} />
      </window.TweaksPanel>
    </div>
  );
}

/* ----------------------------- Audit detail ---------------------------- */
function AuditDetail({ audit, onBack, onApprove, onReject, onSaveNote }) {
  const c = window.counts(audit);
  const isNew = c.undecided > 0;
  const stat = [
    { n: c.total, label: "suggestions", color: "var(--color-text-subtle)" },
    { n: c.applied, label: "applied", color: "var(--color-success)" },
    { n: c.rejected, label: "rejected", color: "var(--color-danger)" },
    { n: c.undecided, label: "pending", color: "var(--color-accent)" },
  ].filter((s, i) => i === 0 || s.n > 0);

  return (
    <>
      <button className="back-link" onClick={onBack}><window.IcArrowLeft size={16} /> All audits</button>
      <div className="ad-head">
        <div>
          <div className="ad-title">{audit.title}</div>
          <div className="ad-cap">{audit.range} · reviewed {audit.posted} · {audit.postsAnalyzed} posts analyzed</div>
        </div>
        {isNew
          ? <span className="badge" style={{ background: "color-mix(in srgb, var(--color-accent) 12%, var(--color-surface))", color: "var(--color-accent)", borderColor: "color-mix(in srgb, var(--color-accent) 30%, transparent)" }}><span className="pill-dot" />{c.undecided} to review</span>
          : <span className="badge badge--neutral">Reviewed</span>}
      </div>
      <div className="ad-stats">
        {stat.map((s) => (
          <span className="ad-stat" key={s.label}><span className="as-dot" style={{ background: s.color }} /><b>{s.n}</b> {s.label}</span>
        ))}
      </div>

      <window.CoachNarrative audit={audit} />

      <div className="changes-cap">Proposed changes</div>
      <div className="feed">
        {audit.changes.map((ch) => (
          <window.ChangeCard key={ch.id} change={ch}
            onApprove={onApprove} onReject={onReject} onSaveNote={onSaveNote} />
        ))}
      </div>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<AuditsApp />);
