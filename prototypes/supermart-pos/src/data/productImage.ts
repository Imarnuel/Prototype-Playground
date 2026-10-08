import type { Product } from './catalogue';

/**
 * The one place a product's picture is resolved. Two screens show the same product, so
 * they read the same resolver (root agreement section 4) — the Cart kept asking for
 * `/products/<file>` after the Sales Point stopped, and rendered a broken-image glyph
 * on every line because the fix lived inside ProductCard rather than beside the data.
 *
 * Real photos first. They were requested as `/products/<file>`, which Vite serves only
 * out of a `public/` directory — and there is none; the pipeline writes to
 * `assets/products/`. A glob makes absence a build-time fact rather than a runtime 404:
 * a name with no file is simply not in the map, so the caller falls back without a
 * failed request. The pattern is relative because `import.meta.glob` does not resolve
 * path aliases (CLAUDE.md "Figma -> code").
 */
const PHOTOS = import.meta.glob('../../assets/products/*.webp', {
  eager: true, query: '?url', import: 'default',
}) as Record<string, string>;

/** A product with no photo renders the card's neutral fill — the no-photo state. */
export function productImage(p: Product): string | undefined {
  return p.image ? PHOTOS[`../../assets/products/${p.image}`] : undefined;
}
