// ob-flow.jsx — SHARED onboarding state machine, lifted verbatim in behaviour
// from the live onboarding-app.jsx. The four visual directions are purely
// presentational; they all consume this one hook so the steps, states, gating,
// timers, preview mode and entry/jump logic stay identical across directions.

const { useState: fS, useEffect: fE, useRef: fR } = React;

// stage → journey index (connect=0, the voice paths=1, done=2)
const OB_STAGE_INDEX = { connect: 0, choose: 1, analyze: 1, scratch: 1, done: 2 };
// the three labelled milestones every direction draws (top stepper / side rail / masthead)
const OB_JOURNEY = [
  { key: "connect", label: "Connect" },
  { key: "voice", label: "Voice" },
  { key: "done", label: "Done" },
];

function useOnboardingFlow(t) {
  // derived entry flags (same semantics as the original app)
  const firstRun = t.entry !== "Revisit";
  const enoughPosts = t.posts !== "Too few";
  const urlPreview = (() => { try { return new URLSearchParams(window.location.search).get("preview") === "1"; } catch (e) { return false; } })();
  const preview = urlPreview || !!t.preview;
  const account = window.OB_ACCOUNT;
  const need = window.OB_POSTS.need;
  const postCount = enoughPosts ? window.OB_POSTS.enough : window.OB_POSTS.tooFew;

  const [stage, setStage] = fS(firstRun ? "connect" : "choose");
  const [connectStatus, setConnectStatus] = fS(firstRun ? "idle" : "connected");
  const [connected, setConnected] = fS(!firstRun);
  const [mode, setMode] = fS(null);
  const [chosen, setChosen] = fS(null);
  const [anIndex, setAnIndex] = fS(0);
  const [form, setForm] = fS({ desc: "", write: [], avoid: [] });
  const anTimer = fR(null);

  // Entry tweak resets the flow to its natural start.
  fE(() => {
    if (anTimer.current) clearTimeout(anTimer.current);
    if (firstRun) { resetAll(); }
    else { setConnected(true); setConnectStatus("connected"); setMode(null); setAnIndex(0); setStage("choose"); setChosen(enoughPosts ? null : "scratch"); }
  }, [t.entry]);

  // Stage jump (walkthrough).
  fE(() => {
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
  fE(() => { if (stage === "choose" && !enoughPosts && chosen !== "scratch") setChosen("scratch"); }, [stage, enoughPosts]);

  fE(() => () => { if (anTimer.current) clearTimeout(anTimer.current); }, []);

  function resetAll() {
    setStage("connect"); setConnectStatus("idle"); setConnected(false);
    setMode(null); setChosen(null); setAnIndex(0); setForm({ desc: "", write: [], avoid: [] });
  }
  function connect() {
    setConnectStatus("connecting");
    setTimeout(() => { setConnectStatus("connected"); setConnected(true); }, 1500);
  }
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
  function goChoose() { setStage("choose"); }
  function goConnect() { setStage("connect"); }

  const stepIdx = OB_STAGE_INDEX[stage];
  const showSkip = firstRun && !preview && stage !== "done" && stage !== "analyze";
  const showBack = (!firstRun || preview) && stage !== "analyze";

  return {
    // context
    firstRun, enoughPosts, preview, account, need, postCount,
    // state
    stage, connectStatus, connected, mode, chosen, anIndex, form, stepIdx,
    showSkip, showBack,
    // setters / actions
    setChosen, setForm, setStage,
    connect, chooseContinue, scratchContinue, skip, goChoose, goConnect, resetAll, runAnalyze,
  };
}

/* ------------------------------ Chip input ----------------------------- */
// Shared across directions; presentational classes live in ob-redesign.css and
// are themed per-direction by their namespace wrapper.
function FlowChipInput({ value, onChange, placeholder, suggestions, tone }) {
  const [text, setText] = fS("");
  function add(v) {
    const tv = (v ?? text).trim();
    if (!tv || value.some((x) => x.toLowerCase() === tv.toLowerCase())) { setText(""); return; }
    onChange([...value, tv]); setText("");
  }
  function remove(v) { onChange(value.filter((x) => x !== v)); }
  const remaining = (suggestions || []).filter((s) => !value.some((v) => v.toLowerCase() === s.toLowerCase()));
  return (
    <>
      <div className="r-chipfield">
        {value.map((v) => (
          <span className={`r-chip ${tone === "avoid" ? "avoid" : ""}`} key={v}>
            {v}
            <button type="button" aria-label={`Remove ${v}`} onClick={() => remove(v)}><window.IcX size={11} /></button>
          </span>
        ))}
        <input
          className="r-chip-input" value={text} placeholder={value.length === 0 ? placeholder : ""}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); add(); }
            if (e.key === "Backspace" && !text && value.length) remove(value[value.length - 1]);
          }}
        />
      </div>
      {remaining.length > 0 && (
        <div className="r-suggests">
          {remaining.map((s) => (
            <button key={s} type="button" className="r-suggest" onClick={() => add(s)}><window.IcPlus size={12} /> {s}</button>
          ))}
        </div>
      )}
    </>
  );
}

Object.assign(window, { useOnboardingFlow, OB_STAGE_INDEX, OB_JOURNEY, FlowChipInput });
