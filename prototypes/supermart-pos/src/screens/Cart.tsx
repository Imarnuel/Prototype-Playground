import { useEffect, useRef, useState } from 'react';
import { AnimatedText } from '../components/AnimatedText';
import { DURATION, EASING, duration, useReducedMotion } from '@playground/shared';
import { Icon } from '../components/Icon';
import { QtyInputField } from '../components/QtyInputField';
import { formatPrice, maxCount, unitFor, type Discount } from '../data/catalogue';
import { productImage } from '../data/productImage';
import type { Customer } from '../data/customers';
import { lineGross, productFor, totals, type CartLine } from '../state/cart';
import { BottomScrim } from '../components/BottomScrim';
import { OrderTotal } from '../components/OrderTotal';
import { EmptyState } from '../components/EmptyState';
import { ScanButton } from '../components/ScanButton';
import './Cart.css';

/**
 * Cart / Order Preview — Figma `88:8164`, band 4 ("Adding customer to an order").
 *
 * Line items read the shared cart state, so quantities and prices here are the same
 * records the Sales Point wrote. Nothing about a product is copied into the cart.
 */
type CartProps = {
  lines: readonly CartLine[];
  /** Set from More options > Apply discount; on the order, not on any line. */
  orderDiscount?: Discount;
  onClose: () => void;
  onQtyChange: (productId: string, qty: number) => void;
  /** Opens the Quantity sheet over this line. */
  onEditQuantity: (productId: string) => void;
  /** Opens Item details. Not designed which control opens it; the name does. */
  onOpenDetails: (productId: string) => void;
  onRemove: (productId: string) => void;
  onCheckout: () => void;
  onQueue: () => void;
  /** Queue order is with the mock API: the button spins in place. */
  queueing?: boolean;
  onAddCustomer: () => void;
  onMoreOptions: () => void;
  onClearAll: () => void;
  /** Bumped to clear the cart from outside — More options — through the same exit
      the title-bar trash uses. */
  clearRequest?: number;
  /** Set once a customer is picked in the Select customer sheet. */
  customer: Customer | null;
  onRemoveCustomer: () => void;
  /** Lifted to the App so the dev toolbar can present the expanded state. */
  totalOpen: boolean;
  onToggleTotal: () => void;
  /** "docked": the Order Preview under the scanner's camera (`88:19506`, `88:19584`) —
      an expand control where the close was, no order total, a fixed body. The same
      Cart, so the lines, the customer and every sheet it opens are shared. */
  mode?: 'full' | 'docked';
  /** Docked only: grows into the full Cart (`88:19119`). */
  onExpand?: () => void;
  /** The empty Cart's scan button (`88:19466`). */
  onScan?: () => void;
};

export function Cart({
  lines, orderDiscount, onClose, onQtyChange, onEditQuantity, onOpenDetails, onRemove, onCheckout, onQueue, queueing = false, onAddCustomer,
  onMoreOptions, onClearAll, clearRequest = 0, customer, onRemoveCustomer, totalOpen, onToggleTotal,
  mode = 'full', onExpand, onScan,
}: CartProps) {
  const docked = mode === 'docked';
  const empty = lines.length === 0;
  const reducedMotion = useReducedMotion();
  /* A removed line collapses before it leaves the state, so nothing cuts. Its
     product id is held here for the length of the exit, then the removal lands. */
  const [leaving, setLeaving] = useState<readonly string[]>([]);
  const leave = (ids: readonly string[], then: () => void) => {
    setLeaving((l) => [...l, ...ids]);
    setTimeout(() => { then(); setLeaving((l) => l.filter((x) => !ids.includes(x))); },
      duration(DURATION.base, reducedMotion));
  };
  const lineRefs = useRef(new Map<string, HTMLLIElement>());
  const clearAll = () => leave(lines.map((l) => l.productId), onClearAll);
  const lastClear = useRef(clearRequest);
  useEffect(() => {
    if (clearRequest === lastClear.current) return;
    lastClear.current = clearRequest;
    clearAll();
  });
  return (
    <div
      className="cart"
      data-total={totalOpen ? 'on' : 'off'}
      data-mode={mode}
      data-empty={empty ? 'on' : 'off'}
      style={{
        '--order-total-ms': `${duration(DURATION.base, reducedMotion)}ms`,
        '--order-total-easing': totalOpen ? EASING.out : EASING.in,
      } as React.CSSProperties}
    >
      <header className="cart__titleBar">
        <div className="cart__titleLeft">
          {/* One control in both modes: the frames put expand (docked) and close (full)
              in the same 40px slot, so the glyphs cross-fade as the panel grows. */}
          <button type="button" className="closeButton cart__lead" onClick={docked ? onExpand : onClose}
            aria-label={docked ? 'Expand order preview' : 'Close order preview'}>
            <span className="cart__leadGlyph" data-on={docked ? 'on' : 'off'}><Icon name="expand-01" /></span>
            <span className="cart__leadGlyph" data-on={docked ? 'off' : 'on'}><Icon name="x-close" /></span>
          </button>
          <h1 className="cart__title">Order Preview</h1>
        </div>
        <div className="cart__titleActions">
          <button type="button" className="cart__iconButton" onClick={onMoreOptions} aria-label="More options">
            <Icon name="dots-horizontal" />
          </button>
          <button type="button" className="cart__iconButton" onClick={clearAll} aria-label="Clear order">
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
        {/* The empty Cart (`88:16199`, `88:19449`) and the empty scanner (`88:19506`)
            draw no customer row; it returns with the first line. A customer already
            attached keeps it, so they can still be removed. */}
        {(!empty || customer) && (
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
            <span key={customer?.id ?? 'empty'} className="addCustomer__label">{customer ? customer.name : 'Add customer'}</span>

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
        )}

        {empty ? (
          docked
            ? <EmptyState key="scan" className="cart__empty" icon="shopping-cart-40" title="Scan barcode or text"
                body="Align the barcode or product name within the frame." />
            : <EmptyState key="cart" className="cart__empty" icon="shopping-cart-40"
                body={<>Your cart is empty.<br />Items you add to cart will appear here.</>} />
        ) : (
          <ul className="cart__lines">
            {lines.map((line) => {
              const product = productFor(line);
              return (
                <li
                  key={line.productId}
                  className="cartLine"
                  ref={(el) => { if (el) lineRefs.current.set(line.productId, el); else lineRefs.current.delete(line.productId); }}
                  data-leaving={leaving.includes(line.productId) || undefined}
                  // The collapse starts from the row's real height.
                  style={{ '--line-h': `${lineRefs.current.get(line.productId)?.offsetHeight ?? 110}px` } as React.CSSProperties}
                >
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
                        onChange={(next) => (next <= 0
                          ? leave([line.productId], () => onQtyChange(line.productId, next))
                          : onQtyChange(line.productId, next))}
                        onValuePress={() => onEditQuantity(line.productId)}
                      />
                    </div>
                  </div>
                  <div className="cartLine__trailing">
                    <button
                      type="button"
                      className="cartLine__remove"
                      onClick={() => leave([line.productId], () => onRemove(line.productId))}
                      aria-label={`Remove ${product.name}`}
                    >
                      <Icon name="x-circle" />
                    </button>
                    {/* Line GROSS, not unit price and not net of discount: the lines then
                        add up to the Subtotal on screen, and discounts show once, in the
                        footer breakdown. The frame shows ₦10,000 on one row and ₦1,000 on
                        five others at the same quantity, which reconciles with nothing. */}
                    <span className="cartLine__price"><AnimatedText value={formatPrice(lineGross(line))} /></span>
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
        {/* Docked, the total folds away: the scanner's footer is the buttons alone. */}
        <div className="cart__totalSlot">
          <div className="cart__totalClip">
            <OrderTotal totals={totals(lines, orderDiscount)} open={totalOpen} onToggle={onToggleTotal} />
          </div>
        </div>
        <div className="cart__actions">
          <button type="button" className="cart__checkout" onClick={onCheckout} disabled={lines.length === 0}>
            <span className="cart__checkoutLabel">Checkout (<AnimatedText value={String(lines.length)} />)</span>
            <Icon name="chevron-right" />
          </button>
          <button type="button" className="cart__queue" onClick={onQueue} disabled={lines.length === 0 || queueing}
            data-busy={queueing ? 'on' : 'off'} aria-busy={queueing}>
            <span className="cart__queueLabel" aria-hidden={queueing}>Queue order</span>
            <span className="buttonSpinner cart__queueSpinner" aria-hidden="true" />
            {queueing && <span className="visuallyHidden">Queueing…</span>}
          </button>
        </div>
      </div>

      {empty && !docked && onScan && <ScanButton className="cart__scan" onPress={onScan} />}
    </div>
  );
}
