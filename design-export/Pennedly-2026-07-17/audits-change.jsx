// audits-change.jsx — a single proposed change. While undecided: approve /
// reject (+ optional note) and view the raw diff. Once decided it's READ-ONLY —
// the backend is append-only, so there's no rollback / reconsider affordance.

const { useState: useChS, useRef: useChR, useEffect: useChE } = React;

// local-time helpers for an autopilot_config change (hours are stored UTC).
function localHours(hoursUtc) {
  return hoursUtc.map((h) => {
    const d = new Date(Date.UTC(2026, 5, 2, h, 0, 0));
    return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  });
}
function utcLabel() {
  const off = -new Date().getTimezoneOffset() / 60;
  const sign = off >= 0 ? "+" : "-";
  const a = Math.abs(off), h = Math.floor(a), m = Math.round((a - h) * 60);
  return `UTC${sign}${h}${m ? ":" + String(m).padStart(2, "0") : ""}`;
}

// applied-effect chip: measuring while no number yet, else the measured % up/down.
function EffectChip({ status, effect, label }) {
  if (status !== "applied") return null;
  if (!effect) return <span className="effect effect--measuring"><window.IcClock size={13} /> measuring effect…</span>;
  const down = effect.trim().startsWith("-");
  return <span className={`effect ${down ? "effect--down" : "effect--up"}`}>{down ? <window.IcArrowDown size={13} /> : <window.IcArrowUp size={13} />}{effect} {label}</span>;
}

function ChangeCard({ change: ch, onApprove, onReject, onSaveNote }) {
  const [showDiff, setShowDiff] = useChS(false);
  const [editing, setEditing] = useChS(false);
  const [noteText, setNoteText] = useChS(ch.note || "");
  const ref = useChR(null);
  useChE(() => { if (editing && ref.current) { ref.current.focus(); } }, [editing]);

  const decided = ch.status !== "undecided";
  function saveNote() { onSaveNote(ch.id, noteText.trim()); setEditing(false); }

  return (
    <article className={`change-card ${decided ? "change-card--decided" : ""} ${ch.status === "rejected" ? "change-card--rejected" : ""}`}>
      <div className="cc-head">
        <span className="kind-badge">{ch.kind}</span>
        <span className="cc-title">{ch.title}</span>
        <window.ChangeStatusBadge status={ch.status} />
      </div>

      <p className="cc-detail">{ch.detail}</p>

      {ch.config === "autopilot_config" && ch.hoursUtc && (
        <div className="autopilot-hours">
          <div className="ah-cap">Proposed posting hours</div>
          <div className="ah-chips">
            {localHours(ch.hoursUtc).map((time, i) => (
              <span className="ah-chip" key={i}><window.IcClock size={13} />{time}</span>
            ))}
          </div>
          <div className="ah-note">Shown in your local time · {utcLabel()}</div>
        </div>
      )}

      <div className="cc-extra">
        {ch.diff && (
          <button className="linkbtn" onClick={() => setShowDiff((v) => !v)} aria-expanded={showDiff}>
            <window.IcAudit size={13} />{showDiff ? "Hide change" : "View change"}
          </button>
        )}
        {!decided && !ch.note && !editing && (
          <button className="linkbtn" onClick={() => { setNoteText(""); setEditing(true); }}>
            <window.IcPencil size={13} />Add a note
          </button>
        )}
      </div>

      {showDiff && ch.diff && (
        <div className="diff">
          <div className="diff-line diff-line--del"><span className="dl-sign">−</span><span>{ch.diff.before}</span></div>
          <div className="diff-line diff-line--add"><span className="dl-sign">+</span><span>{ch.diff.after}</span></div>
        </div>
      )}

      {editing && (
        <div className="note-box">
          <textarea ref={ref} className="note-area" rows={2} placeholder="A note to yourself about this change…"
            value={noteText} onChange={(e) => setNoteText(e.target.value)}
            onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") saveNote(); if (e.key === "Escape") setEditing(false); }} />
          <div className="cc-extra" style={{ justifyContent: "flex-end", marginTop: 8 }}>
            <button className="btn btn--ghost btn--sm" onClick={() => setEditing(false)}>Cancel</button>
            <button className="btn btn--secondary btn--sm" onClick={saveNote} disabled={!noteText.trim()}>Save note</button>
          </div>
        </div>
      )}

      {ch.note && !editing && (
        <div className="note-saved">
          <window.IcPencil size={14} className="ns-ico" />
          <div style={{ flex: 1 }}>{ch.note}</div>
          {!decided && <button className="linkbtn" style={{ border: "none", padding: "2px 4px" }} onClick={() => { setNoteText(ch.note); setEditing(true); }}>Edit</button>}
        </div>
      )}

      <div className="cc-foot">
        <div className="cc-meta">
          {ch.status === "undecided" && <span className="cc-when">Awaiting your decision · applies immediately</span>}
          {ch.status === "rejected" && <span className="cc-when">You rejected this suggestion</span>}
          {ch.status === "applied" && <EffectChip status="applied" effect={ch.effect} label={ch.effectLabel} />}
        </div>
        <div className="cc-actions">
          {ch.status === "undecided" && (
            <>
              <button className="btn btn--ghost btn--sm" onClick={() => onReject(ch.id)}><window.IcX size={15} /> Reject</button>
              <button className="btn btn--primary btn--sm" onClick={() => onApprove(ch.id)}><window.IcCheck size={15} /> Approve</button>
            </>
          )}
          {/* decided changes are read-only — append-only backend, no undo */}
        </div>
      </div>
    </article>
  );
}

Object.assign(window, { ChangeCard, EffectChip });
