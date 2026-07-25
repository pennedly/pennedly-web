// patterns-app.jsx — Pattern study: idle → running → results, plus empty.

/* ── DEV HANDOFF · Pattern study ────────────────────────────────────
 * Route / shell:   /app/patterns  (full app shell, sidebar = yes; active="patterns").
 * Purpose:         A DETERMINISTIC study of the user's OWN posts + their own
 *                  metrics (no LLM) — surfaces patterns that move engagement,
 *                  each backed by the user's numbers. (Sibling of Explore, which
 *                  studies admired EXTERNAL writing instead.)
 * Content width:   reading (--content-reading, 720); topbar .topbar-inner (no --wide).
 * Topbar:          title="Pattern study"; .status-pill success "Studied <when>"
 *                  (results only); actions = theme, settings.
 * Sections (top→bottom): page intro · the active state's view.
 * States:          idle (hero + "Run a study") · running (nib-write motion +
 *                  stepped progress) · results (head + pattern cards) · empty/
 *                  insufficient (needs ≥ N published posts, with progress toward
 *                  the floor). Driven by the `state` tweak; in the real app the
 *                  study runs on demand and finishes deterministically.
 * Data shown:      per pattern — kind tag, strength + sample, a big ratio stat +
 *                  headline, EVIDENCE (a lead group vs a base group, each with a
 *                  value, a display value, and a sample size n), a note, and a
 *                  couple of example posts from the user's history with metrics.
 * Interactions:    Run a study / Re-run study → running → results (deterministic,
 *                  recomputed from the user's posts; no text generation). Read-only
 *                  otherwise.
 * Localize:        end-user copy = intro, idle/running/empty copy + step labels,
 *                  results head, card labels (kind/strength/evidence caps/notes).
 *                  Post excerpts + numbers are SAMPLE content (real from insights).
 * Backend truth:   deterministic — computed from the account's own posts and
 *                  metrics, NOT an LLM; needs a minimum number of published posts
 *                  before it will run (empty state shows progress to that floor).
 * Changed in rework: adopted shared shell (removed local sidebar); reading width
 *                  + aligned topbar; .status-pill; canonical nib-write for the
 *                  running motion; added a per-side sample size (n) to each
 *                  evidence row.
 * ─────────────────────────────────────────────────────────────────── */

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
      <window.Sidebar active="patterns" />
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
