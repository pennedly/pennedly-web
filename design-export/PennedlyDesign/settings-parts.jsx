// settings-parts.jsx — presentational blocks for the Settings screen.
// Sidebar / account / avatar come from the shared shell (shell-parts.jsx).
// All visuals reference the ink-on-paper tokens; no hardcoded colours.

/* -------------------------------- Topbar ------------------------------- */
function Topbar({ dark, onToggleTheme }) {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <span className="topbar-title">Settings</span>
        <span className="topbar-spacer" />
        <div className="topbar-actions">
          <button className="icon-btn" aria-label="Toggle theme" onClick={onToggleTheme}>
            {dark ? <window.IcSun size={17} /> : <window.IcMoon size={16} />}
          </button>
        </div>
      </div>
    </header>
  );
}

/* ---------------------------- Account card ----------------------------- */
// avatar + email + plan. Identity is the signed-in Pennedly user (SHELL_USER);
// the avatar reuses the primary connected account's photo.
function AccountCard() {
  const primary = window.SHELL_ACCOUNTS[0];
  const user = window.SHELL_USER;
  return (
    <section className="card">
      <div className="card-head"><div className="ch-row"><span className="h">Account</span></div></div>
      <div className="card-body">
        <div className="acct-id">
          <window.Avatar src={primary.avatar} initials={primary.initials} size={52} />
          <div className="who">
            <div className="nm">{user.email}</div>
            <div className="hd">{window.PLAN_NOTE}</div>
          </div>
          <span className="plan-badge"><window.IcStar size={13} /> {user.plan}</span>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------- Language card ---------------------------- */
function LanguageCard({ value, onChange }) {
  const langs = window.UI_LANGS;
  return (
    <section className="card">
      <div className="card-head">
        <div className="ch-row"><span className="h">Interface language</span></div>
        <div className="d">Changes the app’s labels and menus. Your drafts stay in the language you write them in.</div>
      </div>
      <div className="card-body">
        <div className="lang-grid" role="radiogroup" aria-label="Interface language">
          {langs.map((l) => {
            const active = value === l.code;
            return (
              <button
                key={l.code} className={`lang ${active ? "lang--active" : ""}`}
                role="radio" aria-checked={active} onClick={() => onChange(l.code)}
              >
                <span className="lang-flag" aria-hidden="true">{window.LANG_FLAGS[l.code]}</span>
                <span className="lang-txt">
                  <span className="lang-nm">{l.native}</span>
                  <span className="lang-rg">{l.label}</span>
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
  const primary = acct.active || acct.primary;
  return (
    <div className={`acct-row ${leaving ? "acct-row--leaving" : ""}`}>
      <window.Avatar src={acct.avatar} initials={acct.initials} size={40} />
      <div className="acct-main">
        <div className="acct-name">{acct.name}{primary && <span className="acct-tag">Primary</span>}</div>
        <div className="acct-sub"><span>{acct.handle}</span></div>
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
  const empty = accounts.length === 0;
  return (
    <section className="card">
      <div className="card-head">
        <div className="ch-row"><span className="h">Connected Threads accounts</span></div>
        <div className="d">Pennedly drafts and posts for each connected account. Disconnecting stops all activity for that handle.</div>
      </div>
      {empty ? (
        <div className="acct-empty">
          <span className="ae-mark"><window.IcLink size={20} /></span>
          <div className="ae-title">No accounts connected</div>
          <div className="ae-sub">Connect a Threads account and Pennedly can start drafting for it.</div>
        </div>
      ) : (
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
      )}
      <div className="acct-foot">
        <button className="btn btn--secondary" onClick={onConnect}>
          <window.IcLink size={16} /> {empty ? "Connect a Threads account" : "Connect another account"}
        </button>
      </div>
    </section>
  );
}

/* ---------------------------- Voice setup card ------------------------- */
// Links to onboarding (re-run voice setup); testers also get a preview-mode link.
function VoiceSetupCard({ isTester, onPreview }) {
  return (
    <section className="card">
      <div className="shortcut">
        <span className="shortcut-ico"><window.IcVoice size={18} /></span>
        <div className="shortcut-txt">
          <div className="shortcut-t">Voice setup</div>
          <div className="shortcut-d">Walk back through onboarding to re-teach Pennedly how you sound.</div>
        </div>
        <span className="shortcut-act">
          <a className="btn btn--primary btn--sm" href="Onboarding.html">Open setup <window.IcArrowLeft size={15} style={{ transform: "rotate(180deg)" }} /></a>
        </span>
      </div>
      {isTester && (
        <div className="shortcut">
          <span className="shortcut-ico"><window.IcFlask size={18} /></span>
          <div className="shortcut-txt">
            <div className="shortcut-t">Preview mode <span className="acct-tag">Tester</span></div>
            <div className="shortcut-d">Try features before they ship. Things may change or break.</div>
          </div>
          <span className="shortcut-act"><button className="btn btn--secondary btn--sm" onClick={onPreview}><window.IcEye size={15} /> Enter preview</button></span>
        </div>
      )}
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
      <CardSkeleton rows={1} head={false} />
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
  Topbar, AccountCard, LanguageCard, AccountRow, AccountsCard, VoiceSetupCard,
  SettingsSkeleton, CardSkeleton, Toasts,
});
