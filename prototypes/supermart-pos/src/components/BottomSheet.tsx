import type { ReactNode } from 'react';
import { SHEET_SPRING, duration, useReducedMotion } from '@playground/shared';
import { CloseButton } from './CloseButton';
import { usePresented } from '../hooks/usePresented';
import './BottomSheet.css';

/**
 * A bottom sheet over the current screen: blanket, panel, `.Modal header` and a
 * scrolling body. Presentation timing comes from `usePresented`, so the sheet has a
 * rendered starting frame to enter from and stays mounted through its exit.
 *
 * Extracted from Select customer when the Quantity sheet and the line-details modal
 * made it the third sheet. Props arrive with their first real user, not ahead of it.
 */
export function BottomSheet({
  open, title, onClose, closeLabel, children,
}: {
  open: boolean;
  /** Visible heading, and the dialog's accessible name. */
  title: string;
  onClose: () => void;
  closeLabel: string;
  children: ReactNode;
}) {
  const { mounted, entered } = usePresented(open);
  const reducedMotion = useReducedMotion();

  if (!mounted) return null;

  return (
    <div
      className="blanket"
      data-open={entered ? 'on' : 'off'}
      style={{
        transitionDuration: `${duration(open ? SHEET_SPRING.duration : SHEET_SPRING.exitDuration, reducedMotion)}ms`,
        transitionTimingFunction: open ? SHEET_SPRING.easing : SHEET_SPRING.exitEasing,
      }}
      onClick={onClose}
    >
      {/* Stops a tap inside the sheet reaching the blanket's dismiss. */}
      <div className="sheetPanel" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <header className="modalHeader">
          <CloseButton onPress={onClose} label={closeLabel} />
          <h2 className="modalHeader__title">{title}</h2>
        </header>

        <div className="modalBody">{children}</div>
      </div>
    </div>
  );
}
