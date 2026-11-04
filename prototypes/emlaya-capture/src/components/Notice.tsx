/**
 * The one answer every undesigned control gives: a short notice that the destination
 * is outside this flow. Not in Figma — a prototype affordance, so it says so on its
 * face ("Needs design input") rather than passing for product UI.
 */
import { useEffect } from 'react';
import { usePresence } from '../state/usePresence';
import { tokenMs } from '../tokens/read';
import './Notice.css';

export function Notice({ message, onDone }: { message: string | null; onDone: () => void }) {
  const { mounted, state } = usePresence(message !== null, tokenMs('--motion-duration-fast'));

  useEffect(() => {
    if (message === null) return;
    const t = window.setTimeout(onDone, tokenMs('--motion-duration-notice-hold'));
    return () => window.clearTimeout(t);
  }, [message, onDone]);

  return (
    <div className="notice__region" role="status" aria-live="polite">
      {mounted && (
        <div className="notice" data-state={state} data-departure="Not in Figma: prototype notice">
          <span className="notice__badge ts-label-xsmall">Needs design input</span>
          <span className="ts-label-base">{message}</span>
        </div>
      )}
    </div>
  );
}
