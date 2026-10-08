/**
 * Scanning, band `214:26054`: what the camera reads, and what that read matches.
 *
 * The camera is simulated (the designer's call): the cashier "holds up" an item from
 * a fixed sequence, and the viewfinder draws it from the catalogue — a label carrying
 * the product's real EAN-13, or a garment tag carrying its brand and name — so what
 * is scanned is always what gets added.
 */
import { PRODUCTS, type Product } from '../data/catalogue';

/** What is in front of the camera. `productId` is absent for an item the store does
    not stock: a barcode or a tag that matches nothing. */
export type ScanTarget =
  | { kind: 'barcode'; code: string; productId?: string }
  | { kind: 'text'; lines: readonly string[]; productId?: string };

export const barcodeOf = (p: Product): ScanTarget => ({ kind: 'barcode', code: p.barcode, productId: p.id });

/**
 * A hang tag: the brand in large print, the product's name under it. Real tags
 * print both, and OCR reads both; the brand line is what the frame's "Detected
 * text" badge shows (`88:19909`: "Northline").
 */
export const tagOf = (p: Product): ScanTarget => ({ kind: 'text', lines: [p.brand, p.name], productId: p.id });

/**
 * What each tap on the viewfinder holds up, in turn. It opens on the frames' own two
 * scans — Crew Socks by barcode (`88:19938`), then a Northline tag (`88:19858`) —
 * and cycles, so every product can be scanned in one demo.
 */
const byId = (id: string) => PRODUCTS.find((p) => p.id === id)!;
export const SCAN_SEQUENCE: readonly ScanTarget[] = [
  barcodeOf(byId('acc-socks')),
  tagOf(byId('tops-oxford')),
  barcodeOf(byId('tops-tee')),
  barcodeOf(byId('btm-jeans')),
  tagOf(byId('acc-beanie')),
  barcodeOf(byId('acc-cap')),
  barcodeOf(byId('bag-tote')),
  tagOf(byId('ftw-sneakers')),
  barcodeOf(byId('tops-hoodie')),
  tagOf(byId('tops-rainjacket')),
];

/** Not stocked: a valid EAN-13 under the store's own 615 prefix that no product
    carries, and a tag from a brand the store does not sell. Dev toolbar only. */
export const UNKNOWN_BARCODE: ScanTarget = { kind: 'barcode', code: '6153000000991' };
export const UNKNOWN_TAG: ScanTarget = { kind: 'text', lines: ['Brightwear', 'Linen Overshirt'] };

/* --- EAN-13 ----------------------------------------------------------------------
   The bars are encoded, not drawn freehand: 3 guard + 6 left digits + 5 centre guard
   + 6 right digits + 3 guard = 95 modules. The first digit is carried by the parity
   pattern of the left six. */
const L = ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011'];
const R = L.map((c) => [...c].map((b) => (b === '1' ? '0' : '1')).join(''));
const G = R.map((c) => [...c].reverse().join(''));
const PARITY = ['LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG', 'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL'];

export function ean13Modules(code: string): string {
  if (!/^\d{13}$/.test(code)) throw new Error(`not an EAN-13: ${code}`);
  const d = [...code].map(Number);
  const parity = PARITY[d[0]];
  const left = d.slice(1, 7).map((n, i) => (parity[i] === 'L' ? L : G)[n]).join('');
  const right = d.slice(7).map((n) => R[n]).join('');
  return `101${left}01010${right}101`;
}

/* --- Text ------------------------------------------------------------------------ */
export type TextMatch = { product: Product; best: boolean };
export type TextResult = { detected: string; matches: readonly TextMatch[] };

const words = (s: string) => s.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 3);

/**
 * Ranks products against what was read. A brand hit scores 1, each word of the
 * product's name 2 — so a Northline tag matches all three Northline products, and the
 * one whose name is also on the tag ranks first. "Best match" only marks a clear
 * winner; a tie marks nothing rather than guessing.
 */
export function matchText(lines: readonly string[], products: readonly Product[] = PRODUCTS): TextResult {
  const read = new Set(lines.flatMap(words));
  const scored = products
    .map((product) => {
      const brand = words(product.brand).some((w) => read.has(w)) ? 1 : 0;
      const name = words(product.name).filter((w) => read.has(w)).length * 2;
      return { product, score: brand + name };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);
  const clear = scored.length > 1 && scored[0].score > scored[1].score;
  return {
    detected: lines[0] ?? '',
    matches: scored.map((s, i) => ({ product: s.product, best: clear && i === 0 })),
  };
}
