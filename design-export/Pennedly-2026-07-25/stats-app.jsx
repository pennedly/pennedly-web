// stats-app.jsx — aggregate performance dashboard (per backend period).

/* ── DEV HANDOFF · Stats ────────────────────────────────────────────
 * Route / shell:   /app/stats  (full app shell, sidebar = yes; active="stats").
 * Purpose:         How the account is performing in aggregate over a chosen
 *                  period — summary metrics, viral-tier spread, and a trend chart.
 * Content width:   wide (--content-wide, 960); topbar .topbar-inner.topbar--wide.
 * Topbar:          title="Stats"; .status-pill "Updated daily"; theme + settings.
 * Sections (top→bottom):
 *   - heading + PERIOD SELECTOR (today / yesterday / 7 days / month / 3 months /
 *     all time — these MATCH the backend enum exactly).
 *   - summary cards: Posts, Views, Likes, Comments (total + avg/post) each with a
 *     "vs previous period" delta.
 *   - trend chart: avg views per bucket (hand-rolled CSS, no chart lib) with
 *     localized labels, a dashed period-average line, bars above/below that line.
 *   - viral-tier distribution (Viral / Good / Average / Weak share of posts).
 * States:          loading (skeleton dashboard) · live · empty (not enough data).
 *                  Driven by the `state` tweak; real app: loading on fetch.
 * Data shown:      per period — posts/views/likes/comments totals + previous-period
 *                  totals for deltas (null for All time → "no prior period"),
 *                  trend buckets (avg views, ISO-dated → labels localize), tier %.
 * Interactions:    period selector swaps all metrics + chart (re-fetch in the real
 *                  app; here a brief skeleton). Bars/cards are read-only (titles
 *                  on hover). No mutations.
 * Localize:        end-user copy = heading, period labels, card labels/subs, delta
 *                  text, chart "avg" label + localized bucket labels, tier names/
 *                  subs, empty copy. Numbers are SAMPLE content (real from insights).
 * Backend truth:   period options are EXACTLY the backend's (no invented custom
 *                  ranges). Deltas compare to the immediately-previous same-length
 *                  period; All time has none. Buckets/granularity per period come
 *                  from the backend (hour/day/week/month). Insights update ~daily.
 * Changed in rework: replaced the ad-hoc "4/8/12 weeks" selector with the real
 *                  backend periods; adopted shared shell; wide + aligned topbar;
 *                  .status-pill; renamed tiers to Viral/Good/Average/Weak; the
 *                  trend chart now has a dashed avg line + above/below bar colours
 *                  + localized labels; deltas are vs the previous period (null-safe).
 * ─────────────────────────────────────────────────────────────────── */

const { useState: useStS, useEffect: useStE } = React;

const STATS_TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "dark": false,
  "state": "Live",
  "period": "7d"
}/*EDITMODE-END*/;

const pct = (cur, prev) => (prev ? ((cur - prev) / prev) * 100 : 0);

function StatsApp() {
  const [t, setTweak] = window.useTweaks(STATS_TWEAK_DEFAULTS);
  const [phase, setPhase] = useStS("loading");
  const [period, setPeriod] = useStS(t.period || "7d");

  useStE(() => {
    if (t.state === "Loading") { setPhase("loading"); return; }
    setPhase("loading");
    const id = setTimeout(() => setPhase("ready"), 700);
    return () => clearTimeout(id);
  }, [t.state, period]);
  useStE(() => { document.documentElement.classList.toggle("dark", !!t.dark); }, [t.dark]);
  useStE(() => { if (t.period && t.period !== period) setPeriod(t.period); }, [t.period]);

  const meta = window.PERIODS.find((p) => p.key === period) || window.PERIODS[2];
  const s = window.STATS[period];
  const prev = s.prev; // may be null (all time)
  const d = (cur, p) => (p == null ? null : pct(cur, p));

  const cards = s ? [
    { Icon: window.IcNib, label: "Posts", num: String(s.posts), sub: `in ${meta.label.toLowerCase()}`, delta: d(s.posts, prev && prev.posts) },
    { Icon: window.IcEye, label: "Views", num: window.sfmt(s.views), sub: `${window.sfmt(s.views / s.posts)} avg / post`, delta: d(s.views, prev && prev.views) },
    { Icon: window.IcHeart, label: "Likes", num: window.sfmt(s.likes), sub: `${Math.round(s.likes / s.posts)} avg / post`, delta: d(s.likes, prev && prev.likes) },
    { Icon: window.IcBubble, label: "Comments", num: String(s.comments), sub: `${(s.comments / s.posts).toFixed(1)} avg / post`, delta: d(s.comments, prev && prev.comments) },
  ] : [];

  const isEmpty = t.state === "Empty";
  const avgViewsPerPost = s ? s.views / s.posts : 0;

  function choosePeriod(k) { setPeriod(k); setTweak("period", k); }

  return (
    <div className="app">
      <window.Sidebar active="stats" />
      <div className="main">
        <window.Topbar dark={!!t.dark} onToggleTheme={() => setTweak("dark", !t.dark)} />
        <div className="scroll">
          <div className="content content--wide">
            <div className="stats-head">
              <div className="page-intro">
                <h1>Stats</h1>
                <p>How your writing is performing in aggregate — the numbers that matter, over time.</p>
              </div>
              {!isEmpty && (
                <div className="range-seg" role="tablist" aria-label="Time period">
                  {window.PERIODS.map((p) => (
                    <button key={p.key} role="tab" aria-selected={period === p.key}
                      className={`range-btn ${period === p.key ? "range-btn--active" : ""}`}
                      onClick={() => choosePeriod(p.key)}>{p.label}</button>
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
                      <div className="spanel-title">Average views per post</div>
                      <div className="spanel-cap">Per {meta.gran} · {meta.label.toLowerCase()}</div>
                    </div>
                    <div className="spanel-headline">
                      <div className="hl-num">{window.sfmt(avgViewsPerPost)}</div>
                      <div className="hl-delta"><window.Delta pct={d(s.views, prev && prev.views)} /></div>
                    </div>
                  </div>
                  <window.ColumnChart buckets={s.buckets} gran={meta.gran} fmtVal={window.sfmt} />
                </div>

                <div className="spanel">
                  <div className="spanel-head">
                    <div>
                      <div className="spanel-title">Performance spread</div>
                      <div className="spanel-cap">{s.posts} posts vs your baseline · {meta.label.toLowerCase()}</div>
                    </div>
                  </div>
                  <window.DistributionBars meta={window.TIER_META} dist={s.dist} totalPosts={s.posts} />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <window.TweaksPanel>
        <window.TweakSection label="Appearance" />
        <window.TweakToggle label="Dark mode" value={!!t.dark} onChange={(v) => setTweak("dark", v)} />
        <window.TweakSection label="Data" />
        <window.TweakSelect label="Period" value={period} options={window.PERIODS.map((p) => ({ value: p.key, label: p.label }))} onChange={choosePeriod} />
        <window.TweakSection label="Preview state" />
        <window.TweakRadio label="State" value={t.state} options={["Live", "Loading", "Empty"]} onChange={(v) => setTweak("state", v)} />
      </window.TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<StatsApp />);
