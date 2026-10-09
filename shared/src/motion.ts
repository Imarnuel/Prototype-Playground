/**
 * The project's motion constants — the single set, per CLAUDE.md section 5.
 *
 * These are NOT read off a design. No case study has supplied motion values
 * yet, so this is the baseline every prototype shares until one does. When a
 * Figma file provides real durations/easings (get_motion_context), replace the
 * values here rather than adding a second set next to them.
 *
 * To debug a transition, temporarily raise a duration to several seconds and
 * sample positions frame by frame (CLAUDE.md:55).
 */

export const DURATION = {
  /** Press feedback, checkbox ticks — anything that must feel instant but not cut. */
  instant: 120,
  /** Default: hovers, fades, small position changes. */
  fast: 200,
  /** Screen-level content transitions. */
  base: 300,
  /** Sheets and full-screen covers travelling the height of the device. */
  slow: 420,
} as const;

export const EASING = {
  /** Entering the screen: decelerate into place. */
  out: 'cubic-bezier(0.16, 1, 0.3, 1)',
  /** Leaving the screen: accelerate away. */
  in: 'cubic-bezier(0.7, 0, 0.84, 0)',
  /** Moving between two on-screen positions. */
  inOut: 'cubic-bezier(0.65, 0, 0.35, 1)',
} as const;

/**
 * The arrival spring (the designer's request: "a slight bounce, like Family's"). A
 * damped spring sampled from its own equation — damping ratio 0.82, stiff — so it is
 * physics, not a hand-drawn curve: 90% of the way in 85ms, past its mark by 1.1% at
 * 152ms, and settled (within 0.2%) by 224ms; the rest of the 360 is still. For
 * things ARRIVING: sheets, screens, the scanner's tray, toasts. Exits keep the
 * accelerating curve, and fades, colours, presses and numbers never bounce.
 * A first pair (5% and 2%, 480ms) was "exaggerated and slow afterwards": it peaked
 * past halfway and drifted back for ~200ms. Overshoot scales with distance; at 1.1%
 * it is ~3px on the tray, ~6px on a tall sheet, ~10px on a full-screen cover.
 * CSS `linear()` (Chrome 113, Safari 17.2); elsewhere a transition falls back to its
 * default timing.
 */
export const SPRING = {
  duration: 360,
  easing: 'linear(0, 0.0535, 0.1752, 0.3228, 0.4704, 0.6035, 0.7158, 0.8055, 0.8741, 0.9243, 0.9594, 0.9828, 0.9974, 1.0057, 1.0098, 1.0111, 1.0107, 1.0095, 1.0079, 1.0062, 1.0047, 1.0034, 1.0023, 1.0015, 1.0009, 1.0005, 1.0002, 1.0001, 1, 0.9999, 0.9999, 0.9999, 0.9999, 0.9999, 0.9999, 0.9999, 1)',
} as const;

/** iOS-style sheet presentation: in on the arrival spring, out on the accelerating curve. */
export const SHEET_SPRING = {
  duration: SPRING.duration,
  easing: SPRING.easing,
  /** Exits are faster than entrances and use the accelerating curve. */
  exitDuration: DURATION.base,
  exitEasing: EASING.in,
} as const;

/** Press scale for tappable surfaces. */
export const PRESS_SCALE = 0.97;

/**
 * Honours prefers-reduced-motion (CLAUDE.md:54). Call this rather than reading
 * DURATION directly in a transition so reduced-motion users get the state
 * change without the travel.
 */
export function duration(ms: number, reducedMotion: boolean): number {
  return reducedMotion ? 0 : ms;
}
