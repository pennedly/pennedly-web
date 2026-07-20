// landing-parts.jsx — sections for the public landing page (/).
// Product-forward composition: a calm hero with a live "Studio" product peek, a
// bento feature grid, and a legal footer. All visuals reference the ink-on-paper
// tokens; no hardcoded colours. Self-contained (local Avatar; no app shell).

const { useState: lpS, useRef: lpR, useEffect: lpE } = React;

/* --------------------------------- Avatar ------------------------------ */
// Real profile photo with the initials monogram as fallback (mirrors §3.4).
function Avatar({ src, initials = "", size = 32 }) {
  return (
    <span className="avatar" style={{ width: size, height: size }}>
      {src ? <img className="avatar-img" src={src} alt="" /> : <span className="avatar-mono" style={{ fontSize: Math.round(size * 0.42) }}>{initials}</span>}
    </span>
  );
}

/* --------------------------- Language switcher ------------------------- */
// Top-bar control; the page localizes to 8 locales (EN baseline). Selecting a
// language sets the displayed locale; full copy swap is wired at the i18n layer.
function LanguageSwitcher() {
  const [open, setOpen] = lpS(false);
  const [lang, setLang] = lpS(window.LAND_LANGS[0]);
  const ref = lpR(null);
  lpE(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc); document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open]);
  return (
    <div className="lang" ref={ref}>
      <button className="lang-trigger" aria-haspopup="listbox" aria-expanded={open} aria-label="Change language" onClick={() => setOpen((v) => !v)}>
        <window.IcGlobe size={16} />
        <span className="lang-code">{lang.code}</span>
        <window.IcChevDown size={14} className="lang-chev" />
      </button>
      {open && (
        <div className="lang-menu" role="listbox" aria-label="Language">
          {window.LAND_LANGS.map((l) => (
            <button key={l.code} role="option" aria-selected={l.code === lang.code}
              className={`lang-opt ${l.code === lang.code ? "is-on" : ""}`}
              onClick={() => { setLang(l); setOpen(false); }}>
              <span className="lang-opt-label">{l.label}</span>
              <span className="lang-opt-code">{l.code}</span>
              {l.code === lang.code && <window.IcCheck size={14} className="lang-opt-ok" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------- Top bar ------------------------------- */
function TopBar({ dark, onToggleTheme }) {
  const L = window.LAND;
  return (
    <header className="land-top">
      <div className="wrap land-top-row">
        <div className="brand">
          <window.Logo size={30} radius={9} className="bm" />
          <span className="bn">Pennedly</span>
        </div>
        <span className="sp" />
        <div className="actions">
          <LanguageSwitcher />
          <button className="icon-btn" aria-label="Toggle theme" onClick={onToggleTheme}>
            {dark ? <window.IcSun size={17} /> : <window.IcMoon size={16} />}
          </button>
          <a className="btn btn--primary" href="Login.html">{L.signIn}</a>
        </div>
      </div>
    </header>
  );
}

/* --------------------------- Studio window peek ------------------------ */
// A crisp peek of the product: an account rail + a composer drafting in voice.
// Illustrative — not a live feed.
function StudioWindow() {
  const L = window.LAND, s = window.LAND_SAMPLE;
  return (
    <div className="window land-rise" aria-hidden="true">
      <div className="winbar">
        <span className="dots"><i /><i /><i /></span>
        <span className="url">{L.winUrl}<span className="url-path">{L.winPath}</span></span>
      </div>
      <div className="app">
        <aside className="rail">
          {window.LAND_ACCOUNTS.map((a, i) => (
            <span key={i} className={`rail-acct ${i === 0 ? "is-active" : ""}`}><Avatar src={a.avatar} initials={a.initials} size={28} /></span>
          ))}
          <span className="rail-add" aria-hidden="true"><window.IcPlus size={15} /></span>
        </aside>
        <div className="compose">
          <div className="compose-head">
            <Avatar src={s.avatar} initials={s.initials} size={34} />
            <div className="spec-id"><div className="spec-name">{s.name}</div><div className="spec-handle">{s.handle}</div></div>
            <span className="badge"><span className="bdot" /> {L.draftLabel}</span>
          </div>
          <p className="compose-text">{s.text}<span className="caret" /></p>
          <div className="compose-tools">
            <span className="chip chip--accent"><window.IcSparkle size={12} /> {L.voiceTag}</span>
            <span className="chip"><window.IcVoice size={12} /> {L.toneTag}</span>
          </div>
          <div className="compose-foot">
            <span className="foot-note">{L.composeNote}</span>
            <span className="grow" />
            <span className="ghost"><window.IcPencil size={13} /> {L.edit}</span>
            <span className="ink"><window.IcCheck size={13} /> {L.approveBtn}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- Hero ---------------------------------- */
function Hero({ showSample }) {
  const L = window.LAND;
  return (
    <section className="hero">
      <div className={`wrap hero-grid ${showSample ? "" : "hero-grid--solo"}`}>
        <div className="hero-text land-rise">
          <span className="status"><span className="sdot" /> {L.status}</span>
          <h1 className="hero-title">{L.headline}</h1>
          <p className="hero-lead">{L.lead}</p>
          <p className="hero-approve">{L.approve} <span className="emph">{L.autopilot}</span></p>
          <div className="hero-cta">
            <a className="btn btn--primary btn--lg" href="Login.html">{L.signIn} <window.IcArrowRight size={17} /></a>
            <a className="contact" href={`mailto:${L.contactEmail}`}><window.IcMail size={15} className="c-ico" /> {L.contactEmail}</a>
          </div>
        </div>
        {showSample && <StudioWindow />}
      </div>
    </section>
  );
}

/* ----------------------------- Features (bento) ------------------------ */
const FEAT_ICONS = { voice: window.IcVoice, replies: window.IcReplies, audits: window.IcAudit, analytics: window.IcChart, autopilot: window.IcBolt, accounts: window.IcUsers };
function Features() {
  const L = window.LAND;
  return (
    <section className="features">
      <div className="wrap">
        <div className="feat-head">
          <span className="eyebrow">{L.featEyebrow}</span>
          <h2 className="feat-title">{L.featTitle}</h2>
        </div>
        <div className="bento">
          {window.LAND_FEATURES.map((f) => {
            const Ico = FEAT_ICONS[f.ico] || window.IcCheck;
            const span = f.span === "wide" ? "feat--wide" : f.span === "full" ? "feat--full" : "";
            return (
              <article className={`feat ${span}`} key={f.title}>
                <div className="feat-head">
                  <span className="feat-ico"><Ico size={18} /></span>
                  <h3 className="feat-t">{f.title}</h3>
                </div>
                <p className="feat-d">{f.desc}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ Footer --------------------------------- */
function Footer() {
  return (
    <footer className="land-foot">
      <div className="wrap land-foot-row">
        <span className="foot-brand"><window.Logo size={20} radius={6} className="fm" /> © {new Date().getFullYear()} Pennedly</span>
        <span className="foot-sp" />
        <nav className="foot-links" aria-label="Legal">
          {window.LAND_FOOTER.map((l) => <a key={l.label} href={l.href}>{l.label}</a>)}
        </nav>
      </div>
    </footer>
  );
}

Object.assign(window, { Avatar, LanguageSwitcher, TopBar, StudioWindow, Hero, Features, Footer });
