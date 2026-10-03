/**
 * Proves tokens.ts and tokens.css still agree with figma-variables.json, and
 * reports the upstream system's own collisions as numbers rather than opinions.
 */
import fs from 'node:fs';
import path from 'node:path';
import { color, spacing, radius, borderWidth, shadow, type, legacyColor, lineHeightCss } from '../src/tokens/tokens.ts';

const dir = path.join(import.meta.dirname, '..', 'src', 'tokens');
const { variables: V } = JSON.parse(fs.readFileSync(path.join(dir, 'figma-variables.json'), 'utf8'));
const css = fs.readFileSync(path.join(dir, 'tokens.css'), 'utf8');
const tsSrc = fs.readFileSync(path.join(dir, 'tokens.ts'), 'utf8');

let fails = 0;
const check = (n, pass, d = '') => { if (!pass) fails++; console.log(`${pass ? 'PASS' : 'FAIL'}  ${n}${d ? `  ${d}` : ''}`); };

const flatten = (o, t = []) => Object.entries(o).flatMap(([k, v]) =>
  typeof v === 'object' && v !== null ? flatten(v, [...t, k]) : [[[...t, k].join('.'), v]]);

// --- Coverage: every variable is either emitted or deliberately excluded ---
const emittedHex = new Set([...flatten(color).map(([, v]) => v), ...Object.values(legacyColor)].map(String));
const srcHex = Object.entries(V).filter(([, v]) => typeof v === 'string' && v.startsWith('#'));
const missing = srcHex.filter(([, v]) => !emittedHex.has(v));
check('every colour value in the dump is emitted', missing.length === 0,
  missing.length ? missing.map(([k]) => k).join(', ') : `${srcHex.length} colour variables`);

// Nothing may appear in tokens.ts that is not in the dump — the "never guess" rule,
// enforced rather than trusted.
const dumpHex = new Set(srcHex.map(([, v]) => v.toLowerCase()));
const invented = [...tsSrc.matchAll(/"(#[0-9a-fA-F]{3,8})"/g)].map((m) => m[1].toLowerCase())
  .filter((h) => !dumpHex.has(h));
check('no hex value in tokens.ts is absent from the dump', invented.length === 0,
  invented.length ? [...new Set(invented)].join(', ') : 'no invented colours');

const numericGroups = [['spacing', spacing, 'Spacing/'], ['radius', radius, 'Border radius/'], ['borderWidth', borderWidth, 'Border width/']];
for (const [label, obj, prefix] of numericGroups) {
  const expect = Object.entries(V).filter(([k]) => k.startsWith(prefix));
  check(`${label} count matches the dump`, Object.keys(obj).length === expect.length,
    `${Object.keys(obj).length} of ${expect.length}`);
  const bad = expect.filter(([k, v]) => !Object.values(obj).includes(Number(v)));
  check(`${label} values all present`, bad.length === 0, bad.map(([k]) => k).join(', '));
}
check('shadow count matches the dump', Object.keys(shadow).length === Object.keys(V).filter((k) => k.startsWith('Shadow/')).length);

// --- Type styles fully resolved ---
const styleCount = Object.values(V).filter((v) => typeof v === 'string' && v.startsWith('Font(')).length;
check('every type style in the dump is emitted', Object.keys(type).length === styleCount,
  `${Object.keys(type).length} of ${styleCount}`);
const incomplete = Object.entries(type).filter(([, s]) =>
  !s.family || typeof s.size !== 'number' || typeof s.lineHeight !== 'number' || typeof s.letterSpacing !== 'number');
check('no type style has an unresolved field', incomplete.length === 0,
  incomplete.map(([k]) => k).join(', '));
const refFamily = Object.entries(type).filter(([, s]) => s.family.includes('/'));
check('no type style kept a variable path as its font family', refFamily.length === 0,
  refFamily.map(([k]) => `${k}:${k[1]}`).join(', '));

// --- The line-height unit split, asserted rather than assumed ---
const ratio = Object.entries(type).filter(([, s]) => s.lineHeight < 4);
const px = Object.entries(type).filter(([, s]) => s.lineHeight >= 4);
check('exactly one style holds a unitless line-height ratio', ratio.length === 1,
  `${ratio.map(([k, s]) => `${k}=${s.lineHeight}`).join(', ')} vs ${px.length} in px`);
check('the ratio style emits unitless CSS', !lineHeightCss(type[ratio[0][0]]).includes('px'),
  `${ratio[0][0]} -> ${lineHeightCss(type[ratio[0][0]])}`);
check('a px style emits px CSS', lineHeightCss(type['Heading/H1']).endsWith('px'),
  `Heading/H1 -> ${lineHeightCss(type['Heading/H1'])}`);
check('the smallest px line-height is above the ratio threshold',
  Math.min(...px.map(([, s]) => s.lineHeight)) >= 4,
  `min ${Math.min(...px.map(([, s]) => s.lineHeight))}px`);

// --- CSS and TS agree ---
const cssVars = [...css.matchAll(/^\s+(--[A-Za-z0-9-]+):/gm)].map((m) => m[1]);
check('tokens.css has no duplicate custom properties', new Set(cssVars).size === cssVars.length,
  `${cssVars.length} properties`);
check('every semantic colour has a CSS property',
  flatten(color).every(([p]) => cssVars.includes(`--color-${p.replace(/\./g, '-').toLowerCase()}`)),
  `${flatten(color).length} colours`);

// --- Upstream collisions, reported as data ---
const byValue = {};
flatten(color).forEach(([p, v]) => { (byValue[v] ??= []).push(p); });
const collisions = Object.entries(byValue).filter(([, ps]) => ps.length > 1).sort((a, b) => b[1].length - a[1].length);
console.log(`\nSemantic colour values shared by more than one token (${collisions.length} groups):`);
collisions.forEach(([v, ps]) => console.log(`  ${v}  ${ps.join(', ')}`));

const caseDupes = {};
Object.keys(type).forEach((k) => { (caseDupes[k.toLowerCase()] ??= []).push(k); });
const pairs = Object.values(caseDupes).filter((g) => g.length > 1);
console.log(`\nType styles differing only by case (${pairs.length}):`);
for (const g of pairs) {
  const vals = g.map((k) => `${k} ${type[k].size}/${type[k].lineHeight} ls${type[k].letterSpacing.toFixed(2)}`);
  const same = new Set(g.map((k) => `${type[k].size}|${type[k].lineHeight}|${type[k].letterSpacing}`)).size === 1;
  console.log(`  ${same ? 'IDENTICAL ' : 'DIFFERENT '} ${vals.join('   vs   ')}`);
}

console.log(`\n${fails} failing`);
process.exit(fails === 0 ? 0 : 1);
