// settings-icons.jsx — extra line icons for the Settings screen.
// Same 24-grid, ~1.8px single-weight stroke as studio-icons.jsx.

const StSvg = ({ size = 18, children, ...rest }) => (
  <svg
    width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true" {...rest}
  >
    {children}
  </svg>
);

// nav icon for the Rules screen (sliders) — kept here so Settings is self-contained
const IcSliders = (p) => <StSvg {...p}><path d="M4 7h9M17 7h3M4 17h3M11 17h9" /><circle cx="15" cy="7" r="2" /><circle cx="9" cy="17" r="2" /></StSvg>;
// plan / billing
const IcCard   = (p) => <StSvg {...p}><rect x="3" y="5.5" width="18" height="13" rx="2.5" /><path d="M3 9.5h18M6.5 14.5h4" /></StSvg>;
// connect another account (link)
const IcLink   = (p) => <StSvg {...p}><path d="M10 14a3.5 3.5 0 0 0 5 0l3-3a3.5 3.5 0 0 0-5-5l-1.5 1.5" /><path d="M14 10a3.5 3.5 0 0 0-5 0l-3 3a3.5 3.5 0 0 0 5 5l1.5-1.5" /></StSvg>;
// disconnect (broken link)
const IcUnlink = (p) => <StSvg {...p}><path d="M9 15l-2 2a3.5 3.5 0 0 1-5-5l2-2M15 9l2-2a3.5 3.5 0 0 1 5 5l-2 2M8 4v2M4 8H2M20 16h2M16 20v-2" /></StSvg>;
// sign out
const IcLogout = (p) => <StSvg {...p}><path d="M15 5H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h9" /><path d="M11 12h9M17 8l4 4-4 4" /></StSvg>;
// preview / tester
const IcFlask  = (p) => <StSvg {...p}><path d="M9 3h6M10 3v6L5.5 17a2 2 0 0 0 1.8 3h9.4a2 2 0 0 0 1.8-3L14 9V3" /><path d="M8.2 14h7.6" /></StSvg>;

Object.assign(window, { IcSliders, IcCard, IcLink, IcUnlink, IcLogout, IcFlask });
