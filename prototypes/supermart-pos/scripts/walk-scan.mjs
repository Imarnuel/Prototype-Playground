/**
 * Walks "Scanning an item barcode / name in sales point" (band `214:26054`) end to
 * end, through the scan button and the camera itself rather than the toolbar where it
 * can, and proves each step by its consequence: a scan lands as a Cart line with the
 * scanned product's name and price, a pick from "Which product?" lands as that
 * product, a refused or failed read adds nothing. Geometry is read off the DOM against
 * the frames' own coordinates.
 *
 *   node scripts/walk-scan.mjs [base-url]
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
  await wait(1000);
};
const click = (sel) => page.evaluate((s) => document.querySelector(s).click(), sel);
// Screen-relative box, rounded to 0.5.
const box = (sel) => page.evaluate((s) => {
  const el = document.querySelector(s); if (!el) return null;
  const o = document.querySelector('.device__screen').getBoundingClientRect(), r = el.getBoundingClientRect();
  const h = (v) => Math.round(v * 2) / 2;
  return { x: h(r.left - o.left), y: h(r.top - o.top), w: h(r.width), h: h(r.height) };
}, sel);
const near = (a, b, tol = 0.5) => a && Object.keys(b).every((k) => Math.abs(a[k] - b[k]) <= tol);
const lines = () => page.evaluate(() => [...document.querySelectorAll('.cartLine:not([data-leaving])')].map((l) => ({
  name: l.querySelector('.cartLine__name').textContent, count: l.querySelector('.qtyField__value, .qtyField')?.textContent.trim() ?? '',
  price: l.querySelector('.cartLine__price').textContent,
})));
const toast = () => page.evaluate(() => {
  const t = document.querySelector('.toast[data-open="on"]');
  return t ? { message: t.querySelector('.toast__message').textContent, variant: t.dataset.variant, tone: t.dataset.tone } : null;
});
const mode = () => page.evaluate(() => document.querySelector('.cart')?.dataset.mode ?? null);
// Waits for a read to resolve into a NEW toast (the toast counts its shows) or the
// matches sheet, then for the toast's entrance to finish so it measures at rest.
const shown = () => page.evaluate(() => +(document.querySelector('.toast')?.dataset.shown ?? 0));
let lastShown = 0;
const settled = async () => {
  const before = lastShown;
  await page.waitForFunction((b) => +(document.querySelector('.toast')?.dataset.shown ?? 0) > b || document.querySelector('.scanMatches'), before, { timeout: 5000 });
  lastShown = await shown();
  await wait(400);
};
const lensClear = () => page.waitForFunction(() => !document.querySelector('.scanScene'), null, { timeout: 5000 });

// --- Entry: the Sales Point's scan button --------------------------------------------
await pick('Sales point');
check('the scan button: 60x60 at [317,631], 12 above View cart (88:19369)',
  near(await box('.salesPoint__scan'), { x: 317, y: 631, w: 60, h: 60 }), JSON.stringify(await box('.salesPoint__scan')));
await click('.salesPoint__scan');
await wait(1000);
check('it opens the scanner: the camera, and the Cart docked under it', await mode() === 'docked' && !!(await box('.scanner')));
check('the docked Order Preview starts at 340, full width (88:19584)', await page.evaluate(() => getComputedStyle(document.querySelector('.cart')).clipPath.startsWith('inset(340px 0px 0px')), await page.evaluate(() => getComputedStyle(document.querySelector('.cart')).clipPath));
check('...its list 68 into the tray, 16 from the edge (the customer row at [16,424])', near(await box('.addCustomer'), { x: 16, y: 424, w: 361, h: 56 }) || (await page.evaluate(() => !document.querySelector('.addCustomer'))), JSON.stringify(await box('.addCustomer')));
check('its title row 16 into the tray (the lead at 356), with expand where the close was',
  (await box('.cart__lead')).y === 356 && await page.evaluate(() => document.querySelector('.cart__lead').getAttribute('aria-label') === 'Expand order preview'), JSON.stringify(await box('.cart__lead')));
check('empty, it says how to scan, centred in the 348 body (88:19506)',
  await page.evaluate(() => document.querySelector('.cart__empty .emptyState__title')?.textContent === 'Scan barcode or text')
  && Math.abs(((await box('.cart__empty')).y + (await box('.cart__empty')).h / 2) - 582) <= 1, JSON.stringify(await box('.cart__empty')));
check('...and its footer is there at opacity 0, out of reach', await page.evaluate(() => {
  const f = getComputedStyle(document.querySelector('.cart__footer')); return f.opacity === '0' && f.visibility === 'hidden';
}));
check('the camera\'s close at [20,60] and the frame 281x194 at [56,125]',
  near(await box('.scanner__close'), { x: 20, y: 60, w: 40, h: 40 }) && near(await box('.scanner__frame'), { x: 56, y: 125, w: 281, h: 194 }));
check('the status bar turns white over the camera', await page.evaluate(() => getComputedStyle(document.querySelector('.statusBar__time')).color === 'rgb(255, 255, 255)'));

// --- A barcode: the camera's first item is Crew Socks' label (88:19777 → 88:19938) ----
await click('.scanner__camera');
await wait(150);
const label = await page.evaluate(() => {
  const s = document.querySelector('.scanLabel svg'); if (!s) return null;
  return { bars: s.querySelectorAll('rect').length, digits: [...s.querySelectorAll('text')].map((t) => t.textContent).join('') };
});
check('a tap holds up a barcode label: Crew Socks\' own EAN-13', label?.digits === '6153000000076', JSON.stringify(label));
await settled();
const afterBarcode = await lines();
check('the read adds Crew Socks to the docked Cart at its price', afterBarcode.length === 1 && afterBarcode[0].name === 'Crew Socks' && afterBarcode[0].price === '₦950', JSON.stringify(afterBarcode));
const t1 = await toast();
check('"Crew Socks added to cart", in the scanner\'s green banner', t1?.message === 'Crew Socks added to cart' && t1.variant === 'banner' && t1.tone === 'success', JSON.stringify(t1));
check('the banner: 357x52 at [20,54] (88:20033)', near(await box('.toast[data-open="on"]'), { x: 20, y: 54, w: 357, h: 52 }), JSON.stringify(await box('.toast[data-open="on"]')));
check('the docked Cart shows the customer row and the buttons, no total',
  await page.evaluate(() => !!document.querySelector('.addCustomer') && getComputedStyle(document.querySelector('.cart__footer')).visibility === 'visible'
    && getComputedStyle(document.querySelector('.cart__totalSlot')).visibility === 'hidden'));
check('the docked list: the customer row at [16,424], 68 into the tray, 16 from the edge (88:19601)', near(await box('.addCustomer'), { x: 16, y: 424, w: 361, h: 56 }), JSON.stringify(await box('.addCustomer')));
check('the docked footer: 96 tall, the buttons at the bottom (88:19664)', near(await box('.cart__footer'), { x: 0, y: 756, w: 393, h: 96 }), JSON.stringify(await box('.cart__footer')));
await lensClear();
check('the item leaves the lens: the camera is dark again (88:19584)', !(await page.evaluate(() => document.querySelector('.scanScene'))));

// --- A name: the second item is a Northline tag (88:19817 → 88:19858) ----------------
await click('.scanner__camera');
await settled();
const sheet = await page.evaluate(() => ({
  title: document.querySelector('.scanMatches .modalHeader__title')?.textContent,
  sub: document.querySelector('.scanMatches .modalHeader__subtitle')?.textContent,
  detected: document.querySelector('.scanMatches__badge')?.textContent,
  rows: [...document.querySelectorAll('.scanMatches__row')].map((r) => ({ name: r.querySelector('.scanMatches__name').textContent, best: !!r.querySelector('.scanMatches__best'), price: r.querySelector('.scanMatches__price').textContent })),
}));
check('a Northline tag asks "Which product?": 3 matches for scanned text, detected "Northline"',
  sheet.title === 'Which product?' && sheet.sub === '3 matches for scanned text' && sheet.detected === 'Northline' && sheet.rows.length === 3, JSON.stringify(sheet));
check('...the three Northline products, Oxford Shirt the one best match', sheet.rows[0]?.name === 'Oxford Shirt' && sheet.rows.filter((r) => r.best).length === 1 && sheet.rows[0].best);
await page.evaluate(() => document.querySelectorAll('.scanMatches__row')[2].click());
await wait(900);
const afterPick = await lines();
check('the pick is what lands — Baseball Cap, the third row, not the best match', afterPick.some((l) => l.name === 'Baseball Cap' && l.price === '₦7,500') && afterPick.length === 2, JSON.stringify(afterPick));
check('"Baseball Cap added to cart"', (await toast())?.message === 'Baseball Cap added to cart');
await lensClear();

// --- Expand, close, and back ------------------------------------------------------
await click('.cart__lead');
await wait(900);
check('expand grows it into the full Cart; the camera fades and goes', await mode() === 'full'
  && await page.evaluate(() => getComputedStyle(document.querySelector('.cart')).clipPath.startsWith('inset(0px')) && near(await box('.addCustomer'), { x: 12, y: 130, w: 361, h: 56 }) && !(await box('.scanner')), JSON.stringify(await box('.addCustomer')));
check('...with the close back in the title bar and the order total in the footer', await page.evaluate(() =>
  document.querySelector('.cart__lead').getAttribute('aria-label') === 'Close order preview' && getComputedStyle(document.querySelector('.cart__totalSlot')).visibility === 'visible'));
check('the status bar is dark again', await page.evaluate(() => getComputedStyle(document.querySelector('.statusBar__time')).color !== 'rgb(255, 255, 255)'));
await click('.cart__lead');
await wait(900);
check('close goes to the Sales Point, holding the scanned sale', await page.evaluate(() => document.querySelector('.viewCart__label').textContent.includes('(2)')));
await click('.viewCart');
await wait(900);
check('View cart then opens the full Cart, not the camera', await mode() === 'full' && !(await box('.scanner')));

// --- The scanner's X from the Sales Point -----------------------------------------
await pick('Scanner: with items');
await click('.scanner__close');
await wait(900);
check('from the Sales Point, the scanner\'s X goes back to it', !(await page.evaluate(() => document.querySelector('.cart'))) && await page.evaluate(() => document.querySelector('.viewCart__label').textContent.includes('(4)')));

// --- The empty Cart and its scan button (88:16199, 88:19449) --------------------------
await pick('Cart: empty');
check('the empty Cart: no customer row, no footer, the cart glyph and two lines, centred on the screen',
  await page.evaluate(() => !document.querySelector('.addCustomer') && getComputedStyle(document.querySelector('.cart__footer')).visibility === 'hidden'
    && document.querySelector('.cart__empty .emptyState__body').textContent === 'Your cart is empty.Items you add to cart will appear here.'
    && !document.querySelector('.cart__empty .emptyState__title'))
  && Math.abs(((await box('.cart__empty')).y + (await box('.cart__empty')).h / 2) - 426) <= 1, JSON.stringify(await box('.cart__empty')));
check('its scan button, 16 from the right and 32 from the bottom (88:19466)', near(await box('.cart__scan'), { x: 317, y: 760, w: 60, h: 60 }), JSON.stringify(await box('.cart__scan')));
await click('.cart__scan');
await wait(900);
check('it docks the Cart under the camera', await mode() === 'docked');
await click('.scanner__close');
await wait(900);
check('...and the X undocks it back into the Cart, not to the Sales Point', await mode() === 'full' && !(await box('.scanner')));

// --- Refusals and failures add nothing -------------------------------------------
for (const [entry, message] of [
  ['Scanner: unknown barcode', 'No product has the barcode 6153000000991'],
  ['Scanner: name matches nothing', 'No product matches “Brightwear”'],
  ['Scanner: read fails', 'Couldn’t read that. Try again.'],
]) {
  await pick(entry);
  await settled();
  const t = await toast();
  check(`${entry.replace('Scanner: ', '')}: says so in a neutral banner, and adds nothing`,
    t?.message === message && t.tone === 'notice' && (await lines()).length === 0, JSON.stringify(t));
}
await pick('Scanner: past the stock');
await settled();
const stock = await lines();
check('a scan past the shelf is refused as a tap is: "Only 3 ea left", still 3', (await toast())?.message === 'Only 3 ea left' && stock.length === 1, JSON.stringify(stock));
await pick('Scanner: name with one match');
await settled();
check('a name with one match is added at once, no sheet', !(await page.evaluate(() => document.querySelector('.scanMatches'))) && (await lines()).some((l) => l.name === 'Canvas Tote'));

// --- Closing "Which product?" puts the item down ----------------------------------
await pick('Scanner: scan a product name');
await settled();
await click('.scanMatches .closeButton');
await wait(900);
check('closing "Which product?" adds nothing and the camera is clear to scan again',
  (await lines()).length === 0 && !(await page.evaluate(() => document.querySelector('.scanScene'))) && await page.evaluate(() => !document.querySelector('.scanner__camera').disabled));

// --- One at a time -----------------------------------------------------------------
await pick('Scanner');
await click('.scanner__camera');
await wait(40);
check('while an item is being read, the camera takes no second tap', await page.evaluate(() => document.querySelector('.scanner__camera').disabled));
await settled();
await lensClear();
check('...so one tap is one line', (await lines()).length === 1);

// --- Queue order from the scanner leaves no camera behind -------------------------
await pick('Scanner: with items');
await click('.cart__queue');
await page.waitForFunction(() => !document.querySelector('.cart'), null, { timeout: 5000 });
await click('.salesPoint__overflow');
await wait(900);
check('after Queue order from the scanner, the Cart opens full', await mode() === 'full' && !(await box('.scanner')));

check('no page errors', errors.length === 0, errors.join(' | '));
console.log(`\n${fails} failing`);
await browser.close();
process.exit(fails ? 1 : 0);
