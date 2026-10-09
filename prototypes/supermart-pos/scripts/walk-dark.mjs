/**
 * Dark mode, switched from the dev toolbar, proved on the DOM: the switch itself, all
 * 56 dark tokens resolved as the Figma file's Dark mode gives them, and then every
 * screen walked in dark for paint that stayed light — a colour that is a LIGHT value
 * and not also a dark one, on any visible element — text that falls below 3:1 on what
 * is actually behind it, and an icon still carrying its light glyph colour. Then the
 * choice survives a reload, and switching back restores light exactly.
 *
 *   node scripts/walk-dark.mjs [base-url]
 */
import fs from 'node:fs';
import path from 'node:path';
import pw from '/opt/node-tools/node_modules/playwright/index.js';

const BASE = process.argv[2] ?? 'http://127.0.0.1:4251/';
const browser = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let fails = 0;
const check = (n, pass, d = '') => { if (!pass) fails++; console.log(`${pass ? 'PASS' : 'FAIL'}  ${n}${d ? `  ${d}` : ''}`); };

const rows = fs.readFileSync(path.join(import.meta.dirname, '..', 'src', 'tokens', 'figma-variables-dark.txt'), 'utf8')
  .trim().split('\n').map((l) => l.split('|'));
const tokensCss = fs.readFileSync(path.join(import.meta.dirname, '..', 'src', 'tokens', 'tokens.css'), 'utf8');
const darkBlock = tokensCss.split(":root[data-theme='dark']")[1];
const darkVars = [...darkBlock.matchAll(/(--color-[\w-]+): (#[0-9a-f]+);/g)].map((m) => [m[1], m[2]]);
// Light-only: a value some token takes in light that no token takes in dark, plus the
// literals dark mode replaces (empty-state rings, the chip fade's #f9fafb).
const darkSet = new Set(rows.map((r) => r[2]));
const lightOnly = [...new Set([...rows.map((r) => r[1]), '#f2f2f3', '#dfe0e2', '#f9fafb'])]
  .filter((h) => !darkSet.has(h) && !/^#[0-9a-f]{6}00$/.test(h));
// The icon colours the dark copies replace (scripts/gen-icons.mjs).
const lightGlyph = ['#20293c', '#2c4a8b', '#5e6a82', '#9ea4b3', '#038c4e', '#d42189', '#c2261a'];

const page = await browser.newPage({ viewport: { width: 1200, height: 1100 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(`${BASE}?dev=1`, { waitUntil: 'networkidle' });
await page.evaluate(() => { try { localStorage.removeItem('supermart-pos.theme'); } catch {} });
await page.reload({ waitUntil: 'networkidle' });
await page.waitForSelector('.productCard');
const wait = (ms) => page.waitForTimeout(ms);
const openBar = async () => { await page.evaluate(() => { if (!document.querySelector('.devbar__panel[data-open="on"]')) document.querySelector('.devbar__handle').click(); }); await wait(450); };
const closeBar = async () => { await page.evaluate(() => { if (document.querySelector('.devbar__panel[data-open="on"]')) document.querySelector('.devbar__handle').click(); }); await wait(450); };
const pick = async (label) => {
  await openBar();
  await page.evaluate((l) => [...document.querySelectorAll('.devbar__item')].find((b) => b.firstChild.textContent.trim() === l).click(), label);
  await closeBar();
  await wait(900);
};
const root = (v) => page.evaluate((v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim(), v);

// --- The switch -------------------------------------------------------------------
check('opens light', (await page.evaluate(() => document.documentElement.dataset.theme)) === 'light' && (await root('--color-surface-default')) === '#ffffff',
  await root('--color-surface-default'));
await openBar();
await page.evaluate(() => [...document.querySelectorAll('.devbar__item')].find((b) => b.firstChild.textContent.trim() === 'Dark mode').click());
await wait(100);
const sw = await page.evaluate(() => {
  const b = [...document.querySelectorAll('.devbar__item')].find((x) => x.firstChild.textContent.trim() === 'Dark mode');
  return { pressed: b.getAttribute('aria-pressed'), state: b.querySelector('.devbar__state')?.textContent, open: !!document.querySelector('.devbar__panel[data-open="on"]'), theme: document.documentElement.dataset.theme };
});
check('the toolbar switch turns dark on, says so, and stays open', sw.pressed === 'true' && sw.state === 'On' && sw.open && sw.theme === 'dark', JSON.stringify(sw));
await closeBar();

const resolved = await page.evaluate((vars) => vars.map(([v]) => getComputedStyle(document.documentElement).getPropertyValue(v).trim()), darkVars);
const wrong = darkVars.filter(([, h], i) => resolved[i] !== h);
check('every dark token resolves to the file\'s Dark mode', darkVars.length === 56 && wrong.length === 0,
  wrong.length ? wrong.map(([v, h], i) => `${v} ${resolved[darkVars.indexOf([v, h])]} != ${h}`).join(', ') : `${darkVars.length} tokens`);
check('the status bar turns light over a dark screen', (await page.evaluate(() => document.querySelector('.statusBar')?.dataset.appearance)) === 'light');
const home = () => page.evaluate(() => {
  const s = document.querySelector('.device__screen').getBoundingClientRect();
  const h = document.querySelector('.device__homeIndicator'); const r = h.getBoundingClientRect();
  return `${r.left - s.left},${r.top - s.top},${r.width},${r.height} ${getComputedStyle(h).backgroundColor}`;
});
// The kit's Home Indicator, `I88:10767;106:60994`: 144x5, 8 from the bottom, centred.
check('the home indicator turns white over a dark screen', (await home()) === '124.5,839,144,5 rgb(255, 255, 255)', await home());
check('the device screen takes Color/surface/default', (await page.evaluate(() => getComputedStyle(document.querySelector('.device__screen')).backgroundColor)) === 'rgb(34, 35, 38)');

// --- Every screen ---------------------------------------------------------------------
const SCREENS = ['Sales point', 'Loading (skeleton)', 'Error', 'Cart: empty', 'Cart: fill with 4 lines', 'Cart: total expanded',
  'Quantity sheet', 'Item details: discount applied', 'Select customer', 'Select customer: empty', 'Customer added: toast',
  'More options', 'Apply discount: 10%', 'Cart: order discount applied', 'Checkout: cash with change', 'Select payment method',
  'Select bank', 'Transaction success', 'Receipt: bank transfer', 'Queued orders', 'Queued orders: empty',
  'Order has been queued: toast', 'Scanner: with items', 'Scanner: scan a brand label'];

const audit = () => page.evaluate(({ lightOnly, lightGlyph, darkValues }) => {
  const screen = document.querySelector('.device__screen');
  const sr = screen.getBoundingClientRect();
  const hex = (c) => {
    const m = c.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/); if (!m) return null;
    const h = (x) => Math.round(+x).toString(16).padStart(2, '0');
    const a = m[4] === undefined ? 1 : +m[4];
    return a === 0 ? null : '#' + h(m[1]) + h(m[2]) + h(m[3]) + (a < 1 ? h(a * 255) : '');
  };
  const rgb = (c) => c.match(/[\d.]+/g).map(Number);
  const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  // Out of scope: the camera, the receipt's paper, photos, and anything hidden.
  const skip = (el) => el.closest('.scanStage .scanner, .scanScene, .receipt, .devbar');
  const seen = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1 || r.right < sr.left || r.left > sr.right || r.bottom < sr.top || r.top > sr.bottom) return false;
    for (let e = el; e && e !== screen; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) return false;
    }
    return true;
  };
  const stale = [], faint = [], glyphs = [];
  for (const el of screen.querySelectorAll('*')) {
    if (skip(el) || !seen(el)) continue;
    const cs = getComputedStyle(el);
    const name = el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : el.tagName;
    const paints = [['bg', cs.backgroundColor]];
    if (parseFloat(cs.borderTopWidth) > 0) paints.push(['border', cs.borderTopColor]);
    for (const m of cs.boxShadow.matchAll(/rgba?\([^)]+\)/g)) paints.push(['shadow', m[0]]);
    const ownText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (ownText) paints.push(['text', cs.color]);
    if (el instanceof SVGElement) { paints.push(['fill', cs.fill]); paints.push(['stroke', cs.stroke]); }
    for (const [k, c] of paints) { const h = hex(c); if (h && lightOnly.includes(h)) stale.push(`${name} ${k} ${h}`); }
    // A fill near white at visible alpha — flat or a gradient's stop — is light paint
    // whatever token it came from; white is also a dark value (logo/text), so the hex
    // list alone would let a white wash through.
    const fills = [cs.backgroundColor, ...(cs.backgroundImage.match(/rgba?\([^)]+\)/g) ?? [])];
    for (const c of fills) {
      const v = c.match(/[\d.]+/g)?.map(Number); if (!v) continue;
      if ((v[3] ?? 1) > 0.05 && lum(v) > 0.8 && !darkValues.includes(hex(c))) stale.push(`${name} bright ${hex(c)}`);
    }
    // Inactive controls are exempt from contrast (WCAG 1.4.3), and the design's own
    // disabled pair (icon/disabled under text/on-disabled) is 1.67:1 in light as well.
    if (ownText && cs.color && !el.closest(':disabled, [aria-disabled="true"]')) {
      let bg = null;
      for (let e = el; e; e = e.parentElement) { const b = getComputedStyle(e).backgroundColor; const v = b.match(/[\d.]+/g)?.map(Number); if (v && (v.length === 3 || v[3] === 1)) { bg = v; break; } if (e === screen) break; }
      if (bg) {
        const [a, b] = [lum(rgb(cs.color)), lum(bg)];
        const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
        if (ratio < 3) faint.push(`${name} "${el.textContent.trim().slice(0, 24)}" ${ratio.toFixed(2)}`);
      }
    }
    if (el.matches('img.icon')) {
      const src = el.getAttribute('src');
      let svg = src.startsWith('data:') ? decodeURIComponent(src.slice(src.indexOf(',') + 1)) : null;
      glyphs.push({ name: el.className, src: svg ? null : src, svg });
    }
  }
  return { stale: [...new Set(stale)], faint: [...new Set(faint)], glyphs };
}, { lightOnly, lightGlyph, darkValues: [...darkSet] });

const fetched = new Map();
const glyphText = async (g) => {
  if (g.svg) return g.svg;
  if (!fetched.has(g.src)) fetched.set(g.src, await page.evaluate((u) => fetch(u).then((r) => r.text()), g.src));
  return fetched.get(g.src);
};

let iconCount = 0;
for (const s of SCREENS) {
  await pick(s);
  const { stale, faint, glyphs } = await audit();
  const lightIcons = [];
  for (const g of glyphs) {
    const t = (await glyphText(g)).toLowerCase().replace(/<(mask|clippath)\b[\s\S]*?<\/\1>/g, '');
    iconCount++;
    // Either quote: Vite inlines small SVGs as data URIs and rewrites " to '.
    if (lightGlyph.some((h) => t.includes(`"${h}"`) || t.includes(`'${h}'`))) lightIcons.push(g.name);
  }
  check(`${s}: no light paint, text at 3:1 or more, icons dark`, stale.length === 0 && faint.length === 0 && lightIcons.length === 0,
    [stale.length && `light paint: ${stale.slice(0, 6).join('; ')}`, faint.length && `faint: ${faint.slice(0, 4).join('; ')}`,
      lightIcons.length && `light icons: ${lightIcons.join(', ')}`].filter(Boolean).join(' | ') || `${glyphs.length} icons`);
}
check('icons were actually audited', iconCount > 40, `${iconCount} icon renders`);

// --- Remembered, and back -----------------------------------------------------------
await page.reload({ waitUntil: 'networkidle' });
await page.waitForSelector('.productCard');
check('dark survives a reload', (await page.evaluate(() => document.documentElement.dataset.theme)) === 'dark' && (await root('--color-surface-default')) === '#222326');
await openBar();
await page.evaluate(() => [...document.querySelectorAll('.devbar__item')].find((b) => b.firstChild.textContent.trim() === 'Dark mode').click());
await closeBar();
const back = await page.evaluate(() => ({
  theme: document.documentElement.dataset.theme,
  surface: getComputedStyle(document.documentElement).getPropertyValue('--color-surface-default').trim(),
  status: document.querySelector('.statusBar')?.dataset.appearance,
  screen: getComputedStyle(document.querySelector('.device__screen')).backgroundColor,
}));
check('and black again in light', (await home()) === '124.5,839,144,5 rgb(0, 0, 0)', await home());
check('switching off restores light', back.theme === 'light' && back.surface === '#ffffff' && back.status === 'dark' && back.screen === 'rgb(255, 255, 255)', JSON.stringify(back));
await page.evaluate(() => { try { localStorage.removeItem('supermart-pos.theme'); } catch {} });

check('no page errors', errors.length === 0, errors.join('; '));
await browser.close();
console.log(`\n${fails} failing`);
process.exit(fails ? 1 : 0);
