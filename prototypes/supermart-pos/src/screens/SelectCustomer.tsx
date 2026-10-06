import { useState } from 'react';
import { BottomSheet } from '../components/BottomSheet';
import { Icon } from '../components/Icon';
import { CUSTOMERS, type Customer } from '../data/customers';
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

  const visible = customers.filter((c) =>
    c.name.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    /* The frame's header also holds a check Button Icon at opacity 0 — an invisible
       control. Not built: an affordance nobody can see is not an affordance, and
       reviving it would invent a confirm step this flow never shows. Logged as #43. */
    <BottomSheet open={open} title="Select customer" onClose={onClose} closeLabel="Close customer picker">
      {customers.length === 0 ? (
        <div className="customerEmpty">
          <div className="customerEmpty__rings">
            <div className="customerEmpty__ring2">
              <div className="customerEmpty__ring3">
                <Icon name="users-02" />
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
            <Icon name="plus" />
            <span className="customerEmpty__ctaLabel">Add customer</span>
          </button>
        </div>
      ) : (
        <>
          <div className="customerSearch">
            <Icon name="search-sm" />
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
            <Icon name="add-one" />
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
    </BottomSheet>
  );
}

export { CUSTOMERS };
