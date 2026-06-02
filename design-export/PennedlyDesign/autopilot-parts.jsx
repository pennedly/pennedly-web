// autopilot-parts.jsx — Autopilot cards + states.
// Sidebar / account / avatar come from the shared shell (shell-parts.jsx).
// Built on ds tokens + Studio shell classes. No hardcoded hex.

function Switch({ checked, onChange, big, label }) {
  return (
    <label className={`switch ${big ? "switch--lg" : ""}`}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} aria-label={label} />
      <span className="track" /><span className="knob" />
    </label>
  );
}
// options: [{ value, label }]; onChange gets the raw string value.
function Select({ value, onChange, options, ...rest }) {
  return (
    <select className="field" value={value} onChange={(e) => onChange(e.target.value)} {...rest}>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

/* -------------------------------- Topbar ------------------------------- */
function Topbar({ dark, onToggleTheme, on }) {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <span className="topbar-title">Autopilot</span>
        <span className={`status-pill ${on ? "status-pill--success" : ""}`}>
          <span className="pill-dot" />{on ? "Active" : "Off"}
        </span>
        <span className="topbar-spacer" />
        <div className="topbar-actions">
          <button className="icon-btn" aria-label="Toggle theme" onClick={onToggleTheme}>{dark ? <window.IcSun size={17} /> : <window.IcMoon size={16} />}</button>
          <a className="icon-btn" href="Settings.html" aria-label="Settings"><window.IcSettings size={17} /></a>
        </div>
      </div>
    </header>
  );
}

/* ----------------------------- Master card ----------------------------- */
function MasterCard({ on, onToggle }) {
  return (
    <div className={`ap-master ${on ? "ap-master--on" : ""}`}>
      <span className="am-icon"><window.IcBolt size={24} /></span>
      <div className="am-text">
        <div className="am-title">Autopilot</div>
        <div className="am-state"><span className="sdot" />{on ? "On \u00B7 posting and replying on your schedule" : "Off \u00B7 you approve everything yourself"}</div>
      </div>
      <Switch checked={on} onChange={onToggle} big label="Autopilot master switch" />
    </div>
  );
}

function Reassure({ on }) {
  if (on) return null;
  return (
    <div className="ap-reassure">
      <window.IcCheck size={16} className="ar-ico" />
      <div><b>Autopilot is off — nothing posts or replies without you.</b> Set up your schedules and reply policy below, then turn it on when you're ready. You can pause it again anytime.</div>
    </div>
  );
}

/* ----------------------------- Schedule card --------------------------- */
function ObjectCard({ obj, onChange, onRemove }) {
  const set = (k, v) => onChange(obj.id, { [k]: v });
  const localMin = window.apUtcToLocal(obj.utcMin);
  const timeOpts = window.TIME_SLOTS.map((m) => ({ value: m, label: window.apFmtClock(m) }));
  const jitterOpts = window.JITTER_OPTIONS.map((n) => ({ value: n, label: window.apFmtJitter(n) }));
  const topicOpts = window.TOPIC_OPTIONS.map((o) => ({ value: o, label: o }));
  return (
    <div className={`obj-card ${obj.on ? "" : "obj-card--off"}`}>
      <div className="obj-head">
        <input className="obj-name" value={obj.name} onChange={(e) => set("name", e.target.value)} aria-label="Schedule name" />
        <Switch checked={obj.on} onChange={(v) => set("on", v)} label="Enable this schedule" />
        <button className="icon-btn obj-remove" aria-label="Remove schedule" onClick={() => onRemove(obj.id)}><window.IcTrash size={16} /></button>
      </div>
      <div className="obj-grid">
        <div className="obj-field">
          <label>Post time</label>
          <Select value={localMin} onChange={(v) => set("utcMin", window.apLocalToUtc(Number(v)))} options={timeOpts} aria-label="Post time (your local time)" />
          <span className="obj-hint">{window.apFmtOffset()} · sends {window.apFmtUTC(obj.utcMin)}</span>
        </div>
        <div className="obj-field">
          <label>Random spread</label>
          <Select value={obj.jitter} onChange={(v) => set("jitter", Number(v))} options={jitterOpts} aria-label="Random minute spread" />
          <span className="obj-hint">{obj.jitter === 0 ? "Posts exactly at the time" : `Posts within \u00B1${obj.jitter} min`}</span>
        </div>
        <div className="obj-field">
          <label>Topic</label>
          <Select value={obj.topic} onChange={(v) => set("topic", v)} options={topicOpts} aria-label="Topic" />
        </div>
      </div>
      <div className="obj-foot">
        <label className="obj-seed">
          <Switch checked={obj.seed} onChange={(v) => set("seed", v)} label="Seed auto-reply on new posts" />
          New posts from this schedule start with auto-reply on
        </label>
        {!obj.on && <span className="obj-paused">Paused</span>}
      </div>
    </div>
  );
}

/* ----------------------- Account auto-reply policy --------------------- */
// Account-level — the worker honors THIS (audience + replies/day), not the
// per-schedule cards.
function PolicyCard({ policy, onChange }) {
  const set = (k, v) => onChange({ [k]: v });
  const audOpts = window.AUDIENCE_OPTIONS.map((o) => ({ value: o, label: o }));
  const capOpts = window.CAP_OPTIONS.map((o) => ({ value: o, label: o }));
  return (
    <div className="ap-section">
      <div className="ap-sec-head">
        <div>
          <div className="ap-sec-title">Auto-reply policy</div>
          <div className="ap-sec-sub">Account-wide. When on, replies are drafted in your voice and sent automatically under these limits.</div>
        </div>
        <Switch checked={policy.on} onChange={(v) => set("on", v)} label="Auto-reply master switch" />
      </div>
      <div className="ap-sec-body">
        <div className="policy-list" style={policy.on ? null : { opacity: 0.5, pointerEvents: "none" }}>
          <div className="policy-row">
            <div className="pr-label"><div className="pr-t">Who it replies to</div><div className="pr-d">The audience whose comments can get an automatic reply.</div></div>
            <div className="pr-control"><Select value={policy.audience} onChange={(v) => set("audience", v)} options={audOpts} aria-label="Reply audience" /></div>
          </div>
          <div className="policy-row">
            <div className="pr-label"><div className="pr-t">Replies per day</div><div className="pr-d">A safety limit on how many replies autopilot sends each day.</div></div>
            <div className="pr-control"><Select value={policy.cap} onChange={(v) => set("cap", v)} options={capOpts} aria-label="Replies per day" /></div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- Activity ------------------------------ */
function Counters({ counters }) {
  return (
    <div className="act-counters">
      {counters.map((c) => (
        <div className="counter" key={c.name}>
          <div className="c-name">{c.name}</div>
          <div className="c-nums">
            <span className="c-num">{c.posts}<small>posts</small></span>
            <span className="c-num">{c.replies}<small>replies</small></span>
          </div>
        </div>
      ))}
    </div>
  );
}
function AutoPostItem({ p }) {
  return (
    <div className="autopost">
      <div className="autopost-top">
        <span className="autopost-tag"><window.IcBolt size={12} />{p.object}</span>
        <span className="autopost-time spacer">{window.fmtDateTime(p.at)}</span>
      </div>
      <div className="autopost-text">{p.text}</div>
      <div className="autopost-foot">
        <div className="autopost-stats">
          <span className="ms"><window.IcEye size={13} />{p.views}</span>
          <span className="ms"><window.IcHeart size={13} />{p.likes}</span>
          <span className="ms"><window.IcBubble size={13} />{p.replies}</span>
        </div>
        <a className="act-link" href={p.link} target="_blank" rel="noopener noreferrer">View post<window.IcExternal size={13} /></a>
      </div>
    </div>
  );
}
function AutoReplyItem({ r }) {
  return (
    <div className="autoreply">
      <div className="ar-comment">
        <window.Avatar initials={r.from.initials} size={28} />
        <div className="arc-body">
          <div className="arc-who">{r.from.name} <span>{r.from.handle}</span></div>
          <div className="arc-text">{r.comment}</div>
        </div>
      </div>
      <div className="ar-reply">
        <div className="arr-body">
          <div className="arr-who">You <span className="arr-tag"><window.IcBolt size={11} />auto-replied</span></div>
          <div className="arr-text">{r.reply}</div>
        </div>
      </div>
      <div className="ar-foot">
        <span>{window.fmtDateTime(r.at)} · on a comment to your “{r.onPost}” post</span>
        <a className="act-link" href={r.link} target="_blank" rel="noopener noreferrer">View thread<window.IcExternal size={13} /></a>
      </div>
    </div>
  );
}

/* ------------------------------ Empty/Skel ----------------------------- */
function EmptyObjects({ onAdd }) {
  return (
    <div className="ap-empty">
      <div className="ape-mark"><window.IcBolt size={22} /></div>
      <div className="ape-title">No schedules yet</div>
      <div className="ape-sub">Add a schedule and Pennedly will draft and post on a rhythm — always in your voice, always visible in your feed.</div>
      <button className="btn btn--secondary" onClick={onAdd}><window.IcPlus size={16} /> Add a schedule</button>
    </div>
  );
}
function EmptyActivity() {
  return (
    <div className="ap-empty">
      <div className="ape-mark"><window.IcClock size={22} /></div>
      <div className="ape-title">No activity yet</div>
      <div className="ape-sub">Once autopilot runs, the posts it publishes and the replies it sends will appear here for you to review.</div>
    </div>
  );
}
function SkeletonDash() {
  return (
    <>
      <div className="ap-master skeleton" aria-hidden="true">
        <div className="skel-line" style={{ width: 46, height: 46, borderRadius: 12 }} />
        <div style={{ flex: 1 }}><div className="skel-line" style={{ width: 120, height: 18 }} /><div className="skel-line" style={{ width: 220, height: 11, marginTop: 8 }} /></div>
        <div className="skel-line" style={{ width: 56, height: 30, borderRadius: 99 }} />
      </div>
      {[0, 1].map((i) => (
        <div className="ap-section skeleton" key={i} aria-hidden="true">
          <div className="skel-line" style={{ width: 160, height: 16 }} />
          <div className="skel-line" style={{ width: "100%", height: 80, marginTop: 16, borderRadius: 10 }} />
        </div>
      ))}
    </>
  );
}

/* -------------------------------- Toasts ------------------------------- */
function Toasts({ toasts, onUndo }) {
  return (
    <div className="toast-host">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.kind === "error" ? "error" : "success"}`}>
          <span className="toast-mark" />
          <div className="toast-body"><div className="toast-title">{t.title}</div>{t.sub && <div className="toast-sub">{t.sub}</div>}</div>
          {t.undo && <button className="toast-undo" onClick={() => onUndo(t)}>Undo</button>}
        </div>
      ))}
    </div>
  );
}

Object.assign(window, {
  Switch, Select, Topbar, MasterCard, Reassure, ObjectCard, PolicyCard,
  Counters, AutoPostItem, AutoReplyItem, EmptyObjects, EmptyActivity, SkeletonDash, Toasts,
});
