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
const juice = byId('bev-applejuice');
const none = [];
check('an out-of-stock product adds no line, and says so by returning the same lines',
  juice.stock === 0 && addToCart(none, juice) === none);

const malt = byId('bev-malt');
let lines = [];
for (let i = 0; i < malt.stock; i++) lines = addToCart(lines, malt);
const atMax = lines;
check('adding up to the shelf works', lineOf(lines, 'bev-malt')?.count === malt.stock, `${malt.stock} of ${malt.stock}`);
check('one more past the shelf returns the same lines', addToCart(atMax, malt) === atMax);

const cola = byId('bev-cola');
const packs = [{ productId: 'bev-cola', unitId: 'pack', count: maxCount(cola, 'pack') }];
check('the ceiling is counted in the line\'s own unit', addToCart(packs, cola) === packs,
  `${maxCount(cola, 'pack')} packs of 4 from ${cola.stock}`);
const fresh = addToCart([], cola);
check('a new line starts at 1 single unit', fresh.length === 1 && fresh[0].unitId === 'each' && fresh[0].count === 1);

// --- Stepping the count -------------------------------------------------------
check('stepping to 0 removes the line', setCount(fresh, 'bev-cola', 0).length === 0);
check('a count above the shelf is capped', lineOf(setCount(fresh, 'bev-cola', 9_999), 'bev-cola').count === cola.stock,
  `capped at ${cola.stock}`);

// The persisted clamp: N1,000 off a N500 line clamps to N500, and stays N500 when the
// count comes back up. Clamping only at display would quietly restore the N1,000.
let clamp = [{ productId: 'bev-cola', unitId: 'each', count: 3, discount: { kind: 'amount', minor: 100_000 } }];
const seen = [discountOf(clamp[0])];
clamp = setCount(clamp, 'bev-cola', 1); seen.push(discountOf(clamp[0]));
clamp = setCount(clamp, 'bev-cola', 3); seen.push(discountOf(clamp[0]));
check('qty 3 -> 1 -> 3 never brings back a clamped discount', seen.join(',') === '100000,50000,50000',
  seen.map((x) => formatPrice(x)).join(' -> '));

// --- Quantity sheet commit ----------------------------------------------------
const negotiated = [{
  productId: 'bev-cola', unitId: 'each', count: 2, priceOverrideMinor: 45_000,
  discount: { kind: 'percent', percent: 10 },
}];
const toPack = lineOf(commitQuantity(negotiated, 'bev-cola', 'pack', 1), 'bev-cola');
check('a committed unit change drops the price override', toPack.unitId === 'pack' && toPack.priceOverrideMinor === undefined,
  `line now ${formatPrice(lineGross(toPack))} for 1 pack`);
check('a committed unit change keeps a percent discount', toPack.discount?.percent === 10);
const roundTrip = lineOf(commitQuantity(negotiated, 'bev-cola', 'each', 3), 'bev-cola');
check('Each -> Pack -> Each inside one sheet keeps the override', roundTrip.priceOverrideMinor === 45_000 && roundTrip.count === 3);
const amountToPack = lineOf(commitQuantity(clamp, 'bev-cola', 'pack', 2), 'bev-cola');
check('a unit change re-clamps an amount discount, never raises it', discountOf(amountToPack) === 50_000);
const big = lineOf(commitQuantity([{ productId: 'bev-cola', unitId: 'each', count: 1, discount: { kind: 'amount', minor: 400_000 } }],
  'bev-cola', 'pack', 1), 'bev-cola');
check('a unit change that shrinks the line clamps an amount discount to it', discountOf(big) === lineGross(big),
  `${formatPrice(discountOf(big))} on a ${formatPrice(lineGross(big))} line`);
check('a sheet commit cannot set a count below 1', lineOf(commitQuantity(fresh, 'bev-cola', 'each', 0), 'bev-cola').count === 1);
check('a sheet commit cannot exceed the shelf in the new unit',
  lineOf(commitQuantity(fresh, 'bev-cola', 'box', 99), 'bev-cola').count === maxCount(cola, 'box'),
  `${maxCount(cola, 'box')} boxes of 16 from ${cola.stock}`);

// --- Line-details commit ------------------------------------------------------
const edited = lineOf(commitDetails(negotiated, 'bev-cola', { count: 0, note: 'Dented can' }), 'bev-cola');
check('details commit keeps the unit and clamps the count to at least 1', edited.unitId === 'each' && edited.count === 1);
check('details commit replaces the line: a cleared override or discount is gone',
  edited.priceOverrideMinor === undefined && edited.discount === undefined && edited.note === 'Dented can');
const overDetails = lineOf(commitDetails(fresh, 'bev-cola', { count: 1, discount: { kind: 'amount', minor: 900_000 } }), 'bev-cola');
check('details commit clamps an amount discount to the line', discountOf(overDetails) === lineGross(overDetails));

// --- One source of truth ------------------------------------------------------
const mixed = [...atMax, ...negotiated, { productId: 'noo-single', unitId: 'each', count: 2 }];
const t = totals(mixed);
check('cart lines sum to the order subtotal', mixed.reduce((a, l) => a + lineGross(l), 0) === t.subtotal, formatPrice(t.subtotal));
check('the order total reconciles', t.total === t.subtotal - t.discount + t.tax,
  `${formatPrice(t.subtotal)} - ${formatPrice(t.discount)} + ${formatPrice(t.tax)} = ${formatPrice(t.total)}`);
check('removing a line leaves the others untouched', removeLine(mixed, 'bev-cola').length === 2
  && removeLine(mixed, 'bev-cola')[0] === mixed[0]);
let unknown = false;
try { productFor({ productId: 'no-such-thing' }); } catch { unknown = true; }
check('a line for an unknown product throws instead of rendering a blank', unknown);

console.log(`\n${fails} failing`);
process.exit(fails ? 1 : 0);
