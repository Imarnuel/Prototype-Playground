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
 * iOS-style sheet presentation: in on the decelerating curve, out on the accelerating
 * one. No overshoot: a bounce on arrivals was tried and taken out at the designer's
 * call ("I don't think it's needed").
 */
export const SHEET_SPRING = {
  duration: DURATION.slow,
  easing: EASING.out,
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
