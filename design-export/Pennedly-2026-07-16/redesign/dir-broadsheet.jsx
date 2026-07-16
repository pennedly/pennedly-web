// dir-broadsheet.jsx — DIRECTION 3 "Broadsheet".
// Editorial / letterpress: no card. Content is set directly on paper inside a
// printed frame — a masthead wordmark, a ruled "section" progress (01 Connect ·
// 02 Voice · 03 Done), big display type, mono folio labels, hairline rules and
// ledger-style choice rows with hanging numerals. Calm, confident, printed.

const { useRef: bR } = React;

const B_TRUST_ICONS = { eye: window.IcEye, check: window.IcCheck, lock: window.IcLock };
const B_MODE_ICONS = { analyze: window.IcScan, scratch: window.IcPen };
const B_FOLIO = { connect: "01", choose: "02", scratch: "02", analyze: "02", done: "03" };

function BMasthead({ flow, dark, onToggleTheme }) {
  return (
    <div className="b-masthead">
      <div className="b-brand">
        <window.Logo size={26} radius={7} />
        <span className="b-bn">Pennedly</span>
      </div>
      <span className="b-mast-rule" />
      <div className="b-mast-r">
        {flow.preview && <span className="b-proof">Preview · nothing is saved</span>}
        {flow.showBack && <a className="b-back" href="Settings.html"><window.IcArrowLeft size={14} /> Settings</a>}
        {flow.showSkip && <button className="b-skip" onClick={flow.skip}>Skip for now</button>}
        <button className="b-iconbtn" aria-label="Toggle theme" onClick={onToggleTheme}>
          {dark ? <window.IcSun size={16} /> : <window.IcMoon size={15} />}
        </button>
      </div>
    </div>
  );
}

function BProgress({ current }) {
  return (
    <nav className="b-progress" aria-label="Onboarding progress">
      {window.OB_JOURNEY.map((s, i) => (
        <span className={`b-sect ${i === current ? "is-current" : i < current ? "is-done" : ""}`} key={s.key}>
          <span className="b-sect-n">{String(i + 1).padStart(2, "0")}</span>
          <span className="b-sect-l">{s.label}</span>
          {i < current && <window.IcCheck size={13} className="b-sect-ok" />}
        </span>
      ))}
    </nav>
  );
}

/* connect */
function BConnect({ flow }) {
  const { connectStatus: status, account } = flow;
  return (
    <div className="b-step">
      <div className="b-eyebrow">Welcome to Pennedly</div>
      <h1 className="b-display">Your drafting partner, ready in a minute.</h1>
      <p className="b-lede">Pennedly writes posts and replies that sound like you, then waits for your okay. To start, connect the Threads account you want it to write for.</p>

      {status === "connected" ? (
        <div className="b-connected">
          <window.Avatar src={account.avatar} initials={account.initials} size={44} />
          <div className="b-who"><div className="nm">{account.name}</div><div className="hd">{account.handle} · {account.followers} followers</div></div>
          <span className="b-ok"><window.IcCheck size={14} /> Connected</span>
        </div>
      ) : (
        <ol className="b-notes">
          {window.OB_TRUST.map((tr, i) => {
            const Ico = B_TRUST_ICONS[tr.ico] || window.IcCheck;
            return <li key={i}><span className="b-note-n">{String(i + 1).padStart(2, "0")}</span><span className="b-note-ico"><Ico size={14} /></span><span className="b-note-t">{tr.text}</span></li>;
          })}
        </ol>
      )}

      <div className="b-foot">
        {status === "connected" ? (
          <button className="btn btn--primary btn--lg b-cta" onClick={flow.goChoose}>Continue <window.IcArrowRight size={17} /></button>
        ) : (
          <button className="btn btn--primary btn--lg b-cta" onClick={flow.connect} disabled={status === "connecting"}>
            {status === "connecting" ? <><span className="r-spinner" /> Connecting…</> : <><window.IcAt size={17} /> Connect Threads account</>}
          </button>
        )}
      </div>
    </div>
  );
}

/* choose */
function BChoose({ flow }) {
  const { chosen, setChosen, enoughPosts, postCount, need, account, firstRun } = flow;
  return (
    <div className="b-step">
      <div className="b-eyebrow">Step 2 of 3 · Your voice</div>
      <h1 className="b-display">How should Pennedly learn your voice?</h1>
      <p className="b-lede">This is what makes drafts sound like you and not a robot. Choose a starting point; you can always refine it later.</p>

      <div className="b-ledger" role="radiogroup" aria-label="Voice setup method">
        {window.OB_VOICE_MODES.map((mo, i) => {
          const Ico = B_MODE_ICONS[mo.id];
          const disabled = mo.id === "analyze" && !enoughPosts;
          const active = chosen === mo.id && !disabled;
          return (
            <button key={mo.id} className={`b-row ${active ? "is-active" : ""} ${disabled ? "is-disabled" : ""}`}
              role="radio" aria-checked={active} aria-disabled={disabled}
              onClick={() => { if (!disabled) setChosen(mo.id); }}>
              <span className="b-row-n">{String(i + 1).padStart(2, "0")}</span>
              <span className="b-row-body">
                <span className="b-row-top">
                  <span className="b-row-ico"><Ico size={17} /></span>
                  <span className="b-row-title">{mo.title}</span>
                  {mo.recommended && !disabled && <span className="b-tag">Recommended</span>}
                  {disabled && <span className="b-tag b-tag--lock"><window.IcLock size={11} /> Needs {need} posts</span>}
                </span>
                <span className="b-row-desc">{disabled
                  ? `Pennedly needs at least ${need} recent posts to learn from, and ${account.handle} has ${postCount}. Build from scratch for now; this unlocks once you've posted more.`
                  : (mo.id === "analyze" ? `Pennedly reads ${account.handle}'s recent posts and distils your themes, rhythm, and the things you'd never say.` : mo.desc)}</span>
                {!disabled && <span className="b-row-meta"><window.IcClock size={12} /> {mo.meta}</span>}
              </span>
              <span className="b-row-pick">{active ? <window.IcCheck size={18} /> : null}</span>
            </button>
          );
        })}
      </div>

      <div className="b-foot b-foot--row">
        {firstRun && <button className="b-backlink" onClick={flow.goConnect}><window.IcArrowLeft size={15} /> Back</button>}
        <span className="grow" />
        <button className="btn btn--primary btn--lg b-cta" onClick={flow.chooseContinue} disabled={!chosen}>Continue <window.IcArrowRight size={17} /></button>
      </div>
    </div>
  );
}

/* analyze */
function BAnalyze({ flow }) {
  const { account, anIndex } = flow;
  return (
    <div className="b-step b-step--center">
      <span className="b-nib"><window.IcNib size={40} /></span>
      <h1 className="b-display b-display--center">Learning how you write…</h1>
      <span className="b-acct"><window.Avatar src={account.avatar} initials={account.initials} size={22} /> {account.handle}</span>
      <ol className="b-an-steps">
        {window.OB_ANALYZE_STEPS.map((label, i) => {
          const state = i < anIndex ? "done" : i === anIndex ? "active" : "";
          return (
            <li className={`b-an ${state}`} key={i}>
              <span className="b-an-n">{String(i + 1).padStart(2, "0")}</span>
              <span className="b-an-label">{label}</span>
              <span className="b-an-mark">{i < anIndex ? <window.IcCheck size={14} /> : i === anIndex ? <span className="b-an-sp" /> : null}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* scratch */
function BScratch({ flow }) {
  const { form, setForm } = flow;
  const taRef = bR(null);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const ready = form.desc.trim().length > 0 && form.write.length > 0;
  return (
    <div className="b-step">
      <div className="b-eyebrow">Step 2 of 3 · Build from scratch</div>
      <h1 className="b-display">Tell Pennedly how you write.</h1>
      <p className="b-lede">A few lines is plenty. This becomes the starting point for your voice, and you can edit it anytime.</p>

      <div className="b-field">
        <label className="b-flabel" htmlFor="b-desc"><span className="b-flabel-n">01</span> Describe your voice</label>
        <textarea id="b-desc" ref={taRef} className="b-ta" value={form.desc}
          placeholder="e.g. Warm but direct. Short sentences, plain words, the occasional dry joke."
          onChange={(e) => set("desc", e.target.value)} />
        <div className="b-starters">
          {window.OB_VOICE_STARTERS.map((s, i) => (
            <button key={i} type="button" className="b-starter" onClick={() => { set("desc", s); if (taRef.current) taRef.current.focus(); }}>“{s.slice(0, 42)}…”</button>
          ))}
        </div>
      </div>
      <div className="b-field">
        <label className="b-flabel"><span className="b-flabel-n">02</span> Topics to write about</label>
        <window.FlowChipInput value={form.write} onChange={(v) => set("write", v)} placeholder="Add a topic and press Enter…" suggestions={window.OB_TOPICS_WRITE} />
      </div>
      <div className="b-field">
        <label className="b-flabel"><span className="b-flabel-n">03</span> Topics to avoid <span className="b-opt">optional</span></label>
        <window.FlowChipInput value={form.avoid} onChange={(v) => set("avoid", v)} placeholder="Anything Pennedly should never touch…" suggestions={window.OB_TOPICS_AVOID} tone="avoid" />
      </div>

      <div className="b-foot b-foot--row">
        <button className="b-backlink" onClick={flow.goChoose}><window.IcArrowLeft size={15} /> Back</button>
        <span className="grow" />
        <button className="btn btn--primary btn--lg b-cta" onClick={flow.scratchContinue} disabled={!ready}>Create my voice <window.IcArrowRight size={17} /></button>
      </div>
    </div>
  );
}

/* preview */
function BPreview({ flow }) {
  const { account, mode } = flow;
  const v = window.OB_PREVIEW_VOICE;
  const src = mode === "scratch" ? "your description" : `${account.handle}'s recent posts`;
  return (
    <div className="b-step">
      <div className="b-eyebrow b-eyebrow--proof">Proof · nothing was saved</div>
      <h1 className="b-display">The voice Pennedly would build.</h1>
      <p className="b-lede">Generated for real from {src}, but preview mode doesn’t save it. Run setup normally to keep this voice.</p>

      <div className="b-proof-sheet">
        <div className="b-proof-block">
          <div className="b-proof-cap">Voice summary</div>
          <p className="b-proof-summary">{v.summary}</p>
        </div>
        <div className="b-proof-block">
          <div className="b-proof-cap">Themes</div>
          <div className="b-proof-chips">{v.themes.map((x) => <span className="b-proof-chip" key={x}>{x}</span>)}</div>
        </div>
        <div className="b-proof-block">
          <div className="b-proof-cap">How you sound</div>
          <ul className="b-proof-list">{v.traits.map((x) => <li key={x}><window.IcCheck size={14} /> {x}</li>)}</ul>
        </div>
      </div>

      <div className="b-foot b-foot--row">
        <a className="b-backlink" href="Settings.html"><window.IcArrowLeft size={15} /> Back to Settings</a>
        <span className="grow" />
        <a className="btn btn--primary btn--lg b-cta" href="#" onClick={(e) => { e.preventDefault(); flow.resetAll(); }}>Run setup for real <window.IcArrowRight size={17} /></a>
      </div>
    </div>
  );
}

/* done */
function BDone({ flow }) {
  const { account, connected, mode, preview } = flow;
  if (preview) return <BPreview flow={flow} />;
  const voiceLabel = mode === "scratch" ? "Built from your description" : mode === "analyze" ? "Analysed from your posts" : "Set up later";
  const first = account.name.split(" ")[0];
  return (
    <div className="b-step">
      <div className="b-eyebrow b-eyebrow--done"><window.IcCheck size={14} /> All set</div>
      <h1 className="b-display">{connected ? `You’re all set, ${first}.` : "You’re good to go for now."}</h1>
      <p className="b-lede">{connected
        ? `Pennedly is ready to draft for ${account.handle} in your voice. Remember, nothing is published until you approve it.`
        : "You can connect an account and set up your voice anytime from Settings. Nothing is ever published until you approve it."}</p>

      <dl className="b-recap">
        <div className="b-recap-row">
          <dt><span className="b-recap-n">01</span> Connected account</dt>
          <dd>{connected ? account.handle : "Add later in Settings"} {connected ? <window.IcCheck size={15} /> : null}</dd>
        </div>
        <div className="b-recap-row">
          <dt><span className="b-recap-n">02</span> Your voice</dt>
          <dd>{voiceLabel} {mode ? <window.IcCheck size={15} /> : null}</dd>
        </div>
      </dl>

      <div className="b-foot b-foot--row">
        <a className="b-backlink" href="Voice.html">Refine your voice</a>
        <span className="grow" />
        <a className="btn btn--primary btn--lg b-cta" href="Studio.html">Go to Studio <window.IcArrowRight size={17} /></a>
      </div>
    </div>
  );
}

function DirBroadsheet({ flow, dark, onToggleTheme }) {
  const { stage } = flow;
  return (
    <div className="ob-dir dir-broadsheet">
      <div className="b-frame">
        <BMasthead flow={flow} dark={dark} onToggleTheme={onToggleTheme} />
        <BProgress current={flow.stepIdx} />
        <div className="b-body">
          <div className="b-folio" aria-hidden="true">{B_FOLIO[stage] || ""}</div>
          <div className="b-content" key={stage}>
            {stage === "connect" && <BConnect flow={flow} />}
            {stage === "choose" && <BChoose flow={flow} />}
            {stage === "analyze" && <BAnalyze flow={flow} />}
            {stage === "scratch" && <BScratch flow={flow} />}
            {stage === "done" && <BDone flow={flow} />}
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { DirBroadsheet });
