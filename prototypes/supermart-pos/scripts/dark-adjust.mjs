/**
 * The designer's adjustments to the library's Dark mode, applied where the dark
 * values are generated (gen-tokens, gen-icons) so CSS and the icon copies agree.
 *
 * Every token whose LIGHT value is the brand colour (#2c4a8b) is 3 points of HSL
 * lightness darker in dark mode than the library's value — the designer's call: the
 * dark brand read too light. Nothing else is touched.
 */
export const BRAND_LIGHT = '#2c4a8b';
export const BRAND_DARKEN = 3;

/** `hex` with its HSL lightness lowered by `points` (0-100). */
export function darken(hex, points) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  const h = d === 0 ? 0 : max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  const L = Math.max(0, l - points / 100);
  const c = (1 - Math.abs(2 * L - 1)) * s, x = c * (1 - Math.abs((h % 2 + 2) % 2 - 1)), m = L - c / 2;
  const [r1, g1, b1] = h < 1 ? [c, x, 0] : h < 2 ? [x, c, 0] : h < 3 ? [0, c, x] : h < 4 ? [0, x, c] : h < 5 ? [x, 0, c] : [c, 0, x];
  return '#' + [r1, g1, b1].map((v) => Math.round((v + m) * 255).toString(16).padStart(2, '0')).join('') + hex.slice(7);
}

/** The dark value the app uses for a token, given its light and library dark values. */
export const adjustDark = (light, dark) => (light.toLowerCase() === BRAND_LIGHT ? darken(dark, BRAND_DARKEN) : dark);
