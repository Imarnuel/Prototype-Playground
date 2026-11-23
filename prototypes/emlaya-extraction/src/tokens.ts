/**
 * Emlaya Design library variables, as `get_variable_defs` returned them for frame
 * `4653:68091` (file `LPXddONZ7IMNlIowbz161x`). Every value is `[var]`: read off a
 * bound variable, not off a rendered colour. Names keep the library's own paths so
 * a value can be traced back without a lookup table.
 *
 * Only the variables the frame binds are here. The library has more; none were
 * guessed to fill gaps.
 */
export const color = {
  surfaceDefault: '#ffffff', // theme.colors.surfaceDefault
  surfaceSecondary: '#f6f3ef', // theme.colors.surfaceSecondary
  surfaceOverlayDefault: '#ffffff', // theme.colors.surfaceOverlayDefault
  containerInverse: '#ffffff', // theme.colors.containerInverse
  containerNeutralSubtle: 'rgba(54, 42, 18, 0.06)', // theme.colors.containerNeutralSubtle #362a120f
  containerNeutral: 'rgba(44, 39, 27, 0.1)', // theme.colors.containerNeutral #2c271b1a
  containerBrand: '#fff9d1', // theme.colors.containerBrand
  containerBrandBold: '#ffc412', // theme.colors.containerBrandBold
  borderSubtle: 'rgba(54, 42, 18, 0.06)', // theme.colors.borderSubtle #362a120f
  borderBrand: '#feb007', // theme.colors.borderBrand
  buttonHighlight: '#ffffff', // Color/button-highlight
  textDefault: '#2c271b', // theme.colors.textDefault
  textSecondary: '#524a37', // theme.colors.textSecondary
  textSubtle: '#7a7466', // theme.colors.textSubtle
  iconDefault: '#393121', // theme.colors.iconDefault
  iconSubtle: '#7a7466', // theme.colors.iconSubtle
  iconSubtlest: '#aea89b', // theme.colors.iconSubtlest
  iconBrand: '#feb007', // theme.colors.iconBrand
} as const;

export const font = {
  heading: "'Zalando Sans SemiExpanded', sans-serif", // theme.fontFamilies.headingSemiBold
  body: "'Geist', sans-serif", // theme.fontFamilies.bodyRegular / labelMedium
} as const;

/** Text styles: size / line-height / letter-spacing / weight, from the frame's styles. */
export const text = {
  headingH3: { size: 17, lineHeight: 22, tracking: -0.2, weight: 600 }, // Heading/h3
  largeInput: { size: 22, lineHeight: 28, tracking: -0.32, weight: 600 }, // Large input
  labelXsmall: { size: 12, lineHeight: 16, tracking: 0, weight: 500 }, // Label/xsmall
  labelBase: { size: 15, lineHeight: 18, tracking: -0.1, weight: 500 }, // Label/base
  /* Label/large. Its size is bound to bodyLarge.fontSize, which get_variable_defs
     resolves to 15 — yet the item rows' own fallback in the design context reads 17.
     The variable wins; the conflict is logged in BUILD-PLAN.md. */
  labelLarge: { size: 15, lineHeight: 22, tracking: -0.1, weight: 500 },
  bodyBase: { size: 15, lineHeight: 18, tracking: 0, weight: 400 }, // Body/base
  bodySmall: { size: 13, lineHeight: 18, tracking: 0, weight: 400 }, // Body/small
} as const;

export const space = { s0: 0, s25: 2, s50: 4, s100: 6, s200: 8, s300: 12, s400: 16 } as const;

export const radius = { r300: 12, r600: 24, r650: 28, full: 9999 } as const;

/** Effects as the frame draws them. Not bound to variables in the file; literal. */
export const shadow = {
  card: '0px 8px 28px -20px rgba(61, 51, 29, 0.08)',
  buttonIcon: '0px 2px 4px 2px rgba(44, 39, 27, 0.02), 0px 4px 8px 3px rgba(51, 41, 20, 0.05)',
  xs: '0px 1px 2px 0px rgba(10, 13, 18, 0.05)', // Shadow/xs
  pill: '0px 0px 0.5px 0.5px rgba(0, 0, 0, 0.09), 0px 4px 12px -4px rgba(61, 51, 29, 0.15), 0px 16px 32px 0px rgba(61, 51, 29, 0.15)',
} as const;
