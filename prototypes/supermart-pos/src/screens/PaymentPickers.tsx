import { useState } from 'react';
import { BottomSheet } from '../components/BottomSheet';
import { Icon } from '../components/Icon';
import { BANK_ACCOUNTS, METHODS, type MethodId } from '../data/payments';
import './PaymentPickers.css';

/**
 * Select payment method — `88:14105`. All six methods as drawn; the four without a
 * design raise a notice in the caller and leave the method as it was.
 */
export function SelectPaymentMethod({
  open, current, onClose, onChoose,
}: {
  open: boolean;
  current: MethodId;
  onClose: () => void;
  onChoose: (id: MethodId) => void;
}) {
  return (
    <BottomSheet open={open} title="Select payment method" onClose={onClose} closeLabel="Back to checkout" className="methodPicker">
      <div className="pickList" role="radiogroup" aria-label="Payment method">
        {METHODS.map((m) => (
          <button key={m.id} type="button" role="radio" aria-checked={m.id === current} className="pickList__row methodPicker__row"
            data-method={m.id} onClick={() => onChoose(m.id)}>
            <span className="methodPicker__lead">
              <Icon name={m.icon} />
              <span className="methodPicker__label">{m.label}</span>
            </span>
            {/* The frame shows only the chosen row's check; the rest are at opacity 0. */}
            <span className="pickList__check" aria-hidden="true"><Icon name="check-24" /></span>
          </button>
        ))}
      </div>
    </BottomSheet>
  );
}

/**
 * Select bank — `88:14794`. Deviations, logged in BUILD-PLAN: the frame draws every
 * row's check at opacity 0, the chosen one included, so nothing marks the bank in
 * use; the chosen row shows its check here, as the method list does. The search is
 * the board's Text field at radius Border radius/200, where Select customer's is 300.
 */
export function SelectBank({
  open, current, onClose, onChoose,
}: {
  open: boolean;
  current: string;
  onClose: () => void;
  onChoose: (id: string) => void;
}) {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const visible = BANK_ACCOUNTS.filter((a) => !q || `${a.bank} ${a.number} ${a.holder}`.toLowerCase().includes(q));
  return (
    <BottomSheet open={open} title="Select bank" onClose={onClose} closeLabel="Back to checkout" className="bankPicker">
      <label className="customerSearch bankPicker__search">
        <Icon name="search-sm" />
        <input className="customerSearch__input" placeholder="Search" value={query}
          onChange={(e) => setQuery(e.target.value)} aria-label="Search banks" />
      </label>
      {visible.length === 0 ? (
        <p className="bankPicker__empty">No bank matches “{query.trim()}”</p>
      ) : (
        <div className="pickList bankPicker__list" role="radiogroup" aria-label="Bank">
          {visible.map((a) => (
            <button key={a.id} type="button" role="radio" aria-checked={a.id === current} className="pickList__row bankPicker__row"
              data-bank={a.id} onClick={() => onChoose(a.id)}>
              <span className="bankPicker__lead">
                <img className="bankPicker__logo" src={a.logo} width={40} height={40} alt="" />
                <span className="bankPicker__text">
                  <span className="bankPicker__name">{a.bank}</span>
                  <span className="bankPicker__sub">
                    {a.number}
                    <Icon name="dot-2" />
                    {a.holder}
                  </span>
                </span>
              </span>
              <span className="pickList__check" aria-hidden="true"><Icon name="check" /></span>
            </button>
          ))}
        </div>
      )}
    </BottomSheet>
  );
}
