// check:tokens — fails if a literal value appears outside the token files.
// Literals: hex colours, rgb()/hsl(), px, rem, ms, s, cubic-bezier(), linear() curves.
// Allowed: 0, 100%, the token files themselves, and SVG geometry inside an asset.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('../src/', import.meta.url).pathname;
const TOKEN_FILES = new Set(['tokens/tokens.css', 'tokens/tokens.gaps.css']);
const RULES = [
  ['hex colour', /#[0-9a-fA-F]{3,8}\b/g],
  ['rgb/hsl', /\b(?:rgba?|hsla?)\(/g],
  ['px', /(?<![\w-])-?\d*\.?\d+px\b/g],
  ['rem', /(?<![\w-])-?\d*\.?\d+rem\b/g],
  ['ms', /(?<![\w-])\d*\.?\d+ms\b/g],
  ['seconds', /(?<![\w-])\d*\.?\d+s\b(?![\w-])/g],
  ['cubic-bezier', /cubic-bezier\(/g],
  ['linear() curve', /linear\(\s*0/g],
];

function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const files = walk(root).filter((f) => /\.(css|tsx?|mjs)$/.test(f));
const violations = [];
for (const file of files) {
  const rel = relative(root, file);
  if (TOKEN_FILES.has(rel)) continue;
  const lines = readFileSync(file, 'utf8').split('\n');
  let inBlock = false;
  lines.forEach((line, i) => {
    // Comments explain values; they do not set them.
    let code = line;
    if (inBlock) {
      const end = code.indexOf('*/');
      if (end === -1) return;
      code = code.slice(end + 2);
      inBlock = false;
    }
    code = code.replace(/\/\*.*?\*\//g, '');
    const open = code.indexOf('/*');
    if (open !== -1) { code = code.slice(0, open); inBlock = true; }
    code = code.replace(/(^|\s)\/\/.*$/, '$1').replace(/^\s*\*.*$/, '');
    // An SVG path's d="" is the asset's own geometry, transcribed (CheckBadge).
    code = code.replace(/\bd="[^"]*"/g, '').replace(/\bpoints="[^"]*"/g, '');
    for (const [name, re] of RULES) {
      for (const m of code.matchAll(re)) violations.push(`${rel}:${i + 1}  ${name}  "${m[0]}"  ${line.trim()}`);
    }
  });
}

if (violations.length) {
  console.error(violations.join('\n'));
  console.error(`\ncheck:tokens — ${violations.length} literal(s) outside the token files.`);
  process.exit(1);
}
console.log(`check:tokens — 0 violations in ${files.length - TOKEN_FILES.size} files.`);
