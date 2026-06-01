// audits-change.jsx — a single proposed change: approve / reject, view the
// raw diff, add a note, see status + measured effect, roll back.

const { useState: useChS, useRef: useChR, useEffect: useChE } = React;

function EffectChip({ status, effect, label }) {
  if (status === "applied") {
    if (!effect) return <span className="effect effect--measuring"><window.IcClock size={13} /> measuring effect…</span>;
    const down = effect.trim().startsWith("-");
    return <span className={`effect ${down ? "effect--down" : "effect--up"}`}>{down ? <window.IcArrowDown size={13} /> : <window.IcArrowUp size={13} />}{effect} {label}</span>;
  }
  if (status === "rolledback" && effect) {
    return <span className="effect effect--down"><window.IcArrowDown size={13} />{effect} {label} · rolled back</span>;
  }
  return null;
}

function ChangeCard({ change: ch, onApprove, onReject, onRollback, onReconsider, onSaveNote }) {
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

      <div className="cc-extra">
        {ch.diff && (
          <button className="linkbtn" onClick={() => setShowDiff((v) => !v)} aria-expanded={showDiff}>
            <window.IcAudit size={13} />{showDiff ? "Hide change" : "View change"}
          </button>
        )}
        {!ch.note && !editing && (
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
          <button className="linkbtn" style={{ border: "none", padding: "2px 4px" }} onClick={() => { setNoteText(ch.note); setEditing(true); }}>Edit</button>
        </div>
      )}

      <div className="cc-foot">
        <div className="cc-meta">
          {ch.status === "undecided" && <span className="cc-when">Awaiting your decision</span>}
          {ch.status === "rejected" && <span className="cc-when">You rejected this suggestion</span>}
          {(ch.status === "applied" || ch.status === "rolledback") && <EffectChip status={ch.status} effect={ch.effect} label={ch.effectLabel} />}
        </div>
        <div className="cc-actions">
          {ch.status === "undecided" && (
            <>
              <button className="btn btn--ghost btn--sm" onClick={() => onReject(ch.id)}><window.IcX size={15} /> Reject</button>
              <button className="btn btn--primary btn--sm" onClick={() => onApprove(ch.id)}><window.IcCheck size={15} /> Approve</button>
            </>
          )}
          {ch.status === "applied" && (
            <button className="btn btn--ghost btn--sm" onClick={() => onRollback(ch.id)}><window.IcUndo size={15} /> Roll back</button>
          )}
          {(ch.status === "rejected" || ch.status === "rolledback") && (
            <button className="btn btn--ghost btn--sm" onClick={() => onReconsider(ch.id)}><window.IcUndo size={15} /> Reconsider</button>
          )}
        </div>
      </div>
    </article>
  );
}

Object.assign(window, { ChangeCard, EffectChip });
