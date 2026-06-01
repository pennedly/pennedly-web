// landing-parts.jsx — sections for the public landing page.
// All visuals reference the ink-on-paper tokens; no hardcoded colours.

function Mono({ text, size = 34, font = 13 }) {
  return <span className="mono" style={{ width: size, height: size, fontSize: font }}>{text}</span>;
}

/* ------------------------------ Top bar -------------------------------- */
function TopBar({ dark, onToggleTheme }) {
  return (
    <header className="land-top">
      <div className="wrap">
        <div className="brand">
          <window.Logo size={34} radius={10} className="bm" />
          <span className="bn">Pennedly</span>
        </div>
        <span className="sp" />
        <div className="actions">
          <button className="icon-btn" aria-label="Toggle theme" onClick={onToggleTheme}>
            {dark ? <window.IcSun size={17} /> : <window.IcMoon size={16} />}
          </button>
          <a className="btn btn--secondary" href="Login.html">Sign in</a>
        </div>
      </div>
    </header>
  );
}

/* ----------------------------- Specimen -------------------------------- */
function Specimen() {
  const s = window.LAND_SAMPLE;
  return (
    <div className="specimen land-rise" aria-hidden="true">
      <div className="specimen-tilt">
        <div className="spec-head">
          <Mono text={s.initials} size={36} font={13} />
          <div className="spec-id">
            <div className="spec-name">{s.name}</div>
            <div className="spec-handle">{s.handle}</div>
          </div>
          <span className="spec-badge"><span className="bdot" /> Draft</span>
        </div>
        <p className="spec-body">{s.text}</p>
        <div className="spec-foot">
          <span className="spec-tag"><window.IcSparkle size={13} className="vt" /> In your voice</span>
          <div className="spec-actions">
            <span className="spec-ghost"><window.IcPencil size={13} /> Edit</span>
            <span className="spec-ink"><window.IcCheck size={13} /> Approve</span>
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
      <div className="wrap">
        <div className="hero-text land-rise">
          <span className="status"><span className="sdot" /> {L.status}</span>
          <h1 className="hero-title">{L.tagline}</h1>
          <div className="hero-lead">
            <p className="lh">{L.leadHead}</p>
            <p className="lb">{L.leadBody} <span className="le">{L.leadEmph}</span></p>
          </div>
          <div className="hero-cta">
            <a className="btn btn--primary btn--lg" href="Login.html">Sign in <window.IcArrowRight size={17} /></a>
            <a className="contact" href={`mailto:${L.contactEmail}`}><window.IcMail size={15} className="c-ico" /> {L.contactEmail}</a>
          </div>
        </div>
        {showSample && <Specimen />}
      </div>
    </section>
  );
}

/* ----------------------------- Features -------------------------------- */
const FEAT_ICONS = { voice: window.IcVoice, check: window.IcCheck, users: window.IcUsers, chart: window.IcChart };
function Features() {
  return (
    <section className="features">
      <div className="wrap">
        <div className="feat-grid">
          {window.LAND_FEATURES.map((f) => {
            const Ico = FEAT_ICONS[f.ico] || window.IcCheck;
            return (
              <div className="feat" key={f.title}>
                <span className="feat-ico"><Ico size={17} /></span>
                <div className="feat-t">{f.title}</div>
                <div className="feat-d">{f.desc}</div>
              </div>
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
      <div className="wrap">
        <span className="foot-brand">
          <window.Logo size={20} radius={6} className="fm" />
          © {new Date().getFullYear()} Pennedly
        </span>
        <span className="foot-sp" />
        <nav className="foot-links" aria-label="Legal">
          {window.LAND_FOOTER.map((l) => (
            <a key={l.label} href={l.href}>{l.label}</a>
          ))}
        </nav>
      </div>
    </footer>
  );
}

Object.assign(window, { Mono, TopBar, Specimen, Hero, Features, Footer });
