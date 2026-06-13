# Media in Pennedly — capability map for design (CD brief)

**Purpose.** A single source of truth for *what media Pennedly should let a user
attach and what it should display*, across **posts** and **replies** — written as
the input for CD (Claude Design) prompts. It is grounded in what the **Threads
Graph API actually allows** (researched against Meta's official docs, 2026), so CD
never designs something the platform can't do.

**Legend**
- ✅ **Possible & worth designing** — the Threads API supports it.
- ⚠️ **Possible but UNVERIFIED** — plausible via the API but not confirmed in
  Meta's docs; design it, but engineering must verify on the live API and it
  should ship behind a flag.
- ❌ **Not possible** — the API does not support it; **do not design** an
  attach UI for it (display may still occur for posts made elsewhere).

**Hard platform facts that shape every screen**
- Threads has **no binary upload**. Pennedly hosts the file and hands Threads a
  **public URL**; Threads fetches it. (Already how images work today.) Invisible
  to the user, but it means there's always a brief server step.
- **Video is processed asynchronously** by Threads (up to ~5 min) — any video
  attach UI needs a non-blocking **"processing"** state, not a frozen spinner.
- **Link previews are NOT provided by the API.** Threads returns only the raw
  URL. To show a link card with a thumbnail, **Pennedly generates the preview
  itself** (fetch the page, read OpenGraph). Design a card + a "preview
  unavailable" fallback.

---

## A. ATTACH — what the user can add when composing

### A1. Post composer (Studio)

| Media | Status | What CD should design |
|---|---|---|
| **Text** | ✅ | The existing editor (≤500 chars per post; threads split on `---`, already shipped). |
| **Image(s)** | ✅ *(single + carousel already shipped)* | Picker → thumbnail strip; remove per image; **reorder** (drag) for carousels; **1–20** images; an **alt-text** field per image. Polish the shipped version + add reorder + alt-text. |
| **Video** | ✅ | Picker → upload progress → **"processing on Threads…" state** (can take minutes) → ready thumbnail with a play badge; remove; show limits inline (≤5 min, ≤1 GB, MP4/MOV). One video **or** a carousel mixing video+images (up to 20). |
| **GIF** | ✅ | A **GIPHY search picker** (not a file upload) — search box → grid → pick. **Text-only posts**: a GIF is mutually exclusive with image/video/carousel, so the UI must disable image/video when a GIF is attached (and vice-versa). |
| **Link card** | ✅ | When the body contains a URL, show an auto-generated **preview card** (thumbnail + title + domain) under the composer, with a toggle to **keep/remove** it. Pennedly builds the preview. |
| **Poll** | ✅ | 2–4 option rows + a duration picker. *(Lower priority — design later.)* |
| **alt-text** | ✅ | Accessibility text per image/video (and per carousel item). |
| **Quote post** | ✅ | "Quote" entry point that embeds another post as a card *above* the new text; the quote can itself carry an image. *(Separate from replying.)* |
| **Audio** | ❌ | **Do not design** an audio-attach control — Threads has no audio post in the API (app-only). |
| **Location / topic tag / country-gate** | ✅ *(metadata, not media)* | Optional: a location chip, one topic tag, audience/country gating. Out of scope for the media pass; noted for completeness. |

### A2. Reply composer (the `/app/replies` answer box)

| Media | Status | Notes for CD |
|---|---|---|
| **Text** | ✅ | Already shipped. |
| **Image (single)** | ✅ | Worth designing — same picker idiom as the post composer, scaled down. |
| **Video** | ⚠️ | Design it, but mark **"pending API verification"**; ship behind a flag. |
| **Carousel** | ⚠️ | Same — the "no carousel in replies" claim is *not* in Meta's docs, so treat as unverified, not forbidden. |
| **GIF** | ⚠️ | Same GIPHY picker; unverified for replies. |
| **Audio** | ❌ | Don't design. |

> Reply reality check: only **text** and **single image** are safe to build today.
> Everything richer in a reply needs a live-API test first — design the screens,
> gate the build.

---

## B. DISPLAY — what Pennedly must render

Surfaces that show Threads content: **My Feed** (`/app/feed`), **Studio cards**
(draft + published), **Replies** (`/app/replies`), and any **post/thread detail**.
Display must handle media authored **anywhere** (incl. the Threads app), so it must
cover types we don't let users *attach* (e.g. audio from an external post).

| Media on a post/reply | Status | What CD should design |
|---|---|---|
| **Image** | ✅ | Inline image (rounded, aspect-aware). Already shown on Studio draft cards; **add to My Feed** (currently text-only). |
| **Carousel** | ✅ | A swipeable gallery with dots + an "N" count badge; first frame as the card preview. |
| **Video** | ✅ | Poster (`thumbnail_url`) + play badge → inline player or open-in-Threads; muted-autoplay optional. |
| **GIF** | ✅ | Auto-looping inline (note: such posts read as text-type with a separate gif field — display logic must check it). |
| **Audio** | ✅ *(display only)* | A compact audio player / waveform placeholder for externally-authored audio posts. |
| **Link card** | ✅ *(we build it)* | Preview card: thumbnail + title + domain, links out. Pennedly generates it from the URL. |
| **Poll** | ✅ | Question + option bars with %; "voted/closed" states. |
| **Quote / repost** | ✅ | An embedded mini-card of the quoted/reposted post (author + text + its media). Needs a second fetch — design a compact nested card + a loading state. |
| **alt-text** | ✅ | Surface as the `alt`/title on images & video for accessibility. |

---

## C. Per-type design notes (states each media needs)

- **Image** — empty picker, uploading, thumbnail, remove, alt-text, error (too
  large / wrong type), and the **carousel** multi-thumbnail + reorder case.
- **Video** — picker, upload %, **processing**, ready, play, remove, error
  (duration/size/format). The processing state is the new pattern vs images.
- **GIF** — GIPHY search field, results grid, attribution, selected state,
  mutual-exclusion with other media.
- **Link card** — auto-detected, loading preview, loaded card, **"no preview"**
  fallback, dismiss.
- **Carousel viewer (display)** — swipe, dots, count, mixed image/video items.
- **Quote/repost (display)** — nested card, loading, "unavailable" (deleted).
- **Empty/none** — a plain text post/reply with no media (the default).

---

## D. Suggested phasing (build order, not design order — CD can draw all)

1. **Images on posts** — *shipped*; polish + add to My Feed display + alt-text.
2. **Link previews** — high value, fully under our control (we generate them).
3. **Video on posts** — needs the processing state + status polling backend.
4. **GIF picker** — GIPHY integration (text-posts only).
5. **Media in replies** — start with image; verify API for the rest.
6. **Polls / quote display** — nice-to-have.
7. **Audio** — **display only**; never an attach control.

---

## E. Appendix — API ground-truth (for engineers, not CD prompts)

Condensed; full notes + source URLs in the team memory `reference_threads_media_api`.

**Attach (container params on `POST /{user}/threads`):**
- `media_type=TEXT|IMAGE|VIDEO|CAROUSEL` (+ `is_carousel_item` children → parent
  `children=`). Image: JPEG/PNG, ≤8 MB, width 320–1440, ≤10:1. Video: MP4/MOV,
  H.264/HEVC + AAC, ≤1 GB, ≤300 s; **poll `?fields=status` until `FINISHED`**.
  Carousel: **2–20**, images+videos may mix.
- `gif_attachment` (GIPHY `gif_id`+`provider`) — **TEXT posts only**.
- `link_attachment` (URL) — **TEXT posts only**.
- `alt_text` (per media), `quote_post_id`, `poll_attachment`, `reply_control`,
  `location_id`, `topic_tag`, `allowlisted_country_codes`.
- Reply = same flow + `reply_to_id`. **Audio: no API media type.**
- Container lifetime **24 h**; **WebP is not documented** as accepted (JPEG/PNG
  only) — Pennedly currently allows WebP on upload; flag for review.

**Display (read fields on a media node / `/replies`):**
- `media_type ∈ {TEXT_POST, IMAGE, VIDEO, CAROUSEL_ALBUM, AUDIO, REPOST_FACADE}`
  (GIF & poll posts report as `TEXT_POST` — check side fields).
- `media_url`, `thumbnail_url` (video only), `children` (carousel),
  `alt_text`, `gif_url`, `poll_attachment`, `is_quote_post`, `quoted_post`
  (ID → refetch), `reposted_post` (ID → refetch), `link_attachment_url`
  (**raw URL only — no card title/image; previews are ours to build**),
  `permalink`. Replies add `root_post`, `replied_to`, `is_reply`,
  `has_replies`, `hide_status`.

Primary docs: developers.facebook.com/docs/threads — `/posts`,
`/reference/publishing/`, `/retrieve-and-discover-posts/retrieve-posts/`,
`/retrieve-and-manage-replies/create-replies`, `/reply-management`,
`/posts/quote-posts`, `/posts/accessibility/`, `/changelog`.
