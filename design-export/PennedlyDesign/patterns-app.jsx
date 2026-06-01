// patterns-app.jsx — Pattern study: idle → running → results, plus empty.

const { useState: usePtS, useEffect: usePtE, useRef: usePtR } = React;

const PT_TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "dark": false,
  "state": "Results"
}/*EDITMODE-END*/;

function PatternsApp() {
  const [t, setTweak] = window.useTweaks(PT_TWEAK_DEFAULTS);
  // phase: idle | running | results
  const [phase, setPhase] = usePtS("results");
  const [step, setStep] = usePtS(0);
  const [lastRun, setLastRun] = usePtS(window.STUDY_META.lastRun);
  const timers = usePtR([]);

  usePtE(() => { document.documentElement.classList.toggle("dark", !!t.dark); }, [t.dark]);

  // tweak overrides the phase for preview
  usePtE(() => {
    clearTimers();
    if (t.state === "Idle") setPhase("idle");
    else if (t.state === "Running") { setPhase("running"); animateRun(false); }
    else if (t.state === "Empty") setPhase("empty");
    else setPhase("results");
    return clearTimers;
  }, [t.state]);

  function clearTimers() { timers.current.forEach(clearTimeout); timers.current = []; }

  function animateRun(finish = true) {
    setStep(0);
    const n = window.RUN_STEPS.length;
    for (let i = 1; i <= n; i++) timers.current.push(setTimeout(() => setStep(i), i * 700));
    if (finish) timers.current.push(setTimeout(() => { setPhase("results"); setLastRun("just now"); }, n * 700 + 500));
  }

  function runStudy() { clearTimers(); setPhase("running"); animateRun(true); }

  const isEmpty = t.state === "Empty" || phase === "empty";

  return (
    <div className="app">
      <window.Sidebar />
      <div className="main">
        <window.Topbar dark={!!t.dark} onToggleTheme={() => setTweak("dark", !t.dark)} lastRun={phase === "results" ? lastRun : null} />
        <div className="scroll">
          <div className="content">
            <div className="page-intro">
              <h1>Pattern study</h1>
              <p>What actually drives performance in your posts — found by reading your own history, backed by your own numbers.</p>
            </div>

            {isEmpty ? (
              <window.EmptyView have={6} need={15} />
            ) : phase === "idle" ? (
              <window.IdleView onRun={runStudy} postsAnalyzed={window.STUDY_META.postsAnalyzed} />
            ) : phase === "running" ? (
              <window.RunningView step={step} />
            ) : (
              <>
                <div className="study-head">
                  <div>
                    <div className="sh-title">{window.PATTERNS.length} patterns found</div>
                    <div className="sh-cap">From your last {window.STUDY_META.postsAnalyzed} posts · ranked by strength of evidence</div>
                  </div>
                  <button className="btn btn--secondary" onClick={runStudy}><window.IcTweak size={15} /> Re-run study</button>
                </div>
                <div className="feed">
                  {window.PATTERNS.map((p) => <window.PatternCard key={p.id} p={p} />)}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <window.TweaksPanel>
        <window.TweakSection label="Appearance" />
        <window.TweakToggle label="Dark mode" value={!!t.dark} onChange={(v) => setTweak("dark", v)} />
        <window.TweakSection label="Preview state" />
        <window.TweakRadio label="State" value={t.state} options={["Idle", "Running", "Results", "Empty"]} onChange={(v) => setTweak("state", v)} />
      </window.TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<PatternsApp />);
