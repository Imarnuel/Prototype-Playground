/**
 * Walks "Queueing & recalling an order" (band `170:8988`) end to end and proves each
 * step by its consequence somewhere else: a queued sale turns up in the queue with the
 * Cart's total, a recalled one turns up in the Cart with the card's, a recall over a
 * full Cart queues that sale, a delete is undone into its own place.
 *
 *   node scripts/walk-queue.mjs [base-url]
 */
import pw from '/opt/node-tools/node_modules/playwright/index.js';

const BASE = process.argv[2] ?? 'http://127.0.0.1:4251/';
const browser = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let fails = 0;
const check = (n, pass, d = '') => { if (!pass) fails++; console.log(`${pass ? 'PASS' : 'FAIL'}  ${n}${d ? `  ${d}` : ''}`); };

const page = await browser.newPage({ viewport: { width: 1200, height: 1100 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(`${BASE}?dev=1`, { waitUntil: 'networkidle' });
await page.waitForSelector('.productCard');

const wait = (ms) => page.waitForTimeout(ms);
const pick = async (label) => {
  await page.evaluate(() => { if (!document.querySelector('.devbar__panel')) document.querySelector('.devbar__handle').click(); });
  await wait(400);
  await page.evaluate((l) => [...document.querySelectorAll('.devbar__item')].find((b) => b.textContent.trim() === l).click(), label);
  await page.evaluate(() => document.querySelector('.devbar__handle').click());
  await wait(900);
};
const click = (sel) => page.evaluate((s) => document.querySelector(s).click(), sel);
const text = (sel) => page.evaluate((s) => document.querySelector(s)?.textContent.trim() ?? null, sel);
const cards = () => page.evaluate(() => [...document.querySelectorAll('.queueList__item:not([data-leaving]) .queueCard')].map((c) => ({
  name: c.querySelector('.queueCard__name').textContent,
  items: [...c.querySelectorAll('.queueCard__items > span')].length,
  total: c.querySelector('.queueCard__total').textContent,
})));
const cartState = () => page.evaluate(() => ({
  lines: document.querySelectorAll('.cartLine:not([data-leaving])').length,
  total: document.querySelector('.orderTotal__value')?.textContent.trim(),
  customer: document.querySelector('.addCustomer[data-state="added"] .addCustomer__label')?.textContent.trim() ?? null,
}));
const listReady = () => page.waitForFunction(() => document.querySelector('.queueList[role="radiogroup"]') || document.querySelector('.queueEmpty'), null, { timeout: 4000 });
const toast = () => page.evaluate(() => {
  const t = document.querySelector('.toast[data-open="on"]');
  return t ? { message: t.querySelector('.toast__message').textContent, variant: t.dataset.variant, action: t.querySelector('.toast__action')?.textContent ?? null } : null;
});

// --- Queue order ----------------------------------------------------------------------
await pick('Cart: fill with 4 lines');
await click('.addCustomer__pick');
await wait(900);
await page.evaluate(() => document.querySelector('.customerRow button').click());
await wait(900);
const before = await cartState();
check('a sale to queue: four lines, a customer, a total', before.lines === 4 && !!before.customer && !!before.total, JSON.stringify(before));
await click('.cart__queue');
await wait(60);
check('Queue order spins in place and cannot be pressed twice', await page.evaluate(() => {
  const b = document.querySelector('.cart__queue');
  return b.disabled && b.getAttribute('aria-busy') === 'true' && b.dataset.busy === 'on' && getComputedStyle(b.querySelector('.cart__queueSpinner')).opacity !== '0';
}));
await page.waitForFunction(() => document.querySelector('.toast[data-open="on"]'), null, { timeout: 3000 });
check('...then the pill toast says so, as `88:15953`', JSON.stringify(await toast()) === JSON.stringify({ message: 'Order has been queued', variant: 'pill', action: null }), JSON.stringify(await toast()));
await wait(500);
check('...over the Sales Point, the Cart closed and emptied', await page.evaluate(() =>
  !document.querySelector('.blanket[data-open="on"] .cart, .cartSheet[data-open="on"]') && document.querySelector('.viewCart__label').textContent.trim() === 'View cart'),
  await text('.viewCart__label'));
check('...and the pill clears View cart', await page.evaluate(() => {
  const t = document.querySelector('.toast').getBoundingClientRect(); const v = document.querySelector('.viewCart').getBoundingClientRect();
  return t.bottom <= v.top;
}));

// --- More options over an empty Cart ---------------------------------------------------
await click('.viewCart');
await wait(700);
await click('.cart__iconButton[aria-label="More options"]');
await wait(700);
check('More options over an empty Cart offers only Queued orders, as `88:16526`',
  JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('.moreOptions__row')].map((r) => r.dataset.option))) === '["queued"]');
await click('.moreOptions__row[data-option="queued"]');
await wait(60);
check('Queued orders loads behind skeleton cards', await page.evaluate(() => document.querySelectorAll('.queueCardSkeleton').length === 3));
await listReady();
let list = await cards();
check('the queued sale is first: its customer, its four items, the Cart\'s total',
  list.length === 5 && list[0].name === before.customer && list[0].items === 4 && list[0].total === before.total, JSON.stringify(list[0]));
check('Recall order waits for a choice', await page.evaluate(() => document.querySelector('.recallButton').disabled));

// --- Recall from an empty Cart -----------------------------------------------------------
const second = list[1];
await page.evaluate(() => document.querySelectorAll('.queueCard__choose')[1].click());
await wait(300);
check('choosing a card marks it, and only it', await page.evaluate(() => {
  const r = [...document.querySelectorAll('.queueCard__choose')].map((b) => b.getAttribute('aria-checked'));
  return r[1] === 'true' && r.filter((x) => x === 'true').length === 1
    && getComputedStyle(document.querySelectorAll('.queueCard')[1], '::after').boxShadow.includes('rgb(44, 74, 139)');
}));
check('...and Recall order is ready', await page.evaluate(() => !document.querySelector('.recallButton').disabled));
await click('.recallButton');
await wait(60);
check('Recall spins in place', await page.evaluate(() => document.querySelector('.recallButton').dataset.busy === 'on'));
await page.waitForFunction(() => !document.querySelector('.blanket[data-open="on"] .queuedOrders'), null, { timeout: 3000 });
await wait(600);
const recalled = await cartState();
check('the recalled order is in the Cart: its lines and its total', recalled.lines === second.items && recalled.total === second.total,
  `${JSON.stringify(recalled)} vs ${JSON.stringify(second)}`);
check('...and no toast: there was nothing to set aside', !(await toast()));

// --- Recall over a full Cart -------------------------------------------------------------
await click('.cart__iconButton[aria-label="More options"]');
await wait(700);
check('More options over a full Cart offers every group again',
  (await page.evaluate(() => document.querySelectorAll('.moreOptions__row').length)) === 4);
await click('.moreOptions__row[data-option="queued"]');
await listReady();
list = await cards();
check('the recalled order left the queue', list.length === 4 && !list.some((c) => c.total === second.total && c.name === second.name), JSON.stringify(list.map((c) => c.name)));
const third = list[2];
await page.evaluate(() => document.querySelectorAll('.queueCard__choose')[2].click());
await click('.recallButton');
await page.waitForFunction(() => document.querySelector('.toast[data-open="on"]'), null, { timeout: 3000 });
check('recalling over a sale says that sale was queued', (await toast())?.message === 'Your previous order was queued');
await wait(700);
const swapped = await cartState();
check('...and the Cart holds the recalled one', swapped.lines === third.items && swapped.total === third.total, JSON.stringify(swapped));
await click('.cart__iconButton[aria-label="More options"]');
await wait(700);
await click('.moreOptions__row[data-option="queued"]');
await listReady();
list = await cards();
check('...the sale that was in the Cart is now first in the queue', list.length === 4 && list[0].total === recalled.total && list[0].name === second.name,
  JSON.stringify(list[0]));

// --- Delete, Undo ------------------------------------------------------------------------
await page.evaluate(() => document.querySelectorAll('.queueCard__more')[1].click());
await wait(350);
check('the ••• opens its menu: Delete, in the danger colour', await page.evaluate(() => {
  const m = document.querySelector('.rowMenu[data-open="on"]');
  return !!m && m.textContent.trim() === 'Delete' && getComputedStyle(m.querySelector('.rowMenu__label')).color === 'rgb(193, 38, 26)'
    && document.activeElement === m.querySelector('[role="menuitem"]');
}));
await page.keyboard.press('Escape');
await wait(400);
check('Escape closes the menu, not the sheet, and hands focus back',
  await page.evaluate(() => !document.querySelector('.rowMenu') && !!document.querySelector('.blanket[data-open="on"] .queuedOrders')
    && document.activeElement === document.querySelectorAll('.queueCard__more')[1]));
await page.evaluate(() => document.querySelectorAll('.queueCard__more')[1].click());
await wait(350);
const doomed = (await cards())[1];
await click('.rowMenu__item');
await wait(60);
check('the card collapses before it leaves', await page.evaluate(() => !!document.querySelector('.queueList__item[data-leaving]')));
await page.waitForFunction(() => document.querySelector('.toast[data-open="on"]'), null, { timeout: 3000 });
await wait(400);
list = await cards();
check('...gone from the list, with Undo offered', list.length === 3 && !list.some((c) => c.name === doomed.name && c.total === doomed.total)
  && (await toast())?.action === 'Undo', JSON.stringify(await toast()));
await click('.toast__action');
await page.waitForFunction(() => document.querySelectorAll('.queueCard').length === 4, null, { timeout: 3000 });
list = await cards();
check('Undo puts it back in its own place', list[1].name === doomed.name && list[1].total === doomed.total, JSON.stringify(list.map((c) => c.name)));

// --- Empty, failure ----------------------------------------------------------------------
await pick('Queued orders: empty');
await listReady();
check('an empty queue: the rings, the words, no Recall', await page.evaluate(() =>
  document.querySelector('.queueEmpty .emptyState__title')?.textContent === 'No queued orders yet'
  && !document.querySelector('.recallButton')));
await pick('Queued orders: load fails');
await page.waitForFunction(() => document.querySelector('.queuedOrders .listMessage'), null, { timeout: 4000 });
check('a failed load says so, with a way to try again', (await text('.queuedOrders .listMessage__retry')) === 'Try again');
await click('.queuedOrders .listMessage__retry');
await listReady();
check('...and trying again loads the queue', (await cards()).length === 4);
await pick('Queue order: fails');
await click('.cart__queue');
await page.waitForFunction(() => document.querySelector('.toast[data-open="on"]'), null, { timeout: 3000 });
await wait(300);
check('a failed queue keeps the sale in the Cart', (await toast())?.message === 'Couldn’t queue the order. Try again.'
  && (await cartState()).lines === 4 && await page.evaluate(() => !document.querySelector('.cart__queue').disabled));

check('no page errors', errors.length === 0, errors.join(' | '));
await browser.close();
console.log(`\n${fails} failing`);
process.exit(fails ? 1 : 0);
