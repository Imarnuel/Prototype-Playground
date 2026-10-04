import { useState } from 'react';
import { SHEET_SPRING, duration, useReducedMotion } from '@playground/shared';
import { AssetSlot } from '../components/AssetSlot';
import { CloseButton } from '../components/CloseButton';
import { CUSTOMERS, type Customer } from '../data/customers';
import { usePresented } from '../hooks/usePresented';
import './SelectCustomer.css';

/**
 * Select customer — the bottom sheet from Figma `88:11845` (empty) and `88:12043`
 * (populated). Both are states of one sheet, so both are built here; shipping only
 * the empty one would leave a sheet that can never show a customer.
 *
 * `.Modal header` and the blanket are the board's own shared components (49 and 5
 * uses), so they live in this file's markup rather than being re-derived per screen.
 */
type SelectCustomerProps = {
  open: boolean;
  /** Empty when the shop has no customers on file — the design's empty state. */
  customers: readonly Customer[];
  onClose: () => void;
  onSelect: (c: Customer) => void;
  onAddCustomer: () => void;
};

export function SelectCustomer({ open, customers, onClose, onSelect, onAddCustomer }: SelectCustomerProps) {
  const [query, setQuery] = useState('');
  const { mounted, entered } = usePresented(open);
  const reducedMotion = useReducedMotion();

  if (!mounted) return null;

  const visible = customers.filter((c) =>
    c.name.toLowerCase().includes(query.trim().toLowerCase()));

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
      <div className="sheetPanel" role="dialog" aria-modal="true" aria-label="Select customer" onClick={(e) => e.stopPropagation()}>
        <header className="modalHeader">
          <CloseButton onPress={onClose} label="Close customer picker" />
          <h2 className="modalHeader__title">Select customer</h2>
          {/* The frame holds a check Button Icon here at opacity 0 — an invisible
              control. Not built: an affordance nobody can see is not an affordance,
              and reviving it would be inventing a confirm step the flow never shows.
              Logged as #43. */}
        </header>

        <div className="modalBody">
          {customers.length === 0 ? (
            <div className="customerEmpty">
              <div className="customerEmpty__rings">
                <div className="customerEmpty__ring2">
                  <div className="customerEmpty__ring3">
                    <AssetSlot name="users-02" width={40} height={40} />
                  </div>
                </div>
              </div>
              <div className="customerEmpty__text">
                <p className="customerEmpty__title">No customers yet</p>
                <p className="customerEmpty__body">
                  Start by adding your first customer. We&rsquo;ll list them here.
                </p>
              </div>
              <button type="button" className="customerEmpty__cta" onClick={onAddCustomer}>
                <AssetSlot name="plus" width={16} height={16} />
                <span className="customerEmpty__ctaLabel">Add customer</span>
              </button>
            </div>
          ) : (
            <>
              <div className="customerSearch">
                <AssetSlot name="search-sm" width={20} height={20} />
                <input
                  className="customerSearch__input"
                  value={query}
                  placeholder="Search"
                  aria-label="Search customers"
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>

              {/* A second, differently styled "Add customer" button for the same
                  action as the empty state's: brand-subtle fill with default text
                  and a 20px icon, against brand-bold with inverse text and a 16px
                  icon. Both followed as drawn. Logged as #44. */}
              <button type="button" className="customerAdd" onClick={onAddCustomer}>
                <AssetSlot name="add-one" width={20} height={20} />
                <span className="customerAdd__label">Add customer</span>
              </button>

              {visible.length === 0 ? (
                <p className="customerList__none">No customer matches &ldquo;{query.trim()}&rdquo;.</p>
              ) : (
                <ul className="customerList">
                  {visible.map((c) => (
                    <li key={c.id} className="customerRow">
                      <button type="button" className="customerRow__button" onClick={() => onSelect(c)}>
                        <span className="customerRow__name">{c.name}</span>
                        {/* The frame has a trailing "All" label on every row at
                            opacity 0 — invisible, and identical on all twelve, so
                            its meaning is undefined. Not built. Logged as #43. */}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export { CUSTOMERS };
