/**
 * Generates src/tokens/tokens.ts and tokens.css from figma-variables.json.
 *
 * The JSON is the verbatim get_variable_defs output and the only source of truth.
 * Nothing here invents or rounds a value — root agreement §2, never guess. A token
 * this script cannot resolve is reported and left out rather than filled in.
 */
import fs from 'node:fs';
import path from 'node:path';
import { adjustDark } from './dark-adjust.mjs';

const dir = path.join(import.meta.dirname, '..', 'src', 'tokens');
const { variables: V, _source } = JSON.parse(fs.readFileSync(path.join(dir, 'figma-variables.json'), 'utf8'));

/** Figma name -> a JS-safe key: 'Color/text/on-disabled' -> 'onDisabled' under text. */
const camel = (s) => s.replace(/[^a-zA-Z0-9]+(.)?/g, (_, c) => (c ? c.toUpperCase() : '')).replace(/^(.)/, (c) => c.toLowerCase());

const FONT_RE = /^Font\(family: (?:"([^"]*)"|([^,]+)), style: ([^,]+), size: ([^,]+), weight: ([^,]+), lineHeight: ([^,]+), letterSpacing: (.+)\)$/;

const unresolved = [];
/** A composed style references other variables by name; resolve each through V. */
const resolve = (raw, field, styleName) => {
  const t = raw.trim();
  if (/^-?[\d.]+$/.test(t)) return Number(t);
  if (V[t] !== undefined) {
    const v = V[t];
    return /^-?[\d.]+$/.test(v) ? Number(v) : v;
  }
  unresolved.push(`${styleName}.${field} -> "${t}"`);
  return null;
};

/* The variable dump writes letter-spacing as a bare number and drops its unit. Two
   styles in this file are PERCENT, read off the style objects themselves
   (`getStyleByIdAsync(...).letterSpacing.unit`); every other one is pixels. A bare
   -2 taken as pixels set Body/Reg/Large six times too tight. */
const PERCENT_LETTER_SPACING = new Set(['Body/Reg/Large', 'H/6']);

const type = {};
for (const [name, raw] of Object.entries(V)) {
  const m = typeof raw === 'string' && raw.match(FONT_RE);
  if (!m) continue;
  const [, quotedFam, refFam, style, size, weight, lineHeight, letterSpacing] = m;
  // Figma QUOTES the family even when it holds a variable reference, so a quoted
  // value is not necessarily a literal — it has to be looked up before use, or the
  // style ends up with the variable's own name as its font family.
  const famRaw = (quotedFam ?? refFam).trim();
  const family = V[famRaw] ?? famRaw;
  const refs = [famRaw, style, size, lineHeight, letterSpacing].filter((f) => V[String(f).trim()] !== undefined);
  type[name] = {
    family,
    style: V[style.trim()] ?? style.trim(),
    size: resolve(size, 'size', name),
    weight: Number(weight.trim()),
    lineHeight: resolve(lineHeight, 'lineHeight', name),
    letterSpacing: PERCENT_LETTER_SPACING.has(name)
      ? (resolve(letterSpacing, 'letterSpacing', name) * resolve(size, 'size', name)) / 100
      : resolve(letterSpacing, 'letterSpacing', name),
    /** True where one or more fields came from a primitive variable rather than a literal. */
    composed: refs.length > 0,
  };
}

const pick = (prefix) => Object.entries(V).filter(([k]) => k.startsWith(prefix));

// Semantic colours nest by path: Color/text/accent/aqua -> color.text.accent.aqua
const color = {};
for (const [k, v] of pick('Color/')) {
  // Some variables under Color/ hold NUMBERS, not colours — letter-spacing values
  // filed under an accent-colour path upstream. Skipped before the tree is walked,
  // so they never create a phantom branch in `color`.
  if (/^-?[\d.]+$/.test(v)) continue;
  const parts = k.slice('Color/'.length).split('/').map(camel);
  let node = color;
  parts.slice(0, -1).forEach((p) => { node[p] = node[p] ?? {}; node = node[p]; });
  node[parts.at(-1)] = v;
}
const colorNumeric = pick('Color/').filter(([, v]) => /^-?[\d.]+$/.test(v));

const flat = (prefix, strip) => Object.fromEntries(
  pick(prefix).map(([k, v]) => [camel(k.slice(strip.length)), /^-?[\d.]+$/.test(v) ? Number(v) : v]),
);

const spacing = flat('Spacing/', 'Spacing/');
const radius = flat('Border radius/', 'Border radius/');
const borderWidth = flat('Border width/', 'Border width/');
const shadow = Object.fromEntries(pick('Shadow/').map(([k, v]) => [camel(k.slice('Shadow/'.length)), v]));

/** Figma Effect(...) -> a CSS box-shadow list. Spread maps to the 4th length. */
const effectToCss = (raw) => raw.split('); ').map((part) => {
  const m = part.match(/color: (#[0-9A-Fa-f]+), offset: \((-?[\d.]+), (-?[\d.]+)\), radius: (-?[\d.]+), spread: (-?[\d.]+)/);
  if (!m) return null;
  const [, hex, x, y, blur, spread] = m;
  // Figma writes 8-digit #RRGGBBAA; CSS accepts it directly.
  return `${x}px ${y}px ${blur}px ${spread}px ${hex.toLowerCase()}`;
}).filter(Boolean).join(', ');

const json = (o) => JSON.stringify(o, null, 2).replace(/"([a-zA-Z][a-zA-Z0-9]*)":/g, '$1:');

const ts = `/**
 * Freshvale Supermart design tokens — GENERATED, do not edit.
 *
 * Source: \`figma-variables.json\`, the verbatim \`get_variable_defs\` output for
 * ${_source.nodeName} (\`${_source.nodeId}\`). Regenerate with \`npm run tokens:gen\`.
 *
 * Every value here is \`[var]\` — a real Figma variable, not read off a frame.
 *
 * Known problems in the upstream system are documented in TOKENS.md and are
 * surfaced rather than normalised here (root agreement §3).
 */

export const color = ${json(color)} as const;

export const spacing = ${json(spacing)} as const;

export const radius = ${json(radius)} as const;

export const borderWidth = ${json(borderWidth)} as const;

/** Raw Figma effect strings, kept verbatim; \`shadowCss\` has the CSS equivalents. */
export const shadow = ${json(shadow)} as const;

export const shadowCss = ${json(Object.fromEntries(Object.entries(shadow).map(([k, v]) => [k, effectToCss(v)])))} as const;

export type TypeStyle = {
  family: string;
  style: string;
  size: number;
  weight: number;
  /**
   * In px for every style EXCEPT \`H/6\`, where Figma holds 1.4 — a unitless ratio.
   * Rendering a ratio as px (or px as a ratio) is the line-height trap in the root
   * agreement; \`lineHeightCss\` resolves it per style instead of at the call site.
   */
  lineHeight: number;
  letterSpacing: number;
  /** True where the style is composed from primitives rather than holding literals. */
  composed: boolean;
};

export const type: Record<string, TypeStyle> = ${json(type)};

/**
 * line-height as a CSS value. A value under 4 is treated as a ratio and emitted
 * unitless; everything else is px. The threshold is safe because the smallest px
 * line-height in this system is 16.
 */
export function lineHeightCss(style: TypeStyle): string {
  return style.lineHeight < 4 ? String(style.lineHeight) : \`\${style.lineHeight}px\`;
}

/** Everything needed to render a type style, as a style object. */
export function typeStyle(name: keyof typeof type): {
  fontFamily: string; fontSize: string; fontWeight: number; lineHeight: string; letterSpacing: string;
} {
  const s = type[name];
  return {
    fontFamily: \`"\${s.family}", -apple-system, system-ui, sans-serif\`,
    fontSize: \`\${s.size}px\`,
    fontWeight: s.weight,
    lineHeight: lineHeightCss(s),
    letterSpacing: \`\${s.letterSpacing}px\`,
  };
}

/**
 * Tokens that sit OUTSIDE the semantic \`Color/*\` system — leftovers from other
 * libraries, kept so a frame referencing one still resolves. Prefer the semantic
 * token with the same value. See TOKENS.md for which to use.
 */
export const legacyColor = ${json(Object.fromEntries(
  Object.entries(V).filter(([k, v]) => typeof v === 'string' && v.startsWith('#') && !k.startsWith('Color/'))
    .map(([k, v]) => [camel(k), v]),
))} as const;
`;

fs.writeFileSync(path.join(dir, 'tokens.ts'), ts);

// CSS custom properties, from the same source.
const lines = ['/* GENERATED from figma-variables.json by scripts/gen-tokens.mjs. Do not edit. */', ':root {'];
const walk = (o, trail) => Object.entries(o).forEach(([k, v]) =>
  typeof v === 'object' ? walk(v, [...trail, k]) : lines.push(`  --color-${[...trail, k].join('-').toLowerCase()}: ${v};`));
walk(color, []);
Object.entries(spacing).forEach(([k, v]) => lines.push(`  --spacing-${k}: ${v}px;`));
Object.entries(radius).forEach(([k, v]) => lines.push(`  --radius-${k}: ${v}px;`));
Object.entries(borderWidth).forEach(([k, v]) => lines.push(`  --border-width-${k}: ${v}px;`));
Object.entries(shadow).forEach(([k, v]) => lines.push(`  --shadow-${k}: ${effectToCss(v)};`));
Object.entries(type).forEach(([k, s]) => {
  // Case is PRESERVED here. Upstream has styles differing only by case with
  // different metrics (Heading/H4 is 14/20, Heading/h4 is 20/24); lowercasing
  // collapses them onto one property name and silently drops one. CSS custom
  // properties are case-sensitive, so keeping the Figma casing is lossless and
  // avoids inventing a disambiguating name.
  const id = k.replace(/[^a-zA-Z0-9]+/g, '-');
  lines.push(`  --type-${id}-size: ${s.size}px;`);
  lines.push(`  --type-${id}-line-height: ${s.lineHeight < 4 ? s.lineHeight : `${s.lineHeight}px`};`);
  lines.push(`  --type-${id}-letter-spacing: ${s.letterSpacing}px;`);
  lines.push(`  --type-${id}-weight: ${s.weight};`);
});
lines.push('}', '');

/* Dark mode: the library's Semantic collection carries a second mode, "Dark"
   (`255:1`). get_variable_defs resolves only the mode a node is in, so these were read
   through the plugin API, one line per variable — name|light|dark|the primitive dark
   aliases — and checked against an FNV-1a sum computed in Figma (baa587f4). Only the
   colours this app already carries get a dark value; the light column must agree with
   the dump above or the generator stops. */
const darkRows = fs.readFileSync(path.join(dir, 'figma-variables-dark.txt'), 'utf8').trim().split('\n').map((l) => l.split('|'));
const darkLines = [];
const lightDisagrees = [];
for (const [name, light, dark] of darkRows) {
  if (V[name] === undefined || /^-?[\d.]+$/.test(V[name])) continue;
  if (V[name].toLowerCase() !== light) lightDisagrees.push(`${name}: dump ${V[name]}, Figma ${light}`);
  // The designer's adjustments on top of the library's value (dark-adjust.mjs).
  darkLines.push(`  --color-${name.slice('Color/'.length).split('/').map(camel).join('-').toLowerCase()}: ${adjustDark(light, dark)};`);
}
if (lightDisagrees.length) throw new Error(`light values disagree:\n${lightDisagrees.join('\n')}`);
// A primitive (outside Semantic) has one mode and keeps its value in both themes.
const darkNames = new Set(darkRows.map(([n]) => n));
const singleMode = Object.entries(V).filter(([k, v]) => k.startsWith('Color/') && !/^-?[\d.]+$/.test(v) && !darkNames.has(k)).map(([k]) => k);
const lightCount = lines.filter((l) => l.startsWith('  --color-')).length;
if (darkLines.length + singleMode.length !== lightCount) throw new Error(`dark covers ${darkLines.length} of ${lightCount} colours`);
lines.push(":root[data-theme='dark'] {", '  color-scheme: dark;', ...darkLines, '}', '');
fs.writeFileSync(path.join(dir, 'tokens.css'), lines.join('\n'));

const countColors = (o) => Object.values(o).reduce((a, v) => a + (typeof v === 'object' ? countColors(v) : 1), 0);
console.log(`tokens.ts + tokens.css generated`);
console.log(`  semantic colours : ${countColors(color)} (dark: ${darkLines.length}; one mode, same in both: ${singleMode.join(', ')})`);
console.log(`  legacy colours   : ${Object.keys(JSON.parse(json(Object.fromEntries(Object.entries(V).filter(([k, v]) => typeof v === 'string' && v.startsWith('#') && !k.startsWith('Color/')).map(([k, v]) => [camel(k), v]))).replace(/([a-zA-Z][a-zA-Z0-9]*):/g, '"$1":'))).length}`);
console.log(`  spacing/radius/border-width/shadow : ${Object.keys(spacing).length}/${Object.keys(radius).length}/${Object.keys(borderWidth).length}/${Object.keys(shadow).length}`);
console.log(`  type styles      : ${Object.keys(type).length} (${Object.values(type).filter((t) => t.composed).length} composed from primitives)`);
console.log(`  CSS custom properties : ${lines.filter((l) => l.startsWith('  --')).length}`);
if (colorNumeric.length) {
  console.log(`\n  MIS-NAMESPACED (numeric values under Color/, excluded from \`color\`):`);
  colorNumeric.forEach(([k, v]) => console.log(`    ${k} = ${v}`));
}
if (unresolved.length) { console.log(`\n  UNRESOLVED:`); unresolved.forEach((u) => console.log(`    ${u}`)); }
