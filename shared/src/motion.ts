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
 * damped spring sampled from its own equation — damping ratio 0.69 — so it is
 * physics, not a hand-drawn curve: 90% of the way by a third of the duration, past
 * its mark by 5% just after halfway, and settled at the end. For things ARRIVING:
 * sheets, screens, the scanner's tray, toasts. Exits keep the accelerating curve,
 * and fades, colours, presses and numbers never bounce. CSS `linear()` (Chrome 113,
 * Safari 17.2); elsewhere a transition falls back to its default timing.
 */
export const SPRING = {
  duration: 480,
  /**
   * The same spring, firmer (damping ratio 0.78): 2% past its mark. For anything
   * travelling more than ~200px — every sheet, a full-screen cover, the scanner's
   * tray — where 5% of the distance was 17-43px and read as a lurch rather than a
   * settle. Overshoot scales with distance; the visible bounce should not: this
   * keeps it to ~5-17px across them. `easing` (5%) is for short travels — a toast, a
   * footer rising — where 5% is a few px.
   */
  firm: 'linear(0, 0.0189, 0.0678, 0.1367, 0.2178, 0.3047, 0.3928, 0.4785, 0.5596, 0.6342, 0.7016, 0.7612, 0.8131, 0.8575, 0.8949, 0.9258, 0.9509, 0.9709, 0.9865, 0.9983, 1.007, 1.013, 1.0169, 1.0192, 1.0201, 1.0201, 1.0193, 1.0181, 1.0165, 1.0148, 1.013, 1.0113, 1.0096, 1.008, 1.0066, 1.0053, 1.0042, 1.0033, 1.0024, 1.0018, 1)',
  easing: 'linear(0, 0.0169, 0.0618, 0.1267, 0.2047, 0.2904, 0.379, 0.4672, 0.5521, 0.6317, 0.7046, 0.7702, 0.8279, 0.8777, 0.9199, 0.9548, 0.983, 1.0053, 1.0221, 1.0343, 1.0426, 1.0475, 1.0498, 1.0499, 1.0483, 1.0456, 1.042, 1.0379, 1.0335, 1.0291, 1.0247, 1.0206, 1.0167, 1.0132, 1.0101, 1.0074, 1.0051, 1.0032, 1.0016, 1.0003, 1)',
} as const;

/** iOS-style sheet presentation: in on the firm arrival spring, out on the accelerating curve. */
export const SHEET_SPRING = {
  duration: SPRING.duration,
  easing: SPRING.firm,
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
