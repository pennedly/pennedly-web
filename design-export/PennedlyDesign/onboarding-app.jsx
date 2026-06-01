// onboarding-app.jsx — first-run wizard: step state machine + tweaks.

const { useState: wS, useEffect: wE, useRef: wR } = React;

// stage → stepper index
const STAGE_INDEX = { connect: 0, choose: 1, analyze: 1, scratch: 1, done: 2 };

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "dark": false,
  "jump": "Connect"
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = window.useTweaks(TWEAK_DEFAULTS);

  const [stage, setStage] = wS("connect");
  const [connectStatus, setConnectStatus] = wS("idle"); // idle | connecting | connected
  const [connected, setConnected] = wS(false);
  const [mode, setMode] = wS(null);            // committed voice mode (for done recap)
  const [chosen, setChosen] = wS(null);         // selection on the choose step
  const [anIndex, setAnIndex] = wS(0);
  const [form, setForm] = wS({ desc: "", write: [], avoid: [] });
  const anTimer = wR(null);

  const account = window.OB_ACCOUNT;

  /* tweaks → app */
  wE(() => { document.documentElement.classList.toggle("dark", !!t.dark); }, [t.dark]);
  wE(() => {
    const map = { Connect: "connect", Choose: "choose", Scratch: "scratch", Done: "done" };
    const target = map[t.jump];
    if (!target || target === stage) return;
    if (target === "connect") { resetAll(); return; }
    // jumping past connect implies a connected account
    setConnectStatus("connected"); setConnected(true);
    if (target === "choose") { setChosen("analyze"); setStage("choose"); }
    else if (target === "scratch") { setChosen("scratch"); setStage("scratch"); }
    else if (target === "done") { setMode("analyze"); setStage("done"); }
  }, [t.jump]);

  wE(() => () => { if (anTimer.current) clearTimeout(anTimer.current); }, []);

  function resetAll() {
    setStage("connect"); setConnectStatus("idle"); setConnected(false);
    setMode(null); setChosen(null); setAnIndex(0); setForm({ desc: "", write: [], avoid: [] });
  }

  /* connect */
  function connect() {
    setConnectStatus("connecting");
    setTimeout(() => { setConnectStatus("connected"); setConnected(true); }, 1500);
  }

  /* choose → continue */
  function chooseContinue() {
    if (chosen === "analyze") runAnalyze();
    else if (chosen === "scratch") setStage("scratch");
  }

  function runAnalyze() {
    setStage("analyze"); setAnIndex(0);
    const steps = window.OB_ANALYZE_STEPS.length;
    let i = 0;
    const tick = () => {
      i += 1;
      if (i < steps) { setAnIndex(i); anTimer.current = setTimeout(tick, 1100); }
      else { setAnIndex(steps); anTimer.current = setTimeout(() => { setMode("analyze"); setStage("done"); }, 800); }
    };
    anTimer.current = setTimeout(tick, 1100);
  }

  function scratchContinue() { setMode("scratch"); setStage("done"); }

  function skip() { setStage("done"); } // mode/connected reflect whatever's set

  const stepIdx = STAGE_INDEX[stage];
  const showSkip = stage !== "done" && stage !== "analyze";

  return (
    <div className="ob">
      <window.TopBar dark={!!t.dark} onToggleTheme={() => setTweak("dark", !t.dark)} onSkip={skip} showSkip={showSkip} />
      <div className="ob-stage">
        <window.Stepper current={stepIdx} />
        <div className={`ob-card ${stage === "scratch" ? "ob-card--wide" : ""}`}>
          {stage === "connect" && (
            <window.ConnectStep status={connectStatus} account={account} onConnect={connect} onContinue={() => setStage("choose")} />
          )}
          {stage === "choose" && (
            <window.ChooseStep account={account} selected={chosen} onSelect={setChosen} onContinue={chooseContinue} onBack={() => setStage("connect")} />
          )}
          {stage === "analyze" && (
            <window.AnalyzeStep account={account} stepIndex={anIndex} />
          )}
          {stage === "scratch" && (
            <window.ScratchStep form={form} setForm={setForm} onContinue={scratchContinue} onBack={() => setStage("choose")} />
          )}
          {stage === "done" && (
            <window.DoneStep account={account} connected={connected} mode={mode} onRefine={() => { window.location.href = "Voice.html"; }} />
          )}
        </div>
        {stage === "connect" && connectStatus !== "connected" && (
          <p className="ob-note">Already set up? <a href="Studio.html">Go to Studio</a></p>
        )}
      </div>

      {/* ------------------------------ Tweaks ------------------------------ */}
      <window.TweaksPanel>
        <window.TweakSection label="Walkthrough" />
        <window.TweakRadio label="Jump to" value={t.jump} options={["Connect", "Choose", "Scratch", "Done"]} onChange={(v) => setTweak("jump", v)} />
        <window.TweakButton label="Restart flow" onClick={() => { resetAll(); setTweak("jump", "Connect"); }} secondary />
        <window.TweakSection label="Appearance" />
        <window.TweakToggle label="Dark mode" value={!!t.dark} onChange={(v) => setTweak("dark", v)} />
      </window.TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
