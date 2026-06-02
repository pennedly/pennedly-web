// landing-app.jsx — public landing page composition + tweaks.

/* ── DEV HANDOFF · Landing ───────────────────────────────────────────
 * Route:        /  — the PUBLIC marketing page. No app shell, no sidebar, no
 *               language switcher; copy is the English baseline (pre-auth).
 * Purpose:      Explain Pennedly in a calm, non-hypey way and route visitors to
 *               Sign in. In-development / invite-only beta.
 * Sections:     top bar (brand · theme toggle · Sign in) · hero (value copy +
 *               primary "Sign in" CTA + contact mailto, beside a tilted "draft
 *               specimen" card) · four-up feature row · legal footer
 *               (Privacy / Terms / Data Deletion + contact on pennedly.com).
 * Interactions: theme toggle (light/dark) · Sign in → Login.html · contact →
 *               mailto:hello@pennedly.com · footer legal links · hero specimen
 *               straightens on hover. Tweaks: dark mode + show/hide the specimen.
 * What changed: tokens-only (verified light + dark); the specimen card is now
 *               genuinely tilted (straightens on hover); animations reference the
 *               CANONICAL keyframes (card-in entrance, ping status dot) instead of
 *               page-local duplicates; contact email moved to the real domain
 *               (pennedly.com); added this handoff note.
 * ──────────────────────────────────────────────────────────────────── */

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
