import { useEffect } from 'react';
import { DURATION, EASING, duration, useReducedMotion } from '@playground/shared';
import { Icon } from './Icon';
import './Toast.css';

/**
 * `notice` is for a tap the app refused, such as a product the shelf can't supply. The
 * design draws only the success toast, and a check-circle beside "Out of stock" says
 * the opposite of the message, so a notice drops the icon. There is no warning glyph
 * or warning token in the file to use instead — needs design input.
 */
export type ToastTone = 'success' | 'notice';

/**
 * Confirmation toast — Figma `88:8401`, the only thing that separates "Customer
 * added" `88:8322` from `88:8243`.
 *
 * The frame draws it at a fixed 200x132 centred on the screen, with no motion and no
 * dismissal: it is a still of a transient thing. Entry, exit and the timeout come from
 * the project's own constants, documented as a baseline rather than design-derived —
 * `get_motion_context` returns {"nodes":[]} for every frame in this file.
 *
 * `role="status"` rather than `alert`: it reports on something the user just did, so it
 * should not interrupt a screen reader mid-sentence.
 */
export function Toast({
  open, message, tone = 'success', shown, onDismiss, action, autoDismissMs = action ? 5000 : 2600,
}: {
  open: boolean;
  message: string;
  tone?: ToastTone;
  /** Changes on every show. A repeat of the same message while the toast is up — a
      second tap past the shelf — gets the full time again, not what was left. */
  shown: number;
  onDismiss: () => void;
  /** Not designed: a way back from something that cannot otherwise be undone, such as
      clearing the cart. It stays up longer, long enough to reach. */
  action?: { label: string; onPress: () => void };
  autoDismissMs?: number;
}) {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return undefined;
    const t = setTimeout(onDismiss, autoDismissMs);
    return () => clearTimeout(t);
  }, [open, onDismiss, autoDismissMs, shown]);

  return (
    <div
      className="toast"
      data-open={open ? 'on' : 'off'}
      data-action={action ? 'on' : 'off'}
      role="status"
      aria-live="polite"
      style={{
        transitionDuration: `${duration(DURATION.base, reducedMotion)}ms`,
        transitionTimingFunction: open ? EASING.out : EASING.in,
      }}
    >
      {tone === 'success' && <Icon name="check-circle" />}
      <p className="toast__message">{message}</p>
      {action && (
        <button type="button" className="toast__action" onClick={action.onPress} tabIndex={open ? 0 : -1}>
          {action.label}
        </button>
      )}
    </div>
  );
}
