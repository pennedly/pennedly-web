"use client";

// App-Header-SPEC §4 — the single scroll driver behind the "page identity
// renders once" rule.
//
// Every /app screen shows its title twice today: compact in the sticky
// `AppTopbar` and large in the in-flow hero right underneath. The fix is a
// crossfade — the hero owns the title at rest, the bar docks the same string
// once the hero scrolls away — so exactly one instance is ever visible.
//
// `AppTopbar` and the hero `<h1>` are NOT related in the React tree (the bar is
// rendered by the page, the hero lives deep inside a content component), so the
// reveal is published as a CSS custom property on `:root` instead of being
// prop-drilled. Both subtrees read `var(--hdr-reveal, 0)`.
//
// /app/* scrolls at the DOCUMENT level (app/layout.tsx has no inner
// `overflow-y-auto`), so the driver is `window.scrollY` — not a scoped
// container's scrollTop.

import { useEffect, type CSSProperties, type RefObject } from "react";

/**
 * The hero side of the crossfade (spec §4): opacity only, no transform — the
 * hero is already leaving through normal scroll flow.
 *
 * Spread onto each screen's hero `<h1>`. Shared rather than inlined 11 times so
 * the formula (and its `0` fallback, which is what keeps the hero visible
 * before hydration and on screens with no header) can never drift per screen.
 */
export const HERO_FADE_STYLE: CSSProperties = {
  opacity: "calc(1 - var(--hdr-reveal, 0))",
};

/** Scroll distance over which the hero hands the title to the bar (spec §4). */
const COLLAPSE_PX = 32;
/** `prefers-reduced-motion`: the ramp becomes a step at this scrollTop (spec §4). */
const REDUCED_STEP_PX = 16;

/**
 * Publishes `--hdr-reveal` (0 → 1) on `<html>` for the whole page to read.
 *
 * Called once from `AppTopbar`, which every affected screen already renders —
 * so no page has to opt in, and there is never more than one listener.
 */
/**
 * Publishes the sticky bar's REAL height as `--app-header-h` on `<html>`, so
 * secondary sticky rows (the Replies post-switcher, any future one) can pin
 * directly below it instead of hardcoding an offset.
 *
 * The bar's height is not a constant: it grows with the profile-crumb strip and
 * again when a long-locale status pill wraps to a second line — measured at
 * 106px on a 375px `ru` Replies screen, against the 52px the switcher assumed.
 * That is why the switcher slid UNDER the bar while scrolling.
 */
function useHeaderHeightVar(ref: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const root = document.documentElement;
    const publish = (): void => {
      root.style.setProperty("--app-header-h", `${Math.round(el.getBoundingClientRect().height)}px`);
    };
    publish();
    const ro = new ResizeObserver(publish);
    ro.observe(el);
    return () => {
      ro.disconnect();
      root.style.removeProperty("--app-header-h");
    };
  }, [ref]);
}

export function useHeaderReveal(headerRef: RefObject<HTMLElement | null>): void {
  useHeaderHeightVar(headerRef);
  useEffect(() => {
    // Belt-and-braces: effects never run during SSR, but this keeps the hook
    // safe if it is ever hoisted out of an effect.
    if (typeof window === "undefined") return;

    const root = document.documentElement;
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    let reduced = motionQuery.matches;
    // -1 is unreachable for a clamped 0..1 reveal, so the first apply() always
    // writes — no flash of a stale value carried over from the previous screen.
    let last = -1;

    const apply = (): void => {
      const y = window.scrollY;
      const reveal = reduced
        ? y >= REDUCED_STEP_PX
          ? 1
          : 0
        : Math.min(1, Math.max(0, y / COLLAPSE_PX));
      // Deep in a long page the value is pinned at 1; skipping the redundant
      // write avoids invalidating styles on every scroll event down there.
      if (reveal === last) return;
      last = reveal;
      root.style.setProperty("--hdr-reveal", String(reveal));
    };

    // Seed from the current position before the first scroll event: a reload
    // mid-page (or a browser scroll restore) must not paint the at-rest state.
    apply();

    const onMotionChange = (): void => {
      reduced = motionQuery.matches;
      last = -1;
      apply();
    };

    window.addEventListener("scroll", apply, { passive: true });
    motionQuery.addEventListener("change", onMotionChange);

    return () => {
      window.removeEventListener("scroll", apply);
      motionQuery.removeEventListener("change", onMotionChange);
      // Drop the property with the header that drove it. The CSS fallback (0)
      // is the at-rest state, which is also where every new route starts — so
      // a screen without an AppTopbar can never inherit a stale "1", and the
      // next AppTopbar re-seeds on mount anyway.
      root.style.removeProperty("--hdr-reveal");
    };
  }, []);
}
