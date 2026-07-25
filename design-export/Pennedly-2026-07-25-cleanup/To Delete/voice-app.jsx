// voice-app.jsx — Voice screen state, flows (edit / re-extract / lint / translate), tweaks.

/* ── DEV HANDOFF · Voice ─────────────────────────────────────────────
 * Route / shell:   /app/voice  (full app shell, sidebar = yes; render
 *                  <window.Sidebar active="voice" />).
 * Purpose:         The account's WRITING VOICE — the editable profile every
 *                  draft (Studio, Replies, Autopilot) is generated against.
 *                  Seven sections, a consistency check, on-demand re-extraction,
 *                  a localized read-only view, and a preview of the exact prompt
 *                  the model receives. NOTE: there is deliberately NO "voice
 *                  match %" anywhere — do not add one.
 * Content width:   reading (--content-reading, 720); topbar row in .topbar-inner
 *                  (no --wide); body in .content.
 * Topbar:          title="Voice"; .status-pill — accent "Re-extracting…" when busy,
 *                  accent "Translated · <native>" when viewing a non-English locale,
 *                  warning "<n> conflicts" when the check found issues, else success
 *                  "In sync". Actions = theme, settings.
 * Sections (top→bottom): hero (title · sources/updated meta · Check / Re-extract ·
 *                  language picker) · voice check (lint) · 1 Intro · 2 Themes to
 *                  write about · 3 Won't write about (red exclude zone) · 4 Voice
 *                  characteristics · 5 Do · 6 Don't · 7 Example posts · "What the AI
 *                  actually sees" assembled-prompt preview.
 * States + triggers:
 *                  loading — boot skeleton (~900ms) / `screen=Loading` tweak.
 *                  empty   — `screen=Empty` tweak → EmptyVoice ("Extract my voice");
 *                            the real app shows this until a voice exists.
 *                  ready   — default.
 *                  busy    — re-extract running → ReExtractPanel replaces sections.
 *                  translated — locale ≠ en → every section is read-only, localized,
 *                            with a banner; "View original" flips back to editable en.
 *                  checking / conflicts / clear — the lint sub-states.
 * Data shown:      intro line; themesInclude/themesExclude [{label,note}]; characteristics
 *                  [{label,text}]; do/dont [{text}]; examples [{context,stat,text}]. Each
 *                  item carries an `i18n` map (es/de bundled here; all UI_LANGS in prod).
 *                  Lint conflicts carry parts, a why, a one-click fix (section+id+field+
 *                  value) and the rows they flag.
 * Interactions:    per-section edit/save/cancel (add/remove rows) — original locale only;
 *                  run / re-run voice check; apply a fix (mutates the real section,
 *                  flashes the row) or ignore (undoable); re-extract (confirm dialog →
 *                  stepped progress → sections refresh); switch locale (page) and the
 *                  prompt preview's own translate; expand/collapse the prompt preview.
 * Localize:        ALL end-user copy localizes. Section CONTENT localizes via the per-item
 *                  i18n bundles (vLoc) + INTRO_I18N; the assembled prompt localizes its
 *                  scaffolding via PROMPT_LABELS. Editing is disabled in translated mode
 *                  (you edit the source, then translations re-derive).
 * Backend gotchas: NO match %. The voice profile is the single source of truth consumed
 *                  by every drafting surface; the prompt preview is generated from it 1:1
 *                  (assemblePrompt). Translations are read-only previews of the CURRENT
 *                  original — editing the original supersedes a stale translation (vLoc
 *                  falls back to the source string). Re-extract REPLACES hand edits.
 * Changed in rework: adopted shared shell (deleted local sidebar/account/Mono); reading
 *                  width + .topbar-inner; .status-pill topbar; canonical animations.
 *                  Split the old 4 sections into SEVEN (themes→include + exclude red zone,
 *                  traits→characteristics + do + don't). Added the localized read-only view
 *                  + language picker, the "what the AI sees" prompt preview w/ translate,
 *                  and an empty state. REMOVED the voice match % entirely.
 * ──────────────────────────────────────────────────────────────────── */

const { useState: uS, useEffect: uE, useRef: uR } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "dark": false,
  "density": "Comfortable",
  "conflicts": "Show 2",
  "screen": "Ready"
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = window.useTweaks(TWEAK_DEFAULTS);

  // canonical voice — seven sections
  const clone = (k) => window.VOICE_SECTIONS[k].map((x) => ({ ...x }));
  const [sections, setSections] = uS(() => ({
    intro: window.VOICE_SECTIONS.intro,
    themesInclude: clone("themesInclude"),
    themesExclude: clone("themesExclude"),
    characteristics: clone("characteristics"),
    do: clone("do"),
    dont: clone("dont"),
    examples: clone("examples"),
  }));
  const [meta, setMeta] = uS(window.VOICE_META);

  // page-level translated view
  const [locale, setLocale] = uS("en");
  const translated = locale !== "en";

  // lint
  const baseline = () => (t.conflicts === "Show 2" ? window.VOICE_CONFLICTS.map((c) => ({ ...c })) : []);
  const [conflicts, setConflicts] = uS(baseline);
  const [checking, setChecking] = uS(false);
  const [lastRun, setLastRun] = uS("2 days ago");
  const [leavingIds, setLeavingIds] = uS([]);
  const [justFixedId, setJustFixedId] = uS(null);

  // process states
  const [bootLoading, setBootLoading] = uS(true);
  const [busy, setBusy] = uS(false);
  const [stepIndex, setStepIndex] = uS(0);
  const [reDialog, setReDialog] = uS(false);

  const [toasts, setToasts] = uS([]);

  const loading = bootLoading || t.screen === "Loading";
  const empty = t.screen === "Empty";

  /* tweaks → app */
  uE(() => { document.documentElement.classList.toggle("dark", !!t.dark); }, [t.dark]);
  uE(() => { setConflicts(baseline()); }, [t.conflicts]);
  uE(() => { const id = setTimeout(() => setBootLoading(false), 900); return () => clearTimeout(id); }, []);
  // leaving translated mode is implicit when editing; entering empty resets locale
  uE(() => { if (empty) setLocale("en"); }, [empty]);

  /* toasts */
  function pushToast(toast) {
    const id = "t" + Date.now() + Math.random().toString(36).slice(2, 5);
    setToasts((ts) => [...ts, { ...toast, id }]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), 4600);
  }
  function undoToast(toast) { if (toast.undo) toast.undo(); setToasts((ts) => ts.filter((x) => x.id !== toast.id)); }

  /* section saves */
  const mkSave = (key, title, unit) => (v) => {
    setSections((s) => ({ ...s, [key]: v }));
    pushToast({ title, sub: Array.isArray(v) && unit ? `${v.length} ${unit}` : undefined });
  };
  const saveIntro = (v) => { setSections((s) => ({ ...s, intro: v })); pushToast({ title: "Intro saved" }); };
  const saveInclude = mkSave("themesInclude", "Themes saved", "themes");
  const saveExclude = mkSave("themesExclude", "Exclusions saved", "topics");
  const saveChars = mkSave("characteristics", "Characteristics saved", "traits");
  const saveDo = mkSave("do", "Do rules saved", "rules");
  const saveDont = mkSave("dont", "Don't rules saved", "rules");
  const saveExamples = mkSave("examples", "Examples saved", "examples");

  /* lint */
  function runCheck() {
    if (translated) return;
    setChecking(true); setConflicts([]); setLeavingIds([]);
    setTimeout(() => {
      setChecking(false);
      setConflicts(window.VOICE_CONFLICTS.map((c) => ({ ...c })));
      setLastRun("just now");
    }, 1500);
  }
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
    setReDialog(false); setLocale("en"); setBusy(true); setStepIndex(0);
    const steps = window.REEXTRACT_STEPS.length;
    let i = 0;
    const tick = () => {
      i += 1;
      if (i < steps) { setStepIndex(i); setTimeout(tick, 1050); }
      else {
        setStepIndex(steps);
        setTimeout(() => {
          setBusy(false);
          setMeta((m) => ({ ...m, updated: "just now" }));
          setConflicts([]); setLastRun("just now");
          pushToast({ title: "Voice re-extracted", sub: "Sections updated from your recent posts" });
        }, 650);
      }
    };
    setTimeout(tick, 1050);
  }

  // rows the open conflicts implicate → Set of "section:id" (quiet highlight)
  const flaggedKeys = checking ? new Set() : new Set(conflicts.flatMap((c) => (c.flags || []).map(([s, id]) => s + ":" + id)));
  const issues = conflicts.length;
  const status = busy ? "busy" : "ready";
  const ro = translated; // sections read-only in translated mode

  return (
    <div className="app" data-density={t.density === "Compact" ? "compact" : "comfortable"}>
      <window.Sidebar active="voice" />
      <div className="main">
        <window.Topbar dark={!!t.dark} onToggleTheme={() => setTweak("dark", !t.dark)} status={status} issues={issues} locale={locale} />
        <div className="scroll">
          <div className="content">
            {loading ? (
              <window.VoiceSkeleton />
            ) : empty ? (
              <window.EmptyVoice onExtract={() => setReDialog(true)} />
            ) : (
              <>
                <window.VoiceHero
                  meta={meta} busy={busy} checking={checking} locale={locale}
                  onCheck={runCheck} onReExtract={() => setReDialog(true)} onLocale={setLocale}
                />

                {busy ? (
                  <window.ReExtractPanel stepIndex={stepIndex} />
                ) : (
                  <>
                    {translated && <window.TranslatedBanner locale={locale} onViewOriginal={() => setLocale("en")} />}

                    {!translated && (checking || issues > 0 || conflicts.length === 0) && (
                      <window.VoiceCheck
                        conflicts={conflicts} checking={checking} lastRun={lastRun} leavingIds={leavingIds}
                        onApply={applyFix} onDismiss={dismissConflict} onRecheck={runCheck}
                      />
                    )}

                    <window.IntroSection value={sections.intro} locale={locale} readOnly={ro} onSave={saveIntro} />
                    <window.ThemesSection section="themesInclude" items={sections.themesInclude} locale={locale} readOnly={ro} onSave={saveInclude} />
                    <window.ThemesSection section="themesExclude" items={sections.themesExclude} exclude locale={locale} readOnly={ro} onSave={saveExclude} />
                    <window.CharacteristicsSection items={sections.characteristics} locale={locale} readOnly={ro} flaggedKeys={flaggedKeys} justFixedId={justFixedId} onSave={saveChars} />
                    <window.RuleSection section="do" items={sections.do} locale={locale} readOnly={ro} flaggedKeys={flaggedKeys} justFixedId={justFixedId} onSave={saveDo} />
                    <window.RuleSection section="dont" items={sections.dont} negative locale={locale} readOnly={ro} flaggedKeys={flaggedKeys} justFixedId={justFixedId} onSave={saveDont} />
                    <window.ExamplesSection items={sections.examples} locale={locale} readOnly={ro} flaggedKeys={flaggedKeys} justFixedId={justFixedId} onSave={saveExamples} />

                    <window.PromptPreview sections={sections} />
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {reDialog && <window.ReExtractDialog onCancel={() => setReDialog(false)} onConfirm={startReExtract} />}
      <window.Toasts toasts={toasts} onUndo={undoToast} />

      <window.TweaksPanel>
        <window.TweakSection label="Voice check" />
        <window.TweakRadio label="Conflicts" value={t.conflicts} options={["Show 2", "None"]} onChange={(v) => setTweak("conflicts", v)} />
        <window.TweakButton label="Run voice check" onClick={runCheck} secondary />
        <window.TweakSection label="Voice" />
        <window.TweakButton label="Re-extract voice" onClick={() => setReDialog(true)} secondary />
        <window.TweakRadio label="Screen" value={t.screen} options={["Ready", "Loading", "Empty"]} onChange={(v) => setTweak("screen", v)} />
        <window.TweakSection label="Appearance" />
        <window.TweakToggle label="Dark mode" value={!!t.dark} onChange={(v) => setTweak("dark", v)} />
        <window.TweakRadio label="Density" value={t.density} options={["Comfortable", "Compact"]} onChange={(v) => setTweak("density", v)} />
      </window.TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
