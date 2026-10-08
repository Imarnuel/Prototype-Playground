/**
 * A completed sale and its receipt. Every figure comes from the same records the
 * Cart and Checkout show — `totals`, `lineGross`, the line's own discount — so the
 * receipt cannot disagree with the screen the cashier just read. The frame's own
 * numbers do not reconcile (BUILD-PLAN), so none of them is copied.
 */
import {
  formatPrice, lineDiscountMinor, tenderFor, unitFor, unitPriceMinor,
  type Discount,
} from '../data/catalogue';
import { bankAccount, methodLabel, type AccountMethod } from '../data/payments';
import { STORE } from '../data/store';
import type { Customer } from '../data/customers';
import { lineGross, priced, productFor, totals, type CartLine } from './cart';

export type Tender =
  | { method: 'cash'; tenderedMinor: number }
  | { method: AccountMethod; bankId: string; tenderedMinor: number };

export type ReceiptLine = { title: string; unitPrice: string; amount: string; note?: string; discount?: string };

export type Receipt = {
  number: string;
  date: string;
  customer: string;
  salesPerson: string;
  totalMinor: number;
  lines: readonly ReceiptLine[];
  salesValue: string;
  vat: string;
  discount: string;
  total: string;
  /** "Cash" or "Bank transfer · Access bank": what the total was paid by. */
  paidBy: string;
  tendered: string;
  balance: string;
};

const pad = (n: number, w = 2) => String(n).padStart(w, '0');

/** "13-03-2024 (11:22:58)", the frame's own format. */
export function formatReceiptDate(at: Date): string {
  return `${pad(at.getDate())}-${pad(at.getMonth() + 1)}-${at.getFullYear()} (${pad(at.getHours())}:${pad(at.getMinutes())}:${pad(at.getSeconds())})`;
}

/** "#S" then the date and a four-digit sequence for the day: #S202610080001. */
export function receiptNumber(at: Date, sequence: number): string {
  return `#S${at.getFullYear()}${pad(at.getMonth() + 1)}${pad(at.getDate())}${pad(sequence, 4)}`;
}

export function buildReceipt(args: {
  lines: readonly CartLine[];
  orderDiscount?: Discount;
  customer: Customer | null;
  tender: Tender;
  at: Date;
  sequence: number;
}): Receipt {
  const { lines, orderDiscount, customer, tender, at, sequence } = args;
  const t = totals(lines, orderDiscount);
  const result = tenderFor(tender.method, t.total, tender.tenderedMinor);
  if (!result.ok) throw new Error(`a sale cannot complete on a ${result.reason} tender`);
  return {
    number: receiptNumber(at, sequence),
    date: formatReceiptDate(at),
    customer: customer?.name ?? 'Walk-in Customer',
    salesPerson: STORE.salesPerson,
    totalMinor: t.total,
    lines: lines.map((line) => {
      const product = productFor(line);
      const unit = unitFor(product, line.unitId);
      const discount = lineDiscountMinor(priced(line));
      // "4 Bigi Pineapple @ ₦500", the frame's form; a pack line names its unit.
      const count = line.unitId === 'each' ? `${line.count}` : `${line.count} ${unit.abbrev}`;
      return {
        title: `${count} ${product.name}`,
        unitPrice: formatPrice(unitPriceMinor({ product, unitId: line.unitId, priceOverrideMinor: line.priceOverrideMinor })),
        amount: formatPrice(lineGross(line)),
        ...(line.note ? { note: line.note } : {}),
        ...(discount > 0 ? { discount: formatPrice(discount) } : {}),
      };
    }),
    salesValue: formatPrice(t.subtotal),
    vat: formatPrice(t.tax),
    discount: formatPrice(t.discount),
    total: formatPrice(t.total),
    paidBy: tender.method === 'cash' ? methodLabel('cash') : `${methodLabel(tender.method)} · ${bankAccount(tender.bankId).short}`,
    tendered: formatPrice(tender.tenderedMinor),
    balance: formatPrice(result.changeMinor),
  };
}

/** The receipt as plain text, for the share sheet or the clipboard. */
export function receiptText(r: Receipt): string {
  const row = (a: string, b: string) => `${a}: ${b}`;
  return [
    STORE.name, STORE.address, STORE.phone, '',
    `Total ${r.total}`, '',
    row('Customer', r.customer), row('Transaction Date', r.date), row('Receipt No.', r.number), row('Sales Person', r.salesPerson), '',
    ...r.lines.flatMap((l) => [
      `${l.title} @ ${l.unitPrice}  ${l.amount}`,
      ...(l.note ? [l.note] : []),
      ...(l.discount ? [row('Discount', l.discount)] : []),
    ]),
    '',
    row('Sales Value', r.salesValue), row('VAT', r.vat), row('Discount', r.discount),
    row('Total', r.total), row(r.paidBy, r.total), row('Tendered', r.tendered), row('Balance', r.balance), '',
    STORE.footnote, STORE.credit,
  ].join('\n');
}
