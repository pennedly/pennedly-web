// ob-app.jsx — harness: direction switcher + tweaks, mounts the active direction.
// Each direction is a self-contained presentational shell over the shared
// useOnboardingFlow() state machine — same steps, states, gating and preview.

const { useState: aS, useEffect: aE } = React;

const DIRECTIONS = [
  { key: "Manuscript", name: "Manuscript", blurb: "Refined centered card" },
  { key: "Atelier", name: "Atelier", blurb: "Split-screen + journey rail" },
  { key: "Broadsheet", name: "Broadsheet", blurb: "Editorial / letterpress" },
  { key: "Stage", name: "Stage", blurb: "Cinematic focal moments" },
];

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "direction": "Manuscript",
  "dark": false,
  "entry": "First run",
  "posts": "Enough",
  "preview": false,
  "jump": "Connect"
}/*EDITMODE-END*/;

function DirectionSwitcher({ value, onChange }) {
  return (
    <div className="dirsw" data-omelette-chrome="">
      <span className="dirsw-lab">Direction</span>
      {DIRECTIONS.map((d, i) => (
        <button
          key={d.key}
          className={`dirsw-seg ${value === d.key ? "is-on" : ""}`}
          onClick={() => onChange(d.key)}
          title={d.blurb}
        >
          <span className="dsw-n">{i + 1}</span>
          <span className="dsw-name">{d.name}</span>
        </button>
      ))}
    </div>
  );
}

function App() {
  const [t, setTweak] = window.useTweaks(TWEAK_DEFAULTS);
  const flow = window.useOnboardingFlow(t);

  aE(() => { document.documentElement.classList.toggle("dark", !!t.dark); }, [t.dark]);

  const dirProps = {
    flow,
    dark: !!t.dark,
    onToggleTheme: () => setTweak("dark", !t.dark),
  };

  const Dir = {
    Manuscript: window.DirManuscript,
    Atelier: window.DirAtelier,
    Broadsheet: window.DirBroadsheet,
    Stage: window.DirStage,
  }[t.direction] || window.DirManuscript;

  return (
    <div className="ob-root">
      <Dir {...dirProps} />

      <DirectionSwitcher value={t.direction} onChange={(v) => setTweak("direction", v)} />

      <window.TweaksPanel>
        <window.TweakSection label="Direction" />
        <window.TweakSelect
          label="Visual direction" value={t.direction}
          options={DIRECTIONS.map((d) => ({ value: d.key, label: `${d.name} — ${d.blurb}` }))}
          onChange={(v) => setTweak("direction", v)}
        />
        <window.TweakSection label="Entry" />
        <window.TweakRadio label="Started from" value={t.entry} options={["First run", "Revisit"]} onChange={(v) => setTweak("entry", v)} />
        <window.TweakRadio label="Account posts" value={t.posts} options={["Enough", "Too few"]} onChange={(v) => setTweak("posts", v)} />
        <window.TweakToggle label="Preview mode (tester)" value={!!t.preview} onChange={(v) => setTweak("preview", v)} />
        <window.TweakSection label="Walkthrough" />
        <window.TweakRadio label="Jump to" value={t.jump} options={["Connect", "Choose", "Analyze", "Scratch", "Done"]} onChange={(v) => setTweak("jump", v)} />
        <window.TweakButton label="Restart flow" onClick={() => { flow.resetAll(); setTweak("jump", "Connect"); }} secondary />
        <window.TweakSection label="Appearance" />
        <window.TweakToggle label="Dark mode" value={!!t.dark} onChange={(v) => setTweak("dark", v)} />
      </window.TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
