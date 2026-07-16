// onboarding-app.jsx — first-run wizard: step state machine + tweaks.

/* ── DEV HANDOFF · Onboarding ────────────────────────────────────────
 * Route / shell:   /app/onboarding  — FULL-SCREEN, NO app shell (like Login):
 *                  its own focused stepper layout; <Sidebar> is NOT rendered.
 *                  Entered on genuine first-run (forced) or from Settings → Voice
 *                  setup (revisit). Tester preview at /app/onboarding?preview=1.
 * Purpose:         Connect a Threads account and give Pennedly a starting voice,
 *                  so every later draft sounds like the user.
 * Stepper steps:   Connect · Voice · Done (the analyze/scratch paths are both the
 *                  "Voice" step). On revisit (already connected) Connect is shown
 *                  as already-done and the flow opens on Voice.
 * States + triggers:
 *                  connect: idle → connecting (spinner) → connected (Avatar +
 *                    success status-pill). Skipped on revisit.
 *                  choose:  pick "Analyze my posts" (offered only when the account
 *                    has ≥ OB_POSTS.need recent posts) or "Build from scratch".
 *                    When too few posts, Analyze is locked with a reason.
 *                  analyze: stepped progress with the canonical nib-write motion.
 *                  scratch: voice description + topics-to-write / topics-to-avoid.
 *                  done:    recap + "Go to Studio" (genuine) — OR, in PREVIEW mode,
 *                    the would-be voice rendered read-only (saved = nothing).
 *                  All driven by the tweak panel (Entry / Posts / Preview / Stage).
 * Data:            OB_ACCOUNT (avatar + handle + followers), OB_POSTS (need/enough/
 *                  tooFew), OB_VOICE_MODES, OB_ANALYZE_STEPS, scratch starters +
 *                  topic suggestions, OB_PREVIEW_VOICE (the preview-mode result).
 * Interactions:    connect (simulated) · choose a path · run analyze · fill the
 *                  scratch form (chip inputs + starters) · skip (first-run only) ·
 *                  Back to Settings (revisit / preview) · refine → Voice.html ·
 *                  Go to Studio. Preview "Run setup for real" relaunches clean.
 * Localize:        all end-user copy (titles, subs, trust rows, choice cards +
 *                  lock reason, analyze step labels, scratch labels, done/preview
 *                  copy). Topic/starter suggestions are sample content.
 * Backend gotchas: "Analyze" requires a real post floor (OB_POSTS.need) — gate the
 *                  option, don't just fail. PREVIEW (?preview=1) must run the real
 *                  extraction but PERSIST NOTHING — it only renders the result.
 *                  Skip = proceed un-set-up (voice can be built later in Settings).
 *                  Nothing is ever auto-posted; setup only shapes drafts.
 * Changed in rework: tokens-only, light+dark; avatars now <window.Avatar/> (real
 *                  photo + initials fallback); connected + preview use .status-pill;
 *                  analyze uses canonical nib-write. Added the post-count gating on
 *                  Analyze, the first-run "Skip for now" vs revisit "Back to Settings"
 *                  split, and the tester PREVIEW result screen.
 * ──────────────────────────────────────────────────────────────────── */

const { useState: wS, useEffect: wE, useRef: wR } = React;

// stage → stepper index (connect=0, the voice paths=1, done=2)
const STAGE_INDEX = { connect: 0, choose: 1, analyze: 1, scratch: 1, done: 2 };

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "dark": false,
  "entry": "First run",
  "posts": "Enough",
  "preview": false,
  "jump": "Connect"
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = window.useTweaks(TWEAK_DEFAULTS);

  // derived entry flags
  const firstRun = t.entry !== "Revisit";
  const enoughPosts = t.posts !== "Too few";
  const urlPreview = (() => { try { return new URLSearchParams(window.location.search).get("preview") === "1"; } catch (e) { return false; } })();
  const preview = urlPreview || !!t.preview;
  const account = window.OB_ACCOUNT;
  const need = window.OB_POSTS.need;
  const postCount = enoughPosts ? window.OB_POSTS.enough : window.OB_POSTS.tooFew;

  const [stage, setStage] = wS(firstRun ? "connect" : "choose");
  const [connectStatus, setConnectStatus] = wS(firstRun ? "idle" : "connected");
  const [connected, setConnected] = wS(!firstRun);
  const [mode, setMode] = wS(null);
  const [chosen, setChosen] = wS(null);
  const [anIndex, setAnIndex] = wS(0);
  const [form, setForm] = wS({ desc: "", write: [], avoid: [] });
  const anTimer = wR(null);

  /* tweaks → app */
  wE(() => { document.documentElement.classList.toggle("dark", !!t.dark); }, [t.dark]);

  // Entry tweak resets the flow to its natural start.
  wE(() => {
    if (anTimer.current) clearTimeout(anTimer.current);
    if (firstRun) { resetAll(); }
    else { setConnected(true); setConnectStatus("connected"); setMode(null); setAnIndex(0); setStage("choose"); setChosen(enoughPosts ? null : "scratch"); }
  }, [t.entry]);

  // Stage jump (walkthrough).
  wE(() => {
    const map = { Connect: "connect", Choose: "choose", Analyze: "analyze", Scratch: "scratch", Done: "done" };
    const target = map[t.jump];
    if (!target || target === stage) return;
    if (target === "connect") { resetAll(); return; }
    setConnectStatus("connected"); setConnected(true);
    if (target === "choose") { setChosen(enoughPosts ? "analyze" : "scratch"); setStage("choose"); }
    else if (target === "analyze") { setChosen("analyze"); runAnalyze(); }
    else if (target === "scratch") { setChosen("scratch"); setStage("scratch"); }
    else if (target === "done") { setMode("analyze"); setStage("done"); }
  }, [t.jump]);

  // Keep a valid selection when posts are too few to analyze.
  wE(() => { if (stage === "choose" && !enoughPosts && chosen !== "scratch") setChosen("scratch"); }, [stage, enoughPosts]);

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
  function skip() { setStage("done"); }

  const stepIdx = STAGE_INDEX[stage];
  const showSkip = firstRun && !preview && stage !== "done" && stage !== "analyze";
  const showBack = (!firstRun || preview) && stage !== "analyze";

  return (
    <div className="ob">
      <window.TopBar
        dark={!!t.dark} onToggleTheme={() => setTweak("dark", !t.dark)}
        onSkip={skip} showSkip={showSkip} showBack={showBack} preview={preview}
      />
      <div className="ob-stage">
        <window.Stepper current={stepIdx} />
        <div className={`ob-card ${stage === "scratch" ? "ob-card--wide" : ""} ${stage === "done" && preview ? "ob-card--wide" : ""}`}>
          {stage === "connect" && (
            <window.ConnectStep status={connectStatus} account={account} onConnect={connect} onContinue={() => setStage("choose")} />
          )}
          {stage === "choose" && (
            <window.ChooseStep
              account={account} selected={chosen} onSelect={setChosen}
              onContinue={chooseContinue} onBack={firstRun ? () => setStage("connect") : null}
              enoughPosts={enoughPosts} postCount={postCount} need={need}
            />
          )}
          {stage === "analyze" && (
            <window.AnalyzeStep account={account} stepIndex={anIndex} />
          )}
          {stage === "scratch" && (
            <window.ScratchStep form={form} setForm={setForm} onContinue={scratchContinue} onBack={() => setStage("choose")} />
          )}
          {stage === "done" && (
            <window.DoneStep account={account} connected={connected} mode={mode} preview={preview} onRefine={() => { window.location.href = "Voice.html"; }} />
          )}
        </div>
      </div>

      {/* ------------------------------ Tweaks ------------------------------ */}
      <window.TweaksPanel>
        <window.TweakSection label="Entry" />
        <window.TweakRadio label="Started from" value={t.entry} options={["First run", "Revisit"]} onChange={(v) => setTweak("entry", v)} />
        <window.TweakRadio label="Account posts" value={t.posts} options={["Enough", "Too few"]} onChange={(v) => setTweak("posts", v)} />
        <window.TweakToggle label="Preview mode (tester)" value={!!t.preview} onChange={(v) => setTweak("preview", v)} />
        <window.TweakSection label="Walkthrough" />
        <window.TweakRadio label="Jump to" value={t.jump} options={["Connect", "Choose", "Analyze", "Scratch", "Done"]} onChange={(v) => setTweak("jump", v)} />
        <window.TweakButton label="Restart flow" onClick={() => { resetAll(); setTweak("jump", "Connect"); }} secondary />
        <window.TweakSection label="Appearance" />
        <window.TweakToggle label="Dark mode" value={!!t.dark} onChange={(v) => setTweak("dark", v)} />
      </window.TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
