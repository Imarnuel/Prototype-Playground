import { useRef } from 'react';
import { AnimatedText } from '../components/AnimatedText';
import { BottomSheet } from '../components/BottomSheet';
import { FieldError } from '../components/FieldError';
import { Icon } from '../components/Icon';
import { formatPrice, parseWholeNaira, tenderFor, type OrderTotals } from '../data/catalogue';
import { bankAccount, methodLabel } from '../data/payments';
import '../components/DetailField.css';
import './Checkout.css';

export type CheckoutDraft = { method: 'cash' | 'bank'; bankId: string; amount: string };

/**
 * Checkout — `88:12450` (cash) and `88:13497` (bank transfer), with Pay disabled as
 * `88:12595` draws it. The draft lives in the App, not here: the method and bank
 * pickers replace this sheet on screen (the frames show them alone over the Cart),
 * and the draft has to survive that round trip.
 *
 * Deviations, each logged in BUILD-PLAN:
 * - The Amount opens at the total. The cash flow draws it filled; the bank flow's
 *   first frame draws the same state empty — one state, two drawings.
 * - The header's check Button Icon is at opacity 0, as elsewhere (#43); not built.
 * - Change due and the validation messages are not designed.
 */
export function Checkout({
  open, totals, draft, onAmountChange, onPickMethod, onPickBank, onClose, onPay, phase, handoff = false,
}: {
  open: boolean;
  totals: OrderTotals;
  draft: CheckoutDraft;
  onAmountChange: (text: string) => void;
  onPickMethod: () => void;
  onPickBank: () => void;
  onClose: () => void;
  /** Swapping with another sheet: see BottomSheet `handoff`. */
  handoff?: boolean;
  onPay: () => void;
  /** idle → paying (waiting on the payment) → paid (confirmed, about to hand over to
      Transaction success). */
  phase: 'idle' | 'paying' | 'paid';
}) {
  const amountMinor = parseWholeNaira(draft.amount);
  const tender = amountMinor === null ? null : tenderFor(draft.method, totals.total, amountMinor);
  const error = draft.amount === '' ? null
    : amountMinor === null ? 'Enter a whole Naira amount'
      : tender && !tender.ok
        ? (tender.reason === 'short' ? `Less than the total, ${formatPrice(totals.total)}` : `A transfer must be the total, ${formatPrice(totals.total)}`)
        : null;
  const change = tender?.ok && tender.changeMinor > 0 ? tender.changeMinor : 0;
  const canPay = !!tender?.ok && phase === 'idle';
  const input = useRef<HTMLInputElement>(null);
  // Shown grouped, as the frame writes it ("₦10,000"); the draft keeps the digits.
  const shown = /^\d+$/.test(draft.amount) ? Number(draft.amount).toLocaleString('en-NG') : draft.amount;

  return (
    <BottomSheet handoff={handoff}
      open={open}
      title="Checkout"
      onClose={onClose}
      closeLabel="Close checkout"
      dismissOnBlanket={false}
      className="checkout"
      footer={
        /* Not designed: the button holds the whole moment — its label gives way to a
           spinner while the payment runs, then it turns green and draws a check, so
           the confirmation starts where the finger is before the screen takes over. */
        <button type="button" className="payButton" data-phase={phase} disabled={!canPay}
          onClick={onPay} aria-busy={phase === 'paying'}>
          <span className="payButton__label" aria-hidden={phase !== 'idle'}>
            {canPay || phase !== 'idle' ? `Pay ${formatPrice(totals.total)}` : 'Pay'}
          </span>
          <span className="payButton__status" aria-hidden="true">
            <span className="payButton__spinner" />
            <svg className="payButton__check" width="20" height="20" viewBox="0 0 40 40" fill="none">
              <path d="M33.3332 10L14.9998 28.3333L6.6665 20" pathLength={1} stroke="white" strokeWidth="4"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          {phase === 'paying' && <span className="visuallyHidden">Processing…</span>}
          {phase === 'paid' && <span className="visuallyHidden">Paid</span>}
        </button>
      }
    >
      <div className="checkout__summary">
        <p className="checkout__total"><AnimatedText value={formatPrice(totals.total)} /></p>
        <div className="checkout__breakdownWrap">
          <dl className="checkout__breakdown">
            <div className="checkout__row"><dt>Subtotal</dt><dd>{formatPrice(totals.subtotal)}</dd></div>
            <div className="checkout__row"><dt>Discount</dt><dd>{formatPrice(totals.discount)}</dd></div>
            <div className="checkout__row"><dt>Tax</dt><dd>{formatPrice(totals.tax)}</dd></div>
          </dl>
        </div>
      </div>

      <div className="checkout__payment">
        <div className="checkout__methodCard">
          <button type="button" className="checkout__methodRow" onClick={onPickMethod}>
            <span className="checkout__methodLabel">Payment method</span>
            <span className="checkout__methodValue">
              <span className="checkout__valueText">{methodLabel(draft.method)}</span>
              <Icon name="chevron-right-subtle" />
            </span>
          </button>
          {draft.method === 'bank' && (
            <button type="button" className="checkout__methodRow checkout__methodRow--bank" onClick={onPickBank}>
              <span className="checkout__methodLabel">Bank</span>
              <span className="checkout__methodValue">
                <span className="checkout__valueText">
                  {bankAccount(draft.bankId).short} - {bankAccount(draft.bankId).number}
                </span>
                <Icon name="chevron-right-subtle" />
              </span>
            </button>
          )}
        </div>

        <div>
          <label className="detailField">
            <span className="detailField__label">Amount</span>
            <span className="detailField__row">
              <span aria-hidden="true">₦</span>
              <span className="detailField__grow" data-value={shown}>
                <input ref={input} inputMode="numeric" value={shown} aria-invalid={!!error}
                  onChange={(e) => onAmountChange(e.target.value.replace(/,/g, ''))} />
              </span>
            </span>
          </label>
          <FieldError message={error} />
          {/* Not designed: change due, in the same opening line as an error. */}
          <div className="fieldError checkout__change" data-open={change ? 'on' : 'off'}>
            <div className="fieldError__clip">
              <p className="checkout__changeText" role="status">Change {formatPrice(change)}</p>
            </div>
          </div>
        </div>
      </div>
    </BottomSheet>
  );
}
