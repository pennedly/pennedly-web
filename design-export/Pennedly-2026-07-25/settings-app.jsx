// settings-app.jsx — Settings: state, flows (language / disconnect / connect), tweaks.

/* ── DEV HANDOFF · Settings ──────────────────────────────────────────
 * Route / shell:   /app/settings  (full app shell, sidebar = yes; render
 *                  <window.Sidebar active="settings" />).
 * Purpose:         Account-level controls: who you're signed in as, the app's
 *                  interface language, the Threads accounts Pennedly writes for,
 *                  and a jump back into voice/onboarding setup.
 * Content width:   reading (--content-reading, 720); topbar row in .topbar-inner
 *                  (no --wide); body in .content.
 * Topbar:          title="Settings"; actions = theme toggle only (no status pill;
 *                  no settings icon — we're already on Settings).
 * Sections (top→bottom): intro · Account (avatar + email + plan) · Interface
 *                  language (8 UI locales as flag buttons) · Connected Threads
 *                  accounts (disconnect + connect another) · Voice setup.
 * States + triggers:
 *                  loading — boot skeleton (~850ms) / `screen=Loading` tweak.
 *                  ready   — default.
 *                  empty   — CONNECTED ACCOUNTS only: `accounts=None` tweak → the
 *                            accounts card shows an empty state + connect CTA.
 * Data:            account = window.SHELL_USER (email, plan) + primary account's
 *                  avatar; languages = window.UI_LANGS (8) with LANG_FLAGS glyphs;
 *                  connected accounts = window.SHELL_ACCOUNTS (same list the sidebar
 *                  switcher shows); CONNECTABLE = the pool "connect another" adds.
 * Interactions:    pick a language (toast) · disconnect an account behind an INLINE
 *                  TWO-STEP confirm (Disconnect → confirm), then an Undo toast ·
 *                  connect another (adds from the pool; guards duplicates) · Voice
 *                  setup links to Onboarding.html; testers also get a preview-mode link.
 * Localize:        all end-user copy (intro, card titles + descriptions, language
 *                  card, account labels, voice-setup copy, toasts). The language list
 *                  itself is the locale catalog. Email/handles are user data.
 * Backend gotchas: Log out is NOT here — it lives in the sidebar account menu (§4).
 *                  Disconnecting stops ALL drafting/posting for that handle. The
 *                  language here is the UI locale only; it does NOT translate drafts.
 *                  Preview mode is tester-gated (IS_TESTER) and hidden for non-testers.
 * Changed in rework: adopted shared shell (deleted local sidebar/account/Mono);
 *                  reading width + .topbar-inner; avatars now use <window.Avatar/>
 *                  (real photo + initials fallback). Account/accounts/languages now
 *                  read from the shared SHELL_USER / SHELL_ACCOUNTS / UI_LANGS so the
 *                  screen matches the sidebar switcher. Language picker switched to
 *                  flag buttons; added a connected-accounts EMPTY state; voice-setup
 *                  now links to ONBOARDING; REMOVED the on-page sign-out (it's in §4).
 * ──────────────────────────────────────────────────────────────────── */

const { useState: gS, useEffect: gE, useRef: gR } = React;

const IS_TESTER = true; // demo account is a tester (matches the tester-gated nav)

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "dark": false,
  "density": "Comfortable",
  "accounts": "Several",
  "screen": "Ready"
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = window.useTweaks(TWEAK_DEFAULTS);

  const seed = () => {
    if (t.accounts === "None") return [];
    if (t.accounts === "One") return window.SHELL_ACCOUNTS.slice(0, 1).map((a) => ({ ...a }));
    return window.SHELL_ACCOUNTS.map((a) => ({ ...a }));
  };

  const [lang, setLang] = gS("en");
  const [accounts, setAccounts] = gS(seed);
  const [confirmingId, setConfirmingId] = gS(null);
  const [leavingIds, setLeavingIds] = gS([]);
  const [toasts, setToasts] = gS([]);
  const [bootLoading, setBootLoading] = gS(true);
  const newIdx = gR(0);

  const loading = bootLoading || t.screen === "Loading";

  /* tweaks → app */
  gE(() => { document.documentElement.classList.toggle("dark", !!t.dark); }, [t.dark]);
  gE(() => { setAccounts(seed()); setConfirmingId(null); }, [t.accounts]);
  gE(() => { const id = setTimeout(() => setBootLoading(false), 850); return () => clearTimeout(id); }, []);

  /* toasts */
  function pushToast(toast) {
    const id = "t" + Date.now() + Math.random().toString(36).slice(2, 5);
    setToasts((ts) => [...ts, { ...toast, id }]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), 4400);
  }
  function undoToast(toast) { if (toast.undo) toast.undo(); setToasts((ts) => ts.filter((x) => x.id !== toast.id)); }

  /* language */
  function pickLang(code) {
    setLang(code);
    const l = window.UI_LANGS.find((x) => x.code === code);
    pushToast({ title: "Interface language updated", sub: l ? l.native : code });
  }

  /* disconnect (inline two-step confirm) */
  function askDisconnect(id) { setConfirmingId(id); }
  function cancelDisconnect() { setConfirmingId(null); }
  function confirmDisconnect(acct) {
    setConfirmingId(null);
    const idx = accounts.findIndex((a) => a.id === acct.id);
    setLeavingIds((ids) => [...ids, acct.id]);
    setTimeout(() => {
      setAccounts((as) => as.filter((a) => a.id !== acct.id));
      setLeavingIds((ids) => ids.filter((x) => x !== acct.id));
      pushToast({
        title: "Account disconnected",
        sub: acct.handle,
        undo: () => setAccounts((as) => { const next = [...as]; next.splice(Math.min(idx, next.length), 0, acct); return next; }),
      });
    }, 240);
  }

  /* connect another */
  function connect() {
    const pool = window.CONNECTABLE;
    const next = pool[newIdx.current % pool.length];
    newIdx.current += 1;
    if (accounts.some((a) => a.id === next.id)) { pushToast({ kind: "error", title: "Already connected", sub: next.handle }); return; }
    setAccounts((as) => [...as, { ...next }]);
    pushToast({ title: "Account connected", sub: next.handle });
  }

  function enterPreview() { pushToast({ title: "Preview mode on", sub: "Experimental features are now visible" }); }

  return (
    <div className="app" data-density={t.density === "Compact" ? "compact" : "comfortable"}>
      <window.Sidebar active="settings" />
      <div className="main">
        <window.Topbar dark={!!t.dark} onToggleTheme={() => setTweak("dark", !t.dark)} />
        <div className="scroll">
          <div className="content">
            {loading ? (
              <window.SettingsSkeleton />
            ) : (
              <>
                <div className="intro">
                  <span className="intro-eyebrow">Account</span>
                  <h1 className="intro-title">Settings</h1>
                  <p className="intro-lead">Manage your account, the language Pennedly speaks to you in, and the Threads accounts it writes for.</p>
                </div>

                <window.AccountCard />
                <window.LanguageCard value={lang} onChange={pickLang} />
                <window.AccountsCard
                  accounts={accounts} leavingIds={leavingIds} confirmingId={confirmingId}
                  onAskDisconnect={askDisconnect} onCancel={cancelDisconnect} onConfirm={confirmDisconnect}
                  onConnect={connect}
                />
                <window.VoiceSetupCard isTester={IS_TESTER} onPreview={enterPreview} />

                <div className="set-foot">
                  <span className="ver">Pennedly · v2.4.1</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <window.Toasts toasts={toasts} onUndo={undoToast} />

      {/* ------------------------------ Tweaks ------------------------------ */}
      <window.TweaksPanel>
        <window.TweakSection label="Connected accounts" />
        <window.TweakRadio label="How many" value={t.accounts} options={["Several", "One", "None"]} onChange={(v) => setTweak("accounts", v)} />
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
