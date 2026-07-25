// autopilot-app.jsx — Autopilot: master switch, schedules, reply policy, activity.

/* ── DEV HANDOFF · Autopilot ────────────────────────────────────────
 * Route / shell:   /app/autopilot  (tester-gated). Full app shell, sidebar = yes;
 *                  render <window.Sidebar active="autopilot" />.
 * Purpose:         Opt-in automation: let Pennedly publish posts on a schedule
 *                  and auto-reply to comments — all in the user's voice, all
 *                  visible in their feed. OFF by default; the user stays in control.
 * Content width:   reading (--content-reading, 720); topbar row in .topbar-inner
 *                  (no --wide), body in .content.
 * Topbar:          title="Autopilot"; .status-pill — success "Active" when the
 *                  master is on, neutral "Off" otherwise; actions = theme, settings.
 * Sections (top→bottom): page intro · master card + "off" reassurance ·
 *                  Scheduled posts (list of schedule objects) · Auto-reply policy
 *                  (account-level) · Activity (read-only).
 * States + triggers:
 *                  loading — skeleton on mount / `state=Loading` tweak (~850ms).
 *                  ready   — default.
 *                  empty (no schedules) — `state=No objects` tweak → EmptyObjects.
 *                  empty (no activity)  — `state=No activity` tweak → EmptyActivity.
 *                  confirm dialog — turning the MASTER on (only) opens a confirm;
 *                  turning it off is immediate. (Per-schedule on/off are instant.)
 * Data shown:      per schedule — name, post time, random ± spread, topic, on/off,
 *                  and a "new posts start with auto-reply on" seed. Policy — master
 *                  on/off, audience, replies/day. Activity — per-schedule counters,
 *                  recent published posts (text + metrics + link), recent auto-replies
 *                  (commenter + their comment + the bot's reply + the post it's on + link).
 * Interactions:    master toggle (confirm-to-enable) · add / rename / edit / delete
 *                  schedules (delete is undoable via toast) · edit policy. Activity is
 *                  strictly read-only.
 * Localize:        end-user copy = intro, master/reassure/empty copy, section
 *                  titles + subs, field labels, policy labels, activity captions.
 *                  Post text, names, numbers are SAMPLE content. Clock times +
 *                  activity timestamps render in the VIEWER's locale & timezone.
 * Backend gotchas: SCHEDULE TIME = UTC minutes-since-midnight (obj.utcMin) is the
 *                  truth; the UI converts to/from the viewer's LOCAL time and shows
 *                  a "UTC±N · sends HH:MM UTC" hint (see autopilot-data.jsx). The
 *                  ACCOUNT auto-reply policy (audience + replies/day) is what the
 *                  worker actually honors — the per-schedule "seed" only sets the
 *                  initial auto-reply state of NEW posts. Activity links are real
 *                  Threads permalinks in production.
 * Changed in rework: adopted the shared shell (deleted the local sidebar/account);
 *                  reading width + .topbar-inner; topbar uses .status-pill; avatars
 *                  use <window.Avatar/>; timestamps via window.fmtDateTime. Schedule
 *                  time is now genuinely local-timezone (UTC-stored + converted).
 *                  Removed the vestigial per-schedule audience/cap no-ops — those
 *                  live ONLY on the account policy now. Added the activity link-outs.
 * ─────────────────────────────────────────────────────────────────── */

const { useState: useApS, useEffect: useApE } = React;

const AP_TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "dark": false,
  "state": "Live"
}/*EDITMODE-END*/;

let OBJ_SEQ = 100;

function AutopilotApp() {
  const [t, setTweak] = window.useTweaks(AP_TWEAK_DEFAULTS);
  const [phase, setPhase] = useApS("loading");
  const [master, setMaster] = useApS(false);                 // OFF is the default
  const [objects, setObjects] = useApS(window.DEFAULT_OBJECTS);
  const [policy, setPolicy] = useApS(window.DEFAULT_POLICY);
  const [actTab, setActTab] = useApS("posts");
  const [confirm, setConfirm] = useApS(false);
  const [toasts, setToasts] = useApS([]);

  useApE(() => {
    if (t.state === "Loading") { setPhase("loading"); return; }
    setPhase("loading");
    const id = setTimeout(() => setPhase("ready"), 850);
    return () => clearTimeout(id);
  }, [t.state]);
  useApE(() => { document.documentElement.classList.toggle("dark", !!t.dark); }, [t.dark]);

  const noObjects = t.state === "No objects";
  const noActivity = t.state === "No activity";
  const objs = noObjects ? [] : objects;
  const posts = noActivity ? [] : window.AUTO_POSTS;
  const replies = noActivity ? [] : window.AUTO_REPLIES;
  const counters = noActivity ? [] : window.COUNTERS;

  function pushToast(toast) {
    const id = "t" + Date.now() + Math.random().toString(36).slice(2, 5);
    setToasts((ts) => [...ts, { ...toast, id }]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), 4200);
  }
  function undoToast(toast) { if (toast.undo) toast.undo(); setToasts((ts) => ts.filter((x) => x.id !== toast.id)); }

  function toggleMaster(v) {
    if (v) { setConfirm(true); return; }   // enabling is deliberate → confirm
    setMaster(false);
    pushToast({ kind: "success", title: "Autopilot paused", sub: "Nothing will post or reply until you turn it back on" });
  }
  function confirmOn() { setConfirm(false); setMaster(true); pushToast({ kind: "success", title: "Autopilot is on", sub: "Posting and replying on your schedule" }); }

  const changeObj = (id, patch) => setObjects((os) => os.map((o) => (o.id === id ? { ...o, ...patch } : o)));
  const removeObj = (id) => { const removed = objects.find((o) => o.id === id); setObjects((os) => os.filter((o) => o.id !== id)); pushToast({ kind: "success", title: "Schedule removed", undo: () => setObjects((os) => (os.some((o) => o.id === id) ? os : [...os, removed])) }); };
  const addObj = () => { const id = "o" + (++OBJ_SEQ); setObjects((os) => [...os, { id, name: "New schedule", utcMin: window.apLocalToUtc(9 * 60), jitter: 15, topic: "Writing craft", on: false, seed: false }]); pushToast({ kind: "success", title: "Schedule added", sub: "It stays paused until you switch it on" }); };
  const changePolicy = (patch) => setPolicy((p) => ({ ...p, ...patch }));

  return (
    <div className="app">
      <window.Sidebar active="autopilot" />
      <div className="main">
        <window.Topbar dark={!!t.dark} onToggleTheme={() => setTweak("dark", !t.dark)} on={master} />
        <div className="scroll">
          <div className="content">
            <div className="page-intro">
              <h1>Autopilot</h1>
              <p>Let Pennedly post and reply on a schedule — entirely opt-in. It's off by default, and you stay in control.</p>
            </div>

            {phase === "loading" ? (
              <window.SkeletonDash />
            ) : (
              <>
                <window.MasterCard on={master} onToggle={toggleMaster} />
                <window.Reassure on={master} />

                <div className="ap-config">
                  <div className="ap-section">
                    <div className="ap-sec-head">
                      <div><div className="ap-sec-title">Scheduled posts</div><div className="ap-sec-sub">Each schedule drafts a post in your voice and publishes it around the set time — shown in your local time ({window.apFmtOffset()}).</div></div>
                      {objs.length > 0 && <button className="btn btn--secondary btn--sm" onClick={addObj}><window.IcPlus size={15} /> Add</button>}
                    </div>
                    <div className="ap-sec-body">
                      {objs.length === 0 ? (
                        <window.EmptyObjects onAdd={addObj} />
                      ) : (
                        <div className="obj-list">
                          {objs.map((o) => <window.ObjectCard key={o.id} obj={o} onChange={changeObj} onRemove={removeObj} />)}
                        </div>
                      )}
                    </div>
                  </div>

                  <window.PolicyCard policy={policy} onChange={changePolicy} />

                  <div className="ap-section">
                    <div className="ap-sec-head">
                      <div><div className="ap-sec-title">Activity</div><div className="ap-sec-sub">Everything autopilot has done — read-only.</div></div>
                      {(posts.length > 0 || replies.length > 0) && (
                        <div className="act-tabs" role="tablist">
                          <button role="tab" aria-selected={actTab === "posts"} className={`act-tab ${actTab === "posts" ? "act-tab--active" : ""}`} onClick={() => setActTab("posts")}>Posts</button>
                          <button role="tab" aria-selected={actTab === "replies"} className={`act-tab ${actTab === "replies" ? "act-tab--active" : ""}`} onClick={() => setActTab("replies")}>Replies</button>
                        </div>
                      )}
                    </div>
                    <div className="ap-sec-body">
                      {posts.length === 0 && replies.length === 0 ? (
                        <window.EmptyActivity />
                      ) : (
                        <>
                          {counters.length > 0 && <window.Counters counters={counters} />}
                          <div className="act-list">
                            {actTab === "posts"
                              ? posts.map((p) => <window.AutoPostItem key={p.id} p={p} />)
                              : replies.map((r) => <window.AutoReplyItem key={r.id} r={r} />)}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {confirm && (
        <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirm(false); }}>
          <div className="dialog" role="dialog" aria-modal="true" aria-label="Turn on Autopilot">
            <div className="dialog-head">
              <span className="dialog-mark"><window.IcBolt size={18} /></span>
              <div>
                <div className="dialog-title">Turn on Autopilot?</div>
                <div className="dialog-sub">Pennedly will publish your enabled schedules and send replies under your policy — automatically. Every post still appears in your feed, and you can pause anytime.</div>
              </div>
            </div>
            <div className="dialog-actions">
              <button className="btn btn--ghost" onClick={() => setConfirm(false)}>Cancel</button>
              <button className="btn btn--primary" onClick={confirmOn}><window.IcBolt size={15} /> Turn on autopilot</button>
            </div>
          </div>
        </div>
      )}

      <window.Toasts toasts={toasts} onUndo={undoToast} />

      <window.TweaksPanel>
        <window.TweakSection label="Appearance" />
        <window.TweakToggle label="Dark mode" value={!!t.dark} onChange={(v) => setTweak("dark", v)} />
        <window.TweakSection label="Preview state" />
        <window.TweakRadio label="State" value={t.state} options={["Live", "Loading", "No objects", "No activity"]} onChange={(v) => setTweak("state", v)} />
      </window.TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<AutopilotApp />);
