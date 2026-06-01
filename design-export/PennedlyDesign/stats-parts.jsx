// stats-parts.jsx — shell + chart components for the Stats screen.
// Reuses Studio shell classes (studio.css) + ds tokens. CSS-only charts.

function SMono({ text, size = 32, font = 12 }) {
  return <span className="mono" style={{ width: size, height: size, fontSize: font }}>{text}</span>;
}

function sfmt(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 10000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return Math.round(n).toLocaleString("en-US");
}

/* ------------------------------- Sidebar ------------------------------- */
function Sidebar() {
  const nav = [
    { id: "studio", label: "Studio", Icon: window.IcStudio, badge: 4 },
    { id: "feed", label: "My Feed", Icon: window.IcFeed },
    { id: "stats", label: "Stats", Icon: window.IcChart, active: true },
    { id: "replies", label: "Replies", Icon: window.IcReplies, badge: 3 },
    { id: "mentions", label: "Mentions", Icon: window.IcAt, badge: 3 },
    { id: "voice", label: "Voice", Icon: window.IcVoice },
    { id: "settings", label: "Settings", Icon: window.IcSettings },
  ];
  return (
    <aside className="sidebar">
      <div className="brand">
        <window.Logo size={34} radius={10} className="brand-mark" />
        <div>
          <div className="brand-name">Pennedly</div>
          <div className="brand-sub">Drafting partner</div>
        </div>
      </div>
      <nav className="nav">
        <div className="nav-cap">Workspace</div>
        {nav.map(({ id, label, Icon, active, badge }) => (
          <a key={id} className={`nav-item ${active ? "nav-item--active" : ""}`} tabIndex="0">
            <Icon size={16} />
            <span className="nav-label">{label}</span>
            {badge ? <span className="nav-badge">{badge}</span> : null}
          </a>
        ))}
      </nav>
      <div className="sidebar-foot">
        <button className="account">
          <SMono text={window.STATS_USER.initials} size={32} font={12} />
          <div className="who">
            <div className="nm">{window.STATS_USER.name}</div>
            <div className="hd">{window.STATS_USER.handle}</div>
          </div>
          <window.IcChevDown size={15} className="chev" />
        </button>
      </div>
    </aside>
  );
}

/* -------------------------------- Topbar ------------------------------- */
function Topbar({ dark, onToggleTheme }) {
  return (
    <header className="topbar">
      <span className="topbar-title">Stats</span>
      <span className="topbar-spacer" />
      <div className="topbar-actions">
        <button className="icon-btn" aria-label="Toggle theme" onClick={onToggleTheme}>
          {dark ? <window.IcSun size={17} /> : <window.IcMoon size={16} />}
        </button>
        <button className="icon-btn" aria-label="Settings"><window.IcSettings size={17} /></button>
      </div>
    </header>
  );
}

/* ------------------------------- Delta chip ---------------------------- */
function Delta({ pct }) {
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

/* ----------------------------- Column chart ---------------------------- */
function ColumnChart({ data, field, fmtVal }) {
  const max = Math.max(...data.map((d) => d[field])) || 1;
  return (
    <div className="colchart">
      {data.map((d, i) => (
        <div key={d.label} className={`colslot ${i === data.length - 1 ? "colslot--last" : ""}`}
          title={`${d.label}: ${fmtVal(d[field])}`}>
          <div className="colbar-wrap">
            <div className="colbar" style={{ height: `${Math.max(4, (d[field] / max) * 100)}%` }} />
          </div>
          <span className="collabel">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

/* -------------------------- Distribution bars -------------------------- */
function DistributionBars({ tiers, totalPosts }) {
  const counts = tiers.map((t) => Math.round(t.pct * totalPosts));
  // fix rounding so counts sum to totalPosts
  let diff = totalPosts - counts.reduce((a, b) => a + b, 0);
  if (diff !== 0) counts[2] += diff;
  const maxCount = Math.max(...counts) || 1;
  return (
    <div className="distlist">
      {tiers.map((t, i) => (
        <div className="distrow" key={t.key}>
          <div className="dist-top">
            <span className="dist-name">
              <span className={`dist-dot ${t.cls}`} />
              {t.name}<span className="dn-sub">· {t.sub}</span>
            </span>
            <span className="dist-val">{counts[i]} posts<span className="dv-pct">{Math.round((counts[i] / (totalPosts || 1)) * 100)}%</span></span>
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

Object.assign(window, { SMono, sfmt, Sidebar, Topbar, Delta, SummaryCard, ColumnChart, DistributionBars, EmptyState, SkeletonDash });
