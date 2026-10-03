/**
 * Emits the sheet the Figma data-sync plugin reads, from catalogue.ts.
 *
 * This is the whole point of the single-source rule: product names reach Figma by
 * export, never by retyping. Column headers are the layer names the plugin maps
 * onto, so renaming a column means renaming a layer.
 *
 * Output is generated — do not edit it, and do not commit edits to it.
 */
import fs from 'node:fs';
import path from 'node:path';
import { PRODUCTS, formatPrice, fullName } from '../src/data/catalogue.ts';

const COLUMNS = [
  ['brand',      (p) => p.brand],
  ['name',       (p) => p.name],
  ['size',       (p) => p.size],
  // Whichever way the card is laid out, there is a column for it: separate layers
  // for brand/name/size, or one combined layer.
  ['fullName',   (p) => fullName(p)],
  ['category',   (p) => p.category],
  ['price',      (p) => formatPrice(p.priceMinor)],
  ['wasPrice',   (p) => (p.wasPriceMinor ? formatPrice(p.wasPriceMinor) : '')],
  ['barcode',    (p) => p.barcode],
  ['stock',      (p) => String(p.stock)],
  ['status',     (p) => (p.stock === 0 ? 'Out of stock' : p.wasPriceMinor ? 'Offer' : 'In stock')],
  ['image',      (p) => p.image ?? ''],
  ['id',         (p) => p.id],
];

const esc = (v) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
const rows = [
  COLUMNS.map(([h]) => h).join(','),
  ...PRODUCTS.map((p) => COLUMNS.map(([, get]) => esc(get(p))).join(',')),
];

const out = path.join(import.meta.dirname, '..', 'figma', 'catalogue.csv');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, rows.join('\n') + '\n');
console.log(`wrote ${path.relative(process.cwd(), out)} — ${PRODUCTS.length} rows, ${COLUMNS.length} columns`);
