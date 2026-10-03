/**
 * Sales point endpoints. Everything goes through the shared mock API so latency,
 * failure injection and the dev-toolbar overrides stay in one place
 * (root agreement §4) — nothing here calls setTimeout.
 */
import { request } from '@playground/shared';
import { PRODUCTS, type Category, type Product } from '../data/catalogue';

export type ProductFilter = Category | 'All';

/** The Sales Point grid. Fails 0% by default; the dev toolbar forces failures. */
export function fetchProducts(filter: ProductFilter): Promise<readonly Product[]> {
  return request('products', () =>
    filter === 'All' ? PRODUCTS : PRODUCTS.filter((p) => p.category === filter),
  );
}
