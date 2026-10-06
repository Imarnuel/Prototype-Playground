import { useEffect, useRef, type KeyboardEvent, type ReactNode } from 'react';
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
  open, title, onClose, closeLabel, children, dismissOnBlanket = true,
}: {
  open: boolean;
  /** Visible heading, and the dialog's accessible name. */
  title: string;
  onClose: () => void;
  closeLabel: string;
  children: ReactNode;
  /** Off for sheets that edit a draft: a stray tap on the blanket must not throw the
      edits away. Those sheets close only through their own close and confirm. */
  dismissOnBlanket?: boolean;
}) {
  const { mounted, entered } = usePresented(open);
  const reducedMotion = useReducedMotion();
  const panel = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  /* Focus goes into the dialog when it opens and back to whatever opened it when it
     closes. `preventScroll` is not optional: the panel starts off-screen, and plain
     focus() makes the browser scroll its nearest scrollable ancestor to reveal it —
     the device frame — so the whole phone lurches and drifts back (CLAUDE.md "Focus
     and scroll"). */
  useEffect(() => {
    if (open) {
      opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      panel.current?.focus({ preventScroll: true });
      return;
    }
    const back = opener.current;
    opener.current = null;
    if (back && back.isConnected) back.focus({ preventScroll: true });
  }, [open, mounted]);

  if (!mounted) return null;

  /* aria-modal promises the rest of the page is inert, so Tab has to stay inside
     the dialog, and Escape closes it as every platform dialog does. */
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') { e.stopPropagation(); onClose(); return; }
    if (e.key !== 'Tab' || !panel.current) return;
    const focusable = [...panel.current.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
    )];
    if (focusable.length === 0) { e.preventDefault(); return; }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const at = document.activeElement;
    if (e.shiftKey && (at === first || at === panel.current)) { e.preventDefault(); last.focus({ preventScroll: true }); }
    else if (!e.shiftKey && at === last) { e.preventDefault(); first.focus({ preventScroll: true }); }
  };

  return (
    <div
      className="blanket"
      data-open={entered ? 'on' : 'off'}
      style={{
        transitionDuration: `${duration(open ? SHEET_SPRING.duration : SHEET_SPRING.exitDuration, reducedMotion)}ms`,
        transitionTimingFunction: open ? SHEET_SPRING.easing : SHEET_SPRING.exitEasing,
      }}
      onClick={dismissOnBlanket ? onClose : undefined}
      onKeyDown={onKeyDown}
    >
      {/* Stops a tap inside the sheet reaching the blanket's dismiss. */}
      <div
        ref={panel}
        className="sheetPanel"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modalHeader">
          <CloseButton onPress={onClose} label={closeLabel} />
          <h2 className="modalHeader__title">{title}</h2>
        </header>

        <div className="modalBody">{children}</div>
      </div>
    </div>
  );
}
