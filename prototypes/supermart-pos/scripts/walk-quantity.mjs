/**
 * The Quantity sheet, proved by consequence: a draft that reaches the cart only
 * through the check, the unit change landing on the line and the order total, strict
 * typed input, over-stock units refused, and the sheet entering AND leaving.
 *
 *   node scripts/walk-quantity.mjs [base-url]
 */
import pw from '/opt/node-tools/node_modules/playwright/index.js';

const BASE = process.argv[2] ?? 'http://127.0.0.1:4251/';
const browser = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let fails = 0;
const check = (n, pass, d = '') => { if (!pass) fails++; console.log(`${pass ? 'PASS' : 'FAIL'}  ${n}${d ? `  ${d}` : ''}`); };
const money = (s) => Number(String(s).replace(/[^\d]/g, ''));

const open = async (opts = {}) => {
  const page = await browser.newPage({ viewport: { width: 1200, height: 1100 }, ...opts });
  page.errors = [];
  page.on('pageerror', (e) => page.errors.push(e.message));
  await page.goto(`${BASE}?dev=1`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.productCard');
  return page;
};
const pick = async (page, label) => {
  await page.evaluate(() => { if (!document.querySelector('.devbar__panel')) document.querySelector('.devbar__handle').click(); });
  await page.waitForTimeout(450);
  await page.evaluate((l) => [...document.querySelectorAll('.devbar__item')].find((b) => b.textContent.trim() === l).click(), label);
  await page.waitForTimeout(1000);
};
const click = async (page, sel, wait = 150) => { await page.evaluate((s) => document.querySelector(s).click(), sel); await page.waitForTimeout(wait); };
const line = (page, name) => page.evaluate((n) => {
  const l = [...document.querySelectorAll('.cartLine')].find((x) => x.querySelector('.cartLine__name').textContent === n);
  if (!l) return null;
  const v = l.querySelectorAll('.qtyField__value span');
  return { count: Number(v[0].textContent), unit: v[1].textContent, price: l.querySelector('.cartLine__price').textContent };
}, name);
const sheet = (page) => page.evaluate(() => {
  const p = document.querySelector('.quantitySheet');
  if (!p) return null;
  const s = document.querySelector('.device__screen').getBoundingClientRect();
  return {
    open: p.closest('.blanket').dataset.open,
    count: document.querySelector('.qtyStepper__count')?.textContent ?? null,
    unit: document.querySelector('.qtyStepper__unit')?.textContent,
    editing: !!document.querySelector('.qtyStepper__input'),
    checked: [...document.querySelectorAll('.measurement__row[aria-checked="true"]')].map((r) => r.dataset.unit),
    disabled: [...document.querySelectorAll('.measurement__row[aria-disabled="true"]')].map((r) => r.dataset.unit),
    hasMeasurement: !!document.querySelector('.measurement'),
    inside: p.contains(document.activeElement),
    active: document.activeElement?.className ?? '',
    top: p.getBoundingClientRect().top - s.top,
  };
});
const frameScroll = (page) => page.evaluate(() => [...document.querySelectorAll('.device, .device__screen, .device *')]
  .reduce((a, e) => a + e.scrollTop, 0) - document.querySelector('.cart__scroll').scrollTop);

// --- Opened from the Cart line's quantity ------------------------------------
let page = await open();
await pick(page, 'Cart: fill with 4 lines');
const before = await line(page, 'Cola');
// The keyboard path — focus, then Enter — since that is where focus return matters.
// A programmatic click() moves no focus, so there would be nothing to return to.
await page.evaluate(() => [...document.querySelectorAll('.cartLine')].find((l) => l.querySelector('.cartLine__name').textContent === 'Cola')
  .querySelector('button.qtyField__value').focus());
await page.keyboard.press('Enter');
await page.waitForTimeout(800);
let s = await sheet(page);
check('the line\'s quantity opens the Quantity sheet', s?.open === 'on');
check('it opens on the line as it is', s.count === String(before.count) && s.unit === before.unit && s.checked.join() === 'each',
  `${s.count} ${s.unit}, ${s.checked}`);
check('focus moves into the sheet', s.inside);
check('the frame did not scroll to reveal it', (await frameScroll(page)) === 0);

// --- A draft: nothing reaches the cart until the check -----------------------
await click(page, '.qtyStepper__step:last-child');
await click(page, '.qtyStepper__step:last-child');
s = await sheet(page);
check('the stepper changes the draft', s.count === String(before.count + 2), s.count);
check('...and not the cart', (await line(page, 'Cola')).count === before.count);
await page.evaluate(() => document.querySelector('.blanket:has(.quantitySheet)').click());
await page.waitForTimeout(500);
check('a tap on the blanket does not throw the draft away', (await sheet(page)).open === 'on' && (await sheet(page)).count === String(before.count + 2));
await click(page, '.quantitySheet .closeButton', 700);
check('the close discards it: the line is unchanged', JSON.stringify(await line(page, 'Cola')) === JSON.stringify(before), JSON.stringify(await line(page, 'Cola')));
check('...focus returns to the quantity that opened it', (await page.evaluate(() => document.activeElement?.className)) === 'qtyField__value');
await page.keyboard.press('Enter');
await page.waitForTimeout(800);
check('reopening starts a fresh draft from the line', (await sheet(page)).count === String(before.count));

// --- A unit change, proved on the line AND the order total --------------------
await click(page, '[data-unit="pack"]');
await click(page, '.qtyStepper__step:last-child');
s = await sheet(page);
check('choosing Pack moves the selection', s.checked.join() === 'pack');
await click(page, '.modalHeader__confirm', 800);
const after = await line(page, 'Cola');
check('the check commits: the line reads in packs', after.count === 2 && after.unit === 'pck', `${after.count} ${after.unit}`);
check('...and is priced as 2 packs of 4 at N500', money(after.price) === 2 * 4 * 500, after.price);
await page.evaluate(() => document.querySelector('.orderTotal__toggle').click());
await page.waitForTimeout(600);
const totals = await page.evaluate(() => ({
  lines: [...document.querySelectorAll('.cartLine__price')].reduce((a, p) => a + Number(p.textContent.replace(/[^\d]/g, '')), 0),
  subtotal: Number(document.querySelector('.orderTotal__amount').textContent.replace(/[^\d]/g, '')),
}));
check('the order Subtotal moved with it', totals.lines === totals.subtotal, `lines ${totals.lines} = subtotal ${totals.subtotal}`);
await page.close();

// --- Typing a count -----------------------------------------------------------
page = await open();
await pick(page, 'Quantity sheet');
await click(page, '.qtyStepper__value', 300);
s = await sheet(page);
check('tapping the count edits it, focused', s.editing && s.active === 'qtyStepper__input');
check('...without scrolling the frame', (await frameScroll(page)) === 0);
const type = async (text) => {
  // Enter ends editing, so each attempt taps the count again, as a person would.
  if (!(await sheet(page)).editing) await click(page, '.qtyStepper__value', 200);
  await page.evaluate(() => document.querySelector('.qtyStepper__input').select());
  await page.keyboard.type(text);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(150);
  return (await sheet(page)).count;
};
const r1 = await type('1e2');
check('"1e2" is refused, not read as 100', r1 === '10');
check('"0" is refused', (await type('0')) === '10');
check('"7" is taken', (await type('7')) === '7');
check('"9999" is held to the shelf', (await type('9999')) === '180', 'Zivra Cola: 180 in stock');
await click(page, '.qtyStepper__value', 300);
await page.keyboard.press('Escape');
await page.waitForTimeout(200);
s = await sheet(page);
check('Escape leaves editing and keeps the sheet open', !s.editing && s.open === 'on');
await page.keyboard.press('Escape');
await page.waitForTimeout(700);
// Once its exit has finished the sheet unmounts, so "closed" is off OR gone.
const closed = await sheet(page);
check('a second Escape closes the sheet without committing', (closed === null || closed.open === 'off') && (await line(page, 'Cola')).count === 10);
await page.close();

// --- The editing state, presented directly ------------------------------------
page = await open();
await pick(page, 'Quantity sheet: editing');
s = await sheet(page);
check('the dev toolbar presents 88:11647, caret in the count', s.editing && s.active === 'qtyStepper__input');
await page.close();

// --- Units the shelf cannot supply --------------------------------------------
page = await open();
await pick(page, 'Quantity sheet: unit over stock');
s = await sheet(page);
check('2 malt drinks in packs of 6 is past the 3 on the shelf: Pack and Carton refused',
  s.disabled.join() === 'pack,carton', s.disabled.join());
await click(page, '[data-unit="pack"]');
check('tapping a refused unit does not select it', (await sheet(page)).checked.join() === 'each');
await page.evaluate(() => document.querySelector('[data-unit="each"]').focus());
await page.keyboard.press('ArrowDown');
await page.waitForTimeout(100);
check('the arrow keys skip refused units', (await sheet(page)).checked.join() === 'each');
const reason = await page.evaluate(() => document.getElementById(document.querySelector('[data-unit="pack"]').getAttribute('aria-describedby'))?.textContent);
check('a refused unit says why to assistive tech', reason === 'Not enough in stock', reason);
await page.close();

// --- A product sold only singly -----------------------------------------------
page = await open();
await page.evaluate(() => [...document.querySelectorAll('.productCard')].find((c) => c.querySelector('.productCard__name').textContent === 'Baby Wipes').click());
await page.evaluate(() => document.querySelector('.viewCart').click());
await page.waitForTimeout(800);
await page.evaluate(() => document.querySelector('button.qtyField__value').click());
await page.waitForTimeout(800);
check('a product sold only singly has no Measurement list', (await sheet(page)).hasMeasurement === false);
check('no page errors through any of it', page.errors.length === 0, page.errors.join('; '));
await page.close();

// --- Motion: enters and leaves ------------------------------------------------
// Sampled every animation frame at the REAL durations. Stretching the CSS alone
// would not stretch the JS timer that unmounts the sheet, and the test would watch
// it vanish mid-travel through its own fault.
page = await open();
await pick(page, 'Cart: fill with 4 lines');
const sample = (act) => page.evaluate((a) => new Promise((done) => {
  const s = document.querySelector('.device__screen').getBoundingClientRect();
  const out = [];
  const times = [];
  const t0 = performance.now();
  const tick = () => {
    const p = document.querySelector('.quantitySheet');
    out.push(p ? Math.round(p.getBoundingClientRect().top - s.top) : null);
    times.push(performance.now() - t0);
    if (performance.now() - t0 < 700) requestAnimationFrame(tick); else done({ out, times });
  };
  if (a === 'open') document.querySelector('button.qtyField__value').click();
  else document.querySelector('.quantitySheet .closeButton').click();
  requestAnimationFrame(tick);
}), act);
const { out: entering } = await sample('open');
await page.waitForTimeout(300);
const { out: leaving, times: leaveTimes } = await sample('close');
const travel = (a) => new Set(a.filter((v) => v !== null && v > 335 && v < 846)).size;
check('the sheet travels in over several frames', travel(entering) > 4 && entering.at(-1) === 335,
  `${travel(entering)} in-between frames, ends at ${entering.at(-1)}`);
const gone = leaving.indexOf(null);
// The shared exit curve is back-loaded (BUILD-PLAN #37), so where its last painted
// frame lands varies run to run. What must hold is that the sheet stays mounted for
// the whole exit — SHEET_SPRING.exitDuration, 300ms — and moves while it does.
check('and travels out, mounted for its whole exit', travel(leaving) > 4 && gone > 0 && leaveTimes[gone] >= 290,
  `${travel(leaving)} in-between frames, unmounted at ${Math.round(leaveTimes[gone])}ms`);
await page.close();

page = await open({ reducedMotion: 'reduce' });
await pick(page, 'Cart: fill with 4 lines');
await page.evaluate(() => document.querySelector('button.qtyField__value').click());
await page.waitForTimeout(100);
check('reduced motion: in place at once', Math.round((await sheet(page)).top) === 335, String((await sheet(page)).top));
await page.close();

await browser.close();
console.log(`\n${fails} failing`);
process.exit(fails ? 1 : 0);
