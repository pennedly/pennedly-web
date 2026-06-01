// settings-parts.jsx — shell + presentational blocks for the Settings screen.
// All visuals reference the ink-on-paper tokens; no hardcoded colours.

const { useState: stS, useEffect: stE } = React;

/* ------------------------------- Avatar -------------------------------- */
function Mono({ text, size = 34, font = 13 }) {
  return <span className="mono" style={{ width: size, height: size, fontSize: font }}>{text}</span>;
}

/* ------------------------------- Sidebar ------------------------------- */
function Sidebar() {
  const nav = [
    { id: "studio",   label: "Studio",   Icon: window.IcStudio,   href: "Studio.html", badge: 4 },
    { id: "feed",     label: "My Feed",  Icon: window.IcFeed,     href: "Feed.html" },
    { id: "stats",    label: "Stats",    Icon: window.IcChart,    href: "Stats.html" },
    { id: "replies",  label: "Replies",  Icon: window.IcReplies,  href: "Replies.html", badge: 3 },
    { id: "autopilot",label: "Autopilot",Icon: window.IcBolt,     href: "Autopilot.html" },
    { id: "voice",    label: "Voice",    Icon: window.IcVoice,    href: "Voice.html" },
    { id: "rules",    label: "Rules",    Icon: window.IcSliders,  href: "Style Rules.html" },
    { id: "settings", label: "Settings", Icon: window.IcSettings, active: true },
  ];
  return (
    <aside className="sidebar">
      <div className="brand">
        <window.Logo size={34} radius={10} className="brand-mark" />
        <div>
          <div className="brand-name">Pennedly</div>
          <div className="brand-sub">Drafting partner</div>
        </div>
      </div>
      <nav className="nav">
        <div className="nav-cap">Workspace</div>
        {nav.map(({ id, label, Icon, active, badge, href }) => (
          <a key={id} className={`nav-item ${active ? "nav-item--active" : ""}`} href={href || undefined} tabIndex="0">
            <Icon size={16} />
            <span className="nav-label">{label}</span>
            {badge ? <span className="nav-badge">{badge}</span> : null}
          </a>
        ))}
      </nav>
      <div className="sidebar-foot">
        <button className="account">
          <Mono text={window.ST_USER.initials} size={32} font={12} />
          <div className="who">
            <div className="nm">{window.ST_USER.name}</div>
            <div className="hd">{window.ST_USER.handle}</div>
          </div>
          <window.IcChevDown size={15} className="chev" />
        </button>
      </div>
    </aside>
  );
}

/* -------------------------------- Topbar ------------------------------- */
function Topbar({ dark, onToggleTheme }) {
  return (
    <header className="topbar">
      <span className="topbar-title">Settings</span>
      <span className="topbar-spacer" />
      <div className="topbar-actions">
        <button className="icon-btn" aria-label="Toggle theme" onClick={onToggleTheme}>
          {dark ? <window.IcSun size={17} /> : <window.IcMoon size={16} />}
        </button>
        <button className="icon-btn" aria-label="Settings"><window.IcSettings size={17} /></button>
      </div>
    </header>
  );
}

/* ---------------------------- Account card ----------------------------- */
function AccountCard({ user }) {
  return (
    <section className="card">
      <div className="card-head"><div className="ch-row"><span className="h">Account</span></div></div>
      <div className="card-body">
        <div className="acct-id">
          <Mono text={user.initials} size={52} font={18} />
          <div className="who">
            <div className="nm">{user.name}</div>
            <div className="hd">{user.handle}</div>
          </div>
          <span className="plan-badge"><window.IcStar size={13} /> {user.plan}</span>
        </div>
        <div className="kv">
          <div className="kv-row">
            <span className="kv-k">Email</span>
            <span className="kv-v">{user.email}</span>
            <span className="kv-act"><button className="btn btn--ghost btn--sm">Change</button></span>
          </div>
          <div className="kv-row">
            <span className="kv-k">Plan</span>
            <span className="kv-v">{user.plan} <span className="note">· {user.planNote}</span></span>
            <span className="kv-act"><button className="btn btn--secondary btn--sm"><window.IcCard size={15} /> Manage plan</button></span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------- Language card ---------------------------- */
function LanguageCard({ languages, value, onChange }) {
  return (
    <section className="card">
      <div className="card-head">
        <div className="ch-row"><span className="h">Interface language</span></div>
        <div className="d">Changes the app’s labels and menus. Your drafts stay in the language you write them.</div>
      </div>
      <div className="card-body">
        <div className="lang-grid" role="radiogroup" aria-label="Interface language">
          {languages.map((l) => {
            const active = value === l.code;
            return (
              <button
                key={l.code} className={`lang ${active ? "lang--active" : ""}`}
                role="radio" aria-checked={active} onClick={() => onChange(l.code)}
              >
                <span className="lang-code">{l.code}</span>
                <span className="lang-txt">
                  <span className="lang-nm">{l.name}</span>
                  <span className="lang-rg">{l.region}</span>
                </span>
                <window.IcCheck size={16} className="lang-tick" />
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------- Connected account row ----------------------- */
function AccountRow({ acct, leaving, confirming, onAskDisconnect, onCancel, onConfirm }) {
  return (
    <div className={`acct-row ${leaving ? "acct-row--leaving" : ""}`}>
      <Mono text={acct.initials} size={40} font={14} />
      <div className="acct-main">
        <div className="acct-name">{acct.name}{acct.primary && <span className="acct-tag">Primary</span>}</div>
        <div className="acct-sub">
          <span>{acct.handle}</span>
          <span className="dot" />
          <span>{acct.followers} followers</span>
        </div>
      </div>
      <div className="acct-actions">
        {confirming ? (
          <div className="disconnect-confirm">
            <span className="dc-msg">Disconnect {acct.handle}?</span>
            <button className="btn btn--ghost btn--sm" onClick={onCancel}>Cancel</button>
            <button className="btn btn--danger btn--sm" onClick={() => onConfirm(acct)}><window.IcUnlink size={15} /> Disconnect</button>
          </div>
        ) : (
          <button className="btn btn--ghost btn--sm" onClick={() => onAskDisconnect(acct.id)}>Disconnect</button>
        )}
      </div>
    </div>
  );
}

/* ------------------------- Connected accounts card --------------------- */
function AccountsCard({ accounts, leavingIds, confirmingId, onAskDisconnect, onCancel, onConfirm, onConnect }) {
  return (
    <section className="card">
      <div className="card-head">
        <div className="ch-row"><span className="h">Connected Threads accounts</span></div>
        <div className="d">Pennedly drafts and posts for each connected account. Disconnecting stops all activity for that handle.</div>
      </div>
      <div className="acct-list" style={{ marginTop: 14 }}>
        {accounts.map((a) => (
          <AccountRow
            key={a.id} acct={a}
            leaving={leavingIds.includes(a.id)}
            confirming={confirmingId === a.id}
            onAskDisconnect={onAskDisconnect} onCancel={onCancel} onConfirm={onConfirm}
          />
        ))}
      </div>
      <div className="acct-foot">
        <button className="btn btn--secondary" onClick={onConnect}><window.IcLink size={16} /> Connect another account</button>
      </div>
    </section>
  );
}

/* ----------------------------- Shortcuts card -------------------------- */
function ShortcutsCard() {
  return (
    <section className="card">
      <div className="shortcut">
        <span className="shortcut-ico"><window.IcVoice size={18} /></span>
        <div className="shortcut-txt">
          <div className="shortcut-t">Your voice</div>
          <div className="shortcut-d">Shape how every draft sounds — themes, traits, and example posts.</div>
        </div>
        <span className="shortcut-act"><a className="btn btn--primary btn--sm" href="Voice.html"><window.IcArrowLeft size={15} style={{ transform: "rotate(180deg)" }} /> Open voice</a></span>
      </div>
      <div className="shortcut">
        <span className="shortcut-ico"><window.IcFlask size={18} /></span>
        <div className="shortcut-txt">
          <div className="shortcut-t">Preview mode <span className="acct-tag">Tester</span></div>
          <div className="shortcut-d">Try features before they ship. Things may change or break.</div>
        </div>
        <span className="shortcut-act"><button className="btn btn--secondary btn--sm"><window.IcEye size={15} /> Enter preview</button></span>
      </div>
    </section>
  );
}

/* ------------------------------ Skeleton ------------------------------- */
function CardSkeleton({ rows = 2, head = true }) {
  return (
    <section className="card skel">
      <div className="card-head">
        <div className="skel-line" style={{ width: 160, height: 15 }} />
        {head && <div className="skel-line" style={{ width: 280, height: 10, marginTop: 10 }} />}
      </div>
      <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {Array.from({ length: rows }).map((_, i) => <div className="skel-block" key={i} style={{ height: 46 }} />)}
      </div>
    </section>
  );
}
function SettingsSkeleton() {
  return (
    <>
      <div className="intro skel">
        <div className="skel-line" style={{ width: 90, height: 10 }} />
        <div className="skel-line" style={{ width: 220, height: 26, marginTop: 12 }} />
        <div className="skel-line" style={{ width: 360, height: 11, marginTop: 12 }} />
      </div>
      <CardSkeleton rows={2} head={false} />
      <CardSkeleton rows={4} />
      <CardSkeleton rows={3} head={false} />
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
          <div className="toast-body">
            <div className="toast-title">{t.title}</div>
            {t.sub && <div className="toast-sub">{t.sub}</div>}
          </div>
          {t.undo && <button className="toast-undo" onClick={() => onUndo(t)}>Undo</button>}
        </div>
      ))}
    </div>
  );
}

Object.assign(window, {
  Mono, Sidebar, Topbar, AccountCard, LanguageCard,
  AccountRow, AccountsCard, ShortcutsCard,
  SettingsSkeleton, CardSkeleton, Toasts,
});
