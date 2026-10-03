/**
 * iPhone 15 Pro hardware metrics.
 *
 * Every number below is either taken from CLAUDE.md "Device metrics (iOS)" or
 * derived from those figures at runtime. Nothing here is eyeballed, and nothing
 * is a rounded pixel value copied out of a calculator — the derivation stays in
 * code so the chain back to the source figures is auditable.
 */

/** Logical screen, in pt. A Figma frame of this size is the screen, not the device. */
export const SCREEN = { width: 393, height: 852 } as const;

/** Physical figures, in mm, from CLAUDE.md: body 70.60x146.67 around a 65.10x141.14 display. */
const DISPLAY_MM = { width: 65.1, height: 141.14 } as const;
const BEZEL_MM = 2.75;

/**
 * px/mm is derived from the screen WIDTH, as CLAUDE.md requires.
 *
 * Width is the axis that closes exactly: 70.60mm * pxPerMm == 393 + 2*bezel to
 * within floating-point noise. The height axis does not close quite as cleanly
 * — 141.14mm maps to 852.043px against a 852pt logical screen (0.005% high), so
 * deriving the body height from 146.67mm would give 885.427px while a uniform
 * bezel around 852 gives 885.203px. We take the uniform-bezel value: CLAUDE.md
 * specifies "a uniform 2.75 mm bezel", and a 0.224px asymmetry in the bezel is
 * more visible than a 0.224px error in overall body height.
 */
export const PX_PER_MM = SCREEN.width / DISPLAY_MM.width;

/** Uniform bezel, in px. ~16.601 at this screen size. */
export const BEZEL = BEZEL_MM * PX_PER_MM;

export const BODY = {
  width: SCREEN.width + BEZEL * 2,
  height: SCREEN.height + BEZEL * 2,
} as const;

/**
 * Display corner radius, in pt.
 *
 * NOT SOURCED FROM CLAUDE.md. The agreement gives the rule for the outer radius
 * ("outer radius = screen radius + bezel") but never states the screen radius
 * itself. 55pt is the iPhone 15 Pro's documented display corner radius. Flagged
 * rather than silently absorbed: if a design supplies its own radius, this is
 * the one device number here that should be replaced, not adjusted around.
 */
export const SCREEN_RADIUS = 55;

/** Concentric with the screen corners, per CLAUDE.md. ~71.601 at this bezel. */
export const BODY_RADIUS = SCREEN_RADIUS + BEZEL;

/**
 * Safe-area insets, in pt.
 *
 * top: 59 for a Dynamic Island device (CLAUDE.md:135). Sanity check — the island
 * occupies 11..47.67, so 59 clears its bottom edge by 11.33, near-symmetric with
 * the 11 above it. That coherence is why 59 and not 47 is right here.
 *
 * bottom: NOT SOURCED FROM CLAUDE.md. 34pt is the standard iOS home-indicator
 * inset. Same status as SCREEN_RADIUS — real, but external to the agreement.
 */
export const SAFE_AREA = { top: 59, bottom: 34 } as const;

/**
 * Dynamic Island: 125 x 36.67pt, 11pt from the top, centred, fully rounded,
 * specified against a 393pt-wide screen. CLAUDE.md: scale the WIDTH by screen
 * width, keep the vertical values absolute. At 393 the scale factor is 1; the
 * expression is kept so a different screen width stays correct.
 */
const ISLAND_REFERENCE_WIDTH = 393;
const islandScale = SCREEN.width / ISLAND_REFERENCE_WIDTH;

export const DYNAMIC_ISLAND = {
  width: 125 * islandScale,
  height: 36.67,
  top: 11,
  get radius() {
    return this.height / 2;
  },
} as const;

/** iOS chrome values from CLAUDE.md:138. */
export const IOS = {
  /** Nav title: 17px semibold, centred. */
  navTitleSize: 17,
  navTitleWeight: 600,
  /** Minimum tap target. Expand with ::after { inset: -10px }, never by growing the glyph. */
  tapTarget: 44,
  tapTargetExpansion: -10,
} as const;
