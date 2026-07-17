// explore-icons.jsx — three glyphs specific to the Explore screen.
// Same feel as studio-icons: 24-grid, 1.8 single-weight stroke, round caps/joins,
// fill="none". (Svg in studio-icons.jsx isn't exported, so we re-declare a local one.)

const ESvg = ({ size = 18, children, ...rest }) => (
  <svg
    width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true" {...rest}
  >
    {children}
  </svg>
);

// compass lives in studio-icons.jsx now (shared nav mark). These two stay here.
// quotation mark — the calm "paste the text" notice + the "why it works" line
const IcQuote   = (p) => <ESvg {...p}><path d="M9.5 7C7 7.8 5.5 10 5.5 12.7V17h4.5v-4.3H8.2C8.2 10.5 9.2 9.3 11 8.7Zm9 0c-2.5.8-4 3-4 5.7V17h4.5v-4.3h-1.8c0-2.2 1-3.4 2.8-4Z" /></ESvg>;
// link — the inline caution when a pasted block looks like a URL
const IcLink    = (p) => <ESvg {...p}><path d="M9.5 14.5 14.5 9.5" /><path d="M11 7.5 12.4 6a3.6 3.6 0 0 1 5.1 5.1L16 12.6" /><path d="M13 16.5 11.6 18a3.6 3.6 0 0 1-5.1-5.1L8 11.4" /></ESvg>;

Object.assign(window, { IcQuote, IcLink });
