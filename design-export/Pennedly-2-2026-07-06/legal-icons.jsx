// legal-icons.jsx — the one extra icon the legal template needs.
const LglSvg = ({ size = 18, children, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>{children}</svg>
);
const IcMail = (p) => <LglSvg {...p}><rect x="3" y="5.5" width="18" height="13" rx="2.5" /><path d="M4 7l8 6 8-6" /></LglSvg>;
Object.assign(window, { IcMail });
