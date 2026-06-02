// legal-app.jsx — reusable legal-page template: renders one doc + tweaks.

/* ── DEV HANDOFF · Legal template ────────────────────────────────────
 * Routes:       /privacy · /terms · /data-deletion — all render THIS one
 *               template, each fed its own doc. PUBLIC page: no app shell, no
 *               sidebar. Here a Tweak + the footer switcher swap the sample doc.
 * Purpose:      A single, reusable, highly-readable legal-doc shell the operator
 *               drops reviewed copy into. /data-deletion is a first-class doc
 *               (Meta requires a reachable data-deletion page).
 * Sections:     sticky top bar (brand → home + theme toggle) · 720px article
 *               column (back-to-home · eyebrow/title/updated/intro · TEMPLATE
 *               notice callout · auto-generated TOC · typed prose blocks:
 *               paragraph / sub-heading / bullet list / fill-in placeholder /
 *               operator-identity card / quiet contact block) · footer that
 *               cross-links the three docs + Home.
 * What changed: the COPY is now an explicit TEMPLATE — every section body is
 *               bracketed fill-in guidance, not authoritative legal text (do NOT
 *               ship as-is). Added the real operator of record (Fundacja Rozwoju
 *               Przedsi\u0119biorczo\u015bci \u201eTw\u00f3j StartUp\u201d — KRS/NIP/REGON, Warszawa) and a
 *               TEMPLATE notice callout. Data Deletion now documents the Meta
 *               deauthorize / data-deletion callback (cascade-delete + confirmation
 *               code, completes within 30 days). Contact emails moved to the real
 *               domain (pennedly.com); tokens-only (light + dark); canonical card-in
 *               entrance; added this handoff note.
 * ──────────────────────────────────────────────────────────────────── */

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
