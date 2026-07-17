// dir-atelier.jsx — DIRECTION 2 "Atelier".
// Split-screen: a deep-ink NARRATIVE panel on the left (brand, the headline +
// reassurance for the current step, and a VERTICAL journey rail Connect → Voice
// → Done) and the ACTION on paper to the right. Story on one side, the thing you
// do on the other — calm, confident, editorial.

const { useRef: aR } = React;

const A_TRUST_ICONS = { eye: window.IcEye, check: window.IcCheck, lock: window.IcLock };
const A_MODE_ICONS = { analyze: window.IcScan, scratch: window.IcPen };

/* The left-panel narrative copy per stage. */
function aNarrative(flow) {
  const { account } = flow;
  const first = account.name.split(" ")[0];
  switch (flow.stage) {
    case "connect":
      return { eyebrow: "Welcome to Pennedly", title: "Your drafting partner, ready in a minute.", sub: "Pennedly writes posts and replies that sound like you, then waits for your okay. To start, connect the Threads account you want it to write for." };
    case "choose":
      return { eyebrow: "Step 2 of 3 · Your voice", title: "How should Pennedly learn your voice?", sub: "This is what makes drafts sound like you and not a robot. Pick a starting point; you can always refine it later." };
    case "scratch":
      return { eyebrow: "Step 2 of 3 · Build from scratch", title: "Tell Pennedly how you write.", sub: "A few lines is plenty. It becomes the starting point for your voice, and you can edit every word of it later." };
    case "analyze":
      return { eyebrow: "Step 2 of 3 · Your voice", title: "Learning how you write…", sub: "Pennedly is reading your recent posts to find your themes, rhythm, and the things you'd never say." };
    case "done":
      return flow.preview
        ? { eyebrow: "Preview", title: "The voice Pennedly would build.", sub: "This ran for real, but preview mode saves nothing. Run setup normally to keep the voice you see here." }
        : { eyebrow: "All set", title: flow.connected ? `You’re all set, ${first}.` : "You’re good to go for now.", sub: flow.connected ? "Pennedly is ready to draft in your voice. Nothing is ever published until you approve it." : "You can connect an account and set up your voice anytime from Settings. Nothing is published without your okay." };
    default:
      return { eyebrow: "", title: "", sub: "" };
  }
}

function AJourney({ current }) {
  return (
    <div className="a-rail" aria-label="Onboarding progress">
      {window.OB_JOURNEY.map((s, i) => (
        <div className={`a-rnode ${i === current ? "is-current" : i < current ? "is-done" : ""}`} key={s.key}>
          {i > 0 && <span className={`a-rline ${i <= current ? "is-done" : ""}`} />}
          <span className="a-rdot">{i < current ? <window.IcCheck size={12} /> : <span className="a-rdot-i">{i + 1}</span>}</span>
          <span className="a-rlab">{s.label}</span>
        </div>
      ))}
    </div>
  );
}

function ALeft({ flow }) {
  const n = aNarrative(flow);
  return (
    <aside className="a-left">
      <div className="a-brand">
        <window.Logo size={30} radius={9} />
        <span className="a-bn">Pennedly</span>
      </div>
      <div className="a-narr" key={flow.stage}>
        <div className="a-eyebrow">{n.eyebrow}</div>
        <h1 className="a-title">{n.title}</h1>
        <p className="a-sub">{n.sub}</p>
        {flow.stage === "connect" && (
          <ul className="a-trust">
            {window.OB_TRUST.map((tr, i) => {
              const Ico = A_TRUST_ICONS[tr.ico] || window.IcCheck;
              return <li key={i}><span className="a-trust-ico"><Ico size={14} /></span><span>{tr.text}</span></li>;
            })}
          </ul>
        )}
      </div>
      <AJourney current={flow.stepIdx} />
    </aside>
  );
}

/* right-side chrome */
function ARightChrome({ flow, dark, onToggleTheme }) {
  return (
    <div className="a-rtop">
      {flow.preview && <span className="status-pill status-pill--accent"><span className="pill-dot" />Preview · nothing is saved</span>}
      <span className="grow" />
      {flow.showBack && <a className="a-back" href="Settings.html"><window.IcArrowLeft size={15} /> Back to Settings</a>}
      {flow.showSkip && <button className="a-skip" onClick={flow.skip}>Skip for now</button>}
      <button className="a-iconbtn" aria-label="Toggle theme" onClick={onToggleTheme}>
        {dark ? <window.IcSun size={17} /> : <window.IcMoon size={16} />}
      </button>
    </div>
  );
}

/* right: connect */
function AConnect({ flow }) {
  const { connectStatus: status, account } = flow;
  return (
    <div className="a-act">
      <div className="a-act-cap">Connect on Threads</div>
      {status === "connected" ? (
        <div className="a-connected">
          <window.Avatar src={account.avatar} initials={account.initials} size={46} />
          <div className="a-who">
            <div className="nm">{account.name}</div>
            <div className="hd">{account.handle}</div>
            <div className="fl">{account.followers} followers</div>
          </div>
          <span className="status-pill status-pill--success"><span className="pill-dot" /> Connected</span>
        </div>
      ) : (
        <div className="a-connect-blank">
          <span className="a-at"><window.IcAt size={22} /></span>
          <p>Pennedly opens Threads in a secure window. You approve read-only access, then you’re back here.</p>
        </div>
      )}
      <div className="a-act-foot">
        {status === "connected" ? (
          <button className="btn btn--primary btn--lg a-cta" onClick={flow.goChoose}>Continue <window.IcArrowRight size={17} /></button>
        ) : (
          <button className="btn btn--primary btn--lg a-cta" onClick={flow.connect} disabled={status === "connecting"}>
            {status === "connecting" ? <><span className="r-spinner" /> Connecting…</> : <><window.IcAt size={17} /> Connect Threads account</>}
          </button>
        )}
      </div>
    </div>
  );
}

/* right: choose */
function AChoose({ flow }) {
  const { chosen, setChosen, enoughPosts, postCount, need, account, firstRun } = flow;
  return (
    <div className="a-act a-act--bare">
      <div className="a-choices" role="radiogroup" aria-label="Voice setup method">
        {window.OB_VOICE_MODES.map((mo) => {
          const Ico = A_MODE_ICONS[mo.id];
          const disabled = mo.id === "analyze" && !enoughPosts;
          const active = chosen === mo.id && !disabled;
          return (
            <button key={mo.id} className={`a-choice ${active ? "is-active" : ""} ${disabled ? "is-disabled" : ""}`}
              role="radio" aria-checked={active} aria-disabled={disabled}
              onClick={() => { if (!disabled) setChosen(mo.id); }}>
              <span className="a-choice-ico"><Ico size={20} /></span>
              <span className="a-choice-body">
                <span className="a-choice-top">
                  <span className="a-choice-title">{mo.title}</span>
                  {mo.recommended && !disabled && <span className="a-rec">Recommended</span>}
                  {disabled && <span className="a-locked"><window.IcLock size={12} /> Needs {need} posts</span>}
                </span>
                <span className="a-choice-desc">{disabled
                  ? `Needs at least ${need} recent posts, and ${account.handle} has ${postCount}. Build from scratch for now; this unlocks once you've posted more.`
                  : (mo.id === "analyze" ? `Reads ${account.handle}'s recent posts and distils your themes, rhythm, and the things you'd never say.` : mo.desc)}</span>
                {!disabled && <span className="a-choice-meta"><window.IcClock size={13} /> {mo.meta}</span>}
              </span>
              {!disabled && <window.IcCheck size={18} className="a-choice-check" />}
            </button>
          );
        })}
      </div>
      <div className="a-act-foot a-act-foot--row">
        {firstRun && <button className="a-backlink" onClick={flow.goConnect}><window.IcArrowLeft size={15} /> Back</button>}
        <span className="grow" />
        <button className="btn btn--primary btn--lg" onClick={flow.chooseContinue} disabled={!chosen}>Continue <window.IcArrowRight size={17} /></button>
      </div>
    </div>
  );
}

/* right: analyze */
function AAnalyze({ flow }) {
  const { account, anIndex } = flow;
  return (
    <div className="a-act a-act--center">
      <span className="a-nib"><window.IcNib size={40} /></span>
      <span className="a-acct"><window.Avatar src={account.avatar} initials={account.initials} size={22} /> {account.handle}</span>
      <div className="a-an-steps">
        {window.OB_ANALYZE_STEPS.map((label, i) => {
          const state = i < anIndex ? "done" : i === anIndex ? "active" : "";
          return (
            <div className={`a-an ${state}`} key={i}>
              <span className="a-an-tick">{i < anIndex ? <window.IcCheck size={13} /> : i === anIndex ? <span className="a-an-sp" /> : <span className="a-an-dot" />}</span>
              <span className="a-an-label">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* right: scratch */
function AScratch({ flow }) {
  const { form, setForm } = flow;
  const taRef = aR(null);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const ready = form.desc.trim().length > 0 && form.write.length > 0;
  return (
    <div className="a-act a-act--bare">
      <div className="a-field">
        <label className="a-flabel" htmlFor="a-desc">Describe your voice</label>
        <textarea id="a-desc" ref={taRef} className="a-ta" value={form.desc}
          placeholder="e.g. Warm but direct. Short sentences, plain words, the occasional dry joke."
          onChange={(e) => set("desc", e.target.value)} />
        <div className="a-starters">
          {window.OB_VOICE_STARTERS.map((s, i) => (
            <button key={i} type="button" className="a-starter" onClick={() => { set("desc", s); if (taRef.current) taRef.current.focus(); }}>“{s.slice(0, 38)}…”</button>
          ))}
        </div>
      </div>
      <div className="a-field">
        <label className="a-flabel">Topics to write about</label>
        <window.FlowChipInput value={form.write} onChange={(v) => set("write", v)} placeholder="Add a topic and press Enter…" suggestions={window.OB_TOPICS_WRITE} />
      </div>
      <div className="a-field">
        <label className="a-flabel">Topics to avoid <span className="a-opt">optional</span></label>
        <window.FlowChipInput value={form.avoid} onChange={(v) => set("avoid", v)} placeholder="Anything Pennedly should never touch…" suggestions={window.OB_TOPICS_AVOID} tone="avoid" />
      </div>
      <div className="a-act-foot a-act-foot--row">
        <button className="a-backlink" onClick={flow.goChoose}><window.IcArrowLeft size={15} /> Back</button>
        <span className="grow" />
        <button className="btn btn--primary btn--lg" onClick={flow.scratchContinue} disabled={!ready}>Create my voice <window.IcArrowRight size={17} /></button>
      </div>
    </div>
  );
}

/* right: preview */
function APreview({ flow }) {
  const { account, mode } = flow;
  const v = window.OB_PREVIEW_VOICE;
  const src = mode === "scratch" ? "your description" : `${account.handle}'s recent posts`;
  return (
    <div className="a-act a-act--bare">
      <div className="a-pv-note">Generated for real from {src}, but preview mode doesn’t save it.</div>
      <div className="a-pv">
        <div className="a-pv-block">
          <div className="a-pv-cap">Voice summary</div>
          <p className="a-pv-summary">{v.summary}</p>
        </div>
        <div className="a-pv-block">
          <div className="a-pv-cap">Themes</div>
          <div className="a-pv-chips">{v.themes.map((x) => <span className="a-pv-chip" key={x}>{x}</span>)}</div>
        </div>
        <div className="a-pv-block">
          <div className="a-pv-cap">How you sound</div>
          <ul className="a-pv-list">{v.traits.map((x) => <li key={x}><window.IcCheck size={14} /> {x}</li>)}</ul>
        </div>
      </div>
      <div className="a-act-foot a-act-foot--row">
        <a className="a-backlink" href="Settings.html"><window.IcArrowLeft size={15} /> Back to Settings</a>
        <span className="grow" />
        <a className="btn btn--primary btn--lg" href="#" onClick={(e) => { e.preventDefault(); flow.resetAll(); }}>Run for real <window.IcArrowRight size={17} /></a>
      </div>
    </div>
  );
}

/* right: done */
function ADone({ flow }) {
  const { account, connected, mode, preview } = flow;
  if (preview) return <APreview flow={flow} />;
  const voiceLabel = mode === "scratch" ? "Built from your description" : mode === "analyze" ? "Analysed from your posts" : "Set up later";
  return (
    <div className="a-act">
      <span className="a-done-mark"><window.IcCheck size={28} /></span>
      <div className="a-recap">
        <div className="a-recap-row">
          <span className="a-recap-ico"><window.IcAt size={16} /></span>
          <div className="a-recap-txt"><div className="a-recap-k">Connected account</div><div className="a-recap-v">{connected ? account.handle : "Add later in Settings"}</div></div>
          {connected ? <window.IcCheck size={17} className="a-recap-ok" /> : null}
        </div>
        <div className="a-recap-row">
          <span className="a-recap-ico"><window.IcVoice size={16} /></span>
          <div className="a-recap-txt"><div className="a-recap-k">Your voice</div><div className="a-recap-v">{voiceLabel}</div></div>
          {mode ? <window.IcCheck size={17} className="a-recap-ok" /> : null}
        </div>
      </div>
      <div className="a-act-foot a-act-foot--row">
        <a className="a-backlink" href="Voice.html">Refine your voice</a>
        <span className="grow" />
        <a className="btn btn--primary btn--lg" href="Studio.html">Go to Studio <window.IcArrowRight size={17} /></a>
      </div>
    </div>
  );
}

function DirAtelier({ flow, dark, onToggleTheme }) {
  const { stage } = flow;
  return (
    <div className="ob-dir dir-atelier">
      <ALeft flow={flow} />
      <main className="a-right">
        <ARightChrome flow={flow} dark={dark} onToggleTheme={onToggleTheme} />
        <div className="a-right-body">
          <div className="a-right-inner" key={stage}>
            {stage === "connect" && <AConnect flow={flow} />}
            {stage === "choose" && <AChoose flow={flow} />}
            {stage === "analyze" && <AAnalyze flow={flow} />}
            {stage === "scratch" && <AScratch flow={flow} />}
            {stage === "done" && <ADone flow={flow} />}
          </div>
        </div>
      </main>
    </div>
  );
}

Object.assign(window, { DirAtelier });
