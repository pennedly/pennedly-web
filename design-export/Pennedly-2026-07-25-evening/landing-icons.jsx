// landing-icons.jsx — extra line icons for the landing page.
// Same 24-grid, ~1.8px single-weight stroke as studio-icons.jsx.

const LnSvg = ({ size = 18, children, ...rest }) => (
  <svg
    width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true" {...rest}
  >
    {children}
  </svg>
);

const IcArrowRight = (p) => <LnSvg {...p}><path d="M5 12h14M13 6l6 6-6 6" /></LnSvg>;
const IcUsers      = (p) => <LnSvg {...p}><circle cx="9" cy="8" r="3.2" /><path d="M3.5 19a5.5 5.5 0 0 1 11 0" /><path d="M16 5.2a3.2 3.2 0 0 1 0 5.6M17.5 19a5.5 5.5 0 0 0-3-4.9" /></LnSvg>;
const IcMail       = (p) => <LnSvg {...p}><rect x="3" y="5.5" width="18" height="13" rx="2.5" /><path d="M4 7l8 6 8-6" /></LnSvg>;

Object.assign(window, { IcArrowRight, IcUsers, IcMail });
