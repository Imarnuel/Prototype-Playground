/**
 * Both checkout flows, proved by consequence: the amount rules, the sheet-to-picker
 * round trips keeping the draft, undesigned methods refused, a failed payment
 * keeping the sale, and a receipt whose figures are the Checkout's own.
 *
 *   node scripts/walk-checkout.mjs [base-url]
 */
import pw from '/opt/node-tools/node_modules/playwright/index.js';

const BASE = process.argv[2] ?? 'http://127.0.0.1:4251/';
const browser = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let fails = 0;
const check = (n, pass, d = '') => { if (!pass) fails++; console.log(`${pass ? 'PASS' : 'FAIL'}  ${n}${d ? `  ${d}` : ''}`); };
const naira = (s) => Number(String(s).replace(/[^\d]/g, ''));

const page = await browser.newPage({ viewport: { width: 1200, height: 1100 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
// Print and share are the browser's; record that they were asked for.
await page.addInitScript(() => {
  window.__printed = 0; window.print = () => { window.__printed++; };
  window.__shared = null; navigator.share = async (d) => { window.__shared = d; };
});
await page.goto(`${BASE}?dev=1`, { waitUntil: 'networkidle' });
await page.waitForSelector('.productCard');
const wait = (ms) => page.waitForTimeout(ms);
const pick = async (label) => {
  await page.evaluate(() => { if (!document.querySelector('.devbar__panel')) document.querySelector('.devbar__handle').click(); });
  await wait(400);
  await page.evaluate((l) => [...document.querySelectorAll('.devbar__item')].find((b) => b.textContent.trim() === l).click(), label);
  await wait(1100);
};
const open = (name) => page.evaluate((n) => {
  const d = document.querySelector(`[role="dialog"][aria-label="${n}"]`);
  return d ? (d.closest('.blanket')?.dataset.open ?? d.dataset.open) : null;
}, name);
const sheet = () => page.evaluate(() => ({
  total: document.querySelector('.checkout__total')?.textContent,
  method: document.querySelectorAll('.checkout__valueText')[0]?.textContent,
  bank: document.querySelectorAll('.checkout__valueText')[1]?.textContent ?? null,
  amount: document.querySelector('.checkout .detailField input')?.value,
  pay: document.querySelector('.payButton')?.textContent,
  payDisabled: document.querySelector('.payButton')?.disabled,
  error: document.querySelector('.checkout .fieldError:not(.checkout__change)[data-open="on"]')?.textContent ?? null,
  change: document.querySelector('.checkout__change[data-open="on"]')?.textContent ?? null,
}));
const type = async (text) => {
  await page.evaluate(() => document.querySelector('.checkout .detailField input').select());
  if (text === '') await page.keyboard.press('Backspace'); else await page.keyboard.type(text);
  await wait(200);
};
const click = async (sel, ms = 900) => { await page.evaluate((s) => document.querySelector(s).click(), sel); await wait(ms); };
const toast = () => page.evaluate(() => document.querySelector('.toast[data-open="on"] .toast__message')?.textContent ?? null);

// --- Into checkout from the Cart ----------------------------------------------------
await pick('Cart: fill with 4 lines');
const cartTotal = await page.evaluate(() => document.querySelector('.orderTotal__value').textContent);
await click('.cart__checkout');
let s = await sheet();
check('Checkout opens from the Cart on the same total', (await open('Checkout')) === 'on' && s.total === cartTotal, `${s.total} = ${cartTotal}`);
check('cash, the amount at the total, grouped as the frame writes it', s.method === 'Cash' && naira(s.amount) === naira(cartTotal) && s.amount.includes(','),
  `amount "${s.amount}"`);
check('Pay names the total', s.pay === `Pay ${cartTotal}` && !s.payDisabled, s.pay);

// --- Cash: short is refused, over gives change ----------------------------------------
await type(String(naira(cartTotal) - 1));
s = await sheet();
check('₦1 short: Pay off, and it says why', s.payDisabled && s.pay === 'Pay' && /Less than the total/.test(s.error ?? ''), s.error);
await type('50000');
s = await sheet();
check('over the total: change shown, Pay on', !s.payDisabled && s.change === `Change ₦${(50000 - naira(cartTotal)).toLocaleString('en-NG')}`, s.change);
await type('1e2');
s = await sheet();
check('"1e2" is not an amount', s.payDisabled && /whole Naira/.test(s.error ?? ''));
await type('50000');

// --- The method picker replaces the sheet, and hands back ------------------------------
await click('.checkout__methodRow');
check('Payment method: Checkout leaves, the picker arrives alone', (await open('Select payment method')) === 'on' && (await open('Checkout')) !== 'on');
await click('[data-method="balance"]', 500);
check('Customer balance is not designed: it says so and nothing changes', (await toast()) === 'Customer balance is not designed yet'
  && (await open('Select payment method')) === 'on'
  && (await page.evaluate(() => document.querySelector('[data-method="cash"]').getAttribute('aria-checked'))) === 'true');

// The designer's call: a method paid into an account goes straight on to Select bank.
const closeBank = () => click('[role="dialog"][aria-label="Select bank"] .closeButton');
await click('[data-method="pos"]');
check('POS: Select bank follows at once, alone', (await open('Select bank')) === 'on'
  && (await open('Select payment method')) !== 'on' && (await open('Checkout')) !== 'on');
await closeBank();
s = await sheet();
check('...closing it cancels: Checkout as it was, still cash, no bank row', (await open('Checkout')) === 'on'
  && s.method === 'Cash' && s.bank === null && naira(s.amount) === 50000, JSON.stringify(s));
await click('.checkout__methodRow');
await click('[data-method="pos"]');
await click('[data-bank="palmpay"]');
s = await sheet();
check('POS works as bank: the method and its account on Checkout', (await open('Checkout')) === 'on' && s.method === 'POS'
  && s.bank === 'Palmpay - 8018826172', JSON.stringify(s));
check('...and it must be the total', s.payDisabled && /^A POS payment must be the total/.test(s.error ?? ''), s.error);
await click('.checkout__methodRow');
await click('[data-method="bank"]');
check('Bank transfer: Select bank follows at once too', (await open('Select bank')) === 'on' && (await open('Checkout')) !== 'on');
await click('[data-bank="access"]');
s = await sheet();
check('...then Checkout, the bank row in, the draft kept', (await open('Checkout')) === 'on' && s.method === 'Bank transfer'
  && s.bank === 'Access bank - 0676430810' && naira(s.amount) === 50000, JSON.stringify(s));
check('a transfer must be the total', s.payDisabled && /must be the total/.test(s.error ?? ''), s.error);
await type(String(naira(cartTotal)));
check('...and is, exactly', !(await sheet()).payDisabled);

// --- The bank picker: search, choose, back -------------------------------------------
await click('.checkout__methodRow--bank');
check('Bank opens Select bank alone', (await open('Select bank')) === 'on' && (await open('Checkout')) !== 'on');
await page.evaluate(() => document.querySelector('.bankPicker__search input').focus());
await page.keyboard.type('monie');
await wait(200);
const found = await page.evaluate(() => [...document.querySelectorAll('.bankPicker__row')].map((r) => r.dataset.bank));
check('search narrows the list', found.join() === 'moniepoint', found.join());
await click('[data-bank="moniepoint"]');
s = await sheet();
check('the chosen bank is on the Checkout', s.bank === 'Moniepoint - 8027715063' && !s.payDisabled, s.bank);

// --- Pay ------------------------------------------------------------------------------
// The designer's call: the confirmation screen takes over at once and the wait happens
// there; its loader becomes the success mark. Recorded in the page, frame by frame.
await page.evaluate(() => {
  const t = (window.__pay = { states: [] }); const t0 = performance.now();
  const tick = () => {
    const s = document.querySelector('.saleSuccess');
    const st = s?.dataset.status ?? null;
    if (st !== t.states.at(-1)?.status) t.states.push({ at: performance.now() - t0, status: st,
      checkoutUnder: !!document.querySelector('[role="dialog"][aria-label="Checkout"]'),
      // What the wait shows: the loader's drawn size, and any line a sighted user can read.
      // Its own scale, not its box: a spinning square's box is the rotated one's.
      ring: (r => r ? 72 * new DOMMatrix(getComputedStyle(r).transform).a : null)(document.querySelector('.saleSuccess__ring')),
      words: [...(s?.querySelectorAll('p') ?? [])].filter((e) => getComputedStyle(e).opacity !== '0').map((e) => e.textContent),
      said: s?.querySelector('.visuallyHidden')?.textContent ?? null });
    if (performance.now() - t0 < 2500) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
});
await page.evaluate(() => document.querySelector('.payButton').click());
await wait(60);
check('Pay cannot be pressed twice, and shows no spinner of its own', await page.evaluate(() => {
  const b = document.querySelector('.payButton');
  return b.disabled && !b.querySelector('.buttonSpinner') && b.textContent.startsWith('Pay ₦');
}));
await page.waitForSelector('.saleSuccess[data-status="success"]', { timeout: 3000 });
const states = await page.evaluate(() => window.__pay.states);
const waitState = states.find((x) => x.status === 'processing'), paid = states.find((x) => x.status === 'success');
check('the confirmation screen takes over at once, waiting, with Checkout kept under it',
  waitState && waitState.at < 100 && waitState.checkoutUnder, JSON.stringify(waitState));
check('...on a small loader with no words on screen, the wait still said to assistive tech',
  Math.abs(waitState.ring - 40) < 1 && waitState.words.length === 0 && waitState.said === 'Processing payment…', JSON.stringify(waitState));
check('...and turns to success once paid, held at least the reveal plus `slow`', paid && paid.at >= 700,
  `waiting at ${Math.round(waitState?.at)}ms, paid at ${Math.round(paid?.at)}ms`);
check('then Transaction success', true);
await page.waitForSelector('.receiptScreen[data-open="on"]', { timeout: 4000 });
const r = await page.evaluate(() => Object.fromEntries([...document.querySelectorAll('.receipt__row')]
  .filter((x) => x.querySelector('dt')).map((x) => [x.querySelector('dt').textContent, x.querySelector('dd').textContent])));
check('...then the receipt, on its own', true);
check('its total is the Checkout\'s, paid by the bank chosen', r.Total === cartTotal && r['Bank transfer · Moniepoint'] === cartTotal
  && r.Tendered === cartTotal && r.Balance === '₦0', JSON.stringify(r));
check('Sales Value - Discount + VAT = Total', naira(r['Sales Value']) - naira(r.Discount) + naira(r.VAT) === naira(r.Total));
check('a walk-in sale says so', r.Customer === 'Walk-in Customer');
await click('.receiptScreen__action:nth-child(1)', 300);
const shared = await page.evaluate(() => window.__shared);
check('Share hands the receipt to the share sheet', !!shared && shared.text.includes(r['Receipt No.']), shared?.title);
await click('.receiptScreen__action:nth-child(2)', 300);
check('Print opens the print dialog', (await page.evaluate(() => window.__printed)) === 1);

// --- New sale --------------------------------------------------------------------------
await click('.receiptScreen__newSale', 900);
const after = await page.evaluate(() => ({
  receipt: document.querySelector('.receiptScreen'),
  cart: document.querySelector('.sheet'),
  label: document.querySelector('.viewCart__label')?.textContent ?? null,
}));
check('New sale: the receipt goes, the order is empty, the Sales Point is back', !after.receipt && !after.cart && after.label === 'View cart',
  JSON.stringify(after.label));

// --- Cash with change, through to the receipt ------------------------------------------
await pick('Checkout: cash with change');
s = await sheet();
await click('.payButton', 2600);
await page.waitForSelector('.receiptScreen[data-open="on"]', { timeout: 4000 });
const rc = await page.evaluate(() => Object.fromEntries([...document.querySelectorAll('.receipt__row')]
  .filter((x) => x.querySelector('dt')).map((x) => [x.querySelector('dt').textContent, x.querySelector('dd').textContent])));
check('cash: Tendered is what was typed, Balance the change', naira(rc.Tendered) === naira(s.amount)
  && naira(rc.Balance) === naira(s.amount) - naira(rc.Total) && rc.Cash === rc.Total, `${rc.Tendered} - ${rc.Total} = ${rc.Balance}`);

// --- A failed payment keeps the sale ---------------------------------------------------
await pick('Checkout: payment fails');
const before = await sheet();
await click('.payButton', 300);
check('a failing payment still waits on the confirmation screen', !!(await page.$('.saleSuccess[data-status="processing"]')));
await wait(1300);
check('...then the screen draws back: Checkout and its draft as they were, and it says so', (await toast()) === 'Payment failed. Try again.'
  && (await open('Checkout')) === 'on' && (await sheet()).amount === before.amount && !(await page.$('.saleSuccess'))
  && await page.evaluate(() => !document.querySelector('.payButton').disabled));
await click('.payButton', 1200);
check('...and paying again goes through', !!(await page.$('.saleSuccess, .receiptScreen')));

// --- POS through to the receipt ------------------------------------------------------
await pick('Receipt: POS');
await page.waitForSelector('.receiptScreen[data-open="on"]', { timeout: 4000 });
const rp = await page.evaluate(() => Object.fromEntries([...document.querySelectorAll('.receipt__row')]
  .filter((x) => x.querySelector('dt')).map((x) => [x.querySelector('dt').textContent, x.querySelector('dd').textContent])));
check('a POS receipt names the account, as a transfer does, paid exactly', rp['POS · Access bank'] === rp.Total
  && rp.Tendered === rp.Total && rp.Balance === '₦0', JSON.stringify(rp));

check('no page errors', errors.length === 0, errors.join('; '));
await browser.close();
console.log(`\n${fails} failing`);
process.exit(fails ? 1 : 0);
