/**
 * Sales point endpoints. Everything goes through the shared mock API so latency,
 * failure injection and the dev-toolbar overrides stay in one place
 * (root agreement §4) — nothing here calls setTimeout.
 */
import { request } from '@playground/shared';
import { CATEGORY_ORDER, PRODUCTS, type Category, type Product } from '../data/catalogue';

export type ProductFilter = Category | 'All';

/**
 * "All" takes one product from each category in turn, so the grid opens on a mix
 * rather than four tops in a row (the designer's request). Derived from the
 * catalogue's own order, so it stays mixed when the products change.
 */
const MIXED: readonly Product[] = (() => {
  const queues = CATEGORY_ORDER.map((c) => PRODUCTS.filter((p) => p.category === c));
  const out: Product[] = [];
  for (let round = 0; out.length < PRODUCTS.length; round++) {
    for (const q of queues) if (q[round]) out.push(q[round]);
  }
  return out;
})();

/** The Sales Point grid. Fails 0% by default; the dev toolbar forces failures. */
export function fetchProducts(filter: ProductFilter): Promise<readonly Product[]> {
  return request('products', () =>
    filter === 'All' ? MIXED : PRODUCTS.filter((p) => p.category === filter),
  );
}
