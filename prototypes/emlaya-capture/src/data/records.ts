/**
 * Demo records — one store, read by every screen that shows a record.
 *
 * The Figma frames' own data does not reconcile (CORRECTIONS.md, "Data"): seven line
 * items summing to ₦4,023,000 under a ₦15,000 amount, five identical "Whole milk" rows,
 * a "Macbook pro M5 Max 2026" on a grocery receipt, a "S" tag, a "Shoprite 16 Aug"
 * attachment on a Fresh Market purchase. What is kept is every value that agrees with
 * the rest: merchant, amount, 16 Aug, 09:00, the two real item rows, the tags and the
 * @mentions. What is derived is said so at the line.
 */

export type LineItem = {
  id: string;
  name: string;
  quantity: number;
  /** Whole naira. Display formatting lives in money.ts. */
  unitPrice: number;
};

export type Evidence = {
  /** The scanned document from the shot. A prototype has one rendition; the product keeps three. */
  src: string;
  pages: number;
  bytes: number;
};

export type PurchaseReceipt = {
  id: string;
  merchant: string;
  /** The document's total, as extracted — not recomputed from items (RP-07). */
  amount: number;
  /** ISO date and 24h time, as extracted. */
  date: string;
  time: string;
  items: LineItem[];
  tags: string[];
  /** @mentions chosen on Review (TAG-06). Saving stores them; it creates no share. */
  sharedWith: string[];
  /**
   * Not a field on any screen in this flow. The milestone card's "top category" needs
   * one, so seed records carry it. Needs design input: where a category comes from.
   */
  category: string;
  evidence: Evidence;
};

/** No image: the seed records' evidence is never shown in this flow. */
const UNSHOWN: Evidence = { src: '', pages: 1, bytes: 0 };

/**
 * What extraction returns for the captured receipt — the draft Review edits. The paper the
 * camera sees is printed from these same fields (receiptDocument.ts), so they agree.
 */
export function extractedDraft(evidence: Evidence = UNSHOWN): PurchaseReceipt {
  return {
    id: 'rcpt-0816-0900',
    merchant: 'Fresh Market Groceries',
    amount: 15000,
    date: '2026-08-16',
    time: '09:00',
    items: [
      // The two rows of 9502:21324 that are not duplicates or placeholders.
      { id: 'li-1', name: 'Whole milk', quantity: 2, unitPrice: 2000 },
      { id: 'li-2', name: 'Peanut butter jelly', quantity: 1, unitPrice: 3000 },
      // Derived from the evidence photo's own lines (CHEDDAR CHEESE, EGGS DOZEN) so the
      // items reach the ₦15,000 amount. Prices are the prototype's, not the photo's.
      { id: 'li-3', name: 'Cheddar cheese', quantity: 1, unitPrice: 5000 },
      { id: 'li-4', name: 'Eggs dozen', quantity: 1, unitPrice: 3000 },
    ],
    // 9502:21533 less "S", a truncated duplicate of "Snacks".
    tags: ['Essentials', 'Organic', 'Snacks', 'Beverages', 'Frozen'],
    sharedWith: ['@shegziebaddest', '@johnson'],
    category: 'Groceries',
    evidence,
  };
}

/**
 * Records already in Emlaya before this capture. Chosen so the milestone card's figures
 * are derived, not typed: one earlier Fresh Market purchase (₦40,000) makes this the
 * "2nd" and "₦55,000 there so far"; Groceries leads the categories.
 */
const seed: PurchaseReceipt[] = [
  {
    id: 'rcpt-0802-1814',
    merchant: 'Fresh Market Groceries',
    amount: 40000,
    date: '2026-08-02',
    time: '18:14',
    items: [],
    tags: ['Essentials'],
    sharedWith: [],
    category: 'Groceries',
    evidence: UNSHOWN,
  },
  {
    id: 'rcpt-0809-1230',
    merchant: 'Chicken Republic',
    amount: 9500,
    date: '2026-08-09',
    time: '12:30',
    items: [],
    tags: [],
    sharedWith: [],
    category: 'Eating out',
    evidence: UNSHOWN,
  },
];

export const records: PurchaseReceipt[] = [...seed];

export function resetRecords(): void {
  records.splice(0, records.length, ...seed);
}

export type Milestone = {
  /** 1-based count of purchases from this merchant, including the one just saved. */
  ordinal: number;
  merchantTotal: number;
  topCategory: string;
};

/** Derived from the store after a save — the celebration reads this, nothing else. */
export function milestoneFor(saved: PurchaseReceipt): Milestone {
  const atMerchant = records.filter((r) => r.merchant === saved.merchant);
  const byCategory = new Map<string, number>();
  for (const r of records) byCategory.set(r.category, (byCategory.get(r.category) ?? 0) + r.amount);
  const topCategory = [...byCategory.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? saved.category;
  return {
    ordinal: atMerchant.length,
    merchantTotal: atMerchant.reduce((sum, r) => sum + r.amount, 0),
    topCategory,
  };
}
