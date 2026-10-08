// Stock clamp, proved by consequence: the tap changes no line, the cart count stays,
// and the toast says why — without the success icon — and keeps its text through exit.
import pw from '/opt/node-tools/node_modules/playwright/index.js';
const { chromium } = pw;
const cat = await import(new URL('../src/data/catalogue.ts', import.meta.url).href);
const BASE = process.argv[2] ?? 'http://127.0.0.1:4251/';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let fails = 0;
const check = (n, pass, d = '') => { if (!pass) fails++; console.log(`${pass ? 'PASS' : 'FAIL'}  ${n}  ${d}`); };
const page = await browser.newPage({ viewport: { width: 1200, height: 1100 } });
await page.goto(`${BASE}?dev=1`, { waitUntil: 'networkidle' });
await page.waitForSelector('.productCard');

const juice = cat.PRODUCTS.find((p) => p.stock === 0);
const low = cat.PRODUCTS.find((p) => p.id === 'acc-beanie');
const tap = (name) => page.evaluate((n) => [...document.querySelectorAll('.productCard')]
  .find((c) => c.querySelector('.productCard__name').textContent === n).click(), name);
const toast = () => page.evaluate(() => {
  const t = document.querySelector('.toast');
  return { open: t.dataset.open, text: t.querySelector('.toast__message').textContent,
    icon: !!t.querySelector('svg, .icon, img'), opacity: Number(getComputedStyle(t).opacity) };
});
const cartLabel = () => page.evaluate(() => document.querySelector('.viewCart__label')?.textContent ?? '(no cart button)');

// --- Out of stock -------------------------------------------------------------
const before = await cartLabel();
await tap(juice.name);
await page.waitForTimeout(400);
let t = await toast();
check('tapping an out-of-stock product adds nothing', (await cartLabel()) === before, `${before} -> ${await cartLabel()}`);
check('...and says why', t.open === 'on' && t.text === 'Out of stock', `"${t.text}"`);
check('...without the success check-circle', !t.icon);

// --- At the shelf ceiling -----------------------------------------------------
for (let i = 0; i < low.stock; i++) { await tap(low.name); await page.waitForTimeout(60); }
await page.evaluate(() => document.querySelector('.viewCart').click());
await page.waitForTimeout(700);
const lowQty = () => page.evaluate((n) => {
  const l = [...document.querySelectorAll('.cartLine')].find((x) => x.querySelector('.cartLine__name').textContent === n);
  return l && { count: Number(l.querySelector('.qtyField__value span').textContent),
    unit: l.querySelectorAll('.qtyField__value span')[1].textContent,
    plusDisabled: l.querySelectorAll('.qtyField__step')[1].disabled };
}, low.name);
let q = await lowQty();
check(`taps up to the shelf (${low.stock}) all land`, q?.count === low.stock, JSON.stringify(q));
check('the stepper shows the unit abbreviation from the catalogue', q?.unit === low.units[0].abbrev, q?.unit);
check('the line\'s plus is disabled at the ceiling', q?.plusDisabled === true);
await page.evaluate(() => document.querySelector('[aria-label="Close order preview"]').click());
await page.waitForTimeout(700);
await tap(low.name);
await page.waitForTimeout(400);
t = await toast();
check('one more tap past the shelf says how many are left', t.text === `Only ${low.stock} ${low.units[0].abbrev} left`, `"${t.text}"`);
await page.evaluate(() => document.querySelector('.viewCart').click());
await page.waitForTimeout(700);
q = await lowQty();
check('...and the line is unchanged', q?.count === low.stock, `count ${q?.count}`);

// --- Exit keeps its text ------------------------------------------------------
await page.waitForFunction(() => document.querySelector('.toast').dataset.open === 'off', null, { timeout: 5000 });
const exitFrames = [];
for (let i = 0; i < 12; i++) { exitFrames.push(await toast()); await page.waitForTimeout(16); }
const mid = exitFrames.filter((f) => f.opacity > 0.05 && f.opacity < 0.95);
check('the toast fades out with its message still in it', mid.length > 0 && mid.every((f) => f.text.length > 0),
  `${mid.length} mid-exit frames, texts: ${[...new Set(mid.map((f) => f.text))].join(' | ')}`);

// --- A repeat tap restarts the timer ------------------------------------------
// Second refusal 2s into a 2.6s toast: it must still be up at 3s, and gone by 5.5s.
await page.evaluate(() => document.querySelector('[aria-label="Close order preview"]').click());
await page.waitForTimeout(700);
await tap(low.name);
await page.waitForTimeout(2000);
await tap(low.name);
await page.waitForTimeout(1000);
const at3 = (await toast()).open;
await page.waitForTimeout(2500);
const at55 = (await toast()).open;
check('a second refusal gets the full time again, then the toast still goes', at3 === 'on' && at55 === 'off',
  `at 3.0s: ${at3}, at 5.5s: ${at55}`);

// --- The success toast keeps its icon -----------------------------------------
await page.evaluate(() => { if (!document.querySelector('.devbar__panel')) document.querySelector('.devbar__handle').click(); });
await page.waitForTimeout(450);
await page.evaluate(() => [...document.querySelectorAll('.devbar__item')].find((b) => b.textContent.trim() === 'Customer added: toast').click());
await page.waitForTimeout(500);
t = await toast();
check('the success toast still carries its check-circle', t.icon && t.text === 'Customer has been created');

// --- Dev toolbar entry --------------------------------------------------------
await page.evaluate(() => { if (!document.querySelector('.devbar__panel')) document.querySelector('.devbar__handle').click(); });
await page.waitForTimeout(450);
await page.evaluate(() => [...document.querySelectorAll('.devbar__item')].find((b) => b.textContent.trim() === 'Sales point: out-of-stock tap').click());
await page.waitForTimeout(500);
t = await toast();
check('the dev toolbar reaches the out-of-stock tap in one go', t.open === 'on' && t.text === 'Out of stock' && !t.icon,
  `"${t.text}"`);

await browser.close();
console.log(`\n${fails} failing`);
process.exit(fails ? 1 : 0);
