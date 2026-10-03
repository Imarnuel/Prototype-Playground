/**
 * Lists exactly which product photos the catalogue expects, so sourcing them is
 * a checklist rather than a hunt. Run it to see what is still missing.
 */
import fs from 'node:fs';
import path from 'node:path';
import { PRODUCTS } from '../src/data/catalogue.ts';

const dir = path.join(import.meta.dirname, '..', 'assets', 'products');
const have = fs.existsSync(dir) ? new Set(fs.readdirSync(dir)) : new Set();

const needed = PRODUCTS.filter((p) => p.image !== null);
const missing = needed.filter((p) => !have.has(p.image));
const deliberate = PRODUCTS.filter((p) => p.image === null);

console.log(`${needed.length} photos expected, ${needed.length - missing.length} present, ${missing.length} missing`);
console.log(`${deliberate.length} product(s) intentionally without a photo: ${deliberate.map((p) => p.id).join(', ')}`);
if (missing.length) {
  console.log('\nmissing:');
  for (const p of missing) console.log(`  ${p.image.padEnd(26)} ${p.name}`);
}
const extra = [...have].filter((f) => !needed.some((p) => p.image === f));
if (extra.length) console.log(`\nunreferenced files in assets/products: ${extra.join(', ')}`);
