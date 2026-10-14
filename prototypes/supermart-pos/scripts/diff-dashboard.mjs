/**
 * The Dashboard (`197:20741`) against its frame, box by box. Every expectation is a
 * node's absolute box read through the plugin API (BUILD-PLAN, band `197:20741`),
 * in frame coordinates — the device screen is drawn at the frame's own 2569 length
 * for the measurement, so nothing scrolls and DOM pixels are frame pixels.
 *
 * The figures are computed from the books, not copied, so a box whose WIDTH follows
 * its text is checked for position only; everything sized by the layout is checked
 * in full. The tab bar sits 3 above the bottom, as the Sales Point's does (#131), so
 * its y is checked against the frame's plus 3.
 *
 *   node scripts/diff-dashboard.mjs [url]
 */
import pw from '/opt/node-tools/node_modules/playwright/index.js';

const BASE = process.argv[2] ?? 'http://127.0.0.1:4251/';
const TAB = -3;

// [node, selector, index, expected] — expected keys: x y w h, r (right edge), cx (centre).
const BOXES = [
  ['197:21099 header', '.dash__header', 0, { x: 0, y: 50, w: 393, h: 56 }],
  ['197:21100 avatar', '.dash__avatar', 0, { x: 16, y: 60, w: 36, h: 36 }],
  ['197:21105 store name', '.dash__store', 0, { y: 66, h: 24, cx: 188.5 }],
  ['197:21103 bell', '.dash__bell', 0, { x: 337, y: 58, w: 40, h: 40 }],
  ['197:21104 bell glyph', '.dash__bell .icon', 0, { x: 347, y: 68, w: 20, h: 20 }],
  ['197:20743 filter row', '.dash__filterRow', 0, { x: 16, y: 114, w: 361, h: 36 }],
  ['197:20744 filter', '.dash__filter', 0, { x: 16, y: 114, h: 36 }],
  ['678:29 filter label', '.dash__filter > span', 0, { x: 28, y: 122, h: 20 }],
  ['678:31 chevron', '.dash__filter .icon', 0, { y: 124, w: 16, h: 16 }],
  ['197:20745 date', '.dash__date', 0, { y: 122, h: 20, r: 377 }],
  // Tiles
  ...[[16, 166], [202.5, 166], [16, 274], [202.5, 274]].flatMap(([x, y], i) => [
    [`tile ${i}`, '.dash__tile', i, { x, y, w: 174.5, h: 96 }],
    [`tile ${i} glyph`, '.dash__tileLabel .icon', i, { x: x + 16, y: y + 22, w: 16, h: 16 }],
    [`tile ${i} label`, '.dash__tileLabel span', i, { x: x + 38, y: y + 20, h: 20 }],
    [`tile ${i} value`, '.dash__tileValue', i, { x: x + 16, y: y + 52, h: 24 }],
  ]),
  // Sales Analysis
  ['197:20777 section', '.dash__sales', 0, { x: 16, y: 386, w: 361, h: 324 }],
  ['197:20778 title', '.dash__sales .dash__title', 0, { x: 16, y: 386, h: 24 }],
  ['197:20780 card', '.dash__salesCard', 0, { x: 16, y: 418, w: 361, h: 292 }],
  ['197:20781 head', '.dash__salesHead', 0, { x: 33, y: 446, w: 325, h: 20 }],
  ['197:20783 "Today:"', '.dash__salesToday > span', 0, { x: 33, y: 446, h: 20 }],
  ['197:20784 today value', '.dash__salesTodayValue', 0, { y: 449, h: 14 }],
  ['197:20788 margin value', '.dash__salesMargin > span', 1, { y: 446, h: 20, r: 358 }],
  ['197:20790 bar', '.dash__splitBar', 0, { x: 33, y: 506, w: 325, h: 12 }],
  ...[[33, 566], [152, 566], [271, 566], [33, 638], [152, 638], [271, 638]].flatMap(([x, y], i) => [
    [`method ${i}`, '.dash__method', i, { x, y, w: 88, h: 44 }],
    [`method ${i} marker`, '.dash__square', i, { x, y: y + 5, w: 6, h: 6 }],
    [`method ${i} value`, '.dash__methodValue', i, { x, y: y + 24, h: 20 }],
  ]),
  // Inventory Summary
  ['197:20830 section', '.dash__inventory', 0, { x: 16, y: 726, w: 361, h: 240 }],
  ['197:20832 card', '.dash__inventoryCard', 0, { x: 16, y: 758, w: 361, h: 208 }],
  ['197:20833 inner', '.dash__inventoryInner', 0, { x: 32, y: 786, w: 327, h: 152 }],
  ['197:20836 stock tile', '.dash__stockIcon', 0, { x: 32, y: 786, w: 52, h: 52 }],
  ['197:20837 stock glyph', '.dash__stockIcon .icon', 0, { x: 48, y: 802, w: 20, h: 20 }],
  ['197:20839 stock label', '.dash__stockLabel', 0, { x: 96, y: 786, h: 20 }],
  ['197:20840 stock value', '.dash__stockValue', 0, { x: 96, y: 818, h: 24 }],
  ['197:20841 rule', '.dash__inventoryInner .dash__rule', 0, { x: 32, y: 861.5, w: 327, h: 1 }],
  ['197:20844 retail tile', '.dash__stockIcon', 1, { x: 32, y: 882, w: 52, h: 52 }],
  ['197:20848 retail value', '.dash__stockValue', 1, { x: 96, y: 914, h: 24 }],
  ['197:20849 mark-up', '.dash__markup', 0, { y: 784, h: 28, r: 359.5 }],
  ['197:20853 margin', '.dash__margin', 0, { y: 876, h: 28, r: 359.5 }],
  // Profit & Loss
  ['197:20857 section', '.dash__pnl', 0, { x: 16, y: 982, w: 361, h: 288 }],
  ['197:20859 title', '.dash__pnl .dash__title', 0, { x: 16, y: 982, h: 24 }],
  ['197:20863 card', '.dash__pnl .dash__card', 0, { x: 16, y: 1014, w: 361, h: 256 }],
  ['197:20864 inner', '.dash__pnl .dash__shareInner', 0, { x: 37.5, y: 1042, w: 318, h: 200 }],
  ['197:20871 revenue glyph', '.dash__pnl .dash__shareKey .icon', 0, { x: 37.5, y: 1044, w: 16, h: 16 }],
  ['197:20872 "Revenue:"', '.dash__pnl .dash__shareKey span', 0, { x: 57.5, y: 1042, h: 20 }],
  ['197:20879 expense share', '.dash__pnl .dash__sharePct', 1, { y: 1042, h: 20, r: 355.5 }],
  ['197:20880 bar', '.dash__pnl .dash__pair', 0, { x: 37.5, y: 1074, w: 318, h: 12 }],
  ['197:20885 revenue dot', '.dash__pnl .dash__shareAmount .dash__dot', 0, { x: 37.5, y: 1111, w: 6, h: 6 }],
  ['197:20884 revenue amount', '.dash__pnl .dash__shareAmount', 0, { x: 37.5, y: 1102, h: 24 }],
  ['197:20887 expense amount', '.dash__pnl .dash__shareAmount', 1, { y: 1102, h: 24, r: 355.5 }],
  ['197:20890 rule', '.dash__pnl .dash__rule', 0, { x: 37.5, y: 1149.5, w: 318, h: 1 }],
  ['197:20893 profit dot', '.dash__pnl .dash__totalLabel .dash__dot', 0, { x: 37.5, y: 1181, w: 6, h: 6 }],
  ['197:20892 "Profit"', '.dash__pnl .dash__totalLabel', 0, { x: 37.5, y: 1174, h: 20 }],
  ['197:20895 profit', '.dash__pnl .dash__totalValue', 0, { x: 37.5, y: 1206, h: 36 }],
  // Top Locations
  ['197:20896 section', '.dash__locations', 0, { x: 16, y: 1286, w: 361, h: 436 }],
  ['197:20898 title', '.dash__locations .dash__title', 0, { x: 16, y: 1286, h: 24 }],
  ['197:20901 card', '.dash__locationsCard', 0, { x: 16, y: 1318, w: 361, h: 404 }],
  ['197:20903 table', '.dash__table', 0, { x: 31.5, y: 1342, w: 329, h: 356 }],
  ['197:20905 # head', '.dash__table th', 0, { x: 31.5, y: 1342, w: 35, h: 36 }],
  ['197:20918 location head', '.dash__table th', 1, { x: 66.5, y: 1342, w: 184, h: 36 }],
  ['197:20946 sales head', '.dash__table th', 2, { x: 250.5, y: 1342, w: 110, h: 36 }],
  ['197:20949 "Sales"', '.dash__table th.dash__colSales span', 0, { r: 352.5 }],
  ...[0, 1, 2, 3, 4].flatMap((i) => {
    const y = 1378 + 64 * i;
    return [
      [`row ${i + 1}`, '.dash__table tbody tr', i, { x: 31.5, y, w: 329, h: 64 }],
      [`row ${i + 1} name`, '.dash__locName', i, { x: 74.5, y: y + 11, h: 20 }],
      [`row ${i + 1} pin`, '.dash__locAddress .icon', i, { x: 74.5, y: y + 39, w: 12, h: 12 }],
      [`row ${i + 1} address`, '.dash__locAddress > span', i, { x: 90.5, y: y + 37, h: 16 }],
      [`row ${i + 1} sales`, '.dash__locSales', i, { y: y + 4.5, h: 36, r: 352.5 }],
      [`row ${i + 1} change`, '.dash__locChange', i, { y: y + 44.5, h: 15, r: 352.5 }],
    ];
  }),
  // Cash Flow
  ['197:20988 section', '.dash__flow', 0, { x: 16, y: 1738, w: 361, h: 532 }],
  ['197:20990 title', '.dash__flow .dash__title', 0, { x: 16, y: 1738, h: 24 }],
  ['197:20993 card', '.dash__flowCard', 0, { x: 16, y: 1770, w: 361, h: 500 }],
  ...[[1794, 'Cash'], [1986, 'Bank']].flatMap(([y, name], i) => [
    [`${name} block`, '.dash__flowBlock', i, { x: 31, y, w: 326, h: 156 }],
    [`${name} glyph`, '.dash__flowHead .icon', i, { x: 31, y: y + 2, w: 20, h: 20 }],
    [`${name} label`, '.dash__flowHead span', i, { x: 57, y, h: 24 }],
    [`${name} top`, '.dash__flowTop', i, { x: 31, y: y + 28, w: 326, h: 76 }],
    [`${name} received glyph`, '.dash__flowKey .icon', i * 2, { x: 43, y: y + 46, w: 16, h: 16 }],
    [`${name} "Spent"`, '.dash__flowKey', i * 2 + 1, { y: y + 44, h: 20, r: 345 }],
    [`${name} received dot`, '.dash__flowAmount .dash__dot', i * 2, { x: 43, y: y + 77, w: 6, h: 6 }],
    [`${name} received`, '.dash__flowAmount', i * 2, { x: 43, y: y + 72, h: 16 }],
    [`${name} spent`, '.dash__flowAmount', i * 2 + 1, { y: y + 72, h: 16, r: 345 }],
    [`${name} foot`, '.dash__flowFoot', i, { x: 32, y: y + 104, w: 325, h: 52 }],
    [`${name} balance`, '.dash__flowBalance', i, { x: 44, y: y + 104, w: 300, h: 52 }],
  ]),
  ['197:21057 "Current Balance"', '.dash__flow .dash__totalLabel', 0, { x: 31, y: 2178, h: 20 }],
  ['197:21058 current balance', '.dash__flow .dash__totalValue', 0, { x: 31, y: 2210, h: 36 }],
  // Debtors/Creditors
  ['197:21059 section', '.dash__debts', 0, { x: 16, y: 2286, w: 361, h: 172 }],
  ['197:21061 title', '.dash__debts .dash__title', 0, { x: 16, y: 2286, h: 24 }],
  ['197:21064 card', '.dash__debtsCard', 0, { x: 16, y: 2318, w: 361, h: 140 }],
  ['197:21066 inner', '.dash__debts .dash__shareTop', 0, { x: 37.5, y: 2346, w: 318, h: 84 }],
  ['197:21072 debtors glyph', '.dash__debts .dash__shareKey .icon', 0, { x: 37.5, y: 2348, w: 16, h: 16 }],
  ['197:21081 bar', '.dash__debts .dash__pair', 0, { x: 37.5, y: 2378, w: 318, h: 12 }],
  ['197:21086 debtors dot', '.dash__debts .dash__shareAmount .dash__dot', 0, { x: 37.5, y: 2415, w: 6, h: 6 }],
  ['197:21090 creditors amount', '.dash__debts .dash__shareAmount', 1, { y: 2406, h: 24, r: 355.5 }],
  // Tab bar, Dashboard variant
  // The nav's frame box is x 70 w 252: centred on 196 (the instance sits at x -0.5).
  ['2232:7410 nav', '.dash .tabBar__nav', 0, { cx: 196, y: 2489 + TAB, h: 60 }],
  ['2232:7411 Dashboard', '.dash .tabBar__item', 0, { y: 2493 + TAB, h: 52 }],
  ['2232:7413 Sales Point', '.dash .tabBar__item', 1, { y: 2493 + TAB, h: 52 }],
  ['2232:7414 More', '.dash .tabBar__item', 2, { y: 2493 + TAB, h: 52 }],
  ['2227:7787 grid glyph', '.dash .tabBar__item .icon', 0, { y: 2501 + TAB, w: 20, h: 20 }],
  // Measured only to derive the layout rules below.
  ['filter label (rule)', '.dash__filter > span', 0, {}],
  ['"Today:" (rule)', '.dash__salesToday > span', 0, {}],
  ...[0, 1, 2].map((i) => [`tab label ${i} (rule)`, '.dash .tabBar__label', i, {}]),
];

/* Where a box follows its text, Figma's integer-rounded text width (it rounds an auto-
   width node; Inter's advances there and here differ by up to ~1.5px) would decide the
   answer, so the frame's LAYOUT is asserted instead — each gap and padding exact. */
const RULES = (b) => [
  ['678:31 chevron is 8 after the label', b('678:31 chevron').x, b('filter label (rule)').x + b('filter label (rule)').w + 8],
  ['197:20744 filter is padded 12 either side', b('197:20744 filter').w, b('678:31 chevron').x + 16 + 12 - 16],
  ['197:20784 today value is 6 after "Today:"', b('197:20784 today value').x, b('"Today:" (rule)').x + b('"Today:" (rule)').w + 6],
  ...[[0, 16], [1, 16], [2, 24]].map(([i, pad]) => [`tab ${i}: its label plus ${pad} either side`,
    b(['2232:7411 Dashboard', '2232:7413 Sales Point', '2232:7414 More'][i]).w, b(`tab label ${i} (rule)`).w + 2 * pad]),
  ['tabs overlap by 4', b('2232:7413 Sales Point').x, b('2232:7411 Dashboard').x + b('2232:7411 Dashboard').w - 4],
  ['nav is its tabs plus 4 either side', b('2232:7410 nav').w,
    b('2232:7414 More').x + b('2232:7414 More').w + 4 - b('2232:7411 Dashboard').x + 4],
  ['2227:7787 grid glyph centred in its tab', b('2227:7787 grid glyph').x + 10, b('2232:7411 Dashboard').x + b('2232:7411 Dashboard').w / 2],
];

const browser = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 1200, height: 2800 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(`${BASE}?dev=1`, { waitUntil: 'networkidle' });
await page.waitForSelector('.productCard');
await page.evaluate(() => document.querySelector('.tabBar__item').click());
await page.waitForSelector('.dash__tileValue:not(.dash__skeleton)');
await page.addStyleTag({ content: '.device__screen{height:2569px !important}' });
await page.waitForTimeout(700);

const boxes = await page.evaluate((list) => {
  const o = document.querySelector('.device__screen').getBoundingClientRect();
  return list.map(([, sel, i]) => {
    const el = document.querySelectorAll(sel)[i];
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left - o.left, y: r.top - o.top, w: r.width, h: r.height };
  });
}, BOXES);

let outside = 0, measured = 0;
BOXES.forEach(([label, sel, i, want], n) => {
  const got = boxes[n];
  if (!got) { outside++; console.log(`MISSING  ${label}  (${sel} #${i})`); return; }
  const have = { ...got, r: got.x + got.w, cx: got.x + got.w / 2 };
  const bad = Object.entries(want).filter(([k, v]) => { measured++; return Math.abs(have[k] - v) > 0.5; });
  if (bad.length) { outside += bad.length; console.log(`OFF  ${label}  ${bad.map(([k, v]) => `${k} ${have[k].toFixed(2)} want ${v}`).join(', ')}`); }
});
const byLabel = (l) => { const i = BOXES.findIndex(([label]) => label === l); return boxes[i]; };
for (const [label, got, want] of RULES(byLabel)) {
  measured++;
  if (Math.abs(got - want) > 0.5) { outside++; console.log(`OFF  ${label}  ${got.toFixed(2)} want ${want.toFixed(2)}`); }
}
if (errors.length) console.log('page errors:', errors.join('; '));
await browser.close();
console.log(`\n${measured} measurements, ${outside} measurement(s) outside 0.5px`);
process.exit(outside || errors.length ? 1 : 0);
