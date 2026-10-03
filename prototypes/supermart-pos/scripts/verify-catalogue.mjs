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
  PRODUCTS, CATEGORIES, CATEGORY_ORDER, BRANDS, CURRENCY,
  formatPrice, fullName, lineTotalMinor, findByBarcode, vatRateFor,
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
const basket = [
  [PRODUCTS.find((p) => p.id === 'bev-cola'), 6],
  [PRODUCTS.find((p) => p.id === 'noo-multipack'), 1],
  [PRODUCTS.find((p) => p.id === 'cok-oil'), 1],
  [PRODUCTS.find((p) => p.id === 'hse-tissue'), 2],
  [PRODUCTS.find((p) => p.id === 'brk-milkpowder'), 1],
];
const lines = basket.map(([p, q]) => lineTotalMinor(p, q));
const subtotal = lines.reduce((a, b) => a + b, 0);
const vatPerLine = basket.map(([p], i) => Math.round(lines[i] * vatRateFor(p)));
const vat = vatPerLine.reduce((a, b) => a + b, 0);
const total = subtotal + vat;
check('every line total is an exact integer', lines.every(Number.isInteger), lines.join(', '));
check('lines sum to the subtotal', lines.reduce((a, b) => a + b, 0) === subtotal, formatPrice(subtotal));
const standardLines = basket.filter(([p]) => p.taxClass === 'standard').length;
check('VAT applies only to standard-rated lines',
  vatPerLine.filter((v) => v > 0).length === standardLines,
  `${standardLines} of ${basket.length} lines standard-rated, VAT ${formatPrice(vat)}`);
check('total reconciles: subtotal + VAT', total === subtotal + vat,
  `${formatPrice(subtotal)} + ${formatPrice(vat)} = ${formatPrice(total)}`);

// --- Demo state coverage (CLAUDE.md sections 4 and 6) ---
const noPhoto = PRODUCTS.filter((p) => p.image === null);
const oos = PRODUCTS.filter((p) => p.stock === 0);
check('a product with no image exists (fallback state)', noPhoto.length > 0,
  noPhoto.map((p) => p.id).join(', '));
check('an out-of-stock product exists', oos.length > 0, oos.map((p) => p.id).join(', '));
check('a discounted product exists', discounted.length > 0, discounted.map((p) => p.id).join(', '));

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
