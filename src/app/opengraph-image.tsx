import { ImageResponse } from "next/og";

// Open Graph / Twitter share card for the whole site, rooted at the landing.
// Drawn at request/build time with satori (next/og) in the brand's light
// ink-on-paper palette. satori only supports flexbox + a subset of CSS, so
// every container is an explicit flex box with longhand styles, and the brand
// mark is inlined as an <img> data-URI (satori renders SVG that way). No custom
// font is passed — next/og ships Geist as its default, which is the brand face.

export const alt = "Pennedly — your drafting partner for Threads. You keep the final say.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// "Drafting Line" brand mark: ink tile + paper pen (light theme).
const MARK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="115" fill="#171717"/><g fill="#efedea"><path d="M182 348 C248 366 322 352 376 312 C326 330 252 340 188 326 C176 324 174 344 182 348 Z"/><g transform="rotate(42 256 256)"><path d="M236 150 Q236 128 256 128 Q276 128 276 150 L276 300 L256 360 L236 300 Z"/><rect x="236" y="206" width="40" height="7"/></g></g></svg>`;
const MARK_SRC = `data:image/svg+xml;base64,${Buffer.from(MARK).toString("base64")}`;

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#efedea",
          color: "#171717",
          paddingTop: 70,
          paddingBottom: 70,
          paddingLeft: 80,
          paddingRight: 80,
        }}
      >
        {/* brand row */}
        <div style={{ display: "flex", alignItems: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={MARK_SRC} width={80} height={80} alt="" style={{ marginRight: 22, borderRadius: 18 }} />
          <span style={{ fontSize: 44, letterSpacing: -1 }}>Pennedly</span>
        </div>

        {/* headline + subhead */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 72, lineHeight: 1.08, letterSpacing: -2, maxWidth: 1000 }}>
            Your drafting partner for Threads.
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 30,
              lineHeight: 1.4,
              marginTop: 26,
              maxWidth: 940,
              color: "#565550",
            }}
          >
            Drafts posts and replies in your voice. By default, nothing publishes until you approve
            it — you keep the final say.
          </div>
        </div>

        {/* footer row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTopWidth: 1,
            borderTopStyle: "solid",
            borderTopColor: "#dcd9d2",
            paddingTop: 26,
          }}
        >
          <span style={{ fontSize: 25, color: "#6b6a65" }}>app.pennedly.com</span>
          <div style={{ display: "flex", alignItems: "center" }}>
            <span
              style={{
                display: "flex",
                width: 9,
                height: 9,
                borderRadius: 9999,
                backgroundColor: "#2f4cc4",
                marginRight: 12,
              }}
            />
            <span style={{ fontSize: 24, color: "#565550" }}>In your voice · invite-only beta</span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
