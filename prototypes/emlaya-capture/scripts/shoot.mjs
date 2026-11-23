// Walks the flow in the 402x874 Figma-frame harness and screenshots each screen.
// Usage: node scripts/shoot.mjs [baseUrl] [outDir]
import { createRequire } from 'node:module';
// Playwright is pre-installed globally (resolvable by require, not by ESM import).
const { chromium } = createRequire(import.meta.url)('playwright');
import { mkdirSync } from 'node:fs';

const base = process.argv[2] ?? 'http://localhost:4180';
const out = process.argv[3] ?? 'verify/shots';
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 900, height: 1000 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await page.goto(`${base}/?dev=1&frame=figma`);
await page.waitForTimeout(800);
const screen = page.locator('[data-testid="device-screen"]');
const click = (sel) => page.evaluate((s) => document.querySelector(s).click(), sel);
const shot = async (name) => screen.screenshot({ path: `${out}/${name}.png`, animations: 'allow' });

await shot('1-camera');
await click('button[aria-label="Take photo"]');
await page.waitForTimeout(700);
await shot('2-captured');
await click('.camera__continue');
await page.waitForTimeout(1200);
await shot('3-processing');
await page.waitForSelector('.review[data-status="ready"]', { timeout: 15000 });
await page.waitForTimeout(900);
await shot('4-review');
await click('.review__dock .button');
await page.waitForSelector('.celebration[data-state="open"]', { timeout: 8000 });
await page.waitForTimeout(5600);
await shot('5-saved');
console.log(JSON.stringify({ errors }, null, 1));
await browser.close();
