import type { ReactNode } from 'react';
import './ListMessage.css';

/**
 * Undesigned: what a list says when it failed to load or has nothing to show, with an
 * optional retry. The Sales Point's own, extracted when Queued orders needed the same
 * thing; proved pure by a computed-style snapshot of the Sales Point's, before and after.
 */
export function ListMessage({ title, body, onRetry }: { title: string; body: ReactNode; onRetry?: () => void }) {
  return (
    <div className="listMessage" role={onRetry ? 'alert' : undefined}>
      <p className="listMessage__title">{title}</p>
      <p className="listMessage__body">{body}</p>
      {onRetry && <button type="button" className="listMessage__retry" onClick={onRetry}>Try again</button>}
    </div>
  );
}
