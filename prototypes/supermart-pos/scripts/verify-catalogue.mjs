/**
 * Proves the catalogue's invariants. Run after any edit to catalogue.ts.
 *
 * These are not stylistic checks: an invalid check digit, a total that stops
 * reconciling, or a missing demo state all show up live in a demo. CLAUDE.md
 * section 7 — produce a number and compare it to a target.
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  PRODUCTS, CATEGORIES, CATEGORY_ORDER, BRANDS, CURRENCY, LOW_STOCK_AT,
  formatPrice, formatSignedPrice, fullName, lineTotalMinor, findByBarcode,
  maxCount, unitFor, lineGrossMinor, lineDiscountMinor, lineTaxMinor, orderTotals,
  parseCount, parseWholeNaira, parsePercent, VAT_STANDARD_RATE,
} from '../src/data/catalogue.ts';

let fails = 0;
const check = (name, pass, detail = '') => {
  if (!pass) fails++;
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `  ${detail}` : ''}`);
};

const ean13Valid = (code) => {
  if (!/^\d{13}$/.test(code)) return false;
  const sum = [...code.slice(0, 12)].reduce((a, d, i) => a + Number(d) * (i % 2 === 0 ? 1 : 3), 0);
  return Number(code[12]) === (10 - (sum % 10)) % 10;
};

// --- Barcodes ---
const badCodes = PRODUCTS.filter((p) => !ean13Valid(p.barcode));
check('every barcode is a valid EAN-13', badCodes.length === 0,
  badCodes.length ? badCodes.map((p) => `${p.id}:${p.barcode}`).join(', ') : `${PRODUCTS.length}/${PRODUCTS.length} valid`);
check('barcodes are unique', new Set(PRODUCTS.map((p) => p.barcode)).size === PRODUCTS.length);
check('ids are unique', new Set(PRODUCTS.map((p) => p.id)).size === PRODUCTS.length);

// Everything is packaged, so everything carries a manufacturer prefix. No item
// should be sitting on the in-store 2x range that only loose goods would use.
check('every barcode uses the GS1 Nigeria 615 prefix',
  PRODUCTS.every((p) => p.barcode.startsWith('615')), `${PRODUCTS.length} packaged items`);
check('no item uses the in-store 2x range',
  !PRODUCTS.some((p) => p.barcode.startsWith('2')));

// --- Packaged-goods shape ---
check('every product has a brand, name and pack size',
  PRODUCTS.every((p) => p.brand && p.name && p.size), `${BRANDS.length} brands: ${BRANDS.join(', ')}`);
check('no pack size is duplicated into the name',
  !PRODUCTS.some((p) => p.name.includes(p.size)),
  'size lives in its own field so a card can render it separately');

// --- Money is integer minor units, never float ---
check('all prices are integers', PRODUCTS.every((p) => Number.isInteger(p.priceMinor)));
check('all prices are whole Naira (multiple of minorPerUnit)',
  PRODUCTS.every((p) => p.priceMinor % CURRENCY.minorPerUnit === 0));
const discounted = PRODUCTS.filter((p) => p.wasPriceMinor !== undefined);
check('every discount is an actual reduction',
  discounted.every((p) => p.wasPriceMinor > p.priceMinor), `${discounted.length} discounted`);

// A fractional quantity is meaningless with nothing weighed, and must be refused
// rather than silently rounded into a total that cannot be reconciled.
let threw = false;
try { lineTotalMinor(PRODUCTS[0], 1.5); } catch { threw = true; }
check('a fractional quantity is rejected', threw);

// --- A basket's lines must sum to its own total (CLAUDE.md section 4) ---
// Computed by the APP's own `orderTotals`, not re-derived here. A verifier with its
// own arithmetic only proves the verifier agrees with itself.
const byId = (id) => PRODUCTS.find((p) => p.id === id);
const basket = [
  { product: byId('bev-cola'), unitId: 'each', count: 6 },
  { product: byId('noo-multipack'), unitId: 'each', count: 1 },
  { product: byId('cok-oil'), unitId: 'each', count: 1 },
  { product: byId('hse-tissue'), unitId: 'each', count: 2 },
  { product: byId('brk-milkpowder'), unitId: 'each', count: 1 },
];
const t = orderTotals(basket);
const grosses = basket.map(lineGrossMinor);
check('every line total is an exact integer', grosses.every(Number.isInteger), grosses.join(', '));
check('lines sum to the subtotal', grosses.reduce((a, b) => a + b, 0) === t.subtotal, formatPrice(t.subtotal));
const taxed = basket.filter((l) => lineTaxMinor(l) > 0).length;
const standardLines = basket.filter((l) => l.product.taxClass === 'standard').length;
check('VAT applies only to standard-rated lines', taxed === standardLines,
  `${standardLines} of ${basket.length} lines standard-rated, VAT ${formatPrice(t.tax)}`);
check('total reconciles: subtotal - discount + tax', t.total === t.subtotal - t.discount + t.tax,
  `${formatPrice(t.subtotal)} - ${formatPrice(t.discount)} + ${formatPrice(t.tax)} = ${formatPrice(t.total)}`);

// --- Pack units ---------------------------------------------------------------
const M = CURRENCY.minorPerUnit;
check('every product is sold by the single unit first',
  PRODUCTS.every((p) => p.units[0]?.id === 'each' && p.units[0].each === 1));
check('pack sizes are whole numbers and strictly increasing',
  PRODUCTS.every((p) => p.units.every((u, i) => Number.isInteger(u.each) && (i === 0 || u.each > p.units[i - 1].each))));
check('no product lists a unit twice',
  PRODUCTS.every((p) => new Set(p.units.map((u) => u.id)).size === p.units.length));
const multiUnit = PRODUCTS.filter((p) => p.units.length > 1);
const singleUnit = PRODUCTS.filter((p) => p.units.length === 1);
check('a multi-unit product exists (Measurement list)', multiUnit.length > 0, `${multiUnit.length} products`);
check('a single-unit product exists (no Measurement list)', singleUnit.length > 0, singleUnit.map((p) => p.id).join(', '));
const cola = byId('bev-cola');
check('Zivra Cola carries the Quantity frame\'s own 1/4/8/16',
  cola.units.map((u) => u.each).join('/') === '1/4/8/16', cola.units.map((u) => u.each).join('/'));
check('a unit the shelf cannot supply even once is reachable',
  PRODUCTS.some((p) => p.stock > 0 && p.units.some((u) => maxCount(p, u.id) === 0)),
  PRODUCTS.filter((p) => p.stock > 0 && p.units.some((u) => maxCount(p, u.id) === 0)).map((p) => p.id).join(', '));

let unitCases = 0, unitBad = 0;
for (const p of PRODUCTS) for (const u of p.units) for (let c = 1; c <= maxCount(p, u.id); c++) {
  unitCases++;
  const g = lineGrossMinor({ product: p, unitId: u.id, count: c });
  if (!Number.isInteger(g) || g % M !== 0 || c * u.each > p.stock) unitBad++;
}
check('every product x unit x sellable count is whole Naira and within stock', unitBad === 0, `${unitCases} cases`);
let unknownUnit = false;
try { unitFor(byId('bby-wipes'), 'carton'); } catch { unknownUnit = true; }
check('asking for a unit a product is not sold in is refused', unknownUnit);

// --- Discounts ----------------------------------------------------------------
// The exact integer reference, half-up to whole Naira. The float version
// Math.round(gross * p / 100) gets 69% of N350 wrong (241.4999... -> N241).
const refPercent = (grossMinor, pct) => Math.floor(((grossMinor / M) * pct + 50) / 100) * M;
let pctCases = 0, pctBad = 0, pctFloatWrong = 0;
for (const p of PRODUCTS) for (const u of p.units) for (const c of [1, 2, 3, 7]) {
  if (c > maxCount(p, u.id) && p.stock > 0) continue;
  for (let pct = 0; pct <= 100; pct++) {
    pctCases++;
    const line = { product: p, unitId: u.id, count: c, discount: { kind: 'percent', percent: pct } };
    const gross = lineGrossMinor(line);
    const got = lineDiscountMinor(line);
    if (got !== refPercent(gross, pct) || got % M !== 0 || got > gross) pctBad++;
    if (Math.round(gross * (pct / 100) / M) * M !== refPercent(gross, pct)) pctFloatWrong++;
  }
}
check('every percent discount matches the exact integer reference', pctBad === 0,
  `${pctCases} cases; a float implementation would have got ${pctFloatWrong} wrong`);
const n350 = { product: byId('noo-single'), unitId: 'each', count: 1, discount: { kind: 'percent', percent: 69 } };
check('69% of N350 is N242, the case floats get wrong', lineDiscountMinor(n350) === 242 * M, formatPrice(lineDiscountMinor(n350)));
const over = { product: cola, unitId: 'each', count: 1, discount: { kind: 'amount', minor: 100_000 } };
check('an amount discount larger than the line clamps to the line', lineDiscountMinor(over) === lineGrossMinor(over)
  && lineGrossMinor(over) - lineDiscountMinor(over) === 0, formatPrice(lineDiscountMinor(over)));
let badOverride = false;
try { lineGrossMinor({ product: cola, unitId: 'each', count: 1, priceOverrideMinor: 10_050 }); } catch { badOverride = true; }
check('a price override that is not whole Naira is refused', badOverride);

// --- Tax ----------------------------------------------------------------------
// The walk's case: standard-rated, odd-Naira net. Cola N500 less 15% = N425 net,
// 7.5% = 3187.5 kobo -> 3188 kobo on the line -> N32 on the order.
const colaLine = { product: cola, unitId: 'each', count: 1, discount: { kind: 'percent', percent: 15 } };
const colaT = orderTotals([colaLine]);
check('Cola N500 less 15%: discount N75, tax on the NET 3188 kobo, order tax N32, total N457',
  lineDiscountMinor(colaLine) === 7_500 && lineTaxMinor(colaLine) === 3_188 && colaT.tax === 3_200 && colaT.total === 45_700,
  `${formatPrice(colaT.subtotal)} - ${formatPrice(colaT.discount)} + ${formatPrice(colaT.tax)} = ${formatPrice(colaT.total)}`);
let vatDisagree = 0;
for (let net = 0; net <= 5_000_000; net += M) {
  if (Math.floor((net * 750 + 5_000) / 10_000) !== Math.round(net * VAT_STANDARD_RATE)) vatDisagree++;
}
check('integer VAT agrees with the old float rule on every whole-Naira net to N50,000', vatDisagree === 0);

// --- Displayed totals reconcile, across random baskets -------------------------
// Seeded so a failure is reproducible. Overrides are odd whole-Naira prices and
// discounts land on odd-Naira nets, so a rounding rule that only works on round
// numbers has somewhere to fail.
let seed = 0x5eed;
const rand = (n) => { seed = (seed * 1_103_515_245 + 12_345) % 2 ** 31; return seed % n; };
const naira = (s) => Number(s.replace(/[^\d]/g, '')) * (s.startsWith('−') ? -1 : 1);
let baskets = 0, basketBad = 0, firstBad = '';
const sellable = PRODUCTS.filter((p) => p.stock > 0);
for (let b = 0; b < 500; b++) {
  const lines = [];
  for (const p of [...sellable].sort(() => rand(3) - 1).slice(0, 1 + rand(6))) {
    const units = p.units.filter((u) => maxCount(p, u.id) > 0);
    const u = units[rand(units.length)];
    const line = { product: p, unitId: u.id, count: 1 + rand(maxCount(p, u.id)) };
    if (rand(3) === 0) line.priceOverrideMinor = (1 + rand(9_999)) * M;
    const d = rand(4);
    if (d === 1) line.discount = { kind: 'percent', percent: 1 + rand(100) };
    if (d === 2) line.discount = { kind: 'amount', minor: (1 + rand(5_000)) * M };
    lines.push(line);
  }
  baskets++;
  const tt = orderTotals(lines);
  const shown = {
    lines: lines.map((l) => naira(formatPrice(lineGrossMinor(l)))),
    subtotal: naira(formatPrice(tt.subtotal)),
    discount: naira(formatSignedPrice(-tt.discount)),
    tax: naira(formatPrice(tt.tax)),
    total: naira(formatPrice(tt.total)),
  };
  const ok = shown.lines.reduce((a, x) => a + x, 0) === shown.subtotal
    && shown.subtotal + shown.discount + shown.tax === shown.total
    && tt.total % M === 0 && tt.tax % M === 0
    && lines.every((l) => lineGrossMinor(l) - lineDiscountMinor(l) >= 0);
  if (!ok) { basketBad++; firstBad ||= JSON.stringify(shown); }
}
check('what the screen shows adds up, in 500 random baskets', basketBad === 0,
  basketBad ? `${basketBad} bad, first: ${firstBad}` : `${baskets} baskets, payable totals all whole Naira`);

// --- Parsing and formatting ---------------------------------------------------
const rejects = (fn, inputs) => inputs.every((x) => fn(x) === null);
check('typed counts: digits only, at least 1', rejects(parseCount, ['', '0', '-1', '2.5', '1e2', ' 3', '3 ', '+3', '0x10'])
  && parseCount('12') === 12);
check('typed Naira: digits only, stored as whole Naira', rejects(parseWholeNaira, ['', '-1', '2.5', '1e2', '1.15', '100.50'])
  && parseWholeNaira('1') === 100 && parseWholeNaira('0') === 0);
check('typed percent: 0 to 100 only', rejects(parsePercent, ['', '-1', '101', '2.5', '1e2', '15%'])
  && parsePercent('100') === 100 && parsePercent('0') === 0);
const signed = [formatSignedPrice(-5_300), formatSignedPrice(0), formatSignedPrice(-0), formatSignedPrice(5_300)];
check('signed prices never print "N-" or a negative zero', signed.every((x) => !x.includes('-')) && signed[0] === '−' + formatPrice(5_300),
  signed.join('  '));

// --- Demo state coverage (CLAUDE.md sections 4 and 6) ---
const noPhoto = PRODUCTS.filter((p) => p.image === null);
const oos = PRODUCTS.filter((p) => p.stock === 0);
check('a product with no image exists (fallback state)', noPhoto.length > 0,
  noPhoto.map((p) => p.id).join(', '));
check('an out-of-stock product exists', oos.length > 0, oos.map((p) => p.id).join(', '));
check('a discounted product exists', discounted.length > 0, discounted.map((p) => p.id).join(', '));
// The Sales Point card renders three stock states. All three must be reachable from
// the seed data, or one of them can never be demoed.
const low = PRODUCTS.filter((p) => p.stock > 0 && p.stock <= LOW_STOCK_AT);
check(`a low-stock product exists (0 < stock <= ${LOW_STOCK_AT})`, low.length > 0,
  low.map((p) => `${p.id}:${p.stock}`).join(', '));
check('a normal-stock product exists', PRODUCTS.some((p) => p.stock > LOW_STOCK_AT));

const longest = PRODUCTS.reduce((a, b) => (b.name.length > a.name.length ? b : a));
check('a long name exists to force truncation', longest.name.length >= 45,
  `${longest.name.length} chars: "${longest.name}"`);

const single = CATEGORIES.filter((c) => c.count === 1);
const big = CATEGORIES.filter((c) => c.count >= 12);
check('a single-item category exists', single.length > 0, single.map((c) => c.name).join(', '));
check('a category with 12+ items exists (grid wrap)', big.length > 0,
  big.map((c) => `${c.name}:${c.count}`).join(', '));
check('every category has at least one product', CATEGORIES.every((c) => c.count > 0),
  CATEGORIES.map((c) => `${c.name}:${c.count}`).join(' '));
check('category counts sum to the product count',
  CATEGORIES.reduce((a, c) => a + c.count, 0) === PRODUCTS.length);
check('every product sits in a known category',
  PRODUCTS.every((p) => CATEGORY_ORDER.includes(p.category)));

const digits = PRODUCTS.map((p) => formatPrice(p.priceMinor).replace(/\D/g, '').length);
check('price widths span at least 3 digit-counts', new Set(digits).size >= 3,
  `${Math.min(...digits)} to ${Math.max(...digits)} digits — ${formatPrice(Math.min(...PRODUCTS.map((p) => p.priceMinor)))} to ${formatPrice(Math.max(...PRODUCTS.map((p) => p.priceMinor)))}`);

// Two sizes of the same product must stay distinguishable on a receipt line.
const sameName = PRODUCTS.filter((p) => p.name === 'Still Water');
check('same product in two pack sizes stays distinct',
  sameName.length === 2 && new Set(sameName.map(fullName)).size === 2,
  sameName.map(fullName).join(' | '));
check('barcode lookup resolves', findByBarcode(PRODUCTS[0].barcode)?.id === PRODUCTS[0].id);

// --- The generated Figma sheet must still agree with this file ---
const csvPath = path.join(import.meta.dirname, '..', 'figma', 'catalogue.csv');
if (!fs.existsSync(csvPath)) {
  check('figma/catalogue.csv exists', false, 'run `npm run catalogue:csv`');
} else {
  const parseRow = (line) => {
    const out = [];
    let field = '', inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (inQuotes) {
        if (c === '"' && line[i + 1] === '"') { field += '"'; i++; }
        else if (c === '"') inQuotes = false;
        else field += c;
      } else if (c === '"') inQuotes = true;
      else if (c === ',') { out.push(field); field = ''; }
      else field += c;
    }
    out.push(field);
    return out;
  };
  const csv = fs.readFileSync(csvPath, 'utf8').trim().split('\n');
  const header = parseRow(csv[0]);
  const rows = csv.slice(1).map(parseRow);
  const col = (n) => header.indexOf(n);
  check('CSV row count matches the catalogue', rows.length === PRODUCTS.length,
    `${rows.length} rows vs ${PRODUCTS.length} products`);
  check('CSV columns are intact on every row', rows.every((r) => r.length === header.length),
    `${header.length} columns`);
  for (const [column, get] of [
    ['id', (p) => p.id], ['brand', (p) => p.brand], ['name', (p) => p.name],
    ['size', (p) => p.size], ['barcode', (p) => p.barcode],
    ['price', (p) => formatPrice(p.priceMinor)],
  ]) {
    check(`CSV ${column} matches the catalogue in order`,
      rows.map((r) => r[col(column)]).join('|') === PRODUCTS.map(get).join('|'));
  }
}

console.log(`\n${fails} failing`);
process.exit(fails === 0 ? 0 : 1);
