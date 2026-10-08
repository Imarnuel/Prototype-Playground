/**
 * "Applying discount to an order", proved by consequence: the ••• menu, the order
 * discount landing in the Cart's breakdown and reconciling, a draft that reaches the
 * order only through the check, removal by an empty field, and Clear cart with undo.
 *
 *   node scripts/walk-discount.mjs [base-url]
 */
import pw from '/opt/node-tools/node_modules/playwright/index.js';

const BASE = process.argv[2] ?? 'http://127.0.0.1:4251/';
const browser = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let fails = 0;
const check = (n, pass, d = '') => { if (!pass) fails++; console.log(`${pass ? 'PASS' : 'FAIL'}  ${n}${d ? `  ${d}` : ''}`); };
const naira = (s) => (s ? Number(s.replace(/[^\d]/g, '')) * (s.trim().startsWith('−') ? -1 : 1) : null);

const page = await browser.newPage({ viewport: { width: 1200, height: 1100 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(`${BASE}?dev=1`, { waitUntil: 'networkidle' });
await page.waitForSelector('.productCard');

const wait = (ms) => page.waitForTimeout(ms);
const pick = async (label) => {
  await page.evaluate(() => { if (!document.querySelector('.devbar__panel')) document.querySelector('.devbar__handle').click(); });
  await wait(450);
  await page.evaluate((l) => [...document.querySelectorAll('.devbar__item')].find((b) => b.textContent.trim() === l).click(), label);
  await wait(900);
};
const dialog = (name) => page.evaluate((n) => {
  const d = document.querySelector(`[role="dialog"][aria-label="${n}"]`);
  return d ? d.closest('.blanket').dataset.open : null;
}, name);
const breakdown = () => page.evaluate(() => {
  const rows = Object.fromEntries([...document.querySelectorAll('.orderTotal__row')]
    .map((r) => [r.querySelector('dt').textContent, r.querySelector('dd').textContent]));
  return { ...rows, Total: document.querySelector('.orderTotal__value').textContent };
});
const field = () => page.evaluate(() => {
  const f = document.querySelector('.applyDiscount .detailField');
  const input = f.querySelector('input');
  const suffix = f.querySelector('.detailField__row > span[aria-hidden]:last-child');
  return {
    shown: f.querySelector('.detailField__row').textContent.replace(/\s/g, '') .replace(input.value, '') ,
    value: input.value,
    focused: document.activeElement === input,
    kind: document.querySelector('.applyDiscount .segmented').dataset.kind,
    gap: suffix && input.value ? Math.round(suffix.getBoundingClientRect().left - input.getBoundingClientRect().left) : null,
    error: document.querySelector('.applyDiscount .fieldError[data-open="on"]')?.textContent ?? null,
  };
});
const typeValue = async (text) => {
  await page.evaluate(() => document.querySelector('.applyDiscount input').select());
  if (text === '') await page.keyboard.press('Backspace'); else await page.keyboard.type(text);
  await wait(250);
};
const choose = async (option) => { await page.evaluate((o) => document.querySelector(`.moreOptions__row[data-option="${o}"]`).click(), option); await wait(900); };
const openMenu = async () => { await page.evaluate(() => document.querySelector('.cart__iconButton[aria-label="More options"]').click()); await wait(700); };
const confirm = async () => { await page.evaluate(() => document.querySelector('.applyDiscount .modalHeader__confirm').click()); await wait(700); };

// --- The menu ---------------------------------------------------------------------
await pick('Cart: fill with 4 lines');
const before = await breakdown();
await openMenu();
check('••• opens More options', (await dialog('More options')) === 'on');
const rows = await page.evaluate(() => [...document.querySelectorAll('.moreOptions__row')].map((r) => r.textContent));
check('four rows, in the frame\'s order', rows.join('|') === 'Add a customer|Apply discount|Clear cart|Queued orders', rows.join('|'));

// --- Apply 10% ----------------------------------------------------------------------
await choose('discount');
check('Apply discount opens once the menu has gone', (await dialog('Apply discount')) === 'on' && (await dialog('More options')) === null);
let f = await field();
check('it opens empty, on %, with the caret in the field', f.value === '' && f.kind === 'percent' && f.focused && f.shown === '%', JSON.stringify(f));
await typeValue('10');
f = await field();
check('"10" reads as 10%, the % right after the number', f.gap !== null && f.gap < 24, `% starts ${f.gap}px into the input`);
check('...and nothing reaches the order before the check', JSON.stringify(await breakdown()) === JSON.stringify(before));
await confirm();
check('the check closes the sheet', (await dialog('Apply discount')) !== 'on');
await page.evaluate(() => document.querySelector('.orderTotal__toggle').click());
await wait(600);
let b = await breakdown();
const sub = naira(b.Subtotal);
check('Discount is 10% of the order, whole Naira', naira(b.Discount) === -Math.floor((sub * 10 + 50) / 100), `${b.Discount} on ${b.Subtotal}`);
check('the breakdown reconciles', sub + naira(b.Discount) + naira(b.Tax) === naira(b.Total), JSON.stringify(b));
check('VAT fell with it: charged on what is collected', naira(b.Tax) < naira(before.Tax), `${before.Tax} -> ${b.Tax}`);

// --- Reopen, switch to ₦, refuse too much, then a valid amount ---------------------
await openMenu(); await choose('discount');
f = await field();
check('reopening starts from the discount as applied', f.value === '10' && f.kind === 'percent');
await page.evaluate(() => document.querySelector('.applyDiscount .segmented__option[aria-label="Naira amount"]').click());
await wait(300);
f = await field();
check('switching to ₦ clears the number', f.kind === 'amount' && f.value === '');
await typeValue('99999999');
f = await field();
check('an amount past the order is refused, saying why', /More than the order's/.test(f.error ?? ''), f.error);
await confirm();
check('...and the check does nothing while it is', (await dialog('Apply discount')) === 'on');
await typeValue('500');
await confirm();
b = await breakdown();
check('₦500 off the order', naira(b.Discount) === -500 && sub + naira(b.Discount) + naira(b.Tax) === naira(b.Total), JSON.stringify(b));

// --- Close discards; an empty field removes ----------------------------------------
await openMenu(); await choose('discount');
await typeValue('900');
await page.evaluate(() => document.querySelector('.applyDiscount .closeButton').click());
await wait(700);
check('the close discards the draft', naira((await breakdown()).Discount) === -500);
await openMenu(); await choose('discount');
await typeValue('');
await confirm();
b = await breakdown();
check('an empty field removes the discount: the row goes', b.Discount === undefined && b.Total === before.Total, JSON.stringify(b));

// --- Clear cart, and undo -----------------------------------------------------------
await openMenu(); await choose('discount'); await typeValue('15'); await confirm();
const withDiscount = await breakdown();
await openMenu(); await choose('clear');
await wait(500);
const cleared = await page.evaluate(() => ({
  lines: document.querySelectorAll('.cartLine').length,
  toast: document.querySelector('.toast[data-open="on"] .toast__message')?.textContent,
  undo: !!document.querySelector('.toast[data-open="on"] .toast__action'),
}));
check('Clear cart empties the order and offers Undo', cleared.lines === 0 && cleared.toast === 'Cart cleared' && cleared.undo, JSON.stringify(cleared));
await page.evaluate(() => document.querySelector('.toast__action').click());
await wait(800);
const restored = await page.evaluate(() => document.querySelectorAll('.cartLine').length);
check('Undo brings back the lines AND the discount', restored === 4 && JSON.stringify(await breakdown()) === JSON.stringify(withDiscount),
  `${restored} lines, ${JSON.stringify(await breakdown())}`);
check('...and the toast goes', (await page.evaluate(() => document.querySelector('.toast').dataset.open)) === 'off');
await page.evaluate(() => document.querySelector('.cart__iconButton[aria-label="Clear order"]').click());
await wait(800);
check('the title-bar trash clears with the same Undo', (await page.evaluate(() => !!document.querySelector('.toast[data-open="on"] .toast__action'))));
await page.evaluate(() => document.querySelector('.toast__action').click());
await wait(800);

// --- The other two rows ---------------------------------------------------------------
await openMenu(); await choose('queued');
// Designed since, in band `170:8988` (walk-queue covers it): it opens its own sheet.
check('Queued orders opens the Queued orders sheet', (await dialog('Queued orders')) === 'on');
await page.keyboard.press('Escape'); await wait(600);
await openMenu(); await choose('customer');
check('Add a customer opens the customer picker', (await dialog('Select customer')) === 'on');
await page.keyboard.press('Escape'); await wait(600);
await openMenu();
await page.keyboard.press('Escape'); await wait(600);
check('Escape closes the menu', (await dialog('More options')) !== 'on');
check('no page errors', errors.length === 0, errors.join('; '));

await browser.close();
console.log(`\n${fails} failing`);
process.exit(fails ? 1 : 0);
