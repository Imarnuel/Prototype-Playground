/**
 * Every figure the Figma frames show, computed by the app's own modules — nothing
 * retyped. This is what the board's product screens were synced to (figma/README.md,
 * "Synced from the code"): the frames' six Cart lines, the grid, the order totals,
 * the receipt, the queue, and the discount and Item details states.
 *
 *   node scripts/figma-spec.mjs    → figma/figma-spec.json, and a summary on stdout
 *
 * The modules import without extensions, which Node's type stripping cannot resolve,
 * so each is bundled first with the esbuild Vite already ships (as verify-cart does).
 */
import { build } from 'esbuild';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = fs.mkdtempSync(path.join(os.tmpdir(), 'figma-spec-'));
const load = async (rel, name) => {
  const outfile = path.join(out, `${name}.mjs`);
  await build({ entryPoints: [path.join(root, rel)], bundle: true, format: 'esm', platform: 'node', outfile, logLevel: 'error',
    loader: { '.svg': 'dataurl', '.png': 'dataurl', '.webp': 'dataurl' } });
  return import(pathToFileURL(outfile).href);
};
const cat = await load('src/data/catalogue.ts', 'catalogue');
const cart = await load('src/state/cart.ts', 'cart');
const sale = await load('src/state/sale.ts', 'sale');
const queue = await load('src/state/queue.ts', 'queue');
const { PRODUCTS, CATEGORY_ORDER, formatPrice, unitFor } = cat;

const products = Object.fromEntries(PRODUCTS.map((p) => [p.id, {
  name: p.name, price: formatPrice(p.priceMinor), stock: `${p.stock} ${unitFor(p, 'each').abbrev}`,
  image: path.basename(String(p.image ?? '')).replace(/\?.*$/, ''), initials: p.name.slice(0, 2),
}]));
// The grid's "All" order, as api/pos.ts derives it: one per category in turn.
const queues = CATEGORY_ORDER.map((c) => PRODUCTS.filter((p) => p.category === c));
const mixed = []; for (let r = 0; mixed.length < PRODUCTS.length; r++) for (const q of queues) if (q[r]) mixed.push(q[r].id);

// The frames' six Cart lines: the toolbar's four-line demo cart plus two, one each.
const lineIds = ['acc-socks', 'tops-tee', 'btm-jeans', 'acc-beanie', 'acc-cap', 'bag-tote'];
const lines = lineIds.map((id) => ({ productId: id, unitId: 'each', count: 1 }));
const t = cart.totals(lines);
const money = { subtotal: formatPrice(t.subtotal), discount: formatPrice(t.discount), tax: formatPrice(t.tax), total: formatPrice(t.total) };
const at = new Date(2026, 9, 8, 10, 35, 0);
const receipt = sale.buildReceipt({ lines, customer: null, at, sequence: 1, tender: { method: 'cash', tenderedMinor: t.total } });
const seeded = queue.seedQueue(new Date(2026, 9, 8, 14, 0));
const spec = {
  products, grid: mixed,
  cart: lines.map((l) => ({ id: l.productId, qty: '1', unit: 'ea', gross: formatPrice(cart.lineGross(l)) })),
  money, totalMinor: t.total,
  receipt: { lines: receipt.lines, salesValue: receipt.salesValue, vat: receipt.vat, discount: receipt.discount, total: receipt.total, tendered: receipt.tendered, balance: receipt.balance },
  queue: seeded.map((q) => ({ name: q.customer?.name ?? 'Walk-in customer', items: queue.queuedItemNames(q), total: formatPrice(queue.queuedTotal(q)), at: queue.formatQueuedAt(q.queuedAt) })),
  socks: { price: formatPrice(PRODUCTS.find((p) => p.id === 'acc-socks').priceMinor) },
};
fs.writeFileSync(path.join(root, 'figma', 'figma-spec.json'), `${JSON.stringify(spec, null, 1)}\n`);
console.log(JSON.stringify({ grid: spec.grid, cart: spec.cart, money, receiptLines: spec.receipt.lines.map((l) => `${l.title} ${l.amount}`), queue: spec.queue.map((q) => `${q.name}: ${q.items.join(' · ')} ${q.total}`) }, null, 1));

// The Cart with an order discount (`88:15571` draws ₦100 off): the frame's own discount, recomputed.
const td = cart.totals(lines, { kind: 'amount', minor: 10_000 });
console.log('discounted', JSON.stringify({ subtotal: formatPrice(td.subtotal), discount: formatPrice(td.discount), tax: formatPrice(td.tax), total: formatPrice(td.total) }));
// The same at 10% (the toolbar's "Cart: order discount applied").
const tp = cart.totals(lines, { kind: 'percent', percent: 10 });
console.log('10%', JSON.stringify({ subtotal: formatPrice(tp.subtotal), discount: formatPrice(tp.discount), tax: formatPrice(tp.tax), total: formatPrice(tp.total) }));
// Socks at 10, as the Quantity sheet draws its count, per unit.
const socks = PRODUCTS.find((p) => p.id === 'acc-socks');
console.log('socks units', JSON.stringify(socks.units.map((u) => ({ id: u.id, label: u.label, abbrev: u.abbrev, each: u.each }))));
// The receipt as the prototype's "Receipt: cash" makes it: tendered rounded up to ₦5,000.
const tendered = Math.ceil(t.total / 500_000) * 500_000;
const rc = sale.buildReceipt({ lines, customer: null, at, sequence: 1, tender: { method: 'cash', tenderedMinor: tendered } });
console.log('receipt', JSON.stringify({ lines: rc.lines.map((l) => [`${l.title} @ ${l.unitPrice}`, l.amount]), salesValue: rc.salesValue, vat: rc.vat, discount: rc.discount, total: rc.total, paidBy: rc.paidBy, tendered: rc.tendered, balance: rc.balance }));
