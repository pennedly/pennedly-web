// login-parts.jsx — presentational blocks for the passwordless sign-in screen.
// All visuals reference the ink-on-paper tokens; no hardcoded colours.

const { useState: lgS, useEffect: lgE, useRef: lgR } = React;

/* --------------------------- Language switch --------------------------- */
function LangSwitch({ value, onChange }) {
  const [open, setOpen] = lgS(false);
  const ref = lgR(null);
  lgE(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const k = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", h); document.addEventListener("keydown", k);
    return () => { document.removeEventListener("mousedown", h); document.removeEventListener("keydown", k); };
  }, [open]);
  const cur = window.LOGIN_LANGS.find((l) => l.code === value) || window.LOGIN_LANGS[0];
  return (
    <div className={`lang-switch ${open ? "open" : ""}`} ref={ref}>
      <button className="lang-btn" onClick={() => setOpen((v) => !v)} aria-haspopup="listbox" aria-expanded={open}>
        <window.IcGlobe size={15} />
        <span className="lc">{cur.code}</span>
        <window.IcChevDown size={14} className="chev" />
      </button>
      {open && (
        <div className="lang-menu" role="listbox" aria-label="Interface language">
          {window.LOGIN_LANGS.map((l) => (
            <button
              key={l.code} className="lang-opt" role="option" aria-selected={l.code === value}
              onClick={() => { onChange(l.code); setOpen(false); }}
            >
              <span className="lc">{l.code}</span>
              <span className="lo-name">{l.name}</span>
              <window.IcCheck size={15} className="lo-tick" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------- Header -------------------------------- */
function LoginHeader({ title, sub }) {
  return (
    <div className="login-head">
      <window.Logo size={52} radius={14} className="login-mark" />
      <h1 className="login-title">{title}</h1>
      <p className="login-sub">{sub}</p>
    </div>
  );
}

/* ------------------------------- Alert --------------------------------- */
function Alert({ text }) {
  if (!text) return null;
  return (
    <div className="alert" role="alert">
      <window.IcAlert size={16} className="al-ico" />
      <span className="al-txt">{text}</span>
    </div>
  );
}

/* ----------------------------- Email form ------------------------------ */
function EmailForm({ email, setEmail, onGoogle, onSubmit, busyGoogle, error }) {
  const valid = /\S+@\S+\.\S+/.test(email.trim());
  return (
    <div className="view">
      <div className="auth-actions">
        <button className="btn btn--secondary btn--google" onClick={onGoogle} disabled={busyGoogle}>
          {busyGoogle ? <><span className="spinner" /> {window.LOGIN_COPY.signingGoogle}</> : <><window.GoogleMark size={18} /> {window.LOGIN_COPY.google}</>}
        </button>
      </div>

      <div className="or"><span>or</span></div>

      <form className="email-form" onSubmit={(e) => { e.preventDefault(); if (valid) onSubmit(); }}>
        <label className="fld">
          <span className="fld-label">Email</span>
          <input
            className={`fld-input ${error ? "has-error" : ""}`} type="email" inputMode="email"
            autoComplete="email" placeholder={window.LOGIN_COPY.emailPlaceholder}
            value={email} onChange={(e) => setEmail(e.target.value)} autoFocus
          />
        </label>
        <Alert text={error} />
        <button className="btn btn--primary btn--lg btn-block" type="submit" disabled={!valid}>
          <window.IcMail size={17} /> {window.LOGIN_COPY.emailCta}
        </button>
      </form>

      <p className="consent">
        By continuing you agree to Pennedly’s <a href="#terms">Terms</a> and <a href="#privacy">Privacy Policy</a>.
      </p>
    </div>
  );
}

/* ------------------------------ OTP input ------------------------------ */
function OtpInput({ value, onChange, error, onComplete }) {
  const refs = lgR([]);
  function setDigit(i, d) {
    const next = value.split("");
    next[i] = d;
    const joined = next.join("").slice(0, 6);
    onChange(joined);
    return joined;
  }
  function handleChange(i, raw) {
    const d = (raw.match(/\d/g) || []).join("");
    if (!d) { setDigit(i, ""); return; }
    if (d.length > 1) { // paste-like into one box
      const joined = (value.slice(0, i) + d).slice(0, 6);
      onChange(joined);
      const focusAt = Math.min(joined.length, 5);
      requestAnimationFrame(() => refs.current[focusAt] && refs.current[focusAt].focus());
      if (joined.length === 6) onComplete && onComplete(joined);
      return;
    }
    const joined = setDigit(i, d);
    if (i < 5) refs.current[i + 1] && refs.current[i + 1].focus();
    if (joined.length === 6 && !joined.includes("")) onComplete && onComplete(joined);
  }
  function handleKey(i, e) {
    if (e.key === "Backspace") {
      if (value[i]) { setDigit(i, ""); }
      else if (i > 0) { refs.current[i - 1] && refs.current[i - 1].focus(); setDigit(i - 1, ""); }
    } else if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1].focus();
    else if (e.key === "ArrowRight" && i < 5) refs.current[i + 1].focus();
  }
  function handlePaste(e) {
    const d = (e.clipboardData.getData("text").match(/\d/g) || []).join("").slice(0, 6);
    if (!d) return;
    e.preventDefault();
    onChange(d);
    requestAnimationFrame(() => { const at = Math.min(d.length, 5); refs.current[at] && refs.current[at].focus(); });
    if (d.length === 6) onComplete && onComplete(d);
  }
  return (
    <div className={`otp ${error ? "error" : ""}`} onPaste={handlePaste}>
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i} ref={(el) => (refs.current[i] = el)}
          className={`otp-box ${value[i] ? "filled" : ""}`}
          inputMode="numeric" maxLength={1} aria-label={`Digit ${i + 1}`}
          value={value[i] || ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKey(i, e)}
          autoFocus={i === 0}
        />
      ))}
    </div>
  );
}

/* ------------------------------ Code form ------------------------------ */
function CodeForm({ email, code, setCode, onSubmit, onChangeEmail, onResend, resendIn, error, busy }) {
  return (
    <div className="view">
      <p className="code-to">
        We sent a 6-digit code to <b>{email}</b>.{" "}
        <button className="code-change" onClick={onChangeEmail}>Use a different email</button>
      </p>

      <OtpInput value={code} onChange={setCode} error={!!error} onComplete={onSubmit} />
      <Alert text={error} />

      <div className="code-actions">
        <button className="btn btn--primary btn--lg btn-block" onClick={onSubmit} disabled={code.length < 6 || busy}>
          {busy ? <><span className="spinner" /> {window.LOGIN_COPY.signingCode}</> : <>Sign in <window.IcArrowRight size={17} /></>}
        </button>
        <div className="resend">
          Didn’t get it?
          <button onClick={onResend} disabled={resendIn > 0}>
            {resendIn > 0 ? `Resend in ${resendIn}s` : window.LOGIN_COPY.resend}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- Signing in ------------------------------ */
function SigningIn({ text }) {
  return (
    <div className="view signing">
      <span className="signing-ring" />
      <span className="signing-text">{text}</span>
    </div>
  );
}

/* ------------------------------ Dev drawer ----------------------------- */
function DevDrawer() {
  const [open, setOpen] = lgS(false);
  const [env, setEnv] = lgS("Production");
  const [api, setApi] = lgS("https://api.pennedly.app/v1");
  const [mock, setMock] = lgS(false);
  return (
    <div className={`dev ${open ? "open" : ""}`}>
      <button className="dev-toggle" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <window.IcWrench size={13} className="dt-ico" /> Developer mode
        <window.IcChevDown size={13} className="chev" />
      </button>
      {open && (
        <div className="dev-body">
          <div className="dev-field">
            <span className="dev-label">Environment</span>
            <select className="dev-select" value={env} onChange={(e) => setEnv(e.target.value)}>
              {window.DEV_ENVS.map((x) => <option key={x}>{x}</option>)}
            </select>
          </div>
          <div className="dev-field">
            <span className="dev-label">Mock auth</span>
            <div className="dev-row" style={{ height: 36 }}>
              <label className="switch"><input type="checkbox" checked={mock} onChange={(e) => setMock(e.target.checked)} /><span className="track" /><span className="knob" /></label>
              <span className="dev-mock">{mock ? "Bypass real sign-in" : "Use real sign-in"}</span>
            </div>
          </div>
          <div className="dev-field full">
            <span className="dev-label">API base URL</span>
            <input className="dev-input" value={api} onChange={(e) => setApi(e.target.value)} spellCheck="false" />
          </div>
          <div className="dev-foot">
            <span className="dev-hash">build 2.4.1 · a31f9c2</span>
            <span className="grow" />
            <a className="btn btn--secondary btn--sm" href="Studio.html">Skip to app</a>
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, {
  LangSwitch, LoginHeader, Alert, EmailForm, OtpInput, CodeForm, SigningIn, DevDrawer,
});
