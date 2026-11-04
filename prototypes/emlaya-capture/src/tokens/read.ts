/**
 * Reading tokens from JS. Every number a script needs — a duration, a delay, a physics
 * constant — is a custom property in tokens.css / tokens.gaps.css, read here through
 * getComputedStyle, so the stylesheets stay the single source and `check:tokens` can
 * hold the line on literals.
 */

function raw(name: string, el: Element = document.documentElement): string {
  return getComputedStyle(el).getPropertyValue(name).trim();
}

/** A duration token (`300ms`, `40s`) in milliseconds. */
export function tokenMs(name: string, el?: Element): number {
  const v = raw(name, el);
  const n = parseFloat(v);
  if (Number.isNaN(n)) throw new Error(`Token ${name} is not a duration: "${v}"`);
  return v.endsWith('ms') ? n : v.endsWith('s') ? n * 1000 : n;
}

/** A unitless or px token as a number. */
export function tokenNumber(name: string, el?: Element): number {
  const v = raw(name, el);
  const n = parseFloat(v);
  if (Number.isNaN(n)) throw new Error(`Token ${name} is not a number: "${v}"`);
  return n;
}

/** A [min, max] range declared as `<name>-min` / `<name>-max`. */
export function tokenRange(name: string, el?: Element): [number, number] {
  return [tokenNumber(`${name}-min`, el), tokenNumber(`${name}-max`, el)];
}

/**
 * A comma-separated list of colour tokens, resolved to concrete colours. Resolving goes
 * through a probe element because getComputedStyle does not resolve var() inside a
 * custom property's own value.
 */
export function tokenColorList(name: string): string[] {
  const list = raw(name).split(/,(?![^(]*\))/).map((s) => s.trim()).filter(Boolean);
  const probe = document.createElement('span');
  document.body.appendChild(probe);
  const out = list.map((value) => {
    probe.style.color = value;
    return getComputedStyle(probe).color;
  });
  probe.remove();
  return out;
}

/**
 * Resolves colour tokens to concrete colours a canvas can use, through ONE probe kept in
 * the document while it is used: appending a fresh element per token invalidates the
 * whole tree each time, and 40 of those blocked the celebration's exit for a frame.
 */
export function colorResolver(): { color: (name: string) => string; done: () => void } {
  const probe = document.createElement('span');
  probe.style.display = 'none';
  document.body.appendChild(probe);
  return {
    color: (name) => {
      probe.style.color = `var(${name})`;
      return getComputedStyle(probe).color;
    },
    done: () => probe.remove(),
  };
}

/** A raw token value (a font stack, say), unparsed. */
export function tokenString(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
