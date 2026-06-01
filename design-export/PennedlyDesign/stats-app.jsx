// stats-app.jsx — aggregate performance dashboard.

const { useState: useStS, useEffect: useStE } = React;

const STATS_TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "dark": false,
  "state": "Live"
}/*EDITMODE-END*/;

const pct = (cur, prev) => (prev ? ((cur - prev) / prev) * 100 : 0);

function StatsApp() {
  const [t, setTweak] = window.useTweaks(STATS_TWEAK_DEFAULTS);
  const [phase, setPhase] = useStS("loading");
  const [range, setRange] = useStS(8);

  useStE(() => {
    if (t.state === "Loading") { setPhase("loading"); return; }
    setPhase("loading");
    const id = setTimeout(() => setPhase("ready"), 850);
    return () => clearTimeout(id);
  }, [t.state, range]);
  useStE(() => { document.documentElement.classList.toggle("dark", !!t.dark); }, [t.dark]);

  const slice = window.WEEKS.slice(-range);
  const last = slice[slice.length - 1];
  const prev = slice[slice.length - 2] || last;

  const totalPosts = slice.reduce((a, w) => a + w.posts, 0);
  const totalViews = slice.reduce((a, w) => a + w.avgViews * w.posts, 0);
  const totalLikes = slice.reduce((a, w) => a + w.likes, 0);
  const totalComments = slice.reduce((a, w) => a + w.comments, 0);

  const cards = [
    { Icon: window.IcNib, label: "Posts", num: String(totalPosts), sub: `${(totalPosts / range).toFixed(1)} / week avg`, delta: pct(last.posts, prev.posts) },
    { Icon: window.IcEye, label: "Views", num: window.sfmt(totalViews), sub: `${window.sfmt(totalViews / totalPosts)} avg / post`, delta: pct(last.avgViews, prev.avgViews) },
    { Icon: window.IcHeart, label: "Likes", num: window.sfmt(totalLikes), sub: `${Math.round(totalLikes / totalPosts)} avg / post`, delta: pct(last.likes, prev.likes) },
    { Icon: window.IcBubble, label: "Comments", num: String(totalComments), sub: `${(totalComments / totalPosts).toFixed(1)} avg / post`, delta: pct(last.comments, prev.comments) },
  ];

  const isEmpty = t.state === "Empty";

  return (
    <div className="app">
      <window.Sidebar />
      <div className="main">
        <window.Topbar dark={!!t.dark} onToggleTheme={() => setTweak("dark", !t.dark)} />
        <div className="scroll">
          <div className="content content--wide">
            <div className="stats-head">
              <div className="page-intro">
                <h1>Stats</h1>
                <p>How your writing is performing in aggregate — the numbers that matter, over time.</p>
              </div>
              {!isEmpty && phase === "ready" && (
                <div className="range-seg" role="tablist" aria-label="Time range">
                  {[4, 8, 12].map((r) => (
                    <button key={r} role="tab" aria-selected={range === r}
                      className={`range-btn ${range === r ? "range-btn--active" : ""}`}
                      onClick={() => setRange(r)}>{r} weeks</button>
                  ))}
                </div>
              )}
            </div>

            {isEmpty ? (
              <window.EmptyState />
            ) : phase === "loading" ? (
              <window.SkeletonDash />
            ) : (
              <>
                <div className="stats-grid">
                  {cards.map((c) => <window.SummaryCard key={c.label} {...c} />)}
                </div>

                <div className="spanel">
                  <div className="spanel-head">
                    <div>
                      <div className="spanel-title">Average views per week</div>
                      <div className="spanel-cap">Avg views per post · last {range} weeks</div>
                    </div>
                    <div className="spanel-headline">
                      <div className="hl-num">{window.sfmt(last.avgViews)}</div>
                      <div className="hl-delta"><window.Delta pct={pct(last.avgViews, prev.avgViews)} /></div>
                    </div>
                  </div>
                  <window.ColumnChart data={slice} field="avgViews" fmtVal={window.sfmt} />
                </div>

                <div className="panel-row">
                  <div className="spanel">
                    <div className="spanel-head">
                      <div>
                        <div className="spanel-title">Posts per week</div>
                        <div className="spanel-cap">Cadence · last {range} weeks</div>
                      </div>
                      <div className="spanel-headline">
                        <div className="hl-num">{last.posts}</div>
                        <div className="hl-delta"><window.Delta pct={pct(last.posts, prev.posts)} /></div>
                      </div>
                    </div>
                    <window.ColumnChart data={slice} field="posts" fmtVal={(n) => `${n} posts`} />
                  </div>

                  <div className="spanel">
                    <div className="spanel-head">
                      <div>
                        <div className="spanel-title">Performance spread</div>
                        <div className="spanel-cap">{totalPosts} posts vs your baseline</div>
                      </div>
                    </div>
                    <window.DistributionBars tiers={window.TIERS} totalPosts={totalPosts} />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <window.TweaksPanel>
        <window.TweakSection label="Appearance" />
        <window.TweakToggle label="Dark mode" value={!!t.dark} onChange={(v) => setTweak("dark", v)} />
        <window.TweakSection label="Preview state" />
        <window.TweakRadio label="State" value={t.state} options={["Live", "Loading", "Empty"]} onChange={(v) => setTweak("state", v)} />
      </window.TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<StatsApp />);
