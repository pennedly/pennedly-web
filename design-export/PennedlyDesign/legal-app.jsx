// legal-app.jsx — reusable legal-page template: renders one doc + tweaks.
// In production each route (/privacy, /terms, /data-deletion) renders this
// template with its own doc; here a Tweak + footer links switch the sample.

const { useState: gS, useEffect: gE } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "dark": false,
  "document": "Privacy Policy"
}/*EDITMODE-END*/;

const LABEL_TO_KEY = { "Privacy Policy": "privacy", "Terms of Service": "terms", "Data Deletion": "dataDeletion" };
const KEY_TO_LABEL = { privacy: "Privacy Policy", terms: "Terms of Service", dataDeletion: "Data Deletion" };

function App() {
  const [t, setTweak] = window.useTweaks(TWEAK_DEFAULTS);
  const docKey = LABEL_TO_KEY[t.document] || "privacy";
  const doc = window.LEGAL_DOCS[docKey];

  gE(() => { document.documentElement.classList.toggle("dark", !!t.dark); }, [t.dark]);
  gE(() => { window.scrollTo({ top: 0 }); }, [docKey]);

  function switchDoc(key) { setTweak("document", KEY_TO_LABEL[key]); }

  return (
    <div className="legal">
      <window.TopBar dark={!!t.dark} onToggleTheme={() => setTweak("dark", !t.dark)} />
      <window.LegalArticle doc={doc} />
      <window.Footer current={docKey} onSwitch={switchDoc} />

      {/* ------------------------------ Tweaks ------------------------------ */}
      <window.TweaksPanel>
        <window.TweakSection label="Template" />
        <window.TweakSelect label="Document" value={t.document} options={["Privacy Policy", "Terms of Service", "Data Deletion"]} onChange={(v) => setTweak("document", v)} />
        <window.TweakSection label="Appearance" />
        <window.TweakToggle label="Dark mode" value={!!t.dark} onChange={(v) => setTweak("dark", v)} />
      </window.TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
