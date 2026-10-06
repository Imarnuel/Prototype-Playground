import { useId } from 'react';
import { DURATION, EASING, duration, useReducedMotion } from '@playground/shared';
import { formatPrice, formatSignedPrice, type OrderTotals } from '../data/catalogue';
import { Icon } from './Icon';
import './OrderTotal.css';

/**
 * The order total above the Cart's buttons — `88:8639` collapsed, `88:9338` expanded.
 *
 * Every number comes from `orderTotals`, the same function the verifier proves, so the
 * breakdown can only disagree with the Total if that function is wrong.
 *
 * Deviations, each flagged in BUILD-PLAN:
 * - The header stays Heading/H3 in both states. The expanded frame sets it at H2 (and
 *   the "Total" label at an off-token #000000); a disclosure whose header grows when it
 *   opens moves the thing you just tapped.
 * - The chevron turns over when open. The design's never changes, which leaves no cue
 *   that the row is open or that tapping it again closes it.
 * - Discount shows only when there is one. The design draws the row but hides it, so
 *   "only when non-zero" is the reading; it keeps the hidden row's own styling.
 */
export function OrderTotal({
  totals, open, onToggle,
}: {
  totals: OrderTotals;
  open: boolean;
  onToggle: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const panelId = useId();
  return (
    <div
      className="orderTotal"
      data-open={open ? 'on' : 'off'}
      // One property drives every duration AND the visibility delay, so stretching it
      // to debug a frame stretches all of them together.
      style={{
        '--order-total-ms': `${duration(DURATION.base, reducedMotion)}ms`,
        '--order-total-easing': open ? EASING.out : EASING.in,
      } as React.CSSProperties}
    >
      <button
        type="button"
        className="orderTotal__toggle"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
      >
        <span className="orderTotal__label">
          Total
          <span className="orderTotal__chevron">
            <Icon name="chevron-down" />
          </span>
        </span>
        <span className="orderTotal__value">{formatPrice(totals.total)}</span>
      </button>

      <div id={panelId} className="orderTotal__panel">
        <div className="orderTotal__clip">
          <dl className="orderTotal__breakdown">
            <div className="orderTotal__row">
              <dt>Subtotal</dt>
              <dd className="orderTotal__amount">{formatPrice(totals.subtotal)}</dd>
            </div>
            {totals.discount > 0 && (
              <div className="orderTotal__row">
                <dt>Discount</dt>
                <dd className="orderTotal__deduction">{formatSignedPrice(-totals.discount)}</dd>
              </div>
            )}
            <div className="orderTotal__row">
              <dt>Tax</dt>
              <dd className="orderTotal__amount">{formatPrice(totals.tax)}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
