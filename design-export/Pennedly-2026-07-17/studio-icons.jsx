// studio-icons.jsx — Pennedly Studio line-icon set.
// 24-grid, ~1.8px single-weight stroke, round caps & joins — the same calm
// pen-stroke as the brand mark. Plus the "Drafting Line" logo glyph (filled).

const Svg = ({ size = 18, children, stroke = true, ...rest }) => (
  <svg
    width={size} height={size} viewBox="0 0 24 24"
    fill={stroke ? "none" : "currentColor"}
    stroke={stroke ? "currentColor" : "none"}
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true" {...rest}
  >
    {children}
  </svg>
);

// nav / brand
const IcStudio   = (p) => <Svg {...p}><path d="M11.4 4H6.5A1.5 1.5 0 0 0 5 5.5v12A1.5 1.5 0 0 0 6.5 19h12a1.5 1.5 0 0 0 1.5-1.5v-4.9" /><path d="M17.9 3.6a1.7 1.7 0 0 1 2.5 2.5l-7.4 7.4-3.2.7.7-3.2Z" /></Svg>;  // compose — a pen writing on a draft card
const IcReplies  = (p) => <Svg {...p}><path d="M21 11.5a8 8 0 0 1-11.4 7.2L4 20l1.3-4.6A8 8 0 1 1 21 11.5Z" /></Svg>;
const IcVoice    = (p) => <Svg {...p}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></Svg>;
// one clean, optically-balanced 6-tooth cog — even teeth, calm round body,
// clear center hole; crisp at 16px (24-grid, 1.8 stroke, round caps/joins).
const IcSettings = (p) => <Svg {...p}><path d="M10.13 3.2 13.87 3.2 14.26 5.8 16.24 6.94 18.69 5.98 20.56 9.22 18.5 10.85 18.5 13.15 20.56 14.78 18.69 18.02 16.24 17.06 14.26 18.2 13.87 20.8 10.13 20.8 9.74 18.2 7.76 17.06 5.31 18.02 3.44 14.78 5.5 13.15 5.5 10.85 3.44 9.22 5.31 5.98 7.76 6.94 9.74 5.8Z" /><circle cx="12" cy="12" r="2.6" /></Svg>;

// actions
const IcNib     = (p) => <Svg {...p}><path d="M12 4c3 0 5 3 4.8 7-.2 3-2.2 6-4.8 8.5C9.4 17 7.4 14 7.2 11 7 7 9 4 12 4Z" /><circle cx="12" cy="10" r="1.4" /><path d="M12 12v6.5" /></Svg>;
const IcCheck   = (p) => <Svg {...p}><path d="M4.5 12.5 9.5 17.5 19.5 6.5" /></Svg>;
const IcX       = (p) => <Svg {...p}><path d="M6 6 18 18M18 6 6 18" /></Svg>;
const IcAlert   = (p) => <Svg {...p}><path d="M12 4 2.5 20.5h19L12 4Z" /><path d="M12 10v4.5" /><circle cx="12" cy="17.6" r="0.8" fill="currentColor" stroke="none" /></Svg>;
const IcPencil  = (p) => <Svg {...p}><path d="M4 20h4L18.5 9.5a2 2 0 0 0-2.8-2.8L5 17.2V20Z" /><path d="M14.5 8.5l1.8 1.8" /></Svg>;
const IcTweak   = (p) => <Svg {...p}><path d="M4 5v5h5" /><path d="M4 10a8 8 0 1 1 1 7" /></Svg>;
const IcSend    = (p) => <Svg {...p}><path d="M5 12h13M12 5l7 7-7 7" /></Svg>;
const IcExternal= (p) => <Svg {...p}><path d="M14 5h5v5M19 5l-8 8M11 6H6.5A1.5 1.5 0 0 0 5 7.5v10A1.5 1.5 0 0 0 6.5 19h10A1.5 1.5 0 0 0 18 17.5V13" /></Svg>;
const IcUndo    = (p) => <Svg {...p}><path d="M9 14 4 9l5-5" /><path d="M4 9h11a5 5 0 0 1 0 10h-4" /></Svg>;
const IcReply   = (p) => <Svg {...p}><path d="M9 7 4 12l5 5M4 12h9a6 6 0 0 1 6 6v1" /></Svg>;
const IcChevDown= (p) => <Svg {...p}><path d="M5 9l7 7 7-7" /></Svg>;
const IcMore    = (p) => <Svg {...p}><circle cx="6" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="18" cy="12" r="1.3" fill="currentColor" stroke="none"/></Svg>;
const IcSun     = (p) => <Svg {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" /></Svg>;
const IcMoon    = (p) => <Svg {...p}><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" /></Svg>;
const IcSparkle = (p) => <Svg {...p}><path d="M12 4l1.6 4.8L18.5 10l-4.9 1.2L12 16l-1.6-4.8L5.5 10l4.9-1.2L12 4Z" /></Svg>;
const IcHeart   = (p) => <Svg {...p}><path d="M12 19.5C5 15 3.5 11 3.5 8.5A4 4 0 0 1 12 6.5 4 4 0 0 1 20.5 8.5C20.5 11 19 15 12 19.5Z" /></Svg>;
const IcBubble  = (p) => <Svg {...p}><path d="M5 5h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9l-4 3.5V6a1 1 0 0 1 1-1Z" /></Svg>;
const IcRepost  = (p) => <Svg {...p}><path d="M5 8h10l-2.5-2.5M19 16H9l2.5 2.5" /></Svg>;
const IcEye     = (p) => <Svg {...p}><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="2.6" /></Svg>;
const IcFeed    = (p) => <Svg {...p}><path d="M3 14l4-5 4 4 3-6 3 5h4" /></Svg>;
const IcChart   = (p) => <Svg {...p}><path d="M4 19V5M4 19h16" /><path d="M8 16l3.5-4 3 2.5L19 8" /></Svg>;
const IcTrash   = (p) => <Svg {...p}><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" /></Svg>;
const IcArrowUp = (p) => <Svg {...p}><path d="M12 19V6M6 11l6-6 6 6" /></Svg>;
const IcArrowDown = (p) => <Svg {...p}><path d="M12 5v13M6 13l6 6 6-6" /></Svg>;
const IcArrowLeft = (p) => <Svg {...p}><path d="M19 12H5M11 6l-6 6 6 6" /></Svg>;
const IcAudit    = (p) => <Svg {...p}><path d="M8 4h8a1 1 0 0 1 1 1v1h1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h1V5a1 1 0 0 1 1-1Z" /><path d="M8.5 13.5l2.2 2.2 4.3-4.6" /></Svg>;
const IcStudy    = (p) => <Svg {...p}><circle cx="11" cy="11" r="7" /><path d="M20.5 20.5l-4.4-4.4" /><path d="M11 8.2l.9 1.9 1.9.9-1.9.9-.9 1.9-.9-1.9-1.9-.9 1.9-.9Z" /></Svg>;
const IcBolt     = (p) => <Svg {...p}><path d="M13 3 5 13h6l-1 8 8-10h-6l1-8Z" /></Svg>;
const IcPlus     = (p) => <Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>;
const IcClock   = (p) => <Svg {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></Svg>;
// repeat / recurring loop — "Scenarios" nav mark (recurring & conditional content)
const IcRepeat   = (p) => <Svg {...p}><path d="M17 2.5 20.5 6 17 9.5" /><path d="M3.5 11V9a3 3 0 0 1 3-3h14" /><path d="M7 21.5 3.5 18 7 14.5" /><path d="M20.5 13v2a3 3 0 0 1-3 3h-14" /></Svg>;

const IcSkip    = (p) => <Svg {...p}><path d="M6 5v14M18 5v14M9 12h7M9 12l3-3M9 12l3 3" /></Svg>;
const IcGlobe   = (p) => <Svg {...p}><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.5 2.3 2.5 14.7 0 17M12 3.5c-2.5 2.3-2.5 14.7 0 17" /></Svg>;
const IcAt       = (p) => <Svg {...p}><circle cx="12" cy="12" r="3.6" /><path d="M15.6 8.6v4.6a2.4 2.4 0 0 0 4.8 0v-1.2a8.4 8.4 0 1 0-3.2 6.6" /></Svg>;
const IcStar     = (p) => <Svg {...p}><path d="M12 4.2l2.4 4.86 5.36.78-3.88 3.78.92 5.34L12 16.18 7.2 18.74l.92-5.34L4.24 9.62l5.36-.78Z" /></Svg>;
const IcArchive  = (p) => <Svg {...p}><path d="M4 8.5h16V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8.5Z" /><path d="M3 4.5h18v4H3zM9.5 12.5h5" /></Svg>;
// compass — "Explore patterns" nav mark (shared so every screen's sidebar can use it)
const IcCompass  = (p) => <Svg {...p}><circle cx="12" cy="12" r="8.5" /><path d="M15.2 8.8 13.4 13.4 8.8 15.2 10.6 10.6Z" /></Svg>;
// advisor — "Advisor" nav mark: a speech bubble holding a rising trend line (AI growth-advisor chat)
const IcAdvisor  = (p) => <Svg {...p}><path d="M4 16V7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H9l-4 4v-4Z" /><path d="M8 13l2.6-2.6 1.8 1.8L16 9" /><path d="M13.4 9H16v2.6" /></Svg>;
// overview — "All accounts" rollup mark: a 2×2 grid of cards (portfolio of accounts)
const IcOverview = (p) => <Svg {...p}><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></Svg>;
// log out — door + arrow, for the sidebar account menu
const IcLogout   = (p) => <Svg {...p}><path d="M14 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2" /><path d="M10 12h10M17 9l3 3-3 3" /></Svg>;

// "Drafting Line" logo — filled glyph in a rounded paper tile (matches DS brand mark)
const Logo = ({ size = 34, radius = 10, className }) => (
  <svg width={size} height={size} viewBox="0 0 512 512" className={className} aria-label="Pennedly" style={{ display: "block", borderRadius: radius }}>
    <rect width="512" height="512" rx="115" fill="var(--color-text)" />
    <g fill="var(--color-bg)">
      <path d="M182 348 C248 366 322 352 376 312 C326 330 252 340 188 326 C176 324 174 344 182 348 Z" />
      <g transform="rotate(42 256 256)">
        <path d="M236 150 Q236 128 256 128 Q276 128 276 150 L276 300 L256 360 L236 300 Z" />
        <rect x="236" y="206" width="40" height="7" />
      </g>
    </g>
  </svg>
);

Object.assign(window, {
  IcStudio, IcReplies, IcVoice, IcSettings,
  IcNib, IcCheck, IcX, IcAlert, IcPencil, IcTweak, IcSend, IcExternal, IcUndo,
  IcReply, IcChevDown, IcMore, IcSun, IcMoon, IcSparkle,
  IcHeart, IcBubble, IcRepost, Logo,
  IcEye, IcFeed, IcChart, IcTrash, IcArrowUp, IcClock, IcGlobe, IcSkip,
  IcAt, IcStar, IcArchive, IcArrowDown, IcArrowLeft, IcAudit, IcStudy, IcBolt, IcPlus,
  IcCompass, IcLogout, IcRepeat, IcAdvisor, IcOverview,
});
