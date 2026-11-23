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
 * `--loader a|b` builds one of the two processing-loader prototypes into dist/loader-<x>/,
 * opening on that loader and titled for it, so each has its own hosted page.
 *
 * Usage: node scripts/build-hosted.mjs [--loader a|b]
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.join(import.meta.dirname, '..');
const flag = process.argv.indexOf('--loader');
const loader = flag === -1 ? null : process.argv[flag + 1];
if (loader !== null && loader !== 'a' && loader !== 'b') throw new Error('--loader takes a or b');
const outDir = loader ? path.join('dist', `loader-${loader}`) : 'dist';
const LOADER_TITLE = { a: 'Emlaya Loader A', b: 'Emlaya Loader B' };

execFileSync('npx', ['vite', 'build', '--base', './', '--outDir', outDir, '--emptyOutDir'], {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, VITE_SHOWCASE: '1', ...(loader ? { VITE_LOADER: loader } : {}) },
});

const indexPath = path.join(root, outDir, 'index.html');
const html = fs.readFileSync(indexPath, 'utf8');

// Keep the stylesheet and module script from <head> and the mount point from <body>;
// drop the document scaffolding the host supplies.
const head = html.match(/<head>([\s\S]*?)<\/head>/)?.[1] ?? '';
const body = html.match(/<body>([\s\S]*?)<\/body>/)?.[1] ?? '';
const keep = [...head.matchAll(/<(?:link|script)\b[^>]*>(?:<\/script>)?/g)].map((m) => m[0])
  .filter((tag) => /href=|src=/.test(tag));

if (keep.length === 0) throw new Error('no stylesheet or script found in the built index.html');

// The host reads the artifact's name from a <title> in the first 8KB.
const title = loader ? `<title>${LOADER_TITLE[loader]}</title>` : head.match(/<title>[\s\S]*?<\/title>/)?.[0] ?? '';
const fragment = `${title}\n${keep.join('\n')}\n${body.trim()}\n`;
fs.writeFileSync(indexPath, fragment);

const files = fs.readdirSync(path.join(root, outDir, 'assets')).sort();
console.log(`\nindex.html reduced to a ${fragment.length}-byte fragment`);
console.log(`${files.length} asset file(s) to publish alongside it:`);
files.forEach((f) => console.log(`  assets/${f}`));
