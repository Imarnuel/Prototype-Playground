import { AssetSlot } from '../components/AssetSlot';
import { CloseButton } from '../components/CloseButton';
import { QtyInputField } from '../components/QtyInputField';
import { formatPrice } from '../data/catalogue';
import type { Customer } from '../data/customers';
import { cartTotal, lineTotal, productFor, type CartLine } from '../state/cart';
import { StatusBar } from '../components/StatusBar';
import { BottomScrim } from '../components/BottomScrim';
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
  onRemove: (productId: string) => void;
  onCheckout: () => void;
  onQueue: () => void;
  onAddCustomer: () => void;
  onMoreOptions: () => void;
  onClearAll: () => void;
  /** Set once a customer is picked in the Select customer sheet. */
  customer: Customer | null;
};

export function Cart({
  lines, onClose, onQtyChange, onRemove, onCheckout, onQueue, onAddCustomer,
  onMoreOptions, onClearAll, customer,
}: CartProps) {
  return (
    <div className="cart">
      <StatusBar />

      <header className="cart__titleBar">
        <div className="cart__titleLeft">
          <CloseButton onPress={onClose} label="Close order preview" />
          <h1 className="cart__title">Order Preview</h1>
        </div>
        <div className="cart__titleActions">
          <button type="button" className="cart__iconButton" onClick={onMoreOptions} aria-label="More options">
            <AssetSlot name="dots-horizontal" width={20} height={20} />
          </button>
          <button type="button" className="cart__iconButton" onClick={onClearAll} aria-label="Clear order">
            <AssetSlot name="trash-03" width={20} height={20} />
          </button>
        </div>
      </header>

      <div className="cart__scroll">
        <button type="button" className="addCustomer" onClick={onAddCustomer}>
          <span className="addCustomer__left">
            <span className="addCustomer__avatar">
              <AssetSlot name="user-02" width={16} height={16} />
            </span>
            {/* Once a customer is chosen the row carries their name. The designed
                treatment for this is the "Customer added" frame (`88:8243`), which
                is not built yet — this is the minimum that gives the selection a
                visible consequence. Logged as #46. */}
            <span className="addCustomer__label">{customer ? customer.name : 'Add customer'}</span>
          </span>
          <AssetSlot name="plus-circle" width={24} height={24} />
        </button>

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
                      {product.image ? (
                        <img className="cartLine__img" src={`/products/${product.image}`} alt="" />
                      ) : null}
                      <span className="cartLine__scrim" />
                    </span>
                    <div className="cartLine__info">
                      <span className="cartLine__name" title={product.name}>{product.name}</span>
                      <QtyInputField
                        qty={line.qty}
                        max={product.stock}
                        onChange={(next) => onQtyChange(line.productId, next)}
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
                      <AssetSlot name="x-circle" width={20} height={20} />
                    </button>
                    {/* Line total, not unit price: quantity x price, computed from the
                        catalogue so the lines always sum to the order total. The frame
                        shows ₦10,000 on one row and ₦1,000 on five others at the same
                        quantity, which reconciles with nothing. */}
                    <span className="cartLine__price">{formatPrice(lineTotal(line))}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <BottomScrim height={206} />

      <div className="cart__footer">
        <button type="button" className="cart__checkout" onClick={onCheckout} disabled={lines.length === 0}>
          <span className="cart__checkoutLabel">Checkout ({lines.length})</span>
          <AssetSlot name="chevron-right" width={16} height={16} />
        </button>
        <button type="button" className="cart__queue" onClick={onQueue} disabled={lines.length === 0}>
          <span className="cart__queueLabel">Queue order</span>
        </button>
      </div>

      {/* Not in the frame. The design shows six priced lines and a "Checkout (5)"
          button with no order total anywhere, so the one number a till must show is
          missing. Rendered in the footer region as a minimal honest addition rather
          than invented chrome, and flagged as needing design input (#32). */}
      <p className="cart__total" aria-live="polite">
        Total <strong>{formatPrice(cartTotal(lines))}</strong>
      </p>
    </div>
  );
}
