// explore-parts.jsx — shell + states + pattern card for the "Explore patterns"
// screen. Reuses Studio shell classes (studio.css) + ds tokens; screen styling in
// explore.css. No hardcoded hex. Sibling of patterns-parts.jsx.

const { useState: useExS } = React;

/* ----------------------------- pure helpers ---------------------------- */
// posts are separated by a blank line; count the non-empty blocks.
function splitSamples(text) {
  return String(text || "").split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
}
// flag pasted blocks that look like a link or @handle — Pennedly reads words,
// not links. Returns a calm caution string, or null when the text is clean.
function detectLinkIssue(text) {
  const t = String(text || "");
  if (/\bhttps?:\/\//i.test(t) || /\bwww\.[a-z0-9-]/i.test(t)) return "That looks like a link. Paste the words of the post instead — Pennedly never opens links.";
  if (/[a-z0-9-]{2,}\.(com|net|org|io|co|app|me|so|xyz|gg|tv|ly|net\/@)\b/i.test(t)) return "That looks like a URL. Paste the text of the post, not a link to it.";
  if (/(^|\s)@[a-z0-9._]{3,}/i.test(t)) return "That looks like an @handle. Paste what they wrote, not their account.";
  return null;
}

/* ------------------------------- Sidebar -------------------------------
   The sidebar is now the shared <window.Sidebar active="explore" /> from
   shell-parts.jsx (§4). This screen only owns its Topbar + body below. */

/* -------------------------------- Topbar ------------------------------- */
function Topbar({ dark, onToggleTheme, pill }) {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <span className="topbar-title">Explore patterns</span>
        {pill && <span className="status-pill status-pill--accent"><span className="pill-dot" />{pill}</span>}
        <span className="topbar-spacer" />
        <div className="topbar-actions">
          <button className="icon-btn" aria-label="Toggle theme" onClick={onToggleTheme}>{dark ? <window.IcSun size={17} /> : <window.IcMoon size={16} />}</button>
          <button className="icon-btn" aria-label="Settings"><window.IcSettings size={17} /></button>
        </div>
      </div>
    </header>
  );
}

/* ------------------------------ Input view ----------------------------- */
function InputView({ text, onChange, onAnalyze, onSeed }) {
  const samples = splitSamples(text);
  const issue = detectLinkIssue(text);
  const ready = samples.length > 0 && !issue;
  const countLabel = samples.length === 0
    ? "No posts yet"
    : `${samples.length} post${samples.length === 1 ? "" : "s"} ready`;
  return (
    <>
      <div className="paste-notice">
        <window.IcQuote size={18} className="pn-ico" />
        <div className="pn-body">
          <div className="pn-t">Paste the text, not links.</div>
          <div className="pn-d">Pennedly never opens links or reads other people's accounts. Copy the words of the posts you admire and drop them in below — one post per block, a blank line between each.</div>
        </div>
      </div>

      <div className={`paste-box ${issue ? "paste-box--warn" : ""}`}>
        <textarea
          className="paste-area"
          value={text}
          onChange={(e) => onChange(e.target.value)}
          placeholder={"Paste a few posts you admire here.\n\nLeave a blank line between each one, so Pennedly can tell them apart."}
          spellCheck={false}
        />
        <div className="paste-foot">
          <div className="paste-meta">
            <span className={`sample-count ${ready ? "sample-count--ready" : ""}`}>
              <span className="sc-dot" />{countLabel}
            </span>
            {issue && (
              <span className="link-warn">
                <window.IcLink size={15} className="lw-ico" />
                <span>{issue}</span>
              </span>
            )}
          </div>
          <button className="btn btn--primary" disabled={!ready} onClick={onAnalyze}>
            <window.IcCompass size={16} /> Analyze the craft
          </button>
        </div>
      </div>

      <div className="seed-row">
        <span className="seed-cap">Not sure what to paste?</span>
        <button className="seed-chip" onClick={onSeed}>Try a sample set</button>
        {window.EXPLORE_SEEDS.map((s) => <span className="seed-chip" key={s}>{s}</span>)}
      </div>
    </>
  );
}

/* ---------------------------- Analyzing view --------------------------- */
function AnalyzingView({ step }) {
  return (
    <div className="reading-card">
      <span className="reading-nib"><window.IcNib size={40} /></span>
      <div className="reading-title">Reading the craft…</div>
      <div className="reading-sub">Pulling the move out of each post — not the post itself.</div>
      <div className="read-steps">
        {window.EXPLORE_STEPS.map((s, i) => {
          const state = i < step ? "done" : i === step ? "active" : "";
          return (
            <div className={`read-step read-step--${state}`} key={i}>
              <span className="read-tick">
                {i < step ? <window.IcCheck size={12} /> : i === step ? <span className="read-spin" /> : <span style={{ width: 6, height: 6, borderRadius: 99, background: "currentColor", opacity: 0.5 }} />}
              </span>
              {s}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------ Summary bar ---------------------------- */
function SummaryBar({ text }) {
  return (
    <div className="set-summary">
      <window.IcSparkle size={20} className="ss-ico" />
      <span>{text}</span>
    </div>
  );
}

/* ----------------------------- Pattern card ---------------------------- */
function PatternCard({ p, idx }) {
  const [added, setAdded] = useExS(false);
  return (
    <article className="xc-card">
      <div className="xc-head">
        <span className="xc-kind">{p.kind}</span>
        <span className="xc-idx">{String(idx + 1).padStart(2, "0")}</span>
      </div>

      <div className="xc-name">{p.name}</div>
      <div className="xc-technique">{p.technique}</div>

      <div className="xc-why">
        <window.IcQuote size={16} className="xw-ico" />
        <span className="xw-text">{p.why}</span>
      </div>

      <div className="xc-transfer">
        <div>
          <div className="xc-cap">The line that did it</div>
          <div className="xc-source">
            <span className="xs-bar" />
            <span className="xs-text">{p.spotted}</span>
          </div>
        </div>
        <div>
          <div className="xc-cap">The same move, in your voice</div>
          <div className="xc-voice">
            <span className="xv-bar" />
            <span className="xv-text">{p.voiceExample}</span>
          </div>
        </div>
      </div>

      <div className="xc-rule">
        <span className="rule-mono">
          <span className="rm-do">do:</span>
          <span className="rm-text">{p.doRule}</span>
        </span>
        {added ? (
          <span className="add-voice--done"><window.IcCheck size={15} /> Added to your voice</span>
        ) : (
          <button className="btn btn--secondary add-voice" onClick={() => setAdded(true)}>
            <window.IcPlus size={15} /> Add to my voice
          </button>
        )}
      </div>
    </article>
  );
}

/* ------------------------------ Empty view ----------------------------- */
function EmptyView({ onReset }) {
  return (
    <div className="explore-empty">
      <div className="ee-mark"><window.IcCompass size={26} /></div>
      <div className="ee-title">No moves to show yet</div>
      <div className="ee-sub">Nothing came back from that text — it may have been too short, or all link. Paste a few full posts you admire and Pennedly will find the techniques worth borrowing.</div>
      <button className="btn btn--secondary" onClick={onReset}><window.IcArrowLeft size={15} /> Back to paste</button>
    </div>
  );
}

Object.assign(window, {
  splitSamples, detectLinkIssue,
  Topbar, InputView, AnalyzingView, SummaryBar, PatternCard, EmptyView,
});
