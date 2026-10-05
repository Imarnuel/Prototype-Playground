import { useEffect } from 'react';
import { DURATION, EASING, duration, useReducedMotion } from '@playground/shared';
import { Icon } from './Icon';
import './Toast.css';

/**
 * Confirmation toast — Figma `88:8401`, the only thing that separates "Customer
 * added" `88:8322` from `88:8243`.
 *
 * The frame draws it at a fixed 200x132 centred on the screen, with no motion and no
 * dismissal: it is a still of a transient thing. Entry, exit and the timeout come from
 * the project's own constants, documented as a baseline rather than design-derived —
 * `get_motion_context` returns {"nodes":[]} for every frame in this file.
 *
 * `role="status"` rather than `alert`: it confirms something the user just did, so it
 * should not interrupt a screen reader mid-sentence.
 */
export function Toast({
  open, message, onDismiss, autoDismissMs = 2600,
}: {
  open: boolean;
  message: string;
  onDismiss: () => void;
  autoDismissMs?: number;
}) {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return undefined;
    const t = setTimeout(onDismiss, autoDismissMs);
    return () => clearTimeout(t);
  }, [open, onDismiss, autoDismissMs, message]);

  return (
    <div
      className="toast"
      data-open={open ? 'on' : 'off'}
      role="status"
      aria-live="polite"
      style={{
        transitionDuration: `${duration(DURATION.base, reducedMotion)}ms`,
        transitionTimingFunction: open ? EASING.out : EASING.in,
      }}
    >
      <Icon name="check-circle" />
      <p className="toast__message">{message}</p>
    </div>
  );
}
