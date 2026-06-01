// onboarding-parts.jsx — presentational blocks for first-run onboarding.
// All visuals reference the ink-on-paper tokens; no hardcoded colours.

const { useState: obS, useEffect: obE, useRef: obR } = React;

/* ------------------------------- Avatar -------------------------------- */
function Mono({ text, size = 34, font = 13 }) {
  return <span className="mono" style={{ width: size, height: size, fontSize: font }}>{text}</span>;
}

/* ------------------------------- Stepper ------------------------------- */
const STEPS = [
  { key: "connect", label: "Connect" },
  { key: "voice", label: "Voice" },
  { key: "done", label: "Done" },
];
function Stepper({ current }) {
  // current: index 0..2
  return (
    <div className="stepper" aria-label="Onboarding progress">
      {STEPS.map((s, i) => (
        <React.Fragment key={s.key}>
          {i > 0 && <span className={`step-line ${i <= current ? "is-done" : ""}`} />}
          <div className={`step-node ${i === current ? "is-current" : i < current ? "is-done" : ""}`}>
            <span className="step-dot">{i < current ? <window.IcCheck size={14} /> : i + 1}</span>
            <span className="step-label">{s.label}</span>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

/* ------------------------------- Top bar ------------------------------- */
function TopBar({ dark, onToggleTheme, onSkip, showSkip }) {
  return (
    <div className="ob-top">
      <div className="ob-brand">
        <window.Logo size={30} radius={9} className="bm" />
        <span className="bn">Pennedly</span>
      </div>
      <span className="ob-top-spacer" />
      <div className="ob-top-actions">
        {showSkip && <button className="skip-btn" onClick={onSkip}>Skip for now</button>}
        <button className="icon-btn" aria-label="Toggle theme" onClick={onToggleTheme}>
          {dark ? <window.IcSun size={17} /> : <window.IcMoon size={16} />}
        </button>
      </div>
    </div>
  );
}

/* ---------------------------- Connect step ----------------------------- */
const TRUST_ICONS = { eye: window.IcEye, check: window.IcCheck, lock: window.IcLock };
function ConnectStep({ status, account, onConnect, onContinue }) {
  return (
    <div className="step">
      <span className="step-mark brand"><window.Logo size={56} radius={16} /></span>
      <div className="step-eyebrow">Welcome to Pennedly</div>
      <h1 className="step-title">Your drafting partner, ready in a minute.</h1>
      <p className="step-sub">
        Pennedly writes posts and replies that sound like you — then waits for your okay.
        To start, connect the Threads account you want it to write for.
      </p>

      {status === "connected" ? (
        <div className="connected">
          <Mono text={account.initials} size={42} font={15} />
          <div className="who">
            <div className="nm">{account.name}</div>
            <div className="hd">{account.handle} · {account.followers} followers</div>
          </div>
          <span className="ok"><span className="okdot" /> Connected</span>
        </div>
      ) : (
        <div className="trust">
          {window.OB_TRUST.map((t, i) => {
            const Ico = TRUST_ICONS[t.ico] || window.IcCheck;
            return (
              <div className="trust-row" key={i}>
                <span className="trust-ico"><Ico size={15} /></span>
                <span>{t.text}</span>
              </div>
            );
          })}
        </div>
      )}

      <div className="step-actions">
        {status === "connected" ? (
          <button className="btn btn--primary btn--lg" onClick={onContinue}>Continue <window.IcArrowRight size={17} /></button>
        ) : (
          <button className="btn btn--primary btn--lg" onClick={onConnect} disabled={status === "connecting"}>
            {status === "connecting" ? <><span className="spinner" /> Connecting…</> : <><window.IcAt size={17} /> Connect Threads account</>}
          </button>
        )}
      </div>
    </div>
  );
}

/* ----------------------------- Choose step ----------------------------- */
const MODE_ICONS = { analyze: window.IcScan, scratch: window.IcPen };
function ChooseStep({ account, selected, onSelect, onContinue, onBack }) {
  return (
    <div className="step">
      <div className="step-eyebrow">Step 2 of 3 · Your voice</div>
      <h1 className="step-title">How should Pennedly learn your voice?</h1>
      <p className="step-sub">This is what makes drafts sound like you and not a robot. Pick one — you can always refine it later.</p>

      <div className="choices" role="radiogroup" aria-label="Voice setup method">
        {window.OB_VOICE_MODES.map((m) => {
          const Ico = MODE_ICONS[m.id];
          const active = selected === m.id;
          return (
            <button
              key={m.id} className={`choice ${active ? "choice--active" : ""}`}
              role="radio" aria-checked={active} onClick={() => onSelect(m.id)}
            >
              <span className="choice-ico"><Ico size={20} /></span>
              <span className="choice-body">
                <span className="choice-top">
                  <span className="choice-title">{m.title}</span>
                  {m.recommended && <span className="choice-rec">Recommended</span>}
                </span>
                <span className="choice-desc">{m.id === "analyze" ? `Pennedly reads ${account.handle}'s recent posts and distils your themes, rhythm, and the things you'd never say.` : m.desc}</span>
                <span className="choice-meta"><window.IcClock size={13} /> {m.meta}</span>
              </span>
              <window.IcCheck size={18} className="choice-check" />
            </button>
          );
        })}
      </div>

      <div className="step-actions">
        <button className="back-link" onClick={onBack}><window.IcArrowLeft size={15} /> Back</button>
        <span className="grow" />
        <button className="btn btn--primary btn--lg" onClick={onContinue} disabled={!selected}>Continue <window.IcArrowRight size={17} /></button>
      </div>
    </div>
  );
}

/* ---------------------------- Analyze step ----------------------------- */
function AnalyzeStep({ account, stepIndex }) {
  return (
    <div className="step">
      <div className="analyze">
        <span className="nib"><window.IcNib size={40} /></span>
        <h1 className="step-title" style={{ textAlign: "center" }}>Learning how you write…</h1>
        <span className="analyze-acct"><Mono text={account.initials} size={22} font={10} /> {account.handle}</span>
        <div className="analyze-steps">
          {window.OB_ANALYZE_STEPS.map((label, i) => {
            const state = i < stepIndex ? "done" : i === stepIndex ? "active" : "";
            return (
              <div className={`an-step ${state}`} key={i}>
                <span className="an-tick">
                  {i < stepIndex ? <window.IcCheck size={13} /> : i === stepIndex ? <span className="sp" /> : <span style={{ width: 5, height: 5, borderRadius: 9, background: "currentColor", opacity: 0.5 }} />}
                </span>
                <span className="an-label">{label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ Chip input ----------------------------- */
function ChipInput({ value, onChange, placeholder, suggestions, tone }) {
  const [text, setText] = obS("");
  function add(v) {
    const t = (v ?? text).trim();
    if (!t || value.some((x) => x.toLowerCase() === t.toLowerCase())) { setText(""); return; }
    onChange([...value, t]); setText("");
  }
  function remove(v) { onChange(value.filter((x) => x !== v)); }
  const remaining = (suggestions || []).filter((s) => !value.some((v) => v.toLowerCase() === s.toLowerCase()));
  return (
    <>
      <div className="chipfield">
        {value.map((v) => (
          <span className={`chip ${tone === "avoid" ? "avoid" : ""}`} key={v}>
            {v}
            <button type="button" aria-label={`Remove ${v}`} onClick={() => remove(v)}><window.IcX size={11} /></button>
          </span>
        ))}
        <input
          className="chip-input" value={text} placeholder={value.length === 0 ? placeholder : ""}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); add(); }
            if (e.key === "Backspace" && !text && value.length) remove(value[value.length - 1]);
          }}
        />
      </div>
      {remaining.length > 0 && (
        <div className="suggests">
          {remaining.map((s) => (
            <button key={s} type="button" className="suggest" onClick={() => add(s)}><window.IcPlus size={12} /> {s}</button>
          ))}
        </div>
      )}
    </>
  );
}

/* ---------------------------- Scratch step ----------------------------- */
function ScratchStep({ form, setForm, onContinue, onBack }) {
  const taRef = obR(null);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const ready = form.desc.trim().length > 0 && form.write.length > 0;
  return (
    <div className="step">
      <div className="step-eyebrow">Step 2 of 3 · Build from scratch</div>
      <h1 className="step-title">Tell Pennedly how you write.</h1>
      <p className="step-sub">A few lines is plenty. This becomes the starting point for your voice — edit it anytime.</p>

      <div className="field-group">
        <label className="field-label" htmlFor="ob-desc">Describe your voice</label>
        <textarea
          id="ob-desc" ref={taRef} className="ta" value={form.desc}
          placeholder="e.g. Warm but direct. Short sentences, plain words, the occasional dry joke."
          onChange={(e) => set("desc", e.target.value)}
        />
        <div className="starters">
          {window.OB_VOICE_STARTERS.map((s, i) => (
            <button key={i} type="button" className="starter" onClick={() => { set("desc", s); if (taRef.current) taRef.current.focus(); }}>“{s.slice(0, 42)}…”</button>
          ))}
        </div>
      </div>

      <div className="field-group">
        <label className="field-label">Topics to write about</label>
        <ChipInput value={form.write} onChange={(v) => set("write", v)} placeholder="Add a topic and press Enter…" suggestions={window.OB_TOPICS_WRITE} />
      </div>

      <div className="field-group">
        <label className="field-label">Topics to avoid <span className="opt">optional</span></label>
        <ChipInput value={form.avoid} onChange={(v) => set("avoid", v)} placeholder="Anything Pennedly should never touch…" suggestions={window.OB_TOPICS_AVOID} tone="avoid" />
      </div>

      <div className="step-actions">
        <button className="back-link" onClick={onBack}><window.IcArrowLeft size={15} /> Back</button>
        <span className="grow" />
        <button className="btn btn--primary btn--lg" onClick={onContinue} disabled={!ready}>Create my voice <window.IcArrowRight size={17} /></button>
      </div>
    </div>
  );
}

/* ------------------------------ Done step ------------------------------ */
function DoneStep({ account, connected, mode, onRefine }) {
  const voiceLabel = mode === "scratch" ? "Built from your description" : mode === "analyze" ? "Analysed from your posts" : "Set up later";
  const first = account.name.split(" ")[0];
  return (
    <div className="step">
      <div className="done-head">
        <span className="done-mark"><window.IcCheck size={30} /></span>
        <h1 className="step-title">{connected ? `You’re all set, ${first}.` : "You’re good to go for now."}</h1>
        <p className="step-sub">
          {connected
            ? `Pennedly is ready to draft for ${account.handle} in your voice. Remember — nothing is published until you approve it.`
            : "You can connect an account and set up your voice anytime from Settings. Nothing is ever published until you approve it."}
        </p>
      </div>

      <div className="recap">
        <div className="recap-row">
          <span className="recap-ico"><window.IcAt size={16} /></span>
          <div className="recap-txt"><div className="recap-k">Connected account</div><div className="recap-v">{connected ? account.handle : "Add later in Settings"}</div></div>
          {connected ? <window.IcCheck size={17} className="recap-ok" /> : null}
        </div>
        <div className="recap-row">
          <span className="recap-ico"><window.IcVoice size={16} /></span>
          <div className="recap-txt"><div className="recap-k">Your voice</div><div className="recap-v">{voiceLabel}</div></div>
          {mode ? <window.IcCheck size={17} className="recap-ok" /> : null}
        </div>
      </div>

      <div className="step-actions">
        <button className="back-link" onClick={onRefine}>Refine your voice</button>
        <span className="grow" />
        <a className="btn btn--primary btn--lg" href="Studio.html">Go to Studio <window.IcArrowRight size={17} /></a>
      </div>
    </div>
  );
}

Object.assign(window, {
  Mono, Stepper, TopBar, ConnectStep, ChooseStep, AnalyzeStep, ChipInput, ScratchStep, DoneStep,
});
