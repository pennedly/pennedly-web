// stats-parts.jsx — chart components for the Stats screen (CSS/SVG only, no lib).
// Sidebar/account/avatar come from the shared shell. No hardcoded hex.

function sfmt(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 10000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return Math.round(n).toLocaleString("en-US");
}

// localized bucket label from an ISO date + the period granularity (§3.10)
function fmtBucket(at, gran) {
  const d = new Date(at);
  if (gran === "hour") return d.toLocaleTimeString(undefined, { hour: "numeric" });
  if (gran === "day") return d.toLocaleDateString(undefined, { weekday: "short" });
  if (gran === "week") return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  if (gran === "month") return d.toLocaleDateString(undefined, { month: "short" });
  return d.toLocaleDateString();
}

/* -------------------------------- Topbar ------------------------------- */
function Topbar({ dark, onToggleTheme }) {
  return (
    <header className="topbar">
      <div className="topbar-inner topbar--wide">
        <span className="topbar-title">Stats</span>
        <span className="status-pill"><window.IcChart size={13} />Updated daily</span>
        <span className="topbar-spacer" />
        <div className="topbar-actions">
          <button className="icon-btn" aria-label="Toggle theme" onClick={onToggleTheme}>
            {dark ? <window.IcSun size={17} /> : <window.IcMoon size={16} />}
          </button>
          <button className="icon-btn" aria-label="Settings"><window.IcSettings size={17} /></button>
        </div>
      </div>
    </header>
  );
}

/* ------------------------------- Delta chip ---------------------------- */
function Delta({ pct }) {
  if (pct == null) return <span className="delta delta--flat">no prior period</span>;
  const r = Math.round(pct * 10) / 10;
  if (Math.abs(r) < 0.1) return <span className="delta delta--flat">no change</span>;
  const up = r > 0;
  const Icon = up ? window.IcArrowUp : window.IcArrowDown;
  return (
    <span className={`delta ${up ? "delta--up" : "delta--down"}`}>
      <Icon size={12} />{Math.abs(r)}%
    </span>
  );
}

/* ----------------------------- Summary card ---------------------------- */
function SummaryCard({ Icon, label, num, sub, delta }) {
  return (
    <div className="stat-card">
      <div className="sc-top">
        <span className="sc-ico"><Icon size={14} /></span>
        <span className="sc-label">{label}</span>
      </div>
      <div className="sc-num">{num}</div>
      <div className="sc-foot">
        <span className="sc-sub">{sub}</span>
        <Delta pct={delta} />
      </div>
    </div>
  );
}

/* ----------------------------- Column chart ----------------------------
   Hand-rolled (no chart lib): avg views per bucket, a dashed period-average
   line, bars colour-coded above/below that average, localized date labels. */
function ColumnChart({ buckets, gran, fmtVal }) {
  const vals = buckets.map((b) => b.v);
  const max = Math.max(...vals) || 1;
  const avg = vals.reduce((a, b) => a + b, 0) / (vals.length || 1);
  const avgPct = (avg / max) * 100;
  return (
    <div className="colchart">
      <div className="colplot">
        <div className="colavg" style={{ bottom: `${avgPct}%` }}>
          <span className="colavg-lbl">avg {fmtVal(avg)}</span>
        </div>
        {buckets.map((b, i) => {
          const above = b.v >= avg;
          return (
            <div key={i} className="colbar-col" title={`${fmtBucket(b.at, gran)}: ${fmtVal(b.v)}`}>
              <div className={`colbar ${above ? "colbar--above" : "colbar--below"}`} style={{ height: `${Math.max(3, (b.v / max) * 100)}%` }} />
            </div>
          );
        })}
      </div>
      <div className="collabels">
        {buckets.map((b, i) => <span key={i} className="collabel">{fmtBucket(b.at, gran)}</span>)}
      </div>
    </div>
  );
}

/* -------------------------- Distribution bars -------------------------- */
function DistributionBars({ meta, dist, totalPosts }) {
  const counts = meta.map((t) => Math.round((dist[t.key] || 0) * totalPosts));
  let diff = totalPosts - counts.reduce((a, b) => a + b, 0);
  if (diff !== 0) { const mi = counts.indexOf(Math.max(...counts)); counts[mi] += diff; }
  const maxCount = Math.max(...counts) || 1;
  return (
    <div className="distlist">
      {meta.map((t, i) => (
        <div className="distrow" key={t.key}>
          <div className="dist-top">
            <span className="dist-name">
              <span className={`dist-dot ${t.cls}`} />
              {t.name}<span className="dn-sub">· {t.sub}</span>
            </span>
            <span className="dist-val">{counts[i]} post{counts[i] === 1 ? "" : "s"}<span className="dv-pct">{Math.round((counts[i] / (totalPosts || 1)) * 100)}%</span></span>
          </div>
          <div className="dist-track">
            <div className={`dist-fill ${t.cls}`} style={{ width: `${(counts[i] / maxCount) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------ Empty state ---------------------------- */
function EmptyState() {
  return (
    <div className="stats-empty">
      <div className="se-mark"><window.IcChart size={26} /></div>
      <div className="se-title">Not enough data yet</div>
      <div className="se-sub">Stats need at least two weeks of activity to show meaningful trends. Keep publishing in the Studio and your performance will take shape here.</div>
      <div className="se-meta">
        <span className="sm"><b>1</b> week so far</span>
        <span className="sm"><b>3</b> posts published</span>
      </div>
    </div>
  );
}

/* ------------------------------- Skeleton ------------------------------ */
function SkeletonDash() {
  return (
    <>
      <div className="stats-grid">
        {Array.from({ length: 4 }).map((_, i) => (
          <div className="stat-card skeleton" key={i} aria-hidden="true">
            <div className="skel-line" style={{ width: 80, height: 12 }} />
            <div className="skel-line" style={{ width: 110, height: 28, marginTop: 14, borderRadius: 8 }} />
            <div className="skel-line" style={{ width: "100%", height: 10, marginTop: 12 }} />
          </div>
        ))}
      </div>
      <div className="spanel skeleton" aria-hidden="true">
        <div className="skel-line" style={{ width: 180, height: 16, marginBottom: 20 }} />
        <div className="skel-line" style={{ width: "100%", height: 132, borderRadius: 10 }} />
      </div>
      <div className="panel-row">
        {Array.from({ length: 2 }).map((_, i) => (
          <div className="spanel skeleton" key={i} aria-hidden="true">
            <div className="skel-line" style={{ width: 150, height: 16, marginBottom: 18 }} />
            <div className="skel-line" style={{ width: "100%", height: 110, borderRadius: 10 }} />
          </div>
        ))}
      </div>
    </>
  );
}

Object.assign(window, { sfmt, fmtBucket, Topbar, Delta, SummaryCard, ColumnChart, DistributionBars, EmptyState, SkeletonDash });
