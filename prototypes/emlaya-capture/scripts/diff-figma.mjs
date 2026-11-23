// Measured diff: DOM boxes in the 402x874 harness vs Figma node boxes (figma/nodes.json,
// frame-relative, from get_metadata on 9502:21986). Reports every box and the max delta.
// Usage: node scripts/diff-figma.mjs [baseUrl]
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const { chromium } = createRequire(import.meta.url)('playwright');

const base = process.argv[2] ?? 'http://localhost:4180';
const nodes = JSON.parse(readFileSync(new URL('../figma/nodes.json', import.meta.url)));
// Boxes inside Frame 5117, which get_metadata returns without children: read off
// get_design_context instead (offsets noted).
const manual = {
  '9502:21691': { y: 80, h: 36, note: 'hint: 18 into the feed at 62' },
  '9502:21695': { x: 25, y: 734, w: 349, h: 62, note: 'controls: bottom 13 of the feed (809)' },
  '9502:21698': { x: 168.5, y: 734, w: 62, h: 62, note: 'shutter: centred in the 400 feed' },
  '9502:21724': { x: 336, y: 738, w: 48, h: 48, note: 'add page: 336,676 in the feed' },
};
// Receipt Details (9564:21987), frame-relative from get_metadata. Boxes below the item
// list are compared by size only: the list is 4 real rows, not the frame's 7.
Object.assign(manual, {
  '9564:21994': { x: 17, y: 74, w: 40, h: 40, note: 'back: the header sits at x 1 in the frame' },
  '9564:21995': { x: 346, y: 74, w: 40, h: 40 },
  '9564:21999': { x: 16, y: 134, w: 370, h: 90 },
  '9564:22001': { x: 32, y: 150, w: 338, h: 32 },
  '9564:22016': { x: 12, y: 266, w: 378, h: 70 },
  '9564:22209': { w: 370, h: 132 },
  '9564:22214': { w: 378, h: 226 },
  '9564:22277': { w: 370, h: 72 },
  '9564:22311': { w: 370, h: 152 },
  '9564:22333': { w: 370, h: 48 },
});
const box = (id) => ({ ...nodes[id], ...manual[id] });

const checks = {
  camera: [
    ['9502:21711', '.camera__topRow'],
    ['9502:21712', '.camera__topRow > .glassButton:first-child'],
    ['9502:21714', '.camera__flashToggle'],
    ['9502:21691', '.camera__hint', ['y', 'h']],
    ['9502:21695', '.camera__controls', ['y', 'h']],
    ['9502:21698', '.shutter'],
    ['9502:21688', '.bottomTab'],
    ['9502:21689', '.camera__feed', ['y', 'h']],
  ],
  captured: [
    ['9502:21732', '.camera__continueBar'],
    ['9502:21739', '.camera__continue'],
    ['9502:21724', '.camera__addPage'],
    ['9502:21727', '.camera__topRow'],
  ],
  review: [
    ['9502:21679', '.review__layer--ready .review__headerRow'],
    ['9502:21681', '.review__layer--ready .review__headerRow > .headerButton:first-child'],
    ['9502:21682', '.review__layer--ready .review__headerRow > .headerButton:last-child'],
    ['9502:21326', '.review__topCard'],
    ['9502:21331', '.review__topCard > .textField:nth-child(1)'],
    ['9502:21333', '.review__topCard > .textField:nth-child(2)'],
    ['9502:21335', '.review__row > .textField:nth-child(1)'],
    ['9502:21336', '.review__row > .textField:nth-child(2)'],
    ['9502:21338', '.review__layer--ready .review__items'],
    ['9502:21343', '.review__layer--ready .itemRow:nth-child(1)'],
    ['9502:21364', '.review__layer--ready .itemRow:nth-child(2)'],
  ],
  details: [
    ['9564:21994', '.details__headerRow > .headerButton:first-child'],
    ['9564:21995', '.details__headerRow > .headerButton:last-child'],
    ['9564:21999', '.details__summaryCard'],
    ['9564:22001', '.details__amount'],
    ['9564:22016', '.details .itemRow'],
    ['9564:22209', '.details__otherCard', ['w', 'h']],
    ['9564:22214', '.details__metaCard', ['w', 'h']],
    ['9564:22277', '.details .evidenceRow', ['w', 'h']],
    ['9564:22311', '.suggestion', ['w', 'h']],
    ['9564:22333', '.linkRow', ['w', 'h']],
  ],
  saved: [
    ['9502:21304', '.celebration__close'],
    ['9502:21221', '.celebration__badge'],
    ['9502:21223', '.celebration__copy'],
    ['9502:21308', '.milestoneCard'],
    ['9502:21323', '.celebration__cta'],
  ],
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 900, height: 1000 } });
await page.goto(`${base}/?dev=1&frame=figma`);
await page.waitForTimeout(600);
const click = (sel) => page.evaluate((s) => document.querySelector(s).click(), sel);

async function measure(name) {
  const rows = [];
  for (const [id, sel, only] of checks[name]) {
    const r = await page.evaluate((s) => {
      const scr = document.querySelector('[data-testid="device-screen"]').getBoundingClientRect();
      const e = document.querySelector(s);
      if (!e) return null;
      const b = e.getBoundingClientRect();
      return { x: b.left - scr.left, y: b.top - scr.top, w: b.width, h: b.height };
    }, sel);
    const f = box(id);
    const keys = only ?? ['x', 'y', 'w', 'h'];
    const d = r ? Object.fromEntries(keys.map((k) => [k, +(r[k] - f[k]).toFixed(2)])) : null;
    const max = d ? Math.max(...Object.values(d).map(Math.abs)) : Infinity;
    rows.push({ screen: name, id, sel, figma: keys.map((k) => f[k]).join(','), dom: r ? keys.map((k) => +r[k].toFixed(2)).join(',') : 'MISSING', max });
  }
  return rows;
}

const all = [];
all.push(...(await measure('camera')));
await click('button[aria-label="Take photo"]');
await page.waitForTimeout(700);
all.push(...(await measure('captured')));
await click('.camera__continue');
await page.waitForSelector('.review[data-status="ready"]', { timeout: 15000 });
await page.waitForTimeout(900);
all.push(...(await measure('review')));
await click('.review__dock .button');
await page.waitForSelector('.celebration[data-state="open"]', { timeout: 8000 });
// The staged entrance lands at ~3.05s (Done: 2750 + 300).
await page.waitForTimeout(3600);
all.push(...(await measure('saved')));
await click('.celebration__cta .button');
await page.waitForSelector('.details', { timeout: 4000 });
await page.waitForTimeout(800);
all.push(...(await measure('details')));
await browser.close();

for (const r of all) console.log(`${r.max <= 0.5 ? 'ok  ' : 'DIFF'} ${r.screen.padEnd(8)} ${r.id.padEnd(11)} figma ${r.figma.padEnd(22)} dom ${r.dom.padEnd(30)} max ${r.max}`);
const bad = all.filter((r) => r.max > 0.5);
console.log(`\n${all.length} boxes, ${bad.length} outside 0.5px`);
