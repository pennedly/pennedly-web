// stylerules-icons.jsx — extra line icons for the Style & reply rules screen.
// Same 24-grid, ~1.8px single-weight stroke as studio-icons.jsx.

const SrSvg = ({ size = 18, children, ...rest }) => (
  <svg
    width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true" {...rest}
  >
    {children}
  </svg>
);

// nav + the "controls" feel: sliders with knobs
const IcSliders = (p) => <SrSvg {...p}><path d="M4 7h9M17 7h3M4 17h3M11 17h9" /><circle cx="15" cy="7" r="2" /><circle cx="9" cy="17" r="2" /></SrSvg>;
// built-in anti-AI section: a small shield/sweep — use a filter funnel
const IcFilter  = (p) => <SrSvg {...p}><path d="M4 5h16l-6 7v5l-4 2v-7L4 5Z" /></SrSvg>;
// freeform section: a pen on a line
const IcPenLine = (p) => <SrSvg {...p}><path d="M4 20h16" /><path d="M5 16h2L16 7a1.6 1.6 0 0 0-2.3-2.3L5 13.5V16Z" /></SrSvg>;
// search (filter rules)
const IcSearch  = (p) => <SrSvg {...p}><circle cx="11" cy="11" r="7" /><path d="M20.5 20.5l-4.4-4.4" /></SrSvg>;

Object.assign(window, { IcSliders, IcFilter, IcPenLine, IcSearch });
