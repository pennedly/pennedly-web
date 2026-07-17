// dir-stage.jsx — DIRECTION 4 "Stage".
// Cinematic, dark-first focal moments. No card — content floats on a stage with
// a soft spotlight, a single glowing focal element per step (brand → avatar →
// nib → success check), a livelier segmented progress, and a delightful payoff
// on connect and "all set". Designed dark-first; holds up in light too.

const { useRef: sR } = React;

const S_TRUST_ICONS = { eye: window.IcEye, check: window.IcCheck, lock: window.IcLock };
const S_MODE_ICONS = { analyze: window.IcScan, scratch: window.IcPen };

function STopBar({ flow, dark, onToggleTheme }) {
  return (
    <header className="s-top">
      <div className="s-brand">
        <window.Logo size={28} radius={8} />
        <span className="s-bn">Pennedly</span>
      </div>
      <div className="s-top-r">
        {flow.preview && <span className="status-pill status-pill--accent"><span className="pill-dot" />Preview · nothing is saved</span>}
        {flow.showBack && <a className="s-back" href="Settings.html"><window.IcArrowLeft size={15} /> Back to Settings</a>}
        {flow.showSkip && <button className="s-skip" onClick={flow.skip}>Skip for now</button>}
        <button className="s-iconbtn" aria-label="Toggle theme" onClick={onToggleTheme}>
          {dark ? <window.IcSun size={17} /> : <window.IcMoon size={16} />}
        </button>
      </div>
    </header>
  );
}

function SProgress({ current }) {
  return (
    <div className="s-prog" aria-label="Onboarding progress">
      {window.OB_JOURNEY.map((s, i) => (
        <div className={`s-prog-seg ${i === current ? "is-current" : i < current ? "is-done" : ""}`} key={s.key}>
          <span className="s-prog-bar"><span className="s-prog-fill" /></span>
          <span className="s-prog-lab">{s.label}</span>
        </div>
      ))}
    </div>
  );
}

/* connect */
function SConnect({ flow }) {
  const { connectStatus: status, account } = flow;
  const connected = status === "connected";
  return (
    <div className="s-step">
      <div className={`s-focus ${connected ? "s-focus--ok" : ""}`}>
        {connected
          ? <><window.Avatar src={account.avatar} initials={account.initials} size={76} /><span className="s-focus-badge"><window.IcCheck size={15} /></span></>
          : <span className="s-focus-mark"><window.Logo size={52} radius={15} /></span>}
      </div>

      {connected ? (
        <>
          <div className="s-eyebrow">Connected</div>
          <h1 className="s-title">{account.name} is connected.</h1>
          <p className="s-sub">{account.handle} · {account.followers} followers. Pennedly will only ever draft. Nothing posts without your okay.</p>
          <div className="s-foot">
            <button className="btn btn--primary btn--lg s-cta" onClick={flow.goChoose}>Continue <window.IcArrowRight size={17} /></button>
          </div>
        </>
      ) : (
        <>
          <div className="s-eyebrow">Welcome to Pennedly</div>
          <h1 className="s-title">Your drafting partner, ready in a minute.</h1>
          <p className="s-sub">Pennedly writes posts and replies that sound like you, then waits for your okay. Connect the Threads account you want it to write for.</p>
          <div className="s-trust">
            {window.OB_TRUST.map((tr, i) => {
              const Ico = S_TRUST_ICONS[tr.ico] || window.IcCheck;
              return <div className="s-trust-row" key={i}><span className="s-trust-ico"><Ico size={14} /></span><span>{tr.text}</span></div>;
            })}
          </div>
          <div className="s-foot">
            <button className="btn btn--primary btn--lg s-cta" onClick={flow.connect} disabled={status === "connecting"}>
              {status === "connecting" ? <><span className="r-spinner" /> Connecting…</> : <><window.IcAt size={17} /> Connect Threads account</>}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* choose */
function SChoose({ flow }) {
  const { chosen, setChosen, enoughPosts, postCount, need, account, firstRun } = flow;
  return (
    <div className="s-step">
      <div className="s-eyebrow">Step 2 of 3 · Your voice</div>
      <h1 className="s-title">How should Pennedly learn your voice?</h1>
      <p className="s-sub">This is what makes drafts sound like you and not a robot. Pick one; you can always refine it later.</p>

      <div className="s-tiles" role="radiogroup" aria-label="Voice setup method">
        {window.OB_VOICE_MODES.map((mo) => {
          const Ico = S_MODE_ICONS[mo.id];
          const disabled = mo.id === "analyze" && !enoughPosts;
          const active = chosen === mo.id && !disabled;
          return (
            <button key={mo.id} className={`s-tile ${active ? "is-active" : ""} ${disabled ? "is-disabled" : ""}`}
              role="radio" aria-checked={active} aria-disabled={disabled}
              onClick={() => { if (!disabled) setChosen(mo.id); }}>
              <span className="s-tile-ico"><Ico size={22} /></span>
              <span className="s-tile-top">
                <span className="s-tile-title">{mo.title}</span>
                {mo.recommended && !disabled && <span className="s-rec">Recommended</span>}
                {disabled && <span className="s-locked"><window.IcLock size={12} /> Needs {need}</span>}
              </span>
              <span className="s-tile-desc">{disabled
                ? `Needs at least ${need} recent posts, and ${account.handle} has ${postCount}. Build from scratch for now; this unlocks once you've posted more.`
                : (mo.id === "analyze" ? `Pennedly reads ${account.handle}'s recent posts and distils your themes, rhythm, and the things you'd never say.` : mo.desc)}</span>
              {!disabled && <span className="s-tile-meta"><window.IcClock size={13} /> {mo.meta}</span>}
            </button>
          );
        })}
      </div>

      <div className="s-foot s-foot--row">
        {firstRun && <button className="s-backlink" onClick={flow.goConnect}><window.IcArrowLeft size={15} /> Back</button>}
        <span className="grow" />
        <button className="btn btn--primary btn--lg s-cta" onClick={flow.chooseContinue} disabled={!chosen}>Continue <window.IcArrowRight size={17} /></button>
      </div>
    </div>
  );
}

/* analyze */
function SAnalyze({ flow }) {
  const { account, anIndex } = flow;
  return (
    <div className="s-step">
      <div className="s-focus s-focus--pulse"><span className="s-focus-mark s-focus-nib"><window.IcNib size={42} /></span></div>
      <h1 className="s-title">Learning how you write…</h1>
      <span className="s-acct"><window.Avatar src={account.avatar} initials={account.initials} size={22} /> {account.handle}</span>
      <div className="s-an-steps">
        {window.OB_ANALYZE_STEPS.map((label, i) => {
          const state = i < anIndex ? "done" : i === anIndex ? "active" : "";
          return (
            <div className={`s-an ${state}`} key={i}>
              <span className="s-an-tick">{i < anIndex ? <window.IcCheck size={13} /> : i === anIndex ? <span className="s-an-sp" /> : <span className="s-an-dot" />}</span>
              <span className="s-an-label">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* scratch */
function SScratch({ flow }) {
  const { form, setForm } = flow;
  const taRef = sR(null);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const ready = form.desc.trim().length > 0 && form.write.length > 0;
  return (
    <div className="s-step s-step--form">
      <div className="s-eyebrow">Step 2 of 3 · Build from scratch</div>
      <h1 className="s-title">Tell Pennedly how you write.</h1>
      <p className="s-sub">A few lines is plenty. This becomes the starting point for your voice, and you can edit it anytime.</p>

      <div className="s-form">
        <div className="s-field">
          <label className="s-flabel" htmlFor="s-desc">Describe your voice</label>
          <textarea id="s-desc" ref={taRef} className="s-ta" value={form.desc}
            placeholder="e.g. Warm but direct. Short sentences, plain words, the occasional dry joke."
            onChange={(e) => set("desc", e.target.value)} />
          <div className="s-starters">
            {window.OB_VOICE_STARTERS.map((s, i) => (
              <button key={i} type="button" className="s-starter" onClick={() => { set("desc", s); if (taRef.current) taRef.current.focus(); }}>“{s.slice(0, 40)}…”</button>
            ))}
          </div>
        </div>
        <div className="s-field">
          <label className="s-flabel">Topics to write about</label>
          <window.FlowChipInput value={form.write} onChange={(v) => set("write", v)} placeholder="Add a topic and press Enter…" suggestions={window.OB_TOPICS_WRITE} />
        </div>
        <div className="s-field">
          <label className="s-flabel">Topics to avoid <span className="s-opt">optional</span></label>
          <window.FlowChipInput value={form.avoid} onChange={(v) => set("avoid", v)} placeholder="Anything Pennedly should never touch…" suggestions={window.OB_TOPICS_AVOID} tone="avoid" />
        </div>
      </div>

      <div className="s-foot s-foot--row">
        <button className="s-backlink" onClick={flow.goChoose}><window.IcArrowLeft size={15} /> Back</button>
        <span className="grow" />
        <button className="btn btn--primary btn--lg s-cta" onClick={flow.scratchContinue} disabled={!ready}>Create my voice <window.IcArrowRight size={17} /></button>
      </div>
    </div>
  );
}

/* preview */
function SPreview({ flow }) {
  const { account, mode } = flow;
  const v = window.OB_PREVIEW_VOICE;
  const src = mode === "scratch" ? "your description" : `${account.handle}'s recent posts`;
  return (
    <div className="s-step s-step--form">
      <span className="status-pill status-pill--accent s-proof-pill"><span className="pill-dot" /> Preview · nothing was saved</span>
      <h1 className="s-title">The voice Pennedly would build</h1>
      <p className="s-sub">Generated for real from {src}, but preview mode doesn’t save it. Run setup normally to keep this voice.</p>
      <div className="s-pv">
        <div className="s-pv-block">
          <div className="s-pv-cap">Voice summary</div>
          <p className="s-pv-summary">{v.summary}</p>
        </div>
        <div className="s-pv-block">
          <div className="s-pv-cap">Themes</div>
          <div className="s-pv-chips">{v.themes.map((x) => <span className="s-pv-chip" key={x}>{x}</span>)}</div>
        </div>
        <div className="s-pv-block">
          <div className="s-pv-cap">How you sound</div>
          <ul className="s-pv-list">{v.traits.map((x) => <li key={x}><window.IcCheck size={14} /> {x}</li>)}</ul>
        </div>
      </div>
      <div className="s-foot s-foot--row">
        <a className="s-backlink" href="Settings.html"><window.IcArrowLeft size={15} /> Back to Settings</a>
        <span className="grow" />
        <a className="btn btn--primary btn--lg s-cta" href="#" onClick={(e) => { e.preventDefault(); flow.resetAll(); }}>Run setup for real <window.IcArrowRight size={17} /></a>
      </div>
    </div>
  );
}

/* done */
function SDone({ flow }) {
  const { account, connected, mode, preview } = flow;
  if (preview) return <SPreview flow={flow} />;
  const voiceLabel = mode === "scratch" ? "Built from your description" : mode === "analyze" ? "Analysed from your posts" : "Set up later";
  const first = account.name.split(" ")[0];
  return (
    <div className="s-step">
      <div className="s-focus s-focus--ok s-focus--ping">
        <span className="s-focus-mark s-focus-check"><window.IcCheck size={34} /></span>
      </div>
      <div className="s-eyebrow s-eyebrow--ok">All set</div>
      <h1 className="s-title">{connected ? `You’re all set, ${first}.` : "You’re good to go for now."}</h1>
      <p className="s-sub">{connected
        ? `Pennedly is ready to draft for ${account.handle} in your voice. Nothing is published until you approve it.`
        : "You can connect an account and set up your voice anytime from Settings. Nothing is ever published until you approve it."}</p>

      <div className="s-recap">
        <div className="s-recap-row">
          <span className="s-recap-ico"><window.IcAt size={16} /></span>
          <div className="s-recap-txt"><div className="s-recap-k">Connected account</div><div className="s-recap-v">{connected ? account.handle : "Add later in Settings"}</div></div>
          {connected ? <window.IcCheck size={17} className="s-recap-ok" /> : null}
        </div>
        <div className="s-recap-row">
          <span className="s-recap-ico"><window.IcVoice size={16} /></span>
          <div className="s-recap-txt"><div className="s-recap-k">Your voice</div><div className="s-recap-v">{voiceLabel}</div></div>
          {mode ? <window.IcCheck size={17} className="s-recap-ok" /> : null}
        </div>
      </div>

      <div className="s-foot s-foot--row">
        <a className="s-backlink" href="Voice.html">Refine your voice</a>
        <span className="grow" />
        <a className="btn btn--primary btn--lg s-cta" href="Studio.html">Go to Studio <window.IcArrowRight size={17} /></a>
      </div>
    </div>
  );
}

function DirStage({ flow, dark, onToggleTheme }) {
  const { stage } = flow;
  return (
    <div className="ob-dir dir-stage">
      <div className="s-glow" aria-hidden="true" />
      <STopBar flow={flow} dark={dark} onToggleTheme={onToggleTheme} />
      <div className="s-body">
        <div className="s-body-inner">
          <SProgress current={flow.stepIdx} />
          <div className="s-stagebox" key={stage}>
            {stage === "connect" && <SConnect flow={flow} />}
            {stage === "choose" && <SChoose flow={flow} />}
            {stage === "analyze" && <SAnalyze flow={flow} />}
            {stage === "scratch" && <SScratch flow={flow} />}
            {stage === "done" && <SDone flow={flow} />}
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { DirStage });
