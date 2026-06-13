# CD prompt — Post composer: media toolbar

> Ready-to-paste brief for Claude Design (CD). One screen: the **Studio post
> compose surface** (the draft card in edit/compose mode, `/app`). Goal: extend
> the already-shipped image attach into a **full media toolbar**. Grounded in
> `MEDIA-CAPABILITIES.md` (§A1 Post composer).

---

## Context

You are designing for **Pennedly**, a Threads management web app. Reuse the
existing **Studio** design as the base — extend, don't redesign. Reference files
in the design set: `Studio.html`, `studio-parts.jsx`, `studio-app.jsx`,
`studio-icons.jsx`, `studio.css`, `Studio-Mobile-SPEC.html`.

Keep the design language: calm, editorial, rounded corners, subtle 1px borders,
soft shadows, single-weight line icons, semantic tokens (`bg-surface`,
`bg-surface-2`, `border-border`, `text-text`, `text-text-muted`,
`text-text-subtle`, `accent`, `success`, `danger`), full **light + dark**.
Every state for **web** and **mobile (390px)** — mobile inputs ≥16px font,
tap targets ≥44px.

## Base (already shipped — extend it)

A draft post is composed on its **card**: an editable text area + a small media
row that today has an **"Add image"** button → a thumbnail strip with per-image
remove (up to 10, carousel). You are **expanding that media row into a full
toolbar** for all post media. Threads caps a part at 500 chars; a post can also
be a **thread** (parts split on a `---` line) — when it is a thread, **media
attaches to the LEAD part only**; show how the composer signals that.

## The media toolbar

Below the text editor, a compact action row: **Image · Video · GIF** (each a
line-icon chip). Plus an **auto-detected link card** (no button — appears when
the text contains a URL). A **poll** action may be included but is lower
priority. Design how the toolbar reflects **mutual exclusion** (see GIF).

## Attach types — each with ALL its compose states

1. **Image(s)** *(polish the shipped version)* — picker → **thumbnail strip**
   (1–20). Per thumbnail: **remove (×)**, **drag to reorder** (carousel), and an
   **"ALT" affordance** to add alt-text (empty vs filled). States: empty,
   1 image, multi/carousel, **reordering (drag)**, uploading, error (too large /
   wrong type — JPEG/PNG/WebP, ≤8 MB).

2. **Video** — picker → **upload progress** (to Pennedly) → **ready** thumbnail
   with a play badge + **duration chip** + remove + an ALT affordance. Show the
   inline limit hint (≤5 min, ≤1 GB, MP4/MOV). States: empty, uploading %,
   ready, error (duration/size/format). *(Threads-side processing happens at
   publish time, not here — note it but don't design it on this screen.)*

3. **GIF** — tapping GIF opens a **GIPHY search picker**: search field →
   results grid → pick → a single looping GIF tile with remove + GIPHY
   attribution. **Text-only rule:** a GIF is mutually exclusive with
   image/video/carousel — when a GIF is attached, the Image/Video chips are
   **disabled with a hint**; when image/video is attached, GIF is disabled.
   Design both disabled states + the picker (search, results, empty results,
   loading).

4. **Link card** — when the body contains a URL, **auto-show a preview card**
   under the editor (thumbnail + title + domain) with **keep/remove**. Pennedly
   builds the preview. States: detecting/loading skeleton, loaded card,
   **"preview unavailable"** fallback (tidy domain chip, still removable),
   multiple-links case (which one previews).

5. **alt-text** — a small per-image/video input (sheet/popover) to add an
   accessibility description; show empty trigger + filled (checked) state.

6. **Poll** *(optional, lower priority)* — 2–4 option rows + a duration select.

7. **Audio** — **not designed.** There is no audio attach (Threads API has none).

## Layout & interplay

- The media block renders **between the editor and the card's action footer**
  (approve / schedule / publish), matching the shipped placement.
- **Thread interplay:** when the post is split into parts (`---`), show a clear
  cue that media rides the **first part** (e.g. the media block sits under
  part 1 with a "attached to the first post" caption).
- Mobile: toolbar wraps / scrolls; pickers become full-width sheets; thumbnails
  in a horizontal scroller; everything thumb-reachable.

## Deliverable

A **state-gallery spec** like the other `*-SPEC.html` files, titled
**`Studio-Compose-Media-SPEC.html`**, rendering the compose surface in **every**
attach type + state above, **web and mobile**, **light and dark**, each labeled.
Reuse existing tokens/icons; if a new icon is needed (video/play, GIF, link,
poll, drag-handle, alt), call it out explicitly for `icons.tsx`.

## Guardrails

- **No audio attach** anywhere.
- **GIF is text-only and exclusive** with image/video/carousel — the toolbar
  must make that obvious, never silently fail.
- **Video processing** (Threads-side) is a publish-time concern — not on this
  screen.
- Don't regress the shipped image idiom; this is an **extension** of it.
- Honor reduced-motion; provide alt-text everywhere media is attached.

---

### Engineering note (not for CD)

Backend already supports image IMAGE/CAROUSEL attach + publish. Still to wire for
this screen: video upload + Threads video container with **status polling**, the
**GIPHY** search integration + `gif_attachment` publish param, **OpenGraph
link-preview** generation + `link_attachment`, alt-text storage + publish param,
and reorder persistence. See `MEDIA-CAPABILITIES.md §E`. Design proceeds in
parallel; data/publish wiring is separate tasks.
