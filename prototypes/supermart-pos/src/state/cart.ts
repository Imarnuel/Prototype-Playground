/**
 * The order being built. One source of truth shared by Sales Point and Cart
 * (root agreement §4) — both screens read these records, neither keeps its own copy.
 *
 * Lines hold a product id, never a copy of the product. A price or name duplicated
 * into the cart is a second source that drifts the moment the catalogue changes.
 * All arithmetic is the catalogue's (`orderTotals` and friends); this file only says
 * how a line may change.
 *
 * One line per product. That is a stated limitation, not an oversight: it cannot sell
 * two packs and two singles of the same item, or one damaged unit at a reduced price
 * beside full-price ones. The design never shows either.
 */
import {
  PRODUCTS, lineGrossMinor, maxCount, orderTotals,
  type Discount, type OrderTotals, type PricedLine, type Product, type UnitId,
} from '../data/catalogue';

export type CartLine = {
  productId: string;
  unitId: UnitId;
  /** How many of `unitId` — not single units. */
  count: number;
  /** Price per unit in the line's own unit. Cleared when the unit changes. */
  priceOverrideMinor?: number;
  discount?: Discount;
  note?: string;
};

export function productFor(line: Pick<CartLine, 'productId'>): Product {
  const p = PRODUCTS.find((x) => x.id === line.productId);
  if (!p) throw new Error(`cart holds an unknown product: ${line.productId}`);
  return p;
}

export function priced(line: CartLine): PricedLine {
  return {
    product: productFor(line),
    unitId: line.unitId,
    count: line.count,
    priceOverrideMinor: line.priceOverrideMinor,
    discount: line.discount,
  };
}

/** What a Cart line displays: GROSS, so the lines visibly add up to the Subtotal. */
export function lineGross(line: CartLine): number {
  return lineGrossMinor(priced(line));
}

/** The order discount lives beside the lines, not on any of them: see `orderTotals`. */
export function totals(lines: readonly CartLine[], orderDiscount?: Discount): OrderTotals {
  return orderTotals(lines.map(priced), orderDiscount);
}

/**
 * An amount discount larger than the line is clamped to the line — and the clamp is
 * KEPT. Clamping only at display time would make qty 3 → 1 → 3 quietly bring back a
 * ₦1,000 discount that nobody re-entered.
 */
function reclamp(line: CartLine): CartLine {
  if (line.discount?.kind !== 'amount') return line;
  const gross = lineGross(line);
  return line.discount.minor > gross ? { ...line, discount: { kind: 'amount', minor: gross } } : line;
}

/**
 * One more of the line's current unit. Returns the SAME array when the shelf can't
 * supply it — out of stock, or the line already at its ceiling — so the caller can
 * tell the person why nothing happened instead of silently ignoring the tap.
 */
export function addToCart(lines: readonly CartLine[], product: Product): readonly CartLine[] {
  const existing = lines.find((l) => l.productId === product.id);
  if (!existing) {
    return product.stock >= 1 ? [...lines, { productId: product.id, unitId: 'each', count: 1 }] : lines;
  }
  if (existing.count + 1 > maxCount(product, existing.unitId)) return lines;
  return lines.map((l) => (l === existing ? reclamp({ ...l, count: l.count + 1 }) : l));
}

/** Stepping to zero removes the line; a count above what the shelf holds is capped. */
export function setCount(lines: readonly CartLine[], productId: string, count: number): readonly CartLine[] {
  if (count <= 0) return removeLine(lines, productId);
  return lines.map((l) => {
    if (l.productId !== productId) return l;
    return reclamp({ ...l, count: Math.min(count, maxCount(productFor(l), l.unitId)) });
  });
}

/**
 * Commit from the Quantity sheet. A change of unit clears a price override — it was
 * a price agreed for that pack size, and carrying it to another would invent a price
 * nobody agreed — and re-clamps an amount discount; a percent discount carries over.
 * Judged against the line as it stood when the sheet opened, so trying Each → Pack →
 * Each inside one sheet keeps everything.
 */
export function commitQuantity(
  lines: readonly CartLine[], productId: string, unitId: UnitId, count: number,
): readonly CartLine[] {
  return lines.map((l) => {
    if (l.productId !== productId) return l;
    const capped = Math.max(1, Math.min(count, maxCount(productFor(l), unitId)));
    if (unitId === l.unitId) return reclamp({ ...l, count: capped });
    const { priceOverrideMinor: _dropped, ...rest } = l;
    return reclamp({ ...rest, unitId, count: capped });
  });
}

export type LineEdits = {
  count: number;
  priceOverrideMinor?: number;
  discount?: Discount;
  note?: string;
};

/** Commit from the line-details modal. The unit does not change there. */
export function commitDetails(
  lines: readonly CartLine[], productId: string, edits: LineEdits,
): readonly CartLine[] {
  return lines.map((l) => {
    if (l.productId !== productId) return l;
    const next: CartLine = {
      productId: l.productId,
      unitId: l.unitId,
      count: Math.max(1, Math.min(edits.count, maxCount(productFor(l), l.unitId))),
    };
    if (edits.priceOverrideMinor !== undefined) next.priceOverrideMinor = edits.priceOverrideMinor;
    if (edits.discount) next.discount = edits.discount;
    if (edits.note) next.note = edits.note;
    return reclamp(next);
  });
}

export function removeLine(lines: readonly CartLine[], productId: string): readonly CartLine[] {
  return lines.filter((l) => l.productId !== productId);
}
