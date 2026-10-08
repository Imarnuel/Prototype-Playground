import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';
import './EmptyState.css';

/**
 * The board's empty state: a 40 glyph in three concentric rounded rings, a Heading/H2
 * title and a Body/large line, centred. Select customer (`88:11935`) and Queued orders
 * (`88:16254`) draw the same rings to the pixel; extracted when the second arrived,
 * and proved pure by a computed-style snapshot of Select customer's, before and after.
 * The gap below the rings differs per frame (24 there, 16 here), so it is the caller's.
 */
export function EmptyState({ icon, title, body, className = '', children }: {
  icon: IconName; title: string; body: ReactNode; className?: string; children?: ReactNode;
}) {
  return (
    <div className={`emptyState ${className}`}>
      <div className="emptyState__rings">
        <div className="emptyState__ring2">
          <div className="emptyState__ring3">
            <Icon name={icon} />
          </div>
        </div>
      </div>
      <div className="emptyState__text">
        <p className="emptyState__title">{title}</p>
        <p className="emptyState__body">{body}</p>
      </div>
      {children}
    </div>
  );
}
