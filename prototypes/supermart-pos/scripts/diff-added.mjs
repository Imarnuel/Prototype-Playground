/** Coordinate diff for "Customer added" (88:8243) and its toast (88:8322 / 88:8401). */
import pw from '/opt/node-tools/node_modules/playwright/index.js';
const URL = process.argv[2] ?? 'http://127.0.0.1:4402/';
const SHIFT = 0;   // screens start at the frame's y=50 (index.css), so no shift

// label, selector, x, y, w, h, shift
const T = [
  ['customer row',   '.addCustomer',          12, 130, 361, 56, SHIFT],
  ['row left group', '.addCustomer__pick',    24, 142, null, 32, SHIFT],
  ['avatar',         '.addCustomer__avatar',  24, 142, 32, 32, SHIFT],
  ['customer name',  '.addCustomer__label',   64, 146, null, 24, SHIFT],
  ['remove (trash)', '.addCustomer__remove',  341, 148, 20, 20, SHIFT],
];
// The toast is vertically centred on the screen — (852-132)/2 = 360 exactly — so it
// does not take the header's shift.
const TOAST = [
  ['toast',          '.toast',                 96.5, 360, 200, 132, 0],
];

const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await b.newPage({ viewport: { width: 1200, height: 1100 } });
await page.goto(URL + '?dev=1', { waitUntil: 'networkidle' });
await page.waitForSelector('.productCard');
const pick = async (label) => {
  await page.evaluate(() => { if (!document.querySelector('.devbar__panel')) document.querySelector('.devbar__handle').click(); });
  await page.waitForTimeout(400);
  await page.evaluate((x) => [...document.querySelectorAll('.devbar__item')].find((y) => y.textContent.trim() === x).click(), label);
  await page.waitForTimeout(900);
};

let fails = 0;
const TOL = 0.5;
const run = async (name, table) => {
  const origin = await page.evaluate(() => { const s = document.querySelector('.device__screen').getBoundingClientRect(); return { x: s.left, y: s.top }; });
  const measured = await page.evaluate((sels) => Object.fromEntries(sels.map(([label, sel]) => {
    const el = document.querySelector(sel);
    if (!el) return [label, null];
    const r = el.getBoundingClientRect();
    return [label, { x: r.left, y: r.top, w: r.width, h: r.height }];
  })), table.map(([l, s]) => [l, s]));
  console.log(`\n--- ${name} ---`);
  console.log('element'.padEnd(16), 'axis'.padEnd(5), 'design'.padStart(8), 'shift'.padStart(6), 'target'.padStart(8), 'actual'.padStart(9), 'diff'.padStart(8));
  for (const [label, sel, dx, dy, dw, dh, shift] of table) {
    const m = measured[label];
    if (!m) { console.log(`${label.padEnd(16)} MISSING (${sel})`); fails++; continue; }
    const rows = [
      ...(dx !== null ? [['x', dx, 0, m.x - origin.x]] : []),
      ['y', dy, shift, m.y - origin.y],
      ...(dw !== null ? [['w', dw, 0, m.w]] : []),
      ...(dh !== null ? [['h', dh, 0, m.h]] : []),
    ];
    for (const [axis, design, sh, actual] of rows) {
      const target = design + sh;
      const diff = actual - target;
      const ok = Math.abs(diff) < TOL;
      if (!ok) fails++;
      console.log(label.padEnd(16), axis.padEnd(5), String(design).padStart(8), (sh ? '+' + sh : '').padStart(6),
        target.toFixed(1).padStart(8), actual.toFixed(2).padStart(9), diff.toFixed(2).padStart(8), ok ? '' : '  <-- OFF');
    }
  }
};

await pick('Cart: fill with 4 lines');
await pick('Customer added');
await run('Customer added 88:8243', T);
await pick('Customer added: toast');
await page.waitForTimeout(500);
await run('Toast 88:8401', TOAST);
console.log('\n' + '-'.repeat(70));
console.log(`${fails} measurement(s) outside ${TOL}px`);
await b.close();
