/** BottomSheet behaviour: focus in, Escape, Tab trap, focus restore, no scroll lurch. */
import pw from '/opt/node-tools/node_modules/playwright/index.js';
const URL = process.argv[2] ?? 'http://127.0.0.1:4251/';
let pass = 0, fail = 0;
const check = (ok, name, d = '') => { ok ? pass++ : fail++; console.log((ok ? 'PASS  ' : 'FAIL  ') + name + '  ' + d); };
const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await b.newPage({ viewport: { width: 1200, height: 1100 } });
await page.goto(URL + '?dev=1', { waitUntil: 'networkidle' });
await page.waitForSelector('.productCard');
const pick = async (l) => {
  await page.evaluate(() => { if (!document.querySelector('.devbar__panel')) document.querySelector('.devbar__handle').click(); });
  await page.waitForTimeout(400);
  await page.evaluate((x) => [...document.querySelectorAll('.devbar__item')].find((y) => y.textContent.trim() === x).click(), l);
  await page.waitForTimeout(900);
};
const where = () => page.evaluate(() => {
  const a = document.activeElement;
  return { inSheet: !!a?.closest('.sheetPanel'), isPanel: a?.classList.contains('sheetPanel'),
    cls: a ? (a.className || a.tagName).toString().split(' ')[0] : null,
    open: !!document.querySelector('.blanket[data-open="on"]'), mounted: !!document.querySelector('.blanket') };
});
const scrolls = () => page.evaluate(() => ({
  win: window.scrollY,
  screen: document.querySelector('.device__screen').scrollTop,
  sheet: document.querySelector('.sheet')?.scrollTop ?? 0,
}));

await pick('Cart: fill with 4 lines');
// open the sheet the way a user does, from the row, with the row focused
await page.focus('.addCustomer__pick');
const before = await scrolls();
await page.keyboard.press('Enter');
await page.waitForTimeout(700);
let w = await where();
check(w.open && w.inSheet, 'opening moves focus into the dialog', JSON.stringify(w));
const after = await scrolls();
check(JSON.stringify(before) === JSON.stringify(after), 'and nothing scrolled to reveal it', JSON.stringify(after));

// Tab cycles inside
const seen = new Set();
for (let i = 0; i < 40; i++) { await page.keyboard.press('Tab'); const x = await where(); seen.add(x.inSheet); }
check(seen.size === 1 && seen.has(true), 'Tab never leaves the dialog', '40 presses');
for (let i = 0; i < 40; i++) { await page.keyboard.press('Shift+Tab'); const x = await where(); seen.add(x.inSheet); }
check(seen.size === 1 && seen.has(true), 'nor does Shift+Tab', '40 presses');

// Escape closes and focus returns to the opener
await page.keyboard.press('Escape');
await page.waitForTimeout(700);
w = await where();
check(!w.mounted, 'Escape closes the sheet');
check(w.cls === 'addCustomer__pick', 'focus returns to what opened it', w.cls ?? '');

// the blanket still dismisses Select customer (dismissOnBlanket defaults on)
await pick('Select customer');
await page.evaluate(() => document.querySelector('.blanket').click());
await page.waitForTimeout(700);
check(!(await where()).mounted, 'the blanket still dismisses Select customer');

// reduced motion: focus still lands
const rm = await b.newPage({ viewport: { width: 1200, height: 1100 }, reducedMotion: 'reduce' });
await rm.goto(URL + '?dev=1', { waitUntil: 'networkidle' });
await rm.waitForSelector('.productCard');
await rm.evaluate(() => { if (!document.querySelector('.devbar__panel')) document.querySelector('.devbar__handle').click(); });
await rm.waitForTimeout(400);
await rm.evaluate(() => [...document.querySelectorAll('.devbar__item')].find((y) => y.textContent.trim() === 'Select customer').click());
await rm.waitForTimeout(300);
check(await rm.evaluate(() => !!document.activeElement?.closest('.sheetPanel')), 'focus lands under reduced motion too');

console.log(`\n${pass} passing, ${fail} failing`);
await b.close();
if (fail) process.exitCode = 1;
