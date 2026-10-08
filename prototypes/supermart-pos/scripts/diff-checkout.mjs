/**
 * Coordinate diff of the checkout flow against its frames: Checkout cash `88:12450`,
 * bank `88:13497`, Select payment method `88:14105`, Select bank `88:14794`, Transaction
 * success `88:8723` and the receipt screen `88:8735`. Targets are the nodes' own boxes
 * on the 393x852 screen. Sheets sit 8 in where the frames draw 6 (BottomSheet.css), so
 * sheet targets move by that 2: up, and in from whichever edge they hang off.
 *
 *   node scripts/diff-checkout.mjs [base-url]
 */
import pw from '/opt/node-tools/node_modules/playwright/index.js';

const BASE = process.argv[2] ?? 'http://127.0.0.1:4251/';
const INSET = 8 - 6;
const browser = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 1200, height: 1100 } });
await page.goto(`${BASE}?dev=1`, { waitUntil: 'networkidle' });
await page.waitForSelector('.productCard');
const pick = async (label) => {
  await page.evaluate(() => { if (!document.querySelector('.devbar__panel')) document.querySelector('.devbar__handle').click(); });
  await page.waitForTimeout(400);
  await page.evaluate((l) => [...document.querySelectorAll('.devbar__item')].find((b) => b.textContent.trim() === l).click(), label);
  await page.waitForTimeout(1300);
  // Success and the receipt arrive after the mock API's latency and choreograph in:
  // measure at rest, not mid-flight. (Finite animations only — a spinner never ends.)
  await page.waitForFunction(() => document.getAnimations()
    .every((a) => a.playState !== 'running' || a.effect?.getTiming().iterations === Infinity), null, { timeout: 5000 });
};
const box = (sel, i) => page.evaluate(([s, i]) => {
  const e = document.querySelectorAll(s)[i];
  if (!e) return null;
  const r = e.getBoundingClientRect(); const o = document.querySelector('.device__screen').getBoundingClientRect();
  return [r.left - o.left, r.top - o.top, r.width, r.height];
}, [sel, i]);

let fails = 0;
// [label, selector, index, [x, y, w, h], anchor] — anchor S stretches across the sheet,
// L hangs off its left, R off its right, F is a full-screen surface the inset never
// touches, and H is F with the height left free.
const run = async (name, rows) => {
  console.log(name);
  for (const [label, sel, i, [x, y, w, h], a] of rows) {
    const got = await box(sel, i);
    if (!got) { fails++; console.log(`  ${label.padEnd(18)} MISSING ${sel}`); continue; }
    const want = a === 'F' || a === 'H' ? [x, y, w, h] : [x + (a === 'R' ? -INSET : INSET), y - INSET, a === 'S' ? w - 2 * INSET : w, h];
    // H: the receipt's height is its content's, so only x, y and width are compared.
    const d = got.map((v, k) => (a === 'H' && k === 3 ? 0 : v - want[k]));
    const off = d.some((v) => Math.abs(v) >= 0.5);
    if (off) fails++;
    console.log(`  ${label.padEnd(18)} ${off ? 'OFF ' : 'ok  '} ${JSON.stringify(got.map((v) => Math.round(v * 10) / 10))}  diff ${JSON.stringify(d.map((v) => Math.round(v * 10) / 10))}`);
  }
};

await pick('Checkout: cash');
await run('88:12450 Checkout, cash', [
  ['sheet', '.sheetPanel.checkout', 0, [6, 288, 381, 558], 'S'],
  ['total', '.checkout__total', 0, [6, 373, 381, 36], 'S'],
  ['breakdown', '.checkout__breakdown', 0, [22, 441, 349, 116], 'S'],
  ['method card', '.checkout__methodCard', 0, [22, 589, 349, 56], 'S'],
  ['amount field', '.checkout .detailField', 0, [22, 661, 349, 60], 'S'],
  ['Pay', '.payButton', 0, [22, 758, 349, 48], 'S'],
]);
await pick('Checkout: bank transfer');
await run('88:13497 Checkout, bank transfer', [
  ['sheet', '.sheetPanel.checkout', 0, [6, 232, 381, 614], 'S'],
  ['method card', '.checkout__methodCard', 0, [22, 533, 349, 112], 'S'],
  ['bank row', '.checkout__methodRow--bank', 0, [38, 589, 317, 56], 'S'],
  ['amount field', '.checkout .detailField', 0, [22, 661, 349, 60], 'S'],
  ['Pay', '.payButton', 0, [22, 758, 349, 48], 'S'],
]);
await pick('Select payment method');
await run('88:14105 Select payment method', [
  ['sheet', '.sheetPanel.methodPicker', 0, [6, 421, 381, 425], 'S'],
  ['row Cash', '.methodPicker__row', 0, [22, 490, 349, 56], 'S'],
  ['row Payment split', '.methodPicker__row', 5, [22, 770, 349, 56], 'S'],
  ['check', '.methodPicker__row .pickList__check', 0, [347, 506, 24, 24], 'R'],
]);
await pick('Select bank');
await run('88:14794 Select bank', [
  ['sheet', '.sheetPanel.bankPicker', 0, [6, 337, 381, 509], 'S'],
  ['search', '.bankPicker__search', 0, [22, 406, 349, 40], 'S'],
  ['row Access', '.bankPicker__row', 0, [22, 466, 349, 72], 'S'],
  ['logo Access', '.bankPicker__logo', 0, [22, 482, 40, 40], 'L'],
  ['row Opay 2', '.bankPicker__row', 4, [22, 754, 349, 72], 'S'],
]);
await pick('Transaction success');
await run('88:8723 Transaction success', [
  ['icon', '.saleSuccess__icon', 0, [160.5, 368, 72, 72], 'F'],
  ['line', '.saleSuccess__text', 0, [33, 460, 327, 24], 'F'],
]);
await pick('Receipt: cash');
await run('88:8735 Receipt', [
  ['close', '.receiptScreen .closeButton', 0, [16, 58, 40, 40], 'F'],
  ['receipt card', '.receipt', 0, [16, 122, 361, 0], 'H'],
  ['footer', '.receiptScreen__footer', 0, [0, 748, 393, 104], 'F'],
  ['Share', '.receiptScreen__action', 0, [16, 764, 172.5, 48], 'F'],
  ['Print', '.receiptScreen__action', 1, [204.5, 764, 172.5, 48], 'F'],
]);

await browser.close();
console.log(`\n${fails} measurement(s) outside 0.5px`);
process.exit(fails ? 1 : 0);
