/**
 * Proves how a cart line may change: stock clamps, the persisted discount clamp, and
 * what a unit change does to a price override. The arithmetic itself is proved by
 * verify-catalogue.mjs; this file proves the rules on top of it.
 *
 * `src/state/cart.ts` imports '../data/catalogue' without an extension, which Node's
 * type stripping cannot resolve, so it is bundled first with the esbuild Vite already
 * ships. The bundle is the app's own code, not a copy of it.
 */
import { build } from 'esbuild';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outdir = fs.mkdtempSync(path.join(os.tmpdir(), 'verify-cart-'));
const outfile = path.join(outdir, 'cart.mjs');
await build({
  entryPoints: [path.join(root, 'src/state/cart.ts')],
  bundle: true, format: 'esm', platform: 'node', outfile, logLevel: 'error',
});
const cart = await import(pathToFileURL(outfile).href);
// The receipt builder too: it imports the bank logos, which load as data URLs here.
const saleFile = path.join(outdir, 'sale.mjs');
await build({
  entryPoints: [path.join(root, 'src/state/sale.ts')],
  bundle: true, format: 'esm', platform: 'node', outfile: saleFile, logLevel: 'error',
  loader: { '.svg': 'dataurl', '.png': 'dataurl' },
});
const sale = await import(pathToFileURL(saleFile).href);
fs.rmSync(outdir, { recursive: true, force: true });

const { addToCart, setCount, commitQuantity, commitDetails, removeLine, lineGross, totals, productFor } = cart;
const { PRODUCTS, maxCount, formatPrice } = await import(pathToFileURL(path.join(root, 'src/data/catalogue.ts')).href);

let fails = 0;
const check = (name, pass, detail = '') => {
  if (!pass) fails++;
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `  ${detail}` : ''}`);
};
const byId = (id) => PRODUCTS.find((p) => p.id === id);
const lineOf = (lines, id) => lines.find((l) => l.productId === id);
const discountOf = (line) => (line.discount?.kind === 'amount' ? line.discount.minor : null);

// --- Adding from the grid -----------------------------------------------------
// Nothing is seeded out of stock (the designer's call), so the rule is proved on a stand-in.
const outOfStock = { ...byId('ftw-sneakers'), stock: 0 };
const none = [];
check('an out-of-stock product adds no line, and says so by returning the same lines',
  outOfStock.stock === 0 && addToCart(none, outOfStock) === none);

const lowStock = byId('acc-beanie');
let lines = [];
for (let i = 0; i < lowStock.stock; i++) lines = addToCart(lines, lowStock);
const atMax = lines;
check('adding up to the shelf works', lineOf(lines, 'acc-beanie')?.count === lowStock.stock, `${lowStock.stock} of ${lowStock.stock}`);
check('one more past the shelf returns the same lines', addToCart(atMax, lowStock) === atMax);

const socks = byId('acc-socks');
const packs = [{ productId: 'acc-socks', unitId: 'pack', count: maxCount(socks, 'pack') }];
check('the ceiling is counted in the line\'s own unit', addToCart(packs, socks) === packs,
  `${maxCount(socks, 'pack')} packs of 4 from ${socks.stock}`);
const fresh = addToCart([], socks);
check('a new line starts at 1 single unit', fresh.length === 1 && fresh[0].unitId === 'each' && fresh[0].count === 1);

// --- Stepping the count -------------------------------------------------------
check('stepping to 0 removes the line', setCount(fresh, 'acc-socks', 0).length === 0);
check('a count above the shelf is capped', lineOf(setCount(fresh, 'acc-socks', 9_999), 'acc-socks').count === socks.stock,
  `capped at ${socks.stock}`);

// The persisted clamp: N1,000 off a N950 line clamps to N950, and stays N950 when the
// count comes back up. Clamping only at display would quietly restore the N1,000.
let clamp = [{ productId: 'acc-socks', unitId: 'each', count: 3, discount: { kind: 'amount', minor: 100_000 } }];
const seen = [discountOf(clamp[0])];
clamp = setCount(clamp, 'acc-socks', 1); seen.push(discountOf(clamp[0]));
clamp = setCount(clamp, 'acc-socks', 3); seen.push(discountOf(clamp[0]));
check('qty 3 -> 1 -> 3 never brings back a clamped discount', seen.join(',') === '100000,95000,95000',
  seen.map((x) => formatPrice(x)).join(' -> '));

// --- Quantity sheet commit ----------------------------------------------------
const negotiated = [{
  productId: 'acc-socks', unitId: 'each', count: 2, priceOverrideMinor: 45_000,
  discount: { kind: 'percent', percent: 10 },
}];
const toPack = lineOf(commitQuantity(negotiated, 'acc-socks', 'pack', 1), 'acc-socks');
check('a committed unit change drops the price override', toPack.unitId === 'pack' && toPack.priceOverrideMinor === undefined,
  `line now ${formatPrice(lineGross(toPack))} for 1 pack`);
check('a committed unit change keeps a percent discount', toPack.discount?.percent === 10);
const roundTrip = lineOf(commitQuantity(negotiated, 'acc-socks', 'each', 3), 'acc-socks');
check('Each -> Pack -> Each inside one sheet keeps the override', roundTrip.priceOverrideMinor === 45_000 && roundTrip.count === 3);
const amountToPack = lineOf(commitQuantity(clamp, 'acc-socks', 'pack', 2), 'acc-socks');
check('a unit change re-clamps an amount discount, never raises it', discountOf(amountToPack) === 95_000);
const big = lineOf(commitQuantity([{ productId: 'acc-socks', unitId: 'each', count: 1, discount: { kind: 'amount', minor: 400_000 } }],
  'acc-socks', 'pack', 1), 'acc-socks');
check('a unit change that shrinks the line clamps an amount discount to it', discountOf(big) === lineGross(big),
  `${formatPrice(discountOf(big))} on a ${formatPrice(lineGross(big))} line`);
check('a sheet commit cannot set a count below 1', lineOf(commitQuantity(fresh, 'acc-socks', 'each', 0), 'acc-socks').count === 1);
check('a sheet commit cannot exceed the shelf in the new unit',
  lineOf(commitQuantity(fresh, 'acc-socks', 'box', 99), 'acc-socks').count === maxCount(socks, 'box'),
  `${maxCount(socks, 'box')} boxes of 16 from ${socks.stock}`);

// --- Line-details commit ------------------------------------------------------
const edited = lineOf(commitDetails(negotiated, 'acc-socks', { count: 0, note: 'Snagged thread' }), 'acc-socks');
check('details commit keeps the unit and clamps the count to at least 1', edited.unitId === 'each' && edited.count === 1);
check('details commit replaces the line: a cleared override or discount is gone',
  edited.priceOverrideMinor === undefined && edited.discount === undefined && edited.note === 'Snagged thread');
const overDetails = lineOf(commitDetails(fresh, 'acc-socks', { count: 1, discount: { kind: 'amount', minor: 900_000 } }), 'acc-socks');
check('details commit clamps an amount discount to the line', discountOf(overDetails) === lineGross(overDetails));

// --- One source of truth ------------------------------------------------------
const mixed = [...atMax, ...negotiated, { productId: 'tops-tee', unitId: 'each', count: 2 }];
const t = totals(mixed);
check('cart lines sum to the order subtotal', mixed.reduce((a, l) => a + lineGross(l), 0) === t.subtotal, formatPrice(t.subtotal));
check('the order total reconciles', t.total === t.subtotal - t.discount + t.tax,
  `${formatPrice(t.subtotal)} - ${formatPrice(t.discount)} + ${formatPrice(t.tax)} = ${formatPrice(t.total)}`);
check('removing a line leaves the others untouched', removeLine(mixed, 'acc-socks').length === 2
  && removeLine(mixed, 'acc-socks')[0] === mixed[0]);
let unknown = false;
try { productFor({ productId: 'no-such-thing' }); } catch { unknown = true; }
check('a line for an unknown product throws instead of rendering a blank', unknown);

// --- The receipt ----------------------------------------------------------------
const { buildReceipt, receiptNumber, formatReceiptDate } = sale;
const naira = (s) => Number(String(s).replace(/[^\d]/g, ''));
const at = new Date(2026, 9, 8, 9, 5, 7);
const sold = [
  { productId: 'acc-socks', unitId: 'pack', count: 2, note: 'Gift wrap' },
  { productId: 'tops-tee', unitId: 'each', count: 1, discount: { kind: 'percent', percent: 10 } },
];
const cashSale = buildReceipt({ lines: sold, orderDiscount: { kind: 'amount', minor: 50_000 }, customer: null,
  tender: { method: 'cash', tenderedMinor: 2_000_000 }, at, sequence: 7 });
check('the receipt reconciles: Sales Value - Discount + VAT = Total',
  naira(cashSale.salesValue) - naira(cashSale.discount) + naira(cashSale.vat) === naira(cashSale.total),
  `${cashSale.salesValue} - ${cashSale.discount} + ${cashSale.vat} = ${cashSale.total}`);
check('...and Balance is Tendered less Total', naira(cashSale.tendered) - naira(cashSale.total) === naira(cashSale.balance),
  `${cashSale.tendered} - ${cashSale.total} = ${cashSale.balance}`);
check('...and its Total is the Checkout total', cashSale.totalMinor === totals(sold, { kind: 'amount', minor: 50_000 }).total);
check('a pack line names its unit, a note and a line discount carry over',
  cashSale.lines[0].title === '2 pck Crew Socks' && cashSale.lines[0].note === 'Gift wrap' && !cashSale.lines[0].discount
  && cashSale.lines[1].discount === formatPrice(85_000), JSON.stringify(cashSale.lines.map((l) => l.title)));
check('no customer is a Walk-in Customer; an attached one is named',
  cashSale.customer === 'Walk-in Customer'
  && buildReceipt({ lines: sold, customer: { id: 'x', name: 'Ngozi Eze' }, tender: { method: 'bank', bankId: 'access', tenderedMinor: totals(sold).total }, at, sequence: 1 }).customer === 'Ngozi Eze');
check('the frame\'s date form and a receipt number for the day',
  formatReceiptDate(at) === '08-10-2026 (09:05:07)' && receiptNumber(at, 7) === '#S202610080007', `${formatReceiptDate(at)} ${receiptNumber(at, 7)}`);
let shortSale = false;
try { buildReceipt({ lines: sold, customer: null, tender: { method: 'cash', tenderedMinor: 100 }, at, sequence: 1 }); } catch { shortSale = true; }
check('a short tender never produces a receipt', shortSale);

// --- Queued orders (band 170:8988) ------------------------------------------------
const queueFile = path.join(outdir, 'queue.mjs');
await build({
  entryPoints: [path.join(root, 'src/state/queue.ts')],
  bundle: true, format: 'esm', platform: 'node', outfile: queueFile, logLevel: 'error',
});
const { seedQueue, queuedItemNames, queuedTotal, formatQueuedAt } = await import(pathToFileURL(queueFile).href);
const seeded = seedQueue(new Date(2026, 9, 8, 14, 0));
check('the demo queue: distinct ids, newest first',
  new Set(seeded.map((q) => q.id)).size === seeded.length
  && seeded.every((q, i) => i === 0 || seeded[i - 1].queuedAt > q.queuedAt));
check('every queued order resolves its products and totals as its Cart would',
  seeded.every((q) => queuedItemNames(q).length === q.lines.length && queuedTotal(q) === totals(q.lines, q.orderDiscount).total && queuedTotal(q) > 0),
  seeded.map((q) => queuedTotal(q)).join(', '));
check('...covering a walk-in, a named customer and an order discount',
  seeded.some((q) => !q.customer) && seeded.some((q) => q.customer) && seeded.some((q) => q.orderDiscount));
check('every queued line is within its shelf',
  seeded.every((q) => q.lines.every((l) => l.count >= 1 && l.count <= maxCount(byId(l.productId), l.unitId))));
check('the frame\'s time form, "13:24, 06-03-2026"', formatQueuedAt(new Date(2026, 2, 6, 13, 24)) === '13:24, 06-03-2026');

// --- Scanning (band 214:26054) ----------------------------------------------------
const scanFile = path.join(outdir, 'scan.mjs');
await build({
  entryPoints: [path.join(root, 'src/state/scan.ts')],
  bundle: true, format: 'esm', platform: 'node', outfile: scanFile, logLevel: 'error',
});
const scan = await import(pathToFileURL(scanFile).href);
fs.rmSync(outdir, { recursive: true, force: true });
/* The encoder is checked against properties of the symbology, not against its own
   tables: every digit is 7 modules in exactly 2 bars and 2 spaces; left-hand L digits
   carry an odd number of dark modules and G and R digits an even number; the left
   half's odd/even pattern names the first digit. Decoded back by those rules alone. */
const FIRST = { OOOOOO: 0, OOEOEE: 1, OOEEOE: 2, OOEEEO: 3, OEOOEE: 4, OEEOOE: 5, OEEEOO: 6, OEOEOE: 7, OEOEEO: 8, OEEOEO: 9 };
const decodeEan = (m) => {
  if (m.length !== 95 || !m.startsWith('101') || !m.endsWith('101') || m.slice(45, 50) !== '01010') return null;
  const runs = (s) => s.match(/0+|1+/g).length;
  const chunk = (from) => Array.from({ length: 6 }, (_, i) => m.slice(from + i * 7, from + i * 7 + 7));
  const left = chunk(3), right = chunk(50);
  if (![...left, ...right].every((c) => runs(c) === 4 && c.length === 7)) return null;
  // Width pattern -> digit: the standard's bar/space widths, read off each 7-module symbol.
  const WIDTHS = ['3211', '2221', '2122', '1411', '1132', '1231', '1114', '1312', '1213', '3112'];
  const widths = (c) => c.match(/0+|1+/g).map((r) => r.length).join('');
  const digit = (c, mirror) => { const w = widths(c); return WIDTHS.indexOf(mirror ? [...w].reverse().join('') : w); };
  const parity = left.map((c) => ([...c].filter((b) => b === '1').length % 2 ? 'O' : 'E')).join('');
  const first = FIRST[parity];
  const ld = left.map((c, i) => digit(c, parity[i] === 'E'));
  const rd = right.map((c) => digit(c, false));
  if (first === undefined || [...ld, ...rd].some((d) => d < 0)) return null;
  return `${first}${ld.join('')}${rd.join('')}`;
};
check('every product\'s barcode encodes as a 95-module EAN-13 that decodes back to itself',
  PRODUCTS.every((p) => decodeEan(scan.ean13Modules(p.barcode)) === p.barcode),
  PRODUCTS.map((p) => decodeEan(scan.ean13Modules(p.barcode)) === p.barcode ? '' : p.barcode).filter(Boolean).join(' '));
check('the unknown barcode is a valid code that no product carries',
  decodeEan(scan.ean13Modules(scan.UNKNOWN_BARCODE.code)) === scan.UNKNOWN_BARCODE.code
  && !PRODUCTS.some((p) => p.barcode === scan.UNKNOWN_BARCODE.code));
const north = scan.matchText(scan.tagOf(byId('tops-oxford')).lines);
check('a Northline tag matches the three Northline products, Oxford Shirt the best (88:19899)',
  north.detected === 'Northline' && north.matches.length === 3
  && north.matches.every((m) => m.product.brand === 'Northline')
  && north.matches[0].product.id === 'tops-oxford' && north.matches[0].best && north.matches.filter((m) => m.best).length === 1,
  north.matches.map((m) => `${m.product.name}${m.best ? '*' : ''}`).join(', '));
check('every tag in the scan sequence ranks its own product first',
  scan.SCAN_SEQUENCE.filter((t) => t.kind === 'text').every((t) => scan.matchText(t.lines).matches[0]?.product.id === t.productId));
check('every barcode in the scan sequence is its product\'s own',
  scan.SCAN_SEQUENCE.filter((t) => t.kind === 'barcode').every((t) => byId(t.productId).barcode === t.code));
check('the scan sequence reaches every product', new Set(scan.SCAN_SEQUENCE.map((t) => t.productId)).size === PRODUCTS.length);
check('a tag from a brand the store does not sell matches nothing', scan.matchText(scan.UNKNOWN_TAG.lines).matches.length === 0);

console.log(`\n${fails} failing`);
process.exit(fails ? 1 : 0);
