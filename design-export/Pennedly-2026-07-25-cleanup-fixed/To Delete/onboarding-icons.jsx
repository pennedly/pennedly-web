// onboarding-icons.jsx — extra line icons for first-run onboarding.
// Same 24-grid, ~1.8px single-weight stroke as studio-icons.jsx.

const ObSvg = ({ size = 18, children, ...rest }) => (
  <svg
    width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true" {...rest}
  >
    {children}
  </svg>
);

const IcLock      = (p) => <ObSvg {...p}><rect x="4.5" y="10.5" width="15" height="9.5" rx="2.5" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /><circle cx="12" cy="15" r="1.1" fill="currentColor" stroke="none" /></ObSvg>;
const IcArrowRight= (p) => <ObSvg {...p}><path d="M5 12h14M13 6l6 6-6 6" /></ObSvg>;
const IcScan      = (p) => <ObSvg {...p}><path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" /><path d="M7.5 12h9" /></ObSvg>;
const IcPen       = (p) => <ObSvg {...p}><path d="M4 20h16" /><path d="M5 16h2L16 7a1.6 1.6 0 0 0-2.3-2.3L5 13.5V16Z" /></ObSvg>;

Object.assign(window, { IcLock, IcArrowRight, IcScan, IcPen });
