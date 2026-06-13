# CD prompt — My Feed: render post media

> Ready-to-paste brief for Claude Design (CD). One screen: the **My Feed** post
> card (`/app/feed`). Goal: extend the existing card to **render the media** a
> Threads post carries. Grounded in `MEDIA-CAPABILITIES.md` (§B Display).

---

## Context

You are designing for **Pennedly**, a Threads management web app. Reuse the
existing **My Feed** design as the base — do not redesign the card, **extend**
it. Reference files already in the design set:
`Feed.html`, `feed-card.jsx`, `feed-parts.jsx`, `feed.css`, `Feed-Mobile-SPEC.html`.

Keep the established design language: calm, editorial, **rounded corners,
subtle 1px borders, soft/low shadows**, single-weight **line icons**, semantic
tokens (`bg-surface`, `bg-surface-2`, `border-border`, `text-text`,
`text-text-muted`, `text-text-subtle`, `accent`, `success`, `danger`), and full
**light + dark** support. Every state must be shown for **web** (feed column
width) **and mobile** (390px), matching the `Feed-Mobile-SPEC` idiom.

## What the card looks like today (unchanged base)

Header (avatar · name · @handle · time · viral-tier chip) → **post text** →
metrics row (views / likes / comments / reposts) + growth sparkline → footer
(translate, auto-reply toggle, "open in Threads"). Currently **text-only — no
media is rendered.** Already-published posts can carry media authored in
Pennedly *or* in the Threads app, so the card must handle every type below.

## Where media goes

Insert a **media block between the post text and the metrics row**, full card
width (inside the card padding). Multiple media never stack vertically — a post
has exactly one media block (a single image, one carousel, one video, etc.).
A text-only post shows no block (today's look).

## Media types to design (each with ALL its states)

1. **Single image** — rounded image, full width, **aspect-aware** (respect the
   image ratio but cap very tall images, ~4:5 max, with a subtle "tap to
   expand" affordance). Click → lightbox (design the lightbox too) or open in
   Threads. States: loaded, **loading skeleton**, **failed-to-load** fallback
   (muted placeholder + "image unavailable").

2. **Carousel (2–20 items, images and/or video mixed)** — a horizontal,
   swipeable gallery. Show **dot indicators** + a small **count badge** (e.g.
   "1 / 4") top-right. First item is the preview. Video items inside show a play
   badge. Mobile: edge-swipe; web: arrows on hover + swipe. States: first item,
   mid-carousel, a mixed image+video carousel.

3. **Video** — **poster image + centered play badge**; a small **duration
   chip** (e.g. "0:42") bottom-right. Default to click-to-play inline (or
   open-in-Threads fallback); optional muted-autoplay-in-view variant — show
   both. States: poster, playing, **processing/unavailable** fallback.

4. **GIF** — auto-looping, muted, with a small **"GIF" chip**. Visually like a
   video frame but lighter (no duration chip). State: looping.

5. **Audio** *(display only — never composed in Pennedly, but external posts
   have it)* — a **compact audio player row**: play/pause, a slim waveform or
   progress bar, elapsed/total time. Keep it one line tall. States: idle,
   playing.

6. **Link card** *(Pennedly generates the preview itself from OpenGraph — the
   Threads API only gives the raw URL)* — a horizontal card: **thumbnail (left
   on web / top on mobile) + title (2 lines max) + domain**, whole card is a
   link with an external-link affordance. States: **loaded**, **loading
   skeleton**, and **"preview unavailable"** fallback (no thumbnail — just a
   tidy domain + URL chip so it never looks broken).

7. **Poll** — the question is the post text; below it, **option rows with
   horizontal % bars**, vote counts, and a total. States: **open** (can't vote
   here — read-only, show current standings), **closed** (winner emphasized).

8. **Quote / repost** — an **embedded inset mini-card** of the quoted/reposted
   post: small avatar · @handle · time · truncated text (3 lines) · a small
   media thumbnail if it has one. Bordered/indented to read as nested. States:
   loaded, **loading** (the quote loads via a second fetch — show a skeleton),
   **"post unavailable"** (deleted/private).

9. **None** — plain text post, no media block (today's card, included for
   contrast).

## Deliverable

A **state-gallery spec** (like the other `*-SPEC.html` files) titled
**`Feed-Media-SPEC.html`** that renders the feed card in **every** media variant
+ state above, for **web and mobile**, in **light and dark**. Annotate each
variant with a short label. Don't invent new tokens or icons — reuse the set;
if a genuinely new icon is needed (e.g. play, GIF chip, audio), note it
explicitly so it can be added to `icons.tsx`.

## Guardrails

- **Audio** appears in **display only** — there is **no** audio attach anywhere.
- **Link previews** must include the **"unavailable" fallback** — we generate
  previews ourselves and they can fail; the card must degrade gracefully.
- Media must never overpower the card — it sits **between text and metrics**,
  respects card padding, and keeps the feed scannable.
- Honor reduced-motion (no autoplay) and provide `alt` text slots.

---

### Engineering note (not for CD — for whoever wires it)

The feed does **not** carry media today. `FeedPost` (and the backend feed query
+ the Threads fields we fetch, `POST_LIST_FIELDS`) must be extended with the
display fields from `MEDIA-CAPABILITIES.md §E`: `media_type`, `media_url`,
`thumbnail_url`, `children`, `gif_url`, `link_attachment_url`, `is_quote_post`,
`quoted_post`, `poll_attachment`. Link previews need a small OpenGraph-fetch
service. Design can proceed in parallel; the data layer is a separate task.
