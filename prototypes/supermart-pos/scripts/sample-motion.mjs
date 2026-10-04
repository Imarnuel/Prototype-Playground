/**
 * Proves the presented-sheet transition actually animates, in both directions.
 *
 * This exists because checking only the exit let an instant entry ship: the sheet
 * mounted already in its open state, so there was no starting frame to transition
 * from and it appeared with translateY pinned at 0 for every sampled frame. A
 * mounted-and-visible assertion cannot catch that — only sampling position over time
 * can (root agreement §5: stretch the duration and sample frame by frame; geometry
 * can be correct while the composite is wrong).
 *
 * Usage: node scripts/sample-motion.mjs [port]   (a `preview` server must be running)
 */
import pw from '/opt/node-tools/node_modules/playwright/index.js';

const PORT = process.argv[2] ?? '4221';
const URL = `http://127.0.0.1:${PORT}/?dev=1`;
const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let fails = 0;
const check = (n, pass, d = '') => { if (!pass) fails++; console.log(`${pass ? 'PASS' : 'FAIL'}  ${n}  ${d}`); };

const browser = await pw.chromium.launch({ executablePath: EXE });
const page = await browser.newPage({ viewport: { width: 1200, height: 1100 } });
await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForSelector('.productCard', { timeout: 15000 });

const sample = (sel, ms) => page.evaluate(async ([s, dur]) => {
  const read = () => {
    const el = document.querySelector('.sheet');
    if (!el) return { gone: true };
    return { y: new DOMMatrixReadOnly(getComputedStyle(el).transform).m42 };
  };
  document.querySelector(s).click();
  const t0 = performance.now();
  const out = [];
  await new Promise((done) => {
    const tick = () => {
      out.push({ t: performance.now() - t0, ...read() });
      if (performance.now() - t0 < dur) requestAnimationFrame(tick); else done();
    };
    requestAnimationFrame(tick);
  });
  return out;
}, [sel, ms]);

const H = await page.evaluate(() => document.querySelector('.device__screen').getBoundingClientRect().height);
const at = (rows, t) => rows.reduce((b, x) => (Math.abs(x.t - t) < Math.abs(b.t - t) ? x : b));
const progress = (r) => (r.y === undefined ? null : 1 - r.y / H);

// --- ENTRY: must start off-screen and decelerate into place ---
const entry = await sample('.viewCart', 600);
const e0 = at(entry, 16), e25 = at(entry, 105), e50 = at(entry, 210);
check('entry starts off-screen rather than at its destination', progress(e0) < 0.1,
  `${(progress(e0) * 100).toFixed(1)}% travelled at t=${e0.t.toFixed(0)}ms`);
check('entry is in motion a quarter of the way through', progress(e25) > 0.2 && progress(e25) < 0.95,
  `${(progress(e25) * 100).toFixed(1)}% at t=${e25.t.toFixed(0)}ms`);
check('entry decelerates — most distance covered by halfway', progress(e50) > 0.8,
  `${(progress(e50) * 100).toFixed(1)}% at t=${e50.t.toFixed(0)}ms`);

// --- EXIT: must stay mounted and still be moving through its duration ---
await page.waitForTimeout(500);
const exit = await sample('.closeButton', 600);
const unmountAt = exit.find((r) => r.gone)?.t;
check('exit stays mounted through its transition', unmountAt !== undefined && unmountAt > 250,
  `unmounted at ${unmountAt?.toFixed(0)}ms`);
check('exit unmount matches the transition end — no visible cut',
  unmountAt !== undefined && Math.abs(unmountAt - 300) < 90, `${unmountAt?.toFixed(0)}ms vs 300ms token`);
const moved = exit.filter((r) => r.y > 1).length;
check('exit actually travels', moved > 3, `${moved} frames with movement`);

await page.close();

// --- Reduced motion: both directions resolve immediately ---
const rm = await browser.newPage({ viewport: { width: 1200, height: 1100 }, reducedMotion: 'reduce' });
await rm.goto(URL, { waitUntil: 'networkidle' });
await rm.waitForSelector('.productCard');
await rm.evaluate(() => document.querySelector('.viewCart').click());
await rm.waitForTimeout(120);
check('reduced motion lands the sheet immediately, with no stuck off-screen frame',
  await rm.evaluate(() => {
    const el = document.querySelector('.sheet');
    return el && new DOMMatrixReadOnly(getComputedStyle(el).transform).m42 === 0;
  }));
await rm.close();

console.log(`\n${fails} failing`);
await browser.close();
process.exit(fails === 0 ? 0 : 1);
