# CD prompt — Reply composer: media

> Ready-to-paste brief for Claude Design (CD). One screen: the **reply answer
> box** on `/app/replies`. Goal: let a reply carry media — **single image is the
> real feature**; video / carousel / GIF are designed but **gated** (the Threads
> API doesn't confirm them for replies). Grounded in `MEDIA-CAPABILITIES.md`
> (§A2 Reply composer).

---

## Context

You are designing for **Pennedly**, a Threads management web app. Reuse the
existing **Replies** design as the base — extend, don't redesign. Reference
files in the design set: `Replies.html`, `Replies-SPEC.html`,
`Replies-Mobile-SPEC.html`, `replies-card.jsx`, `replies-parts.jsx`,
`replies-postselect.jsx`, `replies.css`.

Keep the design language: calm, editorial, rounded corners, subtle 1px borders,
soft shadows, single-weight line icons, semantic tokens (`bg-surface`,
`bg-surface-2`, `border-border`, `text-text`, `text-text-muted`,
`text-text-subtle`, `accent`, `success`, `danger`), full **light + dark**.
Every state for **web** and **mobile (390px)** — mobile inputs ≥16px, tap
targets ≥44px.

## Base (extend it)

On `/app/replies`, each comment card shows the comment being answered + an
**inline answer box** (the reply draft text + actions). Today the reply is
**text-only**. You are adding a **compact media affordance** to that answer box.
A reply is small and contextual — keep the media UI **lighter than the post
composer** (it lives inside a comment card, not a full post card).

## Attach types — states

1. **Single image** *(the primary, fully supported)* — an **"Add image"** chip
   in the answer-box action row → picker → **one thumbnail** with **remove (×)**
   and an **"ALT" affordance** (add alt-text: empty vs filled). Scope it to
   **one image** by default (a reply is a quick answer). States: empty,
   uploading %, attached, error (too large / wrong type — JPEG/PNG/WebP, ≤8 MB).

2. **Video / Carousel / GIF** *(designed but GATED — "pending API verification")*
   — show these as **secondary, clearly-marked** options: either disabled chips
   with a small **"soon"/experimental** tag, or revealed only under a "More"
   affordance with a subtle **"verifying support"** note. The point: CD draws the
   intended end-state, but the UI must communicate these aren't live yet (we must
   confirm Threads accepts them in a reply before enabling). Design: the gated
   chip state + an inline note explaining "image works today; richer media is
   coming once verified."

3. **Audio** — **not designed.** No audio attach exists.

## Layout & behavior

- The media row sits **inside the answer box**, between the reply text field and
  its send/approve action — compact, single-row.
- When an image is attached, the thumbnail appears **above the send action**,
  not pushing the comment context off-screen.
- The reply box already has the existing actions (generate/regenerate, approve,
  send) — **integrate** the image chip into that row; don't add a second
  toolbar.
- Mobile: the answer box stays thumb-reachable; the picker is a full-width sheet;
  the thumbnail is a comfortable tap target with an easy remove.

## Deliverable

A **state-gallery spec** like the other `*-SPEC.html` files, titled
**`Replies-Media-SPEC.html`**, rendering the answer box in: text-only (today),
**image: empty / uploading / attached / alt-filled / error**, and the **gated
video/carousel/GIF** treatment — for **web and mobile**, **light and dark**, each
labeled. Reuse existing tokens/icons; flag any new icon (image, alt, the gated
"soon" mark) for `icons.tsx`.

## Guardrails

- **Single image is the only reply media that's live** — make video/carousel/GIF
  visibly **gated**, never presented as working.
- **No audio.**
- Keep it **compact** — a reply is a fast answer; the media UI must not turn the
  comment card into a heavy composer.
- Don't regress the existing reply flow (generate / approve / send).

---

### Engineering note (not for CD)

Backend `publish_reply` already accepts `image_urls`, so **image replies are
publishable today** once the FE attaches them (reuse the post upload endpoint +
`PUT`-style media set, scoped to the reply draft). **Video / carousel / GIF in
replies are UNVERIFIED in Meta's docs** — before enabling, test against the live
Graph API (or a Meta support ticket). See `MEDIA-CAPABILITIES.md §A2 + §E`.
Design proceeds now; wiring image-reply attach is the first build task, the rest
gated behind verification.
