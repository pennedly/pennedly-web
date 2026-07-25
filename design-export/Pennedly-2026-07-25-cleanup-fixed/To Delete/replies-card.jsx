// replies-card.jsx — the comment card with the in-card reply workflow:
// read (+translate) → generate → edit → approve → publish, or skip/restore.

const { useState: useCdS, useRef: useCdR, useEffect: useCdE } = React;
const REPLY_LIMIT = 500;

/* status badge (top-right) */
function CommentBadge({ status }) {
  if (status === "new")
    return <span className="badge" style={{ background: "color-mix(in srgb, var(--color-accent) 12%, var(--color-surface))", color: "var(--color-accent)", borderColor: "color-mix(in srgb, var(--color-accent) 30%, transparent)" }}><span className="pill-dot" />New</span>;
  if (status === "approved")
    return <span className="badge" style={{ background: "color-mix(in srgb, var(--color-accent) 12%, var(--color-surface))", color: "var(--color-accent)", borderColor: "color-mix(in srgb, var(--color-accent) 30%, transparent)" }}><span className="pill-dot" />Approved</span>;
  if (status === "replied")
    return <span className="badge badge--good"><span className="pill-dot" />Replied</span>;
  if (status === "skipped")
    return <span className="badge badge--neutral">Skipped</span>;
  return <span className="badge badge--neutral"><span className="pill-dot" style={{ color: "var(--color-ink-400)" }} />Draft</span>;
}

function CommentCard({ comment: c, post, leaving, onGenerate, onRegenerate, onApprove, onPublish, onSaveEdit, onSkip, onRestore }) {
  const [editing, setEditing] = useCdS(false);
  const [editText, setEditText] = useCdS(c.reply || "");
  const [translated, setTranslated] = useCdS(false);
  const [replyTranslated, setReplyTranslated] = useCdS(false);
  const editRef = useCdR(null);

  useCdE(() => { if (editing && editRef.current) { editRef.current.focus(); autosize(editRef.current); } }, [editing]);
  function autosize(el) { el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; }

  function startEdit() { setEditText(c.reply || ""); setEditing(true); }
  function saveEdit() { onSaveEdit(c.id, editText.trim()); setEditing(false); }

  const hasReply = c.status === "draft" || c.status === "approved" || c.status === "replied";
  const canRemove = c.status === "new" || c.status === "draft" || c.status === "approved";
  const replyTrText = c.candTr && c.candTr[c.ci];
  const replyDisplay = c.replyLang && replyTranslated && replyTrText ? replyTrText : c.reply;
  const cls = ["cmt-card", c.status === "skipped" ? "cmt-card--skipped" : "", leaving ? "cmt-card--leaving" : ""].join(" ");
  const editLen = editText.length;

  return (
    <article className={cls}>
      {/* the comment */}
      <div className="draft-head">
        <window.Avatar src={c.author.avatar} initials={c.author.initials} size={38} />
        <div className="draft-id">
          <div className="draft-name">{c.author.name}</div>
          <div className="draft-sub"><span>{c.author.handle}</span><span className="sep">·</span><span title={c.time}>{window.fmtDateTime(c.at)}</span></div>
        </div>
        <CommentBadge status={c.status} />
        {canRemove && (
          <button className="cmt-remove" aria-label="Remove from queue" title="Remove from queue" onClick={() => onSkip(c.id)}><window.IcX size={15} /></button>
        )}
      </div>

      <p className="cmt-body">{c.lang && translated ? c.translated : c.text}</p>

      {c.lang && (
        <div className="translate-row">
          {translated ? (
            <>
              <span className="translate-note"><window.IcGlobe size={13} />Translated from {c.lang}</span>
              <button className="translate-btn" onClick={() => setTranslated(false)}>Show original</button>
            </>
          ) : (
            <button className="translate-btn" onClick={() => setTranslated(true)}><window.IcGlobe size={13} />Translate from {c.lang}</button>
          )}
        </div>
      )}

      {/* the reply (threaded) */}
      {c.generating && (
        <div className="reply-thread">
          <div className="reply-block reply-block--gen">
            <div className="skel-line" style={{ width: "88%" }} />
            <div className="skel-line" style={{ width: "60%" }} />
            <span className="reply-gen-note"><span className="nib"><window.IcNib size={13} /></span>Drafting a reply in your voice…</span>
          </div>
        </div>
      )}

      {hasReply && !c.generating && (
        <div className="reply-thread">
          <div className={`reply-block ${c.status === "replied" ? "reply-block--replied" : ""}`}>
            <div className="reply-author">
              <window.Avatar src={window.REPLY_USER.avatar} initials={window.REPLY_USER.initials} size={24} />
              <span className="ra-name">You</span>
              {c.status === "draft" && <span className="ra-tag"><window.IcNib size={12} />drafted in your voice</span>}
              {c.status === "approved" && <span className="ra-tag" style={{ color: "var(--color-accent)" }}><window.IcCheck size={12} />approved · ready to publish</span>}
              {c.status === "replied" && <span className="ra-tag is-good"><window.IcCheck size={12} />replied {c.repliedTime}</span>}
            </div>
            {editing ? (
              <>
                <textarea ref={editRef} className="reply-edit" value={editText}
                  onChange={(e) => { setEditText(e.target.value); autosize(e.target); }}
                  onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") saveEdit(); }} />
                <div className="reply-edit-meta"><span className={`reply-cc ${editLen > REPLY_LIMIT ? "over" : ""}`}>{editLen} / {REPLY_LIMIT}</span></div>
              </>
            ) : (
              <>
                <div className="reply-text">{replyDisplay}</div>
                {c.replyLang && (
                  <div className="translate-row translate-row--reply">
                    {replyTranslated ? (
                      <>
                        <span className="translate-note"><window.IcGlobe size={13} />Translated from {c.replyLang}</span>
                        <button className="translate-btn" onClick={() => setReplyTranslated(false)}>Show original</button>
                      </>
                    ) : (
                      <button className="translate-btn" onClick={() => setReplyTranslated(true)}><window.IcGlobe size={13} />Translate from {c.replyLang}</button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* footer */}
      {!c.generating && (
        <div className="cmt-foot">
          <div className="cmt-meta">
            {c.status === "replied" ? (
              <span className="cm-item"><window.IcCheck size={13} className="cm-ico" />Published {c.repliedTime}</span>
            ) : c.status === "skipped" ? (
              <span className="cm-item">Removed from queue · won't be answered</span>
            ) : c.lang ? (
              <span className="cm-item"><window.IcGlobe size={13} className="cm-ico" />{c.lang}</span>
            ) : null}
          </div>

          <div className="cmt-actions">
            {c.status === "new" && (
              <button className="btn btn--primary btn--sm" onClick={() => onGenerate(c.id)}><window.IcNib size={15} /> Generate reply</button>
            )}
            {c.status === "draft" && !editing && (
              <>
                <button className="btn btn--ghost btn--sm" onClick={() => onRegenerate(c.id)}><window.IcTweak size={15} /> Regenerate</button>
                <button className="btn btn--secondary btn--sm" onClick={startEdit}><window.IcPencil size={15} /> Edit</button>
                <button className="btn btn--primary btn--sm" onClick={() => onApprove(c.id)}><window.IcCheck size={15} /> Approve</button>
              </>
            )}
            {c.status === "approved" && !editing && (
              <>
                <button className="btn btn--secondary btn--sm" onClick={startEdit}><window.IcPencil size={15} /> Edit</button>
                <button className="btn btn--primary btn--sm" onClick={() => onPublish(c.id)}><window.IcReply size={15} /> Publish reply</button>
              </>
            )}
            {editing && (
              <>
                <button className="btn btn--ghost btn--sm" onClick={() => setEditing(false)}>Cancel</button>
                <button className="btn btn--primary btn--sm" onClick={saveEdit} disabled={editText.trim().length === 0 || editLen > REPLY_LIMIT}><window.IcCheck size={15} /> Save</button>
              </>
            )}
            {c.status === "replied" && (
              <a className="btn btn--secondary btn--sm" href="https://www.threads.net" target="_blank" rel="noopener noreferrer"><window.IcExternal size={15} /> Open in Threads</a>
            )}
            {c.status === "skipped" && (
              <button className="btn btn--ghost btn--sm" onClick={() => onRestore(c.id)}><window.IcUndo size={15} /> Restore</button>
            )}
          </div>
        </div>
      )}
    </article>
  );
}

Object.assign(window, { CommentCard, CommentBadge });
