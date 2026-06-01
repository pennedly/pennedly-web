// voice-app.jsx — Voice screen state, flows (edit / re-extract / lint), tweaks.

const { useState: uS, useEffect: uE, useRef: uR } = React;

// which trait rows a conflict implicates (for the quiet "flagged" highlight)
const CONFLICT_TRAIT_FLAGS = { c1: ["tr1", "tr2"], c2: ["tr5"] };

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "dark": false,
  "density": "Comfortable",
  "conflicts": "Show 2",
  "screen": "Ready"
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = window.useTweaks(TWEAK_DEFAULTS);

  // canonical voice
  const [sections, setSections] = uS(() => ({
    intro: window.VOICE_SECTIONS.intro,
    themes: window.VOICE_SECTIONS.themes.map((x) => ({ ...x })),
    traits: window.VOICE_SECTIONS.traits.map((x) => ({ ...x })),
    examples: window.VOICE_SECTIONS.examples.map((x) => ({ ...x })),
  }));
  const [meta, setMeta] = uS(window.VOICE_META);

  // lint
  const baseline = () => (t.conflicts === "Show 2" ? window.VOICE_CONFLICTS.map((c) => ({ ...c })) : []);
  const [conflicts, setConflicts] = uS(baseline);
  const [checking, setChecking] = uS(false);
  const [lastRun, setLastRun] = uS("2 days ago");
  const [leavingIds, setLeavingIds] = uS([]);
  const [justFixedId, setJustFixedId] = uS(null);

  // process states
  const [bootLoading, setBootLoading] = uS(true);
  const [busy, setBusy] = uS(false);       // re-extracting
  const [stepIndex, setStepIndex] = uS(0);
  const [reDialog, setReDialog] = uS(false);

  // toasts
  const [toasts, setToasts] = uS([]);

  const loading = bootLoading || t.screen === "Loading";

  /* tweaks → app */
  uE(() => { document.documentElement.classList.toggle("dark", !!t.dark); }, [t.dark]);
  uE(() => { setConflicts(baseline()); }, [t.conflicts]);
  uE(() => { const id = setTimeout(() => setBootLoading(false), 900); return () => clearTimeout(id); }, []);

  /* toasts */
  function pushToast(toast) {
    const id = "t" + Date.now() + Math.random().toString(36).slice(2, 5);
    setToasts((ts) => [...ts, { ...toast, id }]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), 4600);
  }
  function undoToast(toast) {
    if (toast.undo) toast.undo();
    setToasts((ts) => ts.filter((x) => x.id !== toast.id));
  }

  /* section saves */
  const saveIntro    = (v) => { setSections((s) => ({ ...s, intro: v })); pushToast({ title: "Intro saved" }); };
  const saveThemes   = (v) => { setSections((s) => ({ ...s, themes: v })); pushToast({ title: "Themes saved", sub: `${v.length} themes` }); };
  const saveTraits   = (v) => { setSections((s) => ({ ...s, traits: v })); pushToast({ title: "Voice traits saved", sub: `${v.length} traits` }); };
  const saveExamples = (v) => { setSections((s) => ({ ...s, examples: v })); pushToast({ title: "Examples saved", sub: `${v.length} examples` }); };

  /* lint: run a check */
  function runCheck() {
    setChecking(true);
    setConflicts([]);
    setLeavingIds([]);
    setTimeout(() => {
      setChecking(false);
      setConflicts(window.VOICE_CONFLICTS.map((c) => ({ ...c })));
      setLastRun("just now");
    }, 1500);
  }

  /* lint: apply a one-click fix (mutates the real voice) */
  function applyFix(conflict) {
    setLeavingIds((ids) => [...ids, conflict.id]);
    setTimeout(() => {
      const { section, id, field, value } = conflict.fix;
      setSections((s) => ({ ...s, [section]: s[section].map((x) => x.id === id ? { ...x, [field]: value } : x) }));
      setConflicts((cs) => cs.filter((c) => c.id !== conflict.id));
      setLeavingIds((ids) => ids.filter((x) => x !== conflict.id));
      setJustFixedId(id);
      setTimeout(() => setJustFixedId(null), 1500);
      pushToast({ title: "Fix applied", sub: conflict.severity === "conflict" ? "Contradiction resolved" : "Tension eased" });
    }, 260);
  }

  function dismissConflict(cid) {
    const removed = conflicts.find((c) => c.id === cid);
    setLeavingIds((ids) => [...ids, cid]);
    setTimeout(() => {
      setConflicts((cs) => cs.filter((c) => c.id !== cid));
      setLeavingIds((ids) => ids.filter((x) => x !== cid));
      pushToast({ title: "Left as-is", sub: "We won't flag this again", undo: () => setConflicts((cs) => [...cs, removed].sort((a, b) => a.id.localeCompare(b.id))) });
    }, 260);
  }

  /* re-extract */
  function startReExtract() {
    setReDialog(false);
    setBusy(true);
    setStepIndex(0);
    const steps = window.REEXTRACT_STEPS.length;
    let i = 0;
    const tick = () => {
      i += 1;
      if (i < steps) { setStepIndex(i); setTimeout(tick, 1050); }
      else {
        setStepIndex(steps);
        setTimeout(() => {
          setBusy(false);
          setMeta((m) => ({ ...m, updated: "just now", match: 96 }));
          setConflicts([]);
          setLastRun("just now");
          pushToast({ title: "Voice re-extracted", sub: "Sections updated from your recent posts" });
        }, 650);
      }
    };
    setTimeout(tick, 1050);
  }

  const flaggedIds = checking ? [] : conflicts.flatMap((c) => CONFLICT_TRAIT_FLAGS[c.id] || []);
  const issues = conflicts.length;
  const status = busy ? "busy" : "ready";

  return (
    <div className="app" data-density={t.density === "Compact" ? "compact" : "comfortable"}>
      <window.Sidebar />
      <div className="main">
        <window.Topbar dark={!!t.dark} onToggleTheme={() => setTweak("dark", !t.dark)} status={status} issues={issues} />
        <div className="scroll">
          <div className="content">
            {loading ? (
              <window.VoiceSkeleton />
            ) : (
              <>
                <window.VoiceHero
                  meta={meta} busy={busy} checking={checking}
                  onReExtract={() => setReDialog(true)} onCheck={runCheck}
                />

                {busy ? (
                  <window.ReExtractPanel stepIndex={stepIndex} />
                ) : (
                  <>
                    {(checking || issues > 0 || conflicts.length === 0) && (
                      <window.VoiceCheck
                        conflicts={conflicts} checking={checking} lastRun={lastRun} leavingIds={leavingIds}
                        onApply={applyFix} onDismiss={dismissConflict} onRecheck={runCheck}
                      />
                    )}

                    <window.IntroSection value={sections.intro} locked={busy} onSave={saveIntro} />
                    <window.ThemesSection items={sections.themes} locked={busy} onSave={saveThemes} />
                    <window.TraitsSection items={sections.traits} locked={busy} flaggedIds={flaggedIds} justFixedId={justFixedId} onSave={saveTraits} />
                    <window.ExamplesSection items={sections.examples} locked={busy} justFixedId={justFixedId} onSave={saveExamples} />
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {reDialog && <window.ReExtractDialog onCancel={() => setReDialog(false)} onConfirm={startReExtract} />}
      <window.Toasts toasts={toasts} onUndo={undoToast} />

      {/* ------------------------------ Tweaks ------------------------------ */}
      <window.TweaksPanel>
        <window.TweakSection label="Voice check" />
        <window.TweakRadio label="Conflicts" value={t.conflicts} options={["Show 2", "None"]} onChange={(v) => setTweak("conflicts", v)} />
        <window.TweakButton label="Run voice check" onClick={runCheck} secondary />
        <window.TweakSection label="Voice" />
        <window.TweakButton label="Re-extract voice" onClick={() => setReDialog(true)} secondary />
        <window.TweakRadio label="Screen" value={t.screen} options={["Ready", "Loading"]} onChange={(v) => setTweak("screen", v)} />
        <window.TweakSection label="Appearance" />
        <window.TweakToggle label="Dark mode" value={!!t.dark} onChange={(v) => setTweak("dark", v)} />
        <window.TweakRadio label="Density" value={t.density} options={["Comfortable", "Compact"]} onChange={(v) => setTweak("density", v)} />
      </window.TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
