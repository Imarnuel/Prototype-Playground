/**
 * Emlaya's endpoints for this flow, on the one mock API (shared/src/mockApi.ts).
 * Latency comes from tokens; failure is forced from the dev toolbar.
 */
import { request } from '@playground/shared';
import { extractedDraft, records, type Evidence, type PurchaseReceipt } from '../data/records';
import { tokenMs } from '../tokens/read';

/** Presentation presets for extraction time, so a demo shows the processing loader
    resolving early, mid-sequence, or holding on its last line. */
export const EXTRACT_PACES = ['quick', 'typical', 'slow'] as const;
export type ExtractPace = (typeof EXTRACT_PACES)[number];

let pace: ExtractPace = 'typical';
export function setExtractPace(next: ExtractPace): void {
  pace = next;
}
export function extractPaceMs(p: ExtractPace): number {
  return tokenMs(`--api-latency-extract-${p}`);
}

/** RP-07: extraction returns what the document says; it never touches the evidence. */
export function extractReceipt(evidence: Evidence): Promise<PurchaseReceipt> {
  return request('receipts/extract', () => extractedDraft(evidence), { latency: extractPaceMs(pace) });
}

/** PRV-01: saving persists the record. It creates no share, grant or contribution. */
export function saveReceipt(draft: PurchaseReceipt): Promise<PurchaseReceipt> {
  return request(
    'receipts/save',
    () => {
      const saved = { ...draft, items: draft.items.map((i) => ({ ...i })) };
      records.push(saved);
      return saved;
    },
    { latency: tokenMs('--api-latency-save') },
  );
}
