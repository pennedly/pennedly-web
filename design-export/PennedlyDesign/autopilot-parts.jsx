// autopilot-parts.jsx — shell + cards for the Autopilot screen.
// Reuses Studio shell classes (studio.css) + ds tokens. No hardcoded hex.

function APMono({ text, size = 32, font = 12 }) {
  return <span className="mono" style={{ width: size, height: size, fontSize: font }}>{text}</span>;
}
function Switch({ checked, onChange, big, label }) {
  return (
    <label className={`switch ${big ? "switch--lg" : ""}`}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} aria-label={label} />
      <span className="track" /><span className="knob" />
    </label>
  );
}
function Select({ value, onChange, options, ...rest }) {
  return (
    <select className="field" value={value} onChange={(e) => onChange(e.target.value)} {...rest}>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

/* ------------------------------- Sidebar ------------------------------- */
function Sidebar() {
  const nav = [
    { id: "studio", label: "Studio", Icon: window.IcStudio, badge: 4 },
    { id: "feed", label: "My Feed", Icon: window.IcFeed },
    { id: "stats", label: "Stats", Icon: window.IcChart },
    { id: "replies", label: "Replies", Icon: window.IcReplies, badge: 3 },
    { id: "autopilot", label: "Autopilot", Icon: window.IcBolt, active: true },
    { id: "settings", label: "Settings", Icon: window.IcSettings },
  ];
  return (
    <aside className="sidebar">
      <div className="brand">
        <window.Logo size={34} radius={10} className="brand-mark" />
        <div><div className="brand-name">Pennedly</div><div className="brand-sub">Drafting partner</div></div>
      </div>
      <nav className="nav">
        <div className="nav-cap">Workspace</div>
        {nav.map(({ id, label, Icon, active, badge }) => (
          <a key={id} className={`nav-item ${active ? "nav-item--active" : ""}`} tabIndex="0">
            <Icon size={16} /><span className="nav-label">{label}</span>
            {badge ? <span className="nav-badge">{badge}</span> : null}
          </a>
        ))}
      </nav>
      <div className="sidebar-foot">
        <button className="account">
          <APMono text={window.AP_USER.initials} size={32} font={12} />
          <div className="who"><div className="nm">{window.AP_USER.name}</div><div className="hd">{window.AP_USER.handle}</div></div>
          <window.IcChevDown size={15} className="chev" />
        </button>
      </div>
    </aside>
  );
}

/* -------------------------------- Topbar ------------------------------- */
function Topbar({ dark, onToggleTheme, on }) {
  return (
    <header className="topbar">
      <span className="topbar-title">Autopilot</span>
      <span className={`topbar-pill ${on ? "topbar-pill--on" : ""}`}><span className="pdot" />{on ? "Active" : "Off"}</span>
      <span className="topbar-spacer" />
      <div className="topbar-actions">
        <button className="icon-btn" aria-label="Toggle theme" onClick={onToggleTheme}>{dark ? <window.IcSun size={17} /> : <window.IcMoon size={16} />}</button>
        <button className="icon-btn" aria-label="Settings"><window.IcSettings size={17} /></button>
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
        <div className="am-state"><span className="sdot" />{on ? "On · posting and replying on your schedule" : "Off · you approve everything yourself"}</div>
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
      <div><b>Autopilot is off — nothing posts or replies without you.</b> Set up your schedule and reply policy below, then turn it on when you're ready. You can pause it again anytime.</div>
    </div>
  );
}

/* ----------------------------- Object card ----------------------------- */
function ObjectCard({ obj, onChange, onRemove }) {
  const set = (k, v) => onChange(obj.id, { [k]: v });
  return (
    <div className={`obj-card ${obj.on ? "" : "obj-card--off"}`}>
      <div className="obj-head">
        <input className="obj-name" value={obj.name} onChange={(e) => set("name", e.target.value)} aria-label="Schedule name" />
        <Switch checked={obj.on} onChange={(v) => set("on", v)} label="Enable this schedule" />
        <button className="icon-btn obj-remove" style={{ width: 34, height: 34 }} aria-label="Remove schedule" onClick={() => onRemove(obj.id)}><window.IcTrash size={16} /></button>
      </div>
      <div className="obj-grid">
        <div className="obj-field"><label>Post time · {window.TZ}</label><Select value={obj.time} onChange={(v) => set("time", v)} options={window.TIME_OPTIONS} /></div>
        <div className="obj-field"><label>Timing jitter</label><Select value={obj.jitter} onChange={(v) => set("jitter", v)} options={window.JITTER_OPTIONS} /></div>
        <div className="obj-field"><label>Topic</label><Select value={obj.topic} onChange={(v) => set("topic", v)} options={window.TOPIC_OPTIONS} /></div>
      </div>
      <div className="obj-foot">
        <label className="obj-seed"><Switch checked={obj.seeds} onChange={(v) => set("seeds", v)} label="Seed auto-replies" /> Let these posts seed auto-replies</label>
        {!obj.on && <span className="obj-paused">Paused</span>}
      </div>
    </div>
  );
}

/* ----------------------------- Policy card ----------------------------- */
function PolicyCard({ policy, onChange }) {
  const set = (k, v) => onChange({ [k]: v });
  return (
    <div className="ap-section">
      <div className="ap-sec-head">
        <div><div className="ap-sec-title">Auto-reply policy</div><div className="ap-sec-sub">When on, replies are drafted in your voice and sent automatically.</div></div>
        <Switch checked={policy.on} onChange={(v) => set("on", v)} label="Auto-reply on" />
      </div>
      <div className="ap-sec-body">
        <div className="policy-list" style={policy.on ? null : { opacity: 0.5, pointerEvents: "none" }}>
          <div className="policy-row">
            <div className="pr-label"><div className="pr-t">Who it replies to</div><div className="pr-d">Choose the audience whose comments get an automatic reply.</div></div>
            <div className="pr-control"><Select value={policy.audience} onChange={(v) => set("audience", v)} options={window.AUDIENCE_OPTIONS} /></div>
          </div>
          <div className="policy-row">
            <div className="pr-label"><div className="pr-t">Daily reply cap</div><div className="pr-d">A safety limit on how many replies autopilot sends per day.</div></div>
            <div className="pr-control"><Select value={policy.cap} onChange={(v) => set("cap", v)} options={window.CAP_OPTIONS} /></div>
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
        <span className="autopost-time spacer">{p.time}</span>
      </div>
      <div className="autopost-text">{p.text}</div>
      <div className="autopost-stats">
        <span className="ms"><window.IcEye size={13} />{p.views}</span>
        <span className="ms"><window.IcHeart size={13} />{p.likes}</span>
        <span className="ms"><window.IcBubble size={13} />{p.replies}</span>
      </div>
    </div>
  );
}
function AutoReplyItem({ r }) {
  return (
    <div className="autoreply">
      <div className="ar-comment">
        <APMono text={r.to.initials} size={28} font={11} />
        <div className="arc-body">
          <div className="arc-who">{r.to.name} <span>{r.to.handle}</span></div>
          <div className="arc-text">{r.comment}</div>
        </div>
      </div>
      <div className="ar-reply">
        <div className="arr-body">
          <div className="arr-who">You <span className="arr-tag"><window.IcBolt size={11} />auto-replied</span></div>
          <div className="arr-text">{r.reply}</div>
        </div>
      </div>
      <div className="ar-foot">{r.time} · under your “{r.on}” schedule</div>
    </div>
  );
}

/* ------------------------------ Empty/Skel ----------------------------- */
function EmptyObjects({ onAdd }) {
  return (
    <div className="ap-empty">
      <div className="ape-mark"><window.IcBolt size={22} /></div>
      <div className="ape-title">No scheduled posts yet</div>
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
      <div className="ape-sub">Once autopilot runs, its posts and the replies it sends will appear here for you to review.</div>
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
  APMono, Switch, Select, Sidebar, Topbar, MasterCard, Reassure, ObjectCard, PolicyCard,
  Counters, AutoPostItem, AutoReplyItem, EmptyObjects, EmptyActivity, SkeletonDash, Toasts,
});
