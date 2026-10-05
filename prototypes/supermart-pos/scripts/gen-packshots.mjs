/**
 * Generates one placeholder packshot per product, into assets/packshots/<id>.svg.
 *
 * WHY THESE EXIST AT ALL
 *
 * The Figma file cannot supply product photography. Counted across its 90 frames:
 * 354 image fills, 10 distinct images, of which four are grid photos reused 109 /
 * 61 / 60 / 59 times — and all four are real-brand stock (Fanta, Coca-Cola, Sprite)
 * under cards that every one of them labels "Fanta Orange 50cl". That placeholder
 * set is exactly what this study replaced, so it is not a source.
 *
 * Nor is a stock library: the catalogue's seven brands are invented, so no photo of
 * a Freshvale product exists anywhere, and 43 shots from 43 photographers would
 * break a grid whose whole job is to read as one system.
 *
 * So these are drawn, from the catalogue, and they are honest about being drawn.
 * They are NOT photography and must not be presented as such — they are the
 * designed stand-in that lets every other state of the grid be demoed truthfully.
 * Drop real photos into assets/products/ and ProductCard prefers them per product;
 * no packshot has to be deleted first.
 *
 * NOT DESIGN VALUES. Every colour below is invented for this placeholder system.
 * There is no Figma source for packaging colour — the design's packaging is
 * photographed, not specified — so none of this belongs in tokens.ts, and nothing
 * here should be mistaken for a token (root agreement section 2: never guess a
 * value; these are declared rather than guessed at a value that exists).
 *
 * Usage: npm run images:packshots
 */
import fs from 'node:fs';
import path from 'node:path';
import { PRODUCTS } from '../src/data/catalogue.ts';

const OUT = path.join(import.meta.dirname, '..', 'assets', 'packshots');

/** 3x the measured 160x108 CSS box, per CLAUDE.md "Assets and load time". */
const W = 480;
const H = 324;

/* The tile is composed as a studio shot, not a flat sticker, because the card's
   scrim is the design's own value and expects a photograph: transparent to 50% of
   the tile, 40% black at 64.6%, 80% at the bottom. Over flat grey that gradient
   reads as a slab of fog; over a lit backdrop with the product standing in it, it
   reads as the lighting falling off, which is what it does over the design's own
   photographs. So each tile gets a tinted backdrop, a soft key light behind the
   product, and a product large enough to fill the frame. */
const GROUND_TOP = (h) => hsl(h, 16, 95);
const GROUND_BOTTOM = (h) => hsl(h, 20, 86);

/* Category sets the hue, brand shifts it. Together they keep a category readable
   down a scrolling grid while stopping twelve beverages from looking identical. */
const CATEGORY_HUE = {
  'Beverages': 214,
  'Snacks & Confectionery': 28,
  'Breakfast': 42,
  'Noodles & Pasta': 14,
  'Cooking & Baking': 90,
  'Canned & Jarred': 158,
  'Household & Cleaning': 192,
  'Personal Care': 268,
  'Baby': 330,
};
const BRAND_SHIFT = { Zivra: -14, Freshvale: 0, Bluewell: 11, Koloma: -7, Palmrise: 18, Verdane: 5, 'Tiny Steps': -20 };

const hsl = (h, s, l) => `hsl(${((h % 360) + 360) % 360} ${s}% ${l}%)`;

/* Category and brand alone are not enough: four 50cl PET beverages from one brand
   collapse to one identical tile, and a grid of identical tiles is the exact failure
   this study removed from the design ("Fanta Orange 50cl" under every photo). A
   stable hash of the product id varies hue, body width and label band on top, so all
   43 differ while a category still reads as a family down a scroll. Hashed, not
   random, so regenerating does not reshuffle the grid. */
function hash(id) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) { h ^= id.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0);
}

/**
 * Vessel comes from the size string where it names one — 'Tin', 'Can', 'Carton',
 * 'Jar', 'Bottle', 'PET', '-pack', 'bags', 'wipes' are all explicit in the
 * catalogue — and from the category only where it does not.
 */
function vesselFor(p) {
  const s = p.size;
  if (/Tin\b/.test(s)) return 'tin';
  if (/Can\b/.test(s)) return 'can';
  if (/Carton\b/.test(s)) return 'carton';
  if (/Jar\b/.test(s)) return 'jar';
  if (/Bottle\b|PET\b/.test(s)) return 'bottle';
  if (/-pack\b|\bbags\b|\bwipes\b/.test(s)) return 'pack';
  if (/^\d+(\.\d+)?(L|cl|ml)$/.test(s)) return 'bottle';
  if (p.category === 'Personal Care' && /^1[0-9]{2}g$/.test(s)) return 'tube';
  if (p.category === 'Snacks & Confectionery') return 'pouch';
  if (p.category === 'Noodles & Pasta' && /^\d+g$/.test(s) && Number(s.replace('g', '')) < 100) return 'pouch';
  return 'box';
}

/* Composed for the card's scrim, which is the design's own value: transparent to
   50% of the tile, 40% black at 64.6%, 80% at the bottom. A vessel standing on the
   floor of the tile loses its lower half to that gradient. So everything stands on
   y=204 of 324 — inside the transparent band — and the bottom third is ground that
   is meant to go dark, which is how the design's own photographs sit under it.

   Centred on x=240. Proportions differ on purpose: at 160x108 the silhouette is the
   only thing the eye resolves, so a tin and a carton differ in outline, not colour. */
const VESSELS = {
  bottle: (c, w) => `
    <path d="M${240 - w} 204V74c0-18 11-25 15-34l7-24h${2 * w - 44}l7 24c4 9 15 16 15 34v130a14 14 0 0 1-14 14H${240 - w + 14}a14 14 0 0 1-14-14Z" fill="${c.body}"/>
    <rect x="218" y="4" width="44" height="34" rx="6" fill="${c.cap}"/>
    <rect x="${240 - w}" y="${c.bandY}" width="${2 * w}" height="${c.bandH}" fill="${c.label}"/>
    <rect x="${240 - w + 11}" y="78" width="13" height="118" rx="6.5" fill="#ffffff" opacity="0.26"/>`,
  can: (c, w) => `
    <rect x="${240 - w}" y="30" width="${2 * w}" height="174" rx="15" fill="${c.body}"/>
    <ellipse cx="240" cy="32" rx="${w}" ry="11" fill="${c.cap}"/>
    <rect x="${240 - w}" y="${c.bandY}" width="${2 * w}" height="${c.bandH}" fill="${c.label}"/>
    <rect x="${240 - w + 12}" y="44" width="14" height="146" rx="7" fill="#ffffff" opacity="0.28"/>`,
  tin: (c, w) => `
    <rect x="${240 - w}" y="56" width="${2 * w}" height="148" rx="10" fill="${c.body}"/>
    <ellipse cx="240" cy="58" rx="${w}" ry="13" fill="${c.cap}"/>
    <rect x="${240 - w}" y="${c.bandY}" width="${2 * w}" height="${c.bandH}" fill="${c.label}"/>
    <rect x="${240 - w + 13}" y="70" width="15" height="122" rx="7.5" fill="#ffffff" opacity="0.28"/>`,
  carton: (c, w) => `
    <path d="M${240 - w} 204V58l${w} -46 ${w} 46v146Z" fill="${c.body}"/>
    <path d="M${240 - w} 58l${w} -46 ${w} 46-${w} 20Z" fill="${c.cap}"/>
    <rect x="${240 - w}" y="${c.bandY}" width="${2 * w}" height="${c.bandH}" fill="${c.label}"/>
    <rect x="${240 - w + 13}" y="76" width="14" height="118" rx="7" fill="#ffffff" opacity="0.22"/>`,
  jar: (c, w) => `
    <path d="M${240 - w} 204V92c0-20 13-28 13-28h${2 * w - 26}s13 8 13 28v112a14 14 0 0 1-14 14H${240 - w + 14}a14 14 0 0 1-14-14Z" fill="${c.body}"/>
    <rect x="${240 - w + 4}" y="26" width="${2 * w - 8}" height="38" rx="8" fill="${c.cap}"/>
    <rect x="${240 - w}" y="${c.bandY}" width="${2 * w}" height="${c.bandH}" fill="${c.label}"/>
    <rect x="${240 - w + 14}" y="84" width="14" height="108" rx="7" fill="#ffffff" opacity="0.24"/>`,
  box: (c, w) => `
    <rect x="${240 - w}" y="34" width="${2 * w}" height="170" rx="6" fill="${c.body}"/>
    <path d="M${240 - w} 34h${2 * w}l-18-18H${240 - w + 18}Z" fill="${c.cap}"/>
    <rect x="${240 - w}" y="${c.bandY}" width="${2 * w}" height="${c.bandH}" fill="${c.label}"/>
    <rect x="${240 - w + 14}" y="48" width="15" height="142" rx="7.5" fill="#ffffff" opacity="0.22"/>`,
  pouch: (c, w) => `
    <path d="M${240 - w} 58c0-9 7-13 15-13h${2 * w - 30}c8 0 15 4 15 13v132c0 9-7 14-15 14h${-(2 * w - 30)}c-8 0-15-5-15-14Z" fill="${c.body}"/>
    <path d="M${240 - w} 58l13-28h${2 * w - 26}l13 28Z" fill="${c.cap}"/>
    <rect x="${240 - w}" y="${c.bandY}" width="${2 * w}" height="${c.bandH}" fill="${c.label}"/>
    <rect x="${240 - w + 13}" y="72" width="14" height="112" rx="7" fill="#ffffff" opacity="0.24"/>`,
  tube: (c, w) => `
    <path d="M${240 - w} 204V80c0-15 7-23 7-35V34h${2 * w - 14}v11c0 12 7 20 7 35v124a14 14 0 0 1-14 14h${-(2 * w - 28)}a14 14 0 0 1-14-14Z" fill="${c.body}"/>
    <rect x="220" y="4" width="40" height="32" rx="5" fill="${c.cap}"/>
    <rect x="${240 - w}" y="${c.bandY}" width="${2 * w}" height="${c.bandH}" fill="${c.label}"/>
    <rect x="${240 - w + 11}" y="92" width="13" height="100" rx="6.5" fill="#ffffff" opacity="0.24"/>`,
  pack: (c, w) => `
    <rect x="${240 - w}" y="62" width="${2 * w}" height="142" rx="8" fill="${c.body}"/>
    <rect x="${240 - w}" y="62" width="${2 * w}" height="28" rx="8" fill="${c.cap}"/>
    <rect x="${240 - w}" y="${c.bandY}" width="${2 * w}" height="${c.bandH}" fill="${c.label}"/>
    <rect x="${240 - w + 15}" y="100" width="15" height="88" rx="7.5" fill="#ffffff" opacity="0.22"/>
    <rect x="236" y="62" width="8" height="142" fill="#ffffff" opacity="0.18"/>`,
};

/* Half-width of each vessel at its base variation, before the per-product jitter. */
const BASE_HALF_WIDTH = {
  bottle: 46, can: 50, tin: 62, carton: 56, jar: 60, box: 70, pouch: 64, tube: 42, pack: 76,
};

function packshot(p) {
  const h = hash(p.id);
  const vessel = vesselFor(p);
  const hue = CATEGORY_HUE[p.category] + (BRAND_SHIFT[p.brand] ?? 0) + ((h % 21) - 10);
  const half = BASE_HALF_WIDTH[vessel] + ((h >> 5) % 9) - 4;
  const bandH = 44 + ((h >> 9) % 4) * 9;
  const bandY = 112 + ((h >> 13) % 5) * 7;
  const c = {
    body: hsl(hue, 50 + ((h >> 17) % 3) * 6, 50 + ((h >> 19) % 3) * 5),
    cap: hsl(hue, 46, 36),
    label: hsl(hue, 28, 88),
    bandH, bandY,
  };
  /* Drawn at a baseline of 204 and then scaled about it, so the geometry above stays
     readable while the product fills the frame the way a packshot photograph does. */
  const SCALE = 1.46;
  const BASELINE = 298;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="presentation">
<defs>
<linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="${GROUND_TOP(hue)}"/>
<stop offset="1" stop-color="${GROUND_BOTTOM(hue)}"/>
</linearGradient>
<radialGradient id="k" cx="0.5" cy="0.42" r="0.62">
<stop offset="0" stop-color="#ffffff" stop-opacity="0.85"/>
<stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
</radialGradient>
</defs>
<rect width="${W}" height="${H}" fill="url(#g)"/>
<rect width="${W}" height="${H}" fill="url(#k)"/>
<g transform="translate(240 ${BASELINE}) scale(${SCALE}) translate(-240 -204)">
<ellipse cx="240" cy="206" rx="${half + 30}" ry="12" fill="#0c0e18" opacity="0.1"/>
${VESSELS[vessel](c, half).trim()}
</g>
</svg>
`;
}

fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) if (f.endsWith('.svg')) fs.unlinkSync(path.join(OUT, f));

/* `image: null` in the catalogue means this product has no picture, and that is a
   state the grid has to be able to demo (the study's "States deliberately reachable"
   table, root agreement section 6). A placeholder system that overrode it would make
   the no-photo fallback unreachable, so the generator respects it and skips. */
const skipped = PRODUCTS.filter((p) => p.image === null);

const counts = {};
for (const p of PRODUCTS) {
  if (p.image === null) continue;
  const v = vesselFor(p);
  counts[v] = (counts[v] ?? 0) + 1;
  fs.writeFileSync(path.join(OUT, `${p.id}.svg`), packshot(p));
}

const bytes = fs.readdirSync(OUT).reduce((n, f) => n + fs.statSync(path.join(OUT, f)).size, 0);
console.log(`${PRODUCTS.length - skipped.length} packshots written to assets/packshots at ${W}x${H}`);
console.log(`skipped ${skipped.length} with image:null, so the no-photo state stays reachable: ${skipped.map((p) => p.id).join(', ') || 'none'}`);
console.log('vessels:', Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(', '));
const n = PRODUCTS.length - skipped.length;
console.log(`total ${(bytes / 1024).toFixed(1)}kB, mean ${Math.round(bytes / n)}B`);
