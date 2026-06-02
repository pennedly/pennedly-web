// mentions-app.jsx — read-only Mentions monitoring screen.

/* ── DEV HANDOFF · Mentions ─────────────────────────────────────────
 * Route / shell:   /app/mentions  (full app shell, sidebar = yes; active="mentions").
 *                  Tester-gated nav item.
 * Purpose:         A calm, READ-ONLY feed of posts elsewhere on Threads that
 *                  @-mention the account — newest first. No actions, just monitor.
 * Content width:   wide (--content-wide, 960); topbar .topbar-inner.topbar--wide.
 * Topbar:          title="Mentions"; .status-pill "Updated hourly" (the backend
 *                  refreshes mentions about hourly); actions = theme, settings.
 * Sections (top→bottom): page intro (notes the hourly refresh) · mention list.
 * States:          loading (skeleton cards) · live · empty (no mentions — copy
 *                  notes the hourly check) · error (banner + retry). Driven by the
 *                  `state` tweak; real app: loading on fetch, error on failure.
 * Data shown:      per row — author avatar + name + @handle + local date·time,
 *                  the mention text (the @handles highlighted), a Translate
 *                  affordance (foreign-language mentions → the viewer's language),
 *                  and a link to open the post on Threads.
 * Interactions:    Translate toggles original ↔ translation inline. Open in
 *                  Threads (row link + footer button) → opens the source post.
 *                  Nothing here mutates state — it's read-only.
 * Localize:        end-user copy = intro, empty/error copy, translate labels,
 *                  "Open in Threads", topbar pill. Mention bodies + their
 *                  translations are SAMPLE content (real text + translations from
 *                  the API / translation service).
 * Backend truth:   read-only — the Threads API returns mention posts; Pennedly
 *                  doesn't reply/save/archive them here. Refreshed ~hourly.
 *                  Timestamps render in the viewer's local timezone.
 * Changed in rework: stripped the invented triage (saved/archived/seen tabs +
 *                  mark-all-seen + save/archive actions + engagement counts) down
 *                  to a true read-only list; adopted shared shell + real avatars;
 *                  wide + aligned topbar; .status-pill; added error state (shared
 *                  ErrorBanner); local date+time (fmtDateTime); per-row translate.
 * ─────────────────────────────────────────────────────────────────── */

const { useState: useMS, useEffect: useME } = React;

const MENT_TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "dark": false,
  "state": "Live"
}/*EDITMODE-END*/;

function MentionsApp() {
  const [t, setTweak] = window.useTweaks(MENT_TWEAK_DEFAULTS);
  const [phase, setPhase] = useMS("loading");

  useME(() => {
    if (t.state === "Loading") { setPhase("loading"); return; }
    setPhase("loading");
    const id = setTimeout(() => setPhase("ready"), 850);
    return () => clearTimeout(id);
  }, [t.state]);
  useME(() => { document.documentElement.classList.toggle("dark", !!t.dark); }, [t.dark]);

  const errored = t.state === "Error";
  const live = t.state === "Empty"
    ? []
    : [...window.MENTIONS].sort((a, b) => new Date(b.at) - new Date(a.at));

  return (
    <div className="app">
      <window.Sidebar active="mentions" />
      <div className="main">
        <window.Topbar dark={!!t.dark} onToggleTheme={() => setTweak("dark", !t.dark)} />
        <div className="scroll">
          <div className="content content--wide">
            <div className="page-intro">
              <h1>Mentions</h1>
              <p>Posts across Threads that @-mention you — a calm place to keep an eye on the conversation. Pennedly checks for new ones about once an hour.</p>
            </div>

            {errored ? (
              <window.ErrorBanner title="Couldn’t load your mentions" onRetry={() => setTweak("state", "Live")} />
            ) : phase === "loading" ? (
              <div className="feed">{Array.from({ length: 5 }).map((_, i) => <window.SkeletonCard key={"sk" + i} />)}</div>
            ) : live.length === 0 ? (
              <window.EmptyState />
            ) : (
              <div className="feed">
                {live.map((m) => <window.MentionCard key={m.id} m={m} />)}
              </div>
            )}
          </div>
        </div>
      </div>

      <window.TweaksPanel>
        <window.TweakSection label="Appearance" />
        <window.TweakToggle label="Dark mode" value={!!t.dark} onChange={(v) => setTweak("dark", v)} />
        <window.TweakSection label="Preview state" />
        <window.TweakRadio label="State" value={t.state} options={["Live", "Loading", "Empty", "Error"]} onChange={(v) => setTweak("state", v)} />
      </window.TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<MentionsApp />);
