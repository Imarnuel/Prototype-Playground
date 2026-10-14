/**
 * Walks the Dashboard (`197:20741`) and proves it by consequence, not assertion:
 *
 *   - the tab bar gets there and back, cross-fading both ways, the Sales Point's cart
 *     intact behind it;
 *   - every section reads the same books — the split adds to Sales, Top Locations add
 *     to Sales, P&L's profit is the Profit tile, the current balance is both balances;
 *   - a cash sale paid at Checkout lands: Sales, Cash, Cash received and this branch
 *     all rise by exactly the receipt's total;
 *   - the period menu, loading, a failed load and its retry, a morning with no sales,
 *     the controls that are not designed, and reduced motion.
 *
 *   node scripts/walk-dashboard.mjs [url]
 */
import pw from '/opt/node-tools/node_modules/playwright/index.js';

const BASE = process.argv[2] ?? 'http://127.0.0.1:4251/';
const browser = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let fails = 0;
const check = (n, pass, d = '') => { if (!pass) fails++; console.log(`${pass ? 'PASS' : 'FAIL'}  ${n}${d ? `  ${d}` : ''}`); };

const open = async (opts = {}) => {
  const page = await browser.newPage({ viewport: { width: 1200, height: 1100 }, ...opts });
  page.errors = [];
  page.on('pageerror', (e) => page.errors.push(e.message));
  await page.goto(`${BASE}?dev=1`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.productCard');
  return page;
};
let page = await open();
const wait = (ms) => page.waitForTimeout(ms);
const pick = async (label) => {
  await page.evaluate(() => { if (!document.querySelector('.devbar__panel[data-open="on"]')) document.querySelector('.devbar__handle').click(); });
  await wait(400);
  await page.evaluate((l) => [...document.querySelectorAll('.devbar__item')].find((b) => b.firstChild.textContent.trim() === l).click(), label);
  await page.evaluate(() => { if (document.querySelector('.devbar__panel[data-open="on"]')) document.querySelector('.devbar__handle').click(); });
  await wait(900);
};
const click = async (sel, ms = 600) => { await page.evaluate((s) => document.querySelector(s).click(), sel); await wait(ms); };
const ready = () => page.waitForSelector('.dash__tileValue:not(.dash__skeleton)', { timeout: 4000 });
const naira = (s) => Math.round(Number(s.replace(/[^\d.-]/g, '')) * 100);
const read = () => page.evaluate(() => {
  const t = (s, i = 0) => document.querySelectorAll(s)[i]?.textContent ?? null;
  return {
    period: t('.dash__filter > span'),
    sales: t('.dash__tileValue', 0), expenses: t('.dash__tileValue', 1), cogs: t('.dash__tileValue', 2), profit: t('.dash__tileValue', 3),
    today: t('.dash__salesTodayValue'),
    split: [...document.querySelectorAll('.dash__methodValue')].map((e) => e.textContent),
    pnlProfit: t('.dash__pnl .dash__totalValue'),
    locations: [...document.querySelectorAll('.dash__table tbody tr')].map((r) => ({ name: r.querySelector('.dash__locName')?.textContent, sales: r.querySelector('.dash__locSales')?.textContent })),
    flows: [...document.querySelectorAll('.dash__flowAmount')].map((e) => e.textContent),
    balances: [...document.querySelectorAll('.dash__flowBalance > :last-child')].map((e) => e.textContent),
    current: t('.dash__flow .dash__totalValue'),
  };
});

// --- There and back ------------------------------------------------------------------
await page.evaluate(() => document.querySelector('.cart__scan, .salesPoint__scan') && null);
await pick('Cart: fill with 4 lines');
await page.evaluate(() => document.querySelector('.cart .closeButton, .cart__lead')?.click());
await wait(700);
const cartBefore = await page.evaluate(() => document.querySelector('.viewCart__label')?.textContent);
const fade = (sel) => page.evaluate((s) => new Promise((done) => {
  const out = []; const t0 = performance.now();
  document.querySelector(s).click();
  const tick = () => {
    const el = document.querySelector('.tabScreen');
    out.push(el ? +getComputedStyle(el).opacity : null);
    if (performance.now() - t0 < 500) requestAnimationFrame(tick); else done(out);
  };
  requestAnimationFrame(tick);
}), sel);
const inFrames = await fade('.salesPoint .tabBar__item:nth-child(1)');
const between = (a) => a.filter((v) => v !== null && v > 0.02 && v < 0.98).length;
check('the Dashboard tab cross-fades the Dashboard in', between(inFrames) >= 2 && inFrames.at(-1) === 1, `${between(inFrames)} in-between frames`);
await ready();
check('...with the Dashboard tab open: filled grid, its label in text/selected',
  await page.evaluate(() => {
    const b = document.querySelector('.dash .tabBar__item[aria-current="page"]');
    return b?.textContent === 'Dashboard' && getComputedStyle(b.querySelector('.tabBar__label')).color === 'rgb(44, 74, 139)';
  }));
const outFrames = await fade('.dash .tabBar__item:nth-child(2)');
check('Sales Point cross-fades it out again, and it unmounts', between(outFrames) >= 2 && outFrames.at(-1) === null, `${between(outFrames)} in-between frames`);
check('the Sales Point is as it was left: same cart', (await page.evaluate(() => document.querySelector('.viewCart__label')?.textContent)) === cartBefore, cartBefore);

// --- One set of books ----------------------------------------------------------------
await click('.salesPoint .tabBar__item:nth-child(1)', 400);
await ready();
let d = await read();
check('opens on Today, with today\'s date', d.period === 'Today'
  && (await page.evaluate(() => document.querySelector('.dash__date').textContent)) === (() => {
    const n = new Date(); const day = n.getDate();
    const sfx = day % 100 >= 11 && day % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][day % 10] ?? 'th';
    return `${day}${sfx} ${n.toLocaleString('en-GB', { month: 'long' })}, ${n.getFullYear()}`;
  })());
const consistent = (d) => {
  const sales = naira(d.sales);
  return {
    split: d.split.reduce((a, s) => a + naira(s), 0) === sales,
    today: naira(d.today) === sales,
    locations: d.locations.reduce((a, l) => a + naira(l.sales), 0) === sales,
    profit: naira(d.pnlProfit) === naira(d.profit),
    balance: naira(d.current) === naira(d.balances[0]) + naira(d.balances[1]),
    flows: naira(d.balances[0]) === naira(d.flows[0]) - naira(d.flows[1]) && naira(d.balances[1]) === naira(d.flows[2]) - naira(d.flows[3]),
  };
};
let c = consistent(d);
check('the payment split adds up to Sales, and "Today:" is Sales', c.split && c.today, `${d.split.join(' + ')} vs ${d.sales}`);
check('Top Locations add up to Sales', c.locations, d.locations.map((l) => l.sales).join(' + '));
check('P&L\'s profit is the Profit tile', c.profit, `${d.pnlProfit} vs ${d.profit}`);
check('each balance is received less spent; the current balance is both', c.flows && c.balance, `${d.current}`);
check('five locations, ranked by sales', d.locations.length === 5 && d.locations.every((l, i, a) => i === 0 || naira(a[i - 1].sales) >= naira(l.sales)));

// --- A sale lands ---------------------------------------------------------------------
await click('.dash .tabBar__item:nth-child(2)', 500);
await pick('Checkout: cash with change');
await click('.payButton', 100);
await page.waitForSelector('.receiptScreen[data-open="on"]', { timeout: 5000 });
const receiptTotal = await page.evaluate(() => Object.fromEntries([...document.querySelectorAll('.receipt__row')]
  .map((r) => [...r.children].map((c) => c.textContent.trim()))).Total);
await click('.receiptScreen__newSale', 1200);
await click('.salesPoint .tabBar__item:nth-child(1)', 400);
await ready();
const after = await read();
const paid = naira(receiptTotal);
const bodija = (x) => naira(x.locations.find((l) => l.name === 'Freshvale Bodija').sales);
check('a cash sale at Checkout raises Sales by exactly its receipt total', naira(after.sales) - naira(d.sales) === paid, `${d.sales} -> ${after.sales}, receipt ${receiptTotal}`);
check('...and Cash in the split, and Cash received', naira(after.split[0]) - naira(d.split[0]) === paid && naira(after.flows[0]) - naira(d.flows[0]) === paid);
check('...and this till\'s branch, Freshvale Bodija', bodija(after) - bodija(d) === paid);
check('...and the books still agree with themselves', Object.values(consistent(after)).every(Boolean), JSON.stringify(consistent(after)));

// --- The period menu -----------------------------------------------------------------
await click('.dash__filter', 400);
const menu = await page.evaluate(() => ({
  items: [...document.querySelectorAll('.dash__periodMenu [role="menuitemradio"]')].map((b) => `${b.textContent}${b.getAttribute('aria-checked') === 'true' ? '*' : ''}`),
  focus: document.activeElement?.textContent,
}));
check('the Filter opens the period menu, Today ticked and focused', menu.items.join() === 'Today*,This week,This month' && menu.focus === 'Today', JSON.stringify(menu));
await page.keyboard.press('Escape');
await wait(350);
check('Escape closes it and hands focus back to the Filter',
  !(await page.$('.dash__periodMenu')) && (await page.evaluate(() => document.activeElement?.classList.contains('dash__filter'))));
await click('.dash__filter', 400);
await page.evaluate(() => [...document.querySelectorAll('.dash__periodMenu [role="menuitemradio"]')][2].click());
await ready();
await wait(300);
const month = await read();
check('picking This month re-reads the books for the month', month.period === 'This month' && naira(month.sales) >= naira(after.sales)
  && (await page.evaluate(() => document.querySelector('.dash__salesToday > span').textContent)) === 'This month:', `${month.sales}`);
check('...and they still agree with themselves', Object.values(consistent(month)).every(Boolean));
await click('.dash__filter', 400);
await page.mouse.click(600, 300);
await wait(350);
check('a press outside closes the menu', !(await page.$('.dash__periodMenu')));

// --- States -----------------------------------------------------------------------------
await pick('Dashboard: loading');
check('loading: every figure is a skeleton, the layout holds',
  await page.evaluate(() => document.querySelectorAll('.dash__skeleton').length > 30 && !!document.querySelector('.dash__tile')));
await pick('Dashboard: load fails');
await wait(600);
check('a failed load says so, with a retry', !!(await page.$('.dash .listMessage')) && /Couldn’t load the dashboard/.test(await page.evaluate(() => document.querySelector('.dash .listMessage').textContent)));
await pick('Dashboard: no sales yet today');
await ready();
const quiet = await read();
check('a morning with no sales: ₦0 everywhere, an empty bar, no margin to show',
  quiet.sales === '₦0' && quiet.split.every((s) => s === '₦0') && !!(await page.$('.dash__splitEmpty'))
  && (await page.evaluate(() => document.querySelector('.dash__salesMargin > :last-child').textContent)) === '—');

// --- Not designed ----------------------------------------------------------------------
const toast = () => page.evaluate(() => document.querySelector('.toast[data-shown] .toast__message, .toast .toast__message')?.textContent);
await click('.dash__bell', 500);
check('the bell says notifications aren\'t designed', (await toast()) === 'Notifications aren’t designed yet');
await click('.dash .tabBar__item:nth-child(3)', 500);
check('More says it isn\'t designed', (await toast()) === 'More isn’t designed yet');
check('no page errors', page.errors.length === 0, page.errors.join('; '));
await page.close();

// --- Reduced motion: the tab switch lands at once ----------------------------------
page = await open({ reducedMotion: 'reduce' });
const rm = await page.evaluate(() => new Promise((done) => {
  document.querySelector('.salesPoint .tabBar__item:nth-child(1)').click();
  const out = []; const t0 = performance.now();
  const tick = () => { const el = document.querySelector('.tabScreen'); out.push(el ? +getComputedStyle(el).opacity : null); if (performance.now() - t0 < 200) requestAnimationFrame(tick); else done(out); };
  requestAnimationFrame(tick);
}));
check('reduced motion: no in-between frames', rm.filter((v) => v !== null && v > 0.02 && v < 0.98).length === 0, rm.join(','));
await page.close();

await browser.close();
console.log(`\n${fails} failing`);
process.exit(fails ? 1 : 0);
