/**
 * Queued orders — "Queueing & recalling an order", band `170:8988`.
 *
 * A queued order is a parked sale: the cart exactly as it stood — lines, customer and
 * order discount — set aside so the till can serve someone else, then recalled to
 * finish. It holds the same records the Cart does (lines by product id, never copies),
 * so its items and total are DERIVED from the catalogue, never stored beside it.
 *
 * The store keeps them, not the Cart: they live behind the mock API (`api/pos.ts`),
 * so the Queued orders list loads, can fail, and can be empty like every other list.
 */
import type { Discount } from '../data/catalogue';
import { CUSTOMERS, type Customer } from '../data/customers';
import { productFor, totals, type CartLine } from './cart';

export type QueuedOrder = {
  id: string;
  lines: readonly CartLine[];
  customer: Customer | null;
  orderDiscount?: Discount;
  queuedAt: Date;
};

/** The card's second line: the products in the order they were added. */
export function queuedItemNames(order: QueuedOrder): string[] {
  return order.lines.map((l) => productFor(l).name);
}

/** The same total the Cart showed when it was queued, and will show again on recall. */
export function queuedTotal(order: QueuedOrder): number {
  return totals(order.lines, order.orderDiscount).total;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** The frame's "13:24, 06-03-2026": 24-hour time, then day-month-year. */
export function formatQueuedAt(at: Date): string {
  return `${pad(at.getHours())}:${pad(at.getMinutes())}, ${pad(at.getDate())}-${pad(at.getMonth() + 1)}-${at.getFullYear()}`;
}

/**
 * Demo queue, earlier today relative to when the page loaded, newest first.
 *
 * The frames show five orders with the same three items, total and minute — Peter
 * Obi, Seun Akindele, John Doe and two "Walk-in-customer" (placeholder data, logged
 * in BUILD-PLAN). These are distinct instead, from this store's own catalogue and
 * customers, so each card says something different and every total reconciles: a
 * walk-in, a named customer, one with an order discount, one long enough to truncate.
 */
export function seedQueue(now = new Date()): QueuedOrder[] {
  const ago = (minutes: number) => new Date(now.getTime() - minutes * 60_000);
  const customer = (id: string) => CUSTOMERS.find((c) => c.id === id)!;
  return [
    {
      id: 'q-4', customer: customer('cus-afolabi'), queuedAt: ago(9),
      lines: [
        { productId: 'tops-tee', unitId: 'each', count: 2 },
        { productId: 'btm-jeans', unitId: 'each', count: 1 },
      ],
    },
    {
      id: 'q-3', customer: null, queuedAt: ago(26),
      lines: [
        { productId: 'acc-socks', unitId: 'each', count: 3 },
        { productId: 'acc-cap', unitId: 'each', count: 1 },
        { productId: 'acc-beanie', unitId: 'each', count: 1 },
      ],
    },
    {
      id: 'q-2', customer: customer('cus-nneoma'), queuedAt: ago(71),
      orderDiscount: { kind: 'percent', percent: 10 },
      lines: [
        { productId: 'tops-hoodie', unitId: 'each', count: 1 },
        { productId: 'tops-rainjacket', unitId: 'each', count: 1 },
        { productId: 'bag-tote', unitId: 'each', count: 1 },
        { productId: 'ftw-sneakers', unitId: 'each', count: 1 },
      ],
    },
    {
      id: 'q-1', customer: null, queuedAt: ago(158),
      lines: [{ productId: 'tops-oxford', unitId: 'each', count: 2 }],
    },
  ];
}
