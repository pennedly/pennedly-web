// voice-icons.jsx — a few extra line icons for the Voice screen.
// Same 24-grid, ~1.8px single-weight stroke, round caps as studio-icons.jsx.

const VcSvg = ({ size = 18, children, ...rest }) => (
  <svg
    width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true" {...rest}
  >
    {children}
  </svg>
);

// re-extract: two arrows looping (re-read the posts)
const IcRefresh = (p) => <VcSvg {...p}><path d="M20 7a8 8 0 0 0-14.3-2M4 5v4h4" /><path d="M4 17a8 8 0 0 0 14.3 2M20 19v-4h-4" /></VcSvg>;
// caution / conflict severity (triangle with a bang) — only used inside coloured dots sparingly
const IcAlert   = (p) => <VcSvg {...p}><path d="M12 4.5 21 19.5H3L12 4.5Z" /><path d="M12 10.5v4M12 17.4v.1" /></VcSvg>;
// quote mark for example posts
const IcQuote   = (p) => <VcSvg {...p}><path d="M9.5 7C7 7.6 5.5 9.7 5.5 12.4V17h4.7v-4.7H8.3c0-1.7 .7-2.9 2.2-3.5L9.5 7ZM18.5 7c-2.5 .6-4 2.7-4 5.4V17h4.7v-4.7h-2.4c0-1.7 .7-2.9 2.2-3.5L18.5 7Z" fill="currentColor" stroke="none" /></VcSvg>;
// voice "scan" / lint
const IcScan    = (p) => <VcSvg {...p}><path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" /><path d="M7.5 12h9" /></VcSvg>;
// all-clear shield with a check
const IcShield  = (p) => <VcSvg {...p}><path d="M12 3.5 19 6v5.5c0 4.3-2.9 7.4-7 9-4.1-1.6-7-4.7-7-9V6l7-2.5Z" /><path d="M8.8 11.8 11 14l4.2-4.4" /></VcSvg>;
// themes (overlapping tags)
const IcTags    = (p) => <VcSvg {...p}><path d="M4 10.5V5.5A1.5 1.5 0 0 1 5.5 4h5l8 8a1.5 1.5 0 0 1 0 2.1l-4.4 4.4a1.5 1.5 0 0 1-2.1 0l-8-8Z" /><circle cx="8" cy="8" r="1.2" fill="currentColor" stroke="none" /></VcSvg>;
// traits (a short ruled list)
const IcList    = (p) => <VcSvg {...p}><path d="M5 7.5l1.5 1.5L9 6M5 16.5l1.5 1.5L9 14M12.5 8h6.5M12.5 16h6.5" /></VcSvg>;
// drag handle
const IcGrip    = (p) => <VcSvg {...p}><circle cx="9" cy="6" r="1.1" fill="currentColor" stroke="none" /><circle cx="9" cy="12" r="1.1" fill="currentColor" stroke="none" /><circle cx="9" cy="18" r="1.1" fill="currentColor" stroke="none" /><circle cx="15" cy="6" r="1.1" fill="currentColor" stroke="none" /><circle cx="15" cy="12" r="1.1" fill="currentColor" stroke="none" /><circle cx="15" cy="18" r="1.1" fill="currentColor" stroke="none" /></VcSvg>;

Object.assign(window, { IcRefresh, IcAlert, IcQuote, IcScan, IcShield, IcTags, IcList, IcGrip });
