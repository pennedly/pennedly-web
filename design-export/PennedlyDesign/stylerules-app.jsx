// stylerules-app.jsx — Style & reply rules: state, flows, tweaks.

const { useState: aS, useEffect: aE } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "dark": false,
  "density": "Comfortable",
  "yourRules": "A few",
  "screen": "Ready"
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = window.useTweaks(TWEAK_DEFAULTS);

  const [builtins, setBuiltins] = aS(() => window.BUILTIN_RULES.map((r) => ({ ...r })));
  const [filter, setFilter] = aS("All");
  const [freeform, setFreeform] = aS(() => window.FREEFORM_RULES.map((r) => ({ ...r })));
  const [leavingIds, setLeavingIds] = aS([]);
  const [toasts, setToasts] = aS([]);
  const [bootLoading, setBootLoading] = aS(true);

  const loading = bootLoading || t.screen === "Loading";

  /* tweaks → app */
  aE(() => { document.documentElement.classList.toggle("dark", !!t.dark); }, [t.dark]);
  aE(() => {
    setFreeform(t.yourRules === "Empty" ? [] : window.FREEFORM_RULES.map((r) => ({ ...r })));
  }, [t.yourRules]);
  aE(() => { const id = setTimeout(() => setBootLoading(false), 850); return () => clearTimeout(id); }, []);

  /* toasts */
  function pushToast(toast) {
    const id = "t" + Date.now() + Math.random().toString(36).slice(2, 5);
    setToasts((ts) => [...ts, { ...toast, id }]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), 4400);
  }
  function undoToast(toast) {
    if (toast.undo) toast.undo();
    setToasts((ts) => ts.filter((x) => x.id !== toast.id));
  }

  /* built-in toggles */
  function toggleBuiltin(id) {
    setBuiltins((rs) => rs.map((r) => r.id === id ? { ...r, on: !r.on } : r));
  }

  /* freeform CRUD */
  function addFreeform(text) {
    const rule = { id: "f" + Date.now(), text: text.trim() };
    setFreeform((rs) => [...rs, rule]);
    pushToast({ title: "Rule added", sub: "Applied to every new draft" });
  }
  function editFreeform(id, text) {
    setFreeform((rs) => rs.map((r) => r.id === id ? { ...r, text } : r));
    pushToast({ title: "Rule updated" });
  }
  function removeFreeform(id) {
    const removed = freeform.find((r) => r.id === id);
    const idx = freeform.findIndex((r) => r.id === id);
    setLeavingIds((ids) => [...ids, id]);
    setTimeout(() => {
      setFreeform((rs) => rs.filter((r) => r.id !== id));
      setLeavingIds((ids) => ids.filter((x) => x !== id));
      pushToast({
        title: "Rule removed",
        undo: () => setFreeform((rs) => { const next = [...rs]; next.splice(Math.min(idx, next.length), 0, removed); return next; }),
      });
    }, 240);
  }

  const builtinOn = builtins.filter((r) => r.on).length;
  const totalOn = builtinOn + freeform.length;
  const totalRules = builtins.length + freeform.length;

  return (
    <div className="app" data-density={t.density === "Compact" ? "compact" : "comfortable"}>
      <window.Sidebar />
      <div className="main">
        <window.Topbar dark={!!t.dark} onToggleTheme={() => setTweak("dark", !t.dark)} activeCount={totalOn} total={totalRules} />
        <div className="scroll">
          <div className="content">
            {loading ? (
              <window.RulesSkeleton />
            ) : (
              <>
                <window.Intro builtinOn={builtinOn} builtinTotal={builtins.length} freeformCount={freeform.length} />
                <window.BuiltinSection
                  rules={builtins} kinds={window.RULE_KINDS}
                  filter={filter} onFilter={setFilter} onToggle={toggleBuiltin}
                />
                <window.FreeformSection
                  rules={freeform} leavingIds={leavingIds} hints={window.FREEFORM_HINTS}
                  onAdd={addFreeform} onEdit={editFreeform} onRemove={removeFreeform}
                />
              </>
            )}
          </div>
        </div>
      </div>

      <window.Toasts toasts={toasts} onUndo={undoToast} />

      {/* ------------------------------ Tweaks ------------------------------ */}
      <window.TweaksPanel>
        <window.TweakSection label="Your rules" />
        <window.TweakRadio label="Section" value={t.yourRules} options={["A few", "Empty"]} onChange={(v) => setTweak("yourRules", v)} />
        <window.TweakSection label="Preview" />
        <window.TweakRadio label="Screen" value={t.screen} options={["Ready", "Loading"]} onChange={(v) => setTweak("screen", v)} />
        <window.TweakSection label="Appearance" />
        <window.TweakToggle label="Dark mode" value={!!t.dark} onChange={(v) => setTweak("dark", v)} />
        <window.TweakRadio label="Density" value={t.density} options={["Comfortable", "Compact"]} onChange={(v) => setTweak("density", v)} />
      </window.TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
