// dir-manuscript.jsx — DIRECTION 1 "Manuscript".
// A refined evolution of today's centered card: warmer paper, a progress
// stepper with a drawn connecting line, calmer rhythm, a more reassuring
// connected inset and a softer "all set" moment. The safe, comparable baseline.

const { useRef: mR } = React;

const M_TRUST_ICONS = { eye: window.IcEye, check: window.IcCheck, lock: window.IcLock };
const M_MODE_ICONS = { analyze: window.IcScan, scratch: window.IcPen };

/* chrome */
function MTopBar({ flow, dark, onToggleTheme }) {
  return (
    <header className="m-top">
      <div className="m-brand">
        <window.Logo size={30} radius={9} />
        <span className="m-bn">Pennedly</span>
      </div>
      <div className="m-top-r">
        {flow.showBack && <a className="m-back" href="Settings.html"><window.IcArrowLeft size={15} /> Back to Settings</a>}
        {flow.preview && <span className="status-pill status-pill--accent"><span className="pill-dot" />Preview · nothing is saved</span>}
        {flow.showSkip && <button className="m-skip" onClick={flow.skip}>Skip for now</button>}
        <button className="m-iconbtn" aria-label="Toggle theme" onClick={onToggleTheme}>
          {dark ? <window.IcSun size={17} /> : <window.IcMoon size={16} />}
        </button>
      </div>
    </header>
  );
}

function MStepper({ current }) {
  return (
    <div className="m-stepper" aria-label="Onboarding progress">
      {window.OB_JOURNEY.map((s, i) => (
        <React.Fragment key={s.key}>
          {i > 0 && <span className={`m-line ${i <= current ? "is-done" : ""}`} />}
          <div className={`m-node ${i === current ? "is-current" : i < current ? "is-done" : ""}`}>
            <span className="m-dot">{i < current ? <window.IcCheck size={14} /> : i + 1}</span>
            <span className="m-steplab">{s.label}</span>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

/* connect */
function MConnect({ flow }) {
  const { connectStatus: status, account } = flow;
  return (
    <div className="m-step">
      <span className="m-mark"><window.Logo size={52} radius={15} /></span>
      <div className="m-eyebrow">Welcome to Pennedly</div>
      <h1 className="m-title">Your drafting partner, ready in a minute.</h1>
      <p className="m-sub">Pennedly writes posts and replies that sound like you, then waits for your okay. To start, connect the Threads account you want it to write for.</p>

      {status === "connected" ? (
        <div className="m-connected">
          <window.Avatar src={account.avatar} initials={account.initials} size={44} />
          <div className="m-who">
            <div className="nm">{account.name}</div>
            <div className="hd">{account.handle} · {account.followers} followers</div>
          </div>
          <span className="status-pill status-pill--success"><span className="pill-dot" /> Connected</span>
        </div>
      ) : (
        <div className="m-trust">
          {window.OB_TRUST.map((tr, i) => {
            const Ico = M_TRUST_ICONS[tr.ico] || window.IcCheck;
            return (
              <div className="m-trust-row" key={i}>
                <span className="m-trust-ico"><Ico size={15} /></span>
                <span>{tr.text}</span>
              </div>
            );
          })}
        </div>
      )}

      <div className="m-actions">
        {status === "connected" ? (
          <button className="btn btn--primary btn--lg" onClick={flow.goChoose}>Continue <window.IcArrowRight size={17} /></button>
        ) : (
          <button className="btn btn--primary btn--lg" onClick={flow.connect} disabled={status === "connecting"}>
            {status === "connecting" ? <><span className="r-spinner" /> Connecting…</> : <><window.IcAt size={17} /> Connect Threads account</>}
          </button>
        )}
      </div>
    </div>
  );
}

/* choose */
function MChoose({ flow }) {
  const { chosen, setChosen, enoughPosts, postCount, need, account, firstRun } = flow;
  return (
    <div className="m-step">
      <div className="m-eyebrow">Step 2 of 3 · Your voice</div>
      <h1 className="m-title">How should Pennedly learn your voice?</h1>
      <p className="m-sub">This is what makes drafts sound like you and not a robot. Pick one; you can always refine it later.</p>

      <div className="m-choices" role="radiogroup" aria-label="Voice setup method">
        {window.OB_VOICE_MODES.map((mo) => {
          const Ico = M_MODE_ICONS[mo.id];
          const disabled = mo.id === "analyze" && !enoughPosts;
          const active = chosen === mo.id && !disabled;
          return (
            <button key={mo.id} className={`m-choice ${active ? "is-active" : ""} ${disabled ? "is-disabled" : ""}`}
              role="radio" aria-checked={active} aria-disabled={disabled}
              onClick={() => { if (!disabled) setChosen(mo.id); }}>
              <span className="m-choice-ico"><Ico size={20} /></span>
              <span className="m-choice-body">
                <span className="m-choice-top">
                  <span className="m-choice-title">{mo.title}</span>
                  {mo.recommended && !disabled && <span className="m-rec">Recommended</span>}
                  {disabled && <span className="m-locked"><window.IcLock size={12} /> Needs {need} posts</span>}
                </span>
                <span className="m-choice-desc">{disabled
                  ? `Pennedly needs at least ${need} recent posts to learn from, and ${account.handle} has ${postCount}. Build from scratch for now; this unlocks once you've posted more.`
                  : (mo.id === "analyze" ? `Pennedly reads ${account.handle}'s recent posts and distils your themes, rhythm, and the things you'd never say.` : mo.desc)}</span>
                {!disabled && <span className="m-choice-meta"><window.IcClock size={13} /> {mo.meta}</span>}
              </span>
              {!disabled && <window.IcCheck size={18} className="m-choice-check" />}
            </button>
          );
        })}
      </div>

      <div className="m-actions m-actions--row">
        {firstRun && <button className="m-backlink" onClick={flow.goConnect}><window.IcArrowLeft size={15} /> Back</button>}
        <span className="grow" />
        <button className="btn btn--primary btn--lg" onClick={flow.chooseContinue} disabled={!chosen}>Continue <window.IcArrowRight size={17} /></button>
      </div>
    </div>
  );
}

/* analyze */
function MAnalyze({ flow }) {
  const { account, anIndex } = flow;
  return (
    <div className="m-step m-step--center">
      <span className="m-nib"><window.IcNib size={38} /></span>
      <h1 className="m-title" style={{ textAlign: "center" }}>Learning how you write…</h1>
      <span className="m-acct"><window.Avatar src={account.avatar} initials={account.initials} size={22} /> {account.handle}</span>
      <div className="m-an-steps">
        {window.OB_ANALYZE_STEPS.map((label, i) => {
          const state = i < anIndex ? "done" : i === anIndex ? "active" : "";
          return (
            <div className={`m-an ${state}`} key={i}>
              <span className="m-an-tick">
                {i < anIndex ? <window.IcCheck size={13} /> : i === anIndex ? <span className="m-an-sp" /> : <span className="m-an-dot" />}
              </span>
              <span className="m-an-label">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* scratch */
function MScratch({ flow }) {
  const { form, setForm } = flow;
  const taRef = mR(null);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const ready = form.desc.trim().length > 0 && form.write.length > 0;
  return (
    <div className="m-step">
      <div className="m-eyebrow">Step 2 of 3 · Build from scratch</div>
      <h1 className="m-title">Tell Pennedly how you write.</h1>
      <p className="m-sub">A few lines is plenty. This becomes the starting point for your voice, and you can edit it anytime.</p>

      <div className="m-field">
        <label className="m-flabel" htmlFor="m-desc">Describe your voice</label>
        <textarea id="m-desc" ref={taRef} className="m-ta" value={form.desc}
          placeholder="e.g. Warm but direct. Short sentences, plain words, the occasional dry joke."
          onChange={(e) => set("desc", e.target.value)} />
        <div className="m-starters">
          {window.OB_VOICE_STARTERS.map((s, i) => (
            <button key={i} type="button" className="m-starter" onClick={() => { set("desc", s); if (taRef.current) taRef.current.focus(); }}>“{s.slice(0, 42)}…”</button>
          ))}
        </div>
      </div>

      <div className="m-field">
        <label className="m-flabel">Topics to write about</label>
        <window.FlowChipInput value={form.write} onChange={(v) => set("write", v)} placeholder="Add a topic and press Enter…" suggestions={window.OB_TOPICS_WRITE} />
      </div>

      <div className="m-field">
        <label className="m-flabel">Topics to avoid <span className="m-opt">optional</span></label>
        <window.FlowChipInput value={form.avoid} onChange={(v) => set("avoid", v)} placeholder="Anything Pennedly should never touch…" suggestions={window.OB_TOPICS_AVOID} tone="avoid" />
      </div>

      <div className="m-actions m-actions--row">
        <button className="m-backlink" onClick={flow.goChoose}><window.IcArrowLeft size={15} /> Back</button>
        <span className="grow" />
        <button className="btn btn--primary btn--lg" onClick={flow.scratchContinue} disabled={!ready}>Create my voice <window.IcArrowRight size={17} /></button>
      </div>
    </div>
  );
}

/* preview result */
function MPreview({ flow }) {
  const { account, mode } = flow;
  const v = window.OB_PREVIEW_VOICE;
  const src = mode === "scratch" ? "your description" : `${account.handle}'s recent posts`;
  return (
    <div className="m-step">
      <div className="m-done-head">
        <span className="status-pill status-pill--accent"><span className="pill-dot" /> Preview · nothing was saved</span>
        <h1 className="m-title" style={{ marginTop: 16 }}>The voice Pennedly would build</h1>
        <p className="m-sub">Generated for real from {src}, but preview mode doesn’t save it. Run setup normally to keep this voice.</p>
      </div>
      <div className="m-pv">
        <div className="m-pv-block">
          <div className="m-pv-cap">Voice summary</div>
          <p className="m-pv-summary">{v.summary}</p>
        </div>
        <div className="m-pv-block">
          <div className="m-pv-cap">Themes</div>
          <div className="m-pv-chips">{v.themes.map((x) => <span className="m-pv-chip" key={x}>{x}</span>)}</div>
        </div>
        <div className="m-pv-block">
          <div className="m-pv-cap">How you sound</div>
          <ul className="m-pv-list">{v.traits.map((x) => <li key={x}><window.IcCheck size={14} /> {x}</li>)}</ul>
        </div>
      </div>
      <div className="m-actions m-actions--row">
        <a className="m-backlink" href="Settings.html"><window.IcArrowLeft size={15} /> Back to Settings</a>
        <span className="grow" />
        <a className="btn btn--primary btn--lg" href="#" onClick={(e) => { e.preventDefault(); flow.resetAll(); }}>Run setup for real <window.IcArrowRight size={17} /></a>
      </div>
    </div>
  );
}

/* done */
function MDone({ flow }) {
  const { account, connected, mode, preview } = flow;
  if (preview) return <MPreview flow={flow} />;
  const voiceLabel = mode === "scratch" ? "Built from your description" : mode === "analyze" ? "Analysed from your posts" : "Set up later";
  const first = account.name.split(" ")[0];
  return (
    <div className="m-step">
      <div className="m-done-head">
        <span className="m-done-mark"><window.IcCheck size={30} /></span>
        <h1 className="m-title">{connected ? `You’re all set, ${first}.` : "You’re good to go for now."}</h1>
        <p className="m-sub">
          {connected
            ? `Pennedly is ready to draft for ${account.handle} in your voice. Remember, nothing is published until you approve it.`
            : "You can connect an account and set up your voice anytime from Settings. Nothing is ever published until you approve it."}
        </p>
      </div>
      <div className="m-recap">
        <div className="m-recap-row">
          <span className="m-recap-ico"><window.IcAt size={16} /></span>
          <div className="m-recap-txt"><div className="m-recap-k">Connected account</div><div className="m-recap-v">{connected ? account.handle : "Add later in Settings"}</div></div>
          {connected ? <window.IcCheck size={17} className="m-recap-ok" /> : null}
        </div>
        <div className="m-recap-row">
          <span className="m-recap-ico"><window.IcVoice size={16} /></span>
          <div className="m-recap-txt"><div className="m-recap-k">Your voice</div><div className="m-recap-v">{voiceLabel}</div></div>
          {mode ? <window.IcCheck size={17} className="m-recap-ok" /> : null}
        </div>
      </div>
      <div className="m-actions m-actions--row">
        <a className="m-backlink" href="Voice.html">Refine your voice</a>
        <span className="grow" />
        <a className="btn btn--primary btn--lg" href="Studio.html">Go to Studio <window.IcArrowRight size={17} /></a>
      </div>
    </div>
  );
}

function DirManuscript({ flow, dark, onToggleTheme }) {
  const { stage, stepIdx } = flow;
  const wide = stage === "scratch" || (stage === "done" && flow.preview);
  return (
    <div className="ob-dir dir-manuscript">
      <MTopBar flow={flow} dark={dark} onToggleTheme={onToggleTheme} />
      <div className="m-stage">
        <div className="m-stage-inner">
          <MStepper current={stepIdx} />
          <div className={`m-card ${wide ? "m-card--wide" : ""}`} key={stage}>
            {stage === "connect" && <MConnect flow={flow} />}
            {stage === "choose" && <MChoose flow={flow} />}
            {stage === "analyze" && <MAnalyze flow={flow} />}
            {stage === "scratch" && <MScratch flow={flow} />}
            {stage === "done" && <MDone flow={flow} />}
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { DirManuscript });
