/**
 * The Cart's order total, proved by consequence: the breakdown reconciles with the
 * lines and with the catalogue's own orderTotals, it opens AND closes over several
 * frames while the buttons hold still, and assistive tech is told its state.
 *
 *   node scripts/walk-total.mjs [base-url]
 */
import pw from '/opt/node-tools/node_modules/playwright/index.js';

const cat = await import(new URL('../src/data/catalogue.ts', import.meta.url).href);
const BASE = process.argv[2] ?? 'http://127.0.0.1:4251/';
const browser = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let fails = 0;
const check = (n, pass, d = '') => { if (!pass) fails++; console.log(`${pass ? 'PASS' : 'FAIL'}  ${n}${d ? `  ${d}` : ''}`); };
const money = (s) => Number(s.replace(/[^\d]/g, '')) * (s.startsWith('−') ? -1 : 1);

const open = async (opts = {}) => {
  const page = await browser.newPage({ viewport: { width: 1200, height: 1100 }, ...opts });
  await page.goto(`${BASE}?dev=1`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.productCard');
  return page;
};
const pick = async (page, label) => {
  await page.evaluate(() => { if (!document.querySelector('.devbar__panel')) document.querySelector('.devbar__handle').click(); });
  await page.waitForTimeout(450);
  await page.evaluate((l) => [...document.querySelectorAll('.devbar__item')].find((b) => b.textContent.trim() === l).click(), label);
  await page.waitForTimeout(900);
};
const read = (page) => page.evaluate(() => {
  const rows = Object.fromEntries([...document.querySelectorAll('.orderTotal__row')]
    .map((r) => [r.querySelector('dt').textContent, r.querySelector('dd').textContent]));
  const t = document.querySelector('.orderTotal__toggle');
  return {
    rows, total: document.querySelector('.orderTotal__value').textContent,
    lines: [...document.querySelectorAll('.cartLine__price')].map((p) => p.textContent),
    expanded: t.getAttribute('aria-expanded'),
    panelVisible: getComputedStyle(document.querySelector('.orderTotal__panel')).visibility,
    panelH: document.querySelector('.orderTotal__clip').getBoundingClientRect().height,
    controls: document.getElementById(t.getAttribute('aria-controls')) === document.querySelector('.orderTotal__panel'),
  };
});

// --- Collapsed by default, and honest about it ---------------------------------
let page = await open();
await pick(page, 'Cart: fill with 4 lines');
let s = await read(page);
check('the total starts collapsed', s.expanded === 'false' && s.panelH === 0 && s.panelVisible === 'hidden',
  `aria-expanded=${s.expanded}, height ${s.panelH}`);
check('the toggle names the region it controls', s.controls);

// --- Reconciles: lines -> Subtotal, and Subtotal - Discount + Tax = Total ------
await page.evaluate(() => document.querySelector('.orderTotal__toggle').click());
await page.waitForTimeout(700);
s = await read(page);
check('tapping the total opens the breakdown', s.expanded === 'true' && s.panelH > 0 && s.panelVisible === 'visible',
  `height ${s.panelH}`);
const sum = s.lines.reduce((a, p) => a + money(p), 0);
check('the lines add up to the Subtotal on screen', sum === money(s.rows.Subtotal), `${s.lines.join(' + ')} = ${s.rows.Subtotal}`);
check('no discount, no Discount row', !('Discount' in s.rows), Object.keys(s.rows).join(', '));
check('Subtotal + Tax = Total, on screen', money(s.rows.Subtotal) + money(s.rows.Tax) === money(s.total),
  `${s.rows.Subtotal} + ${s.rows.Tax} = ${s.total}`);
const fill = ['bev-cola', 'noo-multipack', 'cok-oil', 'bev-malt'].map((id) => ({
  product: cat.PRODUCTS.find((p) => p.id === id), unitId: 'each', count: 1,
}));
const ref = cat.orderTotals(fill);
check('...and it is the catalogue\'s own orderTotals', money(s.total) * 100 === ref.total && money(s.rows.Tax) * 100 === ref.tax,
  `expected ${cat.formatPrice(ref.total)}`);

// --- Nothing is stranded under the taller panel -----------------------------
const clearance = () => page.evaluate(async () => {
  const sc = document.querySelector('.cart__scroll');
  sc.scrollTop = sc.scrollHeight;
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  const last = [...document.querySelectorAll('.cartLine')].at(-1).getBoundingClientRect();
  return document.querySelector('.cart__footer').getBoundingClientRect().top - last.bottom;
});
const openGap = await clearance();
check('open: the last line scrolls clear of the panel', openGap >= 0, `${openGap.toFixed(1)}px above it`);

// --- The walk's discount case: Cola N500 less 15% -----------------------------
await pick(page, 'Cart: total expanded');
s = await read(page);
check('a discounted order shows the Discount row, signed', s.rows.Discount === '−₦75', s.rows.Discount);
check('Cola less 15% with two noodle packs: Subtotal - Discount + Tax = Total',
  money(s.rows.Subtotal) + money(s.rows.Discount) + money(s.rows.Tax) === money(s.total),
  `${s.rows.Subtotal} ${s.rows.Discount} + ${s.rows.Tax} = ${s.total}`);
check('VAT is on the cola\'s NET (N425 -> N32); the noodles are zero-rated', s.rows.Tax === '₦32', s.rows.Tax);

// --- Motion: both directions, over several frames, buttons pinned -------------
await pick(page, 'Cart: fill with 4 lines');
// Start collapsed: the previous step left it open, and a first tap would then CLOSE.
if (await page.evaluate(() => document.querySelector('.orderTotal__toggle').getAttribute('aria-expanded')) === 'true') {
  await page.evaluate(() => document.querySelector('.orderTotal__toggle').click());
  await page.waitForTimeout(700);
}
// Stretch the one duration property, which also stretches the visibility delay.
await page.addStyleTag({ content: '.orderTotal { --order-total-ms: 1500ms !important; }' });
const sample = async () => {
  const out = [];
  for (let i = 0; i < 10; i++) {
    out.push(await page.evaluate(() => ({
      h: document.querySelector('.orderTotal__clip').getBoundingClientRect().height,
      rot: getComputedStyle(document.querySelector('.orderTotal__chevron')).transform,
      btn: document.querySelector('.cart__checkout').getBoundingClientRect().top,
      vis: getComputedStyle(document.querySelector('.orderTotal__panel')).visibility,
    })));
    await page.waitForTimeout(110);
  }
  return out;
};
await page.evaluate(() => document.querySelector('.orderTotal__toggle').click());
const opening = await sample();
await page.waitForTimeout(800);
await page.evaluate(() => document.querySelector('.orderTotal__toggle').click());
const closing = await sample();
const distinct = (a) => new Set(a.map((f) => Math.round(f.h))).size;
const rising = (a) => a.every((f, i) => i === 0 || f.h >= a[i - 1].h) && a.at(-1).h > a[0].h;
const falling = (a) => a.every((f, i) => i === 0 || f.h <= a[i - 1].h) && a.at(-1).h < a[0].h;
check('opening grows and closing shrinks — the samples are the right way round', rising(opening) && falling(closing));
check('it opens over several frames', distinct(opening) > 4, `${distinct(opening)} distinct heights: ${opening.map((f) => Math.round(f.h)).join(' ')}`);
check('and closes over several frames, not a cut', distinct(closing) > 4, `${distinct(closing)} distinct heights: ${closing.map((f) => Math.round(f.h)).join(' ')}`);
check('the breakdown stays visible until it has closed', closing.slice(0, -1).filter((f) => f.h > 1).every((f) => f.vis === 'visible'));
check('the chevron turns with it', new Set(opening.map((f) => f.rot)).size > 4);
const btnTops = new Set([...opening, ...closing].map((f) => f.btn.toFixed(2)));
check('the buttons never move while the panel animates', btnTops.size === 1, [...btnTops].join(', '));
await page.close();

// --- Reduced motion ------------------------------------------------------------
page = await open({ reducedMotion: 'reduce' });
await pick(page, 'Cart: fill with 4 lines');
await page.evaluate(() => document.querySelector('.orderTotal__toggle').click());
await page.waitForTimeout(50);
const rm = await read(page);
await page.evaluate(() => document.querySelector('.orderTotal__toggle').click());
await page.waitForTimeout(50);
const rm2 = await read(page);
check('reduced motion: opens and closes at once', rm.panelH === 88 && rm2.panelH === 0 && rm2.panelVisible === 'hidden',
  `${rm.panelH} then ${rm2.panelH}`);
await page.close();

// --- A dismissed sheet resets it ----------------------------------------------
page = await open();
await pick(page, 'Cart: total expanded');
await pick(page, 'Sales point');
await page.evaluate(() => document.querySelector('.viewCart')?.click());
await page.waitForTimeout(800);
check('the dev toolbar\'s reset collapses it again', (await page.evaluate(() =>
  document.querySelector('.orderTotal__toggle')?.getAttribute('aria-expanded') ?? 'false')) === 'false');
await page.close();

await browser.close();
console.log(`\n${fails} failing`);
process.exit(fails ? 1 : 0);
