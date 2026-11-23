import { useCallback, useEffect, useRef, useState } from 'react';
import { extractReceipt } from '../api/extract';
import type { ExtractedReceipt } from '../data/receipt';
import { LINES } from '../data/lines';
import { DWELL } from '../timing';

/**
 * Where one extraction is. Both prototypes read the SAME run, so side by side they show
 * one request resolving two ways, not two requests racing.
 *
 * - arriving:   the screen as it lands from Confirm, sharp, for one beat
 * - extracting: the loader; `line` advances on its own cadence and holds on the last
 * - resolving:  the result is in; A blooms, B shows its check
 * - ready:      the extracted fields, revealed
 * - failed:     Unable to process (RP-04)
 */
export type Phase = 'arriving' | 'extracting' | 'resolving' | 'ready' | 'failed';

export type Run = {
  phase: Phase;
  /** Index into LINES while extracting. */
  line: number;
  receipt: ExtractedReceipt | null;
};

/** A state the dev toolbar can pin, so a demo never waits for one. */
export type Pinned = 'extracting' | 'ready' | 'failed' | null;

export function useExtractionRun(pinned: Pinned) {
  const [run, setRun] = useState<Run>({ phase: 'arriving', line: 0, receipt: null });
  const [nonce, setNonce] = useState(0);
  const replay = useCallback(() => setNonce((n) => n + 1), []);
  const lineShownAt = useRef(0);

  useEffect(() => {
    let live = true;
    const timers: number[] = [];
    const later = (ms: number, fn: () => void) => timers.push(window.setTimeout(() => live && fn(), ms));

    if (pinned === 'ready' || pinned === 'failed') {
      // Pinned end states still arrive through the loader's exit, never as a cut: start
      // from the loader, then resolve on the next beat.
      setRun({ phase: 'extracting', line: 0, receipt: null });
      lineShownAt.current = performance.now();
      // Through the same mock API, with no latency: a pinned state is the same data path.
      const result = pinned === 'failed' ? Promise.reject(new Error('pinned')) : extractReceipt(0);
      result.then(
        (receipt) => later(DWELL.minReadable, () => settle(receipt)),
        () => later(DWELL.minReadable, () => settle(null)),
      );
    } else {
      setRun({ phase: 'arriving', line: 0, receipt: null });
      later(DWELL.arrive, () => {
        setRun({ phase: 'extracting', line: 0, receipt: null });
        lineShownAt.current = performance.now();
        // The cadence runs ahead of the result; each line is a new timer so a resolved
        // run can stop it cleanly.
        const advance = (i: number) => {
          if (i >= LINES.length) return;
          later(DWELL.line, () => {
            setRun((r) => (r.phase === 'extracting' ? { ...r, line: i } : r));
            lineShownAt.current = performance.now();
            advance(i + 1);
          });
        };
        advance(1);

        if (pinned === 'extracting') return; // held: the result never lands
        extractReceipt().then(
          (receipt) => finish(receipt),
          () => finish(null),
        );
      });
    }

    function finish(receipt: ExtractedReceipt | null) {
      if (!live) return;
      // Stop the cadence first: a line that swapped in during the wait below would be
      // cut almost as soon as it landed.
      timers.splice(0).forEach((t) => window.clearTimeout(t));
      // Never cut a line before it can be read.
      const shown = performance.now() - lineShownAt.current;
      later(Math.max(0, DWELL.minReadable - shown), () => settle(receipt));
    }

    function settle(receipt: ExtractedReceipt | null) {
      timers.splice(0).forEach((t) => window.clearTimeout(t));
      if (!receipt) {
        setRun((r) => ({ ...r, phase: 'failed', receipt: null }));
        return;
      }
      setRun((r) => ({ ...r, phase: 'resolving', receipt }));
      later(DWELL.resolve, () => setRun((r) => ({ ...r, phase: 'ready' })));
    }

    return () => {
      live = false;
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [pinned, nonce]);

  return { run, replay };
}
