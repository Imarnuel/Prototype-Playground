/**
 * The order being built. One source of truth shared by Sales Point and Cart
 * (root agreement §4) — both screens read these records, neither keeps its own copy.
 *
 * Lines hold a product id and a quantity, never a copy of the product. A price or
 * name duplicated into the cart is a second source that drifts the moment the
 * catalogue changes.
 */
import { PRODUCTS, lineTotalMinor, type Product } from '../data/catalogue';

export type CartLine = { productId: string; qty: number };

export function productFor(line: CartLine): Product {
  const p = PRODUCTS.find((x) => x.id === line.productId);
  if (!p) throw new Error(`cart holds an unknown product: ${line.productId}`);
  return p;
}

export function lineTotal(line: CartLine): number {
  return lineTotalMinor(productFor(line), line.qty);
}

/** Order total in minor units. Exact integer arithmetic, so lines always sum to it. */
export function cartTotal(lines: readonly CartLine[]): number {
  return lines.reduce((sum, l) => sum + lineTotal(l), 0);
}

export function addToCart(lines: readonly CartLine[], product: Product): CartLine[] {
  const existing = lines.find((l) => l.productId === product.id);
  return existing
    ? lines.map((l) => (l.productId === product.id ? { ...l, qty: l.qty + 1 } : l))
    : [...lines, { productId: product.id, qty: 1 }];
}

/** Stepping a line to zero removes it — a zero-quantity line has nothing to show. */
export function setQty(lines: readonly CartLine[], productId: string, qty: number): CartLine[] {
  return qty <= 0
    ? lines.filter((l) => l.productId !== productId)
    : lines.map((l) => (l.productId === productId ? { ...l, qty } : l));
}

export function removeLine(lines: readonly CartLine[], productId: string): CartLine[] {
  return lines.filter((l) => l.productId !== productId);
}
