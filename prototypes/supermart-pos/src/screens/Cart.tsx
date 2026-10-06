import { DURATION, EASING, duration, useReducedMotion } from '@playground/shared';
import { Icon } from '../components/Icon';
import { CloseButton } from '../components/CloseButton';
import { QtyInputField } from '../components/QtyInputField';
import { formatPrice, maxCount, unitFor } from '../data/catalogue';
import { productImage } from '../data/productImage';
import type { Customer } from '../data/customers';
import { lineGross, productFor, totals, type CartLine } from '../state/cart';
import { BottomScrim } from '../components/BottomScrim';
import { OrderTotal } from '../components/OrderTotal';
import './Cart.css';

/**
 * Cart / Order Preview — Figma `88:8164`, band 4 ("Adding customer to an order").
 *
 * Line items read the shared cart state, so quantities and prices here are the same
 * records the Sales Point wrote. Nothing about a product is copied into the cart.
 */
type CartProps = {
  lines: readonly CartLine[];
  onClose: () => void;
  onQtyChange: (productId: string, qty: number) => void;
  /** Opens the Quantity sheet over this line. */
  onEditQuantity: (productId: string) => void;
  /** Opens Item details. Not designed which control opens it; the name does. */
  onOpenDetails: (productId: string) => void;
  onRemove: (productId: string) => void;
  onCheckout: () => void;
  onQueue: () => void;
  onAddCustomer: () => void;
  onMoreOptions: () => void;
  onClearAll: () => void;
  /** Set once a customer is picked in the Select customer sheet. */
  customer: Customer | null;
  onRemoveCustomer: () => void;
  /** Lifted to the App so the dev toolbar can present the expanded state. */
  totalOpen: boolean;
  onToggleTotal: () => void;
};

export function Cart({
  lines, onClose, onQtyChange, onEditQuantity, onOpenDetails, onRemove, onCheckout, onQueue, onAddCustomer,
  onMoreOptions, onClearAll, customer, onRemoveCustomer, totalOpen, onToggleTotal,
}: CartProps) {
  const reducedMotion = useReducedMotion();
  return (
    <div
      className="cart"
      data-total={totalOpen ? 'on' : 'off'}
      style={{
        '--order-total-ms': `${duration(DURATION.base, reducedMotion)}ms`,
        '--order-total-easing': totalOpen ? EASING.out : EASING.in,
      } as React.CSSProperties}
    >
      <header className="cart__titleBar">
        <div className="cart__titleLeft">
          <CloseButton onPress={onClose} label="Close order preview" />
          <h1 className="cart__title">Order Preview</h1>
        </div>
        <div className="cart__titleActions">
          <button type="button" className="cart__iconButton" onClick={onMoreOptions} aria-label="More options">
            <Icon name="dots-horizontal" />
          </button>
          <button type="button" className="cart__iconButton" onClick={onClearAll} aria-label="Clear order">
            <Icon name="trash-03" />
          </button>
        </div>
      </header>

      <div className="cart__scroll">
        {/* One row, two states — "Customer added" (`88:8243`) is this same Frame 5010
            with the label's weight and tracking changed and the trailing control
            swapped, not a separate screen. With a customer attached the whole row
            stops being a single button: the trailing control removes the customer,
            so it cannot sit inside a button that opens the picker. */}
        <div className="addCustomer" data-state={customer ? 'added' : 'empty'}>
          <button
            type="button"
            className="addCustomer__pick"
            onClick={onAddCustomer}
            aria-label={customer ? `Change customer, currently ${customer.name}` : 'Add customer'}
          >
            <span className="addCustomer__avatar">
              <Icon name="user-02" />
            </span>
            <span className="addCustomer__label">{customer ? customer.name : 'Add customer'}</span>

            {/* With no customer the plus lives INSIDE the pick button, so the whole
                row stays one target as the frame draws it. Only the added state
                splits, because the trash is a different action. */}
            {!customer && (
              <span className="addCustomer__plus" aria-hidden="true">
                <Icon name="plus-circle" />
              </span>
            )}
          </button>

          {customer && (
            <button
              type="button"
              className="addCustomer__remove"
              onClick={onRemoveCustomer}
              aria-label={`Remove ${customer.name} from this order`}
            >
              <Icon name="trash-03-subtle" />
            </button>
          )}
        </div>

        {lines.length === 0 ? (
          <div className="cart__empty">
            <p className="cart__emptyTitle">No items yet</p>
            <p className="cart__emptyBody">Add products from the Sales Point to start an order.</p>
          </div>
        ) : (
          <ul className="cart__lines">
            {lines.map((line) => {
              const product = productFor(line);
              return (
                <li key={line.productId} className="cartLine">
                  <div className="cartLine__main">
                    <span className="cartLine__image">
                      {productImage(product) ? (
                        <img className="cartLine__img" src={productImage(product)} alt="" />
                      ) : null}
                      <span className="cartLine__scrim" />
                    </span>
                    <div className="cartLine__info">
                      <button type="button" className="cartLine__name" title={product.name}
                        onClick={() => onOpenDetails(line.productId)}>{product.name}</button>
                      <QtyInputField
                        count={line.count}
                        unit={unitFor(product, line.unitId).abbrev}
                        max={maxCount(product, line.unitId)}
                        onChange={(next) => onQtyChange(line.productId, next)}
                        onValuePress={() => onEditQuantity(line.productId)}
                      />
                    </div>
                  </div>
                  <div className="cartLine__trailing">
                    <button
                      type="button"
                      className="cartLine__remove"
                      onClick={() => onRemove(line.productId)}
                      aria-label={`Remove ${product.name}`}
                    >
                      <Icon name="x-circle" />
                    </button>
                    {/* Line GROSS, not unit price and not net of discount: the lines then
                        add up to the Subtotal on screen, and discounts show once, in the
                        footer breakdown. The frame shows ₦10,000 on one row and ₦1,000 on
                        five others at the same quantity, which reconciles with nothing. */}
                    <span className="cartLine__price">{formatPrice(lineGross(line))}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* `88:8713`: the same scrim as the Cart's, at this band's 239 rather than 206 —
          same gradient transform, so only the height changes. */}
      <BottomScrim height={239} />

      <div className="cart__footer">
        <OrderTotal totals={totals(lines)} open={totalOpen} onToggle={onToggleTotal} />
        <div className="cart__actions">
          <button type="button" className="cart__checkout" onClick={onCheckout} disabled={lines.length === 0}>
            <span className="cart__checkoutLabel">Checkout ({lines.length})</span>
            <Icon name="chevron-right" />
          </button>
          <button type="button" className="cart__queue" onClick={onQueue} disabled={lines.length === 0}>
            <span className="cart__queueLabel">Queue order</span>
          </button>
        </div>
      </div>
    </div>
  );
}
