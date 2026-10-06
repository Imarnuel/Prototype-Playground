/**
 * Coordinate diff of the Quantity sheet against `88:11532`. Targets are each node's
 * own absolute box, read with use_figma.
 *
 * The sheet is bottom-docked and its Measurement card hugs its four rows (224) where
 * the frame fixes it at 278 (BUILD-PLAN #77), so the whole sheet sits 54px lower:
 * every target in it takes SHIFT. Two other declared departures, each in BUILD-PLAN:
 * the card's height (#77), and the unselected rows' equivalents ending at 327 like the
 * selected one, not at 355 (#78). Text widths are not asserted (#56).
 *
 *   node scripts/diff-quantity.mjs [base-url]
 */
import pw from '/opt/node-tools/node_modules/playwright/index.js';

const BASE = process.argv[2] ?? 'http://127.0.0.1:4251/';
const SHIFT = 54;
// label, selector, x, y (frame), w, h — null skips; y takes SHIFT
const T = [
  ['sheet',          '.quantitySheet',                     6, 335, 381, 511 - SHIFT],
  ['header',         '.quantitySheet .modalHeader',        6, 335, 381,  64],
  ['close',          '.quantitySheet .closeButton',       22, 347,  40,  40],
  ['confirm',        '.modalHeader__confirm',            331, 347,  40,  40],
  ['title',          '.quantitySheet .modalHeader__title', null, 353, null, 24],
  ['stepper card',   '.qtyStepper',                       22, 404, 349,  80],
  ['minus',          '.qtyStepper__step:first-child',     34, 416,  56,  56],
  ['plus',           '.qtyStepper__step:last-child',     303, 416,  56,  56],
  ['"Measurement"',  '.measurement__title',               22, 508, null, 20],
  ['list card',      '.measurement__list',                22, 536, 349, 278 - SHIFT],
  ['row Each',       '.measurement__row:nth-child(1)',    38, 536, 317,  56],
  ['row Pack',       '.measurement__row:nth-child(2)',    38, 592, 317,  56],
  ['row Carton',     '.measurement__row:nth-child(3)',    38, 648, 317,  56],
  ['row Box',        '.measurement__row:nth-child(4)',    38, 704, 317,  56],
  ['label Each',     '.measurement__row:nth-child(1) .measurement__label', 38, 552, null, 24],
  ['check',          '.measurement__row:nth-child(1) .measurement__check', 335, 554, 20, 20],
];

const browser = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 1200, height: 1100 } });
await page.goto(`${BASE}?dev=1`, { waitUntil: 'networkidle' });
await page.evaluate(() => document.querySelector('.devbar__handle').click());
await page.waitForTimeout(450);
await page.evaluate(() => [...document.querySelectorAll('.devbar__item')].find((b) => b.textContent.trim() === 'Quantity sheet').click());
await page.waitForTimeout(1000);

const res = await page.evaluate((rows) => {
  const s = document.querySelector('.device__screen').getBoundingClientRect();
  const box = (sel) => { const e = document.querySelector(sel); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.left - s.left, y: r.top - s.top, w: r.width, h: r.height }; };
  const each = [...document.querySelectorAll('.measurement__each')].map((e) => e.getBoundingClientRect().right - s.left);
  const title = box('.quantitySheet .modalHeader__title');
  const count = box('.qtyStepper__value > span');
  return { rows: rows.map(([, sel]) => box(sel)), each, titleCentre: title.x + title.w / 2, countCentre: count.x + count.w / 2, countY: count.y };
}, T);

let fails = 0;
const line = (label, axis, target, actual) => {
  const diff = actual - target;
  const off = Math.abs(diff) >= 0.5;
  if (off) fails++;
  console.log(`  ${label.padEnd(15)} ${axis.padEnd(7)} ${String(target).padStart(6)}  ${actual.toFixed(2).padStart(8)}  ${diff.toFixed(2).padStart(6)}${off ? '  <-- OFF' : ''}`);
};
console.log(`88:11532, sheet internals +${SHIFT}`);
T.forEach(([label, sel, x, y, w, h], i) => {
  const m = res.rows[i];
  if (!m) { fails++; console.log(`  ${label.padEnd(15)} MISSING ${sel}`); return; }
  if (x !== null) line(label, 'x', x, m.x);
  if (y !== null) line(label, 'y', y + SHIFT, m.y);
  if (w !== null) line(label, 'w', w, m.w);
  if (h !== null) line(label, 'h', h, m.h);
});
// Centred things are compared by their centre: the text width is Figma's integer.
line('title', 'centre', 196.5, res.titleCentre);
line('count "10 ea"', 'centre', 196.5, res.countCentre);
line('count "10 ea"', 'y', 430 + SHIFT, res.countY);
res.each.forEach((r, i) => line(`equivalent ${i + 1}`, 'right', 327, r));

await browser.close();
console.log(`\n${fails} measurement(s) outside 0.5px`);
process.exit(fails ? 1 : 0);
