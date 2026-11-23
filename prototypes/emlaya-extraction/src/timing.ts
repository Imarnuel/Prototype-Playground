/**
 * How long each beat of the extraction loader DWELLS. Not transitions: every
 * transition here still runs on `shared/src/motion.ts` (DURATION / EASING), per the
 * working agreement's single motion set. These are hold times, and each is measured
 * off the reference video (8.2s, 60fps, sampled at 10 and 30fps) rather than chosen.
 *
 *   1.4s   tap; content blurs out ............................ 0.4s  → DURATION.slow
 *   1.9s   first line fades in from blur; glow rises ......... 0.5s  → DURATION.slow
 *   2.4s   shimmer sweeps the line, left to right ........... ~0.7s
 *   3.75s  line swaps: old blurs out, new blurs in, overlap .. ~0.15s → DURATION.fast/base
 *   5.3s   result lands; glow blooms up over the screen ...... 0.5s  → DURATION.slow
 *   5.8s   bloom clears and the content sharpens ............. 0.4s  → DURATION.slow
 *
 * Lines held 1.85s and 1.55s in the reference.
 */
export const DWELL = {
  /** The screen as it arrives from Confirm, sharp, before the loader takes it over. */
  arrive: 280,
  /** Each status line, start to start. The reference's two lines average 1.7s. */
  line: 1700,
  /**
   * A line is never cut before it can be read: when the result lands early in a line,
   * it waits until the line has been up this long. Caps the artificial delay a fast
   * extraction pays at 0.9s.
   */
  minReadable: 900,
  /** The bloom (A) or the check (B) holds this long before the content is revealed. */
  resolve: 520,
} as const;

/** The shimmer: a pause after the line lands, then a sweep, repeating while it holds. */
export const SHIMMER = {
  delay: 350,
  sweep: 750,
  cycle: 1600,
} as const;

/**
 * Content blur under the loader. 10px is matched against the Figma frame's own render
 * (see BUILD-PLAN.md, "Blur radius"), not the 3px its backdrop-blur property states.
 */
export const VEIL_BLUR = 10;
