// shell-parts.jsx — shared app-shell components (§4): Avatar, the canonical
// Sidebar (driven by SHELL_NAV with an `active` id), and the consolidated
// account control + upward switcher menu. Exported to window so every screen
// renders <window.Sidebar active="…" /> instead of hand-rolling its own.

/* --------------------------------- Avatar ------------------------------ */
// Real profile photo with the initials monogram as fallback only (§3.4).
function Avatar({ src, initials = "", size = 32, font }) {
  const f = font || Math.round(size * 0.42);
  return (
    <span className="avatar" style={{ width: size, height: size }}>
      {src
        ? <img className="avatar-img" src={src} alt="" />
        : <span className="avatar-mono" style={{ fontSize: f }}>{initials}</span>}
    </span>
  );
}

/* ----------------------------- Account menu ---------------------------- */
function AccountMenu() {
  const [open, setOpen] = React.useState(false);
  const accounts = window.SHELL_ACCOUNTS;
  const user = window.SHELL_USER;
  const active = accounts.find((a) => a.active) || accounts[0];

  return (
    <>
      {open && <div className="acct-scrim" onClick={() => setOpen(false)} />}
      {open && (
        <div className="acct-menu" role="menu">
          <div className="acct-cap">Switch account</div>
          {accounts.map((a) => (
            <button key={a.id} className="acct-row" role="menuitemradio" aria-checked={!!a.active} onClick={() => setOpen(false)}>
              <Avatar src={a.avatar} initials={a.initials} size={30} />
              <span className="who"><span className="nm">{a.name}</span><span className="hd">{a.handle}</span></span>
              {a.active ? <window.IcCheck size={16} className="acct-check" /> : <span className="acct-check--off" />}
            </button>
          ))}
          <button className="acct-link" role="menuitem" onClick={() => setOpen(false)}>
            <window.IcPlus size={17} className="al-ico" /> Connect another account
          </button>

          <div className="acct-sep" />

          <div className="acct-id">
            <div className="ai-em">{user.email}</div>
            <div className="ai-plan"><span className="ai-dot" />{user.plan}</div>
          </div>
          <a className="acct-link" role="menuitem" href="Settings.html">
            <window.IcSettings size={17} className="al-ico" /> Settings
          </a>
          <button className="acct-link acct-link--danger" role="menuitem" onClick={() => setOpen(false)}>
            <window.IcLogout size={17} className="al-ico" /> Log out
          </button>
        </div>
      )}
      <button className="account" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <Avatar src={active.avatar} initials={active.initials} size={32} />
        <div className="who"><div className="nm">{active.name}</div><div className="hd">{active.handle}</div></div>
        <window.IcChevDown size={15} className="chev" />
      </button>
    </>
  );
}

/* -------------------------------- Sidebar ------------------------------ */
function Sidebar({ active }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <window.Logo size={34} radius={10} className="brand-mark" />
        <div><div className="brand-name">Pennedly</div><div className="brand-sub">Drafting partner</div></div>
      </div>
      <nav className="nav">
        {window.SHELL_NAV.map((group) => (
          <React.Fragment key={group.cap}>
            <div className="nav-cap">{group.cap}</div>
            {group.items.map(({ id, label, Icon, href, badge }) => (
              <a key={id} href={href} className={`nav-item ${id === active ? "nav-item--active" : ""}`} tabIndex="0" aria-current={id === active ? "page" : undefined}>
                <Icon size={16} /><span className="nav-label">{label}</span>
                {badge ? <span className="nav-badge">{badge}</span> : null}
              </a>
            ))}
          </React.Fragment>
        ))}
      </nav>
      <div className="sidebar-foot">
        <AccountMenu />
      </div>
    </aside>
  );
}

Object.assign(window, { Avatar, AccountMenu, Sidebar });
