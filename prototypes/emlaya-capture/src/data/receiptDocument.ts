/**
 * The paper receipt the camera sees — printed from the same record extraction returns,
 * so the evidence and the extracted details agree (the Figma photo was a $43.26 US
 * receipt under a ₦15,000 record: CORRECTIONS R14).
 *
 * The record's fields are the document's. The boilerplate a till prints around them
 * ("RCPT", "ITEMS", "TOTAL", "THANK YOU") is not in Figma and is marked so.
 */
import { extractedDraft, type PurchaseReceipt } from './records';
import { formatFieldDate } from './format';

export type PrintLine =
  | { kind: 'title'; text: string }
  | { kind: 'text'; text: string; faint?: boolean; centre?: boolean }
  | { kind: 'pair'; left: string; right: string; bold?: boolean; indent?: boolean }
  | { kind: 'rule' }
  | { kind: 'gap' }
  | { kind: 'barcode'; seed: string };

const amount = new Intl.NumberFormat('en-NG', { maximumFractionDigits: 0 });

export function printedLines(r: PurchaseReceipt = extractedDraft()): PrintLine[] {
  const units = r.items.reduce((n, i) => n + i.quantity, 0);
  return [
    { kind: 'title', text: r.merchant.toUpperCase() },
    { kind: 'text', text: r.address, faint: true, centre: true },
    { kind: 'gap' },
    { kind: 'rule' },
    { kind: 'pair', left: formatFieldDate(r.date), right: r.time },
    { kind: 'text', text: `RCPT ${r.id.replace('rcpt-', '').toUpperCase()}`, faint: true },
    { kind: 'rule' },
    ...r.items.flatMap((i): PrintLine[] => [
      { kind: 'text', text: i.name.toUpperCase() },
      { kind: 'pair', left: `${i.quantity} x ${amount.format(i.unitPrice)}`, right: amount.format(i.quantity * i.unitPrice), indent: true },
    ]),
    { kind: 'rule' },
    { kind: 'pair', left: 'ITEMS', right: String(units) },
    { kind: 'pair', left: 'TOTAL', right: `₦${amount.format(r.amount)}`, bold: true },
    { kind: 'rule' },
    { kind: 'gap' },
    { kind: 'text', text: 'THANK YOU FOR SHOPPING', centre: true, faint: true },
    { kind: 'gap' },
    { kind: 'barcode', seed: r.id },
  ];
}
