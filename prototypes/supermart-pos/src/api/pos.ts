/**
 * Sales point endpoints. Everything goes through the shared mock API so latency,
 * failure injection and the dev-toolbar overrides stay in one place
 * (root agreement §4) — nothing here calls setTimeout.
 */
import { request } from '@playground/shared';
import { CATEGORY_ORDER, PRODUCTS, type Category, type Product } from '../data/catalogue';
import { buildReceipt, type Receipt } from '../state/sale';
import { seedQueue, type QueuedOrder } from '../state/queue';

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

/**
 * Takes payment. Never fails on its own; the dev toolbar forces a failure. The
 * receipt is built inside the request, so a failed payment never produces one.
 *
 * A fixed 300ms, not the shared 280-620 window: the designer found the wait "too
 * long", and a confirmation that lands at the same moment every time demos the same
 * way every time. The dev toolbar's latency scale still applies.
 */
const PAY_LATENCY_MS = 300;
export function submitPayment(sale: Parameters<typeof buildReceipt>[0]): Promise<Receipt> {
  return request('pay', () => buildReceipt(sale), { latency: PAY_LATENCY_MS });
}

/* --- Queued orders (band `170:8988`) ----------------------------------------------
   The store's parked sales. Module state stands in for the server: every read and
   write goes through `request`, so the list has latency, a forced failure, and a
   failed write never lands (`produce` only runs on success). */
let queue: QueuedOrder[] = seedQueue();
let queueSeq = queue.length;

export type NewQueuedOrder = Omit<QueuedOrder, 'id' | 'queuedAt'>;

const park = (order: NewQueuedOrder, at: Date): QueuedOrder => {
  queueSeq += 1;
  const q = { ...order, id: `q-${queueSeq}`, queuedAt: at };
  queue = [q, ...queue];
  return q;
};

/** Newest first. */
export function fetchQueue(): Promise<readonly QueuedOrder[]> {
  return request('queue', () => [...queue]);
}

export function queueOrder(order: NewQueuedOrder): Promise<QueuedOrder> {
  return request('queue/add', () => park(order, new Date()));
}

/**
 * Takes an order out of the queue to finish it. With `current` — the cart already
 * holds a sale — that sale is queued in the same request (the designer's call), so a
 * failure leaves both exactly where they were.
 */
export function recallQueued(id: string, current?: NewQueuedOrder): Promise<{ recalled: QueuedOrder; parked?: QueuedOrder }> {
  return request('queue/recall', () => {
    const recalled = queue.find((q) => q.id === id);
    if (!recalled) throw new Error(`no queued order ${id}`);
    queue = queue.filter((q) => q.id !== id);
    return { recalled, parked: current ? park(current, new Date()) : undefined };
  });
}

export function deleteQueued(id: string): Promise<void> {
  return request('queue/delete', () => { queue = queue.filter((q) => q.id !== id); });
}

/** Undo for a delete: back in its own place, which is its time. */
export function restoreQueued(order: QueuedOrder): Promise<void> {
  return request('queue/restore', () => {
    queue = [...queue.filter((q) => q.id !== order.id), order]
      .sort((a, b) => b.queuedAt.getTime() - a.queuedAt.getTime());
  });
}

/** Dev toolbar only: put the queue in a demo state without waiting on anything. */
export function setQueueForDemo(state: 'seeded' | 'empty'): void {
  queue = state === 'seeded' ? seedQueue() : [];
}
