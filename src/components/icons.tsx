// Pennedly line-icon set — ported from design-export/PennedlyDesign/studio-icons.jsx.
// 24-grid, ~1.8px single-weight stroke, round caps & joins — the same calm
// pen-stroke as the brand mark (per the design system's iconography rule).
// Every icon draws on `currentColor`, so color follows the surrounding text.
//
// Add more icons here as screens need them (login/settings have a few extras in
// their *-icons.jsx — port on demand, don't bulk-add speculatively).

import type { ReactNode, SVGProps } from "react";

export type IconProps = { size?: number } & Omit<SVGProps<SVGSVGElement>, "size">;

// `filled` flips an icon from stroked outline (default) to a solid fill glyph.
function Svg({
  size = 18,
  filled = false,
  children,
  ...rest
}: IconProps & { filled?: boolean; children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke={filled ? "none" : "currentColor"}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

/* nav / brand */
export const IcStudio = (p: IconProps) => <Svg {...p}><path d="M4 19.5 19 4.5M14 5h5v5" /></Svg>;
export const IcReplies = (p: IconProps) => <Svg {...p}><path d="M21 11.5a8 8 0 0 1-11.4 7.2L4 20l1.3-4.6A8 8 0 1 1 21 11.5Z" /></Svg>;
export const IcVoice = (p: IconProps) => <Svg {...p}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></Svg>;
// Redrawn (design rework §7): a clean optically-balanced cog — single polygon
// outline + center hole — crisp at 16–18px, replacing the busy 12-tooth gear.
export const IcSettings = (p: IconProps) => <Svg {...p}><path d="M10.13 3.2 13.87 3.2 14.26 5.8 16.24 6.94 18.69 5.98 20.56 9.22 18.5 10.85 18.5 13.15 20.56 14.78 18.69 18.02 16.24 17.06 14.26 18.2 13.87 20.8 10.13 20.8 9.74 18.2 7.76 17.06 5.31 18.02 3.44 14.78 5.5 13.15 5.5 10.85 3.44 9.22 5.31 5.98 7.76 6.94 9.74 5.8Z" /><circle cx="12" cy="12" r="2.6" /></Svg>;

/* actions */
export const IcNib = (p: IconProps) => <Svg {...p}><path d="M12 4c3 0 5 3 4.8 7-.2 3-2.2 6-4.8 8.5C9.4 17 7.4 14 7.2 11 7 7 9 4 12 4Z" /><circle cx="12" cy="10" r="1.4" /><path d="M12 12v6.5" /></Svg>;
export const IcCheck = (p: IconProps) => <Svg {...p}><path d="M4.5 12.5 9.5 17.5 19.5 6.5" /></Svg>;
export const IcX = (p: IconProps) => <Svg {...p}><path d="M6 6 18 18M18 6 6 18" /></Svg>;
export const IcPencil = (p: IconProps) => <Svg {...p}><path d="M4 20h4L18.5 9.5a2 2 0 0 0-2.8-2.8L5 17.2V20Z" /><path d="M14.5 8.5l1.8 1.8" /></Svg>;

/* voice — ported from voice-icons.jsx */
export const IcRefresh = (p: IconProps) => <Svg {...p}><path d="M20 7a8 8 0 0 0-14.3-2M4 5v4h4" /><path d="M4 17a8 8 0 0 0 14.3 2M20 19v-4h-4" /></Svg>;
/* single clockwise circular arrow — the "retry / reload" glyph. */
export const IcReload = (p: IconProps) => <Svg {...p}><path d="M21 12a9 9 0 1 1-2.64-6.36" /><path d="M21 3v5h-5" /></Svg>;
export const IcScan = (p: IconProps) => <Svg {...p}><path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" /><path d="M7.5 12h9" /></Svg>;
export const IcShield = (p: IconProps) => <Svg {...p}><path d="M12 3.5 19 6v5.5c0 4.3-2.9 7.4-7 9-4.1-1.6-7-4.7-7-9V6l7-2.5Z" /><path d="M8.8 11.8 11 14l4.2-4.4" /></Svg>;
export const IcAlert = (p: IconProps) => <Svg {...p}><path d="M12 4.5 21 19.5H3L12 4.5Z" /><path d="M12 10.5v4M12 17.4v.1" /></Svg>;
export const IcTags = (p: IconProps) => <Svg {...p}><path d="M4 10.5V5.5A1.5 1.5 0 0 1 5.5 4h5l8 8a1.5 1.5 0 0 1 0 2.1l-4.4 4.4a1.5 1.5 0 0 1-2.1 0l-8-8Z" /><circle cx="8" cy="8" r="1.2" fill="currentColor" stroke="none" /></Svg>;
export const IcList = (p: IconProps) => <Svg {...p}><path d="M5 7.5l1.5 1.5L9 6M5 16.5l1.5 1.5L9 14M12.5 8h6.5M12.5 16h6.5" /></Svg>;
export const IcQuote = (p: IconProps) => <Svg {...p}><path d="M9.5 7C7 7.6 5.5 9.7 5.5 12.4V17h4.7v-4.7H8.3c0-1.7 .7-2.9 2.2-3.5L9.5 7ZM18.5 7c-2.5 .6-4 2.7-4 5.4V17h4.7v-4.7h-2.4c0-1.7 .7-2.9 2.2-3.5L18.5 7Z" fill="currentColor" stroke="none" /></Svg>;

/* style rules — ported from stylerules-icons.jsx */
export const IcSliders = (p: IconProps) => <Svg {...p}><path d="M4 7h9M17 7h3M4 17h3M11 17h9" /><circle cx="15" cy="7" r="2" /><circle cx="9" cy="17" r="2" /></Svg>;
export const IcFilter = (p: IconProps) => <Svg {...p}><path d="M4 5h16l-6 7v5l-4 2v-7L4 5Z" /></Svg>;
export const IcPenLine = (p: IconProps) => <Svg {...p}><path d="M4 20h16" /><path d="M5 16h2L16 7a1.6 1.6 0 0 0-2.3-2.3L5 13.5V16Z" /></Svg>;

/* settings — ported from settings-icons.jsx */
export const IcUnlink = (p: IconProps) => <Svg {...p}><path d="M9 15l-2 2a3.5 3.5 0 0 1-5-5l2-2M15 9l2-2a3.5 3.5 0 0 1 5 5l-2 2M8 4v2M4 8H2M20 16h2M16 20v-2" /></Svg>;
export const IcLogout = (p: IconProps) => <Svg {...p}><path d="M15 5H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h9" /><path d="M11 12h9M17 8l4 4-4 4" /></Svg>;
export const IcFlask = (p: IconProps) => <Svg {...p}><path d="M9 3h6M10 3v6L5.5 17a2 2 0 0 0 1.8 3h9.4a2 2 0 0 0 1.8-3L14 9V3" /><path d="M8.2 14h7.6" /></Svg>;

/* onboarding — ported from onboarding-icons.jsx */
export const IcLock = (p: IconProps) => <Svg {...p}><rect x="4.5" y="10.5" width="15" height="9.5" rx="2.5" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /><circle cx="12" cy="15" r="1.1" fill="currentColor" stroke="none" /></Svg>;
export const IcArrowRight = (p: IconProps) => <Svg {...p}><path d="M5 12h14M13 6l6 6-6 6" /></Svg>;
export const IcMail = (p: IconProps) => <Svg {...p}><rect x="3" y="5.5" width="18" height="13" rx="2.5" /><path d="M4 7l8 6 8-6" /></Svg>;
export const IcUsers = (p: IconProps) => <Svg {...p}><circle cx="9" cy="8" r="3.2" /><path d="M3.5 19a5.5 5.5 0 0 1 11 0" /><path d="M16 5.2a3.2 3.2 0 0 1 0 5.6M17.5 19a5.5 5.5 0 0 0-3-4.9" /></Svg>;
export const IcCompass = (p: IconProps) => <Svg {...p}><circle cx="12" cy="12" r="8.5" /><path d="M15.2 8.8 13.4 13.4 8.8 15.2 10.6 10.6Z" /></Svg>;
export const IcLink = (p: IconProps) => <Svg {...p}><path d="M9.5 14.5 14.5 9.5" /><path d="M11 7.5 12.4 6a3.6 3.6 0 0 1 5.1 5.1L16 12.6" /><path d="M13 16.5 11.6 18a3.6 3.6 0 0 1-5.1-5.1L8 11.4" /></Svg>;
export const IcTweak = (p: IconProps) => <Svg {...p}><path d="M4 5v5h5" /><path d="M4 10a8 8 0 1 1 1 7" /></Svg>;
export const IcSend = (p: IconProps) => <Svg {...p}><path d="M5 12h13M12 5l7 7-7 7" /></Svg>;
export const IcExternal = (p: IconProps) => <Svg {...p}><path d="M14 5h5v5M19 5l-8 8M11 6H6.5A1.5 1.5 0 0 0 5 7.5v10A1.5 1.5 0 0 0 6.5 19h10A1.5 1.5 0 0 0 18 17.5V13" /></Svg>;
export const IcUndo = (p: IconProps) => <Svg {...p}><path d="M4 7v5h5" /><path d="M4 12a8 8 0 1 0 2.3-5.6" /></Svg>;
export const IcReply = (p: IconProps) => <Svg {...p}><path d="M9 7 4 12l5 5M4 12h9a6 6 0 0 1 6 6v1" /></Svg>;
export const IcChevDown = (p: IconProps) => <Svg {...p}><path d="M5 9l7 7 7-7" /></Svg>;
export const IcMore = (p: IconProps) => <Svg {...p}><circle cx="6" cy="12" r="1.3" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" /><circle cx="18" cy="12" r="1.3" fill="currentColor" stroke="none" /></Svg>;
export const IcSun = (p: IconProps) => <Svg {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" /></Svg>;
export const IcMoon = (p: IconProps) => <Svg {...p}><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" /></Svg>;
export const IcSparkle = (p: IconProps) => <Svg {...p}><path d="M12 4l1.6 4.8L18.5 10l-4.9 1.2L12 16l-1.6-4.8L5.5 10l4.9-1.2L12 4Z" /></Svg>;
export const IcHeart = (p: IconProps) => <Svg {...p}><path d="M12 19.5C5 15 3.5 11 3.5 8.5A4 4 0 0 1 12 6.5 4 4 0 0 1 20.5 8.5C20.5 11 19 15 12 19.5Z" /></Svg>;
export const IcBubble = (p: IconProps) => <Svg {...p}><path d="M5 5h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9l-4 3.5V6a1 1 0 0 1 1-1Z" /></Svg>;
export const IcRepost = (p: IconProps) => <Svg {...p}><path d="M5 8h10l-2.5-2.5M19 16H9l2.5 2.5" /></Svg>;
export const IcEye = (p: IconProps) => <Svg {...p}><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="2.6" /></Svg>;
export const IcFeed = (p: IconProps) => <Svg {...p}><path d="M3 14l4-5 4 4 3-6 3 5h4" /></Svg>;
export const IcChart = (p: IconProps) => <Svg {...p}><path d="M4 19V5M4 19h16" /><path d="M8 16l3.5-4 3 2.5L19 8" /></Svg>;
export const IcTrash = (p: IconProps) => <Svg {...p}><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" /></Svg>;
export const IcArrowUp = (p: IconProps) => <Svg {...p}><path d="M12 19V6M6 11l6-6 6 6" /></Svg>;
export const IcArrowDown = (p: IconProps) => <Svg {...p}><path d="M12 5v13M6 13l6 6 6-6" /></Svg>;
export const IcArrowLeft = (p: IconProps) => <Svg {...p}><path d="M19 12H5M11 6l-6 6 6 6" /></Svg>;
export const IcAudit = (p: IconProps) => <Svg {...p}><path d="M8 4h8a1 1 0 0 1 1 1v1h1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h1V5a1 1 0 0 1 1-1Z" /><path d="M8.5 13.5l2.2 2.2 4.3-4.6" /></Svg>;
export const IcStudy = (p: IconProps) => <Svg {...p}><circle cx="11" cy="11" r="7" /><path d="M20.5 20.5l-4.4-4.4" /><path d="M11 8.2l.9 1.9 1.9.9-1.9.9-.9 1.9-.9-1.9-1.9-.9 1.9-.9Z" /></Svg>;
export const IcBolt = (p: IconProps) => <Svg {...p}><path d="M13 3 5 13h6l-1 8 8-10h-6l1-8Z" /></Svg>;
export const IcPlus = (p: IconProps) => <Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>;
export const IcClock = (p: IconProps) => <Svg {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></Svg>;
export const IcSkip = (p: IconProps) => <Svg {...p}><path d="M6 5v14M18 5v14M9 12h7M9 12l3-3M9 12l3 3" /></Svg>;
export const IcGlobe = (p: IconProps) => <Svg {...p}><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.5 2.3 2.5 14.7 0 17M12 3.5c-2.5 2.3-2.5 14.7 0 17" /></Svg>;
export const IcAt = (p: IconProps) => <Svg {...p}><circle cx="12" cy="12" r="3.6" /><path d="M15.6 8.6v4.6a2.4 2.4 0 0 0 4.8 0v-1.2a8.4 8.4 0 1 0-3.2 6.6" /></Svg>;
export const IcStar = (p: IconProps) => <Svg {...p}><path d="M12 4.2l2.4 4.86 5.36.78-3.88 3.78.92 5.34L12 16.18 7.2 18.74l.92-5.34L4.24 9.62l5.36-.78Z" /></Svg>;
export const IcArchive = (p: IconProps) => <Svg {...p}><path d="M4 8.5h16V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8.5Z" /><path d="M3 4.5h18v4H3zM9.5 12.5h5" /></Svg>;

/* "Drafting Line" brand mark — filled glyph in a rounded paper tile.
   Uses semantic CSS vars so the tile/pen flip with the theme automatically. */
export function BrandMark({
  size = 34,
  radius = 10,
  className,
}: {
  size?: number;
  radius?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      className={className}
      aria-label="Pennedly"
      style={{ display: "block", borderRadius: radius }}
    >
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
}
