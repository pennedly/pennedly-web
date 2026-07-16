// explore-app.jsx — Explore patterns: input → analyzing → results, plus empty.
// Sibling of patterns-app.jsx. The user pastes admired posts; Pennedly extracts
// the reusable move and offers to fold each into the role-book do-list.

/* ── DEV HANDOFF · Explore patterns ─────────────────────────────────
 * Route / shell:   /app/patterns/explore   (full app shell, sidebar = yes)
 * Purpose:         Paste the TEXT of posts you admire; Pennedly names the
 *                  reusable writing move and rewrites an example in your voice.
 * Content width:   reading (--content-reading, 720); topbar uses .topbar-inner.
 * Topbar:          title="Explore patterns"; status pill shown on results only
 *                  ("N techniques found", accent tone); actions = theme toggle,
 *                  settings.
 * Sections (top→bottom):
 *   - page-intro (title + one-line desc)
 *   - INPUT: "paste the text, not links" notice; paste textarea; live sample
 *     counter; live link/@handle caution; "Analyze the craft" primary button;
 *     quiet seed chips.
 *   - ANALYZING: nib-write motion + 4 progress steps.
 *   - RESULTS: results head + "paste more"; one-line summary; pattern cards;
 *     footer meta ("N samples analyzed · <ms> · <model>").
 *   - EMPTY: compass mark + title + sub + "back to paste".
 * States:          idle(input) / analyzing(loading) / results / empty.
 *                  Driven by the `state` tweak; in the real app: empty input →
 *                  idle; submit → analyzing; response → results or empty.
 * Data shown:      per card — kind tag, technique name, the technique, a quiet
 *                  "why it works", the source line spotted, the same move
 *                  rewritten in the user's voice, a mono do-rule.
 * Interactions:    Analyze → analyzing → results (disabled while input empty OR a
 *                  link/@handle is detected). "Add to my voice" → optimistically
 *                  appends the do-rule to the role-book DO list, flips to
 *                  "✓ Added to your voice" (wire to the role-book mutation; show a
 *                  toast + undo to match the rest of the app). "Paste more" /
 *                  "back to paste" → idle. Seed chips fill the textarea.
 * Localize:        end-user copy = page-intro, the notice, placeholder, counter,
 *                  caution strings, step labels, results head/summary, card
 *                  fields, button labels, empty state. Sample posts + extracted
 *                  patterns are SAMPLE content (the model returns real ones).
 * Backend truth:   Pennedly NEVER opens links or reads other accounts — it only
 *                  reads pasted text. The link/@handle caution + disabled Analyze
 *                  enforce "paste the words, not a link" in the UI; the server
 *                  must also reject/refuse URL-only input.
 * Changed in rework: NEW screen this pass. Adopts §3 system: .topbar-inner
 *                  alignment, .status-pill, --content-reading, nib-write.
 * ───────────────────────────────────────────────────────────────── */

const { useState: useXS, useEffect: useXE, useRef: useXR } = React;

const X_TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "dark": false,
  "state": "Results"
}/*EDITMODE-END*/;

function ExploreApp() {
  const [t, setTweak] = window.useTweaks(X_TWEAK_DEFAULTS);
  // phase: idle | analyzing | results | empty
  const [phase, setPhase] = useXS("results");
  const [step, setStep] = useXS(0);
  const [text, setText] = useXS(window.SAMPLE_POSTS);
  const timers = useXR([]);

  useXE(() => { document.documentElement.classList.toggle("dark", !!t.dark); }, [t.dark]);

  // tweak overrides the phase for preview
  useXE(() => {
    clearTimers();
    if (t.state === "Input") setPhase("idle");
    else if (t.state === "Analyzing") { setPhase("analyzing"); animateRun(false); }
    else if (t.state === "Empty") setPhase("empty");
    else setPhase("results");
    return clearTimers;
  }, [t.state]);

  function clearTimers() { timers.current.forEach(clearTimeout); timers.current = []; }

  function animateRun(finish = true) {
    setStep(0);
    const n = window.EXPLORE_STEPS.length;
    for (let i = 1; i <= n; i++) timers.current.push(setTimeout(() => setStep(i), i * 650));
    if (finish) timers.current.push(setTimeout(() => setPhase("results"), n * 650 + 450));
  }

  function analyze() { clearTimers(); setPhase("analyzing"); animateRun(true); }
  function backToInput() { clearTimers(); setPhase("idle"); }
  function seedSample() { setText(window.SAMPLE_POSTS); }

  const m = window.EXPLORE_META;
  const pill = phase === "results" ? `${window.EXPLORE_PATTERNS.length} techniques found` : null;

  return (
    <div className="app">
      <window.Sidebar active="explore" />
      <div className="main">
        <window.Topbar dark={!!t.dark} onToggleTheme={() => setTweak("dark", !t.dark)} pill={pill} />
        <div className="scroll">
          <div className="content">
            <div className="page-intro">
              <h1>Explore patterns</h1>
              <p>Paste the text of posts you admire and Pennedly names the move behind them — then rewrites each one in your own voice. Learn the move, not the post.</p>
            </div>

            {phase === "idle" ? (
              <window.InputView text={text} onChange={setText} onAnalyze={analyze} onSeed={seedSample} />
            ) : phase === "analyzing" ? (
              <window.AnalyzingView step={step} />
            ) : phase === "empty" ? (
              <window.EmptyView onReset={backToInput} />
            ) : (
              <>
                <div className="results-head">
                  <div>
                    <div className="rh-title">{window.EXPLORE_PATTERNS.length} techniques worth borrowing</div>
                    <div className="rh-cap">Pulled from the text you pasted · each rewritten in your voice</div>
                  </div>
                  <button className="btn btn--secondary" onClick={backToInput}><window.IcArrowLeft size={15} /> Paste more</button>
                </div>

                <window.SummaryBar text={window.EXPLORE_SUMMARY} />

                <div className="feed">
                  {window.EXPLORE_PATTERNS.map((p, i) => <window.PatternCard key={p.id} p={p} idx={i} />)}
                </div>

                <div className="results-meta">
                  <span>{m.samples} samples analyzed</span>
                  <span className="rm-dot" />
                  <span>{m.latencyMs}ms</span>
                  <span className="rm-dot" />
                  <span>{m.model}</span>
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
        <window.TweakRadio label="State" value={t.state} options={["Input", "Analyzing", "Results", "Empty"]} onChange={(v) => setTweak("state", v)} />
      </window.TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<ExploreApp />);
