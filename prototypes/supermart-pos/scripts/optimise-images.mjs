/**
 * Product photo pipeline. Reads originals from assets/products-src (gitignored),
 * writes optimised WebP into assets/products (committed).
 *
 * Every rule here is from CLAUDE.md "Assets and load time":
 *  - the real format is sniffed, never trusted from the extension;
 *  - originals are audited on PIXEL DIMENSIONS, not file size;
 *  - resizing targets a SQUARE box with fit:'outside', because object-fit:cover is
 *    driven by the short side — sizing by width alone leaves a 1200x628 source
 *    only 113px tall behind a 216px box;
 *  - output is 3x the largest CSS box the photo is ever drawn into;
 *  - WebP q80, q90 where there is alpha, metadata stripped;
 *  - fidelity is reported as mean absolute pixel error at display size, so a
 *    sizing mistake shows up as a number rather than being eyeballed.
 *
 * Usage: node --experimental-strip-types scripts/optimise-images.mjs --box <css-px>
 *
 * --box is the largest CSS box in the design. It MUST come from a measured frame.
 * Measured: `.productCard__image` renders 160x108 on all 43 cards, and the design's
 * own "Product Image" frame is 160x108 too, so 160 is the long side. The default
 * below is the old placeholder, kept so a run without --box still reports itself
 * as unmeasured rather than silently using a number nobody checked.
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const args = process.argv.slice(2);
const boxArg = args.includes('--box') ? Number(args[args.indexOf('--box') + 1]) : null;
const BOX = boxArg ?? 160;
const SCALE = 3;
const TARGET = BOX * SCALE;

const srcDir = path.join(import.meta.dirname, '..', 'assets', 'products-src');
const outDir = path.join(import.meta.dirname, '..', 'assets', 'products');

if (!fs.existsSync(srcDir)) {
  console.error(`no originals at ${path.relative(process.cwd(), srcDir)} — nothing to do`);
  process.exit(1);
}
fs.mkdirSync(outDir, { recursive: true });

/** Mean absolute pixel error between two images, decoded at display size. */
async function meanAbsError(aBuf, bBuf, box) {
  const decode = (buf) =>
    sharp(buf).resize(box, box, { fit: 'cover' }).removeAlpha().raw().toBuffer();
  const [a, b] = await Promise.all([decode(aBuf), decode(bBuf)]);
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += Math.abs(a[i] - b[i]);
  return sum / a.length / 255;
}

const files = fs.readdirSync(srcDir).filter((f) => !f.startsWith('.'));
const rows = [];

for (const file of files) {
  const srcPath = path.join(srcDir, file);
  const input = fs.readFileSync(srcPath);
  const meta = await sharp(input).metadata();

  const base = file.replace(/\.[^.]+$/, '');
  const outName = `${base}.webp`;
  const quality = meta.hasAlpha ? 90 : 80;

  const output = await sharp(input)
    .resize(TARGET, TARGET, { fit: 'outside', withoutEnlargement: true })
    .webp({ quality })
    .toBuffer();

  fs.writeFileSync(path.join(outDir, outName), output);
  const outMeta = await sharp(output).metadata();
  const mae = await meanAbsError(input, output, BOX);

  rows.push({
    file,
    out: outName,
    realFormat: meta.format,
    extLies: meta.format !== file.split('.').pop().toLowerCase().replace('jpg', 'jpeg'),
    srcDims: `${meta.width}x${meta.height}`,
    srcMP: (meta.width * meta.height) / 1e6,
    outDims: `${outMeta.width}x${outMeta.height}`,
    shortSide: Math.min(outMeta.width, outMeta.height),
    // A source shorter than the target is never enlarged (it would add bytes, not
    // detail), so it ships below 3x. MAE cannot detect that: compared at display
    // size both are equally soft and the error reads near zero. Surfaced separately.
    undersized: Math.min(meta.width, meta.height) < TARGET,
    srcShort: Math.min(meta.width, meta.height),
    srcKB: input.length / 1024,
    outKB: output.length / 1024,
    quality,
    maePct: mae * 100,
  });
}

const pad = (s, n) => String(s).padEnd(n);
console.log(`box ${BOX}px CSS x${SCALE} => ${TARGET}px square target${boxArg ? '' : '   [DEFAULT BOX — not measured from a design]'}`);
console.log('');
console.log(pad('source', 24), pad('fmt', 6), pad('src dims', 12), pad('MP', 6), pad('out dims', 12), pad('short', 6), pad('src KB', 9), pad('out KB', 8), pad('q', 3), 'MAE');
console.log('-'.repeat(110));
let bad = 0;
for (const r of rows) {
  const shortOk = r.shortSide >= TARGET;
  const maeOk = r.maePct < 2;
  if (!shortOk || !maeOk) bad++;
  console.log(
    pad(r.file, 24), pad(r.realFormat + (r.extLies ? '!' : ''), 6), pad(r.srcDims, 12),
    pad(r.srcMP.toFixed(1), 6), pad(r.outDims, 12),
    pad(r.shortSide + (shortOk ? '' : ' X'), 6),
    pad(r.srcKB.toFixed(1), 9), pad(r.outKB.toFixed(1), 8), pad(r.quality, 3),
    `${r.maePct.toFixed(2)}%${maeOk ? '' : ' X'}`,
  );
}
console.log('-'.repeat(110));
const totalSrc = rows.reduce((a, r) => a + r.srcKB, 0);
const totalOut = rows.reduce((a, r) => a + r.outKB, 0);
console.log(`${rows.length} images   ${totalSrc.toFixed(0)}KB -> ${totalOut.toFixed(0)}KB (${(100 - (totalOut / totalSrc) * 100).toFixed(1)}% smaller)`);
const lied = rows.filter((r) => r.extLies);
if (lied.length) console.log(`extension lied about the real format on: ${lied.map((r) => r.file).join(', ')}`);
console.log(`short side >= ${TARGET} on all: ${rows.every((r) => r.shortSide >= TARGET)}`);
const undersized = rows.filter((r) => r.undersized);
if (undersized.length) {
  console.log(`\nSOURCES BELOW THE ${TARGET}px TARGET — re-source these at full size:`);
  for (const r of undersized) console.log(`  ${r.file} short side ${r.srcShort}px < ${TARGET}px target`);
}
console.log(`${bad} image(s) failing the short-side or MAE target, ${undersized.length} undersized`);
process.exit(bad === 0 && undersized.length === 0 ? 0 : 1);
