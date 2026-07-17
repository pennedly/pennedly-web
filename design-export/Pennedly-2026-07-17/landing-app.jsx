// landing-app.jsx — public landing page composition + demo tweaks.

/* ── DEV HANDOFF · Landing ───────────────────────────────────────────
 * Route:        /  — the PUBLIC marketing page. No app shell, no sidebar.
 *               Pre-auth. In-development / invite-only beta.
 * Purpose:      Explain Pennedly in a calm, non-hypey way and route visitors to
 *               Sign in. Positioning held: a DRAFTING PARTNER where the user
 *               approves every word; autopilot is opt-in only, never the headline.
 * Sections:     top bar (brand · language switcher · theme toggle · "Sign in") ·
 *               hero (value copy + primary "Sign in" CTA + contact mailto, beside
 *               a "Studio" product-peek window with the draft being composed) ·
 *               bento feature grid (6, two larger tiles) · legal footer
 *               (Privacy / Terms / Data Deletion).
 * Interactions: language switcher (8 locales, EN baseline) · theme toggle
 *               (light/dark) · Sign in → Login.html · contact → mailto · footer
 *               legal links · feature tiles lift on hover. The window peek + the
 *               sample draft are ILLUSTRATIVE (not a live feed).
 * Responsive:   container-query on `.land` — desktop ≥ 881 (2-col hero, 3-col
 *               bento), tablet 561–880 (stacked hero, 2-col bento), mobile ≤ 560
 *               (1-col, window peek below the copy).
 * Localize:     all top-bar / hero / feature / footer copy (LAND, LAND_FEATURES,
 *               LAND_FOOTER, LAND_LANGS labels). Sample-draft text + account
 *               avatars are sample content, not localized chrome.
 * Demo (this file only): the TweaksPanel drives dark · sample on/off · viewport
 *               web/mobile · freeze motion · forced interactive state. The real
 *               deployed page is just `.land` (no `.land-host` wrapper, no panel).
 * Backend:      invite-only beta, in development — only CTA is Sign in (no public
 *               sign-up). Legal pages exist + are linked. Autopilot is real but
 *               opt-in, not the headline.
 * ──────────────────────────────────────────────────────────────────── */

const { useEffect: lE } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "dark": false,
  "sample": true,
  "viewport": "Web",
  "motion": true,
  "force": "None"
}/*EDITMODE-END*/;

const FORCE_CLASS = { None: "", Hover: "force-hover", Active: "force-active", Disabled: "force-disabled" };

function App() {
  const [t, setTweak] = window.useTweaks(TWEAK_DEFAULTS);
  lE(() => { document.documentElement.classList.toggle("dark", !!t.dark); }, [t.dark]);

  const mobile = t.viewport === "Mobile";
  const landClass = ["land", t.motion === false ? "is-frozen" : "", FORCE_CLASS[t.force] || ""].filter(Boolean).join(" ");

  return (
    <div className={`land-host ${mobile ? "is-mobile" : ""}`}>
      <div className={landClass}>
        <window.TopBar dark={!!t.dark} onToggleTheme={() => setTweak("dark", !t.dark)} />
        <window.Hero showSample={t.sample !== false} />
        <window.Features />
        <window.Footer />
      </div>

      {/* ------------------------------ Tweaks ------------------------------ */}
      <window.TweaksPanel>
        <window.TweakSection label="Appearance" />
        <window.TweakToggle label="Dark mode" value={!!t.dark} onChange={(v) => setTweak("dark", v)} />
        <window.TweakSection label="Hero" />
        <window.TweakToggle label="Sample draft" value={t.sample !== false} onChange={(v) => setTweak("sample", v)} />
        <window.TweakSection label="Preview" />
        <window.TweakRadio label="Viewport" value={t.viewport} options={["Web", "Mobile"]} onChange={(v) => setTweak("viewport", v)} />
        <window.TweakToggle label="Freeze motion" value={t.motion === false} onChange={(v) => setTweak("motion", !v)} />
        <window.TweakSection label="Force state" />
        <window.TweakRadio label="Interactive" value={t.force} options={["None", "Hover", "Active", "Disabled"]} onChange={(v) => setTweak("force", v)} />
      </window.TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
