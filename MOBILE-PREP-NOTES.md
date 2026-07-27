# Mobile redesign — prep notes (read-only audit, 2026-06-08)

Scratch reference compiled while waiting for the CD mobile specs. NOT committed.
Goal: when the spec zip lands, rebuild mobile 1:1 fast and know exactly what each
screen already does vs. what is just "desktop squeezed into a column".

Target width: **390px** (iPhone 14/15), also sanity-check **360px**.
Nav target (Zakhar's CD answers): **bottom tab bar (4 Workspace items) + "More" tab → drawer**.
Start order: **mobile DS → Studio, Feed, Replies → rest**.

---

## Shell & navigation — `src/app/app/layout.tsx` + `src/components/Sidebar.tsx`

- `layout.tsx`: wraps every `/app/*` page. Desktop offset = `md:pl-62`; mobile = no offset.
  `?demo=1` renders the shell without the auth/account gate (line ~80).
- `Sidebar.tsx` holds ALL nav. Three blocks:
  - **Desktop** left rail — `aside ... md:fixed md:w-62` (`:215`), `hidden` on mobile.
  - **Mobile top bar** — `sticky top-0 z-30 h-14 ... md:hidden` (`:222`), brand + hamburger.
  - **Mobile drawer** — `fixed inset-0 z-40 ... md:hidden` (`:259`), left sheet `w-64 max-w-[80%]`
    that just **reuses the desktop `nav` list**. This is the "draft" mobile nav to replace.
- `GROUPS` nav model at `:48` (Content / Growth / Voice groupings). The 4 bottom-tab
  "Workspace" items + "More" overflow will need a new grouping derived from here.
- **Bottom-tab rework lives almost entirely in `Sidebar.tsx`** (`:212`–`:274`). Pages already
  use `pb-24` on `<main>` (~96px) → some headroom for a bottom bar already exists, but verify
  exact tab-bar height and bump if needed.

## Tweaks panel — `src/components/tweaks/TweaksPanel.tsx`
- Floating launcher pinned **bottom-right** (`right:16px;bottom:16px`, z `2147483646`).
- **Conflict to handle:** the new bottom tab bar occupies the bottom edge → the Tweaks
  launcher (and bottom-anchored menus/dialogs) will overlap it on mobile. Lift the launcher
  above the tab-bar height under `?demo=1` on mobile.
- Gate everywhere: `demoParam && (me?.is_tester || IS_DEV)`. Each screen mounts one panel
  and drives its own mock states from tweak values. Controls: `TweakToggle / TweakRadio /
  TweakSelect / TweakSection`.

---

## Cross-cutting mobile issues (apply to all 3 screens)
1. **`max-w-[420px]` dialogs overflow a 390px screen** — Studio Publish, Feed ConfirmDelete,
   Replies PublishReply all use it with `p-6`. Need a consistent mobile treatment
   (`w-full` + side padding, or bottom-sheet). Likely a DS-level dialog rule from CD.
2. **Filter tab labels hide at `min-[561px]`** (Studio FilterTabs, Replies StatusFilter) →
   on phones only icon+count show. Confirm that is the intended mobile spec, not an accident.
3. Bottom-anchored popover menus (CardMenu / FeedMenu) use `right-0` → can clip the right
   edge at 360px; check against the tab bar too.
4. No screen needs desktop-style multi-column rework EXCEPT Replies (below).

---

## Studio — `src/app/app/page.tsx` + `components/studio/StudioParts.tsx`
- **Layout:** single centered column `max-w-[960px]`, everything stacks vertically. Already
  mobile-shaped; work is polish, not restructure.
- **Mobile gaps:** Publish dialog `max-w-[420px]` (`StudioParts:~920`); FilterTabs labels hide
  `min-[561px]` (`:754`); DraftCard "voice tag" hidden `min-[721px]` (`:566/:570`); composer
  chips + count selector + button may wrap awkwardly; CardMenu right-edge.
- **States to rebuild 1:1:**
  - Account: Active vs **First-run** (renders `FirstRun` hero instead of composer+feed).
  - Feed: Normal / Loading (3 skeletons) / Empty / Error.
  - Card status: draft / ready / published / rejected.
  - Card sub-states: editing, revising, tweakOpen (+4 suggested prompts), translated
    (8 langs), revised.
  - Composer: idle / generating ("Drafting N posts…" nib animation), count 1–4.
  - Publish dialog: editing / publishing / too-long-disabled.
  - Density: Comfortable / Compact. Toasts w/ undo (approve/reject/move).
- **Tweaks knobs:** Account, State, Drafts(1–4), Dark, Density.

## Feed — `src/app/app/feed/page.tsx` + `components/studio/FeedParts.tsx`
- **Layout:** single centered column `max-w-[960px]`. No multi-column. Reflows naturally.
- **Mobile gaps:** Baseline metrics grid `grid-cols-4 → max-[560px]:grid-cols-2` (2×2);
  baseline sparkline hidden `min-[561px]` (`FeedParts:127/137`); ConfirmDelete `max-w-[420px]`;
  card footer buttons (Growth/Open/⋯) may wrap; FeedMenu `right-0`.
- **States to rebuild 1:1:** phase = loading (5 skeletons) / error / empty / ready.
  - Per-card: growth panel open (TrendChart), "Still settling" badge, autoReply pill on/off,
    translated + show-original, reply-kind context block.
  - Overlays: ConfirmDelete modal, toast host, FeedMenu popover.
- **Tweaks knobs:** Dark, Sort(Recent/Top), State(Live/Loading/Empty/Error).

## Replies — `src/app/app/replies/page.tsx` + `components/studio/RepliesParts.tsx`
- **THE real mobile screen.** Desktop = **master-detail two-column**
  `grid grid-cols-[300px_1fr]` (`page:421`): left = PostMaster (sticky 300px post list),
  right = PostContext + StatusFilter + comment cards.
- **Current mobile = squeeze:** at `max-[900px]` grid → 1 col, PostMaster becomes a static
  `max-h-[300px]` scroll list stacked on top (`RepliesParts:78`). No real mobile pattern —
  user scrolls past a tall post list to reach comments. **This is what CD must redesign**
  (post selector / bottom sheet / back-nav), not just stack.
- **Mobile gaps:** the 900px squeeze above; StatusFilter labels hide `min-[561px]` (`:168`);
  PublishReply dialog `max-w-[420px]`; comment-card footer buttons stack on narrow.
- **States to rebuild 1:1:** phase = loading / ready / empty / error.
  - Comment status: new / draft / approved / replied / skipped (each = different footer).
  - Card sub-states: editing (inline textarea), comment-translated, reply-translated,
    generating (nib "Drafting…").
  - StatusFilter: All / Needs / Drafts / Replied / Skipped (counts per tab).
  - PublishReply dialog; toasts w/ undo (approve/skip/restore).
- **Tweaks knobs:** Dark, State(Live/Loading/Empty/Error). (No density, no account.)

---

## Suggested implementation order when the zip lands
1. **Mobile DS** (tokens/section inside existing Pennedly Design System) + shell:
   bottom tab bar + "More" drawer in `Sidebar.tsx`; Tweaks launcher lifted above it.
2. **Studio** — polish single column; fix Publish dialog + composer wrap; all states.
3. **Feed** — verify reflow; fix ConfirmDelete dialog; baseline 2×2; all states.
4. **Replies** — implement the new mobile master-detail pattern from the spec (biggest lift).
5. Gates each screen: `npx tsc --noEmit`, `npm run check:i18n`, Playwright visual, `npm run build`;
   eyeball PNGs; commit locally; hand off with `?demo=1` link + state list; **no self-push**.

---

## DELIVERED MOBILE DESIGN — zip "Pennedly-2", 2026-06-08

Source (extracted, read-only): `/Users/zakharsazanavets/Downloads/_pennedly2/` (= contents of
`design-export/PennedlyDesign`). Refresh the repo's `design-export/PennedlyDesign` per screen as
each is built (that screen's `*-Mobile-SPEC.html` + updated `*.css`; add `mobile/` + the DS mobile
section in the shell commit). Canonical mobile layer (design ref, scoped `.mob`, we re-express in
Tailwind v4): `mobile/pennedly-mobile.css`. Cross-screen rules: "The app on a phone" in
`Pennedly Design System.html` (~lines 355–477). Per-screen: `Studio/Feed/Replies-Mobile-SPEC.html`.

### Foundations (every screen)
- Breakpoint `@media (max-width:600px)` = phone (supersedes old 560px tweaks). 601–900 tablet
  icon-rail unchanged; >900 full sidebar unchanged. Ref width 390 (check 360).
- Tokens: `--topbar-h:52 --tabbar-h:58 --safe-bottom:6→env(safe-area-inset-bottom) --mobile-bp:600`.
- Gutters 14px L/R; section gap 16; card padding 14/16/12; touch ≥44×44; form fields 16px
  (iOS no-zoom); type ramp unchanged (body 15, inputs 16).

### Shell (Sidebar.tsx + layout.tsx) — STEP 1
- No sidebar on phone. Three pieces:
  - **Top bar** (52, sticky, frosted): left = screen title (h3, ellipsis) OR brand+name on
    top-level; back chevron on drill-in. center = optional status pill (Studio voice state; drops
    into content if width tight). right = ≤2 utility icon btns (40px) + avatar (32px → account sheet).
  - **Bottom tab bar** (58+safe, frosted, sticky): tester = Studio·Feed·Replies·Mentions·More (5);
    non-tester = Studio·Feed·More (3; Replies/Mentions gated). Active = **ink** (not accent).
    Counts = small accent bubble on icon. Label 11px.
  - **"More" drawer** = bottom sheet: nav groups Insight (Stats·Audits·Pattern study·Explore) +
    Voice & automation (Voice·Style rules·Autopilot), appearance toggle, Settings, Log out (danger).
  - **Account sheet** (tap avatar) = bottom sheet: switch accounts (avatar+check on active),
    connect another, identity (email+plan), Settings, Log out.
- Sheet mechanics: scrim (ink 52% + blur) + sheet (surface, top radius-xl, slide-up, max-h 88%,
  grip 36×4, safe-area pad). Dismiss on scrim/grip.

### Shared component patterns (DS-level, reused by the screens)
- **Card foot = TWO-TIER:** meta line (wraps freely) + ONE action row = at most one labelled
  primary (`flex:1`, min-h 44, wraps not clips) + 44×44 icon buttons (secondary + ⋯ overflow).
  ⋯ menu opens upward.
- **Composer = vertical stack:** full-width textarea (placeholder visible) → h-scroll chip row
  (chips full size, right mask fade) → full-width footer (count select 16px min-w 104 + Generate grows).
- **Tabs/filters = h-scroll sticky row**, labels kept (don't collapse to icons), ~38px pills.
- **Dialogs → bottom sheets** (full-width, stacked actions, primary on TOP, ≥46px).
- **Toasts** = full-width −12px gutters, pinned above tab bar (`bottom: tabbar+safe+12`).
- **Metric rows** = hero metric own line + even sub row (wraps). **Forms** = single column,
  labels above, 44px controls, 16px text, full-width.
- **L10n:** primary buttons wrap to 2nd line (min-h 44, white-space normal); chips/filters scroll;
  names/handles ellipsis; tab labels truncate → icon-only at extreme locales. No em-dashes in copy.

### Per-screen mobile pattern (one-liners; read the SPEC when building each)
- **Studio** (`Studio-Mobile-SPEC.html`): composer stack; cards draft/ready/published/rejected +
  editing/tweak/translated; filter scroll bar; first-run hero; publish→sheet; loading(3 skel)/
  empty-per-tab/error.
- **Feed** (`Feed-Mobile-SPEC.html`): **no top baseline strip** — metrics fold into each card
  (hero line + sub row); virality badge; growth trend panel (full-width SVG, live avg label);
  auto-replies pill on its own meta line; reply-context block; confirm-delete→sheet;
  loading/ready/empty/error.
- **Replies** (`Replies-Mobile-SPEC.html`): single scroll, comments **GROUPED by post under STICKY
  per-post headers** (post text + date + comment count + unanswered badge) — replaces desktop
  master-detail; status filter scroll bar; comment statuses new/draft/approved/replied/skipped +
  editing/generating/translate; reply thread = left-border block (success-tint on replied);
  publish-reply→sheet. (`replies-postselect.jsx` is the DESKTOP master pane; mobile uses the
  sticky group headers — confirm exact behavior in the SPEC when building.)
