/**
 * Coordinate diff of Queued orders (band `170:8988`) against its frames: the list
 * `88:16280`, a row's menu `88:16379`, the empty sheet `88:16251`, More options over an
 * empty Cart `88:16544`, and the queued toast `88:16028`.
 *
 * The frames draw this sheet full-bleed (393 wide from x 0); it is inset like every
 * other sheet (377 from x 8), so boxes are measured RELATIVE to their sheet or card,
 * against the frame's own offsets, and anything that stretches is 16 narrower. The
 * list sheet's height is not asserted: the frame holds five orders, the demo four.
 *
 *   node scripts/diff-queue.mjs [base-url]
 */
import pw from '/opt/node-tools/node_modules/playwright/index.js';

const BASE = process.argv[2] ?? 'http://127.0.0.1:4251/';
const NARROW = 393 - 377;
const browser = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 1200, height: 1100 } });
await page.goto(`${BASE}?dev=1`, { waitUntil: 'networkidle' });
await page.waitForSelector('.productCard');
const pick = async (label) => {
  await page.evaluate(() => { if (!document.querySelector('.devbar__panel')) document.querySelector('.devbar__handle').click(); });
  await page.waitForTimeout(400);
  await page.evaluate((l) => [...document.querySelectorAll('.devbar__item')].find((b) => b.textContent.trim() === l).click(), label);
  await page.evaluate(() => document.querySelector('.devbar__handle').click());
  await page.waitForTimeout(1300);
  await page.waitForFunction(() => document.getAnimations()
    .every((a) => a.playState !== 'running' || a.effect?.getTiming().iterations === Infinity), null, { timeout: 5000 });
};
// [x, y, w, h] of `sel`, relative to the box of `origin` (or the screen).
const box = (sel, origin, i = 0) => page.evaluate(([s, o, i]) => {
  const e = document.querySelectorAll(s)[i]; if (!e) return null;
  const r = e.getBoundingClientRect();
  const z = (o ? document.querySelector(o) : document.querySelector('.device__screen')).getBoundingClientRect();
  return [r.left - z.left, r.top - z.top, r.width, r.height];
}, [sel, origin, i]);

let fails = 0;
const run = async (title, rows) => {
  console.log(title);
  for (const [label, sel, origin, target, i] of rows) {
    const m = await box(sel, origin, i);
    if (!m) { fails++; console.log(`  ${label.padEnd(18)} MISSING ${sel}`); continue; }
    const diff = target.map((t, k) => (t === null ? 0 : m[k] - t));
    const off = diff.some((d) => Math.abs(d) >= 0.5);
    if (off) fails++;
    console.log(`  ${label.padEnd(18)} ${off ? 'OFF' : 'ok '}  [${m.map((v) => +v.toFixed(1))}]  diff [${diff.map((d) => +d.toFixed(1))}]`);
  }
};

const SHEET = '.queuedOrders';
const CARD = '.queueCard';
await pick('Queued orders');
// The frame's card is 361 wide; inset, 345.
const CW = 361 - NARROW;
await run('88:16280 Queued orders (list)', [
  ['sheet',           SHEET,                        null,  [8, null, 377, null]],
  ['header',          `${SHEET} .modalHeader`,      SHEET, [0, 0, 377, 64]],
  ['close',           `${SHEET} .closeButton`,      SHEET, [16, 12, 40, 40]],
  ['card 1',          CARD,                         SHEET, [16, 64, CW, 120], 0],
  ['card 2',          CARD,                         SHEET, [16, 64 + 136, CW, 120], 1],
  ['card 3',          CARD,                         SHEET, [16, 64 + 272, CW, 120], 2],
  ['name',            '.queueCard__name',           CARD,  [12, 12, 203, 24]],
  ['items',           '.queueCard__items',          CARD,  [12, 40, 203, 20]],
  ['total',           '.queueCard__total',          CARD,  [null, 24, null, 24]],
  ['clock',           '.queueCard__time > img',     CARD,  [12, 88, 16, 16]],
  ['time',            '.queueCard__timeText',       CARD,  [34, 86, null, 20]],
  ['•••',             '.queueCard__more',           CARD,  [CW - 12 - 24, 84, 24, 24]],
  ['Recall',          '.recallButton',              SHEET, [16, null, 377 - 32, 48]],
]);
// The total ends 12 in from the card's right, as the frame's ₦10,000 (272+65 = 337 of 349).
const t = await box('.queueCard__total', CARD); const c = await box(CARD, SHEET);
const right = c[2] - (t[0] + t[2]);
if (Math.abs(right - 12) >= 0.5) fails++;
console.log(`  total right inset  ${Math.abs(right - 12) >= 0.5 ? 'OFF' : 'ok '}  ${right.toFixed(1)} (target 12)`);
// The footer: the button 16 below the body, 40 above the sheet's bottom.
const sheet = await box(SHEET); const recall = await box('.recallButton');
const below = sheet[1] + sheet[3] - (recall[1] + recall[3]);
if (Math.abs(below - 40) >= 0.5) fails++;
console.log(`  Recall to bottom   ${Math.abs(below - 40) >= 0.5 ? 'OFF' : 'ok '}  ${below.toFixed(1)} (target 40)`);

await page.evaluate(() => document.querySelector('.queueCard__more').click());
await page.waitForTimeout(450);
// `88:16379` at [174,250] 196x56; its card at [16,144]: 106 down, its right 7 in.
await run('88:16379 Row menu', [
  ['menu',            '.rowMenu',                   CARD,  [CW - 7 - 196, 106, 196, 56]],
  ['Delete item',     '.rowMenu__item',             '.rowMenu', [0, 8, 196, 40]],
  ['trash',           '.rowMenu__item > img',       '.rowMenu', [12, 20, 16, 16]],
]);
await page.keyboard.press('Escape');

await pick('Queued orders: empty');
// `88:16251`: 376 tall; the rings 152 square from 16 down the body, the words 16 below.
await run('88:16251 Queued orders (empty)', [
  ['sheet',           SHEET,                        null,  [8, 844 - 376, 377, 376]],
  ['rings',           '.queueEmpty .emptyState__rings', SHEET, [(377 - 152) / 2, 64 + 16, 152, 152]],
  ['glyph',           '.queueEmpty .emptyState__ring3 > img', SHEET, [(377 - 40) / 2, 64 + 16 + 56, 40, 40]],
  ['title',           '.queueEmpty .emptyState__title', SHEET, [16, 64 + 184, 377 - 32, 24]],
  ['body',            '.queueEmpty .emptyState__body', SHEET, [(377 - 322) / 2, 64 + 216, 322, 48]],
]);

await pick('More options: empty cart');
// `88:16544`: 149 tall, one 60 group 5 below the 64 header.
await run('88:16544 More options (empty Cart)', [
  ['sheet',           '.moreOptions',               null,  [8, 844 - 149, 377, 149]],
  ['group',           '.moreOptions__group',        '.moreOptions', [16, 69, 377 - 32, 60]],
]);

await pick('Order has been queued: toast');
// `88:16028` is 48 tall and centred; it sits at 645, above View cart (Toast.css).
const toast = await box('.toast');
await run('88:16028 Toast notification', [
  ['pill',            '.toast',                     null,  [(393 - toast[2]) / 2, 645, null, 48]],
  ['icon',            '.toast > img',               '.toast', [12, 14, 20, 20]],
]);

await browser.close();
console.log(`\n${fails} measurement(s) outside 0.5px`);
process.exit(fails ? 1 : 0);
