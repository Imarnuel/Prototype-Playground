/**
 * Coordinate diff of the Cart's order-total footer against `88:8639` (collapsed) and
 * `88:9338` (expanded). Every target is the node's own absolute box, read with
 * use_figma, relative to its frame. The footer is bottom-docked, so none of it takes
 * the +9 safe-area shift the title bar does.
 *
 * Expanded x/w targets use the collapsed frame's 16px inset, not the expanded frame's
 * 20: the buttons would otherwise change width mid-animation (BUILD-PLAN #70).
 *
 *   node scripts/diff-total.mjs [base-url]
 */
import pw from '/opt/node-tools/node_modules/playwright/index.js';

const BASE = process.argv[2] ?? 'http://127.0.0.1:4251/';
// label, selector, x, y, w, h — null skips an axis
const COLLAPSED = [ // 88:8639
  ['panel',          '.cart__footer',           0, 712, 393, 140],
  ['toggle row',     '.orderTotal__toggle',    16, 724, 361,  48],
  // x follows the label's real advance; the 8px gap is asserted below (#56).
  ['chevron',        '.orderTotal__chevron',  null, 738,  20,  20],
  ['value',          '.orderTotal__value',   null, 736, null, 24],
  ['buttons',        '.cart__actions .cart__checkout', 16, 780, null, 48],
  ['queue',          '.cart__queue',          257, 780, 120,  48],
  ['scrim',          '.cart .bottomScrim',      0, 613, 393, 239],
];
const EXPANDED = [ // 88:9338, at 16 rather than 20
  ['panel',          '.cart__footer',           0, 624, 393, 228],
  ['toggle row',     '.orderTotal__toggle',    16, 636, 361,  48],
  ['breakdown',      '.orderTotal__breakdown', 16, 684, 361,  88],
  ['subtotal row',   '.orderTotal__row:nth-child(1)', 16, 692, 361, 36],
  ['tax row',        '.orderTotal__row:nth-child(2)', 16, 728, 361, 36],
  ['buttons',        '.cart__actions .cart__checkout', 16, 780, null, 48],
  ['queue',          '.cart__queue',          257, 780, 120,  48],
];

const browser = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 1200, height: 1100 } });
await page.goto(`${BASE}?dev=1`, { waitUntil: 'networkidle' });
await page.evaluate(() => document.querySelector('.devbar__handle').click());
await page.waitForTimeout(450);
// Four undiscounted lines: the expanded frame shows no Discount row.
await page.evaluate(() => [...document.querySelectorAll('.devbar__item')]
  .find((b) => b.textContent.trim() === 'Cart: fill with 4 lines').click());
await page.waitForTimeout(900);

let fails = 0;
const measure = async (title, rows) => {
  const res = await page.evaluate((rs) => {
    const s = document.querySelector('.device__screen').getBoundingClientRect();
    return rs.map(([l, sel]) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left - s.left, y: r.top - s.top, w: r.width, h: r.height };
    });
  }, rows);
  console.log(`\n${title}`);
  rows.forEach(([label, sel, ...target], i) => {
    const m = res[i];
    if (!m) { fails++; console.log(`  ${label.padEnd(14)} MISSING ${sel}`); return; }
    ['x', 'y', 'w', 'h'].forEach((axis, j) => {
      if (target[j] === null) return;
      const diff = m[axis] - target[j];
      const off = Math.abs(diff) >= 0.5;
      if (off) fails++;
      console.log(`  ${label.padEnd(14)} ${axis}  ${String(target[j]).padStart(5)}  ${m[axis].toFixed(2).padStart(8)}  ${diff.toFixed(2).padStart(6)}${off ? '  <-- OFF' : ''}`);
    });
  });
};

await measure('collapsed — 88:8639', COLLAPSED);
// Figma reports "Total" as 38 wide, an integer (#56); Inter's real advance is narrower.
// What the frame actually specifies is Spacing/200 between text and chevron.
const gap = await page.evaluate(() => {
  const label = document.querySelector('.orderTotal__label');
  const range = document.createRange();
  range.selectNodeContents(label.firstChild);
  return document.querySelector('.orderTotal__chevron').getBoundingClientRect().left - range.getBoundingClientRect().right;
});
const gapOff = Math.abs(gap - 8) >= 0.5;
if (gapOff) fails++;
console.log(`  text→chevron   gap  8  ${gap.toFixed(2).padStart(8)}  ${(gap - 8).toFixed(2).padStart(6)}${gapOff ? '  <-- OFF' : ''}`);
await page.evaluate(() => document.querySelector('.orderTotal__toggle').click());
await page.waitForTimeout(700);
await measure('expanded — 88:9338', EXPANDED);
await page.evaluate(() => document.querySelector('.orderTotal__toggle').click());
await page.waitForTimeout(700);
await measure('collapsed again', COLLAPSED);

await browser.close();
console.log(`\n${fails} measurement(s) outside 0.5px`);
process.exit(fails ? 1 : 0);
