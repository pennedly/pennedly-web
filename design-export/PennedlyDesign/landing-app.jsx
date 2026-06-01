// landing-app.jsx — public landing page composition + tweaks.

const { useEffect: lE } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "dark": false,
  "sample": true
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = window.useTweaks(TWEAK_DEFAULTS);
  lE(() => { document.documentElement.classList.toggle("dark", !!t.dark); }, [t.dark]);

  return (
    <div className="land">
      <window.TopBar dark={!!t.dark} onToggleTheme={() => setTweak("dark", !t.dark)} />
      <window.Hero showSample={t.sample !== false} />
      <window.Features />
      <window.Footer />

      {/* ------------------------------ Tweaks ------------------------------ */}
      <window.TweaksPanel>
        <window.TweakSection label="Appearance" />
        <window.TweakToggle label="Dark mode" value={!!t.dark} onChange={(v) => setTweak("dark", v)} />
        <window.TweakSection label="Hero" />
        <window.TweakToggle label="Sample draft" value={t.sample !== false} onChange={(v) => setTweak("sample", v)} />
      </window.TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
