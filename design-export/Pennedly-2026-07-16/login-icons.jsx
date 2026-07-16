// login-icons.jsx — extra line icons for the sign-in screen.
// Same 24-grid, ~1.8px single-weight stroke as studio-icons.jsx.

const LgSvg = ({ size = 18, children, ...rest }) => (
  <svg
    width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true" {...rest}
  >
    {children}
  </svg>
);

const IcMail      = (p) => <LgSvg {...p}><rect x="3" y="5.5" width="18" height="13" rx="2.5" /><path d="M4 7l8 6 8-6" /></LgSvg>;
const IcArrowRight= (p) => <LgSvg {...p}><path d="M5 12h14M13 6l6 6-6 6" /></LgSvg>;
const IcLock      = (p) => <LgSvg {...p}><rect x="4.5" y="10.5" width="15" height="9.5" rx="2.5" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /><circle cx="12" cy="15" r="1.1" fill="currentColor" stroke="none" /></LgSvg>;
const IcAlert     = (p) => <LgSvg {...p}><path d="M12 4.5 21 19.5H3L12 4.5Z" /><path d="M12 10.5v4M12 17.4v.1" /></LgSvg>;
const IcWrench    = (p) => <LgSvg {...p}><path d="M15.5 7.5a4 4 0 0 1-5.2 4.7L5 17.5 6.5 19l5.3-5.3a4 4 0 0 0 4.7-5.2l-2.3 2.3-2-2 2.3-2.3a4 4 0 0 0-3.3.5" /></LgSvg>;

// A neutral, monochrome "G" tile for the Google button (avoids reproducing the
// trademarked multi-colour mark while keeping the affordance clear).
const GoogleMark = ({ size = 18 }) => (
  <span style={{
    width: size + 4, height: size + 4, flex: "0 0 auto", display: "grid", placeItems: "center",
    borderRadius: 6, background: "var(--color-surface-2)", border: "1px solid var(--color-border)",
    fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: size - 4, lineHeight: 1, color: "var(--color-text)",
  }}>G</span>
);

Object.assign(window, { IcMail, IcArrowRight, IcLock, IcAlert, IcWrench, GoogleMark });
