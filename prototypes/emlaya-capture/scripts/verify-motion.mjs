// Samples the motion against the brief's numbers, in a production build.
// Usage: node scripts/verify-motion.mjs [baseUrl]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const base = process.argv[2] ?? 'http://localhost:4180';

const browser = await chromium.launch();
const results = [];
const check = (name, pass, detail) => results.push({ name, pass, detail });

async function open(reduced) {
  const ctx = await browser.newContext({ viewport: { width: 900, height: 1000 }, reducedMotion: reduced ? 'reduce' : 'no-preference' });
  const page = await ctx.newPage();
  await page.goto(`${base}/?dev=1`);
  await page.waitForTimeout(500);
  return { ctx, page };
}

const click = (page, sel) => page.evaluate((s) => document.querySelector(s).click(), sel);

// --- 1. Full flow, sampling the celebration entrance ---------------------------------
{
  const { ctx, page } = await open(false);
  // Live capture: the feed moves (hand-held), the outline finds the paper, the shot freezes.
  await page.waitForTimeout(1800);
  const frameSig = () => page.evaluate(() => {
    const c = document.querySelector('.camera__photo');
    const g = c.getContext('2d');
    const d = g.getImageData(0, 0, c.width, c.height).data;
    let h = 0; for (let i = 0; i < d.length; i += 4097) h = (h * 31 + d[i]) >>> 0;
    return h;
  });
  const a = await frameSig(); await page.waitForTimeout(250); const b = await frameSig();
  check('live: the feed moves (hand-held drift)', a !== b, `frame hash ${a} → ${b}`);
  await click(page, 'button[aria-label="Take photo"]');
  await page.waitForTimeout(500);
  const c1 = await frameSig(); await page.waitForTimeout(400); const c2 = await frameSig();
  check('captured: the shot is frozen', c1 === c2, `frame hash ${c1} → ${c2}`);

  // Into processing: Review rises as a sheet; the shot under it does not zoom.
  await click(page, '.camera__continue');
  const mid = await page.evaluate(() => new Promise((r) => setTimeout(() => {
    const layer = document.querySelector('.layer--review');
    const feed = document.querySelector('.camera__feed');
    const ty = layer ? new DOMMatrix(getComputedStyle(layer).transform).f : null;
    const s = feed ? new DOMMatrix(getComputedStyle(feed).transform).a : 1;
    r({ ty, s, h: layer ? layer.getBoundingClientRect().height : 0 });
  }, 150)));
  check('sheet: Review mid-rise, no zoom on the shot', mid.ty > 0 && mid.ty < mid.h && mid.s === 1, `translateY ${mid.ty?.toFixed(1)} of ${mid.h.toFixed(0)}, feed scale ${mid.s}`);

  await page.waitForSelector('.review[data-status="ready"]', { timeout: 8000 });
  await page.waitForTimeout(600);
  const thumb = await page.evaluate(() => document.querySelector('.review .evidenceRow__thumb img')?.getAttribute('src')?.slice(0, 23));
  check('evidence: the shot\'s scan is the thumbnail', thumb === 'data:image/jpeg;base64,', thumb);
  // An edit on Review, to prove later that Receipt Details reads the same record.
  await page.evaluate(() => document.querySelector('.review button[aria-label="Remove Organic"]').click());
  await page.waitForTimeout(100);
  const rail = await page.evaluate(() => !!document.querySelector('.review__actions, .action'));
  check('review: no receipt-actions rail', !rail, `rail present: ${rail}`);

  // Save; then read when each element's entrance animation is scheduled to start
  // (startTime + delay, from the Web Animations API — exact, unlike sampling the first
  // frame's computed style, which can be pre-render), and count frames for 3s.
  const samples = await page.evaluate(() => new Promise((resolve) => {
    document.querySelector('.review__dock .button').click();
    const sel = {
      backdrop: '.celebration__backdrop', pop: '.celebration__badgePop', ring: '.celebration__ring', check: '.checkBadge__stroke',
      settle: '.celebration__badge', rays: '.rays', word1: '.celebration__word:nth-of-type(1) .celebration__wordInner',
      word2: '.celebration__word:nth-of-type(2) .celebration__wordInner', body: '.celebration__body', card: '.celebration__card', cta: '.celebration__cta',
    };
    let t0 = null; let frames = 0; let worst = 0; let last = 0;
    const tick = (now) => {
      if (t0 === null && document.querySelector('.celebration[data-state="open"]')) t0 = now;
      if (t0 !== null) {
        frames += 1; if (last) worst = Math.max(worst, now - last); last = now;
        if (now - t0 > 3700) {
          const starts = {};
          for (const [k, s] of Object.entries(sel)) {
            const el = document.querySelector(s);
            const anims = el.getAnimations().filter((a) => a.startTime !== null);
            starts[k] = anims.length ? Math.min(...anims.map((a) => a.startTime + a.effect.getTiming().delay)) : null;
          }
          const zero = starts.backdrop;
          const start = Object.fromEntries(Object.entries(starts).map(([k, v]) => [k, v === null ? null : Math.round(v - zero)]));
          return resolve({ start, fps: frames / 3.7, worstFrame: Math.round(worst) });
        }
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }));
  const expect = { backdrop: 0, pop: 80, ring: 140, check: 130, settle: 850, rays: 900, word1: 1400, word2: 1510, body: 1700, card: 2100, cta: 2550 };
  for (const [k, ms] of Object.entries(expect)) {
    const got = samples.start[k];
    check(`entrance: ${k} starts at ${ms}ms`, got !== null && Math.abs(got - ms) <= 1, `scheduled at ${got}ms after the backdrop`);
  }
  check('entrance: frame rate', samples.fps >= 50, `${samples.fps.toFixed(1)} fps over 3.7s, worst frame ${samples.worstFrame}ms`);

  // CTA takes taps only after it lands.
  const inertEarly = await page.evaluate(() => document.querySelector('.celebration__cta').hasAttribute('inert'));
  check('CTA interactive after landing', !inertEarly, `inert at 3.7s: ${inertEarly}`);

  // Confetti: cap, fall-through, cleared by ~5s from its start.
  const conf = await page.evaluate(() => new Promise((resolve) => {
    const c = window.__confetti; const t0 = performance.now(); let peak = 0;
    const poll = () => {
      const s = c.stats(); peak = Math.max(peak, s.peak);
      if (s.done || performance.now() - t0 > 7000) return resolve({ ...s, peak, wall: Math.round(performance.now() - t0) });
      setTimeout(poll, 50);
    };
    poll();
  }));
  check('confetti: ≤150 alive at once', conf.peak <= 150, `peak ${conf.peak} alive, ${conf.spawned} spawned`);
  check('confetti: cleared by ~5s', conf.done && conf.elapsedMs <= 5000, `last piece off-screen at ${Math.round(conf.elapsedMs)}ms of simulation`);

  // Rays: layers turn in opposite directions at ~40s and ~60s a revolution.
  const turn = await page.evaluate(() => new Promise((resolve) => {
    const read = () => [...document.querySelectorAll('.rays__layer')].map((l) => { const m = new DOMMatrix(getComputedStyle(l).transform); return Math.atan2(m.b, m.a) * 180 / Math.PI; });
    const a = read(); setTimeout(() => { const b = read(); resolve([b[0] - a[0], b[1] - a[1]]); }, 1000);
  }));
  check('rays: outer ~9°/s clockwise (40s/rev)', Math.abs(turn[0] - 9) < 1.5, `${turn[0].toFixed(2)}°/s`);
  check('rays: inner ~6°/s counter-clockwise (60s/rev)', Math.abs(turn[1] + 6) < 1.5, `${turn[1].toFixed(2)}°/s`);

  // Exit: Done reverses the content and fades the rest within the exit token, then lands
  // on the camera — and the record it saved is in the store (prove by consequence).
  const exit = await page.evaluate(() => new Promise((resolve) => {
    document.querySelector('.celebration__cta .button').click();
    setTimeout(() => {
      const c = document.querySelector('.celebration');
      const mid = c ? +getComputedStyle(c.querySelector('.celebration__copy')).opacity : 0;
      setTimeout(() => resolve({ mid, gone: !document.querySelector('.celebration'), details: !!document.querySelector('.details') }), 400);
    }, 170);
  }));
  check('exit: content fading at 170ms of 200', exit.mid >= 0 && exit.mid < 0.2, `copy opacity ${exit.mid.toFixed(2)} at 170ms`);
  check('exit: Done lands on Receipt Details', exit.gone && exit.details, JSON.stringify(exit));

  // Receipt Details reads the saved record: the tag removed on Review is gone here too.
  const det = await page.evaluate(() => ({
    title: document.querySelector('.details__title')?.textContent,
    amount: document.querySelector('.details__amount')?.textContent,
    tags: [...document.querySelectorAll('.details .pill--tag .pill__text')].map((e) => e.textContent),
    when: document.querySelector('.details__kind')?.textContent,
  }));
  check('details: the saved record, with Review\'s edit', det.amount === '₦15,000' && !det.tags.includes('Organic') && det.tags.includes('Essentials'), JSON.stringify(det));
  check('details: weekday computed (16 Aug 2026 is a Sunday)', /Sun 16 Aug, 9:00 am/.test(det.when ?? ''), det.when);
  await click(page, '.details .smallButton--quiet');
  await page.waitForTimeout(500);
  const sug = await page.evaluate(() => ({ card: !!document.querySelector('.suggestion'), rows: document.querySelectorAll('.linkRow').length }));
  check('details: "Not this" folds the suggestion away', !sug.card && sug.rows === 2, JSON.stringify(sug));
  await click(page, '.details__headerRow > .headerButton:first-child');
  await page.waitForSelector('.camera', { timeout: 3000 });
  await page.waitForTimeout(600);

  // Second pass: the milestone counts the first save.
  await click(page, 'button[aria-label="Take photo"]');
  await page.waitForTimeout(400);
  await click(page, '.camera__continue');
  await page.waitForSelector('.review[data-status="ready"]', { timeout: 8000 });
  await page.waitForTimeout(500);
  await click(page, '.review__dock .button');
  await page.waitForSelector('.celebration[data-state="open"]', { timeout: 8000 });
  const card = await page.evaluate(() => document.querySelector('.milestoneCard').textContent);
  check('milestone derives from the store', /3rd purchase/.test(card) && /₦70,000/.test(card), card);
  await ctx.close();
}

// --- 2. A dark-themed host must not darken the app -------------------------------------
{
  const { ctx, page } = await open(false);
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await page.evaluate(() => document.querySelector('.devbar__handle').click());
  await page.waitForTimeout(400);
  await page.evaluate(() => [...document.querySelectorAll('.devbar button')].find((b) => b.textContent === 'Processing').click());
  await page.evaluate(() => document.querySelector('.devbar__handle').click());
  await page.waitForTimeout(1200);
  const veil = await page.evaluate(() => getComputedStyle(document.querySelector('.review__veil')).backgroundImage);
  check('dark host: processing veil stays light', /255, 255, 255/.test(veil) && !/34, 34, 32/.test(veil), veil.slice(0, 90));
  await ctx.close();
}

// --- 2b. The badge's poses (12 principles), read with every animation frozen at t ---------
{
  const { ctx, page } = await open(false);
  await page.evaluate(() => document.querySelector('.devbar__handle').click());
  await page.waitForTimeout(400);
  await page.evaluate(() => [...document.querySelectorAll('.devbar button')].find((b) => b.textContent === 'Receipt saved').click());
  await page.waitForSelector('.celebration[data-state="open"]');
  await page.waitForTimeout(50);
  const poses = await page.evaluate(() => {
    const anims = document.querySelector('.celebration').getAnimations({ subtree: true });
    anims.forEach((a) => a.pause());
    const pop = document.querySelector('.celebration__badgePop');
    const body = document.querySelector('.celebration__badgeBody');
    const badge = document.querySelector('.celebration__badge');
    const at = (t) => {
      anims.forEach((a) => { a.currentTime = t; });
      const m = new DOMMatrix(getComputedStyle(badge).transform);
      const b = new DOMMatrix(getComputedStyle(body).transform);
      return {
        t,
        spin: parseFloat(getComputedStyle(pop).rotate) || 0,
        scale: parseFloat(getComputedStyle(pop).scale) || 0,
        x: +m.e.toFixed(1), y: +m.f.toFixed(1), sx: +m.a.toFixed(3), sy: +m.d.toFixed(3),
        bodySx: +b.a.toFixed(3), bodySy: +b.d.toFixed(3),
      };
    };
    const ts = [80, 120, 176, 250, 330, 450, 700, 850, 960, 1180, 1340, 1500];
    return ts.map(at);
  });
  const P = Object.fromEntries(poses.map((p) => [p.t, p]));
  const maxSpin = Math.max(...poses.filter((p) => p.t >= 120 && p.t <= 700).map((p) => p.spin));
  check('badge: spins in from -160°', P[80].spin <= -150, `rotate ${P[80].spin}° at 80ms`);
  check('badge: spin follows through past level, then settles', maxSpin > 5 && Math.abs(P[850].spin) < 3, `peak +${maxSpin.toFixed(1)}°, ${P[850].spin.toFixed(1)}° at 850ms`);
  check('badge: squashes on reaching full size', P[250].bodySx > 1.04 && P[250].bodySy < 0.96, `scale ${P[250].bodySx} × ${P[250].bodySy} at 250ms`);
  check('badge: anticipation — dips before it rises', P[960].y > P[850].y, `y ${P[850].y} → ${P[960].y} (down) at 850 → 960ms`);
  check('badge: rises on an arc (sideways mid-rise)', P[1180].x < -4, `x ${P[1180].x} at 1180ms`);
  check('badge: stretches along the rise', P[1180].sy > P[1180].sx, `scale ${P[1180].sx} × ${P[1180].sy} at 1180ms`);
  check('badge: carries past its slot, squashed', P[1340].y < 0 && P[1340].sx > P[1340].sy, `y ${P[1340].y}, scale ${P[1340].sx} × ${P[1340].sy} at 1340ms`);
  check('badge: at rest in its slot', P[1500].y === 0 && P[1500].x === 0 && P[1500].sx === 1, JSON.stringify(P[1500]));
  await ctx.close();
}

// --- 3. Reduced motion -----------------------------------------------------------------
{
  const { ctx, page } = await open(true);
  await page.evaluate(() => document.querySelector('.devbar__handle').click());
  await page.waitForTimeout(400);
  await page.evaluate(() => [...document.querySelectorAll('.devbar button')].find((b) => b.textContent === 'Receipt saved').click());
  await page.waitForTimeout(1200);
  const r = await page.evaluate(() => ({
    still: document.querySelector('.rays').hasAttribute('data-still'),
    layerAnim: getComputedStyle(document.querySelector('.rays__layer')).animationName,
    confetti: !!window.__confetti && window.__confetti.stats().spawned,
    titleAnim: getComputedStyle(document.querySelector('.celebration__title')).animationName,
  }));
  check('reduced: rays still', r.still && r.layerAnim === 'none', JSON.stringify(r));
  check('reduced: no confetti', !r.confetti, `spawned ${r.confetti || 0}`);
  check('reduced: content plain fade', r.titleAnim === 'celebration-fade', r.titleAnim);
  await ctx.close();
}

await browser.close();
for (const r of results) console.log(`${r.pass ? 'ok  ' : 'FAIL'} ${r.name.padEnd(46)} ${r.detail}`);
const failed = results.filter((r) => !r.pass).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
