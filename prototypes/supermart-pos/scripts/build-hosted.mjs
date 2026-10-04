/**
 * Builds a publish-ready bundle for the hosted preview.
 *
 * Three things differ from a plain `npm run build`:
 *   - `--base ./` so assets resolve from whatever path the host serves the page at,
 *     rather than the site root;
 *   - VITE_SHOWCASE=1 so the dev toolbar is reachable, because a hosted page has no
 *     address bar to append `?dev=1` to. The toolbar stays off by default everywhere
 *     else;
 *   - index.html is reduced to a BODY FRAGMENT. The artifact host wraps the page it
 *     is given in its own document skeleton, so handing it a complete document nests
 *     one <html> inside another. Browsers recover from that, but it is invalid.
 *
 * Usage: node scripts/build-hosted.mjs
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.join(import.meta.dirname, '..');
execFileSync('npx', ['vite', 'build', '--base', './'], {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, VITE_SHOWCASE: '1' },
});

const indexPath = path.join(root, 'dist', 'index.html');
const html = fs.readFileSync(indexPath, 'utf8');

// Keep the stylesheet and module script from <head> and the mount point from <body>;
// drop the document scaffolding the host supplies.
const head = html.match(/<head>([\s\S]*?)<\/head>/)?.[1] ?? '';
const body = html.match(/<body>([\s\S]*?)<\/body>/)?.[1] ?? '';
const keep = [...head.matchAll(/<(?:link|script)\b[^>]*>(?:<\/script>)?/g)].map((m) => m[0])
  .filter((tag) => /href=|src=/.test(tag));

if (keep.length === 0) throw new Error('no stylesheet or script found in the built index.html');

const fragment = `${keep.join('\n')}\n${body.trim()}\n`;
fs.writeFileSync(indexPath, fragment);

const files = fs.readdirSync(path.join(root, 'dist', 'assets')).sort();
console.log(`\nindex.html reduced to a ${fragment.length}-byte fragment`);
console.log(`${files.length} asset file(s) to publish alongside it:`);
files.forEach((f) => console.log(`  assets/${f}`));
