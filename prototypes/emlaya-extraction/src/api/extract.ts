import { request } from '@playground/shared';
import { EXTRACTED, type ExtractedReceipt } from '../data/receipt';

/**
 * How long extraction takes. Presentation presets, chosen from the dev toolbar so a
 * demo can show the loader resolving early, mid-sequence, or holding on its last line.
 * Not measured from a real extractor: the product has none yet.
 */
export const EXTRACTION_PACE = {
  quick: 2400,
  typical: 6200,
  slow: 13000,
  /** Never resolves inside a demo. Below setTimeout's 2^31-1 ms ceiling, so it waits. */
  hold: 2_000_000_000,
} as const;

export type ExtractionPace = keyof typeof EXTRACTION_PACE;

let pace: ExtractionPace = 'typical';

export function setExtractionPace(next: ExtractionPace): void {
  pace = next;
}

export function getExtractionPace(): ExtractionPace {
  return pace;
}

/**
 * Extract the fields of a captured receipt. Through the one mock API, so the shared
 * toolbar's "Fail next request" and "Toggle latency" reach it like any other call.
 */
export function extractReceipt(latency: number = EXTRACTION_PACE[pace]): Promise<ExtractedReceipt> {
  return request('receipt/extract', () => EXTRACTED, { latency });
}
