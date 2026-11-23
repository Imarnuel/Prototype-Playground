/**
 * Evaluates one of the project's `cubic-bezier(...)` EASING strings in JS, so values
 * a shader animates (which CSS cannot reach) travel on the same curves as everything
 * CSS animates. Parses the token rather than restating its numbers.
 */
export function easingFn(css: string): (t: number) => number {
  const m = /cubic-bezier\(([^)]+)\)/.exec(css);
  if (!m) throw new Error(`Not a cubic-bezier easing: ${css}`);
  const [x1, y1, x2, y2] = m[1].split(',').map(Number);

  const bx = (t: number) => 3 * x1 * t * (1 - t) ** 2 + 3 * x2 * t ** 2 * (1 - t) + t ** 3;
  const by = (t: number) => 3 * y1 * t * (1 - t) ** 2 + 3 * y2 * t ** 2 * (1 - t) + t ** 3;
  const dbx = (t: number) =>
    3 * x1 * (1 - t) ** 2 + 6 * (x2 - x1) * t * (1 - t) + 3 * (1 - x2) * t ** 2;

  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    // Newton on x(t) = x, then bisection if the slope is too flat to trust.
    let t = x;
    for (let i = 0; i < 8; i++) {
      const err = bx(t) - x;
      if (Math.abs(err) < 1e-5) return by(t);
      const d = dbx(t);
      if (Math.abs(d) < 1e-6) break;
      t -= err / d;
    }
    let lo = 0;
    let hi = 1;
    t = x;
    for (let i = 0; i < 30; i++) {
      const v = bx(t);
      if (Math.abs(v - x) < 1e-5) break;
      if (v < x) lo = t;
      else hi = t;
      t = (lo + hi) / 2;
    }
    return by(t);
  };
}
