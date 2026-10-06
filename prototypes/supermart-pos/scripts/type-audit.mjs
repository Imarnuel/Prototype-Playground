/**
 * Every rendered text element's type against its Figma node: size, weight, line
 * height, letter spacing (px). Expected values were read off the nodes with use_figma
 * (getStyledTextSegments, letter spacing converted from % where the node uses it);
 * the node id is on each row. Inter itself is pinned to the build Figma renders
 * (3.019) — see index.css.
 *
 *   node scripts/type-audit.mjs [base-url]
 */
import pw from '/opt/node-tools/node_modules/playwright/index.js';

const BASE = process.argv[2] ?? 'http://127.0.0.1:4251/';
const H3 = [16, 600, 24, -0.32], H2 = [18, 600, 24, -0.32], LL = [16, 500, 24, -0.24], LB = [14, 500, 20, -0.16];
const BL = [16, 400, 24, -0.24], BB = [14, 400, 20, -0.2], BTN = [16, 500, 24, 0];
// [state, node, selector, [size, weight, line-height, letter-spacing]]
const ROWS = [
  [null, '88:8083 title', '.salesPoint__title', [22, 600, 28, -0.64]],
  [null, '88:8093 chip', '.filterChip', LB],
  [null, '88:8107 card name', '.productCard__name', LL],
  [null, '88:8109 card price', '.productCard__price', LL],
  [null, '88:8111 card stock', '.productCard__stock', LB],
  [null, 'I search "Search"', '.textField__input', BB],
  [null, 'I tab label', '.tabBar__label', [11, 500, 16, -0.2]],
  [null, 'I "View cart"', '.viewCart__label', BTN],
  ['Cart: fill with 4 lines', '88:8169 title', '.cart__title', H2],
  ['Cart: fill with 4 lines', '88:8180 "Add customer"', '.addCustomer__label', LL],
  ['Cart: fill with 4 lines', '88:8187 line name', '.cartLine__name', LL],
  ['Cart: fill with 4 lines', '88:8191 line price', '.cartLine__price', LL],
  ['Cart: fill with 4 lines', 'I qty "10 ea"', '.qtyField__value', BB],
  ['Cart: fill with 4 lines', 'I "Checkout (5)"', '.cart__checkoutLabel', BTN],
  ['Cart: fill with 4 lines', 'I "Queue order"', '.cart__queueLabel', BTN],
  ['Cart: fill with 4 lines', '88:8717 "Total"', '.orderTotal__label', H3],
  ['Cart: fill with 4 lines', '88:8719 total', '.orderTotal__value', H3],
  ['Customer added', '88:8259 customer name', '.addCustomer__label', H3],
  ['Customer added: toast', 'I toast', '.toast__message', BL],
  ['Select customer', 'I sheet title', '.modalHeader__title', H2],
  ['Select customer', 'I search', '.customerSearch__input', BB],
  ['Select customer', 'I "Add customer"', '.customerAdd__label', BTN],
  ['Select customer', '88:12137 row', '.customerRow__name', BL],
  ['Select customer: empty', '88:11940 title', '.customerEmpty__title', H2],
  ['Select customer: empty', '88:11941 body', '.customerEmpty__body', [16, 400, 24, -0.2]],
  ['Select customer: empty', 'I CTA', '.customerEmpty__ctaLabel', BTN],
  ['Cart: total expanded', '88:9423 "Subtotal"', '.orderTotal__row dt', LB],
  ['Cart: total expanded', '88:9425 amount', '.orderTotal__amount', [14, 600, 20, -0.2]],
  ['Quantity sheet', 'I sheet title', '.quantitySheet .modalHeader__title', H2],
  ['Quantity sheet', '88:11620 count', '.qtyStepper__value', [24, 600, 28, -0.64]],
  ['Quantity sheet', '88:11624 "Measurement"', '.measurement__title', [16, 600, 20, -0.2]],
  ['Quantity sheet', '88:11628 "10 Each"', '.measurement__label', BL],
  ['Quantity sheet', '88:11629 "10 ea"', '.measurement__each', BB],
  ['Item details', '88:9527 product name', '.lineDetails__name', [18, 600, 22, -0.36]],
  ['Item details', '88:9529 "Regular" (size)', '.lineDetails__sub > span', [16, 400, 20, -0.2]],
  ['Item details', '88:9530 net price', '.lineDetails__sub strong', [16, 600, 20, -0.2]],
  ['Item details', '88:9534 unit price', '.lineDetails__unitPrice', [16, 400, 20, -0.2]],
  ['Item details', 'I qty "10 ea"', '.lineDetails__qty .qtyField__value', BL],
  ['Item details', 'I "Set price"', '.detailField__label', [12, 500, 16, 0]],
  ['Item details', 'I "₦10,000"', '.detailField input', BL],
  ['Item details', 'I "Sold to a customer"', '.detailField textarea', BL],
  ['Item details', '88:9562 "%"', ".segmented__option[aria-checked='true']", [16, 600, 20, -0.2]],
  ['Item details', '88:9564 "₦"', ".segmented__option[aria-checked='false']", [16, 400, 24, -0.32]],
];

const browser = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 1200, height: 1000 } });
await page.goto(`${BASE}?dev=1`, { waitUntil: 'networkidle' });
await page.waitForSelector('.productCard');
const pick = async (label) => {
  await page.evaluate(() => { if (!document.querySelector('.devbar__panel')) document.querySelector('.devbar__handle').click(); });
  await page.waitForTimeout(400);
  await page.evaluate((l) => [...document.querySelectorAll('.devbar__item')].find((b) => b.textContent.trim() === l).click(), label);
  await page.waitForTimeout(900);
};

let fails = 0, state = null;
const font = await page.evaluate(async () => { await document.fonts.ready; return [...document.fonts].filter((f) => f.status === 'loaded').map((f) => `${f.family} ${f.weight}`).join(', '); });
console.log(`fonts loaded: ${font}\n`);
for (const [st, node, sel, [size, weight, lh, ls]] of ROWS) {
  if (st !== state) { if (st) await pick(st); state = st; console.log(`— ${st ?? 'Sales Point'}`); }
  const got = await page.evaluate((s) => {
    const e = document.querySelector(s); if (!e) return null;
    const c = getComputedStyle(e);
    return { size: parseFloat(c.fontSize), weight: Number(c.fontWeight), lh: parseFloat(c.lineHeight), ls: c.letterSpacing === 'normal' ? 0 : parseFloat(c.letterSpacing), family: c.fontFamily.split(',')[0] };
  }, sel);
  if (!got) { fails++; console.log(`  MISSING  ${node}  ${sel}`); continue; }
  const bad = [];
  if (got.size !== size) bad.push(`size ${got.size}≠${size}`);
  if (got.weight !== weight) bad.push(`weight ${got.weight}≠${weight}`);
  if (Math.abs(got.lh - lh) > 0.01) bad.push(`line-height ${got.lh}≠${lh}`);
  if (Math.abs(got.ls - ls) > 0.01) bad.push(`letter-spacing ${got.ls}≠${ls}`);
  if (!/Inter/.test(got.family)) bad.push(`family ${got.family}`);
  if (bad.length) fails++;
  console.log(`  ${bad.length ? 'DIFF' : 'ok  '}  ${node.padEnd(26)} ${size}/${weight}/${lh}/${ls}${bad.length ? '   ' + bad.join(', ') : ''}`);
}
await browser.close();
console.log(`\n${ROWS.length} text elements, ${fails} differ`);
process.exit(fails ? 1 : 0);
