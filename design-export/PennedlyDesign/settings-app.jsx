// settings-app.jsx — Settings: state, flows (language / disconnect / connect), tweaks.

const { useState: gS, useEffect: gE } = React;

const NEW_ACCOUNTS = [
  { id: "n1", name: "Mara reads", handle: "@mara.reads", initials: "MR", primary: false, followers: "612" },
  { id: "n2", name: "Field Notes", handle: "@fieldnotes", initials: "FN", primary: false, followers: "1.3k" },
];

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "dark": false,
  "density": "Comfortable",
  "accounts": "Several",
  "screen": "Ready"
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = window.useTweaks(TWEAK_DEFAULTS);

  const seed = () => (t.accounts === "One"
    ? window.CONNECTED_ACCOUNTS.slice(0, 1).map((a) => ({ ...a }))
    : window.CONNECTED_ACCOUNTS.map((a) => ({ ...a })));

  const [lang, setLang] = gS("EN");
  const [accounts, setAccounts] = gS(seed);
  const [confirmingId, setConfirmingId] = gS(null);
  const [leavingIds, setLeavingIds] = gS([]);
  const [toasts, setToasts] = gS([]);
  const [bootLoading, setBootLoading] = gS(true);
  const newIdx = React.useRef(0);

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
  function undoToast(toast) {
    if (toast.undo) toast.undo();
    setToasts((ts) => ts.filter((x) => x.id !== toast.id));
  }

  /* language */
  function pickLang(code) {
    setLang(code);
    const l = window.LANGUAGES.find((x) => x.code === code);
    pushToast({ title: "Language updated", sub: l ? l.name : code });
  }

  /* disconnect */
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
    const next = NEW_ACCOUNTS[newIdx.current % NEW_ACCOUNTS.length];
    newIdx.current += 1;
    if (accounts.some((a) => a.id === next.id)) { pushToast({ kind: "error", title: "Already connected", sub: next.handle }); return; }
    setAccounts((as) => [...as, { ...next }]);
    pushToast({ title: "Account connected", sub: next.handle });
  }

  return (
    <div className="app" data-density={t.density === "Compact" ? "compact" : "comfortable"}>
      <window.Sidebar />
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

                <window.AccountCard user={window.ST_USER} />
                <window.LanguageCard languages={window.LANGUAGES} value={lang} onChange={pickLang} />
                <window.AccountsCard
                  accounts={accounts} leavingIds={leavingIds} confirmingId={confirmingId}
                  onAskDisconnect={askDisconnect} onCancel={cancelDisconnect} onConfirm={confirmDisconnect}
                  onConnect={connect}
                />
                <window.ShortcutsCard />

                <div className="set-foot">
                  <button className="btn btn--ghost btn--sm"><window.IcLogout size={15} /> Sign out</button>
                  <span className="grow" />
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
        <window.TweakRadio label="How many" value={t.accounts} options={["Several", "One"]} onChange={(v) => setTweak("accounts", v)} />
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
