// stylerules-app.jsx — Style & reply rules: state, flows, tweaks.

/* ── DEV HANDOFF · Style & reply rules ───────────────────────────────
 * Route / shell:   /app/style-rules  (full app shell, sidebar = yes; render
 *                  <window.Sidebar active="stylerules" />).
 * Purpose:         The generation rulebook every draft (Studio, Replies,
 *                  Autopilot) is filtered through. Two parts: the user's own
 *                  freeform rules, and a fixed built-in "anti-AI-tell" catalog.
 * Content width:   reading (--content-reading, 720); topbar row in .topbar-inner
 *                  (no --wide); body in .content.
 * Topbar:          title="Style & reply rules"; .status-pill (neutral) showing
 *                  "<active> of <total> on"; actions = theme, settings.
 * Sections (top→bottom): intro · Your rules (freeform CRUD) · Anti-AI-tells
 *                  (built-in catalog grouped by category).
 * States + triggers:
 *                  loading — boot skeleton (~850ms) / `screen=Loading` tweak.
 *                  ready   — default.
 *                  empty   — YOUR RULES only (built-ins are a fixed catalog and
 *                            never empty); `yourRules=Empty` tweak → empty state
 *                            with starter hints + the add composer.
 * Data shown:      built-in rule = {category, title, desc, on, applies?, stripper?,
 *                  note?, demo?}; user rule = {text, kind: all|post|reply, enabled}.
 * Interactions:    USER RULES — full CRUD: add (body + kind via segmented Both/Posts/
 *                  Replies), edit body inline, toggle enabled, delete behind an INLINE
 *                  confirm (then an Undo toast). BUILT-INS — one switch per rule; the
 *                  "Human punctuation" rule shows a note + a live before→after demo
 *                  that reflects its on/off state.
 * Localize:        all end-user copy (intro, section/category headings, rule titles +
 *                  descriptions, the stripper note, chips, empty + add copy). User-rule
 *                  bodies are user content. The stripper DEMO strings are sample text.
 * Backend gotchas: the "Human punctuation" toggle drives TWO things — the model
 *                  instruction AND a DETERMINISTIC typographic post-pass (em-dashes →
 *                  commas, guillemets «» → straight quotes) that runs with no model.
 *                  `applies` scopes a rule to posts or replies only (omit = both).
 *                  Built-ins are a fixed catalog — add/remove is NOT exposed; only the
 *                  per-rule switch. User rules are the only editable list.
 * Changed in rework: adopted shared shell (deleted local sidebar/account/Mono); reading
 *                  width + .topbar-inner; .status-pill topbar. Built-ins are now GROUPED
 *                  BY CATEGORY (replaced the flat filter bar) with a post/reply-only chip
 *                  where relevant + the deterministic-stripper note/demo. User rules
 *                  gained a kind (post/reply/both) + an enabled toggle + inline-confirm
 *                  delete (was text-only add/edit/remove).
 * ──────────────────────────────────────────────────────────────────── */

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
  function undoToast(toast) { if (toast.undo) toast.undo(); setToasts((ts) => ts.filter((x) => x.id !== toast.id)); }

  /* built-in toggles */
  function toggleBuiltin(id) {
    setBuiltins((rs) => rs.map((r) => r.id === id ? { ...r, on: !r.on } : r));
  }

  /* user-rule CRUD */
  function addFreeform(text, kind) {
    const rule = { id: "f" + Date.now(), text: text.trim(), kind: kind || "all", enabled: true };
    setFreeform((rs) => [...rs, rule]);
    const where = kind === "post" ? "posts" : kind === "reply" ? "replies" : "every new draft";
    pushToast({ title: "Rule added", sub: "Applied to " + where });
  }
  function editFreeform(id, text) {
    setFreeform((rs) => rs.map((r) => r.id === id ? { ...r, text } : r));
    pushToast({ title: "Rule updated" });
  }
  function toggleFreeform(id) {
    setFreeform((rs) => rs.map((r) => r.id === id ? { ...r, enabled: !r.enabled } : r));
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
  const freeformOn = freeform.filter((r) => r.enabled).length;
  const totalOn = builtinOn + freeformOn;
  const totalRules = builtins.length + freeform.length;

  return (
    <div className="app" data-density={t.density === "Compact" ? "compact" : "comfortable"}>
      <window.Sidebar active="stylerules" />
      <div className="main">
        <window.Topbar dark={!!t.dark} onToggleTheme={() => setTweak("dark", !t.dark)} activeCount={totalOn} total={totalRules} />
        <div className="scroll">
          <div className="content">
            {loading ? (
              <window.RulesSkeleton />
            ) : (
              <>
                <window.Intro builtinOn={builtinOn} builtinTotal={builtins.length} freeformCount={freeform.length} />
                <window.FreeformSection
                  rules={freeform} leavingIds={leavingIds} hints={window.FREEFORM_HINTS}
                  onAdd={addFreeform} onEdit={editFreeform} onToggle={toggleFreeform} onRemove={removeFreeform}
                />
                <window.BuiltinSection
                  rules={builtins} categories={window.RULE_CATEGORIES} onToggle={toggleBuiltin}
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
