// login-app.jsx — passwordless sign-in: auth state machine + tweaks.

const { useState: aS, useEffect: aE, useRef: aR } = React;

const ERR_MAP = { "Rate limit": "rate", "Invalid code": "invalid", "Google": "google" };

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "dark": false,
  "screen": "Email",
  "error": "None"
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = window.useTweaks(TWEAK_DEFAULTS);

  const [view, setView] = aS("email");       // email | code | signing
  const [email, setEmail] = aS("");
  const [code, setCode] = aS("");
  const [err, setErr] = aS(null);             // error message string
  const [busyGoogle, setBusyGoogle] = aS(false);
  const [busyCode, setBusyCode] = aS(false);
  const [signingText, setSigningText] = aS(window.LOGIN_COPY.signingCode);
  const [resendIn, setResendIn] = aS(0);
  const [lang, setLang] = aS("EN");
  const cdRef = aR(null);

  /* tweaks → app */
  aE(() => { document.documentElement.classList.toggle("dark", !!t.dark); }, [t.dark]);
  aE(() => {
    const map = { "Email": "email", "Code": "code", "Signing in": "signing" };
    const v = map[t.screen] || "email";
    setView(v);
    if (v === "signing") setSigningText(window.LOGIN_COPY.signingCode);
    if (v === "code" && resendIn === 0) startCooldown();
  }, [t.screen]);
  aE(() => {
    const key = ERR_MAP[t.error];
    if (!key) { setErr(null); return; }
    if (key === "invalid") { setView("code"); setCode("739104"); setErr(window.LOGIN_ERRORS.invalid); }
    else if (key === "rate") { setView("email"); setErr(window.LOGIN_ERRORS.rate); }
    else if (key === "google") { setView("email"); setErr(window.LOGIN_ERRORS.google); }
  }, [t.error]);

  /* resend cooldown */
  function startCooldown() {
    setResendIn(30);
    if (cdRef.current) clearInterval(cdRef.current);
    cdRef.current = setInterval(() => {
      setResendIn((s) => { if (s <= 1) { clearInterval(cdRef.current); return 0; } return s - 1; });
    }, 1000);
  }
  aE(() => () => cdRef.current && clearInterval(cdRef.current), []);

  /* flows */
  function onGoogle() {
    setErr(null); setBusyGoogle(true);
    setTimeout(() => { setBusyGoogle(false); setSigningText(window.LOGIN_COPY.signingGoogle); setView("signing"); }, 700);
    setTimeout(() => { window.location.href = "Onboarding.html"; }, 2400);
  }

  function requestCode() {
    setErr(null); setCode(""); setView("code"); startCooldown();
  }
  function changeEmail() { setErr(null); setCode(""); setView("email"); }
  function resend() { setErr(null); startCooldown(); }

  function verifyCode() {
    if (code.length < 6) return;
    setBusyCode(true);
    setTimeout(() => {
      setBusyCode(false);
      setSigningText(window.LOGIN_COPY.signingCode);
      setView("signing");
      setTimeout(() => { window.location.href = "Onboarding.html"; }, 1400);
    }, 1000);
  }

  const titleSub = view === "code"
    ? { title: window.LOGIN_COPY.codeTitle, sub: "It expires in 10 minutes. You can paste it straight in." }
    : { title: window.LOGIN_COPY.emailTitle, sub: window.LOGIN_COPY.emailSub };

  return (
    <div className="login">
      <div className="login-top">
        <window.LangSwitch value={lang} onChange={setLang} />
      </div>

      <div className="login-stage">
        <div className="login-card">
          {view === "signing" ? (
            <>
              <window.LoginHeader title="Signing in" sub="Hold tight — this only takes a second." />
              <window.SigningIn text={signingText} />
            </>
          ) : (
            <>
              <window.LoginHeader title={titleSub.title} sub={titleSub.sub} />
              {view === "email" ? (
                <window.EmailForm
                  email={email} setEmail={setEmail}
                  onGoogle={onGoogle} onSubmit={requestCode}
                  busyGoogle={busyGoogle} error={err}
                />
              ) : (
                <window.CodeForm
                  email={email || "you@example.com"} code={code} setCode={(v) => { setCode(v); if (err) setErr(null); }}
                  onSubmit={verifyCode} onChangeEmail={changeEmail} onResend={resend}
                  resendIn={resendIn} error={err} busy={busyCode}
                />
              )}
            </>
          )}
        </div>
      </div>

      <window.DevDrawer />

      {/* ------------------------------ Tweaks ------------------------------ */}
      <window.TweaksPanel>
        <window.TweakSection label="Screen" />
        <window.TweakRadio label="View" value={t.screen} options={["Email", "Code", "Signing in"]} onChange={(v) => { setTweak("screen", v); setTweak("error", "None"); }} />
        <window.TweakSection label="Error state" />
        <window.TweakRadio label="Show" value={t.error} options={["None", "Rate limit", "Invalid code", "Google"]} onChange={(v) => setTweak("error", v)} />
        <window.TweakSection label="Appearance" />
        <window.TweakToggle label="Dark mode" value={!!t.dark} onChange={(v) => setTweak("dark", v)} />
      </window.TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
